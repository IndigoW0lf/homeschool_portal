import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ParentNav } from '@/components/ParentNav';

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
    <div className="min-h-screen bg-[var(--paper-50)]">
      <ParentNav user={user} />
      {children}
    </div>
  );
}


