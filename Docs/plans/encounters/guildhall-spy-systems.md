# Encounter Pipeline: The Spy in the Guildhall
> Scale: short (single test) | Slug: guildhall-spy | Pass: systems (cold critic, THR-1757 master batch 2, slot 5)
> Date: 2026-10-14 | Pipeline version: 3.0

## Verdict: READY WITH CAVEATS

Every id the package names resolves in code; every chip is backed by an effect on its band; the one sequel resolves by a live family query. The caveats are accepted engine limits, not pre-tasks.

## Resolution table (grep-proved)

| Name in package | Resolves to | Proof |
|---|---|---|
| `encounter.town.guildhall_spy` | new id under `encounter.town.*` (never `slice`) | package; gate recomputes the draw from it |
| faction `merchant_consortium` (`membership_change`, `$faction:merchant_consortium`) | `MERCHANT_CONSORTIUM_DEFINITION`, `factionType: 'guild'` | `src/data/merchant-consortium-definition.ts:16`; registered via `src/data/faction-definitions.ts`; sentinel prefix `src/data/content-eval/chipAnchorDeclarations.ts:66` (`ANCHOR_SENTINEL_FACTION_PREFIX`) |
| `#consortium_errand` (seed `query`) | closed-vocabulary family tag, five templates wear it | `src/data/content-tags.ts:304`; `src/data/merchant-consortium-encounter-content.ts:63, 209, 343, 477, 610` |
| trait `trait.core.core_integrity.virtue` / `.vice`, `trait.core.core_hope.vice` | core continuum poles | `src/data/core-trait-content.ts:50, 62` + `coreTraitId()` format `trait.core.<continuum>.<pole>` |
| `card.trait_card.core` (Show An Honest Face) | library trait card | gate hand check green |
| imageTags `generic.memory`, `generic.oath` | generic image vocabulary | present in the generic tag set |
| `spawnNpcRole: 'merchant'`, `reuseNpcRoles: ['merchant']` | live NPC role | used by `bell-at-the-exchange.ts:279`, `cathedral-loan.ts:326` |
| tooltips `ui.faction_member`, `ui.aftermath_seed`, `ui.reputation_with`, `ui.standing` | `src/data/ui-content.ts:551, 696, 614, 568` | grep |
| `$cast:warden`, `$here`, `$actor` | standard sentinels | gate green |

## 1. Support bundle honesty

One actor, `warden` (Odile Marchbank), `lazy-materialize-on-trigger`, `must-persist`, reusing a `merchant` NPC first. Realistic: a merchant-role NPC in an urban settlement is the common case; the persistence is needed because two reactions write `bond_change` on her.

## 2. Missing primitives

None. Live primitives used: `encounter_seed.query` (THR-1488), `membership_change` (THR-1144), `reputation_with`, `bond_change`, trait variants, a trait-only card.

## 3. Runtime feasibility

One step, `fail_action`, linear. `successMetadata` fires on `critical_success`, `success`, `success_at_cost` and `near_miss` (`isStepSuccess`); `failureMetadata` on `failure` and `critical_failure`. `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts`) routes a `near_miss` step to the `success_at_cost` aftermath band — the package now authors a `nearMissAfterimage` so that path reads as one story.

## 4. Aftermath supportability (Law 56 + prose rules 7 / 7b)

| Band | Chip | Backing effect, same side | OK |
|---|---|---|---|
| crit / success / success_at_cost | BOND · a membership (Merchant Consortium) | `membership_change` join, `successMetadata` | ✓ |
| crit / success / success_at_cost | PATH · seed (Consortium work) | `encounter_seed` query `#consortium_errand`, delay 48, `successMetadata` | ✓ |
| failure / critical_failure | BOND · reputation with {location} | `reputation_with $here -0.06`, `failureMetadata` | ✓ |
| reactions | warden's regard ±, town's regard + | `bond_change $cast:warden ±0.10`, `reputation_with $here +0.03` | ✓ |

**Later-tense promises, each named to its effect:**
- "The Merchant Consortium will take in whoever does it" (spine) → `membership_change` join on the success side.
- "Word of the spy reaches the Merchant Consortium, which has work for {actor}" (seedLabel, path chip) → the `encounter_seed`. Placeless, as rule 34 requires: it promises work, never a place.
- Reaction intents "will hold that against" / "will remember the discretion" → `bond_change` ±0.10 on the warden.
- **success_at_cost cost.** No effect, and none is claimed. After the editorial fix the band's cost ("its spy gone and nobody held for it") is a scene-closed fact about a role noun; no chip, overview or intent asserts a standing on the mortal or a later behaviour. Honest under rules 31 / 34. The pre-fix overview ("Every councillor now knows who was asking questions") asserted an exposure standing nothing wrote; it is gone.

**Sequel premise (rule 7).** The `#consortium_errand` templates' prose assumes the Consortium sent the mortal (the reason `pilots-reckoning.ts:68` swapped away from this query). Here the join fires on the same side as the seed, so the premise is true when the seed ripens. A mortal already a member hits `already_member` and stays a member: still true.

## 5. Chip referents resolve

`$faction:merchant_consortium` is a `WorldRef` to a shipped faction (anchor catalog: `faction`, linked). `$here` is the scene's location (linked). The seed chip's concept was re-anchored from `$actor` to the faction it names. No chip points at fiction.

## Caveats

1. **No band-keyed writes.** Critical success, success, success_at_cost and near-miss write the same join + seed; critical failure and failure write the same −0.06. The brief's "at its best" / "lands hard" gradation lives in prose. Accepted engine limit, recorded in the doc block.
2. **Query eligibility.** A query seed keeps the family filter: individual-performable and the target's current location subtype. The five errands accept `hamlet`/`town`/`city`/`capital` (settle-dispute city/capital only), so the sequel withers if the mortal is outside a settlement after 48 ticks. The chip claims only that work is waiting, which stays true; it fails soft.
3. **Faction presence.** If a world has no Merchant Consortium node, `joinFaction` fails soft with a trace and the membership chip would be unbacked on that world. True of every `$faction:<defId>` encounter in the corpus; not specific to this one.

## 6. New hooks needed

None.

## 7. Implementation file map

Only the compiled set (`compile:encounter` emits the module, structural test and registration). No engine, type or art-pipeline edits.

## 8. Verdict

**READY WITH CAVEATS** (caveats 1–3 are accepted limits, not pre-tasks).

## 9. Primitive disposition

No missing primitives identified.
