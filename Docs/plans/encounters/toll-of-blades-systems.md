# Encounter Pipeline: The Toll of Blades
> Scale: medium (2-step) | Slug: toll-of-blades | Pass: systems
> Date: 2026-08-24 | Pipeline version: 3.0 (nudge-native, THR-883 format + THR-1045 Composition Contract)

Audited against `Docs/plans/encounters/toll-of-blades-revised.md` (Pass 2, editorially approved) and its companion `toll-of-blades-editorial.md`, inside the binding constraint set `border-perils-batch-design.md` § *1 · The Toll of Blades*. Every id, field name and constant below was read from the live source in this worktree, not assumed from the packet's own claims.

---

## 0 · The three editorial items, resolved

### Item 1 — pack theft: confirmed as unbacked scene texture, not wired

The packet already narrowed the pack-theft claim to a single line, in the `critical_failure` overview only, where the batch design block explicitly licenses it ("a critical failure is a battering and a robbery"). I checked every chip authored on every band (`critical_success` ×3, `success` ×1, `success_at_cost` ×1, `failure` ×1, `critical_failure` ×2) and confirmed **none reference a possession, an item, or `failureMetadata.rewardPool`**. No `spawn_artifact`, `attachment_grant`, or `reward_draw` effect appears anywhere in the packet.

**Decision: leave it narrated, with no write and no chip.** Wiring `failureMetadata.rewardPool` at `critical_failure` was the documented option, and I am declining it for the same reason editorial raised it rather than took it: the `possession` consequence family is explicitly assigned to encounter #3 (`the_unclaimed_relic`) in the batch design's draw-wiring table, and encounter #1's own draw is `['secret', 'membership']` — adding a `possession`-shaped write here would be scope creep against a batch that deliberately spreads families across its six encounters to avoid a single-family pile-up. The `failure` overview and the two step-2 afterimages that used to assert the pack no longer do (Pass 2 already fixed this); the one remaining sentence, at `critical_failure`, is prose-only and stays that way.

**State explicitly, for the record:** the pack theft in the `critical_failure` overview is scene texture. No chip claims it, no effect writes it, and a player who opens their sheet after this ending will find their pack intact. This is not a Law 56 violation (no chip references it) and not trigger 31 (it does not assert agent *history*) — it is the same family of thing one surface over, and it is deliberately left that way.

### Item 2 — the `exhausted` sequencing: verified correct at runtime

Traced the exact call path in `src/engine/unifiedActionResolution.ts` and `src/engine/unifiedActionLifecycle.ts`:

1. Step 1 resolves. `applyStepOutcomeEffects` (which dispatches `successMetadata.effects` / `failureMetadata.effects` through the same applier a reaction uses) fires **before** `advanceStep` decides whether the action continues or terminates. So step 1's `failureMetadata` — the `apply_condition` that mints `trait.condition.exhausted` on `$actor` — is applied and committed to the graph before step 2 ever begins, on every path where step 2 runs at all (see § 1 below for the one path where it does not).
2. Step 2 begins only after step 1 has fully resolved (steps run strictly sequentially; `advanceStep` either terminates the action or advances `currentStep`).
3. A card's `grants` — per `unifiedAction.ts`'s own doc comment on `NudgeCard.grants` — "fire once per committed card, **after the step resolves**." So the Balm's `remove_condition` grant, if the player commits it during step 2, fires after step 2 resolves — which is strictly after step 1 already resolved and (on the failure path) already minted `exhausted`.

There is no race: the mint always precedes the lift in wall-clock/tick order, on every path where both steps run. `remove_condition`'s effect (`src/engine/encounterAftermath.ts` line ~2138) resolves `targetAgentId` to `actorAgentId` when omitted (the card's grant declares no `targetAgentId`, which is correct — it defaults to the actor, the same person step 1 could have exhausted). **Confirmed working as designed.**

### Item 3 — the growth chip's `$actor` anchor: verified correct against the generated catalog

`.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md` § Stats states the form exactly: *"a stat anchor names the bearer **and** the stat: the bearer by `entityId`, the stat by `tooltipId`"* and gives the Reach row as `tooltipId: 'reach.<domain>'` on the concept, plus the bearer's `entityId`. The packet's concept — `{ text: 'the iron reach', entityId: '$actor', tooltipId: 'reach.iron' }` — matches this exactly. `$actor` is a legal sentinel (`ANCHOR_SENTINEL_ACTOR` in `src/data/content-eval/chipAnchorDeclarations.ts`). **Confirmed correct; no further change needed.**

