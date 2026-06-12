# Action Proposal — Gameplay Observability KPI Harness

## intent_quote

> "also please assess if you need better instrumentation to analyse the gameplay going forward. the game is currently so complex that i cannot analyse the root causes of problems myself anymore. if you need more instrumentation please also put that in linear and get that built so we can make better decisions"

Preceding context (same conversation, approved analysis):

> "I especially feel that the way the game presents the activities of threaded agents to the player does not make it fun or engaging to follow and interact with as a player. this can have several reasons, maybe simply because the really cool encounters are not showing up regularly in the game when i try it or because there is not enough content, or we are not presenting it well enough in the UI, or we are struggling to test it."

## scope (what this plan does)

Adds an engagement-KPI layer to existing instrumentation: a pure KPI module (outcome distribution, template concentration/entropy, branching-fire rate, threaded-beat rate, resolution gap), an always-on encounter eligibility funnel (per-template considered/gated-by-which-prerequisite/scored/selected, session-owned on SimulationRuntime), surfaces (CLI `kpi` command, `__DEBUG.getKpiReport()`, DebugPanel tab), and a multi-seed batch report script emitting dated markdown with red/amber/green thresholds. Extends the existing balance-eval family; does not replace it.

## scope (what this plan does NOT do — explicit non-goals)

- Does not fix the 89% failure rate, branching reachability, or template repetition (those are THR-451/452/453, which consume this tooling)
- Does not gate CI on KPI thresholds in v1 (advisory only; gating deferred)
- Does not add any player-facing UI (DebugPanel/CLI/bridge are dev surfaces)
- Does not modify balance-eval's existing metrics or targets machinery
- Does not author or modify content
- Does not wire into the Friday drift scan (deferral candidate, logged at closeout)

## impact_class

Reversible. (All changes additive: new module, new counters behind runtime-presence checks, new CLI command, new script, one additive trace category. Trivially removable per kill criteria.)

## evidence cited

- **Linear issue:** THR-457 (related: THR-451, THR-452, THR-453, THR-347)
- **Vision premises invoked:** None directly — dev tooling. Serves NFP #2 (Inspectability) and protects NFP #5 (narrative quality) by making engagement regressions measurable.
- **UL terms touched:** Uses existing terms (encounter, template, threaded agent, unified action, outcome ladder). New term candidates "eligibility funnel" and "gameplay KPI" are dev-tooling vocabulary, not game-domain terms; no UL-proposal needed (flag at closeout if reviewers disagree).
- **Canon pages consulted:** `Docs/canon/process.md` context (via CLAUDE.md), `Docs/canon/encounters.md` (via encounter-system audit earlier this session)
- **Prior plan docs this builds on:** `Docs/plans/2026-04-02-agent-success-redesign-roadmap.md` (balance evaluator, phases 1–4 shipped); CLI/debug-bridge patterns in CLAUDE.md
- **Rejected approaches considered and dismissed:** growing BalanceRunSummary directly (muddies decision-forecast machinery); per-event funnel traces only (ring buffer evaporates); CI-gating in v1 (thresholds are first-guess)

## load-bearing decisions touched

- "Engine caches must be owned per session, not stored at module scope" — respected: funnel counters live on SimulationRuntime.
- "Everything is a graph node/edge" — not touched: counters are runtime telemetry, not world-model entities; no nodes/edges added.
- No new node types, no new edge types, no graph schema changes.

## high-impact files touched (from Codesight)

`src/types/trace.ts` / `src/engine/traceBuffer.ts` (traceBuffer: 106 importers per CLAUDE.md list) — **additive-only**: one new category string + one new trace interface. Plan doc contains a Blast Radius section. No other ≥100-importer file touched.

## kill criteria

Wrong if (a) report doesn't change tuning decisions within 2 weeks (not cited in THR-451/452/453 closeouts), (b) funnel slows tick loop >2% on the 30-tick smoke, (c) batch report unread for a month. Response: strip funnel hooks (additive), demote KPI module to CLI-only, retro entry.

## explicit user sign-off

Not required (Reversible class). For the record, user approved direction verbatim: "lets go with your analysis … if you need more instrumentation please also put that in linear and get that built so we can make better decisions" (2026-06-11).

## author notes for the judge

- The plan deliberately measures the *known-bad current state* as its acceptance test (harness must reproduce the 89%/0-branching findings) — instrumentation that can't detect a known regression is decoration.
- Threshold defaults are explicitly first-guess; THR-347/THR-451 own retuning them. Risk accepted that red/amber/green is initially noisy.
- The UI pillar is dev-only (DebugPanel). If the judge reads "UI pillar" as requiring player-facing display: the design-governance UI requirement is read here as debug inspection (wiring checklist names DebugPanel as a UI surface); player-facing engagement surfaces are THR-455's scope, not this plan's.
- Uncertainty: exact hook-point granularity in encounterFilterPipeline vs generateEncounterCandidates may shift during implementation; the contract is the funnel counter shape, not the exact call sites.
