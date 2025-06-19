"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSupabaseProjects } from "@/hooks/useSupabaseProjects";
import { useProjectExport } from "@/hooks/useProjectMCP";
import type { Project } from "@/lib/supabase/database.types";
import { 
  MoreHorizontal, 
  Edit, 
  Archive, 
  Trash2, 
  Download, 
  Settings,
  FolderOpen,
  Code,
  Globe,
  FileText,
  Layers,
  Database,
  Unarchive
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectItemProps {
  project: Project;
  onProjectClick: (projectId: string) => void;
  isActive?: boolean;
}

const PROJECT_TYPE_ICONS = {
  general: FolderOpen,
  web: Globe,
  react: Layers,
  nodejs: Code,
  python: Database,
  documentation: FileText
};

export const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  onProjectClick,
  isActive = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { updateProject, deleteProject, archiveProject, isUpdatingProject, isDeletingProject, isArchivingProject } = useSupabaseProjects();
  const { exportProject, isExporting } = useProjectExport(project.id);

  const Icon = PROJECT_TYPE_ICONS[project.project_type] || FolderOpen;

  const handleClick = () => {
    onProjectClick(project.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Open edit modal
    console.log('Edit project:', project.id);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (project.is_archived) {
        await updateProject(project.id, { is_archived: false });
      } else {
        await archiveProject(project.id);
      }
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await deleteProject(project.id);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await exportProject('full');
    } catch (error) {
      console.error('Error exporting project:', error);
    }
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Navigate to project settings
    console.log('Project settings:', project.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isLoading = isUpdatingProject || isDeletingProject || isArchivingProject || isExporting;

  return (
    <div
      className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-primary-button-gradient-from/10 border border-primary-button-border/20'
          : 'hover:bg-chat-input-send-button-background/5 border border-transparent'
      } ${project.is_archived ? 'opacity-60' : ''}`}
      onClick={handleClick}
    >
      {/* Project Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isActive 
          ? 'bg-primary-button-gradient-from text-primary-button-text' 
          : 'bg-chat-input-form-background text-chat-input-button-text'
      }`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Project Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium text-sm truncate ${
            isActive ? 'text-primary-button-gradient-from' : 'text-chat-input-text'
          }`}>
            {project.name}
          </h3>
          {project.is_archived && (
            <Archive className="w-3 h-3 text-chat-input-button-text flex-shrink-0" />
          )}
        </div>
        
        {project.description && (
          <p className="text-xs text-chat-input-button-text truncate mt-0.5">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mt-1 text-xs text-chat-input-button-text">
          <span>{project.file_count} files</span>
          <span>{formatFileSize(project.total_size_bytes)}</span>
          <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Actions Menu */}
      <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ${
              showDropdown ? 'opacity-100' : ''
            } text-chat-input-button-text hover:text-chat-input-text hover:bg-chat-input-send-button-background/10`}
            onClick={(e) => e.stopPropagation()}
            disabled={isLoading}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-chat-input-form-background border-chat-input-form-border"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem 
            onClick={handleEdit}
            className="text-chat-input-text hover:bg-chat-input-send-button-background/10"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Project
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSettings}
            className="text-chat-input-text hover:bg-chat-input-send-button-background/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-chat-input-form-border" />
          
          <DropdownMenuItem 
            onClick={handleExport}
            disabled={isExporting}
            className="text-chat-input-text hover:bg-chat-input-send-button-background/10"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Project'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-chat-input-form-border" />
          
          <DropdownMenuItem 
            onClick={handleArchive}
            disabled={isArchivingProject}
            className="text-chat-input-text hover:bg-chat-input-send-button-background/10"
          >
            {project.is_archived ? (
              <>
                <Unarchive className="w-4 h-4 mr-2" />
                {isArchivingProject ? 'Unarchiving...' : 'Unarchive'}
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                {isArchivingProject ? 'Archiving...' : 'Archive'}
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleDelete}
            disabled={isDeletingProject}
            className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeletingProject ? 'Deleting...' : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-chat-input-form-background/50 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary-button-gradient-from border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
