# User Action Required

**Last updated:** 2026-07-21 (item 2 added by the THR-653 Cowork cutover; light refresh at 02:54 local by the hourly `keep-work-flowing-cc` CC task; last full rebuild was the 2026-06-23 retro)
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

## 1. Turn off the old Cowork automations · WILL NOT SELF-HEAL · ONLY YOU CAN DO THIS

**Status:** Open, new 2026-07-20 · blocks the last step of the move off Cowork · **carried unanswered through the 2026-07-21 02:54 run**
**Source:** THR-653 (cutover). Follow-up port work: THR-677.

**What happened.** The move off Cowork is essentially done. The Claude Code side now runs the hourly pickup, the hourly briefing (moved to the :45 slot, taking over the one Cowork used), the Friday retrospective, and the Sunday memory tidy-up. Two of those — the retro and the memory tidy-up — had been *written down* as already running for weeks but had in fact never been switched on. They are on now.

The one thing Claude Code cannot do is reach into Cowork and switch its old copies off. Those live inside the Cowork app, and nothing on this machine can see or change them. So until you flip them, a few jobs run twice.

**Fix — in the Cowork app, disable these four scheduled tasks:**

```
keep-work-flowing        (hourly)      — replaced by keep-work-flowing-cc
daily-backlog-grooming   (daily 09:06) — see note below before disabling
weekly-workflow-retro    (Wed 09:04)   — see note below before disabling
weekly-project-hygiene   (Sun 10:04)   — see note below before disabling
```

**Leave `weekly-invoice-check` alone.** It is yours, not Threadbare's, and is deliberately out of scope.

**One catch worth knowing before you flip the bottom three.** `keep-work-flowing` is safe to disable immediately — its replacement is live and proven. The other three have no Claude Code replacement yet, because their instructions only exist inside Cowork and cannot be read from outside it. Disabling them stops those jobs entirely until they are rebuilt.

`daily-backlog-grooming` is the one that matters — it is what keeps the work queue moving, and it wrote the handoff that started this very task. If you disable it, the queue stops being groomed until THR-677 lands.

**So, one question:** would you rather paste those three task prompts out of Cowork so they can be copied over exactly — or should Claude Code write fresh versions and show you a trial run before switching them on? Either answer unblocks THR-677; the first is faithful, the second is faster.

**What breaks if not done.** Nothing breaks, but a handful of jobs run twice a day/week (two grooming passes, two retro documents on the same Friday), and the migration cannot be declared finished. No data is at risk either way.

---

## 2. Land the last rescued plan doc onto `main` — near-resolved · WILL NOT SELF-HEAL

