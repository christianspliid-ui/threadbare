# Encounter Migration Audit Checklist (Reusable Per-Phase Gate)

**Date:** 2026-04-17
**Type:** Process / gate checklist
**Status:** Draft
**Applies to:** Every completed batch of the *Encounter Format Migration* project — starting with the THR-89/THR-90 pilot and repeated after every Phase 2+ batch lands on `main`.
**Related:** `Docs/plans/2026-04-16-encounter-template-migration.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`, `Docs/plans/wiring-checklist.md`, skills: `template-encounter-rewrite`, `testing-patterns`, `agent-analyser`.
**Three pillars:** Engine (regression, determinism, traces, performance), Content (prose quality, systemic wiring usage, variety), UI (player-facing rendering, chronicle/toast feedback, debug visibility).

---

## Why This Exists

The Encounter Format Migration converts 115 legacy templates in ~8 phases. Each phase is a bulk rewrite with multiple authors (Cowork drafts, CC edits, prose resolvers, aftermath authors). Without a structured gate between phases we risk:

1. **Silent no-ops shipping** — aftermath effect kinds that type-check but nothing reads (pattern already seen in THR-119/120/121: `partial_progress`, `sphere_pressure`, `rival_awareness` all shipped as silent no-ops before audit caught them).
2. **Prose regression** — migrated templates drop below the meeting-encounter quality bar without anyone noticing because the tests pass.
3. **Wiring gaps compounding** — a capability added in Phase 0 (hidden marks, intelligence grants) but not surfaced in the UI means 70+ subsequent templates author content no player ever sees.
4. **Drift from the systemic wiring guide** — the guide is the IKEA manual; if it goes stale, every future phase produces hardcoded fiction.

This checklist runs **after every migration batch merges**, before the next batch starts Implementation Planning. If a Phase finds blockers, they become deferrals and block the next Phase's start gate.

## When to Run

- **Post-pilot gate** — after THR-89 (Thieves Guild pilot, 43 templates) AND THR-90 (Phase 0 parity harness + deprecation) both land. Decision: go/no-go on Phase 2 faction batches (THR-91–99).
- **Per-phase gate** — after each faction batch (Phase 2), social/tavern/faction cross-cuts (Phase 3), combat/anomaly/borderland (Phase 4). Decision: go/no-go on the next batch.
- **Pre-cleanup gate** — after the last content batch, before THR-108 (remove EncounterTemplate type) and THR-109 (skill/doc update). Decision: go/no-go on removing the legacy pipeline.

## Prerequisites Before Running

- Phase 0 parity harness from THR-90 is in place and runs in CI. If it isn't, stop — THR-90 hasn't actually shipped.
- `npm test`, `npx tsc --noEmit`, `npx vite build` all green on `main` at the audit commit.
- The batch's Linear issue(s) are marked Done and deferrals are logged.
- A fresh `npm run cli -- --seed 42 --map medium` can boot and advance 30 ticks without throwing.

---

## Pillar 1: Engine

Every check below has an **action** on failure: open a Linear deferral in the active project, labelled `Deferral`, with a reference to this audit run.

### E1. Full test suite green
- Run: `npm test`
- Pass: 0 failures, 0 unexpected skips, no "flaky" reruns.
- Fail → block phase. Do not proceed.

### E2. Type check & build clean
- Run: `npx tsc --noEmit && npx vite build`
- Pass: no errors. Warnings tolerated only if pre-existing.
- Fail → block phase.

