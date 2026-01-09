import { createServerClient } from '@/lib/supabase/server';
import { getKidsFromDB } from '@/lib/supabase/data';
import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';

export default async function ReportsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent/login');
  }

  const kids = await getKidsFromDB();

  return (
    <ReportsClient kids={kids.map(k => ({ id: k.id, name: k.name }))} />
  );
}
