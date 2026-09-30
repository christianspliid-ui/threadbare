# Encounter Pipeline: Calling the Harvest
> Scale: short | Slug: harvest-almanac | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0
> Critic: independent Pass 3 (batch expert-everyday-2, slot 5, THR-1679). Audited `harvest-almanac-revised.md` (the post-editorial file). No package JSON exists yet for this slug, so the revised file is the mechanics source. Every id below was grepped in `src/`. Two claims were measured rather than read: the hand composition (real `buildRepertoire` + `composeDealtStep` over all 132 primary/secondary sphere pairs) and the relocation null rate plus trait-holder counts (real `initializeGameState` + 30 `runTick`s, 9 worlds). Scratch scripts lived outside the repo; no repo file was touched.

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `elder` (`$cast:elder`) | actor, `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['elder']`, `spawnNpcRole: 'elder'`, `supportRole: 'harvest_elder'` | **Real.** `elder` is a live `NpcRole` (`src/types/npc.ts:70`) and the hamlet roster seeds it at chance 1.0 (`npc.ts:215-217`). `farmland` and `mining` have no `elder` row, so the `spawnNpcRole` mint path covers them. The gendered-noun trap from batch 1 does not bite: prose says "the village elder" and never a gendered kinship noun. |
| The village (`$here`) | reputation anchor | Real. `$here` binds to the actor's `located_at`, walked to the location tier. `rural` expands to `hamlet`, `farmland`, `mining` only (`settingClasses.ts`), so `$here` is always a place-tier settlement. |
| Travel intent | `agent_relocation` nearest_settlement, TTL | **Real, but a lean and not a move (see § 4, finding B).** `RELOCATION_INTENT_TTL_TICKS` = 36 (`movement-content.ts:254`). |
| Ambition | `assign_ambition` `ambition_great_work` | Real id, assignable. Two honest limits in § 4 (findings C and D). |
| Compulsion | `plant_compulsion` `{ assist: 0.5 }`, 72 ticks | Real (finding E). |

## 2. Missing Primitives

None missing. The encounter uses `reputation_with`, `agent_relocation`, `assign_ambition`, `plant_compulsion`, `traitVariants` with `addNudgeIds`, a trait-gated zero-essence special and a `deal` fill. All are live. No appointment, no seed, no placed or timed promise is authored, so the appointment rules do not apply. There is no `authoredChoices`, no fork and no reward draw.

## 3. Runtime Feasibility

**Step and tier.** One plain step: star 0.64, `fail_action`, duration 1 to 2. `intrinsicTier: 'shaping'`, so the 0.45 background cap (`nudgeHandChecklist.ts:419-420`) does not bind. `rarityTier: 2`, `scale: 'local'`, id under `encounter.town.*`. No rule gate, no `requiresHold`, no new condition id or node type. As the brief binds.

**Hand composition (check 5, measured).** The editor asked whether `checkComposedHand` confirms at least 4 spheres and an ungated common option. **It does not check either.** `checkComposedHand` (`nudgeHandChecklist.ts:127-178`) asserts only: a positive `deal.count`, composed size inside 4 to 8, at most 2 authored specials, no duplicate `deal.tags`. The sphere floor and common-option floor are skipped on a composed step by design (`nudgeHandChecklist.ts:241-245`, `encounterPackage.ts:237-266`); in the dealer they are *preferences* (`dealHand.ts:387-401`). So the gate will pass. The question that matters is what the player is dealt, and I measured it.

Method: for every ordered pair of the 12 spheres as (primary, secondary), build the real starting repertoire (`buildRepertoire`, no unlocks, no earned essence, no hunger or echo cards), run `composeDealtStep` over the declared specials with tags `['lore','labor']`, then drop the trait-gated Stoke to get the non-Proud reader's hand.

| Declaration | Pairs with no ungated common option (of 132) | Max distinct spheres in the hand |
|---|---|---|
| `deal.count: 4`, Hasten + Stoke (as revised) | **6** (every pair drawn from order, chaos, darkness) | 3 |
| **`deal.count: 5`**, Hasten + Stoke | **0** | 3 |
| `deal.count: 4`, Hasten only (control) | 0 | 3 |

