'use client';



export const TAGS = [
  'Math', 'Science', 'Reading', 'Writing', 'History', 
  'Geography', 'Art', 'Logic', 'Coding', 'Life Skills'
];

export const MOCK_LESSONS = [
  { 
    id: 'l1', 
    title: 'Fractions: Parts of a Whole', 
    type: 'Math', 
    gradeBand: ['3-5'],
    keyQuestions: ['What is the numerator?', 'What is the denominator?'],
    estimatedMinutes: 20
  },
  { 
    id: 'l2', 
    title: 'The Water Cycle', 
    type: 'Science', 
    gradeBand: ['3-5', '6-8'],
    keyQuestions: ['Where does rain come from?', 'What is evaporation?'],
    estimatedMinutes: 30
  },
  { 
    id: 'l3', 
    title: 'Topic Sentences', 
    type: 'Writing', 
    gradeBand: ['6-8'],
    keyQuestions: ['What makes a strong opening?', 'How do we hook the reader?'],
    estimatedMinutes: 15
  },
];

export const MOCK_ASSIGNMENTS = [
  { 
    id: 'a1', 
    title: 'Fraction Pizza Worksheet', 
    type: 'Practice', 
    deliverable: 'Completed Worksheet',
    estimatedMinutes: 15
  },
  { 
    id: 'a2', 
    title: 'Water Cycle Diagram', 
    type: 'Project', 
    deliverable: 'Labeled Drawing',
    estimatedMinutes: 45
  },
  { 
    id: 'a3', 
    title: 'Daily Journal: Nature Walk', 
    type: 'Journal', 
    deliverable: '1 Page Entry',
    estimatedMinutes: 20
  }
];

// Mock Schedule for the "Day Playlist" view
export const MOCK_SCHEDULE = [
  // Monday
  {
    id: 's1',
    date: '2025-12-15',
    type: 'lesson',
    itemId: 'l1',
    studentIds: ['1', '2'],
    completed: false,
    order: 1
  },
  {
    id: 's2',
    date: '2025-12-15',
    type: 'assignment',
    itemId: 'a1',
    studentIds: ['1', '2'],
    completed: false,
    order: 2
  },
  // Tuesday
  {
    id: 's3',
    date: '2025-12-16',
    type: 'lesson',
    itemId: 'l2',
    studentIds: ['1', '2'],
    completed: false,
    order: 1
  },
  {
    id: 's4',
    date: '2025-12-16',
    type: 'assignment',
    itemId: 'a2',
    studentIds: ['1', '2'],
    completed: false,
    order: 2
  }
];
