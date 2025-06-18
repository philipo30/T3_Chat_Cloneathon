import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  GenerationMetadata,
  GenerationMetadataResponse,
  ChatMessage,
  RateLimitError,
  ApiError
} from '../types';
import { CacheStrategyService } from '../services/cache-strategy';
import { rateLimitService } from '../services/rate-limit-service';

// Constants
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const ERROR_MESSAGES = {
  NO_API_KEY: 'OpenRouter API key is required',
  FETCH_FAILED: 'Failed to fetch from OpenRouter API',
  RATE_LIMITED: 'Rate limit exceeded',
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  INVALID_API_KEY: 'Invalid API key',
};

export class OpenRouterClient {
  private apiKey: string;
  private headers: Record<string, string>;
  private cacheStats: { hits: number; misses: number } = { hits: 0, misses: 0 };

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }

    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
  }

  /**
   * Handle API response and parse rate limit headers
   */
  private async handleApiResponse(response: Response): Promise<void> {
    // Parse and store rate limit information
    rateLimitService.parseRateLimitHeaders(response.headers);

    if (!response.ok) {
      const error = await this.createApiError(response);
      throw error;
    }
  }

  /**
   * Create appropriate error based on response status
   */
  private async createApiError(response: Response): Promise<ApiError | RateLimitError> {
    let errorMessage = `${ERROR_MESSAGES.FETCH_FAILED}: ${response.status} ${response.statusText}`;
    let errorDetails: any = null;

    // Try to get more specific error information
    try {
      errorDetails = await response.json();
      if (errorDetails.error?.message) {
        errorMessage += ` - ${errorDetails.error.message}`;
      }
    } catch (e) {
      // If we can't parse the error response, use the default message
    }

    // Handle specific error types
    switch (response.status) {
      case 429: {
        // Rate limit error
        const retryAfter = response.headers.get('retry-after');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;

        return rateLimitService.createRateLimitError(
          ERROR_MESSAGES.RATE_LIMITED,
          429,
          retryAfterSeconds
        );
      }

      case 402: {
        // Insufficient credits
        const error = new Error(ERROR_MESSAGES.INSUFFICIENT_CREDITS) as ApiError;
        error.status = 402;
        error.details = errorDetails;
        return error;
      }

      case 401: {
        // Invalid API key
        const error = new Error(ERROR_MESSAGES.INVALID_API_KEY) as ApiError;
        error.status = 401;
        error.details = errorDetails;
        return error;
      }

      default: {
        // Generic API error
        const error = new Error(errorMessage) as ApiError;
        error.status = response.status;
        error.details = errorDetails;
        return error;
      }
    }
  }

  /**
   * Send a chat completion request to OpenRouter with caching optimization
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      // Apply caching strategy if model supports it
      const optimizedRequest = this.applyCachingStrategy(request);

      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(optimizedRequest),
      });

      // Handle response and parse rate limit headers
      await this.handleApiResponse(response);

      const result = await response.json();

      // Track cache usage if available in response
      this.trackCacheUsage(result);

      return result;
    } catch (error) {
      console.error('OpenRouter chat completion error:', error);
      throw error;
    }
  }

  /**
   * Send a streaming chat completion request to OpenRouter with caching optimization
   * Returns a ReadableStream that emits ChatCompletionChunks
   * Optimized for better performance with proper SSE parsing
   */
  async streamChatCompletion(
    request: ChatCompletionRequest,
    signal?: AbortSignal
  ): Promise<ReadableStream<ChatCompletionChunk>> {
    try {
      // Apply caching strategy if model supports it
      const optimizedRequest = this.applyCachingStrategy(request);

      // Ensure stream is enabled
      const streamingRequest = { ...optimizedRequest, stream: true };

      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(streamingRequest),
        signal,
      });

      // Handle response and parse rate limit headers
      await this.handleApiResponse(response);

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Optimized SSE parser with proper buffering
      const decoder = new TextDecoder();
      let buffer = '';

      return response.body.pipeThrough(new TransformStream({
        transform(chunk, controller) {
          // Decode the chunk and add to buffer
          const text = decoder.decode(chunk, { stream: true });
          buffer += text;

          // Process complete lines from buffer
          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines or comments (OpenRouter sends ": OPENROUTER PROCESSING" comments)
            if (!trimmedLine || trimmedLine.startsWith(':')) continue;

            // Parse SSE data lines
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6); // Remove 'data: ' prefix

              // Check for stream end marker
              if (data === '[DONE]') {
                controller.terminate();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                controller.enqueue(parsed);
              } catch (e) {
                console.error('Error parsing SSE data:', e, 'Raw data:', data);
              }
            }
          }
        },

        flush(controller) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            const trimmedLine = buffer.trim();
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  controller.enqueue(parsed);
                } catch (e) {
                  console.error('Error parsing final SSE data:', e);
                }
              }
            }
          }
        }
      }));
    } catch (error) {
      console.error('OpenRouter streaming error:', error);
      throw error;
    }
  }

  /**
   * Get metadata for a specific generation
   * Returns comprehensive generation metadata including tokens, cost, timing, etc.
   */
  async getGeneration(generationId: string): Promise<GenerationMetadata> {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/generation?id=${generationId}`, {
        method: 'GET',
        headers: this.headers,
      });

      // Handle response and parse rate limit headers
      await this.handleApiResponse(response);

      const result: GenerationMetadataResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('OpenRouter get generation error:', error);
      throw error;
    }
  }

  /**
   * Validate the API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/models`, {
        method: 'GET',
        headers: this.headers,
      });

      // Parse rate limit headers even for validation requests
      rateLimitService.parseRateLimitHeaders(response.headers);

      return response.ok;
    } catch (error) {
      console.error('OpenRouter API key validation error:', error);
      return false;
    }
  }

  /**
   * Resume a generation by its ID
   */
  async resumeGeneration(generationId: string): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/generation?id=${generationId}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      return response.body;
    } catch (error) {
      console.error('OpenRouter resume generation error:', error);
      throw error;
    }
  }

  /**
   * Apply caching strategy to the request based on model capabilities
   */
  private applyCachingStrategy(request: ChatCompletionRequest): ChatCompletionRequest {
    try {
      const cacheStrategy = new CacheStrategyService(request.model);
      const optimizedMessages = cacheStrategy.applyCachingStrategy(request.messages);

      return {
        ...request,
        messages: optimizedMessages,
      };
    } catch (error) {
      console.warn('Failed to apply caching strategy, using original request:', error);
      return request;
    }
  }

  /**
   * Track cache usage from response metadata
   */
  private trackCacheUsage(response: ChatCompletionResponse): void {
    try {
      // OpenRouter includes cache information in usage metadata
      // This is a placeholder for future cache monitoring
      if (response && typeof response === 'object') {
        // Cache hit/miss information would be available in response metadata
        // For now, we'll just log successful responses
        console.debug('Chat completion response received, cache tracking available');
      }
    } catch (error) {
      console.warn('Failed to track cache usage:', error);
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats(): { hits: number; misses: number } {
    return { ...this.cacheStats };
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats(): void {
    this.cacheStats = { hits: 0, misses: 0 };
  }
}