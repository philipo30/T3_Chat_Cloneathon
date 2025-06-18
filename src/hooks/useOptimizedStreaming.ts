import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/lib/supabase/chat-service'
import type { ChatCompletionChunk, WebSearchAnnotation } from '@/lib/types'
import { streamingMonitor } from '@/lib/performance/streaming-metrics'

interface StreamingOptions {
  chatId: string
  messageId: string
  onChunk?: (content: string, isComplete: boolean) => void
  bufferSize?: number
  bufferTimeMs?: number
}

interface StreamBuffer {
  content: string
  reasoning: string
  chunks: string[]
  reasoningChunks: string[]
  annotations: WebSearchAnnotation[]
  lastUpdate: number
  timeoutId?: NodeJS.Timeout
}

/**
 * Optimized streaming hook that implements:
 * - Chunk buffering to reduce database writes
 * - Debounced updates for better performance
 * - Efficient React Query invalidation
 * - Proper error handling and cleanup
 */
export function useOptimizedStreaming() {
  const queryClient = useQueryClient()
  const bufferRef = useRef<Map<string, StreamBuffer>>(new Map())
  
  const flushBuffer = useCallback(async (
    messageId: string, 
    chatId: string, 
    isComplete = false
  ) => {
    const buffer = bufferRef.current.get(messageId)
    if (!buffer) return
    
    try {
      // Track database write for performance monitoring
      streamingMonitor.recordDbWrite(messageId)

      // Update message in database with content, reasoning, and annotations
      const updateData: any = {
        content: buffer.content,
        ...(isComplete && { is_complete: true })
      }

      // Include reasoning if available
      if (buffer.reasoning) {
        updateData.reasoning = buffer.reasoning
      }

      // Include annotations if available
      if (buffer.annotations.length > 0) {
        updateData.annotations = buffer.annotations
      }

      await chatService.updateMessage(messageId, updateData)

      // Track render for performance monitoring
      streamingMonitor.recordRender(messageId)

      // Optimized query update - preserve optimistic updates during streaming
      queryClient.setQueryData(['chat', chatId], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          messages: oldData.messages.map((msg: any) =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: buffer.content,
                  reasoning: buffer.reasoning || msg.reasoning,
                  annotations: buffer.annotations.length > 0 ? buffer.annotations : msg.annotations,
                  is_complete: isComplete,
                  // Add timestamp to help identify fresh optimistic updates
                  _optimistic_update: Date.now()
                }
              : msg
          )
        }
      })

      // Set a longer stale time for streaming messages to prevent premature refetching
      if (!isComplete) {
        queryClient.setQueryDefaults(['chat', chatId], {
          staleTime: 1000 * 60 * 2, // 2 minutes during streaming
        })
      } else {
        // Reset to normal stale time when complete
        queryClient.setQueryDefaults(['chat', chatId], {
          staleTime: 1000 * 60 * 5, // 5 minutes when complete
        })
      }

      // Clear timeout if exists
      if (buffer.timeoutId) {
        clearTimeout(buffer.timeoutId)
      }

      // Remove buffer if complete, otherwise reset timeout
      if (isComplete) {
        bufferRef.current.delete(messageId)
        // Finish performance tracking
        streamingMonitor.finishTracking(messageId)
      } else {
        buffer.lastUpdate = Date.now()
        buffer.timeoutId = undefined
      }

    } catch (error) {
      console.error('Error flushing stream buffer:', error)
    }
  }, [queryClient])
  
  const processChunk = useCallback((
    chunk: ChatCompletionChunk,
    options: StreamingOptions
  ) => {
    const { chatId, messageId, onChunk, bufferSize = 3, bufferTimeMs = 80 } = options
    const content = chunk.choices?.[0]?.delta?.content
    const reasoning = chunk.choices?.[0]?.delta?.reasoning
    const annotations = chunk.choices?.[0]?.delta?.annotations

    if (!content && !reasoning && !annotations) return

    // Get or create buffer for this message
    let buffer = bufferRef.current.get(messageId)
    if (!buffer) {
      buffer = {
        content: '',
        reasoning: '',
        chunks: [],
        reasoningChunks: [],
        annotations: [],
        lastUpdate: Date.now()
      }
      bufferRef.current.set(messageId, buffer)
    }

    // Track chunk for performance monitoring
    if (content) {
      streamingMonitor.recordChunk(messageId, content.length)
      // Add content to buffer
      buffer.content += content
      buffer.chunks.push(content)
    }

    // Handle reasoning tokens
    if (reasoning) {
      buffer.reasoning += reasoning
      buffer.reasoningChunks.push(reasoning)
    }

    // Handle web search annotations
    if (annotations && annotations.length > 0) {
      buffer.annotations.push(...annotations)
    }

    // Call onChunk callback for immediate UI feedback (this provides smooth streaming)
    onChunk?.(buffer.content, false)

    // Clear existing timeout
    if (buffer.timeoutId) {
      clearTimeout(buffer.timeoutId)
    }

    // More aggressive buffering for smoother streaming
    const shouldFlushBySize = buffer.chunks.length >= bufferSize || buffer.reasoningChunks.length >= bufferSize
    const shouldFlushByTime = Date.now() - buffer.lastUpdate >= bufferTimeMs

    if (shouldFlushBySize || shouldFlushByTime) {
      // Flush immediately
      flushBuffer(messageId, chatId)
    } else {
      // Set timeout for delayed flush (shorter timeout for more responsive feel)
      buffer.timeoutId = setTimeout(() => {
        flushBuffer(messageId, chatId)
      }, bufferTimeMs)
    }
  }, [flushBuffer])
  
  const processStream = useCallback(async (
    stream: ReadableStream<ChatCompletionChunk>,
    options: StreamingOptions
  ) => {
    const { chatId, messageId, onChunk } = options
    const reader = stream.getReader()
    let generationId: string | undefined

    // Start performance tracking
    streamingMonitor.startTracking(messageId)

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          // Flush any remaining buffer and mark as complete
          await flushBuffer(messageId, chatId, true)
          onChunk?.(bufferRef.current.get(messageId)?.content || '', true)
          break
        }
        
        const chunk = value
        
        // Extract generation ID from first chunk
        if (!generationId && chunk.id) {
          generationId = chunk.id
          await chatService.updateMessage(messageId, {
            generation_id: generationId
          })
        }
        
        // Process the chunk
        processChunk(chunk, options)
        
        // Check for completion
        if (chunk.choices?.[0]?.finish_reason) {
          await flushBuffer(messageId, chatId, true)
          onChunk?.(bufferRef.current.get(messageId)?.content || '', true)
          break
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error)
      // Ensure buffer is flushed even on error
      await flushBuffer(messageId, chatId, true)
      throw error
    } finally {
      reader.releaseLock()
    }
    
    return generationId
  }, [processChunk, flushBuffer])
  
  const cleanup = useCallback((messageId?: string) => {
    if (messageId) {
      const buffer = bufferRef.current.get(messageId)
      if (buffer?.timeoutId) {
        clearTimeout(buffer.timeoutId)
      }
      bufferRef.current.delete(messageId)
    } else {
      // Clear all buffers
      bufferRef.current.forEach(buffer => {
        if (buffer.timeoutId) {
          clearTimeout(buffer.timeoutId)
        }
      })
      bufferRef.current.clear()
    }
  }, [])
  
  return {
    processStream,
    cleanup
  }
}
