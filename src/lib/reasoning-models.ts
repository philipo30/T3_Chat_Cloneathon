/**
 * Reasoning model detection and configuration utilities
 * Based on OpenRouter documentation: https://openrouter.ai/docs/use-cases/reasoning-tokens
 */

export type ReasoningParameterType = 'effort' | 'max_tokens' | 'both';

export interface ReasoningModelInfo {
  supportsReasoning: boolean;
  parameterType: ReasoningParameterType;
  provider: string;
  notes?: string;
}

/**
 * Model patterns that support reasoning tokens
 * Based on OpenRouter documentation
 */
const REASONING_MODEL_PATTERNS = {
  // OpenAI o-series models (effort-based)
  openai_o_series: {
    patterns: [
      /^openai\/o1/i,
      /^openai\/o-/i,
      /^o1/i,
      /^o-/i
    ],
    parameterType: 'effort' as ReasoningParameterType,
    provider: 'OpenAI',
    notes: 'Supports effort levels (high/medium/low). Some models may not return reasoning tokens in response.'
  },

  // Grok models (effort-based)
  grok: {
    patterns: [
      /grok/i,
      /x\.ai\/grok/i
    ],
    parameterType: 'effort' as ReasoningParameterType,
    provider: 'xAI',
    notes: 'Supports effort levels (high/medium/low)'
  },

  // Anthropic models with reasoning (max_tokens-based)
  anthropic_reasoning: {
    patterns: [
      /anthropic\/claude-3\.7/i,
      /anthropic\/claude-4/i,
      /claude-3\.7/i,
      /claude-4/i
    ],
    parameterType: 'max_tokens' as ReasoningParameterType,
    provider: 'Anthropic',
    notes: 'Supports max_tokens parameter. Use reasoning parameter instead of :thinking variant.'
  },

  // Gemini thinking models (max_tokens-based)
  gemini_thinking: {
    patterns: [
      /gemini.*thinking/i,
      /google\/gemini.*thinking/i,
      /gemini.*flash.*thinking/i
    ],
    parameterType: 'max_tokens' as ReasoningParameterType,
    provider: 'Google',
    notes: 'Gemini Flash Thinking models may not return reasoning tokens in response.'
  },

  // Deepseek R1 models (both parameters supported)
  deepseek_r1: {
    patterns: [
      /deepseek.*r1/i,
      /deepseek\/deepseek-r1/i
    ],
    parameterType: 'both' as ReasoningParameterType,
    provider: 'Deepseek',
    notes: 'Supports both effort levels and max_tokens parameters'
  }
};

/**
 * Enhanced reasoning detection using OpenRouter API attributes and documentation
 * This function checks both API attributes and provider-specific patterns
 */
