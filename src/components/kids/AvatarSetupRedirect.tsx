'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AvatarSetupRedirectProps {
  kidId: string;
  hasAvatarState: boolean;
  lastLoginAt: string | null | undefined;
}

/**
 * Redirects kids to avatar setup on their first login
 */
export function AvatarSetupRedirect({ kidId, hasAvatarState, lastLoginAt }: AvatarSetupRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if this is the first login (no lastLoginAt or it's from today)
    const isFirstLogin = !lastLoginAt || isToday(new Date(lastLoginAt));
    
    // If first login and no avatar state, redirect to avatar builder
    if (isFirstLogin && !hasAvatarState) {
      router.push(`/kids/${kidId}/avatar`);
    }
  }, [kidId, hasAvatarState, lastLoginAt, router]);

  return null;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
