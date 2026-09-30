# Encounter Pipeline: Blamed for the Tithe Barn
> Scale: short | Slug: tithe-barn-raid | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0

Audited input: `Docs/plans/encounters/tithe-barn-raid-revised.md` (with `tithe-barn-raid-editorial.md` for context). Brief binding: `expert-everyday-1-brief.md` slot 3 — `intrinsicTier: 'shaping'`, `rarityTier: 2`, `scale: local`, `settings: ['rural']`, consequence hand `thread` + `omen`, system target `forks`. All match the packet's § 0.

## 1. Support Bundle Honesty

| Object | Claim | Verified | Finding |
|---|---|---|---|
| `reeve` | reuse `steward`, else spawn `steward` "Aldric Venn", must-persist | `steward` is a live `NpcRole` (`src/types/npc.ts:59`). | **Reuse will essentially never hit.** `steward` is only rostered on `castle` (0.9) and the `noble_house` faction (1.0). None of the rural subtypes (`hamlet`, `farmland`, `mining` — `settingClasses.ts:58`) seeds one, so the reeve is spawned in practice. The spawn fallback is live, so this is honest. It is not a defect. |
| `elder` | reuse `elder` (hamlet roster), else spawn "Maud Ashby", must-persist | `elder` is a live `NpcRole` (`npc.ts:70`). The `hamlet` roster seeds it at 1.0 (`npc.ts:217`). | Honest. It reuses on `hamlet` and spawns on `farmland` / `mining`, which have no roster. |
| `$here` | `reputation_with` target and village chip anchor | `ANCHOR_SENTINEL_HERE = '$here'` (`chipAnchorDeclarations.ts:111`). `reputation_with.targetLocationId: '$here'` is live (cunning-fair precedent). | Honest. |
| Tithe barn, carved passage | scene-local objects | — | Honest. The packet does not chip them. The passage persists only as the `hidden_mark` label and the omen hook, exactly as § 5 says. |

## 2. Missing Primitives

No missing primitives identified. Every mechanism is live:

- **Fork:** `ActionStepBranch.decidedBy: { axis: 'honesty_cunning' }` (`BranchPoleDecision`, `unifiedAction.ts:2109`). `honesty_cunning` is a live `ValuePair` (Shadow, Confessor +1 / Puppeteer −1, `agent.ts:12`). The variants key `positive` / `negative` (`BranchPoleKey`). `fallback` is the Confessor arm.
- **Pole lean:** `StepNudgePoleLean = { axis, toward: 'positive' | 'negative', weight? }` (`unifiedAction.ts:1615`). The packet's `honesty_cunning → negative/positive` maps to `{ axis: 'honesty_cunning', toward: … }` (smugglers-ford shape).
- **Effects, all live with the fields the packet uses:** `thread_strengthen` / `thread_weaken` (`ascendantId`, `mortalId`, `reason`, `unifiedAction.ts:997/1007`, with the `$ascendant` / `$actor` sentinels as in cunning-fair). `emit_omen` (`category: 'cultural'` ∈ `OmenCategory`; `scope: { kind: 'global' }` ∈ `EmittedOmenScope`; `sphereAlignment` `time` / `darkness` ∈ `SPHERE_NAMES`; `narrativeHook`; `intensity`). `bond_change` (`withAgentId: '$cast:<key>'`, `sentimentDelta`, `trustDelta`). `reputation_with` (`targetLocationId`, `delta`). `hidden_mark` (`category: 'secret_knowledge'` ∈ `HiddenMarkCategory`; `severity`, `label`, `revealFamilies`; the default target is the actor).
- **Reveal families:** `shadow` and `settlement` are both registered aliases (`reveal-family-aliases.ts:129,137`), so the mark scores and surfaces rather than only decaying.
- **Traits:** `trait.reputation.shadow.positive` / `.negative` exist (`reputation-trait-content.ts:161,186`). `TraitVariant { traitId, forecastDelta, factorLine }` is live (`unifiedAction.ts:1828`).
- **Deal:** `shadow`, `peril`, `social`, `labor` are all members of `DealContextTag` (`unifiedAction.ts:1898`).
- **Cards:** library types `stumble`, `whisper`, `boost` ∈ `NudgeCardTypeId`. Each `imageTag` exists, and its sphere matches the card's sphere: `generic.focus`→mind, `generic.light`→light, `generic.time-slow`→time, `generic.matter`→matter (`encounter-image-library.ts:628–642`).
- **Hooks:** `hook.market_collapse` and `hook.lost_civilization` exist (`content-eval/plotHooks.ts`).
- **Tooltips:** `ui.thread`, `ui.hidden_mark`, `ui.reputation_with` and `ui.standing` are all registered (`ui-content.ts:384–458`).
- The packet leans on no rejected primitive (`authoredChoices`) and no placed or timed promise.

## 3. Runtime Feasibility

- **Beats:** two steps. Step 0 is `continue_weakened` with no effects. Step 1 is `fail_action` and carries all writes. Supported.
- **Branching:** one `decidedBy` fork on step 1, with `branchOnStep: 0` on both the step branch and `aftermathConfig` (the smugglers-ford shape). The step-0 specials carry the opposing `poleLean`s. Supported. The step-1 `fallback` must be a full copy of the Confessor arm, including its `successMetadata` / `failureMetadata` effects. Otherwise the fallback path silently writes nothing.
- **Outcome ladder:** all five action bands are authored per variant. A step-level `near_miss` is a success (`isStepSuccess`), so it fires `successMetadata`. No authored face is keyed on it.
- **Hands:** step 0 has 4 dealt + 2 specials (Δ 0.10 + 0.07). Each step-1 arm has 4 + 1 (Δ 0.12). No special reaches 0.15, and the dealer clamps the composed hand.

