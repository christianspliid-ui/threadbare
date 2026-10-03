# Encounter Pipeline: The Hired Knives
> Scale: short | Slug: hired-knives | Pass: editorial
> Date: 2026-10-03 | Pipeline version: 2.0

**Verdict: PASS WITH REVISIONS.** All edits are applied in `hired-knives-revised.md`.
The design is sound. It is a clean Danger, Confrontation, Aftermath beat that pays off the
detection-pressure cost, and the hand repeats the encounter's own trade (Veil against Heavy
Hand). Three things needed fixing. First, one ending made a claim the engine does not write
on one of its two paths. Second, there were five vagueness-detector hits the draft's
self-audit missed. Third, the band overviews echoed the step afterimages above them. None
of these is structural, and all of them are fixed inline.

---

## Rulings on the drafter's flags

**D1 — success_at_cost bond (brief: strained; draft: up). ACCEPTED, with corrected reasoning.**
I checked the band mechanism first, as instructed. `AftermathOutcomeOverride` (`src/types/unifiedAction.ts`)
carries `overview`, `changes`, `reactionPrompt` and `reactions`, and nothing else. So a band
can own an effect only through a reaction. A single-reaction band would fire it every time:
`phaseAutonomousAftermath` applies `reactions[0]`, and an attended player confirms the only
click. So it *is* expressible. It is still the wrong route. A reaction is the god's lean.
A one-option reaction that strains a bond is a click that delivers harm. The Swollen Ford
exemplar's critique struck exactly that shape ("a click whose label promised memory and
delivered harm … Bands do not owe reactions").

The draft also undersold its own routing. `computeFinalActionOutcome` turns any
continued step failure into `success_at_cost`. So whenever step 1 fails and step 2 succeeds,
the action lands on **success_at_cost**, and step 1's failure write (the warner's face
exposed, bond −0.05) fires on that band. The brief's "someone close paid" is therefore real
on that band's most common path: a real write, narrated by step 1's failure afterimage. The
net bond on success_at_cost is still at least +0.05 on every path, so the chip "trusts
{actor} more" is true everywhere it renders. Keep it.

**D2 — failure vs critical_failure write the same. ACCEPTED. But it hid a real defect, now fixed.**
The lattice limit is real. Step effects split on `isStepSuccess` only. The defect is the one
the draft did not see. `advanceStep` / `terminalActionOutcome` force `fail_action` on **any**
`critical_failure`, whatever the step's `failBehavior` says. So a step-1 critical failure
ends the encounter before step 2 runs, and the action resolves `critical_failure` with only
step 1's writes (bond −). The draft's critical_failure page claimed **Wounded** and the
**fear compulsion** on that band, and it narrated a knife landing. On that path neither was
written and no knife was drawn. That is a Law 56 failure on one path. The machine gate
cannot see it: `chipBackingViolations` is a per-band floor, not a per-path proof.

The fix is applied. The critical_failure page is now path-agnostic. Its only chip is the
**BOND** loss, which both paths write. Its overview is true on both paths. The wound and the
fear drive still land on the step-2 path, where `failureMetadata` writes them, and the step-2
critical-failure afterimage narrates them ("they ran bleeding"). The step-1 critical-failure
afterimage now ends its own scene ("had to run with the knives at their backs"). The
carryover row keyed on step 1's `critical_failure` was unreachable, so it is deleted.

The cost is plain: the worst ending shows fewer chips than `failure`. That is the honest
trade. A chip that under-reports is a weakness. A chip that claims an unwritten wound is a
defect. `trait.condition.terrified` stays unused for the same reason.

**D3 — crit-success drive aimed at an unnamed sender. ACCEPTED, intent rewritten.**
The seed carries no sender node, so offering Seek Revenge as a reaction is right. The draft's
intent, "The sender becomes the one being sought", promised later behaviour that no effect
enacts toward any sender. That is prose rule 7b. The intent now says only what the ambition
does: they wake wanting to repay the strike, whether or not the payer is ever found.

