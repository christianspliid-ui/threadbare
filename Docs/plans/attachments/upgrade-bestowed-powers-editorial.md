# Attachment Editorial Review: Bestowed Powers Upgrade
> Slug: bestowed-powers | Pass: editorial | Mode: upgrade
> Date: 2026-04-06

## Verdict: PASS WITH REVISIONS

Minor naming/tone/tag fixes applied in revised file. No mechanical changes.

---

## Item-by-Item Review

### 1. Ember Hands (T1)

**Name Quality:** PASS — evocative, specific, implies history without over-explaining.

**Flavor Text:** PASS — "Tinder catches at your touch. You have not felt cold since the gift was given." Threadbare tone. Practical. Shows duration ("since the gift was given") without sentimentality.

**Tags:** FIX — `#stone` is listed as first tag but the niche is fire/survival. Stone reach is correct for the passive mechanically, but the tags should reflect the capability niche. `#craft` and `#wilderness` are accurate. No invalid reaches present.

**Mechanical Summary:** FIX — Draft reads "+0.04 Stone, grants fire_touch trait". The passive bonus is Stone, but the niche (fire manipulation) isn't reflected in the reach label on the summary. Minor: "grants" should be "trait:" for consistency with format used elsewhere in the catalog. Revised: "+0.04 Stone, trait: fire_touch (fire manipulation unlocked)".

**ID Convention:** PASS — `reward_bestowed_ember_hands`.

**Effects Match Summary:** PASS — passive (stone 0.04) + trait_grant(fire_touch) matches mechanicalSummary.

---

### 2. Beast-Tongue (T1)

**Name Quality:** PASS — Hyphenated compound, specific, slightly archaic. Good.

**Flavor Text:** PASS — "Horses calm at your voice. Wolves turn aside. You are kin to things that do not speak." Three-beat rhythm, no sentimentality, shows scope of the gift.

**Tags:** FIX — `#eye` added to tags in draft (replacing `#flesh`). This is correct; the tag set should reflect both Heart and Eye reach. The old `#flesh` tag in the catalog needs removal. Draft is correct.

**Mechanical Summary:** PASS — "+0.04 Heart, +0.02 Eye in wilderness" accurately describes passive + conditional(in_wilderness).

**ID Convention:** PASS — `reward_bestowed_beast_tongue`.

**Effects Match Summary:** PASS — passive (heart 0.04) + conditional(in_wilderness, eye, 0.02) matches mechanicalSummary.

---

### 3. Iron Gut (T1)

