# Encounter Pipeline: The Gallows Pardon
> Scale: medium | Slug: gallows-pardon | Pass: systems (cold critic)
> Date: 2026-10-15 | Pipeline version: 2.0
> Audited: `gallows-pardon.package.json` after the editorial fixes, against `gallows-pardon-revised.md`

## Verdict: READY WITH CAVEATS

One blocking defect was found and fixed: the story_seed could never fire (§ 4). After the retarget every id resolves, every chip is backed on every route into its band, and the gate is green. The caveats are the ordinary placeless-seed one (§ 4) and a recurrence note on the mother (§ 1). Neither needs a pre-task.

## Brief conformance (row 3)

| Field | Brief | Package | ✓ |
|---|---|---|---|
| id | `encounter.town.gallows_pardon` | same | ✓ |
| reach | heart | heart; both steps heart | ✓ |
| difficulties | 0.76 → 0.80 (inside 0.72–0.85) | 0.76 → 0.80 | ✓ |
| mean / window fit | 0.78 / 0.92 | 0.78 / 0.92 | ✓ |
| shape | seeded sequel | step 0 `continue_weakened`, step 1 `fail_action`; `encounter_seed` on step 1 both sides | ✓ |
| settings | `urban` | `["urban"]`, one opening | ✓ |
| rarity / scale / tier | 2 / local / shaping | `rarityTier: 2`, `scale: "local"`, `intrinsicTier: "shaping"` | ✓ |
| family | `encounter.town.*`, no new tag | no `tags` authored | ✓ |
| relationship | `bond_change` with the justice, the mother or the youth | `$cast:mother` (step 0 failure; step 1 both sides), `$cast:justice` (step 1 success, reaction) | ✓ |
| story_seed | `encounter_seed` by `query` on a family tag that exists | `#fellowship_errand` (5 members; was `#tavern_night`, which exists but cannot fire, § 4) | ✓ after fix |
| s@c carries something | condition, debt, enemy | the justice's grudge, −0.08 on every success band | ✓ |
| cool failure | no kill / jail / brand; the name before the purse; the hanging stated plainly | failure overview names the master's lost name; hanging is one plain clause | ✓ |
| tone | ends warm on success | "The youth lives, and the rope at the crossroads hangs empty." | ✓ |
| no rule gate | | none | ✓ |
| no Heavy Hand, rider, grant, over-exposed special | `card.mercy.core` at most once (slot 3) | none authored; the trait card is `card.trait_card.core` | ✓ |
| card names | imperative lexicon | Soften, Slow, Press, Find: all in `IMPERATIVE_VERB_LEXICON` | ✓ |
| image tags | `generic.*` | warmth, memory, focus, mercy: all rows in `encounter-image-library.ts` | ✓ |
| opening + step-0 spine | ≤80 words | 72 | ✓ |

## 1. Support Bundle Honesty

| Object | Delivery | Resolves | Note |
|---|---|---|---|
| `mother` | lazy-materialize, spawn `weaver` "Agnes Thorne", no reuse | `weaver` at `src/types/npc.ts:65` | honest. Always spawned, so "his mother" is true. **Caveat:** `must-persist` plus a `supportRole` match (`encounterSupportBundle.ts` finds `encounterSupportRole === spec.supportRole` first), so a second run in the same town reuses Agnes, and she would have a second son to hang. Rarity 2 at the master band makes this rare. Not fixed (delivery-mode change, out of scope) |
| `justice` | lazy-materialize, reuse `noble` / `steward`, spawn `noble` "Sir Walter Greve" | `noble` `npc.ts:45`, `steward` `npc.ts:59`; `noble` spawned by `debt-arbitration.ts:484`, `hostage-exchange.ts:354` | honest. A reuse can bind any noble or steward, so the prose now carries no pronoun for the justice (editorial fix 6) |
| `$here` | the encounter location | standard sentinel | standing edge |
| the youth | role noun, no node | — | deliberate: a hanged cast agent would persist |

## 2. Missing Primitives

None. Everything used is live: `bond_change`, `reputation_with`, `encounter_seed` + `query` (`ContentQuery`), `carryoverFactorLines`, `traitVariants.addNudgeIds`, a `requiredTrait` nudge, `deal`.

