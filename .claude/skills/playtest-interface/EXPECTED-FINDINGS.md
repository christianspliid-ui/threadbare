# Expected Findings — Baseline Noise

This file lists known issues, regressions, or limitations that the `playtest-interface` skill should **not** re-flag as new findings.

After each playtest run (starting with THR-211), append confirmed baseline items here. Each entry should include the first-seen date and the relevant assertion ID from RUBRIC.md.

The skill runbook compares run findings against this file before writing the FAIL / SURPRISE sections of the report. Anything listed here is moved to "Known baseline" instead.

---

## Format

```
### <surface.name> — <Reader>

**First seen:** YYYY-MM-DD (THR-XXX)
**Assertion:** <rubric assertion ID>
**Description:** <one sentence on what the issue is>
**Status:** Known / Won't fix / Tracked in THR-XXX
```

---

## Entries

### game.rival-panel — getOpenModals

**First seen:** 2026-04-24 (THR-211)
**Assertion:** A-game.rival-panel-1
**Description:** RivalPanel renders as an inline HUD panel; it does not call registerModal() and therefore never appears in getOpenModals(). Panel content IS accessible in the DOM.
**Status:** Known — use DOM assertion instead of getOpenModals()

### game.omen-detail — getOpenModals

**First seen:** 2026-04-24 (THR-211)
**Assertion:** A-game.omen-detail-1
**Description:** OmenDetail renders as an unregistered dialog; it appears in the DOM but not in getOpenModals(). Same pattern as RivalPanel.
**Status:** Known — use DOM dialog assertion instead of getOpenModals()

### getActiveUIState field gap

**First seen:** 2026-04-24 (THR-211)
**Assertion:** Multiple (A-game.essence-panel-1, A-game.simulation-controls-1, A-game.doom-bar-1, A-game.omen-indicator-1, A-game.mandate-tracker-1, A-game.ascendant-bar-1, A-game.identity-chip-1, A-game.attention-pool-indicator-1, A-game.rivals-button-1, A-game.world-pulse-1, A-game.avatar-hud-1)
**Description:** getActiveUIState() exposes only 9 fields. RUBRIC expects tick, essencePool, doomClock, omenState, mandateState, ascendantIdentity, activeThreadTugs, rivalStates, phase, breadcrumb. All return undefined. Alternative assertion methods needed.
**Status:** Known — RUBRIC update tracked in THR-211 close-out

### setFog timing

**First seen:** 2026-04-24 (THR-211)
**Assertion:** A-game.fog-behavior (all)
**Description:** setFog() followed immediately by snapshotScene() returns stale fogEnabled. Requires ~200ms delay for React state to propagate.
**Status:** Known — add 200ms delay in runbook fog assertions

### debug.openModal 5s init requirement

**First seen:** 2026-04-24 (THR-211)
**Assertion:** Affects LocationProfileModal, FactionSheet, AgentProfileModal via debug.openModal URL
**Description:** useDebugOpenModal fires with 500ms timeout but game state takes ~5s to initialize with ?seeded. The hook silently fails without a warning when state is not ready.
**Status:** Known — wait 5s after navigation before asserting modal presence

### getOpenModals game-view only

**First seen:** 2026-04-24 (THR-211)
**Assertion:** A-start.credits-modal-1, A-start.settings-modal-1
**Description:** getOpenModals() returns [] on start page. Debug bridge only registered within GameView. Start page modals must be asserted via DOM dialog checks.
**Status:** Known — use DOM assertions for start page

### gotoAgent requires exact ID

**First seen:** 2026-04-24 (THR-211)
**Assertion:** Used in Step 4 (exploration path)
**Description:** gotoAgent() with partial name or full display name returns false. Requires exact graph node ID (e.g., 'ind_dev_the_first'). Partial name matching does not work.
**Status:** Known — document in RUBRIC

### SettingsPanel name mismatch

**First seen:** 2026-04-24 (THR-211)
**Assertion:** A-start.settings-modal-1 (and in-game equivalent)
**Description:** In-game Settings opens 'SettingsPanel' in getOpenModals(), not 'SettingsModal'. RUBRIC uses wrong name.
**Status:** Known — RUBRIC should check for 'SettingsPanel'

### AgentIntelligencePanel not implemented

**First seen:** 2026-04-24 (THR-211)
**Assertion:** A-game.agent-intelligence-panel-1
**Description:** No Intelligence tab in AgentProfileModal. THR-141 is not yet implemented.
**Status:** Tracked in THR-141 — skip this assertion until THR-141 ships

---

## Notes

- Only add entries here after a deliberate decision: "this is known, we accept it or track it elsewhere."
- Do not add entries here to silence alerts you haven't triaged.
- Entries with `Status: Tracked in THR-XXX` should be removed once the tracking issue is resolved.
