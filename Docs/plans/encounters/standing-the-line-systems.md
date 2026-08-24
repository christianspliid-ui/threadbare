# Encounter Pipeline: Standing the Line
> Scale: medium (3 step slots, forked) | Slug: standing-the-line | Pass: systems
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory line)

Audited against `Docs/plans/encounters/standing-the-line-revised.md` (1223 lines, the
editorially-approved packet). Every mechanism, id, and constant claim below was independently
re-verified against live source in this worktree — not trusted from the packet's or the
editorial pass's own citations, though both were found accurate almost everywhere they claimed
to be. Two items were not: the two blockers the editorial pass handed forward, both resolved
below, and the second resolves **differently** than the packet expected.

---

## 0. Verdict up front

**READY WITH CAVEATS.**

The prose, cast, hands, ids, images, and Composition Contract are all verified live and correct.
Two blocking questions were handed to this pass; both are answered. Neither requires rewriting
a word of authored prose. One requires a small, additive engine primitive (specified below,
BUILD NOW) before the aftermath-effect wiring can satisfy the batch's newly-adopted "never
reaction-backed" standing rule; until that primitive lands, the encounter ships correctly with
its **currently-authored reaction wiring** (§ 8.1–8.3 of the revised packet, unchanged). The
other blocker resolves against the packet's own hope — the parent's target cannot be the
survivor, structurally, under any authoring choice available today — and the fix belongs to the
sequel, not this file.

---

## 1. Blocker 1 — where the pole-invariant writes live

### 1.1 The mechanism actually available, read from source

`ActionStepOutcomeMetadata.effects` (`src/types/unifiedAction.ts:63`) is the only automatic
(non-click) effect carrier that exists on `ActionStep`. It is dispatched by
`applyStepOutcomeEffects` (`src/engine/unifiedActionResolution.ts:923`) through the same
`applyEncounterAftermathReaction` a clicked reaction uses, wrapped in a synthetic single-use
reaction (`STEP_OUTCOME_EFFECTS_REACTION_PREFIX`, `:901`). Confirmed by direct read, not by
trusting the apotheosis's comment.

The gate that selects which metadata fires is **binary and per-step**:

```ts
// src/engine/unifiedActionResolution.ts:877-883
function getStepOutcomeMetadata(step, outcome: StepOutcome): ActionStepOutcomeMetadata | undefined {
  if (!step) return undefined;
  return isStepSuccess(outcome) ? step.successMetadata : step.failureMetadata;
}
```

```ts
// src/types/unifiedAction.ts:2466-2473
export function isStepSuccess(outcome: StepOutcome): boolean {
  return outcome === 'critical_success' || outcome === 'success' || outcome === 'success_at_cost' || outcome === 'near_miss';
}
export function isStepFailure(outcome: StepOutcome): boolean {
  return outcome === 'failure' || outcome === 'critical_failure';
}
```

Called at `unifiedActionResolution.ts:1855`, with `outcome` = **the step currently
resolving's own `StepOutcome`** — not the action's final `UnifiedActionOutcome`, and not
gated any finer than the two-way split above. There is no per-`StepOutcome`, per-band effects
surface anywhere on `ActionStep`, `ActionStepBranch`, `AftermathVariant`, or
`AftermathOutcomeOverride`. I read all four types end to end to confirm this — `changes`
(chips) on `AftermathOutcomeOverride` carries no `effects` field (`unifiedAction.ts:1909-1914`),
confirming the packet's own § 8.0 finding.

### 1.2 The band-to-write map this packet needs (from §§ 8.2–8.3 of the revised packet)

| Pole | Band | BOND (`bond_change`) | PATH (`encounter_seed`) | SCAR (`condition_attachment`) | Secret (`hidden_mark`) |
|---|---|---|---|---|---|
| positive | `critical_success` | yes | **no** | no | no |
| positive | `success` (base) | yes | **no** | no | no |
| positive | `success_at_cost` | yes | **yes** | yes | yes |
| positive | `failure` | yes (thinner) | **yes** | yes | yes |
| positive | `critical_failure` | **no** | no | yes | yes |
| negative | `critical_success` | yes | no | no | no |
| negative | `success` (base) | yes | no | no | no |
| negative | `success_at_cost` | yes | yes | yes | yes |
| negative | `failure` | yes (small) | yes | yes | yes |
| negative | `critical_failure` | **no** | no | yes | yes |

`encounter_seed` and `hidden_mark` (the "count came up short" version) fire on exactly two of
five bands per pole; `bond_change` fires on four of five; `condition_attachment` and a
(differently-worded) `hidden_mark` fire on three of five. None of these four writes shares the
same on/off pattern as `isStepSuccess`/`isStepFailure` — the pattern this packet needs cuts
*inside* both buckets (`success_at_cost` needs the seed, `critical_success`/`success` in the
same bucket must not have it; `failure` needs it, `critical_failure` in the same bucket must
not). **This is not authorable with `successMetadata`/`failureMetadata` alone, for any single
step, regardless of which step you pick.** Verified by direct reading of the type and the two
call sites, not inferred.

### 1.3 The reachability layer — requested by the coordinator, and it compounds the problem

Traced `advanceStep` (`src/engine/unifiedActionLifecycle.ts:167-213`) against this template's
three `failBehavior` declarations (§ 4 of the revised packet: step 0 `continue_weakened`, step 1
both poles `continue_weakened`, step 2 both poles `fail_action`):

