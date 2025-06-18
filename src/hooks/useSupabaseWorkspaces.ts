import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/lib/supabase/chat-service'
import type { 
  Workspace, 
  WorkspaceInsert, 
  WorkspaceUpdate, 
  Folder, 
  FolderInsert, 
  FolderUpdate,
  WorkspaceWithFoldersAndChats 
} from '@/lib/supabase/database.types'
import { useAuth } from './useAuth'

export function useSupabaseWorkspaces() {
  const queryClient = useQueryClient()
  const { user: currentUser, loading } = useAuth()

  // Query for user's workspaces
  const {
    data: workspaces = [],
    isLoading: isLoadingWorkspaces,
    error: workspacesError,
  } = useQuery({
    queryKey: ['user-workspaces', currentUser?.id],
    queryFn: () => chatService.getUserWorkspaces(),
    enabled: !!currentUser && !loading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Real-time subscription for workspace updates
  useEffect(() => {
    if (!currentUser || loading) return

    let timeoutId: NodeJS.Timeout

    const subscription = chatService.subscribeToUserWorkspaces(currentUser.id, (payload) => {
      // Throttle invalidations to prevent excessive refetching
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-workspaces', currentUser.id] })
        // Also invalidate individual workspace queries
        queryClient.invalidateQueries({ queryKey: ['workspace-with-folders'] })
      }, 500)
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [currentUser, loading, queryClient])

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data: Omit<WorkspaceInsert, 'user_id'>) =>
      chatService.createWorkspace(data),
    onSuccess: (newWorkspace) => {
      queryClient.setQueryData(['user-workspaces', currentUser?.id], (old: Workspace[] = []) => [
        newWorkspace,
        ...old,
      ])
      queryClient.invalidateQueries({ queryKey: ['user-workspaces', currentUser?.id] })
    },
  })

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ workspaceId, updates }: { workspaceId: string; updates: WorkspaceUpdate }) =>
      chatService.updateWorkspace(workspaceId, updates),
    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData(['user-workspaces', currentUser?.id], (old: Workspace[] = []) =>
        old.map((workspace) =>
          workspace.id === updatedWorkspace.id ? updatedWorkspace : workspace
        )
      )
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders', updatedWorkspace.id] })
    },
  })

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => chatService.deleteWorkspace(workspaceId),
    onSuccess: (_, workspaceId) => {
      queryClient.setQueryData(['user-workspaces', currentUser?.id], (old: Workspace[] = []) =>
        old.filter((workspace) => workspace.id !== workspaceId)
      )
      queryClient.removeQueries({ queryKey: ['workspace-with-folders', workspaceId] })
    },
  })

  // Set default workspace mutation
  const setDefaultWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => chatService.setDefaultWorkspace(workspaceId),
    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData(['user-workspaces', currentUser?.id], (old: Workspace[] = []) =>
        old.map((workspace) => ({
          ...workspace,
          is_default: workspace.id === updatedWorkspace.id
        }))
      )
      queryClient.invalidateQueries({ queryKey: ['user-workspaces', currentUser?.id] })
    },
  })

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (data: Omit<FolderInsert, 'user_id'>) =>
      chatService.createFolder(data),
    onSuccess: (newFolder) => {
      // Invalidate the workspace that contains this folder
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders', newFolder.workspace_id] })
      queryClient.invalidateQueries({ queryKey: ['user-workspaces', currentUser?.id] })
    },
  })

  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: ({ folderId, updates }: { folderId: string; updates: FolderUpdate }) =>
      chatService.updateFolder(folderId, updates),
    onSuccess: (updatedFolder) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders', updatedFolder.workspace_id] })
    },
  })

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => chatService.deleteFolder(folderId),
    onSuccess: (_, folderId) => {
      // Invalidate all workspace queries since we don't know which workspace contained the folder
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders'] })
      queryClient.invalidateQueries({ queryKey: ['user-workspaces', currentUser?.id] })
    },
  })

  // Helper functions
  const createWorkspace = useCallback(
    (name: string, description?: string, color?: string, icon?: string) => {
      return createWorkspaceMutation.mutateAsync({ 
        name, 
        description, 
        color: color || '#8B5CF6',
        icon: icon || 'folder'
      })
    },
    [createWorkspaceMutation]
  )

  const updateWorkspace = useCallback(
    (workspaceId: string, updates: WorkspaceUpdate) => {
      return updateWorkspaceMutation.mutateAsync({ workspaceId, updates })
    },
    [updateWorkspaceMutation]
  )

  const deleteWorkspace = useCallback(
    (workspaceId: string) => {
      return deleteWorkspaceMutation.mutateAsync(workspaceId)
    },
    [deleteWorkspaceMutation]
  )

  const setDefaultWorkspace = useCallback(
    (workspaceId: string) => {
      return setDefaultWorkspaceMutation.mutateAsync(workspaceId)
    },
    [setDefaultWorkspaceMutation]
  )

  const createFolder = useCallback(
    (workspaceId: string, name: string, description?: string, color?: string, icon?: string) => {
      return createFolderMutation.mutateAsync({ 
        workspace_id: workspaceId,
        name, 
        description,
        color: color || '#8B5CF6',
        icon: icon || 'folder'
      })
    },
    [createFolderMutation]
  )

  const updateFolder = useCallback(
    (folderId: string, updates: FolderUpdate) => {
      return updateFolderMutation.mutateAsync({ folderId, updates })
    },
    [updateFolderMutation]
  )

  const deleteFolder = useCallback(
    (folderId: string) => {
      return deleteFolderMutation.mutateAsync(folderId)
    },
    [deleteFolderMutation]
  )

  // Handle loading state
  if (loading) {
    return {
      workspaces: [],
      isLoadingWorkspaces: true,
      workspacesError: null,
      createWorkspace: async () => { throw new Error('Auth loading') },
      updateWorkspace: async () => { throw new Error('Auth loading') },
      deleteWorkspace: async () => { throw new Error('Auth loading') },
      setDefaultWorkspace: async () => { throw new Error('Auth loading') },
      createFolder: async () => { throw new Error('Auth loading') },
      updateFolder: async () => { throw new Error('Auth loading') },
      deleteFolder: async () => { throw new Error('Auth loading') },
      isCreatingWorkspace: false,
      isUpdatingWorkspace: false,
      isDeletingWorkspace: false,
      isCreatingFolder: false,
      isUpdatingFolder: false,
      isDeletingFolder: false,
    }
  }

  return {
    workspaces,
    isLoadingWorkspaces,
    workspacesError,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setDefaultWorkspace,
    createFolder,
    updateFolder,
    deleteFolder,
    isCreatingWorkspace: createWorkspaceMutation.isPending,
    isUpdatingWorkspace: updateWorkspaceMutation.isPending,
    isDeletingWorkspace: deleteWorkspaceMutation.isPending,
    isCreatingFolder: createFolderMutation.isPending,
    isUpdatingFolder: updateFolderMutation.isPending,
    isDeletingFolder: deleteFolderMutation.isPending,
  }
}

// Hook for getting a specific workspace with its folders and chats
export function useSupabaseWorkspace(workspaceId: string | null) {
  const queryClient = useQueryClient()

  const {
    data: workspace,
    isLoading: isLoadingWorkspace,
    error: workspaceError,
  } = useQuery({
    queryKey: ['workspace-with-folders', workspaceId],
    queryFn: () => chatService.getWorkspaceWithFoldersAndChats(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  return {
    workspace,
    isLoadingWorkspace,
    workspaceError,
  }
}
