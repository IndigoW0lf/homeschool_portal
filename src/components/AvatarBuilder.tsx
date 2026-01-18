'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AvatarAssets, AvatarAsset, AvatarState } from '@/types';
import { ItemDesignRow, DesignTemplatesManifest } from '@/types/design-studio';
import { DesignCanvas } from './studio/DesignCanvas';
import designTemplatesData from '../../content/design-templates.json';
import { getAvatarState, setAvatarState, getDefaultAvatarState, saveAvatarToDatabase } from '@/lib/avatarStorage';
import { toast } from 'sonner';
import { BlockyAvatar } from './BlockyAvatar';
import { BlockyAvatar3D } from './BlockyAvatar3D';

interface AvatarBuilderProps {
  kidId: string;
  assets: AvatarAssets;
  initialAvatarState?: AvatarState | null;
  customDesigns?: ItemDesignRow[];
}

const SKIN_TONES = [
  { id: 'skin-01', color: '#ffdbac', label: 'Light' },
  { id: 'skin-02', color: '#f1c27d', label: 'Medium Light' },
  { id: 'skin-03', color: '#e0ac69', label: 'Medium' },
  { id: 'skin-04', color: '#c68642', label: 'Medium Dark' },
  { id: 'skin-05', color: '#8d5524', label: 'Dark' },
  { id: 'skin-06', color: '#3a2211', label: 'Deep' },
];

const COLOR_PALETTE = [
  { value: '--fabric-blue', label: 'Blue', color: '#5E7FB8' },
  { value: '--fabric-green', label: 'Green', color: '#6FAFA2' },
  { value: '--fabric-gold', label: 'Gold', color: '#E1B866' },
  { value: '--fabric-rose', label: 'Rose', color: '#D48A8A' },
  { value: '--fabric-lilac', label: 'Lilac', color: '#9C8FB8' },
  { value: '--leaf-500', label: 'Leaf', color: '#6F8F73' },
  { value: '--ember-500', label: 'Ember', color: '#E27D60' },
  { value: '--sky-400', label: 'Sky', color: '#7FB3D5' },
];

