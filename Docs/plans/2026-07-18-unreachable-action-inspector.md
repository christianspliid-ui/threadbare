> **title:** Unreachable-action inspector — `__DEBUG.listUnreachableActions()` — THR-659
> **linear_issue:** THR-659
> **author:** Claude Code (design-session)
> **created:** 2026-07-18
> **three_pillars:** Engine `done` · Content `N/A — no authored content; the helper reads existing static registries` · UI `done`

# Unreachable-action inspector — `__DEBUG.listUnreachableActions()` — THR-659

*Turns "which shipped action cards can no run ever surface?" from tribal knowledge into a deterministic, inspectable query.*

## Why this is load-bearing

THR-501 emptied the starter floor (`STARTER_ACTION_IDS = []` in `src/engine/actionUnlock.ts`). Since then the **only** path a player-facing action template can reach a run is by being granted through an Ascendant/milestone Beat — i.e. by appearing in `collectGrantedActionIds()` (`src/data/ascendant-beat-content.ts`). Any player-eligible template that is neither a starter nor granted by some beat is **unreachable forever**: a card that ships in `UNIFIED_ACTION_TEMPLATES`, passes tests, renders in the styleguide, and yet no playthrough can ever hold.

Today the residual set is tracked by hand in session memory (`loc.bless_harvest` / `loc.ward` / `loc.fortify` / `loc.place_of_power`; `loc.open_markets` was one until THR-613 Slice 2b wired it, art now tracked as THR-656). Hand-tracking a set difference is exactly the kind of thing NFP #2 (Inspectability) says should be a query. Without it, every progression change silently risks orphaning a card, and the only detector is an agent remembering to check. With it, one `__DEBUG` call (and a DebugPanel tab) answers "what's orphaned right now?" deterministically, and the same list becomes a natural future CI guard.

This is a **dev-tooling** change. It adds an inspector; it does not change what the player can do, the beat catalogue, or progression logic.

## Engine pillar

### Systems design

A new pure module `src/engine/content-eval/unreachableActions.ts`, session-independent and deterministic (mirrors the THR-490 `proseQualityReport` pattern: pure over static authored content, no `GameState`, no runtime, no PRNG). It exports:

```ts
export interface UnreachableActionEntry {
  id: string;                 // template id, e.g. 'loc.fortify'
  name: string;               // template.name for display
  reach: string;              // template.reach (or 'none')
  crudType: string;           // Create | Find | Change | Destroy | Control
  reason: 'not-granted';      // single reason for v1 — never starter, never beat-granted
}

export interface UnreachableActionReport {
  entries: UnreachableActionEntry[];   // sorted by id, ascending
  summary: {
    playerReachableTemplates: number;  // denominator: templates that COULD be surfaced
    granted: number;                   // count in collectGrantedActionIds() ∩ player-reachable
    starter: number;                   // count in STARTER_ACTION_IDS ∩ player-reachable
    unreachable: number;               // entries.length
  };
}

export function reportUnreachableActions(): UnreachableActionReport;
```

### Resolution logic

`reportUnreachableActions()` computes a set difference over three existing static registries — no new data:

1. **Universe (player-reachable templates).** Start from `UNIFIED_ACTION_TEMPLATES` (`src/data/unified-action-templates.ts`). Filter to templates that *could* be surfaced to the player. The orphaned-card concern is player cards, not mortal/agent actions, so the universe must exclude templates the player can never see regardless of grants. **Eligibility oracle:** reuse the drawer's own filter semantics rather than re-deriving them — the player-facing surfaces are `getTargetActionSlots` (`src/engine/targetActions.ts`), which gates on `template.requiresReach`, sphere prerequisites, and targeting. For a static (no-target, no-actor) report we cannot run the full contextual filter, so v1 uses the **structural** predicate the drawer's pool is built from: a template is player-reachable iff it is an ascendant-castable card (the same `scale` / targeting class the ActionDrawer and AscendantBeat surfaces draw from — the executor confirms the exact field from `targetActions.ts`; candidate signal is `template.scale === 'ascendant'` / actor-targeting reach class). Mortal-only and agent-only templates are excluded from the denominator. This predicate lives in the new module as `isPlayerReachableTemplate(template)` with an inline comment citing the drawer source, so the definition is auditable in one place.
2. **Granted set.** `new Set(collectGrantedActionIds())` (`src/data/ascendant-beat-content.ts`) — the union of every beat's `grantsActionIds`.
3. **Starter set.** `new Set(STARTER_ACTION_IDS)` (`src/engine/actionUnlock.ts`) — currently empty (THR-501), read live so the report stays correct if the floor is ever repopulated.

