"use client"

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseProjects } from "@/hooks/useSupabaseProjects";
import { useSupabaseWorkspaces } from "@/hooks/useSupabaseWorkspaces";
import type { Project } from "@/lib/supabase/database.types";
import { Loader2, FolderPlus, Code, Globe, FileText, Layers, Database } from "lucide-react";

interface ProjectCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWorkspaceId?: string;
  defaultFolderId?: string;
}

const PROJECT_TYPES: Array<{
  value: Project['project_type'];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'general',
    label: 'General',
    description: 'General purpose project for any type of work',
    icon: FolderPlus
  },
  {
    value: 'web',
    label: 'Web Development',
    description: 'HTML, CSS, JavaScript, and web frameworks',
    icon: Globe
  },
  {
    value: 'react',
    label: 'React',
    description: 'React applications and components',
    icon: Layers
  },
  {
    value: 'nodejs',
    label: 'Node.js',
    description: 'Node.js applications and APIs',
    icon: Code
  },
  {
    value: 'python',
    label: 'Python',
    description: 'Python scripts, data science, and applications',
    icon: Database
  },
  {
    value: 'documentation',
    label: 'Documentation',
    description: 'Documentation, notes, and knowledge base',
    icon: FileText
  }
];

export const ProjectCreator: React.FC<ProjectCreatorProps> = ({
  isOpen,
  onClose,
  defaultWorkspaceId,
  defaultFolderId
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<Project['project_type']>('general');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(defaultWorkspaceId || "");
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId || "");

  const { createProject, isCreatingProject } = useSupabaseProjects();
  const { workspaces, workspacesWithFolders } = useSupabaseWorkspaces();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      await createProject(
        name.trim(),
        description.trim() || undefined,
        projectType,
        selectedWorkspaceId || undefined,
        selectedFolderId || undefined
      );
      
      // Reset form
      setName("");
      setDescription("");
      setProjectType('general');
      setSelectedWorkspaceId(defaultWorkspaceId || "");
      setSelectedFolderId(defaultFolderId || "");
      
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleClose = () => {
    if (!isCreatingProject) {
      setName("");
      setDescription("");
      setProjectType('general');
      setSelectedWorkspaceId(defaultWorkspaceId || "");
      setSelectedFolderId(defaultFolderId || "");
      onClose();
    }
  };

  // Get folders for selected workspace
  const selectedWorkspace = workspacesWithFolders.find(w => w.id === selectedWorkspaceId);
  const availableFolders = selectedWorkspace?.folders || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-app-main-background border-app-main-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-medium text-foreground">
              Project Name *
            </Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className="bg-chat-input-form-background border-chat-input-form-border text-chat-input-text"
              disabled={isCreatingProject}
              required
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-sm font-medium text-foreground">
              Description
            </Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              className="bg-chat-input-form-background border-chat-input-form-border text-chat-input-text min-h-[80px] resize-none"
              disabled={isCreatingProject}
            />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="project-type" className="text-sm font-medium text-foreground">
              Project Type
            </Label>
            <Select value={projectType} onValueChange={(value: Project['project_type']) => setProjectType(value)}>
              <SelectTrigger className="bg-chat-input-form-background border-chat-input-form-border text-chat-input-text">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent className="bg-chat-input-form-background border-chat-input-form-border">
                {PROJECT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value} className="text-chat-input-text hover:bg-chat-input-send-button-background/10">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-chat-input-button-text">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Workspace Selection */}
          <div className="space-y-2">
            <Label htmlFor="workspace" className="text-sm font-medium text-foreground">
              Workspace
            </Label>
            <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
              <SelectTrigger className="bg-chat-input-form-background border-chat-input-form-border text-chat-input-text">
                <SelectValue placeholder="Select workspace (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-chat-input-form-background border-chat-input-form-border">
                <SelectItem value="" className="text-chat-input-text hover:bg-chat-input-send-button-background/10">
                  No workspace
                </SelectItem>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id} className="text-chat-input-text hover:bg-chat-input-send-button-background/10">
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Selection */}
          {selectedWorkspaceId && availableFolders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="folder" className="text-sm font-medium text-foreground">
                Folder
              </Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger className="bg-chat-input-form-background border-chat-input-form-border text-chat-input-text">
                  <SelectValue placeholder="Select folder (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-chat-input-form-background border-chat-input-form-border">
                  <SelectItem value="" className="text-chat-input-text hover:bg-chat-input-send-button-background/10">
                    No folder
                  </SelectItem>
                  {availableFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id} className="text-chat-input-text hover:bg-chat-input-send-button-background/10">
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreatingProject}
              className="border-chat-input-form-border text-chat-input-text hover:bg-chat-input-send-button-background/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isCreatingProject}
              className="bg-primary-button-gradient-from hover:bg-primary-button-hover-gradient-from text-primary-button-text border-primary-button-border"
            >
              {isCreatingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
