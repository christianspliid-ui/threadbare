# Codex brief — THR-224: Node-class mutability gate + stated-attributes tripwire

## Context

When composition recipes mutate the content graph, we need to protect against two failure modes:

1. **Silent overwrites of on-screen content.** Recipes that casually rename or re-purpose a faction that the player has been interacting with for 20 turns break immersion and continuity. The mutability gate enforces that promoted/threaded nodes (on-screen, named, player-visible) cannot be silently mutated.

2. **Contradicting previously-stated facts.** If a recipe fired last week declared that the Merchant Consortium is run by a woman named Aine, a new recipe can't fire this week and declare that the Consortium is run by a man named Gus without at least warning the author. The tripwire catches "stated attributes" — facts that have been surfaced on-screen — and prevents future recipes from contradicting them (add-don't-contradict discipline).

These two mechanisms are linked but distinct. This brief implements both.

## Spec — REVIEW-PENDING (pinned by Claude in Cowork, not yet Christian-reviewed)

### Node classes

Every content node has a `nodeClass`:

```ts
type NodeClass = "generic" | "promoted" | "threaded"
```

- **generic** — background/procedural content. Not named on-screen. Freely mutable by any recipe.
- **promoted** — content that has surfaced on-screen at least once (player saw it named in text, heard it mentioned by an NPC, etc.) but isn't actively being threaded through ongoing narrative. Mutable only by recipes that explicitly opt into touching promoted content.
- **threaded** — content actively participating in a narrative thread (ongoing quest, active faction relationship, current doom-clock event). Stricter than promoted — threaded nodes can only be mutated by the recipe that owns the thread, or by an explicit hand-authored override.

Class transitions are **one-way**: `generic → promoted → threaded`. Demotion requires explicit author action (not automatic).

### How class changes happen

- `generic → promoted` — automatic when a node first appears in rendered player-facing output. Hook: the rendering/narration layer calls `promoteIfGeneric(nodeId, { reason, surfacedAt })`.
- `promoted → threaded` — happens when a recipe tags the node as a narrative thread-participant (flag on the recipe: `threadsNodes: string[]` listing node keys).
- **demotion** — only via hand-authored tooling or a dedicated retirement flow (out of scope for v0).

### The mutability gate

At every content mutation call site (rename, tag change, edge add/remove, class promotion, arbitrary property update), the gate runs before the write commits.

```ts
type MutationContext = {
  recipeId: string                    // which composition is asking for the mutation
  respectsPromoted?: boolean          // recipe explicitly declares it knows it's touching promoted content
  ownsThreads?: string[]              // node IDs this recipe currently threads
}

type GateDecision =
  | { ok: true }
  | { ok: false; reason: "class-violation"; nodeClass: NodeClass; recipeFlags: MutationContext }
```

Gate rules:

- `generic` node → always pass
- `promoted` node → pass iff `mutationContext.respectsPromoted === true`
- `threaded` node → pass iff `mutationContext.ownsThreads?.includes(nodeId) === true`

### The stated-attributes tripwire (v0: author-declared only)

Some fields on a node are "stated attributes" — facts that have been declared on-screen. For v0, stated attributes are explicitly author-declared in the recipe that promoted the node:

```ts
type StatedAttribute = {
  field: string                       // e.g. "leaderName", "homeCity"
  value: unknown
  source: { recipeId: string; firedAt: string /* ISO turn timestamp */ }
}
```

Stored on the node as `statedAttributes: StatedAttribute[]`.

Tripwire check, runs per-field at mutation commit time:

```ts
function checkTripwire(
  nodeId: string,
  fieldWrites: Record<string, unknown>,
  context: MutationContext
): TripwireDecision
```

Rules:

- If the field has no stated attribute → pass (field is free to change).
- If the field has a stated attribute with the same value → pass (idempotent).
- If the field has a stated attribute with a different value → **FAIL with detailed diff**, unless `context.overrideTripwire === true` AND the override carries an author rationale. Override is strictly for hand-authored content mutation; recipes should not use it.
- Compatibility exception: additive changes to collection-valued stated attributes (e.g. adding an item to a list) pass. Subtractive or replacement changes fail.

Tripwire failure output includes:
- Node ID and display name
- Field in question
- Previous stated value + source recipe + turn
- Proposed new value + proposing recipe

This goes to the author's debug log (same channel as find-card logs from THR-223).

### Where the gate lives

Single chokepoint in the content-write layer. **Don't** sprinkle gate checks across every mutation site — wrap every mutation through a single `mutateNode(nodeId, changes, context)` function and run both the gate and the tripwire inside that function. Any existing mutation paths that bypass this function are bugs worth filing separately.

### LLM-backed stated-attribute extraction — NOT in v0

