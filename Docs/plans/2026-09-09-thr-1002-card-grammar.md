> **title:** `One card grammar — the action card adopts the encounter card's face, and a cast tells you what it did — THR-1002`
> **linear_issue:** THR-1002
> **author:** `Claude Code`
> **created:** 2026-09-09
> **three_pillars:** Engine `done — the slot carries a forecast tier and a scale word; the receipt's toast carries the overview; detection risk retired; the agent hand gets the technical-effect overlay` · Content `done — authored effect lines for every card the player can actually hold; no new template field` · UI `done — one shared card face, one card row, one Cast button; the drawer's three effect surfaces collapse to the face; Playwright at 1920×1080`

# One card grammar — THR-1002

*Two cards, one player. The nudge card says what it does and nothing else — a small picture, a keyword chip, a sphere mark, a framed price, a name, an effect line, an odds reading, and a reason when it is dimmed. The action card says the same things in a different order with different glyphs, plus three paragraphs, two percentages, an internal key in capitals and a hex count, and when you play it the world answers with "Your Bless Harvest held." After this there is one face, and a cast answers with what happened.*

## Why this is load-bearing

Christian's directive of 2026-08-06, verbatim: *"players would expect the same type of syntax and rough layout and language for all 'cards' in the game, despite them working in different contexts and having different functions"*; *"the action cards are too verbose and their actual action in the game is very hard to understand"*; *"when you play one you don't really get feedback."* All three measure true on `main` `a87e8f24` (survey 2026-09-09). The nudge card (`NudgePhaseShell.tsx:174-416`) renders ten zones through six `shared/` primitives; the action card (`ActionCard.tsx`, 620 lines) renders through one (`RarityBadge`), imports `SphereIcon` from `../icons` rather than `shared/`, and on its focused face carries a type line built by string-splitting the slot id into `IRON · CREATE` (Law 14), a numeral cost badge, `technicalDescription`, `effectsLine` ending in *" Costs 3 essence."*, a `{X}% risk` zone, a `{n} hex` zone and a `0.5 force/tick` badge (Law 13, four times over) — and then the drawer renders `technicalEffect` a third time under an *EFFECT* label with a wiring badge (Law 16), nests the THR-998 cast line inside that block, and adds eight hardcoded sentences of sphere prose beneath. Three of those surfaces are dead or invisible: `detectionRisk` is hardcoded `0` at `targetActions.ts:439` so the percentage never renders in production (its only test, `ActionCard.test.tsx:178`, asserts `10%` against a fabricated fixture); and `AGENT_INTERVENTION_TEMPLATES` skips the `ACTION_TECHNICAL_EFFECTS` overlay (`unified-action-templates.ts:5463` spreads the raw arrays; 0 of 44 carry `technicalEffect`), so on the agent hand — where most casts happen — the drawer's Effect block never renders and the THR-728/THR-998 cast line nested inside it never renders either.

The feedback half measures out the way the ticket suspected. `decidePresentation` (`playerReceipts.ts:121-133`) sends a cast to the receipt modal only on `steps ≥ 2`, rarity `≥ 3`, a change kind in `RECEIPT_MODAL_CHANGE_KINDS`, or an authored reaction. Against the deck a player can actually hold — the 30 templates any Ascendant Beat can grant (`collectGrantedActionIds()`), since `STARTER_ACTION_IDS` is empty and the drawer's unlock gate (`targetActions.ts:347`) admits nothing else — **2 of 30** can ever reach the modal (`plant_secret`, `rekindle_thread`, both on rarity alone); on the agent hand, **2 of 22**. The step condition fires on 0 of both (every divine verb is single-step); the change-kind condition fires on 0 of both. The other 28 get a toast whose text is, unconditionally (`playerReceipts.ts:310`), `` `Your ${template.name} ${outcomeBandWord(band)}.` `` — the template's internal `name`, not its `spellName`, and one band word; the `overview` the resolver built for the receipt is never put in the toast. So the feedback Christian was promised exists, is wired, and reaches him as *Your Bless Harvest held.* ninety-three times in a hundred.

