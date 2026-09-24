# Twenty generated spells

*A throwaway sketch for [THR-1232](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) on [the Powers & Spellcraft map](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft).*

**What this is.** A small program builds spells out of the game's existing effect building blocks, inside hand-written rules for tier, sphere, tradition, price and naming. Every spell below was written by the program from one fixed seed. None were written by hand. The point is to react to them.

**Three things to react to.** These are the questions the ticket asks.
1. **Coherence.** Does each spell read as one thing, with its sphere, effect, price and name pulling the same way? Which ones do not?
2. **Missing rules.** What rule would have stopped the bad ones? The program's own list of gaps is near the end.
3. **The dial.** Fourteen spells were built from small hand-written cores plus random variation. Six were composed freely from raw building blocks. Which reads better?

**How to read a spell.** The line under each name gives, in order:
- the sphere;
- the tradition that teaches the spell;
- the tier;
- whether it is fate-woven or deliberate;
- where it acts.

A fate-woven spell works on its own while carried. A deliberate spell is cast, and would show up as an option you can nudge. The small print under each spell lists the real engine building blocks behind it, each tagged with what it does in the game today.

**One caveat up front.** None of these can run in the game yet. The spell runtime is the next plan on the map. What the small print checks is that every building block is a real part of the engine, or says plainly when it is not.

## At a glance

| # | Name | Sphere | Tradition | Tier | Agency | Arena | Price | Built from |
|---|---|---|---|---|---|---|---|---|
| 1 | Green Chart | Life | Shamanism & Soul Magic | great working | fate-woven | world map: sight | transgression | authored core |
| 2 | Horn Silence | Mind | Demonology & Infernal Pacts | great working | deliberate | encounter | gamble | free |
| 3 | The Nod Survey | Spirit | Dream Magic | great working | fate-woven | world map: sight | gamble | authored core |
| 4 | Burning Grace | Energy | Fire Magic | signature | deliberate | encounter | transgression | free |
| 5 | Clear Manner | Light | Divination & Prophecy | cantrip | fate-woven | encounter | strain | free |
| 6 | Take the Road | Chaos | Weather Magic | signature | deliberate | world map: travel | gamble | authored core |
| 7 | Bright Blow | Energy | Water Magic | working | deliberate | fight | free | authored core |
| 8 | Uncover the Hidden | Mind | Psionics & Mind Control | signature | deliberate | world map: sight | transgression | authored core |
| 9 | Break the Brave | Darkness | Illusion Magic | signature | deliberate | fight | transgression | free |
| 10 | Last Coin | Life | Healing Magic | cantrip | fate-woven | encounter | strain | authored core |
| 11 | Late Tipping | Time | Chronomancy & Time Magic | cantrip | fate-woven | encounter | strain | free |
| 12 | Height Anchor | Time | Ascension & Transcendence Magic | working | fate-woven | fight | strain | authored core |
| 13 | Brace of Loam | Matter | Earth Magic | working | fate-woven | fight | free | authored core |
| 14 | Sudden Road | Force | Air Magic | great working | fate-woven | world map: travel | gamble | authored core |
| 15 | Sour Barb | Entropy | Luck & Probability Magic | great working | fate-woven | fight | gamble | free |
| 16 | Second Sight | Darkness | Necromancy | cantrip | fate-woven | encounter | free | authored core |
| 17 | Horn Lure | Force | Summoning & Conjuration | great working | fate-woven | encounter | strain | authored core |
| 18 | Search the Distance | Light | Divination & Prophecy | signature | deliberate | world map: sight | transgression | authored core |
| 19 | Spark Tally | Energy | Fire Magic | great working | fate-woven | fight | transgression | authored core |
| 20 | Close the Way | Order | Warding & Abjuration | great working | deliberate | world map: mark | strain | authored core |

## The twenty

### 1. Green Chart
*Life · Shamanism & Soul Magic · great working · fate-woven · world map: sight*

**What it does.** The bearer knows the land: whenever they arrive somewhere, every place within several hexes goes onto their map.

**What it costs.** Transgression. Carrying it wears the bearer thin: they lose a little quintessence every day, and it is the kind of magic people notice.

**What goes wrong.** It changes them. Carrying it slowly makes the bearer more Misleading.

<sub>Under the hood: carried: reveal(hexes, range 3) [works today] · price: resource_manipulate(quintessence -0.0015 on self, per_tick) [works today] · price: axiological_drift(sacrifice_survival -0.002/tick → -0.5) [works today] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 3, lives in passiveEffects · built from authored core "sight.survey" · generator flags: notice: no engine home</sub>

### 2. Horn Silence
*Mind · Demonology & Infernal Pacts · great working · deliberate · encounter*

**What it does.** For a couple of days, magic near the caster goes quiet. The ground where the caster stands becomes Shrouded (those inside see less far) for a few days. It can be cast again after a few days.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** Every casting is a risk, even a good one: sometimes, their thoughts scatter, leaving them a good deal worse at Eye for a couple of days.

<sub>Under the hood: cast: suppress(radius 1, 24 ticks) [works today] · cast: alter_terrain(self_hex → shrouded, 48 ticks) [works today] · backlash (any casting, 31%): duration(eye -0.12, 24 ticks) [works only in part] · SpellTemplate tier 3, cooldown 49 ticks · built by free composition from "enc.hush", "raw.overlay" · generator flags: backlash (any casting, 31%): works only in part; mixes arenas (encounter + mark); name drawn from the first effect only</sub>

