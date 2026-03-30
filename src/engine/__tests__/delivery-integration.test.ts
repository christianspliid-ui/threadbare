import { describe, it, expect } from 'vitest';
import { getAgentWheelSlots } from '../wheel';
import { isInRange, hexDistance, getDeliveryInfo } from '../delivery';
import { executeIntervention } from '../dream';
import { INTERVENTION_DEFINITIONS, DELIVERY_RANGE, LOCAL_ENCOUNTER } from '../../types/dream';
import type { EssencePool } from '../../types/influence';

function fullPool(amount: number): EssencePool {
  return { force: amount, matter: amount, energy: amount, life: amount, mind: amount, spirit: amount, time: amount, entropy: amount };
}

describe('Delivery mechanics integration', () => {
  it('wheel slots gate availability by range for regional interventions', () => {
    const slots = getAgentWheelSlots({
      tier: 3,
      pool: fullPool(20),
      primarySphere: 'mind',
      avatarPos: { col: 0, row: 0 },
      targetPos: { col: 10, row: 10 },
    });

    // Dream (astral) should be available — unlimited range
    expect(slots.find(s => s.id === 'dream')!.available).toBe(true);
    // Coincidence (remote) should be available — unlimited range
    expect(slots.find(s => s.id === 'coincidence')!.available).toBe(true);
    // Deceive (regional, range 3) should be unavailable — too far
    expect(slots.find(s => s.id === 'deceive')!.available).toBe(false);
    // Persuade (local) should be unavailable — not same hex
    expect(slots.find(s => s.id === 'persuade')!.available).toBe(false);
  });

  it('full intervention flow: range check → cost → execute → result', () => {
    const avatarPos = { col: 5, row: 5 };
    const targetPos = { col: 7, row: 5 }; // 2 hexes away

    // 1. Check range for deceive (regional, range 3)
    expect(isInRange(avatarPos, targetPos, 'deceive')).toBe(true);

    // 2. Get wheel slots with positions
    const slots = getAgentWheelSlots({
      tier: 2,
      pool: fullPool(10),
      primarySphere: 'mind',
      avatarPos,
      targetPos,
    });
    const deceiveSlot = slots.find(s => s.id === 'deceive')!;
    expect(deceiveSlot.available).toBe(true);
    expect(deceiveSlot.rangeStatus).toBe('in_range');

    // 3. Execute intervention
    const result = executeIntervention({
      interventionType: 'deceive',
      sphere: 'mind',
      baseCost: 2,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool: fullPool(10),
      detectionRoll: 0.5, // > 0.3 detection risk, so not detected
    });
    expect(result.success).toBe(true);
    expect(result.detected).toBe(false);
  });

  it('every intervention type has consistent delivery info', () => {
    for (const [key, def] of Object.entries(INTERVENTION_DEFINITIONS)) {
      const info = getDeliveryInfo(key as any);
      expect(info.mode).toBe(def.deliveryMode);
    }
  });
});
