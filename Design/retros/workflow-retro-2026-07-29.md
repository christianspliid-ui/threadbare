# Workflow Retro — 2026-07-29

Covers 2026-07-22 → 2026-07-29. Compares against `Design/retros/workflow-retro-2026-07-22.md` (the THR-677 baseline week).

## Needs Christian

Nothing needs you directly this week — the one live process defect found (below) already has an owner (the orchestrator/pickup lane) and a filed ticket; no creative or design-vision call is pending.

## Throughput

- **~94 issues reached Done in the last 7 days** (`state:"Done" updatedAt:-P7D`, paginated and filtered to `completedAt` actually inside the window — the raw query returns issues merely *touched* this week, some completed as far back as 2026-06-12, so a naive count of the first page overstates this by counting stale Done issues a sweep re-touched). This is ~3.2× last week's 29-issue baseline.
- **Composition of the throughput:** the bulk of this week's Done issues are small, single-session audit/deferral tickets (dead trait refs, unreachable action cards, duplicate React keys, dead-code retirements) filed and closed same-day — evidence the drift-scan → orchestrator → pickup loop is running at high frequency, not evidence of scope creep. This is genuinely a strong week, not a counting artifact.
- **Queue-depth trend: healthy refill.** Last week's report flagged Ready for Dev hitting zero on 07-22 after a marathon session. This week it's back to **44 items**, refilled continuously by `daily-backlog-grooming`, `tb-orchestrator` T1/T2, and drift-scan filings — no stall.
- **Open-PR backlog: 1 open PR** (#1031, armed auto-merge, ~1 day old, `mergeStateStatus: UNKNOWN` pending lazy computation). No rot — a sharp contrast with the 07-22 report's 6-PR / 40-day-old-straggler backlog that THR-702/703 cleaned up.
- Run-outcome attribution (shipped vs. no-work vs. checkpointed per hourly `tb-opus-pickup` cycle) is still not derivable from Linear state + git log alone without per-run transcripts — same limitation noted in the 07-22 baseline.

## Findings filed

No new Linear issues filed this week — the one live defect found during this retro (below) is already tracked and owned; filing a duplicate would violate the "you file, others resolve" boundary in the wrong direction. Posted one corroborating comment instead (see below).

**Corroborated: THR-845** — "Orchestrator T1 promotion sets an assignee, so every promoted issue is invisible to pull-work's assignee:null pickup query." Filed today (2026-07-29 13:29) by the daily grooming/orchestrator lane itself, High priority, already in Ready for Dev. This retro's board scan directly confirmed it is **live and currently active**: of the 44 issues in Ready for Dev, **8** (THR-582, THR-851, THR-850, THR-849, THR-846, THR-845, THR-848, THR-836) carry a non-null `assignee`, which makes them invisible to `pull-work`'s canonical `list_issues state:"Ready for Dev" assignee:null` pickup query. Real pickable queue depth is **36, not 44**. The bug ticket itself (THR-845) is one of the 8 — it is stuck by the exact defect it describes. Posted a comment with this count as fresh corroborating evidence; did not touch its state or assignee.

## Clean checks

- **Handoff quality: PASS (with one known exception).** Sampled several orchestrator-promoted Ready-for-Dev entrants this week (THR-621, THR-836, THR-763): all three carry full coordination blocks (`Suggested model`, `Parallel-safe with`, `Mutex with`, plus promotion evidence and Done-when evidence-shape notes) — the orchestrator's T1 promotion comment format is doing its job. The known exception is directly-filed-to-Ready-for-Dev tickets bypassing Todo, which is a separate, already-tracked gap (THR-836's own subject).
- **WIP/claim discipline: PASS.** Exactly one In Dev issue found (THR-621, assigned, WIP=1 respected). No cross-session leak, no manual `state:"Done"` writes by an executor found in this week's Done set.
- **Ship mechanics: PASS.** No evidence of a merged `Fixes THR-XX` PR whose issue failed to auto-close, and no false-close (bare-keyword) pattern spotted in this week's Done set — THR-738's line-anchoring fix (shipped last week) appears to be holding.
- **Rule 9 (no re-doing shipped work): PASS.** Spot-checked THR-621 against `git log origin/main --grep` — no landing commit exists, consistent with it still being genuinely open.

## Handoffs to the Friday retro

- This week's Done set is dominated by engine-substrate bug-hunt tickets (dead trait refs, dead action paths, unreachable branches) — a strong signal for the drift-scan/impediment-pattern analysis the Friday `retrospective` skill owns. Worth checking whether the audit-ticket generation rate is outpacing the fix rate or running roughly matched (queue depth suggests matched, but a dedicated pass would confirm).
- THR-621 ("Rival source contestation") has been In Dev since ~2026-07-28T12:28 with zero checkpoint comments posted since the orchestrator's promotion comment. Not old enough (per this retro's own checklist, no explicit hour threshold beyond "24h+") to call a violation outright, and it may be actively worked in a concurrent session right now — flagging as a soft watch item rather than a filed defect. If it's still checkpoint-less next week, that's worth a ticket.

## Notes

- **Grey zone — Done count precision.** As in the 07-22 baseline, `list_issues(state:"Done", updatedAt:"-P7D")` is not a clean "completed this week" query: `updatedAt` bumps on any touch (a bulk sweep re-touching old Done issues), and the two pages together contain issues completed back to 2026-06-12. I filtered by each issue's own `completedAt` timestamp against the 7-day window to get the ~94 figure — this is manual and doesn't scale past ~150 results (would need pagination + a proper server-side filter). Recommend, if this becomes a recurring pain point, a Linear API `completedAt` filter directly rather than `updatedAt` — but that's a nice-to-have, not filing it as this week's defect.
- **Corroboration vs. new-filing judgment call:** all three "findings" I turned up this week (THR-845's live impact, THR-836's scope, the THR-621 checkpoint gap) were either already-filed or below the bar for a new ticket. Interpreting the task's "file new issues for process defects" instruction as "file when something is un-tracked," not "always produce at least one filing" — a quiet week for new tickets is a sign the loop is self-correcting, not a sign this retro under-delivered.
