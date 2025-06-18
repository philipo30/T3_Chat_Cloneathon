import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { useSupabaseWorkspaces } from '@/hooks/useSupabaseWorkspaces'
import {
  validateWorkspaceName,
  generateUniqueWorkspaceName,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS
} from '@/lib/utils/workspace-utils'
import { WorkspaceIcon } from '@/lib/utils/icon-mapping'

interface WorkspaceCreatorProps {
  isOpen: boolean
  onClose: () => void
  onWorkspaceCreated?: (workspaceId: string) => void
}

export const WorkspaceCreator: React.FC<WorkspaceCreatorProps> = ({
  isOpen,
  onClose,
  onWorkspaceCreated
}) => {
  const { workspaces, createWorkspace, isCreatingWorkspace } = useSupabaseWorkspaces()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>(WORKSPACE_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState<string>(WORKSPACE_ICONS[0])
  const [nameError, setNameError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate name
    const validation = validateWorkspaceName(name)
    if (validation) {
      setNameError(validation)
      return
    }

    // Generate unique name if needed
    const uniqueName = generateUniqueWorkspaceName(name, workspaces)
    
    try {
      const newWorkspace = await createWorkspace(
        uniqueName,
        description || undefined,
        selectedColor,
        selectedIcon
      )
      
      // Reset form
      setName('')
      setDescription('')
      setSelectedColor(WORKSPACE_COLORS[0])
      setSelectedIcon(WORKSPACE_ICONS[0])
      setNameError(null)
      
      // Show success toast
      toast.success(`Workspace "${uniqueName}" created successfully!`)

      // Notify parent and close
      onWorkspaceCreated?.(newWorkspace.id)
      onClose()
    } catch (error) {
      console.error('Failed to create workspace:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace. Please try again.'
      setNameError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setSelectedColor(WORKSPACE_COLORS[0])
    setSelectedIcon(WORKSPACE_ICONS[0])
    setNameError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
        <DialogHeader>
          <DialogTitle className="text-[rgb(var(--sidebar-component-user-info-text))] flex items-center gap-2">
            <WorkspaceIcon iconName={selectedIcon} className="w-5 h-5" style={{ color: selectedColor }} />
            Create New Workspace
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--sidebar-component-user-info-text))]">
              Workspace Name *
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              placeholder="Enter workspace name..."
              className="bg-[rgb(var(--sidebar-component-button-hover-background))] border-[rgb(var(--sidebar-component-search-border))] text-[rgb(var(--sidebar-component-user-info-text))]"
              autoFocus
            />
            {nameError && (
              <p className="text-sm text-red-400">{nameError}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--sidebar-component-user-info-text))]">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this workspace..."
              className="bg-[rgb(var(--sidebar-component-button-hover-background))] border-[rgb(var(--sidebar-component-search-border))] text-[rgb(var(--sidebar-component-user-info-text))] resize-none"
              rows={3}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--sidebar-component-user-info-text))]">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-150
                    ${selectedColor === color 
                      ? 'border-white scale-110' 
                      : 'border-transparent hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check className="w-4 h-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--sidebar-component-user-info-text))]">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    w-10 h-10 rounded-md border transition-all duration-150 flex items-center justify-center
                    ${selectedIcon === icon 
                      ? 'border-[rgb(var(--primary-button-gradient-from))] bg-[rgb(var(--sidebar-component-button-hover-background))]' 
                      : 'border-[rgb(var(--sidebar-component-search-border))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]'
                    }
                  `}
                  title={icon}
                >
                  <WorkspaceIcon iconName={icon} className="w-5 h-5" style={{ color: selectedColor }} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isCreatingWorkspace}
              className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isCreatingWorkspace}
              className="bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text"
            >
              {isCreatingWorkspace ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
