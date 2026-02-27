'use client';

import { useState, useEffect } from 'react';
import { ShopItem } from '@/types';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Gift, Clock, CheckCircle } from '@phosphor-icons/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PhosphorIconMap = PhosphorIcons as unknown as Record<string, React.ComponentType<{ size?: number; weight?: string; className?: string }> | undefined>;

interface RewardItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  onPurchase: () => void;
}

export function RewardItemCard({ item, canAfford, onPurchase }: RewardItemCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  
  const IconCmp = item.icon ? PhosphorIconMap[item.icon] : null;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPurchased && item.is_unlimited) {
      // Revert the purchased state after 2 seconds for unlimited items
      // so the kid can buy it again
      timeout = setTimeout(() => {
        setIsPurchased(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isPurchased, item.is_unlimited]);

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
        ? item.is_unlimited 
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 scale-105' 
          : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
        : 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-[var(--nebula-purple)]/30 dark:border-[var(--nebula-purple)]'
      }
    `}>
      {/* Icon / Emoji */}
      <div className="text-4xl mb-3 flex items-center justify-center text-[var(--nebula-purple)] dark:text-purple-300">
        {IconCmp ? <IconCmp weight="duotone" /> : item.emoji || '🎁'}
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
         item.is_unlimited ? (
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-bold animate-in fade-in zoom-in duration-300">
              <CheckCircle size={18} weight="bold" />
              Redeemed! 🎉
            </div>
         ) : (
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
              <Clock size={16} />
              Waiting for Parent
            </div>
         )
      ) : (
        <button
          onClick={handlePurchase}
          disabled={!canAfford || isPurchasing}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
            ${canAfford 
              ? 'bg-[var(--nebula-purple)] text-[var(--foreground)] hover:bg-[var(--nebula-purple)] active:scale-95' 
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
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-[var(--nebula-purple)] text-[var(--foreground)] text-xs font-medium rounded-full">
        {item.is_unlimited ? 'Unlimited' : 'Reward'}
      </div>
    </div>
  );
}
