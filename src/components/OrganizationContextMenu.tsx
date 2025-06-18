import React from 'react'
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  FolderPlus,
  MessageSquarePlus,
  Pin,
  PinOff,
  Copy,
  Move
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu'
import { ChatMoveMenu } from './ChatMoveMenu'
import { FolderMoveMenu } from './FolderMoveMenu'
import type { Workspace, Folder, Chat, WorkspaceWithFoldersAndChats, FolderWithChats } from '@/lib/supabase/database.types'

interface WorkspaceContextMenuProps {
  children: React.ReactNode
  workspace: Workspace
  onCreateFolder: () => void
  onCreateChat: () => void
  onEditWorkspace: () => void
  onDeleteWorkspace: () => void
}

export const WorkspaceContextMenu: React.FC<WorkspaceContextMenuProps> = ({
  children,
  workspace,
  onCreateFolder,
  onCreateChat,
  onEditWorkspace,
  onDeleteWorkspace
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
        <ContextMenuItem
          onClick={onCreateChat}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </ContextMenuItem>
        
        <ContextMenuItem
          onClick={onCreateFolder}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))]" />
        
        <ContextMenuItem
          onClick={onEditWorkspace}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Workspace Settings
        </ContextMenuItem>
        
        {!workspace.is_default && (
          <>
            <ContextMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))]" />
            <ContextMenuItem
              onClick={onDeleteWorkspace}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Workspace
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface FolderContextMenuProps {
  children: React.ReactNode
  folder: Folder
  workspaces: Workspace[]
  onCreateChat: () => void
  onEditFolder: () => void
  onDeleteFolder: () => void
  onMoveToWorkspace: (workspaceId: string) => void
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  children,
  folder,
  workspaces,
  onCreateChat,
  onEditFolder,
  onDeleteFolder,
  onMoveToWorkspace
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
        <ContextMenuItem
          onClick={onCreateChat}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat in Folder
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))]" />
        
        <ContextMenuItem
          onClick={onEditFolder}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Folder Settings
        </ContextMenuItem>

        <FolderMoveMenu
          folder={folder}
          workspaces={workspaces}
          onMoveToWorkspace={onMoveToWorkspace}
        />
        
        <ContextMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))]" />
        
        <ContextMenuItem
          onClick={onDeleteFolder}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface ChatContextMenuProps {
  children: React.ReactNode
  chat: Chat
  workspaces: (Workspace & { folders?: FolderWithChats[] })[]
  onEditChat?: () => void
  onPinChat: () => void
  onMoveToWorkspace: (workspaceId: string) => void
  onMoveToFolder: (folderId: string, workspaceId: string) => void
  onDeleteChat: () => void
  onDuplicateChat?: () => void
}

export const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  children,
  chat,
  workspaces,
  onEditChat,
  onPinChat,
  onMoveToWorkspace,
  onMoveToFolder,
  onDeleteChat,
  onDuplicateChat
}) => {
  console.log('ChatContextMenu rendered for chat:', chat.title);

  return (
    <ContextMenu onOpenChange={(open) => console.log('ChatContextMenu open state changed:', open)}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
        <ContextMenuItem
          onClick={() => console.log('Test menu item clicked')}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Test Menu Item
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onPinChat}
          className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
        >
          {chat.pinned ? (
            <>
              <PinOff className="w-4 h-4 mr-2" />
              Unpin Chat
            </>
          ) : (
            <>
              <Pin className="w-4 h-4 mr-2" />
              Pin Chat
            </>
          )}
        </ContextMenuItem>

        <ChatMoveMenu
          chat={chat}
          workspaces={workspaces}
          onMoveToWorkspace={onMoveToWorkspace}
          onMoveToFolder={onMoveToFolder}
        />

        <ContextMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))]" />

        <ContextMenuItem
          onClick={onDeleteChat}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Chat
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
