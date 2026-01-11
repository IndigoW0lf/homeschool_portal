'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Spinner } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/browser';
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
      
      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('kid-avatars').remove([`${kidId}/${oldPath}`]);
        }
      }
      
      // Upload new avatar with timestamp to bust cache
      const fileName = `avatar_${Date.now()}.jpg`;
      const filePath = `${kidId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kid-avatars')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('kid-avatars')
        .getPublicUrl(filePath);
      
      // Update kid record
      const { error: updateError } = await supabase
        .from('kids')
        .update({ avatar_url: publicUrl })
        .eq('id', kidId);
      
      if (updateError) throw updateError;
      
      toast.success('Avatar updated!');
      onUploadComplete(publicUrl);
      
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
            className="w-full h-full rounded-full object-cover border-4 border-purple-500"
          />
        ) : currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt="Current avatar" 
            className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Camera size={32} className="text-gray-400" />
          </div>
        )}
        
        {/* Upload button overlay */}
        {!previewUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-colors"
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
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
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
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Click the camera to upload a custom photo
        </p>
      )}
    </div>
  );
}
