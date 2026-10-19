/**
 * armedTargets — the card → its targets inverse (THR-1914, Inspector plan § D9 way 3).
 *
 * The god arms a card from the hand first; the map and the Inspector then light every
 * thing it can land on. This module answers both questions that needs, through exactly
 * the gates the Act row and the cast path use (`actOnSlots` → `getTargetActionSlots`
 * with one template), so a lit target is a target the cast will take, at the price and
 * lock the card face states (interface row `dominion-band-prices-god-casts`):
 *
 * - `evaluateCardOnTarget` — one card on one world ref: castable, locked (with the card
 *   face's reason words) or not a target. Inspector rows ask it on demand.
 * - `buildArmedTargets` — one card over the seen map: every candidate of the card's
 *   target categories drawn from `hexContents` on hexes the seen floor allows
 *   (`'armedTargets'` knowledge surface — lighting in fog would leak what fog hides),
 *   plus the map's lit / locked hex lists and hover lines.
 *
 * Range is unchanged (Christian, 2026-10-14): person and place contexts carry no
 * position, so only cards cast on bare land can be "too far". For bare land the map
 * evaluates the known hexes within the range gate's reach only — every hex past it is
 * "Too far from here." by the same gate, which the click on it still answers (§ Fail-soft)
 * — so the build never runs the gates once per hex of the whole map (kill criterion 6).
 *
 * Pure: reads the world, never writes it. A card the registry does not know, or a target
 * category with no builder, is "not a target" with the fail-soft words, never a throw.
 */
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types';
import type { TargetCategory } from '../../types/targetContext';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { WorldRef } from '../../types/worldRef';
import type { HexKey } from '../hexActorIndex';
import type { WheelSlot } from '../wheel';
import { AGENT_INTERVENTION_TEMPLATES, UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../../data/unified-action-templates';
import { actionBlockedReason } from '../../data/action-card-display';
import { ARMED_TARGET_WORDS, ARMED_WORDS } from '../../data/view-content';
import { TARGET_ACTION_CONSTANTS, templateIdFromSlotId } from '../targetActions';
import { hexDistance } from '../delivery';
import { isArmyGroupNode } from '../groupShape';
import { getAvatarHexPosition } from '../visibility';
import { actOnSlots, actOnTargetForRef, categoryFor, rowCardsKey, targetContextFor } from './subjects/actOn';
import { landNameFor } from './subjects/landName';
import { hexContentsIndexSelector, type HexContentsVM } from './hexContents';
import { isHexKnownFor } from './knowledge';
import { readView, type ViewSelector } from './readView';
import { godRailStamp } from './godRail';
import type { RefRow } from './types';

export type ArmedTargetState = 'castable' | 'locked' | 'not_a_target';

export interface CardOnTarget {
  state: ArmedTargetState;
  /** Why it is locked, in the card face's words; for not-a-target, the fail-soft line or null. */
  reason: string | null;
  /** The slot id the one cast path takes (`target_action_<id>`), when the card lands here. */
  slotId: string | null;
  /** The card face's own effect line for this target (the commit line's last sentence), or null. */
  effectsLine?: string | null;
}

/** The map's lighting (plan § D9): the lit and dim-lit hexes and their hover lines. */
export interface MapHighlightVM {
  lit: HexKey[];
  litLocked: HexKey[];
  hover: Record<HexKey, string>;
}

export interface ArmedTargetEntry {
  state: 'castable' | 'locked';
  reason: string | null;
  ref: WorldRef;
  name: string;
  /** The first hex the target was met on. */
  hexKey: HexKey;
  /** Every seen hex the target is on — a faction holds a hall on several (3–5 at seeding). */
  hexKeys: HexKey[];
  slotId: string | null;
}

export interface ArmedTargetsVM {
  actionId: string;
  /** The card's player-facing name (`spellName` where one exists, as the receipt says it). */
  cardName: string;
  /** "a person", "a place or open land". */
  targetWords: string;
  /** Lit refs, keyed by `refKey` (`kind:id`). */
  lit: Record<string, ArmedTargetEntry>;
  map: MapHighlightVM;
  /** "Nothing you can see is something Illuminating Whisper can touch.", or null. */
  emptyLine: string | null;
}

/** `kind:id` — the key a row and a lit entry share (`data-link-row`, `rowCardsKey`). */
export const refKey = rowCardsKey;

/** Law 14: the name the card face and the cast receipt use. */
export function armedCardName(template: Pick<UnifiedActionTemplate, 'name' | 'spellName'>): string {
  return template.spellName ?? template.name;
}

/** The categories a card lands on: its own list, or the person default (`targetCategories` doc). */
export function cardTargetCategories(template: Pick<UnifiedActionTemplate, 'targetCategories'>): readonly TargetCategory[] {
  return template.targetCategories && template.targetCategories.length > 0 ? template.targetCategories : ['actor'];
}

/** "a person", "a place or open land" — distinct words, in the card's own order. */
export function armedTargetWords(template: Pick<UnifiedActionTemplate, 'targetCategories'>): string {
  const words: string[] = [];
  for (const c of cardTargetCategories(template)) {
    const w = (ARMED_TARGET_WORDS as Record<string, string | undefined>)[c];
    if (w && !words.includes(w)) words.push(w);
  }
  return words.join(ARMED_WORDS.targetOr);
}

const AGENT_HAND_IDS = new Set(AGENT_INTERVENTION_TEMPLATES.map(t => t.id));
const OTHER_HAND_IDS = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));

