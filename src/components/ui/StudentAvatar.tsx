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
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div 
      className={cn(
        'relative rounded-full flex items-center justify-center font-bold overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm transition-transform hover:scale-105',
        sizeClasses[size],
        !avatarUrl && (color || 'bg-gray-200 text-gray-500'),
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
        <span>{initials}</span>
      )}
    </div>
  );
}
