# Thirty generated items — for reaction

Prototype for [THR-1236](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to) on the [Item Generator map](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator). Every item below was rolled by a seeded generator from random tables, world concepts, fantasy tropes and the game's own effect vocabulary. **Nothing was hand-edited.** Seed 42; a second seed and a no-trope run are in the appendices.

Every effect is a real, working game effect: nothing here uses an effect the engine cannot run today, and the real engine read back all 38 items (38 clean, 538 individual checks). Two things that fights will read once the fight system's last slice lands are shown separately, marked **Planned**.

## How to react

Skim the table, then read the cards that catch your eye. For each item, one word is enough: **cool**, **fine**, **flat** or **wrong** — and a few words on why if you have them. Reactions on the questions below settle the design in one pass.

What your reactions decide:

1. **The bar.** Which of these would you be glad to see a mortal pick up? Which are flat?
2. **Which trope tables earn their place.** 21 tropes fired; each is listed on its card. Which would you cut, and what is missing?
3. **The name grammar.** Eight name shapes are in play (listed under *How these were made*). Which read as names you would remember?
4. **How world-flavoured.** Items are faction-made, monster-taken, place-bred or history-touched. Which kind of story do you want most of?
5. **The rarity spread.** Nine Mundane, nine Storied, seven Mythic, five Legendary. Should the generator make Mundane things at all, or leave those to the hand catalog?
6. **The dial.** Items here grow around a hand-written core. Appendix B shows the same machine with the cores switched off.

## At a glance

| # | Name | Rarity | What it is | Trope | Fight | Map / social | Catch |
|---|---|---|---|---|---|---|---|
| 1 | Delver's Fire-Wine | Mundane | fire-wine | good things to carry | yes |  |  |
| 2 | Factor's Coin | Mundane | coin | the trader's edge |  | social |  |
| 3 | The Holed Charm | Mundane | charm | a small luck |  |  |  |
| 4 | Horn Bow | Mundane | bow | plain gear, well made | yes |  | yes |
| 5 | Wolfpelt Cloak | Mundane | cloak | a trophy taken from a monster | yes |  |  |
| 6 | Ivo's Boots | Mundane | boots | tools of a quiet trade |  |  |  |
| 7 | Sexton | Mundane | war-horse | a beast worth its keep | yes | map | yes |
| 8 | Tideway | Mundane | walking staff | road luck |  | map |  |
| 9 | Sellsword's Spear | Mundane | spear | plain gear, well made | yes |  | yes |
| 10 | The Oskell Signet | Storied | signet ring | the heirloom |  | social | yes |
| 11 | Emberbite | Storied | axe | the blade that wants blood | yes |  | yes |
| 12 | The Unquiet Blade | Storied | sword | the blade that wants blood | yes |  | yes |
| 13 | Chamberlain's Amulet | Storied | amulet | the ring that bargains |  |  | yes |
| 14 | The Unread Ledger | Storied | ledger | the book that should not be read |  |  | yes |
| 15 | Guardsman's Ring | Storied | ring | the vow-bound thing |  | social | yes |
| 16 | The Last Helm | Storied | helm | salvage from a disaster | yes |  |  |
| 17 | The Frozen Mantle | Storied | cloak | salvage from a disaster |  |  | yes |
| 18 | Walker's Compass | Storied | compass | road luck |  | map |  |
| 19 | The Bright Blade | Mythic | sword | the weapon that chose its bearer | yes |  | yes |
| 20 | Hollowroot | Mythic | idol | the relic that sours the land |  | map | yes |
| 21 | The Blue Glass | Mythic | hand-mirror | the lantern that shows the dead |  | map | yes |
| 22 | The Black Knife | Mythic | knife | the relic that sours the land |  | map | yes |
| 23 | Horn of Hesta Ryle | Mythic | war-horn | the standard that steadies the line | yes | social | yes |
| 24 | Stole of Sister Maud | Mythic | stole | a saint's relic | yes | map, social | yes |
| 25 | Quartermaster's Amulet | Mythic | amulet | the vow-bound thing | yes | social | yes |
| 26 | The Unfinished Locket | Legendary | locket | the thing that will not let you die | yes |  | yes |
| 27 | Nightstone | Legendary | stone | the stone that quiets magic | yes |  | yes |
| 28 | Spear of Bram Oskell | Legendary | spear | the weapon that chose its bearer | yes |  | yes |
| 29 | Coin of the Long Account | Legendary | coin | the ring that bargains |  |  | yes |
| 30 | Stole of Father Gall | Legendary | stole | a saint's relic |  | map, social | yes |

Coverage: 15 items matter in a fight (across four rarity bands); 13 work on the map or socially (across four bands); 21 of 21 tropes appear; 22 of 30 carry a catch.

## Mundane — nine items

### 1. Delver's Fire-Wine
**Mundane** · Provisions (fire-wine) · Sphere: Life · Reach: Iron · trope: *good things to carry* · matters in a fight

**What it is.** A flask of black-honey fire-wine, wrapped in a clean cloth. The Adventurers Guild make these by the barrel and sell them at cost.

**What it does.** Good for two hard stretches of fighting (Iron), noticeably better each time; then it is used up.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: consumable_charge(2 × iron +0.06)<br>tables: trope provisions · form wine · material black_honey · sphere life · reach iron · provenance practical (faction) · name grammar role (also rolled: Black-honey Fire-Wine)<br>node: tier 1 · provisions · slot consumable · loss consumable · tags #provision #life #iron #consumable · engine read-back: clean (10 checks)</sub>

### 2. Factor's Coin
**Mundane** · Relics & Talismans (coin) · Sphere: Matter · Reach: Gold · trope: *the trader's edge* · social

**What it is.** A bronze coin, stamped with the Consortium's mark and a date. The Merchant Consortium hand these to factors who have proven they can count.

**What it does.** Its bearer is noticeably better at trade and bargaining (Gold). People deal with its bearer more readily.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: passive(gold +0.04) · social_modifier(any +0.05)<br>tables: trope merchant · form coin · material bronze · sphere matter · reach gold · provenance practical (faction) · name grammar role (also rolled: Bronze Coin / The Bright Coin)<br>node: tier 1 · relics_talismans · slot wealth · loss stealable · tags #talisman #matter #gold #trade · engine read-back: clean (11 checks)</sub>

### 3. The Holed Charm
**Mundane** · Relics & Talismans (charm) · Sphere: Chaos · Reach: Star · trope: *a small luck*

**What it is.** A greystone charm with a hole worn through the middle. Tamsin Weir swore by it. She came out of the barrows alone, so make of that what you will.

