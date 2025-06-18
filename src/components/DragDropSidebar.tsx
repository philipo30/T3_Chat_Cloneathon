import React, { useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useChatOrganization } from '@/hooks/useChatOrganization'
import { Chat, Folder, WorkspaceWithFoldersAndChats } from '@/lib/supabase/database.types'

interface DragDropSidebarProps {
  children: React.ReactNode
  workspace: WorkspaceWithFoldersAndChats | null
  onChatClick: (chatId: string) => void
  onPinToggle: (chat: Chat, event: React.MouseEvent) => void
  onDeleteChat: (chatId: string, event: React.MouseEvent) => void
}

interface DragData {
  type: 'chat' | 'folder'
  id: string
  item: Chat | Folder
  sourceContainer?: {
    type: 'workspace' | 'folder'
    id: string
  }
}

interface DropData {
  type: 'workspace' | 'folder' | 'chat'
  id: string
  item?: Chat | Folder | WorkspaceWithFoldersAndChats
  acceptTypes?: ('chat' | 'folder')[]
}

export const DragDropSidebar: React.FC<DragDropSidebarProps> = ({
  children,
  workspace,
  onChatClick,
  onPinToggle,
  onDeleteChat,
}) => {
  const { moveChatToFolder, moveChatToWorkspace, moveFolderToWorkspace } = useChatOrganization()

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)
  const [activeDragData, setActiveDragData] = React.useState<DragData | null>(null)

  // Get all draggable items (chats and folders)
  const getDraggableItems = useCallback(() => {
    if (!workspace) return []
    
    const items: UniqueIdentifier[] = []
    
    // Add folders
    workspace.folders?.forEach(folder => {
      items.push(`folder-${folder.id}`)
      // Add chats in folders
      folder.chats?.forEach(chat => {
        items.push(`chat-${chat.id}`)
      })
    })
    
    // Add workspace direct chats
    workspace.chats?.forEach(chat => {
      items.push(`chat-${chat.id}`)
    })
    
    return items
  }, [workspace])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)
    
    // Extract drag data from the active element
    const dragData = active.data.current as DragData
    setActiveDragData(dragData)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over logic if needed for visual feedback
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setActiveDragData(null)

    if (!over || !workspace) return

    const activeData = active.data.current as DragData
    const overData = over.data.current as DropData

    if (!activeData || active.id === over.id) return

    try {
      // Handle different drag scenarios
      if (activeData.type === 'chat') {
        const chat = activeData.item as Chat

        if (overData?.type === 'folder') {
          // Drop chat into folder
          const targetFolder = overData.item as Folder
          await moveChatToFolder(chat.id, targetFolder.id, targetFolder.workspace_id)
        } else if (overData?.type === 'workspace' || over.id === 'workspace-root' || over.id === 'workspace-chats' || over.id === 'workspace-folders' || String(over.id).startsWith('group-')) {
          // Drop chat into workspace root (including time-based groups)
          await moveChatToWorkspace(chat.id, workspace.id)
        } else if (overData?.type === 'chat') {
          // Reorder chats or move to different container
          const targetChat = overData.item as Chat

          if (targetChat.folder_id && targetChat.folder_id !== chat.folder_id) {
            // Target chat is in a different folder, move active chat to same folder
            await moveChatToFolder(chat.id, targetChat.folder_id, targetChat.workspace_id!)
          } else if (!targetChat.folder_id && chat.folder_id) {
            // Target chat is in workspace root, move active chat to workspace root
            await moveChatToWorkspace(chat.id, targetChat.workspace_id!)
          }
          // If both chats are in the same container (folder or workspace), this is just reordering
          // The visual reordering will be handled by the UI, no database change needed for simple reordering
        }
      } else if (activeData.type === 'folder') {
        const folder = activeData.item as Folder

        if (overData?.type === 'workspace' || over.id === 'workspace-root' || over.id === 'workspace-folders') {
          // Move folder to workspace (already in workspace, but could be reordering)
          await moveFolderToWorkspace(folder.id, workspace.id)
        }
      }
    } catch (error) {
      console.error('Drag and drop operation failed:', error)
    }
  }, [workspace, moveChatToFolder, moveChatToWorkspace, moveFolderToWorkspace])

  const draggableItems = getDraggableItems()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={draggableItems} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      
      <DragOverlay>
        {activeId && activeDragData ? (
          <div className="bg-[rgb(var(--sidebar-component-button-hover-background))] p-2 rounded-md shadow-lg border border-[rgb(var(--sidebar-component-search-border))] opacity-90">
            {activeDragData.type === 'chat' ? (
              <div className="flex items-center gap-2 text-[rgb(var(--sidebar-component-user-info-text))]">
                <span className="truncate">{(activeDragData.item as Chat).title}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[rgb(var(--sidebar-component-user-info-text))]">
                <span className="truncate">{(activeDragData.item as Folder).name}</span>
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
