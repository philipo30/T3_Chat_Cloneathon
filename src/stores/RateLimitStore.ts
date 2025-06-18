import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { RateLimitState } from '@/lib/types';

interface RateLimitStore {
  // State
  rateLimitState: RateLimitState | null;
  isRetrying: boolean;
  retryAttempt: number;
  nextRetryTime: number | null;
  
  // Actions
  setRateLimitState: (state: RateLimitState | null) => void;
  setRetrying: (isRetrying: boolean, attempt?: number) => void;
  setNextRetryTime: (time: number | null) => void;
  clearRateLimit: () => void;
  
  // Computed values
  isRateLimited: () => boolean;
  getTimeUntilReset: () => number | null;
  getRemainingRequests: () => number | null;
  getRemainingTokens: () => number | null;
}

export const useRateLimitStore = create<RateLimitStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    rateLimitState: null,
    isRetrying: false,
    retryAttempt: 0,
    nextRetryTime: null,

    // Actions
    setRateLimitState: (state) => {
      set({ rateLimitState: state });
    },

    setRetrying: (isRetrying, attempt = 0) => {
      set({ isRetrying, retryAttempt: attempt });
    },

    setNextRetryTime: (time) => {
      set({ nextRetryTime: time });
    },

    clearRateLimit: () => {
      set({
        rateLimitState: null,
        isRetrying: false,
        retryAttempt: 0,
        nextRetryTime: null,
      });
    },

    // Computed values
    isRateLimited: () => {
      const state = get().rateLimitState;
      return state?.isRateLimited || false;
    },

    getTimeUntilReset: () => {
      const state = get().rateLimitState;
      if (!state) return null;

      const now = Math.floor(Date.now() / 1000);
      const requestReset = state.requests.reset || 0;
      const tokenReset = state.tokens.reset || 0;
      const nextReset = Math.max(requestReset, tokenReset);

      return nextReset > now ? nextReset - now : null;
    },

    getRemainingRequests: () => {
      const state = get().rateLimitState;
      return state?.requests.remaining || null;
    },

    getRemainingTokens: () => {
      const state = get().rateLimitState;
      return state?.tokens.remaining || null;
    },
  }))
);

// Selector hooks for specific parts of the state
export const useRateLimitState = () => useRateLimitStore((state) => state.rateLimitState);
export const useIsRateLimited = () => useRateLimitStore((state) => state.isRateLimited());
export const useIsRetrying = () => useRateLimitStore((state) => state.isRetrying);
export const useRetryAttempt = () => useRateLimitStore((state) => state.retryAttempt);
export const useTimeUntilReset = () => useRateLimitStore((state) => state.getTimeUntilReset());
export const useRemainingRequests = () => useRateLimitStore((state) => state.getRemainingRequests());
export const useRemainingTokens = () => useRateLimitStore((state) => state.getRemainingTokens());
