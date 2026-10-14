# Action proposal — the encounter Stage (THR-1877)

## intent_quote

From the THR-1877 description (written by the carve-up session from the closed map THR-1823; Christian's additions dated):

> Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used.
> Draws on: The encounter Stage — three homes (Stage / dialog / full-screen ceremony), Stage geometry (`STAGE_WINDOW_PX` 280/520, left column 340/560, compact ~860 px tier), map dim `STAGE_MAP_DIM` 0.7, lit hex with a parchment ring, camera eases the lit hex into the window, one moment at a time with the rest held in Needs you, time unchanged.
> The Stage wraps the veil's existing step shells.
> Also owed: list the tutorial and first-run copy that points at surfaces this moves.

> **Added 2026-10-14 (Christian, chat):** the end of a cycle (the harvest screen) is a **full-screen ceremony**, alongside Meet the First and the Threading Rite. It is not a dialog and not the Stage.

> **Binding (UI Law 58, Christian 2026-10-14):** the UI grows by adding entries, not by writing screens. Which moments play on the Stage, in a dialog or as a ceremony is one list keyed by moment kind. A new moment kind is one entry, and a missing one fails a named test. The list gets a row in `Docs/design-system/extending.md`.

From the parent session's task brief (the attended session, 2026-10-14), which lists what the plan must specify:

> the three homes (Stage, dialog, full-screen ceremony) as one list keyed by moment kind (Law 58), with every current moment assigned to a home; the Stage geometry at 1920×1080 and 2560×1440; the map dim and lit-hex ring; the camera ease, with its reduced-motion cut; one moment at a time, with the hold rule for "Held behind this chapter" (THR-1875 owns the Needs-you UI); how the Stage wraps the veil's existing step shells (`EncounterVeil.tsx`); which GameView host from THR-1881 it builds into (the Stage comes last in that order); the Law 58 list and its `extending.md` row; the onboarding copy that points at moved surfaces. Slice it into buildable tickets if it is too big for one PR.

Christian's own words that ratified Law 58 (laws.md § XVI): *"it is important that the UI is simple and easy for agents to expand and change as we iterate on the game, add new actions, fields, and so on."*

## scope (what this plan does)

Specifies the encounter Stage and its two sibling homes for THR-1877, in four slices. S1 (this ticket's build): one data list, `HOMED_SURFACES` (`src/data/homed-surfaces.ts`), keyed by kind, giving each of the 16 surfaces (the 15 interrupt surfaces plus the cycle harvest) its home, render priority and words; the interrupt registry, clock-holder names, dialogue palettes and THR-1821's ceremony list are derived from it; the three GameView hosts (THR-1881) render by it; the hold rule (one foreground for Stage and ceremony surfaces, the incumbent keeps it, list order when free, dialogs render over it and only the foreground's own dialogs can arrive, held surfaces named with the kind they wait behind; THR-1875's `collectHeldMoments()` follows it); a named test and a plain fallback; the `extending.md` row. S2–S4 (filed as THR-1892, THR-1895, THR-1897): the Stage frame at 1920×1080 / 2560×1440 / 3440 from THR-1819's tokens, the map dim and lit-hex ring as a HexMapV2 layer, the camera ease with a reduced-motion cut and a keep-in-view rule on close, the frame's behaviour while the Stage is open (god rail hand rest, top bar guard, Needs you, Ledger rail, Inspector, lens), the Stage view model behind THR-1822's seam, the encounter moved onto the Stage with its step shells kept, then the other four Stage moments; and the help copy that names moved surfaces.

## scope (what this plan does NOT do — explicit non-goals)

- It does not re-decide THR-1829's homes, geometry, dim, ring, camera or time rules; it implements them, with two recorded refinements (the camera keeps the place visible when returning chrome would cover it; a name clicked on the Stage opens the Inspector over it).
- It does not build the Needs-you UI (THR-1875) or the Inspector and router (THR-1876); it states the contract each must honour while the Stage is open.
- It does not size dialogs (THR-1820) or build Overlay / Panel / Z bands (THR-1821).
- It does not move JSX out of GameView (THR-1881 does, moves only).
- It does not change any rule of play, any encounter's words, or the clock's pause behaviour.
- It does not design map lenses (THR-1878), type or icons (THR-1879).
- It does not add a tutorial system; none exists, and the plan lists the help copy that needs rewording.
- The thread-draw "signature motion" when the god acts stays open (THR-1823's fog), as THR-1829 left it.

## impact_class

External — the plan changes what the player sees on every moment of play and the clock's single source of truth for what is open (the interrupt registry). Reversible in code, but a hold-rule error would strand moments in live play.

## evidence cited

- **Linear issue:** THR-1877 (slices THR-1892, THR-1895, THR-1897)
- **Vision premises invoked:** `TheFantasyWorldSimulator/Vision/01-core-loop.md` ("one story front-of-stage, and the game knows it"; "Time stops for every moment"); `02-non-negotiables.md` #3; `taste-profile.md` (prose-first UI)
- **UL terms touched:** three plain words are avoided as code words: Moment (UL: the undertaking's report), `BeatKind` (the ascendant beat's kind, `src/types/ascendantBeat.ts:19`; UL Offering "beat kind `offering`") and Surface (UL: an encounter template bound to its context, `Encounters.md` § Surface, `SurfaceKey`). The code word is the qualified *homed surface* (`HOMED_SURFACES`, `HomedSurfaceKind`, `HomeId`), never a bare `Surface…` name; the UI's own sense of *surface* (`INTERRUPT_SURFACES`, `surfaceId`) predates this plan. Proposed additions and all three disambiguations posted as comments on THR-1882 (2026-10-14): *home* and *homed surface*. The Stage and Needs you are already proposed there; Location / Place used per UL
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/design-system/laws.md` (Laws 1, 7, 21, 26, 30, 33, 35, 37–39, 41, 44, 47, 49–52, 57, 58), `Docs/design-system/extending.md`, `Docs/design-system/motion.md` § Ceremonial tier, `Docs/ops/player-complaint-classes.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`, `…-thr-1820-dialog-size-tiers.md`, `…-thr-1821-component-library-and-ui-debt-ratchet.md`, `…-thr-1822-view-model-seam.md`; decision records `Docs/audits/2026-10-14-thr-1829-encounter-stage-decision.md`, `2026-10-12-thr-1828-screen-frame-decision.md`, `2026-10-11-thr-1827-inspector-decision.md`, `2026-10-14-thr-1830-map-lenses-decision.md`, `2026-10-11-thr-1831-map-chrome-decision.md`
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's rejected approaches is reintroduced (no R3F, no SVG map, no full-screen intervention wheel). Within the plan: ceremony preempting an open Stage moment; pure priority with no incumbent; today's co-render; a DOM-mask dim; re-centring the camera on every close; queuing a clicked page until the Stage closes (brainstorm companion)

## load-bearing decisions touched

- **Raw Three.js with a canvas ref, not R3F:** the dim and ring are a plain Three.js layer in HexMapV2 (respected).
- **The world graph is mutated in place — never key change detection on graph identity:** the Stage view model is read through THR-1822's `readView`, keyed on `worldVersion` (respected).
- **Engine caches are owned per session:** no module-scope cache is added (respected).
- **Agent position is three-tier; ask through `sublocationShape.ts`:** the lit hex resolves a Place to its Location through `resolveToParentLocation` via `hexContents` (respected).
- **No inventing node types:** none added; view models are not graph nodes (respected).

## high-impact files touched (from Codesight)

- `src/types/trace.ts` — 117 importing files (grep). S2 adds one `TraceCategory` member and one `TRACE_CATEGORIES` entry (`ui_stage`). The plan has a Blast Radius section.

## kill criteria

1. The one-foreground rule strands a moment in live play → restore today's co-render for that kind, record why, keep the rest.
2. Testers miss the lit hex at 1080p → strengthen the place tag first (THR-1829's own kill criterion).
3. A real hand of seven or more cards pushes the scene off the 1080p panel → narrow the left column to 300 px before shrinking the hand (THR-1829).
4. Hiding the Ledger rail makes the map canvas jump or costs more than a frame → keep the canvas full-width under the rail (raise with THR-1875).
5. A moment's body cannot render into Stage slots without rewriting its logic → keep it in its dialog for that slice and file the rest.

## explicit user sign-off

Not High-risk. Christian asked in chat on 2026-10-14 for this plan to be written now (waiving the design lane's veto window on THR-1828–1833 for authoring); his veto on the lane-made decisions stays open in chat.

## author notes for the judge

- **The word.** The ticket says "moment kind". The UL's Moment is the undertaking moment (`Agents.md` § Moment, `MomentCard`), and pass 1 of this judge found that `BeatKind` is the ascendant beat's kind (`src/types/ascendantBeat.ts:19`). The code word is now *surface* (`HOMED_SURFACES`, `HomedSurfaceKind`): the interrupt registry's own word and THR-1821's ("a surface's home is one named choice"). Player text keeps "moment". The UL comment is posted on THR-1882.
- **Pass 1 (Revise) → what changed:** the `BeatKind` collision renamed throughout (plan, `extending.md` row, trace, debug lever); the THR-1882 UL comment actually posted; the cycle harvest now has an open predicate (`HOMED_SURFACE_OPEN_WHEN` is total over all 16 kinds, `cycleHarvestPending`) and takes part in the one foreground through a new `rendering` field while `open` / `anyOpen` keep counting stopping surfaces only; THR-1878's `lensSuppressed` contract adopted (the bar keeps its pressed state), map controls hide, the place tag avoids both corners; THR-1875's `collectHeldMoments` / `HeldMoment` contract adopted and its hand-rest mechanism used (the Stage changes one line); the premonition keeps its own words (no new headings); R4 now states why no outside dialog can arrive over the Stage (`giftDelivery.ts:62`, guarded chrome, popups wait), pinned by three tests, with a scenario row for an offering arriving with an encounter; THR-1833 and THR-1834 cited inline.
- **Pass 2 (Revise) → what changed:** the UL Surface collision is named in D1 and the code names are all qualified (`HOMED_SURFACES`, `HomedSurfaceKind`, `HomeId`, `StageHomedKind`, `HomedSurfaceFallback`, `openHomedSurface`); a follow-up comment on THR-1882 lists all three collisions. PC-8: the held map now answers every input (the lit hex is a button with its tooltip that opens the place's page over the Stage; a drag, wheel or click elsewhere shows "The map holds still while this moment is open.", plus "Show on map lets you look around." during an encounter), quoted in Player-facing text with a constant and a Done-when. PC-3: the compact context line's empty-slot forms are quoted ("Maren Ashfold", "At Millbrook", no line) with a fail-soft row. R4's choice-set premise now matches `useAgentInteraction.ts:141`. The Ledger-rail difference is posted on THR-1875.
- **Pass 3 (Revise) → what changed:** THR-1875's corrected rail lines adopted unchanged in every place ("Your cards wait. This encounter deals its own hand." / "Your cards wait while this moment is open."), with PC-6 answered and the refinement of THR-1829 § 3's string recorded (the rail holds map cards; the encounter deals its own hand; THR-1829 rejected the rail's hand playing into the encounter); the plan's prose now says "the god rail's cards", never "the god rail's hand"; the S3 slice no longer edits `frame-content.ts`; the S1 Done-when's debug field is `homedSurfaces`; a correction is posted on THR-1875. Audit notes folded in: `STAGE_LAYOUT_SETTLE_FRAMES` named, the panel padding cited as `--panel-padding`, the inventory's subsystem names listed, and the taste profile's stale ALL-CAPS line noted as THR-1879's Vision edit.
- **Pass 4 (Allow) → recommendations applied:** the divine receipt now waits for the foreground (`waitsTurn: 'foreground'`) and its toast is guarded, with scenario rows and S1 tests; the Ledger rail's `hidden` state is THR-1875's build (its reply of 10:44), so the Stage only sets the phase.
- **Membership.** Doom, Mandate, Omen, the Codex, Settings and Read the Threads are left out of the list as *tools* (player-opened, never stop the world). THR-1829 mentions Doom / Mandate / Omen in its dialog row only to say they stay dialogs. They are still assigned a home in the plan's D1 text (dialog, at THR-1820's tiers); they are just not list entries.
- **Two refinements of THR-1829**, both recorded as refinements rather than reversals: on close the camera eases only if returning chrome would cover the place (the decision's renders had no Ledger rail, so the conflict was not visible); a name clicked on the Stage opens the Inspector docked over the Stage (the decision says the Inspector folds but does not say what a name click does).
- **One deliberate behaviour change in the clock's ordering**: the Threading Rite now goes ahead of a Stage moment that has not yet opened (the decision's "ceremony outranks the Stage"), while still never interrupting an open one (THR-1754). Meet the First moves ahead of the encounter in list order for the same reason.
- The S1 slice deliberately has no new look; it lands right after THR-1881 so THR-1875's Needs-you build can read `held`.
- **Cross-plan contracts** (posted on THR-1877 by the THR-1875 and THR-1878 sessions, 2026-10-14) are adopted, with one difference recorded: THR-1875 said the frame does nothing special with the Ledger rail during a Stage moment; the plan asks for the rail to step aside (the window is the map's right edge, where the rail sits), built by S2.
- Slice tickets: THR-1892 (S2, the frame + story beat), THR-1895 (S3, encounter), THR-1897 (S4, the rest).
