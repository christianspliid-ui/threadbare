/**
 * Encounter Chains — sequential multi-stage encounter narratives.
 *
 * Agents progress through ordered encounter template sequences. Completing
 * stage N unlocks stage N+1. Chains create long-term goals and narrative
 * arcs that differentiate agent experiences.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                          | Default | Purpose                                |
 * |-------------------------------|---------|----------------------------------------|
 * | CHAIN_COMPLETION_CAPABILITY_BONUS | 0.05 | One-time cap boost on chain completion |
 * | CHAIN_STAGE_SCORE_BONUS       | 0.15    | Flat scoring bonus for next chain stage|
 * | MAX_ACTIVE_CHAINS             | 2       | Max concurrent chain progressions      |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Emits chain_progress traces on stage completion with agentId, chainId,
 * stageIndex, templateId, isChainComplete.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                       | Fallback                           |
 * |------------------------------------|------------------------------------|
 * | Missing chainProgress on agent     | Initialize empty (start from 0)    |
 * | Chain references nonexistent template | Skip that stage in the chain    |
 * | Agent exceeds MAX_ACTIVE_CHAINS    | Soft cap — no bonus for excess     |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — progression is deterministic (complete stage → next unlocks).
 */

import type { DomainContributions, ReachDomain } from '../types/traits';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import { chainMasteryTraitId, legacyChainMasteryTraitId, findExistingTraitEdge } from './traitShape';
import { touchStructure, touchWorld, type SimulationRuntime } from './simulationRuntime';
import {
  CHAIN_COMPLETION_CAPABILITY_BONUS,
  CHAIN_STAGE_SCORE_BONUS,
  MAX_ACTIVE_CHAINS,
} from '../data/agent-behavior-constants';

export {
  CHAIN_COMPLETION_CAPABILITY_BONUS,
  CHAIN_STAGE_SCORE_BONUS,
  MAX_ACTIVE_CHAINS,
} from '../data/agent-behavior-constants';

// ─── Types ─────────────────────────────────────────────────────

export interface EncounterChain {
  id: string;
  name: string;
  /** Ordered list of template IDs. Agent must complete [i] before [i+1] is visible. */
  stages: string[];
  /** Primary reach domain for the chain (used for completion capability bonus). */
  primaryReach: ReachDomain;
}

/**
 * Tracks an agent's progress through encounter chains.
 * Stored as agent.properties.chainProgress.
 */
export interface ChainProgress {
  /** chainId → index of highest completed stage (0 = first stage completed) */
  completed: Record<string, number>;
}

// ─── Starter Chains ────────────────────────────────────────────

/**
 * Stage ids are **live `UnifiedActionTemplate` ids** and must stay that way.
 *
 * THR-803: these were authored as bare keys (`knowledge_test`) while every real
 * template is `encounter.knowledge_test`. `templateToChains` is keyed by stage id
 * and every consumer looks up `entry.templateId` (the real, prefixed id), so no
 * lookup ever hit — `isChainStageUnlocked` fell through its "not part of any chain"
 * branch and returned `true` for all nine stages, `computeChainBonus` returned 0,
 * and `classifyChainStage` reported false. The whole subsystem was inert rather
 * than, as first reported, gating stages shut. Two vocabularies that never
 * intersected — the same shape as the trait-ref defect in THR-800.
 *
 * A new chain's stages must therefore name ids that exist in the template pool;
 * `chainStagesResolveToTemplates` in the test suite is the guard.
 */
export const ENCOUNTER_CHAINS: EncounterChain[] = [
  {
    id: 'chain.scholars_path',
    name: "The Scholar's Path",
    stages: ['encounter.knowledge_test', 'encounter.forbidden_tome', 'encounter.arcane_duel'],
    primaryReach: 'eye',
  },
  {
    id: 'chain.rise_through_ranks',
    name: 'Rise Through the Ranks',
    stages: ['encounter.recruit_militia', 'encounter.guild_negotiation', 'encounter.arena_combat'],
    primaryReach: 'iron',
  },
  {
    id: 'chain.merchants_gambit',
    name: "The Merchant's Gambit",
    stages: ['encounter.merchants_gambit', 'encounter.caravan_deal', 'encounter.smuggler_pact'],
    primaryReach: 'gold',
  },
];

