/**
 * THR-1606 (plan B1) — after a cast the player sees who it touched and what changed.
 *
 * Runs the real `divine.dream` ops through the real executor between two target
 * snapshots, then reads the result the way production does: the change lines,
 * the digest entry filed on the target, the target's Story So Far, the receipt
 * and its toast link, and the spine gift placement line.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import {
  snapshotCastTarget,
  snapshotTargetChanges,
  targetSideChanges,
  castDigestEntry,
  influenceChipHover,
  influenceChipNoun,
  describeLastCastConsequence,
} from '../castTargetChanges';
import { composeThreadStory } from '../threadDigest';
import { processPlayerReceipts } from '../playerReceipts';
import { deriveNavigationTarget } from '../notificationRouter';
import { seedBeatGraph } from '../ascendantBeatSeeding';
import { resolvePendingBeat, forceOfferBeatById, createInitialAscendantBeatState } from '../ascendantBeat';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { VALUE_PAIRS } from '../../types/agent';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { AxiologicalProfile } from '../../types/agent';
import type { GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, EncounterAftermathChange } from '../../types/unifiedAction';
import type { BeatDefinition } from '../../types/ascendantBeat';
import type { PhaseContext } from '../phaseRegistry';

const GOD = 'asc-1';
const MORTAL = 'mortal-1';

function profile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base = Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
  return { ...base, ...overrides };
}

function templateOps(templateId: string): GraphOp[] {
  const t = getUnifiedTemplateById(templateId)!;
  return t.steps.flatMap((s) => (isActionStepBranch(s) ? [] : s.onSuccess ?? [])) as GraphOp[];
}

describe('THR-1606 — what your hand did', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetOpCounter();
    clearTraces();
    enableTracing();
    graph = new WorldGraph();
    // Iron-primary god → the bound pair is mercy_ruthlessness.
    graph.addNode({
      id: GOD, type: 'actor', name: 'The God',
      properties: { domainAffinities: { iron: 0.9, heart: 0.4 }, sphereAlignment: { primary: 'force', secondary: 'matter' } },
    });
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Haven', properties: { locationType: 'city', locationSubtype: 'city' } });
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  function addMortal(lean: number) {
    graph.addNode({
      id: MORTAL, type: 'actor', name: 'Aldric',
      properties: { axiologicalProfile: profile({ mercy_ruthlessness: lean }) },
    });
  }

  /** Snapshot → real dream ops → snapshot → diff, as the step resolver does. */
  function dreamAndDiff(tick = 10): EncounterAftermathChange[] {
    const before = snapshotCastTarget(graph, MORTAL);
    executeGraphOps(graph, templateOps('divine.dream'), { actorId: GOD, targetId: MORTAL, locationId: 'loc-1', tick });
    return snapshotTargetChanges(before, snapshotCastTarget(graph, MORTAL), {
      graph, idStem: `act-1:step:0`, targetName: 'Aldric',
    });
  }

  describe('snapshotTargetChanges', () => {
    it('a landed dream is one change on the target, naming them, the chip noun and the pole', () => {
      addMortal(0.3);
      const changes = dreamAndDiff();
      expect(changes).toHaveLength(1);
      const [c] = changes;
      expect(c.subjectId).toBe(MORTAL);
      expect(c.stateNoun?.text).toBe('Dreaming');
      expect(c.detail).toContain('Aldric');
      expect(c.detail).toContain('mercy');
      // The state noun is a substring of the sentence it anchors.
      expect(c.detail).toContain(c.stateNoun!.text);
      expect(c.detail).not.toMatch(/\d/);
    });

    it('Law 56: a cast that wrote nothing produces nothing (dream on a zero lean)', () => {
      addMortal(0);
      expect(dreamAndDiff()).toEqual([]);
    });

    it('Law 56: no cast, no change', () => {
      addMortal(0.3);
      const before = snapshotCastTarget(graph, MORTAL);
      expect(snapshotTargetChanges(before, snapshotCastTarget(graph, MORTAL), {
        graph, idStem: 'x', targetName: 'Aldric',
      })).toEqual([]);
    });

    it('reports a trait placed on and lifted from the target', () => {
      addMortal(0.3);
      graph.addNode({ id: 'trait.old', type: 'trait', name: 'Grieving', properties: {} });
      graph.addNode({ id: 'trait.new', type: 'trait', name: 'Blessed', properties: {} });
      graph.addEdge({ id: 'e.old', source: MORTAL, target: 'trait.old', type: 'has_trait', properties: {} });
      const before = snapshotCastTarget(graph, MORTAL);
      graph.removeEdge('e.old');
      graph.addEdge({ id: 'e.new', source: MORTAL, target: 'trait.new', type: 'has_trait', properties: {} });
      const changes = snapshotTargetChanges(before, snapshotCastTarget(graph, MORTAL), {
        graph, idStem: 'x', targetName: 'Aldric',
      });
      expect(changes.map((c) => [c.polarity, c.stateNoun?.text])).toEqual([
        ['gain', 'Blessed'],
        ['loss', 'Grieving'],
      ]);
    });

    it('an unknown target snapshots as empty (fail-soft)', () => {
      const snap = snapshotCastTarget(graph, 'nobody');
      expect(snap.influenceIds.size).toBe(0);
      expect(snap.traits.size).toBe(0);
    });
  });

  describe('chip words', () => {
    it('the dream and the compulsion wear sheet nouns', () => {
      expect(influenceChipNoun('dream')).toBe('Dreaming');
      expect(influenceChipNoun('persuade')).toBe('Compelled');
      expect(influenceChipNoun('omen')).toBeUndefined();
    });

    it('the hover says what the influence does and when it fades, in words', () => {
      expect(influenceChipHover({ valueDrifts: { mercy_ruthlessness: -0.08 } }, 'a few days'))
        .toBe('Your hand is on them: ruthlessness weighs more in their choices, fading in a few days.');
      expect(influenceChipHover({}, 'a few days')).toBeUndefined();
    });
  });

  describe('the target\'s story remembers', () => {
    it('files a notable digest entry on the target that the Story So Far tells alone', () => {
      addMortal(0.3);
      const changes = dreamAndDiff(10);
      const entry = castDigestEntry({
        graph, targetId: MORTAL, templateId: 'divine.dream', templateName: 'Oneiric Sending',
        reach: 'mind' as never, tick: 10, success: true, changes,
      });
      expect(entry.agentId).toBe(MORTAL);
      expect(entry.isNotable).toBe(true);
      expect(entry.castLine).toMatch(/sleep/);
      expect(entry.castLine).toContain('mercy');

      // A single cast beat is enough — without it the story would read as empty.
      const story = composeThreadStory(graph, MORTAL, [entry], 12);
      expect(story.isEmpty).toBe(false);
      expect(story.beatLines.join(' ')).toContain('Your hand reached into their sleep');
    });
  });

  describe('the receipt', () => {
    function resolvedDreamAction(changes: EncounterAftermathChange[]): UnifiedAction {
      return {
        actionId: 'act-1',
        templateId: 'divine.dream',
        actorId: GOD,
        targetId: MORTAL,
        source: 'player',
        resolved: true,
        outcome: 'success',
        startTick: 10,
        completedAtTick: 11,
        currentStep: 0,
        aftermathChanges: changes,
      } as unknown as UnifiedAction;
    }

    function runReceipts(action: UnifiedAction) {
      const state = {
        tick: 11, graph, unifiedActions: [action], playerActionReceipts: [], tickEvents: [],
        digestBuffer: [],
      } as unknown as GameState;
      return processPlayerReceipts(state, {} as PhaseContext);
    }

    it('leads with the target, stays a toast with a chip, and links the toast to them', () => {
      addMortal(0.3);
      const changes = dreamAndDiff(10);
      const result = runReceipts(resolvedDreamAction(changes));
      const [receipt] = result.playerActionReceipts!;
      expect(receipt.presentation).toBe('toast');
      expect(receipt.toastMessage).toContain('Aldric');
      expect(targetSideChanges(receipt.changes)).toHaveLength(1);

      const event = result.tickEvents!.find((e) => e.type === 'player_action_receipt')!;
      expect(deriveNavigationTarget(event)).toEqual({ kind: 'agent', agentId: MORTAL });
      expect(getTraces().some((t) => t.category === 'receipt.target_changes')).toBe(true);
    });

    it('a cast with no target change keeps the receipt link and names no chip', () => {
      addMortal(0);
      const result = runReceipts(resolvedDreamAction(dreamAndDiff(10)));
      const event = result.tickEvents!.find((e) => e.type === 'player_action_receipt')!;
      expect(deriveNavigationTarget(event)).toEqual({ kind: 'receipt', receiptId: event.id });
      expect(getTraces().some((t) => t.category === 'receipt.target_changes')).toBe(false);
    });

    it('getLastCastConsequence reads the receipt and the target digest', () => {
      addMortal(0.3);
      const changes = dreamAndDiff(10);
      const result = runReceipts(resolvedDreamAction(changes));
      const digest = [castDigestEntry({
        graph, targetId: MORTAL, templateId: 'divine.dream', templateName: 'Oneiric Sending',
        reach: 'mind' as never, tick: 11, success: true, changes,
      })];
      const reading = describeLastCastConsequence({
        playerActionReceipts: result.playerActionReceipts, digestBuffer: digest,
      })!;
      expect(reading.targetId).toBe(MORTAL);
      expect(reading.changes).toEqual([{ kind: 'trait', subject: MORTAL, word: 'Dreaming' }]);
      expect(reading.digestFiledOnTarget).toBe(true);
      expect(describeLastCastConsequence({ playerActionReceipts: [] })).toBeNull();
    });
  });

  describe('spine gifts announce themselves', () => {
    function withFirst() {
      graph.addNode({ id: 'first-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'thread.first', source: GOD, target: 'first-1', type: 'thread', properties: { courtPosition: 'the_first', tier: 2 } });
      graph.addEdge({ id: 'first.at', source: 'first-1', target: 'loc-1', type: 'located_at', properties: {} });
    }
    const stateWith = () => ({ tick: 4, seed: 42, ascendantId: GOD, graph }) as unknown as GameState;

    it('the seat names the settlement it was raised in', () => {
      withFirst();
      const seat: BeatDefinition = { beatId: 'beat.spine.the_seat', kind: 'spine', trigger: { kind: 'turn' }, seedsGraph: { kind: 'home_seat' } };
      expect(seedBeatGraph(stateWith(), seat, 4).placement).toMatchObject({
        anchorId: 'loc-1', anchorKind: 'location', line: 'A seat is raised for you in Haven.',
      });
    });

    it('the artifact names its bearer; with no bearer there is nothing to announce', () => {
      withFirst();
      const artifact: BeatDefinition = { beatId: 'beat.spine.thing_left_behind', kind: 'spine', trigger: { kind: 'turn' }, seedsGraph: { kind: 'threaded_artifact' } };
      expect(seedBeatGraph(stateWith(), artifact, 4).placement).toMatchObject({
        anchorId: 'first-1', anchorKind: 'agent', line: 'Kael now carries A Thing Left Behind.',
      });
      graph.removeEdge('thread.first');
      expect(seedBeatGraph(stateWith(), artifact, 5).placement).toBeUndefined();
    });

    it('resolving The Seat puts a chronicle-tier toast line in the events, linked to the place', () => {
      withFirst();
      const offered = forceOfferBeatById(createInitialAscendantBeatState(), 'beat.spine.the_seat', 4)!.next;
      const state = {
        tick: 4, seed: 42, ascendantId: GOD, graph, unlockedActionIds: [], tickEvents: [], recentEvents: [],
        ascendantBeats: offered,
      } as unknown as GameState;
      const result = resolvePendingBeat(state);
      expect(result.resolved).toBe(true);
      const line = result.state.recentEvents.find((e) => e.message === 'A seat is raised for you in Haven.');
      expect(line).toBeDefined();
      expect(line!.notification?.channel).toBe('toast');
      expect(result.state.tickEvents).toContain(line);
      expect(deriveNavigationTarget(line!)).toEqual({ kind: 'location', locationNodeId: 'loc-1' });
      expect(getTraces().some((t) => t.category === 'beat.gift_placed')).toBe(true);
    });
  });
});
