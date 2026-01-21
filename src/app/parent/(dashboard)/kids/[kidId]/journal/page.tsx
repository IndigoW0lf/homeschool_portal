import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { JournalBrowser } from '@/app/kids/[kidId]/journal/JournalBrowser';
import { NotePencil, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

interface Props {
  params: Promise<{ kidId: string }>;
}

export default async function ParentViewKidJournalPage({ params }: Props) {
  const { kidId } = await params;
  const supabase = await createServerClient();

  // Get the current user (parent)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/parent/login');

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!familyMember) redirect('/parent');

  // Get kid data (make sure they're in the user's family)
  const { data: kid, error } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .eq('family_id', familyMember.family_id)
    .single();

  if (error || !kid) notFound();

  // Use Service Role to fetch journal entries (bypass RLS for parent viewing)
  const serviceSupabase = await createServiceRoleClient();
  const { data: entries } = await serviceSupabase
    .from('journal_entries')
    .select('*')
    .eq('kid_id', kidId)
    .eq('skipped', false)
    .order('date', { ascending: false });

  const displayName = kid.nickname || kid.name;

  return (
    <div className="min-h-screen">
      {/* Parent View Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200 dark:border-blue-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                Parent View
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Viewing {displayName}'s journal as admin
              </p>
            </div>
            <Link
              href={`/kids/${kidId}/journal`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowSquareOut size={16} />
              Open Kid Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <NotePencil size={28} weight="duotone" className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayName}'s Journal
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
          kidName={displayName}
          kidId={kidId}
        />
      </div>
    </div>
  );
}
