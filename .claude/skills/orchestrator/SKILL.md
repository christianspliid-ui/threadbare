---
name: orchestrator
description: The lane that decides what happens next — reads the Blocked by half of coordination blocks and promotes unblocked work to Ready for Dev (T1), authors design when the program shelf runs thin (T2), and owns architecture-health surfacing as a standing daily duty (T3). Runs hourly as tb-orchestrator. Never claims an issue, never sets In Dev, never writes Design/briefing.md.
last_validated_against: 2026-08-02
---

# Orchestrator

## Purpose

Threadbare has an executor (`tb-opus-pickup`, hourly, WIP=1) and several observers. Until THR-826 it had **nothing that decided what happens next** — every other lane is downstream of a decision someone else made. That role was Christian, in hand-started sessions, which is why four authorised Nudge workstreams sat untouched for four hours on 2026-07-27 while a report correctly said they had been "routed to an executor" that no lane reads.

This skill is the decider. Three tiers, cheapest first:

| Tier | Cadence | What it does |
|------|---------|--------------|
| **T1** unblock sweep | every run | Reads `Blocked by`, resolves against issue states, promotes unblocked work to `Ready for Dev` |
| **T1.5** wayfinder sweep | every run, only when an open map exists | Burns down frontier AFK decision tickets via subagents; surfaces the HITL frontier to Christian (THR-900) |
| **T2** design authoring | when the program shelf is thin | Runs `design-session` on agreed-but-undesigned work, hands off with a coordination block |
| **T3** architecture health | daily, first run after `ORCH_HEALTH_SWEEP_HOUR` | Runs existing detectors, diffs against the last sweep, reports **new** findings. Weekly on `ORCH_TESTHEALTH_DOW` it also runs the test-suite health pass (THR-942) |

**Design doc:** `Docs/plans/2026-07-27-thr-826-orchestrator-lane.md`. **Authority boundary (D1–D7):** `Docs/plans/2026-07-27-orchestrator-lane-grill-me.md`, recorded as a mandate in `Docs/ways-of-working.md` § *Agent initiative — what may begin without being asked*. Read the mandate before acting; it is what authorises this lane to begin work unprompted.

## Non-negotiables

These four are the difference between an orchestrator and a second executor. Breaking any of them breaks the thing this lane exists to feed.

- **Never claim an issue. Never set `In Dev`. Never assign yourself.** `tb-opus-pickup` owns the single WIP=1 slot. An orchestrator that claims work starves the executor it exists to keep fed. *Sole exception:* AFK `wayfinder:*` decision tickets in T1.5 — those can never reach the executor queue, so claiming one starves nothing (THR-900).
- **Never write `Design/briefing.md` or `Design/user-actions.md`.** `keep-work-flowing-cc` owns both files; a second writer produces lost updates (CLAUDE.md hard rule) — they live on the `ops` branch, where a push is last-writer-wins rather than a merge. Christian-facing items go under `## Needs Christian` in this lane's own report and reach him via the hourly briefing (see § Reporting).
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
| `ORCH_TESTHEALTH_DOW` | `1` (Monday) | Day of week the test-suite health pass runs inside T3 — weekly, not daily |
| `ORCH_TESTHEALTH_SLOW_FILE_COUNT` | `10` | Slowest test files listed in the weekly pass |
| `ORCH_WAYFINDER_AFK_MAX` | `2` | Frontier AFK wayfinder tickets (research / agent-doable task) resolved per run |
| `ORCH_ESCALATION_CHANNEL` | Discord `1530183488333152287` | Non-blocking question channel |
| `ORCH_REPORT_DIR` | `Docs/ops/` | Path `orchestrator-YYYY-MM-DD[letter].md` is written at — one file per run, never appended to (§ Reporting). Published to the **`ops` branch**, not `main`, since THR-947 |

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
- **Wayfinder issue** — anything carrying a `wayfinder:*` label (map or decision ticket, THR-900). These are decisions, not executor work, and **never enter `Ready for Dev`** — they are T1.5's input, not T1's. Skip unconditionally, whatever its blockers say.

