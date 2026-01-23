'use client';

import { useState } from 'react';
import { ShopItem } from '@/types';
import { Gift, Check, Clock } from '@phosphor-icons/react';

interface RewardItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  onPurchase: () => void;
}

export function RewardItemCard({ item, canAfford, onPurchase }: RewardItemCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);

  const handlePurchase = async () => {
    if (!canAfford || isPurchasing || isPurchased) return;
    
    setIsPurchasing(true);
    try {
      await onPurchase();
      setIsPurchased(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className={`
      relative rounded-xl p-4 transition-all
      ${isPurchased 
        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
        : 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800'
      }
    `}>
      {/* Emoji Icon */}
      <div className="text-4xl mb-3 text-center">
        {item.emoji || '🎁'}
      </div>

      {/* Name & Description */}
      <h3 className="font-semibold text-heading text-center mb-1">
        {item.name}
      </h3>
      {item.description && (
        <p className="text-xs text-muted text-center mb-3">
          {item.description}
        </p>
      )}

      {/* Cost */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
          {item.cost}
        </span>
        <span>🌙</span>
      </div>

      {/* Action Button */}
      {isPurchased ? (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
          <Clock size={16} />
          Waiting for Parent
        </div>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={!canAfford || isPurchasing}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
            ${canAfford 
              ? 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95' 
              : 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'}
          `}
        >
          {isPurchasing ? (
            'Redeeming...'
          ) : canAfford ? (
            <>
              <Gift size={16} weight="fill" />
              Redeem
            </>
          ) : (
            'Not enough moons'
          )}
        </button>
      )}

      {/* Reward Tag */}
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
        Reward
      </div>
    </div>
  );
}
