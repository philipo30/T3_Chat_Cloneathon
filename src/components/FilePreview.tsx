import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Image as ImageIcon, Download, Eye } from 'lucide-react';
import { Button } from './ui/button';
import type { FileAttachment } from '@/lib/types';
import { formatFileSize, getFileTypeDisplayName } from '@/lib/utils/file-upload';

interface FilePreviewProps {
  attachment: FileAttachment;
  onRemove?: (attachmentId: string) => void;
  showRemoveButton?: boolean;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  attachment,
  onRemove,
  showRemoveButton = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRemove = () => {
    onRemove?.(attachment.id);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Image clicked:', attachment.name, attachment.type);
    if (attachment.type === 'image') {
      console.log('Setting expanded to true');
      setIsExpanded(true);
    }
  };

  const handleDownload = () => {
    // Create download link
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderImagePreview = () => {
    // Use the actual image data if preview is not available
    const imageSource = attachment.preview || attachment.data;

    if (imageError || !imageSource) {
      return (
        <div className="w-full h-20 bg-chat-input-form-background flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-chat-input-button-text" />
        </div>
      );
    }

    return (
      <div className="relative w-full h-20 bg-chat-input-form-background overflow-hidden group">
        <img
          src={imageSource}
          alt={attachment.name}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={handleImageError}
          onClick={handleImageClick}
        />
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
          onClick={handleImageClick}
        >
          <Eye className="w-4 h-4 text-white drop-shadow-lg" />
        </div>
      </div>
    );
  };

  const renderPDFPreview = () => {
    return (
      <div className="w-full h-20 bg-red-50 flex items-center justify-center">
        <FileText className="w-8 h-8 text-red-600" />
      </div>
    );
  };

  return (
    <>
      <div className={`
        relative bg-chat-input-form-background border border-chat-input-form-border
        rounded-lg overflow-hidden transition-all duration-200 hover:border-chat-input-send-button-background
        ${className}
      `}>
        {/* Remove Button */}
        {showRemoveButton && (
          <Button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10 shadow-lg"
          >
            <X className="w-3 h-3" />
          </Button>
        )}

        {/* File Preview */}
        {attachment.type === 'image' ? renderImagePreview() : renderPDFPreview()}

        {/* File Info */}
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-chat-input-text truncate pr-2">
              {attachment.name} {isExpanded && '(EXPANDED)'}
            </p>
            {!showRemoveButton && (
              <Button
                type="button"
                onClick={handleDownload}
                className="p-1 h-auto bg-transparent hover:bg-chat-input-send-button-background text-chat-input-button-text"
                title="Download file"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-chat-input-button-text">
            <span>{getFileTypeDisplayName(attachment.mimeType)}</span>
            <span>{formatFileSize(attachment.size)}</span>
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {isExpanded && attachment.type === 'image' && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-5xl max-h-full flex flex-col">
            {/* Close button */}
            <Button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="absolute -top-12 right-0 w-10 h-10 p-0 bg-white/20 hover:bg-white/30 text-white rounded-full z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Image */}
            <div className="relative">
              <img
                src={attachment.data}
                alt={attachment.name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Image info */}
            <div className="mt-4 bg-black/60 backdrop-blur-sm text-white p-4 rounded-lg">
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
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                  title="Download image"
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
