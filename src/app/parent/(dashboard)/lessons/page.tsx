import { createServerClient } from '@/lib/supabase/server';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { LessonViewer } from '@/components/lessons/LessonViewer';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function LessonsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const viewId = params.view;

  // If viewing a lesson, fetch it
  let lesson = null;
  if (viewId) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('lesson_items')
      .select('*')
      .eq('id', viewId)
      .single();
    lesson = data;
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* View Mode - Read-only lesson */}
        {viewId && lesson ? (
          <>
            <div className="mb-6">
              <Link 
                href="/parent/progress" 
                className="inline-flex items-center gap-2 text-sm link mb-3 transition-colors"
              >
                <ArrowLeft size={16} weight="bold" />
                Back to Progress
              </Link>
              <h1 className="heading-lg">
                {lesson.title}
              </h1>
              <p className="text-muted text-sm mt-1">
                Lesson Details
              </p>
            </div>

            <div className="card-elevated p-6">
              <LessonViewer lesson={lesson} />
            </div>
          </>
        ) : viewId ? (
          // Lesson not found
          <div className="text-center py-12">
            <p className="text-muted">Lesson not found</p>
            <Link 
              href="/parent/progress"
              className="link mt-2 inline-block"
            >
              Return to Progress
            </Link>
          </div>
        ) : (
          // Create Mode - Activity form
          <div className="card-elevated p-6">
            <ActivityForm />
          </div>
        )}
      </div>
    </div>
  );
}