Future work: automatically extract stated attributes from generated prose (LLM reads the turn's narration, identifies which facts the player just learned, writes them back as stated attributes). For v0, stated attributes are only what recipes explicitly declare. A recipe that promotes a node must include a `statesAttributes: StatedAttribute[]` declaration for any fields it wants tripwire protection on.

This means the v0 protection is incomplete — recipes can still write contradicting prose in generated output that the tripwire won't catch because the recipe didn't declare the attribute. That's acceptable for v0; LLM extraction is THR-224's v1.

## Goal

1. Introduce the `nodeClass` property into the content layer (or surface the existing field if one already exists — check first).
2. Implement the one-way class-transition helpers (`promoteIfGeneric`, thread-registration via recipes).
3. Implement the mutability gate at the mutation chokepoint.
4. Implement the stated-attributes tripwire at the same chokepoint.
5. Wire the stubs that THR-222 and THR-223 left into these real implementations.
6. Tests covering all decision paths.

## Approach

1. **Find the mutation chokepoint.** Grep for how content is currently mutated (direct DB writes? A service layer? Prisma/Payload/Sanity client calls?). If there's already a canonical `mutateNode` or equivalent, extend it. If mutations are sprinkled, file a follow-up issue for consolidation and implement the gate at the most-used path for now.
2. **Add `nodeClass` to the content schema.** Default existing nodes to `generic` for now (migration later — out of scope).
3. **Add `statedAttributes` to the content schema.** Default to empty array.
4. **Implement `promoteIfGeneric`.** Hook on the rendering layer (grep for the narration/output pipeline — likely there's a single "render turn output" or "commit narration" function). One-liner: if the rendered output mentions a node by name, call `promoteIfGeneric` on it.
5. **Implement the gate and tripwire.** Pure functions, heavily tested.
6. **Wire into `mutateNode`.** Gate runs before any write. Tripwire runs after gate passes, before commit. Both return structured decisions.
7. **Replace THR-222 and THR-223 stubs.** The gate function that THR-223's find-card calls should now be the real one.

## Output

- `packages/content/mutationGate.ts` (or wherever the content layer lives)
  - `gate(mutation, context) -> GateDecision`
  - `tripwire(fieldWrites, node, context) -> TripwireDecision`
  - `mutateNode(nodeId, changes, context) -> MutationResult` — the wrapped chokepoint
  - `promoteIfGeneric(nodeId, reason)`
- Schema changes to add `nodeClass` and `statedAttributes` to content types
- Tests for gate, tripwire, and the integration path through `mutateNode`
- Hook into the render/narration pipeline for automatic promotion
- Updates to THR-222 validator + THR-223 find-card to use the real gate/tripwire instead of stubs

## Acceptance criteria

- Every content mutation in new code goes through `mutateNode`. Old bypass paths are acceptable but filed as follow-up cleanup.
- Gate decisions are correct for all nine (nodeClass × respectsPromoted × ownsThreads) combinations and tested.
- Tripwire rejects contradicting writes to stated attributes and produces a readable diff.
- `promoteIfGeneric` fires automatically when a node is first rendered on-screen.
- One-way class transitions enforced (tests verify threaded → generic is rejected).
- THR-222 validator no longer uses a stubbed gate.
- THR-223 find-card correctly falls over to CREATED when a promoted node's mutation is rejected.
- README in the content package documents the gate, tripwire, class semantics, and the v1 deferred work (LLM extraction).

## Non-goals

- Do **not** implement LLM-backed stated-attribute extraction. Author-declared only for v0.
- Do **not** implement class demotion or retirement workflow. One-way only for v0.
- Do **not** migrate all existing content to have explicit `nodeClass` values. Default to generic; audit and manual promotion happens later.
- Do **not** rewrite the mutation chokepoint if there isn't one — wrap the most common path and file a cleanup issue for the rest.

## Linear

- This brief: THR-224 — https://linear.app/threadbare/issue/THR-224/node-class-mutability-gate-and-stated-attributes-tripwire
- Unblocks: THR-222 and THR-223 remove their stubs
- Source: THR-219 — https://linear.app/threadbare/issue/THR-219/actors-procedural-floor-authored-layer-for-threaded-agents-brainstorm

## Note for Christian

Iteration candidates for Thursday:
- Whether `generic → promoted` should be automatic-on-render or author-triggered. I went automatic-on-render because it reduces author burden and matches the "observable = promoted" intuition, but it means procedural flavor content that briefly appears in text becomes immutable. You may want a threshold (e.g., promote on second mention, not first).
- Whether the tripwire should default to fail-closed (reject) or fail-open-with-warning (log + allow). I picked fail-closed for v0 because silent contradictions are the worse bug, but you might want this configurable per-recipe.
- Whether `threaded` is really needed at v0. I included it because doom-clock events genuinely thread content for tens of turns, but if it's operationally indistinguishable from `promoted` + thread-ownership-on-recipe, we could simplify.
