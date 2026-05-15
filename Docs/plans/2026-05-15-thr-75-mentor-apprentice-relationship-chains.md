# THR-75 — Mentor/Apprentice Relationship Chains

> **Date:** 2026-05-15
> **Author:** Cowork (keep-work-flowing scheduled run)
> **Linear issue:** [THR-75](https://linear.app/threadbare/issue/THR-75)
> **Project:** Social Systems Expansion (status: Now)
> **Status:** Implementation plan — Ready for Dev
> **Parent design:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` (Expansion B "Train Apprentice" initiative, Expansion A "Mentorship Offer" social scene)

---

## 1. Summary

Master–apprentice bonds are one of the richest relationship shapes in fantasy fiction — loyalty, succession, betrayal, generational storytelling. Today the concept is buried: "Train Apprentice" was one of 13 initiative types in the original Expansion B sketch and was **deferred out of THR-51** (ARC-194 shipped only 6 initiative types) with an explicit note that it "may come back sooner via the Mentor/Apprentice relationship chain — see separate issue." This is that issue.

This plan promotes mentorship to a first-class social system: a persistent `mentors` graph edge, a new `initiative.train-apprentice` initiative type that wraps the multi-tick training, a `phaseMentorship` tick phase that drives the relationship's lifecycle and milestone encounters, a branching encounter chain (The Offer → milestone lessons → Graduation / The Surpassing / The Falling Out), capability/trait transfer on graduation, and two divine-action player hooks ("Inspire Mentorship", "Sever the Bond").

**Design north star (per `state-of-game-design` Part 0):** the player is a god reading a living novel. A mentorship is a *sub-plot* between two threaded mortals. Every milestone is a curated moment where the player decides what kind of god to be toward the bond — steady it, test it, or let it break. The terminal arc (graduation vs surpassing vs falling-out) is chosen by a narrative-derived `bondQuality` value, not a coin flip — so the ending *means* something.

### Scope split

| Phase | Contents | In this issue? |
|---|---|---|
| **Phase 1 (this issue)** | `mentors` edge + schema · `initiative.train-apprentice` type · `phaseMentorship` · capability/trait transfer · terminal-arc logic (graduation / surpassing / falling-out) · `mentorship-constants.ts` · `MentorshipTrace` variants · 3 branching encounters (**The Offer**, **Graduation** with Surpassing branch, **The Falling Out**) · 2 divine actions · AgentDetailPanel block · chronicle events · DebugPanel visibility | ✅ Yes |
| **Phase 2 (deferral — file as `Deferral` child of THR-75)** | The 3 mid-chain milestone encounters as distinct branching templates: **The First Lesson**, **The Test**, **The Breakthrough**; a dedicated **The Surpassing** template (Phase 1 ships Surpassing as a branch within Graduation) | ❌ No — see §11 |

Phase 1 is a complete, shippable end-to-end system. The mid-chain milestone encounters in Phase 2 are pure additive content authoring — the engine seeds them by `templateId` whether they exist yet or not (fail-soft: a missing template emits a "withered" narrative event, no crash).

---

## 2. Considered Alternatives & Tensions (Brainstorm companion, inline)

Per the design workflow this section captures the dialogue that produced the plan. (Filed inline rather than as a separate vault Brainstorm because the Obsidian MCP is intermittently unreachable — impediments #66/#71/#75/#86 — and the keep-work-flowing run is autonomous.)

**Alternative A — Standalone `phaseMentorship` with no initiative coupling.** Rejected. Mentorship *is* a multi-tick occupation of the mentor agent; the Initiative system (THR-51) already models exactly that — `activeInitiative` on the node, `targetCompletionTick`, checkpoint rolls, fail-soft completion, the one-time "Inspire" token pattern, the "sabotaged" disruption flag. Rebuilding that machinery standalone duplicates ~200 lines and a tested orchestrator phase for no benefit.

**Alternative B — Mentorship as *purely* an initiative type, no separate edge or phase.** Rejected. An initiative is transient (it clears on completion). A mentorship *outlives* its training period — a graduated apprentice still "was trained by" their mentor; that fact drives THR-76 (mentor death → orphaned apprentice) and reputation tallies ("the one who surpassed Voss Ironfold"). A transient `activeInitiative` property cannot carry a persistent relationship. The relationship must be a graph edge (load-bearing decision: "relationships between entities are graph edges, not property fields").

**Chosen — hybrid.** The `initiative.train-apprentice` initiative is the *occupation wrapper* (candidate scoring, "mentor is busy for N ticks", the Inspire hook). The `mentors` **edge** is the *persistent relationship*. A thin new `phaseMentorship` is the *coupler*: it reads agents whose `activeInitiative` is a train-apprentice initiative, syncs the edge's `progress`, fires milestone encounter seeds at thresholds, and runs the terminal arc when the backing initiative completes or fails. This keeps `phaseInitiativeProgress` **completely untouched** (NFP #6) — `phaseMentorship` is a new file at a new orchestrator slot.

**Tension 1 — capability transfer is a genuinely new mechanic.** Nothing in the engine currently transfers capability between agents (`capabilityGrowth.ts` grows capability from the agent's *own* action resolutions; `npcGraduation.ts` promotes NPCs to agents but grants no cross-agent transfer). Graduation must grant the apprentice something. **Decision:** grant a **Mastery-category trait** in the mentor's domain (graph-native: `add_node` trait + `add_edge` has_trait, exactly the documented GraphOp pattern), with `TraitAssignmentProperties.source: 'mentorship'`. Mastery traits already feed Domain Capability via `traitDef.domainContributions[domain]`. This is additive and uses only existing machinery — no new "raw capability injection" path. The trait *level* is tunable (`GRADUATION_TRAIT_LEVEL`).

**Tension 2 — player-as-god framing (encounters Rejected Approach).** The milestone encounters cannot be "the apprentice chooses to study harder." Every player choice is a *god action* toward the bond: *Steady the apprentice's nerve*, *Let them find their own way*, *Whisper the mentor's doubt*. "Let them handle it" (the withdrawn intervention) is always a valid branch. This is enforced in the encounter authoring (§5) and is a hard review gate.

**Tension 3 — who is the encounter *for*?** A mentorship has two participants. **Decision:** the milestone encounters target the **apprentice** as `$actor` (the apprentice is the one whose trajectory is changing — the "story beat" belongs to them per `intrinsicTier`), with the mentor delivered as a `supportBundle` actor. The terminal **Surpassing** branch is the exception — it is emotionally the *mentor's* beat, so its prose centres the mentor's reaction even though the apprentice is still `$actor`.

**Vision premise check:** No Vision premise is contradicted. This plan *invokes* the "living novel / sub-plots between mortals" premise and the "failure is a story turn, not a loss" premise (The Falling Out is cool failure, not punishment — it produces a `rivals`/negative-`relates_to` edge that seeds future conflict encounters). No Vision edit required.

**Rulebook impact check:** This adds a new *initiative type* and a new *relationship edge*, but does not change turn structure, the 5 action verbs, the prerequisite system, the resource model, encounter resolution, clocks, or win/loss. The two new divine actions follow the existing divine-action pattern. **Assessment: no rulebook rule-of-play change.** `Docs/canon/rulebook.md` does not need an edit; the initiative-type roster in any "actions/initiatives" reference table should gain one row — a doc-touch, not a rule change. Flagged for the executor in §10.

---

## 3. Blast Radius

The change touches one high-impact file: **`src/types/graph.ts` (370 importers).**

| File | Importers | Cascade-risk note |
|---|---|---|
| `src/types/graph.ts` | 370 | The change is a **single additive union member** (`'mentors'` added to `EdgeType`). Additive union extension does not break existing consumers — every existing `switch (edge.type)` keeps compiling; no exhaustiveness check fails because none currently exists over `EdgeType`. The risk is *forgetting the matching `EDGE_SCHEMA` entry* in `src/types/edgeSchema.ts` — dev-mode `addEdge` validation will `console.warn` on an unknown edge type (it does not throw — `GRAPH_SCHEMA_VALIDATION_ENABLED = true`, throw-on-unknown is `false`). Mitigation: §4 makes the `EDGE_SCHEMA` entry a required, explicit action item.

No other file in scope has ≥100 importers. `src/data/unified-action-templates.ts`, `src/data/initiative-templates.ts`, `src/engine/orchestrator.ts`, `src/engine/graphQueries.ts`, and `src/components/Game/AgentDetailPanel.tsx` are all appended-to / extended, not restructured.

---

## 4. Engine Pillar

### 4.1 New graph edge type — `mentors`

Add `'mentors'` to the `EdgeType` union in `src/types/graph.ts` and a schema entry to `EDGE_SCHEMA` in `src/types/edgeSchema.ts`.

- **Direction:** directed, mentor → apprentice. Source = mentor actor node, target = apprentice actor node.
- **Cardinality:** a mentor may have multiple apprentices over time but **one active apprentice at a time** (enforced by the one-active-initiative rule — see 4.2); an apprentice has at most one active `mentors` edge. Graduated/estranged edges persist (cardinality many-to-many for *historical* edges).
- **Required properties** (documented as an `interface MentorsEdgeProperties` near the edge schema, mirroring `TraitAssignmentProperties` in `traits.ts`):

| Property | Type | Purpose |
|---|---|---|
| `domain` | `ReachDomain` | Which of the 8 Reaches is being taught |
| `progress` | `number` (0.0–1.0) | Training completion, advanced by `phaseMentorship` |
| `phase` | `'offered' \| 'training' \| 'graduated' \| 'estranged'` | Lifecycle state |
| `startedTick` | `number` | When the apprenticeship began |
| `lessonsCompleted` | `number` | Count of milestone checkpoints crossed (0–4) |
| `bondQuality` | `number` (−1.0–+1.0) | Narrative-derived health of the bond; seeds the terminal arc. Initialised from the mentor↔apprentice `relates_to` sentiment if one exists, else `BOND_QUALITY_INITIAL` |
| `initiativeId` | `string \| undefined` | The backing `train-apprentice` initiative (undefined once graduated/estranged) |

### 4.2 New initiative type — `initiative.train-apprentice`

Append to `INITIATIVE_TEMPLATES` in `src/data/initiative-templates.ts` (and it auto-joins `INITIATIVE_TEMPLATE_MAP`). Reuses the entire THR-51 multi-tick machinery — **no new initiative engine code**, only a new template row + the prerequisite/selection hooks below.

- **Prerequisites** (`InitiativeTemplate` fields): `requiredReaches: { [domain]: MENTOR_MIN_TIER }` — but `domain` is dynamic, so the candidate generator needs a small extension (see 4.2.1); `minWealth: 0` (mentorship is not gated on wealth — it is gated on capability + a present apprentice); `locationFilter`: none (mentorship can happen anywhere two suitable agents are colocated).
- **`baseDuration`:** `MENTORSHIP_BASE_DURATION` (8) · **`durationVariance`:** `MENTORSHIP_DURATION_VARIANCE` (3) · **`checkInterval`:** `MENTORSHIP_CHECK_INTERVAL` (2) → 4 checkpoints across the run = 4 "lessons".
- **`outcomes`:** a single `outcomes` entry of a **new outcome kind `mentorship_resolve`** (see 4.4) — the terminal arc is decided at completion by `bondQuality`, so the initiative does not branch its own outcomes; it delegates to `phaseMentorship`.
- **`failureConditions`:** apprentice node missing/dead, mentor node dead, apprentice left the region (distance > `MENTORSHIP_MAX_SEPARATION_HEXES`).
- **`motivations`:** `loyalty_ambition` (Heart axis) and `tradition_novelty` (Veil axis) — agents high on the loyalty/tradition poles are drawn to passing on craft.

#### 4.2.1 Candidate generation extension

`generateInitiativeCandidates()` in `src/engine/initiativeCandidates.ts` needs a small, isolated extension for the train-apprentice type (gated behind `if (template.id === 'initiative.train-apprentice')` so it touches nothing else):

1. For each Reach where the mentor is `>= MENTOR_MIN_TIER` (6), search the mentor's **colocated** actors for an eligible apprentice: `actorType === 'individual'`, tier in that Reach within `[APPRENTICE_MIN_TIER, APPRENTICE_MAX_TIER]` (2–4), no active `mentors` edge as target, not the Ascendant.
2. If ≥1 eligible apprentice: emit a candidate with `domain` = that Reach and a chosen `apprenticeId` (seeded PRNG pick among eligibles, weighted by `relates_to` sentiment if present — positive existing sentiment makes the pairing likelier and is more narratively legible).
3. Score: reuse the existing `axiologicalScore + ambitionBonus + inspireBonus` formula. The `inspireBonus` term reads a one-time `mentorshipInspireBonus` property (see 4.5) — mirrors `initiativeInspireBonus` exactly.
4. The chosen `domain` and `apprenticeId` ride along on the `InitiativeCandidate` (add two optional fields `mentorshipDomain?` / `mentorshipApprenticeId?` — additive to the candidate type).

`startInitiative()` already exists; the only addition is: when the started initiative is `train-apprentice`, create the `mentors` edge (`phase: 'offered'`, `progress: 0`, `initiativeId` set) and push a `PendingEncounterSeed` for `mentorship.the-offer` targeting the apprentice. This is a 1-conditional addition to `initiativeLifecycle.ts` `startInitiative()`, or — cleaner — handled entirely in `phaseMentorship` on its first sighting of an un-edged train-apprentice initiative (preferred: keeps `initiativeLifecycle.ts` untouched).

### 4.3 New tick phase — `phaseMentorship`

New file `src/engine/phaseMentorship.ts`, new orchestrator slot **Phase 2.33**, immediately after `phaseInitiativeProgress` (Phase 2.32) and before `phaseMovement` (Phase 2.35). RNG: `mulberry32(state.seed + state.tick * 59)` (59 is the next unused prime after initiative's 53).

Per tick, `phaseMentorship`:

1. **Bootstrap:** find agents with `activeInitiative?.templateId === 'initiative.train-apprentice'` that have **no** `mentors` edge yet → create the edge (`phase: 'offered'`), seed `mentorship.the-offer` for the apprentice.
2. **Progress sync:** for each active `mentors` edge in `phase: 'offered' | 'training'`, recompute `progress = clamp01((tick - startedTick) / (targetCompletionTick - startedTick))` from the backing initiative. On first progress > 0, flip `phase: 'offered' → 'training'`.
3. **Milestone seeds:** when `progress` crosses `MILESTONE_THRESHOLDS` (`[0.25, 0.5, 0.75]`), increment `lessonsCompleted`, emit a `mentorship_lesson` trace, and seed the corresponding milestone encounter by `templateId` (`mentorship.first-lesson` / `mentorship.the-test` / `mentorship.the-breakthrough`). **These templates are Phase 2** — until they exist the seed is fail-soft (withered narrative event). `bondQuality` drifts on the most recent checkpoint result read off the initiative's `checkpoints[]`: `+BOND_DRIFT_ON_SUCCESS` (0.15) on a passed checkpoint, `−BOND_DRIFT_ON_FAILURE` (0.2) on a failed one.
4. **Terminal arc:** when the backing initiative's `status` becomes `completed` or `failed`, run `resolveMentorship()` (see 4.4) and clear `initiativeId` from the edge.
5. **Orphan handling:** if the mentor node is gone (death) while the edge is active → set `phase: 'estranged'`, emit `mentorship_severed` trace with `reason: 'mentor_lost'`, emit a tier-2 `TickEvent`. (Full "orphaned apprentice arc" is THR-76's job — this plan only ensures the edge fails soft. Cross-reference noted in §10.)

### 4.4 Terminal-arc resolution — `resolveMentorship()`

New module `src/engine/mentorshipOutcomes.ts`, called from `phaseMentorship` (and registered as the handler for the new `mentorship_resolve` initiative outcome kind so `executeInitiativeOutcomes` can also reach it — pick one call site; `phaseMentorship` is the cleaner owner since it already holds the edge).

Decision table, read top-to-bottom:

| Condition | Arc | Effects |
|---|---|---|
| initiative `failed` (apprentice/mentor lost, separation) | **Dissolution** (not an encounter — a quiet tier-2 event) | `phase: 'estranged'`, no transfer, `mentorship_severed` trace `reason: 'failed'` |
| `progress >= 1.0` AND `bondQuality >= GRADUATION_BOND_THRESHOLD` (0.2) AND apprentice's resulting tier in `domain` ≥ mentor's tier | **The Surpassing** | graduation transfer (below) **plus** a `relates_to` edge mentor→apprentice with complex sentiment (`basis: 'surpassed'`), `bondQuality` written back to edge, `phase: 'graduated'`, seed `mentorship.graduation` with `branchHint: 'surpassing'`, `mentorship_surpassed` trace |
| `progress >= 1.0` AND `bondQuality >= GRADUATION_BOND_THRESHOLD` (0.2) | **Graduation** | grant apprentice a Mastery trait (`add_node` trait + `add_edge` has_trait, `level: GRADUATION_TRAIT_LEVEL`, `source: 'mentorship'`, `domainContributions: { [domain]: 1 }`); `phase: 'graduated'`; convert the `mentors` edge to `phase: 'graduated'` (kept as history); strengthen any mentor↔apprentice `relates_to` (or create one, `basis: 'mentorship'`); seed `mentorship.graduation`; `reputation_tally` on both ("trained by {mentor}", "trained {apprentice}"); `mentorship_graduated` trace |
| `bondQuality < FALLING_OUT_BOND_THRESHOLD` (−0.3) | **The Falling Out** | `phase: 'estranged'`; **partial** transfer (Mastery trait at `GRADUATION_TRAIT_LEVEL * FALLING_OUT_TRANSFER_FRACTION` — the apprentice learned *something* before it broke); create/worsen mentor↔apprentice `relates_to` to negative sentiment OR a `hostile_to` edge if sentiment crosses `HOSTILE_THRESHOLD`; seed `mentorship.the-falling-out`; `reputation_tally` ("estranged from {mentor}"); `mentorship_severed` trace `reason: 'falling_out'` |
| otherwise (progress incomplete, bond neither great nor broken) | **Quiet Parting** | `phase: 'estranged'`, partial transfer as Falling Out but no hostility, low-key tier-2 event, `mentorship_severed` trace `reason: 'incomplete'` |

All transfers and edge ops go through GraphOps / `graph.addEdge` and are wrapped per-effect in try/catch (fail-soft, mirroring `executeInitiativeOutcomes`).

### 4.5 Divine-action engine hooks

- **`mentorshipInspireBonus`** — a one-time numeric property set on a bonded agent by the "Inspire Mentorship" divine action; read and consumed in `generateInitiativeCandidates()` (4.2.1 step 3) and cleared on `startInitiative`. Exact mirror of `initiativeInspireBonus`.
- **"Sever the Bond"** — the divine action's executor (a small handler invoked from the unified action pipeline) finds the target actor's active `mentors` edge, sets `bondQuality = SEVER_BOND_QUALITY_FLOOR` (−1.0), sets a `severedByDivineWill: true` flag on the edge, and lets the *next* `phaseMentorship` tick run the terminal arc (which will now resolve as The Falling Out). This avoids the divine action needing to duplicate `resolveMentorship`. Essence cost `SEVER_BOND_ESSENCE_COST`.

### 4.6 Constants — `src/data/mentorship-constants.ts`

New file following the `initiative-constants.ts` pattern exactly (named `export const` per number, JSDoc `@range`, master feature flag).

| Constant | Default | Purpose |
|---|---|---|
| `ENABLE_MENTORSHIP` | `true` | Master feature flag — `phaseMentorship` and candidate generation no-op when false |
| `MENTOR_MIN_TIER` | `6` | Minimum Domain Capability tier to mentor in a Reach |
| `APPRENTICE_MIN_TIER` | `2` | Minimum apprentice tier (must have a foundation to build on) |
| `APPRENTICE_MAX_TIER` | `4` | Maximum apprentice tier (above this they don't need a mentor) |
| `MENTORSHIP_BASE_DURATION` | `8` | Base ticks for a full apprenticeship |
| `MENTORSHIP_DURATION_VARIANCE` | `3` | ± variance on duration |
| `MENTORSHIP_CHECK_INTERVAL` | `2` | Ticks between training checkpoints (→ 4 lessons) |
| `MENTORSHIP_MAX_SEPARATION_HEXES` | `3` | Apprentice straying beyond this fails the initiative |
| `MILESTONE_THRESHOLDS` | `[0.25, 0.5, 0.75]` | `progress` points that seed milestone encounters |
| `BOND_QUALITY_INITIAL` | `0.0` | Starting `bondQuality` when no prior `relates_to` exists |
| `BOND_DRIFT_ON_SUCCESS` | `0.15` | `bondQuality` gain per passed checkpoint |
| `BOND_DRIFT_ON_FAILURE` | `0.2` | `bondQuality` loss per failed checkpoint |
| `GRADUATION_BOND_THRESHOLD` | `0.2` | `bondQuality` at/above which a completed apprenticeship graduates |
| `FALLING_OUT_BOND_THRESHOLD` | `-0.3` | `bondQuality` below which the bond breaks |
| `HOSTILE_THRESHOLD` | `-0.6` | Falling-out sentiment below which a `hostile_to` edge is created instead of negative `relates_to` |
| `GRADUATION_TRAIT_LEVEL` | `2` | Level of the Mastery trait granted on graduation |
| `FALLING_OUT_TRANSFER_FRACTION` | `0.5` | Fraction of the trait level transferred on a partial (falling-out / quiet-parting) end |
| `SURPASSING_TIER_DELTA` | `0` | Apprentice tier ≥ mentor tier + this → Surpassing arc |
| `INSPIRE_MENTORSHIP_SCORE_BONUS` | `0.4` | One-time candidate-score bonus from the divine action |
| `INSPIRE_MENTORSHIP_ESSENCE_COST` | `2` | Essence cost of "Inspire Mentorship" |
| `SEVER_BOND_ESSENCE_COST` | `6` | Essence cost of "Sever the Bond" |
| `SEVER_BOND_QUALITY_FLOOR` | `-1.0` | `bondQuality` forced by "Sever the Bond" |

### 4.7 Traces — `src/types/traces/mentorship-traces.ts`

Define strongly-typed `MentorshipTrace` variants and register them in `TRACE_CATEGORIES` + the trace union in `traceBuffer.ts` (the higher-quality path per the encounter traces precedent; NFP #2):

| Category | Emitted when | Key fields |
|---|---|---|
| `mentorship_offered` | edge created, `phase: 'offered'` | `mentorId`, `apprenticeId`, `domain`, `initiativeId` |
| `mentorship_started` | `phase: 'offered' → 'training'` | `mentorId`, `apprenticeId`, `domain` |
| `mentorship_lesson` | a `MILESTONE_THRESHOLDS` point is crossed | `mentorId`, `apprenticeId`, `lessonNumber`, `progress`, `bondQuality` |
| `mentorship_graduated` | Graduation arc | `mentorId`, `apprenticeId`, `domain`, `traitId`, `bondQuality` |
| `mentorship_surpassed` | Surpassing arc | `mentorId`, `apprenticeId`, `domain`, `apprenticeTier`, `mentorTier` |
| `mentorship_severed` | Falling Out / Dissolution / Quiet Parting / mentor lost / divine sever | `mentorId`, `apprenticeId`, `reason`, `bondQuality` |

---

## 5. Content Pillar

### 5.1 Encounter chain — branching encounters, `encounter-pipeline` skill

Three new branching `UnifiedActionTemplate` files in `src/data/encounters/`, each imported and appended to `UNIFIED_ACTION_TEMPLATES` in `src/data/unified-action-templates.ts` (there is no `encounters/index.ts` — registration is by manual import). Authoring runs through the **`encounter-pipeline`** skill (4-pass: draft → editorial → systems audit → final merge). Tonal exemplar already in-repo: **`src/data/encounters/flawed-steel.ts`** — a forge-master/apprentice betrayal — read it first.

All three target the **apprentice** as `$actor`; the **mentor** is delivered via `supportBundle` (`EncounterSupportActorSpec`, `persistence: 'must-persist'` — the mentor is a real graph actor, not scenery). `intrinsicTier: 'story_beat'`. Each uses enrichment placeholders (`{name}`, `{culture}`, `{?has_faction}`, `{?has_rival}`) and **sphere-coloured prose** keyed to the mentor's dominant sphere (the issue's explicit ask): Life mentor = nurturing growth; Entropy mentor = "learn through failure"; Force mentor = harsh discipline; Mind mentor = cold precision. Sphere coloring is implemented as conditional prose blocks, not separate templates.

**1. `mentorship.the-offer`** — reach **Heart**, archetype axis Sworn ↔ Renegade.
The mentor offers to take the apprentice on. The player-god watches a mortal stand at a threshold.
- *Player choices (god actions, path-over-adjective):* **Steady their nerve** (supportive — raises acceptance odds, tilts Sworn) · **Let them choose** (withdrawn — pure mortal agency, the always-valid branch) · **Whisper the cost** (coercive/cautionary — surfaces what the apprentice gives up; may tilt Renegade, may make them refuse).
- *Branches:* accept → `mentors` edge stays, `phase` flips toward training, chain continues · refuse → initiative is abandoned, edge set `estranged` quietly, a small negative `relates_to`, **no** chain. (Refusal must be a real outcome — Rule 1, path over adjective.)
- *Aftermath:* `reputation_tally` "took {mentor} as a teacher" / "took on {name}"; `encounter_seed` for the first milestone (`mentorship.first-lesson`, Phase 2; fail-soft until authored).

**2. `mentorship.graduation`** — reach **Heart** (primary), with a `branchHint` that selects the Surpassing voice. Archetype axis Sworn ↔ Renegade, with the Surpassing branch tilting hard on `loyalty_ambition`.
The apprenticeship completes well. Two authored sub-voices selected by `aftermathConfig` branch on the `branchHint` seeded by `resolveMentorship`:
- *Graduation voice:* the apprentice becomes a peer; warm, the mentor's craft lives on.
- *Surpassing voice:* the apprentice has **exceeded** the mentor; bittersweet — pride tangled with being eclipsed. Prose centres the mentor's face.
- *Player choices:* **Honor the bond** (supportive — strengthens the `relates_to`, tilts Sworn) · **Let the moment be theirs** (withdrawn) · **Name the rivalry** (coercive — only meaningful on the Surpassing branch; converts pride into a live `rivals`/competitive `relates_to`, tilts Renegade — cool, not punishing: it seeds future story).
- *Aftermath:* the Mastery trait grant is already done by the engine (4.4) — the encounter *narrates* it, it does not re-grant. `reputation_tally`, `recent_event`, `future_hook`.

**3. `mentorship.the-falling-out`** — reach **Shadow** (the bond curdles) or **Heart** (the bond simply fails) — author picks per the dominant cause; default **Heart**. Archetype axis Sworn ↔ Renegade.
The bond breaks before or at completion. `flawed-steel.ts` is the structural reference.
- *Player choices:* **Try to mend it** (supportive — a real but uncertain shot at salvaging a Quiet Parting instead of hostility) · **Let it break** (withdrawn) · **Take a side** (coercive — the god picks mentor or apprentice; deepens the rupture for the other, tilts Renegade hard, can push sentiment past `HOSTILE_THRESHOLD`).
- *Aftermath:* narrates the partial transfer; `reputation_tally` "estranged from {mentor}"; `encounter_seed` for a future confrontation encounter (`encounterFamily: 'rivalry'`, `delayTicks: ~20`) — the falling-out is the *planting* of the next story, not the end (cool failure).

### 5.2 Prose / data tables

- **Sphere-coloured prose blocks** for each of the 12 Creation Spheres on the offer/lesson framing, authored as conditional blocks inside the templates (per the issue's "sphere-coloured mentorship prose" requirement). Minimum viable: Life, Entropy, Force, Mind explicitly authored (the issue's named examples); the other 8 fall back to a neutral block.
- **Cultural variation:** the encounter prose reads `{culture}` and may carry one conditional cultural-flavour block per template (e.g. a culture that prizes `tradition` frames mentorship as sacred duty; one that prizes `novelty` frames it as a transaction). This is light — one block, not a matrix — to stay in scope.

### 5.3 Content quality gate

Each encounter must pass the `state-of-game-design` Part 0 test: *does this create a moment the player cares about?* The benchmark moment for review: **The Surpassing branch of `mentorship.graduation`** — if that beat does not land as bittersweet (pride + loss in the same breath), the content is not done.

---

## 6. UI Pillar

### 6.1 AgentDetailPanel — Mentorship block

New section in `src/components/Game/AgentDetailPanel.tsx`, modeled **exactly** on the existing **Active Initiative block** (currently ~lines 326–350, which reads `detail.activeInitiative` + `INITIATIVE_TEMPLATE_MAP`). The new block reads a new `detail.mentorship` field and renders:
- Role line: "Mentoring {apprenticeName} in {domain}" or "Apprenticed to {mentorName} in {domain}".
- A progress band (reuse the `ProgressBand` primitive) showing `progress`.
- Phase chip: Offered / Training / Graduated / Estranged.
- For graduated/estranged historical edges: a quieter "Past bond" treatment (one line, no progress band).

`getAgentBonds()` in `src/engine/graphQueries.ts` reads **only `relates_to`** edges — it will *not* surface `mentors` edges. So:

### 6.2 Data wiring — `graphQueries.ts` + `agentDetail.ts`

- New query `getMentorships(graph, agentId)` in `src/engine/graphQueries.ts` — reads `mentors` edges in **both** directions (agent as source = is a mentor; agent as target = is an apprentice). Returns a `MentorshipSummary[]` (`role`, `otherId`, `otherName`, `domain`, `progress`, `phase`).
- New optional field `mentorship?: MentorshipSummary[]` on `AgentDetail` (`src/engine/agentDetail.ts`), populated in `buildAgentDetail()`.

### 6.3 Chronicle / notifications

`phaseMentorship` and `resolveMentorship` emit tier-2 `TickEvent`s (same mechanism initiatives use on completion) for: mentorship begun, each lesson milestone, graduation, surpassing, falling out. These flow into the existing chronicle/alert surface — **no new notification component**, just new event payloads. Surpassing and Falling Out are tier-2 (story-beat worthy); routine lessons are tier-1 (ambient).

### 6.4 ActionDrawer — divine action cards

Two new divine-action `UnifiedActionTemplate` entries (divine category), surfaced through the existing **Generalized Action Targeting** pipeline — no ActionDrawer code change, just the templates' `targetCategories` / `targetSubtypes` filters:
- **"Inspire Mentorship"** — `targetCategories: ['actor']`, visible when the focused actor is `individual`, bonded (has a `thread` edge to the Ascendant), and is `>= MENTOR_MIN_TIER` in at least one Reach. Sets `mentorshipInspireBonus`. Essence cost `INSPIRE_MENTORSHIP_ESSENCE_COST`.
- **"Sever the Bond"** — `targetCategories: ['actor']`, visible when the focused actor has an **active** `mentors` edge (`phase: 'offered' | 'training'`). Triggers the 4.5 sever path. Essence cost `SEVER_BOND_ESSENCE_COST`.

### 6.5 DebugPanel

Mentorship state is inspectable via the new `getMentorships` query (the `__DEBUG` bridge already exposes `graph`). Add the six `mentorship_*` trace categories to the DebugPanel trace-filter list so they show in the Trace tab. No new DebugPanel view needed.

### 6.6 HexMapV2

**N/A — with rationale.** A mentorship is a *relationship between two agents*, not a location, sublocation, or entity that occupies a hex. The participants are already rendered as agent dots; the bond is surfaced in the detail panel (6.1) and chronicle (6.3). A mentor↔apprentice tether-line on the map was considered and rejected as scope creep — it duplicates the detail-panel signal and competes visually with thread-tug lines. If a future pass wants relationship lines on the map, that is a general "render `relates_to`/`mentors` edges on HexMapV2" feature, not part of THR-75.

---

## 7. Wiring Section

Per `Docs/plans/wiring-checklist.md` — every new surface, its hook, and its visibility:

| Module / surface | Hook point | Notes |
|---|---|---|
| `phaseMentorship` | `src/engine/orchestrator.ts` Phase **2.33**, after `phaseInitiativeProgress` (2.32), before `phaseMovement` (2.35) | New `runTick` call; RNG `mulberry32(state.seed + state.tick * 59)` |
| `initiative.train-apprentice` | Appended to `INITIATIVE_TEMPLATES` in `src/data/initiative-templates.ts` | Auto-joins `INITIATIVE_TEMPLATE_MAP`; candidate gen extended in `initiativeCandidates.ts` |
| `mentors` edge | `EdgeType` union in `src/types/graph.ts` + `EDGE_SCHEMA` entry in `src/types/edgeSchema.ts` | Both required — schema entry prevents dev-mode validation warning |
| 3 branching encounters | Imported + appended to `UNIFIED_ACTION_TEMPLATES` in `src/data/unified-action-templates.ts` | No `encounters/index.ts`; manual import |
| 2 divine actions | Appended to the divine-action templates in `src/data/unified-action-templates.ts` | Surface via Generalized Action Targeting filters — no ActionDrawer change |
| `getMentorships` | New export in `src/engine/graphQueries.ts` | Consumed by `agentDetail.ts` |
| `AgentDetail.mentorship` | New field, populated in `buildAgentDetail()` (`src/engine/agentDetail.ts`) | Consumed by `AgentDetailPanel.tsx` |
| Mentorship UI block | `src/components/Game/AgentDetailPanel.tsx` | Mirrors Active Initiative block |
| `MentorshipTrace` | New `src/types/traces/mentorship-traces.ts`, registered in `traceBuffer.ts` | 6 categories; added to DebugPanel trace-filter list |
| Chronicle events | `phaseMentorship` / `mentorshipOutcomes.ts` emit `TickEvent`s | Reuses initiative-completion event mechanism |
| Constants | New `src/data/mentorship-constants.ts` | `ENABLE_MENTORSHIP` master flag |
| `mentorshipOutcomes.ts` | New module, called by `phaseMentorship`; also the handler for the `mentorship_resolve` initiative outcome kind | Single owner = `phaseMentorship` |
| `touchWorld()` call | After every `mentors` edge create / property mutation in `phaseMentorship` and `mentorshipOutcomes.ts` | **Required** — the world graph is mutated in place; UI selectors (the AgentDetailPanel block) key on `worldVersion` and will serve stale data without it (load-bearing decision) |

**Wiring-checklist update:** the executor must add the `phaseMentorship` phase, the Mentorship UI block, the `AgentDetail.mentorship` field, the `mentorship_*` trace categories, and the 2 divine actions to `Docs/plans/wiring-checklist.md` as part of closeout.

**Systemic wiring guide update:** the `mentors` edge + capability-transfer-on-graduation is a new content-facing engine capability — the executor must add a short entry to `Docs/plans/2026-04-16-systemic-wiring-guide.md` so future content authors know mentorship edges and the graduation trait-grant exist.

---

## 8. Fail-Soft Table (NFP #4)

| Failure case | Fallback behavior |
|---|---|
| Apprentice node missing/dead mid-training | Initiative `failureCondition` fires → `phaseMentorship` runs Dissolution arc; edge set `estranged`; tier-2 quiet event; no crash |
| Mentor node missing/dead mid-training | `phaseMentorship` orphan handler: edge → `estranged`, `mentorship_severed` `reason: 'mentor_lost'`; (full orphaned-apprentice arc deferred to THR-76) |
| No eligible apprentice when initiative would start | Candidate simply not generated — initiative silently skipped (existing initiative behavior) |
| Milestone encounter template not yet authored (Phase 2) | `PendingEncounterSeed` is fail-soft — emits a "withered" narrative event, removed, no stuck state |
| `mentors` edge added without `EDGE_SCHEMA` entry | Dev-mode `console.warn` only (not a throw) — but §4.1 makes the schema entry a required action item, so this should never ship |
| Capability/trait GraphOp throws during `resolveMentorship` | Per-effect try/catch (mirrors `executeInitiativeOutcomes`) — the arc still completes, the failed transfer is logged, edge phase still advances |
| `bondQuality` out of range due to drift accumulation | `clamp(-1, 1)` on every write |
| Apprentice strays > `MENTORSHIP_MAX_SEPARATION_HEXES` | Initiative `failureCondition` → Dissolution arc |
| Two `phaseMentorship` ticks race a completing initiative | `phaseMentorship` checks `initiativeId` is still set before running the terminal arc; clears it atomically → terminal arc runs exactly once |

---

## 9. NFP Compliance

| # | Priority | Status |
|---|---|---|
| 1 | Tunability | **PASS** — every threshold, duration, drift value, cost, and tier gate is a named constant in `mentorship-constants.ts`; `ENABLE_MENTORSHIP` master flag |
| 2 | Inspectability | **PASS** — 6 strongly-typed `MentorshipTrace` categories at every lifecycle transition; the `mentors` edge is graph-queryable; the terminal-arc decision table reads from inspectable `bondQuality` + `progress` |
| 3 | Determinism | **PASS** — `phaseMentorship` RNG is seeded (`state.seed + state.tick * 59`); apprentice selection and checkpoint rolls use seeded PRNG; reuses the deterministic initiative machinery |
| 4 | Fail-soft | **PASS** — see §8; every cross-agent op is try/caught, every missing-entity path has a defined quiet fallback, milestone seeds are fail-soft by construction |
| 5 | Narrative > mechanics | **PASS** — the terminal arc is chosen by `bondQuality` (a narrative-derived value that drifts on lived events), not a raw roll; The Falling Out is cool failure that *seeds* a future rivalry encounter; encounters carry the meaning, the engine just narrates the trait grant |
| 6 | Additive | **PASS** — one additive union member (`'mentors'`); everything else is new files / appended array rows / new optional fields. `phaseInitiativeProgress`, `initiativeLifecycle.ts`, and `executeInitiativeOutcomes` are **not modified destructively** — the only existing-engine edit is an isolated `if (template.id === 'initiative.train-apprentice')` branch in `initiativeCandidates.ts` |
| 7 | Performance budget | **PASS with note** — `phaseMentorship` iterates only agents with an active `train-apprentice` initiative (a tiny subset of agents, and one per mentor). No full-graph scan. If mentorship adoption is high, profile and consider a cached index of active `mentors` edges — noted, not pre-optimized |

**Three-pillar check:** Engine §4 ✅ · Content §5 ✅ · UI §6 ✅ · Wiring §7 ✅.

---

## 10. Cross-references & executor notes

- **THR-76 (Death, Mourning & Succession Crises)** — THR-76's "orphaned apprentice arc" consumes the `mentors` edge this plan creates. THR-75 ships only the *fail-soft* orphan handler (edge → `estranged` on mentor death). THR-76 should be sequenced *after* THR-75. The executor should leave a `// TODO(THR-76): orphaned-apprentice arc hook` comment at the orphan-handling branch of `phaseMentorship`.
- **THR-51 (Agent Initiatives)** — shipped (ARC-194). This plan is the promised return of "Train Apprentice."
- **THR-431 (Reveal Corruption)** — In Design, currently mutex on `src/types/faction.ts`. THR-75 does **not** touch `faction.ts` or faction-member edges → **not mutex** with THR-431.
- **Rulebook:** add one row to any initiative-type reference table in `Docs/canon/rulebook.md` (initiative roster 6 → 7). This is a doc-touch, not a rule-of-play change — no re-verdict needed (see §2 Rulebook impact check).
- **Deferrals:** any `// TODO` / `// DEFERRED` added during implementation needs a `THR-XX` Linear issue (Definition of Done). The Phase 2 milestone-encounter content (§11) should be filed as a `Deferral` child of THR-75 before closeout.

---

## 11. Phase 2 (deferral — to be filed as a `Deferral` child of THR-75)

Pure additive content authoring, no engine work — the Phase 1 engine already seeds these by `templateId` and fails soft until they exist:

1. `mentorship.first-lesson` — reach Veil, axis Seer ↔ Manipulator. Early friction: does the apprentice absorb the mentor's orthodoxy or chafe? Tilts `tradition_novelty`.
2. `mentorship.the-test` — reach varies by `domain`, axis per the domain. A real challenge; path-over-adjective (clean pass / barely / fail-forward).
3. `mentorship.the-breakthrough` — reach Heart, axis Sworn ↔ Renegade. The capability crystallizes; tilts `loyalty_ambition`.
4. `mentorship.the-surpassing` — promote the Surpassing *branch* of `mentorship.graduation` into its own full template once it has earned the room.

Suggested model for Phase 2: `model:opus-4-6` (prose-heavy branching content, no novel engine surface).

---

## 12. Definition of Done (this issue / Phase 1)

- [ ] `mentors` edge in `EdgeType` union + `EDGE_SCHEMA` entry + `MentorsEdgeProperties` interface
- [ ] `initiative.train-apprentice` template + `initiativeCandidates.ts` extension (isolated branch)
- [ ] `phaseMentorship.ts` + orchestrator Phase 2.33 wiring
- [ ] `mentorshipOutcomes.ts` with the `resolveMentorship()` decision table
- [ ] `mentorship-constants.ts` (all constants from §4.6)
- [ ] `MentorshipTrace` variants + `traceBuffer.ts` registration
- [ ] 3 branching encounters authored via `encounter-pipeline`, registered in `UNIFIED_ACTION_TEMPLATES`
- [ ] 2 divine actions ("Inspire Mentorship", "Sever the Bond")
- [ ] `getMentorships` query + `AgentDetail.mentorship` field + AgentDetailPanel block
- [ ] Chronicle `TickEvent`s for the 5 milestone/terminal beats
- [ ] DebugPanel trace-filter includes the 6 `mentorship_*` categories
- [ ] `wiring-checklist.md` + `systemic-wiring-guide.md` updated
- [ ] Phase 2 filed as a `Deferral` child issue of THR-75
- [ ] `npm test` + `npx tsc --noEmit` + `npx vite build` clean
- [ ] Engine smoke: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` reaches tick 30, non-zero agents, traces present
- [ ] Browser-verify: screenshot of the AgentDetailPanel Mentorship block at 1920×1080 + console capture + `__DEBUG` state assertion (`getMentorships` returns a populated edge for a mentoring agent)
