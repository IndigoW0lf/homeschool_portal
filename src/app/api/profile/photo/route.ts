import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/profile/photo
 * Upload a parent's profile photo
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the file from the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size before reading full buffer (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Read buffer early so we can validate magic bytes server-side
    // (client-supplied file.type is not trustworthy)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate image magic bytes
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
      && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;

    if (!isJpeg && !isPng && !isWebP && !isGif) {
      return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });
    }

    // Derive a safe content type from the actual bytes, not the client's claim
    const contentType = isJpeg ? 'image/jpeg'
      : isPng ? 'image/png'
      : isWebP ? 'image/webp'
      : 'image/gif';

    // Get current profile to delete old photo
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .single();

    // Delete old photo if exists
    if (profile?.profile_photo_url) {
      const oldPath = profile.profile_photo_url.split('/profile-photos/').pop();
      if (oldPath) {
        await supabase.storage.from('profile-photos').remove([oldPath]);
      }
    }

    // Upload new photo with timestamp to bust cache
    const ext = contentType.split('/')[1];
    const fileName = `photo_${Date.now()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Profile Photo API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    // Update profile record: set both avatar_url (for display) and profile_photo_url
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        profile_photo_url: publicUrl,
        profile_pic_type: 'photo'
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Profile Photo API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      photoUrl: publicUrl,
      message: 'Photo updated!'
    });

  } catch (error) {
    console.error('[Profile Photo API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
