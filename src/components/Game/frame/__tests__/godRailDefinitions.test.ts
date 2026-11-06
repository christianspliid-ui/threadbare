/**
 * THR-2183 — the opened folded row's definition line: its hover's first sentence.
 */
import { describe, it, expect } from 'vitest';
import { firstSentence, godRailDefinitionLine, resolveDefinitionRefs } from '../godRailDefinitions';
import { GOD_RAIL_SECTIONS } from '../../../../data/frame-registry';
import { resolveTooltip } from '../../../../engine/tooltipResolver';

describe('firstSentence', () => {
  it('cuts at the first ". " and keeps the full stop', () => {
    expect(firstSentence('Marks and vows. Each one points.')).toBe('Marks and vows.');
  });
  it('returns a desc with no sentence break whole', () => {
    expect(firstSentence('One sentence only.')).toBe('One sentence only.');
    expect(firstSentence('  no stop at all  ')).toBe('no stop at all');
  });
  it('returns null for an empty or missing desc', () => {
    expect(firstSentence('')).toBeNull();
    expect(firstSentence('   ')).toBeNull();
    expect(firstSentence(undefined)).toBeNull();
    expect(firstSentence(null)).toBeNull();
  });
  it('a {{ui.*}} reference before the cut survives the cut and resolves to its label', () => {
    const cut = firstSentence('Spent on {{ui.your_cards}} daily. Then more.');
    expect(cut).toBe('Spent on {{ui.your_cards}} daily.');
    const resolved = resolveDefinitionRefs(cut!);
    expect(resolved).not.toContain('{{');
    expect(resolved).toContain(resolveTooltip('ui.your_cards')!.label);
  });
  it('an unresolved reference never leaks its raw key', () => {
    expect(resolveDefinitionRefs('See {{ui.no_such_entry}}.')).toBe('See no such entry.');
  });
});

describe('godRailDefinitionLine', () => {
  it('every folded row with a hover gets a line; Hooks reads its hover\'s first sentence', () => {
    for (const def of GOD_RAIL_SECTIONS.filter((s) => s.place === 'folded')) {
      expect(def.tooltipId, def.id).not.toBeNull();
      expect(godRailDefinitionLine(def.tooltipId), def.id).toBeTruthy();
    }
    expect(godRailDefinitionLine('ui.hooks')).toBe('Marks, clues and vows that tie you to something unfinished.');
  });
  it('no line for a null or unresolved id', () => {
    expect(godRailDefinitionLine(null)).toBeNull();
    expect(godRailDefinitionLine('ui.no_such_entry')).toBeNull();
  });
  it('the Mandate row now has a hover (Law 1)', () => {
    const mandate = GOD_RAIL_SECTIONS.find((s) => s.id === 'mandate')!;
    expect(mandate.tooltipId).toBe('ui.mandate');
    expect(resolveTooltip('ui.mandate')?.label).toBe('Mandate');
  });
});
