# Brainstorm companion — shared anchor machinery (THR-1212)

Companion to `Docs/plans/2026-08-27-shared-anchor-machinery.md`. Alternatives considered, tensions surfaced, premises invoked. The wayfinder map (THR-1157) already carried the heavy grilling — THR-1163 was the map's closing grill, ruled live by Christian 2026-08-22 — so no separate grill-me pass was run for this doc; its open calls arrived pre-enumerated ("absorbed rulings"), and this companion records how each was decided.

## The name

`anchor` is taken (`EntityNotice.anchorId`/`anchorKind`, plus `anchorLocationId`, draw_together's "anchor"). Candidates weighed:

- **`EntityRef`** — accurate but collides softly with `HexEntityRef` and half the codebase's `*Ref` React idiom; also "entity" undersells hexes/journeys/receipts, which are not entities in the graph sense.
- **`GameObjectRef` / `ObjectRef`** — "object" is the program epic's word ("generated object vocabulary") but `GameObject` drags Unity connotations and `ObjectRef` reads as JS plumbing.
- **`WorldRef`** (chosen) — a reference to something in the live world; no collision (grep-verified 2026-08-27); pairs naturally: `WorldRefKind`, `resolveWorldRef`, "the ref resolves in this world" is literally the gate's question. Migrating `EntityNotice.anchorId` first (the alternative the substrate inventory floated) was rejected as gratuitous churn — the notice field is live and correct; renaming it to free a word is destruction for vocabulary's sake (NFP #6).

The name ships through a UL-proposal rather than by fiat — UL wins on terminology, and the term needs a shard entry either way.

## Hub-and-spoke vs replacement

Two readings of the map's "normalises the four shapes":

1. **Replacement** — `WorldRef` swaps in for `NavigationTarget`, `EntityVisualRef`, `EncounterAftermathConceptRef`, and the segment quadruple, consumers migrate now.
2. **Hub-and-spoke** (chosen) — `WorldRef` is the normal form behind adapters; wire shapes stay; the *kind vocabulary* unifies immediately via the coverage lint; shapes converge when their seam is chartered.

Replacement fails three tests at once: the strangler rule (big-bang by definition — four unions, dozens of consumers); the pilot's own evidence (`EncounterAftermathConceptRef` survived contact with real content *unchanged*, which is a fact about wire-shape stability worth keeping); and NFP #6 (additive over destructive). The cost of hub-and-spoke is adapters — ~4 small functions — and the risk that the hub becomes a fifth sibling instead of a normal form. The coverage lint is the mitigation: every union is mechanically accounted a projection of `WorldRefKind`, so divergence is a named build failure, not drift.

## One id field vs a structured binding discriminant

A `binding: 'literal' | 'sentinel' | 'live'` discriminant beside `id` was considered and dropped: the pilot shipped sentinels-in-the-id-field and the shape survived; `$` prefix is already the discriminant; a second field would need migration of every existing declaration for zero information gain. The claims-vs-reports rule (authored content may not carry live node ids) is a *gate* rule, not a type-shape rule — the type cannot enforce it anyway (a string is a string), which is exactly the pilot's static-necessary-never-sufficient lesson.

## The chips remainder — why not close G1 further before the wave

The pilot posed carrier-anchoring vs closing `$spawned:` as the deliberate call. Between the pilot and this doc, the two worst specificity losses got their sentinels shipped (`$target` THR-1130, `$artifact` THR-1275) — so the fork the pilot described has partly dissolved. Inventing the general `$spawned:<reactionId>` form now, ahead of content that needs it, fails the sunset/evidence discipline (machinery ahead of demonstrated need is how gates accrete); the ledger + catalog make the remaining gap *visible*, and the standing defect-evidence rule charters it when a real chip hits it. Carrier-anchoring stays lawful where the object has no authorable id — the alternative (banning it) would fold hundreds of legitimate consequences into prose to satisfy a purity rule, which is Law-56 zeal defeating NFP #5.

The 443: a big-bang sweep was rejected on the pilot's own cost split (prose tax dominates on fiction-shaped files; ~50% of the population is cheap-mechanical but the rest is not) and on the factory line already existing as the retrofit vehicle. The ratchet converts "someday" into "monotonic": the count can only fall.

## The ledger's grain

Three candidate grains for the reachable-consumption ledger: interface-map rows (subsystem×file — too coarse, the substrate inventory's own verdict), per-entity write records (a runtime ledger — a simulation feature, massively out of scope), and per-*write-vocabulary-member* (effect kinds + GraphOp ops — chosen). The chosen grain is exactly where the three measured corpses lived (`hungerResonance`, mandate prose, `followOnTags`): all were vocabulary members whose consumer was absent or unreachable. Per-operand enforcement (the Grateful Kin lesson) deliberately stays in per-seam helper guards; a ledger that tried to encode operand constraints as data would be a type system written in markdown.

## followOnTags: wire vs delete

Mandate milestone prose got "wire, not delete" (ruled at the sitting, shipped same day) because the campaign spine *should* narrate — the write was good, the consumer was missing. followOnTags is the opposite shape: three tag conventions, no consumer ever designed, tests asserting the write side only. Wiring it would mean inventing a consumer to justify a field — machinery ahead of need again. Delete, with the ledger row as tombstone and the falsification check (the ledger must find it unprompted) keeping the demonstration honest.

## Taxonomy home

UL-only was considered (cleanest single authority) but the interface map is where `write-without-consumer` violations are actually *worked* (LEAKED→Deferral); a taxonomy the working surface can't cite breeds the parallel vocabulary the addendum warned about. Interface-map-only was rejected because the map has no concept for content-claims and the UL is the ratified terminology authority. Chosen: UL defines, map badges point. One new badge, not three — two classes are already covered by existing badge semantics.

## Codex arm

Designing the in-game codex surface inside this doc was considered — it is the only way to give `NavigationTarget` a real codex arm now — and rejected as a pillar-sized UI effort smuggled into a machinery doc (it needs its own UI-Laws pass, layout work, and a Christian-facing review loop). The reserved-kind + Deferral route keeps the gap visible in the generated authority, which is the map's "not silently dropped" requirement satisfied structurally rather than by promise.

## Tensions accepted

- **Fail-loud generators under a fail-soft NFP.** Deliberate, precedented (anchor catalog header documents it): NFP #4 governs the tick loop; a partial authoring authority silently under-reporting legal anchors makes authors fold anchorable chips.
- **No tick traces from a "typed game-state" plan.** The machinery is build-time and render-time; inventing a trace to satisfy the checklist would be gate theater. The `__DEBUG` drop log is the honest observable.
- **The word `agent` wins over the graph's `actor`.** The graph keeps its storage vocabulary; the canonical kind union speaks the player-facing word. The adapter is where the two meet, and the catalog documents the mapping — a rename of the graph layer was never on the table (531 importers).
