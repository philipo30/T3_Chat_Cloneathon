import { createClient } from './client'
import type {
  Chat,
  ChatInsert,
  ChatUpdate,
  Message,
  MessageInsert,
  MessageUpdate,
  ChatWithMessages,
  Workspace,
  WorkspaceInsert,
  WorkspaceUpdate,
  Folder,
  FolderInsert,
  FolderUpdate,
  WorkspaceWithFoldersAndChats
} from './database.types'
import { v4 as uuidv4 } from 'uuid'

export class ChatService {
  private supabase = createClient()
  private channels: Map<string, any> = new Map()

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // Chat operations
  async createChat(data: Omit<ChatInsert, 'user_id'>): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const chatData: ChatInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: chat, error } = await this.supabase
      .from('chats')
      .insert(chatData)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  // Create chat with workspace and folder context
  async createChatInContext(
    title: string,
    modelId: string,
    workspaceId?: string,
    folderId?: string
  ): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // If no workspace is provided, get the default workspace
    let targetWorkspaceId = workspaceId
    if (!targetWorkspaceId) {
      const { data: defaultWorkspace } = await this.supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      targetWorkspaceId = defaultWorkspace?.id
    }

    const chatData: ChatInsert = {
      title,
      model_id: modelId,
      workspace_id: targetWorkspaceId,
      folder_id: folderId,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: chat, error } = await this.supabase
      .from('chats')
      .insert(chatData)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  async getChat(chatId: string): Promise<ChatWithMessages | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chat, error } = await this.supabase
      .from('chats')
      .select(`
        *,
        messages (*)
      `)
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return chat as ChatWithMessages
  }

  async getUserChats(): Promise<Chat[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chats, error } = await this.supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('pinned_at', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) throw error
    return chats || []
  }

  async updateChat(chatId: string, updates: ChatUpdate): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chat, error } = await this.supabase
      .from('chats')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  async deleteChat(chatId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async pinChat(chatId: string): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chat, error } = await this.supabase
      .from('chats')
      .update({
        pinned: true,
        pinned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  async unpinChat(chatId: string): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chat, error } = await this.supabase
      .from('chats')
      .update({
        pinned: false,
        pinned_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  // Workspace operations
  async createWorkspace(data: Omit<WorkspaceInsert, 'user_id'>): Promise<Workspace> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const workspaceData: WorkspaceInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single()

    if (error) throw error
    return workspace
  }

  async getUserWorkspaces(): Promise<Workspace[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: workspaces, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) throw error
    return workspaces || []
  }

  async getWorkspaceWithFoldersAndChats(workspaceId: string): Promise<WorkspaceWithFoldersAndChats | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Get workspace
    const { data: workspace, error: workspaceError } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (workspaceError) throw workspaceError
    if (!workspace) return null

    // Get folders in workspace
    const { data: folders, error: foldersError } = await this.supabase
      .from('folders')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (foldersError) throw foldersError

    // Get chats for each folder
    const foldersWithChats = await Promise.all(
      (folders || []).map(async (folder) => {
        const { data: chats, error: chatsError } = await this.supabase
          .from('chats')
          .select('*')
          .eq('folder_id', folder.id)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (chatsError) throw chatsError
        return { ...folder, chats: chats || [] }
      })
    )

    // Get direct chats in workspace (not in folders)
    const { data: directChats, error: directChatsError } = await this.supabase
      .from('chats')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('folder_id', null)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (directChatsError) throw directChatsError

    return {
      ...workspace,
      folders: foldersWithChats,
      chats: directChats || []
    }
  }

  async updateWorkspace(workspaceId: string, updates: WorkspaceUpdate): Promise<Workspace> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return workspace
  }

  async setDefaultWorkspace(workspaceId: string): Promise<Workspace> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // First, remove default status from all workspaces
    const { error: clearError } = await this.supabase
      .from('workspaces')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (clearError) throw clearError

    // Then set the new default workspace
    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return workspace
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Folder operations
  async createFolder(data: Omit<FolderInsert, 'user_id'>): Promise<Folder> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const folderData: FolderInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: folder, error } = await this.supabase
      .from('folders')
      .insert(folderData)
      .select()
      .single()

    if (error) throw error
    return folder
  }

  async updateFolder(folderId: string, updates: FolderUpdate): Promise<Folder> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: folder, error } = await this.supabase
      .from('folders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return folder
  }

  async deleteFolder(folderId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Chat organization operations
  async moveChatToFolder(chatId: string, folderId: string | null, workspaceId: string): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chat, error } = await this.supabase
      .from('chats')
      .update({
        folder_id: folderId,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  async moveChatToWorkspace(chatId: string, workspaceId: string): Promise<Chat> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: chat, error } = await this.supabase
      .from('chats')
      .update({
        workspace_id: workspaceId,
        folder_id: null, // Remove from folder when moving to workspace
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return chat
  }

  async moveFolderToWorkspace(folderId: string, workspaceId: string): Promise<Folder> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: folder, error } = await this.supabase
      .from('folders')
      .update({
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return folder
  }

  // Message operations
  async addMessage(data: MessageInsert): Promise<Message> {
    // Generate ID if not provided
    const messageData: MessageInsert = {
      ...data,
      id: data.id || uuidv4(),
    }

    // Check for existing message with same ID to prevent duplicates
    if (messageData.id) {
      const { data: existingMessage } = await this.supabase
        .from('messages')
        .select('id')
        .eq('id', messageData.id)
        .single()

      if (existingMessage) {
        // Message already exists, return it instead of creating duplicate
        const { data: message, error } = await this.supabase
          .from('messages')
          .select('*')
          .eq('id', messageData.id)
          .single()

        if (error) throw error
        return message
      }
    }

    const { data: message, error } = await this.supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at timestamp
    await this.supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.chat_id)

    return message
  }

  async updateMessage(messageId: string, updates: MessageUpdate): Promise<Message> {
    const { data: message, error } = await this.supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single()

    if (error) throw error
    return message
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return messages || []
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  }

  async deleteMessagesAfter(messageId: string, chatId: string): Promise<void> {
    // First get the timestamp of the target message
    const { data: targetMessage, error: fetchError } = await this.supabase
      .from('messages')
      .select('created_at')
      .eq('id', messageId)
      .single()

    if (fetchError) throw fetchError

    // Delete all messages in the chat that were created after the target message
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
      .gt('created_at', targetMessage.created_at)

    if (error) throw error
  }

  async getLastUserMessage(chatId: string): Promise<Message | null> {
    const { data: message, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
    return message || null
  }

  // Real-time subscriptions
  subscribeToChatUpdates(chatId: string, callback: (payload: any) => void) {
    const channelName = `chat-${chatId}`

    try {
      // Check if channel already exists
      if (this.channels.has(channelName)) {
        const existingChannel = this.channels.get(channelName)
        // Unsubscribe existing channel first
        try {
          existingChannel.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from existing channel:', error)
        }
        this.channels.delete(channelName)
      }

      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          callback
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to chat updates for ${chatId}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to chat updates for ${chatId}`)
          }
        })

      // Store the channel for cleanup
      this.channels.set(channelName, channel)

      return channel
    } catch (error) {
      console.error('Error creating chat subscription:', error)
      throw error
    }
  }

  subscribeToUserChats(userId: string, callback: (payload: any) => void) {
    const channelName = `user-chats-${userId}`

    try {
      // Check if channel already exists
      if (this.channels.has(channelName)) {
        const existingChannel = this.channels.get(channelName)
        // Unsubscribe existing channel first
        try {
          existingChannel.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from existing channel:', error)
        }
        this.channels.delete(channelName)
      }

      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats',
            filter: `user_id=eq.${userId}`,
          },
          callback
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to user chats for ${userId}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to user chats for ${userId}`)
          }
        })

      // Store the channel for cleanup
      this.channels.set(channelName, channel)

      return channel
    } catch (error) {
      console.error('Error creating user chats subscription:', error)
      throw error
    }
  }

  subscribeToUserWorkspaces(userId: string, callback: (payload: any) => void) {
    const channelName = `user-workspaces-${userId}`

    try {
      // Check if channel already exists
      if (this.channels.has(channelName)) {
        const existingChannel = this.channels.get(channelName)
        // Unsubscribe existing channel first
        try {
          existingChannel.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from existing channel:', error)
        }
        this.channels.delete(channelName)
      }

      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workspaces',
            filter: `user_id=eq.${userId}`,
          },
          callback
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'folders',
            filter: `user_id=eq.${userId}`,
          },
          callback
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to user workspaces for ${userId}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to user workspaces for ${userId}`)
          }
        })

      // Store the channel for cleanup
      this.channels.set(channelName, channel)

      return channel
    } catch (error) {
      console.error('Error creating user workspaces subscription:', error)
      throw error
    }
  }

  // Cleanup method to unsubscribe from all channels
  cleanup() {
    this.channels.forEach((channel, channelName) => {
      try {
        channel.unsubscribe()
        console.log(`Unsubscribed from channel: ${channelName}`)
      } catch (error) {
        console.warn(`Error unsubscribing from channel ${channelName}:`, error)
      }
    })
    this.channels.clear()
  }
}

export const chatService = new ChatService()
