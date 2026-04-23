import type {
  Composition,
  FilterQuery,
  FindRenameCreateResolve,
  MutationSet,
  NodeClass,
  ResolveMutationContext,
  TagAxis,
} from './schema';
import {
  mutateNode,
  type MutationContext,
  type MutationResult,
  type NodeMutation,
} from './mutationGate';
import { getNodeClass, type WorldNode, type WorldSnapshot } from './worldTypes';

export type { WorldEdge, WorldNode, WorldSnapshot } from './worldTypes';

export type FindCardOutcome =
  | 'FOUND_AND_MARKED'
  | 'FOUND_BUT_REJECTED'
  | 'CREATED'
  | 'HARD_FAILED';

export interface FindCardMutationPreview {
  nodeId: string;
  rename?: string;
  promoteClass?: 'promoted' | 'threaded';
  setNodeClass?: NodeClass;
  addEdges?: Array<{ edgeType: string; toNodeKey: string }>;
  setProps?: Record<string, unknown>;
  statedAttributes?: Array<{ field: string; value: unknown }>;
  resultingClass?: NodeClass;
}

export interface FindCardCreationPreview {
  nodeKey: string;
  kind: string;
  tags: {
    archetype?: string[];
    reach?: string[];
    sphere?: string[];
  };
  initialEdges?: Array<{ edgeType: string; toNodeKey: string }>;
  proceduralFill: boolean;
  source: 'find-rename-create-fallback' | 'find-rename-create-rejected-fallback';
  createdId: string;
  inheritedRecipeTags: string[];
}

export interface FindCardLog {
  nodeKey: string;
  recipeId: string;
  outcome: FindCardOutcome;
  candidateCount: number;
  selectedId?: string;
  rejectionReasons?: string[];
  mutationsApplied?: MutationSet;
  gateStatus?: 'passed' | 'rejected';
  tripwireStatus?: 'passed' | 'rejected';
  createdId?: string;
  durationMs: number;
}

export interface FindCardResult {
  outcome: FindCardOutcome;
  selectedNodeId?: string;
  candidateIds: string[];
  creationPreview?: FindCardCreationPreview;
  mutationPreview?: FindCardMutationPreview;
  rejectionReasons?: string[];
  message: string;
  log: FindCardLog;
}

export interface ResolveFindCardOptions {
  nodeById?: Map<string, WorldNode>;
  filterCache?: Map<string, boolean>;
  mutationContext?: Partial<ResolveMutationContext>;
  mutateNodeFn?: (node: WorldNode, mutation: NodeMutation, context: MutationContext) => MutationResult;
  clock?: () => number;
}

interface FilterContext {
  nodeById: Map<string, WorldNode>;
  filterCache: Map<string, boolean>;
}

interface MutationAttempt {
  mutationPreview?: FindCardMutationPreview;
  rejectionReasons: string[];
  gateStatus: 'passed' | 'rejected';
  tripwireStatus: 'passed' | 'rejected';
}

const NODE_CLASS_ORDER: Record<NodeClass, number> = {
  generic: 0,
  promoted: 1,
  threaded: 2,
};

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

function makeFilterCacheKey(nodeId: string, query: FilterQuery): string {
  return `${nodeId}::${JSON.stringify(query)}`;
}

function evaluateFilterQuery(query: FilterQuery, node: WorldNode, ctx: FilterContext): boolean {
  const cacheKey = makeFilterCacheKey(node.id, query);
  const cached = ctx.filterCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let result = false;
  switch (query.op) {
    case 'and':
      result = query.terms.every((term) => evaluateFilterQuery(term, node, ctx));
      break;
    case 'or':
      result = query.terms.some((term) => evaluateFilterQuery(term, node, ctx));
      break;
    case 'not':
      result = !evaluateFilterQuery(query.term, node, ctx);
      break;
    case 'has-tag':
      result = hasTag(node, query.axis, query.value);
      break;
    case 'has-any-tag':
      result = hasAnyTag(node, query.axis, query.values);
      break;
    case 'node-class':
      result = getNodeClass(node) === query.class;
      break;
    case 'has-edge':
      result = (node.edges ?? []).some((edge) => {
        if (edge.type !== query.edgeType) {
          return false;
        }
        if (!query.toFilter) {
          return true;
        }
        const target = ctx.nodeById.get(edge.to);
        return target ? evaluateFilterQuery(query.toFilter, target, ctx) : false;
      });
      break;
    case 'prop-equals':
      result = node.props?.[query.prop] === query.value;
      break;
    default:
      result = false;
      break;
  }

  ctx.filterCache.set(cacheKey, result);
  return result;
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

    const leftRank = NODE_CLASS_ORDER[getNodeClass(left)];
    const rightRank = NODE_CLASS_ORDER[getNodeClass(right)];
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.id.localeCompare(right.id);
  });
}

