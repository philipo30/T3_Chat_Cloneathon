import { OpenRouterClient } from '../api/openrouter';
import type { 
  TitleGenerationRequest, 
  TitleGenerationResponse, 
  TitleGenerationError,
  ChatCompletionRequest 
} from '../types';

// Configuration for title generation
const TITLE_GENERATION_CONFIG = {
  maxLength: 80,
  defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
  fallbackModel: 'meta-llama/llama-3.2-3b-instruct:free',
  timeout: 10000, // 10 seconds
  systemPrompt: `You are a chat title generator. Your task is to create concise, descriptive titles for chat conversations.

Rules:
- Generate a short title based on the user's first message
- Keep it under 80 characters
- Make it descriptive and specific to the conversation topic
- Do NOT answer the user's message, only generate a title
- Do NOT use quotes, colons, or special formatting
- Use title case (capitalize important words)
- Be concise but informative

Examples:
- User: "How do I center a div in CSS?" → Title: "CSS Div Centering Help"
- User: "What's the weather like today?" → Title: "Weather Inquiry"
- User: "Can you help me write a Python function?" → Title: "Python Function Development"`,
};

export class TitleGeneratorService {
  private openRouterClient: OpenRouterClient | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openRouterClient = new OpenRouterClient(apiKey);
    }
  }

  /**
   * Generate a title for a chat conversation
   */
  async generateTitle(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.openRouterClient) {
        throw new Error('OpenRouter API key not configured');
      }

      // Validate input
      if (!request.prompt?.trim()) {
        throw new Error('Prompt is required for title generation');
      }

      if (!request.chatId) {
        throw new Error('Chat ID is required for title generation');
      }

      // Prepare the completion request
      const model = request.model || TITLE_GENERATION_CONFIG.defaultModel;
      const maxLength = request.maxLength || TITLE_GENERATION_CONFIG.maxLength;

      const completionRequest: ChatCompletionRequest = {
        model,
        messages: [
          {
            role: 'system',
            content: TITLE_GENERATION_CONFIG.systemPrompt,
          },
          {
            role: 'user',
            content: `Generate a title for this message: "${request.prompt.trim()}"`,
          },
        ],
        max_tokens: 50, // Keep titles short
        temperature: 0.3, // Low temperature for consistent, focused titles
        stream: false,
      };

      // Generate the title
      const response = await this.openRouterClient.chatCompletion(completionRequest);
      
      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No title generated from API response');
      }

      let title = response.choices[0].message.content.trim();
      
      // Clean up the title
      title = this.cleanTitle(title, maxLength);

      const generationTime = Date.now() - startTime;

      return {
        title,
        chatId: request.chatId,
        messageId: request.messageId,
        model,
        tokensUsed: response.usage?.total_tokens,
        generationTime,
      };

    } catch (error) {
      // Try fallback model if primary model fails
      if (request.model !== TITLE_GENERATION_CONFIG.fallbackModel) {
        try {
          return await this.generateTitle({
            ...request,
            model: TITLE_GENERATION_CONFIG.fallbackModel,
          });
        } catch (fallbackError) {
          // Fallback model also failed, continue to generic fallback
        }
      }

      // Return a generic title based on the prompt if all else fails
      const fallbackTitle = this.generateFallbackTitle(request.prompt);
      
      return {
        title: fallbackTitle,
        chatId: request.chatId,
        messageId: request.messageId,
        model: 'fallback',
        generationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean and format the generated title
   */
  private cleanTitle(title: string, maxLength: number): string {
    // Remove quotes and unwanted characters
    title = title.replace(/^["']|["']$/g, '');
    title = title.replace(/^Title:\s*/i, '');
    title = title.replace(/^Chat:\s*/i, '');
    
    // Truncate if too long
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3).trim() + '...';
    }

    // Ensure it's not empty
    if (!title.trim()) {
      title = 'New Chat';
    }

    return title.trim();
  }

  /**
   * Generate a fallback title when AI generation fails
   */
  private generateFallbackTitle(prompt: string): string {
    if (!prompt?.trim()) {
      return 'New Chat';
    }

    // Extract key words from the prompt
    const words = prompt.trim().split(/\s+/).slice(0, 6);
    let title = words.join(' ');

    // Truncate if too long
    if (title.length > TITLE_GENERATION_CONFIG.maxLength) {
      title = title.substring(0, TITLE_GENERATION_CONFIG.maxLength - 3) + '...';
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title || 'New Chat';
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.openRouterClient) {
      return false;
    }

    try {
      return await this.openRouterClient.validateApiKey();
    } catch (error) {
      return false;
    }
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.openRouterClient = new OpenRouterClient(apiKey);
  }
}

// Export a default instance
export const titleGeneratorService = new TitleGeneratorService();
