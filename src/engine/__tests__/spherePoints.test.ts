import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SPHERE_NAMES } from '../../types';
import {
  deriveAlignmentFromPoints,
  distributeBySpherePoints,
  getSpherePoints,
  getSpherePointsSource,
  presetFromAlignment,
  validateSpherePoints,
} from '../spherePoints';
import {
  HUNGER_PRESET_PRIMARY_POINTS,
  HUNGER_PRESET_SECONDARY_POINTS,
  SPHERE_POINT_BUDGET,
  SPHERE_POINT_CAP,
  UNBOUGHT_SPHERE_INCOME_SHARE,
  sphereLeftToPourWord,
} from '../../data/sphere-points-content';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { WorldGraph } from '../graph';
import { createAscendant } from '../ascendant';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import type { AscendantArchetype } from '../../types/influence';

describe('sphere-points constants (THR-1749)', () => {
  it('preset spends exactly the budget and respects the cap', () => {
    expect(HUNGER_PRESET_PRIMARY_POINTS + HUNGER_PRESET_SECONDARY_POINTS).toBe(SPHERE_POINT_BUDGET);
    expect(HUNGER_PRESET_PRIMARY_POINTS).toBeLessThanOrEqual(SPHERE_POINT_CAP);
  });

  it('the twelve floors leave a positive remainder to share', () => {
    expect(SPHERE_NAMES.length * UNBOUGHT_SPHERE_INCOME_SHARE).toBeLessThan(1);
  });
});

describe('sphereLeftToPourWord', () => {
  it('bands the budget of 5 as authored', () => {
    expect([5, 4, 3, 2, 1, 0].map(r => sphereLeftToPourWord(r))).toEqual(
      ['all of you', 'most of you', 'most of you', 'some', 'a little', 'nothing']);
  });
  it('follows a retuned budget', () => {
    expect(sphereLeftToPourWord(5, 7)).toBe('most of you');
    expect(sphereLeftToPourWord(3, 7)).toBe('some');
    expect(sphereLeftToPourWord(7, 7)).toBe('all of you');
  });
});

describe('validateSpherePoints', () => {
  it('accepts the four legal shapes', () => {
    expect(validateSpherePoints({ mind: 3, spirit: 2 }).ok).toBe(true);
    expect(validateSpherePoints({ force: 3, matter: 1, life: 1 }).ok).toBe(true);
    expect(validateSpherePoints({ force: 2, matter: 2, life: 1 }).ok).toBe(true);
    expect(validateSpherePoints({ force: 2, matter: 1, life: 1, energy: 1 }).ok).toBe(true);
  });

  it.each([
    [{ light: 3, mind: 2 }, 'foundation_sphere'],
    [{ mind: 4, spirit: 1 }, 'over_cap'],
    [{ mind: 2.5, spirit: 2.5 }, 'not_whole'],
    [{ mind: 3, spirit: 1 }, 'wrong_total'],
    [{ force: 3, mind: 2 }, 'both_poles'],
    [{ life: 2, entropy: 1, mind: 2 }, 'both_poles'],
  ])('rejects %j as %s', (p, reason) => {
    expect(validateSpherePoints(p)).toEqual({ ok: false, reason });
  });

  it('rejects a missing vector', () => {
    expect(validateSpherePoints(undefined).ok).toBe(false);
  });
});

describe('deriveAlignmentFromPoints', () => {
  it('names the two largest', () => {
    expect(deriveAlignmentFromPoints({ spirit: 2, mind: 3 })).toEqual({ primary: 'mind', secondary: 'spirit' });
  });

  it('breaks ties in canonical sphere order', () => {
    // canonical Creation order: force, matter, energy, life, mind, spirit, time, entropy
    expect(deriveAlignmentFromPoints({ spirit: 2, matter: 2, life: 1 })).toEqual({ primary: 'matter', secondary: 'spirit' });
  });

  it('returns null for fewer than two spheres', () => {
    expect(deriveAlignmentFromPoints({ mind: 5 })).toBeNull();
    expect(deriveAlignmentFromPoints({})).toBeNull();
  });
});

describe('getSpherePoints', () => {
  it('prefers the stored vector', () => {
    const props = { spherePoints: { force: 2, matter: 2, life: 1 }, sphereAlignment: { primary: 'mind', secondary: 'spirit' } };
    expect(getSpherePoints(props)).toEqual({ force: 2, matter: 2, life: 1 });
    expect(getSpherePointsSource(props)).toBe('bought');
  });

  it('falls back to the preset from the pair', () => {
    const props = { sphereAlignment: { primary: 'mind', secondary: 'spirit' } };
    expect(getSpherePoints(props)).toEqual({ mind: 3, spirit: 2 });
    expect(getSpherePointsSource(props)).toBe('fallback');
  });

  it('returns {} with neither', () => {
    expect(getSpherePoints({})).toEqual({});
    expect(getSpherePoints(undefined)).toEqual({});
  });
});

