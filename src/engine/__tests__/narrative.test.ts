import { describe, it, expect } from 'vitest';
import type {
  NarrativeTier,
  NarrativeEvent,
  ProseFragment,
  ProseContext,
  SphereVocabulary,
  VoiceMode,
  ChronicleEntry,
} from '../../types/narrative';
import {
  SPHERE_VOCABULARY,
  NARRATIVE_TIERS,
} from '../../types/narrative';

describe('narrative type definitions', () => {
  it('exports all 3 narrative tiers', () => {
    expect(NARRATIVE_TIERS).toEqual(['routine', 'notable', 'chronicle']);
  });

  it('exports sphere vocabulary for all 8 spheres', () => {
    const spheres = Object.keys(SPHERE_VOCABULARY);
    expect(spheres.length).toBe(8);
    for (const sphere of spheres) {
      const vocab = SPHERE_VOCABULARY[sphere as keyof typeof SPHERE_VOCABULARY];
      expect(vocab.adjectives.length).toBeGreaterThanOrEqual(3);
      expect(vocab.verbs.length).toBeGreaterThanOrEqual(3);
      expect(vocab.nouns.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('NarrativeEvent has correct shape', () => {
    const event: NarrativeEvent = {
      id: 'evt_1',
      tier: 'routine',
      eventType: 'action_resolved',
      actorId: 'actor_1',
      description: 'Thane Volkar marched on the fortress',
      tick: 42,
      sphere: 'force',
    };
    expect(event.tier).toBe('routine');
  });

  it('ChronicleEntry has correct shape', () => {
    const entry: ChronicleEntry = {
      id: 'chron_1',
      tier: 'chronicle',
      title: 'The Fall of Iron Gate',
      prose: '',
      promptContext: { actors: [], location: '', sphere: 'force', mood: 'dramatic' },
      tick: 100,
    };
    expect(entry.tier).toBe('chronicle');
  });
});
