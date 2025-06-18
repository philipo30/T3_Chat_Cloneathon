import React, { memo, useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useReasoningSettings } from '@/stores/ReasoningStore';
import { getReasoningModelInfo, getReasoningModelInfoFromAPI } from '@/lib/reasoning-models';
import { useQuery } from '@tanstack/react-query';
import type { OpenRouterModel } from '@/lib/types';

interface ReasoningControlsProps {
  className?: string;
  selectedModelId?: string;
}

/**
 * Controls for managing reasoning token settings
 * Provides easy access to reasoning configuration options
 */
const PureReasoningControls: React.FC<ReasoningControlsProps> = ({
  className = '',
  selectedModelId = ''
}) => {
  const {
    settings,
    setEffort,
    setMaxTokens,
  } = useReasoningSettings();

  const [customTokens, setCustomTokens] = useState(settings.maxTokens?.toString() || '2000');
  const [isVisible, setIsVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch model data for enhanced reasoning detection
  const { data: modelData } = useQuery<OpenRouterModel[]>({
    queryKey: ['openrouter-models'],
    queryFn: async () => {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data.data;
    },
    enabled: !!selectedModelId, // Only fetch when we have a model ID
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Find the specific model and get enhanced reasoning info
  const currentModel = modelData?.find(model => model.id === selectedModelId);
  const modelInfo = currentModel
    ? getReasoningModelInfoFromAPI(currentModel)
    : getReasoningModelInfo(selectedModelId); // Fallback to pattern matching

  // Update visibility based on model support
  useEffect(() => {
    setIsVisible(modelInfo.supportsReasoning);
  }, [modelInfo.supportsReasoning]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleTokensChange = (value: string) => {
    setCustomTokens(value);
    const tokens = parseInt(value);
    if (!isNaN(tokens) && tokens > 0) {
      setMaxTokens(tokens);
    }
  };



  // Don't render anything if model doesn't support reasoning
  if (!modelInfo.supportsReasoning) {
    return null;
  }

  return (
    <div className={`relative flex items-center transition-all duration-300 ease-in-out ${
      isVisible
        ? 'opacity-100 translate-x-0 scale-100'
        : 'opacity-0 translate-x-2 scale-95 pointer-events-none'
    } ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1 h-8 px-2 text-xs rounded-md transition-colors duration-150 text-[rgb(var(--reasoning-header-icon))] hover:text-[rgb(var(--reasoning-text))] hover:bg-[rgb(var(--reasoning-content-bg))]/20"
        aria-label="Reasoning settings"
      >
        <Brain className="w-3 h-3 text-[rgb(var(--reasoning-header-icon))]" />
        <span className="hidden sm:inline">Reasoning</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </Button>

      {/* Custom Dropdown Content */}
      {isDropdownOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-[rgb(var(--app-main-background))] border border-[rgb(var(--app-main-border))] rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-[rgb(var(--app-main-border))]">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[rgb(var(--chat-input-button-text))]" />
              <span className="font-semibold text-[rgb(var(--login-form-title-text))]">Reasoning Settings</span>
            </div>
          </div>

          {/* Effort Level - only show for models that support effort */}
          {(modelInfo.parameterType === 'effort' || modelInfo.parameterType === 'both') && (
            <div className="px-4 py-3 border-[rgb(var(--app-main-border))]">
              <h4 className="text-sm font-medium text-[rgb(var(--login-form-title-text))] mb-3">Effort Level</h4>
              <div className="space-y-2">
                {(['high', 'medium', 'low'] as const).map((effort) => (
                  <button
                    key={effort}
                    onClick={() => setEffort(effort)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      settings.effort === effort
                        ? 'bg-[rgb(var(--welcome-screen-button-hover-background))] text-[rgb(var(--login-form-title-text))]'
                        : 'hover:bg-[rgb(var(--welcome-screen-button-hover-background))] text-[rgb(var(--chat-input-button-text))]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{effort}</span>
                      {settings.effort === effort && (
                        <span className="text-[rgb(var(--chat-input-send-button-background))] font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Token Limit - only show for models that support max_tokens */}
          {(modelInfo.parameterType === 'max_tokens' || modelInfo.parameterType === 'both') && (
            <div className="px-4 py-3 border-[rgb(var(--app-main-border))]">
              <h4 className="text-sm font-medium text-[rgb(var(--login-form-title-text))] mb-3">
                {modelInfo.parameterType === 'max_tokens' ? 'Max Tokens' : 'Max Tokens (Optional)'}
              </h4>
              <input
                type="number"
                value={customTokens}
                onChange={(e) => handleTokensChange(e.target.value)}
                placeholder="2000"
                min="100"
                max="8000"
                className="w-full px-3 py-2 text-sm bg-[rgb(var(--welcome-screen-button-background))] border border-[rgb(var(--app-main-border))] rounded-lg text-[rgb(var(--login-form-title-text))] placeholder:text-[rgb(var(--chat-input-button-text))] focus:ring-2 focus:ring-[rgb(var(--chat-input-send-button-background))] focus:outline-none transition-all duration-200"
              />
              <p className="text-xs text-[rgb(var(--chat-input-button-text))] opacity-70 mt-2 leading-relaxed">
                {modelInfo.parameterType === 'max_tokens'
                  ? 'Specify reasoning token budget. Higher values increase quality but also cost.'
                  : 'Leave empty to use effort level. Higher values increase response quality but also cost.'
                }
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export const ReasoningControls = memo(PureReasoningControls, (prevProps, nextProps) => {
  return (
    prevProps.className === nextProps.className &&
    prevProps.selectedModelId === nextProps.selectedModelId
  );
});

ReasoningControls.displayName = 'ReasoningControls';
