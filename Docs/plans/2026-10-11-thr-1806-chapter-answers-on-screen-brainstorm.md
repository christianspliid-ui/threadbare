> **title:** A chapter answers on screen — brainstorm companion
> **linear_issue:** THR-1806
> **author:** Claude Code (design lane, run 2026-10-10d)
> **created:** 2026-10-11

# A chapter answers on screen — brainstorm companion

Companion to [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen.md). It records the options weighed and why each was not taken.

## The tension

The player wants a result right after the choice (both testers' designer notes). A step needs world time to resolve (content durations of 1–8 ticks). The clock is the player's: Christian's 2026-09-27 ruling says a god who paused to think stays paused. Any fix has to give the result quickly without moving time behind the player's back.

## Options

| Option | What it does | Why not taken |
|---|---|---|
| **A. Resolve at commit** (the ticket's recommendation) | Decide the step the moment the player commits, open its aftermath in place | Needs a resolution path outside the tick. A step would take no world time when the player is paused and its full time when they are not, so the same chapter means different things depending on the pause button. The engine change is large for a delivery problem |
| **B. Run until answered, automatically** | On commit, run the clock by itself until the step answers, then stop | Moves time without the player's word. Contradicts the 2026-09-27 ruling ("a god who paused to think stays paused") and the hook's documented rule that there is no forced-resume side channel. The first lane draft took this option; reading the ruling killed it |
| **C. Status text only** | Close the veil as today; the readout says "paused · <chapter> answers when time runs" | Better than today, but the player still lands on the map after a choice and must find the readout. Kept as the *Back to the map* path |
| **D. Answering card + one-click run (chosen)** | The veil stays and says the answer needs world time, with *Let the world turn* | The choice is acknowledged where it was made; the clock moves only on the player's press, for exactly this answer, and returns to paused |
| **E. Shorten durations for pause-tier threads** | Set every pause-tier step to one tick | Still needs a tick; changes content pacing for every thread; does not tell the player anything |

## Vision premises

- The Stellaris clock (rulebook §3, 2026-09-27): reading must not leak time; the clock returns to the state the player left it in.
- The First is born asking (THR-1715): her chapters stop the world.
- PC-8: the player acts and nothing answers is the worst first-session complaint class.

## What would change the call

- Christian says commits should resolve at once → option A as an engine ticket.
- Christian says a commit should simply let time run → option B, with the 2026-09-27 ruling amended in the rulebook.
- Round-4 testers find the card a stall → fall back to option C (readout only).
