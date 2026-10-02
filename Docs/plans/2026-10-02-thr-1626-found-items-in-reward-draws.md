> **title:** Found things in the reward draw — half of the Storied and Mythic rewards are generated, where the generator can honour the recipe — THR-1626
> **linear_issue:** THR-1626
> **author:** Claude Code (design lane, run 2026-10-02a)
> **created:** 2026-10-02
> **three_pillars:** Engine `done` · Content `done — one new found-origin core in the knowledge family, so the largest recipe family has two cores to draw on` · UI `done — no new component: the reward line already names the instance and links its sheet, which already reads a found item; one debug lever`

# Found things in the reward draw — THR-1626

*Today a mortal who earns a Storied reward is handed one of a few dozen authored items, the same ones again and again. After this plan, about half of those rewards are a thing found in this world — a dead hero's blade, salvage from the flood at Saltmere, a trophy off one of the Grey Wraith Host — that still fits what the work was about.*

## Why this is load-bearing

The seeded item generator ([THR-1570](https://linear.app/threadbare/issue/THR-1570), shipped 2026-09-27) mints items at one point only: masterworks, about three or four per 150-tick world. Its plan ruled the share of generated items in **reward draws** and deferred the constant to this ticket, because nothing reads it until a reward draw can carry a generated item (`Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Constants → *Pool share*). The `found` origin is already built and dressed by the world's past ([THR-1637](https://linear.app/threadbare/issue/THR-1637), shipped): `buildItemWorldContext(graph, { past: true })` reads the dead, the disasters and the monster hosts, and the gate test passes for `found` at every band.

What the reward draw hands out today, measured (census below): **~130 Storied or Mythic authored items per medium world per 150 ticks**, out of ~430 draws, from a catalogue where the most-drawn Storied item is handed out ten times in one run (`reward_tomes_scrolls_chronicle_of_the_falling`, seed 7). The authored catalogue is the repetition the generator exists to break.

**Settled input — not reopened here:**

- **The ruling this ticket carries** (design lane, 2026-09-26, delegated; not vetoed): `GENERATED_REWARD_SHARE_BY_BAND = { 1: 0, 2: 0.5, 3: 0.5, 4: 0 }`. Half of every Storied and Mythic reward draw is generated, origin `found`, born Storied at `STORIED_START_LEVEL_FOUND_BY_BAND`; Mundane stays authored (the THR-1236 ruling, *generate Storied and up*); Legendary stays authored until a generated Legendary has its own trait-graph design.
- **The THR-1570 seam:** generate → mint → hand over, and **a minted instance is never a template** (`contentQuery.ts:197-200` excludes `craftedBy` and `origin: 'generated'` nodes from the `item_template` carve — shipped).
- **The THR-1236 rulings:** authored trope cores dressed by world tables; *an item never promises what the engine does not do* (the validator and read-back gate every core).

**Decided in this plan by the design lane under delegation** (process.md rule 4; each marked *Lane decision* where it appears, each vetoable in chat): where in the draw the share applies (§ Resolution logic, *After the pick*), that a generated item must carry the recipe's tags or the authored item stands (*The recipe is honoured*), the two-core variety floor (*Never one idea on repeat*), the new knowledge core (§ Content pillar), and the volume that follows (§ Population).

## Substrate inventory

Measured 2026-10-02 against `origin/main` 1b12cfd8.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Reward pool** — `drawSeededReward` (`rewardPool.ts:624`), the one seeded draw path (THR-1146). Three callers: `unifiedActionResolution.ts:1551` (`site: 'step_reward_pool'`), `encounterAftermath.ts:4996` (`reward_draw`), `fights/fightEnding.ts:623` (`fight_trophy`) | 🟢 ACTIVE | **extends** — after the pool's pick and before `instantiateReward`, a share roll may hand the recipient a generated `found` item instead. Pool assembly, roll order and the `content.query_*` trace are unchanged |
| `instantiateReward` (`rewardPool.ts:771`) — clones a template under `reward_${recipient}_${tick}_${templateId}` | 🟢 ACTIVE | **preserve** — still the path for every draw not substituted |
| **Item generator** — `generateValidItem` / `mintGeneratedItem` (`itemGenerator/mintGeneratedItem.ts:40,91`), `buildItemWorldContext` with `past` (`worldContext.ts:275`), `itemGenHistoryFromGraph` (`:318`), the cores (`item-generator-cores.ts`, `origins` field) | 🟢 ACTIVE (masterworks) | **extends** — a second minting point (`found`); the generator learns one optional input, `requiredTags`, and the cores gain one helper that says which tags a core can carry |
| Content query carve — `contentQuery.ts:197-200` | 🟢 ACTIVE | **preserve** — a generated reward is `origin: 'generated'`, so it is never itself drawable |
| Aftermath reward line — `rewardSentence` (`aftermathWords.ts:852`), called with `rewardId: instantiation.instanceId` (`unifiedActionResolution.ts:2788-2792`) | 🟢 ACTIVE | **preserve** — the line names the instance and links its page; a generated item flows through unchanged |
| Artifact sheet — *What it does* / *The catch* / provenance links for `origin === 'generated'` (THR-1570) | 🟢 ACTIVE | **preserve** — a `found` item has no maker, so *Made by* stays hidden (Law 4) |
| Legacy encounter-progress reward block (`orchestrator.ts:723-760`) — its own `assembleRewardPool` + `drawFromPool` + `instantiateReward`, not `drawSeededReward` | not measured here | **not touched** — the one-path rule puts the share in `drawSeededReward`; this block emits no `content.query_*` trace, and the census saw none of its draws. If it is live, it keeps authored rewards — noted in § Notes |

**Census** — reader [`readers/reward-minting.ts`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/reward-minting.ts), output [`reward-minting-2026-10-02-thr1626.json`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/reward-minting-2026-10-02-thr1626.json); medium map, unattended, 150 ticks, `content.query_resolved` traces at the three reward sites:

| Seed | Reward draws | Authored artifact, tier 2 | tier 3 | Storied + Mythic share | Past in the world (dead · disasters · monster hosts) |
|---|---|---|---|---|---|
| 42 | 443 | 107 | 25 | 30% | 11 · 7 · 12 |
| 99 | 403 | 111 | 17 | 32% | 9 · 6 · 12 |
| 7 | 459 | 124 | 24 | 32% | 13 · 6 · 12 |

Every draw came through `step_reward_pool`; `reward_draw` and `fight_trophy` drew nothing in these runs (they share the path, so they inherit the rule anyway).

**Almost every Storied recipe carries a tag filter**, and an unconstrained generated item rarely carries it: across 60 `found` items per band on each world's own context, the share that satisfied each observed filter ran from 0/60 (`#survival`, `#gem`) to 19/60 (`#talisman`); `#knowledge` — the commonest filter, **115 of 408** Storied/Mythic draws — fit 1–5/60. Generation never failed (0 refusals of 360). So the generator must be **asked** for the recipe's tags, not hoped at.

**Which cores can carry each filter** ([cover output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/reward-minting-cover-2026-10-02-thr1626.txt), static over each core's family, forms, materials, reaches and spheres): 389 of 408 draws have at least one; but `#knowledge`, `#divine`, `#stealth`, `#trade`, `#healing`, `#craft` and `#arcane` each have **exactly one** (`forbidden_book`, `saints_relic`, `thieves_kit`, `merchant`, `saints_relic`, `made_past_skill`, `forbidden_book`). With ≥ 2 cores: 212 of 408 (52%).

**Cost:** on seed 42 at tick 150, `buildItemWorldContext(past)` 0.27 ms, `itemGenHistoryFromGraph` 0.03 ms, `generateValidItem` 0.14 ms per attempt — about 0.45 ms for a substitution that fits first time, and at most ~0.86 ms when all `ITEM_GEN_REWARD_FIT_ATTEMPTS` (4) are spent, against a 182 ms steady tick. `coreTagReach` is memoised per core (static data), so it costs once per session.

## Blast Radius

`src/types/trace.ts` has **121 importers** (grep, 2026-10-02). The edit is append-only: one string added to the trace-category union and to `TRACE_CATEGORIES`, beside `item.generated`, exactly as THR-1570 did. No existing member, shape or export changes, so no importer can break; the typecheck ratchet and `check:generated-freshness` are the guard. Every other edited file has under 25 importers (`rewardPool.ts` 20, `item-generator-tables.ts` 10, `item-generator-cores.ts` 4).

## Engine pillar

### Systems design

One new module, `src/engine/itemGenerator/rewardMinting.ts`, pure apart from the mint, fail-soft:

```ts
export interface GeneratedRewardRequest {
  readonly graph: WorldGraph;
  readonly seed: number;
  readonly tick: number;
  readonly recipientId: string;
  readonly drawnTemplateId: string;      // what the pool picked
  readonly requiredTags: readonly string[]; // the effective recipe's tagFilters (empty = none)
  readonly site: ContentQuerySite;
}
export type GeneratedRewardResult =
  | { readonly substituted: true; readonly instantiation: InstantiateRewardResult; readonly item: GeneratedItem; readonly band: 2 | 3 }
  | { readonly substituted: false; readonly reason: GeneratedRewardSkip };
export type GeneratedRewardSkip =
  | 'disabled' | 'not_eligible' | 'kept_by_roll' | 'too_few_cores' | 'no_fit' | 'generator_refused' | 'mint_failed';

export function tryGeneratedReward(req: GeneratedRewardRequest): GeneratedRewardResult;
```

`drawSeededReward` calls it **once**, after `drawFromPool` returns a template and **only when `!isBadOutcome`**, before `instantiateReward`. On `substituted: true` it uses the returned instantiation and skips `instantiateReward`; otherwise it continues exactly as today. `SeededRewardDraw` gains one optional field:

```ts
/** Set when the generator stood in for the pool's pick (THR-1626). `drawnTemplateId` stays the authored pick. */
readonly generated?: { readonly itemId: string; readonly coreId: string; readonly signatureId: string; readonly band: 2 | 3; readonly seedKey: string };
```

and `templateName` returns the generated item's name when `generated` is set, so `recordReward` and the balance event name what was actually received. `drawnTemplateId` keeps the authored id — *the pool chose X; the generator stood in* is the inspectable story, and `rewardTemplateId` in balance telemetry keeps meaning "what the recipe's pool picked".

**The generator learns `requiredTags`.** `ItemGenRequest` gains `requiredTags?: readonly string[]`:

1. **Core eligibility.** A new pure helper in `item-generator-cores.ts`, `coreTagReach(core): ReadonlySet<string>` — every tag the core *can* produce: its `family`, the tags of every form in `forms` and `formsByEvent`, the tags of every material that fits those forms, `#<reach>` for its `reaches` (all eight when `reaches` is empty, since the reach then comes from elsewhere), `#<sphere>` for its `spheres` (all twelve for a trophy or `monsterSpheres` core), and `#storied`. Core choice drops every core whose reach does not include all of `requiredTags`. Computed once per core and memoised (the cores are static data).
2. **Steering.** When a required tag names a reach the chosen core leans to, that reach is forced; the same for a sphere. Every other table draws as today.
3. **Fit check.** `tryGeneratedReward` asks `generateValidItem` with seed key `…:f<k>` for `k = 0 … ITEM_GEN_REWARD_FIT_ATTEMPTS - 1` and takes the first item whose `tags` include every required tag (`rewardCandidateMatchesTags`, the draw's own rule). None fits → `no_fit`, authored item stands.

Steps 1–2 are additive: a request with no `requiredTags` draws exactly as today (the masterwork path and the gate test are unaffected — asserted).

### Graph nodes / edges

None new. A generated reward is the same `artifact` node `mintGeneratedItem` already writes (`origin: 'generated'`, `generated.origin: 'found'`, `makerId: null`), held through the minter's `possesses` edge. Its id: `gen_found_${recipientId}_${tick}_${drawnTemplateId}` — the shape of `instantiateReward`'s own id, so two draws for one recipient in one tick cannot collide, and the `gen_` prefix already resolves to the Item kind (`content-objects.ts`).

### Tick phases

None new. Runs inside whatever phase drew the reward (step resolution today). Expected ≈ 0.4 substitutions per tick per medium world (§ Population), under 0.5 ms each.

### Resolution logic

**After the pick (Lane decision).** The share applies to *what the pool picked*, not to the pool's contents. The pool, its weights, the bad-outcome flip and the draw roll are untouched, so every authored recipe still decides the band and the theme of what a mortal gets, and the generator only ever stands in for an item the recipe already chose. The alternative — a virtual "generated" candidate inside the pool — would change every pool's size, its `content.query_*` candidate count and the shared-path test against the resolver (`content-query-one-resolver-engine-and-gate`), for no gain.

**Eligible pick:** the picked node is an `artifact` (not `artifact_legendary`), not `rewardMode: 'service'`, with numeric `tier` in a band whose share is above 0 (2 or 3 under the ruling). Companions, agreements, conditions, powers and every bad-outcome draw are never eligible.

**The roll.** `mulberry32(hashSeed(\`gen_reward:${seed}:${tick}:${recipientId}:${drawnTemplateId}\`))()` < `GENERATED_REWARD_SHARE_BY_BAND[band]`. Its own stream — the draw's `rng` is not consumed, so with the share at 0 (or `ITEM_GEN_REWARD_ENABLED = false`) every world is identical to today.

**The recipe is honoured (Lane decision).** The generated item must carry every tag in the effective recipe's `tagFilters`. A scholar's reward stays a thing of knowledge, a trader's a thing of gold. Where the generator cannot honour the recipe, the authored item stands. *Why not substitute anyway:* the recipe's tag is the author's statement of what the work was about, and a generated item that ignores it would make rewards feel random rather than earned.

**Never one idea on repeat (Lane decision).** Substitute only when at least `ITEM_GEN_REWARD_MIN_FIT_CORES = 2` `found` cores can carry the recipe's tags at the band. Measured: `#knowledge` — 28% of Storied draws — has exactly one such core, `forbidden_book`; without the floor, half of every scholar's Storied reward would be *the book that should not be read*, the same idea with the same kind of catch, roughly 19 per world. The world's repeat decay cannot help when there is nothing else to choose. Below the floor the authored item stands (`too_few_cores`). The Content pillar adds a second knowledge core so this family is not shut out.

**Band and Storied level.** The band is the picked template's tier (2 → Storied, 3 → Mythic). `mintGeneratedItem` stamps Storied at `STORIED_START_LEVEL_FOUND_BY_BAND` (2 → *has seen a thing or two*, 3 → *has seen much*) — unchanged.

**World context.** `buildItemWorldContext(graph, { past: true })` (no maker), and `itemGenHistoryFromGraph(graph)` so the world's existing repeat decays (core, signature, form, hero, provenance) spread found things across ideas and across the dead they name.

### PRNG callouts

- Share roll: `mulberry32(hashSeed('gen_reward:' + seed + ':' + tick + ':' + recipientId + ':' + drawnTemplateId))`, one value.
- Item seed key: `gen_item:${seed}:found:${recipientId}:${tick}:${drawnTemplateId}`, with `:f<k>` for fit attempts and the generator's own `:r<k>` for validator rerolls inside each.
- No `Math.random()`. The draw's `rng` and the lifecycle's `rng` are not consumed. Determinism test: the same world seed and draw produce byte-identical items, and share 0 reproduces today's run exactly.

### Population

At the ruled share of 0.5 on today's catalogue (census, three seeds): ~52% of Storied/Mythic draws pass the two-core floor → **about 35 generated items per medium world per 150 ticks**; with the new knowledge core (§ Content) about 80% pass → **about 50–55**, less any `no_fit`. That replaces roughly 40% of the Storied and Mythic authored hand-outs and none of the Mundane ones (~240 per world stay authored). This is the ruling's own consequence, stated here so a veto can be made on the number: `GENERATED_REWARD_SHARE_BY_BAND` is the one constant to turn.

## Content pillar

### Encounter templates

N/A — no template changes. Recipes keep their categories, weights and tag filters; the rule reads them as they are.

### Attachment content — one new knowledge core (Lane decision)

The census shows the knowledge family is the largest Storied recipe family (115 of 408 draws) and has one core. Author **one new core** in `src/data/item-generator-cores.ts`, `origins: ['found']`, `bands: [2, 3]`, family `['#knowledge']`, forms `book`, `ledger` and `almanac` (the tome forms the table carries), reaches leaning Eye and Veil:

> **the book someone argued with** — a working copy, its margins full of a dead reader's quarrels with the text. *What it is:* knowledge that comes with an opinion attached.

Two or three signatures (`ITEM_GEN_MIN_SIGNATURES`), each changing *what it does*, not its dressing. Starting ideas — the executor finalises each against the validator and the read-back, exactly as THR-1570's cores were:

- (a) a situational Eye bonus where the margins help (the validator's *a `when…` bonus names a real situation* rule applies), with a Heart catch — the reader picks up the annotator's temper;
- (b) a near-miss shaper on Veil steps (the `test_shaper` builder), with a value-drift catch toward the dead reader's view;
- (c) optional: a small knowledge reveal with a chance of a lingering condition, only if the vocabulary row is `live`.

Provenance lines name a dead hero as the annotator (`uses: ['hero']`) and, where the world has none, a culture or a place (`uses: ['culture']` / `['place']`) so the core never needs a past to exist. Names: *X's Commentary*, *The Annotated Y*, *the Quarrelled Z* style grammars, offered only when the story backs them (the shipped name rule).

This core is the only new content; it passes the shipped gate test (every core fires, ≥ 2 signatures, zero validator problems, zero read-back failures, determinism) like every other core. **If it cannot pass, it is dropped** and knowledge recipes stay authored under the floor — the minting point ships without it (§ Kill criteria).

### Prose tables

N/A beyond the new core's own `looks`, `provenance` and `names` — register *game, not novel*, one concrete detail per line (the THR-1570 rule).

### Data tables

New constants only (§ Constants table), in `src/data/item-generator-tables.ts` beside the masterwork ones.

## UI pillar

*Screenshot tool: **Playwright** (DOM) — the aftermath card and the artifact sheet are DOM, not canvas.*

### Player-facing display

**No new component.** The reward reaches the player through the existing aftermath change *A reward changed hands* — `rewardSentence` names the instance and links it (`entityId: instantiation.instanceId`, `aftermathWords.ts:852-873`) — and the link opens `ArtifactSheet`, which already renders a generated item's *What it does*, *The catch*, Storied chip and provenance links, and hides *Made by* when there is no maker (Law 4). What changes for the player is the thing itself: its name, its look, the dead or the disaster it names.

**UI Laws engaged** (all already met by the shipped surfaces; the browser check confirms them for a `found` item): 1 (the category plate via `EntityVisual`), 4 (no *Made by* row for a found thing), 13/14 (magnitudes in words), 17, 21 (provenance links to a dead hero resolve; a missing one renders unlinked), 33, 37, 56 (the Storied chip is the real `has_trait` edge).

### Event notifications

None new. `item.generated` (origin `found`) already fires from the minter; the reward line already fires from the step.

### Debug inspection (DebugPanel)

- **New lever:** `window.__DEBUG.forceGeneratedRewards(on: boolean)` — while on, the share roll always passes (the fit and the two-core floor still apply), so a browser check does not wait on a coin. Implemented as a dev-only pin module, `src/engine/debugGeneratedRewardPin.ts`, on the precedent of `debugOutcomePin.ts` (`setOutcomePin`). Returns the new state.
- **Existing, extended:** `getGeneratedItems()` already lists every generated item; its rows carry `origin`, so `found` rewards show there.
- CLI: `generate items 30 --origin found --seed 42` (shipped) reviews the cores, including the new one.

### Visual presence (HexMapV2)

N/A — an item has no map presence.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `itemGenerator/rewardMinting.ts` (new) | inside `drawSeededReward` (step resolution today; aftermath `reward_draw` and fight trophies share it) | aftermath reward line → `ArtifactSheet` | graph only | `reward.generated` (below); `item.generated` via the minter | `forceGeneratedRewards`, `getGeneratedItems` |
| `rewardPool.ts` `drawSeededReward` (edited) | same | same | — | existing `content.query_*` unchanged | — |
| `itemGenerator/generateItem.ts` (edited — `requiredTags`) | same | — | — | — | `previewGeneratedItem` |
| `item-generator-cores.ts` (`coreTagReach`, one new core) | — | — | — | — | CLI `generate items` |
| `debugGeneratedRewardPin.ts` (new) | — | — | — | — | `forceGeneratedRewards` |

Prose pipeline: none — item text is composed at generation (shipped). Player controls: none — the player meets these things, they do not make them. Update `Docs/plans/wiring-checklist.md` with the new module and trace.

## Interface impact

| Contract | Action |
|---|---|
| `attachment-encounter-rewards` | **extend** — the draw path gains a second producer for the possession it hands over (the generator); the entry points and the write path for every unsubstituted draw are unchanged. Update the row's notes in `scripts/interface-contracts.ts` |
| `content-query-one-resolver-engine-and-gate` | **preserve** — pool assembly is untouched; the shared-path test needs no re-pin |
| `generated-item-honest-vocabulary` | **extend** — a new read site (`tryGeneratedReward` only ever mints a validator-passed item) |
| `attachment-effects-shape-resolution`, `attachment-domain-contributions` | **preserve** — readers unchanged; more producers of ordinary `effects[]` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ITEM_GEN_REWARD_ENABLED` | `true` | Master switch; `false` restores today's draws exactly |
| `GENERATED_REWARD_SHARE_BY_BAND` | `{ 1: 0, 2: 0.5, 3: 0.5, 4: 0 }` | The ruling (2026-09-26): share of eligible picks the generator stands in for |
| `ITEM_GEN_REWARD_MIN_FIT_CORES` | `2` | A recipe's tags must be carriable by at least this many `found` cores at the band, or the authored item stands (Lane decision) |
| `ITEM_GEN_REWARD_FIT_ATTEMPTS` | `4` | Generation attempts (`:f<k>`) to find an item carrying the recipe's tags before the authored item stands |
| `ITEM_GEN_REWARD_ID_PREFIX` | `'gen_found_'` | Id prefix for generated rewards (inside the registered `gen_`) |

## Tracing

```ts
// reward.generated — the share roll passed on an eligible pick; what happened next.
// Not emitted for ineligible picks or a failed roll (~70% of eligible picks), to keep the ring quiet.
interface RewardGeneratedTrace {
  category: 'reward.generated';
  tick: number;
  agentId: string;              // the recipient
  site: ContentQuerySite;
  drawnTemplateId: string;      // the pool's authored pick
  band: 2 | 3;
  requiredTags: string[];
  fitCores: number;             // found cores that can carry requiredTags at the band
  outcome: 'substituted' | 'too_few_cores' | 'no_fit' | 'generator_refused' | 'mint_failed';
  itemId: string | null;        // set when substituted
  attempts: number;             // fit attempts used
  summary: string;              // "Kael was handed The Annotated Ledger instead of Chronicle of the Falling"
}
```

Register it in the THR-928 trio, as THR-1570 did for `item.generated`: the interface in `src/types/traces/item-generator-traces.ts`, the category in `src/types/trace.ts` (union and `TRACE_CATEGORIES`). `item.generated` (shipped) follows on every substitution, carrying the seed key that reproduces the item.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Generator disabled, share 0 for the band, or the pick ineligible | Today's `instantiateReward`; no trace |
| Fewer than `ITEM_GEN_REWARD_MIN_FIT_CORES` cores can carry the tags | Authored item; `reward.generated` `too_few_cores` |
| No attempt carries the tags | Authored item; `no_fit` |
| Generator refuses (no eligible core, validator exhausted) | Authored item; `generator_refused` |
| `mintGeneratedItem` returns `null` (id collision, missing recipient) | Authored item; `mint_failed` — the minter already removes any half-written node |
| Anything in `tryGeneratedReward` throws | Caught inside it; `{ substituted: false }`; authored item; the tick continues |
| World has no past (a very young or test world) | Cores whose lines need a past are ineligible; cores with culture or place lines still dress it; if none fit, authored item |

## Three-pillar check

- [x] Engine — the minting point, the `requiredTags` input, the share roll, the floor, the trace
- [x] Content — one new knowledge core with two or three signatures, through the shipped gate
- [x] UI — no new component (stated with the read path that already carries it); one debug lever; browser check named
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. Serves *systemic over scripted* (rewards are dressed by this world's own dead, disasters and monsters) and *narrative over mechanical perfection* (a reward keeps its recipe's meaning — knowledge stays knowledge). The authored-versus-generated tension is settled by THR-1236 (authored cores, world dressing) and the floor keeps one core from becoming the face of a whole family.
- [x] No Vision edit owed.

## Rulebook impact

- [x] Changes a rule of play: what a reward can be. `Docs/canon/rulebook.md`, beside the THR-1570 line *A masterwork is made with an idea*, gains: **"Some rewards are found things.** About half of the Storied and Mythic rewards the world hands out are things found in it — dressed by its dead, its disasters and its monsters — chosen to fit what the work was about." `[IMPL — THR-1626, src/engine/itemGenerator/rewardMinting.ts, GENERATED_REWARD_SHARE_BY_BAND]`. The quick-reference card needs no line.
- [x] No UL change owed: *Rarity Band* and *Artifact Trait* (`Traits.md`) already say the generator mints Storied and up and Mundane stays in the hand catalog; this plan keeps both.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Share, floor, attempts, switch and id prefix are named constants; the share was ruled and now lands with its reader |
| 2. Inspectability | PASS | `reward.generated` says what the pool picked, what stood in and why not when it did not; `item.generated` carries the reproducing seed key; `drawnTemplateId` keeps the authored pick |
| 3. Determinism | PASS | Own hashed stream for the roll and the item; the draw `rng` is not consumed; share 0 reproduces today exactly (asserted) |
| 4. Fail-soft | PASS | Every failure leaves the authored item in place; the module catches its own throws |
| 5. Narrative over mechanical perfection | PASS | Found things name this world's past; the recipe's meaning is kept |
| 6. Additive over destructive | PASS | New module and optional fields; pool assembly, draw order and the authored path untouched |
| 7. Performance budget | PASS | ≈ 0.4 substitutions per tick at < 0.5 ms each (measured) against a 182 ms tick |

## Done when

- [ ] **Unit (rewardMinting):** an eligible tier-2 pick with the roll forced passes and mints a `gen_found_*` item carrying every required tag; a tier-1, tier-4, legendary, service, companion or bad-outcome pick is never substituted; a recipe with one fitting core is `too_few_cores`; a recipe no core can carry is `too_few_cores`; share 0 and `ITEM_GEN_REWARD_ENABLED = false` each leave the draw byte-identical to today.
- [ ] **Unit (generator):** `requiredTags` absent → identical items to today for the gate seeds (masterwork and found); `requiredTags: ['#gold']` → every returned item carries `#gold`; `coreTagReach` covers every tag the gate grid's items actually carry (no core produces a tag outside its reach).
- [ ] **Determinism:** the same seed, tick, recipient and pick produce the same item.
- [ ] **Census re-run** (`readers/reward-minting.ts`, extended to read `reward.generated`): seeds 42 / 99 / 7, medium, 150 ticks — report substitutions per world (expect ~45–60 with the new core), the outcome split, distinct cores used, and the most-repeated core's share; **zero** `generator_refused` and `mint_failed`.
- [ ] **The new knowledge core** passes the shipped gate test (≥ 2 signatures, fires, zero validator problems, zero read-back failures); `generate items 30 --origin found --seed 42` shows it with readable cards.
- [ ] **Browser-verify** (Playwright, 1920×1080, `?view=game&seeded&size=medium`): `await window.__DEBUG.forceGeneratedRewards(true)`, advance with `window.__DEBUG.tick(n)` until The First earns a Storied reward (or spawn a rewarding encounter with `&spawn=…&outcome=critical_success`), open the reward line's link — four-part evidence: screenshot of the aftermath line and the `ArtifactSheet` for the found item; console (empty is valid); a `getGeneratedItems()` assertion showing a row with `origin: 'found'`; UI-Laws line 1, 4, 13/14, 17, 21, 33, 37, 56.
- [ ] `rulebook.md`, `scripts/interface-contracts.ts` + interface map, `wiring-checklist.md`, the systemic wiring guide (a new minting point is a content-facing capability), `debug-bridge.d.ts`, and any wiki page whose `sources` match `rewardPool.ts` or `itemGenerator/` updated in the same PR.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy`, and the 30-tick CLI smoke pass.

## Kill criteria

- **The census re-run shows one core above a third of all generated rewards** → the floor is too low for this catalogue: raise `ITEM_GEN_REWARD_MIN_FIT_CORES` to 3 before merge, and report.
- **`no_fit` above a quarter of passed rolls** → the static tag reach over-promises; tighten `coreTagReach` (it should never list a tag the core cannot produce) before raising attempts.
- **The new knowledge core cannot pass the gate** → drop it; knowledge recipes stay authored under the floor; ship the rest.
- **Christian vetoes the share, the floor or the recipe rule** → each is one constant or one clause in `tryGeneratedReward`; revise on this ticket before build.
- **Christian reads found rewards and calls them flat** → the minting point stays; the cores are re-authored through the review path, as THR-1236 was judged.

## Coordination block

**Suggested model:** opus — an edit to the one reward draw path every reward runs through, a constrained-generation input on the generator, and one authored core that must pass a read-back gate; judgement-heavy in both engine and content.

**Parallel-safe with:** [THR-1687](https://linear.app/threadbare/issue/THR-1687) (the encounter shortlist — not the reward pool or the item generator); [THR-1572](https://linear.app/threadbare/issue/THR-1572) (the spell generator — its own module family; this plan does not edit `src/engine/spellGenerator/` or the power runtime).

**Mutex with:** none measured on 2026-10-02. Re-check at claim time for any In-Dev ticket editing `src/engine/rewardPool.ts` (`drawSeededReward`), `src/engine/itemGenerator/generateItem.ts` or `src/data/item-generator-cores.ts` — this plan's only edits to existing code.

**Files to touch:**
- Create: `src/engine/itemGenerator/rewardMinting.ts` + `__tests__/rewardMinting.test.ts`; `src/engine/debugGeneratedRewardPin.ts`
- Edit: `src/engine/rewardPool.ts` (`drawSeededReward` calls `tryGeneratedReward`; `SeededRewardDraw.generated`; `templateName`)
- Edit: `src/engine/itemGenerator/generateItem.ts`, `types.ts` (`requiredTags` — eligibility and steering)
- Edit: `src/data/item-generator-cores.ts` (`coreTagReach`; the new core), `src/data/item-generator-tables.ts` (constants)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (`forceGeneratedRewards`)
- Edit: the THR-928 trace trio for `reward.generated` — `src/types/traces/item-generator-traces.ts` (the interface), `src/types/trace.ts` (the category union and `TRACE_CATEGORIES`, beside `item.generated` at :585 / :877)
- Edit: `Docs/audits/2026-09-25-living-world-data/readers/reward-minting.ts` (read `reward.generated` for the re-run)
- Edit: `Docs/canon/rulebook.md`, `scripts/interface-contracts.ts`, `Docs/plans/wiring-checklist.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`

## Notes for the executor

- **The roll order of `drawSeededReward` is load-bearing** (its own comment says so). Call `tryGeneratedReward` after `drawFromPool` and the `traceRewardQuery` call, and never touch `rng` inside it.
- **`requiredTags` comes from the effective recipe** (`resolved.tagFilters` after the bad-outcome swap); bad-outcome draws never reach the call, so it is always the prize recipe's filter.
- **`coreTagReach` must not under-promise either** — the gate grid's items prove it is a superset of what each core produces; the fit check is the guard against over-promising.
- **The legacy encounter-progress reward block** (`orchestrator.ts:723-760`) runs its own draw and is not changed. If you find it live, leave it authored and say so in the completion comment; folding it onto `drawSeededReward` is a separate cleanup, not this ticket.
- **Out of scope, deliberately:** generated Legendaries; delve-loot and faction-gift minting points; generated Mundane rewards; generated items in shops; *What it does* for authored catalogue items; changing any recipe's tag filters to suit the generator.

> Brainstorm companion: `Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws-brainstorm.md`

## Intent-judge verdict

*2026-10-02, judged on fable, cold context; proposal at `Docs/plans/.intent-proposals/2026-10-02-thr-1626-found-items-in-reward-draws.md`.*

- **Run 1: Allow.** Ten of eleven dimensions PASS. Dimension 3 (wiring) was a GAP: the new `reward.generated` trace had no named registration site. **Fixed:** § Tracing and § Files to touch now name the THR-928 trio (`src/types/traces/item-generator-traces.ts`, `src/types/trace.ts`). The judge also noted that the effective volume (~40% of Storied and Mythic hand-outs) sits below the ruling's literal "half". § Population already discloses this.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-10-02 (auditors on sonnet, run after the intent-judge Allow)*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Share, floor, fit attempts, master switch and id prefix are all named constants. |
| 2. Inspectability | PASS | `reward.generated` records the pool's pick, the outcome and a skip reason. `item.generated` carries the reproducing seed key. `drawnTemplateId` keeps the authored pick. |
| 3. Determinism | PASS | Own hashed streams; the draw `rng` is not consumed. A test asserts that share 0 reproduces today's run. |
| 4. Fail-soft | PASS | Every failure leaves the authored item in place, and `tryGeneratedReward` catches its own throws. |
| 5. Narrative over mechanical | PASS | The generated item must carry the recipe's tags. Found items name this world's dead, disasters and monsters. |
| 6. Additive over destructive | PASS | New module, optional `generated` field and optional `requiredTags` input. Pool assembly and roll order are untouched. |
| 7. Performance budget | PASS-with-note | 0.5 ms per substitution, but the auditor found the cost of fit-attempt loops was not itemised. *(Resolved after the audit: § Census, Cost now gives the four-attempt worst case, ~0.86 ms, and the memoisation.)* |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems, graph (none new), tick phases, resolution, PRNG and a population estimate. |
| Content | present-and-substantive | One new core with signatures and a gate. Encounter templates are N/A with a reason. |
| UI | present-and-substantive | No new component, and the read path is named. The plan also names the screenshot tool, the Laws and the debug lever. HexMapV2 is N/A with a reason. |

Wiring and substrate checks pass, with no green-field duplication. PILLAR AUDIT: PASS-with-notes. The Blast Radius section was absent. *(Resolved after the audit: `src/types/trace.ts` has 121 importers, so § Blast Radius now covers the append-only edit.)*

### Vision audit

Premises touched: *narrative over mechanical perfection* is confirmed. *Systemic emergence vs authored moments* is extended. Prose-first UI is respected. No contradictions. North star is neutral to mildly positive, and the core loop is preserved. One design-tension note: the plan leans toward emergence, so watch for "the same beats twice in a run". The guard against that is the two-core floor plus the kill criterion on any core above a third of generated rewards, which the census re-run reports.

VISION AUDIT: PASS-with-notes
