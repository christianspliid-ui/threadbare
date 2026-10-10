// @vitest-environment jsdom
/**
 * THR-1802 — God's Will options never named what they asked for.
 *
 * A cold tester picked "Assist right here" and the toast said The First was
 * compelled toward "Rest and Recover". The option was assembled from generic
 * fragments (distance + encounter-type desire + threat phrase); the encounter's
 * own name reached only the toast. Every offer also sat on the trivial tier, so
 * every option read "hardly a challenge".
 *
 * Locks: (1) each option shows its encounter's display name, and the result
 * toast names that same encounter; (2) the built event carries the template's
 * real name; (3) the threat clause drops when every offer shares one tier and
 * stays when tiers differ.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PremonitionModal } from '../PremonitionModal';
import { WorldGraph } from '../../../engine/graph';
import { applyCompulsionChoice } from '../../../engine/premonitionActions';
import { buildCompulsionEvent } from '../../../engine/premonitionCompulsion';
import type { ScoredCandidate } from '../../../engine/encounterScoring';
import { getAnyEncounterById } from '../../../data/encounter-content';
import { SPHERE_NAMES } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import type { CompulsionCandidate, PremonitionEvent } from '../../../types/premonition';

const AGENT_ID = 'agent-thessa';
const AGENT_NAME = 'Thessa';

function funded(n: number): EssencePool {
  return Object.fromEntries(SPHERE_NAMES.map(s => [s, n])) as EssencePool;
}

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: AGENT_ID, type: 'actor', name: AGENT_NAME, properties: { actorType: 'individual', quintessence: 1 } });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Fenmarch Crossing', properties: {} });
  return { graph, essencePool: funded(10), tick: 40 } as unknown as GameState;
}

/** Only the fields `buildCompulsionEvent` reads; the rest of the scorer's output is irrelevant here. */
function scored(templateId: string, threatRating: string, finalScore: number): ScoredCandidate {
  const template = getAnyEncounterById(templateId);
  return {
    entry: {
      templateId,
      locationId: 'loc-1',
      reachPrimary: template?.reachPrimary ?? 'heart',
      encounterType: template?.encounterType ?? 'assist',
      threatRating,
      requiresPresence: true,
    },
    finalScore,
  } as unknown as ScoredCandidate;
}

function seqRng() {
  let s = 7;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const CONFIDENCE_PHRASES = [
  'an easy prospect', 'hardly a challenge', "child's play",
  'like their chances', 'a fair bet', 'within their grasp',
  "won't be simple", 'a real test', 'either way',
  'a daunting prospect', 'not sure', 'take everything',
  'the end of', 'only a fool', 'despite the danger',
];

describe('God\'s Will options name their encounter (THR-1802)', () => {
  it('the built event carries each template\'s display name, not a fragment', () => {
    const event = buildCompulsionEvent(makeState(), AGENT_ID, AGENT_NAME, [
      scored('encounter.rest_and_recover', 'trivial', 0.9),
      scored('encounter.deep_descent', 'hard', 0.5),
    ], seqRng());
    expect(event?.compulsionCandidates?.map(c => c.encounterName)).toEqual([
      'Rest and Recover',
      getAnyEncounterById('encounter.deep_descent')?.name,
    ]);
  });

  it('every option shows its encounter name, and the chosen one\'s toast names the same encounter', () => {
    const event = buildCompulsionEvent(makeState(), AGENT_ID, AGENT_NAME, [
      scored('encounter.rest_and_recover', 'trivial', 0.9),
      scored('encounter.deep_descent', 'hard', 0.5),
    ], seqRng())!;
    const onCompulsionChoice = vi.fn();
    render(
      <PremonitionModal
        open
        premonition={event as PremonitionEvent}
        essencePool={funded(10)}
        onWhisperChoice={vi.fn()}
        onCompulsionChoice={onCompulsionChoice}
        onDismiss={vi.fn()}
      />,
    );
    const names = screen.getAllByTestId('compulsion-option-name');
    const candidates = event.compulsionCandidates!;
    expect(names.map(n => n.textContent)).toEqual(candidates.map(c => c.encounterName));

    // Click the first option through its own name, then run the engine's result path.
    fireEvent.click(names[0]);
    expect(onCompulsionChoice).toHaveBeenCalledTimes(1);
    const chosen = onCompulsionChoice.mock.calls[0][0] as CompulsionCandidate;
    const result = applyCompulsionChoice(makeState(), AGENT_ID, AGENT_NAME, chosen);
    expect(result.message).toContain(names[0].textContent!);
  });

  it('drops the threat clause when every offer shares one tier', () => {
    const event = buildCompulsionEvent(makeState(), AGENT_ID, AGENT_NAME, [
      scored('encounter.rest_and_recover', 'trivial', 0.9),
      scored('encounter.deep_descent', 'trivial', 0.5),
    ], seqRng())!;
    for (const c of event.compulsionCandidates!) {
      for (const phrase of CONFIDENCE_PHRASES) expect(c.encounterHook).not.toContain(phrase);
      expect(c.encounterHook).not.toMatch(/—\s*$/);
    }
  });

  it('FALSIFICATION — keeps the threat clause when tiers differ', () => {
    const event = buildCompulsionEvent(makeState(), AGENT_ID, AGENT_NAME, [
      scored('encounter.rest_and_recover', 'trivial', 0.9),
      scored('encounter.deep_descent', 'hard', 0.5),
    ], seqRng())!;
    const hooks = event.compulsionCandidates!.map(c => c.encounterHook);
    expect(hooks.every(h => CONFIDENCE_PHRASES.some(p => h.includes(p)))).toBe(true);
  });
});
