---
status: current
---

> **title:** Fair luck — tier-first loot, a hidden Legendary deadline, a marble bag for the player's mortals — THR-1889
> **linear_issue:** THR-1889
> **author:** Claude Code
> **created:** 2026-10-14
> **three_pillars:** Engine done · Content done (re-tuned tier curves; no new templates) · UI N/A — every protection is invisible by law (Game Design Law 7); the forecast already shows the true odds

# Fair luck — tier-first loot, a hidden Legendary deadline, a marble bag — THR-1889

*The rarity numbers we set must be the rates players get, and the player's own mortals must not be ground down by luck no design intended.*

## Why this is load-bearing

Christian shared three videos from the candlesan channel (loot tables, the marble bag, four ways to control randomness) and asked what Threadbearer could learn. Checking them against the code found four concrete problems. The reward draw folded the tier curve into every item's weight, so the tier with the most items won: a success's Legendary was set at 5% and paid about 1.5% in live play. Every new common item quietly makes Legendaries rarer, and each encounter's filters make the real rate swing. Nothing stops a long Legendary drought. The First's dice are stateless, so long losing streaks are possible, and the forecast window (THR-1575: mortals engage at 50–65%) puts the First at the odds where streaks are worst. World-generation rarity seeding handed any shortfall in a distribution to Legendary. Christian's ruling, in chat 2026-10-14: *"fix and add the relevant game design principles to our relevant game design laws."* He approved the proposal as framed: keep today's loot feel but make it stable, a marble bag for the First's rolls, and predetermination for the Legendary drought. The principles became a new law book, [`Docs/game-design/laws.md`](../game-design/laws.md) § I.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Reward pool / seeded reward draw (`rewardPool.ts`, THR-1146 single draw path) | 🟢 ACTIVE | **extends**: `drawTierFirst` replaces the flat pick inside `drawSeededReward` and the legacy orchestrator route; the pool assembly is unchanged apart from carrying each entry's tier |
| Step resolution core (`stepResolutionCore.ts`, THR-1292) | 🟢 ACTIVE | **extends**: an optional `luckRoll` input; the determinism contract (draw count and order) is unchanged |
| Rarity seeding (`rarity.ts` `seedRarityTier`) | 🟢 ACTIVE | **extends**: scales by the distribution's own total |
| Threads (`thread` edges, `getThreadTo`) | 🟢 ACTIVE | **reads**: decides who is protected |
| Shared seeded sampler (`src/lib/drawTable.ts`) | 🟢 ACTIVE | **reuses**: the bag's order is a `drawFromTable` hand, its jitter and the deadline are `rollTableUnit` streams; no second sampler |

Runtime counts consumed: 200 authored reward recipes (every object carrying `categoryWeights` in the template corpus); 1 threaded mortal per seeded world (the First).

## Interface impact

| Contract | Disposition |
|---|---|
| `attachment-encounter-rewards` (Encounters → Attachments) | **preserve**: same entry points and write path; only the pick inside the pool changes, and pool entries carry their tier |
| `thread-luck-protection` (Progression → Encounters) | **add**: registered in `scripts/interface-contracts.ts` in this change. `luck.ts` reads the `thread` edge and writes `properties.luck`; the production readers are the three roll sites and `drawSeededReward` |

## Engine pillar

### Systems design

- **`drawTierFirst(pool, tierCurve, roll, forceTier?)`** in `rewardPool.ts`: roll the tier from the curve normalised by its own total, re-scale the roll's position inside the tier's band to `[0, 1)`, and pick the entry inside the tier by weight. An empty tier falls one tier down and climbs only when nothing below is eligible. One roll, no extra draw.
- **`src/engine/luck.ts`**: who is protected (a `thread` edge whose source is `state.ascendantId`), the marble bag (`drawLuckRoll`, `luckBagRoll`, `luckBagSlice`) and the Legendary deadline (`legendaryDeadline`, `isLegendaryDue`, `recordLegendaryWin`).
- **Roll sites**: `resolveUncontestedStep` (encounter steps), `rollOpponentSide` (fights; a threaded opponent), `resolveUndertakingCheckpoint`. Each deals `luckRoll` right before `resolveStepCore`, never in a forecast probe.
- **Reward sites**: `drawSeededReward` takes `playerAscendantId`; its three callers (step reward pool, `reward_draw` aftermath effect, fight trophy) pass `state.ascendantId`.

