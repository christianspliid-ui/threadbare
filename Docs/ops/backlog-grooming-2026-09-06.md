---
lane: daily-backlog-grooming
run: 2026-09-06
promoted: 0
filed: 0
resolved: 0
swept: 0
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-09-06

## Needs Christian
- **Re-authorize the Linear connector.** This run did no grooming: the session had zero Linear tools. `plugin:productivity:linear` came back in the requires-authentication list, and a scheduled run is non-interactive, so the OAuth flow cannot happen here. Linear worked on 2026-09-04 (that run made reads *and* writes), so this is a change, not a standing gap. **It blocks four lanes, not one** — grooming, `tb-orchestrator`, `tb-opus-pickup` and `keep-work-flowing-cc` all read the board first. Re-authorize from an interactive `claude` session or the claude.ai connector settings; nothing else in the delivery machine needs touching.
- **Caveat on how this reaches you:** `keep-work-flowing-cc` writes the briefing *from Linear*, so it is blocked by the same fault. `Design/briefing.md` has been frozen since Friday 15:54 and will not refresh itself. This report may be the only surface carrying the fault until the connector is back. Not the cause, so it is not re-diagnosed: `linear@claude-plugins-official` is `false` in `~/.claude/settings.json`, but it was already false before Friday's successful run. Noted only as a second Linear source that is off; I did not change it, as user settings sit outside this lane's authority.

## Work in flight
- Not readable — In Dev requires Linear. Last known (Friday's report): THR-1410 live claim; THR-1130 and THR-1392 parked on Christian gates. **No open PRs**, so nothing is stranded mid-merge.

## Technical gates resolved this run
- None. Every gate this lane resolves is a Linear state write.

## Counts by state
Unavailable. Last known (2026-09-04): Idea 70 · Todo 52 · In Design 2 · Impl Planning 0 · Ready for Dev 10 · In Dev 3.

## Problems found and fixed
- **Lane silence, 2026-09-04 16:28 → now (~45 h).** No `main` commit, no `ops` commit, no orchestrator run, no briefing refresh, and no 09-05 grooming report. Saturday and Sunday, so an idle machine is the likelier explanation than an incident — but it means the Linear fault above has been unreported for two days and will hit every lane at once when they next fire.
- Repo-side checks that do not need Linear, all clean: **deploy healthy** (`verdict=skipped`, live at `5c37c7dd`; only docs moved since). **Zero orphan deferrals** in `src/` — 9 `TODO`/`DEFERRED` comments, all carrying a `THR-` id. No untracked report residue (THR-1056 discipline holding). Carried from Friday, still unfixable without Linear: THR-1407's unset priority sorting it below six Low pixel fixes; THR-1222 still naming the retired brief path; the empty "Plan Cross-Linking Infrastructure" project.

## Materiality sweep
Not run — scope is `Ready for Dev` / `Todo` filtered by label, which needs Linear. **0 swept, 0 canceled** because the sweep could not execute, not because it judged and found nothing. Friday swept 7 and canceled 0.

## Pipeline status
Unknown from here. Friday left it healthy (10 Ready for Dev, one live claim) and no PR has opened or closed since, so the shelf is almost certainly intact. Recommended next pickup is unchanged from Friday: **THR-1168**, then THR-1411 and THR-1416. The real blocker is the connector, not the queue.
