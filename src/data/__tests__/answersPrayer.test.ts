/**
 * THR-1935 S1 — the `answers_prayer` flag and the effects it promises, held together.
 *
 * Two directions (plan § Data tables, completeness tests):
 * 1. every flagged template targets a location and writes at least one of prosperity +,
 *    staple stock + (the `bless_harvest` op) or unrest −;
 * 2. every location-target player template that writes staple stock + or unrest −
 *    carries the flag, or is listed in `PRAYER_NON_ANSWERING` with its reason.
 */
import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { ANSWERS_PRAYER_FLAG, PRAYER_NON_ANSWERING } from '../prayer-constants';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

interface OpLike { op?: string; changes?: Record<string, unknown> }

function successOps(t: UnifiedActionTemplate): OpLike[] {
  const out: OpLike[] = [];
  for (const step of (t.steps ?? []) as unknown as Array<{ onSuccess?: OpLike[] }>) {
    for (const op of step.onSuccess ?? []) out.push(op);
  }
  return out;
}

function deltaSign(v: unknown): number {
  if (typeof v === 'number') return Math.sign(v);
  if (typeof v === 'string') {
    const n = Number(v.replace(/^\+/, ''));
    return Number.isFinite(n) ? Math.sign(n) : 0;
  }
  return 0;
}

function writesStaplesUp(t: UnifiedActionTemplate): boolean {
  return successOps(t).some(o => o.op === 'bless_harvest');
}

function writesUnrestDown(t: UnifiedActionTemplate): boolean {
  return successOps(t).some(o => o.op === 'update_node' && deltaSign(o.changes?.unrest) < 0);
}

function writesProsperityUp(t: UnifiedActionTemplate): boolean {
  return successOps(t).some(o => o.op === 'update_node' && deltaSign(o.changes?.prosperity) > 0);
}

const isFlagged = (t: UnifiedActionTemplate) => !!t.progression?.flags?.includes(ANSWERS_PRAYER_FLAG);
const targetsLocation = (t: UnifiedActionTemplate) => (t.targetCategories ?? []).includes('location');
const isPlayerCard = (t: UnifiedActionTemplate) => (t.actorAffinities ?? []).includes('ascendant');

describe('answers_prayer completeness (THR-1935)', () => {
  it('the decided answering cards carry the flag', () => {
    const flagged = UNIFIED_ACTION_TEMPLATES.filter(isFlagged).map(t => t.id).sort();
    expect(flagged).toEqual(expect.arrayContaining(['loc.bless_harvest', 'loc.open_markets']));
  });

  it('every flagged card targets a location and feeds or calms it', () => {
    const bad = UNIFIED_ACTION_TEMPLATES.filter(isFlagged).filter(t =>
      !targetsLocation(t) || !(writesProsperityUp(t) || writesStaplesUp(t) || writesUnrestDown(t)),
    ).map(t => t.id);
    expect(bad).toEqual([]);
  });

  it('every location-target player card that feeds staples or calms unrest answers, or says why not', () => {
    const exempt = new Set(PRAYER_NON_ANSWERING.map(e => e.templateId));
    const missing = UNIFIED_ACTION_TEMPLATES
      .filter(t => targetsLocation(t) && isPlayerCard(t))
      .filter(t => writesStaplesUp(t) || writesUnrestDown(t))
      .filter(t => !isFlagged(t) && !exempt.has(t.id))
      .map(t => t.id);
    expect(missing).toEqual([]);
  });

  it('every non-answering exemption names a real template and a reason', () => {
    const ids = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
    for (const e of PRAYER_NON_ANSWERING) {
      expect(ids.has(e.templateId)).toBe(true);
      expect(e.reason.trim().length).toBeGreaterThan(0);
    }
  });
});