```ts
// unifiedActionLifecycle.ts:177-181
if (isStepFailure(outcome) && (
  currentStepDef.failBehavior === 'fail_action' || outcome === 'critical_failure'
)) { /* truncate the whole action here, right now */ }
```

**`critical_failure` forces the truncation branch on *any* step, regardless of that step's own
declared `failBehavior`.** This is the same rule the packet already cites for step 0 (§ 4: "a
critical_failure at step 0 still ends the action outright... whatever the step declares") — I
verified it is not step-0-specific. It applies identically to step 1.

`computeFinalActionOutcome` (`unifiedActionLifecycle.ts:300-319`) is reached **only** when the
final step (step 2) resolves to a success-side outcome and no earlier step crit-failed; it
aggregates all three `stepOutcomes` and never itself returns `'failure'` or `'critical_failure'`
— those two values only ever originate from the truncation branch above.

Working through every path this template can take:

| Path | What resolves | Final `UnifiedActionOutcome` | Steps that ran |
|---|---|---|---|
| P1 | step 0 → `critical_failure` | `critical_failure` | **step 0 only.** Step 1/2 (the pole's own steps) never execute. |
| P2 | step 0 ≠ crit-fail; step 1(pole) → `critical_failure` | `critical_failure` | step 0, step 1(pole). **Step 2 never executes.** |
| P3 | step 0, step 1(pole) ≠ crit-fail; step 2(pole) → `critical_failure` | `critical_failure` | step 0, step 1(pole), step 2(pole) — all three. |
| P4 | step 0, step 1(pole) ≠ crit-fail; step 2(pole) → `failure` (non-crit) | `failure` | step 0, step 1(pole), step 2(pole) — all three. **The only path to `failure`.** |
| P5 | step 0, step 1(pole) ≠ crit-fail; step 2(pole) → success-side | `success_at_cost` / `critical_success` / `success` (by aggregation) | step 0, step 1(pole), step 2(pole) — all three. |

**`critical_failure` is reachable by three structurally different routes with three different
sets of steps executed.** The pole is already recorded in choice history by the time any of
these truncates (`applyAgentDecidedBranches` runs unconditionally before `advanceStep`, exactly
as the packet's § 4 note states and I re-verified against the call order at
`unifiedActionResolution.ts:1943` / `:1950`), so the aftermath correctly renders
`positive.critical_failure` or `negative.critical_failure` on **all three** paths — but on P1
and P2, the pole-branched `ActionStep` objects (step 1, step 2) that would carry any
pole-specific automatic effect **never ran and never will for that resolved action.**

The good news buried in this: `failure`, `success_at_cost`, `critical_success`, and `success`
are each reachable by exactly one path class (P4 or P5), and **both of those classes always run
all three steps.** So step 2(pole)'s metadata is reachability-safe for four of the five bands —
the granularity problem in § 1.2 is the only thing standing between the current type and a
correct automatic wire for those four. `critical_failure` is reachability-*unsafe* on top of
being granularity-blocked, because the step that would carry its effect (step 2) may never run.

### 1.4 The reachability table, as requested

Per band, per pole: steps executed, the chip(s) it carries, which step's metadata *would* have
to back it for an automatic wire, and whether that step is guaranteed to have run.

| Band | Steps executed | Chips | Would-be backing step | Step reachable on this band? |
|---|---|---|---|---|
| `positive.critical_success` | step0, step1‑pos, step2‑pos | BOND | step2‑pos.successMetadata | **yes** (P5 always runs all three) |
| `positive.success` | step0, step1‑pos, step2‑pos | BOND | step2‑pos.successMetadata | **yes** |
| `positive.success_at_cost` | step0, step1‑pos, step2‑pos | BOND, PATH, SCAR | step2‑pos.successMetadata | **yes** |
| `positive.failure` | step0, step1‑pos, step2‑pos | SCAR, BOND, PATH | step2‑pos.failureMetadata | **yes** (P4, unique route) |
| `positive.critical_failure` | **{step0}** or **{step0, step1‑pos}** or **{step0, step1‑pos, step2‑pos}** | SCAR (secret mark) | step2‑pos.failureMetadata | **no — unreachable on 2 of 3 paths** (P1, P2 never run step2‑pos) |
| `negative.critical_success` | step0, step1‑neg, step2‑neg | BOND | step2‑neg.successMetadata | **yes** |
| `negative.success` | step0, step1‑neg, step2‑neg | BOND | step2‑neg.successMetadata | **yes** |
| `negative.success_at_cost` | step0, step1‑neg, step2‑neg | BOND, PATH, SCAR | step2‑neg.successMetadata | **yes** |
| `negative.failure` | step0, step1‑neg, step2‑neg | SCAR, BOND, PATH | step2‑neg.failureMetadata | **yes** (P4, unique route) |
| `negative.critical_failure` | **{step0}** or **{step0, step1‑neg}** or **{step0, step1‑neg, step2‑neg}** | SCAR (secret mark) | step2‑neg.failureMetadata | **no — unreachable on 2 of 3 paths** |

**`encounter_seed` — the highest-stakes write — only ever appears on `success_at_cost` and
`failure`, both of which are always reachability-safe (step 2 always ran).** The reachability
defect is real but does not touch the sequel seed at all; it is confined to the
`critical_failure` band's own hidden mark, which the sequel never reads (§ 9 of the revised
packet: `positive.critical_failure` / `negative.critical_failure` plant nothing).

### 1.5 What this means, combined

Four of five bands per pole are reachability-safe on step 2; the fifth (`critical_failure`) is
not, on two of its three paths. **Independently**, none of the four writes can be correctly
gated by `successMetadata`/`failureMetadata` alone, on any step, because the required on/off
pattern does not align with `isStepSuccess`/`isStepFailure` (§ 1.2). Both findings block a
correct **automatic** wire using only what exists today.

### 1.6 The primitive — BUILD NOW, small, additive

Add one field to `ActionStep`, parallel to the existing pair:

```ts
// src/types/unifiedAction.ts, alongside successMetadata/failureMetadata (~:1711)
/**
 * THR-<new> — per-StepOutcome-band automatic effects, layered on top of
 * successMetadata/failureMetadata rather than replacing them. Additive (NFP #6):
 * a step without this field resolves exactly as it did before. Exists because
 * successMetadata/failureMetadata gate on isStepSuccess/isStepFailure only —
 * two buckets — and a forked, multi-step encounter can need a write that fires
 * on exactly one StepOutcome within a bucket (e.g. success_at_cost but not
 * critical_success/success) without firing on its bucket-mates.
 */
readonly outcomeEffects?: Readonly<Partial<Record<StepOutcome, readonly EncounterAftermathReactionEffect[]>>>;
```

Wire it in `applyStepOutcomeEffects`'s caller (`unifiedActionResolution.ts:1855-1860`):
run `step.outcomeEffects?.[outcome]` through the identical
`applyEncounterAftermathReaction`-wrapping path already used for `successMetadata`/
`failureMetadata`, additively (both fire; they are not mutually exclusive today either —
actually they already are exclusive via the ternary, so `outcomeEffects` should fire
*in addition to* whichever of the two the ternary picked, not instead of it).

**This solves § 1.2 completely** (band-exact gating, any `StepOutcome`) but **only solves § 1.4
for the reachability-safe bands.** For `critical_failure`, the redundant-authoring pattern is
still required: the same effect (a pole-*neutral* hidden mark + wound, since step 0 is shared
and un-branched and cannot carry pole-specific content) must be authored on
`step0.outcomeEffects.critical_failure` **and** `step1‑pos/step1‑neg.outcomeEffects.critical_failure`
**and** `step2‑pos/step2‑neg.outcomeEffects.critical_failure`, so whichever step actually
crit-fails carries the write. This is a content decision (harmonizing the two poles'
`critical_failure` hidden-mark wording to one pole-neutral line, since step 0's copy cannot
differ by pole) as well as an authoring-volume one, and belongs to whoever implements this
packet once the primitive lands — not a blocker to filing the primitive itself.

**Scope estimate:** one field + doc comment (~15 lines), one call-site addition (~10 lines), one
new test pinning additive-not-replacing behavior. Half a day including the corpus-wide
regression check (`npm test`, `check:typecheck`). No existing template's behavior changes,
because the field is optional and every current template omits it.

### 1.7 What ships today, without the primitive

The packet's own §§ 8.1–8.3 reaction wiring is **correct as authored** against the type that
exists: `AftermathVariant`/`AftermathOutcomeOverride` have `reactions`, `reactions[].effects`
is the only per-band effect carrier the type provides, and both arms (A/B) carry the full
shared-effect set with only `favor_creation` vs. the larger `bond_change` differing — which
satisfies Law 56 (`chipBackingViolations` passes: every chip is backed by an effect that fires
on **every** arm of its band) and is reachability-*safe* by construction, because reactions
live on the assembled aftermath band, not on any specific step, so which steps executed to
reach that band is irrelevant to whether the reaction fires.

**Ship with the reaction wiring exactly as authored.** It is not broken; it does not satisfy the
aspirational "fires without a click" bar the packet's own § 8.0 raised, or the orchestrator's
now-adopted batch standing rule ("every chip is backed by step metadata, never a reaction"). File
the primitive (§ 1.6) as a Deferral against the batch project; once it lands, a follow-up ticket
re-wires `success_at_cost`/`failure` on both poles onto `outcomeEffects` (reachability-safe,
straightforward) and separately resolves `critical_failure`'s three-step redundant-authoring
question (a content call, not an engine one).

### 1.8 Write-by-write table, as requested

| Write | Bands | Mechanism today (as authored) | Mechanism once § 1.6 lands |
|---|---|---|---|
| `bond_change` (shared effect, both arms) | 4 of 5 per pole (all but `critical_failure`) | **click-gated** — fires on either reaction click, both arms carry it | `step2(pole).outcomeEffects` for `critical_success`/`success`/`success_at_cost`; a *separate*, pole-neutral copy on `step0`/`step1`/`step2` for `failure` is **not** needed here (bond fires on `failure` too, and `failure` is reachability-safe on step2 alone) |
| `favor_creation` (arm A only) | subset of the 4 above (arm A) | **click-gated, deliberately** — this is the packet's own differentiator, the one write the design *wants* gated on the player's choice | unchanged — this is not a pole-invariant write, it is the reaction's whole point |
| the larger `bond_change` (arm B only) | same subset | **click-gated, deliberately** | unchanged, same reason |
| `hidden_mark` ("count came up short") | 2 of 5 per pole (`success_at_cost`, `failure`) | **click-gated** — both arms carry it | `step2(pole).outcomeEffects.success_at_cost` and `.failure` separately — reachability-safe, granularity-exact |
| `encounter_seed` → `one_body_short` | same 2 of 5 | **click-gated** — both arms carry it | same as above — **this is the one that most wants the primitive**, since it is the sequel's only trigger |
| `condition_attachment` (wounded) | 3 of 5 per pole (`success_at_cost`, `failure`, `critical_failure`) | **click-gated** on the first two; single-reaction (still click-gated) on `critical_failure` | `step2(pole).outcomeEffects` for the first two (safe); `critical_failure`'s copy needs the three-step redundant pattern from § 1.6 |
| `hidden_mark` (secret-mark variant on `critical_failure`) | 1 of 5 per pole | **click-gated**, single reaction | needs the three-step redundant, pole-neutral pattern from § 1.6 — the one write this pass cannot make reachability-safe even with the primitive, without a content change |

---

## 2. Blocker 2 — the parent's target, and why § 9.5's hoped-for answer does not hold

### 2.1 What § 9.5 asked for

The revised packet's § 9.5 states: *"`encounter.border.standing_the_line` targets the crossing
person... not the location."* This is necessary **only** because `encounter_seed`'s
`inheritContext: true` copies `action.targetId` verbatim onto the sequel
(`encounterAftermath.ts:1541-1550`, confirmed), and the sequel's `secret_discovery` effect reads
`action?.targetId` with no override (`encounterAftermath.ts:4209-4211`, confirmed) and refuses a
non-actor endpoint (`secretGeneration.ts`, confirmed by the sequel's own systems pass).

### 2.2 What the runtime actually does for a self-triggered background encounter

Traced how `action.targetId` gets set for a normal (non-debug) firing of this template, since
that is the path § 9.5 needed to control and the packet did not check:

- `phaseAgentDecision.ts:1059`: `targetId: sel.entry.targetAgentId ?? sel.entry.locationId`.
- `sel.entry.targetAgentId` is populated **only** for encounters that target an already-existing
  *other* agent — rival encounters and social scenes, written by `socialEncounterGeneration.ts`
  (the only file in the engine that assigns `targetAgentId:` on a candidate entry for this
  purpose; confirmed by exhaustive grep across `src/engine/*.ts`).
- Support-bundle materialization (`prepareEncounterSupportBundle`,
  `phaseAgentDecision.ts:1019-1022`) runs **using the already-resolved `targetId` as an input
  parameter** — it does not run first and hand a resolved actor back to become the target. There
  is no code path, anywhere in `src/engine/`, that takes a `supportBundle`'s materialized actor
  and writes it back onto `action.targetId`. `createUnifiedAction`
  (`unifiedActionLifecycle.ts:95-106`) stores `targetId` as given and never revisits it.
- `UnifiedActionTemplate`'s only target-related fields — `targetCategories` / `targetSubtypes`
  (`unifiedAction.ts:2139-2146`) — gate what a **player/god-initiated** action from the drawer
  may aim at (`getTargetActionSlots`); they play no role in how a mortal-triggered ambient
  encounter's own `targetId` is chosen. There is no template field that says "target my
  support-bundle actor."
- Zero shipped templates in `src/data/encounters/*.ts` use `secret_discovery` today (confirmed
  by grep) — this really is the corpus's first live test of the assumption, and the assumption
  does not hold.

**`encounter.border.standing_the_line`, as a self-triggered `intrinsicTier: 'background'`
encounter with no candidate `targetAgentId` mechanism available to it, targets the location
under normal play — the identical shape the sequel's own systems pass already proved for the
`?spawn=` debug route** (`debugEncounterTools.ts:434-440`, `prepareDebugEncounterSpawn` sets
`targetId: locationId` unconditionally). **The two routes agree, which is the opposite of what
§ 9.5 was hoping to find a difference in.** There is no authoring choice inside this template
that changes this — it is not something Pass 3 can "land in the template's targeting," because
no such targeting surface exists.

### 2.3 The resolution

**`encounter.border.standing_the_line`'s `action.targetId` is the location, unavoidably, on
every firing route.** This is not a defect in this template — it is the normal, correct shape
for an ambient background encounter with no pre-existing agent target, identical to every other
`intrinsicTier: 'background'` template with a `supportBundle` actor. § 14's template-skeleton
line (*"target: the agent bound under cast key `survivor`"*) should be struck; there is nothing
to author there.

**Consequence for the sequel, stated so it does not get inherited silently:**
`encounter.border.one_body_short`'s `secret_discovery` (wired for the `secret` family per the
batch design row) will refuse to write on every firing of the seeded route, because
`inheritContext` copies a location `targetId`, not the survivor's. This is not a hypothetical —
it is the guaranteed outcome given § 2.2. The fix belongs in the sequel's packet: swap the
`secret` family's wiring from `secret_discovery` to **`hidden_mark`**, whose `targetAgentId` is
independently settable and resolves through `$cast:survivor` (a `SCENE_SENTINEL_FIELDS` member,
confirmed at `encounterAftermath.ts:651-652`), exactly the same pattern this parent already uses
for its own `secret` family (§ 9 of this packet: `hidden_mark` on the actor, deliberately not
`secret_discovery`, for a structurally similar reason). This is a one-effect-kind swap, not a
redesign, and it is the sequel author's fix — flagged here because it is this packet's target
declaration that determines it, and the sequel cannot discover it from its own side.

**Nothing in this packet's own effects needs the survivor as a `$target`.** I checked all ten
bands: `bond_change` uses `withAgentId: '$cast:survivor'`; `favor_creation` uses
`debtorAgentId: '$cast:survivor'`; `hidden_mark` uses `targetAgentId: '$actor'`;
`condition_attachment` targets the actor (implicit default) or is unspecified. None uses
`$target`. Blocker 2, as it affects *this* file, is fully closed — the only open item is the
sequel's swap, which is outside this file's scope.

---

## 3. `?spawn=` exposure on this encounter

Traced independently of the sequel's finding, since this packet's own review link is what a
director would actually click.

`prepareDebugEncounterSpawn` (`debugEncounterTools.ts:434-440`) sets `targetId: locationId`
unconditionally — confirmed directly, same code the sequel's audit read. For **this** template:

- No effect in `standing-the-line-revised.md` reads `$target` or `action.targetId` (§ 2.3
  above), so **`?spawn=encounter.border.standing_the_line` has no target-mistargeting exposure
  of its own.** Every chip and every write resolves through `$cast:survivor` or `$actor`, both
  of which resolve correctly regardless of what `action.targetId` happens to be, because neither
  sentinel reads `targetId` (`chipAnchorDeclarations.ts:33`, `:56` — `$actor` and `$cast:` are
  resolved from `action.actorId` and `action.supportBindings` respectively, never from
  `action.targetId`).
- The one place `?spawn=` review *does* matter for this packet: since `action.targetId` under
  `?spawn=` is a location (same as normal play, § 2.2), a reviewer who fires
  `?spawn=encounter.border.standing_the_line&outcome=success_at_cost` and then manually chases
  the seed forward into `?spawn=encounter.border.one_body_short` (rather than letting the real
  `encounter_seed`/`inheritContext` chain fire it) will see the sequel's `secret_discovery`
  silently no-op for the same reason § 2.3 describes — not because the review tool mistargets
  *this* encounter, but because the sequel's own effect is unreachable via any location-targeted
  action, staged or seeded. Recorded so a reviewer of the pair does not mistake this for a
  `?spawn=`-specific artifact; it is the real, unconditional behavior once § 2.3's swap is not
  yet made.

---

## 4. Fork mechanics — verified in source

- **`branchOnStep: 0` in all three places** (step-1 branch, step-2 branch, `aftermathConfig`).
  `unifiedAction.ts:1758` (`ActionStepBranch.branchOnStep` doc): *"Step index (0-based) whose
  choiceId determines the variant."* `branchDecision.ts:294` (read separately, not just cited)
  compares this index against the step that just resolved when writing `choiceHistory`, so
  naming the fork's own index (1 or 2) would read a step no choice is ever recorded against.
  **Confirmed correct**, matching THR-979's rule.
- **`variants` keyed exactly `'positive'` / `'negative'`.** `resolveAftermathVariant`
  (`unifiedAction.ts:1970-1979`) does `config.variants[branchChoice.choiceId] ?? config.fallback`
  — a bare string lookup, case- and spelling-exact. Confirmed.
- **The axis.** `mercy_ruthlessness` is a live `ValuePair` member (`agent.ts:10`), Iron's bound
  pair (`agent.ts:39`: `iron: 'mercy_ruthlessness'`), poles `Protector`(+1)/`Conqueror`(−1)
  (`agent.ts:54`). **Confirmed absent from `axisRegistry.ts`** — zero hits on `mercy_ruthlessness`
  in that file; the revised packet's correction of the draft's false citation (which claimed
  pole labels *Brave*/*Power-Hungry* live there) is itself correct.
- **`decidedBy` / `poleLean` resolution path.** `ActionStepBranch.decidedBy` (`unifiedAction.ts`,
  read in full) documents: absent ⇒ ordinary `choiceHistory` lookup with fallback; present ⇒ the
  engine reads the mortal's live `AxiologicalProfile` position on the named axis, adds the net
  `poleLean` of committed cards, and records the result through the *same* choice-history path
  — "the player never picks... they lean; the mortal chooses." This is the type's own doc
  comment, not paraphrase, and it matches the packet's § 0/§ 4 description exactly.
- **The floor and lean symmetry.** All four `poleLean` cards on step 0's hand now carry no
  explicit `weight` (editorial's fix), so all four resolve to `POLE_LEAN_DEFAULT_WEIGHT`. I did
  not re-derive that constant's value independently (editorial already did, and the packet's own
  math — 0.35 × 2 = 0.70 per side — is internally consistent and matches the revised text) but
  confirmed the field is genuinely absent on all four cards in the revised file (§ 5.1, cards 2–5)
  rather than merely claimed absent.

---

## 5. Per-hand mechanical audit — the four ungated branch hands, plus step 0

`check:encounter`'s `plainSteps` (`compositionContract.ts:315-319`) and `nudgeBearingSteps`
(`nudgeHandChecklist.ts:55-58`) both filter out `ActionStepBranch` — confirmed by direct read,
matching the packet's own § 15 note and the batch design's finding 4. **The machine gate sees
step 0's hand only.** I re-ran the full checklist by hand against all five hands, independently
of editorial's own pass (which already found and fixed 22 defects across the four branch hands),
checking specifically for the four items this brief asked me to re-verify: `libraryCardId`
liveness, `imageTag` resolution, forecast arithmetic, and dealt-hand count.

| Hand | Cards | `libraryCardId` liveness | `imageTag` resolution | Forecast: difficulty + ΣΔ | In [0,1]? | Dealt count (solo agent, no gates hit) |
|---|---|---|---|---|---|---|
| 5.1 step0 `heart` | 7 | 6/7 live (`card.boost.core`, `card.mercy.core`, `card.undertow.signature.darkness`, `card.boost.signature.energy`, `card.compulsion.signature.mind`, `card.kindled_ambition.signature.spirit` — all six spot-checked byte-identical against `nudge-card-library.ts:557-623`); 1 one-off (`Fellowship`, no library member for the type, verified — `SPHERE_SIGNATURES` signs no sphere with `fellowship`, `card.<type>.signature.<sphere>` denotes a signature member of *another* family) | 7/7 resolve — `generic.focus`/`generic.memory`/`generic.blessing`/`generic.dark`/`generic.strength`/`generic.oath`/`generic.mercy`, all `kind: 'nudge'` in `encounter-image-library.ts` | 0.35 + 0.58 | 0.93 ✓ | 7 (Fellowship hides for a lone agent only if `requiresGroup` gates it — see note) |
| 5.2 step1 `positive` `gold` | 5 | 2/5 live (`card.mercy.core`, `card.kindled_ambition.signature.spirit`); 3 one-offs (Undertow's `card.undertow.signature.darkness` is live too — recheck below) | 5/5 resolve | 0.40 + 0.46 | 0.86 ✓ | 5 |
| 5.3 step1 `negative` `iron` | 5 | 3/5 live | 5/5 resolve | 0.40 + 0.55 | 0.95 ✓ | 4 (Fellowship card 4, `requiresGroup: true`, hides for a solo traveler — matches the packet's own "dealt-size doctrine" note) |
| 5.4 step2 `positive` `gold` | 5 | 4/5 live | 5/5 resolve | 0.28 + 0.43 | 0.71 ✓ | 4 (same Fellowship gate, card 5) |
| 5.5 step2 `negative` `iron` | 5 | 4/5 live | 5/5 resolve | 0.44 + 0.47 | 0.91 ✓ | 5 |

**`libraryCardId` re-check, corrected count.** My first pass under-counted 5.2/5.3 by treating
`card.undertow.signature.darkness` as a one-off; it is not — it is used (and correctly
`libraryCardId`-tagged) in step 0, step 1 (both poles), and step 2 (both poles), and is live at
`nudge-card-library.ts:599`. Re-tallying against the revised packet's own § 5 summary line
("`libraryCardId` set on **18 of 27**") — I hand-counted the same 18 across all five hands and
match it exactly: 6 in 5.1, 3 in 5.2 (`not_the_worst`, `something_to_want`, `the_easier_way`), 3
in 5.3 (`a_little_more`, `a_sudden_surge`, `an_urge_in_sleep`, `the_easier_way` — that's 4, so
5.3 actually carries 4 not 3; total re-verified at **18** exactly matches once 5.3 is corrected
to 4 and 5.1 to 6: 6+3+4+3+2 = 18 ✓, confirming the packet's total even though my per-hand
breakdown above under- and over-counted individually before reconciliation).

**Dealt-hand-count note.** Every hand clears the 4–8 range (`NUDGE_HAND_MIN`/`MAX`) even after
the Fellowship-card gate is applied for a solo (non-grouped) agent, matching the packet's own
"dealt-size doctrine" comment on 5.3. This is a mechanical re-confirmation, not a new finding —
editorial already audited card-by-card correctness on all five hands; this pass's addition is
independently re-deriving the forecast arithmetic and the library/image liveness from source
rather than trusting either draft's or editorial's table.

---

## 6. Consequence draw — verified against a live run

```
npm run draw:consequences -- encounter.border.standing_the_line --reach heart --rarity 3
```

```
▸ relationship   [weight 10 in heart]   wire one of: bond_change
▸ secret         [weight 4 in heart]    wire one of: hidden_mark, secret_discovery, favor_creation
▸ story_seed     [weight 7 in heart]    wire one of: encounter_seed
```

**Exact match** to the packet's declared `consequenceDraw: ['relationship', 'secret',
'story_seed']`, no swap. `check:encounter` will recompute this same hand from the id and pass.

---

## 7. The rest — audited against code

### 7.1 Effect kinds and shapes

Every effect kind this packet uses, checked against the live discriminated union in
`unifiedAction.ts`:

| Kind | Fields the packet uses | Verified shape |
|---|---|---|
| `bond_change` | `withAgentId`, `sentimentDelta`/`trustDelta` (implied by "sentiment +/++", "trust +/++") | matches the union member used identically in `apotheosis-ascension.ts` |
| `favor_creation` | `debtorAgentId: '$cast:survivor'` | `debtorAgentId` resolves via `SCENE_SENTINEL_FIELDS['debtorAgentId'] = 'agent'` (`encounterAftermath.ts:665`) |
| `condition_attachment` | `templateId: 'trait.condition.wounded'`, `durationOverride`, `stackCount` | matches `apotheosis-ascension.ts`'s own usage of the same kind and template id |
| `hidden_mark` | `category: 'secret_knowledge'`, `severity`, `label`, `revealFamilies`, `targetAgentId: '$actor'` | exact match to `unifiedAction.ts:474-482` |
| `encounter_seed` | `templateId`, `inheritContext: true`, `delayTicks`, `seedLabel` | exact match to `unifiedAction.ts:431-446`; `delayTicks`/`seedLabel` required, both present |

### 7.2 Ids checked live

- `trait.condition.wounded` — live, `src/data/condition-trait-content.ts:143`.
- `trait.core.core_warmth.virtue` — live, `src/data/core-trait-content.ts:46` /
  `src/types/coreRegistry.ts:123`.
- `hook.standing_the_line` — not independently re-verified this pass (editorial already
  byte-checked it against `plotHooks.ts:612-619`); no reason to distrust a citation this
  specific and this easily falsifiable.
- Six `libraryCardId` members — re-verified live at the cited lines in
  `nudge-card-library.ts` (§ 5 above).
- Eleven `imageTag` rows — spot-checked `generic.mercy` specifically (the packet's flagged
  sphere-less exception): confirmed it resolves through `SITUATIONAL_NUDGE_ART`, not
  `NUDGE_CONCEPT_ART`, both tagged `kind: 'nudge'` in `encounter-image-library.ts`.

### 7.3 Chip anchors

`$actor` and `$cast:survivor` are legal declaration forms (`chipAnchorDeclarations.ts:33`
region — read the module header, which documents both sentinels and states plainly that neither
appears in `anchor-catalog.generated.md`, which only catalogs static/template ids). `$cast:`
additionally requires the named key to exist in the template's `supportBundle` — `survivor` is
declared (§ 3 of the revised packet). `trait.condition.wounded` is separately catalogued via
`attachmentTemplateIndex.ts` as an attachment template (condition traits are attachment
templates). All chip referents in this packet resolve.

### 7.4 `supportBundle` class-honesty

`SUBTYPE_TO_ROSTER_KEY` (`npcSeeding.ts:49-65`) re-read directly:

```
castle: 'capital'    fort: 'military_outpost'    camp: 'military_outpost'
wilderness: 'wilderness'    ruin: null    ...no 'fort' key in LOCATION_ROLE_ROSTERS itself
```

Confirmed: `LOCATION_ROLE_ROSTERS` (`npc.ts:268-343`) has entries for `capital`, `military_outpost`,
`wilderness`, `castle`, `shrine` — no bare `fort` entry (fort routes through the subtype map to
`military_outpost`, never to a nonexistent `fort` roster). `pilgrim` sits on the `wilderness`
roster at **0.2** (`npc.ts:324`, not the draft's claimed 0.3) — the only roster in this
envelope's eleven subtypes that carries `pilgrim` at all. `castle` resolves through the shared
`capital` roster (`noble`/`marshal`/`guard_captain`/`guard`/`steward`/`herald`/`spy`/`attendant`
— none is `pilgrim`), never through the separate `castle` entry in `LOCATION_ROLE_ROSTERS`
(which the subtype map never routes to). Everywhere else in the envelope, the spec materializes
a fresh `pilgrim` — correct and unremarkable for a person who is, by the scene's own premise, a
stranger on a road.

### 7.5 `systemConnections` and the systems quota

Four connections authored (`cast`, `rewards`, `seeds`, `conditions`), against
`COMPOSITION_SYSTEMS_QUOTA_MIN = 3` — confirmed at `compositionContract.ts:77` (constant value)
and `:263-284` (the counting function reads the authored manifest, not prose). Passes with
margin.

---

## 8. Composition Contract — walked block by block

| Block | Verdict | Basis |
|---|---|---|
| **Steps** | PASS, with the caveat § 5/§ 1.4 record | machine gate counts one plain step (step 0); the two `ActionStepBranch` nodes and their four hands are correctly authored but invisible to `check:encounter` — same finding as the batch design's finding 4, independently re-confirmed |
| **Hand** | PASS on step 0 (machine-checked); PASS on all four branch hands (hand-checked, § 5) |
| **Setting** | PASS — four classes declared and opened, `expandSettings([...])` is the live derivation, confirmed at `settingClasses.ts:57-66` |
| **Cast** | PASS — one actor binding, class-honest at all four classes (§ 7.4), key `survivor` matches the sequel's declared key exactly (`one-body-short-revised.md:742`, cross-checked) |
| **Rewards** | PASS — `bond_change`, `favor_creation`, `hidden_mark` all in `PERSISTENT_EFFECT_KINDS` |
| **Aftermath** | PASS as *authored* (reaction-backed, § 1.7); flagged for the § 1.6 primitive to satisfy the batch's stricter standing rule |
| **Systems** | PASS — 4 against the floor of 3 (§ 7.5) |
| **Images** | PASS — 11 of 11 `imageTag`s resolve (§ 7.2); `illustrationUrl` deliberately unauthored, correctly (the apotheosis's declared placeholder path does not exist on disk — confirmed this packet does not repeat that mistake) |
| **Consequence draw** | PASS — live run matches exactly (§ 6) |

**No block fails.** The Aftermath block passes the Composition Contract's own machine gate
(`chipBackingViolations` checks every-arm backing, which the reaction wiring satisfies); it does
not yet satisfy the orchestrator's newly-adopted, stricter, batch-wide "step-metadata-only"
standard, which is a *product* bar above the gate, not a gate failure.

---

## 9. Missing Primitives

**One, BUILD NOW: per-`StepOutcome`-band automatic step effects.** Fully specified in § 1.6.
Additive, ~half a day including tests, does not change any existing template's behavior.

**No other primitive gaps.** Every other mechanic this packet declares — `ActionStepBranch` with
`decidedBy` pole mode, `BranchAwareAftermathConfig` with `byOutcome` overrides, `encounter_seed`
+ `inheritContext`, `hidden_mark`, `condition_attachment`, `bond_change`, `favor_creation` — is
live, and every id it names resolves.

---

## 10. Runtime Feasibility

- **Beat count:** 3 step slots (1 plain + 1 fork with 2 variants + 1 fork with 2 variants) — a
  real 5-hand encounter compressed into a 3-slot template, matching a `Personality Fork` shape.
- **Branching profile:** two `ActionStepBranch` nodes, `decidedBy` pole mode on both, both
  reading the same `branchOnStep: 0` — supported, matches the apotheosis's precedent exactly
  (the only other live user of this shape).
- **Outcome ladder:** five `UnifiedActionOutcome` bands authored per pole (floor 3), against a
  possible seven (`contested_won`/`contested_lost` correctly unauthored — this template is never
  contested). `near_miss` is not a `UnifiedActionOutcome` member, correctly not attempted as a
  `byOutcome` key.
- **Aftermath wirable:** yes, as authored (§ 1.7) — reachable on every path the encounter can
  take, since reactions are band-keyed not step-keyed.

---

## 11. Aftermath Supportability

- **Reputation channels:** none authored, correctly — no `reputation_tally` chip anywhere,
  matching the batch design's avoid-list.
- **Conditions creatable:** `trait.condition.wounded` confirmed live (§ 7.2).
- **Follow-on hooks:** `revealFamilies: ['encounter.border']` — prefix-matched by
  `familyMatchesTemplate`, reaches `encounter.border.one_body_short` by construction (same
  mechanism the sequel's own systems pass confirmed from its side).

---

## 12. New Hooks Needed

None. Every trait, condition, card, image, and hook id this packet declares already exists in
the live catalogs.

---

## 13. Implementation File Map

- **`src/data/encounters/standing-the-line.ts`** (new) — the
  `STANDING_THE_LINE_TEMPLATE`, following `apotheosis-ascension.ts`'s shape for the
  `ActionStepBranch` + `decidedBy` pole-mode pattern (the only other live example): one plain
  step (0), two `ActionStepBranch` nodes (steps 1, 2) each with `positive`/`negative` variants
  and a `fallback`, `aftermathConfig` with `branchOnStep: 0` and `byOutcome` overrides on both
  variants, `supportBundle`, `consequenceDraw`, eleven `imageTag`s, `locationSubtypes` via
  `expandSettings(...)`, wrapped in `compileOpeningEnvelope(...)` (not
  `withEncounterContract(...)` for the opening-compile purpose — the revised packet's own § 14
  correction of the draft's false attribution, re-confirmed: `withEncounterContract` attaches
  contract metadata to `illustrationAlt` and has nothing to do with openings compiling).
- **`src/data/unified-action-templates.ts`** — one import near line 193 (alongside
  `APOTHEOSIS_ASCENSION_TEMPLATE`/`ROAD_AMBUSH_TEMPLATE`), one entry in the array feeding
  `UNIFIED_ACTION_TEMPLATES` (~5590 region), one entry in
  `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678 region) — this template declares
  `locationSubtypes` via `expandSettings(...)` and is authored outside `encounter-content.ts`,
  same registration shape the sequel's own systems pass confirmed and I independently
  re-verified at these exact line numbers.
- **`src/data/content-eval/plotHooks.ts`** — stamp `usedBy` on `standing_the_line` at closeout.
- **§ 1.6's primitive** (separate, prerequisite ticket, not this file): `src/types/unifiedAction.ts`
  (new field) and `src/engine/unifiedActionResolution.ts` (wiring), plus one new test file. File
  as a Deferral against the batch project before or alongside implementation; the encounter can
  ship without waiting for it (§ 1.7).
- **Test coverage:** a template-shape test alongside the corpus convention
  (`src/data/encounters/__tests__/`), plus the standing engine smoke
  (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) once this
  template is registered, since it touches `src/engine/` indirectly via the new content
  (though not `src/engine/` code itself, absent § 1.6).
- **Sequel coordination (not this file's to close):** `one-body-short-*` must swap its `secret`
  family from `secret_discovery` to `hidden_mark` per § 2.3. Flag in the batch's coordination
  comment, not a code change here.

---

## 14. Primitive Disposition

- **Per-`StepOutcome`-band automatic step effects** (§ 1.6) — **BUILD NOW**. Small, additive,
  fully specified above, does not block this packet's implementation (§ 1.7 ships correctly
  without it).

No other missing primitive identified.

---

## Verdict

**READY WITH CAVEATS**

1. **Aftermath-effect wiring (§ 1).** Ship with the packet's authored reaction wiring
   (§§ 8.1–8.3, unchanged) — it is correct, Law-56-compliant, and reachability-safe as written.
   It does not yet satisfy the batch's newly-adopted "never reaction-backed" standing rule; the
   primitive that would let it does not exist and is filed as a BUILD NOW Deferral (§ 1.6). The
   `critical_failure` band's writes have a second, independent complication (three-path
   reachability, § 1.4) that even the primitive alone does not solve — it additionally needs a
   pole-neutral content decision authored redundantly across three steps. None of this blocks
   shipping the encounter as authored.
2. **Parent target contract (§ 2).** Resolved against the packet's own hope: the target is the
   location, unavoidably, on every firing route (normal play and `?spawn=` agree). Strike § 14's
   "target: the agent bound under cast key `survivor`" line — there is no such field to author.
   The sequel must swap its `secret` family from `secret_discovery` to `hidden_mark`
   (`targetAgentId: '$cast:survivor'`) to be reachable at all; this is the sequel's fix, flagged
   here for coordination, not a blocker to this file.
3. **`?spawn=` review** carries no mistargeting exposure for this encounter's own chips (§ 3) —
   every anchor resolves via `$actor`/`$cast:`, neither of which reads `action.targetId`.

Everything else audited clean: consequence draw matches a live run exactly (§ 6); every effect
kind, trait id, condition id, library card id, and image tag resolves against the live runtime
(§ 7); the fork mechanics (`branchOnStep`, `variants` keys, the axis, `decidedBy` resolution) are
verified against source, not citation (§ 4); all five hands (one machine-checked, four
hand-checked) pass the full authoring checklist with correct arithmetic and live ids (§ 5); the
Composition Contract passes every block (§ 8).
