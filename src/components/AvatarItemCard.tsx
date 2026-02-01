'use client';

import { OpenPeepsAvatar } from './OpenPeepsAvatar';

interface AvatarItemCardProps {
  category: 'face' | 'head' | 'accessories' | 'facialHair';
  itemId: string;
  label: string;
  cost: number;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: () => void;
}

export function AvatarItemCard({
  category,
  itemId,
  label,
  cost,
  isOwned,
  canAfford,
  onPurchase,
}: AvatarItemCardProps) {
  // Build preview props based on category
  const previewProps: Record<string, string> = {
    skinColor: 'd08b5b',
    clothingColor: '8fa7df',
    backgroundColor: 'transparent',
  };

  // Set the specific customization for this item
  switch (category) {
    case 'face':
      previewProps.face = itemId;
      previewProps.head = 'short1';
      break;
    case 'head':
      previewProps.face = 'smile';
      previewProps.head = itemId;
      break;
    case 'accessories':
      previewProps.face = 'smile';
      previewProps.head = 'short1';
      previewProps.accessories = itemId;
      break;
    case 'facialHair':
      previewProps.face = 'smile';
      previewProps.head = 'short1';
      previewProps.facialHair = itemId;
      break;
  }

  return (
    <div className="relative bg-[var(--background-elevated)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center gap-3 hover:border-[var(--ember-300)] transition-colors">
      {/* Preview */}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[var(--celestial-50)] to-[var(--moon-100)] dark:from-[var(--celestial-900)]/20 dark:to-[var(--moon-900)]/20 flex items-center justify-center">
        <OpenPeepsAvatar
          seed={`shop-${itemId}`}
          size={72}
          radius={50}
          {...previewProps}
        />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-[var(--foreground)] text-center">
        {label}
      </span>

      {/* Action button */}
      {isOwned ? (
        <div className="px-4 py-1.5 bg-[var(--growth-100)] dark:bg-[var(--growth-900)]/30 text-[var(--growth-600)] dark:text-[var(--growth-400)] rounded-full text-sm font-medium">
          ✓ Owned
        </div>
      ) : (
        <button
          onClick={onPurchase}
          disabled={!canAfford}
          className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${
            canAfford
              ? 'bg-[var(--ember-500)] text-white hover:opacity-90 active:scale-95'
              : 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'
          }`}
        >
          <span>{cost}</span>
          <span>🌙</span>
        </button>
      )}

      {/* Locked overlay */}
      {!isOwned && !canAfford && (
        <div className="absolute inset-0 bg-[var(--background)]/50 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </div>
  );
}
