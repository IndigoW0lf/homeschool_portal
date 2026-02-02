'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { LocalOpenPeepsAvatar } from '@/components/LocalOpenPeepsAvatar';
import type { OpenPeepsAvatarState } from '@/types';

interface StudentAvatarProps {
  name: string;
  avatarUrl?: string; // Optional URL for the image
  openPeepsState?: OpenPeepsAvatarState | null; // New: Open Peeps avatar state
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string; // Fallback color class if no image
}

export function StudentAvatar({ 
  name, 
  avatarUrl, 
  openPeepsState,
  size = 'md', 
  className,
  color
}: StudentAvatarProps) {
  
  // Size in pixels for OpenPeepsAvatar
  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96
  };

  // Slightly larger font sizes for better readability
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',      // was text-xs
    md: 'w-10 h-10 text-base',  // was text-sm
    lg: 'w-16 h-16 text-xl',    // was text-lg
    xl: 'w-24 h-24 text-3xl'    // was text-2xl
  };

  const initials = name.slice(0, 2).toUpperCase();

  // Prefer Open Peeps avatar if state is provided
  if (openPeepsState) {
    return (
      <div className={cn('rounded-full overflow-hidden flex-shrink-0', className)}>
        <LocalOpenPeepsAvatar
          size={sizePixels[size]}
          pose={openPeepsState.pose || 'standing_shirt1'}
          face={openPeepsState.face}
          head={openPeepsState.head}
          accessories={openPeepsState.accessories}
          facialHair={openPeepsState.facialHair}
          backgroundColor={openPeepsState.backgroundColor}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        // Stronger border for light mode visibility
        'relative rounded-full flex items-center justify-center font-bold overflow-hidden',
        'border-2 border-[var(--border)] shadow-sm transition-transform hover:scale-105',
        sizeClasses[size],
        // Using celestial/midnight-bloom for avatar backgrounds with darker text
        !avatarUrl && (color || 'bg-[var(--midnight-bloom)] text-[var(--foreground)] dark:text-[var(--foreground)]'),
        // Light mode: use darker text for better contrast on light backgrounds
        !avatarUrl && !color && 'text-[#5A5A5A] dark:text-[var(--foreground)]',
        className
      )}
    >
      {avatarUrl ? (
        <Image 
          src={avatarUrl} 
          alt={name} 
          fill 
          className="object-cover"
        />
      ) : (
        <span className="font-semibold">{initials}</span>
      )}
    </div>
  );
}

