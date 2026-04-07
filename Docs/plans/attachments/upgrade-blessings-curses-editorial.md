# Editorial Review: Blessings & Curses Conditions (Upgrade)
> Slug: upgrade-blessings-curses | Pass: editorial | Mode: upgrade
> Date: 2026-04-06

---

## Critical Flag: `flesh` Is Not a Valid ReachDomain

The type `ReachDomain` in `src/types/traits.ts` defines exactly eight reaches:
`iron`, `gold`, `shadow`, `veil`, `heart`, `eye`, `stone`, `star`.

**`flesh` does not exist.** Three items use it in effects or tags:

| Item | Usage | Recommendation |
|------|-------|----------------|
| Healer's Touch | `reach: 'flesh'` in passive and reactive effects; `#flesh` tag | Replace `flesh` with `stone` (physical resilience/endurance is Stone's domain). Remove `#flesh` tag, add `#stone`. |
| Earthblood Vigor | `reach: 'flesh'` in passive and reactive effects; `#flesh` tag | Replace `flesh` with `stone` (vitality drawn from the land aligns with Stone). Remove `#flesh` tag. Stone already appears in the passive layer, so consolidate values. |
| Healer's Touch tags | `#flesh` tag | Replace with `#stone`. |

**Impact on mechanicalSummary:** Every mechanicalSummary that references "Flesh" must be rewritten to reference "Stone" instead. This is flagged in the per-item reviews below.

---

## Per-Item Review

### 1. Dawn-Kissed (T1 Blessing)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Evocative, specific, hints at the temporal quality of the blessing. |
| Flavor Text | PASS | "The first light of morning seems to linger on your skin longer than it should." Understated, sensory, Threadbare. |
| Tags | PASS | `#blessing`, `#star`, `#divine`, `#healing` -- all valid. |
| Mechanical Summary | PASS | "+0.04 Star, +0.02 Eye when exploring" matches effects accurately. |
| ID Convention | PASS | `reward_condition_dawn_kissed` follows pattern. |

**No revisions needed.**

---

### 2. Healer's Touch (T1 Blessing)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Specific, tactile, suggests the bearer's gift without overselling. |
| Flavor Text | PASS | "Your palms tingle. The wounded lean toward you without knowing why." Excellent -- the involuntary pull is very Threadbare. |
| Tags | REVISE | `#flesh` is not a valid reach. Replace with `#stone`. |
| Mechanical Summary | REVISE | References "Flesh" three times. Must say "Stone" instead. |
| ID Convention | PASS | `reward_condition_healers_touch` follows pattern. |

**Revisions applied:**
- Tags: `#flesh` -> `#stone`
- mechanicalSummary: "+0.03 Heart, +0.03 Stone, temporary +0.03 Stone when healed"
- effects[]: `reach: 'flesh'` -> `reach: 'stone'` (both passive and reactive) -- **flagged but NOT changed in revised file per editorial mandate (do not change effects)**. The systems agent must handle this.

**Editorial note:** The reach substitution in effects[] is a mechanical change that falls under the systems agent's purview. I will update the mechanicalSummary and tags to match what the effects[] *should* say, and flag the `flesh` reach for the systems agent to correct.

---

### 3. Fortune-Marked (T1 Blessing)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Strong -- "Fortune-Marked" implies a visible sign of luck, not just abstract good fortune. |
| Flavor Text | PASS | "Coins turn up in pockets. Doors left ajar swing the right way." Concrete, small-scale, perfectly Threadbare. |
| Tags | PASS | `#blessing`, `#gold`, `#divine`, `#trade` -- all valid. |
| Mechanical Summary | PASS | "+0.04 Gold, rescues near-miss Gold outcomes (+1 step)" accurately describes the passive + test_shaper. |
| ID Convention | PASS | Correct. |

**No revisions needed.**

---

### 4. Saint's Ward (T2 Blessing)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Evocative -- the possessive suggests a named saint's protection, implying history. |
| Flavor Text | PASS | "Blades hesitate. Arrows veer. The faithful call it grace; the skeptical call it luck." Two perspectives in one sentence -- excellent Threadbare ambiguity. |
| Tags | PASS | `#blessing`, `#star`, `#divine`, `#heart`, `#healing` -- all valid. |
| Mechanical Summary | PASS | "+0.06 Star, +0.04 Heart, allies within 1 hex gain +0.02 Heart" matches effects accurately. |
| ID Convention | PASS | Correct. |

**No revisions needed.**

---

### 5. Earthblood Vigor (T2 Blessing)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | "Earthblood" is a strong compound -- suggests something drawn from the land itself. |
| Flavor Text | PASS | "You sleep on bare earth and wake restored. The soil knows your name." The personification of soil is good Threadbare -- the world as animate, watching. |
| Tags | REVISE | `#flesh` is not a valid reach. Replace with `#stone`. But note: Stone is already in the tags. Remove `#flesh`, keep `#stone`. |
| Mechanical Summary | REVISE | References "Flesh" twice. Since both passive effects use Stone-adjacent concepts (endurance, recovery, vitality), and the item already has a Stone passive, the summary should reference Stone. New: "+0.05 Stone, +0.05 Stone, temporary +0.04 Stone buff that fades over 12 ticks after resting" -- but that's awkward with two Stone passives. Better: "+0.10 Stone (two layers), temporary +0.04 Stone buff that fades over 12 ticks after resting". |
| ID Convention | PASS | Correct. |

**Revisions applied:**
- Tags: remove `#flesh` (Stone already present)
- mechanicalSummary: rewritten to reference Stone, clarifying the two-passive structure
- effects[]: `reach: 'flesh'` -> flagged for systems agent (not changed here)

