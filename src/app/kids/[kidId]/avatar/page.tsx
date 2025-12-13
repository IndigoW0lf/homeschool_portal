import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKidById } from '@/lib/content';
import { getAvatarAssets } from '@/lib/content';
import { AvatarBuilder } from '@/components/AvatarBuilder';

interface AvatarPageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function AvatarPage({ params }: AvatarPageProps) {
  const { kidId } = await params;
  const kid = getKidById(kidId);
  
  if (!kid) {
    notFound();
  }

  const assets = getAvatarAssets();

  return (
    <div className="min-h-screen bg-[var(--paper-50)]">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href={`/kids/${kidId}`}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Back to Portal"
              >
                ← 
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                  Avatar Builder
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Customize your avatar, {kid.name}!</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <AvatarBuilder kidId={kidId} assets={assets} />
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center">
        <Link 
          href={`/kids/${kidId}`}
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ← Back to Portal
        </Link>
      </footer>
    </div>
  );
}

