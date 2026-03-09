'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, Spinner, Image as ImageIcon, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
  entityId: string;
  entityType: 'kid' | 'parent';
  currentPhotoUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onCancel?: () => void;
}

const CROP_SIZE = 320;
const PREVIEW_SIZE = 280; // Larger preview for crop step
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

// Crop image using position (0-100) and zoom, output CROP_SIZE square as JPEG
async function cropAndCompressImage(
  file: File,
  positionX: number,
  positionY: number,
  zoom: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      // Zoom: we show a smaller portion of the image when zoomed in
      const baseScale = Math.max(CROP_SIZE / w, CROP_SIZE / h);
      const scale = baseScale * zoom;
      const scaledW = w * scale;
      const scaledH = h * scale;
      // object-position style: point (positionX%, positionY%) of scaled image at center of viewport
      const srcXScaled = Math.max(0, (CROP_SIZE * positionX) / 100 - scaledW / 2);
      const srcYScaled = Math.max(0, (CROP_SIZE * positionY) / 100 - scaledH / 2);
      const srcW = Math.min(CROP_SIZE, scaledW - srcXScaled);
      const srcH = Math.min(CROP_SIZE, scaledH - srcYScaled);
      const ox = srcXScaled / scale;
      const oy = srcYScaled / scale;
      const ow = srcW / scale;
      const oh = srcH / scale;

      const canvas = document.createElement('canvas');
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not available'));
        return;
      }
      ctx.drawImage(img, ox, oy, ow, oh, 0, 0, CROP_SIZE, CROP_SIZE);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to crop image'));
        },
        'image/jpeg',
        0.88
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
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setCropPosition({ x: 50, y: 50 });
    setZoom(1);
  };

  const handleCropPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: cropPosition.x,
      posY: cropPosition.y,
    };
  }, [cropPosition.x, cropPosition.y]);

  const handleCropPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const sensitivity = 0.12;
    const newX = Math.max(0, Math.min(100, dragStart.current.posX - dx * sensitivity));
    const newY = Math.max(0, Math.min(100, dragStart.current.posY - dy * sensitivity));
    setCropPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleCropPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const croppedBlob = await cropAndCompressImage(
        selectedFile,
        cropPosition.x,
        cropPosition.y,
        zoom
      );

      const formData = new FormData();
      formData.append('file', croppedBlob, 'photo.jpg');

      const endpoint = entityType === 'kid'
        ? `/api/kids/${entityId}/avatar?type=photo`
        : `/api/profile/photo`;

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Upload failed');
      }

      const url = data.photoUrl ?? data.avatarUrl;
      if (url) onUploadComplete(url);

      toast.success(entityType === 'kid' ? 'Photo saved!' : 'Profile photo updated!');
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload photo';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onCancel) onCancel();
  };

  const showCropStep = Boolean(previewUrl && selectedFile);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative mb-4" style={{ width: showCropStep ? PREVIEW_SIZE : 128, height: showCropStep ? PREVIEW_SIZE : 128 }}>
          {showCropStep ? (
            <>
              <p className="text-sm font-medium text-heading mb-2 text-center">
                Adjust your photo
              </p>
              <div
                className="rounded-full overflow-hidden border-4 border-[var(--ember-400)] shadow-xl cursor-grab active:cursor-grabbing select-none touch-none bg-[var(--background-secondary)]"
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                onPointerLeave={handleCropPointerUp}
                onPointerCancel={handleCropPointerUp}
                role="img"
                aria-label="Drag to position photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl ?? ''}
                  alt=""
                  className="pointer-events-none object-cover"
                  style={{
                    width: `${100 * zoom}%`,
                    height: `${100 * zoom}%`,
                    objectPosition: `${cropPosition.x}% ${cropPosition.y}%`,
                  }}
                  draggable={false}
                />
              </div>
              {/* Zoom controls */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 0.25))}
                  disabled={zoom <= ZOOM_MIN}
                  className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-muted hover:text-heading hover:bg-[var(--hover-overlay)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Zoom out"
                >
                  <MagnifyingGlassMinus size={20} />
                </button>
                <span className="text-xs text-muted min-w-[4rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.25))}
                  disabled={zoom >= ZOOM_MAX}
                  className="p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-muted hover:text-heading hover:bg-[var(--hover-overlay)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Zoom in"
                >
                  <MagnifyingGlassPlus size={20} />
                </button>
              </div>
            </>
          ) : currentPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPhotoUrl}
              alt="Current photo"
              className="w-full h-full rounded-full object-cover object-top border-4 border-[var(--border)] shadow-md"
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

          {(currentPhotoUrl || previewUrl) && !isUploading && !showCropStep && (
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Choose profile photo"
        />

        {showCropStep && (
          <>
            <p className="text-xs text-muted mb-3 text-center max-w-[280px]">
              Drag to position and use +/- to zoom. What you see in the circle is what will be saved.
            </p>
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
          </>
        )}

        {!previewUrl && (
          <p className="text-center text-xs text-muted max-w-[200px]">
            Upload a JPG or PNG (max 10MB)
          </p>
        )}
      </div>
    </div>
  );
}
