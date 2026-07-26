---
name: weekly-workflow-retro
description: Weekly workflow retro for Threadbare — lane throughput, handoff quality, coordination-protocol adherence; report to Design/retros/ (CC-authored replacement for the Cowork task, THR-677)
---

Run the weekly **workflow** retrospective for The Fantasy World Simulator (codename Threadbare).

Repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
Linear team: Threadbare

This is an automated run of a scheduled task. The user is not present to answer questions. Execute autonomously and note judgment calls in the report.

## Scope — the lane, not the code

This retro asks one question: **is work flowing through the delivery lane correctly?** It examines the *process*, not the product.

**Deliberately NOT in scope** (owned by the Friday `weekly-retro` task, which runs the `retrospective` skill over drift-scan issues + `Docs/impediments.md`):
- codebase health, test/type debt, drift signals
- impediment pattern analysis
- game-design or content quality

If you find a product-health issue, note it in one line under "Handoffs to the Friday retro" and move on. Do not analyse it here.

**Also not in scope:** queue mutation. The daily `daily-backlog-grooming` task fixes orphans, states, and project assignment. You observe and file; you do not re-state issues.

## Your role — read-mostly analyst

- **Never claim an issue** (`assignee:"me"`) or move one to In Dev — `tb-opus-pickup` owns the WIP=1 slot.
- **Never touch `src/`.**
- You MAY: file new Linear issues for process defects, post explanatory comments, and write/commit your report.

## Christian's interface (THR-608)

Christian does not read Linear. The hourly `keep-work-flowing-cc` task owns `Design/briefing.md` and `Design/user-actions.md` — **do not write those two files** (a second writer causes merge conflicts). Put anything needing him under "Needs Christian" in your report in plain language, and make sure the Linear state reflects it so the hourly briefing surfaces it.

## Context to load

- **CLAUDE.md** — the operating manual (Session Types, Definition of Done). Scheduled-task registry: `Docs/ops/scheduled-tasks-registry.md`.
- **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** — the protocol this retro audits, especially "Coordination Failure Modes — Hard Rules" (Rules 1–10).
- **`.claude/skills/pull-work/SKILL.md`** — the pickup flow as an executable checklist.
- The previous workflow retro in `Design/retros/` (most recent `workflow-retro-*.md`), so you can compare against last week rather than starting cold.

## Checks

Cover the last 7 days. For each check, record PASS or a finding — silence is ambiguous.

### 1. Throughput

- How many issues reached Done? Query `list_issues state:"Done" team:"Threadbare" updatedAt:"-P7D"`.
- How many hourly `tb-opus-pickup` runs shipped something vs exited "no ready work" vs checkpointed without shipping? Infer from Linear state history and `git log origin/main --since="7 days ago"`.
- Queue depth trend: is Ready for Dev being refilled as fast as it drains? A queue that hit zero is a finding.

### 2. Handoff quality

Sample the issues that entered Ready for Dev this week:
- Did each carry a coordination block (`Suggested model`, `Parallel-safe with`, `Mutex with`)?
- Did each name a plan doc in **both** the description and the handoff comment?
- Did any get bounced back by `/pull-work` for a missing block? Repeated bounces are a process defect worth a ticket.

### 3. WIP and claim discipline (Rules 1, 6)

- Any period with more than one issue In Dev assigned to the same executor? That is a cross-session leak.
- Any issue claimed but left In Dev with no checkpoint comment for 24h+?
- Any issue closed manually with `save_issue(state:"Done")` from an executor instead of via merge auto-close? That violates Rule 3 and should be a ticket.

### 4. Ship mechanics

- Did every merged PR carrying a `Fixes THR-XX` actually auto-close its issue? A merged PR whose issue stayed open means the keyword was missing from the PR **body** (impediment #140).
- Any issue auto-closed *without* a landing commit? That is the THR-540 false-close pattern — a bare `close|fix|resolve THR-XX` substring, a `thr-XXX-*` branch name, or the ID in a PR title is enough to trigger it.
- Open-PR backlog: how many PRs are open, and how old is the oldest? Rot from strict-mode branch protection is a known failure mode.

### 5. Checkpoint hygiene (THR-632)

- Did unfinished runs post checkpoint comments (what's done / what remains / branch / next step)?
- Any issue with 3+ checkpoints and no ship? Recommend a split and name the seams.

## Filing findings

Actionable process defects become Linear issues in the **Continuous Improvement** project:

- **State:** `Ready for Dev` if cleanly scoped for a cold pickup; `Todo` if it needs a design pass first.
- **Labels:** `Improvement` always; add `Infrastructure` when it touches CI/hooks/tooling.
- **Priority:** Medium (3) by default; High (2) if it is actively costing runs.
- **Body:** `## Context` (what the retro observed, with counts) → `## What to do` (numbered) → `## Files to touch` → `## Coordination block` (`Suggested model` / `Parallel-safe with` / `Mutex with`) → `## Done when` (checklist).

Group related findings into one parent issue with a sub-checklist rather than atomising them.

**Do not** close, merge, or re-state existing tickets as part of this retro. You file; others resolve.

## Report

Write to `Design/retros/workflow-retro-YYYY-MM-DD.md`:

```
# Workflow Retro — YYYY-MM-DD

## Needs Christian
(plain language + recommendation — or "nothing needs you")

## Throughput
(shipped count, run outcomes, queue-depth trend vs last week)

## Findings filed
(THR-XXX — title, one line each)

## Clean checks
(one line per check that passed)

## Handoffs to the Friday retro
(product-health observations, out of scope here)

## Notes
(grey zones, calls I made and why)
```

## Commit

You are Claude Code and CAN commit — but observe the git rules:

- **Never run git state operations with the home tree as CWD** (THR-672). `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` is a read-only mirror of `main` owned by `threadbare-autosync.ps1`. Work in this session's own worktree; branches are repo-global.
- Fetch first, branch off current `origin/main`.
- Commit with **no** `Fixes`/`Closes`/`Resolves THR-XX` keyword — it would auto-close unrelated issues (impediment #140).
- Open a PR, queue with `gh pr merge --auto --merge`, and do not poll-wait on CI (THR-675).

## Known traps

- `save_issue` returns 200 but silently drops writes (impediment #48) — always verify with `get_issue`.
- `list_issues orderBy:"priority"` is rejected at runtime (impediment #49) — sort in memory.
- Unfiltered `list_issues` overflows the response budget (THR-686) — always filter by `state:` or `label:`.
- `rg.exe` is blocked in the sandbox — use the Grep tool or PowerShell `Select-String`.

## Provenance

CC-authored replacement for the Cowork `weekly-workflow-retro` task (THR-677, Pure Claude Code Migration). The original prompt lived in Cowork app state and was unreadable from Claude Code; Christian approved authoring a fresh equivalent (chat, 2026-07-21) sourced from CLAUDE.md, the coordination protocol, and observed lane behavior, with a trial run approved before the schedule is enabled. Scope was drawn conservatively to avoid overlapping the Friday `weekly-retro` (impediments + drift scan) and the daily `daily-backlog-grooming` (queue mutation). If the original prompt is ever recovered, reconcile against it.