// Design Studio Types
// Types for the avatar design canvas where kids create custom clothing

// Design region within a template (a fillable/drawable area)
export interface DesignRegion {
  id: string;
  label: string;
  fillColor: string;        // Hex color
  strokes: StrokeData[];    // Freehand drawings on this region
}

// Stroke data for freehand drawing
export interface StrokeData {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  timestamp: number;
}

// Design template metadata (from design-templates.json)
export interface DesignTemplate {
  id: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories';
  label: string;
  src: string;                    // Path to blank SVG template
  parts?: {                       // Standard parts (legacy/wardrobe)
    name: string;
    label: string;
  }[];
  regions?: string[];             // Raw region IDs (new skin system)
  unlocked: boolean;              // Always unlocked (starter) or needs purchase
  unlockCost?: number;            // Moon cost if not unlocked
  unlockType?: 'shop' | 'reward' | 'holiday';
}

// Category of templates
export interface DesignCategory {
  id: string;
  label: string;
  icon?: string;
  templates: DesignTemplate[];
}

// Full template manifest structure
export interface DesignTemplatesManifest {
  categories: DesignCategory[];
}

// Complete design for a single item (saved to database)
export interface ItemDesign {
  id: string;
  templateId: string;
  kidId: string;
  name: string;                            // Kid's custom name for design
  regions: Record<string, DesignRegion>;   // Region state with fills/strokes
  isEquipped: boolean;                     // Currently worn on avatar
  textureUrl?: string;                     // URL to generated texture image
  createdAt: string;
  updatedAt: string;
}

// Database row for kid_designs table
export interface ItemDesignRow {
  id: string;
  kid_id: string;
  template_id: string;
  name: string;
  design_data: {
    regions: Record<string, DesignRegion>;
  };
  is_equipped: boolean;
  texture_url?: string;
  created_at: string;
  updated_at: string;
}

// Design studio session state (UI state, not persisted)
export interface DesignStudioState {
  selectedTemplate: DesignTemplate | null;
  activeRegion: string | null;
  currentColor: string;
  brushSize: number;
  tool: 'fill' | 'draw' | 'eraser';
  regions: Record<string, DesignRegion>;
  undoStack: DesignAction[];
  redoStack: DesignAction[];
  isDirty: boolean;  // Has unsaved changes
}

// Action for undo/redo
export type DesignAction = 
  | { type: 'fill'; regionId: string; previousColor: string; newColor: string }
  | { type: 'stroke'; regionId: string; stroke: StrokeData }
  | { type: 'eraseStroke'; regionId: string; stroke: StrokeData };

// Props for DesignCanvas component
export interface DesignCanvasProps {
  template: DesignTemplate;
  regions: Record<string, DesignRegion>;
  activeRegion: string | null;
  tool: 'fill' | 'draw' | 'eraser';
  currentColor: string;
  brushSize: number;
  onRegionClick: (regionId: string) => void;
  onStrokeComplete: (regionId: string, stroke: StrokeData) => void;
  onStrokeErase: (regionId: string, strokeId: string) => void;
}

// Default color palette for design studio
export const DESIGN_COLOR_PALETTE = [
  // Primary colors
  { value: '#E74C3C', label: 'Red' },
  { value: '#E67E22', label: 'Orange' },
  { value: '#F1C40F', label: 'Yellow' },
  { value: '#2ECC71', label: 'Green' },
  { value: '#3498DB', label: 'Blue' },
  { value: '#9B59B6', label: 'Purple' },
  { value: '#E91E8C', label: 'Pink' },
  // Neutrals
  { value: '#FFFFFF', label: 'White' },
  { value: '#95A5A6', label: 'Gray' },
  { value: '#34495E', label: 'Dark Gray' },
  { value: '#1A1A2E', label: 'Black' },
  { value: '#D4A574', label: 'Tan' },
];

// Brush size presets
export const BRUSH_SIZES = [
  { value: 3, label: 'Fine' },
  { value: 8, label: 'Medium' },
  { value: 16, label: 'Thick' },
];