const NOT_A_TARGET: CardOnTarget = { state: 'not_a_target', reason: null, slotId: null };

function slotFor(slots: readonly WheelSlot[], templateId: string): WheelSlot | undefined {
  return slots.find(s => s.id === templateId || templateIdFromSlotId(s.id) === templateId);
}

/**
 * One card on one target, through the Act row's gates with that one template. A person is
 * dealt the agent hand's set and everything else the full set (the drawer's split, § D9
 * way 1), so a card the target's Act row would not show is not a target here either.
 */
export function evaluateCardOnTarget(state: GameState, actionId: string, ref: WorldRef): CardOnTarget {
  const template = getUnifiedTemplateById(actionId);
  if (!template) return { state: 'not_a_target', reason: ARMED_WORDS.nowhere, slotId: null };
  const target = actOnTargetForRef(state, ref);
  if (!target) return NOT_A_TARGET;
  if (!acceptsTarget(cardTargetCategories(template), categoryFor(state, target).category, target.kind)) return NOT_A_TARGET;
  const handIds = target.kind === 'agent' ? AGENT_HAND_IDS : OTHER_HAND_IDS;
  if (!handIds.has(template.id)) return NOT_A_TARGET;
  const read = actOnSlots(state, target, [template]);
  const slot = read ? slotFor(read.slots, template.id) : undefined;
  if (!slot || (slot.type !== 'target_action' && slot.type !== 'intervention')) return NOT_A_TARGET;
  const effectsLine = slot.effectsLine ?? null;
  if (slot.available) return { state: 'castable', reason: null, slotId: slot.id, effectsLine };
  return { state: 'locked', reason: actionBlockedReason(slot.lockedReason, slot.rangeStatus) ?? null, slotId: slot.id, effectsLine };
}

/**
 * Whether a card's declared categories take this target. A faction is an actor node, and
 * eight cards declare `'faction'` (outside `TargetCategory`): those take a faction too.
 * The gates decide the rest; this only skips a read that cannot match.
 */
function acceptsTarget(declared: readonly string[], category: TargetCategory, kind: string): boolean {
  return declared.includes(category) || (kind === 'faction' && declared.includes('faction'));
}

/** The rows of a hex that a category's candidates come from. */
function candidatesOf(hex: HexContentsVM, category: TargetCategory | 'faction'): RefRow[] {
  switch (category) {
    case 'actor': return [...hex.people, ...hex.halls.map(h => ({ ref: h.ref, name: h.name }))];
    case 'location': return hex.locations;
    case 'sublocation': return hex.places;
    case 'artifact':
    case 'artifact_legendary': return hex.artifacts;
    case 'faction': return hex.halls.map(h => ({ ref: h.ref, name: h.name }));
    case 'hex': return [];
    // Authored data can carry a category outside the type (fail-soft): nothing to light.
    default: return [];
  }
}

