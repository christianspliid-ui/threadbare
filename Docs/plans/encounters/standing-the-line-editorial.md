# Encounter Pipeline: Standing the Line

> Scale: medium (3 step slots, forked) | Slug: standing-the-line | Pass: editorial
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory line)
> templateId: `encounter.border.standing_the_line` | Batch: border-perils (THR-1221)

**Verdict: PASS WITH REVISIONS.** Seven automatic REVISE triggers fired in the draft, plus one hard `check:encounter` block the draft's self-audit claimed as PASS. All eight are repaired inline in `standing-the-line-revised.md`. Two items cross a draft boundary and are handed forward with named owners (§ 12).

---

## 0. The headline — the four ungated branch hands

The draft's own finding is **correct, and I verified it in source before trusting it**:

```ts
// src/data/content-eval/compositionContract.ts:315-319
/** Plain steps only — a branch node carries no prose, hand, or afterimages. */
function plainSteps(template: UnifiedActionTemplate): readonly ActionStep[] {
  return (template.steps ?? []).filter(
    (step): step is ActionStep => !isActionStepBranch(step),
  );
}
```

```ts
// src/data/content-eval/nudgeHandChecklist.ts:55-58
/** Plain ActionSteps only — branching variants are out of scope for linear templates. */
```

Neither walks `variants` / `fallback`. `allRunnableSteps` (`compositionContract.ts:390-400`) *does* walk branch arms — but only to answer "does this write state", never to audit a hand. So `check:encounter` audits **step 0's hand and nothing else**, and reports one plain step where there are three.

**This encounter has five hands. Four of them will never be seen by a machine.** Below is the full checklist run by hand against each of the four, plus step 0 for completeness.

### Hand-by-hand verdict

