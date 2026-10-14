> **Decision audit for THR-1829** (wayfinder map THR-1823, *The Map Is the Table*; project UI Visual Overhaul — Design System v1). Design lane run 2026-10-14d, unattended; decided by delegation (process.md rule 4) with a veto invited. The blocker, THR-1825 (what asks for the god's attention), closed 2026-10-11. Every substrate claim below was measured in this run against `origin/main` at `b0748460`.
>
> Mock: [`stage-mock.html`](2026-10-14-thr-1829-encounter-stage/stage-mock.html), one screen per hash. Its map engine is the [THR-1830 lens mock](2026-10-14-thr-1830-map-lenses/lens-mock.html)'s, so the towns are the ones Christian has seen. Screenshots:
> [encounter at 2560×1440](2026-10-14-thr-1829-encounter-stage/encounter-1440p.png) · [encounter at 1920×1080](2026-10-14-thr-1829-encounter-stage/encounter-1080p.png) · [aftermath](2026-10-14-thr-1829-encounter-stage/aftermath-1080p.png) · [premonition](2026-10-14-thr-1829-encounter-stage/premonition-1080p.png) · [story beat, compact tier](2026-10-14-thr-1829-encounter-stage/story-beat-1080p.png)

# THR-1829 — The encounter Stage

## The decision in one paragraph

**A mortal's moment at a place plays on the Stage; the god's own business stays a dialog; the moments that make the god who they are stay full-screen.** The Stage is a panel over the map, below the top bar and beside the god rail. The map behind it dims, and the hex where the moment happens stays lit in a window of open map to the right of the panel. Before the Stage opens, the camera eases so that hex sits in the window. Inside the panel, the scene art and the cast sit on the left; the title, the scene, the forecast and the hand sit on the right. Nothing about time changes: a pause-tier moment still stops the world exactly as today, and the top bar still names it. Everything the encounter screen already promises stays: beat order, one chrome from the first step to the aftermath, the identity header and the colour family of each kind of moment.

## Settled input (not re-opened)

| Source | What it fixes for the Stage |
|---|---|
| UI review, direction B (Christian chose B, 2026-10-11) | "Encounters move from the full-screen veil to a stage over the dimmed map"; "the camera eases to the hex where a beat happens"; the sketch puts art left, prose and choices right, the scene's hex lit beside the panel. |
| [THR-1724](https://linear.app/threadbare/issue/THR-1724) (Christian, chat 2026-10-04) | Scene prose and the cast in separate columns, "At stake" under the cast; cards wrap in rows of four (`CARDS_PER_ROW = 4`); the veil starts below the top bar and the top bar names the pause ("paused · The Unsafe Bridge"); Escape and *Show on map* minimise, they never disregard. |
| [THR-1730](https://linear.app/threadbare/issue/THR-1730) (lane, veto window closed) | A minimised moment waits for the player. |
| THR-1605 (Christian, 2026-09-27) | Real time that halts for every moment (the Stellaris model). |
| [THR-1827](https://linear.app/threadbare/issue/THR-1827) (Christian, "yes" to all 18 calls) | The live encounter keeps its own home (the Stage); a pause-tier interrupt closes the Inspector's Full view; the hand lives in the god rail, card-first. |
| [THR-1828](https://linear.app/threadbare/issue/THR-1828) (lane, veto window closed) | Frame sizes (top bar 48/56 px, god rail 320/400 px); "Held behind this chapter" in the Needs-you queue is the Stage's waiting line; the top bar's right group is dimmed and click-guarded while an encounter is open. |
| [THR-1830](https://linear.app/threadbare/issue/THR-1830) (lane, decided 2026-10-14 ~01:30Z; *its veto window is still open*) | The map's one grammar: dim with near-black, never a hue; one lens at a time. |
| [THR-1831](https://linear.app/threadbare/issue/THR-1831) (lane, veto window closed) | Gold on the map is the Dominion frontier; the centring zoom is k = 10. |
| Laws 30, 33, 37, 38, 39, 41, 47, 52 | Palettes, one viewport, one chrome, fixed beat order, every pause-tier beat interrupts, the ceremonial motion tier, a spend visibly moves its pool, time named in the top bar. |

## What the game has today (measured, `main` @ `b0748460`)

Seventeen surfaces stop the world, all through one registry; none pauses itself.

| Fact | Evidence |
|---|---|
| Every beat surface pauses through one list, in render-priority order: WarmStart, EncounterVeil, MeetTheFirstFlow, ThreadingRite, Premonition, JourneyVignette, StoryBeat, AscendantBeat, ChoiceSet, EmergenceDilemma, DivineReceipt, ChapterLedger, Scry, MomentCard, EventPopup | `interruptRegistry.ts:86-108`; `useInterruptAutoPause.ts:101-106` |
| **Two non-yielding surfaces can render at once.** Only the moment card, the popup and the rite wait their turn | `interruptRegistry.ts:141-143` "every non-yielding surface renders when its condition holds" |
| The encounter veil is its own full-screen portal below the top bar (`top: var(--topbar-live-height)`), column 52% wide with art (65% without), scene prose capped at 760 px, a 220 px side column, aftermath blocks 540 px | `EncounterVeil.tsx:408-420`; 3,957 lines |
| **The veil already knows its hex**: `hexCol` / `hexRow` on the stage header, used today only for *Show on map* | `encounter-stage/types.ts:88-90` |
| **Queued story beats carry a hex, but the modal never receives it**: `QueuedStoryBeat.hexCol/hexRow` "for camera navigation"; `StoryBeatModal` gets `template` and `agentName` only | `types/attention.ts:123-125`; `GameView.tsx:6705-6709` |
| Journey vignettes, undertaking moments and premonitions carry an agent (`agentId` / `actorId`), not a hex; premonition compulsion options carry `locationId`; the emergence dilemma carries `ruinId` and `agentId` | `types/journeyEngine.ts:185-212`; `types/strategicAction.ts:1020-1039`; `types/premonition.ts:58-67`; `engine/ruins/delveTypes.ts:88-98` |
| Gifts and offerings, divine receipts, effect choice sets, popups, the Chapter Ledger and the omen detail are `Modal`s (600 px default, `maxHeight: '75vh'`); gifts embed the THR-799 `RevealCard` | `Modal.tsx:62-73`; `AscendantBeatModal.tsx:468-495`; `RevealCard.tsx:33` |
| Meet the First and the Threading Rite are their own `fixed inset-0` full screens | `MeetTheFirstFlow.tsx:245`; `ThreadingRite.tsx:206` |
| The hand at 1080p: rows of four 210 px cards (876 px), the commit bar sticky at the column's foot | `NudgePhaseShell.tsx:70,398-402,461`; `CardFace.tsx:115` |
| The camera has one fly-to: `centerOn(x, y, scale?)`, a 500 ms d3 transition | `HexMapV2.tsx:378,724-729`; `D3ZoomCamera.ts:18` |
| No law sets a backdrop dim; the Dominion lens dims Foreign ground at 0.45 with `#0b0907` | `dominion-ui-content.ts:39-45` |
| `JourneyVignetteModal` passes `size="md"`, a prop `Modal` does not have, so it renders at the 600 px default | `JourneyVignetteModal.tsx:156` |
| `MeetingEncounterModal` (610 lines) is built but never mounted | `dialogContext.ts`; GameView mentions it only in a comment |

## The calls

### 1. Three homes for a moment

| Home | The test | What goes there |
|---|---|---|
| **The Stage** — over the dimmed map, its hex lit | *A mortal's moment, at a place.* The god watches it and may tug it. | Encounter steps and their aftermath (attended and watched); story beats; journey moments (vignettes); undertaking moments (the moment card); premonitions; the ruin emergence dilemma |
| **A dialog** — centred over the frame, the map left as it is | *The god's own business.* Nothing about it happens at one place. | Gifts and offerings (the reveal card); divine receipts; effect choice sets; event popups; the Chapter Ledger; the omen, doom and mandate dialogs; the Divine Court |
| **Full-screen ceremony** — the map leaves the screen | *Who the god is becoming.* The world is not the subject. | Meet the First; the Threading Rite (full and short shapes; its bond-only shape is already a reveal card and stays a dialog); the Remembrance, which already runs before the world exists |

- **Why this line and not "important things get full screen".** Law 26 already says a surface is chosen by *what the player must do*, "not by felt importance". The Stage's whole promise (direction B: "I never lose the world") applies to moments that have a place in it. A gift, a receipt or a popup has no hex to light, so putting it on the Stage would dim the map for nothing.
- **Why ceremony keeps the full screen.** Meet the First and the Threading Rite are about the bond between the god and a mortal; their hands already scale to fit the whole screen (`fitToViewport.ts`, down to 0.7) and their comic panels are full-bleed. The map would only compete.
- **Why premonitions and the emergence dilemma move to the Stage.** Both are a decision about where a mortal goes or what a place becomes. On the Stage, hovering a premonition's place lights that place on the map too, so the god chooses with the land in view (see the [premonition screen](2026-10-14-thr-1829-encounter-stage/premonition-1080p.png)). Each keeps its own colour family (Law 30).
- **Pause is not the test.** Every one of the three homes holds pause-tier beats. Law 39 is unchanged: each pause-tier beat interrupts on its own and stops the world, wherever it plays.

### 2. One moment on the Stage at a time

- The Stage shows **one** moment. Others that want it wait in the Needs-you queue's *Held behind this chapter* group (THR-1828), named, in the registry's priority order, and open in turn when the current one closes.
- This closes the measured gap above: today two non-yielding surfaces can render together. The Stage is one slot, so the registry needs a "Stage surfaces wait their turn" rule like the one the moment card and popup already have.
- Dialogs may open over the Stage when the Stage itself asks for one (for example a card's reveal). Ceremony outranks the Stage: if a rite comes due, the Stage moment waits behind it as today.

### 3. The Stage's layout

The panel starts below the top bar (Law 52) and to the right of the god rail, with a 24 px gutter, and leaves a **window** of open map on its right.

| | 2560×1440 | 1920×1080 |
|---|---|---|
| Map region (right of the god rail, below the top bar) | 2160 × 1384 | 1600 × 1032 |
| Window on the right (`STAGE_WINDOW_PX`) | 520 | 280 |
| Panel | about 1590 × 1336 | about 1270 × 984 |
| Left column (`STAGE_LEFT_COL_PX`): scene art at 16:9, the cast, *At stake* | 560 (art 315 high) | 340 (art 191 high) |
| Right column: the header, the stakes line, the scene, the factor lines, the hand | about 1030 | about 930; four 210 px cards fit (876 px) |

- **Left: who and what.** The scene art is the encounter's hero illustration (Law 7: "the hero illustration belongs to the stage"), then the cast with portraits, tooltips and links (Laws 1, 21), then *At stake*. This is THR-1724's pairing (the cast and *At stake* together, apart from the prose), with direction B's sides: art and cast on the left, prose and choices on the right, so the choices sit next to the lit hex.
- **Right: what happens and what you do.** The Law 37 identity header (step dots, title, the Reach readout, the forecast pill, the context line), then the stakes line, the scene prose, the factor lines and the hand in rows of four with the commit bar pinned at the foot, exactly as today. At 1080p a five-card hand is 4 + 1 rows and fits without scrolling (see the [1080p encounter](2026-10-14-thr-1829-encounter-stage/encounter-1080p.png)). The scene scrolls inside its column if a long step needs it (Law 33).
- **The aftermath wears the same panel** (Law 37), with the outcome word, the consequence chips (Law 56), the afterimage and *Continue*. The art, cast and *At stake* stay on the left, so the ending says what it is the ending of.
- **Compact tier.** A moment with no scene art and no cast (a story beat, a journey moment, an undertaking moment) is one column about 860 px wide. The window widens to fill the rest (see the [story beat](2026-10-14-thr-1829-encounter-stage/story-beat-1080p.png)).
- **Colour families stay** (Law 30): the encounter's veil palette, the premonition's two dream tones, story, elder and gain. The palette moves from the full-screen veil to the panel. No new token.
- **The god rail stays visible.** Identity and essence stay readable, so a spend visibly moves the pool (Law 47; see the [aftermath](2026-10-14-thr-1829-encounter-stage/aftermath-1080p.png)'s "Life 9 ▼"). The rail's hand rests, dimmed and click-guarded, with one line: *"Your hand is in play on the Stage"* during an encounter, *"Your hand waits while this moment is open"* for the others. There is one place to play a card at a time.
- **The top bar** stays as THR-1814 and THR-1828 build it: time names the pause, the right group is dimmed and guarded.
- **The Inspector folds** while the Stage is open and comes back with its subject when the Stage closes. Full view already closes for a pause-tier interrupt (THR-1827).

### 4. The map under the Stage

- **The dim.** Every hex but the lit ones gets the lens grammar's near-black layer (`#0b0907`) at `STAGE_MAP_DIM = 0.7`. This is deeper than a lens's 0.45 because under the Stage the map is the backdrop, not the subject. It is never a hue.
- **The lit hex.** The scene's hex keeps its full colour with a parchment ring (`--text-primary`) and a soft glow, and the subject's medallion sits on it. **The ring is never gold**: gold on the map is the Dominion frontier (THR-1831). A small tag over the window names the place ("Millbrook · where it is happening").
- **Which hex.** The beat's own hex when its data carries one (the encounter header, the queued story beat). Otherwise the subject's place: the agent's `located_at` resolved to its place tier (`resolveToParentLocation`), or the ruin's place for an emergence. These are worked out once, in the Stage view model behind the THR-1822 seam. **No hex known → nothing is lit, the whole map dims, and the camera stays where it is** (fail-soft).
- **A premonition** also lights the option under the pointer, with a dashed ring in its dream tone. The camera frames the subject's hex *and* every option's place in the window when they fit, and otherwise frames the subject's hex.
- **An open lens is set aside** while the Stage is open and comes back when it closes. Two dims do not compose (the THR-1830 radio rule, for the same reason).
- **Fog:** the lit hex is where the god's own mortal stands, so it is seen; a premonition option in fog lights as a ring without its terrain.

### 5. The camera

- **Before the Stage enters, the camera eases** so the lit hex (or the framed set) sits in the middle of the window. It uses the one fly-to that exists (`centerOn`, 500 ms). It keeps the player's zoom when the place is legible there and otherwise uses the centring zoom, k = 10 (THR-1831). The Stage's entrance follows on the ceremonial motion tier (Law 41).
- **Reduced motion** (Law 44): the camera cuts, and the Stage fades in at `--anim-fast`.
- **Between steps of one encounter the camera does not move** unless the step's hex changes.
- **When the Stage closes, the camera stays.** The player is now looking at the place where the moment happened, which is the point of the map being the table. *Show on map* (minimise, THR-1724/1730) leaves it there too.
- This is the "camera eases to the event" half of the map's *Signature motion* fog. The thread-draw moment when the god acts is still open.

### 6. Time

Nothing changes. Every pause-tier moment stops the world through the registry (Law 39, THR-1605). The top bar names it (Law 52). Escape and *Show on map* minimise, and a minimised moment waits (THR-1724, THR-1730). Watched-tier encounters keep their badges. The Stage adds no pause and removes none.

## Options weighed

- **Everything that pauses goes on the Stage.** Rejected: a gift or a receipt has no place to light, so the dim and the camera move would carry no meaning. Law 26 picks a surface by what the player does, not by weight.
- **Meet the First and the Threading Rite on the Stage too.** Rejected: they are about the god, their art is full-bleed comic panels, and their hands already scale to the whole screen.
- **The Stage fills the whole map region, and the hex shows in a corner inset.** Rejected: the inset is a second map to read, and direction B's point is the world itself staying on screen.
- **Prose left, cast right (THR-1724's sides).** Not taken: direction B's sketch, chosen a week later, puts the art and cast left and the choices right, beside the lit hex. THR-1724's real rule (the cast and *At stake* together, apart from the prose) is kept.
- **The god rail's hand plays into the encounter**, with no hand on the Stage. Rejected for now: the commit is the encounter's own two-beat act (Law 48) and belongs next to the forecast it changes. Two live hands would be two places to do one thing.
- **The camera returns to where it was when the Stage closes.** Rejected: the map is the table, and the place where a moment happened is the most useful thing to be looking at afterwards.
- **A lens dim and the Stage dim together.** Rejected for the same reason the lenses do not stack.

## Would change the call

- Christian: *"keep the encounter full-screen"*, *"premonitions stay a dialog"*, *"put the prose on the left"*, or *"put the camera back after"*.
- Christian's second look, which the UI review promised for the encounter Stage: this mock is it. Any part of it he dislikes reverses that part.
- A playtest where testers miss the lit hex: then the window gets a stronger place tag before the Stage moves anything else.
- A real hand of seven or more cards at 1080p that pushes the scene off the screen: then the left column narrows to 300 px before the hand shrinks.

## UI-Laws judgement (for the plan doc)

| Law | Verdict |
|---|---|
| 1 / 21 (every concept shown and linked) | The cast, the place tag and the context line route through `useRefRouter`. As today. ✓ |
| 7 (the hero illustration belongs to the stage) | Scene art is the left column's hero, at 16:9. ✓ |
| 26 (choose by what the player must do) | The three homes are chosen by what the moment is about, not by its weight. ✓ |
| 30 (sanctioned palettes) | The veil, premonition, story, elder and gain families move to the panel unchanged. No new token. ✓ |
| 33 (one viewport) | Both sizes fit, with the hand in rows of four (mock). The scene scrolls inside its column. ✓ |
| 37 / 38 (one chrome; fixed order) | The same header from the first step to the aftermath; the beat order is untouched. ✓ |
| 39 / 52 (pause-tier interrupts; time named) | Unchanged; the top bar names the pause. ✓ |
| 41 / 44 (motion tiers; reduced motion) | The camera ease and the Stage entrance are ceremonial tier; reduced motion cuts. Build obligation: record in `motion.md`. |
| 47 (a spend moves its pool) | Essence stays visible in the god rail. ✓ |
| 49 (no storm, no silent drop) | One moment at a time; the rest wait, named, in the Needs-you queue. ✓ |

## Feeds

| Ticket | What it takes from this |
|---|---|
| The map's **encounter Stage** plan doc (destination bullet 2) | This record is its input: the three homes, the layout table, the map and camera rules, the two constants. |
| [THR-1822](https://linear.app/threadbare/issue/THR-1822) (view-model seam) | A `stageView`: the moment, its palette, its lit hex(es) and its tag, resolved once. The story beat's hex and the agent/ruin fallbacks live there. |
| [THR-1819](https://linear.app/threadbare/issue/THR-1819) (1440p layout contract) | `STAGE_WINDOW_PX` 280 / 520, `STAGE_LEFT_COL_PX` 340 / 560, the compact tier's 860 px, the 24 px gutter. |
| [THR-1828](https://linear.app/threadbare/issue/THR-1828) (frame) | *Held behind this chapter* lists waiting Stage moments. |
| `interruptRegistry.ts` | A rule that Stage surfaces wait their turn (one slot). |
| The map's *Signature motion* fog | The camera half is decided here; the thread-draw moment stays open. |
| The map's *GameView split* fog | The Stage is one module (`Stage`, with the veil's step shells inside it), so the split's last undecided surface is now decided. |

Noted while measuring, for the Stage build to fold in rather than separate tickets: `JourneyVignetteModal`'s dead `size="md"` prop, and the unmounted `MeetingEncounterModal` (delete it or mount it on the Stage when the build reaches it).
