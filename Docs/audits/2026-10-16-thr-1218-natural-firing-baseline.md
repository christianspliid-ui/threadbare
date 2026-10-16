# Natural-firing baseline — THR-1218 (2026-10-16)

Design evidence for the [encounter firing pruning plan](../plans/2026-10-16-thr-1218-encounter-firing-rhythm.md). The THR-907 firing verdict ("rhythm works — prune later", 2026-08-10) was ruled on spawn links only. This is the free-play observation its ticket demanded before any pruning.

## Setup

- `main` at `617802fb`. Medium map, seeds 42 / 7 / 1234, 600 ticks each (50 game days; `TICKS_PER_DAY = 12`, `src/data/attention-constants.ts`).
- World built as `scripts/firing-census.ts` builds it, then `devSeedTheFirst(state)` + `touchStructure(runtime)`: the same bond `?seeded` writes, so The First is a pause-mode thread (THR-1715 E1).
- No spawn levers. Every new unified action is harvested per tick; every encounter notification is recorded as *pause* (`autoResolveTick === null`, the kind that opens the veil and halts the clock), *auto*, or *aftermath*.
- An "encounter" is a template id starting `encounter.` or `enc.` (1,507 other actions — crafting, town, faction — are excluded). A **story chapter** is a non-routine encounter (THR-1715 E2: routine = authored `threatRating: 'trivial'`).
- Scripts: [`natural-firing-baseline.ts`](2026-10-16-thr-1218-natural-firing/natural-firing-baseline.ts), [`analyse.cjs`](2026-10-16-thr-1218-natural-firing/analyse.cjs). The headless world never gains a second thread, so "threaded" means The First alone (three agents, one per seed).

## 1. Who fires

| Group | Encounters | Per 100 ticks | Per day |
|---|---|---|---|
| All living mortals (~1,027) | 8,810 | 0.48 | 0.06 |
| **The First** (threaded, pause mode) | 147 | **8.17** | **0.98** |
| Unthreaded spotlight agents (~20 / world) | 8,584 | 23.6 | 2.83 |
| Notable / ambient | 79 | ≈0 | ≈0 |

Only 3.4% of encounters came from seeds; 96.6% are free draws.

## 2. What reaches the player

- 99 of The First's 147 encounters (67%) are **routine** and never notify (THR-1715 E3).
- 48 are story chapters (counting the system-sourced `apotheosis.ascension`); 41 are her own draws (`source: 'agent'`).
- **24 of the 48 opened a pause-mode step** (a halt). The other 24 produced an aftermath notice only. The same templates appear on both sides (e.g. `barter_with_travelers` 5 halting, 6 not), so the split is state-dependent, not template-dependent. The likely cause is the headless harness: nobody dismisses a veil, and `runEncounterAutoOpenScan` holds "one auto-interrupt at a time". **Not confirmed**; S1 of the plan checks it in the browser.
- No other agent produced a notification of any kind.

## 3. The First's story rhythm (her own draws)

| Seed | Story chapters, own draws (600 t) | Per 150-tick quarter (incl. system) | Gaps between story chapters (ticks, sorted) | Distinct templates |
|---|---|---|---|---|
| 42 | 18 | 3 · 6 · 6 · 6 | 24 24 24 24 25 25 25 25 25 26 26 29 30 40 45 45 **90** | 6 |
| 7 | 10 | 3 · 2 · 3 · 3 | 23 25 26 65 67 70 72 84 **142** | 7 |
| 1234 | 13 | 4 · 2 · 5 · 5 | 23 24 29 34 36 39 41 51 53 64 80 **82** | 7 |

- The story breath binds: the floor of every gap is 23–26 ticks, `PAUSED_STORY_BREATH_TICKS = 22` plus the chapter's own length.
- **Repetition is the loudest signal.** Seed 42: `barter_with_travelers` ×5, `shadow_in_the_night` ×5, `healers_oath` ×4 of 18. Seed 1234: `barter_with_travelers` ×4 of 13. The repeat brake today is `FIRST_CHAPTER_REPEAT_FLOOR_TICKS = 60` per template plus retirement at `MAX_COMPLETIONS_PER_TEMPLATE = 5` (`src/data/agent-behavior-constants.ts:763, :716`): a chapter may come back every ~5 days, five times.
- **Family repetition is not a problem.** Keyed on `encounterType` (or the id's first two segments when blank), a story chapter followed its own family 1 time in 43 consecutive pairs. Across all agents and all encounters the same family follows itself 15.9% of the time, the same template 0.07%.
- **Droughts happen.** Seeds 7 and 1234 went 64–142 ticks (5–12 days) between story chapters.

## 4. Tier

Among agents who fire, capability tier barely moves the rate (journeyman 3.10 / expert 2.90 / master 2.55 per day). Novices are almost all ambient and never fire.

## Read in game terms

The "everything fires" posture the verdict accepted no longer exists for the player: THR-1715 already pruned it (chores never ask; a two-day breath after every story chapter). What a player following The First over fifty days would notice is **the same few stories coming back** (one tale five times) and **long stretches where she has no story at all**, not too many interruptions.
