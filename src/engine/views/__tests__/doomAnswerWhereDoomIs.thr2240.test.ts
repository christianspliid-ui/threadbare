/**
 * THR-2240 — the answer to Doom is where Doom is.
 *
 * The view half: `doomStayNotice` in all three states (with and without the panel's
 * not-held case), the first-stage gift naming the card, and the warm recap's Doom line.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';
import type { ControlEffect } from '../../../types/controlEffect';
import { doomStayNotice } from '../doomStayNotice';
import {
  DOOM_STAY_ACTIVE_LINE,
  DOOM_STAY_NOT_HELD_LINE,
  DOOM_STAY_TEMPLATE_ID,
} from '../../../data/doom-stay-content';
import { MILESTONE_BEAT_PRESENTATION } from '../../../data/ascendant-milestone-beats';
import { MILESTONE_FIRST_STAGE_BEAT_ID } from '../../../data/player-progression';
import { buildWarmRecap, snapshotWarmRecap, warmRecapLineText } from '../warmRecap';

const ASC = 'asc';

const DEFINITION: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 1000,
  stages: [
    { stage: 1, name: 'Reality Cracks', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'The Thinning', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};

function clock(currentStage: number): DoomClockState {
  return {
    definitionArchetype: 'breach',
    currentTick: 100,
    totalTicks: 1000,
    currentStage,
    progress: 0.1,
    stageTransitions: [0, 200, 400, 600, 800],
    expired: false,
    tickModifier: 1,
    nextEscalationSeverityModifier: 0,
    counterOmens: 0,
    resolvedEvents: [],
  };
}

function world(over: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  return {
    graph,
    ascendantId: ASC,
    tick: 300,
    seed: 42,
    recentEvents: [],
    unifiedActions: [],
    chapterArchive: [],
    controlEffects: [],
    unlockedActionIds: [],
    doomDefinition: DEFINITION,
    doomClock: clock(1),
    ...over,
  } as unknown as GameState;
}

const activeStay = { id: 'ce.stay', active: true, templateId: DOOM_STAY_TEMPLATE_ID, ownerId: ASC, targetNodeId: ASC } as unknown as ControlEffect;

describe('THR-2240 — doomStayNotice, three states', () => {
  it('not held: the stage notice stays silent, the panel and hover say an answer is coming', () => {
    const s = world();
    expect(doomStayNotice(s)).toEqual({});
    expect(doomStayNotice(s, { includeNotHeld: true })).toEqual({ line: DOOM_STAY_NOT_HELD_LINE });
    expect(DOOM_STAY_NOT_HELD_LINE).toBe('Nothing you hold slows it yet. After its first step, you will be given a way to hold it back.');
  });

  it('held, not active: the hint line and the "Stay it" button, on every surface', () => {
    const s = world({ unlockedActionIds: [DOOM_STAY_TEMPLATE_ID] });
    for (const n of [doomStayNotice(s), doomStayNotice(s, { includeNotHeld: true })]) {
      expect(n.button).toBe('Stay it');
      expect(n.line).toMatch(/^Stay the Unmaking slows it\. Holding it draws on your \w+ essence every day\.$/);
    }
  });

  it('active: "You are holding it back." and no button', () => {
    const s = world({ unlockedActionIds: [DOOM_STAY_TEMPLATE_ID], controlEffects: [activeStay] });
    expect(doomStayNotice(s, { includeNotHeld: true })).toEqual({ line: DOOM_STAY_ACTIVE_LINE });
  });

  it('a cast still in flight counts as active', () => {
    const s = world({
      unlockedActionIds: [DOOM_STAY_TEMPLATE_ID],
      unifiedActions: [{ actorId: ASC, targetId: ASC, templateId: DOOM_STAY_TEMPLATE_ID, resolved: false }] as unknown as GameState['unifiedActions'],
    });
    expect(doomStayNotice(s, { includeNotHeld: true })).toEqual({ line: DOOM_STAY_ACTIVE_LINE });
  });
});

describe('THR-2240 — the first-stage gift names the card and where it lives', () => {
  it('ends on the card name, the Doom panel and the god\'s own page', () => {
    const p = MILESTONE_BEAT_PRESENTATION[MILESTONE_FIRST_STAGE_BEAT_ID];
    expect(p?.prose.endsWith('It is yours now as Stay the Unmaking. You will find it on the Doom panel, and on your own page.')).toBe(true);
    expect(p?.cta).toBe('Receive');
  });
});

describe('THR-2240 — the warm recap says Doom moved', () => {
  const recap = (s: GameState, before: ReturnType<typeof snapshotWarmRecap>) =>
    buildWarmRecap(s, before, { readBands: () => ({}) }).lines.map(warmRecapLineText);

  it('names the stage Doom reached during the warm-up', () => {
    const before = snapshotWarmRecap(world({ doomClock: clock(0) }), null, { readBands: () => ({}) });
    expect(before.doomStage).toBe(0);
    const after = world({ doomClock: clock(1) });
    expect(recap(after, before)).toEqual(['Doom took a step while you were away: Reality Cracks.']);
  });

  it('adds that Stay slows it when the card is already held', () => {
    const before = snapshotWarmRecap(world({ doomClock: clock(1) }), null, { readBands: () => ({}) });
    const after = world({ doomClock: clock(2), unlockedActionIds: [DOOM_STAY_TEMPLATE_ID] });
    expect(recap(after, before)).toEqual(['Doom took a step while you were away: The Thinning. Stay the Unmaking slows it.']);
  });

  it('says nothing about Doom when no stage passed', () => {
    const before = snapshotWarmRecap(world({ doomClock: clock(1) }), null, { readBands: () => ({}) });
    const lines = buildWarmRecap(world({ doomClock: clock(1) }), before, { readBands: () => ({}) }).lines;
    expect(lines.map(l => l.kind)).toEqual(['empty']);
  });

  it('an older snapshot without a Doom stage gives no Doom line', () => {
    const after = world({ doomClock: clock(3) });
    const lines = buildWarmRecap(after, { startTick: 0, firstId: null, bands: {} }, { readBands: () => ({}) }).lines;
    expect(lines.map(l => l.kind)).toEqual(['empty']);
  });

  it('a stage with no name reads a fallback, never a raw token (Law 43)', () => {
    const before = snapshotWarmRecap(world({ doomClock: clock(0) }), null, { readBands: () => ({}) });
    const nameless = { ...DEFINITION, stages: DEFINITION.stages.map(st => ({ ...st, name: '' })) };
    const after = world({ doomClock: clock(1), doomDefinition: nameless });
    expect(recap(after, before)).toEqual(['Doom took a step while you were away: its next stage.']);
  });
});
