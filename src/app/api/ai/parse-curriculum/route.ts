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

interface ParsedChunkResult {
  items: ParsedCurriculumItem[];
  parseWarnings: string[];
}

const SYSTEM_PROMPT = `You are an expert at parsing educational curriculum data. 
Your job is to take raw text from curriculum export reports (CSV, TSV, or pasted text) and extract structured data.

For each item, extract:
- taskName: The name of the task/lesson/assignment
- course: The course or curriculum name
- subject: The subject area (Reading, Math, Science, Language Arts, History, Writing, Art, etc.)
- date: The date in YYYY-MM-DD format
- score: The score as a number (0-100), or null if not graded
- itemType: One of "assessment", "practice", "video", "supplemental", or "lesson"

Rules:
1. Parse ALL rows, don't skip any
2. Handle various date formats (MM/DD/YYYY, YYYY-MM-DD, etc.) and convert to YYYY-MM-DD
3. Extract percentages as numbers (83% → 83)
4. Determine subject from the course name (e.g., "Reading Comprehension: Level E" → "Reading")
5. Determine itemType from the task name (Quiz/Assessment → "assessment", Practice → "practice", Video → "video", Supplemental → "supplemental", otherwise → "lesson")
6. Handle embedded quotes and special characters in task names
7. Skip header rows and disclaimer text (like "This grade report was printed...")

Respond ONLY with valid JSON in this exact format:
{
  "items": [
    {
      "taskName": "Example Task",
      "course": "Example Course",
      "subject": "Reading",
      "date": "2025-10-27",
      "score": 83,
      "itemType": "assessment"
    }
  ],
  "parseWarnings": ["any warnings about ambiguous or unparseable data"]
}`;

// Configuration for chunking
const ROWS_PER_CHUNK = 100; // Process 100 rows at a time
const MAX_CONCURRENT_CHUNKS = 3; // Limit concurrent API calls

/**
 * Split CSV text into chunks, preserving the header for each chunk
 */
function splitIntoChunks(rawText: string): string[] {
  const lines = rawText.split('\n');

  // Find the header line (first non-empty line that looks like a header)
  let headerLine = '';
  let dataStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('This grade report') && !line.startsWith('Disclaimer')) {
      headerLine = lines[i];
      dataStartIndex = i + 1;
      break;
    }
  }

  // Get all data lines (non-empty lines after header)
  const dataLines = lines.slice(dataStartIndex).filter(line => line.trim());

  // If small enough, return as single chunk
  if (dataLines.length <= ROWS_PER_CHUNK) {
    return [rawText];
  }

  // Split into chunks
  const chunks: string[] = [];
  for (let i = 0; i < dataLines.length; i += ROWS_PER_CHUNK) {
    const chunkLines = dataLines.slice(i, i + ROWS_PER_CHUNK);
    // Prepend header to each chunk so AI knows the column structure
    chunks.push(headerLine + '\n' + chunkLines.join('\n'));
  }

  return chunks;
}

/**
 * Parse a single chunk of curriculum data
 */
async function parseChunk(
  openai: ReturnType<typeof getOpenAIClient>,
  chunkText: string,
  source: string,
  chunkIndex: number
): Promise<ParsedChunkResult> {
  const completion = await openai.chat.completions.create({
    model: AI_MODELS.default,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Parse this curriculum data from ${source} (chunk ${chunkIndex + 1}):\n\n${chunkText}`
      }
    ],
    temperature: 0.1,
    max_tokens: 8000, // Smaller per-chunk limit
    response_format: { type: 'json_object' },
  });

  const choice = completion.choices[0];
  const content = choice?.message?.content;

  if (!content) {
    throw new Error(`Chunk ${chunkIndex + 1}: No response from AI`);
  }

  if (choice.finish_reason === 'length') {
    throw new Error(`Chunk ${chunkIndex + 1}: Response truncated`);
  }

  try {
    return JSON.parse(content) as ParsedChunkResult;
  } catch {
    console.error(`Chunk ${chunkIndex + 1} parse error. Content:`, content.substring(0, 500));
    throw new Error(`Chunk ${chunkIndex + 1}: Invalid JSON response`);
  }
}

/**
 * Process chunks with limited concurrency
 */
async function processChunksWithConcurrency(
  openai: ReturnType<typeof getOpenAIClient>,
  chunks: string[],
  source: string
): Promise<ParsedChunkResult[]> {
  const results: ParsedChunkResult[] = [];

  // Process in batches of MAX_CONCURRENT_CHUNKS
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batch = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
    const batchPromises = batch.map((chunk, idx) =>
      parseChunk(openai, chunk, source, i + idx)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
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

    const openai = getOpenAIClient();

    // Split into chunks
    const chunks = splitIntoChunks(rawText);
    console.log(`Processing ${chunks.length} chunk(s) for curriculum parsing`);

    // Parse all chunks
    const chunkResults = await processChunksWithConcurrency(openai, chunks, source);

    // Combine results from all chunks
    const allItems: ParsedCurriculumItem[] = [];
    const allWarnings: string[] = [];

    for (const result of chunkResults) {
      allItems.push(...(result.items || []));
      allWarnings.push(...(result.parseWarnings || []));
    }

    // Validate and clean up the parsed data
    const validItems = allItems.filter(item => {
      return item.taskName && item.course && item.date &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date);
    });

    // Deduplicate warnings
    const uniqueWarnings = [...new Set(allWarnings)];

    return NextResponse.json({
      success: true,
      items: validItems,
      warnings: uniqueWarnings,
      totalParsed: allItems.length,
      validCount: validItems.length,
      skipped: allItems.length - validItems.length,
      chunksProcessed: chunks.length,
    });

  } catch (error) {
    console.error('AI parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
