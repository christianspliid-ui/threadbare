/**
 * Single action-art registry (THR-740).
 *
 * `codexRegistry.ts` used to declare its own `ACTION_ART` copy directly under a comment
 * claiming it imported the canonical one. Any new card art needed two edits or the codex
 * silently drifted. These tests pin the consolidated shape: one map in `src/`, and codex
 * thumbnails that resolve through it.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { ACTION_ART, getActionArt } from '../../Game/actionArt';
import { getAllCodexEntries } from '../codexRegistry';

/** Recursively collect every .ts/.tsx file under `src/`. */
function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectSourceFiles(full, acc);
    else if (/\.tsx?$/.test(name)) acc.push(full);
  }
  return acc;
}

describe('THR-740 — single action-art registry', () => {
  it('declares ACTION_ART in exactly one file under src/', () => {
    const files = collectSourceFiles('src');
    // Guard the guard: if the walk finds nothing, the assertion below is vacuous.
    expect(files.length).toBeGreaterThan(100);

    // Match `:` (typed) and `=` (untyped) so a future copy that omits the annotation
    // cannot slip past — the on-disk source is untransformed, but the shape can vary.
    const declaring = files.filter(f =>
      /(?:const|let|var)\s+ACTION_ART\s*(?::|=)/.test(readFileSync(f, 'utf8')),
    );

    expect(declaring.map(f => f.replace(/\\/g, '/'))).toEqual([
      'src/components/Game/actionArt.ts',
    ]);
  });

  it('resolves every codex action thumbnail through getActionArt', () => {
    const entries = getAllCodexEntries();
    const arted = entries.filter(e => e.id in ACTION_ART);

    // The codex copy carried 79 action rows before consolidation; if this sample
    // collapses toward zero the equality assertion below stops proving anything.
    expect(arted.length).toBeGreaterThanOrEqual(70);

    for (const entry of arted) {
      expect(entry.imageAssetPath, `codex thumbnail for ${entry.id}`).toBe(
        getActionArt(entry.id),
      );
    }
  });

  it('keeps every art path the codex copy used to carry', () => {
    // The deleted local map was a strict subset of the canonical one, keyed by unified
    // template id. Spot-check one row per action family so a future prune of the
    // canonical map cannot silently drop a family the codex depends on.
    const familyProbes = [
      'divine.dream',
      'bind_thread_agent',
      'observe_agent',
      'loc.ward',
      'sub.sanctify',
      'artifact.enchant',
      'hex.survey',
      'hex.claim_dominion',
    ];

    for (const id of familyProbes) {
      expect(getActionArt(id), `art for ${id}`).toMatch(/^\/assets\/actions\/.+\.jpg$/);
    }
  });
});
