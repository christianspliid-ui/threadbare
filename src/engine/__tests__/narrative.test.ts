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
import {
  generateRoutineProse,
  pickSphereWord,
  generateNotableProse,
  buildChronicleEntry,
  classifyEvent,
  routeEvent,
} from '../narrative';

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

describe('routine prose generation (tier 1)', () => {
  it('generates prose for action_resolved events', () => {
    const context: ProseContext = {
      actorName: 'Thane Volkar',
      targetName: 'the Border Fortress',
      sphere: 'force',
    };
    const prose = generateRoutineProse('action_resolved', context, 42);
    expect(prose.text.length).toBeGreaterThan(10);
    expect(prose.text).toContain('Volkar');
    expect(prose.tier).toBe('routine');
    expect(prose.voice).toBe('third_person_omniscient');
  });

  it('generates prose for trait_acquired events', () => {
    const context: ProseContext = {
      actorName: 'Kira the Scout',
      sphere: 'mind',
    };
    const prose = generateRoutineProse('trait_acquired', context, 42);
    expect(prose.text.length).toBeGreaterThan(10);
    expect(prose.tier).toBe('routine');
  });

  it('generates prose for divine_intervention events with second person', () => {
    const context: ProseContext = {
      actorName: 'a sleeping warrior',
      sphere: 'spirit',
    };
    const prose = generateRoutineProse('divine_intervention', context, 42);
    expect(prose.text.length).toBeGreaterThan(10);
    expect(prose.voice).toBe('second_person');
  });

  it('pickSphereWord returns a word from the sphere vocabulary', () => {
    const adj = pickSphereWord('force', 'adjectives', 42);
    expect(typeof adj).toBe('string');
    expect(adj.length).toBeGreaterThan(0);
  });

  it('generates deterministically for same seed', () => {
    const context: ProseContext = { actorName: 'Volkar', sphere: 'force' };
    const a = generateRoutineProse('action_resolved', context, 99);
    const b = generateRoutineProse('action_resolved', context, 99);
    expect(a.text).toBe(b.text);
  });
});

describe('notable prose generation (tier 2)', () => {
  it('generates longer prose than routine', () => {
    const context: ProseContext = {
      actorName: 'Champion Arven',
      targetName: 'the Crystal Spire',
      sphere: 'energy',
      dominantValues: ['courage_prudence', 'sacrifice_survival'],
    };
    const prose = generateNotableProse('action_critical', context, 42);
    expect(prose.text.length).toBeGreaterThan(50);
    expect(prose.tier).toBe('notable');
  });

  it('includes personality flavoring when values provided', () => {
    const context: ProseContext = {
      actorName: 'The Cunning Fox',
      sphere: 'mind',
      dominantValues: ['honesty_cunning'],
    };
    const prose = generateNotableProse('trait_acquired', context, 42);
    expect(prose.text.length).toBeGreaterThan(30);
  });

  it('uses dramatic present for doom events', () => {
    const context: ProseContext = {
      locationName: 'the Northern Reach',
      sphere: 'entropy',
    };
    const prose = generateNotableProse('doom_escalation', context, 42);
    expect(prose.voice).toBe('dramatic_present');
  });
});

describe('chronicle prompt builder (tier 3)', () => {
  it('builds a chronicle entry with structured prompt context', () => {
    const entry = buildChronicleEntry({
      id: 'chron_1',
      title: 'The Fall of Iron Gate',
      actors: ['Thane Volkar', 'The Iron Judge'],
      location: 'Iron Gate Fortress',
      sphere: 'force',
      mood: 'tragic',
      tick: 100,
      previousEvents: ['The siege began', 'Defenders rallied'],
    });

    expect(entry.tier).toBe('chronicle');
    expect(entry.title).toBe('The Fall of Iron Gate');
    expect(entry.promptContext.actors).toEqual(['Thane Volkar', 'The Iron Judge']);
    expect(entry.promptContext.sphere).toBe('force');
    expect(entry.promptContext.mood).toBe('tragic');
    expect(entry.prose).toBe('');
  });

  it('includes previous events for narrative continuity', () => {
    const entry = buildChronicleEntry({
      id: 'chron_2',
      title: 'The Ascension',
      actors: ['Kira'],
      location: 'The Crystal Spire',
      sphere: 'spirit',
      mood: 'triumphant',
      tick: 200,
      previousEvents: ['The trial of faith', 'The burning vision'],
    });

    expect(entry.promptContext.previousEvents).toHaveLength(2);
  });
});

describe('content pipeline router', () => {
  it('classifies ordinary action_resolved as routine', () => {
    expect(classifyEvent('action_resolved', [])).toBe('routine');
  });

  it('classifies action_critical as notable', () => {
    expect(classifyEvent('action_critical', [])).toBe('notable');
  });

  it('classifies doom_escalation as chronicle', () => {
    expect(classifyEvent('doom_escalation', [])).toBe('chronicle');
  });

  it('classifies tier_transition as notable', () => {
    expect(classifyEvent('tier_transition', [])).toBe('notable');
  });

  it('classifies contested_action as notable', () => {
    expect(classifyEvent('contested_action', [])).toBe('notable');
  });

  it('routeEvent produces prose for routine events', () => {
    const event: NarrativeEvent = {
      id: 'evt_1', tier: 'routine', eventType: 'action_resolved',
      actorId: 'actor_1', description: 'marched', tick: 10, sphere: 'force',
    };
    const result = routeEvent(event, { actorName: 'Volkar', sphere: 'force' }, 42);
    expect(result.tier).toBe('routine');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('routeEvent produces prose for notable events', () => {
    const event: NarrativeEvent = {
      id: 'evt_2', tier: 'notable', eventType: 'action_critical',
      actorId: 'actor_1', description: 'critical hit', tick: 20, sphere: 'energy',
    };
    const result = routeEvent(event, { actorName: 'Arven', sphere: 'energy' }, 42);
    expect(result.tier).toBe('notable');
    expect(result.text.length).toBeGreaterThan(50);
  });
});