## 3. Runtime Feasibility

- Two steps, linear. A step-0 critical failure is terminal under `continue_weakened` (`terminalActionOutcome`), so crit-fail has two routes. Both pages are now true (editorial fix 3).
- s@c routes: `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts:367`) maps any continued step failure, any s@c step and any near-miss step to `success_at_cost`. A step-1 near-miss pays as a success (`mapStepOutcomeToRewardOutcome`, `unifiedActionResolution.ts:1572`), so the success-side chips are backed on that route too.
- Band reactions: `band.reactions ?? variant.reactions` (`src/types/unifiedAction.ts:2340`). The three success bands author none and inherit the fallback pair. The failure and crit-fail bands author their own pair. Editorial fixes 1–2 made every overview agree with the reactions it sits over.

## 4. Aftermath Supportability

### The seed, as drafted, could never fire (fixed)

The draft seeded `query: { kind: 'encounter_template', tags: ['#tavern_night'] }` and claimed "ten drawable members". They are drawable *on the board*, but not by the seeding site:

- All ten members gate `locationSubtypes: ['sublocation-type.tavern']` (`src/data/tavern-encounter-content.ts:33`, applied to all ten).
- A query seed keeps the family's subtype filter: `eligibleAt` drops any member whose `locationSubtypes` does not include the judged subtype (`src/engine/encounterSeeding.ts:367-384`).
- The judged subtype is the **Location tier's** `locationSubtype`. `seedTargetSubtype` → `locationTierSubtype` → `resolveToParentLocation` (`encounterSeeding.ts:213-233`, `sublocationShape.ts:109`) lifts a mortal standing in a tavern Place up to its town. A Location's subtype is `town` / `city` / …, never `sublocation-type.tavern`. The board reads the tavern Place through a separate `agentSublocationTypeId` path (`socialEncounterGeneration.ts:170, 243`) that the seeding site does not use.
- This seed carries no `resolutionLocationId`, so the feet are the only judged place.

Result: the candidate set is empty on every run. The seed withers into the narrative line "The consequences of … are stirring — a tavern night encounter may surface soon." (`encounterSeeding.ts:887-892`). The PATH chip ("The youth's people will stand {actor} a drink one evening") promised a scene the engine never performs (rule 7b, trigger 34). The private gate's `content_query` check passed because it tests family membership, not seeding-site eligibility, and no test in `encounterSeedLiveness.test.ts` judges an authored query against a location.

**Fix applied.** The seed now targets `#fellowship_errand` ("Work set by the Builders' Fellowship"). It has five members (`bf.quest.repair_wall`, `lay_foundation`, `forge_tools`, `survey_site`, `craft_commission`, in `src/data/builders-fellowship-encounter-content.ts`). All are `actorAffinities: ['individual']` and all accept `town`, `city` and `capital`, which is exactly what `urban` expands to (`src/data/settingClasses.ts:59`). The fiction follows from the taken hook: the builders the youth carried stone for heard the master speak for him. The seed label and chip promise only that they send work, and every member is work set by the Fellowship. The family is unused by any heart master (granary_riot seeds `#watch_errand`; `#fellowship_errand` is seeded only by stone content).

**Caveat (placeless seed, standard).** If the mortal has left for a village or hamlet when the seed comes due (delay 36), four of the five members are filtered out (Lay a Foundation accepts `hamlet`), and in a village the seed withers to the family-only narrative line. This is the same exposure every placeless query seed carries, and granary_riot's `#watch_errand` carries it too. The chip says "will send {actor} work" and names no place, so it promises nothing a wither breaks outright.

### Every chip backed, per route (Law 56)

