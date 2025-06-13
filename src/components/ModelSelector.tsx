import React, { useState, useEffect, useMemo } from 'react';
import type { OpenRouterModel } from '@/lib/types';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Gem, Image as ImageIcon, Pilcrow, BrainCircuit, Search, Star, Globe, X } from 'lucide-react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';

interface ModelSelectorProps {
  onSelectModel: (model: OpenRouterModel) => void;
  onClose: () => void;
  currentModel: string;
}

const ModelIcon: React.FC<{ model: OpenRouterModel, className?: string }> = ({ model, className }) => {
    // Simplified logic for icon selection based on model properties
    if (model.id.includes('sdxl') || model.id.includes('dall-e')) return <ImageIcon className={className} />;
    if (model.id.includes('claude-3-opus') || model.id.includes('gemini-2.5-pro')) return <Gem className={className} />;
    if (model.architecture.input_modalities.includes('image')) return <ImageIcon className={className} />;
    if (model.id.includes('instruct')) return <Pilcrow className={className} />;
    return <BrainCircuit className={className} />;
};

const fetchModels = async (): Promise<OpenRouterModel[]> => {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error('Failed to fetch models from OpenRouter API');
    }
    const data = await response.json();
    return data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => (b.context_length || 0) - (a.context_length || 0));
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelectModel, onClose, currentModel }) => {
  const { data: allModels = [], isPending: isLoading, error } = useQuery<OpenRouterModel[]>({
      queryKey: ['models'],
      queryFn: fetchModels,
  });

  const [filteredModels, setFilteredModels] = useState<OpenRouterModel[]>([]);
  const [favoriteModels, setFavoriteModels] = useState<string[]>([]);
  const [recentlyUsedModels, setRecentlyUsedModels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (allModels) {
        setFilteredModels(allModels);
    }
  }, [allModels]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteModels');
    if (storedFavorites) {
      setFavoriteModels(JSON.parse(storedFavorites));
    }
    const storedRecent = localStorage.getItem('recentlyUsedModels');
    if (storedRecent) {
      setRecentlyUsedModels(JSON.parse(storedRecent));
    }
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = allModels.filter(model =>
      model.name.toLowerCase().includes(lowercasedFilter) ||
      model.description.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredModels(filtered);
  }, [searchTerm, allModels]);

  const toggleFavorite = (modelId: string) => {
    let updatedFavorites;
    if (favoriteModels.includes(modelId)) {
      updatedFavorites = favoriteModels.filter(id => id !== modelId);
    } else {
      updatedFavorites = [...favoriteModels, modelId];
    }
    setFavoriteModels(updatedFavorites);
    localStorage.setItem('favoriteModels', JSON.stringify(updatedFavorites));
  };

  const handleSelectModel = (model: OpenRouterModel) => {
    const updatedRecent = [model.id, ...recentlyUsedModels.filter(id => id !== model.id)].slice(0, 5);
    setRecentlyUsedModels(updatedRecent);
    localStorage.setItem('recentlyUsedModels', JSON.stringify(updatedRecent));

    // Use setTimeout to ensure this happens after any current event processing
    setTimeout(() => {
      onSelectModel(model);
    }, 0);
  };
  
  const renderModelList = (models: OpenRouterModel[], title: string) => {
    if (models.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs text-[rgb(var(--chat-input-button-text))] font-semibold px-4 mb-2">{title}</h3>
        <ul>
        {models.map(model => (
            <li key={model.id} className="flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--welcome-screen-button-hover-background))] rounded-lg transition-colors group">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectModel(model);
                  }
                }}
                className={`w-full text-left flex items-center gap-4 cursor-pointer ${ model.id === currentModel ? 'font-semibold' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectModel(model);
                }}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[rgba(var(--welcome-screen-button-background),0.5)] rounded-lg">
                    <ModelIcon model={model} className="w-5 h-5 text-[rgba(var(--login-form-title-text),0.8)]" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm truncate ${ model.id === currentModel ? 'text-[rgb(var(--login-form-title-text))]' : 'text-[rgb(var(--chat-input-button-text))]'}`}>{model.name}</p>
                    {model.architecture.input_modalities.includes('image') && <ImageIcon className="w-3 h-3 text-[rgb(var(--chat-input-button-text))]" />}
                    {model.supported_parameters?.includes('web_search') && <Globe className="w-3 h-3 text-[rgb(var(--chat-input-button-text))]" />}
                  </div>
                  <p className="text-xs text-[rgb(var(--chat-input-button-text))] truncate">{model.description}</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }} className="p-2 rounded-full hover:bg-[rgb(var(--welcome-screen-button-hover-background))] ml-4 z-10">
                <Star className={`w-5 h-5 transition-colors ${favoriteModels.includes(model.id) ? 'text-[rgb(var(--chat-input-send-button-background))] fill-[rgb(var(--chat-input-send-button-background))]' : 'text-[rgba(var(--chat-input-button-text),0.5)]'}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const favorites = useMemo(() => allModels.filter(m => favoriteModels.includes(m.id)), [allModels, favoriteModels]);
  const recents = useMemo(() => recentlyUsedModels.map(id => allModels.find(m => m.id === id)).filter(Boolean) as OpenRouterModel[], [allModels, recentlyUsedModels]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-12" onClick={onClose}>
      <div 
        className="bg-[rgb(var(--app-main-background))] text-[rgb(var(--login-form-title-text))] rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden border border-[rgb(var(--app-main-border))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[rgb(var(--app-main-border))] flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[rgb(var(--login-form-title-text))]">Search models...</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-[rgb(var(--chat-input-button-text))] hover:text-[rgb(var(--login-form-title-text))]">
                    <X className="w-5 h-5" />
                </Button>
            </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--chat-input-button-text))]" />
            <Input
              type="text"
              placeholder="Search for models by name or description"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[rgb(var(--welcome-screen-button-background))] border-[rgb(var(--app-main-border))] pl-10 pr-4 py-2 rounded-lg text-[rgb(var(--login-form-title-text))] placeholder:text-[rgb(var(--chat-input-button-text))] focus:ring-2 focus:ring-[rgb(var(--chat-input-send-button-background))]"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full">
                <div className="p-2">
                    {isLoading ? (
                        <div className="text-center p-8 text-[rgb(var(--chat-input-button-text))]">Loading models...</div>
                    ) : error ? (
                        <div className="text-center p-8 text-destructive">{error.message}</div>
                    ) : (
                        <>
                            {renderModelList(favorites, 'Favorites')}
                            {renderModelList(recents, 'Recently Used')}
                            {renderModelList(filteredModels.filter(m => !favoriteModels.includes(m.id) && !recentlyUsedModels.includes(m.id)), 'All Models')}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
      </div>
    </div>
  );
};