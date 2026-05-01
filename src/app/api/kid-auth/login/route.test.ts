import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { makeSupabaseMock } from '@/lib/__tests__/helpers/make-supabase-mock';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/kid-session', () => ({
  createKidSession: vi.fn().mockResolvedValue(undefined),
  KID_SESSION_MAX_AGE: 60 * 60 * 24 * 30,
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { createServiceRoleClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { POST } from './route';

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/kid-auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/kid-auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when firstName is missing', async () => {
    const res = await POST(makeRequest({ lastInitial: 'S', password: 'abc123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it('returns 400 when lastInitial is missing', async () => {
    const res = await POST(makeRequest({ firstName: 'Atlas', password: 'abc123' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ firstName: 'Atlas', lastInitial: 'S' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when no kid found with that name', async () => {
    const supabase = makeSupabaseMock({ data: [], error: null });
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase as never);

    const res = await POST(makeRequest({ firstName: 'Unknown', lastInitial: 'X', password: 'abc123' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/no account found/i);
  });

  it('returns 401 when last initial does not match', async () => {
    const supabase = makeSupabaseMock({
      data: [{ id: 'kid-1', name: 'Atlas', last_name: 'Smith', password_hash: '$2b$hash' }],
      error: null,
    });
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase as never);

    const res = await POST(makeRequest({ firstName: 'Atlas', lastInitial: 'Z', password: 'abc123' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when password is wrong', async () => {
    const supabase = makeSupabaseMock({
      data: [{ id: 'kid-1', name: 'Atlas', last_name: 'Smith', password_hash: '$2b$hash' }],
      error: null,
    });
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await POST(makeRequest({ firstName: 'Atlas', lastInitial: 'S', password: 'wrongpassword' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/wrong password/i);
  });

  it('returns 200 with kidId and redirectTo on successful login', async () => {
    const kid = { id: 'kid-1', name: 'Atlas', last_name: 'Smith', password_hash: '$2b$hash' };
    const supabase = makeSupabaseMock({ data: [kid], error: null });
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await POST(makeRequest({ firstName: 'Atlas', lastInitial: 'S', password: 'correctpassword' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.kidId).toBe('kid-1');
    expect(body.redirectTo).toBe('/kids/kid-1');
  });

  it('returns 500 on database error', async () => {
    const supabase = makeSupabaseMock({ data: null, error: { message: 'connection failed' } });
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase as never);

    const res = await POST(makeRequest({ firstName: 'Atlas', lastInitial: 'S', password: 'abc123' }));
    expect(res.status).toBe(500);
  });
});
