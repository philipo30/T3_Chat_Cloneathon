import React, { useState, useEffect } from "react";
import { ArrowUp, ChevronDown, Globe, Paperclip, Mic, X, Camera, Image, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { ModelSelector } from "./ModelSelector";
import { ReasoningControls } from "./ReasoningControls";
import type { OpenRouterModel } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

import { useSupabaseChats } from "@/hooks/useSupabaseChats";
import { useSupabaseChatCompletion } from "@/hooks/useSupabaseChatCompletion";
import { useRouter } from "next/navigation";

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
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value = "",
  onInputChange,
  onSubmit,
  apiKey,
  chatId,
}) => {
  const [appendixOpen, setAppendixOpen] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);
  const [inputValue, setInputValue] = useState(value);

  const { createChat, addMessage } = useSupabaseChats();
  const router = useRouter();

  // Add chat completion hook for triggering AI responses
  const { sendMessage: triggerCompletion } = useSupabaseChatCompletion(apiKey, chatId || null);

  const { data: allModels, error } = useQuery<OpenRouterModel[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
  });

  // Update internal input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input changes
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onInputChange?.(newValue);
  };

  // Handle keyboard events in textarea to prevent unwanted form submissions
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only submit on Enter if Shift is not pressed and modal is not open
    if (e.key === 'Enter' && !e.shiftKey && !isModelSelectorOpen) {
      e.preventDefault();

      // Only submit if there's content and all required conditions are met
      if (inputValue.trim() && apiKey && selectedModel) {
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

    // Prevent submission if model selector is open
    if (isModelSelectorOpen) {
      return;
    }

    if (!inputValue.trim()) return;
    if (!apiKey) {
      onSubmit?.(e); // Let parent component handle API key request
      return;
    }

    if (!selectedModel) {
      console.error("No model selected");
      return;
    }

    // Clear input immediately for instant feedback
    const messageContent = inputValue;
    onInputChange?.('');
    setInputValue('');

    // Fire and forget - don't await to make it feel instant
    if (chatId) {
      // We're in an existing chat - add user message and placeholder assistant message
      addMessage({
        chat_id: chatId,
        role: 'user',
        content: messageContent,
        model: selectedModel.id,
        is_complete: true,
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
          console.log('ChatInput: Triggering AI completion for:', messageContent);
          triggerCompletion({
            content: messageContent,
            modelId: selectedModel.id,
          });
        }, 200); // 200ms delay
      }).catch(error => {
        console.error("Error sending message:", error);
      });
    } else {
      // We're on homepage - create new chat and navigate instantly
      createChat('New Chat', selectedModel.id).then(newChat => {
        // Navigate to the new chat immediately
        router.push(`/chat/${newChat.id}`);

        // Add user message to the new chat
        addMessage({
          chat_id: newChat.id,
          role: 'user',
          content: messageContent,
          model: selectedModel.id,
          is_complete: true,
        }).then(() => {
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
          // since we can't trigger it here without the chatId being available to the hook
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
              <div className={`backdrop-blur-2xl backdrop-brightness-35 bg-chat-input-backdrop rounded-t-5xl px-2 pt-2 text-center flex justify-center rounded-t-[31px] transition-all duration-500 ease-in-out ${voiceModeActive ? 'bg-transparent backdrop-blur-none' : ''}`}>
                <div className={`relative flex flex-col items-stretch bg-chat-input-form-background border border-chat-input-form-border border-b-0 rounded-t-3xl shadow-[0_80px_50px_0_rgba(0,0,0,0.1),0_50px_30px_0_rgba(0,0,0,0.07),0_30px_15px_0_rgba(0,0,0,0.06),0_15px_8px_0_rgba(0,0,0,0.04),0_6px_4px_0_rgba(0,0,0,0.04),0_2px_2px_0_rgba(0,0,0,0.02)] text-chat-input-text outline outline-8 outline-chat-input-outline pointer-events-auto transition-all duration-500 ease-in-out ${
                  voiceModeActive
                  ? 'w-40 h-40 rounded-[30%_45%_30%_40%] animate-rotate p-0 gap-0'
                  : 'w-full gap-2 max-w-3xl px-3 py-3'
                }`}>
                  <div className={`transition-opacity duration-200 ${voiceModeActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.2s' : '0.3s' }}
                      >
                        <Camera className="w-6 h-6 text-gray-900" />
                      </Button>
                      <Button
                        type="button"
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.3s' : '0.2s' }}
                      >
                        <Image className="w-6 h-6 text-gray-900" />
                      </Button>
                      <Button
                        type="button"
                        className={`flex items-center justify-center p-3 bg-chat-input-text rounded-full hover:bg-opacity-90 transition-all duration-200 ease-in-out ${appendixOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: appendixOpen ? '0.4s' : '0.1s' }}
                      >
                        <FileText className="w-6 h-6 text-gray-900" />
                      </Button>
                    </div>
                    <div className="relative w-full overflow-hidden mb-2 mask-image-gradient">
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
                    
                    <form
                      onSubmit={handleSubmit}
                      className="relative flex flex-col w-full z-10 "
                    >
                      <div className="flex flex-1 items-start text-center">
                        <textarea
                          name="input"
                          placeholder="Ask anything"
                          aria-label="Message input"
                          autoComplete="off"
                          value={inputValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={handleTextareaKeyDown}
                          className="w-full h-12 bg-transparent border-0 text-white placeholder:text-chat-input-text resize-none outline-none focus:ring-0 text-sm whitespace-pre-wrap break-words"

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
                            className={`w-8 h-8 p-0 flex items-center justify-center rounded-full border ${appendixOpen ? 'bg-chat-input-send-button-background' : 'bg-transparent'} border-chat-input-button-border text-chat-input-button-text hover:bg-chat-input-send-button-background transition-colors`}

                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={() => setSearchActive(!searchActive)}
                            className={`w-8 h-8 p-0 flex items-center justify-center rounded-full border ${searchActive ? 'bg-chat-input-send-button-background' : 'bg-transparent'} border-chat-input-button-border text-chat-input-button-text hover:bg-chat-input-send-button-background transition-colors`}

                          >
                            <Globe className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            aria-haspopup="menu"
                            aria-expanded={isModelSelectorOpen}
                            onClick={() => setIsModelSelectorOpen(true)}
                            className="flex items-center justify-center gap-2 h-8 bg-transparent border-0 text-chat-input-button-text font-medium text-xs rounded-md transition-colors duration-150 px-2 py-1.5 hover:bg-transparent"

                          >
                            <div className="text-chat-input-button-text text-sm font-medium text-left whitespace-nowrap">
                              {selectedModel ? selectedModel.name : "Select Model"}
                            </div>
                            <ChevronDown className="w-6 h-6 text-chat-input-button-text right-0" />
                          </Button>

                          <ReasoningControls className="ml-1" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setVoiceModeActive(true)}
                            className={`w-8 h-8 p-0 flex items-center justify-center rounded-full bg-transparent border border-chat-input-button-border text-chat-input-button-text hover:bg-chat-input-send-button-background transition-colors`}

                          >
                            <Mic className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            type="submit"
                            aria-label="Send message"
                            className="w-9 h-9 bg-chat-input-send-button-background hover:bg-chat-input-send-button-hover-background text-chat-input-send-button-text font-semibold border border-chat-input-send-button-border rounded-lg shadow-sm transition-colors duration-150 p-2"
                            disabled={!inputValue.trim()}
                          >
                            <ArrowUp className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-12 pointer-events-auto transition-all duration-300 ease-in-out ${voiceModeActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                  <Button type="button" onClick={() => setVoiceModeActive(false)} className="bg-chat-input-form-background p-4 rounded-full text-chat-input-text hover:bg-chat-input-form-border">
                      <X className="w-8 h-8" />
                  </Button>
                  <Button type="button" className="bg-chat-input-form-background p-4 rounded-full text-chat-input-text hover:bg-chat-input-form-border">
                      <Mic className="w-8 h-8" />
                  </Button>
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
            transform: rotate(0);
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
          animation: rotate 10s linear infinite;
        }
      `}</style>
    </>
  );
};
