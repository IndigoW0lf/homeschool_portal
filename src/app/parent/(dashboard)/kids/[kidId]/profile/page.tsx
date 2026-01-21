import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getKidSubjectCounts } from '@/lib/supabase/progressData';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { BadgeGallery } from '@/components/kids/BadgeGallery';
import { FamilyConnections } from '@/components/kids/FamilyConnections';
import Link from 'next/link';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';

interface Props {
  params: Promise<{ kidId: string }>;
}

export default async function ParentViewKidProfilePage({ params }: Props) {
  const { kidId } = await params;
  const supabase = await createServerClient();

  // Get the current user (parent)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/parent/login');

  // Get user's family
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (!familyMember) redirect('/parent');

  // Get kid data (make sure they're in the user's family)
  const { data: kid, error } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .eq('family_id', familyMember.family_id)
    .single();

  if (error || !kid) notFound();

  const subjectCounts = await getKidSubjectCounts(kidId);
  const displayName = kid.nickname || kid.name;

  return (
    <div className="min-h-screen">
      {/* Parent View Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-200 dark:border-blue-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                Parent View
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Viewing {displayName}'s profile as admin
              </p>
            </div>
            <Link
              href={`/kids/${kidId}/profile`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowSquareOut size={16} />
              Open Kid Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <AvatarPreview 
              avatarState={kid.avatar_state}
              size="lg"
              fallbackName={displayName}
              fallbackColor={kid.favorite_color}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayName}'s Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage profile information and settings
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
              avatarState={kid.avatar_state}
              size="lg"
              fallbackName={displayName}
              fallbackColor={kid.favorite_color}
            />
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                ✨ Avatar Builder
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Coming soon! We're working on an awesome avatar creator.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed">
                🚧 In Progress
              </div>
            </div>
          </div>
        </div>

        {/* Family Connections */}
        {kid.family_id && (
          <FamilyConnections 
            kidId={kidId} 
            familyId={kid.family_id} 
            isKidSession={false}
          />
        )}

        {/* Badge Gallery */}
        <BadgeGallery kidId={kidId} subjectCounts={subjectCounts} />
      </div>
    </div>
  );
}
