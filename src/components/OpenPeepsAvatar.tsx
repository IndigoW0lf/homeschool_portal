'use client';

import { useMemo } from 'react';

export interface OpenPeepsAvatarProps {
  /** Unique seed for consistent avatar generation */
  seed?: string;
  /** Avatar size in pixels */
  size?: number;
  /** Face expression */
  face?: string;
  /** Head/hair style */
  head?: string;
  /** Accessories (glasses, etc.) */
  accessories?: string;
  /** Facial hair style */
  facialHair?: string;
  /** Skin color (hex without #) */
  skinColor?: string;
  /** Clothing color (hex without #) */
  clothingColor?: string;
  /** Background color (hex without # or 'transparent') */
  backgroundColor?: string;
  /** Border radius for rounded corners */
  radius?: number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Renders a 2D avatar using the DiceBear Open Peeps API.
 * 
 * @example
 * <OpenPeepsAvatar 
 *   seed="kid-123"
 *   face="smile"
 *   head="afro"
 *   skinColor="d08b5b"
 *   size={120}
 * />
 */
export function OpenPeepsAvatar({
  seed,
  size = 120,
  face,
  head,
  accessories,
  facialHair,
  skinColor,
  clothingColor,
  backgroundColor = 'b6e3f4',
  radius = 50,
  className = '',
  alt = 'Avatar',
}: OpenPeepsAvatarProps) {
  const avatarUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    // Add seed if provided
    if (seed) params.set('seed', seed);
    
    // Size
    params.set('size', String(size));
    
    // Radius for rounded corners
    if (radius > 0) params.set('radius', String(radius));
    
    // Background
    if (backgroundColor) {
      params.set('backgroundColor', backgroundColor);
    }
    
    // Face expression - set specific face, disable randomization
    if (face) {
      params.set('face', face);
    }
    
    // Head/hair style
    if (head) {
      params.set('head', head);
    }
    
    // Accessories
    if (accessories && accessories !== 'none') {
      params.set('accessories', accessories);
      params.set('accessoriesProbability', '100');
    } else if (accessories === 'none') {
      params.set('accessoriesProbability', '0');
    }
    
    // Facial hair
    if (facialHair && facialHair !== 'none') {
      params.set('facialHair', facialHair);
      params.set('facialHairProbability', '100');
    } else if (facialHair === 'none') {
      params.set('facialHairProbability', '0');
    }
    
    // Skin color
    if (skinColor) {
      params.set('skinColor', skinColor);
    }
    
    // Clothing color
    if (clothingColor) {
      params.set('clothingColor', clothingColor);
    }
    
    // Disable mask by default for kids
    params.set('maskProbability', '0');
    
    return `https://api.dicebear.com/9.x/open-peeps/svg?${params.toString()}`;
  }, [seed, size, face, head, accessories, facialHair, skinColor, clothingColor, backgroundColor, radius]);

  return (
    <img
      src={avatarUrl}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderRadius: radius > 0 ? `${radius}%` : undefined,
      }}
      loading="lazy"
    />
  );
}

/**
 * Generate a DiceBear URL for use in backgrounds, exports, etc.
 */
export function generateOpenPeepsUrl(options: Omit<OpenPeepsAvatarProps, 'className' | 'alt'>): string {
  const {
    seed,
    size = 256,
    face,
    head,
    accessories,
    facialHair,
    skinColor,
    clothingColor,
    backgroundColor = 'b6e3f4',
    radius = 0,
  } = options;

  const params = new URLSearchParams();
  
  if (seed) params.set('seed', seed);
  params.set('size', String(size));
  if (radius > 0) params.set('radius', String(radius));
  if (backgroundColor) params.set('backgroundColor', backgroundColor);
  if (face) params.set('face', face);
  if (head) params.set('head', head);
  if (accessories && accessories !== 'none') {
    params.set('accessories', accessories);
    params.set('accessoriesProbability', '100');
  } else if (accessories === 'none') {
    params.set('accessoriesProbability', '0');
  }
  if (facialHair && facialHair !== 'none') {
    params.set('facialHair', facialHair);
    params.set('facialHairProbability', '100');
  } else if (facialHair === 'none') {
    params.set('facialHairProbability', '0');
  }
  if (skinColor) params.set('skinColor', skinColor);
  if (clothingColor) params.set('clothingColor', clothingColor);
  params.set('maskProbability', '0');

  return `https://api.dicebear.com/9.x/open-peeps/svg?${params.toString()}`;
}
