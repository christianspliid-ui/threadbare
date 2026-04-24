# Interface Playtest Rubric

Derived from `src/data/ia-manifest.ts` → `IA_SURFACES`.

Each surface gets at least one assertion. Use `__DEBUG` methods — not pixel assertions.

**Methods used:**
- `window.__DEBUG.getActiveUIState()` — current view, selections, open modals, camera focus, actionDrawerOpen. **THR-211 note:** only 9 fields are exposed: `view`, `selectedAgentId`, `selectedLocationId`, `selectedFactionId`, `selectedHex`, `openModals`, `actionDrawerOpen`, `scryActive`, `cameraFocusHex`. Fields like `tick`, `essencePool`, `doomClock`, `omenState`, `mandateState`, `ascendantIdentity`, `activeThreadTugs`, `rivalStates`, `phase`, `breadcrumb` are **NOT present** — use DOM or `snapshotScene()` instead for those assertions.
- `window.__DEBUG.getOpenModals()` — list of currently-open modal names. **Caveats:** (1) returns `[]` on the start page — debug bridge only registers within GameView; use DOM dialog assertions for start page modals. (2) Inline/unregistered surfaces (RivalPanel, OmenDetail) never appear here — use DOM assertions instead.
- `window.__DEBUG.snapshotScene()` — counts of mounted scene elements, fog state, layer list. **Caveat:** after `setFog()`, wait ~200ms before calling `snapshotScene()` — React state propagation lag causes stale `fogEnabled` if queried immediately.
- `window.__DEBUG.gotoAgent(id)` — zooms camera to agent hex and opens detail panel. **Requires exact graph node ID** (e.g., `'ind_dev_the_first'`); partial names and display names return `false`.
- `window.__DEBUG.getEventsSince(tick)` — filtered recentEvents after a given tick
- `window.__DEBUG.getViewportForHex(col, row)` — hex coord → viewport pixel (null if offscreen)
- `window.__DEBUG.getHexAtViewport(x, y)` — inverse of above
- `?debug.openModal=<target>` — URL param that auto-opens a named modal on mount. **Requires 5s wait** after navigation with `?seeded` — game state takes ~5s to initialize; the hook fires at 500ms and silently fails if state is not ready. Supported targets: `agent`, `location`, `faction`.

**Assertion tiers:**
- **P** (Presence): the reader is mounted / the surface is reachable
- **S** (State): a key state path is reflected correctly

---

## Views

### start.page — StartPage

**Mount:** always when `view === 'start'`

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-start.page-1 | P | Navigate to `/` → page renders without error overlay | DOM: no `.vite-error-overlay` |

---

### start.credits-modal — CreditsModal

**Mount:** modal, triggered by credits button

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-start.credits-modal-1 | P | Click credits button → `getOpenModals()` includes `'CreditsModal'` | `getOpenModals()` |

---

### start.settings-modal — SettingsModal

**Mount:** modal, triggered by settings button

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-start.settings-modal-1 | P | Click settings button → `getOpenModals()` includes `'SettingsModal'` | `getOpenModals()` |

---

### ascendant.selection — AscendantSelection

**Mount:** always when `ascendantIdentity === null`

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-ascendant.selection-1 | P | Navigate to `/?view=ascendant` → page renders, no error | DOM: no error overlay |
| A-ascendant.selection-2 | S | `getActiveUIState().view === 'ascendant'` | `getActiveUIState()` |

---

### ascendant.cosmology-panel — CosmologyPanel

**Mount:** drillin during ascendant selection

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-ascendant.cosmology-panel-1 | P | Drilling into cosmology during ascendant selection → CosmologyPanel mounts (visible in snapshot or DOM) | DOM check or `getActiveUIState()` |

---

## Game View — HUD Row (always-mounted)

All assertions below require the game to be loaded at `?view=game&seeded&nofog`.