### Graph nodes / edges

No new node or edge type. One additive property on the protected mortal's node: `properties.luck = { bagDraws, winsSinceLegendary, legendaryCycle }`, all counts. It is written only for the player's threaded mortals.

### Tick phases

No new phase. Rolls happen where they already happened (encounter resolution, fight resolution, the undertaking checkpoint phase); the deadline is evaluated inside the reward draw.

### Resolution logic

- **Tier-first draw:** tier share = `curve[t] / Σ curve`. Inside a tier the pick is proportional to `weight`, which is `categoryWeight × curve[t]` and so proportional to the category weight, the same as the flat draw once the tier was fixed.
- **Marble bag:** draw `n` of mortal `a` comes from bag `⌊n / 10⌋`, slice `order[n mod 10]` where `order = drawFromTable('luck.bag', 10 equal slices, "<seed>:<a>:<bag>", 10)`. The roll is `slice × 10 + ⌊u × 10⌋ + 1` with `u = rollTableUnit('luck.bag.position', "<seed>:<a>:<n>")`.
- **Legendary deadline:** cycle `c`'s deadline is `30 + ⌊u × 21⌋` with `u = rollTableUnit('luck.legendary_deadline', "<seed>:<a>:<c>")`, which puts it in [30, 50]. A *win* is a prize draw (not a harm draw) whose curve gives Legendary weight above zero. The win that reaches the deadline forces tier 4 when the pool holds one; otherwise the next eligible win does. Any Legendary, earned or forced, starts the next cycle.

### PRNG callouts

- The bag never consumes a value from the shared stream. `resolveStepCore` still spends draw 1 and discards it when `luckRoll` is set, so the resist draw and every later consumer of that generator see the same values (`stepResolutionGolden.test.ts` stays green for every unprotected roller).
- `drawTierFirst` uses the same single `drawRoll` the flat draw used. The reward rng is local to each draw, so stream alignment is not at stake, but the count is unchanged anyway.
- New named streams: `luck.bag`, `luck.bag.position`, `luck.legendary_deadline`.

## Content pillar

### Data tables

The four outcome tier curves are re-tuned so the tier-first draw pays what players actually got from the flat draw in live play. This keeps today's feel and makes it stable. Christian chose that over the old curves' face values: at face value a success's Legendary would have gone from 1.5% to about 3.4%.

The fit is draw-weighted, not recipe-weighted. A first pass averaged the 200 recipes equally and overshot live play (Legendary ~2.0% against ~1.5%, Mythic ~10% against ~8%), because the recipes that fire most have the biggest, most Mundane-heavy pools. The re-run of the master-band invariant (`engagementWindow.invariant.test.ts`, seed 99 at 0.704 against a 0.70 ceiling) flagged the stronger item economy. So the curves were fitted on **5,356 live draws** (seeds 42/99/7, 600 ticks, the First bonded): every draw's pool was logged by tier, and the curve was solved so the new draw, cascade included, reproduces the old per-draw tier mix.

| Curve | Old authored | Old, as live play paid | New curve | New, as live play pays |
|---|---|---|---|---|
| Critical success (n=374) | 10 / 40 / 40 / 10 | 22.8 / 51.8 / 21.3 / 4.0 | 22.5 / 46.5 / 25.5 / 5.5 | 22.6 / 51.8 / 21.6 / 4.1 |
| Success (n=3,514) | 40 / 40 / 15 / 5 | 53.6 / 38.2 / 6.8 / 1.5 | 55 / 35 / 8 / 2 | 53.5 / 38.2 / 6.8 / 1.5 |
| Failure (n=1,257) | 57 / 29 / 14 / 0 (shares of 0.35) | 74.4 / 21.2 / 4.4 / 0 | 77 / 18.5 / 4.5 / 0 | 74.5 / 21.2 / 4.3 / 0 |
| Critical failure (n=152) | 33 / 33 / 33 / 0 (shares of 0.15) | 62.0 / 26.8 / 11.3 / 0 | 62 / 26 / 12 / 0 | 61.8 / 26.6 / 11.5 / 0 |

