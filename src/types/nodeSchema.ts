/**
 * Node Schema — the write-time half of the world-object model (THR-1394).
 *
 * Derived from the registry (`src/data/world-objects.ts`) at module load: per
 * `NodeType`, which discriminator property tells its members apart and which values
 * the registry claims. `WorldGraph.addNode` validates against it in dev mode the way
 * `addEdge` validates against `EDGE_SCHEMA`, with two things the edge schema does not
 * do: the warning is de-duplicated (once per `(nodeType, value)` per session —
 * `WORLD_OBJECT_WARN_ONCE`), and `WORLD_OBJECT_THROW_ON_UNKNOWN` is actually
 * consulted. Warn is the default and the production posture (NFP #4): an unregistered
 * subtype is named the tick it is first written, never a crash.
 *
 * The check answers one question — *is this value one the registry knows?* — and
 * never blocks a write. A missing discriminator is legal (many nodes carry none);
 * an unknown node type is reported once and let through, because the union is the
 * type system's to enforce and a saved world may carry a legacy member.
 */
import type { GraphNode, NodeType } from './graph';
import {
  WORLD_OBJECT_KINDS,
  barePlaceTypeId,
  type WorldObjectNodeShape,
} from '../data/world-objects';

// ─── Constants ────────────────────────────────────────────────────

/** Dev-mode validation of `addNode` against the registry (mirrors `GRAPH_SCHEMA_VALIDATION_ENABLED`). */
export const WORLD_OBJECT_VALIDATION_ENABLED = true;
/** When true, an unregistered value throws instead of warning — a test lever, never a production default (NFP #4). */
export const WORLD_OBJECT_THROW_ON_UNKNOWN = false;
/** De-duplicate the warning per (nodeType, value) per session; the set clears in `resetNodeSchemaWarnings`. */
export const WORLD_OBJECT_WARN_ONCE = true;

// ─── Schema ───────────────────────────────────────────────────────

export interface NodeDiscriminatorSchema {
  readonly key: string;
  readonly fallbackKey?: string;
  /** The structural test that selects this discriminator (the two location tiers share a node type). */
  readonly requires?: WorldObjectNodeShape['requires'];
  readonly values: ReadonlySet<string>;
}

export interface NodeSchema {
  readonly type: NodeType;
  /** Zero, one or two discriminators (location has one per tier). */
  readonly discriminators: readonly NodeDiscriminatorSchema[];
  /** Kinds that claim the type. */
  readonly kinds: readonly string[];
}

function deriveNodeSchema(): ReadonlyMap<NodeType, NodeSchema> {
  const out = new Map<NodeType, { type: NodeType; discriminators: Map<string, { key: string; fallbackKey?: string; requires?: WorldObjectNodeShape['requires']; values: Set<string> }>; kinds: string[] }>();
  for (const kind of WORLD_OBJECT_KINDS) {
    if (kind.shape.kind !== 'node') continue;
    const shape = kind.shape;
    let entry = out.get(shape.nodeType);
    if (!entry) { entry = { type: shape.nodeType, discriminators: new Map(), kinds: [] }; out.set(shape.nodeType, entry); }
    entry.kinds.push(kind.id);
    const claim = (key: string, fallbackKey: string | undefined, values: readonly string[]) => {
      const slot = `${key}|${shape.requires ?? ''}`;
      let d = entry!.discriminators.get(slot);
      if (!d) { d = { key, fallbackKey, requires: shape.requires, values: new Set() }; entry!.discriminators.set(slot, d); }
      for (const v of values) d.values.add(v);
    };
    // A refined value is claimed on the primary key (actor `actorType: group`) so the
    // node passes there and is then told apart on the kind's own key.
    if (shape.refines) claim(shape.refines.key, undefined, [shape.refines.value]);
    if (!shape.discriminator) continue;
    claim(shape.discriminator.key, shape.discriminator.fallbackKey, shape.discriminator.values);
  }
  // An edge kind's identity node (a trade route's `location:trade_route`, a holding's
  // artifact face) is claimed on the node type it grows, on every tier slot that key has.
  for (const kind of WORLD_OBJECT_KINDS) {
    if (kind.shape.kind !== 'edge' || !kind.shape.identityNode) continue;
    const id = kind.shape.identityNode;
    const entry = out.get(id.nodeType);
    if (!entry) continue;
    let claimed = false;
    for (const d of entry.discriminators.values()) if (d.key === id.key) { d.values.add(id.value); claimed = true; }
    if (!claimed) entry.discriminators.set(`${id.key}|`, { key: id.key, values: new Set([id.value]) });
  }
  const frozen = new Map<NodeType, NodeSchema>();
  for (const [type, e] of out) {
    frozen.set(type, { type, kinds: e.kinds, discriminators: [...e.discriminators.values()].map(d => ({ key: d.key, fallbackKey: d.fallbackKey, requires: d.requires, values: d.values })) });
  }
  return frozen;
}