### game.hex-map — HexMapV2

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.hex-map-1 | P | `snapshotScene().hexCount > 0` | `snapshotScene()` |
| A-game.hex-map-2 | S | `snapshotScene().agentCount > 0` (seeded game has agents) | `snapshotScene()` |

---

### game.essence-panel — EssencePanel

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.essence-panel-1 | P | `getActiveUIState().essencePool !== null` | `getActiveUIState()` |

---

### game.simulation-controls — SimulationControls

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.simulation-controls-1 | P | `getActiveUIState().tick >= 0` (SimulationControls reflects clock) | `getActiveUIState()` |
| A-game.simulation-controls-2 | S | After ticking once, `getActiveUIState().tick === tickBefore + 1` | `getActiveUIState()` |

---

### game.doom-bar — DoomBar

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.doom-bar-1 | P | `getActiveUIState().doomClock !== undefined` | `getActiveUIState()` |

---

### game.doom-clock-detail — DoomClockDetail

**Mount:** modal, triggered by clicking DoomBar

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.doom-clock-detail-1 | P | Click DoomBar → `getOpenModals()` includes `'DoomClockDetail'` | `getOpenModals()` |

---

### game.omen-indicator — OmenIndicator

**Mount:** always (when omenState defined)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.omen-indicator-1 | P | `getActiveUIState().omenState !== undefined` | `getActiveUIState()` |

---

### game.omen-detail — OmenDetail

**Mount:** modal, triggered by clicking OmenIndicator

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.omen-detail-1 | P | Click OmenIndicator → `getOpenModals()` includes `'OmenDetail'` | `getOpenModals()` |

---

### game.mandate-tracker — MandateTracker

**Mount:** always (when mandateState defined)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.mandate-tracker-1 | P | `getActiveUIState().mandateState !== null` | `getActiveUIState()` |

---

### game.mandate-detail — MandateDetail

**Mount:** modal, triggered by clicking MandateTracker

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.mandate-detail-1 | P | Click MandateTracker → `getOpenModals()` includes `'MandateDetail'` | `getOpenModals()` |

---

### game.ascendant-bar — AscendantBar

**Mount:** always (when ascendantIdentity defined)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.ascendant-bar-1 | P | `getActiveUIState().ascendantIdentity !== null` (seeded game has identity) | `getActiveUIState()` |

---

### game.ascendant-sheet — AscendantSheet

**Mount:** modal, triggered by clicking AscendantBar

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.ascendant-sheet-1 | P | Click AscendantBar → `getOpenModals()` includes `'AscendantSheet'` | `getOpenModals()` |

---

### game.identity-chip — IdentityChip

**Mount:** always (when ascendantIdentity defined)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.identity-chip-1 | P | `getActiveUIState().ascendantIdentity !== null` (IdentityChip shares the same condition as AscendantBar) | `getActiveUIState()` |

---

### game.avatar-hud — AvatarHUD

**Mount:** always (only when player has physical embodiment)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.avatar-hud-1 | P | `getActiveUIState().ascendantIdentity.embodiment` — if present, AvatarHUD should be visible; if null, SKIP this assertion | `getActiveUIState()` |

---

### game.action-drawer — ActionDrawer

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.action-drawer-1 | P | `getActiveUIState().actionDrawerOpen !== undefined` | `getActiveUIState()` |
| A-game.action-drawer-2 | S | Click drawer toggle → `getActiveUIState().actionDrawerOpen` flips | `getActiveUIState()` |

---

### game.attention-pool-indicator — AttentionPoolIndicator

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.attention-pool-indicator-1 | P | `getActiveUIState().activeThreadTugs !== undefined` (or reflected in scene) | `getActiveUIState()` |

---

### game.rivals-button — RivalsButton

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.rivals-button-1 | P | `getActiveUIState().rivalStates !== undefined` | `getActiveUIState()` |

---

### game.rival-panel — RivalPanel

