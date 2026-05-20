import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';

const BUCKET = 'profile-photos';
const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** Extract the storage path from a legacy public Supabase URL or return null */
function extractStoragePath(url: string): string | null {
  const idx = url.indexOf(`/${BUCKET}/`);
  if (idx === -1) return null;
  return url.slice(idx + BUCKET.length + 2).split('?')[0] || null;
}

/** Proxy URL stored in the DB — the frontend always uses this */
function proxyUrl(userId: string): string {
  return `/api/profile/photo?userId=${userId}`;
}

// ---------------------------------------------------------------------------
// GET /api/profile/photo?userId=xxx
// Requires parent auth OR kid session. Returns a redirect to a signed URL.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Auth: accept either a parent Supabase session or a kid session
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const kidSession = await getKidSession();

  if (!user && !kidSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up the stored photo URL / path for this user
  const serviceClient = await createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('profile_photo_url')
    .eq('id', userId)
    .single();

  if (!profile?.profile_photo_url) {
    return NextResponse.json({ error: 'No photo found' }, { status: 404 });
  }

  // Support both legacy full Supabase URLs and bare storage paths
  const storagePath = profile.profile_photo_url.startsWith('http')
    ? extractStoragePath(profile.profile_photo_url)
    : profile.profile_photo_url;

  if (!storagePath) {
    return NextResponse.json({ error: 'Invalid photo path' }, { status: 404 });
  }

  const { data, error } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    console.error('[profile/photo GET] Signed URL error:', error);
    return NextResponse.json({ error: 'Failed to generate photo URL' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl, 302);
}

// ---------------------------------------------------------------------------
// POST /api/profile/photo
// Upload a parent's profile photo
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate image magic bytes — client file.type is not trustworthy
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
                && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    const isGif  = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;

    if (!isJpeg && !isPng && !isWebP && !isGif) {
      return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });
    }

    const contentType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebP ? 'image/webp' : 'image/gif';
    const ext = contentType.split('/')[1];

    // Delete old photo if one exists
    const serviceClient = await createServiceRoleClient();
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .single();

    if (profile?.profile_photo_url && profile.profile_photo_url.startsWith('http')) {
      const oldPath = extractStoragePath(profile.profile_photo_url);
      if (oldPath) await serviceClient.storage.from(BUCKET).remove([oldPath]);
    } else if (profile?.profile_photo_url && !profile.profile_photo_url.startsWith('/api')) {
      // Bare path stored directly
      await serviceClient.storage.from(BUCKET).remove([profile.profile_photo_url]);
    }

    const filePath = `${user.id}/photo_${Date.now()}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      console.error('[Profile Photo API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Store the storage path (not a public URL) and the proxy URL for display
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({
        avatar_url: proxyUrl(user.id),
        profile_photo_url: filePath,
        profile_pic_type: 'photo',
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Profile Photo API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      photoUrl: proxyUrl(user.id),
      message: 'Photo updated!',
    });

  } catch (error) {
    console.error('[Profile Photo API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
