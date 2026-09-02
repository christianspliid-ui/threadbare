> **title:** `The undertaking factory — THR-1300`
> **linear_issue:** THR-1300
> **author:** `Claude Code`
> **created:** 2026-09-02
> **three_pillars:** Engine `done — the review levers only (start, band pin, force-moments); the line itself is authoring-time` · Content `done — the Undertaking Contract, the brief keyed on the kind grid, the package compiler, the canon page, the pilot batch` · UI `done — the Undertaking Package View on the CMS; moment card unchanged`

# The undertaking factory — THR-1300

*Plan doc 6 of 6 from the [Proactive Agent Actions wayfinder map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map): the production line that turns the shipped undertaking substrate into a content supply — a canon page as Step 0, game-design-first briefs keyed on the kind × CRUD grid, a machine gate that encodes the review's obligations, live-proof levers that are the `?spawn` / `?forceencounters` / `?outcome` analogs for undertakings, a package compiler that does the three registrations by hand today, and a batch cadence with the director sampling two of six.*

**Settled input (do not re-litigate here):** the carve-up's scope for this doc, verbatim in the map's closing comment — *"the production line mirroring the encounter factory:* `Docs/canon/undertakings.md` *as Step-0, game-design-first briefs keyed on the kind-row schema, machine gates (schema completeness incl. the no-destroy-verb-no-kind constraint, register scoring at the encounter standard, Law 56 chip backing), live-proof levers (the* `?spawn`*/*`?forceencounters`*/*`?outcome` *analogs for undertakings), batch cadence. Stands on doc 2's schema."* The review record's §3 row for doc 6 ([`Docs/audits/2026-08-26-proactive-agent-actions-review.md`](../audits/2026-08-26-proactive-agent-actions-review.md)): *"Gates encode the review: schema completeness (destroy verb, cast declarations with scarcity + identity requirements), band tables, register scoring at the encounter standard, Law 56 chip state-backing."* The grammar verdict on [THR-1281](https://linear.app/threadbare/issue/THR-1281/the-action-library-grammar-crud-verbs-across-reaches-and-tiers) (kind-first; schema refuses a destroy-less kind; the ten-kind catalog as an open registry). The encounter factory's rulings of 2026-08-08 ([`Docs/plans/2026-08-08-encounter-factory-workflow.md`](2026-08-08-encounter-factory-workflow.md) § Rulings — batch of six, agent-drafted briefs approved in chat, **no exemptions**, park don't kill, contract expression inline, the director samples two) are copied, not re-decided: the ticket says *"copy the line, do not reinvent it."* Every file:line reference verified against `main` @ `b95996df` (post-THR-1387, the per-mortal cap; all five earlier docs of this map fully executed).

## Why this is load-bearing

The substrate is built and the supply is hand-fed. Docs 1–5 shipped checkpoints with dice, the scored binder, kind rows with their counter-play, the reactive loop, and the moment surfaces; the board went live on 2026-09-02 ([THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-cutover-re-derive-the-census-gates-on-what-the)) and was capped the same day ([THR-1387](https://linear.app/threadbare/issue/THR-1387/a-spotlight-mortal-can-carry-eleven-concurrent-undertakings-cap-active)). What feeds it is **64 templates across seven hand-written packs**, and adding one today is three files edited by hand — the pack array, the kind row's column in `src/data/undertaking-kinds.ts`, and an ambition's `strategicProfile.templateIds` in `src/data/ambition-templates.ts` — where a miss in the third is silent dead content: a template in no profile is never generated, never refused, never traced (the [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) shape, one file over). No gate scores undertaking prose against the register the encounter line holds (`activityProse` / `completionProse` appear in no `content-eval/` module — measured, zero hits). No lever starts a named undertaking on a named mortal for review; the only way to see a template's moments is to run seeds until the board picks it. Two kind rows — `sublocation` and `faction` — still wait on the destroy verbs nobody has written, and the reactive loop's raw supply is **zero** on both default seeds ([THR-1388](https://linear.app/threadbare/issue/THR-1388/the-live-board-starts-no-harm-capable-undertakings-on-the-default)) because harm-capable templates are few and rarely finish. Every one of those is a supply problem, and a supply problem is what a factory is for. This doc is the last of the six because it stands on the schema doc 2 authored: a gate can only check completeness against a shape that exists.

## Substrate inventory

The line is composed from the encounter factory's shipped machinery and the undertaking substrate's shipped seams. Nothing here green-fields a validator, a runner, or a lever the repo already has; each row names what is reused.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Strategic Projects & Control (`strategicActionLifecycle.ts`, `strategicActionCandidates.ts`, `phaseStrategicProjects.ts`, phase `2a.55`) | 🟢 ACTIVE | **extends** — the review lever starts an undertaking through the *same* start path the board uses, bypassing only the candidate-generation gates and tracing each bypass |
| Ambitions & Undertakings (`undertakingCheckpoints.ts`, `undertakingMoments.ts`, `ambition-templates.ts` `strategicProfile`) | 🟢 ACTIVE | **extends** — the band pin rides `resolveStepCore`'s existing `bandOverride` seam (doc 1 §1); the compiler writes profile registrations the way a hand does today |
| Kind registry (`undertaking-kinds.ts`, `validateKindRegistry`, `undertakingKindRegistry.test.ts`) | 🟢 ACTIVE | **composes** — the gate calls `validateKindRegistry` for the destroy constraint rather than restating it; the compiler appends ids to a named row's column |
| Undertaking corpus gates (`undertaking-motivations.test.ts` `findMotivationDefects`, `strategicBehaviorFamilies.test.ts` `mutationHint` pin, `undertakingMotiveGate.test.ts`) | 🟢 ACTIVE | **composes** — the per-template gate runs the same predicates so one template can be checked without the whole suite |
| Encounter factory tooling (`compositionContract.ts`, `retrofitPending.ts`, `check-encounter.ts`, `encounter-live-proof.ts`, `encounter-batch-report.ts`, `compile-encounter.ts`, `encounterPackage.ts`, `EncounterPackageViewer.tsx`) | 🟢 ACTIVE | **mirrors, shares** — the runner/ratchet/report/compiler shapes are copied structurally; the text-level detectors (`nudgeAuditDetectors.ts` `countVagueness` / `countSecondPerson` / `countAbstractNouns`, numerals) are imported, not re-implemented |
| Debug bridge + URL levers (`debugOutcomePin.ts`, `debugCommands.ts`, `GameView.tsx` `?spawn` / `?outcome` / `?forceencounters`) | 🟢 ACTIVE | **extends** — `?undertaking=`, `?forcemoments`, and `?outcome=` re-scoped; three `__DEBUG` accessors; one CLI verb |
| Following & moments (`followedAgents.ts` single writer, `pendingUndertakingMoments`, `momentCardModel.ts`) | 🟢 ACTIVE | **reads; extends through the single writer** — `?forcemoments` follows every spotlight mortal via `followAgent`, never a second follow writer |
| Census instruments (`census:undertakings`, `census:reachability`) | 🟢 ACTIVE | **cites** — the batch report links both; the pilot's acceptance is the existing envelope, unchanged |
| Authoring brief (`build-authoring-brief.ts`, `Docs/authoring-brief.md`) | 🟢 ACTIVE | **extends** — an undertaking section compiled from the canon page, sha-pinned like Sections A–E |

Populations consumed at runtime (impediment #599): 64 strategic templates (11 builder · 16 court · 8 merchant · 8 scholar · 4 wanderer · 10 warlord · 7 zealot), 8 kind rows (T1 ×5, T2 ×2, T3 ×1), 5 ambition templates carrying a `strategicProfile`.

## Engine pillar

The line is authoring-time. The engine pillar is the three review levers the carve-up names — the analogs of `?spawn` (THR-883), `?forceencounters` (THR-878) and `?outcome` (THR-1030) — because a factory whose live proof cannot *start* the thing it is proving is a factory that proves nothing.

### 1. The start lever (`?spawn` analog)

New module `src/engine/undertakingReviewLevers.ts` (the `debugOutcomePin.ts` sibling — not gated on `import.meta.env.DEV`, for the same reason: the Done-when names the deployed build).

`startUndertakingForReview(state, runtime, actorId, templateId, opts)`:

- Resolves the target the way the board does — `findValidTargets` against the template's `targetRule` — and for a `destroy` verb **prefers a target with an owner** (`owns` edge, `commanded_by`, or a faction-territory `controls`), because a destroy with no victim is exactly the vacuous proof the live-proof stage must not launder (THR-1388 found the mirror: blockades that no-op'd because no route stood).
- Builds the candidate through the same helpers `generateStrategicCandidates` uses and hands it to the same start path — never a bespoke `projects.push`. Only the **generation gates** are bypassed, each named: `ambition_profile` (no ambition needed to review a template), `active_cap` (THR-1387's cap), `motive_gate` (a destroy under review does not need a live grudge). The bypass list rides the existing `strategic_action_started` trace as an additive field (§ Tracing), so a review start is never mistaken for an organic one in a census.
- Fail-soft: unknown template id → `{ ok: false, reason: 'unknown_template' }`; no valid target → `'no_target'`; actor not an autonomous decision actor → the lever still starts it (a review is a review) but reports `'below_spotlight'` so the caller knows checkpoints will roll only if the phase visits this actor — and the live proof treats that as a failed claim, not a pass.

Surfaces: `window.__DEBUG.startUndertaking(agentRef, templateId, { target?, band? })` (async, declared in `debug-bridge.d.ts`); CLI `spawn undertaking <agent|@first> <templateId> [--target <location|actor>] [--band <band>]` in `debugCommands.ts`; URL `?undertaking=<templateId>` in `GameView.tsx`, staging on **The First** (spotlight, followed by default per ruling 2.1, so every later moment interrupts) with the `?spawn` retry-until-world-ready pattern (`REVIEW_LEVER_MAX_ATTEMPTS`). `@first` is a new CLI alias resolving to the bonded First; the CLI world has no thread edges, so it falls back to the first `isAutonomousDecisionActor` and prints the resolution note (the noun-before-verb rule).

### 2. The band pin (`?outcome` analog)

`setUndertakingBandPin(templateId, band)` / `getUndertakingPinVerdict()` in the same module, module-state like `debugOutcomePin`. `resolveUndertakingCheckpoint` (`undertakingCheckpoints.ts:389`) reads the pin at the one place it calls `resolveStepCore` (`:512`) and passes it as `bandOverride` — the seam doc 1 §1 put there for exactly this and no caller has used. The roll, floors and traces stay honest; only the band is substituted, and every downstream consequence (creation effects on that band, halts, forks, moments, the failure residue) fires for real. The pin applies to **every checkpoint** of that template's projects while set; a reviewer wanting one bad step pins `failure`, ticks once, clears it.

Verdicts (the anti-vacuity half, copied from THR-1030): `band_landed` (a checkpoint of the named template resolved on the pinned band), `no_effect_on_band` (it landed, but the template authors no `creationEffects` entry and no residue class for that band — the base checkpoint texture rendered, which the URL must not let a reviewer mistake for authored content), `not_reached` (no checkpoint of that template resolved yet). `?outcome=` is **reused**: when `?undertaking=` is present the pin targets that template's checkpoints; when both `?spawn=` and `?undertaking=` are present, `?spawn` wins and one console warning says so (precedence stated, never silent).

### 3. Force-moments (`?forceencounters` analog)

`?forcemoments` follows every spotlight individual at world-ready through `followAgent` (the single writer — never a parallel follow set) and promotes the `started` class to interrupt tier **for the flag's lifetime only** (a review-scoped override read by `resolveMomentPresentation`, defaulting to ruling 2.1's badge-tier founding). What `?forceencounters` does for encounters — widen what a threaded agent shows without surfacing the unthreaded world — this does for moments: every spotlight mortal's undertaking interrupts, ambient mortals stay invisible. `__DEBUG.forceMoments(true|false)` is the headless twin. Combinable: `?view=game&seeded&size=medium&undertaking=strategic_chart_the_wilds&forcemoments&outcome=success_at_cost`.

### Graph nodes / edges

None new. The start lever writes through the existing start path; the pin writes nothing; force-moments writes `followedAgentIds` through its owner.

### Tick phases

No new phases. The lever's start lands in the strategic runtime and is advanced by `2a.55` like any other; the pin is read inside `2a.55`'s checkpoint pass.

### Resolution logic

Unchanged. `bandOverride` is applied at the tail of `resolveStepCore` after the roll, floors and resist — the THR-1030 placement, already implemented in the core.

### PRNG callouts

The lever draws nothing itself; the started project's checkpoints use `checkpointRng(seed, tick, projectId)` as today. The live-proof script derives its world from `--seed` and the target choice is the deterministic first valid (owned-first for destroys) — no `Math.random()` anywhere in the line.

## Content pillar

The line, stage by stage, with what is copied and what is undertaking-specific.

```
BRIEF ─▶ DRAFT ─▶ CRITIC LOOP ─▶ MACHINE GATES ─▶ LIVE PROOF ─▶ BATCH REVIEW
(kind grid) (Fable) (editorial+systems  (check:undertaking) (check:undertaking-live) (Christian samples 2)
                     +package critic)
```

### Step 0 — the canon page

`Docs/canon/undertakings.md`, ≤200 lines, the README schema. Sections: **Current spec** (the template type and its authored seams, the kind registry and the no-destroy rule, the seven packs and the `factory/` pack, the pipeline skill, the gate runner, the levers, the census instruments, the UL terms — undertaking, kind row, work, christening, failure-name register, freehold, calling, moment, follow); **Active design plans** (the six map docs + this one); **Rejected approaches** (hand-registration in three files; register-free strategic prose; initiatives as a second pipeline, THR-1292 §3; control upkeep, THR-1303; behavior families as a player-facing word, THR-1281 §7b; `strategic_recruit_warband` completing while minting nobody, THR-1309); **Open questions** (the `sublocation` and `faction` destroy verbs; the ambient-tier aperture, THR-1348; the harm-supply question, THR-1388). It lands in **slice 1 with the runner it points at**, not before — a canon page linking a script that does not exist is drift on day one. `Docs/canon/README.md` gains the row; the authoring brief gains a compiled undertaking section from this page (sha-pinned, `check:authoring-brief` covers it).

### Stage 0 — the brief, keyed on the kind × CRUD grid

`Docs/plans/undertakings/<slug>-brief.md`, format card at `.claude/skills/undertaking-pipeline/reference/batch-brief-format.md`. The encounter brief names variance across reaches, shapes and settings; **an undertaking brief names variance across the grid** — which kind rows and which CRUD cells the six templates fill — because that grid is what the substrate is shaped as. Required headings, each a decision nobody else made:

- **Why this batch** — one paragraph about the *player* (what a followed mortal can now do or suffer that they could not before).
- **Grid cells** — a table `kind × C/U/D` with the six slots placed; **gap-weighted toward empty cells** (today: `sublocation` D and `faction` D are empty, which is why those two rows are not registered). A brief that fills only C cells is a brief for works nobody can take back and is rejected on sight — the grammar's own rule applied at planning time.
- **Variance targets** — tier spread (no tier more than three), reach spread (no reach more than twice as primary), families (no family more than twice), target subtypes (no subtype more than twice), harm classes (**≥2 harm-capable templates per batch while THR-1388's zero stands** — the factory adds supply; THR-1388 decides whether to retune), `motivations` spread (no value pair more than three times across six), cast (≥3 templates declare a `must-persist` slot with an identity requirement — the review's "scarcity + identity" obligation, made a batch floor rather than a per-template rule), `remote` (≤1).
- **The mechanical fix, before any premise** — every slot's `verb`, `executionMode`, `tier`, `checkpointDifficulty` (inside the tier band), `projectDuration`, `payoffValue` (inside the tier band), `motivations`, `targetRule`, `requiresLocation`, `canRunBeside`, `remote`, `cast` slots, `creationEffects` per band, `mutationHint` or the kind's object, `motiveGate` + `harmClass` for destroys. **Game design first — all of it** (director ruling 2026-08-24, recorded in the encounter spec § Authoring order): the prose is written *inside* these; a brief whose fiction came first is rejected on sight.
- **Anchors the batch touches** — which existing economies the works enter (Secrets & Favors, clues, trade, holdings), so the package critic has something to judge.
- **Out of scope.**

Agent-drafted, **Christian-approved in chat before the batch runs** (ruling 2, copied). That approval is the one HITL gate on the whole line.

### Stage 1 — draft (Fable), against the Undertaking Contract as skeleton

`agents/draft-prompt.md`. The draft fills an `UndertakingContentPackage` (§ Stage 4b) block by block; it does not decide whether blocks exist. Injected: the brief's slot, the kind row it fills, `Docs/authoring-brief.md` Section A first (register and narrator mode govern every line of `activityProse` / `completionProse` — a mortal's undertaking is narrated from outside, present tense, the agent named; no interior sensation), the kind-row catalog (`reference/kind-row-catalog.generated.md`, generated from `UNDERTAKING_KIND_ROWS` so it cannot drift), and the shipped exemplar for the slot's tier (`strategic_cultivate_informant`, `strategic_establish_trade_route`, `strategic_recruit_warband` — the three vertical-slice templates, the corpus's proven arcs).

### Stage 2 — critic loop, bounded at two, then park

Editorial (Opus; register per Section A, the narrator's checklist reduced to the six questions an undertaking line answers — who acts, on what, at what cost, what stands after, who could take it, what it leaves for the world) → systems (Sonnet; every id resolves — kind row exists and the CRUD cell is legal for the verb, `motiveGate` ⊆ `MOTIVE_GATE_KINDS`, `harmClass` in the union, `targetRule` subtypes exist, `mintRole` is an `NpcRole`, `sublocationTypeId` resolves, `catalystEncounterIds` resolve, every `motivations` entry is in `VALUE_PAIRS`, the named ambition profiles exist) → **package critic** (Opus, THR-1154's third critic, undertaking edition). Two loops then `Docs/plans/undertakings/<slug>-parked.md` with both fix-lists; the batch report carries it as parked. Copied whole from ruling 4.

**The package critic's two halves, undertaking edition (Law 56, both clauses).** On the moment card every chip is engine-derived — `momentCardModel.buildChips` reads the runtime and the graph and *cannot* render prose as a chip (its header says so). So the Law 56 hazard on undertakings is the **inverse leak**: `completionProse` naming a consequence the engine never writes — a hall that no `mutationHint` builds, a map that no `spawn_*` mints, a rival ruined by a template with no `harmClass`. **Half A (mechanical, shared with the gate):** the template's *write set* — `mutationHint`, `creationEffects` per band, `harmClass`, kind-row membership (christening, and a freehold when `ownable`), `catalystEncounterIds` — is the only set of consequences its prose may name; the critic lists each consequence noun in the completion prose and binds it to a member or folds it. **Half B (judgment):** *what does this work leave that a later encounter, undertaking or grievance can pick up, and would the player recognise it happening?* — the anchors the brief promised. `PACKAGE PASS` / `PACKAGE FIX` (does not consume a loop) / `PACKAGE PARK`.

### Stage 3 — machine gates: `npm run check:undertaking -- <templateId> | --all`

`scripts/check-undertaking.ts` over `src/data/content-eval/undertakingContract.ts` (pure, authoring-time, importable by the Package View; nothing under `src/engine/**` imports it). The stack, structural first, and **every rule below is the review's §3 row for this doc, encoded**:

| Block | Requirement | Validator |
|---|---|---|
| Identity | `strategic_` id prefix, `displayName` plain (no numerals, no metaphor — interactive text), `verb`, `executionMode`, `behaviorFamily`, non-empty `reachProfile` | contract |
| **Kind membership** | every `multi_tick_project` template is named in exactly one kind row's C, U or D column; an `instant` template may be row-less but must carry a `mutationHint` (a verb that changes nothing is not a verb) | contract + `getUndertakingKindForTemplate` |
| **Counter-play** (schema completeness, destroy verb) | `verb: 'destroy'` ⇒ non-empty `motiveGate` ⊆ `MOTIVE_GATE_KINDS`, a `harmClass`, and a `targetRule` that can resolve an ownable or commanded object; **and** the registry as a whole passes `validateKindRegistry` — a template that would leave a row destroy-less fails here, not in a test three files away | `validateKindRegistry` (composed) |
| **Cast declarations** (scarcity + identity) | a `multi_tick_project` create/update template declares `cast`; every `must-persist` slot carries `mintRole` and an `identityRequirement`; `acceptedRoles` non-empty on reuse slots (the scarcity axis the scored binder weighs — an any-role slot cannot be scarce) | contract |
| **Creation** | a `create` verb declares `creationEffects` with ≥1 band **or** a `mutationHint` producing the kind's `objectShape`; a template whose only product is prose fails (the write-set non-vacuity rule — Law 56's inverse) | contract |
| **Band tables** | `checkpointDifficulty` inside `UNDERTAKING_TIER_DIFFICULTY_BANDS[tier]`, `payoffValue` inside `UNDERTAKING_TIER_PAYOFF_BANDS[tier]`, `projectDuration` set for `multi_tick_project`; tier read from the kind row | contract |
| **Board authoring** | `motivations` ≥ `UNDERTAKING_MOTIVATION_MIN_ARITY` distinct `VALUE_PAIRS` members (`findMotivationDefects`, lifted from the test into `content-eval/`); `payoffValue` present | composed |
| **Reachability** | the id appears in ≥1 ambition template's `strategicProfile.templateIds` — the third registration, the silent one | contract (reads `ambition-templates.ts`) |
| **Register** (at the encounter standard) | over `activityProse` + `completionProse` as the `outcome` field class: evasive vagueness 0 (`countVagueness`), second person 0 (`countSecondPerson`), numerals 0, no exclamation marks, present tense spot-check (the doctrine-v2 structural check, warn), `activityProse.length ≥ UNDERTAKING_ACTIVITY_PROSE_MIN`, `completionProse.length ≥ UNDERTAKING_COMPLETION_PROSE_MIN`; abstraction and intensifiers report to the **warn channel** (THR-1224 / THR-1092 — they rank, they do not gate) | `nudgeAuditDetectors` text functions, imported |
| **Enrichment dry-run** | every `{token}` in the two prose fields is one the strategic prose renderer resolves; the set is read off the renderer's replacement chain the way `SIMPLE_TOKENS` was read off `enrichProse` | contract |
| **Law 56 write set** | the Half A list: every consequence noun the completion prose names resolves to a member of the declared write set — machine-checked against a per-kind lexicon (`UNDERTAKING_CONSEQUENCE_LEXICON`: the nouns each `mutationHint` / `creationEffect` / `harmClass` may be named by), **warn-level** at introduction, promoted to a gate by the pilot's findings (the THR-1224 bar: right most of the time is a warning's bar) | contract, warn → gate |

