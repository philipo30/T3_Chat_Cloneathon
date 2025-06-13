import React, { memo, useState } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useReasoningSettings } from '@/stores/ReasoningStore';

interface ReasoningDisplayProps {
  reasoning: string;
  messageId: string;
  className?: string;
  isComplete?: boolean;
}

/**
 * Component to display AI reasoning tokens in a collapsible, visually distinct format
 * Features dark purple theme, clean minimal design, and full markdown support
 */
const PureReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoning,
  messageId,
  className = '',
  isComplete = true
}) => {
  const { settings } = useReasoningSettings();
  const [isExpanded, setIsExpanded] = useState(settings.showByDefault);

  if (!reasoning || reasoning.trim() === '') {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 pb-3 max-w-full w-full ${className}`}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[rgb(var(--chat-message-username))] opacity-75 hover:opacity-100 transition-opacity duration-150 cursor-pointer group"
        aria-expanded={isExpanded}
        aria-controls={`reasoning-content-${messageId}`}
      >
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium">AI Reasoning</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 transition-transform duration-150 group-hover:scale-110" />
        ) : (
          <ChevronDown className="w-4 h-4 transition-transform duration-150 group-hover:scale-110" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div 
          id={`reasoning-content-${messageId}`}
          className="reasoning-content rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-purple-800/5 backdrop-blur-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(126, 34, 206, 0.04) 100%)',
          }}
        >
          {/* Content Header */}
          <div className="px-4 py-2 border-b border-purple-500/10 bg-purple-900/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-300 opacity-75">
                Internal Reasoning Process
              </span>
              {!isComplete && (
                <span className="text-xs text-yellow-400 opacity-75">
                  ⚠️ Truncated
                </span>
              )}
            </div>
          </div>

          {/* Reasoning Content */}
          <div className="p-4">
            <MarkdownRenderer
              content={reasoning}
              className="reasoning-markdown text-sm text-[rgb(var(--chat-message-text))] opacity-90"
              isStreaming={false}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .reasoning-content {
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.1);
        }
        
        .reasoning-markdown {
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .reasoning-markdown h1,
        .reasoning-markdown h2,
        .reasoning-markdown h3,
        .reasoning-markdown h4,
        .reasoning-markdown h5,
        .reasoning-markdown h6 {
          color: rgb(var(--chat-message-text));
          opacity: 0.95;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .reasoning-markdown p {
          margin-bottom: 0.75rem;
        }
        
        .reasoning-markdown code {
          background-color: rgba(147, 51, 234, 0.15);
          color: rgb(var(--chat-message-text));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.8125rem;
        }
        
        .reasoning-markdown pre {
          background-color: rgba(147, 51, 234, 0.1);
          border: 1px solid rgba(147, 51, 234, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 0.75rem 0;
          overflow-x: auto;
        }
        
        .reasoning-markdown blockquote {
          border-left: 3px solid rgba(147, 51, 234, 0.4);
          padding-left: 1rem;
          margin: 0.75rem 0;
          opacity: 0.8;
        }
        
        .reasoning-markdown ul,
        .reasoning-markdown ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .reasoning-markdown li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export const ReasoningDisplay = memo(PureReasoningDisplay, (prevProps, nextProps) => {
  return (
    prevProps.reasoning === nextProps.reasoning &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.className === nextProps.className &&
    prevProps.isComplete === nextProps.isComplete
  );
});

ReasoningDisplay.displayName = 'ReasoningDisplay';
