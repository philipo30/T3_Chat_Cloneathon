import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/lib/supabase/chat-service'
import type { Chat, ChatWithMessages, MessageInsert } from '@/lib/supabase/database.types'
import { useAuth } from './useAuth'

export function useSupabaseChat(chatId: string | null) {
  const queryClient = useQueryClient()

  const {
    data: chat,
    isLoading: isLoadingChat,
    error: chatError,
  } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatService.getChat(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Real-time subscription for chat updates (throttled to prevent conflicts with streaming)
  useEffect(() => {
    if (!chatId) return

    let timeoutId: NodeJS.Timeout

    const subscription = chatService.subscribeToChatUpdates(chatId, (payload) => {
      // Throttle invalidations to prevent conflicts with optimistic streaming updates
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        // Use refetchQueries instead of invalidateQueries to avoid clearing cache
        // This prevents messages from disappearing during streaming completion
        queryClient.refetchQueries({
          queryKey: ['chat', chatId],
          type: 'active' // Only refetch if query is currently being observed
        })
      }, 300) // Shorter delay than user-chats since individual chats need faster updates
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [chatId, queryClient])

  return {
    chat,
    isLoadingChat,
    chatError,
  }
}

export function useSupabaseChats() {
  const queryClient = useQueryClient()
  const { user: currentUser, loading } = useAuth()

  // Query for user's chats - always call the hook but disable when needed
  const {
    data: chats = [],
    isLoading: isLoadingChats,
    error: chatsError,
  } = useQuery({
    queryKey: ['user-chats', currentUser?.id],
    queryFn: () => chatService.getUserChats(),
    enabled: !!currentUser && !loading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Real-time subscription for chat updates (throttled)
  useEffect(() => {
    if (!currentUser || loading) return

    let timeoutId: NodeJS.Timeout

    const subscription = chatService.subscribeToUserChats(currentUser.id, (payload) => {
      // Throttle invalidations to prevent excessive refetching
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-chats', currentUser.id] })
      }, 500) // Wait 500ms before invalidating
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [currentUser, loading, queryClient])

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: (data: { title: string; model_id: string }) =>
      chatService.createChat(data),
    onSuccess: (newChat) => {
      // Optimistically update the cache with the new chat at the top
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) => [
        newChat,
        ...old,
      ])
      // Also invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['user-chats', currentUser?.id] })
    },
  })

  // Create new chat with context mutation
  const createChatInContextMutation = useMutation({
    mutationFn: (data: {
      title: string;
      modelId: string;
      workspaceId?: string;
      folderId?: string
    }) => chatService.createChatInContext(data.title, data.modelId, data.workspaceId, data.folderId),
    onSuccess: (newChat) => {
      // Optimistically update the cache with the new chat at the top
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) => [
        newChat,
        ...old,
      ])
      // Also invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['user-chats', currentUser?.id] })
      // Also invalidate workspace data if the chat was created in a specific workspace
      if (newChat.workspace_id) {
        queryClient.invalidateQueries({ queryKey: ['workspace-with-folders', newChat.workspace_id] })
      }
    },
  })

  // Update chat mutation
  const updateChatMutation = useMutation({
    mutationFn: ({ chatId, updates }: { chatId: string; updates: any }) =>
      chatService.updateChat(chatId, updates),
    onSuccess: (updatedChat) => {
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) =>
        old.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      )
      queryClient.invalidateQueries({ queryKey: ['chat', updatedChat.id] })
    },
  })

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => chatService.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) =>
        old.filter((chat) => chat.id !== chatId)
      )
      queryClient.removeQueries({ queryKey: ['chat', chatId] })
    },
  })

  // Pin chat mutation
  const pinChatMutation = useMutation({
    mutationFn: (chatId: string) => chatService.pinChat(chatId),
    onSuccess: (updatedChat) => {
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) =>
        old.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      )
      queryClient.invalidateQueries({ queryKey: ['chat', updatedChat.id] })
      // Invalidate workspace data to refresh the sidebar organization
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders', updatedChat.workspace_id] })
    },
  })

  // Unpin chat mutation
  const unpinChatMutation = useMutation({
    mutationFn: (chatId: string) => chatService.unpinChat(chatId),
    onSuccess: (updatedChat) => {
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) =>
        old.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      )
      queryClient.invalidateQueries({ queryKey: ['chat', updatedChat.id] })
      // Invalidate workspace data to refresh the sidebar organization
      queryClient.invalidateQueries({ queryKey: ['workspace-with-folders', updatedChat.workspace_id] })
    },
  })

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: (data: MessageInsert) => chatService.addMessage(data),
    onSuccess: (newMessage) => {
      // Update the specific chat query with deduplication
      queryClient.setQueryData(
        ['chat', newMessage.chat_id],
        (old: ChatWithMessages | undefined) => {
          if (!old) return old

          // Check if message already exists to prevent duplicates
          const messageExists = old.messages.some(msg => msg.id === newMessage.id)
          if (messageExists) {
            return old // Don't add duplicate
          }

          return {
            ...old,
            messages: [...old.messages, newMessage],
          }
        }
      )
      // Update the chat's updated_at and move it to the top of the list
      queryClient.setQueryData(['user-chats', currentUser?.id], (old: Chat[] = []) => {
        const updatedChats = old.map((chat) =>
          chat.id === newMessage.chat_id
            ? { ...chat, updated_at: new Date().toISOString() }
            : chat
        )
        // Sort by updated_at to ensure the updated chat is at the top
        return updatedChats.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      })
    },
  })

  // Update message mutation
  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, updates }: { messageId: string; updates: any }) =>
      chatService.updateMessage(messageId, updates),
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData(
        ['chat', updatedMessage.chat_id],
        (old: ChatWithMessages | undefined) => {
          if (!old) return old
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
          }
        }
      )
    },
  })

  // Helper functions
  const createChat = useCallback(
    (title: string, modelId: string) => {
      return createChatMutation.mutateAsync({ title, model_id: modelId })
    },
    [createChatMutation]
  )

  const createChatInContext = useCallback(
    (title: string, modelId: string, workspaceId?: string, folderId?: string) => {
      return createChatInContextMutation.mutateAsync({ title, modelId, workspaceId, folderId })
    },
    [createChatInContextMutation]
  )

  const updateChat = useCallback(
    (chatId: string, updates: any) => {
      return updateChatMutation.mutateAsync({ chatId, updates })
    },
    [updateChatMutation]
  )

  const deleteChat = useCallback(
    (chatId: string) => {
      return deleteChatMutation.mutateAsync(chatId)
    },
    [deleteChatMutation]
  )

  const addMessage = useCallback(
    (data: MessageInsert) => {
      return addMessageMutation.mutateAsync(data)
    },
    [addMessageMutation]
  )

  const updateMessage = useCallback(
    (messageId: string, updates: any) => {
      return updateMessageMutation.mutateAsync({ messageId, updates })
    },
    [updateMessageMutation]
  )

  const pinChat = useCallback(
    (chatId: string) => {
      return pinChatMutation.mutateAsync(chatId)
    },
    [pinChatMutation]
  )

  const unpinChat = useCallback(
    (chatId: string) => {
      return unpinChatMutation.mutateAsync(chatId)
    },
    [unpinChatMutation]
  )

  const deleteMessage = useCallback(
    async (messageId: string, chatId: string) => {
      await chatService.deleteMessage(messageId)
      // Invalidate the chat query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    },
    [queryClient]
  )

  const deleteMessagesAfter = useCallback(
    async (messageId: string, chatId: string) => {
      await chatService.deleteMessagesAfter(messageId, chatId)
      // Invalidate the chat query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    },
    [queryClient]
  )

  const getLastUserMessage = useCallback(
    (chatId: string) => {
      return chatService.getLastUserMessage(chatId)
    },
    []
  )

  // Handle loading state
  if (loading) {
    return {
      chats: [],
      isLoadingChats: true,
      chatsError: null,
      createChat: async () => { throw new Error('Auth loading') },
      createChatInContext: async () => { throw new Error('Auth loading') },
      updateChat: async () => { throw new Error('Auth loading') },
      deleteChat: async () => { throw new Error('Auth loading') },
      addMessage: async () => { throw new Error('Auth loading') },
      updateMessage: async () => { throw new Error('Auth loading') },
      pinChat: async () => { throw new Error('Auth loading') },
      unpinChat: async () => { throw new Error('Auth loading') },
      deleteMessage: async () => { throw new Error('Auth loading') },
      deleteMessagesAfter: async () => { throw new Error('Auth loading') },
      getLastUserMessage: async () => { throw new Error('Auth loading') },
      isCreatingChat: false,
      isUpdatingChat: false,
      isDeletingChat: false,
      isAddingMessage: false,
      isUpdatingMessage: false,
      isPinningChat: false,
      isUnpinningChat: false,
    }
  }

  return {
    chats,
    isLoadingChats,
    chatsError,
    createChat,
    createChatInContext,
    updateChat,
    deleteChat,
    addMessage,
    updateMessage,
    pinChat,
    unpinChat,
    deleteMessage,
    deleteMessagesAfter,
    getLastUserMessage,
    isCreatingChat: createChatMutation.isPending || createChatInContextMutation.isPending,
    isUpdatingChat: updateChatMutation.isPending,
    isDeletingChat: deleteChatMutation.isPending,
    isAddingMessage: addMessageMutation.isPending,
    isUpdatingMessage: updateMessageMutation.isPending,
    isPinningChat: pinChatMutation.isPending,
    isUnpinningChat: unpinChatMutation.isPending,
  }
}
