# Encounter Pipeline: Standing the Line — Package critic (Pass 3b)

> Scale: medium (3 step slots, forked) | Slug: standing-the-line | Pass: package
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory) | Batch: border-perils (THR-1221), row 4
> Judged against: `standing-the-line-final.md`, `standing-the-line-systems.md` (READY WITH CAVEATS),
> `one-body-short-package.md` + `one-body-short-final.md` (shipped sequel),
> `reference/anchor-catalog.generated.md` (regenerated 2026-08-24), `Docs/design-system/laws.md` § 56.
> Every source claim below was re-read in this worktree, not carried from the systems pass.

```
templateId: encounter.border.standing_the_line
packageVerdict: connected
packageLeaves: A named pilgrim who survives the road and stays bonded to the agent, a wound with a real duration on the agent's sheet, a concealed count that the border family can surface later, and — on the four endings where the road left bodies — a planted scene that brings the same person back onto the same ground a day later as One Body Short.
```

**Half A is clean: 18 chip instances, 3 distinct shapes, 0 folds, 0 binds.** The verdict is
`PACKAGE FIX` on a different axis — **band prose that asserts things a reachable step-history
denies**, on the four bands that carry the batch's headline feature. It is the same defect class
the editorial pass already fixed once (the mercy pole seeding a scene it could not produce); it
re-enters through `computeFinalActionOutcome`, which the editorial pass had no reason to read.
Precisely specified in § F, applyable without re-reading the packet.

---

## A. First item — the § 9.5 target declaration

### The ruling: § 9.5 is unimplementable as written, and the systems pass is right

Verified independently, all four legs:

1. `phaseAgentDecision.ts:1059` — `targetId: sel.entry.targetAgentId ?? sel.entry.locationId`.
   Confirmed verbatim, and `targetProperties` reads the same expression six lines down.
2. `entry.targetAgentId` has **one** producer: `socialEncounterGeneration.ts`, which iterates
   `visibleAgents` — agents that already exist in the world. Grepped
   `src/engine/encounters/generateEncounterCandidates.ts` and `src/engine/unifiedCandidates.ts`:
   **zero occurrences of `targetAgentId` in either.**
3. A `supportBundle` actor is materialised *using* the resolved target, so it is structurally
   downstream of `targetId` and can never be it.
4. `?spawn=` hard-codes `targetId: locationId` (`debugEncounterTools.ts:434-440`), and
   `inheritContext` copies whatever the source action held (`encounterAftermath.ts:1545-1549`).

**On every firing route this encounter's `action.targetId` is the location node.** There is no
template field that routes targeting through a cast key, so § 14's `target` row and § 9.5's
assertion are design intent the engine cannot honour. Strike both.

### Nothing in this packet depends on `$target` resolving to a person — checked, not assumed

- **Chip anchors.** Three shapes, all sentinels: `$cast:survivor` (BOND), `$actor` (PATH),
  `trait.condition.wounded` (SCAR, a literal attachment-template id). **`$target` appears in zero
  chip declarations.**
- **Prose tokens.** `grep '{target}'` over the whole packet → **zero hits.** Every token is
  `{cast:survivor}` or `{actor}`.
- **Effect fields.** `bond_change` carries `withAgentId: '$cast:survivor'`; `favor_creation` names
  its debtor `$cast:survivor`; `hidden_mark` declares `targetAgentId: '$actor'`;
  `condition_attachment` resolves to the actor; `encounter_seed` names its own `templateId`.
  **No effect in this packet reads `action.targetId`.**
- **The kind to watch is absent.** `grep 'secret_discovery'` over the packet returns only
  *discussion of the sequel's* wiring — never an authored effect. The same for `remove_condition`,
  `reputation_with` and `agent_relocation`: **none authored.** § 9's own reasoning
  (*"the survivor is not the secret, the missing rider is"*) already steered this encounter's
  `secret` family onto `hidden_mark` + `favor_creation`, both of which name their own endpoint.

So the packet is **exposure-free**, and caveat 3 of the final doc is correct.

### The correction is not a loss — it is what makes the sequel's stage real

`inheritContext` copies `inheritedTargetId` onto the seed (`encounterAftermath.ts:1545-1549`) and
`resolveSeedInheritance` (`encounterSeeding.ts:106-124`) re-validates it against the live graph,
falling back to self-target only if the node is gone. A location node does not die. **So the
sequel's action targets the parent's own location node, on every seeded firing** — which is
exactly the structural fact the pole-invariance table's row 4 (*"a fight ended on this ground"*)
was asserting on fiction alone. The location target is the mechanism behind it.

### Replacement wording for § 14's `target` row and § 9.5

Replace the § 14 row `target   the agent bound under cast key survivor (§ 9.5 …)` with:

