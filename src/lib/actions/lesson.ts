'use server';

import { createServerClient } from '@/lib/supabase/server';
import { updateLesson } from '@/lib/supabase/mutations';
import { revalidatePath } from 'next/cache';

/**
 * Attaches a generated worksheet (as an assignment) to a lesson
 * by adding a link to the print view in the lesson's resources.
 */
export async function attachWorksheetToLessonAction(
  lessonId: string, 
  worksheetAssignmentId: string, 
  worksheetTitle: string
) {
  try {
    const supabase = await createServerClient();
    
    // 1. Fetch current lesson to get existing links
    // We select only 'links' for efficiency
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('links')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      console.error('Error fetching lesson:', error);
      return { success: false, error: 'Lesson not found' };
    }

    // 2. Prepare new link
    const newLink = {
      label: `Worksheet: ${worksheetTitle}`,
      url: `/print/worksheet/${worksheetAssignmentId}`
    };

    // 3. Update lesson
    // Ensure links is an array (it might be null in DB)
    const currentLinks = Array.isArray(lesson.links) ? lesson.links : [];
    
    // Check for duplicates to avoid adding the same worksheet twice
    const exists = currentLinks.some((l: any) => l.url === newLink.url);
    
    if (!exists) {
      await updateLesson(lessonId, {
          links: [...currentLinks, newLink]
      });
    }

    // 4. Revalidate pages to show the new link
    revalidatePath('/parent/lessons');
    revalidatePath(`/parent/lessons/${lessonId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error attaching worksheet to lesson:', error);
    return { success: false, error: 'Failed to attach worksheet' };
  }
}
