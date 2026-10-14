# Brainstorm companion — The encounter Stage (THR-1877)

> Companion to [`2026-10-14-thr-1877-encounter-stage.md`](2026-10-14-thr-1877-encounter-stage.md). Written alongside the plan in the attended carve-up session of 2026-10-14. The *what* (three homes, the geometry, the dim, the ring, the camera, one moment at a time) was settled by the THR-1829 decision record and Christian's addition that the cycle end is a ceremony. This file records the *how* choices the plan made on top of them, and the alternatives it set aside.

## The problem in one line

A moment at a place takes the whole screen away from the place; and four hand-kept lists already have to agree about which surface is which, so a fifth (the Stage) would make Law 58's failure worse.

## Paths considered

### 1. Where the home lives

**A. One data list keyed by kind; every other list derived from it (chosen).** `HOMED_SURFACES` in `src/data/homed-surfaces.ts` carries kind, surface, home, stops time, waits its turn, palette, clock-holder words and held line. The open predicates (`HOMED_SURFACE_OPEN_WHEN`), the interrupt registry, `INTERRUPT_HOLDER_NAMES`, `DIALOG_CONTEXT_SURFACES` and THR-1821's `CEREMONY_SURFACES` derive from it; the three hosts switch exhaustively over their home's kind type.

- **For:** Law 58 as written ("one list", "a second list that must agree with the first is derived from it"); moving a moment between homes is one field and two compile errors that name it; the data file is readable by the engine's Needs-you view model.
- **Against:** the list holds words (holder names, held lines) next to structure. Accepted: one entry per kind holding its own words is exactly "one place".

**B. Add `home` to the interrupt registry's entries only.** Rejected: the cycle harvest is not an interrupt, so the ceremony list would stay separate; the holder names and palettes would remain parallel lists.

**C. Three host-local arrays (each host lists its own surfaces).** Rejected: three lists that must agree with each other and with the registry, which is the defect Law 58 names.

**D. Put the list in `src/components/shared/surfaceHomes.ts` (THR-1821's file).** Rejected: the engine's Needs-you view model needs the held lines, and the engine may not import from `src/components/`. `surfaceHomes.ts` keeps its export, derived.

### 2. The word

The ticket says "moment kind". Two code words were taken:

- **Moment** is the UL's undertaking report (`Agents.md` § Moment), and `MomentCard` is its surface.
- **Beat** looked free (Laws 37–39 use it loosely), and the first draft used `BeatKind`. The intent judge found that `BeatKind` already exists: it is the ascendant beat's kind (`src/types/ascendantBeat.ts:19`), imported by `trace.ts`, and the UL's Offering entry says "beat kind `offering`". Two unions with one name in the same files would be worse than the Moment clash.

- **Surface** is a third: the UL's Surface is an encounter template bound to its context (`Encounters.md` § Surface, `SurfaceKey`). The second judge pass found it. But the UI code has long used *surface* for the thing on screen (`INTERRUPT_SURFACES`, `surfaceId`, `DIALOG_CONTEXT_SURFACES`, THR-1821's "a surface's home").

**Chosen: *homed surface*, always qualified.** The list is `HOMED_SURFACES`, its key `HomedSurfaceKind`, the home union `HomeId`; no new name starts with a bare `Surface`, so an encounter's `SurfaceKey` and its `HomedSurfaceKind` never meet. Player text keeps "moment". Proposed to the UL, with all three disambiguations, in comments on THR-1882.

**Considered and set aside:** inventing a new word (*showing*, *arrival*, *foreground item*). Each would be a fourth vocabulary beside the registry's own, which the next agent would have to learn for no gain.

### 3. What is in the list

**Stops the world, or comes forward on its own (chosen).** That is exactly the 15 interrupts plus the cycle harvest. Doom, Mandate, Omen, the Codex, Settings and Read the Threads are *tools* the player opens from the chrome; they are dialogs by nature and THR-1820 already sizes them in `DIALOG_SIZE_SURFACES`. Including them would have turned the list into "everything any host mounts", with no rule for what belongs.