```
target            not authorable — the engine sets it, and it is the LOCATION on every route
```

Replace the whole of § 9.5 with:

> ### 9.5 The parent's target contract — answered against the engine, not the hope
>
> **A template cannot declare its action's target.** `action.targetId` is
> `sel.entry.targetAgentId ?? sel.entry.locationId` (`phaseAgentDecision.ts:1059`), and
> `entry.targetAgentId` has exactly one producer — `socialEncounterGeneration.ts`, iterating
> agents that already exist. A `supportBundle` actor is materialised *using* the resolved
> target, so it is downstream of the target and can never be it. `?spawn=` hard-codes
> `targetId: locationId` (`debugEncounterTools.ts:434-440`), and `inheritContext` copies
> whatever this action held. **On every firing route this encounter's `targetId` is the
> location the scene is standing on.**
>
> **This packet is unaffected, by construction.** Every effect names its own endpoint —
> `bond_change` via `withAgentId`, `favor_creation` via its debtor, `hidden_mark` via
> `targetAgentId`, `condition_attachment` on the actor — and every chip anchors `$actor`,
> `$cast:survivor`, or the `trait.condition.wounded` template. No prose field carries a
> `{target}` token. **Do not author an effect here whose person comes from `action.targetId`.**
> The kind that would silently refuse is `secret_discovery`, which has no `targetAgentId`
> field (`unifiedAction.ts:995-1005`), reads `action?.targetId` (`encounterAftermath.ts:4211`),
> and is refused by `createSecretEdge` on a non-actor endpoint
> (`secretGeneration.ts:392-408`) — traced, not thrown, so it fails green. Use `hidden_mark`
> with an explicit `targetAgentId`, as § 9 already does.
>
> **The consequence is a gain, not a loss.** Because the target is a location and locations do
> not die, `inheritContext` hands the sequel the *same ground node* the parent stood on
> (`encounterSeeding.ts:106-124`). The pole-invariance table's fourth row — *a fight ended on
> this ground* — is therefore structurally backed and not merely narrated.
>
> *(The sequel already shipped its half of this: `encounter.border.one_body_short` swapped
> `secret_discovery` → `hidden_mark` on `$cast:survivor`. See `one-body-short-package.md`'s
> correction block.)*

Also strike caveat 2's clause *"the sequel must swap…— flagged here for batch coordination"* and
replace with *"the sequel has swapped it; see `one-body-short-package.md`"*, and change the
§ 15 self-audit row **Parent target is an actor** to **Parent target is the location — no
consumer, no exposure** / **PASS**. That row currently reads `PASS as authored, blocking for
Pass 3`, which will send an implementer looking for a field.

---

## B. Second item — the condition double-application audit

**Result: zero double-application within any single resolution. No `remove_condition` is
authored anywhere in the packet, so the missing-`removeAll` hazard does not arise.**

Verified in source: `condition_attachment` (`encounterAftermath.ts:2345-2364`) loops
`for (let s = 0; s < caStackCount; s++)` and `addEdge`s unconditionally with edge id
`has_trait_${resolvedId}_${templateId}_${tick}_${i}_s${s}` — no already-holds check, and
`effectWalker.ts:66-93` has no dedupe by node. So a second write **does** double the modifier and
mint a second decay timer. The paths were enumerated against that.

| Band | Pole | Condition writes on the band | Arms | Applications per resolution | Verdict |
|---|---|---|---|---|---|
| `critical_success` | both | none | A/B | 0 | safe |
| `success` (base) | both | none | A/B | 0 | safe |
| `success_at_cost` | both | `condition_attachment` ×1 (`wounded`, moderate) | A **and** B each carry it once | **1** — the player picks one arm | safe |
| `failure` | both | `condition_attachment` ×1 (`wounded`) | A and B each once | **1** | safe |
| `critical_failure` | both | `condition_attachment` ×1, **`stackCount: 2`** | single reaction | **2 edges, deliberately** | safe *but see C1* |

Three things make this hold, and all three are load-bearing:

1. **Both arms carry the same condition write, and only one arm ever fires.** The A/B duplication
   is per-arm redundancy, not per-resolution repetition. This is the § 8.1 rule
   (*both arms write the same chipped effects*) paying off in a way § 8.1 did not claim.
