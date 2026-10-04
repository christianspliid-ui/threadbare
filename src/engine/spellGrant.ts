/**
 * The one grant seam — every way a mortal comes to know a spell (THR-1672).
 *
 * Plan: `Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md` § Systems design.
 * THR-1231 ruled that all five acquisition channels exist and that one minting seam
 * serves them, differing only in trigger and selector. Before this module the three
 * live channels each wrote their own pair of edges: worldgen's seeded knowing
 * (`seedSpellKnowing`), study (`create × Power`, `learn_spell`) and the review lever
 * (`applySpellStamp`). They now all call {@link grantSpell}, and so do the two new ones —
 * a god teaching (`source: 'divine'`) and a book teaching (`source: 'tome'`).
 *
 * Known and wielded stay two facts (THR-1231): the `knows_spell` edge is the biography
 * and is unlimited, the `has_trait` edge is what the mortal carries and is capped by
 * `SLOT_CAPS.spell`. A grant past the cap is known and not carried, never a refusal.
 *
 * The edge records where the spell came from (`source`, and `grantedBy` / `viaItemId`
 * for the two new channels), which is what the sheet's provenance line and the cast
 * resolver's divine echo read.
 *
 * No `Math.random()`: the pools are sorted, and each pick is one hash keyed on stable
 * identities (the reader's name, never a counter id — the THR-1572 same-seed lesson).
 * Every entry point is fail-soft (NFP #4).
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { SpellTemplate } from '../types/effects';
import { FOUNDATION_SPHERE_NAMES } from '../types';
import { resolveSpellTemplate, spellDefinitionNodeId } from '../data/spell-templates';
import { SLOT_CAPS } from '../data/attachment-slot-constants';
import {
  DIVINE_TEACH_MAX_TIER,
  SPELL_GRANT_ENABLED_DIVINE,
  SPELL_GRANT_ENABLED_TOMES,
  TOME_ANCIENT_MIN_GENERATED_BAND,
  TOME_ANCIENT_TAG,
  TOME_ARCANE_TAG,
  TOME_EXCLUDED_TAG,
  TOME_MAX_TIER,
  TOME_SUBCATEGORY,
  TOME_TEACHES_ONCE_PER_READER,
  TOME_TEACHING_GENERATED_CORES,
} from '../data/spell-grant-constants';
import { emitTrace } from './traceBuffer';
import { spellProvenance } from './spellGenerator/notice';
import { getTraditionLibrary } from './spellGenerator/libraryRead';
import { casterSeedIdentity, casterTraditionOf } from './spellGenerator/casterTradition';
import { checkPrerequisites } from './spellActivation';
import { mulberry32 } from '../lib/prng';
import { hashSeed, pickFrom } from './naming/workNames';

// ═══════════════════════════════════════════════════════════════════
// The seam
// ═══════════════════════════════════════════════════════════════════

export type SpellGrantSource = 'seeded' | 'learn_spell' | 'debug' | 'divine' | 'tome';

export interface SpellGrantOptions {
  readonly source: SpellGrantSource;
  readonly tick: number;
  /** The ascendant id, for `'divine'`. */
  readonly grantedBy?: string;
  /** The item node, for `'tome'`. */
  readonly viaItemId?: string;
  /** The tradition, as THR-1572 writes on library-seeded and library-learned edges. */
  readonly tradition?: string;
  /** The shelf word on the edge; defaults to the definition node's sphere. */
  readonly sphereAffinity?: string;
  /** Debug only: when the slots are full, the lowest (first by id) wielded spell gives up its slot. */
  readonly evictWhenFull?: boolean;
  /** Debug only: a spell already known is still taken up (wielded) rather than refused. */
  readonly wieldIfKnown?: boolean;
}

export interface SpellGrantResult {
  readonly granted: boolean;
  /** Carried after the grant. False when the slots were full: known, not carried. */
  readonly wielded: boolean;
  /** This grant wrote the `has_trait` edge (a spell already carried is not newly wielded). */
  readonly newlyWielded: boolean;
  readonly spellId?: string;
  readonly spellName?: string;
  readonly definitionId?: string;
  readonly knowsEdgeId?: string;
  readonly refused?: 'unknown_spell' | 'already_known' | 'missing_actor';
}

