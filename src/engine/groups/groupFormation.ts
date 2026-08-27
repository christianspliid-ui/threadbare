/**
 * Company Formation — THR-74
 *
 * Scans for sets of colocated, compatible agents and rolls to bind them into a
 * company. Formation is the only place company nodes and their edges are created.
 *
 * Runs as sub-step 4 of `phaseGroups`, after dissolution and movement, so a company
 * that dissolved this tick frees its members to re-form in a later tick rather than
 * the same one (no formation/dissolution thrash).
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { AxiologicalProfile } from '../../types/agent';
import { getAgentBonds } from '../graphQueries';
import { generateGroupName } from './groupNames';
import {
  getGroupCohesion, isCompanyNode, isGroupEligibleAgent, isGroupReuniting,
  type GroupType, type BandRole, type GroupFormationCause,
} from './groupQueries';
import {
  GROUP_FORMATION_BASE_CHANCE,
  GROUP_FORMATION_TAVERN_MULT,
  GROUP_FORMATION_COMPAT_MIN,
  GROUP_FORMATION_MIN_COLOCATED,
  GROUP_MAX_MEMBERS,
  GROUP_MIN_MEMBERS,
  GROUP_COHESION_START_BASE,
  REUNITE_COMPAT_BONUS,
} from '../../data/group-constants';

/** What the formation scan did this tick — folded into the aggregate trace. */
export interface FormationScanResult {
  /** Colocated candidate sets that passed the size gate and were rolled for. */
  candidateSets: number;
  /** Companies actually created, each carrying the cause the scan attributed. */
  formed: Array<{
    groupId: string;
    name: string;
    memberIds: string[];
    cohesion: number;
    groupType: GroupType;
    cause: CreateGroupInput['cause'];
  }>;
}

/**
 * True when an agent carries a live `thread` edge from the ascendant — the same
 * relation `isGroupThreaded` walks, read one agent at a time so the formation scan
 * can attribute a *threaded* founding to Seeking Companions before the company node
 * (and its `member_of` edges) exists. Fail-soft: no ascendant → not threaded.
 */
export function isAgentThreaded(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string | undefined,
): boolean {
  if (!ascendantId) return false;
  return graph.getIncomingEdges(agentId, 'thread').some(e => e.source === ascendantId);
}

/**
 * Pairwise compatibility between two agents, 0–1.
 *
 * Three signals, deliberately cheap (this runs over colocated pairs every tick):
 *  - existing relationship sentiment (includes `sworn_ally` bonds minted by the
 *    `strategic_recruit_companions` undertaking (folded from the retired
 *    `initiative.recruit-party`, THR-1292 §3), which is why that undertaking becomes a
 *    formation *signal* rather than a duplicate system)
 *  - shared ambition category
 *  - axiological complementarity — similar risk appetite travels well together
 */
/**
 * True while an agent sits under an open Draw Together convergence pull (THR-74) — the
 * same `convergePullUntilTick` window `encounterScoring.computeConvergenceBonus` reads.
 * Used to attribute a company's formation `cause` to the divine nudge that gathered it.
 */
export function isUnderConvergencePull(node: GraphNode | undefined, tick: number): boolean {
  const until = (node?.properties as Record<string, unknown> | undefined)?.convergePullUntilTick;
  return typeof until === 'number' && tick < until;
}

/**
 * The casting ascendant's sphere, read off the Draw Together pull that gathered this
 * set (THR-770). Returns undefined when the caster had no primary sphere, which is the
 * fail-soft row — the name generator skips the sphere adjective pool rather than the
 * founding failing.
 *
 * Reads only members whose pull is *still open*, because that is the same predicate
 * that attributed the `draw_together` cause; a member carrying a stale stamp from an
 * expired pull did not gather under this one and must not colour its name.
 */
export function convergencePullSphere(
  members: readonly GraphNode[],
  tick: number,
): string | undefined {
  for (const member of members) {
    if (!isUnderConvergencePull(member, tick)) continue;
    const sphere = (member.properties as Record<string, unknown>).convergePullSphere;
    if (typeof sphere === 'string' && sphere.length > 0) return sphere;
  }
  return undefined;
}

/**
 * Every disbanded company an agent once rode with that currently has an open
 * Reunite window (THR-732).
 *
 * Reads *all* `member_of` edges, closed ones included — a former member's edge
 * survives dissolution carrying `leftAtTick`, and that edge is the only surviving
 * record of the ride (`dissolveGroup` clears the node's `roster`).
 */
