import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/lib/supabase/chat-service'
import { OpenRouterClient } from '@/lib/api/openrouter'
import { useOptimizedStreaming } from './useOptimizedStreaming'
import { useReasoningSettings } from '@/stores/ReasoningStore'
import { useRateLimit } from './useRateLimit'
import { rateLimitService } from '@/lib/services/rate-limit-service'
import type { FileAttachment, ImageContent, FileContent, MessageContent } from '@/lib/types'

export function useSupabaseChatCompletion(apiKey: string | null, chatId: string | null) {
  const queryClient = useQueryClient()
  const [client, setClient] = useState<OpenRouterClient | null>(null)
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { processStream, cleanup } = useOptimizedStreaming()
  const { getReasoningConfig } = useReasoningSettings()
  const { executeWithRateLimit, handleRateLimitError } = useRateLimit({
    showToasts: true,
    autoRetry: true,
  })

  // Initialize the client when API key is provided
  useEffect(() => {
    if (apiKey) {
      const newClient = new OpenRouterClient(apiKey)
      setClient(newClient)

      // Validate API key
      newClient.validateApiKey().then(isValid => {
        setIsApiKeyValid(isValid)
      }).catch(() => {
        setIsApiKeyValid(false)
      })
    } else {
      setClient(null)
      setIsApiKeyValid(null)
    }
  }, [apiKey])

  // Mutation for sending messages and streaming responses
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      modelId,
      webSearchEnabled = false,
      attachments = []
    }: {
      content: string
      modelId: string
      webSearchEnabled?: boolean
      attachments?: FileAttachment[]
    }) => {
      console.log('useSupabaseChatCompletion: Starting completion for:', content, 'modelId:', modelId, 'webSearch:', webSearchEnabled, 'attachments:', attachments.length)
      if (!client) throw new Error("API client not initialized")
      if (!isApiKeyValid) throw new Error("Invalid API key")
      if (!chatId) throw new Error("No chat ID provided")

      // Get chat with messages for context
      const chat = await chatService.getChat(chatId)
      if (!chat) throw new Error("Chat not found")

      // Find the latest incomplete assistant message (placeholder created by ChatInput)
      console.log('useSupabaseChatCompletion: Looking for incomplete assistant messages in:', chat.messages.length, 'messages')
      const assistantMessage = chat.messages
        .filter(msg => msg.role === 'assistant' && !msg.is_complete)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      console.log('useSupabaseChatCompletion: Found assistant message:', assistantMessage?.id, 'content:', assistantMessage?.content)

      if (!assistantMessage) {
        console.error('useSupabaseChatCompletion: No incomplete assistant message found. Available messages:',
          chat.messages.map(m => ({ role: m.role, content: m.content, is_complete: m.is_complete })))
        throw new Error("No incomplete assistant message found. Make sure ChatInput creates a placeholder first.")
      }

      // Helper function to convert file attachments to OpenRouter content format
      const convertAttachmentsToContent = (attachments: FileAttachment[]): (ImageContent | FileContent)[] => {
        return attachments.map(attachment => {
          if (attachment.type === 'image') {
            return {
              type: 'image_url',
              image_url: {
                url: attachment.data
              }
            } as ImageContent;
          } else {
            return {
              type: 'file',
              file: {
                filename: attachment.name,
                file_data: attachment.data
              }
            } as FileContent;
          }
        });
      };

      // Extract messages for the API request (exclude the pending assistant message)
      const messages = chat.messages
        .filter(msg => msg.id !== assistantMessage.id && msg.content.trim() !== '')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(msg => {
          // Handle messages with attachments
          if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
            const messageAttachments = msg.attachments as FileAttachment[];
            const attachmentContent = convertAttachmentsToContent(messageAttachments);

            // Create content array with text and attachments
            const contentArray: (MessageContent | ImageContent | FileContent)[] = [];

            // Add text content if present
            if (msg.content.trim()) {
              contentArray.push({
                type: 'text',
                text: msg.content
              } as MessageContent);
            }

            // Add attachment content
            contentArray.push(...attachmentContent);

            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: contentArray,
            };
          } else {
            // Simple text message
            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
            };
          }
        })
      
      // Set up streaming with reasoning-aware token limits
      const reasoningConfig = getReasoningConfig(modelId)

      // Increase token limit when reasoning is enabled to account for reasoning tokens
      // Increased base limit from 1000 to 2000 to prevent message cut-offs
      const baseTokenLimit = 2000
      const maxTokens = reasoningConfig?.enabled
        ? Math.min(baseTokenLimit + (reasoningConfig.max_tokens || 4000), 8000) // Allow more tokens for reasoning
        : baseTokenLimit

      // Prepare web search configuration
      let webSearchConfig = {}
      if (webSearchEnabled) {
        // Use the plugin approach for web search with default settings
        webSearchConfig = {
          plugins: [{
            id: 'web' as const,
            max_results: 5,
            search_prompt: `A web search was conducted on ${new Date().toLocaleDateString()}. Incorporate the following web search results into your response. IMPORTANT: Cite them using markdown links named using the domain of the source. Example: [nytimes.com](https://nytimes.com/some-page).`
          }]
        }
      }

      // Create abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Execute streaming request with rate limit handling
      const stream = await executeWithRateLimit(async () => {
        return await client.streamChatCompletion({
          model: modelId,
          messages,
          stream: true,
          max_tokens: maxTokens,
          temperature: 0.7,
          ...(reasoningConfig && { reasoning: reasoningConfig }),
          ...webSearchConfig,
        }, abortController.signal)
      }, { maxRetries: 3 })
      
      // Use optimized streaming with aggressive buffering for smooth animation
      const generationId = await processStream(stream, {
        chatId,
        messageId: assistantMessage.id,
        bufferSize: 2, // Smaller buffer for more responsive streaming
        bufferTimeMs: 60, // Faster flush for smoother animation
        onChunk: (content, isComplete) => {
          // Immediate UI feedback through optimistic updates (this makes streaming smooth)
          queryClient.setQueryData(['chat', chatId], (oldData: any) => {
            if (!oldData) return oldData

            return {
              ...oldData,
              messages: oldData.messages.map((msg: any) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      content,
                      is_complete: isComplete,
                      // Mark as optimistic update to prevent conflicts with real-time sync
                      _streaming_update: !isComplete,
                      _last_update: Date.now()
                    }
                  : msg
              )
            }
          })
        }
      })
      
      return {
        assistantMessageId: assistantMessage.id,
        generationId,
      }
    },
    onSuccess: () => {
      // Clear abort controller on success
      abortControllerRef.current = null
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      queryClient.invalidateQueries({ queryKey: ['user-chats'] })
    },
    onError: async (error: any) => {
      // Clear abort controller on error
      abortControllerRef.current = null

      // Don't show error for user-initiated cancellation
      if (error.name === 'AbortError') {
        console.log('Chat completion cancelled by user')
        return
      }

      console.error("Error sending message:", error)

      // Cleanup any pending buffers
      cleanup()

      // Handle rate limit errors specifically
      if (rateLimitService.isRateLimitError(error)) {
        await handleRateLimitError(error)
      } else {
        // Handle other specific OpenRouter errors
        if (error.message?.includes('402')) {
          console.error("OpenRouter Credits Error: Insufficient credits or token limit exceeded")
        } else if (error.message?.includes('401')) {
          console.error("OpenRouter Auth Error: Invalid API key")
        } else if (error.status === 503) {
          console.error("OpenRouter Service Error: Service temporarily unavailable")
        }
      }
    }
  })

  // Function to resume an incomplete message stream
  const resumeMessageStream = useCallback(async (
    messageId: string, 
    generationId: string
  ) => {
    if (!client) throw new Error("API client not initialized")
    if (!generationId) throw new Error("Generation ID is required to resume")
    if (!chatId) throw new Error("No chat ID provided")

    try {
      const stream = await client.resumeGeneration(generationId)
      const reader = stream.getReader()
      let assistantContent = ''
      
      // Get current message content
      const chat = await chatService.getChat(chatId)
      const message = chat?.messages.find(m => m.id === messageId)
      if (message) {
        assistantContent = message.content
      }
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // For resume generation, the value might be raw bytes, so we need to handle both cases
        let chunk: any
        if (typeof value === 'string') {
          // Already a string
          chunk = value
        } else if (value instanceof Uint8Array) {
          // Raw bytes - decode and parse
          const text = new TextDecoder().decode(value)
          const lines = text.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                chunk = JSON.parse(data)
                break // Process the first valid chunk
              } catch (parseError) {
                console.error('Error parsing resume chunk:', parseError)
                continue
              }
            }
          }
        } else {
          // Already parsed object
          chunk = value
        }

        if (!chunk) continue

        if (chunk.choices?.[0]?.delta?.content) {
          assistantContent += chunk.choices[0].delta.content

          await chatService.updateMessage(messageId, {
            content: assistantContent
          })

          queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
        }

        if (chunk.choices?.[0]?.finish_reason) {
          await chatService.updateMessage(messageId, {
            is_complete: true
          })
          queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
          break
        }
      }
    } catch (error) {
      console.error(`Failed to resume message ${messageId}:`, error)
    }
  }, [client, chatId, queryClient])

  // Handle resuming incomplete messages when the component mounts
  useEffect(() => {
    if (!client || !chatId) return
    
    const resumeIncompleteMessages = async () => {
      try {
        const chat = await chatService.getChat(chatId)
        if (!chat) return
        
        const incompleteMessages = chat.messages.filter(
          message => message.role === 'assistant' && 
                    !message.is_complete && 
                    message.generation_id
        )
        
        for (const message of incompleteMessages) {
          if (message.generation_id) {
            resumeMessageStream(message.id, message.generation_id)
              .catch(error => console.error(`Failed to resume message ${message.id}:`, error))
          }
        }
      } catch (error) {
        console.error('Error resuming incomplete messages:', error)
      }
    }
    
    resumeIncompleteMessages()
  }, [client, chatId, resumeMessageStream])

  // Stop generation function
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return {
    sendMessage: sendMessageMutation.mutate,
    isLoading: sendMessageMutation.isPending,
    isGenerating: sendMessageMutation.isPending,
    stopGeneration,
    isApiKeyValid,
    error: sendMessageMutation.error,
  }
}
