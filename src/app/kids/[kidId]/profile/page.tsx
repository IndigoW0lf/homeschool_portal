import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { getKidSubjectCounts } from '@/lib/supabase/progressData';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { BadgeGallery } from '@/components/kids/BadgeGallery';
import { FamilyConnections } from '@/components/kids/FamilyConnections';

import Link from 'next/link';
import { getKidSession } from '@/lib/kid-session';

interface ProfilePageProps {
  params: Promise<{
    kidId: string;
  }>;
}

export default async function KidProfilePage({ params }: ProfilePageProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);
  const subjectCounts = await getKidSubjectCounts(kidId);
  const session = await getKidSession();
  
  if (!kid) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
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
        
        {/* Avatar Builder - Coming Soon */}
        <div className="max-w-md mx-auto p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Avatar preview */}
            <AvatarPreview 
              avatarState={kid.avatarState}
              size="lg"
              fallbackName={kid.nickname || kid.name}
              fallbackColor={kid.favoriteColor}
            />
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                ✨ Avatar Builder
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Coming soon! We're working on an awesome avatar creator for you.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed">
                🚧 In Progress
              </div>
            </div>
          </div>
        </div>

        {/* Family Connections */}
        {kid.familyId && (
          <FamilyConnections 
            kidId={kidId} 
            familyId={kid.familyId} 
            isKidSession={!!session}
          />
        )}

        {/* Badge Gallery */}
        <BadgeGallery kidId={kidId} subjectCounts={subjectCounts} />
      </div>
    </div>
  );
}
