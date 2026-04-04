import type {
  ClearanceGateConfig,
  ClearanceGateOutcome,
  ClearanceGateRuntimeState,
  ClearanceGateState,
  ClearanceGateTransitionRecord,
} from '../types/contentShells';
import type { EncounterSupportBinding } from '../types/encounter';
import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';

function makeRuntimeId(templateId: string, anchorLocationId: string, gateId: string): string {
  return `clearance_gate_${templateId}_${anchorLocationId}_${gateId}`;
}

function getSupportBindingMap(
  bindings: readonly EncounterSupportBinding[],
): Map<string, EncounterSupportBinding> {
  return new Map(bindings.map(binding => [binding.key, binding]));
}

function resolveKnownSignals(config: ClearanceGateConfig): readonly string[] {
  return config.signals
    .filter(signal => signal.visibility === 'known' || signal.visibility === 'revealed')
    .map(signal => signal.key);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function findLastDefined<T, TValue>(
  values: readonly T[],
  pick: (value: T) => TValue | undefined,
): TValue | undefined {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const candidate = pick(values[i]);
    if (candidate !== undefined) return candidate;
  }
  return undefined;
}

export function initializeClearanceGates(
  existingStates: ReadonlyMap<string, ClearanceGateRuntimeState> | undefined,
  template: UnifiedActionTemplate,
  bindings: readonly EncounterSupportBinding[],
  anchorLocationId: string,
  tick: number,
): { gateIds: readonly string[]; clearanceGateStates: Map<string, ClearanceGateRuntimeState> } {
  const nextStates = new Map(existingStates ?? []);
  if (!template.clearanceGates || template.clearanceGates.length === 0) {
    return { gateIds: [], clearanceGateStates: nextStates };
  }

  const bindingMap = getSupportBindingMap(bindings);
  const gateIds: string[] = [];

  for (const config of template.clearanceGates) {
    const subjectBinding = bindingMap.get(config.subjectBindingKey);
    const authorityBinding = bindingMap.get(config.authorityBindingKey);
    if (!subjectBinding || !authorityBinding) continue;

    const runtimeId = makeRuntimeId(template.id, anchorLocationId, config.id);
    gateIds.push(runtimeId);
    if (nextStates.has(runtimeId)) continue;

    const witnessNodeIds = (config.witnessBindingKeys ?? [])
      .map(key => bindingMap.get(key)?.nodeId)
      .filter((nodeId): nodeId is string => nodeId != null);

    const runtimeState: ClearanceGateRuntimeState = {
      runtimeId,
      templateId: template.id,
      gateId: config.id,
      anchorLocationId,
      subjectNodeId: subjectBinding.nodeId,
      authorityNodeId: authorityBinding.nodeId,
      witnessNodeIds,
      locationNodeId: config.locationBindingKey ? bindingMap.get(config.locationBindingKey)?.nodeId : undefined,
      persistence: config.persistence,
      state: config.initialState ?? 'pending',
      revealedSignalKeys: resolveKnownSignals(config),
      followOnTags: config.followOnTags ?? [],
      attempts: 0,
      lastUpdatedTick: tick,
      history: [],
    };
    nextStates.set(runtimeId, runtimeState);
  }

  return { gateIds, clearanceGateStates: nextStates };
}

function matchesOutcome(
  outcomes: readonly ClearanceGateOutcome[],
  outcome: ClearanceGateOutcome,
): boolean {
  return outcomes.includes(outcome);
}

export function applyClearanceGateStepOutcome(
  existingStates: ReadonlyMap<string, ClearanceGateRuntimeState> | undefined,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  outcome: ClearanceGateOutcome,
  tick: number,
): {
  clearanceGateStates: Map<string, ClearanceGateRuntimeState>;
  updates: readonly ClearanceGateTransitionRecord[];
} {
  const nextStates = new Map(existingStates ?? []);
  if (!template.clearanceGates || template.clearanceGates.length === 0 || !action.clearanceGateIds?.length) {
    return { clearanceGateStates: nextStates, updates: [] };
  }

  const configById = new Map(template.clearanceGates.map(config => [config.id, config]));
  const updates: ClearanceGateTransitionRecord[] = [];

  for (const runtimeId of action.clearanceGateIds) {
    const current = nextStates.get(runtimeId);
    if (!current) continue;

    const config = configById.get(current.gateId);
    if (!config?.transitions?.length) continue;

    const matched = config.transitions.filter(rule =>
      rule.stepIndex === action.currentStep && matchesOutcome(rule.outcomes, outcome),
    );
    if (matched.length === 0) continue;

    const revealedSignals = unique([
      ...current.revealedSignalKeys,
      ...matched.flatMap(rule => rule.revealSignals ?? []),
    ]);
    const addedFollowOnTags = unique(matched.flatMap(rule => rule.addFollowOnTags ?? []));
    const followOnTags = unique([
      ...current.followOnTags,
      ...addedFollowOnTags,
    ]);
    const nextState = findLastDefined(matched, rule => rule.nextState) ?? current.state;
    const note = findLastDefined(matched, rule => rule.note);

    const transition: ClearanceGateTransitionRecord = {
      tick,
      stepIndex: action.currentStep,
      outcome,
      previousState: current.state,
      nextState,
      revealedSignals: revealedSignals.filter(key => !current.revealedSignalKeys.includes(key)),
      addedFollowOnTags: addedFollowOnTags.filter(tag => !current.followOnTags.includes(tag)),
      note,
    };

    nextStates.set(runtimeId, {
      ...current,
      state: nextState,
      revealedSignalKeys: revealedSignals,
      followOnTags,
      attempts: current.attempts + 1,
      lastUpdatedTick: tick,
      history: [...current.history, transition],
    });
    updates.push(transition);
  }

  return {
    clearanceGateStates: nextStates,
    updates,
  };
}

export function summarizeClearanceGateUpdates(
  updates: readonly ClearanceGateTransitionRecord[],
): string {
  if (updates.length === 0) return '';

  const parts: string[] = [];
  for (const update of updates) {
    if (update.revealedSignals.length > 0) {
      parts.push(`${update.revealedSignals.join(', ')} revealed`);
    }
    if (update.previousState !== update.nextState) {
      parts.push(`clearance ${update.nextState}`);
    }
  }

  if (parts.length === 0) return '';
  return ` — ${parts.join(', ')}`;
}

export function getClearanceGateState(
  states: ReadonlyMap<string, ClearanceGateRuntimeState> | undefined,
  runtimeId: string,
): ClearanceGateRuntimeState | undefined {
  return states?.get(runtimeId);
}
