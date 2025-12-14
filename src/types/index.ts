// Type definitions for the Homeschool Portal
// These types match the JSON schema in /content/*.json files

export interface Kid {
  id: string;
  name: string;
  gradeBand: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface ResourceLink {
  label: string;
  url: string;
  pinnedToday?: boolean;
}

export interface Resources {
  reading: ResourceLink[];
  logic: ResourceLink[];
  writing: ResourceLink[];
  projects: ResourceLink[];
}

export type ResourceCategory = keyof Resources;

export interface LessonLink {
  label: string;
  url: string;
}

export interface LessonAttachment {
  label: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  type?: string; 
  instructions: string;
  tags: string[];
  estimatedMinutes: number;
  links: LessonLink[];
  attachments: LessonAttachment[];
}

export interface CalendarEntry {
  date: string;
  theme: string;
  kidIds: string[];
  lessonIds: string[];
  journalPrompt: string;
  projectPrompt: string | null;
  parentNotes: string;
}

// Done state for localStorage persistence
export interface DoneState {
  [key: string]: boolean | number; // key format: `homeschool_done::${kidId}::${date}::${lessonId}`
}

// Avatar types
export interface AvatarAsset {
  id: string;
  label: string;
  src: string;
  category: 'base' | 'outfit' | 'accessory';
  colorableParts?: string[];
}

export interface AvatarAssets {
  bases: AvatarAsset[];
  outfits: AvatarAsset[];
  accessories: AvatarAsset[];
}

export interface AvatarColors {
  [key: string]: string; // e.g., { "shirt": "--fabric-blue", "pants": "--fabric-green" }
}

export interface AvatarState {
  base: string;
  outfit: string;
  accessory?: string;
  colors: AvatarColors;
}

// Studio types
export interface StudioTemplatePart {
  name: string;
  label: string;
}

export interface StudioTemplate {
  id: string;
  label: string;
  src: string;
  parts: StudioTemplatePart[];
}

export interface StudioState {
  selectedTemplate: string;
  colors: {
    [partName: string]: string; // e.g., { "primary": "--fabric-blue", "secondary": "--fabric-gold" }
  };
}

export interface StudioTemplates {
  templates: StudioTemplate[];
}

// Shop types
export interface ShopItem {
  id: string;
  name: string;
  type: 'badge' | 'avatar' | 'home';
  cost: number;
  description: string;
  unlocks: string[];
}

export interface ShopItems {
  items: ShopItem[];
}

// Supabase database types
export interface KidRow {
  id: string;
  name: string;
  grade_band: string | null;
}

export interface LessonRow {
  id: string;
  title: string;
  type: string | null;
  instructions: string | null;
  tags: string[];
  estimated_minutes: number;
  created_at: string;
  parent_notes?: string | null;
}

export interface AssignmentItemRow {
  id: string;
  title: string;
  type: string | null;
  deliverable: string | null;
  rubric: Record<string, unknown>[] | null; // jsonb
  steps: Record<string, unknown>[] | null; // jsonb
  parent_notes: string | null;
  estimated_minutes: number;
  tags: string[];
  links: Record<string, unknown>[] | null; // jsonb
  is_template: boolean;
  created_at: string;
}

export interface DayPlanRow {
  id: string;
  date: string;
  theme: string | null;
  journal_prompt: string | null;
  project_prompt: string | null;
  parent_notes: string | null;
}

export interface ScheduleItemRow {
  id: string;
  date: string;
  student_id: string;
  item_type: 'lesson' | 'assignment' | 'resource' | 'custom';
  item_id: string | null;
  title_override: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
  sort_order: number;
  lesson_id: string | null;
  assignment_id: string | null;
  resource_id: string | null;
}

export interface ResourceRow {
  id: string;
  category: string;
  label: string;
  url: string;
  sort_order: number;
  pinned_today: boolean;
  // New fields
  type: string; 
  description: string | null;
  tags: string[];
  is_pinned: boolean;
  show_on_today: boolean;
  frequency: string | null; 
  access_instructions: string | null;
  duration: number | null;
  purpose_prompt: string | null;
  author: string | null;
  reading_level: string | null;
  platform: string | null;
  requires_account: boolean;
}
