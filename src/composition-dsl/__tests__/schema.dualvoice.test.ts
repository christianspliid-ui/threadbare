import { describe, it, expect } from 'vitest';
import { parseComposition } from '../schema';
import { CHAIN_WEAKENS_EVENT_RECIPE } from '../examples/event-chain-weakens.recipe';

describe('PhaseStoryBeatSpec voice field', () => {
  it('parses a phase storyBeat with voice:divine', () => {
    const result = parseComposition(CHAIN_WEAKENS_EVENT_RECIPE);
    const phase1 = result.phases?.find((p) => p.id === 'phase-1-rumor');
    expect(phase1?.storyBeat?.voice).toBe('divine');
  });

  it('parses a phase storyBeat with voice:mortal', () => {
    const result = parseComposition(CHAIN_WEAKENS_EVENT_RECIPE);
    const phase3 = result.phases?.find((p) => p.id === 'phase-3-absorbing');
    expect(phase3?.storyBeat?.voice).toBe('mortal');
  });

  it('parses a phase storyBeat without voice (backward-compatible)', () => {
    const noVoice = {
      ...CHAIN_WEAKENS_EVENT_RECIPE,
      phases: [
        {
          id: 'phase-1-rumor',
          activatesAt: { op: 'doom-clock' as const, comparator: 'gte' as const, tier: 1 },
          activates: [],
          storyBeat: {
            tier: 'notable' as const,
            template: 'story-beat.chain-weakens-rumor',
            priority: 'doom_clock' as const,
            // no voice field
          },
        },
      ],
    };
    const result = parseComposition(noVoice);
    expect(result.phases?.[0].storyBeat?.voice).toBeUndefined();
  });

  it('rejects an invalid voice string', () => {
    const badVoice = {
      ...CHAIN_WEAKENS_EVENT_RECIPE,
      phases: [
        {
          id: 'phase-1-rumor',
          activatesAt: { op: 'doom-clock' as const, comparator: 'gte' as const, tier: 1 },
          activates: [],
          storyBeat: {
            tier: 'notable' as const,
            template: 'story-beat.chain-weakens-rumor',
            voice: 'celestial', // invalid
          },
        },
      ],
    };
    expect(() => parseComposition(badVoice)).toThrow();
  });
});
