'use client';

import { AvatarState } from '@/types';

interface AvatarPreviewProps {
  avatarState?: AvatarState | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackName?: string;
  fallbackColor?: string;
  className?: string;
}

/**
 * Renders a kid's customized avatar from their saved avatar state.
 * Falls back to initials circle if no avatar state is available.
 */
export function AvatarPreview({ 
  avatarState, 
  size = 'md', 
  fallbackName = '?',
  fallbackColor,
  className = ''
}: AvatarPreviewProps) {
  const sizeConfig = {
    xs: { container: 'w-7 h-7', text: 'text-xs' },
    sm: { container: 'w-10 h-10', text: 'text-sm' },
    md: { container: 'w-14 h-14', text: 'text-lg' },
    lg: { container: 'w-20 h-20', text: 'text-2xl' },
    xl: { container: 'w-32 h-32', text: 'text-4xl' },
  };

  const { container, text } = sizeConfig[size];

  // If no avatar state, show initials fallback
  if (!avatarState || !avatarState.base) {
    const initials = fallbackName.slice(0, 1).toUpperCase();
    return (
      <div 
        className={`${container} rounded-full flex items-center justify-center text-white font-bold ${text} ${className}`}
        style={{ 
          background: fallbackColor 
            ? `linear-gradient(135deg, ${fallbackColor}, ${fallbackColor}88)`
            : 'linear-gradient(135deg, var(--sage-400), var(--lavender-400))'
        }}
      >
        {initials}
      </div>
    );
  }

  // Render the layered avatar
  return (
    <div 
      className={`${container} rounded-full relative overflow-hidden bg-[var(--paper-100)] dark:bg-gray-700 ${className}`}
      style={{ 
        boxShadow: fallbackColor 
          ? `0 0 0 3px ${fallbackColor}40` 
          : undefined 
      }}
    >
      {/* Base layer */}
      {avatarState.base && (
        <img
          src={`/assets/avatars/bases/${avatarState.base}.svg`}
          alt="Avatar base"
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
      
      {/* Outfit layer */}
      {avatarState.outfit && (
        <img
          src={
            avatarState.outfit.startsWith('custom:') 
              // Fallback for custom designs in preview (until we support full custom rendering here)
              ? '/assets/avatars/outfits/shirt-01.svg' 
              : `/assets/avatars/outfits/${avatarState.outfit}.svg`
          }
          alt="Avatar outfit"
          className="absolute inset-0 w-full h-full object-contain z-10"
        />
      )}
      
      {/* Accessory layer */}
      {avatarState.accessory && (
        <img
          src={`/assets/avatars/accessories/${avatarState.accessory}.svg`}
          alt="Avatar accessory"
          className="absolute inset-0 w-full h-full object-contain z-20"
        />
      )}
    </div>
  );
}
