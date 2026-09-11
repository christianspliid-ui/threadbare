---
lane: tb-orchestrator
run: 2026-09-11c
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-11 (run c, ~05:30Z)

## Needs Christian

**One question, and answering it restarts design work that has been stopped for six hours.**

Design work on this project happens one system at a time — there is one desk, and a system sits at it until its plan is written. **Traits wave 2** has been at that desk for **26 days** with your name on it, and nothing else can be designed while it is there.

That system is the one where *places and things* start carrying character: a town turns **blood-soaked** after enough battles on its ground, a shrine turns **veil-thin** where the world thins, a sword becomes **cursed** or **storied** by what it has done — and encounters can then simply say *"gain a random relic"* or *"inflict a random madness"* and let the world pick. Good system. It has not moved since 15 August.

**The question: shall I set it aside — keeping its place and its notes, just no longer holding the desk?** Yes or no.

If yes, the next system steps up immediately, and it is one you already approved. Yesterday evening you said *"ok lets go"* to the fix for [the world's builders being invisible](https://linear.app/threadbare/issue/THR-1348) — the merchants and smiths who hold real ambitions but sit outside the handful of mortals the game actually watches, so their whole line of work never happens. The ruling is on record and it names what the design pass must settle. It is waiting only on the desk.

**Why this reaches you when last hour's run said it would not.** Run b judged this one an internal housekeeping matter and handed it to the tidy-up lane instead of you. I checked that lane's instructions: it is told to *flag* stalled design work, never to set anything aside. So the hand-off could not have been acted on, and the decision is genuinely yours. Detail in § T2.

**Still open from last hour, unchanged and not re-argued here:** the three words awaiting your yes — **Realm** (or Nation, your pick), **hold**, and **cast** / **Forecast tier** — on [THR-1453](https://linear.app/threadbare/issue/THR-1453), [THR-1449](https://linear.app/threadbare/issue/THR-1449), [THR-1445](https://linear.app/threadbare/issue/THR-1445). That ask stands as written in [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md#needs-christian).

## T1 — unblock sweep

Scanned `Todo` (**32**) and `Ready for Dev` (**3**) — two state-filtered calls, bucketed in memory, never one unfiltered sweep (THR-686). Sorted by priority in memory (`orderBy:"priority"` errors — impediment #49).

**Promoted — 0.** No candidate's gate cleared in the hour since [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md). **Promotion ceiling not reached** (shelf 3, well under 15) — nothing was held back by budget; every non-promotion below is a decline on its merits, named with its evidence.

**The `Idea` column was not re-swept this run** — run b read all 60 rows an hour ago and found no candidate, and no gate in this run's `Todo` set points at an `Idea` row that would have arrived since. Stated as inherited rather than measured, deliberately; re-reading 60 rows hourly is the dump this tier forbids.

### The decline that changed character — [THR-1454](https://linear.app/threadbare/issue/THR-1454) is now structurally blocked, not merely early

Run b declined realm encounters (court summons, border levy, tithe) on a **timing** argument: its gate reads *"Pick up after its slice 3 is Done"*, slice 3's sentinel half had merged nine minutes earlier, and the slice's other boxes were open. That was right, and it promised *"the next run promotes in one step instead of re-deriving the slice state."*

**I checked the substrate instead of taking the promise, and the decline is firmer than a timing call.** THR-1454's own body names four things the Realm design must deliver before it can be authored. Verified against `origin/main` at `089bc19b`:

| What THR-1454 needs | On `main`? | Evidence |
|---|---|---|
| `$realm` scene sentinel | **Yes** | `src/engine/encounterAftermath.ts:841` resolves it |
| `REALM_RANK_LADDER` court ladder | **Yes** | `src/data/realm-content.ts:229` |
| A Realm faction definition | **Yes** | minted dynamically, `realm.<cultureId>` (`realm-content.ts:59`) |
| **A realm entry in `FACTION_ENCOUNTER_META`** | **No** | zero matches for `realm` in `src/data/faction-encounter-content.ts`; zero for `realm` in `src/engine/encounterFilterPipeline.ts` |

That missing entry is not incidental — it is an **unchecked box in the plan doc's own slice 3 checklist**, quotable verbatim:

> - [ ] `REALM_RANK_LADDER` reads through `factionReputation` for a Realm; `FACTION_ENCOUNTER_META` has the realm entry; the *takes / loses* chronicle line fires on a seize

— [`2026-09-10-thr-1155-realms-and-areas.md:318`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-10-thr-1155-realms-and-areas.md).

**And that box is word-for-word THR-1454's Done-when:** *"the faction sheet's court rank changes after a completed summons (the ladder read through `factionReputation`)"*. Promoting today would hand the executor a ticket it **cannot** satisfy — the THR-887 class (a Done-when unsatisfiable by construction), which this lane has a liveness check precisely to stop. There is also a real mutex: the file THR-1454 would need to edit is the file THR-1155's live slice 3 is editing.

**Verdict: decline, and the queue-by-name promise is re-scoped.** THR-1155 reaching `Done` remains the trigger, but the promotion comment must carry `Blocked by: nothing (THR-1155 Done <date>; FACTION_ENCOUNTER_META realm entry verified present)` — a grep, not an inference from the ticket's state. Recorded so the next run verifies the substrate rather than trusting a state transition.

### Declined — design is owed first, so these are T2's input, not the queue's

Each has its blockers met or none at all, and is still wrong for `Ready for Dev`: a met blocker does not make a ticket dev-ready.

| Issue | Blocker state | Why not the queue |
|---|---|---|
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) — builders below the spotlight | none mechanical | Its own ruling comment (2026-09-10T18:12Z): *"it stays in `Todo` until a plan doc exists — this is a tier-system change, not a one-line promotion"* |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) — a held town is a faction position | **THR-1287 `Done`** 2026-09-10T07:44:58Z | Done-when is a design handoff: *"Plan doc in `Docs/plans/` … intent-judged and three-way audited"*. Four named questions left open on purpose |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) — no non-human cast primitive | none | *"This is a design ticket, not a patch"* — new-node-type rule; shape undecided |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) — `intelligence` object type | none | *"a design decision, not an executor's call"*; must name its engine reader before it opens |

