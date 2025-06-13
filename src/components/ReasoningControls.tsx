import React, { useState } from 'react';
import { Brain, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { Model, ReasoningConfig, ReasoningEffort } from '@/types/models';

interface ReasoningControlsProps {
  model: Model;
  reasoningConfig: ReasoningConfig;
  onReasoningConfigChange: (config: Partial<ReasoningConfig>) => void;
  className?: string;
}

export const ReasoningControls: React.FC<ReasoningControlsProps> = ({
  model,
  reasoningConfig,
  onReasoningConfigChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!model.supportsReasoning) {
    return null;
  }

  const handleEffortChange = (effort: ReasoningEffort) => {
    onReasoningConfigChange({ 
      enabled: true,
      effort,
      // Clear max_tokens when using effort
      max_tokens: undefined,
    });
  };

  const handleMaxTokensChange = (max_tokens: number) => {
    onReasoningConfigChange({ 
      enabled: true,
      max_tokens,
      // Clear effort when using max_tokens
      effort: undefined,
    });
  };

  const handleToggleEnabled = () => {
    onReasoningConfigChange({ enabled: !reasoningConfig.enabled });
  };

  const handleToggleExclude = () => {
    onReasoningConfigChange({ exclude: !reasoningConfig.exclude });
  };

  const isEffortModel = model.reasoningType === 'effort';
  const isMaxTokensModel = model.reasoningType === 'max_tokens';

  return (
    <div 
      className={`transition-all duration-150 ease-in-out ${
        model.supportsReasoning 
          ? 'opacity-100 scale-100 translate-x-0' 
          : 'opacity-0 scale-95 translate-x-2 pointer-events-none'
      } ${className}`}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`w-8 h-8 transition-all duration-150 rounded-md ${
              reasoningConfig.enabled
                ? 'text-[rgb(163,0,76)] bg-[rgba(163,0,76,0.1)] hover:bg-[rgba(163,0,76,0.2)]'
                : 'text-[rgb(231,208,221)] hover:bg-[rgba(54,45,61,0.4)] hover:text-white'
            }`}
            aria-label="Configure reasoning settings"
          >
            <Brain className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-[rgb(26,20,25)] border-[rgba(54,45,61,0.7)] text-[rgb(231,208,221)]"
        >
          <DropdownMenuLabel className="text-[rgb(212,199,225)]">
            Reasoning Settings
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[rgba(54,45,61,0.7)]" />
          
          <DropdownMenuCheckboxItem
            checked={reasoningConfig.enabled}
            onCheckedChange={handleToggleEnabled}
            className="hover:bg-[rgba(54,45,61,0.4)] focus:bg-[rgba(54,45,61,0.4)]"
          >
            Enable Reasoning
          </DropdownMenuCheckboxItem>

          {reasoningConfig.enabled && (
            <>
              <DropdownMenuSeparator className="bg-[rgba(54,45,61,0.7)]" />
              
              {isEffortModel && (
                <>
                  <DropdownMenuLabel className="text-xs text-[rgb(212,199,225)] opacity-75">
                    Effort Level
                  </DropdownMenuLabel>
                  {(['high', 'medium', 'low'] as ReasoningEffort[]).map((effort) => (
                    <DropdownMenuItem
                      key={effort}
                      onClick={() => handleEffortChange(effort)}
                      className="hover:bg-[rgba(54,45,61,0.4)] focus:bg-[rgba(54,45,61,0.4)] flex items-center justify-between"
                    >
                      <span className="capitalize">{effort}</span>
                      {reasoningConfig.effort === effort && (
                        <Check className="w-4 h-4 text-[rgb(163,0,76)]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {isMaxTokensModel && (
                <>
                  <DropdownMenuLabel className="text-xs text-[rgb(212,199,225)] opacity-75">
                    Max Tokens
                  </DropdownMenuLabel>
                  {[1000, 2000, 4000, 8000].map((tokens) => (
                    <DropdownMenuItem
                      key={tokens}
                      onClick={() => handleMaxTokensChange(tokens)}
                      className="hover:bg-[rgba(54,45,61,0.4)] focus:bg-[rgba(54,45,61,0.4)] flex items-center justify-between"
                    >
                      <span>{tokens.toLocaleString()}</span>
                      {reasoningConfig.max_tokens === tokens && (
                        <Check className="w-4 h-4 text-[rgb(163,0,76)]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator className="bg-[rgba(54,45,61,0.7)]" />
              
              <DropdownMenuCheckboxItem
                checked={reasoningConfig.exclude}
                onCheckedChange={handleToggleExclude}
                className="hover:bg-[rgba(54,45,61,0.4)] focus:bg-[rgba(54,45,61,0.4)]"
              >
                Hide reasoning from response
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
