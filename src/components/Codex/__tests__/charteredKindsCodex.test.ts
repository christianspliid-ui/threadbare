/**
 * The four kinds THR-1495 chartered into the codex.
 *
 * `surfaceRegistry.test.ts` pins the *routing* claim — that a row says `sheet: 'codex'`
 * exactly where the codex holds the kind. This file pins what the entries themselves are:
 * that every catalog entry became a card, that the cards say things in game words, and that
 * the two ladders invented here band their corpora across more than one rung.
 *
 * Each block names the edit that falsifies it, which is the only way a reader can tell a
 * contract test from decoration.
 */

import { describe, it, expect } from 'vitest';
import {
  buildLegendaryCodexEntries,
  buildCompanionCodexEntries,
  buildAmbitionCodexEntries,
  buildCardCodexEntries,
  buildCharteredKindCodexEntries,
  charteredKindCensus,
  undealableCardIds,
  ambitionTier,
  cardGroup,
  formatBesideYouContributions,
  BESIDE_YOU_CONTRIBUTION_BANDS,
  AMBITION_CATEGORY_WORDS,
  AMBITION_CATEGORY_GLYPHS,
  CARD_GROUP_WORDS,
  CARD_SUBCATEGORY_IDS,
  AMBITION_CATEGORY_ID,
  CARD_CATEGORY_ID,
  COMPANION_CATEGORY_ID,
  LEGENDARY_SUBCATEGORY_ID,
} from '../charteredKindsCodex';
import { getCodexCategories } from '../codexRegistry';
import { ARTIFACT_TEMPLATES } from '../../../data/artifact-templates';
import { COMPANION_TEMPLATES } from '../../../data/companion-templates';
import { NUDGE_CARD_LIBRARY } from '../../../data/nudge-card-library';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../../data/ambition-templates';

const AMBITION_COUNT =
  AMBITION_TEMPLATES.length +
  GRIEVANCE_AMBITION_TEMPLATES.length +
  EVENT_MINTED_AMBITION_TEMPLATES.length;