**No exemptions** (ruling 3). The only escape is `UNDERTAKING_RETROFIT_PENDING` (`src/data/content-eval/undertakingRetrofitPending.ts`): the 64 shipped templates predate the contract; every id that fails at introduction is named there once, the list only shrinks, and `undertakingContract.test.ts` fails both ways (a listed template that now passes; an unlisted one that fails). Regenerate only to remove: `npm run check:undertaking -- --all --list-failures`. **Green is a precondition for a PR existing.** CI: the required check runs `check:undertaking --all` when `src/data/strategic-packs/**`, `undertaking-kinds.ts` or `ambition-templates.ts` change — the `check:encounter` wiring, one more path.

### Stage 4 — live proof: `npm run check:undertaking-live -- <templateId> [--seed N] [--band <band>]`

`scripts/undertaking-live-proof.ts`. Stage 3 asks whether a template *declares* its blocks; this asks whether they *arrive*. Seeded world (`initializeGameState` → `runTick`, the census's substrate), `UNDERTAKING_LIVE_PROOF_WARMUP_TICKS`, then the start lever on the first autonomous actor whose reach profile the template accepts (owned-first target for destroys), then tick to a terminal or `UNDERTAKING_LIVE_PROOF_MAX_TICKS`. Claims, **gated on what the template declares** through one shared predicate (`undertakingWriteSet()`, the same function the contract counts with — one predicate, two consumers, the encounter line's rule):