**A correction to this run's own first reading, recorded because it would have been a bad call.** From its description alone, THR-1348 looks like a direction fork — *"Three readings, and they are genuinely different games"* — which would have made it Christian's and not stageable at all. Its **latest** comment settles it: the three readings were put to him in game terms on 2026-09-10 and he answered *"ok lets go"* to reading 1 (*attention follows ambition* — a strategic ambition pulls its holder into the spotlight rather than widening the aperture), veto open. An earlier comment (2026-08-30) rules the opposite way and is superseded. **Reading the ticket body without its comment thread would have sent an agreed, director-ruled item to Christian as an open question** — the failure mode CLAUDE.md § *prior verdicts* names. Run b had this right; I re-derived it rather than inheriting it, and agree.

### Declined — other reasons

- **[THR-1024](https://linear.app/threadbare/issue/THR-1024)** (DetailModal dialog semantics) — **unmet blocker**: its gate is *"do not start this before THR-966"*, and [THR-966](https://linear.app/threadbare/issue/THR-966) is `Idea`, never started. Its own body says the work is wasted either way until the detail-page cluster's mount-vs-prune call is made.
- **[THR-1220](https://linear.app/threadbare/issue/THR-1220)** (integrated slice checkpoint) and **[THR-1133](https://linear.app/threadbare/issue/THR-1133)** (attended pixel-pass sweep) — **attended work by construction**. One is Christian playing five encounters in one sitting; the other needs a human-run dev server. Neither is executor-queue work and neither should ever be promoted.
- **[THR-1043](https://linear.app/threadbare/issue/THR-1043)**, **[THR-791](https://linear.app/threadbare/issue/THR-791)** — carry an assignee; not candidates.
- **[THR-1156](https://linear.app/threadbare/issue/THR-1156)** (typed game-state, `Urgent`), **[THR-789](https://linear.app/threadbare/issue/THR-789)** (traits trigger layer) — **program epics**, parents of the work rather than work. Promoting an epic puts an unexecutable parent at the top of the queue.
- **[THR-870](https://linear.app/threadbare/issue/THR-870)**, **[THR-1381](https://linear.app/threadbare/issue/THR-1381)**, **[THR-1218](https://linear.app/threadbare/issue/THR-1218)**, **[THR-175](https://linear.app/threadbare/issue/THR-175)** — no gate cleared; unchanged from prior runs and not re-argued.

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These are decisions, never executor work, and never enter `Ready for Dev`.

**No Linear writes this run.** Read-only: nine queries, zero mutations, nothing to verify.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available — re-measured this run, not inherited.** Two all-state label queries: all **21** `wayfinder:research` and all **5** `wayfinder:task` issues in the team are `Done`. `ORCH_WAYFINDER_AFK_MAX` (2) is not the constraint — **supply is zero**, and has been for days. There is no agent-doable wayfinder work anywhere on the board.

**Frontier: 12 open decision tickets, 11 unclaimed, all HITL** (`wayfinder:grilling` / `wayfinder:prototype`; [THR-1232](https://linear.app/threadbare/issue/THR-1232) carries an assignee and is off the frontier). **None touched** — an agent resolving a grilling or prototype ticket is the broken-HITL failure the wayfinder skill exists to prevent.

**Not re-listed by name to Christian.** These have stood in front of him for over two weeks; re-listing twelve of them hourly is how a standing ask stops being read. Same call as run b, for the same reason.

## T2 — design authoring

**Triggered, and barred — sixth consecutive run.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0** of 3 ([THR-1456](https://linear.app/threadbare/issue/THR-1456), [THR-1053](https://linear.app/threadbare/issue/THR-1053), [THR-1455](https://linear.app/threadbare/issue/THR-1455) all carry `Deferral`), below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

| Occupant | Classification | Evidence |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) — Traits wave 2 | `stale-assigned` → **counts against the bound**, warn-only | `Todo` → `In Design` 2026-08-15T20:29:32Z, no state movement since; assignee present; no `Parked` label; **26 days** |

I obey the bar: no second item staged, and **no mutation of THR-790** — excluding an item from a count is not a state change, and applying `Parked` is not this lane's to do.

### Finding 1 (new) — run b's exit for this bar was routed to a lane that is told not to take it

Run b reached the right conclusion (the bar is one label on one item) and then routed the fix away from Christian:

> **Routed to `daily-backlog-grooming`:** apply `Parked` to THR-790. … `daily-backlog-grooming` can apply it; THR-1382's own item 1 then excludes it from the bound automatically, and the design tier opens without spending any of his attention.

**That premise is false, and I checked it rather than inheriting it.** The grooming lane's prompt ([`Docs/ops/scheduled-task-prompts/daily-backlog-grooming.md:70`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-task-prompts/daily-backlog-grooming.md)) contains exactly one instruction covering this shape:

> **Stale design work.** Issues in "In Design" or "Implementation Planning" for more than 7 days with no updates may be stuck. **Flag them.**

*Flag*, not label. Grepping that prompt for `parked` returns **one** unrelated line (about issues parked on technical decisions, which this is not). The lane has no instruction to apply the `Parked` label to a stale `In Design` item, and its general posture is to report rather than mutate. **An hour has passed and THR-790's labels are still `["Content","Engine"]`** — consistent with a lane that was handed something it is not told to do.

**This is the lane's own founding defect, reproduced.** THR-826 exists because work was *"routed to an executor"* that no lane reads. Run b routed a fix to a consumer that cannot act on it, and the routing looked complete in the report. Costless to discover, and worth one line permanently: **a routing is only real if the target's prompt tells it to do the thing.**

**So the disposition flips back to Christian — which is also what the recorded ruling says.** The skill's own table gives the assigned-stale arm one exit, *"`Parked` … a human's deliberate act"*, and names two possible actors: the grooming lane or Christian. With the first ruled out by its own prompt, it is his. [THR-1382](https://linear.app/threadbare/issue/THR-1382) already said so by name: *"THR-790 is assigned to Christian and genuinely awaits him — the correct shape is `Parked`."* Asked in § Needs Christian, in game terms, as one yes/no.

**Not filed as a ticket, deliberately.** The process-work throttle (CLAUDE.md § *Process-work throttle*) bars scheduled lanes from filing process tickets: a lane that finds a defect in the delivery machinery logs it and moves on, and the **weekly retro is the single promotion point**. The repair is a one-line addition to the grooming prompt (flag *and* apply `Parked` to an assigned stale `In Design` item, or explicitly decline and escalate) — recorded here for the retro to weigh, with this run as the second data point and run b as the first. Cost to date: the design tier barred six runs while the program shelf sat at zero; cost to fix: one line in one prompt.

**What the bar defers, in order** — unchanged from run b, re-derived not inherited: [THR-1348](https://linear.app/threadbare/issue/THR-1348) (director-ruled 2026-09-10, and its own comment says *"the orchestrator's T2 lane may stage it if a design session is free first"*), then [THR-1448](https://linear.app/threadbare/issue/THR-1448) (blocker `Done`, four questions enumerated), then [THR-1274](https://linear.app/threadbare/issue/THR-1274) (caps the hunt category at prose-only antagonists).

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis.

## T3 — architecture health

**Skipped — already swept today, in full.** [Run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md#t3--architecture-health) ran every available detector at 06:27 local (past `ORCH_HEALTH_SWEEP_HOUR`), including a genuine redundancy judgement pass, and recorded three findings plus an enumerated 29-row canon baseline for tomorrow's diff. The tier is daily; re-running four detectors an hour later would produce the same output and train its reader to skip it.

**No detector was run this hour, and none is reported as clean.** `__DEBUG.validateTraitRefs()` remains browser-only and unmeasurable headless.

**Standing sub-duties, re-measured cheaply from this run's own board reads rather than inherited:**

- **`In Design`: 1 live, 0 excluded** — THR-790 (assigned, 26d → warned, still counted). Worked in § T2. Printing the `1 live` line because its absence is indistinguishable from a tier that did not run.
- **Hand-created `In Dev`: none.** All three `In Dev` issues passed through `Ready for Dev` on `stateHistory` — THR-1155 (09-10 19:52→20:02Z), THR-1380 (09-10 18:13→19:02Z), THR-1130 (repeatedly).
- **One `In Dev` shape worth a line, not a finding:** [THR-1380](https://linear.app/threadbare/issue/THR-1380) (UL-proposal) has sat `In Dev` with **no assignee and no `Parked` label** since 2026-09-10T19:02Z (~10h). Its sibling THR-1130 carries `Parked` for the same waiting shape. This is the ambiguous state `pull-work` Step 1.8 reads as *unclaimed*, so nothing is stuck — but the park is unrecorded. **Not normalised and not mutated** (never write into `In Dev` on an inference — impediment #755); noted for the grooming lane's flag pass, which is the same gap as Finding 1.
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Last pass [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

### Product vs process — the week

Promoted 0, filed 0. The single new finding is a process defect logged rather than ticketed, so the process-ticket budget (at most one per three runs) stays untouched and the trailing-week ratio is unmoved at **~30 product / 7 process (~81% product)**.

**Headline: the builder is still not the constraint, and three of the four things upstream of it need one human sentence each.** A realm system finishing its last slice; its follow-on content ticket correctly blocked and now blocked *structurally* rather than by minutes; a design desk occupied for 26 days with a director-ruled item queued behind it; zero agent-doable wayfinder legwork across three open maps; three words and one park awaiting a yes. None of this is the executor's fault and none of it is fixed by promoting harder.

## Escalations

- **Nothing asked on Discord.** The Christian-facing item is low-stakes and goes via `## Needs Christian` → the hourly briefing, which is the prescribed interface.
- **One prior-run routing reversed, with evidence.** Run b sent THR-790's disposition to `daily-backlog-grooming` on the reasoning that it *"does not need him"*. That lane's prompt says *flag*, not label, and the label is unchanged an hour later. Reversed to a Christian ask rather than left to decay — recorded here so the reversal is a decision, not drift. Run b's judgement was sound on everything it could see; the gap was in a file it did not read.
- **Nothing parked.** No item was set aside by this run.
- **One promise re-scoped, not dropped.** Run b's *"THR-1454 promotes in one step next run"* now requires a substrate grep (`FACTION_ENCOUNTER_META` realm entry present) rather than trusting THR-1155's state transition. Reason in § T1.
