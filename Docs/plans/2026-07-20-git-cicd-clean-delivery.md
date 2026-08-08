# Git/CI-CD clean delivery — root cause and target state

**Date:** 2026-07-20 · **Author:** Fable investigation session (planning only; executor lane implements)
**Origin:** user directive 2026-07-20 ("agents are spending tons of time and resources on perceived issues with CI/CD… needs to be investigated. In depth.") via `Docs/audits/2026-07-20-git-cicd-forensics/investigation-brief.md`
**Evidence:** `Docs/audits/2026-07-20-git-cicd-forensics/` (forensics.txt, staged.patch, unstaged.patch), `C:\Users\chris\bin\threadbare-autosync.log`, `C:/Users/chris/Dev/Projects/clean-stale-git.log`, `.git` reflogs, `~/.claude/scheduled-tasks` registry, session transcripts under `~/.claude/projects/*TheFantasyWorldSimulator*`
**Tickets:** THR-671 (freshness signal), THR-672 (inert home tree), THR-673 (reaper hardening), THR-674 (one-time cleanup), THR-675 (frictionless PRs), THR-676 (upstream report)

---

## 1. Root-cause narrative (causal order; proven vs inferred)

**P = proven** (direct artifact evidence) · **I = inferred** (mechanism fits all observations; no direct witness)

1. **[P] The system runs more sessions than anyone thought.** Three enabled hourly scheduled tasks spawn headless CC sessions: `tb-opus-pickup` (cron `0 * * * *`, jitter 53 s → fires ~:00:53), `flush-plan-docs` (cron `0 * * * *`, jitter 229 s → ~:03:49), `keep-work-flowing-cc` (cron `20 * * * *`, jitter 493 s → ~:28:13). Each spawn gets a harness worktree under `.claude/worktrees/`; subagent forks get their own. Measured: **9 worktrees created 09:01:12–09:03:35 on 07-19 alone**, 16 that day (`.git/worktrees/*` creation timestamps).

2. **[P] The CC app/harness syncs local `refs/heads/main` to `origin/main` at spawn time, via plumbing.** The `main` reflog carries **empty-message updates at :01–:03 past the hour** (e.g. `main@{2026-07-19 11:01:28}`, with worktree `pensive-cannon` created 11:01:29 — same second). Empty reflog messages are the signature of `git update-ref`-style plumbing, not porcelain fetch/merge/reset.

3. **[P for the event, I for the mechanism] Moving `main` under a checked-out tree manufactured the "68 staged files".** On 07-18 20:01:06 the plumbing sync moved `main` forward *while the home tree had `main` checked out* (autosync log at 20:50 confirms `branch == main`; behind-count dropped 30 → 3). `update-ref` moves the branch but touches neither index nor working files — so `git status` afterward reports the difference between new HEAD and old index as **staged changes**. That is exactly the observed pile: 221 insertions / 3,379 deletions that *reverse* freshly-merged work (THR-614's `quintessence`→`cohesion` rename, THR-575's CLAUDE.md trim, deletion of newly-added files like `codexRunState.ts`). **Nobody staged anything; no agent wrote damage.** The earlier theory in the brief ("a `git checkout <old-ref> -- <paths>` staged an older snapshot") is retired — no transcript contains such a command against these paths, and the ref-moved-under-tree mechanism explains the staged/unstaged split precisely (staged = tracked delta vs moved HEAD; unstaged = live `.codesight` regeneration by the SessionStart codesight hook).

