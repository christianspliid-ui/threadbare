// @vitest-environment jsdom
/**
 * THR-2155 — the next follower has a path.
 *
 * 1. The Threads panel says how to bind another, only while the god holds
 *    exactly one mortal thread, and binding a second retires it for good.
 * 2. Read the Threads' last section is "Untouched lives" and lists only the
 *    mortals the seen floor can name.
 * 3. The bonding pick says the two passed over leave.
 *
 * Rendered through the real components (jsdom-render substitution).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThreadsPanel, nextThreadCaption, countMortalThreads } from '../ThreadsPanel';
import { ReadTheThreadsPanel, untouchedLives } from '../ReadTheThreadsPanel';
import { SensingBeat } from '../../MeetTheFirst/SensingBeat';
import { resetFirstUseCaptions } from '../../shared/firstUseCaptionStore';
import {
  FIRST_USE_CAPTION_STORE_PREFIX,
  getFirstUseCaptionText,
} from '../../../data/first-use-captions';
import {
  SENSING_PASSED_OVER_LINE,
  SENSING_PASSED_OVER_LINE_ONE,
  sensingPassedOverLine,
} from '../../../data/meeting-narrative-prose';
import { READ_THREADS_UNTOUCHED_LIVES_LABEL } from '../../../data/view-content';
import type { ThreadedNode } from '../../../engine/retinue';
import type { DigestEntry } from '../../../types/attention';
import type { NarrativeCandidate } from '../../../types/meetingEncounter';

const noop = () => {};

function agent(id: string, name: string, courtPosition: string | null = null): ThreadedNode {
  return {
    id, name, tier: 2, tierName: 'Devoted', category: 'agent', threadEdgeId: `thread-${id}`,
    attentionMode: 'auto_resolve', courtPosition, threadStrength: 1, locationId: 'loc-1',
    locationName: 'Thornwall', activityLabel: 'Idling', portraitUrl: null, primaryDomain: 'iron',
    factionName: null, championEffectId: null, championTemplateId: null, isAspect: false,
  } as unknown as ThreadedNode;
}

function relic(id: string): ThreadedNode {
  return {
    id, name: 'The Ember Crown', tier: 1, tierName: 'Aware', category: 'artifact', threadEdgeId: `thread-${id}`,
    attentionMode: 'auto_resolve', courtPosition: null, threadStrength: 1,
  } as unknown as ThreadedNode;
}

function panel(nodes: ThreadedNode[]) {
  return <ThreadsPanel threadedNodes={nodes} selectedNodeId={null} onNodeSelect={noop} onCenterOnHex={noop} />;
}

beforeEach(() => {
  localStorage.clear();
  act(() => resetFirstUseCaptions());
});
afterEach(cleanup);

describe('THR-2155 — the Threads panel says how to bind another', () => {
  it('the predicate holds for exactly one mortal thread; a relic is not a mortal', () => {
    expect(nextThreadCaption([agent('f', 'Elara', 'the_first')])).toEqual({ show: true, firstName: 'Elara' });
    expect(nextThreadCaption([agent('f', 'Elara', 'the_first'), relic('r')]).show).toBe(true);
    expect(nextThreadCaption([agent('f', 'Elara', 'the_first'), agent('b', 'Bram')]).show).toBe(false);
    expect(nextThreadCaption([]).show).toBe(false);
    expect(countMortalThreads([agent('f', 'Elara'), relic('r')])).toBe(1);
  });

  it('shows with one thread, naming The First', () => {
    render(panel([agent('f', 'Elara', 'the_first')]));
    const line = screen.getByTestId('first-use-caption-threads_next');
    expect(line.textContent).toContain('To bind another, play Agent Thread on a mortal you or Elara can see.');
  });

  it('does not show with two threads, and binding the second retires it for good', () => {
    const { rerender } = render(panel([agent('f', 'Elara', 'the_first')]));
    expect(screen.queryByTestId('first-use-caption-threads_next')).not.toBeNull();
    rerender(panel([agent('f', 'Elara', 'the_first'), agent('b', 'Bram')]));
    expect(screen.queryByTestId('first-use-caption-threads_next')).toBeNull();
    expect(localStorage.getItem(FIRST_USE_CAPTION_STORE_PREFIX + 'threads_next')).toBe('1');
    // Back to one (the second thread broke): the lesson is learnt, the line stays gone.
    rerender(panel([agent('f', 'Elara', 'the_first')]));
    expect(screen.queryByTestId('first-use-caption-threads_next')).toBeNull();
  });

  it('a bare {name} with no name reads The First, never a raw token', () => {
    expect(getFirstUseCaptionText('threads_next')).toBe(
      'To bind another, play Agent Thread on a mortal you or The First can see.',
    );
    // The possessive fallback is unchanged.
    expect(getFirstUseCaptionText('asks_you')).toMatch(/^Their chapters/);
  });
});

function entry(over: Partial<DigestEntry>): DigestEntry {
  return {
    agentId: 'x', agentName: 'X', encounterId: 'ua_1', encounterName: 'The Tribute Exchange',
    encounterType: 'explore', reachPrimary: 'gold', tick: 95, success: true, significantOutcomes: [],
    capabilityChanges: {}, attachmentsGained: [], attachmentsLost: [], quintessenceDelta: 0,
    isNotable: false, wasCuratedOut: false, isDormantAgent: true, sourceType: 'agent',
    ...over,
  };
}

function readThreads(buffer: DigestEntry[], canNameAgent?: (id: string) => boolean): string {
  render(
    <ReadTheThreadsPanel
      open onClose={noop} digestBuffer={buffer} currentTick={100} essenceAvailable={999}
      onSpendEssence={noop} canNameAgent={canNameAgent}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Read the Threads' }));
  return document.body.textContent ?? '';
}

describe('THR-2155 — Untouched lives lists only mortals you have seen', () => {
  const buffer = [
    entry({ agentId: 'seen', agentName: 'Ana' }),
    entry({ agentId: 'stranger', agentName: 'Corvin' }),
  ];
  const seenOnly = (id: string) => id === 'seen';

  it('the filter drops a mortal the seen floor cannot name', () => {
    expect(untouchedLives(buffer, seenOnly).map(e => e.agentId)).toEqual(['seen']);
    // No predicate keeps every entry (fail-soft, as before).
    expect(untouchedLives(buffer).map(e => e.agentId)).toEqual(['seen', 'stranger']);
  });

  it('the section reads "Untouched lives", never "Dormant court"', () => {
    const text = readThreads(buffer, seenOnly);
    expect(READ_THREADS_UNTOUCHED_LIVES_LABEL).toBe('Untouched lives');
    expect(text).toContain('Untouched lives');
    expect(text).not.toContain('Dormant court');
    expect(text).toContain('Ana — faint signs of movement');
    expect(text).not.toContain('Corvin');
  });

  it('an emptied list does not render its section', () => {
    const text = readThreads(buffer, () => false);
    expect(text).not.toContain('Untouched lives');
    expect(text).toContain('The threads are quiet.');
  });
});

const PICKS = [
  { tempId: 't0', name: 'Elara', epithet: 'merchant\'s daughter', vignetteText: 'She counts coins twice.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
  { tempId: 't1', name: 'Bram', epithet: 'ferryman', vignetteText: 'He waits.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
  { tempId: 't2', name: 'Ysolde', epithet: '', vignetteText: 'She listens.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
] as unknown as NarrativeCandidate[];

describe('THR-2155 — the bonding pick says the others leave', () => {
  it('three candidates: the two passed over go their own way', () => {
    render(<SensingBeat candidates={PICKS} openingProse="You sense them." onSelect={noop} />);
    expect(screen.getByTestId('sensing-passed-over').textContent).toBe(
      'The two you pass over go their own way. You will not meet them again.',
    );
  });

  it('the line fits the count, and is absent with no one to pass over', () => {
    expect(sensingPassedOverLine(3)).toBe(SENSING_PASSED_OVER_LINE);
    expect(sensingPassedOverLine(2)).toBe(SENSING_PASSED_OVER_LINE_ONE);
    expect(sensingPassedOverLine(1)).toBeNull();
    render(<SensingBeat candidates={PICKS.slice(0, 1)} openingProse="You sense them." onSelect={noop} />);
    expect(screen.queryByTestId('sensing-passed-over')).toBeNull();
  });
});
