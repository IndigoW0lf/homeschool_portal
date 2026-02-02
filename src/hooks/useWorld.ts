'use client';

/**
 * useWorld - Hook for managing world state with debounced auto-save
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorldMap, WorldItem, createEmptyWorld } from '@/types/world';

interface UseWorldOptions {
  kidId: string;
  debounceMs?: number;
}

interface UseWorldReturn {
  map: WorldMap | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  // Actions
  updateMap: (newMap: WorldMap) => void;
  placeItem: (item: Omit<WorldItem, 'id'>) => void;
  removeItem: (x: number, y: number) => void;
  updateTerrain: (x: number, y: number, terrain: string) => void;
  applyLayout: (terrain: string[][], items: WorldItem[]) => void;
}

export function useWorld({ kidId, debounceMs = 1000 }: UseWorldOptions): UseWorldReturn {
  const [map, setMap] = useState<WorldMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMapRef = useRef<WorldMap | null>(null);

  // Load initial world
  useEffect(() => {
    async function loadWorld() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/world/${kidId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load world');
        }
        
        const data = await response.json();
        setMap(data.world);
      } catch (err) {
        console.error('Error loading world:', err);
        setError(err instanceof Error ? err.message : 'Failed to load world');
        // Create empty world as fallback
        setMap({
          id: 'temp-' + Date.now(),
          ...createEmptyWorld(kidId),
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadWorld();
    
    // Cleanup pending saves on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // Flush pending save
        if (pendingMapRef.current) {
          saveToServer(pendingMapRef.current);
        }
      }
    };
  }, [kidId]);

  // Save to server (without debounce)
  const saveToServer = async (worldMap: WorldMap) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/world/${kidId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worldMap),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save world');
      }
      
      const data = await response.json();
      // Update with server response (includes updated_at)
      setMap(data.world);
      pendingMapRef.current = null;
    } catch (err) {
      console.error('Error saving world:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Debounced save
  const debouncedSave = useCallback((newMap: WorldMap) => {
    pendingMapRef.current = newMap;
    
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      if (pendingMapRef.current) {
        saveToServer(pendingMapRef.current);
      }
    }, debounceMs);
  }, [debounceMs, kidId]);

  // Update entire map
  const updateMap = useCallback((newMap: WorldMap) => {
    setMap(newMap);
    debouncedSave(newMap);
  }, [debouncedSave]);

  // Place an item at position
  const placeItem = useCallback((item: Omit<WorldItem, 'id'>) => {
    setMap((prev) => {
      if (!prev) return prev;
      
      // Remove existing item at position
      const filteredItems = prev.items.filter(
        (i) => !(i.x === item.x && i.y === item.y)
      );
      
      const newItem: WorldItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...item,
      };
      
      const newMap: WorldMap = {
        ...prev,
        items: [...filteredItems, newItem],
      };
      
      debouncedSave(newMap);
      return newMap;
    });
  }, [debouncedSave]);

  // Remove item at position
  const removeItem = useCallback((x: number, y: number) => {
    setMap((prev) => {
      if (!prev) return prev;
      
      const newMap: WorldMap = {
        ...prev,
        items: prev.items.filter((i) => !(i.x === x && i.y === y)),
      };
      
      debouncedSave(newMap);
      return newMap;
    });
  }, [debouncedSave]);

  // Update terrain at position
  const updateTerrain = useCallback((x: number, y: number, terrain: string) => {
    setMap((prev) => {
      if (!prev) return prev;
      
      const newTerrain = prev.terrain.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === y && colIndex === x ? terrain : cell
        )
      );
      
      const newMap: WorldMap = {
        ...prev,
        terrain: newTerrain,
      };
      
      debouncedSave(newMap);
      return newMap;
    });
  }, [debouncedSave]);

  // Apply a full layout (e.g., from AI generation)
  const applyLayout = useCallback((terrain: string[][], items: WorldItem[]) => {
    setMap((prev) => {
      if (!prev) return prev;
      
      const newMap: WorldMap = {
        ...prev,
        terrain,
        items,
      };
      
      debouncedSave(newMap);
      return newMap;
    });
  }, [debouncedSave]);

  return {
    map,
    loading,
    saving,
    error,
    updateMap,
    placeItem,
    removeItem,
    updateTerrain,
    applyLayout,
  };
}
