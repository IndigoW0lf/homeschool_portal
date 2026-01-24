import Link from 'next/link';
import { ArrowRight, Sparkle } from '@phosphor-icons/react/dist/ssr';

export function CTA() {
  return (
    <section className="py-24 bg-[var(--night-800)] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--nebula-purple)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[var(--cosmic-rust-500)]/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--ember-gold-400)]/5 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-ember mb-8 shadow-lg glow-gold">
          <Sparkle size={40} weight="fill" className="text-[var(--foreground)]" />
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
          Ready to make homeschooling magical?
        </h2>
        
        <p className="text-xl text-[var(--slate-300)] max-w-2xl mx-auto mb-10">
          Join families who&apos;ve discovered a better way to organize, track, 
          and enjoy their homeschool journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group px-8 py-4 bg-gradient-ember text-[var(--foreground)] rounded-2xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
          >
            Start Your Free Account
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="mt-6 text-[var(--slate-400)] text-sm">
          No credit card required • Set up in under 2 minutes
        </p>
      </div>
    </section>
  );
}
