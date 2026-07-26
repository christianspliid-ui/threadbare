/**
 * Broken mortal state — the missing consequence of quintessence loss.
 * THR-773 (WS0 engine substrate).
 *
 * A mortal worn down past `BROKEN_ENTER_STATE` is *out of the story* — not dead,
 * not stunned: mendable. While broken they draw no ordinary encounter and drift
 * homeward, until they climb back past `BROKEN_EXIT_STATE`.
 *
 * ## Terminology (settled here for the UL proposal)
 *
 * The existing `QuintessenceThresholdState` literal `'broken'` means **ratio 0 —
 * dissolution**, and is untouched: it is a 232-importer enum, not ours to rename.
 * The player-facing **Broken (mortal state)** is a *behavioral* state driven by
 * `isBrokenMortal()`, which enters at `BROKEN_ENTER_STATE` ('critical') — well
 * above dissolution. The two are different things and the UL proposal defines
 * both. Never render the state word off the threshold enum.
 *
 * ## Derivation, not persistence
 *
 * The state is derived on every read from the live quintessence ratio. The one
 * persisted property is `brokenSince` (a tick), which exists solely to carry the
 * hysteresis and to answer "how long?". Fail-soft: a missing or stale
 * `brokenSince` degrades to a threshold-only check — correct, just without the
 * flicker guard.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { QuintessenceThresholdState } from '../types/resolution';
import type { SimulationRuntime } from './simulationRuntime';
import { getQuintessenceRatio, getQuintessenceThresholdState } from '../types/quintessence';
import { touchWorld } from './simulationRuntime';
import { emitTrace } from './traceBuffer';
import {
  BROKEN_DRIFT_PULL_WEIGHT,
  BROKEN_DRIFT_SAFE_SUBTYPES,
  BROKEN_DRIFT_SETTLEMENT_BONUS,
  BROKEN_ENTER_STATE,
  BROKEN_EXIT_STATE,
  BROKEN_GATE_ENABLED,
  QUINTESSENCE_STATE_ORDER,
} from '../data/nudge-constants';
import type { AgentBrokenTrace, AgentMendedTrace } from '../types/trace';

/** Property key holding the tick a mortal entered the broken state. */
export const BROKEN_SINCE_PROPERTY = 'brokenSince';

interface QuintessenceCarrier {
  properties: Record<string, unknown>;
}

/**
 * Rank a threshold state worst (0) → best. Lets the enter/exit comparisons read
 * off `QUINTESSENCE_STATE_ORDER` instead of hard-coding either literal.
 */
function stateRank(state: QuintessenceThresholdState): number {
  const index = QUINTESSENCE_STATE_ORDER.indexOf(state);
  return index === -1 ? QUINTESSENCE_STATE_ORDER.length - 1 : index;
}

const ENTER_RANK = stateRank(BROKEN_ENTER_STATE);
const EXIT_RANK = stateRank(BROKEN_EXIT_STATE);

/**
 * True when the node's quintessence has fallen to or past the broken threshold.
 * The bare threshold test, without hysteresis — `isBrokenMortal` is the one
 * callers want.
 */
export function isAtBrokenThreshold(node: QuintessenceCarrier): boolean {
  return stateRank(getQuintessenceThresholdState(node)) <= ENTER_RANK;
}

/**
 * Is this mortal in the **broken state**?
 *
 * Derived, with hysteresis: an agent already carrying `brokenSince` stays broken
 * until they climb *past* `BROKEN_EXIT_STATE`; an agent without it becomes
 * broken only on reaching `BROKEN_ENTER_STATE`. That gap is what stops an agent
 * hovering on the boundary from flickering in and out tick by tick.
 *
 * Note this is the *state* predicate only. Whether the state has consequences is
 * `BROKEN_GATE_ENABLED` — see `brokenGateActive`.
 */
export function isBrokenMortal(node: QuintessenceCarrier | null | undefined): boolean {
  if (!node) return false; // fail-soft: no node → not broken
  const rank = stateRank(getQuintessenceThresholdState(node));
  const wasBroken = typeof node.properties[BROKEN_SINCE_PROPERTY] === 'number';
  return wasBroken ? rank < EXIT_RANK : rank <= ENTER_RANK;
}

/**
 * Should the broken state's *consequences* apply — candidacy exclusion and the
 * homeward drift pull?
 *
 * Ships false. The gate cannot go live before WS5's rebuild encounters exist:
 * excluding a mortal from all candidacy with no rebuild content to draw is
 * stun-lock, not story. Flipping `BROKEN_GATE_ENABLED` is a WS5 Done-when.
 */
export function brokenGateActive(node: QuintessenceCarrier | null | undefined): boolean {
  return BROKEN_GATE_ENABLED && isBrokenMortal(node);
}

/** Ticks the mortal has been broken, or 0 when they are not (or have no stamp). */
export function ticksBroken(node: QuintessenceCarrier, tick: number): number {
  const since = node.properties[BROKEN_SINCE_PROPERTY];
  if (typeof since !== 'number') return 0;
  return Math.max(0, tick - since);
}

