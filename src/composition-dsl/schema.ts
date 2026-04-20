import { z } from 'zod';

const nonEmptyStringSchema = z.string().trim().min(1);

export const KNOWN_COMPOSITION_KINDS = [
  'faction',
  'agent',
  'event',
  'quest',
  'location',
  'encounter',
  'mandate',
] as const;

export type KnownCompositionKind = (typeof KNOWN_COMPOSITION_KINDS)[number];
export type CompositionKind = KnownCompositionKind | (string & {});

export type TagAxis = 'archetype' | 'reach' | 'sphere';
export type NodeClass = 'generic' | 'promoted' | 'threaded';
export type Tier = 'essential' | 'flavor' | 'atmospheric';
export type PreconditionStrength = 'hard' | 'medium' | 'soft';

export interface FilterAndOrQuery {
  op: 'and' | 'or';
  terms: FilterQuery[];
}

export interface FilterNotQuery {
  op: 'not';
  term: FilterQuery;
}

export interface FilterHasTagQuery {
  op: 'has-tag';
  axis: TagAxis;
  value: string;
}

export interface FilterHasAnyTagQuery {
  op: 'has-any-tag';
  axis: TagAxis;
  values: string[];
}

export interface FilterNodeClassQuery {
  op: 'node-class';
  class: NodeClass;
}

export interface FilterHasEdgeQuery {
  op: 'has-edge';
  edgeType: string;
  toFilter?: FilterQuery;
}

export interface FilterPropEqualsQuery {
  op: 'prop-equals';
  prop: string;
  value: unknown;
}

export type FilterQuery =
  | FilterAndOrQuery
  | FilterNotQuery
  | FilterHasTagQuery
  | FilterHasAnyTagQuery
  | FilterNodeClassQuery
  | FilterHasEdgeQuery
  | FilterPropEqualsQuery;

export type ConstraintSet = FilterQuery;

export interface ContentRef {
  kind: string;
  id: string;
}

export interface MutationEdgeSpec {
  edgeType: string;
  toNodeKey: string;
}

export interface StatedAttributeDeclaration {
  field: string;
  value: unknown;
}

export interface MutationSet {
  rename?: string;
  promoteClass?: 'promoted' | 'threaded';
  setNodeClass?: NodeClass;
  addEdges?: MutationEdgeSpec[];
  setProps?: Record<string, unknown>;
  statedAttributes?: StatedAttributeDeclaration[];
}

export interface ResolveMutationContext {
  respectsPromoted?: boolean;
  ownsThreads?: string[];
  overrideTripwire?: boolean;
  overrideRationale?: string;
}

export interface CreationEdgeSpec {
  edgeType: string;
  toNodeKey: string;
}

export interface CreationSpec {
  kind: CompositionKind;
  tags: {
    archetype?: string[];
    reach?: string[];
    sphere?: string[];
  };
  initialEdges?: CreationEdgeSpec[];
  proceduralFill?: boolean;
}

export interface LiteralResolve {
  type: 'literal';
  ref: ContentRef;
}

export interface ProceduralResolve {
  type: 'procedural';
  generator: string;
  constraints: ConstraintSet;
}

export interface FindRenameCreateResolve {
  type: 'find-rename-create';
  find: FilterQuery;
  mark?: MutationSet;
  create: CreationSpec;
  allowCreate?: boolean;
  mutationContext?: ResolveMutationContext;
}

export type ResolveStrategy = LiteralResolve | ProceduralResolve | FindRenameCreateResolve;

export interface NodeSpec {
  tier: Tier;
  resolve: ResolveStrategy;
}

export interface PredicateAndOr {
  op: 'and' | 'or';
  terms: WorldPredicate[];
}

export interface PredicateNot {
  op: 'not';
  term: WorldPredicate;
}

export interface PredicateHasFactionOfArchetype {
  op: 'has-faction-of-archetype';
  archetype: string;
  count?: {
    gte?: number;
    lte?: number;
  };
}

export interface PredicateHasAgentOfArchetype {
  op: 'has-agent-of-archetype';
  archetype: string;
  count?: {
    gte?: number;
    lte?: number;
  };
}

export interface PredicateDoomClock {
  op: 'doom-clock';
  comparator: 'gte' | 'lte' | 'eq';
  tier: number;
}

