> **title:** Seed-only encounters — a sequel that assumes its parent never reaches the board — THR-1526
> **linear_issue:** THR-1526
> **author:** Claude Code
> **created:** 2026-09-24
> **three_pillars:** Engine `done` · Content `done — four sequels flagged, the Swindled Family's envelope widened with its authored rural opening, two authoring surfaces amended, the corpus audit recorded` · UI `N/A — no component changes; the fix removes untrue scenes from play, and review reaches them through ?spawn= as before`

# Seed-only encounters — THR-1526

*A sequel whose opening assumes its parent must start only when that parent plants it; today the board offers it to anyone.*

## Why this is load-bearing

The appointment primitive (THR-1479) made a promise true by construction: a mortal who gave their word at the crossroads is met there at the full moon, and one who broke it is found by the stranger. THR-1524's firing census then found both sequels **firing from the board** with no parent behind them. On seed 42, over 200 ticks, the Reckoning fired once and the Swindler Found 16 times, while their parents fired zero times. Fired from the board, the Reckoning tells a mortal who never gave their word that they broke it. Its BOND chip also reports a broken favour the engine never wrote (UI Law 56). That is the THR-1476 class of untrue prose, produced by reachability rather than by authoring.

Every seeded sequel the corpus writes from now on has the same exposure, and the appointment primitive is how the corpus promises things now. A place-and-time promise needs a sequel that only its seed can start. This plan adds the one declared flag that says so, applies it to the four shipped sequels that are untrue off the board, keeps their chain reachable, and gates the class so it cannot recur.

## Substrate inventory

Rows are named by their `Docs/canon/systems-inventory.md` entry.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `encounter`: the encounter cache (`encounterCache.ts`, `buildEntriesForLocationAndSublocations` `:294-345`) | 🟢 ACTIVE | **extends**: one shared predicate skips a template marked `drawable: false` at all four appends |
| `encounter`: encounter seeding (`encounterSeeding.ts`: `templateId` lookup `:670`, `resolveSeedByQuery` `:271-313`, `eligibleAt` `:320-337`, the appointment arm `:574-659`, the spawn `:738-752`) | 🟢 ACTIVE | **unchanged**. Seeds never read the cache (the file imports nothing from it, `:28-66`). A `templateId` resolves through the template index, a `query` through the content catalogs plus `eligibleAt`, and both keep working for a template the cache skips |
| Content model (`CONTENT_OBJECT_KINDS` `encounter_template`, `content-objects.ts:172`; `entriesOfKind`, `contentCatalogs.ts:121-132`) | 🟢 ACTIVE | **unchanged**. The four sequels stay in `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, so they stay in the query catalog the Reckoning's missed-branch query reads |
| `delivery`: Director delivery beats (`ALL_DELIVERY_BEATS`, `deliveryBeatAdapter.ts:93-95`) | 🟢 ACTIVE | **extends**: `isDeliverableBranchingEncounter` also refuses a non-drawable template. Otherwise a sequel runs as a "divine vision" beat with its fallback reactions, which is the same untrue scene by a third route |
| Encounter package compiler (`encounterPackage.ts`; `EncounterPackageTemplate = Omit<UnifiedActionTemplate, 'consequenceDraw'>`, `:115`) | 🟢 ACTIVE | **reuses**. The package template is typed from `UnifiedActionTemplate` with no runtime key list (`:80-86`), so `drawable` passes through with no compiler edit. A pass-through test pins it |
| Setting envelopes (THR-884, `settingClasses.ts`) | 🟢 ACTIVE | **reuses**. The Swindled Family's `settings` widen from `['wayside']` to `['wayside', 'rural']`, with its rural opening authored below, as THR-1524 did for the Crossroads |

## Engine pillar

### Systems design

**1. The flag.** `UnifiedActionTemplate` gains `readonly drawable?: boolean`, placed in the "Filtering" block beside `drawableWhileBroken` (`src/types/unifiedAction.ts:2408`), whose vocabulary it shares.
- Absent or `true`: today's behaviour, unchanged.
- `false`: **the decision board** never offers the template. It starts only when something **names** it: a seed (by `templateId` or `query`), an appointment's kept or missed branch, a trigger, or a debug spawn (`?spawn=`, `spawn encounter`).
- The field is optional and defaults to drawable (NFP #6): no shipped template changes behaviour unless it is flagged.

**Why a field, not the alternatives** (the research compared all of them; the brainstorm has the table):
- **An empty `locationSubtypes`.** It fails the slice's envelope-honesty test (`vertical-slice.test.ts:106-114`) and `check:encounter`'s setting block. It also means "anywhere" to `eligibleAt`, the opposite of what the Reckoning needs: it must be judged at the mortal's feet in every class.
- **A content tag.** Tags are query vocabulary: the resolver matches tags. The UL says a tag's axis is *"presentation and completeness, never query semantics"* (`Docs/ubiquitous-language/Encounters.md:337`; `src/data/content-tags.ts:35`), so a draw rule has no home there.
- **Leaving the sequel out of `LOCATION_BRANCHING`** (the Apotheosis precedent). It is invisible on the template, which is exactly how this leak happened. It also removes the template from the query catalog the missed branch reads.

**2. Where it is read.**
- **`isDrawable(template)`**, one exported predicate in `src/engine/encounterCache.ts`: `template.drawable !== false`.
  - `buildEntriesForLocationAndSublocations` applies it at all four appends: the raw sublocation and location lookups, `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, `CACHE_REGISTERED_REGIONAL_TEMPLATES`, and the sacred-route destinations.
  - It runs at cache build only, never per agent per tick.
  - It also removes the entry from every other reader of the cache: the reroute scan (`phaseAgentDecision.ts:546-566`), idle local entries (`:1808`), forced travel (`:1924`), born-later spawn richness (`agentLifecycle.ts:420`) and the DebugPanel cache list.