**Promotion ceiling.** Cap at `ORCH_PROMOTE_BATCH_MAX` per run. Additionally: **do not promote into a backed-up shelf.** If Ready for Dev already holds more than `QUEUE_BACKED_UP_MIN` (15, the threshold `keep-work-flowing-cc` uses) items, promote at most one per run — planning is already outrunning execution, and adding to the pile makes the executor's ordering problem worse, not better. Say in the report that the ceiling applied and which candidates it held back. **A held-back candidate is named, with its evidence, so a throttled promotion is visibly deferred rather than silently dropped.**

### 4. Write, then verify

```
save_issue(id, state:"Ready for Dev")
get_issue(id)          # confirm the state actually stuck
```

`save_issue` returns 200 without always persisting (impediment #48). **Re-query after every write.** On mismatch: log it, leave the issue alone, let the next run reconcile. Never assume the write landed.

**Do not set priority.** A second ordering mechanism would drift from the existing field (settled scope trap — do not re-litigate). Promotion changes state only.

**Corrected 2026-08-02:** this rule used to justify itself with *"the existing priority field already sequences the executor correctly."* That premise is now false — CLAUDE.md § Prioritization **Rule 0** puts flow impediments with demonstrated cost ahead of the priority field entirely, precisely because the lanes that find them file them `Low` or `No priority`. The *instruction* is unchanged and still right (do not set priority; Rule 0 is applied at pickup, by the executor, from evidence in the ticket). Only the reasoning needed repair — left standing, it would read as an argument against Rule 0.

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

## T1.5 — Wayfinder sweep (every run there is an open map)

Wayfinder maps (THR-900, `wayfinder` skill) are multi-session design efforts charted as
decision tickets in Linear. Christian's standing decision (chat, 2026-07-31): the
orchestrator **auto-resolves AFK tickets** and routes **HITL tickets to him via the
hourly briefing**. This tier is that decision, operationalised.

### 1. Find open maps

`list_issues(team:"Threadbare", label:"wayfinder:map", state:"Todo", limit:25)`. No open
map → skip the tier entirely and say so in one report line.

### 2. Compute each map's frontier

List the map's open children (state-filtered `list_issues`, bucketed by `parentId` in
memory), then drop any with an assignee or an open blocker — blocking is **native Linear
relations** here, so read `get_issue(id, includeRelations:true)` per candidate. What
remains is the frontier: open, unblocked, unclaimed.

### 3. Burn down AFK tickets

For up to `ORCH_WAYFINDER_AFK_MAX` frontier tickets labelled `wayfinder:research` (or
`wayfinder:task` where the checklist is agent-doable): **claim** (`assignee:"me"`,
verify — the one exception to "never assign yourself", because a wayfinder ticket can
never reach the executor queue), spawn a research subagent per the wayfinder skill's
ticket-type rules, post the findings as the resolution comment, close (`Done` — the
wayfinder carve-out), verify, and append the gist line to the map's Decisions-so-far.
A subagent that fails or times out: unassign, leave open, log — never post a guessed
resolution. **Never touch grilling/prototype tickets** — resolving one AFK is the
broken-HITL failure mode the wayfinder skill names.

### 4. Surface the HITL frontier

Frontier `wayfinder:grilling` / `wayfinder:prototype` (and HITL-task) tickets go under
`## Needs Christian` in this run's report, **by name, in plain language, framed in game
terms** — e.g. *"The Dynamic Economy map has two questions waiting for you: [Should
trade routes decay without caravan encounters?](url) and [React to the unrest mock-up](url).
Open a chat and say 'work the map' when ready."* The existing briefing link
(`keep-work-flowing-cc` step 2.6) carries it from there; no new plumbing.

### 5. Trace

