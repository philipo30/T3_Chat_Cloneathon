import { createClient } from './client'
import type { Database, Chat, ChatInsert, ChatUpdate, Message, MessageInsert, MessageUpdate, ChatWithMessages } from './database.types'
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

  // Message operations
  async addMessage(data: MessageInsert): Promise<Message> {
    const messageData: MessageInsert = {
      ...data,
      id: uuidv4(),
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
