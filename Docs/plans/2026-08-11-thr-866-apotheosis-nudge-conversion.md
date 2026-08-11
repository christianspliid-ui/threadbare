> **title:** `The Apotheosis — nudge-model conversion design decision (WS5 one-off) — THR-866`
> **linear_issue:** THR-866
> **author:** `Claude Code`
> **created:** 2026-08-11
> **three_pillars:** Engine `N/A — no new capability; the fork, the roll and the band-keyed ending are all shipped substrate (THR-894 / THR-969)` · Content `done` · UI `N/A — every surface the design uses is already rendered by WS2`

# The Apotheosis — nudge-model conversion design decision (WS5 one-off) — THR-866

*The apex encounter is the last place in the game where the god presses a button and gets an ending; converting it is what finally makes the Aspect grant cost something.*

## Why this is load-bearing

`encounter.apotheosis.ascension` is the capstone of the Influence ladder (THR-479): a mortal worn thin by tier-4 devotion, and a permanent `aspect_of` edge that outlives the body. It is also the one WS5 REWRITE row the five mechanical batch cells deliberately refused to absorb — held across five consecutive orchestrator runs (`Docs/ops/orchestrator-2026-07-30c.md` … `-g.md`) — because its audit row reads *"Authored futures — `authoredChoices` retires under the Nudge Model"*, effort **L**, against the M/S of its siblings.

The refusal was correct. Every other REWRITE is prose-plus-a-hand. This one has to answer a design question first: **the encounter's whole substance is a two-way fork, and the program rejected forks the player picks.** Answer it wrong in either direction and something real is lost — delete the fork and the apex beat becomes a cutscene; keep it and the game's most important encounter still teaches the model every other encounter now rejects.

This document settles that question. It does not author the conversion; it decides its shape, so the implementation can be filed as an ordinary WS5 sub-batch.

## The decision

**The fork survives. The player stops making it. The *mortal* makes it, on the axis this encounter has always been about — and the god leans.**

Concretely, three moves, none of which needs new engine capability:

### 1. `authoredChoices` → `decidedBy: { axis: 'sacrifice_survival' }` (THR-894 pole mode)

`ActionStepBranch.decidedBy` is the shipped, general-purpose replacement for choice-keyed branching (`src/types/unifiedAction.ts:1290`, resolver `src/engine/encounters/branchDecision.ts`, three live users in `src/data/encounters/vertical-slice.ts`). Its contract is exactly the shape this encounter needs:

> The player never picks. They lean; the mortal chooses; the choice is theirs to keep — it drifts their axis toward the pole they took.

At the moment step 0 resolves, the engine reads the mortal's live standing on the declared axis plus the **net `poleLean` of the cards the god committed on that step**, and records the winning pole through the existing choice-history path.

**The axis is not a judgment call — it is already in the data.** Star's bound value pair is `sacrifice_survival` (`REACH_VALUE_PAIR.star`, `src/types/agent.ts:38`): Martyr (+1) vs Survivor (−1). The template is `reach: 'star'` and already declares `motivations: ['sacrifice_survival', …]`. *Do I let myself be poured into and unmade as an ordinary person, or do I remain wholly my own?* is the sacrifice/survival question stated in full. The two existing branch variants map onto it without rewriting what either one means:

| Pole key | Variant | Existing step | Existing aftermath |
|---|---|---|---|
| `positive` (Martyr) | The vessel opens | `step1Ascend` | `ASCEND_AFTERMATH` |
| `negative` (Survivor) | The doorway closes | `step1Withhold` | `WITHHOLD_AFTERMATH` |

`variants` must key exactly `'positive'` / `'negative'` — a key matching nothing is silently unreachable forever (the THR-844 shape). `aftermathConfig.branchOnStep: 0` keeps working unchanged, because the decision arrives as an ordinary recorded choice; its `variants` re-key the same way.

### 2. Difficulty stops being `0` — which finally ships the director's third branch

Both steps are currently `difficulty: 0`, and the file says why: *"the choice is the point, not a roll."* Once the choice is not the player's, that justification is spent, and the roll is free to carry the drama the button was carrying.

