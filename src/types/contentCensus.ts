import type { ActionScale } from './unifiedAction';  // cosmic|regional|local|personal

/**
 * Additive, entry-level coverage classification read by the Content Census
 * (THR-473 instrument / THR-474 backfill). Metadata only — no runtime behaviour.
 *
 * **The `reach` half was retired by THR-1486**, and the *scale* half deliberately was
 * not. Reach is now carried on the tag axis (`#iron` … `#star` in
 * `src/data/content-tags.ts`), which is where THR-477's derive-vs-persist question
 * closes: authored, never derived. The census adapters read it from there, and
 * `dominantReachFromEffects` — which produced a plausible reach that disagreed with the
 * author's own tag on roughly one entry in ten — is deleted.
 *
 * **Why `scale` survives when the plan said to retire the whole field.** THR-1481's plan
 * calls `censusTag` "metadata nothing reads". Measured at migration time that is true of
 * the reach half and false of the scale half: 132 of the 193 authored literals carried
 * `scale` and nothing else, `contentCensus/matrix.ts` reads it, and no other field in the
 * corpus carries an entry-level scale. Retiring it would have taken the census's scale
 * coverage from 193 entries to zero — destroying THR-474's backfill to tidy a field
 * rather than replacing it. It stays until something replaces it; the tag vocabulary has
 * no scale axis and was not asked for one.
 */
export interface ContentCensusTag {
  scale?: ActionScale;
}