(Percent by tier, Mundane / Storied / Mythic / Legendary.) A curve value sits slightly above what live play pays, because a scene with nothing eligible at a tier hands out the tier below (Law 3). What changes is the swing between scenes: the per-draw spread of the Legendary chance falls from 5.4 to 2.4 points on a critical success and from 4.6 to 3.8 on a success.

Encounter templates, prose tables and attachment content: N/A. No authored content changes.

## UI pillar

UI: N/A — Game Design Law 7: no surface names the bag or the deadline. The forecast already shows the true odds, and the bag keeps the mortal's luck level with those odds (exactly, at steady odds, over every bag). Debug visibility comes through the two new traces.

## Measurements

- **Loot, static (200 recipes, the First as recipient, each recipe weighted equally):** Legendary on a success set at 5%, paid 2.6% per recipe on average; a critical success set at 10%, paid 4.0%. Category drift: on a success, 18% of prize draws on the 132 multi-category recipes land in a different category than authored (deferred, see below).
- **Loot, live (5,356 draws, draw-weighted):** see the curve table above; this is what the curves are fitted to. World-wide, all outcomes together, before and after: 56.6 / 34.8 / 7.3 / 1.3 and 56.6 / 34.8 / 7.4 / 1.2.
- **The First's rewards (600 ticks):** 18–46 prize draws per run (2–10 of them harm draws); 0–1 Legendary per run before the change.
- **The First's dice (dynamic, 300 ticks, seeds 42/99/7):** 46–97 step rolls per run at mean odds 0.74–0.83, success 73–84%, longest losing streak 2–3. Today the dev First is strong, so streaks are short. They lengthen as the forecast window (THR-1582) moves the First's odds toward 50–65%. Simulated at even odds over 30 rolls: 6+ losses in a row at least once is 19.0% with plain dice and 3.1% with a bag of 10, the worst streak drops from 20 to 10, and the success rate is unchanged (50.0%).
- **Legendary cadence:** see § Calibration of the deadline.

## Calibration of the deadline

The window [30, 50] wins is the "few dozen wins" Christian approved. At the success curve's 2% Legendary per win, the chance of a natural Legendary within 30 wins is 1 − 0.98³⁰ ≈ 45%, and within 50 wins ≈ 64%. So the deadline catches roughly the unluckiest third to half of cycles. For a protected mortal, a Legendary comes about once every 28 wins instead of once every 50, and critical successes bring it sooner. The First wins 16–42 prizes in a 600-tick run, so in practice a long run now almost always holds one Legendary for the First, where before it held one about half the time. That is the honest cost of a drought cap, and it applies only to the player's own mortals; the background world is unchanged. Both bounds are named constants (`LEGENDARY_DEADLINE_MIN_WINS`, `LEGENDARY_DEADLINE_MAX_WINS`). Widening them (say 50–80) keeps the cap but brings the rate closer to the plain one.

## Wiring

> Checked against `Docs/plans/wiring-checklist.md`: no new orchestrator phase, no UI component (Law 7), traces registered in the THR-928 trio, the interface contract registered, debug visibility through the trace viewer.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `luck.ts` (bag) | encounter / fight / undertaking resolution | none (Law 7) | `graph` node `properties.luck` | `luck.bag_roll` | trace viewer; `resolution.input.roll` |
| `luck.ts` (deadline) | reward draws (step, aftermath, fight trophy) | none (Law 7) | `graph` node `properties.luck` | `luck.legendary_cycle` | trace viewer |
| `rewardPool.ts` `drawTierFirst` | reward draws + legacy orchestrator route | reward line (unchanged) | none | `content.query_resolved` (unchanged) | existing reward traces |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `LUCK_BAG_ENABLED` | `true` | Master switch; `false` restores plain dice exactly |
| `LUCK_BAG_SLICES` | `10` | Slices of the d100 per bag |
| `LEGENDARY_DEADLINE_ENABLED` | `true` | Master switch for the hidden deadline |
| `LEGENDARY_DEADLINE_MIN_WINS` | `30` | Earliest win a Legendary can be forced on |
| `LEGENDARY_DEADLINE_MAX_WINS` | `50` | Latest win a Legendary is forced on |
| `TIER_CURVE_*` | see Content | Tier chance per outcome, each summing to 1 |

