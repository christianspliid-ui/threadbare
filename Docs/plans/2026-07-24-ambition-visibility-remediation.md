> **title:** `Ambition visibility remediation — THR-721`
> **linear_issue:** THR-721
> **author:** `Claude Code`
> **created:** 2026-07-24
> **three_pillars:** Engine `done` · Content `N/A — no authored content; all prose already exists on ambition nodes` · UI `done`

# Ambition visibility remediation — THR-721

*Ambitions drive agent behavior everywhere in the engine but are tuned invisible in the UI; this plan makes a mortal's primary drive visible at first meaningful knowledge and gives completed ambitions their promised Chronicle home.*

**User verdicts (chat review 2026-07-23, recorded in the issue):** (1) primary ambition visible at first meaningful knowledge of the agent, with accrual rates playtest-checked; (2) implement the ChronicleTab Completed Ambitions list from resolved `pursues` edges; (3) secondary ambitions keep their current deeper gates.

## Why this is load-bearing

Ambitions are assigned at worldgen/birth/re-evaluation, progress through `phaseAmbitionProgress`, bias encounter choice via `applyAmbitionBoost`, and carry motive-receipt provenance — yet the player experienced them as "ambitions disappeared from the UI." Two audited interface contracts carry this ticket as their remediation: `ambition-player-visibility` (🟠 PARTIAL) and `ambition-completed-history` (🔴 LEAKED — `ChronicleTab.tsx:197–203` is a "will appear here" placeholder). A motive system the player cannot see produces encounters whose *why* is invisible — the exact failure NFP #2 exists to prevent, surfaced at the player layer.

## Substrate inventory

*(Step 0.6 — grep evidence 2026-07-24. This is a visibility/tuning remediation of an existing ACTIVE subsystem, not a new system.)*

- **Ambitions & Initiatives** is an audited, ACTIVE subsystem (`Docs/canon/interface-map.generated.md` §Ambitions). This plan **tunes and completes read sites**; it builds nothing new.
- Gate logic lives in `src/components/Game/tabs/JourneyTab.tsx:31–47`: `showAmbitions = interactionDepth ≥ AMBITION_PRIMARY_INTERACTIONS || knowledgeLevel ≥ 'known'`; secondary at `AMBITION_SECONDARY_INTERACTIONS || 'intimate'`.
- Threshold constants live in `src/types/agentKnowledge.ts`: `AMBITION_PRIMARY_INTERACTIONS = 2`, `AMBITION_SECONDARY_INTERACTIONS = 4`; accrual weights `DEPTH_DILEMMA = 2.0`, `DEPTH_ENCOUNTER_OBSERVED = 1.0`, `DEPTH_SOCIAL_ENCOUNTER = 1.0`, `DEPTH_DIVINE_ACTION = 1.0`, `DEPTH_COLOCATION_PER_TICK = 0.05`, `DEPTH_FACTION_PER_TICK = 0.0125`.
- Knowledge ladder: `stranger → recognised → known → intimate → transparent` (`KNOWLEDGE_RANK`, JourneyTab).
- Completion data already exists: `ambitionTick.ts:339` writes `resolvedTick` and `status: 'completed'` onto `pursues` edges (test-locked in `ambitionTick.test.ts:154–155,177`). Nothing reads it for display — that is the leak.
- Card plumbing: `src/engine/agentDetail.ts` builds `AgentInfoCardData` with `intents` from *active* `pursues` edges (`getAgentIntents`, line 762ff, sorted primary-first). The card has **no completed-ambitions field** — the read side this plan adds.
- `AgentDetailPanel.tsx` is orphaned dead code; the live sheet is `AgentProfileModal` (JourneyTab/ChronicleTab are its tabs).

**Verdict: extends** existing read sites and **retunes** existing constants; adds one new pure read function; **replaces nothing**.

## Engine pillar

### Systems design

One new pure query + one data-plumbing extension in `src/engine/agentDetail.ts`:

- `getCompletedAmbitions(graph, agentId): CompletedAmbition[]` — walks the agent's `pursues` edges where `edge.properties.status === 'completed'`, returning `{ ambitionId, name, description?, resolvedTick }`, sorted by `resolvedTick` descending, capped at `COMPLETED_AMBITIONS_MAX_DISPLAY`. Abandoned/failed ambitions (`status: 'abandoned'` etc.) are **excluded** — this list is "who they became," not a failure ledger (failures already narrate through chronicle events).
- `AgentInfoCardData` (and the profile payload ChronicleTab reads) gains optional `completedAmbitions?: CompletedAmbition[]`, populated in the same pass that builds `intents`.