const REFUSED = (refused: NonNullable<SpellGrantResult['refused']>): SpellGrantResult =>
  ({ granted: false, wielded: false, newlyWielded: false, refused });

function isSpellNode(graph: WorldGraph, id: string): boolean {
  return graph.getNode(id)?.properties.subcategory === 'spell';
}

/** Accept a template id (`spell_veilwalk`) or a definition node id (`power.spell.spell_veilwalk`). */
function templateIdOf(id: string): string {
  const prefix = spellDefinitionNodeId('');
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

/**
 * Teach `actorId` a spell. Writes `knows_spell { learnedTick, sphereAffinity, source,
 * tradition?, grantedBy?, viaItemId? }`, and `has_trait` while a slot is free. Emits
 * `spell.granted`. Never throws.
 */
export function grantSpell(graph: WorldGraph, actorId: string, spellId: string, opts: SpellGrantOptions): SpellGrantResult {
  try {
    if (!graph.getNode(actorId)) return REFUSED('missing_actor');
    const spell = resolveSpellTemplate(graph, templateIdOf(spellId));
    if (!spell) return REFUSED('unknown_spell');
    const definitionId = spellDefinitionNodeId(spell.id);
    const definition = graph.getNode(definitionId);
    if (!definition) return REFUSED('unknown_spell');

    const knowsEdgeId = `knows_spell_${actorId}_${definitionId}`;
    const alreadyKnown = graph.getOutgoingEdges(actorId, 'knows_spell').some(e => e.target === definitionId);
    if (alreadyKnown && !opts.wieldIfKnown) return REFUSED('already_known');

    // Known — always, and first. The biography is what the seam exists to write.
    if (!alreadyKnown) {
      const sphereAffinity = opts.sphereAffinity
        ?? (typeof definition.properties.sphereAffinity === 'string' ? definition.properties.sphereAffinity : undefined)
        ?? 'unaligned';
      graph.addEdge({
        id: knowsEdgeId,
        source: actorId,
        target: definitionId,
        type: 'knows_spell',
        properties: {
          learnedTick: opts.tick,
          sphereAffinity,
          source: opts.source,
          ...(opts.tradition ? { tradition: opts.tradition } : {}),
          ...(opts.grantedBy ? { grantedBy: opts.grantedBy } : {}),
          ...(opts.viaItemId ? { viaItemId: opts.viaItemId } : {}),
        },
      });
    }

    // Wielded — only while a slot is free (the attachment system's own cap).
    const wieldedEdges = graph.getOutgoingEdges(actorId, 'has_trait').filter(e => isSpellNode(graph, e.target));
    let wielded = wieldedEdges.some(e => e.target === definitionId);
    let newlyWielded = false;
    if (!wielded) {
      const cap = SLOT_CAPS.spell ?? 0;
      let carried = wieldedEdges.length;
      if (carried >= cap && opts.evictWhenFull && wieldedEdges.length > 0) {
        const lowest = [...wieldedEdges].sort((a, b) => a.target.localeCompare(b.target))[0];
        graph.removeEdge(lowest.id);
        carried -= 1;
      }
      if (carried < cap) {
        graph.addEdge({
          id: `has_trait_${actorId}_${definitionId}`,
          source: actorId,
          target: definitionId,
          type: 'has_trait',
          properties: {
            level: 1,
            acquiredTick: opts.tick,
            ticksRemaining: null,
            source: opts.source,
            visibility: 'discoverable',
            modifiers: {},
          },
        });
        wielded = true;
        newlyWielded = true;
      }
    }

    traceSafe({
      category: 'spell.granted',
      tick: opts.tick,
      agentId: actorId,
      spellId: spell.id,
      source: opts.source,
      wielded,
      ...(opts.grantedBy ? { grantedBy: opts.grantedBy } : {}),
      ...(opts.viaItemId ? { viaItemId: opts.viaItemId } : {}),
      summary: `${graph.getNode(actorId)?.name ?? actorId} comes to know ${spell.name} (${opts.source})${wielded ? '' : ', with no room to carry it'}`,
    });

    return { granted: true, wielded, newlyWielded, spellId: spell.id, spellName: spell.name, definitionId, knowsEdgeId };
  } catch {
    return REFUSED('unknown_spell');
  }
}

/** A transgression, in THR-1572's sense: a generated spell whose provenance carries a notice. */
export function isDarkSpell(graph: WorldGraph, spellId: string): boolean {
  try {
    return !!spellProvenance(graph, templateIdOf(spellId))?.notice;
  } catch {
    return false;
  }
}

/** The `knows_spell` edge an actor holds to a spell, or undefined. */
export function knowsSpellEdge(graph: WorldGraph, actorId: string, spellId: string) {
  const definitionId = spellDefinitionNodeId(templateIdOf(spellId));
  return graph.getOutgoingEdges(actorId, 'knows_spell').find(e => e.target === definitionId);
}

// ═══════════════════════════════════════════════════════════════════
// Pools
// ═══════════════════════════════════════════════════════════════════

export interface SpellPick {
  readonly spellId: string;
  readonly spellName: string;
  readonly tier: number;
  readonly dark: boolean;
}

/** Every spell the actor does not yet know and could hold, sorted by id (NFP #3). */
function candidateSpells(graph: WorldGraph, actorId: string, maxTier: number): SpellTemplate[] {
  const known = new Set<string>();
  for (const e of graph.getOutgoingEdges(actorId, 'knows_spell')) known.add(e.target);
  for (const e of graph.getOutgoingEdges(actorId, 'has_trait')) if (isSpellNode(graph, e.target)) known.add(e.target);
  const out: SpellTemplate[] = [];
  const nodes = graph.getNodesByType('trait')
    .filter(n => n.properties.subcategory === 'spell')
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const node of nodes) {
    if (known.has(node.id)) continue;
    const templateId = typeof node.properties.spellTemplateId === 'string' ? node.properties.spellTemplateId : templateIdOf(node.id);
    const spell = resolveSpellTemplate(graph, templateId);
    if (!spell || spell.tier > maxTier) continue;
    if (!checkPrerequisites(graph, actorId, spell).met) continue;
    out.push(spell);
  }
  return out;
}

