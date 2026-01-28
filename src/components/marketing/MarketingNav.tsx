import Link from 'next/link';
import { Sparkle } from '@phosphor-icons/react/dist/ssr';

export function MarketingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--night-800)]/80 backdrop-blur-lg border-b border-[var(--night-600)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-ember group-hover:scale-105 transition-transform">
            <Sparkle size={24} weight="fill" className="text-[var(--foreground)]" />
          </div>
          <span className="text-xl font-bold text-[var(--foreground)]">Lunara Quest</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[var(--slate-300)] hover:text-[var(--foreground)] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-[var(--slate-300)] hover:text-[var(--foreground)] transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-[var(--slate-300)] hover:text-[var(--foreground)] transition-colors">
            Pricing
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link 
            href="/parent/login"
            className="text-[var(--slate-300)] hover:text-[var(--foreground)] transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-gradient-ember text-[var(--foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
