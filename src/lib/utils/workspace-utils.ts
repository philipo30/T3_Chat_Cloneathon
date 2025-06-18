import type { 
  Workspace, 
  Folder, 
  Chat, 
  WorkspaceWithFoldersAndChats 
} from '@/lib/supabase/database.types'

// Default workspace and folder icons
export const WORKSPACE_ICONS = [
  'folder',
  'briefcase',
  'home',
  'star',
  'heart',
  'bookmark',
  'tag',
  'archive',
  'layers',
  'grid',
  'building',
  'package',
  'zap',
  'target',
  'trophy',
  'palette',
  'code',
  'database',
] as const

export const FOLDER_ICONS = [
  'folder',
  'folder-open',
  'file-text',
  'archive',
  'bookmark',
  'tag',
  'star',
  'heart',
  'layers',
  'grid',
  'package',
  'code',
  'database',
  'target',
  'trophy',
] as const

// Default colors for workspaces and folders
export const WORKSPACE_COLORS = [
  '#8B5CF6', // Purple (default)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5A2B', // Brown
  '#6B7280', // Gray
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
] as const

// Utility functions for workspace management
export function getDefaultWorkspace(workspaces: Workspace[]): Workspace | null {
  return workspaces.find(workspace => workspace.is_default) || null
}

export function sortWorkspaces(workspaces: Workspace[]): Workspace[] {
  return [...workspaces].sort((a, b) => {
    // Default workspace first
    if (a.is_default && !b.is_default) return -1
    if (!a.is_default && b.is_default) return 1
    
    // Then by updated_at (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

export function sortFolders(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => {
    // Sort by created_at (newest first) to ensure new folders appear at the top
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    // Pinned chats first
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    
    // If both pinned, sort by pinned_at
    if (a.pinned && b.pinned) {
      const aPinnedAt = a.pinned_at ? new Date(a.pinned_at).getTime() : 0
      const bPinnedAt = b.pinned_at ? new Date(b.pinned_at).getTime() : 0
      return bPinnedAt - aPinnedAt
    }
    
    // Then by updated_at (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

// Utility functions for organizing workspace data
export function organizeWorkspaceData(workspace: WorkspaceWithFoldersAndChats) {
  // Sort folders to appear at the top (newest first for folder positioning)
  const sortedFolders = sortFolders(workspace.folders).map(folder => ({
    ...folder,
    chats: sortChats(folder.chats)
  }))

  // Sort workspace direct chats (not in folders) with pinned first, then by time
  const sortedWorkspaceChats = sortChats(workspace.chats)

  return {
    ...workspace,
    folders: sortedFolders,
    chats: sortedWorkspaceChats
  }
}

// Search functionality
export function searchInWorkspace(
  workspace: WorkspaceWithFoldersAndChats, 
  query: string
): {
  matchingChats: Chat[]
  matchingFolders: Folder[]
} {
  const lowerQuery = query.toLowerCase()
  
  const matchingChats: Chat[] = []
  const matchingFolders: Folder[] = []
  
  // Search in workspace direct chats
  workspace.chats.forEach(chat => {
    if (chat.title.toLowerCase().includes(lowerQuery)) {
      matchingChats.push(chat)
    }
  })
  
  // Search in folders and their chats
  workspace.folders.forEach(folder => {
    let folderHasMatch = false
    
    // Check if folder name matches
    if (folder.name.toLowerCase().includes(lowerQuery)) {
      matchingFolders.push(folder)
      folderHasMatch = true
    }
    
    // Check folder's chats
    folder.chats.forEach(chat => {
      if (chat.title.toLowerCase().includes(lowerQuery)) {
        matchingChats.push(chat)
        if (!folderHasMatch) {
          matchingFolders.push(folder)
          folderHasMatch = true
        }
      }
    })
  })
  
  return {
    matchingChats: [...new Set(matchingChats)], // Remove duplicates
    matchingFolders: [...new Set(matchingFolders)] // Remove duplicates
  }
}

// Validation functions
export function validateWorkspaceName(name: string): string | null {
  if (!name.trim()) {
    return 'Workspace name is required'
  }
  if (name.length > 100) {
    return 'Workspace name must be less than 100 characters'
  }
  return null
}

export function validateFolderName(name: string): string | null {
  if (!name.trim()) {
    return 'Folder name is required'
  }
  if (name.length > 100) {
    return 'Folder name must be less than 100 characters'
  }
  return null
}

// Helper functions for drag and drop
export function canDropChatInFolder(chat: Chat, folder: Folder): boolean {
  // Can't drop chat in the same folder it's already in
  if (chat.folder_id === folder.id) {
    return false
  }
  
  // Can only drop in folders within the same workspace
  if (chat.workspace_id !== folder.workspace_id) {
    return false
  }
  
  return true
}

export function canDropChatInWorkspace(chat: Chat, workspace: Workspace): boolean {
  // Can't drop chat in the same workspace if it's not in a folder
  if (chat.workspace_id === workspace.id && !chat.folder_id) {
    return false
  }
  
  return true
}

// Generate unique names for duplicates
export function generateUniqueWorkspaceName(
  baseName: string, 
  existingWorkspaces: Workspace[]
): string {
  const existingNames = existingWorkspaces.map(w => w.name.toLowerCase())
  
  if (!existingNames.includes(baseName.toLowerCase())) {
    return baseName
  }
  
  let counter = 1
  let newName = `${baseName} (${counter})`
  
  while (existingNames.includes(newName.toLowerCase())) {
    counter++
    newName = `${baseName} (${counter})`
  }
  
  return newName
}

export function generateUniqueFolderName(
  baseName: string, 
  existingFolders: Folder[]
): string {
  const existingNames = existingFolders.map(f => f.name.toLowerCase())
  
  if (!existingNames.includes(baseName.toLowerCase())) {
    return baseName
  }
  
  let counter = 1
  let newName = `${baseName} (${counter})`
  
  while (existingNames.includes(newName.toLowerCase())) {
    counter++
    newName = `${baseName} (${counter})`
  }
  
  return newName
}

// Statistics and analytics
export function getWorkspaceStats(workspace: WorkspaceWithFoldersAndChats) {
  const totalChats = workspace.chats.length + 
    workspace.folders.reduce((sum, folder) => sum + folder.chats.length, 0)
  
  const pinnedChats = workspace.chats.filter(chat => chat.pinned).length +
    workspace.folders.reduce((sum, folder) => 
      sum + folder.chats.filter(chat => chat.pinned).length, 0)
  
  return {
    totalFolders: workspace.folders.length,
    totalChats,
    pinnedChats,
    directChats: workspace.chats.length,
    chatsInFolders: workspace.folders.reduce((sum, folder) => sum + folder.chats.length, 0),
  }
}
