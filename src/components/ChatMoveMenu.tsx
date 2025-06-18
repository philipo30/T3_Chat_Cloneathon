import React from 'react'
import {
  ChevronRight,
  Folder,
  Building2,
  Home,
  Check,
  Move
} from 'lucide-react'
import {
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuItem,
  ContextMenuSeparator,
} from './ui/context-menu'
import type { Chat, Workspace, Folder as FolderType, WorkspaceWithFoldersAndChats, FolderWithChats } from '@/lib/supabase/database.types'

interface ChatMoveMenuProps {
  chat: Chat
  workspaces: (Workspace & { folders?: FolderWithChats[] })[]
  onMoveToWorkspace: (workspaceId: string) => void
  onMoveToFolder: (folderId: string, workspaceId: string) => void
}

export const ChatMoveMenu: React.FC<ChatMoveMenuProps> = ({
  chat,
  workspaces,
  onMoveToWorkspace,
  onMoveToFolder
}) => {

  const isCurrentLocation = (workspaceId: string, folderId?: string) => {
    if (folderId) {
      return chat.folder_id === folderId && chat.workspace_id === workspaceId
    }
    return chat.workspace_id === workspaceId && !chat.folder_id
  }

  const getWorkspaceIcon = (workspace: Workspace) => {
    if (workspace.is_default) {
      return <Home className="w-4 h-4" style={{ color: workspace.color }} />
    }
    return <Building2 className="w-4 h-4" style={{ color: workspace.color }} />
  }

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]">
        <Move className="w-4 h-4 mr-2" />
        Move to...
        <ChevronRight className="w-4 h-4 ml-auto" />
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-72 bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))] max-h-80 overflow-y-auto">
        {workspaces.map((workspace, index) => (
          <div key={workspace.id}>
            {/* Workspace Header */}
            <div className="px-3 py-2 border-b border-[rgb(var(--sidebar-component-search-border))]/30">
              <div className="flex items-center text-xs font-semibold text-[rgb(var(--sidebar-component-user-info-text))] uppercase tracking-wide">
                {getWorkspaceIcon(workspace)}
                <span className="ml-2 truncate">{workspace.name}</span>
                {workspace.is_default && (
                  <span className="ml-auto text-xs text-[rgb(var(--sidebar-component-search-placeholder))] normal-case">Default</span>
                )}
              </div>
            </div>

            {/* Move to Workspace Root */}
            <ContextMenuItem
              onClick={() => onMoveToWorkspace(workspace.id)}
              disabled={isCurrentLocation(workspace.id)}
              className={`mx-2 my-1 text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))] rounded-md ${
                isCurrentLocation(workspace.id) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Home className="w-4 h-4 mr-3" />
              <span className="flex-1">Workspace Root</span>
              {isCurrentLocation(workspace.id) && (
                <Check className="w-4 h-4 ml-2 text-green-400" />
              )}
            </ContextMenuItem>

            {/* Show folders for this workspace */}
            {workspace.folders && workspace.folders.length > 0 && (
              <div className="mx-2 mb-2">
                <div className="px-2 py-1 mb-1">
                  <div className="flex items-center text-xs font-medium text-[rgb(var(--sidebar-component-search-placeholder))] uppercase tracking-wide">
                    <Folder className="w-3 h-3" />
                    <span className="ml-2">Folders</span>
                  </div>
                </div>
                {workspace.folders.map(folder => (
                  <ContextMenuItem
                    key={folder.id}
                    onClick={() => onMoveToFolder(folder.id, workspace.id)}
                    disabled={isCurrentLocation(workspace.id, folder.id)}
                    className={`ml-4 mb-1 text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))] rounded-md ${
                      isCurrentLocation(workspace.id, folder.id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Folder className="w-4 h-4 mr-3" style={{ color: folder.color }} />
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))] ml-2 px-1.5 py-0.5 bg-[rgb(var(--sidebar-component-search-border))]/20 rounded">
                      {folder.chats?.length || 0}
                    </span>
                    {isCurrentLocation(workspace.id, folder.id) && (
                      <Check className="w-4 h-4 ml-2 text-green-400" />
                    )}
                  </ContextMenuItem>
                ))}
              </div>
            )}

            {/* Separator between workspaces */}
            {index < workspaces.length - 1 && (
              <ContextMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))] my-2" />
            )}
          </div>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