**Defect 1, fixed: Stoke starves the common-option floor.** The dealer counts every authored sphere-less special as a common option *before it runs* (`dealHand.ts:374`: `commonSoFar = authored.filter(n => n.sphere === undefined).length`), and it does not know that Stoke is hidden for a non-Proud reader. So for the roughly 98% of readers who are not Proud, the dealer skips its guaranteed-common pick, and on 6 of 132 god shapes the hand has no ungated common card. Impediment #776 recorded the same mechanism in a test fixture. **Fix: `deal.count` 4 to 5.** The control row shows the cause is Stoke, and the `count: 5` row shows the fix holds on all 132 pairs. The composed hand becomes 7 for a Proud reader and 6 for everyone else, inside the hand window of 4 to 8. The dealer's delta budget (0.7) still applies and clamps the fill, and the measurement ran through it. feud-mediation has the same shape (sphere-less trait card, `deal` 3) and the same latent gap; it is not this ticket's to fix.

**Finding 2, accepted, not fixable here: the 4-sphere floor is unreachable for a starting repertoire.** A fresh god holds signature cards in only its primary and secondary spheres plus sphere-less core cards. With one sphere-bearing special (Hasten on `time`), the hand tops out at 3 spheres for every one of the 132 pairs (22 pairs reach only 2, where `time` is the god's own sphere), at every `deal.count`. Raising the count cannot add spheres. The editor's conditional fix ("raise `deal.count` to 5 if short") does not address spheres, and the count change above is made for the common-option reason. The second special is Stoke, which is the design's heart and is hidden for most readers, so swapping it to buy a sphere would trade away the encounter. No gate checks this, the dealer states it as a preference ("deal what exists"), and a god's repertoire broadens as it earns spheres. **Caveat, not a blocker.**

**Other hand facts.** Both specials obey the per-card rules: `requiredTrait` with `essenceCost: 0` (`nudgeHandChecklist.ts:301-305`), a failure-band fragment on each, no digits in either effect line, one shared `harvest.` id prefix. `time` is a live sphere (`SPHERE_NAMES`). Both `imageTag`s resolve to library rows (`generic.dark`, `generic.focus`, `encounter-image-library.ts:628-630`), which is all the gate checks. Hasten is on `time` but its art is the darkness plate; the library has an exact match, `generic.time-slow` (a hanging water drop). This is a consistency note, not a defect, and it is left to the batch report.

**Card-name check (check 4).** `harvest.stoke_their_pride` follows the corpus convention: one encounter prefix, then `verb_noun` snake case (`feud.lay_grudges_down`, `feud.seal_the_handshake`). Both verbs are in `IMPERATIVE_VERB_LEXICON` (`doctrineV2Checks.ts:102` has `hasten`, `:110` has `stoke`). The lexicon check is warn-level (`check-encounter.ts` header), and both names are clean.

**Outcome bands.** All five `byOutcome` bands are authored, clearing the floor of 3. Hasten alone carries all six `StepOutcome` fragments, so coverage never depends on the gated card.

## 4. Aftermath Supportability

**Step effects path.** `successMetadata` fires on crit, success, success_at_cost and near_miss (`isStepSuccess`); `failureMetadata` fires on failure and critical_failure. One `fail_action` step maps these one to one to the five action bands, so Law 56 backing holds band by band. Sentinels (`$actor`, `$here`) bind before dispatch.

| Effect | Evidence | Refusal and limit paths |
|---|---|---|
| `reputation_with` `$here` ±0.06 | `encounterAftermath.ts:1460-1530`; well under `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` 0.15 (`reputation.ts:66`) | None on a settlement `$here`. |
| `agent_relocation` `$actor` to `{ kind: 'nearest_settlement' }`, `mode: 'travel'` | `relocationIntent.ts:157-173`; types `movement.ts:87` | See finding A and B. |
| `assign_ambition` `ambition_great_work`, `priority: 'secondary'` | `encounterAftermath.ts:2403`; `ambitionAssignment.ts:108-127`; `ambition-templates.ts:880-881` (displayName "Build a Great Work") | `already_pursued` and `no_free_slot` (finding C). |
| `plant_compulsion` `{ assist: 0.5 }`, 72 ticks | `encounterAftermath.ts:2978-3045`; `plantedCompulsion.ts:60-86`; `assist` is a member of the closed `EncounterType` union (`types/encounter.ts:28-30`) and is authored by 30 shipped templates, so the bias steers toward real candidates | Only an empty bias or a missing target refuses; neither applies. Cap `COMPULSION_MAX_ACTIVE` = 40 (`game-config.ts:240`); the oldest is evicted when it overflows. |

**Check 2: `ambition_great_work` and `plant_compulsion` with `assist`.** Both exist and both shapes are legal. `plant_compulsion.encounterBias` is `Partial<Record<EncounterType, number>>` (`unifiedAction.ts:843-850`), and `assist` is a member, so a typo cannot ship. No shipped encounter assigns `ambition_great_work` (batch precedents use `arcane_enlightenment`, `seek_revenge`, `uncover_secrets`), so there is no batch collision.

**Finding A, relocation null behaviour (check 3): measured, negligible.** `nearest_settlement` resolves to hamlet, town, city, capital or camp within 12 hexes, excluding the agent's own hex, and returns `null` otherwise (`relocationIntent.ts:82-84, 157-173`; `RELOCATION_NEAREST_SETTLEMENT_MAX_HEXES` = 12). I swept real worlds: small, medium and large maps, seeds 42, 99 and 7, 30 ticks each. Of **1,589** mortals standing in a `rural` place (hamlet 1,506, farmland 66, mining 17), the destination resolved for **all 1,589 (null rate 0 of 1,589)**. The edge case the editor worried about did not occur once. The chip can therefore state the write without a per-run hedge. A null on a map with a lone hamlet remains possible; it is fail-soft (`resolveRelocationDestination` returns `null`, the effect no-ops) and the trace would say so.

**Finding B, relocation is a lean, and the chip overclaimed: fixed.** `agent_relocation` with `travel` writes a `relocationIntent` and stops; nothing moves the agent (`movement.ts:76-86`, `relocationIntent.ts:11-39`). The intent only adds a distance-decayed weight to encounter candidates near the destination, so a destination with no encounter candidates "barely steers", and the intent lapses after 36 ticks. The revised chip detail, "{actor} is on the road there now.", asserts travel in progress. The shipped precedent for this exact effect says "is set on the road to the nearest settlement" (`the-sign-over-the-ruin.ts:692`), which claims the intent and no more. **Fix: detail becomes "{actor} is set on the road there."** (7 words; with the 6-word causeClause the chip is 13, inside the 15-word budget). The causeClause "Sent for by the nearest settlement" and the concept text still occur in the assembled chip body (`buildAftermathConsequences.ts:677-678` joins `causeClause — detail`). The `seed` noun stays the corpus form (`the-sign-over-the-ruin`, `the-broken-seal`, `assize-letter`); the missing travel tooltip is the editor's corpus-wide UI item.

**Finding C, ambition refusal (corpus-wide).** `assignAmbitionToActor` returns `no_free_slot` at `MAX_ACTIVE_AMBITIONS` = 2 (`ambitionAssignment.ts:45, 127`), with no eviction. The-broken-seal measured about 21% of mature-world actors. On that path the PATH ambition chip reports a write that was refused; there is no band or result channel to gate it on. A caveat shared with every `assign_ambition` encounter, not a template defect.

**Finding D, the ambition does not write an almanac.** `ambition_great_work` is a `legacy` ambition in the `builder-civic` family whose strategic verbs are survey a site, draft plans, civic construction, fortify, build a granary and found or grow a settlement (`ambition-templates.ts:880-915`). Its chip text names "Build a Great Work" and is true. The prose "means to write an almanac" is a fiction gloss on that pursuit; the engine will not author an almanac. This is acceptable as narrative hook (`assign_ambition.narrativeHook` is emitted only when the ambition is actually assigned), and I am not rewriting prose, but the batch report should not claim the almanac is a mechanical object. `boostingTraits` includes `trait.personality.star.virtue` (Guiding), so a Guiding reader is the natural holder.

**Finding E, compulsion is a bias, not a command.** The bias is `weight × COMPULSION_BIAS_WEIGHT` (0.5), clamped, summed into encounter scoring (`plantedCompulsion.ts:76-93`). The chip "puts helping others before their own work" is the shipped compulsion register (bell-at-the-exchange, drowned-man) and reads as a lean. Accepted.

### Later-tense promises (prose rule 7b, THR-1476)

| Sentence | Enacting effect on the same path |
|---|---|
| P3 "Villages all down the valley send for a reader who gets that call right." | A general fact of the world, enacted on the success half by `agent_relocation` (finding B: a lean toward the nearest settlement). Not claimed on the failure half. |
| Chip "Sent for by the nearest settlement; {actor} is set on the road there." | success half `agent_relocation` |
| Chip "{actor} is pursuing Build a Great Work now." and its `narrativeHook` | success half `assign_ambition` (finding C caveat) |
| Chip "For a while {actor} puts helping others before their own work." and its `narrativeHook` | failure half `plant_compulsion` 72 ticks |
| Chip "{location} trusts {actor}'s reading of the sky" / "... less" | `reputation_with` ±0.06 on the matching half |
| `description` "sends them on the road to the nearest settlement" / "leaves them helping others for a while" | the same relocation and compulsion |
| Overviews ("has its grain for the winter", "has too little grain") | Present-state scene facts; they assert no later state and need no effect. |

There is no appointment, placed or timed promise, and no seed. Nothing in the prose tells the mortal to be somewhere by a time.

**Chip backing by band.** Success, success_at_cost and critical_success chips (BOND trust, PATH seed, PATH ambition) are backed by `successMetadata`. Failure and critical_failure chips (SCAR trust, SCAR compulsion) are backed by `failureMetadata`. The fallback growth chip renders only on an unauthored outcome, and all five bands are authored. The band-specific cost of success_at_cost (a field cut half green) lives only in its overview; no per-band step channel exists. This is the accepted pattern.

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| BOND / SCAR · reputation with {location} | `stateNoun.entityId: '$here'`, `visualKind: 'location'`, tooltip `ui.reputation_with` (`ui-content.ts:423`); concept "trusts" to `ui.standing` (`ui-content.ts:384`) | yes (location, linked). Anchors on the town, not on `$cast`, so THR-1685 does not bite. |
| PATH · seed | `ui.aftermath_seed` (`ui-content.ts:500`), the shipped relocation form; concept "the nearest settlement" sits in the causeClause and so in the assembled body | yes (named) |
| PATH · ambition | `ui.ambition` (`ui-content.ts:475`); concept "Build a Great Work" in the detail | yes (named) |
| SCAR · compulsion (`kind: 'shell_state'`) | `ui.compulsion` (`ui-content.ts:469`); concept "helping others" in the detail | yes (named) |
| fallback growth · star reach | `reach.star`, used as a tooltip id elsewhere (`holy-order-dawn-encounter-content.ts:468`) | yes |

No chip anchors on `$actor` or `$cast`. No chip's referent is fiction: the town, the ambition, the compulsion and the relocation intent are all written by an effect on that path.

## 6. New Hooks Needed

None. No new role, sublocation type, state field, condition id or node type. The `elder` role, the ambition template and every effect kind already exist.

**Trait refs (check 1, with a correction to the brief).** The revised file says `check:encounter` runs `validateTraitRefs`. **It does not.** `validateTraitRefs` is a graph-wide sweep kept on `__DEBUG.validateTraitRefs()` (`check-encounter.ts` header, lines 29-34; `traitRefValidation.ts:235`); it cannot name a block for one template. I therefore verified the three refs directly, which is a stronger test than the sweep:

| Ref | Definition | Live in a world? |
|---|---|---|
| `trait.core.core_humility.vice` ("Proud") | `coreTraitId('core_humility','vice')` (`core-trait-content.ts:71-73`); continuum registered (`coreRegistry.ts:151-153`); used by comet-disputation, fair-bout, pilots-reckoning, the-unclaimed-relic | yes |
| `trait.core.core_humility.virtue` ("Humble") | same builder; used by the-sign-over-the-ruin and others | yes |
| `trait.personality.eye.vice` ("Judgemental") | `personalityTraitId('eye','vice')` (`personality-trait-content.ts:110-112`); `axisRegistry.ts:123-129` names the Eye vice word `Judgemental`; flavor text "Has already decided, and is only gathering proof." matches the variant's premise | yes |

The sweep's own shapes would reach these refs (`collectRefs` reads `traitVariants[].traitId` and `requiredTrait`, `traitRefValidation.ts:179-188`), and the definition nodes are ensured into the graph by the emergence phases (`phases/corePersonality.ts:110`, `phases/personalityTraitEmerge.ts:67`). Measured on the 9 worlds above (6,556 mortals at tick 30): **128 hold Proud (2.0%), 138 hold Humble (2.1%), 174 hold Judgemental (2.7%).** Every variant has real bearers. **No variant is dropped.** Since most readers hold none of the three, the trait card and the variants are reached by a small share of encounters; that is the design (a flaw the god can lean on), not a defect.

## 7. Implementation File Map

The package compiles to the encounter module, its structural test and both registrations (`compile:encounter`). Do not hand-edit those.

- `Docs/plans/encounters/harvest-almanac.package.json` (new, transcribed from the final doc; the `doc` block carries `plotHookRolled` and `plotHookTaken: hook.natural_disaster`).
- `src/data/content-eval/plotHooks.ts`: stamp `usedBy` for `hook.natural_disaster` at closeout (the brief records this per encounter).
- No engine, type, art or UI changes. Both card images and the concept art use existing generic tags.

**Closeout evidence to take** (per impediments #1111, #1113, #1114): run both `compile:encounter --dry-run` and `check:encounter`; take live proof from a seed sweep plus pinned bands, not the default run. Pin `?spawn=encounter.town.harvest_almanac&outcome=success` and confirm `agent_relocation`, `assign_ambition` and `reputation_with`; pin `&outcome=failure` and confirm `plant_compulsion` and the negative `reputation_with`.

## 8. Verdict

**READY WITH CAVEATS**

1. **Ambition refusal** (finding C): `no_free_slot` on about 21% of mature-world actors; the PATH ambition chip can report a refused write. Corpus-wide; not filed (lanes do not file process tickets).
2. **Sphere breadth** (§ 3): the dealt hand tops out at 3 distinct spheres for a starting repertoire, below the 4-sphere preference, and no gate checks it. It broadens as the god earns spheres. Accepted.
3. **Relocation is a lean** (finding B): the chip now says "set on the road", which is what the effect does. No null case in 1,589 rural mortals.
4. **The almanac is fiction** (finding D): the ambition is builder-civic; do not claim a mechanical almanac in the batch report.
5. **Hasten's art** (§ 3): darkness plate on a time card; `generic.time-slow` is the exact match. Left to the batch report's taste pass.
6. **Live proof** per § 7.

None of these blocks implementation, and every mechanical fix below is merged into the final packet.

## 9. Primitive Disposition

No missing primitives identified.

**Fixes merged into `harvest-almanac-final.md` (mechanics and truthfulness only, no prose rewrites beyond one chip detail):**
1. `deal.count` 4 to 5 on step 0 (composed hand 7 for a Proud reader, 6 otherwise). Closes the common-option starvation measured on 6 of 132 god shapes. Updated in §§ 0, 6, 11, 17, 19 and the gate.
2. Relocation chip detail "{actor} is on the road there now." to "{actor} is set on the road there." (travel is a lean; matches the shipped precedent).
3. Corrected packet claims: `check:encounter` does not run `validateTraitRefs` (refs verified directly, all three live); `checkComposedHand` does not assert spheres or the common option; Concern 1 now carries the measured null rate; Concern 4 is resolved with the measurement.

No id, delta, effect, reputation value, ambition, compulsion, trait variant, cast or aftermath mechanic was changed otherwise. The Stoke delta (0.05) and the Proud variant (−0.05) net to zero and need no change.
