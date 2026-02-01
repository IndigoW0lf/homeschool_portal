'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocalOpenPeepsAvatar, generateLocalOpenPeepsUrl } from './LocalOpenPeepsAvatar';
import openPeepsOptions from '../../content/open-peeps-options.json';
import { toast } from 'sonner';
import { CaretLeft, CaretRight, Lock, ShoppingCart } from '@phosphor-icons/react';
import Link from 'next/link';

interface AvatarOption {
  id: string;
  label: string;
  unlocked: boolean;
  cost?: number;
}

export interface OpenPeepsState {
  face: string;
  head: string;
  accessories: string;
  facialHair: string;
  body: string;  // 'none' = bust only, or body pose id
  skinColor: string;
  clothingColor: string;
  backgroundColor: string;
}


interface OpenPeepsAvatarBuilderProps {
  kidId: string;
  initialState?: Partial<OpenPeepsState>;
  unlockedItems?: string[];
  designStudioUnlocked?: boolean;
  onSave?: (state: OpenPeepsState, avatarUrl: string) => Promise<void>;
  compact?: boolean;
}

const DEFAULT_STATE: OpenPeepsState = {
  face: 'smile',
  head: 'short1',
  accessories: 'none',
  facialHair: 'none',
  body: 'hoodie',  // Default to a full-body pose
  skinColor: 'd08b5b',
  clothingColor: '8fa7df',
  backgroundColor: 'b6e3f4',
};

type CategoryKey = 'face' | 'head' | 'accessories' | 'facialHair' | 'body';

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'face', label: 'Face', emoji: '😊' },
  { key: 'head', label: 'Hair', emoji: '💇' },
  { key: 'body', label: 'Outfit', emoji: '👕' },
  { key: 'accessories', label: 'Glasses', emoji: '👓' },
  { key: 'facialHair', label: 'Facial Hair', emoji: '🧔' },
];

