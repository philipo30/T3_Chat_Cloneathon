import React from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { Button } from './ui/button';

export const VoiceInputDemo: React.FC = () => {
  const {
    state,
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  } = useVoiceInput({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    silenceTimeout: 3000,
  });

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Voice Input Not Supported</h2>
        <p className="text-red-600">
          Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Voice Input Demo</h1>
        <p className="text-gray-600">Test the voice input functionality</p>
      </div>

      {/* Status Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            state === 'listening' ? 'bg-green-100 text-green-800' :
            state === 'error' ? 'bg-red-100 text-red-800' :
            state === 'processing' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {state}
          </span>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={isListening ? stopListening : startListening}
          className={`px-6 py-3 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          disabled={state === 'requesting-permission' || state === 'processing'}
        >
          {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Button>

        <Button
          onClick={cancelListening}
          variant="outline"
          disabled={!isListening}
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>

        <Button
          onClick={clearTranscript}
          variant="outline"
          disabled={!transcript}
        >
          Clear
        </Button>
      </div>

      {/* Transcript Display */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Final Transcript:</label>
          <div className="min-h-[100px] p-4 border border-gray-300 rounded-lg bg-white">
            {transcript || <span className="text-gray-400 italic">No speech detected yet...</span>}
          </div>
        </div>

        {interimTranscript && (
          <div>
            <label className="block text-sm font-medium mb-2">Interim (Live) Transcript:</label>
            <div className="min-h-[60px] p-4 border border-blue-300 rounded-lg bg-blue-50">
              <span className="text-blue-700 italic">{interimTranscript}</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Click "Start Listening" to begin voice recognition</li>
          <li>• Speak clearly into your microphone</li>
          <li>• The system will automatically stop after 3 seconds of silence</li>
          <li>• You can manually stop or cancel at any time</li>
          <li>• Make sure to allow microphone permissions when prompted</li>
        </ul>
      </div>

      {/* Debug Info */}
      <details className="bg-gray-50 p-4 rounded-lg">
        <summary className="cursor-pointer font-medium">Debug Information</summary>
        <div className="mt-2 text-sm space-y-1">
          <div><strong>State:</strong> {state}</div>
          <div><strong>Is Listening:</strong> {isListening ? 'Yes' : 'No'}</div>
          <div><strong>Is Supported:</strong> {isSupported ? 'Yes' : 'No'}</div>
          <div><strong>Has Error:</strong> {error ? 'Yes' : 'No'}</div>
          <div><strong>Transcript Length:</strong> {transcript.length} characters</div>
          <div><strong>Interim Length:</strong> {interimTranscript.length} characters</div>
        </div>
      </details>
    </div>
  );
};

export default VoiceInputDemo;
