'use client';

interface AvatarSetupRedirectProps {
  kidId: string;
  hasAvatarState: boolean;
  lastLoginAt: string | null | undefined;
}

/**
 * Previously redirected kids to avatar setup on first login.
 * Now disabled - we rely on AvatarReminderBanner for gentle prompting instead.
 * Keeping component for backward compatibility.
 */
export function AvatarSetupRedirect({ kidId, hasAvatarState, lastLoginAt }: AvatarSetupRedirectProps) {
  // No automatic redirect - let users navigate freely
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
