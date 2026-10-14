# Encounter Pipeline: The Witch Trial
> Scale: medium | Slug: witch-trial | Pass: systems
> Date: 2026-10-14 | Pipeline version: 2.0
> Audited: `Docs/plans/encounters/witch-trial.package.json` (after the editorial fixes)

## Verdict: **READY WITH CAVEATS**

Every id, tag, role, sentinel and tooltip the package names resolves in code (proofs below). One support-bundle fix applied (magistrate spawn role). One reward-pool fix applied (the prize filter now matches only remedies). Caveats are conventions and arithmetic, not missing primitives.

## 1. Resolution proofs (grep)

| Named in package | Resolves to | Proof |
|---|---|---|
| `encounter.town.witch_trial` | new template, tail matches slug | gate `✓` |
| reach `veil`, steps 0.74 / 0.80 / 0.84 | brief row 8 | brief table |
| `trait.core.core_warmth.virtue` | live trait | `src/data/encounter-content.ts`, `ambition-templates.ts` |
| `trait.core.core_humility.vice` | live trait | `src/data/encounters/coiners-mint.ts`, `ambition-templates.ts` |
| motivations `mercy_ruthlessness`, `revelation_discretion` | `src/types/agent.ts:10,15` | |
| reuse roles `healer`, `clerk`, `noble` | `NpcRole` union, `src/types/npc.ts:39,45,54` | |
| spawn role `healer` | `NpcRole` | |
| spawn role **`official`** (as authored) | **not in `NpcRole`** (`spawnNpcRole: string`, so it compiled; 4 shipped precedents) | **fixed → `noble`**, which is in the union and already in the reuse list |
| deal tags `lore`, `insight`, `peril`, `presence`, `social` | `DealContextTag`, `src/types/unifiedAction.ts:1921` | |
| imageTags `generic.vigor/light/memory/decay/crowd/warmth` | `src/data/encounter-content.ts:9886/8137/8125/8229/8254`, `encounter-image-library.ts:678` | gate Images block green |
| tooltips `ui.reputation_with`, `ui.standing`, `ui.hidden_mark` | `src/data/ui-content.ts:614/568/627` | |
| `hidden_mark.category: 'secret_knowledge'` | `src/types/unifiedAction.ts:113` | |
| `revealFamilies: ['investigation']` | alias in `src/data/reveal-family-aliases.ts:42`, matched by `familyMatchesTemplate` (`src/engine/hiddenMarks.ts:62`); 11 shipped uses | |
| `$cast:accused`, `$cast:magistrate` | declared support-bundle keys | gate Cast block |
| `$here` | location sentinel | gate enrichment dry-run |
| `rewardPool { possession: 1, tagFilters }` | `baseContentQuery` → `item_template` with **AND** tag match (`src/engine/rewardPool.ts:134,183`) | |
| `#healing` (as authored, alone) | 8 item bearers — incl. **Sorrowheart Mare** (a horse), Herbalist's Pouch, Battle Salve | `reward-attachment-catalog.ts:1589` etc. |
| `#healing` + **`#provision`** (fixed) | Healing Poultice (`:1757`), Sanctuary Incense (`:1775`), The Quiet Cup (`:2249`) — all `attachmentCategory: 'possession'` | prose says "a remedy from the house"; the draw now always is one |

## 2. Support-bundle honesty

| Object | Delivery | Honest? |
|---|---|---|
| `accused` (healer) | lazy, reuse `healer` else spawn "Maud Ellery", must-persist | Yes. The prose never kills or burns the healer, so the persisting node is never contradicted. |
| `magistrate` | lazy, reuse `clerk`/`noble` else spawn `noble` "Aldous Renn", must-persist | Yes after the role fix. |
| the prize | step 2 success `rewardPool` | Yes; fires on success / success_at_cost / critical_success (near_miss counts as success). |
| the miller, the boy, the mill, the stocks, the pyre | scene fiction, role nouns | Never chipped. Correct. |

