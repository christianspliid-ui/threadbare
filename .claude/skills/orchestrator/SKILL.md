---
name: orchestrator
description: The lane that decides what happens next — reads the Blocked by half of coordination blocks and promotes unblocked work to Ready for Dev (T1), authors design when the program shelf runs thin (T2), and owns architecture-health surfacing as a standing daily duty (T3). Runs hourly as tb-orchestrator. Never claims an issue, never sets In Dev, never writes Design/briefing.md.
last_validated_against: 2026-07-31
---

# Orchestrator

## Purpose

Threadbare has an executor (`tb-opus-pickup`, hourly, WIP=1) and several observers. Until THR-826 it had **nothing that decided what happens next** — every other lane is downstream of a decision someone else made. That role was Christian, in hand-started sessions, which is why four authorised Nudge workstreams sat untouched for four hours on 2026-07-27 while a report correctly said they had been "routed to an executor" that no lane reads.

This skill is the decider. Three tiers, cheapest first:

| Tier | Cadence | What it does |
|------|---------|--------------|
| **T1** unblock sweep | every run | Reads `Blocked by`, resolves against issue states, promotes unblocked work to `Ready for Dev` |
| **T2** design authoring | when the program shelf is thin | Runs `design-session` on agreed-but-undesigned work, hands off with a coordination block |
| **T3** architecture health | daily, first run after `ORCH_HEALTH_SWEEP_HOUR` | Runs existing detectors, diffs against the last sweep, reports **new** findings |

**Design doc:** `Docs/plans/2026-07-27-thr-826-orchestrator-lane.md`. **Authority boundary (D1–D7):** `Docs/plans/2026-07-27-orchestrator-lane-grill-me.md`, recorded as a mandate in `Docs/ways-of-working.md` § *Agent initiative — what may begin without being asked*. Read the mandate before acting; it is what authorises this lane to begin work unprompted.

## Non-negotiables

These four are the difference between an orchestrator and a second executor. Breaking any of them breaks the thing this lane exists to feed.

- **Never claim an issue. Never set `In Dev`. Never assign yourself.** `tb-opus-pickup` owns the single WIP=1 slot. An orchestrator that claims work starves the executor it exists to keep fed.
- **Never write `Design/briefing.md` or `Design/user-actions.md`.** `keep-work-flowing-cc` owns both files; a second writer produces merge conflicts (CLAUDE.md hard rule). Christian-facing items go under `## Needs Christian` in this lane's own report and reach him via the hourly briefing (see § Reporting).
- **Never choose direction.** Promoting *agreed* work is the remit (D2). Picking an un-agreed roadmap item is choosing direction, which is Christian's. When agreed work is exhausted, **stop and ask** — do not fall through.
- **Never nominate a feature as unfun** (D6 case 3). Christian initiates those dialogues from a gameplay point of view. *Redundant / unused / unreachable* is a technical judgement and **is** yours to raise, unprompted and continuously (D7).

## Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `ORCH_CRON` | `25 * * * *` | Hourly, clear of the `:01` executor and `:45` briefing |
| `ORCH_PROGRAM_WORK_FLOOR` | `2` | Non-`Deferral` items in Ready for Dev below which T2 authors more |
| `ORCH_MAX_IN_DESIGN` | `1` | Concurrent `In Design` issues this lane may hold |
| `ORCH_PROMOTE_BATCH_MAX` | `5` | Promotions per run; caps the blast radius of a parsing bug |
| `ORCH_HEALTH_SWEEP_HOUR` | `6` | Local hour after which the daily T3 sweep runs once |
| `ORCH_STALLED_PICKUP_THRESHOLD` | `3` | Claims without a merge before an issue is surfaced as stalled |
| `ORCH_ESCALATION_CHANNEL` | Discord `1530183488333152287` | Non-blocking question channel |
| `ORCH_REPORT_DIR` | `Docs/ops/` | Where `orchestrator-YYYY-MM-DD[letter].md` is written — one file per run, never appended to (§ Reporting) |

