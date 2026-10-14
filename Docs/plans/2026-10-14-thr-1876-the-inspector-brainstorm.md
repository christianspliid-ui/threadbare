# Brainstorm companion — The Inspector (THR-1876)

> Companion to `Docs/plans/2026-10-14-thr-1876-the-inspector.md`. Written in the same pass. It records the alternatives weighed, the tensions found, the Vision premises invoked, the calls made under delegation (veto invited in chat), the one open question, and the field inventories the parity tests (plan § D7.11) are built from.

## Decisions made in this plan under delegation (process.md rule 4; veto in chat)

These are technical or information-architecture calls inside Christian's 18 agreed calls; none changes what the game means. Each would change on his word.

1. **A relation lives in one place: Connections.** Body tabs describe the subject; lists of other world things (people at a place, a faction's members, a person's bonds, an artifact's holder) are Connections rows. The mock's Full-view faction page drew "People · 15" as a tab *and* as Connections in the aside — two lists of one fact. Would change if: Christian wants the richer per-row lists back as tabs (they would read the same Connections VM, so they cannot disagree; it is a layout choice).
2. **The hover card is the fourth width.** `visibleAt` names `hover` beside docked / wide / Full, so one table decides the hover card and the Inspector. Alternative: a separate hover list — rejected, two lists that must agree (Law 58).
3. **Per-width visibility is how a long tab row fits docked.** The person's Chronicle and Chapters show wide and Full only, and docked shows "More when widened: Chronicle · Chapters" — the mock's "More ▾" without a new Tabs overflow menu.
4. **Docked folds only when the page would overflow** (fit, then fold, largest group first), not at a fixed count — Law 57 read with THR-1820 § 2's Inspector row. THR-1822's `CONNECTIONS_DOCKED_FOLD_AFTER` is the size a group folds *to*, not a cap.
5. **A docked Inspector does not hold a gift; Full and an armed card do.** The drawer held gifts because it was a moment of choosing; a docked page can stay open for an hour.
6. **Map click on a city's hex opens the land page, not the city.** The city is the first row of *In this land*; the place label opens the city directly (call 15).
7. **No Release on the land page.** HexChronicle's Release was never wired; the god rail's Covenants row is the one home that manages covenants.
8. **The culture's customs prose moves to the Realm's page**, not the land page (call 16 lists three land blocks; customs describe a people).
9. **The faction network diagram and stat grid retire**; Connections and counted group headers replace them.
10. **Full's clock holder reads "the full view"** ("held by the full view · runs on when it closes").
11. **Section labels move to sentence case at the source in S1**, not in THR-1879's sweep, because the Inspector touches `Section.tsx`.
12. **`extending.md` rows land with each build slice**, not in this plan PR, so five parallel plan PRs do not collide on one table today. The exact row text is in plan § D15.

## Seams agreed with the parallel plan sessions (comments on THR-1876, 2026-10-14)

- **THR-1875 (frame):** `inspector.open` folds the Ledger; the Ledger's flyout over the Inspector's edge joins the escape order; `HandPressContext` is the hand's one seam (the frame's default opens the Codex entry, S6's provider arms); Find is a `find` entry in `TOP_BAR_ITEMS`; keys join the frame's duplicate-key test; the selectors move is first-come.
- **THR-1878 (lenses, chrome):** no lens click route (the land-page route covers lit hexes); one camera jump, `CAMERA_CONSTANTS.FOCUS_ZOOM` + `focusOn(hex)`; `lensSuppressed` so arming's dim never stacks on a lens's. The first draft of this plan had assumed THR-1878 would wire the lit-hex click and named the zoom `MAP_CENTRE_ZOOM`; both were corrected after the intent judge pointed at the comment.

## Open question (a genuine creative fork — not decided here)

**Should a person or place card need the god to be near?** THR-1827's mock and decision assumed every card has the flat three-hex range ("someone out of reach glows dimmer and says why — more than 3 hexes from Vara"). Measured: the engine applies range only to cards cast on bare land. `buildActorTargetContext` and `buildLocationTargetContext` set `position: null`, so people and places read `rangeStatus: 'unlimited'` (`targetActions.ts:500-510`). Call 14 also says "range is unchanged", so the plan keeps today's rule and lights every valid person or place as castable wherever it is. Whether distance should limit the god's reach over mortals and towns is a question about what the god is — a rule of play, `Docs/canon/rulebook.md` territory — so it goes to Christian, not to an executor. If he says yes, it is a separate rules ticket; the Inspector shows whatever reason `getTargetActionSlots` gives, so it needs no change.

## Alternatives weighed

| Question | Chosen | Rejected, and why |
|---|---|---|
| Where Inspector state lives | THR-1881's `GameScreenState` reducer | GameState (it is view state, not world state; would touch a 724-importer file); a module singleton (load-bearing decision: caches per session) |
| How the router changes | `card` / `sheet` arms call an `openInspector` config callback; registry gains `opensAt` | A second router for the Inspector (THR-1482: one router); `openSheet` returning the Inspector (hides the size choice inside a navigation target) |
| Graph event nodes | `{ kind: 'event-node', nodeRef }` subject | Adding `event` to `WorldRefKind` (anchor-catalog membership is load-bearing; THR-1315 kept the vocabulary closed) |
| Cultures opening wide | Through their Realm faction (`resolveCultureRealm`) | A `culture` WorldRefKind (no sheet ever existed for one; the Realm already speaks for it) |
| New section shapes | `links` and `cards`, plus optional fields on `panel` | A `facts` kind beside `panel` (two shapes for label/value rows); a "legacy component" section that embeds a retiring tab (Law 58: a new field is a row, not a component) |
| Magnitude on facts rows | optional `meter` bar beside the word | dropping bars (loses the existing non-numeric reading, Law 13's unitless-proportion ruling); numerals (Law 13) |
| Domain dots on the person page | dropped; rank word only | keeping magnitude dots (Law 10: pips mean odds) |
| Land prose move | lift memos into pure functions, byte-for-byte, keep HexChronicle's hash | unify the two `hashString`s (changes every land's text); re-author the prose (THR-1827 says the existing prose moves) |
| Card-first lighting on the map | THR-1878's lit/dim layer fed a `MapHighlightVM` | a second dim layer for arming (two dim grammars); a lens id `armed` (the lens union is closed to four and arming is not a lens) |
| Inverse targeting | `evaluateCardOnTarget` through `getTargetActionSlots` with one template | a hand-written predicate set (would drift from the drawer's gates and Dominion pricing) |
| Commit for map click and drag | choose, then "Cast on X" | cast on drop (Law 48: an irreversible act is armed, then fired; a drop is not a deliberate second beat) |
| The lab's two tiers on one screen | a tier toggle that sets root size and frame tokens for the lab | iframes per cell (heavy, breaks HMR); only the browser's real tier (cannot compare 1080p and 1440p side by side) |
| Slicing | eight slices (S1–S7 + art deferral) | one PR (≈ 15k lines changed incl. deletions); deleting sheets in S3 (no proof yet that their fields moved) |

## Tensions surfaced

- **Seven profile tabs vs Connections.** The first pass carried AgentProfileModal's seven tabs; the second pass added Connections. Both hold once relations move to Connections: Bonds keeps the relation *to the god* (what she is to him, threads between them) and disposition; Attachments keeps the person's own attachments. Companions move to Connections (they are people).
- **Law 57 vs a fixed fold count.** THR-1822 typed `foldAfter = 6`; Law 57 forbids a fixed cut while the panel can grow. Resolved: fold only at overflow, to six.
- **Range as decided vs range as built.** See the open question.
- **Two essence readings.** The rail's numerals (Law 13 persistent-chrome exception) and the god page's words read one selector; different renderings, not a disagreement.
- **The land page's "In this land" vs HexChronicle's People and Places prose.** The index replaces the lists; the culture prose moves to the Realm.

## Vision premises invoked

- `TheFantasyWorldSimulator/Vision/02-non-negotiables.md` #3 (mechanics through prose), #4 (everything a graph node — the land page is a page kind, not a node), #6 (additive).
- `TheFantasyWorldSimulator/Vision/01-core-loop.md` (one story at a time: Full yields to every moment).
- `TheFantasyWorldSimulator/Vision/03-design-tensions.md` (legibility vs. mystery: gating deferred, seen floor on Find, fog on armed lighting).
- `TheFantasyWorldSimulator/Vision/taste-profile.md` (prose-first UI; sphere-tinted cards are loved — tint kept on every card surface).

## Field inventories (the parity tests' source)

Measured 2026-10-14 at `main` @ `0afcfc2b` by four Explore surveys. Each line: field → its home in the plan. "C:" = a Connections group; "H" = the header; "R:" = retired, with reason.

### Person (AgentProfileModal, its tabs, ThreadDetailView)

- Header: portrait → H (Law 8); name + rarity → H; archetype epithet → H (I+); knowledge level → H chip; "Is at" → H where line; attuned sphere → H chip; Dominion → H chip (band word) + `dominion` row (the line); under your hand → `under_your_hand`.
- Overview: death cause / by / past → `fate`; location, sphere → H (duplicate); archetype, calling, god mark, rite line, means → `who_they_are`; intention → `intention` (one gate); faction · culture line → C: belongs to; faction section (heraldry, link, rank) → C: belongs to (rank word as fact); hold line → `allegiance`; faction standing → `allegiance` (word + bar); company / army / network → C: belongs to + `company` prose; core tracks → `core`; nature → `nature`; knows the way to → `who_they_are` (a facts row with place links: a skill, not a relation); reputation + standings → `reputation`; personality + traits → `personality`; words → `words`; origin → `origin`.
- Prowess: domains → `domains` (dots R: Law 10); conditions → `conditions`; bestowed powers → `bestowed_powers`.
- Attachments: companions → C: who; slot groups → `slots` ("(n/cap)" → group count); knows → `knows`; inactive → `inactive`.
- Bonds: faction + rank + standing → C: belongs to + `allegiance` (duplicate R: PC-6); relationships → C: who / friends and foes (bond word + trust phrase as fact; the hard-coded `getTrustDescriptor(0.5, …)` R: dead input, the row uses the bond's own strength word); blood → C: friends and foes; agreements → C: holds and knows; disposition → `disposition`.
- Journey: last seen → H (duplicate); follow toggle → toolbar Follow; the work → `the_work`; ambitions → `ambitions` (priority key worded); arc so far → `arc_so_far`.
- Chronicle: their story → `their_story`; timeline → `timeline` (move keys worded); full account → `full_account`; interaction record → `interaction_record`; completed ambitions → `completed_ambitions`.
- Chapters: chapter rows → `chapters` ("active · step N" worded; pager → fold).
- ThreadDetailView: category, name, tier → H; revealed notices → `revealed_notices`; domains grid → `domains`; sphere → H; quintessence (never set) R: dead source; activity → H doing line; on their mind → `intention`; under your hand → `under_your_hand`; story so far → `story_so_far`; designs → `designs`; intelligence → `intelligence`.
- Registry rows: `portrait_with_disposition` kept; `what_she_is_to_him`, `threads_between_them` kept (bonds); `recent_encounters` hover only; `faction_allegiances` hover only; `notable_capabilities` R: dead source.
- Unmounted: `Game/AgentInfoCard.tsx`, `components/AgentInfoCard/AgentInfoCard.tsx` R: dead code (S4).

### Location, Place, Area, hex (LocationProfileModal, LocationView, HexDetailView, HexBreadcrumb, HexSidebar, HexChronicle)

- LocationProfileModal: name → H; rarity · kind · archetype → H; place prose (`archetypeProseFlavor`) → `place_prose` (one source, R: duplicate); held by + pilgrim ways → C: belongs to; your reputation here → `standing`; conditions → `conditions_here` (has_trait source).
- LocationView: header with raw `locationType` and "(col, row)" → H (worded; coordinates R: Law 14); past line → `past_line`; place prose → `place_prose`; Place of Power inspector → `place_of_power`; hero → H; livelihood → `livelihood`; Dominion → `dominion`; contested → `contested`; walls → `walls`; inhabitants / agents present → C: who; sublocation cards (art, name, badges, occupants) → C: holds and knows (occupants as fact) and each Place's own page; "also available" encounters → that Place's `encounters_here`; guild postings → `guild_postings`; encounters active / available → `encounters_here`; sublocation drill-down R: a Place is its own page. (`ensureSublocations` writing the graph during render R: no surface writes the graph — the seam's rule.)
- HexDetailView: terrain → land H; region / feature / danger → land H chips (one danger ladder); elevation / temperature / moisture (designer view) R: designer-only raw geo, not player content; locations / agents → *In this land*; sphere resonance (designer view) → land H soul chip; "Go to Hex Chronicle" R: the page is the chronicle now.
- HexBreadcrumb: region / terrain title → land H name; "(col, row)" R: Law 14; culture · faction → *In this land* holder / halls; sphere dots → land soul chip; counts R: counts belong on group headers; sight badge → land H sight chip.
- HexSidebar: region + size + feature words → `area_facts` (Area page); positional danger → land H chip; sphere bars → `area_facts` / land `its_soul`; culture / controls → *In this land*; counts R: group headers; location links → *In this land*; monster lair card → *In this land* Lair row (raw sphere key worded) and the lair's own page; collapsed rail R: no rail.
- HexChronicle: fog state → land page fog line (the header lede for an unexplored hex: "Unknown territory"); hero → H; The Land → `the_land`; The Places → *In this land*; The People: survey → `the_land`, culture / faction prose → Realm `customs`, held by → *In this land* holder, factions present → *In this land* halls, souls → *In this land* people; The Soul → `its_soul`; The Ruins → `what_came_before`; discovered sites → *In this land* (first read of `hexRevelation`); Divine Presence → *In this land* covenants (Release R: never wired; god rail owns it).
- Registry: `place_painting` hover only; `what_this_place_wants` hover only; `conditions_here` source replaced; `memory` kept ("at tick N" worded).

### Faction, army, artifact, attachment, god, content (FactionSheet, ArmySheet, ArtifactSheet, AttachmentDetailView, AscendantSheet + bar selectors, generateContentPage)

- FactionSheet: sigil / name → H; doctrine glyph, dissent glow → H heraldry states; description, motto → `description`; Dominion → `dominion`; kind chip → H; court at → H where line; governs N seats → C: holds and knows header count; Ascendant Actions → Act row; venerates → `venerates`; pilgrim ways → C: holds and knows; stat grid R: group headers; woven successor → C: who fact "heir"; network diagram R: Connections; leadership, members → C: who (by rank); strongest reaches → `strongest_reaches` (score R: Law 13); halls & seats, control → C: where / holds and knows (raw subtype worded); means → `means`; agenda → `agenda`; conclave → `conclave`; relations → C: friends and foes; recent actions → `recent_actions` (source replaced, keys worded); ranks → `ranks` ("(N slots)" R: Law 13).
- ArmySheet: name, hero → H; size · cohesion · supply → `who_they_are`; objective → `what_they_are_doing` (field fix); commander / raising faction (registry only) → C: who / belongs to.
- ArtifactSheet: hero → H; rarity · kind → H; Dominion → `dominion`; made by → `made_by`; flavour → `icon_with_meaning`; what it does / the catch → `what_it_does`; traits → `traits`; tags → `tags`.
- AttachmentDetailView: name + Codex link → H + "Read in the Codex"; art / glyph → H; tier · subcategory → H (raw subcategory worded); flavour → `its_voice`; effect → `effect` (`mechanicalSummary` R: Law 13; raw `agreementType` worded); duration → `duration`; tags → `marks`; triggers → `triggers` (raw `payload.kind` worded, "(Nx)" R: Law 13); source → `source`.
- AscendantSheet: portrait, name, archetype title, cycle — age, quintessence, primary / secondary → H; divine nature → `divine_nature`; reaches + path link → `reaches`; essence → `essence`; divine threads → C: who ("N divine positions" R: count belongs on the group header); companions → C: who. Bar-only selectors: signatures → `signatures`; actions → Act on the god; covenants → C: holds and knows (raw coordinates fixed); mandate → `mandate`; hooks → `hooks`; seat → H.
- Content card: kind / name / trail → H; what it is → `what_it_is`; its voice → `its_voice`; marks → `marks`; CTA → "Read in the Codex"; unknown stub → missing page.
- Registry: faction `how_they_hold_her`, `reputations_they_hold` kept; `allied_with`, `opposed` R: Connections; `recent_actions` source replaced; item `icon_with_meaning`, `previous_uses` kept, `who_gave_it` R: Connections, `how_it_tilts_this_scene` hover; event `what_happened`, `what_it_became`, `how_it_invokes_now` kept (record kind), `who_was_there` R: Connections; group `who_they_are`, `what_they_are_doing` kept, `who_leads_them` R: Connections.
