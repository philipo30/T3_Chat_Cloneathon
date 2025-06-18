import { chatService } from '@/lib/supabase/chat-service'
import type { Workspace } from '@/lib/supabase/database.types'

/**
 * Ensures that a user has a default workspace and migrates existing chats to it
 * This function is called automatically when a user first accesses the workspace features
 */
export async function ensureDefaultWorkspace(): Promise<Workspace | null> {
  try {
    // Check if user already has workspaces
    const existingWorkspaces = await chatService.getUserWorkspaces()
    
    // If user already has workspaces, find or create default
    if (existingWorkspaces.length > 0) {
      const defaultWorkspace = existingWorkspaces.find(w => w.is_default)
      if (defaultWorkspace) {
        return defaultWorkspace
      }
      
      // If no default workspace exists, make the first one default
      const firstWorkspace = existingWorkspaces[0]
      return await chatService.updateWorkspace(firstWorkspace.id, { is_default: true })
    }
    
    // User has no workspaces, create default workspace
    const defaultWorkspace = await chatService.createWorkspace({
      name: 'Default Workspace',
      description: 'Your default workspace for organizing chats',
      is_default: true,
      color: '#8B5CF6',
      icon: 'folder'
    })
    
    // Migrate existing chats to the default workspace
    await migrateExistingChatsToWorkspace(defaultWorkspace.id)
    
    return defaultWorkspace
  } catch (error) {
    console.error('Failed to ensure default workspace:', error)
    return null
  }
}

/**
 * Migrates all existing chats (that don't have a workspace) to the specified workspace
 */
async function migrateExistingChatsToWorkspace(workspaceId: string): Promise<void> {
  try {
    // Get all user chats that don't have a workspace assigned
    const userChats = await chatService.getUserChats()
    const chatsToMigrate = userChats.filter(chat => !chat.workspace_id)
    
    if (chatsToMigrate.length === 0) {
      return // No chats to migrate
    }
    
    // Move each chat to the default workspace
    const migrationPromises = chatsToMigrate.map(chat =>
      chatService.moveChatToWorkspace(chat.id, workspaceId)
    )
    
    await Promise.all(migrationPromises)
    
    console.log(`Successfully migrated ${chatsToMigrate.length} chats to default workspace`)
  } catch (error) {
    console.error('Failed to migrate existing chats:', error)
    throw error
  }
}

/**
 * Checks if a user needs workspace migration
 * Returns true if the user has chats but no workspaces
 */
export async function needsWorkspaceMigration(): Promise<boolean> {
  try {
    const [workspaces, chats] = await Promise.all([
      chatService.getUserWorkspaces(),
      chatService.getUserChats()
    ])
    
    // User needs migration if they have chats but no workspaces
    return chats.length > 0 && workspaces.length === 0
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return false
  }
}

/**
 * Performs a complete workspace migration for a user
 * This includes creating a default workspace and migrating all existing chats
 */
export async function performWorkspaceMigration(): Promise<{
  success: boolean
  workspace?: Workspace
  migratedChatsCount?: number
  error?: string
}> {
  try {
    // Check if migration is needed
    const needsMigration = await needsWorkspaceMigration()
    if (!needsMigration) {
      return { success: true, migratedChatsCount: 0 }
    }
    
    // Get chat count before migration
    const userChats = await chatService.getUserChats()
    const chatsToMigrate = userChats.filter(chat => !chat.workspace_id)
    
    // Create default workspace and migrate chats
    const defaultWorkspace = await ensureDefaultWorkspace()
    
    if (!defaultWorkspace) {
      return { success: false, error: 'Failed to create default workspace' }
    }
    
    return {
      success: true,
      workspace: defaultWorkspace,
      migratedChatsCount: chatsToMigrate.length
    }
  } catch (error) {
    console.error('Workspace migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Hook to automatically perform workspace migration when needed
 * This should be called in the main app component or workspace provider
 */
export async function autoMigrateWorkspaces(): Promise<void> {
  try {
    const needsMigration = await needsWorkspaceMigration()
    if (needsMigration) {
      console.log('Performing automatic workspace migration...')
      const result = await performWorkspaceMigration()
      
      if (result.success) {
        console.log(`Workspace migration completed successfully. Migrated ${result.migratedChatsCount} chats.`)
      } else {
        console.error('Workspace migration failed:', result.error)
      }
    }
  } catch (error) {
    console.error('Auto migration failed:', error)
  }
}