// ─── Chain lookup index ────────────────────────────────────────

/** templateId → array of chains that include this template */
const templateToChains = new Map<string, { chain: EncounterChain; stageIndex: number }[]>();

function ensureIndex(): void {
  if (templateToChains.size > 0) return;
  for (const chain of ENCOUNTER_CHAINS) {
    for (let i = 0; i < chain.stages.length; i++) {
      const templateId = chain.stages[i];
      const existing = templateToChains.get(templateId) ?? [];
      existing.push({ chain, stageIndex: i });
      templateToChains.set(templateId, existing);
    }
  }
}

// ─── Query Functions ───────────────────────────────────────────

/**
 * Get the agent's chain progress. Returns empty if not set.
 */
export function getChainProgress(agentProperties: Record<string, unknown>): ChainProgress {
  const progress = agentProperties.chainProgress as ChainProgress | undefined;
  return progress ?? { completed: {} };
}

/**
 * Check if a template is part of a chain and whether the agent has
 * the prerequisite to attempt it. Returns true if:
 * - Template is not part of any chain (always allowed)
 * - Template is the first stage of a chain (always allowed)
 * - Agent has completed the previous stage in the chain
 */
export function isChainStageUnlocked(
  templateId: string,
  progress: ChainProgress,
): boolean {
  ensureIndex();
  const chainEntries = templateToChains.get(templateId);
  if (!chainEntries || chainEntries.length === 0) return true; // Not part of any chain

  // Template must be unlocked in at least one chain it belongs to
  for (const { chain, stageIndex } of chainEntries) {
    if (stageIndex === 0) return true; // First stage always unlocked

    const completedIndex = progress.completed[chain.id];
    if (completedIndex !== undefined && completedIndex >= stageIndex - 1) {
      return true; // Previous stage completed
    }
  }

  return false;
}

/**
 * Compute the chain scoring bonus for a template.
 * Returns CHAIN_STAGE_SCORE_BONUS if this template is the next stage
 * in one of the agent's active chains (up to MAX_ACTIVE_CHAINS).
 * Returns 0 otherwise.
 */
export function computeChainBonus(
  templateId: string,
  progress: ChainProgress,
): number {
  ensureIndex();
  const chainEntries = templateToChains.get(templateId);
  if (!chainEntries || chainEntries.length === 0) return 0;

  const activeChainCount = Object.keys(progress.completed).length;

  for (const { chain, stageIndex } of chainEntries) {
    const completedIndex = progress.completed[chain.id];

    // Check if this is the next stage
    const isNextStage =
      (completedIndex === undefined && stageIndex === 0) ||
      (completedIndex !== undefined && stageIndex === completedIndex + 1);

    if (!isNextStage) continue;

    // Soft cap: no bonus for chains beyond MAX_ACTIVE_CHAINS
    // (unless this chain is already started)
    if (completedIndex === undefined && activeChainCount >= MAX_ACTIVE_CHAINS) {
      continue;
    }

    return CHAIN_STAGE_SCORE_BONUS;
  }

  return 0;
}

/**
 * Record completion of a chain stage. Returns updated progress and
 * any chain completion info (for capability bonus application).
 */
export function recordChainStageCompletion(
  templateId: string,
  progress: ChainProgress,
): {
  updatedProgress: ChainProgress;
  completedChains: { chainId: string; primaryReach: ReachDomain }[];
} {
  ensureIndex();
  const chainEntries = templateToChains.get(templateId);
  const completedChains: { chainId: string; primaryReach: ReachDomain }[] = [];

  if (!chainEntries || chainEntries.length === 0) {
    return { updatedProgress: progress, completedChains };
  }

  const updated: ChainProgress = {
    completed: { ...progress.completed },
  };

  for (const { chain, stageIndex } of chainEntries) {
    const currentCompleted = updated.completed[chain.id];

    // Only advance if this is the next stage
    const isNextStage =
      (currentCompleted === undefined && stageIndex === 0) ||
      (currentCompleted !== undefined && stageIndex === currentCompleted + 1);

    if (!isNextStage) continue;

    updated.completed[chain.id] = stageIndex;

    // Check if this completes the chain
    if (stageIndex === chain.stages.length - 1) {
      completedChains.push({
        chainId: chain.id,
        primaryReach: chain.primaryReach,
      });
    }
  }

  return { updatedProgress: updated, completedChains };
}

