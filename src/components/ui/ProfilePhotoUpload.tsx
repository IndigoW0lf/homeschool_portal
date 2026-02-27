'use client';

import { useState, useRef } from 'react';
import { Camera, X, Check, Spinner, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
  entityId: string;
  entityType: 'kid' | 'parent';
  currentPhotoUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onCancel?: () => void;
}

// Compress image to max 512x512 and convert to JPEG
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions (max 512x512, maintaining aspect ratio)
      let width = img.width;
      let height = img.height;
      const maxSize = 512;
      
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

export function ProfilePhotoUpload({ entityId, entityType, currentPhotoUrl, onUploadComplete, onCancel }: ProfilePhotoUploadProps) {
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
      formData.append('file', compressedBlob, 'photo.jpg');
      
      // Upload via appropriate API
      const endpoint = entityType === 'kid' 
        ? `/api/kids/${entityId}/avatar?type=photo` 
        : `/api/profile/photo`;
        
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      toast.success('Profile photo updated!');
      // Call with the returned URL depending on endpoint
      onUploadComplete(data.photoUrl || data.avatarUrl);
      
      // Clean up
      setPreviewUrl(null);
      setSelectedFile(null);
      
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onCancel) onCancel();
  };
  
  return (
    <div className="space-y-4">
      {/* Current or Preview Photo */}
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full rounded-full object-cover border-4 border-[var(--ember-400)] shadow-lg"
            />
          ) : currentPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentPhotoUrl} 
              alt="Current photo" 
              className="w-full h-full rounded-full object-cover border-4 border-[var(--border)] shadow-md"
            />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full rounded-full bg-[var(--background-secondary)] hover:bg-[var(--hover-overlay)] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center transition-colors group"
            >
              <ImageIcon size={32} className="text-muted group-hover:text-[var(--ember-500)] mb-1 transition-colors" />
              <span className="text-xs text-muted font-medium">Add Photo</span>
            </button>
          )}
          
          {/* Upload button overlay if we already have a photo/preview */}
          {(currentPhotoUrl || previewUrl) && !isUploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-[var(--foreground)] rounded-full shadow-lg transition-colors border-2 border-[var(--background)]"
              aria-label="Change photo"
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
          <div className="flex justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-muted hover:bg-[var(--hover-overlay)] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-[var(--foreground)] rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              {isUploading ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  Save Photo
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Help text */}
        {!previewUrl && (
          <p className="text-center text-xs text-muted max-w-[200px]">
            Upload a JPG or PNG (max 10MB)
          </p>
        )}
      </div>
    </div>
  );
}
