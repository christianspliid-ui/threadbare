---
lane: tb-orchestrator
run: 2026-09-10e
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-10 (run e, ~07:27–07:45Z)

**The picture run d reported has been overtaken. The builder is not starved any more.** Run d's headline at 05:27Z was *"the builder has stopped — the queue is empty."* Between 06:36Z and 07:25Z the board moved more than it had in the previous twenty-four hours: Christian answered the question run d led with, an attended design session turned that answer into work, a grooming lane surfaced one more, and the shelf went **0 → 7**. This run promoted the eighth and caught one factual error that would have sent an executor into a file another session is holding.

## Needs Christian

**Your answer this morning worked, and here is what it bought.** You ruled on the claimed-town question (*"it is a commitment and probably also a faction position"*) in chat. Within the hour: the fix is being built, a new design ticket was written from the second half of your sentence, and six other jobs were unblocked and queued. The builder went from idle to working. That is the whole loop, start to finish, in about fifty minutes — worth naming, because it is the answer to *"why does the queue keep emptying."*

**One more question of exactly the same shape is now the thing blocking real content work.** It takes about a minute and the recommendation is already written down.

**Does every aftermath line need its concept tags, or only some?**
[THR-1053 — the Composition Contract's `concepts` rule](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)

Two documents disagree. The content rulebook says every aftermath change must carry concept tags; the code that reads them documents them as optional. Somebody checked the shipped code and **the code is right** — the tags are decoration on top of a sentence that already links up fine without them.

Why it matters now: this one rule is the **only** thing failing on 14 of 14 older encounters and on six of the eight slice encounters. Two encounters — *Snow on the Pass* and *Riders Behind the Caravan* — have now been **written out of two consecutive content batches across three weeks** because nobody will author against a rule that might flip. It is the last thing standing between the encounter retrofit and finishing, and that retrofit is the only non-deferral job on the builder's shelf.

*The recommendation on file is to narrow the rule* — make the tags optional, since the linking they were supposed to guarantee already happens without them. The only reason it is coming to you rather than being decided is that narrowing it edits a plan rule you personally ruled on ("no exemptions"). Say *narrow it* and the retrofit unblocks the same day.

**Still open, deliberately not re-asked:** the [Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)'s ten questions (all legwork finished a week ago), [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) (whose story does a run tell — your god's memory, or a named campaign), the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no, and the [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server).

**Nothing was padded.** The same eight tidying jobs that would make the queue look busy were left alone for the fifth run running.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Held: 0.** Promotion ceiling never engaged — shelf at 7 on entry, far below the 15-item backed-up threshold, so the full batch of 5 was available and only one candidate earned it.

