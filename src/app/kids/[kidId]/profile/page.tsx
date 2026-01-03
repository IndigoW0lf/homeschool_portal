import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { getKidSubjectCounts } from '@/lib/supabase/progressData';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { BadgeGallery } from '@/components/kids/BadgeGallery';
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
  const subjectCounts = await getKidSubjectCounts(kidId);
  
  if (!kid) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <AvatarPreview 
              avatarState={kid.avatarState}
              size="lg"
              fallbackName={kid.nickname || kid.name}
              fallbackColor={kid.favoriteColor}
            />
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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        <KidProfileEditor kidId={kidId} initialData={kid} />
        
        {/* Link to Avatar Builder */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4">
            {/* Mini avatar preview */}
            <AvatarPreview 
              avatarState={kid.avatarState}
              size="md"
              fallbackName={kid.nickname || kid.name}
              fallbackColor={kid.favoriteColor}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                ✨ Customize Your Avatar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dress up your character with cool outfits and accessories!
              </p>
            </div>
            <Link 
              href={`/kids/${kidId}/avatar`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              Go →
            </Link>
          </div>
        </div>

        {/* Badge Gallery */}
        <BadgeGallery kidId={kidId} subjectCounts={subjectCounts} />
      </div>
    </div>
  );
}
