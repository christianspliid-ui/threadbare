# Phase 12 — UI Review

**Audited:** 2026-03-30
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md for this phase)
**Screenshots:** Not captured (no dev server detected at localhost:3000, 5173, or 8080)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Empty-state text is contextual and specific; army event messages rely on trace summaries |
| 2. Visuals | 2/4 | Army/battle layers implemented but NOT wired in GameView — zero visibility in production |
| 3. Color | 3/4 | New battle indicator colors are named constants; army events render stone-gray in NarrativeLog |
| 4. Typography | 3/4 | ArmiesTab hardcodes font sizes inline rather than using design token classes |
| 5. Spacing | 2/4 | ArmiesTabContent is entirely inline-style with magic pixel values — not following Tailwind scale |
| 6. Experience Design | 3/4 | Fail-soft coverage is thorough; Destruction Log section missing from ArmiesTab |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Army and battle layers not passed to HexMapV2 in GameView.tsx** — Players see no army sprites or battle indicators on the hex map despite the engine tracking all of this data — calls `buildArmyRenderData(graph)` and `buildBattleIndicatorData(graph)` in `GameView.tsx`, then pass `armies={armyRenderData}` and `battles={battleIndicatorData}` to the `<HexMapV2>` usage at line 979.

2. **New TickEvent types have no color entries in `uiColorPalette.ts`** — Army/battle chronicle events show as a generic stone-gray dot (#78716c fallback) in NarrativeLog, making them indistinguishable from system noise — add entries for `army_mobilization`, `army_disbanded`, `battle_started`, `battle_resolved`, `siege_established`, and `army_attrition` to `TICK_EVENT_COLORS` in `src/data/uiColorPalette.ts`.

3. **ArmiesTabContent uses 59+ inline style objects with magic pixel values** — No Tailwind spacing classes, pixel values like `padding: '8px'`, `marginBottom: '6px'`, `fontSize: '11px'` — the component is unreadable at a glance and breaks the project's design token convention — refactor to use Tailwind classes and `var(--text-*)` tokens matching the rest of DebugPanel.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

The phase introduces two significant copy surfaces: the ArmiesTab empty state and the NarrativeLog army event messages.

**Passing:**
- `DebugPanel.tsx:1015` — Empty state reads: "No armies or battles yet. Factions need military ambitions and sufficient Iron+Gold capability." This is specific, informative, and tells the developer exactly what preconditions are needed. Far above generic "No data."
- `DebugPanel.tsx:959` — Encounter empty state: "No active encounter notifications." is clear and contextual.
- `armyNotifications.ts` — Event messages are passed through from `trace.summary`, which is set by the engine. Trace summaries from `factionAmbitions.ts` and `armySpawning.ts` are narrative-quality strings.

**Minor issues:**
- The "Active Armies" and "Active Battles" section headers in ArmiesTabContent (`DebugPanel.tsx:1026, 1082`) are purely functional labels. They work for a debug panel but a production UI context would benefit from more evocative labels.
- The Destruction Log section called for in the 12-07 plan is entirely absent from the ArmiesTab implementation — there is no chronicle of recent destruction events from the trace buffer.

### Pillar 2: Visuals (2/4)

Phase 12-07 created two new visual layers — `ArmyLayer.ts` and `BattleIndicatorLayer.ts` — with carefully designed canvas textures. The army dots use faction-color circles with size pips (chevrons) per size tier. Battle indicators use a red crossed-swords icon and an orange dashed encirclement ring with inward-pointing arrows. The visual design intent is solid.

**Critical gap — production wiring missing:**

`GameView.tsx` renders `<HexMapV2>` at line 979 with `agents={agentRenderData}` but does NOT pass `armies` or `battles` props. `HexV2View.tsx` similarly omits these props at line 178. The `HexMapV2.tsx` defines the props interface at lines 155-157 and imports the layer modules (lines 32-37), but without the props being supplied, neither `createArmyLayer` nor `createBattleIndicatorLayer` is ever called with real data.

This means every army and battle in the engine is completely invisible on the hex map. The work done in Plans 02-06 (army spawning, movement, battles, sieges) generates no visual output for the player.

**ArmiesTab visual design** (debug panel):
- The quintessence bar is a raw percentage text value (`60.0 / 100 (60%)`) not a visual progress bar, while the plan specified "Quintessence bar (current/max)".
- Momentum is shown as a numeric value with a color indicator, but the plan called for a "visual bar: ← defender ... attacker →" directional representation.
- No spotlight history template IDs are shown — only a count.

### Pillar 3: Color (3/4)

**Passing:**
- `BattleIndicatorLayer.ts` — Battle indicator colors are named exports: `FIELD_BATTLE_COLOR = '#f87171'` and `SIEGE_COLOR = '#fb923c'`. These are tunable and consistently used — NFP #1 satisfied.
- `ArmyLayer.ts` — `ARMY_FALLBACK_COLOR = '#888888'` and `ARMY_HIGHLIGHT_OPACITY = 0.35` are named constants.
- `ArmyLayer.ts:26` imports `FACTION_HERALDIC_COLORS` for faction color derivation — reuses existing color vocabulary.

**Issues:**
- `DebugPanel.tsx:1081` — Section header "Active Battles" uses `color: '#f87171'` inline — this is the same value as `FIELD_BATTLE_COLOR` in BattleIndicatorLayer but is duplicated rather than imported.
- `DebugPanel.tsx:1100` — Momentum indicator uses `'#f87171'` (attacker), `'#60a5fa'` (defender), `'#888'` (neutral) all inline — none of these are referenced from `uiColorPalette.ts`.
- `DebugPanel.tsx:1056` — Quintessence health colors `'#f87171'`, `'#fbbf24'`, `'#4ade80'` are inline — not from the palette.
- `src/data/uiColorPalette.ts:126-137` — `TICK_EVENT_COLORS` is typed as `Record<TickEvent['type'], string>` but does not contain entries for `army_mobilization`, `army_disbanded`, `battle_started`, `battle_resolved`, `siege_established`, or `army_attrition`. NarrativeLog falls back to `#78716c` (stone-gray) for all six new event types.

### Pillar 4: Typography (3/4)

Across the entire component tree: 8 distinct font size classes in use (`text-xs` through `text-4xl`) and 4 weight classes (`font-normal`, `font-medium`, `font-semibold`, `font-bold`). This is within acceptable range for a complex debug/game UI.

**Issues specific to Phase 12 additions:**
- `ArmiesTabContent` sets `fontSize: '11px'` inline on multiple card containers (`DebugPanel.tsx:1040`). The Tailwind equivalent `text-xs` (12px) or `text-[11px]` should be preferred — the value is below the standard scale.
- `DebugPanel.tsx:1028` — Section header uses `fontSize: '13px'` inline — between `text-xs` (12px) and `text-sm` (14px). Not on the Tailwind scale.
- The rest of DebugPanel uses `fontSize: 'var(--text-sm)'` and `fontSize: 'var(--text-xs)'` via CSS custom properties, making the new army section's raw pixel values inconsistent.

### Pillar 5: Spacing (2/4)

The existing DebugPanel has an established pattern of CSS custom-property based styles within shared objects (`DETAIL_ROW_STYLE`, `DETAIL_LABEL_STYLE`, `DETAIL_AREA_STYLE`). The new `ArmiesTabContent` uses these shared style objects for some elements but adds numerous one-off inline styles.

**Counted instances:** 59 inline `style` usages in DebugPanel.tsx — many are pre-existing — but the new armies section adds a layer of raw pixel values inconsistent even with the rest of the file.

**Specific arbitrary values in Phase 12 additions:**
- `padding: '8px'` (army cards, `DebugPanel.tsx:1040`)
- `marginBottom: '6px'` (`DebugPanel.tsx:1040`)
- `marginBottom: '8px'` (`DebugPanel.tsx:1028`)
- `marginTop: '12px'` (`DebugPanel.tsx:1081`)
- `padding: '12px'` (container, `DebugPanel.tsx:1024`)

None of these use `DETAIL_AREA_STYLE.padding` or the Tailwind p/m/gap scale. By contrast, the existing `SphereStateTabContent` uses `padding: '16px'` and `gap: '8px'` with some consistency — but still not Tailwind.

**HexMapV2 and scene modules (pass):** `ArmyLayer.ts` and `BattleIndicatorLayer.ts` use named world-unit constants (`ARMY_DOT_RADIUS_WARBAND = 5`, `BATTLE_SPRITE_SIZE = 12`) that follow the scene-layer convention established in earlier phases.

### Pillar 6: Experience Design (3/4)

**Passing:**
- `ArmyLayer.ts` — Comprehensive fail-soft: missing `located_at` edge → skip, missing faction → fallback color, `getArmyTexture()` canvas context failure → transparent fallback texture.
- `BattleIndicatorLayer.ts` — Same fail-soft pattern for missing location edges.
- `armyNotifications.ts` — `buildThreadedAgentSet` returns empty set if no `ascendantId`, all trace field accesses use type assertions with undefined checks.
- `DebugPanel.tsx:999-1003` — Graph guard: `if (!graph) return <div>No graph available.</div>`.
- `GameView.tsx` wraps in `GameErrorBoundary` (line 819).

**Missing:**
- The Destruction Log section (plan 12-07, Task 5) was not implemented. The plan called for "Recent destruction events from trace buffer — severity, settlement, consequences summary." The ArmiesTab ends after Active Battles with no destruction history.
- `ArmiesTabContent` has no loading state — if graph query takes a tick to complete, there is no transition state. (Minor; graph queries are synchronous.)
- The `phaseArmyNotifications` at orchestrator phase 2.358 generates events correctly, but those events use `type: 'army_mobilization'` etc. which NarrativeLog's `TYPE_COLORS` lookup treats as unknown, silently falling through to gray. No error, but degraded visibility.
- `HexV2View.tsx` — The `armies` and `battles` props are absent from its `HexV2ViewProps` interface entirely (line 18-29), meaning the dev view (`?view=hexv2`) cannot be used to test army rendering either.

---

## Registry Safety

shadcn not initialized (`components.json` not found). Registry audit skipped.

---

## Files Audited

**Phase 12 primary additions:**
- `src/components/HexMapV2/scene/ArmyLayer.ts`
- `src/components/HexMapV2/scene/BattleIndicatorLayer.ts`
- `src/components/HexMapV2/scene/RenderLayers.ts` (verified ARMIES/BATTLE_INDICATORS entries)
- `src/engine/armyNotifications.ts`

**Integration points checked:**
- `src/components/Game/GameView.tsx` (lines 979-1000 — HexMapV2 prop passing)
- `src/components/HexMapV2/HexMapV2.tsx` (lines 133-160 — props interface)
- `src/components/HexMapV2/HexV2View.tsx` (full — dev route, missing army props)
- `src/components/Game/DebugPanel.tsx` (lines 997-1120 — ArmiesTabContent)
- `src/components/Game/NarrativeLog.tsx` (color lookup at line 141)
- `src/data/uiColorPalette.ts` (TICK_EVENT_COLORS at lines 126-137)
- `src/types/gameState.ts` (TickEvent type union at line 64)

**Phase 12 plan files reviewed:**
- `.planning/phases/12-conflict-destruction/12-01-SUMMARY.md` through `12-07-SUMMARY.md`
- `.planning/phases/12-conflict-destruction/12-06-PLAN.md`, `12-07-PLAN.md`
