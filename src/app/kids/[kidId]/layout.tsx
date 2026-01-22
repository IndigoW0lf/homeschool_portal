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
      className="min-h-screen bg-magical"
      style={kid.favoriteColor ? { '--kid-accent': kid.favoriteColor } as React.CSSProperties : undefined}
    >
      {/* Stars background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white/60 dark:bg-white rounded-full animate-pulse" />
        <div className="absolute top-20 right-20 w-1 h-1 bg-white/60 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
        <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-white/60 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-20 right-1/4 w-2 h-2 bg-white/60 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-40 left-20 w-1 h-1 bg-white/60 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/60 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.7s' }} />
      </div>

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

