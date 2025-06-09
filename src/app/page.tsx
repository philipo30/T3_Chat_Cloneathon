'use client';

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatInput } from "@/components/ChatInput";
import { DecorativeLine } from "@/components/DecorativeLine";

export default function Page() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    // Hide welcome screen when user starts typing
    if (value.trim().length > 0) {
      setIsWelcomeVisible(false);
    } else {
      setIsWelcomeVisible(true);
    }
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    setIsWelcomeVisible(false);
  };
  return (
    <div className="min-h-screen w-full text-white font-feature-settings-normal font-variant-normal font-variant-numeric-normal letter-spacing-normal outline-white text-decoration-white text-emphasis-white view-transition-name-root overflow-hidden">
      {/* Main background layers */}
      <div className="fixed inset-0 bg-[rgb(19,19,20)] z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`,
          }}
        />
        <div className="absolute inset-0 noise-bg" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Layout container */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar isVisible={isSidebarVisible} onToggle={toggleSidebar} />

        {/* Main content area */}
        <main
          className={`flex-1 flex flex-col min-h-screen overflow-hidden relative transition-all duration-150 w-full ${
            isSidebarVisible ? "ml-64" : "ml-0"
          }`}
        >
          {/* Chat area background */}
          <div
            className={`absolute inset-0 bg-[rgb(31,26,36)] border-t border-[rgb(50,32,40)] overflow-hidden pb-[140px] transform transition-all duration-150 ${
              isSidebarVisible
                ? "border-l rounded-tl-3xl translate-y-3.5"
                : "rounded-t-3xl"
            }`}
          >
            <div
              className={`absolute left-0 right-0 bottom-0 bg-fixed noise-bg bg-[100%_100%] bg-[96px_96px] transition-all duration-150 ${
                isSidebarVisible ? "-top-3.5" : "top-0"
              }`}
            />
          </div>

          {/* Top bar */}
          <TopBar />

          {/* Decorative line */}
          <DecorativeLine />

          {/* Main chat content */}
          <div className="absolute inset-0 top-0 w-full">
            <div className="absolute inset-0 overflow-auto chat-scrollbar pb-36 pt-3.5 scrollbar-gutter-stable-both-edges">
              {/* Chat messages container */}
              <div
                role="log"
                aria-label="Chat messages"
                aria-live="polite"
                className="flex flex-col mx-auto max-w-3xl pb-10 px-4 pt-10 w-full"
              >
                <WelcomeScreen
                  isVisible={isWelcomeVisible}
                  onQuestionClick={handleQuestionClick}
                />
              </div>
            </div>
          </div>

          {/* Chat input */}
          <ChatInput value={inputValue} onInputChange={handleInputChange} />
        </main>
      </div>

      {/* Notifications and other elements */}
      <section
        aria-label="Notifications alt+T"
        tabIndex={-1}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
      />

      {/* Hidden textarea for measuring text */}
      <textarea
        tabIndex={-1}
        aria-hidden="true"
        className="absolute right-0 top-0 h-0 w-[726px] -z-[1000] bg-gray-600 overflow-hidden whitespace-pre-wrap break-words resize-y invisible"
      />

      <div className="hidden" />
    </div>
  );
} 