describe('distributeBySpherePoints — the measured-effect table', () => {
  const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);
  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

  it('3/2 (any preset): 0.352 / 0.248 / 0.04', () => {
    const r = distributeBySpherePoints(1, { mind: 3, spirit: 2 });
    close(r.mind, 0.352); close(r.spirit, 0.248); close(r.force, 0.04); close(r.light, 0.04);
    close(sum(r), 1);
  });

  it('3/1/1: 0.352 / 0.144 / 0.144', () => {
    const r = distributeBySpherePoints(1, { force: 3, matter: 1, life: 1 });
    close(r.force, 0.352); close(r.matter, 0.144); close(r.life, 0.144); close(r.time, 0.04);
    close(sum(r), 1);
  });

  it('2/2/1: 0.248 / 0.248 / 0.144', () => {
    const r = distributeBySpherePoints(1, { force: 2, matter: 2, life: 1 });
    close(r.force, 0.248); close(r.matter, 0.248); close(r.life, 0.144);
    close(sum(r), 1);
  });

  it('2/1/1/1: 0.248 / 0.144 ×3', () => {
    const r = distributeBySpherePoints(1, { force: 2, matter: 1, life: 1, energy: 1 });
    close(r.force, 0.248); close(r.matter, 0.144); close(r.life, 0.144); close(r.energy, 0.144);
    close(sum(r), 1);
  });

  it('a sphere with no points — Foundation included — earns the floor, never zero', () => {
    const total = 2.1;
    const r = distributeBySpherePoints(total, { mind: 3, spirit: 2 });
    for (const s of ['chaos', 'order', 'light', 'darkness', 'force', 'entropy'] as const) {
      close(r[s], total * UNBOUGHT_SPHERE_INCOME_SHARE);
      expect(r[s]).toBeGreaterThan(0);
    }
  });

  it('with no points shares income equally and loses none', () => {
    const r = distributeBySpherePoints(1.2, {});
    close(sum(r), 1.2);
    close(r.force, 0.1);
  });
});

describe('hunger catalog presets (THR-1749 E6)', () => {
  it.each(HUNGER_CATALOG.map(h => [h.id, h]))('%s preset validates', (_id, h) => {
    expect(validateSpherePoints(presetFromAlignment(h.sphereAlignment))).toEqual({ ok: true });
  });

  it('haunt, illuminate and reshape carry their canon pairs', () => {
    const byId = Object.fromEntries(HUNGER_CATALOG.map(h => [h.id, h.sphereAlignment]));
    expect(byId.haunt).toEqual({ primary: 'spirit', secondary: 'entropy' });
    expect(byId.illuminate).toEqual({ primary: 'mind', secondary: 'energy' });
    expect(byId.reshape).toEqual({ primary: 'force', secondary: 'matter' });
  });
});

describe('createAscendant writes the vector (THR-1749 E3)', () => {
  const archetype = (over: Partial<AscendantArchetype> = {}): AscendantArchetype => ({
    id: 'test',
    name: 'Test',
    title: 'Test',
    description: '',
    sphereAlignment: { primary: 'mind', secondary: 'spirit' },
    startingDomainAffinities: {},
    personalitySeed: {} as AscendantArchetype['personalitySeed'],
    flavorText: '',
    ...over,
  });
  const build = (a: AscendantArchetype) => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    const { ascendantId } = createAscendant(graph, { archetype: a, avatar: { name: 'Av', formDescription: '', startLocationId: 'loc.a' } });
    return graph.getNode(ascendantId)!.properties;
  };

  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('a valid buy is stored and the pair is derived from it', () => {
    const props = build(archetype({ spherePoints: { force: 2, matter: 2, life: 1 } }));
    expect(props.spherePoints).toEqual({ force: 2, matter: 2, life: 1 });
    expect(props.sphereAlignment).toEqual({ primary: 'force', secondary: 'matter' });
    expect(getSpherePointsSource(props)).toBe('bought');
    expect(getTraces().some(t => t.category === 'sphere_points.fallback')).toBe(false);
  });

  it('a missing buy writes the preset and traces the fallback', () => {
    const props = build(archetype());
    expect(props.spherePoints).toEqual({ mind: 3, spirit: 2 });
    expect(props.sphereAlignment).toEqual({ primary: 'mind', secondary: 'spirit' });
    const trace = getTraces().find(t => t.category === 'sphere_points.fallback');
    expect(trace).toMatchObject({ reason: 'missing' });
    // The fallback also stores the preset in spherePoints; the stamp still reads it as fallback.
    expect(getSpherePointsSource(props)).toBe('fallback');
  });

  it('an invalid buy falls back with its reason', () => {
    const props = build(archetype({ spherePoints: { force: 3, mind: 2 } }));
    expect(props.spherePoints).toEqual({ mind: 3, spirit: 2 });
    expect(getTraces().find(t => t.category === 'sphere_points.fallback')).toMatchObject({ reason: 'both_poles' });
    expect(getSpherePointsSource(props)).toBe('fallback');
  });
});
