# Phase 20: Wiring - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire three stubbed engine→UI connections: (1) notification hex click pans camera with animation, (2) avatar position feeds action targeting range gating, (3) actor IDs appear in all tick events and are shown in chronicle/trace UI. No new features — connecting existing plumbing.

</domain>

<decisions>
## Implementation Decisions

### Camera animation (WIRE-01)
- Replace `hexMapRef.current.centerOn()` with `animateCameraTo()` in the `onFocusHex` callback (GameView.tsx:429)
- Use smooth eased animation (not instant snap) — consistent with agent follow mode
- Zoom to close/location level when navigating to a notification hex (not preserving current zoom)
- `animateCameraTo` already exists in `HexMapV2/camera/CameraAnimator.ts` and is used in HexMapV2.tsx and useAgentAnimations.ts

### Avatar position (WIRE-02)
- **Likely already complete.** `useTargetActions.ts` already calls `getAvatarHexPosition()` and passes `avatarPos` to `getTargetActionSlots()`. The `targetActions.ts` range gating at line 179 uses it for hex distance calculations.
- Executor should verify the full chain works at runtime. If it does, mark WIRE-02 as already done with a verification commit (no code changes needed).
- If broken: the fix is in the data flow, not the architecture — the plumbing exists.

### Actor ID attribution (WIRE-03)
- Audit ALL event emitters in engine code for missing `actorId` on TickEvent
- Fill in `actorId` wherever the originating agent is known but not set on the event
- Chronicle and trace UI should display the actor name when `actorId` is present — e.g., show agent name as a clickable link in event entries
- TickEvent already has `actorId?: string` field (gameState.ts:79) — no type changes needed

### Claude's Discretion
- Which specific events are missing actorId (audit result)
- How to display actor names in chronicle UI (inline text, badge, link style)
- Exact zoom constant for notification camera animation
- Whether WIRE-02 needs any code changes or just verification

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Camera animation (WIRE-01)
- `src/components/Game/GameView.tsx:429` — Current onFocusHex implementation using centerOn (needs animateCameraTo)
- `src/components/HexMapV2/camera/CameraAnimator.ts:45` — animateCameraTo function signature and usage
- `src/components/Game/hooks/useNotificationNavigation.ts` — Notification navigation dispatch hook
- `src/components/HexMapV2/HexMapV2.tsx:399` — Existing animateCameraTo usage pattern

### Avatar position (WIRE-02)
- `src/components/Game/hooks/useTargetActions.ts` — Hook that already calls getAvatarHexPosition
- `src/engine/targetActions.ts:179` — Range gating logic using avatarPos
- `src/engine/visibility.ts:32` — getAvatarHexPosition implementation

### Actor ID attribution (WIRE-03)
- `src/types/gameState.ts:41-84` — TickEvent interface with actorId field
- `src/engine/orchestrator.ts` — Primary event emitter, many events already have actorId
- `src/components/Game/HexSidebar.tsx` — Chronicle/event display UI

### Requirements
- `.planning/REQUIREMENTS.md` — WIRE-01, WIRE-02, WIRE-03 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `animateCameraTo()` in CameraAnimator.ts: Takes canvas, zoom, x, y, targetScale, duration — full smooth animation with easing
- `useNotificationNavigation` hook: Already dispatches to onFocusHex — just need to change the implementation
- `getAvatarHexPosition()` in visibility.ts: Resolves ascendant → avatar → location → hex coordinates
- `hexToPixel()` in hexGrid.ts: Converts hex col/row to pixel coordinates for camera targeting

### Established Patterns
- Camera animation uses `animateCameraTo(canvas, zoom, worldX, worldY, targetScale, durationMs)` — see HexMapV2.tsx:399 and useAgentAnimations.ts:202
- Event emitters set actorId as `actorId: actor.id` or `actorId: progress.actorId` — consistent convention
- Chronicle entries in HexSidebar display event.message but may not render event.actorId as a link

### Integration Points
- GameView.tsx:429 — onFocusHex callback needs access to HexMapV2's canvas and zoom refs for animateCameraTo
- HexSidebar.tsx — Chronicle display needs to resolve actorId to agent name and render as clickable
- orchestrator.ts — Central hub where most TickEvents are created

</code_context>

<specifics>
## Specific Ideas

- Camera animation should feel like the agent follow mode — smooth, not jarring
- Actor names in chronicle should be clickable (select that agent)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-wiring*
*Context gathered: 2026-03-30*
