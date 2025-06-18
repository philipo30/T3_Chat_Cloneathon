import { useState, useCallback } from 'react'
import type { Chat, Folder, Workspace } from '@/lib/supabase/database.types'

export interface DragData {
  type: 'chat' | 'folder'
  id: string
  sourceWorkspaceId?: string
  sourceFolderId?: string | null
  data: Chat | Folder
}

export interface DropTarget {
  type: 'workspace' | 'folder'
  id: string
  workspaceId: string
}

export function useDragAndDrop() {
  const [dragData, setDragData] = useState<DragData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  const startDrag = useCallback((data: DragData) => {
    setDragData(data)
    setIsDragging(true)
  }, [])

  const endDrag = useCallback(() => {
    setDragData(null)
    setIsDragging(false)
    setDragOverTarget(null)
  }, [])

  const setDragOver = useCallback((targetId: string | null) => {
    setDragOverTarget(targetId)
  }, [])

  // Check if a drop is valid
  const canDrop = useCallback((target: DropTarget): boolean => {
    if (!dragData) return false

    // Can't drop on itself
    if (dragData.id === target.id) return false

    if (dragData.type === 'chat') {
      // Chat can be dropped on any folder or workspace
      if (target.type === 'folder') {
        // Can't drop chat in the same folder it's already in
        return dragData.sourceFolderId !== target.id
      }
      if (target.type === 'workspace') {
        // Can't drop chat in the same workspace if it's not in a folder
        return !(dragData.sourceWorkspaceId === target.workspaceId && !dragData.sourceFolderId)
      }
    }

    if (dragData.type === 'folder') {
      // Folder can only be dropped on workspaces (not other folders)
      if (target.type === 'workspace') {
        // Can't drop folder in the same workspace it's already in
        return dragData.sourceWorkspaceId !== target.workspaceId
      }
      return false
    }

    return false
  }, [dragData])

  // Get drag handlers for draggable elements
  const getDragHandlers = useCallback((data: DragData) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/json', JSON.stringify(data))
      startDrag(data)
    },
    onDragEnd: () => {
      endDrag()
    }
  }), [startDrag, endDrag])

  // Get drop handlers for drop targets
  const getDropHandlers = useCallback((target: DropTarget, onDrop: (dragData: DragData, target: DropTarget) => void) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      if (canDrop(target)) {
        e.dataTransfer.dropEffect = 'move'
        setDragOver(target.id)
      } else {
        e.dataTransfer.dropEffect = 'none'
      }
    },
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      if (canDrop(target)) {
        setDragOver(target.id)
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      // Only clear drag over if we're actually leaving the element
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragOver(null)
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(null)
      
      if (!canDrop(target)) return

      try {
        const droppedData = JSON.parse(e.dataTransfer.getData('application/json')) as DragData
        onDrop(droppedData, target)
      } catch (error) {
        console.error('Failed to parse drop data:', error)
      }
      
      endDrag()
    }
  }), [canDrop, setDragOver, endDrag])

  return {
    dragData,
    isDragging,
    dragOverTarget,
    startDrag,
    endDrag,
    setDragOver,
    canDrop,
    getDragHandlers,
    getDropHandlers
  }
}
