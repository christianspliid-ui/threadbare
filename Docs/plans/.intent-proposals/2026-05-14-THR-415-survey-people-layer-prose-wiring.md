# Action Proposal — THR-415 Survey people-layer prose wiring

## intent_quote

> ## Context
> THR-398 (Survey collapse) shipped `survey-prose-tables.ts` with mood bucket data, faction-presence grammar, and named constants. HexChronicle already renders the people-layer section when `hexRevelation.people === true` — the data tables are in place.
>
> ## What's deferred
> Wiring `enrichProse` (or a hex-level equivalent) to generate dynamic people-layer summary prose when a Survey succeeds. Currently, HexChronicle renders static content-table strings (CULTURE_LOCATION_PROSE, FACTION_CONTROL_PROSE). The survey-prose-tables constants exist but are not yet consumed by any resolution path.
>
> ## Why deferred
> `enrichProse` in `src/engine/proseEnrichment.ts` takes a `NarrativeContext` with `agentName`, `agentId`, etc. — it is agent-centric and not wired into the hex action resolution pipeline (`hexActionBridge → unifiedActionResolution`). Plumbing hex-level data (hexCol, hexRow, factionPresence, unrest) into a prose generation call at resolution time requires a design pass on the hex-level prose API.
>
> ## Done when
> * A hex-level prose function (or extended NarrativeContext) produces dynamic Survey summary prose using `POPULACE_MOOD_PHRASES` and `FACTION_PRESENCE_VERBS`
> * The prose is surfaced in HexChronicle or as a TickEvent chronicle entry on Survey success
> * No hardcoded strings — all tuning constants come from `survey-prose-tables.ts`

*(Source: Linear issue THR-415, body. Labels: `Deferral`. Project: Content Architecture. Parent: THR-398.)*

## scope (what this plan does)

Builds a new hex-scoped pure prose composer (`src/engine/surveyProseComposer.ts`) that reads hex-level graph data — aggregate location unrest, faction presence via `getHexFactions` — buckets it, and assembles a Threadbare-voice prose band from the already-shipped `survey-prose-tables.ts` tables (`POPULACE_MOOD_PHRASES`, `FACTION_PRESENCE_VERBS`, `SURVEY_LOCATION_DESCRIPTORS`). Surfaces that band as a new additive `survey_completed` TickEvent emitted at `hex.survey` resolution success in `unifiedActionResolution.ts`, routed through `notificationRouter.ts` to the existing event feed. Adds six named constants + one connective table to `survey-prose-tables.ts`, one additive `TickEvent.type` union member, and one `SurveyProseComposedTrace`. Resolves the 0–100 (location unrest) vs 0–1 (table thresholds) scale mismatch via an explicit `UNREST_SCALE_MAX` constant. Deliberately does NOT touch `enrichProse`/`NarrativeContext`.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT extend `NarrativeContext` or modify `proseEnrichment.ts` — the agent-centric prose pipeline is untouched (rejected as a category error, §2 Option A).
- Does NOT change HexChronicle's existing static people-layer rendering (`cultureProse`, `factionProse` from `CULTURE_LOCATION_PROSE`/`FACTION_CONTROL_PROSE`). Swapping HexChronicle to the dynamic composer is filed as deferral §12.1 — a live-view-vs-cast-snapshot model decision deferred on purpose.
- Does NOT implement the "named-mortals band" (`{namedMortalsList}`) from THR-398 §5.1 — `survey-prose-tables.ts` has no mortal-name table and THR-415's "Done when" does not mention it. Surfaced for user confirmation in plan §13, filed as deferral §12.2.
- Does NOT implement the `read_currents` / Sphere Cartography soul-layer prose band (THR-398 §5.2) — out of scope, flagged as deferral §12.3.
- Does NOT add a new tick phase, new orchestrator hook, new modal, or new HexMap signifier.
- Does NOT modify the Survey verb's mechanics, cost, rarity, or layer-reveal behaviour (all shipped by THR-398).

## impact_class

Reversible — new module + additive union members + additive constants; no behaviour removed, no file rewritten, no external system touched. Worst case is a malformed prose band in the event feed, fixable by reverting one additive block.

## evidence cited

