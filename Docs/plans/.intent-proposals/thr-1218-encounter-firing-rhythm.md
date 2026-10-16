# Action proposal — THR-1218 encounter firing rhythm

## intent_quote

> "Rhythm works — prune later" — Christian, chat, 2026-08-10 (THR-907 firing verdict, recorded on THR-907)

> The verdict was ruled without free play, so "read it as 'the density is not obviously wrong', not 'the density is measured correct'. A later pruning pass may still narrow it." — THR-907 ruling record, 2026-08-10

> Ticket scope (THR-1218, chartered 2026-08-24 at THR-902 map close): "Design the selection/pruning model that narrows encounter firing down from the everything-fires posture — which encounters reach which threaded agents, at what rhythm, and what suppresses or spaces them." … "the first pruning session must start with natural-firing observation, not spawn links."

> Design request (attended board tidy-up, 2026-10-02): "1. A natural-firing baseline first. … 2. The pruning levers, as named constants: per-agent spacing, per-family cooldown, a density cap per attended tier, and what suppresses a firing. 3. Which rhythm calls are agent-calibrated and which are creative forks for Christian. … Sequence it after THR-1687."

## scope (what this plan does)

Measures the natural-firing baseline (three seeds × 600 ticks, no spawn links; audit committed). Records the firing posture that replaced "everything fires" (THR-1715's chores-never-ask plus story breath). Decides each lever the request named: spacing kept per mortal, no cross-thread budget, no per-family cooldown (measured unnecessary), no density cap (Law 29). Adds two measured fixes for paused (followed) mortals only: a story tellings cap (two per template per run, relaxed after a long drought) and a "restless road" (after six days without a story and none within reach, the mortal travels to a place that has one, with one Chronicle line). Lever hygiene for dead or unexported constants. A census script with predicates. Two build slices (S1 this ticket, S2 THR-1959).

## scope (what this plan does NOT do — explicit non-goals)

- No cap on the number of chapters or interrupts, per mortal, per tier or across mortals (Law 29).
- No per-family cooldown and no new `family` field on templates.
- No change for unthreaded or auto-mode mortals (the world's background texture keeps today's rules).
- No change to the story breath's length, to what counts as a chore, or to the Stage's hold rule.
- No new encounter content; no Vision edit.
- Does not decide whether following many mortals should stop the world less (fork F1, Christian's, raised after ship).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-1218 (S2: THR-1959)
- **Vision premises invoked:** `Vision/00-north-star.md` (witnessing, not steering), `Vision/01-core-loop.md` (density settlement 2026-07-04: cadence is texture, not a count ceiling), `Vision/02-non-negotiables.md` §1 (influence, never command)
- **UL terms touched:** none new (story chapter, chore/daily life, thread, attention mode are existing usage); "restless road" is player prose, not a UL term
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/game-design/laws.md` (Laws 9, 15, 24, 29, 42, 45), `Docs/design-system/laws.md` (2, 13, 14, 21, 43), `Docs/ops/player-complaint-classes.md` (PC-4, PC-5)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-03-thr-1715-the-first-asks.md`, `Docs/plans/2026-07-04-encounter-density-and-chapter-ledger.md`, `Docs/plans/2026-10-14-thr-1877-encounter-stage.md` (D2 hold rule), `Docs/plans/2026-10-01-thr-1687-cap-local-order.md`; THR-1804 repeat floor (status fragment `Docs/status/2026-10-10-thr-1804.md`)
- **Rejected approaches considered and dismissed:** density cap per tier (Law 29); world breath across mortals (THR-1715 decision 5: the action does not wait); per-family cooldown (measured 1/43); novelty weight only; one telling per run; reserved story cap slot; seeding stories at her location

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — respected: two new optional properties live on the existing `thread` edge (relationship-internal data, as THR-1715's `lastStoryChapterEndTick`).
- "No inventing node types" — none invented.
- "Agent position is three-tier via a single `located_at` edge" — the restless road moves the mortal through the existing movement path (forced travel), no new position mechanism.
- "Engine caches are owned per session" — no module-scope cache added.

## high-impact files touched (from Codesight)

`src/engine/phaseAgentDecision.ts` and `src/types/influence.ts` are touched; neither is on the ≥100-importer list (graph.ts, gameState.ts, unifiedAction.ts, traceBuffer.ts). `src/types/trace.ts` gains two union members (additive). `traceBuffer.ts` gets two entries in `TRACE_CATEGORIES` (additive, a list edit). No Blast Radius section: the edits are additive entries, not shape changes.

## kill criteria

- The census after S1 shows story chapters per seed falling below the baseline (18/10/13) by more than one → the tellings cap is too tight; lower `STORY_DROUGHT_RELAX_TICKS` or raise `PAUSED_STORY_MAX_TELLINGS`.
- After S2, a playtest log reports The First "keeps wandering off" or leaving home mid-story → raise `STORY_DROUGHT_TICKS` / `RESTLESS_ROAD_COOLDOWN_TICKS`; if that does not settle it, drop the restless road (S2 is self-contained behind its trigger).
- The family-repeat tripwire (>20% of story pairs) fires → revisit D3 with a family key.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- The request's "density cap per attended tier" is not built. That is deliberate: Law 29 [E] forbids caps, and the request predates the law's collation (2026-10-14). The plan says so in D1 rather than silently dropping it.
- The plan's thesis is that measurement turned the question around (too few distinct stories, not too many firings). Check that the baseline numbers support it: `Docs/audits/2026-10-16-thr-1218-natural-firing-baseline.md`.
- The baseline has one weakness stated openly: only The First is threaded headlessly, so "paused mortals" rests on three agents. D4 extends the rule to retinue by consistency (THR-1715 decision 4), not by measurement.
- The aftermath-only split (24/48) is not explained; S1 must explain it (D8). The plan does not build on either explanation.
- `FIRST_CHAPTER_REPEAT_FLOOR_TICKS` is renamed with a deprecated alias (NFP #6).
