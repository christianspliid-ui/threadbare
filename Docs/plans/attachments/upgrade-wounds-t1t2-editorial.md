# Editorial Review: upgrade-wounds-t1t2
> Reviewer: Editorial Agent | Date: 2026-04-06
> Mode: UPGRADE batch — names/flavor/tags preserved where possible. Focus on mechanicalSummary accuracy vs effects[] and primitive variety.

---

## Verdict: PASS WITH REVISIONS

The batch has strong naming, excellent flavor text, and good primitive variety. Two items use `flesh` as a reach domain, which does not exist in `ReachDomain` (valid: iron, gold, shadow, veil, heart, eye, stone, star). This is a type error that will fail compilation. The editorial fix substitutes `heart` for `flesh` since heart governs vitality, endurance, and bodily resilience -- the closest semantic match. One mechanicalSummary has a minor arithmetic discrepancy. Tags and IDs are clean.

Since this is an UPGRADE batch, names and flavor text are preserved. Only mechanical accuracy and type correctness are revised.

---

## Per-Item Review

### 1. Fractured Arm
- **Name Quality:** PASS. Concrete, clinical, evocative without being theatrical.
- **Flavor Text:** PASS. "The bone set crooked. Every swing ends in a wince." -- excellent. Terse, physical, lived-in.
- **Tags:** PASS. `#wound #physical #iron #combat` -- correct reach, correct category.
- **Mechanical Summary:** PASS. "-0.05 Iron (decays toward 0 over 24 ticks, self-removes on heal)" -- matches effects. Math check: 0.05 / 0.002 = 25 ticks. Summary says "24 ticks" which is close enough (the ~25 in the notes is more accurate, but "24" is within rounding). No revision needed.
- **ID Convention:** PASS. `reward_condition_fractured_arm`.

### 2. Gashed Leg
- **Name Quality:** PASS. Visceral, specific body part, implies history.
- **Flavor Text:** PASS. "The bandage is soaked through again. Walking is a negotiation with pain." -- strong image, Threadbare tone.
- **Tags:** ISSUE. `#flesh` is not a valid reach domain. Should be `#heart` (vitality/endurance).
- **Mechanical Summary:** ISSUE. References "Flesh" which is not a valid reach. Should read "Heart".
- **Effects:** ISSUE. `reach: 'flesh'` is not a valid `ReachDomain`. Must be `reach: 'heart'`.
- **ID Convention:** PASS.
- **Revision:** Change `flesh` to `heart` in tags, mechanicalSummary, and effects. This is a type correctness fix, not a balance change.

### 3. Cracked Ribs
- **Name Quality:** PASS. Clean, medical, no-nonsense.
- **Flavor Text:** PASS. "Each breath is shallow. Laughter is out of the question." -- understated, darkly funny.
- **Tags:** PASS. `#wound #physical #iron #combat`.
- **Mechanical Summary:** PASS. "-0.02 Iron always, -0.04 Iron in combat (total -0.06 in combat)" -- matches passive(-0.02) + conditional(-0.04) exactly.
- **ID Convention:** PASS.

### 4. Bruised Knuckles
- **Name Quality:** PASS. Simple, tangible, implies a recent fight.
- **Flavor Text:** PASS. "Purple and fat, the fingers refuse to close properly." -- vivid, physical. Shows the wound rather than telling.
- **Tags:** PASS. `#wound #physical #stone #combat` -- stone for dexterity/craft is correct.
- **Mechanical Summary:** PASS. "-0.03 Stone (heals fast, gone in ~12 ticks)" -- 0.03 / 0.0025 = 12 ticks exactly. Matches.
- **ID Convention:** PASS.

### 5. Deep Stab Wound
- **Name Quality:** PASS. Direct, serious, no euphemism.
- **Flavor Text:** PASS. "The blade went deep. Something inside is not where it should be." -- brilliant. Understated horror.
- **Tags:** ISSUE. `#flesh` is not a valid reach domain. Should be `#heart`.
- **Mechanical Summary:** ISSUE. "-0.07 Iron, -0.05 Flesh" references invalid reach. Should read "-0.07 Iron, -0.05 Heart".
- **Effects:** ISSUE. Second passive uses `reach: 'flesh'`. Must be `reach: 'heart'`.
- **ID Convention:** PASS.
- **Revision:** Change `flesh` to `heart` in tags, mechanicalSummary, and effects.

