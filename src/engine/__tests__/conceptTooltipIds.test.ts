/**
 * THR-1033 — Law 17/21 gate for concept tooltip ids.
 *
 * A concept word on a chip earns an underline because it explains itself on
 * hover. The surface draws that underline from the *presence* of a `tooltipId`,
 * while the explanation lives in the registry — so an id the registry cannot
 * resolve produces a dead link that looks live, which is the anti-pattern Law 21
 * names by hand. `ui.reputation` shipped that way and reached every STANDING
 * chip in the game; `reach.time` and `reach.life` were the same class.
 *
 * The load-bearing test is the **corpus sweep**: it enumerates every
 * `tooltipId: '...'` literal authored anywhere under `src/`, not a fixture list,
 * so an id written next week is covered the day it is written. The existing
 * `tooltipValidation.test.ts` checks only `{{concept.id}}` links *inside*
 * tooltip descriptions — it never looked at the ids producers emit, which is
 * precisely the gap `ui.reputation` fell through.
 *
 * Fixtures are swept too. A fixture is where a surface's behaviour gets pinned,
 * so a dangling id there teaches the wrong shape to every test that copies it.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { resolveTooltip, tooltipResolves } from '../tooltipResolver';
import {
  REACH_DISPLAY_NAMES,
  TOOLTIP_BACKED_REACHES,
  growthSentence,
  reputationSentence,
  reputationTallySentence,
  reachTooltipId,
} from '../aftermathWords';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, '../..');
/** This file's own prose contains the pattern it scans for. */
const SCANNER_SELF = 'engine/__tests__/conceptTooltipIds.test.ts';

interface AuthoredId {
  readonly id: string;
  readonly where: string;
}

/**
 * Every `tooltipId: '...'` literal authored under `src/`.
 *
 * `agent.*` is excluded from the *assertion* rather than from the scan, because
 * it resolves only with a live graph context — see the test that owns it below.
 */
function authoredTooltipIds(): AuthoredId[] {
  const found: AuthoredId[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
      const where = relative(srcRoot, full).replace(/\\/g, '/');
      if (where === SCANNER_SELF) continue;
      const text = readFileSync(full, 'utf8');
      for (const match of text.matchAll(/tooltipId:\s*'([^']+)'/g)) {
        found.push({ id: match[1], where });
      }
    }
  };
  walk(srcRoot);
  return found;
}

describe('concept tooltip ids (THR-1033)', () => {
  it('the corpus is non-empty — otherwise every sweep below is vacuous', () => {
    // Guards against the empty-population probe: a scan that finds nothing
    // passes every assertion under it while proving nothing at all.
    expect(authoredTooltipIds().length).toBeGreaterThan(5);
  });

  it('LAW 17: every authored tooltip id resolves in the registry', () => {
    const dangling = authoredTooltipIds()
      // Context-bearing; asserted separately below.
      .filter(({ id }) => !id.startsWith('agent.'))
      .filter(({ id }) => !tooltipResolves(id))
      .map(({ id, where }) => `${where} → '${id}'`);

    expect(
      dangling,
      dangling.length > 0
        ? `Tooltip ids that resolve to nothing (they render as dead underlines — Law 21):\n${dangling.join('\n')}`
        : '',
    ).toEqual([]);
  });

  it('LAW 17: the reach set this module offers ids for matches the registry', () => {
    // Pins TOOLTIP_BACKED_REACHES against the live resolver, so the constant
    // cannot drift away from world-model.json the way the implicit set did.
    const unresolvable = TOOLTIP_BACKED_REACHES.filter((r) => !resolveTooltip(`reach.${r}`));
    expect(unresolvable).toEqual([]);

    // The other direction: a reach with a display word but no registry entry
    // must be offered *no* id rather than a dangling one.
    const overreaching = Object.keys(REACH_DISPLAY_NAMES).filter(
      (r) => reachTooltipId(r) !== undefined && !resolveTooltip(`reach.${r}`),
    );
    expect(overreaching).toEqual([]);
  });

  it('LAW 17: every concept a derived aftermath sentence names is explainable', () => {
    // The producers, not a copy of their output — the same reason
    // aftermathWords.test.ts enumerates the builders rather than sampling.
    const sentences = [
      growthSentence({ actorName: 'Vara', domain: 'eye', applied: 0.4, tierCrossed: false }),
      growthSentence({ actorName: 'Vara', domain: 'star', applied: 0.4, tierCrossed: true }),
      reputationSentence({ actorName: 'Vara', delta: 0.3, flavour: 'authored' }),
      reputationSentence({ actorName: 'Vara', delta: -0.3, flavour: 'branch' }),
      reputationTallySentence({ actorName: 'Vara', key: 'star.positive', delta: 0.2 }),
      reputationTallySentence({ actorName: 'Vara', key: 'heart.negative', delta: -0.2 }),
    ];

    const dangling = sentences
      .flatMap((s) => s.concepts)
      .filter((c) => c.tooltipId !== undefined && !tooltipResolves(c.tooltipId))
      .map((c) => `'${c.text}' → '${c.tooltipId}'`);

    expect(dangling).toEqual([]);
  });

  it('a reach with no registry entry is offered no id at all, rather than a dead one', () => {
    // `time` and `life` carry display words but have no world-model node.
    // Regression lock on the exact ids that shipped dangling.
    expect(reachTooltipId('time')).toBeUndefined();
    expect(reachTooltipId('life')).toBeUndefined();
    expect(reachTooltipId('eye')).toBe('reach.eye');
  });

  it('tooltipResolves agrees with the resolver on both answers', () => {
    expect(tooltipResolves('ui.standing')).toBe(true);
    expect(tooltipResolves('ui.reputation')).toBe(false);
    expect(tooltipResolves(undefined)).toBe(false);
    // Context-bearing prefix with no context — the same null Tooltip itself gets.
    expect(tooltipResolves('agent.whoever')).toBe(false);
  });
});
