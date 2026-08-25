/**
 * The Packet Dice — batch authoring packet tests. THR-1245.
 *
 * The two properties that matter most, and why each has a falsification arm:
 *
 * 1. **No second sampler.** An unconstrained packet slot must draw
 *    bit-identically to the single-slot commands (`rollSeedDice`,
 *    `drawPlotHooks`, `drawConsequenceHand`) — the drawTable module's own
 *    warning is that a second hand-rolled sampler is the drift the utility
 *    exists to prevent. Pinned by direct comparison, not by re-deriving.
 *
 * 2. **Caps hold by construction.** Sweeping many seeds proves the batch never
 *    breaches a cap or floor; the falsification arms prove the enforcement is
 *    real rather than vacuously green (a single-slot batch is always
 *    floor-forced; an all-override batch reports its breach instead of hiding
 *    it). A cap test that could not fail is the vacuous-probe rot class.
 */

import { describe, expect, it } from 'vitest';
import {
  DECISION_SHAPE_FACES,
  PACKET_DICE_BATCH_BOUNDS,
  PACKET_MAX_CAPPED_SLOTS,
  SYSTEM_TARGET_FACES,
  packetDiceCatalogViolations,
  packetSlotSeed,
  rollBatchPacket,
  settingClassWeight,
  settingCoverageFromTemplates,
  type SettingCoverage,
} from '../packetDice';
import { SETTING_CLASSES } from '../../settingClasses';
import { SEED_DICE_BATCH_BOUNDS, rollSeedDice } from '../seedDice';
import { drawPlotHooks } from '../plotHooks';
import { drawConsequenceHand } from '../consequenceDraw';

/** A census with texture: one saturated class, one covered, the rest gaps. */
const COVERAGE: SettingCoverage = Object.fromEntries(
  SETTING_CLASSES.map(cls => [cls, cls === 'wayside' ? 6 : cls === 'rural' ? 2 : 0]),
) as SettingCoverage;

const SWEEP_SEEDS = Array.from({ length: 40 }, (_, i) => `sweep-brief-${i}`);

describe('packet dice catalog health', () => {
  it('reports no violations on the shipped tables', () => {
    expect(packetDiceCatalogViolations()).toEqual([]);
  });

  it('face rosters match their source documents exactly', () => {
    // Pinned as sets so a quiet face rename or loss fails here, not in a draw.
    expect(DECISION_SHAPE_FACES.map(f => f.id).sort()).toEqual(
      [
        'danger_confrontation_aftermath',
        'opt_in_complication',
        'personality_fork',
        'puzzle_investigation_resolution',
        'seeded_sequel',
        'single_test',
        'test_and_consequence',
      ],
    );
    expect(SYSTEM_TARGET_FACES.filter(f => f.tier === 'mature').map(f => f.id).sort()).toEqual(
      ['cards', 'carryover', 'conditions', 'forks', 'items', 'movement', 'traits'],
    );
    expect(SYSTEM_TARGET_FACES.filter(f => f.tier === 'middling').map(f => f.id).sort()).toEqual(
      ['favors', 'groups', 'omens'],
    );
    expect(SYSTEM_TARGET_FACES.filter(f => f.tier === 'deferred').map(f => f.id).sort()).toEqual(
      ['agent_magic', 'economy', 'factions', 'war'],
    );
  });
});

describe('setting gap weighting', () => {
  it('is strictly monotone decreasing in coverage', () => {
    expect(settingClassWeight(0)).toBeGreaterThan(settingClassWeight(1));
    expect(settingClassWeight(1)).toBeGreaterThan(settingClassWeight(5));
  });

  it('counts the census off declared settings arrays', () => {
    const census = settingCoverageFromTemplates([
      { settings: ['wayside', 'rural'] },
      { settings: ['wayside'] },
      { settings: undefined },
      {},
    ]);
    expect(census.wayside).toBe(2);
    expect(census.rural).toBe(1);
    expect(census.stronghold).toBe(0);
  });
});

describe('rollBatchPacket determinism', () => {
  it('same input in, same batch out', () => {
    const roll = () => rollBatchPacket({ briefSlug: 'det-brief', settingCoverage: COVERAGE });
    expect(roll()).toEqual(roll());
  });

  it('keeps the non-final prefix when the batch grows', () => {
    const four = rollBatchPacket({ briefSlug: 'grow-brief', slots: 4, settingCoverage: COVERAGE });
    const six = rollBatchPacket({ briefSlug: 'grow-brief', slots: 6, settingCoverage: COVERAGE });
    // Slot 4 may differ (it was the floor-carrying last slot of the smaller
    // batch); slots 1–3 must not.
    expect(six.slots.slice(0, 3)).toEqual(four.slots.slice(0, 3));
  });
});

describe('no second sampler — unconstrained slots match the single-slot commands', () => {
  it("slot 1's seed dice equal rollSeedDice on the slot seed with no exclusions", () => {
    const packet = rollBatchPacket({ briefSlug: 'identity-brief', settingCoverage: COVERAGE });
    const slot = packet.slots[0];
    const direct = rollSeedDice({
      briefSeed: packetSlotSeed('identity-brief', 1),
      themes: [...new Set(slot.hooks.flatMap(hook => hook.themes))],
    });
    expect(slot.seedDice).toEqual(direct);
  });

  it("slot 1's hooks equal drawPlotHooks on the slot seed and rolled reach", () => {
    const packet = rollBatchPacket({ briefSlug: 'identity-brief', settingCoverage: COVERAGE });
    const slot = packet.slots[0];
    expect(slot.hooks).toEqual(
      drawPlotHooks({ briefSeed: slot.slotSeed, reach: slot.reach }),
    );
  });

  it('a slot with a template id carries exactly the binding consequence hand', () => {
    const packet = rollBatchPacket({
      briefSlug: 'hand-brief',
      slots: 2,
      templateIds: ['encounter.test.packet_hand', undefined],
      settingCoverage: COVERAGE,
    });
    const [withId, withoutId] = packet.slots;
    expect(withId.consequence?.hand).toEqual(
      drawConsequenceHand({
        templateId: 'encounter.test.packet_hand',
        reach: withId.reach,
        rarityTier: 1,
      }),
    );
    expect(withoutId.consequence).toBeUndefined();
  });
});

