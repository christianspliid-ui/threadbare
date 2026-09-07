/**
 * The Undertakings codex section (THR-1434, from THR-1404's ruling): capability lives
 * on a generated page, never on a person's sheet. One card per **live** cell of the
 * grid, built from the same registry (`UNDERTAKING_OBJECT_TYPES` → the synthesised
 * cell templates) and the same curated notes (`scripts/undertaking-grid-dispositions.ts`)
 * the designer wiki page reads, so the two cannot disagree.
 *
 * What a card says, in game words only (Law 14 — never a code id):
 *   - the plain phrase (*Raise a company*), the kind's glyph and word,
 *   - what it does in the world: the lexicon's own GM line with generic slots, which
 *     is the game's own voice for the cell. The disposition's note is a designer
 *     sentence that names code symbols, so it is **not** rendered to the player;
 *   - who tends to do it: the callings whose derived spread includes the cell under
 *     the division rule (THR-1398's tables — derived at build, never hand-listed);
 *   - counter-play: the cell that undoes it, when the grid has one;
 *   - whether it needs a reason (the motive gate).
 *
 * Decided-but-unbuilt and *later* cells do not appear. A live cell with no phrase,
 * no glyph, no lexicon line or no note fails the build by name (`validate…`), the
 * same discipline the grid has for an unplaced cell; the live catalog degrades that
 * to a warning so a content slip never blanks the page (NFP #4).
 */

import type { CodexEntry } from './codexRegistry';
import type { UndertakingObjectTypeId, UndertakingVerbVariant, StrategicActionTemplate } from '../../types/strategicAction';
import { UNDERTAKING_CELL_TEMPLATES, cellTemplateId, getCellTemplate } from '../../data/undertaking-cells';
import { getUndertakingObjectType, UNDERTAKING_OBJECT_TYPES } from '../../data/undertaking-objects';
import { UNDERTAKING_VERB_WORDS, cellLineSet } from '../../data/undertaking-verb-prose';
import { MOTIVE_GATED_VERBS } from '../../data/strategic-action-constants';
import { LIVE_CELL_NOTES } from '../../../scripts/undertaking-grid-dispositions';
import { callingsForCell } from '../../data/division-rule-tables';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS } from '../../types/rarity';

/** The kind's glyph on its cards — one per object type; the totality test pins the keys. */
export const UNDERTAKING_KIND_GLYPHS: Readonly<Record<UndertakingObjectTypeId, string>> = {
  area: '⛰',        // ⛰ mountain — the land
  location: '⌂',    // ⌂ house — a settlement
  place: '▣',       // ▣ a room within
  route: '⇢',       // ⇢ a road
  faction: '⚑',     // ⚑ a banner
  company: '⁂',     // ⁂ three marks travelling together
  army: '⚔',        // ⚔ crossed swords
  network: '⌗',     // ⌗ a web
  companion: '♟',   // ♟ one who walks beside
  item: '◆',        // ◆ a possession
  power: '✧',       // ✧ a working
  condition: '✕',   // ✕ an affliction
  agreement: '☍',   // ☍ a bond of words
  standing: '⚖',    // ⚖ how one is held
  mortal: '♙',      // ♙ a person — the plot's object (THR-1430)
};

/** The cell that undoes a verb on the same kind, when the grid has one. */
export const COUNTER_PLAY_OF: Readonly<Record<UndertakingVerbVariant, UndertakingVerbVariant | null>> = {
  create: 'destroy',
  'change:raise': 'change:lower',
  'change:lower': 'change:raise',
  use: null,
  'control:claim': 'control:seize',
  'control:seize': 'control:claim',
  destroy: 'create',
  observe: null,
};

/** The reason a gated verb needs, in words. */
export const MOTIVE_GATE_WORDS = 'Only with a grievance, a rivalry, a contested want or a war';

const GENERIC_SLOTS: Readonly<Record<string, string>> = {
  Actor: 'A mortal', actor: 'a mortal',
  Owner: 'Its holder', owner: 'its holder',
  Place: 'The place', place: 'the place',
  learned: 'what they learned',
};

