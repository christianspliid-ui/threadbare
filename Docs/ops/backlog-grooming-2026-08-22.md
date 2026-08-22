---
lane: daily-backlog-grooming
run: 2026-08-22
promoted: 0
filed: 0
resolved: 0
swept: 3
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-22

## Needs Christian

1. **Two tickets have been waiting on a yes/no from you since 2026-08-17/18, and the surface that was supposed to show them has been dead since Thursday evening.** Nothing is broken in either ticket — both are finished up to the point where only you can answer.
   - *Are these two encounters worth meeting a second time?* — [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · ticket [THR-1130](https://linear.app/threadbare/issue/THR-1130). A yes releases the remaining nine encounters; a no tells the lane what the bar is still missing.
   - *Should committing a hand of nudge cards carry ~1.6 seconds of held breath before the outcome lands?* — ticket [THR-1168](https://linear.app/threadbare/issue/THR-1168). Either answer closes it. **My recommendation: no** — 1.6s unskippable on every commit turns tense into waiting fast, and the sound is recoverable from a retirement note if you change your mind.
2. **One Linear setting only you can flip** — disabling the native GitHub integration's auto-assign, which keeps silently un-parking finished tickets and hiding their questions from you (6 occurrences, cause settled). Ticket [THR-1190](https://linear.app/threadbare/issue/THR-1190) carries the write-up; same settings surface as the auto-close toggle you already did.

## Work in flight

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130)** (In Dev, parked) — batch-1 six retrofitted, re-passed and deployed; the camp seven + sequels (9 of 15) remain, gated on the sample verdict above.
- **[THR-1168](https://linear.app/threadbare/issue/THR-1168)** (In Dev, parked) — registration cue retired and shipped ([PR #1534](https://github.com/christianspliid-ui/threadbare/pull/1534)); tension reveal awaits the feel verdict above.

## Technical gates resolved this run

- **Applied the `Parked` label to both In Dev tickets** ([THR-1130](https://linear.app/threadbare/issue/THR-1130), [THR-1168](https://linear.app/threadbare/issue/THR-1168)), verified by re-query. The stale-claim sweep had scheduled both for auto-release to Ready for Dev (THR-1130's deadline had already passed at 01:45Z). Release would have destroyed the `assignee: null` ∧ `In Dev` park shape — the only shape `keep-work-flowing-cc` surfaces under `## Needs Christian` — hiding both questions and leaving two verdict-blocked tickets claimable. `Parked` is the sweep's own documented opt-out; reasoning posted on both.

## Counts by state

In Dev 2 (both parked) · Ready for Dev 4 · Todo 20 · In Design 2 · Implementation Planning 0 · Idea 72 · Projects: 6 Now, 5 Next, 4 Idea, 20 Done.

## Problems found and fixed

- **~35h scheduled-lane outage, 2026-08-20 19:57Z → 2026-08-22 07:10Z.** Last briefing publish on `ops` is `749eba25` (08-20 21:56 local); every hourly lane then re-woke together at 07:10:37Z today. Consequence: Christian's only surface was stale for a day and a half while both parked questions sat unanswered; this lane missed 08-21 entirely and `weekly-retro` missed its Friday slot (firing late today). **Environment, not a lane defect** — no ticket, and the machine being off is not something an agent fixes. Recorded here so the gap in the report series is explained rather than read as a lane stall.
- **`tb-opus-pickup` and `tb-orchestrator` remain disabled** since 2026-08-19 at Christian's request. Their silence is deliberate; no promotion happened this run and none should have.
- Orphan issues: **none** — every issue in every queried state carries a project. State/priority contradictions: **none** (all `Now` projects are High; no active-state issue sits in an `Idea`/`Next` project).
- **Flagged, not acted on:** project *Plan Cross-Linking Infrastructure* (status Idea) contains zero issues in any state — empty rather than complete, so `Done` would be the wrong close. Needs a human call to archive. [THR-790](https://linear.app/threadbare/issue/THR-790) has sat In Design 7 days — borderline, watching.
- Roadmap cross-reference: all `.planning/ROADMAP.md` Future Work items map to live Linear issues (Phases 3/4/5 → THR-54/55/56; rival activation → THR-66 Done; doom → THR-293 Done; Codex → THR-52). Nothing to file.

## Materiality sweep

In-scope tickets swept: **3** (Ready for Dev + Todo, labeled `Infrastructure`/`Improvement` or in Continuous Improvement). Canceled: **0**. Consolidated: **0**.

- [THR-1190](https://linear.app/threadbare/issue/THR-1190) — **stands.** Clears the bar on recurrence (6 logged occurrences, ≥2/week) and on cost (~30–45 min per recurrence plus the standing risk of a finished ticket's question going unseen). Carries a real cost/benefit line. This run independently confirmed the failure mode is live.
- [THR-1134](https://linear.app/threadbare/issue/THR-1134) — **stands.** Filed at Christian's explicit request, Engine + UI pillars, player-facing tooling. Sits in Continuous Improvement by filing convenience, not because it is process paperwork.
- [THR-1114](https://linear.app/threadbare/issue/THR-1114) — **stands, with recorded doubt.** The `Improvement` label pulled it into scope, but its substance is a cosmology/content decision that feeds prerequisite checks and scoring — product work, explicitly carved out of cancellation. Low priority is correct; the label is arguably wrong. Left alone rather than relabeled: not worth a write on a judgment this thin.

`0 canceled` is the finding — the queue is small and every in-scope item survived the magnitude test on its merits.

## Pipeline status

Ready for Dev holds **4 items, all `Deferral`, all Low**: [THR-1183](https://linear.app/threadbare/issue/THR-1183), [THR-1184](https://linear.app/threadbare/issue/THR-1184), [THR-857](https://linear.app/threadbare/issue/THR-857), [THR-1133](https://linear.app/threadbare/issue/THR-1133). **Zero product work on the shelf.** With the executor lane paused this starves nobody today, but it is the state the queue will be in the moment it resumes — and per CLAUDE.md the fix for an empty shelf is upstream supply, not more grooming. The closest real product work is [THR-1156](https://linear.app/threadbare/issue/THR-1156) (Urgent, typed game-state architecture, ratified 2026-08-17) with its wayfinder map [THR-1157](https://linear.app/threadbare/issue/THR-1157); it needs a design session, not a pickup. **Recommended next pickup when lanes resume: none from Ready for Dev** — answer the two parked questions first, since both unblock real content volume.
