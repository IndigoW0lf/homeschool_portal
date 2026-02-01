'use client';

import { useState, useEffect } from 'react';
import { ShopItem } from '@/types';
import { ShopItemCard } from './ShopItemCard';
import { RewardItemCard } from './RewardItemCard';
import { AvatarItemCard } from './AvatarItemCard';
import openPeepsOptions from '../../content/open-peeps-options.json';

interface ShopProps {
  kidId: string;
  items: ShopItem[];
}

type FilterType = 'all' | 'reward' | 'badge' | 'avatar' | 'home' | 'template';

// Extract premium avatar items from options
type CategoryKey = 'face' | 'head' | 'accessories' | 'facialHair';
interface PremiumAvatarItem {
  itemKey: string;
  category: CategoryKey;
  itemId: string;
  label: string;
  cost: number;
}

function getPremiumAvatarItems(): PremiumAvatarItem[] {
  const items: PremiumAvatarItem[] = [];
  const categories: CategoryKey[] = ['face', 'head', 'accessories', 'facialHair'];
  
  for (const category of categories) {
    const categoryItems = openPeepsOptions[category] as Array<{ id: string; label: string; unlocked: boolean; cost?: number }>;
    for (const item of categoryItems) {
      if (!item.unlocked && item.cost) {
        items.push({
          itemKey: `${category}:${item.id}`,
          category,
          itemId: item.id,
          label: item.label,
          cost: item.cost,
        });
      }
    }
  }
  return items.sort((a, b) => a.cost - b.cost);
}

const PREMIUM_AVATAR_ITEMS = getPremiumAvatarItems();

export function Shop({ kidId, items }: ShopProps) {
  const [stars, setStars] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [, setIsLoading] = useState(true);
  const [ownedAvatarItems, setOwnedAvatarItems] = useState<Set<string>>(new Set());

    // Fetch moons via API (handles kid sessions properly)
    useEffect(() => {
      async function syncMoons() {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/kids/${kidId}/moons`);
          if (res.ok) {
            const data = await res.json();
            setStars(data.moons || 0);
          }
        } catch (error) {
          console.error('[Shop] Failed to fetch moons:', error);
        }
        setIsLoading(false);
      }
      syncMoons();
    }, [kidId]);

    // Fetch owned avatar items
    useEffect(() => {
      async function fetchOwnedItems() {
        try {
          const res = await fetch(`/api/kids/${kidId}/avatar-state`);
          if (res.ok) {
            const data = await res.json();
            if (data.unlockedItems) {
              setOwnedAvatarItems(new Set(data.unlockedItems));
            }
          }
        } catch (error) {
          console.error('[Shop] Failed to fetch owned items:', error);
        }
      }
      fetchOwnedItems();
    }, [kidId]);

    // Count items by type
    const rewardCount = items.filter(i => i.type === 'reward').length;
    const templateCount = items.filter(i => i.type === 'template').length;
    const digitalCount = items.filter(i => i.type !== 'reward' && i.type !== 'template').length;

    const filteredItems = filter === 'all' 
      ? items 
      : items.filter(item => item.type === filter);

    const filters: { key: FilterType; label: string; show: boolean }[] = [
      { key: 'all', label: 'All', show: true },
      { key: 'template', label: `Clothing (${templateCount})`, show: templateCount > 0 },
      { key: 'reward', label: `🎁 Rewards (${rewardCount})`, show: rewardCount > 0 },
      { key: 'badge', label: 'Badges', show: digitalCount > 0 },
      { key: 'avatar', label: `✨ Avatar (${PREMIUM_AVATAR_ITEMS.length})`, show: PREMIUM_AVATAR_ITEMS.length > 0 },
      { key: 'home', label: 'Home', show: digitalCount > 0 },
    ];

  const handleRewardPurchase = async (item: ShopItem) => {
    if (stars < item.cost) return;
    
    // Call API - backend will deduct moons and create redemption
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kidId,
        rewardId: item.id,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      // Update local state with new balance from API
      setStars(data.newMoonBalance ?? stars - item.cost);
    } else {
      console.error('[Shop] Failed to redeem:', data.error);
      // Could show error toast here
    }
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
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {filters.filter(f => f.show).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              px-4 py-2 font-medium transition-colors rounded-lg
              ${filter === key
                ? 'bg-[var(--ember-500)] text-[var(--foreground)]'
                : 'bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-muted hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-700)]'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      {filter === 'avatar' ? (
        /* Avatar Items Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PREMIUM_AVATAR_ITEMS.map(item => (
            <AvatarItemCard
              key={item.itemKey}
              category={item.category}
              itemId={item.itemId}
              label={item.label}
              cost={item.cost}
              isOwned={ownedAvatarItems.has(item.itemKey)}
              canAfford={stars >= item.cost}
              onPurchase={async () => {
                const res = await fetch('/api/avatar-items/purchase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ kidId, itemKey: item.itemKey }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setStars(data.newMoonBalance);
                  setOwnedAvatarItems(prev => new Set([...prev, item.itemKey]));
                }
              }}
            />
          ))}
        </div>
      ) : (
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
                onPurchase={async () => {
                  // Determine API endpoint based on type
                  if (item.type === 'template') {
                    const res = await fetch('/api/rewards/redeem', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        kidId,
                        rewardId: item.id,
                        type: 'template' // Signal that this is a template purchase
                      }),
                    });
                    
                    if (res.ok) {
                      // Update stars
                      const data = await res.json();
                      if (data.newMoonBalance !== undefined) {
                        setStars(data.newMoonBalance);
                      }
                      // Refresh the page to remove the purchased item
                      window.location.reload();
                    }
                    return;
                  }

                  // Default behavior for other shop items (using existing logic if any)
                  // For now, let's assume other shop items follow similar pattern or are not fully implemented
                }}
              />
            )
          ))}
        </div>
      )}

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