**Mount:** modal, triggered by clicking RivalsButton

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.rival-panel-1 | P | Click RivalsButton → `getOpenModals()` includes `'RivalPanel'` | `getOpenModals()` |

---

### game.toast-stack — ToastStack

**Mount:** always (visible when notifications present)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.toast-stack-1 | P | After ticking once, `getEventsSince(tickBefore)` returns events (ToastStack has content to display) | `getEventsSince()` |

---

### game.alert-bar — AlertBar

**Mount:** always (visible when alert-level events present)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.alert-bar-1 | P | AlertBar is in the DOM (presence, even if no active alerts) | DOM: confirm AlertBar renders without crashing |

---

### game.world-pulse — WorldPulse

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.world-pulse-1 | P | `getActiveUIState().tick >= 0` and `getActiveUIState().phase !== undefined` | `getActiveUIState()` |

---

### game.live-location-bar — LiveLocationBar

**Mount:** always (shows content when hex/location selected)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.live-location-bar-1 | S | After clicking a hex, `getActiveUIState().selectedHex !== null` — LiveLocationBar reflects the selection | `getActiveUIState()` |

---

### game.chronicle-panel — ChroniclePanel

**Mount:** always

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.chronicle-panel-1 | P | `snapshotScene().chronicleEntries >= 0` (panel is mounted, count can be 0 at t=0) | `snapshotScene()` |

---

---

## Game View — Drillin Surfaces

### game.hex-detail-view — HexDetailView

**Mount:** drillin when hex is selected

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.hex-detail-view-1 | P | Click a hex → `getActiveUIState().selectedHex !== null` | `getActiveUIState()` |
| A-game.hex-detail-view-2 | S | `getActiveUIState().selectedHex` matches the hex coord visible in viewport | `getViewportForHex()` cross-check |

---

### game.hex-breadcrumb — HexBreadcrumb

**Mount:** drillin when hex or location is selected

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.hex-breadcrumb-1 | P | After hex selection, breadcrumb is visible in the DOM (check DOM or `getActiveUIState().breadcrumb`) | `getActiveUIState()` |

---

### game.hex-sidebar — HexSidebar

**Mount:** drillin when hex is selected

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.hex-sidebar-1 | P | After hex selection, HexSidebar is present and lists at least the hex's content | DOM snapshot after hex click |

---

### game.hex-chronicle — HexChronicle

**Mount:** drillin when hex is selected

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.hex-chronicle-1 | P | After hex selection, HexChronicle mounts (may have 0 entries at early tick) | DOM snapshot |

---

### game.location-view — LocationView

**Mount:** drillin when location is selected

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.location-view-1 | P | Click a location in HexSidebar → `getActiveUIState().selectedLocation !== null` | `getActiveUIState()` |

---

### game.retinue-panel — RetinuePanel

**Mount:** drillin (player retinue)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.retinue-panel-1 | P | RetinuePanel is accessible via its UI entry point (tab, button) — confirm the panel mounts | DOM or `getActiveUIState()` |

---

### game.threads-panel — ThreadsPanel

**Mount:** drillin (player threads)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.threads-panel-1 | P | ThreadsPanel is accessible via its UI entry point — confirm the panel mounts | DOM or `getActiveUIState()` |

---

### game.thread-detail-view — ThreadDetailView

**Mount:** drillin (single thread)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.thread-detail-view-1 | P | Click a thread in ThreadsPanel → ThreadDetailView mounts | `getActiveUIState()` |

---

### game.strand-view — StrandView

**Mount:** drillin

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.strand-view-1 | P | StrandView is accessible via its UI entry point — confirm the panel mounts | DOM or `getActiveUIState()` |

---

### game.narrative-feed — NarrativeFeed

**Mount:** drillin (rolling feed)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.narrative-feed-1 | P | NarrativeFeed is accessible and mounts without error | DOM snapshot |
| A-game.narrative-feed-2 | S | After ticking once, `getEventsSince(tickBefore).length > 0` → feed has new entries | `getEventsSince()` |