| Declared | Arrived means |
|---|---|
| started | a `strategic_action_started` trace with `startedBy: 'review_lever'` for this template |
| checkpoints | ≥1 `undertaking_checkpoint` trace that **rolled** (not `actor_absent`-deferred every time — the THR-1310 finding must fail here, not pass) |
| `cast` must-persist | a `binding_decision` bound each slot; minted actors exist in the graph with the `mintRole` |
| `creationEffects` on the landed band (or the pinned one) | the node exists (`spawn_sublocation` → a location with `parentLocationId`; `spawn_npc` → an actor) |
| `mutationHint` at completion | the kind's `objectShape` exists — `trades_with` edge + route node, place-tier location, `groupKind` company, `knows_secret_of` edge, treasure-map possession, intelligence record |
| kind row, completed | `christenedName` on the `strategic_world_change` trace differs from the working possessive; `ownable` ⇒ an `owns` edge and a `holding` face |
| `harmClass` | an `evt_und_<projectId>_<tick>` outcome node with a `culpritAgentId` and a victim |
| moments | `pendingUndertakingMoments` (or the `moment_surface` trace) carries `started` and the terminal class |

Verdicts, read not exit-coded: `proved` / `failed` / **`vacuous`** (declared nothing beyond the baseline — counted on its own line, never a pass). A template not in `TEMPLATE_REGISTRY` cannot be proved; the sweep says so. Determinism: same seed + template ⇒ same verdict; the tick-through throws are results (`no_tick_crash: fail`), not sweep crashes.

