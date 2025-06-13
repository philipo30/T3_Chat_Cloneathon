export interface Model {
  id: string;
  name: string;
  provider: string;
  supportsReasoning: boolean;
  reasoningType?: 'effort' | 'max_tokens';
}

export interface ReasoningConfig {
  enabled: boolean;
  effort?: 'high' | 'medium' | 'low';
  max_tokens?: number;
  exclude?: boolean;
}

export interface ModelSelectionState {
  selectedModel: Model;
  reasoningConfig: ReasoningConfig;
}

export type ReasoningEffort = 'high' | 'medium' | 'low';
