# Workflow Retro — 2026-08-06

Covers 2026-07-30 → 2026-08-06. Compares against `Design/retros/workflow-retro-2026-07-29.md`.

## Needs Christian

**One new item, and it's the significant one.** Every scheduled Claude Code lane (`tb-opus-pickup`, `tb-orchestrator`, `keep-work-flowing-cc`) went completely silent for **~62 hours, Monday 08:40 to Wednesday 23:08** (2026-08-03 → 2026-08-05) — two full weekdays, not a weekend. GitHub's own infrastructure was fine throughout (the GitHub Actions-native `Stale Claim Sweep` workflow fired on its normal schedule the whole time); the silence is specific to Claude Code's local scheduler not invoking anything. Filed as **THR-1001** with full evidence and a monitoring-gap fix (a heartbeat check in the hourly briefing so a repeat surfaces within an hour instead of needing a weekly retro to notice). The root cause — was the machine asleep, was Claude Code not running, did Task Scheduler stop — is only diagnosable from your side; that half of THR-1001 is explicitly yours, not an agent fix.

Everything else this week is already flowing through its normal owner (THR-883's format-lock session and THR-907's encounter verdict are both carried in the hourly briefing already, unchanged by this retro).

## Throughput

- **~119 issues reached Done in the 7-day window** (`completedAt` between 2026-07-30 and 2026-08-06, cross-checked against two overlapping `updatedAt` queries since a live burst of closeouts landed while this retro was running — see Notes). Up from last week's ~94, despite losing ~62 hours to the outage above. The by-day breakdown shows why: 17–35 issues/day on the days the lanes were running, zero on 08-04, and a sharp catch-up burst from ~21:00 on 08-05 through the morning of 08-06.
- **Composition:** still dominated by `Infrastructure`/`Improvement` (55 + 55 of 111 sampled) and `docs-only` (26 of 111) — self-hosted process and drift-scan fixes, not scope creep. Consistent with last week's read; see Handoffs to the Friday retro for whether this ratio itself is worth a look.
- **Queue-depth trend: healthy, no stall.** Ready for Dev sat at 38 items mid-week and the hourly briefing reports 33 as of this morning ("up one from 32") — refilling as fast as it drains, matching last week's pattern.
- **Open-PR backlog: 1 open PR** (#1114, THR-860's civic-seats content batch). `DIRTY`/`mergeable: CONFLICTING`, but this is a **deliberate, well-documented hold**, not rot — see WIP/claim discipline below.

## Findings filed

**THR-1001** — "All scheduled CC lanes went silent for ~62 hours (Mon 08:40 – Wed 23:08) with nothing watching for it." High priority, Ready for Dev, Continuous Improvement project. Coordination block posted as first comment per THR-836's rule. Full quotable evidence (git log on both `main` and `origin/ops`, `gh run list` cross-check, weekday confirmation) in the issue body. Proposes closing the detection gap in `keep-work-flowing-cc`'s existing Freshness section rather than a new lane.

No other new findings — everything else this retro turned up either already has an owner (THR-883, THR-907, both live in the hourly briefing) or is a clean check below.

## Clean checks

- **WIP/claim discipline: PASS, and notably improved.** THR-860 has sat `In Dev` + assigned since 2026-07-30, parked behind THR-883 — in a pre-THR-927 world this would have been a WIP=1 deadlock (the exact `parked_wip_deadlock` failure class from prior retros). THR-927 shipped this week specifically to fix it: the WIP gate now counts in-flight *implementations*, not open claims. Verified live — THR-1000 (an Urgent test-budget fix) was claimed and worked to a shipped PR this morning while THR-860 sat untouched in the same state. A `Parked` label was also added to THR-860 today by the stale-claim sweep's documented opt-out, specifically so the 72-hour auto-release doesn't fire on a ticket that isn't actually stalled — a second, independent mechanism protecting the same case.
- **Handoff quality: PASS.** Sampled THR-860 (this week's longest-lived Ready-for-Dev entrant) in full: complete coordination block (`Suggested model`/`Parallel-safe with`/`Mutex with`/`Blocked by`), a THR-688-rule-A membership predicate, a plan-doc pointer in the description, and a granular Done-when. The pause/resume/park history on this single ticket (5 comments across a week) is itself a good specimen of the checkpoint discipline the coordination protocol asks for.
- **Ship mechanics: PASS.** `gh run list` shows the `Linear Auto-Close` workflow firing successfully on essentially every merge to `main` this week. No evidence of a merged `Fixes THR-XX` PR whose issue failed to close, and no bare-keyword false-close pattern in this week's Done set.
- **Checkpoint hygiene: PASS.** No issue found sitting at 3+ checkpoints with no ship and no explanation — the one long-lived case (THR-860) is a documented, opted-out hold, not silent drift.
- **Merge-state health: PASS.** Only one open PR, and it's correctly identified as a deliberate hold rather than rot (per THR-985, shipped this week specifically to stop this exact false-abandoned signal from reaching Christian hourly).

## Handoffs to the Friday retro

- The `Infrastructure`/`Improvement`/`docs-only` share of this week's Done set is even higher than last week's already-high share. Worth a dedicated check on whether the audit-ticket generation rate (drift scans, prune-candidate sweeps, orchestrator T3 architecture-health duty) is still roughly matched by the fix rate, or has started to outpace it now that THR-938's docs-only fast track is live and batch-draining.
- Several `Prune candidate` tickets (THR-950, THR-951, THR-952) and dead-reference findings (THR-956, THR-847) landed this week — a cluster worth the Friday retro's drift-scan lens rather than re-litigating here.

## Notes

- **Grey zone — mid-run data drift.** This retro's own session spanned a live closeout burst: the date advanced from 2026-08-05 to 2026-08-06 partway through data gathering, and dozens of issues transitioned to Done while queries were in flight (confirmed by re-querying `updatedAt:-P1D` and finding several issues with fresh `completedAt` timestamps that a `-P7D` snapshot taken minutes earlier had missed entirely). Handled by merging two overlapping queries and deduping by issue id rather than trusting either snapshot alone — same root cause as last week's `updatedAt` vs `completedAt` caveat, compounded by genuinely concurrent activity this time.
- **Why THR-1001 is filed as Ready for Dev despite naming a Christian-only root-cause step.** The ticket has two halves: root-causing the outage (his machine, not agent-diagnosable) and closing the detection gap (a clean, self-contained prompt-logic change to `keep-work-flowing-cc`). The second half doesn't depend on the first resolving, so it's cleanly pickable now rather than waiting in Todo for an answer that may never fully arrive.
- **Corroboration vs. new-filing judgment call, again.** As in the 07-29 report, most of what this retro turned up (THR-883's hold, THR-907's verdict wait, THR-860's park) was already tracked and surfaced correctly through the hourly briefing — filing a duplicate would have been noise. The one genuinely new, undetected thing was the scheduler silence itself, which is exactly the shape of finding this retro exists to catch: nothing else in the system was positioned to notice a *lack* of activity across all three lanes at once.
