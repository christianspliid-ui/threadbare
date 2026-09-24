# Brainstorm — War news from state (THR-1564)

Companion to `2026-09-24-thr-1564-war-news-from-state.md`.

## What the research changed about the question

The ticket framed the defect as "the phase reads traces, and traces are off". Measuring showed that turning tracing on would not have fixed it:
- **Nothing below 0.8 is visible.** With tracing on and no threads, the phase wrote 31 lines in 200 ticks and none reached a surface the player sees. Only the Chronicle panel shows war lines, and it takes ≥ 0.8. Strangers' lines are 0.2 and the territory line is 0.7. `NarrativeFeed` and `EventLog` are not mounted.
- **Three of seven line kinds never fire:**
  - army raised, because of phase order;
  - army disbanded, because the node is gone before visibility is checked;
  - siege breach, because its writer has no caller.
- **The messages are debug summaries with numbers in them.**

So the fix is not "read state instead of traces" alone. It is "report at the site, in words, loud enough to be seen".

## Options for the source of truth

| Option | Why not / why |
|---|---|
| **A. Keep the phase; make tracing always on** | Traces are off for performance by design, and the ring evicts at 2000 entries on busy ticks. It also keeps the phase-order and visibility defects |
| **B. A queue on state (`pendingWarNews`) drained by the phase** | It works, and keeps the formatting in one place. But it adds a `GameState` field (624 importers) and a one-tick delay for army raisings, and the loser's visibility still has to be snapshotted at the site anyway |
| **C. Report at the site into `state.tickEvents`** | **Chosen.** Every site has state in scope and runs before the chronicle promotion, and the pattern already exists (`phaseLocationTraits`, `revelationEmitter`). Visibility is judged while every node still exists. One function, `reportWar`, keeps the formatting and visibility in one place anyway |

## The loudness choice

The ticket's one creative fork. The rulebook already states the intent ("a war among strangers reaches you only as chronicle"; "the seizure surfaces as a chronicle line"), so the plan follows the canon rather than inventing:
- **Endings of every battle and every town changing hands reach the chronicle.** That is roughly one line a day on a medium map.
- **Beginnings (raised, joined, laid) reach it only when you are threaded in.** Strangers' beginnings would double the volume for little story: a war you are not in matters when it ends, or when it takes a town.
- **Army fraying stays out of the chronicle.** It is the most frequent line (53 threshold crossings a run), and it reads as bookkeeping.
- **Toasts are out.** Interrupting the player for a war they are not in is a different decision, and no war line carries a directive today.

Presented to Christian with a veto invited, under process.md rule 4.

## Interaction with THR-1528

The blood-soaked plan put its trait's mint line at chronicle loudness (0.85) because battles were otherwise invisible. With every battle ending in the chronicle, that line would repeat the news, so it drops back to 0.4, whichever ticket lands second. The two share one battle-ending sentence builder.

## Found while researching, not in scope

- Three different "threaded" predicates exist: `buildThreadedAgentSet`, `hasThreadToBattle` and `collectThreadedAgents`. The plan keeps the first for war news, as the ticket asked.
- Warhosts (`raiseWarhostForce`) emit no trace and would report nothing. They are a separate army kind; noted for the war canon.
- The siege-breach writer has no caller.
- The UL *Narrative Event* entry inverts the chronicle rule. It is corrected in the implementation PR.

## Vision premises touched

- `00-north-star.md:43`: a story the player can tell in prose. A war never heard of is not one.
- `02-non-negotiables.md:23`: narrative over mechanical perfection.
- The war stays witnessed, never commanded.
