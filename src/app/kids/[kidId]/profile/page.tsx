import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { Star } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

interface ProfilePageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function KidProfilePage({ params }: ProfilePageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);
  
  if (!kid) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--ember-400)] to-[var(--ember-600)] text-white">
              <Star size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Tell us about yourself, {kid.nickname || kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <KidProfileEditor kidId={kidId} initialData={kid} />
        
        {/* Link to Avatar Builder */}
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
            ✨ Customize Your Avatar
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Dress up your character with cool outfits and accessories!
          </p>
          <Link 
            href={`/kids/${kidId}/avatar`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            Go to Avatar Builder
          </Link>
        </div>
      </div>
    </div>
  );
}
