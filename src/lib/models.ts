import { Model } from '@/types/models';

// Model detection patterns based on OpenRouter documentation
const reasoningPatterns = {
  // OpenAI o-series models (use effort parameter)
  openai_o_series: /^openai\/o1(-mini|-preview)?$/i,
  
  // Grok models (use effort parameter)  
  grok: /grok/i,
  
  // Anthropic models with reasoning support (use max_tokens parameter)
  anthropic_reasoning: /^anthropic\/claude-3\.7|anthropic\/claude.*thinking/i,
  
  // Gemini thinking models (use max_tokens parameter)
  gemini_thinking: /^google\/gemini.*thinking/i,
  
  // Deepseek R1 models (use effort parameter)
  deepseek_r1: /^deepseek\/.*r1/i,
};

/**
 * Determines if a model supports reasoning tokens
 */
export function supportsReasoning(modelId: string): boolean {
  return Object.values(reasoningPatterns).some(pattern => pattern.test(modelId));
}

/**
 * Determines the reasoning parameter type for a model
 */
export function getReasoningType(modelId: string): 'effort' | 'max_tokens' | null {
  // Models that use effort parameter
  if (reasoningPatterns.openai_o_series.test(modelId) || 
      reasoningPatterns.grok.test(modelId) ||
      reasoningPatterns.deepseek_r1.test(modelId)) {
    return 'effort';
  }
  
  // Models that use max_tokens parameter
  if (reasoningPatterns.anthropic_reasoning.test(modelId) ||
      reasoningPatterns.gemini_thinking.test(modelId)) {
    return 'max_tokens';
  }
  
  return null;
}

/**
 * Sample models for development/testing
 */
export const sampleModels: Model[] = [
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    supportsReasoning: false,
  },
  {
    id: 'openai/o1-mini',
    name: 'OpenAI o1-mini',
    provider: 'OpenAI',
    supportsReasoning: true,
    reasoningType: 'effort',
  },
  {
    id: 'openai/o1-preview',
    name: 'OpenAI o1-preview',
    provider: 'OpenAI',
    supportsReasoning: true,
    reasoningType: 'effort',
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    supportsReasoning: true,
    reasoningType: 'max_tokens',
  },
  {
    id: 'x-ai/grok-2-1212',
    name: 'Grok 2',
    provider: 'xAI',
    supportsReasoning: true,
    reasoningType: 'effort',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    supportsReasoning: true,
    reasoningType: 'effort',
  },
];

/**
 * Creates a Model object with reasoning support detection
 */
export function createModel(id: string, name: string, provider: string): Model {
  const supportsReasoningTokens = supportsReasoning(id);
  const reasoningType = getReasoningType(id);
  
  return {
    id,
    name,
    provider,
    supportsReasoning: supportsReasoningTokens,
    reasoningType: reasoningType || undefined,
  };
}

/**
 * Default reasoning configuration
 */
export const defaultReasoningConfig = {
  enabled: false,
  effort: 'high' as const,
  max_tokens: 2000,
  exclude: false,
};
