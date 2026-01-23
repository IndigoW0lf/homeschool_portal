import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { KidsNav } from '@/components/KidsNav';
import { createServerClient } from '@/lib/supabase/server';
import { KidOnboardingWrapper } from '@/components/onboarding/KidOnboardingWrapper';

interface KidsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    kidId: string;
  }>;
}

export default async function KidsLayout({ children, params }: KidsLayoutProps) {
  const { kidId } = await params;
  const kid = await getKidByIdFromDB(kidId);

  if (!kid) {
    notFound();
  }

  // Check if PIN is required for this kid
  const supabase = await createServerClient();
  const { data: kidWithDetails } = await supabase
    .from('kids')
    .select('pin_hash, has_seen_tutorial')
    .eq('id', kidId)
    .single();

  // If kid has a REAL PIN set (bcrypt hashes start with $2), check for trusted device cookie
  // Placeholder hashes like "-fffaaaa" mean PIN is disabled
  const hasRealPin = kidWithDetails?.pin_hash && kidWithDetails.pin_hash.startsWith('$2');
  
  if (hasRealPin) {
    const cookieStore = await cookies();
    const trustCookie = cookieStore.get(`kid_trust_${kidId}`);
    
    if (!trustCookie?.value) {
      // Redirect to unlock page
      redirect(`/unlock/${kidId}`);
    }
  }

  const hasSeenTutorial = kidWithDetails?.has_seen_tutorial ?? false;

  return (
    <div 
      className="min-h-screen bg-cosmic bg-starfield"
      style={kid.favoriteColor ? { '--kid-accent': kid.favoriteColor } as React.CSSProperties : undefined}
    >
      <KidsNav 
        kidId={kidId} 
        kidName={kid.name}
        kidNickname={kid.nickname}
        kidFavoriteColor={kid.favoriteColor}
        kidAvatarState={kid.avatarState}
      />
      
      {/* Main content area - offset for sidebar on desktop, header on mobile */}
      <main className="pt-16 lg:pt-0 lg:pl-20">
        {children}
      </main>

      {/* Kid onboarding tutorial */}
      <KidOnboardingWrapper 
        kidId={kidId} 
        kidName={kid.nickname || kid.name} 
        hasSeenTutorial={hasSeenTutorial} 
      />
    </div>
  );
}

