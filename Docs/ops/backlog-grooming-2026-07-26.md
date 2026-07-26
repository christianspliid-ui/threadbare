# Backlog Grooming — 2026-07-26

## Needs Christian

Nothing needs you. The Nudge Model program (THR-772) is blessed and moving; WS0 (THR-773) is handed off and buildable. No issue is parked on a creative or design-vision decision.

## Work in flight

* **THR-761** (aftermath conditions may never expire — `durationTicks` vs `ticksRemaining`) — In Dev, claimed, **live**: the session filed two deferrals (THR-783 `onFailureEffects` has no production readers; THR-784 condition-duration UI reads the wrong node) at 07:14Z, three minutes before this run. No PR open yet, and no checkpoint comment on the issue itself — the deferral timestamps are the only progress signal. Left untouched.

## Technical gates resolved this run

None required. No upstream-shipped issue awaiting a close, no stale claim, no PR idling at BEHIND (zero open PRs on the repo at 07:17Z).

## Counts by state

In Dev 1 · Ready for Dev 12 · Todo 26 · In Design 0 · Implementation Planning 0 · Idea 60+ (page capped) · Deferral-labelled in Ready for Dev 8, in Idea 16.

## Problems found and fixed

* **Encounter Experience was marked Done while holding the entire active Nudge Model program** — project `completedAt` 2026-05-14, yet it owns THR-772 (epic) plus WS0–WS5 (THR-773/774/775/777/778/779) and THR-782. Reopened to **Now**; `completedAt` cleared. This is the project the highest-priority Ready-for-Dev item belongs to, so a Done status here actively misreads the board.
* **Three projects sat in "Now" with zero open issues.** Every issue in each is Done or Canceled (verified exhaustively, single page each): **Marketing Site** (2/2 Done, last activity May) → **Done**; **Repo Health** and **Agent Coordination Protocol** → **Next** rather than Done, because both charters are explicitly ongoing ("keep them green", "home for issues that harden the protocol") — they are idle, not finished. Judgment call, flagged here for reversal if you'd rather see them closed outright.
* **No orphan deferrals in code** — 9 `TODO`/`DEFERRED` markers across `src/`, all 9 carry a `THR-` reference.
* **No orphan issues** — every issue in every queried state belongs to a project.
* **Roadmap cross-reference: no gaps.** Every `.planning/ROADMAP.md` Future Work pillar has Linear coverage (Procedural Content Library → Content Architecture; Social Systems Expansion; M3; Codex; culture seeding → THR-70; NPC workforce → THR-67). Nothing new filed — the staleness of those *status claims* is already tracked by THR-763, and THR-756 warns against weekly duplicates.

**Not a problem, reconciled:** this task's rule "Deferrals should be in Idea or Todo unless actively worked" contradicts CLAUDE.md § Prioritization, which makes `label:"Deferral" state:"Ready for Dev"` the *first* place an executor looks. CLAUDE.md wins; the 8 Deferral-labelled Ready-for-Dev issues are correct and were left alone.

## Pipeline status

Healthy — 12 items in Ready for Dev, so the hourly lane will not starve. Nothing can be picked up until THR-761 lands, though: WIP = 1 and that slot is occupied by live work.

**Recommended next pickup, in the documented order:** THR-783 / THR-784 first — both are `Deferral`-labelled in **Content Architecture**, a project with active work (THR-761), which is Prioritization rule 1. If the executor is instead cleared to carry program momentum, **THR-773** (Nudge Model WS0, the only High-priority Ready-for-Dev item, buildable design merged as PR #890, gates already Allow) is the rule-3 pick.