`unreachable = universe.filter(t => !granted.has(t.id) && !starter.has(t.id))`. Sort by id. No randomness, no tick-loop participation — this never runs inside a tick.

### Graph nodes / edges

N/A — no graph reads or writes. The helper reads static template arrays only.

### Tick phases

N/A — never runs in the tick loop. Invoked on demand from `__DEBUG` / DebugPanel only (like `proseQualityReport`).

### PRNG callouts

None. Fully deterministic set arithmetic over static arrays. No `Math.random()`, no seeded PRNG.

## Content pillar

Content: N/A — no authored content. The inspector reads the existing template registry, beat-grant list, and starter list. It emits no prose, encounters, attachments, or data-table entries. (If the report later drives *fixing* orphans by authoring beats, that is separate content work — out of scope here.)

## UI pillar

*Screenshot tool: Playwright (DOM surface — a DebugPanel tab, no WebGL).*

### Player-facing display

None — this is a dev-only inspector. No player-visible surface, no notification, no chronicle entry. Gated behind the dev-only DebugPanel, tree-shaken from production like the rest of `__DEBUG`.

### Event notifications

N/A — no runtime events.

### Debug inspection (DebugPanel)

1. **`window.__DEBUG.listUnreachableActions()`** — async method on the debug bridge (`src/debug-bridge.ts`), registered next to `proseQualityReport`, lazy-`import()`ing the pure module and returning `UnreachableActionReport`. Typed in `src/debug-bridge.d.ts`. Scriptable from `preview_eval` / the in-game CLI, exactly like `proseQualityReport()`.
2. **DebugPanel "Orphaned Cards" tab** — a new tab in `DebugTabContent` (same 4-edit pattern documented for the THR-611 essence-sources tab: extend the `ViewMode` union, add to `TABS`, add the render branch, add the import). Renders `summary` as a one-line header (`N unreachable of M player-reachable`) and `entries` as a compact table (id · name · reach · crudType). Empty state: "No orphaned cards — every player-reachable template is granted by a beat or starter." The tab is the browser-verify artifact.

### Visual presence (HexMapV2)

N/A — no hex-map surface.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `unreachableActions.ts` | N/A — on-demand, never in tick loop | DebugPanel "Orphaned Cards" tab (`DebugTabContent`) | none — reads static registries, no GameState | none — inspector, not a runtime system | `__DEBUG.listUnreachableActions()` + DebugPanel tab |

Process wiring: pure module → `debug-bridge.ts` registration (+ `.d.ts` type) → DebugPanel tab. No orchestrator phase, no GameState field, no prose pipeline, no player control. This is deliberately a leaf: it consumes existing exports and surfaces a report.

## Constants table

*No tunable game-feel numbers — the report is exact set arithmetic, not a scored/thresholded system.*

| Constant | Default | Purpose |
|----------|---------|---------|
| `PLAYER_REACHABLE_PREDICATE` | (structural, in-module) | The single auditable definition of "player-reachable template", cited to `targetActions.ts`. Not a magic number — a named predicate so the eligibility rule has one home. |

## Tracing

N/A — no engine traces. This inspector does not run in the tick loop and emits nothing into the trace buffer (emitting per-call traces would violate the ring-buffer discipline for a dev tool). Inspectability is served *by* this feature, not *about* it: the report object itself is the inspectable artifact, structured for both `__DEBUG` scripting and the DebugPanel table.

