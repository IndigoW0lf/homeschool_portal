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
    <section id="pricing" className="py-24 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#E27D60] font-medium">PRICING</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        {/* Pricing card */}
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#9c8fb8]/20 to-[#E27D60]/20 blur-3xl" />
          
          <div className="relative bg-gray-800 rounded-3xl border border-gray-700 p-10 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              {/* Left: Price */}
              <div>
                <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white text-sm font-medium mb-4">
                  Early Access
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">Free</span>
                  <span className="text-gray-400">to start</span>
                </div>
                <p className="text-gray-400 mt-2">
                  Premium features coming soon
                </p>
              </div>

              {/* Right: CTA */}
              <Link
                href="/signup"
                className="group px-8 py-4 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-2xl font-semibold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Get Started
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Features */}
            <div className="mt-10 pt-10 border-t border-gray-700">
              <h4 className="font-medium text-white mb-6">Everything included:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check size={14} weight="bold" className="text-green-400" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
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
