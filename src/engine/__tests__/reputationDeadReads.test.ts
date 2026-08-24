/**
 * THR-1211 — three reputation-adjacent dead reads, each pinned so it cannot come back.
 *
 *   1. `secretGeneration` `past_crime` — read `relates_to.properties.reputation`, which
 *      nothing writes, so the branch was unreachable by construction. Now reads
 *      `getReputationWith`.
 *   2. `reputation_walk_bonus` — nine faction definitions author it and nothing consumed
 *      it. Now applied in `computeWalkedReputation` step 8b.
 *   3. `getDerivedMembershipRank` — rank was read derived by the gate and cached by three
 *      scalar readers, and the two disagreed from the mint onward.
 *
 * Anchored on shipped definitions (`FACTION_DEFINITIONS`) rather than invented fixtures,
 * so authoring drift surfaces here. Reputation thresholds are written as **literals**,
 * not re-imported from the constant under test — a fixture built from the same constant
 * as the code asserts only that the constant equals itself.
 *
 * Item 4 of the ticket (`aftermathWords` free-form key humanisation) needed no change:
 * THR-1207 drained the last off-axis tally writes and rewrote that branch as a
 * documented defensive fallback for pre-sweep saved worlds (NFP #4). Trimming it now
 * would delete fail-soft coverage for exactly the worlds it exists to serve.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getDerivedMembershipRank, meetsFactionRankRequirement } from '../factionReputation';
import { getAgentFactionBonuses } from '../factionRankBonus';
import { generateSecret } from '../secretGeneration';
import { perceiveReputation } from '../reputationWalk';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';

// ─── Fixtures ──────────────────────────────────────────────────────────────

/** Rangers tiers, as shipped: scout 0.0 · warden 0.3 · ranger_captain 0.6 · lord_ranger 0.85. */
const RANGERS = 'rangers_brotherhood';
const RANGERS_NODE = 'faction_node_rangers';

function addAgent(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'actor', name: `Agent ${id}`, properties: { actorType: 'individual' } });
}

function addFaction(graph: WorldGraph, nodeId: string, factionDefId: string): void {
  graph.addNode({
    id: nodeId,
    type: 'actor',
    name: `Faction ${factionDefId}`,
    properties: { actorType: 'faction', factionType: 'guild', factionDefId },
  });
}

function memberEdge(
  graph: WorldGraph,
  agentId: string,
  factionNodeId: string,
  properties: Record<string, unknown>,
): void {
  graph.addEdge({
    id: `member_${agentId}_${factionNodeId}`,
    source: agentId,
    target: factionNodeId,
    type: 'member_of',
    properties: { role: 'x', joinedTick: 0, ...properties },
  });
}

function edgeOf(graph: WorldGraph, agentId: string) {
  const [edge] = graph.getOutgoingEdges(agentId, 'member_of');
  if (!edge) throw new Error('fixture did not create a member_of edge');
  return edge;
}

/** Normalised index of the tier a reputation lands in, read off the shipped definition. */
function tierIndexFor(reputation: number): number {
  const def = FACTION_DEFINITIONS.get(RANGERS);
  if (!def) throw new Error(`no definition for ${RANGERS}`);
  const tiers = def.rankTiers;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (reputation >= tiers[i].minReputation) return i / Math.max(tiers.length - 1, 1);
  }
  return 0;
}

// ─── Item 3 — the derived rank ─────────────────────────────────────────────

