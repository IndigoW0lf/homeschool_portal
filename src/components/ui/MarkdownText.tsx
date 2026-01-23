'use client';

/**
 * Simple Markdown Renderer
 * 
 * Renders basic markdown syntax that Luna uses in lesson plans:
 * - **bold** text
 * - Headings (##, ###)
 * - Lists (- items)
 * - Line breaks
 * 
 * This is a lightweight alternative to react-markdown.
 */

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  if (!content) return null;

  // Process the markdown content
  const processContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listKey = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${listKey}`} className="list-disc list-inside space-y-1 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-heading dark:text-muted">
                {processInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        listKey++;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Empty line
      if (!line) {
        flushList();
        continue;
      }

      // H2 heading (##)
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={i} className="text-lg font-bold text-heading mt-4 mb-2">
            {processInline(line.substring(3))}
          </h2>
        );
        continue;
      }

      // H3 heading (###)
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={i} className="text-md font-semibold text-heading dark:text-heading mt-3 mb-1">
            {processInline(line.substring(4))}
          </h3>
        );
        continue;
      }

      // Bold section header (**Section Name**)
      if (line.startsWith('**') && line.endsWith('**') && !line.includes('**', 2)) {
        flushList();
        const headerText = line.slice(2, -2);
        elements.push(
          <h3 key={i} className="text-md font-semibold text-heading dark:text-heading mt-4 mb-2 border-b border-[var(--border)] pb-1">
            {headerText}
          </h3>
        );
        continue;
      }

      // List item (- item or * item)
      if (line.startsWith('- ') || line.startsWith('* ')) {
        listItems.push(line.substring(2));
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={i} className="text-heading dark:text-muted mb-2 leading-relaxed">
          {processInline(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  // Process inline markdown (bold, italic)
  const processInline = (text: string): React.ReactNode => {
    // Split on **bold** patterns
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, i) => {
      // Bold text
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-heading">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`markdown-content ${className}`}>
      {processContent(content)}
    </div>
  );
}
