# DebugPanel prose-quality tab — real-time authored-content audit (THR-490)

**Date:** 2026-07-01
**Linear:** THR-490 (Content Architecture) — deferral from THR-472 (prose-quality eval harness, shipped 2026-06-23)
**Author:** Cowork (keep-work-flowing pass)
**Suggested model:** sonnet
**Status:** Design complete, three-pillar compliant. Ready for Dev.

---

## 1. What this is

THR-472 shipped a **pure, deterministic prose-quality scorer** (`src/engine/content-eval/proseQualityScore.ts`) plus a CLI harness (`scripts/eval-prose-quality.ts`). The scorer grades any authored prose field against the content-strategy rubric (voice-contract, hard-exclusion, static-string, missing-enrichment) and returns a 0–100 score, a band (`pass`/`warn`/`fail`/`error`), and a flag list.

Today that scorer is reachable only offline: the CLI scores a **fixture corpus** (`getFixtureCorpus()`) or a JSON file. A director playing the game cannot see how the *actual* authored content library scores against the bar without leaving the game and running a script.

This issue wires the scorer into the **DebugPanel** as a new `prose-quality` tab: a batch report over the real authored-content library with summary bands, a sortable/filterable table, per-entry flag breakdown, and worst-tail highlighting — plus `__DEBUG` methods so the same report is scriptable from `preview_eval` / the CLI-tab.

This is **dev-tooling only**. It authors no content and makes no gameplay, balance, or narrative decisions. It surfaces an existing scorer.

## 2. Locked scoping decision (technical, non-creative)

**The tab audits the static authored-content library, not live GameState instances.**

Rationale: prose quality is a property of the *authored tables* (encounter templates, condition/omen/attachment prose, etc.), not of a particular playthrough. Instance prose is derived from those tables plus enrichment, so scoring the tables gives directors the "audit all authored content against the quality bar" view the issue asks for, and it is fully deterministic and session-independent. A clean seam is left (§4.3) to optionally fold in live in-flight GameState prose later, but that is **out of scope** for v1 and is not required for the tab to be useful.

This is a scoping decision inside dev-tooling; it introduces no creative-vision surface, so it is resolved here rather than deferred to a user verdict.

## 3. Engine / data pillar

### 3.1 New pure collector module — `src/engine/content-eval/collectAuthoredProse.ts`

