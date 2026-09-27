# Action Proposal — The opening (THR-1605, THR-1608, THR-1609)

## intent_quote

> i would like to have the remaining onboarding & first run experience project tickets into ready for dev. is it feasible to to do that in one session?

> i think from a game design perspective, getting a first is pretty important. we have currently locked it to first time you enter a city, i think because of the way the first encounter prose was designed (it all seems to happen in a city). I am thinking we should at some point expand the functionality from meeting the first, into a broader feature that triggers every time the player onboards/threads an agent. from a design perspective this is as close as you get to character creation on this game, and people LOOOOVE character creation. so in the near future the first is simply just your first threaded agent, that might start with some extra traits that mean they will have a larger chance of being a protagonist agent. does thi s make sense?
>
> lets go with the stellaris  model, so real time, but with lots of auto pause on important things.
>
> lets aim for doom to not trigger until we the player can at least have one agent go through a full character journey. i think we set that goal before, but we are having trouble measuring this as we continuously change the game rules, so lets just make sure doom doesn't stop the game too early right now, and we can tweak it as awin condition later when the rest of the core features are more mature.,

(Christian, attended chat, 2026-09-27.)

## scope (what this plan does)

Designs the first ten minutes after Ascend, across three cold-playtest findings, as seven build slices:

- **S1:** the meeting with The First opens straight after the "Reach Down" beat, at the settlement nearest the avatar. No walking; the meeting prose is unchanged.
- **S2:** the doom clock sleeps until the bond, is three times longer, and has a floor after the bond. Rivals and omens get a grace window.
- **S3:** the Stellaris clock. One declared halt registry, queued popups, resume-to-prior, the ledger pauses; store and wiki copy updated.
- **S4:** spine gifts are spaced between player acts and wait for the bond.
- **S5:** the HUD hides doom, rivals, notables, omens and the mandate until the bond; the ledger badge counts unread.
- **S6:** the avatar gets a distinct "you" marker and label, keeping the remembrance name.
- **S7:** a larger avatar sight range and a lower zoom floor.

It also updates the rulebook §3/§8 and the Vision core-loop and taste profile to the Stellaris ruling.

## scope (what this plan does NOT do — explicit non-goals)

- It does **not** build the general threading ceremony (character creation for every thread). That is Christian's "at some point / near future" direction, filed as THR-1644, deliberately after round-2 evidence. S1 only moves the meeting toward that shape.
- It does **not** give The First protagonist-leaning traits. That belongs to THR-1644.
- It does **not** make doom a win condition or tune it against journey measurement. Christian asked for a simple floor now and tuning later.
- It does **not** rewrite the 107 settlement-framed meeting prose lines.
- It does **not** add player-configurable auto-pause settings.
- It does **not** change the readability or consequence findings (THR-1606 / THR-1607); those are the sibling plan.
- It does **not** fix the cycle-2 doom reset or the null court position bugs; those are filed separately as THR-1642 and THR-1643.

## impact_class

**High-risk (judge-corrected from Reversible, 2026-09-27):** the plan reverses a settled Vision premise and edits rules of play. Sign-off is Christian's verbatim rulings in intent_quote. Originally proposed as Reversible: every slice is behind named constants or additive optional fields; old saves read the missing fields as today's behaviour. The Vision edit is a real direction change, but it was made by Christian in chat (quoted above), not by this plan.

## evidence cited

- **Linear issue:** THR-1605 (plus THR-1608, THR-1609); rulings recorded as comments on THR-1605 and THR-1608 on 2026-09-27.
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/01-core-loop.md` (turn-based section, rewritten), `Vision/taste-profile.md` (turn-based pattern + rejected auto-advancing, rewritten), `Vision/02-non-negotiables.md` §3 (untouched).
- **UL terms touched:** The First, Thread, Avatar, Chapter Ledger, Doom Clock (none redefined; no new player-facing terms, so no UL-proposal).
- **Canon pages consulted:** `Docs/canon/rulebook.md` §3/§8, `rulebook-quick-reference.md`, `design-governance.md`, `systems-inventory.md`, `interface-map.md`, `Docs/design-system/laws.md`.
- **Prior plan docs this builds on:** `2026-04-06-meet-the-first-narrative-redesign.md`, `2026-07-30-thr-868-meet-the-first-nudge-conversion.md`, `2026-06-26-ascendant-beats-divine-cadence.md`, `2026-03-08-golden-path-polish-design.md` (doom length history), `2026-09-25-thr-1610-cold-playtest-loop.md`.
- **Rejected approaches considered and dismissed:** start the avatar in a town; pilgrimage pull marker for the First; rewrite meeting prose setting-neutral; an expiry floor from world start; a journey-aware doom gate; resume-always; demoting gifts to toasts; renaming the avatar (see brainstorm companion).

## load-bearing decisions touched

- **Three-tier position model:** `pickMeetingLocation` resolves the avatar upward to its hex and uses `getLocationNodes` (outer tier only). Respected.
- **World graph mutated in place / version counters:** no new caches keyed on graph identity. Respected.
- **No new node types / relationships as edges:** none added; `wokeAtTick` and `playerActCount` are scalar state, not relationships. Respected.
- **Rejected approaches list:** none reintroduced.

## high-impact files touched (from Codesight)

`src/types/gameState.ts` (675 importers; optional fields only), which is covered by a Blast Radius section in the plan.

## kill criteria

- S1: if a round-2 cold tester still does not register The First as a person they chose, the fault is the ceremony's weight, not its reachability. File it against THR-1644; do not move the meeting again.
- S7: if the zoomed-out parchment renders badly, ship only the sight change.
- Whole plan: the round-2 cold playtest is the test. Fixed when testers meet The First, act before the second popup, correctly say which figure is them, and no world ends before they have met The First.

## explicit user sign-off

Not High-risk. Christian's rulings are quoted in intent_quote; the design session decided the how under process.md rule 4 and will invite a veto in chat.

## author notes for the judge

- **The biggest judgement call is S1.** The ticket recommended (b), a pilgrimage pull. I chose a modified (c): the meeting takes place at the nearest settlement, because the meeting's fiction is the god *sensing* souls, so the avatar need not be present. This keeps all authored prose true and is the shape of Christian's "ceremony wherever the mortal is" direction. I'm uncertain whether a player will feel that the First is "far away". The thread line and the S6 contrast are meant to carry that.
- **The doom numbers** (1080 length, 720 floor, 48-tick rival grace) are calibrated from one measured data point (the round-1 skimmer: ~200 ticks in ~10 real minutes). They are tunable constants by design; Christian explicitly asked for provisional values.
- **The Vision edit reverses a premise settled 2026-04-16.** It was ruled by Christian today. I kept the premise's reason (reading must not leak time) as the halt rule, so only the mechanism changes.
- **"Remaining project tickets into Ready for Dev":** THR-1605, THR-1608 and THR-1609 go to Ready for Dev as S1, S3 and S6, with four new slice tickets. THR-72 (the April umbrella) is superseded by these two plans. THR-1644 stays in Todo on purpose (it needs round-2 evidence), and I'll say so to Christian.
