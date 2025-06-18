import React, { useState } from 'react'
import { Check, Trash2, Edit, Star, StarOff, GripVertical } from 'lucide-react'
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
  validateWorkspaceName, 
  generateUniqueWorkspaceName,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS 
} from '@/lib/utils/workspace-utils'
import { WorkspaceIcon } from '@/lib/utils/icon-mapping'
import type { Workspace } from '@/lib/supabase/database.types'
import { toast } from 'sonner'

interface WorkspaceManagerProps {
  isOpen: boolean
  onClose: () => void
  selectedWorkspaceId?: string | null
  onWorkspaceSelect?: (workspace: Workspace) => void
}

interface EditingWorkspace {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  isOpen,
  onClose,
  selectedWorkspaceId,
  onWorkspaceSelect
}) => {
  const { 
    workspaces, 
    updateWorkspace, 
    deleteWorkspace, 
    setDefaultWorkspace,
    isUpdatingWorkspace, 
    isDeletingWorkspace 
  } = useSupabaseWorkspaces()
  
  const [editingWorkspace, setEditingWorkspace] = useState<EditingWorkspace | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleEditWorkspace = (workspace: Workspace) => {
    setEditingWorkspace({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || '',
      color: workspace.color,
      icon: workspace.icon
    })
    setNameError(null)
  }

  const handleSaveWorkspace = async () => {
    if (!editingWorkspace) return

    // Validate name
    const validation = validateWorkspaceName(editingWorkspace.name)
    if (validation) {
      setNameError(validation)
      return
    }

    // Generate unique name if needed (excluding current workspace)
    const otherWorkspaces = workspaces.filter(w => w.id !== editingWorkspace.id)
    const uniqueName = generateUniqueWorkspaceName(editingWorkspace.name, otherWorkspaces)
    
    try {
      await updateWorkspace(editingWorkspace.id, {
        name: uniqueName,
        description: editingWorkspace.description || null,
        color: editingWorkspace.color,
        icon: editingWorkspace.icon
      })
      
      setEditingWorkspace(null)
      setNameError(null)
      toast.success(`Workspace "${uniqueName}" updated successfully!`)
    } catch (error) {
      console.error('Failed to update workspace:', error)
      setNameError('Failed to update workspace. Please try again.')
      toast.error('Failed to update workspace')
    }
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      await deleteWorkspace(workspaceId)
      setShowDeleteDialog(null)
      toast.success('Workspace deleted successfully!')
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      toast.error('Failed to delete workspace')
    }
  }

  const handleSetDefault = async (workspaceId: string) => {
    try {
      await setDefaultWorkspace(workspaceId)
      toast.success('Default workspace updated!')
    } catch (error) {
      console.error('Failed to set default workspace:', error)
      toast.error('Failed to set default workspace')
    }
  }

  const handleClose = () => {
    setEditingWorkspace(null)
    setNameError(null)
    setShowDeleteDialog(null)
    onClose()
  }

  const workspaceToDelete = showDeleteDialog ? workspaces.find(w => w.id === showDeleteDialog) : null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[rgb(var(--sidebar-component-user-info-text))] flex items-center gap-2">
              <WorkspaceIcon iconName="briefcase" className="w-5 h-5" />
              Manage Workspaces
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Workspace List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {workspaces.map((workspace) => (
                <WorkspaceItem
                  key={workspace.id}
                  workspace={workspace}
                  isSelected={selectedWorkspaceId === workspace.id}
                  isEditing={editingWorkspace?.id === workspace.id}
                  editingData={editingWorkspace}
                  onEdit={() => handleEditWorkspace(workspace)}
                  onSave={handleSaveWorkspace}
                  onCancel={() => setEditingWorkspace(null)}
                  onDelete={() => setShowDeleteDialog(workspace.id)}
                  onSetDefault={() => handleSetDefault(workspace.id)}
                  onSelect={() => onWorkspaceSelect?.(workspace)}
                  onEditChange={setEditingWorkspace}
                  nameError={nameError}
                  isLoading={isUpdatingWorkspace || isDeletingWorkspace}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[rgb(var(--sidebar-component-search-border))]">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent className="bg-[rgb(var(--sidebar-component-hidden-background))] border-[rgb(var(--sidebar-component-search-border))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[rgb(var(--sidebar-component-user-info-text))]">
              Delete Workspace
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[rgb(var(--sidebar-component-search-placeholder))]">
              Are you sure you want to delete "{workspaceToDelete?.name}"? This action cannot be undone. 
              All folders and chats in this workspace will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeletingWorkspace}
              className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteWorkspace(showDeleteDialog)}
              disabled={isDeletingWorkspace}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingWorkspace ? 'Deleting...' : 'Delete Workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Individual workspace item component
interface WorkspaceItemProps {
  workspace: Workspace
  isSelected: boolean
  isEditing: boolean
  editingData: EditingWorkspace | null
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onSetDefault: () => void
  onSelect: () => void
  onEditChange: (data: EditingWorkspace | null) => void
  nameError: string | null
  isLoading: boolean
}

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  workspace,
  isSelected,
  isEditing,
  editingData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onSetDefault,
  onSelect,
  onEditChange,
  nameError,
  isLoading
}) => {
  if (isEditing && editingData) {
    return (
      <div className="p-4 rounded-lg border border-[rgb(var(--sidebar-component-search-border))] bg-[rgb(var(--sidebar-component-button-hover-background))]">
        <div className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--sidebar-component-user-info-text))]">
              Workspace Name *
            </label>
            <Input
              value={editingData.name}
              onChange={(e) => onEditChange({ ...editingData, name: e.target.value })}
              placeholder="Enter workspace name..."
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
              value={editingData.description}
              onChange={(e) => onEditChange({ ...editingData, description: e.target.value })}
              placeholder="Describe this workspace..."
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
                  onClick={() => onEditChange({ ...editingData, color })}
                  className={`
                    w-6 h-6 rounded-full border-2 transition-all duration-150
                    ${editingData.color === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {editingData.color === color && (
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
              {WORKSPACE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => onEditChange({ ...editingData, icon })}
                  className={`
                    w-8 h-8 rounded-md border transition-all duration-150 flex items-center justify-center
                    ${editingData.icon === icon
                      ? 'border-[rgb(var(--primary-button-gradient-from))] bg-[rgb(var(--sidebar-component-button-hover-background))]'
                      : 'border-[rgb(var(--sidebar-component-search-border))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]'
                    }
                  `}
                  title={icon}
                >
                  <WorkspaceIcon iconName={icon} className="w-4 h-4" style={{ color: editingData.color }} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
              className="text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!editingData.name.trim() || isLoading}
              className="bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`
      p-4 rounded-lg border transition-all duration-200 group
      ${isSelected
        ? 'border-[rgb(var(--primary-button-gradient-from))] bg-[rgb(var(--sidebar-component-button-hover-background))]'
        : 'border-[rgb(var(--sidebar-component-search-border))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]'
      }
    `}>
      <div className="flex items-center gap-3">
        {/* Workspace Icon and Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <WorkspaceIcon
            iconName={workspace.icon}
            className="w-6 h-6 flex-shrink-0"
            style={{ color: workspace.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[rgb(var(--sidebar-component-user-info-text))] truncate">
                {workspace.name}
              </h3>
              {workspace.is_default && (
                <span className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--primary-button-gradient-from))] text-white">
                  Default
                </span>
              )}
              {isSelected && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">
                  Current
                </span>
              )}
            </div>
            {workspace.description && (
              <p className="text-sm text-[rgb(var(--sidebar-component-search-placeholder))] truncate">
                {workspace.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelect}
            className="w-8 h-8 p-0 text-[rgb(var(--sidebar-component-search-placeholder))] hover:text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            title="Select workspace"
          >
            <Check className="w-4 h-4" />
          </Button>

          {!workspace.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetDefault}
              className="w-8 h-8 p-0 text-[rgb(var(--sidebar-component-search-placeholder))] hover:text-yellow-500 hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
              title="Set as default"
            >
              <Star className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={isLoading}
            className="w-8 h-8 p-0 text-[rgb(var(--sidebar-component-search-placeholder))] hover:text-[rgb(var(--sidebar-component-user-info-text))] hover:bg-[rgb(var(--sidebar-component-button-hover-background))]"
            title="Edit workspace"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isLoading || workspace.is_default}
            className="w-8 h-8 p-0 text-[rgb(var(--sidebar-component-search-placeholder))] hover:text-red-400 hover:bg-[rgb(var(--sidebar-component-button-hover-background))] disabled:opacity-50"
            title={workspace.is_default ? "Cannot delete default workspace" : "Delete workspace"}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
