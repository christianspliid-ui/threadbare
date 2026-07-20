# User Action Required

**Last updated:** 2026-07-20, 11:05 local (light refresh by the hourly `keep-work-flowing-cc` CC task; last full rebuild was the 2026-06-23 retro)
**Owner of items below:** Christian. Everyone else's blockers go in Linear or `Docs/impediments.md`.
**Refresh cadence:** The hourly `keep-work-flowing-cc` scheduled task keeps this current (prunes resolved items, adds newly-surfaced Christian-owned ones); the `retrospective` skill still does the deep periodic rebuild. This is the slow-moving standing-asks list — the fresh-this-hour view is [`Design/briefing.md`](briefing.md).

## How this works

The retrospective stopped being the right channel for "Christian, please flip one switch." Christian-owned asks were buried in retro prose, and nothing surfaced them between retros. This file replaces that pattern.

Read order: top to bottom is blast radius. The top items break canonical workflow invariants right now; the bottom items are operational debt with workarounds in place.

For each item:
- **Fix** = the literal command, click path, or line of config that resolves it.
- **What breaks** = the named system or invariant currently degraded.
- **Source** = `Docs/impediments.md` entry numbers + occurrence count, so the cost is visible.

When an item resolves: delete it from this file, mark the corresponding impediment as resolved in the dashboard regen, note the close in the next retro under "What shipped." No history retained here — `git log` + the retros are the audit trail.

---

## 1. Land the last rescued plan doc onto `main` — near-resolved · WILL NOT SELF-HEAL

