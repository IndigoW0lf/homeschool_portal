import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { KidsNav } from '@/components/KidsNav';
import { createServerClient } from '@/lib/supabase/server';

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
  const { data: kidWithPin } = await supabase
    .from('kids')
    .select('pin_hash')
    .eq('id', kidId)
    .single();

  // If kid has a PIN set, check for trusted device cookie
  if (kidWithPin?.pin_hash) {
    const cookieStore = await cookies();
    const trustCookie = cookieStore.get(`kid_trust_${kidId}`);
    
    if (!trustCookie?.value) {
      // Redirect to unlock page
      redirect(`/unlock/${kidId}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <KidsNav kidId={kidId} kidName={kid.name} />
      
      {/* Main content area - offset for sidebar on desktop, header on mobile */}
      <main className="pt-16 lg:pt-0 lg:pl-20">
        {children}
      </main>
    </div>
  );
}
