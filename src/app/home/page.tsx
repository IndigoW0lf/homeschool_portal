import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getKidsFromDB, getUpcomingHolidaysFromDB, getUserProfileFromDB } from '@/lib/supabase/data';
import { getDailyQuote } from '@/lib/content';
import { QuoteCard } from '@/components';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { HolidayIcon } from '@/components/ui/HolidayIcon';
import { createServerClient } from '@/lib/supabase/server';

// Helper to format date range
function formatHolidayDate(startDate: string, endDate: string | null): string {
  const start = new Date(startDate + 'T00:00:00');
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (!endDate || endDate === startDate) {
    return startStr;
  }
  
  const end = new Date(endDate + 'T00:00:00');
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export default async function FamilyHomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Must be logged in to access family home
  if (!user) {
    redirect('/');
  }

  const kids = await getKidsFromDB();
  const quote = getDailyQuote();
  const upcomingHolidays = await getUpcomingHolidaysFromDB(6);
  const profile = await getUserProfileFromDB();
  const displayName = profile?.display_name || 'Parent';
  const userTimezone = profile?.timezone || 'America/Chicago';

  // Use timezone-aware "today" to prevent UTC showing tomorrow for US users
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: userTimezone,
  }).format(today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Image 
                src="/assets/titles/page_title.svg" 
                alt="Lunara Homeschool Quest" 
                width={300} 
                height={60}
                className="h-12 w-auto svg-title -ml-3"
                priority
              />
              <p className="text-gray-500 dark:text-gray-400 mt-2">{formattedDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Link 
                href="/parent"
                className="px-4 py-2.5 bg-gradient-to-r from-[#9c8fb8] via-[#E27D60] to-[#D48A8A] text-white rounded-xl hover:opacity-90 transition-all font-bold text-base uppercase tracking-wide shadow-lg"
                aria-label="Parent Dashboard"
              >
                {displayName}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Today's Quest / Daily Quote */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Image 
            src="/assets/titles/todays_quest.svg" 
            alt="Today's Quest" 
            width={200} 
            height={40}
            className="h-8 w-auto mb-4 svg-title"
          />
          <QuoteCard quote={quote} />
        </section>

        {/* Kid Portals */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {kids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kids.map(kid => {
                const bgClass = 'bg-gradient-to-br from-purple-100 to-teal-100 hover:from-purple-150 hover:to-teal-150 dark:from-purple-900/30 dark:to-teal-900/30 dark:hover:from-purple-900/50 dark:hover:to-teal-900/50 border-purple-200 dark:border-purple-800';
                
                return (
                  <Link
                    key={kid.id}
                    href={`/kids/${kid.id}`}
                    className={`group p-6 rounded-2xl ${bgClass} border-2 shadow-sm hover:shadow-lg transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-2xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">
                        {kid.name}
                      </span>
                    </div>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Grade {kid.gradeBand}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No kids added yet! Add your first child to get started.
              </p>
              <Link 
                href="/parent/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Add Your First Kid
              </Link>
            </div>
          )}
        </section>
        
        {/* Upcoming Holidays */}
        {upcomingHolidays.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <Image 
              src="/assets/titles/breaks_holidays.svg" 
              alt="Upcoming Breaks & Holidays" 
              width={315} 
              height={60}
              className="h-12 w-auto mb-4 dark:brightness-110"
            />
            <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {upcomingHolidays.map(holiday => (
                <div
                  key={holiday.id}
                  className="list-item"
                >
                  <HolidayIcon iconId={holiday.emoji} size={32} />
                  <div className="flex-1">
                    <div className="text-heading font-medium">{holiday.name}</div>
                    <div className="text-sm text-muted">
                      {formatHolidayDate(holiday.startDate, holiday.endDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-muted">
        Made with ❤️ for homeschool families
      </footer>
    </div>
  );
}
