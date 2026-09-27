> **title:** The opening — brainstorm companion
> **companion_of:** `Docs/plans/2026-09-27-thr-1605-the-opening.md`
> **created:** 2026-09-27

# The opening — brainstorm companion

The alternatives weighed, the tensions surfaced and the Vision premises invoked while designing the first ten minutes (THR-1605, THR-1608, THR-1609).

## Vision premises invoked

- **North star — "the mortal has to feel like a person, not a unit … If the player meets them for the first time in the crisis, the moment does not work."** This is why the meeting cannot wait on a walk: every tester's one message was *put one named mortal on screen*.
- **North star — "pressure that is not the player's to pause."** Strengthened by the Stellaris ruling: the clocks run for real now.
- **Core loop — "Turn-based is load-bearing."** Its *reason* (reading and scanning must not leak time) is kept and made the rule of the halt registry. Its *mechanism* (single-step ticks) is retired by Christian's ruling. The game already ran in real time, so the premise described a game that did not exist.
- **Non-negotiable §3 — prose, never numbers.** Untouched here; the readability sibling plan handles it under Law 13.
- **Taste profile — sphere-tinted ceremonial cards (Christian loves them).** The spine gifts stay ceremonial modals, paced, not demoted to toasts.

## Alternatives considered

### Reaching The First (THR-1605)

| Option | For | Against | Verdict |
|---|---|---|---|
| (a) Start the avatar in a town | Simplest trigger | Undoes the Sacred Grove opening; couples Remembrance to a settlement; still needs tick ≥ 2 | Rejected |
| (b) Keep the pilgrimage, add a pull marker | Teaches movement | Minutes of walking between the promise and the person, exactly where all three testers were lost | Rejected for the First; kept as the likely shape for later threads (THR-1644) |
| (c) The opening beat delivers the meeting | Immediate | As stated, it needs the avatar in a settlement, or all 107 settlement lines rewritten | Taken, in modified form ↓ |
| **(c′) The meeting takes place at the nearest settlement; the god senses from afar** | Immediate; zero prose rewrite; the First, the seat and the town all point at one real place; matches "the ceremony comes to where the mortal is" (Christian's threading direction) | The avatar is not beside the First at first; the thread line and the S6 contrast have to carry "where is my mortal" | **Chosen** |
| Rewrite meeting prose setting-neutral via `{frag:setting}` envelopes (THR-884) | Makes the meeting placeable anywhere | ~1,000 lines of authored prose, under a paused authoring regime, for no player-facing gain over (c′) | Rejected; the envelope path stays open for THR-1644 |

### Doom (THR-1608)

| Option | For | Against | Verdict |
|---|---|---|---|
| Raise `DEFAULT_DOOM_TICKS` only | One number | Accelerators can still compress it; the First's journey starts late if the meeting is late | Part of the answer |
| Expiry floor in ticks from world start | Simple | Measures the wrong thing: a slow meeting eats the floor | Rejected |
| **Doom sleeps until the bond, plus a floor after the bond, plus a longer clock** | The journey is keyed to doom progress, so it starts exactly at the bond and always completes (Return at 0.9) inside the run; the floor guarantees real time against accelerators; three constants, each one line | Three levers instead of one | **Chosen** — Christian asked for simple and tunable; each lever is one constant |
| Journey-aware gate (expire only after the First's `return` beat) | Most faithful to "one full journey" | Couples doom to a system the rules keep changing, which is exactly the measurement problem Christian named | Rejected for now; a candidate when doom becomes a win condition |
| Turn doom off in the first cycle | Simplest | Removes the pressure the north star needs | Rejected |

### Clock (THR-1608)

- **Pure turn-based (the old Vision premise).** Ruled out by Christian.
- **Paused-by-default until the First is met, real time after.** Subsumed: the meeting now opens at once and is itself a halt, so the world never runs before the bond anyway.
- **Stellaris with resume-always (today's behaviour).** Rejected: a player who paused to think is thrown back into running time by closing any popup. Stellaris itself restores the prior state.
- **Stellaris with per-event player settings** (which events auto-pause). A good later feature; out of scope. The registry's declared list is the shape it would configure.

### Popups (THR-1608)

- **Demote the single-button gifts to toasts.** Rejected: they carry Christian's favourite surface, and the problem was spacing, not form.
- **Merge the three gifts into one.** Considered; it loses the rhythm of three small reveals. Pacing them between player acts keeps each one read.

### Who am I (THR-1609)

- **Rename the avatar** (for example "the Wanderer"). Rejected: the remembrance's naming of the past self is the emotional hook every tester praised.
- **An explanatory tooltip only.** Too weak alone. The marker contrast plus the Beat 0 line plus the early First do the work together.

## Tensions surfaced

1. **The UI Law's "no numbers" vs the testers' ask for numbers.** It belongs to the sibling plan; Law 13's ratified essence exception already resolves it for balances.
2. **Resume-to-prior vs "I chose an encounter and expect the world to move".** Flagged to the executor as the contested line; decide in play, not in the doc.
3. **Zooming out shows fog edges.** A deliberate look (`MIN_ZOOM` comment) vs the testers' "tiny world". The evidence wins, with a kill criterion.
4. **The doom length changes every doom-scaled pacing at once** (journey phases, stage popups, rival escalation). Intended: they were all tuned to a 200-second world.

## Open for later

- The threading ceremony for every thread: [THR-1644](https://linear.app/threadbare/issue/THR-1644).
- Doom as a real win or lose condition once the core features mature (Christian, 2026-09-27).
- Player-configurable auto-pause.