- **Linear issue:** THR-415 (parent THR-398)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` §3 (prose-first UI — directly served); `Vision/00-north-star.md` (mortal-loop bridge — partially served; named-mortals half flagged as deferral)
- **UL terms touched:** none new — "Survey", "people layer", "unrest", "faction presence" all already in UL/canon. No `UL-proposal` needed.
- **Canon pages consulted:** `Docs/canon/prose.md` (Threadbare voice, referenced for the `SURVEY_PEOPLE_CONNECTIVES` authoring); THR-398 plan doc `Docs/plans/2026-05-12-thr-398-survey-collapse.md` (parent direction)
- **Prior plan docs this builds on:** `Docs/plans/2026-05-12-thr-398-survey-collapse.md`; `Docs/plans/2026-04-16-systemic-wiring-guide.md` (Capability 1, enrichment placeholders)
- **Rejected approaches considered and dismissed:** (A) extend `NarrativeContext` with hex fields — category error, agent-scoped context carrying hex data; (C) generate prose inside HexChronicle at render time as the primary surface — creates a live-view-vs-cast-snapshot staleness ambiguity. Both documented in plan §2.

## load-bearing decisions touched

- **"Everything is a graph node/edge."** Respected — the composer reads graph nodes/edges (locations, `controls` edges via `getHexFactions`); adds no relational tables.
- **"Agent position is a three-tier model: hex → location → sublocation."** Respected — the composer resolves to the hex level by aggregating over locations in the hex (`getLocationsInHex`), the canonical upward-resolution pattern.
- **"The world graph is mutated in place — never depend on graph object identity."** Respected — the composer is pure/read-only over a graph snapshot; it performs no mutation and no memoisation keyed on graph identity.
- **"No inventing node types without verification."** Respected — no new node types; `survey_completed` is a `TickEvent` type (an existing event union), not a graph node type.
- No load-bearing decision is being *changed*. All are respected; none require High-risk classification.

## high-impact files touched (from Codesight / grep)

- `src/types/gameState.ts` — 176 importers (per CLAUDE.md high-impact list). Change is **additive only**: one new string literal in the `TickEvent['type']` union. No removal, no rename. Per CLAUDE.md Blast Radius rule, additive-only changes to a high-impact file do not require a Blast Radius escalation section, and the plan doc states this explicitly (§1, §3.3).
- `src/types/trace.ts` — ~156 importers. Change is **additive only**: a new `SurveyProseComposedTrace` interface added to the trace union. No existing trace modified.
- All other touched files (`unifiedActionResolution.ts`, `survey-prose-tables.ts`, `notificationRouter.ts`, `revelationResolver.ts`, `EventLog.tsx`, `GameView.tsx`) are below the 100-importer threshold.

## kill criteria

The plan was wrong if, after implementation: (1) the assembled prose band reads as concatenated fragments rather than grammatical Threadbare prose — caught by the §15 grammar test and the §9 closeout screenshot; (2) the unrest normalisation produces a wrong mood bucket because location unrest is not actually on a 0–100 scale everywhere — caught by the §15 per-bucket test and CLI smoke; (3) the `survey_completed` event floods the feed (Survey cast more often than expected) — caught at playtest, mitigated by `SURVEY_EVENT_SIGNIFICANCE = 0.4` keeping it low-priority and filterable. If any fires: the entire change is one new module + additive members — revert the `unifiedActionResolution.ts` block and the union member; the composer can stay dormant (zero importers) until re-approached. If the named-mortals scope question (§13) comes back "should have been in THR-415", that is a follow-up issue, not a rework of this one.

## explicit user sign-off

N/A — Reversible impact class, not High-risk. This is a deferral wiring issue inside the already-settled THR-398 direction; no new vision call is made. The one judgment item (named-mortals scope) is surfaced non-blocking in plan §13 for the user to redirect if desired, not decided unilaterally.

## author notes for the judge

- This is a `keep-work-flowing` Cowork session pickup. THR-415 was the highest-ranked actionable item: a `Deferral` in an active project (Content Architecture) whose parent (THR-398) has shipped, so the creative direction is locked and no project-level brainstorm with the user is needed — only a wiring/architecture design pass, which is what THR-415 explicitly asks for ("requires a design pass on the hex-level prose API").
- The issue's phrase "Wiring `enrichProse`" is, on inspection of the actual code, a slight misnomer — `enrichProse`'s `NarrativeContext` is irreducibly agent-centric. The issue itself hedges with "(or a hex-level equivalent)" / "(or extended NarrativeContext)". The plan takes the hex-level-equivalent fork and explains why in §2. I want the judge to check that this is a faithful reading of intent, not scope drift — my position is that the issue explicitly licensed this fork.
- The issue says the prose should be "surfaced in HexChronicle **or** as a TickEvent chronicle entry." The plan picks the TickEvent (the `or` is in the issue). HexChronicle integration is deferred (§12.1) with a stated reason. I flagged this prominently rather than burying it because a reader expecting the HexChronicle surface should see the swap immediately.
- The one place I am least certain: whether the "named-mortals band" was meant to be part of THR-415. THR-398 §5.1 clearly envisioned named mortals in Survey's people layer, but `survey-prose-tables.ts` shipped with no mortal-name table and THR-415's "Done when" only names `POPULACE_MOOD_PHRASES` and `FACTION_PRESENCE_VERBS`. I implemented exactly the "Done when" and surfaced the gap as a non-blocking §13 item + deferral §12.2 rather than guessing. If the judge thinks this should block, Escalate is the right call and the §13 text is the finding to pass up.
- Scale mismatch (location unrest 0–100 vs table thresholds 0–1) was caught during substrate verification and is handled explicitly via `UNREST_SCALE_MAX` (§3.4) — calling this out so the judge doesn't read the 0.30/0.60/0.85 thresholds as a bug.
