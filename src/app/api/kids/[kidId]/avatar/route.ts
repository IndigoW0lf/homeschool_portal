import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';
import { canAccessKid } from '@/lib/kid-access';

/** Extract storage path from a public URL (e.g. .../kid-avatars/kidId/file.jpg -> kidId/file.jpg) */
function getStoragePathFromUrl(url: string | null, bucketId: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const idx = url.indexOf(`/${bucketId}/`);
  if (idx === -1) return null;
  const path = url.slice(idx + bucketId.length + 2);
  return path.split('?')[0] || null;
}

/**
 * POST /api/kids/[kidId]/avatar
 * Upload a kid's avatar image
 * Works for both kid sessions (uploading own) and parent sessions
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ kidId: string }> }) {
  const { kidId } = await params;

  try {
    const kidSession = await getKidSession();
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role when kid is uploading their own, or when parent has family access
    let supabase = await createServiceRoleClient();
    if (!kidSession || kidSession.kidId !== kidId) {
      // Parent path: verify parent can access this kid (same family)
      const { data: kidRow } = await serverClient
        .from('kids')
        .select('family_id')
        .eq('id', kidId)
        .single();
      const { data: memberships } = await serverClient
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id);
      const familyIds = (memberships ?? []).map((m) => m.family_id);
      const canAccess = kidRow?.family_id && familyIds.includes(kidRow.family_id);
      if (!canAccess) {
        return NextResponse.json({ error: 'You do not have permission to update this profile.' }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.type?.startsWith('image/') ? file.type : 'image/jpeg';
    if (!file.type?.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate image magic bytes server-side — client file.type is not trustworthy
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
                && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    const isGif  = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;

    if (!isJpeg && !isPng && !isWebP && !isGif) {
      return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });
    }

    const validatedContentType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebP ? 'image/webp' : 'image/gif';

    const typeParam = request.nextUrl.searchParams.get('type');
    const isPhoto = typeParam === 'photo';

    const { data: kid } = await supabase
      .from('kids')
      .select('avatar_url, profile_photo_url')
      .eq('id', kidId)
      .single();

    const bucketId = 'kid-avatars';
    if (isPhoto && kid?.profile_photo_url) {
      const oldPath = getStoragePathFromUrl(kid.profile_photo_url, bucketId);
      if (oldPath) await supabase.storage.from(bucketId).remove([oldPath]);
    } else if (!isPhoto && kid?.avatar_url) {
      const oldPath = getStoragePathFromUrl(kid.avatar_url, bucketId);
      if (oldPath) await supabase.storage.from(bucketId).remove([oldPath]);
    }

    const ext = validatedContentType.split('/')[1] || 'jpg';
    const fileName = `${isPhoto ? 'photo' : 'avatar'}_${Date.now()}.${ext}`;
    const filePath = `${kidId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(filePath, buffer, {
        contentType: validatedContentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Avatar API] Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketId).getPublicUrl(filePath);

    const updates = isPhoto
      ? { profile_photo_url: publicUrl, profile_pic_type: 'photo' as const }
      : { avatar_url: publicUrl, profile_pic_type: 'avatar' as const };

    const { error: updateError } = await supabase
      .from('kids')
      .update(updates)
      .eq('id', kidId);

    if (updateError) {
      console.error('[Avatar API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save profile photo', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      photoUrl: publicUrl,
      message: 'Profile updated!',
    });
  } catch (error) {
    console.error('[Avatar API] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/kids/[kidId]/avatar
 * Update a kid's DiceBear avatar configuration
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ kidId: string }> }) {
  const { kidId } = await params;

  try {
    const kidSession = await getKidSession();
    let supabase;

    if (kidSession && kidSession.kidId === kidId) {
      // Kid updating their own avatar → Use Service Role (bypass RLS)
      supabase = await createServiceRoleClient();
    } else {
      // Parent path: verify family membership
      if (!await canAccessKid(kidId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      supabase = await createServiceRoleClient();
    }

    const body = await request.json();
    const { dicebearState } = body;

    if (!dicebearState) {
      return NextResponse.json({ error: 'No dicebearState provided' }, { status: 400 });
    }

    // Update kid record with new DiceBear configuration
    const { error: updateError } = await supabase
      .from('kids')
      .update({ dicebear_avatar_state: dicebearState })
      .eq('id', kidId);

    if (updateError) {
      console.error('[Avatar API] DiceBear update error:', updateError);
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar updated!'
    });

  } catch (error) {
    console.error('[Avatar API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