function parseKey(key: HexKey): { col: number; row: number } | null {
  const [c, r] = key.split(',').map(Number);
  return Number.isFinite(c) && Number.isFinite(r) ? { col: c, row: r } : null;
}

/** Known land hexes the bare-land gate can reach: within the range of the avatar. */
function bareLandCandidates(state: GameState, tiles: readonly HexTile[]): HexKey[] {
  const avatar = getAvatarHexPosition(state.graph, state.ascendantId);
  if (!avatar) return [];
  const range = TARGET_ACTION_CONSTANTS.DEFAULT_LOCAL_RANGE;
  const keys: HexKey[] = [];
  if (tiles.length > 0) {
    for (const t of tiles) {
      if (hexDistance(avatar, t.coord) > range) continue;
      keys.push(`${t.coord.col},${t.coord.row}`);
    }
    return keys;
  }
  // No tiles (tests): the hexes in reach, by coordinates.
  for (let dc = -range; dc <= range; dc++) {
    for (let dr = -range; dr <= range; dr++) {
      const at = { col: avatar.col + dc, row: avatar.row + dr };
      if (at.col < 0 || at.row < 0 || hexDistance(avatar, at) > range) continue;
      keys.push(`${at.col},${at.row}`);
    }
  }
  return keys;
}

function emptyMap(): MapHighlightVM {
  return { lit: [], litLocked: [], hover: {} };
}

export function emptyArmedTargets(actionId: string, cardName = actionId, targetWords = ''): ArmedTargetsVM {
  return { actionId, cardName, targetWords, lit: {}, map: emptyMap(), emptyLine: ARMED_WORDS.empty.replace('{card}', cardName) };
}

/**
 * One card over the seen map. `index` is the hex → contents index (`hexContentsIndexSelector`);
 * `tiles` bound the bare-land candidates (empty in tests). World-keyed by the selector.
 */