- **`isDeliverableBranchingEncounter`** (`deliveryBeatAdapter.ts`) returns false for a non-drawable template.
- **`encounterCache.test.ts:21-44`** copies the three sources by hand, so it applies the same predicate.

**3. The draws the flag does not govern, and why that is safe.**
- **Seed resolution** is unchanged, and must be: a named sequel has to resolve.
- **A seed `query` is itself a small draw.** `eligibleAt` returns every hit of `resolveContentQuery`, and `resolveSeedByQuery` picks one (`encounterSeeding.ts:296-298`), matching on authored plus projected tags (`content-objects.md:100`). A future query broad enough to name a projected tag (say `anyTags: ['#heart']`) could therefore resolve the Reckoning anywhere. Every `encounter_template` query in the corpus today is a family word (`#court_errand`, `#crossroads_debt`, …), so nothing leaks now. The **foreign-query pin** (§ Content gates) fails CI the moment one does.
- **The social, faction-quest and lifecycle generators** are candidate sources that do not read the cache. No non-drawable template sits in them. A corpus test pins that, rather than adding a per-agent runtime check nothing needs yet.
- **One deprecated path holds the sequels too.** The array-scored `generateUnifiedCandidates` (`src/engine/unifiedCandidates.ts:50`) sees all four sequels through the `VERTICAL_SLICE_TEMPLATES` spread (`unified-action-templates.ts:5617`). Its sole caller, `phaseIdleSelection` (`unifiedActionPhases.ts:75`), is deprecated and not invoked since `f416745f`. Add `isDrawable` beside its scale gate anyway, one line, so the intent survives if it is ever revived.

### Graph nodes / edges

None. The flag is template data, not world state.

### Tick phases

No new phase. The cache build (`buildFullCache`, the incremental `onLocationCreated` / `onLocationTypeChanged` / `onSublocationCreated` handlers) applies the predicate wherever it already builds entries.

### Resolution logic

Unchanged. A named sequel resolves exactly as today; the flag only removes the unnamed route.

### PRNG callouts

None added. The cache build draws no random numbers.

## Content pillar

### Encounter templates

**The four sequels become `drawable: false`.** Each opening assumes its parent (the research quoted each first line):

| Template | Parent that plants it | Why it is untrue off the board |
|---|---|---|
| `encounter.slice.full_moon_collection` (`vertical-slice.ts:2417-2434`) | A Bargain at the Crossroads, accept (the kept branch) | "{name} comes back to the crossroads…" — and it hands out the Crossroads Gift for a promise never made |
| `encounter.slice.full_moon_reckoning` (`:5166-5193`) | the same appointment's **missed** branch (query `#crossroads_debt`) | the stranger collects on a word never given; its BOND chip reports a broken favour the engine never wrote |
| `encounter.slice.swindler_found` (`:3432-3453`) | the Swindled Family (help path, critical-failure band), and itself | "the man who sold the fen-road family their worthless deed" |
| `encounter.slice.grateful_kin` (`:3906-3933`) | the Swindled Family (help path), and the Wandering Healer | "kin to the family from the fen road" — and every band plants the Table That Holds |

