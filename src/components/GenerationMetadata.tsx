import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, DollarSign, Zap, Server, Info } from 'lucide-react'
import {
  useGenerationMetadata,
  formatCost,
  formatDuration,
  formatTokens,
  calculateTokensPerSecond,
  getModelDisplayName,
  getCacheDiscountPercentage
} from '@/hooks/useGenerationMetadata'
import type { Message } from '@/lib/supabase/database.types'
import type { GenerationMetadata as GenerationMetadataType } from '@/lib/types'

interface GenerationMetadataProps {
  message: Message
  className?: string
}

/**
 * Component to display comprehensive generation metadata for AI assistant messages
 * Shows model info, token usage, cost, timing, and other relevant details
 */
export const GenerationMetadata: React.FC<GenerationMetadataProps> = ({ 
  message, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const {
    data: metadata,
    isLoading,
    error
  } = useGenerationMetadata(message.generation_id, {
    enabled: message.role === 'assistant' && !!message.generation_id
  }) as { data: GenerationMetadataType | undefined, isLoading: boolean, error: any }

  // Don't render for user messages or messages without generation_id
  if (message.role !== 'assistant' || !message.generation_id) {
    return null
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`mt-3 text-xs ${className}`}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5">
          <div className="w-3.5 h-3.5 border-2 border-[rgb(var(--chat-message-username))]/30 border-t-[rgb(var(--primary-button-gradient-from))] rounded-full animate-spin"></div>
          <span className="text-[rgb(var(--chat-message-username))]">Loading metadata...</span>
        </div>
      </div>
    )
  }

  // Show error state (but don't be intrusive)
  if (error) {
    return (
      <div className={`mt-3 text-xs ${className}`}>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 opacity-60">
          <Info className="w-3.5 h-3.5 text-[rgb(var(--chat-message-username))]" />
          <span className="text-[rgb(var(--chat-message-username))]">Metadata unavailable</span>
        </div>
      </div>
    )
  }

  // No metadata available
  if (!metadata) {
    return null
  }

  const totalTokens = metadata.tokens_prompt + metadata.tokens_completion
  const tokensPerSecond = calculateTokensPerSecond(metadata.tokens_completion, metadata.generation_time)
  const cacheDiscountPercent = getCacheDiscountPercentage(metadata)
  const modelDisplayName = getModelDisplayName(metadata.model)

  return (
    <div className={`mt-3 rounded-xl generation-metadata-card ${className}`}>
      {/* Collapsible Header - Aligned left next to buttons */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-start text-xs rounded-lg transition-all duration-200 hover:bg-white/5 dark:hover:bg-white/5 group"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="font-medium text-[rgb(var(--chat-message-text))] text-xs">{modelDisplayName}</span>
          <span className="text-[rgb(var(--chat-message-username))] opacity-60">•</span>
          <span className="text-[rgb(var(--chat-message-username))] text-xs">{formatTokens(totalTokens)}</span>
          <span className="text-[rgb(var(--chat-message-username))] opacity-60">•</span>
          <span className="font-medium text-[rgb(var(--primary-button-gradient-from))] text-xs">{formatCost(metadata.total_cost)}</span>
          <span className="text-[rgb(var(--chat-message-username))] opacity-60">•</span>
          <span className="font-medium text-[rgb(var(--chat-message-username))] text-xs">{formatDuration(metadata.generation_time)}</span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-[rgb(var(--chat-message-username))] transition-transform duration-200 ml-1" />
          ) : (
            <ChevronRight className="w-3 h-3 text-[rgb(var(--chat-message-username))] transition-transform duration-200 group-hover:translate-x-0.5 ml-1" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 p-4 rounded-lg bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 space-y-4 text-xs animate-in slide-in-from-top-2 duration-200">
          {/* Model and Provider Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-[rgb(var(--chat-message-username))] mb-3 pb-1 border-b border-white/10">
                <Server className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">Model & Provider</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Model:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{modelDisplayName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Provider:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{metadata.provider_name}</span>
                </div>
                {metadata.is_byok && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">BYOK:</span>
                    <span className="text-emerald-400 font-medium">Yes</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-[rgb(var(--chat-message-username))] mb-3 pb-1 border-b border-white/10">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">Cost & Usage</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Total Cost:</span>
                  <span className="text-[rgb(var(--primary-button-gradient-from))] font-bold">{formatCost(metadata.total_cost)}</span>
                </div>
                {cacheDiscountPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">Cache Discount:</span>
                    <span className="text-emerald-400 font-medium">-{cacheDiscountPercent.toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Origin:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{metadata.origin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Token Usage */}
          <div>
            <div className="flex items-center gap-2 text-[rgb(var(--chat-message-username))] mb-3 pb-1 border-b border-white/10">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-medium text-xs">Token Usage</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Prompt:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{formatTokens(metadata.tokens_prompt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Completion:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{formatTokens(metadata.tokens_completion)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Total:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-bold">{formatTokens(totalTokens)}</span>
                </div>
                {metadata.native_tokens_reasoning > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">Reasoning:</span>
                    <span className="text-[rgb(var(--chat-message-text))] font-medium">{formatTokens(metadata.native_tokens_reasoning)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Speed:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{tokensPerSecond.toFixed(1)} t/s</span>
                </div>
                {metadata.streamed && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">Streamed:</span>
                    <span className="text-emerald-400 font-medium">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <div className="flex items-center gap-2 text-[rgb(var(--chat-message-username))] mb-3 pb-1 border-b border-white/10">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium text-xs">Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Generation:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{formatDuration(metadata.generation_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Latency:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{formatDuration(metadata.latency)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {metadata.moderation_latency > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">Moderation:</span>
                    <span className="text-[rgb(var(--chat-message-text))] font-medium">{formatDuration(metadata.moderation_latency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[rgb(var(--chat-message-username))] opacity-75">Finish Reason:</span>
                  <span className="text-[rgb(var(--chat-message-text))] font-medium">{metadata.finish_reason}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {(metadata.num_media_prompt > 0 || metadata.num_search_results > 0) && (
            <div>
              <div className="flex items-center gap-2 text-[rgb(var(--chat-message-username))] mb-3 pb-1 border-b border-white/10">
                <Info className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">Additional</span>
              </div>
              <div className="space-y-2">
                {metadata.num_media_prompt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">Media Files:</span>
                    <span className="text-[rgb(var(--chat-message-text))] font-medium">{metadata.num_media_prompt}</span>
                  </div>
                )}
                {metadata.num_search_results > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[rgb(var(--chat-message-username))] opacity-75">Search Results:</span>
                    <span className="text-[rgb(var(--chat-message-text))] font-medium">{metadata.num_search_results}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generation ID for debugging */}
          <div className="pt-3 border-t border-[rgb(var(--chat-message-username))]/20">
            <div className="flex justify-between items-center">
              <span className="text-[rgb(var(--chat-message-username))] opacity-75">Generation ID:</span>
              <span className="text-[rgb(var(--chat-message-username))] opacity-60 font-mono text-[10px]">{metadata.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
