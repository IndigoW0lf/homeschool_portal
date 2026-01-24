'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { House, GameController, Moon, List, X, Star, NotePencil, SignOut } from '@phosphor-icons/react';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { BlockyAvatar } from '@/components/BlockyAvatar';
import { MoonsCounter } from '@/components/kids/MoonsCounter';
import { useState } from 'react';
import { AvatarState } from '@/types';

interface KidsNavProps {
  kidId: string;
  kidName: string;
  kidNickname?: string;
  kidFavoriteColor?: string;
  kidAvatarState?: AvatarState | null;
}

export function KidsNav({ kidId, kidName, kidNickname, kidFavoriteColor, kidAvatarState }: KidsNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use nickname if available, otherwise formal name
  const displayName = kidNickname || kidName;
  
  // Detect if we need dark text for light background colors
  const needsDarkText = (() => {
    if (!kidFavoriteColor) return false;
    // Parse hex color and calculate luminance
    const hex = kidFavoriteColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 0.6; // Light colors need dark text
  })();
  
  // Use kid's favorite color for active indicators, fallback to tab's default color
  const getActiveColor = (tabColor: string) => kidFavoriteColor || tabColor;

  const handleLogout = async () => {
    try {
      await fetch('/api/kid-auth/logout', { method: 'POST' });
      router.push('/student');
      router.refresh();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const tabs = [
    { 
      href: `/kids/${kidId}`, 
      label: 'Home', 
      icon: House,
      color: 'var(--celestial-400)',
      exactMatch: true
    },
    { 
      href: `/kids/${kidId}/play`, 
      label: 'Play', 
      icon: GameController,
      color: 'var(--ember-400)',
      exactMatch: false
    },
    { 
      href: `/kids/${kidId}/profile`, 
      label: 'Me', 
      icon: Star,
      color: 'var(--solar-400)',
      exactMatch: false
    },
    { 
      href: `/kids/${kidId}/journal`, 
      label: 'Journal', 
      icon: NotePencil,
      color: 'var(--nebula-pink)',
      exactMatch: false
    },
    { 
      href: `/kids/${kidId}/shop`, 
      label: 'Shop', 
      icon: Moon,
      color: 'var(--nebula-purple)',
      exactMatch: false
    },
  ];

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exactMatch) {
      return pathname === tab.href;
    }
    return pathname?.startsWith(tab.href);
  };

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--night-800)] shadow-lg border-b border-[var(--night-600)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-[var(--slate-400)] hover:text-[var(--foreground)]"
              aria-label="Back to Dashboard"
            >
              ← 
            </Link>
            <span className="heading-md text-[var(--foreground)]">
              Hello, {kidName}!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-[var(--night-700)] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={24} weight="bold" className="text-[var(--slate-300)]" />
              ) : (
                <List size={24} weight="bold" className="text-[var(--slate-300)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 bg-[var(--night-800)] border-t border-[var(--night-600)]">
            <div className="flex flex-col gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = isActive(tab);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${active
                        ? 'bg-[var(--night-700)]'
                        : 'hover:bg-[var(--night-700)]/50'}
                    `}
                  >
                    <Icon 
                      size={24} 
                      weight={active ? 'fill' : 'duotone'} 
                      color={active ? tab.color : undefined}
                      className={active ? '' : 'text-[var(--slate-400)]'}
                    />
                    <span className={`font-medium ${active ? 'text-[var(--foreground)]' : 'text-[var(--slate-300)]'}`}>
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
              
              {/* Mobile Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-[var(--error)]/10 text-[var(--error)]"
              >
                <SignOut size={24} weight="duotone" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar - Kid's color is more prominent */}
      <aside 
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col border-r z-20 transition-colors"
        style={{ 
          '--kid-accent': kidFavoriteColor,
          backgroundColor: kidFavoriteColor 
            ? `color-mix(in srgb, ${kidFavoriteColor} 20%, var(--night-800) 80%)` 
            : 'var(--night-800)',
          borderColor: kidFavoriteColor 
            ? `color-mix(in srgb, ${kidFavoriteColor} 30%, var(--night-600) 70%)`
            : 'var(--night-600)',
        } as React.CSSProperties}
      >
        {/* Gradient overlay using kid's color */}
        {kidFavoriteColor && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              background: `linear-gradient(180deg, 
                color-mix(in srgb, ${kidFavoriteColor} 30%, transparent 70%) 0%, 
                transparent 50%,
                color-mix(in srgb, ${kidFavoriteColor} 15%, transparent 85%) 100%
              )` 
            }}
          />
        )}
        {/* Top Section */}
        <div className="flex flex-col items-center py-6 border-b border-[var(--night-600)] relative z-10">
          <Link 
            href="/"
            className="mb-4 text-[var(--slate-400)] hover:text-[var(--foreground)] text-sm"
            aria-label="Back to Dashboard"
          >
            ←
          </Link>
          <BlockyAvatar 
            className="w-20 h-20 mb-2"
            size={80}
            skinColors={{
              skin: kidAvatarState?.colors?.skin,
            }}
          />
          <span className={`mt-2 text-xs font-medium text-center ${
            needsDarkText 
              ? 'text-[var(--slate-200)]' 
              : 'text-[var(--slate-300)]'
          }`}>
            {displayName}
          </span>
          {/* Moons Counter */}
          <div className="mt-3">
            <MoonsCounter kidId={kidId} size="sm" showLink />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col justify-between relative z-10">
          <div className="flex flex-col items-center gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = isActive(tab);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all
                    ${active
                      ? 'bg-[var(--night-700)]'
                      : 'hover:bg-[var(--night-700)]/50'}
                  `}
                  title={tab.label}
                >
                  <Icon 
                    size={28} 
                    weight={active ? 'fill' : 'duotone'} 
                    color={active ? tab.color : undefined}
                    className={active ? '' : 'text-[var(--slate-400)] group-hover:text-[var(--slate-200)]'}
                  />
                  <span className={`text-[10px] mt-1 font-medium ${active ? 'text-[var(--foreground)]' : 'text-[var(--slate-400)]'}`}>
                    {tab.label}
                  </span>
                  {active && (
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                      style={{ backgroundColor: getActiveColor(tab.color) }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Logout - Bottom of Nav area, above Toggle */}
          <div className="flex flex-col items-center mt-auto mb-2">
             <button
               onClick={handleLogout}
               className="group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all hover:bg-[var(--error)]/10 text-[var(--slate-400)] hover:text-[var(--error)]"
               title="Sign Out"
             >
               <SignOut size={24} weight="duotone" />
             </button>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="py-4 border-t border-[var(--night-600)] flex justify-center relative z-10">
          <DarkModeToggle />
        </div>
      </aside>
    </>
  );
}