export interface PredicateCompositionFired {
  op: 'composition-fired';
  id: string;
}

export interface PredicateEdgeExists {
  op: 'edge-exists';
  fromFilter: FilterQuery;
  edgeType: string;
  toFilter?: FilterQuery;
}

export interface PredicateWorldFlag {
  op: 'world-flag';
  key: string;
  value: unknown;
}

export type WorldPredicate =
  | PredicateAndOr
  | PredicateNot
  | PredicateHasFactionOfArchetype
  | PredicateHasAgentOfArchetype
  | PredicateDoomClock
  | PredicateCompositionFired
  | PredicateEdgeExists
  | PredicateWorldFlag;

export interface Precondition {
  predicate: WorldPredicate;
  strength: PreconditionStrength;
  rationale?: string;
}

export type Effect =
  | { op: 'set-world-flag'; key: string; value: unknown }
  | { op: 'advance-doom-clock'; by: number }
  | { op: 'mark-composition-fired'; id: string };

export interface CompositionMetadata {
  author: string;
  createdAt: string;
  tags: string[];
}

export interface Composition {
  id: string;
  kind: CompositionKind;
  preconditions: Precondition[];
  nodes: Record<string, NodeSpec>;
  effects?: Effect[];
  metadata: CompositionMetadata;
}

const compositionKindSchema = nonEmptyStringSchema;
const tagAxisSchema = z.enum(['archetype', 'reach', 'sphere']);
const nodeClassSchema = z.enum(['generic', 'promoted', 'threaded']);
const tierSchema = z.enum(['essential', 'flavor', 'atmospheric']);
const preconditionStrengthSchema = z.enum(['hard', 'medium', 'soft']);

const countBoundsSchema = z
  .object({
    gte: z.number().int().optional(),
    lte: z.number().int().optional(),
  })
  .partial();

const tagSetSchema = z.object({
  archetype: z.array(nonEmptyStringSchema).optional(),
  reach: z.array(nonEmptyStringSchema).optional(),
  sphere: z.array(nonEmptyStringSchema).optional(),
});

const mutationEdgeSpecSchema = z.object({
  edgeType: nonEmptyStringSchema,
  toNodeKey: nonEmptyStringSchema,
});

const mutationSetSchema: z.ZodType<MutationSet> = z.object({
  rename: nonEmptyStringSchema.optional(),
  promoteClass: z.enum(['promoted', 'threaded']).optional(),
  setNodeClass: nodeClassSchema.optional(),
  addEdges: z.array(mutationEdgeSpecSchema).optional(),
  setProps: z.record(nonEmptyStringSchema, z.unknown()).optional(),
  statedAttributes: z
    .array(
      z.object({
        field: nonEmptyStringSchema,
        value: z.unknown(),
      })
    )
    .optional(),
});

const resolveMutationContextSchema: z.ZodType<ResolveMutationContext> = z.object({
  respectsPromoted: z.boolean().optional(),
  ownsThreads: z.array(nonEmptyStringSchema).optional(),
  overrideTripwire: z.boolean().optional(),
  overrideRationale: nonEmptyStringSchema.optional(),
});

const creationEdgeSpecSchema = z.object({
  edgeType: nonEmptyStringSchema,
  toNodeKey: nonEmptyStringSchema,
});

const creationSpecSchema: z.ZodType<CreationSpec> = z.object({
  kind: compositionKindSchema,
  tags: tagSetSchema,
  initialEdges: z.array(creationEdgeSpecSchema).optional(),
  proceduralFill: z.boolean().optional(),
});

const contentRefSchema: z.ZodType<ContentRef> = z.object({
  kind: nonEmptyStringSchema,
  id: nonEmptyStringSchema,
});

