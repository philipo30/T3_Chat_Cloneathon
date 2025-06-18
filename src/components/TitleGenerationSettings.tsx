import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, Info } from 'lucide-react';
import { useTitleGenerationSettings } from '@/stores/TitleGenerationStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TITLE_GENERATION_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', description: 'Free and high quality' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Free but smaller' },
  { id: 'anthropic/claude-3.5-haiku:beta', name: 'Claude 3.5 Haiku (Fast)', description: 'Fast and efficient' },
  { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet (Balanced)', description: 'Balanced speed and quality' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', description: 'Google\'s fast model' },
];

export const TitleGenerationSettings: React.FC = () => {
  const {
    settings,
    toggleEnabled,
    toggleAutoGenerate,
    toggleNotifications,
    toggleFallback,
    setModel,
    setMaxLength,
    resetToDefaults,
  } = useTitleGenerationSettings();

  const handleMaxLengthChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 200) {
      setMaxLength(numValue);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <CardTitle>Title Generation Settings</CardTitle>
        </div>
        <CardDescription>
          Configure how chat titles are automatically generated for your conversations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Title Generation */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-title-generation" className="text-base">
              Enable Title Generation
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow AI to generate titles for your chats
            </p>
          </div>
          <Switch
            id="enable-title-generation"
            checked={settings.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>

        {/* Auto-generate for new chats */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-generate" className="text-base">
              Auto-generate for New Chats
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate titles when creating new chats
            </p>
          </div>
          <Switch
            id="auto-generate"
            checked={settings.autoGenerate}
            onCheckedChange={toggleAutoGenerate}
            disabled={!settings.enabled}
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="title-model" className="text-base">
              Title Generation Model
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose the AI model used for generating titles. Faster models generate titles quicker but may be less creative.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={settings.model}
            onValueChange={setModel}
            disabled={!settings.enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {TITLE_GENERATION_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Length */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="max-length" className="text-base">
              Maximum Title Length
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Maximum number of characters for generated titles (10-200)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="max-length"
              type="number"
              min="10"
              max="200"
              value={settings.maxLength}
              onChange={(e) => handleMaxLengthChange(e.target.value)}
              disabled={!settings.enabled}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">characters</span>
          </div>
        </div>

        {/* Show Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-notifications" className="text-base">
              Show Generation Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Display notifications when titles are generated
            </p>
          </div>
          <Switch
            id="show-notifications"
            checked={settings.showNotifications}
            onCheckedChange={toggleNotifications}
            disabled={!settings.enabled}
          />
        </div>

        {/* Fallback Enabled */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="fallback-enabled" className="text-base">
              Enable Fallback Titles
            </Label>
            <p className="text-sm text-muted-foreground">
              Generate simple titles when AI generation fails
            </p>
          </div>
          <Switch
            id="fallback-enabled"
            checked={settings.fallbackEnabled}
            onCheckedChange={toggleFallback}
            disabled={!settings.enabled}
          />
        </div>

        {/* Reset to Defaults */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
