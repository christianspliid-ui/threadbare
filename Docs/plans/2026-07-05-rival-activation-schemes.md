# THR-66 — Rival Activation via Multi-Phase Schemes

**Status:** Design (→ Ready for Dev)
**Project:** Thematic Pressure & Living World
**Author:** Cowork (autonomous scheduled session, 2026-07-05)
**Issue:** [THR-66](https://linear.app/threadbare/issue/THR-66)
**Design direction settled by Christian in the 2026-07-04 roadmap review** (THR-66 comments) and the Flow Web exploration (`Docs/plans/2026-07-04-flow-web-exploration.md` §Part 2 hook #3).

## What this is

Rivals exist and are generated well (`generateRivals` in `src/engine/rival.ts`), but their **activation** is a stub: `phaseRivalActions` (orchestrator ~L1610) fires every ~10 ticks and does exactly two things — increment `interventionCount` + emit a canned toast, and push sphere pressure in the rival's primary sphere. No agents spawned, no territory claimed, no encounters sponsored, no escalation, no counter-play. The world has no antagonist. This design gives rivals **teeth** by making them launch **schemes**: multi-phase arcs that unfold over time, are visible as they build, and can be half-thwarted.

The load-bearing decision (Christian, roadmap review): **a rival scheme is a multi-phase arc on the shipped THR-225 phase runner** (rumor → materialization → response → crack), not a one-shot tick effect. One substrate (the composition phase runner) buys density, richness, and cool-failure for free — "a half-thwarted scheme is canonically a half-thwarted scheme." We do **not** build a parallel rival state machine.

## Design pillars in one paragraph

A rival, on its action tick, may **launch a scheme** — a `Composition` of `kind: 'rival-scheme'` with four phases. The scheme fires into the existing `activeCompositions` ledger; the existing phase runner advances it. Phase advancement is gated on **world-flags the rival invests into each tick** (not a player-facing meter), and how ambitious/fast a scheme a rival may run is gated by an **escalation tier derived from the doom stage + a player-advancement proxy** — reusing existing clocks, no bespoke meter. Each phase does a concrete **move** (sponsor a hostile encounter, spawn an antagonist agent, contest a hex via Control, drain/sour a stock, betray a shrine). Every move is **attributed** to its rival (edge + field + prose), surfaced in the RivalPanel as a scheme card with phase chips, narrated in the Chronicle, and marked on the hex map. The player **counters** by acting on the sponsored encounters / scheme nodes through the normal encounter+action UI; a successful counter **stalls or fails** the scheme at the phase it reached.

---

## Step 0 — Substrate verification (executor does this first, before coding)

This design references shipped substrate that must be confirmed live before building on it. If any check fails, fall back as noted and log an impediment.

1. **Phase runner is live and `world-flag` predicate can be enabled.** Confirm `src/engine/phaseComposition.ts` iterates `gameState.activeCompositions` and activates phases on `activatesAt` predicates. THR-225 v1 shipped the runner evaluating only `doom-clock` + `composition-fired` predicates (THR-225 Deferral #2). **This design requires enabling `world-flag` (and `prop-equals`) evaluation in the runner** — the anticipated, additive extension. Confirm the predicate evaluator (`src/engine/effects/effectPredicates.ts`) already handles `world-flag` so the runner only needs to call it.
2. **Control contestation availability.** Confirm `src/engine/phaseControlEffects.ts` exposes a way to place/contest a Control claim on a hex/location (per the 2026-03-17 control design). If contestation is not callable from a scheme move, the territorial family's "claim" phase **falls back** to sphere-pressure + hostile-agent spawn on the target hex (still a felt move) and a `// TODO(THR-XX)` is filed to upgrade it once Control exposes the hook.
3. **Player-advancement proxy for the escalation tier.** There is no single "player influence tier" scalar. Resolve `computeRivalEscalationTier(state)` against a concrete proxy in this order of preference: (a) highest `InfluenceTier` across the player's thread edges (`src/types/influence.ts`); (b) portfolio breadth (count of threaded agents); (c) doom-clock stage only. Bind whichever exists; **fail-soft to doom-stage-only** if none of the advancement proxies are readable. Name the chosen binding in the closing comment.
4. **Detection/stealth read for the corruptive family.** Confirm `phaseDetectionPressure.ts` / rival `agentAwareness` is the surface for "rival scans for divine signatures." The corruptive family's rumor phase reads/writes this; if unavailable, rumor phase degrades to a chronicle-only beat.

---

## Blast Radius (high-impact files touched)

Per Codesight import counts (CLAUDE.md high-impact list):

- **`src/types/gameState.ts` (345 importers)** — additive only: extend `RivalState` (already imported here) with `activeSchemeIds: string[]`; add optional `sponsorRivalId?: string` to `ActiveComposition`. Both additive/optional → cascade risk **low**, but every consumer of `RivalState`/`ActiveComposition` recompiles. No field reshaped or removed.
- **`src/engine/graph.ts` (531 importers)** — touched **only** to register one new edge type `sponsors_scheme` (rival actor → scheme-materialized node). Edge-type additions are additive; existing node-creation sites unaffected. If a suitable existing edge already expresses sponsorship (check `src/types/graph.ts` first per load-bearing rule), reuse it and skip this touch entirely.
- **`src/engine/orchestrator.ts`** — `phaseRivalActions` is rewritten (not a new phase; the existing Phase 3 slot at ~L2374 stays). Blast contained to the rival phase body.

No other ≥100-importer file is modified.

---

## Engine pillar

### New concept: the Rival Scheme (no new node type)

A scheme is **not** a new graph node type (load-bearing rule: no inventing node types). It is:

- an **`ActiveComposition`** instance (existing THR-225 type) of a `Composition` whose `kind: 'rival-scheme'`,
- **attributed** to its rival via a new optional `ActiveComposition.sponsorRivalId` field **and** a `sponsors_scheme` edge from the rival actor node to each antagonist/location node the scheme materializes (relationships are edges, not property strings),
- **linked back** from the rival via `RivalState.activeSchemeIds: string[]` (additive field).

### Scheme selection — upgrading `phaseRivalActions`

The flat `selectRivalAction` (returns `{recruit|intervene|expand|attack|wait}`) is **subsumed, not deleted**: those five verbs become (a) cheap **probe moves** a rival makes *between* schemes and (b) the vocabulary of **phase moves** *inside* schemes.

New `selectRivalScheme(rival, rivalState, world, escalationTier, roll)` (in `rival.ts`, pure + seeded):

1. Gate on capacity: a rival may run at most `RIVAL_MAX_CONCURRENT_SCHEMES(escalationTier)` schemes at once (default 1 at tier 0, up to 3 at max tier).
2. Gate on cadence: at least `RIVAL_SCHEME_LAUNCH_COOLDOWN_TICKS` since its last launch.
3. Pick a **scheme family** eligible for this rival's `behavior` + `sphereAlignment` + current world state (family eligibility table below). If none eligible or the roll lands on "probe," emit a probe move (the old flat action) and return.
4. Fire the chosen family's `Composition` (via the existing composition-fire path), stamp `sponsorRivalId`, push the compositionId onto `RivalState.activeSchemeIds`, emit `rival.scheme_launched`.

Determinism (NFP #3): the rival roll is the existing seeded `rng()` in `phaseRivalActions`; family choice and target selection consume that stream. No `Math.random()`.

### Scheme advancement — world-flag investment (no player meter)

Each rival action tick, for each active scheme, the rival **invests**: `phaseRivalActions` increments a private per-scheme counter (`ActiveComposition` gains no scalar the player reads — investment lives as a world-flag readiness signal). When accrued investment for the next phase clears `RIVAL_SCHEME_PHASE_INVEST_TICKS(escalationTier)`, the rival sets the world-flag `scheme.<compositionId>.phase-<n>-ready = true`. The **phase runner** (already ticking) sees the phase's `activatesAt: { op: 'world-flag', key: 'scheme.<id>.phase-<n>-ready' }` pass and activates the phase — running its move, prose, story beat, and traces through the shipped THR-225 machinery.

Why world-flags: it reuses an **existing** predicate op, keeps the clock-drives-runner ownership THR-225 settled, and needs only the additive "enable world-flag in the runner" step (Step 0.1). The player never sees a progress bar — they see phase *events*. Anomalies are the content; equilibrium is silence.

**Escalation rides existing clocks.** `computeRivalEscalationTier(state)` maps `doomClock` stage + the Step-0 player-advancement proxy → an integer tier `0..3`. Tier scales three things only: max concurrent schemes, invest ticks per phase (higher tier = faster), and family ambition (higher tier unlocks the martial/economic families and larger targets). This is the **entire** escalation mechanism — no new meter (Christian's constraint). It directly satisfies exit criterion 3: a headless late-game run shows more/faster/bigger schemes than early-game because the tier is higher.

### Counter-play and cool-failure

- The **materialization** phase (phase 2) of every scheme spawns a **counter-play surface**: a sponsored encounter (attributed to the rival) and/or a marked hex the player can act on.
- If the player **thwarts** the counter-play surface (resolves the encounter against the rival, destroys the materialized node, or wins the Control contest), the scheme is **stalled**: the next phase's readiness flag is cleared and `RIVAL_SCHEME_STALL_TICKS` are added before the rival can re-invest; a second successful counter **fails** the scheme (`status: 'failed'` on the ActiveComposition, `sponsors_scheme` edges cleaned).
- A failed/stalled scheme is **canonically half-done**: its already-activated phases stay real (the mine is still soured), and it emits a cool-failure chronicle beat via the existing pipeline. This is the "half-thwarted scheme" payoff — richness for free from the phase substrate.

### Constants (NFP #1) — new file `src/data/rival-scheme-config.ts`

| Constant | Default | Purpose |
|---|---|---|
| `RIVAL_MAX_CONCURRENT_SCHEMES` | `[1, 1, 2, 3]` (by tier) | Cap active schemes per rival per escalation tier. |
| `RIVAL_SCHEME_LAUNCH_COOLDOWN_TICKS` | `24` | Min ticks between a rival's scheme launches. |
| `RIVAL_SCHEME_PHASE_INVEST_TICKS` | `[14, 11, 8, 6]` (by tier) | Ticks of investment to arm the next phase; lower at higher tier = faster escalation. |
| `RIVAL_SCHEME_STALL_TICKS` | `12` | Added delay when the player stalls a scheme once. |
| `RIVAL_SCHEME_COUNTERS_TO_FAIL` | `2` | Successful counters before a scheme fails outright. |
| `RIVAL_SCHEME_PROBE_WEIGHT` | `0.35` | Probability a rival makes a cheap probe move instead of launching/advancing when eligible. |
| `RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE` | `0.04` | Sphere-pressure delta each phase move pushes in the rival's primary sphere (replaces the flat per-tick push). |
| `RIVAL_ESCALATION_DOOM_WEIGHT` / `_ADVANCEMENT_WEIGHT` | `0.6` / `0.4` | Blend of doom stage vs player-advancement proxy in the escalation tier. |

All numbers named; changing rival aggression = changing a constant, not logic.

### Traces (NFP #2) — `src/engine/traceBuffer.ts`

```ts
interface RivalSchemeLaunchedTrace { category: 'rival'; event: 'scheme_launched'; rivalId: string; compositionId: string; family: string; escalationTier: number; tick: number; }
interface RivalSchemePhaseAdvancedTrace { category: 'rival'; event: 'scheme_phase_advanced'; rivalId: string; compositionId: string; phaseId: string; move: string; targetNodeId?: string; tick: number; }
interface RivalSchemeCounteredTrace { category: 'rival'; event: 'scheme_countered'; rivalId: string; compositionId: string; outcome: 'stalled' | 'failed'; byActorId?: string; tick: number; }
interface RivalSchemeCompletedTrace { category: 'rival'; event: 'scheme_completed'; rivalId: string; compositionId: string; tick: number; }
```

Reuses the shipped `composition.phase_activated` / `composition.failed` traces for the phase-runner half; the `rival.*` traces add the attribution + move semantics.

### Fail-soft (NFP #4)

| Failure | Behaviour |
|---|---|
| `world-flag` predicate not enabled in runner | Step 0 blocker — enable it (additive); until then schemes never advance past phase 1. Not a crash. |
| Escalation proxy field absent | `computeRivalEscalationTier` falls back to doom-stage-only (Step 0.3). |
| Scheme target node destroyed mid-arc | Phase move that references it skips; scheme marked `failed`, cool-failure beat, edges cleaned. No throw. |
| Economic family selected but THR-615 stocks absent | Family is **ineligible** (eligibility check reads for stock properties); rival picks another family or probes. The economic family simply never launches until its substrate exists. |
| Control contestation hook missing | Territorial claim phase degrades to sphere-pressure + hostile-agent spawn (Step 0.2). |
| Scheme move throws | Log `rival.scheme_move_failed`, skip the move, keep the scheme alive at its current phase. Tick loop never crashes. |
| `activeCompositions` cap hit (THR-225 backpressure) | Inherits THR-225's round-robin; rival schemes queue like any composition. |

### Determinism

Escalation tier is a pure function of state. Scheme selection and target picks consume the seeded rival `rng()`. Phase advancement is world-flag-driven (deterministic given the same investment history). No new PRNG source.

---

## Content pillar

### Scheme families — three arcs, each a four-phase Composition

Each family is a `Composition` (`kind: 'rival-scheme'`) authored in `src/data/rival-schemes/` following the THR-225 recipe shape (rumor → materialization → response → crack). Prose in the **plainspoken-Malazan baseline register** (THR-609) — rival menace reads better plain; lyricism reserved for the crack beat only. Enrichment placeholders (`{rival}`, `{location}`, `{target}`) preserved; ≥3 prose variants per phase beat.

**Family eligibility table** (drives `selectRivalScheme`):

| Family | Eligible for behavior | Sphere lean | Phase moves (rumor → materialization → response → crack) | Substrate |
|---|---|---|---|---|
| **Corruptive** (subtle/expansionist) | `subtle`, `expansionist` | Shadow/Mind | whisper campaign (chronicle + detection read) → seed heresy (spawn antagonist NPC / suborn a notable) → shrine pressure (sphere + hostile agent) → **shrine betrayal** | ships now — reuses `rival-shrine-betrayal.ts` encounter as the crack beat |
| **Territorial** (aggressive/territorial) | `aggressive`, `territorial` | Iron/Storm | warband musters (chronicle) → raid the marches (hostile agent spawn on a border hex) → contest the hold (**Control claim**, or fallback) → siege a stronghold | ships now — Control hook (Step 0.2) or fallback |
| **Economic** (any, but Gold/Shadow lean) | any | Gold/Shadow | **sour the mines** → **corner the grain** → **break the guild** → **starve the faithful** | **gated on THR-615** (Flow Web P1 stocks); also cuts trade routes → degrades player intelligence (Flow Web nervous-system coupling) |

The **economic family is fully designed here** (per Christian: "include one economic scheme family in the initial rival design, not as a later add") but its **implementation is sequenced behind THR-615**, which is its hard substrate dependency and is not yet done. See Phasing + Dependency note below. The corruptive and territorial families ship in the THR-66 slice and fully exercise the framework.

### Prose + attribution content

- `rival-scheme-content.ts`: per-family, per-phase beat prose (baseline register, variant minimums), plus **attribution templates** — every scheme move's chronicle/toast names the rival (`{rival} has soured the deep mines of {location}`).
- Threat-tier prose: a scheme launched at escalation tier 0 reads as a minor probe; at tier 3 it reads ascendant-scale. Tier selects the prose variant band (reuses the register/tier bias, no new mechanism).
- `RIVAL_ACTION_TEMPLATES` (existing) is retained for probe moves; the scheme families are the new authored content.

---

## UI pillar

Every scheme move has a **player surface** (Flow Web player-surface rule — no move whose only surface is engine state).

### RivalPanel — scheme cards (primary surface)

`src/components/Game/RivalPanel.tsx` (exists) gains, per rival, an **Active Schemes** section:

- One **scheme card** per active scheme: family title, current phase, and a **phase-chip row** — reuse the THR-225 phase-chip pattern (activated = solid sphere-tinted; current = pulsing outline; future = ghosted with tier label). Christian's "rumor → materialization → response → crack" is legible at a glance.
- Counter-play affordance: if the scheme has a live counter surface, the card shows a "Contested" badge linking the player to the sponsored encounter.
- Stalled/failed schemes show a struck/greyed state with the cool-failure line — the half-thwarted scheme is visible as half-thwarted.

### Chronicle

Each phase activation emits a Chronicle entry through the existing `composition.phase_activated` → ChronicleRail path (THR-225 already wires this), sphere-tinted to the rival, divine/mortal voice per beat. This is the running narration of rival moves the issue asks for.

### Hex map rival-influence signifier

`HexMapV2`: hexes that are scheme targets (a soured mine, a contested hold, a raided march) get a **rival-influence overlay** — a sphere-tinted marker keyed to the sponsoring rival. This is the "rival activity is visible on the map" requirement (exit criterion 2). Load `hexmap-core` + `hexmap-layers` before building; the overlay is a new instanced signifier layer keyed on `sponsors_scheme` edges / scheme target nodes. Fail-soft: no target hex → no marker.

### Toasts

Scheme **launch** and **crack** (phases 1 and 4) emit a toast (existing toast surface), attributed to the rival. Intermediate phases are Chronicle-only to avoid interrupt spam (curator-disposes discipline).

### DebugPanel + debug bridge

- DebugPanel **Rivals** tab (or extend the existing rival view): per rival, list active schemes with compositionId, current phase, next-phase readiness flag, escalation tier, and the resolved escalation-proxy binding.
- `window.__DEBUG.getRivalSchemes()` → `[{ rivalId, compositionId, family, phase, escalationTier, status }]`.
- `window.__DEBUG.forceRivalScheme(rivalName, family)` (dev-only) to launch a scheme headlessly for verification.

### Player controls

No new bespoke control. The player counters schemes through the **existing** encounter + divine-action UI (act on the sponsored encounter, fire a divine action at a scheme node, win the Control contest). The scheme system routes into play the player already has, which is the point.

---

## Wiring checklist (per `Docs/plans/wiring-checklist.md`)

| Surface | Wiring |
|---|---|
| Orchestrator phase | `phaseRivalActions` (existing Phase 3 slot) rewritten to launch/advance/attribute schemes; no new orchestrator phase. Runs before `phaseComposition` so newly-set world-flags are seen the same tick or next (document ordering; either is deterministic). |
| GameState flow | Composition-fire writes an `ActiveComposition` (with `sponsorRivalId`); rival tick mutates world-flags + `RivalState.activeSchemeIds`; phase runner mutates the composition ledger. |
| GameState fields | `RivalState.activeSchemeIds` (additive); `ActiveComposition.sponsorRivalId?` (additive). |
| Graph | `sponsors_scheme` edge type (rival → materialized node), if no existing edge fits. |
| Traces | Four `rival.*` scheme traces registered + emitted; phase-runner `composition.*` traces reused. |
| UI components | RivalPanel scheme cards; ChronicleRail (reuse); HexMapV2 rival-influence layer; DebugPanel rivals tab. |
| Prose pipeline | Scheme beat prose + attribution templates flow through `enrichProse()` (placeholders `{rival}/{location}/{target}`), baseline register. |
| Player controls | None new — counter-play routes through existing encounter/action UI. |
| Debug visibility | `getRivalSchemes()` + `forceRivalScheme()` on `__DEBUG`; DebugPanel tab. |

Update `Docs/plans/wiring-checklist.md` and the systemic-wiring guide (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) with the new scheme-launch capability so content authors can seed schemes.

---

## Phasing + dependency note (surface to Christian)

- **THR-66 (this slice, no THR-615 dependency):** scheme framework (selection, world-flag advancement, escalation tier, counter-play, attribution) + **corruptive and territorial families** + full UI (RivalPanel cards, chronicle, hex overlay, debug) + traces + tests. Shippable now; fully exercises the framework and meets all three exit criteria.
- **Follow-up (economic family), blocked by THR-615:** the sour-mines → corner-grain → break-guild → starve-faithful arc riding Flow Web P1 stock tiers, with trade-route-cut → intelligence-degradation coupling. **Designed in full above**; implemented once THR-615 lands. Filed as a separate `blockedBy: THR-615` issue at handoff so it is tracked, not lost.

Christian said the economic family should be "in the initial rival design, not as a later add." It **is** in the design (fully specced here). It cannot be *implemented* before its substrate (THR-615, still Ready for Dev) exists, so implementation is sequenced behind that hard dependency while the other two families ship the mechanism now. This is a sequencing call, not a scope cut — flagged for visibility.

---

## Exit criteria (from THR-66, mapped)

1. **A generated rival produces ≥3 distinct action types over 100 ticks** → each family's four phases use ≥3 distinct move kinds (sponsor encounter, spawn agent, contest hex, sphere push, shrine betrayal); plus probe moves. Verified via 100-tick CLI + `getRivalSchemes()`.
2. **Player can identify which rival drove a given event from the UI** → `sponsorRivalId` + `sponsors_scheme` edge + attribution prose in RivalPanel card, Chronicle entry, hex overlay, toast. Verified in browser.
3. **Rival moves scale with player advancement** → escalation tier (doom + advancement proxy) gates concurrency, speed, ambition. Verified: headless 500-tick run shows late-game schemes more numerous/faster/larger than early-game.

## Acceptance criteria

- [ ] Step 0 substrate checks completed; bindings + fallbacks recorded in the closing comment.
- [ ] `world-flag` (and `prop-equals`) predicate evaluation enabled in `phaseComposition.ts` runner (fulfils THR-225 Deferral #2, additively).
- [ ] `selectRivalScheme` + `computeRivalEscalationTier` in `rival.ts`; `phaseRivalActions` rewritten to launch/advance/attribute; determinism preserved (seeded, no `Math.random()`).
- [ ] `RivalState.activeSchemeIds` + `ActiveComposition.sponsorRivalId` added (additive); `sponsors_scheme` edge (or reused edge) wired.
- [ ] Corruptive + territorial family Compositions authored (`src/data/rival-schemes/`), baseline register, ≥3 variants/beat, placeholders preserved; reuse `rival-shrine-betrayal` for the corruptive crack.
- [ ] Four `rival.*` traces registered + emitted; constants in `rival-scheme-config.ts`.
- [ ] RivalPanel scheme cards + phase chips; ChronicleRail entries; HexMapV2 rival-influence overlay; DebugPanel rivals tab; `__DEBUG.getRivalSchemes()` + `forceRivalScheme()`.
- [ ] Counter-play loop: thwart → stall → fail, with cool-failure beat.
- [ ] Tests: scheme selection deterministic under seed; phases advance on world-flags in order; fail-soft on missing substrate/target; escalation tier monotonic in doom+advancement; economic family ineligible without stocks.
- [ ] 30-tick CLI engine smoke (engine change) + 100-tick scheme run; last ~10 lines of `status` pasted as evidence.
- [ ] Browser-verify @1920×1080: RivalPanel scheme card screenshot (Playwright DOM) **and** hex rival-influence overlay screenshot (Claude-in-Chrome, WebGL); console (errors+warnings) block; `__DEBUG.getRivalSchemes()` assertion.
- [ ] Follow-up economic-family issue filed, `blockedBy: THR-615`, `Deferral`, same project.
- [ ] Docs: `project-status.md`, `project-history.md`, `changelog.md`; wiring-checklist + systemic-wiring guide updated.

## NFP compliance

| NFP | Verdict | Notes |
|---|---|---|
| 1. Tunability | PASS | All aggression/escalation/pacing numbers named in `rival-scheme-config.ts`. |
| 2. Inspectability | PASS | Four `rival.*` traces + reused `composition.*`; DebugPanel tab; `__DEBUG` bridge; every move attributed. |
| 3. Determinism | PASS | Escalation tier pure; selection/targets seeded; advancement world-flag-driven; no new PRNG. |
| 4. Fail-soft | PASS | Full table: missing substrate → family ineligible, missing Control → fallback, destroyed target → cool-failure, move throw → skip. Tick loop never crashes. |
| 5. Narrative over mechanical | PASS | Scheme = rumor→materialization→response→crack arc; half-thwarted is canonically half-thwarted; plain register with rationed crack lyricism. |
| 6. Additive over destructive | PASS | New optional fields; `selectRivalAction` subsumed not deleted; existing Phase 3 slot reused; no field reshaped. |
| 7. Performance budget | PASS with note | Scheme advancement is O(active schemes) world-flag checks/tick, bounded by THR-225 runner cap + `RIVAL_MAX_CONCURRENT_SCHEMES`. Re-profile only if concurrent schemes exceed the composition cap. |

## Three-pillar check

Engine ✓ (scheme selection, escalation, world-flag advancement, counter-play, edges/fields) · Content ✓ (three family arcs + attribution/threat-tier prose) · UI ✓ (RivalPanel cards, chronicle, hex overlay, toasts, debug) · Wiring ✓ (table above).

## Rulebook impact

Yes — rivals become an **active antagonist** with a scheme/counter-play loop (a rule of play). Update `Docs/canon/rulebook.md` (encounters/clocks/opposition section) in the same PR: rivals launch multi-phase schemes gated by an escalation tier; the player counters via sponsored encounters; half-thwarted schemes persist. Mark rules `[IMPL]` on ship.

## Vision audit

Reinforces "emergence is the ingredient, authorship is the kitchen" (schemes propose via world-flags; the curator/attention budget disposes) and "content is design" (the four-phase arc is the dramatic grain, reused from THR-225). Introduces the antagonist the simmer-between-chapters needs (Christian's roadmap framing). No Vision premise contradicted; no premise needs editing.

## Rejected approaches

- ❌ A parallel rival state machine separate from the phase runner — rejected; duplicates THR-225 and forfeits the free density/cool-failure. Schemes ARE compositions.
- ❌ A player-facing rival-threat meter / scheme progress bar — rejected; Christian's "no new bespoke meter," and it violates "anomalies are the content, equilibrium is silence." The player reads phases, not a bar.
- ❌ A `RivalScheme` graph node type — rejected; no new node type without verification, and `ActiveComposition` + attribution edge already model it.
- ❌ Adding a bespoke `scheme-progress` predicate op — rejected in favour of reusing the existing `world-flag` op (smaller, matches THR-225 Deferral #2).
- ❌ Implementing the economic family before THR-615 — impossible (hard substrate dependency); designed now, sequenced behind it.

## Sources

- [THR-66](https://linear.app/threadbare/issue/THR-66) — this issue (scope skeleton + settled direction in comments)
- `Docs/plans/2026-04-23-thr-225-event-recipe-phased-activation.md` — phase-runner substrate
- `Docs/plans/2026-07-04-flow-web-exploration.md` §Part 2 #3 — rival economic warfare + nervous-system coupling
- `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` — Control contestation
- `src/engine/rival.ts`, `src/data/rival-content.ts`, `src/engine/orchestrator.ts` (`phaseRivalActions`), `src/engine/phaseComposition.ts`, `src/types/rival.ts`, `src/types/gameState.ts`
