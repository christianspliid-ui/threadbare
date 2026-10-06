> **Research audit for THR-1769** (wayfinder map THR-1758, project Dominion — Player Power Progression). Produced by a background research subagent on 2026-10-06; findings only, no design. The throwaway enumeration bundle and Monte Carlo script it cites (`catalog.ts`, `timeline.mjs`) live in the session scratchpad, not the repo; the formulas and constants named below are enough to reproduce.

# THR-1769 research — what the grant system hands out, when, at what price (facts only)

Ground truth: `main` @ `6030bcea`, 2026-10-06. Enumeration by a throwaway esbuild bundle of `src/data/unified-action-templates.ts` (scratchpad `catalog.ts` → `catalog.out`); pool-draw timing by Monte Carlo (`timeline.mjs`, 40k runs). Repo paths below are agent-facing.

## 1. Catalog by grant path

**Universe.** `UNIFIED_ACTION_TEMPLATES` holds 755 templates; **143** carry `actorAffinities` including `'ascendant'`. None has `actorAffinities: []` in that registry (the 23 pool-beat templates with `[]` live in `ASCENDANT_POOL_BEAT_TEMPLATES`, cost 0, and are indexed only by `getUnifiedTemplateById`). `STARTER_ACTION_IDS = []` and no template has `starter: true` (`src/engine/actionUnlock.ts`; test `unified-action-templates.test.ts:292`). The unlock gate (`getTargetActionSlots` step 8, `isActionRevealed`) checks only `starter` + `unlockedActionIds`; `trayTier: 'core'` / `'self'` does **not** bypass it. The two Core-tier verbs (Move, Investiture) are hardcoded on the AscendantBar, not templates.

**Granted set = 39 ids** (= every key of `ASCENDANT_ACTION_BUCKETS`; `collectGrantedActionIds()` ∪ the 8 signatures). **Orphans = 104.** Max cards a single run can hold today: spine 7 + pool 12 + secondary signature 1 + milestones 11 = **31**.