describe('chartered kinds — every catalog entry becomes a card', () => {
  it('catalogues all of each kind, not a curated subset', () => {
    // A partial mapper is the failure that looks like success: a tab renders, and nobody
    // notices the nine missing rows. Counts come from the catalogs, never from literals.
    // Falsify: filter any builder (e.g. drop `unique` companions).
    expect(buildLegendaryCodexEntries()).toHaveLength(ARTIFACT_TEMPLATES.length);
    expect(buildCompanionCodexEntries()).toHaveLength(COMPANION_TEMPLATES.length);
    expect(buildAmbitionCodexEntries()).toHaveLength(AMBITION_COUNT);
    expect(buildCardCodexEntries()).toHaveLength(NUDGE_CARD_LIBRARY.length);
  });

  it('gives every entry a distinct id and a name that is not its id', () => {
    // Two entries sharing an id silently collapse in `getAllCodexEntries`; a name that IS
    // the id is Law 14's failure reaching the card title.
    // Falsify: name a card `member.id` instead of `cardDisplayTitle(member)`.
    const entries = buildCharteredKindCodexEntries();
    const ids = entries.map(e => e.id);
    expect(new Set(ids).size, 'duplicate entry ids').toBe(ids.length);
    for (const e of entries) {
      expect(e.name, `"${e.id}" has no name`).toBeTruthy();
      expect(e.name, `"${e.id}" renders its id as its name`).not.toBe(e.id);
      expect(e.glyph, `"${e.id}" has no glyph`).toBeTruthy();
    }
  });

  it('routes each kind to the category the registry promises', () => {
    // Falsify: file legendary artifacts under their own category id.
    for (const e of buildLegendaryCodexEntries()) {
      expect(e.category).toBe('possessions');
      expect(e.subcategory).toBe(LEGENDARY_SUBCATEGORY_ID);
    }
    for (const e of buildCompanionCodexEntries()) expect(e.category).toBe(COMPANION_CATEGORY_ID);
    for (const e of buildAmbitionCodexEntries()) expect(e.category).toBe(AMBITION_CATEGORY_ID);
    for (const e of buildCardCodexEntries()) expect(e.category).toBe(CARD_CATEGORY_ID);
  });

  it('reaches the sidebar as three non-empty categories plus a Possessions group', () => {
    // The wiring test: a category id the builder writes but `catDefs` never lists renders
    // nowhere, and a `catDefs` row nothing writes to renders an empty tab. Both are
    // invisible without this.
    // Falsify: change CARD_CATEGORY_ID without changing the catDefs row.
    const categories = getCodexCategories();
    const total = (id: string) =>
      categories.find(c => c.id === id)?.subcategories.reduce((s, x) => s + x.count, 0) ?? 0;
    expect(total(COMPANION_CATEGORY_ID)).toBe(COMPANION_TEMPLATES.length);
    expect(total(AMBITION_CATEGORY_ID)).toBe(AMBITION_COUNT);
    expect(total(CARD_CATEGORY_ID)).toBe(NUDGE_CARD_LIBRARY.length);

    const possessions = categories.find(c => c.id === 'possessions');
    const legendaryGroup = possessions?.subcategories.find(s => s.id === LEGENDARY_SUBCATEGORY_ID);
    expect(legendaryGroup?.count).toBe(ARTIFACT_TEMPLATES.length);
    // The rail resolves it to a word, not to the key (Law 14).
    expect(legendaryGroup?.label).toBe('Legendary');
  });

  it('resolves every rail group to a word, never a raw key', () => {
    // Law 14 on the nav rail. The ambition rows are the live risk: their subcategory is the
    // engine's own `AmbitionCategory` spelling, so a category added to the union without a
    // word here would paint `vengeance` beside `Dominion`.
    // Falsify: delete the `...AMBITION_CATEGORY_WORDS` spread from SUBCATEGORY_DISPLAY.
    const rails = getCodexCategories()
      .filter(c => [AMBITION_CATEGORY_ID, CARD_CATEGORY_ID, COMPANION_CATEGORY_ID].includes(c.id))
      .flatMap(c => c.subcategories);
    expect(rails.length).toBeGreaterThan(0);
    for (const rail of rails) {
      expect(rail.label, `rail "${rail.id}" painted its key`).not.toBe(rail.id);
      expect(rail.label[0], `rail "${rail.id}" is not capitalised`).toBe(rail.label[0].toUpperCase());
    }
  });
});