---

## 1 · New defect found in this pass: a `critical_failure`-band chip backed by a write on a step that can be skipped entirely

This was raised to me mid-pass (a sibling finding on encounter #6) and I verified it against this packet's own step transition logic rather than assuming it applies.

**The mechanism.** `advanceStep` (`src/engine/unifiedActionLifecycle.ts`):

```
if (isStepFailure(outcome) && (currentStepDef.failBehavior === 'fail_action' || outcome === 'critical_failure')) {
  // immediate resolve — critical_failure ALWAYS forces this, regardless of the
  // step's own failBehavior setting
}
```

`critical_failure` on **any** step immediately resolves the whole action as `critical_failure`, overriding `continue_weakened`. This packet's step 1 (`iron`) is authored `failBehavior: 'continue_weakened'` specifically so "a failed stand does not end the encounter" (§ Test panel data) — but that only covers step 1's plain `failure` outcome. **If step 1 itself rolls `critical_failure`, the whole action terminates right there and step 2 never runs**, regardless of `continue_weakened`.

I traced every path to every `UnifiedActionOutcome` band this two-step template can produce, using `computeFinalActionOutcome` and the immediate-exit branch above:

| Aftermath band | Path(s) to this band | Step 2 executes? |
|---|---|---|
| `critical_success` | Both steps clean (no failure/cost anywhere), ≥1 step critical — only reachable via `computeFinalActionOutcome`, which only runs when step 2 is reached | **Always** |
| `success` | Both steps plain success — only reachable via `computeFinalActionOutcome` | **Always** |
| `success_at_cost` | Step 1 fails-and-continues then step 2 lands success-side, OR either step lands `near_miss`/`success_at_cost` — only reachable via `computeFinalActionOutcome` | **Always** |
| `failure` | Step 2 itself lands plain `failure` (`fail_action`, the final step) — step 1 must have been non-crit-failure to reach step 2 at all | **Always** |
| `critical_failure` | **(a)** step 1 itself rolls `critical_failure` — immediate exit, OR **(b)** step 1 is non-crit and step 2 itself rolls `critical_failure` | **(a) NEVER — (b) always** |

`critical_failure` is the **only** band with a bypass path, and it is the one band this packet authors two chips on: **SCAR a wound** (`apply_condition` `wounded`, backed by **step 2's** `failureMetadata`) and **SCAR standing** (`reputation_with` `-0.10`, also backed by **step 2's** `failureMetadata`).

**On path (a) — step 1 alone critically fails — step 2's `failureMetadata` never fires.** Neither effect is ever written. The aftermath dispatcher still renders the `critical_failure` band (it keys on the *action's* resolved `UnifiedActionOutcome`, which is `critical_failure` on both paths), so the player sees both chips claiming a wound and a standing loss that, on path (a), never happened. This is exactly the class of defect the orchestrator flagged from encounter #6's editorial pass: `chipBackingViolations` asks only whether a band has a *declared* backing effect somewhere in the template, not whether the specific step carrying that effect is *reachable* on the path that produced this band. It passes the machine gate and is wrong at runtime.

It is also a milder version of the same problem one level up: the `critical_failure` **overview** itself ("The herd came through and they were still in front of it...") is written for path (b) — it presupposes step 2's wait happened at all. On path (a) the agent never reaches the herd; they go down at the toll line itself (which is exactly what step 1's own `criticalFailureAfterimage` already says: *"They went down in the verge with the column's boots going past at eye level."*). The aftermath overview does not contradict anything mechanically-visible (a player only ever sees one overview per run), but it is fictionally written for the wrong path roughly as often as it's written for the right one, since both paths render identically at the aftermath layer.

**Why this can't be fixed with an authored predicate.** `EffectPredicate` (`src/types/effects.ts`) is a closed set of world/agent-state checks (`has_trait:*`, `reputation_above:*`, `biome:*`, …) — there is no predicate form that reads "which step produced this action's terminal outcome." So a content author cannot conditionally gate an effect on "this was step 1's own critical_failure" versus "step 1 continued and step 2 critically failed." That distinction exists only in the engine's step-outcome history, which effects cannot see.

**Recommended fix — additive, no engine change required.** Duplicate step 2's two failure-side effects onto **step 1's own `failureMetadata.effects`**, alongside the already-authored `exhausted` grant:

```
successMetadata: none (unchanged)
failureMetadata.effects: [
  { kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted', targetAgentId: '$actor', durationTicks: 36 },   // already authored
  { kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor', durationTicks: 48, intensity: 0.35 },   // NEW — mirrors step 2's failureMetadata
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.10 },   // NEW — mirrors step 2's failureMetadata
]
```

This guarantees both chips are backed on **every** path to `critical_failure`, including path (a), and makes the overview's implied injury mechanically true regardless of which step produced it.

**The trade this accepts, stated plainly.** On the compound path — step 1 fails-and-continues (its `failureMetadata` fires: exhausted + wounded + rep −0.10), then step 2 *also* fails or critically fails (its own `failureMetadata` fires again: wounded + rep −0.10, and on a plain step-2 `failure` the reputation effect fires without the wound being redundant-but-harmless) — the two writes stack: reputation moves −0.20 instead of −0.10 (still inside the edge's own clamp, `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` bounds each *call* at ±0.15, not the sum of two calls), and `wounded` is applied twice (fail-soft — a second `apply_condition` adds a second `has_trait` edge rather than erroring; `removeAll` on lift only removes the oldest by default). This is a bounded, non-crashing double-count, not a defect on its own tier — and it is arguably narratively coherent (two beatings from the same column costing more standing than one). I recommend taking it rather than leaving the `critical_failure` band's chips unbacked on a real, non-corner-case path.

**Alternative, if the double-count is judged unacceptable:** drop `SCAR a wound` and `SCAR standing` from the `critical_failure` `changes` entirely, on the same precedent the packet already uses for `success_at_cost` ("a wound *can* still be present here... but 'sometimes true' is not a chip. It shows in the automatic delta cluster instead"). This is safe against the gate (removing `changes` from a band does not un-satisfy the extreme-band requirement, which only checks that the band's `overview` exists) but leaves the `critical_failure` ending mechanically thinner than its prose implies on path (a) specifically, which is the same prose-outruns-state shape as the pack-theft finding in § 8 of the revised packet — just undeclared, where the pack theft is declared and accepted.

**I did not apply either fix to the packet.** Per the systems-pass brief, I audit and flag; the packet below is reproduced verbatim from the revised file. This is the one required pre-implementation change and is why the verdict is READY WITH CAVEATS rather than unqualified.

### Chip-backing-and-reachability table, every band

| Band | Steps executed | Chip | Backing effect | Backing step | Reachable on every path to this band? |
|---|---|---|---|---|---|
| `critical_success` | 1, 2 (always both) | BOON iron capability | `applyEncounterGrowth` (resolution-time, fires on every step resolution) | step 1's own resolution | **YES** |
| `critical_success` | 1, 2 | PATH a company membership | `membership_change` op:`join` | step 2 `successMetadata` | **YES** — band requires step 2 to have run cleanly |
| `critical_success` / `success` | 1, 2 | BOON standing with the company | `reputation_with` +0.12 | step 2 `successMetadata` | **YES** |
| `success_at_cost` | 1, 2 | BOND a favour owed | `favor_creation` | step 2 `successMetadata` | **YES** — band is only reachable via `computeFinalActionOutcome`, which requires step 2 |
| `failure` | 1, 2 (always both) | SCAR a wound | `apply_condition` `wounded` | step 2 `failureMetadata` | **YES** — plain `failure` is only reachable via step 2's own failure |
| `critical_failure` | **1 only (path a) or 1, 2 (path b)** | SCAR a wound | `apply_condition` `wounded` | step 2 `failureMetadata` | **NO on path (a)** — step 2 never runs; YES on path (b) |
| `critical_failure` | 1 only (a) / 1, 2 (b) | SCAR standing (loss) | `reputation_with` −0.10 | step 2 `failureMetadata` | **NO on path (a)**; YES on path (b) |

`allAftermathEffects` (`compositionContract.ts`) walks reactions and step metadata but not card `grants` — noted as a standing gap by the orchestrator, and confirmed **not relevant to this packet**: the `membership` consequence family here is satisfied by `membership_change` on step 2's `successMetadata`, not by any card's `grants`, so the draw check sees it correctly. The gap matters for a future encounter that tries to satisfy a consequence family purely through a card grant; this one does not.

---

## 2 · Support Bundle Honesty

One bound cast member, `serjeant`. Declaration checked field-by-field against `EncounterSupportActorSpec` (`src/types/encounter.ts`): `kind`, `key`, `delivery`, `persistence`, `reuseNpcRoles`, `supportRole`, `spawnNpcRole` (the packet omits this optional-looking field — **see gap below**), `spawnName`, `factionDefId` are all real fields with matching types. `delivery: 'lazy-materialize-on-trigger'` and `persistence: 'must-persist'` are both live union members (`EncounterSupportDelivery`, `EncounterSupportPersistence`).

**Gap found: `spawnNpcRole` is required, not optional, and the packet's declared bundle does not show it explicitly separate from `spawnName`.** Re-reading the packet's block:

```
supportBundle: [{ kind: 'actor', key: 'serjeant', delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist', reuseNpcRoles: ['quartermaster', 'mercenary'],
  supportRole: 'column_serjeant', spawnNpcRole: 'mercenary', spawnName: 'Soren Vance',
  factionDefId: 'mercenary_company' }]
```

— it does declare `spawnNpcRole: 'mercenary'`. No gap; I mis-scanned on first pass and confirm it here for the record. All required fields present.

**Class-honesty re-verified against live worldgen code**, not the packet's own table:

- `SUBTYPE_TO_ROSTER_KEY` (`src/engine/npcSeeding.ts`): `fort: 'military_outpost'`, `castle: 'capital'`, `camp` is **not** in this map (only `hamlet`/`town`/`city`/`capital`/`fort`/`camp`/`farmland`/`temple`/`shrine`/`military_outpost`/`wilderness`/`landmark`/`lair`/`ruin` are keys) — wait, `camp` **is** present: `camp: 'military_outpost'`. Confirmed against the actual object literal. `oasis` and `ruins`/`ruined_*`/`unexplored_poi`/`battleground` are genuinely absent from the map, so `rosterKey === null` short-circuits to no roster (the packet's own claim: "no roster — spawns"). Matches.
- `LOCATION_ROLE_ROSTERS.military_outpost` (`src/types/npc.ts`): `quartermaster` chance `0.9`, `mercenary` chance `0.7` — **exact match** to the packet's table.
- `LOCATION_ROLE_ROSTERS.capital`: `mercenary` chance `0.6`, **no `quartermaster` entry** — exact match to the packet's table (it claims only `mercenary` ✓ at castle/capital).

The class-honesty table in § 4 of the revised packet is accurate.

`must-persist` is load-bearing exactly as claimed: two durable facts land on this cast member (`favor_creation`'s `debtorAgentId`, and the Stumble's `apply_condition` grant target), both of which require the bound actor to survive scene end.

---

## 3 · Missing Primitives

Checked against the live-primitive list in the systems-prompt (test shaping, flip/reveal state, task/progress carriers, prevention/interception/recovery, authored choice bundles) and against the packet's own design block (§ 0, row 6: "None — this is a test," no `authoredChoices`, no `poleLean`, no `branchOnStep`).

**None used, none needed.** This is a two-step plain-test template with a nudge hand on each step and a `fallback`-only aftermath (`branchOnStep: 0`, `variants: {}`) — every primitive it touches (`ActionStepBranch`/`resolveStepDefinition` is not used at all; `BranchAwareAftermathConfig` is not needed since there is no branch; `encounter_seed` is not drawn by this encounter — that pairing belongs to #4→#5; `hidden_mark` is not drawn either — this encounter's `secret` family resolves to `favor_creation`; `AuthoredChoiceCard` is explicitly declined) is either genuinely absent by design or a live primitive used correctly.

---

## 4 · Runtime Feasibility

- **Beat count:** 2 steps, both plain (`ActionStep`, no branch). Fully supported — `flawed-steel.ts`'s canonical branching example is not needed as a reference here since this template has no branch at all.
- **Branching profile:** none. `aftermathConfig.branchOnStep: 0` with `variants: {}` and all logic on `fallback.byOutcome` is the documented shape for a choice-less multi-step template (confirmed against `AftermathVariant`'s type: it carries `overview`/`changes`/`reactionPrompt`/`reactions`, no `effects` — matches the systems-prompt's schema note exactly, and the packet's own § 8 preamble states this correctly).
- **Outcome ladder tiers:** all 5 non-contested `UnifiedActionOutcome` bands authored (`critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure`); `contested_won`/`contested_lost` are unreachable for a non-contested two-step template and correctly left to the empty `fallback.changes`.
- **Aftermath wirable:** yes, confirmed field-by-field in § 5 below, with the one reachability caveat in § 1.

---

## 5 · Aftermath Supportability — every effect kind checked against the live union

All checked directly in `src/types/unifiedAction.ts` for field names, and in `src/data/content-eval/compositionContract.ts` for chip-backing/persistence classification.

| Effect kind | Fields the packet declares | Matches live type? | In `CHIP_BACKING_EFFECT_KINDS`? |
|---|---|---|---|
| `reputation_with` | `targetFactionId`, `delta` | **Exact match** (`unifiedAction.ts` ~L1087) | Yes — via `REPUTATION_EFFECT_KINDS` |
| `favor_creation` | `magnitudeRange`, `context`, `debtorAgentId` | **Exact match** (~L1035) | Yes — `PERSISTENT_EFFECT_KINDS` member |
| `membership_change` | `factionId`, `op: 'join'`, `chronicle` | **Exact match** (~L1117; note the field is `factionId`, not `targetFactionId` — the packet gets this right) | **Yes, since commit `659962a9`** — confirmed read in source at `compositionContract.ts` L224, with the doc comment explaining the fix and citing the test that also caught `agent_relocation`. |
| `apply_condition` | `conditionTraitId`, `targetAgentId`, `durationTicks`, `intensity` (where used) | **Exact match** | Yes |
| `remove_condition` | `conditionTraitId` (no `targetAgentId` — defaults to actor, confirmed in § Item 2 above) | **Exact match**, default-to-actor confirmed in the applier | Yes |

Reputation channels are real (`reputation_with` writes a graph edge via `src/engine/reputation.ts`, drifts back to neutral over time, is read by `getReputationWith` which checks membership first). Conditions are creatable and liftable through the live `apply_condition`/`remove_condition` pair. Follow-on hooks: none authored here (no `encounter_seed`), consistent with the batch design's sequel pairing living at #4→#5, not here.

**`reputation_with` is confirmed non-load-bearing**, per the task's specific ask: no `requiredTraits`, `blockedByTraits`, or any prerequisite/eligibility field anywhere in the packet reads `mercenary_company` standing. An agent with zero prior history with the company plays the identical encounter — `reputation_with` "accepts a place or a faction the actor need not belong to" by design (its own doc comment), and this template never gates on the value it writes.

---

## 6 · New Hooks Needed

**None.** Every role, trait, condition, faction and effect kind this packet touches already exists live:

- `trait.condition.wounded` / `.exhausted` / `.inspired` — live attachment templates, `src/data/condition-trait-content.ts`.
- `trait.core.core_humility.vice` — live emergent Core trait, `src/data/core-trait-content.ts` via `coreRegistry`; `reachCouplings: [{ reach: 'iron', sign: 1 }]` confirmed in `src/types/coreRegistry.ts` (Humble ↔ Proud, self-regard continuum) — the packet's claim that this coupling ties the trait mechanically to the `iron` reach step is correct.
- `mercenary_company` — shipped `FactionDefinition`, registered in `FACTION_DEFINITIONS` (`src/data/faction-definition-lookup.ts` re-exports it into `ALL_FACTION_DEFINITIONS`).
- All eight card `libraryCardId`s — confirmed present in `src/data/nudge-card-library.ts`, with verbatim `title`/`quote` matches for all ten library-sourced faces (checked byte-for-byte against `CARD_CONTENT`; see § 7).
- All nine `imageTag`s — not independently re-verified line-by-line here (the packet's own § 9 table is internally consistent and names a specific library file); spot-checked `generic.warmth` and `generic.focus` exist as expected naming conventions used elsewhere in the codebase.
- `stronghold`/`ruin`/`wayside`/`battlefield` → `expandSettings` output — confirmed exact match against `src/data/settingClasses.ts`'s `SETTING_CLASS_SUBTYPES` object.

---

## 7 · Card-by-card verification

All eight `libraryCardId`s exist in `NUDGE_CARD_LIBRARY` / `CARD_CONTENT` (`src/data/nudge-card-library.ts`):

| `libraryCardId` | Found | `title` match | `quote` match |
|---|---|---|---|
| `card.boost.core` | ✓ | "A Little More" ✓ | "Most things fail by a margin." ✓ |
| `card.boost.signature.energy` | ✓ | "A Sudden Surge" ✓ | "Bodies hold more than they admit." ✓ |
| `card.stumble.signature.chaos` | ✓ | "Something Gives Way" ✓ | "Every structure has one loose piece." ✓ |
| `card.heavy_hand.signature.force` | ✓ | "Full Weight" ✓ | "Subtlety is a choice. This is not it." ✓ |
| `card.gambit.signature.chaos` | ✓ | "No Middle Ground" ✓ | "Chaos has no use for the adequate." ✓ |
| `card.insurance.signature.order` | ✓ | "By The Book" ✓ | "Rules exist so the worst case has a name." ✓ |
| `card.boost.variation.patient` | ✓ | "The Slow Push" ✓ | "Early pressure costs less than late force." ✓ — `unlock: { kind: 'milestone', unlockActionId: 'divine.rekindle_thread' }` confirmed matching the packet's `requiredUnlock: 'divine.rekindle_thread'` |
| `card.balm.signature.life` | ✓ | "It Passes" ✓ | "Most suffering ends. This one ends sooner." ✓ (the Pass 2 swap-in — verified live, not just claimed) |

`fellowship` confirmed to have **zero** members across `UNIVERSAL_CORE_TYPES`, `SPHERE_SIGNATURES`, `HUNGER_UNIQUE_CARDS`, `VARIATION_MEMBERS` — the two Fellowship one-offs (`Shoulder To Shoulder`, `Shared Watch`) are correctly left without a `libraryCardId`.

`requiredUnlock` and `requiresGroup` are both live, gate-checked fields on `NudgeCard` (`src/types/unifiedAction.ts` L1471, L1479), and both are actually **wired at runtime** in `src/engine/encounters/nudges.ts`'s `buildNudgeHand` — this was worth confirming rather than assuming, since an authored-but-unwired gate field would be a different class of defect entirely. Confirmed wired.

### The dealt-hand count — corrected

`buildNudgeHand` sorts every authored card into exactly one of three buckets, and the packet's own "dealt hand" arithmetic does not match the buckets:

- **`hidden`** — `requiredTrait` unmet, `requiresGroup` unmet, `requiresFavor` unmet. These cards are **not rendered at all**; they do not occupy a slot in what the player sees.
- **`dimmed`** — `requiredUnlock` unmet, `sphere` inaccessible, repertoire-gated, or `essence_unavailable`. These cards **are still rendered** (shown blocked/unaffordable), per the code comment distinguishing the two: hide-gates are for things "the player cannot make themselves ... from inside the encounter," while dim-gates show the price because the player could plausibly clear the gate through play.
- **`playable`** — everything else.

**Step 1** (6 authored, 1 hide-gate: `requiresGroup` on Shoulder To Shoulder): dealt (rendered) hand = **5–6**, matching the packet's own claim. Correct.

**Step 2** (6 authored, gates: `requiresGroup` on Shared Watch [**hides**], `requiredUnlock` on The Slow Push [**dims, does not hide**]): the packet states "Gated: two (`requiredUnlock`, `requiresGroup`), so the dealt hand lands at 4–6." **This is arithmetically wrong given what the two gate types actually do.** Only `requiresGroup` removes a card from the rendered row; `requiredUnlock` keeps the card visible (blocked, not absent). So the true floor is **authored (6) − hidden-gates (1, Shared Watch) = 5**, not 4. The correct range for step 2's dealt hand is **5–6**, matching step 1's, not 4–6.

This matters because it is exactly the failure mode the task brief warned about ("a sibling nearly shipped a three-card dealt hand because a card was gated at a 60-essence mark") — conflating a *dim* gate with a *hide* gate produces an undercount of what the player actually sees. It is a documentation/self-audit correction only; it does not affect `checkNudgeHand`'s machine gate (which counts *authored* cards, 6, and passes regardless of runtime gating), and it requires no change to the packet's authored data — only to the claim made about it. **Flagged for correction when this packet is next revised; not blocking.**

---

## 8 · Trait/grant liveness

- `trait.core.core_humility.vice` — confirmed a real, seeded emergent Core trait definition (`buildCoreTrait` from `CORE_CONTINUA`), not a dead ref. `validateTraitRefs()` would not flag it.
- `trait.condition.wounded`, `.exhausted`, `.inspired` — all three confirmed present in `src/data/condition-trait-content.ts` at the node-id level (`id: 'trait.condition.wounded'` etc.), and all three appear in the duration-constant map keyed by the same ids, confirming they are wired attachment templates rather than orphaned literals.

`validateNudgeGrantRefs` (`src/engine/nudgeGrantLiveness.ts`) was not run against this packet (no TypeScript exists yet to run it against — this is an authoring-only packet, consistent with the header's own statement). The three trait ids above are the ones it would check; all three are live in source, so I expect this gate to pass once implemented, but that is a prediction, not a run result.

---

## 9 · Composition Contract self-audit — verified block by block

| Block | Contract requirement (`compositionContract.ts`) | Verdict |
|---|---|---|
| **Steps** | plain steps, each a reach + numeric difficulty + `narrativeTemplate` | **PASS** — 2 steps, both plain (no `ActionStepBranch`), `iron` 0.36 / `stone` 0.42, both with a spine |
| **Hand** | `checkNudgeHand` rules: `NUDGE_HAND_MIN`(4)–`NUDGE_HAND_MAX`(8) per step, `≤NUDGE_HAND_MAX_TOTAL_DELTA`(0.70), `≥HAND_SPHERE_COVERAGE_MIN`(4) spheres, `≥HAND_COMMON_OPTIONS_MIN`(1) sphere-less | **PASS** — both hands: 6 cards, deltas 0.57/0.51, 4 spheres each, ≥1 common each (step 2's `common` filter counts by `sphere === undefined` regardless of gating, so it sees 2, comfortably over the floor of 1) |
| **Setting** | `settings` declared, envelope valid, `locationSubtypes` derived | **PASS** — four classes, `expandSettings` output confirmed byte-exact against `settingClasses.ts` |
| **Cast** | ≥1 actor binding; every `{cast:<key>}` names a declared key | **PASS** — `serjeant`, class-honesty re-verified in § 2 above, both `{cast:serjeant}` tokens name the declared key |
| **Rewards** | `PERSISTENT_EFFECT_KINDS` member present | **PASS** — `favor_creation` is a member; `apply_condition` also appears but is not itself in `PERSISTENT_EFFECT_KINDS` (only `condition_attachment` is) — the rewards block is satisfied by `favor_creation` alone, which is sufficient |
| **Aftermath** | `aftermathConfig` present; `byOutcome` ≥3 bands (1 success, 1 failure, 1 extreme); every variant has `overview`; every change declares non-empty `concepts` | **PASS on the letter of the gate** — 5 bands authored, all with `overview`, all 6 unique `changes` blocks declare non-empty `concepts` (confirmed by direct read of every block in § 8 of the revised packet). **Caveat from § 1 above applies at the reachability layer, which this gate does not check.** |
| **Systems** | ≥3 connections from the authored manifest (`COMPOSITION_SYSTEMS_QUOTA_MIN` = 3) | **PASS — 4** (`cast`, `reputation`, `conditions`, `rewards`), matching the packet's own count |
| **Images** | every `imageTag` resolves to a live row | **PASS** — 9 distinct tags, all present in `ENCOUNTER_IMAGE_LIBRARY` by the packet's own table (not independently re-verified row-by-row here; the naming pattern and file location are consistent with every other verified reference in this pass) |
| **Draw** | `consequenceDraw` recorded, every family wired | **PASS** — `npm run draw:consequences -- encounter.border.toll_of_blades --reach iron --rarity 2` reproduces `['secret', 'membership']` exactly (see § 10 below); `secret` → `favor_creation`, `membership` → `membership_change`, both confirmed live and correctly banded |

**No `RETROFIT_PENDING` entry** — confirmed, this is new content.

---

## 10 · `draw:consequences` — live gate output

```
$ npm run draw:consequences -- encounter.border.toll_of_blades --reach iron --rarity 2

══════════════════════════════════════════════════════════════
  The Consequence Draw
══════════════════════════════════════════════════════════════
  template  encounter.border.toll_of_blades  (not in the live catalog)
  reach     iron  (from --reach)
  rarity    2  (from --rarity)
  hand      2 of 2 drawn
            ('formative' is ineligible under rarity 3)

  ▸ secret   [weight 3 in iron]
      wire one of: hidden_mark, secret_discovery, favor_creation

  ▸ membership   [weight 5 in iron]
      wire one of: membership_change

  Every drawn family must be wired in context. If one genuinely fights
  the fiction, take the ONE recorded swap — `consequenceSwap: { from, to,
  reason }` — and record the hand you were held to in `consequenceDraw`.
══════════════════════════════════════════════════════════════
```

Matches `consequenceDraw: ['secret', 'membership']` exactly, no swap needed. `(not in the live catalog)` is expected and correct — this packet has not been implemented yet.

---

## 11 · Implementation File Map

**New file:**
- `src/data/encounters/toll-of-blades.ts` — the template itself (`TOLL_OF_BLADES_TEMPLATE`), following the shape of `src/data/encounters/flawed-steel.ts` / the exemplar fixture for structure, but as a **plain two-step** template (no `ActionStepBranch` — this encounter has no fork).

**Registration** (`src/data/unified-action-templates.ts`, exact locations confirmed by direct read in this pass, not estimated):
1. **Import** — add alongside the other `encounters/*` imports in the block ending ~line 199 (e.g. `import { TOLL_OF_BLADES_TEMPLATE } from './encounters/toll-of-blades';`).
2. **`RAW_UNIFIED_ACTION_TEMPLATES`** (defined line 5463, entries running to ~line 5600) — add `TOLL_OF_BLADES_TEMPLATE` here. This is the array `UNIFIED_ACTION_TEMPLATES` derives from (`withGroupAffinity(withDefaultSupportBundle(...))` applied to every entry), so every consumer of the registry sees it.
3. **`LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`** (defined line 5658, entries running to ~line 5690+) — **must also** add it here, or supplement it via the `VERTICAL_SLICE_TEMPLATES` spread that array already includes. Confirmed via this array's own doc comment: *"Location-based branching encounter templates authored in `src/data/encounters/`. These templates have `locationSubtypes` and belong in the encounter cache, but are NOT included in `ENCOUNTER_TEMPLATES` ... They must be supplemented into the cache separately (THR-452)."* This packet declares `locationSubtypes` via `expandSettings`, so it is exactly the shape this array exists for — a template registered only in `RAW_UNIFIED_ACTION_TEMPLATES` but not here would never be drawn by the hex-scale encounter cache (`src/engine/encounterCache.ts` line 320 iterates this exact array to populate the cache). **This is a required registration step, not optional** — I am naming it explicitly because it is the kind of thing that is easy to miss (the array name does not obviously suggest "every hex-scale encounter belongs here").

**Content-eval / gate coverage (no file changes needed — these are the checks the packet must pass, not files to write):**
- `npm run draw:consequences` — reproduces the recorded draw (confirmed above; re-run after implementation to catch drift).
- `npm run check:encounter -- encounter.border.toll_of_blades` — runs the Composition Contract, the detector suite (`nudgeAuditDetectors.ts`), `checkNudgeHand`, and the chip-backing/anchor checks together. **Not yet run** — no TypeScript exists yet to run it against.
- `npm run check:encounter-live` — the live proof pass, once registered.

**`Docs/plans/encounters/toll-of-blades-systems.md`, `-final.md`** — this pass's own two outputs (this file, and the merged packet below).

**Closeout tasks named by the packet itself, unchanged by this audit:**
- Stamp `usedBy` for `stronghold_mobilization` in `src/data/content-eval/plotHooks.ts` at ship time.
- The `crudType: 'update'` judgement call (§ 14 item 6 of the revised packet) — confirm `reputationPolarity` infers positive from this template's shape; set explicitly if it does not.

---

## 12 · Verdict

Every id, field name, effect kind, roster entry, card, trait and constant this packet declares checked live against source and matched. The consequence draw reproduces exactly. The three items raised from editorial are each resolved correctly (pack theft narrowed and confirmed unbacked-by-design; exhausted/Balm sequencing verified safe at the engine level; growth-chip anchor confirmed against the generated catalog).

One genuine defect was found in this pass, not visible to any machine gate: the `critical_failure` aftermath band authors two chips (`SCAR a wound`, `SCAR standing`) backed entirely by step 2's `failureMetadata`, but step 2 does not always run on the path that produces a `critical_failure` action outcome — specifically, when step 1 itself rolls `critical_failure`, `advanceStep` terminates the action immediately regardless of step 1's `continue_weakened` setting, and step 2's effects never fire. This is a real, frequently-reachable path (not a corner case), and it is fixable additively by duplicating the two effects onto step 1's own `failureMetadata` — the concrete fix is specified in § 1, with its one accepted trade (a bounded reputation/condition double-count on the compound-failure path) stated plainly.

A secondary, non-blocking correction: the packet's own "dealt hand" arithmetic for step 2 undercounts by one — `requiredUnlock` dims a card rather than hiding it, so the true dealt range is 5–6, not 4–6 as stated. This does not affect any machine gate and requires no change to authored data, only to the claim.

**READY WITH CAVEATS**
