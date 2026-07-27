/**
 * Trait Definition Seeding — insert the encounter-owned trait *definition* nodes
 * into a world graph at construction time.
 *
 * ─── Why this exists (THR-809) ──────────────────────────────────
 * `MASTERY_TRAIT_DEFINITIONS` + `CONDITION_TRAIT_DEFINITIONS` used to reach the
 * graph only through `phaseEncounterTraits.ensureTraitNodes`, which is called
 * from `processEncounterMastery` / `processEncounterConditions`. Those run inside
 * the orchestrator's loop over the legacy `state.encounterProgress` collection —
 * which the unified-action pipeline no longer populates. The loop body never
 * executed, so the 13 definition nodes were never inserted in a live run.
 *
 * The visible consequence: every `condition_attachment` / `apply_condition`
 * aftermath effect naming one of these conditions took the `template_missing`
 * fail-soft branch and silently no-opped. A lost tavern brawl wounded nobody,
 * because `trait.condition.wounded` did not exist to point a `has_trait` edge at.
 *
 * ─── Verdict: init-time, not resolver-lazy ──────────────────────
 * Seeding here makes definition presence an *invariant* of every world graph
 * rather than a race against whichever system happens to fire first. It is the
 * same shape `initializeGameState` already uses for `ACTION_TEMPLATES`, and it
 * removes the need for any presence check at the effect-resolution site.
 *
 * The sibling families are deliberately NOT seeded here — each is already
 * inserted by a phase that is registered and runs every tick, and moving them
 * would be a behavioural change with no defect behind it:
 *
 * | Family      | Inserted by                                    | Registered at            |
 * |-------------|------------------------------------------------|--------------------------|
 * | economic    | `phaseEconomicTraits.ensureTraitNodes`          | orchestrator (tick loop) |
 * | reputation  | `phaseReputationTraits.ensureReputationTraitNodes` | orchestrator (tick loop) |
 * | core        | `corePersonality.ensureCoreTraitNodes`          | phases/index.ts          |
 * | personality | `personalityTraitEmerge.ensurePersonalityTraitNodes` | phases/index.ts     |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                     | Fallback                            |
 * |----------------------------------|-------------------------------------|
 * | Definition id already in graph   | Skip that node, continue the rest    |
 *
 * Per-node checks are load-bearing, not defensive. The previous guard
 * short-circuited on `allDefs[0]` — a *mastery* id — so once any other path
 * minted that single node the remaining 12 were skipped permanently.
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None — insertion is deterministic and order-stable.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { MASTERY_TRAIT_DEFINITIONS } from '../data/mastery-trait-content';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';

/**
 * The encounter-owned trait definition families seeded at world construction.
 * Exported so tests can assert over the shipped definitions rather than a
 * hand-copied id list (which would go vacuous the moment a definition is added).
 */
export const ENCOUNTER_TRAIT_DEFINITIONS: readonly GraphNode[] = [
  ...MASTERY_TRAIT_DEFINITIONS,
  ...CONDITION_TRAIT_DEFINITIONS,
];

/**
 * Insert every encounter-owned trait definition node missing from `graph`.
 *
 * Idempotent and safe to call more than once on the same graph: each node is
 * checked individually, so a partially-seeded graph is completed rather than
 * skipped. Returns the number of nodes actually added (0 on a repeat call).
 */
export function seedEncounterTraitDefinitions(graph: WorldGraph): number {
  let added = 0;
  for (const node of ENCOUNTER_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) {
      graph.addNode(node);
      added++;
    }
  }
  return added;
}
