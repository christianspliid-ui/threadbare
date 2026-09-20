---
lane: tb-orchestrator
run: 2026-09-20e
promoted: 0
filed: 1
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-20 (run e, ~16:35Z)

## Needs Christian

**Nothing new needs a decision from you.** The thing run d said was stuck got unstuck at lunchtime-plus-two — and then hit a different wall, which I have now fixed the only way this lane is allowed to: by writing down exactly what is wrong and putting a repair job on the queue for the next builder.

Worth knowing, because it is the first time today the answer is not "waiting on you": **the build queue is no longer empty.** There is one job on it, and it is the job that stops the same test from blocking finished work every day this week.

**Your two standing asks are unchanged, and both still matter more than anything above.**

**1. One design chat.** Say *"design THR-1479"* — [the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by). [THR-1448, a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) comes after it. Waiting since 11–12 September with nothing blocking either.

**2. Finish the encounter sitting** you started on 12 September — the five links are on [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Nine days open; a "yes" there is what unlocks the next large chunk of work.

## T1 — unblock sweep

Shelf on arrival: **0** in `Ready for Dev`. **1** in `In Dev` — [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver), still not landed; see T3.

`Todo`: **26**, the same set as runs a–d. **15 are wayfinder-labelled** → skipped unconditionally to T1.5. The other **11** decline as run a recorded them; not reprinted for the fifth time in one day.

**Promotions: 0.** Neither ceiling bound engaged (batch max 5; backed-up threshold 15). The decline reasons re-verified on the four highest-priority non-wayfinder candidates this run, because a zero shelf deserves one honest re-read rather than an inherited verdict:

| Candidate | Blocker resolves? | Declines because |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) Traits wave 2 | **Yes** — THR-786 `Done` 2026-07-26 | Body: *"Needs its own design finalization before Ready for Dev."* A met blocker makes it T2's input, not dev-ready |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) ambitions below spotlight | No blocker | Done-when 1 is a three-way direction fork its own body calls *"not the executor's to settle"* |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) non-human cast primitive | No blocker | Body: *"This is a design ticket, not a patch"* — new-node-type rule requires design before code |
| [THR-1218](https://linear.app/threadbare/issue/THR-1218) encounter firing pruning | **No** — THR-1043 still open | And *"Not Ready for Dev — needs a design pass when unblocked"* |

**Every declining candidate declines for the same reason: it needs design, not development.** That is the whole finding of the T1 tier today and it has been true for five consecutive runs.

**Filed: 1** — [THR-1517](https://linear.app/threadbare/issue/THR-1517/the-multi-tick-arms-in-orchestratortestts-have-no-explicit-timeout-and), `Ready for Dev`, unassigned (verified by key-absence on a `get_issue` re-query, not on the create response — THR-845), coordination block posted as its first comment (THR-836). Details and the reasoning for filing rather than logging are in T3.

**Rule 0 / materiality:** one process ticket filed, against the throttle's default. Justification is recorded in full in T3 rather than asserted here. **Product-vs-process completion ratio, trailing 48h: unchanged at 4 product : 3 process** — unchanged because *nothing has completed*; the last merge to `main` was yesterday morning. **Headline, now five runs deep and not displaced by the ticket I just filed: the feature pipeline needs a design session.** THR-1517 makes finished work able to land. It does not make new work exist.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258). None updated since 2026-09-11.

**AFK frontier: 0** — re-verified by label rather than inherited. `list_issues label:"wayfinder:research"` returns 21 issues, **all `Done`**; `label:"wayfinder:task"` returns 5, **all `Done`**. There is no open research or agent-doable task ticket on any map. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing was claimed, resolved or closed.

**HITL frontier: 12** grilling/prototype tickets (11 unassigned; THR-1232 is Christian's), unchanged since 2026-08-26 and already carried on the briefing. Not re-listed. Method note, same as runs c and d: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Triggered, and barred.** Non-`Deferral` `Ready for Dev` was **0** on arrival (**1** after filing THR-1517, still below the floor of 2). `In Design` classifies **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1 — so nothing could be staged, for the fifth consecutive run.

**Nothing was mutated.** Neither In Design item was parked, demoted, or commented on; classification was done by hand against the documented predicate, and `scripts/stale-claim-sweep/index.ts` was **not** executed, because it posts warning comments as a side effect and a read-only tier must not mutate issues to measure them.

THR-1448 (last activity 2026-09-19T15:45Z) and THR-1479 (2026-09-19T07:18Z) both read **under 1.5 days** to the classifier and 9d/8d in truth, for the self-referential reason run a documented this morning — the staleness sweep's own warning comment is activity, so it resets the clock it measures. That finding is run a's and is not re-counted.

**One item the queue is holding that is worth naming, because it is nine days stale and nobody has re-read it:** THR-790's latest comment (2026-09-11, Christian's ruling *"you are approved to unblock everything here"*) explicitly hands the freed design slot to **THR-1348** — *"The orchestrator's T2 lane may stage it into `In Design` on its next run now that the slot is empty."* That instruction has been unexecutable every run since, because the slot did not stay empty: THR-1448 and THR-1479 took it on 11–12 September and have held it ever since. **THR-1348 is the queued next stage the moment either of those two leaves the column** — recording it here so the intent survives, rather than re-deriving it every run from a comment five screens deep.

Practical cost this run: **nil**, for the fifth time today. Staging a third item would produce a third unanswered design ask, not a third design.

## T3 — architecture health

**Not due — the daily sweep already ran today** (run a, ~10:30Z, all four detectors). Not re-run, and none of its results are restated. `__DEBUG.validateTraitRefs()` is browser-only, **was not run, and is not reported clean.**

**Redundancy: not assessed this sweep.**

**Stalled work:** none by the `ORCH_STALLED_PICKUP_THRESHOLD` predicate. THR-1516 is on its first claim; its stall is a CI-ceiling stall, below.

**In Design: 2 live, 0 excluded** (THR-1448 unassigned, 1.0d to the classifier / 9d in truth; THR-1479 unassigned, 1.4d / 8d).

Weekly test-suite health: **not due.** Today is Sunday; `ORCH_TESTHEALTH_DOW` is Monday, so the next pass is 2026-09-21 — tomorrow, and this finding is its natural first input.

### New finding (1): run d's stall was fixed, and the fix uncovered that the real blocker is a test sitting on its own timeout — sixth recurrence in four days

Run d reported PR [#1968](https://github.com/christianspliid-ui/threadbare/pull/1968) (THR-1516) `DIRTY`, blocked by its own bookkeeping PR. **That diagnosis was right and the repair worked**: the 16:04Z pickup merged `origin/main` into the branch (`07fde233`), the union on `Docs/impediments.md` resolved, and the PR left `DIRTY`.

**It then went red again six minutes later, on the arm that has been doing this all week.**

| | |
|---|---|
| Run | `35521538122`, 16:04:36Z → **FAILURE** 16:10:38Z |
| Arm | `orchestrator.test.ts > multi-tick simulation reaches doom expiry` |
| Error | `Test timed out in 5000ms` — measured **5430ms** |
| Everything else | green. `mergeStateStatus` now `BLOCKED`, auto-merge still armed |

**Recurrence history, from `Docs/impediments.md` row 1054 plus this run:** 5247ms (#1966, 09-19) → 5386ms (#1968, 14:26Z) → **5430ms (#1968, 16:10Z)**. Monotonically increasing against a 5000ms ceiling. Six armed PRs in four days; the last three on this one arm.

**The decisive datum, which is new and which changes the remedy: the arm passed at 15:11:48Z on the same tree**, between the two failures. Same branch, same test, three verdicts in one afternoon. So it is **not** a defect in any of the six diffs (none touches the doom path; every shipping session recorded the suite green locally), and it is **not** contention a rerun reliably clears. It is a 25-tick simulation costing 5.2–5.4s against a 5.0s default, with **no explicit per-test timeout** — a borderline arm whose merge verdict is decided by runner speed.

**Why this one was filed as a ticket rather than logged — stated plainly so the retro can overrule it.** The throttle says a scheduled lane logs delivery-machinery defects and the weekly retro promotes them, and runs a, c and d all correctly declined to file. Four things changed:

1. **The materiality bar is cleared several times over** — six recurrences in four days against a ≥3-per-week bar, and >2h lost on THR-1516 alone (shipped green 14:19Z, unlanded at 16:35Z) against a ~1h bar.
2. **The remedy was already decided and logged** — row 1054's own *"standing suggestion for the weekly retro"*. Filing carries an existing verdict to an executor; it does not invent scope.
3. **The throttle's own stated purpose cannot be served by waiting.** It was written (2026-08-10) because 32 of 35 Ready-for-Dev items were process cleanup crowding out features. **The shelf was at zero.** There is no feature work for this to displace, and ~15 hourly pickup runs stand between now and the retro, each of which rediscovers this from scratch — which is what runs a and d spent their hour doing.
4. **It is the one repair that makes the empty shelf matter less**, because it lets finished work land instead of sitting green-and-blocked.

What I did **not** do, deliberately: I did not record the sixth recurrence in `Docs/impediments.md`. That would mean another docs-only PR touching the file that PR #1968 is open on — the exact move that caused run d's stall at 15:09Z. It is recorded here and on the ticket instead, and this report publishes to `ops`, which touches no PR and runs no CI. **Row 1054 is therefore one recurrence behind reality until someone with a safe window updates it** — flagged for tomorrow's retro.

**The class run d named holds and is now demonstrated twice in one afternoon:** *a docs-only PR touching an append-only file merges while a code PR touching that same file is open, and silently disarms the code PR's auto-merge.* THR-1517's coordination block carries an explicit mutex on THR-1516 for precisely this reason, so the repair cannot re-trigger the stall it repairs.

## Escalations

None opened, nothing parked. The CI ceiling is a technical verdict with a known fix, now ticketed — Discord would add nothing. The two standing asks are Christian's to schedule and are carried in the briefing section above; posting them a fifth time today would add noise to a question already asked four times.
