import Link from 'next/link';
import { ArrowRight, Play } from '@phosphor-icons/react/dist/ssr';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cosmic pt-20">
      {/* Background with starfield */}
      <div className="absolute inset-0 bg-nebula-glow bg-starfield" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--nebula-purple)]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--cosmic-rust-500)]/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Additional golden accent orb */}
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-[var(--ember-gold-400)]/10 rounded-full blur-3xl animate-pulse delay-500" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--background-elevated)]/10 backdrop-blur-sm border border-white/10 mb-8">
          <span className="text-[var(--ember-gold-400)]">✨</span>
          <span className="text-sm text-[var(--slate-300)]">Made for homeschool families</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-[var(--foreground)] mb-6 leading-tight">
          Your Magical
          <br />
          <span className="bg-gradient-to-r from-[var(--nebula-purple)] via-[var(--nebula-purple-light)] to-[var(--cosmic-rust-400)] bg-clip-text text-transparent">
            Homeschool Companion
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-[var(--slate-300)] max-w-2xl mx-auto mb-10">
          Plan lessons. Track progress. Keep kids engaged with 
          moons, badges, and personalized learning portals.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group px-8 py-4 bg-gradient-ember text-[var(--foreground)] rounded-2xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
          >
            Get Started Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 glass-panel text-[var(--foreground)] rounded-2xl font-medium text-lg hover:bg-[var(--background-elevated)]/20 transition-all flex items-center gap-2"
          >
            <Play size={20} weight="fill" />
            See How It Works
          </a>
        </div>

        {/* Trust text */}
        <p className="mt-10 text-[var(--slate-400)] text-sm">
          No credit card required • Free plan available
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[var(--slate-400)] text-sm">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-[var(--night-600)] flex items-start justify-center p-1">
          <div className="w-1.5 h-3 bg-[var(--slate-400)] rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
