# Notification Expansion Design

> **Date:** 2026-03-27
> **Status:** Draft — awaiting user review
> **Scope:** Three features expanding the notification system: clickable navigation, right-click dismiss, and player-configurable notification preferences.

---

## Motivation

The current notification system routes TickEvents to three channels (toast, alert, popup) with basic click behavior — toasts and alerts select an agent on the map if `actorId` is present, and encounter toasts open the encounter modal via a custom `onClick` handler. This expansion addresses three player experience gaps:

1. **Notifications are informational dead-ends.** A toast saying "Kael completed an encounter" should let you open that encounter's detail — not just select the agent.
2. **Dismissal is coarse.** Clicking a toast navigates AND dismisses. There's no way to quickly clear a notification you've already read without triggering navigation.
3. **No player control over notification volume.** During late-game with 20+ agents, notifications can overwhelm. Players need per-type toggles and duration control.

---

## Feature 1: Clickable Navigation Targets

### Concept

Every notification that references a game entity carries a **navigation target** describing where clicking should take the player. The UI renders a subtle affordance (a navigation glyph) and clicking performs the navigation action appropriate to the channel.

### Navigation Target Type

```typescript
/** Where clicking a notification should navigate the player */
export type NavigationTarget =
  | { kind: 'agent';      agentId: string }
  | { kind: 'encounter';  encounterId: string; encounterNotification?: EncounterNotification }
  | { kind: 'hex';        col: number; row: number }
  | { kind: 'location';   locationNodeId: string }
  | { kind: 'faction';    factionId: string }
  | { kind: 'journey';    journeyId: string; agentId: string };
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `NAV_GLYPH_OPACITY` | `0.6` | Opacity of navigation affordance glyph |
| `NAV_GLYPH_HOVER_OPACITY` | `1.0` | Opacity on hover |

**PRNG:** None — navigation is deterministic UI behavior.

**Tracing:** No new trace category. Navigation clicks emit to the existing `feed` view in DebugPanel as action logs.

**Fail-soft table:**

| Failure | Fallback |
|---------|----------|
| Navigation target references deleted/invalid entity | Toast a warning "Entity no longer exists", dismiss notification |
| `encounterId` present but no matching EncounterProgress | Fall back to agent selection if `actorId` available, else dismiss silently |
| `locationNodeId` not found in graph | Fall back to hex navigation if `hexCoords` present |

### Changes to Notification Types

Add `navigationTarget?: NavigationTarget` to `ToastItem`, `AlertItem`, and `PopupItem`. The existing `actorId` and `onClick` fields on ToastItem become **legacy** — the router will populate `navigationTarget` instead, and the UI will prefer `navigationTarget` over `actorId`/`onClick` when present. This keeps backward compatibility with encounter toasts that set `onClick` directly.

```typescript
// notification.ts additions
export interface ToastItem {
  // ... existing fields ...
  navigationTarget?: NavigationTarget;  // NEW
}

