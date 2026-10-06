# Action Proposal — Divine economy shared prerequisites (THR-1747)

## intent_quote

Christian, chat 2026-10-05, asking for the power-progression analysis (recorded in `Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` § Why this is load-bearing): he wants "the late game to feel like a god grown in power: more unlocks, more income, more threaded mortals, places and items", and asked for "the holes in the current design that stop power from scaling".

Christian's ruling, chat 2026-10-05 (recorded on THR-1745 and in the same doc § Director's ruling):

> *Dominion* designates the world objects that have the same dominating sphere affinities as your god. Objects with the same dominion let the god influence them through actions, cheaper and more powerfully, so that is your home turf, which you want to expand strategically and tactically. You build threads to help you spread dominion through secondary actors — agents, factions, artifacts, armies, locations. You can use powers to help these become more effective at what they do, as they fight the opposing dominion. Spending on a certain sphere will indirectly, through smart spending, build infrastructure (threads, actions, …) that should have a positive pay-off.

The ticket itself (THR-1747, filed in that session): "Balance and wiring, not direction — the five fixes every power-progression model needs … Plan doc owed before Ready for Dev (design lane)." Its five items: thread upkeep 0.1/0.2/0.35/0.5; the Wellspring as a milestone at bond + 48 with investment beats retiring once their grants are held; `SOURCE_CONTROL_SUSTAIN` charged fail-soft; the four orphaned income cards granted from a milestone, never a held card; timing comments.

## scope (what this plan does)

Specifies the five fixes for an executor: retunes `TIER_MAINTENANCE`; moves the Wellspring's five source verbs from a cadence pool beat to a milestone at bond + 48 ticks; makes investment beats ineligible once every card they grant is held; charges source upkeep from the primary sphere in `phaseEssenceSources` with an unpaid source stalling (no upward drift) rather than lapsing, and corrects the income readout to match; grants `hex.tap_source`, `hex.claim_resource`, `hex.claim_dominion`, `loc.place_of_power` from a new milestone at two flowering sources; corrects one wrong phrase in the doom-length comment. Sources join the Covenants list with a plain-words upkeep line. Two milestone presentations and chronicle lines are authored in the plan.

## scope (what this plan does NOT do — explicit non-goals)

- No Dominion read, band, or band-scaled consumer (that is THR-1748).
- No point-buy, no re-keyed income split (THR-1749).
- No per-tier thread yield, shrines, relic sources, per-Area latent sources or sphere-score writers (THR-1745 Models A/B/C — the Dominion core decides which survive).
- No change to card costs, cast odds, outcome ladder or the nudge hand.
- Does not make `loc.place_of_power` pay income — measured that nothing writes `isPlaceOfPower`; filed THR-1751.
- Does not rename `hex.claim_dominion` (THR-1746 owns the word).
- Does not change `TIER_PROMOTION_THRESHOLDS` comments — measured as correct on the season calendar.
- No new UI surface; no HexMapV2 change.

## impact_class

Reversible — constants, two milestone entries, one pool entry removed (template kept for old saves), an optional property, a UI row. Every change reverts with a code revert; no save migration.

## evidence cited

- **Linear issue:** THR-1747 (parent analysis THR-1745; blocks THR-1748; follow-up THR-1751)
- **Vision premises invoked:** "attention is a spend, not a browse" (THR-1745 Model A thesis); the Dominion ruling above; `game-design-direction` story-over-spreadsheet
- **UL terms touched:** none new. Deliberately avoids "dominion" in new player text pending THR-1746.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §4 (How your power grows, Breadth bullet) and §6; `Docs/canon/interface-map.md` § Unaudited subsystems; `Docs/ops/player-complaint-classes.md`; `Docs/canon/rulebook-quick-reference.md`; `Docs/ubiquitous-language/README.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md`; THR-613 (milestone beats), THR-611 (source loop), THR-647 (never re-offer a held card), THR-1652 (thread upkeep in its own phase; readout must equal ledger)
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's Rejected Approaches is touched. Plan-local alternatives are in the brainstorm companion.

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — respected: control of a source stays the `controls` edge; `upkeepCurrent` is per-tick status on the existing `essenceSource` property bag, not a relationship.
- "No inventing node types" — none invented.
- "The world graph is mutated in place" — the upkeep writer mutates the bag in place as `recomputeControlledSourceTiers` already does; no change detection keyed on graph identity.

## high-impact files touched (from Codesight)

`src/types/influence.ts` (128 importers) is not edited but re-exports `TIER_MAINTENANCE`, whose value changes. Blast Radius section present. Every edited file has 1–19 importers.

## kill criteria

- If the ledger test's Arm C (two tier-4 threads, no ground) does **not** go unpaid, the upkeep is too soft: ground stops mattering, which undercuts the Dominion loop — retune upward before shipping.
- If a cold playtest round after ship still reports the god's own sphere empty, or a tester cannot say what a source costs to keep, the readout or the copy failed — reopen with the playtest log.
- If the Wellspring misses tick 60 after the bond on two of the three measured seeds, the spine/pending gate is starving it: give it priority over the cadence draw or lower the constant before shipping.
- If the Wellspring at bond + 48 lands inside the THR-1608 "too much at once" window in live play (several modals stacked in the first minutes), move `WELLSPRING_MILESTONE_TICKS_AFTER_BOND` later; it is one constant.

## explicit user sign-off

Not required (Reversible). The five items are Christian's filing under his 2026-10-05 ruling; the calls inside them are made under the 2026-09-11 delegation with a veto invited in the design lane's report.

## author notes for the judge

- Two measured findings changed the ticket: (1) `loc.place_of_power` has no income path at all (no writer of `isPlaceOfPower`), so "grant the income card" grants a card whose income never arrives — I grant it as filed and split the fix to THR-1751 rather than pick one of three meanings unattended; (2) H10's premise is half wrong — 1,080 ticks is three years on the season calendar (90 ticks/season), and the promotion comments are right. Only one phrase changes.
- The ticket placed the orphans "from the existing source milestone or a new flowering-count milestone"; I chose a new milestone at two flowering sources to avoid a ten-card modal. This is the call most open to veto.
- Arm C is deliberately a negative test: it pins that ground is needed for a deep retinue.
- Unattended run: no human present; vetoes reach Christian via the lane report.
