# Action proposal — The god's stake in the economy (THR-1935)

## intent_quote

> "the purpose of the economical model is to provide substrate for the world, and drive a lot of the fundamental interaction and behavior of the in game living agents (factions, cities, agents)." — Christian, chat 2026-10-14 (the Mortal economy map's destination, THR-1863)

> "Keep all three calls as decided. The plan docs can go ahead." — Christian on THR-1863, 2026-10-15 08:29Z. One of the three calls was THR-1871: the god's stake is its worshippers, not coin. The human gate is recorded on THR-1935 as "Christian kept the THR-1871 call as decided … The veto window is closed for this call."

The ticket (THR-1935, filed by the design lane when it closed the map): "Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used. The divine economy is the closed Dominion map: read it, never redesign it." Order: "after hunger and unrest — a town prays when it is Restless or worse from hunger." Draws on THR-1871 (the model) and THR-1870 (economy receipts; no new Needs-you entry). "*Fortune's Favour* and *Ruin* move a mortal's Means band, which the mortal-wealth plan doc introduces; say what the cards do if that lands later." THR-1871's record also says: "These are starting values. The plan doc measures them in the full-window model (`npm run model:power`)", and "Would change the call: … congregations past about 10% of day-90 income."

## scope (what this plan does)

Specifies THR-1871 and THR-1870 § 5/§ 7 as three build slices.
- **S1:**
  - A daily `prayer` phase opens a prayer, as an `event` node `occurred_at` the town, when a settlement is Restless with hunger as its largest unrest input and is Touched or better on the player god's Dominion; once per 30 days.
  - A successful cast of a card flagged `answers_prayer` (Bless the Harvest, Open the Markets) answers it: `participated_in` god → prayer, and a one-shot Dominion push of 2 split by bought points. The same cast on a hungry town off the god's ground gives unbidden aid (push 1, no faith).
  - A town whose Restless chip releases within 30 days of the answer becomes a `faithfulCommunity` essence source (base 0.3, existing kind, first writer). Its sanctity reads the town's staples whatever its sphere, it lapses at 0 (warned at 0.2), Sanctify cannot touch it, and a god holds at most 4.
  - An unanswered prayer puts the town first on the rival's next raid or scheme target pick, inside the existing throttle.
  - The `starve-faithful` crack drains a faithful town's sanctity by 0.25.
  - Chronicle lines, a place-page line and a Covenants line; a Needs-you producer and a Trouble-lens mark added by whichever of S1 and their hosts lands second; debug accessors; a `faith` economy in `model:power`.
- **S2:** the `economy` receipt kind from an extended cast snapshot (prosperity tier, unrest band, staple tiers, lanes, Means band). A crossed band opens the dialog; a change inside a band rides the toast. Guide the Caravan's card/step Reach mismatch fixed.
- **S3:** Fortune's Favour and Ruin (±1 Means band via mortal wealth's `economy_shift`) and Bless the Holding (a `blessed` edge; ×1.5 on the holder's tax or holding income for 30 days), all tier-2 market rows. Claim Resource pays in the claimed good's sphere × stock tier. Open the Markets' thieves' guild is a board boost on `create × faction` for a Shadow-led resident of a town held at prosperity 75 (the undertakings plan makes that founder's guild `thieves`).

## scope (what this plan does NOT do — explicit non-goals)

- No tithe, no fear currency, no prayers from every hungry town, and no faith formed on the cast (all rejected in THR-1871).
- Does not move the six Wellspring economic gifts or reopen THR-1794's card tiers.
- No new lane verb or edge target kind; no new monopoly verb (THR-1871).
- No new node or edge types (`event`, `occurred_at`, `participated_in`, `controls`, `blessed` exist).
- No interrupt or popup for a prayer, and no second Needs-you entry for a town on the edge (THR-1870 § 7).
- Prayers to rival gods are not modelled; the rival answers only through the raid list.
- Does not build Needs you or the Trouble lens (THR-1875 / THR-1878 own them); does not define the `economy` kind's shape (mortal wealth owns it); does not add `migrationPullUntilTick`'s reader (hunger and unrest owns it).
- Does not build anything now: S1 waits for hunger and unrest S1.

## impact_class

Reversible — `PRAYER_ENABLED`, `ECONOMY_RECEIPTS_ENABLED` and `CLAIM_RESOURCE_PAYS_GOOD` switch each part off; the cards are data rows.

## evidence cited

- **Linear issue:** THR-1935 (decision sources THR-1871, THR-1870; map THR-1863; Dominion map THR-1758)
- **Vision premises invoked:** the god works through the world, not on it; mechanics surface through prose, never numbers; the world does not wait for the god
- **UL terms touched:** Congregation (kept for the Temple faction; the plan uses "Faithful" instead, choice 8), Dominion Band, Means (existing); Prayer and Faithful (new, UL proposal filed in S1)
- **Canon pages consulted:** `Docs/canon/rulebook.md` (:198 worshippers; :393 rival schemes; :598 congregation), `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/Agents.md`, `Cosmology.md` (Dominion), `Docs/game-design/laws.md`
- **Prior plan docs this builds on:** `2026-10-16-thr-1934-hunger-and-unrest.md`, `2026-10-15-thr-1936-mortal-wealth.md`, `2026-10-17-thr-1937-undertakings-in-the-economy.md`, `2026-10-14-thr-1875-screen-frame.md`, `2026-10-14-thr-1878-map-lenses-and-chrome.md`, `2026-10-14-thr-1923-settlement-economy.md`, `2026-10-15-thr-1931-faction-purse.md`; decision record `Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md`
- **Measurement:** `scripts/power-progression-model.mjs --model dominion` with a faith overlay (scratchpad), at `94840db5`: day-90 income +0.18 to +0.68 for 1–6 faithful towns (1.4–5.3%); the richest god is 13.38 at 4 and 13.52 at 6, OUT of 10.5 ≤ income ≤ 13.5 → cap 4. Flowering variant OUT at 4 → no Sanctify on faith.
- **Rejected approaches considered and dismissed:** prayer as a property bag with a god id; a new `prays_to` edge; recovery at raw unrest 30; scaling income by sanctity; letting faith flower; 7.5-day durations; run-time inference of answering cards; a property for Bless the Holding (brainstorm companion).

## load-bearing decisions touched

- Everything is a graph node/edge — the prayer is an `event` node; answers and faith are edges.
- Relationships are graph edges, not property fields — no god id on the town; `lastPrayerTick` / `prayerSlightedUntilTick` are the town's own clocks.
- No inventing node types — none.
- Sublocation tier — settlements via `getLocationNodes`; a cast on a sublocation resolves to its parent through `parentLocationId`.
- World graph mutated in place — no identity-keyed caches.
- Engine caches per session — none added.

## high-impact files touched (from Codesight)

- `src/engine/orchestrator.ts`, `src/engine/unifiedActionResolution.ts`, `src/types/unifiedAction.ts` (wide) — additive hooks, a flag value and an optional field. Blast Radius section present.

## kill criteria

- S1: no prayer opens in 1,080 ticks on seeds 42/99/7 → the gate is too narrow; post the census and stop.
- S1: more than 12 prayers per seed in 90 days → raise `PRAYER_MIN_BAND` to held.
- S1: `model:power --model faith --check` puts a god outside the trip-wire with 4 faithful towns → cap 3.
- S2: more than half of player casts open the receipt dialog → the crossed-band rule is too eager.

## explicit user sign-off

Not required (Reversible). THR-1871's human gate is recorded (2026-10-15).

## author notes for the judge

- This is an unattended design-lane run. Where design-session says "surface to the user", the lane decides how-level choices and invites a veto in its report.
- How-level choices made here (not in THR-1871/1870): the three slices; the prayer as an event node; recovery as the chip's release; faith starting at 0.5 and lapsing at 0; no Sanctify on faith; the cap of 4; 30-day durations worded "a year"; "Faithful" instead of "congregation"; answering as a card flag with a two-way test; Bless the Holding on the `blessed` edge; unbidden aid sets the cooldown; the thieves' guild as a board boost.
- Measured findings the decision's record missed:
  - (a) A source's sanctity reaches its income only through the flowering tier, so "faith rides the bread" needs a lapse to mean anything.
  - (b) The game's season is 7.5 days and its year 30 days, so the decision's "once a season (30 days)" is a year.
  - (c) "Congregation" is already a UL term for the Temple faction.
  - (d) The thieves' guild delay constant is 8 **ticks**; the decision said "8 days".
  - (e) The decision cited `rival-schemes/economic.ts:71` and `location-action-constants.ts:52-58`; the lines are now `:65-66` and `:51-58`.
- THR-1871's "would change the call — the plan doc finding that prayers do not reach Needs you without a new surface" was checked. Needs you is planned (THR-1875 § F5, `NEEDS_YOU_PRODUCERS`) but not built; the prayer adds one producer there, and before the frame lands it rides the alert channel, the chronicle and the place page. No new surface is invented, so the call stands.
