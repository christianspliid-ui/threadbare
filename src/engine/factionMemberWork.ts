/**
 * Faction Member Work — off-screen guild work for members the decision loop never sees.
 *
 * ## Why this exists
 *
 * THR-810 measured guild reputation gain at exactly **zero** over a full live run, then
 * THR-814 measured why: faction membership is seeded almost entirely onto `ambient` NPCs
 * (225 of 227 on seed 42 / medium), while `phaseAgentDecision` — the only phase that
 * generates guild-quest candidates — iterates `individual` actors at `spotlight` tier.
 * Two members in 227 could reach the draw path at all. The guild economy was not
 * mis-tuned or mis-scored; it was switched off for 99% of its participants, which is why
 * six candidate fixes across the two tickets were all void: each adjusted a stage the
 * content never reached.
 *
 * ## The routing rule
 *
 * The attention-tier model's premise is that ambient actors are **not** simulated
 * individually. Content that reaches them must therefore resolve at the tier that *is*
 * simulated — the faction node. This module runs inside `phaseFactionActions`, which
 * already sweeps all faction nodes and already owns `commission_quest`.
 *
 * Rejected alternatives are recorded in full in the THR-814 verdict; the two that mattered:
 * promoting members to `spotlight` (~14× the per-tick decision cost, in the phase already
 * identified as the large-map stall) and re-seeding membership onto spotlight agents
 * (cuts 227 memberships to ≤17 and hollows out faction politics, succession, and network,
 * all of which read member counts).
 *
 * ## What it deliberately reuses
 *
 * Rank access comes from `getAccessibleTemplates`, and the payout runs through
 * `processFactionEncounterReputation` — the same two functions the attended path uses.
 * Nothing here re-derives a rank threshold or a reward. An ambient member is offered
 * exactly the content their rank unlocks on-screen, and paid by the same code, scaled by
 * one constant. That is what keeps this a second *entry point* to the guild economy
 * rather than a second guild economy.
 *
 * NFP: Tunability (every number in `faction-member-work-constants.ts`),
 *      Determinism (seeded PRNG, its own salt), Inspectability (one aggregate trace per
 *      faction per pass), Fail-soft (per-faction and per-member catch; never throws).
 *
 * Verdict doc: `Docs/audits/2026-07-27-thr-814-faction-draw-path.md` · Issue: THR-815
 */

import type { GameState, TickEvent } from '../types/gameState';
import { getFactionMembershipEdges } from './graphQueries';
import type { GraphNode } from '../types/graph';
import type { MemberOfEdgeProperties } from '../types/disposition';
import type { FactionMemberWorkTrace } from '../types/factionAction';
import { computeRankFromReputation } from '../types/faction';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import { getAccessibleTemplates } from './factionQuestGeneration';
import { processFactionEncounterReputation } from './factionReputation';
import { emitTrace } from './traceBuffer';
import {
  FACTION_MEMBER_WORK_INTERVAL,
  FACTION_MEMBER_WORK_MAX_PER_FACTION,
  FACTION_MEMBER_WORK_MIN_PER_FACTION,
  FACTION_MEMBER_WORK_MEMBER_FRACTION,
  FACTION_MEMBER_WORK_SUCCESS_BASE,
  FACTION_MEMBER_WORK_TIER_PENALTY,
  FACTION_MEMBER_WORK_MIN_SUCCESS,
  FACTION_MEMBER_WORK_REWARD_SCALE,
  FACTION_MEMBER_WORK_PRNG_SALT,
} from '../data/faction-member-work-constants';
import {
  FACTION_MEMBER_WORK_PROMOTION_PROSE,
  FACTION_MEMBER_WORK_SUMMARY_PROSE,
  fillMemberWorkProse,
  pickMemberWorkProse,
} from '../data/faction-member-work-content';

// ─── PRNG (mulberry32 — same as all engine modules) ──────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// ─── Eligibility ─────────────────────────────────────────────────────────────

/**
 * Does this member need the off-screen path?
 *
 * Only actors the decision loop cannot see. A `spotlight` individual already generates
 * guild candidates through `phaseAgentDecision` (and, since THR-814's cap-stage reserve,
 * those candidates actually reach the board) — routing them through here as well would
 * pay them twice for one membership and quietly make the attended path the weaker one.
 *
 * The tier default matters: nodes predating the attention-tier model carry no
 * `spotlightTier`, and both `phaseAgentDecision` and `agentValidation` read a missing
 * tier as `'spotlight'`. This mirrors that default exactly, so the two paths partition
 * the membership set with no member falling through both or neither.
 */
export function isOffLoopMember(node: GraphNode | undefined | null): boolean {
  if (!node || node.type !== 'actor') return false;
  const props = node.properties;
  if (props.actorType !== 'individual') return false;
  if (props.armyState != null) return false;
  const tier = (props.spotlightTier as string | undefined) ?? 'spotlight';
  return tier !== 'spotlight';
}

