---
domain: undertakings
last_reviewed: 2026-09-03
reviewer: claude-code
ul_shards: [Agents, Encounters, Prose]
status: live
---

# Canon — Undertakings

> An undertaking is a long work a mortal chooses on the same board they choose everything else on: a thing built, changed, taken or undone over several ticks, with checkpoints the world rolls and a name the work earns. The player follows a mortal into one; they never pick it for them.

**Step 0 for any undertaking authoring or factory work.** Load this page before `Docs/canon/encounters.md` or the packs. Where this page and the UL disagree, the UL wins (`Docs/ubiquitous-language/Agents.md`, `Encounters.md`).

## Current spec

### The template and its authored seams

`StrategicActionTemplate` (`src/types/strategicAction.ts`) is the whole authored surface. The fields that carry design, in the order the machine gate reads them:

- **Identity** — `id` (`strategic_` prefix), `displayName` (words, never numerals), `verb` (`gather_info | create | change | control | destroy`), `executionMode` (`instant | multi_tick_project | claim_control`), `behaviorFamily`, `reachProfile`.
- **Kind membership** — every `multi_tick_project` sits in exactly one kind row's C, U or D column (`src/data/undertaking-kinds.ts`); a row-less `instant` verb must carry a `mutationHint`.
- **Counter-play** — a `destroy` verb carries a `motiveGate` (⊆ `MOTIVE_GATE_KINDS`: `rivalry`, `grudge`, `contested_ambition`, `faction_war`), a `harmClass` (`named_death`, `property_destroyed`, `holding_seized`, `network_severed`, `undertaking_abandoned`), and a `targetRule` that can resolve an ownable or commanded thing. **Until a kind can be undone, it is not a kind** — `validateKindRegistry` refuses a row with an empty D column.
- **Cast** — a create/update project declares `cast` slots (`UndertakingCastSpec`): a `must-persist` slot carries `mintRole` and an `identityRequirement`; a reuse slot names `acceptedRoles` (an any-role slot cannot be scarce).
- **Creation** — a `create` verb declares `creationEffects` for at least one outcome band, or a `mutationHint` producing the kind's `objectShape`. A work whose only product is prose is not a work (Law 56's inverse: chips are engine-derived, so the leak is prose claiming state).
- **Bands** — `checkpointDifficulty` and `payoffValue` inside the tier's band (`UNDERTAKING_TIER_DIFFICULTY_BANDS`, `UNDERTAKING_TIER_PAYOFF_BANDS` in `src/data/content-eval/undertakingConstants.ts`, derived from the shipped corpus per tier); `projectDuration` set on every project.
- **Board authoring** — `motivations`: at least `UNDERTAKING_MOTIVATION_MIN_ARITY` (2) distinct `VALUE_PAIRS` members; `payoffValue` present. One currency ranks encounters and undertakings together (`UNIFIED_DECISION_BOARD_MODE = 'live'`, THR-1349); a template with no desire signal scores nothing, silently.
- **Reachability** — the id appears in at least one ambition's `strategicProfile.templateIds` (`src/data/ambition-templates.ts`). The third registration, and the silent one.
- **Register** — `activityProse` and `completionProse` at the encounter standard (Prose Doctrine v2, `Docs/canon/prose.md`): present tense, third person, the agent named, no evasive vagueness, no second person, no numerals, no exclamation marks. Abstraction and intensifiers rank; they do not gate.
- **Tokens** — a template's `activityProse[0]` renders verbatim; a **cell's** lines carry four slots — `{object}` `{owner}` `{actor}` `{place}` (sentence-initial capitals allowed) — filled from the world by `resolveUndertakingProse` (`src/engine/undertakingProse.ts`), which also returns the concepts it named for chips. `STRATEGIC_PROSE_TOKENS` names exactly those tokens; the contract's `tokens` block refuses any other.

### The verb × object model (THR-1392 — landing, behind a flag)