Board at scan (~07:27Z): **35 `Todo`** (15 `wayfinder:*`, skipped unconditionally) · **7 `Ready for Dev`** · **1 `In Dev`** ([THR-1287](https://linear.app/threadbare/issue/THR-1287), assigned, actively working) · **1 `In Design`** ([THR-790](https://linear.app/threadbare/issue/THR-790)).

### What moved the board before this run got to it

Neither of these was this lane's doing, and both are recorded because run d's report is now misleading without them:

- **An attended design session, ~06:36–06:57Z.** It answered THR-1287's escalation, filed [THR-1448](https://linear.app/threadbare/issue/THR-1448) from the second clause of Christian's reply, and promoted **six** standing declines — THR-1195, THR-1114, THR-1315, THR-1424, THR-1426, THR-1446 — each with a recorded decision *and* a full coordination block. Spot-checked THR-1195: the block carries all three required lines plus the ruling that unblocked it. **The shelf is well-formed; `pull-work` Step 3 will not bounce any of it.**
- **The `daily-backlog-grooming` lane, 07:19Z.** Promoted THR-1053 `Idea` → `Todo` and **marked it blocking THR-1130**, deliberately stopping at `Todo` (*"it needs a design pass to write the ruling, not an executor, and inventing a coordination block for a decision I am not making would be worse than leaving the routing honest"*). That is the correct call and this run did not override it.

### Promoted — [THR-1450](https://linear.app/threadbare/issue/THR-1450/use-location-banks-zero-wealth-in-every-live-run-the-harvest-is-an)

*`use × Location` banks zero wealth in every live run.* Filed 07:25:44Z out of THR-1287's closeout; promoted 07:31:05Z, six minutes later. Verified `Ready for Dev` on a `get_issue` re-query, no `assignee` key present.

**Why it promotes when six design tickets did not: the Done-when is a live falsifier, not a recorded decision.** It asks for *"a `wealth_delta` trace with `reason: 'draw_yield'` on a 150-tick seed-42 or seed-99 run"* — measurably absent on `main` today, 0 across both seeds. That is exactly the line that declined [THR-964](https://linear.app/threadbare/issue/THR-964) and THR-1053 this week, both of whose Done-when #1 is *"a decision is recorded."* The filer reaches the same verdict unprompted: *"either answer is a technical verdict an executor may make and record."* No blocker named in either direction, no plan doc named (liveness gate passes trivially), and its sole prior comment is a filing block, not a retire verdict.

### The correction this run's block carries — an executor was about to be sent into a live file

THR-1450 arrived with its own coordination block, filed with the ticket per THR-836. That block reads **"THR-1287 has shipped"** and **"THR-1287 (merged 2026-09-10)"**. Verified at 07:30Z, it has not:

```
THR-1287                              -> In Dev, assigned, updatedAt 07:25:44Z
git log origin/main --grep="THR-1287" -> no fix commit (both hits are August)
gh pr list --state open               -> []
```

`updatedAt` on THR-1287 is **the same second** THR-1450 was created — the session that filed the deferral is still working the parent. The two tickets are mutex (both edit the instant arm of `executeStrategicAction`), so an executor trusting the block's tense would have opened a file another session is holding. The promotion comment states the mutex as **LIVE** and names the two commands that settle it. The filing block's own instruction was already right — *"verify it has merged before starting rather than assuming"* — only its premise had run ahead of the board. **This is a tense error in a block, not a defect in the filing discipline**, and it is below the materiality bar: logged here, not filed.

### Declined this run

| Ticket | Verdict | Evidence |
|---|---|---|
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) — a held town is a faction position | **Decline ×2: wrong destination, and unmet sequencing gate** | Body: *"a design ticket; plan doc before code"*; Done-when is *"Plan doc in `Docs/plans/` … intent-judged and three-way audited."* Separately: *"Sequencing: after THR-1287 lands"* — THR-1287 is `In Dev`, not `Done`. → T2 |
| [THR-1053](https://linear.app/threadbare/issue/THR-1053) — the `concepts` rule | **Decline, wrong destination — routing already correct** | The groomer lane placed it in `Todo` four minutes before this scan with its reasoning recorded. Not re-derived, not overridden. → T2, and surfaced under `## Needs Christian` because the ruling is one sentence |

**Standing declines — carried, not re-derived:** THR-1301 · THR-1380 · THR-1088 · THR-984 · THR-1024 · THR-175 · THR-1189 · THR-1148 · THR-1318 · THR-1393 · THR-1218 · THR-1026 · THR-964 · THR-1198 · THR-716 · 15 `wayfinder:*` · THR-1220 · THR-1133 (attended) · THR-1274 · THR-1381 · THR-1156 · THR-789 · THR-1155 · THR-1043 · THR-870 · THR-791. **Six names left this list by promotion this morning** (THR-1195, THR-1114, THR-1315, THR-1424, THR-1426, THR-1446) and one by this run (THR-1450) — the first net drain the list has had in a week.

### The eight tidying tickets — still not promoted

THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. **Fifth consecutive run holding this line, and the argument has changed shape rather than weakened.** Run d declined them because an empty shelf is *"a starved shelf, not a license to binge."* The shelf is now 8, so the starvation clause no longer applies — but neither does any reason to promote them: none clears the materiality bar (no quotable above-bar loss, no cost/benefit line), and product work comes first while the shelf holds product work. Recorded so the restraint reads as a decision under the *current* board, not an inherited habit.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — re-measured this run, not carried forward.**

```
list_issues(label:"wayfinder:research")  -> 21 issues, all Done
list_issues(label:"wayfinder:task")      ->  5 issues, all Done
```

**Eighth consecutive sweep finding no agent-doable decision ticket on any open map.** Every open child across the three maps is `grilling` or `prototype` — HITL by label, untouchable by rule.

- **[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children (THR-1263 … THR-1272), all HITL, none assigned. All four research tickets `Done`. Largest HITL debt on the board with zero remaining legwork.
- **[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** — sole open child THR-1232, assigned to Christian.
- **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** — one unassigned prototype, THR-1236.

No map body edited — this lane resolved nothing, so Decisions-so-far gains no line.

## T2 — design staging

**Triggered on the letter, barred by the bound, and not materially needed this hour.** All three clauses matter and they point different ways.

Non-`Deferral` items in `Ready for Dev` = **1** ([THR-1130](https://linear.app/threadbare/issue/THR-1130)), against `ORCH_PROGRAM_WORK_FLOOR` of 2. The tier fired.

**`In Design` holds 1 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1 — exactly at the ceiling:

| Issue | Assignee | Last activity | Classification |
|---|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Christian | 09-08 18:32Z (1.6d) | **Live** — assigned, inside `ORCH_IN_DESIGN_STALE_DAYS` (7) |

Neither stale arm engaged. **Nothing was mutated** — no comment, no state change, no assignee touched, no label added. THR-1287 vacated the other slot by moving to `In Dev`, which is the bound working as designed rather than a lucky break.

**Why "not materially needed" is the honest third clause.** T2 measures program work because a shelf of deferrals used to read healthy while authored work rotted in `Todo`. That measurement is doing its job — 1 is genuinely below 2. But the tier exists to feed a starved builder, and the builder has **eight** jobs and is working one. A third design request would join THR-790 and THR-1448 in a queue whose only server is Christian's attention, which he already spent this morning. **The constraint moved from the build queue to the design queue during this run**, and staging one more request would have made that worse, not better. Reported rather than acted on.

**Run d's `ORCH_MAX_IN_DESIGN` wording ambiguity is unchanged and again not exploited** — neither occupant was staged by this lane, so a literal reading of *"this lane may hold"* would put it at 0 of 1. Still the wrong repair; still worth tightening to *"live `In Design` issues, however they arrived."*

**T2's candidate queue, strongest first: [THR-1053](https://linear.app/threadbare/issue/THR-1053)** (new to the top this run — it is the only candidate blocking a shelf item), then THR-1448, THR-1348, THR-1393, THR-1274, THR-1026, THR-964.

## T3 — architecture health

**Not due. Already run in full today at 04:27Z by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md)** (06:27 local, past `ORCH_HEALTH_SWEEP_HOUR`). The daily sweep is once per day, so **no detector was run this run.**

**`newFindings: 0` in this run's frontmatter means "the sweep did not run", not "the sweep came back clean."** Stated explicitly because a zero that reads as a pass is the exact pathology this tier exists to catch. Run c's two findings stand unchanged and are not restated.

**Redundancy: not assessed this sweep.** The judgement budget went to the two newly-filed tickets and the mutex verification. Saying so rather than implying coverage.

**`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, and not reported as clean.**

### Standing sub-duties

**Hand-created `In Dev` tickets: none.** THR-1287, the sole `In Dev` issue, passed through `Ready for Dev` — verified on `stateHistory`.

**Stalled work: none this run.** THR-1130's 4-transition count, flagged in run d, is no longer a live reading — it left `In Dev` at 07:20Z and is now an ordinary shelf item. Nothing else is at or above `ORCH_STALLED_PICKUP_THRESHOLD` (3).

**`In Design`: 1 live, 0 excluded** (THR-790, assigned Christian, 1.6d → live, no warn). Printing the line at 1 rather than skipping it, per the tier's own rule that a countable bound is the point.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC.

### Product vs process — the week

Trailing-week measure **~30 product / 8 process (~79% product)**, unchanged in the denominator. This run's single promotion (THR-1450) is an engine **bug fix in a game system** — product, not process. **The headline finding has changed for the first time in five runs:** it is no longer *"feature pipeline needs supply."* Supply arrived this morning. It is now *"one design ruling is holding the only program item on the shelf"* — a smaller, sharper problem than the one run d reported, and one with a recommendation already attached.

## Escalations

**No Discord ping.** This report lands ~07:45Z and the briefing rebuilds at ~07:45Z, so `## Needs Christian` reaches him through the designed channel within minutes. He was in an attended session ninety minutes ago and answered the ask that mattered; a ping now would be the fifth copy of a request whose fourth copy he has already acted on.

**The lane did not fall through to un-agreed work.** It promoted one bug, corrected a mutex claim that would have collided two sessions on one file, declined two design tickets to the tier that cannot currently open, verified the morning's six promotions carry usable coordination blocks rather than assuming it, re-measured the wayfinder frontier rather than carrying run d's number, and left the eight tidying tickets alone under a board where the starvation argument for leaving them no longer applies and no argument for promoting them appeared.

**Sub-bar notes for the weekly retro** (unchanged unless marked): the `In Design` liveness clock counting bot comments as human activity · a coordination block written into a ticket's *description* rather than as a comment still fails `pull-work` Step 3 · the canon-staleness false-positive class against the auto-generated `INDEX.md` · the shipped-under-a-sibling-id class at five instances, above the materiality bar · run c's `check:process` finding (three sub-checks silently do not run) · `ORCH_MAX_IN_DESIGN`'s *"this lane may hold"* wording · **new this run:** a THR-836 filing block may state a mutex partner's merge in the **past tense while it is still `In Dev`** — the filer writes the block at the moment it defers, before its own PR exists, so the tense is an anticipation. One instance, no cost incurred (caught at promotion); the cheap fix is for a filing block to name the partner's *state at filing* rather than its expected state, and this is a note, not a ticket.
