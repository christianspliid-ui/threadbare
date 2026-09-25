/**
 * Corpus-wide encounter-seed liveness (THR-1488, slice 4 of THR-1481).
 *
 * **Why this test exists beside the gate.** `check:encounter --all` sweeps the
 * `encounter.` prefix only — 206 of 744 templates — because the Composition Contract is
 * written for authored encounters and holding a divine verb to it would fail ~1,900
 * templates that were never in scope. But seed rot does not respect that boundary: of the
 * seven dead `templateId` references this gate found on the day it was written, **every
 * one lived outside the `encounter.` prefix** (three in the Underking's Court content,
 * four in a Shadow Court audience), so the runner alone would have reported the corpus
 * clean. This is the same division of labour `tallyKeyCorpus.test.ts` settled for
 * reputation keys: the runner is an author's fast feedback, the vitest is the line.
 *
 * **What is fatal and what is counted.** A seed naming a template that does not exist, or
 * a query that resolves to nothing, fails — both are defects in content written after the
 * mechanism existed, and there is no reason to ship one. A legacy `encounterFamily` prefix
 * matching no template is *counted against a ratchet* instead: 39 distinct families across
 * 168 sites are in that state, they predate the query, and `ENCOUNTER_FAMILY_TAGS`
 * deliberately leaves them on the pre-change prefix path for one release. Failing them
 * here would redden the corpus for work this slice does not own.
 *
 * The ratchet is a **ceiling that only falls**. It is not an exemption: a new dead family
 * pushes the count past it and fails, and draining families below it fails too, so the
 * number cannot quietly stop meaning anything.
 */
import { describe, it, expect } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  getUnifiedTemplateById,
} from '../../data/unified-action-templates';
import { validateEncounterSeedRefs, allTemplateEffects } from '../nudgeGrantLiveness';
import { ENCOUNTER_FAMILY_TAGS, seedContentQuery } from '../encounterSeeding';
import { contentQueryHasCandidates, resolveContentQuery } from '../contentQuery';
import { staticContentCatalogs } from '../contentCatalogView';
import {
  buildSeedPlanterIndex,
  describePlantSite,
  ENGINE_PLANTED_SEED_ONLY_IDS,
} from '../seedOnlySequels';
import { getAllStrategicTemplates } from '../strategicActionCandidates';
import { EncounterCacheManager } from '../encounterCache';
import { ALL_DELIVERY_BEATS } from '../deliveryBeatAdapter';
import { WorldGraph } from '../graph';
import { SETTING_CLASSES, expandSettings } from '../../data/settingClasses';
import { SOCIAL_SCENE_TEMPLATES } from '../../data/social-scene-templates';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../data/faction-encounter-content';

const CORPUS = [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES];

/**
 * Sites whose `encounterFamily` prefix matches no template — measured 2026-09-12 at 168
 * across 39 families, immediately after this slice repaired the seven fatal ones.
 *
 * Lower this number when families are migrated; never raise it. The repair is one of two
 * things per family: an `ENCOUNTER_FAMILY_TAGS` row plus the tag on its members, or
 * `query` authored directly on the seed.
 *
 * THR-1613 drained the six families that actually wither in a live run (50 sites) —
 * 168 → 118.
 */
const DEAD_FAMILY_SITE_CEILING = 118;

describe('encounter seeds name something that can arrive', () => {
  it('the corpus is large and seed-bearing, so the sweeps below are not vacuous', () => {
    const report = validateEncounterSeedRefs(CORPUS);
    expect(CORPUS.length).toBeGreaterThan(500);
    expect(report.checkedSeeds, 'no seed effects found — the sweep would pass over nothing').toBeGreaterThan(100);
  });

  it('no seed names a template that does not exist', () => {
    const dead = validateEncounterSeedRefs(CORPUS).dead.filter(d => d.kind === 'dead_template');
    expect(
      dead,
      `seeds naming unregistered templates:\n${dead.map(d => `  ${d.templateId} ${d.site} → '${d.ref}'`).join('\n')}`,
    ).toEqual([]);
  });

  it('no seed carries a query that resolves to nothing', () => {
    const dead = validateEncounterSeedRefs(CORPUS).dead.filter(d => d.kind === 'empty_query');
    expect(
      dead,
      `seeds whose query matches no content:\n${dead.map(d => `  ${d.templateId} ${d.site} → ${d.ref}`).join('\n')}`,
    ).toEqual([]);
  });

  it('the dead-family backlog is at or under its ceiling, and the ceiling is honest', () => {
    const { deadFamilies } = validateEncounterSeedRefs(CORPUS);
    expect(
      deadFamilies.length,
      `dead-family seed sites grew past the ceiling — a new family matching nothing:\n${
        [...new Set(deadFamilies.map(d => d.ref))].sort().join(', ')}`,
    ).toBeLessThanOrEqual(DEAD_FAMILY_SITE_CEILING);
    // Both directions: a drained backlog must lower the number in the same commit, or the
    // ceiling stops describing the corpus.
    expect(
      deadFamilies.length,
      `the backlog has drained to ${deadFamilies.length} — lower DEAD_FAMILY_SITE_CEILING to match`,
    ).toBe(DEAD_FAMILY_SITE_CEILING);
  });
});

