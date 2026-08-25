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

  reachTooltipId,
} from '../aftermathWords';
import { attachmentTooltipIdFor } from '../../components/Game/encounter-stage/adapters/buildAftermathConsequences';

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
  for (const { where, text } of sourceFiles()) {
    for (const match of text.matchAll(/tooltipId:\s*'([^']+)'/g)) {
      found.push({ id: match[1], where });
    }
  }
  return found;
}

/** Every `.ts`/`.tsx` file under `src/`, minus this scanner's own prose. */
function sourceFiles(): Array<{ where: string; text: string }> {
  const files: Array<{ where: string; text: string }> = [];
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
      files.push({ where, text: readFileSync(full, 'utf8') });
    }
  };
  walk(srcRoot);
  return files;
}

/**
 * Every attachment concept authored as `entityId` + `visualKind: 'attachment'`,
 * carrying the registry id `attachmentTooltipIdFor` will derive from it.
 *
 * **The blind spot this closes (THR-1094).** The sweep above scans `tooltipId:`
 * literals, and a concept on this route deliberately has none — THR-1122 derives
 * the id from `entityId` so that ~12 authored call sites do not repeat it in a
 * second field. The consequence was that the *derived* half of the corpus was
 * invisible to the only gate that catches a dangling id: a typo'd
 * `entityId: 'trait.condition.exhusted'` resolves to nothing, and the chip draws
 * the word plain while the ticket trail says the concept is explainable.
 *
 * The two orderings are matched separately because an object literal writes its
 * keys in one order or the other; `[^{}]` keeps each match inside a single
 * literal rather than pairing a key with its neighbour's value.
 */
const ATTACHMENT_CONCEPT_PATTERNS: readonly RegExp[] = [
  /entityId:\s*'([^']+)'[^{}]*?visualKind:\s*'attachment'/g,
  /visualKind:\s*'attachment'[^{}]*?entityId:\s*'([^']+)'/g,
];

function authoredAttachmentConceptIds(): AuthoredId[] {
  const found: AuthoredId[] = [];
  for (const { where, text } of sourceFiles()) {
    for (const pattern of ATTACHMENT_CONCEPT_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        const id = attachmentTooltipIdFor({
          text: '(scanned)',
          entityId: match[1],
          visualKind: 'attachment',
        });
        if (id) found.push({ id, where });
      }
    }
  }
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

  it('the derived-attachment corpus is non-empty — otherwise the sweep below is vacuous', () => {
    // Same guard as the corpus check above, and it earns its place here: this
    // scan pairs two keys by regex, so a change to how concepts are written
    // (reordered keys, a wrapping helper) would silently empty it and the sweep
    // would go green by finding nothing rather than by finding nothing wrong.
    expect(authoredAttachmentConceptIds().length).toBeGreaterThan(5);
  });

  it('LAW 17: every attachment concept resolves through the id the adapter derives', () => {
    // THR-1094's substantive answer. Conditions *are* a tooltip class — Law 1
    // says every concept the player meets by name explains itself, and THR-1122
    // gave them the route via `attachment.*` rather than the `condition.*`
    // prefix the ticket proposed. What was missing was this gate: the route
    // worked and nothing proved it kept working.
    const dangling = authoredAttachmentConceptIds()
      .filter(({ id }) => !tooltipResolves(id))
      .map(({ id, where }) => `${where} → '${id}'`);

    expect(
      dangling,
      dangling.length > 0
        ? `Attachment concepts whose derived tooltip id resolves to nothing (the chip names a grant it cannot explain — Law 1/21):\n${dangling.join('\n')}`
        : '',
    ).toEqual([]);
  });

  it('the derivation is the shipped one — an unshipped template yields a dangling id, not silence', () => {
    // Falsifies the guard above: if `attachmentTooltipIdFor` stopped deriving,
    // or `tooltipResolves` started answering true for anything, the sweep would
    // pass while blind. A template id that is deliberately not in the index must
    // still *produce* an id and that id must *not* resolve.
    const derived = attachmentTooltipIdFor({
      text: 'exhaustion',
      entityId: 'trait.condition.exhusted', // shipped spelling is `exhausted`
      visualKind: 'attachment',
    });
    expect(derived).toBe('attachment.trait.condition.exhusted');
    expect(tooltipResolves(derived)).toBe(false);

    // And the shipped spelling does resolve, so the assertion above is about
    // the typo rather than about `attachment.*` being unroutable in this suite.
    expect(tooltipResolves('attachment.trait.condition.exhausted')).toBe(true);
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
      // THR-1136 §5 — the two `reputationTallySentence` rows are gone with the
      // producer. Tallies no longer reach a mortal-facing surface at all, so
      // there is no concept of theirs left for this law to bind.
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