Threshold retune ("first meaningful knowledge", verdict 1): the primary-ambition gate becomes `interactionDepth ≥ AMBITION_PRIMARY_INTERACTIONS` (**2 → 1**) `|| knowledgeLevel ≥ AMBITION_PRIMARY_KNOWLEDGE` (**new named constant, `'recognised'`** — replacing the hardcoded `'known'` string). One dilemma, one observed encounter, one social encounter, one divine action, or ~20 colocated ticks now reveals the primary drive; mere recognition from afar also suffices. Secondary gates untouched (verdict 3).

### Graph nodes / edges

None added or modified. Reads existing `pursues` edges and their existing `status`/`resolvedTick` properties.

### Tick phases

None added or modified. All changes are read-side (UI data assembly) plus constant values.

### Resolution logic

None. Display gating only: primary gate as above; the Completed Ambitions section uses the **same primary-ambition gate** (a design default — completing an ambition is public-scale biography, not intimate knowledge; flag at review if it should gate deeper).

### PRNG callouts

None — no randomness anywhere in this change.

## Content pillar

Content: N/A — ambition names/descriptions already exist on ambition nodes; the empty-state and section-heading strings follow the existing JourneyTab/ChronicleTab copy patterns. No new prose tables, templates, or data files.

## UI pillar

*Screenshot tool: **Playwright** (AgentProfileModal is a DOM surface; no WebGL involved). 1920×1080 per the viewport contract.*

### Player-facing display

- **JourneyTab:** gate change only — same `IntentSection` rendering, unlocked earlier. Empty-state line ("You don't yet know what drives {name}") remains for true strangers.
- **ChronicleTab:** replace the placeholder (`ChronicleTab.tsx:197–203`) with the real list: each entry renders tick marker + ambition name in the tab's existing entry idiom (`t{resolvedTick} — {name}`, gold tick accent, secondary text), matching the "Events" section styling above it. Empty state keeps an italic placeholder line when the agent has none (or gate not met). **Design-system conformance:** load `frontend-ui` + `Docs/design-system/`; shared primitives (`SectionHeading`) and tokens only — no hardcoded hex (existing tabs use `var(--text-secondary)` etc.; match).

### Event notifications

None — ambition completion already emits its milestone chronicle/narrative event (`ambitionTick.ts:343–358`). This plan adds no channel.

### Debug inspection (DebugPanel)

No new bridge needed: `getAmbitionsStrand` and the intents card path are inspectable today. Done-when uses a `window.__DEBUG`/CLI `eval` probe of `interactionDepth` accrual + a `pursues`-edge read to prove the data path (see Done when).

### Visual presence (HexMapV2)

N/A — no map surface in this ticket.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `agentDetail.ts` (`getCompletedAmbitions` + card field) | none (read-side) | `ChronicleTab` §Completed Ambitions | — (graph read) | none (display) | existing `eval`/strand paths |
| `agentKnowledge.ts` constants | none (values only) | `JourneyTab` gate | — | none | `eval state` probe |

No new GameState fields, no prose-pipeline changes, no player controls added.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `AMBITION_PRIMARY_INTERACTIONS` | `1` (was 2) | interactionDepth to reveal the primary ambition |
| `AMBITION_PRIMARY_KNOWLEDGE` | `'recognised'` (new; was hardcoded `'known'`) | knowledge level that alternatively reveals the primary ambition |
| `AMBITION_SECONDARY_INTERACTIONS` | `4` (unchanged) | depth to reveal secondary ambitions (verdict 3) |
| `COMPLETED_AMBITIONS_MAX_DISPLAY` | `10` | cap on Completed Ambitions entries rendered |

## Tracing

No new trace types — this is a read-side visibility change; the write side (`phaseAmbitionProgress`, milestone events) already traces. NFP #2 is served by the display itself plus existing strands.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `knowledge` record absent for the agent | Gate falls back to `knowledgeLevel`-only check (current behavior, preserved) |
| `pursues` edge with `status:'completed'` but missing `resolvedTick` | Include entry, sort last, render without tick marker — never throw |
| Ambition node missing/deleted for a completed edge | Skip that entry silently |
| More than `COMPLETED_AMBITIONS_MAX_DISPLAY` completions | Newest N shown; count is capped, not paginated (v1) |
| Unknown `status` value on a `pursues` edge | Treated as not-completed; excluded |