describe('the alias table is a true rewrite, not a hopeful one', () => {
  it('every aliased family resolves to at least one live template', () => {
    const catalogs = staticContentCatalogs();
    const broken = Object.entries(ENCOUNTER_FAMILY_TAGS).filter(
      ([, tag]) => !contentQueryHasCandidates({ kind: 'encounter_template', tags: [tag] }, catalogs),
    );
    expect(
      broken,
      `alias rows whose tag names nothing — a rewrite into an empty set is worse than no rewrite:\n${
        broken.map(([prefix, tag]) => `  ${prefix} → ${tag}`).join('\n')}`,
    ).toEqual([]);
  });

  it('every aliased family names the same templates its prefix used to', () => {
    // The migration's own correctness condition, and the reason the tags were applied by
    // prefix rather than by judgment: a shipped seed must keep finding the set it found.
    // Checked as a superset both ways — the tag may legitimately be *wider* (the
    // `#delve` family gained `encounter.delve_into_depths`, whose id the prefix could not
    // reach), but it may never be narrower, because that would silently drop a member a
    // seed could previously draw.
    const catalogs = staticContentCatalogs();
    const narrower: string[] = [];
    for (const [prefix, tag] of Object.entries(ENCOUNTER_FAMILY_TAGS)) {
      const byPrefix = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith(`${prefix}.`)).map(t => t.id);
      const byTag = new Set(
        contentQueryHasCandidates({ kind: 'encounter_template', tags: [tag] }, catalogs)
          ? // resolve through the same reader the runtime uses
            UNIFIED_ACTION_TEMPLATES.filter(t => t.tags?.includes(tag)).map(t => t.id)
          : [],
      );
      for (const id of byPrefix) {
        if (!byTag.has(id)) narrower.push(`${prefix} → ${tag} lost ${id}`);
      }
    }
    expect(narrower, `alias rows that narrowed their family:\n${narrower.join('\n')}`).toEqual([]);
  });

  it('a seed with a family but no alias row produces no query, so it keeps the prefix path', () => {
    // The fail-soft table's row, asserted rather than trusted: an un-aliased family must
    // fall through, not resolve to an empty query and wither differently.
    const q = seedContentQuery({
      seedId: 's', sourceEncounterId: 'e', sourceReactionId: 'r',
      encounterFamily: 'stone.legacy',
      targetAgentId: 'a', eligibleAfterTick: 1, priority: 1, seedLabel: 'l', plantedTick: 0,
    });
    expect(q).toBeUndefined();
  });

  it('an authored query outranks an aliased family on the same seed', () => {
    const q = seedContentQuery({
      seedId: 's', sourceEncounterId: 'e', sourceReactionId: 'r',
      encounterFamily: 'ac.quest',
      query: { kind: 'encounter_template', tags: ['#delve'] },
      targetAgentId: 'a', eligibleAfterTick: 1, priority: 1, seedLabel: 'l', plantedTick: 0,
    });
    expect(q?.tags).toEqual(['#delve']);
  });
});

describe('the repaired sequels can now actually arrive', () => {
  it('the three sequels that named unregistered templates resolve to live content', () => {
    // Named individually because these are the defects the gate found, and a regression
    // here is the exact thing being prevented — not a class of thing.
    const catalogs = staticContentCatalogs();
    for (const [where, tag] of [
      ["the Court's tip to the watch", '#watch_errand'],
      ["the courtier's off-books commission", '#court_errand'],
    ] as const) {
      const ok = contentQueryHasCandidates({ kind: 'encounter_template', tags: [tag] }, catalogs);
      expect(ok, `${where} (${tag}) resolves to nothing`).toBe(true);
    }
    // And the ids that used to be named are still absent — the repair was to stop naming
    // them, not to add them, so a future reader does not "fix" it by reintroducing one.
    for (const gone of ['cg.patrol.wall_walk', 'cg.senior.inquisition', 'noble.commission']) {
      expect(getUnifiedTemplateById(gone), `${gone} exists now — revisit the repair`).toBeUndefined();
    }
  });
});

// ─── The six withering families (THR-1613) ──────────────────────────────────
//
// A live ledger (seeds 42 · 99, medium, 200 ticks) found 60 of 70 withered seeds were
// planted under six families with no alias row and no prefix member — dead by
// construction, and planted by some of the most-fired templates in the corpus. Each
// planter now authors a `query` naming an errand family whose story fits its seedLabel.

