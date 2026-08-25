/**
 * The Packet Draw. THR-1245.
 *
 * Contract: `nudge-authoring-spec.md` § *The Seed Dice*, `batch-brief-format.md`
 * § *Rolled constraints*, `Docs/canon/encounter-catalogs.md` §§ 1, 2, 7.
 *
 * Two properties carry this module and both are tested by **falsification**
 * rather than by a happy-path packet:
 *
 * 1. **Caps hold across seeds.** One packet respecting its caps proves nothing —
 *    a six-slot roll off eight-face tables usually complies by luck. So the caps
 *    are asserted over a spread of seeds, and the enforcement path is separately
 *    pinned by driving a table small enough that an uncapped roll *must* bust.
 * 2. **Unconstrained slots match the underlying samplers exactly.** The whole
 *    reason exclusion lives in `rollSeedDice` rather than here is that a second
 *    sampler drifts from the first. The test that would catch that drift
 *    compares slot output against a direct `rollSeedDice` / `drawPlotHooks` call
 *    at the same seed — so a future refactor that re-implements a die inside the
 *    packet fails here rather than in the corpus six batches later.
 */

import { describe, expect, it } from 'vitest';

import { REACH_DOMAINS, type ReachDomain } from '../../../types/traits';
import { SETTING_CLASSES, type SettingClass } from '../../settingClasses';
import { drawPlotHooks } from '../plotHooks';
import { drawConsequenceHand } from '../consequenceDraw';
import { SEED_DICE_BATCH_BOUNDS, rollSeedDice } from '../seedDice';
import {
  DECISION_SHAPE_FACES,
  PACKET_BATCH_BOUNDS,
  PACKET_DEFAULT_SLOTS,
  PACKET_MAX_SLOTS,
  REACH_FACES,
  SCALES_BELOW_FLOOR,
  SCALES_MEETING_FLOOR,
  SETTING_BASE_WEIGHT,
  SETTING_GAP_BONUS_WEIGHT,
  SYSTEM_MATURITY_WEIGHTS,
  SYSTEM_TARGET_FACES,
  TARGETABLE_SYSTEM_FACES,
  packetDiceCatalogViolations,
  rollPacket,
  settingClassWeights,
} from '../packetDice';

/** Seeds used wherever a property must hold across the table, not for one roll. */
const SEEDS: readonly string[] = [
  'retrofit-batch-1',
  'retrofit-batch-2-ward-the-camp',
  'slice-stronghold-turn',
  'batch-alpha',
  'batch-omega',
  'a',
  'the-long-road-home',
  'zzz-last',
  'batch-7',
  'nudge-corpus-tranche-2',
];

function tally<T>(values: readonly T[]): Map<T, number> {
  const out = new Map<T, number>();
  for (const value of values) out.set(value, (out.get(value) ?? 0) + 1);
  return out;
}

function maxCount<T>(values: readonly T[]): number {
  return Math.max(0, ...tally(values).values());
}

describe('catalog health', () => {
  it('reports no violations against the canon face counts', () => {
    expect(packetDiceCatalogViolations()).toEqual([]);
  });

  it('pins the four dice to the face counts canon states', () => {
    expect(REACH_FACES).toHaveLength(8);
    expect(DECISION_SHAPE_FACES).toHaveLength(7);
    expect(SETTING_CLASSES).toHaveLength(8);
    expect(SYSTEM_TARGET_FACES).toHaveLength(14);
  });

  it('carries the deferred tier in the vocabulary at weight zero', () => {
    // Deleting the deferred entries would leave a 10-face table that cannot say
    // "not yet" — a deferred system would read as an unknown one.
    const deferred = SYSTEM_TARGET_FACES.filter(face => face.maturity === 'deferred');
    expect(deferred.map(face => face.id)).toEqual(['economy', 'war', 'factions', 'agent-magic']);
    expect(SYSTEM_MATURITY_WEIGHTS.deferred).toBe(0);
    expect(TARGETABLE_SYSTEM_FACES.map(face => face.id)).not.toContain('economy');
  });

  it('splits the scale faces into exactly the floor and non-floor halves', () => {
    expect(SCALES_MEETING_FLOOR).toEqual(['settlement', 'region']);
    expect(SCALES_BELOW_FLOOR).toEqual(['personal', 'company']);
  });
});

