import React, { useState, useEffect, useMemo } from 'react';
import type { OpenRouterModel } from '@/lib/types';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { BrainCircuit, Search, Star, Globe, X, ChevronUp, ChevronLeft, Filter, Zap, Eye, FileText, Lightbulb, Sliders, Palette, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';

interface ModelSelectorProps {
  onSelectModel: (model: OpenRouterModel) => void;
  onClose: () => void;
  currentModel: string;
}

type ModelCategory = 'fast' | 'vision' | 'search' | 'files' | 'reasoning' | 'effort' | 'image-gen';

interface CategoryConfig {
  id: ModelCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'fast', name: 'Fast', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { id: 'vision', name: 'Vision', icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'search', name: 'Search', icon: Globe, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { id: 'files', name: 'Files', icon: FileText, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'reasoning', name: 'Reasoning', icon: Lightbulb, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { id: 'effort', name: 'Effort Control', icon: Sliders, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  { id: 'image-gen', name: 'Image Gen', icon: Palette, color: 'text-red-400', bgColor: 'bg-red-500/20' },
];

const getModelCategories = (model: OpenRouterModel): ModelCategory[] => {
  const categories: ModelCategory[] = [];

  // Fast models - based on pricing (lower cost = faster/cheaper models) and model names
  const promptPrice = parseFloat(model.pricing?.prompt || '0');
  const completionPrice = parseFloat(model.pricing?.completion || '0');
  const avgPrice = (promptPrice + completionPrice) / 2;

  // Consider models with very low pricing as "fast" (under $0.002 per token) or specific fast model names
  const isFastByPrice = avgPrice > 0 && avgPrice < 0.002;
  const isFastByName = model.id.includes('flash') || model.id.includes('mini') ||
      model.id.includes('lite') || model.id.includes('turbo') || model.id.includes('fast') ||
      model.name.toLowerCase().includes('flash') || model.name.toLowerCase().includes('mini') ||
      model.name.toLowerCase().includes('lite') || model.name.toLowerCase().includes('turbo') ||
      model.name.toLowerCase().includes('fast') || model.id.includes('gemma') ||
      model.id.includes('llama') && (model.id.includes('8b') || model.id.includes('7b'));

  if (isFastByPrice || isFastByName) {
    categories.push('fast');
  }

  // Vision capabilities - check input modalities for image support
  if (model.architecture?.input_modalities?.includes('image')) {
    categories.push('vision');
  }

  // Search capabilities - check supported parameters and pricing for web search
  if (model.supported_parameters?.includes('web_search') ||
      (model.pricing?.web_search && model.pricing.web_search !== '0')) {
    categories.push('search');
  }

  // File processing - check input modalities for file support and high context length
  if (model.architecture?.input_modalities?.includes('file') ||
      (model.context_length && model.context_length > 100000)) {
    categories.push('files');
  }

  // Reasoning capabilities - check supported parameters, pricing, and model names
  if (model.supported_parameters?.includes('reasoning') ||
      model.supported_parameters?.includes('include_reasoning') ||
      (model.pricing?.internal_reasoning && model.pricing.internal_reasoning !== '0') ||
      model.id.includes('o1') || model.id.includes('reasoning') || model.id.includes('think')) {
    categories.push('reasoning');
  }

  // Tool calling / Function calling (effort control through tools)
  if (model.supported_parameters?.includes('tools') ||
      model.supported_parameters?.includes('tool_choice') ||
      model.supported_parameters?.includes('function_calling')) {
    categories.push('effort');
  }

  // Image generation - check output modalities and model names
  if (model.architecture?.output_modalities?.includes('image') ||
      model.id.includes('sdxl') || model.id.includes('dall-e') ||
      model.id.includes('midjourney') || model.id.includes('stable-diffusion') ||
      model.id.includes('imagen') || model.id.includes('flux') ||
      model.name.toLowerCase().includes('dall-e') || model.name.toLowerCase().includes('sdxl') ||
      model.name.toLowerCase().includes('stable') || model.name.toLowerCase().includes('flux')) {
    categories.push('image-gen');
  }

  return categories;
};

/**
 * Maps OpenRouter model IDs to LobeHub icon slugs
 * Based on LobeHub icon collection: https://icons.lobehub.com
 */
const getModelIconSlug = (modelId: string): string => {
  const id = modelId.toLowerCase();

  // OpenAI models
  if (id.includes('openai/') || id.includes('gpt') || id.includes('o1')) return 'openai';
  if (id.includes('dall-e')) return 'dalle';

  // Anthropic models
  if (id.includes('anthropic/') || id.includes('claude')) return 'claude';

  // Google models
  if (id.includes('google/') || id.includes('gemini')) return 'gemini';
  if (id.includes('gemma')) return 'gemma';
  if (id.includes('palm')) return 'palm';

  // Meta models
  if (id.includes('meta/') || id.includes('llama')) return 'meta';

  // Mistral models
  if (id.includes('mistral')) return 'mistral';

  // Cohere models
  if (id.includes('cohere') || id.includes('command')) return 'cohere';

  // xAI models
  if (id.includes('x.ai/') || id.includes('grok')) return 'xai';

  // DeepSeek models
  if (id.includes('deepseek')) return 'deepseek';

  // Qwen models
  if (id.includes('qwen') || id.includes('alibaba')) return 'qwen';

  // Chinese models
  if (id.includes('zhipu') || id.includes('chatglm')) return 'zhipu';
  if (id.includes('moonshot') || id.includes('kimi')) return 'moonshot';
  if (id.includes('baichuan')) return 'baichuan';
  if (id.includes('yi/') || id.includes('01-ai')) return 'yi';
  if (id.includes('doubao') || id.includes('bytedance')) return 'doubao';

  // Image generation models
  if (id.includes('stability') || id.includes('stable-diffusion') || id.includes('sdxl')) return 'stability';
  if (id.includes('midjourney')) return 'midjourney';
  if (id.includes('flux')) return 'flux';
  if (id.includes('ideogram')) return 'ideogram';

  // Other providers
  if (id.includes('perplexity')) return 'perplexity';
  if (id.includes('together')) return 'together';
  if (id.includes('fireworks')) return 'fireworks';
  if (id.includes('groq')) return 'groq';
  if (id.includes('replicate')) return 'replicate';
  if (id.includes('huggingface')) return 'huggingface';
  if (id.includes('nvidia')) return 'nvidia';
  if (id.includes('sambanova')) return 'sambanova';
  if (id.includes('cerebras')) return 'cerebras';
  if (id.includes('hyperbolic')) return 'hyperbolic';
  if (id.includes('deepinfra')) return 'deepinfra';
  if (id.includes('lepton')) return 'leptonai';
  if (id.includes('novita')) return 'novita';
  if (id.includes('siliconflow') || id.includes('siliconcloud')) return 'siliconcloud';

  // Additional providers
  if (id.includes('openrouter')) return 'openrouter';
  if (id.includes('anyscale')) return 'anyscale';
  if (id.includes('baseten')) return 'baseten';
  if (id.includes('modal')) return 'modal';
  if (id.includes('runpod')) return 'runpod';
  if (id.includes('lambda')) return 'lambda';
  if (id.includes('vast')) return 'vast';
  if (id.includes('paperspace')) return 'paperspace';
  if (id.includes('aws') || id.includes('bedrock')) return 'aws';
  if (id.includes('azure')) return 'azure';
  if (id.includes('gcp') || id.includes('vertex')) return 'vertexai';
  if (id.includes('cloudflare') || id.includes('workers')) return 'workersai';

  // Open source models
  if (id.includes('llama') && !id.includes('meta')) return 'meta'; // Llama models
  if (id.includes('vicuna')) return 'meta';
  if (id.includes('alpaca')) return 'meta';
  if (id.includes('wizard')) return 'microsoft';
  if (id.includes('orca')) return 'microsoft';
  if (id.includes('phi')) return 'microsoft';
  if (id.includes('falcon')) return 'tii';
  if (id.includes('mpt')) return 'mosaicml';
  if (id.includes('rwkv')) return 'rwkv';

  // Fallback to generic AI icon
  return 'openai'; // Default fallback
};

const ModelIcon: React.FC<{ model: OpenRouterModel, className?: string }> = ({ model, className }) => {
  const { theme, resolvedTheme } = useTheme();
  const iconSlug = getModelIconSlug(model.id);

  // Determine if we should use dark or light icons
  const isDark = resolvedTheme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');
  const themeFolder = isDark ? 'dark' : 'light';

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <img
        src={`https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/${themeFolder}/${iconSlug}.png`}
        alt={`${model.name} icon`}
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to generic brain icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.classList.remove('hidden');
        }}
      />
      <BrainCircuit className="w-full h-full hidden text-gray-500 dark:text-gray-400" />
    </div>
  );
};

const ModelCard: React.FC<{
  model: OpenRouterModel;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}> = ({ model, isSelected, isFavorite, onSelect, onToggleFavorite }) => {
  return (
    <div
      className={`relative p-4 rounded-lg border cursor-pointer transition-all hover:bg-[rgb(var(--welcome-screen-button-hover-background))] ${
        isSelected
          ? 'border-[rgb(var(--chat-input-send-button-background))] bg-[rgba(var(--chat-input-send-button-background),0.1)]'
          : 'border-[rgb(var(--app-main-border))] bg-[rgb(var(--welcome-screen-button-background))]'
      }`}
      onClick={onSelect}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-[rgb(var(--welcome-screen-button-hover-background))] z-10"
      >
        <Star className={`w-4 h-4 transition-colors ${isFavorite ? 'text-[rgb(var(--chat-input-send-button-background))] fill-[rgb(var(--chat-input-send-button-background))]' : 'text-[rgba(var(--chat-input-button-text),0.5)]'}`} />
      </button>

      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 flex items-center justify-center bg-[rgba(var(--welcome-screen-button-background),0.5)] rounded-lg">
          <ModelIcon model={model} className="w-6 h-6 text-[rgba(var(--login-form-title-text),0.8)]" />
        </div>

        <div className="space-y-1">
          <p className={`font-medium text-sm ${isSelected ? 'text-[rgb(var(--login-form-title-text))]' : 'text-[rgb(var(--chat-input-button-text))]'}`}>
            {model.name}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {getModelCategories(model).map(categoryId => {
            const category = CATEGORIES.find(c => c.id === categoryId);
            if (!category) return null;
            const IconComponent = category.icon;
            return (
              <div key={categoryId} className={`w-6 h-6 rounded-full ${category.bgColor} flex items-center justify-center`}>
                <IconComponent className={`w-3 h-3 ${category.color}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
  const [displayLimit, setDisplayLimit] = useState(25);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [selectedFilters, setSelectedFilters] = useState<ModelCategory[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown) {
        const target = event.target as Element;
        // Don't close if clicking inside the dropdown or on the filter button
        if (!target.closest('[data-filter-dropdown]') && !target.closest('[data-filter-button]')) {
          setShowFilterDropdown(false);
        }
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterDropdown]);

  
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    let filtered = allModels.filter(model =>
      model.name.toLowerCase().includes(lowercasedFilter) ||
      model.description.toLowerCase().includes(lowercasedFilter)
    );

    // Apply category filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(model => {
        const modelCategories = getModelCategories(model);
        return selectedFilters.some(filter => modelCategories.includes(filter));
      });
    }

    setFilteredModels(filtered);
    // Reset display limit when search term or filters change
    setDisplayLimit(25);
  }, [searchTerm, allModels, selectedFilters]);

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

  const loadMore = () => {
    setDisplayLimit(prev => prev + 25);
  };

  const toggleFilter = (category: ModelCategory) => {
    setSelectedFilters(prev => {
      return prev.includes(category)
        ? prev.filter(f => f !== category)
        : [...prev, category];
    });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const renderFilterDropdown = (isCompactView: boolean = false) => (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        data-filter-button
        className={`text-[rgb(var(--chat-input-button-text))] hover:text-[rgb(var(--login-form-title-text))] hover:bg-[rgb(var(--welcome-screen-button-hover-background))] border border-[rgb(var(--app-main-border))] rounded-lg py-2 px-3 flex items-center gap-2 ${selectedFilters.length > 0 ? 'border-[rgb(var(--chat-input-send-button-background))] text-[rgb(var(--chat-input-send-button-background))]' : ''}`}
      >
        <Filter className="w-4 h-4" />
        {selectedFilters.length > 0 && (
          <span className="bg-[rgb(var(--chat-input-send-button-background))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedFilters.length}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </Button>

      {showFilterDropdown && (
        <div
          data-filter-dropdown
          className={`absolute right-0 ${isCompactView ? 'bottom-full mb-2' : 'top-full mt-2'} bg-[rgb(var(--app-main-background))] border border-[rgb(var(--app-main-border))] rounded-lg shadow-xl z-50 min-w-[200px] p-2`}
        >
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-semibold text-[rgb(var(--chat-input-button-text))]">Filter by category</span>
            {selectedFilters.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFilters();
                }}
                className="text-xs text-[rgb(var(--chat-input-send-button-background))] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {CATEGORIES.map(category => {
              const IconComponent = category.icon;
              const isSelected = selectedFilters.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFilter(category.id);
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-[rgb(var(--welcome-screen-button-hover-background))] text-[rgb(var(--login-form-title-text))]'
                      : 'hover:bg-[rgb(var(--welcome-screen-button-hover-background))] text-[rgb(var(--chat-input-button-text))]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-3 h-3 ${category.color}`} />
                  </div>
                  <span className="text-sm">{category.name}</span>
                  {isSelected && <div className="w-2 h-2 bg-[rgb(var(--chat-input-send-button-background))] rounded-full ml-auto"></div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderCompactModelList = (models: OpenRouterModel[], limit: number = 8) => {
    const displayedModels = models.slice(0, limit);

    return (
      <ul className="space-y-1">
        {displayedModels.map(model => (
          <li key={model.id} className="flex items-center justify-between px-3 py-2 hover:bg-[rgb(var(--welcome-screen-button-hover-background))] rounded-lg transition-colors group">
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
              className={`flex-1 text-left flex items-center gap-3 cursor-pointer min-w-0 ${ model.id === currentModel ? 'font-semibold' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectModel(model);
              }}
            >
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[rgba(var(--welcome-screen-button-background),0.5)] rounded-lg">
                <ModelIcon model={model} className="w-4 h-4 text-[rgba(var(--login-form-title-text),0.8)]" />
              </div>
              <div className="flex-1 overflow-hidden min-w-0 max-w-[250px]">
                <div className="flex items-center gap-1">
                  <p className={`font-medium text-xs truncate ${ model.id === currentModel ? 'text-[rgb(var(--login-form-title-text))]' : 'text-[rgb(var(--chat-input-button-text))]'}`}>{model.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {getModelCategories(model).map(categoryId => {
                  const category = CATEGORIES.find(c => c.id === categoryId);
                  if (!category) return null;
                  const IconComponent = category.icon;
                  return (
                    <div key={categoryId} className={`w-5 h-5 rounded-full ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-2.5 h-2.5 ${category.color}`} />
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }} className="p-1.5 rounded-full hover:bg-[rgb(var(--welcome-screen-button-hover-background))] ml-2 z-10 flex-shrink-0">
              <Star className={`w-3.5 h-3.5 transition-colors ${favoriteModels.includes(model.id) ? 'text-[rgb(var(--chat-input-send-button-background))] fill-[rgb(var(--chat-input-send-button-background))]' : 'text-[rgba(var(--chat-input-button-text),0.5)]'}`} />
            </button>
          </li>
        ))}
      </ul>
    );
  };
  


  const favorites = useMemo(() => allModels.filter(m => favoriteModels.includes(m.id)), [allModels, favoriteModels]);
  const recents = useMemo(() => recentlyUsedModels.map(id => allModels.find(m => m.id === id)).filter(Boolean) as OpenRouterModel[], [allModels, recentlyUsedModels]);

  const renderCompactView = () => {
    // Apply filters to favorites and recents as well
    const filteredFavorites = selectedFilters.length > 0
      ? favorites.filter(model => {
          const modelCategories = getModelCategories(model);
          return selectedFilters.some(filter => modelCategories.includes(filter));
        })
      : favorites;

    const filteredRecents = selectedFilters.length > 0
      ? recents.filter(model => {
          const modelCategories = getModelCategories(model);
          return selectedFilters.some(filter => modelCategories.includes(filter));
        })
      : recents;

    // Show filtered favorites first, or filtered recent models if no filtered favorites
    const modelsToShow = filteredFavorites.length > 0 ? filteredFavorites : filteredRecents;
    const remainingModels = filteredModels.filter(m => !modelsToShow.some(shown => shown.id === m.id));
    const allCompactModels = [...modelsToShow, ...remainingModels];

    return (
      <div className="p-2">
        {isLoading ? (
          <div className="text-center p-8 text-[rgb(var(--chat-input-button-text))]">Loading models...</div>
        ) : error ? (
          <div className="text-center p-8 text-destructive">{error.message}</div>
        ) : (
          <>
            {renderCompactModelList(allCompactModels, 8)}
            <div className="px-4 mt-4 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setViewMode('expanded')}
                className="text-[rgb(var(--chat-input-button-text))] hover:text-[rgb(var(--login-form-title-text))] hover:bg-[rgb(var(--welcome-screen-button-hover-background))] border border-[rgb(var(--app-main-border))] rounded-lg py-2 px-4 flex items-center gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                Show all
              </Button>
              {renderFilterDropdown(true)}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderExpandedView = () => {
    const otherModels = filteredModels.filter(m => !favoriteModels.includes(m.id) && !recentlyUsedModels.includes(m.id)).slice(0, displayLimit);

    return (
      <div className="p-4">
        {isLoading ? (
          <div className="text-center p-8 text-[rgb(var(--chat-input-button-text))]">Loading models...</div>
        ) : error ? (
          <div className="text-center p-8 text-destructive">{error.message}</div>
        ) : (
          <>
            {(() => {
              const filteredFavoritesForExpanded = selectedFilters.length > 0
                ? favorites.filter(model => {
                    const modelCategories = getModelCategories(model);
                    return selectedFilters.some(filter => modelCategories.includes(filter));
                  })
                : favorites;

              if (filteredFavoritesForExpanded.length > 0) {
                return (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm text-[rgb(var(--chat-input-button-text))] font-semibold flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Favorites
                      </h3>
                      {renderFilterDropdown(false)}
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {filteredFavoritesForExpanded.map(model => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          isSelected={model.id === currentModel}
                          isFavorite={true}
                          onSelect={() => handleSelectModel(model)}
                          onToggleFavorite={() => toggleFavorite(model.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div className="mb-8">
                  <div className="flex items-center justify-end mb-4">
                    {renderFilterDropdown(false)}
                  </div>
                </div>
              );
            })()}

            <div>
              <h3 className="text-sm text-[rgb(var(--chat-input-button-text))] font-semibold mb-4">Others</h3>
              <div className="grid grid-cols-5 gap-4">
                {otherModels.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={model.id === currentModel}
                    isFavorite={favoriteModels.includes(model.id)}
                    onSelect={() => handleSelectModel(model)}
                    onToggleFavorite={() => toggleFavorite(model.id)}
                  />
                ))}
              </div>

              {otherModels.length < filteredModels.filter(m => !favoriteModels.includes(m.id) && !recentlyUsedModels.includes(m.id)).length && (
                <div className="mt-6 text-center">
                  <Button
                    variant="ghost"
                    onClick={loadMore}
                    className="text-[rgb(var(--chat-input-button-text))] hover:text-[rgb(var(--login-form-title-text))] hover:bg-[rgb(var(--welcome-screen-button-hover-background))] border border-[rgb(var(--app-main-border))] rounded-lg px-6 py-2"
                  >
                    Load More ({filteredModels.filter(m => !favoriteModels.includes(m.id) && !recentlyUsedModels.includes(m.id)).length - displayLimit} remaining)
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-20" onClick={onClose}>
      <div
        className={`bg-[rgb(var(--app-main-background))] text-[rgb(var(--login-form-title-text))] rounded-2xl w-full flex flex-col overflow-hidden border border-[rgb(var(--app-main-border))] shadow-2xl transition-all duration-300 ${
          viewMode === 'compact'
            ? 'max-w-lg max-h-[70vh]'
            : 'max-w-6xl max-h-[85vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[rgb(var(--app-main-border))] flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  {viewMode === 'expanded' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('compact')}
                      className="text-[rgb(var(--chat-input-button-text))] hover:text-[rgb(var(--login-form-title-text))]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <h2 className="text-xl font-semibold text-[rgb(var(--login-form-title-text))]">
                    {viewMode === 'compact' ? 'Search models...' : 'All Models'}
                  </h2>
                </div>
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
                {viewMode === 'compact' ? renderCompactView() : renderExpandedView()}
            </ScrollArea>
        </div>
      </div>
    </div>
  );
};