function reunitingGroupIdsFor(graph: WorldGraph, agentId: string, tick: number): Set<string> {
  const ids = new Set<string>();
  // THR-1297: group-scoped on purpose — this asks which *company* the agent is in, so
  // the faction wrapper would filter out the only targets it cares about.
  for (const edge of graph.getOutgoingEdges(agentId, 'member_of')) {
    const target = graph.getNode(edge.target);
    if (!isCompanyNode(target)) continue;
    if (!isGroupReuniting(target, tick)) continue;
    ids.add(edge.target);
  }
  return ids;
}

/**
 * The disbanded company, if any, that a forming set is actually a reunion *of*.
 *
 * Requires at least {@link GROUP_MIN_MEMBERS} of the admitted set to share it, so a
 * single old comrade drifting into an unrelated company does not get that company
 * mis-told as a reunion. Deterministic on ties (lowest id wins) — NFP #3.
 */
export function findReunionTarget(
  graph: WorldGraph,
  admitted: readonly GraphNode[],
  tick: number,
): GraphNode | undefined {
  const counts = new Map<string, number>();
  for (const member of admitted) {
    for (const groupId of reunitingGroupIdsFor(graph, member.id, tick)) {
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }
  }
  const qualifying = [...counts.entries()]
    .filter(([, n]) => n >= GROUP_MIN_MEMBERS)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return qualifying.length > 0 ? graph.getNode(qualifying[0][0]) : undefined;
}

/**
 * Compatibility bonus for two agents who both rode with a company that is currently
 * being Reunited (THR-732). Shared history is the strongest argument two people have
 * for trying again — see {@link REUNITE_COMPAT_BONUS}.
 */
export function reuniteCompatBonus(
  graph: WorldGraph,
  aId: string,
  bId: string,
  tick: number,
): number {
  const aGroups = reunitingGroupIdsFor(graph, aId, tick);
  if (aGroups.size === 0) return 0;
  for (const groupId of reunitingGroupIdsFor(graph, bId, tick)) {
    if (aGroups.has(groupId)) return REUNITE_COMPAT_BONUS;
  }
  return 0;
}

export function computeCompatibility(graph: WorldGraph, aId: string, bId: string): number {
  let score = 0.3; // strangers-in-a-tavern baseline

  // Relationship sentiment, in either direction.
  const bond = getAgentBonds(graph, aId).find(x => x.agent.id === bId)
    ?? getAgentBonds(graph, bId).find(x => x.agent.id === aId);
  if (bond) {
    score += bond.sentiment * 0.3;
    if ((bond.edge.properties?.basis as string | undefined) === 'sworn_ally') score += 0.15;
  }

  // Shared ambition category.
  const aAmb = graph.getOutgoingEdges(aId, 'pursues')
    .map(e => graph.getNode(e.target)?.properties?.category as string | undefined)
    .filter((c): c is string => c != null);
  const bAmb = new Set(
    graph.getOutgoingEdges(bId, 'pursues')
      .map(e => graph.getNode(e.target)?.properties?.category as string | undefined)
      .filter((c): c is string => c != null),
  );
  if (aAmb.some(c => bAmb.has(c))) score += 0.2;

  // Axiological complementarity on the axis that most predicts travelling well:
  // agents with wildly different courage tolerances pull the group apart.
  const aProfile = graph.getNode(aId)?.properties?.axiologicalProfile as AxiologicalProfile | undefined;
  const bProfile = graph.getNode(bId)?.properties?.axiologicalProfile as AxiologicalProfile | undefined;
  if (aProfile && bProfile) {
    const gap = Math.abs(aProfile.courage_prudence - bProfile.courage_prudence); // 0–2
    score += (1 - gap / 2) * 0.15;
  }

  return Math.max(0, Math.min(1, score));
}

/** True when the location (or its parent) is a tavern — taverns multiply the roll. */
function isTavernLocation(graph: WorldGraph, locationId: string): boolean {
  const node = graph.getNode(locationId);
  if (!node) return false;
  const props = node.properties as Record<string, unknown>;
  const subtype = (props.sublocationType ?? props.locationSubtype ?? '') as string;
  return typeof subtype === 'string' && subtype.toLowerCase().includes('tavern');
}

/**
 * Scan all locations for formable sets and create companies.
 *
 * Bucketing is by `located_at` target — agents standing in the same tavern
 * sublocation form there; agents at the settlement form there. This matches the
 * three-tier position model without needing hex resolution: everyone in a set
 * shares one position node, so the new company's derived position is unambiguous.
 */
