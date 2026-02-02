'use client';

/**
 * WorldGrid - Interactive 2D world map component
 * 
 * Features:
 * - CSS Grid-based rendering
 * - Item placement in edit mode  
 * - Terrain color display
 * - Movable avatar with collision (Tier 2)
 */

import React, { useState } from 'react';
import { WorldMap, WorldItem, AvatarPosition, TerrainType } from '@/types/world';
import { getAssetComponent, getAvailableItems, TERRAIN_COLORS, TERRAIN_HEX as TERRAIN_PALETTE, ASSET_METADATA } from '@/lib/world/assets';

interface WorldGridProps {
  map: WorldMap;
  isEditing: boolean;
  saving?: boolean;
  kidAvatar?: React.ReactNode;
  unlockedPacks?: string[];
  // Movement mode props
  avatarPosition?: AvatarPosition;
  isMoving?: boolean;
  onTileClick?: (x: number, y: number) => void;
  // Edit mode props
  onPlaceItem?: (item: Omit<WorldItem, 'id'>) => void;
  onRemoveItem?: (x: number, y: number) => void;
  onPaintTerrain?: (x: number, y: number, terrain: TerrainType) => void;
}

export default function WorldGrid({
  map,
  isEditing,
  saving = false,
  kidAvatar,
  unlockedPacks = [],
  avatarPosition,
  isMoving = false,
  onTileClick,
  onPlaceItem,
  onRemoveItem,
  onPaintTerrain,
}: WorldGridProps) {
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType | null>(null);
  
  // Get available items for toolbar (base + unlocked packs)
  const availableItems = getAvailableItems(unlockedPacks);

  // Terrain options
  const terrainOptions: { type: TerrainType; label: string; color: string }[] = [
    { type: 'grass', label: 'Grass', color: TERRAIN_PALETTE.grass },
    { type: 'sand', label: 'Sand', color: TERRAIN_PALETTE.sand },
    { type: 'water', label: 'Water', color: TERRAIN_PALETTE.water },
  ];

  // Handle clicking a tile
  const handleTileClick = (x: number, y: number) => {
    if (isEditing) {
      // Terrain painting mode
      if (selectedTerrain) {
        onPaintTerrain?.(x, y, selectedTerrain);
        return;
      }
      
      // Item placement mode
      const existingItem = map.items.find((i) => i.x === x && i.y === y);

      if (existingItem) {
        onRemoveItem?.(x, y);
      } else if (selectedItemType) {
        const terrain = map.terrain[y]?.[x];
        if (terrain === 'water') return;
        onPlaceItem?.({ type: selectedItemType, x, y });
      }
    } else {
      // Play mode: click to move
      onTileClick?.(x, y);
    }
  };

  // Check if a tile is blocked (for highlighting walkable tiles)
  const isTileBlocked = (x: number, y: number): boolean => {
    const terrain = map.terrain[y]?.[x];
    if (terrain === 'water') return true;
    
    const item = map.items.find(i => i.x === x && i.y === y);
    if (item && ASSET_METADATA[item.type]?.collision) return true;
    
    return false;
  };

  // Calculate grid size
  const gridSize = Math.min(map.width, map.height);
  const cellSize = 600 / gridSize;
  const padding = 12; // 3 * 4 (p-3 in pixels)

  return (
    <div className="flex gap-6">
      {/* Editor Toolbar */}
      {isEditing && (
        <div className="w-48 flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-200 max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Builder</h3>
            {saving && (
              <span className="text-xs text-slate-400 animate-pulse">Saving...</span>
            )}
          </div>
          
          {/* Terrain Palette */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-semibold text-slate-500 mb-2">🎨 TERRAIN</h4>
            <div className="flex gap-2">
              {terrainOptions.map(({ type, label, color }) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedTerrain(selectedTerrain === type ? null : type);
                    setSelectedItemType(null); // Clear item selection
                  }}
                  className={`
                    flex-1 p-2 rounded-lg border-2 transition-all
                    ${selectedTerrain === type 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-slate-100 hover:border-slate-300'}
                  `}
                  title={label}
                >
                  <div 
                    className="w-full h-6 rounded"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
            {selectedTerrain && (
              <p className="text-xs text-indigo-600 mt-1 text-center">
                Click tiles to paint {selectedTerrain}
              </p>
            )}
          </div>

          {/* Items Section */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-semibold text-slate-500 mb-2">🏠 ITEMS</h4>
            <p className="text-xs text-slate-400 mb-2">
              Click to place, click again to remove
            </p>
            <div className="flex flex-col gap-2">
              {availableItems.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedItemType(selectedItemType === type ? null : type);
                    setSelectedTerrain(null); // Clear terrain selection
                  }}
                  className={`
                    p-2 rounded-xl border-2 text-left flex items-center gap-3 
                    transition-all duration-150
                    ${selectedItemType === type 
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}
                  `}
                >
                  <div className="w-10 h-10 flex-shrink-0">
                    {getAssetComponent(type)}
                  </div>
                  <span className="font-medium text-slate-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {(selectedItemType || selectedTerrain) && (
            <button
              onClick={() => {
                setSelectedItemType(null);
                setSelectedTerrain(null);
              }}
              className="mt-2 text-sm text-slate-500 hover:text-slate-700"
            >
              ✕ Clear selection
            </button>
          )}
        </div>
      )}

      {/* Movement Instructions (Play Mode) */}
      {!isEditing && (
        <div className="w-48 flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700">Controls</h3>
          <p className="text-xs text-slate-500">
            Use arrow keys or WASD to move around your world!
          </p>
          <div className="flex flex-col items-center gap-1 mt-2">
            <kbd className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">↑</kbd>
            <div className="flex gap-1">
              <kbd className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">←</kbd>
              <kbd className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">↓</kbd>
              <kbd className="px-3 py-1 bg-slate-100 rounded text-sm font-mono">→</kbd>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Or click any open tile to walk there
          </p>
        </div>
      )}

      {/* The World Grid */}
      <div className="relative">
        <div 
          className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${map.width}, minmax(0, 1fr))`,
            width: '600px',
            height: '600px',
          }}
        >
          {map.terrain.map((row, y) => (
            row.map((cellType, x) => {
              const item = map.items.find((i) => i.x === x && i.y === y);
              const isHoverable = isEditing ? (selectedItemType || item) : !isTileBlocked(x, y);
              const isAvatarHere = avatarPosition && avatarPosition.x === x && avatarPosition.y === y;

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleTileClick(x, y)}
                  className={`
                    relative border-[0.5px] transition-all duration-150
                    ${TERRAIN_COLORS[cellType] || 'bg-white border-slate-100'}
                    ${isHoverable ? 'cursor-pointer hover:brightness-95' : ''}
                    ${isEditing && selectedItemType && !item && cellType !== 'water' ? 'hover:ring-2 hover:ring-indigo-300 hover:ring-inset' : ''}
                    ${!isEditing && !isTileBlocked(x, y) && !isAvatarHere ? 'hover:ring-2 hover:ring-emerald-300 hover:ring-inset' : ''}
                  `}
                  style={{ aspectRatio: '1' }}
                >
                  {/* Render Item if present */}
                  {item && (
                    <div className="absolute inset-1 pointer-events-none animate-in zoom-in-50 duration-200">
                      {getAssetComponent(item.type)}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {/* Movable Avatar Overlay */}
        {kidAvatar && avatarPosition && !isEditing && (
          <div 
            className={`
              absolute pointer-events-none z-10
              transition-all duration-150 ease-out
              ${isMoving ? 'scale-110' : ''}
            `}
            style={{
              left: `${padding + avatarPosition.x * cellSize}px`,
              top: `${padding + avatarPosition.y * cellSize}px`,
              width: cellSize,
              height: cellSize,
              // Flip avatar based on direction
              transform: avatarPosition.direction === 'left' ? 'scaleX(-1)' : undefined,
            }}
          >
            <div className="w-full h-full flex items-center justify-center drop-shadow-md">
              {kidAvatar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
