# THR-266 — Browser-in-the-loop: mandatory for UI-pillar closeout

**Status:** Design (Cowork → CC handoff)
**Date:** 2026-05-08
**Project:** Continuous Improvement
**Parent brainstorm:** `Docs/plans/2026-04-24-codebase-health-recurring-process-brainstorm.md` §5.3 item 2 (deferred from THR-260 / ARC-60)
**Linear issue:** THR-266
**Predecessors / dependencies:** none — pure governance change to CLAUDE.md + `Docs/plans/wiring-checklist.md`

> The `plan-pending-commit` label triggers `flush-plan-docs` to commit this doc to `origin/main` (hourly at :15). Do not commit it manually.

## 1. Problem

UI work routinely lands without browser verification even though the tools exist. Today the verification surface is a five-step pre-commit checklist (`npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:process`, raw verification evidence) plus the Definition of Done's "Verify wiring" item. None of those execute the page in a browser. UI bugs that compile, type-check, and pass headless tests still ship unseen.

The brainstorm (§5.3) frames this as a Pocock failure-mode remedy: *"if you're building a front-end app and you're not giving the LLM access to the browser, that's crazy."* Threadbearer has Claude-in-Chrome, Playwright preview, the `__DEBUG` bridge, and a documented Viewport Contract — the tools are present, the procedure is missing.

The cost of leaving this optional is concrete: snapshot tests catch DOM drift but not paint regressions; TypeScript catches prop-shape changes but not z-index, overflow, or off-viewport rendering; Three.js / WebGL surfaces aren't reachable from Playwright at all (CLAUDE.md viewport contract already names this gap). The Encounter UI v1 stream (THR-330–THR-345 + active D1/D2) has been pushing UI changes faster than the verification surface keeps up.

## 2. Goal

Make browser verification a **binary closeout gate** for any work touching the UI pillar. Specifically:

- A UI-pillar PR cannot be marked ready-for-merge until the closing commit body or completion comment links/embeds at least one screenshot taken at the contractual viewport (1920×1080) **and** lists the browser console output (filtered to errors + warnings) for the page under change.
- The gate is procedural-only in v1 — enforced via Definition of Done + reviewer checklist, not CI. CI enforcement is a follow-up gated on whether reviewers actually use the new line.
- Three-tier tool guidance is published so authors don't pick the wrong tool (Playwright for DOM-only, Chrome MCP for WebGL/Three.js, debug bridge for state introspection).

## 3. Scope (three-pillar adaptation)

This is a **process / governance** change. The three-pillar rule applies as follows:

- **Engine pillar — N/A.** No tick phases, no graph nodes, no constants, no traces. Marked N/A explicitly per Design Governance §three-pillar-check.
- **Content pillar — N/A.** No prose tables, no encounter templates, no attachments. Marked N/A explicitly.
- **UI pillar — primary.** The change codifies *how* UI work is verified. The "UI pillar" line in the per-system required sections checklist (`CLAUDE.md` §Design Governance) and the Definition of Done both gain new items. No React components or styles are added.
- **Wiring pillar — secondary.** `Docs/plans/wiring-checklist.md` gains a new top-level section ("UI Pillar Verification") that tells authors which tool to reach for and what the closeout artifact looks like.

This deviates from the standard three-pillar template intentionally. Per the brainstorm parent (ARC-60) §three-pillar-status: *"This is process/tooling infrastructure, not a game feature. Three-pillar rule does not apply — Engine/Content/UI are N/A. Will be noted in the design doc explicitly rather than skipped silently."* Same pattern applies here.

## 4. Design

### 4.1 Definition of Done — new item

Add to the "Definition of Done" list in `CLAUDE.md` (immediately after the existing "Verify wiring" item, so browser verification sits adjacent to wiring verification):

