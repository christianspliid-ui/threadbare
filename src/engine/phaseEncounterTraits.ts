/**
 * Phase: Encounter Traits — assign mastery and condition traits based on
 * encounter outcomes.
 *
 * Called from the orchestrator's encounter aftermath loop (after reputation tally).
 * Tracks per-agent success counts by reach domain in a `masteryProgress` property.
 * When thresholds are met, assigns mastery traits. Also assigns condition traits
 * for notable outcomes (combat failure → wounded, social triumph → inspired, etc.).
 *
 * ─── Constants ──────────────────────────────────────────────────
 * Thresholds imported from mastery-trait-content.ts and condition-trait-content.ts.
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Emits 'encounter_trait' traces for mastery progress and trait assignments.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                             |
 * |---------------------------------|--------------------------------------|
 * | Missing actor node              | Skip                                 |
 * | Missing trait definition node   | Skip (ensureTraitNodes handles)      |
 * | Missing masteryProgress prop    | Treat as empty ({})                  |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None — deterministic threshold checks.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import { assignTrait, reinforceTrait, getTraitsForNode } from './traits';
import { emitTrace } from './traceBuffer';
import { getAnyEncounterById } from '../data/encounter-content';
import {
  MASTERY_TRAIT_DEFINITIONS,
  MASTERY_TRAIT_BY_REACH,
  MASTERY_THRESHOLDS,
} from '../data/mastery-trait-content';
import {
  CONDITION_TRAIT_DEFINITIONS,
  CONDITION_DURATIONS,
} from '../data/condition-trait-content';

// ─── Trait Node Initialization ─────────────────────────────────────

function ensureTraitNodes(graph: WorldGraph): void {
  // Check if the first trait node exists in this specific graph.
  // If it does, all others were added together, so skip.
  // If not, add all trait definition nodes.
  // This avoids module-level singleton state that persists across test sessions.
  const allDefs = [...MASTERY_TRAIT_DEFINITIONS, ...CONDITION_TRAIT_DEFINITIONS];
  if (allDefs.length === 0) return;

  const firstNodeId = allDefs[0].id;
  if (graph.getNode(firstNodeId)) {
    // First node already exists, so all trait nodes are already in this graph
    return;
  }

  // Add all trait definition nodes
  for (const node of allDefs) {
    if (!graph.getNode(node.id)) {
      graph.addNode(node);
    }
  }
}

/** Reset initialization flag (for tests / new sessions) — now a no-op since we check graph state */
export function resetEncounterTraitInit(): void {
  // No-op: initialization is now graph-aware via ensureTraitNodes check
}

// ─── Mastery Progress Helpers ─────────────────────────────────────

interface MasteryProgress {
  [reach: string]: number; // cumulative success count per reach
}

function getProgress(graph: WorldGraph, actorId: string): MasteryProgress {
  const node = graph.getNode(actorId);
  return (node?.properties?.masteryProgress as MasteryProgress) ?? {};
}

function setProgress(graph: WorldGraph, actorId: string, progress: MasteryProgress): void {
  const node = graph.getNode(actorId);
  if (!node) return;
  node.properties.masteryProgress = progress;
}

// ─── Encounter Category → Reach Mapping ──────────────────────────

/** Map encounter categories to primary reach for mastery tracking */
const CATEGORY_TO_REACH: Record<string, ReachDomain> = {
  combat: 'iron',
  duel: 'iron',
  military: 'iron',
  social: 'heart',
  diplomatic: 'heart',
  negotiation: 'heart',
  stealth: 'shadow',
  espionage: 'shadow',
  intrigue: 'shadow',
  mystical: 'veil',
  arcane: 'veil',
  ritual: 'veil',
  exploration: 'eye',
  investigation: 'eye',
  discovery: 'eye',
  construction: 'stone',
  labor: 'stone',
  fortification: 'stone',
  divine: 'star',
  sacrifice: 'star',
  pilgrimage: 'star',
};

// ─── Condition Assignment Rules ──────────────────────────────────

/** Map from outcome pattern to condition trait to assign */
interface ConditionRule {
  conditionId: string;
  /** Whether this triggers on success (true) or failure (false) */
  onSuccess: boolean;
  /** Only apply if encounter completed (not abandoned) */
  requiresCompletion: boolean;
}

const CONDITION_RULES: ConditionRule[] = [
  // Combat failure → wounded
  { conditionId: 'trait.condition.wounded', onSuccess: false, requiresCompletion: true },
  // Social/divine success → inspired
  { conditionId: 'trait.condition.inspired', onSuccess: true, requiresCompletion: true },
  // Combat/exploration failure on deadly+ → terrified
  { conditionId: 'trait.condition.terrified', onSuccess: false, requiresCompletion: true },
  // Prolonged encounter → exhausted
  { conditionId: 'trait.condition.exhausted', onSuccess: true, requiresCompletion: true },
];

/** Categories that can produce the wounded condition on failure */
const WOUND_CATEGORIES = new Set(['combat', 'duel', 'military']);