4. **[P for events, I for the actor's code path] A bare `git checkout HEAD` detached the home tree three mornings running** — 07-17 10:36:13 (from `main`), 07-18 09:01:41 (from `claude/sad-bartik-421eef`, **48 seconds after the :00:53 tb-opus spawn instant**), 07-19 10:55:03 (from `main`). Transcript search across every `*TheFantasyWorldSimulator*` project directory finds **no executed bare `git checkout HEAD` in any agent session** — only the harmless pathspec form and *discussions* of the mystery. Agent shell commands always appear in transcripts; harness git operations do not. Conclusion: **the actor is the CC app/harness layer** — the same non-transcript layer doing the plumbing ref-syncs in (2). The exact trigger inside the closed binary is **unproven**; the effect correlates with session-spawn/setup windows.

5. **[P] Scheduled sessions also used the home tree as a working surface.** The HEAD reflog shows the 07-17 flush-plan-docs run checking out `claude/sad-bartik-421eef` and doing its plan-flush branch dance *in the home tree* (17:05–17:07), leaving the tree parked on a session branch; the 07-19 05:31 keep-work-flowing run did its `docs/briefing-*` checkout-commit-checkout cycle in the home tree too. This is how the home tree ends up on random branches even before any harness detach.

6. **[P] The freshness signals then measured the wreckage wrongly and escalated it.** `keep-work-flowing-cc` § 2 computes `HEAD..origin/main` — on a parked/detached HEAD that number is the frozen snapshot vs a moving main: "58 → 79 behind and climbing", while local `main` was **0 ahead / 0 behind the entire time** (kept current by the harness ref-sync of (2), ironically). `session-precheck.ts` returns `freshness=detached` (status unknown) with no guidance, and CLAUDE.md's session-workflow bullet doesn't map `detached` at all — so agents treated it as a hard stop and re-diagnosed from scratch, hourly. The repair, once correctly diagnosed, was `git stash push` + `git switch main` — **the multi-day cost was diagnosis, not damage.**

7. **[P] Cleanup exists but leaks.** `clean-stale-git.sh` + the daily "Threadbare Git Cleanup" Windows task genuinely work (07-19 09:00 run: down to 12 worktrees / 32 branches) — but the log shows a 07-06→07-17 outage, the 07-20 09:55 attempt was refused by Task Scheduler (result `-2147020576`) with **no alerting**, and a daily cadence loses to ~15 worktree-creations/day: the count regrew 12 → 27 within a day. Worktrees holding unmerged branches (7 from 07-05) are kept forever with no escalation path. The 12-deep stash stack (four separate "THR-409 worktree graveyard cleanup" WIPs) is the recurrence record of sessions each re-doing this cleanup by hand.

8. **[P] The guards that exist behaved correctly.** `threadbare-autosync.ps1` (created 07-18 18:48) never destroyed anything: it skipped on phantom dirt, then skipped on detachment, exactly as designed. Branch protection kept the phantom reversal pile off `main` for its entire life. THR-660 (untrack `.codesight/`, landed 07-19) already removed the biggest recurring dirt source.

## 2. Premise test — "we are only running one agent at a time"

- **At the Linear claim level: true.** WIP = 1 holds; there is a single executor lane and one `Ready for Dev` queue.
- **At the session/process level: false.** Two scheduled sessions spawn within ~3 minutes of each other at the top of every hour, a third at :28, plus Christian's interactive morning session, plus Task-tool subagent forks — 9 worktrees in a 2.5-minute window on 07-19 is direct evidence of concurrent session existence.

**Consequence for H2b (drop worktrees?): No — keep them, but make them cheap.** Sessions genuinely overlap, so shared-tree execution would produce real collisions, not phantom ones. The worktrees themselves were never the disease: creation is harness-automatic and free; the costs were (a) nobody reaping them reliably, (b) the home tree not being inert, and (c) signals that read the resulting mess as decay. The middle option (one persistent reusable executor worktree) is rejected: worktree lifecycle is harness-controlled, not ours to pool, and it retains the bare-path footgun (`feedback_worktree_edit_paths`) while giving up crash isolation. The dev-server/DoD friction (`feedback_worktree_preview_server`) is real but is a verification-workflow cost, not a reason to serialize all execution into one tree.

## 3. Cost quantification (defensible estimate, method stated)

- **Impediment log:** 92 of 409 lines (~22%) in `Docs/impediments.md` mention dirty-tree / worktree / stale / rebase / freshness / detach friction; 62 lines mention the `check:skill-sync` hook workaround.
- **Whole sessions lost to this class, 07-17 → 07-20 alone:** the 07-17 rescue session (`rescue/2026-07-17-detached-plans`), the 07-20 repair session (~half a morning), and 6+ briefing runs that each spent their budget re-deriving and re-wording the false "behind" alarm. Historically: four abandoned THR-409 cleanup attempts (stash evidence), plus amnesty tickets THR-395, THR-409, THR-488.
- **Recurring tax:** every pickup session runs precheck + sweep + upstream-check overhead (~1–3 min/session × ~24 spawns/day); every ship poll-waits on CI (~3–8 min).
- **Estimate:** on the trailing week, **roughly 10–20% of automation-lane wall-clock and tokens** went to git/staleness handling rather than product work, concentrated in bursts around the three detach mornings; at least three full sessions were lost outright. Uncertainty is ±half; the number is bounded below by the artifact-documented session losses alone.

## 4. Hypothesis verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Freshness signal miscalibrated, manufactures alarm | **Confirmed.** `HEAD..origin/main` on a parked HEAD + unmapped `detached` key + hard-stop protocol. → THR-671 |
| H2 | Something runs bare `git checkout HEAD` daily | **Confirmed as events; actor is the CC harness (transcript-absence proof); exact code path unproven.** → THR-672 (containment), THR-676 (upstream) |
| H2b | Worktrees net-negative at concurrency 1 — drop them? | **Rejected — concurrency is not 1 at the session level.** Keep worktrees; fix reaping + home-tree inertness. § 2 |
| H3 | Nothing owns cleanup | **Partially wrong.** A reaper exists and works, but fails silently, ran daily against ~15/day creation, and never escalates unmerged strays. → THR-673, THR-674 |
| H4 | Home tree used as a working surface | **Confirmed, two actors:** harness ref-sync/detach + scheduled-session branch dances (07-17, 07-19 reflog). The "68 staged edits" were phantom, not writes. → THR-672 |
| H5 | Pre-commit hooks add route-around friction | **Confirmed** (62 impediment-log mentions of skill-sync). → THR-675 |
| H6 | Branch protection heavier than a single-executor system needs | **Rejected.** The PR gate is what kept the phantom 3,379-line reversal off `main`. Keep protection + CI; remove the cost via auto-merge. → THR-675 |

## 5. Target state — "clean delivery every time", mechanically

- **Where agents work:** scheduled/executor sessions in harness worktrees (unchanged); Christian's interactive session in the home tree.
- **Who owns the home tree:** `threadbare-autosync.ps1`. To every automated session the home tree is a **read-only mirror of `main`**; only interactive sessions (and the one-time THR-674 salvage) may mutate it. Scheduled sessions do commit/branch work in their own worktree — branches are repo-global, push works from any worktree (THR-672).
- **Self-healing park recovery:** autosync gains a reattach step — detached + `rev-list --count origin/main..HEAD` = 0 + no tracked modifications → `git switch main` automatically. The known harness re-park recurs and heals within the hour instead of festering for days (THR-672).
- **Worktree lifecycle:** created by the harness per session; reaped **hourly** by `clean-stale-git.sh` (merged + clean → removed; unmerged + >14 days → `NEEDS-DISPOSITION` escalation into the briefing, never auto-deleted). Reaper health is visible in the briefing within an hour of failure (THR-673).
- **Freshness signal states** (exhaustive, each with its action): `current` · `ahead:N` (push pending) · `behind:N` (pull) · `stale-branch` (close it) · **`parked-at-ancestor`** (run the two-command repair — safe, loses nothing) · **`parked-with-unique-commits:N`** (stop; hand SHAs to a session) · `unknown` (surface). The briefing never reports a behind-count for a HEAD that is not on `main` (THR-671).
- **Shipping:** PR + required `Test · Typecheck · Build` check stays; `gh pr merge --auto` on every executor PR so no session waits on CI; skill-sync hook stops false-positive blocking (THR-675).

## 6. Fast mechanical repair path (deliverable #4 — runnable without judgment)

```powershell
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git fetch origin main
git rev-list --count origin/main..HEAD    # SAFETY CHECK — read the number
```

- **Prints `0`** → nothing unique is stranded; proceed (loses nothing authored — untracked files survive, the stash is recoverable):

```powershell
git stash push -m "home-tree-recovery"    # harmless no-op if the tree is clean
git switch main
git pull --ff-only origin main
```

- **Prints anything else** → STOP. Real commits are stranded off-branch. Run `git log origin/main..HEAD --oneline` and hand the SHAs to a session; do not reset, do not force.

Do **not** use `git rebase origin/main` (fails from detached HEAD) or `git switch main && git pull` without the stash (drags tracked edits). This block also lands in `Design/user-actions.md` item #4 and, via THR-671, in the precheck's own output.

## 7. Tickets and sequencing

| Order | Ticket | Scope (§ ref) | Priority | Constraint |
|---|---|---|---|---|
| 1 | **THR-671** | Freshness signal rework (§ 5 states; precheck + kwf skill + CLAUDE.md) | High | Parallel-safe with all |
| 1 | **THR-672** | Inert home tree: autosync reattach + no scheduled-session git state ops in home tree | High | Mutex THR-673 (kwf skill) |
| 2 | **THR-674** | One-time cleanup: 15 untracked docs, 12 stashes, 07-05 worktrees/branches | Medium | Mutex THR-673; land before it |
| 3 | **THR-673** | Reaper hardening: fix task refusal, hourly at :40, age escalation, briefing line | Medium | After THR-674 |
| any | **THR-675** | Frictionless PRs: auto-merge, skill-sync hook fix (H6 verdict: keep protection) | Medium | — |
| any | **THR-676** | Upstream harness report (file only after Christian's chat yes) | Medium | External post gated |

All in project **Continuous Improvement**; coordination blocks posted on each issue.

## 8. Briefing-narrative correction (deliverable #6)

The 2026-07-20 10:22 `keep-work-flowing-cc` run already replaced "77 behind, climbing, needs manual triage" with the parked-snapshot framing in `Design/briefing.md` and `Design/user-actions.md`. This investigation additionally corrects, in `Design/user-actions.md` (same-day edit alongside this doc): item #4's "cause unidentified / agent-tooling inference" → the transcript-absence finding and harness attribution with ticket pointers; and the Resolved-section claim that the staged pile came from a `git checkout <old-ref> -- <paths>` → the ref-moved-under-checked-out-tree mechanism (§ 1.3). The durable wording fix for future briefings is THR-671 scope.

## 9. Governance notes

- **Three-pillar check: N/A — deliberate.** This plan touches no Engine, Content, or UI surface; it is agent-workflow infrastructure with zero player-visible behavior. Marked explicitly per the investigation brief rather than skipped.
- **Forked audits / intent-judge:** consciously not spawned — those gates exist for game-design plan docs heading into the Cowork handoff; this is an infra investigation executed under the Fable planning-only protocol, and the originating intent is quoted verbatim in § header. If a reviewer wants the judge pass anyway, run `/intent-judge Docs/plans/2026-07-20-git-cicd-clean-delivery.md`.
- **Substrate check:** no engine systems involved; the "existing substrate" here is the script/skill inventory audited in § 1 (autosync, reaper, precheck, pull-work, kwf) — all extended, none green-fielded. THR-660's `.codesight` untracking is prior art already landed.

## 9b. Armed-PR stall classification (THR-897, added 2026-07-31)

H6 kept branch protection and removed the waiting cost via `gh pr merge --auto` (THR-675). That trade assumed an armed PR eventually merges on its own. Two defects in the same mechanism say otherwise, and they are **not** the same defect:

| | THR-735 (decided — § 9c) | THR-897 (this section) |
|---|---|---|
| Nature | **Drain rate** — `BEHIND` PRs drain at 1/hour vs `main`'s ~4 merges/hour | **Classification** — `DIRTY` PRs were never in the drain set at all |
| Symptom | A PR that loses a race it usually loses | A PR that cannot merge by any amount of sweeping |
| Remedy | **Merge queue** — decided 2026-08-01, § 9c; executed by THR-946 | Classify and report — shipped |

**The classification gap.** pull-work Step 0.8 matched `mergeStateStatus === "BEHIND"` and applied `gh pr update-branch`. A conflicted PR is not `BEHIND`, so it was skipped; `update-branch` would not have helped anyway. The step's prose did mention `DIRTY`, but with no mechanism and a log line reporting only what it drained — so every run stepped past it truthfully claiming success.

Measured 2026-07-31 during THR-897's own pickup: **3 of 4 armed PRs were `DIRTY`**, the oldest armed 19 hours carrying THR-883's authoring-contract rewrite (the deliverable unblocking 11 content tickets), across three consecutive sweeps that each reported success.

**Shipped:** `scripts/check-armed-prs.ts` (`npm run check:armed-prs`) classifies each armed PR into `drainable` / `conflicted` / `waiting` / `indeterminate` and computes conflicting file names read-only via `git merge-tree --write-tree`. Consumed by pull-work Step 0.8 (per-run action) and `keep-work-flowing-cc` step 2.5c (durable surface in `Design/briefing.md`), so the two cannot drift about what "stuck" means.

**Two design points worth keeping:**

- **`UNKNOWN` is not "fine".** GitHub computes `mergeStateStatus` lazily; a first read returns `UNKNOWN` and merely schedules the computation. PRs #1132 and #1166 each read `DIRTY` then `UNKNOWN` minutes apart with no intervening push — a single-read classifier would call a conflicted PR healthy on roughly every other run. Unrecognised states classify `indeterminate`, never `waiting`, because `waiting` asserts nobody needs to act.
- **A conflict is an agent's job until it isn't.** Per THR-608, technical verdicts are the agent's, so the first age tier escalates to a *session* (`needsSession`), not to Christian. Only past `ARMED_DIRTY_ABANDONED_HOURS` — ~12 hourly runs that each had a chance and none took it — does the stall become systemic enough to be his.

## 9c. The `BEHIND` livelock — remedy decision (THR-735, decided 2026-08-01)

§ 9b left THR-735's remedy "undecided" across the four candidates its ticket body listed. This section makes the call and states the trade-off, which is THR-735's whole remaining scope; the implementation is THR-946 and the interim relief is THR-945.

> **Decision: adopt GitHub's merge queue (remedy 1).** Remedy 2 (drop strict mode) is kept as the named fallback, not the choice. Remedy 3 (raise `ARMED_SWEEP_MAX_UPDATES`) is **retired** — it is arithmetically incapable, not merely expensive. Remedy 4 (batch the lane's docs traffic) is **retired as a remedy** while proceeding as work in its own right under THR-947, because it reduces the collision rate without removing `BEHIND` as a terminal state.

### Why the call could not be made before

The ticket sat six occurrences deep (2026-07-23 → 08-01) without a verdict because the four candidates were genuinely balanced on the evidence then available. Three inputs since have unbalanced them, and each is checkable rather than argued:

1. **The drain ceiling is one PR per advance of `main`'s tip — not N per run** (measured 2026-07-31: `#1166`, `#1175`, `#1176` all sat `BEHIND` at the *same* base; updating two moved both to green, and the first to merge returned the other to `BEHIND`). This retires remedy 3 by construction: at N updates per run, N−1 are invalidated no matter how the cap is tuned. The problem is serialization, not throughput.
2. **`main`'s traffic stopped being bursty and became two scheduled lanes at fixed minutes** (~:03 briefing, ~:31 orchestrator — stable since 2026-07-29). That is what makes remedy 4 look attractive and is exactly why it is not sufficient: measured 2026-07-28, `main` took only ~2 merges/hour and the sweep *still* lost. Halving a collision probability leaves a silent failure mode intact.
3. **The repo went public on 2026-08-01, which puts merge queue in reach at all.** It was inaccessible while private, which is the single reason remedy 1 was theoretical for the ticket's whole life.

### The finding that decides remedy 2's real cost

`main` is protected by **two overlapping surfaces**, and they disagree about strict mode. Verify both in one pass:

```bash
gh api repos/christianspliid-ui/threadbare/branches/main/protection --jq '.required_status_checks | {strict, contexts}'
gh api repos/christianspliid-ui/threadbare/rulesets/15479914 --jq '.rules[] | select(.type=="required_status_checks") | .parameters | {strict_required_status_checks_policy, required_status_checks}'
```

Measured 2026-08-01:

| Surface | strict | required check |
|---|---|---|
| Classic branch protection (legacy) | **`true`** | `Test · Typecheck · Build` |
| Ruleset "Main" (`15479914`, active, edited 2026-08-01 10:16 CEST) | **`false`** | `Docs gates` |

GitHub layers the two and applies the **most restrictive** version of each rule, so `strict: true` governs and both checks are required. The `BEHIND` livelock this whole ticket describes is therefore produced *entirely* by the classic rule — the modern surface, which is the one actually being maintained, already asks for no strict policy.

This reframes remedy 2 substantially. It is not "trade away the up-to-date guarantee as a governance decision"; it is "retire a duplicate legacy rule that a deliberately-configured ruleset has already superseded on every other axis." That makes it much cheaper than the ticket assumed — cheap enough to be a credible fallback, and cheap enough that it must be chosen deliberately rather than drifted into.

### Why remedy 1 over remedy 2 anyway

| | Remedy 1 — merge queue | Remedy 2 — drop strict |
|---|---|---|
| Removes `BEHIND` as a terminal state | Yes — the queue builds each group on latest `main` and tests that exact tree | Yes — nothing is ever "behind" |
| Keeps "the merged tree was tested" | **Yes** — the check runs against the post-merge tree, which is strictly stronger than what strict mode gives today | **No** — a PR can merge green against a base that has since moved |
| Batches the lane's own docs traffic for free | Yes — queued entries merge as one group | No |
| Survives an hour with no session present | Yes | Yes |
| Cost to adopt | `merge_group` trigger in `ci.yml` + a docs-only-detection decision + one settings click | One settings click |
| Reversibility | Disable the queue; PRs fall back to today's behaviour | Re-enable strict |

The deciding column is the second. H6 (§ 4) kept branch protection precisely because the required check caught a phantom 3,379-line reversal before it reached `main`; remedy 2 weakens exactly that guarantee, while remedy 1 **strengthens** it — GitHub tests the merged result rather than the PR head. Choosing 2 would spend the guarantee H6 deliberately paid for, to fix a problem 1 fixes without spending it.

Remedy 2 stays documented as the fallback for one case: if merge queue turns out to be unavailable on this repo's plan, or its docs-only-skip interaction with THR-768's vacuous-gate reasoning cannot be made safe, dropping strict on the legacy rule is the next-best move and is now a well-understood one-field change rather than an open question.

### What is gated on Christian, and what is not

- **Agent-side, no settings needed (THR-946):** `merge_group` in `ci.yml`'s `on:`, the merge-group docs-only detection (`git diff --name-only ${{ github.event.merge_group.base_sha }}..HEAD`), lane-doc updates for `gh pr merge --auto` semantics under a queue, and a `linear-autoclose` check on the first queue-landed merge.
- **Christian-side, one settings visit:** enabling the queue on `main`. Entitlement is confirmed at that screen by whether the option appears — the API surface already resolves on this repo (`Repository.mergeQueue(branch:"main")` returns `null`, i.e. *not configured*, not *unavailable*). Same visit can retire the duplicate classic rule, which is the cleanup this section's finding exposes regardless of which remedy lands.

### What this section does not decide

THR-735's Done-when #2 — *an armed green PR merges unattended across an hour in which `main` receives ≥2 merges, at least one landing while the PR's own CI runs* — is a demonstration of the chosen mechanism **in production**, so it cannot be discharged before the mechanism exists. It is the same clause as THR-946's Done-when #2 and belongs there; THR-735 owns the decision, THR-946 owns the proof.

### Implementation status — agent half landed 2026-08-02 (THR-946)

The workflow half is in `main` and is **inert until the settings click**: no merge groups exist before the queue is enabled, so the `merge_group` trigger cannot fire. This is the order § 11 requires (trigger before click, never the reverse).

What landed:

| Piece | Where | Note |
|---|---|---|
| `merge_group: types: [checks_requested]` trigger | `ci.yml` `on:` | Both required checks — `Test · Typecheck · Build` **and** `Docs gates` — hang off the same workflow, so one trigger reports both |
| Merge-group change detection | `ci.yml` `detect` job, step `filter-merge-group` | `git diff --name-only <base_sha> HEAD` piped through one ERE. `paths-filter` sits the event out: it has no diff base there |
| Conditional `fetch-depth` | `detect` job checkout | `0` on `merge_group` (the base must be reachable), `1` everywhere else. Quoted `'0'`/`'1'` — unquoted, `A && 0 \|\| 1` yields `1` on both branches because `0` is falsy |
| Drift pin for the third predicate copy | `scripts/__tests__/docs-code-decoupling.test.ts` | Structural *and* behavioural: the pattern string is executed as a `RegExp` against doc/code fixtures, and cross-checked against `isDocPath` |

**The docs-only decision, made deliberately: the skip is preserved inside the queue.** Running the full suite on every merge group is simpler, but it would put each hourly briefing and orchestrator sweep through the ~10.5-minute suite and batch them behind one another — the same lane congestion the queue is adopted to remove. Free runners make this a latency argument, not a cost one.

That is only safe if a merge group can never be *skipped for a change nobody classified*, which is THR-768's vacuous-gate concern re-derived for this event. It holds because every failure mode in the new step — unresolvable `base_sha`, a `git diff` error, a malformed pattern — exits non-zero under `set -euo pipefail`, which fails `detect`, which the `check` job's existing guard converts into a **failing** required check. `skipped` therefore means "classified, and there is no code in it", never "could not tell".

Still open, and both belong to the settings visit: Done-when #2 (a real code PR and a real docs PR landing through the queue) and #3 (`linear-autoclose` firing on a queue-produced merge). Autoclose is expected to be unaffected by inspection — it triggers on `pull_request: [closed]` and on `push` to `main`, and a queue merge produces both — but "expected by inspection" is exactly what Done-when #3 exists to convert into a measurement.

**THR-945's script is retired by never having been written.** No disturber-pays script exists in `scripts/` — the only armed-PR tooling there is `check-armed-prs.ts`, which is THR-702/THR-897's classifier and stays. Christian's 2026-08-02 re-assessment recommends retiring THR-945 unbuilt, since THR-947 moved the exhaust that was its whole premise. Nothing to delete; recorded here so the Done-when is answered rather than assumed.

## 10. Constants

| Constant | Default | Where | Purpose |
|---|---|---|---|
| `WORKTREE_ESCALATE_DAYS` | 14 | clean-stale-git.sh (THR-673) | Unmerged worktree age → NEEDS-DISPOSITION escalation |
| Reaper cadence | hourly, :40 | Windows task (THR-673) | Free slot per CLAUDE.md slot-allocation table |
| `STALENESS_BEHIND_THRESHOLD` | 5 (existing) | session-precheck.ts | Behind-count that flips freshness to warning |
| Autosync reattach guard | detached ∧ unique-commits=0 ∧ tracked-clean | threadbare-autosync.ps1 (THR-672) | Only self-heal the provably-loss-free case |
| `FRESHNESS_BEHIND_THRESHOLD` | 10 (existing) | kwf skill | Briefing flag threshold — applies to `main..origin/main` only after THR-671 |
| `ARMED_SWEEP_MAX_UPDATES` | 1 (existing) | pull-work Step 0.8 (THR-702) | Drains one PR per run. **Not tunable upward to any effect** — the true ceiling is one merge per advance of `main`'s tip, so at N updates per run N−1 are invalidated by construction (§ 9c). Superseded by the merge queue (THR-946) |
| `ARMED_DIRTY_ESCALATE_MINUTES` | 90 | check-armed-prs.ts (THR-897) | Conflict age at which a session must pick the PR up |
| `ARMED_DIRTY_ABANDONED_HOURS` | 12 | check-armed-prs.ts (THR-897) | Conflict age at which the stall becomes Christian's |
| `ARMED_UNKNOWN_REQUERIES` | 3 | check-armed-prs.ts (THR-897) | Re-reads before believing an `UNKNOWN` merge state |
| `REQUIRED_CHECK_NAMES` | `Test · Typecheck · Build`, `Docs gates` | check-armed-prs.ts (THR-1020) | The checks branch protection requires. An allowlist, not the whole rollup — `Vercel` is deliberately not a gate and reading it would report mergeable PRs as stuck |
| `CHECK_FAILURE_CONCLUSIONS` | `FAILURE` `ERROR` `TIMED_OUT` `CANCELLED` `STARTUP_FAILURE` `ACTION_REQUIRED` `STALE` | check-armed-prs.ts (THR-1020) | Conclusions that mean red. `CANCELLED` is red (THR-1013 — it does not satisfy protection); `SKIPPED` is deliberately absent (it does, and is by design on a docs-only PR) |

## 11. Fail-soft table

| Failure case | Behavior |
|---|---|
| Repair path finds unique commits (`rev-list` ≠ 0) | Hard stop with SHA list; no reset ever |
| Autosync reattach guard partially true (e.g. detached but dirty) | No action; one loud log line with the manual repair block |
| Reaper Task Scheduler refusal recurs | Summary line missing from log → kwf briefing flags "reaper silent > 2h" (THR-673) |
| Plan doc not yet flushed when a pickup claims a ticket | Ticket descriptions carry the § summary + "defer one cycle" note |
| Harness re-parks the tree despite everything | Contained: autosync reattaches within the hour; freshness reports `parked-at-ancestor` with the repair, not a behind-count |
| Deleting salvage debris that later proves wanted | THR-674 requires per-item verdicts in the PR body; stashes/branches verified against origin/main before drop |
| `check-armed-prs` cannot reach GitHub | Degrades to `verdict: "unknown"`, exits 0; Step 0.8 logs one warning and continues to pickup (THR-897) |
| A PR head ref is unfetchable, so conflicting files cannot be computed | `conflictFiles: []` with the `conflicted` verdict intact — the stall is still reported, just without the diagnosis |
| GitHub returns an enum member the probe does not know | Classified `indeterminate`, never `waiting` — the probe declines to assert nobody needs to act |
| Merge queue turns out unavailable on this repo's plan (§ 9c) | Fall back to remedy 2 — drop `strict` on the **classic** rule only, which the active ruleset already declines to require. One field, reversible; the decision record states the cost so the fallback is a choice, not a drift |
| Merge queue enabled but `ci.yml` lacks the `merge_group` trigger | Every queued PR stalls with the required check never reporting. THR-946 lands the trigger **before** the settings click; if the order inverts, disable the queue rather than merging past a check that cannot report |

## NFP Compliance

| Priority | Verdict |
|---|---|
| 1 Tunability | PASS — every threshold/cadence is a named constant (§ 10) |
| 2 Inspectability | PASS — every script logs one-line traces; reaper health surfaces in the briefing; reflog evidence preserved in the audit dir |
| 3 Determinism | N/A — no simulation surface |
| 4 Fail-soft | PASS — § 11; no destructive default anywhere in the design |
| 5 Narrative over mechanics | N/A |
| 6 Additive over destructive | PASS — extends existing scripts/skills; deletions confined to the audited one-time cleanup with per-item verdicts |
| 7 Performance budget | PASS — reaper is idempotent and cheap at hourly cadence; no new per-tick cost anywhere |