The successor to the kind rows, decided 2026-09-03 after a comparative design pass (`Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md`): an undertaking is a **verb** — **create · change (raise one's own | lower another's) · use · control (claim what nobody holds | seize what someone else does) · destroy · observe** (Christian, 2026-09-03: the four data verbs plus the two the game adds, ownership and yield; `lower`, `seize` and `destroy` are motive-gated) — on an **object the world already has**, named by the world-object catalogue (`Docs/canon/world-objects.md`, THR-1394): Area, Location, Place, Route, Faction, Company, Army, Network, Companion, Item, Power, Condition, Agreement, Standing. **The grid** — every kind × every verb, live cells from the registry, open cells as named decisions, the rest not an object with the reason — is generated: `Docs/canon/undertaking-grid.generated.md` and the served *Undertaking Grid* wiki page (`npm run generate-undertaking-grid`), curated in `scripts/undertaking-grid-dispositions.ts`, which the generator holds to totality so a new semantic or a new kind cannot arrive without its place on the map. Fourteen object types register once each in `src/data/undertaking-objects.ts`: a typed graph shape, the edges that say who holds one (`ownedVia`; an edge object such as a mark is held by its source), a `tierOf` read off the object (defaulting to T2 and tracing `undertaking_tier_defaulted`), the harm class, and what each verb variant does to that type — the graph ops the corpus already had, re-homed under the object. `src/engine/undertakingResolver.ts` is the one resolver: ownership read in one place, the control variant picked from it, the declared semantic dispatched, the object named on `strategic_world_change`; an undeclared cell traces `undertaking_cell_unreachable`, it is never faked. The pipeline carries an **object handle** (`{ kind: 'node' | 'edge' }`) beside `targetNodeId`, the motive gate reads owners through the handle, and the `object` target rule enumerates every object of a type under a cell's ownership rule. **Cells (slice 2):** `src/data/undertaking-cells.ts` synthesises one template per declared (variant, type) — `cell.<variant>.<type>`, `control` as `control_claim` and `control_seize` cells — and an ambition lists the cells it walks in `strategicProfile.cells`, read ahead of `templateIds` through `profileWorkIds` under the `cells` model; a cell with nothing to act on is refused `no_object_in_range:<type>` and traced `undertaking_cell_unreachable` once per world. Verb line-sets: `src/data/undertaking-verb-prose.ts`. **The line on cells (slice 3):** the contract holds a cell to the same ten blocks (membership = the type declares the semantic; reachability = a `cells` registration; no cast floor), `check:undertaking --all` checks packs and cells together, the live proof walks a cell under the `cells` model whatever the flag and reads `mutation_object` off the typed shape, a **cell package** (`{ slug, cell: { variant, objectTypeId }, override, profiles }`) compiles to `applyCellOverride` and registers in the ambition's `cells` (never a kind row; `CELL_OVERRIDE_MAX_PER_CELL` = 3), and the Package View shows *The object* instead of a kind row. **Flag:** `UNDERTAKING_MODEL` (`'templates'` today) — the kind rows, packs and switch below are the live model until the census passes on cells (slice 4), at which point this section replaces them and the retirement list of the 64 is reviewed in chat first. Intelligence is not an object type until it has a reader (THR-1393).

### The kind registry

`UNDERTAKING_KIND_ROWS`: eight rows across three tiers — `intelligence_cache`, `leverage_mark`, `masterwork_item`, `chart_find`, `network` (T1); `trade_route`, `place_location` (T2); `warband` (T3). Each row is a CRUD closure: what the kind builds, how it changes, and the motive-gated verb that undoes it, shipped in the same commit. `sublocation` (T2) and `faction` (T3) are **not** rows: their builds exist, their destroys do not, and a row registered against an ambient process would be presence of counter-play rather than counter-play.

### The packs

Seven authored packs under `src/data/strategic-packs/` (merchant, builder, scholar, zealot, court, warlord, wanderer) join `TEMPLATE_REGISTRY` in `src/engine/strategicActionCandidates.ts`. The factory's own output lands in `src/data/strategic-packs/factory/` (slice 3) and joins the same registry.

### The machine gate

`npm run check:undertaking -- <templateId> | --all [--json] [--list-failures]` (`scripts/check-undertaking.ts` over `src/data/content-eval/undertakingContract.ts`). Blocks in the order above; a warn channel that prints and never fails (the Law 56 write-set lexicon, past-tense markers). **No exemptions.** The only escape is `UNDERTAKING_RETROFIT_PENDING` (`src/data/content-eval/undertakingRetrofitPending.ts`): the templates that predate the contract, named once, shrinking only; `undertakingContract.test.ts` fails both a listed template that now passes and an unlisted one that fails. Green is a precondition for a PR existing; CI runs `--all`.

### The pipeline

