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

import type { SphereName } from '../types';
import { getSphereColor } from '../data/sphereIcons';
import { SPHERE_TOOLTIPS } from '../data/sphereTooltips';
import { Tooltip } from './shared/Tooltip';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProseKeywordProps {
  /** The sphere this keyword represents — drives color and tooltip content */
  sphere: SphereName;
  /** The display text (usually the sphere name, possibly capitalized) */
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProseKeyword({ sphere, children }: ProseKeywordProps) {
  const color = getSphereColor(sphere);
  const tooltipText = SPHERE_TOOLTIPS[sphere];

  return (
    <Tooltip label={sphere} desc={tooltipText}>
      <span
        style={{
          color,
          fontWeight: 700,
          textDecoration: 'underline',
          textDecorationColor: `${color}88`,
          cursor: 'help',
        }}
        role="term"
        tabIndex={0}
      >
        {children}
      </span>
    </Tooltip>
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
  'chaos', 'order', 'light', 'darkness',
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
