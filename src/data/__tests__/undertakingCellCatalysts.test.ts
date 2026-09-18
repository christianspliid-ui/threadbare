/**
 * The catalyst reaches the live board (THR-1497).
 *
 * THR-1488 activated `catalystQuery` and measured that every carrier sat on the legacy
 * pack arm, which `UNDERTAKING_MODEL: 'cells'` never walks. The closing predicate the
 * ticket states — "a pack template's `catalystQuery` is unreachable while
 * `UNDERTAKING_MODEL === 'cells'` and no cell declares one" — is asserted here as a
 * conjunction that must now be false, off the live registry and the shipped profiles,
 * never off a count.
 */
import { describe, expect, it } from 'vitest';
import {
  UNDERTAKING_CELL_CATALYSTS,
  UNDERTAKING_CELL_TEMPLATES,
  applyCellOverride,
  getCellTemplate,
} from '../undertaking-cells';
import { AMBITION_TEMPLATES, GRIEVANCE_AMBITION_TEMPLATES } from '../ambition-templates';
import { UNDERTAKING_MODEL } from '../strategic-action-constants';
import { profileWorkIds } from '../../engine/strategicActionCandidates';
import { contentQueryHasCandidates, describeContentQuery, resolveContentQuery } from '../../engine/contentQuery';
import { staticContentCatalogs } from '../../engine/contentCatalogView';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { ENCOUNTER_FAMILY_TAGS } from '../../engine/encounterSeeding';

/** The subtypes a mortal finishing a settlement work is standing at; the seeding filter reads the same field. */
const SETTLEMENT_SUBTYPES = ['town', 'city', 'capital'];

describe('the cell catalyst table (THR-1497)', () => {
  it('every row names a cell that exists, and the cell carries the row as its catalystQuery', () => {
    for (const [cellId, query] of Object.entries(UNDERTAKING_CELL_CATALYSTS)) {
      const cell = getCellTemplate(cellId);
      expect(cell, `${cellId} is not a cell the registry synthesises`).toBeDefined();
      expect(cell!.catalystQuery, `${cellId} did not take its row at synthesis`).toEqual(query);
    }
  });

  it('a cell with no row declares no catalyst — the table is the whole authored surface', () => {
    const rows = new Set(Object.keys(UNDERTAKING_CELL_CATALYSTS));
    const stray = UNDERTAKING_CELL_TEMPLATES.filter(t => t.catalystQuery && !rows.has(t.id)).map(t => t.id);
    expect(stray, 'a cell carries a catalystQuery the table does not name').toEqual([]);
    expect(UNDERTAKING_CELL_TEMPLATES.some(t => !t.catalystQuery), 'every cell carries one — the "no row" branch is untested').toBe(true);
  });

  it('every family named is a seated THR-1488 family tag, and resolves against the static catalogs', () => {
    const seated = new Set<string>(Object.values(ENCOUNTER_FAMILY_TAGS));
    const catalogs = staticContentCatalogs();
    for (const [cellId, query] of Object.entries(UNDERTAKING_CELL_CATALYSTS)) {
      for (const tag of query.tags ?? []) {
        expect(seated.has(tag), `${cellId} names ${tag}, which is not a seated family tag`).toBe(true);
      }
      expect(
        contentQueryHasCandidates(query, catalogs),
        `${cellId}: ${describeContentQuery(query)} matches no content — the catalysts gate would fail it`,
      ).toBe(true);
    }
  });

  it('every family has a member the seeding site can spawn: individual-performable and settlement-accepting', () => {
    // The resolver decides what a query names; the seeding site then filters to
    // individual-performable templates accepting the target's location subtype
    // (`resolveSeedByQuery`). A family that resolves but has no such member seeds
    // nothing — `content.query_empty` — so membership alone is a vacuous proof.
    const catalogs = staticContentCatalogs();
    for (const [cellId, query] of Object.entries(UNDERTAKING_CELL_CATALYSTS)) {
      const spawnable = resolveContentQuery(query, catalogs)
        .map(hit => getUnifiedTemplateById(hit.id))
        .filter(t => t !== undefined)
        .filter(t => t!.actorAffinities?.includes('individual'))
        .filter(t => !t!.locationSubtypes?.length || t!.locationSubtypes.some(s => SETTLEMENT_SUBTYPES.includes(s)));
      expect(
        spawnable.length,
        `${cellId}: ${describeContentQuery(query)} has no individual-performable member accepting a settlement`,
      ).toBeGreaterThan(0);
    }
  });

  it('every family has a member for each of town, city and capital — a wake anchored on any of them can land (THR-1511)', () => {
    // THR-1511 anchors a catalyst on the settlement the work stands at, so a family
    // with a hole in its gate withers exactly there. `#craft_commission` had one:
    // its only member listed `settlement` (a subtype no location carries) and
    // omitted `capital`, and 3 of the 7 residual withers on seed 42 / medium / 200
    // ticks were masterworks made in a capital.
    const catalogs = staticContentCatalogs();
    for (const [cellId, query] of Object.entries(UNDERTAKING_CELL_CATALYSTS)) {
      const members = resolveContentQuery(query, catalogs)
        .map(hit => getUnifiedTemplateById(hit.id))
        .filter(t => t !== undefined && t.actorAffinities?.includes('individual'));
      for (const subtype of SETTLEMENT_SUBTYPES) {
        const accepting = members.filter(t => !t!.locationSubtypes?.length || t!.locationSubtypes.includes(subtype));
        expect(
          accepting.length,
          `${cellId}: ${describeContentQuery(query)} has no individual-performable member accepting a ${subtype}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('the closing predicate is false: under the live model, a cell a shipped profile walks declares a catalyst', () => {
    // "A pack template's catalystQuery is unreachable while UNDERTAKING_MODEL === 'cells'
    // and no cell declares one." Both operands, off the live flag and the profiles the
    // board reads through `profileWorkIds` — the same reader candidate generation uses.
    expect(UNDERTAKING_MODEL).toBe('cells');
    const walked = new Set(
      [...AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES]
        .filter(a => a.strategicProfile)
        .flatMap(a => profileWorkIds(a.strategicProfile!, 'cells')),
    );
    const reachableCarriers = UNDERTAKING_CELL_TEMPLATES.filter(t => t.catalystQuery && walked.has(t.id)).map(t => t.id);
    expect(reachableCarriers, 'no cell the live board walks carries a catalystQuery — the site is still dead').not.toEqual([]);
    // And every row is on the board, so no row is authored for a cell nobody can take.
    for (const cellId of Object.keys(UNDERTAKING_CELL_CATALYSTS)) {
      expect(walked.has(cellId), `${cellId} carries a catalyst but no shipped profile walks it`).toBe(true);
    }
  });

  it('a package override replaces the cell\'s row, and an override that says nothing keeps it', () => {
    const cellId = 'cell.create.place';
    const own = UNDERTAKING_CELL_CATALYSTS[cellId];
    expect(own).toBeDefined();
    const kept = applyCellOverride(cellId, 'kept', {});
    expect(kept.catalystQuery).toEqual(own);
    const replaced = applyCellOverride(cellId, 'replaced', { catalystQuery: { kind: 'encounter_template', tags: ['#tavern_night'] } });
    expect(replaced.catalystQuery).toEqual({ kind: 'encounter_template', tags: ['#tavern_night'] });
    expect(getCellTemplate(cellId)!.catalystQuery, 'the override mutated the base cell').toEqual(own);
  });
});
