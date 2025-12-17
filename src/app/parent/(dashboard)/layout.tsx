import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ParentNav } from '@/components/ParentNav';
import { LunaProvider, LunaPanel } from '@/components/luna';

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
    </LunaProvider>
  );
}
