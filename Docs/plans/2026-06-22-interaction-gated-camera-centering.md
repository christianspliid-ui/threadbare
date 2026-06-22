# Interaction-gated camera centering on agent movement

**Date:** 2026-06-22
**Status:** Ready for Dev
**Project:** Small manual tweaks
**Pillars:** Engine (light — read-only state derivation) · UI (camera behavior) · Content (N/A)

## Problem

Today the camera pans to a followed agent on **every hex change** they make. The
player asked: only re-center when there is an *interaction possibility* at the
agent's new position. Plain wandering should not yank the camera around.

Per the design conversation (2026-06-22), "interaction possibility" =

- **(A) Pending encounter / aftermath** — the agent has a live encounter or an
  aftermath reaction awaiting the player on the hex they moved to, **OR**
- **(B) Arrival at a populated location** — the agent moved into a
  location/sublocation that already contains at least one other agent (a social
  encounter could spark).

When neither holds, the camera **stays put** (no pan, no leash).

## Step 0 — confirm the live centering trigger (required before coding)

The single place the camera pans on agent hex-change is the **follow-mode block**
in `src/components/HexMapV2/hooks/useAgentAnimations.ts` (lines ~189–206):
when `followMode.active`, every time the followed agent's `hexKey` changes it
calls `animateCameraTo(...)`.

**Caveat:** in the committed tree, the activator `HexMapV2Handle.setFollowAgent`
is **never called** (grep `setFollowAgent\(` → only the definition at
`HexMapV2.tsx:682`). So either (a) follow mode is wired in the working tree by a
local change the plan author couldn't see, or (b) the observed "centers on every
move" behavior comes from a path not yet identified. **First task:** reproduce in
the browser, then confirm via `git diff` / `__DEBUG` which code path actually pans
the camera on movement. If it is the follow-mode block, implement below as-is. If
it is a different path, apply the *same predicate* at that site — the gating logic
is seam-independent.

## Engine pillar — the predicate (read-only derivation)

Add a pure helper, e.g. `src/components/Game/cameraInteractionGate.ts`:

```ts
export interface CameraGateInputs {
  graph: WorldGraph;
  encounterNotifications: EncounterNotification[];
  encounterProgress: EncounterProgress[]; // for pending aftermath
  tick: number;
}

/** True when centering on this agent's new position is warranted. */
export function shouldCenterOnAgentMove(agentId: string, i: CameraGateInputs): {
  center: boolean;
  reason: 'pending_encounter' | 'populated_arrival' | 'suppressed';
};
```

Logic:

- **(A) Pending encounter / aftermath** — `true` if `encounterNotifications`
  has an unresolved entry with `agentId === agentId`, **or** the agent has a
  pending aftermath reaction (an `encounterProgress` entry for `actorId === agentId`
  awaiting a player pick — mirror the filter `EncounterCacheView` already uses:
  `activeEncounters.filter(p => p.actorId === followAgentId)`).
- **(B) Populated arrival** — resolve the agent's position via the three-tier
  model (`located_at` → location → `parentLocationId`/hex). Count **other**
  actors `located_at` the same location (or same hex, per the load-bearing
  "encounter awareness is hex-granular" decision). If
  `count >= MIN_COLOCATED_FOR_CENTER`, `true`.
- Else `suppressed`.

