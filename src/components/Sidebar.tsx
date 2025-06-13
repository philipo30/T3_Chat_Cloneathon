"use client"

import React, { useState, useRef, useEffect } from "react";
import { ChadLLMLogo } from "./ChadLLMLogo";
import { Search, LogIn, PanelLeft, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Link from "next/link";

import { LogoutButton } from "./logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSupabaseChats } from "@/hooks/useSupabaseChats";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isVisible, onToggle }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const params = useParams();
  const currentChatId = params.chatId as string;

  const { user, loading: isLoading } = useAuth();
  const {
    chats,
    deleteChat
  } = useSupabaseChats();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter chats based on search query
  const filteredChats = mounted ? chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleNewChat = () => {
    // Simply redirect to homepage for new chat
    router.push('/');
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await deleteChat(chatId);
      if (currentChatId === chatId) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Early returns after all hooks have been called
  if (!mounted) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed left-2 top-2 z-50 flex gap-0.5 p-1 bg-sidebar-component-hidden-background rounded-md transition-all duration-150">
        <div className="absolute inset-0 backdrop-blur-sm bg-transparent rounded-md -z-10 transition-all duration-150" />
        <Button
          variant="ghost-sidebar"
          size="sm"
          onClick={onToggle}
          className="w-8 h-8 text-[rgb(var(--sidebar-component-button-text))] hover:text-[rgb(var(--sidebar-component-button-hover-text))]"
        >
          <PanelLeft className="w-5 h-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Button
          variant="ghost-sidebar"
          size="sm"
          className="w-8 h-8 text-[rgb(var(--sidebar-component-button-text))] hover:text-[rgb(var(--sidebar-component-button-hover-text))]"
        >
          <Search className="w-5 h-5" />
          <span className="sr-only">Search</span>
        </Button>
        <Button
          variant="ghost-sidebar"
          size="sm"
          onClick={handleNewChat}
          className="w-8 h-8 text-[rgb(var(--sidebar-component-button-text))] hover:text-[rgb(var(--sidebar-component-button-hover-text))]"
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
              className="absolute left-0 w-8 h-8 text-[rgb(var(--sidebar-component-button-text))] hover:text-[rgb(var(--sidebar-component-button-hover-text))] hover:bg-sidebar-component-button-hover-background border-0 bg-transparent rounded-md"
            >
              <PanelLeft className="w-5 h-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <h1 className="flex items-center justify-center h-8 text-lg text-[rgb(var(--sidebar-component-title-text))] font-semibold">
              <a
                href="/"
                className="flex items-center justify-center relative w-24 h-8 text-sm font-semibold"
              >
                <ChadLLMLogo className="h-full w-full" />
              </a>
            </h1>
          </div>

          {/* New Chat Button */}
          <div className="mt-1 px-1">
            <Button
              onClick={handleNewChat}
              className="w-full h-9 bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text font-semibold text-sm border border-primary-button-border rounded-lg shadow-sm transition-colors duration-150"
            >
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="mt-1 px-3 border-b border-sidebar-component-search-border">
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
              <Search className="w-[18px] h-[18px] text-[rgb(var(--sidebar-component-search-icon-text))] ml-1 mr-3" />
              <Input
                ref={searchInputRef}
                role="searchbox"
                aria-label="Search threads"
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 text-white placeholder:text-[rgb(var(--sidebar-component-search-placeholder))] py-2 text-sm focus-visible:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col gap-2 overflow-auto relative pb-2 ">
          <div className="flex-shrink-0 h-0 w-full relative invisible overflow-anchor-none" />

          {/* Chat List */}
          <div className="px-2 space-y-1">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-3 p-3 rounded-md hover:bg-sidebar-component-button-hover-background transition-colors cursor-pointer ${
                    currentChatId === chat.id ? 'bg-sidebar-component-button-hover-background' : ''
                  }`}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[rgb(var(--sidebar-component-user-info-text))] truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))]">
                      {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[rgb(var(--sidebar-component-search-placeholder))] text-sm">
                {searchQuery ? 'No chats found' : 'No chats yet. Create your first chat!'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-2 pb-2 px-2">
          {isLoading ? (
            <div className="w-full h-12 rounded-md bg-sidebar-component-loader-background animate-pulse" />
          ) : user ? (
            <div className="flex flex-col gap-2">
              <Link href="/account">
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-4 px-4 text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-sidebar-component-button-hover-background hover:text-[rgb(var(--sidebar-component-user-info-text))] border-0 bg-transparent rounded-md h-auto"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
                    <AvatarFallback>{user.user_metadata.full_name?.[0] ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.user_metadata.full_name ?? user.email}</span>
                </Button>
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="w-full flex items-center gap-4 px-4 py-4 text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-sidebar-component-button-hover-background hover:text-[rgb(var(--sidebar-component-user-info-text))] border-0 bg-transparent rounded-md"
              >
                <LogIn className="w-6 h-6" />
                <span>Login</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Resize handle */}
        <div className="absolute right-0 top-0 w-2 h-full cursor-col-resize" />
      </div>
    </div>
  );
};
