/**
 * Journal Auto-Tagging
 * 
 * Uses AI to detect themes in journal entries.
 */

import { getOpenAIClient, AI_MODELS } from '@/lib/ai/config';

// Available tags for journal entries
export const JOURNAL_TAGS = [
  'family',
  'friends', 
  'school',
  'nature',
  'creativity',
  'adventure',
  'feelings',
  'dreams',
  'learning',
  'gratitude',
  'challenges',
  'growth',
] as const;

export type JournalTag = typeof JOURNAL_TAGS[number];

const TAG_DETECTION_PROMPT = `You are a simple tag detector for kids' journal entries.

Given a journal entry, identify 1-3 relevant themes from this list ONLY:
${JOURNAL_TAGS.join(', ')}

Rules:
- Return ONLY a JSON array of matching tags
- Maximum 3 tags
- If no tags match, return empty array
- Be conservative - only tag if clearly relevant

Example response: ["family", "gratitude"]`;

/**
 * Detect tags from a journal entry response
 */
export async function detectJournalTags(response: string): Promise<JournalTag[]> {
  if (!response || response.length < 10) {
    return [];
  }

  try {
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: AI_MODELS.default,
      temperature: 0.1, // Low for consistent results
      max_tokens: 50,
      messages: [
        { role: 'system', content: TAG_DETECTION_PROMPT },
        { role: 'user', content: response },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    
    if (!content) return [];

    // Parse JSON array
    const parsed = JSON.parse(content);
    
    if (!Array.isArray(parsed)) return [];
    
    // Filter to only valid tags
    return parsed.filter((tag: string) => 
      JOURNAL_TAGS.includes(tag as JournalTag)
    ).slice(0, 3) as JournalTag[];

  } catch (error) {
    console.error('[Journal Tags] Detection failed:', error);
    return [];
  }
}