/**
 * Reconcile a mortal's `brokenSince` stamp with their live quintessence, and
 * emit the transition trace when the state actually changed.
 *
 * Transition-fired only — **never** one trace per tick per agent. Called from
 * the quintessence phase after deltas land, so the stamp is always at most one
 * tick behind the ratio that produced it.
 *
 * **Takes an id, not a node, on purpose.** `WorldGraph.updateNode` does not
 * mutate in place — it replaces the map entry with a fresh object *and* a fresh
 * `properties` object. Any node reference a caller is holding from before its
 * own `updateNode` call is therefore stale, and a write through it is silently
 * dropped. This function re-reads the live node itself so a caller cannot hand
 * it a stale one; the passive-regen loop in `phaseQuintessence` calls
 * `updateNode` immediately before this, which is exactly that trap.
 *
 * Returns `'entered' | 'mended' | null` so the caller can aggregate counts.
 * Fail-soft: an unknown id, or a node with no quintessence, no-ops.
 */
export function reconcileBrokenState(
  graph: WorldGraph,
  nodeId: string,
  tick: number,
  runtime?: SimulationRuntime,
): 'entered' | 'mended' | null {
  const node = graph.getNode(nodeId);
  if (!node) return null; // fail-soft: node gone this tick

  const rank = stateRank(getQuintessenceThresholdState(node));
  const since = node.properties[BROKEN_SINCE_PROPERTY];
  const stamped = typeof since === 'number';

  if (!stamped && rank <= ENTER_RANK) {
    // Write through `updateNode` (which merges properties) rather than mutating
    // the object, so the stamp survives regardless of what the caller did first.
    graph.updateNode(nodeId, { properties: { [BROKEN_SINCE_PROPERTY]: tick } });
    // The graph is mutated without changing any reference callers can observe,
    // so the version counter is the only signal UI selectors get.
    if (runtime) touchWorld(runtime);
    emitTrace({
      category: 'agent_broken',
      tick,
      agentId: nodeId,
      ratio: getQuintessenceRatio(node),
      cause: 'quintessence_erosion',
      summary: `agent_broken: ${nodeId} ratio=${getQuintessenceRatio(node).toFixed(3)}`,
    } as AgentBrokenTrace);
    return 'entered';
  }

  if (stamped && rank >= EXIT_RANK) {
    const broken = Math.max(0, tick - (since as number));
    // `updateNode` merges, so it cannot *remove* a key — delete on the live
    // object, which `getNode` returns by reference. Correct here precisely
    // because we re-read it above rather than trusting a caller's handle.
    delete node.properties[BROKEN_SINCE_PROPERTY];
    if (runtime) touchWorld(runtime);
    emitTrace({
      category: 'agent_mended',
      tick,
      agentId: nodeId,
      ticksBroken: broken,
      summary: `agent_mended: ${nodeId} after ${broken} ticks`,
    } as AgentMendedTrace);
    return 'mended';
  }

  return null;
}

/**
 * The `broken_drift` movement pull (THR-773).
 *
 * A broken mortal stops ranging: near candidates outscore far ones, and a tended
 * settlement outscores open country. This is an additive **scoring** term on the
 * same channel as the Draw Together convergence pull — never a movement
 * override. The agent's own scorer still decides; this only bends it homeward.
 *
 * Returns 0 whenever the gate is off (the shipped default), the agent is not
 * broken, or the distance is unresolvable — so the pre-WS0 score is recovered
 * exactly, term for term.
 *
 * @param agentNode      the acting mortal
 * @param distance       hex distance from the agent to the candidate
 * @param locationNode   the candidate's location, for the safe-place bonus
 */
export function computeBrokenDriftBonus(
  agentNode: GraphNode | undefined,
  distance: number,
  locationNode: GraphNode | undefined,
): number {
  if (!agentNode || !brokenGateActive(agentNode)) return 0;
  if (!Number.isFinite(distance) || distance < 0) return 0;

  let bonus = BROKEN_DRIFT_PULL_WEIGHT / (1 + distance);

  const subtype = locationNode?.properties?.locationSubtype;
  if (typeof subtype === 'string' && BROKEN_DRIFT_SAFE_SUBTYPES.has(subtype)) {
    bonus += BROKEN_DRIFT_SETTLEMENT_BONUS;
  }

  return bonus;
}

/**
 * Every currently-broken actor, for `__DEBUG.getBrokenAgents()` and the WS5
 * pacing falsifier. Walks all actors — a debug-surface read, never a tick path.
 */
export function listBrokenAgents(
  graph: WorldGraph,
  tick: number,
): { id: string; name: string; ratio: number; state: QuintessenceThresholdState; ticksBroken: number }[] {
  const out: { id: string; name: string; ratio: number; state: QuintessenceThresholdState; ticksBroken: number }[] = [];
  for (const actor of graph.getNodesByType('actor')) {
    if (!isBrokenMortal(actor)) continue;
    out.push({
      id: actor.id,
      name: typeof actor.properties.name === 'string' ? actor.properties.name : actor.id,
      ratio: getQuintessenceRatio(actor),
      state: getQuintessenceThresholdState(actor),
      ticksBroken: ticksBroken(actor, tick),
    });
  }
  return out;
}