2. **No band carries two `condition_attachment` effects.** Each band's arm carries exactly one.
3. **No step metadata writes a condition.** All condition writes are on reactions; there is no
   `successMetadata`/`failureMetadata` copy that could double up with a reaction copy on a band
   both reach. *(This is the one place the packet's reaction-only wiring is a safety property
   rather than a limitation — worth stating in § 8.0, because § 1.6's primitive will remove it.)*

**C1 — the one instruction Pass 3 must not get wrong.** Both poles' `critical_failure` want two
stacks of `wounded`. Author that as **one** `condition_attachment` effect with `stackCount: 2`,
never as two effect entries. The loop already disambiguates with `_s${s}`; two entries would
disambiguate with `_${i}` and produce two edges that are correct-by-accident but authored by a
pattern that breaks the moment someone dedupes on `(source, target)`. The packet's prose says
"stacked, long duration; 2 stacks", which is right — say `stackCount` explicitly in the skeleton.

**C2, non-blocking.** The SCAR chip's `stateNoun` is `'a wound'` (singular) on a band that writes
two stacked edges the player will see as **two rows** in the Attachments tab. Under-claiming is
the safe direction for Law 56, so this is not a violation. Record it so nobody "fixes" it into
a numeral.

**C3 — the one live double, and it is across encounters, not within one.** `one_body_short`
writes `grieving` (not `wounded`) on its failure side, so the pair cannot stack the same
condition on the agent. Confirmed against `one-body-short-package.md`'s Half B table. No action.

---

## C. Third item — reachability, enumerated per pole without collapsing paths

### The lifecycle facts this rests on, read from source

- `advanceStep` (`unifiedActionLifecycle.ts:177-181`): `isStepFailure(outcome) && (failBehavior === 'fail_action' || outcome === 'critical_failure')` → the action resolves immediately.
  **`critical_failure` truncates at whichever step rolls it, regardless of the declared `failBehavior`.**
- `isStepFailure` (`unifiedAction.ts:2471-2473`) is **`failure` or `critical_failure` only** — `near_miss` is *not* a step failure, so step 2's `fail_action` does not fire on a `near_miss`.
- `computeFinalActionOutcome` (`unifiedActionLifecycle.ts:300-319`), reached only when all three steps ran:
  `hasAnyFailure → success_at_cost`; then `hasAnyCost (success_at_cost || near_miss) → success_at_cost`;
  then `any critical_success → critical_success`; else `success`.

**Two consequences the packet does not state anywhere, and both change how the endings should be written:**

- **`success` requires all three steps to roll exactly `success`.** `critical_success` requires a
  clean run with at least one crit. **Everything else that completes lands on `success_at_cost`** —
  including runs where steps 1 and 2 both *critically succeeded* and the only blemish was step 0.
  `success_at_cost` is the modal completed ending on both poles.
- **`failure` is reachable only from step 2.** A `failure` at step 0 or step 1 is
  `continue_weakened` and folds into `success_at_cost` at aggregation. So on a `failure` ending,
  **step 1 may have crit-succeeded.**

### `positive` — Hold the Road

| Band | Steps executed | Step-history that reaches it | Chip | Backing site | Backing reachable? | Prose true on every path? |
|---|---|---|---|---|---|---|
| `critical_success` | 0,1,2 | all success/crit, ≥1 crit | BOND | `bond_change`, arms A+B on the band | ✅ | ✅ |
| `success` (base) | 0,1,2 | s0=s1=s2=`success` | BOND | same | ✅ | ✅ |
| `success_at_cost` | 0,1,2 | **any** `failure` at s0/s1, **or** any `near_miss`/`success_at_cost` anywhere — *including s1=s2=`critical_success`* | BOND · PATH · SCAR | `bond_change` / `encounter_seed` / `condition_attachment`, arms A+B | ✅ | ❌ **F1** |
| `failure` | 0,1,2 | s2 = `failure` exactly; s1 unconstrained, **may be `critical_success`** | SCAR · BOND · PATH | same three, arms A+B | ✅ | ❌ **F2** |
| `critical_failure` | **{0}** or **{0,1}** or **{0,1,2}** | crit-fail at s0, s1, or s2 | SCAR | `condition_attachment` + `hidden_mark`, single reaction on the band | ✅ **on all three truncations** | ✅ |

### `negative` — Break the Pursuit

| Band | Steps executed | Step-history that reaches it | Chip | Backing site | Backing reachable? | Prose true on every path? |
|---|---|---|---|---|---|---|
| `critical_success` | 0,1,2 | as above | BOND | `bond_change`, arms A+B | ✅ | ✅ |
| `success` (base) | 0,1,2 | s0=s1=s2=`success` | BOND | same | ✅ | ✅ |
| `success_at_cost` | 0,1,2 | as above, incl. s1=s2=`critical_success` | BOND · PATH · SCAR | arms A+B | ✅ | ⚠️ **F1 (mild)** |
| `failure` | 0,1,2 | s2 = `failure`; s1 may be `critical_success` | SCAR · BOND · PATH | arms A+B | ✅ | ❌ **F2** |
| `critical_failure` | **{0}** or **{0,1}** or **{0,1,2}** | crit-fail at s0, s1, or s2 | SCAR | single reaction on the band | ✅ **on all three** | ⚠️ **F3** |

### The systems pass's reachability-safety claim: **upheld on backing, and it is the right call**

> *"reactions live on the assembled aftermath band, not on any specific step, so which steps
> executed to reach that band is irrelevant to whether the reaction fires."*

**True, and this packet is the proof case.** `critical_failure` is the band a step-metadata wiring
could not have served — three truncation points, three different step sets — and the sibling
package pass's finding (re-pointing a band's chips at an earlier step's writes only moves which
path is unbacked, because a step that *succeeded* fires `successMetadata`, not `failureMetadata`)
applies here exactly. On this template the redundant-authoring pattern § 1.6 describes would need
the same effect on **five** step-outcome slots (`step0`, `step1×2`, `step2×2`) to cover
`critical_failure`. **The reaction wiring is the correct shipping choice, not merely the available
one.** Do not let § 1.6's primitive be read as a reason to hold the encounter.

