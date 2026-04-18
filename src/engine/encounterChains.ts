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

import type { ReachDomain } from '../types/traits';
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

export const ENCOUNTER_CHAINS: EncounterChain[] = [
  {
    id: 'chain.scholars_path',
    name: "The Scholar's Path",
    stages: ['knowledge_test', 'forbidden_tome', 'arcane_duel'],
    primaryReach: 'eye',
  },
  {
    id: 'chain.rise_through_ranks',
    name: 'Rise Through the Ranks',
    stages: ['recruit_militia', 'guild_negotiation', 'arena_combat'],
    primaryReach: 'iron',
  },
  {
    id: 'chain.merchants_gambit',
    name: "The Merchant's Gambit",
    stages: ['merchants_gambit', 'caravan_deal', 'smuggler_pact'],
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
