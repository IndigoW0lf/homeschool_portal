/**
 * World Map Generator - AI-powered terrain and item generation
 * Uses OpenAI to generate themed world layouts
 */

import { OpenAI } from 'openai';
import { WorldMap, TERRAIN_TYPES, ITEM_TYPES, DEFAULT_WORLD_SIZE } from '@/types/world';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WORLD_GENERATOR_PROMPT = `
You are a 2D world map generator for a kids game.
Generate a ${DEFAULT_WORLD_SIZE}x${DEFAULT_WORLD_SIZE} grid world based on the user's theme.
Return ONLY a valid JSON object with no markdown formatting.

Schema:
{
  "terrain": [
    ["grass", "grass", "water", ...],  // 10 items per row
    ...                                  // 10 rows total
  ],
  "items": [
    { "id": "item_1", "type": "tree", "x": 0, "y": 1 },
    { "id": "item_2", "type": "house", "x": 5, "y": 5 },
    ...
  ]
}

Allowed Terrain: ${TERRAIN_TYPES.join(', ')}
Allowed Items: ${ITEM_TYPES.join(', ')}

Guidelines:
- Create natural-looking terrain patterns (forest clearings, lakes, beaches)
- Place 5-15 items depending on theme density
- Don't place items on water tiles
- Make it visually interesting and coherent with the theme
- Generate unique IDs for each item (like "item_1", "item_2", etc.)
`;

export interface GeneratedWorld {
  terrain: string[][];
  items: Array<{ id: string; type: string; x: number; y: number }>;
}

/**
 * Generate a world layout using AI based on a theme prompt
 */
export async function generateWorldLayout(theme: string): Promise<GeneratedWorld | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: WORLD_GENERATOR_PROMPT },
        { role: 'user', content: `Theme: ${theme}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8, // Higher for more creative variety
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error('No content generated from AI');
      return null;
    }

    const parsed = JSON.parse(content) as GeneratedWorld;

    // Validate the structure
    if (!Array.isArray(parsed.terrain) || !Array.isArray(parsed.items)) {
      console.error('Invalid world structure returned');
      return null;
    }

    // Validate terrain dimensions
    if (parsed.terrain.length !== DEFAULT_WORLD_SIZE) {
      console.error('Invalid terrain height');
      return null;
    }

    for (const row of parsed.terrain) {
      if (!Array.isArray(row) || row.length !== DEFAULT_WORLD_SIZE) {
        console.error('Invalid terrain row');
        return null;
      }
      // Validate terrain types
      for (const cell of row) {
        if (!TERRAIN_TYPES.includes(cell as typeof TERRAIN_TYPES[number])) {
          console.error(`Invalid terrain type: ${cell}`);
          return null;
        }
      }
    }

    // Validate items
    for (const item of parsed.items) {
      if (!ITEM_TYPES.includes(item.type as typeof ITEM_TYPES[number])) {
        console.error(`Invalid item type: ${item.type}`);
        return null;
      }
      if (item.x < 0 || item.x >= DEFAULT_WORLD_SIZE || item.y < 0 || item.y >= DEFAULT_WORLD_SIZE) {
        console.error(`Item out of bounds: ${item.id} at (${item.x}, ${item.y})`);
        return null;
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error generating world:', error);
    return null;
  }
}

/**
 * Apply generated layout to an existing world map
 */
export function applyGeneratedLayout(
  existingMap: WorldMap,
  generated: GeneratedWorld
): WorldMap {
  return {
    ...existingMap,
    terrain: generated.terrain,
    items: generated.items.map(item => ({
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
    })),
    updated_at: new Date().toISOString(),
  };
}
