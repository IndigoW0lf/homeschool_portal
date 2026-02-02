'use client';

/**
 * WorldPackCard - Card component for displaying purchasable world packs
 */

import { useState } from 'react';
import { getPackItems, getAssetComponent } from '@/lib/world/assets';
import { WorldPack } from '@/types/world';

interface WorldPackCardProps {
  pack: WorldPack & { isOwned?: boolean };
  canAfford: boolean;
  onPurchase: () => Promise<void>;
}

export function WorldPackCard({ pack, canAfford, onPurchase }: WorldPackCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const isOwned = pack.isOwned ?? false;
  
  // Get items for preview
  const packItems = getPackItems(pack.id);

  const handlePurchase = async () => {
    if (isOwned || !canAfford || isPurchasing) return;
    
    setIsPurchasing(true);
    try {
      await onPurchase();
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div
      className={`
        card p-5 border-2 transition-all
        ${isOwned
          ? 'border-[var(--success)] bg-[var(--success-light)]'
          : !canAfford
            ? 'border-[var(--border)] opacity-60'
            : 'border-[var(--border)] hover:border-[var(--cosmic-rust-500)]'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{pack.previewEmoji}</span>
            <h3 className="heading-sm">{pack.name}</h3>
          </div>
          {isOwned && (
            <span className="badge-success text-xs">Owned</span>
          )}
        </div>
        
        <p className="text-sm text-muted mb-3">{pack.description}</p>
        
        {/* Item Preview Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {packItems.slice(0, 4).map(item => (
            <div 
              key={item.type}
              className="w-12 h-12 bg-slate-50 rounded-lg p-1 border border-slate-100"
              title={item.label}
            >
              {getAssetComponent(item.type)}
            </div>
          ))}
        </div>
        
        {/* Price & Button */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌙</span>
            <span className="text-lg font-bold text-[var(--ember-gold-500)]">{pack.cost}</span>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isOwned || !canAfford || isPurchasing}
            className={`
              w-full py-2 px-4 rounded-lg font-medium transition-all
              ${isOwned
                ? 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'
                : canAfford
                  ? 'bg-gradient-rust-gold text-[var(--foreground)] hover:opacity-90'
                  : 'bg-[var(--background-secondary)] text-muted cursor-not-allowed'}
            `}
          >
            {isOwned 
              ? 'Owned' 
              : canAfford 
                ? (isPurchasing ? 'Purchasing...' : 'Buy Pack') 
                : 'Not enough moons'}
          </button>
        </div>
      </div>
    </div>
  );
}