## 4. Aftermath Supportability

**Chip backing, band by band** (`CHIP_BACKING_EFFECT_KINDS`; success faces read step-1 `successMetadata`, failure faces read `failureMetadata`; `emit_omen` backs no chip and backs none here):

| Variant / bands | Chip | Backing write | OK |
|---|---|---|---|
| Confessor crit_success / success / success_at_cost | reeve `reputation` | `bond_change $cast:reeve` (success) | ✓ |
| | village `reputation with {target}` | `reputation_with $here` +0.05 | ✓ |
| | thread | `thread_strengthen` | ✓ |
| Confessor failure / critical_failure | village | `reputation_with $here` −0.08 | ✓ |
| | reeve | `bond_change $cast:reeve` (failure) | ✓ |
| | thread | `thread_weaken` | ✓ |
| Puppeteer crit_success / success / success_at_cost | thread | `thread_strengthen` | ✓ |
| | hidden mark | `hidden_mark` secret_knowledge | ✓ |
| Puppeteer failure / critical_failure | village / reeve / thread | `reputation_with` / `bond_change $cast:reeve` / `thread_weaken` | ✓ |

The consequence hand is honoured. `thread` is on both sides of both arms. `omen` is on Confessor success, Confessor failure and Puppeteer failure. The Puppeteer success is covered by the `hidden_mark`, as § 0 states.

**Chip nouns (THR-1472 / Law 56 clause 2):**
- `reputation with {target}` on `$here` is the exempt reputation form. `$here` is a resolvable anchor, and on a board draw `{target}` renders as the settlement (THR-1685), which is what the prose means. Lawful.
- `thread`, `hidden mark`: one or two words, each with a tooltip. Lawful.
- **FINDING (corrected in final):** the reeve chip's noun `reputation` is specified with no `entityId` and **no `tooltipId`**. `chipAnchorViolations` (`compositionContract.ts:786–797`) rejects a `stateNoun` that anchors neither, so this is a gating `aftermath` violation. Fix: `stateNoun: { text: 'reputation', tooltipId: 'ui.reputation_with' }`, the ledger-by-lamplight precedent. It stays clear of THR-1685 because there is no `{target}` and no `$cast:` anchor on the noun.
- Side note on the editorial's reasoning. The editorial says `stateNoun` does not enrich `{location}`. That is incorrect: the noun passes through `enrich()` (`buildAftermathConsequences.ts:705`), and cunning-fair ships `reputation with {location}`. The chosen `{target}` form is still lawful and correct, so no change is needed.

**Prose rule 7b (later-tense promises):**
- Spine *"If it is not found, {location} will call {actor} the thief"*: enacted in-encounter by `reputation_with $here` (−0.08) on both failure sides. ✓
- Step-1 *"The grain goes out to the houses tonight"* and *"The reeve counts the barn again at dawn"*: these resolve inside step 1. ✓
- Overviews *"calls the passage … a sign of good/bad luck"* and *"the old passages … are walked again"*: backed by `emit_omen` on those exact sides. The omen fires on no Puppeteer success band, and no Puppeteer success overview claims a sign. ✓
- Puppeteer success_at_cost *"told {location} that one sack of the tithe is still owed"*: this reports what the reeve said. It sets no future act or place for the mortal, so no enacting effect is required. It is acceptable, not a finding. If a later pass wants the debt to be real state, `hidden_mark` `category: 'debt'` is the live write.
- Puppeteer critical_success *"left a loaf on {actor}'s pack"*: a scene fact, backed by `bond_change $cast:elder` +0.12. ✓
- No seed, no appointment and no placed promise, so the THR-1479 checks do not apply.

**Non-systems note, not changed (prose is out of scope):** the Confessor omen `narrativeHook`s still say *"the old roads"*. The packet's own naming rule (§ 5) says the omen texts use "passage". This is harmless to the runtime, but the naming rule is violated in two strings. Flagged for the implementer or a later editorial touch. Not applied here.

## 5. Chip referents resolve

Every anchor is `$here`, a registered tooltip id, or (after the correction) a tooltip on the reeve noun. No chip points at the barn or the passage, which are scene-only. ✓

## 6. New Hooks Needed

None. One implementation note: the `tithe.` id prefix is already used by `src/data/encounters/tithe-demanded.ts` (`tithe.steady_the_collector`, `tithe.ledger_corrected`, …). The four special ids in this packet do not collide. The not-yet-named aftermath **change ids** should use a distinct prefix (e.g. `tbr.`) so no change id collides with tithe-demanded's.

## 7. Implementation File Map

Beyond the compiled set (`Docs/plans/encounters/tithe-barn-raid.package.json` → encounter module, structural test and both registrations via `compile:encounter`): **none.** There is no engine hook, no new type, no new primitive and no new art key. The concept art direction (§ 17) is optional and asset-only.

## 8. Verdict

**READY FOR IMPLEMENTATION.** The only systems defect was the reeve chip noun missing its anchor or tooltip, which fails Law 56 clause 2. It is corrected in `tithe-barn-raid-final.md`. There are no pre-tasks.

## 9. Primitive Disposition

No missing primitives identified.
