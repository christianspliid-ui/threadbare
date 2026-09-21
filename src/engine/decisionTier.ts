/**
 * The tier whose actors run the autonomous decision loop — a leaf module (THR-1348).
 *
 * `isAutonomousDecisionActor` is shared by `phaseAgentDecision`, the reachability
 * census (`strategicKindReachability`, which re-exports it so every existing import
 * keeps working) and the spotlight pull. It lives here, with only type imports,
 * because the pull runs inside `assignAmbitionToActor`, which `agentLifecycle`
 * imports, which `undertaking-objects` imports — and `strategicKindReachability`
 * pulls in `strategicActionCandidates` → `undertaking-cells`, which reads
 * `UNDERTAKING_OBJECT_TYPES` at module load. Importing the predicate from there
 * closed that ring and `UNDERTAKING_CELL_TEMPLATES` evaluated against an
 * uninitialised registry (`generate-undertaking-grid` and
 * `dormantKindsPowersConditions.test.ts` both crashed on `flatMap` of undefined).
 * One predicate, one home, no cycle.
 */
import type { GraphNode } from '../types/graph';

/**
 * Legacy nodes without `spotlightTier` default to `spotlight`, matching
 * `phaseAgentDecision`'s own read — the default is load-bearing, not cosmetic,
 * because worldgen-era fixtures omit the property entirely.
 */
export const AUTONOMOUS_DECISION_TIER = 'spotlight';

/**
 * Does this node reach the autonomous decision loop at all?
 *
 * **Shared with `phaseAgentDecision` on purpose (THR-1329).** An instrument that
 * re-implements the population it measures drifts away from it silently, and then
 * reports reachability for a loop that no longer exists. The avatar exclusion stays
 * at the call site: the decision phase skips the player's avatar because the player
 * drives it, which is not a statement about whether the tier has agency.
 */
export function isAutonomousDecisionActor(node: GraphNode): boolean {
  return node.properties.actorType === 'individual'
    && (node.properties.spotlightTier ?? AUTONOMOUS_DECISION_TIER) === AUTONOMOUS_DECISION_TIER;
}
