> **title:** Art-led pass, slice 7 — lists and notices (THR-2103)
> **linear_issue:** THR-2103
> **author:** Claude Code (design lane, unattended, 2026-11-01)
> **created:** 2026-11-01
> **three_pillars:** Engine N/A — one presentation helper under `src/engine/views/`; no tick, graph, rule or trace change · Content done — no new sentences; one heading-icon table and one duplicate glyph table folded (Law 58) · UI done

# Art-led pass, slice 7 — lists and notices (THR-2103)

*Slices 1–6 dressed the Inspector, the chrome, the Stage, the dialogs and the ceremonies. This slice dresses the lists and notices: the Chronicle, Notables, Rivals, Threads, Read the Threads, the Mandate, the doom, omens, toasts, Find and the hover card.*

## Why this is load-bearing

Christian, chat 2026-10-31: *"this type of treatment should be done to all the UI layers"*, after approving the person-page [mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM). Rules R1–R8 and their primitives are settled in the programme doc, [§ The dressing rules](2026-10-31-art-led-ui-pass.md#the-dressing-rules). Slice 1 ([THR-2097](https://linear.app/threadbare/issue/THR-2097)) built the primitives and is Done. This plan states which rules apply to each list.

Measured on `main` at d3516032:

- **No list row draws a face or a place picture.**
  - A Chronicle entry is a gold border, a heading and prose (`ChronicleEntryCard.tsx:28-62`). Its linked names live in `segments[].ref` (`types/narrative.ts:162-168`).
  - A Notables row is `ListRow` with the name only (`NotablesPanel.tsx:213-224`), and each row already holds `notableRef` (`:56-59`).
  - A Threads agent row draws `ThreadPortrait`, an initials medallion (`ThreadsPanel.tsx:241-286`, used `:552`). Location, faction, army and artifact rows draw no picture.
  - Read the Threads rows are text only, and the file imports no `Icon` (`ReadTheThreadsPanel.tsx:19-35`, `:147-216`).
  - A toast draws the kind icon of its target at its trailing edge (`ToastStack.tsx:195`).
  - A Find row draws the kind icon (`find/FindBox.tsx:250`).
  - The hover card draws kind, name and subtitle as words (`shared/HoverCard.tsx:96-116`).
- **Every one of those rows already knows its subject.** A Ledger row has `mortalId` (`ledgerRail.ts:77-84`). A thread has `node.id` and `node.category` (`ThreadsPanel.tsx:529`). A digest row has `agentId` (`types/attention.ts:31`). A toast has a `NavigationTarget` with per-kind ids (`types/notification.ts:14-23`). A Find row has `ref` (`find.ts:85-90`). The hover card's state holds `ref` (`useRefRouter.ts:62-66`).
- **Four surfaces have no entity subject.** The Mandate, the doom and omens are about the world, and rivals are not graph nodes (`RivalPanel.tsx:41-42`). Rivals lead with their sphere sigil already (`RivalPanel.tsx:84-89`). An omen leads with its carved mark (`OmenMark.tsx:19-41`). The Mandate detail draws `mandate` (`MandateDetail.tsx:288`).
- **The fallback glyphs are on Christian's pick list.** Rivals fall back to `⚔ ◇ ▪ ⬆ ●` by temper (`uiColorPalette.ts:143-148`). The doom draws `◈ ⬡ ∿ ⚡ ◇ ✦ ⚔` by kind (`doom-archetype-presentation.ts:38-46`). Both classes, rival tempers and doom kinds, wait on [THR-1908](https://linear.app/threadbare/issue/THR-1908). `DoomClockDetail.tsx:17-25` keeps a second copy of the doom table.
- **No heading in these surfaces draws a shape.** Examples: "Rival gods" (`RivalPanel.tsx:59`), "Rulers" and "Local" (`NotablesPanel.tsx:161-162`), the Threads sections (`ThreadsPanel.tsx:70-78`), "World Omens" (`OmenDetail.tsx:105`) and the Find groups (`FindBox.tsx:231`). `SectionHeading` has no icon prop (`shared/SectionHeading.tsx:1-9`).
- **Registry ideas that fit:** `chronicle`, `notables`, `rivals`, `threads`, `read-the-threads`, `omen`, `person`, `place`, `faction`, `army`, `artifact`, `hex`, `cards`, `codex`, `disclosure` (grep of `iconRegistry.ts` `meaning:` lines). There is no idea for *ruler*, *power*, *recent*, *source* or *missed opportunity*.
- **The knowledge gate's read:** `getKnowledgeLevel(getFamiliarity(state.familiarityMap, id))` (`familiarity.ts:16,38`), as the Stage builder uses it (`buildUnifiedEncounterStageModel.ts:404`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Entity visuals (`resolveEntityVisual`, `EntityVisual descriptor`, knowledge gate) | 🟢 ACTIVE | reuses: one helper, new read sites |
| Carved icon registry (`iconShape`, `ICON_FOR_WORLD_REF_KIND`, `ICON_FOR_OMEN`) | 🟢 ACTIVE | reads existing ideas only; no new shape |
| Shared primitives (`ListRow.Leading`, `SectionHeading`, `OmenMark`) | 🟢 ACTIVE | extends: `SectionHeading` gains `icon` |
| Find view model (`buildFindIndex`, `findIndexStamp`) | 🟢 ACTIVE | extends: optional `visual` on world rows |
| Chronicle view model (`buildLedgerRail`) | 🟢 ACTIVE | extends: optional `visual` on Ledger rows and entries |

## Decided by the design lane (delegation, process.md rule 4 — veto in chat)

1. **A row that names a person, place, faction, army or relic leads with its picture at chip size (40px).** People get a circle. Lists are scanned, not studied, so a chip reads without pushing rows apart. Applies to the Chronicle (entries and Ledger rows), Notables, Threads, Read the Threads, toasts and Find.
2. **A Chronicle entry leads with one picture:** the first linked name in its lines that has one. Names in the witness lines stay links, and their hover card shows the face (decision 5). A picture per name would bury the prose.
3. **Threads' initials medallion goes.** An unpainted or unknown mortal gets the game's designed tile or silhouette, as on every other surface (Laws 3, 4, 8).
4. **A toast keeps its trailing "go there" icon** and gains the subject's picture at its leading edge. The trailing icon is the click affordance, not the subject.
5. **The hover card shows its subject's picture beside the name**, at chip size, because the card is a glance.
6. **Rivals, the doom, the Mandate and omens keep their lead marks.** Each has no entity subject, and each already leads with a carved or sphere mark. Their text-glyph fallbacks stay until Christian picks rival-temper and doom-kind shapes ([THR-1908](https://linear.app/threadbare/issue/THR-1908)). Omen history rows gain the same mark as the current omen.
7. **Headings draw a shape only where an existing idea names them** (table in § Content pillar). "Rulers", "Local", "Before you woke", "Powers", "Recent", "Sources", "Missed opportunities", "Dormant court", the Mandate's sub-headings, the doom's sub-headings and the Read the Threads reach headings draw none. They join [Christian's icon pick](https://linear.app/threadbare/issue/THR-2104). On a surface whose title already carries an idea, a sub-heading does not repeat that idea ("Recent omens" under "World Omens").
8. **The doom's second glyph table goes.** `DoomClockDetail` reads `DOOM_ARCHETYPE_GLYPHS`, so one list holds the doom marks (Law 58). The glyphs themselves do not change.

These decisions draw only on the programme doc and the UI Laws. None builds on an earlier slice's lane decision.

## Per-surface dressing

R1 subject art · R2 icons · R3 art tiles · R4 bond strip · R5 highlight · R6 sentences · R7 chips/bars · R8 quiet slot.

| Surface | Applies | N/A, with reason |
|---|---|---|
| Chronicle | R1 entry and Ledger-row chips (decisions 1, 2). R2 `chronicle` on the label | R2 "Before you woke" (decision 7). R3: entries own nothing. R5: the panel has no single emphasis. R8: the empty lines are already one quiet line |
| Notables | R1 notable's face. R2 `notables` on the popover title | R2 groups (decision 7). R4: a notable's tie to its target is the agenda sentence |
| Rivals | R2 `rivals` on "Rival gods" | R1 met by the sphere sigil (decision 6) |
| Threads | R1 every row with a visual (decision 3). R2 `threads` title, section icons, `disclosure` chevron | R2 "Sources" (decision 7). R7: callings and activities are already carved icons |
| Read the Threads | R1 agent rows' faces. R2 `read-the-threads` header, `place` on "Watched locations" | R2 other headings (decision 7). R6: the digest lines are already sentences |
| Mandate | — | R1: no art for a Mandate. R2: the detail already draws `mandate`, and its sub-headings have no idea (decision 7) |
| Doom | Decision 8 only | R1/R2: doom kinds wait on THR-1908 (decision 6) |
| Omens | R2 `omen` on "World Omens". Omen marks on history rows | R1 met by `OmenMark` |
| Toasts | R1 leading subject chip (decision 4) | R2: no headings |
| Find | R1 chip picture for world rows. R2 group icons | R2 "Powers", "Recent" (decision 7). Card and Codex rows keep their icon |
| Hover card | R1 chip beside the name (decision 5) | R2: its one section keeps the Inspector's own section label |

Law 36 and Law 57 hold: no list gains a cap, a fold or a scroll it does not have today.

## UI pillar

### S7.1 One helper for row pictures (R1)

- A new pure module `src/engine/views/rowVisual.ts`:
  - `rowVisual(ctx: { graph: WorldGraph; familiarityMap: FamiliarityMap; tiles?: readonly HexTile[] }, ref: { kind: WorldRefKind; id: string }): EntityVisualDescriptor | null`.
  - It maps the ref kind to an `EntityVisualKind`: `agent → agent`, `companion → companion`, `location → location`, `sublocation → sublocation`, `faction → faction`, `army → army`, `artifact`/`attachment → artifact`. Every other kind returns `null`, and the row keeps its kind icon.
  - People pass `knowledgeLevel: getKnowledgeLevel(getFamiliarity(ctx.familiarityMap, ref.id))`, so the silhouette gate holds (Law 8). Places pass `terrain` from `ctx.tiles` when given. Without tiles the resolver draws the place's glyph tile, a designed state (Law 4).
- **One path (Law 3).** Slice 6 plans `echoVisual` in `ceremonyVisuals.ts`. Whichever of the two lands second makes `echoVisual` call `rowVisual` for its node, so the knowledge and terrain reads live in one function.
- Callers resolve, and components draw `EntityVisual descriptor={…}`. Components never get `graph` (the slice 6 pattern):
  - `buildLedgerRail` sets `visual` on Ledger rows (from `mortalId`) and on each entry (the first `segments[].ref` that resolves).
  - `NotablesPanel`'s in-file row builder sets `visual` from `notableRef`. It already reads `gameState` (`:66-138`). Moving the builder out is not this slice.
  - `LedgerRail` passes `threadVisuals: Record<nodeId, descriptor | null>` to `ThreadsPanel`.
  - `DialogHost` passes `digestVisuals: Record<agentId, descriptor | null>` to `ReadTheThreadsPanel`.
  - `GameView` builds `toastVisuals: Record<toastId, descriptor | null>` (memoised on the toast list) and `hoverVisual` from `refRouter.hoverCard.ref`.
  - `buildFindIndex` sets `visual` on world-ref rows. The index already rebuilds when `familiarityMap` changes (`findIndexStamp`, `find.ts:155`), so a face unlocks as the gate opens.

### S7.2 The rows (R1)

- Each dressed row draws `EntityVisual size="chip"` in `ListRow.Leading` (or the row's first slot), with `shape="circle"` for person kinds. Alt = the subject's name. No descriptor → the row draws as today.
- Threads: `EntityVisual` replaces `ThreadPortrait` for agents, and the component is deleted. It has no test id today; the new node takes `data-testid="thread-visual"`. Hex and source rows keep their current look.
- Find: a world row's picture replaces its kind icon. `title` and the accessible name keep `row.kindLabel` ("Ilsa Venn, person"). Card and Codex rows keep `iconFor(row)`.
- Toasts: the picture sits before the message. The trailing kind icon stays (decision 4).
- Hover card: the picture sits left of the kind label, name and subtitle block.
- Omen history: each row draws `<OmenMark category=… size="chip" />` before its name, from the template it already looks up.

### S7.3 The headings (R2)

- `SectionHeading` gains `icon?: IconName` and draws `<Icon size="chip" decorative />` before its text in the heading's colour, as `SectionLabel` does. It lands with its styleguide entry (Laws 27, 29).
- Every heading in this slice reads its shape from `LIST_HEADING_ICONS` (§ Content pillar). No component names a shape literally (Law 58). A `null` row draws nothing.
- Threads' chevron `'▼' : '▶'` (`ThreadsPanel.tsx:1228`) becomes `<Icon name="disclosure" size="floor" decorative />`, rotated as the Chronicle's Years toggle is (`ChroniclePanel.tsx:312`).

### Player-facing display

At 1920×1080, the Chronicle's entries and chapter rows each open on a small face or place picture. Notables, Threads and Read the Threads show each mortal's face beside their name, and Threads show every place, faction, army and relic picture too. A toast about a mortal shows their face. Find shows faces and place pictures for people and places. The hover card shows its subject's picture. Headings carry their shape where one exists. Rivals, the doom, the Mandate and omens look as they do today, except that past omens now carry their mark.

### Player-facing text

No new sentence, and no word changes. The pictures sit beside words the player already reads.

| Surface | Exact text the player reads | Picture / hover | Complaint class | How the player understands it |
|---|---|---|---|---|
| Notables row | "Ilsa Venn" and her agenda line, as today (`NotablesPanel.tsx:216`; name illustrative) | her face, or the silhouette below `recognised` | PC-6 | The same face as her page |
| Threads row | "Ilsa Venn" · the calling icon · "holds the Mill at Harrow and more" (the doing line's held-place form, `ThreadsPanel.tsx:473-480`; names illustrative; a working mortal shows `activeProject.doingLine` instead) | face replaces initials | PC-6 | As above |
| Chronicle entry | "{n} days ago · {title}", as today (`ChronicleEntryCard.tsx:46`) | first linked name's picture, alt = that name | PC-6 | The picture belongs to the first name the entry links |
| Find row | "Ilsa Venn" · her fact line, as today | face; accessible name "Ilsa Venn, person" | none | Unchanged words |
| Toast | "The Iron Compact and the Ash Wardens meet in battle at Harrow." (`armyNotifications.ts:458`; names illustrative) | the picture of the toast's navigation target (here the attacker's arms) | PC-6 | The picture is the one the click opens |
| Hover card | "ACTOR" / "Captain Veiren" / "Gatekeeper of the Iron Market · sworn to Order" (the styleguide sample, `StyleGuide.tsx:296-298`) | the subject's face, or the silhouette | none | Unchanged words |
| "Rival gods", "World Omens", "Threads", "Read the Threads", "Chronicle" | as today | the heading's shape | none | Unchanged words |

### Event notifications

None. Toasts are dressed, not added.

### Debug inspection

- Each dressed row carries `data-row-subject="<EntityVisualKind>"` when its ref names a person, place, faction, army or relic, and `data-row-art="art|fallback|none"`. Each dressed heading carries `data-heading-icon="<name>"`.
- `window.__DEBUG.getListDressing(): Promise<{ surface: string; subjectRows: number; subjectRowsBare: number; headingIcons: string[] }[]>` reads every open slice-7 surface's DOM (by its existing test id). `subjectRowsBare` counts rows with `data-row-subject` and `data-row-art="none"`. It returns `[]` when none is open. Declared in `debug-bridge.d.ts`.
- `window.__DEBUG.pushToastFixture(target: NavigationTarget, message?: string): Promise<void>` pushes one toast, following `pushNeedsYouFixture` (`debug-bridge.d.ts:2974`). No toast lever exists today.

### Visual presence (HexMapV2)

N/A. The map is out of scope.

### UI Laws engaged

3, 4, 5, 8, 17, 21, 27, 29, 33, 36, 57, 58.

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Playtest signal

A tester scanning Notables or Threads can find a mortal they have met by face before reading names.

## Interface impact

Read sites only; no new cross-system write.

| Contract | Change |
|---|---|
| List surfaces ← entity visuals + familiarity (knowledge gate) | **add read**: `rowVisual.ts`, called from `ledgerRail.ts`, `find.ts`, `NotablesPanel.tsx`, `LedgerRail.tsx`, `DialogHost.tsx`, `GameView.tsx` |
| `LedgerRailVM`, `FindIndexVM` rows | **extend**: optional `visual` |
| `ThreadsPanel`, `ReadTheThreadsPanel`, `ToastStack`, `HoverCard` props | **extend**: optional descriptor props |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. `rowVisual.ts` is a render-time presentation helper under `src/engine/views/`, behind the THR-1822 seam, and reads only nodes the rows already name.

## Content pillar

Encounter templates, prose tables and attachment content: N/A. No sentence is added or changed.

The heading shapes live in one table, `LIST_HEADING_ICONS: Readonly<Record<ListHeadingId, IconName | null>>` in `src/data/view-content.ts`, beside `INSPECTOR_TAB_ICONS` (Law 58):

| Id | Shape | | Id | Shape |
|---|---|---|---|---|
| `chronicle` | `chronicle` | | `threadsTitle` | `threads` |
| `beforeYouWoke` | `null` | | `threadsAgents` | `person` |
| `notablesTitle` | `notables` | | `threadsLocations` | `place` |
| `notablesRulers`, `notablesLocal` | `null` | | `threadsFactions` | `faction` |
| `rivalGods` | `rivals` | | `threadsArmies` | `army` |
| `worldOmens` | `omen` | | `threadsArtifacts` | `artifact` |
| `recentOmens` | `null` | | `threadsHexes` | `hex` |
| `readTheThreads` | `read-the-threads` | | `threadsSources` | `null` |
| `digestWatchedLocations` | `place` | | `findPlaces`, `findPeople`, `findYours` | `place`, `person`, `person` |
| `digestOther` (notable, missed, dormant, reach groups) | `null` | | `findThings`, `findCards`, `findCodex` | `artifact`, `cards`, `codex` |
| `mandateSubheadings`, `doomSubheadings` | `null` | | `findPowers`, `findRecent` | `null` |

A test asserts that every `null` row is one named in decision 7. The doom fold (decision 8) deletes `DoomClockDetail.tsx:17-25` and imports `DOOM_ARCHETYPE_GLYPHS`.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace | Debug visibility |
|---|---|---|---|---|---|
| `rowVisual.ts` | none (render-time) | all dressed rows | none (reads `familiarityMap`) | none | `getListDressing()` |
| `ledgerRail.ts`, `find.ts` (`visual`) | none | ChroniclePanel, FindBox | none | none | `data-row-art` |
| hosts (`LedgerRail`, `DialogHost`, `GameView`) | none | Threads, digest, toasts, hover card | none | none | `data-row-art` |
| `view-content.ts` (`LIST_HEADING_ICONS`) | none | all headings above | none | none | `headingIcons` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| Row picture size | `EntityVisual size="chip"` (40px, Law 5) | Every dressed row; no new size |
| `LIST_HEADING_ICONS` | table in § Content pillar | Which shape each heading draws |
| `ThreadPortrait`'s `size = 52` (`ThreadsPanel.tsx:241`) | retired | Threads rows use the chip size like every other list |

## Tracing

N/A — nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Ref's node gone from the graph | The resolver's designed tile with the row's own name (Law 4); never a throw |
| Ref kind with no visual (hex, area, journey, receipt, card, codex) | `null`; the row keeps its kind icon or draws as today |
| Mortal below `recognised` | Silhouette (Law 8) |
| No tiles passed for a place | The place's glyph tile |
| Chronicle entry with no resolvable ref | No picture; the card draws as today |
| Icon name missing from the registry | Fallback mark, warns once (existing `iconShape`) |

## Kill criteria

- **A rail list scrolls at 1920×1080 where it did not before**, because 40px pictures made rows taller. First align the picture to the row's first line, so it overlaps the second line instead of adding height. If a list still scrolls earlier, stop: dropping pictures from any row would break this ticket's first Done-when line. The executor parks the PR and raises it with Christian in chat, with before-and-after screenshots, and the Done-when changes only if he agrees.
- **Christian calls the lists "busy"**: keep the pictures, and set every `LIST_HEADING_ICONS` row to `null`.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. The north star "the mortal has to feel like a person" is served by faces in every list that names a mortal. Non-negotiable #3 (mechanics through prose) holds: no word changes, and no number is added.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-01-thr-2103-art-led-lists-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | One size, one icon table |
| 2. Inspectability | PASS | `getListDressing()` and `data-*` attributes |
| 3. Determinism | PASS | No randomness; fallback tiles are id-hashed |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanical perfection | PASS | Pictures beside the words; no sentence replaced |
| 6. Additive over destructive | PASS | Optional props. `ThreadPortrait` and the second doom table are removed on purpose (Laws 3, 58) |
| 7. Performance budget | PASS | Resolver calls are graph map lookups. Find resolves once per index rebuild (`findIndexStamp`). The Chronicle resolves at most one ref per entry, and only when `ledgerRailSelector` rebuilds: it is keyed on the chronicle, chapter and action counts under `invalidation: 'world'` (`ledgerRail.ts:187-190`). The hosts memoise on their list. The executor measures `buildLedgerRail` on the seeded world at 300 ticks before and after; a rise above 1 ms moves the entry visual behind a memo on entry id |

## Done when

- [ ] On `?view=game&seeded&size=medium` after `window.__DEBUG.tick(30)`, with the Chronicle, Notables and Threads each opened by their launcher, `await window.__DEBUG.getListDressing()` reports `subjectRowsBare === 0` for each, and `headingIcons` includes `chronicle`, `notables` and `threads`.
- [ ] After `await window.__DEBUG.pushToastFixture({ kind: 'agent', agentId: <The First's id> })`, the toast row reports `data-row-art` of `art` or `fallback`.
- [ ] Find (Ctrl+K) with the query "a" reports `subjectRowsBare === 0` and its group icons. A Card row still draws `cards`.
- [ ] Hovering a linked name opens a hover card whose picture reports `art` or `fallback`.
- [ ] Render tests: an unknown mortal draws the silhouette in Notables and Threads; a Threads hex row draws as before; the World Omens history rows draw `OmenMark`; `DoomClockDetail` imports `DOOM_ARCHETYPE_GLYPHS` and declares no glyph table; every `null` in `LIST_HEADING_ICONS` is one decision 7 names.
- [ ] At 1920×1080 and 2560×1440, the Chronicle, Notables and Threads lists on the seeded world scroll no earlier than on `main` (Law 57), checked against a baseline screenshot.
- [ ] Rivals, the Mandate tracker and detail, and the doom bar and detail render as before (existing tests green).
- [ ] Four-part browser evidence: 1920×1080 screenshots of the Chronicle, Notables, Threads, Find, a toast and a hover card, one 2560×1440 of Threads, console output, a `getListDressing()` assertion, and a UI-Laws judgment line.
- [ ] `npm run gate` green; `SectionHeading`'s `icon` in the styleguide. After merge, one comment on THR-2104 lists the headings with no idea (decision 7).
- [ ] Closing commit body includes `Fixes THR-2103` on its own line.

## Coordination block

**Suggested model:** opus. It is a new module under `src/engine/views/` and touches six hosts, so it passes the `review-gate` skill before auto-merge (THR-1691, THR-1949).

**Parallel-safe with:** THR-2098 and THR-2099 (Inspector pages and rail; disjoint files), THR-1908 and THR-2104 (icon picks).

**Mutex with:**
- THR-2100, THR-2101 and THR-2102: all four add to `src/debug-bridge.d.ts`, `src/debug-bridge.ts` and `src/data/view-content.ts`, and THR-2102 adds `ceremonyVisuals.ts` (S7.1's one-path rule). Build after they merge.
- Any open ticket editing `ThreadsPanel.tsx`, `ChroniclePanel.tsx`, `NotablesPanel.tsx`, `ToastStack.tsx`, `find/FindBox.tsx`, `engine/views/find.ts`, `engine/views/ledgerRail.ts` or `GameView.tsx`'s toast and hover-card mounts.

**Files to touch:**
- Create: `src/engine/views/rowVisual.ts`, plus its test.
- Edit: `src/components/Game/{ChroniclePanel,ChronicleEntryCard,NotablesPanel,RivalPanel,ThreadsPanel,ReadTheThreadsPanel,OmenDetail,DoomClockDetail,ToastStack,GameView}.tsx`, `src/components/Game/find/FindBox.tsx`, `src/components/Game/frame/LedgerRail.tsx`, `src/components/Game/hosts/DialogHost.tsx`, `src/components/shared/{HoverCard,SectionHeading}.tsx`, `src/engine/views/{find,ledgerRail}.ts`, `src/data/view-content.ts`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, the styleguide.

## Notes for the executor

- Do not draw carved shapes for rival tempers or doom kinds (THR-1908). Do not invent shapes for the headings in decision 7.
- Do not add a picture per witness-line name in the Chronicle (decision 2).
- Do not move `NotablesPanel`'s row builder into `src/engine/views/` in this slice.
- Tests likely to need updating: `ThreadsPanel` tests that query the initials portrait, `FindBox` tests that query the row icon's label, `ToastStack` and `HoverCard` render tests, `styleguideSync.test.ts`.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-11-01. Notes needing no change: each is listed with why.*

### NFP audit

PASS-with-notes:
- 1 Tunability, 2 Inspectability, 3 Determinism, 4 Fail-soft, 5 Narrative: PASS.
- 6 Additive: note. `ThreadPortrait`, the second doom table and Find's kind icon on world rows are removed on purpose (Laws 3, 58), and the tests to update are named.
- 7 Performance: note. "Never per tick" was not measured for the Chronicle. Fixed: the row now cites `ledgerRailSelector`'s key (`ledgerRail.ts:187-190`) and gives the executor a 1 ms measurement with a memo fallback.

### Three-pillar audit

PASS-with-notes:
- Engine: N/A-with-rationale. Content: present-and-substantive. UI: present-and-substantive.
- No required section is missing. The Wiring table connects every module. Substrate check: N/A, but the inventory is present, with no rebuild.
- Notes: the new module sits under `src/engine/views/`, so the review gate is named in the coordination block. The Content subsections are folded into one N/A line, because no sentence changes.

### Vision audit

PASS-with-notes. No contradictions:
- North star ("a person, not a unit"): confirmed. The core loop's low-effort scan: extended. Non-negotiables #2 and #3: confirmed.
- Note: under the taste profile's "no decorative flourishes", heading shapes press a little. They are limited to existing ideas (decision 7) and guarded by the "busy" kill criterion.

### Intent-judge verdict

2026-11-01, first pass: **Revise** (Reversible). Two GAPs, both fixed:
- dim 12: three player-text rows said "as today" with no rendered sample. They now quote real strings with their sources.
- dim 10: the scroll kill criterion's fallback would have broken the Done-when. It now stops and raises the question with Christian.

Re-judge: **Allow** (Reversible, no GAPs).
