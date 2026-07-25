/**
 * Band opposition — the pairing seam and its consequences (THR-731 PR 2).
 *
 * PR 1 gave factions bands. This module is what makes meeting one *matter*: when a
 * company's encounter completes on a hex where a foreign band stands, the band is
 * given a counter-action and the two resolve as **one contested pair** on the
 * shipped TB-044 machinery — the same dual rolls, the same `contested_won` /
 * `contested_lost` ladder that has been in the engine since Sprint 4.
 *
 * Three things are deliberately *not* here, because they already exist:
 *
 * - **No new resolution system.** `resolveContestationPair` does the rolling; this
 *   module only decides who is in the pair and what it costs afterwards.
 * - **No new strength math.** Both sides price a step through `resolveGroupStep`
 *   (best member for the Reach + capped assist) — a band is a company, so it uses
 *   the company path unchanged.
 * - **No new step consequences.** Injury and condition land on the losing side's
 *   acting member through the template's own `onFailure` ops, exactly as a solo
 *   failure does. Only cohesion, casualties, and the grudge edge are new.
 *
 * NFP #1 Tunability: the three new numbers live in `group-constants.ts`.
 * NFP #2 Inspectability: one `group_contested` trace per engagement, carrying both
 *   group ids and every consequence applied.
 * NFP #3 Determinism: the injected seeded rng only; deterministic id-sorted picks.
 * NFP #4 Fail-soft: every degenerate pair degrades to the uncontested path. A band
 *   that dissolved between seeding and resolution is simply not there — conflict
 *   never blocks a resolution.
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { UnifiedAction, UnifiedActionOutcome } from '../../types/unifiedAction';
import type { WorldGraph } from '../graph';
import type { GroupContestedTrace } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { resolveLocationToHex } from '../encounterAwareness';
import { applyCohesionDelta } from './groupCohesion';
import {
  getActiveGroups,
  getGroupLeader,
  getGroupMembers,
  getGroupOf,
  getGroupPosition,
  isAgentGone,
  isBandNode,
  type BandRole,
} from './groupQueries';
import {
  GROUP_COHESION_CONTEST_WON_DELTA,
  GROUP_COHESION_CONTEST_LOST_DELTA,
  BAND_CASUALTY_CHANCE,
} from '../../data/group-constants';

/** Counter-template a band answers with, by the role it was mustered for. */
export const BAND_COUNTER_TEMPLATES: Readonly<Record<BandRole, string>> = {
  defender: 'encounter.band_defend',
  raider: 'encounter.band_raid',
};

/** Fallback when a band carries an unrecognized role (fail-soft table row 3). */
const BAND_COUNTER_FALLBACK = BAND_COUNTER_TEMPLATES.defender;

let warnedUnknownRole = false;

/** A pairing the detector should turn into a contested pair. */
export interface BandOpposition {
  /** The company's completing action — always the attacker (bands answer). */
  readonly initiator: UnifiedAction;
  /** The synthesized band action — always the defender. */
  readonly counter: UnifiedAction;
  readonly initiatorGroupId: string;
  readonly bandGroupId: string;
}

// ─── Discovery ──────────────────────────────────────────────────

/** Hex a group stands on, or null when it cannot be placed (fail-soft). */
function hexOfGroup(graph: WorldGraph, groupId: string): { col: number; row: number } | null {
  const locationId = getGroupPosition(graph, groupId);
  if (!locationId) return null;
  return resolveLocationToHex(graph, locationId);
}

/** Living members a group can still field. */
function livingMembers(graph: WorldGraph, groupId: string): GraphNode[] {
  return getGroupMembers(graph, groupId).filter(m => !isAgentGone(m));
}

/**
 * The band standing against this company, if any.
 *
 * Two ways in, in priority order:
 *
 * 1. **Seeded** — the action already names its opponent (`opposingGroupId`, written
 *    by confrontation seeding). Honoured as-is, subject to the liveness checks.
 * 2. **Colocation** — a foreign, active band shares the company's hex. Hex, not
 *    location node: encounter awareness is hex-granular by canon, so a band in the
 *    guild hall and a company in the yard outside are in the same fight.
 *
 * Returns undefined for every case that should stay uncontested: no band there, the
 * band is the company's own, the band emptied out, or either side cannot be placed.
 */
export function findOpposingBand(
  graph: WorldGraph,
  action: UnifiedAction,
  companyGroupId: string,
): GraphNode | undefined {
  const seeded = action.opposingGroupId;
  if (seeded) {
    const node = graph.getNode(seeded);
    if (!node || !isBandNode(node)) return undefined;
    if (node.id === companyGroupId) return undefined;
    if ((node.properties as Record<string, unknown>).groupStatus !== 'active') return undefined;
    return livingMembers(graph, node.id).length > 0 ? node : undefined;
  }

  return findColocatedOpposingBand(graph, companyGroupId);
}

