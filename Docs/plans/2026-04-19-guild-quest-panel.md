# Guild Quest Panel — Settlement LocationView

**Linear:** THR-180 (deferral from THR-156 — PR 8 follow-up)
**Project:** Elder Magic & Ruins
**Parent design:** `Docs/plans/2026-04-19-ruins-layer-design.md` (§ Adventurer's Guild hooks)
**Parent issue:** THR-156 (PR 8 — quest hook phase, already shipped)
**Status:** Ready for Dev
**Author:** Cowork (2026-04-19)

---

## 1. Purpose

`phaseRuinQuestHooks` (THR-156) already stamps `questHookPostedTick` and `questHookTemplateId` onto ruin location nodes when clue evidence is high enough and an Adventurer's Guild hall is within `GUILD_QUEST_RADIUS` hexes. A toast fires at the moment of issuance, but **the player has no in-world surface to review active postings after the toast scrolls away.** A mortal walking into a settlement with a Guild would see a cork board.

THR-180 adds that cork board. It is purely a UI read surface over existing state — no new engine behavior, no new data on nodes, no new traces.

## 2. Three-pillar scope

### 2.1 Engine — **N/A**

No engine changes. Data already exists:

| Existing surface | Source | Used by this panel |
|---|---|---|
| `ruin.properties.questHookPostedTick: number` | `phaseRuinQuestHooks` (THR-156) | Freshness / cooldown filter |
| `ruin.properties.questHookTemplateId: string` | `phaseRuinQuestHooks` (THR-156) | Template lookup for quest name |
| `ruin.properties.ruinMagnitude: number` | Worldgen (THR-154) | Tier badge (Minor / Major / Saga) |
| `ruin.properties.hexCol` / `hexRow` | Worldgen | Distance + direction computation |
| `location.contains → sublocation.factionDefId = 'adventuring_guild'` | Faction worldgen | Gate: panel only renders when settlement has a Guild hall |
| `GUILD_QUEST_RADIUS`, `QUEST_HOOK_COOLDOWN_TICKS`, `RUIN_MAGNITUDE_MINOR_MAX`, `RUIN_MAGNITUDE_MAJOR_MAX` | `src/engine/ruins/constants.ts` | Window filtering + tier classification |
| `hexDistance(a, b)` | `src/lib/hexMath.ts` | Same distance math as engine — keep parity |

**No new traces, no new constants, no new graph edges or node properties.** Any logic gap that would require new engine data must bounce back to the design, not be added inline.

### 2.2 Content

Prose lives inline in the component (small volume — five short strings). No entries in the prose content system.

**Header copy (static):** "Guild Postings" — single string, no template variants. The guild's presence is conveyed by the section existing at all.

**Empty state (Guild present, no active hooks within cooldown):**
> *The notice board is quiet. No contracts have been posted since the guild's last sweep.*

**Quest row format:** one line per active hook, rendered as a clickable row:
- **Line 1 (primary):** quest template display name — e.g. *"Depths of the Sealed Vault"* (from the `ag.quest.ruin_delve` / `ag.senior.deep_expedition` / `ag.elite.lost_city` template `name` field — **see §6.3** for resolution)
- **Line 2 (secondary, smaller):** `{ruinName} — {direction}, {distance} hex{es} out`  (e.g. *"Redroot Ossuary — northeast, 3 hexes out"*)
- **Right-side badge:** magnitude tier pill — `Minor` / `Major` / `Saga`, colored via `RARITY_TIER_COLORS` (map Minor→tier1, Major→tier3, Saga→tier5 for visual parity with existing rarity pips)

**Tier classification** (mirrors `selectQuestTemplateForRuin` in `questHooks.ts`):
- `ruinMagnitude <= RUIN_MAGNITUDE_MINOR_MAX` (0.33) → **Minor**
- `ruinMagnitude <= RUIN_MAGNITUDE_MAJOR_MAX` (0.66) → **Major**
- else → **Saga**

**No new prose tables.** If the quest template `name` field is missing for a templateId, fall back to `"Expedition contract"` (fail-soft).

### 2.3 UI

**New component:** `src/components/Game/GuildQuestPanel.tsx`

```typescript
interface GuildQuestPanelProps {
  location: GraphNode;            // The settlement location the player is viewing
  graph: WorldGraph;
  tick: number;                   // Current tick — used for cooldown window
  onNavigateToRuin: (locationId: string) => void; // Zooms camera + opens that location
}
```

**Render gate** (returns `null` when false): panel renders ONLY if every condition holds:
1. The location has at least one sublocation with `factionDefId === 'adventuring_guild'` (i.e. a guild hall is present).
2. The location has valid `hexCol` / `hexRow`.

Once rendered, the panel may still be empty (see empty state copy).

**Data selection** (pure computation, memoized on `[location.id, graph, tick]`):
1. Compute settlement hex `{ col: location.properties.hexCol, row: location.properties.hexRow }`.
2. Scan all location nodes with `typeof properties.ruinMagnitude === 'number'`.
3. For each ruin: keep if `hexDistance(settlementHex, ruinHex) <= GUILD_QUEST_RADIUS`.
4. Of those: keep if `questHookPostedTick != null && tick - questHookPostedTick < QUEST_HOOK_COOLDOWN_TICKS`.
5. Sort by `ruinMagnitude` desc (Saga > Major > Minor), then by distance asc (closer first within a tier).

**Layout (parent = `LocationView.tsx`, sublocation branch, below the sublocation list):**

```
┌─ Sublocations ─────────────────────┐  (existing list)
│  [Guild Hall of Embers]            │
│  [Market Square]                   │
│  ...                               │
└────────────────────────────────────┘

┌─ Guild Postings ─────────────▼─────┐  ← new, collapsible, default expanded
│                                    │
│  ▸ Depths of the Sealed Vault     [Major] │
│    Redroot Ossuary — northeast, 3 hexes  │
│                                            │
│  ▸ Expedition contract             [Minor] │
│    the ruin — south, 2 hexes out           │
│                                            │
└────────────────────────────────────────────┘
```

Rendered inside the sublocation branch (~line 1196 of `LocationView.tsx`), between the sublocation list and the closing `</div>` of that branch. **Do not** render in the flat (no-sublocations) branch — settlements always have sublocations by construction, so the flat branch is non-applicable here.

**Interaction:**
- Each quest row is a `<button>` (full-row click target) + keyboard Enter/Space handler.
- Click invokes `onNavigateToRuin(ruinLocationId)`.
- `LocationView` wires `onNavigateToRuin` by accepting a new prop passed down from `GameView`. `GameView` already exposes `handleZoomToLocation` (GameView.tsx line 1442) — reuse it; it handles camera fly-to + location selection. This preserves the existing pattern used by DebugPanel.
- Collapse toggle: lightweight `<button>` header with a chevron; persists in component state (no need to lift). Default expanded.

**Styling:**
- Reuse the existing `SectionHeading` primitive for the panel header (keeps typography consistent with the rest of LocationView).
- Row background / border tokens: match the existing "Available encounters" card styling in LocationView (bg-deep / border-gold → hover accent-gold). Do not introduce new tokens.
- Tier badge: reuse `RARITY_TIER_COLORS` — Minor→`[1]`, Major→`[3]`, Saga→`[5]`. Visual parity with existing rarity pips.
- Hex distance badge text: `"{direction}, {distance} hex{es} out"` — pluralize `hex` when `distance !== 1`.

**Notifications / chronicle:** none from this panel — the toast and chronicle entry are already produced by `phaseRuinQuestHooks`. This panel is read-only.

**Debug inspection:** no new DebugPanel view. The underlying data (`questHookPostedTick`, `questHookTemplateId`) is already visible via the Node Inspector when a ruin is selected.

**Hex map signifiers:** none. The existing toast includes `hexCoords` on the ruin; the map already flashes at that coordinate. A persistent map signifier for active postings is a **separate** feature and out of scope (see § 8).

### 2.4 Wiring

Per `Docs/plans/wiring-checklist.md`:

| Surface | Connection |
|---|---|
| **Orchestrator phase** | N/A — no tick-phase behavior |
| **UI component rendered in JSX** | `GuildQuestPanel` rendered inside `LocationView.tsx` (sublocation branch, below sublocation list) |
| **GameState field consumed by UI** | Reads `gameState.graph` + `gameState.tick` only — both already plumbed to `LocationView` |
| **Traces emitted** | None (read-only panel) |
| **Player controls connected** | Row click → `handleZoomToLocation` (existing) via new `onNavigateToRuin` prop |
| **Prose pipeline (`enrichProse()`)** | N/A — no enriched prose (all strings static + interpolation) |

Wiring checklist updates — none. No new phases, modals, GameState fields, trace categories, or player controls.

## 3. Constants table

No new constants. Reuses:

| Constant | Source | Used for |
|---|---|---|
| `GUILD_QUEST_RADIUS` (5) | `src/engine/ruins/constants.ts` | Ruin-selection radius from settlement |
| `QUEST_HOOK_COOLDOWN_TICKS` (60) | `src/engine/ruins/constants.ts` | Freshness window for "active" hooks |
| `RUIN_MAGNITUDE_MINOR_MAX` (0.33) | `src/engine/ruins/constants.ts` | Tier split |
| `RUIN_MAGNITUDE_MAJOR_MAX` (0.66) | `src/engine/ruins/constants.ts` | Tier split |
| `RARITY_TIER_COLORS` | `src/types/rarity.ts` | Tier badge color |

If CC discovers a genuine need for a new constant (e.g. a max-rows cap), name it in `src/engine/ruins/constants.ts` and document it here before implementing.

## 4. Fail-soft table

| Failure case | Fallback |
|---|---|
| `location.properties.hexCol` or `hexRow` missing | Render `null` (panel hidden). No crash. |
| No Guild sublocation found | Render `null`. |
| Guild sublocation present but no ruins in radius | Render empty-state copy. |
| Ruins in radius but none within cooldown window | Render empty-state copy. |
| `questHookTemplateId` is not in `INITIATIVE_TEMPLATE_MAP` / faction quest template map | Quest row still renders with fallback name `"Expedition contract"`; row still clickable. |
| `ruinMagnitude` missing or non-numeric | Skip that ruin (treat as not-a-ruin). |
| `onNavigateToRuin` throws | Caught and swallowed — log to console in dev only; the panel must never crash the LocationView host. |
| `graph.getNodesByType('location')` returns a very large list (e.g. epic map with 800+ locations) | Acceptable: filter inside a single `useMemo`. Typical settlement will see ≤ 20 ruins within radius. No pagination needed for v1. |

Every fallback is silent and additive — the panel never surfaces an error, never throws, never crashes the host view.

## 5. Testing

**Unit / component tests** (`src/components/Game/__tests__/GuildQuestPanel.test.tsx`):

1. **Renders null when no Guild sublocation** — location with `contains` edges to non-guild sublocations only → panel returns null.
2. **Renders empty state when Guild present but no ruins in radius** — Guild sublocation + zero ruin nodes with the magnitude property → empty-state copy visible.
3. **Renders empty state when ruins exist outside radius** — ruin > `GUILD_QUEST_RADIUS` hexes away → filtered out.
4. **Renders empty state when ruins exist inside radius but hook is stale** — `tick - questHookPostedTick >= QUEST_HOOK_COOLDOWN_TICKS` → filtered out.
5. **Renders a Minor-tier row** — ruin magnitude 0.2, active hook → row visible with `Minor` badge and correct ruin name / direction / distance.
6. **Renders a Saga-tier row** — ruin magnitude 0.8 → row visible with `Saga` badge.
7. **Sort order** — Saga-2h + Minor-1h + Major-3h → rendered as Saga, Major, Minor.
8. **Row click calls `onNavigateToRuin(ruinId)`** — standard click + keyboard (Enter).
9. **Missing `hexCol` on settlement** — returns null, does not throw.
10. **Missing `questHookTemplateId` template lookup** — falls back to `"Expedition contract"`, row still renders.

**Integration check (manual, in CLI or browser):**
- Run CLI with `seed 42`, advance ticks until `phaseRuinQuestHooks` fires (every 30 ticks by `RUIN_QUEST_GENERATION_INTERVAL_TICKS`) and produces a `ruins.quest_hook_issued` trace.
- Open the browser on the Guild-bearing settlement — panel should show the hook until 60 ticks pass.
- CC should screenshot at 1920×1080 to confirm viewport compliance.

## 6. Implementation notes

### 6.1 File layout
- New: `src/components/Game/GuildQuestPanel.tsx`
- New: `src/components/Game/__tests__/GuildQuestPanel.test.tsx`
- Edit: `src/components/Game/LocationView.tsx` — import + render the panel inside the sublocation branch; accept `onNavigateToRuin` as a prop.
- Edit: `src/components/Game/GameView.tsx` — pass `onNavigateToRuin={handleZoomToLocation}` down to `LocationView`.

### 6.2 Hex direction
Use the same 8-wind compass logic as `questHooks.ts:hexDirection` — or, to avoid duplication, **export that helper from `questHooks.ts`** and import it in the panel. Keeping the direction string identical between toast and panel matters for player continuity ("The guild posts a contract to the northeast" → panel also says "northeast").

### 6.3 Quest template name resolution
The `questHookTemplateId` points to a faction quest template (`ag.quest.ruin_delve`, `ag.senior.deep_expedition`, `ag.elite.lost_city`). CC should:
1. Locate the faction quest template registry (likely `src/data/faction-quest-templates.ts` or similar — search for `ag.quest.ruin_delve`).
2. Expose a typed lookup `getFactionQuestTemplate(id: string): { name: string } | undefined` if one does not already exist.
3. Fall back to `"Expedition contract"` when the lookup misses.

If the templates are not yet registered in a lookup-friendly way, that is a genuine gap — surface it in a comment and use the fallback pending a separate issue. **Do not** invent a new registry pattern inline.

### 6.4 Parity with `phaseRuinQuestHooks`
The panel's ruin-filter logic **must** mirror the phase's issue-logic so the player never sees a row that the engine wouldn't have posted:
- Same radius (`GUILD_QUEST_RADIUS`)
- Same cooldown (`QUEST_HOOK_COOLDOWN_TICKS`)
- Same magnitude tier mapping
- Same direction string format

Any drift between phase and panel is a bug. If `phaseRuinQuestHooks` changes, this panel must update in lockstep.

### 6.5 Memoization
The inner scan is `O(locations)` per render. Memoize on `[graph, location.id, tick]` via `useMemo`. The `graph` identity is stable within a tick per the load-bearing decision in `CLAUDE.md` (use `worldVersion` if needed, but `tick` already bumps every tick and is sufficient for a read-only list).

## 7. NFP Compliance

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Reuses existing named constants; zero magic numbers in the panel. |
| 2. Inspectability | PASS | Panel surfaces existing `questHookPostedTick` / `questHookTemplateId` — these are already trace-documented. |
| 3. Determinism | PASS | No PRNG. Pure function of graph state. |
| 4. Fail-soft | PASS | Every missing-data case renders null or empty state; no throws escape the panel boundary. |
| 5. Narrative over mechanical perfection | PASS | Prose is terse and diegetic ("guild postings", hex direction, tier badge) — no numeric distances as raw numbers beyond the hex count which serves wayfinding, not stats. |
| 6. Additive over destructive | PASS | New file + one prop threading. No refactors to existing components. |
| 7. Performance budget | PASS | Single memoized scan per render; panel is only mounted when a settlement with a Guild is open. |

## 8. Out of scope

- **Hex map signifier for active postings** — a small banner or icon on ruin hexes with active hooks. Valuable, but a separate concern (touches HexMapV2 layers). Log as a follow-up if the user requests it; do not add in THR-180.
- **Per-player "I'm working on this" marker** — no click-to-commit; the panel is purely informational. Commit-to-delve is handled by the existing delve initiation path.
- **Historical / expired postings** — once past cooldown, the row disappears. No archive view.
- **Guild hall sublocation drill-down repetition** — the panel stays at the settlement level, not inside the Guild Hall's `SublocationDetailView`. Surfacing at parent level matches THR-180 wording ("in LocationDetail") and keeps the panel visible alongside other sublocations rather than gated behind a drill-down.
- **Multiple guilds in one settlement** — if two Adventurer's Guild sublocations exist in one location (rare / not current worldgen behavior), the panel lists all postings the nearest guild would issue and does not distinguish by individual guild. Revisit if faction worldgen changes to allow multiple guilds per settlement.
