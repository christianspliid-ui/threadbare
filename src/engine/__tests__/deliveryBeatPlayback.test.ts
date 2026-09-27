/**
 * THR-1650 — "A Vision — Witness" plays its scene.
 *
 * A delivery beat wraps a mortal branching encounter. Before this slice, resolving it ran
 * every fallback reaction of that template against the *god* (the THR-1526 untrue-scene
 * class) and opened nothing. Now: the Director only offers a delivery beat whose source
 * can bind The First, Witness mints the encounter on The First, and `resolvePendingBeat`
 * never runs a delivery template's aftermath.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createInitialAscendantBeatState,
  forceOfferBeatById,
  phaseAscendantBeatDirector,
  resolvePendingBeat,
} from '../ascendantBeat';
import * as encounterAftermath from '../encounterAftermath';
import {
  ALL_DELIVERY_BEATS,
  bindDeliverySubject,
  findDeliverySubject,
  prepareDeliveryEncounter,
} from '../deliveryBeatAdapter';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { ASCENDANT_SPINE } from '../../data/ascendant-beat-content';
import { createSimulationRuntime } from '../simulationRuntime';
import { mulberry32 } from '../../lib/prng';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

const ASCENDANT = 'asc-1';
const FIRST = 'actor-first';
const TOWN = 'loc-town';

/** A delivery beat whose source declares at least one location subtype. */
const PLACED_BEAT = ALL_DELIVERY_BEATS.find(b => {
  const t = getUnifiedTemplateById(b.templateId!);
  return (t?.locationSubtypes?.length ?? 0) > 0;
})!;
const PLACED_TEMPLATE = getUnifiedTemplateById(PLACED_BEAT.templateId!)!;
const MATCHING_SUBTYPE = PLACED_TEMPLATE.locationSubtypes![0] as string;

function worldState(opts: {
  first?: boolean;
  located?: boolean;
  subtype?: string;
  beats?: AscendantBeatState;
  tick?: number;
} = {}): GameState {
  const { first = true, located = true, subtype = MATCHING_SUBTYPE, tick = 40 } = opts;
  const graph = new WorldGraph();
  graph.addNode({ id: ASCENDANT, type: 'ascendant', name: 'The Witness', properties: {} });
  graph.addNode({ id: FIRST, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
  graph.addNode({
    id: TOWN, type: 'location', name: 'Wraithwood',
    properties: { locationSubtype: subtype, hexCol: 3, hexRow: 4 },
  });
  if (first) {
    graph.addEdge({
      id: 'edge_thread_first', source: ASCENDANT, target: FIRST, type: 'thread',
      properties: { courtPosition: 'the_first', attentionMode: 'pause', tier: 1 },
    });
  }
  if (located) {
    graph.addEdge({ id: 'edge_loc_first', source: FIRST, target: TOWN, type: 'located_at', properties: {} });
  }
  return {
    tick,
    seed: 42,
    ascendantId: ASCENDANT,
    graph,
    tiles: [],
    unifiedActions: [],
    encounterProgress: [],
    encounterNotifications: [],
    clearanceGateStates: new Map(),
    unlockedActionIds: [],
    recentEvents: [],
    tickEvents: [],
    ascendantBeats: opts.beats ?? createInitialAscendantBeatState(),
  } as unknown as GameState;
}

describe('bindDeliverySubject — can the vision fall on The First? (THR-1650)', () => {
  it('binds The First standing at a place of the encounter\'s kind', () => {
    const binding = bindDeliverySubject(worldState(), PLACED_BEAT.templateId!);
    expect(binding).toMatchObject({ ok: true, subjectId: FIRST, anchorLocationId: TOWN });
    expect(findDeliverySubject(worldState())).toBe(FIRST);
  });

  it('refuses with no First bonded', () => {
    const binding = bindDeliverySubject(worldState({ first: false }), PLACED_BEAT.templateId!);
    expect(binding).toEqual({ ok: false, reason: 'no_first', subjectId: null });
  });

  it('refuses when The First stands nowhere', () => {
    const binding = bindDeliverySubject(worldState({ located: false }), PLACED_BEAT.templateId!);
    expect(binding).toMatchObject({ ok: false, reason: 'no_anchor' });
  });

  it('refuses when The First is at the wrong kind of place', () => {
    const binding = bindDeliverySubject(worldState({ subtype: 'no_such_subtype' }), PLACED_BEAT.templateId!);
    expect(binding).toMatchObject({ ok: false, reason: 'ineligible', subjectId: FIRST });
  });

  it('refuses a missing source template', () => {
    expect(bindDeliverySubject(worldState(), 'encounter.nope.gone')).toMatchObject({
      ok: false, reason: 'template_missing',
    });
  });
});

describe('prepareDeliveryEncounter — the veil opens on The First (THR-1650)', () => {
  it('mints a unified action whose actor is The First and whose target is where they stand', () => {
    const prepared = prepareDeliveryEncounter(worldState(), PLACED_BEAT.templateId!, FIRST);
    expect(prepared.success).toBe(true);
    expect(prepared.agent).toEqual({ id: FIRST, name: 'Kael Thornweaver' });
    expect(prepared.template?.id).toBe(PLACED_TEMPLATE.id);
    expect(prepared.unifiedAction).toMatchObject({
      actorId: FIRST, templateId: PLACED_TEMPLATE.id, targetId: TOWN, resolved: false,
    });
    expect(prepared.notification).toMatchObject({
      agentId: FIRST,
      actionId: prepared.unifiedAction!.actionId,
      sourceSystem: 'unified_action',
    });
  });

  it('never casts the god — refuses a subject that is not The First', () => {
    const prepared = prepareDeliveryEncounter(worldState(), PLACED_BEAT.templateId!, ASCENDANT);
    expect(prepared.success).toBe(false);
    expect(prepared.unifiedAction).toBeUndefined();
  });

  it('refuses rather than improvises when the source cannot bind', () => {
    const prepared = prepareDeliveryEncounter(worldState({ subtype: 'no_such_subtype' }), PLACED_BEAT.templateId!, FIRST);
    expect(prepared).toMatchObject({ success: false, reason: 'ineligible' });
  });
});

describe('resolvePendingBeat — no fallback reaction runs against the god for a delivery beat (THR-1650)', () => {
  const godWritingTemplate = {
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: '', changes: [],
        reactions: [{
          id: 'rx-untrue', label: 'x',
          effects: [{ kind: 'unlock_action', actionId: 'delivery.untrue.consequence' }],
        }],
      },
    },
  } as unknown as UnifiedActionTemplate;

  afterEach(() => vi.restoreAllMocks());

  it('records the beat as delivered and runs none of the template\'s reactions', () => {
    const spy = vi.spyOn(encounterAftermath, 'applyEncounterAftermathReaction');
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), PLACED_BEAT.beatId, 40)!.next;
    const result = resolvePendingBeat(
      worldState({ beats: offered }),
      { runtime: createSimulationRuntime(), templateProvider: () => godWritingTemplate },
    );
    expect(result.resolved).toBe(true);
    expect(result.state.ascendantBeats?.pending).toBeNull();
    expect(result.state.ascendantBeats?.history.map(h => h.beatId)).toContain(PLACED_BEAT.beatId);
    expect(spy).not.toHaveBeenCalled();
    expect(result.state.unlockedActionIds ?? []).not.toContain('delivery.untrue.consequence');
  });

  it('control: a non-delivery pool beat still runs its template aftermath', () => {
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), 'beat.pool.invest.the_worthy_mortal', 40)!.next;
    const result = resolvePendingBeat(
      worldState({ beats: offered }),
      { runtime: createSimulationRuntime(), templateProvider: () => godWritingTemplate },
    );
    expect(result.resolved).toBe(true);
    expect(result.state.unlockedActionIds).toContain('delivery.untrue.consequence');
  });
});