```
- [ ] **Browser-verify UI changes** — If the change touches the UI pillar (any file under `src/components/`, `src/views/`, `src/hooks/use*UI*`, `src/styles/`, `index.css`, or HexMapV2/Three.js surfaces), the closing commit body or Linear completion comment MUST include:
  1. **At least one screenshot** of the changed surface at 1920×1080 (the contractual viewport — see `## Viewport Contract`). Use Playwright `preview_resize(1920, 1080)` then `preview_screenshot` for DOM surfaces; use Claude-in-Chrome `mcp__Claude_in_Chrome__computer` with `action: "screenshot"` for any HexMapV2 / Three.js / WebGL surface (Playwright cannot see canvas content — see CLAUDE.md viewport contract).
  2. **Console output** captured via `mcp__playwright__browser_console_messages` or `mcp__Claude_in_Chrome__read_console_messages` (errors + warnings filter), pasted as a fenced block. Empty output is a valid result — embed `(no errors or warnings)` in that case.
  3. **State assertion via `__DEBUG`** — at least one query of `window.__DEBUG.*` proving the new state field, surface, or interaction is wired. Use the bridge documented in CLAUDE.md §Debug Bridge.

  **Three reasons this is binary, not advisory:** (1) snapshot tests miss paint regressions; (2) TypeScript misses overflow/z-index/off-viewport rendering; (3) Playwright cannot see WebGL canvas content. Without a browser pass, those failure modes ship unseen. Pocock: "if you're building a front-end app and you're not giving the LLM access to the browser, that's crazy."

  **Exempt:** changes that touch only types/interfaces with no runtime UI (e.g. extending a prop type without changing render behaviour), pure refactors verified by snapshot+typecheck. The exemption is opt-in and must be stated in the commit body: `Browser-verify exempt: types-only refactor, snapshot tests cover render`.
```

### 4.2 Per-system required sections — UI pillar tightening

Add an `Implicit verification artifact` sub-bullet under the existing "UI pillar" line in the per-system required sections checklist (`CLAUDE.md` §Design Governance → "Per-system required sections (inline, not appendix)"). Replace:

> - [ ] **UI pillar** — player-facing display, event notifications (alerts/toasts/chronicle), debug inspection (DebugPanel), visual presence (HexMapV2 signifiers/overlays). No UI pillar = incomplete design.

with:

> - [ ] **UI pillar** — player-facing display, event notifications (alerts/toasts/chronicle), debug inspection (DebugPanel), visual presence (HexMapV2 signifiers/overlays). No UI pillar = incomplete design. **Closeout produces a screenshot + console artifact at 1920×1080 (Definition of Done §Browser-verify UI changes).** Design plans for new UI surfaces must name *which tool* will produce that artifact: Playwright (DOM), Claude-in-Chrome (Three.js / WebGL), or both.

### 4.3 wiring-checklist.md — new "UI Pillar Verification" section

Add a new top-level section to `Docs/plans/wiring-checklist.md`, placed *after* §1 (Orchestrator Tick Loop) and §2 (UI Components Mounted in JSX) and *before* §3 (GameState Consumption). Section text:

```
## UI Pillar Verification (THR-266, 2026-05-08)

A UI surface that compiles + passes snapshot tests can still ship invisibly broken — off-viewport at 1920×1080, z-index buried, console-error spammy, or rendering nothing on a WebGL canvas Playwright cannot see. This section names the tool-of-record per surface category and the closeout artifact required for sign-off.

### Tool-of-record by surface category

| Surface category | Verification tool | Why |
|------------------|-------------------|-----|
| DOM components (panels, modals, lists, forms) | Playwright (`mcp__playwright__*`) | Fast, scriptable, reads accessibility tree; sees DOM truth. |
| HexMapV2 / Three.js / any `<canvas>` content | Claude-in-Chrome (`mcp__Claude_in_Chrome__*`) | Playwright snapshots render `<canvas>` as a blank box. Chrome MCP `computer` `action: "screenshot"` captures actual pixels. |
| Mixed (DOM + canvas) | Both, in this order: Chrome MCP for canvas pixels, Playwright for console + DOM-side state | Don't paper over a canvas regression by only checking the surrounding DOM. |
| State introspection / agent-driven flows | `window.__DEBUG.*` (see CLAUDE.md §Debug Bridge) | Direct read of game state without UI traversal. Required to assert "the wiring works", not just "the page renders". |

### Closeout artifact contract

Every UI-pillar PR (or completion Linear comment) embeds the following three pieces, in this order:

1. **Screenshot** — at 1920×1080 (preview_resize(1920, 1080) for Playwright; `mcp__Claude_in_Chrome__resize_window` for Chrome MCP). Pass `save_to_disk: true` and link the resulting file, or paste the inline image.
2. **Console output** — errors + warnings, filtered. Empty output is valid; state `(no errors or warnings)`.
3. **`__DEBUG` assertion** — one or more queries proving the new state field, derived value, or trace category is reachable.

The artifact lives in either the closing commit body or the Linear completion comment. Snapshot test coverage *complements* the artifact; it does not replace it.

### Exemption clause

Types-only refactors or render-pure pruning verified by snapshot + typecheck may opt out by stating `Browser-verify exempt: <reason>` in the commit body. The reviewer is responsible for confirming the exemption holds.

### Examples

- **DOM-only example (encounter choice card prop change).** Run `preview_resize(1920, 1080)` → `preview_screenshot` of EncounterScreen. `browser_console_messages` filtered to errors. `window.__DEBUG.gotoAgent('Eira')` to confirm the choice card mounts on the threaded agent. Three artifacts in commit body.
- **Canvas example (HexMapV2 signifier change).** `mcp__Claude_in_Chrome__resize_window(1920, 1080)` → `tabs_create_mcp` → `navigate('http://localhost:5173/?view=game&seeded&size=medium')` → `computer({ action: 'screenshot', save_to_disk: true })`. `read_console_messages` filtered. `window.__DEBUG.gotoAgent(...)` to confirm camera move. Playwright is *not* used because canvas content would render blank.
- **Mixed example (encounter UI Phase D1 ThreadOverlay).** Chrome MCP screenshot for the SVG overlay over the canvas + Playwright `browser_console_messages` for state. `window.__DEBUG.fireAction(...)` to confirm trigger.
```

### 4.4 Tooling: no new code

This change ships entirely as documentation edits. No new scripts, no CI jobs, no skills. Tools already present:

- Playwright preview (`mcp__playwright__browser_*`)
- Claude-in-Chrome (`mcp__Claude_in_Chrome__*`)
- `window.__DEBUG` (`src/debug-bridge.ts`)
- Viewport Contract (CLAUDE.md §Viewport Contract — already documents the 1920×1080 contract and the WebGL/Playwright limitation)

No package additions. No new commands.

## 5. Wiring section (per Design Governance)

| New module / capability | Wires to | Notes |
|---|---|---|
| Definition of Done item §4.1 | `CLAUDE.md` §Definition of Done, immediately after "Verify wiring" item | Adjacent to wiring item; reviewer reads them as a pair. |
| Per-system UI-pillar tightening §4.2 | `CLAUDE.md` §Design Governance → per-system required sections | Replaces the existing UI pillar bullet in place. |
| `## UI Pillar Verification` section §4.3 | `Docs/plans/wiring-checklist.md` between §1 and §3 | New top-level section. Update the "Last updated" line at the top of the file with this issue's date + ID. |
| (no new orchestrator phase) | N/A | Process change. |
| (no new modal / GameState field / trace category) | N/A | Process change. |

## 6. Constants table (NFP #1)

No tunable numbers introduced. The single fixed value (1920×1080) already exists as the Viewport Contract. Marked N/A explicitly.

## 7. Tracing (NFP #2)

No new traces. The change is observable through reviewer behaviour (closeout artifact present / absent), not engine state. NFP #2 is satisfied by the existing trace surface; this change does not regress it.

## 8. Fail-soft (NFP #4)

| Failure mode | Fallback |
|---|---|
| Author has no Playwright access (e.g. sandbox missing browser) | Use Claude-in-Chrome instead; the tools are interchangeable for screenshot capture. If neither is available, document the blocker in the closeout comment and request reviewer accommodation — do not ship without a screenshot, even one captured by the user manually. |
| HexMapV2 surface fails to render | The screenshot showing the failure *is* the artifact; ship a follow-up Linear issue, do not bury the regression. |
| Browser console emits warnings unrelated to the change | Filter to errors only and note the pre-existing warnings explicitly. The artifact's job is to surface deltas, not to require zero noise. |
| `__DEBUG` query throws | The throw itself is the artifact for an investigative ticket; do not silently retry. |

The exemption clause (§4.1, §4.3) is the second-order fail-soft: if the change is genuinely types-only or render-pure, the contract bends rather than breaks.