It should carry a branch this encounter was **designed with and could not afford**. From the template's own header (`src/data/encounters/apotheosis-ascension.ts:18-22`):

> the director verdict named accept / refuse / **"unmade"** branches. This first implementation ships accept (grant) + refuse (no grant); the "unmade" fail-forward (a mortal frame that cannot hold the divinity) is rendered as narrative weight in the accept prose and tracked as a content follow-up rather than a mechanical branch, so the grant path stays deterministic.

THR-969's outcome-keyed aftermath (`AftermathVariant.byOutcome`) is what makes it affordable. Each pole's ending splits by the band the step actually rolled:

| Pole | Upper bands | Lower bands |
|---|---|---|
| Martyr | The aspect is made — `grant_aspect`, `ASCEND_AFTERMATH` as written | **Unmade.** The frame strains and does not hold: no grant, a lasting mark, the thread survives or breaks by band |
| Survivor | The doorway closes gently — thread intact, clean re-offer | The withdrawal is *felt* — devotion dented, re-offer delayed |

So the conversion does not dilute the apex beat to buy program compliance. It restores a branch the design always wanted and pays for it with the mechanism the program brought.

### 3. The god's agency moves into the hand

The god's input is a hand of authored, essence-priced nudges on step 0, in the locked format (per-class openings + setting-neutral spine, library-generic card faces, `effectLine` words-only). Pole-leaning cards argue for a side; unleaned cards abstain and only move the odds. A god that commits nothing gets the mortal's own conviction, and a coin only on a true tie.

This is the same substitution WS6 made for Meet The First, and it is the substitution the program is *for*: the god acts in the physics of the scene — holding a doorway open, steadying a body, letting the morning back in — and never in the dramaturgy.

## What this deliberately does not do

- **It does not flip the pole on failure.** `MEETING_POLE_SHIFT_BY_BAND` writes the *opposite* pole on a failed formative test, and that is right there: a soul value is soft and re-writable. `aspect_of` is explicitly permanent and irreversible. So here the band controls **magnitude and cost, not direction** — a Survivor decision never becomes an aspect because the roll went badly. Direction stays with the decision; only the quality of the ending is fate's.
- **It does not keep a "grant it now" button as the gate.** The `apotheosis_consummate` reaction currently *is* the grant. Post-conversion the grant belongs to the Martyr pole's upper-band aftermath; whatever reaction survives is a blessing/naming flourish, not the switch. An irreversible world-write must not sit behind a click the player would never decline.
- **It does not touch `src/types/unifiedAction.ts`.** Every field it needs — `StepNudge.poleLean`, `ActionStepBranch.decidedBy`, `AftermathVariant.byOutcome` — is already there.

## Engine pillar

Engine: N/A — no new engine capability. Every mechanism is shipped and has production readers: `decidedBy` (THR-894, `src/engine/encounters/branchDecision.ts`), the shared attended five-band ladder (WS0), nudge hand resolution (`src/engine/encounters/nudges.ts`), `byOutcome` resolution (THR-969, `src/types/unifiedAction.ts:1426`), and `grant_aspect` (`src/engine/encounterAftermath.ts:3271` → `src/engine/aspects.ts:80`). The conversion is authoring against them.

One wiring question is left to the implementation ticket rather than guessed here: **where the `grant_aspect` effect sits once it is band-gated** — inside the Martyr variant's `byOutcome` upper-band `reactions`, or promoted to that override's `changes`. Both are authoring-side; the executor picks after reading how `resolveAftermathVariant` composes an override onto its base (`src/types/unifiedAction.ts:1426`), and records which in the PR body.

## Content pillar

### Encounter templates

`src/data/encounters/apotheosis-ascension.ts` — one file, converted in place:

