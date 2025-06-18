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
  validateFolderName,
  generateUniqueFolderName,
  WORKSPACE_COLORS,
  FOLDER_ICONS
} from '@/lib/utils/workspace-utils'
import { FolderIcon } from '@/lib/utils/icon-mapping'
import type { Workspace } from '@/lib/supabase/database.types'

interface FolderCreatorProps {
  isOpen: boolean
  onClose: () => void
  workspace: Workspace
  existingFolders?: Array<{ name: string }>
  onFolderCreated?: (folderId: string) => void
}

export const FolderCreator: React.FC<FolderCreatorProps> = ({
  isOpen,
  onClose,
  workspace,
  existingFolders = [],
  onFolderCreated
}) => {
  const { createFolder, isCreatingFolder } = useSupabaseWorkspaces()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(workspace.color)
  const [selectedIcon, setSelectedIcon] = useState<string>(FOLDER_ICONS[0])
  const [nameError, setNameError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate name
    const validation = validateFolderName(name)
    if (validation) {
      setNameError(validation)
      return
    }

    // Generate unique name if needed
    const uniqueName = generateUniqueFolderName(name, existingFolders)
    
    try {
      const newFolder = await createFolder(
        workspace.id,
        uniqueName,
        description || undefined,
        selectedColor,
        selectedIcon
      )
      
      // Reset form
      setName('')
      setDescription('')
      setSelectedColor(workspace.color)
      setSelectedIcon(FOLDER_ICONS[0])
      setNameError(null)
      
      // Show success toast
      toast.success(`Folder "${uniqueName}" created successfully!`)

      // Notify parent and close
      onFolderCreated?.(newFolder.id)
      onClose()
    } catch (error) {
      console.error('Failed to create folder:', error)
      setNameError('Failed to create folder. Please try again.')
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setSelectedColor(workspace.color)
    setSelectedIcon(FOLDER_ICONS[0])
    setNameError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
        <DialogHeader>
          <DialogTitle className="text-[rgb(var(--sidebar-component-user-info-text))] flex items-center gap-2">
            <FolderIcon iconName={selectedIcon} className="w-5 h-5" style={{ color: selectedColor }} />
            Create New Folder
          </DialogTitle>
          <p className="text-sm text-[rgb(var(--sidebar-component-search-placeholder))]">
            in {workspace.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--sidebar-component-user-info-text))]">
              Folder Name *
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              placeholder="Enter folder name..."
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
              placeholder="Describe this folder..."
              className="bg-[rgb(var(--sidebar-component-button-hover-background))] border-[rgb(var(--sidebar-component-search-border))] text-[rgb(var(--sidebar-component-user-info-text))] resize-none"
              rows={2}
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
                    w-6 h-6 rounded-full border-2 transition-all duration-150
                    ${selectedColor === color 
                      ? 'border-white scale-110' 
                      : 'border-transparent hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check className="w-3 h-3 text-white mx-auto" />
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
              {FOLDER_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    w-8 h-8 rounded-md border transition-all duration-150 flex items-center justify-center
                    ${selectedIcon === icon 
                      ? 'border-[rgb(var(--primary-button-gradient-from))] bg-[rgb(var(--sidebar-component-button-hover-background))]' 
                      : 'border-[rgb(var(--sidebar-component-search-border))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]'
                    }
                  `}
                  title={icon}
                >
                  <FolderIcon iconName={icon} className="w-4 h-4" style={{ color: selectedColor }} />
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
              disabled={isCreatingFolder}
              className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isCreatingFolder}
              className="bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text"
            >
              {isCreatingFolder ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
