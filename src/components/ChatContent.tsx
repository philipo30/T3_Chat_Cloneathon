"use client"

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useApiKey } from "@/hooks/useApiKey";
import { useSupabaseChat } from "@/hooks/useSupabaseChats";
import { useSupabaseChatCompletion } from "@/hooks/useSupabaseChatCompletion";
import { useQuery } from "@tanstack/react-query";
import type { OpenRouterModel } from "@/lib/types";

async function fetchModels(): Promise<OpenRouterModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) throw new Error('Failed to fetch models');
  const data = await response.json();
  return data.data;
}

interface ChatContentProps {
  chatId: string;
  onApiKeyModalOpen: () => void;
}

export const ChatContent: React.FC<ChatContentProps> = ({ chatId, onApiKeyModalOpen }) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

  const { apiKey } = useApiKey();
  const { chat, isLoadingChat, chatError } = useSupabaseChat(chatId);
  const { sendMessage, isLoading, error: completionError } = useSupabaseChatCompletion(apiKey, chatId);

  const { data: allModels } = useQuery<OpenRouterModel[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
  });

  const messages = useMemo(() => {
    if (!chat?.messages) return [];
    return [...chat.messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [chat?.messages]);

  const modelName = useMemo(() => {
    if (!allModels || !chat?.model_id) return chat?.model_id || 'Unknown Model';
    const model = allModels.find(m => m.id === chat.model_id);
    return model?.name || chat.model_id;
  }, [allModels, chat?.model_id]);

  // Handle chat not found
  useEffect(() => {
    if (chatError || (chat === null && !isLoadingChat)) {
      router.push('/');
    }
  }, [chatError, chat, isLoadingChat, router]);

  // Show welcome screen if no messages
  useEffect(() => {
    setIsWelcomeVisible(messages.length === 0 && !isLoadingChat);
  }, [messages.length, isLoadingChat]);

  // Auto-trigger AI completion for new chats that have incomplete assistant messages
  useEffect(() => {
    if (!chat || !messages.length || isLoading || completionError) return;

    // Find incomplete assistant messages that need completion
    const incompleteAssistantMessages = messages.filter(m =>
      m.role === 'assistant' &&
      !m.is_complete &&
      (m.content === '...' || m.content === '')
    );

    // If there's an incomplete assistant message, find the user message before it
    if (incompleteAssistantMessages.length > 0) {
      const incompleteMessage = incompleteAssistantMessages[0];
      const userMessages = messages.filter(m =>
        m.role === 'user' &&
        new Date(m.created_at) < new Date(incompleteMessage.created_at)
      );

      const lastUserMessage = userMessages.pop();
      if (lastUserMessage) {
        console.log('Auto-triggering AI completion for incomplete message:', lastUserMessage.content);
        sendMessage({
          content: lastUserMessage.content,
          modelId: lastUserMessage.model || chat.model_id,
        });
      }
    }
  }, [messages, chat, sendMessage, isLoading, completionError]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apiKey) {
      onApiKeyModalOpen();
      return;
    }
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    setIsWelcomeVisible(false);
  };

  if (isLoadingChat) {
    return (
      <div className="absolute inset-0 top-0 w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <>
      {/* Main chat content */}
      <div className="absolute inset-0 top-7 w-full">
        {/* Smooth gradient shadow overlay at top edge - matches chat input width */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-12 chat-content-fade-overlay" />

        <div className="absolute inset-0 overflow-auto chat-scrollbar pb-36 pt-3.5 scrollbar-gutter-stable-both-edges">
          {/* Chat messages container */}
          <div
            role="log"
            aria-label="Chat messages"
            aria-live="polite"
            className="flex flex-col mx-auto max-w-3xl pb-10 px-4 pt-10 w-full"
          >
            {isWelcomeVisible ? (
              <WelcomeScreen
                isVisible={isWelcomeVisible}
                onQuestionClick={handleQuestionClick}
              />
            ) : (
              <>
                {messages.map(message => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))}

                {/* Show error message if there's a completion error */}
                {completionError && (
                  <div className="mx-auto max-w-3xl px-4 py-2">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-200">
                      <p className="text-sm font-medium">AI Response Error</p>
                      <p className="text-xs mt-1 opacity-80">
                        {completionError.message?.includes('402')
                          ? 'Insufficient OpenRouter credits. Please add credits to your account or try a different model.'
                          : completionError.message?.includes('401')
                          ? 'Invalid OpenRouter API key. Please check your API key settings.'
                          : 'Failed to get AI response. Please try again.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat input */}
      <ChatInput
        value={inputValue}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        apiKey={apiKey}
        chatId={chatId}
      />
    </>
  );
};
