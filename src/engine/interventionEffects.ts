/**
 * Intervention Effects Engine — applies world-wide effects for each of 8 intervention types.
 *
 * This is the core engine that actually modifies the graph when an intervention happens.
 * Each intervention type:
 * - Reads the target actor node
 * - Computes value drifts, trait effects, strategy overrides, or location boosts
 * - Adds a DivineInfluenceEntry to the actor's divineInfluences array
 * - Returns consequence message + effects summary
 * - Emits intervention_effect trace for the debug panel
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Adjust durations/magnitudes in intervention-feedback-content.ts
 * ═══════════════════════════════════════════════════════════════════
 */

import { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import type { DivineInfluenceEntry, InterventionType } from '../types/dream';
import { VALUE_PAIRS } from '../types/agent';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { SphereName } from '../types';
import type { AgendaTemplate } from '../data/agenda-content';
import { DIVINE_INFLUENCE_CONSTANTS, getConsequenceMessage } from '../data/intervention-feedback-content';
import { getAgendaConsequenceMessage, type AgendaConsequenceCategory } from '../data/agenda-consequence-templates';
import { SPHERE_VOCABULARY } from '../data/narrative-content';
import { DECAY_CONSTANTS, getCurrentStrength } from './decayCurve';

// ─── Type Definitions ────────────────────────────────────────────

export interface ApplyInterventionEffectsInput {
  graph: WorldGraph;
  interventionType: InterventionType;
  targetAgentId: string;
  sphere: SphereName;
  tick: number;
  seed: number;
  agenda?: AgendaTemplate;
}

export interface ApplyInterventionEffectsResult {
  success: boolean;
  consequenceMessage: string;
  effectsSummary: string[];
}

// ─── Value Pair Selection (Seeded PRNG) ──────────────────────────

// VALUE_PAIRS imported from types/agent.ts above

/**
 * Select N random value pairs using seeded selection.
 * Uses simple modulo: (seed + offset) % array.length
 */
function selectValuePairs(count: number, seed: number): ValuePair[] {
  const selected: ValuePair[] = [];
  for (let i = 0; i < count && i < VALUE_PAIRS.length; i++) {
    const idx = Math.abs(seed + i * 13337) % VALUE_PAIRS.length;
    selected.push(VALUE_PAIRS[idx]);
  }
  return selected;
}

// ─── Divine Influence Queries ────────────────────────────────────

/**
 * Read divineInfluences array from actor properties.
 * Returns empty array if not present or if actor doesn't exist.
 */
export function getDivineInfluences(
  graph: WorldGraph,
  actorId: string,
): DivineInfluenceEntry[] {
  const node = graph.getNode(actorId);
  if (!node) return [];
  const influences = (node.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];
  return influences;
}

/**
 * Add a divine influence to an actor's influence list.
 * Mutates the actor node's properties.
 */
function addDivineInfluence(
  graph: WorldGraph,
  actorId: string,
  influence: DivineInfluenceEntry,
): void {
  const node = graph.getNode(actorId);
  if (!node) return;
  const influences = getDivineInfluences(graph, actorId);
  influences.push(influence);
  graph.updateNode(actorId, {
    properties: { divineInfluences: influences },
  });
}

// ─── Value Overlay Builder ───────────────────────────────────────

/**
 * Build a temporary value overlay by applying all active divine influences.
 * Creates a copy; never mutates the original profile.
 * Clamps all values to [-1, 1].
 * Multiplies each drift by the influence's current decay strength.
 */
export function buildValueOverlay(
  baseProfile: AxiologicalProfile,
  influences: DivineInfluenceEntry[],
  currentTick: number = 0,
): AxiologicalProfile {
  const overlay: AxiologicalProfile = { ...baseProfile };

  for (const influence of influences) {
    // Compute current decay strength
    const strength = getCurrentStrength({
      initialStrength: influence.initialStrength,
      decayRate: influence.decayRate,
      minimumStrength: influence.minimumStrength,
      maxDuration: influence.maxDuration,
      tickApplied: influence.tickApplied,
    }, currentTick);

    if (strength <= 0) continue; // Expired

    if (influence.valueDrifts) {
      for (const [pair, drift] of Object.entries(influence.valueDrifts)) {
        const key = pair as ValuePair;
        overlay[key] = Math.max(-1, Math.min(1, overlay[key] + drift * strength));
      }
    }
  }

  return overlay;
}

// ─── Unique ID Generator ────────────────────────────────────────

let influenceIdCounter = 0;

function generateInfluenceId(): string {
  return `di_${Date.now()}_${influenceIdCounter++}`;
}

// ─── Value Direction Label (for consequence messages) ────────────

/**
 * Pick a direction label for a value pair.
 * Uses seed parity: even → left pole, odd → right pole.
 */
function getValueDirection(pair: ValuePair, seed: number): string {
  const polesMap: Record<ValuePair, [string, string]> = {
    mercy_ruthlessness: ['mercy', 'ruthlessness'],
    asceticism_extravagance: ['asceticism', 'extravagance'],
    honesty_cunning: ['honesty', 'cunning'],
    tradition_novelty: ['tradition', 'novelty'],
    loyalty_ambition: ['loyalty', 'ambition'],
    frankness_propriety: ['frankness', 'propriety'],
    humility_pride: ['humility', 'pride'],
    sacrifice_survival: ['sacrifice', 'survival'],
    stoicism_passion: ['stoicism', 'passion'],
    courage_prudence: ['courage', 'prudence'],
  };

  const [left, right] = polesMap[pair];
  return Math.abs(seed) % 2 === 0 ? left : right;
}

/**
 * Get a domain label for inspire/afflict_bless.
 * Uses seed to pick a domain.
 */
function getDomainLabel(seed: number): string {
  const domains = ['might', 'wisdom', 'skill', 'cunning', 'grace'];
  const idx = Math.abs(seed) % domains.length;
  return domains[idx];
}

/**
 * Map a value pair to its agenda category (left pole name).
 * Used for agenda consequence messages.
 */
function getAgendaCategory(pair: ValuePair): AgendaConsequenceCategory {
  const polesMap: Record<ValuePair, AgendaConsequenceCategory> = {
    mercy_ruthlessness: 'compassion',
    asceticism_extravagance: 'greed',
    honesty_cunning: 'cunning',
    tradition_novelty: 'tradition',
    loyalty_ambition: 'loyalty',
    frankness_propriety: 'loyalty',
    humility_pride: 'dominance',
    sacrifice_survival: 'devotion',
    stoicism_passion: 'devotion',
    courage_prudence: 'courage',
  };
  return polesMap[pair];
}

/**
 * Get a sphere adjective from SPHERE_VOCABULARY.
 * Uses seeded selection from the adjectives array.
 */
function getSphereAdjective(sphere: SphereName, seed: number): string {
  const vocab = SPHERE_VOCABULARY[sphere];
  if (!vocab?.adjectives?.length) {
    return 'mysterious';
  }
  const idx = Math.abs(seed) % vocab.adjectives.length;
  return vocab.adjectives[idx];
}

/**
 * Generate a consequence message, using agenda-specific version if agenda is present.
 */
function generateConsequenceMessage(
  interventionType: InterventionType,
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  seed: number,
  valueDirections: string[],
  agenda?: AgendaTemplate,
): string {
  if (agenda) {
    const actorNode = graph.getNode(actorId);
    const archetype = (actorNode?.properties?.narrativeArchetype as string) ?? 'warrior';
    const category = getAgendaCategory(agenda.valuePair);
    return getAgendaConsequenceMessage(
      interventionType,
      category,
      {
        agentName: actorName,
        archetype,
        sphereAdj: getSphereAdjective(sphere, seed),
        agendaHook: agenda.narrativeHook,
      },
      seed,
    );
  } else {
    return getConsequenceMessage(
      interventionType as any,
      { agentName: actorName, valueDirection: valueDirections[0] ?? 'a new path' },
      seed,
    );
  }
}

// ─── Main Intervention Effects Engine ────────────────────────────

/**
 * Apply world effects for a given intervention.
 * Per-type switch:
 * - dream: 1-2 value drifts, short duration
 * - persuade: 1-2 value drifts, medium duration
 * - deceive: value drifts + trait, longer duration
 * - intimidate: courage_prudence drift + strategy override
 * - inspire_intervention: personality boost + trait
 * - coincidence: sphere influence boost at location
 * - omen: applies to target agent (simplified)
 * - afflict_bless: condition trait, bless/afflict based on seed
 */
export function applyInterventionEffects(
  input: ApplyInterventionEffectsInput,
): ApplyInterventionEffectsResult {
  const { graph, interventionType, targetAgentId, sphere, tick, seed, agenda } = input;

  // Validate target actor
  const actorNode = graph.getNode(targetAgentId);
  if (!actorNode || actorNode.type !== 'actor') {
    return {
      success: false,
      consequenceMessage: 'Target not found.',
      effectsSummary: [],
    };
  }

  const actorName = actorNode.name ?? 'the target';
  const locationId = (actorNode.properties?.locationId as string) ?? '';
  const effectsSummary: string[] = [];

  // Route to per-type handler
  switch (interventionType) {
    case 'dream':
      return handleDream(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'persuade':
      return handlePersuade(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'deceive':
      return handleDeceive(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'intimidate':
      return handleIntimidate(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'inspire_intervention':
      return handleInspire(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'coincidence':
      return handleCoincidence(
        graph,
        targetAgentId,
        actorName,
        locationId,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'omen':
      return handleOmen(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    case 'afflict_bless':
      return handleAfflictBless(
        graph,
        targetAgentId,
        actorName,
        sphere,
        tick,
        seed,
        effectsSummary,
        agenda,
      );
    default:
      return {
        success: false,
        consequenceMessage: `Unknown intervention type: ${interventionType}`,
        effectsSummary: [],
      };
  }
}

// ─── Per-Type Handlers ───────────────────────────────────────────

function handleDream(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const driftMag = DIVINE_INFLUENCE_CONSTANTS.DREAM_DRIFT;
  const decayParams = DECAY_CONSTANTS.dream;

  // Use agenda valuePair if provided, otherwise select randomly
  const pairs = agenda ? [agenda.valuePair] : selectValuePairs(1, seed);
  const valueDrifts: Partial<Record<ValuePair, number>> = {};
  const directions: string[] = [];

  for (const pair of pairs) {
    // Use agenda direction if provided, otherwise use seed
    const drift = agenda
      ? agenda.valueDirection === 'left'
        ? driftMag
        : -driftMag
      : Math.abs(seed) % 2 === 0
        ? driftMag
        : -driftMag;
    valueDrifts[pair] = drift;
    const dir = getValueDirection(pair, seed);
    directions.push(dir);
    effectsSummary.push(`${pair} drift toward ${dir}`);
  }

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'dream',
    sphere,
    tickApplied: tick,
    ...decayParams,
    valueDrifts,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'dream',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    directions,
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'dream',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handlePersuade(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const driftMag = DIVINE_INFLUENCE_CONSTANTS.PERSUADE_DRIFT;
  const decayParams = DECAY_CONSTANTS.persuade;

  // Use agenda valuePair if provided, otherwise select randomly
  const pairs = agenda ? [agenda.valuePair] : selectValuePairs(1, seed);
  const valueDrifts: Partial<Record<ValuePair, number>> = {};
  const directions: string[] = [];

  for (const pair of pairs) {
    // Use agenda direction if provided, otherwise use seed
    const drift = agenda
      ? agenda.valueDirection === 'left'
        ? driftMag
        : -driftMag
      : Math.abs(seed) % 2 === 0
        ? driftMag
        : -driftMag;
    valueDrifts[pair] = drift;
    const dir = getValueDirection(pair, seed);
    directions.push(dir);
    effectsSummary.push(`${pair} drift toward ${dir}`);
  }

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'persuade',
    sphere,
    tickApplied: tick,
    ...decayParams,
    valueDrifts,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'persuade',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    directions,
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'persuade',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handleDeceive(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const driftMag = DIVINE_INFLUENCE_CONSTANTS.DECEIVE_DRIFT;
  const decayParams = DECAY_CONSTANTS.deceive;

  // Use agenda valuePair if provided, otherwise select randomly
  const pairs = agenda ? [agenda.valuePair] : selectValuePairs(1, seed);
  const valueDrifts: Partial<Record<ValuePair, number>> = {};
  const directions: string[] = [];

  for (const pair of pairs) {
    // Use agenda direction if provided, otherwise use seed
    const drift = agenda
      ? agenda.valueDirection === 'left'
        ? driftMag
        : -driftMag
      : Math.abs(seed) % 2 === 0
        ? driftMag
        : -driftMag;
    valueDrifts[pair] = drift;
    const dir = getValueDirection(pair, seed);
    directions.push(dir);
    effectsSummary.push(`${pair} drift toward ${dir}`);
  }

  const traitId = `trait.deceived.${generateInfluenceId()}`;
  effectsSummary.push('Deceived condition applied');

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'deceive',
    sphere,
    tickApplied: tick,
    ...decayParams,
    valueDrifts,
    traitId,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'deceive',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    directions,
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'deceive',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handleIntimidate(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const drift = DIVINE_INFLUENCE_CONSTANTS.INTIMIDATE_COURAGE_DRIFT;
  const decayParams = DECAY_CONSTANTS.intimidate;

  // Always target courage_prudence (shift toward prudence)
  const valueDrifts: Partial<Record<ValuePair, number>> = {
    courage_prudence: drift,
  };
  effectsSummary.push('courage → prudence drift applied');

  // Strategy override: grudger unless already always_defect
  const strategyOverride = 'grudger';
  effectsSummary.push(`strategy override: ${strategyOverride}`);

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'intimidate',
    sphere,
    tickApplied: tick,
    ...decayParams,
    valueDrifts,
    strategyOverride,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'intimidate',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    [],
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'intimidate',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handleInspire(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const boost = DIVINE_INFLUENCE_CONSTANTS.INSPIRE_PERSONALITY_BOOST;
  const decayParams = DECAY_CONSTANTS.inspire_intervention;

  const domain = getDomainLabel(seed);
  const traitId = `trait.inspired.${generateInfluenceId()}`;
  effectsSummary.push(`personality boost: +${boost}`);
  effectsSummary.push(`inspired trait (${domain})`);

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'inspire_intervention',
    sphere,
    tickApplied: tick,
    ...decayParams,
    personalityBoost: boost,
    traitId,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'inspire_intervention',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    [],
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'inspire_intervention',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handleCoincidence(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  locationId: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const boost = DIVINE_INFLUENCE_CONSTANTS.COINCIDENCE_SPHERE_BOOST;
  const decayParams = DECAY_CONSTANTS.coincidence;

  // Update location's sphere influence
  const locNode = graph.getNode(locationId);
  if (locNode) {
    const sphereInfluence = (locNode.properties?.sphereInfluence as Record<string, number>) ?? {};
    sphereInfluence[sphere] = (sphereInfluence[sphere] ?? 0) + boost;
    graph.updateNode(locationId, {
      properties: { sphereInfluence },
    });
    effectsSummary.push(`${sphere} influence at location +${boost}`);
  }

  // Add minimal divine influence record for actor (for logging)
  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'coincidence',
    sphere,
    tickApplied: tick,
    ...decayParams,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };
  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'coincidence',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    [],
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'coincidence',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handleOmen(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const moodDrift = DIVINE_INFLUENCE_CONSTANTS.OMEN_MOOD_DRIFT;
  const decayParams = DECAY_CONSTANTS.omen;

  // Simplified: apply to target agent only (not all agents at location)
  const valueDrifts: Partial<Record<ValuePair, number>> = {
    mercy_ruthlessness: -moodDrift,
  };
  effectsSummary.push(`mercy ← ruthlessness mood drift (omen)`);

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'omen',
    sphere,
    tickApplied: tick,
    ...decayParams,
    valueDrifts,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'omen',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    [],
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'omen',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}

function handleAfflictBless(
  graph: WorldGraph,
  actorId: string,
  actorName: string,
  sphere: SphereName,
  tick: number,
  seed: number,
  effectsSummary: string[],
  agenda?: AgendaTemplate,
): ApplyInterventionEffectsResult {
  const decayParams = DECAY_CONSTANTS.afflict_bless;

  // Determine bless vs afflict: even seed = bless, odd = afflict
  const isBless = Math.abs(seed) % 2 === 0;
  const effectType = isBless ? 'Blessed' : 'Afflicted';
  const effectDirection = isBless ? 'strengthened' : 'diminished';
  const domain = getDomainLabel(seed);
  const traitId = `trait.${isBless ? 'blessed' : 'afflicted'}.${generateInfluenceId()}`;

  effectsSummary.push(`${effectType} (${domain})`);

  const influence: DivineInfluenceEntry = {
    id: generateInfluenceId(),
    interventionType: 'afflict_bless',
    sphere,
    tickApplied: tick,
    ...decayParams,
    traitId,
    reachBoost: agenda?.reachBoost,
    behaviorTag: agenda?.behaviorTag,
    agendaId: agenda?.id,
  };

  addDivineInfluence(graph, actorId, influence);

  const msg = generateConsequenceMessage(
    'afflict_bless',
    graph,
    actorId,
    actorName,
    sphere,
    seed,
    [],
    agenda,
  );

  emitTrace({
    category: 'intervention_effect',
    agentId: actorId,
    interventionType: 'afflict_bless',
    targetAgentId: actorId,
    targetAgentName: actorName,
    sphere,
    effects: effectsSummary,
    consequenceMessage: msg,
    initialStrength: decayParams.initialStrength,
    maxDuration: decayParams.maxDuration,
  });

  return {
    success: true,
    consequenceMessage: msg,
    effectsSummary,
  };
}