describe('chartered kinds — the words on the cards', () => {
  it('never renders a `{name}` slot or a hash-tagged key into prose', () => {
    // A companion template's join sentence carries `{name}`, and the codex has no instance
    // to fill it with — leaving it raw shows the player an authoring placeholder.
    // Falsify: return `template.joinSentence` unsubstituted.
    for (const e of buildCharteredKindCodexEntries()) {
      const prose = [e.summary, e.flavorText ?? '', ...e.details.map(d => d.value)].join(' ');
      expect(prose, `"${e.id}" leaks a template slot`).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });

  it('says what a card does and what it decides, and never names the system it is wired to', () => {
    // `hostSystem` is a designer's word — `Riders (floor_at_cost)` names an engine symbol —
    // so it is the one field of the type table that must not reach the panel (Law 14).
    // Falsify: add a `Where it acts` detail carrying `type.hostSystem`.
    for (const e of buildCardCodexEntries()) {
      expect(e.summary, `card "${e.id}" says nothing about what it does`).toBeTruthy();
      expect(e.flavorText, `card "${e.id}" poses no decision`).toBeTruthy();
      const rendered = [e.summary, e.flavorText ?? '', ...e.details.map(d => d.value)].join(' ');
      expect(rendered, `card "${e.id}" names a code symbol`).not.toMatch(/[a-z]+_[a-z]+/);
    }
  });

  it('gives every ambition the prose a mortal takes it up with', () => {
    // The summary is authored selection prose, not a description written from outside.
    // Falsify: replace the summary with `template.displayName`.
    for (const e of buildAmbitionCodexEntries()) {
      expect(e.summary.length, `ambition "${e.id}" has no prose`).toBeGreaterThan(20);
      expect(e.summary).not.toBe(e.name);
    }
  });
});

describe('chartered kinds — the two ladders invented here', () => {
  it('bands the beside-you corpus across more than one rung', () => {
    // The reason this ladder exists at all: on the Codex's capability ladder every one of
    // these values reads `commanding`, and on its reach-bonus ladder every one reads
    // `faint`. A ladder that sorts a whole corpus onto one rung says nothing.
    // Falsify: set every band's `min` to 0.
    const values = [
      ...COMPANION_TEMPLATES.flatMap(c => Object.values(c.domainContributions as Record<string, number>)),
      ...ARTIFACT_TEMPLATES.flatMap(a => {
        const contribution = a.effects.find(
          (e): e is Extract<typeof e, { type: 'stat_contribution' }> => e.type === 'stat_contribution',
        );
        return contribution ? Object.values(contribution.contributions as Record<string, number>) : [];
      }),
    ];
    expect(values.length, 'nothing to band — the corpus moved').toBeGreaterThan(10);
    const words = new Set(
      values.map(v => formatBesideYouContributions({ iron: v }).match(/a (\w+) edge/)?.[1]),
    );
    expect(words.size, `every value banded as "${[...words][0]}"`).toBeGreaterThan(1);
    // And the top rung is reachable by real content, not just by the constant existing.
    expect(words.has(BESIDE_YOU_CONTRIBUTION_BANDS[0].word)).toBe(true);
  });

  it('bands ambitions across more than one tier', () => {
    // Same guard, other ladder: a reach-floor banding that sorted all 20 the same way would
    // make the tier colour decoration.
    // Falsify: return 1 from `ambitionTier`.
    const all = [...AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES];
    const tiers = new Set(all.map(ambitionTier));
    expect(tiers.size, `every ambition banded as tier ${[...tiers][0]}`).toBeGreaterThan(1);
  });

  it('keeps the display vocabularies total over the unions they resolve', () => {
    // Totality by construction — `Record<AmbitionCategory, …>` is a compile error when the
    // union grows — but the *glyph* map and the *word* map must also agree with each other,
    // which the type system does not say.
    // Falsify: delete the `vengeance` row from AMBITION_CATEGORY_GLYPHS.
    expect(Object.keys(AMBITION_CATEGORY_GLYPHS).sort()).toEqual(Object.keys(AMBITION_CATEGORY_WORDS).sort());
    expect(new Set(Object.values(AMBITION_CATEGORY_GLYPHS)).size).toBe(
      Object.keys(AMBITION_CATEGORY_GLYPHS).length,
    );
    expect(Object.keys(CARD_GROUP_WORDS).sort()).toEqual(Object.values(CARD_SUBCATEGORY_IDS).sort());
  });

  it('puts every card in exactly one rail group, and every group is used', () => {
    // Falsify: reorder `cardGroup`'s checks so `hunger` is tested after `sphere`.
    const groups = NUDGE_CARD_LIBRARY.map(cardGroup);
    expect(new Set(groups)).toEqual(new Set(Object.values(CARD_SUBCATEGORY_IDS)));
  });
});

describe('chartered kinds — the measured claims', () => {
  it('catalogues no card the dealer would refuse', () => {
    // The Law 25 check for this tab. Measured 0 on 2026-09-13; if it ever stops being 0 the
    // failure names the cards, because a library member the dealer refuses is a defect to
    // surface rather than a row to quietly hide.
    // Falsify: drop a member's play profile.
    expect(undealableCardIds(), 'library members the dealer would refuse').toEqual([]);
  });

  it('reports a census that matches the catalogs', () => {
    expect(charteredKindCensus()).toEqual({
      legendary: ARTIFACT_TEMPLATES.length,
      companions: COMPANION_TEMPLATES.length,
      ambitions: AMBITION_COUNT,
      cards: NUDGE_CARD_LIBRARY.length,
      undealableCards: 0,
    });
  });
});
