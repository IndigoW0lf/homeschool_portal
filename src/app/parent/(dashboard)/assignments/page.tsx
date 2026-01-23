import { createServerClient } from '@/lib/supabase/server';
import { AssignmentViewer } from '@/components/assignments/AssignmentViewer';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function AssignmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const viewId = params.view;

  // If viewing an assignment, fetch it
  let assignment = null;
  if (viewId) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('assignment_items')
      .select('*')
      .eq('id', viewId)
      .single();
    assignment = data;
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        {/* View Mode - Read-only assignment */}
        {viewId && assignment ? (
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
                {assignment.title}
              </h1>
              <p className="text-muted text-sm mt-1">
                Assignment Details
              </p>
            </div>

            <div className="card-elevated p-6">
              <AssignmentViewer assignment={assignment} />
            </div>
          </>
        ) : viewId ? (
          // Assignment not found
          <div className="text-center py-12">
            <p className="text-muted">Assignment not found</p>
            <Link 
              href="/parent/progress"
              className="link mt-2 inline-block"
            >
              Return to Progress
            </Link>
          </div>
        ) : (
          // Create Mode - Assignment form
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="heading-lg">
                  Create Assignment
                </h1>
                <p className="text-muted text-sm">
                  Assign new work to students manually or generate it.
                </p>
              </div>
            </div>

            <div className="card-elevated p-6">
              <AssignmentForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
