/**
 * The Package View's model — THR-1046.
 *
 * These tests assert the two things the surface exists to make visible, on the
 * live corpus rather than on a fixture that could agree with a bug:
 *
 *  1. **Unauthored is reported, not omitted.** An afterimage band or an outcome
 *     band nobody wrote must appear in the model marked `authored: false`. A model
 *     that simply left it out would render a shorter list and the gap would be
 *     invisible — which is the exact failure the surface was built to end.
 *  2. **References resolve, and say which rung answered.** An image tag reports
 *     whether it hit the manifest; a seed's `templateId` reports whether it names
 *     a live template. A designer reading raw source cannot see either.
 */

import { describe, it, expect } from 'vitest';
import {
  buildEncounterPackage,
  encounterPackageIndex,
  packageTemplateById,
  AFTERIMAGE_BANDS,
  AFTERMATH_BANDS,
} from '../buildEncounterPackage';
import { formatCmsHash, parseCmsHash } from '../../useCmsHashRoute';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../data/unified-action-templates';
import { RETROFIT_PENDING } from '../../../../data/content-eval/retrofitPending';
import type { UnifiedActionTemplate } from '../../../../types/unifiedAction';

/** The slice bridge is the flagship nudge-era encounter — hand, bands, envelope. */
const BRIDGE_ID = 'encounter.slice.unsafe_bridge';

function bridge(): UnifiedActionTemplate {
  const template = packageTemplateById(BRIDGE_ID);
  // Fail loud rather than skip: a rename that silently drops this fixture would
  // leave the whole suite passing over an encounter nobody is checking.
  expect(template, `${BRIDGE_ID} must exist in UNIFIED_ACTION_TEMPLATES`).toBeDefined();
  return template as UnifiedActionTemplate;
}

describe('buildEncounterPackage — identity and envelope', () => {
  it('reads the template s identity, family and declared envelope', () => {
    const pkg = buildEncounterPackage(bridge());
    expect(pkg.templateId).toBe(BRIDGE_ID);
    expect(pkg.family).toBe('encounter');
    expect(pkg.reach).toBe('stone');
    expect(pkg.settings).toContain('wayside');
    // One opening per declared class is the envelope contract (THR-884).
    expect(pkg.openings.map(o => o.settingClass)).toEqual(pkg.settings.slice());
    expect(pkg.openings[0].text.length).toBeGreaterThan(40);
  });
});

describe('buildEncounterPackage — steps and the hand', () => {
  it('renders the difficulty as a word as well as a number', () => {
    const pkg = buildEncounterPackage(bridge());
    const step = pkg.steps[0];
    // The carve-out adds the number; it does not remove the word the player sees.
    expect(step.difficultyWord).toMatch(/^[a-z]+$/i);
    expect(typeof step.difficulty).toBe('number');
  });

  it('carries the authored hand as stage card models', () => {
    const pkg = buildEncounterPackage(bridge());
    const cards = pkg.steps[0].cards;
    expect(cards.length).toBeGreaterThanOrEqual(4);
    for (const card of cards) {
      // The model must be complete enough for the shared card row to draw it.
      expect(card.model.id).toBeTruthy();
      expect(card.model.name).toBeTruthy();
      expect(card.model.effectLine).toBeTruthy();
      expect(card.model.state).toBe('playable');
    }
    expect(pkg.cardCount).toBe(
      pkg.steps.reduce((sum, step) => sum + step.cards.length, 0),
    );
  });

  it('quotes the authored price, not a live discount', () => {
    const template = bridge();
    const authored = new Map(
      (template.steps[0] as { nudges?: readonly { id: string; essenceCost: number }[] }).nudges
        ?.map(n => [n.id, n.essenceCost]) ?? [],
    );
    const pkg = buildEncounterPackage(template);
    for (const card of pkg.steps[0].cards) {
      // No accessible spheres are passed, so a sphere-gated card must still show
      // its authored cost — a package is not a playthrough with a live pool.
      expect(card.model.essenceCost).toBe(authored.get(card.model.id));
      expect(card.model.discounted).toBe(false);
    }
  });

  it('lists every afterimage band and marks the unauthored ones', () => {
    const pkg = buildEncounterPackage(bridge());
    for (const step of pkg.steps) {
      expect(step.afterimages.map(a => a.band)).toEqual(AFTERIMAGE_BANDS.slice());
      for (const after of step.afterimages) {
        // `authored` is exactly "there is text"; nothing inferred.
        expect(after.authored).toBe((after.text ?? '').trim() !== '');
      }
    }
  });

  it('reports an unauthored band rather than dropping the row', () => {
    const template = bridge();
    const step = template.steps[0] as unknown as Record<string, unknown>;
    const stripped: UnifiedActionTemplate = {
      ...template,
      steps: [{ ...step, criticalFailureAfterimage: undefined } as never],
    };
    const pkg = buildEncounterPackage(stripped);
    const band = pkg.steps[0].afterimages.find(a => a.band === 'critical_failure');
    expect(band).toBeDefined();
    expect(band?.authored).toBe(false);
    expect(band?.text).toBeUndefined();
    // The row count is band-driven, so removing content never shortens the list —
    // which is what keeps the gap visible on the surface.
    expect(pkg.steps[0].afterimages).toHaveLength(AFTERIMAGE_BANDS.length);
  });
});

