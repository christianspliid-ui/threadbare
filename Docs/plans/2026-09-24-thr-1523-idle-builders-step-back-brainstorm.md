# Brainstorm — Unwatched builders step back (THR-1523)

Companion to `2026-09-24-thr-1523-idle-builders-step-back.md`. The filename keeps the ticket's "idle builders" wording; the plan's game word is *unwatched*.

## What the research changed about the question

The ticket framed the problem as "the swap pool is the handful of ambition-less seeded mortals, then every newborn is refused". Reading the code showed three things the ticket did not have:

1. **The swap pool is empty from tick 0.**
   - The commanders and captains carry a seat (`member_of` with role `commander`), and `holdsSeat` protects them. Every landing pull was net-additive.
   - Nine of the ten standard templates are strategic (the ticket counted 12 of 12 by including the two other pools), and every mortal takes two wants, so every protagonist is a protected builder.
2. **A refusal is final.** The pull fires only at assignment. Nothing re-reads the refusal, and the only demotion in production is the swap itself.
3. **The ~220 refusals are about two per newborn.** Births call the pull once per want.

So the spotlight does not merely queue newborns. It freezes after the first two.

## Who decides

The ticket said the choice is *"not the executor's to settle"*. That makes it a design session's call, not necessarily Christian's. The 2026-09-10 ruling is an agreed outcome with acceptance tests (`census:reachability`, `census:undertakings`, flat population, followed and retinue mortals never demoted). Every option can be measured against it, so the fork is *how* to honour the ruling, not what the game should mean. `Docs/canon/process.md` rule 4 puts that with the agent: decide, present it in chat in game terms, invite a veto.

## The four options, measured against "the world's builders become the watched"

| Option | What it does to the spotlight | Why not |
|---|---|---|
| **A. As shipped** | frozen after the first two newborns | the rulebook's "steps back" half never fires; newborns hold silenced wants (the problem THR-1329 fixed, returning) |
| **B. Unwatched builders step back** | follows who is building; population flat | **chosen**, with five guards |
| **C. Newborns are not builders yet** | no pulls before tick 75 | no non-strategic pool exists; it loses seed 99's merchant-expansion evidence (a newborn pulled at tick 3); newborns have no age model to grow out of, so "not yet" has nothing to hang on |
| **D. Raise the overflow** | frozen after 4–6 newborns | raising MAX alone does nothing at medium (the share binds); pushing the share past its range crowds the small map (halving growth-paying completions, measured); +24–30% tick cost at six breaks the ceiling |

## Why B needs its guards (each closes a way B could go wrong)

1. **The floor.** Never-witnessed reads as infinitely stale, so without a floor (tick 0, or the pull) the whole worldgen cast steps back on day one.
2. **Follow protection.** The Follow button is the player's own tool, and today only a thread protects.
3. **Travelling is busy.** Only spotlight mortals move, so a demoted traveller would freeze mid-road.
4. **Pulled mortals can go unwatched too.** Otherwise the pool slowly fills with permanent newcomers. The pulled-once mark still forbids a second pull, so there is no cycle.
5. **A turnover cap.** One per day, so the cast changes like a living world and does not churn.

**Plus the activity term.** "Unwatched" alone would demote a builder whose work is advancing off-screen, which is the opposite of the ruling's intent. The latest undertaking progress counts as activity, so only a builder who is both unwatched *and* idle steps back.

## Alternatives inside B, considered

- **A retry queue for refused holders** (pull the oldest refusal when a slot opens). Dropped: births are near one per tick late in a run, so a freed slot fills from the next newborn anyway. A queue adds state for no visible gain.
- **A chronicle line for the one who steps back.** Dropped: the existing design deliberately writes none (Law 13 parity), and the demoted mortal was, by construction, unwatched.
- **Protect by importance instead of by follow.** Dropped: importance is a rarity score, not the player's attention, and the player's attention is what the spotlight serves.
- **Telling the player Follow now protects.** Right idea, wrong slice: it is a `FollowToggle` description change, which brings a `src/components` edit and browser evidence into an engine slice. Filed as THR-1573.
- **Exempting a mortal the player kindled.** The Kindled Ambition card pulls through the same door, so under guard 4 a kindled mortal can step back after six unwatched, idle days. Exempting player-sourced pulls would need the reaction's provenance plumbed to the pull, because authored content also plants `assign_ambition`. Dropped: the kindled mortal gets six days from the pull, any progress extends it, and Follow keeps them for good. The rule text says so, and the chat presentation names it for the veto.

## Found while researching, filed separately

- **THR-1562.** Ambition reach floors and reach milestones compare raw capability (10–40) against 0–1 thresholds, so none ever gates. That is the root of "every newborn is a builder", and it changes eligibility game-wide.

## Vision premises touched

- `00-north-star.md:15`, a handful of mortals known by name: protected by thread and Follow, and by any scene the player watched inside six days.
- `00-north-star.md:47`, one full arc over fifty touches: the arc the player is watching cannot end off-screen.
- `01-core-loop.md:51`, whose story to witness is the player's call: unchanged, and the Follow button now carries it.
