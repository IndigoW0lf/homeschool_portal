import Link from 'next/link';
import { getKids, getDailyQuote, getCalendarEntries } from '@/lib/content';
import { QuoteCard, KidSwitcher, ThemeCard } from '@/components';
import { DashboardWeekCalendar } from './DashboardWeekCalendar';

export default function Dashboard() {
  const kids = getKids();
  const quote = getDailyQuote();
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const calendarEntries = getCalendarEntries();
  
  // Find today's theme (if any entry exists for today)
  const todayEntry = calendarEntries.find(entry => entry.date === todayString);

  // Format today's date nicely
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                📚 Homeschool Portal
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{formattedDate}</p>
            </div>
            <Link 
              href="/parent"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              👤 Parent
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Daily Quote */}
        <section>
          <QuoteCard quote={quote} />
        </section>

        {/* Today's Theme (if available) */}
        {todayEntry && (
          <section>
            <ThemeCard theme={todayEntry.theme} />
          </section>
        )}

        {/* Week Calendar */}
        <section>
          <DashboardWeekCalendar entries={calendarEntries} />
        </section>

        {/* Kid Switcher */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Choose Your Portal
          </h2>
          <KidSwitcher kids={kids} />
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        Made with ❤️ for homeschool families
      </footer>
    </div>
  );
}

