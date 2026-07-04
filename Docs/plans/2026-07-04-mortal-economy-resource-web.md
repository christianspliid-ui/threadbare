---
status: current
issue: THR-615 (P1); phases P2–P4 tracked as THR-616/617/618
supersedes: none (activates and extends the existing prosperity/trade substrate; TB-074 brainstorm is the vault companion)
---

# Mortal Economy — The Resource Web

**User directive (Christian, 2026-07-04, chat):** the economy is very simple — few resources, not used in trade routes or to influence spheres, factions, or power. Design an expansion that fits the pattern; proposing new systems or pattern changes is welcome.

## Ground truth (code inventory, 2026-07-04)

**Wired:** `trades_with` edges with volume decay, prosperity bonuses, **and an existing `goodsType` property** (`src/types/graph.ts:97`, `edgeSchema.ts:362`); settlement prosperity (equilibrium-drift model with shocks) gating sublocations and encounter scoring; agent wealth (0–100) driving trait assignment; sphere pressure → prosperity modifiers; an **economic chronicle pipeline** (`src/engine/economicChronicle.ts`, `phaseEconomicChronicle.ts`, `src/data/economic-chronicle-content.ts`) with authored prose incl. `monopoly_established`/`monopoly_broken` and `{resource}`/`{goodsType}` placeholders; an `establish-monopoly` action writing `monopolyControlledBy` (`action-template-content.ts:517`); a **`resource` node type and `controls` edge type already in the schema** (`graph.ts:23, :64`).
**Decorative or partially wired:** resource nodes seeded at worldgen with quantities that never change; monopoly state written by one action but never resolved systemically; agent wealth static in decisions; chronicle prose exists but the underlying flows it narrates are thin.
**Absent:** faction wealth aggregation, supply/demand, stock levels that matter, economy → sphere feedback, divine economic verbs.

**Implication:** even more of this design is activation rather than construction. P1 must extend `goodsType` (not duplicate it), reuse the economic chronicle for narration (not re-author it), and wire the existing `resource` nodes + `controls` edges (not invent new types).

## Design thesis

