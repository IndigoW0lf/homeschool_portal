/**
 * Journal Prompt Generator
 * 
 * Generates age-appropriate journal prompts for kids based on their age and preferences.
 * Avoids repeating recent prompts.
 */

export type JournalPromptType = 
  | 'feelings'
  | 'gratitude' 
  | 'imagination'
  | 'opinions'
  | 'memories'
  | 'goals';

export const PROMPT_TYPE_LABELS: Record<JournalPromptType, string> = {
  feelings: 'Feelings',
  gratitude: 'Gratitude',
  imagination: 'Imagination',
  opinions: 'Opinions',
  memories: 'Memories',
  goals: 'Goals',
};

export const ALL_PROMPT_TYPES: JournalPromptType[] = [
  'feelings',
  'gratitude',
  'imagination',
  'opinions',
  'memories',
  'goals',
];

/**
 * System prompt for generating journal questions
 */
export function getJournalSystemPrompt(age: number, enabledTypes: JournalPromptType[]): string {
  const typesDescription = enabledTypes.map(t => PROMPT_TYPE_LABELS[t]).join(', ');
  
  return `You generate journal prompts for a ${age}-year-old child.

## Guidelines
- Use simple, age-appropriate language
- Keep questions open-ended (no yes/no questions)  
- Questions should be answerable in 2-3 sentences
- Be warm and encouraging, not formal
- Focus on: ${typesDescription}

## Age-Specific Guidance
${age <= 6 ? `
- Very simple vocabulary
- Concrete questions about their day
- Use "you" directly
- Examples: "What made you smile today?" / "What's your favorite thing to do outside?"
` : age <= 9 ? `
- Simple but slightly more reflective questions
- Can ask about feelings and preferences
- Examples: "What's something you learned today?" / "If you could have any superpower, what would it be?"
` : age <= 12 ? `
- More reflective and imaginative questions
- Can explore opinions and goals
- Examples: "What's something you'd like to get better at?" / "If you could change one rule, which would it be?"
` : `
- Thoughtful, introspective questions
- Can explore values and future thinking
- Examples: "What's a challenge you're proud of overcoming?" / "What does being a good friend mean to you?"
`}

## Response Format
Return ONLY the journal prompt question as plain text. No quotes, no explanation, just the question.`;
}

/**
 * Generate the user prompt for AI
 */
export function getJournalUserPrompt(
  enabledTypes: JournalPromptType[],
  recentPrompts: string[] = []
): string {
  const typesString = enabledTypes.join(', ');
  
  let prompt = `Generate a single journal prompt from one of these categories: ${typesString}`;
  
  if (recentPrompts.length > 0) {
    prompt += `\n\nAvoid these recent prompts:\n${recentPrompts.map(p => `- ${p}`).join('\n')}`;
  }
  
  return prompt;
}

/**
 * Calculate age from birthday string
 */
export function calculateAge(birthday: string | undefined): number {
  if (!birthday) return 8; // Default age
  
  try {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(4, Math.min(18, age)); // Clamp between 4-18
  } catch {
    return 8;
  }
}

/**
 * Fallback prompts if AI is unavailable
 * Expanded to 8+ options per category for variety
 */
export const FALLBACK_PROMPTS: Record<JournalPromptType, string[]> = {
  feelings: [
    "How are you feeling today?",
    "What made you happy this week?",
    "What's something that made you feel proud lately?",
    "What was the best part of your day?",
    "How do you feel when you accomplish something difficult?",
    "What's something that makes you feel calm and relaxed?",
    "What's something that surprised you recently?",
    "When do you feel the most excited?",
  ],
  gratitude: [
    "What are three things you're thankful for today?",
    "Who is someone you're grateful to have in your life?",
    "What's something nice that happened recently?",
    "What's a gift or item you're really thankful to have?",
    "What's something about nature that makes you grateful?",
    "What's something your family does that you appreciate?",
    "What's a simple pleasure that makes you happy?",
    "What's something you often take for granted that you're glad exists?",
  ],
  imagination: [
    "If you could have any animal as a pet, what would it be and why?",
    "What would you do if you were invisible for a day?",
    "If you could visit any place in the world, where would you go?",
    "If you could have any superpower, what would it be?",
    "What would you invent to help people?",
    "If you could talk to any animal, which would you choose?",
    "What would your dream treehouse look like?",
    "If you could create a new holiday, what would it celebrate?",
    "What would you do if you found a magic lamp with three wishes?",
    "If you could be any character from a book or movie, who would it be?",
  ],
  opinions: [
    "What's the best book you've ever read?",
    "If you could make one rule for everyone to follow, what would it be?",
    "What's your favorite thing to learn about?",
    "What's a game you really enjoy and why?",
    "What do you think makes a good friend?",
    "What's your favorite season and why?",
    "What's the most interesting thing you've learned recently?",
    "What's your opinion on homework - is it helpful or not?",
    "What makes a really good movie or TV show?",
  ],
  memories: [
    "What's your favorite memory from this year?",
    "Tell me about a fun day you had with your family.",
    "What's something new you learned this week?",
    "What's a time you helped someone and how did it make you feel?",
    "What's your favorite birthday memory?",
    "Tell me about a time you overcame something hard.",
    "What's a funny moment you remember?",
    "What's a special trip or adventure you've been on?",
    "What's a moment when you felt really brave?",
  ],
  goals: [
    "What's something you'd like to get better at?",
    "What do you want to learn more about?",
    "What's a goal you have for this month?",
    "What's something you want to try that you've never done before?",
    "What kind of person do you want to be when you grow up?",
    "What's a skill you'd love to master?",
    "What's something you'd like to create or build?",
    "What's a challenge you want to take on?",
    "What's something nice you want to do for someone else?",
  ],
};

/**
 * Get a random fallback prompt, optionally avoiding recent ones
 */
export function getRandomFallbackPrompt(
  enabledTypes: JournalPromptType[], 
  skipPrompts: string[] = []
): string {
  // Collect all available prompts from enabled types
  const allPrompts: string[] = [];
  for (const type of enabledTypes) {
    allPrompts.push(...FALLBACK_PROMPTS[type]);
  }
  
  // Filter out prompts that are in skip list (case-insensitive, partial match)
  const availablePrompts = allPrompts.filter(prompt => 
    !skipPrompts.some(skip => 
      prompt.toLowerCase().includes(skip.toLowerCase().substring(0, 30)) ||
      skip.toLowerCase().includes(prompt.toLowerCase().substring(0, 30))
    )
  );
  
  // If we've exhausted all options, just return a random one anyway
  const prompts = availablePrompts.length > 0 ? availablePrompts : allPrompts;
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