/**
 * The foreign, active, still-manned band standing on this company's hex, if any.
 *
 * Split out of {@link findOpposingBand} in PR 3 so the confrontation family can ask
 * the same question *before* the fight — a Den Assault is only drawable when there
 * is a den band to assault. Resolution re-asks it rather than trusting the draw:
 * a band that walked off the hex in between is simply not there any more, and the
 * company's action resolves uncontested (NFP #4).
 */
export function findColocatedOpposingBand(
  graph: WorldGraph,
  companyGroupId: string,
): GraphNode | undefined {
  const companyHex = hexOfGroup(graph, companyGroupId);
  if (!companyHex) return undefined;

  // Deterministic scan order so the same state always picks the same opponent.
  const bands = getActiveGroups(graph)
    .filter(isBandNode)
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const band of bands) {
    if (band.id === companyGroupId) continue;
    // A faction's own band does not ambush its own company.
    const bandFactionId = (band.properties as Record<string, unknown>).bandFactionId;
    const companyFactionId = (graph.getNode(companyGroupId)?.properties as Record<string, unknown> | undefined)
      ?.bandFactionId;
    if (bandFactionId && bandFactionId === companyFactionId) continue;
    if (livingMembers(graph, band.id).length === 0) continue;

    const bandHex = hexOfGroup(graph, band.id);
    if (!bandHex) continue;
    if (bandHex.col === companyHex.col && bandHex.row === companyHex.row) return band;
  }

  return undefined;
}

/**
 * Does the agent's company have a band to fight right here? (THR-731 PR 3.)
 *
 * The eligibility side of the confrontation gate — asked once per candidate sweep
 * that encounters a `requiresOpposingBand` template, keyed on the *agent* because
 * that is what the candidate generator holds.
 *
 * Fail-soft: any graph read that throws answers "no band", which closes the
 * confrontation family rather than opening it on a broken read. A confrontation
 * that fails to appear costs one encounter; one that appears against nobody is a
 * scene with an empty chair in it.
 */
export function hasOpposingBand(graph: WorldGraph, actorId: string): boolean {
  try {
    const company = getGroupOf(graph, actorId);
    // A band is a company: it does not draw confrontations against itself, and a
    // band-vs-band fight is not this ticket's scale.
    if (!company || isBandNode(company)) return false;
    return findColocatedOpposingBand(graph, company.id) !== undefined;
  } catch {
    return false;
  }
}

// ─── Synthesis ──────────────────────────────────────────────────

let counterCounter = 0;

/** Reset the synthetic-counter id sequence. Test seam only. */
export function resetBandCounterIds(): void {
  counterCounter = 0;
}

/** The template id a band answers with, fail-soft for an unrecognized role. */
export function counterTemplateFor(bandRole: unknown): string {
  if (bandRole === 'defender' || bandRole === 'raider') return BAND_COUNTER_TEMPLATES[bandRole];
  if (!warnedUnknownRole) {
    warnedUnknownRole = true;
    console.warn(`[bandOpposition] unknown bandRole ${String(bandRole)} — answering with ${BAND_COUNTER_FALLBACK}`);
  }
  return BAND_COUNTER_FALLBACK;
}

/**
 * Build the band's side of an engagement.
 *
 * The synthesized action is **transient by design**: it is resolved inside the same
 * tick it is created and never enters `state.unifiedActions`. A band does not carry
 * a multi-tick encounter of its own — it answers the one it was walked into. That
 * keeps the band's whole contribution inside the contested branch, with no lifecycle,
 * no progression, and nothing to clean up if the pair degrades.
 *
 * The actor is the band's *leader* (an individual agent), never the group node:
 * capability, position, and step consequences all expect a person, and the group
 * layer's standing rule is that no system ever meets a positionless group actor.
 */
export function synthesizeBandCounter(
  action: UnifiedAction,
  band: GraphNode,
  companyGroupId: string,
  graph: WorldGraph,
): UnifiedAction | undefined {
  const leader = getGroupLeader(graph, band.id)
    ?? livingMembers(graph, band.id).sort((a, b) => a.id.localeCompare(b.id))[0];
  if (!leader || isAgentGone(leader)) return undefined;

  return {
    actionId: `ua_band_counter_${++counterCounter}`,
    actorId: leader.id,
    templateId: counterTemplateFor((band.properties as Record<string, unknown>).bandRole),
    // Same target as the action it answers — the fight is over the same thing.
    targetId: action.targetId,
    scale: action.scale,
    source: 'agent',
    startTick: action.startTick,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 1,
    resolved: false,
    stepOutcomes: [],
    opposingGroupId: companyGroupId,
    counterToActionId: action.actionId,
  };
}

