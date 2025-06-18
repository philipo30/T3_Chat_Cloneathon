import { useQuery } from '@tanstack/react-query'
import { OpenRouterClient } from '@/lib/api/openrouter'
import { useApiKey } from '@/hooks/useApiKey'
import type { GenerationMetadata } from '@/lib/types'

interface UseGenerationMetadataOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}

/**
 * Hook to fetch and cache generation metadata from OpenRouter
 * Provides comprehensive information about AI generation including tokens, cost, timing, etc.
 */
export function useGenerationMetadata(
  generationId: string | null | undefined,
  options: UseGenerationMetadataOptions = {}
) {
  const { apiKey } = useApiKey()
  const {
    enabled = true,
    staleTime = 1000 * 60 * 60, // 1 hour - metadata doesn't change
    cacheTime = 1000 * 60 * 60 * 24, // 24 hours
  } = options

  return useQuery<GenerationMetadata, Error>({
    queryKey: ['generation-metadata', generationId],
    queryFn: async () => {
      if (!apiKey) {
        throw new Error('API key is required to fetch generation metadata')
      }
      if (!generationId) {
        throw new Error('Generation ID is required')
      }

      const client = new OpenRouterClient(apiKey)
      return await client.getGeneration(generationId)
    },
    enabled: enabled && !!apiKey && !!generationId,
    staleTime,
    gcTime: cacheTime,
    retry: (failureCount, error) => {
      // Don't retry on 404 (generation not found) or 401 (unauthorized)
      if (error.message.includes('404') || error.message.includes('401')) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook to fetch multiple generation metadata entries
 * Useful for batch loading metadata for multiple messages
 */
export function useMultipleGenerationMetadata(
  generationIds: (string | null | undefined)[],
  options: UseGenerationMetadataOptions = {}
) {
  const { apiKey } = useApiKey()
  const validIds = generationIds.filter((id): id is string => !!id)

  return useQuery<GenerationMetadata[], Error>({
    queryKey: ['generation-metadata-batch', validIds],
    queryFn: async () => {
      if (!apiKey) {
        throw new Error('API key is required to fetch generation metadata')
      }
      if (validIds.length === 0) {
        return []
      }

      const client = new OpenRouterClient(apiKey)
      
      // Fetch all metadata in parallel
      const results = await Promise.allSettled(
        validIds.map(id => client.getGeneration(id))
      )

      // Return successful results, filter out failed ones
      return results
        .filter((result): result is PromiseFulfilledResult<GenerationMetadata> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
    },
    enabled: options.enabled !== false && !!apiKey && validIds.length > 0,
    staleTime: options.staleTime ?? 1000 * 60 * 60, // 1 hour
    gcTime: options.cacheTime ?? 1000 * 60 * 60 * 24, // 24 hours
    retry: false, // Don't retry batch requests to avoid overwhelming the API
  })
}

/**
 * Utility function to format cost in a user-friendly way
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'Free'
  if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}k` // Show in thousandths
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  if (cost < 1) return `$${cost.toFixed(3)}`
  return `$${cost.toFixed(2)}`
}

/**
 * Utility function to format duration in a user-friendly way
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds}ms`
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`
  const minutes = Math.floor(milliseconds / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Utility function to format token counts with commas
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString()
}

/**
 * Utility function to calculate tokens per second
 */
export function calculateTokensPerSecond(tokens: number, durationMs: number): number {
  if (durationMs === 0) return 0
  return (tokens / durationMs) * 1000
}

/**
 * Utility function to get a human-readable model name
 */
export function getModelDisplayName(modelId: string): string {
  // Remove common prefixes and make more readable
  const cleanId = modelId
    .replace(/^(openai\/|anthropic\/|google\/|meta-llama\/|mistralai\/|cohere\/|01-ai\/|qwen\/|deepseek\/|alibaba\/)/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gemini-pro': 'Gemini Pro',
    'llama-3.1-405b': 'Llama 3.1 405B',
    'llama-3.1-70b': 'Llama 3.1 70B',
    'llama-3.1-8b': 'Llama 3.1 8B',
  }

  return specialCases[modelId] || cleanId
}

/**
 * Utility function to determine if metadata is available for a message
 */
export function hasGenerationMetadata(message: { generation_id?: string | null, role: string }): boolean {
  return message.role === 'assistant' && !!message.generation_id
}

/**
 * Utility function to get cache discount percentage
 */
export function getCacheDiscountPercentage(metadata: GenerationMetadata): number {
  if (metadata.total_cost === 0) return 0
  return (metadata.cache_discount / metadata.total_cost) * 100
}