## Tracing

```ts
// luck.bag_roll — a protected mortal's d100 was dealt from its bag
interface LuckBagRollTrace { category: 'luck.bag_roll'; drawIndex: number; bag: number; roll: number }
// luck.legendary_cycle — a protected mortal received a Legendary (earned or forced)
interface LuckLegendaryCycleTrace { category: 'luck.legendary_cycle'; wins: number; deadline: number; forced: boolean; cycle: number }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Missing or malformed `properties.luck` | Reads as zero counts (a fresh start) |
| Protected mortal node missing at roll time | Plain dice for that roll |
| Reward pool empty | `null` draw, as before |
| Rolled tier empty | Falls one tier down; climbs only when nothing below |
| Curve with no positive weight | Lowest tier present |
| Deadline due but no Legendary eligible | Not forced; the next eligible win is |
| Distribution sums to 0 (world gen) | Tier 1 |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | ~125 importers | Additive only: two new members in the `TraceCategory` union, `TRACE_CATEGORIES` and `TraceEntry`; no existing shape changes |
| `src/engine/orchestrator.ts` | ~123 importers | One line inside the legacy reward route (`drawFromPool` → `drawTierFirst`) and its import; no exported API changes |

## Deferred

- **Category shares inside a tier** ([THR-1890](https://linear.app/threadbare/issue/THR-1890)): a recipe's condition-vs-possession split is still diluted by how many items each category holds. Honouring it changes the item economy, so it gets its own measurement and decision.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (re-tuned curves)
- [x] UI pillar N/A with rationale (Law 7)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The north star's "sometimes the world resolves against them" still holds: failures still happen at the forecast rate, and Law 6 keeps short bad runs. The rulebook's cool-failure rule ("failure is plot, not punishment") is untouched.
- [x] No Vision edit is needed. One premise is new and lives in the Game Design Laws rather than Vision/: fate is fairer to the player's own mortals than to the rest of the world (Law 4). It is recorded there as a law because it constrains code; if a later pass finds it is really a Vision premise, promoting it is that pass's scope.

## Rulebook impact

- [x] This plan changes a rule of play: how the player's mortals' dice and rewards behave.
- [x] `Docs/canon/rulebook.md` is updated in the same PR: § 4 gains **How rare a reward is gets rolled first** and § 7 gains **The player's own mortals have fair luck**, both `[IMPL]`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number is a named constant; both protections have master switches |
| 2. Inspectability | PASS | Two new traces; luck state is plain counts on the node |
| 3. Determinism | PASS | Seeded named streams; shared stream draw count unchanged; state re-derivable from seed + counts |
| 4. Fail-soft | PASS | See fail-soft table; nothing throws |
| 5. Narrative over mechanical perfection | PASS | Long droughts and losing streaks read as the game being broken, not as story; short runs stay |
| 6. Additive over destructive | PASS with note | New optional fields and inputs; `drawFromPool` kept for untiered pools. The curve values change, intentionally |
| 7. Performance budget | PASS | One 10-key `drawFromTable` per protected roll; negligible |

## Done when

- [x] A draw's tier lands at its outcome curve's share whatever the pool holds (`rewardTierFirst.test.ts`)
- [x] A protected mortal gets a Legendary no later than its cycle's deadline when one is eligible (test)
- [x] Over every full bag a protected mortal's rolls land once in each tenth of the d100 (so at steady odds they deliver the forecast exactly); the shared stream spends the same count of values (`luck.test.ts`)
- [x] Unprotected rollers unchanged (`stepResolutionGolden.test.ts` green)
- [ ] `npm run gate` green; closing commit body carries `Fixes THR-1889`
- [x] `Browser-verify exempt: no UI change (Law 7 — protections are invisible)`

## Notes for the executor

Shipped from the attended session at Christian's explicit ask ("fix"), so the executor and the author are the same session. Two traps, for whoever touches this next:

- **Never deal a luck roll in a forecast probe.** `drawLuckRoll` advances the bag. The probes in `unifiedActionResolution.ts` call `buildStepCoreInput` without it on purpose; `luckRoll` is spread in at the one live call only.
- **A test about flow must not lean on a seed's roll.** A hero threaded to the player's god now rolls from its bag, so a test that needed seed 42's incidental d100 breaks. Pin the band with `setOutcomePin` instead (impediment 1187).

## Coordination block

**Suggested model:** opus — the reward draw path and the step core's determinism contract.

**Files to touch:** `src/engine/rewardPool.ts`, `src/engine/luck.ts` (new), `src/data/luck-constants.ts` (new), `src/engine/stepResolutionCore.ts`, `src/engine/unifiedActionResolution.ts`, `src/engine/undertakingCheckpoints.ts`, `src/engine/fights/opposedRoll.ts`, `src/engine/fights/fightEnding.ts`, `src/engine/encounterAftermath.ts`, `src/engine/orchestrator.ts`, `src/engine/rarity.ts`, `src/types/trace.ts`, `src/types/traces/luck-traces.ts` (new), `scripts/interface-contracts.ts`, `public/system-interface-map-reference.html`, docs.

**Parallel-safe with:** THR-1875..1879 (UI carve-up) — no shared files.

**Mutex with:** THR-1582 (forecast window) — edits the inputs around `resolveStepCore`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14. Intent-judge (Step 8.5) was not run: the intent is Christian's own chat approval of this exact design (keep today's loot feel, a marble bag for the First, predetermination for the Legendary drought), recorded on THR-1889 as a satisfied human gate.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | The constants table names `LUCK_BAG_SLICES`, `LEGENDARY_DEADLINE_MIN_WINS` and `LEGENDARY_DEADLINE_MAX_WINS`. The `TIER_CURVE_*` values are named constants, and there are two master switches. The Legendary tier id `4` is a literal. |
| 2. Inspectability | PASS-with-note | Both traces are registered in `trace.ts`, and luck state is plain counts on the node. `luck.legendary_cycle` fires only when a Legendary lands. A due-but-unforced deadline, the cascade from an empty tier, and the pending deadline or `winsSinceLegendary` are not observable. `debug-bridge.ts` has no luck accessor, and the plan's debug column says only "trace viewer". |
| 3. Determinism | PASS | The bag and the deadline use named seeded streams re-derived from seed, agent id and counts. `resolveStepCore` still spends and discards its d100 draw, so the shared stream keeps the same count. Forecast probes never deal a luck roll. |
| 4. Fail-soft | PASS | The fail-soft table matches the code. `readLuckState` reads missing or malformed state as zero, an empty or all-zero pool or curve falls back, and `seedRarityTier` returns tier 1 for an all-zero distribution. |
| 5. Narrative over mechanical | PASS | The plan argues that droughts and long streaks read as a broken game, not as story. It keeps short bad runs (Law 6) and protects only the player's own mortals. |
| 6. Additive over destructive | PASS-with-note | `properties.luck`, the optional `luckRoll` and `drawFromPool` are additive. The tier curves are overwritten, the flat pick is replaced for every roller, and `seedRarityTier` output changes for existing seeds. The plan flags only the curve change. |
| 7. Performance budget | PASS | The plan claims one 10-key `drawFromTable` per protected roll and gives no timing. The protection check also runs for every roller. The cost is plausibly small. |

NFP AUDIT: PASS-with-notes (see rows above)

*Author response:* Inspectability — the counts and the pending deadline are readable on the node (`properties.luck` plus `legendaryDeadline(seed, id, cycle)`). A dedicated `__DEBUG` accessor is not added because this change has no UI pillar. Additive — `seedRarityTier` scales by a total that is already 1 within float error for every shipped distribution, so in practice no shipped seed changes. The replaced flat pick is the fix itself.

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Covers systems design, graph (one additive `properties.luck`), tick phases, resolution formulas, PRNG streams, constants, traces and fail-soft. |
| Content | present-and-substantive | Four re-tuned tier curves with old and new values and a measured basis; the plan states that no templates or prose change. |
| UI | N/A-with-rationale | The rationale is Game Design Law 7: the protections are invisible and the forecast already shows the true odds. Debug visibility is via traces. |

**Missing required sections:** No missing required sections. The Blast Radius section is conditional and absent. The plan edits `orchestrator.ts` and `rarity.ts`, but I did not verify whether either has ≥100 importers.

**Wiring check:** The Wiring table maps each module to a phase, UI component (none, with reason), GameState field, trace and debug surface. The plan states that traces are registered in the THR-928 trio. I read only the headings of `wiring-checklist.md`, because the file is 509KB and over the read limit, so I did not check the plan against its individual rules.

**Substrate-existence check:** The plan opens with a `## Substrate inventory` section that marks each subsystem as extends, reads or reuses. The inventory lists `rewardPool.ts`, `rarity.ts`, `stepResolutionCore.ts`, `fightEnding.ts`, `opposedRoll.ts` and `undertakingCheckpoints.ts`, and the plan's rows match those entries. Nothing in the plan duplicates an inventory subsystem. `luck.ts` is new, but no inventory domain covers luck, bag or deadline mechanics. `src/lib/drawTable.ts` is outside `src/engine/`, so the inventory does not list it.

