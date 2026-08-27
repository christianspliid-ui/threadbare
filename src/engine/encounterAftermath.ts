import type { GameState, TickEvent } from '../types/gameState';
import { grantHolding } from './holdings';
import { getFactionMembershipEdges } from './graphQueries';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type {
  AftermathTarget,
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  HiddenMark,
  IntelligenceRecord,
  PendingEncounterSeed,
  UnifiedAction,
} from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import { applyReputationWithDelta } from './reputation';
import { grantAspect } from './aspects';
import {
  ASPECT_CHRONICLE_TITLE,
  ASPECT_CHRONICLE_PROSE,
} from '../data/aspect-content';
import type { ChronicleEntry } from '../types/narrative';
import type { SphereName, CreationSphereName } from '../types';
import { CREATION_SPHERE_NAMES } from '../types';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld, touchStructure } from './simulationRuntime';
import {
  rebindLocatedAt,
  resolveRelocationDestination,
  setRelocationIntent,
} from './relocationIntent';
import { observeResidence } from './agentResidence';
import type { MembershipChangeResult } from './factionMembership';
import { joinFaction, leaveFaction, adjustMemberRank, resolveFactionNodeId } from './factionMembership';
import { RELOCATION_INTENT_TTL_TICKS } from '../data/movement-content';
import { assignAmbitionToActor } from './ambitionAssignment';
import type { TraceEntry } from '../types/trace';
import { buildPredicateContext, evaluateOptionalCondition } from './effects/effectPredicates';
import { isImmuneToAnyTag } from './effects/effectQueries';
import { raiseConditionDamaged, raiseConditionHealed } from './effects/conditionProxyEvents';
import {
  THREAD_STRENGTHEN_DEFAULT,
  THREAD_WEAKEN_DEFAULT,
  THREAD_BRANCH_INITIAL_STRENGTH,
  THREAD_STRENGTH_MAX,
  THREAD_STRENGTH_MIN,
  BOND_CREATE_INITIAL_SENTIMENT,
  BOND_CREATE_INITIAL_TRUST,
} from '../data/effect-constants';
import { CONDITION_DURATIONS } from '../data/condition-trait-content';
import { CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT } from '../data/attachment-slot-constants';
import {
  DRIFT_THRESHOLD_SOFT,
  DRIFT_THRESHOLD_BANNER,
  DRIFT_THRESHOLD_BECOMING,
} from '../data/encounter-experience-constants';
import {
  SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_COMMON,
  SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_SHAPING,
  SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_LEGENDARY,
  EMITTED_OMEN_DEFAULT_DURATION_TICKS,
  EMITTED_OMEN_MAX_ACTIVE,
  EMITTED_OMEN_LOCAL_DEFAULT_RADIUS,
  COMPULSION_DEFAULT_DURATION_TICKS,
  COMPULSION_MAX_ACTIVE,
  FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE,
  FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT,
  FACTION_PEACE_DEFAULT_SENTIMENT_BOOST,
  FACTION_PEACE_SENTIMENT_FLOOR,
  FACTION_WAR_SENTIMENT_FLOOR,
  FACTION_DRIFT_TO_RIVAL_INITIAL_REPUTATION,
  FACTION_MUTATION_CHRONICLE_SIGNIFICANCE,
  WARHOST_BASE_STRENGTH,
  WARHOST_FALLBACK_SENTIMENT_SHIFT,
} from '../data/game-config';
import type { EmittedOmen } from '../types/omen';
import type { ArtifactTier, FactionMemberSelection, PlantedCompulsion } from '../types/unifiedAction';
import type {
  CompulsionPlantedTrace,
  CompulsionDecayedTrace,
  AftermathTargetInvalidTrace,
  EncounterAftermathEffectTrace,
} from '../types/trace';
import { mulberry32 } from '../lib/prng';
import { mintCompanion, removeCompanion, getCompanions } from './companions';
// THR-1110 — the two pre-existing attachment write paths the `attachment_grant`
// dispatcher routes between. `instantiateAgreementReward` had no caller before this.
import {
  instantiateReward,
  instantiateAgreementReward,
  drawSeededReward,
  mapActionOutcomeToRewardOutcome,
} from './rewardPool';
import { getAgreementTemplate } from '../data/agreement-reward-catalog';
import { generateSecret, createSecretEdge, createFavorEdge } from './secretGeneration';
import { spawnClueFromEvent, findAnyRuinId } from './ruins/clueLifecycle';
import { applyFactionReputationGain } from './factionReputation';
import { spherePowerMultiplier, scaledEffect, scaledCost } from './sphereScaling';
import type { ControlEffect } from '../types/controlEffect';
import { MAX_SPHERE_SCORE } from '../types/sphereAffinity';
import {
  RIFT_INFLUENCE_PER_TICK,
  RIFT_INFLUENCE_CAP,
  RIFT_PERTICK_COST,
  RIFT_LEAK_CHANCE,
  RIFT_LEAK_CORRUPTION,
  RIFT_LEAK_ENTROPY_PRESSURE,
  RIFT_ESTABLISHED_SIGNIFICANCE,
  GREAT_WORK_ARTIFACT_TIER,
  GREAT_WORK_ESTABLISHED_SIGNIFICANCE,
} from '../data/game-config';
import { resolveLocationToHex } from './encounterAwareness';
import { getAscendantPrimarySphere } from './ascendantExpression';
import { raiseWarhostForce, selectCommander } from './armySpawning';
import type { WorldGraph } from './graph';
import {
  AFTERMATH_TARGET_SENTINEL,
  AFTERMATH_PRIMARY_SPHERE_SENTINEL,
} from '../data/reach-signature-content';
import { REACH_DOMAINS } from '../types/traits';
import {
  findIntelReferencedProseMatch,
  pickIntelReferencedProseLine,
  reliabilityDescriptor,
  emitIntelligenceReferenced,
} from './intelligence';
import {
  INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE,
  INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN,
  INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS,
  INTEL_REFERENCED_PROSE_DUBIOUS_FIRES,
  PERSONALITY_REACTION_WEIGHT,
  FORMATIVE_MARK_MAX_MAGNITUDE,
} from '../data/agent-behavior-constants';
import { computeAxisLeans, chooseAlignedReaction } from './encounters/reactionChooser';
import { getAxisByReach, reachToAxisId } from '../types/axisRegistry';
import type { AxiologicalProfile } from '../types/agent';
import { isSublocationNode, isPlaceTierLocation } from './sublocationShape';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Initial reputationScore on a faction node when first read (matches DEFAULT_REPUTATION for agents). */
export const DEFAULT_FACTION_REPUTATION = 0.5;

/** Default intensity on apply_condition when the effect omits it. */
export const CONDITION_DEFAULT_INTENSITY = 0.5;

/** Default durationTicks on apply_condition when omitted. 0 = indefinite (no auto-expiry). */
export const CONDITION_DEFAULT_DURATION_TICKS = 0;

/** Max aftermath_invalid_tally_key traces emitted per tick before rate-limiting. */
export const INVALID_TALLY_KEY_TRACE_RATE_LIMIT = 50;

/** Clamp applied to faction_reputation_gain effect amounts. */
export const FACTION_REPUTATION_GAIN_AMOUNT_CLAMP = 1.0;

/** Trace category emitted by headless aftermath pick paths (CLI + debug bridge). */
export const AUTO_AFTERMATH_TRACE_CATEGORY = 'cli_auto_aftermath' as const;

/** Safety cap for automatic headless aftermath picks per tick. */
export const AUTO_AFTERMATH_MAX_PICKS_PER_TICK = 8;

/** Significance for drift registration events surfaced by archetype_drift_register. */
export const ARCHETYPE_DRIFT_REGISTER_SIGNIFICANCE = 0.6;

/** Significance for the "becoming" chronicle beat emitted when a formative mark lands (THR-529).
 * Higher than ordinary drift registration — a permanent baseline shift is a defining moment. */
export const FORMATIVE_MARK_EVENT_SIGNIFICANCE = 0.75;

export interface ResolvedAftermathContext {
  readonly action: UnifiedAction;
  readonly reaction: EncounterAftermathReaction;
}

export interface ResolveAftermathContextError {
  readonly error: string;
  /**
   * THR-1112: set when the refusal is "the tick loop already applied this", not
   * "there is nothing here". Carries the tick the autonomous phase consumed the
   * aftermath at, when that was recorded (`tick: undefined` for a flag written
   * before `autonomousAftermathAppliedTick` existed).
   *
   * Deliberately an *optional field on the existing error shape* rather than a third
   * union member: every caller already branches on `'error' in resolved` and so
   * refuses correctly without being touched, while a caller that wants to phrase the
   * refusal as a notice rather than a failure can read this.
   */
  readonly alreadyApplied?: { readonly tick: number | undefined };
}

/**
 * Refuse a manual re-application of an aftermath the tick loop already consumed (THR-1112).
 *
 * `phaseAutonomousAftermath` flags the action once it applies its reaction, and that
 * flag was previously read only by the phase's own re-scan. Every other entry point —
 * CLI `aftermath pick`, the debug bridge — resolved the same action again and applied
 * every effect a second time: duplicate agreement edges, duplicate encounter seeds with
 * byte-identical ids (impediments #553, #577). Since those runs are exactly the ones
 * hunting real engine defects, a tool-induced duplicate reads as an idempotency bug in
 * whatever was just built.
 *
 * Returns null when the action is free to apply.
 */
