# User Action Required

**Last updated:** 2026-07-21 (refresh at 21:54 local by the hourly `keep-work-flowing-cc` CC task — **item 2's ticket-bar paragraph is rewritten: the "say *file the autosync self-heal ticket*" escalation is withdrawn as misrouted.** Filing a ticket is agent work, not a Christian decision; routing it here for seven consecutive hours was this task's error, and it should not have been costing attention. The fix commands in item 2 are also corrected to the `stash push` form — it preserves the superseded file instead of discarding it, at no cost. Item 2 otherwise unchanged and now in its **tenth** consecutive run: still parked off-branch, still one leftover file, still nothing stranded (0 unique commits, re-verified). Item 1 re-verified against the live scheduler, unchanged: all three replacements present and `enabled: false`. Item 3 drops to **two** ready — THR-691 shipped 21:11 and nothing was filed to replace it, so the self-replacement pattern did not hold this hour; the direction question is unchanged regardless. Item 4 unchanged at 14 open / 2 conflicting, not re-queried this run. Nothing pruned. The 20:54 refresh recorded the park; the 19:54 refresh corrected the conflict over-count; the 17:54 refresh recorded the three replacements landing. Last full rebuild was the 2026-06-23 retro)
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

**Status:** DECIDED 2026-07-21 in chat · **two actions now, not one** · re-verified against the live scheduler at 18:54, unchanged — all three replacements present, all three still `enabled: false`. (a) disable `keep-work-flowing` in the Cowork app — unchanged, safe today; (b) **since 17:54: the three replacements are built.** THR-677 landed them at 15:28 — all three written, registered, and **deliberately left `enabled: false`** — so the remaining step is the trial you asked for: run each once attended, approve its output in chat, then it goes live and its Cowork twin is switched off. Three of THR-677's four Done-whens are met; the fourth *is* this trial gate, and it is yours
**Source:** THR-653 (cutover). Follow-up port work: THR-677.

**What happened.** The move off Cowork is done. The Claude Code side now runs the hourly pickup, the hourly briefing (moved to the :45 slot, taking over the one Cowork used), the Friday retrospective, and the Sunday memory tidy-up. Two of those — the retro and the memory tidy-up — had been *written down* as already running for weeks but had in fact never been switched on. They are on now. The bridging scaffolding was demolished on the morning of 07-21.

The one thing Claude Code cannot do is reach into Cowork and switch its old copies off. Those live inside the Cowork app, and nothing on this machine can see or change them. So until you flip them, a few jobs run twice.

**Fix — in the Cowork app, disable this one now:**

```
keep-work-flowing        (hourly)      — replaced by keep-work-flowing-cc, SAFE TO DISABLE NOW
```

**Leave these three ON until their replacements pass a trial. The replacements now exist and are switched off, waiting on you:**

```
daily-backlog-grooming   (daily 09:06)  → CC replacement registered, enabled: false, fires ~09:16
weekly-workflow-retro    (Wed 09:04)    → CC replacement registered, enabled: false, fires ~Wed 11:13
weekly-project-hygiene   (Sun 10:04)    → CC replacement registered, enabled: false, fires ~Sun 10:10
```

**The trial, per your own decision:** in an ordinary chat session, run each replacement once via "Run now", read the report it produces, and say yes. Then its schedule is enabled and you disable the Cowork original. **Start with `daily-backlog-grooming`** — it is the load-bearing one, and its trial is designed to show you the queue changes it would make before it is trusted to make them unattended.

**Rewriting beat copying, and the evidence is concrete.** Verifying each ported claim against live state caught two dead references a faithful transcription would have carried forward: the old grooming job queried a work state retired in June (returning nothing, daily, silently), and the Sunday tidy-up audited machinery demolished on 07-21. The prompts are now mirrored under `Docs/ops/scheduled-task-prompts/` so they can never again exist only inside an app nothing can read — which is exactly how the originals were lost.

**Leave `weekly-invoice-check` alone.** It is yours, not Threadbare's, and is deliberately out of scope.

