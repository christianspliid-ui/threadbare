# Brainstorm companion — Art-led UI pass

> Companion to `Docs/plans/2026-10-31-art-led-ui-pass.md`. Written in the same pass. Alternatives considered, tensions surfaced, Vision premises invoked, and the calls made under delegation (veto invited in chat).

## How this started

Christian, chat 2026-10-31: *"The UI layout of the menus, especially the character menus could use a pass to heighten the quality using icons, images, and so on."* An attended session captured Kael Thornweaver's wide person page at 1920×1080 and drew the same page with the art and icons the game already ships ([mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM)). Christian: *"yes. and after that this type of treatment should be done to all the UI layers."*

The audit behind the mock found the art exists and the page does not show it: a small portrait box, four carried relics with painted 16:9 art rendered as text chips at the bottom of Bonds, and an Overview made of "Label … Value" rows (UI Law 16 calls that unfinished UX). The carved icon registry (THR-1879) holds 229 shapes and almost none reach the Inspector's tabs or section headings.

## First-pass framing I considered

"Add icons to the person page." Too narrow twice over. The Inspector draws every page kind through one renderer (THR-1876), so a person-only change either forks the renderer or leaves six page kinds behind. And Christian's follow-up names every UI layer, not only the Inspector, so the useful product is a small set of rules plus shared primitives every layer can take up, not a person-page restyle.

## Alternatives considered

**A. One big restyle PR across every surface.** Rejected: dozens of surfaces, five homes (Inspector, god rail, Stage, dialogs, ceremonies), and no way to review it. Inspector THR-1876 sliced eight ways for the same reason.

**B. A wayfinder map for "all UI layers".** Rejected: the design-session scale gate sends *foggy* efforts to a map. This one is not foggy — the direction is agreed (the mock) and Christian has said yes. What is left per layer is applying the rules, which is design-lane work against a settled vocabulary, not open decisions.

**C. Per-surface hand styling (each surface draws its own art tiles and icon headings).** Rejected by UI Laws 26–27 (primitives are the only place presentation lives) and 58 (the UI grows by adding entries). The rules become primitives and registry fields once, in slice 1, and every later slice composes them.

**D. Chosen: a programme in seven slices.** Slice 1 builds the primitives and dresses the person page (the approved mock). Slices 2–7 each take one UI layer and are planned by the design lane against § The dressing rules, blocked on slice 1 because they compose its primitives.

## Calls made under delegation (process rule 4; veto in chat)

1. **The portrait keeps Law 5's 3:4.** The mock drew a landscape crop; the build uses the canonical `portrait` ratio at a per-tier width token (`--inspector-portrait-w`). No fourth picture size.
2. **Carried-object tiles use the `hero` 16:9 ratio.** Every item art file is 1376×768, so the tile shows the whole picture without a new size.
3. **Reuse ideas the registry already has; add one.** The mock's five new picks collided with existing ideas: `person` is "a mortal", `hooded-figure` a companion, `mirror-mirror` a trait, `sprout` spring, `candle-flame` attention. One idea, one shape (Law 10), so the build reuses: Overview draws the subject kind's icon, Who they are draws `person`, Nature and Personality draw `trait`, and the inline Heartfire icon is dropped (the term stays a tooltipped link). Only the Prowess tab needs a new idea. It ships provisional (`sword-brandish`) and goes to Christian's pick sheet in THR-2104, beside THR-1908 and the slice 2 tabs.
4. **Temper bars use the existing `meter` reading** (THR-1876 kept a unitless proportion bar beside a word under Law 13). The bar never shows a number.
5. **The bond picture shows only a bond the engine holds.** No thread edge to the god → no picture (Law 56's spirit: no drawn claim without state).
6. **The world map is out of scope.** It already draws art signifiers; Golden Hour stays and the dark map is parked (Christian, 2026-10-11).

## Tensions surfaced

- **Mock vs Law 5.** Resolved by call 1: the mock's landscape crop was a mock convenience.
- **A bigger aside vs the 1080 floor.** A large portrait plus a gallery under it can overflow the aside at 1920×1080. Resolved: the aside already scrolls inside itself (Law 33), and the portrait width is a token sized per layout tier, so the floor keeps name and Act row above the fold.
- **Prose "Who they are" vs inspectability.** Turning five rows into a sentence loses scan-ability. Resolved: each fact stays a linked, tooltipped concept inside the sentence (Laws 17, 21), and the rows remain readable in the designer view.

## Vision premises invoked

- Non-negotiable #3, mechanics reach the player through prose: the Who-they-are sentence and the highlighted ambition.
- Non-negotiable #6, additive: new section kinds and optional VM fields; nothing removed from the view model.