/** The families THR-1613 retired; no planter may name one again. */
const THR_1613_RETIRED_FAMILIES = [
  'stone.legacy', 'star.referred_pilgrim', 'veil.quiet_devotion',
  'eye.kept_record', 'stone.accused_vengeance', 'investigation',
] as const;

/** Every template that planted one of them on the day it was fixed. */
const THR_1613_PLANTERS = [
  'stone.permanence.mason_lord_wall', 'reputation.stone.the_stones_judgement',
  'star.turning.comet_omen', 'reputation.star.the_star_pilgrim',
  'veil.truth.page_beneath_saint', 'eye.reckoning.verdict_that_burns',
  'reputation.stone.the_jury_of_the_ruined',
  'encounter.anomaly.sealed_chamber', 'encounter.anomaly.drowned_hoard',
  'encounter.anomaly.fallen_star', 'encounter.anomaly.dreaming_light',
  'mc.army.raise', 'army.threshold.mutiny', 'army.aftermath.refugees',
] as const;

describe('the six withering seed families resolve to live content (THR-1613)', () => {
  it('no seed plants a retired family any more', () => {
    const planted = validateEncounterSeedRefs(CORPUS).deadFamilies
      .filter(d => (THR_1613_RETIRED_FAMILIES as readonly string[]).includes(d.ref))
      .map(d => `${d.templateId} ${d.site} → ${d.ref}`);
    expect(planted, `a retired family was planted again:\n  ${planted.join('\n  ')}`).toEqual([]);
  });

  it('every repointed seed resolves to at least one template a mortal can perform', () => {
    // The runtime's own eligibility floor (`eligibleAt` in encounterSeeding.ts): a hit
    // must be individual-performable, or the seed withers exactly as before with a
    // different reason on the trace. Subtype is judged at spawn time, so it is not.
    // The planters' *other* seeds still name dead families the ceiling above counts;
    // this pin covers the query-bearing ones this ticket authored.
    const catalogs = staticContentCatalogs();
    let seeds = 0;
    const hungry: string[] = [];
    for (const id of THR_1613_PLANTERS) {
      const template = CORPUS.find(t => t.id === id);
      expect(template, `${id} is no longer in the corpus — update this pin`).toBeDefined();
      for (const { effect, site } of allTemplateEffects(template!)) {
        if (effect.kind !== 'encounter_seed' || !effect.query) continue;
        seeds++;
        const performable = resolveContentQuery(effect.query, catalogs)
          .map(h => getUnifiedTemplateById(h.id))
          .filter(t => t?.actorAffinities?.includes('individual') && t.drawable !== false);
        if (performable.length === 0) hungry.push(`${id} ${site} ("${effect.seedLabel}")`);
      }
    }
    // 21 authored sites; aftermath fallbacks re-walk some reactions, so the walk sees more.
    expect(seeds, 'no repointed seeds found on the planters — the sweep would pass over nothing').toBeGreaterThanOrEqual(21);
    expect(hungry, `planted seeds with nothing a mortal can perform:\n  ${hungry.join('\n  ')}`).toEqual([]);
  });
});

// ─── Seed-only sequels (THR-1526) ───────────────────────────────────────────
//
// Plan: `Docs/plans/2026-09-24-thr-1526-seed-only-encounters.md` § Content gates.
// A sequel whose opening assumes its parent (`drawable: false`) must start only when that
// parent plants it. These four gates are fatal: `check:encounter` sees `encounter.*` only,
// and its two seed-only warnings are the author's early signal, not the line.

/** The four shipped sequels that are untrue off the board — a named regression pin. */
const SHIPPED_SEED_ONLY_SEQUELS = [
  'encounter.slice.full_moon_collection',
  'encounter.slice.full_moon_reckoning',
  'encounter.slice.swindler_found',
  'encounter.slice.grateful_kin',
] as const;

/**
 * The one query site allowed to resolve each non-drawable template — its declared
 * planter. Any other query that reaches a seed-only sequel is a draw broad enough to
 * start it without its promise (the foreign-query pin).
 */
const DECLARED_QUERY_PLANTERS: Readonly<Record<string, readonly string[]>> = {
  // The Crossroads' missed branch: `#crossroads_debt`.
  'encounter.slice.full_moon_reckoning': ['encounter.slice.bargain_at_crossroads'],
  // THR-1560 — the hunt appointment's missed branch: `#hunt_trail_cold`, one bearer.
  'hunt.trail_cold': ['cell.destroy.monster'],
};

const NON_DRAWABLE = CORPUS.filter(t => t.drawable === false);
const planterIndex = buildSeedPlanterIndex(getAllStrategicTemplates());