/**
 * Every band opposition among this tick's completing actions.
 *
 * Skips actions that are already contested by the ordinary `contestsWith` path — a
 * template-declared contest is a deliberate authored pairing and outranks a band
 * that happens to be standing nearby.
 */
export function collectBandOppositions(
  completing: readonly UnifiedAction[],
  state: GameState,
): BandOpposition[] {
  const graph = state.graph;
  const oppositions: BandOpposition[] = [];
  const engagedBands = new Set<string>();

  for (const action of completing) {
    // A synthesized counter never spawns a counter of its own.
    if (action.counterToActionId) continue;
    if (action.resolved) continue;

    try {
      const company = getGroupOf(graph, action.actorId);
      if (!company) continue;
      // A band's own encounter is not a contest with itself.
      if (isBandNode(company)) continue;

      const band = findOpposingBand(graph, action, company.id);
      if (!band) continue;
      // One engagement per band per tick — a band cannot fight three companies at once.
      if (engagedBands.has(band.id)) continue;

      const counter = synthesizeBandCounter(action, band, company.id, graph);
      if (!counter) continue;

      engagedBands.add(band.id);
      oppositions.push({
        initiator: action,
        counter,
        initiatorGroupId: company.id,
        bandGroupId: band.id,
      });
    } catch {
      // Fail-soft: this action simply resolves uncontested (NFP #4).
    }
  }

  return oppositions;
}

// ─── Consequences ───────────────────────────────────────────────

/**
 * The contested outcome a side's step result earns.
 *
 * `contested_won` / `contested_lost` have been in `UnifiedActionOutcome` since
 * TB-044, with display strings in ChapterView, a `playerReceipts` severity mapping,
 * and an `isActionSuccess` branch — and, as of THR-731 PR 2, **zero producers**:
 * the contested branch resolved through plain `success` / `failure` and the band was
 * dead vocabulary. Group contests are what finally set it, which is why the outcome
 * survives at all: a company that lost a fight reads differently from one that
 * merely failed, and every downstream surface was already built to say so.
 */
export function contestedOutcomeFor(stepOutcome: 'success' | 'failure'): UnifiedActionOutcome {
  return stepOutcome === 'success' ? 'contested_won' : 'contested_lost';
}

/**
 * Kill one of the losing side's members.
 *
 * The node is **marked** deceased rather than removed: `isAgentGone` already reads
 * `deceased === true` as gone for every group query, and `reconcileLostMembers`
 * Case 1 exists precisely to close a `member_of` edge whose member node is still
 * present but dead. Marking is the additive move (NFP #6) and leaves the body in
 * the graph for the chronicle to name.
 *
 * Never takes the leader while anyone else stands — a band that loses its head
 * dissolves on the leader-death path, which is a different (and much louder) story
 * than losing a member.
 */
function applyCasualty(
  graph: WorldGraph,
  groupId: string,
  rng: () => number,
  tick: number,
): GraphNode | undefined {
  const members = livingMembers(graph, groupId).sort((a, b) => a.id.localeCompare(b.id));
  if (members.length === 0) return undefined;

  const leaderId = getGroupLeader(graph, groupId)?.id;
  const expendable = members.length > 1 ? members.filter(m => m.id !== leaderId) : members;
  const pool = expendable.length > 0 ? expendable : members;

  const victim = pool[Math.floor(rng() * pool.length)] ?? pool[0];
  if (!victim || isAgentGone(victim)) return undefined;

  graph.updateNode(victim.id, {
    properties: { ...victim.properties, deceased: true, deceasedTick: tick },
  });
  return graph.getNode(victim.id) ?? victim;
}

/** Write the standing rivalry both ways, idempotently. */
function writeGrudge(graph: WorldGraph, a: string, b: string, tick: number): boolean {
  let wrote = false;
  for (const [from, to] of [[a, b], [b, a]] as const) {
    const existing = graph.getOutgoingEdges(from, 'hostile_to').find(e => e.target === to);
    if (existing) continue;
    try {
      graph.addEdge({
        id: `e_hostile_to_${from}_${to}`,
        source: from,
        target: to,
        type: 'hostile_to',
        properties: { since: tick, cause: 'group_engagement' },
      });
      wrote = true;
    } catch {
      // Fail-soft: a missing grudge costs prose, never correctness.
    }
  }
  return wrote;
}

/**
 * Whether the template that opened this contest forbids a casualty (THR-731 PR 3).
 *
 * Fail-soft: an unknown template id answers "lethal", which is the ordinary
 * behaviour every contest had before the flag existed — a missing template must
 * not silently make band conflict bloodless.
 */
function isNonLethalContest(templateId: string): boolean {
  try {
    return getUnifiedTemplateById(templateId)?.contestNonLethal === true;
  } catch {
    return false;
  }
}