```ts
// No trace type emitted. The report IS the inspectable output:
//   UnreachableActionReport (see Engine pillar) — returned from __DEBUG.listUnreachableActions().
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A template in `UNIFIED_ACTION_TEMPLATES` has no `name` / `reach` / `crudType` | Coalesce to `'(unnamed)'` / `'none'` / `'unknown'`; never throw. The report is best-effort inspection. |
| `collectGrantedActionIds()` throws or returns non-array | Treat granted set as empty, tag the summary with a `warning` note field, return the full player-reachable set as "unreachable" rather than crashing. A dev tool must degrade to a loud-but-alive report. |
| `STARTER_ACTION_IDS` shape changes | Read via `[...STARTER_ACTION_IDS]`; empty/absent → treated as no starters (the current THR-501 reality). |
| DebugPanel tab render receives an error report | Show the `warning` note in the header; render whatever `entries` exist. |

## Three-pillar check

- [x] Engine pillar present — pure `unreachableActions.ts` module, set-difference resolution, no PRNG/graph/tick.
- [x] Content pillar present — N/A with rationale (reads existing registries; authors nothing).
- [x] UI pillar present — `__DEBUG` method + DebugPanel "Orphaned Cards" tab; browser-verify via Playwright.
- [x] Wiring section connects them — pure module → debug-bridge → DebugPanel tab.

## Vision audit

- [x] This plan does not contradict any Vision premise — it is dev tooling; it touches no game-design surface, no player capability, no cosmology.

## Rulebook impact

- [x] This plan does not change a rule of play — no turn structure, action verb, prerequisite, resource, encounter, clock, or win/loss change. It reports on the action catalogue; it does not alter it.

> Brainstorm companion: `Docs/plans/2026-07-18-unreachable-action-inspector-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | No game-feel numbers; the one named entity is the player-reachable predicate, given a single home. |
| 2. Inspectability | PASS | This feature *is* an inspectability win — converts hand-tracked orphan lists into a deterministic query + DebugPanel tab. |
| 3. Determinism | PASS | Pure set arithmetic over static arrays; no PRNG, no `Math.random()`, no GameState. Same registries → same report. |
| 4. Fail-soft | PASS | Fail-soft table degrades every failure to a loud-but-alive report; never throws, never runs in the tick loop. |
| 5. Narrative over mechanical perfection | PASS | N/A to game narrative; frees agents from hand-tracking orphans, indirectly protecting content reachability. |
| 6. Additive over destructive | PASS | New module + one debug-bridge method + one DebugPanel tab. Zero deletions, zero changes to the beat catalogue or progression logic. |
| 7. Performance budget | PASS | One O(N) pass over ~a few hundred templates, on demand only. No tick-loop cost. |

## Done when

- [ ] `window.__DEBUG.listUnreachableActions()` returns a `UnreachableActionReport` matching the shape above, deterministic across calls, with the known residual (`loc.bless_harvest` / `loc.ward` / `loc.fortify` / `loc.place_of_power`) appearing in `entries` (or a documented reason if any has since been granted).
- [ ] DebugPanel "Orphaned Cards" tab renders `summary` + `entries`; empty-state string present.
- [ ] A unit test asserts: (a) determinism (two calls equal), (b) a template known to be beat-granted is absent from `entries`, (c) a template known to be neither starter nor granted is present.
- [ ] `npm test`, `npx tsc --noEmit` (real check: `tsc -b`), `npx vite build` all pass.
- [ ] Closing commit body includes `Fixes THR-659`.
- [ ] `Docs/plans/wiring-checklist.md` updated with the new DebugPanel "Orphaned Cards" tab (DoD requires it for new tabs/surfaces).
- [ ] Browser-verify: Playwright screenshot of the "Orphaned Cards" tab at 1920×1080 + console output + one `__DEBUG.listUnreachableActions()` state assertion (per CLAUDE.md Definition of Done — the change touches the UI pillar via a DebugPanel tab, so it is **not** exempt).

## Coordination block

**Suggested model:** sonnet — small, additive, well-specified leaf feature (one pure module + one debug-bridge method + one DebugPanel tab, mirroring an existing pattern). Advisory only; the CC automation runs Opus regardless.

**Parallel-safe with:** most execution work — the new pure module and `.d.ts` addition collide with nothing; it only *reads* stable exported functions.

**Mutex with:** THR-613 (Player Action Progression) — soft. THR-613 actively edits `src/data/ascendant-beat-content.ts` (adding beats/grants) and has touched the DebugPanel. This inspector *imports* `collectGrantedActionIds()` (stable signature — no conflict on that file) but adds a DebugPanel tab, which could conflict with a THR-613 tab addition in `DebugTabContent`. Land whichever is second on a rebase; the tab-registration edit is small. Also lightly related to THR-656 (art for a card that *was* orphaned) — no file overlap.

**Files to touch:**
- Create: `src/engine/content-eval/unreachableActions.ts` (pure report module)
- Create: `src/engine/content-eval/__tests__/unreachableActions.test.ts` (determinism + membership tests)
- Edit: `src/debug-bridge.ts` (register `listUnreachableActions` async method next to `proseQualityReport`)
- Edit: `src/debug-bridge.d.ts` (type the new method + `UnreachableActionReport`)
- Edit: DebugPanel `DebugTabContent` component (4-edit tab pattern: `ViewMode` union, `TABS`, render branch, import) + new `OrphanedCardsDebugTab` component

## Notes for the executor

