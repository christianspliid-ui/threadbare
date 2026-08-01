---
lane: daily-backlog-grooming
run: 2026-08-01
promoted: 0
filed: 0
resolved: 1
newFindings: 3
needsChristian: true
---
# Backlog Grooming — 2026-08-01

## Needs Christian

- **THR-883 — the Fable encounter-writing prototype is the board's single biggest blocker.** It has sat In Design since 2026-07-30 and holds **11 content tickets** shut (all WS5 batches + Meeting Batch A). It is not waiting on an agent: it needs one interactive chat session where you and Fable write a single encounter end-to-end until you sign off on the format. Nothing else unblocks it. **Recommendation: run this next** — every day it waits, the retrofit surface behind it grows.
- **THR-931 — one GitHub setting, ~2 minutes.** CI now has a fast "Docs gates" check that catches broken docs on documentation-only PRs, which previously merged with no checking at all. It needs ticking as a required check in branch protection for `main` to actually block a bad merge. Sequencing: PR #1210 must land first (it is green and in-flight). **Recommendation: do it once #1210 merges.**
- **THR-907 — slice verdict session** (five verdicts awaiting your ruling) is still open and unchanged since yesterday. Same shape as THR-883: creative call, no agent substitute.

## Work in flight

- **THR-909** — PR #1210 open, auto-merge armed, `Test · Typecheck · Build` still running. Reads `BLOCKED` only because that check is mid-flight; it will merge on green. No action.
- **THR-860** — deliberate hold behind THR-883, correctly left In Dev + unassigned. **New finding:** PR #1114 was left up-to-date on 07-30 and has since drifted to `DIRTY`. Not urgent, but the conflict cost grows while the hold lasts; THR-883's session should decide land-as-is vs re-author rather than letting it rot.
- **THR-931** — deliberate park awaiting the branch-protection change above. Correct shape, not a stale claim.

All three In Dev items are documented parks or live work — none re-routed. THR-860 in particular is **not** stale despite >24h silence: its hold comment explicitly forbids promotion to Ready for Dev.

## Technical gates resolved this run

- **THR-929** — was Ready for Dev *with an assignee*, which the `assignee:null` pickup query never surfaces (the THR-845 default-assignee quirk). Assignee cleared and verified via `get_issue`; the ticket is now claimable.
- **THR-937** — `list_issues state:"Idea"` reported it as Idea; `get_issue` shows it **Done** at 07:18Z, auto-closed correctly by PR #1214. Stale-list quirk, not a board defect. No action. Its fix (autosync clearing loss-free untracked collisions) is live on `main`.

## Counts by state

In Dev 3 · Ready for Dev 58 · Todo 23 · In Design 1 · Implementation Planning 0 · Idea ~64. No orphan issues — every issue carries a project.

## Problems found and fixed

- THR-929 stray assignee — **fixed** (see above).
- PR #1114 drifted up-to-date → `DIRTY` while held — **flagged**, resolution belongs to the THR-883 session.
- **Encounter Format Migration** is status `Now` / priority `Urgent` but has zero active issues: everything is Done except THR-142 and THR-448, both Idea/Low. **Flagged, not mutated** — whether those two tails are still in scope is a planning call, not a technical one. Recommend `Done` or `Next` if they are backlog.
- Home tree sat 2 commits behind `origin/main`; the two untracked retro drafts were checked against `origin/main` and do **not** collide. Normal hourly lag, no intervention needed.
- ROADMAP cross-reference: every "Future Work" item already has a Linear counterpart (Phases 3–5 → THR-54/55/56, Social Systems, M3, Codex → THR-52, onboarding/culture/NPC/chain-reactions → THR-72/70/67/68). **Nothing to file.**

## Pipeline status

Queue is deep and healthy — no gap. **Recommended next pickup: THR-934** (Urgent, unassigned, `Blocked by: nothing`, coordination block posted): `?spawn` encounters have no continuation, steps 2+ resolve silently. Its three siblings THR-932/933/935 (all High, filed today) serve the same slice-testing loop; THR-935 is mutex with THR-934 (both edit `GameView.tsx`), THR-932/933 are parallel-safe. Note the deferrals-first rule remains unreachable as THR-871 documents — all Ready-for-Dev deferrals are Low priority, so the lane's priority sort never reaches them.
