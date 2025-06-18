import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReasoningConfig } from '@/lib/types';
import { getReasoningModelInfo } from '@/lib/reasoning-models';

export interface ReasoningSettings {
  enabled: boolean;
  effort: "high" | "medium" | "low";
  maxTokens?: number;
  exclude: boolean;
  showByDefault: boolean;
}

interface ReasoningStore {
  settings: ReasoningSettings;
  updateSettings: (updates: Partial<ReasoningSettings>) => void;
  getReasoningConfig: (modelId?: string) => ReasoningConfig | undefined;
  resetToDefaults: () => void;
}

const defaultSettings: ReasoningSettings = {
  enabled: false,
  effort: "high",
  maxTokens: 2000,
  exclude: false,
  showByDefault: false,
};

/**
 * Store for managing reasoning token settings and preferences
 * Persists user preferences across sessions
 */
export const useReasoningStore = create<ReasoningStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
      },

      getReasoningConfig: (modelId?: string) => {
        const { settings } = get();

        if (!settings.enabled) {
          return undefined;
        }

        // Check if model supports reasoning
        if (modelId) {
          const modelInfo = getReasoningModelInfo(modelId);
          if (!modelInfo.supportsReasoning) {
            return undefined;
          }
        }

        const config: ReasoningConfig = {
          enabled: true,
          exclude: settings.exclude,
        };

        // Add effort or max_tokens based on model capabilities and settings
        if (modelId) {
          const modelInfo = getReasoningModelInfo(modelId);

          if (modelInfo.parameterType === 'max_tokens') {
            // For max_tokens models, always use max_tokens if available
            config.max_tokens = settings.maxTokens && settings.maxTokens > 0
              ? settings.maxTokens
              : 2000; // Default for max_tokens models
          } else if (modelInfo.parameterType === 'effort') {
            // For effort models, use effort level
            config.effort = settings.effort;
          } else if (modelInfo.parameterType === 'both') {
            // For models supporting both, prefer max_tokens if set, otherwise use effort
            if (settings.maxTokens && settings.maxTokens > 0) {
              config.max_tokens = settings.maxTokens;
            } else {
              config.effort = settings.effort;
            }
          }
        } else {
          // Fallback behavior when no model specified
          if (settings.maxTokens && settings.maxTokens > 0) {
            config.max_tokens = settings.maxTokens;
          } else {
            config.effort = settings.effort;
          }
        }

        return config;
      },

      resetToDefaults: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'reasoning-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

/**
 * Hook for accessing reasoning settings with common operations
 */
export const useReasoningSettings = () => {
  const store = useReasoningStore();
  
  return {
    ...store,
    isEnabled: store.settings.enabled,
    shouldShowReasoning: store.settings.enabled && !store.settings.exclude,
    toggleEnabled: () => store.updateSettings({ enabled: !store.settings.enabled }),
    toggleExclude: () => store.updateSettings({ exclude: !store.settings.exclude }),
    setEffort: (effort: "high" | "medium" | "low") => store.updateSettings({ effort }),
    setMaxTokens: (maxTokens: number) => store.updateSettings({ maxTokens }),
  };
};
