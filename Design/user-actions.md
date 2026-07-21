# User Action Required

**Last updated:** 2026-07-21 (item 2 added by the THR-653 Cowork cutover; light refresh at 06:55 local by the hourly `keep-work-flowing-cc` CC task — item 5 escalated to a Christian action after a fifth park event and the autosync's own "manual repair needed" verdict; **new item 6** added, external-filing consent for THR-676; last full rebuild was the 2026-06-23 retro)
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

**Status:** Open, new 2026-07-20 · blocks the last step of the move off Cowork · **carried unanswered through the 2026-07-21 06:55 run**
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

## 4. PR merge backlog — 14 open, oldest 2026-06-12 · SYSTEMIC FIX SHIPPED 2026-07-21 05:22

**Status:** Open (not blocking) · **the untracked-drafts half of this item is RESOLVED** — all 15 landed on `origin/main` at 2026-07-21 ~02:20 via **PR #654** (THR-674, in flight). Verified this run: each of the 15 files still present untracked in the home tree is **byte-identical** to its committed counterpart, so the local copies are now pure duplicates. What survives here is the merge backlog they were tangled up with.

**The flush pipeline works; merging is the slow step.** Re-confirmed across the 21:55 → 04:54 runs: **ten PRs merged overnight** (#638 plan doc, #639/#643/#645/#647/#649/#651/#653 briefings, #644 impediment log, #646/#648 for THR-671/672, #650 THR-616 economy slices, #654/#655 for THR-674) — end-to-end proof the path functions when nudged. But **fourteen PRs remain open and unmerged** (thirteen docs + one feature), unchanged in count since 01:54 and re-verified at 06:55 — **including across the auto-merge fix landing at 05:22**, which confirms the "does not retroactively rescue" prediction below rather than contradicting it: oldest #327 (2026-06-12), then #488 (2026-07-03), #512/#514/#516/#525/#532/#543/#551 (2026-07-04–05), #553 (feature: Axis-B milestone beat, 2026-07-05), #557 (2026-07-17), #571/#599 (briefings), #641 (impediment log). Branch protection runs in **strict mode** (branches must be up to date with `main`), so every open docs PR is knocked `BEHIND` the moment anything lands — and nothing re-freshens them. `Test · Typecheck · Build` shows `SKIPPED` on docs-only PRs, which is expected and is *not* the blocker. The conflict-rot pattern was written into `Docs/impediments.md` on 2026-07-20 23:21 so it stops being rediscovered each run.

**Self-inflicted feedback loop, unchanged:** this briefing task merges its own PR every hour, and each of those merges is what pushes the rest `BEHIND` again.

**THR-675 shipped at 05:22 local (PR #657) and is the correct systemic fix.** Verified this run against the live repo settings: `allow_auto_merge` is **true** and `delete_branch_on_merge` is still on, so `gh pr merge --auto --merge` now lands a PR the moment its checks go green with no session left poll-waiting. The same ticket fixed the `check:skill-sync` pre-commit hook, which had been falsely blocking commits over *gitignored* scratch artifacts (62 mentions in `Docs/impediments.md`) — the `check:skill-sync:sync`-first workaround is retired.

**This does not retroactively rescue the fourteen already-open PRs.** They went stale before the fix existed, and strict-mode branch protection still requires each to be brought up to date individually: `gh pr update-branch <N> && gh pr merge <N> --auto --merge`. Expect the backlog to drain gradually, not vanish. Newly-opened PRs (including this task's own hourly briefing) should now self-merge.

**One of the fourteen deserves separate attention:** #553 is a **feature** PR (Axis-B essence-source milestone beat), not documentation, and has sat since 2026-07-05 in `DIRTY` state — it needs conflict resolution, not just a refresh. Worth a design session confirming whether it is still wanted before it rots further.

**What breaks if not done.** Nothing blocking. Documentation lands late; one feature branch ages.

---

## 5. Home tree needs a manual repair · CHRISTIAN ACTION · WILL NOT SELF-HEAL

**Status:** **ESCALATED at the 06:55 run — the autosync has given up and said so.** A **fifth park event** fired at 06:20 (`checkout: moving from main to HEAD`), so the tree is now **detached and 52 behind**. After **ten consecutive refusals** (5 → 9 → 16 → 20 → 24 → 32 → 38 → 44 → 48 behind across 21:56 → 05:50, each logging `you have uncommitted changes that would be overwritten`), the 06:50 attempt escalated to: `MANUAL REPAIR NEEDED: parked at bad2dc1e with 3 tracked modification(s). Nothing unique is stranded, so this is safe to repair by hand`. **This is no longer expected to clear on its own.**

**Cause found 2026-07-20; containment shipped but does not cover this variant.** THR-671 (freshness signal, PR #646) and THR-672 (inert home tree + autosync reattach, PR #648) both landed 2026-07-21. THR-672's self-heal guard fires only on the *clean* park (detached ∧ 0 unique commits ∧ **0 tracked modifications** → `git switch main`). This morning's park has 3 tracked modifications, so the guard correctly stands down. The gap is real and is described below.

**Verified loss-free this run — every blocking file checked individually, not assumed.**

| Blocking file(s) | Verdict |
|---|---|
| `Design/briefing.md`, `Design/user-actions.md` | Hash-match blobs already committed in history (`4a449433` @ `28626e7d`, `60fed5a1` @ `30d93bf6`) — **superseded briefings**, not edits |
| `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` (staged-add) | `git diff origin/main` **empty** — already on `main` |
| The 15 formerly-untracked drafts | **15/15 byte-identical** to their `origin/main` counterparts (landed via PR #654) |
| Unique commits (`origin/main..HEAD`) | **0** |

Note the probe nuance: the two briefing files are **not** byte-identical to *current* `origin/main` (which holds a newer briefing), so `git diff origin/main -- <path>` reports non-empty and would **wrongly** suggest authored work. Hash-against-history is the correct test for this case.

**Repair — four commands, verified lossless against the state above.** Local `main` and detached `HEAD` are the same commit (`bad2dc1e`) with no diff between them, so `git switch main` is content-neutral and needs no stash. The 15 duplicate drafts would otherwise make `git pull --ff-only` refuse with *untracked working tree files would be overwritten*, which is why the hard reset is the cleaner finish here:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git switch main
git fetch origin main
git reset --hard origin/main
```

⚠ `reset --hard` is safe **only because** the table above was verified this run. It is not a general-purpose recipe — re-verify before reusing it on a future park.

**Coverage gap worth a ticket — now demonstrated end-to-end, not merely predicted.** The THR-672 script *is* installed (`C:\Users\chris\bin\threadbare-autosync.ps1`, written 01:04, reattach guard present) and is behaving exactly as written — including its escalation message, which fired correctly at 06:50. The gap: `REATTACH_MAX_TRACKED_DIRTY` = 0 means *any* tracked modification blocks the self-heal, even when the modification is provably a superseded copy of a committed blob. Extending the guard to "dirty tracked files are permitted when each one hash-matches a blob reachable from `origin/main`" would have healed all ten of this cycle's refusals automatically. The 06:20 park proves the case is recurrent, not a one-off. **Not filed** — the hourly PM task does not create work; surfaced here and in the briefing for a design session to pick up.

**Deployment note for whoever picks that up:** the autosync script lives *outside* the repo, at `C:\Users\chris\bin\`. Merging a change to it in the repo does not deploy it; it has to be copied to that path. Worth checking whether the repo even carries a copy — `git ls-tree -r --name-only origin/main | grep -i autosync` returned nothing again at 03:54, so the running script still has no version-controlled source at all.

**Residue confirmed non-regenerating — re-verified at 06:55.** From the 01:54 run onward this task writes both files in its own worktree and never in the home tree. The two dirty files in the home tree are still the *23:54* copies, unchanged across the 00:54 → 06:55 runs. Only the behind-count climbs, which is the autosync being blocked, not new damage.

**THR-674 is no longer the likely resolver.** It has been In Dev since 02:02 (nearly five hours) and has landed PRs #654/#655, but its Done-when — "`git status` clean on the home tree" — is further away than when it started, since the 06:20 park added detachment on top of the dirt. Its remaining scope also grew: the stash stack is **38 entries**, not the 12 the ticket scoped. The four manual commands above are now the faster path.
**Source:** `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` (root cause + tickets THR-671…676; now readable on `origin/main`); forensics in `Docs/audits/2026-07-20-git-cicd-forensics/`

Five times in five days, the harness has moved the home tree off `main` at a scheduled-session spawn:

```
07-21 06:20   moving from main to HEAD                             ← detached, DIRTY — needs manual repair
07-20 ~11:00  moving from main to claude/friendly-ptolemy-c55480   ← named branch, AT origin/main (harmless)
07-19 10:55   moving from main to HEAD                             ← detached
07-18 09:01   moving from claude/sad-bartik-421eef to HEAD         ← detached
07-17 10:36   moving from main to HEAD                             ← detached
```

The 07-21 event is the first to land on a tree that was **already dirty**, which is what puts it outside THR-672's self-heal envelope.

**The 07-20 event is the benign variant** and is worth distinguishing: the tree landed on a *named* branch sitting at exactly `origin/main` (0 ahead / 0 behind), so no content drifted and no repair was needed — only the branch *name* differed from `main`. This is precisely the case THR-671 existed to stop mis-reporting as "N commits behind" — **THR-671 shipped 2026-07-21 00:34 (PR #646)**, so the freshness signal now distinguishes parked-off-branch from genuinely-behind. Silently re-attaching the parked tree was THR-672's job — **shipped 2026-07-21 01:22 (PR #648)**. Both halves of the benign-park containment are now live.

**Found (2026-07-20 investigation):** no agent ran it — transcript search across every project directory finds no executed bare `git checkout HEAD` in any session, and agent shell commands always transcript. The actor is the **Claude Code app/harness layer**, the same non-transcript layer that syncs local `refs/heads/main` to `origin/main` via plumbing at scheduled-session spawn seconds (empty-reflog-message updates at :01 each hour; the 07-18 09:01:41 detach is 48 s after the :00:53 `tb-opus-pickup` spawn). The exact code path inside the app is unproven — THR-676 prepares the upstream report. Containment was THR-672 and is **now live**: the hourly auto-sync re-attaches the safe parked case itself, so a recurrence heals within the hour instead of festering for days.

**As of 2026-07-21 06:55 this IS a Christian action item** — the four commands at the top of this section. It had been informational for the four prior events, all of which either self-cleared or were repaired by an agent; this fifth one cannot be, because the standing THR-672 rule bars scheduled sessions from running git state ops in the home tree. It also remains a reference note, so the next agent that finds a detached tree recognises a known fault with a known safe repair rather than re-diagnosing it from scratch.

**Recovery, if you find the tree detached again** — two commands, loses nothing authored:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m "home-tree-recovery"
git switch main
```

First verify nothing unique is stranded: `git rev-list --count origin/main..HEAD` must return `0`. Untracked files survive both commands. **Do not use** `git fetch && git rebase origin/main` (fails from detached HEAD) or `git switch main && git pull` (drags dirty tracked edits).

**Ordinary lag is a different, safer case** (what the tree shows tonight): on `main`, behind by N, with tracked files reading as changed. **Check before repairing** — `git diff origin/main -- <path>` empty means the file already holds upstream content and the "change" is an artefact of `HEAD` sitting behind, not an edit. Repair is then `git reset && git checkout -- <files> && git pull --ff-only`, plus deleting any staged-new file already present on `origin/main` — no stash, no switch, nothing lost. Only if that diff is **non-empty** is there authored work to preserve.

---

## 6. Consent to file the upstream bug report publicly · CHRISTIAN ACTION · ONLY YOU CAN DECIDE

**Status:** Open, new 2026-07-21 06:55 · gates the completion of **THR-676**, currently the **top actionable item in the queue**
**Source:** THR-676 § Scope step 2 ("File the GitHub issue only after Christian's yes in chat — external posting is gated"). Root cause + evidence: `Docs/plans/2026-07-20-git-cicd-clean-delivery.md`, forensics in `Docs/audits/2026-07-20-git-cicd-forensics/`.

**What it is.** The 2026-07-20 investigation established that the recurring home-tree park (item 5, now five events) is caused by the **Claude Code app/harness layer itself**, not by the game, the repo, or any agent — two behaviours neither of which appears in any session transcript: a bare `git checkout HEAD` that detaches the tree, and a plumbing-level sync of `refs/heads/main` that fires while `main` is checked out (which is what manufactured the phantom "68 staged files" scare on 07-18). THR-676 writes this up as a reproducible report for `anthropics/claude-code`.

**Why it needs you.** Writing the report is agent work and needs no permission. **Posting it publicly does** — it would describe your machine's setup and quote excerpts from your repository's reflog and history on a public issue tracker. That is a disclosure decision, not a technical verdict, so it is not the agent's to make.

**Fix — answer yes or no in chat.**
- **Yes** → the report is written, committed to `Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md`, filed upstream, and the issue link recorded on THR-676.
- **No** → the report is still written and committed locally; only the public filing is skipped. THR-676 closes either way.

**What breaks if not answered.** THR-676 can be worked but not finished, and it is presently the only non-stale item in the Ready-for-Dev queue — so the executor lane has nothing else substantial to pull. The upstream fault itself stays contained locally regardless (THR-671/672 shipped), so this is about closing the loop, not about risk.

---

## Resolved this period

- **2026-07-21 05:22 — THR-675 shipped (PR #657): pull requests now merge themselves on green, and the `check:skill-sync` false-positive block is gone.** Third of the six git/CI tickets to land. Repo settings verified live this run (`allow_auto_merge: true`, `delete_branch_on_merge: true`), so `gh pr merge --auto --merge` is the standard closeout and executor sessions stop burning 3–8 minutes poll-waiting on CI. The hook fix retires the `npm run check:skill-sync:sync`-first workaround (62 impediment mentions). **Does not retroactively clear the 14 already-open PRs** — see item 4. Two siblings (THR-673, THR-676) remain queued; THR-674 is in flight. _Prunable at the next full retro._
- **2026-07-21 ~02:20 — the 15 untracked design drafts are backed up (PR #654, THR-674).** The "one machine, no backup" exposure this file carried since 2026-07-20 is closed: brainstorms, exploration notes and intent-proposal records that existed only in the home tree are now committed to `origin/main`, with the cleanup findings logged to `Docs/impediments.md` alongside (PR #655). Item 4 has been re-scoped to the surviving concern — the PR merge backlog. Still open inside THR-674: a stash stack that has grown to **38 entries** (scoped at 12) and ~24 stale worktrees. _Prunable at the next full retro._
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