| Grant path | Cards (id · essenceCost · sphereAffinity · durationMode) | Count |
|---|---|---|
| **(a) Spine** (`ASCENDANT_SPINE`, 5 beats, turn-gated 0/2/4/6/8 + 1 player act or 36-tick idle fallback between gifts 1–4) | Beat 0 `bind_thread_agent` 10 · – · one-shot; `observe_agent` 5 · – · one-shot. Beat 1 `bind_thread_location` 15 (+ seeds the home seat). Beat 2 `action.imbue` 4 (+ seeds a threaded artifact). Beat 3 `divine.persuade` 2 · spirit. Beat 4 (**selection, 1 of 3**) `divine.dream` 1 · mind / `divine.omen` 2 · spirit / `divine.inspire` 2 · life **+ primary reach signature** (`grantsReachSignature: 'primary'`). | 6 static + 1 chosen of 3 + 1 signature = **8 per run** (the two unchosen god-paths are granted by nothing else → unreachable after the choice) |
| **(b) Cadence pool** (`ASCENDANT_BEAT_POOL`, 22 beats; grant-carrying ones below) | investment w4, eligibility `unthreaded_target` (always true → never retire): `the_worthy_mortal`→bind_thread_agent; `a_place_of_power`→bind_thread_location; `raw_relic`→imbue; `the_restless_soul`→observe_agent; `the_half_faithful`→bind_thread_agent; `claim_the_wild`→bind_thread_location (6 beats re-grant spine cards); `the_hallowed_place`→`action.consecrate` 4 · spirit · **sustained** + `action.consecrate-relic` 13 · spirit · sustained; `the_favored_soul`→`action.bestow` 5 + `action.teach_spell` 4; `the_chosen_banner`→`action.anoint` 6; `the_wellspring`→`loc.find_source` 3, `loc.claim_source` 5, `loc.consecrate_source` 5, `loc.sanctify_source` 3, `loc.defend_source` 4; `the_unveiled_eye` (no eligibility, identity eye/mind)→`action.secrets.reveal_secret` 10 · mind, `action.secrets.plant_secret` 14 · darkness. selection w1 (never retire): `first_true_gift` 1-of {bind agent, bind location, imbue}; `shape_of_devotion` 1-of {imbue, observe}. `reach_signature` w4 (eligibility `unacquired_reach_signature`)→**secondary** signature. | **12 new ids + secondary signature**; 6 investment + 2 selection beats only re-grant |
| **(c) Milestones** (`ASCENDANT_MILESTONE_BEATS`, enqueued by `phaseAscendantProgression` only when `spineCursor === -1 && !pending`) | `the_wellspring_flows` (3 controlled sources **or** 1 flowering)→`loc.open_markets` 3 · order, `loc.bless_harvest` 4 · life, `loc.blight` 4 · entropy, `loc.reveal_vein` 5 · matter, `loc.guide_caravan` 5 · order, `loc.sour_mine` 5 · entropy; `the_gathering_bonds` (2 living threaded mortals, `DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK = 2`)→`company.draw_together` 4 · spirit; `the_first_company`→`company.bless` 4 · spirit; `the_empty_road` (first disbanded bonded company)→`company.reunite` 4 · spirit + `company.sunder` 4 · entropy; `the_guttering_thread` (first Broken thread)→`divine.rekindle_thread` 6 · spirit. All one-shot. | **11** |
| **Reach signatures** (`REACH_SIGNATURE_CONTENT_TEMPLATES`, `reach-gated`, `requiresReach`) | all `essenceCost: 8` (`SIGNATURE_BASE_COST`, × `spherePowerMultiplier` floored at 1×), `trayTier: 'rare'`, `scale` regional except star cosmic / heart local: `invest.gold.patronage_network` (sustained, +0.15 order/tick), `invest.shadow.brokers_web` darkness, `invest.star.beacon_of_fate`, `invest.eye.deep_eye` mind, `invest.heart.sworn_oath` spirit (sustained, −0.15 spirit/tick), `invest.iron.warhost` force, `invest.veil.rend_the_gate` mind, `invest.stone.great_work` matter. | 8 authored, **2 reachable per run** (primary via Beat 4, secondary via the pool beat); the other 6 are hidden by the reach gate, not orphaned |
| **(d) Orphans** — no beat names them; floor empty → unreachable | by prefix: `hex.*` **49**, `divine.*` 15 (incl. all 5 `divine.perceive.*`, both `divine.relay.*`, all 4 `divine.self.*` — focus 5 / recede 0 / reveal 15 / stillness 0 — plus afflict_bless, coincidence, deceive, intimidate), `action.*` 14 (all 7 `action.faction.*`, anoint-champion 14, divine-edict 18, secrets.call_in_favor, social.embolden / tip_scales, both `action.undertaking.*`), `loc.*` 8, `artifact.*` 5, `sub.*` 4, `thread.*` 2, top-level 7 (`bind_thread_agent_strong` 25, `bind_thread_army` 15, `bind_thread_artifact` 25, `bind_thread_faction` 20, `dream_sending` 15, `scry_agent` 15, `whisper_insight` 5). 87 one-shot / 17 sustained; cost 0–25, mean 6.0, sum 629. | **104** |

Verified orphans the ticket named: `hex.tap_source` 4 · veil · sustained; `hex.claim_resource` 3 · gold · sustained; `hex.claim_dominion` 5 · star · sustained; `loc.place_of_power` 5 · stone · trayTier core; `loc.ward` 3 · order · core; `loc.fortify` 4 · force; `loc.sanctify_square` 5 · spirit — **all ORPHAN**. Other `trayTier: 'core'` orphans: `artifact.empower` 4, `artifact.enchant` 4, `hex.survey` 0, `sub.sanctify` 4 (sustained).

