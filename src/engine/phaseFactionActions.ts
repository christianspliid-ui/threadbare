/**
 * Phase Faction Actions — Phase 6.652 of the tick loop.
 *
 * Factions evaluate their active ambition and world state every
 * FACTION_ACTION_INTERVAL ticks and select one action to execute.
 * Actions produce world changes through encounter injection and direct
 * graph operations.
 *
 * 6 v1 action types: commission_quest, declare_rivalry, propose_alliance,
 * excommunicate, hold_conclave, issue_bounty.
 * Deferred to v1.1: sponsor_agent, build_guild_hall, establish_chapter, territorial_claim.
 *
 * Design doc: Docs/plans/2026-04-14-faction-agency-implementation.md
 * Quality gate: Docs/plans/2026-04-18-faction-agency-quality-gate.md
 * NFP: Tunability (all magic numbers in factionAction.ts constants),
 *       Determinism (seeded PRNG), Inspectability (traces), Fail-soft (skip on error).
 */

import type { GameState } from '../types/gameState';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { AxiologicalProfile } from '../types/agent';
import type { FactionAmbitionType } from '../types/faction';
import type {
  FactionActionType,
  FactionActionTemplate,
  FactionActionRecord,
  FactionActionTrace,
} from '../types/factionAction';
import {
  FACTION_ACTION_INTERVAL,
  FACTION_ACTION_COOLDOWN,
  FACTION_MIN_TREASURY,
  COMMISSION_QUEST_COST,
  COMMISSION_QUEST_EXPIRY,
  RIVALRY_SENTIMENT_THRESHOLD,
  ALLIANCE_SENTIMENT_THRESHOLD,
  RIVALRY_SENTIMENT_VALUE,
  ALLIANCE_SENTIMENT_VALUE,
  EXCOMMUNICATION_REPUTATION_SPLASH,
  CONCLAVE_BASE_FREQUENCY_TICKS,
  CONCLAVE_MAX_PARTICIPANTS,
  BOUNTY_COST,
  BOUNTY_EXPIRY,
  BOUNTY_REWARD,
  FACTION_ACTION_HISTORY_MAX,
} from '../types/factionAction';
import { readWealth, applyWealthDelta } from './wealth';
import { emitTrace } from './traceBuffer';
import {
  DISSENT_DECAY_PER_TICK,
  DISSENT_ENCOUNTER_THRESHOLD,
  STIR_DISSENT_SEEDED_ENCOUNTER_ID,
  DIVINE_WHISPER_PENDING_CONDITION,
} from '../data/faction-action-constants';
import { refreshFactionDerivedFlags, getFactionLeaderId, getAnointedLeaderId } from './factionNetwork';
import type { FactionStirDissentTrace } from '../types/factionAction';

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
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

// ─── Action Template Definitions ─────────────────────────────────────────────

export const FACTION_ACTION_TEMPLATES: ReadonlyMap<FactionActionType, FactionActionTemplate> = new Map([
  ['commission_quest', {
    type: 'commission_quest',
    name: 'Commission Quest',
    treasuryCost: COMMISSION_QUEST_COST,
    cooldownTicks: 15,
    minMembers: 2,
    ambitionAffinity: ['resource_acquisition', 'territorial_expansion'],
  }],
  ['declare_rivalry', {
    type: 'declare_rivalry',
    name: 'Declare Rivalry',
    treasuryCost: 0,
    cooldownTicks: 40,
    minMembers: 1,
    ambitionAffinity: ['revenge', 'territorial_expansion'],
  }],
  ['propose_alliance', {
    type: 'propose_alliance',
    name: 'Propose Alliance',
    treasuryCost: 0,
    cooldownTicks: 50,
    minMembers: 1,
    ambitionAffinity: ['defensive_consolidation', 'cultural_dominance'],
  }],
  ['excommunicate', {
    type: 'excommunicate',
    name: 'Excommunicate',
    treasuryCost: 0,
    cooldownTicks: 20,
    minMembers: 2,
    ambitionAffinity: ['revenge', 'defensive_consolidation'],
  }],
  ['hold_conclave', {
    type: 'hold_conclave',
    name: 'Hold Conclave',
    treasuryCost: 0,
    cooldownTicks: CONCLAVE_BASE_FREQUENCY_TICKS,
    minMembers: 2,
    ambitionAffinity: ['defensive_consolidation', 'cultural_dominance', 'divine_mandate'],
    prerequisite: { type: 'no_active_conclave' },
  }],
  ['issue_bounty', {
    type: 'issue_bounty',
    name: 'Issue Bounty',
    treasuryCost: BOUNTY_COST,
    cooldownTicks: 30,
    minMembers: 1,
    ambitionAffinity: ['revenge'],
  }],
]);

