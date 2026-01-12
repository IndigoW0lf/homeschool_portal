import Link from 'next/link';
import { ArrowRight, Play } from '@phosphor-icons/react/dist/ssr';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--brand-deep)] pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-deep)] via-gray-900 to-[var(--brand-dark)]" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--brand-lilac)]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--brand-coral)]/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
          <span className="text-[var(--brand-coral)]">✨</span>
          <span className="text-sm text-gray-300">Made for homeschool families</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Your Magical
          <br />
          <span className="bg-gradient-to-r from-[var(--brand-lilac)] via-[#c4a7e7] to-[var(--brand-coral)] bg-clip-text text-transparent">
            Homeschool Companion
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10">
          Plan lessons. Track progress. Keep kids engaged with 
          moons, badges, and personalized learning portals.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-[var(--brand-lilac)] to-[var(--brand-coral)] text-white rounded-2xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-medium text-lg hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Play size={20} weight="fill" />
            See How It Works
          </a>
        </div>

        {/* Trust text */}
        <p className="mt-10 text-gray-500 text-sm">
          No credit card required • Free plan available
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-gray-500 text-sm">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1">
          <div className="w-1.5 h-3 bg-gray-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
