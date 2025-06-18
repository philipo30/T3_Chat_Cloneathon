/**
 * Cache monitoring utilities for tracking prompt caching performance
 */

export interface CacheMetrics {
  totalRequests: number;
  cachedRequests: number;
  cacheHitRate: number;
  totalTokensSaved: number;
  totalCostSaved: number;
  lastUpdated: Date;
}

class CacheMonitor {
  private metrics: CacheMetrics = {
    totalRequests: 0,
    cachedRequests: 0,
    cacheHitRate: 0,
    totalTokensSaved: 0,
    totalCostSaved: 0,
    lastUpdated: new Date(),
  };

  /**
   * Record a request with cache information
   */
  recordRequest(options: {
    wasCached: boolean;
    tokensSaved?: number;
    costSaved?: number;
  }): void {
    this.metrics.totalRequests++;
    
    if (options.wasCached) {
      this.metrics.cachedRequests++;
      this.metrics.totalTokensSaved += options.tokensSaved || 0;
      this.metrics.totalCostSaved += options.costSaved || 0;
    }

    this.metrics.cacheHitRate = this.metrics.cachedRequests / this.metrics.totalRequests;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      cachedRequests: 0,
      cacheHitRate: 0,
      totalTokensSaved: 0,
      totalCostSaved: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get formatted metrics for logging
   */
  getFormattedMetrics(): string {
    const { totalRequests, cachedRequests, cacheHitRate, totalTokensSaved, totalCostSaved } = this.metrics;
    
    return `Cache Performance:
  - Total Requests: ${totalRequests}
  - Cached Requests: ${cachedRequests}
  - Cache Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%
  - Tokens Saved: ${totalTokensSaved.toLocaleString()}
  - Cost Saved: $${totalCostSaved.toFixed(4)}`;
  }
}

// Global cache monitor instance
export const cacheMonitor = new CacheMonitor();

/**
 * Log cache performance metrics
 */
export function logCacheMetrics(): void {
  console.log(cacheMonitor.getFormattedMetrics());
}

/**
 * Extract cache information from OpenRouter generation metadata
 */
export function extractCacheInfo(metadata: any): {
  wasCached: boolean;
  tokensSaved: number;
  costSaved: number;
} {
  // OpenRouter provides cache_discount in generation metadata
  const cacheDiscount = metadata?.cache_discount || 0;
  const tokensPrompt = metadata?.tokens_prompt || 0;
  const totalCost = metadata?.total_cost || 0;
  
  // Positive cache_discount indicates savings
  const wasCached = cacheDiscount > 0;
  const costSaved = wasCached ? totalCost * cacheDiscount : 0;
  
  // Estimate tokens saved (rough approximation)
  const tokensSaved = wasCached ? Math.floor(tokensPrompt * cacheDiscount) : 0;
  
  return {
    wasCached,
    tokensSaved,
    costSaved,
  };
}

/**
 * Hook for React components to access cache metrics
 */
export function useCacheMetrics(): {
  metrics: CacheMetrics;
  recordRequest: (options: { wasCached: boolean; tokensSaved?: number; costSaved?: number }) => void;
  reset: () => void;
} {
  return {
    metrics: cacheMonitor.getMetrics(),
    recordRequest: (options) => cacheMonitor.recordRequest(options),
    reset: () => cacheMonitor.reset(),
  };
}
