import { AI_CONFIG } from './config';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until reset
}

// ---------------------------------------------------------------------------
// Upstash-backed rate limiter (production)
// Falls back to in-memory when UPSTASH_REDIS_REST_URL is not configured.
// ---------------------------------------------------------------------------

let upstashLimiter: import('@upstash/ratelimit').Ratelimit | null = null;
let upstashDailyLimiter: import('@upstash/ratelimit').Ratelimit | null = null;

function getUpstashLimiter(): import('@upstash/ratelimit').Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!upstashLimiter) {
    // Lazy import to avoid crashing when env vars are absent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require('@upstash/ratelimit');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    upstashLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(AI_CONFIG.maxRequestsPerMinute, '1 m'),
      prefix: 'lunara:rl:min',
    });
  }
  return upstashLimiter;
}

function getUpstashDailyLimiter(): import('@upstash/ratelimit').Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!upstashDailyLimiter) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require('@upstash/ratelimit');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    upstashDailyLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.fixedWindow(AI_CONFIG.maxRequestsPerDay, '1 d'),
      prefix: 'lunara:rl:day',
    });
  }
  return upstashDailyLimiter;
}

// ---------------------------------------------------------------------------
// In-memory fallback (per-instance, resets on cold start)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();
const inMemoryDailyStore = new Map<string, RateLimitEntry>();

function checkInMemory(identifier: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = AI_CONFIG.maxRequestsPerMinute;

  // Periodic cleanup
  if (Math.random() < 0.01) {
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.resetAt < now) inMemoryStore.delete(key);
    }
  }

  const entry = inMemoryStore.get(identifier);
  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

function checkInMemoryDaily(identifier: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const max = AI_CONFIG.maxRequestsPerDay;

  if (Math.random() < 0.01) {
    for (const [key, entry] of inMemoryDailyStore.entries()) {
      if (entry.resetAt < now) inMemoryDailyStore.delete(key);
    }
  }

  const entry = inMemoryDailyStore.get(identifier);
  if (!entry || entry.resetAt < now) {
    inMemoryDailyStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter();
  if (limiter) {
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  // Warn once per cold start that we're using the in-memory fallback
  if (process.env.NODE_ENV === 'production') {
    console.warn('[rate-limiter] UPSTASH_REDIS_REST_URL not set — using per-instance in-memory fallback');
  }
  return checkInMemory(identifier);
}

export async function checkDailyQuota(identifier: string): Promise<RateLimitResult> {
  const limiter = getUpstashDailyLimiter();
  if (limiter) {
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[rate-limiter] UPSTASH_REDIS_REST_URL not set — daily quota using in-memory fallback');
  }
  return checkInMemoryDaily(identifier);
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(AI_CONFIG.maxRequestsPerMinute),
    'X-RateLimit-Remaining': String(result.remaining),
  };
  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}
