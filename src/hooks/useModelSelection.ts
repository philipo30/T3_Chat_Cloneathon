import { useState, useCallback, useMemo } from 'react';
import { Model, ReasoningConfig, ModelSelectionState } from '@/types/models';
import { sampleModels, defaultReasoningConfig } from '@/lib/models';

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<Model>(sampleModels[0]);
  const [reasoningConfig, setReasoningConfig] = useState<ReasoningConfig>(defaultReasoningConfig);

  const updateModel = useCallback((model: Model) => {
    setSelectedModel(model);
    
    // Reset reasoning config when switching models
    if (!model.supportsReasoning) {
      setReasoningConfig(defaultReasoningConfig);
    }
  }, []);

  const updateReasoningConfig = useCallback((config: Partial<ReasoningConfig>) => {
    setReasoningConfig(prev => ({ ...prev, ...config }));
  }, []);

  const modelSelectionState: ModelSelectionState = useMemo(() => ({
    selectedModel,
    reasoningConfig,
  }), [selectedModel, reasoningConfig]);

  return {
    selectedModel,
    reasoningConfig,
    availableModels: sampleModels,
    updateModel,
    updateReasoningConfig,
    modelSelectionState,
  };
}
