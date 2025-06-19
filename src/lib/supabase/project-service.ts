import { createClient } from './client'
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectFile,
  ProjectFileInsert,
  ProjectFileUpdate,
  MCPServer,
  MCPServerInsert,
  MCPServerUpdate,
  ProjectMemory,
  ProjectMemoryInsert,
  ProjectMemoryUpdate,
  ProjectExport,
  ProjectExportInsert,
  ProjectWithFiles,
  ProjectWithAllData,
  FileTreeNode,
  ProjectExportData
} from './database.types'
import { v4 as uuidv4 } from 'uuid'

export class ProjectService {
  private supabase = createClient()
  private channels: Map<string, any> = new Map()

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async createProject(data: Omit<ProjectInsert, 'user_id'>): Promise<Project> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const projectData: ProjectInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: project, error } = await this.supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) throw error
    return project
  }

  async getProject(projectId: string): Promise<Project | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: project, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return project
  }

  async getProjectWithFiles(projectId: string): Promise<ProjectWithFiles | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: project, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        files:project_files (*)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return project as ProjectWithFiles
  }

  async getProjectWithAllData(projectId: string): Promise<ProjectWithAllData | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: project, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        files:project_files (*),
        mcp_servers (*),
        memories:project_memories (*)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return project as ProjectWithAllData
  }

  async getUserProjects(): Promise<Project[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return projects || []
  }

  async updateProject(projectId: string, updates: ProjectUpdate): Promise<Project> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: project, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return project
  }

  async deleteProject(projectId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { is_archived: true })
  }

  async unarchiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { is_archived: false })
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  async createFile(data: Omit<ProjectFileInsert, 'user_id'>): Promise<ProjectFile> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const fileData: ProjectFileInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: file, error } = await this.supabase
      .from('project_files')
      .insert(fileData)
      .select()
      .single()

    if (error) throw error
    return file
  }

  async getFile(fileId: string): Promise<ProjectFile | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: file, error } = await this.supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return file
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: files, error } = await this.supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('path')

    if (error) throw error
    return files || []
  }

  async updateFile(fileId: string, updates: ProjectFileUpdate): Promise<ProjectFile> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: file, error } = await this.supabase
      .from('project_files')
      .update(updates)
      .eq('id', fileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return file
  }

  async deleteFile(fileId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('project_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async moveFile(fileId: string, newPath: string): Promise<ProjectFile> {
    return this.updateFile(fileId, { path: newPath })
  }

  async renameFile(fileId: string, newName: string): Promise<ProjectFile> {
    const file = await this.getFile(fileId)
    if (!file) throw new Error('File not found')

    const pathParts = file.path.split('/')
    pathParts[pathParts.length - 1] = newName
    const newPath = pathParts.join('/')

    return this.updateFile(fileId, { name: newName, path: newPath })
  }

  // Build file tree structure for UI
  buildFileTree(files: ProjectFile[]): FileTreeNode[] {
    const tree: FileTreeNode[] = []
    const nodeMap = new Map<string, FileTreeNode>()

    // Sort files by path to ensure proper tree building
    const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path))

    for (const file of sortedFiles) {
      const pathParts = file.path.split('/').filter(part => part.length > 0)
      let currentPath = ''
      let currentLevel = tree

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i]
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isLastPart = i === pathParts.length - 1

        let node = nodeMap.get(currentPath)
        if (!node) {
          node = {
            id: isLastPart ? file.id : `dir-${currentPath}`,
            name: part,
            path: currentPath,
            type: isLastPart && !file.is_directory ? 'file' : 'directory',
            children: isLastPart && !file.is_directory ? undefined : [],
            file: isLastPart ? file : undefined
          }
          nodeMap.set(currentPath, node)
          currentLevel.push(node)
        }

        if (node.children) {
          currentLevel = node.children
        }
      }
    }

    return tree
  }

  // ============================================================================
  // MCP SERVER OPERATIONS
  // ============================================================================

  async createMCPServer(data: Omit<MCPServerInsert, 'user_id'>): Promise<MCPServer> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const serverData: MCPServerInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: server, error } = await this.supabase
      .from('mcp_servers')
      .insert(serverData)
      .select()
      .single()

    if (error) throw error
    return server
  }

  async getProjectMCPServers(projectId: string): Promise<MCPServer[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: servers, error } = await this.supabase
      .from('mcp_servers')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('name')

    if (error) throw error
    return servers || []
  }

  async updateMCPServer(serverId: string, updates: MCPServerUpdate): Promise<MCPServer> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: server, error } = await this.supabase
      .from('mcp_servers')
      .update(updates)
      .eq('id', serverId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return server
  }

  async deleteMCPServer(serverId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('mcp_servers')
      .delete()
      .eq('id', serverId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async toggleMCPServer(serverId: string, enabled: boolean): Promise<MCPServer> {
    return this.updateMCPServer(serverId, {
      is_enabled: enabled,
      last_used_at: enabled ? new Date().toISOString() : undefined
    })
  }

  // ============================================================================
  // PROJECT MEMORY OPERATIONS
  // ============================================================================

  async createMemory(data: Omit<ProjectMemoryInsert, 'user_id'>): Promise<ProjectMemory> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const memoryData: ProjectMemoryInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: memory, error } = await this.supabase
      .from('project_memories')
      .insert(memoryData)
      .select()
      .single()

    if (error) throw error
    return memory
  }

  async getProjectMemories(projectId: string, limit = 50): Promise<ProjectMemory[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: memories, error } = await this.supabase
      .from('project_memories')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return memories || []
  }

  async searchMemories(projectId: string, query: string, limit = 20): Promise<ProjectMemory[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: memories, error } = await this.supabase
      .from('project_memories')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .textSearch('memory_text', query)
      .order('relevance_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return memories || []
  }

  async updateMemory(memoryId: string, updates: Partial<ProjectMemoryInsert>): Promise<ProjectMemory> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: memory, error } = await this.supabase
      .from('project_memories')
      .update(updates)
      .eq('id', memoryId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return memory
  }

  async deleteMemory(memoryId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('project_memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', user.id)

    if (error) throw error
  }
}

// Create and export a singleton instance
export const projectService = new ProjectService()
