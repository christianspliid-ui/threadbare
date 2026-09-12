/**
 * The four-edit trap, held shut (THR-1488, slice 4 of THR-1481).
 *
 * **What this test is for.** A `tags` field on an encounter survives only if *four*
 * places carry it: `UnifiedActionTemplate`, the raw entry type, and the `toUnifiedTemplate`
 * converter in each of the two files that have one. Both converters are field allowlists
 * rather than spreads, so a field declared on the entry type and forgotten in the
 * converter **compiles, reads correctly to a reviewer, and connects nothing** — the
 * template ships without the tag, no query can find it, and the only symptom is a family
 * that looks empty. That is not hypothetical: this corpus's own `favorGeneration` sat
 * inert exactly that way until THR-724 found it, and the nudge fields until THR-838.
 *
 * So the Done-when is not the type. It is this: a tag authored on a raw entry is present
 * on the exported template.
 *
 * **Why it reads the shipped corpus rather than a fixture.** Neither converter is
 * exported, and a fixture would have to invent both the entry and the expected output —
 * which proves the fixture consistent with itself and says nothing about the two
 * converters the game actually runs through. The templates asserted below are real
 * content with real tags, reached through the same exported arrays the engine reads.
 *
 * **Falsification** (run when changing this file): delete the `tags: e.tags` line from
 * `toUnifiedTemplate` in `src/data/encounter-content.ts` and the raw-entry arm fails by
 * name; delete `tags: template.tags` in `src/data/faction-encounter-content.ts` and the
 * faction arm fails. Verified both ways on 2026-09-12.
 */
import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import { FACTION_ENCOUNTER_TEMPLATES } from '../faction-encounter-content';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../unified-action-templates';
import { isContentTag } from '../content-tags';
import { effectiveTags } from '../contentEntryTags';
import { resolveContentQuery } from '../../engine/contentQuery';
import { staticContentCatalogs } from '../../engine/contentCatalogView';

/** One tagged entry per converter — real content, not a fixture. */
const RAW_ENTRY_BEARER = 'encounter.delve_into_depths';
const FACTION_ENTRY_BEARER = 'ag.quest.ruin_delve';

describe('encounter tags survive both toUnifiedTemplate converters', () => {
  it('the raw-entry converter (encounter-content.ts) passes tags through', () => {
    const template = ENCOUNTER_TEMPLATES.find(t => t.id === RAW_ENTRY_BEARER);
    expect(template, `${RAW_ENTRY_BEARER} is not in ENCOUNTER_TEMPLATES`).toBeDefined();
    expect(template!.tags, 'the raw-entry converter dropped `tags`').toEqual(['#delve']);
  });

  it('the faction converter (faction-encounter-content.ts) passes tags through', () => {
    const template = FACTION_ENCOUNTER_TEMPLATES.find(t => t.id === FACTION_ENTRY_BEARER);
    expect(template, `${FACTION_ENTRY_BEARER} is not in FACTION_ENCOUNTER_TEMPLATES`).toBeDefined();
    expect(template!.tags, 'the faction converter dropped `tags`').toEqual(['#guild_errand']);
  });

  it('both survive the pooling into UNIFIED_ACTION_TEMPLATES the engine reads', () => {
    // The converters are only half the journey: a template is pooled, sometimes
    // group-swept (`withGroupAffinity`), before anything queries it. A sweep that
    // rebuilt the object field-by-field would drop the tag here instead.
    for (const id of [RAW_ENTRY_BEARER, FACTION_ENTRY_BEARER]) {
      const pooled = getUnifiedTemplateById(id);
      expect(pooled, `${id} is not registered`).toBeDefined();
      expect(pooled!.tags?.length, `${id} lost its tags between converter and pool`).toBeGreaterThan(0);
    }
  });

  it('every tag any template authors is seated in the vocabulary', () => {
    const unseated = UNIFIED_ACTION_TEMPLATES
      .flatMap(t => (t.tags ?? []).map(tag => ({ id: t.id, tag })))
      .filter(({ tag }) => !isContentTag(tag));
    expect(
      unseated,
      `templates authoring tags outside CONTENT_TAGS:\n${unseated.map(u => `${u.id}: ${u.tag}`).join('\n')}`,
    ).toEqual([]);
  });

  it('the sweep above is not vacuous — the corpus does carry tags', () => {
    // The guard the seating sweep needs: with zero tag-bearing templates it would pass
    // over an empty set and report the vocabulary clean about nothing.
    const bearers = UNIFIED_ACTION_TEMPLATES.filter(t => (t.tags?.length ?? 0) > 0);
    expect(bearers.length).toBeGreaterThan(50);
  });
});

describe('the projection reaches encounters, so a family need not re-author cosmology', () => {
  it("a tagged template's effective tags include its reach and sphere, unauthored", () => {
    const template = getUnifiedTemplateById(FACTION_ENTRY_BEARER)!;
    const tags = effectiveTags('encounter_template', template);
    expect(tags).toContain('#guild_errand');
    expect(tags, 'reach is projected, never authored').toContain(`#${template.reach}`);
    // Authoring the reach tag as well would be the contradiction `contentTags.test.ts`
    // fails on; absence here is what makes that rule cost nothing to obey.
    expect(template.tags).not.toContain(`#${template.reach}`);
  });
});

describe('a family tag is findable by the resolver every gate and seed site uses', () => {
  it('each faction quest family resolves to its five members and nothing else', () => {
    const catalogs = staticContentCatalogs();
    // The predicate, not a snapshot: every family tag seated for encounters must name a
    // set the resolver can find. A count per family would rot the moment a sixth quest
    // is authored — the invariant is "the tag finds its members", not "five".
    const FAMILIES = ['#guild_errand', '#circle_errand', '#watch_errand', '#thieves_errand',
      '#consortium_errand', '#company_errand', '#covenant_errand', '#temple_errand',
      '#ranger_errand', '#court_errand', '#dawn_errand', '#fellowship_errand'] as const;
    for (const tag of FAMILIES) {
      const hits = resolveContentQuery({ kind: 'encounter_template', tags: [tag] }, catalogs);
      expect(hits.length, `${tag} names no encounter template`).toBeGreaterThan(0);
      for (const hit of hits) {
        expect(getUnifiedTemplateById(hit.id), `${tag} → unregistered ${hit.id}`).toBeDefined();
      }
    }
  });

  it('a tag nothing wears resolves to nothing rather than to everything', () => {
    // The failure mode the `#` rule exists for (THR-1146): a filter that matches nothing
    // must not be read as a filter that imposes nothing.
    const hits = resolveContentQuery(
      { kind: 'encounter_template', tags: ['#no_such_family'] },
      staticContentCatalogs(),
    );
    expect(hits).toEqual([]);
  });
});