### The click gate is narrower than § 8.0 says, and the correction matters

§ 8.0 asserts *"every state write in this encounter is currently gated on a click."* **That is
true only for threaded/avatar agents.** `phaseAutonomousAftermath.ts` runs `chooseAlignedReaction`
for every non-hero agent and applies the chosen reaction through the same
`applyEncounterAftermathReaction`, falling back to `reactions[0]` when no reaction carries a moral
signal. This template is `intrinsicTier: 'background'`, so **on the ambient population the seed,
the bond, the mark and the wound all fire automatically.** The click gate binds exactly the runs
the director will look at: the player's threaded agent, `?forceencounters`, and `?spawn=`.

That is still a real hole — the pair is a *player-facing* feature and the attended path is where
it can silently not happen — but it is a review-path hole, not a "the sequel may never fire"
hole. **Restate § 8.0's second bullet accordingly** (fix **M2**), because as written it will be
read as a case for blocking, and it is not one.

One consequence worth the batch report: because arm A and arm B carry identical chipped effects
and differ only in `favor_creation` vs a larger `bond_change`, `chooseAlignedReaction` has
**no moral signal to read** on either arm (`reputation_tally` and actor-self `reputation_score`
are the only signals it infers from, and neither arm carries one). So every ambient firing takes
`reactions[0]` — arm A, *"Let them owe it."* **The ambient world will be uniformly full of
pilgrims who owe favours and never of pilgrims who were told they owed nothing.** Not a defect,
and not this packet's to fix; recorded because it is a real, permanent asymmetry the design's own
"neither is the generous one" framing did not anticipate (**M3**).

---

## D. Half A — anchoring

Eighteen chip instances across ten endings, three distinct shapes. Every referent checked against
the regenerated catalog; every sentence checked for whether it names *that particular object*.

| Chip | Bands | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| **BOND · a bond formed** | both poles: `critical_success`, `success`, `success_at_cost`, `failure` (8 instances) | The bonded pilgrim — the `supportBundle` actor bound under `survivor`, `entityId: '$cast:survivor'`, `visualKind: 'agent'` | **Yes.** Actors · `individual` → 🔗 **linked**, `visualKind: 'agent'`. The `$cast:` sentinel is legal by `chipAnchorDeclarations.ts:53`, and the classifier rejects a key absent from `supportBundle` — `survivor` is declared | **Yes.** `detail` renders `{cast:survivor}` → the person's own name (`Ilme Fenn`, or the reused roster pilgrim). Anchor and write use the same binding, so the sentence and the edge cannot disagree | **anchored** |
| **PATH · a scene planted** | both poles: `success_at_cost`, `failure` (4 instances) | The planted `encounter_seed`, anchored through its **carrier** — the acting agent — `entityId: '$actor'`, `visualKind: 'agent'` | **Yes**, by ratified clarification 2 (*"a seed chip anchors through its carrier… the agent or location the seed was planted on"*). `seed.targetAgentId` is the actor (`encounterAftermath.ts:1557`), so the actor **is** the carrier. Actor → 🔗 linked | **Yes.** `detail` names `{actor}`. The `stateNoun` says *planted*, which names the mechanic (rule 0c) rather than the fiction | **anchored** — with a truth-on-path fix, **F1** |
| **SCAR · a wound** | both poles: `success_at_cost`, `failure`, `critical_failure` (6 instances) | The `trait.condition.wounded` attachment template | **Yes.** Attachments · `condition` → 🔗 **linked**, `entityId` = the **template** node id, `visualKind: 'attachment'` — exactly as declared. Indexed live by `attachmentTemplateIndex.ts:59`, and `classifyAnchorDeclaration` accepts it as `attachment_template` | **Yes**, at the loosest margin in the packet: `stateNoun` is *"a wound"* against a template named `wounded`. The per-band `detail` grounds it (*"Ribs that will complain about every hill…"*, *"A beating that will be measured in days, not hours"*). It names the object, not a category | **anchored** |

