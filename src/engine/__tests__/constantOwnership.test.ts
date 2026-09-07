/**
 * THR-1422 — one declaration per shared constant, across the four pairs that
 * were declared twice with no shared source.
 *
 * The pairs, and why each owner is the owner:
 *
 *   SEA_LEVEL              engine/worldgen/constants.ts owns it; the renderer's
 *                          waterPalette.ts re-exports. Worldgen writes the
 *                          elevations the palette colours, so moving the line in
 *                          one place must move it in the other — otherwise the
 *                          map paints water where the engine says land.
 *
 *   TRUST_* (three)        data/agent-behavior-constants.ts owns them (it is the
 *                          tuning surface, carrying the @range annotations the
 *                          CMS panel renders); types/disposition.ts re-exports.
 *
 *   REACH_TO_SPHERE        data/premonition-constants.ts owns both; the engine
 *   SPHERE_COLORS          reads REACH_TO_SPHERE (phaseDivinePremonition,
 *                          premonitionCompulsion), so a component module cannot
 *                          own it without inverting the layering.
 *                          components/icons/constants.ts re-exports.
 *
 * ── Why this test reads source text rather than comparing values ──
 *
 * The obvious guard is the one that cannot work. Both copies of every constant
 * held *equal* values, so:
 *
 *   expect(waterPalette.SEA_LEVEL).toBe(0.38)      // passes before the fix
 *   expect(waterPalette.SEA_LEVEL).toBe(wg.SEA_LEVEL)  // also passes before it
 *
 * Numbers compare by value, so identity is unavailable for primitives and a
 * cross-module equality assertion holds in exactly the duplicated world this
 * ticket exists to leave. That is the threshold-constant-on-both-sides shape:
 * the constant used as its own fixture, a guard that can never fire.
 *
 * A runtime-namespace sweep (the THR-1409 guard, `src/engine/__tests__/
 * worldgenConstantOwnership.test.ts`) does not work here either: that fix
 * *deleted* its duplicates, whereas these four are repaired by re-export, and a
 * re-exported name is still a key of the mirror module's namespace.
 *
 * So single-ownership is asserted where it is actually visible — in the source:
 * the owner declares the constant, the mirror does not. Each check carries a
 * detector-proof arm asserting the same regex *does* fire on the owner, so a
 * pattern that silently stopped matching anything fails here rather than
 * reporting universal compliance.
 *
 * The value comparisons below are kept as a second, weaker guard — not for
 * duplication, which they cannot see, but to catch a mirror re-pointed at some
 * third module that happens to disagree.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import * as worldgenConstants from '../worldgen/constants';
import * as waterPalette from '../../components/HexMapV2/palette/waterPalette';
import * as agentBehavior from '../../data/agent-behavior-constants';
import * as disposition from '../../types/disposition';
import * as premonition from '../../data/premonition-constants';
import * as iconConstants from '../../components/icons/constants';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Strip block and line comments before matching. This file's own repair notes
 * name these constants in prose; a doc-comment must never read as a
 * declaration, in either direction.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Matches a literal declaration — `export const NAME = …` or `const NAME: T = …`. */
function declarationCount(source: string, name: string): number {
  const pattern = new RegExp(String.raw`^\s*(?:export\s+)?const\s+${name}\b\s*(?::[^=]*)?=`, 'gm');
  return (stripComments(source).match(pattern) ?? []).length;
}