## Interface impact

*(Step 0.7 — Ambitions & Initiatives is an **audited** subsystem; these are the existing rows this ticket was opened to remediate. Executor updates `scripts/interface-contracts.ts` evidence in the same PR.)*

| Contract | Action | Producer → Consumer | Notes |
|---|---|---|---|
| `ambition-player-visibility` (🟠 PARTIAL) | **extend → LIVE** | `getAmbitionsStrand` / `agentDetail` intents → JourneyTab | Retuned gates make the read site reachable in normal play; add dated `verifiedLive` with playtest-probe evidence |
| `ambition-completed-history` (🔴 LEAKED) | **extend → LIVE** | `pursues` completion writes (`ambitionTick.ts:339`) → new `getCompletedAmbitions` → ChronicleTab | The missing consumer this row named; add dated `verifiedLive` |
| `ambition-progress-milestones` (🟢 LIVE) | **preserve** | unchanged | — |

Badges are downgrade-only for detection; the LIVE re-badging requires the dated `verifiedLive` entries with grep-verifiable symbols (`getCompletedAmbitions`, `AMBITION_PRIMARY_KNOWLEDGE`).

## Blast Radius

*Omitted — no file with ≥100 importers is touched (`agentDetail.ts`, `agentKnowledge.ts`, two tab components).*

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted — this *strengthens* motive legibility ("the world runs on wants you can read"), and knowledge gating still exists (strangers reveal nothing), preserving the intelligence/familiarity fantasy.
- [x] No Vision edit required.

## Rulebook impact

- [x] No rule of play changes — visibility thresholds and a display list; no turn structure, verbs, prerequisites, resources, encounters, clocks, or win/loss touched.
- [x] No rulebook update required.

