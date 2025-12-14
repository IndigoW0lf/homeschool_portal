'use client';

import { ShopItem } from '@/types';
import { getStars, isPurchased, purchaseItem } from '@/lib/progressState';
import { useState, useEffect } from 'react';

interface ShopItemCardProps {
  item: ShopItem;
  kidId: string;
  onPurchase?: () => void;
}

export function ShopItemCard({ item, kidId, onPurchase }: ShopItemCardProps) {
  const [stars, setStars] = useState(0);
  const [purchased, setPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setStars(getStars(kidId));
      setPurchased(isPurchased(kidId, item.id));
    };
    updateState();
    const interval = setInterval(updateState, 500);
    return () => clearInterval(interval);
  }, [kidId, item.id]);

  const handlePurchase = () => {
    if (purchased || stars < item.cost || isPurchasing) return;
    
    setIsPurchasing(true);
    const success = purchaseItem(kidId, item.id, item.cost, item.unlocks);
    
    if (success) {
      setPurchased(true);
      setStars(getStars(kidId));
      onPurchase?.();
    }
    
    setIsPurchasing(false);
  };

  const canAfford = stars >= item.cost;
  const isLocked = !purchased && !canAfford;

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-2 transition-all
        ${purchased
          ? 'border-green-500 dark:border-green-400'
          : isLocked
            ? 'border-gray-300 dark:border-gray-600 opacity-60'
            : 'border-gray-200 dark:border-gray-700 hover:border-[var(--ember-500)]'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="heading-sm">
              {item.name}
            </h3>
            {purchased && (
              <span className="badge-green text-xs">
                Owned
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted mb-3">
            {item.description}
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-bold text-[var(--ember-500)]">{item.cost}</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchased || !canAfford || isPurchasing}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all
            ${purchased
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : canAfford
                ? 'bg-[var(--ember-500)] text-white hover:opacity-90'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}
          `}
        >
          {purchased ? 'Owned' : canAfford ? (isPurchasing ? 'Purchasing...' : 'Buy') : 'Not enough stars'}
        </button>
      </div>
    </div>
  );
}

