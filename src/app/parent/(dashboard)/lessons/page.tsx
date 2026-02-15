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
    const { getLessonByIdFromDB } = await import('@/lib/supabase/data');
    lesson = await getLessonByIdFromDB(viewId) ?? null;
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* View Mode - Read-only lesson */}
        {viewId && lesson ? (
          <>
            <div className="mb-6">
              <Link 
                href="/parent" 
                className="inline-flex items-center gap-2 text-sm link mb-3 transition-colors"
              >
                <ArrowLeft size={16} weight="bold" />
                Back to Dashboard
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
              href="/parent"
              className="link mt-2 inline-block"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          // Create / edit list - Activity form (one place for new lessons, assignments, worksheets)
          <>
            <div className="mb-6">
              <h1 className="heading-lg">Create Activity</h1>
              <p className="text-muted text-sm mt-1">
                Add a lesson, assignment, or worksheet. Schedule it to a day and assign to kids.
              </p>
            </div>
            <div className="card-elevated p-6">
              <ActivityForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
