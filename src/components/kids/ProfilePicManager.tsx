'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfilePhotoUpload } from '@/components/ui/ProfilePhotoUpload';
import { OpenPeepsAvatarBuilder } from '@/components/OpenPeepsAvatarBuilder';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';

interface ProfilePicManagerProps {
  kidId: string;
  initialType?: 'avatar' | 'photo';
  currentPhotoUrl?: string | null;
}

export function ProfilePicManager({ kidId, initialType = 'avatar', currentPhotoUrl }: ProfilePicManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'avatar' | 'photo'>(initialType);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleTabChange = async (tab: 'avatar' | 'photo') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsSwitching(true);

    try {
      const { error } = await supabase
        .from('kids')
        .update({ profile_pic_type: tab })
        .eq('id', kidId);
        
      if (error) throw error;
      
      router.refresh();
      toast.success(`Profile picture switched to ${tab}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to switch profile picture type.');
      // Revert if failed
      setActiveTab(activeTab);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-[var(--background-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg text-heading">
            Profile Picture
          </h3>
          <p className="text-sm text-muted">
            Choose how you want to appear to your family
          </p>
        </div>
        
        <div className="flex bg-[var(--background-secondary)] p-1 rounded-xl">
          <button
            onClick={() => handleTabChange('avatar')}
            disabled={isSwitching}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
              activeTab === 'avatar' 
                ? "bg-[var(--ember-500)] text-[var(--foreground)] shadow-sm"
                : "text-muted hover:text-heading hover:bg-[var(--hover-overlay)]"
            )}
          >
            ✨ Avatar
          </button>
          <button
            onClick={() => handleTabChange('photo')}
            disabled={isSwitching}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
              activeTab === 'photo'
                ? "bg-[var(--ember-500)] text-[var(--foreground)] shadow-sm"
                : "text-muted hover:text-heading hover:bg-[var(--hover-overlay)]"
            )}
          >
            📷 Photo
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'avatar' ? (
          <OpenPeepsAvatarBuilder kidId={kidId} />
        ) : (
          <div className="max-w-md mx-auto py-8">
            <ProfilePhotoUpload 
              entityId={kidId}
              entityType="kid"
              currentPhotoUrl={currentPhotoUrl}
              onUploadComplete={() => {
                router.refresh();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
