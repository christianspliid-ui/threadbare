# Action proposal — the view-model seam (THR-1822)

## intent_quote

From the Linear issue (THR-1822, filed by Christian from the 2026-10-11 UI review):

> **Proposal:** a presentation seam between engine and UI.
> 1. Engine-side selectors (e.g. `src/engine/views/`) produce plain, serialisable view models per subject class: hex, place, person, faction, army, artifact (the Inspector of direction B), per lens (Holdings / Threads / Spheres / Trouble / Trade), and per encounter stage.
> 2. UI components render view models only; no graph access from `src/components/` for any surface migrated to the seam.
> 3. A ratchet counting direct graph queries in `src/components` + `src/hooks` (baseline ~210) — may only go down; wire into `npm run gate` with the THR-1821 ratchet.
> 4. View models are covered by Node tests (no DOM), which also serves Inspectability (NFP 2).

> **Done when:** plan doc defines the view-model types for each Inspector subject class and lens, the selector module layout, the ratchet's counted patterns with today's baseline, and a migration order aligned with the chosen UI direction.

Christian's scope note on the issue, 2026-10-11:

> A Unity port is **exploration only**. … It stands on its **web-game merits**: testable view logic, inspectability, and a smaller GameView. It is not port work. … Nothing here should be sized or prioritised as port preparation.

Christian on the Inspector (THR-1827 decision record, 2026-10-11): "we can build the gating functionality later."

The groundwork brief for this session (attended, 2026-10-14) settles: view models are plain, serialisable objects from pure engine selectors in `src/engine/views/` (no React); caches per session on `SimulationRuntime` keyed on `worldVersion` / `structuralCacheVersion`; place selectors via `sublocationShape.ts`; Node tests per view model; one UI-debt ratchet script owned by THR-1821, THR-1822 names its pattern and baseline; new surfaces built on view models from day one, legacy surfaces migrate when touched or retire with the Inspector, no big-bang migration.

## scope (what this plan does)