export function runFormationScan(
  state: GameState,
  rng: () => number,
): FormationScanResult {
  const graph = state.graph;
  const result: FormationScanResult = { candidateSets: 0, formed: [] };

  // Bucket eligible agents by their exact position node.
  const byLocation = new Map<string, GraphNode[]>();
  for (const node of graph.getNodesByType('actor')) {
    if (!isGroupEligibleAgent(graph, node)) continue;
    const locId = graph.getOutgoingEdges(node.id, 'located_at')[0]?.target;
    if (!locId) continue;
    const bucket = byLocation.get(locId) ?? [];
    bucket.push(node);
    byLocation.set(locId, bucket);
  }

  // Deterministic iteration order (NFP #3) — Map order depends on insertion, which
  // depends on getNodesByType order; sort so the same seed always scans the same way.
  const locationIds = [...byLocation.keys()].sort();

  for (const locId of locationIds) {
    const present = byLocation.get(locId)!;
    if (present.length < GROUP_FORMATION_MIN_COLOCATED) continue;

    result.candidateSets++;

    const chance = GROUP_FORMATION_BASE_CHANCE * (isTavernLocation(graph, locId) ? GROUP_FORMATION_TAVERN_MULT : 1);
    if (rng() >= chance) continue;

    // Seed the set with a deterministic anchor, then admit the most compatible
    // others above the threshold, up to the cap.
    const sorted = [...present].sort((a, b) => a.id.localeCompare(b.id));
    const anchor = sorted[Math.floor(rng() * sorted.length) % sorted.length];

    const admitted: GraphNode[] = [anchor];
    const scored = sorted
      .filter(n => n.id !== anchor.id)
      .map(n => ({
        node: n,
        // Reunite (THR-732) tilts old comrades toward each other. Added outside
        // computeCompatibility (which is tick-free and reused elsewhere) and
        // re-clamped, so a reunion pair can clear GROUP_FORMATION_COMPAT_MIN on
        // shared history alone without the base score ever exceeding 1.
        compat: Math.min(
          1,
          computeCompatibility(graph, anchor.id, n.id)
            + reuniteCompatBonus(graph, anchor.id, n.id, state.tick),
        ),
      }))
      .filter(x => x.compat >= GROUP_FORMATION_COMPAT_MIN)
      .sort((a, b) => b.compat - a.compat || a.node.id.localeCompare(b.node.id));

    for (const cand of scored) {
      if (admitted.length >= GROUP_MAX_MEMBERS) break;
      admitted.push(cand.node);
    }

    if (admitted.length < GROUP_MIN_MEMBERS) continue;

    // Formation quality (mean compatibility of the admitted set) nudges starting
    // cohesion off the base — a company of near-strangers starts shakier.
    const meanCompat = scored.length > 0
      ? scored.slice(0, admitted.length - 1).reduce((s, x) => s + x.compat, 0) / (admitted.length - 1)
      : GROUP_FORMATION_COMPAT_MIN;
    const startingCohesion = clamp01(GROUP_COHESION_START_BASE + (meanCompat - 0.5) * 0.2);

    // THR-74/THR-732: attribute the company's founding by cause, most-specific first.
    //  - `reunite` — enough of the set once rode with the same disbanded company and
    //    the god has an open Reunite window on it. Must be tested *before*
    //    `draw_together`, because Reunite stamps that verb's convergence pull: judged
    //    on the pull alone every reunion would read as an ordinary divine gathering
    //    and lose the one fact that makes it a reunion.
    //  - `draw_together` — any admitted member gathered here under an active
    //    convergence pull. The divine nudge (graphOpExecutor `draw_together`)
    //    stamped `convergePullUntilTick`; the pulled mortals colocating is the
    //    outcome that closes that loop, so it outranks the organic reading.
    //  - `seeking_companions` — no divine pull, but at least one admitted member is
    //    threaded to the ascendant: an organic threaded founding the player should
    //    witness (Seeking Companions moment, fired in phaseGroups).
    //  - `systemic` — an untethered founding, told as the silent ledger line.
    const reunionOf = findReunionTarget(graph, admitted, state.tick);
    const cause: CreateGroupInput['cause'] = reunionOf
      ? 'reunite'
      : admitted.some(m => isUnderConvergencePull(m, state.tick))
        ? 'draw_together'
        : admitted.some(m => isAgentThreaded(graph, m.id, state.ascendantId))
          ? 'seeking_companions'
          : 'systemic';

    const created = createGroup(state, {
      members: admitted,
      leaderId: anchor.id,
      locationId: locId,
      cause,
      groupType: 'party',
      startingCohesion,
      // The re-formed company inherits the old one's name and the caster's sphere
      // flavor, so it reads as *that* company come back rather than a new one.
      // A Draw Together founding takes its flavor from the pull that gathered it
      // instead (THR-770) — the god who called these people is the one the name
      // should carry. Both read the caster's primary sphere; they differ only in
      // where the verb could park it (the dead company node vs. the pulled mortals).
      sphereId: reunionOf
        ? ((reunionOf.properties as Record<string, unknown>).reuniteSphereFlavor as string | undefined)
        : cause === 'draw_together'
          ? convergencePullSphere(admitted, state.tick)
          : undefined,
      predecessorName: reunionOf?.name,
    });
    if (created) {
      result.formed.push({ ...created, cause });
      // Close the window on the old company: it has been answered, and leaving it
      // open would let a second set re-form the same company again next tick.
      if (reunionOf) {
        graph.updateNode(reunionOf.id, { properties: { reuniteUntilTick: undefined } });
      }
    }
  }

  return result;
}

