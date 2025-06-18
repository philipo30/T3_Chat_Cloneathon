import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSupabaseWorkspaces } from '@/hooks/useSupabaseWorkspaces'
import { getDefaultWorkspace } from '@/lib/utils/workspace-utils'
import { autoMigrateWorkspaces } from '@/lib/utils/workspace-migration'
import type { Workspace, Folder } from '@/lib/supabase/database.types'

interface WorkspaceContextType {
  selectedWorkspaceId: string | null
  selectedFolderId: string | null
  selectedWorkspace: Workspace | null
  selectedFolder: Folder | null
  setSelectedWorkspaceId: (workspaceId: string | null) => void
  setSelectedFolderId: (folderId: string | null) => void
  clearFolderSelection: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

interface WorkspaceProviderProps {
  children: ReactNode
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  
  const { workspaces, isLoadingWorkspaces } = useSupabaseWorkspaces()

  // Perform automatic workspace migration on mount
  useEffect(() => {
    if (!isLoadingWorkspaces) {
      autoMigrateWorkspaces().catch(error => {
        console.error('Auto migration failed:', error)
      })
    }
  }, [isLoadingWorkspaces])

  // Set default workspace on mount
  useEffect(() => {
    if (!isLoadingWorkspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      const defaultWorkspace = getDefaultWorkspace(workspaces)
      if (defaultWorkspace) {
        setSelectedWorkspaceId(defaultWorkspace.id)
      }
    }
  }, [workspaces, isLoadingWorkspaces, selectedWorkspaceId])

  // Clear folder selection when workspace changes
  useEffect(() => {
    setSelectedFolderId(null)
  }, [selectedWorkspaceId])

  // Get current workspace and folder objects
  const selectedWorkspace = selectedWorkspaceId 
    ? workspaces.find(w => w.id === selectedWorkspaceId) || null
    : null

  const selectedFolder = selectedFolderId && selectedWorkspace
    ? selectedWorkspace.folders?.find(f => f.id === selectedFolderId) || null
    : null

  const clearFolderSelection = () => {
    setSelectedFolderId(null)
  }

  const value: WorkspaceContextType = {
    selectedWorkspaceId,
    selectedFolderId,
    selectedWorkspace,
    selectedFolder,
    setSelectedWorkspaceId,
    setSelectedFolderId,
    clearFolderSelection,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspaceContext = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}
