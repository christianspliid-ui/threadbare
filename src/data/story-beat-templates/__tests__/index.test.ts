import { describe, it, expect } from 'vitest';
import {
  STORY_BEAT_TEMPLATE_REGISTRY,
  lookupStoryBeatTemplate,
} from '../index';
import { CHAIN_WEAKENS_STORY_BEAT_MAP } from '../chain-weakens';

describe('STORY_BEAT_TEMPLATE_REGISTRY', () => {
  it('contains all Chain Weakens template ids', () => {
    for (const id of CHAIN_WEAKENS_STORY_BEAT_MAP.keys()) {
      expect(STORY_BEAT_TEMPLATE_REGISTRY.has(id)).toBe(true);
    }
  });

  it('has exactly 5 Chain Weakens templates', () => {
    expect(CHAIN_WEAKENS_STORY_BEAT_MAP.size).toBe(5);
  });
});

describe('lookupStoryBeatTemplate', () => {
  it('returns the template for a known id', () => {
    const t = lookupStoryBeatTemplate('story-beat.chain-weakens-rumor');
    expect(t).toBeDefined();
    expect(t?.id).toBe('story-beat.chain-weakens-rumor');
    expect(t?.poetProse).toBeTruthy();
    expect(t?.witnessFacts?.length).toBeGreaterThan(0);
  });

  it('returns undefined for an unknown id', () => {
    expect(lookupStoryBeatTemplate('story-beat.does-not-exist')).toBeUndefined();
  });

  it('all templates have at least one of poetProse or witnessFacts', () => {
    for (const [id, t] of STORY_BEAT_TEMPLATE_REGISTRY) {
      const hasDualVoice = Boolean(t.poetProse) || Boolean(t.witnessFacts?.length);
      expect(hasDualVoice, `${id} must have poetProse or witnessFacts`).toBe(true);
    }
  });

  it('no template uses sphere:void', () => {
    for (const [id, t] of STORY_BEAT_TEMPLATE_REGISTRY) {
      expect(t.sphere, `${id} must not use sphere 'void'`).not.toBe('void');
    }
  });
});
