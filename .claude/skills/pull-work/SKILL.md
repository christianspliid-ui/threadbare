---
name: pull-work
description: Canonical Claude Code pickup workflow for claiming Linear work safely from Ready for Dev.
last_validated_against: 2026-08-29
---

# Pull Work

## Purpose

Use this skill to run Claude Code's Linear pickup protocol as an explicit checklist instead of re-deriving it from prose each session.

Run as `/pull-work` (auto-pick top Ready for Dev issue) or `/pull-work THR-123` (target a specific issue).

## Scope

- Queue: `Ready for Dev` only
- Audience: Claude Code executor
- Outcome: either a verified `In Dev` claim, or a safe refusal with a bounce note
- A run may additionally **drain** `docs-only` tickets after its primary ticket — see "Closeout — drain the `docs-only` queue" (THR-938)

## pullNextReadyForDev — Atomic Pickup Procedure

**Canonical path for Rules 1, 4, and 7.** Execute this 6-step sequence as a single atomic unit instead of hand-rolling claim + verify + comment-read separately. Steps 1–4 below are the documented fallback for agents that bypass the wrapper. After verified claim, runs Step 4.5 worktree-isolation if home is dirty, then Step 4.6 stranded-commit zombie sweep.

**Constant:** `MAX_CLAIM_RETRIES = 3`

