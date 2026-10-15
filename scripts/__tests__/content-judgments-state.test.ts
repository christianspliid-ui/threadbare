/**
 * THR-1723 — the blind state drops every declared label, and the extractor reaches step prose.
 */
import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../src/types/unifiedAction';
import { entriesOfKind } from '../../src/data/contentCatalogs';
import {
  buildEncounterState,
  capFields,
  fnv1a,
} from '../content-judgments/encounterState';

const step = (over: Record<string, unknown> = {}) => ({
  reach: 'eye',
  duration: { min: 1, max: 1 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'abort',
  ...over,
});

const fixture = {
  id: 'encounter.fixture.secret_id_marker',
  name: 'The Lantern Audit',
  description: 'A ledger that does not balance, in a town that swears it does.',
  reach: 'gold',
  sphereAffinity: 'order',
  encounterType: 'assist',
  tags: ['#trade', '#relic'],
  steps: [
    step({ narrativeTemplate: 'The clerk lays the ledgers out.', successAfterimage: 'The sums agree at last.' }),
    {
      branchOnStep: 0,
      variants: {
        bold: step({ narrativeTemplate: 'You read the numbers aloud.', failureAfterimage: 'The room goes cold.' }),
      },
      fallback: step({ purposeLine: 'Find where the coin went.' }),
    },
  ],
} as unknown as UnifiedActionTemplate;

describe('buildEncounterState (THR-1723)', () => {
  it('keeps only the title and prose — no id, reach, sphere, encounter type or tags', () => {
    const built = buildEncounterState(fixture, { name: 'The Lantern Audit', description: fixture.description });
    expect(Object.keys(built.state)).toEqual(['encounter']);
    expect(Object.keys(built.state.encounter)).toEqual(['title', 'text']);
    const json = JSON.stringify(built.state);
    expect(json).not.toContain('secret_id_marker');
    expect(json).not.toContain('"gold"');
    expect(json).not.toContain('"order"');
    expect(json).not.toContain('assist');
    expect(json).not.toContain('#trade');
    expect(json).not.toContain('#relic');
    expect(built.state.encounter.text).not.toHaveProperty('name');
  });

  it('records the declared labels beside the state, family tags only', () => {
    const built = buildEncounterState(fixture, undefined);
    expect(built.declared).toEqual({
      reach: 'gold',
      encounterType: 'assist',
      sphereAffinity: 'order',
      familyTags: ['#trade', '#relic'],
    });
  });

  it('adds step narrative, purpose lines and afterimages, branch arms included', () => {
    const text = buildEncounterState(fixture, undefined).state.encounter.text;
    expect(text['step0.narrativeTemplate']).toBe('The clerk lays the ledgers out.');
    expect(text['step0.successAfterimage']).toBe('The sums agree at last.');
    expect(text['step1.bold.failureAfterimage']).toBe('The room goes cold.');
    expect(text['step1.fallback.purposeLine']).toBe('Find where the coin went.');
  });

  it('caps the text in field order and marks the row truncated', () => {
    const capped = capFields([['a', 'xxxx'], ['b', 'yyyy'], ['c', 'zzzz']], 6);
    expect(capped).toEqual({ text: { a: 'xxxx', b: 'yy' }, truncated: true, chars: 6 });
    expect(capFields([['a', 'xx']], 6).truncated).toBe(false);
  });

  it('hashes the state deterministically', () => {
    const a = buildEncounterState(fixture, undefined);
    const b = buildEncounterState(fixture, undefined);
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.contentHash).toBe(fnv1a(JSON.stringify(a.state)));
    expect(fnv1a('')).toBe('811c9dc5');
  });

  it('holds on the live corpus: every Encounter-kind state is title + text only', () => {
    const entries = entriesOfKind('encounter_template');
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const built = buildEncounterState(entry as unknown as UnifiedActionTemplate, undefined);
      expect(Object.keys(built.state.encounter)).toEqual(['title', 'text']);
      expect(JSON.stringify(built.state)).not.toContain(entry.id);
    }
  });
});
