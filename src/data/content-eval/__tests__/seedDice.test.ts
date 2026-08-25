/**
 * The Seed Dice. THR-1224.
 *
 * Contract: `nudge-authoring-spec.md` § *The Seed Dice*. The face counts are
 * pinned against the spec's own headings, because a die that quietly loses a
 * face still rolls, still looks deterministic, and makes one shape unreachable
 * forever — the exact rot `plotHookCatalogViolations` was written for.
 */

import { describe, expect, it } from 'vitest';

import { PLOT_HOOK_THEMES } from '../plotHooks';
import {
  AGENT_ROLE_FACES,
  DISPOSITIONS,
  OPPOSITION_ACTIVITIES,
  OPPOSITION_FACES,
  SCALE_FACES,
  SEED_DICE_BATCH_BOUNDS,
  STAKE_FACES,
  THEME_NATURAL_SHAPES,
  rollSeedDice,
  seedDiceCatalogViolations,
  type StakeShape,
} from '../seedDice';

// ─── Catalog health ──────────────────────────────────────────────────

describe('seedDiceCatalogViolations', () => {
  it('reports nothing for the shipped tables', () => {
    expect(seedDiceCatalogViolations()).toEqual([]);
  });

  it('pins each die to the face count the spec states', () => {
    expect(STAKE_FACES).toHaveLength(8);
    expect(OPPOSITION_FACES).toHaveLength(8);
    expect(DISPOSITIONS).toHaveLength(5);
    expect(AGENT_ROLE_FACES).toHaveLength(7);
    expect(SCALE_FACES).toHaveLength(4);
  });

  it('covers every plot-hook theme in the suggestion table', () => {
    // A theme with no row would make `shapesForThemes` silently return nothing
    // for hooks carrying it — a coverage hole that reads as "this hook suggests
    // no shapes" rather than as a missing table row.
    for (const theme of PLOT_HOOK_THEMES) {
      expect(THEME_NATURAL_SHAPES[theme], `no shapes for '${theme}'`).toBeDefined();
      expect(THEME_NATURAL_SHAPES[theme].length).toBeGreaterThan(0);
    }
  });

  it('suggests only shapes the stake die can actually roll', () => {
    const rollable = new Set<StakeShape>(STAKE_FACES.map(face => face.id));
    for (const [theme, shapes] of Object.entries(THEME_NATURAL_SHAPES)) {
      for (const shape of shapes) {
        expect(rollable.has(shape), `'${theme}' suggests unrollable '${shape}'`).toBe(true);
      }
    }
  });

  it('leaves every stake shape reachable from at least one theme', () => {
    // Not required by the spec, but a shape no theme ever suggests can only
    // arrive by roll — worth knowing if it ever becomes true.
    const suggested = new Set(Object.values(THEME_NATURAL_SHAPES).flat());
    expect([...STAKE_FACES.map(f => f.id)].filter(id => !suggested.has(id))).toEqual([]);
  });

  it('marks exactly terrain and time as unwilled', () => {
    // The spec: "Terrain and time roll n/a." Everything else has a stance,
    // including the mortal's own trait.
    const unwilled = OPPOSITION_FACES.filter(face => !face.willed).map(face => face.id);
    expect(unwilled.sort()).toEqual(['terrain', 'time']);
  });

  it('gives every opposition a non-empty motive column', () => {
    for (const face of OPPOSITION_FACES) {
      expect(face.motives.length, `${face.id} has no motives`).toBeGreaterThan(0);
    }
  });

  it('needs a named owner on exactly plea and contest', () => {
    const owners = STAKE_FACES.filter(face => face.needsNamedOwner).map(face => face.id);
    expect(owners.sort()).toEqual(['contest', 'plea']);
  });
});

// ─── Determinism ─────────────────────────────────────────────────────

