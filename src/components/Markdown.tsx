'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  markdown: string;
}

export function Markdown({ markdown }: MarkdownProps) {
  return (
    <div className="prose dark:text-slate-100 max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
} 