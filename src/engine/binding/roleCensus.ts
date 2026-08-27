/**
 * The role census — how the binder knows a role is scarce (THR-1296 §8).
 *
 * The scarcity term asks "how many clerks does this world have?" once per cast slot
 * per bind pass. Recon confirmed **no role index exists anywhere** and
 * `getNodesByType` is a full scan, so answering that question naively would be
 * O(all actors) per slot per step — precisely the shape NFP #7 exists to refuse.
 *
 * So it is a version-keyed lazy rebuild, copying `ensureEncounterCache` /
 * `ensureTraitRefIndex` discipline verbatim: built on demand, invalidated by
 * `structuralCacheVersion`, O(actors) only when the world's structure actually
 * changed. Mint and death sites already bump the version (and the binder's own mint
 * path calls `touchStructure` by contract), so the census can never serve a stale
 * world for longer than one structural change.
 *
 * Owned by `SimulationRuntime`, never module scope — a singleton here would carry
 * one playthrough's population into the next (the engine-caches-per-session rule).
 */
import type { WorldGraph } from '../graph';
import type { NpcRole } from '../../types/npc';
import { isAgentGone } from '../groups/groupQueries';
import { BINDER_ROLE_COMMODITY_THRESHOLD } from '../../data/binder-constants';

/** role → the live actors holding it. Roleless actors are deliberately absent. */
export type RoleCensus = Map<string, Set<string>>;

/**
 * Count every live actor by `npcRole`.
 *
 * **Gone actors are excluded.** A world whose only archmage died still reads as
 * having one if the census counts nodes rather than *live* nodes — and scarcity
 * driving reuse toward a corpse is exactly the "dead records poison scorers" failure
 * (THR-1286) this system is meant to avoid. Uses the same dual gone-test the registry
 * does, since a deceased echo keeps its node forever (THR-479).
 */
export function buildRoleCensus(graph: WorldGraph): RoleCensus {
  const census: RoleCensus = new Map();
  // `'actor'` + `actorType: 'individual'` is how the codebase finds people
  // (`agentLifecycle.ts:136` is the canonical shape). There is no `'agent'` member of
  // `NodeType` at all — `getNodesByType('agent')` returns an empty array forever, which
  // is a live defect at `phaseEconomicChronicle.ts:97` and is exactly the shape a role
  // census would inherit silently: an empty census reads as "no such role", which is
  // indistinguishable from a scarce world.
  for (const node of graph.getNodesByType('actor')) {
    if (node.properties?.actorType !== 'individual') continue;
    if (isAgentGone(node)) continue;
    const role = node.properties?.npcRole as string | undefined;
    if (!role) continue;
    let bucket = census.get(role);
    if (!bucket) {
      bucket = new Set<string>();
      census.set(role, bucket);
    }
    bucket.add(node.id);
  }
  return census;
}

/** How many live actors hold this role. */
export function roleCount(census: RoleCensus | null, role: string | undefined): number {
  if (!census || !role) return 0;
  return census.get(role)?.size ?? 0;
}

/**
 * Scarcity of a role, 0–1: `1` when nobody holds it, `0` at commodity saturation.
 *
 * Fail-soft (plan § Fail-soft table): an absent census reads **neutral 0.5** rather
 * than 0 or 1 — a missing cache must not masquerade as a measurement, in either
 * direction. Reading it as 1 would make every role look precious and stall minting;
 * reading it as 0 would make every role look disposable and flood it.
 */
export function scarcity01(census: RoleCensus | null, role: string | undefined): number {
  if (!census) return 0.5;
  const count = roleCount(census, role);
  return 1 - Math.min(1, count / BINDER_ROLE_COMMODITY_THRESHOLD);
}

/** Roles the world knows about — inspection surface for the CLI and debug bridge. */
export function censusRoles(census: RoleCensus | null): NpcRole[] {
  if (!census) return [];
  return Array.from(census.keys()) as NpcRole[];
}
