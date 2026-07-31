# Scheduled Tasks Registry

> **Authoritative home for the recurring-task registry** (moved out of `CLAUDE.md` § Scheduled Tasks by THR-760, 2026-07-26). CLAUDE.md keeps a pointer here plus the two rules that gate live session behavior; everything else — the lane tables, slot-allocation policy, reaper guardrails, prompt-mirror rule — lives on this page.

Current recurring task registry. **Verified against `list_scheduled_tasks` and `Get-ScheduledTask` on 2026-07-27 (THR-794 — both lanes re-checked row by row); `flush-plan-docs` removed 2026-07-21 (THR-654 demolition).** The scheduler adds a deterministic per-task jitter of a few minutes to the cron minute, so **the slot name, the cron minute, and the actual fire time are three different things** — the `Fires` column is the one that matters operationally.

**The audit is two-directional and runs on both lanes.** Every entry `list_scheduled_tasks` returns needs a row here — including disabled and out-of-scope ones, which otherwise read as "not registered" rather than "registered, deliberately dormant" — and every host task `Get-ScheduledTask` returns needs a row in the Windows lane table. THR-794 found one miss in each direction (`website-code-work`, `ThreadbareRepoAutoSync`); both are now carried below.

## CC automation lane — registered and live

| Slot | Cadence | Task | Cron | Fires | Writes |
|------|---------|------|------|-------|--------|
| **:00** | Hourly | CC pickup (`tb-opus-pickup` — single Opus executor lane) | `0 * * * *` | ~:00:53 | — |
| **:25** | Hourly | `tb-orchestrator` (decides what happens next — T1 unblock sweep, T2 design authoring, T3 daily architecture health) | `25 * * * *` | ~:26:16 | `Docs/ops/orchestrator-<date>.md` + Linear `Todo`→`Ready for Dev` promotions |
| **:45** | Hourly | `keep-work-flowing-cc` (CC PM brief — refreshes `Design/briefing.md` + `Design/user-actions.md`) | `45 * * * *` | ~:53:13 | briefing + user-actions |
| **Fri 17:00** | Weekly | `weekly-retro` | `0 17 * * 5` | ~17:09 | retro via `retrospective` skill |
| **Sun 16:03** | Weekly | `weekly-memory-grooming` | `3 16 * * 0` | ~16:10 | memory files |
| **09:07** | Daily | `daily-backlog-grooming` | `7 9 * * *` | ~09:16 | `Docs/ops/backlog-grooming-<date>.md` + Linear queue fixes |
| **Wed 11:09** | Weekly | `weekly-workflow-retro` | `9 11 * * 3` | ~Wed 11:13 | `Design/retros/workflow-retro-<date>.md` |
| **Sun 10:06** | Weekly | `weekly-project-hygiene` | `6 10 * * 0` | ~Sun 10:10 | `Docs/ops/weekly-hygiene-<date>.md` + filed findings |
| **1st 09:00** | Monthly | `monthly-rulebook-review` | `0 9 1 * *` | ~1st 09:00 | one Linear findings issue (or nothing) — registered 2026-07-22 by THR-704 after the THR-417 phantom-Done |

## CC automation lane — registered but not Threadbare work

| Slot | Cadence | Task | Enabled | Disposition |
|------|---------|------|---------|-------------|
| — | Manual only | `website-code-work` ("check for work on the website") | **No** (`enabled: false`, last ran 2026-05-26) | **Out of scope — personal site, not Threadbare. Do not touch, do not enable, do not port.** Prompt: `C:\Users\chris\.claude\scheduled-tasks\website-code-work\SKILL.md` |

It carries no cron and fires only when invoked by hand, so it never contends for a slot. The row exists purely so the registered-vs-documented audit has something to match against — mirroring the `weekly-invoice-check` treatment in the Cowork lane table below. A dormant task with no row is indistinguishable from an undocumented one, which is exactly what made this the THR-794 miss.

`daily-backlog-grooming`, `weekly-workflow-retro`, and `weekly-project-hygiene` were enabled 2026-07-22 after their attended trials passed with Christian's chat approval (THR-677); their trial reports are `Docs/ops/backlog-grooming-2026-07-22.md`, `Design/retros/workflow-retro-2026-07-22.md`, and `Docs/ops/weekly-hygiene-2026-07-22.md`. The corresponding Cowork counterparts are now cut over — Christian disables them (tracked in `Design/user-actions.md`).