// ─── Leader Personality Bias ──────────────────────────────────────────────────

/**
 * Bias action weights based on the faction leader's axiological profile.
 * Returns a multiplier (> 1 boosts, < 1 discourages) per action type.
 * Axes: mercy_ruthlessness, courage_prudence, honesty_cunning, tradition_novelty, loyalty_ambition.
 */
function getLeaderBias(
  profile: AxiologicalProfile,
): Partial<Record<FactionActionType, number>> {
  const biasFactor = 0.4; // How much the personality shifts weights (0 = no effect)

  return {
    // Courageous leaders (courage_prudence → positive) favor direct confrontation
    declare_rivalry:   1 + biasFactor * profile.courage_prudence,
    // Merciful leaders (mercy_ruthlessness → positive) favor cooperation
    propose_alliance:  1 + biasFactor * profile.mercy_ruthlessness,
    // Ruthless leaders (mercy_ruthlessness → negative) favor purging weak members
    excommunicate:     1 + biasFactor * (-profile.mercy_ruthlessness),
    // Cunning leaders (honesty_cunning → negative) favor covert pressure via bounties
    issue_bounty:      1 + biasFactor * (-profile.honesty_cunning),
    // Traditional leaders (tradition_novelty → positive) favor formal assembly
    hold_conclave:     1 + biasFactor * profile.tradition_novelty,
    // Ambitious leaders (loyalty_ambition → negative) favor active questing
    commission_quest:  1 + biasFactor * (-profile.loyalty_ambition),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the faction leader: anointed (via `leads` edge) when present, else
 *  highest reputation non-army member. Fail-soft: returns null. */
function getFactionLeader(state: GameState, factionId: string): GraphNode | null {
  // THR-432 — `leads` edge is authoritative when present (anointed succession).
  // Existing reputation derivation is the untouched fallback.
  const anointedId = getAnointedLeaderId(state.graph, factionId);
  if (anointedId) {
    const anointed = state.graph.getNode(anointedId);
    if (anointed) return anointed;
  }

  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  let best: GraphNode | null = null;
  let bestRep = -1;

  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member || member.type !== 'actor') continue;
    if (member.properties.actorType === 'group' || member.properties.armyState != null) continue;
    const rep = (edge.properties.reputation as number) ?? 0;
    if (rep > bestRep) { bestRep = rep; best = member; }
  }

  return best;
}

/** Get the active ambition type for a faction. Fail-soft: returns null. */
function getActiveAmbition(state: GameState, factionId: string): FactionAmbitionType | null {
  const edges = state.graph.getOutgoingEdges(factionId, 'pursues');
  if (edges.length === 0) return null;
  const node = state.graph.getNode(edges[0].target);
  return (node?.properties.ambitionType as FactionAmbitionType | undefined) ?? null;
}

/** Get member count (excluding armies). */
function getMemberCount(state: GameState, factionId: string): number {
  return state.graph.getIncomingEdges(factionId, 'member_of')
    .filter(e => {
      const n = state.graph.getNode(e.source);
      return n && n.type === 'actor'
        && n.properties.actorType !== 'group'
        && n.properties.armyState == null;
    }).length;
}

/** Get ticks since a given action type was last used by this faction. Returns Infinity if never. */
function ticksSinceActionType(
  history: FactionActionRecord[],
  actionType: FactionActionType,
  currentTick: number,
): number {
  const last = history
    .filter(r => r.actionType === actionType)
    .reduce<number | null>((max, r) => (max === null || r.executedTick > max ? r.executedTick : max), null);
  return last === null ? Infinity : currentTick - last;
}

/** Check a faction action prerequisite. Returns true if the action is eligible. */
function checkPrerequisite(
  state: GameState,
  factionId: string,
  prereq: FactionActionTemplate['prerequisite'],
): boolean {
  if (!prereq) return true;
  switch (prereq.type) {
    case 'no_active_conclave': {
      const node = state.graph.getNode(factionId);
      return !node?.properties.activeConclave;
    }
    case 'has_rival': {
      return state.graph.getOutgoingEdges(factionId, 'relates_to')
        .some(e => e.properties.isRival === true);
    }
    case 'has_ally': {
      return state.graph.getOutgoingEdges(factionId, 'relates_to')
        .some(e => e.properties.isAlliance === true);
    }
    case 'member_count_above': {
      return getMemberCount(state, factionId) > prereq.count;
    }
    case 'treasury_above': {
      const node = state.graph.getNode(factionId);
      return readWealth(node?.properties ?? {}) > prereq.amount;
    }
    case 'leader_exists': {
      return getFactionLeader(state, factionId) !== null;
    }
  }
}

