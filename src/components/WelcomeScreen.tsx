import React, { useState, useEffect } from "react";
import { Sparkles, Newspaper, Code, GraduationCap } from "lucide-react";
import { Button } from "./ui/button";

interface WelcomeScreenProps {
  isVisible?: boolean;
  onQuestionClick?: (question: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isVisible = true,
  onQuestionClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible' | 'exiting' | 'hidden'>('hidden');

  // Enhanced animation state management
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setAnimationPhase('entering');
      // After enter animation completes, set to visible
      const enterTimer = setTimeout(() => {
        setAnimationPhase('visible');
      }, 800); // Total enter animation duration
      return () => clearTimeout(enterTimer);
    } else {
      setAnimationPhase('exiting');
      // After exit animation completes, set to hidden
      const exitTimer = setTimeout(() => {
        setIsAnimating(false);
        setAnimationPhase('hidden');
      }, 400); // Exit animation duration
      return () => clearTimeout(exitTimer);
    }
  }, [isVisible]);

  const categories = [
    { icon: Sparkles, label: "Create" },
    { icon: Newspaper, label: "Explore" },
    { icon: Code, label: "Code" },
    { icon: GraduationCap, label: "Learn" },
  ];

  const defaultQuestions = [
    "How does AI work?",
    "Are black holes real?",
    'How many Rs are in the word "strawberry"?',
    "What is the meaning of life?",
  ];

  const questionsByCategory = {
    Create: [
      "Write a short story about a robot discovering emotions ",
      "Help me outline a sci-fi novel set in a post-apocalyptic world ",
      "Create a character profile for a complex villain with sympathetic motives ",
      "Give me 5 creative writing prompts for flash fiction ",
    ],
    Explore: [
      "Good books for fans of Rick Rubin ",
      "Countries ranked by number of corgis ",
      "Most successful companies in the world ",
      "How much does Claude cost? ",
    ],
    Code: [
      "Write code to invert a binary search tree in Python ",
      "What's the difference between Promise.all and Promise.allSettled? ",
      "Explain React's useEffect cleanup function ",
      "Best practices for error handling in async/await ",
    ],
    Learn: [
      "Beginner's guide to TypeScript ",
      "Explain the CAP theorem in distributed systems ",
      "Why is AI so expensive? ",
      "Are black holes real? ",
    ],
  };

  const questions = selectedCategory
    ? questionsByCategory[selectedCategory as keyof typeof questionsByCategory]
    : defaultQuestions;

  // Enhanced animation classes based on phase
  const getContainerClasses = () => {
    const baseClasses = "flex items-start justify-start h-[625px] transition-all ease-out";
    switch (animationPhase) {
      case 'entering':
        return `${baseClasses} duration-600 opacity-0 translate-y-8 scale-95`;
      case 'visible':
        return `${baseClasses} duration-600 opacity-100 translate-y-0 scale-100`;
      case 'exiting':
        return `${baseClasses} duration-400 opacity-0 -translate-y-6 scale-95 pointer-events-none`;
      case 'hidden':
      default:
        return `${baseClasses} duration-0 opacity-0 translate-y-8 scale-95 pointer-events-none`;
    }
  };

  const getContentClasses = () => {
    const baseClasses = "w-full px-8 pt-[141.75px] transition-all ease-out";
    switch (animationPhase) {
      case 'entering':
        return `${baseClasses} duration-700 translate-y-12 opacity-0`;
      case 'visible':
        return `${baseClasses} duration-700 translate-y-0 opacity-100`;
      case 'exiting':
        return `${baseClasses} duration-300 translate-y-4 opacity-0`;
      case 'hidden':
      default:
        return `${baseClasses} duration-0 translate-y-12 opacity-0`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      <div className={getContentClasses()}>
        <h2 className={`text-3xl font-semibold leading-9 text-welcome-screen-title-text transition-all duration-600 ease-out ${
          animationPhase === 'entering'
            ? "translate-y-8 opacity-0"
            : animationPhase === 'visible'
            ? "translate-y-0 opacity-100"
            : animationPhase === 'exiting'
            ? "translate-y-4 opacity-0"
            : "translate-y-8 opacity-0"
        }`} style={{
          transitionDelay: animationPhase === 'entering' ? '150ms' : animationPhase === 'exiting' ? '0ms' : '0ms'
        }}>
          How can I help you?
        </h2>

        {/* Category buttons */}
        <div className={`flex flex-wrap gap-2.5 text-sm leading-5 mt-6 transition-all duration-600 ease-out ${
          animationPhase === 'entering'
            ? "translate-y-8 opacity-0"
            : animationPhase === 'visible'
            ? "translate-y-0 opacity-100"
            : animationPhase === 'exiting'
            ? "translate-y-4 opacity-0"
            : "translate-y-8 opacity-0"
        }`} style={{
          transitionDelay: animationPhase === 'entering' ? '250ms' : animationPhase === 'exiting' ? '50ms' : '0ms'
        }}>
          {categories.map((category, index) => (
            <Button
              key={index}
              onClick={() => setSelectedCategory(
                selectedCategory === category.label ? null : category.label
              )}
              className={`flex items-center justify-center gap-2 h-9 backdrop-blur-xl border text-sm rounded-full shadow-sm transition-all duration-400 ease-out px-5 py-2 whitespace-nowrap hover:scale-105 active:scale-95 ${
                animationPhase === 'entering'
                  ? "translate-y-6 opacity-0 scale-90"
                  : animationPhase === 'visible'
                  ? "translate-y-0 opacity-100 scale-100"
                  : animationPhase === 'exiting'
                  ? "translate-y-3 opacity-0 scale-95"
                  : "translate-y-6 opacity-0 scale-90"
              } ${
                selectedCategory === category.label
                  ? "bg-welcome-screen-button-selected-background border-welcome-screen-button-selected-border text-welcome-screen-button-selected-text font-bold hover:bg-welcome-screen-button-selected-hover-background scale-105"
                  : "bg-welcome-screen-button-background border-welcome-screen-button-border text-welcome-screen-button-text font-semibold hover:bg-welcome-screen-button-hover-background"
              }`}
              style={{
                transitionDelay: animationPhase === 'entering'
                  ? `${350 + index * 60}ms`
                  : animationPhase === 'exiting'
                  ? `${index * 30}ms`
                  : '0ms'
              }}
            >
              <category.icon className={`w-4 h-4 ${
                selectedCategory === category.label
                  ? "text-welcome-screen-button-selected-text"
                  : "text-welcome-screen-button-text"
              }`} />
              <div className={`text-sm font-semibold whitespace-nowrap ${
                selectedCategory === category.label
                  ? "text-welcome-screen-button-selected-text"
                  : "text-welcome-screen-button-text"
              }`}>
                {category.label}
              </div>
            </Button>
          ))}
        </div>

        {/* Sample questions */}
        <div
          key={selectedCategory || 'default'} // Force re-render when category changes
          className={`flex flex-col mt-6 transition-all duration-600 ease-out ${
            animationPhase === 'entering'
              ? "translate-y-10 opacity-0"
              : animationPhase === 'visible'
              ? "translate-y-0 opacity-100"
              : animationPhase === 'exiting'
              ? "translate-y-6 opacity-0"
              : "translate-y-10 opacity-0"
          }`}
          style={{
            transitionDelay: animationPhase === 'entering' ? '450ms' : animationPhase === 'exiting' ? '100ms' : '0ms'
          }}
        >
          {questions.map((question, index) => (
            <div
              key={`${selectedCategory || 'default'}-${index}`}
              className={`flex items-start gap-2 py-1 transition-all duration-500 ease-out ${
                index > 0 ? "border-t border-welcome-screen-question-border" : ""
              } ${
                animationPhase === 'entering'
                  ? "translate-y-8 opacity-0 scale-95"
                  : animationPhase === 'visible'
                  ? "translate-y-0 opacity-100 scale-100"
                  : animationPhase === 'exiting'
                  ? "translate-y-4 opacity-0 scale-98"
                  : "translate-y-8 opacity-0 scale-95"
              }`}
              style={{
                transitionDelay: animationPhase === 'entering'
                  ? `${550 + index * 80}ms`
                  : animationPhase === 'exiting'
                  ? `${index * 40}ms`
                  : '0ms'
              }}
            >
              <Button
                onClick={() => onQuestionClick?.(question)}
                className="w-full bg-transparent border-0 text-welcome-screen-question-text hover:bg-transparent px-3 py-2 text-left sm:px-3 rounded-md cursor-pointer justify-start items-start transition-all duration-250 ease-out hover:translate-x-2 hover:scale-[1.02] active:scale-[0.98] hover:bg-welcome-screen-button-background/20"
              >
                <span className="block text-welcome-screen-question-text text-left w-full">
                  {question}
                </span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced CSS animations for welcome screen
const styles = `
  @keyframes welcomeEnterContainer {
    0% {
      opacity: 0;
      transform: translateY(32px) scale(0.95);
    }
    60% {
      opacity: 0.8;
      transform: translateY(-4px) scale(1.01);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes welcomeExitContainer {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-24px) scale(0.95);
    }
  }

  @keyframes welcomeEnterElement {
    0% {
      opacity: 0;
      transform: translateY(24px) scale(0.9);
    }
    70% {
      opacity: 0.9;
      transform: translateY(-2px) scale(1.02);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes welcomeExitElement {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(16px) scale(0.95);
    }
  }

  .welcome-container-enter {
    animation: welcomeEnterContainer 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .welcome-container-exit {
    animation: welcomeExitContainer 0.4s cubic-bezier(0.5, 0, 0.75, 0) forwards;
  }

  .welcome-element-enter {
    animation: welcomeEnterElement 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .welcome-element-exit {
    animation: welcomeExitElement 0.3s cubic-bezier(0.5, 0, 0.75, 0) forwards;
  }

  /* Enhanced hover effects */
  .welcome-question-hover {
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .welcome-question-hover:hover {
    transform: translateX(8px) scale(1.02);
    background: rgba(var(--welcome-screen-button-background), 0.1);
  }

  .welcome-button-hover {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .welcome-button-hover:hover {
    transform: scale(1.05);
  }

  .welcome-button-hover:active {
    transform: scale(0.95);
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('welcome-screen-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'welcome-screen-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
