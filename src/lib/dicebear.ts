import { createAvatar } from '@dicebear/core';
import { bigEars } from '@dicebear/collection';

interface DiceBearOptions {
  seed: string;
  size?: number;
}

/**
 * Generate a DiceBear avatar URL
 * Using 'big-ears' style which is cute and works well to layer clothing
 */
export function getDiceBearAvatarUrl({ seed, size = 200 }: DiceBearOptions): string {
  const avatar = createAvatar(bigEars, {
    seed,
    size,
    // Consistent styling options
    backgroundColor: ['transparent'],
    // You can add more options here to customize the base avatars
  });

  // Convert to SVG string as data URL
  return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`;
}

/**
 * Get a list of different base avatars to choose from
 */
export function getBaseAvatarOptions(): Array<{ id: string; label: string; seed: string }> {
  return [
    { id: 'base-kid-01', label: 'Kid 1', seed: 'happy-kid-1' },
    { id: 'base-kid-02', label: 'Kid 2', seed: 'cheerful-kid-2' },
    { id: 'base-kid-03', label: 'Kid 3', seed: 'smiling-kid-3' },
    { id: 'base-kid-04', label: 'Kid 4', seed: 'joyful-kid-4' },
    { id: 'base-kid-05', label: 'Kid 5', seed: 'playful-kid-5' },
    { id: 'base-kid-06', label: 'Kid 6', seed: 'friendly-kid-6' },
  ];
}