/** Record an action in the faction's history, capping at FACTION_ACTION_HISTORY_MAX. */
function recordActionHistory(
  state: GameState,
  factionId: string,
  record: FactionActionRecord,
): void {
  const node = state.graph.getNode(factionId);
  if (!node) return;
  const history = ((node.properties.factionActionHistory as FactionActionRecord[] | undefined) ?? []).slice();
  history.push(record);
  if (history.length > FACTION_ACTION_HISTORY_MAX) history.splice(0, history.length - FACTION_ACTION_HISTORY_MAX);
  state.graph.updateNode(factionId, { properties: { factionActionHistory: history, lastActionTick: record.executedTick } });
}

// ─── Action Executors ─────────────────────────────────────────────────────────

function executeCommissionQuest(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
): FactionActionRecord | null {
  const factionDefId = faction.properties.factionDefId as string | undefined;
  if (!factionDefId) return null;

  const questNodeId = `faction_quest_${faction.id}_${state.tick}`;
  const expiry = state.tick + COMMISSION_QUEST_EXPIRY;

  state.graph.addNode({
    id: questNodeId,
    type: 'event',
    name: `${faction.name} Commission`,
    properties: {
      nodeSubtype: 'faction_quest',
      factionId: faction.id,
      factionDefId,
      expiryTick: expiry,
      reward: BOUNTY_REWARD,
      createdTick: state.tick,
      claimed: false,
    },
  });

  state.graph.addEdge({
    id: `e_commissions_${faction.id}_${questNodeId}`,
    source: faction.id,
    target: questNodeId,
    type: 'commissions',
    properties: { expiryTick: expiry },
  });

  // Deduct treasury
  const treasury = readWealth(faction.properties);
  state.graph.updateNode(faction.id, {
    properties: { wealth: applyWealthDelta(treasury, -COMMISSION_QUEST_COST) },
  });

  void rng(); // consume one RNG value for determinism consistency

  return {
    actionType: 'commission_quest',
    executedTick: state.tick,
    targetId: questNodeId,
    outcome: 'success',
    details: { expiryTick: expiry },
  };
}

function executeDeclareRivalry(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
): FactionActionRecord | null {
  // Find the other faction with most negative sentiment, or competing factions
  const allFactions = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && n.id !== faction.id);

  if (allFactions.length === 0) return null;

  // Score candidates: prefer negative sentiment, avoid existing rivals
  const candidates = allFactions.map(f => {
    const existingEdge = state.graph.getOutgoingEdges(faction.id, 'relates_to')
      .find(e => e.target === f.id);
    const sentiment = (existingEdge?.properties.sentiment as number) ?? 0;
    if (existingEdge?.properties.isRival) return null; // Already rivals
    return { faction: f, sentiment, score: -sentiment + rng() * 0.1 };
  }).filter((c): c is NonNullable<typeof c> => c !== null && c.sentiment < RIVALRY_SENTIMENT_THRESHOLD);

  if (candidates.length === 0) {
    // No faction below threshold — pick lowest-sentiment faction
    const sorted = allFactions
      .map(f => {
        const edge = state.graph.getOutgoingEdges(faction.id, 'relates_to').find(e => e.target === f.id);
        if (edge?.properties.isRival) return null;
        const sentiment = (edge?.properties.sentiment as number) ?? 0;
        return { faction: f, sentiment };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.sentiment - b.sentiment);
    if (sorted.length === 0) return null;
    candidates.push({ ...sorted[0], score: 0 });
  }

  candidates.sort((a, b) => b.score - a.score);
  const target = candidates[0].faction;

  // Create or update relates_to edge
  const existingEdge = state.graph.getOutgoingEdges(faction.id, 'relates_to')
    .find(e => e.target === target.id);
  const edgeId = existingEdge?.id ?? `e_relates_${faction.id}_${target.id}`;

  if (existingEdge) {
    state.graph.updateEdge(edgeId, {
      properties: {
        sentiment: RIVALRY_SENTIMENT_VALUE,
        basis: 'rivalry',
        isRival: true,
        isAlliance: false,
        declaredAtTick: state.tick,
      },
    });
  } else {
    state.graph.addEdge({
      id: edgeId,
      source: faction.id,
      target: target.id,
      type: 'relates_to',
      properties: {
        sentiment: RIVALRY_SENTIMENT_VALUE,
        basis: 'rivalry',
        isRival: true,
        isAlliance: false,
        declaredAtTick: state.tick,
      },
    });
  }

  return {
    actionType: 'declare_rivalry',
    executedTick: state.tick,
    targetId: target.id,
    targetName: target.name,
    outcome: 'success',
  };
}

