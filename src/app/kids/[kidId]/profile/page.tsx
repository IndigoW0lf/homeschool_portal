import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { getKidSubjectCounts } from '@/lib/supabase/progressData';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { AvatarPreview } from '@/components/kids/AvatarPreview';
import { ProfilePicManager } from '@/components/kids/ProfilePicManager';
import { BadgeGallery } from '@/components/kids/BadgeGallery';
import { FamilyConnections } from '@/components/kids/FamilyConnections';

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
              photoUrl={kid.profilePhotoUrl}
              profilePicType={kid.profilePicType}
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
        
        <ProfilePicManager 
          kidId={kidId} 
          initialType={kid.profilePicType || 'avatar'}
          currentPhotoUrl={kid.profilePhotoUrl}
        />

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
