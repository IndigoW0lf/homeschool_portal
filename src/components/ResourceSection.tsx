import { Resources, ResourceCategory } from '@/types';
import { BookOpen, PuzzlePiece, PencilLine, Palette } from '@phosphor-icons/react/dist/ssr';
import { ReactNode } from 'react';

interface ResourceSectionProps {
  resources: Resources;
}

const categoryIcons: Record<ResourceCategory, ReactNode> = {
  reading: <BookOpen size={20} weight="duotone" className="text-[var(--fabric-sky)]" />,
  logic: <PuzzlePiece size={20} weight="duotone" className="text-[var(--fabric-lilac)]" />,
  writing: <PencilLine size={20} weight="duotone" className="text-[var(--fabric-mint)]" />,
  projects: <Palette size={20} weight="duotone" className="text-[var(--fabric-peach)]" />,
};

const categoryLabels: Record<ResourceCategory, string> = {
  reading: 'Reading',
  logic: 'Logic & Math',
  writing: 'Writing',
  projects: 'Projects',
};

export function ResourceSection({ resources }: ResourceSectionProps) {
  const categories: ResourceCategory[] = ['reading', 'logic', 'writing', 'projects'];

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category} className="bg-[var(--background-elevated)] rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-heading dark:text-[var(--foreground)] mb-3 flex items-center gap-2">
            <span>{categoryIcons[category]}</span>
            {categoryLabels[category]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {resources[category].map((resource, i) => (
              <a
                key={i}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-[var(--background-secondary)] rounded-lg text-sm text-heading dark:text-heading hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)] transition-colors"
              >
                {resource.label}
                <span className="text-muted">↗</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
