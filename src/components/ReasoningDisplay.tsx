import React, { memo, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getReasoningModelInfoFromAPI } from '@/lib/reasoning-models';
import type { OpenRouterModel } from '@/lib/types';

interface ReasoningDisplayProps {
  reasoning: string;
  messageId: string;
  className?: string;
  isComplete?: boolean;
  model?: OpenRouterModel | null; // Add model prop for context-aware detection
}

/**
 * Extract the last part of reasoning text for preview
 * Shows the conclusion/end of the reasoning
 */
const getLastPartOfReasoning = (text: string): string => {
  if (!text) return '';

  // If text is short enough, show it all
  if (text.length <= 400) return text;

  // Get a substantial chunk from the end
  const lastChunk = text.slice(-400);

  // Try to find a good starting point (sentence or paragraph break)
  const breakPatterns = ['\n\n', '. ', '.\n', '! ', '?\n'];
  let bestStart = 0;

  for (const pattern of breakPatterns) {
    const index = lastChunk.indexOf(pattern);
    if (index > 100 && index < 300) { // Sweet spot for readable content
      bestStart = index + pattern.length;
      break;
    }
  }

  // Extract the final part
  const finalPart = bestStart > 0 ? lastChunk.slice(bestStart) : lastChunk.slice(-400);

  // Add ellipsis if we're showing a truncated version
  return bestStart > 0 || text.length > 600 ? '...' + finalPart : finalPart;
};

/**
 * Component to display AI reasoning tokens in a collapsible, visually distinct format
 * Features dark purple theme, clean minimal design, and full markdown support
 */
const PureReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoning,
  messageId,
  className = '',
  isComplete = true,
  model = null
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Check if the model actually supports reasoning using our improved detection
  const modelSupportsReasoning = model ? getReasoningModelInfoFromAPI(model).supportsReasoning : true;

  // Handle smooth transitions
  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const renderTimer = setTimeout(() => setShouldRender(false), 250);
      return () => {
        clearTimeout(renderTimer);
      };
    }
  }, [isExpanded]);

  // Don't render if no reasoning content
  if (!reasoning || reasoning.trim() === '') {
    return null;
  }

  // Don't render if model doesn't support reasoning (context-aware hiding)
  if (model && !modelSupportsReasoning) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`flex flex-col gap-3 pb-3 max-w-full w-full ${className}`}>
        {/* Compact Toggle Button */}
        <button
          onClick={toggleExpanded}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgb(var(--reasoning-content-bg))]/60 text-[rgb(var(--reasoning-header-text))] hover:text-[rgb(var(--reasoning-text))] hover:bg-[rgb(var(--reasoning-content-bg))]/90 hover:border-[rgb(var(--reasoning-header-icon))]/30 transition-all duration-200 group self-start backdrop-blur-sm"
          aria-expanded={isExpanded}
          aria-controls={`reasoning-content-${messageId}`}
          aria-label={isExpanded ? 'Hide AI reasoning' : 'Show AI reasoning'}
        >
          <Brain className="w-3.5 h-3.5 text-[rgb(var(--reasoning-header-icon))] transition-all duration-200 group-hover:scale-110" />
          <span className="text-xs font-medium whitespace-nowrap">
            AI Reasoning
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 transition-transform duration-200 group-hover:scale-110 opacity-70" />
          ) : (
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:scale-110 opacity-70" />
          )}
        </button>

        {/* Reasoning Content Window - Unified for both states */}
        {(shouldRender || !isExpanded) && (
          <div
            className={`reasoning-window cursor-pointer ${
              !isExpanded
                ? 'reasoning-preview-state'
                : isClosing
                  ? 'reasoning-content-exit'
                  : 'reasoning-content-enter'
            }`}
            onClick={!isExpanded ? toggleExpanded : undefined}
          >
            {/* Content Container */}
            <div className={`${isExpanded ? 'reasoning-content-container' : 'reasoning-preview-container'}`}>
              <div className={`${isExpanded ? 'reasoning-content-inner' : 'reasoning-preview-content'}`}>
                <MarkdownRenderer
                  content={isExpanded ? reasoning : getLastPartOfReasoning(reasoning)}
                  className={`${isExpanded ? 'reasoning-markdown' : 'reasoning-preview-markdown'}`}
                  isStreaming={false}
                />
              </div>
            </div>
          </div>
        )}

    </div>
  );

};

export const ReasoningDisplay = memo(PureReasoningDisplay, (prevProps, nextProps) => {
  return (
    prevProps.reasoning === nextProps.reasoning &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.className === nextProps.className &&
    prevProps.isComplete === nextProps.isComplete &&
    prevProps.model?.id === nextProps.model?.id
  );
});

ReasoningDisplay.displayName = 'ReasoningDisplay';