Two premises in the ticket moved before this session and are corrected here rather than carried. **THR-998 shipped** (2026-08-12): the cast line now reads the effective difficulty through `playerCastReadout.ts` and names the scale where the floor capped the price away, so this plan no longer "answers THR-998" — it inherits its invariant (the card never claims odds the roll will not deliver) and re-homes its output. **The flavour quote was retired by name** (Prose Doctrine v2, 2026-08-25; THR-1224/THR-1225): `StepNudge.fiction` was deleted with a *do not reintroduce* comment (`unifiedAction.ts:1500-1511`), 767 strings struck, and the nudge card's zone 7 is now a comment. Christian's 08-06 line — *"one line flavour on action cards is fine"* — predates that doctrine by three weeks and conflicts with it on exactly the axis this ticket unifies: a card that carries prose and a card that does not do not share a grammar. **The later, broader ruling wins:** the action card gets no flavour quote, and its one line is the effect line. This is presented as decided with an invitation to veto, not as a question.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounters & Dilemmas — the nudge card (`NudgeCard`, `NudgePhaseShell.tsx:174-416`), `src/data/nudge-card-display.ts` (`ESSENCE_PIP_GLYPH`, `MAX_COST_PIPS`, `NUDGE_CARD_TYPE_ICONS` keyed on the live type union, `NUDGE_GLYPH_LEGEND`), `src/data/nudge-pip-vocabulary.ts` | 🟢 ACTIVE | **extracts, does not change** — the zone stack becomes a shared `CardFace` primitive that `NudgeCard` renders through unchanged (its DOM is pinned by a snapshot before the extraction); the display constants stay where they are and the action card gets a sibling file |
| Shared primitives — `EntityVisual`, `CardKeywordChip`, `CostPips` (framed; `0` renders *Free*), `OddsPips`, `SphereIcon` (`shared/`), `ReachIcon`, `Tooltip`, `RarityBadge` | 🟢 ACTIVE | **adopts** — the action card renders through all of them; `OddsPips` is deliberately **not** adopted for a cast (Law 10: pips mean only *effect on the odds*; a cast has no delta) |
| Player action targeting — `getTargetActionSlots` (`targetActions.ts:203-479`; slot literal `:431-455`), `WheelSlot` (`engine/wheel.ts:26-98`), `castDifficultyFields` (`:83-101`), `hardestStep` (`:55-74`) | 🟢 ACTIVE | **extends** — the slot gains `forecastTier`, `scaleWord`, `upkeepWord`; `detectionRisk` is retired from the face and the type |
| Player cast readout (THR-998) — `playerCastReadout.ts` (`effectiveCastDifficulty`, `castCapabilityByReach`), `castHintLine` / `SCALE_HINT_LINES` / `RISK_HINT_THRESHOLDS` (`player-cast-constants.ts`) | 🟢 ACTIVE | **replaces the output, keeps the invariant** — the effective difficulty becomes a probability and a tier word through the resolver's own arithmetic; the three-word risk sentence and the scale sentences retire with the Effect block they were nested in |
| Forecast tiers — `classifyForecastTier` (`outcomeForecast.ts:44`), `FORECAST_TIER_*_MAX` (`encounter-experience-constants.ts:83-89`), `FORECAST_TIER_COLORS` (test panel) | 🟢 ACTIVE | **adopts** — the action card's odds zone is the same tier word, same classifier, same colours the test panel uses |
| Divine Receipt (THR-727/728) — `playerReceipts.ts` (`decidePresentation` `:121`, toast `:310`), `receipt-content.ts`, `DivineReceiptModal`, `ToastStack` band accent, `notificationRouter` receipt navigation | 🟢 ACTIVE | **extends** — the toast carries the overview; the card acknowledges the resolved band on its face; the gate and its constants are untouched |
| Effects prose — `actionEffectsProse` (`actionEffectsProse.ts:145`), `ACTION_EFFECTS_PROSE` (19 overrides, `:41-86`), composed fallback (`:105-130`), cost suffix (`:135-138`) | 🟢 ACTIVE | **extends** — the suffix retires (price is pips); overrides authored for every card in the reachable deck and the agent hand |
| `ACTION_TECHNICAL_EFFECTS` overlay (`unified-action-templates.ts:5657-5665`) | 🟢 ACTIVE, **skipped for `AGENT_INTERVENTION_TEMPLATES`** | **activates** on the agent hand (the `:5463` assembly applies the same overlay) |
| Legacy wheel — `getAgentWheelSlots` (`wheel.ts:219`, `@deprecated` THR-501, zero production callers), `INTERVENTION_DEFINITIONS[*].detectionRisk` (`dream-content.ts`, eight values), `computeDetection` (`engine/dream.ts:206`) | 🟠 DORMANT | **retires the card's read**; the eight values go only if `computeDetection` has no production caller (the executor greps and records) |

**Grep evidence (2026-09-09).** `detectionRisk` is written `0` at `targetActions.ts:439` and read at `ActionCard.tsx:544`; `getAgentWheelSlots` has 41 test calls and 0 production calls; `technicalEffect` populated on 179/697 templates overall and 0/44 in `AGENT_INTERVENTION_TEMPLATES`; `ACTION_EFFECTS_PROSE` covers 19 ids, 19 of 30 beat-grantable and 6 of 586 actor-targeted; `getActionArt` resolves 20 of 586 actor-targeted and 18 of 44 agent-hand templates; `consequenceMessage` populated on 0/697; no `fiction`/`flavorText`/`summary` field exists on `UnifiedActionTemplate`; `FORECAST_TIER_*_MAX` = 0.2 / 0.4 / 0.6 / 0.8; `MIN_PROBABILITY_BY_SCALE` personal 0.70, local 0.65 — a fresh god's local working reads `favorable`, its regional `perilous`, its cosmic `doomed`, and a zero-difficulty soul-verb `fated`.

## The grammar

One face, stated as rules, binding both cards. Different *fields* per context are expected; different grammar is not.

