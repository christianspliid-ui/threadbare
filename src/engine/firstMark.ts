/**
 * The First's mark — the god's blessing on its First (THR-1644 D5, slice S3 THR-1755).
 *
 * Plan: `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md` § Engine step 5.
 *
 * At the bond, The First gains one visible `destiny` trait: the `GOD_GIVEN_TRAITS`
 * entry for their spark's reach (the meeting) or their primary reach (the card
 * route). It is worth one companion's skill in that reach — `computeRawScore`
 * sums its `domainContributions` like any trait — so the First succeeds more often
 * in their own reach and their story runs longer. Later threads get no mark.
 *
 * The eight definitions keep the existing `trait.god.*` ids. They are seeded at
 * world init (`seedFirstMarkTraits`, beside `seedEncounterTraitDefinitions`) and
 * minted lazily at the grant if missing, so `assignTrait` never throws on a world
 * built before this shipped.
 *
 * Fail-soft (NFP #4): an unknown reach skips the mark; the skip rides on the rite's
 * own `rite.applied` trace (`markSkipped`). Nothing throws.
 * PRNG: none — the mark is a pure function of the reach.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { ReachDomain, TraitDefinitionProperties } from '../types/traits';
import { GOD_GIVEN_TRAITS, type GodGivenTraitOption } from '../data/meeting-content';
import {
  FIRST_MARK_ENABLED,
  FIRST_MARK_IMPORTANCE,
  FIRST_MARK_REACH_CONTRIBUTION,
} from '../data/threading-rite-constants';
import { assignTrait } from './traits';

/** Tag every mark definition carries — how the sheet and the "exactly one" guard find it. */
export const FIRST_MARK_TAG = 'god_mark';

/** The `GOD_GIVEN_TRAITS` entry whose `reach` is `reach`, if any. */
function entryForReach(reach: ReachDomain | string | undefined): GodGivenTraitOption | undefined {
  if (!reach) return undefined;
  return GOD_GIVEN_TRAITS.find(t => t.reach === reach);
}

/** The mark trait id for a reach (`trait.god.iron_will` for `iron`), or undefined. */
export function markIdFor(reach: ReachDomain | string | undefined): string | undefined {
  return entryForReach(reach)?.id;
}

/** Build one mark definition node from its `GOD_GIVEN_TRAITS` entry. */
function markDefinitionNode(entry: GodGivenTraitOption): GraphNode {
  const properties: TraitDefinitionProperties = {
    // `destiny`, not `bestowed` (the plan's word): every `bestowed` trait node is
    // a Power candidate the reward pool deals as loot (`contentQuery` GRAPH_BACKED
    // power_template) and the sheet lists as a Bestowed Power. The mark is neither —
    // the god gives it to its First alone. `destiny` has no other producer.
    subcategory: 'destiny',
    description: entry.description,
    importance: FIRST_MARK_IMPORTANCE,
    maxLevel: 1,
    visibility: 'public',
    domainContributions: { [entry.reach]: FIRST_MARK_REACH_CONTRIBUTION },
    tags: [FIRST_MARK_TAG],
    flavorText: entry.description,
  };
  return {
    id: entry.id,
    type: 'trait',
    name: entry.name,
    properties: { ...properties, reach: entry.reach } as unknown as Record<string, unknown>,
  };
}

/** The eight mark definitions, one per reach. */
export const FIRST_MARK_TRAIT_DEFINITIONS: readonly GraphNode[] = GOD_GIVEN_TRAITS.map(markDefinitionNode);

/**
 * Insert every mark definition missing from `graph`. Idempotent, per-node (a
 * partially seeded graph is completed). Returns the number added.
 */
export function seedFirstMarkTraits(graph: WorldGraph): number {
  let added = 0;
  for (const node of FIRST_MARK_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) {
      graph.addNode({ ...node, properties: { ...node.properties } });
      added++;
    }
  }
  return added;
}

const MARK_IDS: ReadonlySet<string> = new Set(GOD_GIVEN_TRAITS.map(t => t.id));

/**
 * The mark trait id an agent already carries, if any. Matches the eight canonical
 * ids only — never a tag — so a copy of a mark minted under another id can neither
 * block the real grant nor stand in for it on the sheet.
 */
export function heldMarkId(graph: WorldGraph, agentId: string): string | undefined {
  for (const edge of graph.getOutgoingEdges(agentId, 'has_trait')) {
    if (MARK_IDS.has(edge.target)) return edge.target;
  }
  return undefined;
}

/** Why no mark was granted — recorded on the `rite.applied` trace. */
export type FirstMarkSkip = 'disabled' | 'unknown_reach';

export interface FirstMarkGrant {
  /** The mark the agent carries afterwards, if any. */
  readonly markId?: string;
  readonly skipped?: FirstMarkSkip;
}

/**
 * D5 — grant The First's mark for `reach`.
 *
 * A First carries exactly one mark: if the agent already holds one (a second
 * bond on the same mortal, a reload), that one is kept and returned.
 */
export function grantFirstMark(
  graph: WorldGraph,
  agentId: string,
  reach: ReachDomain | undefined,
  tick: number,
): FirstMarkGrant {
  if (!FIRST_MARK_ENABLED) return { skipped: 'disabled' };
  const held = heldMarkId(graph, agentId);
  if (held) return { markId: held };

  const entry = entryForReach(reach);
  if (!entry) return { skipped: 'unknown_reach' };

  // Lazy mint (the `capabilityGrowth` / `castChannel` pattern) so a world seeded
  // before S3 still takes the mark and `assignTrait` never throws.
  if (!graph.getNode(entry.id)) {
    const node = markDefinitionNode(entry);
    graph.addNode({ ...node, properties: { ...node.properties } });
  }
  assignTrait(graph, agentId, entry.id, { tick, source: 'threading_rite' });
  return { markId: entry.id };
}

/** Display shape for the sheet's mark chip — read from the `has_trait` edge (Law 56). */
export interface FirstMarkDisplay {
  readonly traitId: string;
  readonly name: string;
  /** "Their resolve holds where others break." */
  readonly line: string;
  readonly reach: ReachDomain;
  /** "fighting, standing guard, holding a line" — the tooltip's plain words. */
  readonly reachWork: string;
}

/** The mark an agent carries, ready for the sheet, or undefined. */
export function getFirstMarkDisplay(graph: WorldGraph, agentId: string): FirstMarkDisplay | undefined {
  const id = heldMarkId(graph, agentId);
  if (!id) return undefined;
  const entry = GOD_GIVEN_TRAITS.find(t => t.id === id);
  const node = graph.getNode(id);
  if (!entry || !node) return undefined;
  return {
    traitId: id,
    name: node.name,
    line: entry.markLine ?? entry.description,
    reach: entry.reach,
    reachWork: entry.reachWork ?? '',
  };
}