**Status:** Open (minor) · **largely resolved 2026-07-18 13:29.** The spec that actually mattered is now on `origin/main`: `Docs/plans/2026-07-17-pure-claude-code-migration.md` **and** its brainstorm companion are both landed, so the six migration tickets that reference it can read it from `main`. Only **one** rescued doc is still stranded on the `rescue/2026-07-17-detached-plans` branch — `Docs/plans/2026-07-05-entity-visual-header.md` — and its feature (THR-637, Entity Visual Header) already **shipped** (PR #564), so the doc is now a historical artifact, not a live dependency. This item is a candidate to prune at the next full retro.
**Source:** 2026-06-23 retro + 2026-07-18 `keep-work-flowing-cc` freshness pings (retro E1); rescue verified complete 2026-07-18 11:25; migration spec confirmed on `origin/main` 2026-07-18 13:29

**Fix — a design session can do this; it is not a Christian-only task.**
```
git fetch
git checkout rescue/2026-07-17-detached-plans -- Docs/plans/2026-07-05-entity-visual-header.md
# commit onto a docs/* branch off current main, open a PR
```

**What breaks if not done.** Nothing live — the only remaining stranded doc backs an already-shipped feature. No data-loss risk (commits are branch-anchored), no active spec gap.

---

## 3. Decide the Obsidian MCP path · RECURRING

**Status:** Open · ~60 days · ~12 occurrences
**Source:** Impediments #66, #71, #75, #86

**Fix — pick one.**
- **Option A (auto-start):** Configure the Obsidian Local REST API plugin to start with the OS, so the MCP can reach it without Obsidian being open.
- **Option B (filesystem fallback):** Formally accept that the vault skills fall back to direct filesystem writes when the MCP is unreachable, and stop carrying this item every retro. (The fallback already ships in the vault-log skill and requires `OBSIDIAN_VAULT_PATH`.)

**What breaks if not done.** Vault appends from session activity (log.md, retro outputs, ingest results) silently queue or drop, and the vault drifts from canonical state. Either path closes the issue; status quo is the worst option — we keep paying the queue+replay cost without resolving it.

---

## 4. Triage 15 untracked design drafts · DE-ESCALATED 2026-07-20 22:54 — no longer blocking

**Status:** Open (cosmetic) · **the load-bearing doc landed.** `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` merged to `origin/main` via **PR #638** (verified `git cat-file -e origin/main:<path>`). THR-673, 674, 675 and 676 — four Ready-for-Dev tickets — all open with "**Plan doc:** … read first," and an executor claiming any of them can now read it from a fresh clone or an isolation worktree. **The starvation risk this item existed to name is closed.** (Two of the six have now shipped: **THR-671 at 2026-07-21 00:34 via PR #646**, **THR-672 at 01:22 via PR #648**.)

**What remains is ordinary debris:** 15 untracked drafts on this machine only — `Docs/judge-metrics/2026-W29.md`, nine `Docs/plans/.intent-proposals/*.md`, five `Docs/plans/2026-07-04|05-*` brainstorm / exploration docs. THR-674 is the queued ticket that owns their triage.

**The flush pipeline works; merging is the slow step.** Re-confirmed across the 21:55 → 02:54 runs: `flush-plan-docs` correctly branched and opened #638, and **eight PRs merged overnight** (#638 plan doc, #639/#643/#645/#647/#649 briefings, #644 impediment log, #646/#648 for THR-671/672, plus #650 carrying the THR-616 P2 economy slices) — end-to-end proof the path functions when nudged. But **fourteen PRs remain open and unmerged** (thirteen docs + one feature), unchanged in count since 01:54: oldest #327 (2026-06-12), then #488 (2026-07-03), #512/#514/#516/#525/#532/#543/#551 (2026-07-04–05), #553 (feature: Axis-B milestone beat, 2026-07-05), #557 (2026-07-17), #571/#599 (briefings), #641 (impediment log). Branch protection runs in **strict mode** (branches must be up to date with `main`), so every open docs PR is knocked `BEHIND` the moment anything lands — and nothing re-freshens them. `Test · Typecheck · Build` shows `SKIPPED` on docs-only PRs, which is expected and is *not* the blocker. The conflict-rot pattern was written into `Docs/impediments.md` on 2026-07-20 23:21 so it stops being rediscovered each run.

**Self-inflicted feedback loop, unchanged:** this briefing task merges its own PR every hour, and each of those merges is what pushes the rest `BEHIND` again.

**THR-675 (auto-merge on green) is the correct systemic fix and is already queued** — no re-scoping needed. Interim manual unblock for any single stranded doc: `gh pr update-branch <N> && gh pr merge <N> --merge`.

**Fix — a design session can do this; it is not a Christian-only task.** Triage the 15: `git status --porcelain | grep '^??'`, per file commit if still wanted, delete if superseded. **Do not `git clean -fd`** — that destroys all 15 without review.

**What breaks if not done.** Nothing blocking. The 15 remain unbacked-up drafts on one machine.

---

## 5. Recurring: something re-parks the home tree off `main` · CONTAINMENT SHIPPED 2026-07-21

**Status:** Cause found (2026-07-20 investigation) · **THR-672 shipped 2026-07-21 01:22 (PR #648)** — the autosync now self-heals the provably loss-free park (detached ∧ 0 unique commits ∧ 0 tracked modifications → `git switch main`), and scheduled sessions are barred from running git state ops with the home tree as CWD · last park event 2026-07-20 ~11:00 (fourth in four days), self-cleared by 11:54 · **no fifth event through the 2026-07-21 01:54 run**

**A second, distinct blocker surfaced at the 01:54 run — different fault, same symptom.** The tree is on `main` but **32 behind as of the 02:54 run** (5 → 9 → 16 → 20 → 24 → 32 across the 21:56 → 02:50 autosync attempts), and the autosync has skipped on every hourly run since 21:56 with `you have uncommitted changes that would be overwritten`. The blocking files are **`Design/briefing.md` and `Design/user-actions.md`** — written into the home tree by *this task* before the THR-672 rule existed.

**Nothing authored is at risk, and this was verified rather than assumed.** Both working copies hash-match blobs already committed on `origin/main` (`git hash-object` vs `git rev-parse <commit>:<path>` — matched at `30d93bf6` / `48d62928`, the 23:54 briefing). They are *superseded briefings*, not edits. Note the nuance: they are **not** byte-identical to current `origin/main` (that holds the newer 00:54 briefing), so the `git diff origin/main -- <path>` test used on previous runs reports non-empty here and would **wrongly** suggest authored work. The hash-against-history check is the correct probe for this case.

**Coverage gap worth a ticket — re-confirmed against the deployed script at 02:54.** The THR-672 script *is* installed (`C:\Users\chris\bin\threadbare-autosync.ps1`, written 01:04, reattach guard present) and is behaving exactly as written. Its guard fires only on the *detached* case; this is the *dirty-tracked-file* case, which hard-blocks by design (`REATTACH_MAX_TRACKED_DIRTY` = 0) and will not self-heal. Extending the same self-heal to "the only dirty tracked files are this task's own outputs, and they match a committed blob" would close it. **Not filed** — the hourly PM task does not create work; surfaced here and in the briefing for a design session to pick up.

**Deployment note for whoever picks that up:** the autosync script lives *outside* the repo, at `C:\Users\chris\bin\`. Merging a change to it in the repo does not deploy it; it has to be copied to that path. Worth checking whether the repo even carries a copy — `git ls-tree -r --name-only origin/main | grep -i autosync` returned nothing at 02:54, so the running script currently has no version-controlled source at all.

**Now self-limiting regardless — and confirmed so at 02:54.** From the 01:54 run onward this task writes both files in its own worktree and never in the home tree. Verified this run: the two dirty files in the home tree are still the *23:54* copies, unchanged by the 00:54, 01:54 and 02:54 runs — the residue has stopped regenerating exactly as predicted. Only the behind-count is still climbing, which is the autosync being blocked, not new damage. Clearing it is a one-time `git checkout -- Design/briefing.md Design/user-actions.md && git pull --ff-only`.
**Source:** `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` (root cause + tickets THR-671…676; now readable on `origin/main`); forensics in `Docs/audits/2026-07-20-git-cicd-forensics/`

Four times in four days, the harness has moved the home tree off `main` at a scheduled-session spawn:

```
07-20 ~11:00  moving from main to claude/friendly-ptolemy-c55480   ← named branch, AT origin/main (harmless)
07-19 10:55   moving from main to HEAD                             ← detached
07-18 09:01   moving from claude/sad-bartik-421eef to HEAD         ← detached
07-17 10:36   moving from main to HEAD                             ← detached
```

**The 07-20 event is the benign variant** and is worth distinguishing: the tree landed on a *named* branch sitting at exactly `origin/main` (0 ahead / 0 behind), so no content drifted and no repair was needed — only the branch *name* differed from `main`. This is precisely the case THR-671 existed to stop mis-reporting as "N commits behind" — **THR-671 shipped 2026-07-21 00:34 (PR #646)**, so the freshness signal now distinguishes parked-off-branch from genuinely-behind. Silently re-attaching the parked tree was THR-672's job — **shipped 2026-07-21 01:22 (PR #648)**. Both halves of the benign-park containment are now live.

**Found (2026-07-20 investigation):** no agent ran it — transcript search across every project directory finds no executed bare `git checkout HEAD` in any session, and agent shell commands always transcript. The actor is the **Claude Code app/harness layer**, the same non-transcript layer that syncs local `refs/heads/main` to `origin/main` via plumbing at scheduled-session spawn seconds (empty-reflog-message updates at :01 each hour; the 07-18 09:01:41 detach is 48 s after the :00:53 `tb-opus-pickup` spawn). The exact code path inside the app is unproven — THR-676 prepares the upstream report. Containment was THR-672 and is **now live**: the hourly auto-sync re-attaches the safe parked case itself, so a recurrence heals within the hour instead of festering for days.

**This is not a Christian action item** — it is listed here so the next agent that finds a detached tree recognises a known fault with a known safe repair rather than re-diagnosing it from scratch.

**Recovery, if you find the tree detached again** — two commands, loses nothing authored:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m "home-tree-recovery"
git switch main
```

First verify nothing unique is stranded: `git rev-list --count origin/main..HEAD` must return `0`. Untracked files survive both commands. **Do not use** `git fetch && git rebase origin/main` (fails from detached HEAD) or `git switch main && git pull` (drags dirty tracked edits).

**Ordinary lag is a different, safer case** (what the tree shows tonight): on `main`, behind by N, with tracked files reading as changed. **Check before repairing** — `git diff origin/main -- <path>` empty means the file already holds upstream content and the "change" is an artefact of `HEAD` sitting behind, not an edit. Repair is then `git reset && git checkout -- <files> && git pull --ff-only`, plus deleting any staged-new file already present on `origin/main` — no stash, no switch, nothing lost. Only if that diff is **non-empty** is there authored work to preserve.

---

## Resolved this period

- **2026-07-21 01:22 — THR-672 shipped (PR #648): the home tree is now an inert, self-healing mirror of `main`.** Second of the six git/CI tickets to land, hours after the first. The autosync re-attaches the provably loss-free park on its own (detached ∧ 0 unique commits ∧ 0 tracked modifications → `git switch main`), and scheduled sessions are barred from running checkout/commit/merge/rebase/reset with the home tree as CWD — the rule this very task now follows. **Caveat, not a regression:** the self-heal covers the *detached* park, not the *dirty-tracked-file* block; see item 5 for the gap found at the 01:54 run. Four siblings (THR-673…676) remain queued. _Prunable at the next full retro._
- **2026-07-21 00:34 — THR-671 shipped (PR #646): the freshness signal distinguishes "parked off-branch" from "behind."** First of the six git/CI investigation tickets to land. This closes the specific mis-reporting fault that made `Design/briefing.md` publish an escalating behind-count (58 → 79) for days while local `main` was in fact 0/0 with `origin/main` the whole time. _Prunable at the next full retro._
- **2026-07-20 22:54 — the load-bearing git/CI plan doc reached `origin/main`** (PR #638 merged). Six Ready-for-Dev tickets that cited a spec existing only on one machine are now readable by any executor. This was the escalation that took item #4 from cosmetic to blocking-adjacent on 2026-07-20 11:05; it is back to cosmetic. _Prunable at the next full retro._
- **2026-07-20 — home tree repaired; the "N commits behind and climbing" alarm was measuring the wrong thing.** The tree is back on `main`, 0 ahead / 0 behind, no modified tracked files; the auto-sync guard passes again. **Correction to the record:** the escalating behind-count this file reported for days (58 → 64 → 69 → 75 → 77 → 79) measured a *frozen detached snapshot* against a moving `origin/main`. Local `main` was **0/0 with `origin/main` the entire time** — the tree was parked beside `main`, never lagging behind it. Nothing was decaying; nothing was at risk. Repair took `git stash push` + `git switch main` and needed no `reset --hard`. **The 68 staged files were worse than "stale echoes"**: diffed against their base they were 221 insertions / 3,379 deletions, reversing THR-614's `quintessence`→`cohesion` rename and THR-575's CLAUDE.md trim — phantom staleness, not authored damage: the CC harness moved `refs/heads/main` forward via plumbing *while `main` was checked out* (07-18 20:01, reflog + autosync-log correlation), which leaves index and working files at the old content and makes `git status` report the delta as "staged changes" — nobody staged anything (see `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` § 1.3). Committing them would have reverted shipped work. They are stashed at `stash@{0}`, recoverable. Residual work moved to items #4 (untracked docs) and #5 (the recurring cause). _Prunable at the next full retro._
- **2026-06-23 — `LINEAR_API_KEY` set in the Codex automation environment** (was item #1; impediment #141, 17 recurrences). Confirmed by Christian same day the retro surfaced it. _Superseded 2026-06-23 by the full Codex-lane retirement (THR-486): there is now a single Opus executor and one `Ready for Dev` queue, so the Codex-specific unblock is moot. Kept for the audit trail; safe to prune at the next full retro rebuild._
- **2026-06-23 — GitHub Pro / branch protection resolved** (was item #4 in the prior seed; impediment #56). Branch protection is now active on `main` with `Test · Typecheck · Build` as a required status check (THR-282 shipped 2026-04-30). The "CI stays advisory because branch protection can't be enforced" concern is closed. To be removed on next retro day.
- **2026-07-19 — local dependencies reinstalled; `npm run dev` / `npm test` work again on the home tree** (was item #0, surfaced 2026-07-19 11:29, re-verified broken across four consecutive hourly runs). Confirmed resolved at the 16:28 run: `node_modules/.bin` now exists with **99 shims** (was absent entirely), 284 top-level packages (was 276), and `npm exec -- vite --version` returns `vite/7.3.1 win32-x64 node-v24.14.0` instead of `'vite' is not recognized`. Local dev server, test runs, production build, and the `lint:plan-doc` / `check:skill-sync` pre-commit hooks are all unblocked from the home tree, which restores the browser-screenshot step of the Definition of Done. The worktree-specific `.bin` shim workaround documented under that item is still valid for **scratch worktrees**, which have no `node_modules` of their own — see impediment #186.
- **2026-07-18 — Linear-from-scheduled-context confirmed reliable** (was item #4; three clean data points now: 2026-06-23, and two `keep-work-flowing-cc` runs on 2026-07-18). The hedge is dropped — scheduled/autonomous CC sessions can trust the Linear MCP without caveating conclusions on it.

---

*This file is regenerated by Cowork on retro day from `Docs/impediments.md`, the active retro, and any newly filed Christian-owned impediments. Manual edits between retro days are fine — they'll be preserved as long as the item is still open. To force a refresh between retros, run `/retrospective` or ask Cowork directly: "rebuild user-actions."*