- Delete `authoredChoices`. Add `decidedBy: { axis: 'sacrifice_survival' }` to the step-1 branch; re-key `variants` and `aftermathConfig.variants` from `raise_to_apotheosis` / `let_them_remain` to `positive` / `negative`.
- Author step 0's hand: 4–8 nudges, ≥1 common sphere-less option, sphere coverage ≥4, pole-leaning cards for **both** poles, card faces library-generic from the 21-type library. Guardrails inherit from `src/data/content-eval/nudgeAuthoringConstants.ts` — do not duplicate them.
- Give both steps a real `difficulty` (four difficulty words only on the surface; no digit reaches the player).
- Declare `settings` + per-class `openings` (THR-884). The encounter is `place:wild`, so the envelope is narrow — declare what it actually plays in rather than the full 8-class vocabulary.
- Add `byOutcome` overrides on both pole variants per the table above, keyed on **`UnifiedActionOutcome`** (`success` / `failure` / `contested_won` / `contested_lost` / `critical_success` / `critical_failure` / `success_at_cost`). `near_miss` is a `StepOutcome` and is **not** a key here; `EncounterOutcomeBand` and `OutcomeBand` also type-check and are also wrong.

### Prose tables

The existing prose is strong and mostly survives as the two clean-band endings — but it was written pre-pivot and closes paragraphs on abstractions in places ("which is its own kind of grace"). It gets the register pass every WS5 conversion gets: plain and descriptive of events, people and motivations; every sentence carries a picturable anchor; `countVagueness(text, fieldClass)` at zero for evasive terms, and for natural indefinites in outcome prose (THR-899 — the flat reading is retired). New prose to write: the two unmade/withdrawn lower-band endings, and per-band nudge fragments so the god's hand is traceable in failure at any size.

### Attachment content

The unmade ending wants a lasting mark on the mortal. Grep the existing trait/condition vocabulary before minting anything — enumerate granted-vs-required *values*, not just names (the THR-722 shape). Prefer an existing mark; a new one is a `Deferral` with its own ticket, not a silent addition.

### Data tables

No `world-model.json` change. New tunables land in `src/data/nudge-constants.ts` beside their neighbours (runtime), never in the authoring-side constants file.

## UI pillar

UI: N/A — the design uses only surfaces WS2 already renders: the test panel, the nudge hand, the fate reveal, band prose, and the aftermath. The ticket's own pillar note asked this to be flagged if the chosen approach needed an apex-specific rendering treatment; **it does not**, and that is a deliberate property of the decision rather than an omission — an apex encounter that needs its own component would fork the WS2 shell, which is the failure mode THR-868 called out by name.

The implementation ticket still owes one confirming capture, because the template is player-facing and the composed surface is what the UI Laws bind.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `branchDecision` (existing) | `apotheosis_seeding` seeds; resolution is attended | WS2 nudge surface | choice history (existing path) | existing branch-decision trace | designer view |
| `encounterAftermath` `grant_aspect` (existing) | attended aftermath | aftermath panel | `aspect_of` edge | `aspect_attained` | `__DEBUG.getAspects()` |

No new module, so no new row is owed.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `APOTHEOSIS_THRESHOLD_DIFFICULTY` | *executor-tuned, 0–1* | Step 0 — can the god hold the doorway open long enough for the mortal to answer |
| `APOTHEOSIS_VESSEL_DIFFICULTY` | *executor-tuned, 0–1* | Martyr variant — does the frame hold what is poured into it |
| `APOTHEOSIS_WITHDRAWAL_DIFFICULTY` | *executor-tuned, 0–1* | Survivor variant — does the doorway close gently or is the withdrawal felt |
| `ASPECT_REOFFER_COOLDOWN_TICKS` | *existing* | Re-offer delay; the felt-withdrawal and unmade endings extend it rather than minting a second constant |

Defaults are left to the implementation pass on purpose: they are tuning, they are cheap to change, and picking them here from no playtest would be a number invented in a document instead of a number measured in the game. Naming them is the NFP #1 obligation; fixing them is not.

## Tracing

N/A — no new trace type. The conversion emits what the shipped machinery already emits: the branch decision (pole, profile lean, card lean, `decidedBy: 'conviction' | 'coin'`), the step resolutions, and `aspect_attained` on a grant. A new trace here would duplicate an existing one, which is worse than none.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Mortal has no reading on `sacrifice_survival` | `decidedBy` collapses to the coin path (`decidedBy: 'coin'`) — already the resolver's behaviour, no new handling |
| Hand filters to empty for this god | Impossible by authoring rule (≥1 common option); the invariant test must pin a **non-empty** population or it proves nothing |
| Aftermath override missing for a rolled band | `byOutcome` is optional; resolution falls through to the base variant exactly as a band-less config does today |
| `grant_aspect` fires with no mortal resolvable | Existing guard (`encounterAftermath.ts:3279`, `reason: 'no_mortal'`) — no grant, traced, no throw |
| Re-offer fires while an `aspect_of` edge already exists | `grantAspect` is idempotent (THR-479); the seeding phase should also skip, and the executor confirms which layer holds it |

