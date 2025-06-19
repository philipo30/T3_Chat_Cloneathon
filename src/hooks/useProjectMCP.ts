import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/lib/supabase/project-service'
import { projectExportService } from '@/lib/supabase/project-export-service'
import type {
  MCPServer,
  MCPServerInsert,
  MCPServerUpdate,
  ProjectMemory,
  ProjectMemoryInsert
} from '@/lib/supabase/database.types'
import { useAuth } from './useAuth'

// Hook for managing MCP servers
export function useProjectMCPServers(projectId: string | null) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // Get project MCP servers
  const {
    data: mcpServers,
    isLoading: isLoadingMCPServers,
    error: mcpServersError,
  } = useQuery({
    queryKey: ['project-mcp-servers', projectId],
    queryFn: () => projectService.getProjectMCPServers(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Create MCP server mutation
  const createMCPServerMutation = useMutation({
    mutationFn: (data: Omit<MCPServerInsert, 'user_id'>) =>
      projectService.createMCPServer(data),
    onSuccess: (newServer) => {
      queryClient.setQueryData(['project-mcp-servers', projectId], (old: MCPServer[] = []) => [
        ...old,
        newServer,
      ])
      queryClient.invalidateQueries({ queryKey: ['project-mcp-servers', projectId] })
    },
  })

  // Update MCP server mutation
  const updateMCPServerMutation = useMutation({
    mutationFn: ({ serverId, updates }: { serverId: string; updates: MCPServerUpdate }) =>
      projectService.updateMCPServer(serverId, updates),
    onSuccess: (updatedServer) => {
      queryClient.setQueryData(['project-mcp-servers', projectId], (old: MCPServer[] = []) =>
        old.map(server => server.id === updatedServer.id ? updatedServer : server)
      )
      queryClient.invalidateQueries({ queryKey: ['project-mcp-servers', projectId] })
    },
  })

  // Delete MCP server mutation
  const deleteMCPServerMutation = useMutation({
    mutationFn: (serverId: string) => projectService.deleteMCPServer(serverId),
    onSuccess: (_, serverId) => {
      queryClient.setQueryData(['project-mcp-servers', projectId], (old: MCPServer[] = []) =>
        old.filter(server => server.id !== serverId)
      )
      queryClient.invalidateQueries({ queryKey: ['project-mcp-servers', projectId] })
    },
  })

  // Toggle MCP server mutation
  const toggleMCPServerMutation = useMutation({
    mutationFn: ({ serverId, enabled }: { serverId: string; enabled: boolean }) =>
      projectService.toggleMCPServer(serverId, enabled),
    onSuccess: (updatedServer) => {
      queryClient.setQueryData(['project-mcp-servers', projectId], (old: MCPServer[] = []) =>
        old.map(server => server.id === updatedServer.id ? updatedServer : server)
      )
      queryClient.invalidateQueries({ queryKey: ['project-mcp-servers', projectId] })
    },
  })

  // Helper functions
  const createMCPServer = useCallback(
    (data: Omit<MCPServerInsert, 'user_id' | 'project_id'>) => {
      if (!projectId) throw new Error('Project ID is required')
      return createMCPServerMutation.mutateAsync({ ...data, project_id: projectId })
    },
    [createMCPServerMutation, projectId]
  )

  const updateMCPServer = useCallback(
    (serverId: string, updates: MCPServerUpdate) => {
      return updateMCPServerMutation.mutateAsync({ serverId, updates })
    },
    [updateMCPServerMutation]
  )

  const deleteMCPServer = useCallback(
    (serverId: string) => {
      return deleteMCPServerMutation.mutateAsync(serverId)
    },
    [deleteMCPServerMutation]
  )

  const toggleMCPServer = useCallback(
    (serverId: string, enabled: boolean) => {
      return toggleMCPServerMutation.mutateAsync({ serverId, enabled })
    },
    [toggleMCPServerMutation]
  )

  return {
    mcpServers: mcpServers || [],
    isLoadingMCPServers,
    mcpServersError,
    createMCPServer,
    updateMCPServer,
    deleteMCPServer,
    toggleMCPServer,
    isCreatingMCPServer: createMCPServerMutation.isPending,
    isUpdatingMCPServer: updateMCPServerMutation.isPending,
    isDeletingMCPServer: deleteMCPServerMutation.isPending,
    isTogglingMCPServer: toggleMCPServerMutation.isPending,
  }
}

// Hook for managing project memories
export function useProjectMemories(projectId: string | null) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // Get project memories
  const {
    data: memories,
    isLoading: isLoadingMemories,
    error: memoriesError,
  } = useQuery({
    queryKey: ['project-memories', projectId],
    queryFn: () => projectService.getProjectMemories(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Create memory mutation
  const createMemoryMutation = useMutation({
    mutationFn: (data: Omit<ProjectMemoryInsert, 'user_id'>) =>
      projectService.createMemory(data),
    onSuccess: (newMemory) => {
      queryClient.setQueryData(['project-memories', projectId], (old: ProjectMemory[] = []) => [
        newMemory,
        ...old,
      ])
      queryClient.invalidateQueries({ queryKey: ['project-memories', projectId] })
    },
  })

  // Update memory mutation
  const updateMemoryMutation = useMutation({
    mutationFn: ({ memoryId, updates }: { memoryId: string; updates: Partial<ProjectMemoryInsert> }) =>
      projectService.updateMemory(memoryId, updates),
    onSuccess: (updatedMemory) => {
      queryClient.setQueryData(['project-memories', projectId], (old: ProjectMemory[] = []) =>
        old.map(memory => memory.id === updatedMemory.id ? updatedMemory : memory)
      )
      queryClient.invalidateQueries({ queryKey: ['project-memories', projectId] })
    },
  })

  // Delete memory mutation
  const deleteMemoryMutation = useMutation({
    mutationFn: (memoryId: string) => projectService.deleteMemory(memoryId),
    onSuccess: (_, memoryId) => {
      queryClient.setQueryData(['project-memories', projectId], (old: ProjectMemory[] = []) =>
        old.filter(memory => memory.id !== memoryId)
      )
      queryClient.invalidateQueries({ queryKey: ['project-memories', projectId] })
    },
  })

  // Search memories
  const searchMemories = useCallback(
    async (query: string) => {
      if (!projectId) return []
      return await projectService.searchMemories(projectId, query)
    },
    [projectId]
  )

  // Helper functions
  const createMemory = useCallback(
    (data: Omit<ProjectMemoryInsert, 'user_id' | 'project_id'>) => {
      if (!projectId) throw new Error('Project ID is required')
      return createMemoryMutation.mutateAsync({ ...data, project_id: projectId })
    },
    [createMemoryMutation, projectId]
  )

  const updateMemory = useCallback(
    (memoryId: string, updates: Partial<ProjectMemoryInsert>) => {
      return updateMemoryMutation.mutateAsync({ memoryId, updates })
    },
    [updateMemoryMutation]
  )

  const deleteMemory = useCallback(
    (memoryId: string) => {
      return deleteMemoryMutation.mutateAsync(memoryId)
    },
    [deleteMemoryMutation]
  )

  // Auto-create memory helper
  const autoCreateMemory = useCallback(
    (memoryText: string, contextType: ProjectMemory['context_type'] = 'general', relatedFiles: string[] = [], tags: string[] = []) => {
      return createMemory({
        memory_text: memoryText,
        context_type: contextType,
        related_files: relatedFiles,
        tags,
        relevance_score: 1.0 // AI can adjust this later
      })
    },
    [createMemory]
  )

  return {
    memories: memories || [],
    isLoadingMemories,
    memoriesError,
    createMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
    autoCreateMemory,
    isCreatingMemory: createMemoryMutation.isPending,
    isUpdatingMemory: updateMemoryMutation.isPending,
    isDeletingMemory: deleteMemoryMutation.isPending,
  }
}

// Hook for project export/import
export function useProjectExport(projectId: string | null) {
  const queryClient = useQueryClient()

  // Get project exports
  const {
    data: exports,
    isLoading: isLoadingExports,
    error: exportsError,
  } = useQuery({
    queryKey: ['project-exports', projectId],
    queryFn: () => projectExportService.getProjectExports(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Export project mutation
  const exportProjectMutation = useMutation({
    mutationFn: ({ exportType }: { exportType: 'full' | 'files_only' | 'settings_only' }) =>
      projectExportService.exportProjectAsZip(projectId!, exportType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-exports', projectId] })
    },
  })

  // Import project mutation
  const importProjectMutation = useMutation({
    mutationFn: ({ zipFile, workspaceId, folderId }: { 
      zipFile: File; 
      workspaceId?: string; 
      folderId?: string 
    }) =>
      projectExportService.importProjectFromZip(zipFile, workspaceId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects'] })
    },
  })

  // Helper functions
  const exportProject = useCallback(
    async (exportType: 'full' | 'files_only' | 'settings_only') => {
      if (!projectId) throw new Error('Project ID is required')
      const blob = await exportProjectMutation.mutateAsync({ exportType })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `project-export-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return blob
    },
    [exportProjectMutation, projectId]
  )

  const importProject = useCallback(
    (zipFile: File, workspaceId?: string, folderId?: string) => {
      return importProjectMutation.mutateAsync({ zipFile, workspaceId, folderId })
    },
    [importProjectMutation]
  )

  return {
    exports: exports || [],
    isLoadingExports,
    exportsError,
    exportProject,
    importProject,
    isExporting: exportProjectMutation.isPending,
    isImporting: importProjectMutation.isPending,
  }
}
