import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PrintPageClient } from '@/components/worksheets/PrintPageClient';

export default async function PrintWorksheetPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  const { data: assignment, error } = await supabase
    .from('assignment_items')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !assignment) {
    notFound();
  }

  if (!assignment.worksheet_data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">No Worksheet Data</h1>
        <p className="text-gray-600">This assignment does not have a generated worksheet attached.</p>
        <div className="mt-8">
            <a href="/parent" className="text-blue-600 hover:text-blue-800 underline">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  return <PrintPageClient data={assignment.worksheet_data as any} />;
}
