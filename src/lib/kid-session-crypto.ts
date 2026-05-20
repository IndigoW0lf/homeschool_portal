// HMAC-SHA256 cookie signing using Web Crypto API.
// Works in both Edge runtime (middleware) and Node.js (server routes).

function getSecret(): string {
  const secret = process.env.KID_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('KID_SESSION_SECRET environment variable is required in production');
    }
    console.warn('[kid-session] KID_SESSION_SECRET not set — using insecure dev fallback');
    return 'dev-only-insecure-fallback-change-before-production';
  }
  return secret;
}

function base64urlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Serialize and sign a session object into a cookie value.
 * Format: base64url(json).base64url(hmac)
 */
export async function signSession(data: object): Promise<string> {
  const payload = base64urlEncode(new TextEncoder().encode(JSON.stringify(data)));
  const key = await getHmacKey(getSecret());
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${base64urlEncode(sig)}`;
}

/**
 * Verify and deserialize a signed cookie value.
 * Returns null if the signature is invalid or the value is malformed.
 */
export async function verifySession<T>(value: string): Promise<T | null> {
  try {
    const lastDot = value.lastIndexOf('.');
    if (lastDot === -1) return null;

    const payload = value.slice(0, lastDot);
    const sig = value.slice(lastDot + 1);

    const key = await getHmacKey(getSecret());
    const sigBytes = base64urlDecode(sig);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );

    if (!valid) return null;

    const json = new TextDecoder().decode(base64urlDecode(payload));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
