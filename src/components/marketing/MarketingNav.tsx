import Link from 'next/link';
import { Sparkle } from '@phosphor-icons/react/dist/ssr';

export function MarketingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#9c8fb8] to-[#E27D60] group-hover:scale-105 transition-transform">
            <Sparkle size={24} weight="fill" className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Lunara Quest</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
            Pricing
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link 
            href="/parent/login"
            className="text-gray-300 hover:text-white transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
