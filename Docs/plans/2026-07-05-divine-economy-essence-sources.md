---
status: current
issue: THR-611 (design kickoff + core implementation); rival contestation split to follow-on
supersedes: none (generalizes and extends the existing essence-income substrate; companion to 2026-07-04-flow-web-exploration.md §Essence row)
---

# Divine Economy — Essence Sources & the Find → Claim → Build → Defend Loop

**User directive (Christian, 2026-07-04):** the player needs actions that progress essence income — *finding and building sources of essence through actions and encounters.* Essence today accrues passively; there is no god-play loop that grows it.

**Design frame (from `2026-07-04-flow-web-exploration.md`):** essence income is the **Flow Web extraction test**. This doc must answer the three extraction criteria against the trade web (THR-615) — tier-function shape, anomaly→materialization interface, spotlight budgeting — and state plainly where essence's *secrecy semantics* and *per-sphere typing* diverge. It does; see §Flow Web extraction verdict.

## Ground truth (code inventory, 2026-07-05)

Essence income is **already a source portfolio** — it is just invisible and passive. `computeEssenceIncome` (`src/engine/essenceIncome.ts`, mirrors `influence.ts`) sums per-tick generation from four source kinds and distributes by the ascendant's sphere alignment:

| Existing source | Term | Constant (`src/data/influence-content.ts`) |
|---|---|---|
| Base divinity | flat | `BASE_ESSENCE_PER_TICK = 1.0` |
| Threaded mortals (the faithful) | per thread | `ESSENCE_PER_THREAD = 0.1` |
| Controlled place of power | per `controls` edge to `isPlaceOfPower` location | `ESSENCE_PER_PLACE_OF_POWER = 0.5` |
| Home seat (named higher-yield place of power) | once | `ESSENCE_PER_SEAT = 1.0` |
| Living aspects | per `aspect_of` edge | `ASPECT_ESSENCE_PER_TICK` |

Distribution: primary sphere 35%, secondary 25%, remaining 40% split across other spheres. Maintenance (`TIER_MAINTENANCE` by thread tier) is charged against the primary sphere. `ControlEffect.perTickIncome` can already inject per-sphere income *not* distributed by alignment (`src/types/controlEffect.ts:146`) — the hook a typed source needs.

**Wired:** the income math; `controls` edges; `isPlaceOfPower` as a location property; the essence pool + HUD; sphere-alignment distribution; a per-sphere direct-income channel (`perTickIncome`).
**Decorative / absent:** places of power are seeded but there is **no discovery** (they are simply visible and claimable), **no build/upgrade**, **no defend**, **no per-source sphere typing** (a place of power feeds by *your* alignment, not its own character), **no legibility** of *where* essence comes from, and **no rival contestation** of sources.

