# The registry reads the edges the world writes — Brainstorm Companion

**Plan:** `Docs/plans/2026-09-08-thr-1436-registry-reads-writers-edges.md` · **Issue:** THR-1436 · **Written alongside, 2026-09-08**

## Considered alternatives

1. **Write the edges the registry reads** (a `leads` edge for every faction at worldgen, an `owns` edge for every companion, a `reputation_with` edge for every pair). Rejected — Christian's rule for this class: *"prefer registering the edge the writer already uses over inventing a new writer."* Every one of these would be a second truth beside the one the engine derives; `leads` in particular is the succession phase's to write, and stamping it at seed would make every faction read as *anointed*.
2. **Keep Condition as a node object and cure by (actor, target) lookup** — pass the target through `ctx.targetNodeId` and remove that bearer's edge. Rejected — the object is genuinely the bearing (the catalogue says so), and a node object that is shared by many bearers gives `ownershipOf` an answer that is wrong for every bearer but one. The edge shape makes the seal, the curse and the wound the same kind of thing to cure.
3. **Un-gate the cure entirely.** Rejected — lifting an enemy's seal for free removes the counter-play THR-1429 built; the sign is the gate, as it is for the curse.
4. **Widen `isItemObject` by `possesses` presence** (an item is an object only if someone holds it). Rejected — the 1–2 world artifacts on a Location are unheld *and* are exactly what `claim × Item` is for.
5. **Mint the route identity inside `createTradeRoute`.** Rejected — `createTradeRoute` is called by the god's economic cards and the faction lane through `tradeRouteOps`, whose consumers read the edge; minting a Location node inside an edge op changes what six callers get back. The helper is shared; the callers opt in.

## Tensions surfaced

- **Sovereignty vs. reachability.** Making ownership readable makes the counter-play verbs fireable against things the world already has; the motive gate is what keeps that from being random violence. The one exemption this plan adds (the cure for allies) is the mirror of the one gate THR-1429 added (the curse), and both read the same `isAlly`.
- **Shared definitions vs. per-bearer verbs.** THR-1395's rule (shared trait definitions, state on the edge) is right for the graph and had one unconverted consumer — the cure. This plan converts it; the seal's reader (`isSpellSuppressedFor`) had already been written the edge-aware way.

## Vision premises invoked

- `02-non-negotiables.md` §4 — everything is a graph node/edge; the registry reads what is there.
- `02-non-negotiables.md` §1 — the god is not the protagonist; no player verb changes.
- `03-design-tensions.md` §2 — systemic emergence: cells fire because the world holds what they act on, not because a table says so.
