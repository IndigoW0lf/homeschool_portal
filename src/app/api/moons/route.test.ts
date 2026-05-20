import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeSupabaseMock } from '@/lib/__tests__/helpers/make-supabase-mock';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/kid-access', () => ({
  canAccessKid: vi.fn().mockResolvedValue(true),
}));

import { createServerClient } from '@/lib/supabase/server';
import { GET, POST } from './route';

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/moons');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/moons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/moons', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when kidId is missing', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/kidId is required/i);
  });

  it('returns moon history and total on success', async () => {
    const transactions = [
      { id: 't-1', kid_id: 'kid-1', stars_earned: 5, source: 'activity', awarded_at: new Date().toISOString() },
    ];
    const supabase = makeSupabaseMock({ data: transactions, error: null });
    // Override single() for student_progress query
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'student_progress') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { total_stars: 42 }, error: null }),
        } as never;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: transactions, error: null }),
      } as never;
    }) as unknown as typeof supabase.from);
    vi.mocked(createServerClient).mockResolvedValue(supabase as never);

    const res = await GET(makeGetRequest({ kidId: 'kid-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalMoons).toBe(42);
    expect(Array.isArray(body.transactions)).toBe(true);
  });
});

describe('POST /api/moons (bonus)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when kidId is missing', async () => {
    const res = await POST(makePostRequest({ amount: 10 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await POST(makePostRequest({ kidId: 'kid-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is zero', async () => {
    const res = await POST(makePostRequest({ kidId: 'kid-1', amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount exceeds 100', async () => {
    const res = await POST(makePostRequest({ kidId: 'kid-1', amount: 101 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/maximum 100/i);
  });

  it('returns 200 with award on success', async () => {
    const award = { id: 'award-1', kid_id: 'kid-1', stars_earned: 10, source: 'bonus' };
    const supabase = makeSupabaseMock({ data: null, error: null });
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'progress_awards') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: award, error: null }),
        } as never;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { total_stars: 15 }, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as never;
    }) as unknown as typeof supabase.from);
    supabase.rpc = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createServerClient).mockResolvedValue(supabase as never);

    const res = await POST(makePostRequest({ kidId: 'kid-1', amount: 10, note: 'Great work!' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.award).toEqual(award);
  });
});
