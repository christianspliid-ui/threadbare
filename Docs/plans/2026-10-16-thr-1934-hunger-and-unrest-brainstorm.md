# Brainstorm companion — hunger and unrest (THR-1934)

Companion to [`2026-10-16-thr-1934-hunger-and-unrest.md`](2026-10-16-thr-1934-hunger-and-unrest.md). The game-level calls were made in [the hunger-and-unrest decision](https://linear.app/threadbare/issue/THR-1869) and [the economy-visibility decision](https://linear.app/threadbare/issue/THR-1870) (design lane, 2026-10-14; veto days closed 2026-10-15T22:29Z with no veto). This file records the how-level choices the plan made, the options not taken, and the Vision premises they rest on.

## Vision premises in play

- **Anomalies are the content; equilibrium is silence.** The decision's census found Restless in 7–12 towns per seed and On the edge in 0–2. The plan keeps that rarity: nothing lights, chimes or chronicles for a calm town, and the Fortunes row says one plain sentence for it.
- **Factions act whether or not the god watches** (Law 13). Defection and rising run for every town, attention-blind; only the *interrupt* is gated on the god's attention.
- **All mechanics surface through prose, never numbers** (Vision non-negotiable 3). Unrest stays a hidden number; the player reads band words and the cause in words.
- **The god tilts, never commands.** No new card here. The god's way into a hungry town is the existing economy verbs (Bless the Harvest, Open the Markets, Incite Unrest) and, later, [the god's stake](https://linear.app/threadbare/issue/THR-1935)'s prayer.

## Choices made under delegation

**1. Two slices: the pressure and the two lower bands first, then the town turning.** Veto: *"ship all four bands at once"*.
- *Taken:* S1 makes unrest a pressure and gives Restless and Lawless their effects, plus the Fortunes row. S2 adds On the edge, defection, the rising and emptying, the On the edge chip and the four chronicle triggers. S2 moves `controls` edges and creates factions; it needs the [crown build](https://linear.app/threadbare/issue/THR-1932)'s offer helpers, and it must be tuned against a world where S1's pressure is already live.
- *Not taken:* one slice. Two hard behaviour changes in one PR (the unrest curve, and towns changing hands) make a regression hard to place, and S2 would wait on the crown build anyway.

**2. The target is computed once a day; the number moves every tick.** No veto line: an engineering call.
- *Taken:* the unrest phase stays per tick (it runs every tick today). Once a day it computes the target from its inputs and stores it; every tick it moves `unrest` toward the stored target by `UNREST_DRIFT_PER_DAY / TICKS_PER_DAY`. A push (Incite Unrest, a doom card) fades back smoothly at the same rate, and the inputs are read once a day.
- *Not taken:* a daily step of 4. A push would sit unchanged for up to a day and then jump, and receipts would show "anger cools" only at the day boundary.

**3. One hunger counter with two sources.** Veto: *"hunger should only count once the settlement economy ships"*.
- *Taken:* the phase keeps `hungerDays` on the settlement. A town is hungry today when, with [the settlement economy](https://linear.app/threadbare/issue/THR-1923) live, its store is empty and its food balance negative; before that, when a staple it draws on is at the scarce stock tier (the [prototype](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.ts)'s signal). The settlement economy's own `starveDays` is not reused: it resets when a person is lost, which would make hunger saw-tooth.
- *Not taken:* block S1 on the settlement economy build. The decision's census ran on today's food layer and found 7–12 Restless towns per seed, so the pressure model already works without it.

**4. The settlement economy's happiness term is folded in, not stacked.** Veto: none, an engineering call.
- *Taken:* the settlement economy plan moves unrest toward its happiness term "at the existing decay rate". This plan retires that decay, so the happiness term becomes one input of the target ("minus contentment"). Its `HUNGER_UNHAPPY` part is dropped from the term, because hunger is its own input here; otherwise a starving town would be counted hungry twice. Whichever build lands second makes the switch (§ Wiring in the plan).
- *Not taken:* two separate pulls on one number. They would fight, and the slower one would never be seen.

**5. A town weighs a new lord with the crown's scoring, seen from the town.** Veto: *"towns should never change hands without a war"* (the decision's own line).
- *Taken:* protection comes from the crown's `offer.ts` helper, evaluated over the one town. Standing is the town's own tie, not faction diplomacy: a faction that keeps a hall or members in the town counts for it; a faction whose army besieged or sacked the town recently counts against it. Fed and solvent are the faction's own state (its towns are not hungry, and its purse is not Destitute). A candidate must beat the holder by a margin, so a town does not flip between two equal lords.
- *Not taken:* the faction-to-faction standing the crown uses for oaths. A town does not hold diplomatic relations; its people care who keeps a hall in their streets and whose army burned their fields.

**6. A defection leaves a grudge the war machine can read.** Veto: *"losing a town should not start a war"*.
- *Taken:* the old holder's `relates_to` toward the new one drops below the rivalry threshold, so [war aims](https://linear.app/threadbare/issue/THR-1933)' enemy rule reads them as enemies, and it gains a `revenge` faction ambition naming the new holder and the town (`grievanceSourceId`, `targetNodeId`, both existing fields that no code writes today). War aims already scores revenge targets higher.
- *Not taken:* a new grievance record. The faction ambition already has the fields.

**7. A rising uses the faction split; the founder path is the fallback.** Veto: *"a rising should be its own kind of faction"* (the decision's own line).
- *Taken:* resident members of the holder split off through the existing `faction_splinter` path, with one new member selector, `resident_of`, that reads the residence the game already observes (`agentResidence.ts`). The existing selectors cannot pick by home: `within_radius` reads where a member stands today, and `performFactionSplit` always takes the lowest-reputation half. If the holder has no member living there, the most prominent resident founds a free town through `foundFaction`. Neither path writes `controls` or `hostile_to` today, so the rising writes both: the new faction takes the town's `controls` edge and is `hostile_to` the old holder with `reason: 'rising'`, which war aims reads as an enemy.
- *Not taken:* a "rebels" faction type. The split already makes a faction with a name, members and a grudge.
- *Not taken:* `performFactionSplit` (the schism path). Its member choice is fixed and has no location input.

**8. A town that has just turned or risen gets a breath.** Veto: *"a new lord should not calm a town"*.
- *Taken:* a defection takes `DEFECTION_RELIEF` off unrest and a rising takes `RISING_RELIEF` off, as one-off pushes that fade like any other. A cooldown stops the same town turning twice within `TOWN_TURN_COOLDOWN_DAYS`. Without it, a hungry town at 72 would defect, still be hungry, and defect again the next day, and the chronicle would repeat itself.
- *Not taken:* no relief. The town is still hungry, so the target is unchanged, and unrest would sit above 70 and churn.

**9. The interrupt rides the existing event popup.** Veto: *"every town about to turn should ask me first"* (the visibility decision's line).
- *Taken:* an edge crossing or a rising emits a game event whose notification channel is `popup` only when a threaded mortal lives in the town or the god keeps a shrine there. The popup is already an entry in the interrupt registry (`interruptRegistry.ts`, `EventPopup`), so no new interrupt surface is added. Everywhere else it is chronicle only.
- *Not taken:* a Needs-you entry. The visibility decision rejected it: Needs you is for the god's choices, and the prayer ([the god's stake](https://linear.app/threadbare/issue/THR-1935)) is the one Needs-you entry for a hungry town.

**10. "People leave" moves a person only once the settlement economy counts people.** Veto: *"Restless towns should lose people now"*.
- *Taken:* with the settlement economy live, a Restless town loses one person every `RESTLESS_LEAVE_DAYS` to the receiving town. Before it, there is no population number to move, so S1 ships only the mortal lean (resident mortals lean toward moving to the same place) and traces `unrest.leave.skipped` once per run.
- *Not taken:* write a population number here. The settlement economy owns `population`; a second writer would fight it.

## Tensions noted

- **Rarity versus being seen.** On the edge reached 0–2 towns per seed in 50 days in the decision's sketch. That is right for "anomalies are the content", but a player may never see a defection in a short session. The plan does not tune for visibility; the S2 kill criterion re-measures with the settlement economy live (where famine spreads), as the decision asked.
- **Poverty is a simmer by design.** 22–54 towns per seed sit below prosperity 35. Poverty is capped at 20 so it can push a hungry or besieged town over a band but never make a town Restless alone. A player who expects poor towns to riot will not see it; that is the decision's own *"poor towns should riot too"* veto line.
- **The town tax halving at Lawless is a purse change.** It touches [the faction purse](https://linear.app/threadbare/issue/THR-1931)'s town-tax line, which shipped on 2026-10-16. It is one optional graph parameter and one multiplier, read at the purse's one call site, so a lord loses coin when his streets turn lawless, which is the economy map's test: a hungry town is worth less, and worth fixing or taking.