## Three-pillar check

- [x] Engine pillar present — N/A with the substrate cited per capability, not asserted
- [x] Content pillar present
- [x] UI pillar present — N/A with the reason, per the ticket's explicit flag-if-so instruction
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It closes the last contradiction of one: the north star's *"intervention shifted the odds, not the outcome"* was false of this template by construction, and is true of it after.
- [x] Player-as-god framing strengthens — the god acts on the scene's physics and never on the mortal's ending.

## Interface impact

The conversion consumes existing contracts and retires one. No contract is added, so `scripts/interface-contracts.ts` needs no new row — but the retirement does need its asserting tests repointed, which is the whole reason this section is not "none".

| Contract | Action | Note |
|---|---|---|
| `ActionStepBranch.decidedBy` → `branchDecision` resolver | **preserve** | New consumer, unchanged contract. Three templates already read it |
| Nudge hand resolution (`nudges.ts`, `useNudgeHand`, `nudgeCommit`) | **preserve** | Consumed as-is; no new field |
| `AftermathVariant.byOutcome` (THR-969) | **preserve** | New consumer of an existing optional override path |
| `grant_aspect` → `grantAspect` (`encounterAftermath.ts:3271` → `aspects.ts:80`) | **preserve** | Same effect, band-gated at the authoring layer rather than the engine |
| `authoredChoices` on this template | **retire (per-template)** | The layer stays for the templates still using it — this is the last one, so the executor confirms whether any test asserts the *dead side* of this template's fork and deletes or repoints it. A green test on a retired contract is the pathology the interface map exists to kill |

## Rulebook impact

- [x] **This plan changes a rule of play** — how the Aspect apex is reached is a rule of play. `Docs/canon/rulebook.md` (and the quick-reference, which names the apex) is updated in the implementation PR, not as a follow-up. `Docs/canon/encounters.md` gains a line noting the last `authoredChoices` template is converted.
- [ ] The rulebook edit lands in the **implementation** PR (THR-1086), not this one — this document decides the rule change; it does not yet enact it, and a rulebook that describes an unshipped mechanic is worse than one that lags by a ticket.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Three difficulties named; guardrails inherited from `nudgeAuthoringConstants.ts` rather than duplicated; defaults deferred to measurement, with the reason stated |
| 2. Inspectability | PASS | Existing traces cover the decision, the rolls and the grant; a new trace would duplicate one |
| 3. Determinism | PASS | Seeded throughout — `branchDecision`'s coin path and the shared ladder both draw from seeded streams; no `Math.random()` introduced |
| 4. Fail-soft | PASS | Table above; every row resolves to shipped behaviour rather than new handling |
| 5. Narrative over mechanical | PASS | The whole decision is this NFP: the fork is kept because deleting it would be mechanically cleaner and narratively poorer, and the roll is spent on restoring the "unmade" ending |
| 6. Additive over destructive | PASS with note | One deletion — `authoredChoices` on this template — which is the point of the ticket. Everything else is additive; no other template is touched, so the per-template staged rollout is preserved |
| 7. Performance budget | N/A | One template's data; no tick-loop work added |

## Done when

*This document is THR-866's first Done-when. The second is the follow-up implementation ticket, filed alongside it.*

- [x] A committed decision on how `encounter.apotheosis.ascension` translates `authoredChoices` into the Nudge Model without losing apex-beat weight
- [ ] Follow-up Ready-for-Dev ticket filed for the mechanical pass, referencing this decision

## Coordination block

**Suggested model:** `opus` — content authoring with register judgment and a band-keyed ending set (advisory; the CC automation runs Opus regardless)

**Parallel-safe with:** every other WS5 batch ticket — they edit different templates, and this one touches a single file no other ticket names