```
[orchestrator] T1.5 map "Dynamic Economy — wayfinder": frontier 4 (2 HITL surfaced, 2 AFK), resolved research "What does the market system already simulate?" (THR-9XX)
[orchestrator] T1.5 skip: no open wayfinder maps
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

Report **new** findings only, diffed against the previous `orchestrator-*.md` — read from `origin/ops` (`git show origin/ops:<path>`), not the working tree, since THR-947. A tier that re-lists the same forty findings every day trains its reader to skip it, which makes it indistinguishable from a detector nobody runs. Diffing against the frozen archive would re-report the whole standing set as new every run, which is the same failure wearing the opposite face.

### The two things no existing detector does

1. **Redundancy, not reachability.** D7 covers *redundant* systems — two implementations doing one job. **Both are reachable, so no reachability sweep will ever flag them.** This is a genuine judgement pass over `Docs/canon/interface-map.md` and `Docs/canon/systems-inventory.md`, not a script.

   **Do not ship a reachability result labelled as a redundancy result.** That is a green check on an uncovered condition — the pathology this repo has logged eleven times in four days. When the judgement pass did not happen in a given sweep, the report says *"redundancy: not assessed this sweep"*. Accept that this is the weaker half and say so, rather than implying coverage.

2. **Stalled-work detection.** An issue claimed `ORCH_STALLED_PICKUP_THRESHOLD` times without a merge is failing repeatedly and nothing currently notices. Read `stateHistory` for repeated `Ready for Dev → In Dev` transitions with no `Done`, and surface the count.

### Test-suite health (weekly, `ORCH_TESTHEALTH_DOW`)

**Nobody owns test-suite health** (THR-942). `testing-patterns` governs authoring, but no lane prunes or profiles, so the suite only ever grows — 931 test files as of the inaugural sweep, and the dead V1 SVG hex map ran 8 test files on every CI cycle for months before THR-941 removed it. Measured CI spend 2026-07-18 → 2026-08-01 was ~2,700 full-suite runner-minutes.

**Weekly, not daily.** A 931-file suite does not decay on a daily timescale, and re-listing the same candidates every morning is precisely the "dump" this tier already forbids. Run it on the first T3 sweep whose local day-of-week is `ORCH_TESTHEALTH_DOW`; on other days say nothing about it rather than reporting a stale result.

Produce three sections. **No new tooling** — the import graph comes from codesight or an ad-hoc grep sweep, and timings from the latest full run:

1. **Dead-coverage candidates.** Test files whose subject modules have no production importer outside their own directory *and* are unreachable from a real entry point (`src/main.tsx`, `src/App.tsx`, `src/cli/`, `scripts/`, `vite`/`vitest` config, `src/debug-bridge.ts`). Report the test file, its subjects, each subject's importer count, and when the test was last touched.
2. **Slowest test files.** Top `ORCH_TESTHEALTH_SLOW_FILE_COUNT` by duration from the latest full run, with each file's share of summed file time.
3. **Duplicated coverage.** Multiple test files exercising one module with overlapping assertions. Report-only, judgement allowed.

**Guardrails — non-negotiable:**

- **The duty never deletes anything.** Not a test, not a module, not a directory. Each prune candidate becomes **its own ticket** with the import-graph evidence attached, and an executor does the deleting after re-verifying. A sweep that deletes is a sweep with no reviewer.
- **A prune ticket must prove the *tested code* is dead — never that the test is slow.** Slowness ranks work; it is never grounds for deletion. The two lists exist for different purposes and must not be merged into one "cut these" list.
- **Deleting live coverage is the failure mode to be paranoid about, not a cost worth paying.** When in doubt, leave it and say why. Losing a real regression test costs more than every runner-minute this duty could ever save.

**Where the output goes.** The weekly pass writes its own file, `Docs/ops/test-suite-health-YYYY-MM-DD.md`, and the run report's `## T3` section carries **one line**: the three counts and a pointer to it. Two reasons — the candidate tables would bury the rest of a run report, and a standalone file gives the sweep a diffable history so next week's pass can say what is *new* rather than re-listing. It shares no anchor with the run report, so the THR-849 conflict class cannot reach it.

