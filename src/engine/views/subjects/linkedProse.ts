/**
 * Prose whose names are links (THR-1910, Inspector S2b — plan § D6 `prose` shape:
 * "finished prose, `termRefs` for linked words").
 *
 * The retiring sheets rendered names inside sentences as `EntityLink`s (Law 21). A row
 * resolver cannot return React nodes, so it returns markup the prose renderer already
 * routes: each name is `<span class="term" data-term="tN">Name</span>`, and `termRefs`
 * maps `tN` → the `NodeRef` the click opens. Text is escaped; nothing else is markup.
 */
import type { GraphPageKind, NodeRef, ProseSection } from '../../../types/detailPage';
import { proseMarkupToHtml } from './pageResolvers';

/** A run of sentence text, or a name the page renders as a link. */
export type ProsePart = string | { text: string; ref: { kind: string; id: string } };

/** WorldRef kind → the page kind the prose click opens. Unknown kinds render as plain text. */
const PAGE_KIND_FOR_REF: Readonly<Record<string, GraphPageKind>> = {
  agent: 'actor',
  companion: 'actor',
  faction: 'faction',
  location: 'place',
  sublocation: 'place',
  area: 'place',
  army: 'group',
  artifact: 'item',
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Parts → markup + termRefs. String parts may carry `**Keyword**` markup (kept as the
 * prose shape's keyword span); named parts become routed terms.
 */
export function linkedProse(parts: readonly ProsePart[]): { prose: string; termRefs?: Record<string, NodeRef> } {
  const termRefs: Record<string, NodeRef> = {};
  let n = 0;
  const html = parts.map(p => {
    if (typeof p === 'string') return proseMarkupToHtml(p);
    const pageKind = PAGE_KIND_FOR_REF[p.ref.kind];
    if (!pageKind) return escapeHtml(p.text);
    const key = `t${n++}`;
    termRefs[key] = { nodeId: p.ref.id, pageKind };
    return `<span class="term" data-term="${key}">${escapeHtml(p.text)}</span>`;
  }).join('');
  return n > 0 ? { prose: html, termRefs } : { prose: html };
}

/**
 * A template with `{slot}` names filled by parts — `armyAimView`'s `{town}` / `{enemy}`,
 * `Made by {maker} at {place}`. A slot with no part keeps its bare word.
 */
export function fillSlots(template: string, slots: Readonly<Record<string, ProsePart | null | undefined>>): ProsePart[] {
  const out: ProsePart[] = [];
  for (const piece of template.split(/(\{[a-z_]+\})/)) {
    const m = /^\{([a-z_]+)\}$/.exec(piece);
    if (!m) {
      if (piece) out.push(piece);
      continue;
    }
    const slot = slots[m[1]];
    out.push(slot ?? m[1]);
  }
  return out;
}

/** A prose section from parts (paragraphs separated by `'\n\n'` string parts). */
export function linkedProseSection(
  typeId: string,
  label: string,
  parts: readonly ProsePart[],
  source: string,
  extra: Partial<Pick<ProseSection, 'gold' | 'tier' | 'labelTooltipId' | 'variant'>> = {},
): ProseSection | null {
  if (parts.length === 0) return null;
  const { prose, termRefs } = linkedProse(parts);
  if (!prose.trim()) return null;
  return {
    kind: 'prose',
    typeId,
    label,
    gold: extra.gold ?? false,
    tier: extra.tier ?? 'routine',
    source,
    prose,
    ...(termRefs ? { termRefs } : {}),
    ...(extra.labelTooltipId ? { labelTooltipId: extra.labelTooltipId } : {}),
    ...(extra.variant ? { variant: extra.variant } : {}),
  };
}
