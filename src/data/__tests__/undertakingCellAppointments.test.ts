/**
 * The appointment payoff reaches the live board (THR-1519).
 *
 * The `undertakingCellCatalysts.test.ts` pattern, one table over: every row names a
 * cell the registry synthesises, both branches resolve against the static catalogs,
 * the kept family has an individual-performable member for every settlement tier the
 * meeting can be judged at, and the cell is one an ambition profile walks under the
 * cells model — asserted off the shipped profiles, never off a count.
 */
import { describe, expect, it } from 'vitest';
import {
  UNDERTAKING_CELL_APPOINTMENTS,
  UNDERTAKING_CELL_TEMPLATES,
  applyCellOverride,
  getCellTemplate,
} from '../undertaking-cells';
import { AMBITION_TEMPLATES } from '../ambition-templates';
import { profileWorkIds } from '../../engine/strategicActionCandidates';
import { contentQueryHasCandidates, describeContentQuery, resolveContentQuery } from '../../engine/contentQuery';
import { staticContentCatalogs } from '../../engine/contentCatalogView';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { contentTagsOnAxis } from '../content-tags';
import { buildUndertakingContractContext, checkUndertakingContract, failedBlocks, undertakingWriteSet } from '../content-eval/undertakingContract';

/** The tiers a mortal can be standing at when the meeting is judged there. */
const SETTLEMENT_SUBTYPES = ['hamlet', 'town', 'city', 'capital'];

const CELL = 'cell.create.agreement';

describe('the cell appointment table (THR-1519)', () => {
  it('every row names a cell that exists, and the cell carries the row as its appointmentPayoff', () => {
    for (const [cellId, payoff] of Object.entries(UNDERTAKING_CELL_APPOINTMENTS)) {
      const cell = getCellTemplate(cellId);
      expect(cell, `${cellId} is not a cell the registry synthesises`).toBeDefined();
      expect(cell!.appointmentPayoff, `${cellId} did not take its row at synthesis`).toEqual(payoff);
    }
    expect(UNDERTAKING_CELL_APPOINTMENTS[CELL]).toBeDefined();
  });

  it('a cell with no row declares no payoff — the table is the whole authored surface', () => {
    const rows = new Set(Object.keys(UNDERTAKING_CELL_APPOINTMENTS));
    const stray = UNDERTAKING_CELL_TEMPLATES.filter(t => t.appointmentPayoff && !rows.has(t.id)).map(t => t.id);
    expect(stray).toEqual([]);
    expect(UNDERTAKING_CELL_TEMPLATES.some(t => !t.appointmentPayoff)).toBe(true);
  });

  it('both branches are queries over seated family tags that resolve against the static catalogs', () => {
    // THR-1560: the seated family axis of the closed tag vocabulary — not the one-release
    // map of old id prefixes (`ENCOUNTER_FAMILY_TAGS`), which neither hunt tag belongs in.
    const seated = new Set<string>(contentTagsOnAxis('family').map(t => t.tag));
    const catalogs = staticContentCatalogs();
    for (const [cellId, payoff] of Object.entries(UNDERTAKING_CELL_APPOINTMENTS)) {
      for (const [arm, query] of [['meeting', payoff.meeting], ['missed', payoff.missed.query]] as const) {
        for (const tag of query.tags ?? []) {
          expect(seated.has(tag), `${cellId} ${arm} names ${tag}, which is not a seated family tag`).toBe(true);
        }
        expect(contentQueryHasCandidates(query, catalogs), `${cellId} ${arm}: ${describeContentQuery(query)} matches no content`).toBe(true);
      }
    }
  });

  it('the kept family has an individual-performable member for every settlement tier — the meeting is judged at the place', () => {
    const catalogs = staticContentCatalogs();
    for (const [cellId, payoff] of Object.entries(UNDERTAKING_CELL_APPOINTMENTS)) {
      const members = resolveContentQuery(payoff.meeting, catalogs)
        .map(hit => getUnifiedTemplateById(hit.id))
        .filter(t => t !== undefined && t.actorAffinities?.includes('individual'));
      for (const subtype of SETTLEMENT_SUBTYPES) {
        const accepting = members.filter(t => !t!.locationSubtypes?.length || t!.locationSubtypes.includes(subtype));
        expect(accepting.length, `${cellId}: ${describeContentQuery(payoff.meeting)} has no individual-performable member accepting a ${subtype}`).toBeGreaterThan(0);
      }
    }
  });

  it('the missed family has an individual-performable member accepting a settlement — the reckoning fires wherever the mortal is', () => {
    const catalogs = staticContentCatalogs();
    for (const [cellId, payoff] of Object.entries(UNDERTAKING_CELL_APPOINTMENTS)) {
      const spawnable = resolveContentQuery(payoff.missed.query, catalogs)
        .map(hit => getUnifiedTemplateById(hit.id))
        .filter(t => t !== undefined && t.actorAffinities?.includes('individual'))
        .filter(t => !t!.locationSubtypes?.length || t!.locationSubtypes.some(s => SETTLEMENT_SUBTYPES.includes(s)));
      expect(spawnable.length, `${cellId}: ${describeContentQuery(payoff.missed.query)} has no individual-performable member accepting a settlement`).toBeGreaterThan(0);
    }
  });

  it('an ambition profile lists the cell under the cells model — the board can reach it', () => {
    const listing = AMBITION_TEMPLATES.filter(t => t.strategicProfile && profileWorkIds(t.strategicProfile, 'cells').includes(CELL));
    expect(listing.map(t => t.id)).toContain('ambition_uncover_secrets');
  });

  it('the kept-word milestone reads the condition the payoff feeds', () => {
    const uncover = AMBITION_TEMPLATES.find(t => t.id === 'ambition_uncover_secrets')!;
    expect(uncover.milestones.some(m => m.condition.type === 'agent_kept_appointment')).toBe(true);
    expect(uncover.completion.of).toBe(uncover.milestones.length);
  });

  it('the contract admits the cell, records the meeting in the write set, and refuses a dead branch', () => {
    const ctx = buildUndertakingContractContext(UNDERTAKING_CELL_TEMPLATES);
    const cell = getCellTemplate(CELL)!;
    expect(failedBlocks(checkUndertakingContract(cell, ctx))).not.toContain('catalysts');
    expect(undertakingWriteSet(cell).catalysts.some(c => c.startsWith('appointment:'))).toBe(true);

    const dead = applyCellOverride(CELL, 'dead-meeting', {
      appointmentPayoff: { ...UNDERTAKING_CELL_APPOINTMENTS[CELL], meeting: { kind: 'encounter_template', tags: ['#no_such_family'] } },
    });
    expect(failedBlocks(checkUndertakingContract(dead, ctx))).toContain('catalysts');

    const oneArmed = applyCellOverride(CELL, 'one-armed', {
      appointmentPayoff: { ...UNDERTAKING_CELL_APPOINTMENTS[CELL], missed: { query: { kind: 'encounter_template', tags: ['#no_such_family'] }, seedLabel: 'x' } },
    });
    expect(failedBlocks(checkUndertakingContract(oneArmed, ctx))).toContain('catalysts');
  });
});