Three traps the inaugural sweep hit, all of which will recur:

- **A test-only helper looks dead.** `src/testing/contentInvariants.ts` has zero *production* importers because only tests import it — by design. Exclude test-only modules before calling anything a candidate.
- **A type-only import is not a live rendering path.** `src/components/Game/AgentDetailPanel.tsx` is never rendered, but `src/engine/activitySummary.ts` imports a *type* from it, so a naive graph marks it reachable. Reachability via `import type` alone means the runtime code is still dead.
- **A test file named after a dead module may not test it.** Of the 8 test files THR-941 deleted with the V1 hex map, one (`AgentDots.test.tsx`) imported no V1 component at all — only the live `src/data/agent-visual-content`. Its coverage survived elsewhere, so that deletion was safe, but the general case is a silent coverage loss. **Read the test's imports, never its filename.**

## Reporting

**One file per run — never append to a file a previous run created.** The first run of a UTC day writes `Docs/ops/orchestrator-YYYY-MM-DD.md`; every later run that day writes `Docs/ops/orchestrator-YYYY-MM-DD<letter>.md`, starting at `b` and continuing `c`, `d`, ….

**Pick the letter by listing the `ops` branch, not the working tree (THR-947):**

```bash
git fetch origin ops --quiet
git ls-tree -r --name-only origin/ops -- Docs/ops/ | grep "orchestrator-$(date -u +%F)" | sort
```

Listing the local directory would return only the frozen pre-cutover archive, so on any day after the cutover it reports "no runs today" and every run of the day picks the same unlettered filename — each one silently overwriting the last on `ops`, where a push is last-writer-wins.

This is structural, not stylistic (THR-849). The lane used to prepend each run's section to the **top** of one dated file, which made that first line a shared anchor: when two runs' PRs overlap, both edit it and the second lands at `mergeStateStatus: DIRTY`. Armed auto-merge cannot resolve a conflict, so such a PR sits open indefinitely — PR #1031 sat that way for two days holding the only copy of its run's T1 sweep, and had to be recovered by hand. Separate files share no anchor, so the conflict becomes impossible rather than merely unlikely, and the filename carries the ordering that `merge=union` cannot (union keeps both sides of a hunk, in no guaranteed order).

`.gitattributes` also grants `Docs/ops/orchestrator-*.md merge=union`. That backstop is now **inert for new reports** — it only applies to a *merge*, and reports no longer travel by PR (THR-947). One-file-per-run is therefore the whole defence, not merely the better half of it: on `ops` a push is last-writer-wins, so two runs sharing a filename lose one report outright rather than conflicting visibly. Do not read the attribute as permission to append.

**A no-op run writes no file at all (THR-920).** If the run promoted nothing, filed nothing, resolved no blocker, surfaced no *new* T3 finding and has nothing for Christian, do not create the report and do not publish anything — the session output is already a complete record of a run that did nothing. This is the rule that used to exist only as "a no-change run skips the commit", which could never fire here: one file per run means *every* run is a change by construction, so the lane merged on 7 of the last 32 advances of `main` — three of them titled "no promotions" — and each merge re-staled every open PR under strict branch protection.

Declines are **not** substantive. "We looked and it stayed blocked" is the expected steady state of a healthy board, and reporting it hourly is what trained the reader to skip this file.

Structure:

