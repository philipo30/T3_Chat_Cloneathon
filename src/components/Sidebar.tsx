import React, { useRef } from "react";
import { T3ChatLogo } from "./T3ChatLogo";
import { Search, LogIn, PanelLeft, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SidebarProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isVisible, onToggle }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (!isVisible) {
    return (
      <div className="fixed left-2 top-2 z-50 flex gap-0.5 p-1 bg-[rgb(26,20,25)] rounded-md transition-all duration-150">
        <div className="absolute inset-0 backdrop-blur-sm bg-transparent rounded-md -z-10 transition-all duration-150" />
        <Button
          variant="ghost-sidebar"
          size="sm"
          onClick={onToggle}
          className="w-8 h-8 text-[rgb(231,208,221)] hover:text-white"
        >
          <PanelLeft className="w-5 h-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Button
          variant="ghost-sidebar"
          size="sm"
          className="w-8 h-8 text-[rgb(231,208,221)] hover:text-white"
        >
          <Search className="w-5 h-5" />
          <span className="sr-only">Search</span>
        </Button>
        <Button
          variant="ghost-sidebar"
          size="sm"
          className="w-8 h-8 text-[rgb(231,208,221)] hover:text-white"
        >
          <Plus className="w-5 h-5" />
          <span className="sr-only">New Chat</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-transparent p-2 z-50 flex">
      <div className="flex flex-col w-full h-full">
        {/* Header section */}
        <div className="flex flex-col gap-2 mx-1 mt-1 relative">
          {/* Logo and toggle button */}
          <div className="relative flex items-center justify-center h-8">
            <Button
              variant="ghost-sidebar"
              size="sm"
              onClick={onToggle}
              className="absolute left-0 w-8 h-8 text-[rgb(231,208,221)] hover:text-white hover:bg-gray-500/25 border-0 bg-transparent rounded-md"
            >
              <PanelLeft className="w-5 h-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <h1 className="flex items-center justify-center h-8 text-lg text-[rgb(231,208,221)] font-semibold">
              <a
                href="#"
                className="flex items-center justify-center relative w-24 h-8 text-sm font-semibold"
              >
                <T3ChatLogo className="h-full w-full" />
              </a>
            </h1>
          </div>

          {/* New Chat Button */}
          <div className="mt-1 px-1">
            <Button className="w-full h-9 bg-gradient-to-b from-[#5C2D47] to-[#3B132A] hover:from-[#6c3555] hover:to-[#4b213a] text-white font-semibold text-sm border border-[#7E3C5F] rounded-lg shadow-sm transition-colors duration-150">
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="mt-1 px-3 border-b border-[rgb(50,32,40)]">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => searchInputRef.current?.focus()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  searchInputRef.current?.focus();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Activate search input"
            >
              <Search className="w-[18px] h-[18px] text-[rgb(231,208,221)] ml-1 mr-3" />
              <Input
                ref={searchInputRef}
                role="searchbox"
                aria-label="Search threads"
                placeholder="Search your threads..."
                className="flex-1 bg-transparent border-0 text-white placeholder:text-[rgb(231,208,221)] py-2 text-sm focus-visible:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col gap-2 overflow-auto relative pb-2 mask-gradient">
          <div className="flex-shrink-0 h-0 w-full relative invisible overflow-anchor-none" />
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-2 pb-2 px-2">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-4 px-4 py-4 text-[rgb(231,208,221)] hover:bg-gray-500/25 hover:text-[rgb(231,208,221)] border-0 bg-transparent rounded-md"
          >
            <LogIn className="w-6 h-6" />
            <span>Login</span>
          </Button>
        </div>

        {/* Resize handle */}
        <div className="absolute right-0 top-0 w-2 h-full cursor-col-resize" />
      </div>
    </div>
  );
};