| Chip (bands) | Backing write | Routes into the band | Holds? |
|---|---|---|---|
| The Town's Thanks (crit/win/cost) | step 1 success `reputation_with $here +0.06` | every success route passes a step-1 success / s@c / near-miss; worst: step 0 fail −0.02 → net +0.04 | ✓ |
| The Mother's Trust (crit/win/cost) | step 1 success bond +0.12/+0.10 | worst: step 0 fail −0.06/−0.06 → net +0.06/+0.04 | ✓ |
| The Justice's Grudge (crit/win/cost) | step 1 success bond `$cast:justice` −0.08/−0.04 | + "Give the justice the credit" +0.04 → net −0.04 | ✓ |
| The Builders' Work (crit/win/cost) | step 1 success `encounter_seed` `#fellowship_errand` | always on step 1 success | ✓ (after § 4 fix) |
| A Plea That Failed (failure) | step 1 failure rep −0.06 | failure is reached only by a step-1 failure | ✓ |
| The Mother's Blame (failure) | step 1 failure bond −0.12/−0.10 | + "Stay with the mother" +0.04 → −0.08 | ✓ |
| The Builders' Work (failure) | step 1 failure `encounter_seed` | always on a step-1 failure | ✓ (after § 4 fix) |
| Blamed for the Rope (crit-fail) | step 0 failure −0.02 (step-0 route) or step 1 failure −0.06 | both routes | ✓ |
| The Mother's Blame (crit-fail) | step 0 failure bond −0.06, or step 1 failure −0.12 | + reaction +0.04 → −0.02 at worst | ✓ |
| (no PATH chip on crit-fail) | step-0 route plants no seed | deliberate omission. On the step-1 route the seed is planted and not chipped: under-reporting, never a false chip | ✓ |

### Later-tense promises (rule 7b)

| Promise | Enacting effect |
|---|---|
| "She will remember it." (Walk the youth home) | bond `$cast:mother` +0.04 |
| "The justice will remember the courtesy." | bond `$cast:justice` +0.04 |
| "She will remember that much." (Stay with the mother) | bond `$cast:mother` +0.04 |
| "The town will not thank them for it." | `reputation_with $here −0.03` |
| "…will send {actor} work." / seed label "…have work for them." | `encounter_seed` `#fellowship_errand`, delay 36. Promises a tick and a kind of work, never a place or a cast |

No sentence binds the mortal to a place or time, so no `appointment` block is needed.

## 5. Chip referents resolve

`$here` (location, linked) · `$cast:mother` and `$cast:justice` (agent concepts, linked; plain `reputation` noun, no `{target}`, THR-1685) · `seed` with `$actor` concept and tooltip `ui.aftermath_seed`. The tooltips `ui.reputation_with`, `ui.standing` and `ui.aftermath_seed` are live across the corpus (the gate reads them).

Other ids, proved by grep:
- `trait.mastery.silver-tongue`: `src/data/mastery-trait-content.ts:109` (name "Silver Tongue", line 111)
- `trait.core.core_hope.vice` ("Bitter"): `src/data/ambition-templates.ts:858`; "Being Bitter" factor lines in `guildhall-spy.ts:199`, `hired-knives.ts:275`
- `card.trait_card.core`: `src/data/nudge-card-library.ts:593`
- `generic.warmth` / `generic.memory` / `generic.focus` / `generic.mercy`: `src/data/encounter-image-library.ts`
- `#fellowship_errand`: `src/data/content-tags.ts:299`; catalog row "encounter 5 | 5"

## 6. New Hooks Needed

None for this encounter. **Backlog note (not filed here, for the batch report):** the seeding site and the board disagree about where a tavern is. Any `#tavern_night` query seed (or `catalystQuery`, which judges at a Location-tier anchor the same way) can never fire. `masons-commission.ts` already dropped one, for a different reason. Either the seeding site should also try the target's Place-tier sublocation type, or the attachment gate should judge an authored seed query against the setting it can fire in. That is engine work, outside a content slot.

## 7. Implementation File Map

Compiler-owned only (`compile:encounter`). No hand-edits beyond the package. At closeout, stamp `encounter.town.gallows_pardon` into `hook.the_great_building.usedBy` (`src/data/content-eval/plotHooks.ts`), and add any THR-1526 seed-pin rows the compile asks for.

## 8. Gate

`node .cache/check-encounter-batch3.mjs --package Docs/plans/encounters/gallows-pardon.package.json` (private batch-3 bundle): **GREEN**, `checked 1   clean 1   failing 0   on ratchet 0   warnings 0`, `[systems: cast, rewards, seeds, reputation, content_query]`.

## 9. Primitive Disposition

No missing primitives identified. One engine defect is observed, the seeding-site tavern blindness in § 6, and it is BACKLOG.
