export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length?: number;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    web_search?: string;
    internal_reasoning?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
      is_moderated: boolean;
  };
  per_request_limits: any | null;
  supported_parameters: string[];
}

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
  isComplete?: boolean;
  generationId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy types for backward compatibility
export interface LegacyMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
  isComplete?: boolean;
  generationId?: string;
}

export interface LegacyChatSession {
  id: string;
  title: string;
  messages: LegacyMessage[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReasoningConfig {
  effort?: "high" | "medium" | "low";  // OpenAI-style reasoning effort
  max_tokens?: number;                  // Anthropic-style token limit
  exclude?: boolean;                    // Hide reasoning from response
  enabled?: boolean;                    // Enable reasoning with defaults
}

export interface WebSearchPlugin {
  id: 'web';
  max_results?: number;                 // Maximum search results (default: 5)
  search_prompt?: string;               // Custom search prompt
}

export interface WebSearchOptions {
  search_context_size?: 'low' | 'medium' | 'high';  // Search context size for native models
}

// Cache control for prompt caching
export interface CacheControl {
  type: 'ephemeral';
}

// Message content for complex messages with caching support
export interface MessageContent {
  type: 'text';
  text: string;
  cache_control?: CacheControl;
}

// File attachment types for OpenRouter API
export interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  mimeType: string;
  size: number;
  data: string; // base64 encoded
  preview?: string; // thumbnail for images
  uploadedAt: string;
}

// OpenRouter image content type
export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string; // data URL with base64
  };
}

// OpenRouter file content type
export interface FileContent {
  type: 'file';
  file: {
    filename: string;
    file_data: string; // data URL with base64
  };
}

// Enhanced message format supporting both simple strings and complex content arrays
export interface ChatMessage {
  role: Role;
  content: string | (MessageContent | ImageContent | FileContent)[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  web_search?: boolean;                 // Legacy simple web search flag
  plugins?: WebSearchPlugin[];          // OpenRouter plugins array
  web_search_options?: WebSearchOptions; // Web search options for native models
  reasoning?: ReasoningConfig;
}

export interface WebSearchAnnotation {
  type: 'url_citation';
  url_citation: {
    url: string;
    title: string;
    content?: string;                   // Added by OpenRouter if available
    start_index: number;                // Start index in message content
    end_index: number;                  // End index in message content
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: Role;
      content: string;
      reasoning?: string;
      annotations?: WebSearchAnnotation[]; // Web search annotations
    };
    finish_reason: string;
  }[];
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: Role;
      content?: string;
      reasoning?: string;
      annotations?: WebSearchAnnotation[]; // Web search annotations in streaming
    };
    finish_reason: string | null;
  }[];
}

export interface GenerationMetadata {
  id: string;
  total_cost: number;
  created_at: string;
  model: string;
  origin: string;
  usage: number;
  is_byok: boolean;
  upstream_id: string;
  cache_discount: number;
  app_id: number;
  streamed: boolean;
  cancelled: boolean;
  provider_name: string;
  latency: number;
  moderation_latency: number;
  generation_time: number;
  finish_reason: string;
  native_finish_reason: string;
  tokens_prompt: number;
  tokens_completion: number;
  native_tokens_prompt: number;
  native_tokens_completion: number;
  native_tokens_reasoning: number;
  num_media_prompt: number;
  num_media_completion: number;
  num_search_results: number;
}

export interface GenerationMetadataResponse {
  data: GenerationMetadata;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null; // Unix timestamp
  resetDate?: Date;
}

export interface RateLimitHeaders {
  'x-ratelimit-limit-requests'?: string;
  'x-ratelimit-remaining-requests'?: string;
  'x-ratelimit-reset-requests'?: string;
  'x-ratelimit-limit-tokens'?: string;
  'x-ratelimit-remaining-tokens'?: string;
  'x-ratelimit-reset-tokens'?: string;
}

export interface RateLimitState {
  requests: RateLimitInfo;
  tokens: RateLimitInfo;
  lastUpdated: number;
  isRateLimited: boolean;
  retryAfter?: number; // Seconds to wait before next request
}

export interface RateLimitError extends Error {
  status: number;
  rateLimitInfo?: RateLimitState;
  retryAfter?: number;
  isRateLimitError: true;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: any;
}

// Cache capability types
export type CacheType = 'automatic' | 'manual' | 'none';

export interface CacheCapability {
  type: CacheType;
  minTokens: number;
  cacheCostMultiplier: number;  // Cost multiplier for cache writes (e.g., 1.25 for Anthropic)
  readCostMultiplier: number;   // Cost multiplier for cache reads (e.g., 0.1 for Anthropic)
}

// Enhanced model configuration with caching support
export interface ModelCacheConfig {
  cacheCapability: CacheCapability;
  supportsPromptCaching: boolean;
}

// Chat Title Generation Types
export interface TitleGenerationRequest {
  prompt: string;
  model?: string;
  chatId: string;
  messageId?: string;
  maxLength?: number;
}

export interface TitleGenerationResponse {
  title: string;
  chatId: string;
  messageId?: string;
  model: string;
  tokensUsed?: number;
  generationTime?: number;
}

export interface TitleGenerationError {
  error: string;
  code?: string;
  details?: string;
}