### 4. The hold rule

**A. One foreground; the incumbent keeps it; list order when free; dialogs render over it, and only the foreground's own dialogs can arrive (chosen).**

**B. Ceremony preempts the Stage.** A rite coming due would hide an open encounter. Rejected: the most common rite arrives *from* an aftermath (a thread binds), and hiding the aftermath before it is read is the stacking THR-1754 guarded against.

**C. Pure priority, no incumbent.** Rejected: a higher-priority moment arriving while a lower one is open (a chain from a choice) would swap the panel under the reader's eye.

**D. Today's co-render.** Rejected: it is the measured gap (`interruptRegistry.ts:141-143`) and the PC-5 stacking finding.

**E. A rule that makes every dialog wait while the Stage is open.** Not needed as a blanket rule. The judge asked whether an offering arriving with an encounter would draw over the Stage: it cannot, because a gift's auto-entry already waits while any other interrupt is open (`giftDelivery.ts:62`, THR-1809), the ledger, court and choice sets are opened from guarded chrome, and popups wait. A later pass found one real hole: a modal **divine receipt** is raised by a tick phase when an earlier act resolves (`processPlayerReceipts`), or by clicking its toast, so it could open over the Stage. Chosen: the receipt alone gets `waitsTurn: 'foreground'` (held, named, opens after), and its toast is guarded like the chrome. Rejected: letting the receipt open over the Stage and weakening the playtest signal; THR-1829 § 2 allows dialogs over the Stage only when the Stage asks for one. Each fact is pinned by a test, so a later change that breaks one fails loudly.

The one deliberate ordering change besides the single slot: the Threading Rite now goes ahead of a Stage moment that has *not yet opened* ("ceremony outranks the Stage"), while still never interrupting one that has. The cycle harvest joins the foreground (so it never covers an open encounter) without joining the clock's count.

### 5. The Ledger rail while the Stage is open

**Steps aside completely (chosen).** The window is the right edge of the map, which is exactly where the Ledger rail sits; with the rail visible, the window would show the rail and the camera would centre the lit hex under it. The decision's map region (1600 / 2160) and THR-1819's panel width both assume the space right of the god rail is the Stage's. THR-1875's first comment said the frame does nothing special there; after the plan's reply it adopted the change in its own build (a `hidden` rail state keyed on the Stage's phase, applied before the camera ease), so the Stage only sets the phase.

**Fold to the 56 px strip.** Rejected: it eats a fifth of the 280 px window.

**Let the canvas run under the rail always.** Kept as kill criterion 4: it is a frame-layout change and belongs to THR-1875, raised only if hiding the rail makes the canvas jump.

### 6. The dim and the lens

**A Three.js layer on the lens grammar (chosen).** The same near-black plates the Dominion lens uses, at 0.7, above agents and labels, below fog; rings above fog.

**A DOM mask over the canvas with a hex-shaped hole.** It would dim the HTML label overlays too, but the hole would have to track the camera, and it would be a second dim implementation beside the lens one. Rejected; the HTML overlays are simply hidden while the Stage is open and the place tag names the place.

**The lens while the Stage is open.** The first draft switched the lens off and restored it. THR-1878's coordination comment asked instead for one flag, `lensSuppressed`: the lens layer hides, the bar keeps its pressed state, the lens returns on close. Adopted: it keeps the player's choice visible, and it is one flag the lens build already reads.

**The map controls.** They sit bottom-right of the map, inside the window, and the map is inert under the Stage. Hidden while the Stage is open (Law 25: a control that does nothing does not render).

### 7. The camera on close

**The decision:** "the camera stays." **The refinement:** the returning Ledger rail (and a returning docked Inspector) covers the right edge of the map, exactly where the window was, so "stays" would leave the place under chrome. The plan keeps the decision's intent (never go back to the old view; keep looking at the place) and eases the smallest distance that keeps the place visible, only when needed. Rejected: re-centring every time (moves the map for no reason), and the literal "do not move" (hides the place).