**Rouse The Witness typed as Compulsion — LAWFUL as a nudge, MIS-TYPED as Compulsion. Re-typed.**
It is lawful because it is a mind-sphere touch on a bystander's mind. The mortal still
chooses, fate still rolls, and nothing instructs the mortal. That is the nudge line kept on
both halves. It is mis-typed because the library Compulsion (`nudge-card-library.ts`) is "a
dream-sent urge shaping **the mortal's** next decision", hosted as a decision bias in
`phaseAgentDecision`. This card carries no such mechanic. It is a plain `forecastDelta`, with
no `grants`, and `StepNudge` has no cast-target selector at all. The only cast-scoped field
is Stumble's `opposes`, and this card does not oppose anyone.

The "binding model's target selector" the draft's comment describes does not exist. The
card is a **sphere-keyed Boost (mind), person-scoped**. A "named person to lean on" is the
spec's own example of what makes a special a special (§ 3b). The comment is corrected and
the effect line made generic ("a bystander" in place of "the one person watching").

**Scene-local history vs trigger 31 — ACCEPTED.** "Followed for three days" and "asked
for {actor} by name" are facts about scene-only people who have no life outside this
encounter. That is the lawful scene-local class. They assert no relationship, debt, prior
visit or standing between the mortal and any graph object. `{cast:warner}` is given no prior
tie: "has seen them too" is a scene-local observation. No trigger.

**Sphere spread depends on the dealer fill — ACCEPTED, verify at the gate.** Both steps
are `deal`-bearing, and § 3b stands the whole-hand variety rules down on such a step. The
dealer prefers sphere breadth and at least one ungated common card. That is a preference,
not a proof, so `checkComposedHand` at `check:encounter` must report ≥4 spheres and a common
option on each step. That gate belongs to Pass 3 and implementation, not to this pass.

