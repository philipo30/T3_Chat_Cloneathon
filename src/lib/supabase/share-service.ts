import { createClient } from './client'
import type {
  SharedChat,
  SharedChatInsert,
  SharedChatUpdate,
  SharedChatWithMessages,
  PublicSharedChat,
  ShareSettings,
  Message
} from './database.types'
import bcrypt from 'bcryptjs'

class ShareService {
  private supabase = createClient()

  /**
   * Generate a unique share ID for a chat
   */
  private async generateShareId(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_share_id')
    if (error) throw error
    return data
  }

  /**
   * Hash a password for secure storage
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verify a password against its hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Create a new shared chat
   */
  async createShare(
    chatId: string,
    settings: ShareSettings
  ): Promise<SharedChat> {
    try {
      // First, get the chat to ensure it exists and get its title
      const { data: chat, error: chatError } = await this.supabase
        .from('chats')
        .select('title, user_id')
        .eq('id', chatId)
        .single()

      if (chatError || !chat) {
        throw new Error('Chat not found or access denied')
      }

      // Generate unique share ID
      const shareId = await this.generateShareId()

      // Prepare the share data
      const shareData: SharedChatInsert = {
        share_id: shareId,
        chat_id: chatId,
        created_by: chat.user_id,
        title: chat.title,
        is_public: settings.is_public,
        expires_at: settings.expires_at || null,
      }

      // Hash password if provided
      if (settings.password) {
        shareData.password_hash = await this.hashPassword(settings.password)
      }

      // Create the share
      const { data, error } = await this.supabase
        .from('shared_chats')
        .insert(shareData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating share:', error)
      throw error
    }
  }

  /**
   * Get a shared chat by share ID (public access)
   */
  async getSharedChat(shareId: string, password?: string): Promise<SharedChatWithMessages> {
    try {
      // First get the shared chat metadata to check password requirements
      const { data: sharedChat, error: shareError } = await this.supabase
        .from('shared_chats')
        .select('*')
        .eq('share_id', shareId)
        .single()

      if (shareError || !sharedChat) {
        throw new Error('Shared chat not found')
      }

      // Check if the share has expired
      if (sharedChat.expires_at && new Date(sharedChat.expires_at) < new Date()) {
        throw new Error('This shared chat has expired')
      }

      // Check if password is required and validate it
      if (sharedChat.password_hash) {
        if (!password) {
          throw new Error('Password required')
        }
        const isValidPassword = await this.verifyPassword(password, sharedChat.password_hash)
        if (!isValidPassword) {
          throw new Error('Invalid password')
        }
      }

      // For public shares or valid password, use the server function to get messages
      if (sharedChat.is_public || (sharedChat.password_hash && password)) {
        const { data: sharedChatWithMessages, error: functionError } = await this.supabase
          .rpc('get_shared_chat_with_messages', {
            share_id_param: shareId
          })

        if (functionError) {
          console.error('Function error:', functionError)
          throw new Error('Failed to load shared chat')
        }

        if (!sharedChatWithMessages) {
          throw new Error('Shared chat not found or expired')
        }

        // Increment view count
        await this.supabase.rpc('increment_share_view_count', {
          share_id_param: shareId
        })

        return sharedChatWithMessages
      }

      // Fallback: try direct message query (for authenticated users)
      const { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('chat_id', sharedChat.chat_id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Messages error:', messagesError)
        throw new Error('Failed to load chat messages')
      }

      // Increment view count
      await this.supabase.rpc('increment_share_view_count', {
        share_id_param: shareId
      })

      return {
        ...sharedChat,
        messages: messages || []
      }
    } catch (error) {
      console.error('Error getting shared chat:', error)
      throw error
    }
  }

  /**
   * Get all shares created by the current user
   */
  async getUserShares(): Promise<SharedChat[]> {
    try {
      const { data, error } = await this.supabase
        .from('shared_chats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user shares:', error)
      throw error
    }
  }

  /**
   * Get shares for a specific chat
   */
  async getChatShares(chatId: string): Promise<SharedChat[]> {
    try {
      const { data, error } = await this.supabase
        .from('shared_chats')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting chat shares:', error)
      throw error
    }
  }

  /**
   * Update share settings
   */
  async updateShare(
    shareId: string,
    settings: Partial<ShareSettings>
  ): Promise<SharedChat> {
    try {
      const updateData: SharedChatUpdate = {
        is_public: settings.is_public,
        expires_at: settings.expires_at,
      }

      // Hash new password if provided
      if (settings.password !== undefined) {
        updateData.password_hash = settings.password 
          ? await this.hashPassword(settings.password)
          : null
      }

      const { data, error } = await this.supabase
        .from('shared_chats')
        .update(updateData)
        .eq('share_id', shareId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating share:', error)
      throw error
    }
  }

  /**
   * Revoke/delete a shared chat
   */
  async revokeShare(shareId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('shared_chats')
        .delete()
        .eq('share_id', shareId)

      if (error) throw error
    } catch (error) {
      console.error('Error revoking share:', error)
      throw error
    }
  }

  /**
   * Check if a chat is already shared
   */
  async isChatShared(chatId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('shared_chats')
        .select('id')
        .eq('chat_id', chatId)
        .limit(1)

      if (error) throw error
      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error checking if chat is shared:', error)
      return false
    }
  }

  /**
   * Get public shared chats (for discovery, if needed)
   */
  async getPublicShares(limit: number = 20): Promise<PublicSharedChat[]> {
    try {
      const { data, error } = await this.supabase
        .from('public_shared_chats')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting public shares:', error)
      throw error
    }
  }

  /**
   * Validate share access without fetching full data
   */
  async validateShareAccess(shareId: string, password?: string): Promise<boolean> {
    try {
      const { data: sharedChat, error } = await this.supabase
        .from('shared_chats')
        .select('password_hash, expires_at, is_public')
        .eq('share_id', shareId)
        .single()

      if (error || !sharedChat) return false

      // Check expiration
      if (sharedChat.expires_at && new Date(sharedChat.expires_at) < new Date()) {
        return false
      }

      // Check password if required
      if (sharedChat.password_hash) {
        if (!password) return false
        return await this.verifyPassword(password, sharedChat.password_hash)
      }

      return sharedChat.is_public
    } catch (error) {
      console.error('Error validating share access:', error)
      return false
    }
  }

  /**
   * Fork a shared chat to create a new chat for the current user
   */
  async forkSharedChat(shareId: string, password?: string): Promise<string> {
    try {
      // First get the shared chat with messages
      const sharedChat = await this.getSharedChat(shareId, password)
      
      if (!sharedChat) {
        throw new Error('Shared chat not found')
      }

      if (!sharedChat.messages || sharedChat.messages.length === 0) {
        throw new Error('This chat has no messages to fork')
      }

      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User must be authenticated to fork a chat')
      }

      // Create a new chat with forked title
      const forkedTitle = `Forked: ${sharedChat.title}`
      const { data: newChat, error: chatError } = await this.supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: forkedTitle,
          model_id: 'deepseek/deepseek-chat-v3-0324:free', // Default model, user can change later
        })
        .select()
        .single()

      if (chatError || !newChat) {
        throw new Error('Failed to create forked chat')
      }

      // Copy all messages to the new chat
      const messagesToInsert = sharedChat.messages.map(message => ({
        chat_id: newChat.id,
        role: message.role,
        content: message.content,
        model: message.model,
        is_complete: true,
        generation_id: message.generation_id,
        reasoning: message.reasoning,
        annotations: message.annotations,
        attachments: message.attachments,
      }))

      const { error: messagesError } = await this.supabase
        .from('messages')
        .insert(messagesToInsert)

      if (messagesError) {
        // If message insertion fails, clean up the chat
        await this.supabase.from('chats').delete().eq('id', newChat.id)
        throw new Error('Failed to copy messages to forked chat')
      }

      return newChat.id
    } catch (error) {
      console.error('Error forking shared chat:', error)
      throw error
    }
  }
}

export const shareService = new ShareService()
