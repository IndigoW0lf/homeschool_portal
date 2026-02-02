import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { getKidSubjectCounts } from '@/lib/supabase/progressData';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { BadgeGallery } from '@/components/kids/BadgeGallery';
import { FamilyConnections } from '@/components/kids/FamilyConnections';
import { OpenPeepsAvatarBuilder } from '@/components/OpenPeepsAvatarBuilder';

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
      <div className="bg-[var(--background-elevated)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <AvatarPreview 
              avatarState={kid.avatarState}
              size="lg"
              fallbackName={kid.nickname || kid.name}
              fallbackColor={kid.favoriteColor}
            />
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                My Profile
              </h1>
              <p className="text-muted">
                Tell us about yourself, {kid.nickname || kid.name}!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        <KidProfileEditor kidId={kidId} initialData={kid} />
        
        {/* Avatar Builder */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-[var(--foreground)]">
              ✨ Customize Your Avatar
            </h3>
            <p className="text-sm text-muted">
              Mix and match to create your own unique look!
            </p>
          </div>
          <OpenPeepsAvatarBuilder kidId={kidId} />
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