describe('buildEncounterPackage — aftermath matrix', () => {
  it('gives every outcome band a row per variant, authored or not', () => {
    const pkg = buildEncounterPackage(bridge());
    expect(pkg.aftermath.length).toBeGreaterThan(0);
    for (const variant of pkg.aftermath) {
      expect(variant.bands.map(b => b.band)).toEqual(AFTERMATH_BANDS.slice());
      expect(variant.authoredBandCount).toBe(variant.bands.filter(b => b.authored).length);
    }
  });

  it('surfaces the byOutcome bands the slice actually authors', () => {
    const pkg = buildEncounterPackage(bridge());
    const fallback = pkg.aftermath.find(v => v.key === 'fallback');
    expect(fallback).toBeDefined();
    const authored = fallback?.bands.filter(b => b.authored).map(b => b.band) ?? [];
    // Ruling 7's floor is three bands; the slice is the exemplar and clears it.
    expect(authored.length).toBeGreaterThanOrEqual(3);
    expect(authored).toContain('critical_success');
    for (const band of fallback?.bands ?? []) {
      if (band.authored) expect(band.overview ?? band.changes.length).toBeTruthy();
    }
  });

  it('reads bands off a choice-keyed variant, not only the fallback', () => {
    const template = bridge();
    const base = template.aftermathConfig?.fallback;
    expect(base).toBeDefined();
    const withChoice: UnifiedActionTemplate = {
      ...template,
      aftermathConfig: {
        branchOnStep: 0,
        variants: { took_the_bridge: { ...base!, byOutcome: { failure: { overview: 'A keyed ending.' } } } },
        fallback: base!,
      },
    };
    const pkg = buildEncounterPackage(withChoice);
    const keyed = pkg.aftermath.find(v => v.key === 'took_the_bridge');
    expect(keyed?.bands.find(b => b.band === 'failure')?.overview).toBe('A keyed ending.');
  });
});