const filterQuerySchema: z.ZodType<FilterQuery> = z.lazy(() =>
  z.union([
    z.object({
      op: z.enum(['and', 'or']),
      terms: z.array(filterQuerySchema).min(1),
    }),
    z.object({
      op: z.literal('not'),
      term: filterQuerySchema,
    }),
    z.object({
      op: z.literal('has-tag'),
      axis: tagAxisSchema,
      value: nonEmptyStringSchema,
    }),
    z.object({
      op: z.literal('has-any-tag'),
      axis: tagAxisSchema,
      values: z.array(nonEmptyStringSchema).min(1),
    }),
    z.object({
      op: z.literal('node-class'),
      class: nodeClassSchema,
    }),
    z.object({
      op: z.literal('has-edge'),
      edgeType: nonEmptyStringSchema,
      toFilter: filterQuerySchema.optional(),
    }),
    z.object({
      op: z.literal('prop-equals'),
      prop: nonEmptyStringSchema,
      value: z.unknown(),
    }),
  ])
);

const resolveStrategySchema: z.ZodType<ResolveStrategy> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('literal'),
    ref: contentRefSchema,
  }),
  z.object({
    type: z.literal('procedural'),
    generator: nonEmptyStringSchema,
    constraints: filterQuerySchema,
  }),
  z.object({
    type: z.literal('find-rename-create'),
    find: filterQuerySchema,
    mark: mutationSetSchema.optional(),
    create: creationSpecSchema,
    allowCreate: z.boolean().optional(),
    mutationContext: resolveMutationContextSchema.optional(),
  }),
]);

const nodeSpecSchema: z.ZodType<NodeSpec> = z.object({
  tier: tierSchema,
  resolve: resolveStrategySchema,
});

const worldPredicateSchema: z.ZodType<WorldPredicate> = z.lazy(() =>
  z.union([
    z.object({
      op: z.enum(['and', 'or']),
      terms: z.array(worldPredicateSchema).min(1),
    }),
    z.object({
      op: z.literal('not'),
      term: worldPredicateSchema,
    }),
    z.object({
      op: z.literal('has-faction-of-archetype'),
      archetype: nonEmptyStringSchema,
      count: countBoundsSchema.optional(),
    }),
    z.object({
      op: z.literal('has-agent-of-archetype'),
      archetype: nonEmptyStringSchema,
      count: countBoundsSchema.optional(),
    }),
    z.object({
      op: z.literal('doom-clock'),
      comparator: z.enum(['gte', 'lte', 'eq']),
      tier: z.number().int(),
    }),
    z.object({
      op: z.literal('composition-fired'),
      id: nonEmptyStringSchema,
    }),
    z.object({
      op: z.literal('edge-exists'),
      fromFilter: filterQuerySchema,
      edgeType: nonEmptyStringSchema,
      toFilter: filterQuerySchema.optional(),
    }),
    z.object({
      op: z.literal('world-flag'),
      key: nonEmptyStringSchema,
      value: z.unknown(),
    }),
  ])
);

const preconditionSchema: z.ZodType<Precondition> = z.object({
  predicate: worldPredicateSchema,
  strength: preconditionStrengthSchema,
  rationale: nonEmptyStringSchema.optional(),
});

const effectSchema: z.ZodType<Effect> = z.union([
  z.object({
    op: z.literal('set-world-flag'),
    key: nonEmptyStringSchema,
    value: z.unknown(),
  }),
  z.object({
    op: z.literal('advance-doom-clock'),
    by: z.number().int(),
  }),
  z.object({
    op: z.literal('mark-composition-fired'),
    id: nonEmptyStringSchema,
  }),
]);

const compositionMetadataSchema: z.ZodType<CompositionMetadata> = z.object({
  author: nonEmptyStringSchema,
  createdAt: nonEmptyStringSchema,
  tags: z.array(nonEmptyStringSchema),
});

export const compositionSchema: z.ZodType<Composition> = z.object({
  id: nonEmptyStringSchema.regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'id must be kebab-case (example: the-winnowing-of-luck)'
  ),
  kind: compositionKindSchema,
  preconditions: z.array(preconditionSchema),
  nodes: z.record(nonEmptyStringSchema, nodeSpecSchema),
  effects: z.array(effectSchema).optional(),
  metadata: compositionMetadataSchema,
});

export const schemas = {
  composition: compositionSchema,
  filterQuery: filterQuerySchema,
  worldPredicate: worldPredicateSchema,
  nodeSpec: nodeSpecSchema,
};

export function parseComposition(input: unknown): Composition {
  return compositionSchema.parse(input);
}

export function safeParseComposition(input: unknown) {
  return compositionSchema.safeParse(input);
}
