import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import type { FileAttachment } from '@/lib/types';
import {
  validateFiles,
  processFiles,
  FileValidationError,
  formatFileSize,
  SUPPORTED_FILE_TYPES,
} from '@/lib/utils/file-upload';
import { FilePreview } from './FilePreview';

interface FileUploadProps {
  onFilesSelected: (attachments: FileAttachment[]) => void;
  onFilesRemoved: (attachmentIds: string[]) => void;
  currentAttachments: FileAttachment[];
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFilesRemoved,
  currentAttachments,
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      const attachments = await processFiles(files);
      onFilesSelected(attachments);
    } catch (err) {
      if (err instanceof FileValidationError) {
        setError(err.message);
      } else {
        setError('Failed to process files. Please try again.');
        console.error('File processing error:', err);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onFilesSelected]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  }, [disabled, isProcessing]);

  // Handle file removal
  const handleRemoveFile = useCallback((attachmentId: string) => {
    onFilesRemoved([attachmentId]);
  }, [onFilesRemoved]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const acceptedTypes = SUPPORTED_FILE_TYPES.join(',');

  return (
    <div className={`space-y-3 ${className}`}>
      {/* File Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragOver 
            ? 'border-chat-input-send-button-background bg-chat-input-send-button-background/10' 
            : 'border-chat-input-button-border hover:border-chat-input-send-button-background'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isProcessing ? 'opacity-75' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isDragOver 
              ? 'bg-chat-input-send-button-background text-white' 
              : 'bg-chat-input-form-background text-chat-input-button-text'
            }
          `}>
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-chat-input-text">
              {isProcessing ? 'Processing files...' : 'Drop files here or click to upload'}
            </p>
            <p className="text-xs text-chat-input-button-text">
              Supports images (PNG, JPEG, GIF, WebP) and PDF files
            </p>
            <p className="text-xs text-chat-input-button-text">
              Max 10MB per image, 20MB per PDF, 50MB total
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button
            type="button"
            onClick={clearError}
            className="p-1 h-auto bg-transparent hover:bg-red-100 text-red-500"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* File Previews */}
      {currentAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-chat-input-text">
            Selected Files ({currentAttachments.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentAttachments.map((attachment) => (
              <FilePreview
                key={attachment.id}
                attachment={attachment}
                onRemove={handleRemoveFile}
                showRemoveButton
              />
            ))}
          </div>
          <div className="text-xs text-chat-input-button-text">
            Total size: {formatFileSize(
              currentAttachments.reduce((sum, att) => sum + att.size, 0)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
