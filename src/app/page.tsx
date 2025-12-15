import Link from 'next/link';
import Image from 'next/image';
import { getKidsFromDB, getUpcomingHolidaysFromDB } from '@/lib/supabase/data';
import { getDailyQuote } from '@/lib/content';
import { QuoteCard } from '@/components';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { HolidayIcon } from '@/components/ui/HolidayIcon';

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

export default async function Dashboard() {
  const kids = await getKidsFromDB();
  const quote = getDailyQuote();
  const today = new Date();
  const upcomingHolidays = await getUpcomingHolidaysFromDB(6);

  // Format today's date nicely
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              {/* Custom Page Title */}
              <Image 
                src="/assets/titles/page_title.svg" 
                alt="Lunara Homeschool Quest" 
                width={300} 
                height={60}
                className="h-12 w-auto dark:brightness-110"
                priority
              />
              <p className="text-gray-500 dark:text-gray-400 mt-2">{formattedDate}</p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Link 
                href="/parent"
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Parent Dashboard"
              >
                <Image 
                  src="/assets/titles/mom.svg" 
                  alt="Parent" 
                  width={32} 
                  height={32}
                  className="h-8 w-auto dark:brightness-110"
                />
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
            className="h-8 w-auto mb-4 dark:brightness-110"
          />
          <QuoteCard quote={quote} />
        </section>

        {/* Kid Portals */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kids.map(kid => {
              const kidImage = kid.name.toLowerCase() === 'stella' ? '/assets/titles/stella.svg' : '/assets/titles/atlas.svg';
              // Pastel backgrounds matching their name colors
              const bgClass = kid.name.toLowerCase() === 'stella' 
                ? 'bg-purple-100 hover:bg-purple-150 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-800'
                : 'bg-teal-100 hover:bg-teal-150 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 border-teal-200 dark:border-teal-800';
              
              return (
                <Link
                  key={kid.id}
                  href={`/kids/${kid.id}`}
                  className={`group p-6 rounded-2xl ${bgClass} border-2 shadow-sm hover:shadow-lg transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-center gap-4">
                    {/* Kid name SVG in original colors */}
                    <Image 
                      src={kidImage} 
                      alt={kid.name} 
                      width={140} 
                      height={50}
                      className="h-12 w-auto group-hover:scale-105 transition-transform"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        
        {/* Upcoming Holidays - List Format */}
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

