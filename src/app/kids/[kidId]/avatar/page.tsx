import { notFound } from 'next/navigation';
import { getKidById, getAvatarAssets } from '@/lib/content';
import { AvatarBuilder } from '@/components/AvatarBuilder';
import { UserCircle } from '@phosphor-icons/react/dist/ssr';

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
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--lavender-400)] to-[var(--lavender-600)] text-white">
              <UserCircle size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Avatar Builder
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Customize your avatar, {kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <AvatarBuilder kidId={kidId} assets={assets} />
      </div>
    </div>
  );
}