1. **Picture band.** `EntityVisual` hero, rounded, `CARD_PICTURE_BAND_PX` tall — a small generic image that says what kind of thing this is (Law 7). Fallback: the keyword glyph on the id-hashed gradient.
2. **Chip row.** Left: one `CardKeywordChip` naming the card's kind in the kind's own build-enforced vocabulary (Law 9). Right: the reach it leans on (`ReachIcon`, 16px, tooltip), the sphere mark (`shared/SphereIcon`, 16px), the price as **framed** `CostPips` (Law 10 — price is framed so it never reads as odds). A second, muted chip may follow the first for a context-specific kind fact (the action card's scale).
3. **Name.** Display font, one or two lines, gold when selected.
4. **Alternate cost channels** (optional). Icon + label in words + pips where the channel is pip-shaped, never a numeral.
5. **Provenance** (optional). Delivered in parts (prefix · concept in a tooltip · suffix), never as prose (Law 2).
6. **Effect line and odds.** The effect in plain words, then the odds reading: `OddsPips` where the card *changes* odds (a nudge), the **forecast tier word** where the card *rolls* them (a cast). Numerals never render; the designer view holds them.
7. **No prose.** A card says what it does and nothing else (Prose Doctrine v2). The foot is a spacer.
8. **A dimmed card always says why.** `blockedReason` in words, loss-red.
9. **The card is a button** — `aria-pressed`, `disabled`, `focus-ring` — 210px wide, in a non-wrapping row that scrolls on its own axis under a capped height (Law 33).
10. **When it resolves, the card wears the fate word** (surge · held · crooked …) in the band's accent on the same face (Laws 37/47).

**Before / after, the action card against the nudge card:**

| Zone | Nudge card (unchanged) | Action card today | Action card after |
|---|---|---|---|
| Picture | 78px band, `EntityVisual` | full-bleed thumbnail (hand) / 200px plate (focused) | 78px band, `EntityVisual`, `getActionArt` → gradient+glyph fallback |
| Kind | `CardKeywordChip` (card type) | `IRON · CREATE` string-split from the id | `CardKeywordChip` — the **verb** (`CREATE · FIND · CHANGE · DESTROY · CONTROL`) + a muted scale chip (`LOCAL` …) |
| Reach / sphere | reach in the test panel; sphere mark | `SphereIcon` from `../icons` | `ReachIcon` + `shared/SphereIcon` |
| Price | framed `CostPips` | sphere dot + numeral; *" Costs 3 essence."* in prose | framed `CostPips`; the prose suffix gone |
| Upkeep | cost-channel row | `↻ 0.5 force/tick` | cost-channel row: `↻` + *light / steady / heavy upkeep* in the sphere's essence |
| Name | display font | `spellName ?? label` | `spellName ?? name`, clickable to the codex entry (Law 21) |
| Effect | `effectLine` | `technicalDescription` + `effectsLine` on the face; `technicalEffect` in the drawer | `effectLine` only; `description` and `technicalEffect` live on the codex page |
| Odds | `OddsPips` (delta) | *"A steady working."* nested in the drawer's Effect block | the forecast tier word, tier-coloured, tooltip |
| Range | — | `{n} hex` | the scale chip; *too far* becomes a `blockedReason` |
| Detection | — | `{X}% risk` (dead) | gone |
| Prose | none (retired) | eight hardcoded sphere sentences under the card | none |
| Blocked | reason in words | italic truncated `lockedReason` | reason in words, loss-red |
| Rarity | — | `RarityBadge` | `RarityBadge` in the chip row's right group (its one vocabulary, Law 9) |
| Resolved | fate reveal on the stage | `✓` overlay | the fate word on the face |

## Engine pillar

### Systems design

**The slot carries what the face needs, in words.** `getTargetActionSlots` (`targetActions.ts`) adds three derived fields to the literal at `:431-455`, all computed from data already on the slot:

- `forecastTier: ForecastTier` — from `castForecastProbability(maxStepDifficulty, capability, scale)`, a new function in `playerCastReadout.ts` beside `effectiveCastDifficulty`: `P = clamp(capability + CARD_READOUT_SPHERE_FACTOR − effectiveDifficulty + CARD_READOUT_MODS)`, then the per-scale floor `MIN_PROBABILITY_BY_SCALE[scale]` — the resolver's own arithmetic in the resolver's own order, so the word and the roll cannot drift (THR-998's invariant, restated: *the card's odds reading is a function of the probability the roll uses*). A zero-difficulty step is `fated` by construction (the guaranteed path). `classifyForecastTier(P)` picks the word. When `ascendantCastCapabilities` was not supplied, `forecastTier` is omitted and the face renders no odds zone — absent, not a lie.
- `scaleWord: ActionScaleWord` — `ACTION_SCALE_WORDS[scale]` (`personal · local · regional · cosmic`, display words from one table, Law 14).
- `upkeepWord?: UpkeepWord` — for sustained templates, `upkeepWord(perTickCost)` bands the per-tick cost by `UPKEEP_WORD_THRESHOLDS` into `light / steady / heavy`; `perTickCostLabel` stays for the designer view.
- `detectionRisk` **leaves** `WheelSlot` (the field, the hardcoded `0` at `:439`, the two zeros at `GameView.tsx:3770` and `AscendantBeatModal.tsx:167`, the render at `ActionCard.tsx:544`). Additive-first: the executor makes it optional, removes every write and read, then removes the field. The eight `INTERVENTION_DEFINITIONS[*].detectionRisk` values are deleted **iff** `computeDetection` (`engine/dream.ts:206`) has no production caller; otherwise they stay as that system's data and the card simply stops reading them. Either way the vacuous test at `ActionCard.test.tsx:178` is deleted with the zone.

**The cast line retires with its home.** `castHintLine`, `riskHintLine`, `RISK_HINT_THRESHOLDS`, `RISK_HINT_WORDS`, `SCALE_HINT_LINES` and `effectiveStepDifficulty` on the slot are no longer read by any surface once the drawer's Effect block is gone; the executor deletes the readers and the constants in the same change and re-points `playerCastBalance.test.ts` (the ≤60%-per-word bound guarded a sentence that no longer exists) at the new invariant: for a sample of slots the face's `forecastTier` equals `classifyForecastTier` of the probability `resolveUncontestedStep` would use. That is gate calibration under the agreed-outcome rule (`Docs/canon/process.md` § User review interface, rule 4): the agreed outcome — the card never claims odds the roll will not deliver — is preserved by construction, and the closeout says so with the before/after.

**The receipt's toast says what happened.** `playerReceipts.ts:310` builds the toast message from the receipt: the first sentence of the enriched `overview` when `aftermathSummary` exists, else the band frame line (`selectReceiptFrameLine`), never the bare template name; the template word it uses anywhere is `spellName ?? name` (Law 14). `RECEIPT_TOAST_USES_OVERVIEW` gates it. The presentation gate, its three constants and the modal are untouched — a modal on every cast would turn the aftermath from a breath into an interruption (`Vision/01-core-loop.md`), and the measurement says the toast's *content*, not its *tier*, is the gap.

**The card acknowledges the cast.** GameView already holds `playerActionReceipts`; the drawer receives `resolvedBands: ReadonlyMap<actionId, band>` built from the receipts of the current session, and a card whose action resolved wears the band word from `OUTCOME_BAND_WORDS` in `BAND_ACCENT` on its face until the receipt is acknowledged. The `playing` spent overlay keeps its job for the in-flight window.

**The agent hand gets the overlay.** `AGENT_INTERVENTION_TEMPLATES` (`unified-action-templates.ts:5463-5467`) is assembled through the same `ACTION_TECHNICAL_EFFECTS` overlay `UNIFIED_ACTION_TEMPLATES` uses, so the codex page for a divine verb carries its mechanical text.

### Graph nodes / edges

None. Nothing is written to the graph; the receipt reads what the resolver already wrote.

### Tick phases

No new phase. `phasePlayerReceipts` (post-resolution) is the only engine site edited, and only in what its toast says.

### Resolution logic

Unchanged. The forecast tier is computed from the same probability the roll uses; it is a readout, not an input.

### PRNG callouts

None. No draw; the tier is arithmetic on the capability and the authored difficulty.

## Content pillar

### Encounter templates

None modified structurally. **No new template field** — a flavour or summary field on `UnifiedActionTemplate` would be a 464-importer edit for prose the doctrine has retired. The one line a card carries is its effect line, derived at slot-build time (the `effectsLine` precedent).

### Prose tables

`ACTION_EFFECTS_PROSE` (`src/data/actionEffectsProse.ts:41-86`) gains an authored line for every template in two predicates, so no card the player can actually hold falls to the composed fallback: (a) every id `collectGrantedActionIds()` returns (the beat-grantable deck), and (b) every actor-targeted member of `AGENT_INTERVENTION_TEMPLATES` (the agent hand). Register: spell-style verb + noun, plain, present tense, no numerals, ≤ 14 words (`ACTION_EFFECT_LINE_MAX_WORDS`, warn-level in the existing content-eval sweep), naming the core concept the effect touches (reputation, condition, item, essence, thread — never a bespoke noun; the chip vocabulary rule of THR-1205 applies to effect lines). The cost suffix at `:135-138` is removed for every line — price is pips. The composed fallback stays for the long tail. `ACTION_SCALE_WORDS`, `UPKEEP_WORDS`, `ACTION_CARD_KEYWORD_ICONS` (one glyph per `CrudType`, a build failure when a verb has none — Law 9) and the two toast-shape lines live in a new `src/data/action-card-display.ts`, the sibling of `nudge-card-display.ts`.

### Attachment content

N/A — no attachment templates touched.

### Data tables

The `SPHERE_ACTION_PROSE` table (`ActionDrawer.tsx:63-72`, eight strings) is deleted with the drawer zone that rendered it; it was generic sphere copy, not card content, and the doctrine gives cards no prose.

## UI pillar

*Screenshot tool: **Playwright** (DOM — the drawer, the card row, the toast; no WebGL). The drawer is not portalled, so a direct 1920×1080 capture discharges the contract; the toast is captured in the same pass.*

### Player-facing display

**`src/components/shared/CardFace.tsx` (new primitive).** The nudge card's zone stack (`NudgePhaseShell.tsx:239-404`) extracted verbatim into a primitive taking a `CardFaceModel`: `{ id, picture: EntityVisualDescriptor | null, fallbackGlyph, keyword: { label, icon, muted? }, secondaryKeyword?, reach?, sphere?, cost, costChannels?, provenance?, name, effectLine, odds: { kind: 'delta', value } | { kind: 'forecast', tier } | null, rarityTier?, blockedReason?, resolvedBand?, selected, disabled, designerLine? }` and the button props. `NudgeCard` becomes a thin adapter over it and **renders identically** — a snapshot test of the nudge card's DOM is written *before* the extraction and must pass unchanged after it; that is the executor's proof the nudge card was moved toward nothing. Documented in `Docs/design-system/primitives.md` and sampled in `?view=styleguide` with a nudge model and an action model side by side.

**`src/components/Game/ActionCard.tsx` (rewritten).** One size. Renders `CardFace` from a `WheelSlot` through an adapter (`actionCardModel(slot, resolvedBand)`): picture from `getActionArt(slot.id)` else gradient + verb glyph; keyword chip from `ACTION_CARD_KEYWORD_ICONS[crudType]` with the verb word; secondary muted chip `ACTION_SCALE_WORDS[scale]`; `ReachIcon` for the reach `hardestStep` returned; `shared/SphereIcon`; framed `CostPips`; the upkeep channel when `upkeepWord` is set; name `spellName ?? name` as a link to the codex action page where one exists (Law 21; the codex routes by kind `action`); `effectLine`; odds `{ kind: 'forecast', tier }` when present; `RarityBadge` in the right group; `blockedReason` from `lockedReason` or, for `rangeStatus !== 'in_range'`, *too far from here*. The 400×560 focused frame, the `parseTypeLine` split, the numeral cost badge, the `technicalDescription` zone, the `% risk` and `hex` zones, the sustained numeral badge and the inline `<style>` blocks are gone.

**`src/components/Game/ActionDrawer.tsx` (edited).** The fan (`HAND_CONFIG`, `computeSpacing`, `cardFanTransform`) is replaced by the nudge hand's row: `CARD_WIDTH_PX` cards, horizontal scroll on its own axis, height capped at `HAND_MAX_HEIGHT_PX` (Law 33). Selecting a card presses it (gold title, `aria-pressed`) — the face is complete, so nothing expands. The Effect block (`:251-342`), its badge, the nested cast line and the sphere preview (`:343-360`) are deleted. The drawer's footer gains one **Cast** button (shared `Button`), enabled when the selected card is castable, wired to the existing activate handler — arm, then fire (Law 48), the nudge stage's *Let fate decide* shape. The layer tabs and the locked-cards toggle keep their jobs; the emoji glyphs on the layer tabs (`⛰ ✨ 👤 🏛 🔒`) are replaced with the registry's icons in the same change (taste profile: no emoji in the UI).

**The UI Laws this surface engages (THR-1007; they bind by default).** Law 1 (every concept carries image, tooltip, link — the verb chip, the scale chip, the reach and sphere marks and the tier word all carry registry tooltips; the name links); Law 7 (the picture is a band, not a hero); Law 9 (one icon vocabulary per element class — verbs get a build-enforced map); Law 10 (price framed; odds never pips on a cast); Law 11 (14px floor, `aria-label` on every glyph row stating its reading in words); Law 12 (the hand's glyph legend covers the tier word at first contact); Law 13 (no numerals — the four leaks named above close); Law 14 (no raw keys — the type line dies); Law 15 (pips annotate words); Law 16 (no *EFFECT:* label strip); Law 17 (tooltips by id from the one registry — new ids `ui.card.verb.<crud>`, `ui.card.scale.<scale>`, `ui.card.upkeep.<word>`, `ui.forecast.<tier>` registered); Law 21 (the name links to the codex page); Law 23 (button semantics, Escape closes the drawer as today); Law 25 (a card that cannot be cast is dimmed with its reason, never inert); Laws 26/27 (one new primitive, extracted not invented; presentation logic lives in `shared/`); Law 28 (action = its card face — the registry row's rendering is this face); Law 33 (the row scrolls, the page never); Law 37 (the cast's ending wears the chrome of the card that started it); Law 47 (a spend visibly moves the essence pool — unchanged); Law 48 (arm then fire).

### Event notifications

The toast-tier receipt carries the overview's first sentence (or the band frame line) with the band accent and its existing click-through to the modal. No new event type. Modal tier unchanged.

### Debug inspection (DebugPanel)

- The designer-view toggle (the nudge card's zone 10) works on the action face too: `P 0.65 · eff 0.00 · local` in monospace, gated on the DebugPanel toggle — the numerals live here and nowhere else.
- `window.__DEBUG.listActions()` (existing) gains `forecastTier` and `scaleWord` on each slot; `__DEBUG.listPlayerReceipts()` (existing) gains `toastMessage`.

### Visual presence (HexMapV2)

N/A — no map-layer change.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/playerCastReadout.ts` (`castForecastProbability`, new) | — (slot build) | `ActionCard` via the slot | reads ascendant capability | — | `__DEBUG.listActions()` |
| `engine/targetActions.ts` (slot fields) | — | `ActionCard`, `ActionDrawer` | — | — | `__DEBUG.listActions()` |
| `engine/playerReceipts.ts` (toast message) | `player_receipts` (post-resolution) | `ToastStack` | reads `playerActionReceipts` | `player_receipt` (+ `toastOverviewUsed`) | `__DEBUG.listPlayerReceipts()` |
| `data/action-card-display.ts` (new) | — | `ActionCard`, StyleGuide | — | — | — |
| `data/actionEffectsProse.ts` (overrides; suffix removed) | — | `ActionCard` | — | — | content-eval sweep |
| `shared/CardFace.tsx` (new) | — | `NudgeCard` (adapter), `ActionCard` | — | — | `?view=styleguide` |
| `Game/ActionDrawer.tsx` (row, Cast button) | — | — | reads `playerActionReceipts` for `resolvedBands` | — | — |
| `data/unified-action-templates.ts` (`:5463` overlay) | — | codex page | — | — | `?view=codex` |

Prose pipeline: the effect line is plain text; the toast's overview sentence passes through `enrichProse()` as the receipt already does. Player controls: select a card, Cast.

## Constants table

New `src/data/action-card-display.ts` unless noted (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `CARD_WIDTH_PX` (moved to `shared/`) | `210` | one card width for both faces |
| `CARD_PICTURE_BAND_PX` (moved to `shared/`) | `78` | the small generic picture band |
| `HAND_MAX_HEIGHT_PX` (shared with the nudge hand) | `460` | Law 33 cap on the card row |
| `ACTION_CARD_KEYWORD_ICONS` | one glyph per `CrudType` | build-enforced verb vocabulary (Law 9) |
| `ACTION_SCALE_WORDS` | `personal · local · regional · cosmic` | the scale chip |
| `UPKEEP_WORD_THRESHOLDS` | `[0.25, 1.0]` | per-tick cost cut-points for *light / steady / heavy* |
| `UPKEEP_WORDS` | `['light', 'steady', 'heavy']` | the upkeep channel's words |
| `ACTION_EFFECT_LINE_MAX_WORDS` | `14` | authoring guardrail, warn-level |
| `RECEIPT_TOAST_USES_OVERVIEW` (`receipt-content.ts`) | `true` | the toast carries the overview's first sentence |
| `ACTION_CARD_GLYPH_LEGEND` | verb · scale · price · odds | the first-contact legend (Law 12) |

Reused, not redefined: `FORECAST_TIER_*_MAX`, `MIN_PROBABILITY_BY_SCALE`, `CARD_READOUT_SPHERE_FACTOR`, `CARD_READOUT_MODS`, `MAX_COST_PIPS`, `ESSENCE_PIP_GLYPH`, `OUTCOME_BAND_WORDS`, `BAND_ACCENT`.

## Tracing

No new trace type. The existing `player_receipt` trace (registered in `src/types/trace.ts`) gains one optional field at its interface — register it, do not duck-type it (`emitTrace`'s `Omit` collapses unions):

```ts
// PlayerReceiptTrace (extended) — which sentence the toast carried
interface PlayerReceiptTrace {
  // ...existing fields unchanged...
  toastOverviewUsed?: boolean; // true when the overview's first sentence was the toast, false when the frame line was
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `ascendantCastCapabilities` not supplied to the slot builder | `forecastTier` absent; the face renders no odds zone (never a guessed word) |
| Non-finite capability or difficulty | `castForecastProbability` returns the scale floor; the tier is the floor's tier |
| `crudType` missing on a template | keyword chip renders the plain word *working* with the fallback glyph and warns once (Law 14's own rule) |
| `sphereAffinity` is not a Sphere (`shadow`, `void` — THR-1114) | no sphere mark; warn once; the card renders |
| No art for the id | gradient + verb glyph (the nudge card's own fallback) |
| Codex has no page for the action | the name renders as text, not a dead link (Law 21: *where a page exists*) |
| `aftermathSummary.overview` absent at toast time | the band frame line |
| `overview` first-sentence split finds no terminator | the whole overview, clamped by the toast's existing width |
| A receipt whose action id no longer matches a card in the drawer | no fate word; the receipt still toasts |
| `computeDetection` has a live caller | the eight values stay; only the card's read is removed |

## Interface impact

Rows touched in `Docs/canon/interface-map.generated.md`; register the changes in `scripts/interface-contracts.ts` in the same change.

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `authored-step-difficulty-player-resolution` (🟢) | **extend** — the card's read moves from `effectiveStepDifficulty` + a sentence to `forecastTier` through the same helper; the row's note updates | `targetActions.ts` → `ActionCard` |
| `authored-tier-ramp-target-scaled-price` (🟢) | **preserve** — the displayed price is pips of the same `tierScaledEssenceCost` | unchanged |
| `player-action-aftermath-read` (🔵) | **extend** — the toast now reads `overview`; this is the payload check the row says was unverified | `unifiedActionResolution.ts` → `playerReceipts.ts` → `ToastStack` |
| `receipt-event-band-toast` (🔵) | **preserve** | unchanged |
| `player-action-receipts-queue` (🔵) | **extend** — a second reader: the drawer's `resolvedBands` | `playerReceipts.ts` → `ActionDrawer` |
| Card face ↔ slot (no row today) | **add** — `WheelSlot` → `CardFaceModel` via `actionCardModel`; the face is the registry's rendering of an action (Law 28) | `targetActions.ts` → `shared/CardFace` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/data/unified-action-templates.ts` | 141 | the `ACTION_TECHNICAL_EFFECTS` overlay is applied to the `AGENT_INTERVENTION_TEMPLATES` assembly at `:5463`; the export's shape and every id are unchanged, so importers see populated `technicalEffect` fields and nothing else |
| `src/types/trace.ts` | 120 | one optional field on the existing `PlayerReceiptTrace` interface; the typecheck ratchet is the gate |

Deliberately untouched: `src/types/unifiedAction.ts` (464) — no new template field. `engine/wheel.ts` (~13 importers) loses a field additively.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It enforces three: *prose-first UI, no numbers visible to the player* (four numeral leaks close); the austere voice (no emoji, no label strips, no prose on cards per Doctrine v2); *the intervention has to feel consequential* (`00-north-star.md`) — the cast now answers with what changed rather than with its own name. The aftermath stays a breath, not an interruption (`01-core-loop.md`): the modal gate is untouched and the substance moves into the toast.
- [x] Taste profile: the entry *Encounter-specific intervention verbs* already records that card faces carry a generic, library-wide vocabulary while prose does the scene — this plan is that entry applied to the second card. No edit required.
- [x] The one ruling this plan overrides — *one line flavour on action cards is fine* (2026-08-06) — is overridden by Christian's own later doctrine (2026-08-25), stated in § Why this is load-bearing and in the handoff, with an invitation to veto.

## Rulebook impact

- [x] This plan does not change a rule of play. Cost, resolution, the floor and the ladder are untouched; the forecast word is a reading of the probability the roll already uses.
- [x] No `Docs/canon/rulebook.md` edit is owed — the card grammar is design-system canon (`Docs/design-system/laws.md`, and `primitives.md` gains the `CardFace` entry), not a rule of play.

> Brainstorm companion: `Docs/plans/2026-09-09-thr-1002-card-grammar-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | ten named constants; the verb, scale and upkeep vocabularies are tables |
| 2. Inspectability | PASS | the designer view holds every numeral; `listActions` and `listPlayerReceipts` gain the new fields; `toastOverviewUsed` on the trace |
| 3. Determinism | PASS | no draw; the tier is arithmetic |
| 4. Fail-soft | PASS | ten rows; every absent input renders an absent zone, never a guess |
| 5. Narrative over mechanical perfection | PASS | the card says what it does in words; the cast answers with what happened |
| 6. Additive over destructive | PASS with note | the focused frame, the fan, the Effect block, the sphere prose, the cast line and `detectionRisk` are removed — each is a surface the directive named as the defect or a read that production never reached; the nudge card is extracted, not edited, and pinned by a snapshot |
| 7. Performance budget | PASS | one `classifyForecastTier` per slot at build time; the row replaces per-card transform math |

## Done when

- [ ] A snapshot test of `NudgeCard`'s rendered DOM written before the extraction passes unchanged after it (the nudge card moved toward nothing)
- [ ] `?view=styleguide` shows `CardFace` with a nudge model and an action model side by side; `primitives.md` documents it
- [ ] On `?view=game&seeded&size=medium`, the drawer renders the card row; a selected card shows verb chip, scale chip, reach and sphere marks, framed price, name, effect line, tier word and rarity; no numeral, no percentage, no raw key anywhere on the drawer (Playwright asserts `/\d+%|\bhex\b|[A-Z]{3,} · [A-Z]{3,}/` matches nothing in the drawer's text)
- [ ] A zero-difficulty divine verb reads `fated`; a positive-difficulty local working reads `favorable` for a fresh god; a regional one reads `perilous`; the truthfulness pin holds: `slot.forecastTier === classifyForecastTier(P_resolver)` for every slot in the seeded drawer
- [ ] The agent hand shows the same face (the overlay applied; `technicalEffect` populated on the 44)
- [ ] Every id `collectGrantedActionIds()` returns and every actor-targeted agent-hand template has an authored line in `ACTION_EFFECTS_PROSE`; no line carries a numeral or the cost suffix; the content-eval sweep reports the word cap
- [ ] After a cast, the toast reads the overview's first sentence (or the frame line), never `Your <name> <band>.`; the card wears the band word; clicking the toast opens the receipt modal as before; `__DEBUG.listPlayerReceipts()` shows `toastMessage`
- [ ] `detectionRisk` has no reader and no writer in `src/`; `ActionCard.test.tsx:178` is gone; the `computeDetection` verdict (live or not) is recorded on the ticket
- [ ] `playerCastBalance.test.ts` re-pointed at the truthfulness pin, with the before/after and the purpose stated in the closeout
- [ ] `divine-actions-reference` wiki page updated for the new face; `action-catalog` regenerated; interface-map rows updated; `npm run generate-interface-map` green
- [ ] Browser-verify per the UI pillar: 1920×1080 capture of the drawer with a selected card and a toast, console, `__DEBUG` assertion, the UI-Laws line citing 1, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 23, 25, 26, 27, 28, 33, 37, 47, 48
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI smoke; `npm run test:heavy` locally
- [ ] Closing commit body and PR body include `Fixes THR-1002`

## Kill criteria

- The nudge snapshot fails after the extraction → the primitive is wrong, not the snapshot; fix the primitive.
- Christian reads a fresh-god drawer and cannot tell a soul-verb from a working → the tier word is not doing its job; add the designer-legend line at first contact before touching thresholds.
- The toast's first sentence is an enrichment placeholder or a fragment on more than a handful of casts → fall back to the frame line for that template and file the overview's authoring as content work.
- Anyone proposes a flavour field on the template → Doctrine v2 § Retired by name; the answer is the codex page.

## Coordination block

**Suggested model:** opus — one primitive extraction with a snapshot pin, a card and drawer rewrite, three slot fields, a receipt toast, ~33 authored lines and a wiki page; wide, not deep.
**Parallel-safe with:** [THR-1134](https://linear.app/threadbare/issue/THR-1134) (incident snapshot — `SettingsPanel`, `GameViewTopBar`, engine leaf modules; disjoint), [THR-1287](https://linear.app/threadbare/issue/THR-1287) (control upkeep — strategic lifecycle; disjoint), [THR-1222](https://linear.app/threadbare/issue/THR-1222) (encounter content; disjoint).
**Mutex with:** any ticket editing `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` (the extraction touches it — none queued); [THR-1114](https://linear.app/threadbare/issue/THR-1114) if it is picked up (both touch `sphereAffinity` handling in the card's sphere mark — this plan's fail-soft row is the interim); the idle cloud session titled *Remove dead AgentWheel component* (no branch, no PR at handoff — if it lands first, `wheel.ts` edits rebase trivially).
**Files to touch:** `src/components/shared/CardFace.tsx` (new), `src/components/shared/index.ts`, `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` (`NudgeCard` becomes an adapter; DOM unchanged), `src/components/Game/ActionCard.tsx` (rewrite), `src/components/Game/ActionDrawer.tsx` (row, Cast button, deletions), `src/components/Game/GameView.tsx` (`resolvedBands`, Cast wiring), `src/components/StyleGuide/*` (sample), `src/data/action-card-display.ts` (new), `src/data/actionEffectsProse.ts` (overrides, suffix), `src/data/unified-action-templates.ts` (`:5463` overlay), `src/data/player-cast-constants.ts` (retire the hint constants), `src/data/receipt-content.ts` (`RECEIPT_TOAST_USES_OVERVIEW`), `src/data/tooltip-registry*` (new ids), `src/engine/playerCastReadout.ts` (`castForecastProbability`), `src/engine/targetActions.ts` (slot fields), `src/engine/wheel.ts` (`detectionRisk` out), `src/engine/playerReceipts.ts` (toast), `src/types/trace.ts` (one optional field), `src/debug-bridge.ts` + `.d.ts` (field pass-through), `Docs/design-system/primitives.md`, `public/wiki/divine-actions-reference.html`, `scripts/interface-contracts.ts`, tests: `NudgeCard.snapshot.test.tsx` (new, first), `ActionCard.test.tsx` (rewrite), `ActionDrawer.test.tsx` (rewrite the cast-line block), `playerCastReadout.test.ts` (`castForecastProbability`), `playerCastBalance.test.ts` (re-point), `playerReceipts.test.ts` (toast), `actionEffectsProse.test.ts` (predicates).

## Notes for the executor

- **Write the nudge snapshot first.** The extraction's only proof is that the nudge card's DOM did not change. If the snapshot moves, the primitive is wrong.
- **No prose on the face.** Not a flavour line, not a description, not sphere copy. Christian's 08-06 line is superseded by his 08-25 doctrine; the handoff says so and invites a veto — if the veto comes, the answer is a *doctrine* change, not a card field.
- **Pips on a cast are a Law 10 violation.** `OddsPips` means *effect on the odds*. A cast's odds zone is the tier word. Do not reach for the pips because they are on the other card.
- **`castForecastProbability` runs the resolver's arithmetic in the resolver's order** — `applyScaleDifficultyAdjust` then the floor — with `CARD_READOUT_SPHERE_FACTOR` and `CARD_READOUT_MODS`. If `resolveUncontestedStep` ever grows a real sphere factor, both move; that is why they are named.
- **`playerCastBalance.test.ts` is re-pointed, not deleted.** Its purpose was *the card's word is not decorative*; the new invariant is *the card's word equals the roll's tier*. State both in the closeout with the numbers.
- **The toast's sentence is the overview's first sentence, enriched.** Split on the first `. ` after a real sentence; if the overview is one sentence, use it whole. Never the template name alone.
- **The verb map is build-enforced.** `ACTION_CARD_KEYWORD_ICONS: Record<CrudType, string>` — a new verb without a glyph is a type error (Law 9), the `NUDGE_CARD_TYPE_ICONS` shape.
- **`computeDetection` decides the fate of the eight values.** Grep for production callers; delete the values only if there are none; record the verdict either way.
- **Tooltips come from the registry by id** (Law 17). Register `ui.card.verb.*`, `ui.card.scale.*`, `ui.card.upkeep.*`, `ui.forecast.*`; never inline copy on the face.
- **Two words on the surface have no UL headword yet** — *cast* in the verb sense (the Cast button) and *Forecast tier* (the odds word). Filed as [THR-1445](https://linear.app/threadbare/issue/THR-1445); use the engine's existing sense (THR-728: *casts roll the ladder*) and do not invent a third word while the proposal is open.
- **Emoji on the layer tabs go** in the same change (taste profile anti-pattern; the registry has icons).
- **Two wiki gates fire:** `divine-actions-reference` (`targetActions.ts` is in its sources) and `action-catalog` (regenerate). The nudge page is not touched because the nudge card is not.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-09): Allow** — impact class Reversible confirmed; nine dimensions PASS, two GAPs, zero VIOLATIONs. GAP 9 (the Blast Radius sentence claimed no ≥100-importer file was edited while `src/data/unified-action-templates.ts` at 141 was in Files to touch) — resolved: the section is now a two-row table naming that file and `src/types/trace.ts` (120) with their change shapes. GAP 6 (*Cast* on a player control while the UL's only `Cast` headword is the encounter noun; *Forecast tier* has no headword) — resolved by filing [THR-1445](https://linear.app/threadbare/issue/THR-1445) (UL-proposal: cast (verb); Forecast tier) and naming it in the proposal and the executor notes. The judge confirmed the flavour-line override is grounded in the later doctrine (`Docs/canon/prose.md:185`, `unifiedAction.ts:1509`) and asked that the veto invitation be carried into the handoff verbatim — it is. One observation the executor should know: the repo-root vault mirror `TheFantasyWorldSimulator/Vision/taste-profile.md` is stale against the live vault (it lacks the 2026-08-25 reconciliation note); cite the live vault.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-09 (sonnet, three auditors spawned in one message, on the post-judge revision).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 10 new named constants in `action-card-display.ts`, plus the reused table (`FORECAST_TIER_*_MAX`, `MIN_PROBABILITY_BY_SCALE`) — no bare magic numbers introduced |
| 2. Inspectability | PASS | Wiring table maps every module to phase/UI/GameState/trace/debug; `__DEBUG.listActions()` and `.listPlayerReceipts()` extended; `toastOverviewUsed` registered (not duck-typed); the designer view exposes the numerals |
| 3. Determinism | PASS | "No draw; the tier is arithmetic" — `castForecastProbability` reuses the resolver's own formula |
| 4. Fail-soft | PASS | 10-row table: absent capability → no odds zone ("never a guessed word"); non-finite inputs → scale floor; missing `crudType`/sphere/art/codex page degrade rather than throw |
| 5. Narrative over mechanical | PASS | The toast carries the resolver's `overview` instead of `Your ${name} ${band}.`; the measured baseline (28/30 reachable cards hit the bare-name toast) is the defect being fixed |
| 6. Additive over destructive | PASS-with-note | Focused frame, fan, Effect block, sphere prose, cast line and `detectionRisk` are removed — each a directive-named defect or dead code; the nudge card is extracted verbatim behind a pre-extraction DOM snapshot |
| 7. Performance budget | PASS | One `classifyForecastTier` per slot at build time; the row replaces per-card transform math |

**NFP AUDIT: PASS-with-notes** (row 6).

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | all five subsections filled; explicit "None" where no change applies |
| Content | present-and-substantive | all four subsections; Attachment content N/A with rationale |
| UI | present-and-substantive | all four subsections; Visual presence N/A; screenshot tool declared (Playwright) |

No missing required sections; the coordination block carries all four fields. Wiring table (8 rows) connects each module to phase, component, field, trace and debug. Substrate check: PASS — `playerCastReadout.ts` and `targetActions.ts` confirmed live in the inventory; the skipped overlay is flagged for activation, not reimplementation; no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → the intervention feels consequential — confirmed (the toast carries the overview). `01-core-loop.md` → the aftermath is a breath, not an interruption — confirmed (modal gate untouched). `02-non-negotiables.md` → #3 prose never numbers — extended (four numeral leaks close); #1 god not protagonist — silent (control model unchanged). `03-design-tensions.md` → #4 legibility vs mystery — confirmed and correctly resolved (the forecast tier is a word). `taste-profile.md` → prose-first UI, the reconciled *Encounter-specific intervention verbs* entry (card faces generic, scene prose bespoke), austere/no-emoji — all confirmed. `design-brief.md` principle 5 — confirmed. No contradictions. The flavour-line override cites doctrine outside the six Vision files (`Docs/canon/prose.md`) and is contradicted by nothing in them. **VISION AUDIT: PASS.**