**Why the staging.** `keep-work-flowing` is safe to disable immediately — its replacement is live and proven (it wrote this file). The other three have no Claude Code replacement yet, because their instructions only exist inside Cowork and cannot be read from outside it. Disabling them now would stop those jobs entirely until they are rebuilt.

`daily-backlog-grooming` is the one that matters — it is what keeps the work queue moving. **Its value was demonstrated the hard way and then immediately re-demonstrated:** the queue hit zero at the 10:54 run, and was refilled to nine by 09:12–09:27 UTC. Leave it running until its replacement is proven.

**Decision (Christian, chat, 2026-07-21):** Claude Code writes fresh versions of all three prompts, and each one runs **once as a trial whose output you approve in chat before its schedule is switched on**. Cutover is staged: `keep-work-flowing` off in Cowork **now** (replacement proven); `daily-backlog-grooming`, `weekly-workflow-retro`, and `weekly-project-hygiene` off one by one as each replacement passes its trial. **THR-677 executed exactly this at 15:28** — registered-and-disabled rather than registered-and-live, precisely because an hourly unattended run is by definition not an attended trial. It is parked In Dev and unassigned, waiting on you rather than on an agent.

**What breaks if not done.** Nothing breaks. You get two copies of the hourly brief until you flip the one switch, and the migration cannot be declared finished. No data is at risk either way.

---

## 2. Clear a superseded leftover file and re-attach the home tree · WILL NOT SELF-HEAL · ONLY YOU CAN DO THIS

**Status:** Open, **tenth consecutive run** (12:54 → … → 21:54) · **unchanged in kind and in risk since 20:54.** The tree remains **parked off-branch and dirty** — the known harness pair (a bare `checkout HEAD` detaches the tree; a plumbing update moves `refs/heads/main` under it). Loss-free; three commands.
**Source:** Home-tree freshness ping at the 21:54 run — **detached HEAD** at `5177083f` (11:36), **`main` 4 behind `origin/main`**, **1 tracked modification** (`Design/user-actions.md`), 0 untracked, **nothing stranded (`origin/main..HEAD` = 0)**. Supersession re-verified this run, not assumed: the on-disk copy is still the 10:54 text plus a 3-line edit whose substance `origin/main` already carries, and `origin/main` has been rewritten eleven times since.

**Read the behind-count carefully.** It reported 4 → 14 → 18 → 20 → 22 → 31 → 36 → 41 across eight hours on `main`, and now reads **5** — because it is no longer measuring the same thing. `main` itself moved forward under a detached tree; the tree did not catch up. **The drop is the fault, not a recovery from it.** This is precisely the mis-reading THR-671 shipped to prevent, so it is recorded here rather than reported as improvement.

**What it is.** The home tree carries a modified `Design/user-actions.md` left by the 10:54 run, which hit its fail-soft path and could not commit. **The content is not at risk and nothing is stranded:** the 11:54 run carried those same chat edits forward and landed them on `origin/main`, so the copy on disk is now an *outdated duplicate* of work already saved.

