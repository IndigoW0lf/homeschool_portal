import { Quote } from '@/types';

interface QuoteCardProps {
  quote: Quote;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6 shadow-sm min-h-[100px] flex flex-col justify-center">
      <blockquote className="text-lg sm:text-xl italic text-gray-700 dark:text-gray-200 leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <p className="text-right text-sm text-muted mt-3">
        — {quote.author}
      </p>
    </div>
  );
}

