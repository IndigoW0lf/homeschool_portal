'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PurchasableAvatarCardProps {
  id: string;
  name: string;
  svgPath: string;
  cost: number;
  isFree: boolean;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: () => Promise<void>;
}

/**
 * Card component for displaying a purchasable Open Peeps avatar
 * Shows SVG preview, name, cost, and purchase button
 */
export function PurchasableAvatarCard({
  id,
  name,
  svgPath,
  cost,
  isFree,
  isOwned,
  canAfford,
  onPurchase,
}: PurchasableAvatarCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await onPurchase();
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="relative bg-[var(--background-elevated)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center gap-2 hover:border-[var(--ember-300)] transition-all hover:shadow-md group">
      {/* SVG Preview */}
      <div className="w-24 h-24 relative bg-gradient-to-br from-[var(--celestial-50)] to-[var(--moon-100)] dark:from-[var(--celestial-900)]/20 dark:to-[var(--moon-900)]/20 rounded-lg overflow-hidden">
        <Image
          src={svgPath}
          alt={name}
          fill
          className="object-contain p-1"
          unoptimized // SVGs don't need optimization
        />
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-[var(--foreground)] text-center truncate w-full">
        {name}
      </p>

      {/* Status/Action */}
      {isOwned ? (
        <div className="px-3 py-1 bg-[var(--growth-100)] dark:bg-[var(--growth-900)]/30 text-[var(--growth-600)] dark:text-[var(--growth-400)] rounded-full text-xs font-medium">
          ✓ Owned
        </div>
      ) : isFree ? (
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="px-3 py-1 bg-[var(--growth-500)] text-white rounded-full text-xs font-medium hover:bg-[var(--growth-600)] transition-colors disabled:opacity-50"
        >
          {isPurchasing ? '...' : '🎁 Free!'}
        </button>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={!canAfford || isPurchasing}
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
            canAfford
              ? 'bg-[var(--ember-500)] text-white hover:bg-[var(--ember-600)] active:scale-95'
              : 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'
          }`}
        >
          {isPurchasing ? (
            '...'
          ) : (
            <>
              <span>{cost}</span>
              <span>🌙</span>
            </>
          )}
        </button>
      )}

      {/* Locked overlay for unaffordable items */}
      {!isOwned && !isFree && !canAfford && (
        <div className="absolute inset-0 bg-[var(--background)]/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-2xl">🔒</span>
        </div>
      )}

      {/* Free badge */}
      {isFree && !isOwned && (
        <div className="absolute -top-1 -right-1 bg-[var(--growth-500)] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          FREE
        </div>
      )}
    </div>
  );
}
