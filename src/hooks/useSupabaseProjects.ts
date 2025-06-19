import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/lib/supabase/project-service'
import { projectExportService } from '@/lib/supabase/project-export-service'
import type { 
  Project, 
  ProjectInsert, 
  ProjectUpdate,
  ProjectFile,
  ProjectFileInsert,
  ProjectFileUpdate,
  MCPServer,
  MCPServerInsert,
  ProjectMemory,
  ProjectMemoryInsert,
  ProjectWithFiles,
  ProjectWithAllData,
  FileTreeNode
} from '@/lib/supabase/database.types'
import { useAuth } from './useAuth'

// Hook for managing user projects
export function useSupabaseProjects() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // Get all user projects
  const {
    data: projects,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ['user-projects', currentUser?.id],
    queryFn: () => projectService.getUserProjects(),
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: Omit<ProjectInsert, 'user_id'>) =>
      projectService.createProject(data),
    onSuccess: (newProject) => {
      queryClient.setQueryData(['user-projects', currentUser?.id], (old: Project[] = []) => [
        newProject,
        ...old,
      ])
      queryClient.invalidateQueries({ queryKey: ['user-projects', currentUser?.id] })
    },
  })

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: ProjectUpdate }) =>
      projectService.updateProject(projectId, updates),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['user-projects', currentUser?.id], (old: Project[] = []) =>
        old.map(project => project.id === updatedProject.id ? updatedProject : project)
      )
      queryClient.setQueryData(['project', updatedProject.id], updatedProject)
      queryClient.invalidateQueries({ queryKey: ['user-projects', currentUser?.id] })
    },
  })

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.setQueryData(['user-projects', currentUser?.id], (old: Project[] = []) =>
        old.filter(project => project.id !== projectId)
      )
      queryClient.removeQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['user-projects', currentUser?.id] })
    },
  })

  // Archive project mutation
  const archiveProjectMutation = useMutation({
    mutationFn: (projectId: string) => projectService.archiveProject(projectId),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['user-projects', currentUser?.id], (old: Project[] = []) =>
        old.filter(project => project.id !== updatedProject.id)
      )
      queryClient.invalidateQueries({ queryKey: ['user-projects', currentUser?.id] })
    },
  })

  // Helper functions
  const createProject = useCallback(
    (name: string, description?: string, projectType?: Project['project_type'], workspaceId?: string, folderId?: string) => {
      return createProjectMutation.mutateAsync({ 
        name, 
        description,
        project_type: projectType || 'general',
        workspace_id: workspaceId,
        folder_id: folderId
      })
    },
    [createProjectMutation]
  )

  const updateProject = useCallback(
    (projectId: string, updates: ProjectUpdate) => {
      return updateProjectMutation.mutateAsync({ projectId, updates })
    },
    [updateProjectMutation]
  )

  const deleteProject = useCallback(
    (projectId: string) => {
      return deleteProjectMutation.mutateAsync(projectId)
    },
    [deleteProjectMutation]
  )

  const archiveProject = useCallback(
    (projectId: string) => {
      return archiveProjectMutation.mutateAsync(projectId)
    },
    [archiveProjectMutation]
  )

  return {
    projects: projects || [],
    isLoadingProjects,
    projectsError,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    isCreatingProject: createProjectMutation.isPending,
    isUpdatingProject: updateProjectMutation.isPending,
    isDeletingProject: deleteProjectMutation.isPending,
    isArchivingProject: archiveProjectMutation.isPending,
  }
}

// Hook for managing a specific project
export function useSupabaseProject(projectId: string | null) {
  const queryClient = useQueryClient()

  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  return {
    project,
    isLoadingProject,
    projectError,
  }
}

// Hook for managing project with files
export function useSupabaseProjectWithFiles(projectId: string | null) {
  const queryClient = useQueryClient()

  const {
    data: projectWithFiles,
    isLoading: isLoadingProjectWithFiles,
    error: projectWithFilesError,
  } = useQuery({
    queryKey: ['project-with-files', projectId],
    queryFn: () => projectService.getProjectWithFiles(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Build file tree
  const fileTree = projectWithFiles?.files ? projectService.buildFileTree(projectWithFiles.files) : []

  return {
    projectWithFiles,
    fileTree,
    isLoadingProjectWithFiles,
    projectWithFilesError,
  }
}

// Hook for managing project files
export function useSupabaseProjectFiles(projectId: string | null) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // Get project files
  const {
    data: files,
    isLoading: isLoadingFiles,
    error: filesError,
  } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => projectService.getProjectFiles(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  })

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: (data: Omit<ProjectFileInsert, 'user_id'>) =>
      projectService.createFile(data),
    onSuccess: (newFile) => {
      queryClient.setQueryData(['project-files', projectId], (old: ProjectFile[] = []) => [
        ...old,
        newFile,
      ])
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-with-files', projectId] })
    },
  })

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: ({ fileId, updates }: { fileId: string; updates: ProjectFileUpdate }) =>
      projectService.updateFile(fileId, updates),
    onSuccess: (updatedFile) => {
      queryClient.setQueryData(['project-files', projectId], (old: ProjectFile[] = []) =>
        old.map(file => file.id === updatedFile.id ? updatedFile : file)
      )
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-with-files', projectId] })
    },
  })

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => projectService.deleteFile(fileId),
    onSuccess: (_, fileId) => {
      queryClient.setQueryData(['project-files', projectId], (old: ProjectFile[] = []) =>
        old.filter(file => file.id !== fileId)
      )
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-with-files', projectId] })
    },
  })

  // Helper functions
  const createFile = useCallback(
    (data: Omit<ProjectFileInsert, 'user_id' | 'project_id'>) => {
      if (!projectId) throw new Error('Project ID is required')
      return createFileMutation.mutateAsync({ ...data, project_id: projectId })
    },
    [createFileMutation, projectId]
  )

  const updateFile = useCallback(
    (fileId: string, updates: ProjectFileUpdate) => {
      return updateFileMutation.mutateAsync({ fileId, updates })
    },
    [updateFileMutation]
  )

  const deleteFile = useCallback(
    (fileId: string) => {
      return deleteFileMutation.mutateAsync(fileId)
    },
    [deleteFileMutation]
  )

  const renameFile = useCallback(
    (fileId: string, newName: string) => {
      return projectService.renameFile(fileId, newName)
    },
    []
  )

  const moveFile = useCallback(
    (fileId: string, newPath: string) => {
      return projectService.moveFile(fileId, newPath)
    },
    []
  )

  // Build file tree
  const fileTree = files ? projectService.buildFileTree(files) : []

  return {
    files: files || [],
    fileTree,
    isLoadingFiles,
    filesError,
    createFile,
    updateFile,
    deleteFile,
    renameFile,
    moveFile,
    isCreatingFile: createFileMutation.isPending,
    isUpdatingFile: updateFileMutation.isPending,
    isDeletingFile: deleteFileMutation.isPending,
  }
}
