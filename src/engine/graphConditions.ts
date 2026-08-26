// src/engine/graphConditions.ts
// Pure evaluator for GraphCondition objects against a minimal graph interface.
// Used by milestone and abandonment checks in the ambition system.

import type { GraphCondition } from '../types/ambition';
import { collectBearerTraitRefs, bearerMatchesPredicate } from './traitRefIndex';
import { readResidence, dwellTicks, isAwayFromOrigin } from './agentResidence';

/**
 * Minimal graph interface — keeps this module testable without the full WorldGraph.
 *
 * `name` is optional and additive (THR-786): the shared trait-ref walk resolves a
 * trait by display name as well as by id/tag, and a node's display name lives at the
 * node level. Existing implementors that omit it keep working — a missing name simply
 * contributes no name ref.
 *
 * **Method syntax, not arrow properties** (THR-822). Under `strictFunctionTypes` a
 * function-valued *property* is checked contravariantly in its parameters, so
 * `getOutgoingEdges(id, type?: string)` written as a property rejects `WorldGraph`'s
 * narrower `(id, edgeType?: EdgeType)` — meaning the real graph could not be passed to
 * anything typed against this view, and every such call site was a type error. Method
 * syntax is bivariant, which is the correct and intended behaviour for a structural
 * view whose only use is calling these three.
 */
export interface ConditionGraph {
  /**
   * `type` is optional and additive on the same terms as `name` above (THR-841): the
   * region walk has to tell a `region` node from a `location` one, and node type lives
   * at the node level. Implementors that omit it keep working — a node with no `type`
   * simply never satisfies the region test, which fails soft to "region unknown".
   */
  getNode(id: string): { id: string; name?: string; type?: string; properties: Record<string, unknown> } | undefined;
  getOutgoingEdges(id: string, type?: string): ReadonlyArray<{
    source: string;
    target: string;
    type: string;
    properties: Record<string, unknown>;
  }>;
  getIncomingEdges(id: string, type?: string): ReadonlyArray<{
    source: string;
    target: string;
    type: string;
    properties: Record<string, unknown>;
  }>;
}

/**
 * The engine's death flag, in one place (THR-808).
 *
 * `properties.deceased === true` is the *only* death signal with real writers —
 * `aspects.ts` sets it when a mortal is consumed, `groups/bandOpposition.ts` when a
 * victim falls, and `agentLifecycle` / `groupCohesion` / the three personality phases
 * all read it. Two neighbouring spellings are deliberately NOT accepted here because
 * nothing in the repo writes either one, so honouring them would encode a phantom:
 *
 * - `properties.status === 'dead'` — was read once (by the retired initiative phase), written
 *   nowhere. That read was repointed at `isAgentGone` in THR-812; the spelling now has
 *   neither a reader nor a writer outside the permissive `isAgentGone` / `groupCohesion`
 *   accepts, which tolerate it rather than depend on it.
 * - `properties.eliminated === true` — was read once (`target_agent_eliminated`, below),
 *   written nowhere. Repointed here in THR-812; the spelling now has zero readers.
 */
function isDeceased(node: { properties: Record<string, unknown> }): boolean {
  return node.properties.deceased === true;
}

/**
 * How far up the sublocation chain `resolveRegionId` will walk before giving up.
 *
 * The position model is three tiers deep by design (hex → location → sublocation), so
 * 4 is slack, not a limit anyone should reach. It exists because the walk follows a
 * mutable property rather than a validated tree: a `parentLocationId` cycle introduced
 * by a future writer would otherwise hang the tick loop, and a hang inside a milestone
 * check is a hang inside `phaseAmbitionProgress` (NFP #4 — the tick loop must never
 * crash, and must never stall either).
 */
const MAX_PARENT_WALK_DEPTH = 4;

/** The location (or sublocation) an agent currently stands on, via `located_at`. */
function agentPositionId(graph: ConditionGraph, agentId: string): string | undefined {
  if (!graph.getNode(agentId)) return undefined;
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  return edges.length > 0 ? edges[0].target : undefined;
}