/** The lowest tier of the first non-empty preference, then one hashed pick. */
function pickPreferred(graph: WorldGraph, tiers: readonly (readonly SpellTemplate[])[], key: string): SpellPick | null {
  const shelf = tiers.find(t => t.length > 0);
  if (!shelf) return null;
  const lowest = Math.min(...shelf.map(s => s.tier));
  const pool = shelf.filter(s => s.tier === lowest).sort((a, b) => a.id.localeCompare(b.id));
  const spell = pickFrom(mulberry32(hashSeed(key)), pool);
  return spell ? { spellId: spell.id, spellName: spell.name, tier: spell.tier, dark: isDarkSpell(graph, spell.id) } : null;
}

/**
 * The tradition this mortal was taught by: off their edge, else derived (THR-1572). The
 * derivation is keyed on the world seed, so without one (a possession writer with no
 * state in hand) only the edge is trusted — a guessed seed would name a different
 * tradition than seeding and study assign the same mortal.
 */
function traditionOfActor(graph: WorldGraph, actorId: string, worldSeed: number | undefined): string | undefined {
  const edge = graph.getOutgoingEdges(actorId, 'knows_spell')
    .filter(e => typeof e.properties.tradition === 'string')
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (edge) return String(edge.properties.tradition);
  if (worldSeed === undefined) return undefined;
  try {
    return casterTraditionOf(graph, actorId, worldSeed);
  } catch {
    return undefined;
  }
}

function traditionShelf(graph: WorldGraph, actorId: string, worldSeed: number | undefined, candidates: readonly SpellTemplate[]): SpellTemplate[] {
  const tradition = traditionOfActor(graph, actorId, worldSeed);
  if (!tradition) return [];
  const ids = new Set(getTraditionLibrary(graph, tradition).map(s => s.id));
  return candidates.filter(c => ids.has(c.id));
}