describe('getDerivedMembershipRank (THR-1211 item 3)', () => {
  it('reports the tier index, not the cached rank, when the two disagree', () => {
    // The `npcSeeding` mint shape: rank 0.1 written beside reputation 0.12, which sits
    // in the entry tier. The gate reads the entry tier; the cache claimed 0.1.
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0.1, reputation: 0.12, factionDefId: RANGERS });

    expect(getDerivedMembershipRank(edgeOf(g, 'a1'))).toBe(0);
    // ...and now the gate agrees: 0.12 does not reach the warden floor of 0.3.
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'warden')).toBe(false);
  });

  it('holds steady when reputation moves without crossing a tier', () => {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    // 0.62 and 0.70 are both inside ranger_captain (floor 0.6, next floor 0.85).
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0, reputation: 0.62, factionDefId: RANGERS });

    const edge = edgeOf(g, 'a1');
    const before = getDerivedMembershipRank(edge);

    edge.properties = { ...edge.properties, reputation: 0.7 };
    const after = getDerivedMembershipRank(edge);

    expect(after).toBe(before);
    expect(after).toBe(tierIndexFor(0.62));
    // The cached `rank` is still the minted 0 — which is exactly what used to be read.
    expect(edge.properties.rank).toBe(0);
  });

  it('tracks a tier the cache was never told about', () => {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0, reputation: 0.9, factionDefId: RANGERS });

    // lord_ranger is the top tier — derived reads the top of the scale.
    expect(getDerivedMembershipRank(edgeOf(g, 'a1'))).toBe(1);
    expect(meetsFactionRankRequirement(g, 'a1', RANGERS, 'lord_ranger')).toBe(true);
  });

  it('never returns NaN for the army mint, which writes a string into the numeric field', () => {
    const g = new WorldGraph();
    addAgent(g, 'army1');
    addFaction(g, RANGERS_NODE, RANGERS);
    // `armySpawning` writes `rank: 'army'`. `?? 0` does not catch a string, so the old
    // read produced NaN and `clamp(raw + distortion + NaN)` poisoned the whole walk.
    memberEdge(g, 'army1', RANGERS_NODE, { role: 'army', rank: 'army' });

    const rank = getDerivedMembershipRank(edgeOf(g, 'army1'));
    expect(Number.isNaN(rank)).toBe(false);
    expect(rank).toBe(0);
    expect(Number.isNaN(rank * 0.1)).toBe(false);
  });

  it('keeps a finite cached rank when no definition resolves', () => {
    // No factionDefId — the band / splinter / worldSeed mint shape. Nothing to derive
    // from, so the cached value stands rather than being zeroed.
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0.42 });

    expect(getDerivedMembershipRank(edgeOf(g, 'a1'))).toBe(0.42);
  });

  it('takes the caller-s fallback when there is neither a definition nor a usable cache', () => {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    memberEdge(g, 'a1', RANGERS_NODE, {});

    // `factionAwareness` passes FACTION_DEFAULT_RANK here rather than 0.
    expect(getDerivedMembershipRank(edgeOf(g, 'a1'), 0.25)).toBe(0.25);
  });
});

// ─── Item 2 — the authored walk bonus now has a consumer ───────────────────

describe('reputation_walk_bonus (THR-1211 item 2)', () => {
  it('is authored by shipped faction definitions', () => {
    const authored = [...FACTION_DEFINITIONS.values()].filter(def =>
      def.rankTiers.some(tier => tier.bonuses.some(b => b.type === 'reputation_walk_bonus')),
    );
    // If this drops to zero the step-8b wiring is dead again — and silently.
    expect(authored.length).toBeGreaterThan(0);
  });

  it('is reachable through the lookup the walk now calls', () => {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    // ranger_captain (floor 0.6) is the first Rangers tier carrying the bonus.
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0, reputation: 0.65, factionDefId: RANGERS });

    const bonuses = getAgentFactionBonuses(g, 'a1', 'reputation_walk_bonus');
    expect(bonuses).toHaveLength(1);
    expect(bonuses[0].factionNodeId).toBe(RANGERS_NODE);
    expect(bonuses[0].bonus.value).toBeGreaterThan(0);
  });

  it('is absent below the tier that authors it', () => {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0, reputation: 0.1, factionDefId: RANGERS });

    expect(getAgentFactionBonuses(g, 'a1', 'reputation_walk_bonus')).toHaveLength(0);
  });

  /**
   * Reachability through the lookup is not the same claim as *the walk applies it* —
   * the bonus was reachable that way before this ticket too, and still moved nothing.
   * Two arms differing only in the source's tier isolate step 8b: the per-intermediary
   * rank bonus reads the **intermediary's** rank, which is held equal across both.
   */
  it('changes the walked reputation when the source holds a tier that authors it', () => {
    function walk(sourceReputation: number): number {
      const g = new WorldGraph();
      addAgent(g, 'src');
      addAgent(g, 'mid');
      addAgent(g, 'dst');
      addFaction(g, RANGERS_NODE, RANGERS);

      // src → mid → dst, with no direct src → dst edge, so the walk runs.
      g.addEdge({
        id: 'rel_src_mid',
        source: 'src',
        target: 'mid',
        type: 'relates_to',
        properties: { sentiment: 0, strength: 0.5, basis: 'guild', trust: 0.3 },
      });
      g.addEdge({
        id: 'rel_mid_dst',
        source: 'mid',
        target: 'dst',
        type: 'relates_to',
        properties: { sentiment: 0, strength: 0.5, basis: 'guild', trust: 0.3 },
      });

      // Both share the faction — that is what opens step 8b at all.
      memberEdge(g, 'src', RANGERS_NODE, {
        rank: 0, reputation: sourceReputation, factionDefId: RANGERS,
      });
      memberEdge(g, 'mid', RANGERS_NODE, { rank: 0, reputation: 0.05, factionDefId: RANGERS });

      return perceiveReputation(g, 'src', 'dst');
    }

    // 0.05 → scout, which authors no walk bonus. 0.9 → lord_ranger, which authors 0.25.
    const withoutBonus = walk(0.05);
    const withBonus = walk(0.9);

    const authored = FACTION_DEFINITIONS.get(RANGERS)
      ?.rankTiers.find(t => t.id === 'lord_ranger')
      ?.bonuses.find(b => b.type === 'reputation_walk_bonus')?.value;
    expect(authored).toBeDefined();

    expect(withBonus).toBeGreaterThan(withoutBonus);
    expect(withBonus - withoutBonus).toBeCloseTo(authored as number, 10);
  });
});

