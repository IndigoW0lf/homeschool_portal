'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';

interface ParentNavProps {
  user: User;
}

export function ParentNav({ }: ParentNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/parent/login');
    router.refresh();
  };

  const tabs = [
    { href: '/parent', label: 'Overview', svg: '/assets/titles/overview.svg' },
    { href: '/parent/lessons', label: 'Lessons', svg: '/assets/titles/lessons.svg' },
    { href: '/parent/assignments', label: 'Assignments', svg: '/assets/titles/assignments.svg' },
    { href: '/parent/resources', label: 'Resources', svg: '/assets/titles/resources.svg' },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted hover:text-gray-600 dark:hover:text-gray-300"
            >
              ←
            </Link>
            <Image 
              src="/assets/titles/parent_dashboard.svg" 
              alt="Parent Dashboard" 
              width={280} 
              height={50}
              className="h-10 w-auto dark:brightness-110"
            />
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <button
              onClick={handleSignOut}
              className="btn-ghost text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        <nav className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => {
            const isActive = pathname === tab.href || (tab.href !== '/parent' && pathname?.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-4 py-2 transition-all border-b-2
                  ${isActive
                    ? 'border-[var(--ember-500)]'
                    : 'border-transparent opacity-60 hover:opacity-100'}
                `}
              >
                <Image 
                  src={tab.svg} 
                  alt={tab.label} 
                  width={100} 
                  height={25}
                  className="h-5 w-auto dark:brightness-110"
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
