---
name: keep-work-flowing-cc
description: Hourly headless Claude Code PM brief — scans the Linear queue, pings home-tree freshness, and rewrites Design/briefing.md + refreshes Design/user-actions.md. The CC replacement for the Cowork keep-work-flowing task (Pure Claude Code Migration, THR-650). The briefing file IS the inbox — no chat surfacing.
last_validated_against: 2026-07-18
---

# Keep Work Flowing (CC)

## Purpose

This is the Claude Code replacement for the Cowork `keep-work-flowing` PM run. It runs headless on a schedule and produces two files instead of a Slack/Linear message:

- **`Design/briefing.md`** — the hourly PM brief. Things needing Christian, in plain language (THR-608), with a generated-at timestamp. **This file IS the inbox.** Christian reads it in his morning interactive CC session.
- **`Design/user-actions.md`** — the slower-moving standing "please flip these switches" list. This task keeps it current (prunes resolved items, adds newly-surfaced Christian-owned ones).

**No chat surfacing. No Slack. No Linear comment addressed to Christian.** The two files are the entire output surface.

You are a project manager, not an executor. **Do not implement issues, write product code, or claim work.** The `tb-opus-pickup` lane does that. Your job is to keep the queue legible and surface what needs a human.

## Non-negotiables

- **Read-mostly.** The only files you write are `Design/briefing.md` and `Design/user-actions.md`. Never touch `src/`, never claim a Linear issue, never `save_issue(state:...)`.
- **Plain language for Christian (THR-608).** Christian does not read diffs, PRs, or Linear. Anything addressed to him is plain English, framed in game terms where relevant. Only creative / design-vision decisions go to him. Technical verdicts (CI state, merge mechanics, not-a-defect calls) are the agent's — do not ask Christian to adjudicate those.
- **Do not fabricate asks.** If nothing genuinely needs Christian this hour, say so plainly. An honest "nothing needs you right now" beats an invented task.
- **Never put a `Fixes/Closes/Resolves THR-XX` keyword in a recurring briefing commit.** The keyword auto-closes issues on merge (THR-510 / impediment #140). Briefing commits are heartbeats, not issue closures.

## Procedure

Run autonomously end to end. Do not stop to ask.

### 1. Scan the Linear board

The full board overflows the response budget in one call — query per state.

- `list_issues(team:"Threadbare", state:"Ready for Dev", limit:100)` → queue depth + top items by priority (sort in memory; `orderBy:"priority"` errors at runtime, impediment #49).
- `list_issues(team:"Threadbare", state:"In Dev", limit:50)` → is the executor mid-flight? Is anything parked (assignee null but In Dev)?
- Note **blocked** items: a Ready-for-Dev issue whose description says "blocked by THR-YY" where THR-YY is **not** itself in Ready for Dev. A blocked top-of-queue item silently starves the lane — flag it.
- Note **stale** items: anything in Ready for Dev with `updatedAt` older than `STALE_ISSUE_DAYS` (7) — it may have gone cold or lost its plan doc.

**Queue-nudge judgement:** is the queue *starved* (0–1 ready items → executor will idle), *healthy* (2–15), or *backed up* (>15 → planning is outrunning execution)? State which, in one line.

Verify-after-write on any Linear write (impediment #48) — but this task rarely writes to Linear at all.

### 2. Home-tree freshness ping (retro E1)

Christian's morning session runs on the **home** worktree: `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`. If it is stale or dirty, his session starts on old state — exactly what the THR-391 freshness guard exists to catch.

```bash
HOME_TREE="C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator"
git -C "$HOME_TREE" fetch origin main --quiet
BRANCH=$(git -C "$HOME_TREE" rev-parse --abbrev-ref HEAD)
BEHIND=$(git -C "$HOME_TREE" rev-list --count HEAD..origin/main)
AHEAD=$(git -C "$HOME_TREE" rev-list --count origin/main..HEAD)
DIRTY=$(git -C "$HOME_TREE" status --porcelain | grep -v "^.. .codesight" | wc -l)
```

Flag in the briefing when: `BRANCH` is not `main`, `BEHIND > FRESHNESS_BEHIND_THRESHOLD` (10), or `DIRTY > 0`. Give the exact fix command (`git fetch && git rebase origin/main`, or `git switch main && git pull`, plus orphan-triage for dirty files). If clean and on main, say "home tree current" in one line.

**Fail-soft:** if the home tree is unreachable (path missing, git error), log a one-line warning in the briefing and continue — the freshness ping must never abort the run.

### 3. Compose `Design/briefing.md`

Overwrite the file. Structure (keep it short — this is a brief, not a report):

```markdown
# Briefing

**Generated:** <YYYY-MM-DD HH:MM local (HH:MM UTC)> · by keep-work-flowing-cc

## Needs Christian
<Plain-language items only he can decide or do. Design-vision calls in game terms;
operational switches (home-tree refresh, connector auth) as literal commands.
If none: "Nothing needs you right now — the queue is draining on its own.">

## Queue
<One line: starved / healthy / backed up, with the ready count. Then any blocked or
stale top-of-queue items, one line each.>

## Freshness
<Home-tree ping result — one or two lines.>

## What's moving
<What the executor is working on / shipped since the last brief, if visible. Optional.>

---
*Standing asks live in `Design/user-actions.md`. This file is regenerated hourly by
the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated
timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
```

The **generated-at timestamp is mandatory** — it is how staleness is self-evident (plan Constants table).

### 4. Refresh `Design/user-actions.md`

This is the standing Christian-owned list, not the hourly brief. Refresh, don't rebuild:

- Update the `**Last updated:**` line and the refresh-cadence note.
- Re-check each open item against current reality; prune ones that are now resolved (note the close in "Resolved this period"), update numbers on still-open ones.
- Add any newly-surfaced Christian-owned standing ask (something only he can flip that will not self-heal).
- **Preserve Christian's manual edits** — if an item is still open, keep its prose. Do not flatten hand-written context.
- Do **not** turn this into a retro. Deep impediment-log synthesis stays with the `retrospective` skill.

### 5. Land the changes

Direct `git push origin main` is rejected by branch protection. Mirror the `flush-plan-docs` pattern:

- **Commit only on substantive change.** If the only diff in `Design/briefing.md` is the generated-at timestamp line (and `user-actions.md` is unchanged), **do not commit** — the scheduled-task `lastRunAt` is the "task fired" heartbeat; a timestamp-only commit every hour is pure noise. Trace `[keep-work-flowing-cc] no substantive change — skipping commit (heartbeat via lastRunAt).`
- On substantive change: stage **only** `Design/briefing.md` and `Design/user-actions.md`, commit as `docs(briefing): refresh Design/briefing.md` (NO THR keyword), then `git push origin main`; on rejection, push a `docs/briefing-<date>` branch and open a PR (docs-only → CI passes fast). Let it merge on green.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `STALE_ISSUE_DAYS` | 7 | Ready-for-Dev age past which an item is flagged stale |
| `FRESHNESS_BEHIND_THRESHOLD` | 10 | Home-tree `HEAD..origin/main` commit count that trips the freshness flag |
| `QUEUE_STARVED_MAX` | 1 | Ready count at or below which the queue is "starved" |
| `QUEUE_BACKED_UP_MIN` | 15 | Ready count above which planning is outrunning execution |
| `COMMIT_ON_SUBSTANTIVE_CHANGE_ONLY` | true | Skip timestamp-only commits to keep `main` clean |

## Fail-soft

- Linear unreachable → write the briefing with a loud "⚠ Linear was unreachable this run — queue section is stale" banner and still refresh what you can (freshness ping does not need Linear). Log an impediment via `impediment-reporter`.
- Home tree unreachable → freshness section says so; continue.
- Git push rejected → PR fallback; if that also fails, leave the files uncommitted in the working tree and note it in the run output. Next run reconciles.
- Nothing to say → still overwrite `briefing.md` with the honest empty-state ("Nothing needs you right now"); the fresh timestamp is itself the signal the task is alive.

## What this is NOT

- Not an executor — never claims or implements issues (that is `pull-work` / `tb-opus-pickup`).
- Not a retro — deep impediment synthesis is `retrospective`.
- Not a Slack/Linear notifier — the files are the only output.
