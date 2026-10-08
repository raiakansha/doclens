import React from 'react';

interface MarkdownContentProps {
  content: string;
}

/**
 * Lightweight, zero-dependency Markdown renderer tailored for DocLens AI responses.
 * Supports: Headers (h1-h4), bold (**), italic (*), bold-italic (***), code spans,
 * fenced code blocks, unordered lists, ordered lists, horizontal rules, and links.
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  if (!content) return null;

  // Split into lines for block-level parsing
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!currentList) return;
    const ListTag = currentList.type;
    const items = currentList.items;
    currentList = null;

    elements.push(
      <ListTag
        key={key}
        className={`my-2 space-y-1.5 pl-5 text-sm leading-relaxed ${
          ListTag === 'ul' ? 'list-disc marker:text-blue-400' : 'list-decimal marker:text-blue-400'
        }`}
      >
        {items.map((item, idx) => (
          <li key={idx} className="text-slate-200">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  const flushCodeBlock = (key: string) => {
    if (!inCodeBlock) return;
    const code = codeBlockLines.join('\n');
    inCodeBlock = false;
    codeBlockLines = [];

    elements.push(
      <div key={key} className="my-3 rounded-xl overflow-hidden border border-[#242e47] bg-[#090d16]">
        {codeBlockLang && (
          <div className="px-3 py-1 bg-[#121827] text-[11px] font-mono text-slate-400 border-b border-[#242e47]">
            {codeBlockLang}
          </div>
        )}
        <pre className="p-3 text-xs font-mono text-blue-200 overflow-x-auto leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block start / end
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(`code-${i}`);
      } else {
        if (currentList) flushList(`list-before-code-${i}`);
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Horizontal rule: --- or ***
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (currentList) flushList(`list-before-hr-${i}`);
      elements.push(<hr key={`hr-${i}`} className="my-4 border-[#242e47]" />);
      continue;
    }

    // Unordered List: * or -
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (currentList && currentList.type !== 'ul') flushList(`list-switch-${i}`);
      if (!currentList) currentList = { type: 'ul', items: [] };
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List: 1. or 2.
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (currentList && currentList.type !== 'ol') flushList(`list-switch-${i}`);
      if (!currentList) currentList = { type: 'ol', items: [] };
      currentList.items.push(olMatch[1]);
      continue;
    }

    // If line is not a list item, flush any existing list
    if (currentList) {
      flushList(`list-${i}`);
    }

    // Blank line
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Headers: #, ##, ###, ####
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-[#1f2942]">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-white mt-3.5 mb-1.5">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-blue-300 mt-3 mb-1">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-xs font-semibold text-slate-300 mt-2.5 mb-1">
          {renderInlineMarkdown(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`bq-${i}`} className="my-2 pl-3 border-l-2 border-blue-500 text-slate-300 italic text-xs leading-relaxed">
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-200 leading-relaxed my-1">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  if (currentList) flushList('list-end');
  if (inCodeBlock) flushCodeBlock('code-end');

  return <div className="markdown-body space-y-1">{elements}</div>;
};

/**
 * Parses inline formatting: ***bold-italic***, **bold**, *italic*, `code`, and [links](url)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Regex to split by inline code, bold, italic, links
  const tokenRegex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline code `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#161f33] text-blue-300 font-mono text-xs border border-[#24314f]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold-italic ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={idx} className="font-bold italic text-white">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-blue-300 underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
