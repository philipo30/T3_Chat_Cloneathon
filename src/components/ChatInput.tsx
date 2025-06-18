import React, { useState, useEffect, useRef } from "react";
import { ArrowUp, ChevronDown, Globe, Paperclip, Mic, X, Camera, Image, FileText, MicOff, Volume2, Square } from "lucide-react";
import { Button } from "./ui/button";
import { ModelSelector } from "./ModelSelector";
import { ReasoningControls } from "./ReasoningControls";
import { FilePreview } from "./FilePreview";
import type { OpenRouterModel, FileAttachment } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { processFiles } from "@/lib/utils/file-upload";
import { addPreviewToAttachment } from "@/lib/utils/file-preview";

import { useSupabaseChats } from "@/hooks/useSupabaseChats";
import { useSupabaseChatCompletion } from "@/hooks/useSupabaseChatCompletion";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useRouter } from "next/navigation";
import { useChatTitleGenerator } from "@/hooks/useChatTitleGenerator";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const fetchModels = async (): Promise<OpenRouterModel[]> => {
  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  const data = await response.json();
  return data.data;
};

interface ChatInputProps {
  value?: string;
  onInputChange?: (value: string) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  apiKey: string | null;
  chatId?: string; // Optional chat ID for existing chats
  onMessageSent?: () => void; // Callback when user sends a message
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value = "",
  onInputChange,
  onSubmit,
  apiKey,
  chatId,
  onMessageSent,
}) => {
  const [appendixOpen, setAppendixOpen] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [searchActive, setSearchActive] = useState(() => {
    // Load search preference from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('webSearchEnabled') === 'true';
    }
    return false;
  });
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isVoiceButtonHovered, setIsVoiceButtonHovered] = useState(false);

  const { createChatInContext, addMessage } = useSupabaseChats();
  const { selectedWorkspaceId, selectedFolderId } = useWorkspaceContext();
  const router = useRouter();

  // Add chat completion hook for triggering AI responses
  const { sendMessage: triggerCompletion, isGenerating, stopGeneration } = useSupabaseChatCompletion(apiKey, chatId || null);

  // Add title generation hook
  const { autoGenerateTitle } = useChatTitleGenerator({
    apiKey,
    autoGenerate: true,
  });

  // Add voice input hook
  const {
    state: voiceState,
    isListening,
    transcript: voiceTranscript,
    interimTranscript,
    error: voiceError,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript: clearVoiceTranscript,
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    silenceTimeout: 0, // Disable auto-stop on silence
  });

  const { data: allModels, error } = useQuery<OpenRouterModel[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
  });

  // Update internal input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Reset typing state when navigating between homepage and chat
  useEffect(() => {
    setHasStartedTyping(false);
  }, [chatId]);

  // Set client state after hydration to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent default drag and drop behavior on the page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      preventDefaults(e);
    };

    const handleGlobalDrop = (e: DragEvent) => {
      preventDefaults(e);
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);

      // Clear drag timeout on unmount
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  // Handle input changes
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onInputChange?.(newValue);

    // Track if user has started typing (only on homepage)
    if (!chatId && newValue.trim().length > 0 && !hasStartedTyping) {
      setHasStartedTyping(true);
    } else if (!chatId && newValue.trim().length === 0 && hasStartedTyping) {
      setHasStartedTyping(false);
    }
  };

  // Handle voice mode activation
  const handleVoiceModeToggle = async () => {
    if (!isVoiceSupported) {
      console.error('Voice input not supported in this browser');
      return;
    }

    if (voiceModeActive) {
      // Deactivate voice mode
      setVoiceModeActive(false);
      if (isListening) {
        stopListening();
      }
    } else {
      // Activate voice mode
      setVoiceModeActive(true);
      clearVoiceTranscript();
      try {
        await startListening();
      } catch (error) {
        console.error('Failed to start voice input:', error);
        setVoiceModeActive(false);
      }
    }
  };

  // Handle voice input completion
  const handleVoiceComplete = () => {
    if (voiceTranscript.trim()) {
      handleInputChange(voiceTranscript.trim());
      clearVoiceTranscript();
    }
    setVoiceModeActive(false);
  };

  // Update input with voice transcript
  useEffect(() => {
    if (voiceModeActive && voiceTranscript) {
      // Update the input field with the voice transcript in real-time
      const fullTranscript = voiceTranscript + (interimTranscript ? ' ' + interimTranscript : '');
      setInputValue(fullTranscript);
      onInputChange?.(fullTranscript);
    }
  }, [voiceTranscript, interimTranscript, voiceModeActive, onInputChange]);

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      console.error('Voice input error:', voiceError);
      setVoiceModeActive(false);
      // You could show a toast notification here
    }
  }, [voiceError]);

  // Handle search toggle with localStorage persistence
  const handleSearchToggle = () => {
    const newSearchState = !searchActive;
    setSearchActive(newSearchState);
    localStorage.setItem('webSearchEnabled', newSearchState.toString());
  };

  // Handle stop generation
  const handleStopGeneration = () => {
    stopGeneration();
  };

  // Handle file attachments
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const newAttachments = await processFiles(files);

      // Generate previews for image files
      const attachmentsWithPreviews = await Promise.all(
        newAttachments.map(async (attachment, index) => {
          if (attachment.type === 'image') {
            return await addPreviewToAttachment(attachment, files[index]);
          }
          return attachment;
        })
      );

      setAttachments(prev => [...prev, ...attachmentsWithPreviews]);
    } catch (error) {
      console.error('Error processing files:', error);
      // You could show a toast notification here
    } finally {
      setIsProcessingFiles(false);
    }

    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  // Handle drag and drop with improved stability
  const dragCounter = useRef(0);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;

    if (dragCounter.current <= 0) {
      // Add a small delay to prevent flickering
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragOver(false);
        dragCounter.current = 0;
      }, 50);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear timeout and reset state
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragCounter.current = 0;
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    try {
      const newAttachments = await processFiles(files);

      // Generate previews for image files
      const attachmentsWithPreviews = await Promise.all(
        newAttachments.map(async (attachment, index) => {
          if (attachment.type === 'image') {
            return await addPreviewToAttachment(attachment, files[index]);
          }
          return attachment;
        })
      );

      setAttachments(prev => [...prev, ...attachmentsWithPreviews]);
    } catch (error) {
      console.error('Error processing dropped files:', error);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Handle paste events
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    // Extract files from clipboard
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length === 0) return;

    // Prevent default paste behavior for files
    e.preventDefault();

    setIsProcessingFiles(true);
    try {
      const newAttachments = await processFiles(files);

      // Generate previews for image files
      const attachmentsWithPreviews = await Promise.all(
        newAttachments.map(async (attachment, index) => {
          if (attachment.type === 'image') {
            return await addPreviewToAttachment(attachment, files[index]);
          }
          return attachment;
        })
      );

      setAttachments(prev => [...prev, ...attachmentsWithPreviews]);
    } catch (error) {
      console.error('Error processing pasted files:', error);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Handle keyboard events in textarea to prevent unwanted form submissions
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only submit on Enter if Shift is not pressed and modal is not open
    if (e.key === 'Enter' && !e.shiftKey && !isModelSelectorOpen) {
      e.preventDefault();

      // Only submit if there's content or attachments and all required conditions are met
      if ((inputValue.trim() || attachments.length > 0) && apiKey && selectedModel) {
        // Create a synthetic form event to trigger handleSubmit
        const syntheticEvent = {
          preventDefault: () => {},
          currentTarget: e.currentTarget.closest('form'),
        } as React.FormEvent<HTMLFormElement>;

        handleSubmit(syntheticEvent);
      }
    }
    // Allow Shift+Enter for new lines (default behavior)
  };

  useEffect(() => {
    setSelectedModel(currentModel => {
      // If a model is already selected, don't change it.
      if (currentModel) {
        return currentModel;
      }

      // If models have loaded, set the initial model
      if (allModels && allModels.length > 0) {
        const lastSelectedModelId = localStorage.getItem('lastSelectedModelId');
        if (lastSelectedModelId) {
          const foundModel = allModels.find(m => m.id === lastSelectedModelId);
          if (foundModel) return foundModel;
        }
        
        // Try to find affordable models first
        const affordableModels = [
          "google/gemini-flash-1.5",
          "anthropic/claude-3-haiku",
          "openai/gpt-3.5-turbo",
          "meta-llama/llama-3.1-8b-instruct:free",
          "microsoft/wizardlm-2-8x22b:nitro"
        ];

        // Try to find an affordable model first
        for (const modelId of affordableModels) {
          const model = allModels.find(m => m.id === modelId);
          if (model) return model;
        }

        // If no affordable model found, try auto router
        const autoRouterModel = allModels.find(m => m.id.includes('auto') || m.name.toLowerCase().includes('auto'));
        if (autoRouterModel) return autoRouterModel;

        // Final fallback
        return allModels[0];
      }
      
      // If there's an error, set an error model
      if (error) {
        console.error("Failed to load models:", error);
        return { id: 'error/error', name: 'Error', description: 'Could not load models', context_length: 0, architecture: { input_modalities: [], output_modalities: [], tokenizer: '', instruct_type: null }, pricing: { prompt: '', completion: '', request: '', image: '' }, top_provider: { context_length: 0, max_completion_tokens: 0, is_moderated: false}, per_request_limits: null, supported_parameters: [] };
      }
      
      // Otherwise, return null (no model selected yet)
      return null;
    });
  }, [allModels, error]);

  // No need to initialize sessions anymore since we use Supabase

  const handleSelectModel = (model: OpenRouterModel) => {
    setSelectedModel(model);
    setIsModelSelectorOpen(false);
    localStorage.setItem('lastSelectedModelId', model.id);

    // Small delay to ensure modal state is updated before any potential focus events
    setTimeout(() => {
      // Focus management - ensure textarea doesn't accidentally trigger submission
      const textarea = document.querySelector('textarea[name="input"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.blur();
        // Re-focus after a brief moment to maintain user experience
        setTimeout(() => textarea.focus(), 50);
      }
    }, 10);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent submission if model selector is open or already generating
    if (isModelSelectorOpen || isGenerating) {
      return;
    }

    if (!inputValue.trim() && attachments.length === 0) return;
    if (!apiKey) {
      onSubmit?.(e); // Let parent component handle API key request
      return;
    }

    if (!selectedModel) {
      console.error("No model selected");
      return;
    }

    // Clear input and attachments immediately for instant feedback
    const messageContent = inputValue;
    const messageAttachments = [...attachments];
    onInputChange?.('');
    setInputValue('');
    clearAttachments();

    // Notify parent component that a message was sent (for auto-scroll)
    onMessageSent?.();

    // Fire and forget - don't await to make it feel instant
    if (chatId) {
      // We're in an existing chat - add user message and placeholder assistant message
      addMessage({
        chat_id: chatId,
        role: 'user',
        content: messageContent,
        model: selectedModel.id,
        is_complete: true,
        attachments: messageAttachments,
      }).then(() => {
        // Add placeholder assistant message with typing indicator
        return addMessage({
          chat_id: chatId,
          role: 'assistant',
          content: '...',
          model: selectedModel.id,
          is_complete: false,
        });
      }).then(() => {
        // Small delay to ensure assistant message is saved to database
        setTimeout(() => {
          console.log('ChatInput: Triggering AI completion for:', messageContent, 'with web search:', searchActive);
          triggerCompletion({
            content: messageContent,
            modelId: selectedModel.id,
            webSearchEnabled: searchActive,
          });
        }, 200); // 200ms delay
      }).catch(error => {
        console.error("Error sending message:", error);
      });
    } else {
      // We're on homepage - create new chat with workspace context and navigate instantly
      createChatInContext('New Chat', selectedModel.id, selectedWorkspaceId || undefined, selectedFolderId || undefined).then(newChat => {
        // Navigate to the new chat immediately
        router.push(`/chat/${newChat.id}`);

        // Add user message to the new chat
        addMessage({
          chat_id: newChat.id,
          role: 'user',
          content: messageContent,
          model: selectedModel.id,
          is_complete: true,
          attachments: messageAttachments,
        }).then((userMessage) => {
          // Generate title for the new chat based on the first user message
          autoGenerateTitle(messageContent, newChat.id, userMessage.id).catch(error => {
            console.warn('Failed to generate title for new chat:', error);
          });

          // Add placeholder assistant message with typing indicator
          return addMessage({
            chat_id: newChat.id,
            role: 'assistant',
            content: '...',
            model: selectedModel.id,
            is_complete: false,
          });
        }).then(() => {
          // Note: AI completion will be triggered by the chat page when it loads
          // since the ChatInput hook doesn't have the new chatId available yet
        });
      }).catch(error => {
        console.error("Error creating chat:", error);
      });
    }
  };

  const suggestionPrompts = [
    "Create an image",
    "Give me ideas",
    "Write a text",
    "Create a chart",
    "Plan a trip",
    "Help me pick",
    "Write a Python script",
  ];

  // Show terms and policy when no chatId (on homepage) or when input is empty
  const showTermsAndPolicy = !chatId;

  return (
    <>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-full">
        <div className="flex flex-col mx-auto max-w-3xl relative text-center w-full pointer-events-none">
          <div className="pointer-events-none text-center">
            <div className="mx-auto text-center w-fit">
              <p className="sr-only text-sm text-chat-input-upgrade-text">
                Upgrade to Pro
              </p>
              {showTermsAndPolicy && (
                <div className="flex justify-center -mb-px mx-3 mt-3 text-center">
                  <div className="backdrop-blur-3xl bg-chat-input-terms-backdrop border border-chat-input-terms-border rounded-t-2xl text-chat-input-terms-text text-sm max-w-[548.73px] px-4 py-4 text-center">
                    <span>Make sure you agree to our </span>
                    <a
                      href="#"
                      className="inline font-medium underline text-center"
                    >
                      Terms
                    </a>
                    <span> and our </span>
                    <a
                      href="#"
                      className="inline font-medium underline text-center"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="text-center relative ">
              <div className={`backdrop-blur-2xl backdrop-brightness-35 bg-chat-input-backdrop rounded-t-5xl px-2 pt-2 text-center flex justify-center rounded-t-[31px] transition-all duration-500 ease-in-out ${isClient && voiceModeActive ? 'bg-transparent backdrop-blur-none' : ''}`}>
                <div
                  className={`relative flex flex-col items-stretch border border-chat-input-form-border border-b-0 shadow-[0_80px_50px_0_rgba(0,0,0,0.1),0_50px_30px_0_rgba(0,0,0,0.07),0_30px_15px_0_rgba(0,0,0,0.06),0_15px_8px_0_rgba(0,0,0,0.04),0_6px_4px_0_rgba(0,0,0,0.04),0_2px_2px_0_rgba(0,0,0,0.02)] text-chat-input-text outline outline-8 outline-chat-input-outline pointer-events-auto transition-all duration-700 ease-in-out ${
                    isClient && voiceModeActive
                    ? voiceTranscript || interimTranscript
                      ? 'w-full max-w-2xl h-32 rounded-2xl p-4 gap-2 bg-gradient-to-br from-chat-input-form-background via-chat-input-form-background to-chat-input-form-background/80 animate-voice-border-glow' // Speaking state - rectangle input-like with gradient and glow
                      : 'w-40 h-40 rounded-[30%_45%_30%_40%] p-0 gap-0 animate-rotate animate-voice-pulse bg-chat-input-form-background transform-gpu' // Waiting state - spinning shape
                    : 'w-full gap-2 max-w-3xl px-3 py-3 rounded-t-3xl bg-chat-input-form-background' // Normal state
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Voice transcript display - integrated into the shape when speaking */}
                  {isClient && voiceModeActive && (voiceTranscript || interimTranscript) && (
                    <div className="absolute inset-0 z-10 flex flex-col justify-center p-6 animate-voice-text-fade-in pointer-events-none">
                      <div className="text-center">
                        <div className="text-chat-input-text text-lg leading-relaxed mb-3 max-h-20 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-chat-input-text/30">
                          <span className="block">
                            {voiceTranscript}
                          </span>
                          {interimTranscript && (
                            <span className="text-chat-input-text/60 italic animate-pulse">
                              {voiceTranscript ? ' ' : ''}{interimTranscript}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-chat-input-text/60 text-sm">
                          {isClient && isListening ? (
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-voice-typing-dots"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-voice-typing-dots"></div>
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-voice-typing-dots"></div>
                            </div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-chat-input-text/40"></div>
                          )}
                          <span className="transition-all duration-300">
                            {isClient && isListening ? 'Listening...' : 'Processing...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`transition-opacity duration-200 ${isClient && voiceModeActive && !(voiceTranscript || interimTranscript) ? 'opacity-0 pointer-events-none' : isClient && voiceModeActive ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    {/* Drag and Drop Overlay */}
                    {isDragOver && (
                      <div
                        className="absolute inset-0 z-30 bg-chat-input-send-button-background/20 backdrop-blur-sm rounded-t-3xl flex items-center justify-center border-2 border-dashed border-chat-input-send-button-background pointer-events-none"
                        style={{ margin: '-2px' }}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-chat-input-send-button-background rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-lg font-medium text-white">Drop files here</p>
                          <p className="text-sm text-white/80">Images and PDFs supported</p>
                        </div>
                      </div>
                    )}
                    <div className={`absolute inset-0 z-20 bg-fuchsia-200/10 backdrop-blur-sm rounded-t-3xl flex items-center justify-center gap-4 transition-opacity duration-300 ease-in-out ${appendixOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <Button
                        type="button"
                        onClick={() => setAppendixOpen(false)}
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.1s' : '0.4s' }}
                      >
                        <X className="w-6 h-6 text-gray-900" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => document.getElementById('camera-input')?.click()}
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.2s' : '0.3s' }}
                      >
                        <Camera className="w-6 h-6 text-gray-900" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => document.getElementById('image-input')?.click()}
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.3s' : '0.2s' }}
                      >
                        <Image className="w-6 h-6 text-gray-900" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => document.getElementById('file-input')?.click()}
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.4s' : '0.1s' }}
                      >
                        <FileText className="w-6 h-6 text-gray-900" />
                      </Button>

                      {/* Hidden file inputs */}
                      <input
                        id="camera-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileInputChange}
                        className="hidden"
                        multiple
                      />
                      <input
                        id="image-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={handleFileInputChange}
                        className="hidden"
                        multiple
                      />
                      <input
                        id="file-input"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileInputChange}
                        className="hidden"
                        multiple
                      />
                    </div>
                    {/* Suggestion prompts - only show on homepage and when user hasn't started typing */}
                    {!chatId && (
                      <div className={`relative w-full overflow-hidden mb-2 mask-image-gradient transition-all duration-300 ease-in-out ${
                        hasStartedTyping
                          ? 'opacity-0 -translate-y-2 max-h-0 mb-0'
                          : 'opacity-100 translate-y-0 max-h-20'
                      }`}>
                        <div className="flex gap-4 animate-scroll-marquee">
                          {[...suggestionPrompts, ...suggestionPrompts].map((prompt, index) => (
                            <div
                              key={index}
                              className="flex-shrink-0 px-4 py-2 bg-chat-input-form-border border border-chat-input-button-border rounded-lg text-chat-input-button-text text-sm font-medium cursor-pointer hover:bg-chat-input-send-button-background transition-colors duration-150"
                              onClick={() => handleInputChange(prompt)}
                            >
                              {prompt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File Attachments Display */}
                    {(attachments.length > 0 || isProcessingFiles) && (
                      <div className="mb-3 px-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {attachments.map((attachment) => (
                            <FilePreview
                              key={attachment.id}
                              attachment={attachment}
                              onRemove={handleRemoveAttachment}
                              showRemoveButton
                              className="w-full"
                            />
                          ))}
                          {isProcessingFiles && (
                            <div className="w-full h-20 bg-chat-input-form-background border border-chat-input-form-border rounded-lg flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-chat-input-send-button-background border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-chat-input-button-text">Processing...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmit}
                      className="relative flex flex-col w-full z-10"
                    >
                      <div className="flex flex-1 items-start text-center">
                        <textarea
                          name="input"
                          placeholder={
                            isGenerating
                              ? "Generating response..."
                              : isDragOver
                                ? "Drop files here..."
                                : isProcessingFiles
                                  ? "Processing files..."
                                  : "Ask anything (or paste/drop files)"
                          }
                          aria-label="Message input"
                          autoComplete="off"
                          value={inputValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleTextareaKeyDown}
                          onPaste={handlePaste}
                          disabled={isGenerating}
                          className={`w-full h-12 bg-transparent border-0 text-chat-input-text placeholder:text-chat-input-text resize-none outline-none focus:ring-0 text-sm whitespace-pre-wrap break-words transition-opacity duration-200 ${
                            isGenerating ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                          }`}
                        />
                        <div className="sr-only">
                          Press Enter to send, Shift + Enter for new line
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 w-full">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setAppendixOpen(!appendixOpen)}
                            disabled={isGenerating}
                            className={`w-8 h-8 p-0 flex items-center justify-center rounded-full border ${appendixOpen ? 'bg-chat-input-send-button-background' : 'bg-transparent'} border-chat-input-button-border text-chat-input-button-text hover:bg-chat-input-send-button-background transition-all duration-200 ${
                              isGenerating ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                            }`}
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>

                          <Button
                            type="button"
                            onClick={handleSearchToggle}
                            disabled={isGenerating}
                            className={`w-8 h-8 p-0 flex items-center justify-center rounded-full border ${searchActive ? 'bg-chat-input-send-button-background' : 'bg-transparent'} border-chat-input-button-border text-chat-input-button-text hover:bg-chat-input-send-button-background transition-all duration-200 ${
                              isGenerating ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                            }`}
                            title={searchActive ? "Disable web search" : "Enable web search"}
                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            aria-haspopup="menu"
                            aria-expanded={isModelSelectorOpen}
                            onClick={() => setIsModelSelectorOpen(true)}
                            disabled={isGenerating}
                            className={`flex items-center justify-center gap-2 h-8 bg-transparent border-0 text-chat-input-button-text font-medium text-xs rounded-md transition-all duration-200 px-2 py-1.5 hover:bg-transparent ${
                              isGenerating ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                            }`}
                          >
                            <div className="text-chat-input-button-text text-sm font-medium text-left whitespace-nowrap">
                              {selectedModel ? selectedModel.name : "Select Model"}
                            </div>
                            <ChevronDown className="w-6 h-6 text-chat-input-button-text right-0" />
                          </Button>

                          <ReasoningControls
                            className="ml-1"
                            selectedModelId={selectedModel?.id || ''}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div
                            className="relative"
                            onMouseEnter={() => setIsVoiceButtonHovered(true)}
                            onMouseLeave={() => setIsVoiceButtonHovered(false)}
                          >
                            <Button
                              type="button"
                              onClick={handleVoiceModeToggle}
                              disabled={!isClient || !isVoiceSupported || isGenerating}
                              className={`w-8 h-8 p-0 flex items-center justify-center rounded-full ${
                                !isClient || !isVoiceSupported || isGenerating
                                  ? 'bg-transparent border-chat-input-button-border text-chat-input-button-text/50 cursor-not-allowed'
                                  : isClient && isListening
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : isClient && voiceModeActive
                                      ? 'bg-chat-input-send-button-background border-chat-input-send-button-border text-chat-input-send-button-text'
                                      : 'bg-transparent border-chat-input-button-border text-chat-input-button-text hover:bg-chat-input-send-button-background'
                              } transition-all duration-200`}
                            >
                              {isClient && isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>

                            {/* Custom instant tooltip */}
                            {isVoiceButtonHovered && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg animate-in fade-in-0 duration-0">
                                {!isClient
                                  ? 'Loading...'
                                  : !isVoiceSupported
                                    ? 'Voice input not supported in this browser'
                                    : isListening
                                      ? 'Stop listening'
                                      : 'Start voice input'
                                }
                              </div>
                            )}
                          </div>
                          
                          <Button
                            type={isGenerating ? "button" : "submit"}
                            aria-label={isGenerating ? "Stop generating" : "Send message"}
                            onClick={isGenerating ? handleStopGeneration : undefined}
                            className="w-9 h-9 bg-chat-input-send-button-background hover:bg-chat-input-send-button-hover-background text-chat-input-send-button-text font-semibold border border-chat-input-send-button-border rounded-lg shadow-sm transition-all duration-200 p-2 relative overflow-hidden"
                            disabled={!isGenerating && !inputValue.trim() && attachments.length === 0}
                          >
                            <div className="relative w-5 h-5">
                              <ArrowUp
                                className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${
                                  isGenerating
                                    ? 'opacity-0 scale-75 rotate-90'
                                    : 'opacity-100 scale-100 rotate-0'
                                }`}
                              />
                              <Square
                                className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${
                                  isGenerating
                                    ? 'opacity-100 scale-100 rotate-0'
                                    : 'opacity-0 scale-75 -rotate-90'
                                }`}
                              />
                            </div>
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className={`absolute ${
                isClient && voiceModeActive && (voiceTranscript || interimTranscript)
                  ? 'bottom-2 left-1/2 -translate-x-1/2' // When speaking - position at bottom of rectangle
                  : 'bottom-4 left-1/2 -translate-x-1/2' // When waiting - position below spinning shape
              } flex items-center gap-8 pointer-events-auto transition-all duration-500 ease-in-out z-50 ${isClient && voiceModeActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                  <Button
                    type="button"
                    onClick={() => {
                      setVoiceModeActive(false);
                      if (isListening) {
                        cancelListening();
                      }
                      clearVoiceTranscript();
                    }}
                    className="bg-chat-input-form-background p-4 rounded-full text-chat-input-text hover:bg-chat-input-form-border transition-colors shadow-lg border border-chat-input-form-border"
                    title="Cancel voice input"
                  >
                      <X className="w-8 h-8" />
                  </Button>

                  <div className="relative">
                    <Button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`p-4 rounded-full transition-all duration-200 shadow-lg border ${
                        isClient && isListening
                          ? 'bg-red-500/20 text-red-400 animate-voice-listening border-red-500/30'
                          : 'bg-chat-input-form-background text-chat-input-text hover:bg-chat-input-form-border border-chat-input-form-border'
                      }`}
                      title={isClient && isListening ? 'Stop listening' : 'Start listening'}
                    >
                        {isClient && isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </Button>

                    {/* Voice state indicator */}
                    {isClient && voiceError && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
                        {voiceError.message}
                      </div>
                    )}
                  </div>

                  {isClient && voiceTranscript && (
                    <Button
                      type="button"
                      onClick={handleVoiceComplete}
                      className="bg-green-500/20 text-green-400 p-4 rounded-full hover:bg-green-500/30 transition-colors shadow-lg border border-green-500/30"
                      title="Use voice input"
                    >
                        <Volume2 className="w-8 h-8" />
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isModelSelectorOpen && (
        <ModelSelector
            onSelectModel={handleSelectModel}
            onClose={() => setIsModelSelectorOpen(false)}
            currentModel={selectedModel?.id || ''}
        />
      )}

      <style jsx global>{`
        .mask-image-gradient {
          mask-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0),
            rgba(0, 0, 0, 1) 20%,
            rgba(0, 0, 0, 1) 80%,
            rgba(0, 0, 0, 0)
          );
        }
        
        @keyframes scroll-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-50% - 1rem)); }
        }
        
        .animate-scroll-marquee {
          animation: scroll-marquee 30s linear infinite;
        }
        
        .animate-scroll-marquee:hover {
          animation-play-state: paused;
        }
        .chat-input-container::before {
          content: "";
          position: absolute;
          top: -9rem;
          left: -6rem;
          width: 15rem;
          height: 15rem;
          background: radial-gradient(
            circle,
            rgba(var(--chat-input-text), 0.2) 10%,
            rgba(var(--chat-input-text), 0.05) 25%,
            transparent 60%
          );
          filter: blur(10px);
          border-radius: 50%;
          z-index: 0;
          transition: all 1s cubic-bezier(0.3, 1.5, 0.6, 1);
        }

        .chat-input-container:focus-within::before {
          top: -6rem;
          left: 50%;
          transform: translateX(-50%);
          filter: blur(50px);
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
            border-radius: 30% 45% 30% 40%;
          }
          25% {
            transform: rotate(90deg);
            border-radius: 40% 30% 45% 30%;
          }
          50% {
            transform: rotate(180deg);
            border-radius: 45% 30% 40% 30%;
          }
          75% {
            transform: rotate(270deg);
            border-radius: 30% 40% 30% 45%;
          }
          100% {
            transform: rotate(360deg);
            border-radius: 30% 45% 30% 40%;
          }
        }

        .animate-rotate {
          animation: rotate 8s linear infinite;
        }

        @keyframes voice-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        .animate-voice-pulse {
          animation: voice-pulse 2s ease-in-out infinite;
        }

        @keyframes voice-listening {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }

        .animate-voice-listening {
          animation: voice-listening 1.5s ease-in-out infinite;
        }

        @keyframes voice-morph {
          0% {
            width: 10rem;
            height: 10rem;
            border-radius: 30% 45% 30% 40%;
          }
          100% {
            width: 100%;
            max-width: 32rem;
            height: 8rem;
            border-radius: 1rem;
          }
        }

        .animate-voice-morph {
          animation: voice-morph 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes voice-text-fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-voice-text-fade-in {
          animation: voice-text-fade-in 0.5s ease-out 0.3s both;
        }

        @keyframes voice-border-glow {
          0%, 100% {
            border-color: rgba(var(--chat-input-form-border), 0.4);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
          }
          50% {
            border-color: rgba(139, 92, 246, 0.6);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          }
        }

        .animate-voice-border-glow {
          animation: voice-border-glow 2s ease-in-out infinite;
        }

        @keyframes voice-typing-dots {
          0%, 20% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          80%, 100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        .animate-voice-typing-dots {
          animation: voice-typing-dots 1.5s ease-in-out infinite;
        }

        .animate-voice-typing-dots:nth-child(2) {
          animation-delay: 0.2s;
        }

        .animate-voice-typing-dots:nth-child(3) {
          animation-delay: 0.4s;
        }

        /* Send/Stop button animations */
        @keyframes icon-fade-in {
          0% {
            opacity: 0;
            transform: scale(0.75) rotate(-90deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes icon-fade-out {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.75) rotate(90deg);
          }
        }

        .send-stop-button .icon-enter {
          animation: icon-fade-in 0.2s ease-out forwards;
        }

        .send-stop-button .icon-exit {
          animation: icon-fade-out 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};
