/**
 * Chapter Archive tests (THR-603).
 *
 * Covers: eviction policy (pure), encounter-identity predicate, and the load-bearing
 * integration — a resolved encounter is archived and stays readable past
 * RESOLVED_ACTION_RETENTION_TICKS even after its UnifiedAction is pruned.
 */

import { describe, it, expect } from 'vitest';
import {
  appendChapters,
  isEncounterAction,
  getChapterTemplateName,
  CHAPTER_ARCHIVE_CAP,
  CHAPTER_ARCHIVE_EVICT_BATCH,
} from '../chapterArchive';
import type { ChapterRecord } from '../../types/chapterRecord';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import type { UnifiedAction } from '../../types/unifiedAction';

function mkRecord(id: string, threaded: boolean, resolvedTick: number): ChapterRecord {
  return {
    actionId: id,
    templateId: 'tmpl',
    templateName: 'Test Chapter',
    actorId: `actor-${id}`,
    actorName: 'Someone',
    targetId: 'place',
    targetName: 'Somewhere',
    scale: 'personal',
    startTick: resolvedTick - 1,
    resolvedTick,
    resolved: true,
    outcome: 'success',
    threaded,
    participants: [],
    openingProse: 'It began.',
    steps: [],
  };
}

describe('appendChapters — eviction policy', () => {
  it('does not evict below the cap', () => {
    const archive = [mkRecord('a', false, 1)];
    const result = appendChapters(archive, [mkRecord('b', false, 2)], 10, 5);
    expect(result).toHaveLength(2);
  });

  it('evicts oldest non-threaded first, keeping threaded chapters', () => {
    const cap = 4;
    const batch = 2;
    const archive: ChapterRecord[] = [
      mkRecord('old-threaded', true, 1),
      mkRecord('old-plain', false, 2),
      mkRecord('mid-plain', false, 3),
      mkRecord('new-threaded', true, 4),
    ];
    // Append one more → over cap (5 > 4) → evict a batch of 2, non-threaded oldest first.
    const result = appendChapters(archive, [mkRecord('newest-plain', false, 5)], cap, batch);
    const ids = result.map(r => r.actionId);
    // The two oldest non-threaded (old-plain, mid-plain) are evicted; threaded survive.
    expect(ids).not.toContain('old-plain');
    expect(ids).not.toContain('mid-plain');
    expect(ids).toContain('old-threaded');
    expect(ids).toContain('new-threaded');
    expect(ids).toContain('newest-plain');
  });

  it('uses real defaults that leave headroom (cap 2000, batch 100)', () => {
    expect(CHAPTER_ARCHIVE_CAP).toBe(2000);
    expect(CHAPTER_ARCHIVE_EVICT_BATCH).toBe(100);
  });
});

describe('isEncounterAction / getChapterTemplateName', () => {
  it('recognizes a real encounter template id', () => {
    const id = ENCOUNTER_TEMPLATES[0].id;
    expect(isEncounterAction(id)).toBe(true);
    expect(getChapterTemplateName(id)).toBe(ENCOUNTER_TEMPLATES[0].name);
  });

  it('rejects an unknown / non-encounter template id', () => {
    expect(isEncounterAction('___not_a_real_template___')).toBe(false);
    expect(getChapterTemplateName('___not_a_real_template___')).toBe('___not_a_real_template___');
  });
});

describe('orchestrator archive integration', () => {
  it('archives a resolved encounter and keeps it readable past retention', () => {
    resetDecisionCache();
    resetEventCounter();
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.small;
    const runtime = createSimulationRuntime();
    const { state: initialState } = initializeGameState(
      archetype,
      'Test-Runner',
      createBalancedCosmology(),
      42,
      preset.cols,
      preset.rows,
    );

    const actor = initialState.graph
      .getNodesByType('actor')
      .find(n => n.properties.actorType === 'individual');
    expect(actor).toBeTruthy();

    const encTemplate = ENCOUNTER_TEMPLATES[0];
    const resolvedEncounter: UnifiedAction = {
      actionId: 'chapter-test-action',
      actorId: actor!.id,
      templateId: encTemplate.id,
      targetId: actor!.id,
      scale: 'personal',
      source: 'agent',
      startTick: initialState.tick,
      currentStep: 1,
      stepProgress: 0,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };

    let state = {
      ...initialState,
      unifiedActions: [...initialState.unifiedActions, resolvedEncounter],
    };

    // One tick: the resolved encounter is stamped + archived before the prune.
    state = runTick(state, [], runtime);
    const archived = (state.chapterArchive ?? []).find(r => r.actionId === 'chapter-test-action');
    expect(archived).toBeTruthy();
    expect(archived!.resolved).toBe(true);
    expect(archived!.outcome).toBe('success');
    expect(archived!.templateName).toBe(encTemplate.name);

    // Run well past RESOLVED_ACTION_RETENTION_TICKS (20).
    for (let i = 0; i < 25; i++) {
      state = runTick(state, [], runtime);
    }

    // The heavyweight UnifiedAction is pruned…
    expect(state.unifiedActions.some(a => a.actionId === 'chapter-test-action')).toBe(false);
    // …but the chapter stays readable.
    expect((state.chapterArchive ?? []).some(r => r.actionId === 'chapter-test-action')).toBe(true);
    // Runs 60+ real ticks — the vitest 5s default flakes under full-suite CPU
    // contention (THR-689 method note: explicit timeout for >50-tick tests).
  }, 20_000);
});