## 3. Missing primitives

No missing primitives identified. Linear, no branch; bonds, reputation, hidden mark, favour, reward pool are all live.

## 4. Aftermath supportability and Law 56 backing

| Band | Chip | Backed by |
|---|---|---|
| crit_success / success / success_at_cost | healer trust | step 2 success `bond_change $cast:accused +0.12/+0.12` |
| same | town regard (gain) | step 2 success `reputation_with $here +0.05` |
| same | hidden mark | step 2 success `hidden_mark` on `$actor` |
| failure | magistrate trust (loss) | step 2 failure `bond_change $cast:magistrate -0.12/-0.12` |
| failure | town regard (loss) | step 2 failure `reputation_with $here -0.06` |
| critical_failure | both loss chips | the failure write of whichever step critically failed — all three steps carry both a magistrate bond loss and a town reputation loss |

Reactions: *Name the miller* (`reputation_with +0.04`, magistrate `-0.08`), *Leave the miller to the magistrate* (`favor_creation`, debtor `$cast:magistrate` → `owes_favor`), *Sit with the healer* (`bond +0.12`, `reputation -0.02`), *Stay clear of the healer* (`bond -0.10`).

### Later-tense promises (rule 7b / trigger 34)

| Sentence (as authored) | Effect that performs it | Disposition |
|---|---|---|
| "waiting for the assize" (failure) / "goes to the assize in chains" (critical_failure) | **none** — no trial, no seed | **removed**; now "is held in chains" (present outcome fiction, no promise) |
| "leaves the town that evening" (reaction) | **none** — nothing moves the mortal | **removed**; reaction is now *Stay clear of the healer* |
| "through the first night in chains" | none (implies chains to a later date) | → "through the night" |
| "lets the court deal with it quietly" | none (implies a court act on the miller) | → "keeps the miller's part out of the square" |
| "The healer will remember it, and the town will too." | `bond_change` + `reputation_with` on that reaction | lawful |
| "The magistrate owes them for the quiet." | `favor_creation` debtor `$cast:magistrate` | lawful |
| "If the ruling names the wrong cause, the boy will still have fits..." (step 2 spine) | stake inside the scene | lawful (P3 stake, stated) |

No appointment, no seed, so no placed promise remains.

## 5. Chip referents

Every chip's `entityId` is `$cast:accused`, `$cast:magistrate` or `$here` (all minted or found by the encounter), or a tooltip-only concept on the hidden mark the encounter itself writes on `$actor`. No chip points at fiction.

## 6. Caveats

1. **Person-bond chips use `stateNoun: "reputation"`** while the write is a `bond_change` (a relationship edge, not `reputation_with`). This is the batch's deliberate workaround for THR-1685 (`{target}` reads as the settlement on a board draw), shared with `hostage-exchange`; the corpus otherwise writes `reputation with {target}` + the cast `entityId`. Accepted for the batch; revisit when THR-1685 lands.
2. **Step 2 forecast at the ceiling.** 0.84 + the two specials (0.08 + 0.08) = 1.00, so a dealt card played on top of both specials buys nothing. The gate's forecast-arithmetic block passes (the dealer clamps under `NUDGE_HAND_MAX_TOTAL_DELTA`); noted for tuning, not a defect.
3. **No band-keyed step write.** critical_success and success_at_cost share success's chips; the difference is prose (author's accepted limit). Fine.
4. At master difficulty the live proof will lose most natural runs; read success-side rows on a failed run as *not exercised* (brief, impediment #1150).

## 7. New hooks needed

None.

## 8. Implementation file map (beyond the compiled set)

None. `compile:encounter` owns the module, test and registration. Closeout stamps `encounter.town.witch_trial` into `hook.death_and_return.usedBy` in `src/data/content-eval/plotHooks.ts`.

## 9. Primitive disposition

No missing primitives identified.
