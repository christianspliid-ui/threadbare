# Scheduled Tasks Registry

> **Authoritative home for the recurring-task registry** (moved out of `CLAUDE.md` § Scheduled Tasks by THR-760, 2026-07-26). CLAUDE.md keeps a pointer here plus the two rules that gate live session behavior; everything else — the lane tables, slot-allocation policy, reaper guardrails, prompt-mirror rule — lives on this page.

Current recurring task registry. **Verified against `list_scheduled_tasks` on 2026-07-22 (THR-677 trials); `flush-plan-docs` removed 2026-07-21 (THR-654 demolition).** The scheduler adds a deterministic per-task jitter of a few minutes to the cron minute, so **the slot name, the cron minute, and the actual fire time are three different things** — the `Fires` column is the one that matters operationally.

## CC automation lane — registered and live

| Slot | Cadence | Task | Cron | Fires | Writes |
|------|---------|------|------|-------|--------|
| **:00** | Hourly | CC pickup (`tb-opus-pickup` — single Opus executor lane) | `0 * * * *` | ~:00:53 | — |
| **:45** | Hourly | `keep-work-flowing-cc` (CC PM brief — refreshes `Design/briefing.md` + `Design/user-actions.md`) | `45 * * * *` | ~:53:13 | briefing + user-actions |
| **Fri 17:00** | Weekly | `weekly-retro` | `0 17 * * 5` | ~17:09 | retro via `retrospective` skill |
| **Sun 16:03** | Weekly | `weekly-memory-grooming` | `3 16 * * 0` | ~16:10 | memory files |
| **09:07** | Daily | `daily-backlog-grooming` | `7 9 * * *` | ~09:16 | `Docs/ops/backlog-grooming-<date>.md` + Linear queue fixes |
| **Wed 11:09** | Weekly | `weekly-workflow-retro` | `9 11 * * 3` | ~Wed 11:13 | `Design/retros/workflow-retro-<date>.md` |
| **Sun 10:06** | Weekly | `weekly-project-hygiene` | `6 10 * * 0` | ~Sun 10:10 | `Docs/ops/weekly-hygiene-<date>.md` + filed findings |
| **1st 09:00** | Monthly | `monthly-rulebook-review` | `0 9 1 * *` | ~1st 09:00 | one Linear findings issue (or nothing) — registered 2026-07-22 by THR-704 after the THR-417 phantom-Done |

`daily-backlog-grooming`, `weekly-workflow-retro`, and `weekly-project-hygiene` were enabled 2026-07-22 after their attended trials passed with Christian's chat approval (THR-677); their trial reports are `Docs/ops/backlog-grooming-2026-07-22.md`, `Design/retros/workflow-retro-2026-07-22.md`, and `Docs/ops/weekly-hygiene-2026-07-22.md`. The corresponding Cowork counterparts are now cut over — Christian disables them (tracked in `Design/user-actions.md`).

**Output-surface rule for all three:** none of them writes `Design/briefing.md` or `Design/user-actions.md` — `keep-work-flowing-cc` owns those two files, and a second writer produces merge conflicts. Christian-facing items go in each task's own report under a `## Needs Christian` heading, and reach him via the hourly briefing picking up the underlying Linear state.

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

Hourly Linear-MCP-using tasks are spaced so their *fire times* don't overlap: `tb-opus-pickup` at ~:00:53, `keep-work-flowing-cc` at ~:53:13 (deliberately late in the hour so the brief reflects post-pickup state; it moved from the :20 slot to :45 in the THR-653 cutover, taking over the slot the Cowork PM task vacates). Daily and weekly tasks pick non-quarter-hour minutes (e.g., :04, :06, :09). **When registering a new hourly task, pick a cron minute whose *jittered* fire time leaves a clear gap from the ones above, then record both the cron and the observed fire time in this file in the same commit.**

The THR-677 ports were slotted against that rule: `daily-backlog-grooming` fires ~09:16 (clear of the `:00`/`:40`/`:53` hourly traffic), `weekly-project-hygiene` ~Sun 10:10 (clear of Sunday's 09:16 grooming and 16:10 memory grooming), and `weekly-workflow-retro` ~Wed 11:13 — deliberately moved off its old Cowork slot of Wed 09:04, which would have landed on top of the daily grooming run.

## Prompt sources are mirrored into the repo

Scheduled-task prompts live at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md`, which is **outside** version control — merging a repo change does not deploy them, and a disk loss takes them with it. Copies are kept under `Docs/ops/scheduled-task-prompts/` so the prompts are reviewable and recoverable. **When you edit a live prompt, update its mirror in the same PR**; the mirror is a copy, not the source of truth.
