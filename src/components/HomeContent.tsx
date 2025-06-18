"use client"

import React, { useState, useEffect, useMemo } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { useApiKey } from "@/hooks/useApiKey";
import { useChatStore } from "@/lib/store/chatStore";
import { useQuery } from "@tanstack/react-query";
import { type Message } from "@/lib/supabase/database.types";
import { type LegacyMessage } from "@/lib/types";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { ScrollToBottomButton } from "@/components/ScrollToBottomButton";

interface HomeContentProps {
  onApiKeyModalOpen: () => void;
}

// Helper function to transform LegacyMessage to Supabase Message format
const transformLegacyMessage = (legacyMessage: LegacyMessage): Message => {
  return {
    id: legacyMessage.id,
    chat_id: '', // Legacy messages don't have chat_id, use empty string
    role: legacyMessage.role,
    content: legacyMessage.content,
    model: null, // Legacy messages don't have model info
    created_at: legacyMessage.createdAt.toISOString(),
    is_complete: legacyMessage.isComplete ?? true,
    generation_id: legacyMessage.generationId ?? null,
    reasoning: null, // Legacy messages don't have reasoning
    annotations: null, // Legacy messages don't have annotations
    attachments: null, // Legacy messages don't have attachments
  };
};

export const HomeContent: React.FC<HomeContentProps> = ({ onApiKeyModalOpen }) => {
  const [inputValue, setInputValue] = useState("");
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const { apiKey } = useApiKey();

  // Get current session and messages from store
  const { currentSessionId, sessions } = useChatStore();
  const currentSession = sessions.find(session => session.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const modelId = currentSession?.modelId;

  // Fetch models to get the model name
  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data.data;
    },
    // Only fetch models if we have an API key
    enabled: !!apiKey,
  });

  const modelName = models?.find((m: { id: string; name: string }) => m.id === modelId)?.name || modelId;

  // Determine if AI is currently streaming
  const isStreaming = useMemo(() => {
    if (!messages.length) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === 'assistant' && !lastMessage.isComplete;
  }, [messages]);

  // Auto-scroll hook for chat behavior
  const { scrollRef, showScrollButton, scrollToBottom, onMessageSent } = useChatAutoScroll({
    messages,
    isStreaming,
    isLoading: false, // HomeContent doesn't have loading state
    enabled: true
  });

  // Hide welcome screen if we have messages
  useEffect(() => {
    if (messages.length > 0) {
      setIsWelcomeVisible(false);
    }
  }, [messages.length]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Enhanced typing detection with smooth transitions
    if (value.trim().length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        // Small delay before hiding welcome screen for smoother UX
        setTimeout(() => {
          setIsWelcomeVisible(false);
        }, 150);
      }
    } else if (messages.length === 0) {
      setIsTyping(false);
      // Slight delay before showing welcome screen again
      setTimeout(() => {
        setIsWelcomeVisible(true);
      }, 100);
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

  return (
    <>
      {/* Main chat content */}
      <div className="absolute inset-0 top-16">
        {/* Smooth gradient shadow overlay at top edge - matches chat input width */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-full max-w-3xl h-12 chat-content-fade-overlay" />

        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-auto chat-scrollbar pb-36 pt-3.5 scrollbar-gutter-stable-both-edges w-full"
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
              messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={transformLegacyMessage(message)}
                />
              ))
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
        onMessageSent={onMessageSent}
      />
    </>
  );
};
