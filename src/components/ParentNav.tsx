'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

interface ParentNavProps {
  user: User;
}

export function ParentNav({ user }: ParentNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/parent/login');
    router.refresh();
  };

  const tabs = [
    { href: '/parent', label: 'Overview' },
    { href: '/parent/lessons', label: 'Lessons' },
    { href: '/parent/assignments', label: 'Assignments' },
    { href: '/parent/resources', label: 'Resources' },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ←
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                👤 Parent Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Sign Out
          </button>
        </div>

        <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || (tab.href !== '/parent' && pathname?.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-4 py-2 font-medium text-sm transition-colors border-b-2
                  ${isActive
                    ? 'border-[var(--ember-500)] text-[var(--ember-500)]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                `}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}



