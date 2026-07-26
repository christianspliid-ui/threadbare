# User Action Required

**Last updated:** 2026-07-26 21:54 local, by the hourly `keep-work-flowing-cc` CC task.

**✅ ZERO BLOCKING CHRISTIAN-OWNED ASKS** — twenty-fifth consecutive hour. Two standing questions are answered and closed and **must not be re-asked**: the empty-projects question (Christian, chat 2026-07-25 21:53 — *leave the five projects open; they are intake buckets that refill as the game iterates*) and the GitHub Actions payment block (cleared 2026-07-25 ~17:09 UTC, verified by re-run).

> **This file was pruned at the 18:54 run** from 114 KB / 170 lines down to a compact same-day index, restoring its own stated policy (§ *How this works*): *"No history retained here — `git log` + the retros are the audit trail."* Nothing was destroyed; `git log -p Design/user-actions.md` holds every pruned word, and the durable lessons are carried forward as one-line rules below.

## This run's measurements (2026-07-26 19:54 UTC)

- **Home tree** on `main`, **0 behind**, **0 stranded**; **2 tracked-dirty** (`.claude/settings.json`, `.claude/settings.local.json` — an uncommitted MCP/PowerShell allowlist edit) and **1 untracked** (`Design/retros/retro-2026-07-24-draft.md`). Unchanged for seven runs.
- **Queue: BACKED UP — 23 ready (0 High / 11 Medium / 12 Low)**, nothing stale (oldest `updatedAt` 2026-07-24, two days), nothing blocked, **0 In Dev, 0 In Design, 0 open PRs**. Eleventh consecutive run above `QUEUE_BACKED_UP_MIN` (15); second consecutive run with no High anywhere in the ready lane. Composition identical to last run — 23 in, 23 out, one swapped.
- **One full pickup-to-ship cycle inside the hour, second hour running:** THR-783 `In Dev` 19:02:33Z → `Done` **19:40:03Z** (**37m30s**), PR #916 merged 19:39Z. Count held 23 → 23: −1 shipped, +1 filed **by that same ticket mid-flight** (THR-809, created 19:17Z — 23 minutes *before* its parent closed). Nothing claimed in the 14 minutes since; `tb-opus-pickup` next fires 20:00:53Z.
- **THR-783 is finding 2's fifth instance and the first to find its own successor underneath it.** `onFailureEffects` had five authoring sites and zero readers; wiring it did not produce a wound in a live run, because `ensureTraitNodes` never seeds the condition/mastery *definitions* the effect attaches to (THR-809). The executor measured the wired path instead of trusting the diff, and filed the layer below rather than closing on the layer above.
- **Deploy verified green rather than assumed:** `main` tip `e231fa6d` → `state: success`, single `Vercel` status **19:40:35Z**, `"Deployment has completed"` — 32 seconds after the merge, on a code-bearing change. All 12 most-recent workflow runs green (CI + Linear Auto-Close).
- **Reaper** ran 21:40 local, 14 min before this run: **23** worktrees (down one) / **32** branches (flat, fifth run) / 1 stash / **0 needs-disposition**. Seventh consecutive clean post-THR-797 run with no `WARN: worktree removal FAILED`.
- **Discord** read via the step-0 cursor: `HTTP 200`, **3 bytes** (`[]`) — genuinely empty, cursor unchanged at `1530719628429623431`, no receipt owed, no ping sent (Needs-Christian empty, hash unchanged at the empty-state value).
- **Zero Linear writes this run**; nothing claimed, no state set.

## Open agent work (not Christian's)

- **The `rescue/2026-07-17-detached-plans` branch is now provably prunable** — see today's close below. Four unique commits, all five of their blobs byte-identical to `origin/main`. Deleting it is a one-line `git branch -D` that this read-mostly task deliberately does not run; it wants a session with a write remit, or the next full retro. Zero risk either way: nothing is stranded on it.
- **Friday's retro draft** (`Design/retros/retro-2026-07-24-draft.md`) is still untracked and still wants a `git add` inside any docs PR — but it is **no longer a carried observation here**. It is a deterministic regenerable draft, not irreplaceable prose, and it is now **THR-798's step 2**, with an owner and a Done-when.
- **The tracked `.claude/settings*.json` edits** in the home tree. Inert and non-blocking, but *tracked* modifications are the class that stalls autosync if it ever needs more than a fast-forward. Wants a commit or a discard by whoever made it.
- **THR-804** (Stale Claim Sweep: 88 runs, 88 failures, zero successes since 2026-06-13) remains open and unclaimed. Re-measured every run rather than carried; count still flat, because the twice-daily job's newest run (2026-07-26T12:31:18Z) still predates the 14:57Z filing. Next run ~00:52Z will be the first post-filing datapoint.

## Durable findings carried forward

Rules earned by tickets that have since shipped. Kept as rules; the ticket-by-ticket prose is in `git log`.

