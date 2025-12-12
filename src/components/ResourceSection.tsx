import { Resources, ResourceCategory } from '@/types';

interface ResourceSectionProps {
  resources: Resources;
}

const categoryIcons: Record<ResourceCategory, string> = {
  reading: '📖',
  logic: '🧩',
  writing: '✍️',
  projects: '🎨',
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
        <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
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
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {resource.label}
                <span className="text-gray-400 dark:text-gray-500">↗</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
