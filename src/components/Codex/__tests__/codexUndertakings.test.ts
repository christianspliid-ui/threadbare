/**
 * The Undertakings codex section (THR-1434).
 *
 * One card per live cell, from the same registry and dispositions the grid reads;
 * game words only; who tends to do it derived under the division rule; and the
 * build-by-name failure a cell without a phrase or a note would cause — falsified
 * against an injected template, so the guard is proven able to fail.
 */

import { describe, it, expect } from 'vitest';
import { getAllCodexEntries, getCodexCategories } from '../codexRegistry';
import {
  buildUndertakingCodexEntries,
  validateUndertakingCodex,
  undertakingCodexCensus,
  UNDERTAKING_KIND_GLYPHS,
  genericCellLine,
} from '../undertakingCodex';
import { UNDERTAKING_CELL_TEMPLATES } from '../../../data/undertaking-cells';
import { UNDERTAKING_CELL_PHRASES } from '../../../data/undertaking-verb-prose';
import { UNDERTAKING_OBJECT_TYPES } from '../../../data/undertaking-objects';
import { callingsForCell, cellsOfCalling } from '../../../data/division-rule-tables';
import { CALLING_ROWS } from '../../../data/calling-content';
import type { StrategicActionTemplate } from '../../../types/strategicAction';

describe('the Undertakings codex section', () => {
  it('has one entry per live cell of the grid, and the catalog carries the section', () => {
    const entries = buildUndertakingCodexEntries();
    expect(entries.length).toBe(UNDERTAKING_CELL_TEMPLATES.length);
    expect(new Set(entries.map(e => e.id)).size).toBe(entries.length);
    const inCatalog = getAllCodexEntries().filter(e => e.category === 'undertakings');
    expect(inCatalog.length).toBe(entries.length);
    const category = getCodexCategories().find(c => c.id === 'undertakings');
    expect(category?.label).toBe('Undertakings');
    expect(category!.subcategories.reduce((n, s) => n + s.count, 0)).toBe(entries.length);
    // The rail groups by verb, and every verb word resolves (no raw `change:raise`).
    for (const sub of category!.subcategories) expect(sub.label).not.toMatch(/[:_]/);
  });

  it('speaks game words only — no cell id, no code symbol, no numeral on any card', () => {
    for (const e of buildUndertakingCodexEntries()) {
      for (const text of [e.name, e.subtitle, e.summary, ...e.tags, ...e.details.map(d => `${d.label} ${d.value}`)]) {
        expect(text, e.id).not.toMatch(/cell\.|_[a-z]|\{|\}|`|\d/);
      }
      expect(e.glyph.length).toBeGreaterThan(0);
      expect(e.summary.length).toBeGreaterThan(0);
    }
  });

  it('every card names who tends to do it, its counter-play row and whether it needs a reason', () => {
    const entries = buildUndertakingCodexEntries();
    for (const e of entries) {
      const labels = e.details.map(d => d.label);
      expect(labels).toEqual(expect.arrayContaining(['Who tends to do it', 'Counter-play', 'Needs a reason', 'The verb', 'The kind of thing']));
      expect(e.details.find(d => d.label === 'The verb')?.tooltipId).toMatch(/^ui\.verb\./);
    }
    // The division rule reaches the great majority of cells with at least one calling;
    // the ones nobody leans toward are reported, not hidden.
    const unclaimed = entries.filter(e => e.details.find(d => d.label === 'Who tends to do it')?.value === 'Nobody by inclination');
    expect(unclaimed.length, `no calling leans toward: ${unclaimed.map(e => e.id).join(', ')}`).toBeLessThanOrEqual(Math.floor(entries.length / 4));
  });

  it('who tends to do it is derived from the division tables, and the derivation is reversible', () => {
    // A Trader's spread includes claiming a route; the codex card for that cell names the Trader.
    const trader = CALLING_ROWS.find(r => r.titleKey === 'trader')!;
    const traderCells = cellsOfCalling(trader);
    expect(traderCells.length).toBeGreaterThan(0);
    for (const cellId of traderCells) {
      expect(callingsForCell(cellId).map(c => c.titleKey)).toContain('trader');
    }
  });

  it('every kind the registry declares has a glyph', () => {
    expect(Object.keys(UNDERTAKING_KIND_GLYPHS).sort()).toEqual(UNDERTAKING_OBJECT_TYPES.map(t => t.id).sort());
  });

  it('the generic line fills every slot — nothing braced reaches a card', () => {
    for (const t of UNDERTAKING_CELL_TEMPLATES) {
      expect(genericCellLine(t.cellVariant!, t.objectTypeId!, 'thing')).not.toMatch(/[{}]/);
    }
  });

  it('fails the build by name on a live cell without a phrase or a note — and passes on the real set', () => {
    expect(validateUndertakingCodex()).toEqual([]);
    const broken = { ...UNDERTAKING_CELL_TEMPLATES[0], id: 'cell.create.nowhere', displayName: '', objectTypeId: 'area', cellVariant: 'create' } as StrategicActionTemplate;
    const problems = validateUndertakingCodex([broken]);
    expect(problems.map(p => p.cellId)).toContain('cell.create.nowhere');
    expect(problems.some(p => p.problem === 'no plain phrase')).toBe(true);
    const census = undertakingCodexCensus();
    expect(census.entries).toBe(census.liveCells);
    expect(census.problems).toEqual([]);
  });

  // THR-1438 — UI Laws 13/14 on the cards the ownership band added. The generic
  // phrase is `<Verb> <a kind>`, which for these seven says the wrong thing: seizing a
  // company is a *mutiny* and seizing a faction a *usurpation*, and "Claim a faction"
  // describes an outcome a candidacy does not produce. Pinned by name because a
  // silently-reverted phrase would leave the card building and lying.
  it('the ownership band`s cards speak the game`s words, not the verb`s', () => {
    const named = new Map(UNDERTAKING_CELL_TEMPLATES.map(t => [t.id, t.displayName]));
    expect(named.get('cell.control_claim.company')).toBe('Take command of a company');
    expect(named.get('cell.control_seize.company')).toBe('Mutiny against a commander');
    expect(named.get('cell.control_claim.army')).toBe('Take command of an army');
    expect(named.get('cell.control_seize.army')).toBe('Mount a coup');
    expect(named.get('cell.control_claim.faction')).toBe('Stand for a seat');
    expect(named.get('cell.control_seize.faction')).toBe('Usurp a leader');
    expect(named.get('cell.observe.army')).toBe('Scout an army');

    // And every phrase in the table belongs to a live cell — an entry for a cell that
    // does not exist is a phrase nobody will ever read, and the kind of stale row the
    // grid's own totality check exists to prevent elsewhere.
    for (const cellId of Object.keys(UNDERTAKING_CELL_PHRASES)) {
      expect(named.has(cellId), `${cellId} has a phrase but is not a live cell`).toBe(true);
    }
  });
});