### 6. Shattered Shield Arm
- **Name Quality:** PASS. Evocative, implies a story (they were blocking when it broke). The name tells you what the wound costs -- defense.
- **Flavor Text:** PASS. "The bones ground together like millstones. The shield hangs useless." -- the simile is good. Functional and grim.
- **Tags:** PASS. `#wound #physical #iron #combat`.
- **Mechanical Summary:** PASS. "-0.08 Iron (decays over 36 ticks), blocks Iron actions in combat" -- matches decay(-0.08, 0.0022/tick, limit 0) + action_gate(block, iron, in_combat). Math: 0.08 / 0.0022 = 36.4 ticks. Accurate.
- **ID Convention:** PASS.

### 7. Blinded Eye
- **Name Quality:** PASS. Stark, direct. The simplicity is effective.
- **Flavor Text:** PASS. "The world is flat now. Distance is a guess, and guesses get you killed." -- outstanding. Captures depth perception loss poetically without being flowery.
- **Tags:** PASS. `#wound #physical #eye #combat` -- eye reach is correct for a sight-based wound.
- **Mechanical Summary:** PASS. "-0.08 Eye, -1 awareness range, 0.6x combat desire (fear of fighting blind)" -- matches passive(-0.08 eye) + range_modifier(awarenessRangeBonus: -1) + behavior_weight(iron, 0.6). The parenthetical explanation of the behavior_weight is helpful.
- **ID Convention:** PASS.

### 8. Bruised Ribs (Starter)
- **Name Quality:** PASS. Clear distinction from "Cracked Ribs" -- bruised is lighter, appropriate for a starter.
- **Flavor Text:** PASS. "Every breath is a reminder of the blow you survived." -- good starter tone, slightly more hopeful than the T1/T2 wounds.
- **Tags:** PASS. `#wound #physical #iron` -- no #combat tag, which is fine for a starter.
- **Mechanical Summary:** PASS. "-0.03 Iron (decays fast, gone in ~12 ticks), -0.02 Iron extra in combat" -- matches decay(-0.03, 0.0025/tick) + conditional(in_combat, iron, -0.02). Math: 0.03 / 0.0025 = 12. Accurate.
- **ID Convention:** PASS. `starter_bruised_ribs` follows starter convention.

---

## Batch-Level Checks

### Variety
- **Reach diversity:** Iron (5), Stone (1), Eye (1), Heart (2 after fix). Lean toward iron, but appropriate for wound conditions -- most wounds affect combat capability. PASS.
- **Tier spread:** 5x T1, 3x T2. Reasonable for a wound catalog. PASS.
- **Primitive variety:** 7 distinct primitives across 8 items. Excellent. Each wound has a distinct mechanical feel despite all being "injuries." PASS.
- **Healing variety:** Self-healing decay (5 items), persistent requiring treatment (2 items), mixed decay+conditional (1 item). Good spectrum. PASS.

### Naming Cohesion
All names follow the pattern: [Severity Adjective] + [Body Part/Injury Type]. Consistent, readable, immediately communicates what the wound is. No generic fantasy names. PASS.

### Flavor Text Cohesion
Uniformly Threadbare: terse, physical, dark, no exclamation marks, no heroic framing. Each wound is described from the perspective of lived experience rather than game mechanics. PASS.

---

## Issues Summary

| # | Item | Issue | Severity | Fix |
|---|------|-------|----------|-----|
| 1 | Gashed Leg | `flesh` is not a valid ReachDomain | Type error | Change to `heart` in tags, summary, and effects |
| 2 | Deep Stab Wound | `flesh` is not a valid ReachDomain | Type error | Change to `heart` in tags, summary, and effects |

Both fixes are applied in the revised file. No name, flavor text, or effect structure changes -- only the invalid reach domain is corrected.
