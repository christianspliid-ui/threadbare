# Encounter Pipeline: The Ledger by Lamplight
> Scale: short (local) | Slug: ledger-by-lamplight | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.ledger_by_lamplight` · Batch: journeyman-everyday-2, slot 3 (THR-1677) · Package: `Docs/plans/encounters/ledger-by-lamplight.package.json`

## 1. Inspiration Anchors

- **Plot hook taken: `hook.stronghold_raid`.** The stronghold is a counting house after dark. The raid takes nothing: one page, copied and put back. `hook.sacred_crime` was set aside because the everyday board has no sacred ground. `hook.assassination_succeeded` was set aside because a journeyman copy job kills nobody.
- **Seed dice (binding):** p3 opportunity (a season's wages for one page) · opposition faction doctrine (the house's rule of the locked room: nobody after dark, a clerk walks it twice a night, every seal checked at dawn) · disposition neutral (the house keeps its rule and hunts nobody) · agentRole trespasser · scale company (two houses, and the town's watch on failure).
- **Anti-patterns avoided:** no rule gate (everyday board). No personal condition on the mortal as the failure penalty; the penalty lands on the town and on a bond (brief § Systems quota). No place or time promised by the placeless seed (prose rule 7b).
- No dilemma-library input. The encounter is a job, not a moral fork.

## 2. Scale Justification

`scale: 'local'`, two steps. One night, one room, one page: get in, copy it, get out. Journeyman weight lives in the fiction (a season's wages, a paying house that will or will not come back, a town that will or will not start watching), not in length.

## 3. Pressure Knot

A rival house has already lost a contract to this counting house and wants to know how. The quarter's books close tonight. The house keeps a hard rule: nobody in the ledger room after dark, a clerk walks it twice a night, and every seal is checked at dawn.

## 4. Intervention Fantasy

The god works on the dark and the clock: putting out the street lamps, stretching the gap between the clerk's walks, warming the wax so a seal lifts whole, holding a column of figures steady in the copyist's head. The god does not copy the page; the mortal's hands do.

## 5. Cast and World Objects

| Object | Binding | Notes |
|---|---|---|
| The factor | `$cast:factor` (reuse broker/merchant/trader, spawn broker "Maren Quill"), must-persist | Named in step 0; the payer; bond both ways; carried into the sequel by `inheritContext` |
| The night clerk | `$cast:clerk` (reuse clerk/scribe/guard, spawn clerk "Tobin Asher"), scene-only | Named in step 1; the house's rule walking |
| The town | `$here` | Carries Under Watch on the failure side |
| The fee | step 1 `successMetadata.rewardPool` `#shadow` | PRIZE chip, engine-rendered; paid in kind |
| More work | placeless `encounter_seed`, query `#steal` | The factor sends for the mortal again |

## 6. Beat Structure

1. **Get in unseen** — shadow 0.42, `continue_weakened`. Into the ledger room between the clerk's two walks.
2. **Copy the page** — shadow 0.45, `fail_action`. Lift the seal, copy one page by one lamp, shut the press so no one can tell. The dawn check decides.

## 7. Branching Profile

Linear — no branching (branch count 0). Shape: **Seeded Sequel** (placeless, by family query).

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Two pages copied, every seal whole | — | Purse in kind, factor's trust, sent for again |
| success | Page copied, seal whole | — | same writes |
| success_at_cost | Half a page copied, seal whole | half the work, and the factor's patience | same writes; overview says the rest had better come next time |
| failure | Page copied, seal cracked, found at dawn | the purse | Town Under Watch, factor trusts them less |
| critical_failure | Seen at the open press, nothing copied | the purse, and the name for clean work | Town Under Watch, factor will not trust them again; prose says why a seen sneak is not hired twice |

## 10. Sample Opening (urban, 77 words with the step-0 spine)

> {actor} is in {location} on the night its counting houses close the quarter's books.
>
> A rival house lost a contract to this one and wants to know how. Its factor, {cast:factor}, will pay a season's wages for one page of the sealed ledger, copied and put back.
>
> The counting house has a rule: nobody enters the ledger room after dark, and a clerk walks it twice a night. {actor} must get in unseen between the walks.

`urban` is the only declared class.

## 11. The Hand Per Step

Specials only; the rest is dealt. Prefix `ledger.`. No over-exposed library card is authored.

**Step 0** — `deal: { count: 4, tags: [shadow, finesse] }`
- **Darken The Front** (darkness, 2 ess, Δ0.12) — "Put out the lamps along the house's street side, so nobody sees who stands at the shutter. A real help." Fragments: success, failure.
- **Stretch The Rounds** (time, 1 ess, Δ0.10) — "Draw out the clerk's walk, so the gap between one pass and the next runs longer. A small help." Fragments: critical_success, failure.

**Step 1** — `deal: { count: 3, tags: [finesse, insight] }`
- **Spare The Seal** (matter, 2 ess, Δ0.13) — "Warm the wax under their knife, so it lifts in one piece and presses back without a mark. A real help." Fragments: success, failure.
- **Clear The Head** (mind, 2 ess, Δ0.11) — "Hold the columns steady in their memory, so the figures go down right on the first pass. A real help." Fragments: success, success_at_cost, failure.

No card reaches Δ0.15, so one failure fragment each is enough. No rider, no cost channel other than essence, no grants.

## 12. Linear continuation

> The ledger lies in a locked press under the house's seal. {cast:clerk} will walk the room again within the hour. {actor} must lift the seal, copy the page by one lamp, and shut the press so nobody can tell it was opened. The house checks every seal at dawn.

## 13. Aftermath Paragraph (success)

