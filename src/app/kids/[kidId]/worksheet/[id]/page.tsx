import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { InteractiveWorksheet } from '@/components/kids/InteractiveWorksheet';

interface WorksheetPageProps {
  params: Promise<{ kidId: string; id: string }>;
}

export default async function WorksheetPage({ params }: WorksheetPageProps) {
  const { kidId, id } = await params;
  const supabase = await createServerClient();

  // Fetch the assignment with worksheet data
  const { data: assignment, error } = await supabase
    .from('assignment_items')
    .select('id, title, worksheet_data')
    .eq('id', id)
    .single();

  if (error || !assignment) {
    notFound();
  }

  if (!assignment.worksheet_data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--background-secondary)] dark:bg-[var(--background)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            No Worksheet Available
          </h1>
          <p className="text-muted mb-8">
            This assignment doesn&apos;t have an interactive worksheet.
          </p>
          <a 
            href={`/kids/${kidId}`}
            className="text-[var(--nebula-purple)] hover:underline"
          >
            Back to Portal
          </a>
        </div>
      </div>
    );
  }

  return (
    <InteractiveWorksheet
      data={assignment.worksheet_data as any}
      kidId={kidId}
      assignmentId={id}
    />
  );
}
