import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getOpenAIClient, AI_MODELS } from '@/lib/ai/config';

interface ParsedCurriculumItem {
  taskName: string;
  course: string;
  subject: string;
  date: string;
  score: number | null;
  itemType: string;
}

interface ManuallyParsedRow {
  taskName: string;
  course: string;
  date: string;
  score: number | null;
}

// Simpler prompt since we're just asking AI to categorize pre-parsed data
const REVIEW_PROMPT = `You are categorizing pre-parsed educational curriculum items.

For each item in the input array, determine:
- subject: The subject area (Reading, Math, Science, Language Arts, History, Writing, Art, etc.)
- itemType: One of "assessment", "practice", "video", "supplemental", or "lesson"

Rules:
- Determine subject from the course name (e.g., "Reading Comprehension: Level E" → "Reading", "Math Foundations" → "Math")
- Determine itemType from the task name:
  * Quiz/Test/Assessment → "assessment"
  * Practice → "practice"
  * Video → "video"
  * Supplemental → "supplemental"
  * Otherwise → "lesson"

Input is a JSON array of items with taskName and course.
Output ONLY valid JSON: { "categories": [ { "subject": "...", "itemType": "..." }, ... ] }
The output array MUST have the same length as the input array, in the same order.`;

/**
 * Check if text looks like MiAcademy PDF report format
 * Example lines:
 * "1/22/2026 Subtract Decimals 1 | Practice: Levels 7 - 9"
 * "1/21/2026 Add Decimals 1 | Assessment: Quiz Assessment 100%"
 */
function isMiAcademyReportFormat(rawText: string): boolean {
  const lines = rawText.split('\n');
  // Check if we have lines starting with dates in MM/DD/YYYY format followed by text
  const reportLines = lines.filter(l => 
    /^\d{1,2}\/\d{1,2}\/\d{4}\s+\w+/.test(l.trim())
  );
  // If more than 3 lines match this pattern, it's likely PDF report format
  return reportLines.length > 3;
}

/**
 * Parse MiAcademy PDF report format (not CSV!)
 * Format: "DATE TOPIC_NAME | ACTIVITY_TYPE: DESCRIPTION SCORE%"
 */
function parseMiAcademyReport(rawText: string): ManuallyParsedRow[] {
  const lines = rawText.split('\n');
  const rows: ManuallyParsedRow[] = [];
  
  // Track current course (subject section from headers like "Math: Level E")
  let currentCourse = 'Unknown Course';
  
  // Patterns to identify course headers
  const courseHeaderPatterns = [
    /^Math:?\s*/i,
    /^Reading\s*Comprehension/i,
    /^Survivor'?s?\s*Quest/i,
    /^Science/i,
    /^Writing/i,
    /^History/i,
    /^U\.?S\.?\s*Government/i,
    /^Social\s*Studies/i,
    /^Language\s*Arts/i,
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check if this is a course header line
    for (const pattern of courseHeaderPatterns) {
      if (pattern.test(trimmed)) {
        // Extract course name (everything before Study Time or newline)
        currentCourse = trimmed.split(/Course Study Time|Overall Grade/i)[0].trim();
        break;
      }
    }
    
    // Try to parse data row: "DATE TASK_NAME | ACTIVITY: DESCRIPTION SCORE%"
    // Pattern: date at start, followed by task info
    const dateMatch = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const restOfLine = dateMatch[2];
      
      // Parse the rest: "Topic Name | Activity: Description Score%"
      const taskName = restOfLine.trim();
      
      // Extract score if present (e.g., "100%", "85%")
      const scoreMatch = taskName.match(/(\d+)%\s*$/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      
      // Parse date
      const date = parseDate(dateStr);
      if (date && taskName) {
        rows.push({
          taskName: taskName,
          course: currentCourse,
          date: date,
          score: score,
        });
      }
    }
  }
  
  return rows;
}

/**
 * Parse CSV manually - extract basic fields without AI
 */
function parseCSVManually(rawText: string): ManuallyParsedRow[] {
  // First check if this is MiAcademy PDF report format
  if (isMiAcademyReportFormat(rawText)) {
    console.log('Detected MiAcademy PDF report format, using specialized parser');
    return parseMiAcademyReport(rawText);
  }
  
  // Otherwise, use CSV parsing
  const lines = rawText.trim().split('\n');
  const rows: ManuallyParsedRow[] = [];

  // Patterns to skip
  const skipPatterns = [
    'grade report was printed',
    'curriculum provider',
    'not an official transcript',
    'disclaimer',
  ];

  // Find delimiter and header
  const firstDataLine = lines.find(l =>
    l.trim() && !skipPatterns.some(p => l.toLowerCase().includes(p))
  );
  const delimiter = firstDataLine?.includes('\t') ? '\t' : ',';

  // Check if first line is header
  const firstLine = lines[0]?.toLowerCase() || '';
  const startIdx = (firstLine.includes('task') || firstLine.includes('name') || firstLine.includes('course')) ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (skipPatterns.some(p => line.toLowerCase().includes(p))) continue;

    // Parse CSV/TSV row, handling quoted fields
    const parts = parseCSVLine(line, delimiter);

    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      const date = parseDate(parts[2]);
      if (date) {
        rows.push({
          taskName: parts[0],
          course: parts[1],
          date: date,
          score: parseScore(parts[3] || null),
        });
      }
    }
  }

  return rows;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      parts.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim().replace(/^"|"$/g, ''));

  return parts;
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr: string): string | null {
  const cleaned = dateStr.trim().replace(/^"|"$/g, '');

  // Try MM/DD/YYYY
  const slashParts = cleaned.split('/');
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts;
    const m = month.padStart(2, '0');
    const d = day.padStart(2, '0');
    const y = year.length === 2 ? '20' + year : year;
    if (/^\d{4}-\d{2}-\d{2}$/.test(`${y}-${m}-${d}`)) {
      return `${y}-${m}-${d}`;
    }
  }

  // Try YYYY-MM-DD (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Try ISO date
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Parse score string to number
 */