Decides the view-model seam end to end and specifies its first build slice. It fixes: what a view model is (plain, serialisable, words not numbers, `WorldRef`s for every name); the `src/engine/views/` module layout; one read path (`ViewSelector` + `readView`) cached per session on `SimulationRuntime` keyed on the runtime counters; the UI glue (`ViewSourceContext`, `useView`) and three debug-bridge accessors; the one knowledge-filter seam (open today for Connections and *In this land*, THR-1832's seen floor for Find, the floor's hex rule for lens marks); one hex contents index; the subject-page VM for every Inspector class (land, Location and Place — both tiers, person, faction, army, artifact, the god's sheet, content card, records, missing) built on the existing `generateDetailPage`; the one Connections builder; *In this land*; the Find index; the four lens VMs (Dominion reused unforked); the Stage VM and lit-hex resolver; the Needs-you VM; the two ratchet patterns with today's measured baseline (197 graph reads, 3 graph writes); a fix so out-of-tick UI writes bump `worldVersion`; and the build order including the GameView split. Slice 1 (THR-1822's own build) is the seam core plus the map's always-on derivations moved out of GameView, with no visible change.

## scope (what this plan does NOT do — explicit non-goals)

- Does not build Christian's knowledge gating (deferred by him); it builds the one place gating will land.
- Does not build the subject pages, Connections, *In this land*, Find, the Threads/Trouble/Trade lenses, the Stage VM or Needs-you in THR-1822's own slice — it types them; each is built with its surface (steps 3–5), so no module ships that only tests read.
- Does not design the Inspector, Stage, lens or frame layouts — those are their decision records and their own plan docs.
- Does not migrate legacy surfaces the Inspector retires (detail column, `LocationView`, sheets, `DetailModal`) — they are deleted by the Inspector build.
- Does not write the ratchet script (THR-1821 owns it); it contributes two patterns and their baseline.
- Does not move notification state into GameState (THR-1825's Law 55 gap).
- Does not add any graph node type, edge type, GameState field or tick phase.
- Not port work; nothing is sized for Unity.
- Does not perform the GameView split in THR-1822; it specifies it and files it as its own ticket.

## impact_class

External (corrected from Reversible after the first judge pass). Slice 1 adds a module tree, one optional runtime field, a context and a hook, moves GameView memos behind selectors with golden-equivalence tests, and moves two UI graph writes into engine functions — all reversible, no player-visible change. It is External because it also adds two counted patterns to the UI-debt ratchet in `npm run gate`'s code track, which every executor lane runs, and it updates canon guidance (`engine.md`, `systems-inventory.md`, `ui-patterns.md`, the frontend-ui skill) that future UI work follows. Not High-risk: no load-bearing decision changes, no new node type, no CLAUDE.md edit, no canon rewrite.

## evidence cited

- **Linear issue:** THR-1822 (and the map THR-1823's *Not yet specified*: "GameView split and migration order")
- **Vision premises invoked:** prose carries mechanics / numbers never reach the player; the map is the table
- **UL terms touched:** canonical and used as the UL defines them — Dominion, Location (outer tier), Place (inner tier, code word sublocation), Area, worldVersion, structuralCacheVersion, SimulationRuntime, WorldRef. **Not yet in the UL** — the direction-B surface nouns this plan turns into code names (Inspector, land page, Connections, In this land, Find, seen floor, map lens, the Stage, Needs you, view model): proposed in **THR-1882** (UL-proposal, filed 2026-10-14 by this session after the first judge pass)
- **Canon pages consulted:** `Docs/canon/engine.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`, `Docs/canon/design-governance.md`, `Docs/ai-index/invariants-and-footguns.md`, `Docs/design-system/laws.md`, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs / records this builds on:** `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`, `2026-10-12-thr-1832-find-anything-decision.md`, `2026-10-14-thr-1830-map-lenses-decision.md`, `2026-10-14-thr-1829-encounter-stage-decision.md`, `2026-10-12-thr-1828-screen-frame-decision.md`, `Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md`, `Docs/plans/2026-05-06-detail-page-data-model.md` (via `detailPageGenerator.ts`)
- **Rejected approaches considered and dismissed:** module-scope caches (rejected approach); keying on graph identity (load-bearing decision); new node types for view models (load-bearing decision); big-bang GameView rewrite (brief)

## load-bearing decisions touched

- Everything is a graph node/edge — respected: VMs are transient derived data, not nodes.
- No inventing node types — respected: none.
- Agent position is three-tier; the sublocation tier is `type: 'location'` + `parentLocationId`; ask through `sublocationShape.ts` — respected: every place read goes through it (`getLocationNodes`, `getPlaceNodes`, `resolveToParentLocation`).
- The world graph is mutated in place — never key change detection on graph identity — respected: keys are the runtime counters.
- Engine caches are owned per session (`SimulationRuntime`) — respected: `viewCache` on the runtime.
- Encounter awareness is hex-granular / distance matrix — not touched.

## high-impact files touched (from Codesight)

- `src/engine/simulationRuntime.ts` — 228 importers (additive optional field) → Blast Radius section present.
- `src/engine/sublocationShape.ts` — 105 importers, read only.
- `src/types/gameState.ts` — 724 importers, not edited.

## kill criteria

- The moved map selectors cannot reproduce GameView's memo outputs exactly on a fixture → stop slice 1's move for that derivation and keep the memo; record why.
- `readView` caching shows stale data in play (a VM not changing after a visible world change) that is not an un-bumped out-of-tick write → the invalidation model is wrong; fall back to building uncached until fixed.
- A measured world-keyed rebuild costs more than a frame on a large map → flip that selector to structure-keyed or split it; if that cannot be done, the lazy-pull model is wrong for it.
- The surface tickets (Inspector, lenses, Stage) find the VM types unusable and re-derive from the graph → the types were wrong; revise this plan rather than letting surfaces bypass the seam.

## explicit user sign-off

Not required (External, not High-risk). The parent attended session made the brief's decisions with Christian present (veto invited in chat).

## author notes for the judge

- The issue lists lens names "Holdings / Threads / Spheres / Trouble / Trade". THR-1830 (settled since) renamed Holdings to Dominion (UL) and ruled Spheres is not a lens (its honest part rides on the Dominion hover). The plan follows THR-1830.
- The issue's baseline "~210" came from a different count (it included debug panels differently). Today's measured figure, with the debug tree excluded and reported separately, is 197 reads in 42 files; with debug it is 277 in 56.
- The issue's point 2 ("no graph access from `src/components/` for any surface migrated") is honoured per surface as it migrates; the ratchet enforces the trend for the rest.
- Choosing to build families with their surfaces rather than all in THR-1822 is deliberate (wiring checklist: a module only tests read is not integrated). The Done-when of the issue is about *defining* types for each class and lens, which the plan does in full.
- Slice 1 has no visible change by design; its UI evidence is "the map is identical" plus a debug-bridge assertion.
- **Revision after judge pass 1 (Revise, 3 GAPs):** dimension 12 — exact words now quoted for rank (the faction's own `rankTiers` names, fallback "member" / "senior member"), the "last seen" line ("Temple Quarter · last seen in Autumn, year 1"; no snapshot → kind word alone), Needs-you groups and held rows, kind words, sizes (`HEADCOUNT_WORDS`, replacing the "15 members" numeral), lens legends. Dimension 3 — `view_fallback` registered in `ui-traces.ts` / `trace.ts`, emitted via `emitTrace` like `ui_ref_opened`; `src/data/view-content.ts` no longer created in slice 1. Dimension 6 — UL-proposal THR-1882 filed. Impact class raised to External. Kill criteria copied into the plan's executor notes; the stale-write fail-soft row reworded. Also: terminology aligned with the UL (Location = outer tier, Place = inner tier, Area); `interruptRegistry.ts` moves at step 4 (needs-you), since the engine may not import from components; a D17 per-family Node-test table added.
- **Revision after judge pass 2 (Revise, 2 GAPs):** dimension 12 — the rank word now has one source, the same call `getAgentInfoCard` makes (`computeRankFromReputation(member_of.reputation, def).name`), not `member_of.rank`; no definition → no rank word (as the card does today); the DetailPage Faction Allegiances chip that prints the raw rank is fixed at its source at step 4, and the D17 predicate no longer freezes the raw value. The rank row names the surfaces it matches. Dimension 9 — `src/types/trace.ts` (119 importers) added to Blast Radius. Optional notes taken: the Needs-you row cites the alert channel's (icon, tick) merge; sign-off line says External.
