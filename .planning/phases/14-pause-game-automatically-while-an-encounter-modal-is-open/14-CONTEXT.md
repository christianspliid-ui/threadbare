# Phase 14: Pause game automatically while an encounter modal is open - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-pause the tick loop whenever an encounter modal (TieredEncounterModal or MeetingEncounterModal) is open. Resume when the modal closes if the game was previously running. This ensures the player can read and interact with encounters without the world advancing underneath.

</domain>

<decisions>
## Implementation Decisions

### Pause scope
- **Encounter modals only** — TieredEncounterModal and MeetingEncounterModal trigger auto-pause
- ALL encounter notifications now auto-pause when their modal opens, regardless of court position (not just `the_first`)
- Other modals (AgentProfile, ActionDrawer, Settings, DebugPanel) do NOT auto-pause

### Resume behavior
- **Auto-resume on close** — if the game WAS running before the modal opened, resume when the modal closes
- If the player had manually paused before the modal opened, stay paused after close
- Implementation: track a `wasRunningBeforePause` ref to remember pre-modal running state

### Claude's Discretion
- Whether to use a ref or state for tracking pre-pause running state
- Whether to centralize the pause/resume logic in useSimulation or keep it in GameView
- How to handle rapid open/close sequences (debounce vs immediate)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tick loop and simulation
- `src/components/Game/hooks/useSimulation.ts` — Owns `running` state, `setRunning`, tick interval logic
- `src/components/Game/GameView.tsx` — Lines 615-624 (existing the_first auto-pause), lines 782-786 (vignette auto-pause pattern)

### Encounter modals
- `src/components/Game/TieredEncounterModal.tsx` — Tiered encounter modal component
- `src/components/Game/MeetingEncounterModal.tsx` — Meeting encounter modal component

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSimulation` hook: already exports `running`, `setRunning` — pause/resume control is available
- Vignette auto-pause pattern (GameView.tsx:782-786): `useEffect` watching `activeVignette && running` → `setRunning(false)` — can be replicated for encounters

### Established Patterns
- Auto-pause uses `useEffect` watching a boolean condition + `running` state
- No existing "was running before" tracking — this is new logic needed for resume
- `the_first` auto-pause at line 621 is inline in a notification-processing effect, not a dedicated pause effect

### Integration Points
- `tieredEncounterState` (useState in GameView) — non-null means modal is open
- `meetingState` (useState in GameView) — non-null means meeting modal is open
- `handleEncounterClose` callback — currently just nulls state, needs resume logic
- MeetingEncounterModal `onClose` — currently `() => setMeetingState(null)`, needs resume logic

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-pause-game-automatically-while-an-encounter-modal-is-open*
*Context gathered: 2026-03-30*
