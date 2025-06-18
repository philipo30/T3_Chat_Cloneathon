import React, { useState } from 'react';
import { Copy, Check, Edit3, RefreshCcw, GitBranch } from 'lucide-react';
import { type Message } from '@/lib/supabase/database.types';
import { useSupabaseChats } from '@/hooks/useSupabaseChats';
import { useSupabaseChatCompletion } from '@/hooks/useSupabaseChatCompletion';
import { useApiKey } from '@/hooks/useApiKey';
import { useRouter } from 'next/navigation';
import { useSupabaseChat } from '@/hooks/useSupabaseChats';

interface MessageUtilityBarProps {
  message: Message;
  isUser: boolean;
  className?: string;
}

/**
 * Utility bar that appears on hover for chat messages
 * Provides copy, edit, retry, and branch actions
 */
export const MessageUtilityBar: React.FC<MessageUtilityBarProps> = ({
  message,
  isUser,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [isBranching, setIsBranching] = useState(false);
  const { apiKey } = useApiKey();
  const router = useRouter();
  const { addMessage, deleteMessage, deleteMessagesAfter, getLastUserMessage, createChat } = useSupabaseChats();
  const { sendMessage: triggerCompletion } = useSupabaseChatCompletion(apiKey, message.chat_id);
  const { chat } = useSupabaseChat(message.chat_id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleEdit = () => {
    // Placeholder for edit functionality
    console.log('Edit message:', message.id);
  };

  const handleRetry = async () => {
    try {
      if (isUser) {
        // For user messages: Delete all messages after this one and resend the user message
        await deleteMessagesAfter(message.id, message.chat_id);

        // Create a new placeholder assistant message
        const assistantMessage = await addMessage({
          chat_id: message.chat_id,
          role: 'assistant',
          content: '...',
          model: message.model,
          is_complete: false,
        });

        // Trigger AI completion with the user message content
        await triggerCompletion({
          content: message.content,
          modelId: message.model || 'gpt-3.5-turbo',
          webSearchEnabled: localStorage.getItem('webSearchEnabled') === 'true',
        });
      } else {
        // For AI messages: Delete this message and regenerate
        await deleteMessage(message.id, message.chat_id);

        // Create a new placeholder assistant message
        const assistantMessage = await addMessage({
          chat_id: message.chat_id,
          role: 'assistant',
          content: '...',
          model: message.model,
          is_complete: false,
        });

        // Find the last user message to regenerate from
        const lastUserMessage = await getLastUserMessage(message.chat_id);
        if (lastUserMessage) {
          await triggerCompletion({
            content: lastUserMessage.content,
            modelId: message.model || 'gpt-3.5-turbo',
            webSearchEnabled: localStorage.getItem('webSearchEnabled') === 'true',
          });
        }
      }
    } catch (error) {
      console.error('Failed to retry message:', error);
    }
  };

  const handleBranch = async () => {
    if (!chat || isBranching) return;

    setIsBranching(true);

    try {
      // Find the index of the current message in the chat
      const currentMessageIndex = chat.messages.findIndex(msg => msg.id === message.id);
      if (currentMessageIndex === -1) {
        console.error('Message not found in chat');
        return;
      }

      // Get all messages up to and including the selected message
      const messagesToCopy = chat.messages.slice(0, currentMessageIndex + 1);

      // Create a new chat with a descriptive title
      const branchTitle = `Branch from "${chat.title}"`;
      const newChat = await createChat(branchTitle, message.model || chat.model_id);

      // Copy all messages to the new chat
      for (const msgToCopy of messagesToCopy) {
        await addMessage({
          chat_id: newChat.id,
          role: msgToCopy.role,
          content: msgToCopy.content,
          model: msgToCopy.model,
          is_complete: msgToCopy.is_complete,
          generation_id: msgToCopy.generation_id,
          reasoning: msgToCopy.reasoning,
          annotations: msgToCopy.annotations,
          attachments: msgToCopy.attachments,
        });
      }

      // Navigate to the new branched chat
      router.push(`/chat/${newChat.id}`);

    } catch (error) {
      console.error('Failed to branch conversation:', error);
    } finally {
      setIsBranching(false);
    }
  };

  return (
    <div className={`
      opacity-0 group-hover:opacity-100
      transition-opacity duration-200 ease-in-out
      flex items-center gap-1
      ${isUser ? 'justify-end' : 'justify-start'}
      ${className}
    `}>
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="
          flex items-center justify-center w-8 h-8 
          rounded-md transition-all duration-150
          hover:bg-white/10 dark:hover:bg-white/10
          text-[rgb(var(--chat-message-username))]
          hover:text-[rgb(var(--chat-bubble-ai-text))]
        "
        title="Copy message"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>

      {isUser ? (
        <>
          {/* Edit Button for User Messages */}
          <button
            onClick={handleEdit}
            className="
              flex items-center justify-center w-8 h-8
              rounded-md transition-all duration-150
              hover:bg-white/10 dark:hover:bg-white/10
              text-[rgb(var(--chat-message-username))]
              hover:text-[rgb(var(--chat-bubble-ai-text))]
            "
            title="Edit message"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Branch Button for User Messages */}
          <button
            onClick={handleBranch}
            disabled={isBranching}
            className="
              flex items-center justify-center w-8 h-8
              rounded-md transition-all duration-150
              hover:bg-white/10 dark:hover:bg-white/10
              text-[rgb(var(--chat-message-username))]
              hover:text-[rgb(var(--chat-bubble-ai-text))]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title={isBranching ? "Creating branch..." : "Branch conversation from here"}
          >
            <GitBranch className={`w-4 h-4 ${isBranching ? 'animate-pulse' : ''}`} />
          </button>

          {/* Retry Button for User Messages */}
          <button
            onClick={handleRetry}
            className="
              flex items-center justify-center w-8 h-8
              rounded-md transition-all duration-150
              hover:bg-white/10 dark:hover:bg-white/10
              text-[rgb(var(--chat-message-username))]
              hover:text-[rgb(var(--chat-bubble-ai-text))]
            "
            title="Retry sending message"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          {/* Branch Button for AI Messages */}
          <button
            onClick={handleBranch}
            disabled={isBranching}
            className="
              flex items-center justify-center w-8 h-8
              rounded-md transition-all duration-150
              hover:bg-white/10 dark:hover:bg-white/10
              text-[rgb(var(--chat-message-username))]
              hover:text-[rgb(var(--chat-bubble-ai-text))]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title={isBranching ? "Creating branch..." : "Branch conversation from here"}
          >
            <GitBranch className={`w-4 h-4 ${isBranching ? 'animate-pulse' : ''}`} />
          </button>

          {/* Retry Button for AI Messages */}
          <button
            onClick={handleRetry}
            className="
              flex items-center justify-center w-8 h-8 
              rounded-md transition-all duration-150
              hover:bg-white/10 dark:hover:bg-white/10
              text-[rgb(var(--chat-message-username))]
              hover:text-[rgb(var(--chat-bubble-ai-text))]
            "
            title="Regenerate AI response"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