export function buildArmedTargetsFrom(
  state: GameState,
  actionId: string,
  index: Readonly<Record<HexKey, HexContentsVM>>,
  tiles: readonly HexTile[] = [],
): ArmedTargetsVM {
  const template = getUnifiedTemplateById(actionId);
  if (!template) return emptyArmedTargets(actionId);
  const cardName = armedCardName(template);
  const targetWords = armedTargetWords(template);
  const lit: Record<string, ArmedTargetEntry> = {};
  const castableHexes = new Set<HexKey>();
  const lockedHexes = new Set<HexKey>();
  const hover: Record<HexKey, string[]> = {};

  const mark = (entry: ArmedTargetEntry, name: string, hexKey: HexKey) => {
    if (entry.state === 'castable') {
      castableHexes.add(hexKey);
      (hover[hexKey] ??= []).push(name);
    } else {
      lockedHexes.add(hexKey);
      (hover[hexKey] ??= []).push(entry.reason ? ARMED_WORDS.hoverLocked.replace('{name}', name).replace('{reason}', lowerFirst(entry.reason)) : name);
    }
  };

  const consider = (ref: WorldRef, name: string, hexKey: HexKey) => {
    const key = refKey(ref);
    const seen = lit[key];
    if (seen) {
      // The verdict is the ref's, not the hex's: light each further hex it stands on too.
      if (!seen.hexKeys.includes(hexKey)) {
        seen.hexKeys.push(hexKey);
        mark(seen, name, hexKey);
      }
      return;
    }
    const verdict = evaluateCardOnTarget(state, actionId, ref);
    if (verdict.state === 'not_a_target') return;
    const entry: ArmedTargetEntry = { state: verdict.state, reason: verdict.reason, ref, name, hexKey, hexKeys: [hexKey], slotId: verdict.slotId };
    lit[key] = entry;
    mark(entry, name, hexKey);
  };

  for (const category of cardTargetCategories(template) as readonly (TargetCategory | 'faction')[]) {
    if (category === 'hex') {
      for (const hexKey of bareLandCandidates(state, tiles)) {
        if (!isHexKnownFor('armedTargets', state, hexKey)) continue;
        const at = parseKey(hexKey);
        if (!at) continue;
        consider({ kind: 'hex', id: hexKey }, landNameFor(state, at.col, at.row), hexKey);
      }
      continue;
    }
    for (const [hexKey, hex] of Object.entries(index)) {
      if (!isHexKnownFor('armedTargets', state, hexKey)) continue;
      for (const row of candidatesOf(hex, category)) consider(row.ref, row.name, hexKey);
    }
  }

  // A hex with any castable target is lit; one with only locked targets is dim-lit.
  const litHexes = [...castableHexes].sort();
  const litLocked = [...lockedHexes].filter(k => !castableHexes.has(k)).sort();
  const hoverLines: Record<HexKey, string> = {};
  for (const [k, lines] of Object.entries(hover)) hoverLines[k] = lines.join(' · ');
  const any = Object.keys(lit).length > 0;
  return {
    actionId,
    cardName,
    targetWords,
    lit,
    map: { lit: litHexes, litLocked, hover: hoverLines },
    emptyLine: any ? null : ARMED_WORDS.empty.replace('{card}', cardName),
  };
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export interface ArmedTargetsArgs {
  actionId: string;
  /** Fog off (the debug lever): every hex counts as seen, as the lenses read it. */
  fogOff?: boolean;
  /**
   * What the verdicts read that moves without `worldVersion` (the pool, held actions,
   * covenants, the avatar's hex): a cast while paused must relight the map. Built by the
   * caller (`armedTargetsStamp`), the godRail lesson.
   */
  stamp?: string;
}

/**
 * What the verdicts read that a cast changes without moving `worldVersion`: the pool, the
 * held and pending actions, the god's covenants, and the avatar's hex (the range gate).
 * Lives here, not in `useCardArming`, so the UI reads no graph (NFP #2, the view-model seam).
 */
export function armedTargetsStamp(state: GameState): string {
  const at = state.graph.getNode(state.ascendantId)?.properties;
  return [godRailStamp(state), (state.controlEffects ?? []).length, at?.hexCol ?? '', at?.hexRow ?? '', state.visibilityMap?.size ?? 0].join('|');
}

/** World-keyed per card: people move every tick, and essence changes what is castable. */
export const armedTargetsSelector: ViewSelector<ArmedTargetsArgs, ArmedTargetsVM> = {
  id: 'armedTargets',
  invalidation: 'world',
  key: (args) => `${args.actionId}|${args.fogOff ? 'nofog' : 'fog'}|${args.stamp ?? ''}`,
  fallback: (args) => emptyArmedTargets(args.actionId),
  build(ctx, { actionId, fogOff }) {
    const index = readView(ctx.runtime, ctx.state, hexContentsIndexSelector, undefined, ctx.tiles);
    const state = fogOff ? { ...ctx.state, visibilityMap: new Map() } as GameState : ctx.state;
    return buildArmedTargetsFrom(state, actionId, index, ctx.tiles);
  },
};

/** The whole build in one call (tests, the measurement): reads the index fresh. */
export function buildArmedTargets(state: GameState, actionId: string, tiles: readonly HexTile[] = state.tiles ?? []): ArmedTargetsVM {
  const index = readView(null, state, hexContentsIndexSelector, undefined, tiles);
  return buildArmedTargetsFrom(state, actionId, index, tiles);
}

/** The name a cast on this ref lands on ("Cast on Shutash"), or null. */
export function armedTargetName(state: GameState, ref: WorldRef): string | null {
  const target = actOnTargetForRef(state, ref);
  return target ? targetContextFor(state, target)?.displayName ?? null : null;
}

/**
 * The world ref a map click on a node chooses: a person, a faction, an army, or a place
 * (either tier). Null for a node nothing on the map stands for.
 */
export function refForMapNode(state: Pick<GameState, 'graph'>, nodeId: string): WorldRef | null {
  const node = state.graph.getNode(nodeId);
  if (!node) return null;
  if (node.type === 'location') return { kind: node.properties.parentLocationId ? 'sublocation' : 'location', id: nodeId };
  if (node.type === 'artifact' || node.type === 'artifact_legendary') return { kind: 'artifact', id: nodeId };
  if (node.type !== 'actor') return null;
  if (isArmyGroupNode(node)) return { kind: 'army', id: nodeId };
  return node.properties.actorType === 'faction' ? { kind: 'faction', id: nodeId } : { kind: 'agent', id: nodeId };
}
