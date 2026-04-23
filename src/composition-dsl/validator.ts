import { z } from 'zod';

import type {
  Composition,
  FilterQuery,
  NodeClass,
  NodeSpec,
  PreconditionStrength,
  ResolveStrategy,
  TagAxis,
  Tier,
  WorldPredicate,
} from './schema';
import { promoteIfGeneric } from './mutationGate';
import type { FindCardLog } from './findCard';
import { resolveFindCard } from './findCard';
import { parseComposition } from './schema';
import { getNodeClass, type WorldEdge, type WorldNode, type WorldSnapshot } from './worldTypes';
export type WorldState = WorldSnapshot;

const worldEdgeSchema = z.object({
  type: z.string().trim().min(1),
  to: z.string().trim().min(1),
});

const worldNodeSchema: z.ZodType<WorldNode> = z.object({
  id: z.string().trim().min(1),
  kind: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  nodeClass: z.enum(['generic', 'promoted', 'threaded']).optional(),
  class: z.enum(['generic', 'promoted', 'threaded']).optional(),
  tags: z
    .object({
      archetype: z.array(z.string().trim().min(1)).optional(),
      reach: z.array(z.string().trim().min(1)).optional(),
      sphere: z.array(z.string().trim().min(1)).optional(),
    })
    .optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  edges: z.array(worldEdgeSchema).optional(),
  statedAttributes: z
    .array(
      z.object({
        field: z.string().trim().min(1),
        value: z.unknown(),
        source: z.object({
          recipeId: z.string().trim().min(1),
          firedAt: z.string().trim().min(1),
        }),
      })
    )
    .optional(),
});

export const worldStateSchema: z.ZodType<WorldState> = z.object({
  nodes: z.array(worldNodeSchema),
  worldFlags: z.record(z.string(), z.unknown()).optional(),
  doomClockTier: z.number().int().optional(),
  firedCompositions: z.array(z.string().trim().min(1)).optional(),
});

type PreconditionStatus = 'passed' | 'blocked' | 'missing-support' | 'degraded';
type NodeResolutionStatus = 'resolved' | 'would-create' | 'dropped' | 'error';

export interface PreconditionResult {
  index: number;
  strength: PreconditionStrength;
  passed: boolean;
  status: PreconditionStatus;
  message: string;
  rationale?: string;
}

export interface MutationPreview {
  nodeId: string;
  rename?: string;
  promoteClass?: 'promoted' | 'threaded';
  setNodeClass?: NodeClass;
  addEdges?: Array<{ edgeType: string; toNodeKey: string }>;
  setProps?: Record<string, unknown>;
  statedAttributes?: Array<{ field: string; value: unknown }>;
  resultingClass?: NodeClass;
}

export interface CreationPreview {
  nodeKey: string;
  kind: string;
  tags: {
    archetype?: string[];
    reach?: string[];
    sphere?: string[];
  };
  initialEdges?: Array<{ edgeType: string; toNodeKey: string }>;
  proceduralFill: boolean;
  source:
    | 'procedural'
    | 'find-rename-create-fallback'
    | 'find-rename-create-rejected-fallback'
    | 'missing-literal'
    | 'missing-find-create-disabled';
  createdId?: string;
  inheritedRecipeTags?: string[];
}

export interface NodeResolutionResult {
  nodeKey: string;
  tier: Tier;
  strategy: ResolveStrategy['type'];
  status: NodeResolutionStatus;
  message: string;
  matchedNodeId?: string;
  matchedCandidateIds?: string[];
  creationPreview?: CreationPreview;
  mutationPreview?: MutationPreview;
}

export interface CompositionValidationReport {
  compositionId: string;
  willFire: boolean;
  preconditions: PreconditionResult[];
  nodes: Record<string, NodeResolutionResult>;
  renderPromotions: RenderPromotion[];
  creations: CreationPreview[];
  mutations: MutationPreview[];
  findCardLogs: FindCardLog[];
  errors: string[];
  warnings: string[];
}

export interface RenderPromotion {
  nodeId: string;
  fromClass: NodeClass;
  toClass: 'promoted';
  reason: string;
}

interface EvaluationContext {
  world: WorldState;
  nodeById: Map<string, WorldNode>;
  findFilterCache: Map<string, boolean>;
}

function getTagValues(node: WorldNode, axis: TagAxis): string[] {
  return node.tags?.[axis] ?? [];
}

function hasTag(node: WorldNode, axis: TagAxis, value: string): boolean {
  return getTagValues(node, axis).includes(value);
}

function hasAnyTag(node: WorldNode, axis: TagAxis, values: string[]): boolean {
  const nodeValues = getTagValues(node, axis);
  return values.some((value) => nodeValues.includes(value));
}

