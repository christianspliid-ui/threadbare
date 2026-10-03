# Action proposal — 2026-10-03-thr-1714-show-the-roll

## intent_quote

The originating ticket, filed by Christian from cold playtest round 2 (Linear THR-1714, 2026-10-03):

> This is the agreed nudge model (the god sways odds; fate picks). The design question is only **legibility**.
>
> How does the player see that their whisper mattered when fate went the other way?
>
> **Recommended direction:**
> * Before commit, the odds-shift shows as "your hand: Perilous → Uncertain".
> * The commit button names the act ("Whisper and let fate answer").
> * The reveal has one line naming what fate did with the lean ("Fate turned against your lean: she chose the other road").
> * No raw number, per the forecast-tier vocabulary.
>
> ## Fixed when
> A round-3 tester can explain why an outcome differed from the card they paid for.

Tester quotes carried by the ticket (veteran): *"Show me the roll: when I pay essence for an option, tell me in one line what my odds were, what the dice did, and which outcome my nudge caused."*

Lane mandate (Christian, 2026-09-25): *"I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations."*

## scope (what this plan does)

Makes the Meet The First dilemmas (two formative tests + the bond test) say what the player's hand did: the moved-forecast line becomes "your hand: X → Y"; the commit button has a with-hand and a silent label on every nudge stage; leaning meeting cards show which way they lean using the agent sheet's own axis words; each meeting reveal opens with one fate line (what the hand made the odds, what fate did with the lean). Engine side: two additive forecast fields on the meeting outcomes, a pure fate-line selector, and the first emitter for two meeting traces declared at THR-868 and never emitted.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change any odds, band, rider, pole write, cost or seed stream.
- Does not show numbers (percentages, d100) — the veteran's literal ask is declined under ruling 6 / Law 13.
- Does not add a fate line to in-world encounter aftermaths (D7) — round 3 is the trigger for that.
- Does not address the rest of THR-1713 (tooltips on essence, stars, Reaches); only "was Perilous" overlaps, decided here.
- Does not fix the unreachable `success_at_cost` band in the meeting (reported only).

## impact_class

Reversible — UI copy, additive optional fields, a new pure module, trace activation. No save-format break, no rule change.

## evidence cited

- **Linear issue:** THR-1714
- **Vision premises invoked:** core loop — the god acts in physics, fate decides (THR-868 Vision audit); `Vision/taste-profile.md` prose register (game, not novel)
- **UL terms touched:** Forecast tier (existing, its "favorable that resolves failure is ordinary" clause), Dealt Hand ("your hand", existing). No new player-facing term — the ticket's suggested verb Whisper is NOT used because it is already a nudge-card keyword (judge pass 1 finding); "fate line" is a code name only.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md` (Laws 13, 16, 17, 31, 38, 42, 43, 48), `Docs/ubiquitous-language/Encounters.md` § Forecast tier
- **Prior plan docs this builds on:** `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md` (verdicts 1, 10; ruling 1), `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` (ruling 6)
- **Rejected approaches considered and dismissed:** "choosing between authored futures" (THR-772) — not reintroduced; fate still overrides a lean 38.5 % of the time.

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected: nothing new persisted; outcomes are transient until the existing fold.
- *Seeded PRNG everywhere / determinism* — respected and pinned by test: forecasts computed without drawing.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` — additive fields on two existing union members. Blast Radius section present.

## kill criteria

- Round-3 testers still call the meeting essence decorative, or describe an override without "fate"/"odds" → the line is not read; change placement/weight.
- A tester reads "Leans Brave" as a promise → drop the lean tag (D4), keep the line.
- Christian vetoes the verdict-10 interpretation → ship the fate line in fully diegetic phrasing only.

## explicit user sign-off

Not required (Reversible). Decisions are made under process.md rule 4 delegation with a 24-hour veto window; the handoff carries `Claimable from:`.

## author notes for the judge

- The ticket's example line uses "she" for the First; the candidate's gender is not known to the line, so every clause names `{name}`.
- The ticket says "the commit button names the act"; I widened it to two labels so a silent commit is also named — the census shows silence wins a good band 35 % (formative) / 53 % (bond) of the time, which is exactly the veteran's "scene 3" complaint.
- THR-868 verdict 10 ("no UI callouts, no tooltips" in the meeting) is the one place I interpreted rather than followed literally; recorded with a fallback in the plan.
- The lean-tag words are the axis sheet words (`getAxisByValuePair`), e.g. iron = Brave / Power-Hungry, which do not always echo a dilemma's fiction word ("mercy"). I chose sheet consistency over local fiction; flag if you think that misleads.
