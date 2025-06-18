import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import type { WebSearchAnnotation } from '@/lib/types';

interface WebSearchAnnotationsProps {
  annotations: WebSearchAnnotation[];
  className?: string;
}

export const WebSearchAnnotations: React.FC<WebSearchAnnotationsProps> = ({
  annotations,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Handle smooth transitions similar to ReasoningDisplay
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

  if (!annotations || annotations.length === 0) {
    return null;
  }

  // Filter for URL citations only
  const urlCitations = annotations.filter(annotation => annotation.type === 'url_citation');

  if (urlCitations.length === 0) {
    return null;
  }

  return (
    <div className={`mt-2 bg-[rgb(var(--websearch-content-bg))] rounded-lg border border-[rgb(var(--websearch-content-border))] shadow-sm ${className}`}>
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[rgb(var(--websearch-header-bg))] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[rgb(var(--websearch-header-icon))]" />
          <span className="text-sm font-medium text-[rgb(var(--websearch-text))]">
            Web Search Results ({urlCitations.length})
          </span>
        </div>
        <button
          className="p-1 rounded-md hover:bg-[rgb(var(--websearch-content-bg))] transition-colors"
          title={isExpanded ? "Minimize web search results" : "Expand web search results"}
        >
          <div className="transition-transform duration-200 ease-in-out">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[rgb(var(--websearch-header-text))] hover:text-[rgb(var(--websearch-header-icon))] transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[rgb(var(--websearch-header-text))] hover:text-[rgb(var(--websearch-header-icon))] transition-colors" />
            )}
          </div>
        </button>
      </div>

      {/* Collapsible Content with smooth animations and scrolling */}
      {shouldRender && (
        <div
          className={`websearch-scrollable max-h-96 overflow-y-auto px-5 pt-2 pb-5 space-y-3 ${
            isExpanded && !isClosing
              ? 'websearch-content-enter'
              : isClosing
              ? 'websearch-content-exit'
              : ''
          }`}
        >
          {urlCitations.map((annotation, index) => {
            const { url_citation } = annotation;
            const domain = new URL(url_citation.url).hostname.replace('www.', '');

            return (
              <div
                key={index}
                className="websearch-result-item flex items-start gap-4 p-4 bg-[rgb(var(--websearch-header-bg))] rounded-lg border border-[rgb(var(--websearch-header-border))] hover:border-[rgb(var(--websearch-header-icon))]"
              >
                <ExternalLink className="w-4 h-4 text-[rgb(var(--websearch-header-text))] mt-1 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <a
                    href={url_citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-[rgb(var(--websearch-link-color))] hover:text-[rgb(var(--websearch-link-hover))] hover:underline line-clamp-2 transition-colors leading-relaxed"
                  >
                    {url_citation.title}
                  </a>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[rgb(var(--websearch-header-text))]">
                      {domain}
                    </span>
                  </div>

                  {url_citation.content && (
                    <p className="text-xs text-[rgb(var(--websearch-text))] mt-3 line-clamp-2 opacity-80 leading-relaxed">
                      {url_citation.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-4 px-2 text-xs text-[rgb(var(--websearch-header-text))] opacity-75 leading-relaxed">
            Sources found via web search • Click links to view full articles
          </div>
        </div>
      )}
    </div>
  );
};