**Why it needs you.** `threadbare-autosync.ps1` only fast-forwards a tree with **0 tracked modifications** (THR-672's guard), so the home tree has stopped catching up — hence the behind-count, which grows every hour until the file is cleared. Scheduled sessions are barred from running `checkout` against the home tree (THR-672, the rule this task follows), so an agent cannot do it.

**Fix — three commands, in your interactive session, in this order:**
```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" stash push -m home-tree-recovery
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" switch main
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" pull --ff-only origin main
```
The first sets the superseded file aside, the second re-attaches the tree to the main line, the third catches it up. All three are loss-free given the verified state above (`origin/main..HEAD` = 0 means no commit exists only on that tree). **`stash push` rather than `checkout --` is deliberate**: the file is provably superseded, but stashing keeps a recoverable copy anyway at no cost, so the command is safe even if the verification were somehow wrong. `--ff-only` is likewise deliberate: it refuses rather than merges if the situation is not what was measured.

**What breaks if not done.** Nothing is lost or at risk. The home tree simply stops getting newer *and* is now detached, so a morning session there starts on stale state and on no branch — exactly the failure the freshness guard exists to catch. **This is the known gap named in the home-tree repair entry below:** the self-heal guard needs a clean tree, so a park landing on an already-dirty tree still needs a hand. The park is now the second occurrence of that exact combination.

**Ticket bar reached (14:54), still unfiled at 21:54 — agent work, and the escalation to Christian is withdrawn as misrouted.** The fix is narrow and safe: extend THR-672's self-heal guard so it may set aside a tracked modification whose content is **provably already on `origin/main`** (verifiable by diff, exactly as re-verified this run) rather than requiring a strictly clean tree, and handle *dirty **and** detached* together — the combination it currently refuses outright, and the one on the tree right now. **The nearest ticket remains THR-678, which covers the *untracked*-file variant and sits in Idea; nothing covers the tracked-modification case.**

**Correction to the previous seven entries.** They ended by asking Christian to say *"file the autosync self-heal ticket"* in chat. That was wrong on this task's part, not his: filing a backlog item is a technical call, which under THR-608 belongs to the agent side, and no amount of repeating it here makes it a decision only he can take. The real finding is narrower and stands: **this task can name agent-side work but cannot queue it, and nothing else reads these notes.** The next execution or design session that touches the freshness path should file it. **It remains a standing item for the Friday retro. Christian's three commands still clear today's instance immediately, and that is the only part of this item that is his.**

---

## 3. Name the next game-facing stretch · CHRISTIAN ACTION · WILL NOT SELF-HEAL

**Status:** Open, carried from 11:54. Its original premise ("the queue is empty and the executor idles") is long gone. **The 21:54 run partly walks back the 20:54 measurement:** THR-691 shipped at 21:11 and **nothing was filed to replace it**, so the queue dropped 3 → 2. The "regenerates as fast as it clears" pattern held for two hours and then did not; treat it as a tendency, not a law. What is unchanged and is the actual point: **everything queued is still maintenance.**
**Source:** Board scan at the 21:54 `keep-work-flowing-cc` run: **2 Ready for Dev** (both unassigned), **1 In Dev** (THR-677, unassigned by design), **20 Todo**, 0 blocked, 0 stale — both ready items filed today, neither `blockedBy` the other.

**The two ready items, by what they actually do:** a plan-doc lint scope fix (THR-692) and a gap where CI's type-check step runs a command that passes unconditionally (THR-693, filed 20:19 out of THR-690's closeout). The union merge driver (THR-691) shipped out of this set at 21:11; the build-artifact freshness gate (THR-690) shipped at 20:32. **In development:** the Cowork prompt port (THR-677) — parked on your trial approvals, see item 1.

**Board-hygiene note (agent-decidable, not yours):** THR-680 (stash triage) and THR-681 (worktree disposition) both sit in Todo but were **overtaken by THR-674's disposal pass at 13:13**, which cleared all 38 stashes and all 6 flagged worktrees. They are candidates for closure as superseded — an executor or design session can settle that without you.

Both sit in **Continuous Improvement**; the item in development is migration cleanup. **Neither adds a system, a piece of content, or anything visible in the game.** That is a legitimate state to be in — the tooling genuinely was lying about passing gates (THR-693 is a fresh instance of exactly that), and that is worth a day. But it should be a *chosen* state, not a default one, and choosing is yours by the standing rule (THR-608). **The full day has now elapsed, and maintenance work keeps electing itself unless something game-facing is put in front of it.**

**Why an agent cannot answer this.** Deciding which direction the game takes next is a creative-direction call. Re-scoping the chosen direction against the real code is then a design session's job, not yours.

**Two directions are nearest, both half-built rather than speculative:**

- **War, deepened** (THR-628 / 629 / 630 — two marked high priority). The war system came alive on the 18th. Designed but not built: battles with real texture (turning points, commanders in peril, last stands), sieges that tighten as they drag rather than resolving flat, and the aftermath a region carries once a war ends.
- **The economy, made visible** (THR-669 / 670). The trade layer moves goods, but the player cannot see it. Missing: things going wrong on trade routes — banditry, embargoes, tolls surfacing as encounters — and the map showing what is actually moving along a road when you look at it.

**Fix — say a direction in chat.** "War", "economy", or something else entirely. A rough steer is enough; a design session refills the queue toward it. **"Spend today finishing the plumbing" is also a valid answer** — say that and this item is pruned rather than carried.

