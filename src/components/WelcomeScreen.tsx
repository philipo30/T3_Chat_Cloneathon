import React, { useState } from "react";
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

  return (
    <div
      className={`flex items-start justify-start h-[625px] transition-opacity duration-500 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-full px-8 pt-[141.75px] transition-all duration-300">
        <h2 className="text-3xl font-semibold leading-9 text-white">
          How can I help you?
        </h2>

        {/* Category buttons */}
        <div className="flex flex-wrap gap-2.5 text-sm leading-5 mt-6">
          {categories.map((category, index) => (
            <Button
              key={index}
              onClick={() => setSelectedCategory(
                selectedCategory === category.label ? null : category.label
              )}
              className={`flex items-center justify-center gap-2 h-9 backdrop-blur-xl border text-sm rounded-full shadow-sm transition-colors duration-150 px-5 py-2 whitespace-nowrap ${
                selectedCategory === category.label
                  ? "bg-selected border-transparent text-selected-foreground font-bold border-[#7f2d51] border-t-[0.5px] border-b-[0.5px] border-l-[1px] border-r-[1px] hover:bg-[rgba(123,28,68,0.8)]"
                  : "bg-[rgba(54,45,61,0.3)] border-[rgba(54,45,61,0.7)] text-[rgba(212,199,225,0.9)] font-semibold hover:bg-[rgba(54,45,61,0.4)]"
              }`}
            >
              <category.icon className={`w-4 h-4 ${
                selectedCategory === category.label
                  ? "text-selected-foreground"
                  : "text-[rgba(212,199,225,0.9)]"
              }`} />
              <div className={`text-sm font-semibold whitespace-nowrap ${
                selectedCategory === category.label
                  ? "text-selected-foreground"
                  : "text-[rgba(212,199,225,0.9)]"
              }`}>
                {category.label}
              </div>
            </Button>
          ))}
        </div>

        {/* Sample questions */}
        <div className="flex flex-col mt-6">
          {questions.map((question, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 py-1 ${
                index > 0 ? "border-t border-[rgba(54,45,61,0.4)]" : ""
              }`}
            >
              <Button
                onClick={() => onQuestionClick?.(question)}
                className="w-full bg-transparent border-0 text-[rgb(212,199,225)] hover:bg-transparent px-3 py-2 text-left sm:px-3 rounded-md cursor-pointer justify-start items-start"
              >
                <span className="block text-[rgb(212,199,225)] text-left w-full">
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
