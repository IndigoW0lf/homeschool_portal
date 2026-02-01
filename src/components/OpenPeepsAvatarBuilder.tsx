'use client';

import { useState, useEffect } from 'react';
import { OpenPeepsAvatar, generateOpenPeepsUrl } from './OpenPeepsAvatar';
import openPeepsOptions from '../../content/open-peeps-options.json';
import { toast } from 'sonner';

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
  onSave?: (state: OpenPeepsState, avatarUrl: string) => Promise<void>;
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

type TabKey = 'face' | 'head' | 'accessories' | 'facialHair' | 'colors';

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'face', label: 'Face', emoji: '😊' },
  { key: 'head', label: 'Hair', emoji: '💇' },
  { key: 'accessories', label: 'Accessories', emoji: '👓' },
  { key: 'facialHair', label: 'Facial Hair', emoji: '🧔' },
  { key: 'colors', label: 'Colors', emoji: '🎨' },
];

export function OpenPeepsAvatarBuilder({
  kidId,
  initialState,
  unlockedItems = [],
  onSave,
}: OpenPeepsAvatarBuilderProps) {
  const [state, setState] = useState<OpenPeepsState>({ ...DEFAULT_STATE, ...initialState });
  const [activeTab, setActiveTab] = useState<TabKey>('face');
  const [isSaving, setIsSaving] = useState(false);

  // Check if an item is unlocked (either by default or purchased)
  const isItemUnlocked = (category: string, itemId: string): boolean => {
    const options = openPeepsOptions[category as keyof typeof openPeepsOptions] as AvatarOption[];
    const item = options?.find(o => o.id === itemId);
    return item?.unlocked || unlockedItems.includes(`${category}:${itemId}`);
  };

  // Get cost for a locked item
  const getItemCost = (category: string, itemId: string): number | undefined => {
    const options = openPeepsOptions[category as keyof typeof openPeepsOptions] as AvatarOption[];
    const item = options?.find(o => o.id === itemId);
    return item?.unlocked ? undefined : item?.cost;
  };

  const handleSelect = (category: keyof OpenPeepsState, value: string) => {
    // Check if item is unlocked
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
        // Default save via API
        const res = await fetch(`/api/kids/${kidId}/avatar-state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openPeepsState: state,
            avatarUrl,
          }),
        });
        
        if (!res.ok) {
          throw new Error('Failed to save avatar');
        }
      }
      
      toast.success('Avatar saved! ✨');
    } catch (error) {
      console.error('Failed to save avatar:', error);
      toast.error('Could not save avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderOptionGrid = (
    category: 'face' | 'head' | 'accessories' | 'facialHair',
    options: AvatarOption[]
  ) => {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {options.map(option => {
          const isSelected = state[category] === option.id;
          const isUnlocked = option.unlocked || unlockedItems.includes(`${category}:${option.id}`);
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(category, option.id)}
              className={`
                relative p-2 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-[var(--ember-500)] bg-[var(--ember-500)]/10 scale-105'
                  : 'border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--background-secondary)]'
                }
                ${!isUnlocked ? 'opacity-60' : ''}
              `}
            >
              <div className="w-full aspect-square flex items-center justify-center mb-1">
                <OpenPeepsAvatar
                  seed={`preview-${option.id}`}
                  size={60}
                  {...{
                    ...state,
                    [category]: option.id,
                  }}
                  radius={50}
                />
              </div>
              <p className="text-xs text-center truncate text-muted">
                {option.label}
              </p>
              {!isUnlocked && option.cost && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {option.cost} 🌙
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderColorGrid = (
    category: 'skinColor' | 'clothingColor' | 'backgroundColor',
    options: ColorOption[],
    label: string
  ) => {
    return (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-heading dark:text-muted mb-3">{label}</h4>
        <div className="flex flex-wrap gap-2">
          {options.map(option => {
            const isSelected = state[category] === option.id;
            const isTransparent = option.color === 'transparent';
            
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(category, option.id)}
                className={`
                  w-10 h-10 rounded-full border-2 transition-all
                  ${isSelected
                    ? 'border-[var(--ink-900)] scale-110 ring-2 ring-[var(--ember-500)]'
                    : 'border-[var(--border)] hover:scale-105'
                  }
                `}
                style={{
                  backgroundColor: isTransparent ? 'transparent' : option.color,
                  backgroundImage: isTransparent
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                    : undefined,
                  backgroundSize: isTransparent ? '8px 8px' : undefined,
                  backgroundPosition: isTransparent ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                }}
                title={option.label}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-[var(--background-elevated)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-heading dark:text-[var(--foreground)]">
            Avatar Builder
          </h2>
        </div>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="relative rounded-full p-2 mb-3"
            style={{ 
              backgroundColor: state.backgroundColor === 'transparent' 
                ? 'var(--paper-100)' 
                : `#${state.backgroundColor}` 
            }}
          >
            <OpenPeepsAvatar
              seed={kidId}
              size={180}
              {...state}
              radius={50}
            />
          </div>
          <p className="text-sm text-muted">This is your avatar!</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--border)] pb-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-3 sm:px-4 py-2 font-medium transition-colors rounded-t-lg text-sm sm:text-base
                ${activeTab === tab.key
                  ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)] bg-[var(--background-secondary)]'
                  : 'text-muted hover:text-heading dark:hover:text-muted'
                }
              `}
            >
              <span className="mr-1">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'face' && (
            <>
              <h3 className="text-lg font-semibold text-heading dark:text-[var(--foreground)] mb-4">
                Choose an Expression
              </h3>
              {renderOptionGrid('face', openPeepsOptions.face as AvatarOption[])}
            </>
          )}

          {activeTab === 'head' && (
            <>
              <h3 className="text-lg font-semibold text-heading dark:text-[var(--foreground)] mb-4">
                Choose a Hairstyle
              </h3>
              {renderOptionGrid('head', openPeepsOptions.head as AvatarOption[])}
            </>
          )}

          {activeTab === 'accessories' && (
            <>
              <h3 className="text-lg font-semibold text-heading dark:text-[var(--foreground)] mb-4">
                Add Accessories
              </h3>
              {renderOptionGrid('accessories', openPeepsOptions.accessories as AvatarOption[])}
            </>
          )}

          {activeTab === 'facialHair' && (
            <>
              <h3 className="text-lg font-semibold text-heading dark:text-[var(--foreground)] mb-4">
                Facial Hair
              </h3>
              {renderOptionGrid('facialHair', openPeepsOptions.facialHair as AvatarOption[])}
            </>
          )}

          {activeTab === 'colors' && (
            <>
              <h3 className="text-lg font-semibold text-heading dark:text-[var(--foreground)] mb-4">
                Customize Colors
              </h3>
              {renderColorGrid('skinColor', openPeepsOptions.skinColor as ColorOption[], '👤 Skin Tone')}
              {renderColorGrid('clothingColor', openPeepsOptions.clothingColor as ColorOption[], '👕 Clothing Color')}
              {renderColorGrid('backgroundColor', openPeepsOptions.backgroundColor as ColorOption[], '🖼️ Background')}
            </>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 py-3 px-6 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Avatar ✨'}
        </button>
      </div>
    </div>
  );
}
