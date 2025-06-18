import React, { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { useSupabaseWorkspaces } from '@/hooks/useSupabaseWorkspaces'
import {
  validateFolderName,
  generateUniqueFolderName,
  WORKSPACE_COLORS,
  FOLDER_ICONS
} from '@/lib/utils/workspace-utils'
import { FolderIcon } from '@/lib/utils/icon-mapping'
import type { Folder as FolderType } from '@/lib/supabase/database.types'

interface FolderSettingsProps {
  isOpen: boolean
  onClose: () => void
  folder: FolderType
  existingFolders?: Array<{ name: string; id: string }>
  onFolderUpdated?: () => void
  onFolderDeleted?: () => void
}

export const FolderSettings: React.FC<FolderSettingsProps> = ({
  isOpen,
  onClose,
  folder,
  existingFolders = [],
  onFolderUpdated,
  onFolderDeleted
}) => {
  const { updateFolder, deleteFolder, isUpdatingFolder, isDeletingFolder } = useSupabaseWorkspaces()
  
  const [name, setName] = useState(folder.name)
  const [description, setDescription] = useState(folder.description || '')
  const [selectedColor, setSelectedColor] = useState(folder.color)
  const [selectedIcon, setSelectedIcon] = useState(folder.icon)
  const [nameError, setNameError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate name
    const validation = validateFolderName(name)
    if (validation) {
      setNameError(validation)
      return
    }

    // Generate unique name if needed (excluding current folder)
    const otherFolders = existingFolders.filter(f => f.id !== folder.id)
    const uniqueName = generateUniqueFolderName(name, otherFolders)
    
    try {
      await updateFolder(folder.id, {
        name: uniqueName,
        description: description || null,
        color: selectedColor,
        icon: selectedIcon
      })
      
      onFolderUpdated?.()
      onClose()
    } catch (error) {
      console.error('Failed to update folder:', error)
      setNameError('Failed to update folder. Please try again.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteFolder(folder.id)
      onFolderDeleted?.()
      setShowDeleteDialog(false)
      onClose()
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  const handleClose = () => {
    setName(folder.name)
    setDescription(folder.description || '')
    setSelectedColor(folder.color)
    setSelectedIcon(folder.icon)
    setNameError(null)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
          <DialogHeader>
            <DialogTitle className="text-[rgb(var(--sidebar-component-user-info-text))] flex items-center gap-2">
              <FolderIcon iconName={selectedIcon} className="w-5 h-5" style={{ color: selectedColor }} />
              Folder Settings
            </DialogTitle>
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
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isUpdatingFolder || isDeletingFolder}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Folder
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isUpdatingFolder || isDeletingFolder}
                  className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || isUpdatingFolder || isDeletingFolder}
                  className="bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text"
                >
                  {isUpdatingFolder ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[rgb(var(--sidebar-component-user-info-text))]">
              Delete Folder
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[rgb(var(--sidebar-component-search-placeholder))]">
              Are you sure you want to delete "{folder.name}"? This action cannot be undone. 
              All chats in this folder will be moved to the workspace root.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeletingFolder}
              className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingFolder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingFolder ? 'Deleting...' : 'Delete Folder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
