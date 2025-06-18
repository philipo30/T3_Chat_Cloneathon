"use client"

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ShareModal } from "@/components/ShareModal";
import { ContentRouter } from "@/components/ContentRouter";
import { useApiKey } from "@/hooks/useApiKey";
import { usePathname, useParams } from "next/navigation";
import { useSupabaseChat } from "@/hooks/useSupabaseChats";

export const AppLayout: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width
  const { apiKey, saveApiKey } = useApiKey();
  const pathname = usePathname();
  const params = useParams();
  
  // Get current chat info for sharing
  const currentChatId = pathname?.startsWith('/chat/') ? params?.chatId as string : null;
  const { chat } = useSupabaseChat(currentChatId);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
  };

  const handleSaveApiKey = (key: string) => {
    saveApiKey(key);
    setApiKeyModalOpen(false);
  };

  const handleApiKeyModalOpen = () => {
    setApiKeyModalOpen(true);
  };

  const handleShareModalOpen = () => {
    setShareModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full text-white font-feature-settings-normal font-variant-normal font-variant-numeric-normal letter-spacing-normal outline-white text-decoration-white text-emphasis-white view-transition-name-root overflow-hidden">
      {/* Main background layers */}
      <div className="fixed inset-0 bg-app-page-background z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(closest-corner at 120px 36px, rgba(var(--app-page-gradient-start), 0.19), rgba(var(--app-page-gradient-start), 0.08)), linear-gradient(rgb(var(--app-page-gradient-mid)) 15%, rgb(var(--app-page-gradient-end)))`,
          }}
        />
        <div className="absolute inset-0 noise-bg" />
        <div className="absolute inset-0 bg-app-page-overlay" />
      </div>

      {/* Layout container */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar
          isVisible={isSidebarVisible}
          onToggle={toggleSidebar}
          onWidthChange={handleSidebarWidthChange}
        />

        {/* Main content area */}
        <main
          className="flex-1 flex flex-col min-h-screen overflow-hidden relative transition-all duration-200 ease-linear w-full"
          style={{
            marginLeft: isSidebarVisible ? `${sidebarWidth}px` : '0px'
          }}
        >
          {/* Chat area background */}
          <div
            className={`absolute inset-0 bg-app-main-background border-t border-app-main-border overflow-hidden pb-[140px] transform transition-all duration-150 ${
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
          <TopBar 
            isSidebarVisible={isSidebarVisible} 
            onShareClick={handleShareModalOpen}
          />

          {/* Dynamic content area */}
          <ContentRouter onApiKeyModalOpen={handleApiKeyModalOpen} />
        </main>
      </div>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
      />

      {currentChatId && chat && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setShareModalOpen(false)}
          chatId={currentChatId}
          chatTitle={chat.title}
        />
      )}

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
};