1. **Before carrying an observation into its Nth run, re-derive it once.** **Three instances inside 48 hours, and the third is the most expensive**: THR-804 (thirteen runs restated a one-line cause from memory; filing it found a *second* defect the restatements had missed), the retro-draft carry (twenty-two runs described a file's significance without opening it; one `head -30` falsified both halves), and now standing item 1 — carried for **nine days** on a filename that has never existed on any branch, describing as "stranded" a document that was already on `origin/main`. Every carry restated the item; none opened it. The falsifying check was three `ls-tree` calls. **Note the failure mode is not laziness but plausibility**: each restatement was internally coherent, and coherence is exactly what stops a reader from checking. A carried item should be re-derived *on a schedule*, not when it starts to look wrong — by the time it looks wrong the cost has already been paid.
2. **A subsystem with no callers is invisible to every sweep that looks for wrong behaviour, because it has none.** Five instances in three days, all closed: THR-779 (61 templates, no draw path), THR-787 (three engine reads, wrong field name), THR-803 (whole chain subsystem, zero production callers), THR-800 (62 refs, no definition), THR-783 (five authoring sites, no reader — and beneath it THR-809, an effect kind whose target definitions are never seeded). Every one was authored or implemented capability that nothing routed to; every one failed silently; every one became visible only when something measured the producing side against the consuming side. **The class detector, not the individual repair, is the deliverable** — the repairs ran 30–82 minutes each once found. THR-783 adds the sharpest corollary: **wiring a dead field proves the wire, not the effect.** Only running the world and looking for the outcome distinguishes "connected" from "working", and here those differed.
3. **A plan doc's past tense is a claim, not evidence.** THR-801 existed only because the WS0 plan recorded a type change as already made; it had not been. The disconfirming check was a two-second grep that nothing in the pipeline had run for three days.
4. **Advisory gates that nobody reads are indistinguishable from gates that do not exist.** Both of THR-788's deferrals (THR-806, THR-807) surfaced from running the advisory gates at closeout and reading the output. THR-807's own framing is that the only thing noticing 61 stale plans was advisory.
5. **A test suite that agrees with the bug stays green forever.** THR-787's dead read survived because nothing asserted the observable outcome, only that the code ran. Trait regression tests must anchor on **shipped definitions**, never on fixtures written alongside the code under test.
6. **Read composition, not depth.** A queue that rises after a valuable hour is not decay if the arrivals are findings rather than regressions. Ten consecutive hours now read 21 → 21 → 20 → 21 → 22 → 22 → 23 → 23 → 23, across which the most valuable work of the week shipped. **The steady state is the signal**: at ~1 ship/hour and ~1 filing/hour the depth is stable by construction, and the filings are self-generated findings, not requests. A "backed up" verdict from `QUEUE_BACKED_UP_MIN` is therefore a threshold artefact here, not an alarm — report the composition alongside it every time, or the number lies.
7. **A gate clearing is not the same as a decision arriving.** Surfacing a settled call to Christian for ratification is worse than not surfacing it. This is what has kept twenty-five consecutive empty Needs-Christian hours honest rather than merely quiet. Worked example: THR-805's guild-rank question looked like two design *feels* and turned out to be a purely mechanical selection whose answer was already determined — retired on examination rather than escalated.
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

> **No Christian-owned ask is open, and for the first time since this file was created, no agent item is open here either.** The last standing item — the stranded plan doc — was closed this run by re-derivation, not by being worked. See today's index below. Remaining agent work lives under *Open agent work* above, where it belongs; this section is now empty by fact rather than by omission.

---

## Retracted this period

- **2026-07-25 15:16 — the "CI + deploy allowance exhausted" item, opened at 15:12 and retracted four minutes later. It was wrong**, and it never reached Christian (the retraction landed before the Discord ping fired). A cluster of Actions runs failing at startup with zero jobs executed looked like account-level exhaustion; it was a transient GitHub incident, and Actions resumed unaided by 13:15 UTC. **The lesson is finding 9 above, and it is what made a later, genuinely different call correct**: the cluster that began at 15:05 UTC that same day *was* a real account-payment block — GitHub's own annotation named it, and a fresh re-run reproduced the failure in 6 seconds. Two events, same signature, opposite causes; conflating them would destroy the lesson. Nothing here needs re-retracting.

## Resolved today (2026-07-26)

Compact index. Full prose for each is in `git log -p Design/user-actions.md`; the lessons worth keeping are folded into *Durable findings* above.

- **19:54 — standing item 1 ("land the last rescued plan doc") closed as never-real, after nine days of being carried.** Re-derived instead of restated, per finding 1. Three checks: the file the item names — `Docs/plans/2026-07-05-entity-visual-header.md` — **exists on no branch, and never has**; the real docs are `Docs/plans/2026-07-05-thr-637-entity-visual-header{,-brainstorm}.md`; and **both are already on `origin/main`**. All four unique commits on `rescue/2026-07-17-detached-plans` carry blobs byte-identical to `origin/main` (verified by `rev-parse` on all five paths, including the `.intent-proposals` copy). **Nothing was ever stranded.** The item's own fix command would have failed on a nonexistent path had anyone ever run it — which is the tell that nobody did, for nine days. The branch is now safely prunable; that is agent work, listed above.
- **19:40 — THR-783 shipped (PR #916), 37m30s door to door.** A lost tavern brawl was authored to leave the mortal wounded at five sites; nothing read the field, so it never once did. Now wired — **and proven not yet sufficient**: the executor ran the world, saw no wound land, and traced it to condition/mastery trait *definitions* never being seeded at all. Filed as THR-809 mid-flight rather than closing on a green diff. Finding 2's fifth instance and its sharpest corollary.
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
