import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { ParentNav } from '@/components/ParentNav';
import { LunaProvider, LunaPanel } from '@/components/luna';
import { ParentOnboardingWrapper } from '@/components/onboarding/ParentOnboardingWrapper';
import { WelcomeSetupModal } from '@/components/onboarding/WelcomeSetupModal';
import { AvatarState } from '@/types';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  // Check if user has seen the tutorial
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_seen_tutorial')
    .eq('id', user.id)
    .single();

  const hasSeenTutorial = profile?.has_seen_tutorial ?? false;

  // Get user's family info
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id, family:families(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any  
  const familyName = (familyMember?.family as any)?.name || 'the family';
  const familyId = familyMember?.family_id;

  // Fetch kids for the sidebar
  let kids: { id: string; name: string; nickname?: string; favorite_color?: string; avatar_state?: AvatarState | null }[] = [];
  if (familyId) {
    const { data: kidsData } = await supabase
      .from('kids')
      .select('id, name, nickname, favorite_color, avatar_state')
      .eq('family_id', familyId)
      .order('name');
    kids = kidsData || [];
  }

  // Fetch moons for each kid
  const kidIds = kids.map(k => k.id);
  let moonsMap: Record<string, number> = {};
  if (kidIds.length > 0) {
    const { data: progressData } = await supabase
      .from('student_progress')
      .select('kid_id, total_stars')
      .in('kid_id', kidIds);
    
    moonsMap = (progressData || []).reduce((acc, p) => {
      acc[p.kid_id] = p.total_stars || 0;
      return acc;
    }, {} as Record<string, number>);
  }

  // Combine kids with their moons
  const kidsWithMoons = kids.map(k => ({
    ...k,
    moons: moonsMap[k.id] || 0,
  }));

  return (
    <LunaProvider>
      <div className="min-h-screen bg-magical">
        <ParentNav user={user} kids={kidsWithMoons} />
        {/* Main content with left margin to account for sidebar */}
        <main className="ml-56 min-h-screen">
          {children}
        </main>
      </div>
      <LunaPanel />
      <Suspense fallback={null}>
        <ParentOnboardingWrapper userId={user.id} hasSeenTutorial={hasSeenTutorial} />
        <WelcomeSetupModal userId={user.id} familyName={familyName} />
      </Suspense>
    </LunaProvider>
  );
}