export function AvatarBuilder({ kidId, assets, initialAvatarState, customDesigns = [] }: AvatarBuilderProps) {
  const [state, setState] = useState<AvatarState>(getDefaultAvatarState());
  const [activeTab, setActiveTab] = useState<'skin' | 'outfit' | 'accessory'>('outfit');
  const [isSaving, setIsSaving] = useState(false);
  
  const templates = designTemplatesData as DesignTemplatesManifest;

  // ... (useEffect remains same) ...
  useEffect(() => {
    // Priority: initialAvatarState (from DB) > localStorage > default
    if (initialAvatarState) {
      setState(initialAvatarState);
    } else {
      const savedState = getAvatarState(kidId);
      if (savedState) {
        setState(savedState);
      }
    }
  }, [kidId, initialAvatarState]);

  const handleAssetSelect = (asset: AvatarAsset | ItemDesignRow) => {
    if ('design_data' in asset) {
       // It's a custom design
       setState(prev => ({ ...prev, outfit: `custom:${asset.id}` }));
    } else {
      // Standard asset
      if (asset.category === 'base') {
        setState(prev => ({ ...prev, base: asset.id }));
      } else if (asset.category === 'outfit') {
        setState(prev => ({ ...prev, outfit: asset.id }));
      } else if (asset.category === 'accessory') {
        setState(prev => ({ ...prev, accessory: asset.id }));
      }
    }
  };
  
  // ... (handleColorChange, handleSave remain same) ...
  const handleColorChange = (part: string, colorVar: string) => {
    setState(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [part]: colorVar,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for quick access
      setAvatarState(kidId, state);
      
      // Save to database for persistence
      await saveAvatarToDatabase(kidId, state);
      
      toast.success('Avatar saved! ✨');
    } catch (err) {
      console.error('Failed to save avatar:', err);
      toast.error('Could not save avatar. Try again?');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentAsset = (category: 'skin' | 'outfit' | 'accessory'): AvatarAsset | undefined => {
    // Skin is handled via separate state/palette, not assets list
    if (category === 'skin') return undefined;

    const id = category === 'outfit' ? state.outfit : state.accessory;
    if (!id) return undefined;
    
    // Check if custom design
    if (category === 'outfit' && id.startsWith('custom:')) {
       return undefined; // Handled separately
    }

    const list = category === 'outfit' ? assets.outfits : assets.accessories;
    return list.find(a => a.id === id);
  };
  
  const getCustomDesign = (): ItemDesignRow | undefined => {
    if (!state.outfit.startsWith('custom:')) return undefined;
    const designId = state.outfit.split('custom:')[1];
    return customDesigns.find(d => d.id === designId);
  };

  const currentOutfit = getCurrentAsset('outfit');
  const colorableParts = currentOutfit?.colorableParts || [];

  const getTemplateForDesign = (design: ItemDesignRow) => {
    return templates.categories
      .flatMap(c => c.templates)
      .find(t => t.id === design.template_id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ... (Header) ... */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Avatar Builder</h2>
          <Link 
            href={`/kids/${kidId}/studio`}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
          >
            🎨 Design Studio
          </Link>
        </div>
        
        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="relative w-48 h-48 rounded-lg flex items-center justify-center mb-2"
            style={{ backgroundColor: 'var(--paper-100)' }}
          >
            {/* Custom 3D Avatar or Standard 2D Avatar */}
            {state.outfit && state.outfit.startsWith('custom:') ? (
              <div className="absolute inset-0 w-full h-full">
                <BlockyAvatar3D 
                  textureUrl={getCustomDesign()?.texture_url} 
                  className="w-full h-full"
                />
              </div>
            ) : (
              <>
                {/* 2D Base */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center h-[90%]">
                  <BlockyAvatar 
                    className="h-full w-auto" 
                    size={180}
                    skinColors={{ 
                      skin: state.colors?.skin || '#ffdbac'
                    }}
                  />
                </div>
                
                {/* 2D Outfit Overlay */}
                {state.outfit && getCurrentAsset('outfit') && (
                  <img
                    src={getCurrentAsset('outfit')?.src}
                    alt="Avatar outfit"
                    className="absolute inset-0 w-full h-full object-contain z-10"
                  />
                )}
                
                {/* 2D Accessory Overlay */}
                {state.accessory && getCurrentAsset('accessory') && (
                  <img
                    src={getCurrentAsset('accessory')?.src}
                    alt="Avatar accessory"
                    className="absolute inset-0 w-full h-full object-contain z-20"
                  />
                )}
              </>
            )}
          </div>
          <div className="avatar-shadow"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('skin')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'skin'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Skin
          </button>
          <button
            onClick={() => setActiveTab('outfit')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'outfit'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Outfit
          </button>
          <button
            onClick={() => setActiveTab('accessory')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'accessory'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Accessory
          </button>
        </div>

        {/* Asset Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Select {activeTab === 'skin' ? 'Skin Tone' : activeTab === 'outfit' ? 'Outfit' : 'Accessory'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {activeTab === 'skin' ? (
              // Skin Tone Selection
              SKIN_TONES.map(tone => {
                const isSelected = state.colors?.skin === tone.color || (!state.colors?.skin && tone.id === 'skin-01');
                
                return (
                  <button
                    key={tone.id}
                    onClick={() => setState(prev => ({
                      ...prev,
                      colors: { ...prev.colors, skin: tone.color }
                    }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="w-full h-24 bg-[var(--paper-100)] rounded mb-2 flex items-center justify-center relative overflow-hidden">
                      <div 
                        className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
                        style={{ backgroundColor: tone.color }}
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center truncate">
                      {tone.label}
                    </p>
                  </button>
                );
              })
            ) : (
              // Outfits and Accessories
              (activeTab === 'outfit' ? [...customDesigns, ...assets.outfits] : assets.accessories).map(asset => {
                // Distinguish between standard Asset and Custom Design
                const isCustom = 'design_data' in asset;
                const assetId = asset.id;
                
                const isSelected = 
                  (activeTab === 'outfit' && (isCustom ? state.outfit === `custom:${assetId}` : state.outfit === assetId)) ||
                  (activeTab === 'accessory' && state.accessory === assetId);
                
                return (
                  <button
                    key={assetId}
                    onClick={() => handleAssetSelect(asset)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="w-full h-24 bg-[var(--paper-100)] rounded mb-2 flex items-center justify-center relative overflow-hidden">
                      {isCustom ? (
                        (() => {
                          const template = getTemplateForDesign(asset as ItemDesignRow);
                          return template ? (
                            <div className="absolute inset-0 transform scale-75 origin-center">
                              <DesignCanvas
                                template={template}
                                regions={(asset as ItemDesignRow).design_data.regions}
                                activeRegion={null}
                                tool="fill"
                                currentColor="#000"
                                brushSize={1}
                                readonly={true}
                                transparent={true}
                              />
                            </div>
                          ) : null;
                        })()
                      ) : (
                        <img
                          src={(asset as AvatarAsset).src}
                          alt={(asset as AvatarAsset).label}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center truncate">
                      {(asset as any).label || (asset as any).name}
                    </p>
                    {isCustom && (
                      <span className="text-xs text-[var(--ember-500)] block text-center">Custom</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Color Picker */}
        {activeTab === 'outfit' && colorableParts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Colors</h3>
            <div className="space-y-4">
              {colorableParts.map(part => (
                <div key={part}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                    {part}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map(color => {
                      const isSelected = state.colors[part] === color.value;
                      return (
                        <button
                          key={color.value}
                          onClick={() => handleColorChange(part, color.value)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            isSelected
                              ? 'border-[var(--ink-900)] scale-110'
                              : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.color }}
                          title={color.label}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 px-6 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Avatar'}
        </button>
      </div>
    </div>
  );
}
