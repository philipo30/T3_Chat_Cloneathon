"use client"

import React, { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { HomeContent } from "@/components/HomeContent";
import { ChatContent } from "@/components/ChatContent";

interface ContentRouterProps {
  onApiKeyModalOpen: () => void;
}

export const ContentRouter: React.FC<ContentRouterProps> = ({ onApiKeyModalOpen }) => {
  const pathname = usePathname();
  const params = useParams();
  const [currentRoute, setCurrentRoute] = useState(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update route when pathname changes
  useEffect(() => {
    if (pathname !== currentRoute) {
      setIsTransitioning(true);
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setCurrentRoute(pathname);
        setIsTransitioning(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pathname, currentRoute]);

  // Determine which content to render based on current route
  const renderContent = () => {
    // Chat page route
    if (currentRoute?.startsWith('/chat/') && params?.chatId) {
      return (
        <ChatContent
          chatId={params.chatId as string}
          onApiKeyModalOpen={onApiKeyModalOpen}
        />
      );
    }
    
    // Default to home content
    return <HomeContent onApiKeyModalOpen={onApiKeyModalOpen} />;
  };

  return (
    <div 
      className={`transition-opacity duration-150 ${
        isTransitioning ? 'opacity-95' : 'opacity-100'
      }`}
    >
      {renderContent()}
    </div>
  );
};
