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
      projects: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          folder_id: string | null
          name: string
          description: string | null
          project_type: 'general' | 'web' | 'python' | 'nodejs' | 'react' | 'vue' | 'documentation'
          template_id: string | null
          settings: Record<string, any>
          total_size_bytes: number
          file_count: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          folder_id?: string | null
          name: string
          description?: string | null
          project_type?: 'general' | 'web' | 'python' | 'nodejs' | 'react' | 'vue' | 'documentation'
          template_id?: string | null
          settings?: Record<string, any>
          total_size_bytes?: number
          file_count?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          folder_id?: string | null
          name?: string
          description?: string | null
          project_type?: 'general' | 'web' | 'python' | 'nodejs' | 'react' | 'vue' | 'documentation'
          template_id?: string | null
          settings?: Record<string, any>
          total_size_bytes?: number
          file_count?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          path: string
          content: string | null
          file_type: 'text' | 'image' | 'binary' | 'directory'
          mime_type: string | null
          size_bytes: number
          encoding: string
          is_directory: boolean
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          path: string
          content?: string | null
          file_type: 'text' | 'image' | 'binary' | 'directory'
          mime_type?: string | null
          size_bytes?: number
          encoding?: string
          is_directory?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          name?: string
          path?: string
          content?: string | null
          file_type?: 'text' | 'image' | 'binary' | 'directory'
          mime_type?: string | null
          size_bytes?: number
          encoding?: string
          is_directory?: boolean
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mcp_servers: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          server_type: 'filesystem' | 'git' | 'database' | 'web' | 'custom'
          config: Record<string, any>
          security_config: Record<string, any>
          is_enabled: boolean
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          server_type: 'filesystem' | 'git' | 'database' | 'web' | 'custom'
          config: Record<string, any>
          security_config?: Record<string, any>
          is_enabled?: boolean
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          name?: string
          server_type?: 'filesystem' | 'git' | 'database' | 'web' | 'custom'
          config?: Record<string, any>
          security_config?: Record<string, any>
          is_enabled?: boolean
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_memories: {
        Row: {
          id: string
          project_id: string
          user_id: string
          memory_text: string
          context_type: 'general' | 'file' | 'conversation' | 'insight' | 'error' | 'solution'
          relevance_score: number
          related_files: string[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          memory_text: string
          context_type?: 'general' | 'file' | 'conversation' | 'insight' | 'error' | 'solution'
          relevance_score?: number
          related_files?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          memory_text?: string
          context_type?: 'general' | 'file' | 'conversation' | 'insight' | 'error' | 'solution'
          relevance_score?: number
          related_files?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      project_exports: {
        Row: {
          id: string
          project_id: string
          user_id: string
          export_type: 'full' | 'files_only' | 'settings_only'
          file_path: string | null
          metadata: Record<string, any>
          size_bytes: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          export_type: 'full' | 'files_only' | 'settings_only'
          file_path?: string | null
          metadata?: Record<string, any>
          size_bytes?: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          export_type?: 'full' | 'files_only' | 'settings_only'
          file_path?: string | null
          metadata?: Record<string, any>
          size_bytes?: number
          created_at?: string
          expires_at?: string
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

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type ProjectFile = Database['public']['Tables']['project_files']['Row']
export type ProjectFileInsert = Database['public']['Tables']['project_files']['Insert']
export type ProjectFileUpdate = Database['public']['Tables']['project_files']['Update']

export type MCPServer = Database['public']['Tables']['mcp_servers']['Row']
export type MCPServerInsert = Database['public']['Tables']['mcp_servers']['Insert']
export type MCPServerUpdate = Database['public']['Tables']['mcp_servers']['Update']

export type ProjectMemory = Database['public']['Tables']['project_memories']['Row']
export type ProjectMemoryInsert = Database['public']['Tables']['project_memories']['Insert']
export type ProjectMemoryUpdate = Database['public']['Tables']['project_memories']['Update']

export type ProjectExport = Database['public']['Tables']['project_exports']['Row']
export type ProjectExportInsert = Database['public']['Tables']['project_exports']['Insert']
export type ProjectExportUpdate = Database['public']['Tables']['project_exports']['Update']

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

// Project-related extended interfaces
export interface ProjectWithFiles extends Project {
  files: ProjectFile[]
}

export interface ProjectWithMCPServers extends Project {
  mcp_servers: MCPServer[]
}

export interface ProjectWithMemories extends Project {
  memories: ProjectMemory[]
}

export interface ProjectWithAllData extends Project {
  files: ProjectFile[]
  mcp_servers: MCPServer[]
  memories: ProjectMemory[]
}

export interface WorkspaceWithProjects extends Workspace {
  projects: Project[]
}

export interface FolderWithProjects extends Folder {
  projects: Project[]
}

export interface WorkspaceWithFoldersChatsAndProjects extends Workspace {
  folders: (FolderWithChats & FolderWithProjects)[]
  chats: Chat[]
  projects: Project[]
}

// File tree structure for UI
export interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  file?: ProjectFile
}

// MCP-related types
export interface MCPServerConfig {
  name: string
  server_type: MCPServer['server_type']
  config: Record<string, any>
  security_config?: Record<string, any>
}

export interface MCPToolCall {
  tool: string
  arguments: Record<string, any>
  result?: any
  error?: string
}

// Project template types
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  project_type: Project['project_type']
  files: Omit<ProjectFileInsert, 'project_id' | 'user_id' | 'id'>[]
  mcp_servers: Omit<MCPServerInsert, 'project_id' | 'user_id' | 'id'>[]
  settings: Record<string, any>
}

// Export/Import types
export interface ProjectExportData {
  project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  files: Omit<ProjectFile, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>[]
  mcp_servers: Omit<MCPServer, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>[]
  memories: Omit<ProjectMemory, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>[]
  metadata: {
    exported_at: string
    version: string
    total_files: number
    total_size: number
  }
}
