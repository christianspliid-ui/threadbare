/**
 * Is a settlement hungry today? (THR-1934 S1, plan § Engine 3.)
 *
 * One hunger counter, two sources. With the settlement economy live (the town
 * carries a numeric `foodStore`) a town is hungry when its store is empty and its
 * food balance is negative. Before it, a town is hungry when any staple in its
 * resource bag sits at the `scarce` stock tier — the same staple test the scarcity
 * arc uses (`economicPower.ts` § 3).
 *
 * The settlement economy's `starveDays` is deliberately not reused: it resets when a
 * person is lost, which would saw-tooth the hunger term.
 */
import type { GraphNode } from '../../types/graph';
import { readResources } from '../resourceEconomy';
import { getResourceClass } from '../../data/resource-classes';

export type HungerSource = 'settlement_economy' | 'stock_tier';

export interface HungerReading {
  readonly hungry: boolean;
  readonly source: HungerSource;
}

/** The first staple in the town's bag at the scarce tier, or undefined. */
export function scarceStapleOf(settlement: GraphNode): string | undefined {
  return Object.entries(readResources(settlement.properties)).find(
    ([rid, r]) => r.stockTier === 'scarce' && getResourceClass(rid).category === 'staple',
  )?.[0];
}

export function isHungryToday(settlement: GraphNode): HungerReading {
  const props = settlement.properties ?? {};
  if (typeof props.foodStore === 'number') {
    const balance = typeof props.foodBalance === 'number' ? props.foodBalance : 0;
    return { hungry: props.foodStore <= 0 && balance < 0, source: 'settlement_economy' };
  }
  return { hungry: scarceStapleOf(settlement) !== undefined, source: 'stock_tier' };
}
