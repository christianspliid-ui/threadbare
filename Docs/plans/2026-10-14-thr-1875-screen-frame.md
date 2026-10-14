> **title:** `The screen frame — the top bar with Needs you, the god rail with the hand, the Ledger rail and its strip — THR-1875`
> **linear_issue:** THR-1875
> **author:** `Claude Code (design session, Opus — spawned from the 2026-10-14 attended map carve-up session)`
> **created:** 2026-10-14
> **three_pillars:** Engine `done — three view models in the THR-1822 seam (Needs you, god rail, Ledger rail), the interrupt registry moves into the seam, the alert channel trims by age instead of by count; no GameState field, graph node, edge, tick phase or PRNG call` · Content `done — UI copy only: new tooltip entries, the Needs-you and rail words, World Pulse's mood lines moved into data; no encounter, prose table or attachment` · UI `done`

# The screen frame — THR-1875

*One row of top bar and two rails, each drawn from one list per kind, so the map keeps its share at both screens, the god always sees what waits on them, and the next button, rail row, tab or ask is one entry rather than a rewrite.*

## Why this is load-bearing

The map-first overhaul ([THR-1823](https://linear.app/threadbare/issue/THR-1823)) decided the frame in [THR-1828](https://linear.app/threadbare/issue/THR-1828): a one-row top bar, a god rail on the left that holds the hand, a Ledger rail on the right that folds to a strip. Every other surface of the overhaul stands inside that frame. The Inspector ([THR-1876](https://linear.app/threadbare/issue/THR-1876)) folds the Ledger rail and arms cards from the rail's hand. The Stage ([THR-1877](https://linear.app/threadbare/issue/THR-1877)) lists its waiting moments in Needs you and rests the hand while a moment plays. Find ([THR-1832](https://linear.app/threadbare/issue/THR-1832)) needs its slot in the top bar.

Today the frame breaks four rules at once. Speed lives only in World Pulse, down the right rail, in monospace, so Law 52's persistent time control is half-hidden. The alert channel is produced and never rendered (`GameViewTopBar.tsx:372` `{/* AlertBar disabled */}`). The rail labels go down to 9–10 px uppercase. And the map gets 59.7% of a 1080p screen, under the 0.60 floor THR-1828 set. Two new laws ratified today raise the bar for the rebuild. **Law 57**: a panel grows to its limit before it scrolls or truncates, which rules out the decision's fixed cap of 12 Needs-you rows. **Law 58**: the UI grows by adding entries, so the top-bar buttons, the god-rail rows, the Ledger tabs and the Needs-you producers each become one list with a test that names a missing entry.

**Without this plan** each later build invents its own frame. The Inspector would fold a rail that has no fold. The Stage would have nowhere to name what waits. And the next top-bar button would be one more hand-placed JSX block in a bar that already wraps.

## Settled input (not re-opened)

**Veto window waived.** Christian asked in chat (2026-10-14) for the five carve-up plan docs of THR-1823 to be written now, in parallel, in the attended session. That waives the design lane's one-day veto window on the lane-made decisions they build on (THR-1828, THR-1829, THR-1830, THR-1831, THR-1832, THR-1833). Those decisions are settled input here. Christian's veto stays open in chat, but it does not block this plan.

| Source | What it fixes for the frame |
|---|---|
| [`Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`](../audits/2026-10-12-thr-1828-screen-frame-decision.md) (THR-1828, lane, veto waived) | Calls 1–6: the top bar's slots and order; World-Soul to the Chronicle, Attention to the god rail; the god rail's order (identity → essence and Attention → your hand → folded rows); the Ledger rail (Threads, Chronicle with *Now · Years · Ledger*); World Pulse retires; the 56 px strip of icons with counts; auto-fold while the Inspector is open; Needs you's three groups; `FRAME_MAP_SHARE_MIN` 0.60 / 0.45; keys `N` and `L` |
| THR-1825 research comment on [Linear](https://linear.app/threadbare/issue/THR-1825) | The 22 attention producers; what Needs you carries (asks that do not stop time, interrupts held behind the open one, the alert channel); per-entity news stays on the row badges (THR-664/665/666/667/935) |
| [THR-1875](https://linear.app/threadbare/issue/THR-1875) description, added 2026-10-14 | **The Needs-you list shows as many rows as its container fits at the current screen size and folds to "and N more" only at that limit** (replaces THR-1828's fixed 12; row height and limit are named constants). **Law 58** binds the four lists and their `extending.md` rows |
| [`Docs/audits/2026-10-11-thr-1827-inspector-decision.md`](../audits/2026-10-11-thr-1827-inspector-decision.md) (Christian, "yes" to 18 calls) | Call 6: the Ledger rail folds while the Inspector is open. Call 14: the hand lives in the god rail, card-first; **arming and target lighting are THR-1876's**. Doom, Mandate and Omen stay dialogs |
| [`Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md`](../audits/2026-10-14-thr-1829-encounter-stage-decision.md) | "Held behind this chapter" is the Stage's waiting line (the **hold rule is THR-1877's**); the god rail stays visible during a moment and its hand rests, dimmed and click-guarded, with one line; the top bar's right group stays dimmed and guarded while an encounter is open |
| [`Docs/audits/2026-10-12-thr-1832-find-anything-decision.md`](../audits/2026-10-12-thr-1832-find-anything-decision.md) | A labelled Find field in the top bar; Ctrl+K and `/` are Find's. **The field and its results are THR-1876's**; the frame reserves its slot |
| [`Docs/audits/2026-10-13-thr-1833-type-system-decision.md`](../audits/2026-10-13-thr-1833-type-system-decision.md) | Cinzel names things at 22 px and up only; Alegreya Sans runs the game; labels bold, sentence case, no tracking, at the 16 px floor; tabular figures for counts that line up; no monospace on player surfaces |
| [`Docs/audits/2026-10-14-thr-1834-icon-family-decision.md`](../audits/2026-10-14-thr-1834-icon-family-decision.md) + today's chat rulings | One carved game-icons.net family, the top bar included (lucide leaves player surfaces). Top bar: icon **and** word, always. Ledger strip: icon with a count, the word in the tooltip. **The registry's contents are THR-1879's**; the frame names concepts and consumes the registry |
| [`2026-10-14-thr-1819-1440p-layout-contract.md`](2026-10-14-thr-1819-1440p-layout-contract.md) | `--topbar-height` 48 / 56; `--rail-left-w` 320 / 400; `--rail-right-w` 340 / 420; `--rail-strip-w` 56; `--inspector-w` 560 / 717; the six type steps; the root step to 18 px at ≥ 2560; `mapShare()` and the budget test; dropdown caps (Needs you 60vh) are not modals |
| [`2026-10-14-thr-1820-dialog-size-tiers.md`](2026-10-14-thr-1820-dialog-size-tiers.md) | **Law 57**; the rails' limit is their frame geometry; the Needs-you drop-down is an anchored flyout bound by its own limit; the Chapter Ledger reader is an L dialog |
| [`2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`](2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md) | `Panel`, `Overlay` ([THR-1884](https://linear.app/threadbare/issue/THR-1884)); `Tabs`, `Chip` (the gold count chip is the Needs-you pill), `Icon` ([THR-1885](https://linear.app/threadbare/issue/THR-1885)); the `check:ui-debt` ratchet; new surfaces are built on the primitives from day one |
| [`2026-10-14-thr-1822-view-model-seam.md`](2026-10-14-thr-1822-view-model-seam.md) | View models in `src/engine/views/`, read through `useView`; D13 the `needsYou` VM (amended here, § F5); D16 step 2 the GameView split ([THR-1881](https://linear.app/threadbare/issue/THR-1881)): `GameView/GameViewTopBar.tsx`, `frame/GodRail.tsx`, `frame/LedgerRail.tsx`; the `GameScreenState` context for state more than one host reads |
| `Docs/design-system/laws.md` Laws 57, 58 (ratified 2026-10-14) | Grow before scroll; one list per kind, a missing entry fails a named test, an unknown kind shows a plain fallback, each list gets an `extending.md` row |

## What today has (measured, `main` @ `0afcfc2b`)

| Fact | Evidence |
|---|---|
| The top bar has no speed control. The compact `SimulationControls` shows play/pause, "season · year" and a status line; speed and step exist only in the non-compact tier the bar does not render | `SimulationControls.tsx:90-166`, `SPEED_STEPS` `:67` |
| The only visible speed control is in World Pulse, in monospace (`◀ {speed}× ▶`), beside Active Agents and Cultures counts, a second omen line and a mood line that **changes every tick** (`moodLines[gameState.tick % moodLines.length]`) | `WorldPulse.tsx:60-177`, mood table `:70-79`; mounted `GameView.tsx:6249-6262` |
| World-Soul and Attention sit in the top bar's left group; Attention reads the graph inline (`gameState.graph.getNode`) | `GameViewTopBar.tsx:291-315` |
| The alert channel is produced and rendered nowhere; the router keeps the last 12 (`slice(-ALERT_MAX_VISIBLE)`), so a 13th drops silently | `GameViewTopBar.tsx:372`; `notificationRouter.ts:240`; `types/notification.ts:208` |
| Three alert producers write no Chronicle line, so THR-1828's "lives on in the Chronicle" is not yet true for them | `phaseMandate.ts`, `factionOutcome.ts`, `revelationResolver.ts`: 0 `chronicle` writes each (filed as [THR-1896](https://linear.app/threadbare/issue/THR-1896)) |
| The beat offer is a fixed pill at the top centre of the screen (`position: fixed; top: var(--space-4); left: 50%`), raised above a player surface to `GIFT_PILL_Z` 62 when a gift waits behind it (THR-1805 / THR-1809). It labels a pool beat with `humanizeBeatId(pending.beatId)` | `AscendantBeatModal.tsx:588-660`; `GameView.tsx:5306-5309, 6731-6736` |
| Avatar arrival pauses outside the interrupt registry (`setRunning(false)`) and says so only in a 5 s toast | `GameView.tsx:775-794` |
| The interrupt registry exposes `open` and which yielding surfaces may render; it has no list of what waits | `interruptRegistry.ts:126-178`; holder names `nudge-stage-content.ts:264-280` (THR-1814) |
| The god rail (`AscendantBar`) is eight foldable sections; the "Actions" section is Move and Investiture plus the self and rare innate actions. **`onFire` is never passed to `ActionsBlock`, so pressing a self or rare action row does nothing** | `AscendantBar.tsx:185-307`; `ActionsBlock.tsx:45, 221`; `AscendantBar.tsx:254-260` |
| The god holds cards through `GameState.unlockedActionIds` (`isActionRevealed`); 136 templates are ascendant-castable (`actorAffinities: ['ascendant']`) | `engine/actionUnlock.ts:25-35`; `unified-action-templates.ts` |
| The Chronicle panel caps its entries at `maxHeight: '320px'` (a scroll box shorter than its rail, a Law 57 breach) and its voice toggle (Both · Poet · Witness) is not remembered | `ChroniclePanel.tsx:172, 229-231` |
| The Chapter Ledger launcher is a hand-styled button with an emoji and an unread count; the seen-count is React state | `GameView.tsx:6207-6247`, `:418-421` |
| The staged opening reveal (THR-1837) gates 18 frame surfaces by id, including `world_pulse`, `world_soul`, `attention`, `hand`, `chapter_ledger` | `src/data/opening-reveal-table.ts:20-75` |
| Game hotkeys: Space, `+`/`=`, `-`, `.`, `m`, and the lens keys from `MAP_LENSES`; `N` and `L` are free | `useTopBarHotkeys.ts:23-69` |
| The thread row's pip says "Needs Attention" (`ui.thread_priority_pip`), one word from the new "Needs you" and one word from the Attention gauge | `ui-content.ts:773-776`; `ThreadsPanel.tsx:550-556` |
| The speed tooltip `ui.sim_speed` is labelled "Tick Speed" (an engine unit, Law 14) | `ui-content.ts:240-243` |
| The calendar has seasons and years; there is no calendar day. `TICKS_PER_DAY` (12) is the attention pacing unit and must not be converted into the season calendar | `types/temporal.ts:30-44`; `data/game-config.ts:31-32` (THR-1747) |

## Substrate inventory

| Existing subsystem / module | Status | This plan |
|---|---|---|
| Interrupt registry (`components/Game/interruptRegistry.ts`, `resolveInterrupts`) | 🟢 ACTIVE | **moves** into `src/engine/views/interruptRegistry.ts` (THR-1822 D16 step 4; the engine may not import from `components/`), re-exported from the old path; **extends** with a pure `collectHeldMoments()` the Needs-you VM reads |
| Holder names (`INTERRUPT_HOLDER_NAMES`, `resolveClockHolder`, THR-1814) | 🟢 ACTIVE | **reused**: the held row's noun derives from it (Law 58: a second list is derived, never hand-kept) |
| Notification router (`engine/notificationRouter.ts`) and the alert channel | 🟢 ACTIVE, alerts unrendered | **extends**: alerts trim by age, with a counted safety cap; Needs you's News group is the channel's first production reader |
| `useNotificationNavigation` (alert → ref router) | 🟢 ACTIVE | **reused** for a News row's click; THR-1876 points the router at the Inspector |
| Ascendant beat offer + `AscendantBeatOfferBanner` + `computeGiftDelivery` (THR-1805/1809/1811) | 🟢 ACTIVE | **re-homed**: the offer becomes a Waiting row; its pill retires; the raise above a player surface moves to the Needs-you pill |
| Divine receipts, toast tier (`playerReceipts.ts`) | 🟢 ACTIVE | **reused**: an unacknowledged receipt is a Waiting row; opening uses the existing receipt open path |
| THR-1822 seam (`readView`, `useView`, `viewContract.ts`, `__DEBUG.getView`) | 🟡 planned (THR-1822 Ready for Dev) | **extends** with `needsYou.ts`, `godRail.ts`, `ledgerRail.ts` |
| `ascendant-bar/selectors.ts` (531 lines, pure) | 🟢 ACTIVE | **moved, not rewritten** into `views/subjects/godSheet.ts` by whichever of slice 2 and THR-1876 lands first (THR-1822 D16 step 4 names that home); `views/godRail.ts` composes it |
| `AscendantBar` blocks (`IdentityStrip`, `EssenceBlock`, `SeatLine`, `ReachesBlock`, `MandateBlock`, `CovenantsBlock`, `SignaturesBlock`, `HooksBlock`, `AttentionPoolIndicator`) | 🟢 ACTIVE | **rebuilt** on `Panel` / `Section` / `Chip` / `Icon` at the 16 px floor; their data and click handlers are kept |
| `ThreadsPanel`, `ChroniclePanel`, `ChapterLedger` reader, `countThreadedChapters` | 🟢 ACTIVE | **kept**; `ChroniclePanel` gains tabs and the World-Soul header and loses its 320 px cap; the reader is unchanged (THR-1820 sizes it) |
| `WorldSoulIndicator` + `WORLD_SOUL_PROSE` | 🟢 ACTIVE | **moves**: its banding goes into `ledgerRail.ts`; its line renders in the Chronicle header |
| Opening reveal (`opening-reveal-table.ts`, `useOpeningReveal`, `useFirstScreenReveal`, THR-1648/1837) | 🟢 ACTIVE | **extends**: every frame entry names its reveal surface; `world_pulse` retires; a test makes the table and the frame lists agree |
| `useTopBarHotkeys` | 🟢 ACTIVE | **extends**: `N` and `L` come from the frame lists; a test rejects a key claimed twice |
| `SimulationControls` (compact tier) | 🟢 ACTIVE | **extends**: the speed stepper joins the compact tier; the status line gains the named pause |
| `opening-reveal-table` `chapter_ledger` + seen counts | 🟢 ACTIVE | **reused** for the Ledger tab and the strip counts |
| Shared primitives `Panel`, `Overlay`, `Tabs`, `Chip`, `Icon` (THR-1884, THR-1885), `Section`, `ListRow`, `Button`, `IconButton`, `Tooltip`, `HoverCard`, `Dropdown` | 🟡 / 🟢 | **consumed**; nothing hand-built (THR-1821 § Migration order 2) |
| Dominion pricing (`dominion.ts` `dominionScaledEssenceCost`, `DOMINION_PAR_BAND`, `DOMINION_PRICES_LIVE`; THR-1750) | 🟢 ACTIVE | **read** by `godRail.ts` for the hand's par price and the sovereign-price `payable` check; the one god-card price table, never re-derived |
| Attention pool (`attentionPool` / `attentionCapacity`, the ascendant's `attentionRegen`; `AttentionPoolIndicator`) | 🟢 ACTIVE | **read** by `godRail.ts` for the gauge, which moves from the top bar to the god rail; no change to how the pool fills or drains |

No engine subsystem from `Docs/canon/systems-inventory.md` is replaced. No population is consumed beyond what the existing builders read. **Blast radius: not required.** No touched file has 100 or more importers. The widest are `src/types/notification.ts` (about 36 importing files) and `src/data/ui-content.ts` (25). `GameView.tsx` is touched only through THR-1881's hosts.

## Decisions

### F1 — Three build slices, each move atomic

A datum moves in the slice that builds its new home, and that slice removes the old home in the same PR. The top bar is rebuilt last because it needs the room the first two slices free.

| Slice | Ticket | Builds | Removes from the top bar |
|---|---|---|---|
| 1 — the Ledger rail | [THR-1893](https://linear.app/threadbare/issue/THR-1893) | The Ledger rail on `frame/LedgerRail.tsx` (§ F7); the World-Soul line and mood line as the Chronicle's header; tabs *Now · Years · Ledger*; the fold, the 56 px strip and the flyout (§ F8); the speed stepper in the top bar's Time slot; `views/ledgerRail.ts`; `src/data/frame-registry.ts` with the Ledger lists and the cross-list test | World-Soul. World Pulse retires from the rail |
| 2 — the god rail | [THR-1894](https://linear.app/threadbare/issue/THR-1894) | The god rail on `frame/GodRail.tsx` (§ F6): identity; essence with Attention; **your hand** with its fit rule, rest state and press seam; the folded rows; `views/godRail.ts`; `GOD_RAIL_SECTIONS` | Attention |
| 3 — the top bar and Needs you | **THR-1875** (this ticket) | The list-driven, one-row top bar (§ F3); Needs you's pill and list (§ F4); `views/needsYou.ts` and the registry move (§ F5); the router's age trim; the named pause; `TOP_BAR_ITEMS`; `N`; the frame-wide checks (one row, budget, hotkeys) | — (it is the top bar) |

- **Order:** slices 1 and 2 are independent of each other and may build in either order. Both touch `GameViewTopBar.tsx` only to remove one datum (and slice 1 to add the stepper), so whichever lands second rebases. Slice 3 is blocked by both.
- **Every slice builds on** [THR-1819](https://linear.app/threadbare/issue/THR-1819)'s tokens (merged to `main` on 2026-10-14, so already met) **and is blocked by** the foundation builds still open: [THR-1822](https://linear.app/threadbare/issue/THR-1822) (the seam), [THR-1881](https://linear.app/threadbare/issue/THR-1881) (the hosts), [THR-1884](https://linear.app/threadbare/issue/THR-1884) (`Panel`, `Overlay`), [THR-1885](https://linear.app/threadbare/issue/THR-1885) (`Tabs`, `Chip`, `Icon`), and the build of [THR-1879](https://linear.app/threadbare/issue/THR-1879), which puts the carved shapes into the registry. `IconName` is a closed union, so the frame cannot name a concept the registry lacks. No frame slice vendors a shape.
- **Order against THR-1876 and THR-1877 is free.** Each seam below works whichever side lands first (§ F12).

### F2 — The frame's four lists (Law 58)

The frame is drawn from four lists. Pure data (ids, words, order, keys, reveal ids, icon concepts, tooltip ids) lives in **`src/data/frame-registry.ts`**, so it is testable in Node. The components that render each entry live in exhaustive maps (`Record<Id, Component>`) under `src/components/Game/frame/`, so a missing component is a type error.

```ts
// src/data/frame-registry.ts — shapes (abridged)
export type TopBarItemId = 'time' | 'needs_you' | 'direction_line' | 'doom' | 'omen' | 'rivals' | 'notables' | 'read_threads' | 'settings';
export interface TopBarItemDef {
  id: TopBarItemId; group: 'left' | 'right'; order: number;
  label: string;                         // the word, always shown (THR-1834 § 5); '' only for 'time' and 'direction_line', which are text themselves
  icon: IconName | null;                 // null only where the item is text (time, direction line, doom, omen)
  tooltipId: string | null;              // null only with a named reason (settings: a control, not a concept)
  revealSurface: OpeningRevealSurfaceId | null;
  firstScreenGate: keyof FirstScreenReveal | null;   // THR-1648 gate, ANDed with the reveal
  guardedWhileEncounter: boolean;        // THR-1814 right-group guard
  hotkey: string | null;
}
export type GodRailSectionId = 'identity' | 'essence' | 'hand' | 'reaches' | 'mandate' | 'covenants' | 'signatures' | 'hooks';
export interface GodRailSectionDef {
  id: GodRailSectionId; place: 'pinned' | 'fill' | 'folded'; order: number;
  label: string; tooltipId: string | null;
  revealSurfaces: readonly OpeningRevealSurfaceId[];  // e.g. essence claims 'essence' and 'attention'; hand claims 'hand' and 'investiture'
  rendersWhenEmpty: boolean;             // false for covenants, signatures, hooks (THR-1814 rule 4)
}
export type LedgerSectionId = 'threads' | 'chronicle';
export type LedgerTabId = 'now' | 'years' | 'ledger';
export interface LedgerSectionDef { id: LedgerSectionId; order: number; label: string; tooltipId: string; revealSurfaces: readonly OpeningRevealSurfaceId[]; strip: StripDef }
export interface LedgerTabDef { id: LedgerTabId; order: number; label: string; tooltipId: string | null; revealSurface: OpeningRevealSurfaceId | null; strip: StripDef | null }
export interface StripDef { icon: IconName; countLabel: { one: string; other: string } /* e.g. { one: "{n} chapter waits", other: "{n} chapters wait" } */ }
export const TOP_BAR_ITEMS: readonly TopBarItemDef[];
export const GOD_RAIL_SECTIONS: readonly GodRailSectionDef[];
export const LEDGER_RAIL_SECTIONS: readonly LedgerSectionDef[];
export const LEDGER_TABS: readonly LedgerTabDef[];
export const LEDGER_RAIL_HOTKEY = 'l';
```

The fourth list, the Needs-you producers, is engine data and lives in `src/engine/views/needsYou.ts` (§ F5).

**The checks** (`src/data/__tests__/frameRegistry.test.ts` unless noted). Each failure message names the list and the entry to add:

1. **Words and icons.** Every top-bar item with an icon has a non-empty `label`; every `tooltipId` resolves in the `ui.*` registry; ids are unique per list.
2. **The reveal table and the frame agree.** Every `OpeningRevealSurfaceId` is claimed by exactly one frame entry (a top-bar item, a god-rail section, a Ledger section, tab or line). A surface no entry claims fails with *"opening-reveal surface 'x' has no frame entry: add it to TOP_BAR_ITEMS, GOD_RAIL_SECTIONS, LEDGER_RAIL_SECTIONS or LEDGER_TABS"*. Slice 1 lands this test with a `NOT_YET_LISTED` set naming the surfaces whose lists land in slices 2 and 3, each with its ticket. Each later slice empties its part, and slice 3 deletes the set.
3. **Keys: one overlap test, THR-1878's.** THR-1878's camera slice lifts today's inline top-bar keys (Space, `+`, `=`, `-`, `.`, `m`) into an exported `TOP_BAR_KEYS` array in `useTopBarHotkeys.ts`, and its test checks that the top-bar keys, the map keys and the lens keys never overlap (THR-1878's comment on THR-1875). The frame adds no second test. Its keys are declared once, on their list entries (`TopBarItemDef.hotkey`, `LEDGER_RAIL_HOTKEY`), collected as `FRAME_HOTKEYS` in `frame-registry.ts`, and spread into `TOP_BAR_KEYS`, so the array is derived, never hand-kept beside the lists. If a frame slice lands before THR-1878's camera slice, that frame slice creates `TOP_BAR_KEYS` and the overlap test with the key sets of the day, and THR-1878 extends them. Find's and the Inspector's keys join the same array when THR-1876 lands them.
4. **Components.** `TOP_BAR_COMPONENTS`, `GOD_RAIL_COMPONENTS`, `LEDGER_SECTION_COMPONENTS` and `LEDGER_TAB_PANELS` are `Record<…Id, …>` (compile-time).
5. **An unknown kind shows a plain fallback.** These ids are closed unions, so no unknown kind reaches the frame at runtime. The runtime fallbacks are the Needs-you rows (§ F5) and the icon registry's `fallback` shape (THR-1821).

**`Docs/design-system/extending.md` rows, owed by the build.** Each slice adds its row in its own PR, so the page never names a file that does not exist yet ("Keep this page true"):

| You are adding | The one place | What catches a missing entry | Where to see it | Status | Slice |
|---|---|---|---|---|---|
| A button or reading in the top bar | One `TopBarItemDef` in `TOP_BAR_ITEMS` (`src/data/frame-registry.ts`) and its component in `TOP_BAR_COMPONENTS` (`src/components/Game/frame/topBarComponents.tsx`) | The component map is a `Record<TopBarItemId, …>` (type error); `frameRegistry.test.ts` (word label, tooltip, reveal surface); THR-1878's `TOP_BAR_KEYS` overlap test (a key claimed twice); the one-row check in `topBarFit.test.tsx` | The top bar; `__DEBUG.getFrameState().topBar` | One place | 3 |
| A row or section in the god rail | One `GodRailSectionDef` in `GOD_RAIL_SECTIONS` and its body in `GOD_RAIL_COMPONENTS` (`frame/godRailComponents.tsx`); its data in `views/godRail.ts` | `Record<GodRailSectionId, …>`; `frameRegistry.test.ts` (reveal surface claimed, label, tooltip) | The god rail; `__DEBUG.getFrameState().godRail` | One place | 2 |
| A section of the Ledger rail, or a tab of its Chronicle | One `LedgerSectionDef` in `LEDGER_RAIL_SECTIONS` or `LedgerTabDef` in `LEDGER_TABS`, its panel in `LEDGER_TAB_PANELS`; a `strip` field gives it a strip icon | `Record<LedgerTabId, …>`; `frameRegistry.test.ts` | The Ledger rail and its strip; `__DEBUG.getFrameState().ledgerRail` | One place | 1 |
| A Needs-you ask *(replaces today's "Not built yet" row)* | One `NeedsYouProducer` in `NEEDS_YOU_PRODUCERS` (`src/engine/views/needsYou.ts`) | `needsYou.test.ts` (every group has a producer; every alert icon has a news icon; every interrupt surface yields a named held line) | Needs you in the top bar; `__DEBUG.getView('needsYou')` | One place | 3 |

### F3 — The top bar: one row, drawn from `TOP_BAR_ITEMS`

Host: `src/components/Game/GameView/GameViewTopBar.tsx`, where THR-1881 leaves it. It stays at that path, and its body becomes a renderer over `TOP_BAR_ITEMS`.

**Left to right** (THR-1828 call 1):

| Order | Item | What renders | Reveal / gate | Guarded while an encounter is open |
|---|---|---|---|---|
| left 1 | `time` | Pause/play (`IconButton`, carved `pause-button` / `play-button`); the **speed stepper** `‹ 2× ›` over `SPEED_STEPS` (lands in slice 1); a two-line text column: line 1 the date "Autumn · year 3", line 2 the status line ("running", "paused", THR-1814's "held by …", THR-1812's answer line, or the named pause, § F4) | `time_controls` | no (THR-1711) |
| left 2 | `needs_you` | The gold count chip, "Needs you" + count, **only when the count is above zero** (§ F4) | not staged; renders after the bond (`reveal.bonded`) | no |
| left 3 | `direction_line` | THR-1837's opening direction line, unchanged, wrapping to at most two lines inside `TOPBAR_DIRECTION_MAX_REM` | THR-1837's own rule | no |
| centre | — | A reserved slot, at least `TOP_BAR_CENTRE_MIN_REM` wide. **THR-1876 adds the `find` entry here** (the labelled Find field, THR-1832). Until it does, the slot is empty space, never a stub | — | — |
| right 1 | `doom` | THR-1828's "label + stage name + the five-stage bar", in two lines. Line 1: the "Doom" label, the doom's sigil (today's `SphereIcon` of the doom's sphere, or its glyph, with its `doom.{archetype}` tooltip, `DoomBar.tsx:85-92`), and the stage name. Line 2: the bar, with its pulse on a rise. When the clock has expired, the stage name's slot reads **"Unmade"**, in sentence case, in place of today's monospace "UNMADE" (`:102-105`). Today's third row, the journey line "The First: {journey}" and the hint "Next: {stage}" (`:47, :112-113`), moves into the item's tooltip and stays in the Doom dialog (§ F9). Opens the Doom dialog | `doom` + `reveal.doom` | yes |
| right 2 | `omen` | "Omen" label on line 1, the omen's name on line 2; opens its flyout | `omen` + `reveal.omens` | yes |
| right 3 | `rivals` | `Button` with the carved `duel` icon (THR-1834's pick) and "Rivals" | `reveal.rivals` | yes |
| right 4 | `notables` | `Button` with `crown` and "Notables", and its count badge (THR-1821's badge-form `Chip`) | `notables` + `reveal.notables` | yes |
| right 5 | `read_threads` | `Button` with `sewing-string` and "Read the Threads" (gains its word) | `read_threads` | yes |
| right 6 | `settings` | `Button` with `cog` and "Settings" (gains its word); opens Settings in whatever home THR-1880 gives it | `settings` | yes |

- **No calendar day.** The date is "season · year", as today. The mock's "Day 12" is not built: the game has no calendar day, and THR-1747 forbids converting the attention clock's `TICKS_PER_DAY` into the season calendar.
- **Type** (THR-1833, THR-1819): labels `--text-xs` (16 px at 1080p) Alegreya Sans 700, sentence case, `--text-tertiary`; values and button words `--text-sm` (18 px); the speed readout and any count use `lining-nums tabular-nums`; no monospace and no uppercase. The speed readout "2×" stays a numeral. It is a control setting, like a volume level, not a world magnitude (Law 13). THR-1828 call 1 fixed it, and World Pulse shows the same readout today.
- **Height:** exactly `var(--topbar-height)` (48 / 56 px). The bar keeps publishing `--topbar-live-height` (THR-1724), which then always equals the token. A second row is a defect, and § F11 shows it would break the 1080p map-share floor.
- **When space is short: the yield order.** The bar measures its own overflow (a `ResizeObserver` on the bar; `scrollWidth − clientWidth`) and, while it overflows, applies the next step of `TOP_BAR_YIELD_ORDER`, in this fixed order, so the fit is deterministic:
  1. `centre`: the centre slot shrinks to `TOP_BAR_CENTRE_MIN_REM` (to zero while no `find` entry exists).
  2. `time_status`: the time status line narrows from `TOPBAR_TIME_STATUS_MAX_REM` to `TOPBAR_TIME_STATUS_MIN_REM` and ellipsizes. The holder's name comes first, so the cut part is the tail ("… runs on when it closes"), and the full line is in its tooltip (`ui.clock_held`).
  3. `doom_name`: the doom stage name leaves line 1. It is already in the Doom item's tooltip label, which keeps today's composition ("Breach — Stage 2: Reality Cracks — The First: Call"). The item keeps its "Doom" label, its sigil and its bar.
  4. `omen_name`: the omen's name moves into the Omen item's tooltip label. The item keeps its "Omen" label.
  5. `direction_short`: THR-1837's direction line switches to its short form ("Kael Thorne's chapter is waiting →" / "Let time run for Kael Thorne"), with the full sentence in its tooltip.

  No item ever hides to make room, and no control loses its word label. Items appear and disappear only through their reveal gates (Law 25). Steps undo in reverse order when room returns, with `TOP_BAR_YIELD_HYSTERESIS_PX` so a one-pixel change does not flip them. This is the bar's progressive form at its limit (Law 57): text moves one hover away; nothing scrolls and nothing wraps.
- **Width budget at 1920×1080** (Alegreya Sans at about 0.46 em per character; the executor re-measures with the shipped fonts):

| Item | Width (px) |
|---|---|
| padding 2 × 16 | 32 |
| `time`: button 32 + stepper 73 + gaps 16 + text column capped at 280 | 401 |
| `needs_you` chip (md) | 148 |
| centre slot (minimum) | 240 |
| `doom` (stage name capped) | 210 |
| `omen` | 130 |
| `rivals` | 91 |
| `notables` + badge | 132 |
| `read_threads` | 169 |
| `settings` | 106 |
| gaps 8 × 16 | 128 |
| **Total with every item revealed, no direction line** | **1,787 (133 px spare; no yield step needed)** |
| Opening state (direction line two lines at 300; doom and read-the-threads shown; rivals, notables, omen not yet revealed) | 1,702 (fits) |
| **Worst reachable state:** every item shown (the opening rows revealed by the `a_path_opens` gift or the 200-tick ceiling, `opening-reveal-table.ts:74-78`; a rival has acted; an omen is active) while the direction line is still up (it stays until The First's first non-routine chapter resolves, `OpeningDirectionLine.tsx:4`), and the clock held by the longest holder name. Nine items plus the centre slot's width, 9 gaps | **2,103 before yielding (183 px over)** |
| Same state after the five yield steps (time column 321, doom 100, omen 50, direction short form 180) | **1,713 (207 px spare)** |

At 2560 the root steps to 18 px, so rem-sized parts grow ×1.125 (≈ 2,010 px of 2,560 with every item revealed).
- **Encounter guard** (THR-1814, unchanged): items with `guardedWhileEncounter` dim to `TOPBAR_INERT_OPACITY` and swallow presses. Hover and focus stay live, and their tooltips gain "Opens when this chapter closes." (`TOPBAR_LOCKED_SUFFIX`). The renderer applies the guard per item instead of per group.
- **Lucide** leaves the top bar with this slice. No lucide import is in the bar today; the ratchet holds it.

### F4 — Needs you: the pill and the list (the UI; the hold rule is THR-1877's)

**The pill.** `<Chip role="count" count={n} icon="needs-you" label={countWords(n, NEEDS_YOU_PILL_LABEL)} tint="gold" onOpen={…} />` (THR-1821 S3), at size `md`, with the visible word "Needs you" before the count. It renders only while the count is above zero (Laws 25, 53) and never pauses time. Its tooltip is `ui.needs_you`. `N` opens and closes the list while the pill renders. When it does not render, `N` does nothing.

**The count** is the number of rows in all three groups, folded rows included. **Opening the list never clears it** (Law 40). A row leaves when its thing is opened or resolves. A News row also leaves when it is opened, or after `NEEDS_YOU_NEWS_KEEP_DAYS` (§ F5).

**The list.** An anchored flyout under the pill: `Dropdown` positioning (menu band, joins the escape registry, THR-1821), drawn as a floating `Panel` at level `panel`. Width `NEEDS_YOU_LIST_W_REM` (480 px at 1080p, 540 at 1440p). Its limit is `NEEDS_YOU_LIST_MAX_VH` of the viewport height (THR-1828; THR-1819 lists it among the dropdown caps). Esc closes it (Law 23). Opening moves focus to its first row, and closing returns focus to the pill (Law 50).

| Group (order) | Header | Row | Row action (right-aligned word) | Press |
|---|---|---|---|---|
| **Waiting for you** | "Waiting for you · {n}" | icon + line | "Open", or "Show" for a place | opens the thing (§ F5 table) and closes the list |
| **Held behind this chapter** | "Held behind this chapter · {n}" | icon + line, in the order they will open | "after this" | none (not a button; `aria-disabled`) |
| **News** | "News · {n}" | icon + line; a same-kind burst is one row ending "· and {n} more like it" (§ F5) | how long ago, through `elapsedLabel` ("two days ago", "less than a day ago"); never a tick or a day number (THR-1426) | routes the subject through `useNotificationNavigation` and dismisses the alert; a burst's count opens the burst in place |

- **An empty group does not render**, nor does its header.
- **Rows are one line** at `NEEDS_YOU_ROW_H_REM`. A line longer than the row ellipsizes, and the row's tooltip carries it whole. The list's width is its fixed limit (Law 57: "the limit is the container's own").
- **Grow, then fold (Law 57, today's ruling).** The list shows as many rows as fit under its limit at the current screen size, and only at that limit folds the overflow into an "and {n} more" row. Capacity is computed from the constants, so it is deterministic and testable:
  `capacityRows = floor((NEEDS_YOU_LIST_MAX_VH/100 × innerHeight − 2 × NEEDS_YOU_LIST_PAD_REM × rootPx − groupsShown × NEEDS_YOU_GROUP_HEAD_H_REM × rootPx) / (NEEDS_YOU_ROW_H_REM × rootPx))`.
  This gives **13 rows at 1920×1080** with three groups (648 − 24 − 96 = 528; 528 / 40) and **16 at 2560×1440** (864 − 27 − 108 = 729; 729 / 45). Both are more than THR-1828's fixed 12. The capacity counts every row line, fold rows included. A list with one folded group shows `capacityRows − 1` rows and one "and {n} more" row. When News folds away entirely and Held must fold too, each folded group keeps one fold row, so the list shows `capacityRows − foldRows` rows.
- **What folds first:** News, oldest first; then Held, from the back of the queue; then Waiting, oldest first. Waiting rows are the ones the god acts on, so they fold last. The fold row sits at the end of the group it shortens. Pressing it opens that group in place, and the list then scrolls inside its panel: the list is at its limit, which is the progressive form Laws 36 and 57 allow.
- **While an interrupt holds the clock** (`InterruptResolution.anyOpen`), the list stays open-able and readable, but every row is read-only. Waiting rows read "after this" and their press is swallowed; News rows too. Each row's tooltip ends with "Opens when this chapter closes." This is the same guard and the same words as THR-1814's right group: a dialog or a page opened now would open beneath the moment.
- **The gift raise moves to the pill** (THR-1809, behaviour kept). When a spine gift waits behind a player surface (`computeGiftDelivery().heldBy` is only `player_surface` / `recent_input`, today's `giftPillRaised`), the Needs-you pill is drawn above that surface's backdrop at `GIFT_PILL_Z` (62, reused), through a portal at the pill's measured position. It stays below interrupts, as today.

**The named pause** (THR-1828 call 4: the clock can name it and the queue can list it). Avatar arrival keeps today's pause (`pauseIfHeld()` or `setRunning(false)`) and now records a `NamedPause` `{ line: evt.message, ref: <the hex the avatar stands on> }` in `GameScreenState`. While it is set:
- the time status line reads **"paused · {line}"** ("paused · Your ascendant has arrived at Oreblack Deep."). Precedence: held by an interrupt › THR-1812's answer line › the named pause › the first-run prompt › running / paused;
- Waiting lists the line with the action "Show". Pressing it centres the map on that hex (`handleCenterOnHex`) and clears the pause record;
- it clears on its own when the clock next runs.

The arrival toast retires: the status line and the row replace it, and its cause no longer vanishes after 5 s (THR-1825 row 20). This is **not** an interrupt-registry entry. The registry's contract is that each `isOpen` mirrors a surface that renders, and an open entry auto-resumes the clock when it closes (the Stellaris resume). An arrival has no surface, and the player resumes its pause. The decision's two goals hold: the clock names the pause and the queue lists it.

### F5 — The Needs-you view model and its producers

Built in slice 3 at `src/engine/views/needsYou.ts`, to THR-1822 D13's shape, with three amendments recorded here (THR-1822 is Ready for Dev and has not built D13. Its step 4 assigned the Needs-you VM to "the Inspector-and-frame build", which is this slice):

1. **No count cap in the VM.** `NEEDS_YOU_NEWS_MAX` and `newsOverflowLine` are removed. The VM returns every row, and the surface folds at its container's limit (today's ruling; § F4). THR-1820 § 2 already required the drop-down's 60vh limit, not a row count, to be what is reached first.
2. **`opens` gains `'place'`** for the named pause (centre the map), and a row carries `icon: IconName` and `tooltip: string` (the full line).
3. **No Chronicle promise.** News rows lapse after `NEEDS_YOU_NEWS_KEEP_DAYS`, but no text says they "live on in the Chronicle" until [THR-1896](https://linear.app/threadbare/issue/THR-1896) gives every alert producer a Chronicle line. The thing itself stays on its own page meanwhile (the mandate dialog, the faction page).

```ts
export type NeedsYouProducerId = 'beat_offer' | 'receipt_unacked' | 'named_pause' | 'held_moment' | 'alert';
export interface NeedsYouProducer {
  id: NeedsYouProducerId;
  group: 'waiting' | 'held' | 'news';
  order: number;                                               // order inside its group
  rows(ctx: ViewContext, src: NeedsYouSources): NeedsYouRowVM[];  // pure; never throws (wrapped by readView's fallback)
}
export const NEEDS_YOU_PRODUCERS: readonly NeedsYouProducer[];
export interface HeldMoment { surfaceId: string; subject: { name: string; ref: AnyRef | null } | null; queuedAtTick: number }
export interface NeedsYouSources {
  interrupts: InterruptResolution;
  heldMoments: readonly HeldMoment[];    // collectHeldMoments(...) today; THR-1877 owns the rule that fills it
  alerts: readonly AlertItem[];
  namedPause: { line: string; ref: AnyRef | null } | null;
}
```

| Producer | Group | Source | Rendered line (sample) | Opens |
|---|---|---|---|---|
| `beat_offer` | waiting | `GameState` pending beat, not entered | spine gift: **"A gift waits: The Seat"**; offering: **"Three powers stir"**; pool beat: **"{eyebrow}: {title}"**, the beat's authored title, never `humanizeBeatId` (PC-3); fallback **"A beat of your story"** (`INTERRUPT_HOLDER_NAMES.AscendantBeatModal`) | `beatOffer` → `setBeatEntered(true)` |
| `receipt_unacked` | waiting | unacknowledged toast-tier receipts, oldest first | **"What your act bought: {receipt headline}"** | `receipt` → the existing receipt open path |
| `named_pause` | waiting | `NamedPause` | **"Your ascendant has arrived at Oreblack Deep."** | `place` → centre on the hex |
| `held_moment` | held | `heldMoments`, in the order they will open | holder noun from `INTERRUPT_HOLDER_NAMES`, capitalised, plus its subject through `NEEDS_YOU_HELD_CONNECTOR` (default " about "; `EventPopup` ": "; `ThreadingRite` " for "): **"A premonition about Kael Thorne"**, **"A message: Reality Cracks"** | `none` (`after: true`) |
| `alert` | news | the alert channel, within `NEEDS_YOU_NEWS_KEEP_DAYS × TICKS_PER_DAY` ticks, newest first | the alert's own `message`, unchanged: **"Kael Thorne has been promoted to Sergeant in The Civic Guard."** (`factionOutcome.ts:408`), **"Kael Thorne's story deepens"** (`orchestrator.ts:2832`) | `subject` → `useNotificationNavigation(alert.navigationTarget)`; an alert with no target is a non-button row |

- **The interim hold rule** (`collectHeldMoments`, pure, in `views/interruptRegistry.ts`): a yielding surface whose wish holds but which may not render (`ThreadingRite` behind any open surface, `MomentCard`, `EventPopup`) is held, named from its queue head's subject where one exists. That is exactly what the registry holds today. **THR-1877 owns the rule** (which moments wait for the Stage, in what order). It replaces or extends `collectHeldMoments` and needs no change to the producer, the VM or the UI.
- **News icons:** `NEWS_ICON: Record<AlertIcon, IconName>` (12 kinds; a missing kind is a type error). An `AlertIcon` string outside the union, arriving from data at runtime, renders the registry's `fallback` shape with its message. It warns once in dev and never renders blank.
- **A held surface with no holder name** renders "Something waits" (`CLOCK_HELD_FALLBACK_HOLDER`'s sibling) and warns once in dev. THR-1814's holder-name coverage test already fails the build first.
- **What de-duplicates News, and what ten at once look like (PC-5, Law 49).** The alert channel has never been rendered, so its merge rule has never been seen. Today the router keys alerts by icon and tick and **overwrites** the earlier one when a second alert of the same kind lands in the same tick (`notificationRouter.ts:194-203`). That is a silent drop. Slice 3 changes the rule in two places:
  1. **The router appends every alert** and drops only an exact repeat of the same event (same `sourceEventId`). Nothing it receives is overwritten.
  2. **The VM coalesces a burst.** Alerts of the same `AlertIcon` in the same tick become one row: the newest alert's line, then " · and {n} more like it". Pressing the count opens the burst in place, one row per alert, each its own link. The pill counts the burst as one row. So ten faction outcomes in one tick show as one News row with "and 9 more like it", never as ten rows and never as one row that hides nine.

  Alerts of the same kind in different ticks stay separate rows, because they are separate news. The channel's other limits are below.
- **A raw id the channel would leak (PC-3), fixed in slice 3.** News shows each alert's own `message` unchanged, so the first rendering of the channel must not carry an engine word. One producer does: the mandate milestone's fallback line (`phaseMandate.ts:342, 473`), used when a mandate has no authored prose for a transition, reads `Mandate "${definition.name}" crosses into ${currentStage}.`, with a raw `MandateStage` id (`setup` / `escalation` / `culmination`). Slice 3 rewrites both fallbacks to one line with no stage word at all, because no display word for a stage exists (`MandateStageDefinition` has only `stage`, `description` and `conditions`, `types/mandate.ts:55-59`): `Mandate "{name}" enters its next stage.` The authored-prose path is unchanged. One more producer gets the same producer-side fix: a severe complication's alert starts its message with a "⊘ " glyph (`unifiedActionResolution.ts:2268`), which would sit beside the row's own carved icon; slice 3 drops the glyph from that message (the row's icon carries the kind). The faction promotion line renders the faction's own name, article included ("in The Civic Guard", `civic-guard-definition.ts:17`), as today's toast does; that capital is an existing wart, not this plan's. Rendered: **"Mandate "The Builder's Legacy" enters its next stage."** (§ Player-facing text, row "News, the mandate milestone fallback").
- **The router trims by age** (`notificationRouter.ts`): alerts older than `NEEDS_YOU_NEWS_KEEP_DAYS × TICKS_PER_DAY` ticks drop at each route (the same lapse rule, so the VM and the channel agree), and `ALERT_SAFETY_CAP` replaces `slice(-ALERT_MAX_VISIBLE)`. Hitting the cap is counted on an additive `NotificationState.alertsTrimmedAtCap` field, warned once in dev, and shown in `__DEBUG.getFrameState().needsYou`, so nothing drops silently. `ALERT_MAX_VISIBLE` is deleted, and its one test is updated.
- **Per-entity news stays on the row badges** (THR-664/665/666/667/935). Toasts stay for action feedback only. Active locations (the retired `LiveLocationBar`) are lens territory (THR-1830), not a Needs-you producer.

### F6 — The god rail: who you are, what you hold, what you can cast

Host: `src/components/Game/frame/GodRail.tsx` (THR-1881). Width `var(--rail-left-w)` (320 / 400). Data: `useView(godRail)` (§ Engine pillar). The rail is drawn from `GOD_RAIL_SECTIONS`, top to bottom (THR-1828 call 2):

| Section | Place | What renders | Reveal |
|---|---|---|---|
| `identity` | pinned | Today's identity content, restyled, plus one line. The portrait (sphere sigil with its band halo, `sphere.{primary}`). The god's name in Cinzel at `--text-lg` (22 px, the Cinzel floor), `ui.ascendant_name`, as the link to the god's sheet (`onOpenSheet`; THR-1876 opens it in the Inspector). The archetype title, `ui.ascendant_archetype`. In the place of THR-1828's "state ('Rooted')", which has no source in the game today, the archetype title stays where it is. Then the quintessence line, "Quintessence · {word}": the label is `ui.ascendant_quintessence` (the god's entry, not the mortal's `ui.quintessence`), the word is `quintessence.{band}`, and the epithet line is kept. Both show **only while `showOnStrip` holds** (THR-1713 D8: the god's quintessence leaves the rail until it falls below its top word), and the label loses its 9 px tracked capitals. **New:** after the bond, one line "Your First: {name}", the name an identity link to The First (THR-1828 call 2); it renders only while The First is bonded (Law 56) | `identity` |
| `essence` | pinned | Header "Essence" with "Primary: {sphere}" right; the spheres held, two to a row, numerals allowed (Law 13's pool-balance exception), tabular figures; THR-1792's seat line; then **Attention** (moved from the top bar in this slice): "Attention · {state word}" and its gauge, `ui.attention` | `essence`, `attention` |
| `hand` | fill | **The hand**, headed "Your cards" on screen (below) | `hand`, `investiture` |
| `reaches` | folded | label "Reaches", summary "{primary reach label} · {tier word}" ("Veil · Thinning"). The tier word is the body's own `row.tierWord` (`ASCENDANT_REACH_REGISTER` through `getAscendantTierWord`; the god's rungs, never the mortal lexicon), and it carries the same `reachTierTooltipId` tooltip and rung marker the opened `ReachesBlock` shows. A summary longer than `GOD_RAIL_SUMMARY_MAX_CH` shows the tier word alone, with the reach named in its tooltip | `reaches` |
| `mandate` | folded | label "Mandate", summary the trend word from `MANDATE_TREND_WORD` (`ascendant-bar-content.ts:129-134`; "Kindling" while rising), the same table the opened `MandateBlock` reads, so the two cannot disagree; body `MandateBlock` (opens the Mandate dialog) | `mandate` + `reveal.mandate` |
| `covenants` | folded, only when one is held | label "Covenants", summary "{n} held", body `CovenantsBlock` (Release) | — (THR-1814 rule 4) |
| `signatures` | folded, only when one is yours | label "Signatures", summary "{n} yours", body `SignaturesBlock` | none claimed; it also waits for `reaches`, as today (`AscendantBar.tsx:217`), and the `reaches` section is the one that claims that surface |
| `hooks` | folded, only when one exists | label "Hooks", summary "{n} on you", body `HooksBlock` (its `Chip`s move onto THR-1821's `Chip`) | — |

- **Folded rows** are pinned to the rail's foot, one line each: the label (16 px, 700), the summary in `--text-secondary`, and a disclosure icon. A press opens the body in place above the row. Several may be open at once. The open set is a remembered preference (Law 51, `GOD_RAIL_OPEN_ROWS_KEY`), and every row starts closed. Every summary is at most `GOD_RAIL_SUMMARY_MAX_CH` characters (a unit test runs each summary builder's longest case).
- **Why Reaches folds** when THR-613 kept it open as "the player's identity anchor": the folded row still names the primary Reach and its rung, so the anchor stays visible (THR-1828 call 2).
- **No uppercase-tracked label and no literal font size anywhere in the rail.** The 53 literal sizes counted in `ascendant-bar/*` (THR-1819 § 11) go, and the `literal-font-size` and `uppercase` ratchet rows drop with this slice.

**The hand: its place and size.** THR-1876 owns arming and target lighting. The frame owns where the hand sits, how big it is, and what a press calls.

- **Which cards, and the word on screen.** The design docs call this section "the hand" (THR-1827 call 14, THR-1828 call 2). Its set is the god's **map cards**: the ascendant-castable `UnifiedActionTemplate`s that `unlockedActionIds` reveals, cast on the world and targeted on the map and in the Inspector. That is not the UL's hand. UL `Encounters.md` § Repertoire: *"A repertoire is per-run and library-level; a hand is per-step and encounter-level."* An encounter's hand is the step's nudge cards, the authored specials plus the **Dealt Hand** from the god's **Repertoire** (`buildRepertoire`, `dealHand`). The two sets meet at one seam only: a Repertoire member's `milestone` unlock rides the same `unlockedActionIds` grant set. So, on screen, the section header reads **"Your cards"**, not "Your hand", and the encounter copy's "your hand" ("Play your hand, let fate answer") keeps meaning the dealt hand. The question of whether "hand" should also name the rail's set is filed on THR-1882. If it rules yes, the header is one string in `frame-content.ts`. Internally the section id stays `hand`, matching the opening-reveal surface `hand`.
- **Contents** (from `godRail.ts`): a first row of the two core verbs as small `Button`s, **Move** and **Investiture**, keeping their handlers (Investiture only once revealed, THR-1837). The Actions section's core tier lands here, so the hand replaces it as THR-1828 says. Then one row per card the god holds: every ascendant-castable template `isActionRevealed` lets through (`unlockedActionIds`). The self and rare innate actions are among them, so the section's other two tiers land here too. Rows sort by `paySphere` (below) in the essence block's sphere order, then by name.
- **A card row's paying sphere.** Every card row has one key: the pool that pays for it, `paySphere = template.sphereAffinity ?? the god's primary sphere`. That is the cast path's own rule (`targetActions.ts:496`). The self and rare innate cards carry no `sphereAffinity` (`divine.self.stillness`, `.recede`, `.focus`, `.reveal`), so they pay from the primary pool. `paySphere` decides the row's tint, its sort place (the essence block's sphere order, then the name), its group at the rail's limit, and the pool its `payable` check reads.
- **A card row:** a left edge tinted by `paySphere` (the tint is never stripped); line 1 the card's name, Alegreya Sans 700 at `--text-sm` (a name below 22 px is never Cinzel, THR-1833); line 2 the pool and the price.
  - **The price label** comes from one function shared with the Codex: `essencePriceLabel(cost)`, which returns **"Free"** for 0 and `formatEssenceLabel(cost)` otherwise. It is the Codex's own rule (`codexRegistry.ts:336-338`), moved beside `formatEssenceLabel` so both surfaces call one function.
  - **Line 2** is "{paySphere word} · {price label}" (**"Life · 2 essence"** for Inspire; **"Spirit · 5 essence"** for Focus when the god's primary sphere is Spirit). A free card shows only **"Free"**, because no pool pays (**"Stillness"** / **"Free"**).
  - **The price is the par price:** `dominionScaledEssenceCost(graph, ascendantId, template, undefined)`, which with no target prices at `DOMINION_PAR_BAND` (Foreign ground, ×1). God-card prices follow the target's ground (THR-1750, `DOMINION_PRICES_LIVE`), and two cards (`artifact.enchant`, `artifact.empower`, `essenceCostContext: 'target_tier_scaled'`) also follow the target's tier. A row has no target, so the row says so.
  - **The price tooltip.** A non-free price carries the tooltip `ui.hand_price`, whose description is built at render: **"The price on Foreign ground: neither yours nor set against you. Sovereign ground: cheapest, likeliest. Hostile ground: dearer, and less likely. A target's own price shows when you choose it."** The first sentence uses the par band's own name and line (`dominion-content.ts:152, 161`). The next two are `DOMINION_CAST_CLAUSE` word for word (`dominion-ui-content.ts:110, 113`). For a tier-scaled card, the description adds **"A rarer target costs more."**
  - **The Codex agrees:** the entry the press opens shows the same label, "Free" included, through the shared function, because par is ×1. At arming, THR-1876's target shows its own price with THR-1750's band chip (§ F12).
  - **No target words on the row.** No source for them exists today: `CardFace` renders none, and THR-1828's mock invented "a person you know". The HoverCard shows the full card face, and THR-1876's arming lights the valid targets. If THR-1876 defines target words for cards, they join line 2 from that one table (§ F12).
  - **"Payable"** is measured against the cheapest price the card can have anywhere: the sovereign-ground price (par × the sovereign multiplier, from the same `dominionScaledEssenceCost` table), against the `paySphere` pool. A row dims only when that pool cannot pay even that price, so a card the god can cast somewhere is never shown as uncastable (Law 25). A free card is always payable. The reason reads **"Not enough {paySphere word} essence"** (**"Not enough Life essence"**; **"Not enough Spirit essence"** for Focus), the form the sibling surfaces already render (`sphereWord`; `EncounterVeil.tsx:2931`, `MomentCard.tsx:293`). Where a target is too dear for the pool, the lock is THR-1876's (lit-but-locked, THR-1827 call 14).
  - Hover opens a `HoverCard` with the full `CardFace`. Rows are ≥ 24 px tall (Law 46).
- **The header:** "Your cards" with the count "{n}" right, `ui.your_cards`.
- **Its size:** the hand takes the rail's free height. That is the rail's height minus the pinned sections, the core-verb row and the open folded rows, measured with a `ResizeObserver` on the hand region.
- **The fit rule (Law 57: grow, then go progressive at the limit):**
  1. **Whole.** While every card row fits the free height, every card shows in full. Nothing is cut and nothing scrolls.
  2. **Grouped at the limit.** When they do not fit, the cards group by `paySphere`, each group headed "{Sphere} · {n}" (Law 36); a card with no `sphereAffinity` sits in its paying (primary) sphere's group. Groups fold, except the group holding the armed card (THR-1876's `armed.actionId`), else the group the player last opened (a remembered preference, `GOD_RAIL_HAND_GROUP_KEY`), else the first. Opening a group closes the others.
  3. **Scroll only inside a group.** If one open group alone still exceeds the free height, it scrolls inside the hand region. That region is the rail's own limit. The page never scrolls (Law 33), and nothing scrolls sideways.
  - A hysteresis of `HAND_FIT_HYSTERESIS_PX` stops the mode flipping on a one-pixel change.
  - **Measured capacity** (16 px floor; a two-line row ≈ 62 px plus a 6 px gap): at **1920×1080**, about **8 cards** whole with four spheres held and three folded rows, and about **6** in the worst case (twelve spheres, all five rows present); at **2560×1440**, about **11** whole. THR-1828's mock (five cards, about 280 px spare) agrees. So THR-1827's fallback, the hand as a strip along the map's foot, stays unneeded, as THR-1828 found.
- **The press seam.** A card row's press calls `useHandPress()(cardId)` from `HandPressContext`. **The default provider opens the card's Codex entry** (`openCodexEntry`: "read the work"). That press does something real (Law 25), unlike today's unwired rows. **THR-1876 replaces the provider with arming** and passes `armed.actionId` back for the armed row's look: the selected state (gold glow ground, `--border-accent`, gold name; frontend-ui § 6). The rail never sets the armed state itself.
- **Rest while a moment is open** (THR-1829 § Stage layout): while `InterruptResolution.anyOpen`, the hand's rows dim (`HAND_REST_OPACITY`) and swallow presses, and one line sits under the header. While `EncounterVeil` is open it reads **"Your cards wait. This encounter deals its own hand."**. For every other moment it reads **"Your cards wait while this moment is open."**. **This departs from THR-1829's words** ("Your hand is in play on the Stage"). That line would tell the player the rail's cards are in play during an encounter, but the encounter plays its own dealt hand (above), so one fact would be told two ways (PC-6). When the Stage ships, THR-1877 may say "on the Stage" in the first line. The rest is driven by the registry, so it needs no Stage build. THR-1877 consumes it and does not rebuild it.
- **Empty hand** (no card yet; the core verbs still show): "No cards yet. Your story's gifts bring them."

### F7 — The Ledger rail: your threads and the story so far

Host: `src/components/Game/frame/LedgerRail.tsx` (THR-1881). Width `var(--rail-right-w)` (340 / 420). Data: `useView(ledgerRail)`. Drawn from `LEDGER_RAIL_SECTIONS` (Threads, then Chronicle) and `LEDGER_TABS`.

- **Header row:** "Threads" (label) and, at the right, the fold control "Fold" with a disclosure icon (`ui.ledger_fold`, `L`).
- **Threads** (reveal `threads`): `ThreadsPanel` unchanged inside, with its sections and fold rules kept. The only copy change is its pip (§ Content).
- **Chronicle** (reveal `chronicle`, header label "Chronicle", `ui.chronicle`):
  1. **The World-Soul line** (reveal `world_soul`): "World-Soul" (label), then the World-Soul sentence for the dominant sphere and intensity (`WORLD_SOUL_PROSE`, banded as today, the banding moved into `ledgerRail.ts`), then the world's mood sentence for the current doom stage. Alegreya (the story face), at most three lines. The line carries `ui.world_soul`. The mood sentence comes from `WORLD_MOOD_LINES` (World Pulse's fifteen lines, moved to data unchanged). It is picked deterministically by `(year × SEASONS_PER_YEAR + season) mod lines.length`, so it changes once a season instead of every tick.
  2. **The tabs** (`Tabs kind="tabs"`, THR-1885): **Now · Years · Ledger**. The selected tab is remembered (`CHRONICLE_TAB_KEY`).
     - **Now:** THR-1656's "Before you woke" stays pinned at the top. Then the entries of the current season and the `CHRONICLE_NOW_SEASONS − 1` before it, newest first. The voice toggle (Both · Poet · Witness) is a `Tabs kind="toggle"` row above the entries, now remembered (`CHRONICLE_VOICE_KEY`, Law 51). Empty: "The world awaits…" (today's line).
     - **Years:** every entry, grouped by calendar year (`deriveSeasonAndYear`), newest year first, each group a counted, foldable `Section` ("Year 2 · 14 entries"; one entry: "Year 3 · 1 entry"); the current year starts open. The tab **renders only once the entries span two calendar years**. Until then it would repeat Now (Law 25).
     - **Ledger** (reveal `chapter_ledger`; the tab reads "Ledger · {n}" while chapters are unread): the threaded chapters, newest first, as rows (chapter name, mortal, state word from `resolvedStatusLabel`), the unread ones marked "new"; pressing a row opens the Chapter Ledger reader at that chapter (the reader gains an optional initial-record prop beside THR-1820's newest-row default), and a button "Open the Chapter Ledger" opens it at the newest. The reader is the L dialog THR-1820 sizes; it still holds the clock while open (THR-1825 row 22). **Selecting the tab shows the unread rows marked "new" and then sets the seen count**, so the count is never cleared before its rows are seen (Law 40). The rows use the reader's own predicate, extracted beside `countThreadedChapters` as `selectThreadedChapters`, so the tab and the reader never disagree (PC-6).
- **Grow before scroll (Law 57).** The Chronicle's entry list loses its 320 px cap and takes the rail's free height under Threads. Threads keeps at least `LEDGER_CHRONICLE_MIN_REM` of height for the Chronicle by folding its own sections first. At the limit, the entries list scrolls inside its region. That region is the rail's limit, never a box shorter than it.
- **Rail labels** (16 px, 700, sentence case, tertiary). The Chronicle's tracked-uppercase Cinzel "CHRONICLE" header (`ChroniclePanel.tsx:190-199`) goes.

### F8 — The fold and the 56 px strip

- **Two reasons to fold, one rail.** Folded = the player folded it (`LEDGER_FOLDED_KEY`, Law 51) **or** the Inspector is open (THR-1827 call 6; THR-1876 writes `inspector.open` in `GameScreenState`). Closing the Inspector restores the player's choice. Before THR-1876 lands, the Inspector input is simply `false`.
- **The strip** (`var(--rail-strip-w)`, 56 px; a `Panel` column): at the top, an unfold button (icon + tooltip "Unfold the rail · L"); then one item per `LEDGER_RAIL_SECTIONS` entry and per `LEDGER_TABS` entry that declares a `strip`: **Threads** (`frame.threads` icon; count = threaded mortals whose row shows the priority pip, the pip's own predicate (a pending encounter), "{n} chapter waits" / "{n} chapters wait"; the same words as the pip, "A chapter waits"), **Chronicle** (count = entries since the Chronicle was last on screen, "{n} new"), **Ledger** (once revealed; count = unread chapters, "{n} new chapters"). Each item is an `IconButton` at the `list` icon size (24 px) with a count `Chip` under it. The word lives in its tooltip (THR-1834 § 5). At zero the count chip is not drawn; the icon stays, because it still unfolds (Law 25).
- **A strip press:**
  - **Inspector closed:** unfolds the rail (sets the player's choice to open) and scrolls that section into view.
  - **Inspector open:** the rail cannot unfold, because the budget forbids it (§ F11: rails + Inspector leave the map 35% at 1080p). The press opens a **flyout**: the full Ledger rail at `--rail-right-w`, as a floating `Panel` in an `Overlay backdrop="none"` (THR-1884) at the `hud` band, anchored to the strip and laid over the Inspector's edge. Esc, a press outside, or the same strip item closes it. The flyout is transient, so it does not count against the budget. In the escape order it sits above the Inspector: armed card → flyout → top dialog → full → wide → docked (THR-1827's order, with the flyout inserted).
- **`L`:** with the Inspector closed it folds or unfolds; with the Inspector open it opens or closes the flyout on the last-used section (Threads by default).
- **During a Stage moment the rail steps aside entirely** (THR-1877's plan, agreed on THR-1875's thread). The Stage's window of open map, where the lit hex sits, is the screen's right edge (280 px at 1080p, 520 at 1440p), which is exactly where the rail is. So while `GameScreenState.stage.phase !== 'idle'` (THR-1877's flag) the rail renders **hidden**: not open, not the strip, zero width. When the moment closes it returns as the player left it. The rail is a flex sibling of the map, so hiding it widens the canvas. The hide happens before the Stage's camera ease, so the ease frames the lit hex in the widened canvas. The frame owns the `hidden` state and its order (rail first, then the ease); THR-1877's slice 2 ([THR-1892](https://linear.app/threadbare/issue/THR-1892)) adds the one flag read in `LedgerRail`. Precedence: hidden (Stage) › strip (Inspector open, or the player's fold) › open.

### F9 — What retires

| Retires | Where it goes | Slice |
|---|---|---|
| **World Pulse** (`WorldPulse.tsx`) and `worldPulseCount.ts` (`countLivingMortals`, whose only production reader is World Pulse) with its test block in `lairMonsterF1.test.tsx` | speed → the top bar's Time slot; season and year are already there; Active Agents / Cultures counts go (no decision rests on them, Law 53); its "World Omen" repeats the top bar; mood lines → the World-Soul line | 1 |
| `ui.world_pulse_tick`, `_agents`, `_cultures`, `_mood` (no reader today) | deleted | 1 |
| The `world_pulse` opening-reveal row and union member | the `a_path_opens` toast becomes "New beside the map: your Reaches, the World-Soul and Omens." | 1 |
| World-Soul in the top bar (`WorldSoulIndicator`, the `topbar-compact-hide` rule) | the Chronicle header line; the component is deleted once its banding is in the VM | 1 |
| The Chapter Ledger launcher button (📖) | the Ledger tab | 1 |
| The Chronicle's 320 px cap and its tracked-uppercase header | § F7 | 1 |
| Attention in the top bar | under essence in the god rail | 2 |
| The god rail's "Actions" section (`ActionsBlock`, its three tiers, `TRAY_EMPTY_COPY`) | the hand | 2 |
| `ASCENDANT_BAR_SECTION_DEFAULT_OPEN` | `GOD_RAIL_SECTIONS` + the remembered open set | 2 |
| The beat-offer pill (`AscendantBeatOfferBanner`) as a separate floating surface | a Waiting row; its raise moves to the Needs-you pill | 3 |
| The avatar-arrival toast | the named pause (status line + Waiting row) | 3 |
| `AlertBar.tsx` (imported, never mounted) and `AlertBar-actorId.test.tsx` | Needs you's News group | 3 |
| `ALERT_MAX_VISIBLE` | the age trim + `ALERT_SAFETY_CAP` | 3 |
| Icon-only Read the Threads and Settings (📖, ⚙ glyphs) | labelled `Button`s with carved icons | 3 |
| The Doom item's third row: the journey line "The First: {journey}" / "The First awaits" and "Next: {stage}" (`DoomBar.tsx:47, :112-113`) | the Doom item's tooltip: its label keeps today's composition ("{doom name} — Stage {n}: {stage} — The First: {journey}"), and its description gains the "Next: {stage}" line. Both stay in the Doom dialog (`DoomClockDetail`). [THR-1860](https://linear.app/threadbare/issue/THR-1860) item 4 owns the words that say The First's story is paced by the clock, and they land in the same tooltip | 3 |
| The expired Doom state "UNMADE" in monospace (`DoomBar.tsx:102-105`) | "Unmade", sentence case, in the stage name's slot (THR-1833: no monospace and no capitals on player surfaces) | 3 |
| The Doom item's fixed `minWidth: 140px` / `170px` (`GameViewTopBar.tsx:347`, `DoomBar.tsx:79`) | the stage-name cap `TOPBAR_DOOM_MAX_REM` and yield step 3 | 3 |

**IA manifest** (`src/data/ia-manifest.ts`; it is the source of the player guide `public/interface-reference.html`, so the wiki-freshness gate binds both): slice 1 retires `game.world-pulse`, updates `game.chronicle-panel` (tabs, World-Soul line) and `game.simulation-controls` (speed), and adds `game.ledger-strip` and `game.world-soul-line`. Slice 2 updates `game.ascendant-bar` (the hand; Attention) and `game.attention-pool-indicator`. Slice 3 retires `game.alert-bar` and adds `game.needs-you`. The frame slices also remove the already stale `game.essence-panel`, `game.mandate-tracker`, `game.identity-chip` and `game.avatar-hud` (no component on screen) as they rewrite the frame's part of the manifest. The guide page's frame sections are rewritten with them. Its Action Drawer section is THR-1876's.

### F10 — Keys

Kept: Space, `+`/`=`, `-`, `.`, `m` (time and move). Taken by other plans: `1`–`4` lenses and `5` reserved, `PageUp` / `PageDown` zoom, the arrow keys pan, `Home` centres on the First, `F` shows the known land (all THR-1878, which moves the map keys off `+`/`-` and WASD); Ctrl+K and `/` (Find) and `W` (widen), THR-1876's. **New:** `N` opens or closes Needs you while it renders (slice 3); `L` folds or unfolds the Ledger rail, or toggles the flyout while the Inspector is open (slice 1). Both are skipped while typing (`isInputActive`) and with Ctrl/Meta/Alt held. Both are declared on the frame's list entries and reach `TOP_BAR_KEYS` from there (§ F2 check 3), never hard-coded in the handler. THR-1878's overlap test keeps every key single-claimed.

### F11 — The map-share budget at 1920×1080 and 2560×1440

THR-1819 § 5's formula: share = (W − columns) × (H − top bar) / (W × H), against `FRAME_MAP_SHARE_MIN` 0.60 (both rails) and `FRAME_MAP_SHARE_MIN_INSPECTOR` 0.45 (rail + strip + docked Inspector).

| Screen | Layout | Columns | Map rect | Share | Floor |
|---|---|---|---|---|---|
| 1920×1080 | both rails open (48 top bar) | 320 + 340 | 1260 × 1032 | **0.627** | 0.60 ✓ |
| 1920×1080 | Ledger folded to the strip | 320 + 56 | 1544 × 1032 | **0.768** | 0.60 ✓ |
| 1920×1080 | Inspector docked + strip | 320 + 56 + 560 | 984 × 1032 | **0.490** | 0.45 ✓ |
| 2560×1440 | both rails open (56 top bar) | 400 + 420 | 1740 × 1384 | **0.653** | 0.60 ✓ |
| 2560×1440 | Ledger folded | 400 + 56 | 2104 × 1384 | **0.790** | 0.60 ✓ |
| 2560×1440 | Inspector docked + strip | 400 + 56 + 717 | 1387 × 1384 | **0.521** | 0.45 ✓ |
| *1920×1080* | *both rails, **top bar wrapped to two rows** (96)* | *660* | *1260 × 984* | ***0.598*** | *0.60 ✗* |
| *1920×1080* | *both rails **and** a docked Inspector (why the rail cannot unfold, § F8)* | *1220* | *700 × 1032* | ***0.348*** | *0.45 ✗* |

- **The one-row top bar is load-bearing for the budget**, not a style choice: a wrapped bar alone breaks the 1080p floor. Slice 3's check measures it (§ Done when).
- **Transient surfaces do not count:** the Needs-you list, the Ledger flyout and the HoverCard all close on Esc or a press outside.
- **Headroom:** 54 px of column at 1080p with both rails (THR-1819). The frame adds no column. The strip replaces the Ledger rail; it never sits beside it.

### F12 — The GameView host, shared screen state, and the seams with THR-1876 and THR-1877

- **Hosts** (THR-1881, THR-1822 D16 step 2): the top bar renders in `src/components/Game/GameView/GameViewTopBar.tsx`; the god rail in `src/components/Game/frame/GodRail.tsx`; the Ledger rail and strip in `src/components/Game/frame/LedgerRail.tsx`. GameView composes the three. Slice code goes into these files and the frame registry, never back into `GameView.tsx`.
- **`GameScreenState`** (THR-1822 D17's context, created by THR-1881). The frame adds the fields that more than one host reads: `frame.needsYouOpen`, `frame.ledgerFoldPref` (mirrors the stored preference), `frame.ledgerFlyout: LedgerSectionId | null`, `frame.namedPause: NamedPause | null`. It reads `inspector.open` and `armed` (`ArmedCardState | null`; the frame uses `armed.actionId`), which THR-1876 writes (its plan, § D1–D2, names them exactly so).
- **Seams, order-free:**

| Seam | Frame side | Other side | If the other side is not built yet |
|---|---|---|---|
| Ledger auto-fold | reads `inspector.open` | THR-1876 writes it | `false`: the rail follows the player's fold |
| Hand press | calls `useHandPress()(cardId)` | THR-1876 provides arming | the default provider opens the card's Codex entry |
| Armed row look | reads `armed.actionId` | THR-1876 writes it | no row is armed |
| A target's own price at arming | the row shows the par price and says so (`ui.hand_price`) | THR-1876's arming shows the chosen target's price with THR-1750's band chip | the par price only |
| A card's target words on its hand row | line 2 has room for them after the price | THR-1876 defines target words for cards, if its arming needs them, in one table | the row shows sphere and price only; the HoverCard shows the card face |
| Find | reserves the centre slot | THR-1876 adds the `find` entry to `TOP_BAR_ITEMS` and its component to `TOP_BAR_COMPONENTS` | empty slot |
| God's sheet | identity link calls `onOpenSheet` | THR-1876 routes it to the Inspector | today's `AscendantSheet` modal |
| News row press | `useNotificationNavigation` → ref router | THR-1876 points the router at the Inspector | today's routing |
| Held rows | `heldMoments` from `collectHeldMoments` | THR-1877 owns the hold rule | today's registry holds (yielding surfaces) |
| Top-bar guard during a moment | items with `guardedWhileEncounter` dim and swallow presses while an encounter is open (THR-1814) | THR-1877 widens the predicate to every Stage moment and adds Find to the guarded items (its plan, Stage frame table) | today's encounter-only guard |
| Ledger rail during a Stage moment | the `hidden` state, applied before the Stage's camera ease | THR-1877 owns `stage.phase`; THR-1892 adds the read in `LedgerRail` | the rail stays as the player left it |
| Hand rest line | "Your cards wait. This encounter deals its own hand." | THR-1877 may name the Stage in it once the Stage ships | the line as written |
| Selectors move | `views/godRail.ts` imports from `views/subjects/godSheet.ts` | THR-1876's god-sheet page reads the same | whichever lands first moves `ascendant-bar/selectors.ts`, leaving a one-line re-export at the old path |

### F13 — Onboarding, first-run and guide copy that points at moved surfaces

Measured over `src/`, `public/` and `Docs/`. There are no tutorial, coach-mark or hint files. `MeetTheFirstFlow`, `StartPage`, `WarmStartOverlay`, the spine gift prose and the Codex concept pages name no moving surface.

| Where | Today | After | Slice |
|---|---|---|---|
| `opening-reveal-table.ts:72` row `world_pulse` ("World Pulse" in the reveal toast) | names a retiring surface | row and union member removed; `openingReveal.test.ts:238` expects "New beside the map: Notables, your Reaches, the World-Soul and Omens. Nothing more is hidden." | 1 |
| `opening-reveal-table.ts:63` `chapter_ledger` "the Chapter Ledger" | the launcher | unchanged words; it now reveals the Ledger tab and its strip item | 1 |
| `ui-content.ts:240-243` `ui.sim_speed` "Tick Speed" | engine unit in a label (Law 14) | label **"Speed"**; desc **"How fast the world turns. Faster speeds skip routine events. Press + or − to change it."** | 1 |
| `WorldPulse.tsx` strings, aria "Decrease speed" / "Increase speed" | World Pulse | the aria labels move with the stepper; the rest is deleted | 1 |
| `GameView.tsx:6233-6239` "Open the Chapter Ledger", "📖 Chapter Ledger", "New chapters since you last opened the ledger" | launcher | the Ledger tab's words (§ Player-facing text) | 1 |
| `ui-content.ts:773-776` + `ThreadsPanel.tsx:553` pip "Needs Attention" / aria "Needs attention" | collides with "Needs you" and the Attention gauge | label and aria **"A chapter waits"**; desc unchanged | 1 |
| `AscendantBar.tsx:248,252` "Actions", "No innate actions available."; `ascendant-bar-content.ts:121-125` tray empty lines | Actions section | "Your cards"; "No cards yet. Your story's gifts bring them." | 2 |
| `ui-content.ts:1030` "Your pools are listed under Essence on your bar." | still true ("Essence" stays the god rail's section) | unchanged | — |
| `ui-content.ts:170-173` `ui.signatures` "…open one to see…", `:1110-1113` `ui.covenant` "…release one…" | rows fold | still true (opening the row shows them) | — |
| The word "hand" in encounter copy ("Play your hand, let fate answer", "Your hand in it") | the encounter's hand: a step's nudge cards, partly dealt from the god's Repertoire (UL `Encounters.md` § Repertoire, § Dealt Hand) | unchanged. The rail's set is a different one (the god's map cards, § F6), so its header says "Your cards" and never "hand". THR-1829's rest line "Your hand is in play on the Stage" is replaced for the same reason. The naming question is on THR-1882 | — |
| `public/interface-reference.html` (the "Reading the Interface" guide) frame sections: "identity and clocks along the top", "Left / right rails", "World Pulse & Live-Location Bar", top frame lists "attention" | the old frame | rewritten with the IA manifest, slice by slice | 1–3 |
| `public/interface-reference.html` "The Action Drawer", `public/divine-actions-reference.html` drawer lines, `Docs/canon/rulebook.md:86,113,153,157`, `rulebook-quick-reference.md:34` | the ActionDrawer | **THR-1876's** (it retires the drawer) | — |
| `Docs/canon/rulebook.md:149,157` "the ascendant bar" | names the left rail | updated to the UL's word for the left rail once THR-1882 rules on it; until then left as is, with a comment on THR-1882 | 2 |
| `Docs/design-system/layout-zones.md:173`, `layout.md`, `Docs/ui-patterns.md:86,193,696-702,825-842` (WorldPulse, the action drawer along the bottom) | the old frame | THR-1819 rewrites the zones; each slice corrects the lines naming its surfaces | 1–3 |

### F14 — The opening reveal and the quiet first screen

Every frame entry names the reveal surfaces it claims (§ F2), and the renderers read `opening.show[...]` (THR-1837) ANDed with the THR-1648 gate. So the staged opening keeps working unchanged: the gold ring (`NEWLY_REVEALED_STYLE`) moves with each surface to its new home. The bond shows the time controls (now with speed), identity, essence, Attention, the hand, Threads, the Chronicle and Settings. Needs you renders only after the bond, so the quiet first screen stays quiet (THR-1648, Law 53).

## Engine pillar

### Systems design

All new engine code is pure view-model code in the THR-1822 seam, read through `readView` / `useView`, cached per session on `SimulationRuntime.viewCache`, tested in Node with THR-1822's `viewContract.ts` (serialisable, deterministic, no raw ids or numbers in display strings, a typed fallback).

- **E1 — `src/engine/views/ledgerRail.ts`** (slice 1; selector id `ledgerRail`, invalidation `world`; args `{ seenChronicle: number; seenLedger: number }` in the key). Returns `LedgerRailVM`:
  ```ts
  interface LedgerRailVM {
    worldSoul: { label: 'World-Soul'; sentence: string; mood: string; sphere: SphereName | null } | null;  // null before an aggregate exists
    now: { entryIds: string[]; emptyLine: string | null };
    years: { year: number; label: string; entryIds: string[] }[];   // label "Year 2"; years.length >= 2 gates the tab
    ledger: { rows: { recordId: string; name: string; mortal: AnyRef | null; state: string; isNew: boolean }[]; unread: number };
    strip: { threads: number; chronicle: number; ledger: number };
  }
  ```
  The intensity banding (`INTENSITY_*_MAX`) and `WORLD_MOOD_LINES` selection move here from `WorldSoulIndicator` and `WorldPulse`. Entry bodies stay `ChronicleEntry` objects rendered by `ChronicleEntryCard`; the VM carries ids and groups, not prose copies.
- **E2 — `src/engine/views/godRail.ts`** (slice 2; selector id `godRail`, invalidation `world`). Returns `GodRailVM`: `identity`, `essence` (rows, primary, seat), `attention` (`{ word, fill }`, with `fill` the gauge's 0–1 for the bar only, never printed), `hand` (`{ coreVerbs: ('move' | 'investiture')[]; cards: HandCardVM[] }`, with `HandCardVM = { id, name, paySphere, parPriceLabel, priceTooltip | null, payable, reason | null, codexEntryId | null }`; `paySphere = sphereAffinity ?? primary sphere`, `parPriceLabel` through the shared `essencePriceLabel`, `payable` measured at the sovereign price against the `paySphere` pool, § F6), and `rows` (per folded section: `{ id, renders, summary }`). It composes the moved `ascendant-bar/selectors.ts` (§ F12) and reads `unlockedActionIds` through `isActionRevealed`. It stops keying on the undeclared `state.worldVersion` (THR-1822's version hazard).
- **E3 — `src/engine/views/needsYou.ts`** (slice 3; selector id `needsYou`, invalidation `world`; sources passed as args per D13). § F5.
- **E4 — `src/engine/views/interruptRegistry.ts`** (slice 3): the registry moved, unchanged, plus `collectHeldMoments(snapshot, queues): HeldMoment[]`. `src/components/Game/interruptRegistry.ts` becomes a one-line re-export until its last importer moves (NFP #6).
- **E5 — `src/engine/notificationRouter.ts`** (slice 3): the age trim and `ALERT_SAFETY_CAP`; same-icon, same-tick alerts are appended instead of overwritten, and only a repeated `sourceEventId` is dropped (§ F5); `NotificationState.alertsTrimmedAtCap` (additive, in `types/notification.ts`). The burst coalescing is the VM's, so the channel keeps every alert it was given.
- **E6 — `src/engine/phaseMandate.ts`** (slice 3): the two fallback milestone lines stop printing a raw `MandateStage` id (§ F5). This is a string fix at the producer, which is where Law 13/14 numbers and keys are banded. No mandate rule changes.

### Graph nodes / edges

None. View models are transient derived data (THR-1822 D1). No node type, edge type or `GameState` field is added. `NotificationState` is React-held presentation state; its one new field is additive.

### Tick phases

None. Nothing here runs in the tick. The VMs rebuild lazily when `worldVersion` moves, so nothing rebuilds while paused.

### Resolution logic

Deterministic selection only: the hand's sort (sphere order, then name), the Chronicle's Now window and year groups (`deriveSeasonAndYear`), the mood line `(year × SEASONS_PER_YEAR + season) mod lines.length`, Needs-you group order and fold order (§ F4), held order from `collectHeldMoments`.

### PRNG callouts

None. No random call anywhere in the frame. The mood line, which used `tick % 3` to flicker, becomes a stable per-season pick.

## Content pillar

No encounter template, prose table, attachment or world-model data. UI copy only, all quoted in § Player-facing text:

- **Tooltip registry** (`src/data/ui-content.ts`): new `ui.needs_you`, `ui.needs_you_waiting`, `ui.needs_you_held`, `ui.needs_you_news`, `ui.read_threads`, `ui.notables`, `ui.your_cards`, `ui.hand_price` (description built at render from the Foreign band's own words and `DOMINION_CAST_CLAUSE`), `ui.chronicle`, `ui.chronicle_years`, `ui.chapter_ledger`, `ui.ledger_fold`; changed `ui.sim_speed`, `ui.thread_priority_pip`. Rivals uses the existing `ui.rival_panel` (one id per concept). Each passes `tooltipValidation.test.ts`.
- **Frame words** (`src/data/frame-content.ts`, new): Needs-you group titles, action words, fold row, guard suffix (re-using `TOPBAR_LOCKED_SUFFIX`), held connectors, named-pause status template; hand header, empty line, rest lines, group header; folded-row summary templates; Chronicle tab labels, Years group label, Ledger tab rows and button; strip count labels; `WORLD_MOOD_LINES` (moved from `WorldPulse.tsx:70-76`, words unchanged).
- **Counts read right at one (PC-3).** Every frame string with a count is a `{ one, other }` pair rendered through one helper, `countWords(n, pair)` in `frame-content.ts` (or the codebase's existing plural helper, if the executor finds one; one helper either way): the Needs-you pill's label, the strip's three counts, the Years group header. `frameCountWords.test.ts` renders every frame count template at n = 1 and n = 2 and fails on "1 things", "2 chapter waits" and the like. Counts shown as a bare number ("Needs you 3", "Ledger · 2", "Spirit · 4") need no pair.
- **Tooltips that quote a tunable** (`ui.needs_you_news`, `ui.chronicle`) build their descriptions at render from the constant (`NEEDS_YOU_NEWS_TOOLTIP`, `CHRONICLE_TOOLTIP` in `frame-content.ts`), so retuning `NEEDS_YOU_NEWS_KEEP_DAYS` or `CHRONICLE_NOW_SEASONS` can never make them false.
- **Data tables:** `src/data/frame-registry.ts` (§ F2) is data, not prose.

## Interface impact

| Contract (`Docs/canon/interface-map.md` subsystem) | Change | Read site → write site |
|---|---|---|
| Alert channel → the player (Attention & Chronicle) | **extend**: first production reader; trim moves from count to age, with a counted cap; the same-icon-same-tick overwrite becomes append (the VM coalesces bursts) | `notificationRouter.ts` (write) → `views/needsYou.ts` → the top bar (read) |
| Interrupt registry → the god's attention (Attention & Chronicle) | **extend**: moved into the seam; new reader `needsYouView` (held group) beside `useInterruptAutoPause`; new pure `collectHeldMoments` | `views/interruptRegistry.ts` → `needsYou.ts`, `GodRail` (hand rest) |
| Ascendant beat offer → the player (Ascendant Beats) | **retire** the floating pill as the offer's home; **add** the Waiting row; the THR-1809 raise moves to the pill | `pendingBeat` / `computeGiftDelivery` → `needsYou.ts` → the pill |
| Divine receipts (toast tier) → the player | **extend**: unacknowledged receipts become Waiting rows | `playerReceipts.ts` → `needsYou.ts` |
| Avatar arrival → the clock | **extend**: a named pause the time control and the queue name (was a toast) | `avatar_arrival` tick event → `GameScreenState.frame.namedPause` → `SimulationControls`, `needsYou.ts` |
| World-Soul aggregate → the player | **preserve** (the read moves from the top bar to the Ledger rail VM) | `state.worldSoul.aggregate` → `ledgerRail.ts` |
| Chronicle and chapter archive → the player | **preserve**; one shared predicate `selectThreadedChapters` for the tab and the reader | `chronicleEntries`, chapter records → `ledgerRail.ts` |
| Card unlock set → the player (Ascendant Beats) | **preserve** (`isActionRevealed` read by the hand VM) | `unlockedActionIds` → `godRail.ts` |
| Opening reveal → the frame | **extend** (frame lists claim every surface) and **retire** `world_pulse` | `opening-reveal-table.ts` → the three renderers |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` change together, in slice 3, for the alert-channel, registry, offer, receipt and arrival rows. Slices 1 and 2 add only reads of state other surfaces already read, and they record those reads in the same two files. Every new cross-system read names its production read site above. No cross-system write is added.

## UI pillar

*Screenshot tool: Playwright for the DOM frame (top bar, rails, strip, Needs-you list, hand); Claude-in-Chrome only if a capture must show the map canvas behind the frame (the budget is measured from DOM rects, so it is not needed for the checks).*

### Player-facing display

The frame is § F3–F8. In short, at 1920×1080: a 48 px top bar in one row; a 320 px god rail with identity, essence and Attention, the hand filling the middle, and the folded rows at the foot; the map; a 340 px Ledger rail with Threads and the Chronicle (World-Soul line, tabs). The Ledger rail becomes a 56 px strip when folded or when the Inspector docks. Needs you shows only when something waits. At 2560×1440, everything steps to 56 / 400 / 420 px and 18 px type.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Needs-you pill | **"Needs you 3"** (word + count); aria and tooltip label **"3 things need you"** (one: **"1 thing needs you"**) | PC-4, PC-5, PC-7 | `ui.needs_you`: **"Things waiting on you that do not stop time: offers, what your acts bought, news, and moments held behind the one on screen. It shows only when something waits. Press N to open it."** |
| Needs-you groups | **"Waiting for you · 1"**, **"Held behind this chapter · 1"**, **"News · 3"** | PC-5 | `ui.needs_you_waiting`: **"Things you can open now. They wait until you do."** · `ui.needs_you_held`: **"Moments that will open, in this order, when the one on screen closes."** · `ui.needs_you_news` (label "News"; its description is built at render from `NEEDS_YOU_NEWS_TOOLTIP` in `frame-content.ts`, with `{keep}` filled by `durationLabel(NEEDS_YOU_NEWS_KEEP_DAYS × TICKS_PER_DAY)`, so retuning the constant can never make it false): **"What changed in the world that touches you. A row leaves when you open it, or after three days."** |
| Waiting rows | **"A gift waits: The Seat"** · **"Three powers stir"** · **"What your act bought: The fever breaks before dawn."** (the receipt's own `toastMessage`, the overview's first sentence, unchanged) · **"Your ascendant has arrived at Oreblack Deep."**; action words **"Open"** / **"Show"** | PC-3, PC-4 | the row is the thing, by its own name (never a beat id) |
| Held rows | **"A premonition about Kael Thorne"** · **"A message: Reality Cracks"**; action word **"after this"** | PC-4, PC-5 | the header tooltip says they open in order |
| News rows | **"Kael Thorne has been promoted to Sergeant in The Civic Guard."** · **"two days ago"** (under a day: **"less than a day ago"**, `elapsedLabel`); **"Kael Thorne's story deepens"** | PC-3, PC-5, PC-8 | each row opens the target its alert carries, through `useNotificationNavigation`: the promotion (`faction_rank_changed`) opens **the Civic Guard's page** (`deriveNavigationTarget`, `notificationRouter.ts:41-44`), and "story deepens" (`backstory_unlock`) opens **Kael Thorne's page** (`:59-61`). The row leaves on the press. The line is the producer's own `message`, unchanged. The one producer whose fallback leaked a raw id (the mandate milestone, next rows) is fixed in slice 3 |
| Fold row | **"and 4 more"** | PC-5 | pressing shows them in place |
| Guarded rows (a moment is open) | row tooltip ends **"Opens when this chapter closes."** | PC-8 | the same words as the guarded top-bar buttons (THR-1814) |
| Time slot | **"Autumn · year 3"** / **"paused · Your ascendant has arrived at Oreblack Deep."**; stepper **"‹ 2× ›"** | PC-4, PC-1 | `ui.sim_speed`: **"Speed — How fast the world turns. Faster speeds skip routine events. Press + or − to change it."** |
| Top-bar buttons | **"Rivals"**, **"Notables 4"**, **"Read the Threads"**, **"Settings"** | PC-1 | `ui.read_threads`: **"A digest of what your threaded mortals did while you looked elsewhere."** · `ui.notables`: **"The rulers and powers with a live or recently finished agenda, and what each is after. The number is how many the list shows. It falls when a finished agenda fades from the list."** These are [THR-1860](https://linear.app/threadbare/issue/THR-1860)'s recommended words (item 3, the count that rose and fell unexplained). THR-1860 owns the reason line shown when the count drops; this tooltip must keep agreeing with it · Rivals: `ui.rival_panel` (existing) |
| God rail: identity | **"Vara"** (Cinzel, 22 px) · **"The Thread-Singer"** (the archetype title, from `ARCHETYPE_TITLES`) · **"Quintessence · Resonant"** and the epithet line, both only while `showOnStrip` holds (THR-1713 D8) · **"Your First: Kael Thorne"** (after the bond) | PC-1, PC-6 | the name: `ui.ascendant_name`; the title: `ui.ascendant_archetype`; the label: `ui.ascendant_quintessence` (**"How whole you still are, from Absolute down to Fraying. …"**, the god's entry, never the mortal's `ui.quintessence`); the word: `quintessence.{band}`; Kael Thorne's name: an identity link (image, tooltip, page; Laws 1, 21) |
| God rail: essence header | **"Essence"** · **"Primary: Spirit"** | PC-1 | the sphere name carries `sphere.spirit`; the pool numerals are the Law 13 pool-balance exception |
| God rail: Attention | **"Attention"** + gauge while focused (today's rule: the focused state has no word, `AttentionPoolIndicator.tsx:32-34`); **"Attention · Busy"** / **"· Strained"** / **"· Overwhelmed"** otherwise | PC-1, PC-6 | `ui.attention` (existing, unchanged) |
| God rail: the hand's header | **"Your cards"** · **"5"** | PC-1, PC-6 | `ui.your_cards` (after THR-1876): **"The cards you can cast on the world. Choose one, then choose where it lands. Esc puts it back."**; interim (slice 2, before arming): **"The cards you can cast on the world. Press one to read it in the Codex."** |
| Hand row | **"Inspire"** / **"Life · 2 essence"** (`divine.inspire`, `sphereAffinity: life`, base cost 2 at par); a card with no sphere pays from the primary pool: **"Focus"** / **"Spirit · 5 essence"** (primary Spirit); a free card: **"Stillness"** / **"Free"**; unpayable even on sovereign ground: **"Not enough Life essence"** / **"Not enough Spirit essence"** | PC-1, PC-6, PC-8 | the HoverCard shows the full card face; the price's tooltip `ui.hand_price` says it is the par price and how ground changes it, in THR-1750's words. The same par number appears in the Codex entry the press opens; at arming the target's own price shows with THR-1750's band chip (THR-1876) |
| Hand grouped at the limit | **"Spirit · 4"** | PC-5 | a counted, foldable group (Law 36) |
| Hand at rest | **"Your cards wait. This encounter deals its own hand."** · **"Your cards wait while this moment is open."** | PC-6, PC-8 | says why the cards do not answer, and where the encounter's cards come from |
| Hand empty | **"No cards yet. Your story's gifts bring them."** | PC-7 | — |
| Doom (top bar) | label **"Doom"**, the doom's sigil, stage name **"Reality Cracks"** (the Breach doom, stage 2), the five-stage bar; expired: **"Unmade"**; after yield step 3, **"Doom"**, the sigil and the bar | PC-1 | `ui.doom_bar` (existing, THR-1814): **"A slow clock toward the world's unmaking, in five stages. It wakes when you bond The First and cannot end the world early. Open it to see what it is building toward."** The tooltip's label keeps today's composition (**"Breach — Stage 2: Reality Cracks — The First: Call"**), and its description gains **"Next: The Thinning"**. So a stage name the bar has cut, The First's journey and the next stage are all one hover away, and the Doom dialog names them too. While an encounter is open the tooltip ends **"Opens when this chapter closes."** THR-1860 item 4's line about The First's pacing joins this tooltip when it lands |
| Omen (top bar) | label **"Omen"**, name **"Thin Places"**; after yield step 4 only **"Omen"** | PC-1 | `ui.omen` (existing): **"A passing sign of what presses on the world, most often an echo of the doom. It lasts a few days and colours what the world brings up while it does."** Its tooltip label carries the name (**"Omen · Thin Places"**); the flyout names it in full |
| Opening direction line, short form (yield step 5) | **"Kael Thorne's chapter is waiting →"** · **"Let time run for Kael Thorne"** | PC-7 | the tooltip carries THR-1837's full sentence (**"Watch over Kael Thorne. A chapter of his story is waiting →"**) |
| News, a burst of one kind | **"Kael Thorne has been promoted to Sergeant in The Civic Guard. · and 2 more like it"** | PC-5, PC-8 | pressing the row's count opens the three in place, each its own link to the faction its promotion names (each alert's own `factionId` target); the pill counts the burst as one row |
| News, the mandate milestone fallback (no authored prose for the transition) | **"Mandate "The Builder's Legacy" enters its next stage."** (was "… crosses into escalation.") | PC-3, PC-6, PC-8 | a plain row with no press: a `mandate_progress` alert carries no navigation target (`deriveNavigationTarget`, `notificationRouter.ts:17-63`, gives none), and § F5 renders an alert without a target as a non-button row, as for the authored-prose line. The stage is named in the Mandate dialog, one press away on the god rail's Mandate row |
| Folded rows | **"Reaches · Veil · Thinning"**, **"Mandate · Kindling"**, **"Covenants · 1 held"**, **"Signatures · 2 yours"**, **"Hooks · 3 on you"** | PC-1, PC-6 | each label keeps its existing tooltip (`ui.reaches`, `ui.covenant`, `ui.signatures`, `ui.hooks`); the Reaches tier word keeps its `reachTierTooltipId` tooltip and rung marker, and the Mandate word is `MANDATE_TREND_WORD`'s, word for word what the opened block shows |
| Ledger rail headers | **"Threads"**, **"Fold"**, **"Chronicle"** | PC-1 | `ui.ledger_fold`: **"Fold Threads and the Chronicle to a strip of icons and give the map more room. Press L."** · `ui.chronicle` (label "Chronicle"; its description is built at render from `CHRONICLE_TOOLTIP` in `frame-content.ts`, with `{now}` filled from `CHRONICLE_NOW_SEASONS` through `countWord`, so a retune cannot make it false): **"The story of the world so far, newest first. Now holds the last four seasons; Years keeps every year; Ledger lists your mortals' chapters."** |
| World-Soul line | **"World-Soul · Spirit moves through the world — prayers echo, and the veil grows thin. Tension rises beneath the surface."** (the sentence from `WORLD_SOUL_PROSE`, then the stage's mood line) | PC-1 | `ui.world_soul` (existing) |
| Chronicle tabs | **"Now"**, **"Years"**, **"Ledger · 2"**; voice toggle **"Both · Poet · Witness"** | PC-5 | `ui.chronicle_years`: **"Every year of the Chronicle, newest first."** |
| Years groups | **"Year 2 · 14 entries"** (one: **"Year 3 · 1 entry"**) | PC-3 | counted, foldable |
| Ledger tab | rows **"The Healer's Oath · Kael Thorne · resolved · won, at a price"** (from `resolvedStatusLabel`; a live chapter reads **"active · step 2"**, as the reader's index does) with **"new"**; button **"Open the Chapter Ledger"** | PC-6 | `ui.chapter_ledger`: **"Every chapter your threaded mortals have lived, readable at any time. Time stops while you read it."** |
| Strip | tooltips **"Threads · 1 chapter waits"** / **"Threads · 2 chapters wait"**, **"Chronicle · 1 new"** / **"Chronicle · 3 new"**, **"Chapter Ledger · 1 new chapter"** / **"Chapter Ledger · 2 new chapters"**, **"Unfold the rail · L"** | PC-1, PC-3, PC-6 | the word lives in the tooltip (THR-1834 § 5). The Threads count is the thread pip's own predicate ("A chapter waits", a pending encounter on that mortal's row), so the strip and the rows say one thing; it never borrows Needs you's "waiting on you", which covers a different set |
| Thread pip | **"A chapter waits"** | PC-6 | `ui.thread_priority_pip` desc unchanged |
| Opening reveal toast | **"New beside the map: your Reaches, the World-Soul and Omens."** | PC-4 | — |

### Playtest signal

- A tester who commits a card or a chapter and then is offered a gift can say where the gift waited ("it was in Needs you").
- No tester reports "a popup I never saw" or "news that vanished" while Needs you held it.
- No tester at 1920×1080 reports the top bar running onto two lines or a button cut off. No tester at 2560×1440 calls the rails' text small.
- A tester can change the game's speed without looking for it (round 3's speed complaint does not recur).

### Event notifications

None new. Needs you **presents** the existing alert channel, beat offer, receipts and holds, and produces nothing. The avatar-arrival toast retires (§ F4). No chronicle line is written.

### Debug inspection (DebugPanel)

- **`window.__DEBUG.getFrameState(): Promise<DebugFrameState>`** (new; shape under § Tracing): what each list rendered, the top bar's height, row count and overflow, Needs-you counts, capacity and folds, the hand's fit mode, the Ledger fold and its reason, strip counts, and the measured map share. Each slice adds its part.
- **`window.__DEBUG.getView('needsYou' | 'godRail' | 'ledgerRail')`** (THR-1822's accessor): the VMs as data.
- **Dev-only lever `window.__DEBUG.pushNeedsYouFixture({ news?: number; burst?: number; heldPopup?: boolean })`**: `news` pushes that many alert items, each stamped with a **distinct tick** (the current tick minus its index, inside the keep window), so § F5's burst coalescing keeps them as separate rows. `burst` pushes that many alerts of one `AlertIcon` at **one** tick, for the coalesced-row check. `heldPopup` queues one popup so it is held behind any open interrupt. Fixture lines name real nodes of the world. It is used for the fold, burst and held checks, and guarded by `import.meta.env.DEV` like the other levers.
- **Dev-only lever `window.__DEBUG.setFrameFixture({ revealAll?: boolean; omenName?: string; heldBy?: string } | null)`**: for the one-row check's worst state only. `revealAll` forces every first-screen gate (THR-1648, including `rivals` and `omens`, which "Show every panel" does not lift) and every opening row true. `omenName` gives the Omen item a display-only name. `heldBy` gives the time status line a display-only holder name. All three are renderer overrides held in `GameScreenState`'s debug slot; `GameState` is never touched. `null` clears them.
- Existing levers reused: `__DEBUG.grantAction(id)` / `listLockedActions()` (fill the hand past capacity), `__DEBUG.fireBeat(id)` (a beat offer), `__DEBUG.getClockHold()`, `__DEBUG.getInterruptState()`, `__DEBUG.getLayoutContract()` (THR-1819), `__DEBUG.getEscapeLayers()` (THR-1884).

### Visual presence (HexMapV2)

No layer or signifier changes. The canvas widens at 1080p (1200 → 1260 px with both rails; 1544 px folded), and its right edge moves when the Ledger rail folds; THR-1878's map chrome anchors to the map region. Centring on the named pause's hex uses `handleCenterOnHex`.

### UI Laws engaged

**1** (concepts carry image, tooltip, link: hand rows, Waiting rows, the god's name), **9/10** (one carved icon per concept, registry-checked), **11/12** (icon sizes; the strip's word in its tooltip; top-bar icons always labelled), **13/14** (no magnitudes: counts and pool balances only; "Tick Speed" goes; elapsed words, never ticks or days), **17** (every new term has a tooltip), **21** (names link: News rows, the god's name, Ledger rows), **23** (Esc closes the list and the flyout), **25** (Needs you, empty groups, Years, an empty strip count do not render; the hand press does something), **33** (one viewport at both screens), **35** (zones and bands from `zBands.ts`), **36** (counted, foldable groups), **40** (opening the list or the Ledger tab never clears before it shows), **45/46** (contrast; ≥ 24 px hit areas, the strip and fold row included), **47** (presses answer within `--anim-fast`), **49** (no silent drop: fold rows, the counted alert cap), **50** (focus into the list and back), **51** (fold state, open rows, hand group, tab and voice remembered), **52** (speed in persistent chrome; every pause named, the arrival included), **53** (the map-share floors), **57** (the list fills to its limit, the hand grows then groups, the Chronicle loses its 320 px box), **58** (four lists, named tests, plain fallbacks, `extending.md` rows).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `src/data/frame-registry.ts` (slices 1–3) | none | `GameViewTopBar`, `GodRail`, `LedgerRail` | none | none | `getFrameState()` |
| `src/data/frame-content.ts` | none | the three frame hosts, the Needs-you list | none | none | — |
| `views/ledgerRail.ts` (slice 1) | none (lazy on `worldVersion`) | `LedgerRail`, strip | reads `chronicleEntries`, `worldSoul.aggregate`, `doomClock.currentStage`, `clock`, chapter records | THR-1822 `view_fallback` | `getView('ledgerRail')` |
| `views/godRail.ts` (slice 2) | none | `GodRail` | reads the god's node, essence pools, `unlockedActionIds`, mandate, reaches, covenants, hooks | `view_fallback` | `getView('godRail')` |
| `views/needsYou.ts` + `views/interruptRegistry.ts` (slice 3) | none | `NeedsYouPill`, `NeedsYouList` | reads the pending beat and the unacknowledged receipts; sources passed in (interrupt snapshot, alerts, named pause) | `view_fallback` | `getView('needsYou')`, `getFrameState().needsYou` |
| `notificationRouter.ts` age trim (slice 3) | none (called per routed batch from `useNotifications`) | — | none (`NotificationState.alertsTrimmedAtCap`, React state) | none (counted, dev warn once) | `getFrameState().needsYou.trimmedAtCap` |
| `GameScreenState.frame.*` (slices 1, 3) | none | the three hosts; `SimulationControls` (named pause) | none (React context) | none | `getFrameState()` |
| `useTopBarHotkeys` `N` / `L` | none | — | none | none | `getFrameState()` before and after a key press |

Player controls added: `N`, `L`, the speed stepper (in the top bar), the Ledger fold, strip items, the flyout, folded rows, hand groups, Chronicle tabs, the voice toggle. Prose pipeline: not involved (no enrichment tokens; the World-Soul sentence already renders through `renderProseWithIPK`).

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `TOP_BAR_CENTRE_MIN_REM` | 15 (240 px at 1080p) | The Find slot's minimum; shrinks first (THR-1828, THR-1832) |
| `TOPBAR_TIME_STATUS_MAX_REM` | 17.5 (280 px) | Where the time status line ellipsizes |
| `TOPBAR_TIME_STATUS_MIN_REM` | 12.5 (200 px) | The status line's width after yield step 2 |
| `TOPBAR_DOOM_MAX_REM` | 15 (240 px) | Where the doom stage name ellipsizes before yield step 3 moves it into the tooltip |
| `TOPBAR_DIRECTION_MAX_REM` | 22 (352 px) | The opening direction line's column; it wraps to two lines inside it |
| `TOP_BAR_YIELD_ORDER` | `['centre', 'time_status', 'doom_name', 'omen_name', 'direction_short']` | What gives way, in order, when the bar would overflow (§ F3) |
| `TOP_BAR_YIELD_HYSTERESIS_PX` | 16 | Room needed beyond the exact fit before a yield step undoes |
| `TOP_BAR_FIT_FIXTURE_HOLDER_CH` | 40 | Length of the held-clock holder name the one-row check uses |
| `OPENING_DIRECTION_CHAPTER_WAITING_SHORT` / `OPENING_DIRECTION_LET_TIME_RUN_SHORT` | "{firstName}'s chapter is waiting →" / "Let time run for {firstName}" | THR-1837's direction line at yield step 5 (beside the full strings in `ui-content.ts:30-31`) |
| `TOPBAR_INERT_OPACITY` | 0.4 (existing) | Guarded items while an encounter is open |
| `NEEDS_YOU_LIST_W_REM` | 30 (480 / 540 px) | The list's width (its fixed limit) |
| `NEEDS_YOU_LIST_MAX_VH` | 60 | The list's height limit (THR-1828) |
| `NEEDS_YOU_ROW_H_REM` | 2.5 (40 / 45 px) | One row; the capacity unit |
| `NEEDS_YOU_GROUP_HEAD_H_REM` | 2 (32 / 36 px) | One group header |
| `NEEDS_YOU_LIST_PAD_REM` | 0.75 | The list's top and bottom padding |
| `NEEDS_YOU_NEWS_KEEP_DAYS` | 3 (THR-1822 `viewConstants.ts`) | News rows lapse after this many attention days (`× TICKS_PER_DAY` = 36 ticks) |
| `NEEDS_YOU_HELD_CONNECTOR` | `{ default: ' about ', EventPopup: ': ', ThreadingRite: ' for ' }` | Joins a held row's noun to its subject |
| `ALERT_SAFETY_CAP` | 100 | The alert channel's count cap; hitting it is counted and warned |
| `GIFT_PILL_Z` | 62 (existing) | The raised pill above a player surface (THR-1809) |
| `HAND_FIT_HYSTERESIS_PX` | 24 | Stops the hand flipping between whole and grouped |
| `HAND_REST_OPACITY` | 0.45 | The hand's rows while a moment is open |
| `GOD_RAIL_SUMMARY_MAX_CH` | 24 | The longest folded-row summary; the longest real Reaches case is "Eye · Before It Happens" (23) |
| `LEDGER_CHRONICLE_MIN_REM` | 12 | Height Threads leaves for the Chronicle before Threads folds |
| `CHRONICLE_NOW_SEASONS` | 4 | The Now tab's window, in seasons (one rolling year) |
| `WORLD_MOOD_LINES` | 5 stages × 3 lines (moved, unchanged) | The Chronicle header's mood sentence |
| Storage keys `LEDGER_FOLDED_KEY`, `GOD_RAIL_OPEN_ROWS_KEY`, `GOD_RAIL_HAND_GROUP_KEY`, `CHRONICLE_TAB_KEY`, `CHRONICLE_VOICE_KEY` | `threadbare.ui.frame.ledgerFolded`, `threadbare.ui.godRail.openRows`, `threadbare.ui.godRail.handGroup`, `threadbare.ui.chronicle.tab`, `threadbare.ui.chronicle.voice` | Law 51 preferences, the `threadbare.ui.*` family |
| `LEDGER_RAIL_HOTKEY` / Needs-you hotkey | `l` / `n` | § F10 |

Frame geometry (`--topbar-height`, `--rail-left-w`, `--rail-right-w`, `--rail-strip-w`, `--inspector-w`) and the two map-share floors are THR-1819's tokens; this plan consumes them and adds none.

## Tracing

No game event is emitted, so no new trace type. Inspectability is the debug accessor, the VMs through `getView`, and THR-1822's existing `view_fallback` trace when a VM build throws. The alert cap is counted, not traced, because the router runs outside the tick.

```ts
// Not a trace — the debug accessor's return shape (src/debug-bridge.d.ts).
interface DebugFrameState {
  topBar: {
    items: { id: string; rendered: boolean; guarded: boolean }[];
    heightPx: number;          // measured [data-testid="game-topbar"] height; must equal --topbar-height
    rows: number;              // 1, or a defect
    overflowPx: number;        // scrollWidth − clientWidth of the bar; 0 or a defect
    yielded: ('centre' | 'time_status' | 'doom_name' | 'omen_name' | 'direction_short')[];  // § F3 yield steps applied, in order
  };
  needsYou: {
    count: number;
    groups: { waiting: number; held: number; news: number };
    open: boolean;
    capacityRows: number;      // from the § F4 formula at this viewport
    foldedRows: number;
    raised: boolean;           // the THR-1809 raise is active
    trimmedAtCap: number;      // NotificationState.alertsTrimmedAtCap
  };
  godRail: {
    sections: { id: string; rendered: boolean; open: boolean }[];
    hand: { cards: number; mode: 'whole' | 'grouped'; openGroup: string | null; armedCardId: string | null; rest: 'encounter' | 'moment' | null; freeHeightPx: number };
  };
  ledgerRail: {
    state: 'open' | 'strip' | 'hidden';
    folded: boolean;
    foldedBy: 'player' | 'inspector' | 'stage' | null;
    flyout: 'threads' | 'chronicle' | null;
    tab: 'now' | 'years' | 'ledger';
    tabsRendered: string[];
    strip: { id: string; count: number }[];
  };
  mapShare: number;            // measured map rect area / viewport area
  namedPause: { line: string } | null;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A VM build throws (any of the three) | THR-1822's `readView` returns the selector's typed fallback (empty groups; the rail shows its pinned sections from the last good read) and traces once per key; the tick never sees it |
| An alert's icon is outside `AlertIcon` (data from a producer) | the registry's `fallback` shape with the message; dev warn once |
| A held surface has no holder name | "Something waits"; the holder-name coverage test fails the build first |
| A beat has no authored title | the holder name "A beat of your story", never a humanized id |
| A News row's navigation target no longer resolves | the row renders as plain text (not a button) and still lapses (THR-1821's identity-chip rule) |
| The alert channel passes `ALERT_SAFETY_CAP` | oldest trimmed, counted on `alertsTrimmedAtCap`, dev warn once, shown in `getFrameState()` |
| `ResizeObserver` is absent (old browser, jsdom) | the hand stays in whole mode; the rail region scrolls inside itself, the page does not |
| A card's price check cannot be computed | the row shows its name and sphere and stays pressable (the press opens the Codex entry or arms; arming refuses with its own reason) |
| A frame entry's reveal surface is missing at runtime (bad merge) | shown (`opening.show[id] ?? true`, today's rule); the cross-list test fails the build first |
| Local storage throws (private browsing) | defaults: rail open, rows closed, Now tab, voice Both; the choice holds for the session |
| The Inspector input or the arming state is absent (THR-1876 not built) | the rail follows the player's fold; no armed row; the press opens the Codex entry |
| The top bar overflows at an unsupported width (< 1920) | `base` tier keeps today's behaviour; the one-row check is asserted only at 1920 and 2560 |
| The top bar still overflows at 1920 or 2560 after all five yield steps (a player's enlarged browser font, which THR-1819 honours; a longer name than any fixture) | the bar wraps to a second row rather than hide a control or its word; `getFrameState().topBar.rows` reports 2 and a dev warning names the widest item. At default settings this is a defect (§ Kill criteria), and the browser check fails on it |
| The avatar arrival has no hex | the named pause still names the line; "Show" is not rendered (Law 25) |

## Three-pillar check

- [x] Engine pillar present — three VMs, the registry move, the router's age trim; no state, graph or tick change
- [x] Content pillar present — UI copy only, every string quoted
- [x] UI pillar present — the whole frame
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves "the map is the table" (THR-1823 direction B): the map's share is a tested floor at both screens and rises at 1080p. It serves "one story at a time, not a dashboard" (`01-core-loop.md`): World Pulse's counts go, Needs you renders only when something waits, and moments queue named behind the one on screen.
- [x] No Vision premise is contradicted, and no Vision edit is owed. The taste profile's label and face entries already carry today's rulings: `Vision/taste-profile.md:107-110` reads "Small labels in bold sentence case, never letter-spaced capitals (Christian, chat 2026-10-14, confirming THR-1833 …)", and `:228-235` carries the three-face roles ("Updated 2026-10-14"). The frame applies exactly those rules. (The first intent-judge pass read the file before that edit landed, and asked for an owner. The owner question is now moot, and the comment on THR-1879 is withdrawn.)
- [x] **Gold, the taste profile's "one gold emphasis per panel"** (`taste-profile.md:95-103`): in the frame, gold marks only the god's attention and the armed card. That means the Needs-you pill (THR-1821's gold count chip, reserved for the god's attention), the armed hand row's selected state, and THR-1837's transient reveal ring. Strip counts, tab counts, folded-row summaries and News rows are neutral. The top bar has at most one gold element at rest (the pill), and the god rail has at most one (the armed row).

## Rulebook impact

- [x] This plan does not change a rule of play. Time, attention, essence, casting and encounters work as before. Avatar arrival still pauses; it is now named.
- [x] `Docs/canon/rulebook.md`: two location words ("the ascendant bar", `:149, :157`) follow the UL's word for the left rail once THR-1882 rules (§ F13). The drawer lines are THR-1876's.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1875-screen-frame-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every width, cap, row height, window and key is a named constant or a THR-1819 token (§ Constants table); the frame's composition is data in `frame-registry.ts`, so reordering or adding an item is one entry |
| 2. Inspectability | PASS with note | No game traces (presentation); `getFrameState()`, the three VMs through `getView`, the counted alert cap and THR-1822's `view_fallback` make every frame decision visible |
| 3. Determinism | PASS | No randomness; the mood line moves from a per-tick flicker to a per-season pick; sorts and fold orders are fixed |
| 4. Fail-soft | PASS | § Fail-soft table; VMs fall back through `readView`; unknown kinds render plain fallbacks; nothing in the frame can stop the tick |
| 5. Narrative over mechanical perfection | PASS | The World-Soul and mood lines head the Chronicle in the story face; counts the god does not act on (agents, cultures) leave the screen |
| 6. Additive over destructive | PASS with note | Additive VMs, lists and one `NotificationState` field. Deleted: World Pulse, `countLivingMortals`, `AlertBar`, four unused tooltip ids, the offer pill as a separate surface, `ALERT_MAX_VISIBLE`, the arrival toast, the `world_pulse` reveal row. Each deletion has a named new home (§ F9); keeping both would tell one fact twice (PC-6) |
| 7. Performance budget | PASS with note | VMs rebuild lazily on `worldVersion`, never per tick while paused; the hand's fit uses one `ResizeObserver`; capacity is arithmetic. The widest builds are the Years grouping (every Chronicle entry) and the hand (every revealed card priced). Each VM's heavy-project test builds it on the seed-42 medium world and logs its build time beside THR-1822's measured 0.59 ms Find pass. That is a reading, not a gate (profile before optimizing) |

## Kill criteria

- **The top bar still overflows at 1920 at default settings after all five yield steps, measured with the shipped fonts.** First lower `TOPBAR_TIME_STATUS_MIN_REM`. Then step the right group's labelled buttons down from `md` to `sm` (less padding, the same word). If it still overflows, re-open THR-1828's frame decision with Christian. A dropped word label (THR-1834) or a second row (§ F11) would each break a settled rule, so neither is a fix the build may take on its own.
- **Testers miss offers that used to float at the top centre.** Add a one-time gold ring on the pill when a Waiting row appears (`NEWLY_REVEALED_STYLE`, the THR-1837 pattern). Do not restore the floating pill (PC-6).
- **A real hand groups at 1080p so often that the armed card hides.** That is THR-1828's "would change the call": take THR-1827's strip fallback for the hand at 1080p only. The fit rule's measurement in `getFrameState().godRail.hand` is the evidence.
- **News lapses before players read it.** Raise `NEEDS_YOU_NEWS_KEEP_DAYS`. It is one number, shared by the router and the VM.
- **The flyout over the Inspector confuses.** Replace it with "a strip press closes the Inspector and unfolds the rail". The escape order loses one layer.

## Done when

**Every slice:** `npm run gate` green (code track: `npm test`, `npm run check:typecheck`, `npx vite build`, both freshness gates, and `check:ui-debt` with no row going up); the VM's Node tests pass the shared `viewContract.ts` checks; its `extending.md` row (§ F2) and `ia-manifest.ts` + `public/interface-reference.html` updates (§ F9) land in the slice's PR; DoD docs (status fragment, `project-history.md`, `changelog.md`, Linear completion comment); the closing commit body carries the slice ticket's close keyword alone on its own line. **Browser-verify, Playwright, on `?view=game&seeded&size=medium`, at 1920×1080 and at 2560×1440** (with `innerWidth`/`innerHeight` read back in the same `browser_evaluate`; record a `Browser-verify substitution:` line if the window cannot reach 1200 px of inner height): (1) screenshots at both sizes; (2) console output, clean; (3) the `window.__DEBUG.*` assertions listed per slice; (4) a UI-Laws judgment line naming Laws 1, 13/14, 17, 21, 25, 33, 37, 53, **57** and **58**.

**Slice 1 — the Ledger rail ([THR-1893](https://linear.app/threadbare/issue/THR-1893)):**
- [ ] `WorldPulse.tsx`, `worldPulseCount.ts`, the four `ui.world_pulse_*` ids and the `world_pulse` reveal row are gone; `grep -rn "WorldPulse\|world_pulse\|countLivingMortals" src` returns nothing.
- [ ] The top bar's Time slot carries the speed stepper over `SPEED_STEPS`, with the moved aria labels; `+`/`-` still step it; `ui.sim_speed` reads "Speed".
- [ ] World-Soul renders only in the Chronicle header; the mood line is stable within a season (a test across 90 ticks of one season sees one line).
- [ ] *Now · Years · Ledger* use THR-1885's `Tabs`; Years renders only when entries span two calendar years; the Ledger tab marks rows "new" and sets the seen count only after showing them; its rows equal the reader's (`selectThreadedChapters`); the voice and tab choices persist across a reload.
- [ ] The Chronicle has no `maxHeight: '320px'`; at 1920×1080 its entry region's bottom meets the rail's bottom.
- [ ] `frameCountWords.test.ts` renders the strip counts and the Years header at n = 1 and n = 2 ("Threads · 1 chapter waits" / "2 chapters wait"; "Year 3 · 1 entry" / "14 entries"), and `ui.chronicle`'s description follows `CHRONICLE_NOW_SEASONS` (a test changes the constant and reads the new words).
- [ ] `frame-registry.ts` holds `LEDGER_RAIL_SECTIONS` and `LEDGER_TABS`; `frameRegistry.test.ts` passes checks 1, 2 and 4, with check 2's `NOT_YET_LISTED` naming THR-1894 and THR-1875 for the rest; `L` is in `TOP_BAR_KEYS` through `FRAME_HOTKEYS`, and the key-overlap test passes (check 3).
- [ ] `getFrameState().ledgerRail`: `L` folds and unfolds (`folded`, `foldedBy: 'player'`), the choice persists; with `GameScreenState` `inspector.open` forced true by test, `foldedBy: 'inspector'`; a strip press then opens the flyout and Esc closes it (`getEscapeLayers()` before and after); the strip width is 56 px at both sizes.
- [ ] `getFrameState().mapShare` ≥ 0.60 with both rails at both sizes, ≥ 0.76 folded at 1920×1080.
**Slice 2 — the god rail ([THR-1894](https://linear.app/threadbare/issue/THR-1894)):**
- [ ] Attention renders under essence and nowhere in the top bar; `GOD_RAIL_SECTIONS` drives the rail; `frameRegistry.test.ts` passes with the god-rail part of `NOT_YET_LISTED` removed.
- [ ] `ascendant-bar/*` and the new god-rail files carry no literal font size and no `uppercase`; `check:ui-debt` shows `literal-font-size` and `uppercase` down by at least those files' baseline counts.
- [ ] The hand lists Move, Investiture (once revealed) and every revealed ascendant-castable card; with `__DEBUG.grantAction` raising the hand past capacity, `getFrameState().godRail.hand.mode` is `'grouped'` at 1920×1080, and with eight or fewer cards it is `'whole'` at 1920×1080; at 2560×1440 eleven cards stay `'whole'`; no hand row has `scrollWidth > clientWidth` at 320 px.
- [ ] `godRail.test.ts`: a hand row's price equals `dominionScaledEssenceCost(…, undefined)` (par); a card whose sovereign price the pool can pay but whose par price it cannot stays pressable; one the pool cannot pay even at sovereign dims with "Not enough {sphere word} essence"; `ui.hand_price`'s description quotes `DOMINION_CAST_CLAUSE`'s sovereign and hostile lines verbatim and opens with the Foreign band's own words, and adds "A rarer target costs more." only for the two tier-scaled cards. Further cases: `divine.self.stillness` renders "Free" (no pool) and is always payable; `divine.self.focus` renders "{primary sphere word} · 5 essence", sorts and groups under the primary sphere, and its reason names the primary pool; the Codex entry and the row produce the same label from `essencePriceLabel` for costs 0 and 2.
- [ ] Pressing a card opens its Codex entry (the default provider); with a test provider, the armed card's group stays open and the row shows the selected state.
- [ ] With the Chapter Ledger open (an interrupt), `hand.rest === 'moment'` and a card press does nothing; the rest line reads as quoted.
- [ ] Folded rows open in place, persist across a reload, and Covenants, Signatures and Hooks are absent when empty; every summary is ≤ `GOD_RAIL_SUMMARY_MAX_CH`, checked by a unit test that runs every reach label × every tier word in `ASCENDANT_REACH_REGISTER` (longest today: "Eye · Before It Happens") and every `MANDATE_TREND_WORD`; a summary past the cap falls back to the tier word alone.

**Slice 3 — the top bar and Needs you (THR-1875):**
- [ ] `TOP_BAR_ITEMS` drives the bar; `frameRegistry.test.ts` passes checks 1, 2 and 4 with `NOT_YET_LISTED` deleted; `N` reaches `TOP_BAR_KEYS` through `FRAME_HOTKEYS`, and the key-overlap test (THR-1878's, or the one slice 1 created) passes with the frame, map, lens and time keys.
- [ ] **One row:** at 1920×1080 and 2560×1440, `getFrameState().topBar` reports `rows: 1`, `overflowPx: 0` and `heightPx` equal to `--topbar-height` (48 / 56) in three states: (a) every item revealed with the clock held by a fixture holder name of `TOP_BAR_FIT_FIXTURE_HOLDER_CH` characters; (b) the opening state with the direction line up (`?view=game&firstunmet&size=medium`, after the bond, before the first chapter resolves); (c) **the worst reachable state**: (b) with `__DEBUG.setFrameFixture({ revealAll: true, omenName: <the longest omen name in the omen templates>, heldBy: <a TOP_BAR_FIT_FIXTURE_HOLDER_CH-character name> })`, so every item is revealed while the direction line is still up, Rivals and Omen included ("Show every panel" alone does not lift their THR-1648 gates), plus the Needs-you pill showing (`pushNeedsYouFixture({ news: 1 })`). The check first asserts that `getFrameState().topBar.items` reports every entry of `TOP_BAR_ITEMS` as `rendered: true` (nine entries; ten once THR-1876 adds `find`). Only then does it read `yielded`, which at 1920 lists the steps applied in `TOP_BAR_YIELD_ORDER` order, and it checks that every control still shows its word label. A `topBarFit.test.tsx` unit test drives the yield order with stubbed widths, including undoing it in reverse.
- [ ] `frameCountWords.test.ts` covers the pill's label ("1 thing needs you" / "2 things need you"), and `ui.needs_you_news`'s description follows `NEEDS_YOU_NEWS_KEEP_DAYS`.
- [ ] `needsYou.test.ts`: `count` equals the rows; every group has a producer; every `AlertIcon` has a news icon; every `INTERRUPT_SURFACES` id yields a named held line; a beat with no title never shows its id; News lapses at `NEEDS_YOU_NEWS_KEEP_DAYS × TICKS_PER_DAY`; capacity is 13 at 1080 px and 16 at 1440 px of height with three groups.
- [ ] Browser: with `__DEBUG.pushNeedsYouFixture({ news: 20 })` (20 distinct ticks) the pill shows **20**, the open list shows `capacityRows − 1` rows and one "and N more" row at each size, and opening the list leaves the count at 20 (Law 40); with `pushNeedsYouFixture({ burst: 5 })` on a fresh load the pill shows **1** and the one News row ends "· and 4 more like it" and opens to five rows; pressing a News row routes and removes one row; with the Chapter Ledger open and `heldPopup: true`, Held lists "A message: …" with "after this" and the Waiting and News rows are guarded; `N` opens and closes the list; Esc closes it and focus returns to the pill.
- [ ] `__DEBUG.fireBeat(<pool beat>)` shows a Waiting row with the beat's title, and there is no fixed-position offer pill in the DOM (`[data-testid="beat-offer-banner"]` is absent); the THR-1805/1809 tests are rewritten against the row and the raised pill, and the raise renders the pill above an open player dialog.
- [ ] An avatar arrival names the pause in the time slot and lists a "Show" row that centres the map; running the clock clears both; no arrival toast.
- [ ] The router trims by age; `ALERT_MAX_VISIBLE` is gone; a unit test drives 101 alerts within the window and sees `alertsTrimmedAtCap: 1`. A test drives the mandate milestone fallback for every `MandateStage` and finds no stage id in the News row; a second test routes three same-icon alerts in one tick and sees all three kept (no overwrite), one repeated `sourceEventId` kept once, and the VM's single News row reading "… · and 2 more like it", which opens to three rows.
- [ ] `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` carry the alert-channel and registry rows (§ Interface impact).
- [ ] `getFrameState().mapShare` meets both floors at both sizes (THR-1876's Inspector rows checked once it lands; until then by `mapShare()` with its tokens, as THR-1819's budget test already does).

## Coordination block

**Suggested model:** opus — the top bar's one-row fit and the Needs-you guard and raise interact with THR-1805/1809/1814's tested behaviour in a hot surface, and the slice moves the interrupt registry into the engine; the judgment is in keeping every existing guarantee while re-homing it.

**Parallel-safe with:** THR-1820's build (dialog tiers; the Chapter Ledger reader's size is its, the Ledger tab only opens it). THR-1886 (action catalog; the hand reads `isActionRevealed`, not the catalog). THR-1874, THR-1848 (single files outside the frame).

**Mutex with:**
- **THR-1893 and THR-1894 (slices 1 and 2) — this slice is blocked by both**: all three edit `GameViewTopBar.tsx`, `src/data/frame-registry.ts`, `frame-content.ts`, `ui-content.ts`, `opening-reveal-table.ts`, `ia-manifest.ts` and `public/interface-reference.html`. Slices 1 and 2 are mutex with each other on `GameViewTopBar.tsx` (one-datum edits each) and those shared files: build in either order and rebase, never in parallel lanes.
- **THR-1876 (the Inspector)**: both edit `GameScreenState` (frame fields vs `inspector.*` / `arming.*`), `TOP_BAR_ITEMS` and `topBarComponents.tsx` (THR-1876 adds `find`), `useTopBarHotkeys.ts` (`N`/`L` vs Ctrl+K, `/`, `W`), `ia-manifest.ts` and `public/interface-reference.html`, and possibly `ascendant-bar/selectors.ts` → `views/subjects/godSheet.ts` (whichever lands first moves it; § F12). Serialize on those files, not on the tickets.
- **THR-1877 (the Stage)**: both touch `views/interruptRegistry.ts` (this slice moves it; THR-1877 owns the hold rule in `collectHeldMoments`) and the hand's rest line (`frame-content.ts`). Land this slice first; THR-1877 then extends the moved file.
- **THR-1879's build (type and icons)**: blocks every frame slice (the registry must hold the frame's concepts, listed under Notes); also edits `ui-content.ts` and the label styles. Check `In Dev` at claim.
- **THR-1878 (map lenses and chrome)**: its camera slice and frame slices 1 (`L`) and 3 (`N`) all edit `useTopBarHotkeys.ts` and the `TOP_BAR_KEYS` array and overlap test (§ F2 check 3). Whichever lands first creates the array and the test; the others extend them. Serialize on that file.
- **THR-1880**: moves Settings into a dialog home; the top bar's `settings` entry only calls the opener, so rebase whichever lands second.
- **THR-1896**: lands after this slice (it edits `ui.needs_you_news`).
- **THR-1813's build** writes lines into the "Before you woke" group that slice 1 keeps pinned in Now; if its PR edits `ChroniclePanel.tsx` (slice 1's file), serialize the two.

**Blocked by:** THR-1893, THR-1894, THR-1822, THR-1881, THR-1884, THR-1885, and THR-1879's build.

**Files to touch:** slice 3's below; slices 1 and 2 list theirs under § Notes for the executor.
- Create: `src/engine/views/needsYou.ts`, `src/engine/views/interruptRegistry.ts` (moved), `src/engine/views/__tests__/needsYou.test.ts`, `src/components/Game/frame/topBarComponents.tsx`, `src/components/Game/frame/NeedsYouPill.tsx`, `src/components/Game/frame/NeedsYouList.tsx`, `src/components/Game/frame/__tests__/topBarFit.test.tsx`
- Edit: `src/data/frame-registry.ts` (`TOP_BAR_ITEMS`), `src/data/frame-content.ts`, `src/data/__tests__/frameRegistry.test.ts`, `src/components/Game/GameView/GameViewTopBar.tsx`, `src/components/Game/SimulationControls.tsx` (named pause), `src/components/Game/hooks/useTopBarHotkeys.ts`, `src/components/Game/interruptRegistry.ts` (re-export), `src/engine/notificationRouter.ts`, `src/types/notification.ts`, `src/components/Game/AscendantBeatModal.tsx` (pill retires; modal stays), the GameView composition root (arrival, offer, `GameScreenState` fields), `src/components/Game/__tests__/giftWaitsPill.test.tsx` and the THR-1809 tests, `src/data/ui-content.ts`, `src/debug-bridge.ts` / `.d.ts`, `src/data/ia-manifest.ts`, `public/interface-reference.html`, `Docs/design-system/extending.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/plans/wiring-checklist.md` (its "Central Interrupt Auto-Pause" row names the registry's old path and tests; point it at `src/engine/views/interruptRegistry.ts`)
- Edit (engine): `src/engine/phaseMandate.ts` (the two fallback lines, § F5); `src/engine/unifiedActionResolution.ts` (drop the "⊘ " glyph from the severe-complication alert message, § F5)
- Delete: `src/components/Game/AlertBar.tsx`, `src/components/Game/__tests__/AlertBar-actorId.test.tsx`

## Notes for the executor

- **Concepts the icon registry must hold (THR-1879 fills them; the frame never vendors a shape):** pause, play, faster, slower (THR-1834: `pause-button`, `play-button`, `fast-forward-button`; slower is the executor's pick from the family), needs-you (`ringing-bell`), find (`magnifying-glass`, THR-1876's), doom (`sands-of-time`), omen (`crystal-ball`), rivals (`duel`), notables (`crown`), read-the-threads (`sewing-string`), settings (`cog`), close (`cancel`), disclosure (fold / unfold), threads, chronicle, chapter-ledger (strip; one shape each, distinct from read-the-threads), move, investiture, the three Needs-you groups, and one news icon per `AlertIcon` (12). Post this list on THR-1879 if its registry PR lacks any.
- **Slice 1 files:** create `src/engine/views/ledgerRail.ts` + test, `src/data/frame-registry.ts`, `src/data/frame-content.ts`, `src/data/__tests__/frameRegistry.test.ts`, `frame/ledgerComponents.tsx`, `frame/LedgerStrip.tsx`; edit `frame/LedgerRail.tsx`, `ChroniclePanel.tsx`, `ChapterLedger.tsx` (`selectThreadedChapters`), `SimulationControls.tsx` (stepper in the compact tier), `GameViewTopBar.tsx` (World-Soul out), `opening-reveal-table.ts`, `ui-content.ts`, `useTopBarHotkeys.ts` (`L` joins `TOP_BAR_KEYS` through `FRAME_HOTKEYS`; § F2 check 3), `openingReveal.test.ts`, `lairMonsterF1.test.tsx`; delete `WorldPulse.tsx`, `worldPulseCount.ts`, `WorldSoulIndicator.tsx` (after its banding moves).
- **Slice 2 files:** create `src/engine/views/godRail.ts` + test, `frame/godRailComponents.tsx`, `frame/HandSection.tsx`, `frame/HandPressContext.tsx`; edit `frame/GodRail.tsx`, the `ascendant-bar/*` blocks (or their moved successors), `AttentionPoolIndicator.tsx`, `GameViewTopBar.tsx` (Attention out), `frame-registry.ts`, `frame-content.ts`, `ui-content.ts`; move `ascendant-bar/selectors.ts` → `views/subjects/godSheet.ts` if THR-1876 has not; add `essencePriceLabel` beside `formatEssenceLabel` in `src/components/shared/formatEssence.ts` and point `codexRegistry.ts`'s `essenceCostLabel` at it.
- **Strings THR-1876 hands the hand when the drawer retires:** `ACTION_CARD_GLYPH_LEGEND` (`action-card-display.ts:142-152`) becomes the hand's first-contact legend if a hand row uses those glyphs (Law 12), else it is deleted; `ui.action_locked` goes, because the hand's reason line replaces it. Slice 2 makes that call when it lands after THR-1876's S3/S4.
- **Do not add a calendar day** to the date (THR-1747). Elapsed words come from `elapsedLabel`.
- **Do not make Needs you an interrupt or let it pause.** The named pause is not a registry entry (§ F4 explains why).
- **Do not cap News in the VM.** The surface folds (today's ruling). `NEEDS_YOU_NEWS_MAX` must not appear in `src/`.
- **Do not write "in the Chronicle"** in any Needs-you string until THR-1896 lands.
- **Do not hand-place a top-bar button, rail row or tab in JSX.** Add the entry; the renderer draws it. A reviewer treats a hand-placed one as a Law 58 failure.
- **The THR-1805/1809 gift behaviour is tested today** (`giftWaitsPill.test.tsx` and the delivery tests). Rewrite those tests against the Waiting row and the raised pill; keep every predicate they assert (held by a player surface → raised; never above an interrupt).
- **`?view=game&seeded` pre-bonds The First**, so every staged surface is shown. Check the opening state with `?view=game&firstunmet&size=medium` and the first chapter.
- **Before THR-1876**, the god's name still opens today's `AscendantSheet` and News rows still route as alerts did; do not build Inspector behaviour here.

## Intent-judge verdict

**Allow** (2026-10-14, opus, cold context, revision 10), impact class Reversible (confirmed). It took ten passes. Every pass before the last was **Revise**, with findings narrowing each round, all fixed inline; none needed Christian:

| Pass | Findings | What changed |
|---|---|---|
| 1 | 6 (dims 4, 5, 6, 12) | the top bar's worst reachable state measured (2,103 px) and the yield order added; the taste-profile edit given an owner (later found already done); "works" dropped; the rail's set named against UL Repertoire / Dealt Hand, header "Your cards", THR-1829's rest line replaced; Doom/Omen rows added; News de-duplication specified (append, then coalesce) |
| 2 | 5 (dims 3, 12) | keys adopt THR-1878's `TOP_BAR_KEYS` and its overlap test (mutex added); elapsed words as rendered; the News and Chronicle tooltips built from their constants; the strip's Threads count uses the pip's words; kill criterion 1 rewritten |
| 3 | 4 (dims 3, 4, 12) | identity block quoted with the god's own tooltips and THR-1713 D8's rule; Notables tooltip in THR-1860's words; fixtures stamp distinct ticks plus a `burst` option; `setFrameFixture` reaches the worst state |
| 4 | 4 (dims 3, 4, 12) | count strings get `{ one, other }` pairs and a test; the item count reads "every entry of `TOP_BAR_ITEMS`"; every part of today's `DoomBar` given a home; samples moved to real game data |
| 5–9 | 1 GAP each (dim 12) | the hand row's target words dropped (no source); the par price and the sovereign-price `payable` rule (Dominion pricing, THR-1750); `paySphere`, "Free" and the shared `essencePriceLabel`; real folded-row words ("Veil · Thinning", "Kindling"); real alert lines and their true click targets; the mandate fallback's raw stage id fixed at the producer |
| 10 | 0 | **Allow**; two advisory notes applied (the promotion line's real capital "The Civic Guard"; the "⊘ " glyph in severe-complication alerts dropped at the producer) |

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14 (run on revision 2; later revisions only tightened the UI pillar's wording and samples, and each auditor's notes are answered below)*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS-with-note | The constants table names caps, row heights, windows, keys and storage keys. Two literals sat outside it: the tooltip copy "after three days" (`ui.needs_you_news`) next to `NEEDS_YOU_NEWS_KEEP_DAYS`, and the mood formula `(year × 4 + season) mod 3`. |
| 2. Inspectability | PASS-with-note | Covered by `getFrameState()`, `getView()`, the counted `alertsTrimmedAtCap` and `view_fallback`. The named pause and age-lapsed News rows emit no trace. The checklist's "Central Interrupt Auto-Pause" row names the registry's old path and tests, and "Files to touch" did not list `wiring-checklist.md`. |
| 3. Determinism | PASS | "No random call anywhere in the frame." The mood line becomes a per-season pick, and the sort and fold orders are fixed. |
| 4. Fail-soft | PASS | A dedicated fail-soft table covers a throwing VM, an unknown `AlertIcon`, no `ResizeObserver`, throwing storage, a missing Inspector input and a bar that still overflows. |
| 5. Narrative over mechanical | PASS | The World-Soul and mood lines head the Chronicle in the story face, held rows are named by subject, and the Agents/Cultures counts go. |
| 6. Additive over destructive | PASS-with-note | § F9 retires 14 items; the router changes from overwriting same-tick alerts to appending them. Each retirement names a new home, and the registry keeps a re-export. |
| 7. Performance budget | PASS-with-note | The stated guard is lazy rebuilds on `worldVersion` and arithmetic capacity. No build-time budget or profiling target was given for the three VMs. |

NFP AUDIT: PASS-with-notes (see rows above)

*Author response: all four notes are fixed. The tooltip and the mood formula now read their constants (`NEEDS_YOU_NEWS_TOOLTIP` and `CHRONICLE_TOOLTIP` built at render; `SEASONS_PER_YEAR`, `lines.length`). `wiring-checklist.md` is in slice 3's files. NFP 7 gains a logged build-time reading on the seed-42 world. The named pause and News lapses stay untraced by design: they are presentation state outside the tick, read through `getFrameState()`.*

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | E1–E5 (now E6) define three view models, the interrupt-registry move with `collectHeldMoments`, and the router's age trim with `ALERT_SAFETY_CAP`; Graph, Tick phases and PRNG are an explicit "None" with reasons. |
| Content | present-and-substantive | UI copy only; new and changed `ui.*` ids, `frame-content.ts`, the moved `WORLD_MOOD_LINES`; every string quoted. |
| UI | present-and-substantive | F3–F14, Player-facing text with PC classes, Playtest signal, Event notifications, Debug inspection, Visual presence, UI Laws. |

No missing required sections. The Wiring table covers phase, UI component, GameState field, trace and debug for every module, plus player controls and the prose pipeline. Substrate check: present, extends / reuses / moves throughout, no green-field duplication; the attention pool was read but not named.

PILLAR AUDIT: PASS-with-notes — no stated importer counts (no Blast Radius line); the unnamed `attentionPool` reader.

*Author response: both fixed. A blast-radius line now states the widest importer counts (none ≥ 100), and the attention pool (and Dominion pricing) are rows in the substrate table.*

### Vision audit

**Vision premises touched:**
- `00-north-star.md` → "one complex story at a time" confirmed; "two clocks … not the player's to pause" silent.
- `01-core-loop.md` → the dashboard guard and "time halts for every moment" confirmed.
- `02-non-negotiables.md` → god-not-protagonist silent (the press opens the Codex; arming is THR-1876's); prose-never-numbers extended through the Law 13 carve-outs; three pillars confirmed.
- `03-design-tensions.md` → T4 legibility and T5 portfolio-vs-dashboard confirmed.
- `taste-profile.md` → bold sentence-case labels, no emoji, Cinzel at 22 px and up confirmed; "one gold emphasis per panel" silent; "numbers in UI" extended.

**Vision contradictions:** none found.

**Qualitative checks:** the north star is clear. The core loop is clear, with a soft note that the News group and the strip's count chips lean toward an inbox. The non-negotiables are clear, with a soft note that the essence prices, the "2×" readout and pool numerals are Law 13 carve-outs. The design tensions are clear. On the taste profile: the gold budget was unspecified, and the plan's claim that `taste-profile.md:107` still held the old label rule was stale (the vault already carried the 2026-10-14 text).

VISION AUDIT: PASS-with-notes

*Author response: the gold budget is now stated (§ Vision audit: the Needs-you pill and the armed row only), and the stale taste-profile claim is corrected (no edit owed; the THR-1879 comment withdrawn). The inbox lean is bounded by design: Needs you renders only when something waits, News lapses after `NEEDS_YOU_NEWS_KEEP_DAYS`, bursts coalesce to one row, and per-entity news stays on the thread rows.*
