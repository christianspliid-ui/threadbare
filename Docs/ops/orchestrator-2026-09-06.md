---
lane: tb-orchestrator
run: 2026-09-06
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-06 (run a, ~11:34–11:42Z)

**Linear is unreachable, so three of this lane's four tiers could not run at all.** T1, T1.5 and T2 are Linear-mediated end to end — there is no board to scan, no state to write, no comment to post — so this run promoted nothing and touched nothing. That is the fail-soft path working, not a lane fault.

**T3 ran in full and is the substance of this run.** All four detectors completed with no new detector findings; the two new findings both come from the judgement passes that no detector performs. The first run after a 45-hour outage is exactly when an architecture sweep is worth its cost.

## Needs Christian

**One thing, and it is the same thing three separate machines hit this morning.**

**Linear has been unreachable since the machine came back, and it is now blocking three lanes rather than one.** The work-pickup lane logged it at 13:25 ([impediment #973](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md)), the weekly retrospective hit the identical wall eight minutes later and logged it again as #974 — it could not file the one ticket it wanted to file — and this lane is the third: I could not read the board, so nothing was promoted, nothing was staged, and no map question was moved.

Two ways to fix it, **either one alone is enough**, and both are yours because neither can be done from an unattended session:

- **Reauthorize the Linear connector** — claude.ai → Settings → Connectors.
- **Or set `LINEAR_API_KEY` in the machine environment.** This is the better one for the scheduled lanes: it needs no browser sign-in and does not lapse the same way. The code that uses it is already written and shipped.

**Why it is worth doing before the other things on your list:** the batch approval at the top of your briefing — *"batch 2, run the six"* — will not start the machine on it while this is broken, because the lane that would run it cannot claim the ticket. **You can still start it by hand in a chat session**; it is only the unattended machine that is stopped. Everything else queued behind you is in the same position.

**Nothing else is asked of you.** The rest of your briefing list is carried unchanged and none of it is re-argued here — the retrospective that ran this morning already landed five process improvements without needing you.

## T1 — unblock sweep

**Not run — Linear unreachable.** Promoted 0, filed 0, declined 0, held 0. **No board state was read, and none is reported.**

Both documented transports are down at once, which is what makes this an outage rather than a slow call:

- The `plugin:productivity:linear` connector reports *"requires authentication before their tools can be used"*, and this session is non-interactive, so the OAuth flow cannot run here.
- Two `ToolSearch` probes (`+linear`, and `select:list_issues,get_issue,save_issue,list_comments,create_comment`) returned **no Linear tool of any name** — the only `list_issues` on offer is GitHub's.
- The fallback transport is unprovisioned: `LINEAR_API_KEY` is unset, which `check:process` reported independently this run (see T3).

Per the fail-soft table, promotion is skipped entirely and the next run reconciles. **No new impediment was logged** — [#973](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) (pickup lane, 11:25Z) and #974 (retro lane, on the branch below) already record this outage with both remedies; a third row would be duplication, and the process-work throttle routes the aggregate to the retro rather than to a new ticket.

**The one fact neither existing row can state is the count.** #973 and #974 each record a single lane's loss. Measured across this morning: **three lanes, one cause, inside twelve minutes** — pickup (11:25Z), retro (11:33Z), orchestrator (11:34Z). That is the number worth carrying, and it is carried to Christian above rather than filed.

```
[orchestrator] T1 skip: Linear unreachable — MCP unauthenticated (non-interactive session), LINEAR_API_KEY unset; 2 ToolSearch probes returned no Linear tool
[orchestrator] T1 skip: no board read, no promotion attempted, no state written; next run reconciles
```

## T1.5 — wayfinder sweep

**Not run — Linear unreachable.** Map discovery is a `list_issues(label:"wayfinder:map")` call, so the tier cannot begin.

**No frontier is reported, and no map is claimed clean.** The four maps last measured on 2026-09-04 (Physical Conflict 7, Undertakings 3, Item Generator 1, Powers & Spellcraft 0) are **not** restated as current — nothing has verified them since, and this lane does not carry a stale reading forward as a live one. The HITL questions already sit in Christian's briefing under their own links and lose nothing by this gap.

## T2 — design staging

**Not run — the trigger is unmeasurable.** T2 fires on a count of non-`Deferral` items in `Ready for Dev`, and that count comes from the board. Neither the trigger nor the `ORCH_MAX_IN_DESIGN` bound can be evaluated, so no staging decision was made in either direction.

Explicitly **not** substituting the last known figures (7 on the shelf, 1 live `In Design`): a shelf count is the one input that decides whether this tier acts, and acting on a two-day-old copy of it is how a lane stages work into a queue that has since filled.

## T3 — architecture health

**Due and run in full.** No sweep exists for 2026-09-05 or 2026-09-06 on `origin/ops` — the machine was down 45 hours — so the last is [`orchestrator-2026-09-04.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-04.md) (run a, ~05:50Z). Diffed against that. **All four detectors completed; none was piped, and none is reported from a truncated read.**

| Detector | Result | vs. 2026-09-04 run a |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, 101 contracts (exit 0) | **Unchanged** — same seven, same total |
| `check:canon-staleness` | **26 warnings** (exit 0) | **Unchanged** — same count |
| `sweep:rank-reach` | **`PASS`** — 60 reachable, 0 blocked, 0 unowned; 16 apex holders at tick 900 | **Identical**, verdict and figures |
| `check:process` | exit 0 — but **`passed-with-gaps`, 3 sub-checks did not run** | **Changed** — was clean. See finding 1 |

The seven LEAKED contracts are the same seven, each still carrying its remediation ticket: `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertow-card-drifts-mortal-values`. The `Docs/canon/world-objects.md` missing `last_reviewed` stamp that the last two sweeps raised is **still open, still one frontmatter line**. `rank-reach` moved only in the figure already flagged as noise (member-work cost 0.262 ms/pass over 308 memberships, against 0.229 last sweep — both far inside NFP #7; faction draw census 22, still `0 drawn by a member of the owning faction`).

`__DEBUG.validateTraitRefs()` is browser-only and **cannot be invoked from a headless lane. Not run, and not reported as clean.**

The `[WorldGen] Ocean fraction too low: 7.4%` line printed by two detectors is **not** a new finding — it has appeared in orchestrator reports since at least 2026-08-13 and is carried, not re-raised.

### Finding 1 (new) — the Linear outage has a second blast radius: `check:process` now passes with three sub-checks dark

`check:process` exits **0** and prints:

```
[WARN] linear-auth global LINEAR_API_KEY is unset; skipped Linear-backed checks
check:process passed-with-gaps: 1 warning(s). 3 sub-check(s) did not run —
  recent plan references (LINEAR_API_KEY unset), orphan issues (LINEAR_API_KEY unset),
  Ready-for-Dev handoff keywords (LINEAR_API_KEY unset).
```

**The script itself is honest** — it names all three and labels its own verdict `passed-with-gaps`. The finding is not that the gate lies; it is **what those three checks happen to be**, which nobody has written down:

- **`Ready-for-Dev handoff keywords`** verifies that queued issues carry a coordination block — the exact invariant T1 promotion depends on, and the one `pull-work` Step 3 bounces on.
- **`orphan issues`** verifies every issue belongs to a project.
- **`recent plan references`** verifies plan docs named by issues resolve.

So while Linear is down, **the automated guard on coordination-block presence is down with it**, and any drift accumulating in the queue meanwhile is invisible until the key returns. That is a second-order cost of [#973](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) that neither #973 nor #974 records.

**Scoped honestly, because the obvious stronger claim is false:** this does **not** silently weaken CI. `ci.yml:428–431` passes `secrets.LINEAR_API_KEY` and runs the step as `Process lint (advisory)` with `continue-on-error: true`, so the CI path is both provisioned and structurally unable to fail a PR. The exposure is local and lane-side only. **Not filed as a ticket** — it is a consequence of #973, resolves the moment #973 does, and the process throttle routes it to the retro rather than to a new ticket.

### Finding 2 (new) — the weekly retrospective's PR is conflicted, auto-merge cannot land it, and its author has exited

[PR #1822](https://github.com/christianspliid-ui/threadbare/pull/1822) (`docs/retro-2026-09-06`) is `mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`, **with auto-merge already armed** — which means it will sit indefinitely, because armed auto-merge cannot resolve a conflict.

Cause, measured rather than inferred:

```
merge-base                      = 5c37c7dd
files changed on the branch     = 7, including Docs/impediments.md
files changed on main since     = Docs/impediments.md   ← the only one
```

A single-file conflict on `Docs/impediments.md`: the retro appended #974 while [PR #1821](https://github.com/christianspliid-ui/threadbare/pull/1821) appended #973 to `main` at 11:29Z. `.gitattributes` grants that file `merge=union`, but **GitHub's server-side merge ignores `.gitattributes`** — the documented CLAUDE.md case, whose documented fix is `git merge origin/main && git push` from the branch, never the web resolver.

**What is stranded:** the retro's five process improvements (`CLAUDE.md`, `pull-work`, `testing-patterns`, `verification-gates`, the task registry) and impediment #974. **Nothing is at risk of loss** — every commit is pushed to `origin/docs/retro-2026-09-06`; the work is blocked, not endangered.

**Not resolved by this lane, deliberately.** Pushing a merge onto another lane's branch is executor work, and "never implements" is the invariant that keeps this lane from writing over a session it cannot see. The cost of waiting is one command; the cost of a lane learning to push to other lanes' branches is the hazard the non-negotiables exist to prevent. Recorded here so it is not re-litigated next run.

**Why nobody else has it:** the retro lane exited, the pickup lane is dead on the Linear outage, and the briefing's *"no PRs waiting to merge"* line was written at 11:26Z — **before this PR existed at 11:34:57Z** — so that line is now stale rather than wrong.

### Redundancy — assessed this sweep, and both standing findings are closed

Not a reachability result offered in place of a redundancy one: this is the judgement pass, and it was run.

**The last sweep's own filed finding is verified resolved, not assumed.** THR-1409 reported three worldgen constants declared twice with disagreeing values, the tuning panel wired to the copy nothing read. On `origin/main` today each has exactly one owner, at the values the generators actually use:

```
src/engine/worldGenData.ts:10  RIVER_MIN_LENGTH     = 4
src/engine/worldGenData.ts:16  LAKE_SIZE_MAX        = 5
src/engine/worldGenData.ts:17  GREAT_LAKE_SIZE_MAX  = 12
git ls-tree origin/main -- src/engine/terrainPipeline/   → empty (retired by THR-1418)
```

The second pair from the same family (`TEMP_ALTITUDE_PENALTY`) is also single-owner, at `src/engine/worldgen/constants.ts:143`.

**Both 09-04 retirements are clean, checked at the leftover level rather than at the headline.** Every surviving `terrainPipeline` reference is comment prose documenting the retirement plus one **negative assertion** (`queryByText('src/engine/terrainPipeline/types.ts')` → `toBeNull()`) that guards the regression. The tension reveal (THR-1168) has **zero** references in `src/` or `scripts/`. Half-finished retirements are the usual source of new redundancy; these are not that.

**No new redundancy candidate this sweep** — and that is a measured result, not a skipped pass. It is also the expected one: `main` advanced by a single docs commit in the two days since the last pass, because the machine was off for 45 of them.

### Stalled work, `In Design`, and hand-created `In Dev`

**All three unmeasurable this sweep — Linear unreachable.** Each reads `stateHistory`, assignees or column membership off the board:

- **Stalled work** (`ORCH_STALLED_PICKUP_THRESHOLD`) — not measured. `classifyInDesignItem` in `scripts/stale-claim-sweep/index.ts` is the executable predicate and it is Linear-backed too, so the twice-daily sweep is dark for the same reason.
- **`In Design` split** — not measured. The `0 live` line is deliberately **not** printed: its whole value is as a signal that T2 is free to stage, and printing it unmeasured is the false-clean this tier exists to catch.
- **Hand-created `In Dev`** — not measured.

**One Linear-independent substitute was run, and is labelled as a substitute rather than as the check it stands in for.** `gh pr list` returns exactly one open PR — #1822 above. No other branch is waiting, so no work is stalled in the merge queue; this says nothing about work stalled on the board.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is **Sunday**. Nothing is said about it rather than repeating a stale result.

## Escalations

- **The Linear outage is the run's single escalation, and it is already correctly owned.** Raised to Christian above with both remedies and the three-lane count. **No Discord question was posted**: this is not a direction question, it has no ambiguity needing his judgement, and the same ask now reaches him through the briefing — a second channel would be noise, not redundancy.
- **A correction to #973, in Christian's favour.** That row warns that `keep-work-flowing-cc` is Linear-fed too, so *"the usual escalation channel is very likely dead in the same window."* **Measured: it is not.** The briefing published at 11:26Z with a full body, and its Queue section states the outage plainly and marks every carried ticket state unverified. The channel degraded honestly rather than failing — so `## Needs Christian` above will reach him on the next refresh, and the outage does not hide itself.
- **PR #1822 needs one command from any session with a worktree** — `git merge origin/main && git push` on `docs/retro-2026-09-06`. Not this lane's to run; recorded for whoever runs next.
- **Nothing parked.** No promotion was deferred, because none was evaluated.
