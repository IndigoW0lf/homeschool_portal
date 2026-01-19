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
    // Only redirect on truly first login (never logged in before)
    // NOT on every login today
    const isFirstLogin = !lastLoginAt;
    
    // If first ever login and no avatar state, redirect to avatar builder
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
