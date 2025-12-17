'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { 
  House, 
  BookOpen, 
  ClipboardText, 
  Lightbulb, 
  FolderOpen, 
  SignOut,
  Sparkle
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ParentNavProps {
  user: User;
}

const navItems = [
  { href: '/parent', label: 'Overview', icon: House },
  { href: '/parent/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/parent/assignments', label: 'Assignments', icon: ClipboardText },
  { href: '/parent/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/parent/resources', label: 'Resources', icon: FolderOpen },
];

export function ParentNav({ }: ParentNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/parent/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-gray-800 dark:bg-gray-900 flex flex-col z-30">
      {/* Logo / Header */}
      <div className="p-4 border-b border-gray-700">
        <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
          <Sparkle size={24} weight="duotone" className="text-[var(--fabric-lilac)]" />
          <span className="font-bold text-lg">Lunara Quest</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map(item => {
          const isActive = pathname === item.href || 
            (item.href !== '/parent' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all",
                isActive 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              )}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          <DarkModeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
        >
          <SignOut size={20} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
