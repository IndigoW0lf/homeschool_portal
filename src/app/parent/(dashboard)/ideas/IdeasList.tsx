'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Trash, CaretDown, CaretUp, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SavedIdea {
  id: string;
  title: string;
  content: string;
  user_message?: string;  // The parent's original question for context
  source_type: string;
  suggestion_data: Record<string, unknown> | null;
  created_at: string;
}

interface IdeasListProps {
  initialIdeas: SavedIdea[];
}

export function IdeasList({ initialIdeas }: IdeasListProps) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setIdeas(prev => prev.filter(idea => idea.id !== id));
      toast.success('Idea removed');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Could not delete idea');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (ideas.length === 0) {
    return (
      <div className="text-center py-16">
        <Lightbulb size={48} weight="duotone" className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
          No saved ideas yet
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          When Luna shares a thought you like, click &quot;Save to my ideas&quot; to keep it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ideas.map(idea => {
        const isExpanded = expandedId === idea.id;
        const isDeleting = deletingId === idea.id;
        
        return (
          <div 
            key={idea.id}
            className={cn(
              "bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all",
              isDeleting && "opacity-50"
            )}
          >
            {/* Header - always visible */}
            <div 
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : idea.id)}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--fabric-lilac)]/10 flex items-center justify-center">
                <Sparkle size={20} weight="duotone" className="text-[var(--fabric-lilac)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {idea.title}
                </h3>
                <p className="text-xs text-gray-400">
                  Saved {formatDate(idea.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idea.id);
                  }}
                  disabled={isDeleting}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete idea"
                >
                  <Trash size={18} />
                </button>
                {isExpanded ? (
                  <CaretUp size={18} className="text-gray-400" />
                ) : (
                  <CaretDown size={18} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                {/* Show the original question for context */}
                {idea.user_message && (
                  <div className="pt-4 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                      You asked
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{idea.user_message}"
                    </p>
                  </div>
                )}
                <div className="pt-2 prose prose-sm dark:prose-invert max-w-none">
                  {idea.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0 text-gray-700 dark:text-gray-300">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