### 3. The Nod Survey
*Spirit · Dream Magic · great working · fate-woven · world map: sight*

**What it does.** The bearer knows the land: whenever they arrive somewhere, every place within several hexes goes onto their map.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** When the bearer fails disastrously, the spell often leaves them for good.

<sub>Under the hood: carried: reveal(hexes, range 3) [works today] · price: action_trigger(on encounter_critical_failure → self_remove, 50%) [works today] · SpellTemplate tier 3, lives in passiveEffects · built from authored core "sight.survey"</sub>

### 4. Burning Grace
*Energy · Fire Magic · signature · deliberate · encounter*

**What it does.** The caster is left Inspired for a few days. The caster uses Star in place of Iron for a couple of days. It can be cast again after about a week.

**What it costs.** Transgression. Each casting costs the caster a great deal of their quintessence, so they grow more threadbare, and it is the kind of magic people notice.

**What goes wrong.** If the casting fails badly, it usually turns on them: it burns out, and their other spells and charms go quiet for a few days.

<sub>Under the hood: cast: inflict_condition(inspired on self, 36 ticks) [planned: fight block] · cast: modify_rules(encounter_reach_override iron→star, 24 ticks) [works today] · cost: doom_increase(25, lands on quintessence) [works today] · backlash (bad failure, 71%): suppress(self, 36 ticks) [works today] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 4, cooldown 98 ticks · built by free composition from "enc.steel", "fight.reach_swap" · generator flags: cast: planned: fight block; notice: no engine home; name drawn from the first effect only</sub>

### 5. Clear Manner
*Light · Divination & Prophecy · cantrip · fate-woven · encounter*

**What it does.** Others are a little readier to cooperate with the bearer.

**What it costs.** Strain. It weighs on the bearer: while they carry it, they are slightly worse at Shadow.

**What goes wrong.** When the bearer fails disastrously, the spell sometimes turns on them: they are left Shaken (weaker at Star and Heart) for a day.

<sub>Under the hood: carried: social_modifier(any +0.1) [works today] · price: passive(shadow -0.02) [works today] · price: action_trigger(on encounter_critical_failure → grant shaken, 25%) [works today] · SpellTemplate tier 1, lives in passiveEffects · built by free composition from "enc.easy_company"</sub>

### 6. Take the Road
*Chaos · Weather Magic · signature · deliberate · world map: travel*

**What it does.** Cast before a journey. For a few days, the caster travels at double pace. It can be cast again after about a week.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** Every casting is a risk, even a good one: sometimes, the magic stays wild in them, and for about a week any other miscast they suffer lands one grade worse.

<sub>Under the hood: cast: modify_rules(movement_cost_multiplier ×0.5, 36 ticks) [works today] · backlash (any casting, 36%): modify_rules(backlash_severity_multiplier ×2, 72 ticks) [works only in part] · SpellTemplate tier 4, cooldown 84 ticks · built from authored core "travel.burst" · generator flags: backlash (any casting, 36%): works only in part</sub>

### 7. Bright Blow
*Energy · Water Magic · working · deliberate · fight*

**What it does.** Cast in a fight, it strikes the opponent with a crushing wave: one more segment of their clock fills, as a landed blow would. Afterwards, the caster is slightly better at Iron for half a day. It can be cast again after a couple of days.

**What it costs.** Free. Casting it costs the caster nothing.

**What goes wrong.** Little. If the casting fails, it simply fails.

<sub>Under the hood: cast: resource_manipulate(fight_clock +1 on other_agent, one_shot) [planned: fight block] · rider: duration(iron +0.03, 6 ticks) [works today] · SpellTemplate tier 2, cooldown 21 ticks · built from authored core "fight.clock_blow" + rider "afterglow" · generator flags: cast: planned: fight block</sub>

### 8. Uncover the Hidden
*Mind · Psionics & Mind Control · signature · deliberate · world map: sight*

**What it does.** Cast to see what is hidden. For a few days, nothing within several hexes of the caster stays hidden from them: fog, shrouds and their own dull wits make no difference. It can be cast again after a week or two.

**What it costs.** Transgression. Each casting costs the caster a great deal of their quintessence, so they grow more threadbare, and it is the kind of magic people notice.

**What goes wrong.** If the casting fails badly, it usually turns on them: their own judgement slips, and the caster is left Shaken (weaker at Star and Heart) for a few days.

<sub>Under the hood: cast: reveal(encounters, range 3) [works today] · cost: doom_increase(25, lands on quintessence) [works today] · backlash (bad failure, 71%): inflict_condition(shaken on self, 48 ticks) [planned: fight block] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 4, cooldown 142 ticks · built from authored core "sight.uncover" · generator flags: backlash (bad failure, 71%): planned: fight block; notice: no engine home</sub>

### 9. Break the Brave
*Darkness · Illusion Magic · signature · deliberate · fight*

**What it does.** The opponent is left Terrified for a few days. The caster uses Shadow in place of Iron for a couple of days. It can be cast again after about a week.

**What it costs.** Transgression. Each casting costs the caster a great deal of their quintessence, so they grow more threadbare, and it is the kind of magic people notice.

**What goes wrong.** If the casting fails badly, it often turns on them: something looks back, and the caster is left Terrified (weaker at Iron, and keen to get away) for a few days.

