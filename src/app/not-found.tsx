import Link from 'next/link';
import { MapTrifold, House } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <MapTrifold size={100} weight="duotone" color="#caa2d8" className="mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Looks like you wandered off the learning path! 
          This magical realm doesn&apos;t exist... yet.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <House size={20} weight="bold" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