export interface CreateGroupInput {
  members: GraphNode[];
  leaderId: string;
  locationId: string;
  cause: GroupFormationCause;
  groupType: GroupType;
  startingCohesion?: number;
  /** Sphere flavor for the name generator, when Draw Together or Reunite caused this. */
  sphereId?: string;
  /**
   * The disbanded company's name, when this formation is a Reunite re-formation
   * (THR-732). Turns the generated name into a variant of the old one so the
   * player recognises the company that came back.
   */
  predecessorName?: string;
  /**
   * Marks this company an NPC band (THR-731). Both fields travel together — the
   * band spawner is the only caller that sets either.
   */
  bandRole?: BandRole;
  bandFactionId?: string;
}

/**
 * Create a company node with its `member_of` / `commanded_by` edges.
 *
 * Shared by the systemic scan, the Seeking Companions encounter outcome, and the
 * Draw Together divine action — all three converge here so there is exactly one
 * code path that mints a company. Returns undefined on any failure (fail-soft).
 */
export function createGroup(
  state: GameState,
  input: CreateGroupInput,
): { groupId: string; name: string; memberIds: string[]; cohesion: number; groupType: GroupType } | undefined {
  const graph = state.graph;
  if (input.members.length < GROUP_MIN_MEMBERS) return undefined;

  const members = input.members.slice(0, GROUP_MAX_MEMBERS);
  const groupId = `group_${input.locationId}_${state.tick}_${members[0].id}`;
  if (graph.getNode(groupId)) return undefined; // already exists this tick

  const leader = graph.getNode(input.leaderId);
  const locationNode = graph.getNode(input.locationId);
  const cohesion = clamp01(input.startingCohesion ?? GROUP_COHESION_START_BASE);

  const name = generateGroupName({
    groupId,
    cause: input.cause,
    leaderName: leader?.name,
    locationName: locationNode?.name,
    sphereId: input.sphereId,
    factionName: input.bandFactionId ? graph.getNode(input.bandFactionId)?.name : undefined,
    predecessorName: input.predecessorName,
  });

  try {
    graph.addNode({
      id: groupId,
      type: 'actor',
      name,
      properties: {
        actorType: 'group',
        // THR-1297: the explicit kind tag. `groupType` stays (it is the company's own
        // party/squad/faction_band flavour); this says *which family member* the node is,
        // so a reader never has to infer it from which property bag happens to be present.
        groupKind: 'company',
        groupType: input.groupType,
        cohesion,
        groupStatus: 'active',
        formedAtTick: state.tick,
        formationContext: { cause: input.cause, locationId: input.locationId },
        // Bookkeeping mirror of live membership. `member_of` edges stay the
        // authority; this exists only so a cascade-deleted edge (hard death)
        // remains detectable — see reconcileLostMembers.
        roster: members.map(m => m.id),
        // Band marking (THR-731) — omitted entirely on ordinary companies so
        // `isBandNode` stays a presence check rather than a value comparison.
        ...(input.bandRole ? { bandRole: input.bandRole } : {}),
        ...(input.bandFactionId ? { bandFactionId: input.bandFactionId } : {}),
      },
    });

    // NOTE: deliberately no `located_at` edge on the company node — position is
    // derived from the leader (`getGroupPosition`). See groupQueries.ts header.

    graph.addEdge({
      id: `e_commanded_by_${groupId}`,
      source: groupId,
      target: input.leaderId,
      type: 'commanded_by',
      properties: { assignedTick: state.tick },
    });

    for (const member of members) {
      graph.addEdge({
        id: `e_member_of_${member.id}_${groupId}`,
        source: member.id,
        target: groupId,
        type: 'member_of',
        properties: {
          // `role`/`rank`/`joinedTick` are the schema-required trio for `member_of`
          // (see edgeSchema.ts); armies use the same names. `leftAtTick` is the
          // company-specific addition that turns a live edge into history.
          role: member.id === input.leaderId ? 'leader' : 'member',
          rank: 0,
          joinedTick: state.tick,
        },
      });
    }
  } catch {
    return undefined; // graph rejected the write — skip this formation, never throw
  }

  return { groupId, name, memberIds: members.map(m => m.id), cohesion, groupType: input.groupType };
}

/** Re-export for callers that need the fail-soft cohesion read alongside creation. */
export { getGroupCohesion, isCompanyNode };

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