/**
 * Resolve the region a location sits in, **from the graph alone** (THR-841).
 *
 * Region membership is a `contains` edge from a `region` node, minted at seed
 * (`worldSeed.ts`) — not a property on the location. That is the load-bearing shape:
 * a relationship between two entities is an edge, and the `regionId` property this
 * replaces was the property-bag spelling of exactly that relationship, which is why it
 * never acquired a writer.
 *
 * Resolving by *edge* rather than by a stamped property is also what keeps this off
 * the rake THR-822 named: there are 24 location-creation sites in `src/` today, and
 * stamping a region onto each would strand every future 25th one at no region at all,
 * silently. The edge is minted in one pass over every location worldgen creates.
 *
 * A sublocation carries no region edge of its own, so the walk climbs
 * `parentLocationId` to the location that does — bounded by `MAX_PARENT_WALK_DEPTH`.
 *
 * Returns `undefined` when the region genuinely cannot be determined; every caller
 * treats that as "we do not know" and fails soft to `false`.
 */
function resolveRegionId(graph: ConditionGraph, locationId: string | undefined): string | undefined {
  let currentId = locationId;

  for (let depth = 0; depth < MAX_PARENT_WALK_DEPTH; depth++) {
    if (!currentId) return undefined;
    const node = graph.getNode(currentId);
    if (!node) return undefined;

    // `contains` is shared by region→location and location→sublocation (see
    // `types/graph.ts`), so the source's node type is what distinguishes them. Matching
    // on the edge alone would resolve a sublocation's parent *location* as its region.
    const containing = graph.getIncomingEdges(currentId, 'contains')
      .find((edge) => graph.getNode(edge.source)?.type === 'region');
    if (containing) return containing.source;

    const parentId = node.properties.parentLocationId;
    currentId = typeof parentId === 'string' ? parentId : undefined;
  }

  return undefined;
}

/**
 * Optional evaluation context (THR-822).
 *
 * Most conditions read only current graph state and need nothing here. The two
 * settledness conditions are *durational* — they need a clock, and they need to know
 * when the asking thing began, so that "has stayed put for N ticks" is measured over
 * the asker's own lifetime rather than the agent's.
 *
 * Both fields are optional and both are load-bearing when present; a durational
 * condition evaluated without a clock fails soft to `false`. That polarity is
 * deliberate: for an abandonment trigger, absent evidence must never end an ambition.
 */
export interface ConditionContext {
  /** The tick being evaluated. */
  readonly currentTick?: number;
  /**
   * Start of the measurement window — for an ambition, its `assignedTick`. Dwell is
   * counted from `max(arrivedTick, windowStartTick)`, which is what stops a durational
   * trigger from firing on its first tick against an already-stationary agent. See the
   * header of `agentResidence.ts` for the full argument.
   */
  readonly windowStartTick?: number;
}

/**
 * Evaluate a single GraphCondition against the world graph for a given agent.
 * Pure function — reads graph state, returns boolean, no side effects.
 * Fails soft: returns false for any missing data rather than throwing.
 *
 * `context` is optional and only consulted by durational conditions (THR-822); every
 * caller that predates it keeps working unchanged.
 */