`.claude/skills/undertaking-pipeline/` — the encounter factory's line, mirrored: a **batch brief keyed on the kind × CRUD grid** (`reference/batch-brief-format.md`; gap-weighted toward empty cells, the mechanical fix before any premise, Christian-approved in chat), draft, a critic loop bounded at two (`agents/draft-prompt.md`, `systems-prompt.md`, `editorial-prompt.md`, `package-prompt.md`, `implementation-prompt.md`), the gate, the live proof, the compiler, the batch report (slice 4). `reference/kind-row-catalog.generated.md` is the grid as data, regenerated by `npm run generate-kind-row-catalog`.

### The write set

`undertakingWriteSet(template)` (`undertakingContract.ts`) — everything a template declares it will change: the `mutationHint` type, the `creationEffects` bands with entries, the `harmClass`, the kind row (a christening; a freehold when `ownable`), the `must-persist` cast, the catalysts. **One predicate, two consumers:** the contract's creation block counts it and the live proof gates its claims on it, so a template that declares nothing is never failed for delivering nothing and one that declares a write cannot pass by delivering none. A third hand-rolled "does it write" test would drift from both — do not add one.

### The live proof

`npm run check:undertaking-live -- <id>... [--seed N]... [--band <band>|none] [--map] [--json]` (`scripts/undertaking-live-proof.ts`; the `encounter-live-proof.ts` sibling). A real seeded world, the review lever starting the template on the first autonomous individual by id, the real `runTick` to a terminal status, every claim read off the harvested trace buffer and the graph — never off the template. Baseline claims `started` · `no_tick_crash` · `terminal` · `moment_started`; delivery claims `checkpoint_rolled` · `cast_bound` · `creation_effect` · `mutation_object` (read by hint type: the `trades_with` edge, the sublocation, the founded place, the company the actor is a member of, `strategicIntelligence`, the possessed artifact, the `knows_secret_of` mark) · `christened` · `harm_recorded`, each gated on the write set. Verdict `proved` / `failed` / **`vacuous`** — nothing failed and nothing was delivered; not green. **The default run pins `success`** (`DEFAULT_PINNED_BAND`): the proof asks whether the declared write set *can* land; how often the dice land there is the census's question. `--band none` runs unpinned. Evidence on `main`: `strategic_cultivate_informant`, `strategic_establish_trade_route`, `strategic_recruit_warband` proved on seeds 42 and 99 (slice 3 closeout).

### The compiler

`npm run compile:undertaking -- <package.json> [--dry-run] [--force]` (`scripts/compile-undertaking.ts` over `src/data/content-eval/undertakingPackage.ts`; `reference/undertaking-package-format.md`). The package is the real `StrategicActionTemplate` plus `slug`, `kind { kindId, role, row? }`, `profiles`, `docComment` — unknown top-level keys refused by name, and the emitted literal is annotated with the real type so `check:typecheck` is the deep validator. It writes `src/data/strategic-packs/factory/<slug>.ts` (prose byte-identical) and `factory/__tests__/<slug>.test.ts`, and registers the export in `FACTORY_STRATEGIC_TEMPLATES` (joined last into `TEMPLATE_REGISTRY`, so factory output never shadows an authored id), the id in the kind row's C/U/D column, and the id in each named ambition's `strategicProfile.templateIds` — all idempotent. **A row-less kind is opened only by its first destroy**, carrying `kind.row`; any other role is refused. The compiled file is the canonical, hand-editable artifact from then on; re-compiling over it needs `--force`. Compile does not run the gates — typecheck, contract, live proof and the emitted test follow it, in that order.

### The batch report

`npm run undertaking:batch-report -- <ids…> [--seed N]… [--brief <path>] [--out <path>]` (`scripts/undertaking-batch-report.ts`; the `encounter-batch-report.ts` sibling). A renderer, not a third gate: it shells `check:undertaking --json` and `check:undertaking-live --json` and renders their verdicts, so it cannot disagree with CI. Leads with the batch table (kind · cell · tier · verb · reach · family · harm · gate · live · two links — the live run on The First and the Package View), then the **kind × CRUD grid** with this batch's additions marked (the variance this line reviews for; a C-only batch is flagged as REVISE trigger 1 in the report itself), the tier / verb / reach / motivation spread, per-template detail with the write set, the prose and every live claim, and the census pointers. Writes `Docs/plans/undertakings/<date>-batch-report.md` by default.

### The Package View

