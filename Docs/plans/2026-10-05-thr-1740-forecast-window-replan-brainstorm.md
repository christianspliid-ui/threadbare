# Brainstorm companion — forecast window re-plan (THR-1740)

Companion to `Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md`. It records the alternatives, the tensions, and what the measurements changed.

## How the decision moved during the run

1. **Starting position (the ticket's recommendation):** remove the quest exemption, then pick a gauge, then probably steepen the ramps.
2. **The gate was measurable after all.** `KPI_BRANCHING_FIRE_MIN_PER_30T` counts every branching fire, not only threaded agents' fires (`gameplayKpi.ts` `buildBranchingFire`). Unattended worlds clear it after the change (4.0–8.75 per 30 ticks under the chosen arm), and so do attended worlds. The threaded-agent count, the population the exemption was written for, is small on `main` but real: 9 fires over six attended seeds. The exemption is part of what keeps them; removing it for everyone takes them to 0 (step 4).
3. **Ramps alone hit a wall.** Steeper ramps raise the share but raise master success too (0.719 with the too-easy edge at 0.70). The reason showed up in section A: masters still took near-certain work at fit 0.10, because value per tick beat the in-window option by 2.5×.
4. **The threaded mortal is the population that matters.** The first draft removed the exemption for everyone; the intent judge escalated because The First's quest fires fell 9 → 0 over six attended seeds. Scoping the change to unthreaded mortals (and leaving a threaded mortal's quests out of the odds-neutral scale too) holds them at 11 and keeps the gauge gain: threaded mortals are a handful against hundreds.
5. **The value term counts the odds.** Expected utility weights each outcome's reward by its probability (`encounterScoring.ts:1303`), so a sure thing is worth more *before* the window sees it. One more probe made value odds-neutral above the midpoint. It gave the most level success of any arm, every band inside tolerance on seeds 42/99, at the same share as the refuse-edge arm.

## Alternatives considered

| Alternative | For | Against | Verdict |
|---|---|---|---|
| Exemption off for everyone | Simplest | The First's branching quests 9 → 0 (six attended seeds) | Rejected (first-round escalation) |
| Exemption kept for threaded mortals only, value scaled | Narrow | The First's quests 9 → 3 | Rejected |
| **Threaded mortals' quests exactly as shipped** | Both agreed outcomes hold (fires 11; gauge +0.068 attended) | One more predicate in the scorer | **Chosen** |
| Keep the quest exemption | Branching fires stay ~25/30t | It is the largest single source of padding; master success 0.699 | Rejected |
| Quest fit floor 0.50 | Keeps half the branching fires | +0.022 share only; master success 0.691; master > expert 0/6 | Rejected |
| Static-window gauge, floor 0.60 | Simple; matches the original constants table | Counts the setback guard (trap 2) as a miss; no arm reaches it without breaking level success | Rejected |
| Own-window gauge, floor 0.60 | Stricter | Only the out-of-range ramp arm reaches it (0.601), with master success 0.719 | Rejected; it is the veto option |
| Own-window gauge, floor 0.50 ("most") | Matches the row's own name; tension is guarded directly by per-band level success | It lowers a number. It needs a veto invitation, and it must not become a habit | **Chosen** |
| Steeper refuse edge (0.40) | +0.018 share over noquest | Master success 0.698; it moves the "refuse" line the ruling calls the god's territory | Rejected |
| Steeper too-easy edge (0.70) | Largest share (0.537 static / 0.601 own) | Outside documented @range; master success 0.719 | Rejected |
| Odds-neutral value above the window midpoint | Removes a structural double count; most level success | New term on every free choice; undertakings not covered | **Chosen** |
| Odds-neutral value everywhere (below the midpoint too) | Symmetric | Would *raise* long-shot value, the opposite of "long odds are the god's to impose" | Rejected, not probed |
| Odds-neutral undertakings too | Parity on the board | Not measured; undertakings are outside the share and already gain | Deferred to a later measurement |

## Tensions held

- **Branching quests are the only authored multi-choice content.** Firing them 80% less is a real loss of texture, even if what is lost is mostly masters re-running quests they cannot fail. They keep their curator lift and cap reserve. If the game feels thinner in threads, the lever is threaded-agent curation (a pre-existing gap), not the window.
- **Lowering a gauge floor looks like moving goalposts.** It is defensible here only because 0.60 was a model starting value, the direct guard on tension (level success per band) is being *armed*, and Christian gets the veto line. THR-1575's rule ("never restore floors to hit a KPI") is about the dice; it is honoured.
- **Seed noise.** Bands have 50–140 engagements per run, so per-seed success swings ±0.06. The plan's claims are pooled. The kill criteria are per seed only where the invariant test is per seed (42/99).

## Vision premises leaned on

- North star: "the player hesitates".
- Rulebook: "skill decides which ones … long odds are the god's to impose".
- THR-1575 goals: variety, tension, progression, theme; traps 1 and 2.
