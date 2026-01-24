'use client';

import { useState, useRef } from 'react';
import { Camera, X, Check, Spinner } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  kidId: string;
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

// Compress image to max 500x500 and convert to JPEG
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions (max 500x500, maintaining aspect ratio)
      let width = img.width;
      let height = img.height;
      const maxSize = 500;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.85 // Quality 85%
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarUpload({ kidId, currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    
    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Compress image
      const compressedBlob = await compressImage(selectedFile);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', compressedBlob, 'avatar.jpg');
      
      // Upload via API (handles RLS bypass for kid sessions)
      const res = await fetch(`/api/kids/${kidId}/avatar`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      toast.success('Avatar updated!');
      onUploadComplete(data.avatarUrl);
      
      // Clean up
      setPreviewUrl(null);
      setSelectedFile(null);
      
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-3">
      {/* Current or Preview Avatar */}
      <div className="relative w-24 h-24 mx-auto">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full rounded-full object-cover border-4 border-[var(--nebula-purple)]"
          />
        ) : currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt="Current avatar" 
            className="w-full h-full rounded-full object-cover border-2 border-[var(--border)]"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
            <Camera size={32} className="text-muted" />
          </div>
        )}
        
        {/* Upload button overlay */}
        {!previewUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)] text-[var(--foreground)] rounded-full shadow-lg transition-colors"
          >
            <Camera size={16} weight="fill" />
          </button>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Action buttons when preview is shown */}
      {previewUrl && (
        <div className="flex justify-center gap-2">
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-muted dark:text-muted hover:bg-[var(--hover-overlay)] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium bg-[var(--nebula-purple)] hover:bg-[var(--nebula-purple-dark)] text-[var(--foreground)] rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <Spinner size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check size={16} weight="bold" />
                Save Avatar
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Help text */}
      {!previewUrl && (
        <p className="text-center text-xs text-muted">
          Click the camera to upload a custom photo
        </p>
      )}
    </div>
  );
}
