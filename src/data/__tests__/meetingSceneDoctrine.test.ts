/**
 * Image-doctrine invariants for Meet The First scene art (THR-868 audit, 2026-07-30).
 *
 * Ruling 10: a meeting scene omits or silhouettes the agent — the candidate portrait
 * chosen at Sensing is the only human likeness across the flow. The 2026-07-30 audit of
 * all 32 files in `public/assets/meeting/scenes/` found five that violate it (two faces,
 * two baked-in captions, one with the retired choice mechanic painted in as UI buttons).
 *
 * The findings are not the durable artifact — this suite is. Nothing in TypeScript stops
 * an author re-adding `plague-ward.jpg` to the pool, and the defect is invisible to every
 * other test in the repo because a wrong picture type-checks.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  DILEMMA_SCENE_ART,
  QUARANTINED_SCENE_ASSETS,
  selectDilemmaScene,
} from '../meeting-art-library';

/** Every emotional tag authored across the dilemma library, per the audit. */
const AUTHORED_DILEMMA_TAGS = [
  'belonging',
  'protection',
  'sacrifice',
  'loss',
  'devotion',
  'nurturing',
  'compassion',
  'desperation',
  'loyalty',
  'duty',
  'shelter',
  'community',
  'endurance',
] as const;

const basename = (path: string) => path.split('/').pop()!.replace(/\.jpg$/, '');

describe('meeting scene pool — population', () => {
  it('registers a non-trivial pool', () => {
    // Pins the population: every doctrine assertion below is vacuous on an empty pool.
    expect(DILEMMA_SCENE_ART.length).toBeGreaterThanOrEqual(12);
  });

  it('has unique ids and unique asset paths', () => {
    const ids = DILEMMA_SCENE_ART.map((s) => s.id);
    expect(new Set(ids).size, `duplicate ids in ${ids.join(', ')}`).toBe(ids.length);
    const paths = DILEMMA_SCENE_ART.map((s) => s.path);
    expect(new Set(paths).size, `duplicate paths in ${paths.join(', ')}`).toBe(paths.length);
  });

  it('points every entry at a file that exists on disk', () => {
    // A missing scene degrades to the placeholder gradient rather than throwing, so a
    // typo'd path is otherwise silent.
    const missing = DILEMMA_SCENE_ART.filter(
      (s) => !existsSync(join(process.cwd(), 'public', s.path.replace(/^\//, ''))),
    ).map((s) => `${s.id} -> ${s.path}`);
    expect(missing, `scene assets not on disk:\n${missing.join('\n')}`).toEqual([]);
  });
});

describe('meeting scene pool — image doctrine (ruling 10)', () => {
  it('registers no quarantined asset', () => {
    const violations = DILEMMA_SCENE_ART.filter(
      (s) => basename(s.path) in QUARANTINED_SCENE_ASSETS,
    ).map((s) => `${s.id} -> ${basename(s.path)}: ${QUARANTINED_SCENE_ASSETS[basename(s.path)]}`);
    expect(
      violations,
      `quarantined scene art is registered:\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  it('keeps the quarantine list non-empty and documented', () => {
    // Guard against the quarantine being emptied to make the assertion above pass.
    const entries = Object.entries(QUARANTINED_SCENE_ASSETS);
    expect(entries.length).toBeGreaterThanOrEqual(5);
    for (const [name, reason] of entries) {
      expect(reason.length, `${name} has no stated reason`).toBeGreaterThan(20);
      // The file must still be on disk — a quarantine entry for a deleted file is dead
      // weight that reads as protection.
      expect(
        existsSync(join(process.cwd(), 'public/assets/meeting/scenes', `${name}.jpg`)),
        `${name}.jpg is quarantined but not on disk`,
      ).toBe(true);
    }
  });

  it('cannot select a quarantined asset for any authored dilemma tag', () => {
    // The behavioural version of the assertion above: `plague-ward` was not a theoretical
    // risk, it was reachable — a dilemma tagged 'sacrifice' or 'compassion' scored it top
    // and rendered it. Sweep every authored tag, every subset of size 1, and both seeds
    // the beat actually passes (the formative test index, 0 or 1).
    const selected = new Set<string>();
    for (const tag of AUTHORED_DILEMMA_TAGS) {
      for (const seed of [0, 1]) selected.add(basename(selectDilemmaScene([tag], seed).path));
    }
    // Plus the empty-tag case, where every scene ties and the seed picks off the head.
    for (const seed of [0, 1]) selected.add(basename(selectDilemmaScene([], seed).path));

    const reachableQuarantined = [...selected].filter((n) => n in QUARANTINED_SCENE_ASSETS);
    expect(
      reachableQuarantined,
      `selector reaches quarantined art: ${reachableQuarantined.join(', ')}`,
    ).toEqual([]);
    // Non-vacuity: the sweep must actually be selecting things.
    expect(selected.size).toBeGreaterThan(1);
  });
});

describe('meeting scene pool — tag coverage', () => {
  it('covers every authored dilemma tag with at least one scene', () => {
    // Without this, a tag falls through to the all-tied path and the beat shows the head
    // of the array regardless of what the dilemma is about.
    const pooled = new Set(DILEMMA_SCENE_ART.flatMap((s) => s.emotionalTags));
    const uncovered = AUTHORED_DILEMMA_TAGS.filter((t) => !pooled.has(t));
    expect(uncovered, `dilemma tags no scene answers: ${uncovered.join(', ')}`).toEqual([]);
  });

  it('is deterministic for a given tag set and seed', () => {
    for (const tag of AUTHORED_DILEMMA_TAGS) {
      const a = selectDilemmaScene([tag], 0);
      const b = selectDilemmaScene([tag], 0);
      expect(a.id).toBe(b.id);
    }
  });

  it('never throws on an unknown tag or a negative seed', () => {
    expect(() => selectDilemmaScene(['not_a_real_tag'], -7)).not.toThrow();
    expect(selectDilemmaScene(['not_a_real_tag'], -7).path).toBeTruthy();
  });
});