`?view=cms#undertaking-packages?template=<id>` (`src/components/CMS/undertaking-package/`; `?batch=<id>,<id>` compares up to six). One page per template, every block resolved from the registry and the contract, never the graph: identity and the calling its family maps to (`CALLING_BY_FAMILY`); the kind row and the cell this template fills with the row's other cells as links (an empty D cell reads *nothing undoes it*); the board **as words** — `difficultyWord`, payoff relative to the tier band, duration banded (`DURATION_WORD_BANDS`), never the numeral; cast slots; the write set (Law 56's chip-backing list, and *nothing* when it is empty); counter-play (motive gate, harm banded by `HARM_WORD_BANDS`); the prose in the moment card's register; the contract verdict with its warn channel and the ratchet mark. The moment card is unchanged.

### The review levers

`src/engine/undertakingReviewLevers.ts` (the `debugOutcomePin.ts` sibling; works on the deployed build). `?undertaking=<templateId>` — the `?spawn` analog: starts the named template on The First through the board's own candidate helpers and start path, bypassing only `ambition_profile`, `active_cap` and `motive_gate` (`REVIEW_LEVER_BYPASSABLE_GATES`, a closed list), each named on the `strategic_action_started` trace as `bypassedGates` with `startedBy: 'review_lever'`; a destroy prefers an owned target and reports an unowned one; a below-spotlight actor is reported, not hidden. `?outcome=<band>` — the pin, reused: it targets the undertaking's checkpoints when `?undertaking=` is present, `?spawn` wins when both are, and the verdict is `band_landed` / `no_effect_on_band` / `not_reached` (`getUndertakingPinVerdict`). `?forcemoments` — every spotlight mortal is followed and the `started` moment interrupts for the flag's lifetime; unfollowed mortals stay invisible. Headless twins: `window.__DEBUG.startUndertaking` / `pinUndertakingBand` / `getUndertakingPinVerdict` / `forceMoments`; CLI `spawn undertaking <agent|@first> <templateId> [--target] [--band]`, `undertakings`, `follow`, and the `@first` alias (which falls back to the first spotlight mortal in the thread-less CLI world and says so).

### The census

`npm run census:undertakings` (`scripts/undertaking-census.ts`) — undertaking / encounter / idle shares, starts per mortal, variety at a fixed start sample (cross-seed mean), the per-mortal cap, the vendetta share. Review-lever starts (`startedBy: 'review_lever'`) are excluded from its counts.

### The words

UL (`Docs/ubiquitous-language/Agents.md`, `Encounters.md`): **undertaking**, **kind row**, **work**, **christening**, **failure-name register**, **freehold**, **calling**, **moment**, **follow**. Proposed by this line: **Undertaking Contract**, **batch brief** (undertaking sense).

## Active design plans

- `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md` — the verb × object model (THR-1392), four slices; slices 1–3 shipped behind the flag (slice 3 closed THR-1300; the pilot batch is superseded).
- `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` — this line (doc 6/6).
- `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` (doc 1), `…-thr-1297-action-library.md` (doc 2, the kind-row schema), `…-thr-1296-…` (doc 3), `…-thr-1298-reactive-loop.md` (doc 4), `…-thr-1299-calling-and-surfaces.md` (doc 5) — the map's carve-up; `Docs/plans/INDEX.md` carries the exact filenames.
- `Docs/plans/2026-09-02-thr-1349-decision-board-cutover.md` — the one board and the census gates.

## Rejected approaches

- **Hand-registration in three files** (pack, kind row, ambition profile) as the way a template becomes real — the compiler registers rows and profiles idempotently (slice 3); a template registered by hand in two of three is reachable by luck.
- **Register-free strategic prose** — the shipped corpus predates the doctrine (28 of 64 fail the register block on introduction); the contract holds new work to the encounter standard.
- **Initiatives as a second pipeline** (THR-1292 §3) — retired; one board, one line.
- **Control upkeep as an undertaking family** (THR-1303) — being deleted.
- **Behaviour families as a player-facing word** (THR-1281 §7b) — the calling is the word; families are authoring metadata.
- **A warband that completes while minting nobody** (THR-1309) — a create verb's product must exist.
- **Exemptions on the gate** — a named, shrinking ratchet instead (ruling 3).

## Open questions

- The `sublocation` and `faction` destroy verbs — the two empty D columns the pilot batch is gap-weighted toward.
- The ambient-tier aperture (THR-1348): who below the spotlight can hold a work.
- The harm supply under the live board (THR-1388): no destroy verb starts on the default seeds in 300 ticks; the factory adds supply and reports, it does not retune.
