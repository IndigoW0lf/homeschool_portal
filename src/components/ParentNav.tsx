'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { 
  House, 
  PlusCircle,
  Lightbulb, 
  FolderOpen, 
  SignOut,
  Sparkle,
  UserCircle,
  Gear,
  ChartLineUp,
  Moon,
  UsersThree
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { AvatarState } from '@/types';

interface KidSummary {
  id: string;
  name: string;
  nickname?: string;
  favorite_color?: string;
  avatar_state?: AvatarState | null;
  moons: number;
}

interface ParentNavProps {
  user: User;
  kids?: KidSummary[];
}

const navItems = [
  { href: '/parent', label: 'Overview', icon: House },
  { href: '/parent/lessons', label: 'Create Activity', icon: PlusCircle },
  { href: '/parent/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/parent/resources', label: 'Resources', icon: FolderOpen },
  { href: '/parent/progress', label: 'Progress', icon: ChartLineUp },
  { href: '/parent/profile', label: 'Profile', icon: UserCircle },
  { href: '/parent/settings', label: 'Settings', icon: Gear },
];

export function ParentNav({ kids = [] }: ParentNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/parent/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[var(--background-sidebar)] flex flex-col z-30 border-r border-[var(--border)]">
      {/* Logo / Header */}
      <div className="p-4 border-b border-[var(--night-600)]">
        <Link href="/home" className="flex items-center gap-2 text-[var(--foreground)] hover:opacity-80 transition-opacity">
          <div className="p-1.5 rounded-lg bg-gradient-ember">
            <Sparkle size={18} weight="fill" className="text-[var(--foreground)]" />
          </div>
          <span className="font-bold text-lg">Lunara Quest</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {/* Main Nav Items */}
        <div className="space-y-1">
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
                    ? "bg-[var(--celestial-500)]/20 text-[var(--celestial-400)] border-l-2 border-[var(--celestial-400)]" 
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--nebula-purple)]/20"
                )}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Kids Section */}
        {kids.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[var(--night-600)]">
            <div className="flex items-center gap-2 px-4 mb-3 text-[var(--slate-400)] text-xs font-semibold uppercase tracking-wider">
              <UsersThree size={16} />
              Kids
            </div>
            <div className="space-y-1">
              {kids.map(kid => {
                const isActive = pathname === `/parent/kids/${kid.id}`;
                const displayName = kid.nickname || kid.name;
                
                return (
                  <Link
                    key={kid.id}
                    href={`/parent/kids/${kid.id}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all",
                      isActive 
                        ? "bg-[var(--night-600)] text-[var(--foreground)]" 
                        : "text-[var(--foreground-muted)] dark:text-[var(--slate-300)] hover:text-[var(--foreground)] hover:bg-[var(--night-700)]"
                    )}
                  >
                    <AvatarPreview 
                      avatarState={kid.avatar_state}
                      size="xs"
                      fallbackName={displayName}
                      fallbackColor={kid.favorite_color}
                    />
                    <span className="flex-1 font-medium truncate">{displayName}</span>
                    <div className="flex items-center gap-1 text-[var(--ember-gold-400)] text-xs">
                      <Moon size={12} weight="fill" />
                      <span>{kid.moons}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--night-600)] space-y-2">
        <div className="flex items-center justify-between">
          <DarkModeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2 text-[var(--slate-400)] hover:text-[var(--foreground)] hover:bg-[var(--night-700)] rounded-lg transition-all"
        >
          <SignOut size={20} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
