import type { MutationSet, NodeClass } from './schema';
import {
  getNodeClass,
  type StatedAttribute,
  type WorldNode,
  withNodeClass,
} from './worldTypes';

export interface MutationContext {
  recipeId: string;
  firedAt: string;
  respectsPromoted?: boolean;
  ownsThreads?: string[];
  overrideTripwire?: boolean;
  overrideRationale?: string;
}

export interface StatedAttributeInput {
  field: string;
  value: unknown;
}

export interface NodeMutation extends MutationSet {
  setNodeClass?: NodeClass;
  setProps?: Record<string, unknown>;
  statedAttributes?: StatedAttributeInput[];
}

export interface GateDecisionOk {
  ok: true;
}

export interface GateDecisionFail {
  ok: false;
  reason: 'class-violation';
  nodeClass: NodeClass;
  recipeFlags: MutationContext;
}

export type GateDecision = GateDecisionOk | GateDecisionFail;

export interface TripwireConflict {
  field: string;
  previousValue: unknown;
  previousSource: StatedAttribute['source'];
  proposedValue: unknown;
}

export interface TripwireDecisionOk {
  ok: true;
  conflicts: TripwireConflict[];
}

export interface TripwireDecisionFail {
  ok: false;
  reason: 'stated-attribute-conflict';
  conflicts: TripwireConflict[];
}

export type TripwireDecision = TripwireDecisionOk | TripwireDecisionFail;

export interface MutationResultOk {
  ok: true;
  node: WorldNode;
  gateDecision: GateDecisionOk;
  tripwireDecision: TripwireDecisionOk;
}

export interface MutationResultFail {
  ok: false;
  gateDecision: GateDecision;
  tripwireDecision?: TripwireDecision;
  errors: string[];
  conflicts?: TripwireConflict[];
}

export type MutationResult = MutationResultOk | MutationResultFail;

export interface PromoteIfGenericArgs {
  recipeId: string;
  surfacedAt: string;
  reason: string;
  statedAttributes?: StatedAttributeInput[];
}

export interface PromoteIfGenericResult {
  node: WorldNode;
  promoted: boolean;
}

const NODE_CLASS_ORDER: Record<NodeClass, number> = {
  generic: 0,
  promoted: 1,
  threaded: 2,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    return left.every((value, index) => deepEqual(value, right[index]));
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    return leftKeys.every((key) => rightKeys.includes(key) && deepEqual(left[key], right[key]));
  }

  return false;
}

function isAdditiveCollectionChange(previousValue: unknown, proposedValue: unknown): boolean {
  if (!Array.isArray(previousValue) || !Array.isArray(proposedValue)) {
    return false;
  }
  if (proposedValue.length < previousValue.length) {
    return false;
  }
  return previousValue.every((item) => proposedValue.some((candidate) => deepEqual(candidate, item)));
}

function upsertStatedAttribute(
  existing: StatedAttribute[],
  input: StatedAttributeInput,
  source: StatedAttribute['source']
): StatedAttribute[] {
  const next = [...existing];
  const index = next.findIndex((entry) => entry.field === input.field);

  if (index < 0) {
    next.push({
      field: input.field,
      value: input.value,
      source,
    });
    return next;
  }

  if (deepEqual(next[index].value, input.value)) {
    return next;
  }

  next[index] = {
    field: input.field,
    value: input.value,
    source,
  };
  return next;
}

function deriveFieldWrites(node: WorldNode, mutation: NodeMutation): Record<string, unknown> {
  const writes: Record<string, unknown> = {};

  if (mutation.rename !== undefined) {
    writes.name = mutation.rename;
  }

  const nodeClassWrite = mutation.setNodeClass ?? mutation.promoteClass;
  if (nodeClassWrite !== undefined) {
    writes.nodeClass = nodeClassWrite;
  }

  if (mutation.setProps) {
    for (const [field, value] of Object.entries(mutation.setProps)) {
      writes[field] = value;
      writes[`props.${field}`] = value;
    }
  }

  if (mutation.statedAttributes) {
    for (const attribute of mutation.statedAttributes) {
      const currentValue =
        writes[attribute.field] ??
        (attribute.field === 'name' ? mutation.rename ?? node.name : undefined) ??
        node.props?.[attribute.field];
      writes[attribute.field] = currentValue ?? attribute.value;
    }
  }

  return writes;
}

function validateNodeClassTransition(currentClass: NodeClass, targetClass: NodeClass): string | undefined {
  if (currentClass === targetClass) {
    return undefined;
  }

  if (NODE_CLASS_ORDER[targetClass] < NODE_CLASS_ORDER[currentClass]) {
    return `Node-class demotion is not allowed (${currentClass} -> ${targetClass}).`;
  }

  if (currentClass === 'generic' && targetClass === 'threaded') {
    return 'Cannot promote generic node directly to threaded; promote to promoted first.';
  }

  return undefined;
}

export function evaluateMutabilityGate(node: WorldNode, context: MutationContext): GateDecision {
  const nodeClass = getNodeClass(node);
  if (nodeClass === 'generic') {
    return { ok: true };
  }

  if (nodeClass === 'promoted') {
    if (context.respectsPromoted === true) {
      return { ok: true };
    }
    return {
      ok: false,
      reason: 'class-violation',
      nodeClass,
      recipeFlags: context,
    };
  }

  const ownsThreads = new Set(context.ownsThreads ?? []);
  if (ownsThreads.has(node.id)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: 'class-violation',
    nodeClass,
    recipeFlags: context,
  };
}

