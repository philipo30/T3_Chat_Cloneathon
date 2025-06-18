"use client"

import React, { useState, useRef, useEffect } from "react";
import { ChadLLMLogo } from "./ChadLLMLogo";
import { Search, LogIn, PanelLeft, Plus, Trash2, Pin, PinOff, ChevronDown, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Link from "next/link";

import { LogoutButton } from "./logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSupabaseChats } from "@/hooks/useSupabaseChats";
import { useSupabaseWorkspaces, useSupabaseWorkspace } from "@/hooks/useSupabaseWorkspaces";
import { useChatOrganization } from "@/hooks/useChatOrganization";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

import { Chat, Workspace, Folder as FolderType, WorkspaceWithFoldersAndChats, FolderWithChats } from "@/lib/supabase/database.types";
import { useSidebarResize } from "@/hooks/useSidebarResize";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { WorkspaceCreator } from "./WorkspaceCreator";
import { WorkspaceManager } from "./WorkspaceManager";
import { FolderCreator } from "./FolderCreator";
import { FolderSettings } from "./FolderSettings";
import { DragDropSidebar } from "./DragDropSidebar";
import { DraggableItem } from "./DraggableItem";
import { DroppableArea } from "./DroppableArea";
import { getDefaultWorkspace, sortWorkspaces, organizeWorkspaceData, searchInWorkspace } from "@/lib/utils/workspace-utils";
import { useGroupedChats } from "@/hooks/useGroupedChats";
import { FolderIcon } from "@/lib/utils/icon-mapping";

interface SidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  onWidthChange?: (width: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isVisible, onToggle, onWidthChange }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modal states
  const [showWorkspaceCreator, setShowWorkspaceCreator] = useState(false);
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [showFolderSettings, setShowFolderSettings] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);

  const router = useRouter();
  const params = useParams();
  const currentChatId = params?.chatId as string;

  const { user, loading: isLoading } = useAuth();
  const {
    chats,
    deleteChat,
    pinChat,
    unpinChat,
    isPinningChat,
    isUnpinningChat
  } = useSupabaseChats();

  const { workspaces, isLoadingWorkspaces } = useSupabaseWorkspaces();
  const { workspace: fullWorkspaceData, isLoadingWorkspace } = useSupabaseWorkspace(selectedWorkspaceId);
  const { moveChatToFolder, moveChatToWorkspace, moveFolderToWorkspace } = useChatOrganization();

  // Create workspaces with folder data for the move menu
  const workspacesWithFolders = React.useMemo(() => {
    if (!fullWorkspaceData) return workspaces.map(w => ({ ...w, folders: [] }));

    return workspaces.map(workspace => {
      if (workspace.id === fullWorkspaceData.id) {
        return {
          ...workspace,
          folders: fullWorkspaceData.folders || []
        };
      }
      return { ...workspace, folders: [] };
    });
  }, [workspaces, fullWorkspaceData]);

  // Sidebar resize functionality
  const { sidebarWidth, isResizing, handleMouseDown } = useSidebarResize();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Notify parent component about width changes
  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(sidebarWidth);
    }
  }, [sidebarWidth, onWidthChange]);

  // Set default workspace on mount
  useEffect(() => {
    if (mounted && workspaces.length > 0 && !selectedWorkspaceId) {
      const defaultWorkspace = getDefaultWorkspace(workspaces);
      if (defaultWorkspace) {
        setSelectedWorkspaceId(defaultWorkspace.id);
      }
    }
  }, [mounted, workspaces, selectedWorkspaceId]);



  const handleNewChat = () => {
    // Simply redirect to homepage for new chat
    router.push('/');
  };





  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspaceId(workspace.id);
  };

  const handleCreateFolder = () => {
    setShowFolderCreator(true);
  };

  const handleEditFolder = (folder: FolderType) => {
    setSelectedFolder(folder);
    setShowFolderSettings(true);
  };

  const handleDeleteFolder = async (folderId: string) => {
    // TODO: Add confirmation dialog
    try {
      // Implementation will be added when we have the delete folder function
      console.log('Delete folder:', folderId);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleCreateChatInFolder = (folderId: string) => {
    // Set the folder as selected and navigate to homepage to create new chat
    setSelectedFolderId(folderId);
    router.push('/');
  };

  const handleCreateChatInWorkspace = (workspaceId: string) => {
    // Set the workspace as selected, clear folder selection, and navigate to homepage
    setSelectedWorkspaceId(workspaceId);
    setSelectedFolderId(null);
    router.push('/');
  };

  const handleMoveToWorkspace = async (chatId: string, workspaceId: string) => {
    try {
      await moveChatToWorkspace(chatId, workspaceId);
    } catch (error) {
      console.error('Failed to move chat to workspace:', error);
    }
  };

  const handleMoveToFolder = async (chatId: string, folderId: string, workspaceId: string) => {
    try {
      await moveChatToFolder(chatId, folderId, workspaceId);
    } catch (error) {
      console.error('Failed to move chat to folder:', error);
    }
  };

  const handleMoveFolderToWorkspace = async (folderId: string, workspaceId: string) => {
    try {
      await moveFolderToWorkspace(folderId, workspaceId);
    } catch (error) {
      console.error('Failed to move folder to workspace:', error);
    }
  };

  const handlePinToggle = async (chat: Chat, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation to chat

    try {
      if (chat.pinned) {
        await unpinChat(chat.id);
      } else {
        await pinChat(chat.id);
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation to chat

    try {
      await deleteChat(chatId);
      // If we're currently viewing the deleted chat, redirect to home
      if (currentChatId === chatId) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Component for rendering time-based chat groups
  const ChatGroupView: React.FC<{
    group: { id: string; label: string; chats: Chat[]; priority: number };
    workspace: WorkspaceWithFoldersAndChats;
    onChatClick: (chatId: string) => void;
  }> = ({ group, workspace, onChatClick }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    if (group.chats.length === 0) return null;

    const shouldShowCollapseButton = group.chats.length >= 3;

    return (
      <div className="space-y-1">
        {/* Group Header */}
        <div className="flex items-center gap-2 px-2 py-1">
          {shouldShowCollapseButton && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-0.5 rounded hover:bg-[rgb(var(--sidebar-component-button-hover-background))] transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  isCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>
          )}
          {!shouldShowCollapseButton && <div className="w-4" />}

          {group.id === 'pinned' && <Pin className="w-3 h-3" />}

          <span className="text-xs font-medium text-[rgb(var(--sidebar-component-search-placeholder))] uppercase tracking-wide">
            {group.label}
          </span>

          <span className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))] ml-auto">
            {group.chats.length}
          </span>
        </div>

        {/* Group Chats */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'max-h-0 opacity-0 transform translate-y-[-8px] scale-95'
              : 'max-h-[1000px] opacity-100 transform translate-y-0 scale-100'
          }`}
        >
          <DroppableArea
            id={`group-${group.id}`}
            type="workspace"
            item={workspace}
            acceptTypes={['chat']}
            className="space-y-1 px-2"
          >
            {group.chats.map(chat => (
              <DraggableItem
                key={chat.id}
                id={`chat-${chat.id}`}
                type="chat"
                item={chat}
                sourceContainer={{ type: 'workspace', id: workspace.id }}
              >
                <ChatItem chat={chat} onChatClick={onChatClick} />
              </DraggableItem>
            ))}
          </DroppableArea>
        </div>
      </div>
    );
  };

  // Component for rendering workspace with folders and chats
  const WorkspaceView: React.FC<{
    workspace: WorkspaceWithFoldersAndChats;
    workspaces: Workspace[];
    workspacesWithFolders: (Workspace & { folders?: FolderWithChats[] })[];
    currentChatId: string;
    searchQuery: string;
    collapsedFolders: Set<string>;
    onToggleFolderCollapse: (folderId: string) => void;
    onChatClick: (chatId: string) => void;
    onPinToggle: (chat: Chat, event: React.MouseEvent) => void;
    onDeleteChat: (chatId: string, event: React.MouseEvent) => void;
    onCreateFolder: () => void;
    onEditFolder: (folder: FolderType) => void;
  }> = ({
    workspace,
    workspaces,
    workspacesWithFolders,
    currentChatId,
    searchQuery,
    collapsedFolders,
    onToggleFolderCollapse,
    onChatClick,
    onPinToggle,
    onDeleteChat,
    onCreateFolder,
    onEditFolder
  }) => {
    // Enhanced search functionality
    const searchLower = searchQuery.toLowerCase().trim();

    // Use grouped chats for time-based organization
    const { nonEmptyGroups } = useGroupedChats(workspace.chats || [], { searchQuery });

    // Filter folders and their chats based on search
    const filteredFolders = workspace.folders?.map(folder => {
      const folderMatches = !searchLower || folder.name.toLowerCase().includes(searchLower);
      const filteredChats = folder.chats?.filter(chat => {
        if (!searchLower) return true;
        return chat.title.toLowerCase().includes(searchLower);
      }) || [];

      return {
        ...folder,
        chats: filteredChats,
        _folderMatches: folderMatches
      };
    }).filter(folder =>
      !searchLower || folder._folderMatches || folder.chats.length > 0
    ) || [];

    return (
      <div className="space-y-2">
        {/* Workspace Header - invisible spacer */}
        <div className="h-2 w-full"></div>

        {/* Folders - positioned at the top of the workspace */}
        <DroppableArea
          id="workspace-folders"
          type="workspace"
          item={workspace}
          acceptTypes={['folder']}
          className="space-y-1"
        >
          {filteredFolders.map(folder => (
            <DraggableItem
              key={folder.id}
              id={`folder-${folder.id}`}
              type="folder"
              item={folder}
              sourceContainer={{ type: 'workspace', id: workspace.id }}
            >
              <FolderView
                folder={folder}
                workspaces={workspaces}
                workspacesWithFolders={workspacesWithFolders}
                currentWorkspace={workspace}
                isCollapsed={collapsedFolders.has(folder.id)}
                onToggleCollapse={() => onToggleFolderCollapse(folder.id)}
                onChatClick={onChatClick}
                onPinToggle={onPinToggle}
                onDeleteChat={onDeleteChat}
                onEditFolder={() => onEditFolder(folder)}
              />
            </DraggableItem>
          ))}
        </DroppableArea>

        {/* Time-based chat groups - positioned below folders */}
        {nonEmptyGroups.map(group => (
          <ChatGroupView
            key={group.id}
            group={group}
            workspace={workspace}
            onChatClick={onChatClick}
          />
        ))}

        {/* Search Results Summary */}
        {searchQuery && (
          <div className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))] px-2 py-1">
            {nonEmptyGroups.reduce((sum, group) => sum + group.chats.length, 0) + filteredFolders.reduce((sum, f) => sum + f.chats.length, 0)} results in "{workspace.name}"
          </div>
        )}

        {/* Empty state */}
        {nonEmptyGroups.length === 0 && filteredFolders.length === 0 && (
          <div className="text-center py-4 text-[rgb(var(--sidebar-component-search-placeholder))] text-sm">
            {searchQuery ? 'No chats found' : 'No chats in this workspace yet'}
          </div>
        )}
      </div>
    );
  };

  // Component for rendering individual chat items
  const ChatItem: React.FC<{ chat: Chat; onChatClick: (chatId: string) => void }> = ({ chat, onChatClick }) => {
    return (
      <div
        className={`group flex items-center gap-2 p-2 rounded-md hover:bg-[rgb(var(--sidebar-component-button-hover-background))] transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
          currentChatId === chat.id ? 'bg-[rgb(var(--sidebar-component-button-hover-background))] shadow-sm' : ''
        } ${chat.pinned ? 'sidebar-pinned-chat border-l-2 border-[rgb(var(--primary-button-gradient-from))]' : ''}`}
        onClick={() => onChatClick(chat.id)}

      >
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[rgb(var(--sidebar-component-user-info-text))] truncate">
          {chat.title}
        </div>
        <div className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))]">
          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
        </div>
      </div>

      {/* Pin/Unpin Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handlePinToggle(chat, e);
        }}
        disabled={isPinningChat || isUnpinningChat}
        className="opacity-0 group-hover:opacity-100 sidebar-pin-button w-6 h-6 p-0"
        title={chat.pinned ? 'Unpin chat' : 'Pin chat'}
      >
        {chat.pinned ? (
          <PinOff className="w-3 h-3 sidebar-pinned-icon" />
        ) : (
          <Pin className="w-3 h-3" />
        )}
      </Button>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteChat(chat.id, e);
        }}
        className="opacity-0 group-hover:opacity-100 sidebar-delete-button w-6 h-6 p-0"
        title="Delete chat"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
    );
  };

  // Component for rendering folders with their chats
  const FolderView: React.FC<{
    folder: FolderWithChats;
    workspaces: Workspace[];
    workspacesWithFolders: (Workspace & { folders?: FolderWithChats[] })[];
    currentWorkspace: WorkspaceWithFoldersAndChats;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onChatClick: (chatId: string) => void;
    onPinToggle: (chat: Chat, event: React.MouseEvent) => void;
    onDeleteChat: (chatId: string, event: React.MouseEvent) => void;
    onEditFolder: () => void;
  }> = ({
    folder,
    workspaces,
    workspacesWithFolders,
    currentWorkspace,
    isCollapsed,
    onToggleCollapse,
    onChatClick,
    onPinToggle,
    onDeleteChat,
    onEditFolder
  }) => {

    return (
      <div className="space-y-1">
        {/* Folder Header */}
        <DroppableArea
          id={`folder-${folder.id}`}
          type="folder"
          item={folder}
          acceptTypes={['chat']}
        >
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-[rgb(var(--sidebar-component-button-hover-background))] transition-all duration-200 group">
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={onToggleCollapse}
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  isCollapsed ? '-rotate-90' : ''
                }`}
              />
              <FolderIcon
                iconName={folder.icon}
                className="w-4 h-4 flex-shrink-0"
                style={{ color: folder.color }}
              />
              <span className="text-sm text-[rgb(var(--sidebar-component-user-info-text))] truncate flex-1">
                {folder.name}
              </span>
              <span className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))] opacity-0 group-hover:opacity-100">
                {folder.chats?.length || 0}
              </span>
            </div>

            {/* Edit Folder Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditFolder();
              }}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0 text-[rgb(var(--sidebar-component-search-placeholder))] hover:text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
              title="Edit folder"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </DroppableArea>

        {/* Folder Chats */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'max-h-0 opacity-0 transform translate-y-[-8px] scale-95'
              : 'max-h-[1000px] opacity-100 transform translate-y-0 scale-100'
          }`}
        >
          <div className="ml-6 space-y-1">
            {folder.chats?.map(chat => (
              <DraggableItem
                key={chat.id}
                id={`chat-${chat.id}`}
                type="chat"
                item={chat}
                sourceContainer={{ type: 'folder', id: folder.id }}
              >
                <ChatItem chat={chat} onChatClick={onChatClick} />
              </DraggableItem>
            ))}
          </div>
        </div>
      </div>
    );
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
    <div
      className="fixed left-0 top-0 bottom-0 bg-transparent p-2 z-50 flex transition-all duration-200 ease-linear"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="flex flex-col w-full h-full relative">
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

          {/* Workspace Selector */}
          <div className="mt-2 px-2">
            <WorkspaceSelector
              selectedWorkspaceId={selectedWorkspaceId}
              onWorkspaceSelect={handleWorkspaceSelect}
              onCreateWorkspace={() => setShowWorkspaceCreator(true)}
              onCreateFolder={handleCreateFolder}
              onManageWorkspaces={() => setShowWorkspaceManager(true)}
            />
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col gap-2 overflow-auto relative pb-2 ">
          <div className="flex-shrink-0 h-0 w-full relative invisible overflow-anchor-none" />

          {/* Hierarchical Chat Organization */}
          <div className="px-2 space-y-2">
            {fullWorkspaceData ? (
              <DragDropSidebar
                workspace={organizeWorkspaceData(fullWorkspaceData)}
                onChatClick={(chatId: string) => router.push(`/chat/${chatId}`)}
                onPinToggle={handlePinToggle}
                onDeleteChat={handleDeleteChat}
              >
                <WorkspaceView
                  workspace={organizeWorkspaceData(fullWorkspaceData)}
                  workspaces={workspaces}
                  workspacesWithFolders={workspacesWithFolders}
                  currentChatId={currentChatId}
                  searchQuery={searchQuery}
                  collapsedFolders={collapsedFolders}
                  onToggleFolderCollapse={toggleFolderCollapse}
                  onChatClick={(chatId: string) => router.push(`/chat/${chatId}`)}
                  onPinToggle={handlePinToggle}
                  onDeleteChat={handleDeleteChat}
                  onCreateFolder={handleCreateFolder}
                  onEditFolder={handleEditFolder}
                />
              </DragDropSidebar>
            ) : isLoadingWorkspaces || isLoadingWorkspace ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 bg-[rgb(var(--sidebar-component-loader-background))] animate-pulse rounded-md" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[rgb(var(--sidebar-component-search-placeholder))] text-sm">
                No workspace found. Create your first workspace!
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
        <div
          className="sidebar-resize-handle"
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
        />
      </div>

      {/* Modals */}
      <WorkspaceCreator
        isOpen={showWorkspaceCreator}
        onClose={() => setShowWorkspaceCreator(false)}
        onWorkspaceCreated={(workspaceId) => {
          setSelectedWorkspaceId(workspaceId);
          setShowWorkspaceCreator(false);
        }}
      />

      <WorkspaceManager
        isOpen={showWorkspaceManager}
        onClose={() => setShowWorkspaceManager(false)}
        selectedWorkspaceId={selectedWorkspaceId}
        onWorkspaceSelect={(workspace) => {
          setSelectedWorkspaceId(workspace.id);
          setShowWorkspaceManager(false);
        }}
      />

      {fullWorkspaceData && (
        <FolderCreator
          isOpen={showFolderCreator}
          onClose={() => setShowFolderCreator(false)}
          workspace={fullWorkspaceData}
          existingFolders={fullWorkspaceData.folders || []}
          onFolderCreated={() => setShowFolderCreator(false)}
        />
      )}

      {selectedFolder && fullWorkspaceData && (
        <FolderSettings
          isOpen={showFolderSettings}
          onClose={() => {
            setShowFolderSettings(false);
            setSelectedFolder(null);
          }}
          folder={selectedFolder}
          existingFolders={fullWorkspaceData.folders || []}
          onFolderUpdated={() => setShowFolderSettings(false)}
          onFolderDeleted={() => {
            setShowFolderSettings(false);
            setSelectedFolder(null);
          }}
        />
      )}
    </div>
  );
};