function executeProposeAlliance(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
): FactionActionRecord | null {
  const allFactions = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && n.id !== faction.id);

  if (allFactions.length === 0) return null;

  // Prefer factions with positive sentiment and shared rivals
  const factionRivals = new Set(
    state.graph.getOutgoingEdges(faction.id, 'relates_to')
      .filter(e => e.properties.isRival)
      .map(e => e.target),
  );

  const candidates = allFactions.map(f => {
    const existingEdge = state.graph.getOutgoingEdges(faction.id, 'relates_to')
      .find(e => e.target === f.id);
    if (existingEdge?.properties.isAlliance) return null; // Already allied
    if (existingEdge?.properties.isRival) return null; // Can't ally with rivals
    const sentiment = (existingEdge?.properties.sentiment as number) ?? 0;
    if (sentiment < ALLIANCE_SENTIMENT_THRESHOLD) return null;
    // Bonus for shared rivals
    const sharedRivals = state.graph.getOutgoingEdges(f.id, 'relates_to')
      .filter(e => e.properties.isRival && factionRivals.has(e.target)).length;
    return { faction: f, sentiment, score: sentiment + sharedRivals * 0.2 + rng() * 0.05 };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const target = candidates[0].faction;

  const existingEdge = state.graph.getOutgoingEdges(faction.id, 'relates_to')
    .find(e => e.target === target.id);
  const edgeId = existingEdge?.id ?? `e_relates_${faction.id}_${target.id}`;

  if (existingEdge) {
    state.graph.updateEdge(edgeId, {
      properties: {
        sentiment: ALLIANCE_SENTIMENT_VALUE,
        basis: 'alliance',
        isAlliance: true,
        isRival: false,
        formedAtTick: state.tick,
      },
    });
  } else {
    state.graph.addEdge({
      id: edgeId,
      source: faction.id,
      target: target.id,
      type: 'relates_to',
      properties: {
        sentiment: ALLIANCE_SENTIMENT_VALUE,
        basis: 'alliance',
        isAlliance: true,
        isRival: false,
        formedAtTick: state.tick,
      },
    });
  }

  return {
    actionType: 'propose_alliance',
    executedTick: state.tick,
    targetId: target.id,
    targetName: target.name,
    outcome: 'success',
  };
}

function executeExcommunicate(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
): FactionActionRecord | null {
  const memberEdges = state.graph.getIncomingEdges(faction.id, 'member_of');
  if (memberEdges.length < 2) return null; // Keep at least 1 member

  // Score candidates for excommunication: lowest reputation OR dual-member in rival faction
  const rivalFactionIds = new Set(
    state.graph.getOutgoingEdges(faction.id, 'relates_to')
      .filter(e => e.properties.isRival)
      .map(e => e.target),
  );

  interface ExcommCandidate { edge: GraphEdge; member: GraphNode; score: number }
  const candidates: ExcommCandidate[] = [];

  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member || member.type !== 'actor') continue;
    if (member.properties.armyState != null || member.properties.actorType === 'group') continue;

    const rep = (edge.properties.reputation as number) ?? 0;
    // Check if this member also belongs to a rival faction
    const isInRivalFaction = state.graph.getOutgoingEdges(member.id, 'member_of')
      .some(me => rivalFactionIds.has(me.target));

    const score = (isInRivalFaction ? 1.0 : 0) + (1 - rep) * 0.5 + rng() * 0.1;
    candidates.push({ edge, member, score });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const { edge: targetEdge, member: targetMember } = candidates[0];

  // Remove member_of edge
  state.graph.removeEdge(targetEdge.id);

  // Create hostile_to edge: faction → ex-member
  const hostileEdgeId = `e_hostile_${faction.id}_${targetMember.id}_${state.tick}`;
  state.graph.addEdge({
    id: hostileEdgeId,
    source: faction.id,
    target: targetMember.id,
    type: 'hostile_to',
    properties: {
      reason: 'excommunicated',
      createdTick: state.tick,
    },
  });

  // Apply reputation splash to ex-member's other faction memberships
  if (EXCOMMUNICATION_REPUTATION_SPLASH > 0) {
    const otherMemberships = state.graph.getOutgoingEdges(targetMember.id, 'member_of');
    for (const me of otherMemberships) {
      const curRep = (me.properties.reputation as number) ?? 0;
      state.graph.updateEdge(me.id, {
        properties: { reputation: Math.max(0, curRep - EXCOMMUNICATION_REPUTATION_SPLASH) },
      });
    }
  }

  // Apply "cast_out" condition to the ex-member
  state.graph.updateNode(targetMember.id, {
    properties: {
      conditions: addCondition(
        (targetMember.properties.conditions as string[] | undefined) ?? [],
        'cast_out',
      ),
    },
  });

  return {
    actionType: 'excommunicate',
    executedTick: state.tick,
    targetId: targetMember.id,
    targetName: targetMember.name,
    outcome: 'success',
  };
}