### E3. Parity harness passes (THR-90 output)
- Run the integration parity test on at least 3 canary templates (1 guild, 1 social, 1 combat) comparing legacy-pipeline output to unified-pipeline output for identical inputs + seed.
- Pass: reward payloads, reputation deltas, tier promotions, and trace identity-fingerprints match. Prose text is allowed to differ (that's the point), but structural outputs don't.
- Fail → block. This is the load-bearing invariant of the whole migration.

### E4. Determinism check (NFP #3)
- Run: `npm run cli -- --seed 42 --map medium` twice, `run 5` for 30 ticks each, `events 200 > /tmp/run1.txt` (or equivalent); then compare.
- Pass: byte-identical event streams across runs.
- Fail → determinism regression; likely a `Math.random` / `Date.now` leak introduced by the batch.

### E5. Fail-soft under missing data (NFP #4)
- Run the CLI with a deliberately sparse state (a fresh seed, an agent with no faction, a location with no subtype). Trigger at least one migrated template manually: `fireAction <agent> <templateId>`.
- Pass: no exceptions thrown, degraded-but-coherent output (prose resolves with fallbacks, effects either fire or log a fail-soft note).
- Fail → an aftermath or enrichment resolver is missing a guard.

### E6. Trace completeness
- Grep the batch's new/edited templates for `aftermath`, `outcome`, `stepEffect` usage.
- For every effect kind referenced, confirm:
  - It appears in `TRACE_CATEGORIES` (or the current trace-category source of truth).
  - A corresponding trace is emitted at resolution time (grep `traceBuffer.push` or equivalent for the trace type).
  - `enrichProse()` is on the call path so placeholders actually resolve — verify in the unified adapter, not just a test harness. **This is the Codex finding that almost shipped on the migration plan; don't let it slip.**
- Pass: every effect kind has a trace and the adapter enriches it.
- Fail → open a `Deferral` for the missing trace wiring.

### E7. No silent no-ops
- For every aftermath effect kind or complication kind introduced or touched in this batch, confirm both sides of the contract:
  - **Writer:** the resolver or effect handler mutates state.
  - **Reader:** at least one other system reads that state and acts on it.
- If the writer exists but no reader does, that's a silent no-op. Do not accept "it's wired downstream later" without a Linear issue.
- Fail → open a `Deferral` (this is the THR-119/120/121 pattern — the type system won't catch it).

### E8. Graph mutations use versioned touches
- Grep for any direct `node.properties.X = ...` or edge mutation in new code.
- Confirm calls go through `touchWorld()` / `touchStructure()` where structural caches depend on them (distance matrix, encounter cache).
- Pass: every meaningful mutation participates in the versioning protocol. No direct property edits that bypass it.
- Fail → caches will silently serve stale data; open a blocker, not a deferral.

### E9. Performance budget
- Run `npm run cli -- --seed 42 --map medium` and `run 5` for 60 ticks. Capture tick throughput.
- Pass: no > 15% slowdown vs. the pre-batch baseline (capture baseline before merging the batch).
- Fail → profile before the next phase starts. Flag in the audit report with the measured numbers.

### E10. CLI smoke — end-to-end pipeline health
- `npm run cli` → `run 5` for 60 ticks → `encounters` → `factions` → `traces 200`.
- Pass: encounter pipeline producing output (not 0), faction activity present, traces include the batch's new categories, no crashes.
- Fail → upstream pipeline is dead; the batch likely broke scoring or seeding.

## Pillar 2: Content

### C1. Prose quality bar — random sample
- Pick 10 migrated templates at random from the batch.
- For each, evaluate against the meeting encounter benchmark (`Docs/plans/encounters/` — prose eval):
  - Distinct voice per faction/context (no generic filler).
  - Concrete sensory details (not abstractions).
  - Implies consequence rather than announces mechanics.
  - At least 3 distinct sentence structures across the 10.
- Pass: ≥ 8 of 10 meet the bar. The 2 that don't become `Content` deferrals.
- Fail → half or more miss the bar. Pause the phase; open a rewrite issue for the batch before proceeding.

### C2. Systemic wiring usage — coverage by capability
For the batch, count how many migrated templates exercise each of the 7 capabilities from the systemic wiring guide:

| Capability | Target coverage per batch |
|---|---|
| Enrichment placeholders | ≥ 80% of templates use at least one dynamic placeholder |
| Encounter seeding | ≥ 30% plant a seed on at least one outcome branch |
| Hidden marks | ≥ 20% seed or reveal a mark where narratively justified |
| Reputation polarity | 100% have `reputationPolarity` set (or explicitly N/A) |
| Graph ops | ≥ 40% use GraphOps for at least one effect (not just pool draws) |
| Intelligence grants | ≥ 15% grant intelligence on at least one outcome |
| Divine intervention hooks | ≥ 10% expose a hook (if the encounter category warrants it) |

- Pass: all rows meet target OR the shortfall has a documented reason (e.g. borderland exploration genuinely doesn't need faction reputation).
- Fail on any row → the batch is producing hardcoded fiction. Open a deferral to retrofit; do not start next phase.

### C3. Outcome ladder presence
- For every migrated template, confirm at least 3 distinct outcome levels are authored (not just pass/fail).
- Pass: ≥ 90% of templates have a 3+ level ladder. Binary-only allowed where genuinely binary (e.g. a lock-check).
- Fail → prose is richer than structure; content regresses toward old binary shape.

### C4. Branch-aware aftermath
- Sample 5 templates with multi-branch outcomes. Confirm each branch produces materially different aftermath (different GraphOps, different traces, different prose keys — not just a reskin).
- Pass: ≥ 4 of 5 have genuinely differentiated branches.
- Fail → the format upgrade is being wasted; templates look unified but behave binary.

### C5. No copy-pasted prose across templates
- Grep the batch's content files for any string literal duplicated verbatim across ≥ 3 templates.
- Pass: 0 matches (or matches are genuine template frames like `"{name} arrives at {location}."`).
- Fail → filler is accumulating; open a rewrite deferral with the matching strings.

### C6. Content desert check
- After the batch, run `npm run validate-model` (or equivalent audit script) and inspect coverage by sphere × reach × faction.
- Pass: no (sphere × reach × faction) cell with 0 templates that previously had ≥ 1.
- Fail → the migration dropped coverage. Block the next phase; restore or redistribute.

### C7. Deferred fields audit
- Inspect `src/data/encounter-migration-audit.ts` (or successor): count templates still flagged with deferred fields (traitModifiers, traitChanges, etc.).
- Pass: count not growing batch-over-batch. A stable or shrinking count is acceptable.
- Fail → we're accumulating unexpressible mechanics; flag for a format extension.

## Pillar 3: UI

### U1. Player-facing rendering
- Run `npm run dev`, navigate to `?view=game&seeded`, trigger at least 3 migrated templates from the batch via the action drawer or `window.__DEBUG.fireAction`.
- Pass: prose renders cleanly (no visible placeholders like `{name}` or `{faction}` leaking), outcomes display, action card shows expected metadata.
- Fail → `enrichProse` wiring or adapter pipeline is broken on the player path. Block.

### U2. ActionDrawer / context filtering
- Same dev session: confirm migrated templates appear in the ActionDrawer when their targeting context is met, and don't appear when it isn't.
- Pass: filtering respects `targetActions.ts` and new required properties.
- Fail → the player can't reach the content they authored.

### U3. DebugPanel visibility of new traces
- Open DebugPanel (`F1`), run 5 ticks, check that any new trace categories from the batch render in the trace panel (not just the buffer).
- Pass: every new trace kind either renders or has a tracked issue to add rendering (THR-42 pattern).
- Fail → invisible systems; open a UI deferral.

### U4. Chronicle / toast feedback
- In the dev session, trigger an aftermath with a reputation delta, a hidden mark seeding, and an intelligence grant (pick templates that do each).
- Pass: each event produces visible player feedback (chronicle entry, toast, or relevant modal) in line with the wiring checklist.
- Fail → aftermath fires silently; player learns nothing from the outcome. Block — this collapses the whole point of the migration.

### U5. Hex Map signifiers for seeded encounters
- When a migrated template seeds a future encounter on a hex, confirm the seeded encounter becomes visible on HexMapV2 at the expected hex within awareness range.
- Verify via Claude-in-Chrome (`mcp__Claude_in_Chrome__computer screenshot`) — Playwright cannot see WebGL contents.
- Pass: seed → visible signifier within 1–5 ticks.
- Fail → encounter awareness or signifier pipeline broken for the new seed type.

### U6. Viewport contract intact
- Confirm at 1920×1080 (use `preview_resize` or Claude-in-Chrome) that:
  - Nothing renders below the fold.
  - No modal exceeds 85vh.
  - DebugPanel and ActionDrawer open without clipping.
- Pass: viewport contract from CLAUDE.md holds.
- Fail → UI regression; block.

### U7. Accessibility / readability smoke
- Confirm text contrast, font sizing, and modal close affordances on at least one migrated template's aftermath modal.
- Pass: no obvious regression from baseline.
- Fail → log as a `UI` deferral unless severity warrants blocking.

## Pillar 4: Cross-pillar / Hygiene

### X1. Wiring checklist updated
- Confirm `Docs/plans/wiring-checklist.md` was updated for any new orchestrator phase, modal, GameState field, trace category, or player control introduced by the batch.
- Pass: checklist reflects the batch. If unchanged, confirm the batch genuinely added nothing new.
- Fail → future agents won't know the wiring exists. Must be fixed before close-out.

### X2. Systemic wiring guide current
- Confirm `Docs/plans/2026-04-16-systemic-wiring-guide.md` was updated for any new capability, new placeholder, new effect kind, or new seed/mark type.
- Pass: guide documents what the batch introduced.
- Fail → next phase will produce hardcoded fiction because authors won't know the capability exists. Block.

### X3. Deferrals tracked in Linear
- Grep the batch's diff for `// TODO`, `// DEFERRED`, `// PHASE-X-DEFERRED`.
- For each, confirm a Linear issue with `label:"Deferral"` exists and is attached to the Encounter Format Migration project (or a downstream project with rationale).
- Pass: every TODO has a Linear backing.
- Fail → open the missing issues during the audit; do not close the audit until done.

### X4. Changelog & project-status updated
- Confirm `Docs/changelog.md` has a row for the batch and `Docs/project-status.md` reflects the current state.
- Pass: docs reflect reality.
- Fail → update during the audit.

### X5. Legacy cleanup progressing
- Count remaining legacy `EncounterTemplate` references (`grep -r "EncounterTemplate" src/`).
- Pass: count is decreasing batch-over-batch. (Not zero until THR-108 ships.)
- Fail → migration is stalling; re-plan.

### X6. Agent-analyser sanity run
- Export encounter log TSV via `window.__DEBUG.exportEncounterLogAll()` from a 60-tick `?view=game&seeded` run that hits migrated content.
- Feed to the `agent-analyser` skill. Check: variety up, idle rate not up, movement patterns sane, capability growth smooth.
- Pass: no regressions against pre-batch baseline.
- Fail → log findings, open balance deferrals, consider before next phase.

---

## Exit Criteria — Go/No-Go Decision

The audit produces **one of three outcomes**, recorded in the Linear audit issue:

- **GREEN — Proceed to next phase.** All Pillar 1 checks pass, all Pillar 4 checks pass, Pillar 2 & 3 have ≤ 3 deferrals total and none are blockers. Open a Ready-for-Dev issue for the next phase.
- **AMBER — Proceed with follow-ups.** Pillar 1 passes, but Pillar 2 or 3 has 4–8 deferrals or one blocker-adjacent issue. Next phase may start IN DESIGN, but Implementation Planning is blocked on clearing the blocker-adjacent issue first.
- **RED — Stop, remediate, re-audit.** Any Pillar 1 failure, any X1/X2 failure, or > 8 pillar 2/3 deferrals. Open a remediation issue, block the next phase, re-run the audit after fixes.

## Output Artifacts

Every audit run produces:

1. **Findings comment on the Linear audit issue** — table of checks × pass/fail/deferral, with links to any deferrals opened.
2. **Deferrals filed** — one Linear issue per failure marked `Deferral`, assigned to Encounter Format Migration (or clearly justified downstream project), with reference back to this checklist run.
3. **Decision line** — `GREEN | AMBER | RED` with the gate recommendation.
4. **Baseline numbers captured** — tick throughput, coverage counts, deferred-field count, legacy reference count — so the next audit has something to diff against.

## Reusability Notes

- Copy this checklist's pillar tables into each audit issue as a GitHub-style task list.
- For faster runs (Phase 3/4 batches that are smaller), the sample sizes in C1/C4 can scale down proportionally, but no check can be skipped entirely.
- When the migration is complete (post-Phase 6), a final audit run against the whole template corpus replaces the per-batch run. At that point, content deserts (C6) and legacy cleanup (X5) become terminal checks.

## Definition of Done for the Audit Itself

- [ ] Audit issue closed with a findings comment and explicit GREEN/AMBER/RED decision.
- [ ] Every failure has a Linear deferral.
- [ ] Baseline numbers captured and committed to this doc's "History" section (append below as audits run).
- [ ] Next-phase decision communicated on the Encounter Format Migration project.

## History

_(Append one entry per audit run: date, phase audited, decision, deferral count, link to Linear issue.)_
