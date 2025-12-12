import Link from 'next/link';
import { Kid } from '@/types';

interface KidSwitcherProps {
  kids: Kid[];
}

const gradeBandColors: Record<string, string> = {
  '3-5': 'from-green-400 to-teal-500',
  '6-8': 'from-blue-400 to-indigo-500',
  default: 'from-purple-400 to-pink-500',
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
            text-white shadow-lg hover:shadow-xl transition-shadow
            flex flex-col items-center justify-center min-h-[120px]
          `}
        >
          <div className="text-3xl mb-2">📚</div>
          <h3 className="text-xl font-bold">{kid.name}</h3>
          <p className="text-sm opacity-80">Grade {kid.gradeBand}</p>
        </Link>
      ))}
    </div>
  );
}