**Editorial note:** With `flesh` -> `stone`, both passives target Stone. The design notes say "0.10 passive" which matches 0.05 + 0.05. The systems agent should consider whether collapsing into a single `{ type: 'passive', reach: 'stone', value: 0.10 }` is cleaner, or whether keeping them separate serves a purpose (e.g., different removal conditions). That is a systems decision, not editorial.

---

### 6. The Anointing (T3 Blessing)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Strong. The definite article ("The") gives it weight -- this is not *an* anointing, it is *the* anointing. Implies uniqueness. |
| Flavor Text | PASS | "A smear of oil that will not wash away. You see the world as a god sees it -- and it is not kind." The final clause is excellent Threadbare -- power comes with burden. |
| Tags | PASS | `#blessing`, `#star`, `#divine`, `#eye`, `#ruins` -- all valid reaches/categories. |
| Mechanical Summary | PASS | "+0.10 Star, +0.05 Eye, +0.03 Eye in mystical contexts, rescues near-miss Star outcomes (+1 step)" accurately describes all four effects. |
| ID Convention | PASS | Correct. |

**No revisions needed.**

---

### 7. Ill Luck (T1 Curse)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Simple but effective. "Ill Luck" is the kind of phrase people actually use -- it sounds like something a village would name. |
| Flavor Text | PASS | "Things break in your hands. Deals sour. People stop meeting your eyes." Three short observations, escalating from objects to people. Good Threadbare rhythm. |
| Tags | PASS | `#curse`, `#shadow`, `#gold` -- valid. |
| Mechanical Summary | REVISE | Says "bad luck compounds: -0.01 Gold per combat failure" but the description says "Commerce and stealth suffer." The stacking trigger `combat_failure` is incongruent with the Gold reach and the "commerce" niche. The mechanicalSummary should honestly reflect what the effects say, even if the trigger seems mismatched -- that mismatch is for the systems agent to resolve. Summary adjusted to be literal. |
| ID Convention | PASS | Correct. |

**Revisions applied:**
- mechanicalSummary: minor clarification to be literal about `combat_failure` trigger

**Editorial note for systems agent:** The stacking trigger `combat_failure` feels mismatched with the Gold reach and "commerce" niche. Consider whether `trade_failure` or `gold_failure` would be more appropriate. This is a mechanical concern, not editorial.

---

### 8. Nightmares (T1 Curse)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Direct, evocative, universally understood. |
| Flavor Text | PASS | "You wake gasping. The dreams fade but the dread does not." The second sentence is the hook -- the residue is worse than the event. |
| Tags | PASS | `#curse`, `#heart`, `#veil` -- valid. |
| Mechanical Summary | PASS | "-0.04 Heart, slow drift toward ruthlessness, suppresses social encounters" accurately captures the three effects (passive, axiological_drift, behavior_weight). |
| ID Convention | PASS | Correct. |

**No revisions needed.**

---

### 9. Tonguebound (T2 Curse)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Name Quality | PASS | Excellent compound word -- immediately evocative, suggests both the physical (tongue) and the magical (bound). |
| Flavor Text | PASS | "The words form but the throat closes. Some truths have been locked away." The passive voice in the second sentence implies an external agent -- something did this. Very Threadbare. |
| Tags | PASS | `#curse`, `#heart`, `#shadow` -- valid. |
| Mechanical Summary | PASS | "-0.07 Heart, -0.03 Shadow, blocks Heart actions in social contexts, -0.01 Heart per social failure (max -0.03)" matches effects accurately. |
| ID Convention | PASS | Correct. |

**Editorial note:** The design notes mention stacking on `social_success` (not failure), which is a deliberate inversion -- the frustration of watching others succeed socially while tongue-locked. The mechanicalSummary says "per social failure" which contradicts the effects. Corrected in revised file to say "per social success" to match the actual trigger.

---

## Batch-Level Assessment

### Variety

| Dimension | Assessment |
|-----------|------------|
| Reach diversity | PASS -- Star (3), Heart (4), Gold (2), Eye (2), Stone (2+2 after flesh fix), Shadow (2), Veil (1). Good spread. |
| Tier spread | PASS -- T1 (5), T2 (3), T3 (1). Appropriate pyramid. |
| Primitive variety | EXCELLENT -- 11 distinct primitives across 9 items. No primitive used more than twice. |
| Blessing/Curse balance | PASS -- 6 blessings, 3 curses. Reasonable for condition subtypes. |
| Tone consistency | PASS -- All flavor text maintains Threadbare register. No exclamatory language. No MMO loot descriptions. |

### Issues Found

1. **CRITICAL: `flesh` reach does not exist.** Used in Healer's Touch and Earthblood Vigor effects + tags. Must be remapped to a valid reach (Stone recommended). Effects changes are systems agent territory; tags and summaries fixed in revised file.
2. **MINOR: Ill Luck stacking trigger mismatch.** `combat_failure` trigger on a Gold-reach curse about commerce. Flagged for systems agent.
3. **MINOR: Tonguebound mechanicalSummary says "social failure" but effects use `social_success`.** Fixed in revised file.

---

## Verdict: PASS WITH REVISIONS

Names and tone are strong throughout. The Threadbare aesthetic is well-maintained. Revisions are limited to:
- Correcting `#flesh` tags to `#stone` (2 items)
- Rewriting mechanicalSummary text where it references the non-existent "Flesh" reach (2 items)
- Fixing Tonguebound mechanicalSummary to match actual trigger (1 item)
- Flagging `flesh` reach in effects[] for systems agent correction (not changed editorially)

Revised file produced.
