/**
 * The calling naming table (THR-1299 slice 5, THR-1281 §7b).
 *
 * A calling is what the world calls a mortal for what they do — *Trader*,
 * *Reaver*, *Mender* — derived from their leading reach pair, their active
 * ambition and their personality lean. This table is the content the derivation
 * scores against; `src/engine/calling.ts` does the scoring.
 *
 * ## Seeded from the ten retired family names
 *
 * `BehaviorFamily` retired as *mechanics* (the grammar grid is kinds × reaches);
 * the readable-pattern value Christian wanted kept is served here. Each family
 * name is re-cut as a title, and every seed has at least one personality-modified
 * variant — Merchant becomes *Trader* or *Smuggler* by lean, Builder *Mason* or
 * *Founder*. Christian wants MORE than eight readable patterns, so the table is
 * open-ended: add a row, never a branch.
 *
 * ## Row semantics
 *
 * - `reachPair`: the reaches the title belongs to. A row scores on how many of
 *   the mortal's two leading reaches it names (its primary counting double).
 * - `ambitionCategories`: the ambition categories that lead to this work.
 * - `wantedKinds`: optional — the undertaking kinds the active ambition's own
 *   templates build; a row that names what the mortal is actually building
 *   scores higher than one that names only their reach.
 * - `personality`: optional lean — a value pair and the pole (`+1` virtue, `-1`
 *   flaw) that fits the title. A row with a lean scores the personality term
 *   only when the mortal leans that way; a row without one takes the neutral
 *   half-credit, so a leaned title needs a leaning mortal to beat its plain
 *   sibling.
 *
 * Register: one word, plain, sayable at a glance (Law 13/14 — a calling is a
 * label a player reads on a row, never a stat).
 */

import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';
import type { AmbitionCategory } from '../types/ambition';
import type { BehaviorFamily, UndertakingKindId } from '../types/strategicAction';

export interface CallingRow {
  readonly titleKey: string;
  readonly title: string;
  /** Primary reach first. */
  readonly reachPair: readonly [ReachDomain, ReachDomain?];
  readonly ambitionCategories: readonly AmbitionCategory[];
  readonly wantedKinds?: readonly UndertakingKindId[];
  readonly personality?: { readonly pair: ValuePair; readonly pole: 1 | -1 };
}

export const CALLING_ROWS: readonly CallingRow[] = [
  // ── Merchant → Trader / Smuggler ──
  { titleKey: 'trader', title: 'Trader', reachPair: ['gold', 'heart'], ambitionCategories: ['dominion', 'legacy'], wantedKinds: ['trade_route', 'network'] },
  { titleKey: 'smuggler', title: 'Smuggler', reachPair: ['gold', 'shadow'], ambitionCategories: ['dominion', 'survival'], wantedKinds: ['trade_route', 'network'], personality: { pair: 'honesty_cunning', pole: -1 } },
  { titleKey: 'magnate', title: 'Magnate', reachPair: ['gold', 'eye'], ambitionCategories: ['dominion', 'legacy'], wantedKinds: ['trade_route', 'place_location'], personality: { pair: 'asceticism_extravagance', pole: -1 } },
  // ── Builder → Mason / Founder ──
  { titleKey: 'mason', title: 'Mason', reachPair: ['stone', 'gold'], ambitionCategories: ['legacy', 'survival'], wantedKinds: ['sublocation', 'place_location'] },
  { titleKey: 'founder', title: 'Founder', reachPair: ['stone', 'heart'], ambitionCategories: ['legacy', 'dominion'], wantedKinds: ['place_location', 'faction'], personality: { pair: 'preservation_transformation', pole: -1 } },
  // ── Scholar → Seeker / Archivist ──
  { titleKey: 'seeker', title: 'Seeker', reachPair: ['eye', 'veil'], ambitionCategories: ['discovery', 'mastery'], wantedKinds: ['chart_find', 'intelligence_cache'] },
  { titleKey: 'archivist', title: 'Archivist', reachPair: ['eye', 'stone'], ambitionCategories: ['mastery', 'legacy'], wantedKinds: ['intelligence_cache'], personality: { pair: 'tradition_novelty', pole: 1 } },
  // ── Zealot → Zealot / Prophet ──
  { titleKey: 'zealot', title: 'Zealot', reachPair: ['star', 'heart'], ambitionCategories: ['devotion'], wantedKinds: ['faction', 'place_location'] },
  { titleKey: 'prophet', title: 'Prophet', reachPair: ['star', 'veil'], ambitionCategories: ['devotion', 'discovery'], wantedKinds: ['faction'], personality: { pair: 'sacrifice_survival', pole: 1 } },
  // ── Court → Spider / Chancellor ──
  { titleKey: 'spider', title: 'Spider', reachPair: ['shadow', 'heart'], ambitionCategories: ['dominion', 'vengeance'], wantedKinds: ['leverage_mark', 'network'], personality: { pair: 'honesty_cunning', pole: -1 } },
  { titleKey: 'chancellor', title: 'Chancellor', reachPair: ['heart', 'gold'], ambitionCategories: ['dominion', 'legacy'], wantedKinds: ['faction', 'network'] },
  // ── Underworld → Knife / Fence ──
  { titleKey: 'knife', title: 'Knife', reachPair: ['shadow', 'iron'], ambitionCategories: ['vengeance', 'survival'], wantedKinds: ['leverage_mark'], personality: { pair: 'mercy_ruthlessness', pole: -1 } },
  { titleKey: 'fence', title: 'Fence', reachPair: ['shadow', 'gold'], ambitionCategories: ['survival', 'dominion'], wantedKinds: ['network', 'intelligence_cache'] },
  // ── Warlord → Reaver / Captain ──
  { titleKey: 'reaver', title: 'Reaver', reachPair: ['iron', 'shadow'], ambitionCategories: ['dominion', 'vengeance'], wantedKinds: ['warband'], personality: { pair: 'mercy_ruthlessness', pole: -1 } },
  { titleKey: 'captain', title: 'Captain', reachPair: ['iron', 'heart'], ambitionCategories: ['dominion', 'survival', 'legacy'], wantedKinds: ['warband', 'faction'] },
  { titleKey: 'warden', title: 'Warden', reachPair: ['iron', 'stone'], ambitionCategories: ['survival', 'legacy'], wantedKinds: ['sublocation', 'place_location'], personality: { pair: 'mercy_ruthlessness', pole: 1 } },
  // ── Caretaker → Mender / Steward ──
  { titleKey: 'mender', title: 'Mender', reachPair: ['star', 'stone'], ambitionCategories: ['survival', 'devotion'], wantedKinds: ['sublocation'], personality: { pair: 'sacrifice_survival', pole: 1 } },
  { titleKey: 'steward', title: 'Steward', reachPair: ['stone', 'gold'], ambitionCategories: ['survival', 'legacy'], wantedKinds: ['sublocation', 'trade_route'], personality: { pair: 'preservation_transformation', pole: 1 } },
  // ── Artist → Crafter / Maker ──
  { titleKey: 'crafter', title: 'Crafter', reachPair: ['gold', 'stone'], ambitionCategories: ['mastery', 'legacy'], wantedKinds: ['masterwork_item'] },
  { titleKey: 'maker', title: 'Maker', reachPair: ['stone', 'star'], ambitionCategories: ['mastery', 'devotion'], wantedKinds: ['masterwork_item', 'sublocation'], personality: { pair: 'tradition_novelty', pole: -1 } },
  // ── Wanderer → Wayfarer / Pathfinder ──
  { titleKey: 'wayfarer', title: 'Wayfarer', reachPair: ['veil', 'eye'], ambitionCategories: ['discovery', 'survival'], wantedKinds: ['chart_find'] },
  { titleKey: 'pathfinder', title: 'Pathfinder', reachPair: ['veil', 'iron'], ambitionCategories: ['discovery', 'dominion'], wantedKinds: ['chart_find', 'trade_route'], personality: { pair: 'courage_prudence', pole: 1 } },
  // ── The one no family seeded: the avenger ──
  { titleKey: 'avenger', title: 'Avenger', reachPair: ['iron', 'heart'], ambitionCategories: ['vengeance'], personality: { pair: 'loyalty_ambition', pole: 1 } },
];

