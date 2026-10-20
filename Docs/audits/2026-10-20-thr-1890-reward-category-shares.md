> **Measurement and decision audit for THR-1890** (project Encounter Experience; deferred from THR-1889, fair luck). Design lane run 2026-10-20c, unattended; decided by delegation (process.md rule 4) with a veto invited, as the ticket's Done-when asks. Census code and full per-recipe table on the never-merged branch `proto/thr-1890-category-first`: `src/engine/__tests__/thr1890-category-census.proto.test.ts`, `proto/thr-1890/category-census.tsv` (2,171 rows), `proto/thr-1890/category-census-summary.md`.

# THR-1890 — what a reward recipe's category shares should mean

Ground truth: `main` @ `76a38c7b`, 2026-10-20. Re-run on the proto branch:

```
CENSUS_OUT=./census npx vitest run src/engine/__tests__/thr1890-category-census.proto.test.ts
```

## Verdict in one paragraph

**Roll the rarity, then the kind of reward, then the thing.** The rarity roll stays exactly as [fair luck](https://linear.app/threadbare/issue/THR-1889) left it, so Legendaries, the hidden Legendary deadline and every tier rate Christian tuned on 2026-10-14 do not move. Inside the rolled rarity, the draw picks the *kind* (possession, condition, bestowed power…) by the recipe's own shares, among the kinds that have something at that rarity, and only then the item. How many items a kind holds then never changes how often it comes up (Game Design Law 2), and a recipe's shares become what the player gets wherever the content can honour them (Law 1). Today 25.8% of a multi-category prize draw lands off the recipe's shares; after the change 13.0% does, and that remainder is content shape, not the draw: a kind with nothing at the rolled rarity cannot be dealt there. Rolling the kind *before* the rarity, the ticket's first option, was measured and rejected because it lowers Legendaries even with the shares re-fitted.

## 1. Why today's shares do not mean what they say

`assembleRewardPoolDetailed` gives every candidate the weight `categoryWeight × tierCurve[tier]`; `drawTierFirst` rolls the tier, then picks by weight inside it. Two things move a kind's real share:

1. **Count inside a tier.** At a tier where a recipe has 9 possessions at share 0.2 and 1 condition at 0.8, the possessions win 1.8 : 0.8, so 69% of that tier's draws are possessions.
2. **Which tiers a kind lives at.** The tier is rolled before the kind. If a recipe's bestowed powers are all Mythic, a Mundane roll (55% of successes) can only pay a condition, whatever the share says. This is the larger effect: `encounter.dragons_challenge` has two of each kind, shares 0.7 bestowed / 0.3 condition, and pays 10 / 90.

## 2. The census

132 recipes with two or more weighted kinds (on seed 42; 174 distinct recipe objects across the registry, some with only one kind that has candidates). Seeds 42, 99 and 7, medium map, bearer = the first agent by id. Exact (analytic) mixes, not sampled. "Off" is the share of draws landing in a different kind than the recipe's shares, averaged over recipe × seed rows (441 per outcome).

| Success | Possession | Condition | Bestowed power | Off authored | Tier mix (Mundane / Storied / Mythic / Legendary) |
|---|---|---|---|---|---|
| Authored shares | 40.5% | 34.5% | 24.5% | — | — |
| **Today** | 56.2% | 35.3% | 8.1% | 25.8% | 52.2 / 36.2 / 10.0 / 1.6 |
| A. Kind first, shares as written | 40.5% | 34.5% | 24.5% | 0% | 45.6 / 38.9 / 13.9 / 1.7 |
| B. Kind first, shares re-fitted to today | 56.2% | 35.3% | 8.1% | (re-authored) | 50.3 / 38.7 / 9.9 / **1.0** |
| **D. Rarity, then kind, then thing** | 44.0% | 39.5% | 16.0% | 13.0% | 52.2 / 36.2 / 10.0 / 1.6 (unchanged by construction) |

| Critical success | Possession | Condition | Bestowed power | Off authored | Tier mix |
|---|---|---|---|---|---|
| Authored shares | 40.5% | 34.5% | 24.5% | — | — |
| **Today** | 61.5% | 29.2% | 8.9% | 25.4% | 22.6 / 47.1 / 25.9 / 4.5 |
| A. Kind first | 40.5% | 34.5% | 24.5% | 0% | 21.7 / 48.4 / 26.7 / **3.3** |
| B. Kind first, re-fitted | 61.5% | 29.2% | 8.9% | (re-authored) | 21.1 / 49.9 / 25.9 / **3.1** |
| **D. Rarity, then kind** | 47.2% | 35.6% | 16.8% | 11.8% | 22.6 / 47.1 / 25.9 / 4.5 |

(Blessing, 0.4%, omitted from the rows. The census's own "off" figure, 25.8%, is per recipe; the ticket's 18% was weighted by live draws. Both say the same thing.)

**Per recipe (seed 42, success; authored → today → D):** 300 of 396 recipe×outcome rows get closer to their shares, 63 are unchanged, 33 move slightly further (a tier where only some kinds are present renormalises among them). The largest moves:

| Recipe | Today off | D off | Mix (authored → today → D) |
|---|---|---|---|
| `encounter_route_ambush` | 48.7% | 3.0% | possession 50→77→51, condition 30→19→30, bestowed 20→4→19 |
| `social.challenge_duel` | 54.9% | 27.4% | possession 30→65→44, condition 30→32→42, bestowed 40→3→14 |
| `encounter.listen_for_rumors` | 60.0% | 48.8% | condition 75→15→26, possession 25→85→74 |
| `encounter.catalogue_the_tower` | 82.4% | 66.4% | condition 80→18→28, possession 20→82→72 |
| `encounter.mystical_vision_quest` | 71.6% | 71.6% | bestowed 80→8→8, condition 20→92→92 |
| `hod.quest.slay_abomination` | 55.1% | 55.1% | possession 43→98→98, bestowed 57→2→2 |

The unchanged worst rows are the content-shape remainder: their minority kind has nothing at the rarities the curve rolls most (the vision quest's two eligible bestowed powers sit above Mundane, so a Mundane roll, 55% of successes, can only pay a condition).

## 3. Why D, and not the ticket's two options

- **A (kind first, shares as written)** honours every share but moves the rarity mix Christian chose to keep on 2026-10-14 (success Mythic 10.0 → 13.9; critical Legendary 4.5 → 3.3). Legendaries are almost all possessions (seed 42, every candidate by tier: possessions 93 / 51 / 23 / **10**, conditions 39 / 16 / 7 / **0**, bestowed powers 7 / 8 / 4 / **1**). So a draw that rolls the kind first and lands on a kind with no Legendary in the recipe must fall back down. That lowers Legendaries.
- **B (kind first, shares re-fitted to today's mix)**, the THR-1889 "keep today's feel" move applied to kinds, still lowers Legendaries for the same reason (success 1.6 → 1.0, critical 4.5 → 3.1). It also re-authors 132 recipes to numbers like 0.92 / 0.08 that no author wrote.
- **C (call the shares relative weights and re-word Law 2)** keeps today's mix, but Law 1 names exactly this as a bug: *"If how many items exist … can move that rate, that is a bug, not tuning."*
- **D** keeps the rarity roll byte for byte and makes the kind roll honest inside it. Laws 1–3 all hold: the curve is the rate, the kind is rolled before the thing, and the rarest tier is untouched.

## 4. What changes in play

On a success with a multi-kind recipe, permanent **bestowed powers roughly double** (8% → 16% of those prizes) and **possessions fall** (56% → 44%). This is the authors' written intent coming true, not a new number: the recipes already ask for 24.5%. Rarity does not change at all. Two knock-ons:

- The item generator stands found things in for authored *possessions* only (THR-1626), so slightly fewer found things are dealt on these recipes. Its share per possession is unchanged.
- Single-kind recipes and the harm table are untouched: the harm table's three kinds (condition, curse, blessing) all read the same condition pool today, so the kind roll changes nothing there.

## 5. The build (one ticket)

- **Engine.** In `drawTierFirst`, after the tier cascade, group the tier's entries by kind (`PoolEntry` gains an optional `category`, set by `assembleRewardPoolDetailed`), pick the kind by its recipe weight among the kinds present, then the entry by weight inside the kind. Same single roll: re-scale the in-tier position once for the kind and again for the entry, so no stream draws an extra value (Law 8, NFP #3). An entry with no `category` (a hand-built pool) is its own group of one weight, so `drawTierFirst` stays correct for untagged pools. Master switch `REWARD_KIND_ROLL_ENABLED` (default on). The per-item weight becomes the tier weight alone; the kind's weight lives on the group.
- **Content.** None. No recipe is re-authored.
- **UI.** N/A — Law 7: the draw's internals are invisible, and no surface states a kind share.
- **Canon.** Law 2's *Known open instance* line becomes an established instance (the draw rolls tier, then kind, then thing), with the remainder named: a kind with nothing at the rolled rarity yields to the kinds that have one. Rulebook §4 *How rare a reward is gets rolled first* gains one sentence: *"Then it picks the kind of reward the scene offers, by the scene's own shares, and only then the thing."*
- **Done when.** A unit test: two kinds at one tier, 9 items against 1, shares 0.2 / 0.8, give 20% / 80% within 0.5 points over a dense roll sweep. The existing `rewardTierFirst.test.ts` tier-rate tests pass unchanged. The census, re-run, shows success off-authored ≤ 14% and the tier mix equal to today's to 0.1 points.
