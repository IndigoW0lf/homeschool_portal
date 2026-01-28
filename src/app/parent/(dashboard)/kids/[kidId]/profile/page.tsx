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
      <div className="bg-gradient-to-r from-[var(--celestial-500)]/10 to-[var(--nebula-purple)]/10 border-b border-[var(--celestial-200)] dark:border-[var(--celestial-800)]/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-[var(--celestial-500)] text-[var(--foreground)] text-sm font-semibold rounded-full">
                Parent View
              </div>
              <p className="text-sm text-muted">
                Viewing {displayName}'s profile as admin
              </p>
            </div>
            <Link
              href={`/kids/${kidId}/profile`}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--background-elevated)] border border-[var(--border)] dark:border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--hover-overlay)] transition-colors"
            >
              <ArrowSquareOut size={16} />
              Open Kid Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-[var(--background-elevated)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <AvatarPreview 
              avatarState={kid.avatar_state}
              size="lg"
              fallbackName={displayName}
              fallbackColor={kid.favorite_color}
            />
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {displayName}'s Profile
              </h1>
              <p className="text-muted">
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
        <div className="max-w-md mx-auto p-6 rounded-xl bg-gradient-to-r from-[var(--nebula-purple)]/10 to-[var(--nebula-pink)]/10 border border-[var(--nebula-purple)]/30 dark:border-[var(--nebula-purple)]">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Avatar preview */}
            <AvatarPreview 
              avatarState={kid.avatar_state}
              size="lg"
              fallbackName={displayName}
              fallbackColor={kid.favorite_color}
            />
            <div>
              <h3 className="font-semibold text-lg text-[var(--foreground)] mb-1">
                ✨ Avatar Builder
              </h3>
              <p className="text-sm text-muted mb-3">
                Coming soon! We're working on an awesome avatar creator.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--moon-200)] dark:bg-[var(--background-secondary)] text-muted rounded-lg font-medium cursor-not-allowed">
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
