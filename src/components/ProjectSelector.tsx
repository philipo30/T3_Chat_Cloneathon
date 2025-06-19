"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseProjects } from "@/hooks/useSupabaseProjects";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, FolderOpen, Plus, Settings, Archive } from "lucide-react";
import { ProjectCreator } from "./ProjectCreator";
import type { Project } from "@/lib/supabase/database.types";

interface ProjectSelectorProps {
  className?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ className = "" }) => {
  const [showProjectCreator, setShowProjectCreator] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'chat' | 'project'>('chat');
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { projects, isLoadingProjects } = useSupabaseProjects();
  const router = useRouter();
  const pathname = usePathname();

  // Determine current mode based on pathname
  React.useEffect(() => {
    if (pathname?.startsWith('/project/')) {
      setSelectedMode('project');
      const projectId = pathname.split('/')[2];
      if (projectId) {
        setSelectedProjectId(projectId);
      }
    } else {
      setSelectedMode('chat');
      setSelectedProjectId("");
    }
  }, [pathname]);

  const handleModeChange = (mode: 'chat' | 'project') => {
    setSelectedMode(mode);
    
    if (mode === 'chat') {
      setSelectedProjectId("");
      router.push('/');
    } else if (mode === 'project' && projects.length > 0) {
      // If switching to project mode and no project selected, select the first one
      if (!selectedProjectId) {
        const firstProject = projects[0];
        setSelectedProjectId(firstProject.id);
        router.push(`/project/${firstProject.id}`);
      }
    }
  };

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'new') {
      setShowProjectCreator(true);
      return;
    }
    
    setSelectedProjectId(projectId);
    router.push(`/project/${projectId}`);
  };

  const handleNewProject = () => {
    setShowProjectCreator(true);
  };

  const formatProjectName = (project: Project) => {
    const typeEmoji = {
      general: '📁',
      web: '🌐',
      react: '⚛️',
      nodejs: '🟢',
      python: '🐍',
      documentation: '📚'
    };
    
    return `${typeEmoji[project.project_type] || '📁'} ${project.name}`;
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Mode Toggle */}
        <div className="flex items-center bg-chat-input-form-background border border-chat-input-form-border rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange('chat')}
            className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              selectedMode === 'chat'
                ? 'bg-primary-button-gradient-from text-primary-button-text shadow-sm'
                : 'text-chat-input-button-text hover:text-chat-input-text hover:bg-chat-input-send-button-background/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Chat
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange('project')}
            className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              selectedMode === 'project'
                ? 'bg-primary-button-gradient-from text-primary-button-text shadow-sm'
                : 'text-chat-input-button-text hover:text-chat-input-text hover:bg-chat-input-send-button-background/10'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
            Project
          </Button>
        </div>

        {/* Project Selector */}
        {selectedMode === 'project' && (
          <div className="flex items-center gap-2 flex-1">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="bg-chat-input-form-background border-chat-input-form-border text-chat-input-text min-w-[200px]">
                <SelectValue placeholder={isLoadingProjects ? "Loading..." : "Select project"} />
              </SelectTrigger>
              <SelectContent className="bg-chat-input-form-background border-chat-input-form-border">
                {projects.length === 0 && !isLoadingProjects ? (
                  <SelectItem value="empty" disabled className="text-chat-input-button-text">
                    No projects yet
                  </SelectItem>
                ) : (
                  <>
                    {projects.map((project) => (
                      <SelectItem 
                        key={project.id} 
                        value={project.id} 
                        className="text-chat-input-text hover:bg-chat-input-send-button-background/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{formatProjectName(project)}</span>
                          {project.is_archived && (
                            <Archive className="w-3 h-3 text-chat-input-button-text ml-2" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem 
                      value="new" 
                      className="text-primary-button-gradient-from hover:bg-primary-button-gradient-from/10 border-t border-chat-input-form-border"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Create New Project
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewProject}
                className="p-2 text-chat-input-button-text hover:text-chat-input-text hover:bg-chat-input-send-button-background/10"
                title="Create new project"
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              {selectedProjectId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/project/${selectedProjectId}/settings`)}
                  className="p-2 text-chat-input-button-text hover:text-chat-input-text hover:bg-chat-input-send-button-background/10"
                  title="Project settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project Creator Modal */}
      <ProjectCreator
        isOpen={showProjectCreator}
        onClose={() => setShowProjectCreator(false)}
      />
    </>
  );
};
