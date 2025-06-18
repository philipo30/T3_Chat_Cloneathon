import { useCallback, useEffect } from 'react';
import { useRateLimitStore } from '@/stores/RateLimitStore';
import { rateLimitService } from '@/lib/services/rate-limit-service';
import { useToast } from '@/hooks/use-toast';
import type { RateLimitError, RetryConfig } from '@/lib/types';

interface UseRateLimitOptions {
  showToasts?: boolean;
  autoRetry?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

interface UseRateLimitReturn {
  isRateLimited: boolean;
  isRetrying: boolean;
  retryAttempt: number;
  timeUntilReset: number | null;
  remainingRequests: number | null;
  remainingTokens: number | null;
  
  // Actions
  handleRateLimitError: (error: RateLimitError) => Promise<void>;
  executeWithRateLimit: <T>(
    fn: () => Promise<T>,
    options?: { maxRetries?: number }
  ) => Promise<T>;
  clearRateLimit: () => void;
}

export function useRateLimit(options: UseRateLimitOptions = {}): UseRateLimitReturn {
  const {
    showToasts = true,
    autoRetry = true,
    retryConfig = {},
  } = options;

  const { toast } = useToast();
  
  const {
    rateLimitState,
    isRetrying,
    retryAttempt,
    setRateLimitState,
    setRetrying,
    setNextRetryTime,
    clearRateLimit: clearStoredRateLimit,
    isRateLimited,
    getTimeUntilReset,
    getRemainingRequests,
    getRemainingTokens,
  } = useRateLimitStore();

  // Handle rate limit errors
  const handleRateLimitError = useCallback(async (error: RateLimitError) => {
    console.warn('Rate limit error:', error);
    
    // Update store with rate limit info
    if (error.rateLimitInfo) {
      setRateLimitState(error.rateLimitInfo);
    }

    // Show user-friendly toast notification
    if (showToasts) {
      const message = rateLimitService.getRateLimitMessage(error);
      toast({
        title: "Rate Limit Reached",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [setRateLimitState, showToasts, toast]);

  // Execute function with automatic rate limit handling and retry
  const executeWithRateLimit = useCallback(async <T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number } = {}
  ): Promise<T> => {
    const maxRetries = options.maxRetries ?? 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Check if we should wait before making request
        const { shouldWait, waitTime } = rateLimitService.shouldWaitBeforeRequest();
        
        if (shouldWait && waitTime) {
          if (attempt === 0) {
            // First attempt - show waiting message
            if (showToasts) {
              toast({
                title: "Rate Limit Active",
                description: `Waiting ${waitTime} seconds before retrying...`,
                duration: 3000,
              });
            }
          }
          
          setRetrying(true, attempt);
          setNextRetryTime(Date.now() + (waitTime * 1000));
          
          // Wait for the specified time
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }

        // Record the request attempt
        rateLimitService.recordRequest();
        
        // Execute the function
        const result = await fn();
        
        // Success - clear retry state
        setRetrying(false, 0);
        setNextRetryTime(null);
        
        return result;
        
      } catch (error: any) {
        // Check if it's a rate limit error
        if (rateLimitService.isRateLimitError(error)) {
          await handleRateLimitError(error);
          
          if (attempt < maxRetries && autoRetry) {
            attempt++;
            
            // Calculate backoff delay
            const delay = rateLimitService.calculateBackoffDelay(attempt - 1, retryConfig);
            
            if (showToasts && attempt <= maxRetries) {
              toast({
                title: `Retrying (${attempt}/${maxRetries})`,
                description: `Waiting ${Math.ceil(delay / 1000)} seconds before retry...`,
                duration: 3000,
              });
            }
            
            setRetrying(true, attempt);
            setNextRetryTime(Date.now() + delay);
            
            // Wait for backoff delay
            await new Promise(resolve => setTimeout(resolve, delay));
            
            continue; // Retry
          }
        }
        
        // Not a rate limit error or max retries reached
        setRetrying(false, 0);
        setNextRetryTime(null);
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Max retries exceeded');
  }, [
    handleRateLimitError,
    setRetrying,
    setNextRetryTime,
    showToasts,
    toast,
    autoRetry,
    retryConfig,
  ]);

  // Clear rate limit state
  const clearRateLimit = useCallback(() => {
    clearStoredRateLimit();
    rateLimitService.reset();
  }, [clearStoredRateLimit]);

  // Auto-clear rate limit state when reset time is reached
  useEffect(() => {
    if (!rateLimitState?.isRateLimited) return;

    const timeUntilReset = getTimeUntilReset();
    if (!timeUntilReset) return;

    const timeout = setTimeout(() => {
      clearRateLimit();
      
      if (showToasts) {
        toast({
          title: "Rate Limit Reset",
          description: "You can now make requests again.",
          duration: 3000,
        });
      }
    }, timeUntilReset * 1000);

    return () => clearTimeout(timeout);
  }, [rateLimitState, getTimeUntilReset, clearRateLimit, showToasts, toast]);

  return {
    isRateLimited: isRateLimited(),
    isRetrying,
    retryAttempt,
    timeUntilReset: getTimeUntilReset(),
    remainingRequests: getRemainingRequests(),
    remainingTokens: getRemainingTokens(),
    
    handleRateLimitError,
    executeWithRateLimit,
    clearRateLimit,
  };
}
