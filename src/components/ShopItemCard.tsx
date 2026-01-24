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

  const handlePurchase = async () => {
    if (purchased || stars < item.cost || isPurchasing) return;
    
    setIsPurchasing(true);
    
    try {
      const result = await purchaseItem(kidId, item.id, item.name, item.cost, item.unlocks || []);
      
      if (result.success) {
        setPurchased(true);
        setStars(prev => prev - item.cost);
        onPurchase?.();
      } else {
        // Show error if purchase failed (e.g., already purchased on another device)
        alert(result.error || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Something went wrong with the purchase');
    } finally {
      setIsPurchasing(false);
    }
  };

  const canAfford = stars >= item.cost;
  const isLocked = !purchased && !canAfford;

  return (
    <div
      className={`
        card p-5 border-2 transition-all
        ${purchased
          ? 'border-[var(--success)] bg-[var(--success-light)]'
          : isLocked
            ? 'border-[var(--border)] opacity-60'
            : 'border-[var(--border)] hover:border-[var(--cosmic-rust-500)]'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="heading-sm">
              {item.name}
            </h3>
            {purchased && (
              <span className="badge-success text-xs">
                Owned
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted mb-3">
            {item.description}
          </p>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🌙</span>
            <span className="text-lg font-bold text-[var(--ember-gold-500)]">{item.cost}</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchased || !canAfford || isPurchasing}
          className={`
            w-full py-2 px-4 rounded-lg font-medium transition-all
            ${purchased
              ? 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'
              : canAfford
                ? 'bg-gradient-rust-gold text-[var(--foreground)] hover:opacity-90'
                : 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'}
          `}
        >
          {purchased ? 'Owned' : canAfford ? (isPurchasing ? 'Purchasing...' : 'Buy') : 'Not enough moons'}
        </button>
      </div>
    </div>
  );
}
