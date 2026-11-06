/**
 * THR-2183 — an opened folded god-rail row starts with one muted sentence saying
 * what the row is for. The sentence is the first sentence of the row's own hover
 * entry, so the hover and the line never drift apart (one source).
 *
 * Pure helpers; the component reads them (`ascendant-bar/AscendantBar.tsx` `FoldedRow`).
 */
import type { CSSProperties } from 'react';
import { resolveTooltip } from '../../../engine/tooltipResolver';
import { TOOLTIP_LINK_PATTERN } from '../../../types/tooltip';

/** The opened row's definition line style — every spacing value lives here (plan constants table). */
export const GOD_RAIL_DEFINITION_LINE = {
  size: '--text-xs',
  color: '--text-muted',
  margin: '0 0 4px',
  padding: '0 8px',
} as const;

/** The same constant as a style object. */
export const GOD_RAIL_DEFINITION_LINE_STYLE: CSSProperties = {
  fontSize: `var(${GOD_RAIL_DEFINITION_LINE.size})`,
  color: `var(${GOD_RAIL_DEFINITION_LINE.color})`,
  margin: GOD_RAIL_DEFINITION_LINE.margin,
  padding: GOD_RAIL_DEFINITION_LINE.padding,
};

/** The sentence break the cut looks for. */
const SENTENCE_BREAK = '. ';

/**
 * The first sentence of `desc`, full stop kept. A desc with no ". " comes back whole
 * (trimmed); an empty or missing desc returns null so no line is drawn.
 */
export function firstSentence(desc: string | null | undefined): string | null {
  if (!desc) return null;
  const text = desc.trim();
  if (!text) return null;
  const cut = text.indexOf(SENTENCE_BREAK);
  return cut < 0 ? text : text.slice(0, cut + 1);
}

/**
 * Replace each `{{ui.*}}` reference with its label, the way the tooltip shows it.
 * An unresolved reference falls back to its last id segment in plain words, never
 * the raw key (Law 14).
 */
export function resolveDefinitionRefs(text: string): string {
  return text.replace(new RegExp(TOOLTIP_LINK_PATTERN.source, 'g'), (_m, id: string) => {
    const label = resolveTooltip(id)?.label;
    if (label) return label;
    const tail = id.split('.').pop() ?? '';
    return tail.replace(/_/g, ' ');
  });
}

/**
 * The definition line for a row's tooltip id: the hover's first sentence, references
 * resolved after the cut. Null when the id is null or does not resolve.
 */
export function godRailDefinitionLine(tooltipId: string | null | undefined): string | null {
  if (!tooltipId) return null;
  const sentence = firstSentence(resolveTooltip(tooltipId)?.desc);
  return sentence ? resolveDefinitionRefs(sentence) : null;
}