<sub>Under the hood: cast: inflict_condition(terrified on counterpart, 48 ticks) [planned: fight block] · cast: modify_rules(encounter_reach_override iron→shadow, 24 ticks) [works today] · cost: doom_increase(25, lands on quintessence) [works today] · backlash (bad failure, 66%): inflict_condition(terrified on self, 48 ticks) [planned: fight block] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 4, cooldown 107 ticks · built by free composition from "fight.inflict_fear", "fight.reach_swap" · generator flags: cast: planned: fight block; backlash (bad failure, 66%): planned: fight block; notice: no engine home; name drawn from the first effect only</sub>

### 10. Last Coin
*Life · Healing Magic · cantrip · fate-woven · encounter*

**What it does.** The next time the bearer would be worn thin, the spell takes a small part of the loss instead, and is used up doing it.

**What it costs.** Strain. It weighs on the bearer: while they carry it, they are slightly worse at Shadow.

**What goes wrong.** When the bearer fails disastrously, the spell sometimes turns on them: they are left Exhausted (weaker at Iron, Eye and Stone) for a day.

<sub>Under the hood: carried: prevent_loss(quintessence, 0.03, spent on use) [works today] · price: passive(shadow -0.03) [works today] · price: action_trigger(on encounter_critical_failure → grant exhausted, 25%) [works today] · SpellTemplate tier 1, lives in passiveEffects · built from authored core "enc.soul_ward"</sub>

### 11. Late Tipping
*Time · Chronomancy & Time Magic · cantrip · fate-woven · encounter*

**What it does.** When the bearer narrowly fails at Stone, the result is lifted a step.

**What it costs.** Strain. It weighs on the bearer: while they carry it, they are slightly worse at Star.

**What goes wrong.** When the bearer fails disastrously, the spell sometimes turns on them: they are left Exhausted (weaker at Iron, Eye and Stone) for a day.

<sub>Under the hood: carried: test_shaper(near_miss +1 on stone) [works today] · price: passive(star -0.04) [works today] · price: action_trigger(on encounter_critical_failure → grant exhausted, 25%) [works today] · SpellTemplate tier 1, lives in passiveEffects · built by free composition from "enc.second_chance"</sub>

### 12. Height Anchor
*Time · Ascension & Transcendence Magic · working · fate-woven · fight*

**What it does.** When a fight turns against the bearer, the spell catches them: an exchange they would lose by a little counts as a near miss instead. They take no wound, and their blow still lands.

**What it costs.** Strain. It weighs on the bearer: while they carry it, they are a little worse at Heart.

**What goes wrong.** When the bearer fails disastrously, the spell sometimes turns on them: they are left Exhausted (weaker at Iron, Eye and Stone) for a day.

<sub>Under the hood: carried: test_shaper(failure +1, in_combat, margin ≤0.1) [works today] · price: passive(heart -0.05) [works today] · price: action_trigger(on encounter_critical_failure → grant exhausted, 25%) [works today] · SpellTemplate tier 2, lives in passiveEffects · built from authored core "fight.last_stand"</sub>

### 13. Brace of Loam
*Matter · Earth Magic · working · fate-woven · fight*

**What it does.** When a fight turns against the bearer, the spell catches them: an exchange they would lose by a little counts as a near miss instead. They take no wound, and their blow still lands.

**What it costs.** Free. Carrying it costs nothing beyond a place among the spells the bearer keeps ready.

**What goes wrong.** Rarely, when the bearer fails disastrously, the spell slips away from them for good.

<sub>Under the hood: carried: test_shaper(failure +1, in_combat, margin ≤0.1) [works today] · price: action_trigger(on encounter_critical_failure → self_remove, 15%) [works today] · SpellTemplate tier 2, lives in passiveEffects · built from authored core "fight.last_stand"</sub>

### 14. Sudden Road
*Force · Air Magic · great working · fate-woven · world map: travel*

**What it does.** The road is shorter for the bearer: they travel much faster than others, whatever the ground. It also gives the bearer itchy feet: they take to the road more often.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** Whenever the bearer fails, the spell sometimes turns on them: they are left Wounded (weaker at Iron and Stone) for a few days.

<sub>Under the hood: carried: range_modifier(movement ×0.65) [works today] · rider: behavior_weight(star ×1.2) [works today] · price: action_trigger(on encounter_failure → grant wounded, 40%) [works today] · SpellTemplate tier 3, lives in passiveEffects · built from authored core "travel.swift" + rider "calling_star"</sub>

### 15. Sour Barb
*Entropy · Luck & Probability Magic · great working · fate-woven · fight*

**What it does.** When blows are traded, the opponent is left Cursed for a couple of days. Enemies near the bearer do a little worse at Gold. Each time the bearer overcomes an opponent, they grow slightly better at Iron, up to a point.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** Whenever the bearer fails, the spell sometimes turns on them: they are left Cursed (unlucky at Star and Gold) for a few days.

<sub>Under the hood: carried: reactive(on attacked → inflict_condition(cursed on counterpart, 24 ticks), cooldown 12) [planned: fight block] · carried: aura(enemies, radius 1, gold -0.07) [works today] · carried: stacking(iron +0.04 per on_kill, max 3) [planned: fight block] · price: action_trigger(on encounter_failure → grant cursed, 40%) [works today] · SpellTemplate tier 3, lives in passiveEffects · built by free composition from "fight.trade_answer", "enc.dread", "fight.trophy" · generator flags: carried: planned: fight block; carried: planned: fight block; mixes arenas (fight + encounter); effects point at 2 different Reaches (Gold, Iron); name drawn from the first effect only</sub>

### 16. Second Sight
*Darkness · Necromancy · cantrip · fate-woven · encounter*

