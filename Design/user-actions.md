# User Action Required

**Last updated:** 2026-07-21 (refresh at 10:54 local by the hourly `keep-work-flowing-cc` CC task — **three items resolved and pruned**: the Cowork demolition sign-off (answered yes, shipped 08:48), the home-tree manual repair (done 10:47), and the Obsidian MCP decision (structurally settled). Items renumbered; **new item 3** added for the empty queue. Last full rebuild was the 2026-06-23 retro)
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

**Status:** Open, new 2026-07-20 · **carried unanswered through the 09:57 and 10:54 runs** · **the sequencing caveat that coupled this to the demolition is now GONE** — THR-654 shipped 08:48 and did not touch the Cowork-side jobs, so nothing was lost by it landing first
**Source:** THR-653 (cutover). Follow-up port work: THR-677.

**What happened.** The move off Cowork is done. The Claude Code side now runs the hourly pickup, the hourly briefing (moved to the :45 slot, taking over the one Cowork used), the Friday retrospective, and the Sunday memory tidy-up. Two of those — the retro and the memory tidy-up — had been *written down* as already running for weeks but had in fact never been switched on. They are on now. The bridging scaffolding was demolished this morning.

The one thing Claude Code cannot do is reach into Cowork and switch its old copies off. Those live inside the Cowork app, and nothing on this machine can see or change them. So until you flip them, a few jobs run twice.

**Fix — in the Cowork app, disable these four scheduled tasks:**

```
keep-work-flowing        (hourly)      — replaced by keep-work-flowing-cc, SAFE TO DISABLE NOW
daily-backlog-grooming   (daily 09:06) — see note below before disabling
weekly-workflow-retro    (Wed 09:04)   — see note below before disabling
weekly-project-hygiene   (Sun 10:04)   — see note below before disabling
```

**Leave `weekly-invoice-check` alone.** It is yours, not Threadbare's, and is deliberately out of scope.

**One catch worth knowing before you flip the bottom three.** `keep-work-flowing` is safe to disable immediately — its replacement is live and proven. The other three have no Claude Code replacement yet, because their instructions only exist inside Cowork and cannot be read from outside it. Disabling them stops those jobs entirely until they are rebuilt.

`daily-backlog-grooming` is the one that matters — it is what keeps the work queue moving, and it wrote the handoff that started this very task. If you disable it, the queue stops being groomed until THR-677 lands. **Note this is no longer hypothetical: the queue reached zero at the 10:54 run** (see item 3).

**So, one question:** would you rather paste those three task prompts out of Cowork so they can be copied over exactly — or should Claude Code write fresh versions and show you a trial run before switching them on? Either answer unblocks THR-677; the first is faithful, the second is faster.

**What breaks if not done.** Nothing breaks, but a handful of jobs run twice a day/week (two grooming passes, two retro documents on the same Friday), and the migration cannot be declared finished. No data is at risk either way.

---

## 2. Consent to file the upstream bug report publicly · CHRISTIAN ACTION · ONLY YOU CAN DECIDE

