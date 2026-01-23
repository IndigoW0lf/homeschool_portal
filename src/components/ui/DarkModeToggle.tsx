'use client';

import { useEffect, useState } from 'react';
import { MoonStars, Sun } from '@phosphor-icons/react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)] transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={28} weight="duotone" color="#e7b58d" />
      ) : (
        <MoonStars size={28} weight="duotone" color="#caa2d8" />
      )}
    </button>
  );
}
