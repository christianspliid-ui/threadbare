/**
 * Item generator traces (THR-1570, plan doc
 * `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Tracing).
 *
 * Registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`, `TraceEntry`).
 */

import type { TraceBase } from '../trace';

/** A generated item was minted. `seedKey` reproduces it exactly. */
export interface ItemGeneratedTrace extends TraceBase {
  category: 'item.generated';
  itemId: string;
  name: string;
  origin: 'masterwork' | 'found';
  coreId: string;
  signatureId: string;
  band: 2 | 3 | 4;
  seedKey: string;
  makerId: string | null;
  placeId: string | null;
  sphere: string;
  reach: string;
  effectCount: number;
  catchCount: number;
  /** 0 in a healthy world. */
  rerolls: number;
  storiedLevel: number;
}

/** The generator gave up; the mint wrote the plain masterwork. */
export interface ItemGenerateFallbackTrace extends TraceBase {
  category: 'item.generate_fallback';
  makerId: string;
  seedKey: string;
  reason: 'no_eligible_core' | 'validator_exhausted' | 'world_context_missing' | 'threw';
  /** The validator's words on the final attempt. */
  lastProblems: string[];
}
