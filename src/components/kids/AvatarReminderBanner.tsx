'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkle, X } from '@phosphor-icons/react';

interface AvatarReminderBannerProps {
  kidId: string;
  hasAvatarState: boolean;
  kidName: string;
}

/**
 * Shows a monthly reminder to set up avatar if not configured
 */
export function AvatarReminderBanner({ kidId, hasAvatarState, kidName }: AvatarReminderBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Don't show if avatar is already set up
    if (hasAvatarState) {
      return;
    }

    // Check if we should show the reminder
    const storageKey = `avatar-reminder-${kidId}`;
    const lastShown = localStorage.getItem(storageKey);
    
    if (!lastShown) {
      // First time - show it
      setIsDismissed(false);
      localStorage.setItem(storageKey, new Date().toISOString());
    } else {
      // Check if it's been a month
      const lastShownDate = new Date(lastShown);
      const now = new Date();
      const daysSinceLastShown = Math.floor((now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastShown >= 30) {
        setIsDismissed(false);
        localStorage.setItem(storageKey, now.toISOString());
      }
    }
  }, [kidId, hasAvatarState]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (isDismissed || hasAvatarState) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300 dark:border-purple-700 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkle size={24} weight="duotone" className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Hey {kidName}, create your avatar! ✨
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Make your profile special by building a custom avatar. Pick your favorite outfit and colors!
          </p>
          <Link
            href={`/kids/${kidId}/avatar`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors text-sm"
          >
            <Sparkle size={16} weight="fill" />
            Build Avatar
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}
