# User Action Required

**Last updated:** 2026-07-26 20:54 local, by the hourly `keep-work-flowing-cc` CC task.

**✅ ZERO BLOCKING CHRISTIAN-OWNED ASKS** — twenty-fourth consecutive hour. Two standing questions are answered and closed and **must not be re-asked**: the empty-projects question (Christian, chat 2026-07-25 21:53 — *leave the five projects open; they are intake buckets that refill as the game iterates*) and the GitHub Actions payment block (cleared 2026-07-25 ~17:09 UTC, verified by re-run).

> **File pruned this run — read this before assuming context was lost.** This file had grown to **114 KB / 170 lines**, almost all of it a 50-entry "Resolved this period" log reaching back to 2026-06-23, plus per-run analysis paragraphs that accreted rather than being replaced. That contradicts this file's own stated policy (§ *How this works*): *"No history retained here — `git log` + the retros are the audit trail."* It was also self-reinforcing: every hourly run had to read 114 KB to refresh a list of zero open asks. **Resolved entries older than today are removed; nothing is destroyed** — `git log -p Design/user-actions.md` holds every word, and the durable lessons each entry asked to keep are carried forward as one-line rules below. Today's closes are kept as a compact index. Reported in the run output rather than in the briefing, because this is agent housekeeping and not Christian's decision.

## This run's measurements (2026-07-26 18:54 UTC)

- **Home tree** on `main`, **0 behind**, **0 stranded**; **2 tracked-dirty** (`.claude/settings.json`, `.claude/settings.local.json` — an uncommitted MCP/PowerShell allowlist edit) and **1 untracked** (`Design/retros/retro-2026-07-24-draft.md`). Unchanged for six runs.
- **Queue: BACKED UP — 23 ready (0 High / 11 Medium / 12 Low)**, nothing stale, nothing blocked, **0 In Dev, 0 In Design, 0 open PRs**. Tenth consecutive run above `QUEUE_BACKED_UP_MIN` (15). **First run with no High-priority item anywhere in the ready lane since 10:29 UTC** — THR-800 was the sole High and it shipped.
- **One full pickup-to-ship cycle inside the hour:** THR-800 `In Dev` 18:02:14Z → `Done` **18:40:07Z** (38 minutes), PR #914 merged 18:39Z. Count held 23 → 23: −1 shipped, +1 filed by that same ticket (THR-808). Nothing claimed in the 15 minutes since.
- **Deploy verified green rather than assumed:** `main` tip `8d5203d3` → `state: success`, single `Vercel` status **18:40:34Z**, `"Deployment has completed"` — 27 seconds after the merge, on a code-bearing change.
- **Reaper** ran 20:40 local, 14 min before this run: **24** worktrees (up one) / **32** branches (flat, fourth run) / 1 stash / **0 needs-disposition**. Sixth consecutive clean post-THR-797 run with no `WARN: worktree removal FAILED`.
- **Discord** read via the step-0 cursor: `HTTP 200`, **3 bytes** (`[]`) — genuinely empty, cursor unchanged at `1530719628429623431`, no receipt owed, no ping sent (Needs-Christian empty, hash unchanged at the empty-state value).
- **Zero Linear writes this run**; nothing claimed, no state set.

## Open agent work (not Christian's)

- **Item 1 below** — the last stranded plan doc. Not re-derived this run; last verified at the 15:54 run. Due for a fresh check rather than another restatement, per finding 1.
- **Friday's retro draft** (`Design/retros/retro-2026-07-24-draft.md`) is still untracked and still wants a `git add` inside any docs PR — but it is **no longer a carried observation here**. It is a deterministic regenerable draft, not irreplaceable prose, and it is now **THR-798's step 2**, with an owner and a Done-when.
- **The tracked `.claude/settings*.json` edits** in the home tree. Inert and non-blocking, but *tracked* modifications are the class that stalls autosync if it ever needs more than a fast-forward. Wants a commit or a discard by whoever made it.
- **THR-804** (Stale Claim Sweep: 88 runs, 88 failures, zero successes since 2026-06-13) remains open and unclaimed. Re-measured every run rather than carried; count flat, because the twice-daily job's newest run (2026-07-26T12:31:18Z) still predates the filing.

## Durable findings carried forward

Rules earned by tickets that have since shipped. Kept as rules; the ticket-by-ticket prose is in `git log`.

