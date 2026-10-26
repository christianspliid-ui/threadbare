> **title:** A place held after success — the forge a mortal builds and the claim they stake are theirs afterwards — THR-2048
> **linear_issue:** THR-2048
> **author:** Claude Code (design lane, run 2026-10-26a, unattended)
> **created:** 2026-10-26
> **three_pillars:** Engine done (one aftermath effect kind) · Content done (three outcome tables, one failure line) · UI done (no new surface; the sheet's Holdings list, the notable line and the Place page already read `owns` — § UI pillar)

# A place held after success — THR-2048

*Wren Callow drew the forge three times, dug a hand deeper than the drawing, and lit it clean. The forge is Wren's now, and it pays her a little every day it stands.*

## Why this is load-bearing

The [money-encounter outcome table](https://linear.app/threadbare/issue/THR-1872) gave three encounters a holding as their payoff: **forge construction** (*"S forge held, prosperity+; F holding with repair cost"*), **the prospecting expedition** (*"S deposit + claim"*) and **prospect the seam** (*"S claim held; F claim lost"*). Their prose already says it: *"{actor} has a mine here"*, *"{actor} owns a piece of the mountain on paper"*. Nothing writes it. [Mortal wealth](2026-10-15-thr-1936-mortal-wealth.md) set the rows aside (§ Content, *Not in this plan*) as needing "a NEW (create place)" carrier, and [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) held them. This plan builds that carrier and authors the three rows.

## Substrate inventory

Measured on main @ 9cfae007.

| Fact | Where |
|---|---|
| Forge construction has **no `outcomeEffects`**. Its steps write only `reputationDelta`. It fires at `town`, `castle`, `fort`; boom weight 0.6. | `encounter-content.ts:4597-4668`; `economic-scene-affinity.ts:123` |
| Prospecting expedition's table has failure rows only (`economy_shift means −MEANS_STEP`). Success prose: *"{actor} has a mine here"*. Fires at `wilderness`, `mining`. | `encounter-content.ts:7451-7455`, `:7490` |
| Prospect the seam has no `outcomeEffects`. Stake success: *"{actor} owns a piece of the mountain on paper"*. | `encounter-content.ts:14593-14665`, `:14651` |
| The one `owns` writer is `grantHolding`. It mints the bearer's freehold face, is idempotent, and refuses a second owner (`already_owned_by_…`). | `holdings.ts:229-275`; schema `edgeSchema.ts:120-127` |
| No encounter effect grants `owns` on a Place. The only place-minting kind, `spawn_unique_location`, mints a run-unique top-level location (Stone's Great Work). | `unifiedAction.ts:1092-1124`; handler `encounterAftermath.ts:4214-4299` |
| `createSublocation` mints the canonical Place shape with `contains` and `constructed_by` and `persistence: permanent`. | `strategicGraphOps.ts:180-235` |
| A freehold pays: each `owns` target earns `WEALTH_SUBLOCATION_INCOME` (1) Means a day, times its blessing multiplier. Standing in your own Place gives `FACTION_CONTROL_BONUS`. | `holdingIncome.ts:128-141`, `wealth.ts:29`; `resolutionModifiers.ts:439-443` |
| Forge and mine are Place types, not town buildings. `buildingForPlaceType('sublocation-type.forge')` is undefined; the smithy is the craft building and adopts nothing. A mine Place spawns conditionally (`has_resource:ore‖stone`). | `settlement-buildings.ts:161-166`, `:225-235`; `sublocation.ts:106`; `phaseSublocations.ts:120-128` |
| The settlement an aftermath lands on is `resolveSceneHere(graph, actorId, 'location')`, as `economy_shift` uses it. | `encounterAftermath.ts:1888-1893` |
| Outcome tables run through `applyOutcomeEffectsTable`, gated on `MORTAL_MEANS_ENABLED` (true). | `unifiedActionResolution.ts:3296-3304`; `mortal-means-constants.ts:16` |

## Decisions

Decided by the design lane under delegation (process.md rule 4). Each can be vetoed on its own.

1. **The forge a mortal builds is theirs.** A successful forge construction raises a **forge** Place in that town, and the mortal holds it as a freehold. The builder holds what they raise, as [a building a mortal raises](https://linear.app/threadbare/issue/THR-1966) already rules. The forge is not one of the town's buildings, because forges are not on the building table, and the town's smithy stays the town economy's choice. *Rejected:* raising the smithy. Ore and a free slot would decide whether the scene's forge exists at all. *Veto:* "the smiths, not the builder, should hold the forge".
2. **One forge per settlement (town, castle or fort), and one claim per place.** If the settlement already has a forge with no holder, the mortal takes it up as their freehold. If someone holds it, nothing new is raised and the mortal is paid for the work instead (one Means step). Prospecting works the same way with the place's **mine**: hold the one that stands, or stake one if none does. Nothing is ever raised beside a held one. This bounds the new income to one freehold per town or wild place.
3. **A scene never takes a holding away.** *Prospect the seam*'s failure stakes nothing (*"another prospector did the paperwork"*). It does not strip a claim the mortal already holds. A failed forge raises nothing and costs a Means step. This matches [a road's encounters](https://linear.app/threadbare/issue/THR-2046) Decision 3 (a scene never takes a toll away). *Veto:* "a failed stake should lose the claim they had".
4. **The mill lease stays the fellowship's.** *The Mill Lease* wins the lease *"for the fellowship"* (`mill-lease-auction.ts:37`). The mortal is the hired expert, and is already paid a fee at the sealing (`mill-lease-sequels.ts:76-85`). The fellowship is no node, and nothing reads a faction holding a Place. So this plan writes no holding there, and the row returns to [the later-rows list](https://linear.app/threadbare/issue/THR-1954) as *a faction holds a place*. *Veto:* "the mortal who wins the lease should hold the mill".

## Engine pillar

### Systems design

1. **New aftermath effect kind `hold_place`** (`src/types/unifiedAction.ts`, `EncounterAftermathReactionEffect` union):
   ```ts
   | { readonly kind: 'hold_place';
       /** The Place type held or raised, e.g. 'sublocation-type.forge'. */
       readonly placeTypeId: string;
       /** The noun the raised Place is named with: "{Actor}'s {noun}". */
       readonly nameNoun: string;
       /** Settlement or wild place; default the scene's own place ($here). */
       readonly targetLocationId?: string;
       /** When the Place stands and is held by someone else: this Means shift instead. */
       readonly heldElsewhereMeans?: number;
       readonly when?: EffectPredicate; }
   ```
2. **Handler** in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`), beside `economy_shift`. Skipped when `!MORTAL_MEANS_ENABLED`. Steps:
   - Site = `targetLocationId` if literal, else `resolveSceneHere(graph, actorId, 'location')`. Missing → trace `aftermath_target_invalid` `target_node_missing`, write nothing.
   - Find Places the site `contains` whose `sublocationTypeId === placeTypeId`, lowest id first.
   - **None stands** → `createSublocation(graph, siteId, actorId, "<actor name>'s <nameNoun>", placeTypeId, tick)`, then `grantHolding(graph, actorId, placeId, { tick, verb: 'create' }, 'creation')`.
   - **One stands with no `owns` in** → `grantHolding(…, 'grant')`, then set the Place's `persistence` to `{ type: 'permanent' }`. A held Place is a Work: a mine spawned conditionally (`phaseSublocations.ts:120-129`, `dissolvePredicate: 'has_resource:ore||has_resource:stone'`) would otherwise dissolve under its holder when the ore runs out (`checkDissolutions` skips only `permanent`, `sublocation.ts:651`). A claimed mine stays staked, worked out or not.
   - **One stands, held by the actor** → no write (idempotent; the trace says `already_theirs`).
   - **One stands, held by someone else** → no Place write; when `heldElsewhereMeans` is set, apply it through the same `applyMeansShift` path `economy_shift means` uses, reason `'paid_work'`.
   - Every branch emits `encounter.place.held` (§ Tracing). `mutationSummary.touchedWorld = true` on any write.
3. No change to `grantHolding`, `createSublocation`, holding income or the building economy. A raised Place carries `persistence: permanent` (from `createSublocation`, `strategicGraphOps.ts:213`), and a taken-up one is made permanent in step 2, so on both branches the conditional dissolver never removes a held claim. `resolveSceneHere` lives in `sceneHere.ts:42`.

### Graph nodes / edges

No new node or edge type. Writes are a `location` node with `parentLocationId` (the Place tier), `contains`, `constructed_by`, and `owns` plus its freehold face through `grantHolding`. All exist (`src/types/graph.ts:81-82`, `:121`).

### Tick phases · Resolution · PRNG

No phase change. The effect runs at the roll, inside `applyOutcomeEffectsTable`. No new PRNG draw. The pick of an existing Place is by id order.

## Content pillar

Outcome tables (`outcomeEffects`, `src/data/encounter-content.ts`), using existing steps (`MEANS_STEP` = 6, `W_PROSPERITY`):

| Encounter | critical_success | success | success_at_cost | failure | critical_failure |
|---|---|---|---|---|---|
| `encounter.forge_construction` | hold forge · prosperity +`step` | hold forge · prosperity +`small` | hold forge · Means −`MEANS_STEP` (the overrun) | Means −`MEANS_STEP` | Means −`MEANS_STEP` |
| `encounter.prospecting_expedition` | hold mine | hold mine | hold mine · Means −`MEANS_STEP` | (existing) Means −`MEANS_STEP` | (existing) Means −`MEANS_STEP` |
| `encounter.prospect_the_seam` | hold mine | hold mine | hold mine | — | Means −`MEANS_STEP` |

- `hold forge` = `{ kind: 'hold_place', placeTypeId: 'sublocation-type.forge', nameNoun: 'forge', heldElsewhereMeans: MEANS_STEP }`.
- `hold mine` = `{ kind: 'hold_place', placeTypeId: 'sublocation-type.mine', nameNoun: 'claim', heldElsewhereMeans: 0 }`. A claim already held by another pays nothing; the stake simply did not take.
- **One line changes.** Forge assembly's failure line says *"The forge will work"*, which a failure band would now contradict (no forge is raised). The band is encounter-wide, so the same step line can also show under a costly success (forge held, repair paid). The new line must read true under both (Prose Doctrine v2, no numerals): *"The first firing splits the hearth stone end to end. Whatever stands here now, it is not yet a forge."* Under failure nothing more happens. Under a costly success the Means step is the price of making it one.
- Every other line already supports the write (THR-1872's *prose?* column: yes for all three).

## UI pillar

No component changes. Every surface already reads the `owns` edge and the Place shape this writes.

### Player-facing text

- **Before:** after *"The first firing runs clean"*, Wren's sheet shows no new holding, and the town's Places do not include a forge. The scene's promise is not kept.
- **After:** Wren's sheet **Holdings** list shows *Wren Callow's forge* (the freehold face `grantHolding` mints; holdings lead the slot order, `personRows.ts:600-613`). Her notable line in the town reads *"Holds Wren Callow's forge"* (`settlementNotable.ts:147`, word `holds: 'Holds'`, `subject-sheet-words.ts:105`). The forge appears among the town's Places with forge category art (`sublocation-category-art.ts:142`). Her Means rises a little each day it stands; the sheet names the source with the existing phrase *"a freehold that pays its way"* (`describeWealthSource`, `agentDetail.ts:1015`).
- A staked claim reads the same way: *Wren Callow's claim* in her Holdings list, at the wild place's Places list with mine art (`:144`).
- **Empty slot:** `createSublocation` takes the name from its caller, so when the actor node has no name the handler names the Place *"A builder's forge"* / *"A prospector's claim"* (the THR-1966 raise uses `'A'` the same way, `undertaking-objects.ts:1391`).
- **Held elsewhere:** no new holding appears. The Means card moves one step up, and the sheet names the source *"work that paid"* (`paid_work`, `agentDetail.ts:1027`). The scene's prose is unchanged, because it never says who keeps the forge.
- Laws engaged: 1 (one truth: the `owns` edge), 4 (no numerals), 13/14 (a missing edge drops the row, never a blank), 17 and 21 (the name is a link through the existing Holdings row), 56 (every line is backed by the write).
- Complaint classes ([player-complaint-classes.md](../ops/player-complaint-classes.md)): **PC-1** a promise the prose made and the game did not keep (*"has a mine here"*) is now kept. **PC-6**: the sheet, the notable line and holding income all read the one `owns` edge.

### Event notifications

None new. The scene's own success line (*"The first firing runs clean…"*, *"{actor} has a mine here…"*) is the moment, and it already plays in the aftermath. A freehold gained in a background scene is learned from the sheet, as THR-1966's raised buildings are.

### Visual presence (HexMapV2)

N/A: a Place is the sublocation tier and draws nothing on the hex map; the town's hex is unchanged.

### Debug inspection

The Traces tab shows `encounter.place.held` with its `result`. The Inspector on the new Place shows `constructed_by` and the incoming `owns` with `via`. `window.__DEBUG.getMortalMeans` (shipped) shows the `paid_work` payment on the held-elsewhere branch.

### Playtest signal

A warm-playtest tester who opens a mortal who built a forge in a scene finds a forge in that mortal's Holdings. Before this plan, the Holdings list never changed after the scene.

**Browser-verify tool:** Playwright DOM at 1920×1080. `?view=game&seeded&size=medium&spawn=encounter.forge_construction&outcome=success` (read `await window.__DEBUG.getOutcomePinVerdict()`), then open the actor's sheet. One screenshot: a small visible change, no UI code.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, phase, component or debug tab.

| Module | Phase | UI | GameState | Trace | Debug |
|---|---|---|---|---|---|
| `hold_place` handler (`encounterAftermath.ts`) | encounter resolution, outcome table | sheet Holdings, notable line, Place list | graph: Place + `contains` + `constructed_by` + `owns` | `encounter.place.held` | Inspector on the Place; `owns.via` in the graph |
| three outcome tables (`encounter-content.ts`) | — | — | — | — | — |

## Interface impact

| Contract | Status | Change |
|---|---|---|
| Encounter Aftermath → Holdings (`owns`, `grantHolding`) | add | an encounter outcome becomes a third family of `grantHolding` callers, beside undertakings and worldgen. Read sites: `holdingIncome.ts:128-141` (pay), `agentDetail.ts:525` (sheet), `settlementNotable.ts:147` (notable line), `resolutionModifiers.ts:439` (home ground) |
| Encounter Aftermath → Places (`createSublocation`) | add | the first encounter writer of a Place. Read site: the place's `contains` list (Place page), `phaseSublocations` (skips permanent Places) |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain both rows in the build PR.

## Constants table

No new number. The rows use existing steps:

| Constant | Default | Purpose here |
|---|---|---|
| `MEANS_STEP` | 6 | the overrun on a costly success; the fee when the forge is held elsewhere |
| `W_PROSPERITY.small` / `.step` | 2 / 4 | a new forge's lift to its town |
| `WEALTH_SUBLOCATION_INCOME` | 1 | what each freehold pays a day (unchanged) |

The switch is data: removing `hold_place` from the three tables turns it off.

## Tracing

```ts
interface EncounterPlaceHeldTrace {
  category: 'encounter.place.held';
  tick: number; agentId: string; sourceTemplateId: string | null; band: UnifiedActionOutcome | null;
  siteId: string; placeTypeId: string;
  result: 'raised' | 'taken_up' | 'already_theirs' | 'held_elsewhere';
  placeId: string | null; heldBy?: string; meansPaid?: number;
}
```

The category is registered in `TraceCategory` / `TRACE_CATEGORIES` (`src/types/trace.ts`) beside `economy.world.shift`, so the Traces tab and `window.__DEBUG.getTraces` (with tracing enabled) show it.

## Fail-soft table

| Case | Behaviour |
|---|---|
| No site resolves (actor not on a place) | `aftermath_target_invalid` `target_node_missing`; nothing written |
| `createSublocation` fails | trace with `placeId: null`; no `owns` written; the rest of the table still applies |
| `grantHolding` refuses (a race: another owner appeared) | treated as `held_elsewhere` |
| The actor dies later | the Place and freehold stay, as every freehold does (the Work outlives its maker) |
| The site is later razed or dissolved | the existing Place and freehold cleanup runs; nothing new |
| A costly success at a forge someone else holds | the overrun (−`MEANS_STEP`) and the fee (+`MEANS_STEP`) net to nothing. Intended: they were paid for the work and it cost them what it paid |
| A taken-up mine whose ore runs out | it stays: step 2 made it permanent, so the freehold, its face and the `owns` edge never dangle |

## Blast Radius

`src/types/unifiedAction.ts` is a wide-blast file (CLAUDE.md high-impact list). The change is one additive union member. `switch (effect.kind)` sites may need a case: the sentinel-binding switch (`encounterAftermath.ts:705` region; `hold_place` passes through unbound) and the apply switch (`:1880` region). `npm run check:typecheck` finds any other. No existing member changes shape.

## Three-pillar check

- [x] Engine pillar present (one effect kind)
- [x] Content pillar present (three tables, one line)
- [x] UI pillar present (existing surfaces, one screenshot)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 45 (a promise the prose makes, the game keeps), 42 (one effect kind for every held Place, not a forge special case) and 56 (each line is backed by the write). The cap in Decision 2 keeps the income from compounding (no farm: a second success at a held forge pays once, not a second freehold). Breaks none.

## Vision audit

- [x] Does not contradict a Vision premise. Checked: `Vision/00-north-star.md` (a story the player can tell: Wren built the forge and it is hers), `Vision/01-core-loop.md` (what mortals do changes the world), `Vision/02-non-negotiables.md` (the relationship is the `owns` edge), `Vision/03-design-tensions.md` #2 (systemic, with the scene's own words as the authored pull) and #4 (the income is never shown as a number, and the one-per-place cap keeps it from becoming a strategy to optimise), the taste profile (prose-first, graph edges, no numerals).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: some scenes leave a mortal holding a place.
- [x] Owed in the build PR. In `Docs/canon/rulebook.md` beside the THR-1966 building line, and in the quick reference's economy paragraph: *"A mortal who builds a forge or stakes a claim in a scene holds it afterwards, one to a town or wild place. A scene never takes a holding away."* (`[IMPL — THR-2048]`).

> Brainstorm companion: `Docs/plans/2026-10-26-thr-2048-place-held-after-success-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | no new number; the switch is the three tables |
| 2. Inspectability | PASS | one trace with the result branch; `owns.via` on the edge |
| 3. Determinism | PASS | no PRNG; Place pick by id order |
| 4. Fail-soft | PASS | table above; every branch writes nothing on a miss |
| 5. Narrative | PASS | the scene's promise comes true |
| 6. Additive | PASS | one union member, three tables, one line |
| 7. Performance | PASS | one `contains` scan per resolved scene of three templates |

## Done when

- [ ] `holdPlace.test.ts`: on a town with no forge, a `hold_place` forge effect leaves exactly one forge Place in the town's `contains`, with `constructed_by` → actor, `persistence.type === 'permanent'`, and one `owns` from the actor with `via === 'creation'`.
- [ ] The same test: a second run leaves one forge and one `owns` (`already_theirs`); a forge held by another actor gets no second Place and the actor's Means rises by `MEANS_STEP` (`held_elsewhere`); an unheld forge is taken up with `via === 'grant'`.
- [ ] The same test: with no resolvable site, nothing is written and `aftermath_target_invalid` is traced.
- [ ] The same test: a conditional mine Place taken up by `hold_place` has `persistence.type === 'permanent'` afterwards, and `checkDissolutions` on a location with no ore leaves it and its `owns` edge in place.
- [ ] A content test: forge construction, prospecting expedition and prospect the seam carry the tables above; no failure band carries `hold_place`; every amount is a named step.
- [ ] A 30-day headless run on seed 42 (`npm run cli -- --seed 42 --map medium`, `tick 720`): `phaseSublocations` never dissolves a staked claim, and no town or wild place holds two forges or two mines raised by `hold_place`. Report the count of `encounter.place.held` by result.
- [ ] Rulebook and quick-reference lines; interface map and contracts; wiki page whose `sources` match. `npm run gate` green. The 1920×1080 sheet screenshot.

## Kill criteria

- The 30-day run shows more than one `raised` per three towns. Then the forge is commoner than a town building, and the income outweighs the building economy: change the success band to a Means step only (pay, do not raise) and keep critical success raising. Re-measure.

## Coordination block

**Suggested model:** sonnet. One additive effect kind on precedent paths (`economy_shift`, `spawn_unique_location`), three content tables, one line.

**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040), [commission pay](https://linear.app/threadbare/issue/THR-2042), [the sequel place](https://linear.app/threadbare/issue/THR-1929), [the founding gates](https://linear.app/threadbare/issue/THR-2009), [relic take-up](https://linear.app/threadbare/issue/THR-2031). None authors these three templates or the aftermath effect union.

**Mutex with:** [a road's encounters](https://linear.app/threadbare/issue/THR-2046) — both add a member to the aftermath effect union in `unifiedAction.ts` and a case in `encounterAftermath.ts`. Merge conflicts only, no design overlap; whoever lands second rebases.

**Files to touch:** `src/types/unifiedAction.ts`, `src/engine/encounterAftermath.ts`, `src/data/encounter-content.ts`, tests; rulebook pair, interface map and contracts, wiki page.

## Notes for the executor

Do not touch `grantHolding` or the building economy. Do not mark the forge as a town building. Do not add `hold_place` to *The Mill Lease* (Decision 4). The forge's name noun is lower-case (*"Wren Callow's forge"*), as THR-1966's raised buildings are.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | Revise | dim 12 GAP: no Playtest signal; dim 11/4 GAP: a taken-up conditional mine would dissolve under its holder (`sublocation.ts:651` skips only `permanent`); optional: the new assembly line contradicted a costly success; two citations off by a few lines | Playtest signal added; step 2 makes a taken-up Place permanent, with a fail-soft row and a Done-when; the assembly line now reads true under both bands; citations corrected |
| 2 | **Allow** | all run-1 findings fixed; dim 4 GAP (non-blocking): a costly success at a forge held elsewhere nets zero Means; "one forge per town" understated castles and forts | Fail-soft row states the net zero is intended; Decision 2 says "settlement (town, castle or fort)" |

## Forked-audit verdicts

### NFP audit
PASS-with-notes. All seven pass. Notes: 2 — the trace category's registration was not named (now: `TraceCategory` / `TRACE_CATEGORIES`); 6 — one authored line is replaced rather than added, justified by the band contradiction; `unifiedAction.ts` is wide-blast and the Blast Radius says so.

### Three-pillar audit
PASS-with-notes. Engine and Content present and substantive; UI was present but thin — Event notifications, Visual presence, Debug inspection and Playtest signal were missing (now added, Visual presence N/A with reason). The substrate inventory uses fact rows rather than the template's status columns; it clearly extends existing substrate (`grantHolding`, `createSublocation`, holding income) with no green-field duplication.

### Vision audit
PASS-with-notes. No contradiction. Extends the core loop ("aftermath exists so consequences compound"). Notes: the taste profile was not cited (now cited); a daily freehold income could invite optimal-strategy play on tension #4 — the one-per-place cap, no numerals and the kill criterion address it.
