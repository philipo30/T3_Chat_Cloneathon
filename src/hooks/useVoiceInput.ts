import { useState, useEffect, useRef, useCallback } from 'react';

// Define types for better TypeScript support
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: any; // SpeechGrammarList is not widely supported
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'start', listener: (event: Event) => void): void;
  addEventListener(type: 'end', listener: (event: Event) => void): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'nomatch', listener: (event: Event) => void): void;
  addEventListener(type: 'soundstart', listener: (event: Event) => void): void;
  addEventListener(type: 'soundend', listener: (event: Event) => void): void;
  addEventListener(type: 'speechstart', listener: (event: Event) => void): void;
  addEventListener(type: 'speechend', listener: (event: Event) => void): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceInputState = 'idle' | 'requesting-permission' | 'listening' | 'processing' | 'error';

export interface VoiceInputError {
  type: 'permission-denied' | 'not-supported' | 'network-error' | 'recognition-error' | 'unknown';
  message: string;
  originalError?: any;
}

export interface UseVoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
  autoSubmit?: boolean;
  silenceTimeout?: number; // ms to wait for silence before stopping
}

export interface UseVoiceInputReturn {
  // State
  state: VoiceInputState;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  error: VoiceInputError | null;
  isSupported: boolean;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  cancelListening: () => void;
  clearTranscript: () => void;
  
  // Configuration
  setLanguage: (language: string) => void;
  setContinuous: (continuous: boolean) => void;
}

const DEFAULT_OPTIONS: Required<UseVoiceInputOptions> = {
  continuous: true,
  interimResults: true,
  language: 'en-US',
  maxAlternatives: 1,
  autoSubmit: false,
  silenceTimeout: 3000,
};

export const useVoiceInput = (options: UseVoiceInputOptions = {}): UseVoiceInputReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // State management
  const [state, setState] = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<VoiceInputError | null>(null);
  const [language, setLanguage] = useState(config.language);
  const [continuous, setContinuous] = useState(config.continuous);
  const [isSupported, setIsSupported] = useState(false); // Start with false to avoid hydration mismatch

  // Refs for managing recognition instance and timeouts
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  // Check browser support after hydration
  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);
  
  // Clear any existing timeout
  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);
  
  // Set up silence detection timeout
  const setSilenceTimeout = useCallback(() => {
    clearSilenceTimeout();
    if (config.silenceTimeout > 0) {
      silenceTimeoutRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          stopListening();
        }
      }, config.silenceTimeout);
    }
  }, [config.silenceTimeout]);
  
  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = continuous;
    recognition.interimResults = config.interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = config.maxAlternatives;

    return recognition;
  }, [isSupported, continuous, config.interimResults, language, config.maxAlternatives]);

  // Handle recognition results
  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    setInterimTranscript(interimTranscript);

    if (finalTranscript) {
      setFinalTranscript(prev => prev + finalTranscript);
      setTranscript(prev => prev + finalTranscript);

      // Reset silence timeout when we get speech
      setSilenceTimeout();
    }
  }, [setSilenceTimeout]);

  // Handle recognition errors
  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error, event.message);

    let errorType: VoiceInputError['type'] = 'unknown';
    let errorMessage = 'An unknown error occurred';

    switch (event.error) {
      case 'not-allowed':
      case 'permission-denied':
        errorType = 'permission-denied';
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
        break;
      case 'not-supported':
        errorType = 'not-supported';
        errorMessage = 'Speech recognition is not supported in this browser.';
        break;
      case 'network':
        errorType = 'network-error';
        errorMessage = 'Network error occurred. Please check your connection and try again.';
        break;
      case 'aborted':
        // Don't treat abort as an error - it's intentional
        return;
      default:
        errorType = 'recognition-error';
        errorMessage = `Speech recognition error: ${event.error}`;
    }

    setError({
      type: errorType,
      message: errorMessage,
      originalError: event,
    });

    setState('error');
    isListeningRef.current = false;
    clearSilenceTimeout();
  }, [clearSilenceTimeout]);

  // Handle recognition start
  const handleStart = useCallback(() => {
    console.log('Speech recognition started');
    setState('listening');
    isListeningRef.current = true;
    setError(null);
    setSilenceTimeout();
  }, [setSilenceTimeout]);

  // Handle recognition end
  const handleEnd = useCallback(() => {
    console.log('Speech recognition ended');
    setState('idle');
    isListeningRef.current = false;
    clearSilenceTimeout();

    // Clear interim results when recognition ends
    setInterimTranscript('');
  }, [clearSilenceTimeout]);

  // Start listening function
  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError({
        type: 'not-supported',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      });
      setState('error');
      return;
    }

    if (isListeningRef.current) {
      console.warn('Already listening');
      return;
    }

    setState('requesting-permission');
    setError(null);

    try {
      // Clean up any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      // Initialize new recognition instance
      const recognition = initializeRecognition();
      if (!recognition) {
        throw new Error('Failed to initialize speech recognition');
      }

      recognitionRef.current = recognition;

      // Set up event listeners
      recognition.addEventListener('start', handleStart);
      recognition.addEventListener('result', handleResult);
      recognition.addEventListener('error', handleError);
      recognition.addEventListener('end', handleEnd);

      // Start recognition
      recognition.start();

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError({
        type: 'unknown',
        message: 'Failed to start speech recognition. Please try again.',
        originalError: error,
      });
      setState('error');
    }
  }, [isSupported, initializeRecognition, handleStart, handleResult, handleError, handleEnd]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }
    clearSilenceTimeout();
  }, [clearSilenceTimeout]);

  // Cancel listening function (aborts recognition)
  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setState('idle');
    isListeningRef.current = false;
    clearSilenceTimeout();
    setInterimTranscript('');
  }, [clearSilenceTimeout]);

  // Clear transcript function
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  // Update language function
  const updateLanguage = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
    // If currently listening, restart with new language
    if (isListeningRef.current) {
      cancelListening();
      // Small delay to ensure cleanup, then restart
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [cancelListening, startListening]);

  // Update continuous mode function
  const updateContinuous = useCallback((newContinuous: boolean) => {
    setContinuous(newContinuous);
    // If currently listening, restart with new setting
    if (isListeningRef.current) {
      cancelListening();
      // Small delay to ensure cleanup, then restart
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [cancelListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      clearSilenceTimeout();
    };
  }, [clearSilenceTimeout]);

  // Derived state
  const isListening = state === 'listening';

  return {
    // State
    state,
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    isSupported,

    // Actions
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,

    // Configuration
    setLanguage: updateLanguage,
    setContinuous: updateContinuous,
  };
};
