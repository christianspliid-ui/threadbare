# Upstream bug report (draft) — Claude Code harness mutates the home repository's git state

**Status:** DRAFT — not yet filed. External posting is gated on Christian's explicit approval in chat (THR-676 § Scope 2).
**Target:** `anthropics/claude-code` issue tracker.
**Prepared:** 2026-07-21 by the `tb-opus-pickup` executor lane, under THR-676.
**Evidence base:** `Docs/audits/2026-07-20-git-cicd-forensics/` (this directory) + `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` § 1.

Everything below the horizontal rule is the report body as it would be pasted into the issue. It is written for a reader with no knowledge of this project.

---

## Title

Harness mutates the user's checked-out repository at session spawn: bare `git checkout HEAD` detaches the working tree, and plumbing-style `refs/heads/main` updates fire under a live checkout

## Environment

| | |
|---|---|
| Claude Code version | 2.1.90 |
| OS | Windows 11 Pro 10.0.26200 |
| Git | 2.53.0.windows.2 |
| Shell | PowerShell 7 (primary), Git Bash available |
| Repo layout | One "home" clone, normally checked out on `main`. Sessions run in harness-created worktrees under `.claude/worktrees/`. |
| Session mix | 3 hourly scheduled headless sessions (cron `0 * * * *` ×2, `45 * * * *` ×1) + occasional interactive sessions. Subagent forks get their own worktrees. |

## Summary

Two distinct git mutations occur against the **home** repository — the one the user has checked out — that no agent in any session performed. Both correlate tightly with session-spawn instants. Together they produce a working tree that looks catastrophically damaged but is not, costing multiple days of misdiagnosis.

1. **Plumbing-style updates to `refs/heads/main`** at session spawn. When this fires while `main` is *checked out*, it moves the branch under a live working tree and index, manufacturing a large phantom "staged changes" pile.
2. **A bare `git checkout HEAD`** (no pathspec) that detaches the home tree's HEAD, observed on multiple consecutive mornings.

Neither appears in any session transcript. Agent shell commands always appear in transcripts; these do not — which is what points at the harness layer rather than at model-issued commands.

## Behavior 1 — plumbing updates to `refs/heads/main` at spawn

`git reflog show main` on the home repo shows entries with an **empty reflog message**, clustered at :01–:03 past the hour, matching the scheduled-session spawn instants:

```
f20137c0 main@{2026-07-21 07:01:30 +0200}:
bad2dc1e main@{2026-07-20 21:54:15 +0200}: reset: moving to origin/main
4b2b6ddd main@{2026-07-20 10:48:23 +0200}:
4f1bac39 main@{2026-07-19 17:01:04 +0200}:
b89a5076 main@{2026-07-19 16:01:03 +0200}:
ba062ff9 main@{2026-07-19 14:01:03 +0200}:
e113a461 main@{2026-07-19 13:02:04 +0200}:
05546600 main@{2026-07-19 11:01:28 +0200}:
013c1044 main@{2026-07-18 20:01:06 +0200}:
fdf6a1c3 main@{2026-07-18 11:01:51 +0200}:
```

An empty reflog message is the signature of `git update-ref`-style plumbing. Porcelain operations (`fetch`, `merge`, `pull`, `reset`, `checkout`) all write a descriptive message — visible in the same log for the operations that *were* agent- or script-issued (`reset: moving to origin/main`, `pull --ff-only origin main: Fast-forward`).

The correlation with spawn is second-precision. On **2026-07-21**, the entry `main@{07:01:30}` precedes the creation of that session's worktree `.git` file at `07:01:32` by two seconds — captured live while preparing this report.

### Why this one is damaging

`update-ref` moves the branch pointer but touches neither the index nor the working files. If the home tree has `main` checked out when it fires, `git status` afterwards reports the delta between the new HEAD and the stale index as **staged changes**.

Observed on 2026-07-18 20:01:06: the home tree was on `main`, the ref moved forward, and `git status` subsequently showed **68 staged files — 221 insertions, 3,379 deletions**. The staged content *reversed* work that had just been merged (a project-wide identifier rename, a docs trim, deletions of newly added files). It reads exactly like an agent had catastrophically reverted the repository.

Nothing was staged by anyone. Committing that pile would have reverted ~3,200 lines of shipped work. Full diff preserved at `staged.patch` in this directory.

## Behavior 2 — bare `git checkout HEAD` detaching the home tree

`git reflog` (HEAD) on the home repo:

```
013c1044 HEAD@{2026-07-19 10:55:03 +0200}: checkout: moving from main to HEAD
053c867a HEAD@{2026-07-18 09:01:41 +0200}: checkout: moving from claude/sad-bartik-421eef to HEAD
cf2f2dd5 HEAD@{2026-07-17 10:36:13 +0200}: checkout: moving from main to HEAD
```

The reflog wording `checkout: moving from <branch> to HEAD` is produced **only** by a bare `git checkout HEAD` with no pathspec. The pathspec form (`git checkout HEAD -- <path>`) does not move HEAD and writes no reflog entry at all.

The 2026-07-18 event fired **48 seconds after** a scheduled session's spawn instant. The home tree remains detached as of this writing (2026-07-21), i.e. the behavior is current, not historical.

Note the 07-18 event moved *from a `claude/*` branch* — a branch name created by the harness's own worktree tooling — which is further evidence the actor is session tooling rather than a user action.

### Suspected mechanism (unproven)

A plausible shape is code that captures the current branch with `git rev-parse --abbrev-ref HEAD` and later restores it with `git checkout "$BRANCH"`. When HEAD is already detached, `rev-parse --abbrev-ref HEAD` returns the literal string `HEAD`, so the restore becomes `git checkout HEAD` — which detaches, making the bug self-perpetuating once it fires the first time. This is a hypothesis from the reflog shape only; we cannot inspect the harness implementation.

## Why we attribute this to the harness

- **Transcript-absence.** Every session transcript under the project's `~/.claude/projects/*` directories was searched. No executed bare `git checkout HEAD` exists in any session — only the harmless pathspec form, plus later sessions *discussing* the mystery. Model-issued shell commands are always transcripted; these operations are not.
- **Timing.** Both behaviors cluster on session-spawn seconds across many days, including spawns of headless scheduled sessions running while the machine was otherwise idle.
- **Ruled out:** the project's own `threadbare-autosync.ps1` maintenance script (its only checkout is the pathspec form; unmodified since before the events it would need to explain), the project's git-cleanup script, and the project's git hooks.

## Impact

Low risk of actual data loss, high cost in diagnosis:

- The manufactured staged pile is indistinguishable, on inspection, from an agent having destroyed the repository. Sessions escalated it as catastrophic damage for several days.
- A detached home tree makes every "how far behind are we?" check meaningless: `HEAD..origin/main` on a parked HEAD measures a frozen snapshot against a moving branch. Our tooling reported "58 → 79 commits behind and climbing" while local `main` was in fact 0 ahead / 0 behind the whole time.
- Automated maintenance that guards on `rev-parse --abbrev-ref HEAD == main` silently no-ops while detached, so the state persists until a human notices.
- Estimated ~10–20% of automation wall-clock over one week went to this class of issue; at least three sessions were lost outright.

**No data was ultimately lost**, in our case: branch protection kept the phantom reversal off `main`, and recovery was `git stash push` + `git switch main`. The cost was entirely diagnostic.

## Expected behavior

The harness should not mutate the state of a repository the user has checked out:

1. Do not move `refs/heads/<branch>` while that branch is checked out in any worktree. If the harness needs a current `main` for its own purposes, fetch to `refs/remotes/origin/main` and read that, or operate on a bare mirror.
2. Do not issue a bare `git checkout HEAD` against the home tree. If branch state must be saved and restored, guard for the detached case (`git symbolic-ref -q HEAD` returns non-zero when detached) rather than round-tripping `rev-parse --abbrev-ref`.
3. If either mutation is intentional, emit a descriptive reflog message so it is attributable, and surface it in the session log.

## Reproduction

We cannot offer a minimal deterministic repro — the trigger is inside the closed harness. The conditions under which it reproduces for us:

1. Windows 11, Claude Code 2.1.90.
2. A git repo whose home clone stays checked out on `main`.
3. Several scheduled headless sessions per hour, each getting a harness worktree under `.claude/worktrees/`.
4. Let it run for a day or more, then inspect `git reflog show main` for empty-message entries and `git reflog` for `checkout: moving from <branch> to HEAD`.

We are happy to supply full reflogs, the staged patch, or run any diagnostic that would help isolate it.

---

## Filing checklist (internal — not part of the report body)

- [ ] Christian approves filing in chat (surfaced via `Design/briefing.md`)
- [ ] File at `anthropics/claude-code` with the body above
- [ ] Record the resulting issue URL in a comment on THR-676
- [ ] Cross-link the URL into `CLAUDE.md` § Known Sandbox Limitations, replacing "Upstream bug report: THR-676"
