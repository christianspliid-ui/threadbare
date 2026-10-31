> **title:** Spirit, life and entropy get a cheap place card, and doom's tide stops erasing a life god — THR-2090, slice 2
> **linear_issue:** THR-2090
> **author:** Claude Code (design lane, run 2026-10-31a, unattended)
> **created:** 2026-10-31
> **three_pillars:** Engine done (three card templates on `update_node`, one re-price, one ledger predicate) · Content done (three cards' words, effect prose, technical lines, art) · UI done (no new surface; the cards render in the existing drawer and market)

# Spirit, life and entropy get a cheap place card, and doom's tide stops erasing a life god — THR-2090, slice 2

*A Gather god can tend a sick town, a Haunt god can keep a vigil for a town's dead, a Sever or Consume god can let the damp into its walls. And the doom clock's slow tide no longer wipes a life god's work off its Mandate everywhere at once.*

## Why this is load-bearing

[Slice 1](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-30-thr-2089-cheap-place-cards.md) decided that every sphere a Hunger can name gets a tier-1 market card that targets a settlement and costs 2 essence. It covered force, matter and time. This slice covers the rest. Spirit, life and entropy each have a place card today, but none is tier 1 at 2 essence. Some are gifts (`loc.bless_harvest`, `loc.blight`, 4 essence). Some are tier 2 (`loc.sanctify_square`, spirit, 5 essence; `loc.sicken_wells`, entropy, 6 essence, health −25 and unrest +15). One is temple-gated (`action.consecrate`). Energy's `loc.stoke_forges` is a market card at 3, which the slice-1 check also flags.

Slice 1 also found that **a cheap life card alone does not rescue Gather**: the doom clock takes the life god's work back. This plan measures why and decides it.

**Measured** on [`proto/thr-2090-doom-wears-life`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2090-doom-wears-life) (branched from slice 1's census branch; never merged). The census is `scripts/_scratch-2089-census.ts`, bundled with esbuild, on seeded medium 42 with a scripted all-in god and a synthetic 2-essence place card per sphere (`SYNTH=1`). Two proto switches sit in `phaseDoom.ts`: `NOSTAGE=1` drops doom's per-stage entropy push; `STAGEFREE=1` keeps the push but tags it so the Mandate ledger does not count it as opposition. Raw output: `scripts/_scratch-2090-results/`.

| Arm (doom 0.75, targets 87 / 23, half = 43.5) | ledger P / S |
|---|---|
| gather (life / spirit), today's rules | **1.2** / 118.2 (life: 25 at t150, 4 at t300) |
| gather, no stage push | 38.2 / 128.2 |
| gather, stage push lands but is not counted | **30.2** / 118.2 |
| haunt (spirit / entropy), today's rules (slice-1 run) | 57.2 / 107.2 |
| haunt, no stage push | 56.2 / 97.2 |
| kindle (energy / life), today's rules | 55.2 / **2.2** (life: 33 at t150, 11.2 at t300) |
| kindle, stage push lands but is not counted | 55.2 / **62.7** |
| sever (entropy / mind), today's rules | 49.2 / 90.2 |
| consume (entropy / force), today's rules | 50.9 / 136.2 |

**What doom does** (`src/engine/phaseDoom.ts:417-426`, `main` @ 87b5295d): at each stage crossing it pushes `entropy`, magnitude `DOOM_PRESSURE_PER_TIER` (4), `source: 'doom'`, `sourceId: doom-tier-<n>`, onto **every** location. This happens whatever the doom's archetype. The archetype's own stage cards push their own spheres (`doomClock.ts`: force, chaos, spirit, mind…). The ledger (`mandateLedger.ts:90-95`) debits an eroded sphere by the share of opposite-sphere pressure from `OPPOSITION_SOURCES` (`rival`, `doom`). Entropy's opposite is life (`cosmology.ts:73`). So on every world, the flat push takes back exactly one sphere: life, Gather's first and Kindle's second. No other sphere has a push like that: spirit moves 1 point without the push, and both entropy-first gods (Sever, Consume) clear half with doom's entropy diluting their share.

## Decisions (design lane, 2026-10-31, by delegation; veto in chat)

1. **Doom's stage tide lands on the world but no longer takes back the god's Mandate.** The per-stage entropy push keeps landing on every location, so the world still darkens as doom climbs. The Mandate ledger stops counting it as opposition. Doom's archetype stage cards and rivals still take back what the god built, under [THR-2081 Decision 3](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md). *Why:* the flat push is the one doom write that is identical on every world and hits one sphere regardless of archetype. It leaves Gather at 1.2 of 87 and Kindle's life at 2.2 of 23, while every other measured sphere reaches 30–136. THR-2081 rejected that kind of cross-Hunger spread when it took full wear out (Decision 3) and fixed one unit for every world (Decision 4). Not counting the push lifts Gather to 30.2 and Kindle's life to 62.7. Gather then sits in the same band as slice 1's Reshape, Preserve and Bind (26–31, tracked by [THR-2094](https://linear.app/threadbare/issue/THR-2094)). *Veto:* "doom should wear a life god down everywhere: life against the clock is the point".
2. **Three cards, one per sphere, in opposed pairs where the cosmology pairs them.** *Tend the Sick* (life) raises a town's health. *Let the Damp In* (entropy) lowers it: life ↔ entropy is the cosmology's pair, and the two cards pull the same rope. *Keep the Vigil* (spirit) eases a town's unrest. That mirrors energy's *Stoke the Forges*, which heats it (energy ↔ spirit). *Veto:* "entropy should rot the stores, not the people", which would point Let the Damp In at `foodStore`.
3. **Stoke the Forges drops from 3 to 2 essence.** Slice 1's Decision 1 says every Hunger sphere's cheap card costs 2, and its check flags energy at 3. One number; the card's unrest already makes it cost (Law 36). *Veto:* "keep Stoke at 3".

Rejected, one line each ([brainstorm](2026-10-31-thr-2090-spirit-life-entropy-place-cards-brainstorm.md)): dropping the stage push (changes doom for everyone, to fix a ledger question); pushing the archetype's sphere instead of entropy (moves the hole to whichever Hunger opposes that world's doom); a bigger life delta (the push erases any amount); reserving the fork (the evidence decides it, below).

**Why this is not reserved for Christian.** The question is whether doom's tide should erase a life god's Mandate, and two agreed decisions already answer it: THR-2081 Decisions 3 and 4 (a raid on the god's ground is the contest; one unit for every Hunger). The tide is not a raid on anyone's ground. Doom still darkens the world, still harvests at its end (Law 32), and its archetype cards still contest the god. The veto line is above.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Card catalog `UNIFIED_ACTION_TEMPLATES` + `CardProgression` | 🟢 ACTIVE | **extends**: three rows; Stoke's price |
| Existing health cards: `loc.bless_harvest` (gift, +15), `loc.blight` (gift, −12), `loc.sicken_wells` (tier-2 market, 6 essence, −25 health, +15 unrest) | 🟢 ACTIVE | **reads**: Tend and Damp are the tier-1, 2-essence, small-delta cards on the same property. Damp is Sicken the Wells' cheap, slow form; the Wells stays the fast, loud one a god grows into |
| `populationHealth` → prosperity dampener (`phaseProsperity.ts:481-487`), unrest bleed (`phaseUnrest.ts:81-84`), sickness term (`unrestPressure/inputs.ts:77`), recovery to `LOC_HEALTH_DEFAULT_BASELINE` 80 (`phaseProsperity.ts:734-760`) | 🟢 ACTIVE | **reads** |
| `unrest`, clamped 0–100 each tick (`phaseUnrest.ts:103`), the unrest ladder | 🟢 ACTIVE | **reads** |
| Mandate ledger `mandateCreditsFor` (`mandateLedger.ts`) | 🟢 ACTIVE | **extends**: one predicate |
| Doom stage push (`phaseDoom.ts:417`) | 🟢 ACTIVE | **extends**: its `sourceId` prefix becomes a named constant |
| Progression check `hole: no cheap <sphere> place card` (slice 1, PR #2656) | 🟡 IN REVIEW | **reads**: silent for all spheres after this |

## Pre-flight (action-catalog-design skill)

| Verb | Substrate | Exists? | Mortal-loop bridge |
|---|---|---|---|
| Tend the Sick | `update_node populationHealth +` | the op and the property (Bless the Harvest writes it) | a sick town (under 40) stops bleeding unrest and its prosperity stops dampening |
| Let the Damp In | `update_node populationHealth −` | same (Blight writes it) | worn below 40, the town's unrest climbs on sickness; below 50 its prosperity dampens |
| Keep the Vigil | `update_node unrest −` | same (Open the Markets writes it) | a restless town steps down the unrest ladder, so fewer riots and risings |

No new substrate. All three are global `UnifiedActionTemplate`s in the drawer and market, fired at a focused town. None is a nudge card.

## Engine pillar

Three rows in `src/data/unified-action-templates.ts`, after slice 1's `loc.keep_stores`, copying its shape: `progression: { tier: 1, offer: 'market', generic: false }`, `crudType: 'update'`, `scale: 'local'`, `apCost: 1`, `essenceCost: 2`, `actorAffinities: ['ascendant']`, `targetCategories: ['location']`, `targetSubtypes: ['settlement', 'hamlet', 'town', 'city', 'capital']`, one step with `duration { min: 1, max: 2 }`, `failBehavior: 'fail_action'`, `onFailure: []`. `pricedIn` stays unset.

| id | `sphereAffinity` | `reach` | difficulty | `onSuccess` | `motivations` |
|---|---|---|---|---|---|
| `loc.tend_sick` | life | `heart` | 0.20 | `update_node $target { populationHealth: +LOC_TEND_SICK_HEALTH_DELTA }` | `mercy_ruthlessness`, `preservation_transformation` |
| `loc.let_damp_in` | entropy | `shadow` | 0.25 | `update_node $target { populationHealth: -LOC_LET_DAMP_IN_HEALTH_DELTA }` | `mercy_ruthlessness`, `preservation_transformation` |
| `loc.keep_vigil` | spirit | `heart` | 0.20 | `update_node $target { unrest: -LOC_KEEP_VIGIL_UNREST_DELTA }` | `tradition_novelty`, `mercy_ruthlessness` |

`heart` and `shadow` are in use (50 and 37 rows). Write the deltas as `` `+${…}` `` / `` `-${…}` `` strings, as `loc.blight` does.

- `loc.stoke_forges.essenceCost`: 3 → 2.
- `src/types/sphereAffinity.ts`: `DOOM_STAGE_PUSH_SOURCE_PREFIX = 'doom-tier-'` beside `DOOM_PRESSURE_PER_TIER`. `phaseDoom.ts:424` builds its `sourceId` from it.
- `src/engine/mandateLedger.ts`: `isMandateOpposition(p)` = `OPPOSITION_SOURCES.has(p.source) && !(MANDATE_DOOM_STAGE_PUSH_EXEMPT && p.source === 'doom' && p.sourceId?.startsWith(DOOM_STAGE_PUSH_SOURCE_PREFIX))`. It replaces the bare `OPPOSITION_SOURCES.has` in the `oppShare` numerator (`:93`). The denominator (all magnitude in the opposite sphere) is unchanged, which is what the measured arm did.
- `scripts/mandate-census.ts`: none. The legal-target filter and met-half stop land with slice 1.

Graph nodes, edges, tick phases: none new. PRNG: the step roll only.

## Content pillar

| File | Row |
|---|---|
| `unified-action-templates.ts` | names, spell names, descriptions, narrative templates (below) |
| `location-action-constants.ts` | the three deltas, beside `LOC_BLIGHT_*` |
| `action-technical-effects.ts` | Tend: "Adds LOC_TEND_SICK_HEALTH_DELTA to `populationHealth`; health above LOC_HEALTH_DEFAULT_BASELINE eases back 1 a tick. Pushes life pressure." · Damp: "Subtracts LOC_LET_DAMP_IN_HEALTH_DELTA from `populationHealth`; under SICK_HEALTH_LINE the town's unrest gains the sickness term. Pushes entropy pressure." · Vigil: "Subtracts LOC_KEEP_VIGIL_UNREST_DELTA from `unrest` (clamped at 0 on the next unrest tick). Pushes spirit pressure." |
| `actionEffectsProse.ts` | one line each (§ Player-facing text) |
| `ascendant-beat-content.ts` | a `{ bucket: 'unlockable-generic' }` row each, if `ascendantPoolBeatTemplates.test.ts` requires it |
| `src/components/Game/actionArt.ts` + `public/assets/actions/` | three images by the action-card art recipe, fantasy-period: a healer's hand on a fevered brow by rushlight; black mould creeping up a whitewashed wall; a row of lamps lit on graves at dusk |

**Words** (game register; [prose canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/prose.md)):

- **Tend the Sick** · *The Fever Breaks*: "Walks unseen through a town's sickrooms. Fevers break, wounds close clean, and the coughing in the lower streets goes quiet. A healthy town has little to gain from it." Initiation: "passes down the street where the sick are kept". Success: "by morning the fevers have broken, and the healers take the credit". Failure: "the fever holds; the sick turn in their beds as before".
- **Let the Damp In** · *The Cough in the Walls*: "Lets the damp into a town's walls and wells. Nothing falls at once. The children cough, the old take to their beds, and a town worn thin enough grows restless with its sickness." Initiation: "breathes along the town's wet stones". Success: "black mould blooms on the whitewash, and the first cough starts in the lower streets". Failure: "the walls dry in the wind; the damp does not take".
- **Keep the Vigil** · *Lamps for the Dead*: "Lights the lamps on a town's graves and lets the living mourn properly. Old grievances lose their edge, and the streets are quieter for a while." Initiation: "kneels among the town's graves at dusk". Success: "a lamp burns on every grave by nightfall, and the streets are quiet". Failure: "the lamps gutter out; the dead stay unmourned".

## UI pillar

No new component or screen. The cards render in the existing ActionDrawer, market offers and card faces, with sphere tint and price read from the template.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Card face, drawer and market | "Tend the Sick", *The Fever Breaks*, life tint, 2 · "Let the Damp In", *The Cough in the Walls*, entropy tint, 2 · "Keep the Vigil", *Lamps for the Dead*, spirit tint, 2 | PC-1 (what a card does) | each names its effect on a town |
| Effect lines side by side | Bless (gift, 4), today: "Swells a settlement's harvest and stores toward plenty, and its best fields yield more for a season." beside Tend: "Heals a town's sick: a sickly town grows well again, and its unrest stops climbing on sickness." | PC-6 (two cards that read alike) | Bless also lifts health, but its words lead with the harvest; Tend is only about the sick. A player reads Bless as the good-year card and Tend as the healer |
| Effect lines side by side | Blight (gift, 4), today: "Turns a settlement's harvest against itself: its stores sink toward famine, and its best fields yield little for a season." beside Damp: "Sickens a town slowly: worn thin enough, it grows restless with its sickness." | PC-6 | Blight also lowers health, but its words lead with the harvest; Damp is only the slow sickness |
| Effect lines side by side | Sicken the Wells (tier 2, 6), today: "Sickens a settlement's wells for a time; its people weaken and grow restless." beside Damp | PC-6 | Same harm, different speed: the Wells strikes at once and stirs the streets ("for a time"); the Damp takes several casts ("slowly", "worn thin enough"). The price, 6 against 2, says the same |
| Effect lines side by side | Open the Markets (gift, 3), today: "Draws trade through a settlement's square, lifting its prosperity and easing its unrest." beside Vigil: "Lets a town mourn its dead: its unrest eases." | PC-6 | Both calm a town. Markets leads with trade and prosperity and arrives as a gift; Vigil is only the mourning, a 2-essence market card in spirit's tint. The player reads Markets as the trade card that also calms, and Vigil as the calming card |
| Effect line (`actionEffectsProse.ts`) | Tend: "Heals a town's sick: a sickly town grows well again, and its unrest stops climbing on sickness." · Damp: "Sickens a town slowly: worn thin enough, it grows restless with its sickness." · Vigil: "Lets a town mourn its dead: its unrest eases." · Stoke, unchanged, now at 2 essence: "Stokes a town's forges and hearths: its prosperity rises, and so does its unrest." | PC-1 | same shape as Open the Markets' and Stoke's lines |
| Cast receipt | the template's success line through the existing overview path, e.g. "a lamp burns on every grave by nightfall, and the streets are quiet" | PC-8 (the act answers) | the receipt says the working took; the town's mood (the unrest ladder) shows the result |
| Tend the Sick on a healthy town | the success line; health above 80 eases back | PC-8 | known limit, accepted: the description says "a healthy town has little to gain" |

**Event notifications:** none new. **Debug inspection:** trace viewer (`sphere_pressure`, `mandate_ledger_credit`); `populationHealth` / `unrest` in the CLI and the economy debug tab's sickness column. **Visual presence:** the three card faces only.

UI Laws engaged: 13 / 14 (each card names its effect), 17 (the existing forecast word before the spend), 21 (Tend / Bless, Damp / Blight / Sicken the Wells and Vigil / Open the Markets each name different ground or speed), 33 (tint from the template), 37 (no new chrome), 45 (Tend names its limit). **Browser-verify:** a small visible change. One 1920×1080 Playwright screenshot of the drawer on `?view=game&seeded&size=medium` with a Gather identity, showing Tend the Sick and Keep the Vigil, using the debug lever that seats a card in the hand if the market has not offered one (`src/debug-bridge.d.ts`).

### Playtest signal

In a warm round played as Gather, Haunt, Sever or Consume, the trace export shows the god casting one of the three unprompted, and the tester's log says in their own words what it did to the town.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| three templates, Stoke price | resolution (existing) | ActionDrawer, market | none new | `sphere_pressure`, `mandate_ledger_credit` (existing) | trace viewer; `check:god-card-progression` |
| ledger predicate | `sphere_pressure` → `mandate` (existing) | none | none | `mandate_ledger_credit` (existing; the stage push no longer yields an opposition debit) | `npm run census:mandate` |

Wiki: the Design Reference Wiki page whose `sources` include `unified-action-templates.ts`, and the one whose sources include `mandateLedger.ts` if any (`check:wiki-freshness:blocking` names them). Systemic wiring guide: no new capability.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Card resolution → sphere pressure → Mandate ledger | preserve | three more producers |
| Doom stage push → sphere pressure → world scores | preserve | the push lands as today |
| Doom pressure → Mandate ledger opposition | **extend** (narrowed) | the stage push is no longer opposition; archetype cards and rivals still are. Update the doom → Mandate row in `Docs/canon/interface-map.md` and its entry in `scripts/interface-contracts.ts` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LOC_TEND_SICK_HEALTH_DELTA` | 10 | health a Tend cast adds; a sick town (under 40) needs a few casts, or one cast and a few ticks' recovery |
| `LOC_LET_DAMP_IN_HEALTH_DELTA` | 8 | health a Damp cast removes; from the 80 baseline, five casts against +1 a tick of recovery bring a town under 40 |
| `LOC_KEEP_VIGIL_UNREST_DELTA` | 4 | unrest a Vigil cast removes; a quarter of Incite Unrest's, and under Open the Markets' 10 (a 3-essence gift) |
| `DOOM_STAGE_PUSH_SOURCE_PREFIX` | `'doom-tier-'` | names doom's flat per-stage push so the ledger can tell it from the archetype's cards |
| `MANDATE_DOOM_STAGE_PUSH_EXEMPT` | `true` | Decision 1's switch; `false` restores today's ledger byte for byte (in `mandateLedger.ts`) |

## Tracing

N/A — no new trace type. A tide-only erosion now emits no `mandate_ledger_credit` debit. The `sphere_pressure` trace still shows the push (`source: 'doom'`, `sourceId: doom-tier-<n>`).

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `populationHealth` / `unrest` absent on the node | `update_node` counts a non-number as 0 (`graphOpExecutor.ts:549`). Health then recovers toward 80 from below; unrest is clamped next tick |
| health driven below 0 by repeated Damp | readers compare against thresholds (40, 50), so any value below reads as sick. Blight already writes unbounded negatives. Recovery climbs back 1 a tick |
| a pressure with no `sourceId` | the predicate treats it as not-the-tide, so it stays opposition as today |
| `getActionArt` has no image | the existing no-art frame |
| a pre-build save | no new state; the cards appear in later market offers |

## Blast Radius

`src/data/unified-action-templates.ts` (283 importers): three rows and one number. `src/types/sphereAffinity.ts`: one exported constant, additive. Every test that iterates the catalogue must accept the new rows; fix a count by updating it, never by excluding the cards. Run `npm test` in full.

## Done when

- [ ] `npm run check:god-card-progression` prints no `hole: no cheap <sphere> place card` for any sphere.
- [ ] `npm run census:mandate -- sweep seeded gather` shows life at or above a quarter of its target (21.75) at doom 0.75. Between a quarter and half, the number goes in the status fragment beside [THR-2094](https://linear.app/threadbare/issue/THR-2094)'s (§ Kill criteria). Lane measurement with a synthetic card: 30.2. `… kindle` shows life at or above half of 23 (lane: 62.7). `… haunt`, `… sever`, `… consume` record their first sphere the same way.
- [ ] A test (`mandateLedger.test.ts`): an eroded life score whose only opposite push is a `doom-tier-1` entropy push yields no debit; the same with an archetype doom card (`source: 'doom'`, another `sourceId`) or a `rival` push still debits; with `MANDATE_DOOM_STAGE_PUSH_EXEMPT` false, the tide debits as today.
- [ ] A test (`src/data/__tests__/cheapPlaceCards.test.ts`, extending slice 1's): each new card, resolved as the ascendant on a town fixture, changes `populationHealth` / `unrest` as specified and pushes its sphere on the town.
- [ ] `actionEffectsProse.test.ts` and `ascendantPoolBeatTemplates.test.ts` pass. One 1920×1080 screenshot as above. `npm run gate` green.

## Kill criteria

- Gather's life still under a quarter of target at doom 0.75 with the cards and the exemption: the tide is not the only limit. File against the Mandate's targets beside THR-2094, do not refit here.
- A playtest shows Let the Damp In used to drive a rival's town into permanent sickness as a dominant loop: lower its delta; the design stands.

## Not in this plan

- The quarter-to-half plateau that slice 1 found and Gather now shares: [THR-2094](https://linear.app/threadbare/issue/THR-2094). The census shows the god's life essence near zero from t150 on, so supply, not the tide, is the remaining limit.
- Hex-targeted cards ([THR-2087](https://linear.app/threadbare/issue/THR-2087)).

## Three-pillar check

- [x] Engine: three templates, one re-price, one predicate, constants named
- [x] Content: words, technical lines, effect prose, art
- [x] UI: no new surface (rationale above); browser-verify named
- [x] Wiring: table above; interface-map row updated

## Vision audit

- [x] Law 38 now true for every Hunger sphere. Law 36: each costs 2 and has a cost in the world (Damp sickens, Stoke frays). Law 32: doom still ends the age and harvests; only its tide stops writing on the Mandate. Law 41: no new effect. Law 45: Tend names its limit.
- [x] No Vision edit needed.

## Rulebook impact

- [x] `Docs/canon/rulebook.md:413` ("a rival or doom wearing that ground down takes it back") becomes "a rival or doom's own works wearing that ground down takes it back; the tide doom raises over the whole world as it climbs does not" with `[IMPL — THR-2090]`. The executor makes the edit.
- [x] `Docs/canon/rulebook-quick-reference.md`: none. Line 136 does not state the erosion rule.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | five named constants, one a switch |
| 2. Inspectability | PASS | the push still traces; the ledger's debits trace |
| 3. Determinism | PASS | no new draw |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | each sphere's own fiction: healing, damp, mourning |
| 6. Additive | PASS | rows, one predicate behind a switch; one price lowered |
| 7. Performance | PASS | a string prefix check per push in an existing loop |

## Coordination block

**Blocked by:** [THR-2089](https://linear.app/threadbare/issue/THR-2089) (slice 1, PR #2656 under review). Same tables, and this slice extends its test file and check.
**Suggested model:** sonnet. Data rows on an existing op, one predicate, tests.
**Parallel-safe with:** [THR-2087](https://linear.app/threadbare/issue/THR-2087) (hex bridge, not card rows or the ledger).
**Mutex with:** rows near `loc.keep_stores` / `loc.stoke_forges` in `unified-action-templates.ts`, `location-action-constants.ts`, `action-technical-effects.ts`, `actionEffectsProse.ts`, `ascendant-beat-content.ts`, `actionArt.ts` (shared tables), and `mandateLedger.ts` (anything touching the ledger's opposition rule, including [THR-2094](https://linear.app/threadbare/issue/THR-2094) if it lands there).

**Files to touch:** `src/data/unified-action-templates.ts`, `src/data/location-action-constants.ts`, `src/data/action-technical-effects.ts`, `src/data/actionEffectsProse.ts`, `src/data/ascendant-beat-content.ts` (if required), `src/types/sphereAffinity.ts`, `src/engine/phaseDoom.ts` (one line), `src/engine/mandateLedger.ts` (and its header comment at `:7`), its test, `src/types/mandate.ts:144` (the "net of rival and doom wear" comment gains "not doom's tide"), `src/data/__tests__/cheapPlaceCards.test.ts`, `src/components/Game/actionArt.ts`, `public/assets/actions/` (three images), `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`, the wiki page the freshness gate names.

## Notes for the executor

- Copy slice 1's `loc.keep_stores` as the starting shape. Do not set `pricedIn`.
- The proto switches in `phaseDoom.ts` on the proto branch are measurement only. Do not port them; the shipped rule is the ledger predicate.

## Intent-judge verdicts

**Run 1 (2026-10-31, opus, cold): Revise** (Reversible confirmed; the erosion decision judged "sound, measured and within the delegation"). Three findings, all fixed:
- the survey and substrate inventory left out `loc.sicken_wells` (tier-2 entropy health card);
- the PC-6 rows claimed Bless and Blight only work the harvest, when both also write health, and did not quote their lines;
- Stoke's line was not quoted.

The plan now names Sicken the Wells and places Damp as its cheap, slow form. It quotes all four existing effect lines, and adds a Damp-vs-Wells row.

**Run 2: Revise.** It confirmed all three run-1 fixes, with the quotes matched against `actionEffectsProse.ts`. One gap remained: no PC-6 row for Keep the Vigil beside Open the Markets, which also eases unrest. Fixed: a row with both lines quoted, and the Law 21 note extended. The judge's optional note was also taken: the two "net of rival and doom wear" comments (`mandate.ts:144`, `mandateLedger.ts:7`) are added to Files to touch.

**Run 3: Allow** (Reversible confirmed). All twelve dimensions pass, and every quoted effect line matches `actionEffectsProse.ts`. Two non-blocking notes: the Stoke re-price is a justified small extension of THR-2089 Decision 1, and 🟡 IN REVIEW is not an inventory badge.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-31*

### NFP audit

**NFP AUDIT: PASS-with-notes.** NFPs 1, 3, 4, 5 and 7 pass: five named constants including the switch, no new draw, a fail-soft table covering absent properties, negative health, a missing `sourceId`, missing art and old saves, and a prefix check in an existing loop. **2 (note):** the push still traces, but the ledger's exemption emits nothing of its own. **6 (note):** the switch makes the ledger change reversible, but it changes the doom-to-Mandate rule on every world and lowers Stoke's price. *Lane response:* accepted. Both are named decisions with veto lines. The exemption is inspectable as the absence of a debit beside a traced `doom-tier-<n>` push. The auditor judged wiring from the plan's table, because `wiring-checklist.md` exceeds its read limit.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine, Content and UI are present and substantive (UI: no new surface, with rationale, PC classes, a playtest predicate and a named screenshot). No required section is missing. The wiring table covers both modules, and the Interface impact table maps the contract change. Substrate check: the inventory leads the plan, and nothing duplicates `systems-inventory.md`. The doom clock, Mandate ledger, unrest and god progression are all extended or read. Note: 🟡 IN REVIEW for slice 1's check is not an inventory badge, but it is acknowledged existing work.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. Non-negotiables confirmed: #1 (the cards act on towns, never on mortals), #3 (prose effect lines, numbers debug-only), #2, #6 and #7. Core loop preserved, and the doom exemption keeps the stage halt and the harvest. **Note:** a mild lean toward systemic emergence over authorship, and essence-cost legibility is pulled on lightly (a flat 2). *Lane response:* accepted. The plan names the "doom should wear a life god down" veto, and the flat 2 is slice 1's agreed price.
