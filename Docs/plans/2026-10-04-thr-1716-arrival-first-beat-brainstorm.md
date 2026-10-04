# Brainstorm companion — The world arrives with its first beat already open (THR-1716)

Companion to `Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md`. Written by the design lane (run 2026-10-04b) alongside the plan.

## The tension

Two agreed things pull against each other at the arrival:

- **The Stellaris clock** (Christian, 2026-09-27): real time, generous auto-pause, and — as in the game it is named after — the world does not move until the player lets it.
- **The cold testers' first minute**: a still map with no direction is where the round-2 near-quit happened, and the story only started *"when I happened to press Play"*.

Every option is a way of resolving that tension.

## Options considered for the arrival

| Option | What the player sees | Why taken / not taken |
|---|---|---|
| **A. Auto-run until Beat 0** | The clock starts on its own for one tick, then the beat stops it | Not taken. The world moves before the god has acted; it breaks the Stellaris start for one second of nothing. It also teaches that time runs by itself, which is the opposite of what the god must learn |
| **B. A pulsing Play prompt only** | A still map with a glowing button | Not taken alone. The first act on the map is still a guess about a control, and the testers did not lack a button — they lacked a reason. Kept as the fallback (decision 4) |
| **C. The opening beat at turn 0** | "Reach Down" is on screen the moment the map is | **Taken.** Beat 0 is already authored as due at turn 0; the bug is that nothing calls the offer code without a tick. Zero map actions before the first beat |
| **D. Skip the beat, open the meeting directly** | The meeting first | Not taken. Beat 0 is the line that names the avatar as the player's own shape (THR-1609) and hands off to the meeting; cutting it is a content call |

## Options considered for the first motion of time

| Option | Why taken / not taken |
|---|---|
| Leave the clock paused after the bond (pure resume-to-prior) | Recreates the "storybook straight into a spreadsheet" drop one step later |
| Always resume after the bond | Overrides a player who paused on purpose, on every later re-threading once threading becomes a ceremony (THR-1644) |
| **"Let them walk." starts time, first time only** | **Taken.** The bond's existing button already says it; the world moves because of a choice the player made in the story. Routed through the held-state path THR-1711 built for Play presses inside popups, so it is not a forced-resume side channel |
| A tutorial modal about time | An interrupt to explain interrupts; the HUD budget and the core loop both argue against it |

## The remembrance

The testers disagree: the story tester and the veteran praised the picture screens' writing and recap; the skimmer wants a dilemma within a minute. The ticket's recommended direction splits the difference — keep the screens, cut the clicks — and the plan follows it.

The tricky part is Law 48 (*irreversible acts are armed, then fired*). The old zoom-then-confirm was, in effect, arm-then-fire. The plan keeps a reversible window instead: choosing is one click, and the stirring and drive screens hold the choice with "Choose again" before moving on. Origin and transformation already end in Continue. If Christian reads remembrance picks as Law-48 acts, every screen gets a Continue, at a cost of one click per screen — named in the plan's *would change the call*.

Cutting a screen was not considered further: which questions build the god's identity is a meaning call, not a how call, and the lane does not make meaning calls.

## Vision premises touched

- Core loop: *"halts for every moment that matters: an encounter, a choice, the meeting…"* — served; the first moment now actually occurs.
- Player-as-god framing: the first motion of time is the god's act ("Let them walk."), not the machine's.
- Taste: the remembrance's art is loved; the chosen state keeps the large composition the zoom used to give it.

## What round 3 should tell us

- Do testers reach "Reach Down" with no map action? (Expected: yes, by construction.)
- Does "Let them walk." read as "start the world"? If testers pause straight after, the copy or the effect is wrong.
- Does anyone pick a remembrance picture by accident and fail to undo it?