let NODE_SCHEMA_CACHE: ReadonlyMap<NodeType, NodeSchema> | null = null;
let derivationFailed = false;

/** The schema, derived once. A derivation that throws disables validation for the session with one warning (fail-soft). */
export function getNodeSchema(): ReadonlyMap<NodeType, NodeSchema> | null {
  if (NODE_SCHEMA_CACHE) return NODE_SCHEMA_CACHE;
  if (derivationFailed) return null;
  try {
    NODE_SCHEMA_CACHE = deriveNodeSchema();
    return NODE_SCHEMA_CACHE;
  } catch (err) {
    derivationFailed = true;
    console.warn(`[NodeSchema] could not derive the node schema from the world-object registry — validation disabled for this session: ${(err as Error).message}`);
    return null;
  }
}

// ─── Validation ───────────────────────────────────────────────────

export interface NodeSchemaViolation {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly key: string;
  readonly value: string;
  readonly reason: 'unknown_node_type' | 'unregistered_value';
}

function discriminatorApplies(d: NodeDiscriminatorSchema, node: GraphNode): boolean {
  const hasParent = typeof node.properties.parentLocationId === 'string' && node.properties.parentLocationId.length > 0;
  if (d.requires === 'parentLocationId') return hasParent;
  if (d.requires === 'no-parentLocationId') return !hasParent;
  return true;
}

/**
 * The violation a node would raise, or null. Pure — callers decide what to do with it.
 * A place type id is compared bare (`sublocation-type.granary` and `granary` are one value).
 */
export function validateNodeAgainstRegistry(node: GraphNode): NodeSchemaViolation | null {
  const schema = getNodeSchema();
  if (!schema) return null;
  const entry = schema.get(node.type as NodeType);
  if (!entry) return { nodeId: node.id, nodeType: String(node.type), key: 'type', value: String(node.type), reason: 'unknown_node_type' };
  for (const d of entry.discriminators) {
    if (!discriminatorApplies(d, node)) continue;
    const raw = node.properties[d.key] ?? (d.fallbackKey ? node.properties[d.fallbackKey] : undefined);
    if (raw === undefined || raw === null) continue;
    const value = String(raw);
    const normalised = d.key === 'sublocationTypeId' ? barePlaceTypeId(value) : value;
    if (!d.values.has(normalised) && !d.values.has(value)) {
      return { nodeId: node.id, nodeType: String(node.type), key: d.key, value, reason: 'unregistered_value' };
    }
  }
  return null;
}

const WARNED = new Set<string>();

/** Clears the once-per-session warning set; called by `initializeGameState`. */
export function resetNodeSchemaWarnings(): void {
  WARNED.clear();
}

/** The violations reported so far this session (for the CLI `objects` readout and tests). */
export function nodeSchemaWarningsSoFar(): readonly string[] {
  return [...WARNED];
}

/**
 * Report a violation: warn once per (nodeType, value) when `WORLD_OBJECT_WARN_ONCE`,
 * throw when `WORLD_OBJECT_THROW_ON_UNKNOWN`. Never both silently.
 */
export function reportNodeSchemaViolation(v: NodeSchemaViolation): void {
  const key = `${v.nodeType}:${v.key}=${v.value}`;
  const message = v.reason === 'unknown_node_type'
    ? `[NodeSchema] Unknown node type "${v.nodeType}" (node ${v.nodeId}) — not claimed by any world-object kind (src/data/world-objects.ts).`
    : `[NodeSchema] ${v.nodeType} node ${v.nodeId} writes ${v.key}="${v.value}", a value no world-object kind claims — register it in src/data/world-objects.ts or fix the writer.`;
  if (WORLD_OBJECT_THROW_ON_UNKNOWN) throw new Error(message);
  if (WORLD_OBJECT_WARN_ONCE) {
    if (WARNED.has(key)) return;
    WARNED.add(key);
  }
  console.warn(message);
}
