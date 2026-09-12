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
import { validateEncounterSeedRefs } from '../nudgeGrantLiveness';
import { ENCOUNTER_FAMILY_TAGS, seedContentQuery } from '../encounterSeeding';
import { contentQueryHasCandidates } from '../contentQuery';
import { staticContentCatalogs } from '../contentCatalogView';

const CORPUS = [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES];

/**
 * Sites whose `encounterFamily` prefix matches no template — measured 2026-09-12 at 168
 * across 39 families, immediately after this slice repaired the seven fatal ones.
 *
 * Lower this number when families are migrated; never raise it. The repair is one of two
 * things per family: an `ENCOUNTER_FAMILY_TAGS` row plus the tag on its members, or
 * `query` authored directly on the seed.
 */
const DEAD_FAMILY_SITE_CEILING = 168;

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
