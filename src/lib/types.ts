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

export interface ChatCompletionRequest {
  model: string;
  messages: { role: Role; content: string }[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  web_search?: boolean;
  reasoning?: ReasoningConfig;
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