### 8. A name clicked on the Stage

**The Inspector opens docked over the Stage's right side; Escape returns (chosen).** Law 21 needs a click to open the thing's page, and PC-8 needs it to answer at once.

**Queue the page until the Stage closes.** Rejected: a click that answers later is the PC-8 failure.

**Pin the hover card.** Rejected: the hover card is Tier 1 of the ladder (Law 20); a click must reach the page.

### 9. The god rail's cards while the Stage is open

The first draft had the Stage drive the god rail's resting cards, with THR-1829's line "Your hand is in play on the Stage". THR-1875's comments showed the frame already rests the rail's cards for every interrupt, and then corrected the words: the rail holds the god's map cards ("Your cards"), while an encounter plays its own hand of nudge cards dealt from the Repertoire (UL `Encounters.md`), so THR-1829's line would tell the player the rail's cards are in play when they are not (PC-6). THR-1829 had itself rejected "the god rail's hand plays into the encounter". Adopted: THR-1875's lines stand unchanged ("Your cards wait. This encounter deals its own hand." / "Your cards wait while this moment is open."), the Stage changes nothing in the rail, and the plan records the refinement of THR-1829's string.

### 10. Measuring the window

**From the DOM after layout (chosen),** two animation frames after the rails move. **`useLayoutTier()` with token arithmetic** (THR-1819's suggestion) was set aside: it would duplicate the CSS in JS and break the moment a rail's width depends on state.

### 11. The map under the Stage

**Inert (chosen).** If the player could pan, the lit hex would leave the window and the tag would point at nothing. *Show on map* is the existing way to look around, and it sets the moment down.

### 12. Slicing

**Four slices, the story beat first on the Stage (chosen).** S1 (the list and the hold rule) has no new look and can land right after the GameView split. S2 builds the frame with the smallest tenant that has its own hex. S3 moves the 3,957-line veil alone, so frame bugs and veil re-layout never mix in one PR. S4 moves the rest.

**Encounter first.** Rejected: the biggest file on the least-proven frame.

### 13. Panel height

**Fixed to the frame (chosen).** One chrome from the first step to the aftermath (Law 37); a panel that changes height between steps jumps under the reader. Law 57 forbids scrolling or cutting before the limit; it does not ask a short moment to fill the panel.

### 14. New headings on the premonition

The decision's mock labels the premonition's left column "Who you saw" and "A compulsion". Those words exist nowhere in the game. The plan keeps the premonition's own words ("A Stirring in the Thread", "The God's Will", its dismiss lines) and puts its existing subject block on the left, so no new heading enters without being quoted and checked.

## Tensions surfaced

- **Law 57 vs a fixed frame:** resolved above (13).
- **"The camera stays" vs returning chrome:** resolved above (7); recorded as a refinement, not a reversal.
- **Ceremony outranks the Stage vs THR-1754:** resolved by the incumbent rule (4A).
- **Three hosts reading one list vs THR-1881 being "moves only":** THR-1881 moves the JSX; S1 then makes the hosts read the list. THR-1881 is asked to put the harvest in `CeremonyHost` and the warm start in `DialogHost` so S1 does not have to move them again.
- **Two plans writing one module:** THR-1875's top-bar slice moves the interrupt registry and adds `collectHeldMoments`; S1 rewrites its rule. Whichever lands second edits the other's version; the export names do not change.

## Vision premises invoked

- `01-core-loop.md`: "at any given time, there is one story front-of-stage, and the game knows it"; "the bookshelf is full, but the stage still holds a single scene"; "Time stops for every moment".
- `02-non-negotiables.md` #3: mechanics through prose, never numbers.
- `taste-profile.md`: prose-first, plain-register UI.

## Open creative forks (not decided here)

None that the plan needs. Small wording calls were made and invite a veto: the premonition's place tag ("Millbrook · where Maren Ashfold is"; "Corran Fields · where the dream pulls") and the held lines' phrasing ("A vision on Maren Ashfold's road", "News of Maren Ashfold's work", "The end of the age").
