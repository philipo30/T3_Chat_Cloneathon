import type { FileAttachment } from '@/lib/types';

// Thumbnail generation options
export interface ThumbnailOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1 for JPEG quality
}

// Default thumbnail options
export const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  maxWidth: 200,
  maxHeight: 200,
  quality: 0.8,
};

// Generate thumbnail for image file
export function generateImageThumbnail(
  file: File,
  options: ThumbnailOptions = DEFAULT_THUMBNAIL_OPTIONS
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    img.onload = () => {
      // Calculate thumbnail dimensions while maintaining aspect ratio
      const { width, height } = calculateThumbnailDimensions(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      );
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const thumbnailData = canvas.toDataURL('image/jpeg', options.quality);
      resolve(thumbnailData);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail generation'));
    };
    
    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Calculate thumbnail dimensions while maintaining aspect ratio
      const { width, height } = calculateThumbnailDimensions(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      );
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const thumbnailData = canvas.toDataURL('image/jpeg', options.quality);
      resolve(thumbnailData);
    };
  });
}

// Calculate thumbnail dimensions maintaining aspect ratio
export function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

// Generate preview for file attachment
export async function generateFilePreview(file: File): Promise<string | undefined> {
  // Only generate previews for images
  if (!file.type.startsWith('image/')) {
    return undefined;
  }
  
  try {
    return await generateImageThumbnail(file);
  } catch (error) {
    console.warn('Failed to generate thumbnail for image:', error);
    return undefined;
  }
}

// Update file attachment with preview
export async function addPreviewToAttachment(
  attachment: FileAttachment,
  file: File
): Promise<FileAttachment> {
  if (attachment.type === 'image') {
    const preview = await generateFilePreview(file);
    return {
      ...attachment,
      preview,
    };
  }
  
  return attachment;
}

// Get file icon based on type
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  }
  
  if (mimeType === 'application/pdf') {
    return '📄';
  }
  
  return '📎';
}



// Check if file can have a preview
export function canGeneratePreview(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Create a blob URL for file preview
export function createFilePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

// Revoke blob URL to free memory
export function revokeFilePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

// Compress image if it's too large
export function compressImage(
  file: File,
  maxSizeBytes: number,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeBytes) {
      resolve(file);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    img.onload = () => {
      // Set canvas to original image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create new file from compressed blob
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Set canvas to original image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create new file from compressed blob
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
  });
}

// Extract basic metadata from file
export function extractFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
  };
}
