"use client"

import React, { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { useApiKey } from "@/hooks/useApiKey";
import { useChatStore } from "@/lib/store/chatStore";
import { useQuery } from "@tanstack/react-query";
import { type Message } from "@/lib/supabase/database.types";
import { type LegacyMessage } from "@/lib/types";

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
  };
};

export const HomeContent: React.FC<HomeContentProps> = ({ onApiKeyModalOpen }) => {
  const [inputValue, setInputValue] = useState("");
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);

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

  // Hide welcome screen if we have messages
  useEffect(() => {
    if (messages.length > 0) {
      setIsWelcomeVisible(false);
    }
  }, [messages.length]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    // Hide welcome screen when user starts typing
    if (value.trim().length > 0) {
      setIsWelcomeVisible(false);
    } else if (messages.length === 0) {
      setIsWelcomeVisible(true);
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

        <div className="absolute inset-0 overflow-auto chat-scrollbar pb-36 pt-3.5 scrollbar-gutter-stable-both-edges w-full">
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

      {/* Chat input */}
      <ChatInput
        value={inputValue}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        apiKey={apiKey}
      />
    </>
  );
};