interface EligibleMember {
  agentId: string;
  factionDefId: string;
  reputation: number;
}

/** Collect a faction's off-loop members, in stable graph order. */
function collectEligibleMembers(state: GameState, factionId: string): EligibleMember[] {
  const out: EligibleMember[] = [];
  for (const edge of state.graph.getIncomingEdges(factionId, 'member_of')) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (!props.factionDefId) continue; // pre-faction membership (economic guilds)
    if (!isOffLoopMember(state.graph.getNode(edge.source))) continue;
    out.push({
      agentId: edge.source,
      factionDefId: props.factionDefId,
      reputation: props.reputation ?? 0,
    });
  }
  return out;
}

/**
 * Choose this pass's window into the member list.
 *
 * The offset walks with the pass counter so every member comes up in turn. This is not
 * cosmetic: filling the window from the head of a list every pass is exactly the
 * positional starvation THR-814 found at the encounter cap stage, where per-agent
 * entries sat at the tail of a ~4,650-entry list and were unreachable *by construction,
 * not outscored*. Same failure shape, so it gets ruled out here by construction too.
 */
export function selectWorkWindow<T>(members: readonly T[], tick: number, size: number): T[] {
  if (members.length === 0 || size <= 0) return [];
  const take = Math.min(size, members.length);
  const passIndex = Math.floor(tick / FACTION_MEMBER_WORK_INTERVAL);
  const offset = ((passIndex * take) % members.length + members.length) % members.length;
  const window: T[] = [];
  for (let i = 0; i < take; i++) window.push(members[(offset + i) % members.length]);
  return window;
}

/**
 * How many members this faction resolves in one pass.
 *
 * Proportional to membership, clamped both ends: the floor keeps a three-person guild
 * moving, the ceiling is the NFP #7 cost bound. See
 * {@link FACTION_MEMBER_WORK_MEMBER_FRACTION} for why a flat cap was wrong — it made a
 * large guild's apex tier unreachable purely because the guild was large.
 */
export function workWindowSize(eligibleCount: number): number {
  if (eligibleCount <= 0) return 0;
  const proportional = Math.ceil(eligibleCount * FACTION_MEMBER_WORK_MEMBER_FRACTION);
  const clamped = Math.min(
    FACTION_MEMBER_WORK_MAX_PER_FACTION,
    Math.max(FACTION_MEMBER_WORK_MIN_PER_FACTION, proportional),
  );
  return Math.min(clamped, eligibleCount);
}

/** Success probability for one job, by authored quest tier. */
export function successProbabilityFor(questType: keyof typeof FACTION_MEMBER_WORK_TIER_PENALTY): number {
  const penalty = FACTION_MEMBER_WORK_TIER_PENALTY[questType] ?? 0;
  return Math.max(FACTION_MEMBER_WORK_MIN_SUCCESS, FACTION_MEMBER_WORK_SUCCESS_BASE - penalty);
}

// ─── Main pass ───────────────────────────────────────────────────────────────

/**
 * Resolve one pass of off-screen guild work across every faction.
 *
 * Returns the tick events worth surfacing — promotions only. Called from
 * `phaseFactionActions`; safe to call on any tick, as it gates on its own interval.
 */
export function resolveFactionMemberWork(state: GameState): TickEvent[] {
  if (state.tick % FACTION_MEMBER_WORK_INTERVAL !== 0) return [];

  const events: TickEvent[] = [];
  const factionNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && !n.properties.dissolved);

  for (const faction of factionNodes) {
    try {
      resolveForFaction(state, faction, events);
    } catch {
      // Fail-soft (NFP #4): one faction's bad data never crashes the tick loop.
    }
  }

  return events;
}

