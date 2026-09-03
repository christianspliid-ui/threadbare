/**
 * Cells are derived, not authored (THR-1392 slice 2): one per (variant, type) the
 * registry declares a semantic for, carrying exactly what a template carries — the
 * object rule under the variant's ownership, the gate and harm on the counter-play
 * variants only, numbers from the verb tables, prose from the line-sets.
 */
import { describe, it, expect } from 'vitest';
import {
  UNDERTAKING_CELL_TEMPLATES,
  cellTemplateId,
  getCellTemplate,
  isCellTemplateId,
  cellsOfType,
  baseVerbOf,
  FOUND_SITE_RULE,
} from '../undertaking-cells';
import { UNDERTAKING_OBJECT_TYPES } from '../undertaking-objects';
import { UNDERTAKING_VERB_PROSE } from '../undertaking-verb-prose';
import {
  OWNERSHIP_BY_VERB,
  MOTIVE_GATED_VERBS,
  UNDERTAKING_VERB_VARIANTS,
  UNDERTAKING_DEFAULT_TIER,
  UNDERTAKING_VERB_PAYOFF,
} from '../strategic-action-constants';
import { UNDERTAKING_TIER_PAYOFF_BANDS, UNDERTAKING_MOTIVATION_MIN_ARITY } from '../content-eval/undertakingConstants';
import { getStrategicTemplate } from '../../engine/strategicActionCandidates';

describe('cell synthesis', () => {
  it('makes exactly one cell per declared (variant, type), with unique ids', () => {
    const declared = UNDERTAKING_OBJECT_TYPES.flatMap(t =>
      UNDERTAKING_VERB_VARIANTS.filter(v => t.verbs[v] !== undefined).map(v => cellTemplateId(v, t.id)),
    );
    expect(UNDERTAKING_CELL_TEMPLATES.map(t => t.id).sort()).toEqual([...declared].sort());
    expect(new Set(declared).size).toBe(declared.length);
    expect(declared.length).toBeGreaterThanOrEqual(20);
    for (const id of declared) expect(isCellTemplateId(id)).toBe(true);
    expect(cellTemplateId('control:seize', 'room')).toBe('cell.control_seize.room');
    expect(baseVerbOf('control:seize')).toBe('control');
    expect(baseVerbOf('undo')).toBe('undo');
  });

  it('every cell carries the object rule, the verb, the tables and the prose', () => {
    for (const cell of UNDERTAKING_CELL_TEMPLATES) {
      const variant = cell.cellVariant!;
      expect(cell.undertakingVerb).toBe(baseVerbOf(variant));
      // A found cell targets its site (the object does not exist yet); every other cell the object.
      if (variant === 'found') expect(cell.targetRule).toEqual(FOUND_SITE_RULE[cell.objectTypeId!]);
      else expect(cell.targetRule).toEqual({ type: 'object', objectTypeId: cell.objectTypeId, ownership: OWNERSHIP_BY_VERB[variant] });
      expect(cell.activityProse.length).toBeGreaterThanOrEqual(3);
      expect(cell.completionProse.length).toBeGreaterThanOrEqual(3);
      expect(cell.activityProse).toEqual(UNDERTAKING_VERB_PROSE[variant].activity);
      expect(cell.motivations?.length ?? 0).toBeGreaterThanOrEqual(UNDERTAKING_MOTIVATION_MIN_ARITY);
      expect(cell.payoffValue).toBe(UNDERTAKING_VERB_PAYOFF[variant][UNDERTAKING_DEFAULT_TIER - 1]);
      const [lo, hi] = UNDERTAKING_TIER_PAYOFF_BANDS[UNDERTAKING_DEFAULT_TIER];
      expect(cell.payoffValue!).toBeGreaterThanOrEqual(lo);
      expect(cell.payoffValue!).toBeLessThanOrEqual(hi);
      expect(cell.displayName).not.toMatch(/[_:]/);
      expect(cell.mutationHint).toEqual({ type: 'no_mutation' });
    }
  });

  it('gates and harms ride the counter-play variants only', () => {
    for (const cell of UNDERTAKING_CELL_TEMPLATES) {
      const gated = MOTIVE_GATED_VERBS.includes(cell.cellVariant!);
      expect(!!cell.motiveGate?.length, cell.id).toBe(gated);
      expect(cell.harmClass !== undefined, cell.id).toBe(gated);
    }
    expect(getCellTemplate('cell.undo.route')?.harmClass).toBe('network_severed');
    expect(getCellTemplate('cell.control_seize.room')?.harmClass).toBe('holding_seized');
    expect(getCellTemplate('cell.control_claim.room')?.harmClass).toBeUndefined();
  });

  it('execution mode follows the type: settlement control is the sustained mode, use is instant, the rest are projects', () => {
    expect(getCellTemplate('cell.control_claim.settlement')?.executionMode).toBe('claim_control');
    expect(getCellTemplate('cell.use.mark')?.executionMode).toBe('instant');
    expect(getCellTemplate('cell.use.mark')?.projectDuration).toBeUndefined();
    expect(getCellTemplate('cell.undo.settlement')?.executionMode).toBe('multi_tick_project');
    expect(getCellTemplate('cell.undo.settlement')?.projectDuration).toBeGreaterThan(0);
    expect(cellsOfType('mark').map(c => c.cellVariant).sort()).toEqual(['undo', 'use']);
  });

  it('is resolvable through getStrategicTemplate without being in the pack registry', () => {
    expect(getStrategicTemplate('cell.undo.attachment')?.objectTypeId).toBe('attachment');
    expect(getStrategicTemplate('cell.no.such')).toBeUndefined();
  });
});
