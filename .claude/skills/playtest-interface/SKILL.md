---
name: playtest-interface
description: Interface regression sweep for The Fantasy World Simulator. Drives a Chrome MCP session through the game, asserts structural presence of every IA manifest surface via __DEBUG, and produces a structured finding report.
last_validated_against: 2026-05-08
invocation: /playtest-interface [url]
audience: cowork
---

# playtest-interface skill

Invoke as `/playtest-interface [url]`.

Default URL: `http://localhost:5173/?view=game&seeded&nofog`

The URL can be a local dev server or a Vercel preview link — the skill works either way.

## When to use

- After any PR that touches UI components, modals, HUD, or view routing
- Before releasing a milestone to validate the interface is intact
- On demand when you want a structural sanity check on the current build

**Scope:** Interface accessibility and structural presence only. This skill does not evaluate gameplay feel, narrative quality, or engine correctness — those are out of scope for this skill family.

## Preflight — dev server check

Before proceeding, verify the target URL is reachable:

```
browser_navigate(url)
# If the page fails to load or shows a Vite error overlay, STOP.
```

**If the dev server is not running:**
- Ask the user to run `npm run dev` in the project root, then re-invoke.
- Or ask for a Vercel preview URL to use instead.
- Do NOT proceed on a dead or errored page — every assertion below will false-fail.

## Runbook

Execute the following steps in order. For each assertion, record the result (PASS / FAIL / SURPRISE) in the accumulator section at the bottom. Write the report at the end.

---

### Step 1 — Navigate to game view

```javascript
browser_navigate('http://localhost:5173/?view=game&seeded&nofog')
// Wait for the page to settle — no loading spinner, HexMapV2 canvas visible
browser_wait_for('.hex-map-canvas, canvas', { timeout: 10000 })
```

Record tick number before any simulation changes:
```javascript
const uiStateBefore = await window.__DEBUG.getActiveUIState()
const tickBefore = uiStateBefore.tick
```

---

### Step 2 — HUD row assertions (always-mounted surfaces)

Assert each HUD surface is present and reflects live state. Use `getActiveUIState()` and `snapshotScene()`:

```javascript
const uiState = await window.__DEBUG.getActiveUIState()
const scene = await window.__DEBUG.snapshotScene()
```

Run assertions from **RUBRIC.md § HUD Row** against `uiState` and `scene`.

Record results per surface.

---

### Step 3 — Hex map scene assertions

```javascript
const scene = await window.__DEBUG.snapshotScene()
```

Assert from **RUBRIC.md § Hex Map** — hex count, fog state, agent presence.

---

### Step 4 — Exploration path: hex → location → agent

Walk the drill-in path using Chrome MCP. Assert each panel mounts via `getOpenModals()` and `getActiveUIState()`.

```javascript
// Click a visible hex on the map
browser_click(/* center of a hex signifier */)
// Wait for HexDetailView to mount
const uiAfterHex = await window.__DEBUG.getActiveUIState()
// Assert: uiAfterHex.selectedHex !== null

// Click a location in the HexSidebar
browser_click(/* first location entry in the sidebar */)
// Assert LocationProfileModal opens
const modalsAfterLoc = await window.__DEBUG.getOpenModals()
// Assert: modalsAfterLoc includes 'LocationProfileModal'

// Click an agent in the location profile
browser_click(/* first agent entry */)
// Assert AgentProfileModal opens
const modalsAfterAgent = await window.__DEBUG.getOpenModals()
// Assert: modalsAfterAgent includes 'AgentProfileModal'
```

Run assertions from **RUBRIC.md § Exploration Path**.

---

### Step 5 — Modal dismiss assertions

For each open modal, test dismiss paths:

```javascript
// Esc key dismiss
browser_press_key('Escape')
const modalsAfterEsc = await window.__DEBUG.getOpenModals()
// Assert: modalsAfterEsc is empty or has one fewer modal

// Re-open and test click-outside dismiss
// (navigate back to game view if needed)
```

Run assertions from **RUBRIC.md § Modal Dismiss**.

---

### Step 6 — Fog behavior

```javascript
// Current state should have fog disabled (?nofog was in URL)
const sceneFogOff = await window.__DEBUG.snapshotScene()
// Assert: sceneFogOff.fogEnabled === false

// Enable fog via __DEBUG
await window.__DEBUG.setFog(true)
const sceneFogOn = await window.__DEBUG.snapshotScene()
// Assert: sceneFogOn.fogEnabled === true
// Assert: visible hex count decreases (or fog layer is present)

// Restore
await window.__DEBUG.setFog(false)
```