function worldNodesByKindAndArchetype(world: WorldState, kind: string, archetype: string): WorldNode[] {
  return world.nodes.filter((node) => node.kind === kind && hasTag(node, 'archetype', archetype));
}

function compareWithBounds(value: number, gte?: number, lte?: number): boolean {
  if (gte !== undefined && value < gte) {
    return false;
  }
  if (lte !== undefined && value > lte) {
    return false;
  }
  return true;
}

function evaluateFilterQuery(query: FilterQuery, node: WorldNode, ctx: EvaluationContext): boolean {
  switch (query.op) {
    case 'and':
      return query.terms.every((term) => evaluateFilterQuery(term, node, ctx));
    case 'or':
      return query.terms.some((term) => evaluateFilterQuery(term, node, ctx));
    case 'not':
      return !evaluateFilterQuery(query.term, node, ctx);
    case 'has-tag':
      return hasTag(node, query.axis, query.value);
    case 'has-any-tag':
      return hasAnyTag(node, query.axis, query.values);
    case 'node-class':
      return getNodeClass(node) === query.class;
    case 'has-edge':
      return (node.edges ?? []).some((edge) => {
        if (edge.type !== query.edgeType) {
          return false;
        }
        if (!query.toFilter) {
          return true;
        }
        const target = ctx.nodeById.get(edge.to);
        return target ? evaluateFilterQuery(query.toFilter, target, ctx) : false;
      });
    case 'prop-equals':
      return node.props?.[query.prop] === query.value;
    default:
      return false;
  }
}

function evaluatePredicate(predicate: WorldPredicate, ctx: EvaluationContext): { passed: boolean; message: string } {
  switch (predicate.op) {
    case 'and': {
      const failedIndex = predicate.terms.findIndex((term) => !evaluatePredicate(term, ctx).passed);
      if (failedIndex >= 0) {
        return {
          passed: false,
          message: `AND predicate failed at term index ${failedIndex}.`,
        };
      }
      return { passed: true, message: 'All AND terms passed.' };
    }
    case 'or': {
      const passedIndex = predicate.terms.findIndex((term) => evaluatePredicate(term, ctx).passed);
      if (passedIndex >= 0) {
        return {
          passed: true,
          message: `OR predicate passed at term index ${passedIndex}.`,
        };
      }
      return { passed: false, message: 'No OR terms passed.' };
    }
    case 'not': {
      const result = evaluatePredicate(predicate.term, ctx);
      return {
        passed: !result.passed,
        message: `NOT predicate inverted result: ${result.passed ? 'false' : 'true'}.`,
      };
    }
    case 'has-faction-of-archetype': {
      const matches = worldNodesByKindAndArchetype(ctx.world, 'faction', predicate.archetype);
      const count = matches.length;
      const passed = compareWithBounds(count, predicate.count?.gte, predicate.count?.lte);
      return {
        passed,
        message: `Found ${count} faction node(s) with archetype "${predicate.archetype}".`,
      };
    }
    case 'has-agent-of-archetype': {
      const matches = worldNodesByKindAndArchetype(ctx.world, 'agent', predicate.archetype);
      const count = matches.length;
      const passed = compareWithBounds(count, predicate.count?.gte, predicate.count?.lte);
      return {
        passed,
        message: `Found ${count} agent node(s) with archetype "${predicate.archetype}".`,
      };
    }
    case 'doom-clock': {
      const tier = ctx.world.doomClockTier ?? 0;
      let passed: boolean;
      if (predicate.comparator === 'gte') {
        passed = tier >= predicate.tier;
      } else if (predicate.comparator === 'lte') {
        passed = tier <= predicate.tier;
      } else {
        passed = tier === predicate.tier;
      }
      return {
        passed,
        message: `Doom clock tier is ${tier}; comparator ${predicate.comparator} ${predicate.tier}.`,
      };
    }
    case 'composition-fired': {
      const firedSet = new Set(ctx.world.firedCompositions ?? []);
      const passed = firedSet.has(predicate.id);
      return {
        passed,
        message: passed
          ? `Composition "${predicate.id}" was already fired.`
          : `Composition "${predicate.id}" has not fired yet.`,
      };
    }
    case 'edge-exists': {
      const sourceMatches = ctx.world.nodes.filter((node) => evaluateFilterQuery(predicate.fromFilter, node, ctx));
      const passed = sourceMatches.some((sourceNode) =>
        (sourceNode.edges ?? []).some((edge) => {
          if (edge.type !== predicate.edgeType) {
            return false;
          }
          if (!predicate.toFilter) {
            return true;
          }
          const targetNode = ctx.nodeById.get(edge.to);
          return targetNode ? evaluateFilterQuery(predicate.toFilter, targetNode, ctx) : false;
        })
      );
      return {
        passed,
        message: passed
          ? `Found at least one "${predicate.edgeType}" edge matching filter constraints.`
          : `No "${predicate.edgeType}" edge matched the filter constraints.`,
      };
    }
    case 'world-flag': {
      const worldValue = ctx.world.worldFlags?.[predicate.key];
      const passed = worldValue === predicate.value;
      return {
        passed,
        message: passed
          ? `World flag "${predicate.key}" matched expected value.`
          : `World flag "${predicate.key}" did not match expected value.`,
      };
    }
    default:
      return { passed: false, message: 'Unknown predicate operation.' };
  }
}

