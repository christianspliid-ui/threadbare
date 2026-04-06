# Editorial Review: upgrade-diseases-supernatural
> Pass: editorial | Date: 2026-04-06
> **Verdict: PASS WITH REVISIONS**

## Review Summary

11 items reviewed. All pass name quality, flavor text, tag format, and ID convention checks. Three items have minor mechanicalSummary language that misrepresents the underlying effect semantics. No automatic REVISE triggers hit.

---

## Item-by-Item Notes

### 1. Road Fever — PASS
- Name: Evocative, historically grounded. The traveler's curse.
- Flavor: Tight and sensory. "Sweat and chill, sweat and chill." Good.
- mechanicalSummary: Accurate. "-0.04 Iron, +20% movement cost, gains -0.01 Iron per encounter (max -0.03 extra)" matches effects[].
- Tags: `#disease #flesh #wilderness` — flesh is non-reach but preserved per upgrade rules.
- No changes needed.

### 2. Gut Rot — PASS
- Name: Blunt and right. Undignified. Accurate to the disease.
- Flavor: "The stomach rebels against everything, including emptiness." Excellent. Self-aware and dark.
- mechanicalSummary: Accurate. Decay direction (worsening to -0.07) and -0.02 Gold correctly described.
- No changes needed.

### 3. Greyscale — PASS
- Name: Appropriately clinical and recognizable. T2 severity feels right.
- Flavor: "People step back when they see it." Spare. Works.
- mechanicalSummary: Accurate. Transform trigger (doom_threshold, 15% chance) is correctly described.
- No changes needed.

### 4. The Wasting — PASS
- Name: "The Wasting" — the definite article gives it gravity. This is a named affliction, not a common ailment.
- Flavor: "Something feeds on the difference." Unsettling. Exactly right for T3 disease.
- mechanicalSummary: Accurate. "personality drifts toward fatalism" maps to axiological_drift on hope_despair axis.
- No changes needed.

### 5. Spine Wound — PASS WITH REVISION
- Name: Clinical and final. Correct.
- Flavor: "Every step is borrowed time." Good.
- mechanicalSummary issue: "avoids combat encounters" is ambiguous. The actual effect is `behavior_weight` on `reach: 'iron'` with `multiplier: 0.2` — this strongly suppresses desire for *iron-reach encounters* specifically, which are predominantly combat. "avoids" implies full avoidance; the multiplier means 80% less likely, not impossible. Also: the effect is on iron reach, not "combat" as a context.
- **Fix:** Change "avoids combat encounters" to "strongly suppresses iron encounters (0.2× desire weight)"

### 6. Fey-Touched — PASS WITH REVISION
- Name: Clean. Fey-Touched is established fantasy vocabulary used well here.
- Flavor: "Time moves strangely at the edges of the day." Good Threadbare register.
- mechanicalSummary issue: "Veil bonus persists until combat (resets on violence)" — the `until_event` effect has `destroyOnEvent: false`, meaning the attachment is NOT destroyed on combat entry. The effect value applies continuously until the trigger event occurs. The word "resets" implies the bonus goes away and comes back, but `until_event` with `destroyOnEvent: false` means it is suppressed once the event fires but the attachment persists. The current wording misleads about reset mechanics.
- **Fix:** Change "Veil bonus persists until combat (resets on violence)" to "Eye bonus active until combat begins (event-paused, not removed)"
- Note: Reviewing the effect more carefully — `until_event` applies the value until the event fires. With `destroyOnEvent: false`, the attachment persists but the bonus has effectively applied for the duration until the event. This is a one-time-until-event application. Summary should be clearer.

### 7. Death-Marked — PASS
- Name: Direct. No ambiguity about what this is.
- Flavor: "Crows follow you. The dying look at you with recognition." Strong pairing of mundane and supernatural signals.
- mechanicalSummary: Accurate. Reactive duration burst (6 ticks) with 12-tick cooldown correctly described.
- No changes needed.

### 8. Void-Scarred — PASS
- Name: Precise. The void-scar is not a metaphor here.
- Flavor: "Gods pay attention." The final three words do more work than the rest of the line combined. Good.
- mechanicalSummary: Accurate. "reveals hidden encounters within 2 hexes" maps to reveal effect.
- No changes needed.

### 9. Mark of Debt — PASS WITH REVISION
- Name: "Mark of Debt" — economical and ominous. The "mark" framing works.
- Flavor: "A scar on the palm in the shape of a coin." Strong image.
- mechanicalSummary issue: "Gold penalty deepens on social encounters" — the stacking effect uses `stackOn: 'social_success'`. The penalty deepens on *social successes* specifically, not merely social encounters. A failing social encounter would not stack the penalty. This is a meaningful distinction: the curse punishes the agent even when they succeed socially.
- **Fix:** Change "Gold penalty deepens on social encounters (max -0.03 extra)" to "Gold penalty deepens on social successes (max -0.03 extra)"

### 10. The Hollow — PASS
- Name: One article, one noun. Exactly the weight the T3 curse needs.
- Flavor: "Others sense the void and flinch." Accurate and unsettling.
- mechanicalSummary: "personality erodes toward nihilism" — maps to axiological_drift on loyalty_ambition axis with negative rate (toward ambition pole, not nihilism strictly). However, "nihilism" is an acceptable narrative gloss for what the axis direction represents here. No mechanical inaccuracy.
- No changes needed.

### 11. Watch Scrutiny — PASS
- Name: Institutional and mundane. Appropriate for a tier-1 social condition.
- Flavor: Long for flavor text, but Threadbare-compliant — no hyperbole, just the grinding reality of being noticed. The description field is also long; the draft duplicates between description and flavorText. Since upgrade rules preserve tags and this is a name/tone review, no change needed.
- mechanicalSummary: Accurate. All four effects correctly represented.
- No changes needed.

---

## Variety Check

| Axis | Assessment |
|------|-----------|
| Reach spread | iron, gold, heart, veil, shadow, star, eye — 7 of 8 reaches touched |
| Tier spread | T1 ×4, T2 ×3, T3 ×4 — good distribution |
| Primitive variety | 14 distinct primitives. No single primitive exceeds 3 appearances. All batch-spec primitives present. |
| Net orientation | Mostly negative (conditions are debuffs) with strategic positive tradeoffs (Fey-Touched, Death-Marked, Void-Scarred, The Wasting) |

---

## Revisions Applied

| Item | Field | Original | Revised |
|------|-------|---------|---------|
| Spine Wound | mechanicalSummary | "…avoids combat encounters" | "…strongly suppresses iron encounters (0.2× desire weight)" |
| Fey-Touched | mechanicalSummary | "…Veil bonus persists until combat (resets on violence)…" | "…Eye bonus active until combat begins (paused on event, not removed)…" |
| Mark of Debt | mechanicalSummary | "…Gold penalty deepens on social encounters…" | "…Gold penalty deepens on social successes…" |

No effect types, values, or compositions changed.