function read(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

interface Pair {
  readonly names: readonly string[];
  readonly owner: string;
  readonly mirrors: readonly string[];
}

const PAIRS: readonly Pair[] = [
  {
    names: ['SEA_LEVEL'],
    owner: 'src/engine/worldgen/constants.ts',
    mirrors: ['src/components/HexMapV2/palette/waterPalette.ts'],
  },
  {
    names: ['TRUST_COOPERATE_DELTA', 'TRUST_DEFECT_DELTA', 'TRUST_DECAY_PER_TICK'],
    owner: 'src/data/agent-behavior-constants.ts',
    mirrors: ['src/types/disposition.ts'],
  },
  {
    names: ['REACH_TO_SPHERE', 'SPHERE_COLORS'],
    owner: 'src/data/premonition-constants.ts',
    mirrors: ['src/components/icons/constants.ts'],
  },
];

describe('shared constant ownership (THR-1422)', () => {
  it('the declaration detector fires on every owner', () => {
    // Falsification arm. Without this, a regex that matched nothing would make
    // every "mirror declares it zero times" assertion below trivially true —
    // the test would report perfect compliance on a codebase it cannot read.
    const missing: string[] = [];
    for (const { names, owner } of PAIRS) {
      const source = read(owner);
      for (const name of names) {
        const count = declarationCount(source, name);
        if (count !== 1) missing.push(`${owner} declares ${name} ${count} times, expected exactly 1`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the detector rejects a comment that merely mentions a declaration', () => {
    // Second falsification arm, for the stripper rather than the pattern: prose
    // naming a constant must not register as declaring it, or a mirror could
    // "pass" by deleting code and keeping the comment — or fail for the reverse.
    const commentedOut = `
      /** Historically: export const SEA_LEVEL = 0.38; */
      // export const SEA_LEVEL = 0.38;
    `;
    expect(declarationCount(commentedOut, 'SEA_LEVEL')).toBe(0);
    expect(declarationCount('export const SEA_LEVEL = 0.38;', 'SEA_LEVEL')).toBe(1);
    expect(declarationCount('export const SEA_LEVEL: number = 0.38;', 'SEA_LEVEL')).toBe(1);
  });

  it('no mirror module redeclares a constant its owner declares', () => {
    const duplicates: string[] = [];
    for (const { names, owner, mirrors } of PAIRS) {
      for (const mirror of mirrors) {
        const source = read(mirror);
        for (const name of names) {
          const count = declarationCount(source, name);
          if (count > 0) {
            duplicates.push(
              `${mirror} declares ${name} (${count}×) — ${owner} owns it; re-export instead`,
            );
          }
        }
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('every mirror still exports the name, so no consumer lost its import', () => {
    // The repair must be non-breaking: these names were importable from the
    // mirror modules before, and every existing import site still resolves.
    expect(waterPalette).toHaveProperty('SEA_LEVEL');
    expect(disposition).toHaveProperty('TRUST_COOPERATE_DELTA');
    expect(disposition).toHaveProperty('TRUST_DEFECT_DELTA');
    expect(disposition).toHaveProperty('TRUST_DECAY_PER_TICK');
    expect(iconConstants).toHaveProperty('REACH_TO_SPHERE');
    expect(iconConstants).toHaveProperty('SPHERE_COLORS');
  });

  it('each mirror resolves to its owner’s value, not a third source', () => {
    expect(waterPalette.SEA_LEVEL).toBe(worldgenConstants.SEA_LEVEL);

    expect(disposition.TRUST_COOPERATE_DELTA).toBe(agentBehavior.TRUST_COOPERATE_DELTA);
    expect(disposition.TRUST_DEFECT_DELTA).toBe(agentBehavior.TRUST_DEFECT_DELTA);
    expect(disposition.TRUST_DECAY_PER_TICK).toBe(agentBehavior.TRUST_DECAY_PER_TICK);

    // Objects, so identity here is a real single-binding assertion — unlike the
    // primitives above, these two cannot pass by coincidence of equal values.
    expect(iconConstants.REACH_TO_SPHERE).toBe(premonition.REACH_TO_SPHERE);
    expect(iconConstants.SPHERE_COLORS).toBe(premonition.SPHERE_COLORS);
  });

  it('SPHERE_COLORS_BASE stays a distinct map, not collapsed into SPHERE_COLORS', () => {
    // Out of scope for the de-duplication by design: it is a genuinely different
    // (more saturated) palette. If a later sweep "tidies" it into an alias, the
    // icons surface silently loses a colour scheme.
    expect(iconConstants.SPHERE_COLORS_BASE).not.toBe(iconConstants.SPHERE_COLORS);
    expect(iconConstants.SPHERE_COLORS_BASE.force).not.toBe(iconConstants.SPHERE_COLORS.force);
    expect(Object.keys(iconConstants.SPHERE_COLORS_BASE)).toHaveLength(12);
  });

  it('the cosmology map still covers all eight reaches with Creation spheres', () => {
    const FOUNDATION = new Set(['chaos', 'order', 'light', 'darkness']);
    const reaches = Object.keys(premonition.REACH_TO_SPHERE);
    expect(reaches).toHaveLength(8);
    for (const [reach, sphere] of Object.entries(premonition.REACH_TO_SPHERE)) {
      expect(FOUNDATION.has(sphere), `${reach} maps to Foundation sphere ${sphere}`).toBe(false);
      expect(premonition.SPHERE_COLORS[sphere], `${sphere} has no colour`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
