/**
 * Quick Start Templates
 * 
 * Pre-built lesson starters that can be deployed with one click.
 * These help fight curriculum paralysis by removing decision fatigue.
 */

export interface QuickStartTemplate {
  id: string;
  title: string;
  emoji: string;
  description: string;
  duration: number; // minutes
  subject: string;
  type: 'lesson' | 'assignment';
  category: 'daily' | 'creative' | 'academic' | 'exploration' | 'movement';
  
  // Pre-filled form data
  lessonData?: {
    title: string;
    type: string;
    description: string;
    keyQuestions: string[];
    materials: string;
    tags: string[];
    estimatedMinutes: number;
    parentNotes: string;
  };
  
  assignmentData?: {
    title: string;
    type: string;
    deliverable: string;
    steps: string[];
    tags: string[];
    estimatedMinutes: number;
    parentNotes: string;
  };
}

export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  // =====================================
  // DAILY ROUTINES
  // =====================================
  {
    id: 'read-aloud',
    title: 'Read Aloud',
    emoji: '📖',
    description: 'Cozy reading time with discussion',
    duration: 20,
    subject: 'Reading',
    type: 'lesson',
    category: 'daily',
    lessonData: {
      title: 'Read Aloud Session',
      type: 'Language Arts',
      description: 'Read together and discuss what we learn.',
      keyQuestions: [
        'What do you think will happen next?',
        'How does this character feel? Why?',
        'What was your favorite part?',
      ],
      materials: 'A book of your choice',
      tags: ['reading', 'discussion', 'literacy'],
      estimatedMinutes: 20,
      parentNotes: 'Let them pick the book when possible. Ask open-ended questions.',
    },
  },
  {
    id: 'mental-math',
    title: 'Mental Math Warm-up',
    emoji: '🔢',
    description: 'Quick oral math problems',
    duration: 10,
    subject: 'Math',
    type: 'lesson',
    category: 'daily',
    lessonData: {
      title: 'Mental Math Practice',
      type: 'Math',
      description: 'Oral math problems to build number sense and quick recall.',
      keyQuestions: [
        'How did you figure that out?',
        'Is there another way to solve it?',
        'What patterns do you notice?',
      ],
      materials: 'None needed',
      tags: ['math', 'mental-math', 'warm-up'],
      estimatedMinutes: 10,
      parentNotes: 'Start easy, build up. Celebrate effort, not just correct answers.',
    },
  },
  {
    id: 'copywork',
    title: 'Copywork',
    emoji: '✍️',
    description: 'Handwriting practice with a quote',
    duration: 10,
    subject: 'Writing',
    type: 'assignment',
    category: 'daily',
    assignmentData: {
      title: 'Daily Copywork',
      type: 'Practice',
      deliverable: 'A neatly written sentence or paragraph',
      steps: [
        'Choose a quote, poem, or scripture',
        'Read it aloud together',
        'Copy it carefully in your best handwriting',
        'Circle one word you wrote especially well',
      ],
      tags: ['handwriting', 'writing', 'copywork'],
      estimatedMinutes: 10,
      parentNotes: 'Choose sentences at their writing level. Quality over quantity.',
    },
  },
  {
    id: 'journal-prompt',
    title: 'Journal Time',
    emoji: '💭',
    description: 'Reflection and free writing',
    duration: 15,
    subject: 'Writing',
    type: 'assignment',
    category: 'daily',
    assignmentData: {
      title: 'Journal Entry',
      type: 'Journal',
      deliverable: 'A journal entry (drawing or writing)',
      steps: [
        'Think about the prompt quietly',
        'Write or draw your response',
        'Share if you want to (optional)',
      ],
      tags: ['writing', 'reflection', 'journal'],
      estimatedMinutes: 15,
      parentNotes: 'Prompts: What made you happy today? What are you curious about? Draw your favorite memory.',
    },
  },

  // =====================================
  // CREATIVE & ARTS
  // =====================================
  {
    id: 'art-observation',
    title: 'Art Observation',
    emoji: '🎨',
    description: 'Look at art, discuss what you see',
    duration: 15,
    subject: 'Art',
    type: 'lesson',
    category: 'creative',
    lessonData: {
      title: 'Art Appreciation',
      type: 'Art',
      description: 'Observe a piece of art and discuss what you notice.',
      keyQuestions: [
        'What do you see in this artwork?',
        'How does it make you feel?',
        'What do you think the artist was trying to show?',
        'What would you title this piece?',
      ],
      materials: 'A piece of art (print, museum website, or art book)',
      tags: ['art', 'observation', 'discussion'],
      estimatedMinutes: 15,
      parentNotes: 'Try Artstor, Google Arts & Culture, or picture books. Let them notice details.',
    },
  },
  {
    id: 'free-create',
    title: 'Free Create',
    emoji: '🖌️',
    description: 'Unstructured art time',
    duration: 30,
    subject: 'Art',
    type: 'assignment',
    category: 'creative',
    assignmentData: {
      title: 'Free Art Session',
      type: 'Creative',
      deliverable: 'Any artwork of your choosing',
      steps: [
        'Choose your materials (paint, crayons, clay, etc.)',
        'Create whatever you want',
        'Tell someone about your creation',
      ],
      tags: ['art', 'creativity', 'free-choice'],
      estimatedMinutes: 30,
      parentNotes: 'Process over product. No right or wrong way to create.',
    },
  },
  {
    id: 'music-listen',
    title: 'Music Listening',
    emoji: '🎵',
    description: 'Listen to a piece of music together',
    duration: 15,
    subject: 'Music',
    type: 'lesson',
    category: 'creative',
    lessonData: {
      title: 'Music Appreciation',
      type: 'Music',
      description: 'Listen to a piece of music and discuss what you hear.',
      keyQuestions: [
        'What instruments do you hear?',
        'Is the music fast or slow? Loud or soft?',
        'What story does this music tell?',
        'How does it make you feel?',
      ],
      materials: 'Music streaming app or YouTube',
      tags: ['music', 'listening', 'appreciation'],
      estimatedMinutes: 15,
      parentNotes: 'Try: Peter and the Wolf, The Planets, jazz standards, or world music.',
    },
  },

  // =====================================
  // EXPLORATION & SCIENCE
  // =====================================
  {
    id: 'kitchen-science',
    title: 'Kitchen Science',
    emoji: '🧪',
    description: 'Simple science experiment',
    duration: 25,
    subject: 'Science',
    type: 'lesson',
    category: 'exploration',
    lessonData: {
      title: 'Kitchen Science Experiment',
      type: 'Science',
      description: 'Conduct a simple experiment using household materials.',
      keyQuestions: [
        'What do you predict will happen?',
        'What did you observe?',
        'Why do you think that happened?',
        'What would you do differently next time?',
      ],
      materials: 'Varies - common household items',
      tags: ['science', 'experiment', 'hands-on'],
      estimatedMinutes: 25,
      parentNotes: 'Ideas: Baking soda volcano, density tower, egg in vinegar, grow crystals.',
    },
  },
  {
    id: 'nature-walk',
    title: 'Nature Walk',
    emoji: '🌿',
    description: 'Observe nature outside',
    duration: 30,
    subject: 'Science',
    type: 'lesson',
    category: 'exploration',
    lessonData: {
      title: 'Nature Observation Walk',
      type: 'Science',
      description: 'Take a walk outside and observe the natural world.',
      keyQuestions: [
        'What plants and animals do you see?',
        'What sounds do you hear?',
        'What signs of the season do you notice?',
        'What questions do you have about what you see?',
      ],
      materials: 'Optional: magnifying glass, nature journal, camera',
      tags: ['nature', 'science', 'outdoor'],
      estimatedMinutes: 30,
      parentNotes: 'Go slow. Let curiosity lead. Bring a bag for collecting specimens.',
    },
  },
  {
    id: 'curiosity-dive',
    title: 'Curiosity Dive',
    emoji: '🔍',
    description: 'Research a question together',
    duration: 20,
    subject: 'Research',
    type: 'lesson',
    category: 'exploration',
    lessonData: {
      title: 'Curiosity Research',
      type: 'Science',
      description: 'Pick a question and find the answer together.',
      keyQuestions: [
        'What are you curious about?',
        'Where can we find the answer?',
        'What did we learn?',
        'What new questions do you have now?',
      ],
      materials: 'Books, encyclopedia, or safe internet access',
      tags: ['research', 'curiosity', 'questions'],
      estimatedMinutes: 20,
      parentNotes: 'Start with their questions! Wikipedia, DK books, or library visits work great.',
    },
  },

  // =====================================
  // MOVEMENT & LIFE SKILLS
  // =====================================
  {
    id: 'movement-break',
    title: 'Movement Break',
    emoji: '🏃',
    description: 'Get wiggles out!',
    duration: 15,
    subject: 'PE',
    type: 'lesson',
    category: 'movement',
    lessonData: {
      title: 'Movement Break',
      type: 'PE',
      description: 'Physical activity to energize and refocus.',
      keyQuestions: [
        'How does your body feel now?',
        'What movement was your favorite?',
      ],
      materials: 'None (optional: music, jump rope, ball)',
      tags: ['movement', 'PE', 'brain-break'],
      estimatedMinutes: 15,
      parentNotes: 'Ideas: Dance party, yoga, jumping jacks, obstacle course, GoNoodle videos.',
    },
  },
  {
    id: 'life-skill',
    title: 'Life Skill Practice',
    emoji: '🏠',
    description: 'Learn something practical',
    duration: 20,
    subject: 'Life Skills',
    type: 'lesson',
    category: 'movement',
    lessonData: {
      title: 'Life Skills Lesson',
      type: 'Life Skills',
      description: 'Practice a real-world skill together.',
      keyQuestions: [
        'Why is this skill important?',
        'What steps are involved?',
        'How did it go?',
      ],
      materials: 'Varies by skill',
      tags: ['life-skills', 'practical', 'independence'],
      estimatedMinutes: 20,
      parentNotes: 'Ideas: Cooking, laundry, budgeting, first aid, sewing, tool use, phone etiquette.',
    },
  },

  // =====================================
  // ACADEMIC FOCUSED
  // =====================================
  {
    id: 'math-games',
    title: 'Math Games',
    emoji: '🎲',
    description: 'Learn math through play',
    duration: 20,
    subject: 'Math',
    type: 'lesson',
    category: 'academic',
    lessonData: {
      title: 'Math Games Session',
      type: 'Math',
      description: 'Practice math concepts through fun games.',
      keyQuestions: [
        'What math did you use in this game?',
        'What strategy helped you?',
      ],
      materials: 'Dice, cards, board games, or apps',
      tags: ['math', 'games', 'fun'],
      estimatedMinutes: 20,
      parentNotes: 'Games: Yahtzee, War (cards), Monopoly, Math Dice, Prodigy.',
    },
  },
  {
    id: 'geography-explore',
    title: 'Map Exploration',
    emoji: '🗺️',
    description: 'Explore a place on the map',
    duration: 15,
    subject: 'Geography',
    type: 'lesson',
    category: 'academic',
    lessonData: {
      title: 'Geography Exploration',
      type: 'History',
      description: 'Explore a country or region using maps and research.',
      keyQuestions: [
        'Where is this place in the world?',
        'What is the weather like there?',
        'What do people eat there?',
        'Would you want to visit? Why?',
      ],
      materials: 'Globe, atlas, or Google Earth',
      tags: ['geography', 'maps', 'culture'],
      estimatedMinutes: 15,
      parentNotes: 'Pair with a book, recipe, or video about the place!',
    },
  },
  {
    id: 'history-story',
    title: 'History Story',
    emoji: '📜',
    description: 'Learn about historical events',
    duration: 20,
    subject: 'History',
    type: 'lesson',
    category: 'academic',
    lessonData: {
      title: 'History Story Time',
      type: 'History',
      description: 'Learn about a person, event, or time period through stories.',
      keyQuestions: [
        'When and where did this happen?',
        'Who were the important people?',
        'Why does this matter today?',
        'What would you have done?',
      ],
      materials: 'History book, biography, or documentary',
      tags: ['history', 'stories', 'social-studies'],
      estimatedMinutes: 20,
      parentNotes: 'Use picture books, chapter books, or short documentaries.',
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: QuickStartTemplate['category']): QuickStartTemplate[] {
  return QUICK_START_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates by subject
 */
export function getTemplatesBySubject(subject: string): QuickStartTemplate[] {
  return QUICK_START_TEMPLATES.filter(t => 
    t.subject.toLowerCase() === subject.toLowerCase()
  );
}

/**
 * Get a random template for when you can't decide!
 */
export function getRandomTemplate(): QuickStartTemplate {
  return QUICK_START_TEMPLATES[Math.floor(Math.random() * QUICK_START_TEMPLATES.length)];
}

/**
 * Suggested daily lineup for minimal decision-making
 */
export const DAILY_LINEUP_SUGGESTION = [
  'read-aloud',
  'mental-math', 
  'journal-prompt',
  'movement-break',
];