function executeHoldConclave(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
): FactionActionRecord | null {
  // Select participants: top-reputation members up to CONCLAVE_MAX_PARTICIPANTS
  const memberEdges = state.graph.getIncomingEdges(faction.id, 'member_of');
  const participants: Array<{ id: string; name: string; reputation: number }> = [];

  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member || member.type !== 'actor') continue;
    if (member.properties.armyState != null || member.properties.actorType === 'group') continue;
    participants.push({
      id: member.id,
      name: member.name,
      reputation: (edge.properties.reputation as number) ?? 0,
    });
  }

  if (participants.length < 2) return null;

  participants.sort((a, b) => b.reputation - a.reputation);
  const selected = participants.slice(0, CONCLAVE_MAX_PARTICIPANTS);

  // Get current ambition to frame the conclave question
  const ambitionType = getActiveAmbition(state, faction.id) ?? 'defensive_consolidation';
  const question = conclaveQuestion(ambitionType, faction.name);

  // Set activeConclave on faction node (3-tick deliberation)
  state.graph.updateNode(faction.id, {
    properties: {
      activeConclave: {
        question,
        participants: selected.map(p => p.id),
        ticksRemaining: 3,
        startedTick: state.tick,
        ambitionType,
        leverageState: 0.5 + (rng() - 0.5) * 0.2, // slight randomness in debate momentum
      },
    },
  });

  return {
    actionType: 'hold_conclave',
    executedTick: state.tick,
    outcome: 'pending',
    details: {
      participants: selected.map(p => p.id),
      question,
      ticksRemaining: 3,
    },
  };
}

function executeIssueBounty(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
): FactionActionRecord | null {
  // Find target: excommunicated members with hostile_to edge, or rival faction agents nearby
  const hostileEdges = state.graph.getOutgoingEdges(faction.id, 'hostile_to');
  if (hostileEdges.length === 0) return null;

  // Pick target with some randomness
  const targetEdge = hostileEdges[Math.floor(rng() * hostileEdges.length)];
  const target = state.graph.getNode(targetEdge.target);
  if (!target) return null;

  // Create bounty node
  const bountyId = `bounty_${faction.id}_${target.id}_${state.tick}`;
  state.graph.addNode({
    id: bountyId,
    type: 'event',
    name: `Bounty on ${target.name}`,
    properties: {
      nodeSubtype: 'bounty',
      issuingFactionId: faction.id,
      targetAgentId: target.id,
      reward: BOUNTY_REWARD,
      expiryTick: state.tick + BOUNTY_EXPIRY,
      createdTick: state.tick,
      status: 'active',
    },
  });

  state.graph.addEdge({
    id: `e_issues_${faction.id}_${bountyId}`,
    source: faction.id,
    target: bountyId,
    type: 'issues',
    properties: { expiryTick: state.tick + BOUNTY_EXPIRY },
  });

  // Deduct treasury
  const treasury = readWealth(faction.properties);
  state.graph.updateNode(faction.id, {
    properties: { wealth: applyWealthDelta(treasury, -BOUNTY_COST) },
  });

  // Apply "hunted" condition to target
  state.graph.updateNode(target.id, {
    properties: {
      conditions: addCondition(
        (target.properties.conditions as string[] | undefined) ?? [],
        'hunted',
      ),
    },
  });

  return {
    actionType: 'issue_bounty',
    executedTick: state.tick,
    targetId: target.id,
    targetName: target.name,
    outcome: 'success',
    details: { bountyId, reward: BOUNTY_REWARD, expiryTick: state.tick + BOUNTY_EXPIRY },
  };
}

// ─── Conclave Progression ─────────────────────────────────────────────────────

/** Advance an active conclave by one tick. Resolves when ticksRemaining hits 0. */
function advanceConclave(state: GameState, faction: GraphNode): void {
  const conclave = faction.properties.activeConclave as {
    participants: string[];
    ticksRemaining: number;
    startedTick: number;
    ambitionType: FactionAmbitionType;
    leverageState: number;
    question: string;
  } | undefined;

  if (!conclave) return;

  if (conclave.ticksRemaining <= 1) {
    // Resolve conclave: outcome driven by leverageState
    resolveConclave(state, faction, conclave);
    state.graph.updateNode(faction.id, { properties: { activeConclave: null } });
  } else {
    state.graph.updateNode(faction.id, {
      properties: {
        activeConclave: { ...conclave, ticksRemaining: conclave.ticksRemaining - 1 },
      },
    });
  }
}

