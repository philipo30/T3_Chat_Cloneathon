import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useRateLimitState, 
  useIsRateLimited, 
  useIsRetrying, 
  useTimeUntilReset,
  useRemainingRequests 
} from '@/stores/RateLimitStore';

interface RateLimitStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Component to display current rate limit status
 * Shows remaining requests, time until reset, and retry status
 */
export const RateLimitStatus: React.FC<RateLimitStatusProps> = ({
  className = '',
  showDetails = false,
  compact = false,
}) => {
  const rateLimitState = useRateLimitState();
  const isRateLimited = useIsRateLimited();
  const isRetrying = useIsRetrying();
  const timeUntilReset = useTimeUntilReset();
  const remainingRequests = useRemainingRequests();

  const [displayTime, setDisplayTime] = useState<string>('');

  // Update display time every second
  useEffect(() => {
    if (!timeUntilReset) {
      setDisplayTime('');
      return;
    }

    const updateTime = () => {
      const minutes = Math.floor(timeUntilReset / 60);
      const seconds = timeUntilReset % 60;
      
      if (minutes > 0) {
        setDisplayTime(`${minutes}m ${seconds}s`);
      } else {
        setDisplayTime(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeUntilReset]);

  // Don't render if no rate limit info
  if (!rateLimitState && !isRetrying) {
    return null;
  }

  // Get status info
  const getStatusInfo = () => {
    if (isRetrying) {
      return {
        icon: Loader2,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-500/30',
        label: 'Retrying...',
        description: 'Waiting to retry request',
      };
    }

    if (isRateLimited) {
      return {
        icon: AlertTriangle,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30',
        label: 'Rate Limited',
        description: displayTime ? `Reset in ${displayTime}` : 'Rate limit active',
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/30',
      label: 'Available',
      description: remainingRequests !== null ? `${remainingRequests} requests remaining` : 'API available',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-md text-xs',
        statusInfo.bgColor,
        statusInfo.borderColor,
        'border',
        className
      )}>
        <Icon 
          className={cn(
            'h-3 w-3',
            statusInfo.color,
            isRetrying && 'animate-spin'
          )} 
        />
        <span className={statusInfo.color}>
          {statusInfo.label}
        </span>
        {displayTime && (
          <span className="text-muted-foreground">
            {displayTime}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      statusInfo.bgColor,
      statusInfo.borderColor,
      className
    )}>
      <Icon 
        className={cn(
          'h-4 w-4 flex-shrink-0',
          statusInfo.color,
          isRetrying && 'animate-spin'
        )} 
      />
      
      <div className="flex-1 min-w-0">
        <div className={cn('font-medium text-sm', statusInfo.color)}>
          {statusInfo.label}
        </div>
        
        {showDetails && (
          <div className="text-xs text-muted-foreground mt-1">
            {statusInfo.description}
          </div>
        )}
      </div>

      {/* Additional details */}
      {showDetails && rateLimitState && (
        <div className="text-xs text-muted-foreground space-y-1">
          {remainingRequests !== null && (
            <div className="flex items-center gap-1">
              <span>Requests:</span>
              <span className="font-mono">{remainingRequests}</span>
            </div>
          )}
          
          {displayTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{displayTime}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact rate limit indicator for use in headers/toolbars
 */
export const RateLimitIndicator: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <RateLimitStatus 
      className={className}
      compact={true}
    />
  );
};

/**
 * Detailed rate limit status for use in settings or status pages
 */
export const RateLimitDetails: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <RateLimitStatus 
      className={className}
      showDetails={true}
    />
  );
};