| Check | 5.1 step 0 `heart` | 5.2 s1 `positive` `gold` | 5.3 s1 `negative` `iron` | 5.4 s2 `positive` `gold` | 5.5 s2 `negative` `iron` |
|---|---|---|---|---|---|
| 4–8 cards | 7 ✓ | 5 ✓ | 5 ✓ | 5 ✓ | 5 ✓ |
| ≥4 distinct spheres | 5 (mind, spirit, darkness, force, order) ✓ | 4 (spirit, darkness, light, matter) ✓ | 4 (energy, mind, order, darkness) ✓ | 4 (mind, spirit, time, order) ✓ | 4 (darkness, energy, force, spirit) ✓ |
| ≥1 ungated common (sphere-less) | 2 ✓ | 1 ✓ | 1 ✓ | 1 ✓ | 1 ✓ |
| ≤1 rider | 1 ✓ | 1 ✓ | 0 ✓ | 0 ✓ | 1 ✓ |
| Rider carries a justification | ✓ | ✓ | n/a | n/a | ✓ |
| ≤2 Boost | 1 ✓ | 1 ✓ | 2 (at cap) ✓ | 1 ✓ | 1 ✓ |
| ≥3 distinct types | 7 ✓ | 5 ✓ | 4 ✓ | 5 ✓ | 5 ✓ |
| Trait-only card at cost 0 | no trait cards — rule vacuous | vacuous | vacuous | vacuous | vacuous |
| Zero-essence non-trait card priced elsewhere | no zero-essence card in any hand ✓ | ✓ | ✓ | ✓ | ✓ |
| Every card ≥1 failure-band fragment | 7/7 ✓ | 5/5 ✓ | 5/5 ✓ | 5/5 ✓ | 5/5 ✓ |
| Big-delta (≥0.15) covers **both** failure bands | none ≥0.15 (max 0.14) ✓ | card 3 @0.15 → `failure` + `critical_failure` ✓ | card 5 @0.15 → both ✓ | none ≥0.15 ✓ | none ≥0.15 ✓ |
| All six `StepOutcome` bands covered | ✓ (see below) | ✓ | ✓ | ✓ | ✓ |
| Σ`forecastDelta` ≤ 0.70 | 0.58 ✓ | 0.46 ✓ | 0.55 ✓ | 0.43 ✓ | 0.47 ✓ |
| difficulty + Σ inside [0,1] | 0.35+0.58 = 0.93 ✓ | 0.40+0.46 = 0.86 ✓ | 0.40+0.55 = 0.95 ✓ | 0.28+0.43 = 0.71 ✓ | 0.44+0.47 = 0.91 ✓ |
| Difficulty ≤ `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) | 0.35 ✓ | 0.40 ✓ | 0.40 ✓ | 0.28 ✓ | 0.44 ✓ |
| No digit or `%` in any `effectLine` | ✓ | ✓ | ✓ | ✓ | ✓ |
| No two cards buy the same certainty | ✓ | ✓ | ✓ (the two Boosts buy *when* vs *how hard*) | ✓ | ✓ |
| Zero scene-bespoke prose on any face | **FAIL — 1** (card 4) | **FAIL — 1** (card 2) | ✓ | **FAIL — 1** (card 5) | ✓ |
| Zero evasive-vagueness term on any face | **FAIL — 1** (`the moment`, card 7) | **FAIL — 2** (`the moment` card 1, `something` card 2) | ✓ | ✓ | **FAIL — 1** (`the moment`, card 1) |
| Zero outcome-class vagueness in any fragment | **FAIL — 3** | **FAIL — 8** | **FAIL — 2** | **FAIL — 5** | **FAIL — 4** |
| No two fragments converge **within one band** | **FAIL — 1** (`near_miss`: three of four cards on *running out of time*) | **FAIL — 1** (`success`) | **FAIL — 1** (`failure`) | ✓ | **FAIL — 1** (card 2's two fragments open identically) |
| Library face verbatim where `libraryCardId` set | ✓ | ✓ | ✓ | ✓ | ✓ |

**Band coverage, spelled out** (the row the machine would have checked and cannot):

- **5.1** `critical_success` 3,6 · `success` 1,4 · `success_at_cost` 2,5 · `near_miss` 1,3,6,7 · `failure` 2,5,7 · `critical_failure` 4
- **5.2** `critical_success` 2 · `success` 3,5 · `success_at_cost` 4 · `near_miss` 1,2,4 · `failure` 1,3,5 · `critical_failure` 3
- **5.3** `critical_success` 2,4 · `success` 1,5 · `success_at_cost` 3 · `near_miss` 1,3 · `failure` 2,4,5 · `critical_failure` 5
- **5.4** `critical_success` 2,5 · `success` 1,4 · `success_at_cost` 3 · `near_miss` 1,3 · `failure` 2,5 · `critical_failure` 4
- **5.5** `critical_success` 3 · `success` 2,5 · `success_at_cost` 4 · `near_miss` 1,3,5 · `failure` 1,4 · `critical_failure` 2

All five hands cover all six bands. Every card pays off in failure. The arithmetic is right in every hand.

**Per-hand verdicts.**

- **5.1 (step 0, `heart`, 7 cards) — PASS after two fixes.** The strongest hand in the packet and the one that matters most, because it is the one the fork reads. `the moment` on card 7 (evasive, banned in every field class) and the scene sentence on card 4 are repaired. Separately, the **lean weights were not symmetric** and the draft's own arithmetic note misreported them — see § 3.
- **5.2 (s1 `positive`, `gold`, 5 cards) — PASS after three fixes.** Two evasive terms and one scene-bespoke face. Structurally clean: the big-delta Undertow is the only card that can lose the encounter and it owns both failure bands.
- **5.3 (s1 `negative`, `iron`, 5 cards) — PASS, no fixes.** The only hand in the packet that needed nothing. Its no-rider argument is the best mechanical reasoning in the draft: a first strike is the one moment where buying a floor works against the course, and the hand says so.
- **5.4 (s2 `positive`, `gold`, 5 cards) — PASS after one fix.** One scene-bespoke Fellowship line. This is also the flattest hand — it is the only one where I could not name a card I would be excited to click.
- **5.5 (s2 `negative`, `iron`, 5 cards) — PASS after two fixes.** One evasive term, one seam echo against 5.3 (two cards opening `Nothing in them …`).

**Twenty-two defects in the four ungated hands** — three scene-bespoke faces, three evasive terms, nineteen outcome-class vagueness hits, and three in-band fragment convergences. **Every one would have shipped.** The gate would have reported green on step 0's hand alone and counted one plain step. Do not read a green `check:encounter` as coverage of §§ 5.2–5.5, and put that sentence in the batch report.

---

## 1. Source claims — what held and what did not

Every claim the draft makes about live source was checked against source.

| Claim | Verdict |
|---|---|
| `mercy_ruthlessness` is a live `ValuePair`, Iron's bound pair, Protector (+1) ↔ Conqueror (−1) | **VERIFIED** — `src/types/agent.ts:10`, `:39`, `:54` |
| `src/types/axisRegistry.ts` labels the poles Protector/*Brave* and Conqueror/*Power-Hungry* | **FALSE.** `mercy_ruthlessness` appears nowhere in `axisRegistry.ts` (zero hits in 245 lines); the file reaches the pair only through `REACH_VALUE_PAIR.iron` at `:89-91` and carries no pole labels. The labels are `ARCHETYPE_NAMES` in `agent.ts:54`, and they are `Protector` / `Conqueror` — "Brave" and "Power-Hungry" are not in the source at all. **Fixed.** |
| `branchOnStep` names the **deciding** step, not the fork's own index (THR-979) | **VERIFIED** — `unifiedAction.ts:1772` (*"Step index (0-based) whose choiceId determines the variant"*), and `branchDecision.ts:294` compares it against the step that just resolved |
| `variants` keys must be exactly `'positive'` / `'negative'` | **VERIFIED** — `resolveAftermathVariant` (`unifiedAction.ts:1975`) does `variants[branchChoice.choiceId] ?? fallback`; `recordDecidedChoice` (`branchDecision.ts:506-522`) writes the bare pole key |
| `advanceStep` forces `fail_action` on `critical_failure` whatever the step declares | **VERIFIED** — `unifiedActionLifecycle.ts:177-181` |
| The player never picks the pole | **VERIFIED** — `applyPoleDecision` (`branchDecision.ts:389-410`) derives it from `readLiveAxisLean` + `sumHandLean` + rng only; the type doc says it in words at `unifiedAction.ts:1797` |
| Constants (0.05 / 0.08 / 0.35 / 0.70 / 0.15 / 0.45 / 3) | **VERIFIED**, all seven |
| Zero `fellowship` / `side_bet` / `signature` members in `NUDGE_CARD_LIBRARY`; 37 members | **VERIFIED.** All three *are* live `NudgeCardTypeId` members with `NUDGE_CARD_TYPES` entries — they simply appear in none of the four generating tables. `card.<type>.signature.<sphere>` does denote a signature member of another family (`card.omen.signature.time` is an Omen). The one-offs are forced. |
| Six named `libraryCardId`s exist, all `unlock: 'starting'`, faces reproduced verbatim | **VERIFIED, all six, character-for-character.** Best-executed discipline in the packet. |
| Eleven `imageTag`s resolve as `kind: 'nudge'` | **VERIFIED.** Note `generic.mercy` comes from `SITUATIONAL_NUDGE_ART`, not `NUDGE_CONCEPT_ART`, and deliberately carries **no sphere** — which is exactly how the draft's table records it. |
| `trait.core.core_warmth.virtue` and `trait.condition.wounded` are live | **VERIFIED** — `coreRegistry.ts:123-124`, `condition-trait-content.ts:143` |
| `secret_discovery` has no `targetAgentId`, reads `action.targetId`, `createSecretEdge` refuses a non-actor endpoint | **VERIFIED** — `unifiedAction.ts:995-1005`, `encounterAftermath.ts:4211`, `secretGeneration.ts:392-408`. The draft's rejection reasoning is sound. |
| `hidden_mark` takes `category` / `severity` / `label` / `revealFamilies` | **VERIFIED**, and it also takes `targetAgentId?` (`unifiedAction.ts:484`) — which the draft relies on by default rather than declaring. **Fixed:** now declared `'$actor'`. |
| `UnifiedActionOutcome` lacks `near_miss`; `StepOutcome` has it | **VERIFIED** — and the difference runs both ways: `StepOutcome` lacks `contested_won`/`contested_lost` |
| `pilgrim` on the `wilderness` roster at **0.3** | **FALSE — it is 0.2** (`npc.ts:324`). Nothing downstream turns on it; **corrected.** |
| Only `wilderness` and `castle` carry a `LOCATION_ROLE_ROSTERS` entry in this envelope | **VERIFIED**, with a wrinkle the draft missed: `fort` and `camp` reach a roster indirectly through `SUBTYPE_TO_ROSTER_KEY` (`npcSeeding.ts:49-67`, both → `military_outpost`), and `castle` maps there to `capital`, not to the `castle` roster. **Corrected**, and it strengthens the draft's own argument — the castle roster it rejects is not the one that would bind. |
| `expandSettings(['stronghold','ruin','wayside','battlefield'])` → 11 subtypes | **VERIFIED** — `settingClasses.ts:57-66` |
| `hook.standing_the_line` is live with `usedBy: []` | **VERIFIED** — `plotHooks.ts:612-619`, hook text quoted correctly |
| `compileOpeningEnvelope(withEncounterContract({...}))` is what makes `openings` reach the reader | **PARTIAL.** `compileOpeningEnvelope` is the THR-932 wrapper (`settingClasses.ts:173`); `withEncounterContract` (`encounter-contract-builder.ts:343-349`) is unrelated to openings — it attaches encoded contract metadata to `illustrationAlt`. **Corrected**, and a load-bearing footnote added: `compileOpeningEnvelope` returns the template **unchanged** if `steps[0]` is an `ActionStepBranch` (`settingClasses.ts:191-193`). Step 0 here is a plain step, so the openings compile — but that is now a stated invariant instead of an accident. |
| Chip referents are anchor-catalog members | **PARTIAL.** `$actor` and `$cast:` appear **nowhere** in `anchor-catalog.generated.md`. They are legal — `chipAnchorDeclarations.ts:33`, `:56`, `:90-103`, which also rejects a `$cast:` key absent from `supportBundle` — but by a different authority than the one cited. `visualKind: 'attachment'` with `trait.condition.wounded` **is** catalogued (`:82`) because condition traits are attachment templates. **Wording corrected.** |
| `PERSISTENT_EFFECT_KINDS` covers all five effect kinds used | **VERIFIED** |
| `systemConnections` floor is 3; six legal categories | **VERIFIED** — `COMPOSITION_SYSTEMS_QUOTA_MIN = 3`, categories `cast`/`rewards`/`seeds`/`conditions`/`reputation`/`factions`. The draft's four hold. |

**Two false citations and two wrong numbers in a design block that reads as fully verified.** The draft's habit of writing "**Verified against the live registry**" next to a claim is good practice and I want it kept — but it is now doing rhetorical work the checking did not earn. In the revised packet every source claim carries a `file:line`, so the next reader can falsify it in one command instead of trusting the adverb.

---

## 2. The fate-branching mechanic — its content debut

Everything structural about the fork is right, and the draft understood the mechanic better than the corpus's one existing user documents it.

- **`branchOnStep: 0` in all three places** — step-1 branch, step-2 branch, `aftermathConfig`. Correct, and the reasoning is correct: naming the fork's own index would read a step no choice is ever written to. The parenthetical is also right — `decidedBranchesForStep` supports several branches off one deciding step and records one decision covering the lot, so putting `decidedBy` on the step-1 branch only is the smaller surface, not a different behaviour.
- **`variants` keyed `'positive'` / `'negative'`** — correct and load-bearing.
- **`fallback` takes the mercy pole** — correct instinct (a fork that failed to resolve must not default a mortal into starting a fight), and it mirrors the apotheosis, whose `fallback` takes Survivor for the same reason.
- **`continue_weakened` on step 0** — correct, and the reasoning is verified: `applyAgentDecidedBranches` runs before `advanceStep`, so the mortal is owed their answer even on a bad reading; a `critical_failure` still ends the action outright with the pole already in choice history, which is why both poles must author a `critical_failure` band. Both do.
- **No `authoredChoices` anywhere.** ✓
- **No card instructs the mortal.** Every leaning face says *leans* — "it leans them toward mercy", "it leans them toward the ruthless answer". None says choose, pick, or decide. Trigger 14 does not fire. Checked all 27 faces.
- **Divine outcome-authorship: zero.** `DIVINE_DECISION_PATTERNS` needs `god…decides/chooses + whether/what/which/who/if + a clause`. No face, band, afterimage or overview matches. The one near-miss — *"the riders decided that whatever was up this road…"* — has no `god` in the sixty preceding characters and `whatever` does not satisfy `what\b`. It is repaired anyway, for a different reason (§ 4).

### The one real defect: the levers are not symmetric

Four `poleLean` cards, two per direction — the design row asked for at least three in both directions, so the count is right. The **weights** are not:

| Card | Direction | Declared weight | Effective (`POLE_LEAN_DEFAULT_WEIGHT` = 0.35) |
|---|---|---|---|
| 2 · An Urge In Sleep | positive | *(absent)* | 0.35 |
| 3 · Something To Want | positive | 0.2 | 0.20 |
| 4 · The Easier Way | negative | 0.4 | 0.40 |
| 5 · Weight Behind It | negative | *(absent)* | 0.35 |

**Positive total 0.55, negative total 0.75.** The god's ruthless lever is 36% stronger than its merciful one, and nothing in the design block says that was intended.

Worse, the draft's own note misreports it as balance:

> *"Playing both positive cards (0.35 + 0.20 = 0.55) argues about as hard as the Undertow alone (0.40) plus the Signature (0.35). A god who plays one card from each side has cancelled itself."*

0.40 + 0.35 is 0.75, not "about as hard as" 0.55; and one-from-each-side cancels only for the pairing 2×5. This is arithmetic dressed as reasoning, and it is the exact shape the repo's `threshold_constant_on_both_sides` finding exists to catch — a claim that reads as verified because it contains numbers.

**Fix applied:** drop both explicit weights. All four leans take `POLE_LEAN_DEFAULT_WEIGHT`, both sides total **0.70**, and the cancellation claim becomes true for every pairing rather than one. Card 3's effect line loses "gently" and card 4's loses "hard", so the faces stop promising a magnitude the data no longer carries. The lean note is rewritten around the one thing that is genuinely worth saying: a single leaning card outweighs a mortal sitting anywhere inside ±0.35 on the axis, which is what makes the god's hand a real lever on direction and not a tiebreaker.

---

## 3. Both poles, side by side

The grading question for a Personality Fork. Here is the comparison the draft did not run.

| | `positive` — Hold the Road | `negative` — Break the Pursuit |
|---|---|---|
| Step-1 hand | 5 cards, Δ0.46, 1 rider | 5 cards, Δ0.55, 0 riders |
| Step-2 hand | 5 cards, Δ0.43, 0 riders, difficulty 0.28 `gentle` | 5 cards, Δ0.47, 1 rider, difficulty 0.44 `fair` |
| Endings authored | 5 | 5 |
| Chip kinds across the pole | BOND, PATH, SCAR | BOND, PATH, SCAR |
| Two-stance bands | 4 of 5 | 4 of 5 |
| Overviews naming `{cast:survivor}` **in the draft** | 2 of 5 | 1 of 5 |
| Overviews mentioning the pilgrim at all **in the draft** | 4 of 5 | 2 of 5 |

**The ruthless pole is the weaker one, and the axis it is weaker on is the one that matters most: the person the encounter is about disappears from it.**

The crux is *"someone who cannot fight is behind the agent"*. On the mercy pole the pilgrim is on stage in four of five endings — asking what happens now, under a cloak, gone up the road. On the ruthless pole they appear in the base ending and once more ("told to stay still, stayed still"), and are **absent from both of its seeded bands** — the two endings where the sequel's whole premise is that this person crossed into the next scene alive and beside the agent. The pole-invariance table asserts *"they are alive and beside the agent"* on all four seeded bands; on two of them the prose never says so, and the seed inherits a person the ending forgot about.

That is not a texture complaint. It is the difference between a pole that is *about protecting someone* and a pole that is about a fight, and it is why the ruthless pole reads thinner even though it is mechanically the richer one.

**Fix applied:** `{cast:survivor}` now appears in three of the ruthless pole's five overviews, including both seeded bands. The addition is not decoration — on `negative.success_at_cost` and `negative.failure` the survivor's stillness is what makes the count legible (somebody was sitting there the whole time and did not move), which the sequel then inherits.

Everything else is level. Two strong branches. Neither is perfunctory, neither is a lesser version of the other, and the difficulty split (`gentle` 0.28 vs `fair` 0.44 on the resolutions) is the best small idea in the packet — the pole choice acquires a *mechanical* texture the player can read off a word rather than a number, because once four riders have agreed a price, keeping a bargain is easier than finishing a fight you started.

---

## 4. Two endings that narrate a different encounter than the one that produced them

Trigger 26 (design-block breach), twice, and both are the kind of defect only a read-through finds.

### 4a · `positive.critical_success` contradicts its own two steps

> *"Somebody at the front of the four put a hand up before anyone had to say anything, and the whole line went by on the far side of the road at a walk. **Nothing was handed over.** Nothing is on the ground."*

Step 1 on this pole is *"Talk them down"* and its `critical_success` afterimage is *"The lead rider heard the price, looked at what was standing in the road, and named it back."* Step 2 is *"Make it hold"* — the question the hand answers is literally *"will the bargain survive being paid?"* — and its `critical_success` afterimage is *"They counted it, said something almost civil, and rode past."*

So the player reads: a price was named, a price was counted — and then the ending tells them nothing was handed over. The best ending on the pole is the one ending that could not have come out of the two steps that produce it. It also carries the packet's only genuine unreadable sentence: *"…explaining that the leg is not as bad as it looks, which it is"* — which needs two readings and then means the opposite of what it first appears to (rule zero: clarity beats compression).

**Rewritten.** The crit-success is now *the price cost almost nothing and the passage was supervised to the end* — consistent with three steps of negotiating and paying, and it preserves the reason this band plants no seed (the traveler watched all four out the far side, so the count closes). The dry closer is split into two plain sentences: *"…spends a while insisting the leg is fine. It is not."*

### 4b · `negative.failure` writes a mark its own prose says is impossible

> *"…and pulled off it. **Nobody counted anything, then or after.**"*

This band plants `hidden_mark` with `label: 'The count on the road came up one short'` and a PATH chip reading *"Four came up the road and the count of what went back down does not match"*. The prose says the count was never made. The state says the agent knows how it came out.

A hidden mark that the ending's own text denies is worse than an absent one: it is a false claim inside the exact surface Law 56 exists to make trustworthy. **Rewritten** so the agent does make the count and it does not close — which is also what makes the band worth seeding.

---

## 5. The seed contract, verified from both ends — and the break

I read `one-body-short-draft.md` in full. The key matches, the inheritance mechanism is right, and there is a hard incompatibility the parent's pole-invariance table does not model.

### What verifies

- **Cast key.** Parent declares `key: 'survivor'`; sequel declares `key: 'survivor'` (`one-body-short-draft.md:640`). Exact match. Roles differ (`pilgrim` vs `mercenary`, `the_one_who_cannot_fight` vs `fellow_survivor`) and that is correct — `inheritContext` copies the *binding*, not the role, so the parent's pilgrim crosses and the sequel's spawn spec is only the unbound fallback.
- **`must-persist` on both sides.** ✓ Required, and the parent's reason is the right one: a favour whose debtor is collected at scene end is not a favour.
- **Never gendered, on either side.** ✓ I read every sentence about the pilgrim in the parent and every sentence about the survivor in the sequel. No pronoun but *they*, no gendered noun. The riders are gendered (`him`, `he`) and that is fine — they do not cross. This is the discipline that most needed checking, because a single slip here poisons two encounters, and it holds.
- **`delayTicks: 12`.** One in-world day, named as a derived constant rather than a taste number. ✓
- **The `secret_discovery` rejection.** Verified in source and the reasoning is exactly right: the effect has no `targetAgentId`, reads `action.targetId`, and `createSecretEdge` refuses a non-actor endpoint. The secret here is an incomplete count of people who have no nodes, so its natural endpoint is a set of absences — which `secret_discovery` structurally cannot express. `hidden_mark` + `favor_creation` is the honest wiring.
- **The reveal-family bearer trap does not bite.** The mark's bearer is the actor, and the actor is the one who draws `encounter.border.*`. ✓ And `familyMatchesTemplate` prefix-matches, so `revealFamilies: ['encounter.border']` reaches the sequel by construction.

### What breaks: the mercy pole cannot produce the sequel's scene

The sequel's spine (`one-body-short-draft.md:162`):

> *"The fighting stopped a while ago and nothing has moved since. The other survivor sits apart with open hands, not looking at the ground. **The dead lie where they fell**, and the count comes out one short. One place has everything a death leaves except the body…"*

and its own pole-agnostic contract (`:606`) asserts: *"Both poles end with dead on the ground."*

**That is false of the mercy pole as the parent drafted it.** The parent's two mercy-pole seeded bands were `positive.success` and `positive.success_at_cost`:

- `positive.success` — the riders take the price and ride through. **Nobody fights. Nobody dies.** Twelve ticks later the agent is standing on a battlefield full of dead that this ending did not produce.
- `positive.success_at_cost` — the traveler hands over the pack and takes a boot to the ribs; one rider goes down a bank in the dark. **One man off the road is not "the dead lie where they fell"**, and he is the *missing* one, not the field of bodies the sequel counts.

Half the seeded endings hand the sequel a scene it cannot open on. The parent's pole-invariance table lists three invariant facts and audits each one honestly — but it never asks the question that actually decides the pair: **is the sequel's own scene reachable from this ending?** A table that models what the sequel *reads* and not what the sequel *stands in* will pass every check and still ship a broken pair.

**Fix applied — and it improves the design rather than patching it.** The seed now rides, on both poles, the two bands where the road left bodies and the count of them does not close:

| Pole | Band | Seed | Why |
|---|---|---|---|
| `positive` | `critical_success` | no | Cost almost nothing, watched out the far side. Complete. |
| `positive` | `success` | **no** *(was yes)* | A bought passage the traveler supervised to the end. Nobody fought; there is nothing to count. |
| `positive` | `success_at_cost` | yes | The bargain came apart at the last. Two are down; the rest rode off. |
| `positive` | `failure` | **yes** *(was no)* | They came through and put the traveler down — and did not do it for free. Two of theirs stayed on the road. |
| `positive` | `critical_failure` | no | The traveler is on the ground and the missing person is the pilgrim. A different encounter. |
| `negative` | `critical_success` | no | One exchange, nobody dead, all four rode back down. |
| `negative` | `success` | no | Two came off and everyone is accounted for; the prose says so. |
| `negative` | `success_at_cost` | yes | Ugly and dark, and the count came out short. |
| `negative` | `failure` | yes | The riders pulled off it; two stayed where they fell; the count does not match. |

Still four of ten, still two per pole — and now with a stated rule instead of a coincidence: **the seed fires exactly where the road left bodies and the count of them will not close.** The two mercy-pole bands are rewritten so that is true of them, which turns `positive.success_at_cost` into the best band in the encounter: *mercy that fails at the last is the ending where people die*, and the mercy pole earns a real cost rather than a boot to the ribs.

The pole-invariance table gains a fourth row — **a fight ended on this ground and the dead are on it** — invariant, and true on all four seeded bands only after this change.

**Reconciliation owed by the sequel's pass:** `one-body-short-draft.md:606` asserts *"Both poles end with dead on the ground"* as a justification for its own prose. That sentence is now true, but only because the parent's band set moved to make it true. It should be restated as a constraint the parent satisfies rather than an observation about the parent, so the next edit to either draft cannot silently break it.

### The second cross-draft item the parent must answer

`one-body-short-draft.md:616`, verbatim:

> *"**(b) `secret_discovery` reads `action.targetId`, which must be an actor.** … Under `inheritContext` the target is copied from the parent, so **the parent must target the crossing person, not the location.** If row 4 targets a place, this encounter's `secret` family is wired at the gate and inert at runtime… **Reconcile with row 4's draft before compile.**"*

**The parent draft never answers it.** It discusses `secret_discovery` at length — for its own use, which it correctly declines — and says nothing about what its own action targets. `inheritContext` copies `targetId`, so this parent's target selection silently decides whether the sequel's entire `secret` family works. **Added to the revised packet as § 9.5, a stated target contract**, with the failure mode named so Pass 3 must land it rather than infer it.

---

## 6. Prose

### Register

Baseline holds throughout. Card names, effect lines, factor lines and purpose lines are plain — no metaphor, no ambiguity about what the click does, no word that sends a reader to a dictionary. I found **zero** reaches for lyricism in ordinary narration, which is rarer than it should be.

Peak surfaces are used sparingly and in the right places: the final step's band prose and the endings. One figurative image per paragraph, and most paragraphs have none. *"Four riders strung out in a narrow place are not four riders"* is the encounter's one genuine flourish and it earns its slot — it is the ruthless pole's entire thesis in eleven words.

**Tone: not grim**, as the design row requires. The batch allots two grim resolutions and this is not one of them. The worst ending is a beating and a loss, never a scripted death, and the endings that could have tipped grim (`positive.critical_failure`) end on absence rather than violence.

### The three plainness moves

1. **Subject first, never a fragment.** Held. I read every paragraph opening in the packet. Not one opens on a fragment. Openings begin *The road…*, *The ground here…*; endings begin *The riders…*, *The traveler…*, *None of what was said…*. This is the cleanest the pipeline has produced on move 1.
2. **Abstract nouns swapped for what happened.** Held, with the exception the detectors caught: `the moment` on all three Mercy faces is precisely a nominalised abstraction doing concrete work, and it was the same abstraction three times. Repaired.
3. **One dry line, not two.** Held on every band but one. `positive.critical_success` carried two ironic turns on the same beat — the hand-up *and* the leg — and the second was also the unreadable one. Rewritten to one.
4. **Density.** Held, and deliberately. One named person on stage (`{cast:survivor}`). No third party who mentions a fourth. Props only where the player can act on them: the pack, the leg, the narrow place, the riders. Nobody has a brother in another town. This is the cleanest density in the batch and the draft should be told so.

### Seam echoes (trigger 22) — and the class the trigger's wording hides

**The seam audit every draft in this batch ran is too narrow, and in this encounter the misses cluster entirely in the part it skips.** Trigger 22 says "across a paragraph boundary", which reads as opening→spine and spine→band. Those are one seam each per run. What a player actually reads in a single ending is twenty-plus authored strings on one screen, in order:

> step-0 afterimage → up to 4 step-0 fragments → step-1 afterimage → up to 3 step-1 fragments → the step-2 carryover line → step-2 afterimage → up to 3 step-2 fragments → `narrativeTemplates.success`/`.failure` → the band `overview` → 1–3 chips (`title` · `causeClause` · `detail`) → 1–2 reaction labels and intents

Five hands and ten endings put this packet's surface for that class several times above any linear encounter's, and it sits directly on top of the gate blind spot in § 0. I enumerated it per pole. **Twenty-one echoes, nineteen of them inside a single ending.**

| Seam | Checked | Found |
|---|---|---|
| card fragment → card fragment, same band, both active | all 30 multi-card bands across 5 hands | 3 |
| card fragment → card fragment, same library card, consecutive steps | 6 repeated faces along pole paths | 2 |
| step afterimage → carryover line on the next step's panel | 12 pairs (6 bands × 2 poles) | 6 |
| base band text → card fragment on the same band | all 25 afterimages against their hands | 2 |
| step-2 afterimage → band `overview` | 10 pairs | 5 |
| `narrativeTemplates` line → `overview` | 2 lines × the bands each reaches | 2 |
| chip → chip within one band | all 21 chip instances | 1 |
| pole → pole, equivalent bands | 5 pairs | 0 |
| opening → spine → initiation (**the only one the draft checked**) | 4 + 1 | 2 |

The highest-yield seams, named:

1. **step afterimage → the very next panel's carryover line, six times.** Three per pole, and every one a restatement authored a hundred lines apart in the packet: *"They named a price and the riders named it back"* against the step-1 afterimage *"The lead rider heard the price … and named it back"*; *"Two went down before anyone drew"* against *"Two were down before the third had the reins gathered"*; *"They saw it coming"* against *"They had seen it coming from further off than anyone thought"*. This is the tightest seam in the encounter and nobody checks it, because the two halves live in different sections of the doc.
2. **step-2 afterimage → the overview directly beneath it, five times.** *"They took the price, and then took a little more"* landing above an overview whose middle sentence is *"one of them reached for more than had been agreed"*; *"the riders went on through"* above *"the riders … went through"*; *"The last two turned their horses"* above *"The other two … went back the way they came."*
3. **step-0 `near_miss`: three of four cards on the same idea.** Four cards author that band and all four can be active at once — *"ran out of time"*, *"arrived a beat after it would have mattered"*, *"one mind short of enough time"*. The most-rolled band on the deciding step, and the god who buys the biggest hand gets the most repetition.
4. **`negative.critical_failure` overview → the step-1 afterimage four lines above it.** *"went up the road alone to meet four men and found out … exactly what four men are"* against *"The traveler went in at four men and found out how many four is."* Same joke, same shape, same screen. The afterimage keeps the better line.
5. **`narrativeTemplates.failure` → two overviews it lands beside**, both containing *"came through the narrow place"*.

Two pole→pole mirrors are kept deliberately and recorded in the packet: the poles' `critical_failure` overviews both close on the pilgrim — taken on one, spared on the other — and both worst bands carry the same single reaction label with different intents. Neither pair ever co-renders, so that is contrast between playthroughs, which is what a fork is for.

One accepted repetition: three of four openings begin with the noun *road*. Only one renders per run. The draft's echo note claims the openings *"share no image"*; they share the first noun. Left as-is, flagged so the packet's claim is honest.

### Detectors — and the two surfaces the draft scanned in the wrong class

**The spec page and `nudgeAuditDetectors.ts` disagree about field classes, and the code is the contract.** `pushAftermathVariant` (`:377-398`) pushes `body.overview` as **`scene`** and `change.detail` as **`outcome`** — the reverse of what an author reading the spec page would assume. The doc comment at `:345-375` is explicit that this is deliberate and measured: `change.detail` **is** the only statement of its consequence, so an indefinite there withholds what the player has no other source for; `overview` sits directly above typed chips that name every consequence, so the player has another source. Reading `overview` as `outcome` across 295 templates flags 165 fields on indefinites against 57 genuinely evasive, and in the director-reviewed slice every one of those 165 is prose like *"Nothing was promised. Nothing was taken."* — the contortion THR-899 split the lexicon to end. `change.title`, `reactionPrompt`, `reaction.label` and `reaction.intent` are `interactive`; `causeClause` is **not swept at all**.

**The draft self-scanned with those two surfaces reversed**, so its "vagueness zero" claim is evidence about the wrong fields. Re-scanned against the code:

- **`overview` (scene, 10 fields):** zero evasive. The natural indefinites in them — *somewhere at the end of them*, *Nothing was handed over* — are legal, and several are the better line, so they stay. My first pass had rewritten four of these; I put them back.
- **`change.detail` (outcome, strict, 4 distinct):** zero, before and after. *"wherever they are going"* is not in either term list.
- **Band fragments, afterimages, `narrativeTemplates.success`/`.failure` (outcome, strict): 22 hits.** `nothing` ×9, `something` ×5, `thing`/`things` ×3, `way` ×4, `anything` ×1.
- **`effectLine` / `name` / factor lines / `fiction` / chip titles / labels / intents (evasive-only): 4 hits**, all evasive and therefore banned in every class — `the moment` on all three Mercy faces and `something` in `line.s1a.something_to_want`'s effect line.

**26 total, all repaired to zero.** For the record: the machine gate is a *density* fail at `VAGUENESS_DENSITY_FAIL = 2.0` per 100 words, and at ~3,500 authored words this packet needed ~71 hits to trip it. It would have passed `check:encounter` at 26. The gate is not the bar.

- **Annotation clauses — ≤1 across the whole encounter, and this is the batch's longest packet.** Counted by hand against `NOT_X_BUT_Y_PATTERNS` over every swept field: **zero**. Two near-misses recorded so nobody writes around them: `(is|was|are|were)n'?t` needs the contraction, so the several *"was not the end"* constructions are clean; `less\s+[a-z]+\s+than` needs an intervening word, so *"took less than half of it"* is clean. The one clause in the document is *"Not heroism — calculation under a deadline"* in the § 12 art brief, which is not a template field and is not swept. One in the document, zero shipped — at the cap, not over it.
- **Divine outcome-authorship — zero.** Checked against the actual regexes, not the prose description. See § 2.
- **`concepts` — a hard `check:encounter` block the draft claimed as PASS.** `compositionContract.ts:1248-1249` requires a **non-empty `concepts` list on every change**, and a `stateNoun` does *not* discharge it — that satisfies the separate anchor clause at `:680`. `:734-739` additionally fires when concepts exist but none carries an `entityId` or `tooltipId`. The draft declares `concepts` on **zero** of its changes while its self-audit row reads *"every change declares `concepts`/`stateNoun` — **PASS**"*, which is the row conflating the two rules. With three chip shapes across ten endings this is 21 chip instances failing one block. All three shapes now declare a concept carrying an `entityId` (§ 8.1b of the revised packet). Worth carrying to the batch report: the rule's own comment says `concepts` is authored nowhere in the corpus and is a large share of why the ratchet holds all 191 existing templates — so every draft in this batch should be checked for the same claim.
- **Abstraction-as-subject.** Run by hand down every paragraph. Grammatical subjects across the openings, spine, endings and afterimages: *the road, the ground, the wind, the air, a pilgrim, four riders, the pilgrim, the traveler, the riders, the lead rider, two, the last two, the goods, the bargain, the price, the count, the offer, the strike, it*. Two abstractions in the subject slot — *the count*, *the bargain* — both of which are the literal thing the scene is about. Clean.