function alreadyAppliedRefusal(
  action: UnifiedAction,
  agentId: string,
): ResolveAftermathContextError | null {
  if (!action.autonomousAftermathApplied) return null;
  const tick = action.autonomousAftermathAppliedTick;
  const when = tick === undefined ? 'autonomously' : `autonomously at tick ${tick}`;
  return {
    error: `Aftermath for '${action.templateId}' (action ${action.actionId}, agent '${agentId}') was already applied ${when}. Nothing to apply.`,
    alreadyApplied: { tick },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Valid reach-polarity tally keys — built once at module load.
const VALID_TALLY_KEYS = new Set<string>(
  REACH_DOMAINS.flatMap(d => [`${d}.positive`, `${d}.negative`]),
);

function isValidReputationTallyKey(k: string): boolean {
  return VALID_TALLY_KEYS.has(k);
}

// Curated hint map for known off-axis keys — author guidance only, not a fallback write.
// THR-1207 drained every one of these from `src/data/**`, so nothing shipped reaches it
// now; it survives for pre-sweep saved worlds. New off-axis keys are stopped at
// authoring time by `check:encounter` and `tallyKeyCorpus.test.ts`, whose shared
// shape-based hint (`suggestTallyReplacement`) is the surface to extend, not this map.
const SUGGESTED_TALLY_REPLACEMENT: Readonly<Record<string, string>> = {
  'bf.craft_work':       'faction_reputation_gain → faction.builders-fellowship',
  'bf.construction_work':'faction_reputation_gain → faction.builders-fellowship',
  'bf.fellowship_work':  'faction_reputation_gain → faction.builders-fellowship',
  'bf.master_craft':     'faction_reputation_gain → faction.builders-fellowship',
  'cg.watch_work':       'faction_reputation_gain → faction.civic-guard',
  'cg.checkpoint_work':  'faction_reputation_gain → faction.civic-guard',
  'cg.senior_work':      'faction_reputation_gain → faction.civic-guard',
  // THR-1207: was `hearth.positive`. There is no `hearth` reach — the reach is
  // spelled `heart`, so this hint named a key as invalid as the one it replaced.
  'gate_duty.witness_story_followed': 'heart.positive',
  'gate_duty.captain_marked':         'faction_reputation_gain → faction.civic-guard',
  'gate_duty.left_to_settle':         'hidden_mark (settlement_history)',
};

// Per-tick rate limiter for aftermath_invalid_tally_key traces.
let _invalidTallyRateLimit = { tick: -1, count: 0 };

export function appendRecentEvent(
  existing: readonly TickEvent[],
  event: TickEvent,
): TickEvent[] {
  return [...existing, event].slice(-MAX_RECENT_EVENTS);
}

/**
 * Resolve which target entity an aftermath effect should apply to.
 *
 * Priority: targetAgentId > targetFactionId > targetSublocationId > legacy actorId > action actor.
 * Returns { kind: 'actor_fallback' } when no explicit target is supplied.
 */
/**
 * Emit a trace from the `plant_compulsion` branch (THR-886).
 *
 * The cast is load-bearing, and the helper exists so this branch does not add to
 * the standing error count this file already carries. `emitTrace` takes
 * `Omit<TraceEntry, 'id' | 'timestamp'>`, and `Omit` over a **discriminated union**
 * distributes into a single object type holding only the keys every member shares
 * — so `agentId`, `encounterId` and every other category-specific field reads as an
 * excess property no matter how correctly its interface is declared. That is the
 * error class running through the rest of this module (and the reason it sits in
 * the type baseline, THR-489).
 *
 * Typing the parameter as the real trace interfaces keeps every payload checked at
 * the call site; the cast only crosses the collapsed boundary. Same pattern as
 * `emitNudgeTrace` in `encounters/nudgeDispatch.ts`.
 */
function emitCompulsionAftermathTrace(
  entry:
    | Omit<CompulsionPlantedTrace, 'id' | 'timestamp'>
    | Omit<CompulsionDecayedTrace, 'id' | 'timestamp'>
    | Omit<AftermathTargetInvalidTrace, 'id' | 'timestamp'>
    | Omit<EncounterAftermathEffectTrace, 'id' | 'timestamp'>,
): void {
  emitTrace(entry as Parameters<typeof emitTrace>[0]);
}

/**
 * THR-1143 — is this node a place at the hex/settlement/waypoint tier?
 *
 * Read off the graph rather than off `target.kind`, because the carrier is what
 * decides whether the movement-tax reader will ever see this condition, and an
 * effect can reach a location node through the actor fallback as well as through
 * `targetLocationId`. Fail-soft: an unresolvable id is simply not a location.
 */
function isLocationCarrier(graph: WorldGraph, nodeId: string): boolean {
  const node = graph.getNode(nodeId);
  if (!node) return false;
  return (node.type as string) === 'location'
    && node.properties?.parentLocationId === undefined;
}

/**
 * Name the tier of a place for the `location_condition_applied` trace: a hex
 * carries `terrain`, a settlement carries a `locationSubtype`, and anything else
 * reads as a bare location. Presentation-free — the trace is a designer surface.
 */
function locationCarrierKind(graph: WorldGraph, nodeId: string): string {
  const props = graph.getNode(nodeId)?.properties ?? {};
  if (typeof props.terrain === 'string' && props.terrain) return 'hex';
  if (typeof props.locationSubtype === 'string' && props.locationSubtype) return props.locationSubtype;
  return 'location';
}

export function resolveAftermathTarget(
  effect: EncounterAftermathReactionEffect,
  action: UnifiedAction | undefined,
): AftermathTarget {
  const e = effect as Partial<{
    targetAgentId: string;
    targetFactionId: string;
    targetSublocationId: string;
    targetLocationId: string;
    actorId: string; // legacy field on reputation_score / reputation_tally
  }>;
  if (e.targetAgentId) return { kind: 'agent', id: e.targetAgentId };
  if (e.targetFactionId) return { kind: 'faction', id: e.targetFactionId };
  if (e.targetSublocationId) return { kind: 'sublocation', id: e.targetSublocationId };
  // THR-1143 — a place. Ranked *below* sublocation deliberately: a sublocation is
  // also a location node, so an effect naming both means the more specific one.
  if (e.targetLocationId) return { kind: 'location', id: e.targetLocationId };
  if (e.actorId) return { kind: 'agent', id: e.actorId }; // legacy fallback
  if (action?.actorId) return { kind: 'agent', id: action.actorId };
  return { kind: 'actor_fallback' };
}

function sortAftermathCandidates(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return [...actions].sort((left, right) => {
    if (left.startTick !== right.startTick) return right.startTick - left.startTick;
    return left.actionId.localeCompare(right.actionId);
  });
}

function resolveActionFromNotification(
  state: GameState,
  candidateActions: readonly UnifiedAction[],
  agentId: string,
): UnifiedAction | null | undefined {
  const notifications = (state.encounterNotifications ?? []).filter(
    notification => notification.agentId === agentId,
  );
  if (notifications.length === 0) return undefined;

  const pendingNotifications = notifications.filter(notification => !notification.resolved);
  if (pendingNotifications.length === 0) return null;

  for (const notification of pendingNotifications) {
    const matched =
      (notification.actionId
        ? candidateActions.find(action => action.actionId === notification.actionId)
        : undefined)
      ?? candidateActions.find(action => action.templateId === notification.encounterId);
    if (matched) return matched;
  }
  return null;
}

/**
 * Pick the default reaction when no explicit `reactionId` is supplied (THR-530).
 *
 * Replaces the bare `reactions[0]` default with the profile-aligned chooser: the
 * agent's live moral axes rank the authored reactions, and the best-aligned one is
 * returned. Fail-soft — a profile-less agent, a morally-neutral agent, or reactions
 * with no inferable moral signal all fall back to `reactions[0]` (prior behavior).
 * `primaryReach` is left undefined here (the CLI/debug callers do not thread the
 * encounter reach); the reach-tally signal still applies. The autonomous tick-loop
 * phase passes the encounter reach for the fuller signal.
 */
function selectAutonomousDefaultReaction(
  state: GameState,
  agentId: string,
  reactions: readonly EncounterAftermathReaction[],
): EncounterAftermathReaction {
  const leans = computeAxisLeans(state.graph, state.archetypeDrift ?? [], agentId);
  if (!leans) return reactions[0];
  const choice = chooseAlignedReaction(reactions, leans, undefined, PERSONALITY_REACTION_WEIGHT);
  return choice.aligned ? choice.reaction : reactions[0];
}

/**
 * Resolve the current pending aftermath action + reaction for an agent.
 *
 * Deterministic selection rules:
 * 1) Prefer unresolved encounter notifications for the agent (actionId match first, then encounterId/templateId)
 * 2) If no notifications exist for the agent, fall back to latest candidate action by startTick
 * 3) If reactionId omitted, pick the profile-aligned reaction (THR-530), else the first authored reaction
 */
export function resolveAftermathContextForAgent(
  state: GameState,
  agentId: string,
  reactionId?: string,
): ResolvedAftermathContext | ResolveAftermathContextError {
  const candidateActions = state.unifiedActions.filter(
    action => action.actorId === agentId && Boolean(action.aftermathSummary),
  );
  if (candidateActions.length === 0) {
    return { error: `No pending aftermath for agent '${agentId}'.` };
  }

  const notificationSelectedAction = resolveActionFromNotification(state, candidateActions, agentId);
  if (notificationSelectedAction === undefined) {
    const fallbackAction = sortAftermathCandidates(candidateActions)[0];
    const fallbackRefusal = alreadyAppliedRefusal(fallbackAction, agentId);
    if (fallbackRefusal) return fallbackRefusal;
    const reactions = fallbackAction.aftermathSummary?.reactions;
    if (!reactions || reactions.length === 0) {
      return { error: `Pending aftermath for agent '${agentId}' has no authored reactions.` };
    }
    if (reactionId) {
      const explicitReaction = reactions.find(reaction => reaction.id === reactionId);
      if (!explicitReaction) {
        return {
          error: `Unknown aftermath reaction '${reactionId}' for agent '${agentId}'. Available: ${reactions.map(reaction => reaction.id).join(', ') || 'none'}.`,
        };
      }
      return { action: fallbackAction, reaction: explicitReaction };
    }
    return { action: fallbackAction, reaction: selectAutonomousDefaultReaction(state, agentId, reactions) };
  }

  if (notificationSelectedAction === null) {
    return { error: `No unresolved aftermath notification for agent '${agentId}'.` };
  }

  const notificationRefusal = alreadyAppliedRefusal(notificationSelectedAction, agentId);
  if (notificationRefusal) return notificationRefusal;

  const reactions = notificationSelectedAction.aftermathSummary?.reactions;
  if (!reactions || reactions.length === 0) {
    return { error: `Pending aftermath for agent '${agentId}' has no authored reactions.` };
  }
  if (reactionId) {
    const explicitReaction = reactions.find(reaction => reaction.id === reactionId);
    if (!explicitReaction) {
      return {
        error: `Unknown aftermath reaction '${reactionId}' for agent '${agentId}'. Available: ${reactions.map(reaction => reaction.id).join(', ') || 'none'}.`,
      };
    }
    return { action: notificationSelectedAction, reaction: explicitReaction };
  }
  return { action: notificationSelectedAction, reaction: selectAutonomousDefaultReaction(state, agentId, reactions) };
}

// ─── World-shaping helpers ────────────────────────────────────────────────────

interface FactionMemberCandidate {
  id: string;
  reputation: number;
}

function selectFactionMembers(
  allMembers: FactionMemberCandidate[],
  selection: FactionMemberSelection,
  state: import('../types/gameState').GameState,
  tick: number,
  encounterId: string,
  reactionId: string,
  effectIndex: number,
): FactionMemberCandidate[] {
  switch (selection.kind) {
    case 'explicit_ids':
      return allMembers.filter(m => selection.agentIds.includes(m.id));
    case 'by_reputation_above':
      return allMembers.filter(m => m.reputation > selection.threshold);
    case 'by_reputation_below':
      return allMembers.filter(m => m.reputation < selection.threshold);
    case 'within_radius': {
      const result: FactionMemberCandidate[] = [];
      for (const member of allMembers) {
        const node = state.graph.getNode(member.id);
        if (!node) continue;
        const hexCol = node.properties?.hexCol as number | undefined;
        const hexRow = node.properties?.hexRow as number | undefined;
        if (hexCol === undefined || hexRow === undefined) continue;
        const dist = Math.max(
          Math.abs(hexCol - selection.hexCol),
          Math.abs(hexRow - selection.hexRow),
          Math.abs((hexCol - hexRow) - (selection.hexCol - selection.hexRow)),
        );
        if (dist <= selection.radius) result.push(member);
      }
      return result;
    }
    case 'all_matching_trait':
      return allMembers.filter(m => {
        const traitEdges = state.graph.getOutgoingEdges(m.id, 'has_trait');
        return traitEdges.some(e => e.target === selection.traitId);
      });
    case 'random_sample': {
      const salt = `${encounterId}_${reactionId}_${effectIndex}`;
      let seed = state.seed;
      for (let c = 0; c < salt.length; c++) seed = (seed ^ salt.charCodeAt(c)) >>> 0;
      seed = (seed + tick * 31337) >>> 0;
      const rng = mulberry32(seed);
      return allMembers.filter(() => rng() < selection.fraction);
    }
    default:
      return allMembers;
  }
}

function mergeReputation(
  existing: number,
  absorbed: number,
  strategy: 'max' | 'sum_clamped' | 'weighted_avg',
): number {
  switch (strategy) {
    case 'max': return Math.max(existing, absorbed);
    case 'sum_clamped': return clamp01(existing + absorbed);
    case 'weighted_avg': return (existing + absorbed) / 2;
    default: return (existing + absorbed) / 2;
  }
}

// ─── Mutation summary ─────────────────────────────────────────────────────────

export interface AftermathMutationSummary {
  touchedWorld: boolean;
  touchedStructure: boolean;
  /** True when a condition_attachment effect applied a wound-subcategory condition to the actor. Drives mid-encounter tier promotion. */
  woundApplied: boolean;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Bind the reach-signature aftermath effects (THR-555) to the card's resolved
 * target before dispatch. The engine-backed signatures (THR-550/551/552) address
 * a graph node the player-god's card was played *on* — the target faction
 * (warhost), the target location (rift, Great Work) — but their resolvers read a
 * literal id off the effect, so a static content template declares a sentinel that
 * this pass resolves against `action.targetId`. Mirrors the `$target` idiom the
 * step-level imbue / anoint ops already use (unifiedActionResolution.ts).
 *
 *  • `signature_warhost.factionId === '$target'`   → `action.targetId`
 *  • `sphere_influence_amplify.locationId === '$target'` → `action.targetId`
 *  • `sphere_influence_amplify.sphere === '$primary'`    → caster's primary Creation Sphere
 *  • `spawn_unique_location.nearAgentId === '$target'`   → target location's hex
 *
 * Fail-soft (NFP #4): a missing action / unresolvable target or non-Creation
 * primary sphere leaves the effect unbound and the effect's own resolver no-ops
 * on the bad value. Non-signature effects and effects without a sentinel pass
 * through untouched — a no-op for every effect kind authored before THR-555.
 */
export function bindReachSignatureTargets(
  effect: EncounterAftermathReactionEffect,
  action: UnifiedAction | undefined,
  graph: WorldGraph,
): EncounterAftermathReactionEffect {
  const targetId = action?.targetId;
  const actorId = action?.actorId;
  switch (effect.kind) {
    case 'signature_warhost':
      return effect.factionId === AFTERMATH_TARGET_SENTINEL && targetId
        ? { ...effect, factionId: targetId }
        : effect;
    case 'sphere_influence_amplify': {
      let bound = effect;
      if (bound.locationId === AFTERMATH_TARGET_SENTINEL && targetId) {
        bound = { ...bound, locationId: targetId };
      }
      if ((bound.sphere as string) === AFTERMATH_PRIMARY_SPHERE_SENTINEL) {
        const primary = actorId ? getAscendantPrimarySphere(graph, actorId) : undefined;
        // The rift amplifies a Creation Sphere; only bind when the caster's
        // primary is a Creation Sphere (SphereName ⊇ CreationSphereName).
        if (primary && (CREATION_SPHERE_NAMES as readonly string[]).includes(primary)) {
          bound = { ...bound, sphere: primary as CreationSphereName };
        }
      }
      return bound;
    }
    case 'spawn_unique_location': {
      // A location id is not an agent id: content marks placement intent with
      // `nearAgentId: '$target'`; resolve the target location → hex so the mint
      // lands on the targeted tile. Sentinel dropped either way.
      if (effect.nearAgentId !== AFTERMATH_TARGET_SENTINEL) return effect;
      const hex = targetId ? resolveLocationToHex(graph, targetId) : null;
      const unbound: EncounterAftermathReactionEffect = { ...effect, nearAgentId: undefined };
      return hex ? { ...unbound, hex: { col: hex.col, row: hex.row } } : unbound;
    }
    case 'agent_relocation': {
      // THR-1142 — `destination.locationId` is a *nested* field, so the generic
      // top-level scene pass (`bindAftermathSceneTargets`, which walks
      // SCENE_SENTINEL_FIELDS) cannot see it. Bind it here, where the
      // kind-specific/nested sentinels already live. `targetAgentId` is top-level
      // and is bound by that pass for free — do not duplicate it.
      const dest = effect.destination;
      if (dest.kind !== 'location') return effect;
      const isTarget = dest.locationId === AFTERMATH_TARGET_SENTINEL;
      const isCast =
        dest.locationId.startsWith(AFTERMATH_CAST_SENTINEL_PREFIX) ||
        dest.locationId.startsWith(AFTERMATH_CAST_SENTINEL_LEGACY_PREFIX);
      if (!isTarget && !isCast) return effect;

      let resolved: string | undefined;
      if (isTarget) {
        resolved = targetId;
      } else {
        const key = dest.locationId.startsWith(AFTERMATH_CAST_SENTINEL_PREFIX)
          ? dest.locationId.slice(AFTERMATH_CAST_SENTINEL_PREFIX.length)
          : dest.locationId.slice(AFTERMATH_CAST_SENTINEL_LEGACY_PREFIX.length);
        resolved = action?.supportBindings?.find(b => b.key === key)?.nodeId;
      }
      // Resolve-don't-trust: bind only when the id names something that actually
      // has a hex. An unresolvable sentinel is left in place and the dispatcher
      // no-ops it down the existing invalid-destination path (NFP #4).
      if (!resolved || !resolveLocationToHex(graph, resolved)) return effect;
      return { ...effect, destination: { kind: 'location', locationId: resolved } };
    }
    default:
      return effect;
  }
}

// ─── Scene-targeting sentinels (THR-695, Slice B) ───────────────────────────────

/**
 * `$actor` sentinel — rebinds to the acting agent (`action.actorId`).
 *
 * THR-1025: this was the one member of the authored sentinel vocabulary the bind pass
 * did not know. `$actor` is the established token everywhere else in the codebase
 * (`resolveRef` in `src/types/graphOp.ts` maps it for every GraphOp), so content
 * authored `targetAgentId: '$actor'` on aftermath effects and reasonably expected it to
 * resolve. It did not: the literal seven-character string passed through the bind pass
 * untouched and was consumed downstream as if it were a node id.
 */
export const AFTERMATH_ACTOR_SENTINEL = '$actor';
/** `$cast:<key>` sentinel prefix — rebinds via `action.supportBindings`. */
export const AFTERMATH_CAST_SENTINEL_PREFIX = '$cast:';
/** Legacy alias for the cast sentinel (the `src/data/encounters/examples/` files use `role:`). */
export const AFTERMATH_CAST_SENTINEL_LEGACY_PREFIX = 'role:';

/**
 * Effect fields that may carry a scene-targeting sentinel, mapped to the node kind
 * each field expects. `$target` binds only when the action target's kind matches.
 */
const SCENE_SENTINEL_FIELDS = {
  targetAgentId: 'agent',
  withAgentId: 'agent',
  // THR-1110 — an `attachment_grant` agreement names its other party here, and the
  // party is nearly always someone the scene already cast. Registered as 'agent' so
  // `$cast:<key>` binds the person; a literal faction or location id is not a
  // sentinel and passes through untouched, then is validated by the handler.
  counterpartyId: 'agent',
  // THR-1175 — `favor_creation` names who *owes* here. Registered as 'agent' so
  // `$cast:<key>` binds the scene's persistent person and the kind check refuses
  // to bind a location: that refusal is the point, since a place owing a social
  // favour is an edge no consumer can collect. `$target` re-states the old
  // implicit behaviour explicitly, and only binds when the target really is a
  // person.
  debtorAgentId: 'agent',
  targetFactionId: 'faction',
  // THR-1144 — `membership_change` names the faction someone joins or leaves in
  // `factionId`, not `targetFactionId`, because the *person* is the effect's
  // target. Registered here rather than special-cased so `$target` binds "the
  // guild you just impressed" without the author knowing its node id.
  //
  // This widens four existing kinds that also carry `factionId`
  // (`faction_absorb`, `faction_dissolve`, `signature_warhost`,
  // `faction_reputation_gain`), which could not take a sentinel before. Widening
  // only: a literal id is not a sentinel and passes through untouched, so no
  // shipped content changes behaviour.
  factionId: 'faction',
  targetSublocationId: 'sublocation',
  // THR-1143 — a place. `$target` binds when the action targets a location, which
  // is how "the pass you just closed" reaches the condition without the author
  // knowing the node id. Registered here rather than handled in the three
  // condition branches so location targeting composes with every future effect
  // kind that grows the field, the way the other four do.
  targetLocationId: 'location',
} as const;

type SceneSentinelField = keyof typeof SCENE_SENTINEL_FIELDS;

/** Does `nodeId` resolve to a node whose kind matches the sentinel field? Pure, fail-soft. */
function nodeMatchesSceneField(
  graph: WorldGraph,
  nodeId: string,
  kind: 'agent' | 'faction' | 'sublocation' | 'location',
): boolean {
  const node = graph.getNode(nodeId);
  if (!node) return false;
  // `node.type` is the canonical NodeType, but sublocations/factions are sometimes
  // represented off the canonical union (subtype in properties, or a bare 'sublocation'
  // type in test fixtures) — widen to string so the membership checks stay honest.
  const nodeType = node.type as string;
  const actorType = node.properties?.actorType as string | undefined;
  switch (kind) {
    case 'agent':
      // An agent is an individual-scale actor — an actor node that is not a faction/culture.
      return nodeType === 'actor' && actorType !== 'faction' && actorType !== 'culture';
    case 'faction':
      return nodeType === 'faction' || (nodeType === 'actor' && actorType === 'faction');
    case 'sublocation':
      // THR-1183: this predicate was the codebase's most honest sublocation test and is
      // now the shared one — see `sublocationShape.ts`. Routed through it so the rule
      // has exactly one definition to drift from.
      return isSublocationNode(node);
    case 'location':
      // A place at the hex/settlement/waypoint tier — deliberately *excluding*
      // sublocations, which have their own field. A sublocation is a location node
      // with a `parentLocationId`; accepting it here would make `$target` bind the
      // same node to two fields with different tax and gating semantics.
      return isPlaceTierLocation(node);
  }
}

export interface SceneSentinelTraceContext {
  readonly tick: number;
  readonly actionId: string;
  readonly actorAgentId?: string;
  readonly encounterId: string;
  readonly reactionId: string;
  readonly effectIndex: number;
}

/**
 * THR-695 (Slice B) — bind the general scene-targeting sentinels on an aftermath
 * effect before dispatch. Generalizes the THR-555 reach-signature pattern to every
 * effect kind. Composes *after* `bindReachSignatureTargets` (signature pass first),
 * so `$primary` and the three signature kinds keep their behavior.
 *
 * For each field in { targetAgentId, targetFactionId, targetSublocationId, withAgentId }
 * whose value is a sentinel string:
 *   • `'$actor'`       → `action.actorId`, iff the resolved node kind matches the field.
 *   • `'$target'`      → `action.targetId`, iff the resolved node kind matches the field.
 *   • `'$cast:<key>'`  → `action.supportBindings[key].nodeId` (legacy alias `'role:<key>'`).
 *
 * An unresolvable sentinel (missing target/binding, kind mismatch) is left in place —
 * the effect then no-ops down its existing invalid-target path (fail-soft, NFP #4).
 * Every processed sentinel field emits one `aftermath_sentinel_bound` trace
 * (`resolvedNodeId: null` when unbound). Literal ids and non-sentinel values pass
 * through untouched — a no-op for every effect authored before this slice.
 */
export function bindAftermathSceneTargets(
  effect: EncounterAftermathReactionEffect,
  action: UnifiedAction | undefined,
  graph: WorldGraph,
  traceCtx?: SceneSentinelTraceContext,
): EncounterAftermathReactionEffect {
  const source = effect as unknown as Record<string, unknown>;
  let next: Record<string, unknown> | undefined;

  for (const field of Object.keys(SCENE_SENTINEL_FIELDS) as SceneSentinelField[]) {
    const value = source[field];
    if (typeof value !== 'string') continue;

    const isActorSentinel = value === AFTERMATH_ACTOR_SENTINEL;
    const isTargetSentinel = value === AFTERMATH_TARGET_SENTINEL;
    const isCastSentinel =
      value.startsWith(AFTERMATH_CAST_SENTINEL_PREFIX) ||
      value.startsWith(AFTERMATH_CAST_SENTINEL_LEGACY_PREFIX);
    if (!isActorSentinel && !isTargetSentinel && !isCastSentinel) continue;

    let resolvedNodeId: string | null = null;
    if (isActorSentinel) {
      const actorId = action?.actorId;
      if (actorId && nodeMatchesSceneField(graph, actorId, SCENE_SENTINEL_FIELDS[field])) {
        resolvedNodeId = actorId;
      }
    } else if (isTargetSentinel) {
      const targetId = action?.targetId;
      if (targetId && nodeMatchesSceneField(graph, targetId, SCENE_SENTINEL_FIELDS[field])) {
        resolvedNodeId = targetId;
      }
    } else {
      const key = value.startsWith(AFTERMATH_CAST_SENTINEL_PREFIX)
        ? value.slice(AFTERMATH_CAST_SENTINEL_PREFIX.length)
        : value.slice(AFTERMATH_CAST_SENTINEL_LEGACY_PREFIX.length);
      const binding = action?.supportBindings?.find(b => b.key === key);
      if (binding) resolvedNodeId = binding.nodeId;
    }

    if (resolvedNodeId !== null) {
      next = next ?? { ...source };
      next[field] = resolvedNodeId;
    }

    if (traceCtx) {
      emitTrace({
        tick: traceCtx.tick,
        category: 'aftermath_sentinel_bound',
        agentId: traceCtx.actorAgentId,
        actionId: traceCtx.actionId,
        effectKind: effect.kind,
        field,
        sentinel: value,
        resolvedNodeId,
        summary: `aftermath_sentinel_bound[${traceCtx.effectIndex}] ${effect.kind}.${field}: ${value} → ${resolvedNodeId ?? 'UNRESOLVED'}`,
      } as unknown as Parameters<typeof emitTrace>[0]);
    }
  }

  return (next ?? source) as unknown as EncounterAftermathReactionEffect;
}

// ─── Faction definition-id binding (THR-1150) ───────────────────────────────

/**
 * Effect kinds whose faction fields are authored as *definition* ids, mapped to
 * every field on that kind carrying one.
 *
 * `membership_change` is deliberately absent: `joinFaction` / `leaveFaction` /
 * `adjustMemberRank` already resolve internally (THR-1144), so binding it here
 * would only do the same work twice.
 */
const FACTION_ID_FIELDS_BY_KIND: Readonly<Record<string, readonly string[]>> = {
  faction_reputation_gain: ['factionId'],
  // THR-1206 — standing with a faction you are *not* in. Authors write the same
  // definition id here that every faction content file already carries, so it needs
  // the same rewrite to a node id, or the edge would point at nothing.
  reputation_with: ['targetFactionId'],
  faction_dissolve: ['factionId'],
  signature_warhost: ['factionId'],
  faction_absorb: ['absorbingFactionId', 'absorbedFactionId'],
  faction_declare_war: ['factionA', 'factionB'],
  faction_force_peace: ['factionA', 'factionB'],
  faction_splinter: ['sourceFactionId'],
};

/**
 * THR-1150 — rewrite an authored faction **definition** id to the faction **node**
 * id the graph actually keys, before dispatch.
 *
 * Authors write `factionId: 'mercenary_company'`, because that is the id every
 * faction content file already carries and the only one that reads naturally.
 * `factionSeeding` keys the seeded node `faction_def_<definitionId><chapterSuffix>`,
 * so a definition id matches no node and no `member_of` edge target. Every shipped
 * `faction_reputation_gain` therefore no-opped — the arm's existence check failed
 * on `getNode('mercenary_company')`, and had it passed, `applyFactionReputationGain`
 * would have returned its "not a member" sentinel for the same reason.
 *
 * Composes *after* the two sentinel passes, so a `$target`-bound id (already a node
 * id) arrives here and resolves to itself.
 *
 * Widening only, by {@link resolveFactionNodeId}'s exact-node-id-first order: a
 * value already naming a faction node returns unchanged, so no shipped content that
 * worked stops working. A value naming nothing is left in place, so each arm's own
 * not-found trace still reports the id the content actually carries (NFP #4).
 */
export function bindFactionDefinitionIds(
  effect: EncounterAftermathReactionEffect,
  graph: WorldGraph,
  actorAgentId?: string,
): EncounterAftermathReactionEffect {
  const fields = FACTION_ID_FIELDS_BY_KIND[effect.kind];
  if (!fields) return effect;

  const source = effect as unknown as Record<string, unknown>;
  let next: Record<string, unknown> | undefined;
  for (const field of fields) {
    const value = source[field];
    if (typeof value !== 'string' || value.length === 0) continue;
    const resolved = resolveFactionNodeId(graph, value, actorAgentId);
    if (!resolved || resolved === value) continue;
    next = next ?? { ...source };
    next[field] = resolved;
  }
  return (next ?? source) as unknown as EncounterAftermathReactionEffect;
}

/** Clamp a sentiment value to the relates_to sentiment range [-1, 1]. */
function clampSentiment(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/**
 * Create-or-mutate the directed `fromId → toId` `relates_to` edge for a `bond_change`
 * effect (THR-695, Slice B). A missing edge is created at the `BOND_CREATE_INITIAL_*`
 * baseline before the delta lands. Sentiment result clamps to [-1, 1]; trust (only when
 * a delta is supplied) to [0, 1]. In-place property mutation on the stored edge — the
 * same idiom used for node.properties throughout this file; `touchWorld()` is the
 * caller's responsibility.
 */
function applyBondEdge(
  graph: WorldGraph,
  fromId: string,
  toId: string,
  sentimentDelta: number,
  trustDelta: number | undefined,
): { created: boolean; sentimentBefore: number; sentimentAfter: number } {
  let edge = graph.getOutgoingEdges(fromId, 'relates_to').find(e => e.target === toId);
  let created = false;
  if (!edge) {
    const edgeId = `relates_to_bond_${fromId}_${toId}`;
    graph.addEdge({
      id: edgeId,
      source: fromId,
      target: toId,
      type: 'relates_to',
      properties: {
        sentiment: BOND_CREATE_INITIAL_SENTIMENT,
        trust: BOND_CREATE_INITIAL_TRUST,
      },
    });
    edge = graph.getEdge(edgeId)!;
    created = true;
  }
  const sentimentBefore = (edge.properties.sentiment as number | undefined) ?? BOND_CREATE_INITIAL_SENTIMENT;
  const sentimentAfter = clampSentiment(sentimentBefore + sentimentDelta);
  edge.properties.sentiment = sentimentAfter;
  if (trustDelta !== undefined) {
    const trustBefore = (edge.properties.trust as number | undefined) ?? BOND_CREATE_INITIAL_TRUST;
    edge.properties.trust = clamp01(trustBefore + trustDelta);
  }
  return { created, sentimentBefore, sentimentAfter };
}

export function applyEncounterAftermathReaction(
  state: GameState,
  action: UnifiedAction | undefined,
  reaction: EncounterAftermathReaction,
  tick: number,
  runtime: SimulationRuntime,
): { state: GameState; mutationSummary: AftermathMutationSummary } {
  if (!runtime) {
    throw new Error('[encounterAftermath] runtime is required — programming error, not a data error');
  }

  let nextRecentEvents = state.recentEvents;
  let nextTickEvents = state.tickEvents;
  let nextClearanceGateStates = state.clearanceGateStates
    ? new Map(state.clearanceGateStates)
    : undefined;
  let touchedClearanceGateStates = false;
  let nextSeeds: PendingEncounterSeed[] = [];
  let nextHiddenMarks: HiddenMark[] = [];
  let nextIntelligenceRecords: IntelligenceRecord[] = [];
  let nextEmittedOmens: EmittedOmen[] | undefined = undefined;
  let nextPlantedCompulsions: PlantedCompulsion[] | undefined = undefined;
  let nextChronicleEntries: ChronicleEntry[] | undefined = undefined;
  // THR-500: run-scoped action unlocks grown by `unlock_action` effects.
  let nextUnlockedActionIds: readonly string[] | undefined = undefined;
  // THR-551: ControlEffects spawned by `sphere_influence_amplify` (rift) effects.
  const nextControlEffects: ControlEffect[] = [];

  let mutationSummary: AftermathMutationSummary = { touchedWorld: false, touchedStructure: false, woundApplied: false };

  const encounterId = action?.templateId ?? 'unknown';
  const actionId = action?.actionId ?? 'unknown';
  const actorAgentId = action?.actorId;

  // Top-level trace: one per reaction application — summary of which effect kinds will fire
  emitTrace({
    tick,
    category: 'encounter_aftermath_applied',
    agentId: actorAgentId,
    encounterId,
    actionId,
    actorId: actorAgentId ?? '',
    reactionId: reaction.id,
    effectKinds: reaction.effects.map(e => e.kind),
    summary: `Aftermath reaction ${reaction.id} (${encounterId}): ${reaction.effects.map(e => e.kind).join(', ')}`,
  });

  // THR-384: Per-reaction dedup pre-pass for intel_referenced_prose.
  // Builds a winner map (recordId → winning effectIndex + significance) so the main
  // loop can suppress duplicate record firings within a single reaction.
  // Also memoises findIntelReferencedProseMatch so each effect resolves exactly once.
  const intelProseMemo = new Map<number, IntelligenceRecord | undefined>();
  const intelProseWinnerByRecordId = new Map<string, { effectIndex: number; significance: number }>();
  for (let pi = 0; pi < reaction.effects.length; pi++) {
    const pe = reaction.effects[pi];
    if (pe.kind !== 'intel_referenced_prose') continue;
    const pTarget = resolveAftermathTarget(pe, action);
    // A when=false effect must not claim a record and suppress a sibling that would fire.
    if (pe.when !== undefined) {
      const pEffectiveTargetId = pTarget.kind !== 'actor_fallback' ? pTarget.id : (actorAgentId ?? '');
      let pWhenCtx: import('../types/effects').PredicateContext | undefined;
      if (pEffectiveTargetId) {
        pWhenCtx = buildPredicateContext(
          state.graph, pEffectiveTargetId, undefined,
          action?.templateId, state.hiddenMarks, state.intelligenceRecords,
        );
      }
      if (!evaluateOptionalCondition(pe.when, pWhenCtx)) continue;
    }
    const pTargetAgentId = pe.targetAgentId ?? (pTarget.kind === 'agent' ? pTarget.id : actorAgentId);
    if (!pTargetAgentId) continue;
    const pMatched = findIntelReferencedProseMatch(state, pTargetAgentId, pe.category, action);
    intelProseMemo.set(pi, pMatched);
    if (!pMatched) continue;
    const pBand = reliabilityDescriptor(pMatched.reliability);
    const pSig = pe.significance
      ?? (pBand === 'reliable' ? INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE
        : pBand === 'uncertain' ? INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN
          : INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS);
    const existing = intelProseWinnerByRecordId.get(pMatched.recordId);
    if (!existing || pSig > existing.significance || (pSig === existing.significance && pi < existing.effectIndex)) {
      intelProseWinnerByRecordId.set(pMatched.recordId, { effectIndex: pi, significance: pSig });
    }
  }

  for (let i = 0; i < reaction.effects.length; i++) {
    // THR-555: bind reach-signature target sentinels ($target / $primary) to the
    // card's resolved target before dispatch. No-op for every other effect kind.
    // THR-695: then bind the general scene sentinels ($target / $cast: / role:) on
    // targetAgentId/targetFactionId/targetSublocationId/withAgentId. Signature pass
    // runs first so its $primary + three signature kinds keep their behavior.
    // THR-1150: last, rewrite authored faction *definition* ids to faction node ids.
    // Runs after both sentinel passes so a `$target`-bound faction arrives as a node
    // id and resolves to itself. No-op for every non-faction effect kind.
    const effect = bindFactionDefinitionIds(
      bindAftermathSceneTargets(
        bindReachSignatureTargets(reaction.effects[i], action, state.graph),
        action,
        state.graph,
        { tick, actionId, actorAgentId, encounterId, reactionId: reaction.id, effectIndex: i },
      ),
      state.graph,
      actorAgentId,
    );
    const target = resolveAftermathTarget(effect, action);

    // Check for ambiguous multi-target specification
    const e = effect as Partial<{ targetAgentId: string; targetFactionId: string; targetSublocationId: string; targetLocationId: string }>;
    const targetFieldCount = [e.targetAgentId, e.targetFactionId, e.targetSublocationId, e.targetLocationId].filter(Boolean).length;
    if (targetFieldCount > 1) {
      emitTrace({
        tick, category: 'aftermath_target_invalid',
        agentId: actorAgentId, encounterId, actionId: actionId, reactionId: reaction.id,
        effectIndex: i, effectKind: effect.kind,
        reason: 'multiple_targets_specified',
        summary: `aftermath[${i}] ${effect.kind}: multiple target fields set — using priority (agent>faction>sublocation>location)`,
      });
    }

    // Per-effect target resolution trace
    const effectiveTargetId = target.kind !== 'actor_fallback' ? target.id : (actorAgentId ?? '');
    const effectiveTargetKind = target.kind;
    emitTrace({
      tick, category: 'aftermath_target_resolved',
      agentId: actorAgentId, encounterId, actionId, reactionId: reaction.id,
      effectIndex: i, effectKind: effect.kind,
      effectiveTargetId,
      effectiveTargetKind,
      summary: `aftermath[${i}] ${effect.kind}: resolved target → ${effectiveTargetKind}:${effectiveTargetId}`,
    });

    // THR-116: evaluate optional `when` predicate before dispatching to handler
    // Every member of EncounterAftermathReactionEffect now includes when?, so direct access is safe.
    const whenPredicate = effect.when;
    if (whenPredicate !== undefined) {
      const whenTargetId = effectiveTargetId || actorAgentId || '';
      let whenCtx: import('../types/effects').PredicateContext | undefined;
      if (whenTargetId) {
        whenCtx = buildPredicateContext(
          state.graph,
          whenTargetId,
          undefined,
          action?.templateId,
          state.hiddenMarks,
          state.intelligenceRecords,
        );
      }
      const passed = evaluateOptionalCondition(whenPredicate, whenCtx);
      if (!passed) {
        emitTrace({
          tick, category: 'aftermath_effect_skipped_by_when',
          agentId: actorAgentId, encounterId, actionId, reactionId: reaction.id,
          effectIndex: i, effectKind: effect.kind,
          predicate: whenPredicate, targetEntityId: whenTargetId,
          summary: `aftermath[${i}] ${effect.kind}: skipped — when predicate '${whenPredicate}' false for ${whenTargetId}`,
        });
        continue;
      }
      // Verbose-tier only (gated to avoid trace flood): log successful pass
      emitTrace({
        tick, category: 'aftermath_effect_when_passed',
        agentId: actorAgentId, encounterId, actionId, reactionId: reaction.id,
        effectIndex: i, effectKind: effect.kind,
        predicate: whenPredicate, targetEntityId: whenTargetId,
        summary: `aftermath[${i}] ${effect.kind}: when predicate '${whenPredicate}' passed`,
      });
    }

    switch (effect.kind) {
      case 'reputation_score': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', effectDetail: { delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_score[${i}] skipped: no actorId`,
          });
          break;
        }
        const node = state.graph.getNode(resolvedId);
        if (!node) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `reputation_score[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', effectDetail: { targetId: resolvedId, delta: effect.delta },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `reputation_score[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const isFaction = target.kind === 'faction';
        const current = (node.properties?.reputationScore as number | undefined)
          ?? (isFaction ? DEFAULT_FACTION_REPUTATION : DEFAULT_REPUTATION);
        const result = clamp01(current + effect.delta);
        node.properties.reputationScore = result;
        mutationSummary.touchedWorld = true;
        if (isFaction) {
          emitTrace({
            tick, category: 'faction_reputation_changed', agentId: actorAgentId,
            factionId: resolvedId, previous: current, result, delta: effect.delta,
            kind: 'reputation_score', encounterId, reactionId: reaction.id,
            summary: `faction_reputation_changed: ${resolvedId} ${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(2)} → ${result.toFixed(2)}`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_score',
          effectDetail: { targetId: resolvedId, delta: effect.delta, previous: current, result },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `reputation_score[${i}]: ${resolvedId} ${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(2)}`,
        });
        break;
      }

      case 'reputation_tally': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', effectDetail: { key: effect.key, delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_tally[${i}] skipped: no actorId`,
          });
          break;
        }
        const node = state.graph.getNode(resolvedId);
        if (!node) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `reputation_tally[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', effectDetail: { targetId: resolvedId, key: effect.key, delta: effect.delta },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `reputation_tally[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        if (!isValidReputationTallyKey(effect.key)) {
          if (_invalidTallyRateLimit.tick !== tick) {
            _invalidTallyRateLimit = { tick, count: 0 };
          }
          if (_invalidTallyRateLimit.count < INVALID_TALLY_KEY_TRACE_RATE_LIMIT) {
            _invalidTallyRateLimit.count++;
            emitTrace({
              tick, category: 'aftermath_invalid_tally_key', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id,
              key: effect.key,
              suggestedReplacement: SUGGESTED_TALLY_REPLACEMENT[effect.key],
              summary: `invalid tally key '${effect.key}' in ${encounterId}: not a ${REACH_DOMAINS.join('|')}.positive|negative key`,
            } as unknown as Parameters<typeof emitTrace>[0]);
          } else if (_invalidTallyRateLimit.count === INVALID_TALLY_KEY_TRACE_RATE_LIMIT) {
            _invalidTallyRateLimit.count++;
            emitTrace({
              tick, category: 'aftermath_invalid_tally_key_rate_limited',
              summary: `aftermath_invalid_tally_key: rate limit (${INVALID_TALLY_KEY_TRACE_RATE_LIMIT}/tick) reached at tick ${tick}`,
            } as unknown as Parameters<typeof emitTrace>[0]);
          }
          break;
        }
        const tallies = {
          ...((node.properties?.reputationTallies as Record<string, number> | undefined) ?? {}),
        };
        tallies[effect.key] = (tallies[effect.key] ?? 0) + effect.delta;
        node.properties.reputationTallies = tallies;
        mutationSummary.touchedWorld = true;
        if (target.kind === 'faction') {
          emitTrace({
            tick, category: 'faction_reputation_changed', agentId: actorAgentId,
            factionId: resolvedId, previous: tallies[effect.key] - effect.delta, result: tallies[effect.key],
            delta: effect.delta, kind: 'reputation_tally', encounterId, reactionId: reaction.id,
            summary: `faction_reputation_tally: ${resolvedId} [${effect.key}] ${effect.delta >= 0 ? '+' : ''}${effect.delta}`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_tally',
          effectDetail: { targetId: resolvedId, key: effect.key, delta: effect.delta, newTally: tallies[effect.key] },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `reputation_tally[${i}]: ${resolvedId} [${effect.key}] ${effect.delta >= 0 ? '+' : ''}${effect.delta}`,
        });
        break;
      }

      case 'faction_reputation_gain': {
        if (!actorAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_reputation_gain',
            effectDetail: { factionId: effect.factionId, amount: effect.amount },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `faction_reputation_gain[${i}] skipped: no actorId`,
          });
          break;
        }
        if (!state.graph.getNode(effect.factionId)) {
          emitTrace({
            tick, category: 'faction_reputation_gain_error', agentId: actorAgentId,
            factionId: effect.factionId, encounterId,
            summary: `faction_reputation_gain[${i}]: faction '${effect.factionId}' not found`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_reputation_gain',
            effectDetail: { factionId: effect.factionId, amount: effect.amount },
            success: false, failReason: 'faction_not_found',
            effectiveTargetId: effect.factionId, effectiveTargetKind: 'faction',
            summary: `faction_reputation_gain[${i}] skipped: faction '${effect.factionId}' not found`,
          });
          break;
        }
        const rawAmount = isNaN(effect.amount) ? 0 : effect.amount;
        const clampedAmount = Math.max(-FACTION_REPUTATION_GAIN_AMOUNT_CLAMP, Math.min(FACTION_REPUTATION_GAIN_AMOUNT_CLAMP, rawAmount));
        const result = applyFactionReputationGain(
          state.graph, actorAgentId, effect.factionId, clampedAmount, tick, 'encounter_aftermath',
          // THR-1241: the live path for `faction_influence_multiplier`. Encounter
          // aftermath is where nearly all faction standing actually moves, so a
          // key wired only at the function signature and nowhere real would be
          // inert by a subtler route than before.
          { graph: state.graph, effectStates: state.effectStates, persisted: state, tick },
        );
        if (result.newRank === 'none') {
          // THR-1150 — this used to `break` silently "per plan doc fail-soft table",
          // and that silence is exactly why the definition-id defect survived: every
          // shipped faction-standing consequence no-opped and nothing said so. Fail
          // soft, but never quiet (NFP #2).
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_reputation_gain',
            effectDetail: { factionId: effect.factionId, amount: clampedAmount },
            success: false, failReason: result.reason ?? 'not_a_member',
            effectiveTargetId: effect.factionId, effectiveTargetKind: 'faction',
            summary: `faction_reputation_gain[${i}] skipped: ${actorAgentId} ${result.reason === 'faction_not_found' ? `cannot resolve faction '${effect.factionId}'` : `is not a member of '${effect.factionId}'`}`,
          });
          break;
        }
        mutationSummary.touchedWorld = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_reputation_gain',
          effectDetail: {
            factionId: effect.factionId, amount: clampedAmount,
            newReputation: result.newReputation, rankChanged: result.rankChanged, newRank: result.newRank,
          },
          success: true,
          effectiveTargetId: effect.factionId, effectiveTargetKind: 'faction',
          summary: `faction_reputation_gain[${i}]: ${actorAgentId} in ${effect.factionId} ${clampedAmount >= 0 ? '+' : ''}${clampedAmount.toFixed(3)}${result.rankChanged ? ` → rank ${result.newRank}` : ''}`,
        });
        break;
      }

      // THR-1206 — the write behind every "reputation with X" chip, and the general
      // form of the concept: a's standing with b, wherever b is a place, a person, or
      // a faction a does not belong to. `faction_reputation_gain` stays the right
      // effect for a member (it carries rank and access); this is the pair that one
      // structurally cannot serve.
      case 'reputation_with': {
        if (!actorAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_with', effectDetail: { delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_with[${i}] skipped: no actorId`,
          });
          break;
        }
        // `actor_fallback` means the effect named no counterparty and the resolver fell
        // back to the actor. A standing with yourself is not a thing, so refuse loudly
        // rather than minting a self-edge no consumer can read.
        if (target.kind === 'actor_fallback' || !target.id || target.id === actorAgentId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            // No `actionId`: `AftermathTargetInvalidTrace` does not declare one. Two
            // older call sites in this file pass it anyway and are red in the
            // baseline; this arm matches the type instead of joining them.
            encounterId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_with',
            attemptedTargetId: target.kind !== 'actor_fallback' ? target.id : '',
            // `AftermathTargetInvalidTrace.attemptedTargetKind` predates location
            // targeting (THR-1143) and still omits `'location'`. Widening it would
            // move a shared type for one arm's benefit; this branch only fires on
            // `actor_fallback` or a self-target, both of which are agents, so 'agent'
            // is the accurate value here rather than a narrowing convenience.
            attemptedTargetKind: 'agent',
            reason: 'no_counterparty',
            summary: `reputation_with[${i}] skipped: names no counterparty (add targetLocationId / targetAgentId / targetFactionId)`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_with', effectDetail: { delta: effect.delta },
            success: false, failReason: 'no_counterparty',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_with[${i}] skipped: no counterparty`,
          });
          break;
        }
        const repResult = applyReputationWithDelta(
          state.graph, actorAgentId, target.id, effect.delta, tick,
          `encounter_aftermath:${encounterId}:${reaction.id}`,
        );
        if (!repResult.applied) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_with',
            effectDetail: { targetId: target.id, delta: effect.delta },
            success: false, failReason: repResult.reason ?? 'write_refused',
            effectiveTargetId: target.id,
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `reputation_with[${i}] skipped: ${repResult.reason ?? 'write refused'} (${target.id})`,
          });
          break;
        }
        mutationSummary.touchedWorld = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_with',
          effectDetail: {
            targetId: repResult.effectiveTargetId ?? target.id,
            delta: effect.delta, newScore: repResult.score, band: repResult.band,
            ...(repResult.clamped ? { clamped: true } : {}),
          },
          success: true,
          effectiveTargetId: repResult.effectiveTargetId ?? target.id,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `reputation_with[${i}]: ${actorAgentId} with ${repResult.effectiveTargetId ?? target.id} `
            + `${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(3)} → ${repResult.band}`,
        });
        break;
      }

      case 'reputation_set': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', reason: 'no_actor_id',
            summary: `reputation_set[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', effectDetail: { value: effect.value },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_set[${i}] skipped: no actorId`,
          });
          break;
        }
        if (target.kind === 'sublocation') {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', attemptedTargetKind: 'sublocation', attemptedTargetId: resolvedId,
            reason: 'target_kind_not_supported',
            summary: `reputation_set[${i}] skipped: sublocation target not supported`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', effectDetail: { targetId: resolvedId, value: effect.value },
            success: false, failReason: 'target_kind_not_supported',
            effectiveTargetId: resolvedId, effectiveTargetKind: 'sublocation',
            summary: `reputation_set[${i}] skipped: sublocation not supported`,
          });
          break;
        }
        const node = state.graph.getNode(resolvedId);
        if (!node) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `reputation_set[${i}] skipped: node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', effectDetail: { targetId: resolvedId, value: effect.value },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `reputation_set[${i}] skipped: node not found (${resolvedId})`,
          });
          break;
        }
        const isFaction = target.kind === 'faction';
        const previous = (node.properties?.reputationScore as number | undefined)
          ?? (isFaction ? DEFAULT_FACTION_REPUTATION : DEFAULT_REPUTATION);
        const clamped = clamp01(effect.value);
        node.properties.reputationScore = clamped;
        mutationSummary.touchedWorld = true;
        const targetKindForTrace = isFaction ? 'faction' as const : 'agent' as const;
        emitTrace({
          tick, category: 'reputation_set_applied', agentId: actorAgentId,
          targetId: resolvedId, targetKind: targetKindForTrace,
          value: clamped, previous, encounterId, reactionId: reaction.id,
          summary: `reputation_set[${i}]: ${resolvedId} set to ${clamped.toFixed(2)} (was ${previous.toFixed(2)})`,
        });
        if (isFaction) {
          emitTrace({
            tick, category: 'faction_reputation_changed', agentId: actorAgentId,
            factionId: resolvedId, previous, result: clamped, delta: clamped - previous,
            kind: 'reputation_set', encounterId, reactionId: reaction.id,
            summary: `faction_reputation_set: ${resolvedId} → ${clamped.toFixed(2)}`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_set',
          effectDetail: { targetId: resolvedId, value: clamped, previous },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `reputation_set[${i}]: ${resolvedId} → ${clamped.toFixed(2)}`,
        });
        break;
      }

      case 'clearance_gate_tag': {
        const runtimeId = effect.runtimeId ?? action?.clearanceGateIds?.[0];
        if (!runtimeId || !nextClearanceGateStates) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'clearance_gate_tag', effectDetail: { runtimeId, tag: effect.tag },
            success: false, failReason: !runtimeId ? 'no_runtime_id' : 'no_clearance_gate_states',
            summary: `clearance_gate_tag[${i}] skipped: ${!runtimeId ? 'no runtimeId' : 'no clearanceGateStates'}`,
          });
          break;
        }
        const gate = nextClearanceGateStates.get(runtimeId);
        if (!gate) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'clearance_gate_tag', effectDetail: { runtimeId, tag: effect.tag },
            success: false, failReason: 'gate_not_found',
            summary: `clearance_gate_tag[${i}] skipped: gate ${runtimeId} not found`,
          });
          break;
        }
        nextClearanceGateStates.set(runtimeId, {
          ...gate,
          followOnTags: [...new Set([...gate.followOnTags, effect.tag])],
        });
        touchedClearanceGateStates = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'clearance_gate_tag',
          effectDetail: { runtimeId, tag: effect.tag },
          success: true,
          summary: `clearance_gate_tag[${i}]: gate ${runtimeId} tagged '${effect.tag}'`,
        });
        break;
      }

      case 'recent_event': {
        const event: TickEvent = {
          id: `enc_after_${reaction.id}_${tick}_${nextRecentEvents.length}`,
          tick,
          type: effect.eventType ?? 'ripple_consequence',
          message: effect.message,
          significance: effect.significance ?? 0.55,
          actorId: actorAgentId,
          witnessAgentIds: effect.witnessAgentIds ? [...effect.witnessAgentIds] : undefined,
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
        nextTickEvents = [...nextTickEvents, event];
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'recent_event',
          effectDetail: {
            eventId: event.id,
            message: effect.message,
            significance: event.significance,
            witnessCount: effect.witnessAgentIds?.length ?? 0,
          },
          success: true,
          summary: `recent_event[${i}]: "${effect.message.slice(0, 60)}"${effect.witnessAgentIds?.length ? ` (${effect.witnessAgentIds.length} witnesses)` : ''}`,
        });
        break;
      }

      case 'encounter_seed': {
        // THR-697 (Slice D): when the effect opts into context inheritance, snapshot the
        // source action's target + cast onto the seed. `evaluateEncounterSeeds` re-validates
        // both against the live graph at spawn (dead target → self-target fallback, dead
        // bindings dropped), so it is safe to copy the raw ids here.
        const inheritedContext = effect.inheritContext && action
          ? {
              inheritedTargetId: action.targetId,
              inheritedBindings: action.supportBindings,
            }
          : undefined;
        const seed: PendingEncounterSeed = {
          seedId: `seed_${actionId}_${reaction.id}_${i}`,
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          encounterFamily: effect.encounterFamily,
          templateId: effect.templateId,
          targetAgentId: effect.targetAgentId ?? actorAgentId ?? '',
          eligibleAfterTick: tick + effect.delayTicks,
          priority: effect.priority ?? 1.0,
          seedLabel: effect.seedLabel,
          plantedTick: tick,
          sourceEventNodeId: action?.eventNodeId,
          ...inheritedContext,
        };
        nextSeeds = [...nextSeeds, seed];
        const seedEvent: TickEvent = {
          id: `${seed.seedId}_planted`,
          tick,
          type: 'narrative',
          message: `A thread has been planted: ${effect.seedLabel}`,
          significance: 0.5,
          actorId: seed.targetAgentId,
        };
        nextTickEvents = [...nextTickEvents, seedEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, seedEvent);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'encounter_seed',
          effectDetail: { seedId: seed.seedId, targetAgentId: seed.targetAgentId, seedLabel: effect.seedLabel, eligibleAfterTick: seed.eligibleAfterTick },
          success: true,
          summary: `encounter_seed[${i}]: "${effect.seedLabel}" → ${seed.targetAgentId} eligible at tick ${seed.eligibleAfterTick}`,
        });
        emitTrace({
          tick, category: 'encounter_seed_planted',
          agentId: seed.targetAgentId,
          seedId: seed.seedId,
          targetAgentId: seed.targetAgentId,
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          templateId: seed.templateId,
          encounterFamily: seed.encounterFamily,
          delayTicks: effect.delayTicks,
          eligibleAfterTick: seed.eligibleAfterTick,
          seedLabel: seed.seedLabel,
          priority: seed.priority,
          summary: `Seed planted: "${seed.seedLabel}" for ${seed.targetAgentId} (eligible tick ${seed.eligibleAfterTick})`,
        });
        break;
      }

      case 'quintessence_shift': {
        // THR-1082 — an authored existential cost ("loss of confidence"). This
        // applier deliberately does no arithmetic of its own: it queues the same
        // `QuintessenceEvent` shape every other producer queues, so clamping,
        // dissolution and loss-prevention stay in `phaseQuintessence` and an
        // encounter cannot invent a second set of rules for the same quantity.
        const resolvedId = target.kind === 'agent' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'quintessence_shift', effectDetail: { delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `quintessence_shift[${i}] skipped: no actorId`,
          });
          break;
        }
        if (!state.graph.getNode(resolvedId)) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'quintessence_shift', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `quintessence_shift[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        // Fail-soft (NFP #4): the queue is lazily created everywhere else it is
        // written, and a missing one must not throw inside the tick loop.
        if (!state.pendingQuintessenceEvents) state.pendingQuintessenceEvents = [];
        state.pendingQuintessenceEvents.push({
          targetNodeId: resolvedId,
          delta: effect.delta,
          source: `encounter_aftermath:${effect.source ?? reaction.id}`,
          tick,
        });
        mutationSummary.touchedWorld = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'quintessence_shift',
          effectDetail: { targetId: resolvedId, delta: effect.delta },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `quintessence_shift[${i}]: ${resolvedId} ${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(2)}`,
        });
        break;
      }

      case 'hidden_mark': {
        // hidden_mark supports targetAgentId; faction/sublocation rejected in v1
        if (target.kind === 'faction' || target.kind === 'sublocation') {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'hidden_mark', attemptedTargetKind: target.kind, attemptedTargetId: target.id,
            reason: 'target_kind_not_supported',
            summary: `hidden_mark[${i}] skipped: ${target.kind} target not supported in v1`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'hidden_mark', effectDetail: { attemptedTargetKind: target.kind },
            success: false, failReason: 'target_kind_not_supported',
            effectiveTargetId: target.id, effectiveTargetKind: target.kind,
            summary: `hidden_mark[${i}] skipped: ${target.kind} target not supported`,
          });
          break;
        }
        const targetAgentId = target.kind === 'agent' ? target.id : (actorAgentId ?? '');
        const mark: HiddenMark = {
          markId: `mark_${actionId}_${reaction.id}_${i}`,
          category: effect.category,
          severity: effect.severity,
          label: effect.label,
          sourceEncounterId: encounterId,
          placedTick: tick,
          targetAgentId,
          revealFamilies: effect.revealFamilies,
        };
        nextHiddenMarks = [...nextHiddenMarks, mark];
        const markEvent: TickEvent = {
          id: `${mark.markId}_placed`,
          tick,
          type: 'narrative',
          message: 'A consequence has taken root, unseen.',
          significance: 0.3,
          actorId: targetAgentId,
        };
        nextTickEvents = [...nextTickEvents, markEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, markEvent);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'hidden_mark',
          effectDetail: { markId: mark.markId, targetAgentId, category: effect.category, severity: effect.severity, label: effect.label },
          success: true,
          effectiveTargetId: targetAgentId,
          effectiveTargetKind: target.kind === 'agent' ? 'agent' : 'actor_fallback',
          summary: `hidden_mark[${i}]: "${effect.label}" on ${targetAgentId} (${effect.category} sev=${effect.severity})`,
        });
        emitTrace({
          tick, category: 'hidden_mark_placed',
          agentId: targetAgentId,
          markId: mark.markId,
          actorId: targetAgentId,
          sourceEncounterId: encounterId,
          sourceTemplateId: encounterId,
          markCategory: effect.category,
          severity: effect.severity,
          revealFamilies: effect.revealFamilies ?? [],
          label: effect.label,
          summary: `Hidden mark placed: "${effect.label}" on ${targetAgentId} (reveals on: ${(effect.revealFamilies ?? []).join(', ') || 'none'})`,
        });
        break;
      }

      case 'intelligence': {
        // intelligence supports targetAgentId; faction target rejected in v1
        if (target.kind === 'faction') {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intelligence', attemptedTargetKind: 'faction', attemptedTargetId: target.id,
            reason: 'target_kind_not_supported',
            summary: `intelligence[${i}] skipped: faction target not supported in v1`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intelligence', effectDetail: { attemptedTargetKind: 'faction' },
            success: false, failReason: 'target_kind_not_supported',
            effectiveTargetId: target.id, effectiveTargetKind: 'faction',
            summary: `intelligence[${i}] skipped: faction target not supported`,
          });
          break;
        }
        const agentId = target.kind === 'agent' ? target.id : (actorAgentId ?? '');
        const record: IntelligenceRecord = {
          recordId: `intel_${actionId}_${reaction.id}_${i}`,
          category: effect.category,
          label: effect.label,
          detail: effect.detail,
          targetRegion: effect.targetRegion,
          targetEntityId: effect.targetEntityId,
          sourceEncounterId: encounterId,
          agentId,
          acquiredTick: tick,
          reliability: effect.reliability ?? 0.8,
        };
        nextIntelligenceRecords = [...nextIntelligenceRecords, record];
        const intelEvent: TickEvent = {
          id: `${record.recordId}_acquired`,
          tick,
          type: 'narrative',
          message: `Intelligence acquired: ${effect.label}`,
          significance: 0.6,
          actorId: agentId,
        };
        nextTickEvents = [...nextTickEvents, intelEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, intelEvent);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'intelligence',
          effectDetail: { recordId: record.recordId, agentId, category: effect.category, label: effect.label, reliability: record.reliability },
          success: true,
          effectiveTargetId: agentId,
          effectiveTargetKind: target.kind === 'agent' ? 'agent' : 'actor_fallback',
          summary: `intelligence[${i}]: "${effect.label}" → ${agentId}`,
        });
        emitTrace({
          tick, category: 'intelligence_granted',
          agentId,
          recordId: record.recordId,
          sourceEncounterId: encounterId,
          intelCategory: effect.category,
          label: effect.label,
          reliability: record.reliability,
          targetRegion: effect.targetRegion,
          targetEntityId: effect.targetEntityId,
          summary: `Intelligence granted: "${effect.label}" to ${agentId} (reliability ${record.reliability.toFixed(2)})`,
        });
        break;
      }

      case 'intel_referenced_prose': {
        // THR-139 — Authored "the intel paid off" chronicle line.
        // Reads (does not consume) intelligence records of `effect.category`
        // matching the action's encounter context. Most-recent record wins.
        // Reliability band picks reliable / uncertain / dubious prose variant.
        const targetAgentId = effect.targetAgentId
          ?? (target.kind === 'agent' ? target.id : actorAgentId);
        if (!targetAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intel_referenced_prose',
            effectDetail: { category: effect.category },
            success: false, failReason: 'no_target_agent',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `intel_referenced_prose[${i}] skipped: no target agent`,
          });
          break;
        }

        const matched = intelProseMemo.has(i)
          ? intelProseMemo.get(i)
          : findIntelReferencedProseMatch(state, targetAgentId, effect.category, action);
        if (!matched) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intel_referenced_prose',
            effectDetail: { category: effect.category, targetAgentId },
            success: false, failReason: 'no_matching_record',
            effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
            summary: `intel_referenced_prose[${i}] no-op: ${targetAgentId} has no actionable ${effect.category} record for ${encounterId}`,
          });
          break;
        }

        // THR-384: Dedup guard — suppress this effect if a higher-significance winner
        // for the same record was found in the pre-pass.
        const winner = intelProseWinnerByRecordId.get(matched.recordId);
        if (winner && winner.effectIndex !== i) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intel_referenced_prose',
            effectDetail: {
              category: effect.category,
              recordId: matched.recordId,
              targetAgentId,
              winningEffectIndex: winner.effectIndex,
            },
            success: false, failReason: 'skipped_duplicate_record',
            effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
            summary: `intel_referenced_prose[${i}] skipped: record ${matched.recordId} already claimed by effect[${winner.effectIndex}] in this reaction`,
          });
          break;
        }

        const band = reliabilityDescriptor(matched.reliability);
        if (band === 'dubious' && !INTEL_REFERENCED_PROSE_DUBIOUS_FIRES) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intel_referenced_prose',
            effectDetail: { category: effect.category, recordId: matched.recordId, band, targetAgentId },
            success: false, failReason: 'skipped_dubious',
            effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
            summary: `intel_referenced_prose[${i}] skipped: dubious-band suppressed by INTEL_REFERENCED_PROSE_DUBIOUS_FIRES`,
          });
          break;
        }

        const proseLine = pickIntelReferencedProseLine(effect.prose, band);
        if (!proseLine) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intel_referenced_prose',
            effectDetail: { category: effect.category, recordId: matched.recordId, band, targetAgentId },
            success: false, failReason: 'skipped_empty_prose',
            effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
            summary: `intel_referenced_prose[${i}] skipped: empty prose for ${band} band`,
          });
          break;
        }

        const significance = effect.significance
          ?? (band === 'reliable' ? INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE
            : band === 'uncertain' ? INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN
              : INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS);

        const event: TickEvent = {
          id: `enc_after_${reaction.id}_${tick}_${nextRecentEvents.length}`,
          tick,
          type: 'narrative',
          message: proseLine,
          significance,
          actorId: targetAgentId,
          encounterId,
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
        nextTickEvents = [...nextTickEvents, event];

        emitIntelligenceReferenced(tick, targetAgentId, matched.recordId, 'aftermath_prose', {
          templateId: action?.templateId,
          intelCategory: matched.category,
        });

        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'intel_referenced_prose',
          effectDetail: {
            category: effect.category,
            recordId: matched.recordId,
            band,
            significance,
            targetAgentId,
            eventId: event.id,
          },
          success: true,
          effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
          summary: `intel_referenced_prose[${i}]: ${targetAgentId} ${effect.category}/${band} → "${proseLine.slice(0, 60)}${proseLine.length > 60 ? '…' : ''}"`,
        });
        break;
      }

      case 'grant_companion': {
        // THR-1096. An authored grant deliberately ignores COMPANION_MAX —
        // the encounter promised this person, so they arrive.
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'grant_companion', reason: 'no_actor_id',
            summary: `grant_companion[${i}] skipped: no actor id`,
          } as unknown as TraceEntry);
          break;
        }
        const companionSalt = `${encounterId}_${reaction.id}_${i}_${effect.companionTemplateId}`;
        let companionSeed = state.seed;
        for (let c = 0; c < companionSalt.length; c++) {
          companionSeed = (companionSeed ^ companionSalt.charCodeAt(c)) >>> 0;
        }
        companionSeed = (companionSeed + tick * 31337) >>> 0;
        const minted = mintCompanion(
          state.graph,
          effect.companionTemplateId,
          resolvedId,
          tick,
          mulberry32(companionSeed),
          { source: encounterId, respectCap: false },
        );
        if (!minted) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'grant_companion',
            effectDetail: { targetId: resolvedId, companionTemplateId: effect.companionTemplateId },
            success: false, failReason: 'companion_grant_refused',
            effectiveTargetId: resolvedId,
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `grant_companion[${i}] skipped: template unknown, unique already instanced, or bearer missing (${effect.companionTemplateId})`,
          } as unknown as TraceEntry);
          break;
        }
        mutationSummary.touchedStructure = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'grant_companion',
          effectDetail: {
            targetId: resolvedId,
            companionTemplateId: effect.companionTemplateId,
            companionId: minted.companionId,
            companionName: minted.name,
          },
          success: true,
          effectiveTargetId: resolvedId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `grant_companion[${i}]: ${minted.name} (${minted.template.profession}) joins ${resolvedId}`,
        } as unknown as TraceEntry);
        break;
      }

      case 'remove_companion': {
        // THR-1096. Loss is a story event, never bookkeeping — the departure
        // trace fires inside removeCompanion so nobody vanishes silently.
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'remove_companion', reason: 'no_actor_id',
            summary: `remove_companion[${i}] skipped: no actor id`,
          } as unknown as TraceEntry);
          break;
        }
        const held = getCompanions(state.graph, resolvedId)
          .find(c => c.templateId === effect.companionTemplateId);
        if (!held) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'remove_companion',
            effectDetail: { targetId: resolvedId, companionTemplateId: effect.companionTemplateId },
            success: false, failReason: 'companion_not_held',
            effectiveTargetId: resolvedId,
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `remove_companion[${i}] skipped: bearer has no ${effect.companionTemplateId}`,
          } as unknown as TraceEntry);
          break;
        }
        const gone = removeCompanion(state.graph, held.id, effect.reason ?? 'story', tick);
        mutationSummary.touchedStructure = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'remove_companion',
          effectDetail: {
            targetId: resolvedId,
            companionTemplateId: effect.companionTemplateId,
            companionId: held.id,
            reason: effect.reason ?? 'story',
          },
          success: true,
          effectiveTargetId: resolvedId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `remove_companion[${i}]: ${gone?.companionName ?? held.name} leaves ${resolvedId} (${effect.reason ?? 'story'})`,
        } as unknown as TraceEntry);
        break;
      }

      case 'apply_condition': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', reason: 'no_actor_id',
            summary: `apply_condition[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', effectDetail: { conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `apply_condition[${i}] skipped: no actorId`,
          });
          break;
        }
        const targetNode = state.graph.getNode(resolvedId);
        if (!targetNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `apply_condition[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `apply_condition[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const conditionNode = state.graph.getNode(effect.conditionTraitId);
        if (!conditionNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', reason: 'condition_template_missing',
            summary: `apply_condition[${i}] skipped: condition trait not found (${effect.conditionTraitId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'condition_template_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `apply_condition[${i}] skipped: condition node not found (${effect.conditionTraitId})`,
          });
          break;
        }
        // ── tag_immunity (THR-1242) ──
        // `isImmuneToTag` has existed since the query layer landed and had zero
        // callers, so nine shipped wards against fear, poison and curses blocked
        // nothing. This is the gate: a condition whose tags the target is immune
        // to never lands. Refused before the edge is written rather than removed
        // after, so no other system observes a condition that should not exist.
        const immuneTag = isImmuneToAnyTag(
          state.graph, resolvedId,
          (conditionNode.properties.tags as string[] | undefined) ?? [],
          state.effectStates,
        );
        if (immuneTag !== null) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition',
            effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId, immuneTag },
            success: false, failReason: 'tag_immunity',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `apply_condition[${i}] blocked: target immune to ${immuneTag}`,
          });
          break;
        }

        const intensity = effect.intensity ?? CONDITION_DEFAULT_INTENSITY;
        const durationTicks = effect.durationTicks ?? CONDITION_DEFAULT_DURATION_TICKS;
        const edgeId = `has_trait_${resolvedId}_${effect.conditionTraitId}_${tick}_${i}`;
        state.graph.addEdge({
          id: edgeId,
          source: resolvedId,
          target: effect.conditionTraitId,
          type: 'has_trait',
          properties: {
            appliedAt: tick,
            durationTicks,
            // THR-761: `decayConditions` is the only tick-driven expiry path and it
            // counts down `ticksRemaining`, not `durationTicks`. Writing only the
            // latter made every aftermath condition permanent. `durationTicks` stays
            // as the authored total (provenance + UI progress denominator); this is
            // the live counter. 0 = indefinite, so omit the field and the decay loop
            // skips the edge entirely.
            ...(durationTicks > 0 ? { ticksRemaining: durationTicks } : {}),
            intensity,
            sourceEncounterId: encounterId,
            sourceReactionId: reaction.id,
          },
        });
        mutationSummary.touchedStructure = true;
        const condKind = (target.kind === 'agent' || target.kind === 'faction'
          || target.kind === 'sublocation' || target.kind === 'location')
          ? target.kind
          : 'agent' as const;
        emitTrace({
          tick, category: 'condition_applied', agentId: actorAgentId,
          targetId: resolvedId, targetKind: condKind,
          conditionTraitId: effect.conditionTraitId, durationTicks, intensity,
          encounterId, reactionId: reaction.id,
          summary: `condition_applied[${i}]: ${effect.conditionTraitId} → ${resolvedId} (intensity=${intensity}, duration=${durationTicks || 'indefinite'})`,
        });
        if (isLocationCarrier(state.graph, resolvedId)) {
          emitTrace({
            tick, category: 'location_condition_applied', agentId: actorAgentId,
            locationId: resolvedId, locationName: targetNode.name,
            carrierKind: locationCarrierKind(state.graph, resolvedId),
            conditionTemplateId: effect.conditionTraitId,
            ticksRemaining: durationTicks > 0 ? durationTicks : 0,
            encounterId, reactionId: reaction.id,
            summary: `location_condition_applied[${i}]: ${effect.conditionTraitId} → ${targetNode.name} (${durationTicks > 0 ? `${durationTicks}t` : 'indefinite'})`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'apply_condition',
          effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId, intensity, durationTicks },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `apply_condition[${i}]: ${effect.conditionTraitId} → ${resolvedId}`,
        });
        // THR-1244: raised after the edge is written, so a reactive inspecting the
        // bearer sees the condition it is firing on. Self-gating on harm + person
        // carrier — see `conditionProxyEvents`.
        raiseConditionDamaged(state, resolvedId, effect.conditionTraitId, intensity);
        break;
      }

      case 'remove_condition': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'remove_condition', reason: 'no_actor_id',
            summary: `remove_condition[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'remove_condition', effectDetail: { conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `remove_condition[${i}] skipped: no actorId`,
          });
          break;
        }
        const matchingEdges = state.graph.getOutgoingEdges(resolvedId, 'has_trait')
          .filter(edge => edge.target === effect.conditionTraitId);

        let removedCount = 0;
        // THR-1244: the magnitude the `healed` proxy reports. Summed from the edges
        // *before* they are removed — after the loop they are gone and their
        // intensity with them.
        let removedIntensity = 0;
        if (matchingEdges.length > 0) {
          const edgesToRemove = effect.removeAll
            ? matchingEdges
            : [matchingEdges.reduce((oldest, e) =>
                ((e.properties?.appliedAt as number) ?? 0) < ((oldest.properties?.appliedAt as number) ?? 0)
                  ? e : oldest
              )];
          for (const edge of edgesToRemove) {
            removedIntensity += (edge.properties?.intensity as number | undefined) ?? CONDITION_DEFAULT_INTENSITY;
            state.graph.removeEdge(edge.id);
            removedCount++;
          }
          if (removedCount > 0) mutationSummary.touchedStructure = true;
        }

        const removKind = (target.kind === 'agent' || target.kind === 'faction'
          || target.kind === 'sublocation' || target.kind === 'location')
          ? target.kind
          : 'agent' as const;
        emitTrace({
          tick, category: 'condition_removed', agentId: actorAgentId,
          targetId: resolvedId, targetKind: removKind,
          conditionTraitId: effect.conditionTraitId, removedCount,
          encounterId, reactionId: reaction.id,
          summary: `condition_removed[${i}]: ${effect.conditionTraitId} ← ${resolvedId} (removed ${removedCount})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'remove_condition',
          effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId, removedCount },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `remove_condition[${i}]: removed ${removedCount} edge(s) of ${effect.conditionTraitId} from ${resolvedId}`,
        });
        // THR-1244: a removal that found nothing is not a heal. `remove_condition`
        // traces `success: true` whether or not an edge existed (deliberately — see
        // `compositionContract`'s "a removal is not a promise" note), so the raise
        // gates on `removedCount`, never on the trace's success flag.
        if (removedCount > 0) {
          raiseConditionHealed(state, resolvedId, effect.conditionTraitId, removedIntensity);
        }
        break;
      }

      case 'assign_ambition': {
        // THR-885 (The Kindled Ambition) — the dispatcher reactive ambition
        // templates never had (THR-812 / THR-726). Routes through the shared
        // `assignAmbitionToActor` helper so a card-planted ambition is identical
        // on the graph to one `ambitionTick` mints from a world event.
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'assign_ambition', reason: 'no_actor_id',
            summary: `assign_ambition[${i}] skipped: no actor id`,
            // `Omit` over the TraceEntry union collapses it to the shared keys, so
            // every category-specific field reads as excess. Same cast the rest of
            // this file and `phaseAutonomousAftermath` already use.
          } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'assign_ambition', effectDetail: { templateId: effect.templateId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `assign_ambition[${i}] skipped: no actorId`,
          } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
          break;
        }

        const assignment = assignAmbitionToActor(
          state.graph, resolvedId, effect.templateId, tick,
          { priority: effect.priority, mintedByLabel: effect.narrativeHook },
        );

        if (assignment.assigned) {
          mutationSummary.touchedStructure = true;
          mutationSummary.touchedWorld = true;
          touchWorld(runtime);

          // Desire is interior — the chronicle entry is opt-in, authored per card.
          if (effect.narrativeHook) {
            const ambEvent: TickEvent = {
              id: `${resolvedId}_ambition_${effect.templateId}_${tick}`,
              tick,
              type: 'narrative',
              message: effect.narrativeHook,
              significance: 0.6,
              actorId: resolvedId,
            };
            nextTickEvents = [...nextTickEvents, ambEvent];
            nextRecentEvents = appendRecentEvent(nextRecentEvents, ambEvent);
          }
        }

        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'assign_ambition',
          effectDetail: {
            targetId: resolvedId,
            templateId: effect.templateId,
            priority: assignment.priority,
          },
          success: assignment.assigned,
          ...(assignment.assigned ? {} : { failReason: assignment.reason }),
          effectiveTargetId: resolvedId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: assignment.assigned
            ? `assign_ambition[${i}]: ${effect.templateId} → ${resolvedId} (${assignment.priority})`
            : `assign_ambition[${i}] skipped: ${assignment.reason}`,
        } as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
        break;
      }

      case 'condition_attachment': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', reason: 'no_actor_id',
            summary: `condition_attachment[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', effectDetail: { templateId: effect.templateId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `condition_attachment[${i}] skipped: no actorId`,
          });
          break;
        }
        const caTargetNode = state.graph.getNode(resolvedId);
        if (!caTargetNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `condition_attachment[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', effectDetail: { targetId: resolvedId, templateId: effect.templateId },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `condition_attachment[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const caTraitNode = state.graph.getNode(effect.templateId);
        if (!caTraitNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', reason: 'template_missing',
            summary: `condition_attachment[${i}] skipped: trait template not found (${effect.templateId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', effectDetail: { targetId: resolvedId, templateId: effect.templateId },
            success: false, failReason: 'template_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `condition_attachment[${i}] skipped: trait template not found (${effect.templateId})`,
          });
          break;
        }
        // ── tag_immunity (THR-1242) ── same gate as `apply_condition` above; this
        // is the second of the two runtime condition-infliction sites.
        const caImmuneTag = isImmuneToAnyTag(
          state.graph, resolvedId,
          (state.graph.getNode(effect.templateId)?.properties.tags as string[] | undefined) ?? [],
          state.effectStates,
        );
        if (caImmuneTag !== null) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment',
            effectDetail: { targetId: resolvedId, templateId: effect.templateId, immuneTag: caImmuneTag },
            success: false, failReason: 'tag_immunity',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `condition_attachment[${i}] blocked: target immune to ${caImmuneTag}`,
          });
          break;
        }

        const caStackCount = Math.max(1, effect.stackCount ?? CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT);
        const caDuration = (() => {
          if (effect.durationOverride !== undefined) {
            if (effect.durationOverride <= 0) {
              emitTrace({
                tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
                encounterId, actionId, reactionId: reaction.id, effectIndex: i,
                effectKind: 'condition_attachment', effectDetail: { warn: 'duration_override_invalid', templateId: effect.templateId },
                success: true,
                effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
                summary: `condition_attachment[${i}]: duration_override_invalid — falling back to template default`,
              });
              return CONDITION_DURATIONS[effect.templateId] ?? CONDITION_DEFAULT_DURATION_TICKS;
            }
            return effect.durationOverride;
          }
          return CONDITION_DURATIONS[effect.templateId] ?? CONDITION_DEFAULT_DURATION_TICKS;
        })();
        // Apply the condition once per stack
        const caEdgeIds: string[] = [];
        for (let s = 0; s < caStackCount; s++) {
          const caEdgeId = `has_trait_${resolvedId}_${effect.templateId}_${tick}_${i}_s${s}`;
          state.graph.addEdge({
            id: caEdgeId,
            source: resolvedId,
            target: effect.templateId,
            type: 'has_trait',
            properties: {
              appliedAt: tick,
              durationTicks: caDuration,
              // THR-761: see the apply_condition case above — `ticksRemaining` is the
              // field `decayConditions` counts down. 0 = indefinite (omit the field).
              ...(caDuration > 0 ? { ticksRemaining: caDuration } : {}),
              intensity: CONDITION_DEFAULT_INTENSITY,
              sourceEncounterId: encounterId,
              sourceReactionId: reaction.id,
            },
          });
          caEdgeIds.push(caEdgeId);
        }
        mutationSummary.touchedStructure = true;
        // Set woundApplied when wound condition targets the actor (drives mid-encounter promotion)
        const caIsWound = effect.templateId === 'trait.condition.wounded';
        // THR-1143: `resolvedId`, not the raw field — an effect naming a place leaves
        // `targetAgentId` undefined, and the old `!effect.targetAgentId` test read that
        // absence as "the actor", promoting the encounter tier for a wound nobody took.
        const caTargetsActor = !!actorAgentId && resolvedId === actorAgentId;
        if (caIsWound && caTargetsActor) {
          mutationSummary.woundApplied = true;
        }
        const caKind = (target.kind === 'agent' || target.kind === 'faction'
          || target.kind === 'sublocation' || target.kind === 'location')
          ? target.kind
          : 'agent' as const;
        emitTrace({
          tick, category: 'condition_applied', agentId: actorAgentId,
          targetId: resolvedId, targetKind: caKind,
          conditionTraitId: effect.templateId, durationTicks: caDuration, intensity: CONDITION_DEFAULT_INTENSITY,
          encounterId, reactionId: reaction.id,
          summary: `condition_attachment[${i}]: ${effect.templateId} → ${resolvedId} ×${caStackCount} (duration=${caDuration || 'indefinite'})`,
        });
        if (isLocationCarrier(state.graph, resolvedId)) {
          emitTrace({
            tick, category: 'location_condition_applied', agentId: actorAgentId,
            locationId: resolvedId, locationName: caTargetNode.name,
            carrierKind: locationCarrierKind(state.graph, resolvedId),
            conditionTemplateId: effect.templateId,
            ticksRemaining: caDuration > 0 ? caDuration : 0,
            encounterId, reactionId: reaction.id,
            summary: `location_condition_applied[${i}]: ${effect.templateId} → ${caTargetNode.name} (${caDuration > 0 ? `${caDuration}t` : 'indefinite'})`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'condition_attachment',
          effectDetail: { targetId: resolvedId, templateId: effect.templateId, stackCount: caStackCount, durationTicks: caDuration, edgeIds: caEdgeIds, woundApplied: mutationSummary.woundApplied },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `condition_attachment[${i}]: ${effect.templateId} → ${resolvedId} ×${caStackCount}${caIsWound && caTargetsActor ? ' [woundApplied]' : ''}`,
        });
        // THR-1244: this is the *same* `has_trait` write as `apply_condition` under a
        // second effect kind, and it is the one the shipped wound content actually
        // authors — every `trait.condition.wounded` in the tavern package comes
        // through here. Wiring only `apply_condition` would have left the busiest
        // infliction path silent while the stage read as done. One raise per
        // infliction, not per stack: `amount` carries the stack count instead, so a
        // three-stack wound is one heavier event rather than three identical ones
        // (and cannot trip a reactive's cooldown against itself).
        raiseConditionDamaged(
          state, resolvedId, effect.templateId, CONDITION_DEFAULT_INTENSITY * caStackCount,
        );
        break;
      }

      case 'attachment_grant': {
        // THR-1110. A dispatcher over two pre-existing write paths — never a third
        // one. The template's own shape picks the path: an agreement catalog id is
        // edge-backed, anything else is a graph template node.
        const agKind = (target.kind === 'agent' || target.kind === 'faction' || target.kind === 'sublocation')
          ? target.kind
          : 'agent' as const;
        const agRecipientId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!agRecipientId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'attachment_grant', reason: 'no_actor_id',
            summary: `attachment_grant[${i}] skipped: no recipient id`,
          } as unknown as TraceEntry);
          break;
        }

        const agAgreementTemplate = getAgreementTemplate(effect.templateId);

        if (agAgreementTemplate) {
          // Edge-backed. A promise needs someone on the other end of it, so an
          // unresolvable counterparty no-ops rather than writing a dangling edge.
          const agCounterpartyId = effect.counterpartyId;
          if (!agCounterpartyId || agCounterpartyId.startsWith('$') || !state.graph.getNode(agCounterpartyId)) {
            emitTrace({
              tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'attachment_grant',
              effectDetail: { templateId: effect.templateId, counterpartyId: agCounterpartyId ?? null, attachmentCategory: 'agreement' },
              success: false,
              failReason: agCounterpartyId ? 'counterparty_unresolved' : 'counterparty_missing',
              effectiveTargetId: agRecipientId,
              effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
              summary: `attachment_grant[${i}] skipped: agreement '${effect.templateId}' needs a counterparty that resolves (${agCounterpartyId ?? 'none given'})`,
            } as unknown as TraceEntry);
            break;
          }

          const agAgreement = instantiateAgreementReward(
            state.graph,
            agRecipientId,
            agCounterpartyId,
            effect.durationOverride === undefined
              ? agAgreementTemplate
              : { ...agAgreementTemplate, ticksRemaining: effect.durationOverride },
            tick,
          );
          if (!agAgreement) {
            emitTrace({
              tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'attachment_grant',
              effectDetail: { templateId: effect.templateId, targetId: agRecipientId, attachmentCategory: 'agreement' },
              success: false, failReason: 'recipient_missing',
              effectiveTargetId: agRecipientId,
              effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
              summary: `attachment_grant[${i}] skipped: recipient node not found (${agRecipientId})`,
            } as unknown as TraceEntry);
            break;
          }

          mutationSummary.touchedStructure = true;
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'attachment_grant',
            effectDetail: {
              templateId: effect.templateId,
              targetId: agRecipientId,
              counterpartyId: agCounterpartyId,
              attachmentCategory: 'agreement',
              agreementType: agAgreementTemplate.agreementType,
              edgeId: agAgreement.edgeId,
              displayName: agAgreement.displayName,
              targetKind: agKind,
            },
            success: true,
            effectiveTargetId: agRecipientId,
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `attachment_grant[${i}]: agreement '${agAgreement.displayName}' binds ${agRecipientId} to ${agCounterpartyId}`,
          } as unknown as TraceEntry);
          break;
        }

        // Node-backed: blessing, curse, bestowed_power, spell, and the two
        // categories that already had dedicated members. `instantiateReward`
        // resolves which edge to write from the template's own type/subcategory.
        const agInstance = instantiateReward(state.graph, effect.templateId, agRecipientId, tick);
        if (!agInstance) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'attachment_grant',
            effectDetail: { templateId: effect.templateId, targetId: agRecipientId },
            success: false, failReason: 'template_or_recipient_missing',
            effectiveTargetId: agRecipientId,
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `attachment_grant[${i}] skipped: no template or recipient for '${effect.templateId}'`,
          } as unknown as TraceEntry);
          break;
        }

        // Duration override rides the edge the reward path just wrote, so the
        // authored value and the template default share one write (no parallel path).
        if (effect.durationOverride !== undefined) {
          const agEdge = state.graph.getEdge(agInstance.edgeId);
          if (agEdge) {
            const agProps = { ...agEdge.properties } as Record<string, unknown>;
            agProps.ticksRemaining = effect.durationOverride;
            if (effect.durationOverride !== null) agProps.totalTicks = effect.durationOverride;
            state.graph.updateEdge(agInstance.edgeId, { properties: agProps });
          }
        }

        mutationSummary.touchedStructure = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'attachment_grant',
          effectDetail: {
            templateId: effect.templateId,
            targetId: agRecipientId,
            attachmentCategory: agInstance.category,
            instanceId: agInstance.instanceId,
            edgeId: agInstance.edgeId,
            displayName: agInstance.displayName,
            durationTicks: effect.durationOverride,
            targetKind: agKind,
          },
          success: true,
          effectiveTargetId: agRecipientId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `attachment_grant[${i}]: ${agInstance.category} '${agInstance.displayName}' → ${agRecipientId}`,
        } as unknown as TraceEntry);
        break;
      }

      // ─── World-shaping effects (THR-115) ───────────────────────────────────

      case 'spawn_artifact': {
        // Resolve placement target: explicit agent > explicit location > symbolic actor fallback
        const saAgentId = effect.targetAgentId
          ? (effect.targetAgentId.startsWith('$') ? actorAgentId : effect.targetAgentId)
          : (!effect.targetLocationId ? actorAgentId : undefined);
        const saLocationId = effect.targetLocationId;

        if (!saAgentId && !saLocationId) {
          emitTrace({
            tick, category: 'artifact_spawned', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            artifactId: '', artifactName: '', tier: 'common',
            templateId: effect.templateId, targetAgentId: undefined, targetLocationId: undefined,
            sourceEncounterId: encounterId, sourceReactionId: reaction.id,
            success: false, failReason: 'no_placement_target',
            summary: `spawn_artifact[${i}] skipped: no placement target`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_artifact', effectDetail: { templateId: effect.templateId },
            success: false, failReason: 'no_placement_target',
            summary: `spawn_artifact[${i}] skipped: no placement target`,
          });
          break;
        }

        // Validate placement node exists
        if (saAgentId && !state.graph.getNode(saAgentId)) {
          emitTrace({
            tick, category: 'artifact_spawned', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            artifactId: '', artifactName: '', tier: 'common',
            templateId: effect.templateId, targetAgentId: saAgentId,
            sourceEncounterId: encounterId, sourceReactionId: reaction.id,
            success: false, failReason: 'target_actor_missing',
            summary: `spawn_artifact[${i}] skipped: target actor ${saAgentId} not found`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_artifact', effectDetail: { targetAgentId: saAgentId },
            success: false, failReason: 'target_actor_missing',
            summary: `spawn_artifact[${i}] skipped: actor ${saAgentId} not found`,
          });
          break;
        }
        if (saLocationId && !state.graph.getNode(saLocationId)) {
          emitTrace({
            tick, category: 'artifact_spawned', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            artifactId: '', artifactName: '', tier: 'common',
            templateId: effect.templateId, targetLocationId: saLocationId,
            sourceEncounterId: encounterId, sourceReactionId: reaction.id,
            success: false, failReason: 'target_location_missing',
            summary: `spawn_artifact[${i}] skipped: target location ${saLocationId} not found`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_artifact', effectDetail: { targetLocationId: saLocationId },
            success: false, failReason: 'target_location_missing',
            summary: `spawn_artifact[${i}] skipped: location ${saLocationId} not found`,
          });
          break;
        }

        // Determine tier — template lookup is deferred until Phase 2+ content; fall back to 'common'
        const saTier: ArtifactTier = effect.tier ?? 'common';
        const saNodeType = saTier === 'legendary' ? 'artifact_legendary' : 'artifact';
        const saActorEdgeType = saTier === 'legendary' ? 'bonded_to' : 'possesses';

        // Derive artifact name: nameOverride > templateId-based > generic
        const saName = effect.nameOverride
          ?? (effect.templateId ? effect.templateId.split('.').pop() ?? 'artifact' : 'artifact');

        const saArtifactId = `artifact_spawned_${encounterId}_${reaction.id}_${i}_${tick}`;

        // Warn if templateId not found in graph (fail-soft: use fallback name)
        let saTemplateMissing = false;
        if (effect.templateId && !state.graph.getNode(effect.templateId)) {
          saTemplateMissing = true;
        }

        state.graph.addNode({
          id: saArtifactId,
          type: saNodeType,
          name: saName,
          properties: {
            category: effect.category,
            tier: saTier,
            tags: effect.tags ? [...effect.tags] : [],
            sourceEncounterId: encounterId,
            spawnedAtTick: tick,
          },
        });

        if (saAgentId) {
          state.graph.addEdge({
            id: `${saActorEdgeType}_${saAgentId}_${saArtifactId}`,
            source: saAgentId,
            target: saArtifactId,
            type: saActorEdgeType,
            properties: { spawnedAtTick: tick, sourceEncounterId: encounterId },
          });
        } else if (saLocationId) {
          state.graph.addEdge({
            id: `contains_${saLocationId}_${saArtifactId}`,
            source: saLocationId,
            target: saArtifactId,
            type: 'contains',
            properties: { spawnedAtTick: tick, sourceEncounterId: encounterId },
          });
        }

        mutationSummary.touchedWorld = true;
        touchWorld(runtime);

        const saSignificance = saTier === 'legendary'
          ? SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_LEGENDARY
          : saTier === 'shaping'
            ? SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_SHAPING
            : SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_COMMON;

        const saMessage = effect.messageOverride ?? `${saName} has come into the world.`;
        const saEvent: TickEvent = {
          id: `${saArtifactId}_chronicle`,
          tick,
          type: 'narrative',
          message: saMessage,
          significance: saSignificance,
          actorId: saAgentId ?? actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, saEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, saEvent);

        emitTrace({
          tick, category: 'artifact_spawned', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          artifactId: saArtifactId, artifactName: saName, tier: saTier,
          templateId: effect.templateId,
          targetAgentId: saAgentId, targetLocationId: saLocationId,
          sourceEncounterId: encounterId, sourceReactionId: reaction.id,
          success: true,
          ...(saTemplateMissing ? { failReason: 'template_missing_used_fallback' } : {}),
          summary: `spawn_artifact[${i}]: "${saName}" (${saTier}) → ${saAgentId ?? saLocationId}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'spawn_artifact',
          effectDetail: { artifactId: saArtifactId, name: saName, tier: saTier, targetAgentId: saAgentId, targetLocationId: saLocationId },
          success: true,
          summary: `spawn_artifact[${i}]: "${saName}" (${saTier})`,
        });
        break;
      }

      case 'plant_compulsion': {
        // The Compulsion (THR-886). Sibling of emit_omen, addressed to a person
        // rather than a place — see PlantedCompulsion's doc for why the two
        // cannot share a carrier.
        if (target.kind === 'faction' || target.kind === 'sublocation') {
          emitCompulsionAftermathTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'plant_compulsion', attemptedTargetKind: target.kind, attemptedTargetId: target.id,
            reason: 'target_kind_not_supported',
            summary: `plant_compulsion[${i}] skipped: ${target.kind} target not supported — a compulsion needs a mortal`,
          });
          break;
        }
        const pcTargetAgentId = target.kind === 'agent' ? target.id : (actorAgentId ?? '');
        if (!pcTargetAgentId) {
          emitCompulsionAftermathTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'plant_compulsion', effectDetail: {},
            success: false, failReason: 'no_target_agent',
            summary: `plant_compulsion[${i}] skipped: no mortal to dream it`,
          });
          break;
        }

        // Drop non-finite authored weights here as well as at read time, so a bad
        // content row never reaches state (NFP #4).
        const pcBias: Record<string, number> = {};
        for (const [encounterType, weight] of Object.entries(effect.encounterBias ?? {})) {
          if (typeof weight === 'number' && Number.isFinite(weight)) pcBias[encounterType] = weight;
        }
        if (Object.keys(pcBias).length === 0) {
          emitCompulsionAftermathTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'plant_compulsion', effectDetail: { targetAgentId: pcTargetAgentId },
            success: false, failReason: 'empty_bias',
            summary: `plant_compulsion[${i}] skipped: no usable encounter bias authored`,
          });
          break;
        }

        const pcId = `compulsion_${encounterId}_${reaction.id}_${i}_${tick}`;
        const pcDuration = effect.durationTicks ?? COMPULSION_DEFAULT_DURATION_TICKS;
        const pcEntry: PlantedCompulsion = {
          compulsionId: pcId,
          targetAgentId: pcTargetAgentId,
          encounterBias: pcBias,
          ...(effect.narrativeHook ? { narrativeHook: effect.narrativeHook } : {}),
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          plantedTick: tick,
          expiresTick: tick + pcDuration,
        };

        const currentCompulsions: PlantedCompulsion[] = nextPlantedCompulsions ?? state.plantedCompulsions ?? [];
        let updatedCompulsions: PlantedCompulsion[] = [...currentCompulsions, pcEntry];
        if (updatedCompulsions.length > COMPULSION_MAX_ACTIVE) {
          const evicted = updatedCompulsions.reduce((oldest, c) =>
            c.plantedTick < oldest.plantedTick ? c : oldest
          , updatedCompulsions[0]);
          emitCompulsionAftermathTrace({
            tick, category: 'compulsion_decayed', agentId: evicted.targetAgentId,
            compulsionId: evicted.compulsionId, livedTicks: tick - evicted.plantedTick,
            failReason: 'cap_evicted',
            summary: `compulsion_decayed: ${evicted.compulsionId} evicted (cap_evicted)`,
          });
          updatedCompulsions = updatedCompulsions.filter(c => c !== evicted);
        }
        nextPlantedCompulsions = updatedCompulsions;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);

        // A tilt nobody can see is indistinguishable from the do-nothing behaviour
        // this card had before the fix, so an authored hook reaches the chronicle.
        if (effect.narrativeHook) {
          const pcEvent: TickEvent = {
            id: `${pcId}_chronicle`,
            tick,
            type: 'narrative',
            message: effect.narrativeHook,
            significance: 0.4,
            actorId: pcTargetAgentId,
          };
          nextTickEvents = [...nextTickEvents, pcEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, pcEvent);
        }

        emitCompulsionAftermathTrace({
          tick, category: 'compulsion_planted', agentId: pcTargetAgentId,
          compulsionId: pcId,
          encounterBias: pcBias,
          expiresTick: pcEntry.expiresTick,
          sourceEncounterId: encounterId, sourceReactionId: reaction.id,
          summary: `compulsion_planted[${i}]: ${pcTargetAgentId} pulled toward ${Object.keys(pcBias).join('/')} until tick ${pcEntry.expiresTick}`,
        });
        emitCompulsionAftermathTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'plant_compulsion',
          effectDetail: { compulsionId: pcId, targetAgentId: pcTargetAgentId, encounterBias: pcBias },
          success: true,
          effectiveTargetId: pcTargetAgentId, effectiveTargetKind: 'agent',
          summary: `plant_compulsion[${i}]: urge planted on ${pcTargetAgentId}`,
        });
        break;
      }

      case 'emit_omen': {
        const eoId = `omen_${encounterId}_${reaction.id}_${i}_${tick}`;
        const eoDuration = effect.durationTicks ?? EMITTED_OMEN_DEFAULT_DURATION_TICKS;
        const eoExpiresTick = tick + eoDuration;

        // Normalize scope — degrade invalid scope to global
        let eoScope = effect.scope;
        let eoDegradedToGlobal = false;
        if (eoScope.kind === 'regional' && !eoScope.regionId) {
          eoScope = { kind: 'global' };
          eoDegradedToGlobal = true;
        }
        if (eoScope.kind === 'local' && (eoScope.hexCol === undefined || eoScope.hexRow === undefined)) {
          eoScope = { kind: 'global' };
          eoDegradedToGlobal = true;
        }
        // Apply default radius for local scope
        if (eoScope.kind === 'local' && eoScope.radius === undefined) {
          eoScope = { ...eoScope, radius: EMITTED_OMEN_LOCAL_DEFAULT_RADIUS };
        }

        const eoEntry: EmittedOmen = {
          omenId: eoId,
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          category: effect.category,
          intensity: Math.max(0, Math.min(1, effect.intensity)),
          scope: eoScope,
          narrativeHook: effect.narrativeHook,
          sphereAlignment: effect.sphereAlignment,
          emittedTick: tick,
          expiresTick: eoExpiresTick,
        };

        // Build new emittedOmens list with cap enforcement
        const currentOmens = nextEmittedOmens ?? state.emittedOmens ?? [];
        let updatedOmens = [...currentOmens, eoEntry];
        if (updatedOmens.length > EMITTED_OMEN_MAX_ACTIVE) {
          // Evict oldest (smallest emittedTick)
          const evicted = updatedOmens.reduce((oldest, o) =>
            o.emittedTick < oldest.emittedTick ? o : oldest
          , updatedOmens[0]);
          emitTrace({
            tick, category: 'omen_decayed', agentId: actorAgentId,
            omenId: evicted.omenId, livedTicks: tick - evicted.emittedTick,
            failReason: 'cap_evicted',
            summary: `omen_decayed: ${evicted.omenId} evicted (cap_evicted)`,
          });
          updatedOmens = updatedOmens.filter(o => o !== evicted);
        }
        nextEmittedOmens = updatedOmens;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);

        const eoSignificance = Math.max(0.5, Math.min(0.85, 0.5 + eoEntry.intensity * 0.3));
        const eoEvent: TickEvent = {
          id: `${eoId}_chronicle`,
          tick,
          type: 'narrative',
          message: effect.narrativeHook,
          significance: eoSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, eoEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, eoEvent);

        emitTrace({
          tick, category: 'omen_emitted', agentId: actorAgentId,
          omenId: eoId, omenCategory: effect.category,
          intensity: eoEntry.intensity, scope: eoScope,
          expiresTick: eoExpiresTick,
          sourceEncounterId: encounterId, sourceReactionId: reaction.id,
          ...(eoDegradedToGlobal ? { degradedToGlobal: true } : {}),
          summary: `omen_emitted[${i}]: ${effect.category} intensity=${eoEntry.intensity.toFixed(2)} scope=${eoScope.kind} expires@${eoExpiresTick}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'emit_omen',
          effectDetail: { omenId: eoId, category: effect.category, intensity: eoEntry.intensity, scope: eoScope, expiresTick: eoExpiresTick },
          success: true,
          summary: `emit_omen[${i}]: ${effect.category} ${eoEntry.intensity.toFixed(2)} (${eoScope.kind})`,
        });
        break;
      }

      case 'faction_splinter': {
        const fsSrc = state.graph.getNode(effect.sourceFactionId);
        if (!fsSrc || (fsSrc.properties?.actorStatus as string | undefined) === 'dissolved') {
          emitTrace({
            tick, category: 'faction_splintered', agentId: actorAgentId,
            sourceFactionId: effect.sourceFactionId, newFactionId: '',
            memberCount: 0, selectionKind: '', reputationShare: 0,
            success: false, failReason: 'source_faction_invalid',
            summary: `faction_splinter[${i}] skipped: source faction invalid (${effect.sourceFactionId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_splinter', effectDetail: { sourceFactionId: effect.sourceFactionId },
            success: false, failReason: 'source_faction_invalid',
            summary: `faction_splinter[${i}] skipped: source faction invalid`,
          });
          break;
        }

        // Select members from source faction
        const allMembers = state.graph.getIncomingEdges(effect.sourceFactionId, 'member_of')
          .map(e => ({ id: e.source, reputation: (e.properties?.reputation as number | undefined) ?? DEFAULT_FACTION_REPUTATION }));

        let selectedMembers = selectFactionMembers(allMembers, effect.memberSelection, state, tick, encounterId, reaction.id, i);

        const newFactionId = `faction_splinter_${encounterId}_${reaction.id}_${i}_${tick}`;
        state.graph.addNode({
          id: newFactionId,
          type: 'actor',
          name: effect.newFactionName,
          properties: {
            actorType: 'faction',
            actorStatus: 'active',
            sourceEncounterId: encounterId,
            foundedTick: tick,
          },
        });

        const repShare = effect.inheritReputationShare ?? FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE;
        for (const member of selectedMembers) {
          // Remove old member_of edge
          const oldEdges = getFactionMembershipEdges(state.graph, member.id)
            .filter(e => e.target === effect.sourceFactionId);
          for (const e of oldEdges) state.graph.removeEdge(e.id);

          // Add new member_of edge to splinter
          state.graph.addEdge({
            id: `member_of_${member.id}_${newFactionId}`,
            source: member.id,
            target: newFactionId,
            type: 'member_of',
            properties: { reputation: clamp01(member.reputation * repShare), joinedTick: tick },
          });
        }

        // Copy relates_to edges from source to new faction (marked inherited)
        const srcRelations = state.graph.getOutgoingEdges(effect.sourceFactionId, 'relates_to');
        for (const rel of srcRelations) {
          if (rel.target !== newFactionId) {
            state.graph.addEdge({
              id: `relates_to_${newFactionId}_${rel.target}_inherited`,
              source: newFactionId,
              target: rel.target,
              type: 'relates_to',
              properties: { ...rel.properties, inherited: true },
            });
          }
        }

        // Splinter starts resentful toward parent
        state.graph.addEdge({
          id: `relates_to_${newFactionId}_${effect.sourceFactionId}`,
          source: newFactionId,
          target: effect.sourceFactionId,
          type: 'relates_to',
          properties: { sentiment: FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT, strength: 0.8, basis: 'splinter' },
        });

        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const fsSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.splinter;
        const fsMessage = effect.narrativeHook ?? `${fsSrc.name} fractures. ${effect.newFactionName} breaks away.`;
        const fsEvent: TickEvent = {
          id: `${newFactionId}_chronicle`,
          tick,
          type: 'narrative',
          message: fsMessage,
          significance: fsSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, fsEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, fsEvent);

        emitTrace({
          tick, category: 'faction_splintered', agentId: actorAgentId,
          sourceFactionId: effect.sourceFactionId, newFactionId,
          memberCount: selectedMembers.length,
          selectionKind: effect.memberSelection.kind,
          reputationShare: repShare,
          success: true,
          summary: `faction_splinter[${i}]: ${effect.sourceFactionId} → ${newFactionId} (${selectedMembers.length} members, sel=${effect.memberSelection.kind})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_splinter',
          effectDetail: { sourceFactionId: effect.sourceFactionId, newFactionId, memberCount: selectedMembers.length },
          success: true,
          summary: `faction_splinter[${i}]: ${selectedMembers.length} members broke to ${newFactionId}`,
        });
        break;
      }

      case 'faction_absorb': {
        const faAbsorbing = state.graph.getNode(effect.absorbingFactionId);
        const faAbsorbed = state.graph.getNode(effect.absorbedFactionId);
        if (!faAbsorbing || !faAbsorbed
          || (faAbsorbing.properties?.actorStatus as string | undefined) === 'dissolved'
          || (faAbsorbed.properties?.actorStatus as string | undefined) === 'dissolved') {
          emitTrace({
            tick, category: 'faction_absorbed', agentId: actorAgentId,
            absorbingFactionId: effect.absorbingFactionId, absorbedFactionId: effect.absorbedFactionId,
            migratedMemberCount: 0, reputationMergeStrategy: '',
            success: false, failReason: 'faction_missing_or_dissolved',
            summary: `faction_absorb[${i}] skipped: faction missing or dissolved`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_absorb',
            effectDetail: { absorbingFactionId: effect.absorbingFactionId, absorbedFactionId: effect.absorbedFactionId },
            success: false, failReason: 'faction_missing_or_dissolved',
            summary: `faction_absorb[${i}] skipped: faction missing or dissolved`,
          });
          break;
        }

        const mergeStrategy = effect.reputationMerge ?? 'weighted_avg';
        const absorbedMembers = state.graph.getIncomingEdges(effect.absorbedFactionId, 'member_of');
        let migratedCount = 0;

        for (const memberEdge of absorbedMembers) {
          const absorbedRep = (memberEdge.properties?.reputation as number | undefined) ?? DEFAULT_FACTION_REPUTATION;
          // Check if already member of absorbing faction
          const existingEdge = getFactionMembershipEdges(state.graph, memberEdge.source)
            .find(e => e.target === effect.absorbingFactionId);

          const newRep = existingEdge
            ? mergeReputation(
                (existingEdge.properties?.reputation as number | undefined) ?? DEFAULT_FACTION_REPUTATION,
                absorbedRep,
                mergeStrategy,
              )
            : absorbedRep;

          state.graph.removeEdge(memberEdge.id);
          if (existingEdge) {
            existingEdge.properties.reputation = newRep;
          } else {
            state.graph.addEdge({
              id: `member_of_${memberEdge.source}_${effect.absorbingFactionId}`,
              source: memberEdge.source,
              target: effect.absorbingFactionId,
              type: 'member_of',
              properties: { reputation: newRep, joinedTick: tick },
            });
          }
          migratedCount++;
        }

        // Rewrite relates_to edges pointing at absorbed faction → absorbing
        const allRelatesTo = state.graph.getIncomingEdges(effect.absorbedFactionId, 'relates_to');
        for (const rel of allRelatesTo) {
          if (rel.source !== effect.absorbingFactionId) {
            state.graph.removeEdge(rel.id);
            // Avoid self-loop: skip if source is absorbing faction
            state.graph.addEdge({
              id: `${rel.id}_rewritten`,
              source: rel.source,
              target: effect.absorbingFactionId,
              type: 'relates_to',
              properties: { ...rel.properties },
            });
          }
        }

        // Mark absorbed faction dissolved
        faAbsorbed.properties.actorStatus = 'dissolved';
        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const faSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.absorb;
        const faMessage = effect.narrativeHook ?? `${faAbsorbed.name} is absorbed into ${faAbsorbing.name}.`;
        const faEvent: TickEvent = {
          id: `faction_absorb_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: faMessage,
          significance: faSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, faEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, faEvent);

        emitTrace({
          tick, category: 'faction_absorbed', agentId: actorAgentId,
          absorbingFactionId: effect.absorbingFactionId,
          absorbedFactionId: effect.absorbedFactionId,
          migratedMemberCount: migratedCount,
          reputationMergeStrategy: mergeStrategy,
          success: true,
          summary: `faction_absorb[${i}]: ${effect.absorbedFactionId} → ${effect.absorbingFactionId} (${migratedCount} members, merge=${mergeStrategy})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_absorb',
          effectDetail: { absorbingFactionId: effect.absorbingFactionId, absorbedFactionId: effect.absorbedFactionId, migratedMemberCount: migratedCount },
          success: true,
          summary: `faction_absorb[${i}]: ${migratedCount} members migrated`,
        });
        break;
      }

      case 'faction_dissolve': {
        const fdNode = state.graph.getNode(effect.factionId);
        if (!fdNode) {
          emitTrace({
            tick, category: 'faction_dissolved', agentId: actorAgentId,
            factionId: effect.factionId, releasedMemberCount: 0, memberFallback: '',
            success: false, failReason: 'faction_missing',
            summary: `faction_dissolve[${i}] skipped: faction ${effect.factionId} not found`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_dissolve', effectDetail: { factionId: effect.factionId },
            success: false, failReason: 'faction_missing',
            summary: `faction_dissolve[${i}] skipped: faction not found`,
          });
          break;
        }

        const fdFallback = effect.memberFallback ?? 'independent';
        const fdMembers = state.graph.getIncomingEdges(effect.factionId, 'member_of');

        // Find top rival for drift_to_rival fallback (skip dissolved target factions)
        let fdRivalId: string | undefined;
        if (fdFallback === 'drift_to_rival') {
          const fdRelations = state.graph.getOutgoingEdges(effect.factionId, 'relates_to')
            .filter(e => (state.graph.getNode(e.target)?.properties?.actorStatus as string | undefined) !== 'dissolved')
            .sort((a, b) => ((b.properties?.strength as number | undefined) ?? 0) - ((a.properties?.strength as number | undefined) ?? 0));
          fdRivalId = fdRelations[0]?.target;
        }

        for (const memberEdge of fdMembers) {
          state.graph.removeEdge(memberEdge.id);
          if (fdFallback === 'drift_to_rival' && fdRivalId) {
            state.graph.addEdge({
              id: `member_of_${memberEdge.source}_${fdRivalId}_drift`,
              source: memberEdge.source,
              target: fdRivalId,
              type: 'member_of',
              properties: { reputation: FACTION_DRIFT_TO_RIVAL_INITIAL_REPUTATION, joinedTick: tick, basis: 'drift' },
            });
          }
        }

        fdNode.properties.actorStatus = 'dissolved';
        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const fdSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.dissolve;
        const fdMessage = effect.narrativeHook ?? `${fdNode.name} is no more.`;
        const fdEvent: TickEvent = {
          id: `faction_dissolve_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: fdMessage,
          significance: fdSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, fdEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, fdEvent);

        emitTrace({
          tick, category: 'faction_dissolved', agentId: actorAgentId,
          factionId: effect.factionId, releasedMemberCount: fdMembers.length,
          memberFallback: fdFallback,
          success: true,
          summary: `faction_dissolve[${i}]: ${effect.factionId} dissolved (${fdMembers.length} members released, fallback=${fdFallback})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_dissolve',
          effectDetail: { factionId: effect.factionId, releasedMemberCount: fdMembers.length, memberFallback: fdFallback },
          success: true,
          summary: `faction_dissolve[${i}]: ${fdMembers.length} members released`,
        });
        break;
      }

      case 'faction_declare_war': {
        const fdwA = state.graph.getNode(effect.factionA);
        const fdwB = state.graph.getNode(effect.factionB);
        if (!fdwA || !fdwB) {
          emitTrace({
            tick, category: 'faction_war_declared', agentId: actorAgentId,
            factionA: effect.factionA, factionB: effect.factionB, previousSentiment: 0,
            success: false, failReason: 'faction_missing',
            summary: `faction_declare_war[${i}] skipped: faction missing`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_declare_war',
            effectDetail: { factionA: effect.factionA, factionB: effect.factionB },
            success: false, failReason: 'faction_missing',
            summary: `faction_declare_war[${i}] skipped: faction missing`,
          });
          break;
        }

        const upsertWarRelation = (src: string, dst: string) => {
          const existing = state.graph.getOutgoingEdges(src, 'relates_to').find(e => e.target === dst);
          const prevSent = existing ? (existing.properties?.sentiment as number | undefined) ?? 0 : 0;
          if (existing) {
            existing.properties.sentiment = FACTION_WAR_SENTIMENT_FLOOR;
            existing.properties.strength = 1.0;
            existing.properties.basis = 'war';
          } else {
            state.graph.addEdge({
              id: `relates_to_${src}_${dst}_war`,
              source: src,
              target: dst,
              type: 'relates_to',
              properties: { sentiment: FACTION_WAR_SENTIMENT_FLOOR, strength: 1.0, basis: 'war' },
            });
          }
          return prevSent;
        };

        const fdwPrevSent = upsertWarRelation(effect.factionA, effect.factionB);
        upsertWarRelation(effect.factionB, effect.factionA);

        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const fdwSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.declare_war;
        const fdwMessage = effect.narrativeHook ?? `${fdwA.name} and ${fdwB.name} are now at war.`;
        const fdwEvent: TickEvent = {
          id: `faction_war_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: fdwMessage,
          significance: fdwSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, fdwEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, fdwEvent);

        emitTrace({
          tick, category: 'faction_war_declared', agentId: actorAgentId,
          factionA: effect.factionA, factionB: effect.factionB,
          previousSentiment: fdwPrevSent,
          success: true,
          summary: `faction_declare_war[${i}]: ${effect.factionA} ⚔ ${effect.factionB}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_declare_war',
          effectDetail: { factionA: effect.factionA, factionB: effect.factionB },
          success: true,
          summary: `faction_declare_war[${i}]: war between ${effect.factionA} and ${effect.factionB}`,
        });
        break;
      }

      case 'faction_force_peace': {
        const ffpA = state.graph.getNode(effect.factionA);
        const ffpB = state.graph.getNode(effect.factionB);
        if (!ffpA || !ffpB) {
          emitTrace({
            tick, category: 'faction_peace_forced', agentId: actorAgentId,
            factionA: effect.factionA, factionB: effect.factionB,
            previousSentiment: 0, newSentiment: 0,
            success: false, failReason: 'faction_missing',
            summary: `faction_force_peace[${i}] skipped: faction missing`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_force_peace',
            effectDetail: { factionA: effect.factionA, factionB: effect.factionB },
            success: false, failReason: 'faction_missing',
            summary: `faction_force_peace[${i}] skipped: faction missing`,
          });
          break;
        }

        const sentBoost = effect.sentimentBoost ?? FACTION_PEACE_DEFAULT_SENTIMENT_BOOST;
        const upsertPeaceRelation = (src: string, dst: string) => {
          const existing = state.graph.getOutgoingEdges(src, 'relates_to').find(e => e.target === dst);
          const prevSent = existing ? (existing.properties?.sentiment as number | undefined) ?? 0 : 0;
          const newSent = Math.max(FACTION_PEACE_SENTIMENT_FLOOR, prevSent + sentBoost);
          if (existing) {
            existing.properties.sentiment = newSent;
            existing.properties.basis = 'treaty';
          } else {
            state.graph.addEdge({
              id: `relates_to_${src}_${dst}_peace`,
              source: src,
              target: dst,
              type: 'relates_to',
              properties: { sentiment: newSent, strength: 0.6, basis: 'treaty' },
            });
          }
          return { prevSent, newSent };
        };

        const { prevSent: ffpPrevSent, newSent: ffpNewSent } = upsertPeaceRelation(effect.factionA, effect.factionB);
        upsertPeaceRelation(effect.factionB, effect.factionA);

        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const ffpSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.force_peace;
        const ffpMessage = effect.narrativeHook ?? `${ffpA.name} and ${ffpB.name} have made peace.`;
        const ffpEvent: TickEvent = {
          id: `faction_peace_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: ffpMessage,
          significance: ffpSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, ffpEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, ffpEvent);

        emitTrace({
          tick, category: 'faction_peace_forced', agentId: actorAgentId,
          factionA: effect.factionA, factionB: effect.factionB,
          previousSentiment: ffpPrevSent, newSentiment: ffpNewSent,
          success: true,
          summary: `faction_force_peace[${i}]: ${effect.factionA} ↔ ${effect.factionB} sentiment ${ffpPrevSent.toFixed(2)} → ${ffpNewSent.toFixed(2)}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_force_peace',
          effectDetail: { factionA: effect.factionA, factionB: effect.factionB, previousSentiment: ffpPrevSent, newSentiment: ffpNewSent },
          success: true,
          summary: `faction_force_peace[${i}]: peace between ${effect.factionA} and ${effect.factionB}`,
        });
        break;
      }

      // ─── Reach signature: Iron / Warhost (THR-550) ─────────────────────────

      case 'signature_warhost': {
        try {
          const whFaction = state.graph.getNode(effect.factionId);
          const whFailReason = !whFaction
            ? 'faction_missing'
            : whFaction.properties.actorType !== 'faction'
              ? 'not_a_faction'
              : whFaction.properties.actorStatus === 'dissolved'
                ? 'faction_dissolved'
                : undefined;
          if (!whFaction || whFailReason) {
            emitTrace({
              tick, category: 'ascendant.signature.warhost', agentId: actorAgentId,
              factionId: effect.factionId, success: false, failReason: whFailReason,
              summary: `signature_warhost[${i}] skipped: faction ${effect.factionId} (${whFailReason})`,
            });
            emitTrace({
              tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'signature_warhost', effectDetail: { factionId: effect.factionId },
              success: false, failReason: whFailReason,
              effectiveTargetId: effect.factionId, effectiveTargetKind: 'faction',
              summary: `signature_warhost[${i}] skipped: ${whFailReason}`,
            });
            break;
          }

          // Strength scales with the actor's primary-sphere power (THR-548).
          const whActor = actorAgentId ? state.graph.getNode(actorAgentId) : undefined;
          const whSphere = actorAgentId ? getAscendantPrimarySphere(state.graph, actorAgentId) : undefined;
          const whScore = whSphere
            ? ((whActor?.properties.sphereAffinity as { scores?: Record<string, number> } | undefined)?.scores?.[whSphere] ?? 0)
            : 0;
          const whMult = spherePowerMultiplier(whScore);
          const whStrength = scaledEffect(effect.baseStrength ?? WARHOST_BASE_STRENGTH, whMult);

          // Mark the faction mobilized (faction property).
          whFaction.properties.mobilized = true;
          whFaction.properties.mobilizedTick = tick;
          whFaction.properties.mobilizedStrength = whStrength;

          // Model the force on the existing army node form (armySpawning.raiseWarhostForce).
          // Prefer the authored leader (any individual), else the faction's strongest Iron member.
          const whLeaderId =
            (effect.leaderAgentId && state.graph.getNode(effect.leaderAgentId)?.properties.actorType === 'individual')
              ? effect.leaderAgentId
              : selectCommander(state, effect.factionId);
          const whArmyId = whLeaderId
            ? raiseWarhostForce(state, effect.factionId, whLeaderId, whStrength, tick)
            : null;

          // Fallback (no force raised): sour the faction's existing rival relations.
          let whSentimentShifted = 0;
          if (!whArmyId) {
            const whRivals = state.graph.getOutgoingEdges(effect.factionId, 'relates_to')
              .filter(rel => ((rel.properties?.sentiment as number | undefined) ?? 0) < 0);
            for (const rel of whRivals) {
              const prev = (rel.properties.sentiment as number | undefined) ?? 0;
              rel.properties.sentiment = Math.max(FACTION_WAR_SENTIMENT_FLOOR, prev + WARHOST_FALLBACK_SENTIMENT_SHIFT);
              whSentimentShifted++;
            }
          }

          mutationSummary.touchedWorld = true;
          mutationSummary.touchedStructure = true;
          touchWorld(runtime);
          touchStructure(runtime);

          const whEvent: TickEvent = {
            id: `signature_warhost_${encounterId}_${reaction.id}_${i}_${tick}`,
            tick,
            type: 'narrative',
            message: `${whFaction.name} musters for war.`,
            significance: FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.declare_war,
            actorId: actorAgentId,
          };
          nextTickEvents = [...nextTickEvents, whEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, whEvent);

          emitTrace({
            tick, category: 'ascendant.signature.warhost', agentId: actorAgentId,
            factionId: effect.factionId, sphere: whSphere ?? 'none', sphereScore: whScore,
            multiplier: whMult, strength: whStrength,
            forceMode: whArmyId ? 'army' : 'sentiment_fallback',
            armyId: whArmyId ?? undefined, leaderId: whLeaderId ?? undefined,
            sentimentShiftedRelations: whSentimentShifted, success: true,
            summary: `signature_warhost[${i}]: ${whFaction.name} mobilized (strength ${whStrength.toFixed(1)}, ${whArmyId ? `force ${whArmyId}` : `${whSentimentShifted} rival relation(s) soured`})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'signature_warhost',
            effectDetail: { factionId: effect.factionId, strength: whStrength, forceMode: whArmyId ? 'army' : 'sentiment_fallback', armyId: whArmyId ?? null },
            success: true, effectiveTargetId: effect.factionId, effectiveTargetKind: 'faction',
            summary: `signature_warhost[${i}]: ${whFaction.name} mobilized`,
          });
        } catch (whErr) {
          // Fail-soft (NFP #4): resolver-boundary catch — a warhost failure is non-fatal.
          emitTrace({
            tick, category: 'ascendant.signature.warhost', agentId: actorAgentId,
            factionId: effect.factionId, success: false,
            failReason: whErr instanceof Error ? whErr.message : 'unknown_error',
            summary: `signature_warhost[${i}] errored: ${whErr instanceof Error ? whErr.message : 'unknown'}`,
          });
        }
        break;
      }

      // ─── Reach signature: Veil / Rend the Gate (THR-551) ───────────────────
      case 'sphere_influence_amplify': {
        try {
          // Resolve the rift's anchor location and its hex coords.
          const riftLoc = state.graph.getNode(effect.locationId);
          const riftFailReason = !riftLoc
            ? 'location_missing'
            : riftLoc.type !== 'location'
              ? 'not_a_location'
              : !actorAgentId
                ? 'no_owner'
                : undefined;
          const riftCol = riftLoc?.properties.hexCol;
          const riftRow = riftLoc?.properties.hexRow;
          const coordsOk = typeof riftCol === 'number' && typeof riftRow === 'number';
          if (!riftLoc || riftFailReason || !coordsOk) {
            const fr = riftFailReason ?? 'location_no_hex';
            emitTrace({
              tick, category: 'ascendant.signature.rift', agentId: actorAgentId,
              locationId: effect.locationId, success: false, failReason: fr,
              summary: `sphere_influence_amplify[${i}] skipped: ${fr}`,
            });
            emitTrace({
              tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'sphere_influence_amplify', effectDetail: { locationId: effect.locationId },
              success: false, failReason: fr,
              effectiveTargetId: effect.locationId, effectiveTargetKind: 'location',
              summary: `sphere_influence_amplify[${i}] skipped: ${fr}`,
            });
            break;
          }

          // Magnitude, cost, AND leak chance scale with the actor's primary-sphere
          // power (THR-548). The downside scales with the upside — individualization.
          const riftActor = state.graph.getNode(actorAgentId!);
          const riftPrimary = getAscendantPrimarySphere(state.graph, actorAgentId!);
          const riftScore = riftPrimary
            ? ((riftActor?.properties.sphereAffinity as { scores?: Record<string, number> } | undefined)?.scores?.[riftPrimary] ?? 0)
            : 0;
          const riftMult = spherePowerMultiplier(riftScore);
          const riftMagnitude = scaledEffect(effect.perTick ?? RIFT_INFLUENCE_PER_TICK, riftMult);
          const riftCost = scaledCost(RIFT_PERTICK_COST, riftMult);
          const riftLeakChance = Math.min(1, RIFT_LEAK_CHANCE * riftMult);
          const riftCap = Math.min(RIFT_INFLUENCE_CAP, MAX_SPHERE_SCORE);

          // Deterministic id (no counter) — same shape as signature_warhost.
          const riftEffectId = `rift_${encounterId}_${reaction.id}_${i}_${tick}`;
          const riftEffect: ControlEffect = {
            effectId: riftEffectId,
            templateId: encounterId,
            ownerId: actorAgentId!,
            targetHexCol: riftCol as number,
            targetHexRow: riftRow as number,
            targetNodeId: effect.locationId,
            establishedTick: tick,
            ritualEssenceInvested: action?.essencePaid ?? 0,
            perTickCost: { [effect.sphere]: riftCost },
            perTickMutations: [],
            perTickGraphOps: [],
            perTickSphereInfluence: { sphere: effect.sphere, magnitude: riftMagnitude, cap: riftCap },
            perTickLeak: {
              chance: riftLeakChance,
              corruption: RIFT_LEAK_CORRUPTION,
              entropyPressure: RIFT_LEAK_ENTROPY_PRESSURE,
            },
            active: true,
            ticksActive: 0,
            narrativeTemplates: {
              established: `A rift tears open at ${riftLoc.name}, flooding the land with ${effect.sphere}.`,
              active: `The ${effect.sphere} rift at ${riftLoc.name} thrums, widening its hold.`,
              lapsed: `The rift at ${riftLoc.name} seals, its borrowed power draining away.`,
            },
          };
          nextControlEffects.push(riftEffect);

          mutationSummary.touchedWorld = true;
          mutationSummary.touchedStructure = true;
          touchWorld(runtime);
          touchStructure(runtime);

          const riftEvent: TickEvent = {
            id: `sphere_influence_amplify_${encounterId}_${reaction.id}_${i}_${tick}`,
            tick,
            type: 'narrative',
            message: `A rift opens at ${riftLoc.name}, strengthening ${effect.sphere}.`,
            significance: RIFT_ESTABLISHED_SIGNIFICANCE,
            actorId: actorAgentId,
          };
          nextTickEvents = [...nextTickEvents, riftEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, riftEvent);

          emitTrace({
            tick, category: 'ascendant.signature.rift', agentId: actorAgentId,
            locationId: effect.locationId, effectId: riftEffectId,
            sphere: effect.sphere, primarySphere: riftPrimary ?? 'none', sphereScore: riftScore,
            multiplier: riftMult, magnitude: riftMagnitude, perTickCost: riftCost,
            leakChance: riftLeakChance, cap: riftCap, success: true,
            summary: `sphere_influence_amplify[${i}]: rift on ${riftLoc.name} (mag ${riftMagnitude.toFixed(2)}, cost ${riftCost.toFixed(2)}, leak ${(riftLeakChance * 100).toFixed(1)}%)`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'sphere_influence_amplify',
            effectDetail: { locationId: effect.locationId, sphere: effect.sphere, magnitude: riftMagnitude, effectId: riftEffectId },
            success: true, effectiveTargetId: effect.locationId, effectiveTargetKind: 'location',
            summary: `sphere_influence_amplify[${i}]: rift established on ${riftLoc.name}`,
          });
        } catch (riftErr) {
          // Fail-soft (NFP #4): resolver-boundary catch — a rift failure is non-fatal.
          emitTrace({
            tick, category: 'ascendant.signature.rift', agentId: actorAgentId,
            locationId: effect.locationId, success: false,
            failReason: riftErr instanceof Error ? riftErr.message : 'unknown_error',
            summary: `sphere_influence_amplify[${i}] errored: ${riftErr instanceof Error ? riftErr.message : 'unknown'}`,
          });
        }
        break;
      }

      // ─── Reach signature: Stone / The Great Work (THR-552) ─────────────────
      case 'spawn_unique_location': {
        try {
          // Dedup by uniqueTag — only one Great Work with this tag exists per run.
          // A second cast with the same tag is a no-op (§3.10), so the effect is
          // idempotent regardless of how many times its card is played.
          const gwExisting = state.graph.getNodesByType('location')
            .find(n => n.properties.uniqueTag === effect.uniqueTag);
          if (gwExisting) {
            emitTrace({
              tick, category: 'ascendant.signature.unique_location', agentId: actorAgentId,
              locationId: gwExisting.id, uniqueTag: effect.uniqueTag, success: false,
              failReason: 'duplicate_tag',
              summary: `spawn_unique_location[${i}] no-op: "${effect.uniqueTag}" already exists as ${gwExisting.id}`,
            });
            emitTrace({
              tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'spawn_unique_location', effectDetail: { uniqueTag: effect.uniqueTag, existingId: gwExisting.id },
              success: false, failReason: 'duplicate_tag',
              effectiveTargetId: gwExisting.id, effectiveTargetKind: 'location',
              summary: `spawn_unique_location[${i}] no-op: "${effect.uniqueTag}" already exists`,
            });
            break;
          }

          // Resolve placement: explicit hex > nearAgentId's hex > actor's hex.
          const resolveAgentHexCoords = (agentId: string | undefined): { col: number; row: number } | null => {
            if (!agentId) return null;
            const locEdges = state.graph.getOutgoingEdges(agentId, 'located_at');
            if (locEdges.length === 0) return null;
            return resolveLocationToHex(state.graph, locEdges[0].target);
          };
          const gwHex = effect.hex
            ? { col: effect.hex.col, row: effect.hex.row }
            : (resolveAgentHexCoords(effect.nearAgentId) ?? resolveAgentHexCoords(actorAgentId));
          if (!gwHex) {
            const fr = 'no_hex';
            emitTrace({
              tick, category: 'ascendant.signature.unique_location', agentId: actorAgentId,
              locationId: '', uniqueTag: effect.uniqueTag, success: false, failReason: fr,
              summary: `spawn_unique_location[${i}] skipped: ${fr}`,
            });
            emitTrace({
              tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'spawn_unique_location', effectDetail: { uniqueTag: effect.uniqueTag },
              success: false, failReason: fr,
              summary: `spawn_unique_location[${i}] skipped: ${fr}`,
            });
            break;
          }

          // Mint the unique location node (NOT a new node type — a `location` flagged
          // `unique`). A `controls` edge from the actor models ownership as a graph
          // edge, not a property (load-bearing decision).
          const gwName = effect.nameOverride ?? `The Great Work (${effect.subtype})`;
          const gwLocationId = `unique_location_${encounterId}_${reaction.id}_${i}_${tick}`;
          state.graph.addNode({
            id: gwLocationId,
            type: 'location',
            name: gwName,
            properties: {
              hexCol: gwHex.col,
              hexRow: gwHex.row,
              locationSubtype: effect.subtype,
              locationType: effect.subtype,
              unique: true,
              uniqueTag: effect.uniqueTag,
              generatedBy: 'spawn_unique_location',
              sourceEncounterId: encounterId,
              spawnedAtTick: tick,
            },
          });
          if (actorAgentId) {
            // THR-1297: this was agent ownership riding `controls` with no flag to
            // distinguish it from faction territory — the agent MADE this place, so it
            // is theirs, not merely under their jurisdiction. Migrated to the holdings
            // writer, which mints the `owns` edge and the bearer-side face together.
            // `via: 'creation'` because a great work is owned by having been built.
            grantHolding(
              state.graph,
              actorAgentId,
              gwLocationId,
              { tick, verb: 'create' },
              'creation',
            );
          }

          // Optional "extra-powerful artifact" — reuse the spawn_artifact tier path
          // (legendary → node `artifact_legendary` + `bonded_to`; else `artifact` +
          // `possesses`), bonding the forged relic to its maker. No new artifact
          // code: the exact node/edge shape spawn_artifact mints for an agent target.
          let gwArtifactId: string | undefined;
          if (effect.artifactForgeTier && actorAgentId) {
            const gwTier = effect.artifactForgeTier;
            const gwIsLegendary = gwTier === GREAT_WORK_ARTIFACT_TIER;
            gwArtifactId = `artifact_greatwork_${encounterId}_${reaction.id}_${i}_${tick}`;
            state.graph.addNode({
              id: gwArtifactId,
              type: gwIsLegendary ? 'artifact_legendary' : 'artifact',
              name: `${gwName} Relic`,
              properties: {
                tier: gwTier,
                tags: ['great_work'],
                sourceEncounterId: encounterId,
                spawnedAtTick: tick,
              },
            });
            state.graph.addEdge({
              id: `${gwIsLegendary ? 'bonded_to' : 'possesses'}_${actorAgentId}_${gwArtifactId}`,
              source: actorAgentId,
              target: gwArtifactId,
              type: gwIsLegendary ? 'bonded_to' : 'possesses',
              properties: { spawnedAtTick: tick, sourceEncounterId: encounterId },
            });
          }

          // A new location shifts spatial structure (distance matrix + encounter
          // scoring), so both version counters bump (mutated-in-place rule).
          mutationSummary.touchedWorld = true;
          mutationSummary.touchedStructure = true;
          touchWorld(runtime);
          touchStructure(runtime);

          const gwEvent: TickEvent = {
            id: `spawn_unique_location_${encounterId}_${reaction.id}_${i}_${tick}`,
            tick,
            type: 'narrative',
            message: `${gwName} rises, an enduring work of the age.`,
            significance: GREAT_WORK_ESTABLISHED_SIGNIFICANCE,
            actorId: actorAgentId,
          };
          nextTickEvents = [...nextTickEvents, gwEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, gwEvent);

          emitTrace({
            tick, category: 'ascendant.signature.unique_location', agentId: actorAgentId,
            locationId: gwLocationId, uniqueTag: effect.uniqueTag,
            subtype: effect.subtype, hexCol: gwHex.col, hexRow: gwHex.row,
            artifactId: gwArtifactId, artifactTier: effect.artifactForgeTier, success: true,
            summary: `spawn_unique_location[${i}]: "${gwName}" at (${gwHex.col}, ${gwHex.row})${gwArtifactId ? ` + ${effect.artifactForgeTier} relic` : ''}`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_unique_location',
            effectDetail: { locationId: gwLocationId, uniqueTag: effect.uniqueTag, subtype: effect.subtype, artifactId: gwArtifactId ?? null },
            success: true, effectiveTargetId: gwLocationId, effectiveTargetKind: 'location',
            summary: `spawn_unique_location[${i}]: "${gwName}" minted`,
          });
        } catch (gwErr) {
          // Fail-soft (NFP #4): resolver-boundary catch — a Great Work failure is non-fatal.
          emitTrace({
            tick, category: 'ascendant.signature.unique_location', agentId: actorAgentId,
            locationId: '', uniqueTag: effect.uniqueTag, success: false,
            failReason: gwErr instanceof Error ? gwErr.message : 'unknown_error',
            summary: `spawn_unique_location[${i}] errored: ${gwErr instanceof Error ? gwErr.message : 'unknown'}`,
          });
        }
        break;
      }

      // ─── Thread mutation effects (THR-116) ─────────────────────────────────

      case 'thread_strengthen': {
        const tsEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.mortalId);
        if (tsEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_strengthen', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
            reason: 'edge_missing',
            summary: `thread_strengthen[${i}] skipped: no thread edge ${effect.ascendantId} → ${effect.mortalId}`,
          });
          break;
        }
        const tsEdge = tsEdges[0];
        const tsBefore = (tsEdge.properties.strength as number | undefined) ?? 0;
        const tsDelta = effect.delta ?? THREAD_STRENGTHEN_DEFAULT;
        const tsAfter = Math.min(THREAD_STRENGTH_MAX, tsBefore + tsDelta);
        tsEdge.properties.strength = tsAfter;
        if (effect.reason) tsEdge.properties.lastReason = effect.reason;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_strengthen', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
          before: { strength: tsBefore, existed: true }, after: { strength: tsAfter, existed: true },
          delta: tsDelta, reason: effect.reason,
          summary: `thread_strengthen[${i}]: ${effect.ascendantId}→${effect.mortalId} ${tsBefore.toFixed(2)}→${tsAfter.toFixed(2)}`,
        });
        break;
      }

      case 'thread_weaken': {
        const twEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.mortalId);
        if (twEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_weaken', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
            reason: 'edge_missing',
            summary: `thread_weaken[${i}] skipped: no thread edge ${effect.ascendantId} → ${effect.mortalId}`,
          });
          break;
        }
        const twEdge = twEdges[0];
        const twBefore = (twEdge.properties.strength as number | undefined) ?? 0;
        const twDelta = effect.delta ?? THREAD_WEAKEN_DEFAULT;
        const twAfter = Math.max(THREAD_STRENGTH_MIN, twBefore - twDelta);
        twEdge.properties.strength = twAfter;
        if (effect.reason) twEdge.properties.lastReason = effect.reason;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_weaken', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
          before: { strength: twBefore, existed: true }, after: { strength: twAfter, existed: true },
          delta: twDelta, reason: effect.reason,
          summary: `thread_weaken[${i}]: ${effect.ascendantId}→${effect.mortalId} ${twBefore.toFixed(2)}→${twAfter.toFixed(2)}`,
        });
        break;
      }

      case 'thread_break': {
        const tbEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.mortalId);
        if (tbEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_break', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
            reason: 'edge_missing',
            summary: `thread_break[${i}] skipped: no thread edge ${effect.ascendantId} → ${effect.mortalId}`,
          });
          break;
        }
        const tbEdge = tbEdges[0];
        const tbStrengthBefore = (tbEdge.properties.strength as number | undefined) ?? 0;
        state.graph.removeEdge(tbEdge.id);
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        // Emit narrative event so the UI can surface the severance
        const tbEvent: import('../types/gameState').TickEvent = {
          id: `thread_break_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: effect.reason ?? 'A divine thread has been severed.',
          significance: 0.75,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, tbEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, tbEvent);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_break', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
          before: { strength: tbStrengthBefore, existed: true }, after: { existed: false },
          reason: effect.reason,
          summary: `thread_break[${i}]: severed thread ${effect.ascendantId}→${effect.mortalId}`,
        });
        break;
      }

      case 'thread_branch': {
        // Verify source thread edge exists
        const tbrSrcEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.sourceMortalId);
        if (tbrSrcEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
            reason: 'edge_missing',
            summary: `thread_branch[${i}] skipped: source thread ${effect.ascendantId}→${effect.sourceMortalId} not found`,
          });
          break;
        }
        // Verify new mortal node exists
        if (!state.graph.getNode(effect.newMortalId)) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
            reason: 'node_missing',
            summary: `thread_branch[${i}] skipped: new mortal node ${effect.newMortalId} not found`,
          });
          break;
        }
        const tbrStrength = effect.initialStrength ?? THREAD_BRANCH_INITIAL_STRENGTH;
        const tbrEdgeId = `thread_${effect.ascendantId}_${effect.newMortalId}_branch_${tick}`;
        try {
          state.graph.addEdge({
            id: tbrEdgeId,
            source: effect.ascendantId,
            target: effect.newMortalId,
            type: 'thread',
            properties: {
              strength: tbrStrength,
              branchedFromMortalId: effect.sourceMortalId,
              branchedAtTick: tick,
              reason: effect.reason,
            },
          });
        } catch {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
            reason: 'duplicate_edge',
            summary: `thread_branch[${i}] skipped: edge ${tbrEdgeId} already exists`,
          });
          break;
        }
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
          before: { existed: false }, after: { strength: tbrStrength, existed: true },
          reason: effect.reason,
          summary: `thread_branch[${i}]: ${effect.ascendantId}→${effect.newMortalId} (branched from ${effect.sourceMortalId}, strength ${tbrStrength.toFixed(2)})`,
        });
        break;
      }

      case 'grant_aspect': {
        // Resolve the mortal (encounter actor by default) and ascendant (the
        // mortal's thread source by default). Grant is idempotent.
        const gaMortalId = effect.mortalId ?? actorAgentId;
        if (!gaMortalId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'grant_aspect', effectDetail: { reason: 'no_mortal' },
            success: false, failReason: 'no_mortal',
            summary: `grant_aspect[${i}] skipped: no mortal id`,
          });
          break;
        }
        const gaResult = grantAspect(
          state.graph,
          { mortalId: gaMortalId, tick, originEncounterId: encounterId, ascendantId: effect.ascendantId, reason: effect.reason },
          runtime,
        );
        if (gaResult.granted) {
          mutationSummary.touchedWorld = true;
          const gaMortal = state.graph.getNode(gaMortalId);
          const gaMortalName = gaMortal?.name ?? 'A mortal';
          const gaAscendant = gaResult.ascendantId ? state.graph.getNode(gaResult.ascendantId) : undefined;
          const gaSphere = (((gaAscendant?.properties.sphereAlignment as { primary?: SphereName } | undefined)?.primary)
            ?? 'gold') as SphereName;
          const gaProse = ASPECT_CHRONICLE_PROSE.replace(/\{name\}/g, gaMortalName);

          const gaEvent: TickEvent = {
            id: `aspect_attained_${gaMortalId}_${tick}`,
            tick,
            type: 'narrative',
            message: `${gaMortalName} has become an aspect of the god.`,
            significance: 0.95,
            actorId: gaMortalId,
            notification: { channel: 'toast' },
          };
          nextTickEvents = [...nextTickEvents, gaEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, gaEvent);

          const gaChronicle: ChronicleEntry = {
            id: `aspect_attained_chronicle_${gaMortalId}_${tick}`,
            tier: 'chronicle',
            title: ASPECT_CHRONICLE_TITLE,
            prose: gaProse,
            promptContext: { actors: [gaMortalId], location: '', sphere: gaSphere, mood: 'mythic' },
            tick,
          };
          nextChronicleEntries = [...(nextChronicleEntries ?? state.chronicleEntries ?? []), gaChronicle];

          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'grant_aspect',
            effectDetail: { ascendantId: gaResult.ascendantId, mortalId: gaMortalId, edgeId: gaResult.edgeId },
            success: true, effectiveTargetId: gaMortalId, effectiveTargetKind: 'agent',
            summary: `grant_aspect[${i}]: ${gaResult.ascendantId} → ${gaMortalId} (aspect created)`,
          });
        } else {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'grant_aspect',
            effectDetail: { ascendantId: gaResult.ascendantId, mortalId: gaMortalId, reason: gaResult.reason },
            success: false, failReason: gaResult.reason,
            summary: `grant_aspect[${i}] no-op: ${gaResult.reason} (${gaMortalId})`,
          });
        }
        break;
      }

      case 'unlock_action': {
        const current = nextUnlockedActionIds ?? state.unlockedActionIds ?? [];
        if (current.includes(effect.actionId)) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'unlock_action',
            effectDetail: { actionId: effect.actionId, revealStyle: effect.revealStyle ?? 'card_flight' },
            success: true, effectiveTargetId: effect.actionId, effectiveTargetKind: 'actor_fallback',
            summary: `unlock_action[${i}] no-op: ${effect.actionId} already unlocked`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }
        // Fail-soft: an unknown actionId is pushed harmlessly — no template matches,
        // so isActionRevealed never reveals a non-existent card. (THR-500 §3.8)
        nextUnlockedActionIds = [...current, effect.actionId];
        mutationSummary.touchedWorld = true;
        emitTrace({
          tick, category: 'action.unlock.granted', turn: tick,
          actionId: effect.actionId, via: 'beat',
          summary: `action.unlock.granted: ${effect.actionId} (${effect.revealStyle ?? 'card_flight'})`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'unlock_action',
          effectDetail: { actionId: effect.actionId, revealStyle: effect.revealStyle ?? 'card_flight' },
          success: true, effectiveTargetId: effect.actionId, effectiveTargetKind: 'actor_fallback',
          summary: `unlock_action[${i}]: granted ${effect.actionId}`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        break;
      }

      case 'archetype_drift_register': {
        const resolvedAgentId = effect.targetAgentId
          ?? (target.kind === 'agent' ? target.id : actorAgentId);
        // THR-559: canonicalize the authored axis id (a bare reach or the
        // `${reach}_axis` id both resolve to the canonical drift-store key) so
        // authored effects match the drift entries written by the choice pipeline.
        const axisId = reachToAxisId(effect.axisId);

        if (!resolvedAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'archetype_drift_register',
            effectDetail: { axisId: effect.axisId, threshold: effect.threshold },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `archetype_drift_register[${i}] skipped: no actorId`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }

        const driftEntry = (state.archetypeDrift ?? []).find(
          entry => entry.agentId === resolvedAgentId && entry.axisId === axisId,
        );
        if (!driftEntry) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'archetype_drift_register',
            effectDetail: { axisId: effect.axisId, threshold: effect.threshold, targetId: resolvedAgentId },
            success: false, failReason: 'drift_entry_missing',
            effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
            summary: `archetype_drift_register[${i}] skipped: no drift entry for axis '${effect.axisId}'`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }

        const thresholdValue = effect.threshold === 'soft'
          ? DRIFT_THRESHOLD_SOFT
          : effect.threshold === 'banner'
            ? DRIFT_THRESHOLD_BANNER
            : DRIFT_THRESHOLD_BECOMING;
        const magnitude = Math.abs(driftEntry.toPosition);
        if (magnitude < thresholdValue) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'archetype_drift_register',
            effectDetail: { axisId: effect.axisId, threshold: effect.threshold, targetId: resolvedAgentId, magnitude },
            success: false, failReason: 'threshold_not_held',
            effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
            summary: `archetype_drift_register[${i}] skipped: |${driftEntry.toPosition.toFixed(2)}| < ${thresholdValue} on '${effect.axisId}'`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }

        const pole = driftEntry.toPosition >= 0 ? 'virtue' : 'flaw';
        const event: TickEvent = {
          id: `drift_register_${reaction.id}_${tick}_${nextRecentEvents.length}`,
          tick,
          type: 'narrative',
          message: `Drift registered: ${resolvedAgentId} leans ${pole} on '${effect.axisId}' (${effect.threshold}).`,
          significance: ARCHETYPE_DRIFT_REGISTER_SIGNIFICANCE,
          actorId: resolvedAgentId,
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
        nextTickEvents = [...nextTickEvents, event];

        emitTrace({
          tick, category: 'drift_threshold_crossed', agentId: resolvedAgentId,
          axisId,
          fromPosition: driftEntry.fromPosition,
          toPosition: driftEntry.toPosition,
          thresholdCrossed: effect.threshold,
          pole,
          summary: `drift_threshold_crossed: ${resolvedAgentId} ${axisId} ${effect.threshold} (${pole})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'archetype_drift_register',
          effectDetail: { axisId: effect.axisId, threshold: effect.threshold, targetId: resolvedAgentId, magnitude, pole },
          success: true,
          effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
          summary: `archetype_drift_register[${i}]: ${resolvedAgentId} ${effect.threshold} on '${effect.axisId}' (${pole})`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        break;
      }

      case 'axiological_mark_apply': {
        // THR-529: a rare, permanent shift to the actor's standing moral baseline on one axis.
        // Unlike archetype_drift_register (surfaces a held *temporary* drift band) this moves the
        // baseline itself — the AxiologicalProfile value origin vignettes seed at birth — so the
        // mark persists where decaying drift would relax back. Author-gated; rare by content discipline.
        const resolvedAgentId = effect.targetAgentId
          ?? (target.kind === 'agent' ? target.id : actorAgentId);
        if (!resolvedAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'axiological_mark_apply',
            effectDetail: { reach: effect.reach, signedMagnitude: effect.signedMagnitude },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `axiological_mark_apply[${i}] skipped: no actorId`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }
        const markNode = state.graph.getNode(resolvedAgentId);
        if (!markNode) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'axiological_mark_apply',
            effectDetail: { reach: effect.reach, targetId: resolvedAgentId },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
            summary: `axiological_mark_apply[${i}] skipped: target node not found (${resolvedAgentId})`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }
        const markAxis = getAxisByReach(effect.reach);
        const markValuePair = markAxis.valuePair;
        // Clamp the authored shift to the per-mark cap so one moment can't override a lifetime.
        const clampedMag = Math.max(
          -FORMATIVE_MARK_MAX_MAGNITUDE,
          Math.min(FORMATIVE_MARK_MAX_MAGNITUDE, effect.signedMagnitude),
        );
        const markProfile = markNode.properties.axiologicalProfile as AxiologicalProfile | undefined;
        const previousBaseline = markProfile?.[markValuePair] ?? 0;
        const newBaseline = Math.max(-1, Math.min(1, previousBaseline + clampedMag));
        // Move the baseline in place (init a profile if the agent was born neutral). Same in-place
        // node-property mutation pattern as effectTick.tickAxiologicalDrift; touchedWorld bumps the
        // world version so sheet/selectors recompute.
        if (markProfile) {
          markProfile[markValuePair] = newBaseline;
        } else {
          markNode.properties.axiologicalProfile = { [markValuePair]: newBaseline } as AxiologicalProfile;
        }
        mutationSummary.touchedWorld = true;

        // "Becoming" chronicle beat — a permanent change is a defining moment, surfaced low-noise.
        const markName = (markNode.properties?.name as string | undefined) ?? resolvedAgentId;
        const poleWord = clampedMag >= 0 ? markAxis.virtue.word : markAxis.vice.word;
        const markEvent: TickEvent = {
          id: `formative_mark_${reaction.id}_${tick}_${nextRecentEvents.length}`,
          tick,
          type: 'narrative',
          message: `A defining moment marks ${markName}: lastingly more ${poleWord}.`,
          significance: FORMATIVE_MARK_EVENT_SIGNIFICANCE,
          actorId: resolvedAgentId,
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, markEvent);
        nextTickEvents = [...nextTickEvents, markEvent];

        emitTrace({
          tick, category: 'axiological_mark_applied', agentId: resolvedAgentId,
          reach: effect.reach, valuePair: markValuePair, signedMagnitude: clampedMag,
          previousBaseline, newBaseline, encounterId, reactionId: reaction.id,
          summary: `axiological_mark_applied: ${resolvedAgentId} ${markValuePair} ${clampedMag >= 0 ? '+' : ''}${clampedMag.toFixed(2)} → baseline ${newBaseline.toFixed(2)} (${poleWord})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'axiological_mark_apply',
          effectDetail: { reach: effect.reach, valuePair: markValuePair, signedMagnitude: clampedMag, previousBaseline, newBaseline, targetId: resolvedAgentId },
          success: true,
          effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
          summary: `axiological_mark_apply[${i}]: ${resolvedAgentId} ${markValuePair} → ${newBaseline.toFixed(2)}`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        break;
      }

      case 'secret_discovery': {
        // Explicit effect-level secret discovery (distinct from template-level secretDiscovery flag)
        const sdActorId = actorAgentId;
        const sdTargetId = action?.targetId;
        if (!sdActorId || !sdTargetId) {
          emitTrace({
            tick, category: 'secret_discovered', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'secret_discovery', success: false, failReason: 'missing_actor_or_target',
            summary: `secret_discovery[${i}] skipped: missing actor or target`,
          });
          break;
        }
        const sdTargetNode = state.graph.getNode(sdTargetId);
        if (!sdTargetNode) {
          emitTrace({
            tick, category: 'secret_discovered', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'secret_discovery', success: false, failReason: 'target_node_missing', targetId: sdTargetId,
            summary: `secret_discovery[${i}] skipped: target node ${sdTargetId} not found`,
          });
          break;
        }
        try {
          const sdSeed = (state.seed ^ tick * 53) >>> 0;
          const sdRng = mulberry32(sdSeed);
          const sdSecret = generateSecret(sdTargetNode, state.graph, effect.source, sdRng, effect.magnitudeBonus);
          const sdCreated = createSecretEdge(sdActorId, sdTargetId, sdSecret, effect.source, tick, state.graph);
          if (sdCreated) {
            touchWorld(runtime);
            mutationSummary.touchedWorld = true;
            emitTrace({
              tick, category: 'secret_discovered', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'secret_discovery', discovererId: sdActorId, subjectId: sdTargetId,
              secretType: sdCreated.secretType, magnitude: sdCreated.magnitude, source: sdCreated.source,
              summary: `secret_discovery[${i}]: ${sdActorId} learned (${sdCreated.secretType}) about ${sdTargetId} via ${effect.source} (mag ${sdCreated.magnitude.toFixed(2)})`,
            });
          }
        } catch {
          // fail-soft: secret discovery must not block encounter resolution
        }
        break;
      }

      case 'favor_creation': {
        // Explicit effect-level favor creation (distinct from template-level favorGeneration flag)
        const fcActorId = actorAgentId;
        // THR-1175 — the debtor is whoever the author named, and only falls back
        // to the action target for content written before `debtorAgentId` existed.
        // The fallback is the defect this ticket is about: `action.targetId` is a
        // person only when the encounter happens to target one, and The Grateful
        // Kin targets a location, so the fallback minted a favour owed by a town.
        // It is kept (NFP #6, additive) rather than removed, because removing it
        // would silently drop favours from shipped content instead of refusing
        // them loudly — but it is now guarded below and gated at authoring time.
        const fcTargetId = effect.debtorAgentId ?? action?.targetId;
        if (!fcActorId || !fcTargetId) {
          emitTrace({
            tick, category: 'favor_created', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'favor_creation', success: false, failReason: 'missing_actor_or_target',
            summary: `favor_creation[${i}] skipped: missing actor or target`,
          });
          break;
        }
        try {
          const [magMin, magMax] = effect.magnitudeRange;
          const fcSeed = (state.seed ^ tick * 61) >>> 0;
          const fcRng = mulberry32(fcSeed);
          const fcMagnitude = magMin + fcRng() * (magMax - magMin);
          // debtor = target (was helped), creditor = actor (did the helping)
          const fcCreated = createFavorEdge(fcTargetId, fcActorId, fcMagnitude, effect.context, tick, state.graph);
          if (fcCreated) {
            touchWorld(runtime);
            mutationSummary.touchedWorld = true;
            emitTrace({
              tick, category: 'favor_created', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'favor_creation', debtorId: fcTargetId, creditorId: fcActorId,
              magnitude: fcMagnitude, context: effect.context,
              summary: `favor_creation[${i}]: ${fcTargetId} owes ${fcActorId} (${effect.context}, mag ${fcMagnitude.toFixed(2)})`,
            });
          } else {
            // THR-1175 — `createFavorEdge` returns false for two very different
            // reasons: the debtor is at the favour cap (ordinary, expected), or
            // the graph layer refused the endpoints (a location or faction
            // debtor, which no consumer can ever collect). Until now both were
            // dropped on the floor by a bare `if (fcCreated)`, so the *loud*
            // refusal this ticket added would have been silent one frame later
            // at the only surface a reader looks at. The edge layer emits its
            // own diagnosis; this trace records that an authored consequence
            // did not happen, which is the aftermath's business.
            const fcDebtorNode = state.graph.getNode(fcTargetId);
            emitTrace({
              tick, category: 'favor_created', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'favor_creation', success: false,
              failReason: 'edge_not_created',
              debtorId: fcTargetId, creditorId: fcActorId,
              debtorNodeType: fcDebtorNode?.type,
              debtorActorType: typeof fcDebtorNode?.properties.actorType === 'string'
                ? fcDebtorNode.properties.actorType
                : undefined,
              debtorDeclared: effect.debtorAgentId != null,
              summary:
                `favor_creation[${i}] produced no edge: ${fcTargetId} `
                + `(${fcDebtorNode ? `${fcDebtorNode.type}${typeof fcDebtorNode.properties.actorType === 'string' ? `/${fcDebtorNode.properties.actorType}` : ''}` : 'missing node'}) `
                + `owes nothing to ${fcActorId} — refused endpoints or favour cap.`,
            });
          }
        } catch {
          // fail-soft
        }
        break;
      }

      case 'spawn_clue': {
        // Ruins layer — create a knows_clue_of edge via Narrative Gravity (THR-150)
        if (!actorAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_clue', effectDetail: { targetRuinId: effect.targetRuinId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `spawn_clue[${i}] skipped: no actorId`,
          });
          break;
        }
        try {
          const scSeed = (state.seed ^ tick * 79) >>> 0;
          const scRng = mulberry32(scSeed);
          // Resolve '$nearest_ruin' placeholder to an actual ruin node ID
          const resolvedRuinId = effect.targetRuinId === '$nearest_ruin'
            ? findAnyRuinId(state.graph, scRng)
            : effect.targetRuinId;
          if (!resolvedRuinId) break; // no ruins in world yet — fail-soft
          const recipientId = spawnClueFromEvent({
            actorId: actorAgentId,
            targetRuinId: resolvedRuinId,
            source: effect.source,
            precision: effect.precision,
            state,
            rng: scRng,
          });
          if (recipientId) {
            touchWorld(runtime);
            mutationSummary.touchedWorld = true;
          }
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_clue',
            effectDetail: { targetRuinId: resolvedRuinId, source: effect.source, recipientId: recipientId ?? 'suppressed' },
            success: recipientId !== null,
            failReason: recipientId === null ? 'clue_suppressed' : undefined,
            effectiveTargetId: actorAgentId,
            effectiveTargetKind: 'actor_fallback',
            summary: `spawn_clue[${i}]: ruin=${resolvedRuinId} → recipient=${recipientId ?? 'suppressed'}`,
          });
        } catch {
          // fail-soft: clue spawn failure is non-fatal
        }
        break;
      }

      case 'bond_change': {
        const withId = effect.withAgentId;
        if (!actorAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'bond_change', effectDetail: { withAgentId: withId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `bond_change[${i}] skipped: no actorId`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }
        // A sentinel the bind pass could not resolve, a missing/non-actor node, or a
        // self-bond all no-op down the fail-soft path (plan §Fail-soft).
        const unresolvedSentinel =
          withId === AFTERMATH_ACTOR_SENTINEL ||
          withId === AFTERMATH_TARGET_SENTINEL ||
          withId.startsWith(AFTERMATH_CAST_SENTINEL_PREFIX) ||
          withId.startsWith(AFTERMATH_CAST_SENTINEL_LEGACY_PREFIX);
        const actorNode = state.graph.getNode(actorAgentId);
        const withNode = unresolvedSentinel ? undefined : state.graph.getNode(withId);
        if (!actorNode || actorNode.type !== 'actor' || !withNode || withNode.type !== 'actor' || withId === actorAgentId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'bond_change', effectDetail: { withAgentId: withId },
            success: false,
            failReason: unresolvedSentinel ? 'unresolved_sentinel' : (withId === actorAgentId ? 'self_bond' : 'non_agent_target'),
            effectiveTargetId: withId, effectiveTargetKind: 'agent',
            summary: `bond_change[${i}] skipped: ${unresolvedSentinel ? 'unresolved sentinel' : (withId === actorAgentId ? 'self-bond' : 'non-agent target')} (${withId})`,
          } as unknown as Parameters<typeof emitTrace>[0]);
          break;
        }
        const reciprocal = effect.reciprocal !== false;
        const forward = applyBondEdge(state.graph, actorAgentId, withId, effect.sentimentDelta, effect.trustDelta);
        if (reciprocal) {
          applyBondEdge(state.graph, withId, actorAgentId, effect.sentimentDelta, effect.trustDelta);
        }
        touchWorld(runtime);
        mutationSummary.touchedWorld = true;
        emitTrace({
          tick, category: 'bond_change_applied', agentId: actorAgentId,
          actorId: actorAgentId, withAgentId: withId,
          sentimentBefore: forward.sentimentBefore, sentimentAfter: forward.sentimentAfter,
          created: forward.created, reciprocal,
          summary: `bond_change_applied[${i}]: ${actorAgentId} → ${withId} sentiment ${forward.sentimentBefore.toFixed(2)}→${forward.sentimentAfter.toFixed(2)}${forward.created ? ' (created)' : ''}${reciprocal ? ' (reciprocal)' : ''}`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'bond_change',
          effectDetail: {
            withAgentId: withId, sentimentDelta: effect.sentimentDelta, trustDelta: effect.trustDelta,
            reciprocal, created: forward.created, sentimentAfter: forward.sentimentAfter,
          },
          success: true,
          effectiveTargetId: withId, effectiveTargetKind: 'agent',
          summary: `bond_change[${i}]: ${actorAgentId} → ${withId} Δsentiment ${effect.sentimentDelta >= 0 ? '+' : ''}${effect.sentimentDelta}`,
        } as unknown as Parameters<typeof emitTrace>[0]);
        break;
      }

      case 'agent_relocation': {
        // THR-1142 — the first effect in the vocabulary that can send someone
        // somewhere. `travel` (default) writes an intent the decision phase
        // pursues; `instant` retargets `located_at` now, for scene logic.
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        const mode = effect.mode ?? 'travel';

        const failRelocation = (reason: string, detail: Record<string, unknown> = {}): void => {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'agent_relocation',
            effectDetail: { targetAgentId: resolvedId, mode, ...detail },
            success: false, failReason: reason,
            effectiveTargetId: resolvedId ?? '',
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `agent_relocation[${i}] skipped: ${reason}`,
          });
        };

        if (!resolvedId) { failRelocation('no_actor_id'); break; }
        const relocNode = state.graph.getNode(resolvedId);
        if (!relocNode || relocNode.type !== 'actor') { failRelocation('non_agent_target'); break; }

        // Seeded per (world seed, tick, effect site) — the `away` pick must be
        // reproducible from the same seed and never touch Math.random (NFP #3).
        const relocSalt = `${encounterId}_${reaction.id}_${i}_${resolvedId}`;
        let relocSeed = state.seed;
        for (let c = 0; c < relocSalt.length; c++) relocSeed = (relocSeed ^ relocSalt.charCodeAt(c)) >>> 0;
        relocSeed = (relocSeed + tick * 31337) >>> 0;
        const relocRng = mulberry32(relocSeed);

        const destination = resolveRelocationDestination(
          state.graph, resolvedId, effect.destination, relocRng,
        );
        if (!destination) {
          failRelocation('destination_unresolvable', { destinationKind: effect.destination.kind });
          break;
        }

        if (mode === 'instant') {
          // Needs a location node to stand on — a bare hex has no `located_at`
          // target, so an instant move to one cannot be expressed in the
          // three-tier position model. Fail-soft rather than inventing a node.
          if (!destination.nodeId) {
            failRelocation('instant_requires_location', { destinationKind: effect.destination.kind });
            break;
          }
          rebindLocatedAt(state.graph, resolvedId, destination.nodeId, 'aftermath_located_at');
          if (effect.residence === 'set_destination') {
            // THR-822's write path: residence is *observed*, never stamped ahead
            // of the agent — and they are standing there now, so this records a
            // real arrival rather than manufacturing one.
            observeResidence(state.graph, resolvedId, tick);
          }
          touchWorld(runtime);
          touchStructure(runtime);
          mutationSummary.touchedWorld = true;
          mutationSummary.touchedStructure = true;
        } else {
          const ttl = effect.ttlTicks ?? RELOCATION_INTENT_TTL_TICKS;
          setRelocationIntent(state.graph, resolvedId, {
            destinationHex: destination.hex,
            destinationNodeId: destination.nodeId,
            expiresAtTick: tick + ttl,
            setAtTick: tick,
            source: 'aftermath',
            templateId: action?.templateId,
            stampResidenceOnArrival: effect.residence === 'set_destination',
          });
          touchWorld(runtime);
          mutationSummary.touchedWorld = true;
        }

        emitTrace({
          tick, category: 'aftermath_agent_relocation', agentId: resolvedId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          destination: destination.label,
          destinationNodeId: destination.nodeId,
          destinationHex: destination.hex,
          mode,
          expiresAtTick: mode === 'travel' ? tick + (effect.ttlTicks ?? RELOCATION_INTENT_TTL_TICKS) : undefined,
          templateId: action?.templateId,
          summary: mode === 'instant'
            ? `agent_relocation[${i}]: ${relocNode.name ?? resolvedId} moves to ${destination.label} (instant)`
            : `agent_relocation[${i}]: ${relocNode.name ?? resolvedId} sets out for ${destination.label}`,
        });

        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'agent_relocation',
          effectDetail: {
            targetAgentId: resolvedId, mode,
            destination: destination.label,
            destinationNodeId: destination.nodeId,
            residence: effect.residence ?? 'unchanged',
          },
          success: true,
          effectiveTargetId: resolvedId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: `agent_relocation[${i}]: ${resolvedId} → ${destination.label} (${mode})`,
        });
        break;
      }

      case 'membership_change': {
        // THR-1144 — one person joins, leaves, or moves rank in a faction.
        // The effect's *target* is the person, so `factionId` names the faction
        // and the usual target resolution supplies the agent.
        const memberId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        const op = effect.op;

        const failMembership = (reason: string, detail: Record<string, unknown> = {}): void => {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'membership_change',
            effectDetail: { targetAgentId: memberId, factionId: effect.factionId, op, ...detail },
            success: false, failReason: reason,
            effectiveTargetId: memberId ?? '',
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `membership_change[${i}] skipped: ${reason}`,
          });
        };

        if (!memberId) { failMembership('no_actor_id'); break; }

        let result: MembershipChangeResult;
        if (op === 'join') {
          result = joinFaction(state.graph, memberId, effect.factionId, tick);
        } else if (op === 'leave') {
          result = leaveFaction(state.graph, memberId, effect.factionId);
        } else {
          // `rank_delta` without a delta is an authoring slip, not a world event.
          if (effect.rankDelta === undefined) { failMembership('no_rank_delta'); break; }
          result = adjustMemberRank(state.graph, memberId, effect.factionId, effect.rankDelta);
        }

        if (!result.changed) { failMembership(result.reason ?? 'no_change'); break; }

        touchWorld(runtime);
        mutationSummary.touchedWorld = true;

        const memberName = state.graph.getNode(memberId)?.name ?? memberId;
        // The *resolved* node id, never the authored one — content names the
        // faction definition (`'mercenary_company'`), which is not a node, so
        // looking the name up by the authored value put a raw slug into the
        // player-facing chronicle line. Caught in a CLI run.
        const factionNodeId = result.factionNodeId ?? effect.factionId;
        const factionName = state.graph.getNode(factionNodeId)?.name ?? factionNodeId;
        const summary = op === 'join'
          ? `membership_change[${i}]: ${memberName} joins ${factionName}`
          : op === 'leave'
            ? `membership_change[${i}]: ${memberName} leaves ${factionName}`
            : `membership_change[${i}]: ${memberName} rank in ${factionName} ${result.oldRank?.toFixed(2)} → ${result.newRank?.toFixed(2)}`;

        emitTrace({
          tick, category: 'aftermath_membership_change', agentId: memberId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          factionId: factionNodeId,
          op,
          oldRank: result.oldRank,
          newRank: result.newRank,
          role: result.role,
          templateId: action?.templateId,
          summary,
        });

        // A chronicle-visible arrival or departure, when the author asked for one.
        // Reuses the two event types the quest-driven join path already emits, so
        // notification routing and the faction anchor need no new case.
        if (effect.chronicle && op !== 'rank_delta') {
          const membershipEvent = {
            id: `aftermath_membership_${op}_${tick}_${encounterId}_${i}`,
            tick,
            type: op === 'join' ? 'faction_member_joined' : 'faction_rank_changed',
            message: op === 'join'
              ? `${memberName} has joined ${factionName}.`
              : `${memberName} has left ${factionName}.`,
            significance: 0.6,
            notification: { channel: 'toast', icon: 'faction' },
            actorId: memberId,
            factionId: factionNodeId,
          } as TickEvent;
          // Both feeds, as every other event-emitting effect here does.
          // `tickEvents` is per-tick and is gone next tick; `recentEvents` is the
          // rolling buffer the chronicle and notification surfaces actually read,
          // so a `chronicle: true` that skipped it would announce nothing.
          nextRecentEvents = appendRecentEvent(nextRecentEvents, membershipEvent);
          nextTickEvents = [...nextTickEvents, membershipEvent];
        }

        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'membership_change',
          effectDetail: {
            targetAgentId: memberId, factionId: factionNodeId, op,
            oldRank: result.oldRank, newRank: result.newRank, role: result.role,
            chronicle: effect.chronicle ?? false,
          },
          success: true,
          effectiveTargetId: memberId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary,
        });
        break;
      }

      case 'reward_draw': {
        // THR-1146 — a specific ending hands out a *random* matching prize.
        // The effect's target is the recipient, so the ordinary target
        // resolution supplies the agent and `pool` carries the recipe.
        const recipientId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;

        const failDraw = (reason: string): void => {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reward_draw',
            effectDetail: {
              targetAgentId: recipientId,
              categoryWeights: effect.pool.categoryWeights,
              tagFilters: effect.pool.tagFilters,
            },
            success: false, failReason: reason,
            effectiveTargetId: recipientId ?? '',
            effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
            summary: `reward_draw[${i}] skipped: ${reason}`,
          });
        };

        // No actor means no recipient and no seed key — there is nothing to draw
        // for, and nothing to draw it with.
        if (!recipientId || !action) { failDraw('no_actor_id'); break; }

        const draw = drawSeededReward(state.graph, {
          recipe: effect.pool,
          outcomeType: mapActionOutcomeToRewardOutcome(action.outcome),
          seed: state.seed,
          tick,
          actorId: action.actorId,
          templateId: action.templateId,
          recipientId,
          // THR-1241: the recipient's `reward_tier_bonus` reads here.
          overrideCtx: { graph: state.graph, effectStates: state.effectStates, persisted: state, tick },
        });

        // An empty pool is the THR-844 rot class reaching runtime: the fiction
        // promised a prize and the recipe matched nothing. `check:encounter`
        // fails this at authoring time, so a live one is worth a loud trace —
        // but never a throw (NFP #4).
        if (draw.poolSize === 0 || !draw.instantiation || !draw.drawnTemplateId) {
          emitTrace({
            tick, category: 'aftermath_reward_draw_empty', agentId: recipientId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            categoryWeights: effect.pool.categoryWeights as Readonly<Record<string, number>>,
            tagFilters: effect.pool.tagFilters,
            isBadOutcome: draw.isBadOutcome,
            recipientId,
            templateId: action.templateId,
            summary: `reward_draw[${i}]: pool empty — nothing matched `
              + `${Object.keys(effect.pool.categoryWeights).join('/')}`
              + `${effect.pool.tagFilters?.length ? ` ${effect.pool.tagFilters.join(' ')}` : ''}`,
          });
          failDraw(draw.poolSize === 0 ? 'empty_pool' : 'instantiate_failed');
          break;
        }

        touchWorld(runtime);
        mutationSummary.touchedWorld = true;

        const recipientName = state.graph.getNode(recipientId)?.name ?? recipientId;
        const prizeName = draw.instantiation.displayName || draw.templateName || draw.drawnTemplateId;
        const drawSummary = `reward_draw[${i}]: ${recipientName} `
          + `${draw.isBadOutcome ? 'suffered' : 'earned'} ${prizeName} `
          + `(T${draw.tier} ${draw.instantiation.category}, pool ${draw.poolSize})`;

        emitTrace({
          tick, category: 'aftermath_reward_draw', agentId: recipientId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          drawnTemplateId: draw.drawnTemplateId,
          instanceId: draw.instantiation.instanceId,
          templateName: draw.templateName ?? undefined,
          tier: draw.tier ?? undefined,
          attachmentCategory: draw.instantiation.category,
          poolSize: draw.poolSize,
          roll: draw.drawRoll ?? 0,
          isBadOutcome: draw.isBadOutcome,
          recipientId,
          templateId: action.templateId,
          summary: drawSummary,
        });

        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reward_draw',
          effectDetail: {
            targetAgentId: recipientId,
            categoryWeights: effect.pool.categoryWeights,
            tagFilters: effect.pool.tagFilters,
            drawnTemplateId: draw.drawnTemplateId,
            instanceId: draw.instantiation.instanceId,
            tier: draw.tier,
            attachmentCategory: draw.instantiation.category,
            poolSize: draw.poolSize,
            isBadOutcome: draw.isBadOutcome,
          },
          success: true,
          effectiveTargetId: recipientId,
          effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback',
          summary: drawSummary,
        });
        break;
      }
    }
  }

  const nextState: GameState = {
    ...state,
    tickEvents: nextTickEvents,
    recentEvents: nextRecentEvents,
    clearanceGateStates: touchedClearanceGateStates ? nextClearanceGateStates : state.clearanceGateStates,
    pendingEncounterSeeds: nextSeeds.length > 0
      ? [...(state.pendingEncounterSeeds ?? []), ...nextSeeds]
      : state.pendingEncounterSeeds,
    hiddenMarks: nextHiddenMarks.length > 0
      ? [...(state.hiddenMarks ?? []), ...nextHiddenMarks]
      : state.hiddenMarks,
    intelligenceRecords: nextIntelligenceRecords.length > 0
      ? [...(state.intelligenceRecords ?? []), ...nextIntelligenceRecords]
      : state.intelligenceRecords,
    emittedOmens: nextEmittedOmens !== undefined ? nextEmittedOmens : state.emittedOmens,
    plantedCompulsions: nextPlantedCompulsions !== undefined ? nextPlantedCompulsions : state.plantedCompulsions,
    chronicleEntries: nextChronicleEntries !== undefined ? nextChronicleEntries : state.chronicleEntries,
    unlockedActionIds: nextUnlockedActionIds !== undefined ? nextUnlockedActionIds : state.unlockedActionIds,
    controlEffects: nextControlEffects.length > 0
      ? [...(state.controlEffects ?? []), ...nextControlEffects]
      : state.controlEffects,
  };

  return { state: nextState, mutationSummary };
}
