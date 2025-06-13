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

  // Real-time subscription for chat updates
  useEffect(() => {
    if (!chatId) return

    const subscription = chatService.subscribeToChatUpdates(chatId, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    })

    return () => {
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

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: (data: MessageInsert) => chatService.addMessage(data),
    onSuccess: (newMessage) => {
      // Update the specific chat query
      queryClient.setQueryData(
        ['chat', newMessage.chat_id],
        (old: ChatWithMessages | undefined) => {
          if (!old) return old
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

  // Handle loading state
  if (loading) {
    return {
      chats: [],
      isLoadingChats: true,
      chatsError: null,
      createChat: async () => { throw new Error('Auth loading') },
      updateChat: async () => { throw new Error('Auth loading') },
      deleteChat: async () => { throw new Error('Auth loading') },
      addMessage: async () => { throw new Error('Auth loading') },
      updateMessage: async () => { throw new Error('Auth loading') },
      isCreatingChat: false,
      isUpdatingChat: false,
      isDeletingChat: false,
      isAddingMessage: false,
      isUpdatingMessage: false,
    }
  }

  return {
    chats,
    isLoadingChats,
    chatsError,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
    updateMessage,
    isCreatingChat: createChatMutation.isPending,
    isUpdatingChat: updateChatMutation.isPending,
    isDeletingChat: deleteChatMutation.isPending,
    isAddingMessage: addMessageMutation.isPending,
    isUpdatingMessage: updateMessageMutation.isPending,
  }
}
