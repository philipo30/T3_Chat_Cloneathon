import type { ChatMessage, MessageContent, ImageContent, FileContent, CacheControl, Role } from '../types';
import { getCacheConfig, estimateTokens } from '../constants/cache-config';

/**
 * Cache strategy service for optimizing prompt caching
 * Handles both automatic and manual caching strategies
 */
export class CacheStrategyService {
  private modelId: string;
  private cacheConfig: ReturnType<typeof getCacheConfig>;

  constructor(modelId: string) {
    this.modelId = modelId;
    this.cacheConfig = getCacheConfig(modelId);
  }

  /**
   * Determine if caching should be applied based on conversation length
   */
  shouldApplyCaching(messages: ChatMessage[]): boolean {
    if (this.cacheConfig.type === 'none') {
      return false;
    }

    // Calculate total token count for all messages
    const totalTokens = this.estimateConversationTokens(messages);
    
    return totalTokens >= this.cacheConfig.minTokens;
  }

  /**
   * Apply caching strategy to messages based on model capabilities
   */
  applyCachingStrategy(messages: ChatMessage[]): ChatMessage[] {
    if (!this.shouldApplyCaching(messages)) {
      return messages; // Return original messages if caching not beneficial
    }

    switch (this.cacheConfig.type) {
      case 'automatic':
        // For automatic caching models, no modification needed
        // The provider handles caching automatically
        return messages;
        
      case 'manual':
        // For manual caching models, insert cache breakpoints
        return this.applyManualCaching(messages);
        
      default:
        return messages;
    }
  }

  /**
   * Apply manual caching strategy with cache_control breakpoints
   */
  private applyManualCaching(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length === 0) return messages;

    const cachedMessages: ChatMessage[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const isLastMessage = i === messages.length - 1;
      
      // Convert message to complex format if needed
      const complexMessage = this.convertToComplexMessage(message);
      
      // Apply caching strategy based on message position and role
      if (this.shouldCacheMessage(message, i, messages.length)) {
        cachedMessages.push(this.addCacheBreakpoint(complexMessage, isLastMessage));
      } else {
        cachedMessages.push(complexMessage);
      }
    }

    return cachedMessages;
  }

  /**
   * Determine if a message should have cache breakpoints
   */
  private shouldCacheMessage(message: ChatMessage, index: number, totalMessages: number): boolean {
    // Cache system messages (always reusable)
    if (message.role === 'system') {
      return true;
    }

    // Cache conversation history (not the last user message)
    if (index < totalMessages - 1) {
      return true;
    }

    return false;
  }

  /**
   * Add cache breakpoint to a message
   */
  private addCacheBreakpoint(message: ChatMessage, isLastInSequence: boolean): ChatMessage {
    const content: (MessageContent | ImageContent | FileContent)[] = Array.isArray(message.content)
      ? message.content
      : [{ type: 'text', text: message.content }];

    // Add cache breakpoint to the last content item if it's substantial
    if (content.length > 0 && !isLastInSequence) {
      const lastContent = content[content.length - 1];
      if (lastContent.type === 'text' && estimateTokens(lastContent.text) > 100) {
        // Add cache control to the last substantial content block
        (lastContent as MessageContent).cache_control = { type: 'ephemeral' };
      }
    }

    return {
      ...message,
      content,
    };
  }

  /**
   * Convert simple string message to complex message format
   */
  private convertToComplexMessage(message: ChatMessage): ChatMessage {
    if (typeof message.content === 'string') {
      return {
        ...message,
        content: [{ type: 'text', text: message.content } as MessageContent],
      };
    }
    return message;
  }

  /**
   * Estimate total tokens in conversation
   */
  private estimateConversationTokens(messages: ChatMessage[]): number {
    return messages.reduce((total, message) => {
      const content = typeof message.content === 'string'
        ? message.content
        : message.content.map(c => c.type === 'text' ? c.text : '').join(' ');
      return total + estimateTokens(content);
    }, 0);
  }

  /**
   * Get cache configuration for this model
   */
  getCacheConfig() {
    return this.cacheConfig;
  }

  /**
   * Format system message with caching for manual models
   */
  static createCachedSystemMessage(systemPrompt: string, additionalContext?: string): ChatMessage {
    const content: MessageContent[] = [
      { type: 'text', text: systemPrompt }
    ];

    // Add additional context with cache breakpoint if provided
    if (additionalContext && estimateTokens(additionalContext) > 100) {
      content.push({
        type: 'text',
        text: additionalContext,
        cache_control: { type: 'ephemeral' }
      });
    }

    return {
      role: 'system',
      content: content.length === 1 && !additionalContext ? systemPrompt : content,
    };
  }

  /**
   * Create a user message with conversation history caching
   */
  static createCachedUserMessage(
    currentMessage: string, 
    conversationHistory?: string
  ): ChatMessage {
    if (!conversationHistory || estimateTokens(conversationHistory) < 100) {
      // Simple message if no substantial history
      return {
        role: 'user',
        content: currentMessage,
      };
    }

    // Complex message with cached history
    return {
      role: 'user',
      content: [
        {
          type: 'text',
          text: conversationHistory,
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: currentMessage
        }
      ],
    };
  }
}