**What it does.** When the bearer is dealing with magic or fate, they are a little better at Veil.

**What it costs.** Free. Carrying it costs nothing beyond a place among the spells the bearer keeps ready.

**What goes wrong.** Nothing that matters. It is the kind of magic a village keeps.

<sub>Under the hood: carried: conditional(in_mystical: veil +0.05) [works today] · SpellTemplate tier 1, lives in passiveEffects · built from authored core "enc.favoured" · generator flags: a free price sits badly with Necromancy</sub>

### 17. Horn Lure
*Force · Summoning & Conjuration · great working · fate-woven · encounter*

**What it does.** The bearer is drawn to the open road: they seek out Star encounters much more often than they otherwise would. They are also a little better at Star when out in the wilds.

**What it costs.** Strain. It weighs on the bearer: while they carry it, they are a little worse at Stone.

**What goes wrong.** When the bearer fails disastrously, the spell sometimes turns on them: they are left Wounded (weaker at Iron and Stone) for a day.

<sub>Under the hood: carried: behavior_weight(star ×1.5) [works today] · rider: conditional(in_wilderness: star +0.07) [works today] · price: passive(stone -0.07) [works today] · price: action_trigger(on encounter_critical_failure → grant wounded, 25%) [works today] · SpellTemplate tier 3, lives in passiveEffects · built from authored core "enc.calling" + rider "favoured"</sub>

### 18. Search the Distance
*Light · Divination & Prophecy · signature · deliberate · world map: sight*

**What it does.** Cast to look far. For a few days, the caster notices what is happening several hexes further off than usual. It can be cast again after about a week.

**What it costs.** Transgression. Each casting costs the caster a great deal of their quintessence, so they grow more threadbare, and it is the kind of magic people notice.

**What goes wrong.** If the casting fails badly, it usually turns on them: the light shows the caster too, leaving them a good deal worse at Shadow for a few days.

<sub>Under the hood: cast: modify_rules(awareness_range_bonus 3, 36 ticks) [works today] · cost: doom_increase(25, lands on quintessence) [works today] · backlash (bad failure, 74%): duration(shadow -0.13, 48 ticks) [works today] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 4, cooldown 93 ticks · built from authored core "sight.scry" · generator flags: notice: no engine home</sub>

### 19. Spark Tally
*Energy · Fire Magic · great working · fate-woven · fight*

**What it does.** It keeps count. Each opponent the bearer overcomes makes them slightly better at Iron, up to three times over, and the count never fades.

**What it costs.** Transgression. Carrying it wears the bearer thin: they lose a little quintessence every day, and it is the kind of magic people notice.

**What goes wrong.** It changes them. Carrying it slowly makes the bearer more Power-Hungry.

<sub>Under the hood: carried: stacking(iron +0.04 per on_kill, max 3) [planned: fight block] · price: resource_manipulate(quintessence -0.0015 on self, per_tick) [works today] · price: axiological_drift(mercy_ruthlessness -0.002/tick → -0.5) [works today] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 3, lives in passiveEffects · built from authored core "fight.trophy" · generator flags: carried: planned: fight block; notice: no engine home</sub>

### 20. Close the Way
*Order · Warding & Abjuration · great working · deliberate · world map: mark*

**What it does.** The caster salts the ground where they stand. For a few days, anyone crossing that hex does so at little more than half pace. It can be cast again after about a week.

**What it costs.** Strain. Casting it leaves the caster Exhausted (weaker at Iron, Eye and Stone) until it wears off.

**What goes wrong.** If the casting fails, it sometimes rebounds: it takes everything they have, and the caster is left Exhausted (weaker at Iron, Eye and Stone) for a few days.

<sub>Under the hood: cast: alter_terrain(self_hex → warded, 48 ticks) [works today] · cost: condition_inflict(exhausted) [works today] · backlash (failure, 28%): inflict_condition(exhausted on self, 36 ticks) [planned: fight block] · SpellTemplate tier 3, cooldown 72 ticks · built from authored core "mark.ward" · generator flags: backlash (failure, 28%): planned: fight block</sub>

## How these were made

