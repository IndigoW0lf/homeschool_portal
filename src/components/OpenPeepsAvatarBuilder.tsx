'use client';

import { useState, useEffect, useMemo } from 'react';
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
  folder?: string;
  file?: string;
}

export interface OpenPeepsState {
  pose: string;         // Full body pose
  face: string;
  head: string;
  accessories: string;
  facialHair: string;
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
  pose: 'standing_shirt1',
  face: 'smile',
  head: 'short1',
  accessories: 'none',
  facialHair: 'none',
  backgroundColor: 'b6e3f4',
};

type CategoryKey = 'pose' | 'face' | 'head' | 'accessories' | 'facialHair';

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'pose', label: 'Pose', emoji: '🧍' },
  { key: 'face', label: 'Face', emoji: '😊' },
  { key: 'head', label: 'Hair', emoji: '💇' },
  { key: 'accessories', label: 'Glasses', emoji: '👓' },
  { key: 'facialHair', label: 'Beard', emoji: '🧔' },
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
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('pose');

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

  // Get filtered list of unlocked options for the active category
  const unlockedOptions = useMemo(() => {
    const options = openPeepsOptions[activeCategory] as AvatarOption[];
    if (!options) return [];
    return options.filter(opt => isItemUnlocked(activeCategory, opt.id));
  }, [activeCategory, unlockedItems]);

  // Get current option index within unlocked options only
  const currentUnlockedIndex = useMemo(() => {
    const currentId = state[activeCategory];
    const idx = unlockedOptions.findIndex(o => o.id === currentId);
    return idx >= 0 ? idx : 0;
  }, [activeCategory, state, unlockedOptions]);

  const navigate = (direction: 'prev' | 'next') => {
    if (unlockedOptions.length === 0) return;
    
    let newIdx: number;
    if (direction === 'next') {
      newIdx = (currentUnlockedIndex + 1) % unlockedOptions.length;
    } else {
      newIdx = (currentUnlockedIndex - 1 + unlockedOptions.length) % unlockedOptions.length;
    }
    
    const newOption = unlockedOptions[newIdx];
    setState(prev => ({ ...prev, [activeCategory]: newOption.id }));
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
      router.refresh();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      toast.error('Could not save avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentOption = unlockedOptions[currentUnlockedIndex];
  const allOptions = openPeepsOptions[activeCategory] as AvatarOption[] | undefined;
  const lockedCount = allOptions 
    ? allOptions.filter(o => !isItemUnlocked(activeCategory, o.id)).length 
    : 0;

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
            className="rounded-2xl p-4"
            style={{ 
              backgroundColor: state.backgroundColor === 'transparent' 
                ? 'var(--paper-100)' 
                : `#${state.backgroundColor}` 
            }}
          >
            <LocalOpenPeepsAvatar
              size={compact ? 120 : 180}
              {...state}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-1 sm:gap-2 mb-4 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all
                ${activeCategory === cat.key
                  ? 'bg-[var(--ember-500)] text-white'
                  : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)]'}
              `}
            >
              <span className="mr-1">{cat.emoji}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Single Carousel for Active Category */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => navigate('prev')}
            disabled={unlockedOptions.length <= 1}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--background-secondary)] hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)] transition-colors disabled:opacity-50"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          
          {/* Current option preview */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div 
              className="w-28 h-36 flex items-center justify-center rounded-xl overflow-hidden"
              style={{
                backgroundColor: state.backgroundColor === 'transparent' 
                  ? 'var(--paper-100)' 
                  : `#${state.backgroundColor}`
              }}
            >
              {currentOption && (
                <LocalOpenPeepsAvatar
                  size={90}
                  {...{ ...state, [activeCategory]: currentOption.id }}
                />
              )}
            </div>
            <span className="text-sm font-medium text-foreground mt-2 text-center">
              {currentOption?.label || 'None'}
            </span>
            <span className="text-xs text-muted">
              {currentUnlockedIndex + 1} / {unlockedOptions.length}
            </span>
          </div>
          
          <button
            onClick={() => navigate('next')}
            disabled={unlockedOptions.length <= 1}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--background-secondary)] hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)] transition-colors disabled:opacity-50"
          >
            <CaretRight size={24} weight="bold" />
          </button>
        </div>

        {/* Locked Items Banner */}
        {lockedCount > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {lockedCount} more {CATEGORIES.find(c => c.key === activeCategory)?.label.toLowerCase()} options in the Shop!
                </span>
              </div>
              <Link
                href={`/kids/${kidId}/shop`}
                className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5 hover:bg-amber-600 transition-colors"
              >
                <ShoppingCart size={14} />
                <span>Shop</span>
              </Link>
            </div>
          </div>
        )}

        {/* Design Studio Unlock CTA */}
        {!isDesignUnlocked && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
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
