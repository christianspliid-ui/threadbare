---
domain: undertakings
last_reviewed: 2026-09-02
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
- **Tokens** — the strategic prose path renders `activityProse[0]` and `completionProse[0]` verbatim; no `{token}` resolves there today (`STRATEGIC_PROSE_TOKENS` is empty and is where a substitution chain is declared when one is added).

### The kind registry

`UNDERTAKING_KIND_ROWS`: eight rows across three tiers — `intelligence_cache`, `leverage_mark`, `masterwork_item`, `chart_find`, `network` (T1); `trade_route`, `place_location` (T2); `warband` (T3). Each row is a CRUD closure: what the kind builds, how it changes, and the motive-gated verb that undoes it, shipped in the same commit. `sublocation` (T2) and `faction` (T3) are **not** rows: their builds exist, their destroys do not, and a row registered against an ambient process would be presence of counter-play rather than counter-play.

### The packs

Seven authored packs under `src/data/strategic-packs/` (merchant, builder, scholar, zealot, court, warlord, wanderer) join `TEMPLATE_REGISTRY` in `src/engine/strategicActionCandidates.ts`. The factory's own output lands in `src/data/strategic-packs/factory/` (slice 3) and joins the same registry.

### The machine gate

`npm run check:undertaking -- <templateId> | --all [--json] [--list-failures]` (`scripts/check-undertaking.ts` over `src/data/content-eval/undertakingContract.ts`). Blocks in the order above; a warn channel that prints and never fails (the Law 56 write-set lexicon, past-tense markers). **No exemptions.** The only escape is `UNDERTAKING_RETROFIT_PENDING` (`src/data/content-eval/undertakingRetrofitPending.ts`): the templates that predate the contract, named once, shrinking only; `undertakingContract.test.ts` fails both a listed template that now passes and an unlisted one that fails. Green is a precondition for a PR existing; CI runs `--all`.

### The pipeline

`.claude/skills/undertaking-pipeline/` — the encounter factory's line, mirrored: a **batch brief keyed on the kind × CRUD grid** (`reference/batch-brief-format.md`; gap-weighted toward empty cells, the mechanical fix before any premise, Christian-approved in chat), draft, a critic loop bounded at two, the gate, live proof (`check:undertaking-live`, slice 3), the compiler (`compile:undertaking`, slice 3), the batch report (slice 4). `reference/kind-row-catalog.generated.md` is the grid as data, regenerated by `npm run generate-kind-row-catalog`.

### The review levers (slice 2)

`?undertaking=<templateId>` (the `?spawn` analog — starts the named template on The First through the board's own start path, bypassing only `ambition_profile`, `active_cap` and `motive_gate`, each traced), `?outcome=<band>` (the pin, reused; `?spawn` wins when both are present), `?forcemoments` (every spotlight mortal's undertaking interrupts). Headless twins on `window.__DEBUG` and the CLI (`spawn undertaking`, `@first`).

### The census

`npm run census:undertakings` (`scripts/undertaking-census.ts`) — undertaking / encounter / idle shares, starts per mortal, variety at a fixed start sample (cross-seed mean), the per-mortal cap, the vendetta share. Review-lever starts are excluded from its counts (slice 2).

### The words

UL (`Docs/ubiquitous-language/Agents.md`, `Encounters.md`): **undertaking**, **kind row**, **work**, **christening**, **failure-name register**, **freehold**, **calling**, **moment**, **follow**. Proposed by this line: **Undertaking Contract**, **batch brief** (undertaking sense).

## Active design plans

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