/**
 * The spell a god would teach this mortal now (Lane decision 2): the god's primary
 * sphere, then secondary, then the mortal's own tradition library — tier ≤
 * `DIVINE_TEACH_MAX_TIER`, prerequisites met, lowest tier first, one hashed pick.
 * Null when there is nothing to teach. Read-only, so the card can show it before play —
 * and keyed without the tick, so the spell the card names is the spell the cast teaches
 * even when it resolves a tick later. The pool shrinks as they learn, so a second
 * teaching picks again.
 */
export function pickDivineSpell(
  graph: WorldGraph,
  ascendantId: string,
  targetId: string,
  worldSeed: number,
  maxTier: number = DIVINE_TEACH_MAX_TIER,
): SpellPick | null {
  try {
    if (!graph.getNode(targetId)) return null;
    const candidates = candidateSpells(graph, targetId, maxTier);
    if (candidates.length === 0) return null;
    const alignment = graph.getNode(ascendantId)?.properties.sphereAlignment as { primary?: string; secondary?: string } | undefined;
    const bySphere = (sphere: string | undefined) => (sphere ? candidates.filter(c => c.sphereAffinity === sphere) : []);
    return pickPreferred(
      graph,
      [bySphere(alignment?.primary), bySphere(alignment?.secondary), traditionShelf(graph, targetId, worldSeed, candidates)],
      `teach:${worldSeed}:${ascendantId}:${casterSeedIdentity(graph, targetId)}`,
    );
  } catch {
    return null;
  }
}

/**
 * What a teaching card would teach this target now, for the card's line (THR-1672 § UI).
 * `null` when the target is a mortal with nothing left to learn from this god;
 * `undefined` when the target is not a mortal (the card does not apply, so no gate).
 */
export function spellTeachingPreview(
  graph: WorldGraph,
  ascendantId: string,
  targetId: string,
  worldSeed: number,
): { spellName: string; dark: boolean } | null | undefined {
  if (graph.getNode(targetId)?.type !== 'actor') return undefined;
  if (!SPELL_GRANT_ENABLED_DIVINE) return null;
  const pick = pickDivineSpell(graph, ascendantId, targetId, worldSeed);
  return pick ? { spellName: pick.spellName, dark: pick.dark } : null;
}