describe('buildEncounterPackage — references resolve', () => {
  it('reports the resolver rung for every image reference', () => {
    const pkg = buildEncounterPackage(bridge());
    expect(pkg.images.length).toBeGreaterThan(0);
    for (const image of pkg.images) {
      expect(image.where).toBeTruthy();
      expect(['specific', 'exact_tag', 'tag_query', 'category_generic', 'none'])
        .toContain(image.source);
      // `tagMissed` is only ever true when a tag was authored and did not hit the
      // manifest exactly — never for an unauthored tag.
      if (image.tag === undefined) expect(image.tagMissed).toBe(false);
      else expect(image.tagMissed).toBe(image.source !== 'exact_tag');
    }
  });

  it('flags an image tag that names no manifest row', () => {
    const template = bridge();
    const step = template.steps[0] as { nudges?: readonly Record<string, unknown>[] };
    const bogus: UnifiedActionTemplate = {
      ...template,
      steps: [
        {
          ...(template.steps[0] as object),
          nudges: [{ ...(step.nudges?.[0] as object), imageTag: 'no.such.row.at.all' }],
        } as never,
      ],
    };
    const pkg = buildEncounterPackage(bogus);
    const art = pkg.steps[0].cards[0].art;
    expect(art.tag).toBe('no.such.row.at.all');
    expect(art.source).not.toBe('exact_tag');
    expect(art.tagMissed).toBe(true);
  });

  it('resolves a seed target to its template name and flags a dead one', () => {
    const template = bridge();
    const seeded: UnifiedActionTemplate = {
      ...template,
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          overview: 'x',
          changes: [],
          reactions: [
            {
              id: 'r.live',
              label: 'Walk on',
              effects: [
                { kind: 'encounter_seed', templateId: BRIDGE_ID, delayTicks: 6, seedLabel: 'Return' },
                { kind: 'encounter_seed', templateId: 'encounter.nope', delayTicks: 6, seedLabel: 'Dead' },
              ],
            },
          ],
        },
      },
    };
    const pkg = buildEncounterPackage(seeded);
    const live = pkg.seeds.find(s => s.seedLabel === 'Return');
    const dead = pkg.seeds.find(s => s.seedLabel === 'Dead');
    expect(live?.targetName).toBe(template.name);
    expect(live?.targetMissing).toBe(false);
    expect(dead?.targetName).toBeUndefined();
    expect(dead?.targetMissing).toBe(true);
  });

  it('finds a seed planted inside an outcome band, not only on the variant', () => {
    const template = bridge();
    const banded: UnifiedActionTemplate = {
      ...template,
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          overview: 'x',
          changes: [],
          byOutcome: {
            critical_failure: {
              reactions: [
                {
                  id: 'r.band',
                  label: 'Limp on',
                  effects: [
                    { kind: 'encounter_seed', templateId: BRIDGE_ID, delayTicks: 12, seedLabel: 'The fall remembered' },
                  ],
                },
              ],
            },
          },
        },
      },
    };
    const pkg = buildEncounterPackage(banded);
    // The band arm is the one a sweep of `variant.reactions` alone would miss.
    const seed = pkg.seeds.find(s => s.seedLabel === 'The fall remembered');
    expect(seed).toBeDefined();
    expect(seed?.where).toContain('critical_failure');
  });
});

describe('buildEncounterPackage — cast', () => {
  it('marks a bundle that came from the family default rather than the template', () => {
    const template = bridge();
    const declared = template.supportBundle ?? [];
    const pkg = buildEncounterPackage(template);
    if (declared.length > 0) {
      // A template that authors its own cast must never be labelled defaulted.
      for (const member of pkg.cast) expect(member.defaulted).toBe(false);
    } else if (pkg.cast.length > 0) {
      for (const member of pkg.cast) expect(member.defaulted).toBe(true);
    }
    // Either way, a resolved cast member carries the role that names it.
    for (const member of pkg.cast) expect(member.supportRole).toBeTruthy();
  });
});

