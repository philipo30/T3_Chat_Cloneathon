import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  GenerationMetadata,
  GenerationMetadataResponse
} from '../types';

// Constants
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const ERROR_MESSAGES = {
  NO_API_KEY: 'OpenRouter API key is required',
  FETCH_FAILED: 'Failed to fetch from OpenRouter API',
};

export class OpenRouterClient {
  private apiKey: string;
  private headers: Record<string, string>;

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
   * Send a chat completion request to OpenRouter
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OpenRouter chat completion error:', error);
      throw error;
    }
  }

  /**
   * Send a streaming chat completion request to OpenRouter
   * Returns a ReadableStream that emits ChatCompletionChunks
   * Optimized for better performance with proper SSE parsing
   */
  async streamChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ReadableStream<ChatCompletionChunk>> {
    try {
      // Ensure stream is enabled
      const streamingRequest = { ...request, stream: true };

      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(streamingRequest),
      });

      if (!response.ok) {
        let errorMessage = `${ERROR_MESSAGES.FETCH_FAILED}: ${response.status} ${response.statusText}`;

        // Try to get more specific error information
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
        }

        throw new Error(errorMessage);
      }

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

      if (!response.ok) {
        throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${response.status} ${response.statusText}`);
      }

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
}