export function OpenPeepsAvatarBuilder({
  kidId,
  initialState,
  unlockedItems = [],
  designStudioUnlocked = false,
  onSave,
  compact = false,
}: OpenPeepsAvatarBuilderProps) {
  const router = useRouter();
  const [state, setState] = useState<OpenPeepsState>({ ...DEFAULT_STATE, ...initialState });
  const [isSaving, setIsSaving] = useState(false);
  const [isDesignUnlocked, setIsDesignUnlocked] = useState(designStudioUnlocked);

  // Track current index for each category
  const [categoryIndices, setCategoryIndices] = useState<Record<CategoryKey, number>>(() => {
    const indices: Record<CategoryKey, number> = { face: 0, head: 0, body: 0, accessories: 0, facialHair: 0 };
    // Set initial indices based on initial state
    CATEGORIES.forEach(cat => {
      const options = openPeepsOptions[cat.key] as AvatarOption[];
      const idx = options.findIndex(o => o.id === (initialState?.[cat.key] || DEFAULT_STATE[cat.key]));
      indices[cat.key] = idx >= 0 ? idx : 0;
    });
    return indices;
  });

  // Check design studio status
  useEffect(() => {
    async function checkDesignStudio() {
      try {
        const res = await fetch(`/api/design-studio/unlock?kidId=${kidId}`);
        if (res.ok) {
          const data = await res.json();
          setIsDesignUnlocked(data.unlocked);
        }
      } catch (error) {
        console.error('Failed to check design studio status:', error);
      }
    }
    if (!designStudioUnlocked) {
      checkDesignStudio();
    }
  }, [kidId, designStudioUnlocked]);

  const isItemUnlocked = (category: string, itemId: string): boolean => {
    const options = openPeepsOptions[category as keyof typeof openPeepsOptions] as AvatarOption[];
    const item = options?.find(o => o.id === itemId);
    return item?.unlocked || unlockedItems.includes(`${category}:${itemId}`);
  };

  const navigate = (category: CategoryKey, direction: 'prev' | 'next') => {
    const options = openPeepsOptions[category] as AvatarOption[];
    const currentIdx = categoryIndices[category];
    let newIdx: number;
    
    if (direction === 'next') {
      newIdx = (currentIdx + 1) % options.length;
    } else {
      newIdx = (currentIdx - 1 + options.length) % options.length;
    }
    
    const newOption = options[newIdx];
    
    // Check if unlocked
    if (!isItemUnlocked(category, newOption.id)) {
      toast.error(`${newOption.label} costs ${newOption.cost} 🌙 - Visit the Shop!`);
      // Still navigate to show the locked item
    }
    
    setCategoryIndices(prev => ({ ...prev, [category]: newIdx }));
    
    // Only update state if unlocked
    if (isItemUnlocked(category, newOption.id)) {
      setState(prev => ({ ...prev, [category]: newOption.id }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const avatarUrl = generateLocalOpenPeepsUrl({
        ...state,
        size: 256,
      });

      if (onSave) {
        await onSave(state, avatarUrl);
      } else {
        const res = await fetch(`/api/kids/${kidId}/avatar-state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ openPeepsState: state, avatarUrl }),
        });
        
        if (!res.ok) throw new Error('Failed to save avatar');
      }
      
      toast.success('Avatar saved! ✨');
      // Refresh to update sidebar avatar
      router.refresh();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      toast.error('Could not save avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`${compact ? 'space-y-4' : 'max-w-2xl mx-auto p-4 sm:p-6 space-y-6'}`}>
      <div className={`bg-[var(--background-elevated)] rounded-xl ${compact ? 'p-4' : 'p-6'} shadow-sm border border-[var(--border)]`}>
        {/* Header */}
        {!compact && (
          <h2 className="text-xl font-bold text-heading dark:text-[var(--foreground)] mb-4 text-center">
            Avatar Builder
          </h2>
        )}

        {/* Main Avatar Preview */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className="rounded-full p-3"
            style={{ 
              backgroundColor: state.backgroundColor === 'transparent' 
                ? 'var(--paper-100)' 
                : `#${state.backgroundColor}` 
            }}
          >
            <LocalOpenPeepsAvatar
              size={compact ? 100 : 140}
              {...state}
            />
          </div>
        </div>

        {/* Category Selectors - Stacked vertically */}
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const options = openPeepsOptions[cat.key] as AvatarOption[];
            const currentIdx = categoryIndices[cat.key];
            const currentOption = options[currentIdx];
            const isUnlocked = isItemUnlocked(cat.key, currentOption.id);
            
            return (
              <div key={cat.key} className="flex items-center gap-3">
                {/* Category label */}
                <div className="w-20 flex-shrink-0">
                  <span className="text-sm font-medium text-muted flex items-center gap-1">
                    <span>{cat.emoji}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                  </span>
                </div>
                
                {/* Navigator */}
                <div className="flex-1 flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigate(cat.key, 'prev')}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--background-secondary)] hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)] transition-colors"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  
                  {/* Current option preview */}
                  <div className={`relative flex flex-col items-center ${!isUnlocked ? 'opacity-50' : ''}`}>
                    <div className="w-14 h-14 flex items-center justify-center">
                      <LocalOpenPeepsAvatar
                        size={52}
                        {...{ ...state, [cat.key]: currentOption.id }}
                      />
                    </div>
                    <span className="text-xs text-muted mt-1 text-center truncate max-w-[80px]">
                      {currentOption.label}
                    </span>
                    {!isUnlocked && currentOption.cost && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[9px] px-1 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Lock size={8} />
                        {currentOption.cost}🌙
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => navigate(cat.key, 'next')}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--background-secondary)] hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)] transition-colors"
                  >
                    <CaretRight size={16} weight="bold" />
                  </button>
                </div>
                
                {/* Counter */}
                <div className="w-12 text-right">
                  <span className="text-xs text-muted">
                    {currentIdx + 1}/{options.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Design Studio Unlock CTA */}
        {!isDesignUnlocked && (
          <div className="mt-6 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Design Studio
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Unlock to customize colors!
                  </p>
                </div>
              </div>
              <Link
                href={`/kids/${kidId}/shop`}
                className="px-3 py-1.5 bg-purple-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5 hover:bg-purple-600 transition-colors"
              >
                <ShoppingCart size={14} />
                <span>Shop</span>
              </Link>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full ${compact ? 'mt-4 py-2' : 'mt-6 py-3'} px-6 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
        >
          {isSaving ? 'Saving...' : 'Save Avatar ✨'}
        </button>
      </div>
    </div>
  );
}
