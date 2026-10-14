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

Christian shared three videos from the candlesan channel (loot tables, the marble bag, four ways to control randomness) and asked what Threadbearer could learn. Checking them against the code found four concrete problems. The reward draw folded the tier curve into every item's weight, so the tier with the most items won: a success's Legendary was set at 5% and paid about 2.6%. Every new common item quietly makes Legendaries rarer, and each encounter's filters make the real rate swing. Nothing stops a long Legendary drought. The First's dice are stateless, so long losing streaks are possible, and the forecast window (THR-1575: mortals engage at 50–65%) puts the First at the odds where streaks are worst. World-generation rarity seeding handed any shortfall in a distribution to Legendary. Christian's ruling, in chat 2026-10-14: *"fix and add the relevant game design principles to our relevant game design laws."* He approved the proposal as framed: keep today's loot feel but make it stable, a marble bag for the First's rolls, and predetermination for the Legendary drought. The principles became a new law book, [`Docs/game-design/laws.md`](../game-design/laws.md) § I.

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

The four outcome tier curves are re-tuned so the tier-first draw pays what players actually got from the flat draw, averaged over all 200 recipes (seeds 42/99/7, identical to one decimal across seeds). This keeps today's feel and makes it stable. Christian chose that over the old curves' face values, which would have roughly doubled Legendaries.

| Curve | Old authored | Old as experienced | New (= rate now) |
|---|---|---|---|
| Critical success | 10 / 40 / 40 / 10 | 20.0 / 48.0 / 28.0 / 4.0 | 20 / 48 / 28 / 4 |
| Success | 40 / 40 / 15 / 5 | 45.1 / 40.1 / 12.2 / 2.6 | 45 / 40 / 12 / 3 |
| Failure | 57 / 29 / 14 / 0 (as shares of 0.35) | 56.7 / 30.1 / 13.2 / 0 | 57 / 30 / 13 / 0 |
| Critical failure | 33 / 33 / 33 / 0 (as shares of 0.15) | 41.4 / 35.1 / 23.5 / 0 | 41 / 35 / 24 / 0 |

(Percent by tier, Mundane / Storied / Mythic / Legendary.)

Encounter templates, prose tables and attachment content: N/A. No authored content changes.

## UI pillar

UI: N/A — Game Design Law 7: no surface names the bag or the deadline. The forecast already shows the true odds, and the bag delivers exactly those odds over every bag. Debug visibility comes through the two new traces.

## Measurements

- **Loot (static, 200 recipes, the First as recipient):** see the curve table above. Category drift: on a success, 18% of prize draws on the 132 multi-category recipes land in a different category than authored (deferred, see below).
- **The First's dice (dynamic, 300 ticks, seeds 42/99/7):** 46–97 step rolls per run at mean odds 0.74–0.83, success 73–84%, longest losing streak 2–3. Today the dev First is strong, so streaks are short. They lengthen as the forecast window (THR-1582) moves the First's odds toward 50–65%. Simulated at even odds over 30 rolls: 6+ losses in a row at least once is 19.0% with plain dice and 3.1% with a bag of 10, the worst streak drops from 20 to 10, and the success rate is unchanged (50.0%).
- **Legendary cadence:** see § Calibration of the deadline.

## Calibration of the deadline

The window [30, 50] wins is the "few dozen wins" Christian approved. At the new success curve (3% Legendary per win), the chance of a natural Legendary within 30 wins is 1 − 0.97³⁰ ≈ 60%, and within 50 wins ≈ 78%. So the deadline catches roughly the unluckiest quarter to two-fifths of cycles. The protected mortal's long-run Legendary rate rises from 1 in about 33 wins to about 1 in 24. That is the honest cost of a drought cap, and it applies only to the player's own mortals. Both bounds are named constants (`LEGENDARY_DEADLINE_MIN_WINS`, `LEGENDARY_DEADLINE_MAX_WINS`).

## Wiring

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

## Deferred

- **Category shares inside a tier** ([THR-1890](https://linear.app/threadbare/issue/THR-1890)): a recipe's condition-vs-possession split is still diluted by how many items each category holds. Honouring it changes the item economy, so it gets its own measurement and decision.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (re-tuned curves)
- [x] UI pillar N/A with rationale (Law 7)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It strengthens "the player's mortals matter" without making them invulnerable (Law 6 keeps short bad runs).

## Rulebook impact

- [x] Changes a rule of play (how the player's mortals' luck behaves). `Docs/canon/rulebook.md` § 7 gains a short "Luck" note in the same PR.

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
- [x] Over every full bag a protected mortal's rolls deliver the forecast odds exactly; the shared stream spends the same count of values (`luck.test.ts`)
- [x] Unprotected rollers unchanged (`stepResolutionGolden.test.ts` green)
- [ ] `npm run gate` green; closing commit body carries `Fixes THR-1889`
- [x] `Browser-verify exempt: no UI change (Law 7 — protections are invisible)`

## Coordination block

**Suggested model:** opus — the reward draw path and the step core's determinism contract.

**Parallel-safe with:** THR-1875..1879 (UI carve-up) — no shared files.

**Mutex with:** THR-1581 / THR-1582 (dice re-fit, forecast window) — both edit the inputs around `resolveStepCore`.
