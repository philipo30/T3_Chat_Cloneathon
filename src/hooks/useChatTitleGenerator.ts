import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TitleGenerationRequest,
  TitleGenerationResponse,
  TitleGenerationError
} from '@/lib/types';
import { useTitleGenerationSettings } from '@/stores/TitleGenerationStore';
import { chatService } from '@/lib/supabase/chat-service';

interface UseChatTitleGeneratorOptions {
  apiKey?: string | null; // API key to use for title generation
  onSuccess?: (response: TitleGenerationResponse) => void;
  onError?: (error: TitleGenerationError) => void;
  autoGenerate?: boolean; // Whether to automatically generate titles for new chats
}

interface GenerateTitleParams {
  prompt: string;
  chatId: string;
  messageId?: string;
  model?: string;
  maxLength?: number;
}

export function useChatTitleGenerator(options: UseChatTitleGeneratorOptions = {}) {
  const { apiKey } = options;
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings, shouldAutoGenerate } = useTitleGenerationSettings();

  // Mutation for title generation
  const titleGenerationMutation = useMutation({
    mutationFn: async (params: GenerateTitleParams): Promise<TitleGenerationResponse> => {
      if (!apiKey) {
        throw new Error('OpenRouter API key is required for title generation');
      }

      const request: TitleGenerationRequest = {
        prompt: params.prompt,
        chatId: params.chatId,
        messageId: params.messageId,
        model: params.model || settings.model,
        maxLength: params.maxLength || settings.maxLength,
      };

      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenRouter-API-Key': apiKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: TitleGenerationError = await response.json();
        throw new Error(errorData.error || 'Failed to generate title');
      }

      return await response.json();
    },
    onSuccess: async (data) => {
      // Update the database with the new title
      try {
        await chatService.updateChat(data.chatId, {
          title: data.title,
        });
      } catch (dbError) {
        console.error('Failed to update chat title in database:', dbError);
        // Continue with cache updates even if database update fails
      }

      // Update the chat in the query cache
      queryClient.setQueryData(['chat', data.chatId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            title: data.title,
          };
        }
        return oldData;
      });

      // Update the chats list in the query cache
      queryClient.setQueryData(['chats'], (oldData: any) => {
        if (Array.isArray(oldData)) {
          return oldData.map((chat: any) =>
            chat.id === data.chatId
              ? { ...chat, title: data.title }
              : chat
          );
        }
        return oldData;
      });

      // Call success callback if provided
      options.onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Title generation failed:', error);
      
      const errorData: TitleGenerationError = {
        error: error.message || 'Failed to generate title',
        code: 'GENERATION_FAILED',
      };
      
      options.onError?.(errorData);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Generate title function
  const generateTitle = useCallback(
    async (params: GenerateTitleParams) => {
      if (!apiKey) {
        console.warn('Cannot generate title: OpenRouter API key not available');
        return null;
      }

      if (!params.prompt?.trim()) {
        console.warn('Cannot generate title: Empty prompt');
        return null;
      }

      setIsGenerating(true);

      try {
        const result = await titleGenerationMutation.mutateAsync(params);
        return result;
      } catch (error) {
        console.error('Title generation error:', error);
        return null;
      }
    },
    [apiKey, titleGenerationMutation]
  );

  // Auto-generate title for new chats
  const autoGenerateTitle = useCallback(
    async (prompt: string, chatId: string, messageId?: string) => {
      if (!shouldAutoGenerate() || !options.autoGenerate) {
        return null;
      }

      return generateTitle({
        prompt,
        chatId,
        messageId,
      });
    },
    [generateTitle, options.autoGenerate, shouldAutoGenerate]
  );

  // Check if title generation is available
  const isAvailable = Boolean(apiKey);

  return {
    generateTitle,
    autoGenerateTitle,
    isGenerating: isGenerating || titleGenerationMutation.isPending,
    isAvailable,
    error: titleGenerationMutation.error,
    lastGeneratedTitle: titleGenerationMutation.data?.title,
    
    // Expose mutation state for advanced usage
    mutation: titleGenerationMutation,
  };
}

// Hook for batch title generation (useful for migrating existing chats)
export function useBatchTitleGenerator(apiKey?: string | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const generateTitlesForChats = useCallback(
    async (chats: Array<{ id: string; messages: Array<{ content: string; role: string }> }>) => {
      if (!apiKey) {
        throw new Error('OpenRouter API key is required');
      }

      setIsGenerating(true);
      setProgress({ current: 0, total: chats.length });

      const results: Array<{ chatId: string; title: string | null; error?: string }> = [];

      for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];
        setProgress({ current: i + 1, total: chats.length });

        try {
          // Find the first user message
          const firstUserMessage = chat.messages.find(msg => msg.role === 'user');
          
          if (!firstUserMessage?.content?.trim()) {
            results.push({ chatId: chat.id, title: null, error: 'No user message found' });
            continue;
          }

          const response = await fetch('/api/generate-title', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-OpenRouter-API-Key': apiKey,
            },
            body: JSON.stringify({
              prompt: firstUserMessage.content,
              chatId: chat.id,
            }),
          });

          if (response.ok) {
            const data: TitleGenerationResponse = await response.json();
            results.push({ chatId: chat.id, title: data.title });
          } else {
            const errorData: TitleGenerationError = await response.json();
            results.push({ chatId: chat.id, title: null, error: errorData.error });
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          results.push({ 
            chatId: chat.id, 
            title: null, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      setIsGenerating(false);
      return results;
    },
    [apiKey]
  );

  return {
    generateTitlesForChats,
    isGenerating,
    progress,
  };
}