**Premise truth on the Infiltrator's planter — SHOULD-FIX, routed to Pass 3.** The
detection planter makes "a god's help was seen around {actor}" true by construction. The
Infiltrator's Approach seed ("The betrayed master moves first") does not guarantee it, and it
still uses the deprecated `encounterFamily` operand. This encounter is the detection payoff
and should not dilute its cause sentence for a legacy planter. Pass 3 should either re-point
that seed (a betrayed master's knives are a different fiction) or record the loose fit as an
accepted caveat.

---

## 1. Prose Quality

The opening and spine are good narrator mode: plain, front-loaded, one stake ("They will
not wait another night"). They come in at 57–60 words. No rewrite.

**Detector hits the self-audit missed (trigger 15 — all fixed).** The self-audit checked
only `something/someone/things/nothing`. The outcome class also enforces `way`, `whatever`
and `anyone`:

| Field | Draft | `[EDITORIAL REWRITE]` |
|---|---|---|
| Step 1 afterimage, crit_success | "…watched them search the wrong **way**." | "…watched them search in the wrong direction." |
| Step 1 afterimage, success_at_cost | "…the strangers saw which **way** they ran." | "They lost the strangers by running, but the strangers saw where they went." |
| Veil fragment, near_miss | "…they had guessed the **way** already." | "…they had already guessed where {actor} would go." |
| Rouse fragment, near_miss | "…hurried to finish before **anyone** came." | "…hurried to finish before help came." |
| Failure overview | "…left to face **whatever** came after." | Rewritten in full (see § 6b). |

**Seam echoes (Q4b, fixed).** Every final-band overview retold the step-2 afterimage
directly above it:

- failure: "broke away … ran" twice
- critical_failure: "the first knife … bleeding" twice
- success_at_cost: "got clear … everyone close by saw" twice
- success: "got past both knives unhurt" twice

The Swollen Ford rule applies: an overview says only what it alone can say. The overviews
now state the after-state, and the afterimages keep the moment. The step-2 spine's "before
the night is out" echoed step 1's closing "another night", so it now reads "before dawn".

**Smaller fixes:**

- The step-2 failure afterimage now carries the knife alone ("One knife cut them before
  they broke away and ran."). The warner moves to the overview, so the fact is told once.
- The step-1 critical-failure afterimage now closes its own scene (D2).
- `narrativeTemplates.failure`, "The knives found {actor}", was false on the step-1
  critical-failure path. It now reads "The hired knives caught up with {actor}, and {actor}
  had to run."
- The Shatter fragment's "a crack heard down the road" named class scenery in an outcome
  fragment. It now reads "heard far off".

## 2. Branch Seduction Audit

The encounter is linear, so there are no branches to audit. The mortal's "stand or run" is
real in the fiction and expressed through the step-2 ladder. That is the right home for it at
this scale, and nothing asks the player to pick a path.

## 3. Branch Count Assessment

**KEEP 0.** A fork here would split a payoff beat that has one job.

## 4. Scale Discipline Check

Short scale with 2 beats is correct. The reactions on one band are within the short-scale
allowance and earned (§ 7).

## 5. Inspiration Anchor Honesty

The anchors are honest. *Compassion vs. Power* visibly shaped the hand: the quiet card costs
more essence and cools the region, and the loud card is cheap and heats it. *Dark Lord*
visibly kept the sender off stage. *Endless Pursuit* is a light touch, and the draft says so.

## 6. Aftermath Payoff

Every band now lands on the mortal and a named person, `{cast:warner}`. The detection loop
closes in the kit summary: how the god answered this strike decides how soon the next comes.
That is the encounter's real payoff, and it is carried by real `detectionDelta` writes.

## 6b. Page read (assembled, per band, after the rewrite)

**critical_success**
```
One of the strangers let it slip before the end: they had been paid to stop a god's help.
- SCAR · compulsion — For a while they avoid hiring, trading with, or helping strangers.
- BOND · reputation with {target} — Heeded the warning — {cast:warner} trusts {actor} more.
> Kindle a hunger for revenge — They wake wanting to repay the strike, whether or not the payer is ever found.
> Leave their anger be — No grudge is kindled. The god's hand stays still.
```

- Repetition: none. The draft's prompt ("They know now that someone paid") restated the
  overview, so the prompt is now just "What do they carry out of it?". The draft's second
  reaction (bond up again) offered back what the BOND chip had already stated, the exact
  page defect spec § 1c names. It is replaced with the god's restraint, an effect-less
  stance against kindling.
- Conflict: the draft overview ("had one stranger down") contradicted the path where step 1
  was the critical success and step 2 a plain success ("got past the knives and out of
  reach"). The new overview is true on every critical-success path.

**success**
```
By morning the strangers had left {location}, and nobody there knew who had paid them.
- SCAR · compulsion — For a while they avoid hiring, trading with, or helping strangers.
- BOND · reputation with {target} — Heeded the warning — {cast:warner} trusts {actor} more.
```

Clean. The draft's "Stood together through it" conflicted with the spine ("{cast:warner}
shouts and backs away"), so it is replaced.

**success_at_cost**
```
{actor} is clear of the strangers, but only just.
- SCAR · compulsion — For a while they avoid hiring, trading with, or helping strangers.
- BOND · reputation with {target} — {cast:warner} trusts {actor} more now.
```

Clean. The draft's overview repeated the afterimage (seam echo), and it hung on the
warner's shout, which the base spine carries but the band itself does not need.

**failure**
```
{actor} escaped the strangers, but left {cast:warner} behind to face them alone.
- SCAR · Wounded — {actor} is wounded until the cut heals.
- SCAR · compulsion — For a while they shy from fights and far roads.
- BOND · reputation with {target} — {cast:warner} trusts {actor} less now.
```

Clean. The bond chip carries no cause clause, because the overview already gives it.

**critical_failure**
```
{actor} lived through the night, and {cast:warner} saw how close it came.
- BOND · reputation with {target} — Too dangerous to stand near — {cast:warner} trusts {actor} less.
```

Clean and true on both paths (D2). The draft's version claimed Wounded and fear on a path
that writes neither. That was a conflict between the page and the world, which is worse
than a conflict within the page.

## 7. Dilemma Energy

This is a test, not a fork, and it is honestly declared. The dilemma lives in the hand. The
god pays in essence to stay quiet or pays in attention to be strong, and the strong option
is what summoned the knives. That choice reveals the god's posture. The one reaction fork is
now a real stance pair: kindle a grudge, or keep the hand still.

## 8. Experience Differentiator Gate (on the revised text)

**Scene & Prose**
1. Narrator skeleton, ≤80 words? **YES.** Arrival per class, the tail and the warner, then the stake; 57–60 words.
2. Every sentence works? **YES.** No sensation, no camera.
3. Scene names what the hand acts on? **YES.** Trail, the people behind, the blades, the warner.
4. Retell after one read? **YES.** "Paid knives have followed them three days; tonight they strike."
4b. No seam echoes? **YES, after the rewrite.** The draft answered NO in fact: four overview↔afterimage echoes plus the "night" seam, all fixed.

**Choices & Intervention**
5. Spell-style faces, no scene-bespoke prose? **YES.** Specials name their targets, which is lawful for specials. Rouse is reworded to "a bystander".
6. Mechanism and real prices? **YES.** Essence, detection down and up, and being Bitter. Doubt Every Face's effect line now states what the card does instead of "and they look".
7. Failure payoff on every card, big-delta both bands? **YES.**
8. Grounded? **YES.**
9. Different questions? **YES.** Unseen, suspicion, break the weapon, raise help.
9b. Composed 4–8, no player-picked branch? **YES** (6 / 5–6 dealt). Sphere count is to be confirmed by `checkComposedHand`.

**Aftermath & Consequence**
10. Landing prose? **YES.**
11. Actor-centred, sheet-word nouns? **YES.** `Wounded`, `compulsion` (corpus precedent: bell-at-the-exchange, drowned-mans-testimony), `reputation with {target}`.
11b. Every band's page clean? **YES, after the rewrite** (§ 6b).
12. Medium+ reactions? **N/A** at short scale. One band carries a lawful pair.
13. Philosophical stances? **YES.** Kindle a grudge, or the god's restraint.

**Presentation**
14. Two-question art? **YES.** The knife and coin left on the post is residue, not the fight.

## REVISE triggers, checked 1–35

The draft carried trigger-15 hits (five words) and trigger-22/35 echoes. All are fixed
inline and none is structural. Re-reading the revised text: 1–35 clear.

- Trigger 13: the warner's shout is in the base spine, not card-only.
- Trigger 23: the factor lines are a trait variant plus band-keyed carryover.
- Trigger 31: ruled above.
- Trigger 34: no later place or time promise. The Seek Revenge intent was rewritten.

## 9. Verdict

**PASS WITH REVISIONS** — applied in `hired-knives-revised.md`.

## 10. Revision Summary

**Must fix (applied):**

- Critical_failure page is path-agnostic. Its only chip is BOND, because a step-1 critical failure ends the encounter with only step 1's writes (D2).
- The unreachable step-1 `critical_failure` carryover row is deleted.
- Five vagueness hits (`way` ×3, `anyone`, `whatever`) are fixed.
- Four overview↔afterimage seam echoes and the "night" seam are fixed.
- The critical_success overview conflicted with one of its paths, and the reaction duplicated the BOND chip. Both are fixed.

**Should fix (applied):**

- Rouse The Witness is re-typed as a mind Boost special, its comment is corrected and its effect line is genericised.
- The Seek Revenge intent no longer promises a sender hunt (7b).
- Doubt Every Face's effect line now states mechanism.
- The success bond cause no longer contradicts the spine.
- `narrativeTemplates.failure` is now path-true.
- The Shatter fragment no longer says "road".

**Consider / route to Pass 3:**

- Confirm ≥4 spheres and a common option per step via `checkComposedHand`.
- Re-point or accept the Infiltrator's Approach planter (premise truth plus the deprecated operand).
- If the corpus ever wants a wound chip on a crit-fail band reachable from a mid-step crit, that needs an engine ticket (path-scoped step effects), not this encounter.
