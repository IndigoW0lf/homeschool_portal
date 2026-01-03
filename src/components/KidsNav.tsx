'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { House, GameController, UserCircle, Moon, Palette, List, X, Star, NotePencil } from '@phosphor-icons/react';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use nickname if available, otherwise formal name
  const displayName = kidNickname || kidName;
  
  // Use kid's favorite color for active indicators, fallback to tab's default color
  const getActiveColor = (tabColor: string) => kidFavoriteColor || tabColor;

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
    { 
      href: `/kids/${kidId}/avatar`, 
      label: 'Avatar', 
      icon: UserCircle,
      color: 'var(--lavender-500)',
      exactMatch: false
    },
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
    { 
      href: `/kids/${kidId}/studio`, 
      label: 'Studio', 
      icon: Palette,
      color: '#ec4899', // pink
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
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col border-r border-gray-200 dark:border-gray-700 z-20 transition-colors"
        style={{ 
          backgroundColor: kidFavoriteColor 
            ? `color-mix(in srgb, ${kidFavoriteColor} 15%, var(--sidebar-bg, white))` 
            : undefined,
          '--sidebar-bg': 'white',
          '--kid-accent': kidFavoriteColor,
        } as React.CSSProperties}
      >
        {/* Top Section */}
        <div className="flex flex-col items-center py-6 border-b border-gray-100 dark:border-gray-700">
          <Link 
            href="/"
            className="mb-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-sm"
            aria-label="Back to Dashboard"
          >
            ←
          </Link>
          <AvatarPreview 
            avatarState={kidAvatarState}
            size="sm"
            fallbackName={displayName}
            fallbackColor={kidFavoriteColor}
          />
          <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
            {displayName}
          </span>
          {/* Moons Counter */}
          <div className="mt-3">
            <MoonsCounter kidId={kidId} size="sm" showLink />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
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
        </nav>

        {/* Bottom Section */}
        <div className="py-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
          <DarkModeToggle />
        </div>
      </aside>
    </>
  );
}