This helper does **no mutation** and throws nothing (NFP #4). It is the only new
logic; everything else is plumbing.

## UI pillar — apply the gate at the pan site

1. **GameView** computes a stable callback and passes it down:
   `shouldCenterOnAgent={(id) => shouldCenterOnAgentMove(id, gateInputs).center}`
   where `gateInputs` is memoized over
   `gameState.graph` (via `runtime.worldVersion`), `gameState.encounterNotifications`,
   `gameState.encounterProgress`, `gameState.tick`.
2. **HexMapV2** accepts a new optional prop
   `shouldCenterOnAgent?: (agentId: string) => boolean` and threads it into
   `useAgentAnimations` (store on a ref so the render loop reads the latest without
   re-subscribing — same pattern as `onCameraCenterHexRef`).
3. **useAgentAnimations follow block** — before `animateCameraTo`, consult the
   predicate:

   ```ts
   if (newKey !== follow.lastHexKey) {
     follow.lastHexKey = newKey; // always advance so we re-evaluate next move
     const gate = shouldCenterRef.current;
     if (CENTER_ON_INTERACTION_ONLY && gate && !gate(followedAgent.id)) {
       // suppressed: hold camera, optionally emit a trace
     } else {
       animateCameraTo(...);
     }
   }
   ```

When `CENTER_ON_INTERACTION_ONLY` is `false`, behavior is identical to today
(always pan) — a clean revert switch.

### Browser verification (Definition of Done — UI pillar)

Use Claude-in-Chrome (WebGL canvas — Playwright can't see it) at 1920×1080,
`?view=game&seeded&size=medium`:

1. Enable follow on a retinue agent; `run` several ticks across empty hexes →
   **camera holds** (screenshot before/after identical framing).
2. Drive the agent into an encounter hex / a populated location → **camera pans**.
3. Console capture (errors+warnings) pasted as a fenced block.
4. `__DEBUG` assertion proving the gate fired — see Tracing below
   (`window.__DEBUG.getTraces()` filtered to `camera_center`, or a small
   `__DEBUG.getLastCameraGateDecision()` helper).

## Constants (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `CENTER_ON_INTERACTION_ONLY` | `true` | Master switch. `false` = legacy always-pan. |
| `CENTER_ON_PENDING_ENCOUNTER` | `true` | Trigger (A) enabled. |
| `CENTER_ON_POPULATED_ARRIVAL` | `true` | Trigger (B) enabled. |
| `MIN_COLOCATED_FOR_CENTER` | `1` | Other-agent count at destination that counts as "populated". |

Co-locate these in a single module (e.g. `cameraInteractionGate.ts`) so feel is
tuned by editing numbers, not logic.

## Tracing (NFP #2)

Add a `camera_center` trace category. Emit on every evaluated hex-change:

```ts
interface CameraCenterTrace {
  category: 'camera_center';
  agentId: string;
  hexCol: number; hexRow: number;
  centered: boolean;
  reason: 'pending_encounter' | 'populated_arrival' | 'suppressed';
  tick: number;
}
```

Register the category in `TRACE_CATEGORIES` (omission has caused silent drops
before — see encounter-migration codex review notes). No-op when tracing is off.

## Fail-soft (NFP #4)

| Failure | Fallback |
|---|---|
| Agent node / `located_at` chain missing | `suppressed` (hold camera) — never throw |
| `encounterNotifications` / `encounterProgress` undefined | treat as empty → trigger (A) false |
| Predicate callback not supplied to hook | default to legacy always-pan (no regression) |
| Trace category missing | skip the trace; centering still works |

Conservative bias = "hold unless we're sure there's interaction," matching intent.

## Wiring checklist

- New module `cameraInteractionGate.ts` imported by GameView ✔
- New `shouldCenterOnAgent` prop on `HexMapV2` consumed by `useAgentAnimations` ✔
- GameState reads: `graph`, `encounterNotifications`, `encounterProgress`, `tick` ✔
- Trace `camera_center` emitted + registered ✔
- `__DEBUG` surface for verification ✔
- Update `Docs/plans/wiring-checklist.md` if a new HexMapV2 prop / trace category
  warrants an entry.

## Out of scope

- In-place encounters (agent doesn't move): already surfaced by the
  notification/toast + `AgentPulseOverlay` spotlight. This change governs the
  movement pan only.
- The dormant `setFollowAgent` activation question (Step 0) — confirm, don't
  redesign follow mode here.

## NFP compliance

| NFP | Status |
|---|---|
| 1 Tunability | PASS — 4 named constants, master revert switch |
| 2 Inspectability | PASS — `camera_center` trace + `__DEBUG` decision read |
| 3 Determinism | PASS — predicate is pure over graph + state; no PRNG |
| 4 Fail-soft | PASS — every failure path holds the camera, never throws |
| 5 Narrative over mechanical | PASS — centers on story moments, ignores noise |
| 6 Additive | PASS — new module + optional prop; legacy path preserved behind flag |
| 7 Performance | PASS — predicate runs only on hex-change of the followed agent (≤1/agent/tick) |

## Rulebook / Vision impact

None — camera framing is presentation, not a rule of play.