**Overall:** PILLAR AUDIT: PASS-with-notes. The notes are the unverified Blast Radius and the partly checked Wiring.

*Author response:* Blast Radius added after this verdict (`types/trace.ts` ~125 importers, `orchestrator.ts` ~123, both additive or one-line). `rarity.ts` has ~50 importers.

### Vision audit

**Vision premises touched**
- `00-north-star.md` → "partially in the player's hands and partially not; pure randomness reads as slot machines" (line 29) — extended. The bag and the deadline reshape the dice, and short bad runs stay.
- `02-non-negotiables.md` #1 → "god bends odds, fate picks the band" — confirmed. Protection acts on fate's dice, not on mortal choice.
- `02-non-negotiables.md` #2 / `taste-profile.md` "Narrative over mechanical perfection" — extended, in tension (see notes).
- `03-design-tensions.md` #4 (legibility vs mystery) — extended. The mechanisms stay hidden while the forecast shows true odds.
- `taste-profile.md` prose-first, "Numbers in UI" anti-pattern — confirmed (Law 7, nothing player-visible).
- `01-core-loop.md` → not referenced.

**Vision contradictions**
No contradictions found.

Notes:
- `taste-profile.md` ~line 55 and `02-non-negotiables.md` #2 prefer story over mechanical smoothing. Plan line 169: streaks "read as the game being broken, not as story." This is a designer judgment that variance-smoothing beats a drought-as-plot reading. It is bounded by Law 6, which keeps short bad runs.
- Plan line 153 cites "failure is plot" and "the player's mortals matter" as Vision premises. Neither phrase appears in the six files. The nearest text is north-star line 29, "sometimes the world resolves against them."
- Only the player's threaded mortals get fair luck, while rivals and the background world roll plain dice. This is a new asymmetric-fate premise. The plan (line 154) says no Vision edit is needed, and the premise is recorded only in `Docs/game-design/laws.md`.

**Five qualitative checks**
1. North star: the witnessed-choice moment is intact. Odds equal the forecast and the world can still resolve against the player.
2. Core loop: encounter rolls, aftermath rewards and the scan are unchanged. The Legendary cadence is a mild emphasis shift only.
3. Non-negotiables: god/protagonist separation holds. No mortal is controlled, the thread edge decides who is protected, and the plan adds no relationship property.
4. Design tensions: pulls toward mystery over legibility. The forecast shows true odds, so there is no drift signal.
5. Taste profile: no strong opinion is violated. The deadline reads as a pity timer, but it is hidden, bounded and invisible.

VISION AUDIT: PASS-with-notes [design-brief-stale]

*Author response:* The Vision audit section now cites the north star's own line and the rulebook's cool-failure rule instead of paraphrased premises. It also names the asymmetric-fate premise and why it lives in the laws.
