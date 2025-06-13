import React, { memo, useState } from 'react';
import { Brain, ChevronDown, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { useReasoningSettings } from '@/stores/ReasoningStore';

interface ReasoningControlsProps {
  className?: string;
}

/**
 * Controls for managing reasoning token settings
 * Provides easy access to reasoning configuration options
 */
const PureReasoningControls: React.FC<ReasoningControlsProps> = ({ className = '' }) => {
  const {
    settings,
    isEnabled,
    shouldShowReasoning,
    toggleEnabled,
    toggleExclude,
    setEffort,
    setMaxTokens,
    updateSettings,
  } = useReasoningSettings();

  const [customTokens, setCustomTokens] = useState(settings.maxTokens?.toString() || '2000');

  const handleTokensChange = (value: string) => {
    setCustomTokens(value);
    const tokens = parseInt(value);
    if (!isNaN(tokens) && tokens > 0) {
      setMaxTokens(tokens);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`flex items-center gap-1 h-8 px-2 text-xs rounded-md transition-colors duration-150 ${
              isEnabled 
                ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10' 
                : 'text-[rgb(var(--chat-message-username))] opacity-60 hover:opacity-80 hover:bg-primary/10'
            }`}
            aria-label="Reasoning settings"
          >
            <Brain className={`w-3 h-3 ${isEnabled ? 'text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Reasoning</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64 border-border bg-popover">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Reasoning Settings
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Enable/Disable Reasoning */}
          <DropdownMenuCheckboxItem
            checked={isEnabled}
            onCheckedChange={toggleEnabled}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Enable Reasoning
          </DropdownMenuCheckboxItem>
          
          {isEnabled && (
            <>
              <DropdownMenuSeparator />
              
              {/* Effort Level */}
              <DropdownMenuLabel className="text-xs opacity-75">
                Effort Level
              </DropdownMenuLabel>
              
              {(['high', 'medium', 'low'] as const).map((effort) => (
                <DropdownMenuItem
                  key={effort}
                  onClick={() => setEffort(effort)}
                  className={`pl-6 ${
                    settings.effort === effort ? 'bg-purple-500/10 text-purple-300' : ''
                  }`}
                >
                  <span className="capitalize">{effort}</span>
                  {settings.effort === effort && (
                    <span className="ml-auto text-purple-400">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* Token Limit */}
              <DropdownMenuLabel className="text-xs opacity-75">
                Max Tokens (Optional)
              </DropdownMenuLabel>
              
              <div className="px-2 py-1">
                <input
                  type="number"
                  value={customTokens}
                  onChange={(e) => handleTokensChange(e.target.value)}
                  placeholder="2000"
                  min="100"
                  max="8000"
                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-xs opacity-60 mt-1">
                  Leave empty to use effort level. Higher values increase response quality but also cost.
                </p>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Display Options */}
              <DropdownMenuCheckboxItem
                checked={!settings.exclude}
                onCheckedChange={toggleExclude}
                className="flex items-center gap-2"
              >
                {settings.exclude ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Show Reasoning in Chat
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={settings.showByDefault}
                onCheckedChange={(checked) => updateSettings({ showByDefault: checked })}
                className="flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Expand by Default
              </DropdownMenuCheckboxItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1">
            <p className="text-xs opacity-60">
              💡 Reasoning tokens show AI's internal thought process but increase costs and response time.
            </p>
            {isEnabled && (
              <p className="text-xs text-purple-400 mt-1">
                ⚡ Token limit automatically increased to accommodate reasoning
              </p>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ReasoningControls = memo(PureReasoningControls);

ReasoningControls.displayName = 'ReasoningControls';
