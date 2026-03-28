/**
 * ProseKeyword (IPK — Interactive Prose Keyword) Component
 *
 * Renders a sphere name as bold, underlined, sphere-colored text with a
 * narrative tooltip on hover/focus. Numbers are NEVER shown — only prose.
 *
 * Keyboard accessible: focusable via Tab, tooltip appears on focus,
 * dismisses on Blur or Escape.
 *
 * Usage:
 *   <ProseKeyword sphere="life">Life</ProseKeyword>
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import { useState, useId, useCallback } from 'react';
import type { SphereName } from '../types';
import { getSphereColor } from '../data/sphereIcons';
import { SPHERE_TOOLTIPS } from '../data/sphereTooltips';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProseKeywordProps {
  /** The sphere this keyword represents — drives color and tooltip content */
  sphere: SphereName;
  /** The display text (usually the sphere name, possibly capitalized) */
  children: React.ReactNode;
}

// ─── Tooltip style constants (NFP #1: tunability) ─────────────────────────────

const TOOLTIP_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 9999,
  padding: '10px 12px',
  fontSize: '12px',
  lineHeight: 1.6,
  background: 'rgba(10, 10, 14, 0.97)',
  color: '#e2e0d8',
  borderRadius: '6px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
  maxWidth: '280px',
  minWidth: '180px',
  fontFamily: 'var(--font-prose, serif)',
  fontStyle: 'italic',
  fontWeight: 400,
  textDecoration: 'none',
  whiteSpace: 'normal',
  pointerEvents: 'none',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProseKeyword({ sphere, children }: ProseKeywordProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();
  const color = getSphereColor(sphere);
  const tooltipText = SPHERE_TOOLTIPS[sphere];

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowTooltip(false);
      (e.currentTarget as HTMLElement).blur();
    }
  }, []);

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline',
        color,
        fontWeight: 700,
        textDecoration: 'underline',
        textDecorationColor: `${color}88`,
        cursor: 'help',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onKeyDown={handleKeyDown}
      role="term"
      tabIndex={0}
      aria-describedby={showTooltip ? tooltipId : undefined}
    >
      {children}
      {showTooltip && tooltipText && (
        <span
          id={tooltipId}
          role="tooltip"
          style={TOOLTIP_STYLE}
        >
          {tooltipText}
        </span>
      )}
    </span>
  );
}

// ─── Prose Parser Utility ─────────────────────────────────────────────────────

/**
 * Parse a prose string with **SphereName** markers and return React nodes.
 *
 * Markers must match a valid SphereName exactly (case-insensitive match,
 * but the displayed text preserves original capitalisation from the marker).
 *
 * Example:
 *   "The **Force** is strong here." →
 *   ["The ", <ProseKeyword sphere="force">Force</ProseKeyword>, " is strong here."]
 */

const SPHERE_NAMES_SET: ReadonlySet<string> = new Set([
  'force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy',
]);

const PROSE_KEYWORD_RE = /\*\*([^*]+)\*\*/g;

export function renderProseWithIPK(text: string): React.ReactNode {
  if (!text.includes('**')) return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  PROSE_KEYWORD_RE.lastIndex = 0;
  while ((match = PROSE_KEYWORD_RE.exec(text)) !== null) {
    const [fullMatch, inner] = match;
    const start = match.index;

    // Push leading plain text
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const normalized = inner.toLowerCase().trim();
    if (SPHERE_NAMES_SET.has(normalized)) {
      parts.push(
        <ProseKeyword key={`ipk-${keyCounter++}`} sphere={normalized as SphereName}>
          {inner}
        </ProseKeyword>,
      );
    } else {
      // Not a recognised sphere — emit plain bold text
      parts.push(<strong key={`bold-${keyCounter++}`}>{inner}</strong>);
    }

    lastIndex = start + fullMatch.length;
  }

  // Push trailing plain text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
