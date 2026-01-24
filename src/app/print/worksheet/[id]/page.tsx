import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PrintPageClient } from '@/components/worksheets/PrintPageClient';
import Link from 'next/link';

interface PrintWorksheetPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintWorksheetPage({ params }: PrintWorksheetPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  console.log('=== PRINT PAGE DEBUG ===');
  console.log('Assignment ID:', id);
  console.log('User ID:', user.id);

  const { data: assignment, error } = await supabase
    .from('assignment_items')
    .select('*')
    .eq('id', id)
    .single();

  console.log('Query result:', { hasData: !!assignment, error: error?.message });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[var(--background-secondary)]">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Worksheet</h1>
        <p className="text-muted mb-2">Could not load the worksheet data.</p>
        <p className="text-sm text-muted mb-4">Error: {error.message}</p>
        <p className="text-xs text-muted mb-8">ID: {id}</p>
        <Link href="/parent/assignments" className="text-[var(--celestial-500)] hover:underline">
          Back to Assignments
        </Link>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[var(--background-secondary)]">
        <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Worksheet Not Found</h1>
        <p className="text-muted mb-4">This worksheet may have been deleted or you don&apos;t have access.</p>
        <p className="text-xs text-muted mb-8">ID: {id}</p>
        <Link href="/parent/assignments" className="text-[var(--celestial-500)] hover:underline">
          Back to Assignments
        </Link>
      </div>
    );
  }

  if (!assignment.worksheet_data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[var(--background-secondary)]">
        <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">No Worksheet Data</h1>
        <p className="text-muted mb-4">This assignment exists but doesn&apos;t have a generated worksheet attached.</p>
        <p className="text-sm text-muted mb-8">Title: {assignment.title}</p>
        <Link href="/parent/assignments" className="text-[var(--celestial-500)] hover:underline">
          Back to Assignments
        </Link>
      </div>
    );
  }

  return <PrintPageClient data={assignment.worksheet_data as any} />;
}


