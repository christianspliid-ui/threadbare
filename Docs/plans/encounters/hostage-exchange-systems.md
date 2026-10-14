# Encounter Pipeline: The Hostage Exchange
> Scale: medium | Slug: hostage-exchange | Pass: systems (cold critic)
> Date: 2026-10-14 | Pipeline version: 2.0
> Audited: `hostage-exchange.package.json` after the editorial fixes

## Verdict: READY FOR IMPLEMENTATION

## Brief conformance (row 3)

| Field | Brief | Package | ✓ |
|---|---|---|---|
| id | `encounter.town.hostage_exchange` | same | ✓ |
| reach | heart | heart; both steps heart | ✓ |
| difficulties | 0.74 → 0.80 (inside 0.72–0.85) | 0.74 → 0.80 | ✓ |
| shape | investigation → resolution | step 0 `continue_weakened`, step 1 `fail_action` | ✓ |
| settings | urban, rural | `["urban","rural"]`, one opening each | ✓ |
| rarity / scale / tier | 2 / local / shaping | `rarityTier: 2`, `scale: "local"`, `intrinsicTier: "shaping"` | ✓ |
| family | `encounter.town.*`, no new tag | no `tags` authored | ✓ |
| relationship | `bond_change` `$actor` ↔ a named cast member | `bond_change $cast:heir` (step 0 failure, step 1 both sides); `$cast:captain` (step 1 success, reactions) | ✓ |
| companion | `grant_companion` | `grant_companion companion.sellsword-band → $actor` on step 1 success | ✓ |
| no card grants, no Heavy Hand, no over-exposed special | | none | ✓ |

## 1. Support Bundle Honesty

| Object | Delivery | Resolves | Note |
|---|---|---|---|
| `captain` | lazy-materialize, reuse `guard_captain`/`mercenary`/`guard`, spawn `mercenary` "Bram Hollis" | `src/types/npc.ts:74` (`mercenary`); `guard_captain` reused in `src/data/default-support-bundles.ts:170` | honest |
| `heir` | lazy-materialize, spawn `noble` "Edric Marrow", no reuse | `noble` spawned by `debt-arbitration.ts:484`, `ducal-nativity.ts:507` | honest. Always-spawn keeps "heir" true |
| `$here` | the encounter location | standard sentinel | standing edge |
| `companion.sellsword-band` | `grant_companion` | `src/data/companion-templates.ts:113` | **contracted**: `durationTicks: MERCENARY_COMPANION_DURATION_TICKS` (10). `src/engine/companions.ts:226` reads it. The band expires. The prose now says "a short contract" (editorial fix 1) |

## 2. Missing Primitives

None. Everything used is live: `bond_change`, `reputation_with`, `grant_companion`, `carryoverFactorLines`, `traitVariants.addNudgeIds`, `requiredTrait` nudge, `deal`.

## 3. Runtime Feasibility

- Two steps, linear. Step 0 critical failure is terminal (`terminalActionOutcome`, `src/engine/unifiedActionLifecycle.ts`), so the crit-fail page has two routes. Both are now true (editorial fix 3).
- s@c routes: `computeFinalActionOutcome` maps any continued failure, any s@c and any near-miss step to `success_at_cost`. The overview is route-neutral (fix 2).
- `grant_companion` has no duration override field (`src/types/unifiedAction.ts:660`), so the contract length is the template's. No author-side fix exists other than truthful prose, and that is applied.

## 4. Aftermath Supportability — every chip backed per route

| Chip (bands) | Backing write | Worst route | Holds? |
|---|---|---|---|
| Town's Thanks (crit/win/cost) | step 1 success `reputation_with $here +0.06` | step 0 fail −0.02 → net +0.04 | ✓ |
| Heir's Trust (crit/win/cost) | step 1 success bond +0.12/+0.10 | step 0 fail −0.06/−0.06 → net +0.06/+0.04 | ✓ |
| Sergeant's Band (crit/win/cost) | step 1 success `grant_companion` | always on success | ✓ |
| Captain's Grudge (crit/win/cost), **new** | step 1 success `bond_change $cast:captain −0.08/−0.06` | + "Let the captain go quietly" +0.04 → net −0.04/−0.06 | ✓ |
| Terms Refused (failure) | step 1 failure rep −0.06 | — | ✓ |
| Heir's Doubt (failure) | step 1 failure bond −0.12/−0.10 | + "Stand by the held heir" +0.04 → −0.08 | ✓ |
| Blamed for the Peace (crit-fail) | step 0 failure −0.02, or step 1 failure −0.06 | — | ✓ |
| Heir's Blame (crit-fail) | step 0 or step 1 failure bond | + reaction +0.04 → −0.02 at worst | ✓ |

**Later-tense promises (rule 7b):**

| Promise | Enacting effect |
|---|---|
| "The captain will remember the kindness." | bond +0.04 |
| "The heir will remember it kindly." | bond +0.04 |
| "The captain will not forgive it." | bond −0.04 |
| "The town will think better of the mortal…" | `reputation_with +0.03` |
| "a short contract" | the template's `durationTicks` |

The prose promises no place or time, so no appointment is needed.

## 5. Chip referents resolve

`$here` (location, linked) · `$cast:heir` and `$cast:captain` (agent concepts, linked) · `companion` is a sheet word with tooltip `ui.companions` (used by `feud-mediation.ts`, `fair-bout.ts`). There is no `$companion` sentinel (#1115), so the plain noun is the lawful anchor. The tooltips `ui.reputation_with` and `ui.standing` are live across the corpus.

Other ids proved by grep:
- `trait.core.core_integrity.virtue` / `.vice`: `src/data/encounter-content.ts`, `smugglers-ford.ts`
- `generic.rumor` / `generic.light` / `generic.blade` / `generic.oath`: `src/data/encounter-image-library.ts`

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Compiler-owned only (`compile:encounter`). No hand-edits beyond the package. At closeout, stamp `encounter.town.hostage_exchange` into `hook.rebuilding_trust.usedBy` in `src/data/content-eval/plotHooks.ts`.

## 8. Gate

`check:encounter --package` (private bundle `.cache/cc-hostage-exchange.mjs`): **GREEN**, 1 checked, 1 clean, 0 warnings. `[systems: cast, rewards, reputation]`.

## 9. Primitive Disposition

No missing primitives identified.