describe('Director offer filter — a vision that cannot bind is never offered (THR-1650)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  /** Spine exhausted and the cadence gate long open, so each call draws from the pool. */
  function cadenceReady(): AscendantBeatState {
    return { ...createInitialAscendantBeatState(), spineCursor: ASCENDANT_SPINE.length, lastBeatTurn: 0 };
  }

  it('with no First bonded, no delivery beat is ever drawn and the withholding is traced', () => {
    for (let tick = 200; tick < 260; tick++) {
      const update = phaseAscendantBeatDirector(worldState({ first: false, beats: cadenceReady(), tick }), mulberry32(tick));
      expect(update.ascendantBeats?.pending?.kind).not.toBe('delivery');
    }
    const skipped = getTraces().filter(t => t.category === 'beat.delivery_skipped') as unknown as
      Array<{ reason?: string; filteredCount?: number; beatId?: string }>;
    expect(skipped.length).toBeGreaterThan(0);
    expect(skipped[0].reason).toBe('no_first');
    expect(skipped[0].filteredCount).toBe(ALL_DELIVERY_BEATS.length);
    expect(skipped[0].beatId).toBeUndefined();
  });

  it('with The First at a matching place, that beat stays in the pool', () => {
    let offeredDelivery = false;
    for (let tick = 200; tick < 600 && !offeredDelivery; tick++) {
      const update = phaseAscendantBeatDirector(worldState({ beats: cadenceReady(), tick }), mulberry32(tick));
      if (update.ascendantBeats?.pending?.kind === 'delivery') {
        offeredDelivery = true;
        const templateId = update.ascendantBeats.pending.beatId.replace('beat.delivery.', '');
        expect(bindDeliverySubject(worldState(), templateId).ok).toBe(true);
      }
    }
    expect(offeredDelivery).toBe(true);
  });
});
