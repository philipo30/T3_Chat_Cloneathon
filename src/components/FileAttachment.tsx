import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Download, Eye, X } from 'lucide-react';
import { Button } from './ui/button';
import type { FileAttachment as FileAttachmentType } from '@/lib/types';
import { formatFileSize, getFileTypeDisplayName } from '@/lib/utils/file-upload';

interface FileAttachmentProps {
  attachment: FileAttachmentType;
  className?: string;
  compact?: boolean;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachment,
  className = '',
  compact = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = () => {
    if (attachment.type === 'image') {
      setIsExpanded(true);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create download link
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderImageAttachment = () => {
    if (compact) {
      return (
        <div className="inline-flex items-center gap-2 bg-chat-input-form-background border border-chat-input-form-border rounded-lg px-3 py-2">
          <ImageIcon className="w-4 h-4 text-chat-input-button-text" />
          <span className="text-sm text-chat-input-text">{attachment.name}</span>
          <Button
            type="button"
            onClick={handleDownload}
            className="p-1 h-auto bg-transparent hover:bg-chat-input-send-button-background text-chat-input-button-text"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    if (imageError || !attachment.preview) {
      return (
        <div className="w-full max-w-sm bg-chat-input-form-background border border-chat-input-form-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-chat-input-form-background rounded-lg flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-chat-input-button-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-chat-input-text truncate">
                {attachment.name}
              </p>
              <p className="text-xs text-chat-input-button-text">
                {getFileTypeDisplayName(attachment.mimeType)} • {formatFileSize(attachment.size)}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleDownload}
              className="p-2 h-auto bg-transparent hover:bg-chat-input-send-button-background text-chat-input-button-text"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full max-w-sm bg-chat-input-form-background border border-chat-input-form-border rounded-lg overflow-hidden group">
        <div className="relative">
          <img
            src={attachment.preview}
            alt={attachment.name}
            className="w-full h-48 object-cover cursor-pointer"
            onError={handleImageError}
            onClick={handleImageClick}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleImageClick}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <p className="text-sm font-medium text-chat-input-text truncate">
            {attachment.name}
          </p>
          <p className="text-xs text-chat-input-button-text">
            {getFileTypeDisplayName(attachment.mimeType)} • {formatFileSize(attachment.size)}
          </p>
        </div>
      </div>
    );
  };

  const renderPDFAttachment = () => {
    return (
      <div className={`
        w-full max-w-sm bg-chat-input-form-background border border-chat-input-form-border 
        rounded-lg p-4 hover:border-chat-input-send-button-background transition-colors
        ${compact ? 'inline-flex items-center gap-3 max-w-none' : ''}
      `}>
        <div className={`flex items-center gap-3 ${compact ? '' : 'w-full'}`}>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-chat-input-text truncate">
              {attachment.name}
            </p>
            <p className="text-xs text-chat-input-button-text">
              {getFileTypeDisplayName(attachment.mimeType)} • {formatFileSize(attachment.size)}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleDownload}
            className="p-2 h-auto bg-transparent hover:bg-chat-input-send-button-background text-chat-input-button-text flex-shrink-0"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={className}>
        {attachment.type === 'image' ? renderImageAttachment() : renderPDFAttachment()}
      </div>

      {/* Expanded Image Modal */}
      {isExpanded && attachment.type === 'image' && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-5xl max-h-full">
            <Button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="absolute -top-12 right-0 w-10 h-10 p-0 bg-white/20 hover:bg-white/30 text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <img
              src={attachment.data}
              alt={attachment.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{attachment.name}</p>
                  <p className="text-sm opacity-80">
                    {getFileTypeDisplayName(attachment.mimeType)} • {formatFileSize(attachment.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleDownload}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full"
                  title="Download image"
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