1. **Board scan** — consume the Step 1 board-scan (already built): **two state-filtered `list_issues` calls**, not one unfiltered 250-issue sweep. Partition candidates by **Rule 0** (flow impediments with demonstrated cost outrank everything, whatever their `priority` field — see Step 1), then sort each partition by priority (1=Urgent first), then oldest `createdAt` as tie-break. Pick the top of partition 1 if non-empty, else the top of partition 2 — considering **every** queue item, not only the unassigned ones (THR-845: an assignee on `Ready for Dev` is noise, not a claim, and filtering on it hid the board's two highest-priority issues).
1.5. **WIP gate** — if the "In Dev" slice filtered to `assignee:"me"` is empty, continue to step 2. If exactly one entry, route to Step 1.7 (resume-from-In-Dev upstream-shipped check) instead of exiting clean. If more than one entry, this is a Rule 6 violation — output the cross-session-leak trace line and exit 1.
2. **Claim** — `save_issue(id, assignee:"me", state:"In Dev")`.
3. **Verify** — `get_issue(id)`. Confirm both `assignee` and `state` match.
   - On mismatch (silent drop, impediment #48): release claim with `save_issue(id, assignee:null)`. Output trace line (see below). Move to the next candidate. Retry up to `MAX_CLAIM_RETRIES` total attempts.
   - On all retries exhausted: output final trace line and exit the wrapper — fall back to the hand-rolled Step 1–4 path below.
3.5. **Upstream-shipped check (Rule 9: don't re-do shipped work)** — run:

    git fetch origin main
    git log origin/main --grep="Fixes ${id}" --grep="Closes ${id}" --grep="Resolves ${id}" --regexp-ignore-case --extended-regexp --oneline

If the result is non-empty, the work has already landed but Linear's auto-close either lagged or failed. Do NOT proceed to read the plan doc or write code. Apply the disposition in § *The verified-shipped park* above — comment the SHA, `save_issue(id, assignee: null)` with the state **staying** `In Dev`, verify-after-write, exit cleanly. Do not release to `Ready for Dev`.

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log the error and continue to step 4 anyway. The upstream-shipped check is best-effort — a fetch failure must not block pickup of genuinely open work. Surface a one-line warning in the session log.

4. **Fetch latest comment** — `list_comments(id, orderBy:"createdAt", limit:5)`. Extract the most recent entry.
5. **Return bundle** — `{ issueId, state, assignee, latestComment }`. Continue from Step 5 (Reopened check) using this data.

**Trace output format** (documents retry behavior for inspectability — NFP #2):

Happy path:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
[pullNextReadyForDev] Upstream check: clean — no matching commit on origin/main. Continuing to plan doc.
```

Upstream-shipped path:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
[pullNextReadyForDev] Upstream check: found commit a1b2c3d "feat(thr-247): ..." — posting comment, unassigning (state stays In Dev). Exiting clean.
```

Silent-drop retry:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=null — silent drop (impediment #48). Releasing, trying next candidate.
[pullNextReadyForDev] Attempt 2/3: claiming THR-248... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
```

All retries exhausted:
```
[pullNextReadyForDev] All 3/3 attempts failed — silent drops on all candidates. Surfacing error. Use hand-rolled Rule 1 path and log impediment via impediment-reporter.
```

---

## The verified-shipped park — one state, one disposition

Two checks can discover the identical state — **the work is verified on `origin/main`, but Linear's auto-close never fired**. Step 1.7 reaches it by resuming an existing `In Dev` claim; Step 4.4 reaches it by claiming fresh from the queue. **Both get the same answer**, because disposition follows the *state discovered*, never the *path taken to discover it*. Until THR-958 the two diverged — 1.7 kept the issue `In Dev`, 4.4 released it to `Ready for Dev` — on no difference except how the session arrived, which has no bearing on what the issue now needs.

**The disposition — this is the only place it is stated:**

```
save_comment(issueId: id, body: "Upstream-shipped check found commit {sha} on origin/main: \"{first-line}\". Auto-close did not fire.")
save_issue(id, assignee: null)     # state STAYS In Dev
get_issue(id)                      # verify-after-write (impediment #48)
# if the assignee key is BACK, re-assert once: save_issue(id, assignee: null, priority: <its current value>) → get_issue
```

Then exit cleanly. Do **not** write `state: "Ready for Dev"`, and do **not** write `save_issue(state: "Done")` — Rule 3 forbids CC closing.

**Verify means verify *and re-assert* — the assignee gets the same discipline as the state (THR-1058, impediments #508, #380).** A park is only readable if `assignee: null` ∧ `state: In Dev` both hold, so a null that does not stick makes finished work invisible to the one lane that would ask Christian to close it — THR-875 sat that way ~35 minutes and would have stayed invisible indefinitely. Two failure shapes produce it, and the re-assert covers both without needing to tell them apart: the write silently no-ops (#380 — an `assignee: null` sent as the *sole* changed field on an issue that has carried its assignee a while; bundling one other field at its current value makes it apply), or it lands and something later repopulates it (#508). **Read the `assignee` key's absence off the `get_issue` re-query, never off the mutation echo**, which can report pre-write state (#306).

**What is ruled out, so no later session re-derives it (THR-1058, 2026-08-15).** The MCP *update* path does **not** default the assignee. Seven controlled arms on a scratch issue (THR-1116) held `assignee: null` through a priority change, a label replace, a `blockedBy` relation add, a `state` transition into `In Dev`, a second label touch while parked, a `save_comment`, and a **pushed branch whose name matched the issue's own `gitBranchName`** — each verified by `get_issue`, not by the echo. A sole-field `assignee: null` also applied cleanly against a *freshly* set assignee, so #380's no-op needs an assignee that has been in place a while and is not reproducible on demand within a run. THR-1058's original hypothesis — "assignee defaults to the calling actor on any write that omits it, not only `issueCreate`" — is therefore **false as stated**; the create-path defaulting (#306, THR-845) is real and already fixed.

**What was not tested, stated so the next session starts here.** The branch-push arm left `updatedAt` untouched and created no attachment, so Linear's native GitHub integration does not act on a bare push. That leaves exactly one live candidate: the same integration acting on **PR open / merge**, which this repo already knows writes to issues from branch name and title (THR-738 vectors 2 & 3) and cannot configure from here. It fits the residue — both reverted issues carried a `gitBranchName` matching a branch the lanes create, and THR-875's revert landed nine minutes after its closeout comment, a lag no synchronous MCP call explains. Testing it needs a throwaway PR against a scratch issue, which was judged not worth the repo noise once the containment below made the cause academic. **Do not re-run the MCP arms**; if this recurs, capture the issue's **activity feed** at the moment of the revert — it is the only surface that names the actor, and every field-level probe above has already come back negative.

**Who reads this park (THR-846) — the reason, not just the rule.** The work is verified shipped, so what the issue needs is *closing*, an action no CC lane may take. The lane that reads it is **`keep-work-flowing-cc`**, whose board scan reads the In-Dev slice for exactly this shape (`assignee` null, state `In Dev`) and surfaces it to Christian in `Design/briefing.md` under `## Needs Christian` — closing being a one-click action only he can take. **Every park must name the lane that reads the destination.** An edit that changes this destination without naming a lane that reads the new one is the defect, not the fix.

**Why `Ready for Dev` is the wrong destination.** It puts a **completed** ticket back at the top of the queue. The next hourly run claims it, runs the same investigation, reaches the same conclusion, and releases it again — every hour, forever, with no lane able to break the cycle. That is the re-offer loop THR-836 identified for bounces ("a gate that refuses without routing is a spin loop wearing a gate's clothes"), and it costs a full drain slot per occurrence. It is also *invisible*: each individual run looks like correct protocol adherence, and the released ticket looks like healthy queue membership.

**Measured.** THR-792 hit this on 2026-08-02. Its fix had shipped six days earlier under THR-793's id (`15fc10f0`), so the Step 4.4 grep for `Fixes THR-792` was clean and correct to be — shipped-under-a-sibling-id is exactly when 4.4 fires without 1.7 having had a chance to. That run deviated from 4.4 and applied this disposition instead, recording the reason in a comment; THR-958 made it the rule so no later run has to re-derive it.

**Not to be confused with the churn park**, which is a *different* discovered state and correctly gets a different answer: Step 1.8's three-checkpoints-without-a-ship escalation routes to `Todo` + unassign, because that issue needs **re-scoping** and the lane that reads `Todo` is `tb-orchestrator` (T2). Verified-shipped needs closing; churning needs re-scoping. Same shape of park, different reader, different destination.

---

## Steps

> **Prefer `pullNextReadyForDev` above** for the canonical one-call path. These steps are the documented fallback and expand exactly what the wrapper does internally.

### Step 0 — Session-start sweep

Before any pickup work, sweep for stale `tfws-pickup-*` and `tfws-resume-*` worktrees left by previous sessions. Prevents disk/grep pollution from accumulating across sessions.

**Constant:** `WORKTREE_STALE_DAYS = 14`

**Scope:** only worktrees whose path matches `../tfws-pickup-` or `../tfws-resume-` (created by Step 4.5).

**Ownership of `.claude/worktrees/` (settled THR-674).** The hourly reaper — `clean-stale-git.sh`, merge-gated and liveness-guarded per THR-673 — is the **single owner** of `.claude/worktrees/` cleanup. This sweep never touches that path, and neither does any other pull-work step. One folder, one policy: previously three separate policies claimed authority over `.claude/worktrees/` (this sweep's exclusion, the reaper's merge-gated reap, and ad-hoc ticket-driven cleanup), which is what let THR-674's worktree scope item stall — a stray worktree had no unambiguous owner to dispose of it. If a worktree under `.claude/worktrees/` needs disposition, that is a reaper concern; escalate via the reaper's `NEEDS-DISPOSITION` line rather than removing it here.

**Skip if:** the current session is already running inside a `tfws-pickup-*` or `tfws-resume-*` path (self-removal edge case).

**Procedure:**

1. Collect orphaned entries (registered but directory gone):
   ```bash
   git worktree prune
   ```
2. List all worktrees and filter for the `tfws-pickup-*` / `tfws-resume-*` pattern:
   ```bash
   git worktree list --porcelain
   ```
3. For each matching entry, evaluate two conditions:
   - **Clean:** `git -C <path> status --short -- ':!.codesight'` returns empty output. `.codesight/` modifications are auto-generated at session start and are not real uncommitted work.
   - **Stale:** the most recent commit timestamp on the branch HEAD is older than `WORKTREE_STALE_DAYS` days:
     ```bash
     git -C <path> log -1 --format="%ct"
     ```
4. If **both** conditions are true, remove the worktree and delete the local branch:
   ```bash
   git worktree remove --force <path>
   git branch -D <branch> 2>/dev/null || true  # branch may already be gone remotely
   ```
5. Log each action (one line per worktree):
   ```
   [pull-work] sweep: removed <path> (branch <branch>, <N>d old, clean)
   [pull-work] sweep: kept <path> — has uncommitted changes (non-codesight files dirty)
   [pull-work] sweep: kept <path> — <N>d old (< WORKTREE_STALE_DAYS threshold)
   [pull-work] sweep: pruned orphaned registry entry (directory gone)
   ```

**Fail-soft:** if `git worktree prune` or `git worktree list` errors, log a single warning and continue. Sweep failure must never block pickup.

---

### Step 0.5 — Rate-limit guard

If any Linear MCP call in this session returns a rate-limit error (HTTP 429 / MCP rate-limit response), pause 2 minutes, retry once, then if still limited log an impediment via `impediment-reporter` and exit cleanly without claiming. Do not retry in tight loops.

### Step 0.6 — Merge-gate health gate (THR-768)

**Do not claim new implementation work while the merge gate is vacuous.** This is a rule, not a judgment call each time — it has been re-litigated in four separate sessions and got it wrong at least once.

```bash
npm run check:actions --silent -- --json
```

- **`standDown: true`** (verdict `billing-block`) → **do not claim.** Post nothing to Linear (the outage is not a ticket's fault and a comment on an arbitrary issue is noise), log one line, and exit clean. `keep-work-flowing-cc` step 2.5b surfaces the `summary` to Christian within the hour; only he can clear it. A healthy queue loses nothing by waiting one hour — an unguarded `main` is not worth one hour of throughput.
- **`stalled`** (THR-1013) → **continue to Step 0.8, and name it in the run report** with its `stalledCount`. GitHub is accepting jobs and giving them no machine, so every PR you arm this run will sit unmerged until capacity returns. That is a delay, not a danger — `cancelled` does *not* satisfy branch protection the way `skipped` does, so the gate is blocking rather than vacuous, and auto-merge fires by itself on recovery. Standing the lane down would forfeit an hour of delivery against a risk that is not present; what was missing on 2026-08-06 was the sentence, not the halt.
- **any other verdict** (`healthy`, `recovered`, `transient`, `unknown`) → continue to Step 0.8.

**Why the gate can be vacuous while reading as enforced:** when Actions cannot start jobs, the required `Test · Typecheck · Build` check records as `skipped`, and **a skipped required check satisfies branch protection** (see the standing `reference_skipped_required_check_merges` finding). Reproduced end to end on PR #853 and again on PR #1022, which carried engine + content changes. The `Guard — change detection health` step in `ci.yml` now closes this at source for every cause *except* a full Actions outage — during which nothing runs at all, including the guard. This step covers that residue.

**Do not rely on `gh pr merge --auto` refusing to arm during an outage.** A 2026-07-25 note recorded that it returns *"Pull request is in unstable status"*, making armed auto-merge accidentally safer than a manual merge. On 2026-07-28 it armed without complaint and fired. That property is **not** dependable and must not be treated as mitigation.

**Fail-soft:** the probe degrades to `verdict: "unknown"` on any network/auth failure and never exits non-zero without `--strict`. An unreadable probe is not a reason to refuse work — `unknown` continues.

### Step 0.8 — Open-PR reconciliation sweep (THR-702, classification fixed THR-897, membership fixed THR-930)

This sweep is the recurring surface that catches open PRs which cannot merge on their own. **Its original reason is gone: strict mode was dropped on 2026-08-02 (THR-983), so `BEHIND` no longer blocks anything** — a green PR merges regardless of tip movement, and the livelock THR-702 found (9 armed PRs sitting `BEHIND` forever, oldest 19 days) can no longer occur. The sweep survives for the failure it did *not* originally target: **`DIRTY` — a real merge conflict**, which no protection setting fixes.

**An open PR can be stuck in more than one way, and only one of them is yours to fix.** Until THR-897 this step matched on `BEHIND` alone. A PR at `DIRTY` — a real merge conflict — is not `BEHIND`, so it was skipped, and `update-branch` would not have fixed it anyway. Measured 2026-07-31: **3 of 4 armed PRs were `DIRTY`**, one of them armed 19 hours earlier carrying THR-883's authoring-contract rewrite (the deliverable that unblocked 11 content tickets), while three consecutive sweeps each reported success. The old step 4 did name `DIRTY` in prose — but with no mechanism and a log line that mentioned only `BEHIND`, so in practice every run stepped past it.

**The sweep covers every open non-draft PR, armed or not (THR-930).** THR-897 fixed classification *within* the armed set and left the set itself as a filter, so an unarmed conflicted PR was not misclassified — it was **absent from the input**, and the probe reported a clean bill while being correct against its own contract. Measured 2026-08-02: the repo's only open PR was #1114 (`DIRTY`, unarmed, 77 hours old, holding THR-860's In-Dev slot the whole time) and the probe answered `counts.conflicted: 0` with the summary *"No PRs are waiting to merge."* Arming says *how* a PR intends to merge; it says nothing about whether it is stuck. Drafts stay excluded — that is the one case where "not trying to merge yet" is the author's explicit signal.

One consequence for how you read the output: **unarmed conflicts run slower age tiers** (`UNARMED_DIRTY_ESCALATE_HOURS` 6, `UNARMED_DIRTY_ABANDONED_HOURS` 24, against 90 minutes / 12 hours for armed), because an unarmed PR has made no promise to merge *now* — which justifies patience, not silence.

**`updateCandidate` and the `BEHIND` drain arm are vestigial (THR-983).** With strict mode gone a `BEHIND` PR merges on green by itself, so `gh pr update-branch` rescues nothing. The probe may still name a candidate; running it is harmless but pointless, and **a `BEHIND` PR is no longer a finding**. `ARMED_SWEEP_MAX_UPDATES = 1` survives only as a bound on that vestigial path. Do not build new logic on either.

**The livelock this step was built for cannot recur, and its remedy is settled — do not re-litigate it (THR-735 → THR-983).** The old ceiling was **one merge per advance of `main`'s tip**: measured 2026-07-31, PRs `#1166`, `#1175`, `#1176` all sat `BEHIND` at the same base, and the instant one merged, strict mode returned the others to `BEHIND`. THR-946 pursued **GitHub's merge queue** as the structural fix; the queue proved **unavailable on a personal-account repo**, so THR-735's fallback was taken instead and strict mode was dropped outright on 2026-08-02. That removed the livelock at the source. `ci.yml` retains a `merge_group` trigger which is inert — no merge groups are ever built. **There is no queue to probe for and no queue coming**; a liveness probe here would be dead code, and the decision record is `Docs/plans/2026-07-20-git-cicd-clean-delivery.md` § 9c.

Run the probe — it does the listing, the `UNKNOWN` re-query, and the classification in one call:

```bash
npm run check:armed-prs --silent -- --json
```

One line of JSON: `{ verdict, summary, needsChristian, needsSession, updateCandidate, prs, counts, armedCount, unarmedCount }`. Each `prs[]` entry carries `armed`, `ageMinutes`, `conflictFiles`, `checkConclusion`, `escalated`, `abandoned`, and `holdReason`. Act on it:

1. **`updateCandidate` is non-null** → **ignore it and continue** (THR-983). It names the oldest armed `BEHIND` PR, which since 2026-08-02 merges on green without help. Running `gh pr update-branch` is a harmless no-op that costs a CI re-run; do not.
2. **`verdict: "conflicted"` or `"abandoned"`** → those PRs cannot merge and no sweep action will change that. Each `prs[]` entry carries `conflictFiles`, already computed. If a conflicted PR is **yours**, route to "Closeout — resolving a conflicted closeout-docs PR" below and fix it now. If it is not yours, **report it in the run log with its number and conflicting files** — do not silently continue.
   - **The probe now tells you whether a PR is *held* rather than stuck — you no longer read Linear to find out (THR-985, shipped 2026-08-02).** `DIRTY` + unarmed + old is the signature of a dead PR *and* of one deliberately parked, and `autoMergeRequest: null` never means "should be armed". A PR carrying a line-anchored `Hold: <reason>` marker in its body now classifies **`held`**, never escalates, and reports its `holdReason` — so a `conflicted`/`abandoned` verdict once again means what it says. PR #1114 cost four sessions the hand-derivation this replaces (impediments #393, #406, #411, plus the run that fixed it). **Resolving a held PR's conflict is still fine; re-arming it is not.** Only a conflicted PR with a *null* `holdReason` is worth a Linear round-trip — and if you conclude it is genuinely parked, write the `Hold:` line into the PR body so the next run is told rather than having to re-derive it.
3. **`verdict: "failing"`, or any `prs[]` entry with `checkConclusion: "failing"`** → that PR has a **red required check** and will never merge, however clean its merge state reads (THR-1020). Auto-merge stays armed and simply never fires, so the PR reads as shipped from every surface except the rollup — impediment #402 recorded ~100 minutes of exactly that. Read the failing check (`gh pr checks <N>`), then treat it like any other blocker: fix it if the PR is yours, report the number and the check name if it is not. **A transient failure is still a permanent stall** — a flaked `npm ci` or a timed-out test does not retry itself; `gh run rerun <run-id> --failed` is the repair, and doing nothing is not.
   - **`conflictFiles` is a lower bound, never the whole diagnosis.** A `conflicted` PR that is also red keeps its `conflicted` class and its age tiers, and names both blockers in one row. Resolving the conflict and pushing leaves it `MERGEABLE` and still blocked — which then re-reports under a *different* verdict next hour, looking freshly actionable while ageing (impediment #466, ~15 min of second-pass diagnosis).
4. **`needsSession: true`** → the conflict has outlived at least one sweep interval (or, for an unarmed PR, `UNARMED_DIRTY_ESCALATE_HOURS`), or a required check is red. Name it in the run report so the next pickup sees it even if this run ends on an unrelated ticket.
5. **`verdict: "held"` / `"idle"`** → nothing to do and nothing to escalate. `held` means every remaining PR is parked on purpose; `idle` means unarmed, so nothing is waiting on it and it will not merge on green. Continue to Step 1.
6. **`verdict: "healthy"` / `"drainable"` / `"unknown"`** → nothing conflicted and nothing red; continue to Step 1.

Log one line, and include the conflicted count, the **failing** count, **and the unarmed count** — a sweep that reports only what it drained is how THR-897 stayed invisible, one that reports only the armed set is how THR-930 did, and one that reports only merge state is how THR-1020 did:

```
[pull-work] Step 0.8: <N> open PRs (<A> armed / <U> unarmed; <D> drainable, <C> conflicted, <F> failing, <W> waiting, <I> idle, <H> held), updated #<X> / none drainable — continuing.
```

**Do not classify on `mergeStateStatus` alone (THR-1020).** A PR has two independent ways to be unmergeable — a conflict and a red required check — and merge state can see only one of them. A sweep that reads merge state alone reports half a diagnosis with total confidence, which is worse than reporting nothing: the missing half is discovered a sweep later, under a different verdict, by a session that believes the first answer was complete.

**Do not classify on a single read of `mergeStateStatus` either.** GitHub computes it lazily, so a first read of `UNKNOWN` means "not computed yet", not "fine" — measured 2026-07-31, PRs #1132 and #1166 each read `DIRTY` and then `UNKNOWN` minutes apart with no intervening push. The probe re-queries `UNKNOWN` up to `ARMED_UNKNOWN_REQUERIES` (3) times before believing it; a hand-rolled sweep must do the same or it will call a conflicted PR healthy on roughly every other run.

**`needsChristian: true` (verdict `abandoned`) is not a merge-gate failure.** It means a conflict has survived ~12 hourly sessions — or ~24 hours for an unarmed PR — so the stall is systemic rather than waiting its turn. Surface the `summary` verbatim; do not stand down, and do not treat it as a reason to skip pickup.

**Fail-soft:** the probe degrades to `verdict: "unknown"` on any `gh`/network failure and never exits non-zero without `--strict`. Any error → log one warning and continue to Step 1. The sweep must never block pickup.

### Step 1 — Two state-filtered board scans

If no issue id was provided, fire **two** calls:

```
list_issues(team:"Threadbare", state:"In Dev",        limit:50,  includeArchived:false)
list_issues(team:"Threadbare", state:"Ready for Dev", limit:100, includeArchived:false)
```

The first response gives both In-Dev slices you need: filter to `assignee:"me"` for the WIP gate (Step 1.5), and read it across all assignees for the concurrent-session parallel check (Step 2). The second is the pickup-candidate list.

**Do not use a single unfiltered `limit:250` sweep.** That call returns roughly 390k characters and is rejected outright on response size, so the canonical path used to fail at step one and every run improvised its own scan (THR-686). State-filtering is what keeps the response inside budget — this now matches what `keep-work-flowing-cc` § 1 already does, so the two skills no longer contradict each other.

**The second call deliberately does *not* filter on `assignee:null` (THR-845).** It used to, and that made every assigned queue item invisible: not bounced, not logged, simply absent from the result — the worst shape a queue bug can take. Measured 2026-07-29: `Ready for Dev` held 41 issues, 19 carried an assignee, and the two highest-priority items on the whole board (one Urgent, one High) were both in the hidden 19. **An assignee on `Ready for Dev` is not a claim** — claims are `In Dev`, which Step 1.5 gates on. On the queue the field is meaningless noise, so it must not gate candidacy.

Instead, **count it and say so.** Partition the queue response and emit one line before sorting:

```
[pull-work] Step 1: Ready for Dev <total>, unassigned <U>, carrying an assignee <A>.
```

`A > 0` means the writer-side leak has reopened (the create path in the orchestrator prompt's T1 step 5a, or a new filer that does not know the rule). Treat those issues as **candidates anyway**, and clear the stray assignee with `save_issue(id, assignee:null)` on the one you pick — it is a one-line repair, and `stale-claim-sweep`'s queue-assignee pass will catch the rest within 12 hours. Do not skip them and do not stop; a non-zero `A` is a number to report, not a blocker.

Sort the Ready-for-Dev candidates by priority **in memory** (impediment #49 — `orderBy:"priority"` is accepted by the schema but rejected at runtime; `orderBy` defaults to `updatedAt`, which is fine). Oldest `createdAt` is the tie-break. Pick the top.

**Apply Rule 0 before the priority sort** (CLAUDE.md § Prioritization, director decision 2026-08-02). A **flow impediment with demonstrated cost** outranks every other candidate regardless of its `priority` field — which is exactly the point, since these tickets are routinely filed `Low` or `No priority` by the lanes that find them. Partition the candidates in two passes:

1. **Qualifying** — the ticket's body or comments record that the delivery machine **already lost work**: a lane that stopped firing, a PR that could never merge, a gate that reported success while broken, a ticket silently dropped or re-done, or measured rework. The evidence must be quotable from the ticket — a count, a duration, a commit SHA, a log line.
2. **Everything else** — including hardening, dead-code pruning, doc drift, naming fixes and test tidying. Prevention does not qualify; neither does an `Infrastructure` / `Improvement` label on its own.

Sort each partition by priority as above, then take the top of partition 1 if it is non-empty, otherwise the top of partition 2. **State which partition your pick came from in the Step 1 line, and for a partition-1 pick quote the sentence that qualified it** — one clause, so the claim is auditable and the predicate cannot quietly widen into "anything labelled Infrastructure":

```
[pull-work] Step 1: Rule 0 pick — THR-834 ("hid 88 consecutive failures for six weeks").
[pull-work] Step 1: no Rule 0 candidates; normal priority pick — THR-971.
```

If you cannot produce that quote, the ticket belongs in partition 2. An empty partition 1 is the healthy steady state, not a sign you searched wrong.

If a specific issue id was provided, skip to Step 3.

### Step 1.5 — WIP=1 gate (Rule 6 enforcement) + resume routing

If the Step 1 board scan's "In Dev" slice filtered to `assignee:"me"` is empty, continue to Step 2.

**Count in-flight implementations, not open claims (THR-927 — supersedes THR-938's flat subtraction).** The gate protects an invariant about *concurrent implementation*: one thing being built at a time. A claim whose PR is already open and carries its close keyword is **discharged** — the building is finished, and the merge fires with no session present, by design after this run ends. Counting it as work-in-progress red-exits the *next* run on a leak that does not exist. That is not hypothetical; it is how the rule was found (`tb-opus-pickup`, 2026-07-31 ~19:00Z, impediment #365: THR-925 and THR-926 both sat `In Dev`, both shipped by the single armed PR #1191, and the documented response to a count above 1 is "surface and stop").

**A `DIRTY` PR does not discharge (2026-08-28 retro; impediment #765).** "The merge fires with no session present" is true for a PR waiting on checks and **false for a conflicted one** — GitHub does not build a conflicted PR, so not one check runs, auto-merge can never fire, and every surface reads healthy. Measured 2026-08-25: PR #1618 (High-priority content, armed 13:28Z) sat `DIRTY` for ~4.5 hours with `gh pr checks` showing only passing Vercel entries, while the WIP gate counted it as shipped. When resolving claims to PRs, also read `mergeStateStatus` (the same `gh pr list` call takes it in `--json`; re-query `UNKNOWN` 2–3 times per the Step 0.8 rule): a claim carried by a **`DIRTY`** PR is **undischarged — route it to Step 1.7 resume as your own claim** and resolve the conflict per the conflicted-PR closeout, which converts a silent indefinite stall into a normal pickup.

Resolve each `In Dev` claim assigned to you to the open PR that closes it, then count only the claims that resolve to nothing:

```bash
gh pr list --state open --json number,body \
  --jq '.[] | .number as $n | .body | split("\n")[] | select(test("^(Fixes|Closes|Resolves) THR-[0-9]+[[:space:]]*$")) | "PR#\($n)\t\(.)"'
```

| In-flight claims (those resolving to **no** open PR) | Verdict |
|---|---|
| 0 | Nothing is being built. Continue to Step 2 and claim. |
| 1 | Route to Step 1.6 (resume — predecessor-liveness proof, then the upstream-shipped check). |
| >1 | Genuine cross-session leak (Rule 6). Surface and exit 1 so it is visible in cron logs. Do not claim more. |

**Match the closer's predicate exactly — the keyword alone on its own line (THR-738).** `linear-autoclose.yml` is line-anchored, so a body that merely *mentions* `Fixes THR-XXX` mid-sentence will never close that issue. A gate that discharges a claim on such a mention has declared finished a ticket that nothing will close — and the superseded `grep -oE '(Fixes|Closes|Resolves) THR-[0-9]+'` matched exactly that prose, because it was unanchored. The two predicates must not drift apart again; this one is the workflow's.

**Discharged claims never gate, however many there are — this deviates from THR-927's own proposal, deliberately.** The ticket (filed 2026-07-31) specified counting *distinct PRs* plus no-PR claims, and asked that two claims across two PRs still exit 1. The `docs-only` drain shipped afterwards (THR-938) and **deliberately produces that state**: it ships the primary ticket, then claims and ships up to three more, each leaving a claim `In Dev` until auto-merge fires. Under the literal formula the next run red-exits on a board the drain exists to create. The formula also fails on the board that was live while this was being written — one discharged claim (THR-582 → PR #1299) plus one genuine in-flight claim (THR-927) scores `1 + 1 = 2` and exits 1, red-exiting the very run that fixed it. Two open PRs are two finished ships, not two implementations. The ticket's "worse bookkeeping" concern is real but is bookkeeping; losing an hourly slot is lost delivery, and Rule 0 ranks those in that order.

**Fail-soft:** if the `gh` call errors, discharge nothing and fall back to the raw claim count. Over-reporting a leak costs an hour; under-reporting one costs the invariant.

```
[pull-work] Step 1.5: WIP gate — 0 in flight (discharged: THR-582→PR#1299). Continuing to Step 2.
[pull-work] Step 1.5: WIP gate — 1 in flight (THR-927). Routing to Step 1.6 resume.
[pull-work] Step 1.5: WIP gate — 2 in flight ({issueIds}), neither carried by an open PR. Cross-session leak. Surface and stop.
```

The single-in-flight case routes to Step 1.6 (predecessor-liveness proof) and then Step 1.7 (upstream-shipped check) rather than exiting clean. Two questions have to be answered in that order: **is the predecessor still alive** (1.6 — if so, every later step is a write against a running session), and only then **did the work already ship** (1.7).

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `WIP_GATE_EXIT_CODE_SINGLE` | 0 | Single in-flight ticket routes to Step 1.7; exit clean only if shipped |
| `WIP_GATE_EXIT_CODE_MULTI` | 1 | Multiple in-flight is a leak; exit red |

**Fail-soft:** If the Linear API errors during the In Dev query, treat as gate-fired (refuse to pull when state is unknown). Log an impediment and exit 0.

### Step 1.6 — Predecessor-liveness proof — prove the previous session is dead before resuming it

Reached from Step 1.5's single-in-flight branch. **Run this before every other read or write on the resumed issue**, including the Step 1.7 upstream grep's disposition, the Step 1.8 comment read, and any `save_issue`/`save_comment`.

**A resume and an overlap are the same shape (impediment #743, 2026-08-25).** An hourly lane found one `In Dev` claim assigned to itself and was routed to resume it — onto a branch whose **live predecessor had committed 3.5 minutes earlier** and written 16 files inside 20 minutes. Every documented gate said resume. The checkpoint comment read exactly like a finished handoff, because a live session has no reason to post one and the *previous* run's checkpoint was still the newest comment. It was a near-miss only because that run stood down on its own suspicion, which is not a mechanism. The lane overlapping *itself* is the ordinary case, not the exotic one: sessions run long, the schedule does not wait, and nothing in Linear's state field distinguishes "paused" from "running right now".

**The two reads.** Both must come back idle. Recent on **either** ⇒ stand down.

```bash
# The predecessor's branch: Linear's `gitBranchName`, or the branch named in the
# latest checkpoint comment if it differs (a prior run may have worked elsewhere).
BRANCH="<gitBranchName | branch named in the latest checkpoint comment>"

# (a) Branch-tip age. Use %ct — Unix epoch seconds, timezone-free BY CONSTRUCTION.
TIP=$(git log --format=%ct -1 "$BRANCH" 2>/dev/null)
if [ -n "$TIP" ]; then
  TIP_IDLE_MIN=$(( ($(date +%s) - TIP) / 60 ))
else
  TIP_IDLE_MIN=999999   # branch absent locally — no tip signal; (b) decides alone
fi

# (b) Working-tree activity in the worktree checked out on that branch. Same probe,
# same prune list, same threshold as the reaper's `worktree_recently_touched`.
WT=$(git worktree list --porcelain \
     | awk -v b="refs/heads/$BRANCH" '/^worktree /{w=$2} /^branch /{if($2==b) print w}')

wt_recently_touched() {   # verbatim from Docs/ops/clean-stale-git.sh.md
  [ -n "$1" ] && [ -d "$1" ] || return 1
  find "$1" -maxdepth 3 \
       \( -name node_modules -o -name .git -o -name dist -o -name coverage \
          -o -name .codesight -o -name .vite \) -prune -o \
       -newermt "-$RESUME_MIN_IDLE_MINUTES minutes" -print -quit 2>/dev/null | grep -q .
}

if [ "$TIP_IDLE_MIN" -lt "$RESUME_MIN_IDLE_MINUTES" ] || wt_recently_touched "$WT"; then
  echo "[pull-work] Step 1.6: predecessor LIVE (tip ${TIP_IDLE_MIN}m idle, worktree $WT). Standing down."
  exit 0     # no comment, no state write, no assignee write
fi
```

**The `%ci` trap, stated inline because it is what nearly swallowed #743.** `git log --format=%ci` renders the committer date in the **local offset** (`+0200` on this box), and comparing that string against a UTC "now" reads a branch committed two minutes ago as two hours idle — failing *open*, into exactly the duplicate-session shape this step exists to close. `%ct` is Unix epoch seconds and carries no offset at all, so there is nothing to convert and nothing to get wrong. Never introduce a timezone into this comparison; if you find yourself writing a conversion, you have picked the wrong format specifier.

**One definition of "alive", reused rather than re-minted.** `RESUME_MIN_IDLE_MINUTES` defaults to the reaper's `WORKTREE_MIN_IDLE_MINUTES` (180). Impediment #743's own evidence quotes a 20-minute write window, and 20 would have caught that case — but the reaper already owns the question "is a session still using this worktree", answered conservatively at 180 because deleting a live worktree and resuming a live branch are the same category of unrecoverable, and 180 strictly covers 20. Two thresholds for one question is how they drift apart. **Do not add a second definition**; if 180 is ever wrong, change it where the reaper defines it.

**The asymmetry decides the fail direction: this probe fails CLOSED.** An unreadable signal — `git log` errors, the worktree path cannot be resolved, `find` fails — is read as **live**, matching the reaper's `|| return 0` ("unreadable → assume live"). Standing down costs one hour and the next run retries; resuming a live session costs a full duplicated implementation (#763) plus a mid-batch branch collision. Every other fail-soft in this skill continues on error because the cost of stopping exceeds the cost of proceeding. Here it is the reverse, and the rule inverts with it.

**Stand-down is silent.** Exit clean and write **nothing** — no Linear comment, no state change, no assignee change. The live session is mid-run and owns that ticket; a comment races its own closeout comment, and an assignee write is precisely the failure impediment #755 punished (a lane stripped another session's assignee twice while it was shipping, on an inference about liveness). Log the trace line to the session log and end the run. The predecessor will finish, or it will not and its worktree will age past the threshold, and the next hourly run resumes for real.

**Trace lines** (NFP #2 — exactly one fires):

```
[pull-work] Step 1.6: predecessor dead (tip 214m idle, worktree idle). Continuing to Step 1.7.
[pull-work] Step 1.6: predecessor LIVE (tip 3m idle) — standing down silently, no writes.
[pull-work] Step 1.6: predecessor LIVE (worktree ../wt-x written 4m ago) — standing down silently, no writes.
[pull-work] Step 1.6: liveness probe unreadable — assuming LIVE (fail-closed). Standing down.
```

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `RESUME_MIN_IDLE_MINUTES` | 180 (= the reaper's `WORKTREE_MIN_IDLE_MINUTES`) | Idle window on both reads below which the predecessor counts as alive |
| `RESUME_LIVENESS_FAIL_CLOSED` | `true` | An unreadable probe is read as live, not as dead |

### Step 1.7 — Resume-from-In-Dev — upstream-shipped check

Reached from Step 1.6 once the predecessor is proven dead. Run the upstream-shipped check on the resumed issue before doing any other work (including reading comments or plan doc). **Do not run this step's disposition ahead of Step 1.6** — it unassigns, and unassigning a ticket a live session is still shipping is impediment #755's failure exactly.

```bash
git fetch origin main
git log origin/main --grep="Fixes <resumed-issue-id>" --grep="Closes <resumed-issue-id>" --grep="Resolves <resumed-issue-id>" --regexp-ignore-case --extended-regexp --oneline
```

**If the result is empty:** the work is genuinely still in flight. Continue to Step 1.8 (checkpoint-resume), then Step 5 (Reopened safety check) — skip Steps 2–4 (concurrent-session parallel, coordination block, claim) because the claim already exists.

**If the result is non-empty:** the commit landed but the auto-close did not fire. Apply the disposition in § *The verified-shipped park* above — it is the same one Step 4.4 applies, stated once there. Unassigning frees the WIP=1 slot, so the lane does not park it waiting on a review that never comes (THR-608: Christian doesn't read Linear, so the retired "human reviewer" never closes it).

**Trace lines** (NFP #2):

```
[pull-work] Step 1.7: resume THR-247 — upstream-clean. Continuing to Step 1.8.
[pull-work] Step 1.7: resume THR-247 — upstream-shipped, commit a1b2c3d. Posting comment, unassigning, exit.
```

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log a warning and proceed to Step 5 (resume in flight). The check is best-effort and must not strand a real in-flight issue when the network is unavailable.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `UPSTREAM_GREP_KEYWORDS` | `Fixes\|Closes\|Resolves` | Auto-close keywords accepted by Linear |
| `RESUME_UPSTREAM_FAIL_SOFT` | `true` | If `git fetch` fails, proceed to Step 1.8 rather than refusing resume |

### Step 1.8 — Checkpoint-resume — read prior-run checkpoints before re-reading the plan doc

Reached only on the Step 1.7 upstream-clean path (work still in flight). Before re-reading the plan doc or writing any code, read the latest comments (`list_comments(id, orderBy:"createdAt", limit:5)`) for a **checkpoint comment** left by a prior unfinished run. The `tb-opus-pickup` prompt requires an unfinished pass to post one: what's done, what remains, branch/worktree name, next step.

> **Never quote the close keyword in a checkpoint comment (THR-738).** A checkpoint is explicitly *not* a handoff and must not close the issue — yet a comment saying "`Fixes THR-XX` still rides the final PR" once did exactly that (the merge that later carried the comment's prose swept the issue to Done). Since the workflow is now line-anchored, an in-prose keyword is inert on its own; but the safe habit is unconditional: reference the in-flight issue as a bare `THR-XX` token, with no `Fixes/Closes/Resolves` in front of it, in any checkpoint or non-closing comment.

- **If a checkpoint exists:** continue from it — do not re-implement from scratch. Resume on the named branch/worktree and pick up at the recorded next step, then proceed to Step 5.
- **If `MAX_CHECKPOINTS_BEFORE_SPLIT` (3) or more checkpoint comments exist without a ship:** the issue is churning and needs re-scoping. Post a recommend-split comment naming the seams, then **move it to `Todo` and unassign** — `save_issue(id, state: "Todo", assignee: null)`, verify-after-write per impediment #48, **re-asserting the null once if it comes back** (§ *The verified-shipped park*) — and exit clean. `tb-orchestrator` re-scopes from there (T2), and T1 promotes it back to `Ready for Dev` once the split is authored.

  **`Todo`, not `In Dev` — the destination is the whole point (THR-846).** This line used to read "keep state In Dev … Cowork re-scopes", naming a lane retired 2026-07-21 (THR-654) *and* a state its successor never reads: `tb-orchestrator` scans `Todo` and `Ready for Dev` only and is forbidden from touching `In Dev` at all, while `stale-claim-sweep` keys off **stale claims**, which a deliberate unassigned park is not. THR-838 escalated exactly as instructed at 2026-07-29T00:12Z and then sat ~13 h holding a finished, well-argued split proposal that no lane could see, as the orchestrator promoted other work past it twice. Two grooming runs had already applied this same move by hand (THR-838; THR-778 on 2026-07-28) before it was written down here. The general rule the line is an instance of: **every park must name the lane that reads the destination.**
- **If no checkpoint exists *and* no claim comment from this lane exists:** the ticket is **unclaimed, not resumable** — see below. This is the hand-created-`In Dev` shape, and it is the one case where "resume" is the wrong verb.
- **If no checkpoint exists but a claim comment does:** fall through to Step 5 and re-read the plan doc as normal. A prior run of this lane did claim it; the pass simply ended without checkpointing.

#### `In Dev` + assigned-to-me + no claim comment = unclaimed (impediment #763)

**A ticket can reach `In Dev` without ever passing through the claim step, and the claim step is the mutual-exclusion primitive.** THR-1245 was created directly in `In Dev`, already assigned. Because nothing in the state field records *who* claimed it or *when*, it appeared to two concurrent lanes as "my resumable claim" — and each lane's orientation `gh pr list` sweep ran before the other's PR existed, so neither saw the other. **It was implemented twice, concurrently: two complete PRs three minutes apart**, costing ~1 full session of duplicated implementation plus a `DIRTY` duplicate PR carrying a close keyword for an already-`Done` ticket.

The state field cannot arbitrate this, because it holds no ordering. **Linear's comment ordering can**, so make the claim a comment and read it back:

```
save_comment(issueId: id, body: "Claim asserted by tb-opus-pickup at <ISO-8601 UTC>. This ticket was found In Dev with no prior claim comment (hand-created); asserting the claim so comment order arbitrates. Branch: <branch>.")
list_comments(issueId: id, orderBy: "createdAt", limit: 10)
```

Re-read the thread. **If another lane's claim comment is older than yours, that lane owns it** — stand down silently per Step 1.6 (no state write, no assignee write) and end the run. If yours is the oldest claim comment, proceed to Step 5. Bare `THR-XXX` references only in a claim comment — never a close keyword (THR-738).

**Re-run the PR sweep immediately before opening the PR — the point-of-commitment re-read.** The orientation sweep in Step 1.5 proves nothing about the moment you commit, and #763's whole failure lived in that gap: both sweeps were honest and both were stale. Directly before `gh pr create`, re-ask whether anyone else has opened a PR for this id:

```bash
gh pr list --state open --json number,headRefName,body \
  --jq ".[] | select((.headRefName | test(\"$ISSUE_ID\"; \"i\")) or (.body | test(\"$ISSUE_ID\"; \"i\"))) | \"PR#\(.number)\t\(.headRefName)\""
```

A hit that is not your own branch means someone shipped this while you built it: **do not open a second PR.** Post a comment naming their PR number, leave your branch unpushed or pushed-but-unarmed, and exit clean. This is the same rule THR-1283 wrote for assignee writes — re-read at the point of commitment, because an exclusivity assumption is only worth the instant it was checked — applied to the other write that assumes exclusivity.

**Constant:**

| Constant | Default | Purpose |
|---|---|---|
| `MAX_CHECKPOINTS_BEFORE_SPLIT` | 3 | Checkpoint comments without a ship that trigger the recommend-split escalation |

**Trace lines** (NFP #2 — exactly one fires):

```
[pull-work] Step 1.8: checkpoint found (branch pickup/thr-247, next: wire phase). Resuming from checkpoint.
[pull-work] Step 1.8: no checkpoint, claim comment present — falling through to Step 5 plan-doc re-read.
[pull-work] Step 1.8: no checkpoint, no claim comment — hand-created In Dev. Asserting claim comment, re-reading thread.
[pull-work] Step 1.8: claim comment re-read — another lane claimed at <ts>, earlier than mine. Standing down silently.
[pull-work] Step 1.8: 3 checkpoints without ship — recommend-split, moved to Todo + unassigned for tb-orchestrator re-scope, exit.
```

**Fail-soft:** if `list_comments` errors, log a warning and fall through to Step 5 (re-read the plan doc). A comment-read failure must not strand a genuinely in-flight issue.

### Step 2 - Concurrent-session parallel check

Only relevant when another CC session (an interactive session, or a second worktree) already holds an In Dev issue and you are considering running this one alongside it.

1. From the Step 1 board scan's "In Dev" slice, detect any other active CC work.
2. If another issue is active, verify the candidate appears in that issue's `Parallel-safe with` line.
3. Confirm the candidate does not collide with that issue's `Mutex with` line.

If collision or uncertainty remains, run serially instead of claiming concurrently. (The hourly automation is WIP=1 per Step 1.5; this check matters only for hand-driven multi-worktree work.)

### Step 3 - Validate coordination block on latest comment

**The block is required of a *handoff*, not of every ticket (THR-836).** A design session or a T1 promotion coordinates work that a *different* party will pick up, and the three lines — `Suggested model`, `Parallel-safe with`, `Mutex with` — are that coordination made legible. A ticket the lane filed for itself, naming the file and symbol it means to change, was never coordinated by a second party; demanding the artifact of coordination from it is a category error. Applied without that distinction the gate produced one of two outcomes on nearly every candidate — a lost run, or a per-pickup ritual reversal. THR-836's evidence: THR-834 and THR-817 sat zero-comment; THR-804 was claimed past the gate by hand, spending a full comment on the reasoning; THR-778 bounced outright and was re-offered as top candidate on the very next run, hourly.

1. Read the latest comment on the candidate issue.
2. If it carries all three lines, proceed to Step 4.
3. If any line is missing, **classify the ticket before deciding** — the missing block is a symptom, not the verdict:
   - **Self-scoped** — the description names a concrete surface: a repo-relative path (`src/…`, `scripts/…`, `Docs/…`, `.claude/…`) or a backticked file/symbol. **Claim it.** Derive the three lines yourself from the surfaces the description names, and post them in the claim comment under the heading `Coordination block (derived at claim — no handoff author)`. This is the documented path, not an improvisation to be re-argued each pickup.
   - **Unscoped** — no named surface anywhere in the description. **Bounce without claiming**, naming what is missing — then **move it to `Todo`** and continue to the next candidate in the same run.

**A bounce must remove the ticket from the queue, or it is not a bounce (THR-836).** Leaving a refused issue in `Ready for Dev` re-offers it as top candidate on the next run, and the hour after that, forever: THR-778 was bounced at 05:03 and re-offered at 06:03, and only stopped because a human-shaped grooming pass moved it to `Todo` by hand. A gate that refuses without routing is a spin loop wearing a gate's clothes. So a bounce is three actions, not one:

```
save_comment(issueId: id, body: "Bounced by pull-work Step 3: unscoped — the description names no file or symbol, so no coordination block can be derived. Moving to Todo for re-authoring. Add the surface this touches and the three coordination lines, then promote.")
save_issue(id, state: "Todo")
get_issue(id)   # verify the move stuck (impediment #48)
```

Then **carry on to the next candidate** — a bounce costs a candidate, not a run. Only an empty queue ends the run.

`npm run check:process` encodes exactly this split, so the rule and the lint cannot drift apart silently: a Ready-for-Dev issue missing the block reports `handoff-keywords` at `error` when unscoped and at `warn` when self-scoped (`SELF_SCOPED_SURFACE_PATTERN` in `scripts/check-process.ts` is the shared predicate).

**Deriving a block is not skipping the thinking.** Read the surfaces the description names, check them against the Step 1 "In Dev" slice for a genuine collision, and write `Mutex with: none — <surface> untouched by the In Dev slice` when there is none. A derived block that asserts `none` without having looked is worth less than the bounce it replaced.

**Mutex reversal (THR-688 Rule B).** A `Mutex with` line should carry its reason — `Mutex with: THR-XXX (both edit <file>)`. You **may** claim past a mutex when the stated reason is *verifiably* inapplicable: the named partner issue has since merged, or the named surface is provably outside this ticket's scope. Verify it (`get_issue` on the partner; confirm `Done` + a merged PR), then record the reversal and its evidence in a Linear comment on the issue you claim. A mutex whose reason is a bare identifier with no stated surface cannot be cleared by inspection — bounce it for re-authoring rather than guessing (THR-673 precedent).

**Mutex-partner liveness — always read the partner's state before honouring a mutex (THR-908, impediment #224 ×3).** The reversal rule above asks one question ("has the partner *merged*?") and treats every other answer as "wait". But a mutex is a reason to wait only while the partner is actually *moving*, and one state breaks that premise silently: a partner parked in `Todo` is not moving, because nothing promotes it while the mutex holder occupies the top of the queue. The pair deadlocks, and the top queue item is re-offered unpickable every hour — from inside the queue this is indistinguishable from a healthy wait, which is why it took three occurrences to name.

So spend one `get_issue` on the partner and branch on its state — never on the mutex line alone:

| Partner state | Verdict | Action |
|---|---|---|
| `Done` (merged PR confirmed) | Reason inapplicable | Claim past it; record the reversal per THR-688 Rule B above |
| `In Dev` **with an assignee** / `Ready for Dev` | Genuinely live and moving | Honour the mutex — route the candidate to `Todo` per the paragraph below, then continue to the next candidate |
| `In Dev` with `assignee: null` (with or without `Parked`) | **Deadlock, not a queue** — this is a *park* | Resolve per the park paragraph below — do not bounce on this alone |
| `Todo` / `Backlog` | **Deadlock, not a queue** | Resolve per the paragraph below — do not bounce on this alone |

**The park row is the same lesson this table already learned once (THR-1283, impediment #752).** A partner in `In Dev` with no assignee is **not being built** — it is a deliberate park awaiting a human, which is the `Todo`/`Backlog` deadlock row in substance while wearing the `In Dev` state. Nothing promotes it and nothing will, because the only thing that clears it is Christian, and no lane can write `Done`. Read it as live and the pair deadlocks exactly as the `Todo` row does. Measured 2026-08-25: `Ready for Dev` held exactly one issue (THR-1224), `blockedBy` THR-1223 which was parked pending a director ruling; this table routed the candidate to `Todo` and the run would have ended with nothing shipped, saved only because the executor reversed the mutex by hand against the file system.

On a parked partner, prefer a **scoped reversal or a split** over an all-or-nothing bounce, and note that **a reversal may be partial**: a mutex can bind some of the candidate's scope items and not others. When only part of the candidate collides with the parked partner's surfaces, split the candidate — ship the uncontended part now, file the contended part as its own ticket **with its own coordination block** naming the park as its blocker. Record the reversal and the seam in a comment per THR-688 Rule B. Bouncing the whole candidate because one of its five surfaces touches a park spends the run's only slot to protect a collision that was never going to happen.

**A `Parked`-labelled issue found in `Ready for Dev` is restored, not claimed and not bounced (THR-1283).** It is there by accident: until this ticket the stale-claim sweep's release path never re-read the label, so a park that took the sweep's own documented opt-out was released to the queue anyway — four times in four days. Restore the park shape rather than treating queue membership as intent:

```
save_issue(id, state: "In Dev", assignee: null, priority: <its current value>)
get_issue(id)   # verify BOTH keys landed
```

The bundled field matters — a sole-field `assignee: null` can silently no-op on an issue that has carried its assignee a while (impediment #380). Then comment why, and continue to the next candidate. Do **not** claim it: the park exists because the ticket's next action needs Christian, and claiming it burns the run's slot on work whose gate you cannot satisfy.

**Before any `assignee` write on someone else's ticket, re-run the PR liveness check (THR-1283, impediment #755).** A parked-*looking* ticket has two explanations — a decayed park, or someone shipping right now — and both must be tested before writing. Run `gh pr list --state open --json number,headRefName,body` and look for a branch matching `*<issue-id>*` **or** the id anywhere in a PR body. **Treat `attachments: []` from `get_issue` as *no evidence*, never as evidence of no PR** — Linear's PR attachment can lag the PR by minutes. A lane that quoted an empty `attachments` array as proof against a live PR stripped another session's assignee twice while it was shipping, then published a false finding to `main` (PR #1609): ~15 min plus a retracted finding.

**Honouring a mutex is a bounce, and a bounce removes the candidate from the queue (impediment #551 ×2).** The row above used to read "serialize, bounce, continue" without saying where the *candidate* goes, and the natural release back to `Ready for Dev` re-offers it as the top pickup candidate every hour: THR-1096 was claimed, mutex-verified against THR-1082's held PR, and released on 2026-08-12 — then re-claimed and re-verified to the identical verdict on 08-13, ~4 min per run with no path to progress, consuming the run's product-work slot each time. Instead: confirm the candidate carries a `blockedBy` relation on the mutex partner (`get_issue` with `includeRelations: true`; add it with `save_issue(id, blockedBy: [partnerId])` if missing), then `save_issue(id, state: "Todo")`, verify-after-write, and comment naming the partner and what clears it. `Todo` is routed, not stranded: `tb-orchestrator` T1 reads exactly that relation and promotes the ticket back to `Ready for Dev` when the partner clears — the THR-846 rule that every park must name the lane that reads the destination.

On a `Todo`/`Backlog` partner, check whether the partner's *own* blocker has shipped — `git log origin/main --grep="Fixes THR-YYY" --regexp-ignore-case --extended-regexp --oneline`, or `get_issue` on the blocker:

- **Blocker shipped** → the partner is promotable and only nobody's attention was missing. `save_issue(partnerId, state:"Ready for Dev")`, verify-after-write, and record the evidence (blocker id + merge SHA) in a comment on the partner. Then continue with the candidate rather than bouncing it — bouncing a candidate for a partner nobody was going to promote is the deadlock, not a defence against it.
- **Blocker genuinely unshipped** → bounce the candidate as usual, but name the blocker the *pair* is waiting on in the bounce comment. A wait someone can read is recoverable; an unattributed one is what produced the three occurrences.

Per THR-688 Rule B this whole branch is a **technical verdict** — a merge either happened or it did not — so it is the executor's to make, not a coordination decision to escalate. Note the promotion writes `Ready for Dev` on the *partner*, never on the candidate you are claiming, and never `Done` (Rule 3 forbids CC closing).

**UI-pillar tickets carry the UI Laws implicitly (THR-1007, ratified 2026-08-06).** If the ticket touches the UI pillar, load the `frontend-ui` skill before writing code — it binds `Docs/design-system/laws.md`, and the Laws are part of the Done-when whether or not the ticket restates them. Browser-verify is a judgment against the Laws on the composed surface, with law numbers cited in the evidence, not only a screenshot.

**Done-when reachability (THR-688 Rule C).** Before starting work, check that the ticket's Done-when is satisfiable through the pillar it touches. Browser evidence is required for UI-pillar surfaces only; engine/content acceptance runs through `npm run cli` / `__DEBUG` sweeps. If a Done-when demands N ticks in an automated browser tab, it is unreachable by construction (`document.hidden` throttles the rAF loop to 1 tick/click) until THR-689 lands — substitute a headless CLI sweep and say so in the completion comment.

### Step 4 - Claim before deep read, then verify

> **Preferred:** use `pullNextReadyForDev` (§ above) — it bundles Steps 1–4 with retry-on-silent-drop. This step-by-step is the documented fallback.

1. First mutating call: `save_issue(id, assignee:"me", state:"In Dev")`.
2. Immediately call `get_issue(id)` and verify both `assignee` and `state` stuck.
3. On mismatch: release claim (`save_issue(id, assignee:null)`), move to the next candidate, retry up to `MAX_CLAIM_RETRIES = 3` total attempts.
4. On all retries exhausted: refuse to proceed, surface the write failure, log impediment.

Rationale: impediment #48 documents silent state-write drops; verify-after-write is mandatory.

### Step 4.4 — Upstream-shipped check (Rule 9)

After the claim is verified (Step 4) and before worktree isolation (Step 4.5), run:

```bash
git fetch origin main
git log origin/main --grep="Fixes <issue-id>" --grep="Closes <issue-id>" --grep="Resolves <issue-id>" --regexp-ignore-case --extended-regexp --oneline
```

If the result is non-empty, the work has already landed. Do not proceed. Apply the disposition in § *The verified-shipped park* above — it is the same one Step 1.7 applies, stated once there. In particular the claim is **not** released back to `Ready for Dev`: the state stays `In Dev` with the assignee cleared, because a completed ticket returned to the queue is re-claimed and re-investigated every hour forever (THR-958).

**Also grep the parent's id when the ticket is a split-out child (impediment #310).** This grep only ever asks about *this* issue's id, so a child ticket whose scope is then executed under the **parent's** id is invisible to it by construction — the check reads clean and is correct to. THR-680 was split out of THR-674 at 07:12Z on 2026-07-21; a later session finished exactly its scope at 13:12Z the same day and closed it with `Fixes THR-674`, and THR-680 sat in `Todo` for 9 days before being promoted and picked up as live work. If the issue body contains a "Split from THR-XXX" (or "Split out of", "Parent:") reference, run the same grep for that id, and read the parent's state — a parent already in `Done` is itself the signal:

```bash
git log origin/main --grep="Fixes ${parent_id}" --grep="Closes ${parent_id}" --grep="Resolves ${parent_id}" --regexp-ignore-case --extended-regexp --oneline
```

A hit here is **not** automatically a stand-down — the parent may have shipped only its own scope. Read the parent's closing commit body and any disposal/verdict doc it names, confirm it covers *this* ticket's Done-when, and only then release with a comment pointing at the evidence. Note also that this class can masquerade as data loss: THR-680's body warned that "26 entries were never inspected", and `git fsck --unreachable` shows hundreds of unreachable stash-shaped commits that are simply ordinary `git stash pop` residue. Check the parent grep **before** starting any forensic recovery hunt.

**Trace lines** (NFP #2):

```
[pull-work] Step 4.4: upstream-clean. Continuing to worktree isolation.
[pull-work] Step 4.4: upstream-shipped — commit a1b2c3d "feat(thr-247): ..." on origin/main. Unassigning, state stays In Dev, exit.
```

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log the error and proceed to Step 4.5 anyway. The upstream-shipped check is best-effort — a fetch failure must not block pickup of genuinely open work. Surface a one-line warning in the session log.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `FRESH_CLAIM_UPSTREAM_FAIL_SOFT` | `true` | If `git fetch` fails, proceed to Step 4.5 rather than blocking pickup |

### Step 4.5 — Worktree isolation when home is dirty

After the claim is verified (Step 4) and before any plan-doc read or implementation, gate
on `git status --porcelain` of the home worktree. If non-empty, isolate the rest of the
session in a fresh worktree rooted at `origin/main`. If empty, continue in place.

**Constants:** `WORKTREE_DIR_PREFIX="../tfws-pickup-"`, `WORKTREE_BRANCH_PREFIX="pickup/"`,
`WORKTREE_BASE="origin/main"`, `MAX_WORKTREE_RETRIES=1`.

```bash
cd "$REPO_ROOT"
if [ -n "$(git status --porcelain)" ]; then
  ISSUE_ID_LC=$(echo "$ISSUE_ID" | tr '[:upper:]' '[:lower:]')
  WORKTREE_DIR="${WORKTREE_DIR_PREFIX}${ISSUE_ID_LC}"
  WORKTREE_BRANCH="${WORKTREE_BRANCH_PREFIX}${ISSUE_ID_LC}"
  git fetch origin main
  if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$WORKTREE_BASE" 2>/dev/null; then
    WORKTREE_DIR="${WORKTREE_DIR}-2"
    WORKTREE_BRANCH="${WORKTREE_BRANCH}-2"
    if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$WORKTREE_BASE"; then
      echo "[pull-work] Step 4.5: worktree add failed twice. Releasing claim."
      # release claim via Linear MCP (save_issue id assignee:null) and exit
      exit 1
    fi
  fi
  cd "$WORKTREE_DIR"
  npm install
  echo "[pull-work] Step 4.5: home dirty. Isolated to $WORKTREE_DIR on origin/main."
else
  echo "[pull-work] Step 4.5: home clean. Continuing in-place."
fi
```

All subsequent steps run from `$WORKTREE_DIR` if isolation engaged, else from
`$REPO_ROOT`. The closing commit, push, and merge-keyword auto-close all happen
in the same location.

**Write-path discipline (mandatory whenever the session is in a worktree).** Echo the
session root once, and treat it as the required prefix for every `Edit`/`Write`
`file_path` for the rest of the session:

```bash
echo "[pull-work] Step 4.5: session write-root is $(git rev-parse --show-toplevel)"
```

A bare repo-root absolute path (`C:\...\TheFantasyWorldSimulator\src\...`) from a
worktree session lands in the **home** tree and **succeeds** — the two trees are
byte-identical at branch time, so `old_string` matches, the tool reports success,
and nothing surfaces until verification runs against unedited code. This fired in
4 of 12 hourly runs on 2026-07-20/21 (impediments #387, #417, #421). `Read` is
unaffected and may use either path.

The `worktree-write-guard.sh` PreToolUse hook (registered in `.claude/settings.json`)
now rejects this mechanically and prints the corrected path, so a slip costs one
blocked call rather than a wasted verification cycle. The hook gates on **CWD**, not
on the target alone — home-tree sessions are never blocked. Treat it as a backstop,
not a licence to stop prefixing paths: it only covers `Edit`/`Write`, so `Bash`
redirects and `cp` into the home tree remain your responsibility.

**Trace lines** (one of three appears per session, NFP #2):

```
[pull-work] Step 4.5: home clean. Continuing in-place.
[pull-work] Step 4.5: home dirty. Isolated to ../tfws-pickup-thr-XXX on origin/main.
[pull-work] Step 4.5: worktree add failed twice. Releasing claim.
```

**Failure recovery.** On `git worktree add` failure, retry once with a `-2` suffix on
both the path and branch name (handles a stale worktree from a prior aborted run).
On second failure, release the claim with `save_issue(id, assignee:null)` and exit
cleanly. Surfaced as a worktree-creation failure rather than a dirty-state failure.

### Step 4.6 — Stranded-commit zombie sweep

After worktree isolation (Step 4.5) and before any plan-doc read or implementation, detect local-only commits sitting ahead of `origin/main` whose content is already on `origin/main` under a different SHA ("zombie commits"). These arise when a closeout PR merges under a squash/rebase SHA, leaving the original local branch commit alive in a reused pool worktree. Step 4.5's `git status --porcelain` predicate does **not** see committed-but-unmerged state — this sweep fills that gap.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `ZOMBIE_DETECTION_BASE` | `origin/main` | Branch to compare stranded commits against |
| `ZOMBIE_MAX_AGE_DAYS` | 14 | Bounds the `git log --since` window for Condition A; older zombies still classify via Condition B |
| `MAX_STRANDED_COMMITS_TO_INSPECT` | 20 | Safety cap; >20 stranded commits triggers fail-fast instead of inspect |
| `ZOMBIE_EXIT_CODE_FAIL_FAST` | 1 | Exit code when real WIP is detected |
| `ZOMBIE_EXIT_CODE_NO_OP` | 0 | Exit code when sweep no-ops or auto-resets |

**Algorithm:**

```bash
# Step 4.6 — Stranded-commit zombie sweep
git fetch origin main --quiet || {
  echo "[pull-work] Step 4.6: git fetch failed. Skipping sweep (fail-soft)."
  return 0  # log impediment via impediment-reporter, continue
}

STRANDED=$(git rev-list "origin/main..HEAD" 2>/dev/null || true)
if [ -z "$STRANDED" ]; then
  echo "[pull-work] Step 4.6: no stranded commits — continuing."
  return 0
fi

STRANDED_COUNT=$(echo "$STRANDED" | wc -l)
if [ "$STRANDED_COUNT" -gt 20 ]; then  # MAX_STRANDED_COMMITS_TO_INSPECT
  echo "[pull-work] Step 4.6: $STRANDED_COUNT stranded commits exceeds cap. Fail-fast."
  # release_linear_claim; exit 1
fi

ZOMBIES=0; NON_ZOMBIES=0; ZOMBIE_SHAS=(); NON_ZOMBIE_SHAS=()

for sha in $STRANDED; do
  if is_zombie "$sha"; then
    ZOMBIE_SHAS+=("$sha"); ZOMBIES=$((ZOMBIES+1))
  else
    NON_ZOMBIE_SHAS+=("$sha"); NON_ZOMBIES=$((NON_ZOMBIES+1))
  fi
done

if [ "$NON_ZOMBIES" -gt 0 ]; then
  echo "[pull-work] Step 4.6: $ZOMBIES zombies + $NON_ZOMBIES real WIP commits."
  echo "  Real WIP SHAs: ${NON_ZOMBIE_SHAS[*]}"
  echo "  Fail-fast — releasing claim and exiting. Run 'git log origin/main..HEAD' to inspect."
  # release_linear_claim; exit 1
fi

# All stranded commits are zombies — safe to reset
echo "[pull-work] Step 4.6: all $ZOMBIES stranded commits are zombies. Resetting to origin/main."
echo "  Zombie SHAs: ${ZOMBIE_SHAS[*]}"
git reset --hard origin/main
```

**`is_zombie <sha>` — classification heuristic.** Returns true if **either** condition holds:

**Condition A — Fixes-keyword match on main.** Extract the first `(Fixes|Closes|Resolves) THR-\d+` token from the stranded commit's full message body (`git log --format="%B" -1 <sha>`). If found, search `git log origin/main --grep="<token>" --since="14 days ago" --oneline | head -1`. A match means the issue is already closed on `main` → zombie.

**Condition B — Content match against main tip.** For each path in `git show --name-only --format= <sha>`, run `git diff --quiet <sha> origin/main -- <file>` for each changed file. If every changed file matches `origin/main`, the commit's payload is already there → zombie.

Either condition is sufficient to classify a commit as zombie. Both conditions must answer "no" for the commit to be treated as real WIP.

**Fail-soft table:**

| Failure mode | Behavior |
|---|---|
| `git fetch origin main` fails (network, auth) | Skip sweep; log impediment; continue |
| `git rev-list` returns non-zero | Skip sweep; log warning; continue |
| `is_zombie` errors on a single SHA | Treat as non-zombie (fail-safe: surface for human review) |
| Stranded count > `MAX_STRANDED_COMMITS_TO_INSPECT` | Fail-fast; release claim; exit 1 |
| Sweep would reset away an uncommitted working-tree edit | Cannot happen — Step 4.5 already isolated dirty trees |

**Trace lines** (NFP #2 — exactly one fires per session):

```
[pull-work] Step 4.6: no stranded commits — continuing.
[pull-work] Step 4.6: all <N> stranded commits are zombies. Resetting to origin/main.
  Zombie SHAs: <sha1> <sha2> ...
[pull-work] Step 4.6: <Z> zombies + <W> real WIP commits.
  Real WIP SHAs: <sha1> ...
  Fail-fast — releasing claim and exiting.
[pull-work] Step 4.6: <N> stranded commits exceeds cap. Fail-fast.
[pull-work] Step 4.6: git fetch failed. Skipping sweep (fail-soft).
```

**Interaction with adjacent steps.** Step 4.4 verifies the *currently-claimed* issue isn't already shipped on `main`. Step 4.6 handles *prior* issues' zombie commits surviving in a reused pool worktree — an orthogonal concern. Order: Step 4.4 → Step 4.5 → **Step 4.6** → Step 5. The sweep runs even in a fresh isolation worktree (cheap no-op there; the real work happens in the in-place case when Step 4.5 continued in-place because the home tree was working-tree-clean).

---

### Step 5 - Reopened safety check

If the issue has label `Reopened`, read all comments back to the original handoff before making implementation decisions.

**The label is not the only trigger (impediment #434).** On any ticket carrying more than one comment, skim every comment's first line before implementing — not only the latest. A scope correction filed by a sibling ticket's implementation never reopens anything; it just sits under whatever was written later. THR-723's promotion comment called it a "clean, scoped technical fix" while its *first* comment recorded that the module in question had zero production importers and the real question was a user-facing design call. `list_comments(limit:10)` already returns the bodies, so the extra cost is reading them, not fetching them. When a correction and the promotion disagree, the correction is usually the one that inspected the code — split the design half out rather than implementing it on executor authority.

### Step 6 - Load plan doc

1. Extract plan-doc path from the issue description **and** the handoff comment — the two-place rule writes it to both so neither is a single point of failure, and a later checkpoint comment can push the original handoff out of view (the single-surface defect THR-895 found in `check:process`).
2. If absent, search `Docs/plans/` for a likely match by issue/topic.
3. Read the plan doc before touching code.

**On a 404, diagnose before bouncing (THR-921).** A named plan doc missing from your worktree is usually not a wrong path — it is a doc still sitting on an unmerged `docs/plan-*` PR, because every worktree is cut from `origin/main`. This happened twice in the week of 2026-07-30 (impediments #321 / THR-884, #325 / THR-887), and in THR-887's case the Done-when *itself* named a wiki page on that PR, so the ticket was unsatisfiable by construction from the natural branch point. One command tells you which case you are in:

```bash
npm run check:plan-doc-liveness -- Docs/plans/<the-named-doc>.md
```

| Verdict | What it means | What to do |
|---|---|---|
| `LIVE` | Resolves on `origin/main` | You read the wrong path — re-check the name |
| `STRANDED` | Carried by an open PR, named in the output | Report *"plan doc stranded on unmerged PR #N"*. If that PR is green it merges in minutes, so prefer a checkpoint comment and let the next hourly run resume, over bouncing a ready ticket |
| `MISSING` | On no branch at all | The promotion was premature. Bounce per Step 3 (comment, `state:"Todo"`, verify) and name the path that does not exist |
| `UNRESOLVED` | `gh` unavailable, scan did not run | Do not treat as missing — say the scan could not run, and continue on the issue body if it is sufficient |

Never report a bare "plan doc not found": that reads as a bad reference and sends the next session hunting a typo, when the actual fix is to merge a PR that is already open.

### Step 7 - Surface model suggestion (advisory)

1. Read the `model:*` label and `Suggested model:` line from the handoff block.
2. They are advisory only — the scheduled CC automation always runs Opus, and the label does not gate pickup. Treat the suggestion as a signal of the work type the filing lane (`tb-orchestrator` T1/T2, a design session, or the executor's own deferral) sized the issue for.
3. An interactive session started by the user may run any model — the user's judgment supersedes the suggestion.

## Refuses To Proceed When

- The "In Dev" slice for the executor's own assignee (computed in Step 1) is non-empty (Rule 6: WIP=1 across all sessions).
- The latest handoff comment is missing a required coordination line (`Suggested model`, `Parallel-safe with`, `Mutex with`) **and** the description names no concrete surface — an unscoped ticket (Step 3). A *self-scoped* ticket missing the block is claimed, not refused: the executor derives the block (THR-836).
- `save_issue` claim cannot be verified by `get_issue` after one retry.
- The upstream-shipped check (Step 4.4 fresh-claim or Step 1.7 resume) finds a `Fixes <issue-id>` / `Closes <issue-id>` / `Resolves <issue-id>` commit on `origin/main`. Pickup exits with a comment noting the upstream commit hash. **Both paths apply the same disposition** — unassign, state stays `In Dev` — per § *The verified-shipped park*, where `keep-work-flowing-cc` picks the park up in its In-Dev scan and surfaces it to Christian to close (THR-846 — no CC lane may write `Done`).

## Output Contract

On success: issue is claimed (`In Dev`, assigned to `me`), plan doc loaded, and pickup context is ready for implementation.

On refusal: leave the issue unclaimed when possible, post a concise bounce note, and stop.

## Closeout — home-tree cleanliness gate (run before `git commit`)

**Mandatory whenever the session is in a worktree.** Before the closing commit, prove
the session left no writes in the home tree:

```bash
HOME_TREE="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
if [ "$HOME_TREE" != "$(git rev-parse --show-toplevel)" ]; then
  git -C "$HOME_TREE" status --porcelain
fi
```

Expected output is **empty**, or only pre-existing debris you can name and did not
author this session. Any session-authored path is the two-tree edit-path trap: the
edit landed on `main` in a tree that is supposed to be an inert mirror (THR-672), and
your verification ran against unedited code.

**Recovery — patch-and-relocate** (full form in `Docs/impediments.md` #417/#387):

```bash
git -C "$HOME_TREE" diff -- <files> > /tmp/relocate.patch
git -C "$HOME_TREE" checkout -- <files>      # restore main
git apply /tmp/relocate.patch                # replay into the worktree
```

Copy any *new* files across and `rm` them from the home tree — `checkout --` does not
remove untracked additions. Then **re-run the verification gates**, because the
previous run tested the wrong tree.

**Trace line** (exactly one, NFP #2):

```
[pull-work] closeout: home tree clean — no session-authored paths.
[pull-work] closeout: home tree dirty (<N> session-authored paths). Patch-and-relocate before commit.
[pull-work] closeout: session is in the home tree — check N/A.
```

**Fail-soft:** if the `git -C` probe errors, log one warning and continue to the commit.
A broken probe must not block a ship — the PreToolUse guard is the primary defence and
this gate is the audit.

## Closeout — ship with auto-merge, don't poll CI

**Standard closeout is `gh pr merge --auto --merge`.** GitHub holds the merge until the required `Test · Typecheck · Build` check goes green, then merges without a session present. Do not sit in a poll loop waiting on CI — that burned 3–8 minutes of session wall-clock per ship for no added safety (THR-675).

**Re-run the duplicate-PR sweep immediately before `gh pr create` — every ship, not only the hand-created-`In Dev` path (impediment #763).** The orientation sweep at Step 1.5 was honest when it ran and says nothing about now; a concurrent lane's PR can appear in the gap between the two. The command and the disposition are in Step 1.8 § *point-of-commitment re-read*. A hit that is not your own branch means the work already shipped: comment their PR number and exit clean rather than opening a second PR for the same id.

```bash
gh pr create --title "<type>(thr-XXX): <summary>" --body "$(printf 'Summary line.\n\nFixes THR-XXX\n')"
gh pr merge --auto --merge
```

The gate is unchanged: branch protection stays on, the required check still has to pass, and a red check simply means the PR never merges. Auto-merge removes the *waiting*, not the *gate* — this is the H6 verdict from `Docs/plans/2026-07-20-git-cicd-clean-delivery.md`, which kept the PR gate precisely because it caught a phantom 3,379-line reversal before it reached `main`.

**No merge queue exists and none is coming (THR-983).** THR-946 pursued one as the fix for the `BEHIND` livelock; it is **unavailable on a personal-account repo**, so THR-735's fallback shipped instead — **strict mode was dropped on 2026-08-02**. `gh pr merge --auto --merge` merges directly on green, as it always did, and now succeeds regardless of whether the branch is up to date. **`BEHIND` no longer occurs as a blocking state**, so `gh pr update-branch` is not part of any closeout. `DIRTY` is unaffected and still yours to resolve.

`Fixes THR-XXX` must still appear in **both** the commit body and the PR body — on a non-squash merge the merge commit drops the commit body and Linear's auto-close misses it (impediment #140). `--merge` (not `--squash`) keeps the feature commit's body in history.

**The keyword must stand ALONE on its own line (THR-738).** `linear-autoclose.yml` is line-anchored: it closes only when a full line reads exactly `Fixes|Closes|Resolves THR-XXX`. The keyword inside a prose sentence (`Fixes THR-74 still rides the final PR`), a markdown bullet, or the PR *title* does **not** close. **Corollary for checkpoint and any non-closing comment:** never write `Fixes/Closes/Resolves` in front of an issue id you are *not* closing — reference it as a bare `THR-XXX` token. The phantom-Done recurrences (THR-74 ×2 on 2026-07-24) were prose that quoted the keyword to *document* the discipline. Vectors 2/3 (branch name, bare title token) come from Linear's native integration and are killed by the Christian-owned settings change in `Design/user-actions.md`, not by this workflow.

**After arming, run one freshness check — `gh pr view <N> --json mergeStateStatus`.** It is looking for **`DIRTY`** only: a conflict that arrived while the session ran, which auto-merge cannot clear and which is yours to resolve now (see the conflicted-PR closeout below). **`BEHIND` is no longer actionable** since strict mode was dropped (THR-983) — a green PR merges from behind, so do not run `gh pr update-branch`. If it reads `UNKNOWN`, re-query 2–3 times a few seconds apart (GitHub computes mergeability lazily — the first read only schedules it). This is one query, not a poll loop; a PR missed here is caught by the Step 0.8 sweep next hour.

**Read the check rollup once after arming, and never accept `SKIPPED` on the required check (THR-768).** This is the single step that sits between finished work and an unguarded `main`, and it is one `gh` call:

```bash
gh pr view <N> --json statusCheckRollup --jq '[.statusCheckRollup[] | select(.name == "Test · Typecheck · Build")] | .[0].conclusion'
```

`SUCCESS` is the only acceptable answer. `SKIPPED` means the required check never inspected the change — during an Actions outage that is *exactly* what a vacuous gate looks like, and it satisfies branch protection anyway. On `SKIPPED`, do not merge: leave the PR open, post a checkpoint comment, and exit clean; the next hourly run resumes it once the gate is real again. (A genuinely docs-only PR also reports `SKIPPED` by design — that case is legitimate, so confirm the diff really is docs-only before treating a skip as benign.)

**After queuing auto-merge, the session's shipping work is done.** Proceed to the worktree cleanup below and exit; do not block on the merge landing. If the check later fails, the PR stays open and the issue stays In Dev — the next hourly run resumes it via the Step 1.7 upstream-shipped check, which will find no `Fixes` commit on `main` and correctly treat the work as still in flight.

## Closeout — resolving a conflicted closeout-docs PR

Every ship appends rows to the same table heads (`Docs/changelog.md`, `Docs/project-history.md`, `Docs/impediments.md`), so a PR that idles — human-gated ones idle **by design** — reliably goes `CONFLICTING` in those files alone, with zero code conflicts. THR-668's PR sat ~31 h and rotted this way; a whole run was burned hand-resolving table rows.

`.gitattributes` marks those three files `merge=union`, which makes **local** merges of that shape resolve automatically, keeping both rows.

**GitHub does not honor it.** Measured 2026-07-21 (THR-691) with the attribute present on the base branch: the merges API returned `409 Merge conflict`, and a PR of the same shape read `mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`. Union is a built-in driver, but GitHub's server-side merge does not consult `.gitattributes`. So the web "Resolve conflicts" button and auto-merge stay unable to settle these — **resolve locally and push**:

```bash
git fetch origin main
git merge origin/main        # union auto-resolves the three closeout docs
git push
```

The merge prints `Auto-merging Docs/changelog.md` and exits 0 with both sides' rows present and the table header intact. Auto-merge then proceeds normally once the PR is no longer conflicting.

**Check the result before pushing** — union keeps *both* sides of every conflicting hunk, which is right for appended rows and wrong for an edited one. If the same row was modified on both branches you get it twice, so skim `git diff origin/main -- Docs/` for duplicates rather than trusting the clean exit.

**For `Docs/impediments.md`, do not hand-classify the duplicates — repair them (THR-1018):**

```bash
npm run check:impediment-ids -- --fix
npm run generate-impediment-dashboard
```

Union preserves both lanes' independently-chosen row *numbers*, so a merge touching the log reliably lands duplicate ids that `check:impediment-ids` then rejects — and the two collisions need two *different* remedies. Measured on the 2026-08-07 run that resolved three stuck PRs: `#451` was the same impediment logged on both sides (dedupe) and `#452` was two different impediments sharing an id (renumber), each re-derived by hand. `--fix` classifies and applies both, echoes every row it removes verbatim, and lists the `#N` cross-references a renumber may have made ambiguous. It is biased toward renumbering, because deleting a distinct impediment is unrecoverable while a duplicate row under a fresh number is merely visible.

**Read the renumber list before pushing.** The id stays on the row already published on `origin/main` — not the row that happens to be first after the merge, which is a merge-order artifact (impediment #460 rule 1; the gate's older printed advice said "first in the file" and following it on PR #1327 had to be reversed). If a cited reference meant the row that *moved*, only you can tell. Rule 2 — allocating an id against a tree that cannot see `main`'s unmerged rows — was closed by THR-1028: `npm run impediment:next-id` mints the number against every local and remote ref, and the reporter skill now requires it. Two branches *repairing* concurrently can still land on the same next-free id, because `--fix` runs after both rows already exist; if another closeout PR is open against the log, check its numbers too.

### `Docs/project-status.md` — regenerate, never resolve (THR-1016)

**There is no longer anything to hand-resolve here, and the regeneration step above is not optional.** Until THR-1016 this file was hand-edited and every closeout wrote it at the same two anchors — an insert at the top of `## Current Focus` and a delete at the tail to hold the 60-line cap — so **any two open closeout PRs conflicted by construction**, whatever either one contained, and `gh pr update-branch` could not help. Measured 2026-08-07: PRs #1322, #1326 and #1327 all sat `DIRTY` for 17, 18 and 20 hours conflicting *only* in closeout docs, `check:armed-prs` reporting `abandoned` / `needsChristian`; #1322 had to be resolved **twice in one session**, because PR #1330 merged minutes after the first resolution and re-staled it with nothing about #1322 having changed. Draining N such PRs cost N sequential CI cycles.

Now the page is **generated** by `npm run generate-project-status` from one-file-per-entry fragments in `Docs/status/`. Two consequences for this section:

- **The content never conflicts.** A closeout creates a brand-new `Docs/status/YYYY-MM-DD-thr-XXXX.md`, so no two branches write the same path. That property survives GitHub's server-side merge, which ignores `.gitattributes` and therefore never benefited from union at all.
- **The assembled page is not in the tree.** `Docs/project-status.md` is generated by `prebuild` and gitignored, so no PR carries it and there is nothing to resolve. Committing it would put the shared write straight back — two branches regenerate a different top entry and a different dropped tail. No merge driver rescues that: `union` keeps both sides of a rewritten hunk (why THR-691 excluded it), `ours` is not built-in and needs `.git/config` no repo file can ship (measured 2026-08-07: still `CONFLICT (content)` in a fresh clone with the attribute set), and GitHub ignores `.gitattributes` regardless. `check:generated-freshness` asserts the generator still produces the page and that nobody has `git add -f`'d it back.

Never hand-edit the page, never stage it, and never delete another entry to make room — the generator holds the cap by rendering only the newest fragments that fit, and everything older stays in `Docs/status/`.

## Closeout — remove the temporary worktree

**Attempt cleanup immediately after push** — do not wait for the merge-to-main auto-close, because that fires on GitHub after the CC session ends and no session will be active to run the cleanup. Run cleanup from the home worktree (`$REPO_ROOT`) right after `git push` succeeds.

**⚠️ JUNCTION GUARD (mandatory, before any `git worktree remove`):** if the worktree's `node_modules` is a junction/reparse point to the home install (the standard fresh-worktree pattern), remove the reparse point FIRST. `git worktree remove --force` follows the junction and **empties the home tree's real `node_modules`** — this wiped the entire home install twice on 2026-07-22 (once manually, once via this very closeout step running in the hourly lane). `cmd /c rmdir` removes only the reparse point, never the target's contents:

```bash
cd "$REPO_ROOT"
cmd /c rmdir "$(cygpath -w "$WORKTREE_DIR/node_modules")" 2>/dev/null || true  # junction only; harmless if real dir or absent... see guard note
git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
git branch -D "$WORKTREE_BRANCH" 2>/dev/null || true
```

(`rmdir` on a *real non-empty* directory fails without deleting anything, so the guard is safe to run unconditionally. Verify afterwards: `ls "$REPO_ROOT/node_modules/vitest" >/dev/null` — if that fails, STOP and run `npm install` in the home tree before anything else.)

Both commands are non-fatal: if the worktree directory is still in use (e.g., we can't remove the directory we're running from), the error is swallowed and Step 0 of the next session will collect it via `git worktree prune` or the age-based sweep.

**Why immediate cleanup matters:** the old "after merge-to-main fires" timing was never reliable. The CC session ends before the PR merges; the auto-close fires on GitHub with no session alive to run cleanup. Step 0 of the next pickup is the backstop — but immediate post-push cleanup reduces the graveyard before it accumulates.

## Closeout — drain the `docs-only` queue (THR-938)

Roughly a dozen Ready-for-Dev tickets at any time are docs/process-only: CLAUDE.md corrections, UL proposals, wiring-guide updates, index cleanups, skill-doc fixes. Under one-issue-per-run each of those consumed a whole hourly slot, so source-code tickets queued behind paperwork. The drain lets a single run clear several of them **after** its primary ticket, without adding a lane.

**Why no separate docs lane** (Option A, deferred not rejected): a second scheduled lane costs ~24–48 billed runs/day for throughput the drain already provides inside an existing run. (Its original and stronger argument — that every merge re-staled in-flight code PRs under strict protection, THR-920 — **no longer applies**: strict mode was dropped 2026-08-02, THR-983. The billing argument stands on its own.)

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `DOCS_ONLY_LABEL` | `docs-only` | Linear label marking drain-eligible tickets |
| `DRAIN_MAX_TICKETS` | 3 | Tickets drained per run. Bounds context/wall-clock so a drain never ends mid-ticket; raise only if runs finish with headroom to spare |

### When the drain runs

Run it in either of two places:

- **After the primary ticket's PR is armed** and the worktree cleaned (the normal case), or
- **Immediately**, when Step 1 found no claimable code ticket — a docs drain is the run's whole output rather than an "exit clean, no ready work".

### Merge-yield gate — RETIRED (THR-920 → THR-983)

**There is no yield gate. Drain whenever there are `docs-only` tickets.**

The gate existed for one reason: under strict branch protection, landing a docs merge in front of an armed code PR knocked it `BEHIND` and cost an ~18-min gate re-run (THR-920; PR #1175 sat green-but-unmergeable 3+ hours). **Strict mode was dropped on 2026-08-02** (THR-983), so advancing `main`'s tip no longer stales anything — a green PR merges from behind. The cost the gate was avoiding is now zero, and a gate that guards against nothing is pure tax.

Retiring it also removes, at the source, the contradiction logged three times as impediments **#393**, **#406**, and **#411** and ticketed as **THR-953**: the gate's stated rationale named PRs *"armed and waiting on checks"* while its mechanism classified the diff of **every** open PR. Under the literal mechanism a single permanently-conflicted or deliberately-held code PR — #1114 has been exactly that since 2026-07-30 — suppressed the drain **forever**, since such a PR never leaves the open list. Three consecutive sessions each re-derived the same override by hand and recorded it. THR-953 asked for a durable fix; deleting the gate is that fix, and the ticket should be closed as resolved-by-removal rather than implemented.

Drain freely. A docs PR's required check records `SKIPPED` by design and merges in ~30–60 seconds.

### Per-ticket loop

For each `docs-only` ticket, up to `DRAIN_MAX_TICKETS`, **sequentially — never in parallel**:

1. `list_issues(team:"Threadbare", state:"Ready for Dev", label:"docs-only", limit:50, includeArchived:false)`, **Rule 0-partitioned then sorted by priority, then oldest `createdAt` — exactly as Step 1.** The partition matters here more than anywhere: a documentation defect that misroutes sessions is a flow impediment carrying real cost (a stale instruction that makes every session redo work), and the drain is where those tickets actually get picked up.
2. Claim and verify per Step 4 (`save_issue` → `get_issue`), run the Step 4.4 upstream-shipped check, and validate the coordination block per Step 3. **The drain relaxes no discipline** — it only removes the one-ticket-per-run ceiling.
3. Implement, then close out on the **docs-only track** of [`Docs/canon/verification-gates.md`](../../Docs/canon/verification-gates.md) (authoritative since THR-1336): `check:generated-freshness` (run last), `lint:plan-doc -- --staged`, and `npm run check:impediment-ids`, and nothing else. Do not run `npm test` / `check:typecheck` / `vite build` on a diff with no code in it.
4. Ship per the closeout above — `Fixes THR-XXX` alone on its own line in both the commit body and the PR body, then `gh pr merge --auto --merge`.

One In Dev at a time: finish a ticket's ship before claiming the next. Step 1.5's in-flight count is what keeps the resulting armed-but-unmerged claims from reading as a leak next run — each one resolves to its own open PR, so all of them are discharged and none of them gate.

### Mis-tag guard — run at every drained ticket's closeout (THR-917)

The label is a **predicate, not a promise** (THR-688 rule A): a ticket may carry `docs-only` iff its Done-when is satisfiable with a diff matching CI's docs filter. Verify the actual diff before shipping, using the same predicate CI uses:

```bash
git diff --name-only origin/main...HEAD | grep -vE '(\.md$|^Docs/|^Design/|^\.planning/|^src/data/ul-dashboard\.generated\.json$|^public/system-interface-map-reference\.html$)'
```

Or run **`npm run classify:diff`** (THR-988), which prints the same verdict plus the surviving paths, computed from the constants `ci.yml` is pinned to rather than from a hand-copied grep.

Empty ⇒ genuinely docs-only, ship on the docs track. **Non-empty ⇒ mis-tagged:** remove the `docs-only` label, comment why on the issue, and finish that ticket on the **code track with the full gate**. Never ship code on the docs track. Then end the drain — a mis-tag means the label's membership is untrustworthy this run.

Note the two trailing exact paths: `src/data/ul-dashboard.generated.json` and `public/system-interface-map-reference.html` are generated *from* documentation but written outside the doc paths (THR-922), so a UL-shard or canon-page edit regenerates them and would otherwise classify a pure documentation deliverable as code. Those two fragments are exactly what went missing in all three recorded drifts of this predicate — including this skill's own drain spec (impediment #386) — which is why `npm run check:predicate-copies` now compiles every copy and fails on any that classifies them differently (THR-988).

**Trace lines** (NFP #2 — exactly one of the first three fires, then one per ticket):

```
[pull-work] drain: no docs-only tickets in Ready for Dev. Nothing to drain.
[pull-work] drain: <N> docs-only candidates, draining up to 3.
[pull-work] drain: THR-XXX shipped (PR #<N>, docs track: 3b/5/impediment-ids).
[pull-work] drain: THR-XXX MIS-TAGGED (<file>) — label removed, finishing on code track, drain ended.
```

**Fail-soft:** any error inside the drain ends the drain and exits the run clean. The primary ticket has already shipped by then, so a failed drain costs the drained tickets' progress and nothing else.
