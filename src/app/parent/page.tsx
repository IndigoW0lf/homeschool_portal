import Link from 'next/link';
import { getKids, getCalendarEntries, getLessons } from '@/lib/content';

export default function ParentPage() {
  const kids = getKids();
  const calendarEntries = getCalendarEntries();
  const lessons = getLessons();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Back to Dashboard"
              >
                ← 
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                  👤 Parent Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400">View and manage content</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Quick Links */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-2">👧👦</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{kids.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Kids</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{lessons.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Lessons</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{calendarEntries.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Scheduled Days</div>
          </div>
        </section>

        {/* Kids Overview */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Kids</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Grade Band</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {kids.map(kid => (
                  <tr key={kid.id}>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{kid.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{kid.gradeBand}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-500 dark:text-gray-400">{kid.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Calendar Entries */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Calendar</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Theme</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Kids</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Lessons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {calendarEntries.slice(0, 10).map(entry => (
                    <tr key={entry.date}>
                      <td className="px-4 py-3 font-mono text-sm text-gray-800 dark:text-white">{entry.date}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.theme}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.kidIds.join(', ')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{entry.lessonIds.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Lessons */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Lessons</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Tags</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td className="px-4 py-3 text-gray-800 dark:text-white">{lesson.title}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {lesson.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{lesson.estimatedMinutes} min</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{lesson.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Edit Instructions */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">📝 How to Edit Content</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Content is stored in JSON files in the <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">/content</code> directory.
              Edit these files directly to update the portal:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">kids.json</code>
                {' '}- Add or modify kids
              </li>
              <li>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">lessons.json</code>
                {' '}- Create new lessons with instructions, links, and attachments
              </li>
              <li>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">calendar.json</code>
                {' '}- Schedule lessons for specific dates and kids
              </li>
              <li>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">resources.json</code>
                {' '}- Update evergreen resource links
              </li>
              <li>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">quotes.json</code>
                {' '}- Add inspiring quotes for the daily rotation
              </li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Tip:</strong> After editing JSON files, refresh the page to see your changes.
                Make sure your JSON is valid - you can use a JSON validator online if needed.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center">
        <Link 
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ← Back to Dashboard
        </Link>
      </footer>
    </div>
  );
}
