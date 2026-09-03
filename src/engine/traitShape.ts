/**
 * Trait shape — where a trait's identity ends and a bearer's state begins (THR-1395).
 *
 * The ratified world-object model (THR-1394, `Docs/canon/world-objects.md`) settles one
 * rule for the Trait and Condition kinds: **a trait node is a shared definition, and
 * everything that varies per bearer lives on the `has_trait` edge** — level, acquired
 * tick, source, remaining ticks, visibility (`TraitAssignmentProperties`).
 *
 * Three writers had drifted from that and minted one node per bearer, embedding the
 * bearer's id in the node id:
 *
 * | writer | old node id | measured (seed 42, medium, tick 30) |
 * |---|---|---|
 * | `capabilityGrowth.applyEncounterGrowth` | `encounter_experience_<domain>_<agentId>` | 44 nodes, 44 bearers — one each |
 * | `encounterChains` chain-completion bonus | `trait.experience.chain.<chainId>.<agentId>` | latent at 30 ticks |
 * | `spellActivation` `condition_inflict` | `cond_<agentId>_<template>_<n>` | latent at 30 ticks |
 *
 * The measurement that mattered: **not one of those nodes carried a per-bearer property.**
 * Their `properties` were a pure function of the domain / chain / template, and the only
 * bearer-specific thing about them was the id. Every varying quantity was already on the
 * edge. So this is a de-duplication, not a migration of state — which is why
 * `TraitAssignmentProperties` needs no new field (an added field with no writer is dead
 * weight, and there was nothing left to move).
 *
 * It also closes a leak: `WorldGraph.removeNode` cascades incident edges, so a bearer's
 * death used to strand its experience node in the graph forever with no edge pointing at
 * it. A shared definition is *supposed* to outlive any one bearer.
 *
 * ─── Reading both shapes for one release ─────────────────────────
 * Worlds saved before this change hold per-bearer nodes. Every reader resolves a trait
 * definition by following `has_trait` to its target, so those worlds keep rendering with
 * no compatibility code at all — a legacy node is simply a definition with one bearer.
 * What does need care is the *writers'* find-or-create step: a legacy edge already points
 * at the old node, and re-minting under the new id would give one bearer two edges for one
 * trait (double-counted capability). `findExistingTraitEdge` is that lookup, and it accepts
 * both shapes — new id first, legacy id second — so a saved world keeps accruing onto the
 * edge it already has instead of growing a second one.
 */

import type { GraphEdge } from '../types/graph';
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';

/**
 * The shared definition node for accumulated encounter experience in one reach.
 * One node per domain — at most eight in any world, however many mortals live in it.
 */
export function experienceTraitId(domain: ReachDomain): string {
  return `trait.experience.${domain}`;
}

/** @deprecated The pre-THR-1395 per-bearer id. Read-only: nothing mints this shape. */
export function legacyExperienceTraitId(domain: ReachDomain, agentId: string): string {
  return `encounter_experience_${domain}_${agentId}`;
}

/**
 * The shared definition node for completing an encounter chain end to end.
 * One node per chain, not one per (chain, agent).
 *
 * The old per-bearer id made the grant idempotent *by construction* — a second call
 * re-derived the same node id and the presence check caught it. A shared definition
 * cannot carry that guarantee, so idempotence moves to where it belonged anyway: the
 * bearer's own `has_trait` edge. `findExistingTraitEdge` over both ids is that check.
 */
export function chainMasteryTraitId(chainId: string): string {
  return `trait.experience.chain.${chainId}`;
}

/** @deprecated The pre-THR-1395 per-bearer id. Read-only: nothing mints this shape. */
export function legacyChainMasteryTraitId(chainId: string, agentId: string): string {
  return `chain_mastery_${chainId}_${agentId}`;
}

/**
 * The shared definition node for a condition template inflicted by a spell cost.
 * One node per template — every bearer of "burned" points at the same "burned".
 */
export function conditionTraitId(template: string): string {
  return `trait.condition.${template}`;
}

/**
 * Find a bearer's existing `has_trait` edge for a trait that may be recorded under
 * either the shared definition id or a legacy per-bearer id (saved worlds, one release).
 *
 * Returns the first match in the order given, so a world that somehow holds both keeps
 * accruing onto the shared one.
 */
export function findExistingTraitEdge(
  graph: WorldGraph,
  bearerId: string,
  traitIds: readonly string[],
): GraphEdge | undefined {
  const edges = graph.getOutgoingEdges(bearerId, 'has_trait');
  for (const traitId of traitIds) {
    const found = edges.find(e => e.target === traitId);
    if (found) return found;
  }
  return undefined;
}
