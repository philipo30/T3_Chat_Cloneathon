"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Project } from '@/lib/supabase/database.types';

interface ProjectContextType {
  // Current project state
  currentProjectId: string | null;
  currentProject: Project | null;
  isProjectMode: boolean;
  
  // Project mode management
  setCurrentProjectId: (projectId: string | null) => void;
  setCurrentProject: (project: Project | null) => void;
  enterProjectMode: (projectId: string) => void;
  exitProjectMode: () => void;
  
  // UI state
  isProjectSidebarCollapsed: boolean;
  setProjectSidebarCollapsed: (collapsed: boolean) => void;
  projectPaneWidth: number;
  setProjectPaneWidth: (width: number) => void;
  
  // File management state
  selectedFileId: string | null;
  setSelectedFileId: (fileId: string | null) => void;
  openFiles: string[];
  addOpenFile: (fileId: string) => void;
  removeOpenFile: (fileId: string) => void;
  clearOpenFiles: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [isProjectSidebarCollapsed, setProjectSidebarCollapsed] = useState(false);
  const [projectPaneWidth, setProjectPaneWidth] = useState(400); // Default width for project pane
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  const pathname = usePathname();

  // Update project mode based on pathname
  useEffect(() => {
    if (pathname?.startsWith('/project/')) {
      const projectId = pathname.split('/')[2];
      if (projectId && projectId !== currentProjectId) {
        setCurrentProjectId(projectId);
        setIsProjectMode(true);
      }
    } else {
      if (isProjectMode) {
        setIsProjectMode(false);
        setCurrentProjectId(null);
        setCurrentProject(null);
        setSelectedFileId(null);
        setOpenFiles([]);
      }
    }
  }, [pathname, currentProjectId, isProjectMode]);

  // Load project pane width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('project-pane-width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= 300 && width <= 800) {
        setProjectPaneWidth(width);
      }
    }
  }, []);

  // Save project pane width to localStorage
  useEffect(() => {
    localStorage.setItem('project-pane-width', projectPaneWidth.toString());
  }, [projectPaneWidth]);

  const enterProjectMode = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsProjectMode(true);
  };

  const exitProjectMode = () => {
    setIsProjectMode(false);
    setCurrentProjectId(null);
    setCurrentProject(null);
    setSelectedFileId(null);
    setOpenFiles([]);
  };

  const addOpenFile = (fileId: string) => {
    setOpenFiles(prev => {
      if (!prev.includes(fileId)) {
        return [...prev, fileId];
      }
      return prev;
    });
  };

  const removeOpenFile = (fileId: string) => {
    setOpenFiles(prev => prev.filter(id => id !== fileId));
    
    // If the removed file was selected, select another open file or clear selection
    if (selectedFileId === fileId) {
      const remainingFiles = openFiles.filter(id => id !== fileId);
      if (remainingFiles.length > 0) {
        setSelectedFileId(remainingFiles[remainingFiles.length - 1]);
      } else {
        setSelectedFileId(null);
      }
    }
  };

  const clearOpenFiles = () => {
    setOpenFiles([]);
    setSelectedFileId(null);
  };

  const value: ProjectContextType = {
    // Current project state
    currentProjectId,
    currentProject,
    isProjectMode,
    
    // Project mode management
    setCurrentProjectId,
    setCurrentProject,
    enterProjectMode,
    exitProjectMode,
    
    // UI state
    isProjectSidebarCollapsed,
    setProjectSidebarCollapsed,
    projectPaneWidth,
    setProjectPaneWidth,
    
    // File management state
    selectedFileId,
    setSelectedFileId,
    openFiles,
    addOpenFile,
    removeOpenFile,
    clearOpenFiles,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

// Hook for checking if we're in project mode
export const useIsProjectMode = (): boolean => {
  const { isProjectMode } = useProjectContext();
  return isProjectMode;
};

// Hook for getting current project info
export const useCurrentProject = (): {
  projectId: string | null;
  project: Project | null;
  isProjectMode: boolean;
} => {
  const { currentProjectId, currentProject, isProjectMode } = useProjectContext();
  return {
    projectId: currentProjectId,
    project: currentProject,
    isProjectMode,
  };
};

// Hook for file management
export const useProjectFiles = (): {
  selectedFileId: string | null;
  openFiles: string[];
  selectFile: (fileId: string) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
} => {
  const {
    selectedFileId,
    openFiles,
    setSelectedFileId,
    addOpenFile,
    removeOpenFile,
    clearOpenFiles,
  } = useProjectContext();

  const selectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    addOpenFile(fileId);
  };

  const openFile = (fileId: string) => {
    addOpenFile(fileId);
    setSelectedFileId(fileId);
  };

  const closeFile = (fileId: string) => {
    removeOpenFile(fileId);
  };

  const closeAllFiles = () => {
    clearOpenFiles();
  };

  return {
    selectedFileId,
    openFiles,
    selectFile,
    openFile,
    closeFile,
    closeAllFiles,
  };
};
