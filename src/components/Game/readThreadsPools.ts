/**
 * THR-2142 — the pools Read the Threads charges, and the line that shows them.
 *
 * The read used to show "Available" as the sum of all twelve spheres and to drain
 * them in turn, the four Foundation pools the essence bar keeps folded among them,
 * so the figure matched nothing the player could see (round-6 cold playtest). It now
 * charges the god's primary pool, then its secondary, and shows those two.
 */
import type { SphereName } from '../../types';
import { formatEssencePool } from '../shared/formatEssence';

export interface PayingPool {
  sphere: SphereName;
  amount: number;
}

/** The pools a read is paid from, in charge order: primary, then secondary (once, when distinct). */
export function readThreadsPayingPools(
  pool: Partial<Record<SphereName, number>>,
  primary: SphereName,
  secondary: SphereName,
): PayingPool[] {
  const spheres = primary === secondary ? [primary] : [primary, secondary];
  return spheres.map(sphere => ({ sphere, amount: Math.max(0, pool[sphere] ?? 0) }));
}

/** The essence a read can draw on: the paying pools together. */
export function readThreadsAvailable(pools: readonly PayingPool[]): number {
  return pools.reduce((sum, p) => sum + p.amount, 0);
}

/**
 * The pool after a read of `cost`: drawn from the primary first, then the secondary.
 * Never draws a pool below zero or touches any other sphere.
 */
export function chargeReadThreads<P extends Partial<Record<SphereName, number>>>(
  pool: P,
  primary: SphereName,
  secondary: SphereName,
  cost: number,
): P {
  const next = { ...pool };
  let remaining = cost;
  for (const { sphere, amount } of readThreadsPayingPools(pool, primary, secondary)) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, amount);
    (next as Record<SphereName, number>)[sphere] = amount - deduct;
    remaining -= deduct;
  }
  return next;
}

/** "Energy 120 · Iron 80" — the paying pools by name, in charge order. */
export function readThreadsPoolsLine(pools: readonly PayingPool[]): string {
  return pools
    .map(p => `${p.sphere.charAt(0).toUpperCase()}${p.sphere.slice(1)} ${formatEssencePool(p.amount)}`)
    .join(' · ');
}