function resolveConclave(
  state: GameState,
  faction: GraphNode,
  conclave: {
    participants: string[];
    ambitionType: FactionAmbitionType;
    leverageState: number;
  },
): void {
  // Apply "dissenting" condition to participant who voted against the majority
  // Simplified: if leverageState < 0.5, the deliberation was contested — one dissenter
  if (conclave.leverageState < 0.45 && conclave.participants.length > 1) {
    const dissenterId = conclave.participants[conclave.participants.length - 1];
    const dissenter = state.graph.getNode(dissenterId);
    if (dissenter) {
      state.graph.updateNode(dissenterId, {
        properties: {
          conditions: addCondition(
            (dissenter.properties.conditions as string[] | undefined) ?? [],
            'dissenting',
          ),
        },
      });
    }
  }

  // The winner gains "vindicated" condition
  if (conclave.participants.length > 0) {
    const winnerId = conclave.participants[0];
    const winner = state.graph.getNode(winnerId);
    if (winner) {
      state.graph.updateNode(winnerId, {
        properties: {
          conditions: addCondition(
            (winner.properties.conditions as string[] | undefined) ?? [],
            'vindicated',
          ),
        },
      });
    }
  }

  emitTrace({
    tick: state.tick,
    category: 'faction_action',
    actionType: 'hold_conclave',
    factionId: faction.id,
    factionName: faction.name,
    ambitionType: conclave.ambitionType,
    treasuryCost: 0,
    treasuryAfter: readWealth(faction.properties),
    outcome: 'executed',
    summary: `${faction.name} conclave resolved (leverageState: ${conclave.leverageState.toFixed(2)})`,
  } as FactionActionTrace);
}

// ─── Selection Logic ──────────────────────────────────────────────────────────

interface ActionCandidate {
  template: FactionActionTemplate;
  weight: number;
}

function scoreEligibleActions(
  state: GameState,
  faction: GraphNode,
  history: FactionActionRecord[],
  ambitionType: FactionAmbitionType | null,
  leaderBias: Partial<Record<FactionActionType, number>>,
  rng: () => number,
): ActionCandidate[] {
  const treasury = readWealth(faction.properties);
  const memberCount = getMemberCount(state, faction.id);
  const candidates: ActionCandidate[] = [];

  for (const [, template] of FACTION_ACTION_TEMPLATES) {
    // Treasury check
    if (treasury < template.treasuryCost + FACTION_MIN_TREASURY) continue;
    // Member count check
    if (memberCount < template.minMembers) continue;
    // Per-action-type cooldown check
    const ticks = ticksSinceActionType(history, template.type, state.tick);
    if (ticks < template.cooldownTicks) continue;
    // Prerequisite check
    if (!checkPrerequisite(state, faction.id, template.prerequisite)) continue;

    // Base weight: ambition affinity
    const ambitionBonus = ambitionType && template.ambitionAffinity.includes(ambitionType) ? 1.5 : 1.0;
    // Leader personality bias (clamp to [0.2, 3.0] to avoid zeroing out)
    const bias = Math.max(0.2, Math.min(3.0, leaderBias[template.type] ?? 1.0));
    // Tiny noise for deterministic tie-breaking
    const noise = 0.9 + rng() * 0.2;

    candidates.push({ template, weight: ambitionBonus * bias * noise });
  }

  return candidates;
}

function selectWeighted(candidates: ActionCandidate[], rng: () => number): FactionActionTemplate | null {
  if (candidates.length === 0) return null;
  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let r = rng() * total;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.template;
  }
  return candidates[candidates.length - 1].template;
}

// ─── Main Phase ───────────────────────────────────────────────────────────────

export function phaseFactionActions(state: GameState): void {
  // THR-400 — dissent decay + threshold check + derived-flag refresh run every
  // tick, regardless of FACTION_ACTION_INTERVAL. This is intentional: the
  // player's verbs need responsive UI feedback (the drawer should not show a
  // verb that's no longer applicable after one tick), and dissent must drift
  // smoothly to avoid stepwise gaps in the ambient indicator. Cost is O(F) per
  // tick where F is the faction count (~5–20 in a run).
  tickFactionGovernance(state);

  if (state.tick % FACTION_ACTION_INTERVAL !== 0) {
    // Still need to advance active conclaves on non-evaluation ticks
    advanceAllConclaves(state);
    return;
  }

  const factionNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction');

  for (const faction of factionNodes) {
    try {
      processFaction(state, faction);
    } catch {
      // Fail-soft: skip this faction, don't crash the tick loop
    }
  }
}

