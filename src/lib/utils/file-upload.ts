import type { FileAttachment } from '@/lib/types';

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  PDF: 20 * 1024 * 1024,   // 20MB
  TOTAL_PER_MESSAGE: 50 * 1024 * 1024, // 50MB
} as const;

// Maximum number of files per message
export const MAX_FILES_PER_MESSAGE = 10;

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
] as const;

export const SUPPORTED_PDF_TYPES = [
  'application/pdf',
] as const;

export const SUPPORTED_FILE_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_PDF_TYPES,
] as const;

// File validation errors
export class FileValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

// Validate file type
export function validateFileType(file: File): void {
  if (!SUPPORTED_FILE_TYPES.includes(file.type as any)) {
    throw new FileValidationError(
      `Unsupported file type: ${file.type}. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`,
      'UNSUPPORTED_TYPE'
    );
  }
}

// Validate file size
export function validateFileSize(file: File): void {
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type as any);
  const isPDF = SUPPORTED_PDF_TYPES.includes(file.type as any);
  
  if (isImage && file.size > FILE_SIZE_LIMITS.IMAGE) {
    throw new FileValidationError(
      `Image file too large: ${formatFileSize(file.size)}. Maximum size: ${formatFileSize(FILE_SIZE_LIMITS.IMAGE)}`,
      'IMAGE_TOO_LARGE'
    );
  }
  
  if (isPDF && file.size > FILE_SIZE_LIMITS.PDF) {
    throw new FileValidationError(
      `PDF file too large: ${formatFileSize(file.size)}. Maximum size: ${formatFileSize(FILE_SIZE_LIMITS.PDF)}`,
      'PDF_TOO_LARGE'
    );
  }
}

// Validate total size of multiple files
export function validateTotalSize(files: File[]): void {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  if (totalSize > FILE_SIZE_LIMITS.TOTAL_PER_MESSAGE) {
    throw new FileValidationError(
      `Total file size too large: ${formatFileSize(totalSize)}. Maximum total size: ${formatFileSize(FILE_SIZE_LIMITS.TOTAL_PER_MESSAGE)}`,
      'TOTAL_SIZE_TOO_LARGE'
    );
  }
}

// Validate number of files
export function validateFileCount(files: File[]): void {
  if (files.length > MAX_FILES_PER_MESSAGE) {
    throw new FileValidationError(
      `Too many files: ${files.length}. Maximum files per message: ${MAX_FILES_PER_MESSAGE}`,
      'TOO_MANY_FILES'
    );
  }
}

// Comprehensive file validation
export function validateFiles(files: File[]): void {
  validateFileCount(files);
  validateTotalSize(files);
  
  files.forEach(file => {
    validateFileType(file);
    validateFileSize(file);
  });
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    
    reader.readAsDataURL(file);
  });
}

// Get file type category
export function getFileType(mimeType: string): 'image' | 'pdf' {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType as any)) {
    return 'image';
  }
  if (SUPPORTED_PDF_TYPES.includes(mimeType as any)) {
    return 'pdf';
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate unique file ID
export function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Convert File to FileAttachment
export async function fileToAttachment(file: File): Promise<FileAttachment> {
  const base64Data = await fileToBase64(file);
  
  return {
    id: generateFileId(),
    name: file.name,
    type: getFileType(file.type),
    mimeType: file.type,
    size: file.size,
    data: base64Data,
    uploadedAt: new Date().toISOString(),
  };
}

// Process multiple files
export async function processFiles(files: File[]): Promise<FileAttachment[]> {
  // Validate all files first
  validateFiles(files);
  
  // Convert all files to attachments
  const attachments = await Promise.all(
    files.map(file => fileToAttachment(file))
  );
  
  return attachments;
}

// Check if file is an image
export function isImageFile(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as any);
}

// Check if file is a PDF
export function isPDFFile(mimeType: string): boolean {
  return SUPPORTED_PDF_TYPES.includes(mimeType as any);
}

// Get file extension from name
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Get file type display name
export function getFileTypeDisplayName(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPEG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'application/pdf': 'PDF Document',
  };

  return typeMap[mimeType] || 'Unknown File';
}

// Validate file extension matches MIME type
export function validateFileExtension(file: File): void {
  const extension = getFileExtension(file.name);
  const mimeType = file.type;
  
  // Basic validation - could be more comprehensive
  if (mimeType === 'image/jpeg' && !['jpg', 'jpeg'].includes(extension)) {
    throw new FileValidationError(
      `File extension "${extension}" doesn't match MIME type "${mimeType}"`,
      'EXTENSION_MISMATCH'
    );
  }
  
  if (mimeType === 'image/png' && extension !== 'png') {
    throw new FileValidationError(
      `File extension "${extension}" doesn't match MIME type "${mimeType}"`,
      'EXTENSION_MISMATCH'
    );
  }
  
  if (mimeType === 'application/pdf' && extension !== 'pdf') {
    throw new FileValidationError(
      `File extension "${extension}" doesn't match MIME type "${mimeType}"`,
      'EXTENSION_MISMATCH'
    );
  }
}
