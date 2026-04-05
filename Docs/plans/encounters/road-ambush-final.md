# Encounter Pipeline: Road Ambush
> Scale: short | Slug: road-ambush | Pass: final
> Date: 2026-04-05 | Pipeline version: 2.0
> Status: **READY FOR IMPLEMENTATION**

---

## Pipeline Summary

| Pass | Verdict | Key Findings |
|---|---|---|
| Draft | Submitted for editorial | Initial design with branching structure, support bundle, outcome ladder |
| Editorial | PASS WITH REVISIONS | Strong prose, genuine branch seduction. 4 revisions required (Branch B aftermath closer, Pressure Knot tabard, Intervention Fantasy closing sentence, Branch A Critical Success waymarker). 2 optional polish items. |
| Systems | **READY FOR IMPLEMENTATION** | All required primitives live. No engine changes needed. Three authoring decisions to resolve before filing (driver persistence, extracted goods spec, road sublocation type ID). |

---

## Caveats

Three authoring decisions must be resolved before the TypeScript file is written. None block implementation — all are resolved in the author's discretion.

**1. Driver persistence contract**
The support spec must commit to a single `EncounterSupportPersistence` value. `EncounterSupportActorSpec` does not support conditional logic. Fix: set the driver to `must-persist`. Driver death is expressed as an `EncounterAftermathChange`, not node deletion.

**2. Branch B extracted goods spec**
The design describes three possible extracted objects (sealed letters, medicine, generic goods). A single `EncounterSupportSpec` cannot conditionally materialize different object types. Fix: author one canonical spec (recommend sealed correspondence attachment). Content variance is expressed via `intelligence` and `recent_event` aftermath reaction effects.

**3. Trade road sublocation type ID**
The `EncounterSupportLocationSpec` for the trade road needs a valid `sublocationTypeId` from world-model.json. Confirm before authoring. If no road/waypoint sublocation type exists, use `sublocation-type.gatehouse` (the soul-ferryman precedent) or propose a new type.