**Keep the chain reachable: the Swindled Family's envelope widens.** The Swindler Found and the Grateful Kin get their only honest supply from the Swindled Family, which is `wayside`-only (8 of 974 Locations on seed 42, zero firings in 200 ticks).
- Flagging the sequels would make them fire zero times too. So the Family's `settings` widen to `['wayside', 'rural']`, as THR-1524 widened the Crossroads, with **this rural opening**, authored here (GAME register, narrator mode, one line, the same placeholders as the wayside line at `vertical-slice.ts:2909`):
  > `rural: '{name} catches up with a handcart on the lane out of {location}.'`
- The spine (`vertical-slice.ts:2826-2829`, *"A family with a handcart is walking east… East of here is only a salt fen"*) reads true on a farm lane: the mortal catches them up, walking the same way.
- The template carries no `supportBundle` (`:2892-2918`), so the widening needs no cast change.
- **Widen both fields together.** The Family writes `locationSubtypes: expandSettings(['wayside'])` (`vertical-slice.ts:2910`), and the slice's envelope-honesty test (`src/data/encounters/__tests__/vertical-slice.test.ts:105-114`) asserts that `locationSubtypes` equals `expandSettings(settings)`. So `settings` and `locationSubtypes` both become `['wayside', 'rural']`.
- The openings table is compiled into the opening fragment set by `src/data/settingClasses.ts:141-170`.

**Why rural and not urban:** the scene is a family on the road with everything they own. A market square is a different scene; a farm lane is the same one.

### The corpus audit (the ticket's "audit the rest")

The corpus holds 138 literal-`templateId` seed sites and 86 legacy-family sites, counted over `src/data` excluding tests and fixtures. It also holds four seed `query` sites (`src/data/encounters/shadow-court-audience.ts:235`; `src/data/underking-court-encounter-content.ts:619`, `:923`, `:1032`, all family words) and the one appointment `missed.query` (`vertical-slice.ts:2045`). Grouped by what they target:

| Target group | Sites | Reachable from the board? | Opening presumes the parent? | Verdict |
|---|---|---|---|---|
| **The four slice sequels** (above) | 7 | yes (cache) | yes | **flag `drawable: false`** |
| Slice parents re-seeded (`crossroads` ×2, `family` ×3) and `table_that_holds` (reputation-gated organic draw) | 6 | yes | no; they are parents or gated by design | board-true |
| Faction quest follow-ups (`ac.` `bf.` `cg.` `hod.` `lk.` `mc.` `mct.` `rb.` `ts.` `tg.` `uk.`) | ~70 | faction quest generator (rank-gated) | no; each opening stands alone | board-true |
| Social and tavern follow-ups (`social.*`, `tavern.*`) | 22 | social generator | no | board-true |
| `encounter.rest_and_reflect` (self-seed), `encounter.border.one_body_short` | 3 | cache | no | board-true |
| Army thresholds and aftermath (`army.*`) | 4 | none (`locationSubtypes: []`) | yes | already seed-only |
| Company drama (4 group-only templates) | 13 | none (kept out of `LOCATION_BRANCHING`) | — | already off the board |
| Monster, borderland, anomaly, route (`monster.*`, `borderland.wolves_at_dusk`, `encounter.anomaly.singing_dark`, `encounter_route_ambush`) | 8 | none (not cache-fed arrays) | — | off the board |
| Mentorship (`mentorship.the-falling-out` ×2) | 2 | none | — | already seed-only |
| The Wandering Healer → `grateful_kin` | 1 | (the Kin is flagged) | tells the wrong story | **THR-1565** |
| `example.thread_bond_tested` | 1 | example content | — | n/a |

**Rule the audit yields:** a follow-up that stands on its own may stay drawable; a sequel whose opening names its parent's people, place or promise is `drawable: false`. An appointment branch always names its promise, so every appointment branch target, kept or missed, is non-drawable. That last clause is gated (below).

### Content gates (the authoring rule and its checks)

