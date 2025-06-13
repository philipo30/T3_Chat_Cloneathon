import React, { memo } from 'react';
import { type Message } from '@/lib/supabase/database.types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GenerationMetadata } from './GenerationMetadata';
import { ReasoningDisplay } from './ReasoningDisplay';

interface ChatMessageProps {
  message: Message;
}

/**
 * Modern chat bubble component with optimized performance during streaming updates.
 * Features clean bubble design with user messages on right, AI messages on left.
 */
export const ChatMessage: React.FC<ChatMessageProps> = memo(({ message }) => {
  const isUser = message.role === 'user';
  const isComplete = message.is_complete !== false;
  const isStreaming = !isComplete && message.content.trim() !== '' && message.content.trim() !== '...';

  return (
    <div className={`flex w-full py-3 ${isUser ? 'justify-end' : 'justify-start'} ${isStreaming ? 'streaming-message' : ''}`}>
      {/* Invisible boundary container - prevents overflow beyond chat input width */}
      <div className="chat-message-boundary max-w-full overflow-hidden box-border" style={{ maxWidth: 'calc(100% - 8px)' }}>
        {/* Chat Bubble Container */}
        <div className={`
          relative
          rounded-2xl
          ${isUser
            ? 'max-w-[75%] px-3 py-2 bg-[rgb(var(--chat-bubble-user-bg))] text-[rgb(var(--chat-bubble-user-text))] rounded-br-md shadow-sm'
            : 'w-full px-4 py-3 text-[rgb(var(--chat-bubble-ai-text))] rounded-bl-md'
          }
          ${isStreaming ? 'chat-bubble-streaming' : ''}
        `}>
        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-center gap-1.5 mb-2 opacity-75">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-green-400">streaming</span>
          </div>
        )}

        {/* Message Content */}
        <div className="min-w-0 overflow-hidden w-full">
          {/* Show typing indicator for incomplete messages with "..." content */}
          {!isComplete && (message.content.trim() === '...' || message.content.trim() === '') ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
                <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}></div>
                <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}></div>
              </div>
              <span className="opacity-75 text-sm">AI is thinking...</span>
            </div>
          ) : message.content.trim() ? (
            <>
              <MarkdownRenderer
                content={message.content}
                className={`chat-bubble-content ${isUser ? 'user-content' : 'ai-content'}`}
                isStreaming={isStreaming}
              />

              {/* Smooth streaming cursor for active streaming */}
              {isStreaming && message.content.trim() && (
                <span className="inline-block w-0.5 h-5 bg-[rgb(var(--primary-button-gradient-from))] ml-1 align-text-bottom streaming-cursor"></span>
              )}
            </>
          ) : (
            !isComplete && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-current opacity-50 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-current opacity-50 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-current opacity-50 animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            )
          )}
        </div>

        {/* Reasoning Display for AI messages with reasoning */}
        {!isUser && message.reasoning && (
          <div className="mt-2">
            <ReasoningDisplay
              reasoning={message.reasoning}
              messageId={message.id}
              className="max-w-full"
              isComplete={isComplete}
            />
          </div>
        )}

        {/* Generation Metadata for assistant messages - positioned outside bubble for AI messages */}
        {!isUser && (
          <GenerationMetadata message={message} className="mt-2 max-w-full overflow-hidden opacity-75" />
        )}
        </div>

        {/* Generation Metadata for user messages - positioned outside bubble */}
        {isUser && (
          <div className="ml-3 mt-1">
            <GenerationMetadata message={message} className="max-w-full overflow-hidden opacity-75" />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.is_complete === nextProps.message.is_complete &&
    prevProps.message.model === nextProps.message.model &&
    prevProps.message.generation_id === nextProps.message.generation_id &&
    prevProps.message.reasoning === nextProps.message.reasoning
  );
});

ChatMessage.displayName = 'ChatMessage';