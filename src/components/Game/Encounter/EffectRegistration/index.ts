/**
 * Phase D2 — EffectRegistration components (THR-335).
 *
 * One component per aftermath effect-kind landing animation. Each is a
 * presentational React component that takes effect-specific data + the
 * common `EffectLandingCommonProps` (delay, suppressPulseRing, onEffectLand,
 * skipAnimation). Sequencing — lane assignments, delay computation,
 * pulse-ring suppression, second-breath gate — lives in
 * `src/hooks/useEffectSequencing.ts`.
 *
 * Plan doc: Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase D2
 * Spec: Docs/plans/2026-05-04-encounter-ui-canonical.md §4
 */

export { IntelligenceLanding } from './IntelligenceLanding';
export type {
  IntelligenceLandingData,
  IntelligenceLandingProps,
} from './IntelligenceLanding';

export { ConditionAttachmentLanding } from './ConditionAttachmentLanding';
export type {
  ConditionAttachmentLandingData,
  ConditionAttachmentLandingProps,
} from './ConditionAttachmentLanding';

export { ReputationTallyLanding } from './ReputationTallyLanding';
export type {
  ReputationTallyLandingData,
  ReputationTallyLandingProps,
} from './ReputationTallyLanding';

export { ReputationScoreLanding } from './ReputationScoreLanding';
export type {
  ReputationScoreLandingData,
  ReputationScoreLandingProps,
} from './ReputationScoreLanding';

export { EncounterSeedLanding } from './EncounterSeedLanding';
export type {
  EncounterSeedLandingData,
  EncounterSeedLandingProps,
} from './EncounterSeedLanding';

export { HiddenMarkLanding } from './HiddenMarkLanding';
export type {
  HiddenMarkLandingData,
  HiddenMarkLandingProps,
} from './HiddenMarkLanding';

export { RecentEventLanding } from './RecentEventLanding';
export type {
  RecentEventLandingData,
  RecentEventLandingProps,
} from './RecentEventLanding';

export { SpawnArtifactLanding } from './SpawnArtifactLanding';
export type {
  SpawnArtifactLandingData,
  SpawnArtifactLandingProps,
} from './SpawnArtifactLanding';

export { FactionLanding } from './FactionLanding';
export type {
  FactionLandingData,
  FactionLandingProps,
} from './FactionLanding';

export { ArchetypeDriftLanding } from './ArchetypeDriftLanding';
export type {
  ArchetypeDriftLandingData,
  ArchetypeDriftLandingProps,
} from './ArchetypeDriftLanding';

export type {
  EffectLandingCommonProps,
  EffectSphere,
  LandingPhase,
} from './_shared';
