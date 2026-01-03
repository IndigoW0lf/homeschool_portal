import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServerClient } from '@/lib/supabase/server';
import { JournalBrowser } from './JournalBrowser';
import { NotePencil } from '@phosphor-icons/react/dist/ssr';

interface JournalPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function KidJournalPage({ params }: JournalPageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  // Fetch all journal entries for this kid
  const supabase = await createServerClient();
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('kid_id', kidId)
    .eq('skipped', false)
    .order('date', { ascending: false });

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <NotePencil size={28} weight="duotone" className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Journal
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {entries?.length || 0} entries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <JournalBrowser 
          entries={entries || []} 
          kidName={kid.nickname || kid.name}
        />
      </div>
    </div>
  );
}
