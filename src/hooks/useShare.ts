import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shareService } from '@/lib/supabase/share-service'
import type { SharedChat, ShareSettings } from '@/lib/supabase/database.types'
import { toast } from 'sonner'

export function useShare() {
  const queryClient = useQueryClient()

  // Get user's shares
  const {
    data: userShares = [],
    isLoading: isLoadingShares,
    error: sharesError,
  } = useQuery({
    queryKey: ['user-shares'],
    queryFn: () => shareService.getUserShares(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: ({ chatId, settings }: { chatId: string; settings: ShareSettings }) =>
      shareService.createShare(chatId, settings),
    onSuccess: (newShare) => {
      // Update user shares cache
      queryClient.setQueryData(['user-shares'], (old: SharedChat[] = []) => [
        newShare,
        ...old,
      ])
      
      // Update chat-specific shares cache
      queryClient.setQueryData(['chat-shares', newShare.chat_id], (old: SharedChat[] = []) => [
        newShare,
        ...old,
      ])
      
      toast.success('Share link created successfully!')
    },
    onError: (error) => {
      console.error('Failed to create share:', error)
      toast.error('Failed to create share link')
    },
  })

  // Update share mutation
  const updateShareMutation = useMutation({
    mutationFn: ({ shareId, settings }: { shareId: string; settings: Partial<ShareSettings> }) =>
      shareService.updateShare(shareId, settings),
    onSuccess: (updatedShare) => {
      // Update user shares cache
      queryClient.setQueryData(['user-shares'], (old: SharedChat[] = []) =>
        old.map((share) => (share.share_id === updatedShare.share_id ? updatedShare : share))
      )
      
      // Update chat-specific shares cache
      queryClient.setQueryData(['chat-shares', updatedShare.chat_id], (old: SharedChat[] = []) =>
        old.map((share) => (share.share_id === updatedShare.share_id ? updatedShare : share))
      )
      
      toast.success('Share settings updated successfully!')
    },
    onError: (error) => {
      console.error('Failed to update share:', error)
      toast.error('Failed to update share settings')
    },
  })

  // Revoke share mutation
  const revokeShareMutation = useMutation({
    mutationFn: (shareId: string) => shareService.revokeShare(shareId),
    onSuccess: (_, shareId) => {
      // Remove from user shares cache
      queryClient.setQueryData(['user-shares'], (old: SharedChat[] = []) =>
        old.filter((share) => share.share_id !== shareId)
      )
      
      // Remove from all chat-specific shares caches
      queryClient.invalidateQueries({ queryKey: ['chat-shares'] })
      
      toast.success('Share link revoked successfully!')
    },
    onError: (error) => {
      console.error('Failed to revoke share:', error)
      toast.error('Failed to revoke share link')
    },
  })

  // Check if chat is shared
  const checkChatSharedMutation = useMutation({
    mutationFn: (chatId: string) => shareService.isChatShared(chatId),
  })

  // Fork shared chat mutation
  const forkSharedChatMutation = useMutation({
    mutationFn: ({ shareId, password }: { shareId: string; password?: string }) =>
      shareService.forkSharedChat(shareId, password),
    onSuccess: (newChatId) => {
      // Invalidate user chats to show the new forked chat
      queryClient.invalidateQueries({ queryKey: ['user-chats'] })
      toast.success('Chat forked successfully! Redirecting to your copy...')
    },
    onError: (error: any) => {
      console.error('Failed to fork chat:', error)
      const errorMessage = error?.message || 'Failed to fork chat'
      toast.error(errorMessage)
    },
  })

  return {
    // Data
    userShares,
    isLoadingShares,
    sharesError,
    
    // Mutations
    createShare: createShareMutation.mutate,
    updateShare: updateShareMutation.mutate,
    revokeShare: revokeShareMutation.mutate,
    checkChatShared: checkChatSharedMutation.mutate,
    forkSharedChat: forkSharedChatMutation.mutate,
    
    // Loading states
    isCreatingShare: createShareMutation.isPending,
    isUpdatingShare: updateShareMutation.isPending,
    isRevokingShare: revokeShareMutation.isPending,
    isCheckingShared: checkChatSharedMutation.isPending,
    isForkingChat: forkSharedChatMutation.isPending,
    
    // Fork result
    forkedChatId: forkSharedChatMutation.data,
  }
}

export function useChatShares(chatId: string | null) {
  const queryClient = useQueryClient()

  // Get shares for a specific chat
  const {
    data: chatShares = [],
    isLoading: isLoadingChatShares,
    error: chatSharesError,
  } = useQuery({
    queryKey: ['chat-shares', chatId],
    queryFn: () => shareService.getChatShares(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    chatShares,
    isLoadingChatShares,
    chatSharesError,
  }
}

export function useSharedChat(shareId: string, password?: string) {
  // Get shared chat data (for public viewing)
  const {
    data: sharedChat,
    isLoading: isLoadingSharedChat,
    error: sharedChatError,
    refetch: refetchSharedChat,
  } = useQuery({
    queryKey: ['shared-chat', shareId, password],
    queryFn: () => shareService.getSharedChat(shareId, password),
    enabled: !!shareId,
    retry: false, // Don't retry on password errors
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Validate share access
  const validateAccessMutation = useMutation({
    mutationFn: ({ shareId, password }: { shareId: string; password?: string }) =>
      shareService.validateShareAccess(shareId, password),
  })

  return {
    sharedChat,
    isLoadingSharedChat,
    sharedChatError,
    refetchSharedChat,
    validateAccess: validateAccessMutation.mutate,
    isValidatingAccess: validateAccessMutation.isPending,
  }
}
