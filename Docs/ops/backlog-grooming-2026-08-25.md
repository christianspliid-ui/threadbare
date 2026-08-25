---
lane: daily-backlog-grooming
run: 2026-08-25
promoted: 0
filed: 0
resolved: 1
swept: 2
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-25

## Needs Christian
**The executor lane has nothing it can take, and all four gates are yours.** Ready for Dev is empty and every remaining In Dev item is a park waiting on you. In recommended order:
1. **The batch-1 sample verdict** ([THR-1130](https://linear.app/threadbare/issue/THR-1130)) — two of six retrofitted encounters, played and judged. This is the one that unjams the most: Batch 2 ([THR-1222](https://linear.app/threadbare/issue/THR-1222)) is sequenced behind it, and Batch 2 blocks the integrated slice checkpoint ([THR-1220](https://linear.app/threadbare/issue/THR-1220)). *Recommendation: do this one first — it is three tickets deep.*
2. **Approve the batch-2 brief** — `Docs/plans/encounters/retrofit-batch-2-brief.md`, landing via [PR #1600](https://github.com/christianspliid-ui/threadbare/pull/1600). Its scope was already pre-named inside the batch-1 brief you approved, so this is a confirmation, not a fresh decision. *Recommendation: approve alongside item 1.*
3. **One yes/no on feel** ([THR-1168](https://linear.app/threadbare/issue/THR-1168)) — should committing a hand of nudge cards carry ~1.6s of held breath before the outcome lands? Either answer closes it. *Recommendation: no — 1.6s unskippable on every commit turns tense into waiting fast; the timings get recorded so it stays recoverable.*
4. **One attended session** ([THR-1133](https://linear.app/threadbare/issue/THR-1133)) — six owed 1920×1080 captures, now including THR-1095's new focus ring. Unattended runs cannot start a dev server, so this cannot be discharged by any lane. *Recommendation: bundle it into whichever sitting you do item 1 in — same `npm run dev`, same viewport.*

## Work in flight
- **THR-1130** (High, Content) — batch 1 shipped; blocked solely on your sample verdict. Park correct.
- **THR-1168** (Low, UI) — registration cue retired and shipped; only the audio yes/no remains. Park correct.
- **THR-1133** (Low, UI) — nine passes / 19 captures specified, zero takeable unattended. Park correct.

## Technical gates resolved this run
- **THR-1216** (director ruling, "does siege go first?") → **Done**. The ruling was given 2026-08-24 in Discord (`"Go agenda"`, approving the `border-perils` batch that opens on dangerous ground) and recorded in-ticket, but no state was written — so the park kept spending the briefing's single `## Needs Christian` slot on an already-answered question. Reasoning posted to the issue; verified by re-query.

## Counts by state
Ready for Dev **0** · In Dev 3 (all `Parked`, assignee null) · Todo 18 · In Design 2 · Implementation Planning 0 · Idea ~68.

## Problems found and fixed
- **New finding: Ready for Dev is empty and In Dev is all parks** — zero claimable work for the hourly executor. Not a grooming fault: every High item in the Encounter Experience chain is gated on Christian (above), so the fix is upstream supply, not tidying.
- Orphan issues: **none** — every issue in every scanned state carries a project.
- Completed-but-open projects: none. All `Now` projects are High; no `Idea`/`Next` project holds an active-state issue.
- **Stale design work (flagged, not touched):** THR-790 (Traits wave 2) has sat In Design 10 days; THR-1002 (card grammar) 6 days and will cross the line tomorrow.
- Unclaimable deferrals: n/a — Ready for Dev holds nothing to check.
- Legacy roadmap cross-reference: `.planning/ROADMAP.md` Future Work is fully covered in Linear (THR-54/55/56, THR-66 Done, THR-74 Done, M3 project, THR-52/67/68/70/72). Nothing to file.

## Materiality sweep
In-scope tickets swept: **2**. Canceled: **0**. Consolidated: 0.
- **THR-1114** (`Improvement`, Low) — *stands*, on the product-work exclusion. The `Improvement` label is what pulled it into scope, but its substance is content/cosmology correctness: `sphereAffinity` is read by prerequisite checks and scoring, not only by the Codex, so choosing the two replacement Spheres changes behaviour. Doubt recorded: it does fail the ≥1h/corrupted-artifact/3× bar, and would have been canceled on question 1 alone had scope been read by label.
- **THR-1134** (Continuous Improvement, High) — *stands*. Filed at Christian's explicit request from an attended chat session, and it delivers a real Engine+UI surface on the deployed build, not a receipt. Doubt recorded: it carries no cost/benefit line, so the Rule-0 minting bar would demote it to Idea — I judged that clause aimed at lane-self-spawned process work, and burying a director's own ask would be the worse error.

## Pipeline status
Nothing is promotable without a Christian answer. The closest genuinely-ungated work is the **Content Architecture Wave-1 design pair** — [THR-1212](https://linear.app/threadbare/issue/THR-1212) (shared anchor machinery) and [THR-1213](https://linear.app/threadbare/issue/THR-1213) (hunger vocabulary unification), both High, both plan-doc tickets under the Urgent [THR-1156](https://linear.app/threadbare/issue/THR-1156) epic. Recommended next pickup: a **design session** on THR-1212, which needs no gate the board is waiting on. Promotion is the orchestrator's T1/T2 call, not this lane's — flagging, not moving.
