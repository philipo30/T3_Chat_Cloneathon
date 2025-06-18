/**
 * Test suite for prompt caching functionality
 * Run with: npm test cache-strategy.test.ts
 */

import { CacheStrategyService } from '../services/cache-strategy';
import { getCacheConfig, supportsPromptCaching } from '../constants/cache-config';
import type { ChatMessage } from '../types';

describe('Cache Strategy Service', () => {
  describe('Model Detection', () => {
    test('should detect OpenAI models', () => {
      expect(supportsPromptCaching('gpt-4o')).toBe(true);
      expect(supportsPromptCaching('gpt-4-turbo')).toBe(true);
      expect(getCacheConfig('gpt-4o').type).toBe('automatic');
    });

    test('should detect DeepSeek models', () => {
      expect(supportsPromptCaching('deepseek/deepseek-chat')).toBe(true);
      expect(getCacheConfig('deepseek/deepseek-chat').type).toBe('automatic');
    });

    test('should detect Anthropic models', () => {
      expect(supportsPromptCaching('anthropic/claude-3-sonnet')).toBe(true);
      expect(getCacheConfig('anthropic/claude-3-sonnet').type).toBe('manual');
    });

    test('should detect Gemini models', () => {
      expect(supportsPromptCaching('google/gemini-2.5-pro')).toBe(true);
      expect(getCacheConfig('google/gemini-2.5-pro').type).toBe('automatic');
      
      expect(supportsPromptCaching('google/gemini-pro')).toBe(true);
      expect(getCacheConfig('google/gemini-pro').type).toBe('manual');
    });

    test('should handle unknown models', () => {
      expect(supportsPromptCaching('unknown-model')).toBe(false);
      expect(getCacheConfig('unknown-model').type).toBe('none');
    });
  });

  describe('Cache Strategy Application', () => {
    const shortConversation: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' },
    ];

    const longConversation: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Tell me about the history of artificial intelligence.' },
      { role: 'assistant', content: 'Artificial intelligence has a rich history dating back to the 1950s...' },
      { role: 'user', content: 'What are the main milestones?' },
      { role: 'assistant', content: 'Key milestones include the Dartmouth Conference in 1956...' },
      { role: 'user', content: 'How has machine learning evolved?' },
    ];

    test('should not apply caching for short conversations', () => {
      const service = new CacheStrategyService('gpt-4o');
      expect(service.shouldApplyCaching(shortConversation)).toBe(false);
      
      const result = service.applyCachingStrategy(shortConversation);
      expect(result).toEqual(shortConversation);
    });

    test('should apply automatic caching for supported models', () => {
      const service = new CacheStrategyService('gpt-4o');
      expect(service.shouldApplyCaching(longConversation)).toBe(true);
      
      const result = service.applyCachingStrategy(longConversation);
      // For automatic models, messages should remain unchanged
      expect(result).toEqual(longConversation);
    });

    test('should apply manual caching for Anthropic models', () => {
      const service = new CacheStrategyService('anthropic/claude-3-sonnet');
      expect(service.shouldApplyCaching(longConversation)).toBe(true);
      
      const result = service.applyCachingStrategy(longConversation);
      
      // Should have cache breakpoints added
      expect(result.length).toBe(longConversation.length);
      
      // System message should have cache control
      const systemMessage = result.find(m => m.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(Array.isArray(systemMessage?.content)).toBe(true);
      
      // Some messages should have cache control
      const messagesWithCache = result.filter(msg => {
        if (Array.isArray(msg.content)) {
          return msg.content.some(c => c.cache_control);
        }
        return false;
      });
      expect(messagesWithCache.length).toBeGreaterThan(0);
    });

    test('should handle models without caching support', () => {
      const service = new CacheStrategyService('unknown-model');
      expect(service.shouldApplyCaching(longConversation)).toBe(false);
      
      const result = service.applyCachingStrategy(longConversation);
      expect(result).toEqual(longConversation);
    });
  });

  describe('Message Formatting', () => {
    test('should create cached system message', () => {
      const systemMessage = CacheStrategyService.createCachedSystemMessage(
        'You are a helpful assistant.',
        'Additional context that should be cached.'
      );
      
      expect(systemMessage.role).toBe('system');
      expect(Array.isArray(systemMessage.content)).toBe(true);
      
      if (Array.isArray(systemMessage.content)) {
        expect(systemMessage.content.length).toBe(2);
        expect(systemMessage.content[1].cache_control).toEqual({ type: 'ephemeral' });
      }
    });

    test('should create cached user message with history', () => {
      const userMessage = CacheStrategyService.createCachedUserMessage(
        'What is the weather today?',
        'Previous conversation history that should be cached...'
      );
      
      expect(userMessage.role).toBe('user');
      expect(Array.isArray(userMessage.content)).toBe(true);
      
      if (Array.isArray(userMessage.content)) {
        expect(userMessage.content.length).toBe(2);
        expect(userMessage.content[0].cache_control).toEqual({ type: 'ephemeral' });
        expect(userMessage.content[1].text).toBe('What is the weather today?');
      }
    });

    test('should create simple message without substantial history', () => {
      const userMessage = CacheStrategyService.createCachedUserMessage(
        'Hello',
        'Short'
      );
      
      expect(userMessage.role).toBe('user');
      expect(typeof userMessage.content).toBe('string');
      expect(userMessage.content).toBe('Hello');
    });
  });

  describe('Token Estimation', () => {
    test('should estimate tokens correctly', () => {
      const { estimateTokens } = require('../constants/cache-config');
      
      expect(estimateTokens('Hello')).toBe(2); // 5 chars / 4 = 1.25, rounded up to 2
      expect(estimateTokens('This is a longer message')).toBe(6); // 24 chars / 4 = 6
      expect(estimateTokens('')).toBe(0);
    });
  });
});

// Integration test helper
export function createTestConversation(length: 'short' | 'medium' | 'long'): ChatMessage[] {
  const base: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful AI assistant.' },
    { role: 'user', content: 'Hello, how can you help me today?' },
    { role: 'assistant', content: 'I can help you with a variety of tasks including answering questions, providing information, and assisting with problem-solving.' },
  ];

  if (length === 'short') {
    return base.slice(1); // Remove system message for short conversation
  }

  if (length === 'medium') {
    return [
      ...base,
      { role: 'user', content: 'Can you explain machine learning?' },
      { role: 'assistant', content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.' },
    ];
  }

  // Long conversation
  return [
    ...base,
    { role: 'user', content: 'Can you explain machine learning in detail?' },
    { role: 'assistant', content: 'Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.' },
    { role: 'user', content: 'What are the different types of machine learning?' },
    { role: 'assistant', content: 'There are three main types of machine learning: 1) Supervised Learning - uses labeled data to train models, 2) Unsupervised Learning - finds patterns in data without labels, and 3) Reinforcement Learning - learns through interaction with an environment.' },
    { role: 'user', content: 'How does deep learning fit into this?' },
  ];
}