/**
 * Classify a template with respect to an agent's chain progress.
 * Returns { isChainStage, isFinalChainStage } where:
 * - isChainStage: template is the agent's next unlocked stage in at least one chain
 * - isFinalChainStage: isChainStage AND stageIndex === chain.stages.length - 1
 * Mirrors computeChainBonus semantics so curator metadata and scoring agree.
 * Fail-soft: unknown template → both false.
 */
export function classifyChainStage(
  templateId: string,
  progress: ChainProgress,
): { isChainStage: boolean; isFinalChainStage: boolean } {
  ensureIndex();
  const chainEntries = templateToChains.get(templateId);
  if (!chainEntries || chainEntries.length === 0) {
    return { isChainStage: false, isFinalChainStage: false };
  }

  const activeChainCount = Object.keys(progress.completed).length;

  for (const { chain, stageIndex } of chainEntries) {
    const completedIndex = progress.completed[chain.id];

    const isNextStage =
      (completedIndex === undefined && stageIndex === 0) ||
      (completedIndex !== undefined && stageIndex === completedIndex + 1);

    if (!isNextStage) continue;

    // Mirror computeChainBonus: skip new chains once at MAX_ACTIVE_CHAINS
    if (completedIndex === undefined && activeChainCount >= MAX_ACTIVE_CHAINS) {
      continue;
    }

    const isFinalChainStage = stageIndex === chain.stages.length - 1;
    return { isChainStage: true, isFinalChainStage };
  }

  return { isChainStage: false, isFinalChainStage: false };
}

// ─── Write path ────────────────────────────────────────────────

// The chain-mastery trait id moved to `traitShape.ts` at THR-1395: one shared definition
// per chain, and the idempotence the per-(chain, agent) id used to give for free now comes
// from the bearer's own `has_trait` edge — see the `alreadyGranted` check below.

/**
 * Grant the one-time `CHAIN_COMPLETION_CAPABILITY_BONUS` for a finished chain.
 *
 * Mirrors the `applyEncounterGrowth` idiom in `capabilityGrowth.ts`: a synthetic
 * trait node contributing 1.0 to the chain's `primaryReach`, with the bonus carried
 * as the `has_trait` edge `level` (capability walks `domainContributions × level`).
 *
 * Idempotent: if the mastery edge already exists the grant is skipped, so a double
 * call cannot stack the boost.
 *
 * @returns true when a node/edge was actually added (a structural mutation).
 */
function applyChainCompletionBonus(
  graph: WorldGraph,
  agentId: string,
  chainId: string,
  chainName: string,
  primaryReach: ReachDomain,
  tick: number,
): boolean {
  const traitNodeId = chainMasteryTraitId(chainId);
  // Idempotence is the bearer's edge, not the node id (THR-1395). The legacy per-bearer
  // id is checked too, so a saved world where this agent already earned the bonus does
  // not earn it a second time under the new shape.
  const alreadyGranted = findExistingTraitEdge(graph, agentId, [
    traitNodeId,
    legacyChainMasteryTraitId(chainId, agentId),
  ]) !== undefined;
  if (alreadyGranted) return false;

  if (!graph.getNode(traitNodeId)) {
    const domainContributions: DomainContributions = { [primaryReach]: 1.0 };
    graph.addNode({
      id: traitNodeId,
      type: 'trait',
      name: `Chain Mastery (${chainName})`,
      properties: {
        subcategory: 'experience' as string,
        description: `Completed every stage of ${chainName}.`,
        importance: 0.4,
        maxLevel: 1,
        visibility: 'discoverable',
        domainContributions,
        tags: ['experience', 'chain', primaryReach],
        flavorText: `The whole road walked, end to end.`,
      },
    });
  }

  graph.addEdge({
    // Per-bearer, because the *node* no longer is: two agents finishing the same chain
    // now point at one definition, so an id derived from the node alone would collide.
    id: `edge_${traitNodeId}.${agentId}`,
    source: agentId,
    target: traitNodeId,
    type: 'has_trait',
    properties: {
      level: CHAIN_COMPLETION_CAPABILITY_BONUS,
      acquiredTick: tick,
      lastReinforcedTick: tick,
      source: 'chain_completion',
      visibility: 'discoverable',
    },
  });

  return true;
}

