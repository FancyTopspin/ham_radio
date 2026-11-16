import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content text-sm text-slate-800 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h3: ({ children }) => {
            const headingText = String(children);
            let badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
            
            if (headingText.includes('Why This Is Correct')) {
              badgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-200';
            } else if (headingText.includes('Breakdown of Other Choices')) {
              badgeColor = 'bg-amber-50 text-amber-900 border-amber-200';
            } else if (headingText.includes('Tip') || headingText.includes('Memory Hook')) {
              badgeColor = 'bg-purple-50 text-purple-900 border-purple-200';
            }

            return (
              <div className={`mt-4 mb-2.5 px-3 py-1.5 rounded-lg border font-bold text-sm tracking-wide inline-flex items-center space-x-2 ${badgeColor}`}>
                <span>{children}</span>
              </div>
            );
          },
          p: ({ children }) => (
            <p className="mb-2.5 leading-relaxed text-slate-700 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2.5 space-y-1.5 list-disc pl-5 text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 space-y-1.5 list-decimal pl-5 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-800">
              {children}
            </em>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-blue-50/50 rounded-r-lg text-slate-700 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