function classifyPreconditionStatus(strength: PreconditionStrength, passed: boolean): PreconditionStatus {
  if (passed) {
    return 'passed';
  }
  if (strength === 'hard') {
    return 'blocked';
  }
  if (strength === 'medium') {
    return 'missing-support';
  }
  return 'degraded';
}

function resolveLiteralNode(
  nodeKey: string,
  nodeSpec: NodeSpec,
  ctx: EvaluationContext
): NodeResolutionResult {
  const ref = nodeSpec.resolve.ref;
  const matched = ctx.world.nodes.find((node) => node.id === ref.id && node.kind === ref.kind);
  if (matched) {
    return {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'literal',
      status: 'resolved',
      matchedNodeId: matched.id,
      message: `Resolved literal node to ${matched.kind}:${matched.id}.`,
    };
  }

  if (nodeSpec.tier === 'essential') {
    return {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'literal',
      status: 'error',
      message: `Essential literal ref ${ref.kind}:${ref.id} was not found in world state.`,
      creationPreview: {
        nodeKey,
        kind: ref.kind,
        tags: {},
        proceduralFill: false,
        source: 'missing-literal',
      },
    };
  }

  return {
    nodeKey,
    tier: nodeSpec.tier,
    strategy: 'literal',
    status: 'dropped',
    message: `Literal ref ${ref.kind}:${ref.id} missing; ${nodeSpec.tier} node dropped.`,
  };
}

function resolveProceduralNode(nodeKey: string, nodeSpec: NodeSpec): NodeResolutionResult {
  const resolve = nodeSpec.resolve;
  const preview: CreationPreview = {
    nodeKey,
    kind: 'generated',
    tags: {},
    proceduralFill: true,
    source: 'procedural',
  };
  return {
    nodeKey,
    tier: nodeSpec.tier,
    strategy: 'procedural',
    status: 'would-create',
    creationPreview: preview,
    message: `Procedural generator "${resolve.generator}" would run for this node.`,
  };
}

function resolveFindRenameCreateNode(
  nodeKey: string,
  nodeSpec: NodeSpec,
  composition: Composition,
  ctx: EvaluationContext,
  warnings: string[],
  findCardLogs: FindCardLog[]
): NodeResolutionResult {
  const findResult = resolveFindCard(
    nodeKey,
    nodeSpec.resolve,
    ctx.world,
    composition,
    {
      nodeById: ctx.nodeById,
      filterCache: ctx.findFilterCache,
    }
  );
  findCardLogs.push(findResult.log);

  if (findResult.outcome === 'FOUND_AND_MARKED') {
    return {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'find-rename-create',
      status: 'resolved',
      matchedNodeId: findResult.selectedNodeId,
      matchedCandidateIds: findResult.candidateIds,
      mutationPreview: findResult.mutationPreview,
      message: findResult.message,
    };
  }

  if (findResult.outcome === 'CREATED' || findResult.outcome === 'FOUND_BUT_REJECTED') {
    if (findResult.rejectionReasons && findResult.rejectionReasons.length > 0) {
      warnings.push(
        `[${nodeKey}] Mutation step rejected candidate ${
          findResult.selectedNodeId ?? '(unknown)'
        }: ${findResult.rejectionReasons.join(' | ')}`
      );
    }

    return {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'find-rename-create',
      status: 'would-create',
      matchedNodeId: findResult.selectedNodeId,
      matchedCandidateIds: findResult.candidateIds,
      creationPreview: findResult.creationPreview,
      message: findResult.message,
    };
  }

  return {
    nodeKey,
    tier: nodeSpec.tier,
    strategy: 'find-rename-create',
    status: 'error',
    matchedNodeId: findResult.selectedNodeId,
    matchedCandidateIds: findResult.candidateIds,
    message: findResult.message,
    creationPreview: findResult.creationPreview
      ? {
          nodeKey,
          kind: findResult.creationPreview.kind,
          tags: findResult.creationPreview.tags,
          initialEdges: findResult.creationPreview.initialEdges,
          proceduralFill: findResult.creationPreview.proceduralFill,
          source: findResult.creationPreview.source,
          createdId: findResult.creationPreview.createdId,
          inheritedRecipeTags: findResult.creationPreview.inheritedRecipeTags,
        }
      : {
          nodeKey,
          kind: nodeSpec.resolve.create.kind,
          tags: nodeSpec.resolve.create.tags,
          initialEdges: nodeSpec.resolve.create.initialEdges,
          proceduralFill: nodeSpec.resolve.create.proceduralFill ?? true,
          source: 'missing-find-create-disabled',
        },
  };
}