/** Categories that can produce the inspired condition on success */
const INSPIRE_CATEGORIES = new Set(['social', 'diplomatic', 'divine', 'sacrifice']);

/** Categories that can produce the terrified condition on failure */
const TERROR_CATEGORIES = new Set(['combat', 'duel', 'military', 'mystical']);

// ─── Main Entry Points ──────────────────────────────────────────

/**
 * Process a single encounter step outcome for mastery trait progress.
 * Called from the orchestrator after each encounter step resolution.
 */
export function processEncounterMastery(
  graph: WorldGraph,
  actorId: string,
  encounterId: string,
  stepSuccess: boolean,
  isCompleted: boolean,
  tick: number,
): void {
  if (!stepSuccess) return;

  ensureTraitNodes(graph);

  const template = getAnyEncounterById(encounterId);
  if (!template) return;

  // Determine reach from encounter category
  const category = (template as Record<string, unknown>).category as string | undefined;
  const reachPrimary = (template as Record<string, unknown>).reachPrimary as string | undefined;

  // Use explicit reach if available, fall back to category mapping
  let reach: ReachDomain | undefined;
  if (reachPrimary && MASTERY_TRAIT_BY_REACH[reachPrimary]) {
    reach = reachPrimary as ReachDomain;
  } else if (category && CATEGORY_TO_REACH[category]) {
    reach = CATEGORY_TO_REACH[category];
  }

  if (!reach) return;

  const traitId = MASTERY_TRAIT_BY_REACH[reach];
  if (!traitId) return;

  // Update mastery progress
  const progress = getProgress(graph, actorId);
  const current = progress[reach] ?? 0;
  const newCount = current + 1;
  progress[reach] = newCount;
  setProgress(graph, actorId, progress);

  // Check threshold
  const threshold = MASTERY_THRESHOLDS[reach] ?? 4;
  if (newCount >= threshold) {
    const existingEdges = getTraitsForNode(graph, actorId);
    const hasTrait = existingEdges.some(e => e.target === traitId);

    if (hasTrait) {
      // Reinforce existing trait
      try {
        reinforceTrait(graph, actorId, traitId, tick);
      } catch {
        // fail-soft
      }
    } else {
      // Assign new mastery trait
      assignTrait(graph, actorId, traitId, { tick, source: `mastery:${reach}` });
      emitTrace({
        type: 'encounter_trait',
        category: 'encounter_trait',
        tick,
        actorId,
        summary: `Earned mastery trait: ${traitId}`,
        details: { reach, traitId, successCount: newCount },
      });
    }

    // Reset progress for this reach after trait assignment/reinforcement
    progress[reach] = 0;
    setProgress(graph, actorId, progress);
  }
}

/**
 * Process encounter completion for condition trait assignment.
 * Called from the orchestrator when an encounter completes.
 */
export function processEncounterConditions(
  graph: WorldGraph,
  actorId: string,
  encounterId: string,
  stepSuccess: boolean,
  isCompleted: boolean,
  tick: number,
): void {
  if (!isCompleted) return;

  ensureTraitNodes(graph);

  const template = getAnyEncounterById(encounterId);
  if (!template) return;

  const category = (template as Record<string, unknown>).category as string | undefined;
  if (!category) return;

  // Check for condition assignments
  if (!stepSuccess && WOUND_CATEGORIES.has(category)) {
    assignCondition(graph, actorId, 'trait.condition.wounded', tick, `encounter:${encounterId}`);
  }

  if (stepSuccess && INSPIRE_CATEGORIES.has(category)) {
    assignCondition(graph, actorId, 'trait.condition.inspired', tick, `encounter:${encounterId}`);
  }

  if (!stepSuccess && TERROR_CATEGORIES.has(category)) {
    // Terrified only on failure of high-threat encounters
    const threat = (template as Record<string, unknown>).threatRating as string | undefined;
    if (threat === 'hard' || threat === 'deadly') {
      assignCondition(graph, actorId, 'trait.condition.terrified', tick, `encounter:${encounterId}`);
    }
  }
}

/**
 * Assign a condition trait with its default duration.
 * No-op if the agent already has the condition.
 */
function assignCondition(
  graph: WorldGraph,
  actorId: string,
  conditionId: string,
  tick: number,
  source: string,
): void {
  // Skip if already has this condition
  const existing = getTraitsForNode(graph, actorId);
  if (existing.some(e => e.target === conditionId)) return;

  assignTrait(graph, actorId, conditionId, { tick, source });

  // Set ticksRemaining on the edge for condition decay
  const duration = CONDITION_DURATIONS[conditionId];
  if (duration != null) {
    const edge = graph.getOutgoingEdges(actorId, 'has_trait')
      .find(e => e.target === conditionId);
    if (edge) {
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, ticksRemaining: duration, totalTicks: duration },
      });
    }
  }

  emitTrace({
    type: 'encounter_trait',
    category: 'encounter_trait',
    tick,
    actorId,
    summary: `Gained condition: ${conditionId}`,
    details: { conditionId, source, duration: CONDITION_DURATIONS[conditionId] },
  });
}
