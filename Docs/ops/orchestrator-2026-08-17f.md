---
lane: tb-orchestrator
run: 2026-08-17f
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run f, ~08:27Z)

## Needs Christian

**Your new architecture map already has one question ready for you, and it needs nothing else first.** [What counts as a change the world *acts on*, versus one it merely writes down](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions).

Three classes are on the table: things a system reads today (the player sees them in full), things recorded now for a story to pick up later (the player is told it was recorded, and something must eventually use it or it lapses), and pure bookkeeping the player never sees. You have half-ruled this twice in opposite directions already — reach-reputation tallies invisible everywhere, but plot-hook-worthy recordings *"we need to make it clear to the player that that is what has happened"* — and this is the sitting that reconciles them into one rule the code can carry rather than a habit reviewers remember. It is a chat session, no prep, nothing built or waiting on it. Say **"work the map"** when you have the time.

The map's other three questions are not asks yet: two wait on [the bridge-chip fix](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) that is being built right now, and the throwaway prototype needs the anchor type that fix creates before there is anything to react to.

## T1 — unblock sweep

**Promoted 0.** Nothing was eligible. The two new director tickets from this morning's sitting are both real work and both correctly *not* queue work.

```
[orchestrator] T1 scan: Todo 19, Implementation Planning 0, Idea 1 (72h filter), Ready for Dev 2, In Design 1, In Dev 2
[orchestrator] T1 skip THR-1156: program epic, body says "no execution ticket files directly against it" — container, not queue work
[orchestrator] T1 skip THR-1155: wrong destination — body says "this is a design ticket — plan doc before code" → T2
[orchestrator] T1 skip THR-1157/1160/1161/1162/1163: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-902/THR-907: wayfinder:* labels → T1.5
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-1140: Idea, Low, dead-read finding → process throttle, retro batch not queue
[orchestrator] T1 hold: promotion ceiling not reached and not binding — no candidate was held back
```

**The two new tickets, with their evidence.** Both were filed by Christian in an attended sitting between 07:54Z and 08:23Z — three minutes before this scan — and both name their own destination in their bodies, so neither needed a judgement call:

- **[THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on)** (typed game-state architecture, program epic, Urgent) — a container and record for the four ratified distinctions. Its own text: *"no execution ticket files directly against this epic"*, and its deliverable is a charter, which the new map now is. Promoting an epic would put an unbuildable item at the top of the queue.
- **[THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)** (nations and named areas promoted to real game objects, High) — standing wrong-destination verdict in its own body: *"this is a design ticket — plan doc before code"*, and the load-bearing rule that new node types require full design before code applies to it directly. T2 input, and now the **top** T2 candidate (see below).

Unchanged declines, each re-checked this run rather than carried: **THR-1024** (blocker THR-966 still `Idea`), **THR-1148** (decision-complete; its revisit trigger is authored volume through the consequence draw, not a merge), **THR-1114** / **THR-1002** (wrong destination, T2 input), **THR-175** (unmet trigger gate, needs a design doc regardless), **THR-1140** (`Idea`, `Low`, dead-read finding — sub-bar under the process throttle, so a log row not a queue item), **THR-789 / THR-791 / THR-1043** (tracking epics or assigned to Christian), **THR-870** (parked by creative-director sequencing).

