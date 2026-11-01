> **title:** Art-led pass, slice 6 — the ceremonies and the front door (THR-2102)
> **linear_issue:** THR-2102
> **author:** Claude Code (design lane, unattended, 2026-11-01)
> **created:** 2026-11-01
> **three_pillars:** Engine N/A — one presentation helper under `src/engine/views/`; no tick, graph, rule or trace change · Content done — no new sentences; two naming fixes (PC-6, Law 14) · UI done

# Art-led pass, slice 6 — the ceremonies and the front door (THR-2102)

*Slices 1–5 dressed the Inspector, the chrome, the Stage and the dialogs. This slice dresses the full-screen moments: meeting The First, the threading rite, the end of the age, the harvest, and the start page.*

## Why this is load-bearing

Christian, chat 2026-10-31: *"this type of treatment should be done to all the UI layers"*, after approving the person-page [mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM). Rules R1–R8 and their primitives are settled in the programme doc, [§ The dressing rules](2026-10-31-art-led-ui-pass.md#the-dressing-rules). Slice 1 ([THR-2097](https://linear.app/threadbare/issue/THR-2097)) built the primitives and is Done. This plan states which rules apply to each ceremony.

Measured on `main` at 92bf1fa0:

- **Two of the five already lead with art.** Meet The First opens on 3:4 candidate portraits, which the spark and bond beats carry (THR-1712, THR-1987; `SensingBeat.tsx:42-56`, `SparkBeat.tsx:196-202`, `BondBeat.tsx:152-193`). The start page is a painted background with the wordmark (`StartPage.tsx:64-83`).
- **The threading rite leads with the mortal's face, but draws it by hand.** The opening draws a CSS background of `candidate.imageAssetPath` over `candidate.placeholderGradient` (`ThreadingRite.tsx:231-245`). The bond-only card draws a raw `<img>` in `RevealCard.Medallion`, and nothing when there is no URL (`ThreadingRite.tsx:405-407`). Both bypass `resolveEntityVisual`, so an unpainted mortal gets a colour smear or an empty disc instead of the designed tile (Laws 3, 4).
- **The end of the age opens on words.** Its first art is The First at 72px wide (`AgeTwilightScreen.tsx:112-114`), below the ending. No heading draws a carved shape.
- **The harvest draws no art at all** (imports checked: no `EntityVisual`, no `Icon`). Each preserved echo is a text card that opens on a 2px amber dot (`HarvestScreen.tsx:48-51`). Its sphere pills print the raw key, so "chaos" appears in lower case (`:55-59`, against Law 14). The card names an echo by `def.name` (`:51`), but the line under the cards names the same echo through `echoDisplayName` ("the line of Maren Ashfold", `account-content.ts:127-131`). That is two names for one thing (PC-6).
- **Every echo points at something with art.** A legacy is an `actor`, a monument a `location`, a relic an `artifact` (`cycleEnd.ts:114-118`). `HarvestEchoCandidate.node` holds the node (`cycleEnd.ts:96-100`). The god's own echoes carry `originNodeId` (`types/echo.ts:44-68`). `resolveEntityVisual` resolves all three kinds (`entityVisualResolver.ts:115-195`).
- **The god's face has one path:** `ascendantPortraitSrc(state)` (`godSheet.ts:75`, extracted in slice 1).
- **Registry ideas that fit:** `harvest`, `mandate`, `doom`, `aspect`, `death`. There is no idea for *echo*, *memory*, *the rite* or *New World* (grep of `iconRegistry.ts` `meaning:` lines). Doom-kind shapes wait on Christian's pick ([THR-1908](https://linear.app/threadbare/issue/THR-1908)).
- **Levers:** `?view=game&firstunmet&size=medium` (meeting), `__DEBUG.openThreadingRite(agentId)` (`debug-bridge.d.ts:3497`), `__DEBUG.beginTwilight()` and `__DEBUG.endAge()` (`:3009-3015`), and the start page at `/`. `openHomedSurface` returns only a hint for these four (`useStageDebugBridge.ts:257-272`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Ceremony home (`CeremonyHost`, `homed-surfaces.ts`, `Overlay`) | 🟢 ACTIVE | reuses; the host builds descriptors |
| Entity visuals (`resolveEntityVisual`, `EntityVisual descriptor`, knowledge gate) | 🟢 ACTIVE | reuses: new read sites |
| God portrait (`ascendantPortraitSrc`) | 🟢 ACTIVE | reuses: one new read site |
| Carved icon registry | 🟢 ACTIVE | reads existing ideas only; no new shape |
| Harvest (`computeHarvest`, `HarvestResult`, `echoDisplayName`) | 🟢 ACTIVE | reads only |

## Decided by the design lane (delegation, process.md rule 4 — veto in chat)

1. **The harvest opens on the god's face.** The age was the god's, and no age-scene art exists (new art is out of scope). The face is a medallion above "Cycle N complete".
2. **The end of the age keeps its order and makes The First's face larger.** The ending stays first, because it answers "how did it end". The First's face grows from 72px to the ceremony portrait width. The ending heading draws `mandate` or `doom`.
3. **Every echo the harvest names shows its art.** A preserved echo card opens on the echo's picture: a face for a legacy, a place picture for a monument, the painting for a relic. Each of the god's own echoes gets a small picture before the line that names it. The words stay.
4. **One name per echo.** The echo card uses `echoDisplayName`, as the line under it already does. Sphere pills become sphere chips: the sphere's word ("Chaos"), its tint and its existing `sphere.<name>` tooltip.
5. **The threading rite's face goes through the shared resolver** in both rite shapes, so an unpainted mortal gets the designed tile. Nothing else in the rite changes. It already leads with the face.
6. **Meet The First and the start page are not changed.** Both already lead with art (R1 met), and their headings are scene words, not concept headings. The start page's menu stays words-only: only two of its items (Codex, Settings) have an idea, and a half-iconed menu reads as broken.
7. **Headings with no fitting idea draw none** and join Christian's icon pick ([THR-2104](https://linear.app/threadbare/issue/THR-2104)): "Echoes preserved", "What the world will remember", "The Rite of the Thread". This is the programme doc's rule (S1.2).

These decisions draw only on the programme doc and the UI Laws. None builds on an earlier slice's lane decision.

## Per-surface dressing

R1 subject art · R2 icons · R3 art tiles · R4 bond strip · R5 highlight · R6 sentences · R7 chips/bars · R8 quiet slot.

| Surface | Applies | N/A, with reason |
|---|---|---|
| Meet The First | — (decision 6) | R1 met (THR-1712). R2: beat titles are scene words. R3–R8: a narrative flow with no owned things, ties already drawn by its bond beat, no label rows |
| Threading rite | R1 through the resolver (decision 5) | R2: no idea (decision 7). R3–R8: as Meet The First, whose beats it reuses |
| The age ends | R1 larger First face (decision 2). R2 `mandate` / `doom` on the ending heading | R2: memory heading (decision 7). R3: memories are lines, not things. R5: the ending title is already the one emphasis. R4: the First's tie is its sentence |
| The harvest | R1 god face (decision 1). R2 `harvest` on the age title. R3 echo art (decision 3). R7 sphere chips (decision 4) | R2: echo heading (decision 7). R5: the age title is the emphasis. R8: an empty harvest already reads as one line (`harvestLeavesLittle`) |
| Start page | — (decision 6) | R1 met. R2: menu items are actions, not concepts. Settings and Credits modals are reference surfaces (Law 30) |

## UI pillar

### S6.1 Descriptors in the host (R1, R3)

- A new pure module `src/engine/views/ceremonyVisuals.ts`:
  - `echoVisual(state, def: EchoDefinition): EntityVisualDescriptor | null`. It resolves `def.originNodeId` through `resolveEntityVisual`, with kind from the node (`actor` → agent, `location`, `artifact`). A legacy's face takes the knowledge level the person page uses for that id (`getKnowledgeLevel(getFamiliarity(...))`, as `knowledge.ts:162`). A monument's place picture needs its hex's terrain, or the resolver returns the glyph tile (`entityVisualResolver.ts:180-182`). So it passes `terrain` and `sphereInfluence` from the location's tile, read as the place page reads them (`landProseInputFor`, `pageResolvers.ts:83-88`). A `card` echo returns `null`.
  - `godFaceVisual(state): EntityVisualDescriptor`. It builds `{ id: state.ascendantId, kind: 'avatar', name: godName(state), knownSrc: ascendantPortraitSrc(state) }` and resolves it. When there is no portrait it gets the designed tile.
- `CeremonyHost` calls them once when the harvest mounts. It passes `godFace`, `echoVisuals: Record<echoId, descriptor | null>` and `leaveVisuals` to `HarvestScreen`. Components draw `EntityVisual descriptor={…}` and never get `graph`, so the gate is not re-opened.
- The rite: `CeremonyHost` passes `riteFace: EntityVisualDescriptor`, resolved from `pendingRite.agentId`. The opening draws `EntityVisual size="portrait"` at `--ceremony-portrait-w` in place of the CSS background, keeping its radial mask. The bond-only card draws `EntityVisual size="portrait" shape="circle"` inside `RevealCard.Medallion`. `candidate.imageAssetPath` stays on the candidate, because the beats it feeds still read it.
- The end of the age: the existing `EntityVisual` (`AgeTwilightScreen.tsx:113`) takes `--ceremony-portrait-w` in place of `72`. Its graph read stays: it is today's call, and this slice moves no read.

### S6.2 The harvest (R1, R2, R3, R7)

- The god's face: `EntityVisual size="portrait" shape="circle"` at `--ceremony-medallion-w`, centred above "Cycle N complete". Alt text = the god's name.
- The age title draws `<Icon name={CEREMONY_HEADING_ICONS.harvestTitle} size="list" decorative />` before it, in the title's colour. No component names a shape literally (R2, Law 58); a `null` row draws nothing.
- `EchoCard` opens on `EntityVisual size="hero"` (16:9) from its descriptor, in place of the amber dot. No descriptor → no band, and the card draws as today without the dot. Card width: `HARVEST_ECHO_TILE_W`. The panel widens to `--ceremony-panel-max-w`, so five cards sit in two rows.
- The card's name: `echoDisplayName(def)`.
- Sphere pills: `<Tooltip id={`sphere.${s}`}>` around a chip reading `sphereWord(s)` (`essence-format.ts:94`), with a 2px left edge in `SPHERE_COLORS_BASE[s]`. This is the tint the end of the age already uses for its memories.
- The god's echoes: a centred row of `EntityVisual size="chip"` sits before the `harvest-leaves` line, one per echo with a descriptor. Each has alt = `echoDisplayName` and a `title` with the same name. The sentence is unchanged.

### S6.3 The end of the age (R1, R2)

- The ending `h2` draws `<Icon name={CEREMONY_HEADING_ICONS[ending.kind === 'mandate' ? 'endingMandate' : 'endingDoom']} size="list" decorative />` before the title. Do not draw a doom-kind shape: those wait on THR-1908.
- The First's face: as S6.1.

### Player-facing display

At 1920×1080 the harvest opens on the god's face in a ring, then the age's title with the harvest shape. Each preserved echo is a card that opens on its picture. A row of small pictures sits above the line naming what the god's age leaves. The end of the age shows The First's face at a size that reads beside their line. The rite, the meeting and the start page look as they do, except that an unpainted mortal in the rite now shows the designed tile.

### Player-facing text

No new sentence. Every line below is quoted from today's build, except the two marked *changed*.

| Surface | Exact text the player reads | Picture / hover | Complaint class | How the player understands it |
|---|---|---|---|---|
| Harvest title | "A Triumphant Age" (`HarvestScreen.tsx:40`) | `harvest` shape; existing `ui.harvest_type` tooltip | none | Unchanged |
| God face | — | alt = the god's name, e.g. "Aurelian" | PC-6 | The same face as the rail and the god's page |
| Echo card name (*changed*) | "the line of Maren Ashfold" in place of "Maren Ashfold" for a legacy (`echoDisplayName`) | the echo's picture, alt = the same name | PC-6 | Matches the line under the cards |
| Echo sphere chip (*changed*) | "Chaos" in place of "chaos" | tooltip `sphere.chaos` | PC-1 | The sphere word as every essence surface spells it, with its tooltip |
| Echo strength | "A resonant echo of the age" (`HarvestScreen.tsx:62`) | none | none | Unchanged |
| What the age leaves | "Your age leaves behind: the line of Maren Ashfold, the Spire of Ash and the Thorn Crown." (`account-content.ts:144`; names illustrative) | one chip picture per name, title = the name | PC-6 | Each picture sits in the row above, in the order the line names them |
| Ending | the ending title as today: "{Mandate name}, fulfilled" (`twilight-content.ts:40`), or the doom's final stage name (`twilight.ts:120-125`) | `mandate` or `doom` shape | none | Unchanged words |
| Rite | "THE RITE OF THE THREAD" and the mortal's name as today | the mortal's face, or the designed tile | PC-6 | The same face as their page |

### Event notifications

None.

### Debug inspection

- Each dressed node carries `data-ceremony-face="art|fallback|none"` (god face, First face, rite face) and `data-ceremony-heading-icon="<name>"`. Each echo card carries `data-echo-art="art|fallback|none"`.
- `window.__DEBUG.getCeremonyDressing(): Promise<{ kind: string; faces: { role: 'god' | 'first' | 'rite'; tier: 'art' | 'fallback'; widthPx: number }[]; headingIcons: string[]; echoCards: number; echoCardsWithArt: number; leaveEchoes: number; leaveChips: number } | null>` reads the open ceremony's DOM. `echoCardsWithArt` counts cards whose picture is `art` or `fallback` (the designed tile is a picture, Law 4). `leaveEchoes` is the number of god's echoes the harvest-leaves line names (`data-leave-count`). It returns `null` when no ceremony is open. Declared in `debug-bridge.d.ts`.

### Visual presence (HexMapV2)

N/A. The map is out of scope.

### UI Laws engaged

3, 4, 5, 8, 14, 17, 21, 25, 27, 30, 31, 33, 57, 58.

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Playtest signal

A tester at the harvest can say what their age left behind by pointing at the pictures, without reading the cards.

## Interface impact

Read sites only; no new cross-system write.

| Contract | Change |
|---|---|
| Ceremony host ← entity visuals (echo origins, god, rite mortal) | **add read**: `ceremonyVisuals.ts`, called from `CeremonyHost.tsx` |
| Ceremony host ← god portrait (`ascendantPortraitSrc`) | **add read**: `ceremonyVisuals.ts` |
| Harvest ← familiarity (legacy face gate) | **add read**: `ceremonyVisuals.ts` |
| `HarvestScreen`, `ThreadingRite` props | **extend**: optional descriptor props |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. `ceremonyVisuals.ts` is a render-time presentation helper under `src/engine/views/`, behind the THR-1822 seam, and reads only nodes the harvest and the rite already name.

## Content pillar

Encounter templates, prose tables and attachment content: N/A. No sentence is added. The two changes are naming fixes, decision 4: the echo card reads `echoDisplayName` (PC-6), and the sphere pill reads `sphereWord` (Law 14). The icon choices live in one table, `CEREMONY_HEADING_ICONS: Record<CeremonyHeadingId, IconName | null>` in `src/data/view-content.ts` (Law 58): `harvestTitle: 'harvest'`, `endingMandate: 'mandate'`, `endingDoom: 'doom'`, and `echoHeading`, `memoryHeading`, `riteHeader: null` (decision 7). A test asserts every `null` row is one of those three.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace | Debug visibility |
|---|---|---|---|---|---|
| `ceremonyVisuals.ts` | none (render-time) | HarvestScreen, ThreadingRite | none | none | `getCeremonyDressing()` |
| `CeremonyHost.tsx` (descriptors) | none | harvest, rite | none | none | `data-ceremony-face` |
| `view-content.ts` (`CEREMONY_HEADING_ICONS`) | none | harvest, end of the age | none | none | `headingIcons` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--ceremony-portrait-w` | 7rem / 9rem / 9rem (1920 / 2560 / 3440) | The First's face at the end of the age; the rite's opening face (today `min(220px, 18vw)`). Mirrored in `layoutContract.ts` |
| `--ceremony-medallion-w` | 6rem / 7.5rem / 7.5rem | The god's face at the harvest |
| `--ceremony-panel-max-w` | 56rem | Harvest panel width (today `max-w-2xl`, 42rem) |
| `HARVEST_ECHO_TILE_W` | 11rem | One echo card; four to a row at 56rem |
| `CEREMONY_HEADING_ICONS` | table in § Content pillar | Which shape each ceremony heading draws |

## Tracing

N/A — nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Echo origin node gone from the graph | The resolver's designed tile with the echo's stored name (Law 4); never a throw |
| `card` echo, or an echo kind with no visual | No picture; the card draws as today without the dot |
| Legacy mortal below `recognised` | Silhouette (Law 8) |
| God has no portrait | Designed tile in the ring |
| Rite mortal unpainted | Designed tile, not the gradient |
| Icon name missing from the registry | Fallback mark, warns once (existing `iconShape`) |
| Unknown sphere key | `sphereWord` capitalises it; the tooltip id falls back as `Tooltip` does today |

## Kill criteria

- **At 1920×1080 the harvest's button falls below the fold** with five echo cards (a triumphant age). First drop the god's face to `chip`. If it is still below, the echo picture becomes a 40px chip beside the name instead of a 16:9 band.
- **Christian calls the harvest "busy"**: keep the echo pictures, and drop the leave-chip row and the heading shapes (`CEREMONY_HEADING_ICONS` set to `null`).

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. Non-negotiable #1 (god, not protagonist) is served by the harvest opening on the god's face. The north star "the mortal has to feel like a person" is served by The First's larger face at the end and by the rite's designed tile.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-01-thr-2102-art-led-ceremonies-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Widths are tokens; icons are one data table |
| 2. Inspectability | PASS | `getCeremonyDressing()` and `data-*` attributes |
| 3. Determinism | PASS | No randomness; fallback tiles are id-hashed |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanical perfection | PASS | Pictures beside the words that name them; no sentence replaced |
| 6. Additive over destructive | PASS | Optional props; the amber dot and the rite's gradient replaced deliberately |
| 7. Performance budget | PASS | At most nine resolver calls, once, when the harvest mounts |

## Done when

- [ ] After `await window.__DEBUG.endAge()` on `?view=game&seeded&size=medium`, `await window.__DEBUG.getCeremonyDressing()` reports `kind: 'cycle-harvest'`, a `god` face, `harvest` in `headingIcons`, `echoCardsWithArt === echoCards`, and `leaveChips === leaveEchoes`. Every echo the harvest names shows its art or face.
- [ ] After `await window.__DEBUG.beginTwilight()`, it reports `kind: 'age-twilight'`, a `first` face whose `widthPx` equals the computed `--ceremony-portrait-w` at that viewport, and `mandate` or `doom` in `headingIcons`.
- [ ] After `await window.__DEBUG.openThreadingRite(<agentId>)`, the rite's face reports `art` or `fallback`, never `none`. A test covers an unpainted mortal drawing the designed tile in both rite shapes.
- [ ] No echo card prints a lower-case sphere key, and a legacy card's name equals its `echoDisplayName` (render test).
- [ ] At 1920×1080 and 2560×1440 the harvest with five echo cards and three god's echoes, and the end of the age with three memories, show their button with nothing below the fold (Law 33). `endAge()` on the seeded world does not promise five cards, so this runs as a viewport render test on a triumphant `HarvestResult` fixture (five candidates: legacy, monument, relic ×3). The browser screenshot shows whatever the seeded age yields.
- [ ] Meet The First (`?view=game&firstunmet&size=medium`) and the start page render as before (existing tests green).
- [ ] Four-part browser evidence: one 1920×1080 screenshot each of the harvest, the end of the age and the rite, one 2560×1440 of the harvest, console output, a `getCeremonyDressing()` assertion, and a UI-Laws judgment line.
- [ ] `npm run gate` green. After merge, one comment on THR-2104 lists the three no-idea headings.
- [ ] Closing commit body includes `Fixes THR-2102` on its own line.

## Coordination block

**Suggested model:** opus. It is a new module under `src/engine/views/`, so it passes the `review-gate` skill before auto-merge (THR-1691, THR-1949).

**Parallel-safe with:** THR-2098 and THR-2099 (Inspector and rail; disjoint files), THR-1908 and THR-2104 (icon picks).

**Mutex with:**
- THR-2100 and THR-2101: all three add to `src/debug-bridge.d.ts` and `src/data/view-content.ts`, and THR-2101 also edits `RevealCard` users. Build after both merge.
- Any open ticket editing `HarvestScreen.tsx`, `AgeTwilightScreen.tsx`, `ThreadingRite.tsx` or `hosts/CeremonyHost.tsx`.

**Files to touch:**
- Create: `src/engine/views/ceremonyVisuals.ts`, plus its test.
- Edit: `src/components/Game/{HarvestScreen,AgeTwilightScreen}.tsx`, `src/components/ThreadingRite/ThreadingRite.tsx`, `src/components/Game/hosts/CeremonyHost.tsx`, `src/data/view-content.ts`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, `src/index.css`, `src/components/shared/layoutContract.ts`.

## Notes for the executor

- Do not touch `MeetTheFirst/*` or `StartPage/*` (decision 6). The rite reuses `FormativeTestBeat`, `SparkBeat` and `BondBeat`; leave them alone.
- `cardEcho` is not shown on the harvest today. Do not add it: this slice dresses, it adds nothing.
- Do not invent shapes for the three headings in decision 7.
- Tests likely to need updating: `HarvestScreen` and `AgeTwilightScreen` render tests, `ThreadingRite` tests that query `threading-rite-portrait` (keep the test id on the new face).

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-11-01. Notes needing no change: each is listed with why.*

### NFP audit

PASS-with-notes:
- 1 Tunability, 3 Determinism, 4 Fail-soft, 5 Narrative, 7 Performance: PASS.
- 2 Inspectability: note. The full wiring checklist was too large for the auditor to read. The wiring table follows the template's column contract.
- 6 Additive: note. The amber dot and the rite's gradient are replaced on purpose; `candidate.imageAssetPath` stays.

### Three-pillar audit

PASS-with-notes:
- Engine: N/A-with-rationale. Content: present-and-substantive. UI: present-and-substantive.
- Notes: the Engine N/A rests on `ceremonyVisuals.ts` being a render-time helper, and the review gate is named for it. Blast Radius is correctly absent: no touched file has ≥100 importers (intent proposal § high-impact files).

### Vision audit

PASS-with-notes. No contradictions:
- North star: confirmed. Non-negotiable #1: confirmed. #2 and #6: confirmed. #3: silent. The chips show words, not numbers.
- Note: a slight lean toward attachment, since faces are added to the memorial moments. The "busy" kill criterion guards it.

### Intent-judge verdict

2026-11-01: **Allow** (Reversible). 15 substrate claims were checked and none was false. It raised two GAPs, both now fixed:
- dim 4: heading icons were named as literals in components. They now read `CEREMONY_HEADING_ICONS`.
- dim 3: three Done-when lines could not be run. Fixed with `widthPx` on faces, `leaveEchoes` against `leaveChips`, and a triumphant-harvest fixture for the fold check.

One wording nit is fixed too.
