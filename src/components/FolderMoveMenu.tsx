import React from 'react'
import { 
  ChevronRight, 
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
import type { Workspace, Folder as FolderType } from '@/lib/supabase/database.types'

interface FolderMoveMenuProps {
  folder: FolderType
  workspaces: Workspace[]
  onMoveToWorkspace: (workspaceId: string) => void
}

export const FolderMoveMenu: React.FC<FolderMoveMenuProps> = ({
  folder,
  workspaces,
  onMoveToWorkspace
}) => {
  const isCurrentWorkspace = (workspaceId: string) => {
    return folder.workspace_id === workspaceId
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
        Move to Workspace...
        <ChevronRight className="w-4 h-4 ml-auto" />
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-64 bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))] max-h-80 overflow-y-auto">
        {workspaces.map((workspace, index) => (
          <div key={workspace.id}>
            <ContextMenuItem
              onClick={() => onMoveToWorkspace(workspace.id)}
              disabled={isCurrentWorkspace(workspace.id)}
              className={`mx-2 my-1 text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))] rounded-md ${
                isCurrentWorkspace(workspace.id) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {getWorkspaceIcon(workspace)}
              <span className="flex-1 ml-3 truncate">{workspace.name}</span>
              {workspace.is_default && (
                <span className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))] ml-2">Default</span>
              )}
              {isCurrentWorkspace(workspace.id) && (
                <Check className="w-4 h-4 ml-2 text-green-400" />
              )}
            </ContextMenuItem>

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
