import { z } from 'zod';

import type {
  Composition,
  FilterQuery,
  FindRenameCreateResolve,
  MutationSet,
  NodeClass,
  NodeSpec,
  PreconditionStrength,
  ResolveStrategy,
  TagAxis,
  Tier,
  WorldPredicate,
} from './schema';
import { parseComposition } from './schema';

export interface WorldEdge {
  type: string;
  to: string;
}

export interface WorldTags {
  archetype?: string[];
  reach?: string[];
  sphere?: string[];
}

export interface WorldNode {
  id: string;
  kind: string;
  name?: string;
  class?: NodeClass;
  tags?: WorldTags;
  props?: Record<string, unknown>;
  edges?: WorldEdge[];
}

export interface WorldState {
  nodes: WorldNode[];
  worldFlags?: Record<string, unknown>;
  doomClockTier?: number;
  firedCompositions?: string[];
}

const worldEdgeSchema = z.object({
  type: z.string().trim().min(1),
  to: z.string().trim().min(1),
});

const worldNodeSchema: z.ZodType<WorldNode> = z.object({
  id: z.string().trim().min(1),
  kind: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
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
  addEdges?: Array<{ edgeType: string; toNodeKey: string }>;
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
    | 'missing-literal'
    | 'missing-find-create-disabled';
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
  creations: CreationPreview[];
  mutations: MutationPreview[];
  errors: string[];
  warnings: string[];
}

interface EvaluationContext {
  world: WorldState;
  nodeById: Map<string, WorldNode>;
}

const NODE_CLASS_ORDER: Record<NodeClass, number> = {
  generic: 0,
  promoted: 1,
  threaded: 2,
};

function normalizeNodeClass(node: WorldNode): NodeClass {
  return node.class ?? 'generic';
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
      return normalizeNodeClass(node) === query.class;
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

function scoreTagMatch(query: FilterQuery, node: WorldNode): number {
  switch (query.op) {
    case 'and':
      return query.terms.reduce((sum, term) => sum + scoreTagMatch(term, node), 0);
    case 'or':
      return query.terms.reduce((max, term) => Math.max(max, scoreTagMatch(term, node)), 0);
    case 'not':
      return 0;
    case 'has-tag':
      return hasTag(node, query.axis, query.value) ? 1 : 0;
    case 'has-any-tag':
      return query.values.filter((value) => hasTag(node, query.axis, value)).length;
    default:
      return 0;
  }
}

function sortFindCandidates(query: FilterQuery, candidates: WorldNode[]): WorldNode[] {
  return [...candidates].sort((left, right) => {
    const leftScore = scoreTagMatch(query, left);
    const rightScore = scoreTagMatch(query, right);
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    const leftRank = NODE_CLASS_ORDER[normalizeNodeClass(left)];
    const rightRank = NODE_CLASS_ORDER[normalizeNodeClass(right)];
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.id.localeCompare(right.id);
  });
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

function buildMutationPreview(nodeId: string, mark: MutationSet): MutationPreview {
  return {
    nodeId,
    rename: mark.rename,
    promoteClass: mark.promoteClass,
    addEdges: mark.addEdges,
  };
}

function resolveFindRenameCreateNode(
  nodeKey: string,
  nodeSpec: NodeSpec,
  ctx: EvaluationContext,
  warnings: string[]
): NodeResolutionResult {
  const resolve = nodeSpec.resolve as FindRenameCreateResolve;
  const matching = ctx.world.nodes.filter((node) => evaluateFilterQuery(resolve.find, node, ctx));
  const sorted = sortFindCandidates(resolve.find, matching);
  const candidateIds = sorted.map((node) => node.id);
  const winner = sorted[0];

  if (winner) {
    const result: NodeResolutionResult = {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'find-rename-create',
      status: 'resolved',
      matchedNodeId: winner.id,
      matchedCandidateIds: candidateIds,
      message: `Found ${candidateIds.length} candidate(s); selected ${winner.id} by deterministic ranking.`,
    };

    if (resolve.mark) {
      result.mutationPreview = buildMutationPreview(winner.id, resolve.mark);
      // TODO(THR-224): enforce generic/promoted/threaded mutability gate here.
      warnings.push(
        `[${nodeKey}] Mutation gate (THR-224) is not enforced in v0 validator; mutation preview assumes node is mutable.`
      );
    }
    return result;
  }

  const allowCreate = resolve.allowCreate ?? true;
  if (allowCreate) {
    return {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'find-rename-create',
      status: 'would-create',
      matchedCandidateIds: [],
      creationPreview: {
        nodeKey,
        kind: resolve.create.kind,
        tags: resolve.create.tags,
        initialEdges: resolve.create.initialEdges,
        proceduralFill: resolve.create.proceduralFill ?? true,
        source: 'find-rename-create-fallback',
      },
      message: 'No candidates matched filter; fallback creation would run.',
    };
  }

  if (nodeSpec.tier === 'essential') {
    return {
      nodeKey,
      tier: nodeSpec.tier,
      strategy: 'find-rename-create',
      status: 'error',
      matchedCandidateIds: [],
      message: 'No candidates matched filter and allowCreate=false on essential node.',
      creationPreview: {
        nodeKey,
        kind: resolve.create.kind,
        tags: resolve.create.tags,
        initialEdges: resolve.create.initialEdges,
        proceduralFill: resolve.create.proceduralFill ?? true,
        source: 'missing-find-create-disabled',
      },
    };
  }

  return {
    nodeKey,
    tier: nodeSpec.tier,
    strategy: 'find-rename-create',
    status: 'dropped',
    matchedCandidateIds: [],
    message: `No candidates matched filter, allowCreate=false; ${nodeSpec.tier} node dropped.`,
  };
}

function resolveNode(
  nodeKey: string,
  nodeSpec: NodeSpec,
  ctx: EvaluationContext,
  warnings: string[]
): NodeResolutionResult {
  if (nodeSpec.resolve.type === 'literal') {
    return resolveLiteralNode(nodeKey, nodeSpec, ctx);
  }
  if (nodeSpec.resolve.type === 'procedural') {
    return resolveProceduralNode(nodeKey, nodeSpec);
  }
  return resolveFindRenameCreateNode(nodeKey, nodeSpec, ctx, warnings);
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
  };

  const errors: string[] = [];
  const warnings: string[] = [];

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
    const result = resolveNode(nodeKey, nodeSpec, ctx, warnings);
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

  return {
    compositionId: composition.id,
    willFire,
    preconditions,
    nodes,
    creations,
    mutations,
    errors,
    warnings,
  };
}
