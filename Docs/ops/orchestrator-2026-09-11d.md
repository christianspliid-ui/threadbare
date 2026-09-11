---
lane: tb-orchestrator
run: 2026-09-11d
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-11 (run d, ~06:37Z)

## Needs Christian

**The three words are answered — that ask is closed and will not be repeated.** Your blanket approval this morning (*"you are approved to unblock everything here"*) settled the naming questions that led the last four of these reports, and the work is already queued: six glossary words land in one pass ([THR-1457](https://linear.app/threadbare/issue/THR-1457)), **Realm** lands with the realm code it names, and the rule itself is now written down in [`Docs/canon/process.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) so no lane asks you again.

**One thing, and it is a calendar item rather than a decision.**

> **A design session is wanted for: [A held town is a faction position](https://linear.app/threadbare/issue/THR-1448).**

This is the second half of your own sentence from yesterday. You were asked whether a claimed town is a commitment or a possession and said *"it is a commitment and probably also a faction position? it could open up specific encounters within that factions and influence what undertakings are prioritized."* The first half is built and merged — a hold is now kept by working it. The second half is the interesting one: when a mortal keeps a town, the faction starts treating them as **its** town-keeper — sending them work it would not send a stranger, and bending what that mortal chooses to do next toward the town and the faction that cares about it.

It needs a design pass before any code, and the design desk is free for the first time in about four weeks. **Nothing is being asked of you except to open a session when you have an hour** — say *"work the held-town design"* and it runs itself from there. I have already staged it with the questions it has to answer and the reading it should start from.

**Nothing else needs you.** The wayfinder maps are no longer your queue — per this morning's ruling they are resolved by design sessions, and this lane has stopped listing them here.

## T1 — unblock sweep

Two state-filtered reads. **Shelf: 9 items in `Ready for Dev`**, of which 3 are non-`Deferral` and **1 is program work** (see § T2 for why that distinction decided this run). Promotion ceiling did not apply (9 < 15). **Promoted: 0.**

**Held — 1.**

- **[THR-1454](https://linear.app/threadbare/issue/THR-1454)** (Realm encounters — court summons, border levy, tithe) — **held, not declined.** Its gate reads *"Blocked by THR-1155 … Pick up after its slice 3 is Done."* Slice 3 is **half-landed**: the `$realm` / `$area` sentinels merged in [#1893](https://github.com/christianspliid-ui/threadbare/pull/1893) and are live on `origin/main` (`src/engine/sceneSentinels.ts:79,96`, verified this run), but the other half — the realm entry in `FACTION_ENCOUNTER_META` and the court-ladder read through `factionReputation`, both of which this ticket's Done-when explicitly needs — sits on **open PR [#1895](https://github.com/christianspliid-ui/threadbare/pull/1895)** (`state: OPEN`, touching `faction-encounter-content.ts`, `factionReputation.ts`, `realm-content.ts`). Confirmed absent from `main`: `git grep realm origin/main -- src/data/faction-encounter-content.ts` returns nothing. Promoting now would queue a content ticket whose substrate is on a branch — the THR-921 shape. **Next run promotes it once #1895 merges.**

**Declined — 8, each naming its evidence.**

*Wrong destination (blockers met or absent, but the ticket owes a design pass — these are T2's input, not the executor's):*

- **[THR-1448](https://linear.app/threadbare/issue/THR-1448)** — blocker THR-1287 `Done` 2026-09-10T07:44:58Z, already recorded by [run f of 09-10](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10f.md). Body: *"a design ticket; plan doc before code."* **Taken up by T2 this run.**
- **[THR-1348](https://linear.app/threadbare/issue/THR-1348)** — no blocker; body states *"this is the fork, and it is not the executor's to settle"* across three readings that are *"genuinely different games."*
- **[THR-790](https://linear.app/threadbare/issue/THR-790)** — body: *"Needs its own design finalization before Ready for Dev."* Returned `In Design` → `Todo` at 06:14:43Z today by the stale sweep after 27 days.
- **[THR-1274](https://linear.app/threadbare/issue/THR-1274)** — body: *"This is a design ticket, not a patch"*; a non-human cast primitive is a new-node-type question.
- **[THR-1393](https://linear.app/threadbare/issue/THR-1393)** — the `knows_of` schema change it needs is *"a design decision, not an executor's call."*
- **[THR-1381](https://linear.app/threadbare/issue/THR-1381)** — body: *"Design-session work, not execution — no code is owed by this ticket."*

*Unmet blocker:*

- **[THR-1024](https://linear.app/threadbare/issue/THR-1024)** — *"do not start this before THR-966"*; [THR-966](https://linear.app/threadbare/issue/THR-966) is **`Idea`**. Worth a line for the retro rather than a finding: its coordination partner THR-951 is now **`Canceled`**, so the "coordinated call" THR-966 defers to has lost one of its two parties.
- **[THR-175](https://linear.app/threadbare/issue/THR-175)** — trigger gate unmet (*"Unblocks when either creation-sphere content starts shipping, OR a template needs `sphere` as an axis independent of `reach`"*); neither has happened, and the ticket also owes a design doc first.
- **[THR-1218](https://linear.app/threadbare/issue/THR-1218)** — blocked by [THR-1043](https://linear.app/threadbare/issue/THR-1043) (Encounter Factory, `Todo`); also self-declares *"Not Ready for Dev — needs a design pass when unblocked."*

*Not candidates, stated so the sweep is legible:* THR-1156 and THR-789 are program-epic containers whose own bodies forbid execution tickets filing against them; THR-1043 and THR-791 are assigned to Christian; THR-1220 and THR-1133 are attended-session work by construction; THR-870 is the parked Sphere-Governed Ascendant pivot. **15 `wayfinder:*` issues skipped unconditionally** per the standing rule — they are T1.5's input and never enter `Ready for Dev`.

**Latest-comment check ran on every candidate that reached the promotion decision.** No standing retire verdict found (THR-990's reason did not fire this run).

## T1.5 — wayfinder sweep

**Three open maps**, all frontiers computed: [Item Generator](https://linear.app/threadbare/issue/THR-1227) (THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) (THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) (THR-1258).

**AFK burn-down: 0 resolved, and 0 available.** Label-filtered sweeps confirm the agent-doable work is exhausted across every map ever charted — **21 of 21 `wayfinder:research` tickets `Done`, 5 of 5 `wayfinder:task` tickets `Done`**, with nothing open in either label. This is the third consecutive run to measure zero AFK legwork; it is not a transient.

**HITL frontier: 12 tickets, and this lane no longer routes them to Christian.** THR-1258 carries 10 (6 `grilling`, 4 `prototype`), THR-1227 and THR-1226 one `prototype` each. Under this morning's ruling they are **design-session work**: *"A `wayfinder:grilling` / `wayfinder:prototype` ticket on a charted map is decided by the session that works it, recorded on the ticket with the outputs attached so a veto has something to look at — never listed as 'yours' in the briefing"* ([`Docs/canon/process.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) § User review interface, rule 4, landed `01df26d0` / PR [#1896](https://github.com/christianspliid-ui/threadbare/pull/1896), 06:23Z). Canon on `main` beats this lane's skill file, dated `2026-09-02`. They appear nowhere under § Needs Christian.

**The structural consequence, stated because nothing else will notice it.** The wayfinder frontier is now twelve design decisions with **no lane that picks them up**. They were routed to Christian's briefing until three hours ago; they are now routed to "design sessions", which are not scheduled by anything — T2 stages one item at a time against a shelf-depth trigger, and this lane is barred from resolving them itself. This is not a defect in the ruling, which is plainly right; it is a gap on the far side of it, and it belongs in the retro rather than in a ticket this lane files.

### Finding (new) — the ruling swept two surfaces; four carry it

Recorded rather than ticketed, per the scheduled-lane throttle. `.claude/skills/orchestrator/SKILL.md` (lines 18, 164–165, **191–195**, 203) still titles a step *"Surface the HITL frontier"* and instructs that grilling/prototype tickets *"go under `## Needs Christian` … via the hourly briefing"* — the exact channel the ruling closes. Its prompt mirror `Docs/ops/scheduled-task-prompts/tb-orchestrator.md` (lines 3, 53, 58) repeats it, as does the live twin under `~/.claude/scheduled-tasks/`, and `.claude/skills/wayfinder/SKILL.md` (62–63, 237) still asserts *"HITL means Christian, live, in chat."*

[THR-1458](https://linear.app/threadbare/issue/THR-1458) is the delegation-sweep ticket and names only the other two files. **Folded into it by comment this run** rather than filed as new process work — the ticket's own framing is that *a ruling is a sweep*, so widening it costs one comment and a new ticket would spend the process budget on work already queued. The executor decides whether to fold or split.

## T2 — design staging

**Triggered, on a reading of the floor that is stated openly so it can be reversed.**

The literal predicate — non-`Deferral` items in `Ready for Dev` — counts **3** (THR-1130, THR-1457, THR-1458), which is above `ORCH_PROGRAM_WORK_FLOOR` (2). I read it purposively instead and count **1**. THR-1457 and THR-1458 are docs-only `Continuous Improvement` tickets filed twenty minutes before the scan; the constant is named *program* work floor, and its stated purpose is to stop the shelf reading healthy while authored program work sits in `Todo`. CLAUDE.md § Prioritization is explicit that a process-heavy queue is *"a starved shelf, not a license to binge — the headline finding is 'feature pipeline needs supply', never more tidying."* Counting two morning tidying tickets as pipeline supply is the measurement error the floor exists to prevent. Program work on the shelf is **THR-1130 alone**.

**Bound satisfied with room to spare: `In Design` held 0 live, 0 excluded at scan** — the column was empty for the first time in ~27 days after THR-790's 06:14:43Z demotion. `ORCH_MAX_IN_DESIGN` is 1.

**Staged: [THR-1448](https://linear.app/threadbare/issue/THR-1448)** — `Todo` → `In Design`, **verified by re-query** (`status: In Design`, `startedAt: 2026-09-11T06:36:29Z`, **no `assignee` key present**). Design-request comment posted carrying: why now, the shelf reading above, what makes it agreed (Christian's verbatim 2026-09-10 answer, of which THR-1287 shipped the first clause), the Step-0 canon loads an Engine-pillar design owes, the four questions the plan must settle, one live substrate caution (`member_of.rank` is 0–1; `faction_rank` is dead per THR-805), and the sequencing note that PR #1895 is still open.

**No plan doc authored, and none will be by this lane** (Christian's 2026-08-06 ruling — this lane runs Sonnet deliberately). The previous run's comment on that ticket had already established the routing and named `ORCH_MAX_IN_DESIGN` as the only thing holding it; this run did not re-derive that, it acted on it.

## T3 — architecture health

**Skipped — already swept in full today.** [Run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md#t3--architecture-health) ran every available detector at 06:27 local (past `ORCH_HEALTH_SWEEP_HOUR`), including a genuine redundancy judgement pass, and left a 29-row canon baseline for tomorrow's diff. The tier is daily; re-running four detectors would reproduce its output and train its reader to skip the section.

**No detector ran this hour and none is reported as clean.** `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`: **not run**. `__DEBUG.validateTraitRefs()` remains browser-only and cannot be measured headless. **Redundancy: not assessed this sweep** — run b's pass stands and is not restated.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Last pass [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

`newFindings: 1` counts the guidance-drift finding in § T1.5. It is a judgement result, not a detector result, and is not presented as one.

### Standing sub-duties — re-measured from this run's own board reads

- **`In Design`: 0 live, 0 excluded.** Printed rather than skipped: a `0 live` line is the signal that T2 is free to stage, and its absence is indistinguishable from a tier that did not run. It is now **1 live** (THR-1448) as a result of this run.
- **`In Dev`: 1** — [THR-1155](https://linear.app/threadbare/issue/THR-1155), live on PR #1895, last touched 06:25Z. WIP=1 is respected.
- **Hand-created `In Dev` (never in `Ready for Dev`): none.** THR-1155's `stateHistory` shows `Ready for Dev` 2026-09-10 19:52→20:02Z.
- **Stalled work: none at threshold this run.** THR-1130's 5-transition count, [run b's Finding 2](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md), is unchanged — but it has been **released from its park back to `Ready for Dev`** (06:15:12Z, `Parked` label gone), so it is now claimable program work rather than a stalled one. That release is what makes it the shelf's only program item.
- **Two queue items were born without a coordination block.** THR-1457 had one posted with it; **THR-1458 had none** — filed straight into `Ready for Dev` at 06:26:49Z with zero comments, the THR-836 shape. `pull-work` Step 3 would have had to derive one by guessing. **Block posted this run** (suggested model, parallel-safe, mutex-with-reason, blocked-by-nothing with the authority commit named, evidence shape), plus the hazard that the filing session's harness refused edits under `.claude/skills/` — checked and **not** a repo rule: `.claude/settings.json` carries an empty `permissions.deny` array.

### Product vs process — the week

This run promoted 0 and filed 0. The one new finding was **logged and folded into an existing ticket rather than converted into a new one**, so the process-ticket budget (at most one per three runs) stays untouched; the trailing-week ratio is unmoved at roughly **30 product / 7 process (~81% product)**.

**Headline: supply is the constraint, and for the first time this week the desk that fixes it is empty.** The builder is busy and healthy on one ticket. Behind it the shelf holds one genuine piece of program work, two morning tidying tickets, and six deferrals. Eight of nine `Todo` candidates declined this run for the *same* reason — they need a design pass, not an executor — and the design desk went free four hours ago. One item is now staged against it. The other structural gap is newer: twelve wayfinder decisions stopped being Christian's this morning and have not yet become anyone else's.

## Escalations

**None raised, and nothing parked.** No question needed the Discord channel this run: the naming asks that three earlier runs escalated were answered by the blanket delegation, and the two judgement calls this run made — the purposive floor reading in § T2, and declining to file the guidance-drift finding as its own ticket — are both the agent's under the 2026-08-12 calibration rule and the scheduled-lane throttle respectively. Both are recorded with their reasoning on the board so either can be reversed by a sentence.

*Two board writes this run, both comments plus one column move; no issue claimed, no assignee set, no `In Dev` touched.*
