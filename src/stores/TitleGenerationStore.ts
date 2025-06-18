import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TitleGenerationSettings {
  enabled: boolean;
  autoGenerate: boolean;
  model: string;
  maxLength: number;
  showNotifications: boolean;
  fallbackEnabled: boolean;
}

interface TitleGenerationStore {
  settings: TitleGenerationSettings;
  updateSettings: (updates: Partial<TitleGenerationSettings>) => void;
  resetToDefaults: () => void;
  isEnabled: () => boolean;
  shouldAutoGenerate: () => boolean;
}

const defaultSettings: TitleGenerationSettings = {
  enabled: true,
  autoGenerate: true,
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  maxLength: 80,
  showNotifications: false,
  fallbackEnabled: true,
};

/**
 * Store for managing title generation settings and preferences
 * Persists user preferences across sessions
 */
export const useTitleGenerationStore = create<TitleGenerationStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
      },

      resetToDefaults: () => {
        set({ settings: defaultSettings });
      },

      isEnabled: () => {
        const { settings } = get();
        return settings.enabled;
      },

      shouldAutoGenerate: () => {
        const { settings } = get();
        return settings.enabled && settings.autoGenerate;
      },
    }),
    {
      name: 'title-generation-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

/**
 * Hook for accessing title generation settings with common operations
 */
export const useTitleGenerationSettings = () => {
  const store = useTitleGenerationStore();
  
  return {
    ...store,
    toggleEnabled: () => store.updateSettings({ enabled: !store.settings.enabled }),
    toggleAutoGenerate: () => store.updateSettings({ autoGenerate: !store.settings.autoGenerate }),
    toggleNotifications: () => store.updateSettings({ showNotifications: !store.settings.showNotifications }),
    toggleFallback: () => store.updateSettings({ fallbackEnabled: !store.settings.fallbackEnabled }),
    setModel: (model: string) => store.updateSettings({ model }),
    setMaxLength: (maxLength: number) => store.updateSettings({ maxLength }),
  };
};
