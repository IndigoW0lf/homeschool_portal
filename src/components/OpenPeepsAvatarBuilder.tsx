'use client';

import { useState, useEffect, useRef } from 'react';
import { OpenPeepsAvatar, generateOpenPeepsUrl } from './OpenPeepsAvatar';
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

interface ColorOption {
  id: string;
  color: string;
  label: string;
}

export interface OpenPeepsState {
  face: string;
  head: string;
  accessories: string;
  facialHair: string;
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
  compact?: boolean; // For parent profile embedding
}

const DEFAULT_STATE: OpenPeepsState = {
  face: 'smile',
  head: 'short1',
  accessories: 'none',
  facialHair: 'none',
  skinColor: 'd08b5b',
  clothingColor: '8fa7df',
  backgroundColor: 'b6e3f4',
};

type CategoryKey = 'face' | 'head' | 'accessories' | 'facialHair';

const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'face', label: 'Face', emoji: '😊' },
  { key: 'head', label: 'Hair', emoji: '💇' },
  { key: 'accessories', label: 'Accessories', emoji: '👓' },
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
  const [state, setState] = useState<OpenPeepsState>({ ...DEFAULT_STATE, ...initialState });
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('face');
  const [isSaving, setIsSaving] = useState(false);
  const [isDesignUnlocked, setIsDesignUnlocked] = useState(designStudioUnlocked);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch design studio status on mount
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

  const getItemCost = (category: string, itemId: string): number | undefined => {
    const options = openPeepsOptions[category as keyof typeof openPeepsOptions] as AvatarOption[];
    const item = options?.find(o => o.id === itemId);
    return item?.unlocked ? undefined : item?.cost;
  };

  const handleSelect = (category: keyof OpenPeepsState, value: string) => {
    if (!isItemUnlocked(category, value)) {
      const cost = getItemCost(category, value);
      toast.error(`This item costs ${cost} 🌙 Moons. Visit the shop to purchase!`);
      return;
    }
    setState(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const avatarUrl = generateOpenPeepsUrl({
        seed: kidId,
        ...state,
        size: 256,
        radius: 50,
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
    } catch (error) {
      console.error('Failed to save avatar:', error);
      toast.error('Could not save avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const currentOptions = openPeepsOptions[activeCategory] as AvatarOption[];

  return (
    <div className={`${compact ? 'space-y-4' : 'max-w-4xl mx-auto p-4 sm:p-6 space-y-6'}`}>
      <div className={`bg-[var(--background-elevated)] rounded-xl ${compact ? 'p-4' : 'p-6'} shadow-sm border border-[var(--border)]`}>
        {/* Header */}
        {!compact && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-heading dark:text-[var(--foreground)]">
              Avatar Builder
            </h2>
          </div>
        )}

        {/* Avatar Preview - Centered */}
        <div className="flex flex-col items-center mb-6">
          <div 
            className="relative rounded-full p-2"
            style={{ 
              backgroundColor: state.backgroundColor === 'transparent' 
                ? 'var(--paper-100)' 
                : `#${state.backgroundColor}` 
            }}
          >
            <OpenPeepsAvatar
              seed={kidId}
              size={compact ? 120 : 160}
              {...state}
              radius={50}
            />
          </div>
          {!compact && <p className="text-sm text-muted mt-2">This is your avatar!</p>}
        </div>

        {/* Category Pills - Horizontal scrollable */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeCategory === cat.key
                  ? 'bg-[var(--ember-500)] text-white'
                  : 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)]'}
              `}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
          {/* Colors button - locked/unlocked based on Design Studio */}
          <button
            onClick={() => {
              if (!isDesignUnlocked) {
                toast.info(
                  <div className="flex items-center gap-2">
                    <Lock size={16} />
                    <span>Unlock Design Studio in the Shop to customize colors!</span>
                  </div>
                );
              }
            }}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all relative
              ${isDesignUnlocked
                ? 'bg-[var(--background-secondary)] text-muted hover:bg-[var(--night-200)] dark:hover:bg-[var(--night-700)]'
                : 'bg-[var(--background-secondary)] text-muted/50 cursor-not-allowed'}
            `}
            disabled={!isDesignUnlocked}
          >
            <span>🎨</span>
            <span>Colors</span>
            {!isDesignUnlocked && (
              <Lock size={14} className="ml-1 opacity-60" />
            )}
          </button>
        </div>

        {/* Carousel for options */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[var(--background-elevated)] border border-[var(--border)] rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          {/* Carousel container */}
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-10 py-2"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {currentOptions.map(option => {
              const isSelected = state[activeCategory] === option.id;
              const isUnlocked = option.unlocked || unlockedItems.includes(`${activeCategory}:${option.id}`);
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(activeCategory, option.id)}
                  className={`
                    relative flex-shrink-0 p-2 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-[var(--ember-500)] bg-[var(--ember-500)]/10 scale-105'
                      : 'border-[var(--border)] hover:border-[var(--ember-300)] hover:bg-[var(--background-secondary)]'}
                    ${!isUnlocked ? 'opacity-60' : ''}
                  `}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className={`${compact ? 'w-14 h-14' : 'w-16 h-16'} flex items-center justify-center`}>
                    <OpenPeepsAvatar
                      seed={`preview-${option.id}`}
                      size={compact ? 52 : 60}
                      {...{ ...state, [activeCategory]: option.id }}
                      radius={50}
                    />
                  </div>
                  <p className="text-[10px] text-center truncate text-muted mt-1 w-16">
                    {option.label}
                  </p>
                  {!isUnlocked && option.cost && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      {option.cost} 🌙
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--ember-500)] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[var(--background-elevated)] border border-[var(--border)] rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>

        {/* Design Studio Unlock CTA (when locked) */}
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