function buildCreationPreview(
  nodeKey: string,
  spec: FindRenameCreateResolve,
  recipe: Composition,
  source: FindCardCreationPreview['source']
): FindCardCreationPreview {
  return {
    nodeKey,
    kind: spec.create.kind,
    tags: spec.create.tags,
    initialEdges: spec.create.initialEdges,
    proceduralFill: spec.create.proceduralFill ?? true,
    source,
    createdId: `${recipe.id}:${nodeKey}:created`,
    inheritedRecipeTags: recipe.metadata.tags,
  };
}

function buildMutationContext(
  recipe: Composition,
  specContext: ResolveMutationContext | undefined,
  optionContext: Partial<ResolveMutationContext> | undefined
): MutationContext {
  const ownsThreads = new Set<string>();
  for (const nodeId of specContext?.ownsThreads ?? []) {
    ownsThreads.add(nodeId);
  }
  for (const nodeId of optionContext?.ownsThreads ?? []) {
    ownsThreads.add(nodeId);
  }

  return {
    recipeId: recipe.id,
    firedAt: recipe.metadata.createdAt,
    respectsPromoted:
      optionContext?.respectsPromoted ?? specContext?.respectsPromoted ?? false,
    ownsThreads: [...ownsThreads],
    overrideTripwire:
      optionContext?.overrideTripwire ?? specContext?.overrideTripwire ?? false,
    overrideRationale:
      optionContext?.overrideRationale ?? specContext?.overrideRationale,
  };
}

function tryMutateNode(
  node: WorldNode,
  mutation: MutationSet,
  recipe: Composition,
  spec: FindRenameCreateResolve,
  options: ResolveFindCardOptions
): MutationAttempt {
  const mutateNodeFn = options.mutateNodeFn ?? mutateNode;
  const context = buildMutationContext(recipe, spec.mutationContext, options.mutationContext);
  const result = mutateNodeFn(node, mutation as NodeMutation, context);

  if (!result.ok) {
    return {
      rejectionReasons: result.errors,
      gateStatus: result.gateDecision.ok ? 'passed' : 'rejected',
      tripwireStatus:
        result.tripwireDecision && !result.tripwireDecision.ok ? 'rejected' : 'passed',
    };
  }

  return {
    mutationPreview: {
      nodeId: node.id,
      rename: mutation.rename,
      promoteClass: mutation.promoteClass,
      setNodeClass: mutation.setNodeClass,
      addEdges: mutation.addEdges,
      setProps: mutation.setProps,
      statedAttributes: mutation.statedAttributes,
      resultingClass: getNodeClass(result.node),
    },
    rejectionReasons: [],
    gateStatus: 'passed',
    tripwireStatus: 'passed',
  };
}

