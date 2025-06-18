import React from 'react'
import { DragDropSidebar } from './DragDropSidebar'
import { DraggableItem } from './DraggableItem'
import { DroppableArea } from './DroppableArea'

// Simple test component to verify drag-and-drop functionality
export const DragDropTest: React.FC = () => {
  const mockWorkspace = {
    id: 'test-workspace',
    name: 'Test Workspace',
    folders: [
      {
        id: 'folder-1',
        name: 'Test Folder',
        color: '#8B5CF6',
        workspace_id: 'test-workspace',
        chats: [
          {
            id: 'chat-1',
            title: 'Test Chat 1',
            folder_id: 'folder-1',
            workspace_id: 'test-workspace',
            pinned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]
      }
    ],
    chats: [
      {
        id: 'chat-2',
        title: 'Test Chat 2',
        folder_id: null,
        workspace_id: 'test-workspace',
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Drag and Drop Test</h2>
      <DragDropSidebar
        workspace={mockWorkspace as any}
        onChatClick={(chatId) => console.log('Chat clicked:', chatId)}
        onPinToggle={(chat) => console.log('Pin toggled:', chat.title)}
        onDeleteChat={(chatId) => console.log('Chat deleted:', chatId)}
      >
        <div className="space-y-4">
          {/* Folders */}
          <DroppableArea
            id="workspace-folders"
            type="workspace"
            item={mockWorkspace}
            acceptTypes={['folder']}
            className="space-y-2"
          >
            <h3 className="text-sm font-medium">Folders</h3>
            {mockWorkspace.folders.map(folder => (
              <DraggableItem
                key={folder.id}
                id={`folder-${folder.id}`}
                type="folder"
                item={folder}
                sourceContainer={{ type: 'workspace', id: mockWorkspace.id }}
              >
                <div className="p-2 bg-gray-100 rounded">
                  📁 {folder.name}
                  <div className="ml-4 mt-2 space-y-1">
                    {folder.chats.map(chat => (
                      <DraggableItem
                        key={chat.id}
                        id={`chat-${chat.id}`}
                        type="chat"
                        item={chat}
                        sourceContainer={{ type: 'folder', id: folder.id }}
                      >
                        <div className="p-1 bg-white rounded text-sm">
                          💬 {chat.title}
                        </div>
                      </DraggableItem>
                    ))}
                  </div>
                </div>
              </DraggableItem>
            ))}
          </DroppableArea>

          {/* Workspace Chats */}
          <DroppableArea
            id="workspace-chats"
            type="workspace"
            item={mockWorkspace}
            acceptTypes={['chat']}
            className="space-y-2"
          >
            <h3 className="text-sm font-medium">Workspace Chats</h3>
            {mockWorkspace.chats.map(chat => (
              <DraggableItem
                key={chat.id}
                id={`chat-${chat.id}`}
                type="chat"
                item={chat}
                sourceContainer={{ type: 'workspace', id: mockWorkspace.id }}
              >
                <div className="p-2 bg-blue-100 rounded">
                  💬 {chat.title}
                </div>
              </DraggableItem>
            ))}
          </DroppableArea>
        </div>
      </DragDropSidebar>
    </div>
  )
}