export function evaluateGraphCondition(
  condition: GraphCondition,
  graph: ConditionGraph,
  agentId: string,
  context?: ConditionContext,
): boolean {
  switch (condition.type) {
    case 'agent_reach_above': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const caps = agent.properties.domainCapabilities as Record<string, number> | undefined;
      if (!caps) return false;
      const value = caps[condition.reach];
      return typeof value === 'number' && value >= condition.threshold;
    }

    case 'agent_reach_below': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const caps = agent.properties.domainCapabilities as Record<string, number> | undefined;
      if (!caps) return false;
      const value = caps[condition.reach];
      return typeof value === 'number' && value < condition.threshold;
    }

    // THR-786: both cases route through the one shared trait resolver. The
    // `trait.<key>` short-id form these conditions author keeps working (the ref walk
    // emits it for every trait node), and tag / display-name / full-id refs now
    // resolve too. The old `properties.traitId` comparison is preserved inside the
    // shared walk, though no producer has ever written that property.
    case 'agent_has_trait':
      return bearerMatchesPredicate(
        collectBearerTraitRefs(graph, agentId),
        { traitId: condition.trait },
      );

    case 'agent_lacks_trait':
      return !bearerMatchesPredicate(
        collectBearerTraitRefs(graph, agentId),
        { traitId: condition.trait },
      );

    // THR-808. Fails soft to `false` on a missing node: `phaseAmbitionProgress` walks
    // live `actor` nodes to reach this, so the agent always exists at call time, and
    // treating absence as death would be an auto-complete waiting to happen. THR-812
    // brought `target_agent_eliminated` below onto the same rule, so the two siblings
    // now agree on both the flag they read and what absence means.
    case 'agent_deceased': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      return isDeceased(agent);
    }

    // ── Durational residence conditions (THR-822) ──
    //
    // Both read observed residence (`agentResidence.ts`), never the `located_at` edge
    // directly: the edge says where the agent is, not how long it has been there.
    //
    // Three separate absences each mean `false`, and each is a real "we do not know"
    // rather than a measured negative: no clock in the context, no arrival ever
    // observed, or (for the origin variant) no origin recorded. An abandonment trigger
    // that fired on missing data would end ambitions for the least-observed agents
    // first, which is exactly backwards.
    case 'agent_settled_since': {
      if (typeof context?.currentTick !== 'number') return false;
      const dwell = dwellTicks(readResidence(graph, agentId), context.currentTick, context.windowStartTick);
      return dwell !== undefined && dwell >= condition.minTicks;
    }

    case 'agent_away_from_origin': {
      if (typeof context?.currentTick !== 'number') return false;
      const residence = readResidence(graph, agentId);
      if (!isAwayFromOrigin(residence)) return false;
      const dwell = dwellTicks(residence, context.currentTick, context.windowStartTick);
      return dwell !== undefined && dwell >= condition.minTicks;
    }

    case 'agent_has_bonds': {
      const edges = graph.getOutgoingEdges(agentId, 'relates_to');
      const count = edges.filter((e) => e.properties.basis === condition.basis).length;
      return count >= condition.minCount;
    }

    case 'agent_controls_location': {
      const edges = graph.getOutgoingEdges(agentId, 'controls');
      return edges.some((edge) => {
        const locNode = graph.getNode(edge.target);
        return locNode?.properties.locationType === condition.locationType;
      });
    }

    // ── Region conditions (THR-841) ──
    //
    // All four resolve region through `resolveRegionId`, which walks the `contains`
    // edge. They previously read `loc.properties.regionId`, a property with **no
    // writer anywhere in the repo** — measured 0 distinct values across all 727
    // locations of a live seed-42 run — so both literal conditions were false for
    // every agent in every world. Eight unit tests covered them green by stamping the
    // phantom property onto their own fixtures.
    //
    // The origin-relative pair is what authored content should use; the literal pair
    // is only meaningful to a caller holding a runtime-captured region id. See
    // `types/ambition.ts` for why a literal can never be authored.
    case 'agent_in_region': {
      const regionId = resolveRegionId(graph, agentPositionId(graph, agentId));
      if (regionId === undefined) return false;
      return regionId === condition.region;
    }

    case 'agent_not_in_region': {
      const regionId = resolveRegionId(graph, agentPositionId(graph, agentId));
      // Unresolvable region is "we do not know", not "somewhere else" — a negative
      // condition must not read absence as satisfaction, or every agent the graph
      // cannot place would complete this milestone for free.
      if (regionId === undefined) return false;
      return regionId !== condition.region;
    }

    case 'agent_in_origin_region': {
      const here = resolveRegionId(graph, agentPositionId(graph, agentId));
      const origin = resolveRegionId(graph, readResidence(graph, agentId).originLocationId);
      if (here === undefined || origin === undefined) return false;
      return here === origin;
    }

    case 'agent_not_in_origin_region': {
      const here = resolveRegionId(graph, agentPositionId(graph, agentId));
      const origin = resolveRegionId(graph, readResidence(graph, agentId).originLocationId);
      if (here === undefined || origin === undefined) return false;
      return here !== origin;
    }

    // THR-812 repointed this at the real death flag and inverted the missing-node
    // fallback. Both halves were wrong in the same direction:
    //
    // - It read `properties.eliminated`, which no producer writes, so the property
    //   branch was permanently false — a target that genuinely died kept its node
    //   (with `deceased: true`) and never satisfied the milestone.
    // - `!target` returned `true`, so an unresolvable ref *auto-completed* the
    //   milestone. Every shipped author of this condition passed an unbindable
    //   `$`-ref, making that the only true-path any of them ever took.
    //
    // Absence now means `false`, matching this file's stated fail-soft rule and the
    // `agent_deceased` sibling. A caller that wants "target is gone" to count as
    // elimination must say so with a condition that means it — the `$`-ref
    // authorings are gone (`ambition-templates.ts`), and a test pins that no pool
    // reintroduces one.
    case 'target_agent_eliminated': {
      const target = graph.getNode(condition.targetRef);
      if (!target) return false; // unresolvable ref is not evidence of death
      return isDeceased(target);
    }

    default: {
      // Exhaustive check — TypeScript will error if a condition type is unhandled
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}