describe('determinism', () => {
  it('re-rolls identically for the same slug', () => {
    const a = rollPacket({ briefSlug: 'retrofit-batch-2-ward-the-camp' });
    const b = rollPacket({ briefSlug: 'retrofit-batch-2-ward-the-camp' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('rolls differently for a different slug', () => {
    const a = rollPacket({ briefSlug: 'batch-alpha' });
    const b = rollPacket({ briefSlug: 'batch-omega' });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('does not shift the dice when template ids are added', () => {
    // Slot seeds are `<slug>:slot-<n>`, deliberately not the id: a batch's dice
    // must not move when ids are named, renamed or dropped.
    const bare = rollPacket({ briefSlug: 'batch-alpha' });
    const named = rollPacket({
      briefSlug: 'batch-alpha',
      ids: ['encounter.slice.one', 'encounter.slice.two'],
    });
    expect(named.slots.map(slot => slot.seedDice.stake.id)).toEqual(
      bare.slots.map(slot => slot.seedDice.stake.id),
    );
    expect(named.slots.map(slot => slot.settingClass)).toEqual(
      bare.slots.map(slot => slot.settingClass),
    );
  });

  it('defaults to the batch size the brief format is written around', () => {
    expect(rollPacket({ briefSlug: 'batch-alpha' }).slots).toHaveLength(PACKET_DEFAULT_SLOTS);
  });

  it('clamps a slot count outside the supported range rather than throwing', () => {
    expect(rollPacket({ briefSlug: 'x', slots: 0 }).slots).toHaveLength(1);
    expect(rollPacket({ briefSlug: 'x', slots: 10_000 }).slots).toHaveLength(PACKET_MAX_SLOTS);
  });
});

describe('no second sampler — unconstrained slots match the underlying draws', () => {
  it('matches rollSeedDice exactly on every slot that took no correction', () => {
    let compared = 0;
    for (const seed of SEEDS) {
      const packet = rollPacket({ briefSlug: seed });
      for (const slot of packet.slots) {
        if (slot.corrections.some(c => c.axis !== 'reach')) continue;
        const themes = [...new Set(slot.hooks.flatMap(hook => hook.themes))];
        const direct = rollSeedDice({ briefSeed: slot.slotSeed, themes });
        expect(slot.seedDice).toEqual(direct);
        compared++;
      }
    }
    // Guard against the vacuous pass: if every slot were corrected the loop
    // above would assert nothing at all.
    expect(compared).toBeGreaterThan(0);
  });

  it('matches drawPlotHooks exactly at the slot seed and rolled reach', () => {
    const packet = rollPacket({ briefSlug: 'retrofit-batch-1' });
    for (const slot of packet.slots) {
      expect(slot.hooks).toEqual(
        drawPlotHooks({ briefSeed: slot.slotSeed, reach: slot.reach, count: slot.hooks.length }),
      );
    }
  });

  it('records what the unconstrained table rolled whenever it corrects a slot', () => {
    // A correction that did not change anything is not recorded, so every
    // recorded one must name two different faces — otherwise the packet is
    // reporting noise and an author cannot tell a cap from a coincidence.
    for (const seed of SEEDS) {
      for (const correction of rollPacket({ briefSlug: seed }).corrections) {
        expect(correction.rolled).not.toBe(correction.replacedWith);
        expect(correction.reason).not.toBe('');
      }
    }
  });
});

describe('caps hold by construction', () => {
  it.each(SEEDS)('honours every cap and floor for %s', seed => {
    const packet = rollPacket({ briefSlug: seed });

    expect(maxCount(packet.slots.map(s => s.reach))).toBeLessThanOrEqual(
      PACKET_BATCH_BOUNDS.reachCap,
    );
    expect(maxCount(packet.slots.map(s => s.decisionShape.id))).toBeLessThanOrEqual(
      PACKET_BATCH_BOUNDS.decisionShapeCap,
    );
    expect(maxCount(packet.slots.map(s => s.settingClass))).toBeLessThanOrEqual(
      PACKET_BATCH_BOUNDS.settingClassCap,
    );
    expect(maxCount(packet.slots.map(s => s.seedDice.stake.id))).toBeLessThanOrEqual(
      SEED_DICE_BATCH_BOUNDS.stakeCap,
    );
    expect(maxCount(packet.slots.map(s => s.seedDice.opposition.id))).toBeLessThanOrEqual(
      SEED_DICE_BATCH_BOUNDS.oppositionCap,
    );
    expect(maxCount(packet.slots.map(s => s.seedDice.agentRole.id))).toBeLessThanOrEqual(
      SEED_DICE_BATCH_BOUNDS.agentRoleCap,
    );

    const hostile = packet.slots.filter(s => s.seedDice.disposition === 'hostile').length;
    expect(hostile).toBeLessThanOrEqual(SEED_DICE_BATCH_BOUNDS.hostileCap);

    const middling = packet.slots.filter(s => s.systemTarget.maturity === 'middling').length;
    expect(middling).toBeLessThanOrEqual(PACKET_BATCH_BOUNDS.middlingSystemCap);
    expect(packet.slots.filter(s => s.systemTarget.maturity === 'deferred')).toHaveLength(0);

    const floorMet = packet.slots.filter(s =>
      SCALES_MEETING_FLOOR.includes(s.seedDice.scale),
    ).length;
    expect(floorMet).toBeGreaterThanOrEqual(
      SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor,
    );

    expect(packet.spread.every(row => row.satisfied)).toBe(true);
  });

  it('falsification — the caps are doing work, not describing luck', () => {
    // If exclusion were a no-op, an uncapped batch would bust somewhere across
    // these seeds. Assert that the packet actually *corrects* rather than
    // merely never needing to: at least one seed must record a correction on a
    // capped axis, or this whole describe block is a tautology.
    const corrected = SEEDS.flatMap(seed => rollPacket({ briefSlug: seed }).corrections);
    expect(corrected.length).toBeGreaterThan(0);
    expect(new Set(corrected.map(c => c.axis)).size).toBeGreaterThan(1);
  });

  it('forces the scale floor at the last slot that can still meet it', () => {
    // A one-slot batch has exactly one chance, so its single slot must roll
    // settlement-or-larger no matter what the unconstrained die said.
    for (const seed of SEEDS) {
      const packet = rollPacket({ briefSlug: seed, slots: 1 });
      expect(SCALES_MEETING_FLOOR).toContain(packet.slots[0].seedDice.scale);
    }
  });

  it('does not force the floor early when later slots could still meet it', () => {
    // The floor costs the batch one roll of freedom, not all of them: across a
    // spread of seeds some six-slot batches must open on a below-floor scale.
    const openings = SEEDS.map(seed => rollPacket({ briefSlug: seed }).slots[0].seedDice.scale);
    expect(openings.some(scale => SCALES_BELOW_FLOOR.includes(scale))).toBe(true);
  });

  it('reports an unmet bound rather than looping when a batch cannot comply', () => {
    // A supplied `--reaches` list is an explicit instruction and is deliberately
    // never reduced to fit the cap — so it is the one way to produce a batch
    // whose spread cannot be satisfied, and the right behaviour is to say so.
    const packet = rollPacket({
      briefSlug: 'batch-alpha',
      slots: 6,
      reaches: ['iron'],
    });
    expect(packet.slots.every(slot => slot.reach === 'iron')).toBe(true);
    const reachRow = packet.spread.find(row => row.axis === 'reach');
    expect(reachRow?.satisfied).toBe(false);
  });
});

describe('the reach override', () => {
  it('assigns supplied reaches in order and cycles them', () => {
    const packet = rollPacket({
      briefSlug: 'batch-alpha',
      slots: 5,
      reaches: ['iron', 'veil', 'heart'],
    });
    expect(packet.slots.map(slot => slot.reach)).toEqual([
      'iron',
      'veil',
      'heart',
      'iron',
      'veil',
    ]);
  });

  it('never records a reach correction when the reach was supplied', () => {
    const packet = rollPacket({ briefSlug: 'batch-alpha', reaches: ['iron'] });
    expect(packet.corrections.filter(c => c.axis === 'reach')).toEqual([]);
  });

  it('rolls the reach when the list is empty rather than producing undefined', () => {
    const packet = rollPacket({ briefSlug: 'batch-alpha', reaches: [] });
    for (const slot of packet.slots) {
      expect(REACH_DOMAINS as readonly ReachDomain[]).toContain(slot.reach);
    }
  });
});

describe('the setting die is gap-weighted', () => {
  it('weights an uncovered class above a covered one', () => {
    const weights = settingClassWeights({ rural: 40, urban: 20, stronghold: 0 });
    expect(weights.stronghold).toBeGreaterThan(weights.urban);
    expect(weights.urban).toBeGreaterThan(weights.rural);
  });

  it('puts the densest class at the base weight and an empty one at base + bonus', () => {
    const weights = settingClassWeights({ rural: 40, stronghold: 0 });
    expect(weights.rural).toBeCloseTo(SETTING_BASE_WEIGHT);
    expect(weights.stronghold).toBeCloseTo(SETTING_BASE_WEIGHT + SETTING_GAP_BONUS_WEIGHT);
  });

  it('is flat when there is no coverage data at all', () => {
    const flat = settingClassWeights();
    const values = SETTING_CLASSES.map(cls => flat[cls]);
    expect(new Set(values).size).toBe(1);
    expect(settingClassWeights({})).toEqual(flat);
  });

  it('surfaces the starved class more often than the dense one across seeds', () => {
    // The behavioural claim, not just the arithmetic one: gap weighting has to
    // change what a batch actually rolls, or it is a number nobody reads.
    const counts: Readonly<Partial<Record<SettingClass, number>>> = {
      rural: 40,
      urban: 40,
      wayside: 40,
      stronghold: 0,
    };
    const drawn = SEEDS.flatMap(seed =>
      rollPacket({ briefSlug: seed, settingCorpusCounts: counts }).slots.map(s => s.settingClass),
    );
    const strongholds = drawn.filter(cls => cls === 'stronghold').length;
    const rurals = drawn.filter(cls => cls === 'rural').length;
    expect(strongholds).toBeGreaterThan(rurals);
  });

  it('treats a negative count as zero rather than inverting the weighting', () => {
    const weights = settingClassWeights({ rural: -5, urban: 10 });
    expect(weights.rural).toBeGreaterThan(weights.urban);
  });
});

describe('the consequence hand', () => {
  it('is absent for a slot with no template id', () => {
    // The hand is seeded by the template id (THR-1145), so drawing one for an
    // unnamed slot would be re-drawn — differently — the moment it was named.
    const packet = rollPacket({ briefSlug: 'batch-alpha' });
    expect(packet.slots.every(slot => slot.consequenceHand === undefined)).toBe(true);
  });

  it('matches drawConsequenceHand for a new id at the rolled reach', () => {
    const packet = rollPacket({
      briefSlug: 'batch-alpha',
      slots: 2,
      ids: ['encounter.slice.brand_new'],
      rarityTier: 3,
    });
    const slot = packet.slots[0];
    expect(slot.consequenceHand).toEqual(
      drawConsequenceHand({
        templateId: 'encounter.slice.brand_new',
        reach: slot.reach,
        rarityTier: 3,
      }),
    );
    expect(packet.slots[1].consequenceHand).toBeUndefined();
  });

  it("uses a known template's own reach and tier, not the packet's rolled reach", () => {
    // A retrofit batch names existing templates; a hand drawn off the rolled
    // reach would disagree with the one `check:encounter` recomputes.
    const known = new Map([
      ['encounter.slice.existing', { reach: 'star' as ReachDomain, rarityTier: 4 as const }],
    ]);
    const packet = rollPacket({
      briefSlug: 'batch-alpha',
      slots: 1,
      ids: ['encounter.slice.existing'],
      knownTemplates: known,
      rarityTier: 1,
    });
    expect(packet.slots[0].consequenceHand).toEqual(
      drawConsequenceHand({
        templateId: 'encounter.slice.existing',
        reach: 'star',
        rarityTier: 4,
      }),
    );
  });
});

describe('the spread', () => {
  it('covers every axis the batch brief lists a variance row for', () => {
    const axes = rollPacket({ briefSlug: 'batch-alpha' }).spread.map(row => row.axis);
    expect(axes).toEqual([
      'reach',
      'decision shape',
      'setting class',
      'system target',
      'P3 stake shape',
      'opposition',
      'disposition',
      "agent's role",
      'scale',
    ]);
  });

  it('counts every slot on every per-slot axis', () => {
    const packet = rollPacket({ briefSlug: 'batch-alpha', slots: 6 });
    for (const axis of ['reach', 'decision shape', 'setting class', 'system target', 'scale']) {
      const row = packet.spread.find(r => r.axis === axis);
      const total = (row?.counts ?? []).reduce((sum, [, count]) => sum + count, 0);
      expect(total).toBe(6);
    }
  });
});
