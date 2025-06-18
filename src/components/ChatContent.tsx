"use client"

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { RateLimitError } from "@/components/RateLimitError";
import { useApiKey } from "@/hooks/useApiKey";
import { useSupabaseChat } from "@/hooks/useSupabaseChats";
import { useSupabaseChatCompletion } from "@/hooks/useSupabaseChatCompletion";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { ScrollToBottomButton } from "@/components/ScrollToBottomButton";

// Removed unused imports and functions

interface ChatContentProps {
  chatId: string;
  onApiKeyModalOpen: () => void;
}

export const ChatContent: React.FC<ChatContentProps> = ({ chatId, onApiKeyModalOpen }) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { apiKey } = useApiKey();
  const { chat, isLoadingChat, chatError } = useSupabaseChat(chatId);
  const { sendMessage, isLoading, error: completionError } = useSupabaseChatCompletion(apiKey, chatId);

  // Models query removed since it's not used in this component

  const messages = useMemo(() => {
    if (!chat?.messages) return [];

    // Deduplicate messages by ID to prevent React key conflicts
    const uniqueMessages = chat.messages.reduce((acc, message) => {
      const existingIndex = acc.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        // Keep the most recent version (higher created_at or updated_at)
        const existing = acc[existingIndex];
        const messageTime = new Date(message.updated_at || message.created_at).getTime();
        const existingTime = new Date(existing.updated_at || existing.created_at).getTime();

        console.log(`Duplicate message detected: ${message.id}, keeping ${messageTime > existingTime ? 'newer' : 'existing'} version`);

        if (messageTime > existingTime) {
          acc[existingIndex] = message;
        }
      } else {
        acc.push(message);
      }
      return acc;
    }, [] as typeof chat.messages);

    // Sort by creation time
    return uniqueMessages.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [chat?.messages]);

  // Determine if AI is currently streaming
  const isStreaming = useMemo(() => {
    if (!messages.length) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === 'assistant' && !lastMessage.is_complete;
  }, [messages]);

  // Auto-scroll hook for chat behavior
  const { scrollRef, showScrollButton, scrollToBottom, onMessageSent } = useChatAutoScroll({
    messages,
    isStreaming,
    isLoading,
    enabled: true
  });

  // Model name lookup removed since it's not used in this component

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

  // Auto-trigger AI completion for new chats created from homepage
  // This only runs once when a new chat loads with incomplete messages
  useEffect(() => {
    if (!chat || !messages.length || isLoading || completionError) return;

    // Only trigger for new chats that have exactly 2 messages (user + incomplete assistant)
    // and the assistant message has no generation_id (indicating it's a new placeholder)
    if (messages.length === 2) {
      const [userMessage, assistantMessage] = messages;

      if (
        userMessage?.role === 'user' &&
        assistantMessage?.role === 'assistant' &&
        !assistantMessage.is_complete &&
        !assistantMessage.generation_id &&
        assistantMessage.content === '...'
      ) {
        // Read web search preference from localStorage
        const webSearchEnabled = localStorage.getItem('webSearchEnabled') === 'true';
        console.log('Auto-triggering AI completion for new chat:', userMessage.content, 'with web search:', webSearchEnabled);
        sendMessage({
          content: userMessage.content,
          modelId: userMessage.model || chat.model_id,
          webSearchEnabled,
        });
      }
    }
  }, [messages, chat, sendMessage, isLoading, completionError]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Enhanced typing detection for chat pages too
    if (value.trim().length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        // Hide welcome screen if it's visible and user starts typing
        if (isWelcomeVisible) {
          setTimeout(() => {
            setIsWelcomeVisible(false);
          }, 150);
        }
      }
    } else {
      setIsTyping(false);
      // Show welcome screen again if no messages and user clears input
      if (messages.length === 0) {
        setTimeout(() => {
          setIsWelcomeVisible(true);
        }, 100);
      }
    }
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

        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-auto chat-scrollbar pb-36 pt-3.5 scrollbar-gutter-stable-both-edges"
        >
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
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.id}-${index}`}
                    message={message}
                  />
                ))}

                {/* Show error message if there's a completion error */}
                {completionError && (
                  <div className="mx-auto max-w-3xl px-4 py-2">
                    <RateLimitError
                      error={completionError}
                      onRetry={() => {
                        // Retry the last message if possible
                        if (messages.length > 0) {
                          const lastUserMessage = [...messages]
                            .reverse()
                            .find(msg => msg.role === 'user');

                          if (lastUserMessage) {
                            sendMessage({
                              content: lastUserMessage.content,
                              modelId: lastUserMessage.model || chat?.model_id || '',
                              webSearchEnabled: localStorage.getItem('webSearchEnabled') === 'true',
                            });
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottomButton
        visible={showScrollButton}
        onClick={scrollToBottom}
      />

      {/* Chat input */}
      <ChatInput
        value={inputValue}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        apiKey={apiKey}
        chatId={chatId}
        onMessageSent={onMessageSent}
      />
    </>
  );
};