describe('rollSeedDice', () => {
  it('is a pure function of the brief seed', () => {
    // What makes a recorded roll checkable by anyone who doubts it.
    const a = rollSeedDice({ briefSeed: 'retrofit-batch-2-ward-the-camp' });
    const b = rollSeedDice({ briefSeed: 'retrofit-batch-2-ward-the-camp' });
    expect(a).toEqual(b);
  });

  it('gives different briefs different rolls', () => {
    // Weak by construction — two seeds *could* collide on one die — so the
    // assertion is over the whole five-face tuple, where collision is unlikely
    // enough to be a real signal that seeding is wired.
    const a = rollSeedDice({ briefSeed: 'brief-alpha' });
    const b = rollSeedDice({ briefSeed: 'brief-beta' });
    const tuple = (r: typeof a) =>
      [r.stake.id, r.opposition.id, r.disposition, r.agentRole.id, r.scale].join('|');
    expect(tuple(a)).not.toBe(tuple(b));
  });

  it('rolls n/a disposition and no activity for an unwilled opposition', () => {
    // Seeds chosen by search, not by hand — the property has to be demonstrated
    // on a real roll or the branch is untested.
    const unwilled = Array.from({ length: 200 }, (_, i) => rollSeedDice({ briefSeed: `s${i}` }))
      .filter(roll => !roll.opposition.willed);
    expect(unwilled.length, 'no unwilled opposition in 200 rolls').toBeGreaterThan(0);
    for (const roll of unwilled) {
      expect(roll.disposition).toBeUndefined();
      expect(roll.activity).toBeUndefined();
    }
  });

  it('rolls a disposition and an activity for a willed opposition', () => {
    const willed = Array.from({ length: 200 }, (_, i) => rollSeedDice({ briefSeed: `s${i}` }))
      .filter(roll => roll.opposition.willed);
    expect(willed.length).toBeGreaterThan(0);
    for (const roll of willed) {
      expect(DISPOSITIONS).toContain(roll.disposition);
      expect(OPPOSITION_ACTIVITIES).toContain(roll.activity);
    }
  });

  it('always rolls a motive from its own opposition\'s column', () => {
    for (let i = 0; i < 200; i++) {
      const roll = rollSeedDice({ briefSeed: `motive-${i}` });
      expect(
        roll.opposition.motives,
        `${roll.opposition.id} got motive '${roll.motive}'`,
      ).toContain(roll.motive);
    }
  });

  it('reaches every face of every die across enough seeds', () => {
    // The population guard. A die wired to a constant seed, or one whose weights
    // exclude a face, passes every test above and is caught only here.
    const rolls = Array.from({ length: 400 }, (_, i) => rollSeedDice({ briefSeed: `cover-${i}` }));
    expect(new Set(rolls.map(r => r.stake.id)).size).toBe(STAKE_FACES.length);
    expect(new Set(rolls.map(r => r.opposition.id)).size).toBe(OPPOSITION_FACES.length);
    expect(new Set(rolls.map(r => r.agentRole.id)).size).toBe(AGENT_ROLE_FACES.length);
    expect(new Set(rolls.map(r => r.scale)).size).toBe(SCALE_FACES.length);
    expect(new Set(rolls.filter(r => r.disposition).map(r => r.disposition)).size).toBe(
      DISPOSITIONS.length,
    );
  });

  it('carries the stake face\'s authoring guidance with the roll', () => {
    const roll = rollSeedDice({ briefSeed: 'guidance' });
    expect(roll.stake.p2Must).toBeTruthy();
    expect(roll.stake.closingFormat).toBeTruthy();
  });
});

// ─── The advisory suggestion ─────────────────────────────────────────

describe('rollSeedDice — theme suggestions', () => {
  it('derives suggestions from the themes passed in', () => {
    const roll = rollSeedDice({ briefSeed: 'themes', themes: ['journey'] });
    expect([...roll.suggestedShapes].sort()).toEqual(['obstruction', 'unmitigated_risk']);
  });

  it('unions multiple themes without duplicating a shared shape', () => {
    // protection → threat · plea; conflict → threat · contest. `threat` is in
    // both and must appear once.
    const roll = rollSeedDice({ briefSeed: 'themes', themes: ['protection', 'conflict'] });
    expect(roll.suggestedShapes.filter(s => s === 'threat')).toHaveLength(1);
  });

  it('suggests nothing when no themes are supplied', () => {
    expect(rollSeedDice({ briefSeed: 'themes' }).suggestedShapes).toEqual([]);
  });

  it('does NOT let the suggestion bias the stake roll', () => {
    // The load-bearing property. The spec puts the theme→shape suggestion at the
    // *advisory* tier; weighting the die by it would quietly promote it to
    // binding and reconverge the corpus on the shapes themes already favour —
    // which is the default the die exists to break.
    const withThemes = rollSeedDice({ briefSeed: 'unbiased', themes: ['journey'] });
    const without = rollSeedDice({ briefSeed: 'unbiased' });
    expect(withThemes.stake.id).toBe(without.stake.id);
  });
});

// ─── Batch bounds ────────────────────────────────────────────────────

describe('SEED_DICE_BATCH_BOUNDS', () => {
  it('states caps a batch can actually satisfy', () => {
    // A cap of 2 over a 6-slot batch needs at least 3 distinct faces to exist.
    expect(STAKE_FACES.length).toBeGreaterThan(SEED_DICE_BATCH_BOUNDS.stakeCap);
    expect(OPPOSITION_FACES.length).toBeGreaterThan(SEED_DICE_BATCH_BOUNDS.oppositionCap);
    expect(AGENT_ROLE_FACES.length).toBeGreaterThan(SEED_DICE_BATCH_BOUNDS.agentRoleCap);
    expect(SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor).toBeGreaterThan(0);
  });

  it('leaves settlement-or-larger reachable', () => {
    expect(SCALE_FACES).toContain('settlement');
    expect(SCALE_FACES).toContain('region');
  });
});
