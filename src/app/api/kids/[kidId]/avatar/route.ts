import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server';
import { getKidSession } from '@/lib/kid-session';

/**
 * POST /api/kids/[kidId]/avatar
 * Upload a kid's avatar image
 * Works for both kid sessions (uploading own) and parent sessions
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ kidId: string }> }) {
  const { kidId } = await params;

  try {
    const kidSession = await getKidSession();
    let supabase;

    if (kidSession && kidSession.kidId === kidId) {
      // Kid uploading their own avatar → Use Service Role (bypass RLS)
      supabase = await createServiceRoleClient();
    } else {
      // Parent/other user → Use standard client (RLS)
      supabase = await createServerClient();
      
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get the file from the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const typeParam = request.nextUrl.searchParams.get('type');
    const isPhoto = typeParam === 'photo';

    // Get current profile to delete old photo/avatar safely
    const { data: kid } = await supabase
      .from('kids')
      .select('avatar_url, profile_photo_url')
      .eq('id', kidId)
      .single();

    // Delete old file if exists corresponding to the type
    if (isPhoto && kid?.profile_photo_url) {
      const oldPath = kid.profile_photo_url.split('/kid-avatars/').pop();
      if (oldPath) {
        await supabase.storage.from('kid-avatars').remove([oldPath]);
      }
    } else if (!isPhoto && kid?.avatar_url) {
      const oldPath = kid.avatar_url.split('/kid-avatars/').pop();
      if (oldPath) {
        await supabase.storage.from('kid-avatars').remove([oldPath]);
      }
    }

    // Upload new avatar with timestamp to bust cache
    const prefix = isPhoto ? 'photo' : 'avatar';
    const fileName = `${prefix}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
    const filePath = `${kidId}/${fileName}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('kid-avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('[Avatar API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('kid-avatars')
      .getPublicUrl(filePath);

    // Update kid record with new URL and type
    const updates = isPhoto 
      ? { profile_photo_url: publicUrl, profile_pic_type: 'photo' }
      : { avatar_url: publicUrl, profile_pic_type: 'avatar' };

    const { error: updateError } = await supabase
      .from('kids')
      .update(updates)
      .eq('id', kidId);

    if (updateError) {
      console.error('[Avatar API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      photoUrl: publicUrl,
      message: 'Profile updated!'
    });

  } catch (error) {
    console.error('[Avatar API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      // Parent/other user → Use standard client (RLS)
      supabase = await createServerClient();
      
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { dicebearState } = body;

    if (!dicebearState) {
      return NextResponse.json({ error: 'No dicebearState provided' }, { status: 400 });
    }

    // Update kid record with new DiceBear configuration
    const { error: updateError } = await supabase
      .from('kid')
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
