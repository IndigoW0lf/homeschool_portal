import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { createServerClient } from '@/lib/supabase/server';
import { TimeCapsuleViewer } from './TimeCapsuleViewer';
import { Package } from '@phosphor-icons/react/dist/ssr';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface TimeCapsulePageProps {
  params: Promise<{
    kidId: string;
  }>;
  searchParams: Promise<{
    period?: string; // 'month' | 'year'
    date?: string;   // YYYY-MM or YYYY
  }>;
}

export default async function KidTimeCapsulePage({ params, searchParams }: TimeCapsulePageProps) {
  const { kidId } = await params;
  const { period = 'month', date } = await searchParams;
  
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  // Determine date range
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (period === 'year') {
    const year = date ? parseInt(date) : now.getFullYear() - 1;
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
    periodLabel = `${year}`;
  } else {
    // Default to last month
    const targetDate = date 
      ? new Date(date + '-01')
      : subMonths(now, 1);
    startDate = startOfMonth(targetDate);
    endDate = endOfMonth(targetDate);
    periodLabel = format(targetDate, 'MMMM yyyy');
  }

  // Fetch journal entries for this period
  const supabase = await createServerClient();
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('kid_id', kidId)
    .eq('skipped', false)
    .gte('date', format(startDate, 'yyyy-MM-dd'))
    .lte('date', format(endDate, 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  // Calculate some stats
  const entryCount = entries?.length || 0;
  const moodCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  entries?.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
    entry.tags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Get top mood and tags
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Package size={28} weight="duotone" className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Time Capsule
              </h1>
              <p className="text-amber-600 dark:text-amber-400">
                {periodLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <TimeCapsuleViewer
          entries={entries || []}
          kidName={kid.nickname || kid.name}
          kidId={kidId}
          periodLabel={periodLabel}
          entryCount={entryCount}
          topMood={topMood}
          topTags={topTags}
          currentPeriod={period as 'month' | 'year'}
        />
      </div>
    </div>
  );
}