**What breaks if not answered.** Nothing, now that the lane is fed. The executor works through the self-maintenance backlog and the game itself stands still meanwhile. Each carried hour is a choice made by default rather than on purpose.

---

## 4. PR merge backlog — 14 open, oldest 2026-06-12 · SYSTEMIC FIX SHIPPED 2026-07-21 05:22

**Status:** Open (not blocking) · **count unchanged at 14, re-verified 20:54** by live `gh pr list`; the conflicting subset re-confirms at **two** (#327, #553) — a ninth confirmation of the "does not retroactively rescue" prediction below. **Correction to the 18:54 entry: the "conflicting subset tripled 2 → 6" was an over-read.** This run GitHub reports `DIRTY` on **two** (#327, #553), `BEHIND` on one (#551), and `UNKNOWN` on the remaining eleven — `UNKNOWN` means GitHub had not recomputed mergeability at query time, not that a conflict exists. Counting `UNKNOWN` as conflict is what produced the six. **The right way to read this field: only `DIRTY` means a human must resolve a conflict; `UNKNOWN` means ask again later.** The underlying rot mechanism is unchanged and real — every closeout appends to the same tables — which is what THR-691 (union merge driver, in Ready for Dev) exists to kill. Oldest still #327 (2026-06-12).

**The pipeline works; merging is the slow step.** A steady stream merges end-to-end (the hourly briefings, #646/#648 for THR-671/672, #650 THR-616 economy slices, #654/#655 for THR-674, #657 THR-675, #661 THR-676's write-up, #665 THR-644, #667 THR-654, #670 THR-685) — proof the path functions. But **fourteen PRs remain open and unmerged** (thirteen docs + one feature): oldest #327 (2026-06-12), then #488 (2026-07-03), #512/#514/#516/#525/#532/#543/#551 (2026-07-04–05), #553 (feature: Axis-B milestone beat, 2026-07-05), #557 (2026-07-17), #571/#599 (briefings), #641 (impediment log). Branch protection runs in **strict mode** (branches must be up to date with `main`), so every open docs PR is knocked `BEHIND` the moment anything lands — and nothing re-freshens them. `Test · Typecheck · Build` shows `SKIPPED` on docs-only PRs, which is expected and is *not* the blocker.

**Nine of the fourteen are now orphans of a deleted job.** #488 / #512 / #514 / #516 / #525 / #532 / #543 / #551 / #557 are all `docs(plan): batch flush` PRs produced by the `flush-plan-docs` scheduled task — **which THR-654 demolished on the morning of 07-21**. Nothing will ever refresh or reopen them; they are inert artifacts of a retired lane. Worth a single triage decision: bulk-update-and-merge, or bulk-close as superseded. This is agent-decidable and does **not** need Christian.

**Self-inflicted feedback loop, unchanged:** this briefing task merges its own PR every hour, and each of those merges is what pushes the rest `BEHIND` again.

**THR-675 shipped at 05:22 local (PR #657) and is the correct systemic fix.** `allow_auto_merge` is **true** and `delete_branch_on_merge` is still on, so `gh pr merge --auto --merge` now lands a PR the moment its checks go green with no session left poll-waiting. The same ticket fixed the `check:skill-sync` pre-commit hook; **THR-654's demolition removed that hook and its duplicate skill tree entirely**, so the false-positive class is now structurally closed rather than patched.

**This does not retroactively rescue the fourteen already-open PRs.** They went stale before the fix existed, and strict-mode branch protection still requires each to be brought up to date individually: `gh pr update-branch <N> && gh pr merge <N> --auto --merge`. Newly-opened PRs (including this task's own hourly briefing) self-merge.

**One of the fourteen deserves separate attention:** #553 is a **feature** PR (Axis-B essence-source milestone beat), not documentation, and has sat since 2026-07-05 — it is one of the two confirmed `DIRTY`, so it needs conflict resolution, not just a refresh. Worth a design session confirming whether it is still wanted before it rots further.

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

- **2026-07-21 18:08 — THR-688 shipped: tickets now get written so they still make sense at pickup.** Three rules, all codified in the coordination protocol and CLAUDE.md: a sweep ticket states the *rule* for what belongs in it rather than a snapshot count that rots before anyone picks it up; a "these two can't run together" line must carry its reason, so an executor can check whether the reason still holds instead of obeying it blindly; and a ticket's completion conditions must match the pillar it touches — browser evidence for things you can see, headless runs for engine work. **Why it mattered:** THR-674 failed its own Done-when this morning purely because the ticket had frozen a count that moved (12 stashes became 38), and it had to be re-scoped and re-run. _Prunable at the next full retro._
- **2026-07-21 15:41 — THR-687 shipped: the board no longer marks work finished that never happened.** The one-time board-integrity audit swept for issues auto-closed to Done with no landing commit behind them — the THR-540 pattern, where an unrelated pull request's *title* containing a bare "fix THR-XX" closed the wrong ticket two minutes after it was filed. Filed 09:12 in the morning's pattern assessment, done by 15:41. **Why it mattered beyond hygiene:** a board that silently marks things done is a board nobody can trust to answer "what is left?", and this task's queue counts are read straight off it. _Prunable at the next full retro._
- **2026-07-21 15:28 — THR-677 built all three Cowork replacements and stopped one step short, correctly.** Three of four Done-whens met; the fourth is Christian's trial gate and is now the live ask in item 1. The port was not a transcription — verifying each claim against live state caught a daily query against a state retired in June and an audit of machinery demolished the same morning. Prompts mirrored to `Docs/ops/scheduled-task-prompts/` so they can never again live only in app state. **Not counted as resolved** — the issue is deliberately parked In Dev and unassigned, freeing the executor's single work slot while it waits on you. _Recorded here for the trail; the open ask stays in item 1._
- **2026-07-21 13:13 — THR-674 closed properly: the 38-stash pile was triaged, not discarded.** It had been split into THR-680/681 and written off as unfinishable; instead the disposal pass landed via PR #674. **Four stashes were salvaged onto `origin/main`** — `stash@{12}` alone carried **21 plan and intent-proposal docs** from the retired `flush-plan-docs` job, plus `stash@{15}` (rulebook canon draft), `stash@{30}` (detail-page data model), `stash@{36}` (THR-17 closeout WIP) — with a written disposal record at `Docs/ops/2026-07-21-thr-674-stash-worktree-disposal.md`. The 6 `needs-disposition` worktrees were settled in the same pass. **Verified this run rather than assumed:** the reaper reporting `stashes: 0` one hour after reporting 38 is equally consistent with silent loss, so the salvage commits were confirmed present on `origin/main` before recording this as a good outcome. `refs/stash` no longer exists; nothing unexamined was dropped. **Consequence for the board:** THR-680 and THR-681 are now superseded and should be closed — see the note in item 3. _Prunable at the next full retro._
- **2026-07-21 12:28 — THR-686 shipped (PR #672): the advisory gates no longer lie about passing.** Filed at 09:12 in the morning's pattern assessment and done inside three hours — the fastest turnaround on the board that day. It retired the `tsc --noEmit` check, which exits 0 unconditionally (the root config lists no files) while CLAUDE.md and the pickup prompt both named it a real gate; scoped the plan-doc lint; fixed a self-referential side-effect in the process check; and rewrote the `/pull-work` board scan that had been hard-failing on response size. **The motivation is worth keeping:** gates that lie train agents to bypass gates — `--no-verify` had appeared twice in twelve runs, both times justified by a false positive. _Prunable at the next full retro._
- **2026-07-21 — the upstream bug report is filed; you said yes.** Was item 2, carried across four consecutive runs as the sole blocker on THR-676. Christian approved in chat and the report is public: https://github.com/anthropics/claude-code/issues/79713. It named Windows 11 / Claude Code 2.1.90, the scheduled-session setup, and ten reflog lines — no repository contents, no file paths from the work, nothing about the game, exactly as scoped. **THR-676 closed at 14:06** on that final one-liner — the CLAUDE.md cross-link to the filed issue (PR #677). The three-day investigation is finished end to end: cause identified, contained locally (THR-671/672), reported upstream. _Prunable at the next full retro._
- **2026-07-21 10:47 — the home tree was repaired; the recurring park is closed.** Carried and escalated across ten consecutive autosync refusals from 21:56 through 09:50. Re-verified at the 12:54 run: still on `main`, nothing parked, nothing stranded (`origin/main..HEAD` was 0 throughout). **Correction to the 11:54 entry:** that run landed the *content* of the uncommitted chat edits on `origin/main`, but could not clear the working-copy file itself — scheduled sessions may not run `checkout` against the home tree. The stale duplicate is therefore still present and is now **item 2 above**, with the tree 4 behind because autosync will not fast-forward a dirty tree. **The underlying cause remains harness-level** (now filed upstream, above) but its containment is live (THR-671/672) and the tree is inert. The known gap stands and is worth a ticket if it recurs: THR-672's self-heal guard requires **0** tracked modifications, so a park landing on an already-dirty tree still needs a hand. Adjacent ticket THR-678 covers the untracked-file variant. **Deployment note preserved for whoever picks that up:** the autosync script lives *outside* the repo at `C:\Users\chris\bin\threadbare-autosync.ps1` and has no version-controlled source — merging a repo change does not deploy it. _Prunable at the next full retro._
- **2026-07-21 08:48 — the Cowork demolition shipped; you answered yes.** THR-654 went Todo → Ready for Dev (07:13) → In Dev (08:02) → Done (08:48) via PR #667. The `.agents/skills/` duplicate tree, `scripts/check-skill-sync.js`, the THR-192 pre-commit hook, the `flush-plan-docs` task and skill, the `plan-pending-commit` label and `flush-close-guard.yml` are all gone, and CLAUDE.md was rewritten to a single-executor world. **The `check:skill-sync` false-positive class (62 impediment mentions) is structurally closed, not worked around.** The six skills that existed only in `.agents/skills/` went with it as expected and are recoverable from git history. _Prunable at the next full retro._
- **2026-07-21 — the Obsidian MCP decision is settled; Option B was taken.** Carried ~60 days across ~12 occurrences (impediments #66, #71, #75, #86). Resolved structurally rather than by a decision in chat: THR-654's CLAUDE.md rewrite records that vault writes go through the filesystem, not the MCP, and vault skills **fail loud** when `OBSIDIAN_VAULT_PATH` is unset rather than silently dropping the entry. Verified — the variable is set in `.claude/settings.local.json` to `C:\Users\chris\Dev\Obsidian`. The silently-dropped-`log.md`-append failure mode is closed. **No action remains.** _Prunable at the next full retro._
- **2026-07-21 07:30 — the sixteen-day-old economy console warning closed (THR-644).** The duplicate-key React warning in the economy event feed, flagged during THR-631 browser verification on 2026-07-05, is fixed (PR #665). _Prunable at the next full retro._
- **2026-07-21 09:13 — THR-674 closed by splitting, not by finishing.** The one-time git surface cleanup landed the 15 untracked drafts (PRs #654/#655) but could not reach its "`git status` clean" Done-when: the stash stack was **38 entries** not 12 (→ **THR-680**) and the leftover work folders were **26, all under `.claude/worktrees/`**, a path `pull-work` forbids touching (→ **THR-681**). THR-674 was then re-scoped in predicate form (per THR-688), returned to Ready for Dev, and **finished for real at 13:13** — see the disposal entry at the top of this list. **Correction to the 13:54 record,** which still described it as awaiting pickup. _Prunable at the next full retro._
- **2026-07-21 06:15 — THR-673 shipped: the stale-branch cleanup job no longer fails silently.** The "Threadbare Git Cleanup" Windows task had been returning `-2147020576` (battery refusal) while logging nothing, so nobody could tell a skipped run from a clean one. Verified healthy again at the 14:54 run — last run 14:40, tracking **21 worktrees / 27 branches / 0 stashes / 0 needs-disposition**, holding steady after THR-674's disposal pass landed (was 28/33/38/6 before it). The hourly cadence and the SUMMARY line are both doing their job: the drop was visible within the hour and could be checked. _Prunable at the next full retro._
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