### Stage 4b — implementation: `npm run compile:undertaking -- Docs/plans/undertakings/<slug>.package.json`

`src/data/content-eval/undertakingPackage.ts` + `scripts/compile-undertaking.ts` (THR-1246's shape). The package **is** `StrategicActionTemplate` plus three registration fields — no parallel vocabulary, so the field-allowlist failure the legacy converter had is impossible by construction:

```ts
interface UndertakingContentPackage {
  readonly slug: string;
  readonly template: StrategicActionTemplate;                       // prose verbatim; the real type
  readonly kind: { readonly kindId: UndertakingKindId; readonly role: 'create' | 'update' | 'destroy' };
  readonly profiles: readonly string[];                              // ambition template ids to register into
  readonly docComment?: string;
}
```

The compiler: validates (unknown top-level keys loud; `kind.role` legal for `template.verb`; profiles exist); writes `src/data/strategic-packs/factory/<slug>.ts` annotated with the real type so `check:typecheck` is the deep validator; registers it in `FACTORY_STRATEGIC_TEMPLATES` (a new aggregate array joined into `TEMPLATE_REGISTRY` beside the seven packs — factory output never edits a hand-written pack array); **appends the id to the named kind row's column** in `undertaking-kinds.ts` idempotently — and for a kind not yet registered (`sublocation`, `faction`) **creates the row only when the package is its first destroy**, so the registry's own rule (no row without counter-play) is honored by the tool that writes rows; appends the id to each named profile's `templateIds`; emits `src/data/strategic-packs/factory/__tests__/<slug>.test.ts` with expected values baked from the package. The compiled file is the canonical, hand-editable artifact from then on — a configurator, not a build step.

### Stage 5 — batch report: `npm run undertaking:batch-report -- <ids…> --brief <path>`

`scripts/undertaking-batch-report.ts`, a renderer that runs nothing itself — it shells `check:undertaking --json` and `check:undertaking-live --json` (the encounter report's rule: a report that re-implements a check drifts from CI). Leads with **one table, six rows**: kind · cell · tier · verb · primary reach · family · harm · gate · live · package · two links (`?view=game&seeded&size=medium&undertaking=<id>&forcemoments`, and the Package View). Below it the **grid coverage table** (kinds × C/U/D, before and after this batch) — the variance the director reviews for on this line — then the reach/tier/motivation spread, then per-template detail, then the census pointers (`census:undertakings` on both seeds must still sit inside the envelope; `census:reachability` for the families touched). Christian samples two in chat; his verdict feeds the next brief.

### The pilot batch

`Docs/plans/undertakings/pilot-brief.md`: six slots, gap-weighted — **`sublocation` D** (a warlord's raze of a built room, cross-family, `motiveGate` from `MOTIVE_GATE_KINDS`, `harmClass: 'property_destroyed'`; registers the ninth row), **`faction` D** (a court's dissolution or schism verb, motive-gated, riding `phaseSchismResolution`'s existing split as its mutation; registers the tenth row), two more harm-capable cells (the batch floor while THR-1388's zero stands), and two U cells on thin rows. Pilot findings amend the contract before volume — the encounter factory's own sequence. **The pilot's acceptance is the existing envelope**: `census:undertakings` on seeds 42 and 99 inside `BOARD_UNDERTAKING_SHARE_RANGE`, the throughput floor, the variety floor, the cap gate — unchanged by this doc.

### Prose tables · Attachment content · Data tables

No new prose tables (the two template fields are the prose). No attachments. Data: the two constants modules (§ Constants), `UNDERTAKING_RETROFIT_PENDING`, `UNDERTAKING_CONSEQUENCE_LEXICON`, the generated kind-row catalog.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — the CMS Package View, the moment card the URL lever opens). No WebGL in scope.*

### Player-facing display

**The Undertaking Package View** — `?view=cms#undertaking-packages`, `src/components/CMS/undertaking-package/` beside the encounter one, registered in `useCmsHashRoute` (the THR-1046 surface, one page per template). Blocks: identity and the calling word its family maps to; the kind row and which cell this template fills, with the row's other cells linked; the board values as words (difficulty and payoff banded through the existing `difficultyWord` / progress vocabulary — **never the numeral**, Law 13, the UI Law's upstream clause); cast slots with role, persistence and identity requirement; creation effects per band; the mutation op and the object it makes; harm and motive gates; `activityProse` and `completionProse` rendered in the moment card's register; the contract verdict inline with its warn channel; the live verdict when a JSON exists. Designer-facing, but the UI Laws hold (it is how Law 1 gaps are seen). Laws engaged: 1 (real data — it reads the registry), 13/14 (words, banded), 17 (empty state for a template with no live proof), 21 (kind-row links route), 33, 37 (identity chrome), 56 (the write-set block is literally the chip-backing list). The **moment card is unchanged** — doc 5's surface; the URL lever opens it, it does not restyle it.