/**
 * THR-400 — per-tick faction governance pass:
 *   1. Decay each faction's dissentLevel toward zero
 *   2. When dissentLevel ≥ threshold, plant a dissent-surfaces encounter seed
 *      on the most-threaded non-leader member and reset to zero
 *   3. Tick down divine_whisper_pending conditions on faction leaders
 *   4. Refresh derived flags (hasLeader, hasDoubter, doubterId,
 *      hasRecoverableDoctrine) used by the action drawer for gating
 *
 * Fail-soft per NFP #4: catches throws per faction; never crashes the tick.
 */
function tickFactionGovernance(state: GameState): void {
  const factionNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction');

  for (const faction of factionNodes) {
    try {
      // Step 1+2: dissent decay + threshold.
      const dissent = (faction.properties.dissentLevel as number | undefined) ?? 0;
      if (dissent >= DISSENT_ENCOUNTER_THRESHOLD) {
        // Plant the dissent-surfaces seed on the most-threaded non-leader
        // member, or fall through to the leader, or the highest-rank non-leader
        // member with axiological misalignment.
        const targetId = pickDissentSurfacesTarget(state, faction.id);
        if (targetId) {
          const seedId = `seed_dissent_${faction.id}_${state.tick}`;
          state.pendingEncounterSeeds = [
            ...(state.pendingEncounterSeeds ?? []),
            {
              seedId,
              sourceEncounterId: `tick_dissent_threshold_${state.tick}`,
              sourceReactionId: 'faction.tick_dissent_threshold',
              templateId: STIR_DISSENT_SEEDED_ENCOUNTER_ID,
              targetAgentId: targetId,
              eligibleAfterTick: state.tick + 1,
              priority: 0.7,
              seedLabel: `dissent surfaces inside ${faction.name}`,
              plantedTick: state.tick,
            },
          ];
          const trace: FactionStirDissentTrace = {
            tick: state.tick,
            category: 'faction_stir_dissent',
            factionId: faction.id,
            factionName: faction.name,
            previousDissentLevel: dissent,
            newDissentLevel: 0,
            seededEncounterId: seedId,
            targetMortalId: targetId,
            summary:
              `Dissent inside ${faction.name} crossed the threshold ` +
              `and surfaces on a member.`,
          };
          emitTrace(trace);
        }
        state.graph.updateNode(faction.id, { properties: { dissentLevel: 0 } });
      } else if (dissent > 0) {
        const decayed = Math.max(0, dissent - DISSENT_DECAY_PER_TICK);
        if (decayed !== dissent) {
          state.graph.updateNode(faction.id, { properties: { dissentLevel: decayed } });
        }
      }

      // Step 3: tick down divine_whisper_pending on the leader (fail-soft).
      const leaderId = getFactionLeaderId(state.graph, faction.id);
      if (leaderId) {
        const leader = state.graph.getNode(leaderId);
        if (leader) {
          const expiresTick = leader.properties.divineWhisperExpiresTick as number | undefined;
          const conditions = (leader.properties.conditions as string[] | undefined) ?? [];
          if (expiresTick != null
              && conditions.includes(DIVINE_WHISPER_PENDING_CONDITION)
              && state.tick >= expiresTick) {
            state.graph.updateNode(leaderId, {
              properties: {
                conditions: conditions.filter(c => c !== DIVINE_WHISPER_PENDING_CONDITION),
                divineWhisperPreferredPole: null,
                divineWhisperExpiresTick: null,
              },
            });
          }
        }
      }

      // Step 4: refresh derived flags used by the action drawer.
      refreshFactionDerivedFlags(state.graph, faction.id);
    } catch {
      // Fail-soft: skip this faction.
    }
  }
}

/**
 * Pick the target mortal for a dissent-surfaces encounter seed. Preference:
 *   1. Most-threaded non-leader member (highest bond-edge tier from ascendant)
 *   2. The leader (the dissent surfaces around them)
 *   3. The highest-rank non-leader member
 *
 * Returns null when the faction has no eligible members.
 */
function pickDissentSurfacesTarget(state: GameState, factionId: string): string | null {
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  if (memberEdges.length === 0) return null;
  const leaderId = getFactionLeaderId(state.graph, factionId);
  const ascendantId = state.ascendantId;

  // Pass 1: most-threaded non-leader member.
  if (ascendantId) {
    const bonds = state.graph.getOutgoingEdges(ascendantId, 'bond');
    const bondByTarget = new Map<string, number>();
    for (const e of bonds) {
      bondByTarget.set(e.target, (e.properties.tier as number | undefined) ?? 1);
    }
    let bestMember: { id: string; score: number } | null = null;
    for (const edge of memberEdges) {
      const memberId = edge.source;
      if (memberId === leaderId) continue;
      const tier = bondByTarget.get(memberId);
      if (tier == null) continue;
      if (bestMember === null || tier > bestMember.score) {
        bestMember = { id: memberId, score: tier };
      }
    }
    if (bestMember) return bestMember.id;
  }

  // Pass 2: leader fallback.
  if (leaderId) return leaderId;

  // Pass 3: first non-army member.
  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member || member.type !== 'actor') continue;
    if (member.properties.actorType === 'group') continue;
    if (member.properties.armyState != null) continue;
    return member.id;
  }
  return null;
}