**Status:** Open (minor) · **largely resolved 2026-07-18 13:29.** The spec that actually mattered is now on `origin/main`: `Docs/plans/2026-07-17-pure-claude-code-migration.md` **and** its brainstorm companion are both landed (verified this run), so the six migration tickets that reference it can read it from `main`. Only **one** rescued doc is still stranded on the `rescue/2026-07-17-detached-plans` branch — `Docs/plans/2026-07-05-entity-visual-header.md` — and its feature (THR-637, Entity Visual Header) already **shipped** (PR #564), so the doc is now a historical artifact, not a live dependency. This item is a candidate to prune at the next full retro.
**Source:** 2026-06-23 retro + 2026-07-18 `keep-work-flowing-cc` freshness pings (retro E1); rescue verified complete 2026-07-18 11:25; migration spec confirmed on `origin/main` 2026-07-18 13:29

**Fix — a design session can do this; it is not a Christian-only task.**
```
git fetch
git checkout rescue/2026-07-17-detached-plans -- Docs/plans/2026-07-05-entity-visual-header.md
# commit onto a docs/* branch off current main, open a PR
```
Then triage the other uncommitted working-tree files (item #3).

**What breaks if not done.** Nothing live — the only remaining stranded doc backs an already-shipped feature. No data-loss risk (commits are branch-anchored), no active spec gap.

---

## 2. Decide the Obsidian MCP path · RECURRING

**Status:** Open · ~60 days · ~12 occurrences
**Source:** Impediments #66, #71, #75, #86

**Fix — pick one.**
- **Option A (auto-start):** Configure the Obsidian Local REST API plugin to start with the OS, so the MCP can reach it without Obsidian being open.
- **Option B (filesystem fallback):** Formally accept that the vault skills fall back to direct filesystem writes when the MCP is unreachable, and stop carrying this item every retro. (The fallback already ships in the vault-log skill and requires `OBSIDIAN_VAULT_PATH`.)

**What breaks if not done.** Vault appends from session activity (log.md, retro outputs, ingest results) silently queue or drop, and the vault drifts from canonical state. Either path closes the issue; status quo is the worst option — we keep paying the queue+replay cost without resolving it.

---

## 3. Decide the fate of 16 untracked design docs — one of them is load-bearing · WILL NOT SELF-HEAL

**Status:** Open · **escalated 2026-07-20 11:05** from cosmetic to blocking-adjacent. Count is now **16** (was 15): `Docs/judge-metrics/2026-W29.md`, nine `Docs/plans/.intent-proposals/*.md`, five `Docs/plans/2026-07-04|05-*` brainstorm / exploration docs — and, new this morning, **`Docs/plans/2026-07-20-git-cicd-clean-delivery.md`**. All exist **nowhere on `origin/main`** (verified `git cat-file -e origin/main:<path>`).

**The new one is not a draft.** THR-671, 672, 673, 674, 675 and 676 — six Ready-for-Dev tickets, two of them High — all open with "**Plan doc:** `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` — read first." An executor claiming any of them from a fresh clone or an isolation worktree will not find it. THR-671 carries `plan-pending-commit`, so the hourly `flush-plan-docs` task (:15) *should* land it; it had not as of 11:05. **If it is still untracked after the next :15 run, treat `flush-plan-docs` as broken for home-tree-only docs and file it** — the likely fault is the flush running from a worktree where the untracked file does not exist.

**Fix — a design session can do this; it is not a Christian-only task.** Land the git/CI-CD plan doc first and independently (`docs/*` branch → PR), then triage the other 15: `git status --porcelain | grep '^??'`, per file commit if still wanted, delete if superseded. **Do not `git clean -fd`** — that destroys all 16 without review, including the live plan doc.

**What breaks if not done.** Six queued tickets reference a spec their executor cannot read — the top of the queue silently starves or ships guesswork. The other 15 remain unbacked-up drafts on one machine.

---

## 4. Recurring: something re-parks the home tree off `main` · INVESTIGATED — FIXES TICKETED

**Status:** Cause found (2026-07-20 investigation) · **recurred 2026-07-20 ~11:00 — fourth event in four days** · **will keep recurring until THR-672 lands**, but recurrence now self-identifies within the hour and the repair below is verified safe
**Source:** `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` (root cause + tickets THR-671…676); forensics in `Docs/audits/2026-07-20-git-cicd-forensics/`

Four times in four days, the harness has moved the home tree off `main` at a scheduled-session spawn:

```
07-20 ~11:00  moving from main to claude/friendly-ptolemy-c55480   ← named branch, AT origin/main (harmless)
07-19 10:55   moving from main to HEAD                             ← detached
07-18 09:01   moving from claude/sad-bartik-421eef to HEAD         ← detached
07-17 10:36   moving from main to HEAD                             ← detached
```

**The 07-20 event is the benign variant** and is worth distinguishing: the tree landed on a *named* branch sitting at exactly `origin/main` (0 ahead / 0 behind), so no content drifted and no repair was needed — only the branch *name* differs from `main`. This is precisely the case THR-671 exists to stop mis-reporting as "N commits behind," and the case THR-672's auto-sync should silently re-attach.

**Found (2026-07-20 investigation):** no agent ran it — transcript search across every project directory finds no executed bare `git checkout HEAD` in any session, and agent shell commands always transcript. The actor is the **Claude Code app/harness layer**, the same non-transcript layer that syncs local `refs/heads/main` to `origin/main` via plumbing at scheduled-session spawn seconds (empty-reflog-message updates at :01 each hour; the 07-18 09:01:41 detach is 48 s after the :00:53 `tb-opus-pickup` spawn). The exact code path inside the app is unproven — THR-676 prepares the upstream report. Containment is THR-672: the hourly auto-sync learns to re-attach the safe parked case itself, so a recurrence heals within the hour instead of festering for days.

**This is not a Christian action item** — it is listed here so the next agent that finds a detached tree recognises a known fault with a known safe repair rather than re-diagnosing it from scratch.

**Recovery, if you find the tree detached again** — two commands, loses nothing authored:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m "home-tree-recovery"
git switch main
```

First verify nothing unique is stranded: `git rev-list --count origin/main..HEAD` must return `0`. Untracked files survive both commands. **Do not use** `git fetch && git rebase origin/main` (fails from detached HEAD) or `git switch main && git pull` (drags dirty tracked edits).

---

## Resolved this period

- **2026-07-20 — home tree repaired; the "N commits behind and climbing" alarm was measuring the wrong thing.** The tree is back on `main` at `8d481fbd`, 0 ahead / 0 behind, no modified tracked files; the auto-sync guard passes again. **Correction to the record:** the escalating behind-count this file reported for days (58 → 64 → 69 → 75 → 77 → 79) measured a *frozen detached snapshot* against a moving `origin/main`. Local `main` was **0/0 with `origin/main` the entire time** — the tree was parked beside `main`, never lagging behind it. Nothing was decaying; nothing was at risk. Repair took `git stash push` + `git switch main` and needed no `reset --hard`. **The 68 staged files were worse than "stale echoes"**: diffed against their base they were 221 insertions / 3,379 deletions, reversing THR-614's `quintessence`→`cohesion` rename and THR-575's CLAUDE.md trim — phantom staleness, not authored damage: the CC harness moved `refs/heads/main` forward via plumbing *while `main` was checked out* (07-18 20:01, reflog + autosync-log correlation), which leaves index and working files at the old content and makes `git status` report the delta as "staged changes" — nobody staged anything (see `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` § 1.3, correcting the earlier `git checkout <old-ref> -- <paths>` theory). Committing them would have reverted shipped work. They are stashed at `stash@{0}`, recoverable. The 11 unstaged edits were `.codesight` noise plus a CLAUDE.md change already present verbatim on `origin/main`. Residual work moved to items #3 (untracked docs) and #4 (the recurring cause). _Prunable at the next full retro._
- **2026-06-23 — `LINEAR_API_KEY` set in the Codex automation environment** (was item #1; impediment #141, 17 recurrences). Confirmed by Christian same day the retro surfaced it. _Superseded 2026-06-23 by the full Codex-lane retirement (THR-486): there is now a single Opus executor and one `Ready for Dev` queue, so the Codex-specific unblock is moot. Kept for the audit trail; safe to prune at the next full retro rebuild._
- **2026-06-23 — GitHub Pro / branch protection resolved** (was item #4 in the prior seed; impediment #56). Branch protection is now active on `main` with `Test · Typecheck · Build` as a required status check (THR-282 shipped 2026-04-30). The "CI stays advisory because branch protection can't be enforced" concern is closed. To be removed on next retro day.
- **2026-07-19 — local dependencies reinstalled; `npm run dev` / `npm test` work again on the home tree** (was item #0, surfaced 2026-07-19 11:29, re-verified broken across four consecutive hourly runs). Confirmed resolved at the 16:28 run: `node_modules/.bin` now exists with **99 shims** (was absent entirely), 284 top-level packages (was 276), and `npm exec -- vite --version` returns `vite/7.3.1 win32-x64 node-v24.14.0` instead of `'vite' is not recognized`. Local dev server, test runs, production build, and the `lint:plan-doc` / `check:skill-sync` pre-commit hooks are all unblocked from the home tree, which restores the browser-screenshot step of the Definition of Done. The worktree-specific `.bin` shim workaround documented under that item is still valid for **scratch worktrees**, which have no `node_modules` of their own — see impediment #186.
- **2026-07-18 — Linear-from-scheduled-context confirmed reliable** (was item #4; three clean data points now: 2026-06-23, and two `keep-work-flowing-cc` runs on 2026-07-18). The hedge is dropped — scheduled/autonomous CC sessions can trust the Linear MCP without caveating conclusions on it.

---

*This file is regenerated by Cowork on retro day from `Docs/impediments.md`, the active retro, and any newly filed Christian-owned impediments. Manual edits between retro days are fine — they'll be preserved as long as the item is still open. To force a refresh between retros, run `/retrospective` or ask Cowork directly: "rebuild user-actions."*
