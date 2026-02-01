'use client';

import { useState, useEffect } from 'react';
import { PurchasableAvatarCard } from './PurchasableAvatarCard';
import { toast } from 'sonner';

interface AvatarItem {
  id: string;
  name: string;
  svgPath: string;
  cost: number;
  isFree: boolean;
}

interface AvatarCatalog {
  upper: AvatarItem[];
  standing: AvatarItem[];
  sitting: AvatarItem[];
  special: AvatarItem[];
  medical: AvatarItem[];
  designStudio: {
    id: string;
    name: string;
    description: string;
    cost: number;
    type: string;
  };
}

type CategoryKey = 'upper' | 'standing' | 'sitting' | 'special' | 'medical';

interface AvatarShopSectionProps {
  kidId: string;
  moons: number;
  onMoonsChange: (newBalance: number) => void;
}

const CATEGORY_LABELS: Record<CategoryKey, { label: string; emoji: string }> = {
  upper: { label: 'Upper Body', emoji: '👤' },
  standing: { label: 'Standing', emoji: '🧍' },
  sitting: { label: 'Sitting', emoji: '🪑' },
  special: { label: 'Special Edition', emoji: '⭐' },
  medical: { label: 'Medical', emoji: '🩺' },
};

export function AvatarShopSection({ kidId, moons, onMoonsChange }: AvatarShopSectionProps) {
  const [catalog, setCatalog] = useState<AvatarCatalog | null>(null);
  const [ownedAvatars, setOwnedAvatars] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('upper');
  const [isLoading, setIsLoading] = useState(true);
  const [designStudioUnlocked, setDesignStudioUnlocked] = useState(false);

  // Fetch catalog and owned avatars
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch catalog
        const catalogRes = await fetch('/api/avatars/catalog');
        if (catalogRes.ok) {
          const data = await catalogRes.json();
          setCatalog(data.catalog);
        }

        // Fetch owned avatars
        const ownedRes = await fetch(`/api/kids/${kidId}/owned-avatars`);
        if (ownedRes.ok) {
          const data = await ownedRes.json();
          setOwnedAvatars(new Set(data.owned || []));
        }

        // Check design studio status
        const studioRes = await fetch(`/api/design-studio/unlock?kidId=${kidId}`);
        if (studioRes.ok) {
          const data = await studioRes.json();
          setDesignStudioUnlocked(data.unlocked);
        }
      } catch (error) {
        console.error('[AvatarShopSection] Failed to fetch:', error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [kidId]);

  const handlePurchase = async (avatarId: string) => {
    const res = await fetch('/api/avatars/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kidId, avatarId }),
    });

    if (res.ok) {
      const data = await res.json();
      onMoonsChange(data.newMoonBalance);
      setOwnedAvatars(prev => new Set([...prev, avatarId]));
      toast.success(`Unlocked ${data.avatar.name}! ✨`);
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to purchase');
    }
  };

  const handleDesignStudioUnlock = async () => {
    const res = await fetch('/api/design-studio/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kidId }),
    });

    if (res.ok) {
      const data = await res.json();
      onMoonsChange(data.newMoonBalance);
      setDesignStudioUnlocked(true);
      toast.success('Design Studio unlocked! 🎨');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to unlock');
    }
  };

  if (isLoading || !catalog) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--ember-500)]" />
      </div>
    );
  }

  const currentItems = catalog[activeCategory] || [];

  return (
    <div className="space-y-4">
      {/* Design Studio Unlock Card */}
      {!designStudioUnlocked && (
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              🎨 Design Studio
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Unlock to customize avatars with colors!
            </p>
          </div>
          <button
            onClick={handleDesignStudioUnlock}
            disabled={moons < catalog.designStudio.cost}
            className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-all ${
              moons >= catalog.designStudio.cost
                ? 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95'
                : 'bg-gray-200 dark:bg-gray-700 text-muted cursor-not-allowed'
            }`}
          >
            <span>{catalog.designStudio.cost}</span>
            <span>🌙</span>
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-3 py-1.5 text-sm font-medium transition-colors rounded-lg flex items-center gap-1
              ${activeCategory === cat
                ? 'bg-[var(--ember-500)] text-white'
                : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)]'}
            `}
          >
            <span>{CATEGORY_LABELS[cat].emoji}</span>
            <span className="hidden sm:inline">{CATEGORY_LABELS[cat].label}</span>
            <span className="text-xs opacity-70">({catalog[cat].length})</span>
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {currentItems.map(avatar => (
          <PurchasableAvatarCard
            key={avatar.id}
            id={avatar.id}
            name={avatar.name}
            svgPath={avatar.svgPath}
            cost={avatar.cost}
            isFree={avatar.isFree}
            isOwned={ownedAvatars.has(avatar.id)}
            canAfford={moons >= avatar.cost}
            onPurchase={() => handlePurchase(avatar.id)}
          />
        ))}
      </div>

      {currentItems.length === 0 && (
        <div className="text-center text-muted p-8">
          No avatars in this category yet.
        </div>
      )}
    </div>
  );
}