/**
 * Legacy fallback: a persisted `StrategicHistoryEntry.behaviorFamily` renders through
 * the family's seed title, so an old save reads without a recompute. Total over the
 * enum — a test pins it — so a family cannot be added without a title.
 */
export const BEHAVIOR_FAMILY_TO_CALLING: Readonly<Record<BehaviorFamily, string>> = {
  'merchant-expansion': 'trader',
  'builder-civic': 'mason',
  'scholar-seeker': 'seeker',
  'zealot-mission': 'zealot',
  'court-political': 'chancellor',
  'underworld-network': 'fence',
  'warlord-expansion': 'captain',
  'caretaker-steward': 'steward',
  'artist-crafter': 'crafter',
  'wanderer-explorer': 'wayfarer',
};

/**
 * Glyph and colour per title — the presentation half the family table used to
 * carry. Titles not listed take the fallback; a row can ship with no glyph and
 * still render (Law 4: a designed fallback, not a broken one).
 */
export const CALLING_PRESENTATION: Readonly<Record<string, { glyph: string; color: string }>> = {
  trader: { glyph: '¤', color: '#c8a84e' },
  smuggler: { glyph: '¤', color: '#8a7a4e' },
  magnate: { glyph: '¤', color: '#e0c060' },
  mason: { glyph: '⚒', color: '#8a9a7c' },
  founder: { glyph: '⚒', color: '#a0b090' },
  seeker: { glyph: '📜', color: '#5b7fa5' },
  archivist: { glyph: '📜', color: '#4a6a8a' },
  zealot: { glyph: '✦', color: '#b85450' },
  prophet: { glyph: '✦', color: '#d08070' },
  spider: { glyph: '⚜', color: '#8b6baa' },
  chancellor: { glyph: '⚜', color: '#a08acc' },
  knife: { glyph: '🗡', color: '#6a6a72' },
  fence: { glyph: '🗡', color: '#8a8a92' },
  reaver: { glyph: '⚔', color: '#9a6850' },
  captain: { glyph: '⚔', color: '#b08070' },
  warden: { glyph: '⚔', color: '#7a8a70' },
  mender: { glyph: '✚', color: '#6a9a6e' },
  steward: { glyph: '✚', color: '#8aaa8e' },
  crafter: { glyph: '◈', color: '#5a8aaa' },
  maker: { glyph: '◈', color: '#7aaacc' },
  wayfarer: { glyph: '⇢', color: '#aa8a5a' },
  pathfinder: { glyph: '⇢', color: '#c0a070' },
  avenger: { glyph: '✕', color: '#b04040' },
};

export const CALLING_FALLBACK_PRESENTATION = { glyph: '◆', color: '#8a8a8a' };
