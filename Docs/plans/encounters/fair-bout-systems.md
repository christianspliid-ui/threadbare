# Encounter Pipeline: Called to the Ring
> Scale: short | Slug: fair-bout | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## Verdict: READY FOR IMPLEMENTATION (after two fixes, applied)

## 1. Support Bundle Honesty

- **`champion`** is an actor: reuse `guard` / `mercenary`, spawn `guard` "Bram Tallow", `lazy-materialize-on-trigger`, `must-persist`.
- **`backer`** is an actor: reuse `innkeeper` / `merchant`, spawn `innkeeper` "Oda Brisk", `lazy-materialize-on-trigger`, `must-persist`.
- All four roles are live `NpcRole` members (`src/types/npc.ts`).
- Class honesty against `LOCATION_ROLE_ROSTERS`:
  - Guard is 1.0 at town and city, and 0.8 at hamlet.
  - Innkeeper is 1.0 at hamlet, town and city.
  - `mercenary` and `merchant` widen the town and city pool.
  - `rural` also expands to `farmland` and `mining`, where neither spawn role may stand. Both specs are materializing (`encounterSupportBundle.ts` → `mayMaterialize`), so the cast is produced there rather than borrowed.
- **The delivery claims are realistic.**

**Cast-target safety (THR-1165).**
- Every persistent write names a declared, materializing, must-persist actor spec. None is a bind-only default key:
  - `bond_change` on `$cast:champion` (bout success; walk-away success and failure)
  - `bond_change` on `$cast:backer` (bout failure)
  - `favor_creation.debtorAgentId: '$cast:backer'`
- `debtorAgentId` is a registered scene-sentinel field (`sceneSentinels.ts`, `SCENE_SENTINEL_FIELDS.debtorAgentId: 'agent'`, THR-1175), so `$cast:backer` binds the person and the kind check refuses a place.
- `castTargetViolations` is clean.

## 2. Missing Primitives

None. The encounter uses only live primitives:
- `ActionStepBranch.decidedBy` (`courage_prudence`, THR-894)
- `BranchAwareAftermathConfig`
- step-outcome `effects` (THR-783, dispatched through `applyEncounterAftermathReaction`)
- `grant_companion` (THR-1096)
- `favor_creation` (THR-1175)
- `bond_change`

## 3. Runtime Feasibility

- **Two beats, and the agent decides the fork on step 0.** It is `intrinsicTier: 'background'` with step difficulties 0.42, 0.45 (bout) and 0.20 (walk away). Every step sits within `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45). The forecast arithmetic block is green: no hand pushes a step out of range.
- **The fork step has no top-level difficulty, and that cannot be fixed.** `ActionStepBranch` has no `difficulty` field (`branchOnStep`, `variants`, `fallback`, `decidedBy` only), so the absence is structural. `measure:roll-spread` reads step 0 alone (mean 0.42, window fit 0.56). That is still journeyman iron. The brief's 0.435 counts the bout arm. This is the same shape as batch 1's `pilots-reckoning`. It is a measurement note, not a defect.
- **Band landing, and what it means for the chips.**
  - `isStepSuccess` counts `near_miss` as success. A bout that rolls `near_miss` therefore fires the whole **successMetadata**: companion, favour and champion regard.
  - `computeFinalActionOutcome` aggregates that roll to `success_at_cost`.
  - It also lands `success_at_cost` for step-0 failure followed by a won bout, and `critical_success` for a step-0 crit followed by a plain win.
  - So the three success bands can each be reached by several roll paths, and all of them carry the same three writes. The editorial pass rewrote the overviews so that none of them asserts how the bout went (see the editorial file, §6b).
- **The walk-away arm is a real, cheap exit.** It is difficulty 0.20 with `fail_action`, a regard loss only, and a deal-only hand (0 specials is lawful).

## 4. Aftermath Supportability

**Fix 1: Law 56 in both directions (the author's first doubt).** The champion's `bond_change` (-0.08) sits on the bout arm's `successMetadata`. It therefore fires on `critical_success`, `success`, `success_at_cost` and `near_miss` alike. The draft chipped it on `success_at_cost` only. Rule 0 forbids a chip without a write, and this was the mirror case: a write the ending really made, which two of the three pages hid. Step metadata cannot be keyed per band (the `when` predicate is `EffectCondition | ParameterizedCondition`, with no outcome arm). So the honest choices were to drop the write or to chip it everywhere. We kept the write, because a beaten champion's resentment is a real, persistent tie to a must-persist NPC, and chipped it on all three success bands. Now every page reports every write its band makes.

| Path | Writes | Chipped on |
|---|---|---|
| Bout win (crit / success / at-cost, + near_miss → at-cost) | `grant_companion`, `favor_creation` ($cast:backer), `bond_change` $cast:champion -0.08 | all three: companion · favour · champion scar |
| Bout loss (failure / crit fail) | `bond_change` $cast:backer -0.15 | both: backer scar (same text; same write) |
| Walk-away success side | `bond_change` $cast:champion -0.05 | base chip "thinks a little less" (crit, success, at-cost) |
| Walk-away failure side | `bond_change` $cast:champion -0.12 | "regard … fell" (failure, crit fail) |
| Fallback step (= walk-away arm) | same as walk away | **Fix 2:** the fallback aftermath carried no chips and said "the call was met". It now mirrors the walk-away aftermath |

**The consequence hand, wired in context (brief slot 1).**
- **`companion`: `grant_companion` `companion.hedge-healer` → `$actor`,** on the bout arm's success side.
  - The template exists (`companion-templates.ts`: Hedge-Healer, tier 2, `#wilds #settlement`, not unique). It is not unique, so `mintCompanion` refuses only on a missing bearer.
  - An authored grant ignores `COMPANION_MAX` (`respectCap: false`), so the chip cannot be starved by a full roster.
  - Its join sentence ("stitched a wound … stayed to see it heal") fits the champion's cutman.
