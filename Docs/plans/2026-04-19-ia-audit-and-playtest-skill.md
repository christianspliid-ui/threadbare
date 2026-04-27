# IA Audit + Interface Playtest — Design Plan

**Status:** In Design (Cowork)
**Linear project:** [Interface Playtest & IA Audit](https://linear.app/threadbare/project/interface-playtest-and-ia-audit-fe4bca92c4d7)
**Authored:** 2026-04-19
**Owner:** Cowork (design), CC (execution of `__DEBUG` + audit script)

## Diagnosis

Cowork and CC generate design and code faster than anyone evaluates whether the resulting game is reachable, legible, or coherent. The evaluation surfaces that exist aren't equally healthy:

| Surface | Strength | Gap |
|---|---|---|
| Design review (NFP checklist, three-pillar, quality gate) | Moderate — embedded in CLAUDE.md, enforced when Cowork catches it | Skipped under time pressure; no post-hoc audit |
| Pre-merge code review (CC + `/codex:*` reviewer) | Moderate — works on touched files | Doesn't ask "is the new thing reachable?" |
| Post-merge automated validation | Weak — tests, typecheck, build only | No structural IA check; a renamed component can silently break the UI and ship |
| Product / playtest (actually play the game) | Absent | We have no agent that plays the game and reports what it feels like, what is confusing, or what doesn't load |
| Strategic / portfolio review | Ad-hoc — retros | No cadence for asking "are we building the right thing?" |

The two biggest gaps are **post-merge validation** and **playtest**. This project addresses both, narrowly scoped to **interface** concerns. A sister project for **experience** (gameplay feel, loop fatigue, emotional architecture) will follow.

## Why split interface and experience

They share infrastructure (Chrome MCP, `__DEBUG`, same dev-server URL) but diverge on every other axis:

| Axis | Interface playtest | Experience playtest |
|---|---|---|
| Primary question | Can the player reach the game state? | Does playing the game feel good? |
| Cadence | Per-PR that touches UI | Per milestone / per major system |
| Runtime | Under 20 minutes | Hours; may require multiple sessions |
| Persona | Curious newcomer navigating menus | Engaged player running a cycle |
| Assertion mode | Structural — reader exists, modal opens, state reflected | Qualitative — did a story beat land, was a choice meaningful |
| Failure mode | Missing reader, broken modal, fog bug | Flat feel, confused motivation, broken dilemma |
| Confabulation risk | Low — assertions are discrete | High — "interesting" is easy to hallucinate |

Bundling them would produce a skill that is either too fast for experience work or too slow for per-PR interface regressions. Splitting lets each have its own rubric, persona, and success criteria.

**This project does interface only.** Experience gets its own project later, reusing the infrastructure.

## Four core pieces

### 1. IA manifest — `src/data/ia-manifest.ts`

A commitment document of what the player should see, organized by view/modal/panel. Not a dump of GameState — a **subset that reflects deliberate product commitments**. Each entry names the GameState path it reflects and the UI reader (component) that displays it.

**Why a TypeScript module, not YAML.** The CMS registry (`src/components/CMS/registry.ts`) already consumes typed data modules as its single source of truth. Making the IA manifest a TS module means: (a) no YAML parser dependency, (b) the audit script imports it directly and benefits from tsc, (c) it fits the CMS registry pattern natively and can be surfaced as a browsable CMS entry (see piece 2), (d) IDE autocomplete when hand-editing surface entries.

Schema:

```typescript
// src/data/ia-manifest.ts
export type SurfaceMount = 'always' | 'modal' | 'drillin';
export type SurfaceView = 'start' | 'ascendant' | 'game' | 'codex' | 'styleguide' | 'cms';

export interface IAReader {
  state_path: string;       // e.g. 'essencePool.sphereTotals.mind' or '(none — pre-game state)'
  reader: string;           // component name that must exist and mount
  visible_when: string;     // free-text condition
}

export interface IASurface {
  surface: string;          // view-dot-component, unique
  view: SurfaceView;
  mount: SurfaceMount;
  reads: IAReader[];
  optional_readers?: string[];
  notes?: string;
  /** URL (relative) that navigates the app to this surface. Used by the CMS "Open" button. */
  openUrl?: string;         // e.g. '/?view=game&seeded&debug.openModal=location'
}

export const IA_SURFACES: IASurface[] = [
  // ... ~50 entries
];
```

**Why manifest-of-intent, not all-of-GameState.** GameState has ~70 top-level fields; many are runtime caches, deprecated, or engine plumbing with no player-facing surface. A manifest of intent is a commitment document: coverage gaps become deliberate choices, not accidental drift. The audit is a structural check — "does the reader exist, does it mount where claimed" — not a per-field data diff.

**v1 scope:**
- Every top-level view (game, ascendant selection, codex, styleguide, cms, start)
- Every primary modal (Location/Agent/Faction/Army/Artifact profile, HarvestScreen, InterventionConfirm, ChoiceSetModal, AgendaPicker, HexDetailView, StrandView, ThreadDetailView, ScryOverlay, DebugPanel, JourneyVignetteModal, OmenDetail)
- Persistent HUD row (EssencePanel, DoomBar, OmenIndicator, AscendantBar, ToastStack, AlertBar, WorldPulse, LiveLocationBar, RivalsButton, MandateTracker, IdentityChip, SimulationControls, ActionDrawer, AttentionPoolIndicator)

**Out of scope (v1):** subcomponents inside already-covered modals, per-tab granularity within DebugPanel, CMS viewer schema beyond ContentBrowser.

**Migration note.** The v0 draft lives at `Docs/ia-manifest.yaml` (~50 surfaces). Conversion to TS is mechanical — structure is identical. Delete the YAML once the TS module lands.

### 2. CMS integration — "Information Architecture" under Configuration

The IA manifest ships as a first-class CMS entry at `?view=cms`, visible under the existing **Configuration** category alongside Game Configuration and Tunable Constants. This turns the manifest from a doc into a navigable, in-app reference.

**Registry entry** (`src/components/CMS/registry.ts`):

```typescript
{
  id: 'ia-surfaces',
  label: 'Information Architecture',
  category: 'Configuration',
  description: 'What the player should see, where. Commitment document audited by npm run audit-ia.',
  data: IA_SURFACES,
  viewer: 'ia-surface',          // new viewer type — see below
  searchFields: ['surface', 'view', 'reads.reader', 'reads.state_path'],
  sourceFile: 'src/data/ia-manifest.ts',
}
```

**New viewer type** (`src/components/CMS/viewers/IASurfaceViewer.tsx`) — read-only in v1. Displays:

- **Sidebar filter** by view (start/ascendant/game/codex/styleguide/cms) and by mount (always/modal/drillin)
- **Surface list** (main panel): surface name, view, mount, reader count, first state_path as preview
- **Detail panel** on click: full reads[] table, optional_readers, notes, and a prominent **"Open this surface"** button
- **Search** across surface, reader, state_path (via existing CMSHeader search)

**"Open this surface" affordance.** Each entry declares an optional `openUrl` — when the user clicks Open, the app navigates to that URL in the current tab (or Ctrl+click for new tab). For modals, the URL uses a new `?debug.openModal=<name>` query parameter that GameView reads on mount and auto-opens the named modal. This bridges "here's what the manifest claims" with "here's what it actually looks like" in one click.

**Why read-only in v1.** Edits happen in the TS file directly. Editable-from-CMS adds schema validation, persistence, and undo scope with no proportionate value in v1 — IA entries change at design-review cadence, not runtime. Matches ConfigManager's read-mostly pattern. Add editing in v2 only if drift proves painful.

**Viewer reuse vs new viewer.** The existing `tree` and `record` viewers could serve, but IA has a specific shape (surfaces as top-level, nested reads with state_path + component + visibility, cross-link to live UI) that deserves a dedicated viewer. New `ia-surface` viewer type added to `ViewerType` in `types.ts`.

### 3. Audit script — `scripts/audit-ia-manifest.ts`

Imports `IA_SURFACES` from `src/data/ia-manifest.ts` directly. Statically verifies every declared reader:

1. Component definition exists in `src/components/**` (`export (default )?function <Name>` or `const <Name> =`).
2. Component is mounted where expected — GameView.tsx for `mount: always`; any component for modals.
3. (Warn only) Component file references the declared `state_path`.

Reports pass/fail counts. Exits 1 on FAIL. Ships as `npm run audit-ia`.

**No CI wiring.** Stays advisory per user decision 2026-04-20.

### 4. `playtest-interface` skill — `.agents/skills/playtest-interface/`

Cowork-runnable skill that drives a headless Chrome MCP session through the game and asserts against the manifest + `__DEBUG` extensions. Output is a structured finding report.

**Runbook sketch:**
1. Confirm dev server up or Vercel preview URL provided.
2. Navigate to `?view=game&seeded&nofog`.
3. Run HUD-row presence assertions via `__DEBUG.getActiveUIState()` and `__DEBUG.snapshotScene()`.
4. Walk the exploration path: click hex → HexDetailView mounts → click location → LocationProfileModal opens → click agent → AgentProfileModal opens. Assert via `__DEBUG.getOpenModals()`.
5. Modal dismiss assertions (Esc, click-outside, stacking order).
6. Fog behavior (with/without `?nofog`).
7. ActionDrawer open/close + AgendaPicker flow.
8. Tick simulation once, verify events appear via `__DEBUG.getEventsSince(tickBefore)`.
9. Dump report to `.playtest-runs/YYYY-MM-DD-HHMM.md` with sections PASS / FAIL / SURPRISE.

**Baseline noise.** `EXPECTED-FINDINGS.md` records known regressions the skill should not re-flag. Updated after each run.

**Why structural, not pixel-based.** Playwright can't see WebGL. Chrome MCP can take screenshots but pixel assertions are fragile under font/antialiasing/zoom differences. Structural assertions via `__DEBUG` are stable and fast.

### Supporting infrastructure — `__DEBUG` extensions

Two parallel CC issues (THR-207, THR-208) extend the existing debug bridge in `src/debug-bridge.ts`. The additions are:

- `snapshotScene()` — counts of what's mounted in the scene (hex/agents/locations/armies/battles/threads/activity icons, fog state, layer list)
- `getViewportForHex(col, row)` — hex coord → viewport pixel; returns null if offscreen
- `getHexAtViewport(x, y)` — inverse; useful for asserting what a click would hit
- `getOpenModals()` — list of currently-open modals by name
- `getActiveUIState()` — current view + all selections + modals + camera focus
- `getEventsSince(tick)` — filtered recentEvents for "tick then assert" patterns

All additions follow the existing tree-shaking pattern — zero prod-bundle cost.

**Not in scope: `performAction` bypass.** CC proposed extending `__DEBUG` with methods that fire actions directly on state, bypassing the UI. Rejected for the interface playtest because it loses signal on UI discoverability (can the player reach the action?). If engine-stress playtests need it later, add it as a separate `__DEBUG.engine.*` namespace with a distinct skill; don't conflate.

## Sequencing

```
THR-206 (IA manifest v1 — TS module) — Cowork, In Design
     │
     ├── THR-212 (CMS registry + IASurfaceViewer) — CC, blocked by 206
     │
     ├── THR-209 (audit script) — CC, blocked by 206
     │
     └── THR-210 (playtest skill) — Cowork, Todo, blocked by 206, 207, 208
                                                                  │
                                                                  └── THR-207, THR-208 (__DEBUG extensions) — CC, Ready for Dev, parallel-safe
                                                                              │
                                                                              └── THR-211 (first playtest run) — Cowork, Todo, blocked by 209, 210, 212
```

THR-207 and THR-208 can run concurrently in CC because they touch the same file with different methods — merge conflicts are limited to import ordering. The IA manifest (206) doesn't block them structurally, so the manifest and __DEBUG work can proceed in parallel until they meet at the playtest skill (210). THR-212 (CMS viewer) and THR-209 (audit script) both import the manifest module — they can run in parallel once 206 lands; they touch disjoint files.

## Success criteria

- Manifest (`src/data/ia-manifest.ts`) covers in-scope views and modals, user-reviewed.
- Manifest is browsable in-app at `?view=cms` under the Configuration category; "Open this surface" button navigates to the live surface.
- Audit script runs locally via `npm run audit-ia`; breaking a reader visibly fails the audit.
- A Cowork session can invoke `playtest-interface` against a running dev server or Vercel preview and produce a structured finding report in under 20 minutes.
- First playtest (THR-211) surfaces at least one real finding we didn't already know about.

## Non-goals

- Experience / gameplay feel playtest — separate project, separate skill.
- Post-merge review beyond IA audit — broader evaluation surface, later.
- Screenshot diffing — structural via `__DEBUG` instead.
- CI wiring of the audit script — deferred; not wanted per 2026-04-20 decision.
- Editing IA entries from the CMS UI — read-only in v1; edit the TS file directly.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Manifest drifts from UI when components are renamed | Audit script catches missing readers; run per PR or per merge |
| Playtest skill produces noise (false positives) | `EXPECTED-FINDINGS.md` baseline; rubric tuning after THR-211 |
| `__DEBUG` additions bloat prod bundle | Follow existing tree-shake pattern; verify with `grep __DEBUG dist/` after build |
| Skill only catches regressions we thought to write assertions for | Accepted v1 limitation; experience playtest fills the generative gap |
| Dev server dependency blocks the skill | Skill accepts a URL parameter — user can point at Vercel preview |

## NFP compliance

This project is tooling-heavy, not engine-heavy. NFP application is abbreviated but honored:

| NFP | Compliance |
|---|---|
| 1. Tunability | PASS — manifest schema allows adding fields without schema migration; audit thresholds are constants |
| 2. Inspectability | PASS — playtest output is itself a structured report; findings are traceable to manifest entries |
| 3. Determinism | PASS — manifest is static; audit is deterministic given source tree; playtest run uses fixed seed via `?seeded` |
| 4. Fail-soft | PASS — audit reports fails but doesn't crash; playtest skill should catch `__DEBUG` errors and report as FAIL |
| 5. Narrative over mechanical | N/A — tooling project |
| 6. Additive over destructive | PASS — all additions; no existing code paths changed |
| 7. Performance budget | PASS — playtest target under 20 min; audit target under 5 sec |

## Open questions — resolved 2026-04-20

1. **Where does the playtest artifact live?** **Gitignored.** Runs land in `.playtest-runs/YYYY-MM-DD-HHMM.md` at repo root. `.playtest-runs/` is added to `.gitignore` as part of THR-210 (skill author). Runs are ephemeral diagnostics; noteworthy findings get surfaced into Linear issues, not committed verbatim.
2. **Does the audit script become a required CI gate?** **No — stays advisory.** Run occasionally via `npm run audit-ia` when checking IA drift. Do not wire into `.github/workflows/ci.yml` without a separate decision. If CI wiring is ever revisited, file a Continuous Improvement issue first.
3. **Sister-skill naming.** **Locked: `playtest-interface` (this project) + `playtest-experience` (future project).** Consistent `playtest-*` prefix makes the family discoverable in `.agents/skills/`.
4. **Manifest source format.** **Locked: TypeScript module at `src/data/ia-manifest.ts`.** Fits the CMS registry pattern, no YAML parser dependency, audit script imports directly. The v0 YAML at `Docs/ia-manifest.yaml` is the seed for conversion and is deleted once the TS module lands.
5. **CMS editing scope.** **Locked: read-only inspector in v1.** Edits happen in the source TS file. Editing-from-CMS is a v2 consideration only if drift proves painful.
6. **"Jump to this surface" affordance.** **Locked: yes, in v1.** Each `IASurface` declares an optional `openUrl`; the viewer renders an "Open this surface" button that navigates the current tab (or new tab with Ctrl+click). Modals require a new `?debug.openModal=<name>` URL parameter handler in GameView.