**Implication — extend, do not parallel-track (issue directive, load-bearing rule):** an essence source is a *generalization of the place of power*, not a new subsystem. The design adds a property bag and a typed income term; it reuses `controls` edges, `perTickIncome`, the essence HUD, the encounter pipeline, and the chronicle. **No new node types, no new edge types** (load-bearing rule; matches the trade web's P1 discipline).

## Design thesis

Essence income becomes a **portfolio of typed sources the player finds, claims, builds, and defends.** The passive trickle stays (the floor), but the *interesting* essence — the part a run is played around — comes from sources with character: a mountain ley-nexus that pours Force, a martyr's shrine that pours Spirit, a grain-valley faithful-community that pours Life. Each is a graph node bearing an `essenceSource` property bag, linked to the ascendant by the existing `controls` edge, yielding **its own sphere**, at a rate set by its **tier**, which the player raises by acting on it and loses when a rival bleeds it.

Prose-first, plain register (THR-609): the player never sees a float. They see a source described as **Dormant, Flowering, Contested, or Desecrated**, and a portfolio that says *where* their power comes from and *which sphere*.

## The Source Model

An **essence source** is any existing graph node carrying an `essenceSource` property bag. Hosts are existing node types — no invention:

| Source kind | Host node | Sphere typing | Found how |
|---|---|---|---|
| `placeOfPower` (ley-nexus, peak, deep) | location | by locale character (worldgen-assigned affinity) | Perceive/Find in-region; some pre-visible |
| `shrine` (consecrated site) | location or sublocation | by the sphere it is consecrated to (player choice at build) | **built** by a Change verb, not found |
| `faithfulCommunity` | location (settlement) with threaded residents | Life/Spirit (devotion-weighted) | grows from threads; revealed by portfolio scan |
| `relic` | artifact (from ruins) | by the relic's aspect | delve encounter yield (ties the ruin→relic hook) |
| `rite` (recurring observance) | sublocation | by the rite's sphere | established by a Change verb at a faithful site |

`essenceSource` property bag (all data internal to the node → properties, per the load-bearing rule):

```
essenceSource: {
  kind: SourceKind;              // taxonomy row above
  sphereAffinity: SphereName;    // which sphere its income feeds
  sanctity: number;              // private scalar, 0..1 (the Flow Web "stock")
  tier: SourceTier;              // derived public read: 'dormant'|'flowering'|'contested'|'desecrated'
  discoveredBy?: ascendantId;    // secrecy: undefined = not yet found
  contestedBy?: rivalId;         // set when a rival drain scheme is active
}
```

The **existing `isPlaceOfPower: true`** locations are migrated forward: at worldgen (or lazily on first touch) they gain `essenceSource: { kind:'placeOfPower', sphereAffinity: <locale>, ... }`. `ESSENCE_PER_PLACE_OF_POWER` becomes the `dormant`-tier default for that kind, so **existing saves keep their current income** (additive, NFP #6).

**Tier function (the only public read surface):**

| Tier | Sanctity band | Income multiplier | Meaning |
|---|---|---|---|
| `dormant` | 0 – `SANCTITY_FLOWERING_THRESHOLD` | ×1.0 | claimed but unnurtured; base yield |
| `flowering` | ≥ `SANCTITY_FLOWERING_THRESHOLD` | ×`SOURCE_FLOWERING_MULTIPLIER` | built up; full typed yield |
| `contested` | any, while `contestedBy` set | ×`SOURCE_CONTESTED_PENALTY` | a rival is bleeding it; income leaks |
| `desecrated` | forced by a completed rival drain | ×0 (income redirects) | lost until reclaimed |

## The loop — find → claim → build → defend

Each leg is an **existing reach**, gated by the existing prerequisite system (Domain Capability tier + sphere alignment). No new verb *category*; new templates within categories.

- **Find (Perceive / Find reach).** Sources start with `discoveredBy` undefined — invisible on the hex map (fog-consistent). A Find-class action or a **discovery encounter** reveals sources in range. *Find gates Change/Control* (existing prerequisite chain): you cannot claim what you have not found. Ruin delves reveal `relic` sources (ties the relic economy hook).
- **Claim (Control reach).** Establish a `controls` edge ascendant→source. Income begins flowing to the source's `sphereAffinity` via `perTickIncome` (typed, not alignment-distributed). A **Control sustain cost** applies per claimed source (portfolio maintenance — extends the thread-maintenance model).
- **Build (Change reach).** Raise `sanctity` toward `flowering`; or **consecrate** a plain location into a `shrine` (choose its sphere). Build actions and **consecration encounters** are the progression verbs the directive asks for — the player *grows* income, not just collects it.
- **Defend (Control sustain + Ward).** A `contested` source leaks income to the draining rival; **defend actions / warding encounters** restore sanctity and clear `contestedBy`. A fully-drained source becomes `desecrated` and must be **reclaimed** (re-Find if secrecy was lost, re-Claim, re-Build).

## Income curve & diminishing returns

The portfolio must not be a stack-infinitely spreadsheet. Typed source income is summed, then **diminishing returns** apply across portfolio depth so the 10th source of a sphere is worth less than the 1st — pushing the player toward *breadth and defense* over hoarding (and giving rivals a reason to target your keystone source). All tunable:

`sourceIncome = Σ_sources [ BASE_SOURCE_INCOME[kind] × tierMultiplier(tier) × DR(depthInSphere) ]`
where `DR(n) = SOURCE_DR_BASE ^ n` (n = rank of this source within its sphere, richest first).

## Rival contestation (coordinates with THR-66 rival substrate)

THR-66 shipped rival activation via **multi-phase schemes** on the shared arc substrate; the deferred **economic scheme family** (THR-619) culminates in *starve-the-faithful*. Essence sources are the **object those schemes act on**: a rival scheme phase sets `contestedBy` on one of the player's sources (→ `contested` tier, income leak); a completed drain phase flips it to `desecrated` and redirects income to the rival's pool. This is designed here as the **source-side interface** (property transitions + traces + anomaly seeds); the rival-side scheme phases that drive it are **split to a follow-on issue** (mutex with THR-619 / rival descendants — see §Handoff split). The player's counter-play is the **Defend** leg above: same web they already understand.

## Flow Web extraction verdict (deliverable to the THR-618 checkpoint)

Essence measured against trade (THR-615) on the three criteria:

| Criterion | Agree with trade? | Notes |
|---|---|---|
| (a) Tier-function shape | **Yes** | coarse public tiers over a private scalar; identical pattern (`dormant/flowering/contested/desecrated` vs `scarce/adequate/surplus`) |
| (b) Anomaly→materialization via curator | **Yes** | tier transitions emit materialization candidates through the same attention/curation budget; equilibrium is silence |
| (c) Spotlight budgeting | **Diverges** | trade spotlight-caps hundreds of locations; essence sources are **few and player-owned**, updated **every tick** (no cap needed) — different cadence |
| Secrecy semantics | **Diverges (essence-only)** | `discoveredBy` fog + hidden rival drains have no trade analogue |
| Per-sphere typing | **Diverges (essence-only)** | each source yields *its own* sphere; trade tiers are sphere-agnostic |

**Recommendation for THR-618:** **partial extraction.** Extract the shared two-thirds — the tier-function contract and the anomaly→materialization interface — as the reusable Flow Web core. Keep **source-income derivation, secrecy, and per-sphere typing as an essence-specific layer** on top. Per the exploration doc's own rule ("if essence needs fundamentally different update cadence or secrecy semantics, do not force it"), a single all-consuming abstraction would be leaky here; two clean layers (shared tier/anomaly core + per-consumer income/secrecy) is the right seam. This verdict is the THR-618 checkpoint input; THR-618 remains the extraction owner.

## Three pillars

**Engine.**
- `essenceSource` property bag on host nodes; forward-migration of `isPlaceOfPower` locations (lazy, additive).
- Source-income term folded into `computeEssenceIncome` — typed per-sphere via the existing `perTickIncome` channel; DR across portfolio depth; contested/desecrated multipliers. The four existing terms are untouched (base/thread/seat/aspect stay; place-of-power becomes the `dormant` default of the `placeOfPower` kind).
- One **source tick phase** (batched, cheap — sources are few): recompute `sanctity`→`tier`, emit tier-transition anomalies, apply contested leaks. Registered in the orchestrator + wiring checklist.
- Find/Claim/Build/Defend templates wired through the existing prerequisite system (reach + Domain Capability + sphere checks); Control sustain cost per source.
- Rival contestation *interface* (property transitions + traces); rival-side scheme phases split to follow-on.
- `touchWorld()` on tier changes and `controls`-edge changes (they feed encounter scoring + income HUD — `locationSubtype` precedent). No `touchStructure()` (no distance-matrix impact).
- Deterministic: derivations pure; PRNG only in discovery-encounter selection, seeded.

**Content.**
- Source taxonomy table (`src/data/essence-sources.ts`, new): kinds × sphere-affinity rules × tier prose fragments × `BASE_SOURCE_INCOME` per kind.
- **Discovery encounters** (a Find reveals a source; ruin delve reveals a `relic` source), **consecration/build encounters** (raise sanctity; consecrate a shrine to a chosen sphere), **defend/warding encounters** (clear `contestedBy`). Systemic-linear first; branching flagship per kind later.
- IPK keywords: **Flowering, Contested, Desecrated, Dormant** (baseline plain register, THR-609).
- Chronicle prose for source flowering / desecration / reclamation — new entries via the existing chronicle pipeline; check the enrichment-placeholder capability list before adding any new placeholder.
- Codex entries for the five source kinds.

**UI.**
- **Hex map source signifiers** with per-tier state color; hidden until `discoveredBy` is set (fog-consistent) — verify via **Claude-in-Chrome** (WebGL, HexMapV2 signifier layer).
- **Portfolio income-by-source panel** extending the existing essence HUD: per-sphere breakdown showing each source, its tier, and its contribution — so a rival draining a keystone source is *visible as a falling line*, not a hidden number — verify via **Playwright** (DOM).
- Chronicle entries for tier transitions (ride the existing chronicle phase).
- DebugPanel **essence-sources tab** (source list, sanctity, tier, controls edges, contested state) + `__DEBUG` state assertion.

**Wiring.** Source tick phase → orchestrator + `Docs/plans/wiring-checklist.md`. GameState: prefer node-local properties; a top-level portfolio cache only if profiling demands it (additive field). Traces below. Systemic wiring guide gains the **source-discovery encounter-seed** capability. **Game Manual Wiki:** the essence/divine-economy page updates with this system (it currently documents only passive regen) — ships with the core issue.

## Constants (named, tunable)

| Constant | Default | Purpose |
|---|---|---|
| `SANCTITY_FLOWERING_THRESHOLD` | 0.6 | dormant→flowering tier boundary on normalized sanctity |
| `SOURCE_FLOWERING_MULTIPLIER` | 2.0 | income multiplier at flowering tier |
| `SOURCE_CONTESTED_PENALTY` | 0.4 | income multiplier while contested |
| `BASE_SOURCE_INCOME` (per kind) | placeOfPower 0.5 / shrine 0.4 / faithfulCommunity 0.3 / relic 0.6 / rite 0.25 | base per-tick yield by kind (placeOfPower keeps legacy 0.5) |
| `SOURCE_DR_BASE` | 0.8 | diminishing-returns base; nth source in a sphere worth 0.8ⁿ⁻¹ |
| `SOURCE_CONTROL_SUSTAIN` | 0.15 | per-source per-tick maintenance (charged to primary sphere) |
| `SANCTITY_BUILD_PER_ACTION` | 0.15 | sanctity gained per successful Build action |
| `SANCTITY_DRAIN_PER_TICK_CONTESTED` | 0.02 | sanctity lost per tick while contested and undefended |
| `SOURCE_DISCOVERY_RANGE_HOPS` | per-reach awareness | hex range a Find action reveals sources within |

## Tracing (TypeScript interfaces at implementation)

`source_discovered` (source, ascendant, kind, sphere), `source_claimed` / `source_lost` (source, cause), `source_tier_change` (source, from, to, cause), `source_income_contribution` (source, sphere, amount, drMultiplier — every essence unit attributable, NFP #2), `source_contested` / `source_desecrated` / `source_reclaimed` (source, rivalId). Rival-driven transitions cross-reference the rival scheme trace.

## Fail-soft

| Failure | Behavior |
|---|---|
| Source references unknown kind | ignored + single warn trace; worldgen validation flags at generation |
| `isPlaceOfPower` location without migrated `essenceSource` bag | lazy-migrate on first touch to `dormant` placeOfPower default; income unchanged |
| Source host node destroyed (location razed) | source auto-released; `controls` edge pruned; `source_lost` trace; no throw |
| Income derivation missing sphereAffinity | falls back to alignment distribution (legacy place-of-power behavior), warn trace |
| Contested source whose rival scheme orphaned | tier resolves to `dormant` (drain ends), `source_reclaimed` trace |
| Discovery encounter selection with empty pool | no reveal that tick, no throw |

## NFP Compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all thresholds/multipliers/DR/costs named constants |
| 2 Inspectability | PASS — per-source income contribution traced; DebugPanel tab; portfolio UI makes the *why* legible to the player, not just the trace |
| 3 Determinism | PASS — derivations pure; PRNG only in seeded discovery-encounter selection |
| 4 Fail-soft | PASS — table above; source phase never throws; lazy migration keeps legacy income intact |
| 5 Narrative over mechanical | PASS — coarse tiers + IPK vocabulary; no floats surfaced; discovery/build/defend land as encounters |
| 6 Additive | PASS — four existing income terms untouched; `essenceSource` is an additive property bag; place-of-power income preserved as the dormant default; no schema removals |
| 7 Performance budget | PASS — sources are few and player-owned; source phase batched and uncapped by design (divergence from trade spotlight cap is justified, not a regression) |

## Blast Radius

- `src/engine/graph.ts` (531 importers) — **zero new node/edge types**; `essenceSource` is a property bag on existing nodes, `controls` edges already exist. No schema ripple.
- `src/engine/essenceIncome.ts` / `influence.ts` — the income computation gains a source term; **the four existing terms are read-only in this change**. Contract tests must assert legacy income (base/thread/seat/aspect/place-of-power) is unchanged for a save with no built sources.
- `src/types/influence.ts` / `controlEffect.ts` — reuse `perTickIncome`; no new income channel type.

## Rulebook impact

Yes. Find → Claim → Build → Defend on essence sources is a **rule of play** (new prerequisite-gated verbs + a resource loop). `Docs/canon/rulebook.md` gains a **Divine Economy / Essence Sources** section ([IMPL] entries as they ship); `rulebook-quick-reference.md` gains the four-leg loop line when the core verbs land. Update in the same PR as the core issue and re-verdict the affected section.

## Vision audit

Consistent with settled Vision: essence sources are *former-mortal power made spatial and contestable*, not a city-builder economy; income is legible as **story** (a shrine flowers, a rival bleeds it) not as a dashboard. Reinforces "emergence is the ingredient, authorship is the kitchen" — sources materialize discovery/defense *chapters* through the curator, they do not spam. No Vision premise is contradicted or updated.

## Handoff split

- **Core (THR-611 → Ready for Dev):** source model + forward migration; typed source-income term + DR; source tick phase; Find/Claim/Build/Defend templates; discovery/consecration/defend encounters; portfolio UI + hex signifiers + DebugPanel tab; chronicle + IPK + codex; rulebook + manual-wiki update. A complete, shippable three-pillar unit that delivers the directive ("find and build sources of essence").
- **Follow-on (new Todo issue, Divine Economy project):** **rival-side contestation scheme phases** that set `contestedBy` / drive desecration — deliberately deferred to land *with or after* the rival economic-scheme descendants (THR-619 family). **Mutex with THR-619**; depends on the core source interface shipping first. The source-side *interface* (property transitions, traces, Defend counter-play) ships in core so the follow-on is pure rival-side wiring.
