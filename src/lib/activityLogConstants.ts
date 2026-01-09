// Activity Log constants - safe for client components
// These are separated from the data functions to avoid importing server-only code

export const SUBJECTS = [
  'Math',
  'Reading',
  'Writing',
  'Language Arts',
  'Science',
  'Social Studies',
  'History',
  'Art',
  'Music',
  'PE',
  'Life Skills',
  'Foreign Language',
  'Technology',
  'Field Trip',
  'Other'
] as const;

export type Subject = typeof SUBJECTS[number];
