import type { ReachDomain } from './traits';        // 8 reaches: iron|gold|shadow|veil|heart|eye|stone|star
import type { ActionScale } from './unifiedAction';  // cosmic|regional|local|personal

/**
 * Additive, entry-level coverage classification read by the Content Census
 * (THR-473 instrument / THR-474 backfill). Metadata only — no runtime behaviour.
 * Both axes optional: an entry may carry an authored `scale` before its `reach`
 * is settled, or vice-versa.
 */
export interface ContentCensusTag {
  reach?: ReachDomain;
  scale?: ActionScale;
}
