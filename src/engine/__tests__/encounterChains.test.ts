import { describe, it, expect } from 'vitest';
import {
  classifyChainStage,
  ENCOUNTER_CHAINS,
  MAX_ACTIVE_CHAINS,
} from '../encounterChains';
import type { ChainProgress } from '../encounterChains';

function emptyProgress(): ChainProgress {
  return { completed: {} };
}

describe('classifyChainStage', () => {
  const scholarsPath = ENCOUNTER_CHAINS.find(c => c.id === 'chain.scholars_path')!;
  // stages: ['knowledge_test', 'forbidden_tome', 'arcane_duel']

  it('returns false/false for an unknown template', () => {
    expect(classifyChainStage('nonexistent_template_xyz', emptyProgress())).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('returns true/false for stage 0 with empty progress', () => {
    expect(classifyChainStage(scholarsPath.stages[0], emptyProgress())).toEqual({
      isChainStage: true,
      isFinalChainStage: false,
    });
  });

  it('returns false/false for stage 1 when stage 0 not yet completed', () => {
    expect(classifyChainStage(scholarsPath.stages[1], emptyProgress())).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('returns true/false for mid-chain stage when previous stage completed', () => {
    const progress: ChainProgress = {
      completed: { 'chain.scholars_path': 0 }, // completed stage 0
    };
    expect(classifyChainStage(scholarsPath.stages[1], progress)).toEqual({
      isChainStage: true,
      isFinalChainStage: false,
    });
  });

  it('returns true/true for final stage when penultimate stage completed', () => {
    const finalStage = scholarsPath.stages[scholarsPath.stages.length - 1];
    const progress: ChainProgress = {
      completed: { 'chain.scholars_path': scholarsPath.stages.length - 2 },
    };
    expect(classifyChainStage(finalStage, progress)).toEqual({
      isChainStage: true,
      isFinalChainStage: true,
    });
  });

  it('returns false/false when chain already fully completed', () => {
    const firstStage = scholarsPath.stages[0];
    const progress: ChainProgress = {
      completed: { 'chain.scholars_path': scholarsPath.stages.length - 1 },
    };
    // stage 0 is done — no longer the "next" stage
    expect(classifyChainStage(firstStage, progress)).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('respects MAX_ACTIVE_CHAINS cap for new chains', () => {
    const riseChain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.rise_through_ranks')!;
    const merchantChain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.merchants_gambit')!;

    // Fill MAX_ACTIVE_CHAINS slots with already-started chains (scholars + rise)
    const progress: ChainProgress = {
      completed: {
        'chain.scholars_path': 0,
        'chain.rise_through_ranks': 0,
      },
    };
    expect(Object.keys(progress.completed).length).toBe(MAX_ACTIVE_CHAINS);

    // merchant chain stage 0 would start a new chain — should be blocked
    expect(classifyChainStage(merchantChain.stages[0], progress)).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('does not cap already-started chains at MAX_ACTIVE_CHAINS', () => {
    const riseChain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.rise_through_ranks')!;

    // Two chains started → cap applies to NEW chains, not continuation
    const progress: ChainProgress = {
      completed: {
        'chain.scholars_path': 0,
        'chain.rise_through_ranks': 0, // started, not at next stage yet
      },
    };
    // rise stage 1 continues an already-started chain — allowed even at cap
    expect(classifyChainStage(riseChain.stages[1], progress)).toEqual({
      isChainStage: true,
      isFinalChainStage: false,
    });
  });
});