function resolveNode(
  nodeKey: string,
  nodeSpec: NodeSpec,
  composition: Composition,
  ctx: EvaluationContext,
  warnings: string[],
  findCardLogs: FindCardLog[]
): NodeResolutionResult {
  if (nodeSpec.resolve.type === 'literal') {
    return resolveLiteralNode(nodeKey, nodeSpec, ctx);
  }
  if (nodeSpec.resolve.type === 'procedural') {
    return resolveProceduralNode(nodeKey, nodeSpec);
  }
  return resolveFindRenameCreateNode(nodeKey, nodeSpec, composition, ctx, warnings, findCardLogs);
}

function applyRenderPromotions(
  composition: Composition,
  nodes: Record<string, NodeResolutionResult>,
  ctx: EvaluationContext
): RenderPromotion[] {
  const promotions: RenderPromotion[] = [];
  for (const [nodeKey, result] of Object.entries(nodes)) {
    if (result.status !== 'resolved' || !result.matchedNodeId) {
      continue;
    }

    const worldNode = ctx.nodeById.get(result.matchedNodeId);
    if (!worldNode) {
      continue;
    }

    const fromClass = getNodeClass(worldNode);
    const promotion = promoteIfGeneric(worldNode, {
      recipeId: composition.id,
      surfacedAt: composition.metadata.createdAt,
      reason: `render:${nodeKey}`,
    });

    if (!promotion.promoted) {
      continue;
    }

    ctx.nodeById.set(worldNode.id, promotion.node);
    const worldIndex = ctx.world.nodes.findIndex((node) => node.id === worldNode.id);
    if (worldIndex >= 0) {
      ctx.world.nodes[worldIndex] = promotion.node;
    }

    promotions.push({
      nodeId: worldNode.id,
      fromClass,
      toClass: 'promoted',
      reason: `render:${nodeKey}`,
    });
  }

  return promotions;
}

export function parseWorldState(input: unknown): WorldState {
  return worldStateSchema.parse(input);
}

export function validateComposition(
  compositionInput: unknown,
  worldInput: unknown
): CompositionValidationReport {
  const composition: Composition = parseComposition(compositionInput);
  const world = parseWorldState(worldInput);
  const ctx: EvaluationContext = {
    world,
    nodeById: new Map(world.nodes.map((node) => [node.id, node])),
    findFilterCache: new Map<string, boolean>(),
  };

  const errors: string[] = [];
  const warnings: string[] = [];
  const findCardLogs: FindCardLog[] = [];

  const preconditions: PreconditionResult[] = composition.preconditions.map((precondition, index) => {
    const evalResult = evaluatePredicate(precondition.predicate, ctx);
    const status = classifyPreconditionStatus(precondition.strength, evalResult.passed);
    const message = `${evalResult.message} [strength=${precondition.strength}]`;

    if (!evalResult.passed) {
      if (status === 'blocked') {
        errors.push(`Hard precondition ${index} failed: ${message}`);
      } else {
        warnings.push(`Precondition ${index} did not pass: ${message}`);
      }
    }

    return {
      index,
      strength: precondition.strength,
      passed: evalResult.passed,
      status,
      message,
      rationale: precondition.rationale,
    };
  });

  const nodes: Record<string, NodeResolutionResult> = {};
  for (const [nodeKey, nodeSpec] of Object.entries(composition.nodes)) {
    const result = resolveNode(nodeKey, nodeSpec, composition, ctx, warnings, findCardLogs);
    nodes[nodeKey] = result;

    if (result.status === 'error') {
      errors.push(`Node "${nodeKey}" failed: ${result.message}`);
    } else if (result.status === 'dropped') {
      warnings.push(`Node "${nodeKey}" dropped: ${result.message}`);
    }
  }

  const creations = Object.values(nodes)
    .map((node) => node.creationPreview)
    .filter((preview): preview is CreationPreview => Boolean(preview));
  const mutations = Object.values(nodes)
    .map((node) => node.mutationPreview)
    .filter((preview): preview is MutationPreview => Boolean(preview));

  const hasHardPreconditionFailure = preconditions.some((result) => result.status === 'blocked');
  const hasEssentialNodeFailure = Object.values(nodes).some((result) => result.status === 'error');
  const willFire = !hasHardPreconditionFailure && !hasEssentialNodeFailure;
  const renderPromotions = willFire ? applyRenderPromotions(composition, nodes, ctx) : [];

  return {
    compositionId: composition.id,
    willFire,
    preconditions,
    nodes,
    renderPromotions,
    creations,
    mutations,
    findCardLogs,
    errors,
    warnings,
  };
}
