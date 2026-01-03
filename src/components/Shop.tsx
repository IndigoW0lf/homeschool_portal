'use client';

import { useState, useEffect } from 'react';
import { ShopItem } from '@/types';
import { getStars, addStars } from '@/lib/progressState';
import { ShopItemCard } from './ShopItemCard';
import { RewardItemCard } from './RewardItemCard';

interface ShopProps {
  kidId: string;
  items: ShopItem[];
}

type FilterType = 'all' | 'reward' | 'badge' | 'avatar' | 'home';

export function Shop({ kidId, items }: ShopProps) {
  const [stars, setStars] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const updateStars = () => {
      setStars(getStars(kidId));
    };
    updateStars();
    const interval = setInterval(updateStars, 1000);
    return () => clearInterval(interval);
  }, [kidId]);

  // Count items by type
  const rewardCount = items.filter(i => i.type === 'reward').length;
  const digitalCount = items.filter(i => i.type !== 'reward').length;

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter);

  const filters: { key: FilterType; label: string; show: boolean }[] = [
    { key: 'all', label: 'All', show: true },
    { key: 'reward', label: `🎁 Rewards (${rewardCount})`, show: rewardCount > 0 },
    { key: 'badge', label: 'Badges', show: digitalCount > 0 },
    { key: 'avatar', label: 'Avatar', show: digitalCount > 0 },
    { key: 'home', label: 'Home', show: digitalCount > 0 },
  ];

  const handleRewardPurchase = async (item: ShopItem) => {
    if (stars < item.cost) return;
    
    // Deduct moons
    addStars(kidId, -item.cost);
    setStars(getStars(kidId));
    
    // Create redemption request
    await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kidId,
        rewardId: item.id,
      }),
    });
  };

  return (
    <div className="space-y-6">
      {/* Moons Display */}
      <div className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/50 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
              Your Moons
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stars}
            </span>
            <span>🌙</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {filters.filter(f => f.show).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-4 py-2 font-medium transition-colors rounded-lg
              ${filter === key
                ? 'bg-[var(--ember-500)] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          item.type === 'reward' ? (
            <RewardItemCard
              key={item.id}
              item={item}
              canAfford={stars >= item.cost}
              onPurchase={() => handleRewardPurchase(item)}
            />
          ) : (
            <ShopItemCard
              key={item.id}
              item={item}
              kidId={kidId}
              onPurchase={() => setStars(getStars(kidId))}
            />
          )
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="card p-6 text-center text-muted">
          {filter === 'reward' 
            ? 'No rewards yet! Ask your parent to add some fun rewards.'
            : 'No items in this category yet.'}
        </div>
      )}
    </div>
  );
}
