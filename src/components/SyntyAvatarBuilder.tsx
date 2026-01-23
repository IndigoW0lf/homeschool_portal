'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { SyntyAvatarPreview } from '@/components/SyntyAvatarPreview';
import { ItemDesignRow } from '@/types/design-studio';

import { AvatarState } from '@/types';

interface SyntyAvatarBuilderProps {
  kidId: string;
  kidName: string;
  initialTextureUrl?: string; // Legacy/Full Outfit
  initialTopUrl?: string;
  initialBottomUrl?: string;
  initialShoesUrl?: string;
  initialSkinColor?: string;
  savedDesigns: ItemDesignRow[]; // All Synty designs
}

type Category = 'full' | 'top' | 'bottom' | 'shoes' | 'skin';

export function SyntyAvatarBuilder({ 
  kidId, 
  kidName, 
  initialTextureUrl,
  initialTopUrl,
  initialBottomUrl,
  initialShoesUrl,
  initialSkinColor = '#f2d3b1',
  savedDesigns 
}: SyntyAvatarBuilderProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>('top');
  
  // Selection state
  const [selectedFullUrl, setSelectedFullUrl] = useState<string | undefined>(initialTextureUrl);
  const [selectedTopUrl, setSelectedTopUrl] = useState<string | undefined>(initialTopUrl);
  const [selectedBottomUrl, setSelectedBottomUrl] = useState<string | undefined>(initialBottomUrl);
  const [selectedShoesUrl, setSelectedShoesUrl] = useState<string | undefined>(initialShoesUrl);
  const [selectedSkinColor, setSelectedSkinColor] = useState(initialSkinColor);
  
  // Tracking selected IDs to save
  const [selectedFullId, setSelectedFullId] = useState<string | undefined>();
  const [selectedTopId, setSelectedTopId] = useState<string | undefined>();
  const [selectedBottomId, setSelectedBottomId] = useState<string | undefined>();
  const [selectedShoesId, setSelectedShoesId] = useState<string | undefined>();
  
  const [isSaving, setIsSaving] = useState(false);

  const filteredDesigns = savedDesigns.filter(d => {
    switch (activeCategory) {
      case 'full': return d.template_id === 'template-synty-full' || d.template_id === 'template-synty';
      case 'top': return d.template_id === 'template-synty-top';
      case 'bottom': return d.template_id === 'template-synty-bottom';
      case 'shoes': return d.template_id === 'template-synty-shoes';
      default: return false;
    }
  });

  const handleSelectDesign = (design: ItemDesignRow) => {
    if (!design.texture_url) return;
    
    switch (activeCategory) {
      case 'full':
        setSelectedFullUrl(design.texture_url);
        setSelectedFullId(design.id);
        // Clear modular pieces if selecting full
        setSelectedTopUrl(undefined);
        setSelectedBottomUrl(undefined);
        break;
      case 'top':
        setSelectedTopUrl(design.texture_url);
        setSelectedTopId(design.id);
        setSelectedFullUrl(undefined); // Clear full if selecting modular
        break;
      case 'bottom':
        setSelectedBottomUrl(design.texture_url);
        setSelectedBottomId(design.id);
        setSelectedFullUrl(undefined);
        break;
      case 'shoes':
        setSelectedShoesUrl(design.texture_url);
        setSelectedShoesId(design.id);
        setSelectedFullUrl(undefined);
        break;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const avatarState: Partial<AvatarState> = {
        outfit: selectedFullId ? `custom:${selectedFullId}` : (selectedFullUrl ? 'custom' : ''),
        topId: selectedTopId,
        bottomId: selectedBottomId,
        shoesId: selectedShoesId,
        skinTone: selectedSkinColor,
      };

      const response = await fetch(`/api/kids/${kidId}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarState }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Avatar updated! 🌟');
      router.refresh();
    } catch (error) {
      console.error('Failed to save avatar:', error);
      toast.error('Failed to save avatar');
    } finally {
      setIsSaving(false);
    }
  };

  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'skin', label: 'Skin', icon: '🎨' },
    { id: 'top', label: 'Tops', icon: '👕' },
    { id: 'bottom', label: 'Bottoms', icon: '👖' },
    { id: 'shoes', label: 'Shoes', icon: '👟' },
    { id: 'full', label: 'Full', icon: '👤' },
  ];

  const skinColors = [
    '#f2d3b1', '#ebbe9b', '#e0ac69', '#c68642', '#8d5524',
    '#5e3c1e', '#3d2516', '#ffffff', '#f1f1f1'
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-[var(--background-elevated)] rounded-2xl p-4 md:p-8 shadow-xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-heading tracking-tight">
              Avatar Builder
            </h1>
            <p className="text-muted font-medium">
              Create your unique look, {kidName}!
            </p>
          </div>
          <Link
            href={`/kids/${kidId}/studio`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-500/20 active:scale-95 text-sm"
          >
            🎨 Design New Items
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: 3D Preview (5/12) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full aspect-square md:aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900/20 border-4 border-white dark:border-[var(--border)] shadow-2xl relative group">
              <SyntyAvatarPreview 
                kidId={kidId} 
                textureUrl={selectedFullUrl}
                topUrl={selectedTopUrl}
                bottomUrl={selectedBottomUrl}
                shoesUrl={selectedShoesUrl}
                skinColor={selectedSkinColor}
              />
              <div className="absolute top-4 left-4 bg-white/80 dark:bg-[var(--background-secondary)]/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-widest shadow-sm">
                3D Life Preview
              </div>
            </div>
          </div>

          {/* Right: Wardrobe (7/12) */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
            {/* Category Tabs */}
            <div className="flex gap-1 bg-[var(--background-secondary)]/50 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-[var(--background-elevated)] text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-900/30'
                      : 'text-muted hover:text-heading dark:hover:text-muted hover:bg-white/50 dark:hover:bg-[var(--night-800)]/30'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1 bg-[var(--background-secondary)] dark:bg-[var(--night-900)]/30 rounded-2xl p-4 border border-[var(--border)] overflow-hidden flex flex-col">
              {activeCategory === 'skin' ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {skinColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedSkinColor(color)}
                      className={`aspect-square rounded-full border-4 transition-all hover:scale-110 active:scale-95 ${
                        selectedSkinColor === color
                          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                          : 'border-white dark:border-[var(--border)]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              ) : filteredDesigns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-[var(--background-elevated)] rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                    🪹
                  </div>
                  <p className="text-muted font-medium max-w-[200px] mx-auto text-sm leading-relaxed">
                    You haven't designed any {activeCategory}s yet!
                  </p>
                  <Link
                    href={`/kids/${kidId}/studio`}
                    className="mt-4 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    Go to Design Studio
                  </Link>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Clear-Selection / Default Option */}
                    <button
                      onClick={() => {
                        if (activeCategory === 'full') {
                          setSelectedFullUrl(undefined);
                          setSelectedFullId(undefined);
                        } else if (activeCategory === 'top') {
                          setSelectedTopUrl(undefined);
                          setSelectedTopId(undefined);
                        } else if (activeCategory === 'bottom') {
                          setSelectedBottomUrl(undefined);
                          setSelectedBottomId(undefined);
                        } else if (activeCategory === 'shoes') {
                          setSelectedShoesUrl(undefined);
                          setSelectedShoesId(undefined);
                        }
                      }}
                      className={`aspect-square rounded-xl border-2 p-3 flex flex-col items-center justify-center font-bold tracking-tight transition-all hover:border-indigo-200 dark:hover:border-indigo-800 ${
                        (activeCategory === 'full' && !selectedFullUrl) ||
                        (activeCategory === 'top' && !selectedTopUrl) ||
                        (activeCategory === 'bottom' && !selectedBottomUrl) ||
                        (activeCategory === 'shoes' && !selectedShoesUrl)
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-dashed border-[var(--border)] dark:border-[var(--border)] text-muted'
                      }`}
                    >
                      <div className="text-lg mb-1">❌</div>
                      <span className="text-[10px] uppercase font-black">None</span>
                    </button>

                    {/* Saved Designs */}
                    {filteredDesigns.map((design) => {
                      const isSelected = 
                        (activeCategory === 'full' && selectedFullId === design.id) ||
                        (activeCategory === 'top' && selectedTopId === design.id) ||
                        (activeCategory === 'bottom' && selectedBottomId === design.id) ||
                        (activeCategory === 'shoes' && selectedShoesId === design.id);

                      return (
                        <button
                          key={design.id}
                          onClick={() => handleSelectDesign(design)}
                          className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-102 active:scale-98 relative ${
                            isSelected
                              ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                              : 'border-transparent bg-[var(--background-elevated)] shadow-sm hover:shadow-md'
                          }`}
                        >
                          {design.texture_url ? (
                            <img 
                              src={design.texture_url} 
                              alt={design.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)]">
                              🖼️
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-indigo-500/10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-[10px] font-bold text-white truncate text-left">
                              {design.name || 'Untitled'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex gap-4">
              <Link
                href={`/kids/${kidId}`}
                className="flex-[2] py-4 px-6 bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-heading dark:text-muted rounded-xl font-bold text-center hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-700)] transition-all active:scale-95 border border-transparent dark:border-[var(--border)]"
              >
                Back to Portal
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[3] py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 hover:scale-102 transition-all active:scale-98 disabled:opacity-50 disabled:grayscale uppercase tracking-wider"
              >
                {isSaving ? 'Saving Changes...' : 'Save My Legend 🌟'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

