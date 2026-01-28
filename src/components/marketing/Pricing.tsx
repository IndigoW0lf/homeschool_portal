import Link from 'next/link';
import { Check, ArrowRight } from '@phosphor-icons/react/dist/ssr';

const features = [
  'Unlimited lessons & assignments',
  'Up to 5 kids per family',
  'Kid portals with rewards',
  'Progress tracking & insights',
  'Luna AI assistant',
  'Family collaboration',
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-[var(--night-900)] to-[var(--night-800)]">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--cosmic-rust-400)] font-medium">PRICING</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mt-3 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-[var(--slate-300)]">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        {/* Pricing card */}
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--nebula-purple)]/20 to-[var(--cosmic-rust-500)]/20 blur-3xl" />
          
          <div className="relative bg-[var(--night-700)] rounded-3xl border border-[var(--night-600)] p-10 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              {/* Left: Price */}
              <div>
                <div className="inline-block px-4 py-1 rounded-full bg-gradient-ember text-[var(--foreground)] text-sm font-medium mb-4">
                  Early Access
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[var(--foreground)]">Free</span>
                  <span className="text-[var(--slate-300)]">to start</span>
                </div>
                <p className="text-[var(--slate-400)] mt-2">
                  Premium features coming soon
                </p>
              </div>

              {/* Right: CTA */}
              <Link
                href="/signup"
                className="group px-8 py-4 bg-gradient-ember text-[var(--foreground)] rounded-2xl font-semibold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg"
              >
                Get Started
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Features */}
            <div className="mt-10 pt-10 border-t border-[var(--night-600)]">
              <h4 className="font-medium text-[var(--foreground)] mb-6">Everything included:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                      <Check size={14} weight="bold" className="text-[var(--success)]" />
                    </div>
                    <span className="text-[var(--slate-200)]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