**Output-surface rule for all three (and for `tb-orchestrator`):** none of them writes `Design/briefing.md` or `Design/user-actions.md` — `keep-work-flowing-cc` owns those two files, and a second writer produces merge conflicts. Christian-facing items go in each task's own report under a `## Needs Christian` heading, and reach him via the hourly briefing.

**That last clause was aspirational until 2026-07-27 (THR-826).** No step in `keep-work-flowing-cc` read those sections — the reports were being written into a channel with no consumer, which is the same defect as recording *"routed to an executor"* when no lane reads that sentence. `keep-work-flowing-cc` **step 2.6** is now the consumer: it takes the newest report per producing task (within `SIBLING_REPORT_MAX_AGE_HOURS`, 36), extracts `## Needs Christian` verbatim, and folds the items into the briefing attributed to the task that raised them. If that step is ever removed, every sibling task's Christian-facing output goes silently nowhere again.

The `weekly-retro` task is **registered and live** in the CC lane (created 2026-07-20, THR-653) — `0 17 * * 5`, fires ~17:09 local. It had been documented as a task-to-create since the continuous-improvement cycle was written, but had never actually been registered with the scheduler. Prompt: `C:\Users\chris\.claude\scheduled-tasks\weekly-retro\SKILL.md`.

## GitHub Actions

| Slot | Cadence | Task | Cron |
|------|---------|------|------|
| **Fri 14:00 UTC** | Weekly | Drift scan — posts `drift-scan` Linear issues to Continuous Improvement | n/a (Actions cron) |

## Weekly continuous-improvement cycle (Fridays)

1. 14:00 UTC — GitHub Action drift scan runs and posts per-signal Linear issues (label: `drift-scan`) in Continuous Improvement.
2. ~15:00 UTC — Weekly retrospective (via `retrospective` skill) reads that week's `drift-scan`-labeled issues as its **first input** before the impediment log. Run via the `weekly-retro` scheduled task or manually with `/retrospective`.

The loop itself (what each stage is for) is canon in `Docs/canon/process.md` § Continuous improvement loop; this page owns only the schedule.

## Windows Task Scheduler lane

Host-machine tasks; invisible to `list_scheduled_tasks`.

| Slot | Cadence | Task | Trigger | Fires |
|------|---------|------|---------|-------|
| **:40** | Hourly | `Threadbare Git Cleanup` — runs `C:/Users/chris/Dev/Projects/clean-stale-git.sh` (prunes merged worktrees/branches, escalates stale unmerged ones) | Once at 00:40, repeat every 1h | :40 (no jitter) |
| **:50** | Hourly | `ThreadbareRepoAutoSync` — runs `C:\Users\chris\bin\threadbare-autosync.ps1`: fast-forwards the home tree to `origin/main`, and reattaches a **provably loss-free** detached park (THR-671/672) | Once at 00:50, repeat every 1h | :50 (no jitter) |

Neither host task carries a `RandomDelay`, so unlike the CC lane their slot minute *is* their fire time. Both run `Interactive`-only at `Limited` run level with `StartWhenAvailable: True`.

**`ThreadbareRepoAutoSync`** (registered 2026-07-18; row added 2026-07-27 by THR-794, which found it live but undocumented here). It is the containment for the harness-level home-tree damage described in CLAUDE.md § Known Sandbox Limitations — **read that section for the behavior, not this row.** The registry owns only the slot facts:

