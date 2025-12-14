import { Quote } from '@/types';

interface QuoteCardProps {
  quote: Quote;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6 shadow-sm h-[80px]">
      <blockquote className="text-lg italic text-gray-700 dark:text-gray-200">
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-2">
        — {quote.author}
      </p>
    </div>
  );
}
