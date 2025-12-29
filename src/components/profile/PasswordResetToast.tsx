'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Client component that shows a toast when the user arrives from password reset flow
 */
export function PasswordResetToast() {
  const searchParams = useSearchParams();
  const isPasswordReset = searchParams.get('password_reset') === 'true';

  useEffect(() => {
    if (isPasswordReset) {
      toast.info('Password reset successful! You can update your password below.', {
        duration: 6000,
        icon: '🔐',
      });
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('password_reset');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isPasswordReset]);

  return null;
}