**Half A result: 0 folds, 0 binds.** Nothing here is scene fiction wearing a chip frame. The
trap did not have to fire — all three shapes anchor `linked` kinds — but it is worth recording
that the PATH chip would have been legal anyway: it anchors the carrier, not the seed, and the
seed itself has no page by design.

**Two bookkeeping notes, non-blocking:**

- **M1 — the count is 18, not 21.** §§ 6.5 and 15 both say *"all 21 chip instances"* and
  *"authored on all 21 chip instances"*. Counted from §§ 8.2–8.3: positive 1+1+3+3+1 = 9,
  negative 1+1+3+3+1 = 9. A self-audit that counts wrong is a self-audit that checked something
  other than what it shipped; correct the number so the next reader can reconcile it.
- **`concepts` is declared on all three shapes and each carries an `entityId`**, satisfying both
  `compositionContract.ts:1248-1249` and `:734-739`. Verified against § 8.1b as written.

### R1 — the location anchor this encounter is entitled to and does not take

The § 9.5 correction hands the packet a free, always-resolving **location** anchor, and it is
the one object the whole encounter is named after.

`$target` is a first-class chip sentinel (`ANCHOR_SENTINEL_TARGET`,
`chipAnchorDeclarations.ts:53`); `resolveAnchorDeclaration` returns `context.targetId` with **no
type check**, and its own doc comment says *"plenty of encounters target a place"*. On this
template `targetId` is the location on every route — the very fact that killed § 9.5. And
`location` is 🔗 **linked** as of the 2026-08-24 catalog regeneration, `visualKind: 'location'`.

So add a second `concepts` entry to the PATH chip:

```
concepts: [
  { text: 'a scene planted', entityId: '$actor',  visualKind: 'agent' },
  { text: 'that ground',     entityId: '$target', visualKind: 'location' },
]
detail: "{actor} will go over that ground again, and it will not come out even."
```

*that ground* is already the phrase in the `detail`, and it is the exact node `inheritContext`
hands to `one_body_short`. The chip that plants the sequel would then point at both ends of it —
the person who carries the seed and the place it opens on. **Non-blocking, ~two lines, and it
converts the packet's least-visible structural fact into a click.** If Pass 3 takes it, declare
`visualKind: 'location'` explicitly — the batch already has one location anchor shipped without
it, rendering at the wrong tier.

---

## E. Half B — what this encounter leaves behind

| What it leaves | Written by | What reads it | Would the player see it happen? |
|---|---|---|---|
| **A named person who survives and persists** — the pilgrim, `must-persist`, bound under `survivor` | `supportBundle` actor spec, `lazy-materialize-on-trigger` | `inheritContext` copies `supportBindings` onto the seed; `resolveSeedInheritance` re-validates them; `one_body_short` binds the same key and renders `{cast:survivor}` | **Yes.** A person with a name, a portrait and a cast tile, who is standing beside the agent again a day later |
| **A bond with that person** | `bond_change` (`withAgentId: '$cast:survivor'`) on **both** arms of 8 of 10 endings | Both sheets carry the relationship; the sequel's package confirms it reads the tie as already-made | **Yes.** The BOND chip, then the bond on two agent sheets |
| **A wound with a real clock** | `condition_attachment` → `trait.condition.wounded`, 6 of 10 endings; 2 stacks on both `critical_failure`s | `decayConditions` counts `ticksRemaining` down; the condition's reach modifiers feed capability scoring | **Yes.** The SCAR chip, the Attachments tab with a live duration, a measurably worse next test |
| **A concealed count** | `hidden_mark`, `secret_knowledge`, `targetAgentId: '$actor'`, severity 0.35, `revealFamilies: ['encounter.border']` | `evaluateMarkReveals` biases the actor's later `encounter.border` candidates; `consumeMatchingMarks` rolls it at ~31.5% at the resolution of one — **and `one_body_short` is an `encounter.border.*` template, so the sequel is itself an eligible consumer** | **Once, and loudly, when it fires** — a chronicle line naming *"The count on the road came up one short"* at the moment the agent starts counting. **Not on any sheet**, deliberately: § 8.1's refusal to chip it is correct, and it is the honest limit of this row |
| **The planted scene** | `encounter_seed` → `encounter.border.one_body_short`, `inheritContext: true`, `delayTicks: 12`, on **both** arms of the four seeded bands | `evaluateEncounterSeeds`; a `templateId` seed resolves straight to the template with **no eligibility or setting filter** (`encounterSeeding.ts:221-225`), so the parent's four-class envelope cannot starve it | **Yes.** The PATH chip, a *"A thread has been planted"* narrative event at 0.5 significance on the spot, and the encounter itself one in-world day later |
| **The ground** | not a typed write — `inheritContext` copies `targetId`, and it is a location node | `resolveSeedInheritance` keeps it (locations do not die), so the sequel's action targets the same place | **Implicitly.** The sequel opens on it. Would become explicit if R1 is taken |
| **A favour owed by the pilgrim** *(arm A only)* | `favor_creation`, debtor `$cast:survivor` | `owes_favor` edge, both parties' sheets | **Yes** — but **not chipped**, and § 8.1 records why (a per-reaction chip does not exist in the type). This is the one write the player *chose* and cannot see reported |