> Brainstorm companion: `Docs/plans/2026-07-24-ambition-visibility-remediation-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Both gates + display cap are named constants; the hardcoded `'known'` string becomes `AMBITION_PRIMARY_KNOWLEDGE` |
| 2. Inspectability | PASS | The change *is* an inspectability remediation; existing strands/milestone traces unchanged |
| 3. Determinism | PASS | No randomness introduced |
| 4. Fail-soft | PASS | 5-row table; every case degrades to skip/fallback, never throw |
| 5. Narrative over mechanical perfection | PASS | Completed list is biography ("who they became"), excludes failures (which narrate elsewhere); prose-first rendering |
| 6. Additive over destructive | PASS | New optional card field + new constant; one constant value retuned; placeholder replaced; nothing deleted |
| 7. Performance budget | PASS | O(edges-per-agent) read at modal-open, capped display; no per-tick cost |

## Done when

- [ ] Playtest probe (headless): in a seeded run, drive one encounter observation (or 1 dilemma / ~20 colocated ticks) for a threaded agent via `__DEBUG.tick(n)`/CLI, then show `interactionDepth ≥ 1` and the primary ambition rendering in JourneyTab — paste the probe output (this is the verdict-1 "playtest-check accrual rates" evidence)
- [ ] An agent with a completed ambition (drive via CLI/`eval` if none occurs naturally in the window) shows it under ChronicleTab §Completed Ambitions with tick marker; agent below the knowledge gate shows the empty state
- [ ] Secondary-ambition gating demonstrably unchanged (same thresholds, test-locked)
- [ ] Interface rows `ambition-player-visibility` + `ambition-completed-history` re-badged LIVE with dated `verifiedLive` evidence in `scripts/interface-contracts.ts`
- [ ] Playwright screenshot of AgentProfileModal (Journey + Chronicle tabs) at 1920×1080 + console output pasted; sim advanced only via `window.__DEBUG.tick(n)`
- [ ] `npm test`, `npx vite build`, `npm run check:typecheck` (ratchet), `npm run check:generated-freshness`, wiki-freshness pass — if a wiki page's `sources` glob matches, update the page in-PR
- [ ] Closing commit body + PR body include `Fixes THR-721`

## Coordination block

**Suggested model:** sonnet — bounded UI + read-side plumbing with decisions already made; no cross-system design calls remain.

**Parallel-safe with:** UL tickets (THR-734/715), infra tickets (THR-738) — disjoint files.

**Mutex with:** THR-74 remainder's PR 3 only if it edits the same AgentProfileModal tab files (it adds a "Company" section to the modal — coordinate on `AgentProfileModal` file surface; single-lane WIP makes this sequencing, not conflict).

**Files to touch:**
- Edit: `src/components/Game/tabs/JourneyTab.tsx` (gate constants), `src/components/Game/tabs/ChronicleTab.tsx` (real Completed Ambitions section), `src/engine/agentDetail.ts` (`getCompletedAmbitions` + card field), `src/types/agentKnowledge.ts` (constant retune + new constant), `scripts/interface-contracts.ts` (row evidence)
- Create: tests for `getCompletedAmbitions` + gate thresholds

## Notes for the executor

- `AgentDetailPanel.tsx` is orphaned dead code — do not fix ambition display there (known trap, recorded in the interface map).
- The Completed Ambitions gate reuses the primary-ambition gate — a deliberate design default; if review wants it deeper, it is one constant.
- Do not resurrect any `domainContributions`-style side channel — completed-ambition data comes only from `pursues` edge properties.
- Keep the entry rendering in ChronicleTab's existing event idiom (tick gold accent + secondary text) — no new visual language.

## Intent-judge verdict

**Allow** (2026-07-24, cold-boot Opus judge). All 11 dimensions PASS, 0 GAPs, 0 VIOLATIONs; impact class confirmed Reversible; every cited source line verified. Two non-blocking executor notes: the issue description's `ChronicleTab.tsx:197–202` is actually lines 197–203 (plan cites correctly), and the `ambition-completed-history` row's declared symbol `completedAmbitions` needs both-side symbol hits when re-badging — update `scripts/interface-contracts.ts` evidence in the same PR. Proposal: `Docs/plans/.intent-proposals/2026-07-24-ambition-visibility-remediation.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-24*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | All four thresholds are named constants with defaults/purpose tabulated; the previously-hardcoded `'known'` string is explicitly promoted to a constant |
| 2. Inspectability | PASS | Read-side only — no new writes, so no new trace category required (wiring-checklist pattern: traces accompany writes); the surfaced writes (`ambitionTick.ts:339`, verified) already trace via milestone events |
| 3. Determinism | PASS | No PRNG introduced; pure graph read + constant retune |
| 4. Fail-soft | PASS | 5-row table; all cases degrade to skip/fallback, never throw |
| 5. Narrative over mechanical | PASS | "Who they became" biography framing, failures excluded, no raw numbers to the player |
| 6. Additive over destructive | PASS | New optional field + pure function + one retuned constant; replaced placeholder verified inert dead-end text |
| 7. Performance budget | PASS | O(edges-per-agent) at modal-open, capped display, no per-tick cost |

NFP AUDIT: PASS-with-notes [design-brief-stale] — the note reflects only the design-brief fallback to CLAUDE.md (the drift THR-701 remediates), not a substantive gap; all 7 rows PASS outright.

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | New pure query, card-data extension, constant retunes; tick-phase/PRNG explicitly N/A with reasoning |
| Content | N/A-with-rationale | Ambition prose already exists on nodes; rationale specific, not a placeholder dodge |
| UI | present-and-substantive | Exact components named, Playwright correctly chosen (DOM not WebGL), design-system conformance noted, HexMapV2 correctly N/A |

No missing required sections; Blast Radius correctly omitted per the template's CONDITIONAL rule. Wiring table matches checklist convention with honest "none" entries for the read-side change. Substrate check: `## Substrate inventory` present; Ambitions & Initiatives confirmed 🟢 ACTIVE in the systems inventory — legitimately an extend/retune, no undisclosed green-field.

PILLAR AUDIT: PASS

### Vision audit

Premises: north-star "mortal as person, not unit" **extended** (legible interior drive before crisis); non-negotiables #2/#3 **confirmed** (prose, never numbers); design-tension #4 (legibility vs. mystery) **engaged deliberately** — gate lowered while the stranger-gate counter-pull is preserved; core loop silent (display-layer change); taste-profile.md unlocatable in worktree (unverifiable, not contradicted).

No contradictions found.

VISION AUDIT: PASS-with-notes — taste-profile unverifiable from worktree + core-loop neutral; nothing at risk.
