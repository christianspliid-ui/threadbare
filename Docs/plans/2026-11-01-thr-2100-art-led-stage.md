> **title:** Art-led pass, slice 4 — the Stage moments (THR-2100)
> **linear_issue:** THR-2100
> **author:** Claude Code (design lane, unattended, 2026-11-01)
> **created:** 2026-11-01
> **three_pillars:** Engine N/A — the Stage view model under `src/engine/views/stage/` gains presentation fields only; no tick, graph, rule or trace change · Content N/A — no new words; every label shown today stays · UI done

# Art-led pass, slice 4 — the Stage moments (THR-2100)

*Slices 1–3 dressed the Inspector and the chrome. This slice dresses the six moments that play on the Stage: the encounter, the premonition, the journey vision, the story beat, the new-power dilemma and the undertaking moment.*

## Why this is load-bearing

Christian, chat 2026-10-31: *"this type of treatment should be done to all the UI layers"*, after approving the person-page [mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM). Rules R1–R8 and their primitives are settled in the programme doc, [§ The dressing rules](2026-10-31-art-led-ui-pass.md#the-dressing-rules). Slice 1 ([PR #2663](https://github.com/christianspliid-ui/threadbare/pull/2663)) built the primitives. This plan states which rules apply to each Stage moment.

Measured on `main` at bbf33fcc:

- **All six moments draw through one frame.** `Stage` (`src/components/Game/stage/Stage.tsx`) takes a `StageVM` built by `buildStageView` (`src/engine/views/stage/stageView.ts:233-255`). The VM carries the subject as a name only (`subject: RefRow | null`, `stageView.ts:93`).
- **Three moments show no face at all.** `StoryBeatModal.tsx`, `JourneyVignetteModal.tsx` and `EmergenceDilemmaModal.tsx` import no `EntityVisual` (grep of each file's imports). Their only mention of the mortal is the context line ("Maren Ashfold at Millbrook", `StageContextLine`, `StoryBeatModal.tsx:173-184`).
- **Three show a face too small to read.** The encounter's subject is a 28×28 chip (`EncounterVeil.tsx:3457-3466`). The undertaking moment's is a 40px `chip` (`MomentCard.tsx:182-191`). The premonition's is an 84px portrait (`PremonitionModal.tsx:101`, sized for the 520px modal it left in THR-1897).
- **No Stage label draws a carved icon.** The Veil imports neither `Icon` nor `SectionLabel`; its marks are text glyphs (⊘, ✦, ◆; `EncounterVeil.tsx:2557, 3804, 2692`).
- **The consequence icons exist and are unused.** `ICON_FOR_CONSEQUENCE` maps scar/bond/boon/path to their carved shapes (`conceptIcons.ts:248-253`), and no file outside `conceptIcons.ts` reads it (grep). The Veil draws `CONSEQUENCE_CATEGORY_GLYPHS` (✕ ◈ ✦ ◆, `buildAftermathConsequences.ts:140-145`) instead.
- **A relic gained or lost in an encounter shows no picture.** The chip tile resolver returns nothing for an attachment (`chipCollaborators.ts:43`), so the chip falls back to a glyph. `getAttachmentArtUrl` (`artifact-category-art.ts:116`) is not called on the Stage.
- **Registry ideas that fit:** `encounter`, `journey`, `dilemma`, `undertaking`, `compel` ("Compel: bend a will"), `claim`, `bargain`, `spell`, `essence`, `scar`, `bond`, `boon`, `path`. There is no idea for *at stake*, a whisper, *let it be* or *corrupt* (grep of `iconRegistry.ts` `meaning:` lines).
- **Levers:** `window.__DEBUG.openHomedSurface(kind)` opens each of the six moments, and `getStage()` reads the open one (`src/debug-bridge.d.ts:2508-2523`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Stage frame and `stageViewSelector` | 🟢 ACTIVE | extends: one optional VM field |
| Entity visuals (`resolveEntityVisual`, knowledge gate) | 🟢 ACTIVE | reuses: one new read site, the cast's gate pattern (`buildUnifiedEncounterStageModel.ts:399-407`) |
| Aftermath chips (`buildAftermathConsequences`, `chipCollaborators`) | 🟢 ACTIVE | extends: attachment tile, carved category icons |
| Carved icon registry, `ICON_FOR_CONSEQUENCE`, `ReachIcon` | 🟢 ACTIVE | reads existing ideas only; no new shape |

## Decided by the design lane (delegation, process.md rule 4 — veto in chat)

1. **Every Stage moment shows its mortal's face at one size**, a 3:4 portrait at `--stage-subject-portrait-w`. One face path: `StageVM.subjectVisual`, built once in `buildStageView` through `resolveEntityVisual` with the subject's knowledge level.
2. **On the encounter, the face sits in the left column**, under the scene picture when the step has one and at the top when it does not. The 28px chip beside the name goes, so the panel shows one face. The visual pair stays portrait and scene picture (Christian, 2026-07-05).
3. **The new-power dilemma shows the face of the mortal who delved**, not a picture of the ruin. The ruin is already lit on the map beside the panel.
4. **Consequence chips draw their carved shape** (scar, bond, boon, path) where they draw a text glyph today. A chip that names a mortal or a reach keeps the face or reach mark it draws today.
5. **A relic gained or lost in an encounter shows its painting** on its chip, as the person page's "What they carry" tiles do.
6. **Labels with no fitting idea draw none** and join Christian's icon pick ([THR-2104](https://linear.app/threadbare/issue/THR-2104)): *At stake*, the whisper header, *Let it be* and *Corrupt*. This is the programme doc's own rule (S1.2: "Rows with no fitting idea draw no icon … never given an invented shape"). *Claim* keeps `claim` ("Holding a place under claim"): the card's own words are "Plant your own banner in the stone. The Place will answer to you."

## Per-surface dressing

R1 subject art · R2 icons · R3 relic tiles · R4 bond strip · R5 highlight · R6 sentences · R7 chips/bars · R8 quiet slot. R4–R8 are N/A on every Stage moment: the Stage is a scene, not a sheet; its sentences are already prose, and Law 37 keeps one chrome per flow.

| Surface | Applies | N/A, with reason |
|---|---|---|
| Encounter (Veil) | R1 left-column face (decisions 1–2). R2: title `encounter`; cast eyebrow `spell` for ✦; essence marks `essence` for ◆; header and replay reach words gain `ReachIcon`; consequence tiles and legend `ICON_FOR_CONSEQUENCE` (decision 4). R3 attachment chips (decision 5) | R2 *At stake*, *Aftermath*, *Watched*, the complication ⊘: no idea (decision 6). Scene art is unchanged |
| Premonition | R1 face grows to the token. R2: "The God's will" gains `compel` | R2 "A stirring in the thread": no idea. R3: the dream names no relic |
| Journey vision | R1 face (new). R2: the title gains `journey` | R2 phase badge: the phase word has no idea. R3: `JourneyVignetteData` carries no relic |
| Story beat | R1 face (new). R2: the "Story beat" eyebrow gains `encounter` (a beat is an encounter the world plays out); the reach badge gains `ReachIcon` | R3: no relic named |
| New-power dilemma | R1 face of the delver (decision 3). R2: the header gains `dilemma`; *Claim* gains `claim`, *Bargain* gains `bargain` | R2 *Let it be*, *Corrupt*: no idea |
| Undertaking moment | R1 face grows from chip to the token. R2: the title eyebrow gains `undertaking` | R3: its chips name people, already drawn as faces. Chip tiles keep their tone glyph: they are not headings |

Laws 37, 38 and 56 hold: no beat is added or moved, the encounter's flow order is unchanged, and every chip stays backed by state.

## UI pillar

### S4.1 One face on the Stage (R1)

- `StageVM` gains `subjectVisual: EntityVisualDescriptor | null`. `buildStageView` sets it from `resolveEntityVisual({ id, kind: 'agent', name }, ctx.graph, { knowledgeLevel: getKnowledgeLevel(getFamiliarity(ctx.state.familiarityMap, id)) })`. `fallbackStageView` sets `null`. `GameView.tsx`'s six `readView` calls are unchanged: they already pass `subjectAgentId` (`GameView.tsx:3483-3544`).
- Staleness: `stageViewSelector` is `invalidation: 'world'` and its key omits familiarity. All six moments stop time while open (`stopsTime: true`, `homed-surfaces.ts:69-79`), so familiarity cannot move under an open moment. A test covers a familiarity rise between two openings re-resolving the face from silhouette to art; if it fails, add the subject's knowledge level to the selector key.
- New `StageSubjectPortrait` (`src/components/Game/stage/StageSubjectPortrait.tsx`) draws `EntityVisual size="portrait" shape="rounded"` at `--stage-subject-portrait-w`, 3:4, from the descriptor's `src` with no graph, so the knowledge gate is never re-opened. Clicking opens the mortal's page through the Stage's router (Inspector over the Stage, § D7). Styleguide entry and `component-selection.md` row (Law 29).
- Compact moments (story beat, journey vision, dilemma, undertaking moment) put it at the left of their title block. The moment card's chip portrait and the premonition's `SUBJECT_PORTRAIT_PX` are replaced by it.
- Encounter: the left column draws it under the scene picture, else first. `ContextStrip` draws its 28px chip only when the Stage has no left column, which today is never.

### S4.2 Icons on Stage labels (R2)

- Add `STAGE_LABEL_ICONS` to `src/data/stage-content.ts`: one row per label in the table above, value `IconName | null`. Components read the row, never a literal (Law 58). Export `STAGE_NO_IDEA_LABELS`, and test that every `null` row is in it.
- The icon draws at `chip` size before the label, decorative, in the label's colour. A label already gold stays the panel's one gold; no icon adds gold of its own (Law 31).
- The Veil's ✦ and ◆ glyphs become `<Icon name="spell" />` and `<Icon name="essence" />`. The essence shape is wrapped in the existing `ui.essence_panel` tooltip (Law 17), so it is not decorative. The ⊘ glyph stays.
- After merge, post `STAGE_NO_IDEA_LABELS` as one comment on [THR-2104](https://linear.app/threadbare/issue/THR-2104).

### S4.3 Consequence shapes and relic tiles (R2, R3)

- The Veil's chip tile and legend draw `<Icon name={ICON_FOR_CONSEQUENCE[category]} />` where they draw `CONSEQUENCE_CATEGORY_GLYPHS` today. The glyph table and the chip VM's `categoryGlyph` field (emitted at `buildAftermathConsequences.ts:826, 872`, typed in `stage/types.ts`) are retired together, deliberately; `ICON_FOR_CONSEQUENCE` keeps the type-total guard (Law 9).
- `buildChipIconResolver`, for `visualKind === 'attachment'`: read the node's `subcategory` and call `getAttachmentArtUrl(entityId, subcategory)`. Art found → `{ entityId, kind: 'artifact', name, src, routeKind: 'attachment' }`. None → `undefined`, as today. The tile's click routes by `routeKind`, so it opens the relic's page.

### Player-facing display

At 1920×1080 a compact moment opens on the mortal's face beside the title, then the prose, then the choices. The encounter's left column reads: scene picture (step one), the mortal's face, the cast, *At stake*. Aftermath chips open with their carved shape or the relic's painting.

### Player-facing text

No new words. Every label, line and tooltip id stays as it is today.

| Surface | Exact text the player reads | Picture / hover | Complaint class | How the player understands it |
|---|---|---|---|---|
| Encounter (Veil) | The uppercase encounter title (`model.header.title`) after the `encounter` shape; the cast eyebrow "Maren casts Ember Ward · it lands" (spell and caster illustrative; `EncounterVeil.tsx:3804`) after `spell` in place of ✦ | face alt = the subject's name; `encounter`, `spell` decorative; the spell name keeps its link | PC-6 | Same face as the cast and her page |
| Encounter essence | "12 essence" / "12 heart essence" (`essencePoolLabel`, `essence-format.ts:104`, number illustrative) and "1 — Peer Through the Thread" (`EncounterVeil.tsx:1929`), each after the `essence` shape in place of ◆ | the shape carries the existing `ui.essence_panel` tooltip: "Divine Essence — Your power reserve. Spent on Your cards. It flows in every day from your threads, your Seat, the places of power you hold and your aspects." | PC-1 | The word "essence" stays printed; hovering the shape now explains it, where the ◆ explained nothing |
| Story beat | "Story beat" / the template name / "Maren Ashfold at Millbrook" (name illustrative) | face alt = the mortal's name; `encounter` decorative | PC-6 | See below |
| Journey vision | "Maren Ashfold's Journey" or "The Ordeal" | face alt = name; `journey` decorative | PC-6 | Same face as her page |
| Dilemma | "Emergence dilemma · {fate word}"; cards "Claim", "Bargain" with their cost lines unchanged (e.g. "Costs a favor you will owe.") | `dilemma`, `claim`, `bargain` decorative | none | Same words, shapes before them |
| Premonition | "The God's will" | `compel` decorative | none | Same header |
| Undertaking moment | `model.title` and the undertaking's name, as today | `undertaking` decorative; face alt = name | PC-6 | See below |
| Aftermath chip | "BOON" / "SCAR" / "BOND" / "PATH" and the chip's sentence, as today | carved shape; the category word keeps its tooltip | PC-1 | The shape adds no meaning; the word and its tooltip still carry it |
| Relic chip | the chip's sentence as today | relic painting, alt = the relic's name; click opens its page | none | Same painting as on the person page |

**PC-6 (one fact told two ways).** Every Stage face comes from `resolveEntityVisual` with the same knowledge gate as the cast and the mortal's own page. A mortal below `recognised` draws the silhouette on the Stage and on their page alike (Law 8).

### Event notifications

None.

### Debug inspection

`DebugStageState` gains `dressing: { face: 'art' | 'fallback' | 'none'; labelIcons: string[]; consequenceIcons: string[]; relicTiles: number }`, read from the open Stage's DOM (`data-stage-face`, `data-stage-label-icon`). `await window.__DEBUG.getStage()` returns it.

### Visual presence (HexMapV2)

N/A. The map window is out of scope.

### UI Laws engaged

1, 3, 4, 5, 8, 9, 17, 21, 29, 33, 37, 38, 56, 58.

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Playtest signal

A tester can say whose moment is playing from the face, before reading the prose.

## Interface impact

Read sites only; no new cross-system write.

| Contract | Change |
|---|---|
| Stage VM ← entity visuals, familiarity | **add read**: `stageView.ts` (`subjectVisual`) |
| Aftermath chip tiles ← attachment art (`getAttachmentArtUrl`) | **add read**: `chipCollaborators.ts` |
| `StageVM`, chip icon descriptor, `DebugStageState` | **extend**: optional fields |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the two read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. The `src/engine/views/stage/` edits add presentation fields built from nodes those builders already read.

## Content pillar

N/A. No encounter, prose, attachment or data-table text changes, and no new label. Icon values are registry rows, not words.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace | Debug visibility |
|---|---|---|---|---|---|
| `stageView.ts` (`subjectVisual`) | none (render-time VM) | `StageSubjectPortrait` in all six | none | none | `getStage().dressing.face` |
| `stage-content.ts` (`STAGE_LABEL_ICONS`) | none | the six surfaces | none | none | `dressing.labelIcons` |
| `chipCollaborators.ts`, `EncounterVeil.tsx` chips | none | aftermath chips | none | none | `dressing.consequenceIcons`, `relicTiles` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `--stage-subject-portrait-w` | 8rem / 10rem / 10rem (1920 / 2560 / 3440) | The one Stage face width; mirrored in `layoutContract.ts` |
| `STAGE_LABEL_ICONS` | table in § Per-surface dressing | Which shape each Stage label draws |
| `STAGE_NO_IDEA_LABELS` | at stake, whisper header, let it be, corrupt | Labels waiting on the icon pick |

## Tracing

N/A — nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| No subject mortal (a beat with no actor) | No portrait; the title block takes the row |
| Mortal below `recognised` | Silhouette (Law 8) |
| Mortal has no portrait | The resolver's designed tile (Law 4) |
| Relic has no bespoke art | Category plate; else no tile, the reach mark or carved shape as today |
| Icon name not in the registry | Fallback mark, warns once (existing `iconShape`) |

## Kill criteria

- **At 1920×1080, *At stake* or the hand falls below the fold on step one of `?forceencounters`**: lower `--stage-subject-portrait-w` at the 1920 tier to 6rem; if still below, draw the face only on steps with no scene picture.
- **Christian calls the Stage "busy"**: keep the faces and the consequence shapes, drop the label icons (`STAGE_LABEL_ICONS` set to `null`).

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. North star "the mortal has to feel like a person" is served by a face on every moment. Non-negotiable #3 (mechanics through prose) holds: no prose is replaced.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-01-thr-2100-art-led-stage-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | One width token; icons are a data table |
| 2. Inspectability | PASS | `getStage().dressing` |
| 3. Determinism | PASS | No randomness; fallback tiles are id-hashed |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanical perfection | PASS | Faces put a person on every moment |
| 6. Additive over destructive | PASS | Optional fields; two literals and one glyph table replaced deliberately |
| 7. Performance budget | PASS | One resolver call per open moment, cached by the selector |

## Done when

- [ ] Each of the six moments opened with `await window.__DEBUG.openHomedSurface(kind)` (encounter via `?forceencounters`) shows its mortal's face at `--stage-subject-portrait-w`, and `getStage().dressing.face` is `'art'` or `'fallback'`.
- [ ] The encounter panel shows one face of its subject, not two.
- [ ] Every label in `STAGE_LABEL_ICONS` with a value draws its shape; `dressing.labelIcons` lists them.
- [ ] Aftermath chips draw carved category shapes, never ✕ ◈ ✦ ◆; a test covers a relic chip drawing its painting and opening the relic's page.
- [ ] A test covers a mortal below `recognised`: the Stage draws the silhouette.
- [ ] At 1920×1080 and 2560×1440 nothing on any Stage moment renders below the fold (Law 33).
- [ ] Four-part browser evidence: screenshots per moment at 1920×1080 plus one at 2560×1440, console output, a `getStage().dressing` assertion, a UI-Laws judgment line.
- [ ] `npm run gate` green; the THR-2104 comment posted after merge.
- [ ] Closing commit body includes `Fixes THR-2100` on its own line.

## Coordination block

**Suggested model:** opus. The Veil is 4,000 lines and the aftermath chip path is shared with the moment card's tone rules. The build PR edits `src/engine/views/stage/`, so it passes the `review-gate` skill before auto-merge (THR-1691, THR-1949).

**Parallel-safe with:** THR-2098, THR-2099 (Inspector and rail; disjoint files), THR-2104 and THR-1908 (icon picks; one registry line each).

**Mutex with:**
- Any open ticket editing `EncounterVeil.tsx`, `src/components/Game/stage/*`, `src/engine/views/stage/{stageView,chipCollaborators,buildAftermathConsequences}.ts` or the five other Stage surfaces: the same render path.
- THR-2101 (dialogs) and THR-2102 (ceremonies) once planned, if they touch `StoryBeatModal.tsx`'s dialog fallback.

**Files to touch:**
- Create: `src/components/Game/stage/StageSubjectPortrait.tsx` and its test.
- Edit: `src/engine/views/stage/{stageView,chipCollaborators,buildAftermathConsequences}.ts`, `src/data/stage-content.ts`, `src/components/Game/{EncounterVeil,PremonitionModal,JourneyVignetteModal,StoryBeatModal,MomentCard}.tsx`, `src/components/ruins/EmergenceDilemmaModal.tsx`, `src/components/Game/stage/useStageDebugBridge.ts`, `src/debug-bridge.d.ts`, `src/index.css`, `src/components/shared/layoutContract.ts`, the styleguide, `Docs/design-system/component-selection.md`.

## Notes for the executor

- One face path: the Stage face is `vm.subjectVisual`. Do not pass `graph` to `EntityVisual` in `StageSubjectPortrait`; that would re-resolve and skip the gate.
- Do not invent shapes for the labels in `STAGE_NO_IDEA_LABELS`.
- Tests likely to need updating: `src/components/Game/stage/__tests__/`, the Veil's chip glyph tests (`consequence-chip-glyph-*` test ids), premonition and moment-card portrait tests (`premonition-subject-portrait`, `moment-card-portrait`).

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-11-01. Notes resolved inline after the run: Additive (`categoryGlyph` retirement stated); Performance and Pillar (selector staleness: time is stopped while a moment is open, plus a re-resolve test); Pillar (review-gate note in the coordination block; `GameView.tsx` unchanged, stated); Vision (Law 31 gold line in S4.2).*

### NFP audit

PASS-with-notes:
- 1 Tunability, 4 Fail-soft, 5 Narrative: PASS. 3 Determinism: N/A.
- 2 Inspectability: note. `dressing` is read from the DOM, so it reports what was drawn, not why.
- 6 Additive: note. Retiring the glyph table also retires the chip VM's `categoryGlyph`. Now stated.
- 7 Performance: note. The selector key omits familiarity. Now answered in S4.1.

### Three-pillar audit

PASS-with-notes:
- Engine: N/A-with-rationale. Content: N/A-with-rationale. UI: present-and-substantive.
- No required section missing; Blast Radius correctly omitted.
- Notes: review gate owed for `src/engine/views/stage/`; face staleness after a familiarity rise; `GameView.tsx` not listed. All three now addressed.

### Vision audit

PASS-with-notes. No contradictions:
- North star: extended. Core loop: confirmed (no beat added or moved). Non-negotiable #3: confirmed.
- Tension #3 (divine remove vs attachment): extended toward attachment; distance unchanged.
- Taste profile: soft concern that about a dozen label icons add ornament beside the prose. The "busy" kill criterion and the no-idea rule cover it; the gold rule is now stated.

### Intent-judge verdict

2026-11-01. First pass: **Revise**, one GAP:
- Dim 12: player legibility. The Veil, the surface changed most, had no player-facing text row, and the ◆ essence mark touched PC-1.

Fixed: Encounter and Encounter-essence rows added; the essence shape carries the existing `ui.essence_panel` tooltip. The judge's S1.2 citation note was retracted on re-read.

Second pass: **Allow** (Reversible, zero GAPs).