### Does the seed contract cohere from the parent's side?

**Mechanically: yes, and it is the strongest sequel wiring in the batch.** Four independent legs,
all verified from this side:

1. **Cast** — same key on both sides (`survivor`, `one-body-short-final.md:640`), `must-persist`,
   carried by `inheritContext` and re-validated at spawn. The sequel stars the same node.
2. **Bond** — fires on both arms of all four seeded bands, so the sequel's `eye` test is
   performed in front of somebody the agent is measurably tied to.
3. **Mark** — the parent's actor-borne mark is consumable *by the sequel itself*, at ~31.5%.
   The callback can fire as a game event, not only as a sentence.
4. **Ground** — the location node crosses, so the sequel's stage is the parent's stage.

**The editorial reseating is coherent from the parent's side — and the reason is sharper than the
editorial pass gave.** The mercy pole's `success` and `critical_success` are supervised passages
where nobody fought; the sequel opens on *"The dead lie where they fell."* Moving the seed to
`success_at_cost` + `failure` on both poles is right **and** it produces a genuinely better rule:
*mercy loses count when the bargain breaks; ruthlessness loses count when the ambush is messy* —
same shape, opposite cause, which is what a fork is for.

**But the reseating is undermined by the aggregation function on one of its two bands.** See
**F1**: `positive.success_at_cost` is reachable with steps 1 and 2 both critically succeeded, and
on that history nobody fought and there is nothing to count — the exact premise failure the
reseating existed to close, arriving through a door the editorial pass had no reason to open.
**This is the finding that decides the verdict.**

### The two marks: not duplicates

Parent plants `secret_knowledge` / `encounter.border` on the **actor** (severity 0.35, label
*"The count on the road came up one short"*). The sequel plants the same category and family on
the **survivor** (severity 0.45, a different label). Different bearers, different labels,
different reveal audiences — the survivor's mark biases *the survivor's* later border draws, the
actor's biases the actor's. **Not duplicates.**

One genuine near-collision, non-blocking: the sequel's **Long Game card grant** also plants a
`secret_knowledge` / `encounter.border` mark **on the actor** (severity 0.55). On a run where the
god spends that card, the actor carries two actor-borne marks of the same category and family
with different labels. Both are legal and both are consumable, but a reveal of either reads as
*"a border secret surfaced"*, and a player who sees both surface within a few days will read the
second as a repeat. That is the sequel's card to price, not this packet's — recorded for the
batch report.

### Would the player recognise it happening?

**Yes, on five of the seven writes**, which is a strong ratio: the person is on the cast tile and
on their own sheet, the bond is on two sheets, the wound is on the Attachments tab with a live
duration and a visible forecast penalty, the seed announces itself as a chronicle event and then
arrives as an encounter a day later, and the mark surfaces as a chronicle line when it fires. The
two that fail the perception clause are the **favour** (real, chosen by the player, and reported
by no chip — the type's fault, recorded in § 8.1) and **the ground** (structural and invisible
unless R1 is taken).

**Half B verdict: `connected`.** This is the least solitary encounter in the batch by a wide
margin, and the only one that is a parent.

---

## F. Is `poleLean` perceptible? — the honest answer is *half*

Read from source, because this is `poleLean`'s content debut and the claim should not be taken on
the packet's word.

**What the player is told, before committing:** every leaning card says which way it argues in its
own `effectLine` — *"and it leans them toward mercy"*, *"it leans them toward the ruthless
answer"* — and the four Undertows additionally print *"it moves them that way for good"* for the
`valueDrift`. That is a legible, pre-commitment promise on the card face, and it is well done.

**What the player sees happen:** the step-1 panel is visibly a different encounter per pole —
different `purposeLine` (*Talk them down* / *Strike first*), different reach (`gold` / `iron`),
a different five-card hand, different afterimages, and eventually a different ending set. **The
divergence is unmissable.**

**What the player is *not* told, and this is the gap:** `applyPoleDecision`
(`branchDecision.ts:389-431`) computes `profileLean + cardLean`, records the pole, and writes a
`choiceText` of exactly two possible strings:

```ts
const choiceText = decision.decidedBy === 'coin'
  ? 'The moment found them undecided.'
  : 'They chose as they are.';
```