1. **Before carrying an observation into its Nth run, re-derive it once.** Two instances inside 48 hours: THR-804 (thirteen runs restated a one-line cause from memory; filing it found a *second* defect the restatements had missed) and the retro-draft carry (twenty-two runs described a file's significance without opening it; one `head -30` falsified both halves of the description). Both times the restated version had drifted from the examined version, and both times examination cost seconds.
2. **A subsystem with no callers is invisible to every sweep that looks for wrong behaviour, because it has none.** Four instances in three days, all closed: THR-779 (61 templates, no draw path), THR-787 (three engine reads, wrong field name), THR-803 (whole chain subsystem, zero production callers), THR-800 (62 refs, no definition). Every one was authored or implemented capability that nothing routed to; every one failed silently; every one became visible only when something measured the producing side against the consuming side. **The class detector, not the individual repair, is the deliverable** — the repairs ran 30–82 minutes each once found.
3. **A plan doc's past tense is a claim, not evidence.** THR-801 existed only because the WS0 plan recorded a type change as already made; it had not been. The disconfirming check was a two-second grep that nothing in the pipeline had run for three days.
4. **Advisory gates that nobody reads are indistinguishable from gates that do not exist.** Both of THR-788's deferrals (THR-806, THR-807) surfaced from running the advisory gates at closeout and reading the output. THR-807's own framing is that the only thing noticing 61 stale plans was advisory.
5. **A test suite that agrees with the bug stays green forever.** THR-787's dead read survived because nothing asserted the observable outcome, only that the code ran. Trait regression tests must anchor on **shipped definitions**, never on fixtures written alongside the code under test.
6. **Read composition, not depth.** A queue that rises after a valuable hour is not decay if the arrivals are findings rather than regressions. Nine consecutive hours now read 21 → 21 → 20 → 21 → 22 → 22 → 23 → 23, across which the most valuable work of the week shipped.
7. **A gate clearing is not the same as a decision arriving.** Surfacing a settled call to Christian for ratification is worse than not surfacing it. This is what has kept twenty-four consecutive empty Needs-Christian hours honest rather than merely quiet. Worked example: THR-805's guild-rank question looked like two design *feels* and turned out to be a purely mechanical selection whose answer was already determined — retired on examination rather than escalated.
8. **An empty Discord inbox is not evidence Christian is away.** He acted on the deploy block at ~07:39Z on 2026-07-25 without writing there. Silence means only that he did not write.
9. **A startup-failure cluster is indistinguishable from quota exhaustion at the moment it happens.** The disambiguating evidence — *does a fresh run execute jobs?* — costs one run. Take it before escalating to a billing page.
10. **Deploy-observability must classify by paths, not by branch name or PR title.** THR-788 was a `docs/`-branched, docs-titled PR whose build ran anyway, because it touched `public/`. Three prior observations fit a docs-vs-code shorthand; the fourth falsified it. Worth writing into **THR-785** when it is picked up.
11. **Mutex lines with reasons work, and this run is the proof.** THR-800 declared `Mutex with: THR-788 (settle the vocabulary before mass-rewriting refs to it)`. The pickup lane claimed it at 12:02, 14:02, 15:02 and 17:02 and released it within 30–80 seconds each time, taking other work instead — then built it in 38 minutes at 18:02, once THR-788 had merged at 17:45. **Four unprompted correct deferrals from one authored line.** This is the strongest evidence to date for THR-688 ticket-authoring rule (B); some of the earlier "0 In Dev, nothing claimed" readings in this file were partly *this*, working correctly, being read as idleness.

**Owner of items below:** Christian. Everyone else's blockers go in Linear or `Docs/impediments.md`.
**Refresh cadence:** The hourly `keep-work-flowing-cc` scheduled task keeps this current (prunes resolved items, adds newly-surfaced Christian-owned ones); the `retrospective` skill still does the deep periodic rebuild. This is the slow-moving standing-asks list — the fresh-this-hour view is [`Design/briefing.md`](briefing.md).

## How this works

The retrospective stopped being the right channel for "Christian, please flip one switch." Christian-owned asks were buried in retro prose, and nothing surfaced them between retros. This file replaces that pattern.

Read order: top to bottom is blast radius. The top items break canonical workflow invariants right now; the bottom items are operational debt with workarounds in place.

For each item:
- **Fix** = the literal command, click path, or line of config that resolves it.
- **What breaks** = the named system or invariant currently degraded.
- **Source** = `Docs/impediments.md` entry numbers + occurrence count, so the cost is visible.

When an item resolves: delete it from this file, mark the corresponding impediment as resolved in the dashboard regen, note the close in the next retro under "What shipped." **No history retained here — `git log` + the retros are the audit trail.** The resolved log is pruned to the current day; anything older is recovered with `git log -p Design/user-actions.md`.

---

> **No Christian-owned ask is open.** The one item below is agent work that has simply not been picked up; it is listed for continuity, not as a request.

## 1. Land the last rescued plan doc onto `main` — near-resolved · WILL NOT SELF-HEAL

**Status:** Open (minor) · **largely resolved 2026-07-18 13:29.** The spec that actually mattered is on `origin/main`: `Docs/plans/2026-07-17-pure-claude-code-migration.md` and its brainstorm companion are both landed, so the six migration tickets that reference it can read it from `main`. **One** rescued doc is still stranded on the `rescue/2026-07-17-detached-plans` branch — `Docs/plans/2026-07-05-entity-visual-header.md` — and its feature (THR-637, Entity Visual Header) already **shipped** (PR #564), so the doc is a historical artifact, not a live dependency. Re-verified still stranded at the 2026-07-26 15:54 run. The rescue branch exists **only as a local branch on this machine** — never pushed to origin, so the doc is one-machine-only (low stakes: the feature it specified already shipped). Candidate to prune at the next full retro.
**Source:** 2026-06-23 retro + 2026-07-18 `keep-work-flowing-cc` freshness pings (retro E1); rescue verified complete 2026-07-18 11:25; migration spec confirmed on `origin/main` 2026-07-18 13:29

**Fix — a design session can do this; it is not a Christian-only task.**
```
git fetch
git checkout rescue/2026-07-17-detached-plans -- Docs/plans/2026-07-05-entity-visual-header.md
# commit onto a docs/* branch off current main, open a PR
```

**What breaks if not done.** Nothing live — the only remaining stranded doc backs an already-shipped feature. No data-loss risk (commits are branch-anchored), no active spec gap.

---

## Retracted this period

- **2026-07-25 15:16 — the "CI + deploy allowance exhausted" item, opened at 15:12 and retracted four minutes later. It was wrong**, and it never reached Christian (the retraction landed before the Discord ping fired). A cluster of Actions runs failing at startup with zero jobs executed looked like account-level exhaustion; it was a transient GitHub incident, and Actions resumed unaided by 13:15 UTC. **The lesson is finding 9 above, and it is what made a later, genuinely different call correct**: the cluster that began at 15:05 UTC that same day *was* a real account-payment block — GitHub's own annotation named it, and a fresh re-run reproduced the failure in 6 seconds. Two events, same signature, opposite causes; conflating them would destroy the lesson. Nothing here needs re-retracting.

## Resolved today (2026-07-26)

Compact index. Full prose for each is in `git log -p Design/user-actions.md`; the lessons worth keeping are folded into *Durable findings* above.

- **18:40 — THR-800 shipped (PR #914).** 40 of 62 dead trait refs repointed onto live definitions; the remaining 22 need minting and are filed as THR-808. Closes the sole High. Sequenced correctly behind THR-788 by its own mutex line — see finding 11.
- **17:45 — THR-788 shipped (PR #912).** Traits & Marks wiki page + Traits UL shard. The durable deliverable is the `sources` glob, which converts a documentation gap into a blocking CI gate — not the prose.
- **16:57 — the twenty-two-run carry of Friday's retro draft discharged**, by opening the file instead of describing it; it answers THR-798's step-2 question and was posted there.
- **16:26 — THR-803 shipped (PR #909).** Every multi-part story arc had been stuck on its opening chapter; six starter-chain stages were permanently undrawable. Found a second defect the ticket had not predicted.
- **14:58 — the Stale Claim Sweep filing ask discharged**: filed as THR-804 rather than restated a fourteenth time. Filing sharpened the diagnosis (a *second* extensionless import).
- **14:42 — THR-779 shipped (PR #907).** 17 unreachable authored encounters wired; 44 confirmed KILL. The encounter kill-list gate cleared without ever becoming a Christian ask — see finding 7.
- **13:16 — THR-797 shipped (PR #905).** The hourly reaper can no longer delete a workspace a live session is working in; verified by the next reaper run on real traffic rather than by a unit test.
- **12:33 — THR-801 shipped (PR #903).** `requiredTraits`/`blockedByTraits` declared on a 278-importer type; shipped deliberately unused, and said so rather than manufacturing a demonstration.
- **11:32 — THR-787 shipped (PR #901).** Reputation-derived titles had never once rendered in enriched prose — three sites read `category` where every definition stores `subcategory`.
- **10:55 — THR-786 shipped (PR #899).** The traits floor, designed and landed in the same hour; shipped the `validateTraitRefs` detector and filed two defects rather than shipping over them.
- **09:22 — THR-773 shipped (PR #896).** The Nudge Model has an engine; the blessed rebuild is off paper.
- **09:03 / 00:21 — two armed-and-`BEHIND` PR stalls cleared themselves.** The "wait one refresh" precedent is three-for-three; threshold confirmed rather than proposed.
- **07:39 — production publishing had silently stopped; Christian cleared it with a plan upgrade before any brief could ask him.** The residual gap is observability, not tier, and is **THR-785**.
- **07:38 — THR-761 shipped (PR #892).** Marks the god leaves on people now actually fade. Filed two deferrals (THR-783, THR-784) rather than shipping over them.
- **07:11 — WS0 exited design into Ready for Dev in twenty-five minutes**, closing a five-hour staging gap this file had carried.
- **06:36 — THR-760 shipped (PR #887).** The always-loaded instruction file lost 29% of its bulk with no rule removed.
- **05:35 — THR-755 shipped (PR #885).** Six gates stopped contradicting their own verdicts; the gate-credibility class closed from both ends.
- **04:10 — THR-754 shipped (PRs #882/#883).** The browser-verify evidence contract is satisfiable from every lane.
- **03:38 — THR-780 shipped (PR #880).** Dev-build double-apply fixed; the stash+HMR A/B *method* is the part worth keeping.
- **02:43 — THR-741 shipped (PR #878).** The god's destructive workings now produce authored aftermath.
- **01:24 — THR-776 shipped (PR #875).** The Nudge Model migration audit; the program's first workstream done.

*Resolved entries from 2026-06-23 through 2026-07-25 were pruned 2026-07-26 18:54 UTC (see the note at the top of this file). Recover any of them with `git log -p Design/user-actions.md`.*
