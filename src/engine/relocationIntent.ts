/**
 * Travel intents — the read/write half of `agent_relocation` (THR-1142).
 *
 * An encounter ending can now send someone somewhere. Before this primitive no
 * effect in the aftermath vocabulary could move anyone, so endings that *described*
 * a departure ("Maret Departs", "East Is Theirs", "He Left First") backed their
 * chips with nothing — the exact hollowness UI Law 56 forbids, found by the
 * THR-1141 palette census.
 *
 * ## The one load-bearing decision: an intent is a lean, not a path
 *
 * `travel` mode writes a `relocationIntent` property and stops. Nothing in this
 * module moves an agent. The decision phase reads the intent through
 * `computeRelocationIntentBonus`, which adds a distance-decayed weight to
 * encounter candidates near the destination — the *same additive channel* Draw
 * Together's `computeConvergenceBonus` uses (THR-74), and deliberately the same
 * `WEIGHT / (1 + distance)` shape.
 *
 * That is why there is no pathfinding here and no second movement path: the
 * mortal walks there through the ordinary movement system, so the journey is
 * watchable on the map and a good enough reason to stay can still outvote the
 * departure. The plan doc's instruction is explicit — *"Do not invent a second
 * movement path for relocation."*
 *
 * ## What that buys, and what it costs — read this before authoring (THR-1142)
 *
 * The pull is applied **per encounter candidate**, so what it actually does is
 * make encounters at and near the destination score higher. Two consequences,
 * both measured on the real pipeline (seed 42, medium map, 60 ticks):
 *
 *  • **Aimed at a location that has an encounter candidate, it steers hard.** The
 *    destination candidate went from `0.0101` to `0.6985` and the agent closed
 *    26 → 20 hexes while the intent stayed live.
 *  • **Aimed at a location with nothing to do, it barely steers.** The gradient is
 *    still there — every candidate is boosted by `W / (1 + distance-to-destination)`
 *    — but `W = 0.5` decayed over 6+ hexes is ~0.07, against live scores of
 *    0.7–1.0. In one run an agent aimed at an empty settlement drifted 6 → 12
 *    hexes *away*, because the rest of the board simply outvoted the lean.
 *
 * So: **relocate people toward places the world has something happening**, and
 * treat a quiet destination as a wish rather than a plan. This is a real property
 * of steering through the encounter board rather than a second mover, not a bug —
 * but it is the opposite of what "send this agent to X" sounds like it promises,
 * so it is written down here rather than left to be rediscovered. Raising `W`
 * would trade it for a mortal who abandons a burning village to keep an
 * appointment; the tunable is there (`RELOCATION_INTENT_SCORE_WEIGHT`) if a later
 * content pass wants a different balance. Follow-up: THR-1148.
 *
 * `instant` mode is the exception, for scene logic where someone flees *now*. It
 * retargets the single `located_at` edge through `rebindLocatedAt` below, which is
 * the same helper the CLI's `move agent` uses (`debugWorldSpawnTools` delegates to
 * it) so there is one write path for agent position, not two.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every resolution returns `null` rather than throwing: an unresolvable
 * destination, a dead agent, a location with no hex. The caller traces and no-ops;
 * encounter resolution is never disturbed by a relocation that could not land.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { GameState } from '../types/gameState';
import type { RelocationDestination, RelocationIntent } from '../types/movement';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import {
  RELOCATION_INTENT_SCORE_WEIGHT,
  RELOCATION_NEAREST_SETTLEMENT_MAX_HEXES,
  RELOCATION_AWAY_MAX_HEXES,
} from '../data/movement-content';

/** Agent-node property key holding the live intent. */
export const RELOCATION_INTENT_PROP = 'relocationIntent';

/**
 * Location subtypes that count as "a settlement" for `nearest_settlement`.
 *
 * Deliberately the places a person can live, not every location with a name — a
 * ruin or a battleground is somewhere to go, never somewhere to be sent *to live*.
 */
export const RELOCATION_SETTLEMENT_SUBTYPES: readonly string[] = [
  'hamlet', 'town', 'city', 'capital', 'camp',
];

// ─── Position write (shared with the debug `move agent` path) ───────────────

/**
 * Retarget an agent's single `located_at` edge — the one write path for agent
 * position, shared by `instant` relocation and the CLI's `move agent`.
 *
 * Position is a single edge by the load-bearing three-tier rule (hex → location →
 * sublocation), so this removes every existing `located_at` before adding the new
 * one; a second edge would make "where is this agent" ambiguous.
 *
 * Does **not** call `touchWorld()` — versioning is the caller's responsibility,
 * matching the in-place mutation idiom used across the aftermath dispatcher.
 */
