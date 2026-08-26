/**
 * Lint: every authored `motivations` entry must be a member of `VALUE_PAIRS`.
 *
 * `computeDesireScore` reads `profile[motivation] ?? 0` (`encounterScoring.ts`),
 * so a motivation naming a pair that is not in `VALUE_PAIRS` does not throw and
 * does not warn — it scores exactly zero, for every agent, forever. The encounter
 * still draws, still resolves, still reads correctly in the content file. The
 * only symptom is that the personality signal the author wrote is absent from the
 * decision, which is invisible from every surface except this test.
 *
 * THR-1292 slice 1 found four such spellings in shipped content — `tradition_progress`
 * (29), `justice_mercy` (19), `tradition_change` (2), `order_freedom` (1) — plus two
 * in `SPHERE_DRIFT_MAP` and one in `WANDERLUST_PAIR`. The board in plan §4 leans on
 * the desire term those feed, so converging two scorers onto a half-dead signal would
 * have made the temperament weights fiction. That is why this lands before the board.
 *
 * **Scope is the source tree, not a catalog export, and that is deliberate.** The
 * repo has well over a dozen `*_TEMPLATES` exports across `src/data/`, and only some
 * are aggregated into `UNIFIED_ACTION_TEMPLATES`. A test that iterated one export —
 * or an enumerated list of them — would pass on the day a new content file is added
 * to an unlisted catalog, which is the same partial-coverage failure the vocabulary
 * itself suffered. Scanning authored literals is complete by construction.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { VALUE_PAIRS } from '../../types/agent';

/** Repo root. Vitest runs with cwd at the project root. */
const ROOT = process.cwd();

/** Trees holding authored content and the engine tables that read it. */
const SCAN_ROOTS = ['src/data', 'src/engine'];

/**
 * `motivations: [ ... ]` where the body is *only* quoted snake_case tokens.
 *
 * The body guard matters: `src/engine/sublocation.ts` carries an unrelated
 * `motivations` field shaped `[{ left, right, weight }]`, and a looser match
 * reports its object keys as bogus value pairs. Bounded at 400 chars so a
 * runaway match cannot swallow the rest of a file.
 */
const MOTIVATIONS_ARRAY = /motivations\s*:\s*\[([\s\S]{0,400}?)\]/g;
const PURE_TOKEN_BODY = /^[\s,]*(['"][a-z_]+['"][\s,]*)*$/;
const QUOTED_TOKEN = /['"][a-z_]+['"]/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

interface Offence {
  readonly file: string;
  readonly line: number;
  readonly token: string;
}

function collect(): { offences: Offence[]; scanned: number; tokens: number } {
  const offences: Offence[] = [];
  let scanned = 0;
  let tokens = 0;

  for (const root of SCAN_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const text = fs.readFileSync(file, 'utf8');
      if (!text.includes('motivations')) continue;
      scanned++;
      MOTIVATIONS_ARRAY.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = MOTIVATIONS_ARRAY.exec(text)) !== null) {
        const body = match[1];
        if (!PURE_TOKEN_BODY.test(body)) continue;
        const line = text.slice(0, match.index).split('\n').length;
        for (const quoted of body.match(QUOTED_TOKEN) ?? []) {
          const token = quoted.replace(/['"]/g, '');
          tokens++;
          if (!(VALUE_PAIRS as readonly string[]).includes(token)) {
            offences.push({
              file: path.relative(ROOT, file).split(path.sep).join('/'),
              line,
              token,
            });
          }
        }
      }
    }
  }
  return { offences, scanned, tokens };
}

describe('value-pair vocabulary (THR-1292 slice 1)', () => {
  const { offences, scanned, tokens } = collect();

  it('actually scanned a populated corpus', () => {
    // Guards the whole file against passing vacuously: a glob that stops matching,
    // a moved content tree, or a tightened body regex would otherwise turn every
    // assertion below into a green no-op over an empty set.
    expect(scanned).toBeGreaterThan(10);
    expect(tokens).toBeGreaterThan(200);
  });

  it('has no authored motivation outside VALUE_PAIRS', () => {
    const report = offences
      .map((o) => `  ${o.file}:${o.line}  '${o.token}'`)
      .join('\n');
    expect(
      offences,
      offences.length
        ? `Motivations naming a pair that is not in VALUE_PAIRS. These score ` +
          `0 for every agent, silently — see computeDesireScore.\n${report}\n\n` +
          `Canonical pairs: ${VALUE_PAIRS.join(', ')}`
        : '',
    ).toEqual([]);
  });

  it('rejects a known-legacy spelling if one is reintroduced', () => {
    // Falsification arm: proves the matcher above can actually see a bad token,
    // rather than passing because it matches nothing at all.
    const sample = `motivations: ['tradition_progress', 'courage_prudence'],`;
    MOTIVATIONS_ARRAY.lastIndex = 0;
    const match = MOTIVATIONS_ARRAY.exec(sample);
    expect(match).not.toBeNull();
    const found = (match![1].match(QUOTED_TOKEN) ?? [])
      .map((q) => q.replace(/['"]/g, ''))
      .filter((t) => !(VALUE_PAIRS as readonly string[]).includes(t));
    expect(found).toEqual(['tradition_progress']);
  });
});
