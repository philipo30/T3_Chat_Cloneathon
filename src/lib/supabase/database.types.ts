export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          model_id: string
          pinned: boolean
          pinned_at: string | null
          workspace_id: string | null
          folder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          model_id: string
          pinned?: boolean
          pinned_at?: string | null
          workspace_id?: string | null
          folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          model_id?: string
          pinned?: boolean
          pinned_at?: string | null
          workspace_id?: string | null
          folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          model: string | null
          created_at: string
          is_complete: boolean
          generation_id: string | null
          reasoning: string | null
          annotations: any | null
          attachments: any | null
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          model?: string | null
          created_at?: string
          is_complete?: boolean
          generation_id?: string | null
          reasoning?: string | null
          annotations?: any | null
          attachments?: any | null
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          model?: string | null
          created_at?: string
          is_complete?: boolean
          generation_id?: string | null
          reasoning?: string | null
          annotations?: any | null
          attachments?: any | null
        }
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
      }
      shared_chats: {
        Row: {
          id: string
          share_id: string
          chat_id: string
          created_by: string
          title: string
          is_public: boolean
          password_hash: string | null
          expires_at: string | null
          view_count: number
          last_accessed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          share_id: string
          chat_id: string
          created_by: string
          title: string
          is_public?: boolean
          password_hash?: string | null
          expires_at?: string | null
          view_count?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          share_id?: string
          chat_id?: string
          created_by?: string
          title?: string
          is_public?: boolean
          password_hash?: string | null
          expires_at?: string | null
          view_count?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type ChatUpdate = Database['public']['Tables']['chats']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert']
export type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update']

export type Folder = Database['public']['Tables']['folders']['Row']
export type FolderInsert = Database['public']['Tables']['folders']['Insert']
export type FolderUpdate = Database['public']['Tables']['folders']['Update']

export type SharedChat = Database['public']['Tables']['shared_chats']['Row']
export type SharedChatInsert = Database['public']['Tables']['shared_chats']['Insert']
export type SharedChatUpdate = Database['public']['Tables']['shared_chats']['Update']

export interface ChatWithMessages extends Chat {
  messages: Message[]
}

export interface WorkspaceWithFolders extends Workspace {
  folders: Folder[]
}

export interface FolderWithChats extends Folder {
  chats: Chat[]
}

export interface WorkspaceWithFoldersAndChats extends Workspace {
  folders: FolderWithChats[]
  chats: Chat[] // Direct chats in workspace (not in folders)
}

export interface SharedChatWithMessages extends SharedChat {
  messages: Message[]
}

export interface PublicSharedChat {
  share_id: string
  title: string
  is_public: boolean
  expires_at: string | null
  view_count: number
  created_at: string
  model_id: string
  chat_id: string
}

export interface ShareSettings {
  is_public: boolean
  password?: string
  expires_at?: string | null
}