export function getReasoningModelInfoFromAPI(model: any): ReasoningModelInfo {
  if (!model) {
    return {
      supportsReasoning: false,
      parameterType: 'effort',
      provider: 'Unknown'
    };
  }

  // First check OpenRouter API attributes (most accurate)
  const hasReasoningParam = model.supported_parameters?.includes('reasoning') ||
                           model.supported_parameters?.includes('include_reasoning');
  const hasReasoningPricing = model.pricing?.internal_reasoning && model.pricing.internal_reasoning !== '0';

  if (hasReasoningParam || hasReasoningPricing) {
    // Determine provider and parameter type based on OpenRouter documentation
    let provider = 'Unknown';
    let parameterType: ReasoningParameterType = 'effort';
    let notes = 'Detected via OpenRouter API attributes';

    // Provider-specific parameter type detection based on OpenRouter docs
    if (model.id.includes('openai/') || model.id.includes('o1')) {
      provider = 'OpenAI';
      parameterType = 'effort'; // OpenAI o-series supports effort levels
      notes = 'OpenAI o-series models support effort levels (high/medium/low)';
    } else if (model.id.includes('anthropic/')) {
      provider = 'Anthropic';
      parameterType = 'max_tokens'; // Anthropic models support max_tokens
      notes = 'Anthropic models support max_tokens parameter with 1024-32000 range';
    } else if (model.id.includes('google/') && model.id.includes('thinking')) {
      provider = 'Google';
      parameterType = 'max_tokens'; // Gemini thinking models support max_tokens
      notes = 'Gemini thinking models support max_tokens parameter';
    } else if (model.id.includes('deepseek/') && model.id.includes('r1')) {
      provider = 'Deepseek';
      parameterType = 'effort'; // Deepseek R1 models support effort
      notes = 'Deepseek R1 models support effort levels';
    } else if (model.id.includes('grok') || model.id.includes('x.ai/')) {
      provider = 'xAI';
      parameterType = 'effort'; // Grok models support effort levels
      notes = 'Grok models support effort levels (high/medium/low)';
    } else {
      // For unknown providers, check if they have specific parameter support
      const hasEffortParam = model.supported_parameters?.includes('effort');
      const hasMaxTokensParam = model.supported_parameters?.includes('max_tokens');

      if (hasEffortParam && hasMaxTokensParam) {
        parameterType = 'both';
        notes = 'Model supports both effort levels and max_tokens';
      } else if (hasMaxTokensParam) {
        parameterType = 'max_tokens';
        notes = 'Model supports max_tokens parameter';
      } else {
        parameterType = 'effort';
        notes = 'Model supports effort levels (default)';
      }
    }

    return {
      supportsReasoning: true,
      parameterType,
      provider,
      notes
    };
  }

  // Fallback to pattern matching for models not properly detected by API
  return getReasoningModelInfoLegacy(model.id);
}

/**
 * Legacy pattern-based reasoning detection (fallback)
 */
function getReasoningModelInfoLegacy(modelId: string): ReasoningModelInfo {
  if (!modelId) {
    return {
      supportsReasoning: false,
      parameterType: 'effort',
      provider: 'Unknown'
    };
  }

  // Check each pattern category
  for (const [category, config] of Object.entries(REASONING_MODEL_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(modelId)) {
        return {
          supportsReasoning: true,
          parameterType: config.parameterType,
          provider: config.provider,
          notes: config.notes
        };
      }
    }
  }

  // Default: no reasoning support
  return {
    supportsReasoning: false,
    parameterType: 'effort',
    provider: 'Unknown'
  };
}

/**
 * Determines if a model supports reasoning tokens and what parameter type to use
 * This is the main function that should be used - it tries API detection first, then falls back to patterns
 */
export function getReasoningModelInfo(modelId: string): ReasoningModelInfo {
  // For now, use legacy pattern matching since we don't have the full model object here
  // This function is kept for backward compatibility
  return getReasoningModelInfoLegacy(modelId);
}

/**
 * Checks if a model supports reasoning tokens (simplified version)
 */
export function supportsReasoning(modelId: string): boolean {
  return getReasoningModelInfo(modelId).supportsReasoning;
}

/**
 * Gets the preferred parameter type for a reasoning model
 */
export function getReasoningParameterType(modelId: string): ReasoningParameterType {
  return getReasoningModelInfo(modelId).parameterType;
}

/**
 * Gets a human-readable description of reasoning support for a model
 */
export function getReasoningDescription(modelId: string): string {
  const info = getReasoningModelInfo(modelId);
  
  if (!info.supportsReasoning) {
    return 'This model does not support reasoning tokens.';
  }

  const paramDesc = info.parameterType === 'effort' 
    ? 'effort levels (high/medium/low)'
    : info.parameterType === 'max_tokens'
    ? 'token limits (max_tokens)'
    : 'both effort levels and token limits';

  return `${info.provider} model supporting ${paramDesc}.${info.notes ? ` ${info.notes}` : ''}`;
}

/**
 * List of example reasoning-capable models for testing/reference
 */
export const EXAMPLE_REASONING_MODELS = [
  'openai/o1-preview',
  'openai/o1-mini',
  'anthropic/claude-3.7-sonnet',
  'deepseek/deepseek-r1',
  'x.ai/grok-beta',
  'google/gemini-flash-thinking'
] as const;
