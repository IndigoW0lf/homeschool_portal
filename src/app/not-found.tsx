import Link from 'next/link';
import { MapTrifold, House } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cosmic bg-starfield flex items-center justify-center p-4">
      <div className="text-center max-w-md relative z-10">
        <MapTrifold size={100} weight="duotone" className="mx-auto mb-6 text-[var(--nebula-purple)]" />
        
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Page Not Found
        </h1>
        <p className="text-[var(--slate-300)] mb-6">
          Looks like you wandered off the learning path! 
          This magical realm doesn&apos;t exist... yet.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-ember text-[var(--foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          <House size={20} weight="bold" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
