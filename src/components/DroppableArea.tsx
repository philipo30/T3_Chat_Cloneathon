import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Chat, Folder, Workspace } from '@/lib/supabase/database.types'

interface DroppableAreaProps {
  id: string
  type: 'workspace' | 'folder'
  item?: Workspace | Folder
  children: React.ReactNode
  className?: string
  acceptTypes?: ('chat' | 'folder')[]
}

export const DroppableArea: React.FC<DroppableAreaProps> = ({
  id,
  type,
  item,
  children,
  className = '',
  acceptTypes = ['chat', 'folder'],
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type,
      item,
      acceptTypes,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${
        isOver ? 'bg-[rgb(var(--primary-button-gradient-from))]/10 border-[rgb(var(--primary-button-gradient-from))]/30 border-2 border-dashed rounded-md' : ''
      } transition-all duration-200`}
    >
      {children}
    </div>
  )
}
