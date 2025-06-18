import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Chat, Folder } from '@/lib/supabase/database.types'

interface DraggableItemProps {
  id: string
  type: 'chat' | 'folder'
  item: Chat | Folder
  children: React.ReactNode
  disabled?: boolean
  sourceContainer?: {
    type: 'workspace' | 'folder'
    id: string
  }
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  type,
  item,
  children,
  disabled = false,
  sourceContainer,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type,
      item,
      sourceContainer,
    },
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      {children}
    </div>
  )
}
