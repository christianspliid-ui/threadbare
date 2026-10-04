> **title:** Brainstorm companion — A minimised moment waits for its god (THR-1730)
> **plan:** `Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md`
> **created:** 2026-10-04 (design lane, run 2026-10-04d)

# Brainstorm companion — THR-1730

## The question as filed

The executor who shipped minimise ([THR-1724](https://linear.app/threadbare/issue/THR-1724)) found that the engine never holds a step for the player. The ticket offered **A (it waits)** and **B (it plays out)**, and recommended A.

## Vision premises in play

- **The Stellaris clock** (Christian, 2026-09-27): the world runs, and halts for every moment that matters.
- **The god acts by choice, the whisper.** "Let fate decide" exists as a deliberate act (THR-1714's "Play your hand, let fate answer" keeps it as one).
- **The First is born asking** (THR-1715): her story chapters stop the world.
- **Badges are the recovery route** (Law 39). A badge that recovers a finished thing is Law 40's failure in another form.

## Alternatives considered

| # | Option | Why not |
|---|---|---|
| B | Status quo: minimised steps play out once the clock runs | A second, accidental "let fate decide". Christian's approved THR-1724 text says the empty-hand commit is *the one* deliberate way. It also reopens THR-1715's measured "0 auto-resolving story steps". |
| A1 | Hold **every** pending pause-mode notification's step, minimised or not | Headless runs, census readers and the CLI never answer a notification, so every pause-mode step would freeze for ever. A player-set flag keeps headless runs byte-identical. |
| A2 | Hold, but release after N ticks (cap) | B on a delay. The THR-1715 plan rejected a wall-clock halt cap for the same reason. Kept as the constant `PLAYER_HOLD_MAX_TICKS = Infinity`, so a tuner can try it without code. |
| A3 | Hold, and re-raise the veil after N ticks | A nag loop. Law 39 already interrupts each *new* beat. Re-raising an old one punishes the player for looking at the map. |
| A4 | Pause the whole world while anything is minimised | That is not minimise. It erases the point of "Show on map", which is to look at a *running* world. |
| A5 | Hold via the notification (`EncounterNotification.held`) rather than the action | The engine's progress phase reads actions, not notifications; going through notifications couples Phase 2a to the visibility record's lifecycle. The action already carries the sibling flags (`disregardRemaining`, `activeNudges`). |
| **A** | **Player-set, per-step hold on the action; engine-side releases; no cap** | Chosen. |

## Tensions

- **A held mortal stands still while the world moves.** That is the honest cost of setting her moment down, and the badge says she is waiting. If round-3 testers forget held moments, the fix is a louder badge, not dropping the hold.
- **Lives on releases the hold.** Switching a thread to auto means "she lives without you". A held step under auto would contradict the toggle's own words, so the engine releases it.
- **Determinism.** A minimise changes when a step resolves, so seeded runs diverge on player input. That is expected: player input is an input.

## Why this does not need Christian

Every option is tested against agreed text: the THR-1724 approval, the THR-1715 promise, and Laws 39 and 40. B contradicts the approved text. Among the A variants, the choice is the *how* (whether to cap, where the flag lives), which canon gives to the design session. The veto stays one chat message away.