---

### game.agent-info-card — AgentInfoCard

**Mount:** drillin (agent selected in sidebar)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.agent-info-card-1 | P | Click an agent in HexSidebar → AgentInfoCard mounts with agent data | DOM snapshot |

---

---

## Game View — Modal Surfaces

### game.location-profile-modal — LocationProfileModal

**Mount:** modal

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.location-profile-modal-1 | P | Via exploration path: click location → `getOpenModals()` includes `'LocationProfileModal'` | `getOpenModals()` |

---

### game.agent-profile-modal — AgentProfileModal

**Mount:** modal

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.agent-profile-modal-1 | P | Via exploration path: click agent → `getOpenModals()` includes `'AgentProfileModal'` | `getOpenModals()` |

---

### game.agent-intelligence-panel — AgentIntelligencePanel

**Mount:** modal (sub-modal within AgentProfileModal, THR-141)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.agent-intelligence-panel-1 | P | Within AgentProfileModal, click intelligence tab/button → `getOpenModals()` includes `'AgentIntelligencePanel'` | `getOpenModals()` |

---

### game.faction-sheet — FactionSheet

**Mount:** modal

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.faction-sheet-1 | P | Navigate to a faction (via agent profile or location) → `getOpenModals()` includes `'FactionSheet'` | `getOpenModals()` |

---

### game.army-sheet — ArmySheet

**Mount:** modal

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.army-sheet-1 | P | Navigate to an army (if any exist in seeded state) → `getOpenModals()` includes `'ArmySheet'`; if no army exists, record SKIP | `getOpenModals()` |

---

### game.artifact-sheet — ArtifactSheet

**Mount:** modal

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.artifact-sheet-1 | P | Navigate to an artifact (if any exist in seeded state) → `getOpenModals()` includes `'ArtifactSheet'`; if none exist, record SKIP | `getOpenModals()` |

---

### game.harvest-screen — HarvestScreen

**Mount:** modal, only when `phase === 'harvest'`

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.harvest-screen-1 | P | If `getActiveUIState().phase !== 'harvest'`, record SKIP — HarvestScreen not testable without phase trigger; if phase is harvest, `getOpenModals()` includes `'HarvestScreen'` | `getActiveUIState()`, `getOpenModals()` |

---

### game.intervention-confirm — InterventionConfirm

**Mount:** modal, triggered by firing an intervention from ActionDrawer

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.intervention-confirm-1 | P | Open ActionDrawer → select an action card → `getOpenModals()` includes `'InterventionConfirm'` | `getOpenModals()` |

---

### game.choice-set-modal — ChoiceSetModal

**Mount:** modal, triggered by active encounter with choice pending

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.choice-set-modal-1 | P | If `getActiveUIState().pendingChoiceSet !== null`, `getOpenModals()` includes `'ChoiceSetModal'`; otherwise record SKIP | `getActiveUIState()`, `getOpenModals()` |

---

### game.agenda-picker — AgendaPicker

**Mount:** modal, triggered by agenda action

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.agenda-picker-1 | P | Trigger agenda selection (via ActionDrawer agenda action) → `getOpenModals()` includes `'AgendaPicker'` | `getOpenModals()` |

---

### game.scry-overlay — ScryOverlay

**Mount:** modal, triggered by scry action

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.scry-overlay-1 | P | Trigger scry action → `getOpenModals()` includes `'ScryOverlay'` | `getOpenModals()` |

---

### game.journey-vignette-modal — JourneyVignetteModal

**Mount:** modal, triggered when `pendingVignettes` is non-empty

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.journey-vignette-modal-1 | P | If `getActiveUIState().pendingVignettes?.length > 0`, `getOpenModals()` includes `'JourneyVignetteModal'`; otherwise record SKIP | `getActiveUIState()`, `getOpenModals()` |

---

### game.encounter-veil — EncounterVeil

