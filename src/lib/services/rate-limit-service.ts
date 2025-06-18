import type { 
  RateLimitInfo, 
  RateLimitHeaders, 
  RateLimitState, 
  RateLimitError, 
  RetryConfig 
} from '../types';

/**
 * Rate limit service for managing OpenRouter API rate limits
 * Handles exponential backoff, retry logic, and rate limit tracking
 */
export class RateLimitService {
  private static instance: RateLimitService;
  private rateLimitState: RateLimitState | null = null;
  private requestHistory: number[] = []; // Timestamps of recent requests
  private readonly maxHistorySize = 100; // Keep last 100 requests

  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 60000, // 60 seconds
    backoffMultiplier: 2,
    jitter: true,
  };

  private constructor() {}

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Parse rate limit headers from OpenRouter response
   */
  parseRateLimitHeaders(headers: Headers): RateLimitState {
    const requestLimit = headers.get('x-ratelimit-limit-requests');
    const requestRemaining = headers.get('x-ratelimit-remaining-requests');
    const requestReset = headers.get('x-ratelimit-reset-requests');
    
    const tokenLimit = headers.get('x-ratelimit-limit-tokens');
    const tokenRemaining = headers.get('x-ratelimit-remaining-tokens');
    const tokenReset = headers.get('x-ratelimit-reset-tokens');

    const requests: RateLimitInfo = {
      limit: requestLimit ? parseInt(requestLimit, 10) : null,
      remaining: requestRemaining ? parseInt(requestRemaining, 10) : null,
      reset: requestReset ? parseInt(requestReset, 10) : null,
    };

    const tokens: RateLimitInfo = {
      limit: tokenLimit ? parseInt(tokenLimit, 10) : null,
      remaining: tokenRemaining ? parseInt(tokenRemaining, 10) : null,
      reset: tokenReset ? parseInt(tokenReset, 10) : null,
    };

    // Add reset dates for easier handling
    if (requests.reset) {
      requests.resetDate = new Date(requests.reset * 1000);
    }
    if (tokens.reset) {
      tokens.resetDate = new Date(tokens.reset * 1000);
    }

    const isRateLimited = (requests.remaining !== null && requests.remaining <= 0) ||
                         (tokens.remaining !== null && tokens.remaining <= 0);

    const state: RateLimitState = {
      requests,
      tokens,
      lastUpdated: Date.now(),
      isRateLimited,
    };

    // Calculate retry after time if rate limited
    if (isRateLimited) {
      const now = Math.floor(Date.now() / 1000);
      const requestResetTime = requests.reset || 0;
      const tokenResetTime = tokens.reset || 0;
      const nextResetTime = Math.max(requestResetTime, tokenResetTime);
      
      if (nextResetTime > now) {
        state.retryAfter = nextResetTime - now;
      }
    }

    this.rateLimitState = state;
    return state;
  }

  /**
   * Get current rate limit state
   */
  getRateLimitState(): RateLimitState | null {
    return this.rateLimitState;
  }

  /**
   * Check if we should wait before making a request based on client-side tracking
   */
  shouldWaitBeforeRequest(): { shouldWait: boolean; waitTime?: number } {
    const now = Date.now();
    
    // Clean old requests (older than 1 minute)
    this.requestHistory = this.requestHistory.filter(timestamp => 
      now - timestamp < 60000
    );

    // If we have rate limit info from server, use it
    if (this.rateLimitState && this.rateLimitState.isRateLimited) {
      const resetTime = Math.max(
        this.rateLimitState.requests.reset || 0,
        this.rateLimitState.tokens.reset || 0
      ) * 1000; // Convert to milliseconds

      if (resetTime > now) {
        return {
          shouldWait: true,
          waitTime: Math.ceil((resetTime - now) / 1000), // Convert to seconds
        };
      }
    }

    // Client-side rate limiting for free models (20 requests per minute)
    if (this.requestHistory.length >= 20) {
      const oldestRequest = this.requestHistory[0];
      const timeSinceOldest = now - oldestRequest;
      
      if (timeSinceOldest < 60000) { // Less than 1 minute
        const waitTime = Math.ceil((60000 - timeSinceOldest) / 1000);
        return {
          shouldWait: true,
          waitTime,
        };
      }
    }

    return { shouldWait: false };
  }

  /**
   * Record a request timestamp
   */
  recordRequest(): void {
    const now = Date.now();
    this.requestHistory.push(now);
    
    // Keep history size manageable
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  calculateBackoffDelay(
    attempt: number, 
    config: Partial<RetryConfig> = {}
  ): number {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    
    let delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
    delay = Math.min(delay, finalConfig.maxDelay);
    
    if (finalConfig.jitter) {
      // Add jitter: ±25% of the delay
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(delay, 0);
  }

  /**
   * Create a rate limit error with proper typing
   */
  createRateLimitError(
    message: string, 
    status: number, 
    retryAfter?: number
  ): RateLimitError {
    const error = new Error(message) as RateLimitError;
    error.status = status;
    error.isRateLimitError = true;
    error.rateLimitInfo = this.rateLimitState || undefined;
    error.retryAfter = retryAfter;
    return error;
  }

  /**
   * Check if an error is a rate limit error
   */
  isRateLimitError(error: any): error is RateLimitError {
    return error && error.isRateLimitError === true;
  }

  /**
   * Get user-friendly rate limit message
   */
  getRateLimitMessage(error: RateLimitError): string {
    const state = error.rateLimitInfo || this.rateLimitState;
    
    if (!state) {
      return 'Rate limit exceeded. Please wait a moment before trying again.';
    }

    const { requests, tokens } = state;
    const now = Math.floor(Date.now() / 1000);
    
    // Check which limit was hit
    const requestsExceeded = requests.remaining !== null && requests.remaining <= 0;
    const tokensExceeded = tokens.remaining !== null && tokens.remaining <= 0;
    
    let message = 'Rate limit exceeded. ';
    
    if (requestsExceeded && tokensExceeded) {
      message += 'Both request and token limits have been reached.';
    } else if (requestsExceeded) {
      message += 'Request limit reached.';
    } else if (tokensExceeded) {
      message += 'Token limit reached.';
    } else {
      message += 'Please wait before making another request.';
    }
    
    // Add time until reset
    const requestResetTime = requests.reset || 0;
    const tokenResetTime = tokens.reset || 0;
    const nextResetTime = Math.max(requestResetTime, tokenResetTime);
    
    if (nextResetTime > now) {
      const waitMinutes = Math.ceil((nextResetTime - now) / 60);
      message += ` Please wait ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''} before trying again.`;
    }
    
    return message;
  }

  /**
   * Reset rate limit state (useful for testing or manual reset)
   */
  reset(): void {
    this.rateLimitState = null;
    this.requestHistory = [];
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance();