**What it does.** The next time a bad outcome would wear its bearer thin, it takes the loss instead — and is gone.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: prevent_loss(quintessence 0.03, consumed)<br>tables: trope lucky_charm · form charm · material greystone · sphere chaos · reach star · provenance practical (hero) · name grammar definite (also rolled: Sailor's Charm / Rivencharm)<br>node: tier 1 · relics_talismans · slot necklace · loss consumable · tags #talisman #chaos #star #trinket · engine read-back: clean (10 checks)</sub>

### 4. Horn Bow
**Mundane** · Arms (bow) · Sphere: Force · Reach: Iron · trope: *plain gear, well made* · matters in a fight

**What it is.** A horn bow with a maker's mark punched near the grip. Ashborn smiths made it to do one job well, and it has done a great deal of that.

**What it does.** Its bearer is noticeably better at fighting (Iron), and a touch more skilled at it for as long as they carry it.

**The catch.** If things go very badly (about one time in three), it breaks.

<sub>Under the hood — primitives: passive(iron +0.04) · stat_contribution(iron +0.28) · action_trigger(on encounter_critical_failure → self_remove, p 0.3)<br>tables: trope honest_gear · form bow · material horn · sphere force · reach iron · provenance practical (culture) · name grammar material (also rolled: Quartermaster's Bow)<br>node: tier 1 · arms · slot weapon · loss breakable · tags #weapon #ranged #force #iron #combat #craft · engine read-back: clean (13 checks)</sub>

### 5. Wolfpelt Cloak
**Mundane** · Vestments (cloak) · Sphere: Life · Reach: Iron · trope: *a trophy taken from a monster* · matters in a fight

**What it is.** A wolf-pelt cloak, scarred where it was cut free. Arn Veck took it from a wolf of the Thornwood Beast Pack and wore it home as proof.

**What it does.** Its bearer is noticeably better at fighting (Iron). Out in the wilds, a little better again.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: conditional(in_wilderness: iron +0.03) · passive(iron +0.04)<br>tables: trope beast_trophy · form cloak · material wolf_pelt · sphere life · reach iron · provenance martial (monster + hero) · name grammar material (also rolled: Hunter's Cloak / Arn's Cloak / Greenmantle)<br>node: tier 1 · vestments · slot vestment · loss stealable · tags #cloth #life #iron #wilderness · engine read-back: clean (13 checks)</sub>

### 6. Ivo's Boots
**Mundane** · Vestments (boots) · Sphere: Darkness · Reach: Shadow · trope: *tools of a quiet trade*

**What it is.** A pair of oiled leather boots, wrapped in a roll of oiled cloth. Ivo Tallow, who kept the best back room in Saltmere, sold them on. They have been sold several times since.

**What it does.** Its bearer is noticeably better at stealth and secrets (Shadow). When working alone, a little better again.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: conditional(alone: shadow +0.02) · passive(shadow +0.04)<br>tables: trope thieves_kit · form boots · material leather · sphere darkness · reach shadow · provenance practical (hero) · name grammar person (also rolled: Leather Boots / Housebreaker's Boots / The Quiet Boots)<br>node: tier 1 · vestments · slot vestment · loss stealable · tags #cloth #darkness #shadow #stealth · engine read-back: clean (13 checks)</sub>

### 7. Sexton
**Mundane** · Mounts & Beasts (war-horse) · Sphere: Life · Reach: Heart · trope: *a beast worth its keep* · matters in a fight, works on the map

**What it is.** A dun war-horse, patient with strangers and nobody else. It was bred at Greywater Ford. The breeders there still ask after it.

**What it does.** Once a fight starts, its bearer's nerve holds a little better. Its bearer covers ground faster.

**The catch.** If things go very badly (about one time in three), the animal does not come back.

<sub>Under the hood — primitives: conditional(in_combat: heart +0.02) · range_modifier(move ×0.9) · action_trigger(on encounter_critical_failure → self_remove, p 0.3)<br>tables: trope mount · form warhorse · material dun · sphere life · reach heart · provenance practical (place) · name grammar given<br>node: tier 1 · mounts_beasts · slot mount · loss breakable · tags #beast #mount #life #heart #travel · engine read-back: clean (14 checks)</sub>

### 8. Tideway
**Mundane** · Tools & Instruments (walking staff) · Sphere: Time · Reach: Star · trope: *road luck* · works on the map

**What it is.** A bog-oak walking staff, worn smooth where a great many hands have held it. Merchant Consortium factors swap these at crossroads. Nobody remembers who made the first one.

**What it does.** Its bearer covers ground faster. Out in the wilds, its bearer is a little better at travel and finding the way (Star).

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: range_modifier(move ×0.9) · conditional(in_wilderness: star +0.02)<br>tables: trope wanderer · form staff · material bog_oak · sphere time · reach star · provenance practical (faction) · name grammar portmanteau (also rolled: Factor's Staff / Staff of the Long Road)<br>node: tier 1 · tools_instruments · slot utility · loss stealable · tags #equipment #time #star #travel · engine read-back: clean (13 checks)</sub>

### 9. Sellsword's Spear
**Mundane** · Arms (spear) · Sphere: Matter · Reach: Iron · trope: *plain gear, well made* · matters in a fight

**What it is.** A bog-oak spear, black as tar and hard as stone. It was issued by the Free Company to a quartermaster, and never handed back.

**What it does.** Its bearer is noticeably better at fighting (Iron), and a touch more skilled at it for as long as they carry it.

**The catch.** If things go very badly (about one time in three), it breaks.

<sub>Under the hood — primitives: passive(iron +0.04) · stat_contribution(iron +0.23) · action_trigger(on encounter_critical_failure → self_remove, p 0.3)<br>tables: trope honest_gear · form spear · material bog_oak · sphere matter · reach iron · provenance practical (faction) · name grammar role (also rolled: Bog-oak Spear)<br>node: tier 1 · arms · slot weapon · loss breakable · tags #weapon #melee #matter #iron #combat #craft · engine read-back: clean (13 checks)</sub>

## Storied — nine items

### 10. The Oskell Signet
**Storied** · Relics & Talismans (signet ring) · Sphere: Time · Reach: Gold · trope: *the heirloom* · social

**What it is.** A pewter signet ring, mended more than once, each time by a different hand. It has been in the Oskell family longer than anyone can say. Bram Oskell was the last to wear it openly.

**What it does.** On home ground, its bearer is noticeably better at trade and bargaining (Gold). Its bearer's standing with their faction grows faster. Their own faction deal with its bearer more readily.

**The catch.** People of other factions trust its bearer less.

**Planned — in a fight.** It has seen much: whoever carries it stands a little steadier when a fight begins. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: conditional(at_home_territory: gold +0.05) · modify_rules(faction_influence_multiplier = 1.2) · social_modifier(same_faction +0.15) · social_modifier(different_faction -0.15)<br>tables: trope heirloom · form signet · material pewter · sphere time · reach gold · provenance reverent (hero) · name grammar house (also rolled: Bram's Signet / The Worn Signet)<br>node: tier 2 · relics_talismans · slot ring · loss stealable · tags #talisman #time #gold #relic #social #storied · traits trait.artifact.storied level 2 · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (15 checks)</sub>

### 11. Emberbite
**Storied** · Arms (axe) · Sphere: Energy · Reach: Iron · trope: *the blade that wants blood* · matters in a fight

**What it is.** A bog-iron axe with a grip that is always warm. It was found on the field after the Siege of Kel Barrow, standing upright in the mud with nobody near it.

**What it does.** Its bearer is noticeably better at fighting (Iron), and somewhat more skilled at it for as long as they carry it. Once a fight starts, its bearer's nerve holds noticeably better.

**The catch.** Its bearer goes looking for fights.

<sub>Under the hood — primitives: passive(iron +0.06) · stat_contribution(iron +0.52) · conditional(in_combat: heart +0.04) · behavior_weight(iron ×1.34)<br>tables: trope blood_hungry · form axe · material bog_iron · sphere energy · reach iron · provenance ominous (event) · name grammar portmanteau (also rolled: Bog-iron Axe / Axe of Many Widows / The Glad Axe)<br>node: tier 2 · arms · slot weapon · loss stealable · tags #weapon #melee #energy #iron #combat · engine read-back: clean (14 checks)</sub>

### 12. The Unquiet Blade
**Storied** · Arms (sword) · Sphere: Force · Reach: Iron · trope: *the blade that wants blood* · matters in a fight

**What it is.** A blackiron sword, heavier than it looks. It belonged to Hesta Ryle, who held Greywater Ford. She never lost a fight with it, and never once put it down.

**What it does.** Its bearer is noticeably better at fighting (Iron), and a good deal more skilled at it for as long as they carry it. Once a fight starts, its bearer's nerve holds noticeably better.

**The catch.** Over time, its bearer grows Power-Hungry.

**Planned — in a fight.** It has seen much: whoever carries it stands a little steadier when a fight begins. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: passive(iron +0.05) · stat_contribution(iron +0.64) · conditional(in_combat: heart +0.04) · axiological_drift(mercy_ruthlessness -0.002/tick → -0.6)<br>tables: trope blood_hungry · form sword · material blackiron · sphere force · reach iron · provenance ominous (hero) · name grammar definite (also rolled: Blackiron Sword / Hesta's Sword / Sword of the Long Grudge)<br>node: tier 2 · arms · slot weapon · loss stealable · tags #weapon #melee #force #iron #combat #storied · traits trait.artifact.storied level 2 · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (14 checks)</sub>

### 13. Chamberlain's Amulet
**Storied** · Relics & Talismans (amulet) · Sphere: Darkness · Reach: Gold · trope: *the ring that bargains*

**What it is.** A bog-iron amulet with a tiny pair of scales worked into it. The Underking's Court lend these out. They are never given, and the loan is always repaid.

**What it does.** Its bearer is noticeably better at trade and bargaining (Gold). When its bearer only just misses, it turns the miss into a scraped success.

**The catch.** Each time it helps its bearer succeed, it takes a little of them in payment: some of their sense of self, gone for good.

<sub>Under the hood — primitives: test_shaper(near_miss +1 step, margin ≤ 3) · passive(gold +0.05) · action_trigger(on encounter_success → resource_delta quintessence -0.02)<br>tables: trope bargain · form amulet · material bog_iron · sphere darkness · reach gold · provenance ominous (faction) · name grammar role (also rolled: Amulet of Fair Terms / The Fair Heart / Blackheart)<br>node: tier 2 · relics_talismans · slot necklace · loss stealable · tags #talisman #darkness #gold #relic #curse · engine read-back: clean (13 checks)</sub>

### 14. The Unread Ledger
**Storied** · Tomes & Scrolls (ledger) · Sphere: Darkness · Reach: Veil · trope: *the book that should not be read*

**What it is.** A birch-bark ledger that is hard to find once it is put down. A Harrowfolk scribe wrote it over one winter and would not say where the words came from.

**What it does.** Its bearer learns faster: every step up in skill comes cheaper. When working alone, its bearer is noticeably better at magic and the unseen (Veil). Carrying it makes its bearer somewhat more skilled at magic and the unseen (Veil).

**The catch.** When its bearer fails, often they come away Shaken for two days.

<sub>Under the hood — primitives: modify_rules(tier_advancement_cost_multiplier = 0.85) · conditional(alone: veil +0.04) · stat_contribution(veil +0.49) · action_trigger(on encounter_failure → condition_grant trait.condition.shaken, 24 ticks, p 0.4)<br>tables: trope forbidden_book · form ledger · material birch_bark · sphere darkness · reach veil · provenance practical (culture) · name grammar definite (also rolled: Ledger of Unwritten Things / Blacktally)<br>node: tier 2 · tomes_scrolls · slot tome · loss stealable · tags #tome #darkness #veil #knowledge #arcane · engine read-back: clean (16 checks)</sub>

### 15. Guardsman's Ring
**Storied** · Relics & Talismans (ring) · Sphere: Spirit · Reach: Eye · trope: *the vow-bound thing* · social

**What it is.** A blackiron ring, engraved on the inside with a short promise. The Civic Guard give it to members who take the full oath. Breaking the oath means handing it back.

**What it does.** Its bearer is much better at noticing and knowing (Eye), and somewhat more skilled at it for as long as they carry it. Their own faction deal with its bearer more readily.

**The catch.** While it is carried, its bearer will not sneak, lie or steal.

<sub>Under the hood — primitives: passive(eye +0.07) · stat_contribution(eye +0.5) · social_modifier(same_faction +0.1) · action_gate(block shadow)<br>tables: trope oath_object · form ring · material blackiron · sphere spirit · reach eye · provenance reverent (faction) · name grammar role (also rolled: Ring of the Oath / The Kept Ring / Vigilring)<br>node: tier 2 · relics_talismans · slot ring · loss stealable · tags #talisman #spirit #eye #relic #social · engine read-back: clean (13 checks)</sub>

### 16. The Last Helm
**Storied** · Vestments (helm) · Sphere: Force · Reach: Iron · trope: *salvage from a disaster* · matters in a fight

**What it is.** A cold-iron helm with frost-cracks in it that never close. It came down off the barrow hill after the Siege of Kel Barrow, when the Free Company held the hill against the Grey Wraith Host for a whole winter. It has been cold ever since.

**What it does.** When outnumbered, its bearer is a little better at fighting (Iron). Carrying it makes its bearer somewhat more skilled at fighting (Iron).

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: conditional(outnumbered: iron +0.03) · stat_contribution(iron +0.36)<br>tables: trope disaster_salvage · form helm · material cold_iron · sphere force · reach iron · provenance ominous (event) · name grammar definite (also rolled: Hammerhelm / Helm of Kel Barrow)<br>node: tier 2 · vestments · slot vestment · loss stealable · tags #force #iron #ruins · engine read-back: clean (13 checks)</sub>

### 17. The Frozen Mantle
**Storied** · Vestments (cloak) · Sphere: Energy · Reach: Stone · trope: *salvage from a disaster*

**What it is.** A grey wool cloak, stiff, as if it has never quite thawed. It kept someone alive through the Long Winter, the year the passes stayed shut. People who were there still know it on sight.

**What it does.** Out in the wilds, its bearer is a little better at making and enduring (Stone). Carrying it makes its bearer somewhat more skilled at making and enduring (Stone).

**The catch.** Time runs slow around its bearer: every condition on them, good or bad, lasts longer.

<sub>Under the hood — primitives: conditional(in_wilderness: stone +0.03) · stat_contribution(stone +0.47) · modify_rules(duration_decay_multiplier = 0.8)<br>tables: trope disaster_salvage · form cloak · material wool · sphere energy · reach stone · provenance reverent (event) · name grammar definite (also rolled: Brandmantle / Cloak of Vessa's Rest)<br>node: tier 2 · vestments · slot vestment · loss stealable · tags #cloth #energy #stone #ruins · engine read-back: clean (14 checks)</sub>

### 18. Walker's Compass
**Storied** · Tools & Instruments (compass) · Sphere: Life · Reach: Star · trope: *road luck* · works on the map

**What it is.** A bronze compass, scuffed from a great many roads. It belonged to Arn Veck, who walked the whole border twice. He walked into Thornwood and did not come out. It came back with someone else.

**What it does.** Its bearer covers ground faster. Out in the wilds, its bearer is noticeably better at travel and finding the way (Star). Whenever its bearer arrives somewhere new, every place within two hexes becomes known to them.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: range_modifier(move ×0.85) · conditional(in_wilderness: star +0.05) · reveal(hexes, 2)<br>tables: trope wanderer · form compass · material bronze · sphere life · reach star · provenance practical (hero) · name grammar role (also rolled: Arn's Compass / Compass of the Long Road / Greenfind)<br>node: tier 2 · tools_instruments · slot utility · loss stealable · tags #equipment #life #star #travel · engine read-back: clean (14 checks)</sub>

## Mythic — seven items

### 19. The Bright Blade
**Mythic** · Arms (sword) · Sphere: Order · Reach: Iron · trope: *the weapon that chose its bearer* · matters in a fight

**What it is.** A bog-iron sword, wrapped in a faded ribbon nobody has dared to take off. The Civic Guard keep it for whoever is worthy of Hesta Ryle, who held Greywater Ford. Most who try it put it down again.

**What it does.** Its bearer is much better at fighting (Iron), and a good deal more skilled at it for as long as they carry it. In the hands of someone Hopeful, it is much better at fighting (Iron) still.

**The catch.** Anyone who is not Hopeful finds it fights them: they are much worse at fighting (Iron) with it than with a plain blade.

**Planned — in a fight.** It has seen much: whoever carries it stands a little steadier when a fight begins. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: conditional(has_trait:trait.core.core_hope.virtue: iron +0.08) · passive(iron +0.07) · stat_contribution(iron +0.95) · conditional(lacks_trait:trait.core.core_hope.virtue: iron -0.09)<br>tables: trope chose_bearer · form sword · material bog_iron · sphere order · reach iron · provenance reverent (hero + faction) · name grammar definite (also rolled: Hesta's Sword / Oathedge / Sword of Hesta Ryle)<br>node: tier 3 · arms · slot weapon · loss permanent · tags #weapon #melee #order #iron #combat #relic #storied · traits trait.artifact.storied level 2 · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (15 checks)</sub>

### 20. Hollowroot
**Mythic** · Relics & Talismans (idol) · Sphere: Entropy · Reach: Shadow · trope: *the relic that sours the land* · works on the map

**What it is.** A bog-oak idol that leaves a grey smear on anything it rests on. A thing of the Plague Shamble carried it. When the thing was burned, this was all that did not.

**What it does.** Its bearer is much better at stealth and secrets (Shadow), and a good deal more skilled at it for as long as they carry it. When working alone, noticeably better again.

**The catch.** The land sours wherever its bearer stays.

<sub>Under the hood — primitives: passive(shadow +0.08) · conditional(alone: shadow +0.04) · stat_contribution(shadow +0.81) · hex_effect(corruption +0.01/tick)<br>tables: trope blight · form idol · material bog_oak · sphere entropy · reach shadow · provenance ominous (monster) · name grammar portmanteau (also rolled: Idol of the Plague Year / The Black Idol)<br>node: tier 3 · relics_talismans · slot utility · loss permanent · tags #entropy #shadow #relic #curse #ancient · engine read-back: clean (15 checks)</sub>

### 21. The Blue Glass
**Mythic** · Tools & Instruments (hand-mirror) · Sphere: Spirit · Reach: Eye · trope: *the lantern that shows the dead* · works on the map

**What it is.** A bronze hand-mirror that shows the room a little darker than it is. Maren Doss used it to look for the people she lost. She found them.

**What it does.** Its bearer always notices what is happening up to two hexes away, even when tired or in fog. When badly worn down, its bearer is noticeably better at magic and the unseen (Veil). Carrying it makes its bearer a good deal more skilled at noticing and knowing (Eye).

**The catch.** Its bearer is noticeably worse at nerve and dealing with people (Heart).

<sub>Under the hood — primitives: reveal(encounters, 2) · conditional(health_low: veil +0.06) · stat_contribution(eye +0.65) · passive(heart -0.04)<br>tables: trope shows_the_dead · form mirror · material bronze · sphere spirit · reach eye · provenance ominous (hero) · name grammar definite (also rolled: Gravewarden's Mirror / Mirror of Old Names / Dreamglass)<br>node: tier 3 · tools_instruments · slot utility · loss permanent · tags #tool #spirit #eye #vision #supernatural · engine read-back: clean (15 checks)</sub>

### 22. The Black Knife
**Mythic** · Arms (knife) · Sphere: Darkness · Reach: Veil · trope: *the relic that sours the land* · works on the map

**What it is.** A bone knife with a blade gone grey and pitted. It was dug up in Low Harrow the spring after the Drowning. The field it came from has not grown anything since.

**What it does.** Its bearer is much better at magic and the unseen (Veil), and a good deal more skilled at it for as long as they carry it. When badly worn down, noticeably better again.

**The catch.** The land sours wherever its bearer stays.

<sub>Under the hood — primitives: passive(veil +0.08) · conditional(health_low: veil +0.04) · stat_contribution(veil +0.91) · hex_effect(corruption +0.01/tick)<br>tables: trope blight · form knife · material bone · sphere darkness · reach veil · provenance ominous (event) · name grammar definite (also rolled: Knife of Bad Harvests / Dusktooth)<br>node: tier 3 · arms · slot weapon · loss permanent · tags #weapon #melee #precision #darkness #veil #relic #curse #ancient · engine read-back: clean (15 checks)</sub>

### 23. Horn of Hesta Ryle
**Mythic** · Relics & Talismans (war-horn) · Sphere: Force · Reach: Iron · trope: *the standard that steadies the line* · matters in a fight, social

**What it is.** A pewter war-horn, dented where it was used as a club. Hesta Ryle blew it at the Last Stand at Greywater Ford. She died at the ford; it never went quiet.

**What it does.** Its bearer is noticeably better at nerve and dealing with people (Heart). Allies within one hex of its bearer are noticeably better at fighting (Iron). Their own faction deal with its bearer more readily.

**The catch.** Its bearer goes looking for fights.

<sub>Under the hood — primitives: aura(allies, radius 1, iron +0.05) · social_modifier(same_faction +0.15) · passive(heart +0.05) · behavior_weight(iron ×1.23)<br>tables: trope war_banner · form horn · material pewter · sphere force · reach iron · provenance martial (hero + event) · name grammar proper (also rolled: Captain's Horn / The Grey Horn / Hammercall)<br>node: tier 3 · relics_talismans · slot utility · loss permanent · tags #force #iron #combat · engine read-back: clean (13 checks)</sub>

### 24. Stole of Sister Maud
**Mythic** · Vestments (stole) · Sphere: Light · Reach: Heart · trope: *a saint's relic* · matters in a fight, works on the map, social

**What it is.** An undyed silk stole, embroidered with a small, crooked sun. It was worn by Sister Maud, who nursed Thornwood through the Plague Year. The Holy Order of the Dawn carry it to places the sick cannot leave.

**What it does.** Road Fever, Gut Rot, Greyscale and the Wasting cannot take hold of its bearer. Every condition on its bearer runs its course much faster: wounds, sickness and curses — but blessings too. Allies within one hex of its bearer are noticeably better at nerve and dealing with people (Heart). Ground where its bearer stays a while grows holy.

**The catch.** While it is carried, its bearer will not sneak, lie or steal.

<sub>Under the hood — primitives: tag_immunity(#disease → blocks 4 real conditions) · modify_rules(healing_multiplier = 1.75) · aura(allies, radius 1, heart +0.05) · hex_effect(divineInfluence +0.006/tick) · action_gate(block shadow)<br>tables: trope saints_relic · form stole · material silk · sphere light · reach heart · provenance reverent (hero + faction) · name grammar proper (also rolled: Maud's Stole / Stole of the Vigil / The Quiet Stole)<br>node: tier 3 · vestments · slot vestment · loss permanent · tags #cloth #light #heart #divine #relic #healing · engine read-back: clean (19 checks)</sub>

### 25. Quartermaster's Amulet
**Mythic** · Relics & Talismans (amulet) · Sphere: Order · Reach: Iron · trope: *the vow-bound thing* · matters in a fight, social

**What it is.** A pewter amulet with the mark of its order stamped deep. The Free Company give it to members who take the full oath. Breaking the oath means handing it back.

**What it does.** Its bearer is far better at fighting (Iron), and a good deal more skilled at it for as long as they carry it. Their own faction deal with its bearer more readily.

**The catch.** While it is carried, its bearer will not plead or charm.

<sub>Under the hood — primitives: passive(iron +0.11) · stat_contribution(iron +0.71) · social_modifier(same_faction +0.1) · action_gate(block heart)<br>tables: trope oath_object · form amulet · material pewter · sphere order · reach iron · provenance reverent (faction) · name grammar role (also rolled: Amulet of the Oath / The Sworn Heart / Oathward)<br>node: tier 3 · relics_talismans · slot necklace · loss permanent · tags #talisman #order #iron #relic #social · engine read-back: clean (13 checks)</sub>

## Legendary — five items

### 26. The Unfinished Locket
**Legendary** · Relics & Talismans (locket) · Sphere: Time · Reach: Stone · trope: *the thing that will not let you die* · matters in a fight

**What it is.** A bog-iron locket with a lock of grey hair behind cracked glass. Wenna Kell, who outlived four masters of the Court, wore it for longer than anyone could remember. She never died. In the end there was not enough of her left to.

**What it does.** Its bearer cannot die. Carrying it makes its bearer a good deal more skilled at making and enduring (Stone).

**The catch.** It feeds on its bearer. They slowly wear thin, and someone worn all the way through is gone from the story all the same.

**Planned — in a fight.** The curse in it costs its bearer a little at every exchange of blows. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: modify_rules(death_prevented = true) · stat_contribution(stone +0.95) · resource_manipulate(quintessence -0.004/tick; regen is +0.002)<br>tables: trope deathless · form locket · material bog_iron · sphere time · reach stone · provenance ominous (hero) · name grammar definite (also rolled: Wenna's Locket / Locket of Many Winters)<br>node: tier 4 · relics_talismans · slot necklace · loss cursed · tags #talisman #time #stone #relic #cursed #ancient · traits trait.artifact.cursed · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (12 checks)</sub>

### 27. Nightstone
**Legendary** · Relics & Talismans (stone) · Sphere: Darkness · Reach: Eye · trope: *the stone that quiets magic* · matters in a fight

**What it is.** A salt-crystal stone with no mark of any kind on it. It was found in the ashes after the Burning of the Library. Nothing near it had burned.

**What it does.** Its bearer is far better at noticing and knowing (Eye). Every charm and enchanted thing within two hexes of its bearer goes quiet — friend's or foe's. Ill Luck, Nightmares, Tonguebound and six other curses cannot take hold of its bearer.

**The catch.** Its bearer's own charms go quiet too — it does not pick sides.

<sub>Under the hood — primitives: suppress(all_effects, radius 2) · passive(eye +0.13) · tag_immunity(#curse → blocks 9 real conditions)<br>tables: trope nullstone · form stone · material salt · sphere darkness · reach eye · provenance mystical (event) · name grammar portmanteau (also rolled: Witchfinder's Stone / Stone of the Closed Door / The Dull Stone)<br>node: tier 4 · relics_talismans · slot utility · loss permanent · tags #talisman #darkness #eye #anti-magic · engine read-back: clean (23 checks)</sub>

### 28. Spear of Bram Oskell
**Legendary** · Arms (spear) · Sphere: Force · Reach: Iron · trope: *the weapon that chose its bearer* · matters in a fight

**What it is.** A blackiron spear with a plain grip and no ornament at all. It went into the ground with Bram Oskell. It came back up on its own, and it is still looking for someone Forgiving.

**What it does.** Its bearer is much better at fighting (Iron), and far more skilled at it for as long as they carry it — a lift big enough to show on their sheet. In the hands of someone Forgiving, it is far better at fighting (Iron) still.

**The catch.** Anyone who is not Forgiving finds it fights them: they are much worse at fighting (Iron) with it than with a plain blade.

**Planned — in a fight.** It has seen it all: whoever carries it stands a little steadier when a fight begins. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: conditional(has_trait:trait.core.core_forgiveness.virtue: iron +0.12) · passive(iron +0.08) · stat_contribution(iron +1.75) · conditional(lacks_trait:trait.core.core_forgiveness.virtue: iron -0.09)<br>tables: trope chose_bearer · form spear · material blackiron · sphere force · reach iron · provenance mystical (hero) · name grammar proper (also rolled: Bram's Spear / The Merciful Spear / Breakpoint)<br>node: tier 4 · arms · slot weapon · loss permanent · tags #weapon #melee #force #iron #combat #relic #storied · traits trait.artifact.storied level 3 · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (15 checks)</sub>

### 29. Coin of the Long Account
**Legendary** · Relics & Talismans (coin) · Sphere: Chaos · Reach: Gold · trope: *the ring that bargains*

**What it is.** A silver coin that never sits quite where it was left. Nobody made it. It turns up in the pocket of someone who badly needs a win, and it keeps an account.

**What it does.** Its bearer is far better at trade and bargaining (Gold), and far more skilled at it for as long as they carry it — a lift big enough to show on their sheet. When its bearer only just misses, it turns the miss into a scraped success.

**The catch.** Each time it helps its bearer succeed, it takes a little of them in payment: some of their sense of self, gone for good.

**Planned — in a fight.** The curse in it costs its bearer a little at every exchange of blows. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: test_shaper(near_miss +1 step, margin ≤ 8) · passive(gold +0.14) · stat_contribution(gold +1.77) · action_trigger(on encounter_success → resource_delta quintessence -0.05)<br>tables: trope bargain · form coin · material silver · sphere chaos · reach gold · provenance mystical · name grammar xofy (also rolled: Moneylender's Coin / The Patient Coin / Rivenmark)<br>node: tier 4 · relics_talismans · slot wealth · loss cursed · tags #talisman #chaos #gold #relic #curse #cursed · traits trait.artifact.cursed · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (14 checks)</sub>

### 30. Stole of Father Gall
**Legendary** · Vestments (stole) · Sphere: Light · Reach: Stone · trope: *a saint's relic* · works on the map, social

**What it is.** An undyed silk stole, worn thin where the faithful have kissed it. Father Gall is buried under the shrine he kept. The sick who pray at his grave still go home well.

**What it does.** Ill Luck, Nightmares, Tonguebound and six other curses cannot take hold of its bearer. Every condition on its bearer runs its course much faster: wounds, sickness and curses — but blessings too. Allies within one hex of its bearer are noticeably better at making and enduring (Stone). Ground where its bearer stays a while grows holy.

**The catch.** While it is carried, its bearer will not sneak, lie or steal.

<sub>Under the hood — primitives: tag_immunity(#curse → blocks 9 real conditions) · modify_rules(healing_multiplier = 2) · aura(allies, radius 1, stone +0.06) · hex_effect(divineInfluence +0.01/tick) · action_gate(block shadow)<br>tables: trope saints_relic · form stole · material silk · sphere light · reach stone · provenance reverent (hero) · name grammar proper (also rolled: Gall's Stole / Stole of the Vigil / The Quiet Stole)<br>node: tier 4 · vestments · slot vestment · loss permanent · tags #cloth #light #stone #divine #relic #healing · engine read-back: clean (24 checks)</sub>

---

## Appendix A — a second seed (seed 7, five items)

Same tables, different dice — to show the variety between runs.

### A1. Walker's Boots
**Mundane** · Vestments (boots) · Sphere: Life · Reach: Star · trope: *road luck* · works on the map

**What it is.** A pair of oiled leather boots, patched at the heel with three different leathers. They belonged to Maren Doss, who ran salt from Saltmere to the coast. She drowned with her boat at Low Harrow. They came back with someone else.

**What it does.** Its bearer covers ground faster. Out in the wilds, its bearer is a little better at travel and finding the way (Star).

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: range_modifier(move ×0.9) · conditional(in_wilderness: star +0.02)<br>tables: trope wanderer · form boots · material leather · sphere life · reach star · provenance practical (hero) · name grammar role (also rolled: Maren's Boots / Boots of Far Places / Rootfoot)<br>node: tier 1 · vestments · slot vestment · loss stealable · tags #cloth #life #star #travel · engine read-back: clean (13 checks)</sub>

### A2. Sorrow
**Storied** · Mounts & Beasts (horse) · Sphere: Life · Reach: Star · trope: *a beast worth its keep* · works on the map

**What it is.** A brindled horse, patient with strangers and nobody else. It was Hesta Ryle's. It came home without her, and would not let anyone near it for a month.

**What it does.** Its bearer covers ground faster. Out in the wilds, its bearer is noticeably better at travel and finding the way (Star).

**The catch.** If things go very badly (about one time in five), the animal does not come back.

<sub>Under the hood — primitives: range_modifier(move ×0.85) · conditional(in_wilderness: star +0.04) · action_trigger(on encounter_critical_failure → self_remove, p 0.2)<br>tables: trope mount · form horse · material brindle · sphere life · reach star · provenance martial (hero) · name grammar given<br>node: tier 2 · mounts_beasts · slot mount · loss breakable · tags #beast #mount #life #star #travel · engine read-back: clean (15 checks)</sub>

### A3. The Worn Signet
**Storied** · Relics & Talismans (signet ring) · Sphere: Order · Reach: Heart · trope: *the heirloom* · social

**What it is.** A brass signet ring with the family mark half rubbed away. It has been in the Hale family longer than anyone can say. Corvin Hale was the last to wear it openly.

**What it does.** On home ground, its bearer is noticeably better at nerve and dealing with people (Heart). Its bearer's standing with their faction grows faster. Their own faction deal with its bearer more readily.

**The catch.** None. It is simply good.

**Planned — in a fight.** It has seen much: whoever carries it stands a little steadier when a fight begins. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: conditional(at_home_territory: heart +0.04) · modify_rules(faction_influence_multiplier = 1.2) · social_modifier(same_faction +0.15)<br>tables: trope heirloom · form signet · material brass · sphere order · reach heart · provenance reverent (hero) · name grammar definite (also rolled: Corvin's Signet / The Hale Signet)<br>node: tier 2 · relics_talismans · slot ring · loss stealable · tags #talisman #order #heart #relic #social #storied · traits trait.artifact.storied level 2 · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (14 checks)</sub>

### A4. Lantern of the Low Watch
**Mythic** · Tools & Instruments (lantern) · Sphere: Spirit · Reach: Eye · trope: *the lantern that shows the dead* · works on the map

**What it is.** A silver lantern, green with verdigris, on a short chain. The Temple of the Spheres give one to each keeper who sits with the dying. This one was never handed back.

**What it does.** Its bearer always notices what is happening up to two hexes away, even when tired or in fog. When badly worn down, its bearer is much better at magic and the unseen (Veil). Carrying it makes its bearer somewhat more skilled at noticing and knowing (Eye).

**The catch.** When its bearer fails, about one time in four they come away Grieving for three days.

<sub>Under the hood — primitives: reveal(encounters, 2) · conditional(health_low: veil +0.07) · stat_contribution(eye +0.56) · action_trigger(on encounter_failure → condition_grant trait.condition.grieving, 36 ticks, p 0.25)<br>tables: trope shows_the_dead · form lantern · material silver · sphere spirit · reach eye · provenance reverent (faction) · name grammar xofy (also rolled: Priest's Lantern / The Blue Lamp / Ghostlight)<br>node: tier 3 · tools_instruments · slot utility · loss permanent · tags #equipment #spirit #eye #vision #supernatural · engine read-back: clean (16 checks)</sub>

### A5. Reliquary of the Held Breath
**Legendary** · Relics & Talismans (reliquary) · Sphere: Time · Reach: Heart · trope: *the thing that will not let you die* · matters in a fight

**What it is.** A bronze reliquary, worn smooth where a great many hands have held it. Its last bearer walked out of the Long Winter without a scratch, and was a ghost of a person within the year.

**What it does.** Its bearer cannot die. Carrying it makes its bearer a good deal more skilled at nerve and dealing with people (Heart).

**The catch.** It feeds on its bearer. They slowly wear thin, and someone worn all the way through is gone from the story all the same.

**Planned — in a fight.** The curse in it costs its bearer a little at every exchange of blows. *(The fight system reads this in its last slice, not built yet.)*

<sub>Under the hood — primitives: modify_rules(death_prevented = true) · stat_contribution(heart +0.94) · resource_manipulate(quintessence -0.004/tick; regen is +0.002)<br>tables: trope deathless · form reliquary · material bronze · sphere time · reach heart · provenance ominous (event) · name grammar xofy (also rolled: The Patient Relic)<br>node: tier 4 · relics_talismans · slot necklace · loss cursed · tags #time #heart #relic #cursed #ancient · traits trait.artifact.cursed · planned: the fight read of these traits arrives with fight block FB7 · engine read-back: clean (12 checks)</sub>

## Appendix B — the dial: the same machine with the trope cores switched off

The same seed, the same tables, the same honesty rules — but no trope core. The machine picks a kind of thing, a reach and a sphere, composes one or two effects from the live vocabulary, adds a sphere touch at Mythic and above, and sometimes a catch. Read these next to the thirty above.

### B1. Keencoin
**Storied** · Relics & Talismans (coin) · Sphere: Mind · Reach: Heart · no trope (free composition)

**What it is.** A pewter coin, marked with small, careful tally-scratches. It passed through the hands of the Adventurers Guild before it reached its present owner.

**What it does.** Its bearer is noticeably better at nerve and dealing with people (Heart), and somewhat more skilled at it for as long as they carry it.

**The catch.** Its bearer is drawn towards nerve and dealing with people. If things go very badly (about one time in five), it breaks.

<sub>Under the hood — primitives: passive(heart +0.05) · stat_contribution(heart +0.48) · behavior_weight(heart ×1.32) · action_trigger(on encounter_critical_failure → self_remove, p 0.2)<br>tables: no trope (free composition) · form coin · material pewter · sphere mind · reach heart · provenance practical (faction) · name grammar portmanteau (also rolled: Pewter Coin / Barrow-diver's Coin / The Watchful Coin)<br>node: tier 2 · relics_talismans · slot wealth · loss breakable · tags #talisman #mind #heart #creation · engine read-back: clean (14 checks)</sub>

### B2. The Patient Glass
**Mythic** · Tools & Instruments (hand-mirror) · Sphere: Time · Reach: Gold · no trope (free composition) · social

**What it is.** A cold-iron hand-mirror, worn smooth where a great many hands have held it. Harrowfolk makers made it, and sold it on at Kel Barrow.

**What it does.** When its bearer only just misses, it turns the miss into a scraped success. Carrying it makes its bearer a good deal more skilled at trade and bargaining (Gold).

**The catch.** While it is carried, its bearer will not pry into secrets. Time runs slow around its bearer: every condition on them, good or bad, lasts longer.

<sub>Under the hood — primitives: test_shaper(near_miss +1 step, margin ≤ 5) · stat_contribution(gold +0.93) · action_gate(block eye) · modify_rules(duration_decay_multiplier = 0.85)<br>tables: no trope (free composition) · form mirror · material cold_iron · sphere time · reach gold · provenance practical (culture) · name grammar definite (also rolled: Cold-iron Mirror / Dustglass)<br>node: tier 3 · tools_instruments · slot utility · loss permanent · tags #tool #time #gold #creation · engine read-back: clean (13 checks)</sub>

### B3. The Bright Maul
**Legendary** · Arms (mace) · Sphere: Light · Reach: Stone · no trope (free composition) · works on the map

**What it is.** A silver mace, tarnished black in every crease. Maren Doss owned it once — a Consortium factor who ran salt from Saltmere to the coast.

**What it does.** Its bearer is far better at making and enduring (Stone), and far more skilled at it for as long as they carry it — a lift big enough to show on their sheet. Its bearer notices things one hex further off than they otherwise would.

**The catch.** None. It is simply good.

<sub>Under the hood — primitives: passive(stone +0.12) · stat_contribution(stone +1.59) · range_modifier(awareness +1)<br>tables: no trope (free composition) · form mace · material silver · sphere light · reach stone · provenance martial (hero) · name grammar definite (also rolled: Silver Mace / Sunmaul / Mace of Maren Doss)<br>node: tier 4 · arms · slot weapon · loss permanent · tags #weapon #melee #light #stone #creation · engine read-back: clean (12 checks)</sub>

---

## How these were made

Each item is a stack of table rolls. Every table is its own seeded stream (the pattern the Encounter Factory already uses in [drawTable.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/content-eval/drawTable.ts)), so changing one table never reshuffles another — cut a trope and every other item keeps its dice.

**Rarity band.** The game's own four words from [rarity.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/types/rarity.ts): Mundane, Storied, Mythic, Legendary. The band sets the size of everything else: how strong a bonus may be (matched to the hand catalog's ranges and the capability ceilings in [item-stat-bands.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/item-stat-bands.ts)), how many effects an item carries, whether a catch is likely, and which name shapes are favoured.

**Trope core (the authored part).** 21 hand-written cores, each a fantasy or world idea with a mechanical signature attached: *the blade that wants blood* (two), *the weapon that chose its bearer* (two), *the lantern that shows the dead* (one), *the ring that bargains* (two), *the thing that will not let you die* (one), *the stone that quiets magic* (one), *the book that should not be read* (one), *a saint's relic* (two), *the relic that sours the land* (two), *the heirloom* (one), *a trophy taken from a monster* (one), *salvage from a disaster* (two), *the vow-bound thing* (two), *the standard that steadies the line* (one), *road luck* (two), *the trader's edge* (one), *tools of a quiet trade* (one), *a beast worth its keep* (one), *good things to carry* (one), *plain gear, well made* (two), *a small luck* (one). A core says what the item must do, what it may cost, which kinds of thing it can be, which spheres and people and places fit it, and how its story and name are phrased. Everything else is rolled around it. A core can appear at most twice in one batch.

**World entities.** Real game concepts, partly faked for the sketch. The factions are the game's own (the twelve in [faction-definitions.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/faction-definitions.ts), with their real reach leanings) and so are the eight monster kinds in [monster-faction-definitions.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/monster-faction-definitions.ts), one per creation sphere. The places (Low Harrow, Kel Barrow, Greywater Ford, the Ashfold, Saltmere, Thornwood, Vessa's Rest), the eight past events and the eleven dead heroes are invented for this sketch; a live generator would read them from the world's own graph and chronicle, which [THR-1235](https://linear.app/threadbare/issue/THR-1235/random-table-raw-material-what-the-world-can-tell-the-generator) found is all reachable. Each core restricts who and what can appear (a thief's tools come from the Thieves Guild, a trophy from a monster). In this batch the stories named a person (most of them dead) thirteen times, a faction nine times, an event six times, a monster twice, a culture twice and a place once.

**Provenance.** One sentence or two about where the thing came from, in one of five tones borrowed from the game's unused [artifact lore patterns](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/culture-content.ts) (reverent, martial, mystical, practical, ominous). Those patterns were written in a lyrical register, so only their tones were kept and every sentence was rewritten plainly. Three coherence rules run after the roll: a story that names a hero and a faction names the hero's own faction; one that names a hero and an event names the hero's own event; and an oath-keeper is never the game's known oathbreaker.

**Sphere.** The core decides which spheres are possible; the world decides which of those. A relic of the Plague Year leans to Entropy because the event does, a Civic Guard ring to Order because the Guard does. The sphere colours the name's word stock, the look sentence, the material and a tag.

**Reach.** The core's reaches, leaned by the maker faction's reach weights and by what the thing is (worn things lean to Stone and Star, books to Eye and Veil).

**Kind and material.** The seven kinds of possession the game already has, forty-odd forms (sword, signet ring, war-horn, lantern, almanac, mule…), and around forty materials, each leaning to a sphere and to terrain (bog-iron from the marsh, cinder-glass from the Ashfold). Trophy materials come only from a monster (wolf-fang, storm-feather, wraith grave-cloth).

**Effects — the honest vocabulary.** Only effect shapes with a live reader in the engine are allowed: 23 shapes, each listed in the generator with the code that reads it. The fight system's two new words (a clock push and a condition inflicted on an opponent) are listed but switched off until they ship. Bonuses, penalties, durations and chances all sit inside the engine's own caps (no single effect over the per-effect cap, no reach over the total cap, no more than eight effects or two triggers on one item). One rule matters more than it looks: a "when…" bonus must name a real situation — alone, outnumbered, out in the wilds, badly worn down, on home ground, in the hands of someone True — or be the fight system's nerve step. The engine decides "in a fight", "with people" and "with magic" from the kind of step being rolled, so a bonus like "better at trade when dealing with people" is simply a trade bonus wearing a condition (see the notes at the end).

**The catch.** Every catch must be a real mechanical downside the engine applies, never flavour: a pull towards fights, a slow drift towards a vice, a penalty elsewhere, a rule it forbids, a hex it sours, a toll on each success, a thinning of the bearer's self, or a chance of coming away Shaken, Grieving, with Nightmares or under Watch Scrutiny. A "breakable" item must carry the trigger that breaks it; a "cursed" one must carry the harm.

**Names.** Eight shapes: the six found in the hand catalog's names (the possessive one in two flavours) and two narrow ones for heirlooms and beasts. A shape is only offered if the story backs it (no "Hesta's Spear" unless the story names Hesta); rarer items lean away from plain material names; no name repeats in a batch.

| Name shape | This batch |
|---|---|
| Material + form | Horn Bow · Wolfpelt Cloak |
| Whose trade it served | Delver's Fire-Wine · Factor's Coin · Sellsword's Spear · Chamberlain's Amulet · Guardsman's Ring · Walker's Compass · Quartermaster's Amulet |
| Whose it was (first name) | Ivo's Boots |
| X of the Y | Coin of the Long Account |
| The + one word + thing | The Holed Charm · The Unquiet Blade · The Unread Ledger · The Last Helm · The Frozen Mantle · The Bright Blade · The Blue Glass · The Black Knife · The Unfinished Locket |
| One made-up word | Tideway · Emberbite · Hollowroot · Nightstone |
| Thing of a named person or place | Horn of Hesta Ryle · Stole of Sister Maud · Spear of Bram Oskell · Stole of Father Gall |
| A family name | The Oskell Signet |
| A beast's own name | Sexton |

**Look.** One concrete detail, drawn from the core, the material or the sphere, never repeated in a batch.

**Plain words.** The cards never print a number. Size is said in four steps (a little, noticeably, much, far); time in days; chances as "about one time in four".

**Checks.** Every item is validated against the game's closed tag vocabulary, its condition catalog and its caps, then minted into a small test world — a bearer, an ally and a rival in a village held by a third faction — and read back by the real engine functions: every bonus in an ordinary step of its reach and in its intended situation (built the way the game builds it), capability, rule overrides, immunities against every real condition, triggers, ticks, auras, suppression, charges. A control batch of seven deliberately dishonest items fails the read-back six times; the seventh (a trigger on a moment the game never raises) is caught by the validator instead. So a clean pass means something.

## Where the dial sits

This sketch sits at **authored cores, freely dressed**. The part a player would call the item's idea — the blade that wants blood, the coin that keeps an account, the locket that will not let you die — is hand-written once, with its signature effect and its catch. The part that makes two rolls of the same idea different — who carried it, where it came from, what it is made of, how strong it is, what it is called — is rolled from world tables.

Appendix B is the other end of the dial. Freely composed items are valid and balanced, and all of them read back clean, but they are anonymous: a pewter coin that makes you better with people, a mirror that forbids prying and slows time. Nothing ties the parts together, so nothing is memorable. Coherence comes from the core, not from the dice.

The cost of cores is authoring: each is roughly one table row plus a dozen lines of phrasing. The risk is repetition: a core has one signature, so its second appearance in a batch is a re-skin (see the critique). The fix is not free composition; it is two or three signatures per core, and more cores.

**My recommendation:** keep authored cores; grow them to two or three signatures each; let the world tables do the variation. Leave Mundane gear mostly to the hand catalog and generate from Storied up, where the cores earn their keep.

## Honest self-critique — the weakest items

My own read of the thirty, before yours: about fifteen cool, ten fine, five flat. Everything I would call cool is Storied or above and comes from a core with a strong idea and a catch you would hesitate over. The flat ones share causes worth fixing.

1. **#2 Factor's Coin** — the thin, samey pool in miniature. A coin that makes you a bit better at trade and a bit easier to deal with, with no catch and no hook. Its own story says the Consortium hands one to every factor who can count, which tells the player it is not special. The Mundane end of the trader core has two small bonuses and nothing else.
2. **#25 Quartermaster's Amulet** — incoherent at three joints. A Mythic oath named after a quartermaster (the name drew the Free Company's second job title); an oath that forbids "pleading or charming", which I invented to give the Free Company an oath row rather than taking it from anything the faction is; and the strongest Iron bonus in the Mythic band on a thing whose idea is a promise, not a weapon. It works; it means nothing.
3. **#22 The Black Knife** — a re-skin of #20 Hollowroot two slots earlier: same core, same signature (great power, the land sours), different shape. The core has one signature, so its second roll can only change the dressing. This is the clearest case for several signatures per core.
4. **#16 The Last Helm** — the history does all the work and the mechanics do not carry it. A winter-long siege becomes "a little better at fighting when outnumbered", with no catch. It is not even marked as having a past, though salvage has seen much by definition. A history-touched thing should feel touched.
5. **#3 The Holed Charm** — a real effect nobody would ever see. It takes the next blow to its bearer's sense of self and vanishes, silently, inside the nightly settling of accounts; nothing on screen would tell a player it worked. Some real effects are only as good as their visibility — the "items are invisible" itch this map set aside.

Also noted: #30 Stole of Father Gall is the second saint's relic and the second stole in a row, and its aura helps allies at "making and enduring" without anything in the saint's story pointing there; #17 The Frozen Mantle's catch (every condition lasts longer, good or bad) is a genuinely two-edged rule but a stretch for a warm cloak.

None of the catches in this batch is a fake: every one is applied by the engine (the read-back checks each). The weakest real ones are the social cold shoulder on #10 The Oskell Signet and the Heart penalty on #21 The Blue Glass — true, but mild.

## Notes for the design session — things the generator had to route around

These are engine facts found while building the honest vocabulary. None is new work for this ticket; each is a sentence the generator's plan doc will need.

1. **A reaction that grants a timed boost still does nothing.** When a `reactive` effect fires (on arrival, on being hurt), its nested bonus is handed to the executor, which treats every plain bonus as "applied elsewhere" and applies nothing ([effectEventDispatch.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/effects/effectEventDispatch.ts), [effectExecutors.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/effectExecutors.ts)). Shipped items promise this shape — "when damaged, a burst of Iron" on Hollowfang, a Heart burst on the Weeping Icon in [the reward catalog](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/reward-attachment-catalog.ts). The generator emits no `reactive` at all. *Filed as [THR-1568](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed).*
2. **The game's main conditions lack their family tags.** Terrified carries no `#fear`, Wounded no `#wound`, Cursed no `#curse` ([condition-trait-content.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/condition-trait-content.ts)). So "immune to fear" blocks nothing on a mortal (three shipped items say it), and a salve that heals by the `#wound` tag misses the Wounded condition fights apply. One tag each would fix it. The generator only offers immunities that block a real condition, and heals Wounded by its id. *Filed as [THR-1569](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions).*
3. **Only two of the eleven terrain overlays are read.** `warded` slows movement and `shrouded` shortens awareness ([movementCost.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/movementCost.ts)); the other nine persist and do nothing. The generator never emits them.
4. **Two trigger moments never happen.** Item triggers on `rest` and `spell_cast` are never raised anywhere; the generator's validator rejects them. (The engine read-back cannot see this one, because it calls the trigger directly.)
5. **A generated heirloom cannot be born with a past.** The Storied trait is stamped only at level one ([artifactTraits.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/artifactTraits.ts)); a hero's weapon or a family signet wants to start at "has seen much". A level option on the stamp is a small addition.
6. **"Storied" means two things.** It is the second rarity word and also the artifact trait "has seen a thing or two / much / it all" ([rarity.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/types/rarity.ts), [artifact-trait-content.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/artifact-trait-content.ts)). In this batch a Storied-rarity ring has no story and a Mythic sword is Storied-the-trait. Worth one ruling on words.
7. **Masterworks are empty.** The masterwork undertaking mints its item with no effects at all ([strategicGraphOps.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/strategicGraphOps.ts), `mintMasterwork`). A trope core dressed by the maker and the place is exactly what that object is missing — a natural first minting point.
8. **A shipped curse looks lethal.** The Mark of Debt condition drains the bearer's quintessence by one whole point per tick on a scale that runs from nothing to one ([reward catalog](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/reward-attachment-catalog.ts), [quintessence.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/types/quintessence.ts)), which would empty it in a single tick. Worth a look.
9. **Most "when…" bonuses in the hand catalog are plain bonuses in disguise.** The engine derives "in a fight", "with people", "with magic" and "exploring" from the reach of the step being rolled: `in_combat` is any Iron step (plus, since the fight block, every fight exchange), `in_social` any Heart or Gold step, `in_mystical` any Veil or Star step ([effectPredicates.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/effects/effectPredicates.ts), `buildPredicateContext`). A conditional on its own reach therefore fires on every step it could ever touch — it is a passive. Of the 41 conditionals in [the reward catalog](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/reward-attachment-catalog.ts), 26 are exactly that and 4 sit on a reach their condition almost never meets; 11 are genuinely situational. The one step-type condition that now means something new is `in_combat` on Heart — the nerve step at the start of every fight — which is what this batch uses for "its nerve holds better once a fight starts". The generator only allows situational conditions, and the engine read-back fails any bonus that fires in an ordinary step.
10. **Generated items need a name tag of their own.** The content registry recognises items by their id prefix (`reward_`, `starter_`, `anomaly_` in [content-objects.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/content-objects.ts)); a `gen_` prefix has to be added there so tooltips and checks see generated items.
11. **The fight system is ready for items.** Its plan ([fight block](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-23-fight-block.md)) already reads an item's "in a fight" bonus (shipped), will read Storied and cursed artifacts (last slice), and adds a clock push and an inflict-condition word "for cursed items" (a middle slice). The generator's table has both words listed and switched off.

---

*Built for [THR-1236](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to) from the research on [THR-1234](https://linear.app/threadbare/issue/THR-1234/item-minting-today-where-items-are-born-and-what-shapes-them), [THR-1235](https://linear.app/threadbare/issue/THR-1235/random-table-raw-material-what-the-world-can-tell-the-generator) and [THR-1237](https://linear.app/threadbare/issue/THR-1237/per-primitive-activation-ledger-what-live-means-for-every-dead-or), against the effect vocabulary made live by the [activation program](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-08-25-effect-vocabulary-activation.md). Throwaway prototype: the generator, the engine read-back and the raw item data touched nothing in the game's code. They are not in the repo; they are kept in the design vault's iteration record, `Brainstorms/2026-09-24-proto-items/`.*
