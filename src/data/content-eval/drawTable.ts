/**
 * `drawFromTable` — the Encounter Factory's seeded weighted draw. THR-1145.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § The
 * Consequence Draw.
 *
 * **What this is for.** The factory's variety problem has one shape and several
 * instances: left to themselves, authors reach for the same handful of options
 * every time, and the corpus converges. A draw table fixes that by *rolling*
 * the option set at brief time — the author still writes the encounter, but does
 * not choose which primitives it must find room for.
 *
 * **Deliberately generic.** The consequence draw (THR-1145) is the first table;
 * the plot-hook table (THR-1147) is commissioned and reuses this verbatim, and
 * the plan names three more (cast draw, complication draw, premise draw). So the
 * utility knows nothing about consequences — it takes a weight record and a seed
 * key and returns a hand. A second hand-rolled sampler is the drift this exists
 * to prevent.
 *
 * **Pure and authoring-time.** No graph, no fs, no runtime. Nothing under
 * `src/engine/**` imports it, exactly as with the rest of `content-eval/`.
 */

import { mulberry32 } from '../../lib/prng';

// ─── Constants (NFP #1) ──────────────────────────────────────────────

/**
 * Weights at or below this are ineligible — the key is not in the table for
 * this context at all.
 *
 * Zero rather than one, because "cannot appear here" and "rarely appears here"
 * are different statements and a table should be able to make both. The
 * consequence table happens to floor every cell at 1 (its whole point is that
 * anything can surface anywhere), but that is that table's policy, not this
 * utility's.
 */
export const DRAW_TABLE_MIN_ELIGIBLE_WEIGHT = 0;

// ─── Seeding ─────────────────────────────────────────────────────────

/**
 * FNV-1a over the seed string, to a 32-bit integer.
 *
 * Local rather than imported: `src/lib/prng.ts` is the shared home for the
 * *generator* (RC-218 — do not duplicate `mulberry32`), but carries no string
 * hash, and the two existing copies in the tree both live under `src/engine/**`,
 * which this module may not import. Six lines duplicated beats an import that
 * inverts the layering.
 *
 * The exact function is not load-bearing — only that it is stable, which is what
 * makes a recorded draw recomputable and therefore tamper-evident.
 */
function hashSeedKey(seedKey: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seedKey.length; i++) {
    hash ^= seedKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ─── The draw ────────────────────────────────────────────────────────

/**
 * Draw `n` keys from a weighted table, without replacement, deterministically.
 *
 * **Without replacement** because a hand of two is meant to be two *different*
 * things to find room for; drawing `possession` twice would read as a bug and
 * halve the variety the table exists to produce.
 *
 * **Deterministic in the strong sense**: same `(tableId, weights, seedKey, n)`
 * always yields the same hand, *and* the hand does not depend on the insertion
 * order of the `weights` object. Keys are sorted before sampling for exactly
 * that reason — an object-literal reorder is a refactor, and a refactor that
 * silently re-rolls every recorded draw in the corpus would turn the gate into
 * a tripwire on formatting (NFP #3).
 *
 * `tableId` is mixed into the seed so two tables drawn for the same subject —
 * a consequence hand and a plot hook for one template id — are independent
 * rather than correlated.
 *
 * Never throws (NFP #4): asking for more keys than the table has eligible
 * entries returns everything eligible, which is the honest answer and lets a
 * caller notice by comparing lengths rather than by catching.
 *
 * @param tableId  Stable identifier for the table itself, e.g. `'consequence'`.
 * @param weights  Key → relative weight. Keys at or below
 *                 {@link DRAW_TABLE_MIN_ELIGIBLE_WEIGHT} are excluded.
 * @param seedKey  What the draw is *for* — a template id, for the factory.
 * @param n        Hand size.
 * @returns The drawn keys in draw order.
 */
export function drawFromTable<K extends string>(
  tableId: string,
  weights: Readonly<Partial<Record<K, number>>>,
  seedKey: string,
  n: number,
): readonly K[] {
  if (n <= 0) return [];

  const pool: { key: K; weight: number }[] = (Object.keys(weights) as K[])
    .sort()
    .map(key => ({ key, weight: weights[key] ?? 0 }))
    .filter(entry => entry.weight > DRAW_TABLE_MIN_ELIGIBLE_WEIGHT);

  const rng = mulberry32(hashSeedKey(`${tableId}:${seedKey}`));
  const drawn: K[] = [];

  while (drawn.length < n && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        index = i;
        break;
      }
    }
    drawn.push(pool[index].key);
    pool.splice(index, 1);
  }

  return drawn;
}
