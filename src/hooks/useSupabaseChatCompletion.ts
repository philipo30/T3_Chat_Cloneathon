import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/lib/supabase/chat-service'
import { OpenRouterClient } from '@/lib/api/openrouter'
import { useOptimizedStreaming } from './useOptimizedStreaming'
import { useReasoningSettings } from '@/stores/ReasoningStore'

export function useSupabaseChatCompletion(apiKey: string | null, chatId: string | null) {
  const queryClient = useQueryClient()
  const [client, setClient] = useState<OpenRouterClient | null>(null)
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null)
  const { processStream, cleanup } = useOptimizedStreaming()
  const { getReasoningConfig } = useReasoningSettings()

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
      modelId 
    }: { 
      content: string
      modelId: string
    }) => {
      console.log('useSupabaseChatCompletion: Starting completion for:', content, 'modelId:', modelId)
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

      // Extract messages for the API request (exclude the pending assistant message)
      const messages = chat.messages
        .filter(msg => msg.id !== assistantMessage.id && msg.content.trim() !== '')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      
      // Set up streaming with reasoning-aware token limits
      const reasoningConfig = getReasoningConfig()

      // Increase token limit when reasoning is enabled to account for reasoning tokens
      const baseTokenLimit = 1000
      const maxTokens = reasoningConfig?.enabled
        ? Math.min(baseTokenLimit + (reasoningConfig.max_tokens || 2000), 4000) // Allow more tokens for reasoning
        : baseTokenLimit

      const stream = await client.streamChatCompletion({
        model: modelId,
        messages,
        stream: true,
        max_tokens: maxTokens,
        temperature: 0.7,
        ...(reasoningConfig && { reasoning: reasoningConfig }),
      })
      
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
                  ? { ...msg, content, is_complete: isComplete }
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
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      queryClient.invalidateQueries({ queryKey: ['user-chats'] })
    },
    onError: (error: any) => {
      console.error("Error sending message:", error)

      // Cleanup any pending buffers
      cleanup()

      // Handle specific OpenRouter errors
      if (error.message?.includes('402')) {
        console.error("OpenRouter Credits Error: Insufficient credits or token limit exceeded")
        // You could show a user-friendly notification here
      } else if (error.message?.includes('401')) {
        console.error("OpenRouter Auth Error: Invalid API key")
      } else if (error.message?.includes('429')) {
        console.error("OpenRouter Rate Limit Error: Too many requests")
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

  return {
    sendMessage: sendMessageMutation.mutate,
    isLoading: sendMessageMutation.isPending,
    isApiKeyValid,
    error: sendMessageMutation.error,
  }
}
