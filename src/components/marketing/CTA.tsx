import Link from 'next/link';
import { ArrowRight, Sparkle } from '@phosphor-icons/react/dist/ssr';

export function CTA() {
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#9c8fb8]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#E27D60]/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9c8fb8] to-[#E27D60] mb-8">
          <Sparkle size={40} weight="fill" className="text-white" />
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to make homeschooling magical?
        </h2>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Join families who've discovered a better way to organize, track, 
          and enjoy their homeschool journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-[#9c8fb8] to-[#E27D60] text-white rounded-2xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2"
          >
            Start Your Free Account
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="mt-6 text-gray-500 text-sm">
          No credit card required • Set up in under 2 minutes
        </p>
      </div>
    </section>
  );
}
