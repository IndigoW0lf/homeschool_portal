import { supabase } from './browser';

/**
 * Upload a lesson attachment to Supabase Storage
 * Bucket: homeschool
 * Path: attachments/{lessonId}/{timestamp}-{filename}
 * 
 * Note: For public URLs, the bucket must be set to public in Supabase dashboard.
 * Alternatively, use signed URLs for private access.
 */
export async function uploadLessonAttachment(
  file: File,
  lessonId: string
): Promise<{ url: string; storage_path: string }> {
  const timestamp = Date.now();
  const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `attachments/${lessonId}/${timestamp}-${filename}`;

  const { data, error } = await supabase.storage
    .from('homeschool')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL (requires bucket to be public)
  // If bucket is private, use getPublicUrl() or createSignedUrl() instead
  const { data: urlData } = supabase.storage
    .from('homeschool')
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    storage_path: storagePath,
  };
}

/**
 * Delete an attachment from Supabase Storage
 */
export async function deleteLessonAttachment(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('homeschool')
    .remove([storagePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}