- **The Seeded Sequel rule** (`nudge-authoring-spec.md`, the Seeded Sequel row, `:501`): a sequel whose opening assumes its parent declares `drawable: false`. `encounter-package-format.md` documents the field on the package template.
- **The fatal corpus tests** (`src/engine/__tests__/encounterSeedLiveness.test.ts`, with the predicates in `src/testing/contentInvariants.ts`):
  1. **Every appointment branch target is non-drawable.** Both the kept and the missed branch (by `templateId`, or by the hits of its `query`), over every `appointment` block and every `UNDERTAKING_CELL_APPOINTMENTS` meeting/missed pair (`src/data/undertaking-cells.ts:231`).
  2. **The foreign-query pin.** For every `encounter_template` query site in the corpus (seed `query`, `appointment.missed.query`, strategic-pack `catalystQuery`, the undertaking-cell meeting/missed queries), the resolved hits contain no `drawable: false` template unless that site is its declared planter.
  3. **No non-drawable template in any cache build of a seeded world**, in `ALL_DELIVERY_BEATS`, or in the social, faction-quest or lifecycle generators' source lists.
  4. **The four sequels** are `drawable: false` (a named regression pin).
- **`check:encounter` gains two warnings.** It sweeps `ENCOUNTER_ID_PREFIXES = ['encounter.']` (`scripts/check-encounter.ts:370`), already walks seed references per template (`validateEncounterSeedRefs`, `:294`, `:321`), and has a warn channel (`:51-58`).
  1. **A non-drawable template that no planter names.** The planter walk covers template effects (the `validateEncounterSeedRefs` pattern, `nudgeGrantLiveness.ts:526-589`) **plus** undertaking-cell appointments and strategic-pack `catalystQuery`. Engine-side planters (trap, apotheosis, army, route, economic) are listed in an allowlist.
  2. **An undeclared seed target.** A template under `encounter.*` warns until it declares `drawable` explicitly (`true` or `false`) when all three hold:
     - it is a literal `templateId` seed target (the inverse of the seed-reference walk);
     - it sits in a cache-fed array;
     - its envelope is non-empty.

     About ten `encounter.*` templates qualify today. The implementation PR declares each: `false` for the four sequels, `true` for the board-true rest per the audit table. This is the guard for the plan's standing exposure: a future plainly seeded sequel whose author forgets the flag.
- **The corpus vitest above is the real gate.** `check:encounter` sees `encounter.*` only; the warnings are the author's early signal.
- **The ticket's third bullet, narrowed to what a check can read.**
  - **What it asked:** *"a `check:encounter` warning for a seed target reachable from the board with no board-facing opening"*.
  - **Why not as written:** whether an opening "faces the board" is prose semantics, and no check can read it.
  - **What replaces it:** the second warning above asks the author to decide for every `encounter.*` seed target, and the fatal tests cover the two cases that can never be board-true (appointment branches, and a broad query drawing a sequel).
  - **What stays uncovered:** seed targets outside `encounter.*` (the faction, social and tavern follow-ups). Their openings stand alone by design (the audit table), and the Seeded Sequel authoring rule governs them.
  - This substitution is recorded as a comment on THR-1526 at handoff.

### Prose tables

One new line, authored above: the Swindled Family's rural opening. No other prose changes. The sequels' prose becomes true because only their parents can start them.

### Attachment content

N/A. No attachment, item or trait is added or changed.

### Data tables

N/A. No world-model or constants change; the flag is a boolean on four templates.

## UI pillar

UI: N/A. No component changes.
- **What the player sees change:** the untrue scenes stop appearing, and the Crossroads and Family chains fire their sequels only from their parents.
- **Review route unchanged:** a non-drawable template still opens from `?spawn=<templateId>` and `spawn encounter`, because a direct spawn names it.
- **DebugPanel:** the cache list stops showing the four sequels. That is the fix made visible.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: every module below names its orchestrator phase, UI surface, GameState field, trace and debug visibility.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `isDrawable` in `encounterCache.ts` | cache build (worldgen, and the incremental location handlers) | — | — (template data) | none new | the DebugPanel cache list; `?spawn=` still opens a flagged template |
| `isDeliverableBranchingEncounter` | module load (`ALL_DELIVERY_BEATS`) | Director beat surfaces | — | none new | `debug-bridge` delivery-beat listing (`:784-802`) |
| `scripts/firing-census.ts` (new) | offline (CLI harness) | — | reads each tick's new unified actions | — | the census report |

**Prose pipeline:** the one authored opening binds through the existing setting-envelope path (the openings compile, `src/data/settingClasses.ts:141-170`). **Player controls:** none.

## Constants table

