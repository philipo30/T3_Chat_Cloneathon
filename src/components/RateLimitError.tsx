import React from 'react';
import { AlertTriangle, Clock, CreditCard, Key, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RateLimitError as RateLimitErrorType, ApiError } from '@/lib/types';
import { rateLimitService } from '@/lib/services/rate-limit-service';

interface RateLimitErrorProps {
  error: RateLimitErrorType | ApiError | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Component to display user-friendly rate limit and API error messages
 * Provides specific guidance based on error type
 */
export const RateLimitError: React.FC<RateLimitErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  // Determine error type and get appropriate content
  const getErrorContent = () => {
    // Rate limit error
    if (rateLimitService.isRateLimitError(error)) {
      const rateLimitError = error as RateLimitErrorType;
      const message = rateLimitService.getRateLimitMessage(rateLimitError);
      
      return {
        icon: Clock,
        title: 'Rate Limit Reached',
        message,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-500/30',
        actionText: 'Retry',
        showRetry: true,
        guidance: [
          'Wait for the rate limit to reset',
          'Consider using a different model',
          'Reduce request frequency',
        ],
      };
    }

    // API errors
    const apiError = error as ApiError;
    
    switch (apiError.status) {
      case 402:
        return {
          icon: CreditCard,
          title: 'Insufficient Credits',
          message: 'Your OpenRouter account has insufficient credits to complete this request.',
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-500/30',
          actionText: 'Add Credits',
          showRetry: false,
          guidance: [
            'Add credits to your OpenRouter account',
            'Try using free models (ending with ":free")',
            'Check your account balance',
          ],
          actionUrl: 'https://openrouter.ai/settings/credits',
        };

      case 401:
        return {
          icon: Key,
          title: 'Invalid API Key',
          message: 'Your OpenRouter API key is invalid or has expired.',
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-500/30',
          actionText: 'Check API Key',
          showRetry: false,
          guidance: [
            'Verify your API key in settings',
            'Generate a new API key if needed',
            'Ensure the key has proper permissions',
          ],
          actionUrl: 'https://openrouter.ai/keys',
        };

      case 503:
        return {
          icon: RefreshCw,
          title: 'Service Temporarily Unavailable',
          message: 'The OpenRouter service is temporarily unavailable. Please try again in a moment.',
          color: 'text-orange-400',
          bgColor: 'bg-orange-900/20',
          borderColor: 'border-orange-500/30',
          actionText: 'Retry',
          showRetry: true,
          guidance: [
            'Wait a moment and try again',
            'Check OpenRouter status page',
            'Try a different model if available',
          ],
        };

      default:
        return {
          icon: AlertTriangle,
          title: 'API Error',
          message: error.message || 'An unexpected error occurred while communicating with the API.',
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-500/30',
          actionText: 'Retry',
          showRetry: true,
          guidance: [
            'Check your internet connection',
            'Try again in a moment',
            'Contact support if the issue persists',
          ],
        };
    }
  };

  const content = getErrorContent();
  const Icon = content.icon;

  const handleAction = () => {
    if (content.actionUrl) {
      window.open(content.actionUrl, '_blank');
    } else if (onRetry && content.showRetry) {
      onRetry();
    }
  };

  return (
    <div className={cn(
      'rounded-lg border p-4',
      content.bgColor,
      content.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', content.color)} />
        
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-medium text-sm', content.color)}>
            {content.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mt-1">
            {content.message}
          </p>

          {/* Guidance list */}
          {content.guidance && content.guidance.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                What you can do:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {content.guidance.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            {(content.showRetry || content.actionUrl) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAction}
                className="text-xs"
              >
                {content.actionText}
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