## T1 — Unblock sweep (every run)

The cheap tier, and the one that pays for the lane. Every handoff since THR-688 carries `Blocked by` / `Parallel-safe with` / `Mutex with`. The executor consumes the **mutex** half at claim time and does it well. **Nothing has ever consumed the dependency half**, because nothing promoted — so this tier is largely reading a field the project has maintained for four months.

### 1. Scan

Two state-filtered calls. **Never one unfiltered sweep** — `list_issues limit:250` returns ~390k characters and is rejected outright on response size (THR-686).

```
list_issues(team:"Threadbare", state:"Todo",          limit:50,  includeArchived:false)
list_issues(team:"Threadbare", state:"Ready for Dev", limit:100, includeArchived:false)
```

The second call is not for candidates — it measures **shelf depth**, which gates T2 and informs the promotion ceiling below.

### 2. Parse the dependency half

For each `Todo` / `Idea` candidate, extract blocker references from the description. Three forms occur in practice and all three count:

| Form | Example |
|------|---------|
| Explicit coordination line | `Blocked by THR-786.` |
| Prose gate | `Do not start until THR-615 is Done.` · `hard-blocked on THR-615` |
| Time gate | `Run ~1 week after THR-654 lands.` |

**A time gate is a blocker.** Resolve it as `<blocker issue>.completedAt + <stated interval>` and compare against now. If the window has not opened, decline and name the date it opens. THR-655 was declined on exactly this basis in the first live run, 13 hours short of its window.

**Phase aliases resolve to issues.** `Blocked by P3` inside a phased plan means the P3 issue of that plan — resolve it from the plan doc's phasing section, and record what you resolved it to. If you cannot resolve an alias with confidence, that is an unread dependency: decline.

### 3. Judge

Promote to `Ready for Dev` only when **every** named blocker resolves to `Done`. Otherwise decline and record which blocker held it.

Four decline reasons, all of which must name their evidence in the report:

- **Unmet blocker** — a named blocker is not `Done`. Name it and its current state.
- **Unmet time gate** — the interval has not elapsed. Name the date it opens.
- **Unresolvable reference** — the blocker names a non-existent issue, or an alias you cannot resolve. Log the line **verbatim**. Never promote on an unread dependency.
- **Wrong destination** — the ticket says it needs design first (`Needs its own design finalization before Ready for Dev`). Blockers being met does not make it dev-ready; it makes it **T2's** input. Route it there, do not promote it.

**Promotion ceiling.** Cap at `ORCH_PROMOTE_BATCH_MAX` per run. Additionally: **do not promote into a backed-up shelf.** If Ready for Dev already holds more than `QUEUE_BACKED_UP_MIN` (15, the threshold `keep-work-flowing-cc` uses) items, promote at most one per run — planning is already outrunning execution, and adding to the pile makes the executor's ordering problem worse, not better. Say in the report that the ceiling applied and which candidates it held back. **A held-back candidate is named, with its evidence, so a throttled promotion is visibly deferred rather than silently dropped.**

### 4. Write, then verify

```
save_issue(id, state:"Ready for Dev")
get_issue(id)          # confirm the state actually stuck
```