N/A — no tunable numbers. The flag is a declared property of a template, not a threshold (NFP #1).

## Tracing

N/A — no new trace type. The flag is authored data, visible on the template, and the effect is a cache membership the DebugPanel already lists. NFP #2 is met by:
- the field itself;
- the corpus tests naming every non-drawable template;
- the firing census, which attributes every firing to a seed or to the board.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A non-drawable template is named by a seed that resolves nowhere (no `eligibleAt` match) | Unchanged: the existing seed-withering path (`encounterSeeding.ts`) |
| `drawable: false` is set on a template that nothing plants | Unreachable content. The `check:encounter` warning names it |
| A future query broad enough to hit a sequel | The foreign-query pin fails CI before it ships |
| A future candidate generator lists a non-drawable template | The corpus test fails CI before it ships |
| A future plainly seeded sequel whose author forgets `drawable: false` (the Swindler Found and Grateful Kin shape) | Under `encounter.*`: the undeclared-seed-target warning names it until the author declares one way or the other. Outside `encounter.*`: the Seeded Sequel authoring rule |

## Interface impact

| Contract | Change |
|---|---|
| **add** `seed-only-sequels-never-drawn` | Writer: the template flag. Readers: the cache build and the delivery-beat filter. Asserting tests: the corpus tests above |
| `missed-appointment-breaks-agreement` (THR-1479) | **preserve**. The missed branch still resolves by query and still breaks the favour. Now it is also the only way the Reckoning fires |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/unifiedAction.ts` | 507 importers (`.codesight/graph.md:7`, 2026-09-24) | one optional field on `UnifiedActionTemplate`; no member changes shape; `npm run check:typecheck` (the ratchet) must show zero net-new errors |

## Kill criteria

- **A flagged sequel fires from the board after the change** (the firing census attributes a firing with no `spawnedFromSeedId`): the predicate missed a cache append or a generator. A bug in the slice. Fix before closing.
- **The Swindled Family still fires zero times on both seeds:** its sequels are reachable only through the Healer's seed, which THR-1565 will repoint. File a Deferral in this project to widen the Family further. Do **not** unflag the sequels.
- **A content author flags a template nothing plants:** the `check:encounter` warning names it at authoring time.
- **The foreign-query pin fires:** a query has grown broad enough to draw a sequel. Narrow the query to a family word, or declare the site the sequel's planter. Never unflag.

## Three-pillar check

- [x] Engine pillar present: the flag, the predicate and its two readers, and the draws it does not govern, named.
- [x] Content pillar present: four sequels flagged, the Family's envelope widened with its authored opening, the corpus audit, the authoring rule and the gates.
- [x] UI pillar: N/A with rationale (no component change; review via `?spawn=` unchanged).
- [x] Wiring section connects them.

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `00-north-star.md:31`, *"The pleasure is witnessing, not steering"*, and `:43`, *"a story the player can tell in prose"*. A story is only tellable if its causes happened, and the fix removes scenes that report a past that did not happen.
  - `02-non-negotiables.md:23-27`, narrative over mechanical perfection: a sequel is a consequence, and a consequence with no cause is noise.
- [x] **Design tension #2** (systemic emergence vs authored moments) is served in the authored direction. The Family widening trades a little authorial control (where the scene can happen) for the chain being reachable at all, the same trade THR-1524 made.

## Rulebook impact

- [x] **A rule of play is clarified, not changed.** Rulebook § Encounters, Appointments: "missed, a reckoning finds them wherever they are" becomes true in the only direction: nobody else meets the reckoning. One sentence is added, tagged `[IMPL]` with the slice: *"A sequel that assumes its parent is never offered on its own; only its parent's promise starts it."*
- [x] `Docs/canon/rulebook.md` is updated in the implementation PR.

> Brainstorm companion: `Docs/plans/2026-09-24-thr-1526-seed-only-encounters-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | N/A | A boolean on authored data, no thresholds |
| 2. Inspectability | PASS | The flag is on the template; the corpus tests name every flagged template; the firing census attributes every firing |
| 3. Determinism | PASS | No random code; cache membership is a pure function of template data |
| 4. Fail-soft | PASS | See the fail-soft table: a flagged template with no planter is a warning, and seeds wither as today |
| 5. Narrative over mechanical perfection | PASS | The whole point: a scene that reports a promise now only fires when the promise was made |
| 6. Additive over destructive | PASS | Optional field, drawable by default. The Family's envelope widens rather than narrows |
| 7. Performance budget | PASS | The predicate runs at cache build only (O(templates) per location, as today), never per tick |

## Done when

- [ ] **Tests:**
  - A seeded world's cache holds none of the four sequels at any location.
  - The Crossroads' missed branch still fires the Reckoning at the mortal's feet, end to end (plant → window close → rewrite → fire), and the favour is marked broken.
  - The kept branch still fires the Full Moon Collection at the crossroads.
  - `swindler_found` and `grateful_kin` still fire from **every planter that names them at merge time** (THR-1565 may repoint the Healer's seed first).
  - None of the four is in `ALL_DELIVERY_BEATS`.
  - The four fatal corpus tests (§ Content gates).
  - A compiled encounter package carries `drawable: false` through to its template (`src/data/content-eval/__tests__/encounterPackage.test.ts`).
  - `check:encounter` warns on a fixture template with `drawable: false` and no planter, and is silent on the four real sequels.
  - `check:encounter` warns on a fixture `encounter.*` seed target in a cache-fed array with no `drawable` declared, and is silent once it declares either value. Every real `encounter.*` seed target declares one in this PR.
- [ ] **Firing census** (`scripts/firing-census.ts`, new):
  - **How it counts:** seeds 42 and 99, medium, 200 ticks. Harvest each tick's newly created unified actions (the resolved list is pruned after 20 ticks, so read per tick rather than at the end, and never from the trace ring). Attribute each firing to a seed (`spawnedFromSeedId` set, `unifiedAction.ts:3039`, written at `encounterSeeding.ts:761`) or to the board, and record the spawn route where it can be told (the decision pick, a delivery beat, a generator). Then kill criterion 1 names the route that leaked, not just "the board".
  - **Pass condition:** the four sequels show zero board firings, and the Swindled Family fires at least once on at least one seed (else the kill criterion's Deferral).
- [ ] **Wiki pages** the blocking `check:wiki-freshness:blocking` gate owes, because their `sources` in `public/wiki-manifest.json` match files this slice edits:
  - `encounters-manual-reference` (`src/engine/encounter*.ts`, `src/types/unifiedAction.ts`): the `drawable` field and the never-drawn rule;
  - `divine-actions-reference` (`src/types/unifiedAction.ts`): an update, or a `Wiki-freshness-exempt: <reason>` line in a commit body if nothing it documents changes.
  - `system-interface-map` (`Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`): regenerated by `npm run generate-interface-map` (part of `prebuild`); commit the regenerated `public/system-interface-map-reference.html`.
- [ ] **Canon, UL and guide updates:**
  - UL **Drawable** is seated in `Docs/ubiquitous-language/Encounters.md`, with its README index line. The entry names *the decision board* as the drawer, and says it is unrelated to *Draw Together* (`Agents.md:428`) and to the reward and consequence draws.
  - `Docs/canon/encounters.md` gains a paragraph beside the appointment section.
  - `Docs/canon/content-objects.md` records the field, following the `tags` precedent at `:128`.
  - The systemic wiring guide gets a line under Capability 31 (Appointments): the two-sequel rule now includes the flag.
  - The rulebook sentence above.
  - The interface-map row.
- [ ] **Every gate:** `npm test`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke. `Browser-verify exempt: no src/components change`.
- [ ] The close keyword for this issue, alone on its own line, in the closing commit body and the PR body.

## Coordination block

**Suggested model:** opus. A small engine change with a content half; the gates and the census attribution need care.

**Parallel-safe with:**
- THR-1523, THR-1528, THR-1562, THR-1563, THR-1564 and THR-1566: disjoint files.
- THR-1525 (the desire score) has merged, so its mutex line against this ticket is moot.

**Mutex with:**
- **the Physical Conflict slices that edit `src/types/unifiedAction.ts`:** FB7 (THR-1543), M2 (THR-1545), E1 (THR-1556) and H2 (THR-1560).
  - FB7, E1 and H2 add optional fields to other declarations (`ActionStep`, `UnifiedAction`, `PlantedAppointment`).
  - **M2 adds `requiresLiveMonster?` to `UnifiedActionTemplate` itself** (`2026-09-23-monsters-as-opponents.md:301`), the declaration this plan edits.
  - Every conflict is two additive optional fields: keep both sides. It is not union-merged, so rebase on whichever lands first. With WIP = 1 they land in sequence anyway.
- **the same slices, on shared docs:** `Docs/canon/rulebook.md`, `Docs/canon/content-objects.md` (each field addition lands its row there under the one-PR rule), `Docs/ubiquitous-language/Encounters.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md` and `scripts/interface-contracts.ts`. Different sections; rebase and keep both.
- **THR-1565** (three seed stories) and **THR-1567** (the wayside siblings): both edit `src/data/encounters/vertical-slice.ts`. Run them in sequence.
- any slice editing `src/engine/encounterCache.ts`, `src/engine/deliveryBeatAdapter.ts` or `scripts/check-encounter.ts`.

**Files to touch:**
- Edit:
  - `src/types/unifiedAction.ts` (the `drawable` field and its doc comment)
  - `src/engine/encounterCache.ts` (`isDrawable`, applied at the four appends)
  - `src/engine/deliveryBeatAdapter.ts` (`isDeliverableBranchingEncounter`)
  - `src/data/encounters/vertical-slice.ts` (four flags; the Family's `settings` and the rural opening above)
  - `scripts/check-encounter.ts` (the no-planter warning)
  - `src/testing/contentInvariants.ts` (the predicates)
- New: `scripts/firing-census.ts` (plus its `package.json` script entry).
- Tests:
  - `src/engine/__tests__/encounterCache.test.ts` (mirror the predicate)
  - `src/engine/__tests__/encounterSeedLiveness.test.ts` (the four fatal corpus tests)
  - `src/data/encounters/__tests__/vertical-slice.test.ts` (the four flags, the board-absence pin, the Family's widened envelope; its envelope-honesty test at `:105-114` needs `settings` and `locationSubtypes` widened together)
  - `src/data/content-eval/__tests__/encounterPackage.test.ts` (pass-through)
- Docs:
  - `Docs/ubiquitous-language/Encounters.md` + README
  - `Docs/canon/encounters.md`
  - `Docs/canon/content-objects.md`
  - `Docs/canon/rulebook.md`
  - `Docs/plans/2026-04-16-systemic-wiring-guide.md`
  - `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` (Seeded Sequel row)
  - `.claude/skills/encounter-pipeline/reference/encounter-package-format.md`
  - `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts`

## Notes for the executor

- **Do not remove the four sequels from `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`.** That array is also the query catalog (`content-objects.ts:172`). Removing the Reckoning would make the missed branch's `#crossroads_debt` query resolve nothing: the defect this fixes, in reverse.
- **Keep the sequels' `locationSubtypes`.** `eligibleAt` reads them for seed resolution, and the Reckoning must stay eligible in every class.
- **The fight and hunt plans' spawn-only templates** (`fight.lair.confront`, `hunt.trail_cold`) are already kept off the board by array membership (`MONSTER_ENCOUNTER_TEMPLATES` is not cache-fed). Setting `drawable: false` on them is harmless and documents intent. It is those slices' call. Gate 1 above will require it of `hunt.trail_cold` once H2 makes it an appointment's missed target, so H2's executor should expect that.
- **Paste the rural opening as authored.** Do not rewrite it; it was written against the spine and the register.
- **Filed separately:**
  - THR-1565: the Healer's seed into the Grateful Kin names the wrong family; the Swindled Family's self-seed replays the first meeting; `shrine_offering` plants an empty seed.
  - THR-1567: the three wayside-only siblings (the Unsafe Bridge, Snow on the Pass, Riders Behind the Caravan).

## Intent-judge verdict

*Three passes, 2026-09-24. Impact class External (raised from Reversible on the first pass): the plan edits two encounter-pipeline references other agents follow and adds a fatal corpus gate.*

1. **Revise.** Required findings, all applied:
   - the Blast Radius section;
   - the false parallel-safety claim with the Physical Conflict slices;
   - the kill criteria;
   - the foreign-query pin;
   - the named census instrument;
   - the authored rural opening;
   - the corpus audit table;
   - filing the wayside siblings (THR-1567);
   - the mistaken `encounterPackage.ts` allowlist.
2. **Revise.** Three GAPs, all applied:
   - the wiki pages the blocking gate owes;
   - a real guard for a forgotten flag (the second `check:encounter` warning);
   - the M2 mutex and `content-objects.md`.

   Also applied: the test path and the envelope-honesty note, and six citation corrections.
3. **Allow.** One GAP, applied before commit: the `system-interface-map` wiki page is added to the Done-when. The opening's line number is corrected to `vertical-slice.ts:2909`.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-09-24.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | N/A | "No tunable numbers. The flag is a declared property of a template, not a threshold (NFP #1 N/A)" |
| 2. Inspectability | PASS | Wiring table matches `wiring-checklist.md`'s Module/Phase/UI/GameState/Trace/Debug-visibility format; no new trace, but justified via corpus tests naming every flagged template + firing census attributing every firing — same "deliberately no trace" pattern as precedent rows (e.g. THR-1212 slice 1) |
| 3. Determinism | PASS | "No random code; cache membership is a pure function of template data"; PRNG-callouts section: "None added" |
| 4. Fail-soft | PASS | Explicit fail-soft table, 5 rows, each with a named fallback (e.g. no-planter warning, foreign-query pin, corpus-test CI failure) |
| 5. Narrative over mechanical perfection | PASS | Core purpose of the plan — removes prose that "reports a promise never made"; Vision audit ties to north-star §"a story the player can tell in prose" |
| 6. Additive over destructive | PASS | "The field is optional and defaults to drawable... no shipped template changes behaviour unless it is flagged"; Family envelope widens (`['wayside']` → `['wayside','rural']`) rather than narrows |
| 7. Performance budget | PASS | "It runs at cache build only, never per agent per tick"; NFP table: "O(templates) per location, as today, never per tick" |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All required subsections (Systems design, Graph nodes/edges, Tick phases, Resolution logic, PRNG callouts) present with real content; N/A subsections (graph, PRNG) are explicitly stated, not silently empty |
| Content | present-and-substantive | Encounter templates, Prose tables present with real content; Attachment content and Data tables explicitly N/A with one-line rationale; plus a corpus audit and content-gates section beyond the template minimum |
| UI | N/A-with-rationale | Declared `UI: N/A — no component changes` at the top with a stated reason (fix removes scenes from play; review still reaches via `?spawn=`) |

No missing required sections.

**Wiring check:** Present and connects both active pillars — the module table names orchestrator phase (cache build, module load, offline CLI), UI component (`—`, consistent with UI: N/A), GameState field, trace, and debug visibility for each row; the check sentence at the section head explicitly claims this coverage.

**Substrate-existence check:** Plan opens with `## Substrate inventory` immediately after "Why this is load-bearing." Six rows, each named against `Docs/canon/systems-inventory.md`'s "Engine modules by domain" clustering — verified: `encounter` cluster includes `encounterCache.ts`/`encounterSeeding.ts`, `delivery` cluster includes `deliveryBeatAdapter.ts` — both match the plan's citations. Every row is marked ACTIVE with an extends/reuses disposition; no new subsystem is proposed and no green-field duplication of an existing inventory entry was found.

PILLAR AUDIT: PASS

### Vision audit

**1. Vision premises touched**

- `00-north-star.md` → `:43` *"a story the player can tell in prose"* — confirmed. The fix removes a sequel that reports a promise (favor kept/broken) whose cause never occurred, which is exactly the kind of untellable-because-untrue beat the north star rules out.
- `01-core-loop.md` → aftermath making decisions "echo" (consequences anchored in a witnessed choice) — confirmed. The Reckoning/Collection now fire only from the mortal's actual crossroads choice, not from unrelated reachability.
- `02-non-negotiables.md` → #2 *"Narrative over mechanical perfection"* — confirmed, cited directly in the plan. #7 three-pillar rule — confirmed structurally (UI marked N/A with rationale, not silently skipped).
- `03-design-tensions.md` → Tension #2, systemic emergence vs. authored moments — extended, in the authored direction (envelope widened + `drawable` flag), matching the THR-1524 precedent it cites.
- `taste-profile.md` → not directly cited; overlaps "Narrative over mechanical perfection" and "Additive over destructive" strong opinions but adds nothing new — not referenced.

**2. Vision contradictions**

No contradictions found.

**3. Five qualitative checks**

- North star: yes — removes a scene that fabricates a mortal's past choice, protecting causal truth the north-star moment depends on.
- Core loop: preserved — pure cache/draw-eligibility gating at build time; scan→encounter→aftermath structure untouched.
- Non-negotiables: stays inside — no protagonist control introduced; if anything strengthens sovereignty (Reckoning now genuinely traces to the mortal's own missed promise).
- Design tensions: leans authored on tension #2, but counterbalances by widening the Family's envelope rather than shrinking content — not lopsided.
- Taste profile: respects narrative-over-mechanics and additive-over-destructive; no numbers or UI surfaced.

**VISION AUDIT: PASS**
