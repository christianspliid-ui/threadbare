/**
 * THR-2178 — one predicate says which chapters wait for the god.
 *
 * `chapterOffersPlayerMove` is the chapter-level reading of `stepOffersPlayerMove`
 * (the same predicate the hold reads), and `chapterWaitWord` gates it to an
 * "Asks you" thread. The Ledger row, the Stage header and the Aftermath's alone
 * line all read these, so the word and the behaviour cannot disagree.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { chapterOffersPlayerMove, chapterWaitWord, stepOffersPlayerMove } from '../playerStepHold';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { resolveTooltip } from '../tooltipResolver';
import { CHAPTER_ALONE_AFTERMATH_LINE } from '../../data/ui-content';
import type { GameState } from '../../types/gameState';
import { buildLedgerRows } from '../threadedChapters';
import { buildLedgerRail } from '../views/ledgerRail';

const HEAL_THE_SICK = 'ts.quest.heal_the_sick';
const GALLOWS_PARDON = 'encounter.town.gallows_pardon';
const ORACLE_CONSULTED = 'reputation.eye.the_oracle_consulted';
/** A Ledger-eligible (`isEncounterAction`) chapter shaped like Heal the Sick: no step offers a move. */
const HEALERS_OATH = 'encounter.healers_oath';

function makeGraph(attentionMode: 'pause' | 'auto_resolve' | null, courtPosition = 'the_first'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Thessa', properties: {} });
  if (attentionMode) {
    g.addEdge({
      id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
      properties: {
        courtPosition,
        tier: 1,
        attentionMode,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: true,
        readBackstoryTier: 0,
      } as unknown as Record<string, unknown>,
    });
  }
  return g;
}

function template(id: string): UnifiedActionTemplate {
  const t = getUnifiedTemplateById(id);
  if (!t) throw new Error(`template ${id} is not registered`);
  return t;
}

describe('chapterOffersPlayerMove (THR-2178)', () => {
  it('Heal the Sick offers no move at any step: false', () => {
    expect(chapterOffersPlayerMove(template(HEAL_THE_SICK))).toBe(false);
  });

  it('The Gallows Pardon offers moves: true', () => {
    expect(chapterOffersPlayerMove(template(GALLOWS_PARDON))).toBe(true);
  });

  it('The Oracle Consulted offers a move at step 0: true', () => {
    const t = template(ORACLE_CONSULTED);
    expect(stepOffersPlayerMove(t, 0)).toBe(true);
    expect(chapterOffersPlayerMove(t)).toBe(true);
  });

  it('a missing template is fail-soft true', () => {
    expect(chapterOffersPlayerMove(undefined)).toBe(true);
    expect(chapterOffersPlayerMove(getUnifiedTemplateById('no.such.template'))).toBe(true);
  });

  it('a template with no steps is fail-soft true', () => {
    expect(chapterOffersPlayerMove({ ...template(HEAL_THE_SICK), steps: [] })).toBe(true);
  });

  it('agrees with stepOffersPlayerMove at every step', () => {
    for (const id of [HEAL_THE_SICK, GALLOWS_PARDON, ORACLE_CONSULTED]) {
      const t = template(id);
      const anyStep = t.steps.some((_, i) => stepOffersPlayerMove(t, i));
      expect(chapterOffersPlayerMove(t)).toBe(anyStep);
    }
  });
});

describe('chapterWaitWord (THR-2178)', () => {
  it('on an "Asks you" thread: waits / theirs_alone from the predicate', () => {
    const g = makeGraph('pause');
    expect(chapterWaitWord(g, 'agent_1', template(GALLOWS_PARDON))).toBe('waits');
    expect(chapterWaitWord(g, 'agent_1', template(ORACLE_CONSULTED))).toBe('waits');
    expect(chapterWaitWord(g, 'agent_1', template(HEAL_THE_SICK))).toBe('theirs_alone');
  });

  it('a "Lives on" thread shows neither word', () => {
    const g = makeGraph('auto_resolve');
    expect(chapterWaitWord(g, 'agent_1', template(GALLOWS_PARDON))).toBeUndefined();
    expect(chapterWaitWord(g, 'agent_1', template(HEAL_THE_SICK))).toBeUndefined();
  });

  it('an unthreaded or dormant mortal shows neither word', () => {
    expect(chapterWaitWord(makeGraph(null), 'agent_1', template(HEAL_THE_SICK))).toBeUndefined();
    expect(chapterWaitWord(makeGraph('pause', 'dormant'), 'agent_1', template(HEAL_THE_SICK))).toBeUndefined();
  });

  it('a routine template or a missing one carries no word', () => {
    const g = makeGraph('pause');
    expect(chapterWaitWord(g, 'agent_1', { ...template(HEAL_THE_SICK), routine: true })).toBeUndefined();
    expect(chapterWaitWord(g, 'agent_1', undefined)).toBeUndefined();
  });
});

describe('the wait word copy (THR-2178)', () => {
  it('registers both words with their hovers', () => {
    expect(resolveTooltip('ui.chapter.waits')?.label).toBe('Waits for you');
    expect(resolveTooltip('ui.chapter.theirs_alone')?.label).toBe('Theirs alone');
    expect(resolveTooltip('ui.chapter.theirs_alone')?.desc).toContain('{name}');
  });

  it('the alone line names the mortal', () => {
    expect(CHAPTER_ALONE_AFTERMATH_LINE.replace(/{name}/g, 'Thessa'))
      .toBe("This chapter was Thessa's alone. Nothing in it waited on your hand.");
  });
});

describe('the Ledger rows carry the word (THR-2178)', () => {
  function stateWith(templateId: string, attentionMode: 'pause' | 'auto_resolve'): GameState {
    const graph = makeGraph(attentionMode);
    return {
      graph,
      ascendantId: 'asc_1',
      tick: 10,
      clock: { currentTick: 10, ticksPerSeason: 90, season: 0, year: 0 },
      chronicleEntries: [],
      chapterArchive: [],
      unifiedActions: [{
        actionId: 'ua_1', templateId, actorId: 'agent_1', targetId: 'agent_1', scale: 'personal',
        source: 'agent', startTick: 5, currentStep: 0, resolved: false, choiceHistory: [],
      }],
    } as unknown as GameState;
  }

  it('a live chapter on an "Asks you" thread reads its word on both Ledger rows', () => {
    const alone = stateWith(HEALERS_OATH, 'pause');
    expect(buildLedgerRows(alone)[0]?.waitWord).toBe('theirs_alone');
    expect(buildLedgerRail(alone, { seenChronicle: 0, seenLedger: 0, threadsWaiting: 0 }).ledger.rows[0]?.waitWord).toBe('theirs_alone');
    expect(buildLedgerRows(stateWith(GALLOWS_PARDON, 'pause'))[0]?.waitWord).toBe('waits');
  });

  it('a "Lives on" thread carries no word', () => {
    const row = buildLedgerRows(stateWith(HEALERS_OATH, 'auto_resolve'))[0];
    expect(row).toBeDefined();
    expect(row && 'waitWord' in row).toBe(false);
  });
});