**Tiers.** There are four: cantrip, working, great working, signature. Tier sets:
- how big a bonus is (a cantrip moves a roll slightly; a signature moves it a great deal, never past the engine's per-item cap);
- how long its effects last, and how long a cast takes to come back;
- how many effects it may carry (one for a cantrip, up to three at the top);
- its agency. A cantrip is always fate-woven and a signature is always deliberate. A working is deliberate about a third of the time, a great working half the time.

This follows ruling 1 on [THR-1230](https://linear.app/threadbare/issue/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape): most magic is woven into what the bearer does, and a marked few spells are real decisions.

**Price layers.** There are four: free, strain, gamble and transgression. Tier pushes a spell rightward: a cantrip is mostly free, a signature mostly a transgression. On top of that, the tradition leans the price its own way, because ruling 3 says a spell's price is what kind of magic it is:
- Holy, Healing and Warding lean toward free and strain.
- Luck and Chaos lean toward gamble.
- Necromancy, Demonology, Blood, Corruption and Poison lean hard toward transgression.

The price table also has to split by agency. A fate-woven spell is never cast, so it can never pay a cast cost.

A deliberate spell pays when it is cast:
- *free* — nothing;
- *strain* — the caster is spent for a while, is left Exhausted, or is drained in a Reach;
- *gamble* — every casting risks a miscast;
- *transgression* — quintessence, plus notice.

A fate-woven spell pays with what it carries:
- *free* — nothing;
- *strain* — a standing weakness in a paired Reach, Exhaustion after successes, or (Holy and Healing only) a vow that forbids a whole Reach;
- *gamble* — a chance to turn on the bearer, or to leave them, when they fail;
- *transgression* — quintessence lost day by day, or the world's doom sped up, plus notice. For dark traditions, the bearer also drifts slowly toward the vice pole of the spell's Reach.

**Arena.** A spell acts in one of five places: an encounter, a fight, or one of the three world-map classes from ruling 2 (travel, sight, mark). Fights use the fight block's vocabulary ([the fight block plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-23-fight-block.md), §9 and §10). A fight spell can:
- fill segments of the opponent's clock;
- put a condition on the opponent;
- answer when blows are traded;
- count the opponents it overcomes;
- rescue a narrowly lost exchange;
- change which Reach the caster fights with.

**Coverage is enforced, not left to chance.** A run first plans its slate:
- it reserves four fight slots, one for each part of the fight vocabulary (the clock, a condition on the opponent, an answer to a traded blow, a count of the fallen), and one slot for each world-map class; the other slots are drawn, about six in ten of them encounters;
- it makes sure every sphere is used at least once and every price layer at least twice;
- it keeps fate-woven spells at six in ten or more;
- it builds three in ten spells by free composition.

Everything inside a slot is a seeded draw.

**Agency.** Fate-woven spells go in `passiveEffects` and act without a decision: they bend rolls, pull the bearer toward kinds of encounter, and answer events. Deliberate spells go in `effects` and act when cast, so each one also says when it can be cast again. The wording follows the split: "the bearer" carries a spell, "the caster" casts one.

**Sphere and tradition shelves.** Every spell draws a sphere. The sphere decides which authored cores fit, which Reaches the spell leans on, which situations favour it, what its miscasts look like and what its name sounds like. Then the spell draws a tradition from that sphere's shelf, weighted by the tradition's real sphere weights in [the world model](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/world-model.json) (34 magic traditions). Only a tradition that teaches that kind of spell may be drawn. If no tradition on the shelf does, the draw falls back to the whole shelf and the spell is flagged.

The world model says nothing about what a tradition teaches, so the prototype gives each one a few themes (war, ward, heal, curse, sight, travel and so on). **The four Foundation spheres have no shelf at all.** None of the 34 traditions weights Order, Chaos, Light or Darkness, so the generator borrows a hand-made patch:
- Light from Holy, Divination, Restoration and Ascension;
- Darkness from Illusion, Necromancy, Dreamcraft and Shamanism;
- Order from Warding, Rune, Binding and Enchantment;
- Chaos from Chaos, Luck, Demonology and Weather.

The themes and the patch are both this prototype's inventions, not canon.

**Name grammar.** Names are two or three plain words, drawn from three banks:
- the core's function words (Ward, Guard, Call, Stride);
- the tradition's words (Salt, Barrow, Ember, Coin);
- the sphere's adjectives (Wild, Still, Pale, Grey).

The noun forms are "Salt Ward", "Grey Ward", "Ward of Salt" and "The Salt Ward". A two-word function noun ("Long Odds") stands alone. A deliberate spell may instead take the card form, an imperative verb and an object ("Bar the Road"), because [Prose Doctrine v2](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/prose.md) says cards read like spells. Reach and sphere names are kept out of names, so "Stone Guard" can never be mistaken for a Stone spell.

**Cost and backlash pairing.** Each sphere owns a short list of miscasts, for example:
- Force numbs the arm;
- Time makes spells slow to return;
- Energy burns out the caster's other charms;
- Darkness blinds;
- Chaos leaves the next miscast one grade worse;
- Entropy curses the caster.

The price layer decides when a miscast can fire: on a failure (strain), on any casting (gamble), or on a bad failure (transgression). Fate-woven spells use the same idea through a condition the sphere hands back: Terrified for Darkness, Cursed for Entropy and Chaos, Exhausted for Order, Matter, Energy, Life and Time.

**Authored cores.** Under the sphere tables sit 37 small hand-written kernels. Each one is one or two primitives from [the effect vocabulary](https://github.com/christianspliid-ui/threadbare/blob/main/src/types/effects.ts) plus one plain sentence. For example, "a narrowly lost exchange counts as a near miss" is `test_shaper` with `in_combat`. Seeded variation fills in the rest:
- magnitude and duration;
- the tradition's wording;
- an optional rider that reinforces the same Reach;
- the price and the backlash;
- the name.

**Coverage in this run.**
- Spheres: Life 2, Mind 2, Spirit 1, Energy 3, Light 2, Chaos 1, Darkness 2, Time 2, Matter 1, Force 2, Entropy 1, Order 1.
- Price layers: transgression 6, gamble 5, strain 6, free 3.
- Arenas: world map: sight 4, encounter 7, world map: travel 2, fight 6, world map: mark 1.
- Agency: fate-woven 12, deliberate 8.
- Traditions: 18 different ones.

**Badges in the small print.** Every building block carries a tag for what it does in the engine today. Counts in this run: works today 47; no engine home 6; works only in part 2; planned: fight block 9.
- *Works today* means the primitive runs on the live path.
- *Planned: fight block* means the queued fight slices [FB5](https://linear.app/threadbare/issue/THR-1541/fight-block-fb5-fight-events) and [FB6](https://linear.app/threadbare/issue/THR-1542/fight-block-fb6-effect-vocabulary-for-fights) add it. Fights themselves arrive with that block.
- The other tags are the gaps listed below.

## Where the dial sits

This run turned the dial two ways on purpose, so the two can be compared side by side.

- **Authored cores plus variation (14 of 20).** A person wrote the intent: which one or two primitives go together, and the one sentence that says what the spell is. The generator chose everything else:
  - the sphere, the tradition and the tier;
  - whether the spell is woven or cast;
  - the size, duration and chance of every number;
  - an optional rider;
  - the price, the backlash and the name.
- **Free composition (6 of 20).** Nothing is authored above the primitive. The generator drew one to three primitives the sphere allows, with the first one fitting the arena, and described each with a generic clause. It could also reach for legal values the authored layer avoids: overlays nothing reads, tags no condition carries, and a trait nothing checks.

The generator's own checks raised a coherence flag on 4 of the 6 freely composed spells and on 1 of the 14 core-built ones. A coherence flag means one of these:
- the spell mixes arenas or points at several Reaches;
- a part of it does nothing;
- the name covers only one effect;
- the tradition does not teach it;
- the price does not suit it.

**Always authored, in both modes:**
- the tier, price and arena envelopes;
- the sphere and tradition tables and word banks;
- the tradition themes and price leans;
- the Foundation-sphere shelf patch;
- the miscast lists and condition glosses;
- the liveness table.

**Always composed:** every draw inside those tables.

## Engine gaps the generator ran into

These are envelope constraints that are missing, or substrate that is not there yet. Each one came up while building the tables.

1. **Nothing here can run yet.** The one live cast path (the `use × Power` undertaking cell) pays the price but drops the spell's effects and its backlash. A wielded spell's shared definition node deliberately carries no effects. So both halves of the spell runtime are still to build: carried effects for fate-woven spells, and applied effects for deliberate ones. That is the next plan on [the Powers & Spellcraft map](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft).
2. **Strain as a Reach drain cannot be paid.** `reach_drain` and every `minReach` prerequisite in [`activateSpell`](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/spellActivation.ts) read `properties.domainCapability`, which nothing in the game writes. (Capability actually lives in `domainCapabilities` plus the trait walk.) So the cost "it draws on the caster's own Veil" is refused today. So is every one of the [five shipped spell templates](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/spell-templates.ts), because all five carry `minReach`. The generator uses exhaustion and the Exhausted condition as the working forms of strain. *Now tracked with the capability-scale bug, [THR-1562](https://linear.app/threadbare/issue/THR-1562/ambition-reach-floors-and-reach-milestones-compare-raw-capability-10).*
3. **"Notice" has no engine home.** Ruling 3 on [THR-1230](https://linear.app/threadbare/issue/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape) prices transgression as doom plus notice. Doom has a home: the soul price lands on quintessence. But no cost type says "the world noticed". The nearest honest substrate is a hidden mark that a later encounter can reveal, the pattern the artifact curse uses ([THR-661](https://linear.app/threadbare/issue/THR-661)). Every transgression here shows *notice* with a *no engine home* tag.
4. **A gamble cannot fire on a successful cast.** [`activateSpell`](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/spellActivation.ts) checks backlash only inside its failure branch, so a backlash meant for "any casting" never fires when the cast succeeds. And failure is a fixed coin (fifteen in a hundred), not a roll against the caster's skill.
5. **Foundation spheres have no traditions.** See *Sphere and tradition shelves* above. [The world model](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/world-model.json) also lists a fifth Foundation sphere, Shadow, which canon's twelve spheres do not have.
6. **Most terrain overlays are stored but never read.** Only two of the eleven overlays in [the overlay table](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/terrain-overlays.ts) change anything: Warded (slows crossing) and Shrouded (dulls the sight of those inside). Sacred Ground, Blighted, Hallowed, Cursed Ground and the rest are kept on the map and expire, but no rule looks at them. The authored cores stay on the two live ones; the free composer does not know better.
7. **A dispel would cure the whole world.** Conditions are now one shared definition per kind, and `dispel` deletes that shared node. Deleting a node removes every edge to it. So the first time a generated "lift a curse" spell runs, everyone with that condition loses it, and the condition stops existing. No shipped content reaches `dispel` today, so the bug is latent. It must be fixed before a generator may emit dispels.
8. **Real teleportation does nothing.** `teleport`, `forced_move`, `transfer` and `compel` still execute nothing. So travel spells here are "the road is shorter" and "you run fast", not gates, and the generator refuses those four primitives.
9. **A shroud blinds, it does not hide.** The Shrouded overlay lowers the sight of whoever stands in it, the caster included. That is the opposite of what a Darkness "hide me" spell wants, and nothing yet makes a bearer harder to find.
10. **World-doom prices compound.** `doom_rate_multiplier` is multiplied across every agent that carries it, so twenty carriers of a small transgression speed the doom clock many times over. It is the most legible "the world objects" price there is, and it needs a population cap before it ships.
11. **A ward currently eats the caster's own price.** A quintessence ward (`prevent_loss`) softens the summed loss for the tick, so it also cancels the soul price of the bearer's own transgressions. [THR-1530](https://linear.app/threadbare/issue/THR-1530/spells-and-powers-in-a-fight-one-effect-vocabulary) found this, and fight slice FB3 splits the spell price from harm so wards cover harm only.

## Appendix: five spells from a second seed (seed 1231)

Same generator, same tables, different seed. These are the first five spells of a second twenty-spell run.

| # | Name | Sphere | Tradition | Tier | Agency | Arena | Price | Built from |
|---|---|---|---|---|---|---|---|---|
| 1 | The Wayfinding | Spirit | Ascension & Transcendence Magic | working | fate-woven | world map: sight | strain | authored core |
| 2 | Kindling Run | Energy | Lightning Magic | signature | deliberate | world map: travel | transgression | free |
| 3 | Wild Trophy | Chaos | Weather Magic | working | fate-woven | fight | gamble | free |
| 4 | Beacon Fire | Mind | Dream Magic | working | fate-woven | world map: mark | gamble | authored core |
| 5 | Warm Standard | Life | Restoration & Redemption | working | fate-woven | encounter | free | authored core |

### 1. The Wayfinding
*Spirit · Ascension & Transcendence Magic · working · fate-woven · world map: sight*

**What it does.** The bearer knows the land: whenever they arrive somewhere, every place within a couple of hexes goes onto their map.

**What it costs.** Strain. It weighs on the bearer: while they carry it, they are slightly worse at Stone.

**What goes wrong.** When the bearer fails disastrously, the spell sometimes turns on them: they are left Grieving (weaker at Heart and Eye) for a day.

<sub>Under the hood: carried: reveal(hexes, range 2) [works today] · price: passive(stone -0.04) [works today] · price: action_trigger(on encounter_critical_failure → grant grieving, 25%) [works today] · SpellTemplate tier 2, lives in passiveEffects · built from authored core "sight.survey"</sub>

### 2. Kindling Run
*Energy · Lightning Magic · signature · deliberate · world map: travel*

**What it does.** The caster travels at double pace for a few days. The ground where the caster stands becomes Volcanic (stronger at Iron) for about a week. The opponent is left Wounded for about a week. It can be cast again after a week or two.

**What it costs.** Transgression. Each casting costs the caster a great deal of their quintessence, so they grow more threadbare, and it is the kind of magic people notice.

**What goes wrong.** If the casting fails badly, it often turns on them: it takes everything they have, and the caster is left Exhausted (weaker at Iron, Eye and Stone) for a few days.

<sub>Under the hood: cast: modify_rules(movement_cost_multiplier ×0.5, 36 ticks) [works today] · cast: alter_terrain(self_hex → volcanic, 72 ticks) [stored, but nothing reads it] · cast: inflict_condition(wounded on counterpart, 72 ticks) [planned: fight block] · cost: doom_increase(25, lands on quintessence) [works today] · backlash (bad failure, 61%): inflict_condition(exhausted on self, 48 ticks) [planned: fight block] · notice: (no cost type exists) [no engine home] · SpellTemplate tier 4, cooldown 136 ticks · built by free composition from "travel.burst", "raw.overlay", "fight.inflict_curse" · generator flags: cast: stored, but nothing reads it; cast: planned: fight block; backlash (bad failure, 61%): planned: fight block; notice: no engine home; mixes arenas (travel + mark + fight); name drawn from the first effect only</sub>

### 3. Wild Trophy
*Chaos · Weather Magic · working · fate-woven · fight*

**What it does.** Each time the bearer overcomes an opponent, they grow slightly better at Iron, up to a point.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** Whenever the bearer fails, the spell sometimes turns on them: they are left Cursed (unlucky at Star and Gold) for a few days.

<sub>Under the hood: carried: stacking(iron +0.03 per on_kill, max 3) [planned: fight block] · price: action_trigger(on encounter_failure → grant cursed, 30%) [works today] · SpellTemplate tier 2, lives in passiveEffects · built by free composition from "fight.trophy" · generator flags: carried: planned: fight block</sub>

### 4. Beacon Fire
*Mind · Dream Magic · working · fate-woven · world map: mark*

**What it does.** Wherever the bearer stays, the place starts to draw the curious: the hex pulls more wanderers and seekers the longer they remain.

**What it costs.** A gamble. It asks nothing up front.

**What goes wrong.** When the bearer fails disastrously, the spell often leaves them for good.

<sub>Under the hood: carried: hex_effect(explorationAttraction +0.004/tick, radius 0) [works today] · price: action_trigger(on encounter_critical_failure → self_remove, 50%) [works today] · SpellTemplate tier 2, lives in passiveEffects · built from authored core "mark.drift"</sub>

### 5. Warm Standard
*Life · Restoration & Redemption · working · fate-woven · encounter*

**What it does.** Allies near the bearer do slightly better at Star. It reaches anyone of the bearer's faction within a hex.

**What it costs.** Free. Carrying it costs nothing beyond a place among the spells the bearer keeps ready.

**What goes wrong.** Rarely, when the bearer fails disastrously, the spell slips away from them for good.

<sub>Under the hood: carried: aura(allies, radius 1, star +0.04) [works today] · price: action_trigger(on encounter_critical_failure → self_remove, 15%) [works today] · SpellTemplate tier 2, lives in passiveEffects · built from authored core "enc.rally"</sub>

## Self-critique: where composition broke

### The five weakest spells, and why

1. **Sour Barb (#15): three ideas bolted together.** It carries three unrelated effects:
   - it curses anyone who trades blows with the bearer;
   - it makes nearby enemies worse at Gold, which does nothing in a fight;
   - it counts the opponents the bearer overcomes.

   There is no single idea, and the name covers only the first. Luck magic does not obviously teach any of it, and two of its three parts wait on the fight block. This is how free composition fails once it goes past two building blocks. The appendix spell *Kindling Run* is the same failure, worse: a sprint, a patch of Volcanic ground that nothing reads, and a wound on an opponent.
2. **Green Chart (#1): a price that does not characterize.** The effect is good: wherever the bearer arrives, the land around them goes onto their map. The price is nonsense. Shamanism's death theme pushed the spell to transgression. The "it changes them" drift is then taken from the spell's own Reach (Star). So a mapping spell makes its bearer steadily more *Misleading* and thins their quintessence. The drift should come from the tradition's own vice, not from the effect's Reach.
3. **Second Sight (#16): a generic core, and a tier that overrides character.** It is a Necromancy cantrip that makes the bearer "a little better at Veil when dealing with magic or fate". It is free, "the kind of magic a village keeps". Two things went wrong:
   - The situational-bonus core has no intent of its own. The whole spell comes from table draws, so it could belong to any tradition.
   - The cantrip tier allows only free or strain. That overrides Necromancy's lean toward transgression, so death-magic arrives priced like a hedge-witch's charm.

   The generator flags it.
4. **Late Tipping (#11): sound mechanics, engine-speak prose.** It works: a near miss at Stone becomes a success at a price. But it was freely composed, so it says "the result is lifted a step". Stone is an arbitrary draw for Chronomancy, and the name is noun salad. Prose is free composition's weakest layer: without an authored sentence, even a sound spell reads like a rules table.
5. **Search the Distance (#18): the tier forces a soul price on a gentle spell.** A Light divination spell that lets the caster see a long way costs "a great deal of their quintessence" and is "the kind of magic people notice". The signature tier allows only gamble or transgression, so a gentle tradition's best spell has to eat its caster. Uncover the Hidden (#8) has the same shape. And half of the price, the notice, has no engine home.

**One more pattern that is not a single spell.** Height Anchor (#12) and Brace of Loam (#13) share the same sentence word for word: two traditions, one core. Variation never reaches the prose. Either each core needs a tradition-flavoured phrase slot, or the library needs at least two cores for every combination of arena, agency and tier.

### What the run says about the three questions

**Coherence bar.** A proposed bar: a spell passes when a player could guess its sphere and tradition from its name and effect, and its price from its tradition.
- **Core-built spells:** about ten of the fourteen pass. The failures are prices (#1, #16, #18) and loose tradition fits (#12 Ascension, #17 Summoning).
- **Free spells:** two or three of the six pass. Break the Brave (#9, terror plus fighting from the dark) and Horn Silence (#2, a hush plus a blinding fog) cohere by luck. Even these read like rule lists.

**Missing envelope constraints.** The rulings name five axes: agency, arena, price, tier and sphere/tradition. Building the tables needed these additions:
1. **What a tradition teaches.** The world model gives each tradition sphere weights and nothing else. The first draft drew traditions by sphere alone. It produced a Warding mage whose signature spell was a sprint, and a Poison mage under a healer's vow never to use Iron. Giving each tradition a few themes fixed this, and the fit had to be a hard rule: at a soft 8% weight, a misfit still got through in twenty spells.
2. **Price leans by tradition, with tier windows that do not override them.** Pricing by tier alone produced a holy blessing on the land priced as a transgression. The lean fixed most cases. The tier windows still force #16 and #18.
3. **A price table split by agency.** A fate-woven spell is never cast, so it can never pay a cast cost. Its price has to be something it carries: a standing weakness, a vow, a toll after success, or a slow thinning.
4. **Shelves for the four Foundation spheres.** No tradition has one.
5. **Word banks per tradition, not only per sphere.** An earlier run named an Ice spell "Burning Hunger". In this run, Bright Blow (#7) is a crushing wave of water.
6. **A home for notice.** See gap 3.
7. **"It changes them" keyed to the tradition's vice, not the effect's Reach.** See Green Chart.
8. **A flavour slot per core**, so the variation reaches the sentence.

**Where the dial should sit.** My recommendation is authored cores plus variation, with free composition limited to one rider slot at most.
- One building block deep, free composition holds up.
- Two deep, it mostly holds when both blocks come from the same arena.
- Three deep, it breaks (Sour Barb, Kindling Run).
- Its prose always reads like a rules table.

The cores are cheap: about ten lines each, thirty-seven in this sketch. The bigger lesson is where the coherence came from. Most of it came from tables no ruling names: tradition themes, price leans and the agency split. Those belong in the plan doc as envelopes in their own right.

### What changed during the build

The first draft followed the rulings literally: shelves by sphere, and price by tier. It produced these:
- a Warding mage whose signature spell made them sprint;
- a Poison mage travelling fast under a healer's vow never to use Iron;
- a holy blessing of the land priced as a transgression;
- a Light spell that handed out a Shadow bonus.

Each fix became an envelope rule listed above. That is the strongest evidence that tradition has to be a real envelope, not a flavour label.

### What I did not do

- There is no pure-random baseline, drawing straight from the whole effect union. It would include primitives that do nothing yet (teleport, compel), and its garbage would prove nothing.
- Balance at population scale is not tested. The numbers sit inside the engine's caps, but nothing here runs a thousand agents.
- The names are the roughest layer: roughly half read well ("Close the Way", "Last Coin", "Take the Road", "Break the Brave") and the rest are serviceable or noun salad ("Horn Lure", "The Nod Survey").

<sub>Generated by `generator.mjs`, seed 42 (main run) and 1231 (appendix), against main @ 9cc62c05 (2026-09-24). Throwaway prototype for THR-1232. The generator and its raw output are not in the repo; they are kept in the design vault's iteration record, `Brainstorms/2026-09-24-proto-spells/`.</sub>
