> **Brainstorm companion** to [`2026-10-26-thr-2059-the-path-steers.md`](2026-10-26-thr-2059-the-path-steers.md) — design lane, run 2026-10-26d.

# The path steers — brainstorm

## The question the ticket asked

*"Once the player says 'Morthane will become the unseen blade', what should make the next hour feel like an unseen blade's life: chapter selection weighting the path, God's Will offering only path-shaped work, or both? And when the god compels a piece of work, how does its result come back to the player?"*

The ticket's recommended direction: no chores in God's Will, a report-back line, a bounded positive weight. The lane tested each against the substrate and the Game Design Laws before adopting it.

## Alternatives weighed

### Where the path's weight lives

| Option | Verdict |
|---|---|
| **A. A lean on both The First's board and the God's Will ranking (chosen)** | One number, two readers that agree. It reuses the `whisperPull` seam (Law 42). |
| B. God's Will only shows path-shaped work (a filter) | Rejected. 83–204 of 539 story scenes fit a given path, so a filter would empty the modal on most decisions. It also lets the god's menu decide what kind of life she leads, which leans against Law 11 (forks belong to the mortal). |
| C. Lean in `finalScore` only, like the trade's role lean | Rejected. Measured: the live board never reads `finalScore` (`decisionBoard.ts:668-669`). The lean would steer God's Will's ranking but not her own choices, which is the gap the ticket reports. |
| D. Author a per-vision list of favoured encounter types or tags | Deferred. That is 24 visions × an authored list, and it is content-heavy. The two-Reach match is measurable today. A tag list can replace it later behind the same `firstPathPullFor` seam if round 6 says the Reach match is too coarse. |
| E. Match on a scene's secondary Reach too | Not possible today. The scene cache copies the main Reach into `reachSecondary` (`encounterCache.ts:318-319`). Fixing that is a separate, wide change. |

### How big the lean is

×1.5 (`FIRST_PATH_PULL = 0.5`). Compare: the trade's role lean is ×1.4 (primary) and a paid whisper is ×(1 + 4 × strength). The path is identity, not a paid push, so it should sit below a whisper. It should also be strong enough to show within a session, which is round 6's test. Novelty and share ceilings apply after it, so a path cannot become the only thing she does. The constant is the tuning knob if round 6 reports either "nothing fits" or "she only does one thing".

### Which of the path's Reaches count

Both. The vision's `requiredPrimaryReach` is who she is and `reachInvestment` is what she becomes. The unseen blade is shadow (the required Reach) plus iron (the investment): stealth plus the killing blow. Counting only the investment would turn an assassin's life into open fights. Counting only the required Reach would add nothing new, because she already has that Reach's capability.

### Chores in God's Will

The ticket's diagnosis holds: three of the four round-5 options were `trivial`, so they were routine. A chore never raises a chapter, so compelling one buys nothing the player can watch. Dropping chores and filling from the ranked list keeps the offer at four options when there is story work to offer. A minimum of two keeps the modal a choice, not a single button.

### The report-back

`compulsionOutcomeMessage` already speaks at the start (taken, or lapsed with a reason). The gap is the end. The archive is the one place every resolved scene passes through, so a mark carried from the action onto the chapter record gives one reader and one toast. It needs no new phase. The toast fires for routine work too, so an old save's held chore or a debug force still answers.

## Tensions

- **Law 9 (the god never commands).** God's Will compulsion predates this plan (THR-1781) and is not reopened here. This plan narrows what it offers and makes it answer. It adds no new command power.
- **Law 13 (the world does not wait).** The path lean is the mortal's own becoming, set at the bond. It is not the god's per-decision steering.
- **PC-6 (one fact told two ways).** The fit line appears only on a God's Will option, and the path title appears only through `firstPathInLine`. That keeps one phrasing.

## Vision premises touched

None changed. Law 45 (no unbacked promises) is the premise this plan serves: the bond line says "will become", and now the world leans that way.
