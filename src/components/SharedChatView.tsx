"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Calendar, MessageSquare, ExternalLink, GitFork, LogIn } from "lucide-react";
import { toast } from "sonner";
import { shareService } from "@/lib/supabase/share-service";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useAuth } from "@/hooks/useAuth";
import { useShare } from "@/hooks/useShare";
import { useRouter } from "next/navigation";
import type { SharedChatWithMessages } from "@/lib/supabase/database.types";

interface SharedChatViewProps {
  shareId: string;
}

export const SharedChatView: React.FC<SharedChatViewProps> = ({ shareId }) => {
  const [sharedChat, setSharedChat] = useState<SharedChatWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { forkSharedChat, isForkingChat, forkedChatId } = useShare();
  const router = useRouter();

  useEffect(() => {
    loadSharedChat();
  }, [shareId]);

  // Redirect to forked chat when fork is successful
  useEffect(() => {
    if (forkedChatId) {
      router.push(`/chat/${forkedChatId}`);
    }
  }, [forkedChatId, router]);

  const loadSharedChat = async (passwordAttempt?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const chat = await shareService.getSharedChat(shareId, passwordAttempt);
      console.log('Loaded shared chat:', chat);
      console.log('Messages count:', chat.messages?.length || 0);
      setSharedChat(chat);
      setNeedsPassword(false);
    } catch (error: any) {
      console.error("Failed to load shared chat:", error);
      
      if (error.message === "Password required") {
        setNeedsPassword(true);
        setError("This shared chat is password protected.");
      } else if (error.message === "Invalid password") {
        setNeedsPassword(true);
        setError("Invalid password. Please try again.");
      } else if (error.message === "This shared chat has expired") {
        setError("This shared chat has expired and is no longer available.");
      } else if (error.message === "Shared chat not found") {
        setError("This shared chat could not be found. It may have been removed or the link is invalid.");
      } else {
        setError("Failed to load shared chat. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      loadSharedChat(password);
    }
  };

  const handleForkChat = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    forkSharedChat({ 
      shareId, 
      password: needsPassword ? password : undefined 
    });
  };

  const handleSignInToFork = () => {
    router.push('/auth/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Assistant';
      case 'system':
        return 'System';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              This shared chat is password protected. Please enter the password to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={!password.trim()}>
                Access Chat
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !needsPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Unable to Load Chat</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sharedChat) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-app-main-background/80 backdrop-blur-sm border-b border-app-main-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">{sharedChat.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(sharedChat.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {sharedChat.view_count} views
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!authLoading && (
                <>
                  {user ? (
                    <Button
                      onClick={handleForkChat}
                      disabled={isForkingChat}
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text border border-primary-button-border"
                    >
                      <GitFork className="w-4 h-4" />
                      {isForkingChat ? "Forking..." : "Fork Chat"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSignInToFork}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in to fork
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visit T3 Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {sharedChat.messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No messages found in this chat.</p>
            </div>
          )}
          {sharedChat.messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3'
                    : 'bg-transparent'
                }`}
              >
                {message.role !== 'user' && (
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {formatRole(message.role)}
                  </div>
                )}
                
                <div className={message.role === 'user' ? 'text-primary-foreground' : ''}>
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-2 opacity-70">
                  {formatDate(message.created_at)}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-medium text-primary">U</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-app-main-border text-center">
          <p className="text-sm text-muted-foreground">
            This chat was shared from{" "}
            <a 
              href="/" 
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              T3 Chat Cloneathon
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
