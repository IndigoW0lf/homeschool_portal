import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { startCrawl, getCrawlResult, isCrawlConfigured } from '@/lib/cloudflare-crawl';
import { parseMiAcademyReport } from '@/lib/miacademy-report';
import { importExternalCurriculum } from '@/app/actions/import';

/**
 * POST /api/miacademy/crawl
 * Start a crawl job for a given URL (e.g. MiAcademy report or dashboard page).
 * Body: { url: string, limit?: number }
 * Returns: { jobId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCrawlConfigured()) {
      return NextResponse.json(
        { error: 'Crawl not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to .env.local.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid url required' }, { status: 400 });
    }

    const limit = typeof body.limit === 'number' ? Math.min(Math.max(1, body.limit), 200) : 50;
    const cookieHeader = typeof body.cookieHeader === 'string' ? body.cookieHeader.trim() : undefined;

    const jobId = await startCrawl({
      url,
      limit,
      depth: 3,
      formats: ['markdown'],
      render: Boolean(cookieHeader), // SPA/report pages behind login often need JS
      source: 'all',
      ...(cookieHeader ? { cookieHeader } : {}),
    });

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error('[miacademy/crawl] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Crawl start failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/miacademy/crawl?jobId=xxx&kidId=yyy&import=1
 * - jobId: required, the crawl job ID from POST.
 * - kidId: optional; if provided with import=1, when job is completed we parse crawled markdown as MiAcademy report and import into external_curriculum.
 * - import: optional; set to 1 to run import when job completes (requires kidId).
 * Returns: { status, jobId, records?, imported?, errors? }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCrawlConfigured()) {
      return NextResponse.json(
        { error: 'Crawl not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const kidId = searchParams.get('kidId') ?? undefined;
    const doImport = searchParams.get('import') === '1';

    if (!jobId) {
      if (searchParams.get('config') === '1') {
        return NextResponse.json({ configured: isCrawlConfigured() });
      }
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const result = await getCrawlResult(jobId, { limit: 1 });
    const terminal = result.status !== 'running';

    if (!terminal) {
      return NextResponse.json({
        status: result.status,
        jobId,
        message: 'Crawl still in progress. Poll again in a few seconds.',
      });
    }

    // Job finished: optionally fetch full records and import
    const full = await getCrawlResult(jobId);
    const records = full.records ?? [];

    if (!doImport || !kidId || records.length === 0) {
      return NextResponse.json({
        status: full.status,
        jobId,
        total: full.total,
        finished: full.finished,
        recordCount: records.length,
        records: records.map((r) => ({
          url: r.url,
          status: r.status,
          hasMarkdown: Boolean(r.markdown),
        })),
      });
    }

    // Concatenate markdown from all completed records (same format as pasted report text)
    const combined = records
      .filter((r) => r.status === 'completed' && r.markdown)
      .map((r) => r.markdown!)
      .join('\n\n');

    if (!combined.trim()) {
      return NextResponse.json({
        status: full.status,
        jobId,
        imported: 0,
        errors: ['No crawl content to parse. The page may need JavaScript (try a direct report URL or paste report text instead).'],
      });
    }

    const rows = parseMiAcademyReport(combined);

    const importRows = rows.map((row) => ({
      taskName: row.taskName,
      course: row.course,
      date: row.date,
      score: row.score != null ? String(row.score) : null,
    }));

    const importResult = await importExternalCurriculum(kidId, 'miacademy', importRows);

    return NextResponse.json({
      status: full.status,
      jobId,
      imported: importResult.imported,
      errors: importResult.errors,
      recordCount: records.length,
      parsedCount: rows.length,
    });
  } catch (err) {
    console.error('[miacademy/crawl] GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Crawl fetch failed' },
      { status: 500 }
    );
  }
}
