import { createClient } from './client'
import { projectService } from './project-service'
import type {
  ProjectExport,
  ProjectExportInsert,
  ProjectExportData,
  Project,
  ProjectFile,
  MCPServer,
  ProjectMemory
} from './database.types'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'

export class ProjectExportService {
  private supabase = createClient()

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // ============================================================================
  // EXPORT OPERATIONS
  // ============================================================================

  async createExport(data: Omit<ProjectExportInsert, 'user_id'>): Promise<ProjectExport> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const exportData: ProjectExportInsert = {
      ...data,
      user_id: user.id,
      id: uuidv4(),
    }

    const { data: exportRecord, error } = await this.supabase
      .from('project_exports')
      .insert(exportData)
      .select()
      .single()

    if (error) throw error
    return exportRecord
  }

  async getProjectExports(projectId: string): Promise<ProjectExport[]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: exports, error } = await this.supabase
      .from('project_exports')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return exports || []
  }

  async deleteExport(exportId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('project_exports')
      .delete()
      .eq('id', exportId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Generate export data for a project
  async generateExportData(projectId: string, exportType: 'full' | 'files_only' | 'settings_only'): Promise<ProjectExportData> {
    const project = await projectService.getProject(projectId)
    if (!project) throw new Error('Project not found')

    const exportData: ProjectExportData = {
      project: {
        name: project.name,
        description: project.description,
        project_type: project.project_type,
        template_id: project.template_id,
        settings: project.settings,
        workspace_id: project.workspace_id,
        folder_id: project.folder_id,
        total_size_bytes: project.total_size_bytes,
        file_count: project.file_count,
        is_archived: project.is_archived
      },
      files: [],
      mcp_servers: [],
      memories: [],
      metadata: {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        total_files: 0,
        total_size: 0
      }
    }

    if (exportType === 'full' || exportType === 'files_only') {
      const files = await projectService.getProjectFiles(projectId)
      exportData.files = files.map(file => ({
        name: file.name,
        path: file.path,
        content: file.content,
        file_type: file.file_type,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        encoding: file.encoding,
        is_directory: file.is_directory,
        parent_id: file.parent_id
      }))
      exportData.metadata.total_files = files.length
      exportData.metadata.total_size = files.reduce((sum, file) => sum + file.size_bytes, 0)
    }

    if (exportType === 'full') {
      const mcpServers = await projectService.getProjectMCPServers(projectId)
      exportData.mcp_servers = mcpServers.map(server => ({
        name: server.name,
        server_type: server.server_type,
        config: server.config,
        security_config: server.security_config,
        is_enabled: server.is_enabled,
        last_used_at: server.last_used_at
      }))

      const memories = await projectService.getProjectMemories(projectId)
      exportData.memories = memories.map(memory => ({
        memory_text: memory.memory_text,
        context_type: memory.context_type,
        relevance_score: memory.relevance_score,
        related_files: memory.related_files,
        tags: memory.tags
      }))
    }

    return exportData
  }

  // Create ZIP file from export data
  async createZipFromExportData(exportData: ProjectExportData): Promise<Blob> {
    const zip = new JSZip()

    // Add project metadata
    zip.file('project.json', JSON.stringify({
      project: exportData.project,
      mcp_servers: exportData.mcp_servers,
      memories: exportData.memories,
      metadata: exportData.metadata
    }, null, 2))

    // Add files
    for (const file of exportData.files) {
      if (!file.is_directory && file.content) {
        // Create directory structure
        const pathParts = file.path.split('/')
        let currentFolder = zip
        
        // Create nested folders
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderName = pathParts[i]
          currentFolder = currentFolder.folder(folderName) || currentFolder
        }
        
        // Add file content
        if (file.file_type === 'text') {
          zip.file(file.path, file.content)
        } else if (file.file_type === 'binary' || file.file_type === 'image') {
          // Handle binary files (base64 encoded)
          zip.file(file.path, file.content, { base64: true })
        }
      }
    }

    return await zip.generateAsync({ type: 'blob' })
  }

  // Export project as ZIP file
  async exportProjectAsZip(projectId: string, exportType: 'full' | 'files_only' | 'settings_only'): Promise<Blob> {
    const exportData = await this.generateExportData(projectId, exportType)
    return await this.createZipFromExportData(exportData)
  }

  // ============================================================================
  // IMPORT OPERATIONS
  // ============================================================================

  // Parse ZIP file and extract project data
  async parseZipFile(zipFile: File): Promise<ProjectExportData> {
    const zip = new JSZip()
    const zipData = await zip.loadAsync(zipFile)

    // Read project metadata
    const projectJsonFile = zipData.file('project.json')
    if (!projectJsonFile) {
      throw new Error('Invalid project ZIP: missing project.json')
    }

    const projectJsonContent = await projectJsonFile.async('text')
    const projectData = JSON.parse(projectJsonContent)

    // Extract files from ZIP
    const files: ProjectExportData['files'] = []
    
    zipData.forEach((relativePath, file) => {
      if (relativePath !== 'project.json' && !file.dir) {
        // This will be processed later
      }
    })

    // Process files
    for (const [relativePath, file] of Object.entries(zipData.files)) {
      if (relativePath !== 'project.json' && !file.dir) {
        const content = await file.async('text')
        const pathParts = relativePath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        // Determine file type based on extension
        const extension = fileName.split('.').pop()?.toLowerCase()
        let fileType: 'text' | 'binary' | 'image' = 'text'
        let mimeType = 'text/plain'
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
          fileType = 'image'
          mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
        } else if (['pdf', 'zip', 'tar', 'gz'].includes(extension || '')) {
          fileType = 'binary'
          mimeType = 'application/octet-stream'
        }

        files.push({
          name: fileName,
          path: relativePath,
          content,
          file_type: fileType,
          mime_type: mimeType,
          size_bytes: content.length,
          encoding: 'utf-8',
          is_directory: false,
          parent_id: null
        })
      }
    }

    return {
      project: projectData.project,
      files,
      mcp_servers: projectData.mcp_servers || [],
      memories: projectData.memories || [],
      metadata: projectData.metadata
    }
  }

  // Import project from ZIP file
  async importProjectFromZip(zipFile: File, targetWorkspaceId?: string, targetFolderId?: string): Promise<Project> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const exportData = await this.parseZipFile(zipFile)

    // Create new project
    const newProject = await projectService.createProject({
      name: exportData.project.name,
      description: exportData.project.description,
      project_type: exportData.project.project_type,
      template_id: exportData.project.template_id,
      settings: exportData.project.settings,
      workspace_id: targetWorkspaceId || exportData.project.workspace_id,
      folder_id: targetFolderId || exportData.project.folder_id
    })

    // Import files
    for (const fileData of exportData.files) {
      await projectService.createFile({
        project_id: newProject.id,
        name: fileData.name,
        path: fileData.path,
        content: fileData.content,
        file_type: fileData.file_type,
        mime_type: fileData.mime_type,
        size_bytes: fileData.size_bytes,
        encoding: fileData.encoding,
        is_directory: fileData.is_directory,
        parent_id: fileData.parent_id
      })
    }

    // Import MCP servers
    for (const serverData of exportData.mcp_servers) {
      await projectService.createMCPServer({
        project_id: newProject.id,
        name: serverData.name,
        server_type: serverData.server_type,
        config: serverData.config,
        security_config: serverData.security_config,
        is_enabled: serverData.is_enabled,
        last_used_at: serverData.last_used_at
      })
    }

    // Import memories
    for (const memoryData of exportData.memories) {
      await projectService.createMemory({
        project_id: newProject.id,
        memory_text: memoryData.memory_text,
        context_type: memoryData.context_type,
        relevance_score: memoryData.relevance_score,
        related_files: memoryData.related_files,
        tags: memoryData.tags
      })
    }

    return newProject
  }

  // Clean up expired exports (should be called periodically)
  async cleanupExpiredExports(): Promise<void> {
    const { error } = await this.supabase.rpc('cleanup_expired_exports')
    if (error) throw error
  }
}

// Create and export a singleton instance
export const projectExportService = new ProjectExportService()