Run assertions from **RUBRIC.md § Fog Behavior**.

---

### Step 7 — ActionDrawer open/close

```javascript
// ActionDrawer should be in game view
const stateBeforeDrawer = await window.__DEBUG.getActiveUIState()
// Assert: stateBeforeDrawer.actionDrawerOpen === false (or true, record actual)

// Open drawer via UI click or keyboard shortcut (check CLAUDE.md for binding)
browser_click(/* ActionDrawer toggle button */)
const stateDrawerOpen = await window.__DEBUG.getActiveUIState()
// Assert: stateDrawerOpen.actionDrawerOpen === true

// Close drawer
browser_click(/* ActionDrawer toggle button or click-outside */)
const stateDrawerClosed = await window.__DEBUG.getActiveUIState()
// Assert: stateDrawerClosed.actionDrawerOpen === false
```

Run assertions from **RUBRIC.md § ActionDrawer**.

---

### Step 8 — Tick and event feed

```javascript
// Record tick before
const stateT0 = await window.__DEBUG.getActiveUIState()
const t0 = stateT0.tick

// Advance one tick via SimulationControls UI
browser_click(/* single-tick button in SimulationControls */)
// Wait for tick to complete
browser_wait_for(/* tick counter to increment */)

// Check events
const newEvents = await window.__DEBUG.getEventsSince(t0)
// Assert: newEvents.length > 0 (at least one event was generated)
```

Run assertions from **RUBRIC.md § Simulation & Events**.

---

### Step 9 — Secondary views

Navigate to each secondary view and assert it loads:

```javascript
browser_navigate('http://localhost:5173/?view=codex')
// Assert CodexSidebar + CodexDetailPanel mount

browser_navigate('http://localhost:5173/?view=styleguide')
// Assert StyleGuide renders

browser_navigate('http://localhost:5173/?view=cms')
// Assert ContentBrowser renders

browser_navigate('http://localhost:5173/')
// Assert StartPage renders
```

Run assertions from **RUBRIC.md § Views**.

---

### Step 10 — Write report

Write the finding report to `.playtest-runs/YYYY-MM-DD-HHMM.md` (replace with actual timestamp).

Report format:

```markdown
# Interface Playtest Run — YYYY-MM-DD HH:MM

**URL:** <target url>
**Build:** <commit hash or Vercel deployment ID>
**Tick at start:** <tick number>

## PASS

- [surface.name] <Reader> — <assertion> — observed: <actual value>
...

## FAIL

- [surface.name] <Reader> — <assertion> — expected: <expected> — observed: <actual>
- **Impact:** <one line on what the player can't do>
...

## SURPRISE

- [surface.name] <unexpected observation — not a known baseline finding>
- **Worth filing?** Yes / No / Maybe
...

## Known baseline (from EXPECTED-FINDINGS.md — not re-flagged)

- <list of baseline findings that appeared but were expected>
```

After writing the report, scan it against **EXPECTED-FINDINGS.md**. Remove any FAIL or SURPRISE entries that appear in the baseline list — those go into the "Known baseline" section instead.

---

## Output contract

- Report file: `.playtest-runs/YYYY-MM-DD-HHMM.md` (gitignored — do not commit)
- Surface: post a summary comment on the Linear issue for THR-211 (first run) with FAIL count and any noteworthy SURPRISEs
- Actionable FAILs: file Linear issues in the Interface Playtest & IA Audit project

## Grey zones and judgment calls

- **Modal navigation depth.** The runbook walks one exploration path (hex → location → agent). If a modal fails to open, record the FAIL and continue — don't halt the run.
- **Fog toggle via URL vs __DEBUG.** If fog reload requires a page navigation (not just a toggle), navigate twice rather than toggle in place. Document in the SURPRISE section if behavior changes.
- **Surfaces that need specific game state.** HarvestScreen, ChoiceSetModal, EncounterVeil, JourneyVignetteModal appear only under specific conditions. If the seeded game state doesn't trigger them, record as SKIP (not FAIL) with a note on what state is required.
- **Per-surface assertion depth.** Aim for: one presence assertion + one sampled state-path assertion. Asserting all five state paths on every modal is overkill and slows the run.