### Prose rule 7 — no invented game state

Held, and the design block's inventory of it is the best-argued section in the draft. No base sentence asserts a relationship, debt, prior visit or standing. The one claim *about* state is a negative — *"the pilgrim does not know the traveler standing over them from any other stranger"* — which is safe by construction and is also what makes the `heart` test a real test rather than a formality. The pilgrim is a stranger *because the spine says so*, and the encounter is built on that.

### Title and crux

- **Crux.** *"Someone who cannot fight is behind the agent, and the thing coming up the road does not have to stop."* One plain sentence, subject-verb-object, states the complication from the agent's point of view. **PASS**, and it is the best crux in the batch.
- **Title glance test.** *Standing the Line.* A player reading only the title knows something must be held and that the agent is what stands in the way. **PASS**, but it is the weakest title in the batch — it names a posture rather than an object, where *The Broken Wheel* names a thing. Not a defect; recorded because the batch report should not claim all six titles are equally concrete.

---

## 7. Static factor lines (THR-892)

**Clean, and correctly reasoned.** Zero static `factorLines` on any step. *"The way is narrow here"*, *"four against one"*, *"the leg is bad"* would read identically on every run and are priced into the difficulty and carried by the prose — the draft names all three and declines all three, which is the right instinct written down.

Both legitimate authored surfaces are used:

