import { vi } from 'vitest';

type QueryResult<T = unknown> = { data: T | null; error: { message: string } | null };

/**
 * Creates a chainable Supabase client mock.
 *
 * Usage:
 *   const mock = makeSupabaseMock({ data: [...], error: null });
 *   vi.mocked(createServerClient).mockResolvedValue(mock as never);
 *
 * Override resolution per test by passing different defaultResult.
 * For per-table overrides, chain `.from()` spy call implementations manually.
 */
export function makeSupabaseMock(defaultResult: QueryResult = { data: null, error: null }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gte', 'lte', 'ilike', 'not', 'in',
    'order', 'limit', 'is',
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnThis();
  }

  // Terminal methods resolve with the default result
  builder.single = vi.fn().mockResolvedValue(defaultResult);

  // Make the builder itself awaitable (handles `.from().select()` without `.single()`)
  const makeChain = () => ({
    ...builder,
    then: (resolve: (v: QueryResult) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(defaultResult).then(resolve, reject),
  });

  return {
    from: vi.fn(() => makeChain()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

export type SupabaseMock = ReturnType<typeof makeSupabaseMock>;
