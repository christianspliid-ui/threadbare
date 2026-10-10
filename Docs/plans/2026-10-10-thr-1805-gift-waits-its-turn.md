> **title:** A gift waits its turn — THR-1805
> **linear_issue:** THR-1805
> **author:** Claude Code (design lane, run 2026-10-10c — decided under delegation, process.md rule 4)
> **created:** 2026-10-10
> **three_pillars:** Engine N/A (readiness and spacing unchanged; delivery is presentation) · Content done (three named strings) · UI done

# A gift waits its turn — THR-1805

*The player clicked Observe. They must get Observe, not a gift they did not ask for.*

## Why this is load-bearing

All three round-3 cold testers ([round report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-3.md)) reported clicks that opened the wrong thing: *"I clicked 'Observe' and got a different event"*, *"I tried to open 'View Full Profile' three times and got three different popups instead"*. For the veteran tester this was the closest they came to quitting. The cause is the opening spine gifts (beats 1–4 after the bond, [THR-1647](https://linear.app/threadbare/issue/THR-1647)). Each gift opens itself as a modal on the first render after its gate opens. The gate opens **because** the player acted: a committed cast is a player act, so the gift becomes due one tick after the click that cast it.

THR-1647 fixed *how often* gifts arrive (one player act apart, idle fallback). This plan fixes *when on screen* a ready gift opens. Readiness, spacing and order do not change. PC-4 (the game acts for the player without saying so) and PC-5 (piled-up popups) are both recurring classes in round 3. This ticket is the PC-5 instance all three testers hit.

## Measured, not assumed

Worktree at `origin/main` `1a35e655`.

| Claim | Evidence |
|---|---|
| A committed cast counts as a player act | `playerCastDispatch.ts:222-223`: `// A committed cast is a player act — it paces the opening's spine gifts (THR-1647).` `...recordPlayerAct(prev),` |
| The act alone opens the gate for gifts 1–4 | `spineGateBlockedBy` (`ascendantBeat.ts:758-774`): `if (actsSince >= SPINE_PLAYER_ACTS_BETWEEN_GIFTS) return null;` with `SPINE_PLAYER_ACTS_BETWEEN_GIFTS = 1` (`ascendant-beat-content.ts:48`); idle fallback `SPINE_IDLE_FALLBACK_TICKS = 36` (`:54`) |
| One pending beat at a time | `phaseAscendantBeatDirector` (`ascendantBeat.ts:813`): `if (beats.pending) { emitSkipped(turn, 'pending', ...); return {}; }`; `BEAT_MAX_PENDING = 1` (`ascendant-beat-content.ts:39`) |
| A pending spine gift opens itself unconditionally (except debug suppression and a pending journey vignette) | `GameView.tsx:3312-3314`: `if (pendingBeat && isSpineBeatId(pendingBeat.beatId) && !interruptsSuppressed && !journeyVignettePending) setBeatEntered(true);` |
| A non-entered beat already has a waiting affordance; only pool beats use it today | `GameView.tsx:6362-6364` renders `<AscendantBeatOfferBanner … onEnter={() => setBeatEntered(true)} />` while `!beatEntered`; its doc comment (`AscendantBeatModal.tsx:384-386`): *"Spine beats auto-open the modal instead of routing through this affordance."* |
| The beat modal and the Chapter Ledger are both non-yielding, so both render | `interruptRegistry.ts:72`: `const YIELDING_SURFACE_IDS = new Set(['MomentCard', 'EventPopup']);` — `AscendantBeatModal` and `ChapterLedger` (`:93`, `:101`) are not in it |
| No "player-opened surface" flag exists; the open player surfaces are known only to the debug list | `getDebugOpenModals` (`GameView.tsx:4977-5005`) names `ActionDrawer`, `AgentProfileModal`, the stub sheets, `AttachmentDetailView`, `ReadTheThreadsPanel`, `AscendantSheet`, `DoomClockDetail`, `MandateDetail`, `HarvestScreen`, `SettingsPanel`, `AgendaPicker`; the Codex is `codexOpen` (`:551`) and appears in neither list |
| No input timestamp exists; only an act counter | `gameState.ts:575` `playerActCount?: number;` — no last-input tick or time anywhere in `src/` |
| Beat 0 ("Reach Down") must keep opening at once | THR-1716 plan, [arrival first beat](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md): `beatEntered` starts at `arrivalBeatOffered` (`GameView.tsx:574`) |

## Decisions (made under delegation — veto in chat)

1. **A ready gift never opens over a surface the player opened, and never within 2 seconds of a player input.** While held, it shows as the existing offer pill, worded "A gift waits". It opens itself the moment the player has nothing of their own open and has not clicked or pressed a key for 2 seconds. Clicking the pill opens it at once.
2. **Only gifts 1–4 wait.** Beat 0 (the arrival's "Reach Down") keeps opening immediately: the player has nothing open at arrival, and THR-1716 put it on screen before the map on purpose.
3. **Engine untouched.** When a gift becomes ready, the spacing, the order and the idle fallback stay as THR-1647 built them. Only the moment the modal enters changes, and that is UI state (`beatEntered`), never engine state. Determinism is untouched.
4. **Other interrupts wait as before.** A gift that is held behind an encounter veil, a premonition or a rite is already held by the registry. This plan adds the *player-opened* and *recent-input* holds only.
5. **Time keeps its current rules.** A held gift does not pause the world, just as the pool-beat pill does not (`getDebugOpenModals`: *"The offer banner is not an interrupt: it does not stop the world."*). It pauses on entry, as today.

Options weighed and not taken are in the [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn-brainstorm.md).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ascendant Beat Director (`ascendantBeat.ts`) | 🟢 ACTIVE | **unchanged** — readiness, spacing, pending record |
| Interrupt registry (`interruptRegistry.ts`) | 🟢 ACTIVE | **read** — `interruptResolution.open` feeds the hold; no new entry |
| Ascendant beat offer banner (`AscendantBeatOfferBanner`) | 🟢 ACTIVE (pool beats only) | **extends** — also carries a held spine gift, with gift wording |
| Debug open-modals list (`getDebugOpenModals`) | 🟢 ACTIVE | **extends** — the player-surface list moves into a shared helper both read; Codex added |

## Interface impact

The lint matched several mapped subsystems because the plan names `GameView.tsx`. The plan adds no cross-system read or write: every value it reads is one GameView already reads.

| Contract | Disposition | Note |
|---|---|---|
| Ascendant Beat Director → UI: `GameState.ascendantBeats.pending` | preserve | Read as today (`GameView.tsx:3171`); now also passed to `resolveGiftDelivery` |
| Interrupt registry → GameView: `interruptResolution.open` | preserve | Read only; no new registry entry, yielding set unchanged |
| Journey vignettes → UI: `GameState.pendingVignettes` | preserve | Same hold as THR-1744, now named `vignette` |
| Debug bridge: `getOpenModals()` | extend | Adds `Codex`; the list is otherwise identical through the shared helper |
| Debug bridge: `getGiftDelivery()` | add | New read-only accessor; no production read site needed (debug surface) |

No `Docs/canon/interface-map.md` or `scripts/interface-contracts.ts` change: no engine-to-engine or engine-to-UI contract is added or retired.

## Engine pillar

Engine: N/A — readiness, spacing and the pending record are THR-1647's and stay as they are. The gate reads the act counter, which a click-time hold cannot affect. The change is the moment a React modal enters, which is UI state.

## Content pillar

### Data tables

Three strings in `src/data/ui-content.ts`, named so copy changes are data edits:

| Key | Text |
|---|---|
| `ui.gift.waits.eyebrow` | `A gift waits` |
| `ui.gift.waits.cta` | `Open ▸` |
| `ui.gift.waits.tooltip` | `A gift of the opening is ready. It opens when nothing else is open, or open it now.` |

The pill's second line keeps the gift's own eyebrow from `SPINE_BEAT_PRESENTATION` (e.g. "A Place to Stand"). No prose, encounter or template change.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces). The pill and the beat modal are DOM; no WebGL involved.*

### Player-facing display

- **New pure module `src/components/Game/giftDelivery.ts`** with one function:

  ```ts
  export interface GiftDeliveryInput {
    pendingBeatId: string | null;
    isSpine: boolean;              // isSpineBeatId
    isArrivalBeat: boolean;        // beat.spine.opening (Beat 0)
    suppressed: boolean;           // interruptsSuppressed
    journeyVignettePending: boolean;
    otherInterruptsOpen: readonly string[];   // interruptResolution.open minus AscendantBeatModal
    playerSurfacesOpen: readonly string[];    // from openPlayerSurfaces()
    msSinceLastInput: number;
  }
  export type GiftHoldReason = 'player_surface' | 'recent_input' | 'interrupt' | 'vignette' | 'suppressed';
  export interface GiftDelivery { enter: boolean; heldBy: GiftHoldReason[]; heldBySurfaces: string[]; recheckInMs: number | null; }
  export function resolveGiftDelivery(input: GiftDeliveryInput): GiftDelivery;
  ```

  `enter` is true only for a spine beat with no hold reason. Beat 0 ignores `player_surface` and `recent_input`, so it keeps today's behaviour. `recheckInMs` is `GIFT_QUIET_AFTER_INPUT_MS - msSinceLastInput` when the only hold is `recent_input`; otherwise it is null.
- **`openPlayerSurfaces()`** is a helper in the same module. It takes the flags GameView already holds (`drawerOpen`, `nonAgentDrawerOpen`, `profileModalAgentId`, `stubModalState`, `attachmentSheetId`, `readThreadsOpen`, `ascendantSheetOpen`, `doomDetailOpen`, `mandateDetailOpen`, `harvestResult`, `settingsPanelOpen`, `agendaPickerOpen`, `codexOpen`, `chapterLedgerOpen`, `scryVisible`) and returns surface ids. Its order and names match `getDebugOpenModals`, which is refactored to call it, so the two lists cannot drift. `GIFT_HOLD_SURFACES` is the exported id list.
- **GameView:** a `lastInputAtRef` is stamped by one window-level `pointerdown` + `keydown` listener in the capture phase. The listener is passive and never stops propagation. The effect at `:3312` calls `resolveGiftDelivery` instead of its inline condition. When `recheckInMs` is non-null it sets one `setTimeout` (cleared on re-run and unmount) to re-evaluate. Every other dependency (surface closes, interrupt changes) re-runs the effect through React as today.
- **The pill** renders for a held spine gift exactly where it renders for pool beats (`GameView.tsx:6362`). For spine beats it shows the gift wording from the content table, with `Tooltip` (Law 27). Its z-index comes from the `layout-zones.md` stacking table (Law 35). If no row fits a pill shown above player surfaces, the executor adds one in the same PR.
- **Once entered, nothing changes:** a spine gift is still not dismissable (`onClose` undefined), and it still pauses the world through the registry.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Offer pill, held gift (rendered sample) | "✦ A GIFT WAITS — A Place to Stand · Open ▸" | PC-5, PC-4 | Tooltip: "A gift of the opening is ready. It opens when nothing else is open, or open it now." |
| The surface the player clicked (Observe's drawer, Cast, Chapter Ledger, a profile) | unchanged | PC-5 | The click opens what it names; nothing covers it |
| Beat modal (gift 1–4) | unchanged (`SPINE_BEAT_PRESENTATION`) | PC-4 | It arrives when the player's own screen is clear, or on a click of the pill. It never arrives over their click. |

PC-4: the one automatic step left is the gift opening itself after 2 s of quiet with nothing open. The pill announced it first, and the tooltip says when it will open. PC-5: one pending gift at most (`BEAT_MAX_PENDING = 1`), shown as one pill, never stacked.

### Playtest signal

A round-4 tester who opens Observe, Cast, the Chapter Ledger or a mortal's profile during the opening gets the surface they clicked. No tester reports a popup appearing in its place. A tester who mentions the gifts says they appeared when nothing else was open, or that they opened them from the "A gift waits" pill.

### Event notifications

None new. The pill is the notification; the beat's chronicle lines are unchanged.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getGiftDelivery(): Promise<{ pendingBeatId: string | null; entered: boolean; heldBy: GiftHoldReason[]; heldBySurfaces: string[]; msSinceLastInput: number }>`, declared in `src/debug-bridge.d.ts`. It returns the live `resolveGiftDelivery` result.
- `getOpenModals()` gains `Codex` when `codexOpen`, through the shared helper.
- A `console.debug('[gift-delivery] held', heldBy, heldBySurfaces)` line fires once per change of hold reason (dev builds only). This is the UI-side causal trail; there is no engine trace because no engine state changes.

### Visual presence (HexMapV2)

N/A — no map layer changes.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `giftDelivery.ts` (new) | none (render-time) | `GameView` beat-entry effect, `AscendantBeatOfferBanner` | reads `ascendantBeats.pending`, `pendingVignettes` | `console.debug('[gift-delivery] …')` (UI) | `__DEBUG.getGiftDelivery()`, `getOpenModals()` |
| `GameView.tsx` input stamp | none | window listener | none (ref) | — | `msSinceLastInput` in `getGiftDelivery` |
| `ui-content.ts` strings | — | pill | — | — | styleguide pill sample |

Wiring checklist (`Docs/plans/wiring-checklist.md`): no new engine module, no new GameState field, no cross-system read/write. `interface-map.md` is unaffected. The Design Reference Wiki page whose `sources` include `GameView.tsx` or `AscendantBeatModal.tsx` gets a one-line note that spine gifts 1–4 wait for a quiet moment.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `GIFT_QUIET_AFTER_INPUT_MS` | `2000` | A ready gift waits this long after the player's last click or key press before it opens itself |
| `GIFT_HOLD_SURFACES` | the 17 ids `openPlayerSurfaces()` can return (`ActionDrawer`, `AgentProfileModal`, `LocationProfileModal`, `FactionSheet`, `ArmySheet`, `ArtifactSheet`, `AttachmentDetailView`, `ReadTheThreadsPanel`, `AscendantSheet`, `DoomClockDetail`, `MandateDetail`, `HarvestScreen`, `SettingsPanel`, `AgendaPicker`, `Codex`, `ChapterLedger`, `ScryOverlay`) | The player-opened surfaces a gift never opens over. Adding a surface is a list edit |
| `GIFT_HOLD_EXEMPT_BEAT_IDS` | `['beat.spine.opening']` | Gifts that open at once regardless (Beat 0, THR-1716) |

All three live in `src/data/ascendant-beat-content.ts` beside the THR-1647 spacing constants, so the opening's pacing is tuned in one file.

## Tracing

No engine trace: no engine state changes. The UI-side record is the debug accessor and the dev `console.debug` line:

```ts
// getGiftDelivery() result — read on demand
interface DebugGiftDelivery {
  pendingBeatId: string | null;
  entered: boolean;
  heldBy: GiftHoldReason[];        // why it is not open, empty when entered or none pending
  heldBySurfaces: string[];        // which player surfaces hold it
  msSinceLastInput: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The input listener never fires (headless test, no events) | `lastInputAtRef` starts at 0, so `msSinceLastInput` is large and the hold is surface-only. Behaviour equals today's minus the surface holds |
| A player surface flag sticks true (a sheet that never closes its state) | The pill stays visible, and clicking it opens the gift. The gift is never unreachable |
| The recheck timer is cleared by an unmount mid-hold | The next render re-runs the effect; the pill is visible meanwhile |
| An unknown surface id reaches the helper | Ignored; only `GIFT_HOLD_SURFACES` members hold |
| `pendingBeat` clears while held (debug resolve, warm settle) | `resolveGiftDelivery` returns `enter: false, heldBy: []`; the pill unmounts with the pending beat as today |

## Three-pillar check

- [x] Engine pillar — N/A with rationale (readiness unchanged; delivery is UI state)
- [x] Content pillar — three named strings
- [x] UI pillar — pure delivery resolver, pill reuse, debug accessor
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The god acts deliberately (Law 48's "deliberate act of a god"). A gift that hijacks a click is the opposite.
- [x] UI Laws engaged: **39** (a pause-tier beat still interrupts on its own once the screen is clear; the pill is the recovery route while it waits, not the primary one); **40** (clicking the pill opens what it counts); **47** (the click's own surface now acknowledges it); **49** (one pill, one gift, never stacked); **52** (entry still pauses and names its cause as today); **1, 13/14, 17, 21, 33, 37** checked at closeout per the browser-verify contract.

## Rulebook impact

- [x] This plan does not change a rule of play. The opening's order, spacing and gifts are unchanged.
- [x] N/A — no rule changes, so `Docs/canon/rulebook.md` needs no edit.

> Brainstorm companion: `Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Three named constants; strings in `ui-content.ts` |
| 2. Inspectability | PASS with note | No engine trace (no engine state); `__DEBUG.getGiftDelivery()` answers "why is the gift not open" with the reason and the surfaces |
| 3. Determinism | PASS with note | The engine still decides readiness deterministically. Wall-clock time only affects when a modal mounts, never the world. The tick at which entry pauses the world can now vary with the player's input timing. That is already true of every player-paced pause (pressing Pause, opening the ledger). Replays are input-driven, and a gift's pending record and history carry engine ticks |
| 4. Fail-soft | PASS | Fail-soft table; the pill always offers a manual route |
| 5. Narrative over mechanical perfection | PASS | The gift arrives as a moment the player turns to, not an interruption of their own act |
| 6. Additive over destructive | PASS | New module plus constants; one inline condition replaced; `getDebugOpenModals` now calls the shared helper with the same output plus `Codex` |
| 7. Performance budget | PASS | Two passive listeners writing a ref; one timer while held; no per-tick cost |

## Done when

- [ ] `resolveGiftDelivery` unit tests pass. Gift 1–4 + any `GIFT_HOLD_SURFACES` member open → `enter: false`, `heldBy` has `player_surface`. Input 500 ms ago → `recent_input` with `recheckInMs: 1500`. Beat 0 + surface open → `enter: true`. Pool beat → `enter: false` (pool beats keep their pill). Nothing open + quiet → `enter: true`
- [ ] A component test (pattern of `ascendantBeatPresentation.test.tsx`) shows the pill with "A gift waits" while a held spine gift is pending, and clicking it opens the modal
- [ ] Browser evidence on `?view=game&seeded&size=medium`, at 1920×1080, after the bond. Open a mortal's profile, `await window.__DEBUG.fireBeat('beat.spine.the_seat')`. `await window.__DEBUG.getGiftDelivery()` reports `heldBy: ['player_surface'], heldBySurfaces: ['AgentProfileModal']`, and the profile is still on screen with the pill visible. Close the profile, wait 2 s. `getOpenModals()` contains `AscendantBeatModal`
- [ ] The same check with the ActionDrawer open on a mortal (the Observe / Cast path, `heldBySurfaces: ['ActionDrawer']`), with the Chapter Ledger open, and with the Codex open
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; console clean; the UI-Laws judgment line names Laws 1, 13/14, 17, 21, 33, 37, 39, 40, 47, 49
- [ ] Closing commit body includes the issue's close keyword on its own line

## Kill criteria

- A round-4 tester still reports a gift or popup opening in place of the surface they clicked → the hold list is incomplete. Find the surface and add it to `GIFT_HOLD_SURFACES`.
- A round-4 tester reports the gifts never arrived, or a gift waited over a minute with nothing open → the quiet window or the hold is mis-firing. Read `__DEBUG.getGiftDelivery()`, then shorten or fix it.

## Coordination block

**Suggested model:** sonnet — one pure module, one effect swap, one pill variant, all specified with line anchors.

**Parallel-safe with:** [THR-1795](https://linear.app/threadbare/issue/THR-1795), [THR-1776](https://linear.app/threadbare/issue/THR-1776) — infrastructure scripts and hooks, no `src/components/` overlap.

**Mutex with:** [THR-1806](https://linear.app/threadbare/issue/THR-1806) and [THR-1808](https://linear.app/threadbare/issue/THR-1808) once they are planned — both change what opens in `GameView.tsx` after the bond (the aftermath auto-open and the dashboard arrival), and the interrupt/entry effects sit in the same 3150–3320 and 6360–6380 regions.

**Files to touch:**
- Create: `src/components/Game/giftDelivery.ts`, `src/components/Game/__tests__/giftDelivery.test.ts`
- Edit: `src/components/Game/GameView.tsx` (input stamp ref + listener; effect at `:3312`; `getDebugOpenModals` via helper; pill props), `src/components/Game/AscendantBeatModal.tsx` (`AscendantBeatOfferBanner` gift wording + `Tooltip`), `src/data/ascendant-beat-content.ts` (three constants), `src/data/ui-content.ts` (three strings), `src/debug-bridge.d.ts` + the bridge registration (`getGiftDelivery`), `Docs/design-system/layout-zones.md` (only if a z-band row is needed)

## Notes for the executor

- Do **not** touch `spineGateBlockedBy` or any spacing constant. A "fix" that delays the gate by ticks would not help: a tick is about a second, and the player may still be mid-click.
- Do not make the pill pause the world. It is not an interrupt (see `getDebugOpenModals`'s comment).
- The pool-beat path is unchanged. `resolveGiftDelivery` returns `enter: false` for pool beats so their pill-only behaviour stays.
- `ChapterLedger` and `ScryOverlay` are both registry interrupts *and* player-opened surfaces. Report them once, under `player_surface`, by removing them from `otherInterruptsOpen` before the call.
- `interruptsSuppressed` and `journeyVignettePending` keep their current meaning as hold reasons `suppressed` and `vignette`.
- The listener goes on `window` in the capture phase with `{ passive: true }`. Clicks *inside* the beat modal also stamp it, which is harmless, because the modal is already entered.

## Intent-judge verdict

**Allow** (opus, cold context, ~95 s, 2026-10-10). Two GAPs, both folded in before the PR. Dimension 3: the Done-when now checks the ActionDrawer (Observe / Cast) hold. Dimension 10: a Kill criteria section was added. Impact class confirmed as Reversible.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-10*

### NFP audit

PASS-with-notes. Tunability PASS: three named constants and three named string keys. Inspectability PASS-with-note: no engine trace, justified because no engine state changes; `__DEBUG.getGiftDelivery()` returns the reason and the surfaces, and a dev `console.debug` logs each change of hold reason. Determinism PASS-with-note: readiness, spacing and order are untouched, but the tick at which entry pauses now varies with wall-clock input. *Author response: this is folded into the NFP table. Every player-paced pause already behaves this way.* Fail-soft PASS: five cases, and the pill is always a manual route. Narrative PASS. Additive PASS. Performance PASS: passive listeners and one timer while held.

### Three-pillar audit

PASS. Engine is N/A with rationale (`beatEntered` is UI state). Content is present and substantive: three named strings, and the pill reuses the gift's eyebrow. UI is present and substantive: resolver, effect, input stamp, pill with tooltip, player-facing text with PC-4 and PC-5 mapped, playtest predicate, debug accessors. All required sections are present. The auditor noted that Blast Radius might be owed for `GameView.tsx`. *Author response: measured, it has 1 importer (`src/App.tsx`), below the 100-importer threshold, so no section is owed.* The wiring table ties every module to its component, state read, trace substitute and debug surface.

### Vision audit

PASS-with-notes. No contradictions. The core loop is preserved: readiness, spacing, order and idle fallback are untouched, and Beat 0 still opens at once. The non-negotiables hold: the god acts deliberately, and an entered gift stays non-dismissable and pausing. On the design tension of automation against agency, the plan resolves toward agency and keeps one announced automatic step, which it names as PC-4. The auditor could not read `Vision/` from the worktree (`[design-brief-stale]`). The mapping rests on the brief script and the plan's citations, which is acceptable for a delivery-timing ticket with no rule change.
