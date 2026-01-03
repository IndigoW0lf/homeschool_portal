import Link from 'next/link';
import Image from 'next/image';
import { getKidsFromDB, getUpcomingHolidaysFromDB, getUserProfileFromDB } from '@/lib/supabase/data';
import { getDailyQuote } from '@/lib/content';
import { QuoteCard } from '@/components';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { HolidayIcon } from '@/components/ui/HolidayIcon';
import { createServerClient } from '@/lib/supabase/server';
import { RocketLaunch, Sparkle, Star, Heart } from '@phosphor-icons/react/dist/ssr';

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
  // Check if user is logged in
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const kids = await getKidsFromDB();
  const quote = getDailyQuote();
  const today = new Date();
  const upcomingHolidays = user ? await getUpcomingHolidaysFromDB(6) : [];
  const profile = user ? await getUserProfileFromDB() : null;
  const displayName = profile?.display_name || 'Parent';

  // Format today's date nicely
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // If not logged in, show landing/marketing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Image 
                src="/assets/titles/page_title.svg" 
                alt="Lunara Homeschool Quest" 
                width={300} 
                height={60}
                className="h-12 w-auto dark:brightness-110"
                priority
              />
              <div className="flex items-center gap-3">
                <DarkModeToggle />
                <Link 
                  href="/parent/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup"
                  className="px-4 py-2 bg-[var(--ember-500)] text-white rounded-lg font-medium hover:opacity-90 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-16">
          {/* Hero */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--lavender-400)] to-[var(--ember-400)] mb-4">
              <Sparkle size={40} weight="fill" className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Homeschool Planning,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember-500)] to-[var(--lavender-500)]">
                Made Magical
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Lunara Quest helps homeschool families organize lessons, track progress, 
              and make learning an adventure — with Luna, your AI planning companion.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-[var(--ember-500)]/20"
              >
                <RocketLaunch size={20} weight="fill" />
                Start Free
              </Link>
              <Link 
                href="/parent/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Log In
              </Link>
            </div>
          </section>

          {/* Features */}
          <section className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--sage-100)] dark:bg-[var(--sage-900)]/20 flex items-center justify-center mx-auto mb-4">
                <Star size={24} weight="fill" className="text-[var(--sage-500)]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Plan Your Week</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organize lessons, assignments, and activities in a beautiful calendar view.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--lavender-100)] dark:bg-[var(--lavender-900)]/20 flex items-center justify-center mx-auto mb-4">
                <Sparkle size={24} weight="fill" className="text-[var(--lavender-500)]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Luna AI Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get personalized suggestions and brainstorm ideas with your AI companion.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/20 flex items-center justify-center mx-auto mb-4">
                <Heart size={24} weight="fill" className="text-[var(--ember-500)]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Kid-Friendly Portal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kids see their daily quests with gamified rewards and fun avatars.
              </p>
            </div>
          </section>

          {/* Daily Quote Preview */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's inspiration</p>
            </div>
            <QuoteCard quote={quote} />
          </section>
        </main>

        {/* Footer */}
        <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-muted">
          Made with ❤️ for homeschool families
        </footer>
      </div>
    );
  }

  // User is logged in - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              {/* Custom Page Title - negative margin to compensate for SVG whitespace */}
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
                className="px-3 py-2 bg-gradient-to-r from-[var(--lavender-400)] to-[var(--ember-400)] text-white rounded-xl hover:opacity-90 transition-all font-bold text-sm uppercase tracking-wide shadow-md"
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
                // Default colorful backgrounds based on whether name is known
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
