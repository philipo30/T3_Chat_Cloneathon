import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '@/lib/store/chatStore';
import { OpenRouterClient } from '@/lib/api/openrouter';
import type { Message, Role } from '@/lib/types';

export function useChatCompletion(apiKey: string | null) {
  const queryClient = useQueryClient();
  const [client, setClient] = useState<OpenRouterClient | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);

  const {
    addMessage,
    updateMessage,
    setMessageComplete,
    setGenerationId,
  } = useChatStore();

  // Initialize the client when API key is provided
  useEffect(() => {
    if (apiKey) {
      const newClient = new OpenRouterClient(apiKey);
      setClient(newClient);

      // Validate API key
      newClient.validateApiKey().then(isValid => {
        setIsApiKeyValid(isValid);
      }).catch(() => {
        setIsApiKeyValid(false);
      });
    } else {
      setClient(null);
      setIsApiKeyValid(null);
    }
  }, [apiKey]);

  // Mutation for sending messages and streaming responses
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      content, 
      modelId, 
      sessionId 
    }: { 
      content: string; 
      modelId: string; 
      sessionId?: string 
    }) => {
      if (!client) throw new Error("API client not initialized");
      if (!isApiKeyValid) throw new Error("Invalid API key");

      // Add user message to the store
      const userMessage = addMessage(content, 'user', sessionId);
      
      // Prepare and add the assistant's message (will be empty initially)
      const assistantMessage = addMessage('', 'assistant', sessionId);
      
      // Build request with conversation history
      const session = useChatStore.getState().sessions.find(s => 
        s.id === (sessionId || useChatStore.getState().currentSessionId)
      );
      
      if (!session) throw new Error("No session found");
      
      // Extract messages for the API request
      const messages = session.messages
        .filter(msg => msg.id !== assistantMessage.id) // Exclude the pending assistant message
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
      
      // Set up streaming
      const stream = await client.streamChatCompletion({
        model: modelId,
        messages,
        stream: true,
      });
      
      // Process the stream
      const reader = stream.getReader();
      let generationId: string | undefined;
      let assistantContent = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Mark message as complete
            setMessageComplete(assistantMessage.id, true, sessionId);
            break;
          }
          
          // Save the generation ID from the first chunk
          if (!generationId && value.id) {
            generationId = value.id;
            setGenerationId(assistantMessage.id, generationId, sessionId);
          }
          
          // Process the delta content
          const content = value.choices[0]?.delta?.content || '';
          if (content) {
            assistantContent += content;
            updateMessage(assistantMessage.id, assistantContent, false, generationId, sessionId);
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
        throw error;
      } finally {
        reader.releaseLock();
      }
      
      return {
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        generationId,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    }
  });

  // Function to resume an incomplete message stream
  const resumeMessageStream = useCallback(async (
    messageId: string, 
    generationId: string, 
    sessionId?: string
  ) => {
    if (!client) throw new Error("API client not initialized");
    if (!generationId) throw new Error("Generation ID is required to resume");

    try {
      // Get metadata to check if the generation was completed
      const metadata = await client.getGeneration(generationId);
      
      if (metadata.finish_reason) {
        // Generation was completed, mark the message as complete
        setMessageComplete(messageId, true, sessionId);
        return;
      }
      
      // TODO: Implement actual stream resumption once OpenRouter supports it
      // Currently, this is not directly supported by OpenRouter
      // We mark the message as complete for now
      setMessageComplete(messageId, true, sessionId);
      
    } catch (error) {
      console.error('Error resuming message:', error);
      throw error;
    }
  }, [client, setMessageComplete]);

  // Handle resuming incomplete messages when the component mounts
  useEffect(() => {
    if (!client) return;
    
    const sessions = useChatStore.getState().sessions;
    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.role === 'assistant' && !message.isComplete && message.generationId) {
          resumeMessageStream(message.id, message.generationId, session.id)
            .catch(error => console.error(`Failed to resume message ${message.id}:`, error));
        }
      });
    });
  }, [client, resumeMessageStream]);

  return {
    sendMessage: sendMessageMutation.mutate,
    isLoading: sendMessageMutation.isPending,
    isApiKeyValid,
    error: sendMessageMutation.error,
  };
} 