> **title:** Art-led pass, slice 3 — the god rail and the top bar (THR-2099)
> **linear_issue:** THR-2099
> **author:** Claude Code (design lane, unattended, 2026-11-01)
> **created:** 2026-11-01
> **three_pillars:** Engine N/A — presentation view models under `src/engine/views/` gain optional fields only; no tick, graph, rule or trace change · Content N/A — no new words; every label shown today stays · UI done

# Art-led pass, slice 3 — the god rail and the top bar (THR-2099)

*Slices 1 and 2 dressed the Inspector. This slice dresses the chrome that is always on screen: the god rail down the left and the top bar. It adds no new data to either (Law 53).*

## Why this is load-bearing

Christian, chat 2026-10-31: *"this type of treatment should be done to all the UI layers"*, after approving the person-page [mock](https://claude.ai/artifact/F7ShcxkK5VqvJErrDk9MNM). The rules R1–R8 and their primitives are settled in the programme doc, [§ The dressing rules](2026-10-31-art-led-ui-pass.md#the-dressing-rules). Slice 1 ([PR #2663](https://github.com/christianspliid-ui/threadbare/pull/2663)) built the primitives. This plan states which rules apply to each rail block and top-bar item.

Measured on `main` at 7d617d2a:

- **The rail already leads with the god's face.** `IdentityStrip` draws `identity.portraitSrc` in a 68px haloed frame (`IdentityStrip.tsx:10, 133-139`), falling back to the sphere sigil. R1 holds today.
- **No rail heading carries an icon.** `GodRailSectionDef` has no `icon` field (`frame-registry.ts:118-128`). `FoldedRow` draws the label word and a disclosure arrow only (`AscendantBar.tsx:101-118`). "Essence" (`godRailComponents.tsx:82`) and "Your cards" (`HandSection.tsx:227`) are plain words.
- **The top bar already carries icons** through `TopBarItemDef.icon` (`frame-registry.ts:186-195`). Doom and omen are `icon: null`: they render their own widgets (`DoomBar`, `OmenIndicator`).
- **Mortals in the rail are bare names.** "Your First: <link>" is an `EntityLink` (`godRailComponents.tsx:66-70`). A covenant's target is a plain string (`CovenantRowView.target`, `godSheet.ts:512-513`). A vow's counterparty is folded into the chip label (`HooksBlock.tsx:325-339`).
- **The face primitive exists.** The identity `Chip` draws an `EntityVisual` tile before the name when given `visual` (`Chip.tsx:57-70, 290-297`). The tile goes through `resolveEntityVisual`, so the knowledge gate holds (Law 8).
- **Registry ideas that fit:** `essence`, `cards`, `mandate`, `signature`, `hooks`, `attention`, `doom` all exist in `iconRegistry.ts`. There is no `reach` or `covenant` idea (grep of the registry's `meaning:` lines).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| God rail registry (`GOD_RAIL_SECTIONS`, `GOD_RAIL_COMPONENTS`) and `godRail` VM | 🟢 ACTIVE | extends: one optional registry field; optional VM fields |
| Top bar registry (`TOP_BAR_ITEMS`) and `NeedsYou` | 🟢 ACTIVE | extends: one icon value; an optional row field |
| Identity `Chip` with `visual`, `resolveEntityVisual` | 🟢 ACTIVE | reuses: new call sites only |
| Carved icon registry, `iconForSublocation`, `PLACE_ICON` | 🟢 ACTIVE | reads existing ideas only; no new shape |

## Decided by the design lane (delegation, process.md rule 4 — veto in chat)

1. **The god's face stays the size it is.** R1 is already met by the 68px haloed portrait. Making it larger would push the hand ("Your cards") down at 1920×1080, and the hand is what the rail is for.
2. **Every rail heading gets its icon from the rail's own registry row** (Law 58). Reaches and Covenants have no carved shape yet, so they draw none and join Christian's icon pick ([THR-2104](https://linear.app/threadbare/issue/THR-2104)). This is the programme doc's own rule (S1.2: "Rows with no fitting idea draw no icon").
3. **A named mortal in the rail is drawn as a face chip**: The First, a covenant held on a mortal, and a vow's counterparty when that counterparty is a mortal. Places, lands and factions keep their words. The ticket asks for faces on mortals only.
4. **The Seat line draws its town's own place shape** before the name, as slice 1 did for the person page's where-chips. Clicking it still centres the map (THR-1792); it does not become a page link.
5. **The doom bar draws the `doom` shape at its head.** The omen keeps its own omen mark, which is already the omen's picture (R1), so it gets no second icon.
6. **Needs-you rows that point at a mortal show that mortal's face** after the row's icon. The icon still says what kind of row it is. The face says who.

## Per-surface dressing

R1 header art · R2 icons · R3 tiles · R4 bond strip · R5 highlight · R6 sentences · R7 chips/bars · R8 quiet slot.

| Surface | Applies | N/A, with reason |
|---|---|---|
| Identity strip | R1 (already met; decision 1) | R2: no heading, the face is the heading. R4: the god's tie to The First is drawn on The First's page (slice 1); a strip here would add always-on data (Law 53) |
| Your First line | R6 face chip (decision 3) | — |
| Essence | R2 `essence` | R3, R7: the sphere rows already draw sphere icons and words |
| Seat line | R2 place shape (decision 4) | R6: one line already |
| Attention gauge | — | All: it is not a heading, it shows only while a *Lives on* mortal is in the court (`godRailComponents.tsx:99-102`), and its wording is an open playtest complaint. Left untouched |
| Hand ("Your cards") | R2 `cards` | R3: cards are already card tiles |
| Reaches (folded) | R8: the empty line becomes `QuietSlot` | R2: no shape (decision 2) |
| Mandate (folded) | R2 `mandate` | R5: the Mandate highlight lives on the god page (slice 2); a second gold line here would break Law 31 |
| Covenants (folded) | R6 face chip on a mortal target | R2: no shape (decision 2). R8: an empty row does not render (`rendersWhenEmpty: false`) |
| Signatures (folded) | R2 `signature` | — |
| Hooks (folded) | R2 `hooks`; R6 face on a mortal vow counterparty | R3: hook chips stay chips; art tiles belong on the god page, not in the HUD (Law 53) |
| Top bar labelled buttons | — | R2 already met (`TopBarItemDef.icon`) |
| Doom | R2 `doom` (decision 5) | — |
| Omen | R1 (its own mark) | R2 (decision 5) |
| Needs-you list | face after icon (decision 6) | — |

## UI pillar

### S3.1 Rail heading icons (R2)

- `GodRailSectionDef` gains `icon: IconName | null` (required, so a new row must state it). Values: `identity: null`, `essence: 'essence'`, `hand: 'cards'`, `reaches: null`, `mandate: 'mandate'`, `covenants: null`, `signatures: 'signature'`, `hooks: 'hooks'`.
- Export `godRailSectionIcon(id): IconName | null` from `frame-registry.ts` so `EssenceBody` and `HandSection` read the row, never a literal.
- `FoldedRow` draws `<Icon name={def.icon} size="floor" decorative />` before the label word, in the label's colour. `EssenceBody` and `HandSection` draw theirs the same way before "Essence" and "Your cards".
- Export `GOD_RAIL_NO_IDEA_ROWS = ['reaches', 'covenants']`, and add a test that every row with `icon: null` other than `identity` is in that list. After merge, post the list as one comment on [THR-2104](https://linear.app/threadbare/issue/THR-2104).

### S3.2 Faces on named mortals (R6, decision 3)

- `GodRailFirst` (`godRail.ts:94`) gains `visual: EntityVisualDescriptor`, from `resolveEntityVisual({ id, kind: 'agent', name }, state.graph)`. `IdentityBody` swaps the `EntityLink` for `<Chip role="identity" target={{ kind: 'agent', id }} label={name} visual={visual} />`. The words "Your First:" stay.
- `CovenantRowView` gains `targetRef?: { kind: 'agent'; id: string; visual: EntityVisualDescriptor }`, set only when the target node is an agent. `CovenantsBlock` draws the identity chip in place of the target string when `targetRef` is set. Otherwise the string renders as today.
- In `HooksBlock`, a vow whose counterparty node is an agent gains `face?: EntityVisualDescriptor`. The vow chip draws it as its leading tile. The label is unchanged.

### S3.3 The Seat line's place shape (R2, decision 4)

`HomeSeatView` gains `icon: IconName`, set from `PLACE_ICON[subtype]` for the seat's place-tier location. `SeatLine` draws it at `floor` size inside the existing button, before the name.

### S3.4 Reaches' empty line (R8)

`ReachesBody`'s italic `REACH_EMPTY_COPY` line renders inside `QuietSlot`. The words are unchanged.

### S3.5 Top bar

- `TOP_BAR_ITEMS` `doom` row: `icon: 'doom'`. The doom slot in `GameViewTopBar` draws it at `chip` size before `DoomBar`.
- `NeedsYouRowVM` gains `face?: EntityVisualDescriptor`, set in `needsYou.ts` when `navigationTarget.kind` is `'agent'` or `'journey'` (both carry an `agentId`). `NeedsYouRow` draws the face tile after `row.icon`, at the same size as the identity chip's tile.

### Player-facing display

At 1920×1080 the rail reads, top to bottom: the god's haloed face and name; "Your First:" with The First's face and name; the essence heading with its shape; the Seat line with its town's shape; the hand under "Your cards" with its shape; then the folded rows, each with its shape (Reaches and Covenants without one). The top bar's doom bar opens with the doom shape. Nothing moves and nothing new is shown.

### Player-facing text

No new words. Every label, line and tooltip id stays as it is today; the change is pictures beside the words.

| Surface | Exact text the player reads | Picture's name / hover | Complaint class touched | How the player understands it |
|---|---|---|---|---|
| Folded rows | "Mandate", "Signatures", "Hooks" (Reaches, Covenants: no shape) | icon decorative; the word keeps its existing tooltip | none | Same words with a shape before each |
| Essence, hand headings | "Essence", "Your cards" | icon decorative; existing tooltips | none | Same |
| Your First line | "Your First: Kael Thornweaver" | the face's alt is the mortal's name | PC-6 | See below |
| Covenant row | "the oath holds — the faithful who gather here are drawn deeper into your service" / [face] "Kael Thornweaver" (title from `reach-signature-content.ts:726`; target illustrative, the build PR quotes a live row) | face alt = name | PC-6 | See below |
| Vow chip | the chip's label as today (e.g. "Owes Kael Thornweaver") | face alt = counterparty's name; the chip keeps its terms tooltip | PC-6 | See below |
| Seat line | "Seat: [town shape] Varnholt" (town name illustrative; the words "Seat:" and the name are unchanged) | place shape decorative; `ui.home_seat` hover unchanged | none | Click still centres the map |
| Reaches, empty | "Your domains are not yet settled." | none | none | Same line in a dashed frame |
| Doom bar | [doom shape] "Strange Whispers" — a breach doom's first stage; its five are "Strange Whispers", "Reality Cracks", "The Thinning", "Barriers Fail", "The Breach" (`src/data/doom/breach.json` `stageNames`). The words are unchanged | shape decorative; `ui.doom_bar` hover unchanged: "A slow five-stage clock to the world's unmaking. It wakes when you bond The First and cannot end the world early. The First's road follows this clock: each stage opens the next part of their story." | PC-1 | See below |
| Needs-you row | [row icon] [face] "Kael Thornweaver has departed from the world." The message template is from `agentLifecycle.ts:416`, and an alert row's `line` is `a.message` (`needsYou.ts:189`). The name is illustrative; the message is unchanged | face alt = the mortal's name; the row's tooltip is unchanged | PC-6 | See below |

**PC-6 (one fact told two ways).** Every face in this slice comes from `resolveEntityVisual`, the same call that draws that mortal's page header. So the rail, the covenant row, the vow chip and the Needs-you row show the same face as the mortal's own page, beside the same name. A mortal below `recognised` draws the silhouette on their page too (Law 8). The player therefore sees a silhouette beside a known name in both places, and the two agree.

**PC-1 (terms testers misread).** The `doom` shape adds no meaning of its own. The explanation stays in the doom bar's existing hover (`ui.doom_bar`, quoted in full above). The Attention gauge is not touched by this slice (see § Per-surface dressing).

### Event notifications

None.

### Debug inspection

The `god-rail` aside gains `data-rail-icons="<id>:<icon|none>,…"` and `data-rail-faces="<count>"`. A `__DEBUG` assertion reads them from the DOM, since the rail has no lab report. No new `__DEBUG` API.

### Visual presence (HexMapV2)

N/A. The map is out of scope.

### UI Laws engaged

1, 3, 4, 8, 9, 14, 17, 21, 27, 31, 33, 53, 58.

Screenshot tool: Playwright (DOM surfaces) at 1920×1080 and 2560×1440.

### Playtest signal

A tester can say who The First is from their face in the rail without opening a page.

## Interface impact

Read sites only; no new cross-system write.

| Contract | Change |
|---|---|
| God rail VM ← entity visuals (`resolveEntityVisual`) | **add read**: `godRail.ts` (`first.visual`), `godSheet.ts` (`targetRef.visual`) |
| Needs-you VM ← entity visuals | **add read**: `needsYou.ts` (`face`) |
| Home seat VM ← place icons (`PLACE_ICON`) | **add read**: `godSheet.ts` |
| `GodRailSectionDef`, `HomeSeatView`, `CovenantRowView`, `GodRailFirst`, `NeedsYouRowVM` | **extend**: one required registry field, optional VM fields |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the read sites in the build PR.

## Engine pillar

N/A. No tick, graph, PRNG, rule or trace change. The edits under `src/engine/views/` add optional presentation fields built from nodes those builders already read.

## Content pillar

N/A. No encounter, prose, attachment or data-table text changes, and no new label. The icon values are registry rows, not words.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace | Debug visibility |
|---|---|---|---|---|---|
| `frame-registry.ts` (`icon`, `godRailSectionIcon`) | none | `AscendantBar`, `godRailComponents`, `HandSection` | none | none | `data-rail-icons` |
| `godRail.ts`, `godSheet.ts` (faces, seat icon) | none (render-time VM) | `IdentityBody`, `CovenantsBlock`, `SeatLine` | none | none | `data-rail-faces` |
| `HooksBlock.tsx` (vow face) | none | `HooksBlock` | none | none | `data-rail-faces` |
| `needsYou.ts` (`face`) | none | `NeedsYou` | none | none | DOM |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `GOD_RAIL_NO_IDEA_ROWS` | `['reaches', 'covenants']` | Rail rows waiting on Christian's icon pick |
| Rail heading icon size | `floor` (existing `IconSize`) | Matches the folded rows' disclosure arrow |
| Face tile size | the identity chip's existing tile (`ICON_SIZE_REM.chip`) | One face size across the chrome |

## Tracing

N/A — nothing new happens in the simulation to trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| The First, or a mortal, below `recognised` | The resolver's silhouette tile (Law 8) |
| Mortal has no portrait | The resolver's designed fallback tile (Law 4) |
| A covenant target node is missing or not an agent | The target string, as today |
| A Needs-you row's `agentId` is stale (node gone) | No `face`; the row renders as today |
| Seat subtype not in `PLACE_ICON` | No icon; the name renders as today |
| An icon name not in the registry | Fallback mark, warns once (existing `iconShape`) |

## Kill criteria

- **At 1920×1080 the hand's first card row falls below its current position by more than one line**, or anything renders below the fold: drop the face chip on the Your First line back to the link first, then the Seat icon.
- **The top bar triggers its give-way order (§ F3) at 1920×1080 on `?view=game&seeded&size=medium`** where it did not before: drop the doom icon.
- **Christian calls the rail "busy"**: keep the faces, drop the heading icons on the folded rows (one registry column set to `null`).

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. North star "the mortal has to feel like a person" is served by the faces. Non-negotiable #1 (god, not protagonist) holds: the rail still leads with the god.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-01-thr-2099-art-led-god-rail-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Icons are registry values; sizes are existing tokens |
| 2. Inspectability | PASS | `data-rail-icons` and `data-rail-faces` on the rail |
| 3. Determinism | PASS | No randomness; fallback tiles are id-hashed |
| 4. Fail-soft | PASS | § Fail-soft table |
| 5. Narrative over mechanical perfection | PASS | Faces make the court read as people |
| 6. Additive over destructive | PASS | One required registry field; everything else optional |
| 7. Performance budget | PASS | Static images through the existing resolver; the VM is already cached per stamp |

## Done when

- [ ] On `?view=game&seeded&size=medium`, every rail heading except Reaches and Covenants draws its carved icon, and `data-rail-icons` on the `god-rail` element says so.
- [ ] The Your First line, every covenant held on a mortal, and every vow with a mortal counterparty draw that mortal's face tile. A test covers a covenant on a place, which draws no face.
- [ ] The Seat line draws its town's place shape, and clicking it still centres the map.
- [ ] The doom bar draws the `doom` shape. The omen draws no second icon.
- [ ] A Needs-you row pointing at a mortal draws the face after its icon. A test covers a row pointing at a hex, which draws none.
- [ ] Nothing new is added to the rail or the top bar: `data-sections-rendered` and the top bar's rendered item ids are unchanged from `main` on the same URL.
- [ ] At 1920×1080 and 2560×1440 the rail renders with nothing below the fold (Law 33).
- [ ] Four-part browser evidence: 1920×1080 and 2560×1440 screenshots, console output, a DOM assertion on `data-rail-icons` / `data-rail-faces`, and a UI-Laws judgment line.
- [ ] `npm run gate` green; the THR-2104 comment posted after merge.
- [ ] Closing commit body includes `Fixes THR-2099` on its own line.

## Coordination block

**Suggested model:** sonnet. Dressing on known primitives across about ten files; no new primitive and no grammar.

**Parallel-safe with:** THR-2098 (Inspector pages; disjoint files), THR-2104 and THR-1908 (icon picks; one registry line each).

**Mutex with:**
- Any open ticket editing `src/data/frame-registry.ts`, `src/components/Game/ascendant-bar/*`, `src/components/Game/frame/godRailComponents.tsx`, `HandSection.tsx` or `NeedsYou.tsx`: the same chrome.
- THR-2094 only if it edits `godRail.ts` (its Mandate work is engine-side today).

**Files to touch:**
- `src/data/frame-registry.ts`
- `src/engine/views/godRail.ts`, `src/engine/views/subjects/godSheet.ts`, `src/engine/views/needsYou.ts`
- `src/components/Game/ascendant-bar/{AscendantBar,CovenantsBlock,HooksBlock,SeatLine}.tsx`
- `src/components/Game/frame/{godRailComponents,HandSection,NeedsYou}.tsx`
- `src/components/Game/GameView/GameViewTopBar.tsx`
- tests beside each

## Notes for the executor

- Do not add a second face path. Every face is `resolveEntityVisual` through the identity `Chip`, as slice 1's where-chips and bond strip do.
- Do not invent shapes for Reaches or Covenants. They wait on THR-2104.
- Tests likely to need updating: the rail's render tests under `src/components/Game/ascendant-bar/__tests__/`, `termsExplainThemselvesThr1814.test.tsx`, and any snapshot of `NeedsYou` rows.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-11-01. Notes resolved inline after the run: Fail-soft (a stale Needs-you `agentId` row was added); Pillar (the Player-facing text table was added).*

### NFP audit

PASS-with-notes:
- 1 Tunability, 2 Inspectability, 3 Determinism, 5 Narrative: PASS.
- 4 Fail-soft: note on a stale or missing Needs-you `agentId`. Now a row in the table.
- 6 Additive: note. The required `icon` field and the `EntityLink` → `Chip` swap on the Your First line are replacements. Both are deliberate.
- 7 Performance: note. The `resolveEntityVisual` calls are unprofiled. They are bounded by what the rail shows.

### Three-pillar audit

PASS-with-notes:
- Engine: N/A-with-rationale.
- Content: N/A-with-rationale.
- UI: present-and-substantive.
- Note: the Player-facing text table was thin. Now added.
- Blast Radius is not owed (19 importers at most).
- Substrate: every row is ACTIVE and extends, with no duplication.

### Vision audit

PASS-with-notes. No contradictions:
- North star: extended.
- Non-negotiable #1: confirmed.
- Taste profile: one gold emphasis is confirmed. "No decorative flourishes" pushes against icons on every heading; the "busy" kill criterion covers that risk.

### Intent-judge verdict

2026-11-01. First pass: **Revise**, one GAP:
- Dim 12: player legibility. The per-surface text table and the PC-6 / PC-1 answers were missing. Both are now added.

Second and third passes: **Revise**, dim 12 only. Fixes:
- The Attention gauge was cut to N/A.
- The `ui.doom_bar` hover is quoted in full.
- Rendered samples were added for the covenant, doom, Needs-you and Seat rows.

Fourth pass: **Allow** (Reversible, zero GAPs).