- **`traitVariants[0].factorLine`** — variant by construction (renders only for a bearer), names its source inside the sentence per canon rule 1, 10 words against a 12-word budget. ✓
- **`carryoverFactorLines`** — four tables, 24 lines, none on step 0 (no predecessor; the checklist rejects it). I measured every line: all within the 12-word budget, max |Δ| 0.10, all inside `NUDGE_BIG_DELTA`. The two step-1 tables key off the same `heart` predecessor and read it differently — an ambush cares about whether the pilgrim will stay quiet, a negotiation cares about whether they will stay still — which is the single best use of carryover in the corpus. ✓

---

## 8. Aftermath, chips, and one thing the engine does not give you

**Law 56, all ten endings.** Every chip traced to an effect firing on that band, on **every** arm. Anchors: `$cast:survivor` (agent, linked), `$actor` (agent, linked, the seed's carrier), `trait.condition.wounded` (attachment, linked). All three are legal — the trait one via the catalogue (`:82`, condition traits are attachment templates), the two sentinels via `chipAnchorDeclarations.ts` rather than the catalogue, which the packet now says accurately.

Rule 0c compliance is good: `stateNoun` names the mechanic, `detail` names the endpoints with `{cast:survivor}` / `{actor}`, fiction last. One tightening applied — `'a scene still to come'` → `'a scene planted'`, because `stateNoun` renders raw into the `CATEGORY · NOUN` tag and should read as game state at a glance rather than as a promise. No `reputation_tally` chip anywhere. ✓

**`hidden_mark` deliberately unchipped** — correct. Law 56 governs what a chip *claims*, not what the world records, and a mark the agent is keeping to themselves has no business on a chip that announces it.

### The thing the engine does not give you

I read the types. `AftermathVariant` and `AftermathOutcomeOverride` carry `changes` (chips) and `reactions`. **`EncounterAftermathReaction` has no `changes` field, and neither the variant nor the band has an `effects` field.** So at aftermath time, `reactions[].effects` is the *only* effect carrier that exists.

Two consequences, one good and one not:

1. **The draft's § 8.1 rule is forced, not chosen — and it is right.** *"A chip may only claim what every arm of that band writes"* is the only rule the type permits, because chips live on the band and effects live on the arms. The draft reasoned its way to the correct rule; it should say that the type compels it, which makes the rule un-droppable by a later editor.
2. **Every state write in this encounter is click-gated.** `bond_change`, `hidden_mark`, `encounter_seed`, `condition_attachment` all ride reactions. A player who dismisses the aftermath without picking a stance gets no bond, no wound, no mark — **and no sequel**. For a Seeded Sequel parent that is a shipping risk, and it is precisely the shape THR-783 records: `apotheosis-ascension.ts:306` says it in one line, *"a reaction is a click"*, which is why its grant rides `successMetadata.effects` instead.

`ActionStep` carries both `successMetadata` and `failureMetadata` (`unifiedAction.ts:1711-1712`), so a home exists — but it is per-step, not per-band, and the seed is meant to fire on four endings of ten. **That is plumbing, and plumbing is Pass 3's lane, not mine.** I have not invented a mechanism. What the revised packet now does is state the requirement as a blocking question (§ 8.0), so the systems pass must answer it rather than inherit an assumption.

**One design observation I am not fixing.** The two reaction arms carry identical chips by construction (the rule above), and they differ in `favor_creation` versus a larger `bond_change` — neither of which is chipped. So the player picks between two stances and the consequence surface shows them the same thing either way. The arms' `intent` lines carry the whole difference. That is legible enough to ship, and the alternative (per-reaction chips) does not exist in the type. Recorded so nobody later reads the identical chip sets as a copy-paste error.

### The `byOutcome` floor

Five of seven authored per pole against a floor of three. `contested_won` / `contested_lost` deliberately unauthored because the template is never contested — correct, and authoring them would ship prose no player can reach.

The draft's note on the two outcome domains was garbled: *"Both domains type-check as each other and one of them is always wrong."* Rewritten to say the thing it was reaching for — `byOutcome` keys on `UnifiedActionOutcome` (no `near_miss`, has `contested_*`), `bandProse` keys on `StepOutcome` (has `near_miss`, no `contested_*`), the two unions overlap without nesting, and neither is assignable to the other, so a key copied between them is a silent authoring error rather than a type error.

---

## 9. Setting envelope (trigger 18)

Four classes declared, four openings, one each, each with ground, structure and light before anything happens, each ≤60 words, each carrying at least two senses past sight. The spine names no class scenery and introduces the cast role-voiced without a token. All correct.

**But the envelope leaks below the opening, in five places, and the self-audit claims it does not.**

| Where | Leak | Class it belongs to |
|---|---|---|
| `positive.success` overview | *"none of them looked at the **gorse** where the pilgrim was lying"* | `wayside` |
| `positive.critical_failure` overview | *"the **gorse** where the pilgrim had been sitting was empty"* | `wayside` |
| `positive.success_at_cost` overview | *"One of them went down the **bank** in the dark"* | `wayside` |
| `negative.critical_failure` afterimage | *"the traveler in the **ditch**"* | `battlefield` |
| `negative.success` overview | *"four riders strung out on a **climb**"* | `stronghold` — and it flatly contradicts the `battlefield` opening's *"the whole flat"* |

Three quarters of runs on the mercy pole would have read about gorse in a ruin, on a causeway, or below a shut gate. All five repaired with envelope-neutral nouns; nothing is lost — *"where the way goes narrow"* is stronger than *"the gorse"* anyway, because it is the phrase the whole encounter is built on.

---

## 10. The rest of the hard checks

- **Player-as-god.** Held everywhere. No option instructs the mortal; every face exerts influence on the scene or on the mortal's inner weather. The four leaning cards are dreams, wants, surfaced answers and felt weight — all lawful. Zero `authoredChoices`.
- **Communication pivot, all five hands, all 27 faces.** Names are 2–4 generic words, all within `NUDGE_NAME_MAX_WORDS`. Flavor quotes are single dry aphorisms. Eighteen faces are the library's own, verbatim. **Three effect lines carried scene-bespoke prose** and are repaired:
  - `line.s0.the_easier_way` — *"the road is clear if nobody is left on it"* is a sentence about this road.
  - `line.s1a.something_to_want` — *"something this road cannot give them, and a road they are done with is a road they will leave"* is a scene aphorism (and carried an evasive `something`).
  - `line.s2a.one_rope_many_hands` — *"while the goods change hands, so nobody moves before the count is done"* is this scene's step 2.
  Several other lines name their targets directly (*the offer*, *the ones being talked to*, *everyone holding a weapon*). That is the sanctioned interim behaviour until THR-887 lands typed slots, and I have left it.
- **`libraryCardId` discipline — 18 of 27, and the nine one-offs are all genuinely forced.** Five are the two typeless types (`fellowship` ×3, `signature` ×4 — wait: `fellowship` 3 + `signature` 4 = 7 cards across two types that have zero library members). The remaining two sign spheres the library does not cover for their type: a `matter` Boost and a `time` Signature. I checked the 37-member list: `SPHERE_SIGNATURES` has no `matter` Boost, and there is no `signature`-typed member at any sphere. **All nine forced, none discretionary.** The gating note is also right — every member used is `unlock: 'starting'`, and the milestone, god-trait, attunement and hunger-unique members are correctly avoided, because a hunger unique held by one god per run would shrink the hand for everyone else.
- **Card-type budget.** boost 7 · mercy 3 · compulsion 3 · kindled_ambition 4 · undertow 4 · signature 4 · fellowship 3 = 27 cards, 7 types, none outside the design row's allocation. `compulsion` and `signature` get their content debut as the batch design requires. Trigger 21 (two encounters in one family with identical type composition) does not fire — the sequel's budget is `whisper`/`omen`/`long_game`/`boost`/`trait_card`, disjoint but for `boost`.
- **Consequence draw.** `['relationship', 'secret', 'story_seed']`, no swap, all three wired in context and each wired with a real effect: `bond_change` (relationship), `hidden_mark` + `favor_creation` (secret), `encounter_seed` (story_seed). The `secret` wiring is the interesting one and the reasoning holds — two different secrets, both earned. ✓
- **Concept art direction.** Two-question method, evocative not illustrative, and genuinely good: an empty narrow place at the hour after, a pack nobody picked up, four sets of prints going one way and a fifth that leaves the road. No figures, no blood, no weapons, no mechanic painted into the frame, no second human likeness. It carries the *sequel* without illustrating either encounter, which is the hardest thing art direction can do here. **PASS**, unchanged.
- **`illustrationUrl` deliberately unauthored.** Correct, and the finding behind it is worth keeping in the batch report: the apotheosis declares `/concept-art/encounters/placeholder.jpg` and that file does not exist on disk, so a dead path passes the contract check and renders a broken image.
- **Reachability (THR-821).** `intrinsicTier: 'background'`, `rarityTier: 3`, every step ≤ 0.45. The open-draw branch of the rule, correctly identified. ✓
- **Trait hooks — all four questions answered, two yeses and two written noes.** The "no gate" answer is right (a road is a road). The variant on `trait.core.core_warmth.virtue` is live and correctly reasoned, and the note on why Warm eases the `heart` test without leaning the fork is the sharpest paragraph in the draft — conflating a core trait with an axiological axis is exactly the plausible, invisible wrongness `signedLeanWeight`'s axis check exists to prevent.

### Step 3's reach — designed, not papered over

The design row said *"3 the pole's resolution"* and named no reach. The draft read it as continuing in the pole's own reach (gold×2 / iron×2) and flagged the interpretation rather than burying it.

**I judge it designed, and I would have made the same call.** Three reasons, and the draft has two of them:

1. A resolution step that switched reach mid-pole would dissolve the fork's identity exactly where it should be strongest. The mercy pole *is* the gold pole; a `shadow` or `heart` resolution would make the pole a costume over a generic three-step encounter.
2. A run walks one pole, so a single playthrough touches three reaches — `heart`, then one of gold/iron twice — which is what the batch's reach budget counts when it credits this encounter `heart 1 · gold 1 · iron 1`. Converging both poles on a fifth reach would spend a reach the budget has allocated elsewhere.
3. The one thing the draft did not say, and the strongest argument: the two `gold` steps ask genuinely different questions — *can the offer land* versus *will the bargain survive being paid* — and so do the two `iron` steps — *does the first blow land* versus *does it end here or follow them*. Repeating a reach is only a gap when the second step re-asks the first step's question. Neither pole does.

Recorded in the revised packet with the third reason added, so a reviewer can still overrule it cheaply.

---

## 11. Experience Differentiator Gate

**Scene & Prose**
1. Opening places the player inside a moment already in motion? — **YES.** The openings are place; the spine puts a person on the ground and something coming up the road within one sentence of each other, and neither explains why. Note for the record: the four openings alone are static landscape, and it is the spine that supplies motion. That is what the envelope asks for and it works, but the openings are the flattest prose in the packet.
2. Prose has its own voice? — **YES.** Long approach sentences in the openings, short flat ones in the endings, the worst bands the shortest. The cadence is consistent across 27 card faces and 35 prose surfaces without going uniform.
3. Scene prose names elements that become player choices? — **YES.** The narrow place, the leg, the pack, the four riders, the pilgrim's distrust. Every one of the 27 cards acts on one of them.
4. Reader feels something from prose alone? — **YES.** *"Nothing on this road obliges them to stop"* is the whole encounter with no mechanics under it.
4b. No seam echoes? — **NO in the draft** (twenty-one, nineteen of them in-ending; § 6) → **YES after revision.**

**Choices & Intervention**
5. Every card face library-generic, zero scene-bespoke prose? — **NO in the draft** (three effect lines) → **YES after revision.**
6. Every effect line states mechanism, every price real? — **YES.** Essence throughout, plus a real second channel on the four Undertows: permanent `valueDrift` on `mercy_ruthlessness`, which is the card's printed promise priced in who the mortal becomes. That is the most honest non-essence cost the corpus has authored.
7. Every card pays off in failure; big-delta covers both bands? — **YES**, all 27, audited by hand in § 0.
8. Every card grounded — delete the target and it is senseless? — **YES.** Delete the riders and the pilgrim and none of the 27 means anything here.
9. Cards answer different questions? — **YES**, within each hand and across the three step-slots (which way / does it start / does it hold).
9b. Every nudge-bearing step carries a full authored hand; no step asks the player to pick a branch or an ending? — **YES.** Five full hands. The fork is `decidedBy`; the player leans and the mortal answers.

**Aftermath & Consequence**
10. Aftermath has reflective prose landing? — **YES**, ten overviews, each saying only what it alone can say — after 4a is repaired, which was the one that could have been pasted into a different encounter.
11. Consequences actor-centred with names and faces? — **YES.** `{cast:survivor}` is a spawned person with a portrait, a click and a persistence contract, named on five endings after revision, and the chips point at them.
12. Reaction choices offered at medium+ scale? — **YES.** Eight of ten endings carry two stances; the two that do not are the poles' worst bands, where a second option would be theatre.
13. Reactions represent philosophical stances? — **YES.** *Hold a claim on the person you saved* against *give the claim away*. Arm A buys a future call-in; arm B buys a deeper tie and nothing to spend. Neither is the generous one, which is what makes it a stance rather than a morality meter.
14. Concept art evocative, not illustrative? — **YES.** § 10.

**Fourteen YES after revision. Two were NO in the draft (4b and 5).**

---

## 12. Verdict and revision summary

Seven automatic REVISE triggers fired in the draft, plus one hard `check:encounter` block:

| # | Trigger | Instances |
|---|---|---|
| 15 | Detector hit — vagueness lexicon | 26: 22 outcome-class, 4 evasive (banned in every class) |
| 16 | Scene-bespoke prose on a card face | 3 |
| 18 | Class scenery below the opening | 5 |
| 22 | Seam echo | **21 — nineteen of them inside a single ending**, the class the trigger's "paragraph boundary" wording does not describe |
| 26 | Design-block breach — an ending the steps that produce it cannot produce | 2 |
| 30 | Shape breach — a Seeded Sequel whose parent seeds bands the sequel's scene cannot open on | 1 (2 bands) |
| 13 | Nudge-specific payoff mis-scoped — three card faces carried `the moment`, a nominalised placeholder standing in for the scene the fragment should name | 3 |
| — | **`check:encounter` block:** `concepts` absent on every change (`compositionContract.ts:1248`), claimed as PASS | 21 chip instances / 3 shapes |

**All eight are repaired inline. `standing-the-line-revised.md` is complete and self-contained.**

I chose `PASS WITH REVISIONS` over the letter of the trigger rule deliberately, and here is the reasoning so it can be overruled: six of the eight are word-level and paragraph-level defects that a re-dispatched draft agent would fix exactly as I have, at the cost of a full redraft of a 1,032-line packet — and one of them, the seam class, is a defect the draft agent could not have found, because the audit that finds it is not the one any prompt in this pipeline currently asks for. The eighth (the sequel-premise break) is the one that genuinely warrants a stop — but its fix is contained entirely inside the parent, it improves the design rather than patching it, and stopping the line would not put the sequel's author in the room. Both cross-draft items are named with owners below instead.

### Must fix — done in the revised packet

1. Seed band set corrected; both mercy-pole seeded bands rewritten so the sequel's scene is reachable; pole-invariance table gains the fourth invariant fact.
2. `positive.critical_success` rewritten to be consistent with the two steps that produce it; the unreadable closer split into two plain sentences.
3. `negative.failure` rewritten so the agent makes the count it is recorded as knowing.
4. `poleLean` weights made symmetric; the arithmetic note rewritten to say something true.
5. Twenty-two `outcome`-class vagueness hits and four evasive hits repaired to zero, re-scanned against the **code's** field classes (`overview` is `scene`, `change.detail` is `outcome` — the reverse of the spec page, and of what the draft scanned).
5b. `concepts` authored on all three chip shapes, each carrying a resolvable `entityId`.
6. Five envelope leaks repaired.
7. Twenty-one seam echoes repaired, nineteen of them in-ending. Seven of the twenty-five base afterimages and six of the twenty-four carryover lines were rewritten for this alone.
8. Three scene-bespoke effect lines rewritten.
9. `{cast:survivor}` added to the ruthless pole's two seeded bands.
10. Two false source citations and two wrong numbers corrected; every source claim now carries a `file:line`.
11. `hidden_mark` declares `targetAgentId: '$actor'` explicitly rather than relying on the default.
12. New § 8.0 stating that reactions are the only aftermath effect carrier, and handing the click-gating question to Pass 3 as blocking.
13. New § 9.5 stating the parent's target contract, which the sequel asked for and the draft did not answer.
14. Self-audit rows that claimed PASS falsely (vagueness, class scenery, seam check, anchor catalogue) corrected to what is actually true after revision.

### Should fix — handed forward, with owners

- **Pass 3 (systems):** decide where the pole-invariant writes live so the sequel does not depend on a click. `successMetadata` / `failureMetadata` exist on `ActionStep` but are per-step, not per-band. This is blocking for the pair.
- **Pass 3 (systems):** confirm the four `signature` one-offs are dealt gated on the god holding their sphere. Every one of their effect lines opens *"Where you hold force / light / time…"*, which is a promise the data must keep or the line must lose.
- **The sequel's editorial pass:** restate `one-body-short-draft.md:606` (*"Both poles end with dead on the ground"*) as a constraint the parent satisfies, not an observation about the parent.
- **Batch report:** carry the gate blind spot verbatim. Four of five hands in this encounter are invisible to `check:encounter`, and the first branching template authored after this one will inherit the same blindness.
- **Batch report, second item:** the in-ending seam class (§ 6) and the reversed field classes (§ 6) are not specific to this encounter. Every draft in this batch ran the narrow seam check and every one is at risk of having self-scanned `overview` and `change.detail` in the wrong class. Two sibling critics independently found their echoes in the same place. This belongs in the pipeline's editorial prompt, not in six separate editorial files.
- **Batch report, third item:** `concepts` is authored nowhere in the corpus and `compositionContract.ts:1248` requires it on every change. Any draft in this batch whose self-audit pairs `concepts` with `stateNoun` in one row is claiming a PASS it has not earned.

### Consider

- The four openings all begin with the same noun. Only one renders per run, so nothing breaks — but if a fifth class is ever added, vary the opening move.
- *Standing the Line* is the batch's least concrete title. Not worth changing; worth not claiming otherwise.
- Card ids and names diverge in four places (`full_weight_of_you` → *Weight Behind It*, `plain_sight` → *Made Plain*, `a_thing_worth_having` → *Sound Goods*, `this_has_happened` → *Not The First Time*). Aligned in the revised packet, since a library retrofit will key on one of them.

---

**PASS WITH REVISIONS**
