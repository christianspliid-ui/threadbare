import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ALL_DELIVERY_BEATS,
  DELIVERY_BEAT_ID_PREFIX,
  DELIVERY_BEAT_WEIGHT,
  branchingEncounterToDeliveryBeat,
  deliveryBeatIdFor,
  eligibleDeliveryBeats,
  getDeliveryBeatById,
  isDeliverableBranchingEncounter,
  sourceTemplateIdOf,
} from '../deliveryBeatAdapter';
import { forceOfferBeatById, drawFromPool, createInitialAscendantBeatState } from '../ascendantBeat';
import { ASCENDANT_SPINE, ASCENDANT_BEAT_POOL } from '../../data/ascendant-beat-content';
import {
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../data/unified-action-templates';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';

// Deterministic PRNG (mulberry32) — seed-stable draws (NFP #3).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DELIVERABLE = LOCATION_BRANCHING_ENCOUNTER_TEMPLATES.filter(isDeliverableBranchingEncounter);

describe('delivery-beat adapter (THR-506)', () => {
  it('maps every deliverable branching encounter to exactly one delivery beat', () => {
    expect(ALL_DELIVERY_BEATS.length).toBe(DELIVERABLE.length);
    expect(ALL_DELIVERY_BEATS.length).toBeGreaterThan(0);
  });

  it('each delivery beat is a cadence-triggered delivery kind carrying its source templateId', () => {
    const ids = new Set<string>();
    const realTemplateIds = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
    for (const beat of ALL_DELIVERY_BEATS) {
      expect(beat.kind).toBe('delivery');
      expect(beat.trigger.kind).toBe('cadence');
      expect(beat.weight).toBe(DELIVERY_BEAT_WEIGHT);
      expect(beat.beatId.startsWith(DELIVERY_BEAT_ID_PREFIX)).toBe(true);
      // templateId points at a real, registered branching encounter template.
      expect(beat.templateId).toBeDefined();
      expect(realTemplateIds.has(beat.templateId!)).toBe(true);
      expect(beat.beatId).toBe(deliveryBeatIdFor(beat.templateId!));
      // Unique ids.
      expect(ids.has(beat.beatId)).toBe(false);
      ids.add(beat.beatId);
    }
  });

  it('delivery beat ids never collide with the spine or base pool', () => {
    const staticIds = new Set([
      ...ASCENDANT_SPINE.map(b => b.beatId),
      ...ASCENDANT_BEAT_POOL.map(b => b.beatId),
    ]);
    for (const beat of ALL_DELIVERY_BEATS) {
      expect(staticIds.has(beat.beatId)).toBe(false);
    }
  });

  it('id helpers round-trip; non-delivery ids resolve to null', () => {
    const tpl = DELIVERABLE[0];
    expect(sourceTemplateIdOf(deliveryBeatIdFor(tpl.id))).toBe(tpl.id);
    expect(branchingEncounterToDeliveryBeat(tpl).templateId).toBe(tpl.id);
    expect(sourceTemplateIdOf('beat.pool.intro.first_stirring')).toBeNull();
    expect(sourceTemplateIdOf(ASCENDANT_SPINE[0].beatId)).toBeNull();
  });

  it('getDeliveryBeatById finds delivery beats and only delivery beats', () => {
    const first = ALL_DELIVERY_BEATS[0];
    expect(getDeliveryBeatById(first.beatId)?.templateId).toBe(first.templateId);
    expect(getDeliveryBeatById('beat.pool.intro.first_stirring')).toBeUndefined();
    expect(getDeliveryBeatById('beat.does.not.exist')).toBeUndefined();
  });

  describe('eligibility (dedup against delivered history)', () => {
    it('returns all delivery beats when nothing has been delivered', () => {
      expect(eligibleDeliveryBeats([]).length).toBe(ALL_DELIVERY_BEATS.length);
    });

    it('excludes already-delivered beats and keeps the rest', () => {
      const delivered = ALL_DELIVERY_BEATS[0].beatId;
      const eligible = eligibleDeliveryBeats([delivered]);
      expect(eligible.length).toBe(ALL_DELIVERY_BEATS.length - 1);
      expect(eligible.some(b => b.beatId === delivered)).toBe(false);
    });
  });

  it('the merged draw pool yields delivery beats across seeded rolls', () => {
    const pool = [...ASCENDANT_BEAT_POOL, ...eligibleDeliveryBeats([])];
    const rng = mulberry32(7);
    let deliveryDraws = 0;
    for (let i = 0; i < 400; i++) {
      const def = drawFromPool(pool, rng);
      if (def && sourceTemplateIdOf(def.beatId)) deliveryDraws++;
    }
    // Delivery beats are a minority of the pool but must be reachable, never starved.
    expect(deliveryDraws).toBeGreaterThan(0);
  });
});

describe('delivery beat force-offer surfaces the source template id (THR-506 Done-when)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('force-offering a delivery beat sets pending and emits the source templateId in its traces', () => {
    const delivery = ALL_DELIVERY_BEATS[0];
    const result = forceOfferBeatById(createInitialAscendantBeatState(), delivery.beatId, 5);
    expect(result).not.toBeNull();
    expect(result!.def.templateId).toBe(delivery.templateId);
    expect(result!.next.pending?.beatId).toBe(delivery.beatId);

    const scheduled = getTraces().find(t => t.category === 'ascendant.beat.scheduled') as
      | { templateId?: string; beatId: string }
      | undefined;
    const offered = getTraces().find(t => t.category === 'ascendant.beat.offered') as
      | { templateId?: string }
      | undefined;
    expect(scheduled?.beatId).toBe(delivery.beatId);
    expect(scheduled?.templateId).toBe(delivery.templateId);
    expect(offered?.templateId).toBe(delivery.templateId);
  });
});
