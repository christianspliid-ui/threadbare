# Encounter Pipeline: The Well Sinking
> Scale: short (local) | Slug: well-sinking | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.well_sinking` · Batch: journeyman-everyday-2, slot 5 (THR-1677) — the batch's **appointment floor** · Package: `Docs/plans/encounters/well-sinking.package.json`

## 1. Inspiration Anchors

- **Plot hook taken: `hook.mad_artificer`** ("someone brilliant has been building things out here for years, unsupervised"). Here it is an old well-digger who sank shafts under the plot for years, alone, and marked none of them. His unsupervised work is why the ground is bad. No magic. `political_labyrinth` was set aside because it would turn a craft test into petitions. `impossible_choice` was set aside because a well contract has no second thing worth keeping.
- **Seed dice (binding):** p3 unmitigated risk (the old shafts, which nobody can make safe) · opposition rival agent (orders): a well-wright sinking the lord's well on the next plot, on the lord's orders, with both shafts drawing on one spring · disposition friendly (the wright warns of the rain and may pass stone over) · agentRole trespasser, read as the outsider sinking a well beside the lord's own well, on the lord's spring · scale company.
- **Anti-patterns avoided:** no rule gate; no personal condition on the mortal as the failure penalty; no place-and-time promise without an enacting effect (the spine's "paid at the well on the day its water runs clear" is the appointment block, prose rule 7b's one exception).
- No dilemma-library input. This is a craft test, not a moral one.

## 2. Scale Justification

`scale: 'local'`, two steps. One day's work: dig the shaft, then line it before the rain. Journeyman weight is in the fiction (half a fee already spent, a lord's wright racing for the spring, the village's regard). The second half of the fee is paid in the appointment sequel.

## 3. Pressure Knot

The village's old well has gone foul. It paid half the fee in advance, and the reeve holds the rest until the new water runs clear. The plot sits over an old digger's unmarked shafts. On the next plot, a lord's well-wright is sinking a second well into the same spring, and rain is coming tonight.

## 4. Intervention Fantasy

The god works on ground, weather, memory and a neighbour's goodwill. It can bring the old shafts back to the reeve's mind, make loose walls cling, hold the rain off until dark, or move the friendly rival to send spare stone over. The god never picks the ending. The rain and the lining decide.

## 5. Cast and World Objects

| Object | Binding | Notes |
|---|---|---|
| Reeve (the payer) | `$cast:reeve`: reuse elder/steward/clerk/merchant, else spawn elder "Wenna Marsh"; lazy, **must-persist** | Named in step 0. **Appointment counterparty** (`owes_favor` edge). Inherited into both sequels via `inheritContext` |
| Rival well-wright | `$cast:wright`: reuse mason, else spawn mason "Tobin Hale"; lazy, must-persist | Named in step 1. Vouches the mortal into the Fellowship on success |
| The place | `$here` | Reputation (both sides). Appointment place |
| Builders Fellowship | `$faction:builders_fellowship` (shipped guild, `factionType: 'guild'`, stonemasons) | `membership_change` join on success |
| Kept sequel | `town.well_first_water` (seed-only, **not yet authored**) | The payer pays at the well |
| Missed sequel | `town.well_gone_foul` (seed-only, **not yet authored**) | The payer comes looking, money held back |

## 6. Beat Structure

1. **Sink the shaft.** Stone 0.42, `continue_weakened`. Dig down through ground full of old workings without breaking into one and caving the sides.
2. **Line the well.** Stone 0.45, `fail_action`. Line the shaft with stone before the night's rain. The first shaft lined takes the spring.

## 7. Branching Profile

Linear, no branching (branch count 0). Shape: **Appointment** (Seeded Sequel, placed/timed variant, THR-1479).

## 8. Branching Map

N/A (linear encounter).

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Lined to the top before dark; the lord's well stands dry | none | Regard up, Fellowship membership, good-year omen, appointment |
| success | Lined; spring won | none | same writes |
| success_at_cost | Lined | extra stone paid out of the advance | same writes; overview says they start the wait short of money |
| failure | Shaft slumps in the night; the lord's well takes the spring | the advance | Regard down, bad-year omen |
| critical_failure | Lining collapses into the shaft | the advance, public face | Regard down, bad-year omen; the place counts the advance as thrown away |

## 10. Sample Opening (rural; 78 words with spine)

> {actor} comes into {location} to sink the new well the village has paid for.
>
> The old well has gone foul. {cast:reeve}, the reeve, keeps the well money. Half the fee has been paid in advance. The rest will be paid at the well on the day its water runs clear.
>
> An old digger sank shafts under this plot for years and marked none. If the new shaft breaks into one, it caves in and the advance is lost.

Urban P1: "{actor} arrives in {location} to sink a new well for one of its streets." The spine works for both classes (a street has a reeve as readily as a village).

## 11. The Hand Per Step

Specials only; the rest is dealt. Prefix `well.`. No over-exposed library card is authored as a special.

**Step 0.** `deal: { count: 4, tags: [craft, labor] }`
- **Recall The Workings** (Whisper, mind, 2 ess, Δ0.12): "Bring the old digger's shafts back to the reeve's mind, so they are named before anyone digs. A real help." Fragments: success, failure.
- **Bind The Sand** (Signature on matter, 2 ess, Δ0.11): "Make the loose ground in the shaft walls cling together, so the sides stand while they dig. A real help." Fragments: critical_success, failure.

**Step 1.** `deal: { count: 3, tags: [craft, labor] }`
- **Delay The Storm** (Signature on time, 2 ess, Δ0.12): "Keep the rain back until after dark, so the lining goes in against dry walls. A real help." Fragments: success, failure.
- **Borrow The Stone** (Favor, order, 1 ess, Δ0.10): "Move the well-wright next door to send spare facing over, so the lining is finished before dark. A small help." Fragments: success, success_at_cost, failure. This card is only possible because the rival is friendly (disposition die).

No card reaches Δ0.15, so one failure fragment each is enough. No rider or Heavy Hand is authored. No grants. Every card is priced in essence.

## 12. Linear continuation (step 1 spine)

> By evening the shaft is down to wet clay. On the next plot, {cast:wright}, a well-wright, is sinking another well on the lord's orders. Both shafts draw on one spring, and the first one lined with stone takes it. The wright calls across, friendly enough, that rain is coming tonight. An unlined shaft will fall in before morning.

## 13. Aftermath Paragraph (success)

> The lining stood through the rain. The spring came into {actor}'s shaft, and the lord's well on the next plot stands dry.

## 14. Aftermath Reaction Choices

No reaction choices; the consequence is clean. Every write rides step 1's metadata, so it fires on every band of its side. `applyAftermathOutcomeBand` replaces reactions wholesale, so writes placed on reactions could be dropped by a band that authors its own.

## 15. Aftermath Kit Summary (page order: scar · bond · boon · path)

- **Success bands (crit / success / at-cost):**
  - BOND · `reputation with {location}` (`$here`, `reputation_with +0.06`)
  - BOND · `a guild membership` (`$faction:builders_fellowship`, `membership_change` join, chronicle). Caption: "Vouched for by {cast:wright} — {actor} is on the rolls of the Builders Fellowship now." (14 words)
  - PATH · `appointment` (`$appointment`, visualKind location). Caption: "The shaft stands — {cast:reeve} pays the rest at the well when its water runs clear." (15 words)
  - Omen (`emit_omen` cultural, life, global): "…took its first night for a good year." Not chipped, because an omen is dressing.
- **Failure bands:**
  - SCAR · `reputation with {location}` (`reputation_with −0.05`)
  - Omen (`emit_omen` cultural, entropy): "…took that for a bad year." Not chipped.
- Growth fallback chip: stone reach.

### The appointment block, as written (step 1 `successMetadata`)

```json
{
  "kind": "encounter_seed",
  "templateId": "town.well_first_water",
  "targetAgentId": "$actor",
  "delayTicks": 36,
  "seedLabel": "The rest of the fee is paid at the new well on the day its water runs clear.",
  "inheritContext": true,
  "appointment": {
    "locationId": "$here",
    "counterpartyId": "$cast:reeve",
    "missed": {
      "templateId": "town.well_gone_foul",
      "seedLabel": "Nobody from the work was at the well when its water ran clear, and the reeve comes looking with the money held back."
    }
  }
}
```

`delayTicks: 36` is three days at `TICKS_PER_DAY = 12`, the time it takes a new well to settle and run clear. `windowTicks` is the default (`APPOINTMENT_WINDOW_TICKS = 12`, one day). The missed branch uses the default delay.

### Sequel fiction notes (for the orchestrator's seed-only templates)

**Kept: `town.well_first_water`** (`drawable: false`, `$here`, inherits `reeve` + `wright`)
1. {actor} is at the new well in {location} on the day its water runs clear. The reeve draws the first bucket in front of the village.
2. {cast:reeve} pays the second half of the fee at the well, as promised. A one-step test (stone or gold: the reeve checks the lining and the water before paying). This is where the fee's `rewardPool` lives.
3. Bands: a clean first bucket earns the full fee and the place's thanks. A cloudy one means the reeve pays short, or holds a part back until the silt settles. The wright may look over from the dry lord's well.

**Missed: `town.well_gone_foul`** (`drawable: false`, inherits `reeve`; the reeve comes to the mortal wherever they are)
1. The water ran clear with nobody from the work at the well. By the time anyone looked again, it had gone foul, because an untended new well silts and sours. The village blames the well-sinker.
2. {cast:reeve} finds {actor} with the second half of the fee held back and asks them to come back and clear it. A one-step stone or heart test.
3. Bands: talk the money out, or go back and clear it; or lose the fee and the village's regard. The broken `owes_favor` edge is the sheet fact. The mortal's name is not blackened past the village, and nobody is jailed or branded (cool failure).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| reeve | lazy-materialize-on-trigger | reuse elder/steward/clerk/merchant (hamlet: elder; town/city: clerk, steward, merchant), else spawn elder | must-persist | appointment counterparty (`owes_favor`); inherited into both sequels | live |
| wright | lazy-materialize-on-trigger | reuse mason (towns), else spawn mason (hamlets and farmland have no mason role) | must-persist | inherited into the kept sequel | live |
| place (`$here`) | pre-seeded | actor's location, walked to the Location tier | must-persist | reputation; appointment place | live |
| Builders Fellowship | pre-seeded | `FACTION_DEFINITIONS` → `builders_fellowship`; `joinFaction` resolves the nearest chapter node | persistent | membership edge | live (world-dependent, see FLAG) |
| kept sequel | seed | `town.well_first_water` | seed | — | **not yet authored** |
| missed sequel | seed | `town.well_gone_foul` | seed | — | **not yet authored** |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps / reach / difficulty per brief | PASS | stone 0.42 → stone 0.45, mean 0.435, no step over 0.45 |
| rarityTier 2, scale local, background, settings rural+urban, one opening each | PASS | |
| Everyday: no rule gate, `encounter.town.*` id | PASS | |
| Consequence hand `membership` + `omen` wired | PASS | `draw:consequences` reprinted the same hand. `membership_change` join `builders_fellowship` and `emit_omen` ×2. **No swap**, because the engine has a real stonemasons' guild |
| Appointment floor | PASS (pending sequels) | `$here`, `$cast:reeve` (explicit must-persist spec, not a default key, per THR-1165), missed branch by `templateId` with its own seedLabel. `check:encounter` will report `dead_template` for both sequel ids until the orchestrator authors them |
| Hand rules | PASS | 2 specials + deal per step; four distinct special spheres (mind, matter, time, order); common option left to the dealer |
| Six StepOutcomes covered | PASS | afterimages ×5 per step, plus fragments and the dealer (near_miss via fragments) |
| Chips: sheet-word nouns, ≤15 words, backed by writes | PASS | nouns: reputation form, `a guild membership`, `appointment` |
| Vagueness sweep | PASS | "gave way" (natural-indefinite `way`) rewritten to "collapsed"; "the dear way" title rewritten |
| Cool failure | PASS | money and standing only |
| `$actor` personal condition | PASS | none authored |
| Membership lands in rural envelopes | FLAG | Builders Fellowship `locationTypes` are town/city/capital. In a hamlet the join resolves a chapter elsewhere (`resolveFactionNodeId` with the agent). If a world seats no Fellowship node, the join fails soft (`faction_not_found` trace) and the membership chip on that band is unbacked. Verify at live proof on a rural seed |
| Rival's guild tie is scene fiction | FLAG | The wright's vouch is scene fiction that motivates the join. The base prose never asserts the wright is a guildsman. It appears only in the success chip's cause clause, which the write backs |
| Dry run | PASS | `compile:encounter --dry-run` exit 0. The dry run does not run seed liveness, so the missing sequels do not show up here |

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (reeve, old shafts, wright, lord's well, spring, rain) · 4 YES · 5 YES · 6 YES (essence) · 7 YES · 8 YES (each card acts on the old shafts, the walls, the rain, or the wright) · 9 YES (memory, ground, weather, neighbour: four questions) · 9b YES · 10 YES · 11 YES (the reeve, the wright, the place, the Fellowship) · 11b YES (read as a page per band; chip captions do not repeat the overview) · 12 N/A (short scale) · 13 N/A · 14 YES. Concept art: a new stone well-head standing alone by a dry, half-lined shaft, a bucket and rope coiled on its lip, with rain-dark ground. No people. It shows the residue of a race, not the race.

## Critic revisions (Passes 2 / 3 / 3b, 2026-09-29)

Applied to `well-sinking.package.json` by the independent critic loop. The critic files are `well-sinking-editorial.md`, `-systems.md` and `-package.md`. Where the sections above disagree with this list, this list and the package win.

- **Sequel ids (orchestrator decision).** Kept → `town.well_first_water`, missed → `town.well_gone_foul`. Both are seed-only and sit outside the factory catalog (the `hunt.trail_cold` precedent), so `check:encounter --all` does not hold them to the composition contract. The rest of the appointment block is unchanged: `$here`, `$cast:reeve`, `inheritContext`, `delayTicks 36`.
- **Step 0 `failureMetadata` added: `reputation_with $here −0.03`.** A step `critical_failure` ends the action whatever its failBehavior, so on a step-0 critical_failure, step 1's failure writes never fired, and the critical_failure SCAR chip was unbacked. Precedent: `crowns-reckoning`.
- **Opening.** Rural P1 is now "…to sink a new well for the village." This removes the "paid for / paid in advance" seam echo.
- **Step 0 spine.** "For years, a digger sank shafts under this plot and marked none of them." and "If the new shaft breaks into one, it can cave in and waste the advance." The stake was over-certain, because a step-0 failure continues.
- **Step 0 critical_failure afterimage.** "They broke into an old shaft, and the sides caved in and filled everything they had dug." The old "half the day went to starting again" contradicted the action ending there.
- **Bind The Sand critical_success fragment.** "…and not a spadeful slid back in." The old line repeated the afterimage's "by noon".
- **Card names moved onto the verb lexicon.** Recall The Workings → **Wake The Memory** (`well.wake_the_memory`). Delay The Storm → **Hold Off The Rain** (`well.hold_off_the_rain`), with the effect line changed to "Keep the clouds back…" so no name word repeats. Borrow The Stone → **Sway The Neighbour** (`well.sway_the_neighbour`).
- **Band overviews** now carry only what the work led to, and each is true on every path into its band:
  - crit: "The spring came to {actor}'s shaft first, and the lord's well on the next plot stands dry. {cast:wright} came over in the morning to look down it."
  - success: "The spring came into {actor}'s shaft, and the lord's well on the next plot stands dry."
  - at-cost: "The spring came into {actor}'s shaft, but the work went wrong in places and used up most of the advance."
  - failure: "The spring went to the lord's well, and the advance went into the ground with the shaft."
  - crit-fail: "{location} counts the advance it paid as thrown away."
- **Chip causes.** crit BOND "A clean job" (was "Lined before dark"). at-cost BOND "Lined in time" (was "Paid for the last courses", which repeated the overview). crit-fail SCAR title "A well that fell in" and cause "A shaft that fell in" (was "A lining that collapsed", false on the step-0 path).
- **Omen hooks** say "the people who paid for it" (was "the village", wrong on urban runs). **`narrativeTemplates.failure`** now reads "The shaft fell in, and the new well was never finished."
- **Membership FLAG resolved (systems § 4a).** `builders_fellowship` is single-instance and seeded in every world with a settlement (hamlet fallback). `resolveFactionNodeId` returns that one node wherever the agent stands, so the join lands on hamlet, farmland and mining runs too. The chip is state-backed on every class, and no change was needed.