/** The lexicon's GM line with the world's slots filled generically — the cell in the game's own voice. */
export function genericCellLine(variant: UndertakingVerbVariant, typeId: UndertakingObjectTypeId, kindWord: string): string {
  const line = cellLineSet(variant, typeId).narration;
  const object = `the ${kindWord.toLowerCase()}`;
  return line
    .replace(/\{Object\}/g, object.charAt(0).toUpperCase() + object.slice(1))
    .replace(/\{object\}/g, object)
    .replace(/\{([A-Za-z]+)\}/g, (_m, key: string) => GENERIC_SLOTS[key] ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export interface UndertakingCodexProblem {
  readonly cellId: string;
  readonly problem: string;
}

/** Every reason a live cell cannot be a card, by name. Empty means the section builds whole. */
export function validateUndertakingCodex(templates: readonly StrategicActionTemplate[] = UNDERTAKING_CELL_TEMPLATES): UndertakingCodexProblem[] {
  const problems: UndertakingCodexProblem[] = [];
  for (const t of templates) {
    const variant = t.cellVariant;
    const typeId = t.objectTypeId;
    if (!variant || !typeId) { problems.push({ cellId: t.id, problem: 'not a cell (no variant or object type)' }); continue; }
    if (!t.displayName || t.displayName.includes('cell.')) problems.push({ cellId: t.id, problem: 'no plain phrase' });
    if (!UNDERTAKING_KIND_GLYPHS[typeId]) problems.push({ cellId: t.id, problem: `no glyph for kind '${typeId}'` });
    if (!cellLineSet(variant, typeId).narration) problems.push({ cellId: t.id, problem: 'no lexicon line' });
    if (!LIVE_CELL_NOTES[typeId as never]?.[variant]) problems.push({ cellId: t.id, problem: 'no disposition note' });
  }
  return problems;
}

let _warned = false;

/** One codex entry per live cell. Non-strict: a cell that fails validation is skipped with one warning. */
export function buildUndertakingCodexEntries(): CodexEntry[] {
  const problems = validateUndertakingCodex();
  if (problems.length > 0 && !_warned) {
    _warned = true;
    console.warn(`[codex] undertakings section skipped ${problems.length} cell(s): ${problems.map(p => `${p.cellId} (${p.problem})`).join('; ')}`);
  }
  const broken = new Set(problems.map(p => p.cellId));
  const entries: CodexEntry[] = [];
  for (const t of UNDERTAKING_CELL_TEMPLATES) {
    if (broken.has(t.id)) continue;
    const variant = t.cellVariant!;
    const typeId = t.objectTypeId!;
    const type = getUndertakingObjectType(typeId)!;
    const kindWord = type.displayName;
    const verbWord = UNDERTAKING_VERB_WORDS[variant];
    const callings = callingsForCell(t.id);
    const counterVariant = COUNTER_PLAY_OF[variant];
    const counter = counterVariant ? getCellTemplate(cellTemplateId(counterVariant, typeId)) : undefined;
    const gated = MOTIVE_GATED_VERBS.includes(variant);

    entries.push({
      id: t.id,
      name: t.displayName,
      glyph: UNDERTAKING_KIND_GLYPHS[typeId],
      // A gated verb is the heavier deed — it needs a reason — and reads a tier up.
      tier: gated ? 2 : 1,
      tierName: RARITY_TIER_NAMES[gated ? 2 : 1],
      tierColor: RARITY_TIER_COLORS[gated ? 2 : 1],
      category: 'undertakings',
      subcategory: variant,
      subtitle: `${kindWord} · ${verbWord}`,
      summary: genericCellLine(variant, typeId, kindWord),
      tags: [verbWord, kindWord, ...(gated ? ['Needs a reason'] : [])],
      details: [
        { label: 'The kind of thing', value: kindWord, tooltipId: 'ui.undertaking_kind' },
        { label: 'The verb', value: verbWord, tooltipId: `ui.verb.${variant}` },
        {
          label: 'Who tends to do it',
          value: callings.length > 0 ? callings.map(c => c.title).join(' · ') : 'Nobody by inclination',
          tooltipId: 'ui.calling',
        },
        { label: 'Counter-play', value: counter ? counter.displayName : 'None the grid has' },
        { label: 'Needs a reason', value: gated ? MOTIVE_GATE_WORDS : 'No' },
      ],
    });
  }
  return entries;
}

/** The section's census — what a verification run compares to the grid's live count. */
export function undertakingCodexCensus(): { entries: number; liveCells: number; kinds: number; problems: UndertakingCodexProblem[] } {
  return {
    entries: buildUndertakingCodexEntries().length,
    liveCells: UNDERTAKING_CELL_TEMPLATES.length,
    kinds: UNDERTAKING_OBJECT_TYPES.length,
    problems: validateUndertakingCodex(),
  };
}
