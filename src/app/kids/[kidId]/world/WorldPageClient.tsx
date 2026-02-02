'use client';

/**
 * WorldPageClient - Client component wrapper for the world game
 * 
 * Features:
 * - Edit mode: place/remove items, AI generation
 * - Play mode: avatar movement with keyboard/click
 */

import { useState, useCallback, useEffect } from 'react';
import { useWorld } from '@/hooks/useWorld';
import { useAvatarMovement } from '@/hooks/useAvatarMovement';
import WorldGrid from '@/components/world/WorldGrid';
import { WorldItem } from '@/types/world';
import { Hammer, GameController } from '@phosphor-icons/react';

interface WorldPageClientProps {
  kidId: string;
  kidName: string;
  kidAvatar?: React.ReactNode;
}

export default function WorldPageClient({ 
  kidId, 
  kidName,
  kidAvatar 
}: WorldPageClientProps) {
  const { map, loading, saving, error, placeItem, removeItem, applyLayout, updateMap, updateTerrain } = useWorld({ kidId });
  const [isEditing, setIsEditing] = useState(false); // Start in play mode!
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState('');
  const [unlockedPacks, setUnlockedPacks] = useState<string[]>([]);

  // Handle position change to save to database
  const handlePositionChange = useCallback((x: number, y: number) => {
    if (!map) return;
    updateMap({
      ...map,
      avatar_x: x,
      avatar_y: y,
    });
  }, [map, updateMap]);

  // Avatar movement hook
  const { position, isMoving, teleportTo } = useAvatarMovement({
    map,
    enabled: !isEditing,
    onPositionChange: handlePositionChange,
  });

  // Fetch unlocked world packs
  useEffect(() => {
    async function fetchUnlockedPacks() {
      try {
        const res = await fetch(`/api/world/${kidId}/packs`);
        if (res.ok) {
          const data = await res.json();
          setUnlockedPacks(data.unlockedPacks || []);
        }
      } catch (error) {
        console.error('Failed to fetch unlocked packs:', error);
      }
    }
    fetchUnlockedPacks();
  }, [kidId]);

  // Handle AI generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || generating) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/world/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Generation failed');
      }
      
      const { generated } = await response.json();
      
      if (generated) {
        applyLayout(generated.terrain, generated.items as WorldItem[]);
        setTheme('');
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Handle click-to-move in play mode
  const handleTileClick = useCallback((x: number, y: number) => {
    if (!isEditing) {
      teleportTo(x, y);
    }
  }, [isEditing, teleportTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Loading your world...</p>
        </div>
      </div>
    );
  }

  if (error || !map) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load world</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {kidName}&apos;s World 🌍
          </h1>
          <p className="text-slate-500">
            {isEditing ? 'Build your world!' : 'Explore your world!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`
              px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2
              ${isEditing 
                ? 'bg-amber-500 text-white' 
                : 'bg-emerald-500 text-white'}
            `}
          >
            {isEditing ? (
              <><Hammer weight="fill" size={20} /> Building</>
            ) : (
              <><GameController weight="fill" size={20} /> Playing</>
            )}
          </button>
        </div>
      </header>

      {/* Magic Generator (Edit Mode Only) */}
      {isEditing && (
        <form onSubmit={handleGenerate} className="flex gap-3">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., Spooky Forest, Beach Paradise, Snowy Village..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            disabled={generating}
          />
          <button
            type="submit"
            disabled={generating || !theme.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 
                       text-white font-medium rounded-xl
                       hover:from-purple-600 hover:to-indigo-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            {generating ? '✨ Creating...' : '✨ Magic Gen'}
          </button>
        </form>
      )}

      {/* World Grid */}
      <section className="flex justify-center">
        <WorldGrid
          map={map}
          isEditing={isEditing}
          saving={saving}
          kidAvatar={kidAvatar}
          unlockedPacks={unlockedPacks}
          avatarPosition={position}
          isMoving={isMoving}
          onTileClick={handleTileClick}
          onPlaceItem={placeItem}
          onRemoveItem={removeItem}
          onPaintTerrain={updateTerrain}
        />
      </section>

      {/* Mode-specific Tips */}
      <p className="text-center text-sm text-slate-400">
        {isEditing 
          ? '💡 Enter a theme above and click "Magic Gen" to auto-generate a world!'
          : '🎮 Use arrow keys or WASD to move. Click a tile to walk there!'}
      </p>
    </div>
  );
}
