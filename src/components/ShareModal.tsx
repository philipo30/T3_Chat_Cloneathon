"use client"

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Calendar,
  Trash2,
  ExternalLink,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { shareService } from "@/lib/supabase/share-service";
import type { SharedChat, ShareSettings } from "@/lib/supabase/database.types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  chatId,
  chatTitle,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [existingShares, setExistingShares] = useState<SharedChat[]>([]);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    is_public: true,
    password: "",
    expires_at: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [expirationDays, setExpirationDays] = useState<string>("");

  // Load existing shares when modal opens
  useEffect(() => {
    if (isOpen && chatId) {
      loadExistingShares();
    }
  }, [isOpen, chatId]);

  const loadExistingShares = async () => {
    try {
      const shares = await shareService.getChatShares(chatId);
      setExistingShares(shares);
    } catch (error) {
      console.error("Failed to load existing shares:", error);
      toast.error("Failed to load existing shares");
    }
  };

  const handleCreateShare = async () => {
    setIsLoading(true);
    try {
      // Calculate expiration date if specified
      let expiresAt = null;
      if (expirationDays && parseInt(expirationDays) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(expirationDays));
        expiresAt = expDate.toISOString();
      }

      const settings: ShareSettings = {
        is_public: shareSettings.is_public,
        password: shareSettings.password || undefined,
        expires_at: expiresAt,
      };

      const newShare = await shareService.createShare(chatId, settings);
      
      // Refresh the shares list
      await loadExistingShares();
      
      // Reset form
      setShareSettings({
        is_public: true,
        password: "",
        expires_at: null,
      });
      setExpirationDays("");
      
      toast.success("Share link created successfully!");
    } catch (error) {
      console.error("Failed to create share:", error);
      toast.error("Failed to create share link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (shareId: string) => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareId(shareId);
      toast.success("Link copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedShareId(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await shareService.revokeShare(shareId);
      await loadExistingShares();
      toast.success("Share link revoked successfully!");
    } catch (error) {
      console.error("Failed to revoke share:", error);
      toast.error("Failed to revoke share link");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md share-modal-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Share "{chatTitle}" with others through a secure link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Shares */}
          {existingShares.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Existing Shares</Label>
              {existingShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      {share.is_public ? (
                        <Eye className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                      )}
                      <span className="font-medium">
                        {share.is_public ? "Public" : "Password Protected"}
                      </span>
                      {share.expires_at && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isExpired(share.expires_at) 
                            ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300" 
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                        }`}>
                          {isExpired(share.expires_at) ? "Expired" : `Expires ${formatDate(share.expires_at)}`}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Views: {share.view_count} • Created {formatDate(share.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(share.share_id)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedShareId === share.share_id ? (
                        <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/share/${share.share_id}`, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeShare(share.share_id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Share */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Create New Share</Label>
            
            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Public Access</Label>
                <p className="text-xs text-muted-foreground">
                  Anyone with the link can view this chat
                </p>
              </div>
              <Switch
                checked={shareSettings.is_public}
                onCheckedChange={(checked) =>
                  setShareSettings({ ...shareSettings, is_public: checked })
                }
              />
            </div>

            {/* Password Protection */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password Protection (Optional)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={shareSettings.password}
                  onChange={(e) =>
                    setShareSettings({ ...shareSettings, password: e.target.value })
                  }
                  placeholder="Enter password to protect this share"
                  className="pr-10"
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

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiration" className="text-sm">
                Expiration (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="expiration"
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  placeholder="7"
                  className="w-20"
                  min="1"
                  max="365"
                />
                <span className="text-sm text-muted-foreground">days from now</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateShare} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Share Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
