import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { ParentNav } from '@/components/ParentNav';
import { LunaProvider, LunaPanel } from '@/components/luna';
import { ParentOnboardingWrapper } from '@/components/onboarding/ParentOnboardingWrapper';

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

  return (
    <LunaProvider>
      <div className="min-h-screen bg-[var(--paper-50)] dark:bg-gray-900">
        <ParentNav user={user} />
        {/* Main content with left margin to account for sidebar */}
        <main className="ml-56 min-h-screen">
          {children}
        </main>
      </div>
      <LunaPanel />
      <Suspense fallback={null}>
        <ParentOnboardingWrapper userId={user.id} hasSeenTutorial={hasSeenTutorial} />
      </Suspense>
    </LunaProvider>
  );
}