> {actor} gave {cast:factor} the copied page before dawn, and the house found its seal whole. The factor paid the purse in kind.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean. Every write rides step 1's metadata, so it fires on every band of its side.

## 15. Aftermath Kit Summary (page order: scar · bond · boon · path)

- **Success bands:** BOND · reputation with {target} (`$cast:factor`, `bond_change` +) · BOON · prize (engine PRIZE chip, `rewardPool #shadow`) · PATH · seed (`encounter_seed` query `#steal`, 96 ticks, `inheritContext`).
- **Failure bands:** SCAR · Under Watch (`apply_condition trait.condition.location.under_watch` on `$here`, 48 ticks) · SCAR · reputation with {target} (`$cast:factor`, `bond_change` −).
- Growth fallback chip: shadow reach.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| factor | lazy-materialize-on-trigger | reuse broker/merchant/trader, else spawn broker | must-persist | inherited into the `#steal` sequel via `inheritContext` | live |
| clerk | lazy-materialize-on-trigger | reuse clerk/scribe/guard, else spawn clerk | scene-only | none | live |
| town (`$here`) | pre-seeded | actor's location | must-persist | Under Watch | live |
| sequel | query `#steal` (9 matched in the tag catalog) | encounter library | seed | — | live |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps / reach / difficulty per brief | PASS | shadow 0.42 → shadow 0.45, mean 0.435 |
| rarityTier 2, scale local, background, settings urban, one opening | PASS | |
| Everyday: no rule gate, `encounter.town.*` id | PASS | |
| Consequence hand wired | PASS | possession = step 1 `rewardPool`; place = `apply_condition` on `$here` (failure side). No swap |
| Seeded sequel | PASS | placeless `encounter_seed` by query `#steal`, `inheritContext`, no place or time in any prose |
| Hand rules | PASS | 2 specials + deal per step; four spheres across the specials (darkness, time, matter, mind) |
| Six StepOutcomes covered | PASS | five afterimages per step + card fragments |
| Chips: sheet-word nouns, ≤15 words, backed by writes | PASS | nouns: reputation form, Under Watch, seed |
| Cool failure | PASS | purse, trust and a town watch; nobody hurt or jailed |
| `$actor` personal condition | PASS | none authored |
| Place condition only on the failure side | FLAG | deliberate: a clean copy leaves no trace, so the town learns nothing. The critic may want a softer place write on success; nothing in the fiction supports one |
| `#steal` sequel eligibility | FLAG | a query sequel keeps the location filter; urban members exist (pickpocket, smuggle goods, shadow in the night; steal secrets and vault heist at capitals). A mortal who has wandered into a wilderness hex when it falls due may see it wither |
| `{target}` in the reputation noun | FLAG | lawful form on a cast-backed chip (`$cast:factor`); confirm at live proof |
| Dry run | PASS | `compile:encounter --dry-run` exit 0 |

## Critic revisions (Passes 2, 3, 3b — 2026-09-29)

Applied to `ledger-by-lamplight.package.json`. The full reasoning is in `-editorial.md`, `-systems.md` and `-package.md`. Sections 10, 13 and 15 above describe the pre-critic draft, and the package is authoritative.

- **Opening referent:** P1 now reads "its biggest counting house closes the quarter's books", and P2 "lost a contract to it". The old "this one" had no single antecedent. The opening plus spine is 76 words.
- **Step 0 afterimages:** critical_failure no longer puts the mortal outside or calls the watch. It now reads "doubled his walks. They are inside, with little time to work." Step 0 is `continue_weakened`, so step 1 always runs. Failure now reads "left a shutter unlatched, and the clerk will see it on the next walk", so the clerk is no longer already searching.
- **Card:** Darken The Front became **Smother The Lamps** ("Put out every light along the house's street side…"). The old verb was off the lexicon.
- **Fragment fixes:** the Stretch The Rounds crit fragment is rewritten to remove its echo of the crit afterimage. Clear The Head's s@c fragment now says "halfway down" to match "half the page". Its failure fragment is now "It was the seal that went wrong": the old line had the clerk walk in, which is the critical_failure fiction, not failure.
- **Step 1 crit afterimage** no longer tells the dawn check. The overview tells it once.
- **Aftermath page (trigger 35):** every overview is rewritten so the chips state only the change. Causes now appear only where they add a fact: "The house raised the alarm" and "The clerk raised the alarm" on Under Watch. Cut the unbacked "the rest had better come next time" (trigger 34). Two chips over 15 words are fixed.
- **Chip noun:** `reputation with {target}` became `reputation` (tooltip `ui.reputation_with`). On an everyday draw `{target}` enriches to the town, not the factor.
- **Under Watch detail** now states the mechanic: "{location} is watched now, and quiet work there is harder."
- **PATH chips:** removed the dead `{actor}` concept.
- **Clerk reuse roles:** `guard` became `steward`.
- **Flags settled:** the failure-side-only place write is accepted, because the brief's own wiring is failure-side. `$cast:clerk` stays scene-only, since nothing targets it. The factor is must-persist, as required. `#steal` resolves to 5, 6 and 7 drawable members at town, city and capital, all rarity 1. `{target}` rendering was a real defect, now fixed.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (factor, rule, clerk's walks, shutter, press, seal, dawn check) · 4 YES · 5 YES · 6 YES (essence) · 7 YES · 8 YES (each card acts on the lamps, the walk, the wax or the copying) · 9 YES (dark, time, seal, figures) · 9b YES · 10 YES · 11 YES (factor, town) · 11b YES (read as a page per band) · 12 N/A (short scale) · 13 N/A · 14 YES — concept art: a single cold lamp on a counting-house desk beside a closed press and an unbroken wax seal, grey dawn at the shutter, no people; the residue of work nobody is meant to know happened.