describe('caps and floors hold by construction', () => {
  it('a 40-seed sweep of 6-slot batches never breaches a cap, a floor, or the tier gate', () => {
    for (const briefSlug of SWEEP_SEEDS) {
      const packet = rollBatchPacket({ briefSlug, settingCoverage: COVERAGE });
      expect(packet.violations).toEqual([]);

      const capOf = (counts: Readonly<Partial<Record<string, number>>>, cap: number) => {
        for (const count of Object.values(counts)) expect(count ?? 0).toBeLessThanOrEqual(cap);
      };
      capOf(packet.spread.reach, PACKET_DICE_BATCH_BOUNDS.reachCap);
      capOf(packet.spread.stake, SEED_DICE_BATCH_BOUNDS.stakeCap);
      capOf(packet.spread.opposition, SEED_DICE_BATCH_BOUNDS.oppositionCap);
      capOf(packet.spread.agentRole, SEED_DICE_BATCH_BOUNDS.agentRoleCap);
      capOf(packet.spread.decisionShape, PACKET_DICE_BATCH_BOUNDS.decisionShapeCap);
      capOf(packet.spread.settingClass, PACKET_DICE_BATCH_BOUNDS.settingClassCap);
      capOf(packet.spread.systemTarget, PACKET_DICE_BATCH_BOUNDS.systemCap);
      expect(packet.spread.disposition.hostile ?? 0).toBeLessThanOrEqual(
        SEED_DICE_BATCH_BOUNDS.hostileCap,
      );

      const settlementOrLarger =
        (packet.spread.scale.settlement ?? 0) + (packet.spread.scale.region ?? 0);
      expect(settlementOrLarger).toBeGreaterThanOrEqual(
        SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor,
      );

      const middling = packet.slots.filter(slot => slot.systemTarget.tier === 'middling').length;
      expect(middling).toBeLessThanOrEqual(PACKET_DICE_BATCH_BOUNDS.middlingSystemTotalCap);
      expect(packet.slots.some(slot => slot.systemTarget.tier === 'deferred')).toBe(false);
    }
  });

  it('falsification: a single-slot batch is always floor-forced to settlement-or-larger', () => {
    // An unconstrained scale die rolls personal/company half the time, so this
    // arm fails if the floor forcing is deleted — it is what proves the sweep
    // above is not vacuously green.
    for (const briefSlug of SWEEP_SEEDS.slice(0, 20)) {
      const packet = rollBatchPacket({ briefSlug, slots: 1, settingCoverage: COVERAGE });
      expect(['settlement', 'region']).toContain(packet.slots[0].seedDice.scale);
    }
  });

  it('falsification: the sweep actually exercises enforcement (some slot is constrained)', () => {
    // If no batch in the sweep ever had a cap bite, the sweep proves nothing.
    // A bitten cap is visible as an axis reaching its cap exactly — with 6
    // slots over small tables that must happen somewhere in 40 batches.
    const anyAtCap = SWEEP_SEEDS.some(briefSlug => {
      const packet = rollBatchPacket({ briefSlug, settingCoverage: COVERAGE });
      return Object.values(packet.spread.stake).some(
        count => count === SEED_DICE_BATCH_BOUNDS.stakeCap,
      );
    });
    expect(anyAtCap).toBe(true);
  });

  it('reports a human override that breaches a cap instead of hiding it', () => {
    const packet = rollBatchPacket({
      briefSlug: 'override-brief',
      slots: 6,
      reaches: ['iron', 'iron', 'iron', 'iron', 'iron', 'iron'],
      settingCoverage: COVERAGE,
    });
    expect(packet.slots.every(slot => slot.reach === 'iron' && slot.reachOverridden)).toBe(true);
    expect(packet.violations.some(v => v.includes("reach 'iron'"))).toBe(true);
  });

  it('reports an oversized batch instead of pretending the caps held', () => {
    const packet = rollBatchPacket({
      briefSlug: 'oversized-brief',
      slots: PACKET_MAX_CAPPED_SLOTS + 1,
      settingCoverage: COVERAGE,
    });
    expect(packet.violations.some(v => v.includes(`${PACKET_MAX_CAPPED_SLOTS}`))).toBe(true);
  });
});

describe('reach overrides', () => {
  it('a sparse override list pins named slots and rolls the rest', () => {
    const packet = rollBatchPacket({
      briefSlug: 'sparse-brief',
      slots: 3,
      reaches: [undefined, 'veil', undefined],
      settingCoverage: COVERAGE,
    });
    expect(packet.slots[1].reach).toBe('veil');
    expect(packet.slots[1].reachOverridden).toBe(true);
    expect(packet.slots[0].reachOverridden).toBe(false);
    expect(packet.slots[2].reachOverridden).toBe(false);
  });
});
