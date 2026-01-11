'use client';

import { useState } from 'react';
import { AvatarUpload } from './AvatarUpload';
import { useRouter } from 'next/navigation';

interface AvatarUploadWrapperProps {
  kidId: string;
  currentAvatarUrl?: string | null;
}

export function AvatarUploadWrapper({ kidId, currentAvatarUrl }: AvatarUploadWrapperProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  
  const handleUploadComplete = (url: string) => {
    setAvatarUrl(url);
    // Refresh the page to show new avatar
    router.refresh();
  };
  
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 text-center">
        📸 Upload Your Photo
      </h3>
      <AvatarUpload 
        kidId={kidId}
        currentAvatarUrl={avatarUrl}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