**Latent bug in flawed-steel.ts (out of scope):**
`flawed-steel.ts` uses `category: 'deception' as const` in two `hidden_mark` reaction effects, but `'deception'` is not in the `HiddenMarkCategory` union (`src/types/unifiedAction.ts`). The `as const` assertion masks the type error. For road-ambush, use `'debt'` (Dragan's obligation thread) or `'mystical_contract'` (the divine thread). The flawed-steel bug should be logged as a separate fix.

---

## Editorial Notes Summary

All four required revisions from the editorial pass were applied in the revised file. The revised file contains:

- **Branch B aftermath closer:** Sparrow/grain image replaced with waymarker stones + cobweb-thread metaphor ("The thread the god had planted in a broken soldier's mind was lighter than spider-silk and stronger than anything on that road.")
- **Pressure Knot tabard parenthetical:** Tightened to "Their tabards are faded past recognition — former company men, now road men."
- **Intervention Fantasy closing sentence:** Rhetorical question replaced with "The god chooses where the weight falls. Every raised blade on this road is waiting for permission to land."
- **Branch A Critical Success waymarker image:** "Stones standing straighter" replaced with "The waymarker stones caught the afternoon light the way they always had. The road did not know it had been defended. It did not need to."
- **Dragan's hand detail sharpened:** "Healed badly" replaced with "healed into white puckered knots that curl the remaining fingers inward."
- **Concept art fletching color specified:** "Its fletching dyed a faded yellow-green — company colors that no longer mean anything."

---

## Implementation File Map

| File | Action |
|---|---|
| `src/data/encounters/road-ambush.ts` | CREATE — new encounter file following flawed-steel.ts pattern |
| `src/data/unified-action-templates.ts` | EDIT — import and append `ROAD_AMBUSH_TEMPLATE` to `UNIFIED_ACTION_TEMPLATES` array |
| `public/concept-art/encounters/road-ambush.jpg` | CREATE (art pipeline) — 16:9 concept art per Section 19 of packet |
| `src/data/encounters/flawed-steel.ts` | OPTIONAL EDIT — fix latent `'deception'` HiddenMarkCategory type error (separate task) |

No changes required to type files or engine files.

---

## Full Encounter Packet

---

# Encounter Pipeline: Road Ambush
> Scale: short | Slug: road-ambush | Pass: revised
> Revisions applied: Branch B aftermath closer replaced (sparrow reuse eliminated), Pressure Knot tabard parenthetical tightened, Intervention Fantasy closing sentence rewritten, Branch A Critical Success waymarker image replaced, Dragan's maimed hand detail sharpened, concept art fletching color specified
> Date: 2026-04-05 | Pipeline version: 2.0

---

## 1. Inspiration Anchors

### Foundation References

**Tonal Bible** -- *Nostalgic Form, Adult Substance* provides the familiar frame: bandits on a trade road, a merchant caravan in trouble, armed violence in the dust. These are the oldest fantasy beats there are. The adult substance beneath: the bandits are not faceless evil -- they are a displaced militia company whose lord lost a border war last season and stopped paying them. They turned to the road because no one offered them another way to eat. The merchant is not innocent either -- her caravan carries goods priced beyond what the villages along this road can afford, and the tolls she pays to the regional lord fund the same army that broke the bandits' company in the first place. *Wonder Layered Over Grief* applies to the road itself: an old trade route lined with waymarker stones carved generations ago, each one an act of faith that commerce and safe passage would endure. The violence happening beside those stones is a desecration of the road's original promise.

**Thematic Pillars** -- *Compassion vs. Power* is the central axis. The god can intervene with force to end the violence, or with compassion to reshape the encounter's human meaning. *Order vs. Freedom* shapes the context: the bandits broke free of a military contract that was killing them; the merchant relies on the order of trade law to protect her goods. Both have legitimate claims. *Sovereignty vs. Consumption* is present in how the regional economy has consumed these former soldiers -- they were useful as blades, discarded when the war ended, and now they consume others in turn because they have no other sovereignty left.

**Anti-Patterns** -- Actively avoiding: *Dark Lord Problem* (#1) -- the bandits are not evil, they are desperate. The encounter must not frame them as monsters to be smited. *Clean Moral Binaries* (#9) -- protecting the merchant is not obviously right; exploiting the situation is not obviously wrong; abandoning the scene is not cowardice but a genuine divine posture. *Player as Savior* (#10) -- the caravan guards are already fighting. The merchant's driver has already been wounded trying to protect the lead wagon. The world is in motion before the god arrives. *Generic Fantasy Aesthetics* (#7) -- the road should feel specific: packed earth, ruts from cart wheels, the smell of dust and spoiled grain where a sack split open during the ambush.

**Dilemma Content Library (TB-038)** -- The axiological pair most relevant is **Justice vs. Mercy** (Iron reach). The bandits deserve punishment under trade law; they also deserve mercy under the broader framing of economic displacement. The dilemma library's structural insight shaped the two-branch design: the choice between Protect and Exploit is not tactical preference but a revelation of what kind of force the god believes in. Protect says force should defend the vulnerable. Exploit says force should serve the god's strategic interests. Both are coherent philosophies of Iron-reach interference.

### Variety References

**Ordeal Archetype: Trial by Combat** -- The structural DNA. The ambush is already combat in progress; the god's intervention shapes which combatants are strengthened, which are broken, and what the violence means. The ordeal archetype's note that "the trial reveals character" applies: the god's choice reveals whether divine force is protective or acquisitive.

**Ordeal Archetype: Defense of the Innocent** -- Shapes the Protect branch specifically. The merchant and her caravan crew are civilians caught in violence they did not start. The archetype's tension: "innocence is relative, and the defender must decide what they are really defending" -- the merchant's goods? Her life? The principle that safe trade roads should be safe? Each interpretation of "defense" implies a different kind of Iron-reach intervention.

**Event Archetype: Ambush** -- Structural urgency. The encounter is compressed in time: the violence is happening now, the god must decide quickly, and the consequences radiate outward immediately. The archetype's note that "ambushes reveal what people do when planning fails" applies to the bandits, whose plan is already fraying -- the caravan had more guards than expected.

### What the Inspiration Actually Changed

Without the Thematic Pillars' Sovereignty vs. Consumption framing, the bandits would be generic highway robbers. The consumption lens gives them a history: they are the waste product of a military economy that used them and threw them out. Without the Dilemma Library's Justice vs. Mercy axis, the Protect branch would be a simple "save the merchant" action. The axiological framing pushes the Protect branch to ask: what are you defending, and at what cost to the bandits who are also suffering? Without the Anti-Patterns guard against the Dark Lord Problem, the encounter would collapse into a satisfying smite-the-evil scene. The anti-pattern forces the bandits to remain human.

---

## 2. Scale Justification

**Short** is correct. The stakes are immediate and local: a single caravan, a band of desperate former soldiers, a stretch of road. No faction-wide consequences. No regional political shifts. The encounter resolves in the time it takes for a fight to end or not end. One or two beats is sufficient: the god perceives the violence and decides how to shape it. The reward weight is modest -- a merchant's gratitude or a bandit captain's grudging respect, not a kingdom's future. This is world texture: the kind of encounter that makes a trade road feel alive and gives the god a moment of specific, physical authority over mortal violence.

---

## 3. Pressure Knot

The ambush is already underway when the god's attention falls on this stretch of road. Six former soldiers have blocked the road with a felled oak and taken positions in the ditches on either side. Their tabards are faded past recognition -- former company men, now road men. The merchant caravan is three wagons long. The lead driver took a crossbow bolt through the shoulder in the first volley and is slumped against the footboard, the reins wrapped around his good hand. Two caravan guards are fighting from behind the second wagon, swords drawn, doing competent work but outnumbered. The merchant herself -- a woman named Soraya Kelk, mid-fifties, who has been running goods along this road for twenty years -- is crouched in the third wagon with a hand-axe she clearly knows how to use and a face that says she has survived worse than this but is not sure about today.

The bandit captain is a man named Dragan Halfmast. He lost three fingers on his shield hand in the border war and the stumps have healed into white puckered knots that curl the remaining fingers inward, a hand that can hold a shield rim but nothing else. He is shouting at his people to take the goods and get clear, but one of his soldiers -- younger, angrier, less disciplined -- is pressing toward the lead wagon where the wounded driver is trying to stand. Dragan can see this is about to become a killing instead of a robbery, and the god can read on his face that he does not want that. But he also cannot afford to show weakness in front of the only people who still follow him.

The road's waymarker stones stand on either side of the ambush like silent witnesses. One of them has been knocked over -- not by the bandits, but by weather and neglect seasons ago. Nobody maintains them anymore. The road is not what it was.

---

## 4. Intervention Fantasy

The player-god sees violence in progress and feels the tug of Iron-reach authority: the power to shape combat, to strengthen or break the will of fighters, to turn a blade or steady a hand. The intervention fantasy is **the god reaching into a moment of physical crisis and deciding what force means here**. Not abstractly, not from a distance -- the god is present in the dust and the shouting and the blood on the lead driver's shoulder.

The compelling element is immediacy. This is not a negotiation or a slow political pressure. This is Iron: the reach of force, combat, physical will. The god can feel the crossbow quarrel that has not been fired yet, the sword-edge that is about to meet flesh, the bandit captain's grip tightening on his weapon because he knows he has lost control of the situation. The god chooses where the weight falls. Every raised blade on this road is waiting for permission to land.

---

## 5. Cast and World Objects

### Primary NPCs
- **Soraya Kelk** -- merchant, mid-fifties, runs goods along this trade route. Practical, experienced, and currently terrified in a controlled way. Gold Reach (commerce), Iron Reach (survival instinct). She has a hand-axe and the willingness to use it.
- **Dragan Halfmast** -- bandit captain, former militia sergeant. Three missing fingers, badly healed. He is commanding a robbery that is sliding toward murder, and he does not want it to slide. Iron Reach (military discipline, eroding), Heart Reach (vestigial loyalty to his soldiers).

### Supporting NPCs
- **The angry soldier** (unnamed) -- one of Dragan's people, the one pressing toward the wounded driver. Younger, more violent, the one who will make this a killing if no one intervenes.
- **The lead driver** -- Soraya's lead teamster. Crossbow bolt in the shoulder. Trying to stay upright. If he dies, the caravan is stranded.
- **Two caravan guards** -- professional hires. Fighting competently, outnumbered, holding position but not winning.

### Factions and Communities
- **The trade road** -- not a faction, but a network. Soraya's caravan is part of a merchant ecosystem that depends on this route being safe. Violence here damages that ecosystem.
- **Dragan's band** -- six former soldiers from a disbanded militia company. Not a true faction; a desperate remnant.

### Required Places and Sublocations
- **The trade road** -- the primary location. Packed earth, cart ruts, waymarker stones. A felled oak blocking the road.
- **The ditch** -- where the bandits have taken position. Cover and concealment.
- **The wagons** -- three of them, arranged in a line. The fight is happening around and between them.

### Reward Objects, Burdens, and Attachments
- **Reputation: trade road safety** -- a local reputation channel. How the crisis resolves affects whether merchants consider this route viable.
- **Potential ally: Soraya Kelk** -- if the merchant survives with her goods intact, she becomes a trade contact. She knows every settlement along this road.
- **Potential grudging respect: Dragan Halfmast** -- if the god handles the situation in a way that lets Dragan keep his dignity, a thread of obligation forms. A bandit captain who owes a god is a future story hook.
- **Burden: blood on the road** -- if the encounter ends in death (bandit or merchant side), the road carries that memory. Future encounters on this road may reference the violence.

### Reputation and Social-State Channels
- **Trade road reputation** -- how merchants and travelers perceive the safety of this route.
- **Merchant disposition** -- Soraya's personal gratitude or resentment toward the god.
- **Bandit captain disposition** -- Dragan's awareness that a divine force shaped his worst day.

---

## 6. Beat Structure

### Beat 1 (Step 0): The God Perceives the Violence
**Scene:** The god's attention arrives at the ambush already in progress. The crossbow bolt is already in the driver's shoulder. The caravan guards are already fighting. The bandit captain is already losing control of his youngest soldier. The god reads the threads of the situation -- the fear, the desperation, the thin line between robbery and murder -- and decides how to intervene.

**Player action:** Branch-selection. The god chooses between Protect and Exploit.

### Beat 2 (Step 1): The Intervention
**Scene (Branch A -- Shield the Road):** The god pours Iron-reach force into the defense of the caravan. The guards' blades find their marks. The wounded driver's hand steadies on the reins. The young soldier pressing forward stumbles -- a stone turns under his foot, a root catches his ankle, divine attention focused into a moment of physical mischance. The tide of the ambush turns. Dragan Halfmast reads the shift and knows he has lost. What happens next depends on the outcome roll: does the defense hold cleanly, or does it cost something?

**Scene (Branch B -- Turn the Chaos):** The god does not defend the caravan. The god uses the chaos. Iron-reach force flows into the situation not to protect but to reshape it: the god tips the balance just enough to force both sides into a position where neither can win cleanly. The fight stalls. In that manufactured pause, the god's agent -- or the god's direct influence -- extracts value from the wreckage. A crate falls from a wagon and cracks open, revealing goods the god's favored agent could use. Or the god whispers into Dragan's exhausted mind: *you could serve something larger than this road*. The exploitation is not cruelty -- it is the god treating mortal violence as raw material for divine strategy.

---

## 7. Branching Profile

- **Branch depth:** `light`
- **Branch count:** `2`
- **Where branching lives:**
  - `scene prose` -- Beat 2 is entirely different depending on the choice
  - `cast emphasis` -- Branch A centers Soraya and the caravan defense; Branch B centers Dragan and the god's strategic calculus
  - `outcome ladder` -- different success/failure textures per branch
  - `aftermath` -- different reputation consequences, different relationship threads
- **Convergence policy:** `stays divergent through aftermath`
- **Primary branching template:** **Protect / Exploit / Abandon** (template #5 from encounter-branching-templates.md) -- the vulnerable caravan can be defended or used. Per scale guidance for short encounters: two branches (Protect + Exploit), not all three. Abandon is deliberately omitted not because it is invalid but because at short scale, two sharp branches serve better than three where one would be thin.
- **Why not Abandon as a branch:** The checklist warns that Abandon must not be framed as a non-choice. At short scale, making Abandon a genuinely seductive third option -- a principled divine distance that carries its own weight and consequence -- would require more beats and aftermath space than the encounter justifies. Two strong branches over three uneven ones.

### Why These Templates

Protect / Exploit is the natural grammar: a vulnerable group under attack can be shielded or harvested. The template ensures the branches reveal divine character (what kind of force does this god believe in?) rather than tactical preference. The encounter's Iron-reach constraint makes this template especially sharp: both branches are expressions of force, but force in service of protection feels fundamentally different from force in service of acquisition.

---

## 8. Branching Map

### Choice at Step 0 -> What Changes in Step 1

**If Branch A (Shield the Road):**
- Step 1 scene prose: The god strengthens the defenders. The ambush turns. Dragan recognizes the shift and decides whether to fight or withdraw.
- Step 1 cast emphasis: Soraya and her guards are central. The driver's survival is the emotional anchor.
- Step 1 difficulty: Iron Reach (combat shaping), moderate difficulty. The god is working with the existing combatants, not fighting alone.
- Step 1 reach: Iron.

**If Branch B (Turn the Chaos):**
- Step 1 scene prose: The god manipulates the stalemate. Neither side wins cleanly. The god extracts strategic value from the manufactured pause.
- Step 1 cast emphasis: Dragan is central. His exhaustion and desperation make him susceptible to divine influence.
- Step 1 difficulty: Iron Reach (force manipulation), slightly lower immediate difficulty but the risk is different -- exploitation can backfire if the manufactured pause collapses.
- Step 1 reach: Iron.

### Choice at Step 0 -> What Changes in Aftermath

**If Branch A:**
- Soraya's gratitude is the primary aftermath thread. She becomes a trade contact.
- Dragan retreats with his people, diminished. He remembers that a divine force intervened against him. Future encounters with Dragan carry resentment.
- The road is safer, at least for now. Trade reputation improves.
- The wounded driver survives (outcome-dependent).

**If Branch B:**
- The god gains something: a crate of valuable goods, a potential recruit in Dragan, or strategic intelligence about the road's vulnerabilities.
- Soraya survives but is shaken. She was not protected; she was used as a prop in a divine game. Her disposition toward the god is wary, not grateful.
- Dragan is either recruited (grudging, unstable) or scattered along with his band.
- The road's safety is ambiguous -- the violence ended, but not because someone defended the road.

---

## 9. Outcome Ladder

### Branch A: Shield the Road

**Critical Success:** The god's intervention is precise and overwhelming. The caravan guards rally, the young soldier is disarmed without bloodshed, and Dragan Halfmast surrenders rather than let his people die for a robbery gone wrong. The driver's wound is serious but he will recover. Soraya Kelk is fiercely grateful -- she offers the god's favored agent free passage and trade access along the entire road. Dragan's band is scattered but alive. The waymarker stones caught the afternoon light the way they always had. The road did not know it had been defended. It did not need to.

**Success:** The ambush breaks. Two of Dragan's soldiers are wounded, one badly. Dragan withdraws with the rest. The driver survives with medical attention. Soraya is grateful and offers a future trade favor. The road is safe today. Modest reputation improvement along the trade route.

**Success at Cost:** The defense holds but the young soldier kills the lead driver before the tide turns. Soraya's caravan is saved but her best teamster is dead. She is grateful to the god but the gratitude is shadowed by loss. Dragan's band escapes. The road is quiet but the cost is visible -- a body under a canvas in the third wagon.

**Failure:** The god's intervention is too late or too weak. The caravan guards are overwhelmed. The bandits take most of the goods. Soraya survives but is wounded and furious -- not at the god, but at the road, the world, the system that failed her. The driver dies. Dragan's band disappears into the woods with their haul, and the young soldier has blood on his hands now. Trade reputation along this road drops.

**Critical Failure:** The god's intervention destabilizes the fight catastrophically. The manufactured advantage collapses into general violence. A guard dies. The young soldier kills the driver. Soraya takes a wound that will scar. Dragan's band scatters but two of them are dead, and the survivors remember that something divine touched this fight and made it worse. The road is stained. Trade traffic will avoid this stretch for a season.

### Branch B: Turn the Chaos

**Critical Success:** The manufactured stalemate works perfectly. Both sides exhaust themselves. In the pause, the god extracts maximum value: Dragan, broken and desperate, accepts a thread of divine obligation -- not servitude, but the awareness that he owes something to a power he cannot name. The crate of spilled goods contains something genuinely useful. Soraya's caravan limps away mostly intact, and while the merchant is unsettled, she is alive. The god walks away with a new asset and a road that is no more dangerous than it was before.

**Success:** The stalemate holds. The god extracts a useful object or piece of intelligence from the chaos. Dragan retreats, diminished but with a faint thread of divine attention clinging to him. Soraya is alive and her goods are mostly intact. She is wary of what happened -- the fight ended too neatly, too conveniently -- but she cannot prove anything. Modest gain for the god, modest cost to no one in particular.

**Success at Cost:** The exploitation works but the stalemate frays at the edges. The driver dies -- not from the initial bolt, but from neglect, because the god was focused on the strategic extraction and not the defense. Soraya survives but her trust in divine benevolence is damaged. The god gets what they wanted but the moral residue is visible: someone died while the god was busy harvesting.

**Failure:** The manufactured pause collapses. The fight resumes, worse than before, because both sides are angry and confused about why it stopped. The god's extraction fails -- the crate is trampled, Dragan rejects the divine whisper with a snarl, and the chaos reasserts itself without divine direction. The god gains nothing. The caravan takes heavy losses. Soraya is furious.

**Critical Failure:** The exploitation is visible. Dragan or Soraya perceives the divine manipulation -- not the full truth, but enough to know that the god was not trying to help anyone. Dragan's fury is personal: he was already being used by his lord, and now a god is trying the same trick. Soraya is disgusted. Both parties leave the road with the knowledge that divine attention is not the same as divine protection, and they will tell others. The god gains nothing and loses reputation along the entire trade route.

---

## 10. Sample Opening Paragraph

The god smelled the ambush before seeing it -- iron in the air, the sharp tang of a crossbow string recently released, and beneath that the sour-sweet stink of fear sweat from too many bodies in a confined space. The trade road bent around a stand of birches whose bark was peeling in long pale strips, and past the bend the road was blocked. A felled oak, its cut face still pale where the axe had bitten, lay across the packed earth between two waymarker stones that had been carved before anyone alive could remember. The stones were mossy, the runes worn to suggestions. The oak was fresh.

Three wagons had stopped hard, the lead horses stamping and wide-eyed, their driver slumped sideways on the bench with a crossbow bolt standing from his left shoulder like a crude pennant. Blood had soaked through his coat and was dripping onto the footboard in a rhythm that would not last. Behind the second wagon, two guards fought from cover -- swords out, movements professional, economy of motion that said they had done this before but not against this many. Six figures in the ditches on either side, wearing tabards so faded that the insignia was only a memory in thread. Former soldiers. Their stances said discipline; their faces said hunger.

A woman crouched in the bed of the third wagon, her hand white-knuckled around a short axe, watching the fight with the expression of someone calculating odds she did not like. Soraya Kelk had run goods along this road since before the border war, and she knew what an ambush looked like when it was going badly for the ambushers -- but also what it looked like when a robbery was about to become something worse. Near the lead wagon, the youngest of the attackers was advancing on the wounded driver with a short sword held wrong, the grip of someone who had learned to kill but not to fight, and his captain -- a thick man with a maimed hand and a voice going hoarse from shouting -- was trying to call him back without admitting that calling him back was a retreat.

The threads pulled tight in the dust and the shouting and the slow drip from the driver's shoulder. The god's attention settled on the road like a hand on a blade's edge.

---

## 11. Approach Cards Per Step

### Step 0: Branch Selection (The God Perceives the Violence)

**Card A -- "Shield the Road"**

*The god's attention sharpens along the line of defense -- the two guards behind the second wagon, the driver clinging to the reins, the merchant with her axe. These are the threads worth strengthening. Iron-reach force flows outward not as wrath but as reinforcement: a guard's blade finds the angle it was searching for, the driver's hand steadies despite the pain, a stone shifts under an attacker's boot at the worst possible moment. The god chooses to be the reason the road holds.*

- **Reach:** Iron
- **Intent:** Defend the caravan. Strengthen the existing defenders. Turn the ambush back.
- **Cost:** The god's essence, spent on mortal protection. The bandits are defeated but not addressed -- their desperation remains, pushed down the road to someone else.
- **Risk:** If the intervention is clumsy, the amplified defense becomes amplified violence. The line between shielding and smiting is a matter of precision, and Iron reach does not always allow for nuance.
- **Intervention type:** Direct combat shaping.

**Card B -- "Turn the Chaos"**

*The god sees the ambush not as a crisis to solve but as a knot of force that can be redirected. Both sides are committed, exhausted, and too far in to think clearly. The god's Iron-reach attention does not strengthen either side -- it freezes them both, a subtle thickening of the air, a weight on every raised arm, a pause manufactured from divine pressure. In that pause, the god's real work begins: reading what can be extracted from the wreckage. A crate spills. A desperate captain's mind cracks open to suggestion. The violence is not ended -- it is harvested.*

- **Reach:** Iron
- **Intent:** Exploit the chaos for strategic gain. Extract value from the violence without committing to either side.
- **Cost:** The god's essence, spent on manipulation rather than mercy. The driver may die because the god chose to harvest instead of heal. The moral residue is real.
- **Risk:** The manufactured pause is fragile. If it collapses, the fight resumes worse than before, and both sides may perceive the manipulation. A god caught exploiting mortals earns a specific kind of enmity.
- **Intervention type:** Force manipulation, strategic extraction.

### Step 1: Branch Resolution

#### Branch A -- Shield the Road (Step 1 Approach Cards)

**Card A1 -- "Steady the Line"**

*The god works through the existing defenders -- no miracles, no divine lightning, just the subtle weight of Iron attention making every movement a fraction more precise. The guard's parry catches the blade at the perfect angle. The driver wraps the reins tighter around his good hand and does not fall. The god is a presence in the muscle memory of people who know how to fight, making them a little better than they are. Dragan Halfmast will feel his people faltering and know, without understanding why, that today is not his day.*

- **Reach:** Iron
- **Intent:** Subtle reinforcement. Win through the defenders' existing skill, amplified.
- **Cost:** Lower essence cost. The intervention is light-touch and sustainable.
- **Risk:** The subtle approach may not be enough. If the young soldier reaches the driver before the tide turns, light-touch fails and the god must escalate or accept the loss.

**Card A2 -- "Break Their Nerve"**

*The god strikes at the attackers' cohesion. Not their bodies -- their will. Iron-reach force presses against the bandits' discipline like a cold wind: the footing feels treacherous, the shadows between the wagons seem to move wrong, the awareness that something larger than a merchant's guard is watching settles into their bones. The youngest soldier's advance falters. Dragan's shouts grow desperate. The god does not hurt them -- the god makes them believe they have already lost.*

- **Reach:** Iron
- **Intent:** Psychological force. Break the ambush by breaking the attackers' morale.
- **Cost:** Higher essence cost. The god is projecting force across all six attackers simultaneously.
- **Risk:** If the morale break is too sudden, panic replaces discipline. Panicked soldiers with weapons are more dangerous than disciplined ones. The youngest might lash out instead of retreat.

#### Branch B -- Turn the Chaos (Step 1 Approach Cards)

**Card B1 -- "Seize the Spoils"**

*The manufactured pause holds. In the stillness, the god's attention finds what can be taken: a crate cracked open in the scuffle, its contents spilled across the road. Goods the merchant was carrying -- salt, medicine, a bundle of sealed letters -- now lie in the dust between the felled oak and the waymarker stones. The god guides a favored agent's hand, or tips a crate's balance, or simply ensures that what falls falls where it can be gathered. The violence pauses. The god shops.*

- **Reach:** Iron
- **Intent:** Material extraction. Take goods from the chaos without fighting for them.
- **Cost:** Low essence cost but high moral cost. The driver is still bleeding. Soraya is still afraid. The god is picking through the wreckage while mortals suffer.
- **Risk:** If the pause collapses while the god's attention is on the goods, the resuming fight may destroy what was being taken. The extraction is only as stable as the stalemate.

**Card B2 -- "Bend the Captain"**

*The god reaches into Dragan Halfmast's exhausted mind -- not a command, not even a suggestion, but a widening of the man's awareness. The god lets Dragan see, for one clear instant, how small this robbery is. How little the contents of three wagons will buy. How many more ambushes lie ahead before the cold sets in. And then, beneath that despair, a thread: the awareness that something is watching, something that could offer a purpose larger than surviving until next week. The god does not recruit Dragan. The god opens the door and lets Dragan's own desperation walk him through it.*

- **Reach:** Iron
- **Intent:** Strategic recruitment. Convert the bandit captain into an asset through manufactured vulnerability.
- **Cost:** Higher essence cost. The god is doing fine psychic work under combat conditions. The moral cost is also higher -- this is manipulation of a desperate man at his lowest point.
- **Risk:** Dragan is a soldier. Soldiers know when they are being worked. If he perceives the manipulation, his reaction will be violent and personal. A bandit captain who hates a god is a more dangerous enemy than one who simply robs merchants.

---

## 12. Branch-Dependent Later Paragraph(s)

### Branch A -- Shield the Road (Step 1 resolution)

The shift was not dramatic -- no thunder, no blazing light, nothing the ballads would bother recording. The guard behind the second wagon found her footing on the packed earth as if the road itself had steadied under her, and her next strike caught the nearest attacker across the forearm with the clean efficiency of a cut made without hesitation. The second guard pressed forward. The lead driver, who should not have been able to stand, wrapped the reins around the brake lever and reached for the cargo hook behind his seat with his good hand -- not to fight, but to brace himself, to stay upright, to be present in the moment where survival required nothing more than not falling.

Dragan Halfmast saw it turn. He had commanded enough fights to know when the geometry of violence stops favoring you -- when the ground, the timing, the invisible weight of the fight tilts away from your side and every swing costs more than it earns. He shouted at the young soldier, a name swallowed by the distance, and the shout had the particular desperation of authority that knows it is about to be ignored or obeyed for the last time. The young man looked back. The wounded driver was still alive on the bench above him, blood dripping, hand wrapped white around the brake. The moment stretched. Then the young soldier lowered his sword -- not surrender, not exactly, but the body's recognition that whatever had been possible thirty seconds ago was no longer possible now.

The bandits withdrew into the ditch, into the birches, into the country that had made them. Dragan was the last to go. He looked back once, at the road, the wagons, the waymarker stones, with the expression of a man who had just learned something about the shape of the world that he did not yet have words for.

### Branch B -- Turn the Chaos (Step 1 resolution)

The pause settled over the road like a held breath. Not silence -- the horses still stamped, the wounded driver still groaned on the bench, the birch leaves still rattled in the wind that came off the ridge -- but a thickening, a weight in the air that pressed against every raised arm and clenched jaw. The two guards behind the second wagon felt it and stopped pressing forward, confused by their own hesitation. The bandits in the ditch felt it and held position, weapons up, unable to explain why they were not advancing. The young soldier near the lead wagon stood with his sword at his side, breathing hard, staring at the wounded driver as if he had forgotten what he had been about to do.

In that manufactured stillness, the god's attention was elsewhere. A crate in the second wagon had cracked during the first volley -- the crossbow bolt that missed the driver had struck the slat boards and split them. The contents had shifted. Sealed letters, a merchant's ledger, and a small case of something that weighed more than its size suggested: medicinal preparations, expensive ones, the kind that moved between capital cities and never appeared on a village market table. The god did not take them. The god ensured they were visible, accessible, retrievable -- arranged by coincidence in the dust beside a waymarker stone, as if the road itself had offered them up.

Dragan Halfmast stood in the ditch with his maimed hand pressed against the earth and his good hand around his sword, and he felt the weight of the pause like a question he could not articulate. Something was watching. Something had stopped the fight, and it was not mercy and it was not fear. It was attention -- vast, patient, interested. He looked up at the sky, which was ordinary. He looked down at his hands, which were shaking. And somewhere behind the exhaustion and the hunger and the knowledge that this road had nothing left to give him, a door opened that had not been there before.

---

## 13. Aftermath Paragraph

### Branch A Aftermath

The caravan reformed slowly, the way hurt things reconstitute when the threat passes. Soraya Kelk climbed down from the third wagon and walked to the front of the line, stepping over the felled oak without looking at it, and knelt beside her driver. The bolt was deep but clean -- the bone was intact, the joint still moved, and the bleeding had slowed to a seep that said survival rather than crisis. She pressed a folded cloth against the wound and told him to hold it there and not to be brave about the pain. Then she stood and looked down the road where the bandits had disappeared, and her face held the particular expression of someone who had been afraid and was now angry and did not yet know which feeling would win.

The waymarker stones stood in the afternoon light with the patience of objects that have outlasted every ambush, every war, every season of neglect. The road was quiet. A split sack of grain leaked a thin trail of barley into the wheel ruts, and sparrows were already landing to feed. The violence was over. What it had meant -- whether the road was safer now or only empty -- remained an open question that the settlements on either end of this stretch would answer in the coming weeks by whether they sent their wagons or kept them home.

### Branch B Aftermath

The fight did not end so much as evaporate. The bandits withdrew without a signal anyone could name, and the caravan guards lowered their swords with the bewildered caution of people who had been winning a fight that suddenly stopped mattering. Soraya Kelk climbed down from the third wagon and surveyed the damage: the driver wounded, a crate broken open, goods scattered in the dust. She picked up a sealed letter from the road, brushed the dirt from it, and tucked it into her coat with the efficiency of a woman who had been losing things on this road for twenty years and had stopped mourning each one.

Dragan Halfmast's band was gone. Not scattered the way a broken ambush scatters -- there had been no rout, no panic, just a withdrawal as if they had all remembered somewhere else they needed to be. The waymarker stones stood in their places, indifferent as milestones always are. The thread the god had planted in a broken soldier's mind was lighter than spider-silk and stronger than anything on that road.

---

## 14. Aftermath Reaction Choices

### Branch A Reactions

**"Let the road carry it forward."**
The god steps back and lets the caravan's survival speak for itself. Merchants will hear that the ambush failed. Trade traffic may recover. The god is remembered as a distant protector -- felt but not claimed. The road heals on its own schedule.
*Future thread preserved: trade route recovery as a community process. Future thread released: personal relationship with Soraya.*

**"Mark the merchant for favor."**
The god maintains a thread of connection to Soraya Kelk. Her gratitude deepens into something more structured: she becomes a mortal agent of divine commerce, her routes carrying not just goods but the god's awareness along the road. The trade network becomes a sensory network. Soraya grows more capable, and more entangled.
*Future thread preserved: merchant as ongoing mortal thread, trade intelligence. Future thread released: road's organic recovery.*

### Branch B Reactions

**"Let the thread go slack."**
The god releases the connection to Dragan Halfmast. The bandit captain walks away with nothing but exhaustion and a memory he cannot explain. What he does next is his own. The god accepts that not every exploitation needs to be followed through -- some investments are not worth the maintenance.
*Future thread preserved: the extracted goods/intelligence as a one-time gain. Future thread released: Dragan as a future asset.*

**"Keep the line taut."**
The god maintains the thread of attention on Dragan. Not a summons, not a command, but a persistent divine awareness that will find him again when circumstances align. The bandit captain becomes a watched figure -- his movements, his decisions, his slow descent or unlikely recovery all visible to a god who decided he was worth watching.
*Future thread preserved: Dragan as a potential long-term asset or narrative thread. Future thread released: clean closure.*

---

## 15. Aftermath Kit Summary

### Branch A: Visible Changes
- **Soraya Kelk**: alive, grateful. Disposition toward the god: positive and specific. Mark: *merchant who survived because the road held*. Potential trade contact along the route.
- **Lead driver**: wounded but surviving (outcome-dependent). The scar is a story the caravan will tell.
- **Dragan Halfmast**: retreated, diminished. Disposition toward the god: wary resentment. He knows something intervened, though he cannot name it. Attachment: *bandit captain who lost to something he could not see*.
- **Trade road**: modest safety reputation improvement. The ambush failed. The road works.
- **The band**: scattered. Future encounters with displaced former soldiers along this road may reference Dragan's failed ambush.

### Branch B: Visible Changes
- **Soraya Kelk**: alive, unsettled. Disposition toward the god: wary, not grateful. She survived but was not protected. She will trade along this road again but trust is not part of the transaction. Mark: *merchant who witnessed something she cannot explain*.
- **Lead driver**: wounded. His survival depended on whether the god's attention was on the defense or the extraction. (Outcome-dependent -- success at cost or worse means the driver died of neglect.)
- **Dragan Halfmast**: withdrawn with a thread of divine attention. Disposition: confused, vulnerable, susceptible. Mark: *former soldier touched by something larger*. Attachment: *potential divine asset, unformed*.
- **Extracted goods**: one-time material gain (medicinal supplies, merchant intelligence, or sealed correspondence -- outcome-dependent).
- **Trade road**: no reputation change. The ambush ended but not because anyone defended the road. Merchants will not feel safer.

---

## 16. Support Bundle Contract

| Support Object | Delivery Mode | Source | Persistence Contract | Future References | Status |
|---|---|---|---|---|---|
| Soraya Kelk (merchant NPC) | `lazy-materialize-on-trigger` | NPC generation -- check for existing merchant NPC at target trade road/settlement first; create only if no suitable merchant exists | `must-persist` -- becomes trade contact or wary acquaintance | Future trade encounters, merchant network hooks, commerce reputation | `author-now` |
| Dragan Halfmast (bandit captain NPC) | `lazy-materialize-on-trigger` | Encounter bundle -- created as bandit leader; check for existing displaced-soldier NPC in area first | `must-persist` -- becomes resentful enemy (Branch A) or potential divine asset (Branch B) | Future bandit encounters, recruitment hooks, road safety narrative | `author-now` |
| Lead driver (supporting NPC) | `lazy-materialize-on-trigger` | Encounter bundle -- created as Soraya's teamster | `must-persist` (implementation note: commit to must-persist at author time; conditional persistence is not expressible in EncounterSupportActorSpec) | Caravan encounters, road memory | `author-now` |
| Trade road (location) | `pre-seeded` | Location generation -- trade roads between settlements | `must-persist` | All trade/travel encounters on this route | `live` |
| Waymarker stones (flavor) | N/A -- prose atmosphere only | Encounter prose -- atmospheric detail | N/A | Referenced in future road encounters for continuity | N/A (no spec needed) |
| Trade road safety (reputation channel) | N/A -- GraphOp on outcomes | Existing reputation system -- route-level safety | `must-persist` | Merchant decision-making, travel encounters | `live` (no spec needed) |
| Extracted goods (Branch B only) | `lazy-materialize-on-trigger` | Encounter bundle -- single canonical spec (recommend sealed correspondence); content variance expressed in aftermath reactions | `must-persist` if intelligence/letters | Depends on content: letters seed future information hooks, medicine is consumed | `author-now` |

---

## 17. Self-Audit

### Against Encounter Building Checklist Definition of Done

- [x] Inspiration anchors declared (Tonal Bible, Thematic Pillars, Anti-Patterns, Dilemma Library, three archetypes)
- [x] Encounter scale declared (short)
- [x] Encounter packet complete (all required sections present)
- [x] Branching map exists (Step 0 choice -> Step 1 scene changes -> Aftermath changes)
- [x] Branching profile declared (light, 2 branches, Protect/Exploit from template #5)
- [x] Branching template choice declared with rationale
- [x] Prose meets scene-quality bar (opening paragraph is fiction with sensory detail and cadence, not dashboard)
- [x] Approach cards at EVERY step: Step 0 has 2 branch-selection cards with full prose bodies; Step 1 has 2 approach cards per branch (4 total), all with prose bodies, costs, and risks
- [x] Editorial review: PASS WITH REVISIONS -- revisions applied in this file
- [x] Outcome ladder authored with real forward pressure (five tiers per branch, each with named consequences and actor-centered outcomes)
- [x] Aftermath kit complete (visible changes, marks, dispositions, reaction choices with future thread explanations)
- [x] Support bundle contract: every non-trivial dependency classified with persistence and reuse rules
- [x] Every `lazy-materialize-on-trigger` object: has reuse/idempotence rule (check for existing before creating)
- [x] No `blocked-primitive` rows
- [x] Aftermath connects to NPCs (Soraya, Dragan, driver), places (trade road), reputation (route safety), and future hooks (merchant thread, bandit captain thread)
- [x] Aftermath presents consequence in curated, actor-centered way (named people with faces, not stat deltas)
- [x] Reaction choices explain what they imply in the world
- [x] Later steps materially reflect prior choices (Branch A and B have entirely different Step 1 prose, cast emphasis, and outcomes)
- [x] Encounter avoids relevant anti-patterns (Dark Lord Problem, Clean Moral Binaries, Player as Savior, Generic Fantasy Aesthetics)
- [x] Inspiration anchors materially changed the encounter's structure (documented in Section 1)
- [x] Choice set has real dilemma energy (protection vs. exploitation as competing philosophies of divine force)

### Branch Seduction Self-Check

**Branch A (Shield the Road):**
- Why would a god choose this? Because they believe that force should protect the vulnerable. Because watching a wounded driver stay upright and a merchant keep her nerve is worth the cost of intervention. Because the god wants the road to work -- trade, passage, the old promise carved into those waymarker stones.
- What fantasy of interference? The god as the invisible shield. Force used with precision and restraint, amplifying what mortals already possess rather than replacing it. The satisfaction of watching people survive because something unseen tilted the odds.
- What value does it protect? Safety. Commerce. The principle that roads should be safe for those who travel them. The driver's life. Soraya's livelihood.
- Without labels, does it feel distinct? Yes -- this is the path of defense, where the god's force flows into the existing fighters and the violence ends because the defenders were good enough, with help.

**Branch B (Turn the Chaos):**
- Why would a god choose this? Because they see the world as raw material. Because a god who has watched civilizations rise and fall knows that every crisis is also an opportunity, and that the difference between mercy and strategy is often a matter of timing. Because Dragan Halfmast -- broken, desperate, commanding six starving soldiers on a road that has nothing left to give him -- is more useful alive and obligated than scattered and forgotten.
- What fantasy of interference? The god as the hand that reshapes the board. Not cruelty -- efficiency. The seductive power of treating mortal suffering as information, mortal violence as leverage, mortal desperation as an opening. The god does not enjoy the driver's pain. The god simply has other priorities.
- What value does it protect? Strategic advantage. Future options. The god's own agency in a world that offers few clean choices. The possibility that Dragan, redirected, could be more than what he is now.
- Without labels, does it feel distinct? Yes -- this is the path of calculation, where the god's force creates a manufactured pause and harvests the wreckage while the mortals are too confused to notice.

Both branches passed all four questions. Neither is decorative. Neither is obviously correct.

---

## 18. Experience Differentiator Gate

### Scene and Prose
1. **Does the opening paragraph place the player inside a moment already in motion?** YES -- the ambush is underway, the driver is already wounded, the guards are already fighting, the bandit captain is already losing control. The player arrives into crisis, not preamble.
2. **Does the prose have its own voice?** YES -- sentence variety (short declaratives interspersed with longer sensory passages), specific physical detail (peeling birch bark, the driver's blood dripping onto the footboard, the waymarker runes worn to suggestions), and rhythmic structure (the final sentence's tension-gathering).
3. **Does the scene prose name the elements that become choices?** YES -- the line of defense (guards, driver, merchant) and the exploitable chaos (the manufactured vulnerability of both sides, Dragan's desperation, the spilled goods) are both present in the opening. The choice threads are visible.
4. **Would a reader feel something from the prose alone?** YES -- the driver's blood dripping in rhythm, the young soldier advancing with his sword held wrong, the bandit captain shouting a name swallowed by distance. The emotional weight exists before any mechanical choice.

### Choices and Intervention
5. **Does each approach card have its own prose paragraph?** YES -- all six approach cards (2 at Step 0, 2 per branch at Step 1) have full prose bodies describing the intervention from the god's perspective.
6. **Does each approach card narratively justify its cost?** YES -- Branch A's cost is the god's essence spent on mortal protection while the bandits' root cause remains unaddressed. Branch B's cost is the moral residue of exploitation -- someone may die while the god harvests. Both costs are woven into prose.
7. **Does each approach card include a narrative risk?** YES -- Branch A risks clumsy amplification turning defense into excessive violence. Branch B risks the manufactured stalemate collapsing and both sides perceiving the manipulation.
8. **Are the choice labels scene-specific?** YES -- "Shield the Road," "Turn the Chaos," "Steady the Line," "Break Their Nerve," "Seize the Spoils," "Bend the Captain" are specific to this encounter's physical setting and Iron-reach context.
9. **Do the choices feel like graduated options with different philosophies?** YES -- protection vs. exploitation at Step 0; subtle reinforcement vs. psychological force at Step 1A; material extraction vs. strategic recruitment at Step 1B. Each pair offers genuinely different divine postures.

### Aftermath and Consequence
10. **Does the aftermath have its own prose?** YES -- both branches have full aftermath paragraphs grounded in scene detail (sparrows on spilled grain, the thread of divine attention like a cobweb on a soldier's sleeve).
11. **Are consequence outcomes actor-centered?** YES -- every outcome names Soraya, Dragan, or the driver. No anonymous stat deltas.
12. **For medium+ scale: does the aftermath offer reaction choices?** N/A (short scale) -- but reaction choices are provided anyway, two per branch, each with clear future-thread explanations. This exceeds the short-scale minimum.
13. **Do aftermath reaction choices represent different philosophical stances?** YES -- Branch A: community recovery vs. divine patronage of the merchant. Branch B: releasing the asset vs. maintaining the thread.

### Presentation
14. **Does the Presentation Kit specify concept art?** YES -- see Section 19 below.

**All 14 gates: YES.** No revisions needed to pass the Experience Differentiator Gate.

---

## 19. Concept Art Direction

**Yes -- the encounter opening wants concept art.** Scene composition: a trade road in late afternoon light, dust still hanging in the air from recent violence. A felled oak across packed earth between two moss-covered waymarker stones. Three wagons in a ragged line, the lead one canted at an angle where the horses pulled sideways. Two figures with swords drawn behind the middle wagon, blades catching low sun. In the ditches on either side, the shapes of crouched figures in faded military tabards -- not monsters, not villains, just tired people with weapons. In the third wagon, a woman crouched with a hand-axe, watching.

**Palette:** Dust brown, iron gray, the faded rust-red of old military dye. The warm amber of late-afternoon light on packed earth. The pale green of birch bark peeling. A single bright point: the crossbow bolt standing from the driver's shoulder, its fletching dyed a faded yellow-green -- company colors that no longer mean anything.

**Mood:** Tension in stasis. The moment just after the first exchange and just before the second. Not the spectacle of battle but the ugly, compressed, human reality of violence on a road that was supposed to be safe.

**Threadbare aesthetic:** The road should feel worn -- ruts from cart wheels, cracked earth, the waymarker stones mossy and leaning. The bandits' tabards are frayed and faded. The wagons are working vehicles, not fantasy props: patched canvas, iron-banded wheels, cargo lashed down with rope that has been retied too many times. Nothing is new. Everything has been used before.

**Aspect ratio:** 16:9 landscape.