/** The `spell_grant` reaction's `'tradition'` selector: the mortal's own tradition library only. */
export function pickTraditionSpell(graph: WorldGraph, targetId: string, worldSeed: number, maxTier: number = DIVINE_TEACH_MAX_TIER): SpellPick | null {
  try {
    if (!graph.getNode(targetId)) return null;
    const candidates = candidateSpells(graph, targetId, maxTier);
    return pickPreferred(graph, [traditionShelf(graph, targetId, worldSeed, candidates)], `teach_tradition:${worldSeed}:${casterSeedIdentity(graph, targetId)}`);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Books that teach (Lane decision 6)
// ═══════════════════════════════════════════════════════════════════

export type TomeKind = 'arcane' | 'ancient';

/**
 * Whether a book teaches, and which kind it is: a `tomes_scrolls` item tagged `#ancient`
 * or `#arcane` and not `#map`, or a generated forbidden book (ancient from
 * `TOME_ANCIENT_MIN_GENERATED_BAND`). Null for everything else.
 */
export function tomeTeaches(node: Pick<GraphNode, 'properties'> | undefined): TomeKind | null {
  if (!node) return null;
  const props = node.properties;
  const generated = props.generated as { coreId?: string; band?: number } | undefined;
  if (props.origin === 'generated' && generated?.coreId && TOME_TEACHING_GENERATED_CORES.includes(generated.coreId)) {
    return Number(generated.band ?? props.tier ?? 0) >= TOME_ANCIENT_MIN_GENERATED_BAND ? 'ancient' : 'arcane';
  }
  if (props.subcategory !== TOME_SUBCATEGORY) return null;
  const tags = Array.isArray(props.tags) ? (props.tags as unknown[]).map(String) : [];
  if (tags.includes(TOME_EXCLUDED_TAG)) return null;
  if (tags.includes(TOME_ANCIENT_TAG)) return 'ancient';
  if (tags.includes(TOME_ARCANE_TAG)) return 'arcane';
  return null;
}

/**
 * The spell a book teaches this reader (§ G3 pool). Ancient books prefer elder
 * (Foundation-sphere) magic; arcane books prefer the reader's own tradition, then spells
 * of the book's Reach. Tier ≤ min(the book's tier, `TOME_MAX_TIER[kind]`).
 */
export function pickTomeSpell(graph: WorldGraph, item: GraphNode, readerId: string, worldSeed: number | undefined, tick: number): SpellPick | null {
  try {
    const kind = tomeTeaches(item);
    if (!kind) return null;
    const itemTier = Number(item.properties.tier ?? 1) || 1;
    const candidates = candidateSpells(graph, readerId, Math.min(itemTier, TOME_MAX_TIER[kind]));
    if (candidates.length === 0) return null;
    const generated = item.properties.generated as { seedKey?: string } | undefined;
    const key = `tome:${worldSeed ?? 'unseeded'}:${generated?.seedKey ?? item.name}:${casterSeedIdentity(graph, readerId)}:${tick}`;
    if (kind === 'ancient') {
      const foundation = new Set<string>(FOUNDATION_SPHERE_NAMES);
      return pickPreferred(graph, [candidates.filter(c => foundation.has(c.sphereAffinity)), candidates], key);
    }
    const tags = Array.isArray(item.properties.tags) ? (item.properties.tags as unknown[]).map(t => String(t).replace(/^#/, '')) : [];
    const ofReach = candidates.filter(c => (c.castReach && tags.includes(c.castReach))
      || Object.keys(c.prerequisites.minReach ?? {}).some(r => tags.includes(r)));
    return pickPreferred(graph, [traditionShelf(graph, readerId, worldSeed, candidates), ofReach, candidates], key);
  } catch {
    return null;
  }
}

export type ItemAcquiredVia = 'reward' | 'minted' | 'seized';

export interface ItemAcquiredTeaching {
  readonly spellId: string;
  readonly spellName: string;
  readonly wielded: boolean;
}

/**
 * A book came into a mortal's hands. If it teaches, and has not taught this holder
 * already, it teaches them one spell (`source: 'tome'`, `viaItemId`) and remembers the
 * reader on `taughtHolderIds`. Called after the `possesses` write at the three possession
 * writers. Returns the teaching, or null. Never throws: the item stays possessed.
 */
export function onItemAcquired(
  graph: WorldGraph,
  holderId: string,
  itemId: string,
  tick: number,
  via: ItemAcquiredVia,
  /** Omit when unknown: the reader's tradition is then read off their edge only. */
  worldSeed?: number,
): ItemAcquiredTeaching | null {
  try {
    if (!SPELL_GRANT_ENABLED_TOMES) return null;
    const item = graph.getNode(itemId);
    const kind = tomeTeaches(item);
    if (!item || !kind) return null;
    if (graph.getNode(holderId)?.type !== 'actor') return null;
    const taught = Array.isArray(item.properties.taughtHolderIds) ? (item.properties.taughtHolderIds as string[]) : [];
    if (TOME_TEACHES_ONCE_PER_READER && taught.includes(holderId)) return null;

    const pick = pickTomeSpell(graph, item, holderId, worldSeed, tick);
    if (!pick) {
      traceSafe({
        category: 'spell.tome_unread', tick, agentId: holderId, itemId, kind,
        summary: `${item.name} has nothing left to teach ${graph.getNode(holderId)?.name ?? holderId} (${via})`,
      });
      return null;
    }
    const result = grantSpell(graph, holderId, pick.spellId, { source: 'tome', tick, viaItemId: itemId });
    if (!result.granted) return null;
    graph.updateNode(itemId, { properties: { ...item.properties, taughtHolderIds: [...taught, holderId] } });
    return { spellId: pick.spellId, spellName: pick.spellName, wielded: result.wielded };
  } catch {
    traceSafe({
      category: 'spell.grant_skipped', tick, agentId: holderId, source: 'tome', reason: 'gate',
      summary: `a book could not teach ${holderId}: the teaching threw and was skipped`,
    });
    return null;
  }
}

function traceSafe(entry: Record<string, unknown>): void {
  try {
    emitTrace(entry as Parameters<typeof emitTrace>[0]);
  } catch {
    /* NFP #4 — a trace that cannot be written must not take the grant with it */
  }
}
