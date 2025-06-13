import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { LegacyChatSession, LegacyMessage, Role } from '../types';

interface ChatState {
  sessions: LegacyChatSession[];
  currentSessionId: string | null;
}

interface ChatActions {
  createSession: (modelId: string) => string;
  selectSession: (sessionId: string) => void;
  addMessage: (content: string, role: Role, sessionId?: string) => LegacyMessage;
  updateMessage: (messageId: string, content: string, isComplete?: boolean, generationId?: string, sessionId?: string) => void;
  setMessageComplete: (messageId: string, isComplete: boolean, sessionId?: string) => void;
  setGenerationId: (messageId: string, generationId: string, sessionId?: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;
  clearSessions: () => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      
      createSession: (modelId: string) => {
        const newSession: LegacyChatSession = {
          id: uuidv4(),
          title: 'New Chat',
          messages: [],
          modelId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set(state => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: newSession.id,
        }));
        
        return newSession.id;
      },
      
      selectSession: (sessionId: string) => {
        set({ currentSessionId: sessionId });
      },
      
      addMessage: (content: string, role: Role, sessionId?: string) => {
        const state = get();
        const targetSessionId = sessionId || state.currentSessionId;
        if (!targetSessionId) throw new Error('No session selected');
        
        const message: LegacyMessage = {
          id: uuidv4(),
          role,
          content,
          createdAt: new Date(),
          isComplete: role === 'user', // User messages are always complete
        };
        
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: [...session.messages, message],
                  updatedAt: new Date(),
                }
              : session
          ),
        }));
        
        return message;
      },
      
      updateMessage: (messageId: string, content: string, isComplete?: boolean, generationId?: string, sessionId?: string) => {
        const state = get();
        const targetSessionId = sessionId || state.currentSessionId;
        if (!targetSessionId) return;
        
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: session.messages.map(message =>
                    message.id === messageId
                      ? {
                          ...message,
                          content,
                          ...(isComplete !== undefined ? { isComplete } : {}),
                          ...(generationId ? { generationId } : {}),
                        }
                      : message
                  ),
                  updatedAt: new Date(),
                }
              : session
          ),
        }));
      },
      
      setMessageComplete: (messageId: string, isComplete: boolean, sessionId?: string) => {
        const state = get();
        const targetSessionId = sessionId || state.currentSessionId;
        if (!targetSessionId) return;
        
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: session.messages.map(message =>
                    message.id === messageId
                      ? { ...message, isComplete }
                      : message
                  ),
                }
              : session
          ),
        }));
      },
      
      setGenerationId: (messageId: string, generationId: string, sessionId?: string) => {
        const state = get();
        const targetSessionId = sessionId || state.currentSessionId;
        if (!targetSessionId) return;
        
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === targetSessionId
              ? {
                  ...session,
                  messages: session.messages.map(message =>
                    message.id === messageId
                      ? { ...message, generationId }
                      : message
                  ),
                }
              : session
          ),
        }));
      },
      
      deleteSession: (sessionId: string) => {
        const state = get();
        const newSessions = state.sessions.filter(
          session => session.id !== sessionId
        );
        
        // If we deleted the current session, select the first available one or null
        const newCurrentSessionId =
          state.currentSessionId === sessionId
            ? newSessions.length > 0
              ? newSessions[0].id
              : null
            : state.currentSessionId;
        
        set({
          sessions: newSessions,
          currentSessionId: newCurrentSessionId,
        });
      },
      
      renameSession: (sessionId: string, title: string) => {
        const state = get();
        set({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title, updatedAt: new Date() }
              : session
          ),
        });
      },
      
      clearSessions: () => {
        set({ sessions: [], currentSessionId: null });
      },
    }),
    {
      name: 'chat-store',
    }
  )
); 