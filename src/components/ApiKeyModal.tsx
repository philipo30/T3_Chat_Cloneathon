"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(apiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <Card className="w-full max-w-md border-0 bg-login-form-background backdrop-blur-sm text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-login-form-title-text">
            OpenRouter API Key
          </CardTitle>
          <CardDescription className="text-login-form-description-text">
            You need to provide your OpenRouter API key to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input
              type="password"
              placeholder="sk-or-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-input-background text-white placeholder:text-gray-400"
            />
            <p className="text-sm text-gray-400">
              Get your API key from{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                openrouter.ai/keys
              </a>
              . Your key is stored securely in your browser&apos;s local
              storage.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={onClose}
                className="bg-transparent hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="bg-primary-button-gradient-from to-primary-button-gradient-to"
              >
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 