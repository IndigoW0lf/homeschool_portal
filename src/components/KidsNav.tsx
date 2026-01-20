'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { House, GameController, UserCircle, Moon, Palette, List, X, Star, NotePencil, SignOut } from '@phosphor-icons/react';
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
      color: 'var(--sage-500)',
      exactMatch: true
    },
    { 
      href: `/kids/${kidId}/play`, 
      label: 'Play', 
      icon: GameController,
      color: 'var(--ember-500)',
      exactMatch: false
    },
    { 
      href: `/kids/${kidId}/profile`, 
      label: 'Me', 
      icon: Star,
      color: '#f59e0b', // amber
      exactMatch: false
    },
    // Avatar and Studio temporarily hidden - UV mapping work in progress
    // { 
    //   href: `/kids/${kidId}/avatar`, 
    //   label: 'Avatar', 
    //   icon: UserCircle,
    //   color: 'var(--lavender-500)',
    //   exactMatch: false
    // },
    { 
      href: `/kids/${kidId}/journal`, 
      label: 'Journal', 
      icon: NotePencil,
      color: '#ec4899', // pink
      exactMatch: false
    },
    { 
      href: `/kids/${kidId}/shop`, 
      label: 'Shop', 
      icon: Moon,
      color: '#8b5cf6', // purple
      exactMatch: false
    },
    // { 
    //   href: `/kids/${kidId}/studio`, 
    //   label: 'Studio', 
    //   icon: Palette,
    //   color: '#ec4899', // pink
    //   exactMatch: false
    // },
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Back to Dashboard"
            >
              ← 
            </Link>
            <Image 
              src={kidName.toLowerCase() === 'stella' ? '/assets/titles/hello_stella.svg' : '/assets/titles/hello_atlas.svg'}
              alt={`Hello, ${kidName}!`}
              width={150}
              height={40}
              className="h-8 w-auto dark:brightness-110"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={24} weight="bold" className="text-gray-600 dark:text-gray-300" />
              ) : (
                <List size={24} weight="bold" className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
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
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                    `}
                  >
                    <Icon 
                      size={24} 
                      weight={active ? 'fill' : 'duotone'} 
                      color={active ? tab.color : undefined}
                      className={active ? '' : 'text-gray-400 dark:text-gray-500'}
                    />
                    <span className={`font-medium ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
              
              {/* Mobile Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 text-red-500"
              >
                <SignOut size={24} weight="duotone" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col border-r border-gray-200 dark:border-gray-700 z-20 transition-colors bg-white dark:bg-gray-800"
        style={{ 
          '--kid-accent': kidFavoriteColor,
        } as React.CSSProperties}
      >
        {/* Color Tint Overlay */}
        {kidFavoriteColor && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30"
            style={{ backgroundColor: 'var(--kid-accent)' }}
          />
        )}
        {/* Top Section */}
        <div className="flex flex-col items-center py-6 border-b border-gray-100 dark:border-gray-700">
          <Link 
            href="/"
            className="mb-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-sm"
            aria-label="Back to Dashboard"
          >
            ←
          </Link>
          <BlockyAvatar 
            className="w-20 h-20 mb-2"
            size={80}
            skinColors={{
              skin: kidAvatarState?.colors?.skin,
              // We'll add support for full avatar state rendering (outfits) soon
            }}
          />
          <span className={`mt-2 text-xs font-medium text-center ${
            needsDarkText 
              ? 'text-gray-800 dark:text-gray-200' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {displayName}
          </span>
          {/* Moons Counter */}
          <div className="mt-3">
            <MoonsCounter kidId={kidId} size="sm" showLink />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col justify-between">
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
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                  `}
                  title={tab.label}
                >
                  <Icon 
                    size={28} 
                    weight={active ? 'fill' : 'duotone'} 
                    color={active ? tab.color : undefined}
                    className={active ? '' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
                  />
                  <span className={`text-[10px] mt-1 font-medium ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
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
               className="group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500"
               title="Sign Out"
             >
               <SignOut size={24} weight="duotone" />
             </button>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="py-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
          <DarkModeToggle />
        </div>
      </aside>
    </>
  );
}