function resolveForFaction(state: GameState, faction: GraphNode, events: TickEvent[]): void {
  const eligible = collectEligibleMembers(state, faction.id);
  if (eligible.length === 0) return;

  const window = selectWorkWindow(eligible, state.tick, workWindowSize(eligible.length));
  const rng = mulberry32(
    state.seed + state.tick * FACTION_MEMBER_WORK_PRNG_SALT + hashString(faction.id),
  );

  let succeeded = 0;
  let failed = 0;
  let skippedNoTemplate = 0;
  let reputationAwarded = 0;
  let promotions = 0;
  let lastWorkName = '';
  let lastOutcome: 'success' | 'failure' = 'failure';

  for (const member of window) {
    try {
      const definition = FACTION_DEFINITIONS.get(member.factionDefId);
      if (!definition) { skippedNoTemplate++; continue; }

      // Rank is always derived from reputation, never read from the edge's cached
      // `role`/`rank` — those only refresh on a tier *change* and so lag a decay that
      // has not yet crossed a boundary. Same rule the shipped rank gate follows.
      const currentRank = computeRankFromReputation(member.reputation, definition);
      const accessible = getAccessibleTemplates(definition, currentRank);
      if (accessible.length === 0) { skippedNoTemplate++; continue; }

      const template = accessible[Math.floor(rng() * accessible.length)];
      const meta = FACTION_ENCOUNTER_META.get(template.id);
      if (!meta) { skippedNoTemplate++; continue; }

      const success = rng() < successProbabilityFor(meta.questType);
      lastWorkName = template.name;
      lastOutcome = success ? 'success' : 'failure';

      if (!success) { failed++; continue; }

      const before = readReputation(state, member.agentId, member.factionDefId);
      processFactionEncounterReputation(
        state.graph,
        member.agentId,
        template.id,
        true,  // stepSuccess
        true,  // encounterCompleted — off-screen work resolves whole, not step by step
        state.tick,
        FACTION_MEMBER_WORK_REWARD_SCALE,
      );
      const after = readReputation(state, member.agentId, member.factionDefId);

      succeeded++;
      reputationAwarded += Math.max(0, after - before);

      // Promotion is derived by comparing tiers either side of the payout rather than
      // by trusting a flag: `processFactionEncounterReputation` returns void, and the
      // edge's cached role is written only when a boundary is crossed.
      const newRank = computeRankFromReputation(after, definition);
      if (newRank.id !== currentRank.id && after > before) {
        promotions++;
        const event = buildPromotionEvent(state, faction, member.agentId, newRank.name, rng);
        if (event) events.push(event);
      }
    } catch {
      // Fail-soft per member: a single bad membership never aborts the faction's pass.
    }
  }

  const resolved = succeeded + failed;
  if (resolved === 0 && skippedNoTemplate === 0) return;

  const summaryPool = FACTION_MEMBER_WORK_SUMMARY_PROSE[lastOutcome];
  const summary = lastWorkName
    ? fillMemberWorkProse(pickMemberWorkProse(summaryPool, hashString(faction.id) + state.tick), {
        faction: faction.name,
        work: lastWorkName,
        count: resolved,
      })
    : `${faction.name}: no member work resolved this pass.`;

  emitTrace({
    tick: state.tick,
    category: 'faction_member_work',
    factionId: faction.id,
    factionName: faction.name,
    eligibleMembers: eligible.length,
    resolved,
    succeeded,
    failed,
    skippedNoTemplate,
    reputationAwarded,
    promotions,
    summary,
  } as FactionMemberWorkTrace);
}

/** Read a membership's current reputation. Returns 0 when the edge is gone. */
function readReputation(state: GameState, agentId: string, factionDefId: string): number {
  for (const edge of getFactionMembershipEdges(state.graph, agentId)) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (props.factionDefId === factionDefId) return props.reputation ?? 0;
  }
  return 0;
}

/**
 * Build the one player-facing beat this path produces.
 *
 * Individual jobs stay in traces; only a rank change surfaces. 227 memberships' worth of
 * routine errands would drown the feed and tell the player nothing they can act on,
 * whereas a named mortal's standing shifting inside a named guild is a world beat — and
 * the exact event the *decay* side of this economy already emits when it demotes someone.
 *
 * The id carries faction, actor and tick. Omitting the faction is THR-781, still open:
 * `faction_decay_rank_${tick}_${source}` collides into duplicate React keys for a mortal
 * holding two memberships. Not repeating it here.
 */
function buildPromotionEvent(
  state: GameState,
  faction: GraphNode,
  agentId: string,
  rankName: string,
  rng: () => number,
): TickEvent | null {
  const agent = state.graph.getNode(agentId);
  if (!agent) return null;

  const locEdges = state.graph.getOutgoingEdges(agentId, 'located_at');
  const locNode = locEdges.length > 0 ? state.graph.getNode(locEdges[0].target) : undefined;
  const hexCoords = locNode?.properties?.hexCol != null
    ? { col: locNode.properties.hexCol as number, row: locNode.properties.hexRow as number }
    : undefined;

  const message = fillMemberWorkProse(
    pickMemberWorkProse(FACTION_MEMBER_WORK_PROMOTION_PROSE, Math.floor(rng() * 1e6)),
    { agent: agent.name, rank: rankName, faction: faction.name },
  );

  return {
    id: `faction_member_work_promote_${faction.id}_${agentId}_${state.tick}`,
    tick: state.tick,
    type: 'faction_rank_changed',
    message,
    significance: 0.6,
    notification: { channel: 'toast', icon: 'faction' },
    hexCoords,
    actorId: agentId,
    factionId: faction.id,
  };
}