`save_issue` returns 200 without always persisting (impediment #48). **Re-query after every write.** On mismatch: log it, leave the issue alone, let the next run reconcile. Never assume the write landed.

**Do not set priority.** The existing priority field already sequences the executor correctly; a second ordering mechanism would drift from it (settled scope trap — do not re-litigate). Promotion changes state only.

**Do not set assignee.** Promoted issues enter the queue `assignee:null`, which is what the executor's pickup filter requires.

**Filing a new issue needs a second write to get there (THR-845).** Promotion is an *update*, and an update that omits `assignee` leaves it alone — so the rule above is self-enforcing on that path. Filing a T1/T2 child is a *create*, and **Linear's create path defaults the assignee to the API actor**. Passing `assignee: null` to the create call does not prevent it: that was tried on THR-859 (2026-07-30 01:30Z) and the issue was still born assigned. Only a separate follow-up update clears it:

```
save_issue(team:"Threadbare", title:…, state:"Ready for Dev", …)   # returns new id
save_issue(id, assignee:null)                                      # separate update — the one that works
get_issue(id)                                                      # verify: no `assignee` key present
```

**A null assignee is an absent key, not `assignee: null`** — and absence only proves null on a `get_issue` re-query. The create response also omits the key while the issue *is* assigned, which is exactly how the THR-859 run reported "verified null" and was wrong. Getting this wrong is silent: `pull-work` treats an assigned queue item as a candidate but no longer filters it out, so the cost is now a reported number rather than an invisible ticket — but the ticket still enters the queue mislabelled until `stale-claim-sweep`'s queue-assignee pass repairs it.

### 4b. Post a coordination block — a promotion without one is a promotion the executor refuses

**This is not optional bookkeeping; it is what makes the promotion usable.** `pull-work` Step 3 validates the *latest comment* on a candidate for three required lines — `Suggested model`, `Parallel-safe with`, `Mutex with` — and **bounces the issue without claiming it** when any is missing. An issue promoted into `Ready for Dev` with no coordination block therefore sits at the top of the queue being refused every hour, which is worse than leaving it in `Todo`: it looks available, blocks nothing, and silently starves the lane.

**This binds the create path too, not only promotions (THR-836).** Filing a T1/T2 child *straight into* `Ready for Dev` (the two-write create above) produces an issue with zero comments — born failing this same gate, and with no later promotion step that would ever author one. So the create sequence is three writes, not two: create, clear the assignee, **post the block**. `pull-work` Step 3 now derives a block at claim time for a self-scoped ticket rather than bouncing it, so the failure is no longer a stalled lane — but a derived block is a guess reconstructed from the description, where yours is written by the party that actually chose the scope.

So every T1 promotion — and every direct filing into `Ready for Dev` — posts a comment carrying:

- **The promotion evidence** — which blocker, what state, what date it cleared. This is the audit trail that makes a wrong promotion diagnosable.
- **The three coordination lines.** Derive `Mutex with` from the files the ticket will actually touch and **state the reason inline** (`Mutex with: THR-XXX (both edit <file>)`) — THR-688 rule B, and an executor may only reverse a mutex whose reason is verifiably inapplicable.
- **A `Blocked by:` line reading `nothing`**, naming the now-Done blocker. This keeps the field truthful, so a later sweep does not re-parse the original prose gate and decline the issue it already promoted.
- **The evidence shape** the Done-when needs (browser for UI-pillar surfaces only; engine/content accepted via CLI/headless sweeps — THR-688 rule C).

**Never write `Fixes` / `Closes` / `Resolves` in front of an issue id in this comment.** Reference issues as bare `THR-XXX` tokens. The auto-close workflow is line-anchored (THR-738), but the safe habit is unconditional — a promotion comment must never be able to close the thing it promotes.

### 5. Trace

Every decision emits one line, naming the issue and the evidence, so a wrong promotion is diagnosable after the fact:

```
[orchestrator] T1 promote THR-619: blockers THR-615(Done 2026-07-05) → Ready for Dev (program: Thematic Pressure & Living World)
[orchestrator] T1 skip THR-655: time gate — THR-654 completed 2026-07-21T08:48Z, window opens 2026-07-28T08:48Z
[orchestrator] T1 skip THR-790: blocker THR-786(Done) met, but ticket requires design finalization first → T2
[orchestrator] T1 hold THR-621: promotion ceiling reached (shelf 24 > 15, 1 promoted this run)
```

## T2 — Design authoring (when the shelf runs thin)

**Trigger:** fewer than `ORCH_PROGRAM_WORK_FLOOR` non-`Deferral` items in `Ready for Dev`. Deferrals are excluded deliberately — the executor files them under itself, so counting them is what let the shelf read "healthy" (19–23 all week) while authored program work sat in `Todo` indefinitely. Counting only program work is the measurement that closes that loop.

**Bound:** never hold more than `ORCH_MAX_IN_DESIGN` issues in `In Design` at once.

**Procedure:** take the top agreed-but-undesigned item, invoke the `design-session` skill, and hand off per its flow — plan doc committed via its own `docs/plan-*` PR, path in **both** the issue description and the handoff comment, coordination block on the handoff.

**What counts as agreed** (D2, verbatim): *"expanding on already agreed designs and patterns and fixing bugs is within the remit... we create the vision, the patterns, the overarching architecture, the prototypes, the game systems together, but when that context is clear i am not interested in second guessing."*

So: an item belonging to a program Christian has blessed, or a bug, is agreed. A new direction is not. **There is deliberately no `agreed` label** — a marker he must remember to apply is friction at the moment he is most done with the conversation, and it fails silently when forgotten (R1, overruled and retracted). The weight moves from bookkeeping to *asking well when unsure*.

**When agreed work is exhausted: stop and ask.** Post the question to `ORCH_ESCALATION_CHANNEL`, park that item, continue with the rest of the run. Do not pick an un-agreed roadmap item to stay busy.

## T3 — Architecture-health duty (daily)

Runs once per day, on the first run after `ORCH_HEALTH_SWEEP_HOUR`. This tier exists because Christian **explicitly disclaims the skills to judge it** (D7), which means there is no fallback reviewer — unsurfaced architectural decay is not caught later by anyone.

### Reuse the detectors that exist

Do not build a new sweep. These already run:

| Detector | Command | Sees |
|---|---|---|
| Interface map | `npm run generate-interface-map:dry` | `LEAKED` contracts — cross-system reads that escaped their boundary |
| Rank/reach sweep | `npm run sweep:rank-reach` | Rank and reach coverage gaps |
| Process lint | `npm run check:process` | Plan-doc index staleness, systems-inventory drift, authoring-brief and wiki-freshness gaps |
| Canon staleness | `npm run check:canon-staleness` | Canon pages that have aged past their sources |

`__DEBUG.validateTraitRefs()` is named in the plan as a detector, but it is a **browser-only bridge method** and cannot be invoked from a scheduled headless context. Do not report it as run. If trait-ref coverage matters for a given sweep, say that it was not measured and why — an unmeasured check reported as clean is the exact pathology this tier exists to catch.

### Diff, don't dump

Report **new** findings only, diffed against the previous `orchestrator-*.md` in `ORCH_REPORT_DIR`. A tier that re-lists the same forty findings every day trains its reader to skip it, which makes it indistinguishable from a detector nobody runs.

### The two things no existing detector does

1. **Redundancy, not reachability.** D7 covers *redundant* systems — two implementations doing one job. **Both are reachable, so no reachability sweep will ever flag them.** This is a genuine judgement pass over `Docs/canon/interface-map.md` and `Docs/canon/systems-inventory.md`, not a script.

   **Do not ship a reachability result labelled as a redundancy result.** That is a green check on an uncovered condition — the pathology this repo has logged eleven times in four days. When the judgement pass did not happen in a given sweep, the report says *"redundancy: not assessed this sweep"*. Accept that this is the weaker half and say so, rather than implying coverage.

2. **Stalled-work detection.** An issue claimed `ORCH_STALLED_PICKUP_THRESHOLD` times without a merge is failing repeatedly and nothing currently notices. Read `stateHistory` for repeated `Ready for Dev → In Dev` transitions with no `Done`, and surface the count.

## Reporting

**One file per run — never append to a file a previous run created.** The first run of a UTC day writes `Docs/ops/orchestrator-YYYY-MM-DD.md`; every later run that day writes `Docs/ops/orchestrator-YYYY-MM-DD<letter>.md`, starting at `b` and continuing `c`, `d`, …. Pick the letter by listing `ORCH_REPORT_DIR` for today's prefix and taking the next unused one.

This is structural, not stylistic (THR-849). The lane used to prepend each run's section to the **top** of one dated file, which made that first line a shared anchor: when two runs' PRs overlap, both edit it and the second lands at `mergeStateStatus: DIRTY`. Armed auto-merge cannot resolve a conflict, so such a PR sits open indefinitely — PR #1031 sat that way for two days holding the only copy of its run's T1 sweep, and had to be recovered by hand. Separate files share no anchor, so the conflict becomes impossible rather than merely unlikely, and the filename carries the ordering that `merge=union` cannot (union keeps both sides of a hunk, in no guaranteed order).

`.gitattributes` also grants `Docs/ops/orchestrator-*.md merge=union` as a backstop for anything that still shares a file. That is what catches a mistake; one-file-per-run is what prevents it. Do not read the backstop as permission to append.

Structure:

```markdown
# Orchestrator — YYYY-MM-DD (run <letter>, ~HH:MMZ)

## Needs Christian
(plain language, THR-608 — or "nothing needs you")

## T1 — unblock sweep
(promoted / declined / held, one line each, every line naming its evidence)

## T2 — design authoring
(triggered or not, with the shelf count that decided it)

## T3 — architecture health
(new findings only; explicitly say which detectors ran and which did not)

## Escalations
(questions asked, items parked)
```

**`## Needs Christian` is the interface to him** — `keep-work-flowing-cc` step 2.6 reads this section out of the newest sibling report and folds it into the briefing. That link was **missing** until THR-826 added it: reports were being written under `Docs/ops/` with `## Needs Christian` headings that nothing read, which is the same defect as "routed to an executor" with no consumer. If a change ever breaks that step, this lane's Christian-facing output goes silently nowhere — treat it as load-bearing.

Write in plain language (THR-608). Christian does not read Linear, diffs, or PRs. Technical verdicts — CI state, merge mechanics, not-a-defect calls — are the agent's to make and do not belong in this section.

## Committing

- **Never run a git state op with the home tree as CWD** (THR-672). `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` is a read-only mirror of `main` owned by `threadbare-autosync.ps1`. Work in this session's own worktree; branches are repo-global.
- Commit the report with **no** `Fixes` / `Closes` / `Resolves THR-XX` keyword — that would auto-close unrelated issues (impediment #140). The workflow is line-anchored (THR-738), but the safe habit is unconditional: reference issues as bare `THR-XXX` tokens.
- Open a PR, queue it with `gh pr merge --auto --merge`, and move on. Do not poll-wait on CI (THR-675).
- **If a prior run's report PR is still open, leave it and its branch alone.** Write your own per-run file and carry on — never append to the file that PR touches, and never push to its branch: another lane may still have it checked out, which is the THR-671/672/797 hazard class. If it reads `DIRTY`, note it under `## Escalations` and file a ticket for the executor lane to salvage the stranded section; do not resolve it in-run. That is how THR-849 itself was filed, and why its section survived.
- A no-change run skips the commit entirely; the task's `lastRunAt` is the heartbeat.

## Fail-soft

| Failure | Fallback |
|---|---|
| Linear unreachable | Skip promotion entirely; note in report; next run reconciles |
| `save_issue` 200 but state unchanged | Re-query after every write; on mismatch log and leave for next run — never assume |
| `Blocked by` unparseable or names a non-existent issue | Skip that issue, log the line verbatim; never promote on an unread dependency |
| A detector script fails or times out | Record "detector unavailable this sweep"; **never report a failed detector as a clean result** |
| Discord unreachable | Note in report; item stays parked; next run retries |
| `keep-work-flowing-cc` link missing | Report still written; loud line so the gap is visible rather than silent |
| Agreed work exhausted | Stop, ask, do nothing else — explicitly not a fall-through to un-agreed work |

## What this is NOT

- **Not an executor.** Never claims, never implements, never sets `In Dev`.
- **Not a groomer.** `daily-backlog-grooming` owns hygiene (orphan projects, state contradictions). This lane owns *sequencing*.
- **Not a PM reporter.** `keep-work-flowing-cc` owns the briefing and the Discord doorbell. This lane produces one report and lets that task surface it.
- **Not a direction-setter.** It advances work already agreed. Choosing what the game should become stays with Christian.
