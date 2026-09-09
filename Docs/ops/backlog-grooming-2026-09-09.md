---
lane: daily-backlog-grooming
run: 2026-09-09
promoted: 0
filed: 0
resolved: 1
swept: 1
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-09-09

## Needs Christian
**One yes/no unblocks the only running content program — and right now nothing else can start.** The Encounter Factory's batch-2 brief is drafted and waiting on you ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md)): *is repair-in-place still what you want for the camp six, or has that band earned re-rolling from fresh premises?* They were written in July under the old prose doctrine. **Recommendation: repair in place.** The brief measured the damage as smaller than the ticket claims — ~20 of the 37 warnings are one-word lexicon additions, only nine are real rewrites — and the consequence hands it rolled force two omen emitters, a condition and a membership change into a corpus that currently has one of each. Re-rolling buys fresher premises and spends the batch on ground repair already covers. Your answer also releases [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine), which is held in Todo on the same gate.

*For veto, not action:* I closed [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants) (verb × object undertakings) as Done — its work shipped under THR-1403 on 09-07 and it had no closer of its own. Reasoning below; one word reopens it.

## Work in flight
- **THR-1130** — correctly parked, assignee null, waiting on the ask above. Nothing in flight; no `src/` touched since 09-04.
- **THR-1392** — closed this run (see below). In Dev is now 1.

## Technical gates resolved this run
- **THR-1392 → Done, `Parked` cleared.** Verified against `origin/main`, not the comment trail: `UNDERTAKING_MODEL = 'cells'` (`strategic-action-constants.ts:962`), PR #1852 merged as `4c5c59b6`, the six verbs live at `strategicAction.ts:40`, the four retirements real (`undertaking-kinds.ts:109` holds only the tombstone). The 09-08 attended session recommended exactly this and held it on a reason — *"In Dev with an assignee"* — that stopped being true on 09-04. Shipped-under-a-sibling's-id means no `Fixes THR-1392` exists and nothing would ever close it.
- **THR-1393 — vocabulary correction posted.** Its Done-when names `survey` and `undo`, neither of which is a verb any more (`observe`, `change:lower`/`destroy`), and describes a seven-type registry that is now fourteen world-object kinds with `room`/`attachment` retired. Ticket still correct in substance and still open — an executor reading it literally would chase symbols that are not in the tree.

## Counts by state
Idea 72 · Todo 44 · In Design 2 · Implementation Planning 0 · **Ready for Dev 0** · In Dev 1 (parked).

## Problems found and fixed
- No orphan issues — every issue across all six states carries a project.
- No completed-but-open projects; no Now/Discovery project below High.
- Roadmap cross-reference: every `.planning/ROADMAP.md` Future Work item has Linear representation (phases 3–5 → THR-54/55/56; social → Social Systems Expansion; economy → M3; codex → THR-52; doom → THR-79 lineage). **Filed 0** — the shelf's problem is not missing tickets.
- **CLAUDE.md prioritization rule 1 is inert today:** "deferrals in active projects first" has zero eligible items, because Ready for Dev is empty. Adjacent to [THR-871](https://linear.app/threadbare/issue/THR-871/claudemds-deferrals-first-prioritization-rule-is-unreachable-the-lane); not re-filed.

## Materiality sweep
In-scope tickets swept: **1** (THR-1134 — Continuous Improvement project; no other Ready-for-Dev/Todo item carries `Infrastructure` or `Improvement`). Canceled: **0**. THR-1134 (shareable game-state snapshot) stands on question 1 — it is a director-requested capability closing a real gap (no serialization exists, and `window.__DEBUG` is stripped from the deployed build where Christian actually plays), three-pillar, and the fix is not smaller than the ticket. It carries no cost/benefit line, but the Rule-0 minting bar governs lane-minted process tickets, not a product capability the director asked for; demoting it would be a form check firing on the wrong target. Consolidated: 0. **The sweep found nothing to cut, and that is the honest result — the queue's problem is emptiness, not bloat.**

## Pipeline status
**The executor lane has nothing to pick up.** Ready for Dev is empty and the single In Dev ticket is parked on Christian. Closest to ready by a wide margin: **THR-1222**, one yes/no away. Behind it, the Todo shelf is *design*-blocked, not executor-blocked — THR-1287 (control upkeep is structurally impossible: nothing resets `neglectTicks`, so control is a timer, not a commitment, and the wiki promises otherwise), THR-1348 and THR-1393 all say "design decision recorded first". **This is a supply problem, and the supply that is short is design sessions, not tickets.** Recommend the orchestrator's T2 staging fire on: **THR-1156** (Urgent — typed game-state architecture, director-ratified 08-17, and the highest-priority unstarted item on the board), **THR-1155** (High — nations and named areas are rendered, not simulated), **THR-1287** (a shipped defect where the fiction and the code disagree).
