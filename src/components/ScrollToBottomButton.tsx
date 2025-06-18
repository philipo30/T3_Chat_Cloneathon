import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  /**
   * Whether the button should be visible
   */
  visible: boolean;
  /**
   * Callback when button is clicked
   */
  onClick: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * A floating button that appears when user scrolls up,
 * allowing them to quickly return to the bottom of the chat
 */
export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onClick,
  className = '',
}) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl pointer-events-none z-40">
      <div className="absolute bottom-36 right-[-120px] pointer-events-auto">
        <button
          onClick={onClick}
          className={`
            w-10 h-10
            bg-white/10
            hover:bg-white/20
            backdrop-blur-xl
            border border-white/20
            text-white
            rounded-full
            shadow-lg shadow-black/25
            flex items-center justify-center
            transition-all duration-200 ease-out
            hover:scale-105 active:scale-95
            ${className}
          `}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