**Name Quality:** PASS — "Iron Gut" is clean, specific, earned. Not generic (it's body part + material, not "Ring of Toughness").

**Flavor Text:** PASS — "You eat what would kill others and suffer nothing but a sour taste." Dry, practical, one beat of dark humor. Threadbare.

**Tags:** FIX — Old catalog has `#flesh` tag. Draft correctly replaces with `#iron`. Tag set `['#bestowed', '#iron', '#survival', '#wilderness']` matches the remapped reach.

**Mechanical Summary:** PASS — "+0.05 Iron, immune to poison/disease conditions" accurately describes passive + tag_immunity.

**ID Convention:** PASS — `reward_bestowed_iron_gut`.

**Effects Match Summary:** PASS — passive (iron 0.05) + tag_immunity(['poison', 'disease']) matches mechanicalSummary.

---

### 4. Night Eyes (T1)

**Name Quality:** PASS — Simple, evocative, anatomically specific. Good.

**Flavor Text:** PASS — "The dark is merely dim. Your pupils are wider than they should be." Slight body horror in "wider than they should be" — correct Threadbare register.

**Tags:** PASS — `['#bestowed', '#eye', '#shadow', '#wilderness', '#stealth']` — all valid reaches.

**Mechanical Summary:** PASS — "+0.05 Eye, +0.02 Shadow in exploration" accurately describes the two effects.

**ID Convention:** PASS — `reward_bestowed_night_eyes`.

**Effects Match Summary:** PASS — passive (eye 0.05) + conditional(in_exploration, shadow, 0.02) matches mechanicalSummary.

---

### 5. Gatehouse Commendation (T1)

**Name Quality:** PASS — "Gatehouse Commendation" is evocative of civic hierarchy and bureaucratic legitimacy. Specific.

**Flavor Text:** PASS — "A quiet nod from a captain, a gate waved open half a beat sooner, a ledger mark that says you made the city easier to govern instead of harder." Long but earns its length — shows the texture of the power (subtle, systemic, institutional). Threadbare.

**Tags:** FIX — Tags `['#checkpoint', '#order', '#heart', '#eye']` are missing `#iron` despite iron being one of the passive reaches. The social_modifier also warrants `#social`. Revised tags: `['#bestowed', '#checkpoint', '#order', '#heart', '#eye', '#iron']`. Note `#bestowed` was missing from existing catalog entry — the draft correctly omits it from the visible tags but the item is categorized as bestowed. Adding `#bestowed` for consistency with other items in this subcategory.

**Mechanical Summary:** FIX — "+0.03 Heart, +0.03 Eye, +0.02 Iron, allies in same faction cooperate more easily" — "allies in same faction" is slightly redundant (same_faction is its own filter). Revised: "+0.03 Heart, +0.03 Eye, +0.02 Iron, same-faction cooperation bias +0.1".

**ID Convention:** PASS — `reward_bestowed_gatehouse_commendation`.

**Effects Match Summary:** PASS after summary fix — 3 passives + social_modifier(same_faction, 0.1) match.

---

### 6. Spirit Sight (T2)

**Name Quality:** PASS — Clear, specific, not generic. "Spirit Sight" names the exact capability.

**Flavor Text:** FIX — "The world peels back its skin for those who dare to look." The phrase "for those who dare to look" is slightly grandiose / MMO-epic. The skin image is good. Revised: "The world peels back its skin. You see what it is hiding underneath."

**Tags:** PASS — `['#bestowed', '#eye', '#veil', '#supernatural', '#arcane', '#ruins']` — valid reaches, appropriate niches.

**Mechanical Summary:** FIX — "+0.07 Eye, +0.03 Veil, reveals encounters within 2 hexes when entering new hex" — duration should be noted. Revised: "+0.07 Eye, +0.03 Veil, on hex entry: reveals encounters within 2 hexes (6 ticks)".

**ID Convention:** PASS — `reward_bestowed_spirit_sight`.

**Effects Match Summary:** PASS after summary fix — 2 passives + reactive(entered_hex → reveal encounters r2 dur6) match.

---

### 7. Bloodward (T2)

**Name Quality:** PASS — Compound noun, implies protective blood magic. Specific and original.

**Flavor Text:** PASS — "The blood knows what to do. Cut the skin and watch it knit like thread drawn tight." Two sentences, shows mechanism ("knit like thread"), practical and slightly unsettling. Threadbare.

**Tags:** FIX — Old catalog has `#flesh` tag. Draft correctly replaces with `#heart` (alongside existing `#iron`). Tag set `['#bestowed', '#iron', '#heart', '#combat', '#healing']` is correct.

**Mechanical Summary:** PASS — "+0.05 Iron, +0.03 Heart, when damaged: +0.04 Iron for 8 ticks (12-tick cooldown)" accurately describes the effects.

**ID Convention:** PASS — `reward_bestowed_bloodward`.

**Effects Match Summary:** PASS — 2 passives + reactive(damaged → duration iron 0.04 ticks:8) cooldown:12 matches mechanicalSummary.

---

### 8. Voices of the Departed (T2)

**Name Quality:** PASS — Specific, slightly formal (befitting necromantic communion). Good.

**Flavor Text:** PASS — "The dead speak softly, but they never stop. You learn to listen selectively." The second sentence shows adaptation and wear — "learn to listen selectively" implies ongoing unwanted noise. Threadbare.

**Tags:** PASS — `['#bestowed', '#shadow', '#heart', '#ruins']` — valid reaches, appropriate niches.

**Mechanical Summary:** FIX — "+0.06 Shadow, +0.04 Heart, +1 awareness range" — the awareness range bonus is from range_modifier. Clarify source: "+0.06 Shadow, +0.04 Heart, awareness range +1 hex (dead whisper warnings)".

**ID Convention:** PASS — `reward_bestowed_voices_of_the_departed`.

**Effects Match Summary:** PASS after summary fix — 2 passives + range_modifier(awarenessRangeBonus: 1) match.

---

### 9. Stormcaller (T3)

**Name Quality:** PASS — Single compound word, strong, specific mythic register. Earned for a T3.

**Flavor Text:** PASS — "Thunder follows your anger. Rain follows your grief. The sky has learned your moods." Parallel structure works here. Implies the power is reactive to emotion, not fully controlled — gives it history and limitation. Threadbare.

**Tags:** PASS — `['#bestowed', '#star', '#stone', '#divine', '#wilderness']` — valid reaches. No invalid reaches.

**Mechanical Summary:** FIX — "+0.10 Star, +0.05 Stone, nearby enemies -0.03 Iron (storm aura, 1 hex), 1.3x desire for Iron encounters (storm-seeking)" — verbose. Revised: "+0.10 Star, +0.05 Stone, enemy aura -0.03 Iron (1 hex), 1.3× Iron encounter desire".

**ID Convention:** PASS — `reward_bestowed_stormcaller`.

**Effects Match Summary:** PASS — 2 passives + aura(radius:1, enemies, iron, -0.03) + behavior_weight(iron, 1.3) match after summary revision.

---

### 10. Veilwalk (T3)

**Name Quality:** PASS — Portmanteau, specific, supernatural. Works.

**Flavor Text:** PASS — "The wall is there, and then it is not. You pass through the space where it chose not to be." Giving agency to the wall ("chose not to be") is a nice Threadbare move — implies the veil is cooperative rather than conquered.

**Tags:** PASS — `['#bestowed', '#veil', '#shadow', '#supernatural', '#arcane', '#stealth']` — valid reaches.

**Mechanical Summary:** FIX — "20% faster movement (phase-walking)" — movement cost multiplier of 0.8 is 20% reduced cost, which is correct but "faster" is imprecise. Revised: "+0.10 Veil, +0.05 Shadow, movement cost ×0.8 (phase-walking), unlocks Veil-domain actions".

**ID Convention:** PASS — `reward_bestowed_veilwalk`.

**Effects Match Summary:** PASS — 2 passives + range_modifier(movementCostMultiplier: 0.8) + action_gate(unlock, veil) match after summary revision.

---

### 11. The Undying Flame (T4)

**Name Quality:** PASS — Definite article + compound noun. The "The" gives it weight appropriate for a T4. "Undying Flame" is mythic but specific (fire, not just "power").

**Flavor Text:** PASS — "You burned once and did not die. The fire lives inside now, patient and eternal. It will outlast you." The final sentence ("It will outlast you") is the best line — turns a power into a burden. Threadbare at its best.

**Tags:** FIX — Old catalog has `#flesh` tag. Draft correctly replaces with `#iron`. Tag set `['#bestowed', '#star', '#iron', '#divine', '#ancient']` is correct.

**Mechanical Summary:** FIX — "+0.12 Star, +0.03 Iron, prevents quintessence loss once, when damaged: cascade — +0.05 Star for 6 ticks then rescues near-miss failures (+1 step)" — long and unclear. The prevent_loss doesn't have `consumeOnPrevent: false` reflected in "once" language. The prevent_loss does NOT consume on prevent but has amount:1 (one instance guarded). Clarify: "+0.12 Star, +0.03 Iron, blocks one quintessence loss, on damage: +0.05 Star for 6 ticks then +1 step on failures (24-tick cooldown)".

**ID Convention:** PASS — `reward_bestowed_the_undying_flame`.

**Effects Match Summary:** PASS after summary fix — 2 passives + prevent_loss(quintessence, amount:1) + reactive(damaged → cascade(duration star 0.05 ticks:6, then test_shaper failure +1)) cooldown:24 match.

---

## Batch Variety Check

| Check | Result |
|-------|--------|
| Reach diversity | PASS — iron, gold (Patron's Backing), shadow, veil, heart, eye, stone, star all present |
| Tier spread | PASS — T1×4 (×5 with Patron's), T2×3, T3×2, T4×1 |
| Primitive variety | PASS — 13 distinct non-passive primitives, no two items share the same combo |
| Tone | PASS WITH MINOR FIXES — Spirit Sight flavor adjusted; others are solid Threadbare |
| Generic names | PASS — no generic names |
| Invalid reaches | PASS — flesh reach removed from all items; all tags use valid reaches only |
| mechanicalSummary accuracy | PASS WITH FIXES — 5 summaries revised for precision or duration clarity |
