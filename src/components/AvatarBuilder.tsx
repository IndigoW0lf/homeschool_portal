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

interface StarterOutfit {
  id: string;
  label: string;
  src: string;
  thumbnail: string;
  unlocked: boolean;
}

interface AvatarBuilderProps {
  kidId: string;
  assets: AvatarAssets & { 
    starterOutfits?: StarterOutfit[]; 
    skinTones?: { id: string; color: string; label: string }[];
  };
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

export function AvatarBuilder({ kidId, assets, initialAvatarState }: AvatarBuilderProps) {
  const [state, setState] = useState<AvatarState>(getDefaultAvatarState());
  const [activeTab, setActiveTab] = useState<'skin' | 'face' | 'hair' | 'outfit' | 'accessory'>('skin');
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
  
  

  const currentOutfit = getCurrentAsset('outfit');
  const colorableParts = currentOutfit?.colorableParts || [];


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ... (Header) ... */}
      <div className="bg-[var(--background-elevated)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-heading dark:text-white">Avatar Builder</h2>
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
            {/* 2D BlockyAvatar with all customization */}
            <BlockyAvatar 
              size={180}
              skinColors={{ 
                skin: state.skinTone || state.colors?.skin || '#ffdbac'
              }}
              faceType={(state.faceId?.replace('face-', '') as 'happy' | 'cool' | 'surprised' | 'sleepy' | 'silly') || 'happy'}
              hairType={(state.hairId?.replace('hair-', '') as 'none' | 'short' | 'medium' | 'long' | 'curly' | 'spiky') || 'none'}
              hairColor={state.colors?.hair || '#4a3728'}
              outfitColor={state.colors?.outfit || '#5e7fb8'}
              pantsColor={state.colors?.pants || '#4a5568'}
            />
          </div>
          <div className="avatar-shadow"></div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('skin')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'skin'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-muted hover:text-heading dark:hover:text-muted'
            }`}
          >
            Skin
          </button>
          <button
            onClick={() => setActiveTab('face')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'face'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-muted hover:text-heading dark:hover:text-muted'
            }`}
          >
            Face
          </button>
          <button
            onClick={() => setActiveTab('hair')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'hair'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-muted hover:text-heading dark:hover:text-muted'
            }`}
          >
            Hair
          </button>
          <button
            onClick={() => setActiveTab('outfit')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'outfit'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-muted hover:text-heading dark:hover:text-muted'
            }`}
          >
            Outfit
          </button>
          <button
            onClick={() => setActiveTab('accessory')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'accessory'
                ? 'text-[var(--ember-500)] border-b-2 border-[var(--ember-500)]'
                : 'text-muted hover:text-heading dark:hover:text-muted'
            }`}
          >
            Accessory
          </button>
        </div>

        {/* Asset Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">
            Select {
              activeTab === 'skin' ? 'Skin Tone' : 
              activeTab === 'face' ? 'Face' : 
              activeTab === 'hair' ? 'Hair Style' : 
              activeTab === 'outfit' ? 'Outfit' : 'Accessory'
            }
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {activeTab === 'skin' ? (
              // Skin Tone Selection
              (assets.skinTones || SKIN_TONES).map(tone => {
                const isSelected = state.skinTone === tone.color || state.colors?.skin === tone.color || (!state.skinTone && !state.colors?.skin && tone.id === 'skin-01');
                
                return (
                  <button
                    key={tone.id}
                    onClick={() => setState(prev => ({
                      ...prev,
                      skinTone: tone.color,
                      colors: { ...prev.colors, skin: tone.color }
                    }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                        : 'border-[var(--border)] hover:border-[var(--border)] dark:hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="w-full h-24 bg-[var(--paper-100)] rounded mb-2 flex items-center justify-center relative overflow-hidden">
                      <div 
                        className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
                        style={{ backgroundColor: tone.color }}
                      />
                    </div>
                    <p className="text-sm text-heading dark:text-muted text-center truncate">
                      {tone.label}
                    </p>
                  </button>
                );
              })
            ) : activeTab === 'face' ? (
              // Face Selection - using mini BlockyAvatar previews
              [
                { id: 'face-happy', label: 'Happy 😊', type: 'happy' as const },
                { id: 'face-cool', label: 'Cool 😎', type: 'cool' as const },
                { id: 'face-surprised', label: 'Surprised 😮', type: 'surprised' as const },
                { id: 'face-sleepy', label: 'Sleepy 😴', type: 'sleepy' as const },
                { id: 'face-silly', label: 'Silly 😜', type: 'silly' as const },
              ].map(face => {
                const isSelected = state.faceId === face.id;
                return (
                  <button
                    key={face.id}
                    onClick={() => setState(prev => ({ ...prev, faceId: face.id }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                        : 'border-[var(--border)] hover:border-[var(--border)] dark:hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="w-full h-24 flex items-center justify-center">
                      <BlockyAvatar 
                        size={80}
                        skinColors={{ skin: state.skinTone || state.colors?.skin || '#ffdbac' }}
                        faceType={face.type}
                        hairType="none"
                      />
                    </div>
                    <p className="text-sm text-heading dark:text-muted text-center truncate mt-2">
                      {face.label}
                    </p>
                  </button>
                );
              })
            ) : activeTab === 'hair' ? (
              // Hair Selection - using mini BlockyAvatar previews + color picker
              <>
                {/* Hair Styles */}
                {[
                  { id: 'hair-none', label: 'None', type: 'none' as const },
                  { id: 'hair-short', label: 'Short', type: 'short' as const },
                  { id: 'hair-medium', label: 'Medium', type: 'medium' as const },
                  { id: 'hair-long', label: 'Long', type: 'long' as const },
                  { id: 'hair-curly', label: 'Curly', type: 'curly' as const },
                  { id: 'hair-spiky', label: 'Spiky', type: 'spiky' as const },
                ].map(hair => {
                  const isSelected = state.hairId === hair.id || (!state.hairId && hair.id === 'hair-none');
                  return (
                    <button
                      key={hair.id}
                      onClick={() => setState(prev => ({ ...prev, hairId: hair.id }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--ember-500)] bg-[var(--paper-100)]'
                          : 'border-[var(--border)] hover:border-[var(--border)] dark:hover:border-[var(--border)]'
                      }`}
                    >
                      <div className="w-full h-24 flex items-center justify-center">
                        <BlockyAvatar 
                          size={80}
                          skinColors={{ skin: state.skinTone || state.colors?.skin || '#ffdbac' }}
                          faceType={(state.faceId?.replace('face-', '') as 'happy' | 'cool' | 'surprised' | 'sleepy' | 'silly') || 'happy'}
                          hairType={hair.type}
                          hairColor={state.colors?.hair || '#4a3728'}
                        />
                      </div>
                      <p className="text-sm text-heading dark:text-muted text-center truncate mt-2">
                        {hair.label}
                      </p>
                    </button>
                  );
                })}
                
                {/* Hair Color Picker */}
                <div className="col-span-full mt-4 p-4 bg-[var(--background-secondary)] dark:bg-[var(--night-900)] rounded-lg">
                  <p className="text-sm font-medium text-heading dark:text-muted mb-3">Hair Color</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#1a1a1a', label: 'Black' },
                      { color: '#4a3728', label: 'Brown' },
                      { color: '#8B4513', label: 'Auburn' },
                      { color: '#D4A574', label: 'Blonde' },
                      { color: '#B8860B', label: 'Golden' },
                      { color: '#808080', label: 'Gray' },
                      { color: '#FF6B6B', label: 'Red' },
                      { color: '#9B59B6', label: 'Purple' },
                      { color: '#3498DB', label: 'Blue' },
                      { color: '#2ECC71', label: 'Green' },
                      { color: '#F39C12', label: 'Orange' },
                      { color: '#E91E8C', label: 'Pink' },
                    ].map(hc => {
                      const isSelected = state.colors?.hair === hc.color;
                      return (
                        <button
                          key={hc.color}
                          onClick={() => setState(prev => ({
                            ...prev,
                            colors: { ...prev.colors, hair: hc.color }
                          }))}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            isSelected
                              ? 'border-[var(--ink-900)] scale-110'
                              : 'border-[var(--border)] dark:border-[var(--border)] hover:scale-105'
                          }`}
                          style={{ backgroundColor: hc.color }}
                          title={hc.label}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            ) : activeTab === 'outfit' ? (
              // Outfit Color Selection
              <>
                {/* Shirt Color */}
                <div className="col-span-full">
                  <p className="text-sm font-medium text-heading dark:text-muted mb-3">👕 Shirt Color</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#5E7FB8', label: 'Blue' },
                      { color: '#6FAFA2', label: 'Teal' },
                      { color: '#E1B866', label: 'Gold' },
                      { color: '#D48A8A', label: 'Rose' },
                      { color: '#9C8FB8', label: 'Lilac' },
                      { color: '#6F8F73', label: 'Sage' },
                      { color: '#E27D60', label: 'Coral' },
                      { color: '#7FB3D5', label: 'Sky' },
                      { color: '#2c3e50', label: 'Navy' },
                      { color: '#e74c3c', label: 'Red' },
                      { color: '#27ae60', label: 'Green' },
                      { color: '#f39c12', label: 'Orange' },
                      { color: '#9b59b6', label: 'Purple' },
                      { color: '#1abc9c', label: 'Mint' },
                      { color: '#ffffff', label: 'White' },
                      { color: '#2c2c2c', label: 'Black' },
                    ].map(c => {
                      const isSelected = state.colors?.outfit === c.color;
                      return (
                        <button
                          key={c.color}
                          onClick={() => setState(prev => ({
                            ...prev,
                            colors: { ...prev.colors, outfit: c.color }
                          }))}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-[var(--ink-900)] scale-110'
                              : 'border-[var(--border)] dark:border-[var(--border)] hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* Pants Color */}
                <div className="col-span-full mt-4">
                  <p className="text-sm font-medium text-heading dark:text-muted mb-3">👖 Pants Color</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { color: '#4a5568', label: 'Gray' },
                      { color: '#2c3e50', label: 'Navy' },
                      { color: '#1a1a1a', label: 'Black' },
                      { color: '#8B7355', label: 'Brown' },
                      { color: '#5D6D7E', label: 'Slate' },
                      { color: '#4a3728', label: 'Dark Brown' },
                      { color: '#3498db', label: 'Denim' },
                      { color: '#7f8c8d', label: 'Charcoal' },
                      { color: '#27ae60', label: 'Olive' },
                      { color: '#8e44ad', label: 'Plum' },
                      { color: '#d35400', label: 'Rust' },
                      { color: '#f5f5dc', label: 'Khaki' },
                    ].map(c => {
                      const isSelected = state.colors?.pants === c.color;
                      return (
                        <button
                          key={c.color}
                          onClick={() => setState(prev => ({
                            ...prev,
                            colors: { ...prev.colors, pants: c.color }
                          }))}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-[var(--ink-900)] scale-110'
                              : 'border-[var(--border)] dark:border-[var(--border)] hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              // Accessories - keep simple for now
              <p className="col-span-full text-sm text-muted text-center py-8">
                🎩 Accessories coming soon!
              </p>
            )}
          </div>
        </div>

        {/* Color Picker */}
        {activeTab === 'outfit' && colorableParts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-heading dark:text-white mb-4">Colors</h3>
            <div className="space-y-4">
              {colorableParts.map(part => (
                <div key={part}>
                  <label className="block text-sm font-medium text-heading dark:text-muted mb-2 capitalize">
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
                              : 'border-[var(--border)] dark:border-[var(--border)] hover:scale-105'
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