export function resolveFindCard(
  nodeKey: string,
  spec: FindRenameCreateResolve,
  world: WorldSnapshot,
  recipe: Composition,
  options: ResolveFindCardOptions = {}
): FindCardResult {
  const clock = options.clock ?? Date.now;
  const startedAt = clock();
  const nodeById = options.nodeById ?? new Map(world.nodes.map((node) => [node.id, node]));
  const filterCache = options.filterCache ?? new Map<string, boolean>();
  const filterCtx: FilterContext = { nodeById, filterCache };

  const candidates = world.nodes.filter((node) => evaluateFilterQuery(spec.find, node, filterCtx));
  const sortedCandidates = sortFindCandidates(spec.find, candidates);
  const candidateIds = sortedCandidates.map((node) => node.id);
  const selected = sortedCandidates[0];
  const allowCreate = spec.allowCreate ?? true;

  const makeLog = (params: {
    outcome: FindCardOutcome;
    selectedId?: string;
    rejectionReasons?: string[];
    mutationsApplied?: MutationSet;
    gateStatus?: 'passed' | 'rejected';
    tripwireStatus?: 'passed' | 'rejected';
    createdId?: string;
  }): FindCardLog => ({
    nodeKey,
    recipeId: recipe.id,
    outcome: params.outcome,
    candidateCount: candidateIds.length,
    selectedId: params.selectedId,
    rejectionReasons: params.rejectionReasons,
    mutationsApplied: params.mutationsApplied,
    gateStatus: params.gateStatus,
    tripwireStatus: params.tripwireStatus,
    createdId: params.createdId,
    durationMs: Math.max(0, clock() - startedAt),
  });

  if (selected) {
    if (spec.mark) {
      const mutationAttempt = tryMutateNode(selected, spec.mark, recipe, spec, options);
      if (mutationAttempt.mutationPreview) {
        return {
          outcome: 'FOUND_AND_MARKED',
          selectedNodeId: selected.id,
          candidateIds,
          mutationPreview: mutationAttempt.mutationPreview,
          message: `Selected ${selected.id} from ${candidateIds.length} candidate(s) and applied mutations atomically.`,
          log: makeLog({
            outcome: 'FOUND_AND_MARKED',
            selectedId: selected.id,
            mutationsApplied: spec.mark,
            gateStatus: mutationAttempt.gateStatus,
            tripwireStatus: mutationAttempt.tripwireStatus,
          }),
        };
      }

      if (allowCreate) {
        const creationPreview = buildCreationPreview(
          nodeKey,
          spec,
          recipe,
          'find-rename-create-rejected-fallback'
        );
        return {
          outcome: 'FOUND_BUT_REJECTED',
          selectedNodeId: selected.id,
          candidateIds,
          creationPreview,
          rejectionReasons: mutationAttempt.rejectionReasons,
          message: `Selected ${selected.id}, but mutation gate rejected changes. Falling back to creation.`,
          log: makeLog({
            outcome: 'FOUND_BUT_REJECTED',
            selectedId: selected.id,
            rejectionReasons: mutationAttempt.rejectionReasons,
            gateStatus: mutationAttempt.gateStatus,
            tripwireStatus: mutationAttempt.tripwireStatus,
            createdId: creationPreview.createdId,
          }),
        };
      }

      return {
        outcome: 'HARD_FAILED',
        selectedNodeId: selected.id,
        candidateIds,
        rejectionReasons: mutationAttempt.rejectionReasons,
        message: `Selected ${selected.id}, but mutation gate rejected changes and allowCreate=false.`,
        log: makeLog({
          outcome: 'HARD_FAILED',
          selectedId: selected.id,
          rejectionReasons: mutationAttempt.rejectionReasons,
          gateStatus: mutationAttempt.gateStatus,
          tripwireStatus: mutationAttempt.tripwireStatus,
        }),
      };
    }

    return {
      outcome: 'FOUND_AND_MARKED',
      selectedNodeId: selected.id,
      candidateIds,
      message: `Selected ${selected.id} from ${candidateIds.length} candidate(s).`,
      log: makeLog({
        outcome: 'FOUND_AND_MARKED',
        selectedId: selected.id,
      }),
    };
  }

  if (allowCreate) {
    const creationPreview = buildCreationPreview(nodeKey, spec, recipe, 'find-rename-create-fallback');
    return {
      outcome: 'CREATED',
      candidateIds,
      creationPreview,
      message: 'No candidates matched; creation fallback selected.',
      log: makeLog({
        outcome: 'CREATED',
        createdId: creationPreview.createdId,
      }),
    };
  }

  return {
    outcome: 'HARD_FAILED',
    candidateIds,
    message: 'No candidates matched and allowCreate=false.',
    log: makeLog({
      outcome: 'HARD_FAILED',
    }),
  };
}
