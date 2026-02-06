import { createServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getKidSubjectCounts } from '@/lib/supabase/progressData';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { BadgeGallery } from '@/components/kids/BadgeGallery';
import { FamilyConnections } from '@/components/kids/FamilyConnections';
import { OpenPeepsAvatarBuilder } from '@/components/OpenPeepsAvatarBuilder';
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

  // Fetch unlocked avatar items
  const { data: unlockedItems } = await supabase
    .from('kid_avatar_items')
    .select('item_category, item_id')
    .eq('kid_id', kidId);

  const unlockedItemIds = (unlockedItems || []).map(
    (item: { item_category: string; item_id: string }) => 
      `${item.item_category}:${item.item_id}`
  );

  const subjectCounts = await getKidSubjectCounts(kidId);
  const displayName = kid.nickname || kid.name;

  // Prepare initial avatar state
  // Check if we have open_peeps_state, otherwise use default
  const initialAvatarState = (kid as any).open_peeps_avatar_state || {};

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
             {/* Use OpenPeepsBuilder in compact/preview mode if possible, 
                 or just let it be the editor since parent demanded 'exact same' */}
             {/* Actually, for header we usually want a small preview. 
                 But the layout above had AvatarPreview + Title.
                 I'll keep the Builder in the Main Content area as requested.
                 For the Header, I'll remove the AvatarPreview since the Builder is right below?
                 Or keep a static preview? 
                 The static preview used AvatarPreview which is Blocky.
                 I should probably not render a Blocky preview if they are using Open Peeps.
                 For now, I'll just remove the preview from header or replace it with a profile icon.
                 Actually, I'll just leave the text. 
             */}
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
        
        {/* Avatar Builder (Replaces "Coming Soon") */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] px-1">
             Avatar Customization
          </h3>
          <p className="text-sm text-muted px-1 mb-2">
            Customize {displayName}'s avatar including background color.
          </p>
          
          <OpenPeepsAvatarBuilder
            kidId={kidId}
            initialState={initialAvatarState}
            unlockedItems={unlockedItemIds}
            compact={false} // Use full view as requested
          />
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
