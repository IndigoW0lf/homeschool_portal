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
