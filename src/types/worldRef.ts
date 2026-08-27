/**
 * `WorldRef` — the one canonical way anything in the game names a game-state object.
 *
 * THR-1212 slice 1. Seven live entity-kind vocabularies disagree with each other
 * today: the graph says `actor` where every UI layer says `agent`; `faction` is
 * type-illegal in `TargetCategory` and ships through an `as unknown as` cast;
 * `attachment` is legal in the aftermath concept vocabulary and deliberately
 * illegal in the visual resolver it feeds. `WorldRefKind` below is **the** kind
 * vocabulary — every other union is validated as a projection of it, with a
 * curated disposition for each deliberate divergence.
 *
 * **This module is deliberately import-free.** It is a membership source parsed by
 * `scripts/generate-anchor-catalog.ts`, and a generator that must resolve an import
 * graph to read a union is a generator that breaks when an unrelated module moves.
 * Adapters to the four existing wire shapes live in `./worldRefAdapters`, which may
 * import freely.
 *
 * Hub-and-spoke, not replacement (strangler — standing preference). `NavigationTarget`,
 * `EntityVisualRef`, `EncounterAftermathConceptRef` and the narrative-segment quadruple
 * remain the formats their consumers already speak; `WorldRef` is the normal form
 * behind them. What unifies immediately is the *kind vocabulary*. What converges
 * opportunistically is the shapes.
 *
 * Plan: `Docs/plans/2026-08-27-shared-anchor-machinery.md`
 */

/**
 * Canonical kinds a game-state reference can name.
 *
 * Membership is load-bearing: the anchor catalog cross-checks every consumer union
 * against this one and fails by name on an unmapped member, so adding an arm here
 * without a disposition row is a build failure rather than a silent default.
 */
export type WorldRefKind =
  | 'agent'        // graph: actor node (person-like actorType); the UI word wins over the graph's 'actor'
  | 'faction'      // actor node with actorType 'faction'; authored form is $faction:<defId>
  | 'location'     // place-tier location node
  | 'sublocation'  // location node carrying parentLocationId (THR-1183 shape)
  | 'hex'          // id serialized `<col>,<row>` — hex identity is coordinates, not a node id
  | 'artifact'     // artifact | artifact_legendary node
  | 'attachment'   // attachment TEMPLATE node id (committed content; never a granted instance)
  | 'companion'
  | 'army'
  | 'encounter'    // live encounter/action id
  | 'journey'
  | 'receipt'      // divine receipt id
  | 'codex';       // reserved — no in-game codex destination exists yet (see WORLD_REF_RESERVED_KINDS)

/**
 * Every `WorldRefKind`, as a runtime value.
 *
 * The generator and the coverage lint need membership at runtime, and a hand-kept
 * second list would be exactly the drift this module exists to remove. Declared with
 * an explicit `readonly WorldRefKind[]` annotation so a member added to the type
 * without a member added here fails to compile.
 */
export const WORLD_REF_KINDS: readonly WorldRefKind[] = [
  'agent',
  'faction',
  'location',
  'sublocation',
  'hex',
  'artifact',
  'attachment',
  'companion',
  'army',
  'encounter',
  'journey',
  'receipt',
  'codex',
];

/**
 * Kinds that are legal to *name* but have no destination to route to yet.
 *
 * `codex` is reserved rather than omitted: `?view=codex` is a full-page navigation
 * that tears down the running simulation, so there is no in-game codex surface for a
 * link to open. Recording it as reserved keeps the gap visible to the catalog instead
 * of letting it read as an oversight; `toNavigationTarget` returns `undefined` for it,
 * which is the fail-soft every other unroutable kind takes (NFP #4, Law 21).
 */
export const WORLD_REF_RESERVED_KINDS: readonly WorldRefKind[] = ['codex'];

/** Whether `kind` names a thing nothing can currently route to. */
export function isReservedWorldRefKind(kind: WorldRefKind): boolean {
  return WORLD_REF_RESERVED_KINDS.includes(kind);
}

/** Runtime membership test — for validating strings arriving from data. */
export function isWorldRefKind(value: string): value is WorldRefKind {
  return (WORLD_REF_KINDS as readonly string[]).includes(value);
}

/**
 * A reference to something in the world.
 *
 * One `id` field carries three binding forms; see {@link WorldRefBindingForm}. The
 * pilot proved sentinels-in-the-id-field against real content and the shape survived
 * unchanged (THR-1160), so this generalizes that rule rather than inventing a second
 * channel for late binding.
 */
export interface WorldRef {
  readonly kind: WorldRefKind;
  /** One id space, three binding forms. */
  readonly id: string;
  /** Display name for alt text / fallback tiles. */
  readonly name?: string;
  /** Concept explanation (`tooltipResolver` id) where one exists. */
  readonly tooltipId?: string;
}

/**
 * How a `WorldRef.id` reaches the thing it names.
 *
 * - `literal` — an id meaning the same thing in every world: an attachment template
 *   node id, a faction *definition* id, a tooltip concept id. The only literals
 *   authored content may carry.
 * - `sentinel` — `$`-prefixed, resolved against the live graph at use (`$actor`,
 *   `$target`, `$cast:<key>`, `$faction:<defId>`, `$artifact`). The existing grammar
 *   from `chipAnchorDeclarations.ts`, unchanged.
 * - `node` — a per-world graph node id. **Engine producers only.** Authored content
 *   carrying one is a gate violation, because a raw node id works in the authoring
 *   session and nowhere else.
 *
 * This is program-epic distinction 1 (claims vs reports) expressed as a binding rule:
 * *claims bind by `literal` or `sentinel`; reports may bind by `node`.*
 */
export type WorldRefBindingForm = 'literal' | 'sentinel' | 'node';

/** The sentinel prefix. Kept here so the binding classifier needs no import. */
const SENTINEL_PREFIX = '$';

/**
 * Which binding form an id uses, by inspection alone.
 *
 * Deliberately cannot tell `literal` from `node` — that distinction is a claim about
 * *provenance*, not about the string, and it is the gate's job (which knows whether
 * it is looking at authored content or an engine report), not this function's. A
 * classifier that guessed would launder the very violation the gate exists to catch.
 */
export function classifyWorldRefBinding(id: string): 'sentinel' | 'literal-or-node' {
  return id.startsWith(SENTINEL_PREFIX) ? 'sentinel' : 'literal-or-node';
}

/** Serialize hex coordinates into the `hex` kind's id form. */
export function hexRefId(col: number, row: number): string {
  return `${col},${row}`;
}

/**
 * Parse a `hex` id back into coordinates, or `undefined` when it is not one.
 *
 * Fail-soft rather than throwing (NFP #4): a malformed hex id means the caller draws
 * no affordance, never that a render crashes.
 *
 * Two coercions have to be refused explicitly, because `Number` accepts both without
 * complaint and each would route somewhere wrong rather than nowhere:
 * `Number('1.5')` is `1.5` and a hex at column 1.5 does not exist, and — the one that
 * is easy to miss — **`Number('')` is `0`**, so `'4,'` would otherwise read as the
 * real, wrong hex `(4, 0)`. An empty part is rejected before any conversion.
 */
export function parseHexRefId(id: string): { col: number; row: number } | undefined {
  const parts = id.split(',');
  if (parts.length !== 2) return undefined;
  const [rawCol, rawRow] = parts;
  if (rawCol.trim() === '' || rawRow.trim() === '') return undefined;
  const col = Number(rawCol);
  const row = Number(rawRow);
  if (!Number.isInteger(col) || !Number.isInteger(row)) return undefined;
  return { col, row };
}