export interface ContestConsequences {
  readonly winnerGroupId: string;
  readonly loserGroupId: string;
  readonly winnerCohesionDelta: number;
  readonly loserCohesionDelta: number;
  readonly casualtyId?: string;
  readonly casualtyName?: string;
  readonly grudgeWritten: boolean;
}

/**
 * Apply everything a contested group engagement costs beyond the step's own ops.
 *
 * Order matters: cohesion first (so the losing side's number reflects the loss and
 * not the death on top of it), then the casualty, then the grudge. `phaseGroups`
 * picks the death up next tick through `reconcileLostMembers`, which applies the
 * separate death-cohesion hit and can carry the band to dissolution — that cascade
 * is shipped machinery and is deliberately not duplicated here.
 */
export function applyContestConsequences(
  state: GameState,
  opposition: BandOpposition,
  initiatorStepOutcome: 'success' | 'failure',
  counterStepOutcome: 'success' | 'failure',
  rng: () => number,
): ContestConsequences | undefined {
  const graph = state.graph;
  const initiatorWon = initiatorStepOutcome === 'success';
  const counterWon = counterStepOutcome === 'success';

  // Mutual failure: both sides came off badly and nobody won. No cohesion swing,
  // no casualty — but they have still met, and that is enough for a grudge.
  if (!initiatorWon && !counterWon) {
    const grudgeWritten = writeGrudge(graph, opposition.initiatorGroupId, opposition.bandGroupId, state.tick);
    emitContestTrace(state, opposition, undefined, undefined, 0, 0, undefined, grudgeWritten, 'mutual_failure');
    return undefined;
  }

  const winnerGroupId = initiatorWon ? opposition.initiatorGroupId : opposition.bandGroupId;
  const loserGroupId = initiatorWon ? opposition.bandGroupId : opposition.initiatorGroupId;

  const winnerCohesionDelta = applyCohesionDelta(graph, winnerGroupId, GROUP_COHESION_CONTEST_WON_DELTA);
  const loserCohesionDelta = applyCohesionDelta(graph, loserGroupId, GROUP_COHESION_CONTEST_LOST_DELTA);

  // "Decisive" is one side winning outright. The mutual-failure branch above has
  // already returned, so reaching here *is* the decisive case — both sides broke off
  // bloodied only when nobody won, and that path never rolls for a death.
  //
  // THR-731 PR 3: unless the initiating template opted out. A Standoff that goes
  // badly costs the ground and the company's standing and takes nobody with it —
  // the non-lethal rung is a design commitment, not a low roll.
  let casualty: GraphNode | undefined;
  if (!isNonLethalContest(opposition.initiator.templateId) && rng() < BAND_CASUALTY_CHANCE) {
    casualty = applyCasualty(graph, loserGroupId, rng, state.tick);
  }

  const grudgeWritten = writeGrudge(graph, opposition.initiatorGroupId, opposition.bandGroupId, state.tick);

  emitContestTrace(
    state, opposition, winnerGroupId, loserGroupId,
    winnerCohesionDelta, loserCohesionDelta, casualty, grudgeWritten,
    initiatorWon ? 'initiator_won' : 'band_won',
  );

  return {
    winnerGroupId,
    loserGroupId,
    winnerCohesionDelta,
    loserCohesionDelta,
    casualtyId: casualty?.id,
    casualtyName: casualty?.name,
    grudgeWritten,
  };
}

function emitContestTrace(
  state: GameState,
  opposition: BandOpposition,
  winnerGroupId: string | undefined,
  loserGroupId: string | undefined,
  winnerCohesionDelta: number,
  loserCohesionDelta: number,
  casualty: GraphNode | undefined,
  grudgeWritten: boolean,
  verdict: 'initiator_won' | 'band_won' | 'mutual_failure',
): void {
  const graph = state.graph;
  const companyName = graph.getNode(opposition.initiatorGroupId)?.name ?? opposition.initiatorGroupId;
  const bandName = graph.getNode(opposition.bandGroupId)?.name ?? opposition.bandGroupId;

  const summary = verdict === 'mutual_failure'
    ? `${companyName} and ${bandName} broke off with nothing settled.`
    : `${verdict === 'initiator_won' ? companyName : bandName} came off best against ${verdict === 'initiator_won' ? bandName : companyName}.`;

  const trace: Omit<GroupContestedTrace, 'id' | 'timestamp'> = {
    category: 'group_contested',
    tick: state.tick,
    initiatorActionId: opposition.initiator.actionId,
    counterActionId: opposition.counter.actionId,
    initiatorGroupId: opposition.initiatorGroupId,
    bandGroupId: opposition.bandGroupId,
    verdict,
    winnerGroupId,
    loserGroupId,
    winnerCohesionDelta,
    loserCohesionDelta,
    casualtyId: casualty?.id,
    grudgeWritten,
    summary: casualty ? `${summary} ${casualty.name} did not walk away.` : summary,
  };
  emitTrace(trace);
}
