import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, AI_MODELS } from '@/lib/ai/config';
import { 
  getJournalSystemPrompt, 
  getJournalUserPrompt, 
  calculateAge, 
  getRandomFallbackPrompt,
  JournalPromptType,
  ALL_PROMPT_TYPES
} from '@/lib/ai/journal-prompt';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/journal/generate
 * 
 * Generates an age-appropriate journal prompt for a kid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kidId, skipPrompts = [] } = body as { 
      kidId: string; 
      skipPrompts?: string[];
    };

    if (!kidId) {
      return NextResponse.json(
        { error: 'kidId is required' },
        { status: 400 }
      );
    }

    // Get kid data for age and prompt preferences
    const supabase = await createServerClient();
    const { data: kid, error } = await supabase
      .from('kids')
      .select('birthday, grade_band, journal_prompt_types')
      .eq('id', kidId)
      .single();

    if (error || !kid) {
      return NextResponse.json(
        { error: 'Kid not found' },
        { status: 404 }
      );
    }

    // Calculate age from birthday or estimate from grade band
    let age = calculateAge(kid.birthday);
    if (!kid.birthday && kid.grade_band) {
      // Estimate age from grade band (e.g., "3-5" = roughly 8-10)
      const gradeMatch = kid.grade_band.match(/(\d+)/);
      if (gradeMatch) {
        age = parseInt(gradeMatch[1]) + 5; // Grade + 5 ≈ age
      }
    }

    // Get enabled prompt types
    const enabledTypes: JournalPromptType[] = kid.journal_prompt_types?.length 
      ? kid.journal_prompt_types.filter((t: string) => ALL_PROMPT_TYPES.includes(t as JournalPromptType)) as JournalPromptType[]
      : ALL_PROMPT_TYPES;

    // Try AI generation first
    try {
      const openai = getOpenAIClient();
      
      const completion = await openai.chat.completions.create({
        model: AI_MODELS.default,
        temperature: 0.9, // Higher for creativity
        max_tokens: 100,
        messages: [
          { role: 'system', content: getJournalSystemPrompt(age, enabledTypes) },
          { role: 'user', content: getJournalUserPrompt(enabledTypes, skipPrompts) },
        ],
      });

      const prompt = completion.choices[0]?.message?.content?.trim();
      
      if (prompt) {
        return NextResponse.json({ prompt, source: 'ai' });
      }
    } catch (aiError) {
      console.error('[Journal] AI generation failed, using fallback:', aiError);
    }

    // Fallback to pre-defined prompts
    const fallbackPrompt = getRandomFallbackPrompt(enabledTypes);
    return NextResponse.json({ prompt: fallbackPrompt, source: 'fallback' });

  } catch (error) {
    console.error('Journal generate endpoint error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
