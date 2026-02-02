'use client';

/**
 * useAvatarMovement - Hook for avatar keyboard/touch movement with collision detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorldMap, AvatarPosition } from '@/types/world';
import { ASSET_METADATA } from '@/lib/world/assets';

interface UseAvatarMovementOptions {
  map: WorldMap | null;
  enabled: boolean; // Only move when not editing
  onPositionChange?: (x: number, y: number) => void;
}

interface UseAvatarMovementReturn {
  position: AvatarPosition;
  isMoving: boolean;
  moveAvatar: (direction: 'up' | 'down' | 'left' | 'right') => boolean;
  teleportTo: (x: number, y: number) => void;
}

export function useAvatarMovement({
  map,
  enabled,
  onPositionChange,
}: UseAvatarMovementOptions): UseAvatarMovementReturn {
  // Initialize position from map or center
  const [position, setPosition] = useState<AvatarPosition>(() => ({
    x: map?.avatar_x ?? Math.floor((map?.width ?? 10) / 2),
    y: map?.avatar_y ?? Math.floor((map?.height ?? 10) / 2),
    direction: 'down',
  }));
  
  const [isMoving, setIsMoving] = useState(false);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update position when map loads with saved position
  useEffect(() => {
    if (map?.avatar_x !== undefined && map?.avatar_y !== undefined) {
      setPosition(prev => ({
        ...prev,
        x: map.avatar_x!,
        y: map.avatar_y!,
      }));
    }
  }, [map?.avatar_x, map?.avatar_y]);

  /**
   * Check if a tile is blocked (water terrain or collision item)
   */
  const isBlocked = useCallback((x: number, y: number): boolean => {
    if (!map) return true;
    
    // Check boundaries
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
      return true;
    }
    
    // Check terrain (water is blocked)
    const terrain = map.terrain[y]?.[x];
    if (terrain === 'water') {
      return true;
    }
    
    // Check items with collision
    const itemAtPosition = map.items.find(item => item.x === x && item.y === y);
    if (itemAtPosition) {
      const metadata = ASSET_METADATA[itemAtPosition.type];
      if (metadata?.collision) {
        return true;
      }
    }
    
    return false;
  }, [map]);

  /**
   * Move avatar in a direction
   * Returns true if movement was successful
   */
  const moveAvatar = useCallback((direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    if (!enabled || !map) return false;

    let nextX = position.x;
    let nextY = position.y;

    switch (direction) {
      case 'up':
        nextY = position.y - 1;
        break;
      case 'down':
        nextY = position.y + 1;
        break;
      case 'left':
        nextX = position.x - 1;
        break;
      case 'right':
        nextX = position.x + 1;
        break;
    }

    // Always update direction for facing
    setPosition(prev => ({ ...prev, direction }));

    // Check if blocked
    if (isBlocked(nextX, nextY)) {
      return false;
    }

    // Move avatar
    setIsMoving(true);
    setPosition({ x: nextX, y: nextY, direction });
    
    // Notify position change (for saving)
    onPositionChange?.(nextX, nextY);

    // Clear moving state after animation
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
    }, 150);

    return true;
  }, [enabled, map, position, isBlocked, onPositionChange]);

  /**
   * Teleport avatar to specific position (for click-to-move)
   */
  const teleportTo = useCallback((x: number, y: number) => {
    if (!enabled || !map) return;
    if (isBlocked(x, y)) return;

    setPosition(prev => ({ ...prev, x, y }));
    onPositionChange?.(x, y);
  }, [enabled, map, isBlocked, onPositionChange]);

  /**
   * Keyboard event listener
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
      }

      if (direction) {
        e.preventDefault();
        moveAvatar(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, moveAvatar]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
  }, []);

  return {
    position,
    isMoving,
    moveAvatar,
    teleportTo,
  };
}