### Event notifications

None new. `?forcemoments` changes *which* moments interrupt during a review session, through the existing registry with cause named (Laws 39/52); no toasts (ruling 2.1).

### Debug inspection (DebugPanel)

`window.__DEBUG.startUndertaking(agentRef, templateId, opts)`, `pinUndertakingBand(templateId, band)` / `getUndertakingPinVerdict()`, `forceMoments(on)` — all async, declared with JSDoc in `debug-bridge.d.ts`. CLI: `spawn undertaking …`, `undertakings [agent]` (the `projects` block narrowed, with kind and cell), `follow <agent>`. `F1` opens the CLI tab; the review URL is the deployed-build route.

### Visual presence (HexMapV2)

N/A — no map-layer work; a review-started undertaking renders its existing `StrategicMarkerMesh` marker like any other.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|------------------|
| `undertakingReviewLevers.ts` (new) | none — writes into the strategic runtime consumed by `2a.55` | GameView URL effect; MomentCard (opened by the start's moments) | `strategicState.projects` (via the start path), `followedAgentIds` (via `followAgent`) | additive fields on `strategic_action_started` + `undertaking_checkpoint` | `__DEBUG.startUndertaking` / `pinUndertakingBand` / `getUndertakingPinVerdict` / `forceMoments`; CLI `spawn undertaking`, `undertakings` |
| `undertakingCheckpoints.ts` (pin read, one line) | `2a.55` | — | — | `bandPinned` on the checkpoint trace | `getUndertakingPinVerdict` |
| `undertakingContract.ts` + `undertakingRetrofitPending.ts` (new, authoring-time) | none | Package View reads the verdict | — | — | `check:undertaking` |
| `undertakingPackage.ts` + `compile-undertaking.ts` (new) | none | — | — | — | `compile:undertaking --dry-run` |
| `undertaking-live-proof.ts`, `undertaking-batch-report.ts` (new scripts) | headless `runTick` | — | — | reads traces above | `check:undertaking-live`, `undertaking:batch-report` |
| `strategic-packs/factory/` + `FACTORY_STRATEGIC_TEMPLATES` | `2b` candidates via `TEMPLATE_REGISTRY` | ThreadsPanel / JourneyTab (existing) | — | existing decision traces | `encounters` CLI block, census |
| `UndertakingPackageViewer.tsx` (new) | none | CMS `#undertaking-packages` | — | — | Playwright at 1920×1080 |
| `.claude/skills/undertaking-pipeline/` + `Docs/canon/undertakings.md` + brief section | none | — | — | — | `check:authoring-brief`, canon README row |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNDERTAKING_BATCH_SIZE` | 6 | batch size (encounter ruling 1, copied) |
| `UNDERTAKING_CRITIC_LOOP_MAX` | 2 | loops before park (ruling 4) — lives in the skill, governs agent behaviour |
| `UNDERTAKING_DIRECTOR_SAMPLE` | 2 | of six, Christian's chat sample |
| `UNDERTAKING_TIER_DIFFICULTY_BANDS` | T1 `[0.35, 0.50]` · T2 `[0.45, 0.60]` · T3 `[0.50, 0.65]` | the band table the gate checks `checkpointDifficulty` against (doc 2's authored values sit inside: 0.40–0.45 / 0.50–0.55 / 0.55–0.60) |
| `UNDERTAKING_TIER_PAYOFF_BANDS` | T1 `[0.4, 0.9]` · T2 `[1.0, 1.7]` · T3 `[1.8, 2.4]` | the payoff band per tier (doc 2: ~0.5–0.8 / 1.2–1.6 / ~2.0) |
| `UNDERTAKING_MOTIVATION_MIN_ARITY` | 2 | lifted from `undertaking-motivations.test.ts`'s `MIN_MOTIVATION_ARITY` into `content-eval/` |
| `UNDERTAKING_ACTIVITY_PROSE_MIN` / `_COMPLETION_PROSE_MIN` | 2 / 1 | prose floors |
| `UNDERTAKING_ACTIVITY_LINE_WORD_BUDGET` / `_COMPLETION_LINE_WORD_BUDGET` | 30 / 40 | warn-level budgets (the doctrine's word-budget class) |
| `UNDERTAKING_CONSEQUENCE_LEXICON` | per write kind | the nouns each mutation / creation / harm may be named by in prose (Half A) |
| `UNDERTAKING_LIVE_PROOF_WARMUP_TICKS` | 2 | world warm-up before the lever fires |
| `UNDERTAKING_LIVE_PROOF_MAX_TICKS` | 60 | tick-to-terminal bound (longest `projectDuration` today 12, plus deferrals) |
| `UNDERTAKING_LIVE_PROOF_SEEDS` | `[42, 99]` | the sweep's seeds — the census's two |
| `REVIEW_LEVER_MAX_ATTEMPTS` | 30 | URL retry until the world resolves The First (the `?spawn` value) |
| `REVIEW_LEVER_BYPASSABLE_GATES` | `['ambition_profile', 'active_cap', 'motive_gate']` | the closed set a review start may skip — anything else is not a review start |
| `UNDERTAKING_PIN_BANDS` | the six `StepOutcome` values | what `?outcome=` accepts on an undertaking |

## Tracing

No new categories (deliberate — four registration sites per category; both additions ride existing interfaces):

```ts
// StrategicActionStartedTrace — additive (existing category 'strategic_action_started')
interface StrategicActionStartedTraceAdditions {
  startedBy?: 'board' | 'review_lever';        // absent ⇒ 'board' (every shipped writer)
  bypassedGates?: readonly ('ambition_profile' | 'active_cap' | 'motive_gate')[];
}

// UndertakingCheckpointTrace — additive (existing category 'undertaking_checkpoint')
interface UndertakingCheckpointTraceAdditions {
  bandPinned?: StepOutcome;                    // set only when the review pin substituted the band
}
```

The census reads `startedBy` and **excludes review starts** from throughput and variety — a review session must never inflate a gate.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `?undertaking=` names an unknown template | retry ceiling, one warn, game proceeds (the `?spawn` shape) |
| Lever finds no valid target | `{ ok: false, reason: 'no_target' }`, traced; live proof records `started: fail` |
| Destroy under review, no owned target exists | falls back to any valid target **and says so** (`targetOwnership: 'unowned'` on the result) — the live proof's `harmClass` claim then fails honestly instead of passing on a victimless razing |
| Lever's actor is below spotlight | starts anyway, reports `below_spotlight`; live proof fails the `checkpoints` claim if none roll |
| Unknown band string in `?outcome=` | pin refused, one warn |
| Pinned band with no authored effect on that band | base texture renders; verdict `no_effect_on_band`, console line + `__DEBUG` |
| `?spawn=` and `?undertaking=` both present | `?spawn` wins; one warn names the precedence |
| Template throws during live-proof ticking | recorded as `no_tick_crash: fail` with the message; sweep continues |
| Template not in `TEMPLATE_REGISTRY` | live proof refuses up front with the registration hint |
| Compiler: kind row missing and package is not a destroy | refuse with the registry's own rule quoted — never create a destroy-less row |
| Compiler: profile id unknown | refuse; a template registered in no profile is the dead-content shape this line exists to end |
| Contract run on a pre-contract template | passes only while named in `UNDERTAKING_RETROFIT_PENDING`; a stale entry fails the suite |
| Consequence lexicon misses a noun | warn channel; never a false gate (right-most-of-the-time bar) |
| `forcemoments` with no spotlight mortals resolved yet | retries with the lever; follows nobody rather than throwing |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | ~115 | two optional fields on two existing interfaces — additive; no union member added, no existing type changes (the THR-1298 precedent) |
| `src/types/strategicAction.ts` | high (types) | zero changes — every seam the gate checks already exists; `UndertakingContentPackage` lives in `content-eval/` |

## Interface impact

*Design workflow Step 0.7 — contracts per `Docs/canon/interface-map.md` (Strategic Projects; Ambitions & Undertakings).*

| Contract / seam | Disposition |
|---|---|
| Ambition `strategicProfile.templateIds` → candidate generation | **extend the producer** — the compiler becomes a second writer of profile registrations (the first is a hand); the contract gains a static reachability check so the read half can never be silently empty for a factory template |
| Kind registry (`UNDERTAKING_KIND_ROWS`) → naming / holdings / gates | **extend** — the compiler appends columns; `validateKindRegistry` is composed into the per-template gate (doc 2 pre-declared "doc 6's factory gates" as a reader) |
| `resolveStepCore.bandOverride` (doc 1's seam) | **activate** for undertakings — first caller; the encounter pin remains the other |
| `followedAgents` single writer | **preserve** — `?forcemoments` calls `followAgent`; no second writer |
| `pendingUndertakingMoments` / `moment_surface` | **preserve, read** — the live proof reads the queue; nothing new writes it |
| `strategic_action_started` / `undertaking_checkpoint` traces → census | **extend** — additive fields; the census learns to exclude `review_lever` starts |
| Encounter `content-eval/` detectors → gates | **extend the consumer set** — the text-level functions gain a second caller; no signature changes |
| `TEMPLATE_REGISTRY` ← packs | **extend** — an eighth source (`FACTORY_STRATEGIC_TEMPLATES`) |

## Three-pillar check

- [x] Engine pillar present — the three levers, wired through existing seams
- [x] Content pillar present — the line (this doc's center of gravity)
- [x] UI pillar present — the Package View; moment card explicitly unchanged
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. `Vision/00-north-star.md` — *"The player who saw one mortal's full arc is having a better time than the player who touched fifty"* and *"a story the player can tell in prose"* — is served by making the supply of witnessed arcs a line rather than a session, and the map's own north star #2 (*"revisit a region … it has visibly changed hands … and the chronicle names who did it"*, THR-1276 Notes) by gap-weighting the brief toward the two rows that still cannot be taken back. `Vision/02-non-negotiables.md` §2 *"Narrative over mechanical perfection"* is honored by the package critic's judgment half and the director's ceiling sample; `Vision/03-design-tensions.md` §2 *"Systemic emergence vs. authored moments"* is navigated by the brief's rule that a slot is a grid cell and a mechanical fix before it is a story.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan changes no rule of play. It is tooling plus the content that fills existing rules (§10.6–10.8 of `Docs/canon/rulebook.md`). The pilot's two new kind rows are content facts under the existing "until a kind can be undone, it is not a kind" rule; the `[IMPL]` pointers for undertakings already stand.
- [x] No `Docs/canon/rulebook.md` edit owed in this PR; the executor adds the `check:undertaking` / `?undertaking=` pointers to `Docs/canon/undertakings.md`, not the rulebook.

> Brainstorm companion: `Docs/plans/2026-09-02-thr-1300-undertaking-factory-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every gate threshold, band, budget and lever bound is a named export (table above); the bypassable-gate set is a closed constant |
| 2. Inspectability | PASS | every stage emits a readable artifact (gate report with warn channel, live-proof JSON with per-claim verdicts, batch report, Package View); review starts are marked in the trace so a census can exclude them; the pin reports a verdict rather than pretending the dice rolled it |
| 3. Determinism | PASS | gates are pure over template data; live proof runs the seeded engine with deterministic target choice; the lever draws no PRNG of its own; no gate consults an LLM |
| 4. Fail-soft | PASS | authoring-time tooling fails loud by design (ruling 3 — the contract hard-fails a missing block); the runtime levers never throw (fifteen-row table); the live proof records a tick throw as a result |
| 5. Narrative over mechanical perfection | PASS | the package critic judges what a work leaves for the world; the register stack gates the floor and the director holds the ceiling; game-design-first is what keeps the fiction honest to the mechanics rather than the reverse |
| 6. Additive over destructive | PASS | factory output lands in its own `factory/` pack, never inside a hand-written array; two additive trace fields; the pin rides an unused seam; `?outcome=` is re-scoped by presence of `?undertaking=`, not changed for encounters |
| 7. Performance budget | PASS | all line machinery is authoring-time; the two runtime reads (pin lookup per checkpoint, `startedBy` field) are a map read and a string; `?forcemoments` is review-only |

## Kill criteria

- **The pilot cannot clear the gate in ≤2 loops on ≥4 of 6** → the contract is miscalibrated, not the drafts; recalibrate the contract (record which block) before any volume batch — the encounter factory's own sequence.
- **`check:undertaking-live` reports `vacuous` on >2 of the pilot's 6** → the brief asked for too little; fix at brief level, never by loosening the write-set rule.
- **`UNDERTAKING_RETROFIT_PENDING` does not shrink across the pilot and one volume batch** → the ratchet has become an exemption list; stop and audit whether the contract's blocks match the corpus's real shape.
- **A review-lever start passes live proof on a claim the board could never produce** (a victimless destroy proving `harmClass`; a below-spotlight start proving `checkpoints`) → the lever has laundered a vacuous proof; tighten the lever before proving anything else.
- **The pilot's six move `census:undertakings` outside the envelope on either seed** → pull the batch, do not retune the board; the board's constants are THR-1349's, and a batch that needs them moved is the wrong batch.
- **`?forcemoments` produces more than one modal at once** → the review override has bypassed the interrupt registry; it must route through `resolveMomentPresentation`, never around it.

## Done when

*(Slice-scoped; each slice is its own PR, sequential — "strangler, never big-bang". Closing commit carries the keyword.)*

- [ ] **Slice 1 — contract, runner, ratchet, canon, skill skeleton:** `undertakingContract.ts` + `undertakingRetrofitPending.ts` + `scripts/check-undertaking.ts` (`npm run check:undertaking`) green on `--all` with every pre-contract failure named once; `undertakingContract.test.ts` falsified per block against adversarial fixtures (one per rule, each differing from a known-good template in one respect — the registry test's shape); `Docs/canon/undertakings.md` live and in `Docs/canon/README.md`; `.claude/skills/undertaking-pipeline/SKILL.md` + `reference/batch-brief-format.md` + `reference/kind-row-catalog.generated.md` (generator + freshness check); the authoring brief's undertaking section compiled; CI path wiring
- [ ] **Slice 2 — the levers:** `undertakingReviewLevers.ts`, the pin read in `undertakingCheckpoints.ts`, `__DEBUG` accessors declared, CLI verbs, URL flags; **browser-verify** `?view=game&seeded&size=medium&undertaking=strategic_chart_the_wilds&forcemoments` — 1920×1080 screenshot of the moment card opened by the lever, console `(no errors or warnings)` or the real lines, `await __DEBUG.getStrategicProjects()` showing the review-started project and `await __DEBUG.getUndertakingMoments()` carrying its `started` record, Laws 1, 13/14, 17, 21, 33, 37 judged; a 30-tick CLI smoke with `spawn undertaking @first strategic_cultivate_informant`
- [ ] **Slice 3 — live proof + compiler:** `check:undertaking-live` proves one shipped template per tier **non-vacuously** on seeds 42 and 99 (`strategic_cultivate_informant`, `strategic_establish_trade_route`, `strategic_recruit_warband`); `compile:undertaking` round-trips a package to a `factory/` module byte-identically (prose pinned by test), registers row + profiles idempotently, refuses a destroy-less new row; the five agent prompts and `reference/undertaking-package-format.md`
- [ ] **Slice 4 — report + Package View:** `undertaking:batch-report` renders the grid coverage table; `?view=cms#undertaking-packages` renders one shipped template (Playwright 1920×1080 + console + `__DEBUG` assertion); wiki page row (`public/wiki-manifest.json` sources for `strategic-packs/**` name the page) and interface-map rows updated
- [ ] **Slice 5 — the pilot:** brief drafted and **approved by Christian in chat** (the one HITL gate; plain-language summary with the grid table and two links, one yes/no question); six templates through the line, `sublocation` and `faction` rows registered by the compiler with their destroys; batch report written; `census:undertakings` seeds 42 + 99 inside the envelope; Christian samples two in chat and his verdict is recorded on the issue
- [ ] `npm test` · `npm run check:typecheck` · `npx vite build` · `npm run test:heavy` locally (engine touched) · 30-tick engine smoke · freshness gates **last**; `UL-proposal` filed for *Undertaking Contract* and *batch brief* (undertaking sense)
- [ ] Closing commit body includes `Fixes THR-1300`

## Coordination block

**Suggested model:** opus — five slices of tooling that must compose eight existing validators without restating them, plus Fable-authored pilot prose through a bounded critic loop (advisory; the automation runs Opus regardless).

**Parallel-safe with:** [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) / [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (encounter-line batches — different scripts, different data directories; both read `nudgeAuditDetectors.ts` and neither edits it); [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) (aperture design — the pilot brief assumes spotlight reach only); [THR-1380](https://linear.app/threadbare/issue/THR-1380/ul-proposal-calling-moment-follow-the-undertaking-surface-vocabulary) (UL shard only); [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) (its remaining scope is the `decisionBoardModeGuard` deletion — disjoint files).

**Mutex with:**
- [THR-1388](https://linear.app/threadbare/issue/THR-1388/the-live-board-starts-no-harm-capable-undertakings-on-the-default) (harm supply): the pilot batch adds harm-capable templates, which changes the very count THR-1388 must measure first. **Sequence THR-1388's measurement before slice 5 lands, or re-measure after** — slices 1–4 are safe to run beside it (both read `strategic_candidate_board` refusals; neither edits the board's constants).
- [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) (control deletion): both touch `strategicActionCandidates.ts` — the lever imports its target/candidate helpers, THR-1303 deletes the control family from it. Declare; do not overlap in one window.
- [THR-1387](https://linear.app/threadbare/issue/THR-1387/a-spotlight-mortal-can-carry-eleven-concurrent-undertakings-cap-active) is Done; its `active_cap` refusal is one of the three the lever may bypass — the bypass list is closed on purpose.

**Files to touch:**
- Create: `Docs/canon/undertakings.md`; `.claude/skills/undertaking-pipeline/{SKILL.md, agents/*.md, reference/batch-brief-format.md, reference/undertaking-package-format.md, reference/kind-row-catalog.generated.md}`; `scripts/{check-undertaking.ts, undertaking-live-proof.ts, undertaking-batch-report.ts, compile-undertaking.ts, generate-kind-row-catalog.ts}`; `src/data/content-eval/{undertakingContract.ts, undertakingRetrofitPending.ts, undertakingPackage.ts, undertakingConstants.ts}` + tests; `src/engine/undertakingReviewLevers.ts` + test; `src/data/strategic-packs/factory/` (aggregate + pilot output); `src/components/CMS/undertaking-package/` + test; `Docs/plans/undertakings/pilot-brief.md`
- Edit: `package.json` (five scripts), `.github/workflows/ci.yml` (path wiring), `src/engine/undertakingCheckpoints.ts` (pin read at `:512`), `src/engine/strategicActionCandidates.ts` (`FACTORY_STRATEGIC_TEMPLATES` in the registry; export the target/candidate helpers the lever reuses), `src/engine/debugCommands.ts` + `src/debug-bridge.ts` + `src/debug-bridge.d.ts`, `src/components/Game/GameView.tsx` (URL flags beside `?spawn`), `src/engine/followedAgents.ts` (only if `forcemoments` needs a bulk helper — prefer a loop over `followAgent`), `src/engine/undertakingCheckpoints.ts` `resolveMomentPresentation` (review override), `src/types/trace.ts` (two additive fields), `scripts/undertaking-census.ts` (exclude `review_lever` starts), `src/data/undertaking-kinds.ts` (rows appended by the compiler), `src/data/ambition-templates.ts` (profiles appended by the compiler), `scripts/build-authoring-brief.ts` (undertaking section), `Docs/canon/README.md`, `Docs/plans/wiring-checklist.md`, `public/wiki-manifest.json` + the essence-control / undertakings wiki page, `scripts/interface-contracts.ts`

## Notes for the executor

- **Copy the line, do not reinvent it.** Every script here has a sibling in `scripts/check-encounter.ts`, `encounter-live-proof.ts`, `encounter-batch-report.ts`, `compile-encounter.ts` — read the sibling's header first; the structure, the exit-code rules, the vacuity rule and the "renderer runs nothing" rule are all decided there. Where a rule differs it is stated in this doc; where it is not stated, the encounter line's rule holds.
- **The contract composes; it does not restate.** `validateKindRegistry`, `findMotivationDefects` (lift it out of the test file into `content-eval/`), the detector functions, and the mutation-hint pin already exist. A gate that re-implements one of them is a second rule that will drift.
- **Law 56 on undertakings is the inverse of the encounter case.** Chips are engine-derived (`momentCardModel.ts` header) so chip backing holds by construction; the leak is prose claiming state. The write-set rule is the gate; ship the lexicon half at **warn** and promote it on pilot evidence, exactly as the abstraction detector was demoted (THR-1092).
- **The canon page lands with slice 1**, not first: it points at `check:undertaking`, and a pointer to nothing is drift. Its rejected-approaches list is in this doc's § Step 0.
- **The lever is honest or it is nothing.** Every bypass is traced; a destroy with no owned target *says* so; a below-spotlight actor *says* so. The live proof reads those flags and fails the corresponding claim. If a proof can pass on a review-only path the board never takes, it is not a proof (kill criterion 4).
- **`?outcome=` precedence:** `?spawn` wins when both are present. Do not invent a third flag; re-scoping by presence is the additive move.
- **Do not retune the board or the motive gate for the pilot.** If the six change the census envelope, the batch is wrong (kill criterion 5). THR-1388 owns the retune question; the factory adds supply and reports.
- **The pilot brief is the one chat gate.** Present it per THR-608: the grid table, the six mechanical fixes in one line each, the two links, one yes/no question. A brief he has not approved is a suggestion, not a batch.
- **File at closeout:** the `sublocation` and `faction` rows' vertical-slice proofs (a raze on both seeds; a dissolution on both) as their own Done-when evidence lines on the issue; the UL-proposal; any lexicon nouns the pilot exposed as missing.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-02*

**Intent-judge (Step 8.5): Allow** — first pass, impact class confirmed External, 10 of 11
dimensions PASS, one GAP (dimension 5: the Vision audit quoted phrases that were not in the Vision
files — corrected in place before the PR: the north-star lines are now the file's own words and the
emergence-vs-authored premise is cited to `03-design-tensions.md` §2, where it lives). Both
author-flagged judgment calls upheld on verified code ground: the Law 56 inversion (chips are
engine-derived in `momentCardModel.ts`, so the gate targets prose claiming state) read as *"a how of
an agreed design — agent calibration per process rule 4"*; the lever's three-gate bypass read as
closed by `REVIEW_LEVER_BYPASSABLE_GATES` and kill criterion 4. Seam claims verified: `bandOverride`
exists at `stepResolutionCore.ts:132` with only an encounter-side caller; the plan's line anchors
in `undertakingCheckpoints.ts` are exact. Proposal:
`Docs/plans/.intent-proposals/thr-1300-undertaking-factory.md`.

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names every threshold as an export (`UNDERTAKING_TIER_DIFFICULTY_BANDS`, `_PAYOFF_BANDS`, prose floors, `REVIEW_LEVER_MAX_ATTEMPTS`); bypassable-gate set is a closed constant array |
| 2. Inspectability | PASS | Gate report + warn channel, live-proof JSON with per-claim verdicts, batch report, Package View; review starts marked via additive `startedBy` trace field so census can exclude them; pin reports verdict (`band_landed`/`no_effect_on_band`/`not_reached`) rather than silently faking a roll |
| 3. Determinism | PASS | Gates are pure over template data; live proof runs seeded engine with deterministic (owned-first) target choice; "no `Math.random()` anywhere in the line" explicitly stated; lever draws no PRNG of its own |
| 4. Fail-soft | PASS | 15-row fail-soft table covers unknown template/target/band, throws during ticking (`no_tick_crash: fail`), compiler refusals; runtime levers state "never throw"; authoring-time tooling is deliberately hard-fail by design (ruling 3), which is the correct fail-soft posture for a gate, not a violation |
| 5. Narrative over mechanical | PASS | Package critic Half B judges "what does this work leave for the world"; register stack (vagueness/second-person/numerals) gates the floor; game-design-first ordering is stated as keeping fiction honest to mechanics rather than inverted |
| 6. Additive over destructive | PASS | Factory output lands in its own `factory/` pack, never edits hand-written arrays; two additive trace fields (`startedBy`, `bypassedGates`, `bandPinned`) on existing categories, no union member added; `?outcome=` re-scoped by presence-of-flag, not changed for encounters |
| 7. Performance budget | PASS | All line machinery is authoring-time; only two runtime reads (pin lookup per checkpoint, `startedBy` field) — a map read and a string; `?forcemoments` explicitly review-only, not a standing runtime cost |

One gap worth flagging: the doc's own NFP table is nearly identical wording to this audit's rows, which is expected since a compliant plan doc states its own compliance — but this audit independently verified each claim against the doc's constants table, tracing section, and fail-soft table rather than trusting the self-reported table verbatim.

**NFP AUDIT: PASS**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Three review levers (start/pin/force-moments) fully specced with module, resolution logic, PRNG callouts, fail-soft table — all seam-composed, no new phase |
| Content | present-and-substantive | Full brief→draft→critic→gate→live-proof→compiler→batch pipeline specified, mirroring the encounter factory stage-by-stage with concrete file paths and validators |
| UI | present-and-substantive | Undertaking Package View (`?view=cms#undertaking-packages`) specced with blocks, UI Laws cited, moment card explicitly unchanged with rationale |

Missing-required-sections: None. Wiring section check: the Wiring table maps each of the eight new/edited modules to orchestrator phase (or explicit "none"), UI component, GameState field, trace emitted, and debug visibility. Substrate-existence check (THR-658): PASS — the plan opens with a `## Substrate inventory` listing nine existing subsystems, each 🟢 ACTIVE with an explicit extends/composes/mirrors disposition and a runtime population count; cross-checked against `Docs/canon/systems-inventory.md` (Ambitions & Undertakings, Strategic Projects & Control, phase `2a.55`) — no green-field duplication; the plan composes rather than rebuilds.

`PILLAR AUDIT: PASS`

### Vision audit

**Premises touched:** `00-north-star.md` → *"the player who saw one mortal's full arc… a story the player can tell in prose"* — extended (invoked as the rationale for turning hand-fed supply into a production line). `01-core-loop.md` → silent (moment card unchanged; review starts excluded from the census; the player-facing rhythm is untouched). `02-non-negotiables.md` → §2 narrative over mechanical perfection — confirmed; §1 god/protagonist separation — silent (the levers are authoring/debug surfaces, not a player intervention). `03-design-tensions.md` → §2 systemic emergence vs. authored moments — confirmed (the brief's mechanical-fix-before-premise rule and grid framing navigate the tension explicitly). `taste-profile.md` → prose-first UI, no numbers visible — confirmed (Package View bands difficulty/payoff as words); the register bar — confirmed (the gate imports the canonical detectors).

**Contradictions:** No contradictions found.

**Qualitative checks:** North star: indirect but genuine — supply infrastructure enabling more witnessed arcs, not a delivered moment. Core loop: preserved. Non-negotiables: clear — every new lever is an authoring/debug surface. Design tensions: leans authored-first without abandoning emergence. Taste profile: respected — no numerals, banded words, canonical detectors reused.

`VISION AUDIT: PASS-with-notes — north-star tie is indirect (infrastructure enabling future witnessed arcs); no contradiction, no revision needed.`
