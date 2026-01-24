'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface StudentAvatarProps {
  name: string;
  avatarUrl?: string; // Optional URL for the image
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string; // Fallback color class if no image
}

export function StudentAvatar({ 
  name, 
  avatarUrl, 
  size = 'md', 
  className,
  color
}: StudentAvatarProps) {
  
  // Slightly larger font sizes for better readability
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',      // was text-xs
    md: 'w-10 h-10 text-base',  // was text-sm
    lg: 'w-16 h-16 text-xl',    // was text-lg
    xl: 'w-24 h-24 text-3xl'    // was text-2xl
  };

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div 
      className={cn(
        // Stronger border for light mode visibility
        'relative rounded-full flex items-center justify-center font-bold overflow-hidden',
        'border-2 border-[var(--border)] shadow-sm transition-transform hover:scale-105',
        sizeClasses[size],
        // Using celestial/midnight-bloom for avatar backgrounds
        !avatarUrl && (color || 'bg-[var(--midnight-bloom)] text-[var(--foreground)]'),
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
