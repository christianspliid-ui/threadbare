export type ClearanceGateState =
  | 'pending'
  | 'cleared'
  | 'flagged'
  | 'exposed'
  | 'compromised'
  | 'unresolved';

export type ClearanceGateOutcome =
  | 'critical_success'
  | 'success'
  | 'success_at_cost'
  | 'failure'
  | 'critical_failure';

export type ClearanceSignalVisibility = 'known' | 'hidden' | 'revealed';

export interface ClearanceSignalConfig {
  readonly key: string;
  readonly label: string;
  readonly visibility: ClearanceSignalVisibility;
  readonly tags?: readonly string[];
}

export interface ClearanceGateTransitionRule {
  readonly stepIndex: number;
  readonly outcomes: readonly ClearanceGateOutcome[];
  readonly revealSignals?: readonly string[];
  readonly nextState?: ClearanceGateState;
  readonly addFollowOnTags?: readonly string[];
  readonly note?: string;
}

export interface ClearanceGateConfig {
  readonly id: string;
  readonly subjectBindingKey: string;
  readonly authorityBindingKey: string;
  readonly witnessBindingKeys?: readonly string[];
  readonly locationBindingKey?: string;
  readonly initialState?: ClearanceGateState;
  readonly signals: readonly ClearanceSignalConfig[];
  readonly transitions?: readonly ClearanceGateTransitionRule[];
  readonly persistence: 'scene-only' | 'must-persist';
  readonly followOnTags?: readonly string[];
}

export interface ClearanceGateTransitionRecord {
  readonly tick: number;
  readonly stepIndex: number;
  readonly outcome: ClearanceGateOutcome;
  readonly previousState: ClearanceGateState;
  readonly nextState: ClearanceGateState;
  readonly revealedSignals: readonly string[];
  readonly addedFollowOnTags: readonly string[];
  readonly note?: string;
}

export interface ClearanceGateRuntimeState {
  readonly runtimeId: string;
  readonly templateId: string;
  readonly gateId: string;
  readonly anchorLocationId: string;
  readonly subjectNodeId: string;
  readonly authorityNodeId: string;
  readonly witnessNodeIds: readonly string[];
  readonly locationNodeId?: string;
  readonly persistence: 'scene-only' | 'must-persist';
  readonly state: ClearanceGateState;
  readonly revealedSignalKeys: readonly string[];
  readonly followOnTags: readonly string[];
  readonly attempts: number;
  readonly lastUpdatedTick: number;
  readonly history: readonly ClearanceGateTransitionRecord[];
}