## 9. Rejected alternatives

- **CI enforcement (block merge if no screenshot link in PR body).** Rejected for v1 because (a) the heuristic for "this PR touched UI" is brittle (path globs miss config-driven changes), (b) automated screenshot-comparison is high-effort and high-flake, (c) reviewer-enforced gate is sufficient as a starting point. Revisit only after 2+ retros show authors are skipping the gate. Tracked as a follow-up if the signal warrants it.
- **Add a new skill (`browser-verify`).** Rejected as redundant: the tools (Playwright, Chrome MCP, `__DEBUG`) are already documented in CLAUDE.md and the `frontend-ui` skill. A new skill would duplicate, not add. The change belongs in the universally-loaded surface (CLAUDE.md DoD), not a domain skill.
- **Snapshot tests + Storybook stories instead of live browser.** Rejected because they don't catch off-viewport / z-index / canvas regressions and they require their own setup tax. The Encounter UI G2 work (THR-344) already ships snapshot tests at 1920×1080; this change is *additive*, not a substitute.
- **Per-component verification (one screenshot per primitive).** Rejected as too granular. The contract is "the surface as the player sees it" — a screenshot of the encounter screen is sufficient even if the change is to a single primitive within. Granularity is the reviewer's call.
- **Hard-require a video instead of a screenshot.** Rejected. Static screenshots cover the dominant failure modes; gif/video adds capture-time tax for marginal additional signal. Open question for retro: do animations regress more than statics catch? Then revisit.

## 10. NFP compliance summary

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | No tunable values introduced. Existing 1920×1080 viewport constant is referenced, not re-defined. |
| #2 Inspectability | PASS with note | Process change increases reviewer-visible artifacts (screenshots + console output captured at closeout). Engine-side tracing unchanged. |
| #3 Determinism | PASS | Documentation-only change; no PRNG / engine state involvement. |
| #4 Fail-soft | PASS | §8 enumerates failure modes + fallbacks. Exemption clause is the second-order fail-soft. |
| #5 Narrative over mechanical perfection | N/A | Process change, no in-game narrative. |
| #6 Additive over destructive | PASS | DoD item is appended; existing items unchanged. UI pillar bullet replaced in place but the replacement is a strict superset of the original. wiring-checklist gains a new section, no removals. |
| #7 Performance budget | PASS | Documentation-only change; no runtime performance impact. Reviewer-time impact is bounded (one screenshot + one console grab + one `__DEBUG` query per UI-pillar PR — minutes of additional effort). |

## 11. Vision audit

No Vision premise contradicted or updated. The Vision describes the player-facing experience; this is an internal process change. Marked N/A.

## 12. Definition of Done (for this issue)

- [ ] Edit `CLAUDE.md` per §4.1 (new DoD item) and §4.2 (UI pillar bullet replacement).
- [ ] Edit `Docs/plans/wiring-checklist.md` per §4.3 (new top-level section + "Last updated" bump).
- [ ] Run `npm test`, `npx tsc --noEmit`, `npx vite build` — verify no regressions (this is a docs-only change so green is expected; failures indicate the doc edits accidentally invalidated something else).
- [ ] Browser-verify exempt: docs-only change, no UI surface modified. State this exemption in the closing commit body.
- [ ] Close THR-266 via `Fixes THR-266` in the merge commit body.
- [ ] Append a one-line entry to `Docs/changelog.md`.
- [ ] Append an entry to the Obsidian vault `log.md` via `vault-log` skill.

## 13. Coordination block

- **Suggested model:** haiku (mechanical doc edits to two files; no judgment beyond following the spec above).
- **Parallel-safe with:** all in-flight UI work (THR-334, THR-335) — those are implementation tickets that don't touch the governance docs. Any other docs-only ticket.
- **Mutex with:** any other ticket editing `CLAUDE.md` Definition of Done or `Docs/plans/wiring-checklist.md` simultaneously. Currently none active per the board scan 2026-05-08.
- **Codex review:** no — mechanical doc edits, the spec is binary, snapshot/typecheck/build are the gates.
- **`Suggested model: haiku` label required** per coordination protocol Rule 10. The handoff comment will include this and the issue will be tagged `model:haiku`.
