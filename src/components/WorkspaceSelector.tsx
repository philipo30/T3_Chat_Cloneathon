import React, { useState } from 'react'
import { ChevronDown, Plus, Settings } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useSupabaseWorkspaces } from '@/hooks/useSupabaseWorkspaces'
import { getDefaultWorkspace, sortWorkspaces } from '@/lib/utils/workspace-utils'
import { WorkspaceIcon, FolderIcon } from '@/lib/utils/icon-mapping'
import type { Workspace } from '@/lib/supabase/database.types'

interface WorkspaceSelectorProps {
  selectedWorkspaceId?: string | null
  onWorkspaceSelect: (workspace: Workspace) => void
  onCreateWorkspace: () => void
  onCreateFolder?: () => void
  onManageWorkspaces: () => void
  className?: string
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  selectedWorkspaceId,
  onWorkspaceSelect,
  onCreateWorkspace,
  onCreateFolder,
  onManageWorkspaces,
  className = ''
}) => {
  const { workspaces, isLoadingWorkspaces, workspacesError } = useSupabaseWorkspaces()
  const [isOpen, setIsOpen] = useState(false)

  // Get the currently selected workspace
  const selectedWorkspace = selectedWorkspaceId 
    ? workspaces.find(w => w.id === selectedWorkspaceId)
    : getDefaultWorkspace(workspaces)

  // Sort workspaces for display
  const sortedWorkspaces = sortWorkspaces(workspaces)

  if (isLoadingWorkspaces) {
    return (
      <div className={`h-9 bg-[rgb(var(--sidebar-component-loader-background))] animate-pulse rounded-md ${className}`} />
    )
  }

  if (workspacesError) {
    return (
      <div className={`h-9 px-3 flex items-center text-red-400 text-sm rounded-md border border-red-400/20 ${className}`}>
        Failed to load workspaces
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`
            w-full justify-between h-9 px-3 
            text-[rgb(var(--sidebar-component-user-info-text))] 
            hover:bg-[rgb(var(--sidebar-component-button-hover-background))]
            border border-[rgb(var(--sidebar-component-search-border))]
            rounded-md transition-all duration-150
            ${className}
          `}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <WorkspaceIcon
              iconName={selectedWorkspace?.icon || 'folder'}
              className="w-4 h-4 flex-shrink-0"
              style={{ color: selectedWorkspace?.color || '#8B5CF6' }}
            />
            <span className="truncate text-sm">
              {selectedWorkspace?.name || 'Select Workspace'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]"
        align="start"
        sideOffset={4}
      >
        {/* Workspace List */}
        {sortedWorkspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => {
              onWorkspaceSelect(workspace)
              setIsOpen(false)
            }}
            className={`
              flex items-center gap-3 px-3 py-2 cursor-pointer
              text-[rgb(var(--sidebar-component-user-info-text))]
              hover:bg-[rgb(var(--sidebar-component-button-hover-background))]
              ${selectedWorkspace?.id === workspace.id ? 'bg-[rgb(var(--sidebar-component-button-hover-background))]' : ''}
            `}
          >
            <WorkspaceIcon
              iconName={workspace.icon}
              className="w-4 h-4 flex-shrink-0"
              style={{ color: workspace.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {workspace.name}
                </span>
                {workspace.is_default && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--primary-button-gradient-from))] text-white">
                    Default
                  </span>
                )}
              </div>
              {workspace.description && (
                <p className="text-xs text-[rgb(var(--sidebar-component-search-placeholder))] truncate">
                  {workspace.description}
                </p>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {sortedWorkspaces.length > 0 && <DropdownMenuSeparator className="bg-[rgb(var(--sidebar-component-search-border))]" />}

        {/* Actions */}
        <DropdownMenuItem
          onClick={() => {
            onCreateWorkspace()
            setIsOpen(false)
          }}
          className="
            flex items-center gap-3 px-3 py-2 cursor-pointer
            text-[rgb(var(--sidebar-component-user-info-text))]
            hover:bg-[rgb(var(--sidebar-component-button-hover-background))]
          "
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Create Workspace</span>
        </DropdownMenuItem>

        {onCreateFolder && selectedWorkspace && (
          <DropdownMenuItem
            onClick={() => {
              onCreateFolder()
              setIsOpen(false)
            }}
            className="
              flex items-center gap-3 px-3 py-2 cursor-pointer
              text-[rgb(var(--sidebar-component-user-info-text))]
              hover:bg-[rgb(var(--sidebar-component-button-hover-background))]
            "
          >
            <FolderIcon iconName="folder" className="w-4 h-4" />
            <span className="text-sm">Create Folder</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => {
            onManageWorkspaces()
            setIsOpen(false)
          }}
          className="
            flex items-center gap-3 px-3 py-2 cursor-pointer
            text-[rgb(var(--sidebar-component-user-info-text))]
            hover:bg-[rgb(var(--sidebar-component-button-hover-background))]
          "
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Manage Workspaces</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
