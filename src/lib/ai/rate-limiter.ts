import { AI_CONFIG } from './config';

/**
 * Simple in-memory rate limiter
 * 
 * MVP implementation - for production, use Redis/Upstash
 * 
 * Note: This resets on server restart and doesn't work across
 * serverless function instances. Acceptable for MVP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per-instance, resets on restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until reset
}

/**
 * Check if a request is allowed under rate limits
 * 
 * @param identifier - User ID or IP address
 * @returns Whether the request is allowed and retry info
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  cleanup();
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = AI_CONFIG.maxRequestsPerMinute;
  
  const entry = rateLimitStore.get(identifier);
  
  // No existing entry or window expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
    };
  }
  
  // Within window
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }
  
  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
  };
}

/**
 * Get rate limit headers for response
 */
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