describe('buildEncounterPackage — verdict is delegated, never re-derived', () => {
  it('groups the contract report by block and agrees with it', () => {
    const pkg = buildEncounterPackage(bridge());
    const failing = pkg.verdict.blocks.filter(b => !b.pass).map(b => b.block).sort();
    const fromReport = [...new Set(pkg.verdict.report.violations.map(v => v.block))].sort();
    expect(failing).toEqual(fromReport);
    expect(pkg.verdict.pass).toBe(pkg.verdict.report.violations.length === 0);
    // Every block gets a badge whether or not it failed, so a passing block is
    // visibly passing rather than merely absent.
    expect(pkg.verdict.blocks).toHaveLength(8);
  });

  it('reports retrofit-pending membership from the ratchet, not from the verdict', () => {
    const pkg = buildEncounterPackage(bridge());
    expect(pkg.verdict.retrofitPending).toBe(RETROFIT_PENDING.includes(BRIDGE_ID));
  });

  it('systems come from the contract s own counter', () => {
    const pkg = buildEncounterPackage(bridge());
    expect(pkg.systems).toEqual(pkg.verdict.report.systems.slice());
  });
});

describe('buildEncounterPackage — fail-soft over the whole corpus', () => {
  it('builds every live template without throwing', () => {
    // The surface renders content authored by agents; a malformed template must
    // produce violations, never an exception (NFP #4).
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      expect(() => buildEncounterPackage(template), template.id).not.toThrow();
    }
  });

  it('survives a template with no steps, no aftermath and no bundle', () => {
    const bare = {
      id: 'test.bare',
      rarityTier: 1,
      intrinsicTier: 'ambient',
      name: 'Bare',
      reach: 'stone',
      crudType: 'read',
      scale: 'local',
      steps: [],
      apCost: 1,
      actorAffinities: ['individual'],
      motivations: [],
      narrativeTemplates: { initiation: 'i', success: 's', failure: 'f' },
    } as unknown as UnifiedActionTemplate;
    const pkg = buildEncounterPackage(bare);
    expect(pkg.steps).toHaveLength(0);
    expect(pkg.aftermath).toHaveLength(0);
    expect(pkg.cast).toHaveLength(0);
    expect(pkg.seeds).toHaveLength(0);
    expect(pkg.verdict.pass).toBe(false);
  });
});

describe('encounterPackageIndex', () => {
  it('covers the whole registry and sorts hand-bearing templates first', () => {
    const index = encounterPackageIndex();
    expect(index).toHaveLength(UNIFIED_ACTION_TEMPLATES.length);
    // `findLastIndex` is outside this project's TS lib, so the scan is explicit.
    let lastWithHand = -1;
    index.forEach((row, i) => {
      if (row.hasHand) lastWithHand = i;
    });
    const firstWithout = index.findIndex(row => !row.hasHand);
    if (lastWithHand >= 0 && firstWithout >= 0) {
      expect(lastWithHand).toBeLessThan(firstWithout);
    }
    // The bridge authors a hand, so it must be in the leading group.
    const bridgeRow = index.find(row => row.templateId === BRIDGE_ID);
    expect(bridgeRow?.hasHand).toBe(true);
  });
});

describe('CMS hash route', () => {
  it('parses an entry id with no parameters', () => {
    expect(parseCmsHash('#encounter-packages')).toEqual({
      entryId: 'encounter-packages',
      params: {},
    });
  });

  it('parses entry-scoped parameters', () => {
    const route = parseCmsHash(`#encounter-packages?template=${BRIDGE_ID}`);
    expect(route.entryId).toBe('encounter-packages');
    expect(route.params.template).toBe(BRIDGE_ID);
  });

  it('round-trips a comma-joined batch', () => {
    const hash = formatCmsHash('encounter-packages', { batch: `${BRIDGE_ID},encounter.slice.night_pass` });
    const route = parseCmsHash(hash);
    expect(route.params.batch?.split(',')).toEqual([BRIDGE_ID, 'encounter.slice.night_pass']);
  });

  it('drops empty parameters rather than writing bare keys', () => {
    expect(formatCmsHash('encounter-packages', { template: undefined, batch: '' }))
      .toBe('#encounter-packages');
  });

  it('treats an empty hash as no selection', () => {
    expect(parseCmsHash('')).toEqual({ entryId: null, params: {} });
    expect(parseCmsHash('#')).toEqual({ entryId: null, params: {} });
  });
});