/**
 * Record that `templateId` — the encounter an agent just resolved successfully —
 * completed a stage in one or more chains, and persist the result on the agent.
 *
 * **This is the production write half of the subsystem** (THR-803). Before it,
 * `recordChainStageCompletion` had zero callers, nothing ever wrote
 * `agent.properties.chainProgress`, and the documented `chain_progress` trace was
 * never emitted — so `getChainProgress` returned `{ completed: {} }` for every
 * agent for an entire run and the gate could never open.
 *
 * The write lives here rather than in `unifiedActionLifecycle.ts` because
 * `advanceStep`/`completeUnifiedAction` are pure functions over the action object
 * with no graph access; the resolution site that owns graph writes is the caller.
 *
 * No-ops (no write, no trace) when the template belongs to no chain or advances no
 * chain, which is the overwhelmingly common case — this runs on every successful
 * encounter completion.
 *
 * Fail-soft: a missing agent node returns an empty result rather than throwing;
 * the tick loop must never crash on progression bookkeeping.
 */
export function applyChainStageCompletion(
  graph: WorldGraph,
  agentId: string,
  templateId: string,
  tick: number,
  runtime?: SimulationRuntime,
): { advanced: boolean; completedChainIds: string[] } {
  const empty = { advanced: false, completedChainIds: [] as string[] };

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return empty;

  const progress = getChainProgress(agentNode.properties as Record<string, unknown>);
  const { updatedProgress, completedChains } = recordChainStageCompletion(templateId, progress);

  // Gate on a real diff, NOT on object identity: recordChainStageCompletion returns a
  // fresh copy whenever the template belongs to any chain — including the common case
  // where it advanced nothing (an already-completed stage, or a stage out of order).
  // Identity would therefore write and trace on every no-op.
  const advancedChainIds = Object.keys(updatedProgress.completed).filter(
    id => updatedProgress.completed[id] !== progress.completed[id],
  );
  if (advancedChainIds.length === 0) return empty;

  // In-place property write — the node.properties idiom used throughout the engine.
  // `updateNode` would replace the node object and invalidate handles held elsewhere.
  agentNode.properties.chainProgress = updatedProgress;

  let structural = false;
  for (const { chainId, primaryReach } of completedChains) {
    const chain = ENCOUNTER_CHAINS.find(c => c.id === chainId);
    structural =
      applyChainCompletionBonus(
        graph,
        agentId,
        chainId,
        chain?.name ?? chainId,
        primaryReach,
        tick,
      ) || structural;
  }

  // Property mutations must participate in `worldVersion` or UI selectors keyed on
  // it serve stale data; adding the mastery trait is structural, which implies it.
  if (runtime) {
    if (structural) touchStructure(runtime);
    else touchWorld(runtime);
  }

  // One aggregate trace per advancing completion — transition-fired, never per tick.
  emitTrace({
    category: 'chain_progress',
    tick,
    agentId,
    templateId,
    chainIds: advancedChainIds,
    stageIndices: advancedChainIds.map(id => updatedProgress.completed[id]),
    completedChainIds: completedChains.map(c => c.chainId),
    isChainComplete: completedChains.length > 0,
    summary: `chain_progress: ${agentId} advanced ${advancedChainIds.join(', ')} via ${templateId}${
      completedChains.length > 0 ? ` (completed ${completedChains.map(c => c.chainId).join(', ')})` : ''
    }`,
  } as any);

  return { advanced: true, completedChainIds: completedChains.map(c => c.chainId) };
}

/**
 * Get all chains and the agent's status within them.
 * Useful for debug display.
 */
export function getChainStatus(progress: ChainProgress): Array<{
  chainId: string;
  chainName: string;
  totalStages: number;
  completedStages: number;
  isComplete: boolean;
}> {
  return ENCOUNTER_CHAINS.map(chain => {
    const completedIndex = progress.completed[chain.id];
    const completedStages = completedIndex !== undefined ? completedIndex + 1 : 0;
    return {
      chainId: chain.id,
      chainName: chain.name,
      totalStages: chain.stages.length,
      completedStages,
      isComplete: completedStages >= chain.stages.length,
    };
  });
}
