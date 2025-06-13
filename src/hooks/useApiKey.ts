import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'openrouter_api_key';

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const saveApiKey = (newApiKey: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
    setApiKey(newApiKey);
  };

  const removeApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
  };

  return { apiKey, saveApiKey, removeApiKey };
} 