- **Confirm the player-reachable predicate against `targetActions.ts` before coding.** The v1 structural predicate is the one real judgment call. Do not invent a new eligibility rule — read how `getTargetActionSlots` builds its candidate pool and reuse that class boundary (candidate: `template.scale === 'ascendant'` / actor-targeting reach). If the exact field differs, use the drawer's actual field and note it in the module comment. The whole value of the tool is that its denominator matches what the player could ever see.
- **Do not add a trace.** A dev inspector that fires per-call traces would evict real traces from the 2000-entry ring buffer (see `reference_trace_buffer_per_tick_volume`). The report object is the inspectable output.
- **Do not "fix" any orphaned card in this issue.** Wiring `loc.fortify` etc. into a beat is progression/content work under THR-613's project, and re-offering a held card is forbidden (THR-613 rule). This issue only *detects*; it never grants.
- **Real typecheck is `tsc -b`**, not `tsc --noEmit` (root tsconfig `files:[]` — see `reference_typecheck_noemit_is_noop`). Diff `tsc -b --force` with/without the change to prove zero net-new errors against the red baseline.
- **Mirror `proseQualityReport` exactly** for the registration shape (lazy `import()`, async, returns a plain object) so the tool is scriptable identically.

## Forked-audit verdicts

### Intent-judge verdict (Step 8.5)

**Allow** — 2026-07-18, Opus judge, 0 GAPs / 0 VIOLATIONs across all 10 dimensions. Impact class confirmed Reversible. Not High-risk (no load-bearing / CLAUDE.md / node-type change), so no separate user gate required — the Pure Claude Code Migration's own explicit sign-off (2026-07-17) governs this instance. The one real judgment call (the "player-reachable" predicate) is responsibly scoped with an explicit executor confirmation step against `targetActions.ts` and a kill-criterion (ship a labeled raw list if the predicate proves infeasible), not hand-waved. Intent fidelity, three-pillar coverage, wiring, NFP compliance, Vision, UL, rejected-approaches, load-bearing decisions, blast radius, and kill criteria all PASS.

*Generated by design-audit-pipeline — 2026-07-18*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names the one judgment-call predicate (`PLAYER_REACHABLE_PREDICATE`) explicitly; correctly notes no game-feel numbers exist. |
| 2. Inspectability | PASS-with-note | Feature is itself an inspectability win (hand-tracked orphan list → deterministic `__DEBUG` query + tab), mirroring the shipped `proseQualityReport` pattern. Note: "Done when" should list committing the new tab into `Docs/plans/wiring-checklist.md`. |
| 3. Determinism | PASS | Deterministic set arithmetic; no `Math.random()`, no PRNG; unit-test checks determinism across two calls. |
| 4. Fail-soft | PASS | Fail-soft table covers missing fields, `collectGrantedActionIds()` throwing, `STARTER_ACTION_IDS` drift, tab render errors — each degrades to a loud-but-alive report. |
| 5. Narrative over mechanical | N/A | Dev-tooling; no player-facing/narrative surface. |
| 6. Additive over destructive | PASS | Zero deletions; all-new files plus two small additive edits. |
| 7. Performance budget | PASS | One O(N) pass over ~a few hundred templates, on demand only; no tick-loop cost. |

NFP AUDIT: PASS-with-notes (see rows above) [design-brief-stale — audited against CLAUDE.md § Non-Functional Priorities]. Note addressed: wiring-checklist Done-when item added.

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Pure module, set-difference resolution, graph/tick/PRNG explicitly N/A with rationale — all required subsections present. |
| Content | N/A-with-rationale | Reads existing registries; authors no encounters/prose/attachments/data. |
| UI | present-and-substantive | Player-facing display N/A (dev-only); Debug inspection fully spec'd (`__DEBUG.listUnreachableActions()` + DebugPanel tab with empty-state copy); notifications/HexMap N/A. |

Missing-required-sections: none. Blast Radius correctly omitted (no ≥100-importer file touched). Wiring table maps the module to all six checklist columns with explicit rationale per column.

PILLAR AUDIT: PASS

### Vision audit

**Vision premises touched**
- `02-non-negotiables.md` → "three pillars always present" — extended (Content N/A with rationale per the premise's infrastructure carve-out).
- `02-non-negotiables.md` → "additive over destructive" — confirmed (new module + one method + one tab; zero deletions).
- `02-non-negotiables.md` → "mechanics surface through prose, never numbers" — N/A by design (dev-only, tree-shaken, never player-visible).
- `00-north-star.md` / `01-core-loop.md` / `03-design-tensions.md` / `taste-profile.md` → not referenced.

**Vision contradictions:** none found.

**Qualitative checks:** North star N/A (dev tooling, no session moment); core loop unaffected (no scan/encounter/aftermath read/write); non-negotiables clear (god/protagonist separation untouched); design tensions not leaned on; taste profile not implicated.

VISION AUDIT: PASS
