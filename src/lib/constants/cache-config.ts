import type { CacheCapability } from '../types';

/**
 * Cache configuration for different model providers
 * Based on OpenRouter prompt caching documentation
 */
export const CACHE_CONFIGURATIONS: Record<string, CacheCapability> = {
  // OpenAI models - automatic caching
  'openai': {
    type: 'automatic',
    minTokens: 1024,
    cacheCostMultiplier: 1.0,  // No additional cost for cache writes
    readCostMultiplier: 0.5,   // 0.5x cost for cache reads (varies by model)
  },

  // DeepSeek models - automatic caching  
  'deepseek': {
    type: 'automatic',
    minTokens: 1024,
    cacheCostMultiplier: 1.0,  // Same cost as regular input
    readCostMultiplier: 0.1,   // 0.1x cost for cache reads
  },

  // Gemini 2.5 models - implicit automatic caching
  'gemini-2.5': {
    type: 'automatic',
    minTokens: 1028,  // 1028 for Flash, 2048 for Pro
    cacheCostMultiplier: 1.0,  // No cache write cost
    readCostMultiplier: 0.25,  // 0.25x cost for cache reads
  },

  // Anthropic Claude - manual caching with cache_control breakpoints
  'anthropic': {
    type: 'manual',
    minTokens: 1024,
    cacheCostMultiplier: 1.25, // 1.25x cost for cache writes
    readCostMultiplier: 0.1,   // 0.1x cost for cache reads
  },

  // Older Gemini models - manual caching
  'gemini': {
    type: 'manual',
    minTokens: 4096,  // Higher threshold for older models
    cacheCostMultiplier: 1.0,  // Base cost + 5min storage
    readCostMultiplier: 0.25,  // 0.25x cost for cache reads
  },

  // Default for unknown providers - no caching
  'default': {
    type: 'none',
    minTokens: Infinity,
    cacheCostMultiplier: 1.0,
    readCostMultiplier: 1.0,
  },
};

/**
 * Model ID patterns to cache configuration mapping
 * Used to detect cache capabilities from model IDs
 */
export const MODEL_CACHE_PATTERNS: Array<{ pattern: RegExp; config: string }> = [
  // OpenAI models
  { pattern: /^gpt-/, config: 'openai' },
  { pattern: /^o1-/, config: 'openai' },
  
  // DeepSeek models
  { pattern: /^deepseek\//, config: 'deepseek' },
  
  // Gemini 2.5 models (automatic caching)
  { pattern: /^google\/gemini-2\.5/, config: 'gemini-2.5' },
  { pattern: /^gemini-2\.5/, config: 'gemini-2.5' },
  
  // Anthropic Claude models
  { pattern: /^anthropic\//, config: 'anthropic' },
  { pattern: /^claude-/, config: 'anthropic' },
  
  // Older Gemini models (manual caching)
  { pattern: /^google\/gemini/, config: 'gemini' },
  { pattern: /^gemini/, config: 'gemini' },
];

/**
 * Get cache configuration for a model ID
 */
export function getCacheConfig(modelId: string): CacheCapability {
  for (const { pattern, config } of MODEL_CACHE_PATTERNS) {
    if (pattern.test(modelId)) {
      return CACHE_CONFIGURATIONS[config];
    }
  }
  
  return CACHE_CONFIGURATIONS.default;
}

/**
 * Check if a model supports prompt caching
 */
export function supportsPromptCaching(modelId: string): boolean {
  const config = getCacheConfig(modelId);
  return config.type !== 'none';
}

/**
 * Rough token estimation (4 characters ≈ 1 token)
 * This is a simple approximation for threshold decisions
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
