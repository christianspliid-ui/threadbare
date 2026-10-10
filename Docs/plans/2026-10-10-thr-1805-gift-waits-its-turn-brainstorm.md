> **title:** A gift waits its turn — brainstorm companion — THR-1805
> **linear_issue:** THR-1805
> **author:** Claude Code (design lane, run 2026-10-10c)
> **created:** 2026-10-10

# A gift waits its turn — brainstorm companion

Companion to [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md). It records the alternatives, the tensions, and the Vision premises behind the five decisions.

## The question

How should a ready gift arrive when the player is in the middle of doing something?

## Alternatives considered

| Option | What it does | Why not taken |
|---|---|---|
| **A. Hold behind player surfaces + quiet window, open itself after (chosen)** | Gift waits as the pill while a player surface is open or input was <2 s ago; then auto-opens | — It keeps Law 39 (the gift still interrupts on its own) and removes the hijack |
| B. Pill only, never auto-open (pool-beat behaviour for spine gifts) | Every gift waits for a click | A tester who never notices the pill never gets the Seat, the Thing Left Behind or the First Word. That breaks Law 39 ("badges are the recovery route, never the primary one") and starves the opening that THR-1647's idle fallback exists to protect |
| C. Delay the engine gate by N ticks after an act | The gift becomes ready later | A tick is about a second. Any N is either too short (the player is still reading the cast result) or too long (it fights THR-1647's pacing). It also cannot know whether a sheet is open, which is engine-invisible UI state |
| D. Make the beat modal a *yielding* interrupt in the registry | It yields to other interrupts | The registry only knows interrupts. The profile, the drawer and the Codex are not interrupts, so the main complaint ("View Full Profile three times") would survive |
| E. Queue the gift and open it after the player's *next act* | Ties delivery to acts | The act is exactly what opens the gate today, so this moves the collision by one act instead of removing it |
| F. Pause the world while a gift is held | The world waits for the god | The pill is not an interrupt. Pausing behind an unseen pill is PC-4 (time stops and the player is not told why), and Law 52 would need the pause named |

## Tensions

- **Law 39 vs PC-5.** Law 39 wants pause-tier beats to interrupt on their own; PC-5 says interruptions must not pile onto the player's act. Option A satisfies both by changing only *when* the interruption fires, not *whether*.
- **Wall clock vs determinism.** The quiet window is wall-clock time. That is legitimate here because it gates a React mount, not a world write. Same seed + same inputs still give the same world. Only *when the modal is shown* varies, and the beat's pending record, history and spacing are engine-owned.
- **2 seconds.** Taken from the ticket's recommended direction ("never within about 2 s of a player click"). It is long enough to see a surface open and short enough that a quiet player is not kept waiting. It is a named constant; round 4 is the measurement.

## Vision premises

- **The god acts deliberately.** Law 46/48 frame every click as "a deliberate act of a god". A click answered by an unrelated popup tells the player their act did not land.
- **Onboarding is paced by the player** (THR-1647: *"one player act apart, with an idle fallback"*). This plan finishes that idea. THR-1647 made the player set the rhythm; this makes sure the player also sets the moment.

## What would change the call

- Round 4 shows testers who miss the pill and wait over a minute for a gift. Shorten `GIFT_QUIET_AFTER_INPUT_MS` or add a gentle pill pulse (Law 44-compliant).
- Christian prefers gifts never interrupt at all (option B). That is a Law 39 amendment, his call.
