import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/lib/supabase/chat-service'
import type { Chat } from '@/lib/supabase/database.types'
import { useAuth } from './useAuth'

export function useChatOrganization() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // Move chat to folder mutation
  const moveChatToFolderMutation = useMutation({
    mutationFn: ({ chatId, folderId, workspaceId }: { 
      chatId: string; 
      folderId: string | null; 
      workspaceId: string 
    }) => chatService.moveChatToFolder(chatId, folderId, workspaceId),
    onSuccess: (updatedChat) => {
      // Update the chat in all relevant queries
      queryClient.setQueryData(
        ['chat', updatedChat.id],
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            workspace_id: updatedChat.workspace_id,
            folder_id: updatedChat.folder_id,
            updated_at: updatedChat.updated_at,
          }
        }
      )

      // Invalidate workspace and folder queries
      queryClient.invalidateQueries({ queryKey: ['user-chats', currentUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders'] })
      
      // If the chat was moved to a specific workspace, invalidate that workspace
      if (updatedChat.workspace_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['workspace-with-folders', updatedChat.workspace_id] 
        })
      }
    },
  })

  // Move chat to workspace mutation (removes from folder)
  const moveChatToWorkspaceMutation = useMutation({
    mutationFn: ({ chatId, workspaceId }: { chatId: string; workspaceId: string }) =>
      chatService.moveChatToWorkspace(chatId, workspaceId),
    onSuccess: (updatedChat) => {
      // Update the chat in all relevant queries
      queryClient.setQueryData(
        ['chat', updatedChat.id],
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            workspace_id: updatedChat.workspace_id,
            folder_id: updatedChat.folder_id,
            updated_at: updatedChat.updated_at,
          }
        }
      )

      // Invalidate workspace and folder queries
      queryClient.invalidateQueries({ queryKey: ['user-chats', currentUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders'] })
      
      // Invalidate the specific workspace
      queryClient.invalidateQueries({ 
        queryKey: ['workspace-with-folders', updatedChat.workspace_id] 
      })
    },
  })

  // Move folder to workspace mutation
  const moveFolderToWorkspaceMutation = useMutation({
    mutationFn: ({ folderId, workspaceId }: { folderId: string; workspaceId: string }) =>
      chatService.moveFolderToWorkspace(folderId, workspaceId),
    onSuccess: (updatedFolder) => {
      // Invalidate all workspace queries to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders'] })
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] })

      // Invalidate both the old and new workspace
      if (updatedFolder.workspace_id) {
        queryClient.invalidateQueries({
          queryKey: ['workspace-with-folders', updatedFolder.workspace_id]
        })
      }
    },
  })

  // Helper functions
  const moveChatToFolder = useCallback(
    (chatId: string, folderId: string | null, workspaceId: string) => {
      return moveChatToFolderMutation.mutateAsync({ chatId, folderId, workspaceId })
    },
    [moveChatToFolderMutation]
  )

  const moveChatToWorkspace = useCallback(
    (chatId: string, workspaceId: string) => {
      return moveChatToWorkspaceMutation.mutateAsync({ chatId, workspaceId })
    },
    [moveChatToWorkspaceMutation]
  )

  const moveFolderToWorkspace = useCallback(
    (folderId: string, workspaceId: string) => {
      return moveFolderToWorkspaceMutation.mutateAsync({ folderId, workspaceId })
    },
    [moveFolderToWorkspaceMutation]
  )

  // Batch operations for drag and drop
  const moveMultipleChats = useCallback(
    async (chatIds: string[], targetFolderId: string | null, targetWorkspaceId: string) => {
      const promises = chatIds.map(chatId => 
        moveChatToFolder(chatId, targetFolderId, targetWorkspaceId)
      )
      return Promise.all(promises)
    },
    [moveChatToFolder]
  )

  return {
    moveChatToFolder,
    moveChatToWorkspace,
    moveFolderToWorkspace,
    moveMultipleChats,
    isMovingChat: moveChatToFolderMutation.isPending || moveChatToWorkspaceMutation.isPending,
    isMovingFolder: moveFolderToWorkspaceMutation.isPending,
    moveError: moveChatToFolderMutation.error || moveChatToWorkspaceMutation.error || moveFolderToWorkspaceMutation.error,
  }
}