function advanceAllConclaves(state: GameState): void {
  const factionNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && n.properties.activeConclave);
  for (const faction of factionNodes) {
    try {
      advanceConclave(state, faction);
    } catch {
      // Fail-soft
    }
  }
}

function processFaction(state: GameState, faction: GraphNode): void {
  // Advance any active conclave first
  if (faction.properties.activeConclave) {
    advanceConclave(state, faction);
  }

  // Global action cooldown check
  const lastActionTick = (faction.properties.lastActionTick as number | undefined) ?? 0;
  if (state.tick - lastActionTick < FACTION_ACTION_COOLDOWN) return;

  const history = (faction.properties.factionActionHistory as FactionActionRecord[] | undefined) ?? [];
  const ambitionType = getActiveAmbition(state, faction.id);

  // Get leader personality bias
  const leader = getFactionLeader(state, faction.id);
  const leaderProfile = leader?.properties.axiologicalProfile as AxiologicalProfile | undefined;
  const leaderBias: Partial<Record<FactionActionType, number>> = leaderProfile
    ? getLeaderBias(leaderProfile)
    : {};

  // Seed: unique per faction per tick
  const rng = mulberry32(state.seed + state.tick * 53 + hashString(faction.id));

  // Score and select an action
  const candidates = scoreEligibleActions(state, faction, history, ambitionType, leaderBias, rng);

  if (candidates.length === 0) {
    emitTrace({
      tick: state.tick,
      category: 'faction_action',
      actionType: 'commission_quest', // placeholder — no action taken
      factionId: faction.id,
      factionName: faction.name,
      ambitionType: ambitionType ?? 'none',
      treasuryCost: 0,
      treasuryAfter: readWealth(faction.properties),
      outcome: 'skipped_no_eligible',
      summary: `${faction.name}: no eligible actions this tick`,
    } as FactionActionTrace);
    return;
  }

  const selected = selectWeighted(candidates, rng);
  if (!selected) return;

  // Execute the selected action
  let record: FactionActionRecord | null = null;
  switch (selected.type) {
    case 'commission_quest':
      record = executeCommissionQuest(state, faction, rng); break;
    case 'declare_rivalry':
      record = executeDeclareRivalry(state, faction, rng); break;
    case 'propose_alliance':
      record = executeProposeAlliance(state, faction, rng); break;
    case 'excommunicate':
      record = executeExcommunicate(state, faction, rng); break;
    case 'hold_conclave':
      record = executeHoldConclave(state, faction, rng); break;
    case 'issue_bounty':
      record = executeIssueBounty(state, faction, rng); break;
  }

  if (!record) return;

  recordActionHistory(state, faction.id, record);

  const treasuryAfter = readWealth(state.graph.getNode(faction.id)?.properties ?? {});
  emitTrace({
    tick: state.tick,
    category: 'faction_action',
    actionType: selected.type,
    factionId: faction.id,
    factionName: faction.name,
    ambitionType: ambitionType ?? 'none',
    treasuryCost: selected.treasuryCost,
    treasuryAfter,
    targetId: record.targetId,
    targetName: record.targetName,
    outcome: 'executed',
    summary: `${faction.name} → ${selected.name}${record.targetName ? ` targeting ${record.targetName}` : ''}`,
  } as FactionActionTrace);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Add a condition string if not already present. */
function addCondition(conditions: string[], condition: string): string[] {
  if (conditions.includes(condition)) return conditions;
  return [...conditions, condition];
}

/** Generate a conclave debate question from the faction's active ambition. */
function conclaveQuestion(ambition: FactionAmbitionType, factionName: string): string {
  const questions: Record<FactionAmbitionType, string> = {
    territorial_expansion: `What must ${factionName} claim before others do?`,
    resource_acquisition: `How does ${factionName} secure what it needs?`,
    defensive_consolidation: `What threats does ${factionName} face, and how must it respond?`,
    cultural_dominance: `What does ${factionName} stand for, and who speaks for it?`,
    revenge: `What debts does ${factionName} carry, and when does it collect?`,
    divine_mandate: `What does the divine will demand of ${factionName}?`,
  };
  return questions[ambition] ?? `What is the path forward for ${factionName}?`;
}
