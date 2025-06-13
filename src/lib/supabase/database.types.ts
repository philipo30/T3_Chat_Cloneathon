export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          model_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          model_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          model_id?: string
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

export interface ChatWithMessages extends Chat {
  messages: Message[]
}
