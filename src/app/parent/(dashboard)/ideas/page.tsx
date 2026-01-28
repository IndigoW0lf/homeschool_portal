import { createServerClient } from '@/lib/supabase/server';
import { IdeasList } from './IdeasList';

export default async function IdeasPage() {
  const supabase = await createServerClient();
  
  const { data: ideas, error } = await supabase
    .from('saved_ideas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading ideas:', error);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Saved Ideas
        </h1>
        <p className="text-muted mt-1">
          Suggestions from Luna that you&apos;ve saved for later
        </p>
      </div>

      <IdeasList initialIdeas={ideas || []} />
    </div>
  );
}