**Debug/review-only reach.** `window.__DEBUG.grantAction(id)` / `grantUnlock(id)` push any id into `unlockedActionIds` (`src/debug-bridge.d.ts:489, 2096`; `GameView.tsx:2561, 3049`, trace `via: 'debug'`); `__DEBUG.fireBeat` / `resolveBeat` force any spine/pool/delivery/deepening/milestone beat. `?testavatar` only balances the avatar's reach spread (`applyBalancedTestAvatar`) and grants no card; `?seeded` starts with `unlockedActionIds: []` (`gameInit.ts:398`). The Codex (`?view=codex`) shows all 143 with a three-state badge but grants nothing.

## 2. Beats that are not cards

- 6 **introduction** pool beats (`beat.pool.intro.*`, w3, eligibility `unintroduced_group` = a *count proxy*: all six stay eligible until #introduction records ≥ #culture+faction actors; each can be drawn repeatedly) — grant nothing.
- 8 **deepening** beats (`ASCENDANT_DEEPENING_BEATS`, one per reach, enqueued on a Domain Capability tier crossing) — grant nothing; no card is tier-gated.
- **84 delivery** beats (`ALL_DELIVERY_BEATS` = 84 of 89 `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, the 5 `drawable: false` sequels excluded), kind weight 2 × `DELIVERY_BEAT_WEIGHT` 0.1 = 0.2 each, dedup once delivered, withheld unless the encounter can bind The First at its location — deliver content, grant nothing. (The adapter's comment still says "~23 delivery beats ≈ 10% of draws"; at 84 they are 16.8 of 84.8 ≈ 20% of the first post-spine draw for a god with no identity bias.)
- 5 milestone beats and 5 spine beats are descriptors; the 23 pool-beat *templates* (`ascendant-pool-beat-templates.ts`) are prose shells: cost 0, `actorAffinities: []`.

## 3. Timeline today

**Draw model (code).** After Beat 4 the Director draws every `max(4, 9 ± 2)` ticks when nothing is pending; a pending beat blocks every later draw **and every milestone** until the player resolves it. Weight = `BEAT_KIND_WEIGHTS[kind] × beat.weight × bias`; bias = `(1 + 2 × domainAffinities[reach]) × {1.5 primary | 1.25 secondary | 1} sphere`. `domainAffinities` are stored **raw** (2–5, `src/engine/ascendant.ts:135`), although the bias comment assumes [0..1]. Only `the_unveiled_eye` (eye/mind) and the milestones carry `identity`. Assumptions in the tables: spine ends tick 40, draws at 40 + 9k, pending resolved instantly, all 84 delivery beats bindable, intro beats retire one per draw (ticket's assumption; the code's count-proxy pushes the figures ~5–8% later, e.g. the Wellspring mean 226 / p75 301).

**God identities.** "Shepherd" per the plan = hunger `gather` (`hunger-catalog.ts:30`): **heart 4 / stone 3 / star 2**, life/spirit (the plan's "Stone 3 / Heart 3" is not what the catalog carries; heart ranks first either way via `REACH_DOMAINS` tie-break). Showcase `DEV_ASCENDANT_IDENTITY` (`gameInit.ts:863`, Vara, hunger.witness): **eye 4 / veil 3 / shadow 2**, mind/spirit.

### Shepherd (unveiled_eye bias 1; first-draw mass 84.8: invest 12×4, intro 6×3, select 2×1, delivery 16.8)

| First draw of… | per-draw p (1st draw) | mean tick | p50 | p75 | p90 |
|---|---|---|---|---|---|
| any delivery vision | 19.8% | 84 | 76 | 103 | 139 |
| each of the 12 grant-carrying investment beats (incl. `the_wellspring`, `reach_signature` → Great Work) | 4.7% each | 210–213 | 166 | 274–283 | 418 |
| each introduction beat | 3.5% | ~269 | 211 | ~360 | ~550 |
| each selection beat | 1.2% | ~655 | 499 | 895 | ~1395 |

Arrival order is a tie among the 12 investment beats (random by seed); 12 of them sit at equal weight, so the Wellspring lands on average 19th draw (matches the THR-1745 plan's "about tick 170" median). Signatures: primary **Sworn Oath** at Beat 4 (~tick 32–40); secondary **Great Work** at the first `reach_signature` draw (mean 211). Star's Beacon is never granted, yet `hasUnacquiredReachSignature` loops *every* ranked reach, so the beat never retires and keeps drawing with an empty grant.

### Showcase god (unveiled_eye bias (1+2×4)×1.5 = 13.5 → weight 54; first-draw mass 134.8)

| First draw of… | per-draw p (1st draw) | mean | p50 | p75 | p90 |
|---|---|---|---|---|---|
| `the_unveiled_eye` → reveal/plant secret | **40%** | 62 | 58 | 67 | 85 |
| any delivery vision | 12.5% | 111 | 94 | 139 | 193 |
| each other investment beat (Wellspring, reach_signature → Rend the Gate, …) | 3.0% | 322–327 | 247 | 436–445 | ~675 |
| each introduction beat | 2.2% | ~419 | 310 | ~565 | ~890 |
| each selection beat | 0.7% | ~1080 | ~810 | ~1530 | ~2440 |

Because nothing retires, the unveiled-eye beat is re-offered on 40% of all later draws for this god, each time re-revealing held cards. Secondary = Rend the Gate; Broker's Web (shadow) is never granted and likewise keeps the signature beat alive.

### Milestones today
- `wellspring_flows`: needs `the_wellspring` first (above), then find 3 + claim 5 + consecrate 5 per source (×3 = 9 casts, 39 essence) or one source + 4× sanctify 3 (7 casts, 25 essence; sanctity +0.15/cast, flowering at 0.6). Cadence is player-dependent; the THR-1745 scripted player (one source step per 36 ticks) shows 3 sources at day 30 (≈ tick 360) and first flowering at day 60 — with the primary pool pinned at 0 from day 3 under today's upkeep.
- `gathering_bonds`: earliest ≈ tick 40 (bind #2 costs 10 primary from the starting 50; the beat waits for `spineCursor === -1` and an empty pending slot). Under today's upkeep the scripted player never affords it (Model 0: 1 thread all run); the Model B path binds day 5 → ≈ tick 60.
- `first_company`, `empty_road`, `guttering_thread`: world-dependent (company formation, disbanding, a Broken thread).

## 4. What THR-1747 changes (plan § Decided by delegation, § Engine pillar)

- **E1** `TIER_MAINTENANCE` 0/0.5/1/2/4 → **0/0.1/0.2/0.35/0.5** (primary sphere). Ledger: 1 thread at tier 4 nets +0.235/tick (today −3.27).
- **E2** `beat.pool.invest.the_wellspring` leaves the pool; new milestone `beat.milestone.the_wellspring` fires at **bond + 48 ticks** (`WELLSPRING_MILESTONE_TICKS_AFTER_BOND`, same value as `RIVAL_GRACE_TICKS_AFTER_BOND`), after the spine and with an empty pending slot; skipped with `all_grants_held` if the five ids are already held.
- **E3** investment beats retire once every granted id is held (`allGrantsHeld`, checked before the no-eligibility early return — so `the_unveiled_eye` retires after one draw too). Introduction, selection, delivery beats untouched; the 3-reach signature-beat non-retirement is untouched.
- **E4** `SOURCE_CONTROL_SUSTAIN` 0.15/source/tick charged from the primary sphere; unpaid → `upkeepCurrent: false` (stalls drift, never lapses).
- **E5** new milestone `beat.milestone.the_held_ground` at **2 flowering sources** grants `hex.tap_source`, `hex.claim_resource`, `hex.claim_dominion`, `loc.place_of_power` (orphans 104 → 100; `loc.place_of_power` still never pays because nothing makes a place of power).
- **E6** doc comment fix only. Pool mass after E2 for the Shepherd: 80.8 at the first draw, falling as each investment beat retires.

## 5. Essence available to spend — Shepherd, THR-1747 upkeep, 12 ticks/day

Formulas (code): aligned rate = 1.0 base + 1.0 seat (from tick 14) + 0.1 × threads (+0.3 per living Aspect, not modelled); split **35% primary / 25% secondary / 4% × 10 others** (`distributeByAlignment`, `influence.ts:83`; THR-1749 preset 3+2 keeps 35.2/24.8/4). Typed-source income lands **unsplit** in its own sphere (consecrated to the primary): 0.5 dormant, ×2 flowering, ×0.8^rank. Cap per sphere **50 + 5 × threads**; income above cap is discarded; pools start at **50** each (`INITIAL_ESSENCE_PER_SPHERE`). Thread tiers climb at 30 / 90 / 180 paid ticks (Devoted at 30, Champion 120, tier 4 at 300 ticks after binding).

**(a) One thread (The First, tick 0), seat from tick 14, no sources**

| Day (tick) | aligned gross cum. | primary 35% | secondary 25% | each other 4% | thread upkeep cum. (1747) | primary net | cap |
|---|---|---|---|---|---|---|---|
| 5 (60) | 1.1×14 + 2.1×46 = 112.0 | 39.2 | 28.0 | 4.5 | 30×0.1 + 30×0.2 = 9.0 | 30.2 | 55 |
| 10 (120) | 238.0 | 83.3 | 59.5 | 9.5 | 3 + 90×0.2 = 21.0 | 62.3 | 55 |
| 20 (240) | 490.0 | 171.5 | 122.5 | 19.6 | 21 + 120×0.35 = 63.0 | 108.5 | 55 |
| 45 (540) | 1120.0 | 392.0 | 280.0 | 44.8 | 84 + 240×0.5 = 204.0 | 188.0 | 55 |
| 90 (1080) | 2254.0 | 788.9 | 563.5 | 90.2 | 84 + 780×0.5 = 474.0 | 314.9 | 55 |

(Today's upkeep on the same thread: 45 / 105 / 345 / 1425 / 3585 — net negative from ~tick 60.)

**(b) Model-B-like path: threads bound ticks 0 / 60 / 150; Wellspring verbs at tick 48; source claimed + consecrated tick 84 (0.5/tick), flowering tick 230 (1.0/tick); source upkeep 0.15 from tick 84**

| Day (tick) | aligned gross cum. (rate 1.1→2.1@14→2.2@60→2.3@150) | primary 35% | + source | thread upkeep (3 threads) | source upkeep | primary net | secondary 25% | each other 4% | cap |
|---|---|---|---|---|---|---|---|---|---|
| 5 (60) | 112.0 | 39.2 | 0 | 9.0 | 0 | 30.2 | 28.0 | 4.5 | 55→60 |
| 10 (120) | 244.0 | 85.4 | 18.0 | 21 + 9 = 30.0 | 5.4 | 68.0 | 61.0 | 9.8 | 60 |
| 20 (240) | 517.0 | 181.0 | 83.0 | 63 + 42 + 15 = 120.0 | 23.4 | 120.6 | 129.3 | 20.7 | 65 |
| 45 (540) | 1207.0 | 422.5 | 383.0 | 204 + 174 + 129 = 507.0 | 68.4 | 230.1 | 301.8 | 48.3 | 65 |
| 90 (1080) | 2449.0 | 857.2 | 923.0 | 474 + 444 + 399 = 1317.0 | 149.4 | 313.8 | 612.3 | 98.0 | 65 |

Path spend from the primary pool by tick ~230: 2 binds 20 + find 3 + claim 5 + consecrate 5 + 4 sanctify 12 = **45**.

**Cumulative ≠ available.** With no spending a sphere sits at its cap (55–65) and every further tick's income is discarded; the most a player can ever put through a sphere over a window is **starting 50 + net income**, and only if it is spent as fast as it lands. Off-sphere pools refill at 0.04 × rate ≈ 0.09/tick → a one-shot budget of ~50 + 90 across a whole run.

## 6. Prior art (one line each)

- **THR-480 (per-account layer)** — no plan doc of its own under `Docs/plans`; the seam is recorded in `Docs/plans/2026-06-28-opening-and-action-availability.md:55-58`: "Two layers were designed; **only the within-run layer is built** (per the 2026-06-26 decision; per-account meta deferred to THR-480) … **Per-account (deferred)** — would widen the *pool* of what beats can grant, never grant on turn 1. Not built; clean seam left." and `2026-06-26-ascendant-beats-divine-cadence.md:249`: "a `bankedDiscoveries` list is *recorded in `BeatRecord`* but not surfaced or persisted". No "S/E/M/L/X", run-start picker or tiering text exists in `Docs/plans`.
- **THR-501 (empty floor)** — `src/engine/actionUnlock.ts:5-12`: "Turn-1 floor reduced to the two generic Core verbs (Move + Investiture), which are hardcoded on the AscendantBar Core tier … every other capability … is delivered as an earned story moment via Ascendant Beats (`unlock_action`), not surfaced on the opening screen."
- **Rulebook §4** — `Docs/canon/rulebook.md:138`: "You acquire them as story moments, not from a menu: your **primary** signature arrives at the culmination of the opening spine (Beat 4, "A Path Opens") … your **secondary** arrives later, when the living world next calls on your deeper domain".
- **action-catalog-design skill** — `.claude/skills/action-catalog-design/SKILL.md:49-98`: (1) Substrate Honesty — "Any entry marked NEW SUBSTRATE NEEDED becomes its own design ticket"; (2) Mortal-Loop Bridge — "When this verb fires, what encounter does it generate, on which portfolio mortal, sourced from which existing thread?"; (3) Surface-Shape Check — "this verb should live as [a global `UnifiedActionTemplate` / a per-scene god-verb inside an encounter template]".
- **Codex three-state grammar** — `src/components/Codex/codexRunState.ts:35-39`: `available: 'Yours'`, `acquirable: 'Within reach'`, `locked_incarnation: 'Another life'`; predicate keys on `requiresReach` and `unlockedActionIds` (`codexEntryRunState`, lines 90-106); `SIGNATURE_STATE_COPY` re-exported from `ascendant-bar-content`.
- **THR-613 plan §2 / §5.B** — `Docs/plans/2026-07-05-player-action-progression-v1.md:25`: "all surfaced through **one dispenser** (the shipped Ascendant Beat Director + `unlock_action` grant path). No new grant mechanism; no competing 'level-up' popup." §5.B (line 136, SUPERSEDED 2026-07-18): "The 'acquirable this run' middle state is **not** rendered in the live ActionDrawer — surfacing every unlock-gated in-reach card there floods the drawer under the empty THR-501 starter floor".

## 7. Open facts not obtainable from code

- Real player act cadence (the THR-1745 scripted player acts every 6 ticks; the spine gate counts casts, moves and Follows) and how long a pending beat modal stays unresolved — both stall every draw and every milestone.
- Number of culture + faction actors per world (sets when the intro class retires) and how many of the 84 delivery beats bind at The First's location (`locationSubtypes`); both move the pool mass.
- Whether the raw-scale identity bias (×13.5 for a 4-affinity reach) is intended; the code comment assumes affinity ∈ [0..1].
- World events behind `first_company`, `empty_road`, `guttering_thread`.
- Whether the hunger-catalog Shepherd (heart 4 / stone 3 / star 2) or the plan's "Stone 3 / Heart 3" is the reference god for later balance work.