```markdown
---
lane: tb-orchestrator
run: YYYY-MM-DD<letter>
promoted: <n>
filed: <n>
resolved: <n>
newFindings: <n>
needsChristian: <true | false>
---
# Orchestrator — YYYY-MM-DD (run <letter>, ~HH:MMZ)

## Needs Christian
(plain language, THR-608 — or "nothing needs you")

## T1 — unblock sweep
(promoted / declined / held, one line each, every line naming its evidence)

## T1.5 — wayfinder sweep
(per map: frontier size, AFK tickets resolved, HITL tickets surfaced — or "no open maps")

## T2 — design authoring
(triggered or not, with the shelf count that decided it)

## T3 — architecture health
(new findings only; explicitly say which detectors ran and which did not)

## Escalations
(questions asked, items parked)
```

**The frontmatter counters are facts, not a judgement (THR-920).** Each is a count of actions this run actually took — `promoted` is verified `save_issue` state changes, `filed` is issues created, `resolved` is blockers cleared, `newFindings` is T3 findings not present in the previous sweep. Fill them from what you did, then let the script decide whether that is worth a merge:

```bash
npm run check:substantive --silent -- --lane report --file Docs/ops/orchestrator-<run>.md --json
```

`{"verdict":"skip"}` means delete the drafted file and commit nothing. Keeping the judgement in a script rather than in this sentence is the point: the previous rule *was* a sentence, and it never fired. The probe is fail-soft — a missing or unparseable frontmatter block returns `commit`, so a malformed report is published rather than lost.

**`## Needs Christian` is the interface to him** — `keep-work-flowing-cc` step 2.6 reads this section out of the newest sibling report and folds it into the briefing. That link was **missing** until THR-826 added it: reports were being written under `Docs/ops/` with `## Needs Christian` headings that nothing read, which is the same defect as "routed to an executor" with no consumer. If a change ever breaks that step, this lane's Christian-facing output goes silently nowhere — treat it as load-bearing.

Write in plain language (THR-608). Christian does not read Linear, diffs, or PRs. Technical verdicts — CI state, merge mechanics, not-a-defect calls — are the agent's to make and do not belong in this section.

## Publishing

- **Never run a git state op with the home tree as CWD** (THR-672). `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` is a read-only mirror of `main` owned by `threadbare-autosync.ps1`. Work in this session's own worktree; branches are repo-global.
- **Run reports go to the `ops` branch, not `main` (THR-947, cutover 2026-08-02).** From this worktree's **repository root**, one command — no branch, no PR, no CI, no auto-merge, and `main`'s tip does not move:

  ```bash
  bash scripts/ops-publish.sh -m "docs(ops): orchestrator <summary> (<date> run <letter>)" \
    Docs/ops/orchestrator-<run>.md
  ```

  The T3 weekly file (`Docs/ops/test-suite-health-<date>.md`) publishes the same way — pass both paths in one call when a run writes both, so they land as a single commit.

  That script commits via git plumbing against a throwaway index and pushes straight to `ops`. It checks nothing out, so it touches no working tree, creates no worktree for the reaper, and leaves this session's branch and HEAD alone. Read its header before changing how this lane publishes.
- Publish with **no** `Fixes` / `Closes` / `Resolves THR-XX` keyword — the habit is unconditional even though `linear-autoclose.yml` only watches `main` (impediment #140, THR-738). Reference issues as bare `THR-XXX` tokens.
- **The stranded-report-PR hazard is gone, and with it the rule that managed it.** Reports no longer travel by PR, so there is no prior-run branch to collide with and no `DIRTY` report PR to salvage — the THR-849 class cannot recur by construction. One file per run still holds (§ Reporting): it is what keeps two runs in the same hour from overwriting each other on `ops`, where a push is last-writer-wins rather than a merge.
- **A no-op run publishes nothing** (THR-920). Decide it with `npm run check:substantive -- --lane report --file <report> --json` and obey the verdict; the task's `lastRunAt` is the heartbeat. The original reason — every advance of `main` costing every open PR a full CI re-run — no longer applies now that reports are off `main`; what remains is that an `ops` history where every commit means something is worth more than one padded with empty hours. Obey the verdict as written; whether the gate should relax is tracked as THR-954, not decided in-run.

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
