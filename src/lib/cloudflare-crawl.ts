/**
 * Cloudflare Browser Rendering /crawl endpoint client.
 * Used to crawl a URL (e.g. MiAcademy report page) and return content as Markdown/HTML.
 * Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Browser Rendering - Edit).
 * @see https://developers.cloudflare.com/browser-rendering/rest-api/crawl-endpoint/
 */

const BASE = 'https://api.cloudflare.com/client/v4/accounts';

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error(
      'Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN. Add them in .env.local for crawl support.'
    );
  }
  return { accountId, apiToken };
}

export type CrawlJobStatus =
  | 'running'
  | 'completed'
  | 'errored'
  | 'cancelled_by_user'
  | 'cancelled_due_to_limits'
  | 'cancelled_due_to_timeout';

export interface CrawlRecord {
  url: string;
  status: string;
  markdown?: string;
  html?: string;
  metadata?: { status?: number; title?: string; url?: string };
}

export interface CrawlResult {
  id: string;
  status: CrawlJobStatus;
  browserSecondsUsed?: number;
  total?: number;
  finished?: number;
  records?: CrawlRecord[];
  cursor?: number;
}

export interface StartCrawlOptions {
  url: string;
  limit?: number;
  depth?: number;
  formats?: ('html' | 'markdown' | 'json')[];
  render?: boolean;
  source?: 'all' | 'sitemaps' | 'links';
  /** Optional Cookie header value for authenticated pages (e.g. copy from DevTools). Not stored. */
  cookieHeader?: string;
}

/**
 * Start a crawl job. Returns immediately with a job ID.
 * Pass cookieHeader to crawl behind login (e.g. MiAcademy parent portal).
 */
export async function startCrawl(options: StartCrawlOptions): Promise<string> {
  const { accountId, apiToken } = getConfig();
  const {
    url,
    limit = 50,
    depth = 3,
    formats = ['markdown'],
    render = false,
    source = 'all',
    cookieHeader,
  } = options;

  const body: Record<string, unknown> = {
    url,
    limit,
    depth,
    formats,
    render,
    source,
  };
  if (cookieHeader?.trim()) {
    body.setExtraHTTPHeaders = { Cookie: cookieHeader.trim() };
  }

  const res = await fetch(`${BASE}/${accountId}/browser-rendering/crawl`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { errors?: { message?: string }[] };
    const msg = err.errors?.[0]?.message ?? res.statusText;
    throw new Error(`Cloudflare crawl start failed: ${res.status} ${msg}`);
  }

  const data = (await res.json()) as { success?: boolean; result?: string };
  if (!data.success || !data.result) {
    throw new Error('Cloudflare crawl did not return a job ID');
  }
  return data.result;
}

/**
 * Get status and optionally results for a crawl job.
 * Use ?limit=1 for lightweight status-only polling.
 */
export async function getCrawlResult(
  jobId: string,
  query?: { limit?: number; cursor?: number; status?: string }
): Promise<CrawlResult> {
  const { accountId, apiToken } = getConfig();
  const params = new URLSearchParams();
  if (query?.limit != null) params.set('limit', String(query.limit));
  if (query?.cursor != null) params.set('cursor', String(query.cursor));
  if (query?.status) params.set('status', query.status);
  const qs = params.toString();
  const url = `${BASE}/${accountId}/browser-rendering/crawl/${jobId}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { errors?: { message?: string }[] };
    const msg = err.errors?.[0]?.message ?? res.statusText;
    throw new Error(`Cloudflare crawl get failed: ${res.status} ${msg}`);
  }

  const data = (await res.json()) as { success?: boolean; result?: CrawlResult };
  if (!data.success || !data.result) {
    throw new Error('Cloudflare crawl result missing');
  }
  return data.result;
}

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_MAX_ATTEMPTS = 60;

/**
 * Poll until the crawl job reaches a terminal status, then return the full result.
 * For status-only checks, use limit=1 to keep responses small until done.
 */
export async function waitForCrawl(
  jobId: string,
  opts?: { pollIntervalMs?: number; maxAttempts?: number }
): Promise<CrawlResult> {
  const pollIntervalMs = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxAttempts = opts?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await getCrawlResult(jobId, { limit: 1 });
    if (result.status !== 'running') {
      return getCrawlResult(jobId);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error('Crawl job did not complete within timeout');
}

/**
 * Check if crawl is configured (env vars set). Use to show/hide "Import from URL" in UI.
 */
export function isCrawlConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN
  );
}
