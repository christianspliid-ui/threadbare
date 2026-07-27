// src/engine/graphConditions.ts
// Pure evaluator for GraphCondition objects against a minimal graph interface.
// Used by milestone and abandonment checks in the ambition system.

import type { GraphCondition } from '../types/ambition';
import { collectBearerTraitRefs, bearerMatchesPredicate } from './traitRefIndex';

/**
 * Minimal graph interface — keeps this module testable without the full WorldGraph.
 *
 * `name` is optional and additive (THR-786): the shared trait-ref walk resolves a
 * trait by display name as well as by id/tag, and a node's display name lives at the
 * node level. Existing implementors that omit it keep working — a missing name simply
 * contributes no name ref.
 */
export interface ConditionGraph {
  getNode: (id: string) => { id: string; name?: string; properties: Record<string, unknown> } | undefined;
  getOutgoingEdges: (id: string, type?: string) => ReadonlyArray<{
    source: string;
    target: string;
    type: string;
    properties: Record<string, unknown>;
  }>;
  getIncomingEdges: (id: string, type?: string) => ReadonlyArray<{
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
 * - `properties.status === 'dead'` — was read once (`phaseInitiativeProgress`), written
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
 * Evaluate a single GraphCondition against the world graph for a given agent.
 * Pure function — reads graph state, returns boolean, no side effects.
 * Fails soft: returns false for any missing data rather than throwing.
 */
export function evaluateGraphCondition(
  condition: GraphCondition,
  graph: ConditionGraph,
  agentId: string,
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

    case 'agent_in_region': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
      const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
      if (!locationId) return false;
      const loc = graph.getNode(locationId);
      if (!loc) return false;
      return loc.properties.regionId === condition.region;
    }

    case 'agent_not_in_region': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
      const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
      if (!locationId) return false;
      const loc = graph.getNode(locationId);
      if (!loc) return false;
      return loc.properties.regionId !== condition.region;
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