export function rebindLocatedAt(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
  edgeIdPrefix = 'located_at',
): void {
  for (const edge of graph.getOutgoingEdges(actorId, 'located_at')) {
    graph.removeEdge(edge.id);
  }
  graph.addEdge({
    id: `${edgeIdPrefix}_${actorId}_${locationId}`,
    source: actorId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

// ─── Destination resolution ─────────────────────────────────────────────────

/** A destination resolved to somewhere concrete on the map. */
export interface ResolvedRelocationDestination {
  readonly hex: { readonly col: number; readonly row: number };
  /** Present when the destination named (or resolved to) a location node. */
  readonly nodeId?: string;
  /** Human-readable label for traces. */
  readonly label: string;
}

/**
 * Resolve an authored destination against the live graph.
 *
 * `nearest_settlement` and `away` are resolved **from the agent's current hex at
 * apply time**, not at authoring time — the same ending fired in two places sends
 * people to two different towns, which is the point.
 *
 * Returns `null` when nothing resolves (NFP #4). Pure apart from the `rng` draw.
 */
export function resolveRelocationDestination(
  graph: WorldGraph,
  agentId: string,
  destination: RelocationDestination,
  rng: () => number,
): ResolvedRelocationDestination | null {
  switch (destination.kind) {
    case 'location': {
      const hex = resolveLocationToHex(graph, destination.locationId);
      if (!hex) return null;
      const node = graph.getNode(destination.locationId);
      return { hex, nodeId: destination.locationId, label: node?.name ?? destination.locationId };
    }

    case 'hex':
      return {
        hex: { col: destination.col, row: destination.row },
        label: `hex ${destination.col},${destination.row}`,
      };

    case 'nearest_settlement': {
      const from = resolveAgentHex(graph, agentId);
      if (!from) return null;
      let best: { node: GraphNode; hex: { col: number; row: number }; dist: number } | null = null;
      for (const loc of graph.getNodesByType('location')) {
        const subtype = loc.properties?.locationSubtype;
        if (typeof subtype !== 'string' || !RELOCATION_SETTLEMENT_SUBTYPES.includes(subtype)) continue;
        const hex = resolveLocationToHex(graph, loc.id);
        if (!hex) continue;
        const dist = hexDistance(from, hex);
        // Distance 0 is where they already are — "go to the nearest settlement"
        // must name somewhere else or it is not a relocation.
        if (dist === 0 || dist > RELOCATION_NEAREST_SETTLEMENT_MAX_HEXES) continue;
        if (!best || dist < best.dist) best = { node: loc, hex, dist };
      }
      return best ? { hex: best.hex, nodeId: best.node.id, label: best.node.name ?? best.node.id } : null;
    }

    case 'away': {
      const from = resolveAgentHex(graph, agentId);
      if (!from) return null;
      const candidates: Array<{ node: GraphNode; hex: { col: number; row: number } }> = [];
      for (const loc of graph.getNodesByType('location')) {
        // Sublocations resolve to their parent's hex, so they would duplicate the
        // parent as a candidate and skew the seeded pick toward busy places.
        if (loc.properties?.parentLocationId !== undefined) continue;
        const hex = resolveLocationToHex(graph, loc.id);
        if (!hex) continue;
        const dist = hexDistance(from, hex);
        if (dist < destination.minHexDistance || dist > RELOCATION_AWAY_MAX_HEXES) continue;
        candidates.push({ node: loc, hex });
      }
      if (candidates.length === 0) return null;
      // Sorted before the draw so the seeded pick does not depend on graph
      // insertion order — same seed, same world, same destination (NFP #3).
      candidates.sort((a, b) => a.node.id.localeCompare(b.node.id));
      const pick = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
      return { hex: pick.hex, nodeId: pick.node.id, label: pick.node.name ?? pick.node.id };
    }
  }
}

/** The agent's current hex, resolved through their `located_at` target. Null if unplaced. */
export function resolveAgentHex(
  graph: WorldGraph,
  agentId: string,
): { col: number; row: number } | null {
  const locationId = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
  return locationId ? resolveLocationToHex(graph, locationId) : null;
}

// ─── Intent read / write ────────────────────────────────────────────────────

/**
 * Read a *live* intent off an agent node — expired intents read as absent, so no
 * caller has to remember the TTL check.
 *
 * Shape-validating rather than trusting: a malformed property (hand-edited state,
 * an older save) reads as no intent instead of throwing downstream.
 */
export function readRelocationIntent(
  agentNode: GraphNode | undefined,
  tick: number,
): RelocationIntent | null {
  const raw = agentNode?.properties?.[RELOCATION_INTENT_PROP];
  if (!raw || typeof raw !== 'object') return null;
  const intent = raw as Partial<RelocationIntent>;
  const hex = intent.destinationHex;
  if (!hex || typeof hex.col !== 'number' || typeof hex.row !== 'number') return null;
  if (typeof intent.expiresAtTick !== 'number') return null;
  if (tick >= intent.expiresAtTick) return null;
  return intent as RelocationIntent;
}

/**
 * Read the raw stored intent regardless of expiry — the expiry sweep needs to see
 * the intent it is about to clear, which `readRelocationIntent` hides by design.
 */
export function readStoredRelocationIntent(
  agentNode: GraphNode | undefined,
): RelocationIntent | null {
  const raw = agentNode?.properties?.[RELOCATION_INTENT_PROP];
  if (!raw || typeof raw !== 'object') return null;
  const intent = raw as Partial<RelocationIntent>;
  const hex = intent.destinationHex;
  if (!hex || typeof hex.col !== 'number' || typeof hex.row !== 'number') return null;
  if (typeof intent.expiresAtTick !== 'number') return null;
  return intent as RelocationIntent;
}

/** Write an intent onto an agent node, replacing any intent already there. */
export function setRelocationIntent(
  graph: WorldGraph,
  agentId: string,
  intent: RelocationIntent,
): void {
  graph.updateNode(agentId, { properties: { [RELOCATION_INTENT_PROP]: intent } });
}

/**
 * Clear an agent's intent.
 *
 * `updateNode` *merges* properties, so assigning `undefined` is what removes the
 * key — deleting from the handle's own property bag would be lost on the node
 * replacement `updateNode` performs.
 */
export function clearRelocationIntent(graph: WorldGraph, agentId: string): void {
  graph.updateNode(agentId, { properties: { [RELOCATION_INTENT_PROP]: undefined } });
}

// ─── The reader: movement scoring ───────────────────────────────────────────

/**
 * Additive pull toward a live intent's destination, for one candidate hex.
 *
 * `WEIGHT / (1 + hexDistance)` — maximal at the destination and decaying with
 * distance, so candidates that *reduce* the remaining distance outscore ones that
 * do not. Same shape, same channel and same fail-soft contract as
 * `computeConvergenceBonus`; keeping them identical is what makes "no second
 * movement path" true rather than aspirational.
 *
 * Returns 0 for a missing agent, a missing candidate hex, or no live intent — so
 * every pre-THR-1142 score is recovered term for term.
 */
export function computeRelocationIntentBonus(
  agentNode: GraphNode | undefined,
  entryCol: number | undefined,
  entryRow: number | undefined,
  tick: number,
): number {
  if (!agentNode || entryCol === undefined || entryRow === undefined) return 0;
  const intent = readRelocationIntent(agentNode, tick);
  if (!intent) return 0;
  const dist = hexDistance(intent.destinationHex, { col: entryCol, row: entryRow });
  return RELOCATION_INTENT_SCORE_WEIGHT / (1 + dist);
}

/**
 * Has the agent reached the intent's destination hex?
 *
 * Arrival is **hex-granular**, matching the encounter-awareness model: standing
 * anywhere on the destination's hex is arriving, whichever location or sublocation
 * of that hex they happen to occupy.
 */
export function hasArrivedAtIntent(
  graph: WorldGraph,
  agentId: string,
  intent: RelocationIntent,
): boolean {
  const here = resolveAgentHex(graph, agentId);
  if (!here) return false;
  return hexDistance(here, intent.destinationHex) === 0;
}

/**
 * Resolve a live intent for one agent: clear it on arrival or expiry, leave it
 * alone otherwise. Called once per agent per tick from the decision phase.
 *
 * Returns what happened so the caller can trace it — this function emits nothing
 * itself, keeping the trace vocabulary in one place at the call site.
 */
export function resolveRelocationIntentForAgent(
  state: GameState,
  agentId: string,
  tick: number,
): { outcome: 'arrived' | 'expired' | 'travelling' | 'none'; intent: RelocationIntent | null } {
  const node = state.graph.getNode(agentId);
  const stored = readStoredRelocationIntent(node);
  if (!stored) return { outcome: 'none', intent: null };

  if (hasArrivedAtIntent(state.graph, agentId, stored)) {
    clearRelocationIntent(state.graph, agentId);
    return { outcome: 'arrived', intent: stored };
  }

  // Expiry is checked *after* arrival: an agent who lands on the destination on
  // the very tick the intent lapses arrived — they did not fail to.
  if (tick >= stored.expiresAtTick) {
    clearRelocationIntent(state.graph, agentId);
    return { outcome: 'expired', intent: stored };
  }

  return { outcome: 'travelling', intent: stored };
}
