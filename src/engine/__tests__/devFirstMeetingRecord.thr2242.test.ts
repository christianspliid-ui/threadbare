/**
 * THR-2242 — the pre-bonded (dev-seeded) First carries a meeting record a real
 * meeting could have written, so the founding gates read something and the
 * Ordeal can change how the Return ends. Before this fix the record was null,
 * only the gateless `vanishing` passed, and every seeded/warm Return vanished.
 */
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { ThreadEdgeProperties } from '../../types/influence';
import type { MeetingChoiceRecord } from '../../types/meetingEncounter';
import {
  initializeGameStateFromIdentity,
  devSeedTheFirst,
  DEV_ASCENDANT_IDENTITY,
  DEV_FIRST_MEETING_CHOICES,
} from '../gameInit';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { getFirstId } from '../meetingEncounter';
import {
  archetypeKeyOf,
  buildRelationshipState,
  evaluateAllFoundingGates,
  resolveReturn,
} from '../returnEngine';
import { firstPathFromRecord } from '../firstPath';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';

function seededRecord(): { state: GameState; props: ThreadEdgeProperties; record: MeetingChoiceRecord } {
  resetEventCounter();
  resetDecisionCache();
  const state = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
  devSeedTheFirst(state);
  const id = getFirstId(state.graph, state.ascendantId)!;
  const edge = state.graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === id)!;
  const props = edge.properties as unknown as ThreadEdgeProperties;
  return { state, props, record: props.meetingChoiceRecord as MeetingChoiceRecord };
}

describe('THR-2242 — the dev First has a meeting record', () => {
  it('writes a record whose choices are real library choices', () => {
    const { record } = seededRecord();
    expect(record).toBeTruthy();
    expect(record.dilemmaChoices).toHaveLength(DEV_FIRST_MEETING_CHOICES.length);
    for (const c of record.dilemmaChoices) {
      const template = ENRICHED_DILEMMA_LIBRARY.find(t => t.id === c.dilemmaId);
      const choice = template?.choices.find(ch => ch.id === c.choiceId);
      expect(choice, `${c.dilemmaId}/${c.choiceId}`).toBeDefined();
      expect(c.gateTags).toEqual(choice!.gateTags);
    }
    expect(record.foundingGateTags).toEqual(record.dilemmaChoices.flatMap(c => c.gateTags));
    expect(record.primaryReach).toBe('heart');
    expect(record.secondaryReach).toBe('shadow');
    expect(archetypeKeyOf(record)).toBe('heart_shadow');
  });

  it('gives the seeded First no vision path (that stays a separate change)', () => {
    const { record } = seededRecord();
    expect(firstPathFromRecord(record)).toBeNull();
  });

  it('founding gates pass at least one outcome besides vanishing', () => {
    const { record } = seededRecord();
    const gates = evaluateAllFoundingGates(record, archetypeKeyOf(record));
    const passing = Object.entries(gates).filter(([, ok]) => ok).map(([o]) => o);
    expect(passing).toContain('vanishing');
    expect(passing.filter(o => o !== 'vanishing').length).toBeGreaterThan(0);
  });

  it('the Ordeal changes the Return: broken and triumph resolve differently', () => {
    const { props, record } = seededRecord();
    const relationship = buildRelationshipState(props);
    const key = archetypeKeyOf(record);
    const broken = resolveReturn(record, 'broken', relationship, key, []);
    const triumph = resolveReturn(record, 'triumph', relationship, key, []);
    expect(broken.outcome).not.toBe(triumph.outcome);
    expect(triumph.outcome).not.toBe('vanishing');
  });
});