export interface AlertItem {
  // ... existing fields ...
  navigationTarget?: NavigationTarget;  // NEW
}
```

### Router Changes (`notificationRouter.ts`)

The router already has access to the full `TickEvent`. Extend it to derive `NavigationTarget` from event properties:

```typescript
function deriveNavigationTarget(event: TickEvent): NavigationTarget | undefined {
  // Encounter events → encounter navigation
  if (event.type.startsWith('encounter_')) {
    return event.encounterId
      ? { kind: 'encounter', encounterId: event.encounterId }
      : undefined;
  }
  // Faction events → faction navigation
  if (event.type.startsWith('faction_') || event.type === 'trust_shattered' || event.type === 'trust_deepened') {
    return event.factionId ? { kind: 'faction', factionId: event.factionId } : undefined;
  }
  // Journey events → journey navigation
  if (event.type.startsWith('journey_')) {
    return event.journeyId && event.actorId
      ? { kind: 'journey', journeyId: event.journeyId, agentId: event.actorId }
      : undefined;
  }
  // Settlement/hex events → hex navigation
  if (event.type === 'settlement_tier_change' && event.hexCoords) {
    return { kind: 'hex', col: event.hexCoords.col, row: event.hexCoords.row };
  }
  // Default: agent selection if actorId present
  if (event.actorId) {
    return { kind: 'agent', agentId: event.actorId };
  }
  return undefined;
}
```

This requires adding optional `encounterId`, `factionId`, and `journeyId` fields to `TickEvent`. These are already conceptually available in the phases that emit these events — they just aren't surfaced on the event object yet.

### Channel-Specific Click Behavior

Per your preference — behavior differs by channel:

| Channel | Left-click | Right-click |
|---------|-----------|-------------|
| **Toast** | Navigate to target + dismiss | Dismiss only (Feature 2) |
| **Alert** | Navigate to target, keep alert visible | Dismiss only (Feature 2) |
| **Popup** | N/A (popups use explicit choice buttons) | N/A (popups have their own dismiss) |

This is a change for alerts — currently clicking an alert navigates AND dismisses. Under the new design, alerts persist until right-click dismissed or cleared via settings, making them function as a "bookmark bar" of important events.

### Navigation Dispatch

A new `useNotificationNavigation` hook centralizes the dispatch logic. GameView already holds all the state needed to open modals and select entities:

```typescript
function useNotificationNavigation(deps: {
  onSelectAgent: (id: string) => void;
  onOpenEncounter: (notification: EncounterNotification) => void;
  onFocusHex: (col: number, row: number) => void;
  onOpenLocation: (nodeId: string) => void;
  onOpenFaction: (factionId: string) => void;
  onOpenJourney: (journeyId: string, agentId: string) => void;
}) {
  return useCallback((target: NavigationTarget) => {
    switch (target.kind) {
      case 'agent':     deps.onSelectAgent(target.agentId); break;
      case 'encounter': deps.onOpenEncounter(/* lookup */); break;
      case 'hex':       deps.onFocusHex(target.col, target.row); break;
      case 'location':  deps.onOpenLocation(target.locationNodeId); break;
      case 'faction':   deps.onOpenFaction(target.factionId); break;
      case 'journey':   deps.onOpenJourney(target.journeyId, target.agentId); break;
    }
  }, [deps]);
}
```

### UI Affordance

Notifications with a `navigationTarget` show a small glyph indicating what clicking will do:

| Target kind | Glyph | Tooltip |
|------------|-------|---------|
| `agent` | `→` (existing) | "Click to view agent" |
| `encounter` | `⚔` | "Click to view encounter" |
| `hex` | `⬡` | "Click to view hex" |
| `location` | `🏘` | "Click to view location" |
| `faction` | `⚑` | "Click to view faction" |
| `journey` | `↝` | "Click to view journey" |

---

## Feature 2: Right-Click Instant Dismiss

### Concept

Right-clicking any toast or alert dismisses it immediately without triggering navigation. This gives players a way to clear "already read" notifications quickly.

### Implementation

Both `ToastStack` and `AlertBar` gain an `onContextMenu` handler:

```typescript
onContextMenu={(e) => {
  e.preventDefault();  // suppress browser context menu
  onDismiss(toast.id);
}}
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `RIGHT_CLICK_DISMISS_ENABLED` | `true` | Master toggle (respects notification settings) |

**PRNG:** None.

**Tracing:** None — dismiss is a pure UI action.

**Fail-soft table:**

| Failure | Fallback |
|---------|----------|
| `onContextMenu` not supported (rare) | Standard left-click dismiss still works |
| Event propagation reaches map canvas | `e.stopPropagation()` prevents map context menu interference |

### Visual Feedback

On right-click, the notification plays a quick fade-out animation (150ms) rather than vanishing instantly, so the player has visual confirmation of what was dismissed. The `AnimateMount` component already supports exit animations — this hooks into its `show` prop going to `false`.

### Accessibility

Add `aria-description="Right-click to dismiss"` to clickable notifications. For keyboard-only users, add a dismiss button (×) visible on focus that triggers the same dismiss action.

---

## Feature 3: Notification Preferences Panel

### Concept

A new "Notifications" section in the existing `SettingsPanel` where players can configure per-type visibility and duration behavior for each notification category.

### Notification Category Taxonomy

Group notification types into player-understandable categories:

| Category key | Display name | TickEvent types covered | Default channel | Default enabled | Default mode |
|-------------|-------------|----------------------|----------------|----------------|-------------|
| `encounters` | Encounters | `encounter_*`, `agent_encounter` | toast | ✅ | `temporary` |
| `movement` | Agent Movement | `agent_movement` | toast | ✅ | `temporary` |
| `actions` | Agent Actions | `agent_action`, `agent_action_resolved` | toast | ✅ | `temporary` |
| `social` | Social & Factions | `faction_*`, `trust_*`, `bond_formed`, `social_encounter` | alert | ✅ | `permanent` |
| `lifecycle` | Births & Deaths | (from agentLifecycle) | alert + toast | ✅ | `permanent` |
| `economy` | Economy | `settlement_tier_change`, `economic_chronicle` | toast | ✅ | `temporary` |
| `doom` | Doom & Threats | `doom_escalation` | popup | ✅ | `permanent` |
| `journeys` | Journeys | `journey_*` | toast | ✅ | `temporary` |
| `ambitions` | Ambitions | `ambition_*` | toast | ✅ | `temporary` |
| `divine` | Divine Interventions | `intervention_effect`, `control_effect_*` | toast | ✅ | `temporary` |

