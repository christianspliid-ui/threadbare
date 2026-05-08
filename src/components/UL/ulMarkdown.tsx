/**
 * Tiny markdown renderer for UL term bodies. Handles paragraphs, bold, italic,
 * inline code, links `[text](url)`, and wikilinks `[[Term]]` / `[[Term|alias]]`.
 *
 * Wikilinks become navigation chips that the parent can intercept via the
 * `onWikilinkClick` callback (resolves to a term inside the dashboard). Plain
 * markdown links open in a new tab.
 *
 * Lists and other markdown constructs render as plain text (acceptable
 * degradation; UL bodies are overwhelmingly prose).
 */

import { Fragment, type ReactNode } from 'react';

interface ULMarkdownProps {
  body: string;
  onWikilinkClick?: (termName: string) => void;
}

interface InlineToken {
  kind: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'wikilink';
  text: string;
  href?: string;
  termName?: string;
  display?: string;
}

const INLINE_RE =
  /(\[\[[^\]]+\]\])|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;

function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', text: input.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('[[') && raw.endsWith(']]')) {
      const inner = raw.slice(2, -2);
      const pipe = inner.indexOf('|');
      const termName = pipe >= 0 ? inner.slice(0, pipe).trim() : inner.trim();
      const display = pipe >= 0 ? inner.slice(pipe + 1).trim() : termName;
      tokens.push({ kind: 'wikilink', text: raw, termName, display });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ kind: 'code', text: raw.slice(1, -1) });
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ kind: 'bold', text: raw.slice(2, -2) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ kind: 'italic', text: raw.slice(1, -1) });
    } else if (raw.startsWith('[')) {
      const linkMatch = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push({ kind: 'link', text: linkMatch[1], href: linkMatch[2] });
      } else {
        tokens.push({ kind: 'text', text: raw });
      }
    } else {
      tokens.push({ kind: 'text', text: raw });
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < input.length) {
    tokens.push({ kind: 'text', text: input.slice(lastIndex) });
  }
  return tokens;
}

function renderInline(
  tokens: InlineToken[],
  onWikilinkClick: ((termName: string) => void) | undefined,
  keyPrefix: string,
): ReactNode[] {
  return tokens.map((token, i) => {
    const k = `${keyPrefix}-${i}`;
    switch (token.kind) {
      case 'text':
        return <Fragment key={k}>{token.text}</Fragment>;
      case 'bold':
        return <strong key={k}>{token.text}</strong>;
      case 'italic':
        return <em key={k}>{token.text}</em>;
      case 'code':
        return (
          <code
            key={k}
            style={{
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: '0.9em',
              padding: '1px 4px',
              borderRadius: 4,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {token.text}
          </code>
        );
      case 'link':
        return (
          <a
            key={k}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-gold-dim)', textDecoration: 'underline' }}
          >
            {token.text}
          </a>
        );
      case 'wikilink':
        return (
          <button
            key={k}
            type="button"
            onClick={() =>
              onWikilinkClick && token.termName && onWikilinkClick(token.termName)
            }
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: onWikilinkClick ? 'pointer' : 'default',
              color: 'var(--accent-gold-dim)',
              textDecoration: 'underline dotted',
              font: 'inherit',
            }}
          >
            {token.display ?? token.termName ?? token.text}
          </button>
        );
      default:
        return <Fragment key={k}>{token.text}</Fragment>;
    }
  });
}

export function ULMarkdown({ body, onWikilinkClick }: ULMarkdownProps) {
  if (!body.trim()) return null;
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, idx) => (
        <p
          key={`p-${idx}`}
          style={{
            marginBottom: 'var(--space-3)',
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {renderInline(tokenizeInline(para), onWikilinkClick, `t${idx}`)}
        </p>
      ))}
    </>
  );
}
