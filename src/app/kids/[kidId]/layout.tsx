import { notFound } from 'next/navigation';
import { getKidByIdFromDB } from '@/lib/supabase/data';
import { KidsNav } from '@/components/KidsNav';

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