**Status:** Open, new 2026-07-21 06:55 · **the only thing now gating THR-676** · carried through the 09:57 and 10:54 runs. Re-verified 10:54: THR-676 is still In Dev, **unassigned**, and its write-up is on `origin/main` (PR #661, merged 07:08), so the agent-side work is finished and the ticket waits on this answer alone. **It is now the only issue in development, and with the Ready-for-Dev queue at zero it is the only live ticket of any kind.**
**Source:** THR-676 § Scope step 2 ("File the GitHub issue only after Christian's yes in chat — external posting is gated"). Root cause + evidence: `Docs/plans/2026-07-20-git-cicd-clean-delivery.md`, forensics in `Docs/audits/2026-07-20-git-cicd-forensics/`.

**What it is.** The 2026-07-20 investigation established that the recurring home-tree park was caused by the **Claude Code app/harness layer itself**, not by the game, the repo, or any agent — two behaviours neither of which appears in any session transcript: a bare `git checkout HEAD` that detaches the tree, and a plumbing-level sync of `refs/heads/main` that fires while `main` is checked out (which is what manufactured the phantom "68 staged files" scare on 07-18). THR-676 writes this up as a reproducible report for `anthropics/claude-code`.

**Why it needs you.** Writing the report is agent work and needs no permission. **Posting it publicly does** — it would describe your machine's setup and quote excerpts from your repository's reflog and history on a public issue tracker. That is a disclosure decision, not a technical verdict, so it is not the agent's to make.

**The report is written and is on `origin/main`** — `Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md`. Read it before answering if you want to see exactly what would be disclosed: it names Windows 11 / Claude Code 2.1.90, describes the scheduled-session setup, and quotes ten reflog lines plus file/line counts. It does **not** include repository contents, file paths from your work, or anything about the game.

That run also captured a **live reproduction**: an empty-message `refs/heads/main` update at `07:01:30`, two seconds before that session's own worktree was created, with the home tree detached at the time. The report quotes it.

**Fix — answer yes or no in chat.**
- **Yes** → the report is filed at `anthropics/claude-code` and the issue link recorded on THR-676.
- **No** → nothing further happens; the report stays internal as a local record. THR-676 closes either way.

**What breaks if not answered.** THR-676 stalls one step from done. The upstream fault itself stays contained locally regardless (THR-671/672 shipped, and the containment proved itself this morning), so this is about closing the loop, not about risk.

---

## 3. Name the next stretch — the work queue is empty · CHRISTIAN ACTION · WILL NOT SELF-HEAL

**Status:** Open, new 2026-07-21 10:54 · **Ready for Dev is at zero.** This had been carried as a soft "what's next?" in the briefing for several runs; it is now hard — the demolition shipped at 08:48 and drained the last queued item, so the executor lane has nothing to pull on the hour.
**Source:** Board scan at the 10:54 `keep-work-flowing-cc` run: 0 Ready for Dev, 1 In Dev (THR-676, gated on item 2), 21 Todo.

**Why an agent cannot answer this.** Twenty-one jobs sit in the planning column, so the shortage is not of ideas — it is that none has been through the design pass that makes it handable, and several carry stale blocked-by notes pointing at work that finished on the 18th. Deciding *which* of those becomes the next stretch is a creative-direction call, which is yours by the standing rule (THR-608); re-scoping the chosen one against the real code is then a design session's job, not yours.

**Two directions are nearest, both half-built rather than speculative:**

- **War, deepened** (THR-628 / 629 / 630 — two marked high priority). The war system came alive on the 18th. Designed but not built: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag rather than resolving flat, and the aftermath a region carries once a war ends.
- **The economy, made visible** (THR-669 / 670). The trade layer moves goods, but the player cannot see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what is actually moving along a road when you look at it.

**Fix — say a direction in chat.** "War", "economy", or something else entirely. A rough steer is enough; a design session refills the queue toward it.

**What breaks if not answered.** The hourly executor lane idles. Nothing degrades or is at risk — it simply stops making progress, and each idle hour is a wasted run.

---

## 4. PR merge backlog — 14 open, oldest 2026-06-12 · SYSTEMIC FIX SHIPPED 2026-07-21 05:22

**Status:** Open (not blocking) · **count unchanged at 14, re-verified 10:54** — including across the demolition merge, which again confirms the "does not retroactively rescue" prediction below.

**The pipeline works; merging is the slow step.** Overnight and this morning a steady stream merged end-to-end (#638 plan doc, the hourly briefings, #646/#648 for THR-671/672, #650 THR-616 economy slices, #654/#655 for THR-674, #657 THR-675, #661 THR-676's write-up, #665 THR-644, #667 THR-654) — proof the path functions. But **fourteen PRs remain open and unmerged** (thirteen docs + one feature): oldest #327 (2026-06-12), then #488 (2026-07-03), #512/#514/#516/#525/#532/#543/#551 (2026-07-04–05), #553 (feature: Axis-B milestone beat, 2026-07-05), #557 (2026-07-17), #571/#599 (briefings), #641 (impediment log). Branch protection runs in **strict mode** (branches must be up to date with `main`), so every open docs PR is knocked `BEHIND` the moment anything lands — and nothing re-freshens them. `Test · Typecheck · Build` shows `SKIPPED` on docs-only PRs, which is expected and is *not* the blocker. The conflict-rot pattern was written into `Docs/impediments.md` on 2026-07-20 23:21 so it stops being rediscovered each run.

**Self-inflicted feedback loop, unchanged:** this briefing task merges its own PR every hour, and each of those merges is what pushes the rest `BEHIND` again.

**THR-675 shipped at 05:22 local (PR #657) and is the correct systemic fix.** `allow_auto_merge` is **true** and `delete_branch_on_merge` is still on, so `gh pr merge --auto --merge` now lands a PR the moment its checks go green with no session left poll-waiting. The same ticket fixed the `check:skill-sync` pre-commit hook; **THR-654's demolition this morning removed that hook and its duplicate skill tree entirely**, so the false-positive class is now structurally closed rather than patched.

**This does not retroactively rescue the fourteen already-open PRs.** They went stale before the fix existed, and strict-mode branch protection still requires each to be brought up to date individually: `gh pr update-branch <N> && gh pr merge <N> --auto --merge`. Expect the backlog to drain gradually, not vanish. Newly-opened PRs (including this task's own hourly briefing) self-merge.

**One of the fourteen deserves separate attention:** #553 is a **feature** PR (Axis-B essence-source milestone beat), not documentation, and has sat since 2026-07-05 in `DIRTY` state — it needs conflict resolution, not just a refresh. Worth a design session confirming whether it is still wanted before it rots further.

**What breaks if not done.** Nothing blocking. Documentation lands late; one feature branch ages.

---

## 5. Land the last rescued plan doc onto `main` — near-resolved · WILL NOT SELF-HEAL

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

## Resolved this period

- **2026-07-21 10:47 — the home tree was repaired; the recurring park is closed.** Was item 5, carried and escalated across ten consecutive autosync refusals from 21:56 through 09:50. Verified at the 10:54 run: the tree is on `main`, **0 behind**, **0 tracked modifications**, 0 untracked. The reflog shows the repair (`checkout: moving from bad2dc1e to main` → `reset: moving to origin/main` → fast-forward to `7262f32d`) at 10:47–10:50. Nothing was stranded — `origin/main..HEAD` was 0 throughout, exactly as the loss-free table in the prior version of this item predicted. **The underlying cause remains harness-level** (THR-676, item 2) but its containment is live (THR-671/672) and the tree is inert; a recurrence should now self-heal within the hour rather than festering. The known gap stands and is worth a ticket if it recurs: THR-672's self-heal guard requires **0** tracked modifications, so a park landing on an already-dirty tree still needs a hand. Adjacent ticket THR-678 covers the untracked-file variant. **Deployment note preserved for whoever picks that up:** the autosync script lives *outside* the repo at `C:\Users\chris\bin\threadbare-autosync.ps1` and has no version-controlled source — merging a repo change does not deploy it. _Prunable at the next full retro._
- **2026-07-21 08:48 — the Cowork demolition shipped; you answered yes.** Was item 7, added at 09:57 as the sole blocker on the entire queue. THR-654 went Todo → Ready for Dev (07:13) → In Dev (08:02) → Done (08:48) via PR #667. The `.agents/skills/` duplicate tree, `scripts/check-skill-sync.js`, the THR-192 pre-commit hook, the `flush-plan-docs` task and skill, the `plan-pending-commit` label and `flush-close-guard.yml` are all gone, and CLAUDE.md was rewritten to a single-executor world. **The `check:skill-sync` false-positive class (62 impediment mentions) is structurally closed, not worked around.** The six skills that existed only in `.agents/skills/` went with it as expected and are recoverable from git history. _Prunable at the next full retro._
- **2026-07-21 — the Obsidian MCP decision is settled; Option B was taken.** Was item 3, carried ~60 days across ~12 occurrences (impediments #66, #71, #75, #86). Resolved structurally rather than by a decision in chat: THR-654's CLAUDE.md rewrite records that vault writes go through the filesystem, not the MCP, and vault skills **fail loud** when `OBSIDIAN_VAULT_PATH` is unset rather than silently dropping the entry. Verified this run — the variable is set in `.claude/settings.local.json` to `C:\Users\chris\Dev\Obsidian`. The silently-dropped-`log.md`-append failure mode is closed. **No action remains**; the auto-start option (A) is moot unless you want the MCP path back. _Prunable at the next full retro._
- **2026-07-21 07:30 — the sixteen-day-old economy console warning closed (THR-644).** The duplicate-key React warning in the economy event feed, flagged during THR-631 browser verification on 2026-07-05 and carried in these briefings as one of two "properly stale" queue items, is fixed (PR #665). _Prunable at the next full retro._
- **2026-07-21 09:13 — THR-674 closed by splitting, not by finishing.** The one-time git surface cleanup landed the 15 untracked drafts (PRs #654/#655) but could not reach its "`git status` clean" Done-when: the stash stack was **38 entries** not 12 (→ **THR-680**) and the leftover work folders were **26, all under `.claude/worktrees/`**, a path `pull-work` forbids touching (→ **THR-681**). Both remain in the planning column. The home-tree repair it had been expected to perform was ultimately done by hand at 10:47. _Prunable at the next full retro._
- **2026-07-21 06:15 — THR-673 shipped: the stale-branch cleanup job no longer fails silently.** The "Threadbare Git Cleanup" Windows task had been returning `-2147020576` (battery refusal) while logging nothing, so nobody could tell a skipped run from a clean one. Verified healthy at the 10:54 run — last run 10:40, tracking 27 worktrees / 33 branches / 38 stashes, with 6 flagged `needs-disposition` (deliberately never auto-deleted; that is THR-681's scope). _Prunable at the next full retro._
- **2026-07-21 05:22 — THR-675 shipped (PR #657): pull requests now merge themselves on green.** Repo settings verified live (`allow_auto_merge: true`, `delete_branch_on_merge: true`), so `gh pr merge --auto --merge` is the standard closeout and executor sessions stop burning 3–8 minutes poll-waiting on CI. **Does not retroactively clear the 14 already-open PRs** — see item 4. _Prunable at the next full retro._
- **2026-07-21 ~02:20 — the 15 untracked design drafts are backed up (PR #654, THR-674).** The "one machine, no backup" exposure this file carried since 2026-07-20 is closed: brainstorms, exploration notes and intent-proposal records that existed only in the home tree are now committed to `origin/main`, with the cleanup findings logged to `Docs/impediments.md` alongside (PR #655). _Prunable at the next full retro._
- **2026-07-21 01:22 — THR-672 shipped (PR #648): the home tree is now an inert, self-healing mirror of `main`.** The autosync re-attaches the provably loss-free park on its own (detached ∧ 0 unique commits ∧ 0 tracked modifications → `git switch main`), and scheduled sessions are barred from running checkout/commit/merge/rebase/reset with the home tree as CWD — the rule this very task follows. _Prunable at the next full retro._
- **2026-07-21 00:34 — THR-671 shipped (PR #646): the freshness signal distinguishes "parked off-branch" from "behind."** This closes the specific mis-reporting fault that made `Design/briefing.md` publish an escalating behind-count (58 → 79) for days while local `main` was in fact 0/0 with `origin/main` the whole time. _Prunable at the next full retro._
- **2026-07-20 22:54 — the load-bearing git/CI plan doc reached `origin/main`** (PR #638 merged). Six Ready-for-Dev tickets that cited a spec existing only on one machine became readable by any executor. _Prunable at the next full retro._
- **2026-07-20 — the "N commits behind and climbing" alarm was measuring the wrong thing.** **Correction to the record, retained because it is load-bearing for future diagnosis:** the escalating behind-count this file reported for days (58 → 64 → 69 → 75 → 77 → 79) measured a *frozen detached snapshot* against a moving `origin/main`. Local `main` was **0/0 with `origin/main` the entire time** — the tree was parked beside `main`, never lagging behind it. Nothing was decaying. **The 68 staged files were worse than "stale echoes"**: diffed against their base they were 221 insertions / 3,379 deletions, reversing THR-614's `quintessence`→`cohesion` rename and THR-575's CLAUDE.md trim — phantom staleness, not authored damage: the CC harness moved `refs/heads/main` forward via plumbing *while `main` was checked out* (07-18 20:01, reflog + autosync-log correlation), which leaves index and working files at the old content and makes `git status` report the delta as "staged changes" — nobody staged anything (see `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` § 1.3). Committing them would have reverted shipped work. _Prunable at the next full retro._
- **2026-06-23 — `LINEAR_API_KEY` set in the Codex automation environment** (was item #1; impediment #141, 17 recurrences). _Superseded 2026-06-23 by the full Codex-lane retirement (THR-486). Safe to prune at the next full retro rebuild._
- **2026-06-23 — GitHub Pro / branch protection resolved** (was item #4 in the prior seed; impediment #56). Branch protection is active on `main` with `Test · Typecheck · Build` as a required status check (THR-282 shipped 2026-04-30). To be removed on next retro day.
- **2026-07-19 — local dependencies reinstalled; `npm run dev` / `npm test` work again on the home tree.** Confirmed resolved at the 16:28 run: `node_modules/.bin` now exists with **99 shims** (was absent entirely), 284 top-level packages, and `npm exec -- vite --version` returns `vite/7.3.1 win32-x64 node-v24.14.0`. Local dev server, test runs, production build and the pre-commit hooks are unblocked from the home tree, which restores the browser-screenshot step of the Definition of Done. The worktree-specific `.bin` shim workaround is still valid for **scratch worktrees**, which have no `node_modules` of their own — see impediment #186.
- **2026-07-18 — Linear-from-scheduled-context confirmed reliable** (was item #4; three clean data points: 2026-06-23, and two `keep-work-flowing-cc` runs on 2026-07-18). The hedge is dropped — scheduled/autonomous CC sessions can trust the Linear MCP without caveating conclusions on it.

---

*This file is refreshed hourly by the `keep-work-flowing-cc` Claude Code scheduled task from `Docs/impediments.md`, the Linear board, and any newly filed Christian-owned impediments; the `retrospective` skill does the deep periodic rebuild. Manual edits between runs are fine — they'll be preserved as long as the item is still open. To force a full rebuild, run `/retrospective`.*