export function checkTripwire(
  node: WorldNode,
  fieldWrites: Record<string, unknown>,
  context: MutationContext
): TripwireDecision {
  const statedAttributes = node.statedAttributes ?? [];
  if (statedAttributes.length === 0) {
    return { ok: true, conflicts: [] };
  }

  const conflicts: TripwireConflict[] = [];
  for (const stated of statedAttributes) {
    if (!Object.prototype.hasOwnProperty.call(fieldWrites, stated.field)) {
      continue;
    }

    const proposedValue = fieldWrites[stated.field];
    if (deepEqual(stated.value, proposedValue) || isAdditiveCollectionChange(stated.value, proposedValue)) {
      continue;
    }

    conflicts.push({
      field: stated.field,
      previousValue: stated.value,
      previousSource: stated.source,
      proposedValue,
    });
  }

  if (conflicts.length === 0) {
    return { ok: true, conflicts: [] };
  }

  if (context.overrideTripwire === true && context.overrideRationale && context.overrideRationale.trim().length > 0) {
    return { ok: true, conflicts: [] };
  }

  return {
    ok: false,
    reason: 'stated-attribute-conflict',
    conflicts,
  };
}

export function mutateNode(node: WorldNode, mutation: NodeMutation, context: MutationContext): MutationResult {
  const gateDecision = evaluateMutabilityGate(node, context);
  if (!gateDecision.ok) {
    const recipeId = context.recipeId || '(unknown-recipe)';
    return {
      ok: false,
      gateDecision,
      errors: [
        `Mutability gate blocked mutation for ${node.id} (${gateDecision.nodeClass}) from ${recipeId}.`,
      ],
    };
  }

  const currentClass = getNodeClass(node);
  const targetClass = mutation.setNodeClass ?? mutation.promoteClass ?? currentClass;
  const transitionError = validateNodeClassTransition(currentClass, targetClass);
  if (transitionError) {
    return {
      ok: false,
      gateDecision,
      errors: [transitionError],
    };
  }

  const fieldWrites = deriveFieldWrites(node, mutation);
  const tripwireDecision = checkTripwire(node, fieldWrites, context);
  if (!tripwireDecision.ok) {
    return {
      ok: false,
      gateDecision,
      tripwireDecision,
      conflicts: tripwireDecision.conflicts,
      errors: tripwireDecision.conflicts.map((conflict) => {
        return (
          `Tripwire conflict on ${node.id}.${conflict.field}: ` +
          `existing=${JSON.stringify(conflict.previousValue)} ` +
          `(from ${conflict.previousSource.recipeId} @ ${conflict.previousSource.firedAt}), ` +
          `proposed=${JSON.stringify(conflict.proposedValue)}`
        );
      }),
    };
  }

  let nextNode: WorldNode = node;
  if (mutation.rename !== undefined) {
    nextNode = {
      ...nextNode,
      name: mutation.rename,
    };
  }

  if (mutation.setProps) {
    nextNode = {
      ...nextNode,
      props: {
        ...(nextNode.props ?? {}),
        ...mutation.setProps,
      },
    };
  }

  if (targetClass !== currentClass) {
    nextNode = withNodeClass(nextNode, targetClass);
  }

  if (mutation.addEdges && mutation.addEdges.length > 0) {
    const existing = nextNode.edges ?? [];
    const additions = mutation.addEdges.map((edge) => ({
      type: edge.edgeType,
      to: edge.toNodeKey,
    }));
    nextNode = {
      ...nextNode,
      edges: [...existing, ...additions],
    };
  }

  const source = {
    recipeId: context.recipeId,
    firedAt: context.firedAt,
  };
  let statedAttributes = nextNode.statedAttributes ?? [];
  if (mutation.statedAttributes) {
    for (const attribute of mutation.statedAttributes) {
      if (!attribute.field || attribute.field.trim().length === 0) {
        continue;
      }
      statedAttributes = upsertStatedAttribute(statedAttributes, attribute, source);
    }
  }

  if (statedAttributes.length !== (nextNode.statedAttributes ?? []).length) {
    nextNode = {
      ...nextNode,
      statedAttributes,
    };
  } else if (mutation.statedAttributes && mutation.statedAttributes.length > 0) {
    nextNode = {
      ...nextNode,
      statedAttributes,
    };
  }

  return {
    ok: true,
    node: nextNode,
    gateDecision,
    tripwireDecision,
  };
}

export function promoteIfGeneric(node: WorldNode, args: PromoteIfGenericArgs): PromoteIfGenericResult {
  if (getNodeClass(node) !== 'generic') {
    return { node, promoted: false };
  }

  const promotedAttributes: StatedAttributeInput[] = [...(args.statedAttributes ?? [])];
  if (node.name && !promotedAttributes.some((attribute) => attribute.field === 'name')) {
    promotedAttributes.push({
      field: 'name',
      value: node.name,
    });
  }

  const promotionResult = mutateNode(
    node,
    {
      setNodeClass: 'promoted',
      statedAttributes: promotedAttributes,
    },
    {
      recipeId: args.recipeId,
      firedAt: args.surfacedAt,
      respectsPromoted: false,
      ownsThreads: [],
    }
  );

  if (!promotionResult.ok) {
    return { node, promoted: false };
  }

  return {
    node: promotionResult.node,
    promoted: true,
  };
}
