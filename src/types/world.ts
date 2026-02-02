// Type definitions for the 2D World Game

/**
 * Represents a placeable item in the world (tree, house, rock, etc.)
 */
export type WorldItem = {
  id: string;
  type: string; // e.g., 'tree', 'house', 'rock', 'flower', 'bush'
  x: number;
  y: number;
  rotation?: number; // 0, 90, 180, 270
};

/**
 * Represents the full world map for a kid
 */
export type WorldMap = {
  id: string;
  kid_id: string;
  width: number;
  height: number;
  terrain: string[][]; // 2D array of terrain types: 'grass', 'sand', 'water'
  items: WorldItem[];
  avatar_x?: number; // Avatar position X
  avatar_y?: number; // Avatar position Y
  created_at?: string;
  updated_at?: string;
};

/**
 * Avatar position with direction for rendering
 */
export type AvatarPosition = {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
};

/**
 * Asset registry entry for extensibility
 */
export type WorldAssetDefinition = {
  id: string;
  label: string;
  category: 'terrain' | 'item';
  collision?: boolean; // If true, avatar cannot walk through (future use)
  price?: number; // Moon cost if purchasable (future use)
};

/**
 * Terrain types available in the world
 */
export const TERRAIN_TYPES = ['grass', 'sand', 'water'] as const;
export type TerrainType = (typeof TERRAIN_TYPES)[number];

/**
 * Item types available in the world
 */
export const ITEM_TYPES = [
  // Base items (always available)
  'tree', 'house', 'rock', 'flower', 'bush',
  // Medieval pack
  'castle', 'knight', 'dragon', 'banner',
  // Beach pack
  'palm_tree', 'umbrella', 'sandcastle', 'crab',
  // Space pack
  'rocket', 'alien', 'crater', 'space_flag',
  // Spooky pack
  'gravestone', 'ghost', 'pumpkin', 'bat',
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

/**
 * World pack definition
 */
export type WorldPackItem = {
  id: string;
  label: string;
  collision: boolean;
};

export type WorldPack = {
  id: string;
  name: string;
  description: string;
  cost: number;
  theme: string;
  previewEmoji: string;
  items: WorldPackItem[];
};

/**
 * Default empty world configuration
 */
export const DEFAULT_WORLD_SIZE = 10;

export function createEmptyWorld(kidId: string): Omit<WorldMap, 'id' | 'created_at' | 'updated_at'> {
  return {
    kid_id: kidId,
    width: DEFAULT_WORLD_SIZE,
    height: DEFAULT_WORLD_SIZE,
    terrain: Array(DEFAULT_WORLD_SIZE)
      .fill(null)
      .map(() => Array(DEFAULT_WORLD_SIZE).fill('grass')),
    items: [],
  };
}