Do not build a parallel economy simulation. **Activate the decorative layer and couple it to the systems that already read state.** Resources become the visible, tradeable, contestable *why* behind prosperity — and prosperity remains the single scalar that downstream systems read (additive, NFP #6). Every coupling below rides an existing system; the economy earns its place by feeding encounters, factions, spheres, and doom — not by being a spreadsheet.

Prose-first: the player never sees prices or floats. They see a granary described as full or empty, a road described as busy or dangerous, and IPK keywords — **Famine, Glut, Monopoly, Embargo** — carrying the mechanical weight.

## The Resource Model

**Resource classes** — one data-driven table (`src/data/resource-classes.ts`, new), ~12 classes, each with a **sphere affinity** that makes economy cosmologically legible:

| Class (examples) | Sphere affinity | Note |
|---|---|---|
| Grain, livestock | Life | staple; famine driver |
| Timber | Life/Matter | building; siege fuel later |
| Iron, stone | Matter | tools, war |
| Silver, gems | Matter | wealth concentration, monopoly-prone |
| Horses | Force | movement, war |
| Salt, dyes, spice | Time (preservation) / Mind (luxury) | long-route goods |
| Incense, relics | Spirit | temple economies; bridges to essence (THR-611) |
| Scrolls, lore-goods | Mind | scholar economies |

(Exact table settled at implementation; the *shape* — class + sphere affinity + base value + scarcity sensitivity as named constants — is the commitment.)

**Deposits and production.** Deposits are the **existing `resource` nodes** worldgen already seeds. Class membership is a node property (`resourceClass`, keyed into the classes table — properties are for data internal to a node); location↔deposit and faction↔deposit relationships use **existing edge types** (located_at-family for placement, `controls` for ownership). **No new node or edge types in P1.** Quantities and stock tiers are node properties. Step 0 verifies the exact seeded shape and the located_at wiring before any code.

**Stocks are coarse tiers, not floats:** each producing/consuming location tracks per-class balance as a tier — `scarce | adequate | surplus` — derived from production minus consumption (consumption from population/sublocation counts). Tiers are what prose, encounters, and IPKs read. The underlying scalar exists for tuning but never surfaces.

## Flows — trade routes carry named goods

`trades_with` edges already carry `goodsType`; P2 **extends it** to a multi-class manifest (additive property evolution, `goodsType` remains readable for legacy paths). Route formation and decay already exist; the richer manifest makes routes *about specific scarcities*, which unlocks:

- **Route events as encounter seeds** — banditry on the iron road, an embargo on river salt, a toll war. Caravans are **not agents**: they are route state that materializes into an encounter when attention warrants (spotlight pattern, NFP #7 — no per-caravan simulation).
- **Balance-driven formation** — a scarce/surplus pair within range biases new route creation (existing lifecycle, new scoring term).

## The couplings (the actual point)

1. **→ Prosperity:** net resource balance becomes one term in the existing equilibrium-drift model (named weight constant). Prosperity stays canonical; nothing else reads raw stocks.
2. **→ Factions:** factions gain `controls` edges (existing type) over deposits and routes; faction power gains an economic term; the half-wired **monopoly state finally resolves systemically** — the `establish-monopoly` action's `monopolyControlledBy` gets a tick-phase resolution (control fraction check → Monopoly state → encounter seeds, unrest pressure), and the existing `monopoly_established`/`monopoly_broken` chronicle prose finally narrates real state transitions.
3. **→ Spheres:** sustained flows drift **local sphere pressure** toward the resource's affinity (grain valley drifts Life; a war-iron corridor drifts Matter/Force). This closes the absent economy→sphere feedback using the existing sphere-pressure storage — the map's cosmology slowly reflects its livelihoods.
4. **→ Agents:** where spotlighted, agent wealth becomes dynamic (merchants rise and fall with their routes); scarcity raises need pressure through the existing Maslow pipeline — famine makes desperate people, desperate people make encounters.
5. **→ Doom and events:** scarcity spirals run as **phase-runner arcs** (THR-225 pattern): shortage → hoarding → unrest → flashpoint. A half-averted famine is canonically a half-averted famine (cool failure).
6. **→ Divine verbs (Phase 4, bridges THR-611):** bless harvest, blight a field, reveal a vein, guide a caravan, sour a mine — reach/sphere-prerequisited templates that intervene *on the web*, so economic play feels like god-play, not city-builder menus.

## Pattern proposal — the Flow Web primitive (recommended, staged)

The shape underneath — *stocks at nodes, flows along edges, coarse tier signals, encounters materializing on anomaly* — is not economy-specific. The same primitive can carry essence income (THR-611), information/rumor flow (intelligence system), and army supply (THR-614 follow-up). Precedent: the phase runner started as doom-event plumbing and is becoming the shared arc substrate.

**Recommendation:** build Phase 1–2 concretely for trade (no premature abstraction), then extract the Flow Web primitive when the second consumer (Divine Economy) confirms the shape. Design expansively, implement conservatively. If extraction succeeds, it becomes a named load-bearing pattern in CLAUDE.md.

## Player experience spine (per phase: what the player SEES, DOES, FEELS)

This is a computer game — every phase must land in the player's hands, not just in the graph. (User directive, 2026-07-04: UI and player interaction + game design thought into every feature, not just the system of record.)

| Phase | Sees | Does | Feels |
|---|---|---|---|
| P1 | Livelihood line on locations; chronicle entries on tier crossings; **thread tug when a threaded agent's home crosses into Famine/Glut** | Reads the world; follows a tug into a scan (Beat 1 material) | "The world has livelihoods, and my people live in them" |
| P2 | Route lines carry cargo (tooltips); route events surface as encounters | **Two starter divine verbs — Bless Harvest, Blight** (pulled forward from P4); leans on route-event encounters | "I can touch the harvest; roads are stories" |
| P3 | Monopoly/embargo chronicle beats; sphere drift visible in local color; scarcity arcs become chapters | Intervenes in scarcity arcs at any phase (arc encounters); backs or breaks a monopoly through encounter play | "Economic pressure is a plot I'm inside of" |
| P4 | Full verb set; essence-source income surfaces | Full economic god-play (reveal vein, guide caravan, sour mine) integrated with essence economy | "Economy is one of my instruments" |

Rule for every hook in the companion exploration doc: name its player surface before implementation, or it doesn't ship.

## Phasing

- **P1 — Resource activation (implementable from this doc):** resource-classes table; Step-0 substrate verification; stock tiers on locations; prosperity coupling term; prose tables + IPK keywords (Famine/Glut, baseline register per THR-609); **livelihood thread tug** (tier transition at a threaded agent's home location → existing tug system — the economy enters the player's turn loop on day one); CLI (`eval`, `status`) + DebugPanel economy visibility; worldgen sanity pass.
- **P2 — Trade cargo & route events + first player verbs:** manifests on `trades_with`; balance-driven route scoring; route-event encounter seeds; caravan materialization; **Bless Harvest and Blight as reach/sphere-prerequisited templates** (moved up from P4 — the player must be able to act on the economy as soon as it visibly moves).
- **P3 — Power couplings:** faction control + economic power term + monopoly resolution; local sphere-pressure drift; scarcity arcs on the phase runner (arcs must expose intervention points as encounters, not run as cutscenes).
- **P4 — Full divine economic verb set + essence bridge** (coordinates with THR-611 design).

Each phase is separately shippable and separately valuable; P1 alone makes the world's livelihoods real, visible, *and felt through the thread*.

## Three pillars

**Engine:** resource class table; per-location stock tier derivation (one tick phase, batched, spotlight-scoped); prosperity term; (P2) route manifest + scoring term; (P3) faction economic power term, sphere drift, monopoly resolution phase; all deterministic from seeded PRNG where randomness is needed.
**Content:** class definitions with prose fragments per tier; route/scarcity/monopoly encounter templates (systemic linear first, branching flagship per arc later); IPK entries. **Reuse the economic chronicle content** — `{resource}`/`{goodsType}` placeholders already exist; new prose fills gaps, never re-authors existing entries. New placeholders only after checking the enrichment capability list.
**UI (phase-tagged):** *P1:* location detail **Livelihood** line (prose, tier-driven) + DebugPanel economy tab (stocks, monopolies) — verify via **Playwright** (DOM). *P2:* route tooltips with cargo (existing route rendering on HexMapV2) — verify via **Claude-in-Chrome** (WebGL). *P1:* chronicle entries for tier-threshold crossings ride the existing economic chronicle phase. *P3:* codex entries for resource classes.
**Wiring:** tick phase registered in orchestrator + wiring checklist; traces (below); **versioning: stock-tier changes and monopoly transitions call `touchWorld()`** (they affect encounter scoring inputs, per the `locationSubtype` precedent) — no `touchStructure()` (no distance-matrix/structural cache impact); systemic wiring guide gains the new encounter-seed capability if P2 adds one; **Game Manual Wiki economy page ships with P1** (user directive 2026-07-04 — no wiki page exists for the economy today; the page documents the activated system, not the current stub).

## Constants (named, tunable — representative)

| Constant | Default | Purpose |
|---|---|---|
| `RESOURCE_BALANCE_PROSPERITY_WEIGHT` | 0.15 | share of prosperity drift from resource balance |
| `STOCK_SCARCE_THRESHOLD` / `STOCK_SURPLUS_THRESHOLD` | −0.3 / +0.4 | tier boundaries on normalized balance |
| `ROUTE_FORMATION_BALANCE_BIAS` | 0.25 | scarce↔surplus pair bonus in route scoring |
| `MONOPOLY_CONTROL_FRACTION` | 0.6 | regional control fraction that triggers Monopoly |
| `ECON_SPHERE_DRIFT_PER_TICK` | 0.002 | local sphere pressure drift per sustained flow |
| `ECON_PHASE_SPOTLIGHT_CAP` | 40 | max locations processed per tick at full detail |

## Tracing

New trace types (TypeScript interfaces at implementation): `resource_stock_tier_change` (location, class, from, to, cause), `route_cargo_assigned`, `monopoly_formed` / `monopoly_broken`, `econ_sphere_drift`, `scarcity_arc_phase` (rides phase-runner traces). Every prosperity contribution from resources is attributable in the trace (NFP #2).

## Fail-soft

| Failure | Behavior |
|---|---|
| Deposit references unknown class | ignored + single warn trace; worldgen validation flags at generation |
| Route without manifest (legacy saves) | legacy behavior (volume-only), no cargo events |
| Stock derivation missing inputs (no population data) | tier freezes at `adequate`, warn trace |
| Spotlight cap exceeded | remaining locations coarse-updated (tier-only, no events), never skipped silently |
| Phase-runner arc orphaned (location destroyed) | arc resolves to its current phase's canonical half-state |

## NFP Compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all weights/thresholds named constants |
| 2 Inspectability | PASS — attributable traces per coupling; DebugPanel tab; CLI eval paths |
| 3 Determinism | PASS — derivations pure; PRNG only in route/event selection, seeded |
| 4 Fail-soft | PASS — table above; tick phase never throws |
| 5 Narrative over mechanical | PASS — coarse tiers + IPK vocabulary; no visible numbers; encounters are the output |
| 6 Additive | PASS — prosperity remains canonical scalar; manifest/properties additive; no schema removals |
| 7 Performance budget | PASS — spotlight-scoped phase, batched tier derivation, caravans as state not agents |

## Blast Radius

- `src/engine/graph.ts` (531 importers) — **P1 commits to zero new node/edge types** (resource nodes and `controls` edges exist). Only P2's manifest evolution touches edge property types (additive). If any later phase concludes a new edge type is genuinely needed, that is a separate full design per the load-bearing rule — not a quiet addition.
- `src/types/gameState.ts` (345 importers) — one additive field if a top-level economy cache is needed; prefer locality (location properties) first.

## Rulebook impact

Yes (P2+): trade routes and economic verbs become rules of play. `Docs/canon/rulebook.md` gains an Economy section at P2 landing ([IMPL] entries only as they ship); quick-reference updated when divine economic verbs (P4) arrive. P1 is world-simulation, not player-facing rules — no rulebook change.

## Forked-audit verdicts

Combined intent-judge + load-bearing/NFP/three-pillar audit (2026-07-04, subagent): initial verdict **Revise** with four required fixes — (1) stale ground-truth inventory (existing `goodsType`, economic chronicle pipeline, `establish-monopoly` action, `resource` node + `controls` edge types were missed); (2) incoherent "yields-style edge to a table entry" resolved to existing resource nodes + property classing; (3) touchWorld/touchStructure participation named (touchWorld on tier/monopoly changes, no touchStructure); (4) UI list phase-tagged with named verification tools. All four integrated. Intent finding: PASS — delivers resources/trade/sphere-faction-power coupling as expansion of the current system, not a parallel sim; Flow Web proposal responsibly staged. NFP #7 scoping judged real (spotlight cap + coarse fallback, caravans as state). P4 verbs stay god-actions. Post-fix status: **Allow**.