describe('seed-only sequels never reach the board (THR-1526)', () => {
  it('the four shipped sequels are flagged drawable: false', () => {
    for (const id of SHIPPED_SEED_ONLY_SEQUELS) {
      expect(getUnifiedTemplateById(id)?.drawable, `${id} is drawable — it would fire with no promise behind it`).toBe(false);
    }
    // And they stay in the query catalog — removing them would starve the missed branch.
    for (const id of SHIPPED_SEED_ONLY_SEQUELS) {
      expect(LOCATION_BRANCHING_ENCOUNTER_TEMPLATES.some(t => t.id === id), `${id} left LOCATION_BRANCHING`).toBe(true);
    }
  });

  it('every template-authored appointment branch target is non-drawable', () => {
    // An appointment branch names its promise ("comes back to the crossroads…"), so a
    // board draw of its target always tells an untrue story. Undertaking-cell appointments
    // are deliberately excluded: they name generic family queries (`#thieves_errand`,
    // `#court_errand`) whose faction-quest members stand alone and must stay drawable —
    // the foreign-query pin below is what keeps those families clear of sequels.
    const offenders: string[] = [];
    let branches = 0;
    for (const [id, sites] of planterIndex.plantersOf) {
      for (const site of sites) {
        if (site.branch === 'plain' || site.planterId.startsWith('cell.')) continue;
        branches++;
        if (getUnifiedTemplateById(id)?.drawable !== false) offenders.push(`${id} ← ${describePlantSite(site)}`);
      }
    }
    expect(branches, 'no appointment branches found — the sweep would pass over nothing').toBeGreaterThanOrEqual(2);
    expect(offenders, `drawable appointment branch targets:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  it('no foreign query resolves a non-drawable template (the foreign-query pin)', () => {
    const offenders: string[] = [];
    for (const { site, hits } of planterIndex.querySites) {
      for (const id of hits) {
        if (getUnifiedTemplateById(id)?.drawable !== false) continue;
        if ((DECLARED_QUERY_PLANTERS[id] ?? []).includes(site.planterId)) continue;
        offenders.push(`${id} ← ${describePlantSite(site)}`);
      }
    }
    expect(planterIndex.querySites.length).toBeGreaterThan(10);
    expect(offenders, `queries broad enough to draw a seed-only sequel:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  it('no non-drawable template sits on any draw path: cache build, delivery beats, or the generators', () => {
    expect(NON_DRAWABLE.length).toBeGreaterThanOrEqual(SHIPPED_SEED_ONLY_SEQUELS.length);
    const flagged = new Set(NON_DRAWABLE.map(t => t.id));

    // The cache, over one location per subtype of every setting class.
    const graph = new WorldGraph();
    for (const subtype of expandSettings([...SETTING_CLASSES])) {
      graph.addNode({ id: `loc.${subtype}`, type: 'location', name: subtype, properties: { locationType: subtype } });
    }
    const cache = new EncounterCacheManager();
    cache.buildFullCache(graph);
    const cached = cache.getAllEntries().filter(e => flagged.has(e.templateId));
    expect(cache.getAllEntries().length, 'the cache built nothing — vacuous').toBeGreaterThan(100);
    expect(cached.map(e => `${e.templateId}@${e.locationId}`)).toEqual([]);

    // Divine-vision delivery beats.
    expect(ALL_DELIVERY_BEATS.filter(b => b.templateId && flagged.has(b.templateId)).map(b => b.templateId)).toEqual([]);

    // Candidate sources that do not read the cache.
    for (const [name, list] of [
      ['social scenes', SOCIAL_SCENE_TEMPLATES],
      ['faction quests', FACTION_ENCOUNTER_TEMPLATES],
    ] as const) {
      expect(list.filter(t => t.drawable === false).map(t => t.id), `${name} lists a seed-only template`).toEqual([]);
    }
  });

  it('every non-drawable template has a planter, so none is unreachable content', () => {
    const orphans = NON_DRAWABLE
      .filter(t => !planterIndex.plantersOf.has(t.id) && !ENGINE_PLANTED_SEED_ONLY_IDS.includes(t.id))
      .map(t => t.id);
    expect(orphans).toEqual([]);
  });

  it('the Swindler Found and the Grateful Kin are still planted by content', () => {
    // Their chain stays reachable: the Swindled Family (widened to rural) plants both;
    // the Wandering Healer also plants the Kin (THR-1565 may repoint that seed).
    for (const id of ['encounter.slice.swindler_found', 'encounter.slice.grateful_kin']) {
      const planters = (planterIndex.plantersOf.get(id) ?? []).map(s => s.planterId);
      expect(planters, `${id} lost every planter`).toContain('encounter.slice.swindled_family');
    }
  });
});