**Shelf at scan: 2 items, 1 of them non-`Deferral`** — [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) (Urgent, the chip pilot's second half) plus THR-1133 (`Deferral`). Executor is not starved: THR-1153 was claimed at 08:03Z and is In Dev with [PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520) open, and THR-1154 is queued behind it. **The promotion ceiling did not bind and held nothing back** — there was simply no eligible candidate.

**Scan-hole note, carried, ninth consecutive run.** The skill's § T1 step 1 issues two calls (`Todo`, `Ready for Dev`) while step 2 says *"for each `Todo` / `Idea` candidate"*, so `Implementation Planning` and `Idea` are in neither. Both arms were run again this hour: `Implementation Planning` was **empty** and the `Idea` arm surfaced only THR-1140, correctly declined. Under the process throttle this stays **logged, not filed**; the retro's membership predicate is unchanged — `Implementation Planning` unconditionally, plus `Idea` filtered to issues created within ~72h in a project with active work.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: roughly 3:1 product, holding.** Not recomputed — run d measured it over the same seven-day window and every completion since (THR-1145, THR-1147, THR-1152) is product, which moves the sample further in the product direction. The product pipeline is supplying; no corrective action indicated.

## T1.5 — wayfinder sweep

**Two open maps this run — a second one was charted at 08:04Z.**

**[THR-1157 — Typed game-state architecture: machinery + first wave](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map)** (new). Six children: **2 `Done`, 4 open.** Frontier is **2 tickets**, both HITL, computed live from native Linear relations rather than from the descriptions:

- **[THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** (`wayfinder:grilling`) — no blockers, no assignee, genuinely ready. **Surfaced to Christian above; this is the live ask.**
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — its only declared blocker, THR-1159, is `Done`, so it is frontier by the relation graph. **Stated honestly rather than surfaced as an ask:** the artifact it asks for is the pilot's anchor type applied to a second seam, and that type does not exist yet — it ships in THR-1153 (In Dev) and THR-1154 (queued). Surfacing it now would be an invitation to react to something nobody can build this week.

Off the frontier and correctly so: **THR-1160** (`wayfinder:research`) is blocked by both pilot tickets; **THR-1163** (`wayfinder:grilling`, wave-1 selection) is blocked by THR-1160. So the sequencing chain that carves this map up runs through the pilot landing first.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map)**. Children re-listed live: **8 total, 7 `Done`, 1 open.** Frontier is **1 ticket** — THR-907 (`wayfinder:prototype`, HITL), the standing slice-verdict ask. **Deliberately not restated to Christian this run**: it is already at the top of his briefing, and asking twice in one hour makes both copies easier to ignore.

**AFK burn-down: 0 tickets, `ORCH_WAYFINDER_AFK_MAX` (2) unspent.** Across both maps there is not one open `wayfinder:research` or `wayfinder:task` ticket that is unblocked — the only research ticket left, THR-1160, waits on the pilot by design. This lane does not touch grilling or prototype tickets.

## T2 — design staging

**Triggered, and bound — for the sixth consecutive run.** Shelf held **1 non-`Deferral` item** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). The floor fired.

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, so the first run after that re-surfaces it rather than re-staging.

**The candidate ranking changed materially this morning, and that is the substantive part of this tier.** Christian's architecture-first ruling, recorded verbatim on the new map — *"lets get it sorted. higest priority. new features can wait as they will just be implemented badly due to these issues"* — reorders what design supply the project wants next:

1. **[THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)** (nations and named areas as real game objects) — new top candidate. High, director direction with a verbatim quote, explicitly needs a plan doc, and it is the program's named first expansion beyond the pilot. **One caveat that matters:** the map states its *position in the wave* is THR-1163's call, and THR-1163 is blocked behind the pilot — so staging it today would pre-empt a decision the map deliberately holds. Recorded as the top candidate; not forced forward.
2. **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** (shareable game-state snapshot) — previous top candidate, unchanged and still valid.
3. **[THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** (card grammar) and **[THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere)** (sphereAffinity strays) — both feature-class, both now sitting below the architecture program by that ruling.

**One observation, agent-facing, deliberately kept out of the Christian section because it needs no action this hour.** The single design slot is held by THR-790, which is feature-class design — the exact class the morning's ruling says can wait. This lane staged it on 08-15, before that ruling existed. It has not been unstaged: freeing the slot buys nothing today, because the candidate that would take it (THR-1155) is itself waiting on the map's wave-order call. If THR-790 is still unpicked when the pilot lands and THR-1163 resolves, that is the moment the swap becomes worth one sentence from Christian, and the 20:29Z re-surface will put it in front of a run that can act.

**The shape of the constraint is unchanged and worth stating plainly:** the shelf is thin because execution is fast, not because promotion is failing. What is genuinely constrained is design supply, and the binding constraint is the `In Design` bound plus the map's own sequencing — not a shortage of candidates. Three are named and waiting. This lane deliberately does not author plan docs (Christian's ruling, 2026-08-06).

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` and carried the full detector pass plus the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health file, `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none are reported as clean.** Run d's standing set is carried unverified: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep** — run d assessed it four hours ago and logged three findings (the `SceneStatePanel` encounter-state duplicate, the `*IconGlyph` parallel representation path, the `composition-dsl` validation sub-island). Nothing a fresh judgement pass could see has changed since.

Worth one forward-looking line, because it is the kind of thing this tier exists to notice: the newly-ratified architecture makes **finding 2** — two representation paths for entity visuals, `resolveEntityVisual` versus the ad-hoc `*IconGlyph` string field at four live sites — a direct instance of ratified distinction 3 (*the referenceable-object vocabulary is generated, never hand-written*). It is already recorded as a redundancy finding and is now also candidate seam evidence for the wave-1 selection on THR-1163. Logged, not filed, per the process throttle.

## Escalations

None. No question was asked and nothing was parked. Every decline this run named its own evidence, and the one genuine ask went to `## Needs Christian` rather than Discord — it is a design sitting to schedule, not a blocker to unblock.