`decidedBy` distinguishes only *conviction* from *coin*. **A pole the god's 0.70 of card lean
dragged the mortal onto against a −0.30 profile renders the identical sentence — *"They chose as
they are"* — as a pole the mortal was always going to take.** The `netLean` breakdown exists, but
only in the `branch_decided` trace, which is a debug surface.

**So: the fork is perceptible as an outcome and not attributable as an influence.** A player who
spent two mind-and-spirit cards to steer a mortal toward mercy is told, in words, that the mortal
chose as they are. That reads as fate, and it is the one thing the god's most expensive lever in
this encounter cannot claim credit for.

**This is an engine/UI gap, not a content defect, and it is not this packet's to fix** — the
packet did everything available to it (symmetric weights, four levers, both directions, the
argument stated on every face). But it is the batch's headline mechanic making its content debut,
and **the batch report should carry it**: the first encounter to use `poleLean` shows that
`choiceText` cannot distinguish *the god turned them* from *they were always going to*. A
one-line third branch keyed on `Math.abs(cardLean) > Math.abs(profileLean)` would close it. File
it against the batch project; do not hold this encounter for it.

---

## G. Fix list

### Blocking — apply before Pass 3 compiles

**F1 · Both poles' `success_at_cost` overviews assert a fight the band does not guarantee, and the
mercy pole's contradicts its own steps.**

`success_at_cost` is the aggregate bucket: *any* `failure` at step 0 or 1, or *any* `near_miss`
or `success_at_cost` anywhere, lands here — **including runs where steps 1 and 2 both critically
succeeded.** Concrete reachable history on the mercy pole: `[failure, critical_success,
critical_success]`. The player reads, in order:

> *The pilgrim would not be moved by a stranger, and the pack stayed on.* →
> *The lead rider heard the price, looked at what was standing in the road, and named it back.* →
> *They counted it once, and one of them said a word that was almost civil.* →
> **overview:** *"The price was named and then renamed twice, and the traveler handed over the
> pack as well and took a boot to the ribs for arguing the last of it… it stopped being a bargain.
> Two of them are lying where the way goes narrow."*

The bargain did not come apart; it was counted once and closed civilly. Nobody is lying anywhere.
And the PATH chip's `causeClause` — *"Four came up the road and the count of what went back down
does not match"* — is false on that path, so **the seed plants `one_body_short` (whose spine is
*"The dead lie where they fell"*) onto a road with no bodies on it.** That is the exact defect the
editorial reseating was performed to close.

The ruthless pole survives this far better — its step-1 and step-2 crit-success afterimages
already put men on the ground — so the mercy pole is the blocking half.

**Fix, mercy pole `positive.success_at_cost` overview.** Rewrite so every asserted fact is one
the *aggregate* guarantees: something in the exchange cost the traveler more than it should have,
and the road did not come back clean. Do **not** assert *how* the negotiation went at step 1 —
the band does not know. Concretely: keep the boot to the ribs (the SCAR chip backs it and a
`success_at_cost` always carries a cost), keep the two on the ground **only if** the causeClause
is rewritten with it, and drop *"The price was named and then renamed twice"* — a step-1 claim.
One workable shape, offered as a shape and not as final prose:

> The passage was bought and it was not bought cleanly. Somewhere in it the traveler took a boot
> to the ribs for arguing the last of the price, and somewhere in it a man came off his horse and
> did not get back on. The rest rode through and did not look back. Two are lying where the way
> goes narrow.

That asserts a cost (guaranteed), and a body (which the author must then guarantee — see F1b).

**F1b · Decide whether the seed's premise is a *band* guarantee or a *prose* claim, and make it
the former.** The seed's rule (§ 9, *"the seed fires exactly where the road left bodies and the
count will not close"*) is currently enforced by the overview's sentences, and the overview is not
a guarantee. Two ways to make it one, pick either:

- **(a) Make the bodies unconditional on the band.** Both poles' `success_at_cost` overviews
  assert at least one man down as a fact of the ending rather than of a step. This is the cheap
  fix and it holds on every history, because a `success_at_cost` is by definition an ending that
  cost something — the author simply chooses *what* it cost, and chooses a body.
- **(b) Move the seed off `success_at_cost`.** Not recommended: it would leave the seed on
  `failure` alone, one band of five per pole, and the sequel would become rare.

Take (a). It is two sentences and it makes § 9's rule true by construction.

**F2 · Both poles' `failure` overviews assert step-1 outcomes the band does not determine.**

`failure` is reachable **only** from step 2 (`fail_action`); step 1 is unconstrained and may have
critically succeeded. Yet:

- `positive.failure` opens *"Nothing that was said made any difference to them."* On the reachable
  history `[success, critical_success, failure]` the step-1 afterimage two lines above reads
  *"The lead rider heard the price… and named it back."* Something was said and it made every
  difference — until the handover broke.
- `negative.failure` opens *"The strike went in late and they came on through it."* On
  `[success, critical_success, failure]` the step-1 afterimage reads *"Two were down before the
  third had the reins gathered."* The strike did not go in late.

**Fix.** Rewrite both openings so the failure is located at **step 2** — the handover, and the
finish — rather than at the whole action. `positive.failure`: the bargain was struck and broke in
the paying. `negative.failure`: it started well and would not end. Everything after the first
sentence in both overviews already works and should be kept; only the opening clause is making an
unearned step-1 claim.

**F3 · `negative.critical_failure` narrates a step that may not have run.** Its overview opens
*"The traveler went up the road alone and got about three steps into it."* Going up the road **is
step 1**. On truncation at step 0 (a `critical_failure` on the shared `heart` step), step 1 never
ran — the pole was decided by lean and never enacted. Marginally recoverable as "they went anyway",
but it is the one ending in the packet that names an un-run step by its action.

**Fix, cheap.** Reword so the opening does not depend on step 1 having happened: put the riders in
motion rather than the traveler. E.g. *"The traveler got about three steps into whatever it was
going to be."* The rest of the overview — the riders coming down at a walk, going past the narrow
place without slowing, *"which is the only reason there is still somebody sitting in it"* — is the
best sentence on that pole and is path-independent. Keep it exactly.

*(The mercy pole's `critical_failure` needs no change: it names no step, only that the traveler
went down and the pilgrim is gone. It reads correctly from all three truncations.)*

### Non-blocking — apply if cheap

- **M1** — correct *"21 chip instances"* to **18** in §§ 6.5 and 15.
- **M2** — § 8.0's *"every state write in this encounter is currently gated on a click"* is true
  only for threaded/avatar agents; `phaseAutonomousAftermath` auto-applies for the ambient
  population. Restate, and say so in caveat 1 too — as written it reads as a case for blocking.
- **M3** — record in the batch report that arm A and arm B carry no moral signal
  `chooseAlignedReaction` can read, so every ambient firing takes `reactions[0]` (*"Let them owe
  it"*). The ambient world will hold only favour-bearing pilgrims.
- **C1** — author both `critical_failure` wounds as **one** `condition_attachment` with
  `stackCount: 2`, never two effect entries. Put `stackCount` in the § 14 skeleton.
- **C2** — record that the SCAR `stateNoun` *"a wound"* under-claims a two-stack write. Safe
  direction; do not "fix" it into a numeral.
- **R1** — add `{ text: 'that ground', entityId: '$target', visualKind: 'location' }` as a second
  `concepts` entry on the PATH chip. Legal (`ANCHOR_SENTINEL_TARGET`,
  `chipAnchorDeclarations.ts:53`), always resolves on this template, and points the player at the
  node `one_body_short` inherits.
- **§ 9.5 / § 14 / caveat 2 / self-audit row** — replacement wording in § A above.

### To the batch report, not to this packet

- `poleLean`'s first content use surfaces that `branchDecision.ts:412-414`'s `choiceText` cannot
  distinguish *the god turned them* from *they were always going to* (§ F).
- The sequel's Long Game card plants a second actor-borne `secret_knowledge` /
  `encounter.border` mark; two such marks on one actor read as one repeated event when they
  surface (§ E).
- § 1.6's primitive is **not** a prerequisite for this encounter. `critical_failure`'s three
  truncation points make the reaction wiring the *correct* choice here, not a stopgap.

---

## H. Strongest and weakest connection

- **Strongest: the `encounter_seed` → `one_body_short`, taken as a whole.** It is not one write
  but four that arrive together and are read together: the same person node crosses, the bond that
  makes them worth recognising crosses, the location node the sequel stands on crosses, and the
  concealed count is planted on the actor where the sequel can *consume* it and turn the callback
  into a chronicle line rather than a sentence. A `templateId` seed skips the eligibility filter
  entirely, so nothing in worldgen can starve it. This is the best-wired pair in the corpus, and
  the player meets it as *"that pilgrim, that road, a day later"* — the plainest possible reading.
- **Weakest: the favour.** `favor_creation` is the one write the player actively **chose** — it is
  the entire content of arm A, the encounter's follow-up question — and it is reported by no chip,
  because `EncounterAftermathReaction` has no `changes` field and § 8.1's rule (a chip may only
  claim what *every* arm writes) therefore forbids one. So both arms show the player identical
  chips, and the thing the player decided is invisible in the surface that exists to report
  decisions. The packet records this honestly and it is not the packet's fault — but it is the one
  connection here that a player could make and never see they made.

---

PACKAGE FIX
