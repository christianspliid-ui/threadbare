import { describe, it, expect } from 'vitest';
import { reportUnreachableActions } from '../unreachableActions';
import { collectGrantedActionIds } from '../../../data/ascendant-beat-content';
import { REACH_SIGNATURE_ID_BY_REACH } from '../../../data/reach-signature-content';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';

describe('reportUnreachableActions', () => {
  it('is deterministic — two calls produce equal reports', () => {
    const a = reportUnreachableActions();
    const b = reportUnreachableActions();
    expect(a).toEqual(b);
  });

  it('sorts entries by id ascending', () => {
    const { entries } = reportUnreachableActions();
    const ids = entries.map((e) => e.id);
    const sorted = [...ids].sort((x, y) => x.localeCompare(y));
    expect(ids).toEqual(sorted);
  });

  it('summary is internally consistent', () => {
    const { entries, summary } = reportUnreachableActions();
    expect(summary.unreachable).toBe(entries.length);
    // Every player-reachable template is exactly one of: granted, starter, or unreachable.
    // (granted ∩ starter can overlap, so this is an upper-bound sanity check, not strict equality.)
    expect(summary.playerReachableTemplates).toBeGreaterThanOrEqual(summary.unreachable);
    expect(summary.playerReachableTemplates).toBeGreaterThan(0);
  });

  it('excludes beat-granted templates from the unreachable set', () => {
    const granted = new Set(collectGrantedActionIds());
    const { entries } = reportUnreachableActions();
    for (const e of entries) {
      expect(granted.has(e.id)).toBe(false);
    }
    // Positive control: a template known to be beat-granted (divine.persuade — granted by
    // beat.spine.the_first_word) must be absent from the orphaned list.
    expect(granted.has('divine.persuade')).toBe(true);
    expect(entries.some((e) => e.id === 'divine.persuade')).toBe(false);
  });

  it('Bless this Company (company.bless) is beat-granted, not orphaned (THR-74)', () => {
    // company.bless ships with actorAffinities: ['ascendant']; it is reachable only via
    // the company milestone beat (beat.milestone.the_first_company). Confirm both the
    // grant and that the orphan report therefore excludes it.
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'company.bless');
    expect(template).toBeDefined();
    expect(template?.actorAffinities).toContain('ascendant');
    expect(collectGrantedActionIds()).toContain('company.bless');
    const { entries } = reportUnreachableActions();
    expect(entries.some((e) => e.id === 'company.bless')).toBe(false);
  });

  it('includes an ungranted, non-starter player-castable template', () => {
    // loc.fortify ships with actorAffinities: ['ascendant'], is not a starter, and is
    // not granted by any beat — the canonical residual orphan (THR-659 problem statement).
    const fortify = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'loc.fortify');
    expect(fortify).toBeDefined();
    expect(collectGrantedActionIds()).not.toContain('loc.fortify');

    const { entries } = reportUnreachableActions();
    const match = entries.find((e) => e.id === 'loc.fortify');
    expect(match).toBeDefined();
    expect(match?.reason).toBe('not-granted');
    expect(match?.reach).toBe('iron');
  });

  it('entries only contain player-castable (ascendant-affinity) templates', () => {
    const byId = new Map(UNIFIED_ACTION_TEMPLATES.map((t) => [t.id, t]));
    const { entries } = reportUnreachableActions();
    for (const e of entries) {
      const t = byId.get(e.id);
      expect(t).toBeDefined();
      expect(t?.actorAffinities).toContain('ascendant');
    }
  });

  it('excludes dynamically-granted reach signatures (invest.*) from the unreachable set', () => {
    // Reach signatures are granted per-run by the acquisition beat, not via static
    // grantsActionIds, so they must NOT be reported as orphaned (THR-523 dynamic path).
    const signatureIds = new Set(
      Object.values(REACH_SIGNATURE_ID_BY_REACH).filter((id): id is string => typeof id === 'string'),
    );
    expect(signatureIds.size).toBeGreaterThan(0);
    const report = reportUnreachableActions();
    const entryIds = new Set(report.entries.map((e) => e.id));
    for (const sig of signatureIds) {
      expect(entryIds.has(sig)).toBe(false);
    }
    expect(report.summary.dynamicSignature).toBe(signatureIds.size);
  });

  it('has no fail-soft warning on the happy path', () => {
    expect(reportUnreachableActions().warning).toBeUndefined();
  });
});
