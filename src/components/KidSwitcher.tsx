import Link from 'next/link';
import { Kid } from '@/types';

interface KidSwitcherProps {
  kids: Kid[];
}

const gradeBandColors: Record<string, string> = {
  '3-5': 'from-[var(--herbal-400)] to-[var(--celestial-400)]',
  '6-8': 'from-[var(--celestial-400)] to-[var(--nebula-purple)]',
  default: 'from-[var(--nebula-purple)] to-[var(--nebula-pink)]',
};

export function KidSwitcher({ kids }: KidSwitcherProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kids.map(kid => (
        <Link
          key={kid.id}
          href={`/kids/${kid.id}`}
          className={`
            relative overflow-hidden rounded-xl p-6 
            bg-gradient-to-br ${gradeBandColors[kid.gradeBand] || gradeBandColors.default}
            text-[var(--foreground)] shadow-lg hover:shadow-xl transition-shadow
            flex flex-col items-center justify-center h-[80px]
          `}
        >
          <h3 className="text-xl font-bold">{kid.name}</h3>
          <p className="text-sm opacity-80">
            {kid.grades && kid.grades.length > 0 
              ? `Grades ${kid.grades.join(', ')}` 
              : `Grade ${kid.gradeBand}`}
          </p>
        </Link>
      ))}
    </div>
  );
}