- **`secret`: `favor_creation`, debtor `$cast:backer`, magnitude 0.15–0.30,** on the same success side. The backer's quiet bet against the whole fair is the secret, and the favour is what it bought.
- The dry-run stamps `consequenceDraw: ['companion', 'secret']` with no swap. That matches the brief.

**Later-tense promises (rule 7b).** None.
- "Every stall … was talking about the bout by dusk" is past tense, in the same scene.
- The crier's naming happens in the scene.
- No seed, no appointment and no placed promise is authored or implied.

## 5. Chip referents

- **`reputation with {target}`** anchors `$cast:champion` or `$cast:backer` with `visualKind: 'agent'`. That is linked, and each chip names its person.
- **`a favour owed`** anchors `$cast:backer` (the debtor) through the concept. That is the right end of the `owes_favor` edge (rule 0c: debtor = the cast member, creditor = the actor). The `ui.favour_owed` tooltip resolves.
- **`companion` (the author's second doubt).** The anchor catalog's companion row asks for `entityId` = the companion node id with `visualKind: 'companion'`. That node is minted at resolution, with an id no author can write.
  - `classifyAnchorDeclaration` offers no `$companion` sentinel. The only resolve-at-runtime sentinels are `$actor`, `$target`, `$here`, `$realm`, `$appointment`, `$artifact` and `$cast:<key>`.
  - The corpus has no companion chip to copy. This is the first.
  - So the lawful declaration today is the draft's: `stateNoun: { text: 'companion', tooltipId: 'ui.companions' }`. The tooltip resolves, which discharges clause 2 (`chipAnchorViolations` is green).
  - The referent is real: the minted companion is on the bearer's Companions row, named, under the profession the chip names (Hedge-Healer).
  - What it lacks is the Tier-2 click to the companion's own card. That is a small engine gap: a `$companion` sentinel resolving to the companion this encounter minted, the exact twin of `$artifact` (THR-1275).
  - It is not a defect in this package, and it does not block. It goes to the orchestrator as an impediment-log row, per the process-work throttle.
- **Anchoring `$actor` was rejected on purpose.** It would be the THR-1472 tell (a chip pointing at the mortal, not the state), and it would open the wrong person's sheet.

## 6. New Hooks Needed

None for this encounter. Optional follow-up: a `$companion` anchor sentinel, estimated at about half a day, mirroring `$artifact` in `chipAnchorDeclarations.ts` plus the runtime binder. It should be logged, not ticketed.

## 7. Implementation File Map

Compiled set only (`npm run compile:encounter`). No extra files.

## 8. Primitive Disposition

No missing primitives identified.

Evidence:
- Scratch `check:encounter`, with the package assembled via `assembleTemplate` and checked unregistered: `✓ encounter.town.fair_bout [systems: cast, rewards, reputation]`, 0 warnings.
- `compile:encounter --dry-run`: exit 0.