**Mount:** modal, triggered when a watched encounter is active

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.encounter-veil-1 | P | If `getActiveUIState().watchedEncounter !== null`, `getOpenModals()` includes `'EncounterVeil'`; otherwise record SKIP | `getActiveUIState()`, `getOpenModals()` |

---

### game.debug-panel — DebugPanel

**Mount:** modal (dev-only, backtick or F1)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-game.debug-panel-1 | P | `window.__DEBUG.openDebugPanel()` → `getOpenModals()` includes `'DebugPanel'` | `getOpenModals()` |
| A-game.debug-panel-2 | S | `window.__DEBUG.closeDebugPanel()` → `getOpenModals()` does not include `'DebugPanel'` | `getOpenModals()` |

---

---

## Codex View

### codex.main — Codex

**Mount:** always when `view === 'codex'`

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-codex.main-1 | P | Navigate to `/?view=codex` → page renders without error | DOM: no error overlay |
| A-codex.main-2 | S | `getActiveUIState().view === 'codex'` | `getActiveUIState()` |

---

### codex.sidebar — CodexSidebar

**Mount:** drillin (category nav)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-codex.sidebar-1 | P | Codex view loads → CodexSidebar lists at least one category | DOM snapshot |

---

### codex.detail-panel — CodexDetailPanel

**Mount:** drillin (selected item)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-codex.detail-panel-1 | P | Click a codex entry → CodexDetailPanel mounts with content | DOM snapshot |

---

---

## StyleGuide View

### styleguide.main — StyleGuide

**Mount:** always when `view === 'styleguide'`

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-styleguide.main-1 | P | Navigate to `/?view=styleguide` → page renders without error | DOM: no error overlay |

---

---

## CMS View

### cms.content-browser — ContentBrowser

**Mount:** always when `view === 'cms'`

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-cms.content-browser-1 | P | Navigate to `/?view=cms` → ContentBrowser renders | DOM: no error overlay |

---

### cms.main-panel — CMSMainPanel

**Mount:** drillin (active content table)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-cms.main-panel-1 | P | Select a content category in CMS → CMSMainPanel lists items | DOM snapshot |

---

### cms.detail-panel — CMSDetailPanel

**Mount:** drillin (selected content item)

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-cms.detail-panel-1 | P | Click a content item → CMSDetailPanel renders with item data | DOM snapshot |

---

---

## Modal Dismiss

These assertions apply to any modal opened during the run:

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-modal.dismiss-esc-1 | P | Press Esc with a modal open → `getOpenModals()` has one fewer entry | `getOpenModals()` |
| A-modal.dismiss-click-outside-1 | P | Click outside modal bounds with a modal open → modal dismisses | `getOpenModals()` |
| A-modal.stacking-1 | S | Open two modals → both appear in `getOpenModals()`; Esc closes the top one | `getOpenModals()` |

---

## Fog Behavior

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-fog.nofog-1 | P | With `?nofog` in URL, `snapshotScene().fogEnabled === false` | `snapshotScene()` |
| A-fog.enable-1 | S | `__DEBUG.setFog(true)` → `snapshotScene().fogEnabled === true` | `snapshotScene()` |
| A-fog.restore-1 | S | `__DEBUG.setFog(false)` restores no-fog state | `snapshotScene()` |

---

## Simulation & Events

| ID | Tier | Assertion | Method |
|----|------|-----------|--------|
| A-sim.tick-1 | P | Advance one tick → `getActiveUIState().tick === tickBefore + 1` | `getActiveUIState()` |
| A-sim.events-1 | S | `getEventsSince(tickBefore).length > 0` after one tick | `getEventsSince()` |
| A-sim.feed-1 | S | NarrativeFeed has new content after events generated | DOM snapshot |

---

## Summary counts

Total surfaces in manifest: 54
Required assertion coverage: ≥1 per surface (met above — every surface has at least one row)
