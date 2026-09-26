/**
 * THR-1582 trap 1 (retry loops) — the failed-template cooldown, as a fixture.
 *
 * Plan `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Done when S4: "a failed
 * template's cooldown is `FAILED_TEMPLATE_COOLDOWN_MULT` × a succeeded one's". And
 * THR-1581's finding: a resolved `UnifiedAction` is pruned after 20 ticks, shorter
 * than that cooldown, so a failure must also be read from the chapter archive — on a
 * seeded world the pruned read let 19 of 121 failures be retried at 21–24 ticks.
 */
import { describe, it, expect } from 'vitest';
import { filterByCooldown } from '../phaseAgentDecision';
import { ENCOUNTER_COMPLETION_COOLDOWN } from '../../types/encounter';
import { FAILED_TEMPLATE_COOLDOWN_MULT, COOLDOWN_FULL_POOL_SIZE } from '../../data/agent-behavior-constants';
import type { EncounterCacheEntry } from '../encounterCache';
import type { UnifiedAction, UnifiedActionOutcome } from '../../types/unifiedAction';
import type { ChapterRecord } from '../../types/chapterRecord';

const AGENT = 'agent.a';
const TEMPLATE = 'encounter.test';
const RESOLVED_AT = 100;
/** A full pool, so the completion cooldown is the unscaled base. */
const POOL = COOLDOWN_FULL_POOL_SIZE;

const candidates = [{ templateId: TEMPLATE }] as EncounterCacheEntry[];

function resolvedAction(outcome: UnifiedActionOutcome): UnifiedAction {
  return {
    actionId: 'ua.1', actorId: AGENT, templateId: TEMPLATE, targetId: 'loc',
    scale: 'local', source: 'agent', startTick: 90, currentStep: 1, stepProgress: 0,
    stepDuration: 1, resolved: true, stepOutcomes: [], outcome, completedAtTick: RESOLVED_AT,
  } as unknown as UnifiedAction;
}

function archived(outcome: UnifiedActionOutcome, resolvedTick = RESOLVED_AT, actorId = AGENT): ChapterRecord {
  return { templateId: TEMPLATE, actorId, startTick: resolvedTick - 5, resolvedTick, outcome } as unknown as ChapterRecord;
}

const offered = (tick: number, actions: UnifiedAction[], archive: ChapterRecord[] = []) =>
  filterByCooldown(candidates, AGENT, [], actions, tick, POOL, archive).length === 1;

describe('the failed-template cooldown (THR-1582 trap 1)', () => {
  const completion = ENCOUNTER_COMPLETION_COOLDOWN;
  const failed = ENCOUNTER_COMPLETION_COOLDOWN * FAILED_TEMPLATE_COOLDOWN_MULT;

  it('holds a failed template FAILED_TEMPLATE_COOLDOWN_MULT times as long as a succeeded one', () => {
    expect(FAILED_TEMPLATE_COOLDOWN_MULT).toBeGreaterThan(1);
    // Succeeded: back on the board right after the completion cooldown.
    expect(offered(RESOLVED_AT + completion, [resolvedAction('success')])).toBe(false);
    expect(offered(RESOLVED_AT + completion + 1, [resolvedAction('success')])).toBe(true);
    // Failed: held for the multiplied cooldown.
    expect(offered(RESOLVED_AT + completion + 1, [resolvedAction('failure')])).toBe(false);
    expect(offered(RESOLVED_AT + failed, [resolvedAction('failure')])).toBe(false);
    expect(offered(RESOLVED_AT + failed + 1, [resolvedAction('failure')])).toBe(true);
  });

  it('still holds a failure after the resolved action was pruned, by reading the chapter archive', () => {
    // No live action: it was pruned. Without the archive the template is offered again.
    const afterPrune = RESOLVED_AT + completion + 5;
    expect(offered(afterPrune, [])).toBe(true);
    expect(offered(afterPrune, [], [archived('failure')])).toBe(false);
    expect(offered(RESOLVED_AT + failed + 1, [], [archived('failure')])).toBe(true);
  });

  it('reads only this mortal\'s failures from the archive, and never extends a success', () => {
    const afterPrune = RESOLVED_AT + completion + 5;
    expect(offered(afterPrune, [], [archived('failure', RESOLVED_AT, 'agent.other')])).toBe(true);
    expect(offered(afterPrune, [], [archived('success')])).toBe(true);
    expect(offered(afterPrune, [], [archived('critical_failure')])).toBe(false);
  });

  it('stops the archive scan at the first record older than the failed window', () => {
    // An ancient failure sits behind a newer one; only the window's records count.
    const ancient = archived('failure', RESOLVED_AT - failed - 50);
    const recentOther = archived('success', RESOLVED_AT + 10, 'agent.other');
    expect(offered(RESOLVED_AT + 20, [], [ancient, recentOther])).toBe(true);
  });
});
