> **title:** `The encounter Stage — a mortal's moment plays over the dimmed map with its hex lit — THR-1877`
> **linear_issue:** THR-1877
> **author:** `Claude Code`
> **created:** 2026-10-14
> **three_pillars:** Engine `done — the Stage view model and lit-hex resolver behind the THR-1822 seam; no tick, graph or PRNG change` · Content `done — the home list's words, the Stage's few new lines, and the help copy that points at moved surfaces` · UI `done — three homes from one list, the hold rule, the Stage geometry, map dim and ring, camera, the frame while the Stage is open; Playwright (DOM) and Claude-in-Chrome (WebGL)`

# The encounter Stage — THR-1877

*A mortal's moment at a place plays on one panel over the dimmed map with that place lit beside it, the god's own business stays a dialog, and the moments that make the god who they are stay full screen. Which home a moment takes is one list, so a new kind of moment is one entry.*

## Settled input (not re-opened)

| Source | What it fixes for this plan |
|---|---|
| [THR-1829 decision record](../audits/2026-10-14-thr-1829-encounter-stage-decision.md) (design lane, decided by delegation 2026-10-14; mock and 1080p / 1440p renders beside it) | Three homes (Stage / dialog / full-screen ceremony) and their members; Stage layout (art and cast left; scene, forecast and hand right, rows of four); `STAGE_WINDOW_PX` 280 / 520, `STAGE_LEFT_COL_PX` 340 / 560, compact tier about 860 px, 24 px gutter; map dim `STAGE_MAP_DIM` 0.7 with the lens grammar's near-black; lit hex with a parchment ring, never gold; the camera eases the hex into the window first and stays when the moment closes; reduced motion cuts; one moment at a time with the rest held in Needs you; time unchanged; the Inspector folds; the god rail's cards rest with one line (THR-1829 calls them the rail's hand; its words are refined in D7) |
| THR-1829 comment, Christian, chat 2026-10-14 | **The end of a cycle (`HarvestScreen`) is a full-screen ceremony**, beside Meet the First and the Threading Rite. The Divine Court and the Codex stay dialogs |
| Christian, chat 2026-10-14 (the attended carve-up session) | He asked for the five carve-up plan docs of [THR-1823](https://linear.app/threadbare/issue/THR-1823) to be written now, in parallel. That **waives the design lane's one-day veto window** on the lane-made decisions they build on (THR-1828, THR-1829, THR-1830, THR-1831, THR-1832, THR-1833) for authoring. Their veto stays open in chat; it does not block this plan |
| **Law 58** (ratified 2026-10-14) and the THR-1877 description | Which moments play on the Stage, in a dialog or as a ceremony is **one list keyed by moment kind**; a new kind is one entry; a missing one fails a named test; an unknown kind shows a plain fallback; the list gets a row in `Docs/design-system/extending.md` |
| **Law 57** (ratified 2026-10-14) | The Stage's limit is its frame geometry; nothing inside it scrolls or cuts a list before that limit |
| [THR-1819 plan](2026-10-14-thr-1819-1440p-layout-contract.md) | Tokens `--stage-gutter` 24, `--stage-window-w` 280 / 280 / 520 / 1400, `--stage-left-col-w` 340 / 340 / 560 / 560, `--stage-compact-w` 53.75rem, `--measure-prose` 34em, `--rail-left-w` 320 / 400, `--topbar-height` 48 / 56; the panel width is derived, not a token (1272 / 1592 / 1592) |
| [THR-1820 plan](2026-10-14-thr-1820-dialog-size-tiers.md) | The Stage is a container, not a dialog tier; dialog-home surfaces take S / M / L / XL; `HarvestScreen` takes no tier (ceremony); the veil's 540 px aftermath blocks "do not survive the move" |
| [THR-1821 plan](2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md) (built by [THR-1884](https://linear.app/threadbare/issue/THR-1884)) | `Overlay` with `band="stage"` and `inset="belowTopBar"` (the Stage), `Panel` at level `page`, `Z_BAND.stage = 50`, `CEREMONY_SURFACES = ['meet-the-first', 'threading-rite', 'cycle-harvest']` in `surfaceHomes.ts` ("a surface's home is one named choice"); the UI-debt ratchet |
| [THR-1822 plan](2026-10-14-thr-1822-view-model-seam.md) D12, D13, D16 | `StageVM` and `resolveMomentHexes` with the resolution order beat hex → the agent's Location → the ruin's Location → nothing lit; the Needs-you view model reads the held group; **the GameView split ([THR-1881](https://linear.app/threadbare/issue/THR-1881)) cuts `StageHost`, `DialogHost`, `CeremonyHost`, `GameMap` and the frame modules, and the Stage build comes last** (after lenses, the Inspector and the frame) |
| [THR-1828 frame](../audits/2026-10-12-thr-1828-screen-frame-decision.md), [THR-1827 Inspector](../audits/2026-10-11-thr-1827-inspector-decision.md), [THR-1830 lenses](../audits/2026-10-14-thr-1830-map-lenses-decision.md), [THR-1831 map chrome](../audits/2026-10-11-thr-1831-map-chrome-decision.md) | God rail 320 / 400, Ledger rail 340 / 420; "Held behind this chapter" is the Stage's waiting line, its rows say "after this"; the top bar's right group is dimmed and click-guarded while an encounter is open; a pause-tier interrupt closes Inspector Full; one lens at a time and two dims never compose; gold on the map is the Dominion frontier; the centring zoom is `FOCUS_ZOOM = 10`; place labels hide below k = 5 |
| [THR-1833 type system](../audits/2026-10-13-thr-1833-type-system-decision.md) and the chat ruling of 2026-10-14 | Small labels are bold sentence case, never letter-spaced capitals; Cinzel only at 22 px and up; prose in Alegreya at one step above UI text, capped at `--measure-prose` |
| [THR-1834 icon family](../audits/2026-10-14-thr-1834-icon-family-decision.md) and the chat ruling of 2026-10-14 | One carved icon family for content, chrome and places; this plan names concepts only and consumes THR-1879's registry; it vendors no shape |
| THR-1724, THR-1730, THR-1605, THR-1754, THR-1809 | The cast and *At stake* together, apart from the prose; Escape and *Show on map* minimise, never disregard; a minimised moment waits; time halts for every moment; the Threading Rite never renders under another surface; a gift waits while any other interrupt is open (`giftDelivery.ts:62`) |
| Coordination comments on THR-1877 from [THR-1875](https://linear.app/threadbare/issue/THR-1875) and [THR-1878](https://linear.app/threadbare/issue/THR-1878) (2026-10-14) | The frame ships `collectHeldMoments()` and `HeldMoment = { surfaceId, subject, queuedAtTick }` in `src/engine/views/interruptRegistry.ts` (moved there by its top-bar slice) and says "the hold rule is yours"; the frame rests the god rail's cards (its "Your cards" section) for every interrupt, with its own words in `src/data/frame-content.ts` (corrected in its second comment: "Your cards wait. This encounter deals its own hand." / "Your cards wait while this moment is open."); Needs-you rows are read-only during a moment. The lens host reads one flag, `lensSuppressed`, in `GameScreenState`; the lens bar keeps its pressed state; the lens bar sits top-left of the map with its legend under it and the map controls sit bottom-right |

## Why this is load-bearing

Today every encounter covers the whole screen with an opaque veil, and five other moments open as centred dialogs over a darkened screen. The player loses the world exactly when something happens in it: the cold playtests found chapter results landing out of sight ([THR-1806](https://linear.app/threadbare/issue/THR-1806), PC-2) and surfaces drawing on top of each other ([THR-1853](https://linear.app/threadbare/issue/THR-1853), PC-5). Direction B, which Christian chose, answers both: the moment plays beside the place where it happens, and the stage holds one scene at a time (Vision, `01-core-loop.md`: "at any given time, there is one story front-of-stage, and the game knows it").

The second half is Law 58. Four lists already describe the same surfaces by hand and must agree: the interrupt registry (`interruptRegistry.ts`), the clock-holder names (`INTERRUPT_HOLDER_NAMES`), the dialogue palettes (`DIALOG_CONTEXT_SURFACES`), and, once THR-1884 lands, the ceremony list (`CEREMONY_SURFACES`). Adding the Stage would make a fifth. This plan replaces them with one list keyed by kind; every other list is derived from it. The Stage is the last surface of the map-first screen (THR-1822 § D16), so it also closes the GameView split.

## Substrate inventory

Step 0.6 greps over `src/` and `Docs/canon/systems-inventory.md` (2026-10-14): `HOMED_SURFACES` / `homed-surfaces` / `HomedSurface` / `HomeId` / `StageHomedKind` / `HOMED_SURFACE_OPEN_WHEN` / `HomedSurfaceFallback` / `openHomedSurface` 0 hits; `src/components/Game/stage/` 0 hits; `StageFocus` / `setStageFocus` 0 hits; `stageView` 0 hits (typed in THR-1822 D12, not built). **`BeatKind` is taken**: `src/types/ascendantBeat.ts:19` (the ascendant beat's kinds, imported by `src/types/trace.ts:51` and `src/debug-bridge.d.ts:322`; the UL's Offering entry says "beat kind `offering`"). That is why this plan does not use *beat* as its code word (D1). The plan is **not** green-field: it extends the subsystems below. In `Docs/canon/systems-inventory.md`'s names, it reads through **Attention, Chronicle & Narrative** (the interrupt registry and the auto-pause), **Encounters & Dilemmas** (the encounter and its hex), **Ruins, Clues & Delves** (the emergence dilemma's ruin), **Divine Premonition** (2a.9, the premonition and its options) and **Ascendant Beats & Progression** (gifts and offerings); it changes none of them, and the inventory has no row for the veil, the camera or a Stage.

| Existing subsystem | Status | This plan |
|---|---|---|
| Interrupt registry — `src/components/Game/interruptRegistry.ts` (`INTERRUPT_SURFACES` :83, `resolveInterrupts` :146, 178 lines; THR-1875's top-bar slice moves it to `src/engine/views/interruptRegistry.ts` and adds `collectHeldMoments()`) and `hooks/useInterruptAutoPause.ts` | 🟢 ACTIVE | **extends**: its entries are derived from the home list; `resolveInterrupts` gains the one-foreground rule and `rendering`, `foreground`, `stage`, `held`; `collectHeldMoments()` follows the hold rule. The auto-pause, `getOpenModals()` and the clock holder keep reading it unchanged |
| `INTERRUPT_HOLDER_NAMES` (`src/data/nudge-stage-content.ts:264-280`) | 🟢 ACTIVE | **derived** from the list (export kept; same words) |
| `DIALOG_CONTEXT_SURFACES` (`src/components/shared/dialogContext.ts:49-58`, THR-1586) | 🟢 ACTIVE | **derived** from the list (export kept; same rows) |
| `CEREMONY_SURFACES` (`src/components/shared/surfaceHomes.ts`, THR-1884) | ⚪ PLANNED | **derived** from the list when it exists |
| `DIALOG_SIZE_SURFACES` (`src/components/shared/dialogSize.ts`, THR-1820 slice 1) | ⚪ PLANNED | **cross-checked**: it also lists tools (Codex, Settings…), so it is not derived; a test asserts every dialog-home entry has a row and no Stage or ceremony entry does |
| Gift delivery — `giftDelivery.ts` (`resolveGiftDelivery`; a gift waits while any other interrupt is open, :62) | 🟢 ACTIVE | **preserved**; it is why an offering never opens over a Stage moment on its own (D2) |
| Encounter veil — `EncounterVeil.tsx` (3,957 lines; three `document.body` portals :719 / :1617 / :2069; `VEIL_ROOT_INSET` :408-413; `ENCOUNTER_VEIL_Z = 50` :420) and `encounter-stage/` (`shells/` NudgeStageHeader, NudgePhaseShell, EncounterStakesLine, ClearanceGatePanel; `OpponentHeader`, `NarrativeSegments`; `adapters/` build*; `types.ts` `hexCol/hexRow` :89-90) | 🟢 ACTIVE | **extends**: the shells and in-file helpers stay; the portals and full-screen geometry are replaced by the Stage panel (S3) |
| Moment dialogs — `StoryBeatModal` (152), `JourneyVignetteModal` (243), `MomentCard` (342), `PremonitionModal` (428), `ruins/EmergenceDilemmaModal` (254) | 🟢 ACTIVE | **extends**: their bodies move onto the Stage (S2, S4); `MeetingEncounterModal` (610, never mounted) is deleted (S4) |
| Ceremonies — `MeetTheFirstFlow` (`fixed inset-0`, :245), `ThreadingRite` (:206), `HarvestScreen` (`fixed inset-0`, :57), `RemembranceFlow` (`App.tsx:163`, before the world) | 🟢 ACTIVE | **preserved**; listed as ceremony-home entries (Remembrance is outside the in-game list, below) |
| God rail rest — THR-1875's frame ([THR-1894](https://linear.app/threadbare/issue/THR-1894)): the "Your cards" section dims and swallows presses for every interrupt, with its own words in `src/data/frame-content.ts` | ⚪ PLANNED | **preserved**: the Stage changes nothing there (D7) |
| HexMapV2 camera — `centerOn` (`HexMapV2.tsx:378`, :724-729), `animateCameraTo` (`camera/CameraAnimator.ts:45-70`), `CAMERA_CONSTANTS.JUMP_TO_DURATION_MS` 500 (`D3ZoomCamera.ts:18`) | 🟢 ACTIVE | **extends** additively: a screen-anchored target and a completion signal; duration 0 under reduced motion |
| Map dim grammar — `DominionLensLayer.ts` (near-black hex plates, `DOMINION_DIM_COLOR = '#0b0907'` in `dominion-ui-content.ts:45`), `HexPulseMesh.ts` (additive glow), `BorderMesh.ts` edge helpers, `RenderLayers.ts` | 🟢 ACTIVE | **pattern reused** for a new `StageFocusLayer`; the colour constant is imported, never re-typed |
| Lens host — `lensSuppressed` in `GameScreenState` (THR-1878's build) | ⚪ PLANNED | **consumed**: the Stage sets it |
| Reduced motion — `src/hooks/usePrefersReducedMotion.ts`; the veil's `ceremonialDelay` / `ceremonialDuration` (motion.md § Ceremonial tier) | 🟢 ACTIVE | **reused** for the camera cut and the Stage entrance |
| Minimise — `handleEncounterMinimize` (`GameView.tsx:3657-3701`), `EncounterBadge` on the thread row (`ThreadsPanel.tsx:604-605`) | 🟢 ACTIVE | **preserved** unchanged |
| Top bar encounter guard — `GameViewTopBar.tsx:328-338` (`encounterOpen` dims and swallows the right group) | 🟢 ACTIVE | **extends**: the guard follows "any Stage moment open" |
| Router — `useRefRouter` (THR-1490), rebuilt for the Inspector by THR-1876 | 🟢 ACTIVE | **extends** with one rule: a ref opened while the Stage is open shows the Inspector over the Stage |
| View-model seam — `readView`, `useView`, `hexContents` (THR-1822 slice 1), `StageVM` types (D12) | ⚪ PLANNED | **builds** `stage/stageView.ts` (D12) at S2 |
| Debug levers — `__DEBUG.forcePremonition`, `forceMoments`, `openThreadingRite`, `forceOffering`, `?forceencounters`, `?spawn=` | 🟢 ACTIVE | **reused** behind one `__DEBUG.openHomedSurface(kind)`; story beats, journey moments and the emergence dilemma gain levers (none exist today) |

Population consumed: the list has 16 entries (the 15 interrupt surfaces plus the cycle harvest). On `?view=game&seeded&size=medium`, every Stage kind can be opened through the levers above; each carries a hex or a subject whose Location resolves to one, except a story beat queued without a hex (fail-soft, below).

## What exists today (measured, `main` @ `0afcfc2b`)

| Fact | Evidence |
|---|---|
| Fifteen surfaces stop the world through one ordered registry; two yield (`MomentCard`, `EventPopup`) and the rite waits for every other blocking surface. **Every other surface renders whenever its own flag is set**, so two of them can be on screen at once | `interruptRegistry.ts:72,83-109,142-168` |
| Four hand-kept lists describe those same surfaces: the registry, `INTERRUPT_HOLDER_NAMES`, `DIALOG_CONTEXT_SURFACES`, and (planned) `CEREMONY_SURFACES`. A test already catches one disagreement (`termsExplainThemselvesThr1814.test.tsx:92`: every registry id has a holder name) | grep |
| The veil is an opaque `--veil-void` cover below the top bar at z 50; its content column is 52% wide with art, 65% without; scene prose caps at 760 px beside a 220 px side column; eleven blocks cap at 540 px and four at 500 px | `EncounterVeil.tsx:323-428,727,785,911…3927` |
| The veil knows its hex (`header.hexCol/hexRow`), but only the unified and simple adapters set it; the gate-duty adapter never does | `encounter-stage/types.ts:89-90`; `buildUnifiedEncounterStageModel.ts:290`; `buildSimpleEncounterStageModel.ts:410` |
| A queued story beat carries a hex, but `StoryBeatModal` receives only `template` and `agentName` | `types/attention.ts:123-125`; `GameView.tsx:6722` |
| Journey moments, undertaking moments and premonitions carry an agent; premonition compulsion options carry `locationId`; the emergence dilemma carries `ruinId` and `agentId` | `journeyEngine.ts:187`; `momentCardModel.ts:86`; `premonition.ts:75`; `delveTypes.ts:90-91` |
| `Modal`'s backdrop is `fixed inset 0` at z 60, so today a story beat or a premonition covers the top bar; the veil starts below it | `Modal.tsx:127-136`; `EncounterVeil.tsx:408-413` |
| The camera has one fly-to (`centerOn`, 500 ms d3 transition) that centres on the canvas centre and, when no scale is passed, jumps to `DEFAULT_ZOOM` 1.5. No reduced-motion handling | `HexMapV2.tsx:724-729`; `CameraAnimator.ts:45-70` |
| *Show on map* centres the hex at zoom 20 (`RETINUE_EYE_ZOOM_SCALE`) and minimises | `GameView.tsx:2311,6626-6631`; `EncounterVeil.tsx:3443-3448` |
| Minimise suppresses moment interrupts until the next tick and resumes the clock | `GameView.tsx:3657-3701` |
| The premonition's words today: header "A Stirring in the Thread" (whisper) / "The God's Will" (compulsion); dismiss "Let the dream fade" / "Release your hold — let them choose"; it does not close on Escape | `PremonitionModal.tsx:284-293` |
| No tutorial system exists (no step lists, coach marks or `data-tutorial` attributes). The help copy that names moved surfaces is listed in § D10 | survey |

## Decisions

### D1 — Three homes, one list keyed by kind (Law 58)

**Words.** In this plan's prose, a *moment* is anything that takes the screen to be answered or witnessed, in THR-1829's sense ("a mortal's moment at a place"), and a *home* is where it plays: **the Stage**, **a dialog**, or **a full-screen ceremony**. In code, three plain words are already taken: the UL's **Moment** is an undertaking's report to the player (`Docs/ubiquitous-language/Agents.md` § Moment, surface `MomentCard`); **`BeatKind`** is the ascendant beat's kind (`src/types/ascendantBeat.ts:19`; UL Offering: "beat kind `offering`"); and the UL's **Surface** is an encounter template bound to its context axes (`Encounters.md` § Surface, `SurfaceKey`, `encounterSurface.ts`). The UI code has long used *surface* in its own sense, the thing on screen (`INTERRUPT_SURFACES`, `surfaceId`, `DIALOG_CONTEXT_SURFACES`; THR-1821: "a surface's home is one named choice"), so this plan keeps that sense but **only in the qualified form *homed surface***: the list is `HOMED_SURFACES`, its key is `HomedSurfaceKind`, the home union is `HomeId`, and no new name starts with a bare `Surface`. An encounter on the Stage therefore carries a `SurfaceKey` (which encounter, in which context) and a `HomedSurfaceKind` (`'encounter'`, where it plays) without the two meeting. Player-facing text keeps "moment" as it does today. *Home* and *homed surface*, with all three disambiguations, are proposed to the UL in comments on [THR-1882](https://linear.app/threadbare/issue/THR-1882).

**Membership.** A surface is in the list when it **stops the world, or comes forward without the player asking for it**: the 15 interrupt-registry surfaces plus the cycle harvest. A **tool** neither stops the world nor comes forward on its own: the player opens it from the chrome to look something up. Tools are not in the list; they are dialogs by nature and THR-1820 sizes them in `DIALOG_SIZE_SURFACES`.

**The list** — `src/data/homed-surfaces.ts`, exported as `HOMED_SURFACES` (`as const satisfies readonly HomedSurfaceEntry[]`). Its order is render priority. `kind` uses THR-1821's kebab-case ids, so `CEREMONY_SURFACES` derives without renaming. The holder names are today's words, moved, not rewritten.

| # | `kind` | Today's surface (`surfaceId`) | Home | Stops time | Waits its turn | Palette | Clock holder (today's words) | Held line in Needs you | Lit hex from | Layout |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `warm-start` | `WarmStartOverlay` | dialog | yes | — | — | the world settling | — (never held) | — | S card on an opaque cover (THR-1820) |
| 2 | `meet-the-first` | `MeetTheFirstFlow` | **ceremony** | yes | — | — | meeting The First | Meeting your First | — | full screen |
| 3 | `threading-rite` | `ThreadingRite` | **ceremony** | yes | dialogs | — | the threading rite | The threading rite with {subject} | — | full and short shapes full screen; its bond-only shape draws as an M reveal card (THR-1829 § 1, THR-1820) |
| 4 | `encounter` | `EncounterVeil` | **Stage** | yes | — | `encounter` (owns its palette) | an encounter | {title}, with {subject} | the step's hex; else the mortal's Location | full |
| 5 | `premonition` | `PremonitionModal` | **Stage** | yes | — | `divine` (owns its palette) | a premonition | A premonition about {subject} | the mortal's Location; options lit on hover | full (the mortal on the left) |
| 6 | `journey-vignette` | `JourneyVignetteModal` | **Stage** | yes | — | `story` | a vision | A vision on {subject}'s road | the mortal's Location | compact |
| 7 | `story-beat` | `StoryBeatModal` | **Stage** | yes | — | `story` | a story beat | A turn in {subject}'s story | the queued beat's hex | compact |
| 8 | `ascendant-beat` | `AscendantBeatModal` | dialog | yes | — | `story` | a beat of your story | — | — | S below three cards, M from three |
| 9 | `choice-set` | `ChoiceSetModal` | dialog | yes | — | — | a choice | — | — | S |
| 10 | `emergence-dilemma` | `EmergenceDilemmaModal` | **Stage** | yes | — | `elder` | a new power | A new power at {subject} | the ruin's Location; else the mortal's | full when it has art, else compact |
| 11 | `divine-receipt` | `DivineReceiptModal` | dialog | yes | foreground | `gain` | what your act bought | What your act bought | — | S |
| 12 | `chapter-ledger` | `ChapterLedger` | dialog | yes | — | — | the Chapter Ledger | — | — | L |
| 13 | `divine-court` | `ScryOverlay` | dialog | yes | — | — | your court | — | — | L |
| 14 | `undertaking-moment` | `MomentCard` | **Stage** | yes | dialogs | `gain` | a moment | News of {subject}'s work | the mortal's Location | compact |
| 15 | `event-popup` | `EventPopup` | dialog | yes | everything | — | a message | A message: {title} | — | S |
| 16 | `cycle-harvest` | `HarvestScreen` | **ceremony** | no (the age has ended; unchanged) | — | — | — | The end of the age | — | full screen |

- **Two order changes**, both from the decision's "ceremony outranks the Stage": Meet the First moves ahead of the encounter, and the Threading Rite now waits only for dialogs, not for Stage moments that have not opened yet (D2). Every other position is today's.
- **Held lines.** The `{subject}` and `{title}` slots are filled by THR-1875's `collectHeldMoments()` subject resolution (its `HeldMoment.subject.name`) and the queued item's title. The text is built by one helper beside the list, `heldLineFor(kind, { subject, title })`. **A line whose slot has no value falls back to its clock-holder words in sentence case** ("A premonition"), so no `{token}` reaches the screen (Law 43). THR-1875's two sample rows ("A premonition about Kael Thorne", "A message: The Drowned Bell wakes") are rows 5 and 15 of this table.
- **Not in the list (tools; dialogs at THR-1820's tiers):** the Codex (XL), in-game Settings (M), Read the Threads (M), the Doom clock (M), the Mandate (M), the Omen (S). THR-1829 names Doom, Mandate and Omen only to say they stay dialogs; they never come forward on their own.
- **Outside the in-game list:** `RemembranceFlow` runs in `App.tsx` before GameView exists. Its home is ceremony by construction; no host is involved. `MeetingEncounterModal` is never mounted and is deleted (S4).

**What derives from the list** (Law 58: "a second list that must agree with the first is derived from it"):

| Derived | From | How |
|---|---|---|
| `HOMED_SURFACE_OPEN_WHEN` | every entry | a `Record<HomedSurfaceKind, (s: InterruptSnapshot) => boolean>`: one open predicate per kind, the stopping ones moved from today's registry entries unchanged, plus `cycle-harvest` (`s.cycleHarvestPending`, a new snapshot flag set from today's `harvestResult !== null`). A kind without a predicate is a type error |
| `INTERRUPT_SURFACES` (order and membership) | entries with `stopsTime` | `{ id: surfaceId, kind, home, waitsTurn, tier: 'interrupt', isOpen: HOMED_SURFACE_OPEN_WHEN[kind] }`, same ids in the order of the list |
| `INTERRUPT_HOLDER_NAMES` | `holderName` | same keys and words as today; the export stays in `nudge-stage-content.ts` |
| `DIALOG_CONTEXT_SURFACES` | `palette` | same rows as today; `ownsPalette` is true for `encounter` and `divine`. The palette names (`'story' \| 'elder' \| 'gain' \| 'divine' \| 'encounter'`) move into the data file and `dialogContext.ts` imports them, so data never imports a component |
| `CEREMONY_SURFACES` (THR-1884) | `home === 'ceremony'` | `['meet-the-first', 'threading-rite', 'cycle-harvest']`, the same three ids |
| Each host's set of kinds | `home` | `StageHomedKind`, `DialogHomedKind`, `CeremonyHomedKind` are type extractions from the `as const` list |

**How the hosts read it.** `StageHost`, `DialogHost` and `CeremonyHost` (THR-1881) each render their surfaces through one exhaustive `switch` over their home's kind type, and only the kinds the resolution's `rendering` list names (D2). Moving a kind to another home is one field: the old host's switch stops compiling (an extra case) and the new one's does too (a missing case), each naming the kind. A kind that reaches a host with no case at run time renders **`HomedSurfaceFallback`**: an S dialog titled with the kind's holder words in sentence case ("A story beat"), the line "This moment has no screen yet.", and **Continue**. Continue marks the kind skipped until its open flag next turns false, so a surface with no screen can never hold the clock paused forever. A `console.warn` and a `ui_stage` trace (`action: 'fallback'`) record it once.

**The named test** — `src/data/__tests__/homedSurfaces.test.ts`, whose failure messages name `HOMED_SURFACES (src/data/homed-surfaces.ts)`:

1. `kind` and `surfaceId` are unique.
2. Turning on each `InterruptSnapshot` flag alone opens exactly one surface, and that surface is a list entry. A new snapshot flag with no entry fails here with "add an entry to HOMED_SURFACES".
3. Every kind that can be held (Stage, ceremony, or `waitsTurn`) has a held line; every stopping kind has a holder name.
4. When `DIALOG_SIZE_SURFACES` exists: every dialog-home entry has a row there, and no Stage or ceremony entry does.
5. The derived exports (`INTERRUPT_SURFACES`, `INTERRUPT_HOLDER_NAMES`, `DIALOG_CONTEXT_SURFACES`, `CEREMONY_SURFACES`) equal what the list produces.
6. Each host's kind set equals the list's filter for its home, and the three sets cover every in-game kind once.

**`extending.md` row** (added by this docs PR as "Designed"; it flips to "One place" when THR-1877's build lands):

> A surface that stops the world or comes forward on its own, and its home · one entry in `HOMED_SURFACES` (`src/data/homed-surfaces.ts`): kind, surface, home, stops time, waits its turn, palette, clock-holder words, held line; then its open predicate in `HOMED_SURFACE_OPEN_WHEN` and its case in its home's host · `homedSurfaces.test.ts` names the list; a missing predicate or host case is a type error; an unknown kind renders `HomedSurfaceFallback` · `__DEBUG.getInterruptState().homedSurfaces` (the list as data), and `__DEBUG.openHomedSurface(kind)` on `?view=game&seeded&size=medium` once S2 lands.

### D2 — The hold rule: one foreground, the rest held and named

THR-1829 § 2: the Stage shows one moment; the others wait, named, in Needs you; ceremony outranks the Stage; dialogs open over the Stage only when the Stage asks for one. THR-1754: the rite never renders under another surface. The rule that satisfies all of them:

- **R1 — One foreground.** Ceremony-home and Stage-home surfaces share one slot, the *foreground*. At most one of them renders, whether or not it stops time (the cycle harvest takes part).
- **R2 — Nothing replaces an open moment.** The surface that held the foreground on the last render (the *incumbent*) keeps it while its own flag holds, whatever arrives. A rite that comes due while an aftermath is open waits until the aftermath closes (THR-1754's case).
- **R3 — When the slot is free, list order decides.** The first surface in list order whose flag holds takes it. Ceremonies are listed before Stage surfaces, so if a rite and a story beat are both waiting, the rite goes first and the story beat waits behind it ("ceremony outranks the Stage").
- **R4 — Dialogs render over the foreground, and only the foreground's own dialogs arrive there.** A dialog-home surface that does not wait its turn renders whenever its flag holds, over whatever holds the foreground (z 60 over the Stage's 50); that is how a dialog the open moment raises itself (a card's reveal) opens over it. Every other dialog that could come due while a moment holds the foreground is kept out:
  - a gift waits while any other interrupt is open (`giftDelivery.ts:62`, THR-1809);
  - the Chapter Ledger and the court are opened from the chrome, which is guarded while the Stage is open (D7);
  - an effect choice set is raised only when a cast from the god rail's cards fires a `choice_set` effect in player mode (`useAgentInteraction.ts:141`), and those cards rest while any moment is open (THR-1875);
  - **a divine receipt waits for the foreground** (R5, `waitsTurn: 'foreground'`). A modal receipt is raised by a tick phase when one of the god's earlier acts resolves (`processPlayerReceipts`, `playerReceipts.ts:299`), or by clicking its toast (`openedReceiptId`, `GameView.tsx:3900-3907`); neither is the open moment's own. The tick-raised one is held ("What your act bought · after this") and opens when the moment closes. While a moment holds the foreground, a receipt toast's open action is guarded like the chrome (D7): it answers "Opens when this chapter closes." and opens nothing, and the receipt stays in Needs you;
  - a popup waits (R5).

  A test pins each of these facts, so a later change that lets a dialog in from elsewhere fails loudly.
- **R5 — Waiting its turn.** `waitsTurn: 'dialogs'` (the rite, the undertaking moment): may not *take* the foreground while a dialog is open. `waitsTurn: 'foreground'` (the divine receipt): renders only while no ceremony or Stage surface renders; dialogs may be open with it. `waitsTurn: 'everything'` (the event popup): renders only when nothing else renders and no undertaking moment is waiting (today's rule).
- **R6 — Held.** Every surface whose flag holds but which does not render is *held*, in list order, with the kind it waits behind.

```ts
// interruptRegistry.ts (src/engine/views/ after THR-1875's top-bar slice) — additive fields; existing fields keep their meaning
export interface InterruptSnapshot { /* …today's flags… */ cycleHarvestPending?: boolean; foregroundIncumbent?: HomedSurfaceKind | null }
export interface InterruptResolution {
  open: string[]; otherThanMomentOpen: boolean; momentMayRender: boolean; popupMayRender: boolean; anyOpen: boolean; // unchanged: stopping surfaces only
  rendering: HomedSurfaceKind[];          // every surface that renders now, stopping or not (the hosts read this)
  foreground: HomedSurfaceKind | null;    // the one ceremony or Stage surface rendering
  stage: StageHomedKind | null;         // = foreground when its home is the Stage
  held: { kind: HomedSurfaceKind; surfaceId: string; behind: HomedSurfaceKind | null }[];   // R6, in list order
}

function resolveInterrupts(s: InterruptSnapshot, entries = HOMED_SURFACES) {
  const wish = entries.filter(e => safeIsOpen(e, s));                                    // HOMED_SURFACE_OPEN_WHEN[kind]
  const dialogs = wish.filter(e => e.home === 'dialog' && !e.waitsTurn);                 // R4
  const fgWish = wish.filter(e => e.home !== 'dialog');
  const incumbent = fgWish.find(e => e.kind === s.foregroundIncumbent);                  // R2
  const free = fgWish.filter(e => !(e.waitsTurn === 'dialogs' && dialogs.length > 0));   // R5
  const fg = incumbent ?? free[0] ?? null;                                               // R1, R3
  const afterFg = fg ? [] : wish.filter(e => e.waitsTurn === 'foreground');               // R5: the receipt waits for the foreground
  const rendering = inListOrder([...dialogs, ...afterFg, ...(fg ? [fg] : [])]);
  const popup = wish.find(e => e.kind === 'event-popup');
  if (popup && rendering.length === 0 && !wish.some(e => e.kind === 'undertaking-moment')) rendering.push(popup);  // R5, as today
  const held = wish.filter(e => !rendering.includes(e))
                   .map(e => ({ kind: e.kind, surfaceId: e.surfaceId, behind: fg?.kind ?? rendering[0]?.kind ?? null }));
  const open = rendering.filter(e => e.stopsTime).map(e => e.surfaceId);                 // today's meaning
  return { open, /* the other four today-fields, derived from `open` as today */, rendering: rendering.map(e => e.kind),
           foreground: fg?.kind ?? null, stage: fg?.home === 'stage' ? fg.kind : null, held };
}
```

- **The incumbent** is the previous render's `foreground`, kept in a ref beside the `resolveInterrupts` call and passed in through the snapshot, so the function stays pure.
- **`collectHeldMoments()`** (THR-1875's interim rule in the same module) returns the resolution's `held` in THR-1875's `HeldMoment` shape, extended additively with `kind` and `behind`. Its subject resolution and `queuedAtTick` stay THR-1875's. The Needs-you producer, view model and list need no change (THR-1875's comment).
- **`open` and `anyOpen` keep counting stopping surfaces only**, so the auto-pause, `getOpenModals()` and the clock holder behave as today; the hosts read `rendering`.

| Scenario (same tick unless stated) | Today | After |
|---|---|---|
| An encounter and a premonition arrive | both render, the premonition dialog over the veil | the encounter takes the Stage; the premonition is held ("A premonition about Kael Thorne · after this") and opens when the encounter closes |
| An encounter and the day's offering arrive | the gift's auto-entry waits while the encounter is open (`giftDelivery.ts:62`); the offer waits on its pill | unchanged; the offer is a *Waiting for you* row in Needs you, read-only until the Stage closes |
| A story beat is open; a thread lands from its choice | the rite waits | unchanged (R2) |
| An aftermath closes; a rite and a story beat are both waiting | the story beat renders; the rite waits behind it | the rite renders (ceremony first, R3); the story beat is held behind it |
| An encounter is open; Meet the First becomes pending | both render | the encounter keeps the Stage (R2); Meet the First is held, then plays |
| An encounter is open when the cycle ends | the harvest covers the veil | the encounter keeps the Stage (R2); "The end of the age · after this"; the harvest plays when it closes |
| An encounter and a modal receipt (for an earlier act) arrive | both render, the receipt over the veil | the encounter takes the Stage; the receipt is held ("What your act bought · after this") and opens when the encounter closes (R4, R5) |
| An undertaking moment is showing; a receipt arrives | the moment card hides behind the receipt | the moment card keeps the Stage (R2); the receipt is held and opens after it |
| A story beat is open; the player clicks a receipt toast | the receipt opens over the beat | the toast answers "Opens when this chapter closes." (D7) and opens nothing; the receipt stays a *Waiting for you* row in Needs you and opens from there (or from its toast) after the beat |
| An encounter is minimised (Escape or *Show on map*) | the veil closes; moment interrupts are suppressed until the next tick | unchanged; the slot frees, and held surfaces that are not suppressed take it in list order |
| A popup is queued while anything is open | waits | waits (held, "A message: …") |

**Needs you (THR-1875 owns the UI).** The *Held behind this chapter* group lists `held` in order, one row per held surface, with its held line and "after this". While any moment is open, Needs-you rows are read-only ("Opens when this chapter closes."), as THR-1875 builds them; the pill and the list still open, so the god can see what is coming.

### D3 — The Stage's geometry

The **Stage layer** covers the map region: right of the god rail, below the top bar. Inside it, the **panel** sits at the gutter from the rail and the top bar, and the **window** is the open strip of map at the right edge. The panel's width is derived (THR-1819), never a token.

| | 1920 × 1080 (`fhd`) | 2560 × 1440 (`qhd`, root 18 px) | 3440 × 1440 (`uwqhd`) |
|---|---|---|---|
| Stage layer | x 320 → 1920, y 48 → 1080 (1600 × 1032) | x 400 → 2560, y 56 → 1440 (2160 × 1384) | x 400 → 3440 (3040 × 1384) |
| Panel, full layout | x 344, y 72, **1272 × 984** | x 424, y 80, **1592 × 1336** | **1592 × 1336** |
| Left column (`--stage-left-col-w`) | 340; scene art 16:9 is 191 px tall | 560; art 315 px tall | 560 |
| Right column | 932 (four 210 px cards and three 12 px gaps = 876 px, inside `--panel-padding` of 20 px a side) | 1032 (padding 22.5 px a side) | 1032 |
| Window (`--stage-window-w`) | x 1640 → 1920 (**280**), centre (1780, 564) | x 2040 → 2560 (**520**), centre (2300, 748) | **1400** |
| Panel, compact layout (`--stage-compact-w`) | **860** × 984 | **967.5** × 1336 | 967.5 × 1336 |
| Window, compact | 1920 − 320 − 860 − 48 = **692**, centre (1574, 564) | 2560 − 400 − 967.5 − 48 = **1144.5**, centre (1987.75, 748) | 2024.5 |

- **Panel width** = `calc(100vw − var(--rail-left-w) − var(--stage-window-w) − 2 × var(--stage-gutter))`; compact = `var(--stage-compact-w)`. **Height** = `calc(100vh − var(--topbar-height) − 2 × var(--stage-gutter))`, fixed for both layouts. A fixed frame keeps one chrome from the first step to the aftermath (Law 37): steps never change the panel's size under the reader. Short content leaves the panel's lower part empty; Law 57 forbids scrolling or cutting before the limit, not empty room.
- **Layout choice.** Full when the moment has scene art or a cast; compact otherwise (THR-1822 D12 `layout`).
- **The Ledger rail steps aside** while the Stage is open, completely (not to its 56 px strip). The window is the right edge of the map, which is where the Ledger rail sits; with the rail visible the window would show the rail, not the map, and the camera would centre the lit hex under it. The decision's map region (1600 / 2160 wide) and THR-1819's panel derivation both assume the space right of the god rail is the Stage's. The rail returns as the player left it (Law 51) when the Stage closes. **THR-1875 builds this** (its reply on THR-1875, 2026-10-14): the frame gives the rail a third state, `hidden` (zero width), taken while `GameScreenState.stage.phase !== 'idle'`, with precedence hidden › strip › open, applied before the camera ease. The rail is a flex sibling of the map, so the canvas widens into its place; D6's settle frames cover that, and a visible jump is kill criterion 4. The Stage only sets the phase.
- **The Inspector folds** while the Stage is open and returns with its subject when it closes (THR-1829 § 3); Full is already closed by the interrupt (THR-1827).
- **The window is measured, not computed in React.** The Stage renders the window as an element (`data-stage-window`); the camera reads its bounding rectangle after layout. That works at every tier and whatever the rails do, so no `useLayoutTier()` hook is needed.
- **Below 1920 (unsupported, THR-1819 `base`).** The window gives way first: the panel keeps at least the M dialog width (`--dialog-m-w`, 60rem) and the window takes what is left, down to nothing. With no window, the place tag still names the place (over the panel's top edge).
- **Z.** The Stage layer is `<Overlay band="stage" inset="belowTopBar" backdrop="none">` (THR-1884; `Z_BAND.stage` 50, today's veil band). The layer is transparent but takes pointer and wheel events, so the map under it holds still (D5); a click outside the panel never sets the moment down, because only Escape and *Show on map* do (THR-1724). What the player gets instead when they click, drag or scroll the map is in D5. The panel is `Panel` at level `page`. Dialogs open at 60 over it; the Needs-you drop-down and tooltips are above both.

### D4 — Inside the panel: how the Stage wraps the veil's step shells

The Stage is one frame component, `src/components/Game/stage/Stage.tsx`, with two slots (`left`, `right`) in the full layout and one (`body`) in the compact layout. A moment renders its content into the slots; it never positions itself. Each moment keeps its own Escape and close behaviour, its palette (Law 30: the panel takes the moment's palette class or variant set; no new token) and its entrance helpers.

**The encounter (S3).** `EncounterVeil` keeps its name, export and props, so its nine test files keep mounting it. What leaves is its outer frame; what stays is everything inside.

| Leaves | Replaced by |
|---|---|
| The three `createPortal(…, document.body)` roots (:719 aftermath, :1617 watched, :2069 live step) | the Stage panel; the three paths render into its slots |
| `VEIL_ROOT_INSET`, `position: fixed`, the opaque `--veil-void` cover over the whole screen | the Stage layer; `--veil-void` becomes the **panel's** ground, so the map shows around it |
| The 52% / 65% content column, `VEIL_COLUMN_TOP_INSET`, the 220 px side column (`SCENE_SIDE_COLUMN_PX`) | the two columns of D3 |
| Every `maxWidth: 540` and `maxWidth: 500` block, and `SCENE_PROSE_MAX_WIDTH_PX = 760` | blocks fill their column; prose caps at `--measure-prose` (680 px at 1080p, 765 px at 1440p) |

| Veil element (today) | Stage column |
|---|---|
| Scene art (`encounterIllustration`), 16:9 | **left**, top: the hero illustration (Law 7) |
| `CastStrip` (:3133) | **left**, under the art: portraits, tooltips and links (Laws 1, 21) |
| `FalloutPreview` (:3265) — *At stake* | **left**, under the cast (THR-1724: the cast and *At stake* together, apart from the prose) |
| `StepNavigator` (:3477), title row with `NudgeReadingMarks`, `ContextStrip` (:3306) with `NudgeBalance`, `OpponentHeader`, `EncounterStakesLine` | **right**, top: the Law 37 identity header, then the stakes line |
| Scene prose (`NarrativeSegments`), factor lines | **right**, middle; this region scrolls inside the column only at the panel's height (Laws 33, 57) |
| The move: `ChapterAnsweringCard`, or `NudgePhaseShell` (the hand, rows of four), or `ChoiceBlock` + `StageCommit` | **right**, foot; the commit bar stays pinned at the column's foot, as today |
| Aftermath: `StepNavigator`, `ContextStrip`, outcome word, consequence chips, legend, reactions, afterimage, close button | **right**; art, cast and *At stake* stay on the left, so the ending says what it is the ending of (Law 37). The close button reads **Continue** |
| Watched view ("This encounter runs in the background") | **right**, same panel; art and cast left |
| *Show on map* (in `ContextStrip`) | unchanged: it minimises; the camera keeps the place in view (D6) |
| `useEscapeLayer(open, leaveVeil, ENCOUNTER_VEIL_Z)` | unchanged; the band constant becomes `Z_BAND.stage` (same 50) |

A five-card hand at 1080p is a row of four and a row of one, 876 px wide in a 932 px column (the decision's measured 1080p render). If a real hand of seven or more pushes the scene off the panel at 1080p, the left column narrows to 300 px before the hand shrinks (decision, *Would change the call*).

**The other Stage moments keep their own words.** Only their `Modal` wrapper is replaced by the Stage slots; their body components stay.

- **Story beat** (S2), **journey moment** and **undertaking moment** (S4): compact. A header (the existing title), one new context line from the Stage view model, then the existing prose and choices or acknowledgement. The context line is "{subject} at {place}"; with no place known (a story beat queued without a hex) it is "{subject}" alone; with no subject it is "At {place}"; with neither it is not rendered. The subject and the place each carry their tooltip and link.
- **Premonition** (S4): full. Left: the mortal's existing subject block (portrait, name with its tooltip). Right: the existing header ("A Stirring in the Thread" / "The God's Will"), the dream, the options, and the existing dismiss ("Let the dream fade" / "Release your hold — let them choose"). It keeps `closeOnEscape={false}`.
- **Emergence dilemma** (S4): full when its ruin has art, else compact; its words unchanged.
- `JourneyVignetteModal`'s dead `size="md"` prop goes with its `Modal`.

### D5 — The map under the Stage: the dim and the lit-hex ring

A new HexMapV2 layer, `scene/StageFocusLayer.ts`, built when the Stage opens and disposed when it closes (the `DominionLensLayer` pattern: never hidden by alpha), driven by one additive handle call, `setStageFocus(focus: StageMapFocus | null)`.

```ts
export interface StageMapFocus {
  lit: HexKey[];                                                   // the scene hex (0 or 1)
  options: { hexKey: HexKey; tone: 'whisper' | 'compulsion'; ringOnly: boolean; hovered: boolean }[];  // premonition places
  strength: number;                                                // STAGE_MAP_DIM
}
```

- **The dim.** One near-black hex plate (`DOMINION_DIM_COLOR`, the lens grammar's colour, imported; if THR-1878 hoists a shared lens dim name, that name) over **every hex except the lit ones**, at `STAGE_MAP_DIM = 0.7`. Never a hue. It sits **above** the map's agents, armies, events and canvas labels (new `RENDER_ORDER.STAGE_DIM = 12.5`, between `LABELS` 12 and `FOG` 13), because under the Stage the map is the backdrop: a bright marker on a dimmed hex would compete with the panel. The lit hex has no plate, so its terrain, its place and the subject's medallion keep full colour.
- **The ring.** A parchment line on the lit hex's six edges (`--text-primary`, read through `cssVarColor`, the `BorderMesh` edge helpers) plus a soft additive glow in the same colour (the `HexPulseMesh` pattern). **Never gold**: gold on the map is the Dominion frontier (THR-1831). Rings draw above the fog (`RENDER_ORDER.STAGE_RING = 13.5`) so a ring is visible even where fog covers the terrain.
- **Premonition options (S4).** Each option's place gets a dashed ring in its dream tone (`--premonition-whisper-*` / `--premonition-compulsion-*`), shown while that option is hovered or focused. An option in fog is `ringOnly`: the ring draws over the fog and reveals no terrain.
- **The lens is suppressed, not switched off** (THR-1878's contract). The Stage sets `lensSuppressed` in `GameScreenState` while a moment holds the map; the lens layer hides (two dims never compose, THR-1830), the lens bar keeps its pressed state, and the lens returns when the moment ends. The lens bar itself sits top-left of the map canvas, under the Stage panel.
- **The map's HTML overlays and the map controls hide** while the Stage is open: the location and region labels, the agent pulse and the hex tooltip (the place tag names the place instead), and the bottom-right map controls, which sit inside the window and would do nothing on an inert map (Law 25).
- **The map holds still** under the Stage: the Stage layer takes pointer and wheel events, so the lit hex cannot be panned out of the window. Every input on the map still answers within one `--anim-fast` (Law 47, PC-8):
  - **The lit hex** is a real control. The Stage places a transparent hex-shaped button over it (`data-stage-lit-hex`, positioned from the camera's `litHexScreen`, ≥ 24 px hit area, Law 46). Hovering it shows the place's tooltip, the same as the place tag's name; clicking it opens the place's land page in the Inspector over the Stage (D7's rule for a name clicked on the Stage); it is reachable by Tab after the panel's controls.
  - **A drag, a wheel or a click anywhere else on the dimmed map or the window** shows one line under the place tag for `STAGE_MAP_HINT_MS` (2000 ms): **"The map holds still while this moment is open."** During an encounter, which can be set down, the line adds **"Show on map lets you look around."** The other Stage moments are short and have no *Show on map* today; they close with their own buttons, after which the map is free.
  - The line is a status message (`role="status"`), so a screen reader hears it once, and it does not repeat while it is showing.
- **The place tag.** A small label at the top of the window, centred, clear of the lens bar's corner (top-left of the map, under the panel) and the map controls' corner (bottom-right): **"{place} · where it is happening"** (`StageVM.placeTag`, words in `src/data/view-content.ts`). `{place}` is the hex's name by THR-1822's one naming rule (the most notable Location, else the land's name), and it is a link with its tooltip (Laws 1, 21). A premonition reads **"{place} · where {subject} is"**, and while an option is hovered, **"{option place} · where the dream pulls"**.
- **No hex known** (THR-1822 D12 `litHex: null`): nothing is lit, the whole map dims, no place tag, and the camera stays (fail-soft).

### D6 — The camera: ease in, cut under reduced motion, keep the place in view

**Opening sequence** (S2):

1. The resolution names a Stage moment. The world is already paused by the registry.
2. `StageHost` mounts the Stage in phase `entering`: the layer and the window are present, the panel is not shown. The Inspector folds and the Ledger rail steps aside in the same render, so the window's rectangle is final.
3. After `STAGE_LAYOUT_SETTLE_FRAMES` (2) animation frames (the map canvas may resize as the rails move), the camera reads the window's rectangle and moves so the frame (`StageVM.frame`: the lit hex, or for a premonition the lit hex and every option's place) sits at the window's centre. At the same time the dim fades in over `STAGE_DIM_FADE_MS` (= `JUMP_TO_DURATION_MS`, 500 ms).
4. When the camera lands (the transition's end event), or after `STAGE_CAMERA_SETTLE_TIMEOUT_MS` (800 ms) if it never reports, the panel enters on the ceremonial motion tier (Law 41: the veil's entrance helpers, `ceremonialDelay` / `ceremonialDuration`), and keyboard focus moves into the panel (Law 50).

- **Zoom.** Keep the player's zoom k when the place is legible there: `STAGE_CAMERA_KEEP_MIN_K` (5, where place labels appear, THR-1831) ≤ k, and the hex is no wider than `STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION` (0.8) of the window. Otherwise use `FOCUS_ZOOM` (10, THR-1831; a 200 px hex, 71% of the 280 px window). A premonition frames the mortal's place and every option's place only if all of them fit the window at k ≥ `STAGE_CAMERA_KEEP_MIN_K`; otherwise it frames the mortal's place alone.
- **The camera call.** One additive handle method, `centerHexesAt(hexKeys, screenPoint, { zoom, instant }): Promise<'eased' | 'cut' | 'stayed'>`, on top of `animateCameraTo` with a screen offset and an end callback. `centerOn` is unchanged.
- **Reduced motion** (Law 44): the camera cuts (duration 0), the dim appears at once, and the panel fades in at `--anim-fast` (the ceremonial helpers already collapse to that). No information is carried by the motion alone: the ring and the place tag say where.
- **Between steps of one encounter** the camera does not move unless the step's hex changes; then it eases (or cuts) to the new hex with the panel already open.
- **When the Stage closes, the camera never goes back to where it was** (THR-1829 § 5). It keeps its zoom and the place. One refinement the decision's renders could not show: the returning Ledger rail (and the Inspector, if it returns docked) covers the right edge of the map, which is exactly where the window was. So if the place would land under returning chrome, the camera eases the smallest distance that keeps the place inside the visible map (same zoom, 500 ms, or a cut under reduced motion). Otherwise it does not move.
- **Show on map** keeps today's call (it minimises, then centres the hex in the visible map at zoom 20).

### D7 — The frame while the Stage is open

`GameScreenState.stage.phase !== 'idle'` (THR-1881's shared context) is the one flag the Stage owns. The frame already reacts to every open interrupt on its own (THR-1875); the Stage adds only what is specific to it.

| Surface (owner) | While the Stage is open |
|---|---|
| God rail (THR-1875, [THR-1894](https://linear.app/threadbare/issue/THR-1894)) | THR-1875's rule for every interrupt, unchanged by the Stage: identity and essence stay readable (a spend visibly moves its pool, Law 47); the "Your cards" section dims and swallows presses with one line. During an encounter: **"Your cards wait. This encounter deals its own hand."** During any other moment: **"Your cards wait while this moment is open."** This refines THR-1829 § 3's string ("Your hand is in play on the Stage"): the rail holds the god's map cards, while an encounter plays its own hand of nudge cards dealt from the god's Repertoire (UL `Encounters.md` § Repertoire), and THR-1829 itself rejected "the god rail's hand plays into the encounter". THR-1829's words would tell the player the rail's cards are in play when they are not (PC-6) |
| Top bar (THR-1875; guard today `GameViewTopBar.tsx:328-338`) | The guard that dims and swallows the right group while an encounter is open now applies to **every Stage moment**, and also covers Find (its results would open over the moment). Time stays live and names the pause (Law 52); its holder words come from the list |
| Needs you (THR-1875) | Opens and lists; rows read-only during any moment (THR-1875) |
| Toasts that open a receipt (`ToastStack`, the `openedReceiptId` path) | While a moment holds the foreground, the toast's open action is guarded like the top bar: a click answers within one `--anim-fast` with the sanctioned rejection (`.anim-shake-no`) and the tooltip "Opens when this chapter closes.", and opens nothing (S1) |
| Ledger rail (THR-1875, [THR-1893](https://linear.app/threadbare/issue/THR-1893)) | Steps aside completely (D3) through THR-1875's `hidden` state, keyed on the Stage's phase; restored as the player left it. The Stage only sets the phase |
| Inspector (THR-1876) | Folds; returns with its current subject when the Stage closes |
| A name clicked on the Stage (THR-1876's router) | Opens that page in **the Inspector, docked, over the Stage's right side** (`Z_BAND.modal`, no backdrop, below the top bar). Escape or its close returns to the moment, which never closed. A click therefore always answers (Law 21, PC-8) without leaving the moment. When the Stage later closes, the Inspector keeps the last subject opened |
| Map lens bar (THR-1878) | `lensSuppressed` set: the lens layer hides, the bar keeps its pressed state, the lens returns on close |
| Map controls and HTML overlays (THR-1878, THR-1881's `GameMap`) | Hidden (D5) |

**Escape order** while the Stage is open, topmost first: an open dialog → the Inspector over the Stage → the Stage moment's own Escape (the encounter minimises; the others keep today's behaviour, and the premonition keeps ignoring Escape). `__DEBUG.getEscapeLayers()` (THR-1884) is the assertion.

### D8 — Time

Unchanged (THR-1829 § 6). Every pause-tier moment stops the world through the registry (Law 39, THR-1605); the top bar names it (Law 52); minimise and the badge route are THR-1724 / THR-1730's. The Stage adds no pause and removes none. Held surfaces are already inside the run of interrupts, so the clock does not run between one moment closing and the next opening. `open` and `anyOpen` still count stopping surfaces only, so the cycle harvest taking part in the foreground changes nothing about the clock.

### D9 — Where it is built: hosts, the view model, and the build order

- **Host.** The Stage is built into `src/components/Game/hosts/StageHost.tsx`, which THR-1881 creates (step 2c) with today's mounts unchanged. `StageHost` renders at most one Stage moment (the resolution's `stage`) inside `Stage`. THR-1881 must place `HarvestScreen` in `CeremonyHost` and `WarmStartOverlay` in `DialogHost`, the list's homes (noted on THR-1881).
- **The map side** lives in `GameMap` (THR-1881 step 2d), not in `StageHost`: `GameMap` reads `stage.focus` from `GameScreenState`, hides its overlays and controls, calls `setStageFocus` and the camera, and writes `stage.cameraSettled` back. `StageHost` never holds a map handle.
- **`GameScreenState.stage`**: `{ kind: StageHomedKind | null; phase: 'idle' | 'entering' | 'open' | 'closing'; focus: (StageMapFocus & { frame: HexKey[]; windowRect: DOMRectInit }) | null; cameraSettled: boolean; inspectorOverStage: boolean }`, plus THR-1878's `lensSuppressed`, which the Stage sets while `phase !== 'idle'`.
- **The view model** (THR-1822 D12, built at S2 in `src/engine/views/stage/stageView.ts`, selector id `stage`, world-keyed). Three refinements, each to keep one vocabulary: D12's `StageMomentKind` becomes `StageHomedKind`, **derived** from the list (not a second hand-kept union); the encounter's step and aftermath are one kind with a `phase: 'step' | 'aftermath' | 'watched'` field instead of two kinds; `palette` takes the list's palette names (`'encounter' | 'divine' | 'story' | 'elder' | 'gain'`, the existing `DialogContextName` taxonomy) rather than D12's draft names. `placeTag` and the compact context line are built here from `hexContents` and the one naming rule.
- **The pure builders move** into `src/engine/views/stage/` at the slice that touches their surface (THR-1822 D16 step 5): the encounter adapters, `chipCollaborators.ts`, `narrativeLinker.ts` and `lair/buildLairMonsterCardModel.ts` at S3; `momentCardModel.ts` at S4; each with a one-line re-export at its old path.
- **Order** (THR-1822 D16: the Stage goes last): THR-1881 (hosts) → **S1 (THR-1877)**, which may land before or after THR-1875's top-bar slice (D2 notes) → the lens build (THR-1878), the Inspector build (THR-1876) and the frame builds (THR-1875, THR-1893, THR-1894) → **S2** → **S3** → **S4**.

### D10 — Help copy that points at moved surfaces

There is no tutorial system (no step lists, coach marks or `data-tutorial` attributes). These are the player-facing lines that describe where a moved surface appears or how to leave it:

| Where | Today | After | Slice |
|---|---|---|---|
| Aftermath close button, `EncounterVeil.tsx:1596` | "Return to the world" | **"Continue"** (the world never left the screen) | S3 |
| `public/interface-reference.html:285` section lead | "the interface steps forward: the veil, the choice set, the vignette" | "the map dims and the place where it happens stays lit beside the Stage; a choice the god must make opens as a dialog" | S3 |
| `public/interface-reference.html:288` | **Encounter Veil** — "The overlay for an encounter you are watching in progress — the framed chapter given the screen's full attention." | **The Stage** — "A mortal's moment at a place: an encounter, a story beat, a journey moment, an undertaking moment, a premonition or a ruin's emergence. It plays beside the god rail, over the dimmed map, with the place lit in a window of open map." | S3 |
| `public/interface-reference.html:290` | **Journey-Vignette Modal** — "…popped forward as a short authored moment…" | row removed; journey moments are on the Stage row above | S4 |
| `public/interface-reference.html:329, 333` cross-links | "the Encounter Veil (curated moment)"; "Encounter Veil, Choice-Set Modal, and the aftermath feed" | "the Stage (curated moment)"; "the Stage, the effect choice dialog, and the aftermath" | S3 |
| `public/interface-reference.html:331` | "Threads Panel, Thread Detail, and the journey-vignette modal." | "…and journey moments on the Stage." | S4 |
| `src/data/ia-manifest.ts:842, :860` (developer manifest, not player-facing) | "Journey-beat vignette popup."; `game.encounter-veil` mount `modal`, "Encounter-in-progress overlay (watched mode)." | "Journey moment on the Stage."; mount `stage`, "An encounter on the Stage (steps, aftermath, watched)." | S3 / S4 |

**Unchanged on purpose:** THR-1875's rail lines ("Your cards wait. This encounter deals its own hand." / "Your cards wait while this moment is open.": as true on the Stage as under the veil); "A chapter of {theirPossessive} story is waiting →" (`ui-content.ts:30`, it now also eases the camera); `ui.encounter_waiting` ("This moment waits for you. Open it to play your hand, or let fate decide.": minimise still exists); `TOPBAR_LOCKED_SUFFIX` "Opens when this chapter closes." (the guard still exists, now for every Stage moment); `CHAPTER_ANSWER_BACK_LABEL` "Back to the map" (it still closes to the map); *Show on map*; `public/encounters-manual-reference.html:217` ("A moment you set down (Escape, or Show on map) waits for you"). The page-layout rows of `interface-reference.html` (:209–222, "the action drawer… along the bottom") describe the frame and are THR-1875's to rewrite.

## Engine pillar

### Systems design

- **E1 — `src/data/homed-surfaces.ts`** (new, S1): the list (D1), its types (`HomedSurfaceKind`, `HomeId`, `StageHomedKind`, `DialogHomedKind`, `CeremonyHomedKind`, `HomedSurfacePalette`, `HomedSurfaceEntry`), and a pure helper `heldLineFor(kind, slots)` that fills `{subject}` / `{title}` or falls back to the holder words.
- **E2 — the hold rule** (S1): `resolveInterrupts` and `collectHeldMoments` per D2, wherever the registry lives at claim time (`src/components/Game/` today; `src/engine/views/` after THR-1875's top-bar slice). Pure; the incumbent comes in through the snapshot.
- **E3 — `src/engine/views/stage/stageView.ts`** (S2): `StageVM`, `resolveMomentHexes` (THR-1822 D12 with D9's refinements), the place tag and the compact context line, registered in `VIEW_SELECTORS` as `stage` (world-keyed; key = kind + subject ids + hex). Read-only.
- **E4 — moved builders** (S3, S4): see D9.

### Graph nodes / edges

None added. Reads only: `located_at` (through `hexContents` and `resolveToParentLocation`), the ruin's Location, the premonition options' `locationId`.

### Tick phases

None. The hold rule runs on render; the Stage view model runs on read. Nothing runs inside `runTick`.

### Resolution logic

The hold rule (D2) and the lit-hex order (beat hex → the subject agent's Location → the ruin's Location → nothing). Both are pure and deterministic.

### PRNG callouts

None. No randomness anywhere in this plan.

## Content pillar

### Encounter templates

N/A — no encounter is added or changed. Every encounter's words stay; they move to a new panel.

### Prose tables

N/A — no prose table changes. The aftermath, scene and stakes lines are unchanged.

### Attachment content

N/A — no attachment changes.

### Data tables

- **C1 — `src/data/homed-surfaces.ts`** (S1): the list's words. The holder names are moved from `INTERRUPT_HOLDER_NAMES` unchanged; the held lines are new (D1 table).
- **C2 — `src/data/stage-content.ts`** (S2): the Stage's tunables (§ Constants).
- **C3 — `src/data/view-content.ts`** (S2; created by THR-1822's first family that needs a word, or by S2 if none has): the place-tag templates and the compact context line template.
- **C4 — help copy** (S3, S4): D10.

## UI pillar

*Screenshot tools: both. **Claude-in-Chrome** for anything with the map (the dim, the ring, the camera, the window: WebGL that DOM snapshots cannot see). Its `resize_window` is inert, so every capture states the measured `innerWidth` × `innerHeight`; where the pane cannot reach 2560 × 1440, use Playwright's `browser_resize` (it renders WebGL in this repo's setup; check one known-good frame first). **Playwright** for DOM assertions (`getStage()`, `getInterruptState()`, `getEscapeLayers()`) and the reduced-motion arm (`emulateMedia({ reducedMotion: 'reduce' })`).*

*UI Laws this surface engages: 1 and 21 (every name on the Stage carries image, tooltip and link; the place tag too), 7 (the hero illustration belongs to the stage), 13/14 (no numbers or keys; nothing new is numeric), 17 (tooltips), 22 (the place is on the map, lit), 23 and 50 (Escape order, focus moves in and back), 25 (inert map controls hide), 26 (the home is chosen by what the moment is about), 30 (palettes move to the panel), 33 (one viewport), 35 (z from the table: `stage` 50, `modal` 60), 37 and 38 (one chrome, fixed order), 39 and 52 (pause-tier, time named), 41 and 44 (ceremonial tier, reduced motion), 47 (a spend moves its pool), 49 (one at a time, the rest held and named), **57** (the panel's frame is its limit; no inner scroll box or count cut below it), **58** (one list keyed by kind, a named test, a plain fallback, an `extending.md` row).*

### Player-facing display

- **A moment at a place** (an encounter, a story beat, a journey moment, an undertaking moment, a premonition, a ruin's emergence) opens on the Stage: the map dims to near-black, the camera eases so the place sits in a window of open map at the right edge, the place's hex keeps its colour with a parchment ring, and the panel enters beside the god rail. Art, cast and *At stake* are on the left; the header, scene, forecast and hand are on the right. A story beat, a journey moment and an undertaking moment use one narrower column and a wider window.
- **The god's own business** (gifts, receipts, effect choices, popups, the Chapter Ledger, the court) still opens as a dialog, at its THR-1820 tier.
- **Who the god is becoming** (Meet the First, the Threading Rite, the end of a cycle) stays full screen.
- **One at a time.** A second moment that arrives waits; Needs you names it, "after this".
- When the Stage closes, the map stays on the place where the moment happened.

### Player-facing text

New or changed words only. Every other word on the moved surfaces is unchanged, including the premonition's ("A Stirring in the Thread", "The God's Will", "Let the dream fade", "Release your hold — let them choose").

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Place tag over the window (S2) | "Millbrook · where it is happening" (rendered sample); premonition "Millbrook · where Maren Ashfold is", hovering an option "Corran Fields · where the dream pulls". "Millbrook" carries its tooltip and opens its page | PC-2, PC-6 | the lit hex is named in words, so the ring needs no legend (Law 12); the name is the same one the land page and Find use, because all three read one naming rule (THR-1822) |
| Compact header context line (S2, S4) | "Maren Ashfold at Millbrook"; with no place known "Maren Ashfold"; with no subject "At Millbrook"; with neither, no line | PC-7, PC-3 | whose moment it is and where, before the prose starts; an empty slot drops its words instead of leaving "at" hanging or printing a `{token}` |
| The map while the Stage is open (S2) | after a drag, wheel or click on the map: "The map holds still while this moment is open."; during an encounter: "The map holds still while this moment is open. Show on map lets you look around." Hovering the lit hex: the place's tooltip; clicking it opens the place's page | PC-8 | the map looks live and is held still on purpose; every input on it gets a reply, and the line names the one way to look around when there is one |
| God rail's cards during an encounter (THR-1875's words, kept) | "Your cards wait. This encounter deals its own hand." | PC-6, PC-8 | the rail's header reads "Your cards" and the line uses the same word; the hand on the Stage is the encounter's own, so the player never thinks the rail's cards are being played, and the dimmed cards say why they do not answer |
| God rail's cards during any other Stage moment (THR-1875's words, kept) | "Your cards wait while this moment is open." | PC-6, PC-8 | same word as the header; the cards say why they do not answer, and when they will |
| Top bar's guarded group and Find, on hover (S2); a receipt toast clicked during a moment (S1) | "Opens when this chapter closes." (existing `TOPBAR_LOCKED_SUFFIX`) | PC-8 | a dimmed control says why it is not answering, and when it will; the toast shakes once so the click visibly answered |
| Needs you, *Held behind this chapter* (S1 words; THR-1875 renders them) | "A premonition about Kael Thorne · after this"; "The Unsafe Bridge, with Maren Ashfold · after this"; "The threading rite with Hale the Younger · after this"; "The end of the age · after this"; with no subject known: "A premonition · after this" | PC-5, PC-4 | what is waiting and in what order; nothing stacks and nothing vanishes (Law 49) |
| Aftermath close (S3) | "Continue" (was "Return to the world") | PC-8 | the ending closes and the map, already on screen, stays on the place |
| `HomedSurfaceFallback` (S1; never expected in play) | title "A story beat" (the kind's clock-holder words), body "This moment has no screen yet.", button "Continue" | PC-8 | a moment with no screen still answers, and the game carries on |
| Help pages (S3, S4) | D10's "After" column | PC-7 | the manual describes the screen the player sees |

The clock holder in the top bar ("paused · The Unsafe Bridge", "held by a premonition · …") keeps today's words; they now come from the list.

### Playtest signal

A tester who plays through an encounter can say, without opening anything else, where on the map it happened; and a tester never sees two moments on screen at once and can say what is waiting next.

### Event notifications

None added. The Stage presents existing moments; alerts, toasts and chronicle lines are unchanged.

### Debug inspection (DebugPanel)

- **`__DEBUG.getInterruptState()`** (S1, additive): `rendering`, `foreground`, `stage`, `held: { kind, surfaceId, behind }[]`, and `homedSurfaces: { kind, surfaceId, home, stopsTime }[]` (the list as data).
- **`__DEBUG.openHomedSurface(kind: HomedSurfaceKind): Promise<{ opened: boolean; reason?: string }>`** (S2, completed by S4): one lever per kind through a `Record` over `HomedSurfaceKind`, routing to the existing levers (`forcePremonition`, `forceMoments`, `openThreadingRite`, `forceOffering`, an encounter through `?forceencounters` or the spawn path) and adding the three missing ones (story beat, journey moment, emergence dilemma). A kind without a lever is a type error.
- **`__DEBUG.getStage(): Promise<DebugStageState>`** (S2):

```ts
interface DebugStageState {
  open: { kind: StageHomedKind; surfaceId: string; phase: 'entering' | 'open' | 'closing'; layout: 'full' | 'compact' } | null;
  vm: StageVM | null;                       // exactly what the Stage was given
  held: { kind: string; behind: string | null }[];
  panelRect: { x: number; y: number; w: number; h: number } | null;
  windowRect: { x: number; y: number; w: number; h: number } | null;
  litHexScreen: { x: number; y: number } | null;   // the lit hex's centre on screen now
  litHexInWindow: boolean;                          // the camera assertion
  camera: { k: number; mode: 'eased' | 'cut' | 'stayed' | 'timed_out' } | null;
  mapDim: { strength: number; lit: number; dimmed: number } | null;
  folded: { inspector: boolean; ledgerRail: boolean; lensSuppressed: boolean; mapControlsHidden: boolean };
  scrollingBelowCap: { element: string; axis: 'x' | 'y' }[];   // Law 57: scroll boxes inside the panel that scroll while the panel is below its height. Empty when lawful
}
```

- The `ui_stage` trace (§ Tracing) shows in the trace viewer with tracing enabled.

### Visual presence (HexMapV2)

`StageFocusLayer` (D5): the dim plates, the lit ring and glow, the premonition option rings; two new `RENDER_ORDER` / `LAYER_Z` rows (`STAGE_DIM` 12.5, `STAGE_RING` 13.5). The camera method of D6. `snapshotScene().layersActive` lists `stage_focus` while the Stage is open.

## Interface impact

The Stage reads across subsystems and writes nothing cross-system.

| Contract | Change | Where |
|---|---|---|
| Interrupt registry → the god's attention (Attention & Chronicle, ⚪ UNAUDITED) | **extend**: the registry's producer becomes the home list (derived, same surfaces); new fields `rendering`, `foreground`, `stage`, `held`. Consumers preserved: `useInterruptAutoPause`, `getOpenModals()`, the clock holder, the moment and popup gates. New consumer: the Needs-you view model's held group (THR-1875, through `collectHeldMoments`) | `homed-surfaces.ts` → `interruptRegistry.ts` → `needsYou.ts` |
| Encounter header hex / queued story beat hex → camera (Encounters core, ⚪ UNAUDITED; THR-1822 row) | **extend**: new consumer `resolveMomentHexes` (S2 story beat, S3 encounter); the gate-duty adapter becomes a producer of `hexCol/hexRow` (S3) | `encounter-stage/types.ts:89-90`, `types/attention.ts:123-125` → `stage/stageView.ts` |
| Premonition compulsion options' `locationId` → the map (S4) | **extend**: new read-only consumer (option rings and camera frame) | `types/premonition.ts` → `stage/stageView.ts` |
| Emergence `ruinId` / mortal `located_at` → the map | **extend**: read-only consumers through `hexContents` | `delveTypes.ts`, graph → `stage/stageView.ts` |

No new cross-system write, so no row is added to `scripts/interface-contracts.ts`; THR-1822's step-5 row (encounter hex → camera) is registered when S3 ships its consumer.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/data/homed-surfaces.ts` (S1) | none | `StageHost`, `DialogHost`, `CeremonyHost`; derived `HOMED_SURFACE_OPEN_WHEN`, `INTERRUPT_SURFACES`, `INTERRUPT_HOLDER_NAMES`, `DIALOG_CONTEXT_SURFACES`, `CEREMONY_SURFACES` | none | — | `getInterruptState().homedSurfaces` |
| `resolveInterrupts` hold rule + `collectHeldMoments` (S1) | none (render) | the three hosts; `useInterruptAutoPause`; Needs you (THR-1875) | reads the pending fields it reads today, plus `harvestResult` (as `cycleHarvestPending`) | `ui_stage` (`held`, `fallback`) | `getInterruptState().rendering / foreground / stage / held` |
| `HomedSurfaceFallback` (S1) | none | the three hosts' default case | none | `ui_stage` `fallback` | `getInterruptState()` |
| `stage/stageView.ts` (S2) | none (read) | `Stage` | `graph`, `visibilityMap`, `pendingPremonition`, `pendingEmergenceDecision`, story-beat queue | `view_fallback` (THR-1822) | `getView('stage', input)`, `getStage().vm` |
| `components/Game/stage/Stage.tsx`, `useStageCamera.ts` (S2) | none | `StageHost` | none | `ui_stage` (`opened`, `closed`, `minimised`) | `getStage()` |
| `GameScreenState.stage` + `lensSuppressed` (S2) | none | `GameMap`, `LedgerRail`, top bar, Inspector, lens host | none | — | `getStage().folded` |
| `HexMapV2/scene/StageFocusLayer.ts` + handle methods (S2) | none | `GameMap` → `HexMapV2` | none | — | `getStage().mapDim`; `snapshotScene().layersActive` |
| `__DEBUG.openHomedSurface` (S2, S4) | none | — | writes the same pending fields the existing levers write | the surface's own traces | itself |
| Help copy (S3, S4) | none | `public/*.html`, `ia-manifest.ts` | none | — | — |

Prose pipeline: no `enrichProse()` call is added; the held lines, the place tags and the compact context line are filled by plain slot replacement with a fallback for every empty slot (no `{token}` can survive). Player controls: one new control, the lit-hex button (hover: tooltip; click: the place's page over the Stage). Changed controls: the aftermath's close reads "Continue"; a name clicked on the Stage opens the Inspector over it; the top bar's guarded group and Find do not open anything while the Stage is open; the map controls hide; a drag, wheel or click on the held map shows the hold line.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `HOMED_SURFACES` (`src/data/homed-surfaces.ts`) | the 16 rows of D1 | which home each surface takes, its render priority, its words |
| `STAGE_MAP_DIM` (`src/data/stage-content.ts`) | 0.7 | the dim's alpha over every unlit hex (THR-1829) |
| Dim colour | `DOMINION_DIM_COLOR` `#0b0907`, imported (or THR-1878's shared lens name) | the lens grammar's near-black; never re-typed |
| `STAGE_RING_COLOR_VAR` | `'--text-primary'` | parchment, never gold |
| `STAGE_RING_WIDTH_FRACTION` | 0.06 (of the hex radius) | ring line width; checked at k 5 and k 10 in the S2 screenshots |
| `STAGE_GLOW_ALPHA` | 0.35 | the lit hex's soft glow |
| `STAGE_OPTION_RING_DASH` | `{ dash: 0.18, gap: 0.12 }` (of an edge) | the premonition option ring |
| `STAGE_DIM_FADE_MS` | `CAMERA_CONSTANTS.JUMP_TO_DURATION_MS` (500) | dim fade-in, timed with the camera ease; 0 under reduced motion |
| `STAGE_CAMERA_KEEP_MIN_K` | 5 | lowest zoom at which the player's zoom is kept (place labels appear, THR-1831) |
| `STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION` | 0.8 | above this hex width in the window, the camera uses `FOCUS_ZOOM` |
| `FOCUS_ZOOM` | 10 (THR-1831; added to `CAMERA_CONSTANTS` by S2 if THR-1878 has not) | the one centring zoom |
| `STAGE_CAMERA_SETTLE_TIMEOUT_MS` | 800 | the panel enters even if the camera never reports landing |
| `STAGE_LAYOUT_SETTLE_FRAMES` | 2 | animation frames the camera waits after the rails move before it reads the window's rectangle |
| `STAGE_MAP_HINT_MS` | 2000 | how long "The map holds still while this moment is open." shows after an input on the map |
| `RENDER_ORDER.STAGE_DIM` / `STAGE_RING` | 12.5 / 13.5 (with matching `LAYER_Z`) | the dim above labels and below fog; rings above fog |
| Tokens (THR-1819) | `--stage-gutter` 24 · `--stage-window-w` 280 / 520 / 1400 · `--stage-left-col-w` 340 / 560 · `--stage-compact-w` 53.75rem · `--measure-prose` 34em | the geometry of D3; no literal widths in the Stage |
| `Z_BAND.stage` / `Z_BAND.modal` (THR-1884) | 50 / 60 | the Stage; dialogs and the Inspector over it |
| `CARDS_PER_ROW` (existing) | 4 | the hand's rows on the Stage |

## Tracing

One new category, registered like THR-1822's `view_fallback` (the THR-928 trio): `StageTrace` joins `src/types/traces/ui-traces.ts` (`UiTrace`, `UI_TRACE_CATEGORIES`), and `'ui_stage'` joins `TraceCategory` and `TRACE_CATEGORIES` in `src/types/trace.ts`, so `trace-vocabulary.test.ts` and the DebugPanel filter see it. Emitted through `emitTrace` from `traceBuffer.ts` (the `useRefRouter` path), only on transitions, never per render. S1 emits `held` and `fallback`; S2 adds the rest.

```ts
// StageTrace — emitted when a surface takes, leaves or waits for the foreground, or falls back
interface StageTrace {
  category: 'ui_stage';
  tick: number;
  action: 'opened' | 'held' | 'closed' | 'minimised' | 'fallback';
  kind: HomedSurfaceKind;
  behind?: HomedSurfaceKind | null;                            // for 'held'
  litSource?: 'beat' | 'agent_location' | 'ruin_location' | null;
  litHex?: string | null;                                      // "13,9"
  camera?: 'eased' | 'cut' | 'stayed' | 'timed_out';
  layout?: 'full' | 'compact';
  summary: string;  // "ui_stage: opened story-beat — lit 13,9 from beat, camera eased"
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| An open predicate throws | today's rule: treated as closed, warned once (`safeIsOpen`) |
| A kind reaches a host with no case | `HomedSurfaceFallback`: its holder words, "This moment has no screen yet.", Continue; Continue skips the kind until its flag turns false once, so the clock is never held forever; warn and trace once |
| The incumbent named in the snapshot is no longer wished | ignored; the slot goes by list order |
| A held line's `{subject}` or `{title}` has no value | the kind's clock-holder words in sentence case ("A premonition") |
| The compact context line has no place or no subject | "{subject}" alone, or "At {place}", or no line (D4) |
| The lit hex's screen position is unknown (camera timed out, no map) | no lit-hex button; the place tag's name is still a link |
| No hex resolves (no beat hex, no subject, no Location) | nothing lit, the whole map dims, no place tag, the camera stays; `view_fallback` `no_hex` once (THR-1822) |
| The Stage view model throws | `readView`'s fallback: `litHex: null`, layout from the moment's art and cast, palette from the list |
| The camera never reports landing (map not mounted, WebGL lost) | the panel enters after `STAGE_CAMERA_SETTLE_TIMEOUT_MS`; trace `camera: 'timed_out'` |
| No map handle at all (map not mounted) | the panel opens over the dark map region; no dim, no ring, no camera |
| The window has no width (viewport below 1920) | no camera move; the place tag still names the place |
| A premonition option's Location has no hex | that option lights nothing; the others still do |
| No lens host reads `lensSuppressed` yet | does not happen: S2 is blocked by THR-1878's lens build, which adds the flag and its reader |
| The Inspector-over-Stage subject is gone | THR-1822's `MissingPageVM` ("Unknown — this entity is no longer in the world") |
| A Stage moment's body throws while rendering | `GameErrorBoundary` around the panel content shows its fallback with Continue, which runs the moment's own close |
| Reduced motion | the camera cuts, the dim appears at once, the panel fades at `--anim-fast`; nothing is skipped |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 117 files import it | One `TraceCategory` member and one `TRACE_CATEGORIES` entry (`ui_stage`). No `Record<TraceCategory, …>` exists in `src/`, so no exhaustive map breaks; `types/__tests__/trace-vocabulary.test.ts` is satisfied by the registration (S1). The new trace's `kind` uses `HomedSurfaceKind`, never the ascendant `BeatKind` this file already imports |

Every other file in scope has a handful of importers. `EncounterVeil.tsx` is imported by GameView and nine test files; S3 keeps its export and props. `interruptRegistry.ts` is imported by GameView and two test files; S1 keeps every export.

## Slices

| Slice | Ticket | What | Blocked by |
|---|---|---|---|
| **S1** | **THR-1877** (this ticket's build) | The home list (D1) with its derived lists, the hold rule and `collectHeldMoments` (D2), the hosts rendering by the list with `HomedSurfaceFallback`, `homedSurfaces.test.ts`, the `ui_stage` trace registration with `held` / `fallback`, `getInterruptState()` fields, the `extending.md` row to "One place". Visible effect: two moments never show at once; the second waits | THR-1881 |
| **S2** | [THR-1892](https://linear.app/threadbare/issue/THR-1892) | The Stage frame (D3, D4 frame), the map dim and ring (D5), the camera (D6), the frame while open (D7), `GameScreenState.stage` and `lensSuppressed`, `stageView.ts`, the rest of `ui_stage`, `getStage()`, `openHomedSurface()`; story beats move onto the Stage; `motion.md`, `layout-zones.md`, `component-selection.md`, styleguide entry | S1, THR-1881, THR-1822 slice 1, THR-1875, THR-1876, THR-1878, THR-1819 builds |
| **S3** | [THR-1895](https://linear.app/threadbare/issue/THR-1895) | The encounter on the Stage (D4 table), "Continue", the gate-duty hex, the encounter builders move, the help copy rows for the encounter | S2 |
| **S4** | [THR-1897](https://linear.app/threadbare/issue/THR-1897) | Journey moments, undertaking moments, premonitions (option rings, framing) and the emergence dilemma on the Stage; `momentCardModel.ts` moves; `MeetingEncounterModal` deleted; the remaining help copy | S2, S3 |

## Three-pillar check

- [x] Engine pillar present — the Stage view model and lit-hex resolver (E3), the list's data module (E1), the hold rule (E2); no tick, graph or PRNG change, with rationale
- [x] Content pillar present — the list's words, the Stage's tunables and lines, the help copy; encounter, prose and attachment content N/A with rationale
- [x] UI pillar present — homes, hold rule, geometry, map, camera, frame, player-facing text, playtest signal, debug inspection, visual presence
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It enacts `01-core-loop.md` § "one story front-of-stage, and the game knows it" (one foreground, the rest held and named) and its "the stage still holds a single scene"; keeps "Time stops for every moment" (D8); keeps non-negotiable #3 (`02-non-negotiables.md`, mechanics through prose, never numbers: no new number reaches the screen); and keeps the taste profile's prose-first, plain-register UI (the new lines are plain sentences). Direction B ("the map is the table") is the UI review's direction, not a Vision file premise.
- [x] No Vision edit is needed in this ticket. One inherited note: `taste-profile.md:107` still lists "ALL CAPS letter-spaced section labels" as a strong opinion. Christian's ruling of 2026-10-14 (THR-1833: small labels in bold sentence case) supersedes it; this plan only consumes the ruling, and the type-and-icons plan ([THR-1879](https://linear.app/threadbare/issue/THR-1879)), which rolls the label rule out, owns that Vision edit (noted on THR-1879). The camera ease and dim fade at 500 ms sit on Law 41's ceremonial tier, outside the taste profile's 400 ms chrome cap.

## Rulebook impact

- [x] This plan does not change a rule of play. Where a moment is shown, and which of two simultaneous moments shows first, are presentation. No turn structure, action, resource, encounter, clock or win/loss rule changes.
- [x] No `Docs/canon/rulebook.md` edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1877-encounter-stage-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Homes, order and words are one data list; every Stage number is a named constant or a THR-1819 token; the dim reuses the lens colour by name |
| 2. Inspectability | PASS | `getInterruptState()` shows what renders, the foreground and the held surfaces; `getStage()` shows what the Stage was given and where everything landed; `ui_stage` traces each transition; `openHomedSurface(kind)` opens any moment |
| 3. Determinism | PASS | No randomness. The hold rule is a pure function of the snapshot and the incumbent; list order breaks every tie |
| 4. Fail-soft | PASS | Fallbacks for a missing hex, a missing map, a camera that never lands, an unknown kind, a missing slot value and a throwing body; nothing can hold the clock paused forever |
| 5. Narrative over mechanical perfection | PASS | The moment plays beside its place and the camera stays there afterwards, so the world carries the story; no numbers |
| 6. Additive over destructive | PASS-with-note | New list, new layer, new frame, additive handle and resolution fields; every derived export keeps its name; `EncounterVeil` keeps its export and props. Deleted: the veil's full-screen portals and caps (replaced, per the decision) and the never-mounted `MeetingEncounterModal` |
| 7. Performance budget | PASS | The dim is one instanced mesh built once per Stage open (768 hex tiles on a medium map); the view model is world-keyed and read only while a moment is open; the camera runs one 500 ms transition per open |

## Done when

**S1 — THR-1877's build** (predicates, THR-688 rule A):

- [ ] `src/data/homed-surfaces.ts` holds the 16 entries of D1 in that order, with `kind` and `surfaceId` unique, and no new type is named `BeatKind`
- [ ] `HOMED_SURFACE_OPEN_WHEN`, `INTERRUPT_SURFACES`, `INTERRUPT_HOLDER_NAMES` and `DIALOG_CONTEXT_SURFACES` (and `CEREMONY_SURFACES` if THR-1884 has landed) are derived from it, and `interruptRegistry.test.ts`, `termsExplainThemselvesThr1814.test.tsx` and `dialogContextRegistry.test.tsx` pass unchanged
- [ ] `resolveInterrupts` implements D2 with `rendering`, `foreground`, `stage` and `held`; a Node test covers every row of D2's scenario table, and the five today-fields keep their values on today's cases; `collectHeldMoments()` (if THR-1875's top-bar slice has landed) returns the resolution's `held` in its `HeldMoment` shape with `kind` and `behind` added
- [ ] Node tests pin R4's facts: a gift does not auto-enter while a Stage moment is open (`resolveGiftDelivery`); the ledger and court open flags are written only by their chrome openers, and the pending choice set only by `useAgentInteraction`'s cast path (a source test that greps the writers); a divine receipt that comes due with an encounter is held behind it and renders once the encounter closes; a popup waits
- [ ] While a ceremony or Stage surface holds the foreground, a receipt toast's click shakes the toast, shows "Opens when this chapter closes." and leaves `openedReceiptId` unset (a component test)
- [ ] `StageHost`, `DialogHost` and `CeremonyHost` render surfaces through one exhaustive switch over their home's kind type, and only the kinds in `rendering`; an unknown kind renders `HomedSurfaceFallback`, whose Continue lets the clock resume (tested); `HarvestScreen` is in `CeremonyHost` and `WarmStartOverlay` in `DialogHost`
- [ ] `src/data/__tests__/homedSurfaces.test.ts` holds D1's six checks, each failing with a message that names `HOMED_SURFACES (src/data/homed-surfaces.ts)`
- [ ] `ui_stage` is registered in `ui-traces.ts` and `trace.ts` and `trace-vocabulary.test.ts` passes; `held` and `fallback` emit once per transition
- [ ] `__DEBUG.getInterruptState()` returns `rendering`, `foreground`, `stage`, `held` and `homedSurfaces`, documented in `src/debug-bridge.d.ts`
- [ ] `Docs/design-system/extending.md`'s row reads "One place"
- [ ] Browser evidence (Playwright; DOM only) at 1920×1080 **and** 2560×1440 on `?view=game&seeded&size=medium&forceencounters`: with an encounter open, `await window.__DEBUG.forcePremonition(…)` leaves only the encounter on screen and `(await __DEBUG.getInterruptState()).held` names `premonition` behind `encounter`; closing the encounter opens the premonition. Screenshots at both sizes, console clean, and a UI-Laws line naming Laws 39, 49, 52, 57 and 58
- [ ] `npm run gate` green (code track: `npm test`, `npm run check:typecheck`, `npx vite build`, `check:ui-debt` not up); closing commit body has `Fixes THR-1877` on its own line

**S2 — [THR-1892](https://linear.app/threadbare/issue/THR-1892):**

- [ ] A story beat opened with `__DEBUG.openHomedSurface('story-beat')` plays on the Stage in the compact layout; `getStage()` at 1920×1080 reports a panel of 860 × 984 at (344, 72) and a window 692 wide; at 2560×1440, 967.5 × 1336 and 1144.5 (±2 px)
- [ ] The full-layout geometry is asserted on the styleguide's Stage entry at both sizes: 1272 × 984 with a 280 px window; 1592 × 1336 with a 520 px window
- [ ] `getStage().litHexInWindow === true` after the camera lands, `mapDim.strength === 0.7`, `snapshotScene().layersActive` includes `stage_focus`, and the ring is not gold (the screenshot)
- [ ] Under `emulateMedia({ reducedMotion: 'reduce' })`, `getStage().camera.mode === 'cut'` and the panel is visible within one `--anim-fast`
- [ ] While open: `folded.inspector`, `folded.ledgerRail`, `folded.lensSuppressed` and `folded.mapControlsHidden` are true; the lens bar still shows its pressed lens, and the lens draws again on close; the top bar's guarded group and Find swallow clicks
- [ ] Clicking the story beat's subject name, or the lit-hex button, opens the Inspector over the Stage; Escape returns to the story beat (`getEscapeLayers()` order as D7)
- [ ] A wheel or drag over the window leaves the camera where it is and shows "The map holds still while this moment is open." for about two seconds
- [ ] On close the camera does not return to its earlier view, and the place is not under the returning Ledger rail
- [ ] `stageView.ts` has Node tests for every branch of the lit-hex order, `layout`, the place tag, and the shared view-model contract (THR-1822 D17)
- [ ] `motion.md` records the camera ease, the Stage entrance and the reduced-motion cut; `layout-zones.md` records the Stage zone and the Inspector-over-Stage band; `component-selection.md` has the Stage row and `?view=styleguide` the Stage entry (Law 29)
- [ ] Browser evidence: Claude-in-Chrome (WebGL) screenshots at 1920×1080 and 2560×1440 with the measured `innerWidth` × `innerHeight` stated, console clean, the `getStage()` assertions above, and a UI-Laws line naming Laws 1, 13/14, 17, 21, 25, 33, 37, 41, 44, 46, 47, 50, 57 and 58
- [ ] `npm run gate` green; `Fixes THR-1892` on its own line

**S3 — [THR-1895](https://linear.app/threadbare/issue/THR-1895):**

- [ ] An encounter (`?forceencounters`) plays every step, the aftermath and the watched view on the Stage in the full layout with D4's column mapping; no `document.body` portal remains in `EncounterVeil.tsx`, and no `maxWidth: 540` / `500` or `SCENE_PROSE_MAX_WIDTH_PX` remains
- [ ] At 1920×1080 a five-card hand is a row of four and a row of one with the commit bar visible and the scene readable; `getStage().scrollingBelowCap` is empty on a step, an aftermath and a watched view
- [ ] The aftermath's close reads "Continue"; the god rail's cards read "Your cards wait. This encounter deals its own hand." (THR-1875's words); Escape and *Show on map* still minimise and the badge reopens the step (THR-1724, THR-1730)
- [ ] A gate-duty encounter lights its hex (`getStage().vm.litSource === 'beat'`)
- [ ] The nine `EncounterVeil` test files pass, updated only where they asserted the portal or the removed caps; the reduced-motion beat-count lock in `EncounterVeil.test.tsx` passes
- [ ] The encounter builders live in `src/engine/views/stage/` with re-exports at their old paths; D10's S3 rows are rewritten
- [ ] Browser evidence at both sizes as S2, with a UI-Laws line naming Laws 7, 33, 37, 38, 47, 57 and 58; `npm run gate` green; `Fixes THR-1895` on its own line

**S4 — [THR-1897](https://linear.app/threadbare/issue/THR-1897):**

- [ ] `__DEBUG.openHomedSurface(kind)` opens each of `journey-vignette`, `undertaking-moment`, `premonition` and `emergence-dilemma` on the Stage at both sizes; no Stage-home surface renders through `Modal` any more (a test greps the four files)
- [ ] Hovering or focusing a premonition option lights its place with a dashed ring in its tone; an option in fog is ring-only; the camera frames all places when they fit at k ≥ 5; the premonition's words are unchanged
- [ ] `MeetingEncounterModal.tsx` is deleted and the UI-debt baseline lowered with it; `momentCardModel.ts` lives in `src/engine/views/stage/` with a re-export; D10's S4 rows are rewritten
- [ ] Browser evidence at both sizes as S2, with a UI-Laws line naming Laws 22, 30, 44, 57 and 58; `npm run gate` green; `Fixes THR-1897` on its own line

## Coordination block

*For THR-1877's own build, S1. S2–S4 carry theirs on their tickets.*

**Suggested model:** opus — the hold rule rewrites the clock's one source of truth; every edge (incumbent, rite, popup, harvest, minimise) must keep today's behaviour except where D2 changes it on purpose.

**Parallel-safe with:** THR-1878's lens builds (`GameMap`'s lens bar and HexMapV2 scene files, which S1 does not touch); THR-1879 (faces and icons); THR-1876's Inspector build (`inspector/`, the router, `src/engine/views/subjects/`); THR-1893 and THR-1894 (the Ledger rail and god rail files, which S1 does not touch).

**Mutex with:** THR-1881 (blocked by it: S1 edits the hosts it creates; do not start until it merges). THR-1875's top-bar slice, which moves `interruptRegistry.ts` into `src/engine/views/` and adds `collectHeldMoments()`: if it lands first, S1 edits the moved file and extends `collectHeldMoments`; if S1 lands first, that slice moves S1's version and keeps D2's rule. THR-1884 (THR-1821's Overlay slice) and THR-1820's build / THR-1880: they create `surfaceHomes.ts` and `dialogSize.ts`, which S1 derives from or checks against. Any ticket editing `interruptRegistry.ts`, `dialogContext.ts` or `nudge-stage-content.ts`'s holder names. Check `In Dev` before claiming.

**Files to touch:** (S1)
- Create: `src/data/homed-surfaces.ts`, `src/data/__tests__/homedSurfaces.test.ts`, `src/components/Game/hosts/HomedSurfaceFallback.tsx`
- Edit: `interruptRegistry.ts` (wherever it lives at claim) and its test; `src/data/nudge-stage-content.ts` (`INTERRUPT_HOLDER_NAMES` derived); `src/components/shared/dialogContext.ts` (`DIALOG_CONTEXT_SURFACES` derived, palette names imported); `src/components/shared/surfaceHomes.ts` if present (`CEREMONY_SURFACES` derived); `src/components/Game/hosts/{StageHost,DialogHost,CeremonyHost}.tsx` (render by the list); the `resolveInterrupts` call site (incumbent ref, `cycleHarvestPending`); the receipt toast's `onOpenReceipt` handler (`GameView.tsx:4574` today, or its host after THR-1881) and the toast that calls it (the guard); `src/types/traces/ui-traces.ts` + `src/types/trace.ts` (`ui_stage`); `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (`getInterruptState` fields); `Docs/design-system/extending.md` (row status)

## Notes for the executor

- **The list is the only place a surface's home is written.** Do not add a `home` to a component, a host-local array or a second registry. If something needs a surface's home, palette or words, read `HOMED_SURFACES` or derive from it.
- **Do not name anything `BeatKind`.** That type is the ascendant beat's (`src/types/ascendantBeat.ts:19`) and `trace.ts` already imports it. The list's key is `HomedSurfaceKind`.
- **Keep every export name.** `INTERRUPT_SURFACES`, `INTERRUPT_HOLDER_NAMES`, `DIALOG_CONTEXT_SURFACES`, `CEREMONY_SURFACES`, `resolveInterrupts`, `collectHeldMoments` and the resolution's five existing fields are read by tests, the frame and the debug bridge. They become derived; they do not move or rename (except the registry's own move by THR-1875, with its re-export).
- **Golden first.** Before changing `resolveInterrupts`, add a test that pins today's output for today's cases (each flag alone; the yielding pairs; the rite with each other surface). After the change, only D2's scenario rows may differ, and each difference is asserted.
- **Do not build the Stage in S1.** S1 changes which surface renders, not how any surface looks. A held story beat in S1 still opens as today's dialog when its turn comes.
- **The incumbent is a ref, not state.** Writing it into React state would re-render in a loop. The function stays pure; the ref holds the last render's `foreground`.
- **`HomedSurfaceFallback` must not trap the clock.** Its Continue has to clear the kind from the resolution until the kind's flag goes false once; test that the clock resumes.
- **Words:** the code word is *surface*; player text keeps "moment". Labels are bold sentence case, never letter-spaced capitals.
- **For S2–S4:** the Stage never holds a map handle; `GameMap` drives the map from `GameScreenState.stage`. The window is measured from the DOM after two animation frames, never computed from tokens in JS. No literal width anywhere in the Stage: tokens only (THR-1819).

**Kill criteria — stop and report rather than push through:**
1. The one-foreground rule strands a moment in play (a held surface never opens because its incumbent never releases) → restore today's co-render for that kind, record why on the ticket, keep the rest.
2. At 1080p testers miss the lit hex in the 280 px window → strengthen the place tag first (decision, *Would change the call*), before changing the geometry.
3. A real hand of seven or more cards at 1080p pushes the scene off the panel → narrow the left column to 300 px before the hand shrinks (decision).
4. Hiding the Ledger rail resizes the map canvas (THR-1875 confirms it does) with a visible jump or costs more than a frame → keep the canvas full-width under the rail permanently (a frame layout change: raise it with THR-1875 rather than working around it in the Stage).
5. A moment's body cannot render into Stage slots without rewriting its logic → keep it in its `Modal` for that slice, record why, and file the remainder.

## Intent-judge verdicts

- Pass 1 (2026-10-14): **Revise** — UL VIOLATION (`BeatKind` already names the ascendant beat's kinds; the claimed THR-1882 proposal did not exist); wiring GAPs (the harvest had no open predicate; THR-1878's `lensSuppressed` contract not honoured); legibility GAPs (unquoted premonition headings; an offering could draw over the Stage). All fixed: code word moved off *beat*, UL comment posted, harvest predicate and `rendering` added, lens contract adopted, the premonition keeps its own words, R4 states and tests why no outside dialog arrives.
- Pass 2: **Revise** — UL GAP (the UL's *Surface* is an encounter term); legibility GAPs (the held map answered nothing, PC-8; the compact context line had no empty-slot form, PC-3). Fixed: every name qualified as *homed surface*, a second UL comment lists all three collisions; the lit-hex button and the hold line; the context line's empty forms quoted.
- Pass 3: **Revise** — THR-1875 had corrected the god rail's rest lines (the rail holds map cards; the encounter deals its own hand, PC-6); "hand" used for the rail's set; one stale debug field name. Fixed: THR-1875's lines adopted unchanged and THR-1829's string recorded as refined; "the god rail's cards" throughout; `homedSurfaces`.
- Pass 4: **Allow** — 11 PASS, 1 GAP (wiring). Two recommendations, both applied before the PR: a modal divine receipt (raised by a tick phase or its toast) could still open over the Stage, so it now waits for the foreground and its toast is guarded (R4, R5, scenario rows, S1 tests); THR-1875 adopted the Ledger rail's `hidden` state in its own build, so the Stage only sets the phase.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14 (run on the pass-3 revision; the pass-4 changes are the receipt rule and the Ledger-rail owner, recorded under Intent-judge verdicts)*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS-with-note | Constants table names `STAGE_MAP_DIM`, `STAGE_CAMERA_*`, `STAGE_MAP_HINT_MS` and the THR-1819 tokens. The "two animation frames" wait, the "20 px" panel padding and the "300 px" fallback column were not named constants. |
| 2. Inspectability | PASS-with-note | `getInterruptState()` carries `rendering`, `foreground`, `held` with `behind`, and the list as data; `getStage()` reports geometry, `litSource`, camera mode and `scrollingBelowCap`; `ui_stage` registered; wiring table fills all six columns. Naming mismatch: `homedSurfaces` vs `surfaces` (S1 Done-when). |
| 3. Determinism | PASS | "No randomness anywhere in this plan." The hold rule is a pure function of the snapshot and the incumbent; list order breaks ties. |
| 4. Fail-soft | PASS | Covers a throwing predicate, an unknown kind (`HomedSurfaceFallback`, Continue lets the clock resume), a missing hex, no map handle, a camera that never lands, a throwing body, and empty slots. |
| 5. Narrative over mechanical | PASS | The moment plays beside its lit place and the camera stays there; no numbers reach the player. |
| 6. Additive over destructive | PASS-with-note | Derived exports keep their names; resolution and handle fields additive. Destructive parts (veil portals and caps, `MeetingEncounterModal`, four `Modal` wrappers, two order changes) are justified by Direction B. |
| 7. Performance budget | PASS | One instanced mesh per Stage open; the view model is world-keyed and read only while a moment is open; one 500 ms transition per open; kill criterion 4 sets a one-frame limit. |

NFP AUDIT: PASS-with-notes (see rows above)

*Author response:* `STAGE_LAYOUT_SETTLE_FRAMES` is now a named constant; the panel padding is cited as the `--panel-padding` token; the 300 px column is a kill-criterion contingency from THR-1829, not a live value; the debug field is `homedSurfaces` everywhere.

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | E1–E4 give the home list, the hold rule (R1–R6 with pseudocode), the Stage view model and the moved builders. Graph, tick and PRNG each stated as none, with reasons. |
| Content | present-and-substantive | Encounter templates, prose tables and attachments N/A with rationale. Data tables C1–C4 concrete. |
| UI | present-and-substantive | Geometry, dim and ring, camera, frame behaviour, quoted player text with PC classes, playtest predicate, debug levers, screenshot tools. |

**Missing required sections:** No missing required sections.

**Wiring check:** each module mapped to phase ("none", justified), UI component, GameState field, trace and debug surface; covers the interrupt-registry items in `wiring-checklist.md`.

**Substrate check:** upfront `## Substrate inventory`, extends / derives / preserves for each existing subsystem; no green-field duplication. Notes: the table did not use the inventory's own subsystem names; `surfaces` vs `homedSurfaces`.

PILLAR AUDIT: PASS-with-notes

*Author response:* the inventory's names (Attention, Chronicle & Narrative; Encounters & Dilemmas; Ruins, Clues & Delves; Divine Premonition; Ascendant Beats & Progression) are now listed under the substrate greps; the field name is fixed.

### Vision audit

**Vision premises touched:** `00-north-star.md` → not referenced. `01-core-loop.md` → "one story front-of-stage" (l.41), "the stage still holds a single scene" (l.79), "Time stops for every moment" (l.59) — confirmed, the hold rule extends the first two. `02-non-negotiables.md` → #3 never numbers, #6 additive — confirmed; #1 god-not-protagonist — silent. `03-design-tensions.md` → not referenced. `taste-profile.md` → prose-first UI, gold reserved (the ring is parchment), time halting — confirmed.

**Vision contradictions:** `taste-profile.md:107` (strong: "ALL CAPS letter-spaced section labels") vs the plan's "bold sentence case, never letter-spaced capitals", inherited from Christian's ruling (THR-1833), not decided here. `taste-profile.md:226-229` (labels in Cinzel at 16 px) vs "Cinzel only at 22 px and up", same source. `taste-profile.md:236` (motion 150/200/400 ms) vs the 500 ms camera ease, which the plan puts on the ceremonial tier.

**Five checks:** North star — yes. Core loop — preserved (the map holds still during a moment; minimise frees it). Non-negotiables — inside them. Design tensions — leans toward a narrow stage, with Needs you and the fog rule as counter-pulls. Taste profile — kept, except the label-case line.

VISION AUDIT: PASS-with-notes

*Author response:* the label-case and Cinzel lines are Christian's own 2026-10-14 ruling (THR-1833); the taste-profile edit belongs to the type-and-icons rollout, THR-1879, and is noted on that ticket. The 500 ms ease is on Law 41's ceremonial tier, which the taste profile's chrome cap does not govern.