### Preference State Shape

```typescript
export type NotificationMode = 'permanent' | 'temporary';

export interface NotificationCategoryPrefs {
  enabled: boolean;
  mode: NotificationMode;  // permanent = until manually dismissed; temporary = auto-expire
}

export type NotificationPreferences = Record<NotificationCategoryKey, NotificationCategoryPrefs>;

export type NotificationCategoryKey =
  | 'encounters' | 'movement' | 'actions' | 'social'
  | 'lifecycle' | 'economy' | 'doom' | 'journeys'
  | 'ambitions' | 'divine';
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `DEFAULT_NOTIFICATION_PREFS` | (see category table above) | Shipped defaults for fresh game |
| `NOTIFICATION_PREFS_STORAGE_KEY` | `'tfws-notification-prefs'` | localStorage key for cross-session persistence |
| `PERMANENT_TOAST_EXPIRY` | `Infinity` | ExpiresAt value for permanent-mode toasts |

**PRNG:** None.

### Persistence Strategy

Per your preference — "both with defaults":

1. **Cross-session defaults** persist in `localStorage` under `NOTIFICATION_PREFS_STORAGE_KEY`.
2. **Per-game overrides** are stored in `GameState.notificationPreferences`.
3. **Resolution order:** GameState override > localStorage > hardcoded defaults.
4. **On new game:** Copy localStorage prefs into GameState if they exist, else use defaults.
5. **Settings panel writes:** Update both GameState and localStorage simultaneously.

```typescript
function resolvePreferences(
  gameStatePrefs: Partial<NotificationPreferences> | undefined,
  storedPrefs: Partial<NotificationPreferences> | undefined,
): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...storedPrefs,
    ...gameStatePrefs,
  };
}
```

**Fail-soft table:**

| Failure | Fallback |
|---------|----------|
| localStorage unavailable (private browsing) | Use in-memory defaults; no persistence across sessions |
| Stored prefs have unknown category keys (schema migration) | Ignore unknown keys, use defaults for missing ones |
| GameState prefs undefined (old save) | Fall through to localStorage or defaults |

### Router Integration

The notification router gains a preferences parameter. Disabled categories are filtered out entirely; temporary/permanent mode sets the `expiresAt` field:

```typescript
export function routeNotifications(
  tickEvents: TickEvent[],
  currentState: NotificationState,
  now: number,
  preferences: NotificationPreferences,  // NEW parameter
): NotificationState {
  // ... existing logic, but:
  // 1. Skip events whose category is disabled
  // 2. Set expiresAt = Infinity for permanent-mode categories
  // 3. Set expiresAt = now + TOAST_DURATION_MS for temporary-mode categories
}
```

A new pure function maps `TickEvent.type` → `NotificationCategoryKey`:

```typescript
export function eventTypeToCategory(type: TickEvent['type']): NotificationCategoryKey {
  if (type.startsWith('encounter_') || type === 'agent_encounter') return 'encounters';
  if (type === 'agent_movement') return 'movement';
  if (type === 'agent_action' || type === 'agent_action_resolved') return 'actions';
  if (type.startsWith('faction_') || type.startsWith('trust_') || type === 'bond_formed' || type === 'social_encounter') return 'social';
  if (type === 'doom_escalation') return 'doom';
  if (type.startsWith('journey_')) return 'journeys';
  if (type.startsWith('ambition_')) return 'ambitions';
  if (type === 'intervention_effect' || type.startsWith('control_effect_')) return 'divine';
  if (type === 'settlement_tier_change' || type === 'economic_chronicle') return 'economy';
  // lifecycle events come from agentLifecycle phase — type check is implicit
  return 'actions'; // safe fallback
}
```

### Settings Panel UI

Add a "Notifications" section to `SettingsPanel` between "Display" and "Debug". Each category gets a row with two controls:

```
┌─ Notifications ─────────────────────────────┐
│                                              │
│  Encounters          [on/off]   [⏱/📌]     │
│  Agent Movement      [on/off]   [⏱/📌]     │
│  Agent Actions       [on/off]   [⏱/📌]     │
│  Social & Factions   [on/off]   [⏱/📌]     │
│  Births & Deaths     [on/off]   [⏱/📌]     │
│  Economy             [on/off]   [⏱/📌]     │
│  Doom & Threats      [on/off]   [⏱/📌]     │
│  Journeys            [on/off]   [⏱/📌]     │
│  Ambitions           [on/off]   [⏱/📌]     │
│  Divine Interventions[on/off]   [⏱/📌]     │
│                                              │
│  [Reset to Defaults]                         │
└──────────────────────────────────────────────┘
```

The on/off toggle reuses the existing `toggleStyle`/`toggleDotStyle` from SettingsPanel. The mode toggle is a small segmented button: ⏱ (temporary/auto-expire) or 📌 (permanent/stays until dismissed). When a category is disabled, the mode toggle grays out.

A "Reset to Defaults" button at the bottom clears localStorage and resets GameState prefs.

### Tracing

```typescript
interface NotificationPrefsTrace {
  category: 'notification_prefs';
  detail: string;  // e.g., "encounters toggled off", "movement set to permanent"
}
```

New trace category `notification_prefs` — emitted when preferences change, for debuggability.

---

## Wiring

### Feature 1 — Clickable Navigation

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | No new phase. Existing phases add `encounterId`, `factionId`, `journeyId` to TickEvents they emit. |
| **UI rendering** | `ToastStack` and `AlertBar` updated. No new components. |
| **GameState flow** | No new fields. `NavigationTarget` lives on notification items (ephemeral state in `useNotifications`). |
| **Traces** | No new trace category. |
| **Debug visibility** | Navigation targets visible in existing feed view. |
| **Prose pipeline** | N/A — no prose display. |
| **Player controls** | Left-click on toast/alert navigates. No new toggle. |

### Feature 2 — Right-Click Dismiss

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | No change. |
| **UI rendering** | `ToastStack` and `AlertBar` gain `onContextMenu`. No new components. |
| **GameState flow** | No change. |
| **Traces** | No new trace category. |
| **Debug visibility** | N/A. |
| **Prose pipeline** | N/A. |
| **Player controls** | Right-click on toast/alert. Keyboard dismiss (×) on focus. |

### Feature 3 — Notification Preferences

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | No new phase. `routeNotifications` gains `preferences` param — called from `useNotifications` hook which reads prefs from context/GameState. |
| **UI rendering** | `SettingsPanel` expanded with Notifications section. Already rendered in GameView. |
| **GameState flow** | New field `notificationPreferences?: Partial<NotificationPreferences>` on GameState. Read by `useNotifications`. |
| **Traces** | New category `notification_prefs`. Emitted from settings panel change handler. |
| **Debug visibility** | Preferences visible in DebugPanel feed when toggled. |
| **Prose pipeline** | N/A. |
| **Player controls** | Per-category on/off toggle + permanent/temporary mode toggle in SettingsPanel. Reset button. |

---

## Implementation Ordering

1. **Phase A — Right-click dismiss** (smallest, no dependencies)
   - Add `onContextMenu` to `ToastStack` and `AlertBar`
   - Add fade-out animation on dismiss
   - Add keyboard dismiss affordance

2. **Phase B — Navigation targets** (depends on extending TickEvent)
   - Add `NavigationTarget` type
   - Extend `TickEvent` with optional `encounterId`, `factionId`, `journeyId`
   - Update emitting phases to populate new fields
   - Update `routeNotifications` to derive and attach `NavigationTarget`
   - Create `useNotificationNavigation` hook
   - Update `ToastStack` click: navigate via target, dismiss
   - Update `AlertBar` click: navigate via target, keep visible

3. **Phase C — Notification preferences** (largest, independent of A/B)
   - Define `NotificationPreferences` type and defaults
   - Add `eventTypeToCategory()` mapping
   - Add `preferences` param to `routeNotifications`
   - Add persistence layer (localStorage + GameState field)
   - Build Notifications section in `SettingsPanel`
   - Wire preferences into `useNotifications` hook

---

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | **PASS** — All magic numbers are named constants (durations, opacity, storage keys, category defaults). |
| 2 | Inspectability | **PASS** — Navigation targets visible on notification items; new `notification_prefs` trace category for settings changes. |
| 3 | Determinism | **PASS** — No PRNG involved. All behavior is deterministic UI response. |
| 4 | Fail-soft | **PASS** — Every feature has explicit failure table with fallback behavior. Invalid navigation targets degrade gracefully. localStorage unavailability handled. |
| 5 | Narrative over mechanical | **PASS** — N/A for this feature (pure UI). |
| 6 | Additive over destructive | **PASS** — `navigationTarget` is a new optional field; existing `actorId`/`onClick` preserved. `routeNotifications` gains optional param with backward-compatible default. |
| 7 | Performance budget | **PASS** — No new per-tick computation. Category lookup is a constant-time string match. Preferences resolved once per tick batch, not per event. |
