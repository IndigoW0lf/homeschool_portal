'use client';

import { useState, useEffect } from 'react';
import { ShopItem } from '@/types';
import { getStars } from '@/lib/progressState';
import { ShopItemCard } from './ShopItemCard';

interface ShopProps {
  kidId: string;
  items: ShopItem[];
}

type FilterType = 'all' | 'badge' | 'avatar' | 'home';

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

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'badge', label: 'Badges' },
    { key: 'avatar', label: 'Avatar' },
    { key: 'home', label: 'Home' },
  ];

  return (
    <div className="space-y-6">
      {/* Stars Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              Your Stars
            </h2>
            <p className="text-3xl font-bold text-[var(--ember-500)] flex items-center gap-2">
              <span>⭐</span>
              {stars}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-4 py-2 font-medium transition-colors border-b-2
              ${filter === key
                ? 'border-[var(--ember-500)] text-[var(--ember-500)]'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <ShopItemCard
            key={item.id}
            item={item}
            kidId={kidId}
            onPurchase={() => setStars(getStars(kidId))}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
          No items in this category yet.
        </div>
      )}
    </div>
  );
}



