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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

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
    const fileName = `photo_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
    const filePath = `${user.id}/${fileName}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('[Profile Photo API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    // Update profile record with new photo URL and set type to photo
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
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