function parseScore(scoreStr: string | null): number | null {
  if (!scoreStr || scoreStr.trim() === '' || scoreStr === '-') return null;
  const cleaned = scoreStr.replace('%', '').trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * Use AI to categorize items (single API call for all items)
 */
async function categorizeWithAI(
  rows: ManuallyParsedRow[],
): Promise<{ subject: string; itemType: string }[]> {
  const openai = getOpenAIClient();

  // Create compact input for AI - just task names and courses
  const input = rows.map(r => ({ taskName: r.taskName, course: r.course }));

  const completion = await openai.chat.completions.create({
    model: AI_MODELS.default,
    messages: [
      { role: 'system', content: REVIEW_PROMPT },
      { role: 'user', content: JSON.stringify(input) }
    ],
    temperature: 0.1,
    max_tokens: Math.min(rows.length * 50 + 500, 8000), // ~50 tokens per item
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  const parsed = JSON.parse(content) as { categories: { subject: string; itemType: string }[] };

  // Validate length matches
  if (parsed.categories.length !== rows.length) {
    console.warn(`AI returned ${parsed.categories.length} categories for ${rows.length} items`);
  }

  return parsed.categories;
}

/**
 * Fallback categorization without AI
 */
function categorizeLocally(rows: ManuallyParsedRow[]): { subject: string; itemType: string }[] {
  // Ordered by specificity - more specific patterns first
  const courseToSubject: [string, string][] = [
    // Social-Emotional Learning / Life Skills
    ['beliefs', 'Social-Emotional'],
    ['self-management', 'Social-Emotional'],
    ['self management', 'Social-Emotional'],
    ['emotions', 'Social-Emotional'],
    ['growth mindset', 'Social-Emotional'],
    ['thinking traps', 'Social-Emotional'],
    ['self-awareness', 'Social-Emotional'],
    ['decision making', 'Social-Emotional'],
    ['social awareness', 'Social-Emotional'],
    ['relationship', 'Social-Emotional'],

    // Core subjects
    ['reading comprehension', 'Reading'],
    ['reading', 'Reading'],
    ['survivor', 'Reading'], // Survivor's Quest is reading
    ['math', 'Math'],
    ['logic', 'Logic'],
    ['critical thinking', 'Logic'],
    ['science', 'Science'],
    ['biology', 'Science'],
    ['chemistry', 'Science'],
    ['physics', 'Science'],
    ['writing', 'Writing'],
    ['essay', 'Writing'],
    ['grammar', 'Writing'],
    ['spelling', 'Writing'],
    ['vocabulary', 'Language Arts'],
    ['history', 'History'],
    ['geography', 'History'],
    ['civics', 'History'],
    ['social studies', 'Social Studies'],
    ['art', 'Art'],
    ['music', 'Music'],
    ['language arts', 'Language Arts'],
    ['language', 'Language Arts'],
    ['typing', 'Technology'],
    ['coding', 'Technology'],
    ['computer', 'Technology'],
  ];

  return rows.map(row => {
    const lowerCourse = row.course.toLowerCase();
    const lowerTask = row.taskName.toLowerCase();
    const combined = lowerCourse + ' ' + lowerTask;

    // Determine subject - check combined text
    let subject = 'Other';
    for (const [pattern, subj] of courseToSubject) {
      if (combined.includes(pattern)) {
        subject = subj;
        break;
      }
    }

    // Determine item type
    let itemType = 'lesson';
    if (lowerTask.includes('assessment') || lowerTask.includes('quiz') || lowerTask.includes('test')) {
      itemType = 'assessment';
    } else if (lowerTask.includes('practice')) {
      itemType = 'practice';
    } else if (lowerTask.includes('video')) {
      itemType = 'video';
    } else if (lowerTask.includes('supplemental')) {
      itemType = 'supplemental';
    }

    return { subject, itemType };
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawText, source = 'unknown' } = await request.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'Missing rawText' }, { status: 400 });
    }

    // Step 1: Manual CSV parsing (fast, no AI)
    console.log('Step 1: Manual CSV parsing...');
    const manuallyParsed = parseCSVManually(rawText);
    console.log(`Parsed ${manuallyParsed.length} rows manually`);

    if (manuallyParsed.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in file' }, { status: 400 });
    }

    // Step 2: AI categorization (single call)
    let categories: { subject: string; itemType: string }[];
    const warnings: string[] = [];

    try {
      console.log('Step 2: AI categorization (single call)...');
      categories = await categorizeWithAI(manuallyParsed);
    } catch (err) {
      console.error('AI categorization failed, using local fallback:', err);
      warnings.push('AI categorization unavailable, used local rules');
      categories = categorizeLocally(manuallyParsed);
    }

    // Step 3: Combine manual parsing + AI categories
    const items: ParsedCurriculumItem[] = manuallyParsed.map((row, i) => ({
      taskName: row.taskName,
      course: row.course,
      date: row.date,
      score: row.score,
      subject: categories[i]?.subject || 'Other',
      itemType: categories[i]?.itemType || 'lesson',
    }));

    // Validate dates
    const validItems = items.filter(item =>
      item.taskName && item.course && item.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    );

    return NextResponse.json({
      success: true,
      items: validItems,
      warnings,
      totalParsed: items.length,
      validCount: validItems.length,
      skipped: items.length - validItems.length,
      chunksProcessed: 1, // Always 1 now!
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