- Execution time limit is **5 minutes** (the reaper's is 30) — a sync that overruns is killed rather than left to overlap the next hour's run.
- It logs one line per run to `C:\Users\chris\bin\threadbare-autosync.log` (`synced: fast-forwarded N commit(s) -> <sha>` / `ok: already up to date`), which is the fastest way to confirm the home tree is current without touching it.
- The script body lives **outside version control**, same as the reaper's. Unlike the reaper's, it has no repo mirror yet — tracked as [THR-824](https://linear.app/threadbare/issue/THR-824).
- Only autosync may move the home tree's git state. Scheduled sessions must never run git state ops with the home tree as CWD (THR-672) — a session that parks it on a branch stalls autosync for days.

The reaper was daily until THR-673 moved it to hourly at the free `:40` offset. Three things about it are load-bearing:

- **It runs only while Christian is logged on** (`Logon Mode: Interactive only`). Making it run headless requires storing a password, which agents must not do — so a machine that is off or logged out simply misses runs. `StartWhenAvailable` catches up on the next opportunity; that is the intended containment, not a bug.
- **It never deletes a live session's worktree.** `WORKTREE_MIN_IDLE_MINUTES` (180) skips any worktree whose git admin dir shows recent activity, and the orphan-dir sweep skips directories with recent file activity. Removing this guard re-opens the THR-673 failure: a rebased, uncommitted session worktree looks exactly like merged debris, and reaping it mid-session unregisters it, which lets the *next* run delete that session's branch.
- **It severs a worktree's `node_modules` reparse point before removing anything** (THR-753). A worktree's `node_modules` is normally a junction/symlink into the home tree's one real install; `git worktree remove --force` — and `rm -rf` — follow that reparse point and empty the home tree's real `node_modules`, breaking hooks/dev/tests for every tree at once (the 2026-07-22 ×2 wipes, impediments #203/#207). `sever_node_modules_reparse` runs `cmd rmdir` (no `/s`, harmless on a real dir) on the reparse point before every `git worktree remove` and every orphan-dir `rm -rf`; a failed sever *refuses* that removal. After each removal pass `check_home_node_modules` verifies that **either** `node_modules/.bin/esbuild` **or** `node_modules/.bin/esbuild.exe` still exists — the script guards on both, and that matters: on this install `.bin` holds the `esbuild` / `.cmd` / `.ps1` wrappers while the real `.exe` lives in `@esbuild/win32-x64`, so a hand-rolled probe of only `.bin/esbuild.exe` reports catastrophic damage on a perfectly healthy tree (impediment 2026-07-26) — and logs one loud `HOME-TREE node_modules DAMAGED … REPAIR: npm install` line if neither is present — the reaper never auto-installs. The script body is not version-controlled; the current copy is preserved at `Docs/ops/clean-stale-git.sh.md` for recoverability.

## Cowork lane — still enabled, pending Christian's disable (THR-653)

CC cannot read or disable these: they live in Cowork app state, are invisible to `list_scheduled_tasks`, and have no `SKILL.md` on CC disk. The disable is a Christian-owned switch tracked in `Design/user-actions.md`.

| Slot | Cadence | Task | Disposition |
|------|---------|------|-------------|
| **:45** | Hourly | `keep-work-flowing` | Superseded by `keep-work-flowing-cc` (THR-650) — **disable** |
| **09:06** | Daily | `daily-backlog-grooming` | CC port **live** (trial passed 2026-07-22, THR-677) — **disable** |
| **Wed 09:04** | Weekly | `weekly-workflow-retro` | CC port **live** (trial passed 2026-07-22, THR-677) — **disable** |
| **Sun 10:04** | Weekly | `weekly-project-hygiene` | CC port **live** (trial passed 2026-07-22, THR-677) — **disable** |
| **Sun 10:06** | Weekly | `weekly-invoice-check` | **Out of scope — personal, not Threadbare. Do not touch.** |

## Slot allocation

Hourly Linear-MCP-using tasks are spaced so their *fire times* don't overlap: `tb-opus-pickup` at ~:00:53, `tb-orchestrator` at ~:26:16, `keep-work-flowing-cc` at ~:53:13 (deliberately late in the hour so the brief reflects post-pickup state; it moved from the :20 slot to :45 in the THR-653 cutover, taking over the slot the Cowork PM task vacates). Daily and weekly tasks pick non-quarter-hour minutes (e.g., :04, :06, :09).

The three hourly Linear tasks now form an ordered cycle within the hour: **promote (:26) → execute (:00:53 next hour) → report (:53:13)**. `tb-orchestrator` was slotted at `:25` rather than late in the hour on purpose — a promotion landing after the briefing would sit unreported for an hour, and one landing after the executor's pickup would wait a full hour to be claimed. Firing mid-hour means a promoted issue is both claimable by the next pickup and visible to the same hour's brief. **When registering a new hourly task, pick a cron minute whose *jittered* fire time leaves a clear gap from the ones above, then record both the cron and the observed fire time in this file in the same commit.**

Collision-check against **both** lanes, not just the CC one: the host lane holds `:40` (reaper) and `:50` (autosync) with no jitter, so the free stretches in an hour are roughly `:02–:39` and `:54–:59`. The `:50` autosync run matters most for anything that reads home-tree git state — a probe landing inside that window can observe the tree mid-fast-forward.

The THR-677 ports were slotted against that rule: `daily-backlog-grooming` fires ~09:16 (clear of the `:00`/`:40`/`:53` hourly traffic), `weekly-project-hygiene` ~Sun 10:10 (clear of Sunday's 09:16 grooming and 16:10 memory grooming), and `weekly-workflow-retro` ~Wed 11:13 — deliberately moved off its old Cowork slot of Wed 09:04, which would have landed on top of the daily grooming run.

## A hung run silently eats every later slot (THR-837)

**The scheduler will not start a run of a task whose previous run is still alive.** A run that *hangs* therefore costs far more than the slot it occupies — it costs every slot until it ends, and reports nothing while doing so.

Measured 2026-07-27/28: `tb-orchestrator` was dispatched at 20:27:07Z in `permissionMode: "default"` and issued a `Bash` call matching no allow rule. With no user present to answer the permission prompt, the call blocked. The run did not crash — its transcript shows a single **649.5-minute gap** between one tool result and the next, ending 07:40:19Z. Eleven consecutive `:26` slots were skipped, `lastRunAt` stayed frozen at 20:27:02Z, and no report file was written. The next run fired at 07:40:55Z, **36 seconds after the hung one finally ended** — an off-slot fire is the signature of a blocker clearing, not of cron.

Three consequences worth internalising:

- **`lastRunAt` is written at dispatch, not completion.** A frozen `lastRunAt` means "no new run started", which is ambiguous between *never dispatched* and *previous run still alive*. Distinguish them by the transcript's end timestamp, not by inference.
- **Siblings are unaffected**, so the fleet looks healthy. Only the stalled lane goes quiet, and a lane that decides nothing is indistinguishable from a lane with nothing to decide.
- **The mitigation lives outside this repo.** All lanes now run `permissionMode: "bypassPermissions"`, set at the desktop-app level — neither `.claude/settings.json` nor `~/.claude/settings.json` carries a `defaultMode`, so **nothing versioned here would notice it reverting**. Adding allow-list entries is not a substitute: these lanes compose ad-hoc shell commands, and the command that actually hung was an `ls` with Windows backslash paths that no allow-list would have anticipated.

Because the fix is unversioned, the detector is the durable part: `keep-work-flowing-cc` step 2.7 runs `npm run check:task-heartbeat` hourly and puts any stalled lane in front of Christian within the hour. Its predicate requires a **sibling witness** (another enabled task with an equal-or-tighter cadence fired in the same window) precisely so a powered-off machine does not read as a fleet of broken lanes.

## Prompt sources are mirrored into the repo

Scheduled-task prompts live at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md`, which is **outside** version control — merging a repo change does not deploy them, and a disk loss takes them with it. Copies are kept under `Docs/ops/scheduled-task-prompts/` so the prompts are reviewable and recoverable. **When you edit a live prompt, update its mirror in the same PR**; the mirror is a copy, not the source of truth.

**The rule names its own exceptions (THR-850).** Every registered task above is mirrored except `website-code-work`, which is deliberately unmirrored for the reason its row already gives — personal site, out of scope, never to be ported. That exception is recorded in `Docs/ops/scheduled-task-prompts/README.md` § *Deliberately unmirrored*, so an auditor counting the directory can tell a **missing** mirror from an **absent-by-design** one without re-deriving the judgment. A rule with unnamed exceptions produces a recurring false finding: `weekly-project-hygiene` check 3 flags any registered-but-unmirrored task, and with nothing to match against it flagged this one every week.

**Mirror at the conforming path only.** `tb-opus-pickup` was mirrored from 2026-06 at the non-conforming path `Docs/ops/cc-hourly-opus-pickup-prompt.md`, outside this directory and outside the filename-equals-task-id convention. Because no audit looked there, it drifted ~5 weeks unnoticed and still encoded two since-fixed defects as rules — the `assignee:null` queue filter (THR-845) and poll-waiting on CI instead of auto-merge (THR-675) — so recovering the lane from it after a disk loss would have reinstated both. It was replaced by `Docs/ops/scheduled-task-prompts/tb-opus-pickup.md` and deleted (THR-850). A mirror somewhere no audit reads is not a mirror.