A pure function that walks the authored-content tables and returns `EvalInput[]` (the scorer's input type: `{ entryId, contentType, marquee?, fields: Record<string,string> }`).

```ts
export function collectAuthoredProse(): EvalInput[]
```

- Enumerate the authored-content tables already imported elsewhere (mirror how `?view=codex` and the `content-catalog-manager` skill enumerate content). At minimum: encounter templates (`UnifiedActionTemplate` prose fields + `authoredChoices[].intent`/`likelyBurden` + `aftermathConfig.variants[].overview`), condition prose, omen prose, attachment prose, faction/spell flavor tables.
- For each entry, build one `EvalInput`: `entryId` = stable content id; `contentType` = the table's kind string (drives voice-mode inference in the scorer — `"encounter"`, `"condition"`, `"omen"`, `"attachment"`, …); `fields` = `{ fieldName → text }` for each prose field present; `marquee` = true for high-rarity/importance entries where the table exposes rarity.
- No GameState dependency, no tick-loop involvement, no PRNG. Pure over the static imports.
- Reuse the field-extraction shape from `getFixtureCorpus()` in the CLI harness so the two callers stay consistent.

### 3.2 Scoring entry point (reuse, no new engine logic)

The tab and the `__DEBUG` methods call the **existing** `scoreProseBatch(collectAuthoredProse(), cfg?)` → `ProseQualityBatchResult` (`{ entries, summary{total,pass,warn,fail,error}, bottomTail, marqueeEntries }`). No new scoring logic. Rubric constants (`PROSE_PASS_FLOOR=85`, `PROSE_WARN_FLOOR=60`, penalties, `BATCH_TAIL_FRACTION=0.15`) stay owned by `src/data/content-eval/proseQualityRubric.ts`.

### 3.3 Constants table (NFP #1)

New constants live in a small UI-adjacent constants block (e.g. top of the tab component or `debugPanelStyles.ts` companion). No magic numbers inline.

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROSE_TAB_ROW_LIMIT` | 200 | Max table rows rendered before "showing worst N / M" truncation (keeps the DOM light). |
| `PROSE_TAB_DEFAULT_SORT` | `'score-asc'` | Default sort — worst entries first (directors want the tail). |
| `PROSE_TAB_DEFAULT_BAND_FILTER` | `['warn','fail','error']` | Default hides `pass` so the panel opens on actionable entries. |
| `PROSE_TAB_REFRESH_DEBOUNCE_MS` | 250 | Debounce on the manual Refresh action. |

All scoring thresholds are **not** redefined here — they remain the rubric's (single source of truth).

### 3.4 Tracing / inspection contract (NFP #2)

This is not a tick phase, so it emits no `TraceBuffer` entries. Inspectability is delivered through the `__DEBUG` return contract (§4.2): every method returns the structured `ProseQualityResult` / `ProseQualityBatchResult` verbatim, so a script can assert on `summary`, `band`, and per-entry `flags` without the UI.

### 3.5 Fail-soft table (NFP #4)

| Failure case | Fallback behavior |
|--------------|-------------------|
| A content table import is missing / throws during collection | `collectAuthoredProse` wraps each table sweep in try/catch, skips the failing table, and includes a synthetic `error`-band entry `{ entryId: '<table>::collect-error', contentType: 'meta' }` so the miss is visible, never a thrown exception. |
| An entry has no prose fields | Skipped (empty `fields` → not added to corpus). |
| Malformed field (non-string) | Coerced/skipped; the scorer already returns `band='error'` for unscoreable input — surfaced, not thrown. |
| Empty corpus (no content resolved) | Tab renders an empty-state ("No authored prose resolved — check collector wiring"), no crash. |
| Scorer throws | Tab catches, shows an inline error row; DebugPanel stays interactive. |

## 4. UI pillar

### 4.1 New DebugPanel tab — `prose-quality`

DebugPanel tabs are registered in `src/components/Game/debug/DebugTabContent.tsx`: extend the `ViewMode` union, add one `{ id, label }` to the `TABS` array, and add a render branch. This mirrors the 36 existing tabs (`kpi`, `beats`, `drift`, …) — a well-worn pattern.

- `ViewMode` gains `'prose-quality'`.
- `TABS` gains `{ id: 'prose-quality', label: 'Prose QA' }`.
- New component `src/components/Game/debug/ProseQualityView.tsx` rendered when `viewMode === 'prose-quality'`.

### 4.2 Component contents (`ProseQualityView.tsx`)

- **Summary band** (top): total, and colored counts for pass / warn / fail / error from `batch.summary`. Pass=green, warn=amber, fail=red, error=grey, matching existing DebugPanel band conventions in `debugPanelStyles.ts`.
- **Controls row:** band filter chips (default `['warn','fail','error']`), a content-type dropdown, a free-text `entryId` filter, a sort toggle (score asc/desc), a "marquee only" toggle, and a **Refresh** button (re-runs the collect+score, debounced).
- **Table:** columns `entryId · contentType · voiceMode · score · band`. Rows sorted worst-first by default, capped at `PROSE_TAB_ROW_LIMIT` with a "showing worst N of M" note. Row band colored.
- **Row expansion:** clicking a row expands its `flags[]` — one line per flag showing `category` · `severity` · `field` · `detail`, with the `evidence` snippet quoted. This is the core director value: *why* an entry failed.
- **Bottom-tail highlight:** `batch.bottomTail` entries badged so the worst `BATCH_TAIL_FRACTION` are unmistakable even when sorted/filtered.
- Compute is memoized on mount; only re-runs on Refresh (scorer is O(n) over authored entries; running once per open + manual refresh is well within the dev-only budget).

### 4.3 Dev-only gating + live-prose seam

- The whole tab is dev-only (DebugPanel already only mounts under `import.meta.env.DEV`). No prod bundle cost — the collector and view are tree-shaken with the rest of the panel.
- **Seam for later (out of scope):** `collectAuthoredProse()` takes no args in v1; a future `collectLiveProse(state)` can produce additional `EvalInput[]` from in-flight GameState prose and the tab can union the two corpora behind a "source: authored / live / both" toggle. Documented here so the v1 shape doesn't block it. Tracked as a future follow-up only if a director asks for it — no issue filed yet.

### 4.4 Viewport contract

DebugPanel is an existing overlay that already respects the 1920×1080 viewport contract (internal `overflow-y-auto`). The new tab's table uses `flex-1 overflow-y-auto` inside the panel body — nothing renders below the fold, nothing new scrolls the page.

## 5. Content pillar

**N/A — this tab authors no content.** It is a consumer/auditor of the existing authored-content library. Its *purpose* is to make content quality legible, but it adds zero prose, templates, or data tables. (Three-pillar rule satisfied by explicit N/A + rationale.)

## 6. Wiring section

Per `Docs/plans/wiring-checklist.md`:

| Surface | Wiring |
|---------|--------|
| Engine module | `collectAuthoredProse.ts` — pure, called only by the tab + `__DEBUG`. No orchestrator phase (on-demand dev tool). |
| UI component | `ProseQualityView.tsx` rendered from `DebugTabContent.tsx` `viewMode === 'prose-quality'`; tab registered in `ViewMode` + `TABS`. |
| GameState flow | None — v1 reads static content tables, not GameState. |
| `__DEBUG` bridge | Add to `src/debug-bridge.ts` (+ `src/debug-bridge.d.ts`): `proseQualityReport()` → `ProseQualityBatchResult`, and `scoreProseEntry(entryId)` → `ProseQualityResult \| { error }` (looks up one entry from the collected corpus and scores it). Both are pure reads; no state mutation, no `touchWorld`/`touchStructure`. |
| Traces | None (not a tick phase); inspectability via `__DEBUG` return contract. |
| Player controls | None — dev-only. |
| Docs | Add the two `__DEBUG` methods + the `Prose QA` tab to the CLAUDE.md §Debug Bridge list and the IA manifest DebugPanel tab inventory. |

Module-only-in-test = not integrated: the tab must be reachable in the running DebugPanel, and `__DEBUG.proseQualityReport()` must return a non-empty batch in a seeded session.

## 7. NFP compliance

| NFP | Verdict | Note |
|-----|---------|------|
| 1 Tunability | PASS | Row/sort/filter constants named (§3.3); scoring thresholds remain the rubric's single source. |
| 2 Inspectability | PASS | `__DEBUG` returns structured results verbatim; per-entry flag breakdown in UI. |
| 3 Determinism | PASS | Pure collect + pure scorer; same content library → same report. No PRNG. |
| 4 Fail-soft | PASS | Per-table try/catch, empty-state, error-band surfacing (§3.5). Never throws into DebugPanel. |
| 5 Narrative over mechanical | N/A | Dev tool. |
| 6 Additive over destructive | PASS | New module + new tab + two `__DEBUG` methods. No edits to scorer, rubric, or existing tabs beyond appending to the `ViewMode`/`TABS` lists. |
| 7 Performance budget | PASS | O(n) over authored entries, run on open + manual refresh, memoized, dev-only (tree-shaken in prod). |

## 8. Done-when

- [ ] `collectAuthoredProse.ts` returns a non-empty `EvalInput[]` over the real authored-content tables (unit test asserts >0 entries and well-formed shape).
- [ ] `prose-quality` tab registered (`ViewMode` + `TABS`) and renders summary + filterable/sortable table + expandable flag breakdown.
- [ ] `__DEBUG.proseQualityReport()` returns a `ProseQualityBatchResult` with `summary.total > 0` in a seeded session; `__DEBUG.scoreProseEntry(id)` scores a single entry.
- [ ] Empty-corpus and table-collect-error paths render gracefully (no thrown exception into DebugPanel).
- [ ] `npm test` + `npx tsc --noEmit` + `npx vite build` clean.
- [ ] **Browser-verify (UI pillar):** 1920×1080 screenshot of the `Prose QA` tab open (Playwright DOM — DebugPanel is DOM, not WebGL) showing the summary band + a populated table with at least one expanded flag breakdown; console errors/warnings block (`(no errors or warnings)` if clean); and a `window.__DEBUG.proseQualityReport()` result pasted proving `summary.total > 0`.
- [ ] CLAUDE.md §Debug Bridge + IA manifest updated with the new tab and `__DEBUG` methods.
- [ ] Closing commit body: `Fixes THR-490` + verification evidence.

## 9. Coordination

- **Suggested model:** sonnet (matches existing `model:sonnet` label). Mechanical: copy an existing DebugPanel tab pattern + a pure collector mirroring `getFixtureCorpus`. Judgment is confined to the collector's table enumeration.
- **Parallel-safe with:** all current work (isolated new module + new tab; nothing else in flight).
- **Mutex with:** none. Touches `DebugTabContent.tsx` (append-only to `ViewMode`/`TABS`) and `debug-bridge.ts` (append-only) — low collision, and no other issue is currently In Dev.
- **Codex review:** no (small dev-tooling, no engine/gameplay surface).
- **Key references for the implementer:**
  - Scorer + types: `src/engine/content-eval/proseQualityScore.ts` (`scoreProseEntry`, `scoreProseBatch`, `EvalInput`, `ProseQualityResult`, `ProseQualityBatchResult`).
  - Rubric constants: `src/data/content-eval/proseQualityRubric.ts`.
  - Corpus-building reference: `scripts/eval-prose-quality.ts` (`getFixtureCorpus`).
  - Tab registration: `src/components/Game/debug/DebugTabContent.tsx` (`ViewMode`, `TABS`).
  - Bridge: `src/debug-bridge.ts` / `src/debug-bridge.d.ts` (`_registerGameStateProvider` pattern).
  - Original deferral note: `Docs/plans/2026-06-23-thr472-prose-quality-eval-harness.md` §12.