// ─── Item 1 — past_crime can now fire, and still does not fire for everyone ─

describe('past_crime secret candidate (THR-1211 item 1)', () => {
  /**
   * Driven through the shipped `generateSecret` rather than the module-private candidate
   * builder — reachability *through the real path* is precisely what was broken.
   *
   * These fixtures produce at most two candidates: `past_crime` (weight 2, pushed first)
   * and the always-present `hidden_weakness` (weight 1). A constant rng of 0.1 puts the
   * weighted pick at 0.3, inside `past_crime`'s band, so selection is deterministic.
   */
  const rng = () => 0.1;

  function secretTypeFor(graph: WorldGraph): string {
    const node = graph.getNode('a1');
    if (!node) throw new Error('fixture agent missing');
    return generateSecret(node, graph, 'observation', rng).secretType;
  }

  function worldWithBond(trust: number): WorldGraph {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addAgent(g, 'a2');
    g.addEdge({
      id: 'rel_a1_a2',
      source: 'a1',
      target: 'a2',
      type: 'relates_to',
      // sentiment 0 keeps `betrayal_planned` out of the candidate set, so the pick below
      // is between past_crime and hidden_weakness only.
      properties: { sentiment: 0, strength: 0.5, basis: 'acquaintance', trust },
    });
    return g;
  }

  it('fires for poor standing — the branch that could never fire before', () => {
    // trust -0.8 remaps to a score of 0.1 through the bond leg of getReputationWith,
    // well below the 0.5 neutral default.
    expect(secretTypeFor(worldWithBond(-0.8))).toBe('past_crime');
  });

  it('does not fire for a neutral bond', () => {
    // trust 0 remaps to exactly the neutral default — not below it.
    expect(secretTypeFor(worldWithBond(0))).toBe('hidden_weakness');
  });

  it('does not fire for good standing', () => {
    expect(secretTypeFor(worldWithBond(0.9))).toBe('hidden_weakness');
  });

  it('does not fire when the poor standing is with the agent-s own faction', () => {
    const g = new WorldGraph();
    addAgent(g, 'a1');
    addFaction(g, RANGERS_NODE, RANGERS);
    memberEdge(g, 'a1', RANGERS_NODE, { rank: 0, reputation: 0.05, factionDefId: RANGERS });
    g.addEdge({
      id: 'rel_a1_faction',
      source: 'a1',
      target: RANGERS_NODE,
      type: 'relates_to',
      properties: { sentiment: 0, strength: 0.5, basis: 'membership', trust: -0.9 },
    });

    expect(secretTypeFor(g)).toBe('hidden_weakness');
  });
});
