/**
 * THR-2098 — the sentence and chip shapes the retired label strips become (rules R6/R7;
 * plan `Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages.md` § R5–R7).
 *
 * A sentence row is a prose section with `parts` (slice 1's `SentencePart`), so each fact
 * keeps its link and its tooltip; `prose` carries the same words as plain, escaped text for
 * every reader that wants a string. Pure: words in, sections out.
 */
import type { ChipDescriptor, ChipsSection, ProseSection, SentencePart } from '../../../types/detailPage';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The words a part reads as. */
export function partText(part: SentencePart): string {
  return typeof part === 'string' ? part : part.text;
}

/**
 * Fill one clause template: each `{slot}` becomes its part, the rest plain text. A slot
 * with no part (null, absent or blank) drops the whole clause — never a bare `{slot}`.
 */
export function fillClause(template: string, slots: Readonly<Record<string, SentencePart | null | undefined>>): SentencePart[] | null {
  const out: SentencePart[] = [];
  for (const piece of template.split(/(\{[a-z]+\})/)) {
    const m = /^\{([a-z]+)\}$/.exec(piece);
    if (!m) {
      if (piece) out.push(piece);
      continue;
    }
    const part = slots[m[1]];
    if (part == null || !partText(part).trim()) return null;
    out.push(part);
  }
  return out;
}

/** "Settled country" → "settled country": a band word running on mid-sentence. */
export function lowerFirst(word: string): string {
  return word.length > 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word;
}

/** "the god siphons a share" → "The god siphons a share." */
export function asSentence(line: string): string {
  const t = line.trim();
  if (!t) return '';
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

/**
 * Clauses joined into one paragraph, a space between each. Null clauses are dropped; zero
 * clauses → null, and the row hides (Law 14).
 */
export function sentenceSection(
  typeId: string,
  label: string,
  clauses: readonly (readonly SentencePart[] | null)[],
  source: string,
  extra: Partial<Pick<ProseSection, 'labelTooltipId' | 'highlight' | 'gold' | 'tier' | 'icon'>> = {},
): ProseSection | null {
  const parts: SentencePart[] = [];
  for (const clause of clauses) {
    if (!clause || clause.length === 0) continue;
    if (parts.length > 0) parts.push(' ');
    parts.push(...clause);
  }
  if (parts.length === 0) return null;
  const text = parts.map(partText).join('');
  if (!text.trim()) return null;
  return {
    kind: 'prose',
    typeId,
    label,
    gold: extra.gold ?? false,
    tier: extra.tier ?? 'routine',
    source,
    prose: escapeHtml(text),
    parts,
    ...(extra.labelTooltipId ? { labelTooltipId: extra.labelTooltipId } : {}),
    ...(extra.highlight ? { highlight: extra.highlight } : {}),
    ...(extra.icon ? { icon: extra.icon } : {}),
  };
}

/** A chips row; no chips → null (Law 25). */
export function chipsSection(typeId: string, label: string, chips: readonly ChipDescriptor[], source: string, extra: Partial<Pick<ChipsSection, 'labelTooltipId'>> = {}): ChipsSection | null {
  if (chips.length === 0) return null;
  return { kind: 'chips', typeId, label, gold: false, tier: 'routine', source, chips: [...chips], ...extra };
}