**Mutex with:** none — `src/data/encounters/apotheosis-ascension.ts` is scoped to this work alone, and the decision deliberately edits no shared type

**Files to touch:** *(the implementation pass — THR-1086. This document itself touches only `Docs/`.)*
- Edit: `src/data/encounters/apotheosis-ascension.ts` (the conversion)
- Edit: `src/data/nudge-constants.ts` (three difficulty constants)
- Edit: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/encounters.md`
- Possibly edit: `src/engine/__tests__/nudgeModel.test.ts` or a template-local test (population invariants — pinned non-empty)

## Notes for the executor

- **Verify the fork is reachable both ways before authoring the prose.** A `decidedBy` pole fork on a population whose `sacrifice_survival` all sits at one end is a branch that exists and never fires — the THR-844 shape wearing new clothes. The balanced test avatar (`?testavatar`) seeds neutral value axes precisely so THR-894 forks stay reachable in both directions; use it, and confirm with a real draw rather than by reading the schema.
- **Both endings are provable from a URL without replaying for luck.** `?view=game&seeded&size=medium&spawn=encounter.apotheosis.ascension&outcome=<band>` pins the resolved band, and `await window.__DEBUG.getOutcomePinVerdict()` says whether you are actually looking at it — `unauthored_band` means nobody wrote that band and the base ending is on screen, which is exactly the failure this conversion's four new endings could ship with.
- **Read `resolveAftermathVariant` before deciding where the grant sits** (`src/types/unifiedAction.ts:1426`). The override composes onto the base variant field by field; whether `changes` or `reactions` carries an irreversible write changes what a player can decline.
- The re-offer loop is the one thing worth watching in playtest (see also the Forked-audit note below): a god who leans Survivor every time still faces a fresh decision each cooldown, and a strongly-Martyr mortal will eventually say yes. That is the fiction working as intended, but if it reads as attrition rather than inevitability, the fix is a lean-magnitude floor or a `requiresFavor` gate on the Martyr variant — a tuning change, not a redesign.

## Forked-audit verdicts

**Run inline, not forked — stated so the heading is not read as more assurance than it carries.** The design-audit-pipeline spawns three independent auditors; this was a single-pass self-audit against the same three rubrics, per design governance's "draft → audit → revise → summarize happen in a single internal pass, before the user sees anything." A scheduled execution run does not spawn subagents unless asked. What follows are that pass's verdicts.

### NFP audit

PASS — see the compliance table above. The one row worth restating: **NFP #1 is satisfied by naming the three difficulties, not by picking their values.** Defaults are deliberately deferred to the implementation pass, because a number chosen in a document from no playtest is a number that will be wrong and will be cited as decided.

### Three-pillar audit

PASS. Content is present and substantive. Engine and UI are `N/A` **with the substrate cited per capability** rather than asserted — every mechanism is named with its production reader (`branchDecision.ts`, `nudges.ts`, `byOutcome` resolution at `unifiedAction.ts:1426`, `encounterAftermath.ts:3271`), which is the check that distinguishes a real N/A from an unwritten pillar. The UI N/A additionally answers the ticket's own explicit "flag if so" instruction rather than passing over it in silence.

### Vision audit

PASS. The north star's *"intervention shifted the odds, not the outcome"* was **false of this template by construction** — the god pressed a button at `difficulty: 0` and received an ending — and is true of it after. No Vision premise is contradicted and none needs editing, which is the difference between this and THR-868, whose conversion knowingly retired the taste-profile's prose quality bar and carried that edit in scope.

**One finding the audit raises and the design deliberately accepts:** an aspect *can* be granted against the player's lean, when a strongly-Martyr mortal outweighs a Survivor-leaning hand. That is THR-894's contract working as written — the mortal's choice is theirs to keep — and a god who spent the game making a Martyr does not get to be surprised by one. It is nonetheless the single place a reviewer should push back, because `aspect_of` is permanent where a soul value is not, so it is recorded here rather than buried: the kill criterion is a playtest reading of *attrition* rather than *inevitability*, and the fallback is a lean-magnitude floor or a `requiresFavor` gate — tuning, not redesign.
