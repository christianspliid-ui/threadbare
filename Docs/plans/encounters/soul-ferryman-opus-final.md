# Encounter Pipeline: Soul Ferryman
> Scale: short | Slug: soul-ferryman-opus | Pass: final
> Date: 2026-04-05 | Pipeline version: 1.0
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Model | Notes |
|------|---------|-------|-------|
| Draft | Complete | Opus | Strong prose, balanced branches, clean scale discipline |
| Editorial | PASS WITH REVISIONS | Opus | 3 should-fix revisions applied (community stakes, felt absence, simile variety) |
| Revision | Applied | Orchestrator | All 3 revisions applied mechanically |
| Systems | READY WITH CAVEATS | Sonnet | No missing primitives. 3 pre-implementation tasks (trivial-to-small scope) |

### Caveats (resolve during implementation)

1. **Ferryman NPC role** — `spawnNpcRole: 'ferryman'` does not exist in the NPC role taxonomy. Add `ferryman` as a role, or use `laborer`/`traveler` with named character overlay. Scope: trivial.

2. **River crossing sublocation type** — `river_crossing` sublocation type does not exist. Either add it to the concept art registry + verify generation at river hexes, or change to `lazy-materialize-on-trigger`. Scope: small.

3. **HiddenMarkCategory extension** — "Diminished" and "Unbound" marks need categories not in the current union (`betrayal | debt | secret_knowledge | concealed_action | forbidden_contact`). Recommended: add `'soul_diminishment'` and `'mystical_contract'` to the union. Scope: trivial (one-line type extension).

### Editorial Notes Summary

Three revisions were applied from the editorial pass:
- **REV-01:** Added Siltside hamlet and community stakes to the pressure knot — bonesetter, grain-trader, a community that has learned to live around the wound of the toll. Strengthens Branch B's pragmatic case.
- **REV-02:** Replaced the catalog of Diehl's lost memories (mother's face, sister's hand) with a moment of felt absence: "He stands for a moment as if expecting someone to be there. No one is."
- **REV-03:** Replaced the third hand-simile ("the way a hand moves across a page of text") with a needle-and-cloth simile to avoid pattern fatigue.

### Implementation File Map

| File | Action | Notes |
|------|--------|-------|
| `src/data/encounters/soul-ferryman.ts` | CREATE | Main encounter template — steps, branches, prose, support bundle, aftermath |
| `src/data/encounters/__tests__/soul-ferryman.test.ts` | CREATE | Structure tests, branch tests, aftermath tests |
| `src/data/unified-action-templates.ts` | MODIFY | Import + array entry (2 lines) |
| `src/types/unifiedAction.ts` | MODIFY | Add `'soul_diminishment' | 'mystical_contract'` to `HiddenMarkCategory` |

---

## Encounter Packet

*The following is the editorially-approved, revised encounter design.*

---

## 1. Inspiration Anchors

**Foundation references:**

- **Thematic Pillars** -- "Compassion vs. Power" is the primary axis. The ferryman's toll is not violence; it is a transaction, and the player must decide whether to intervene in an economy that preys on desperation. "Ascension vs. Humanity / Sovereignty vs. Consumption" is the secondary axis: the ferryman is a mortal who has become an instrument of something older than himself, and his bargain with the river is a small-scale mirror of the parasitic logic that ascendancy risks. His passengers lose something of themselves to cross; the question is whether that loss is exploitation or fair exchange in a world where nothing moves for free.
- **Anti-Patterns** -- Actively avoiding #1 (Dark Lord Problem): the ferryman is not evil. He is a man bound to a contract he made when he was younger and more desperate, and the river holds him to it. Avoiding #3 (Consequence-Free Magic): the soul-toll is real and textured -- passengers do not lose a game resource called "soul points," they lose a quality of selfhood that changes how they walk through the world afterward. Avoiding #9 (Clean Moral Binaries): stopping the ferryman means stranding everyone who needs to cross. The river has no bridge. The next ford is four days downstream. Avoiding #10 (Player as Savior): the ferryman has been operating for decades. Travelers have been paying his toll and surviving, diminished but alive. This is not a crisis the player rescues anyone from -- it is a condition the player decides whether to disturb.
- **Ordeal Archetypes -- "The Impossible Bargain"** -- The encounter draws from the Impossible Bargain archetype: every option costs something irreplaceable, the terms are honest, and the tension is cold clarity rather than dramatic confrontation.
- **Character Archetypes -- "The Wandering Scholar-Monster"** -- The ferryman draws from this archetype's core tension: ancient knowledge and isolation versus hunger for connection. He is monstrous in the way that long solitude in a liminal place makes anyone monstrous -- not through cruelty, but through the erosion of ordinary human reference points.

---

## 2. Scale Justification

This is a **short** encounter because it is a liminal moment, not a crisis. One intervention beat with two branches captures this cleanly. Inflating it to medium would dilute the encounter's real strength: its intimacy -- one ferryman, one passenger, one river, one god watching from the fog.

---

## 3. Pressure Knot

The river is called the Silt, or sometimes just the Grey, and nobody alive remembers which name came first. It runs through a notch between two limestone ridges where the fog collects every morning and does not burn off until midday, and some days it does not burn off at all. The only crossing for twenty miles is a flat-bottomed punt operated by a man named Vesik, who has poled travelers across this stretch of water for thirty-one years.

Vesik does not charge coin. He charges something else. When a traveler steps onto his punt, he looks at them with fog-pale eyes and names a quality -- courage, tenderness, the memory of a particular summer, the capacity to trust strangers -- and if they agree to pay it, he poles them across. When they step off on the far bank, the quality is gone. Not suppressed. Gone. They remember having it the way one remembers a room in a house that has burned down. The shape is there. The warmth is not.

He is not a sorcerer. He made a bargain with the river when he was twenty-three and drowning, and the river gave him back his life and the punt and the fog, and in return he collects. He does not keep what he takes. It goes into the current. He is a mechanism, not a thief. He knows this. It does not comfort him.

A hamlet called Siltside depends on the crossing -- a dozen families, a bonesetter who serves both banks, a twice-monthly grain barter that keeps the downstream farms fed through wet season. They pay the toll. They have always paid the toll. The bonesetter lost her sense of direction years ago and navigates by memory alone; the grain-trader cannot recall his wife's laugh but remembers the weight of every sack he has carried. The crossing is a wound the community has learned to live around.

Right now, a young courier named Diehl stands at the near bank with a satchel of sealed letters for a garrison commander on the far side. He has been standing there for an hour, listening to Vesik explain the toll. Diehl's horse will not board the punt; it smells the fog and refuses. The next ford is four days downstream, and the letters are expected tomorrow. Diehl is afraid, and he has not yet decided.

---

## 4. Intervention Fantasy

The player is a god looking down through fog at a transaction that is not quite wrong and not quite right. The fantasy is not rescue. It is judgment -- the quiet, enormous kind that gods exercise when they decide whether a thing in their world should continue. The god is not choosing between good and evil. The god is choosing what kind of world they are building.

---

## 5. Cast and World Objects

- **Vesik** -- ferryman, early fifties, gaunt, fog-bleached. Bound to the river by a drowning-bargain at twenty-three. Collects soul-qualities as toll; does not keep them.
- **Diehl** -- courier, early twenties. Carries sealed military correspondence. Standing at the near bank deciding whether to pay.
- **The Silt** -- fog-shrouded river, the real power in the encounter. Holds Vesik's contract.
- **Siltside** -- hamlet dependent on the crossing. Bonesetter, grain-trader, a dozen families.
- **The garrison** -- offscreen destination for Diehl's letters.

---

## 6. Beat Structure

**Beat 1 -- The Crossing (single beat)**

Two intervention paths:
- **Break the Bargain** -- sever the contract. Toll ends. Crossing closes. Vesik is unbound.
- **Steady the Courier** -- lend Diehl resolve. Crossing continues. Diehl loses a quality. Letters delivered.

---

## 7. Branching Profile

- Branch depth: `light` | Branch count: `2`
- Where branching lives: `choice set`, `outcome ladder`, `aftermath`
- Convergence: `stays divergent through aftermath`
- Template: `Bargain / Bind / Break` (#3)

---

## 8. Branching Map

| Branch | Scene Prose | Outcome Emphasis | Aftermath |
|--------|-------------|------------------|-----------|
| **Break the Bargain** | God reaches into fog, contract snaps, Vesik staggers, fog begins to thin | Vesik's fate, crossing closure, regional consequence | Crossing gone. Ford (4 days). Vesik alive but purposeless. Diehl whole but stranded. |
| **Steady the Courier** | God steadies Diehl's fear, he boards punt, Vesik names the toll | What Diehl loses, transaction cleanness, detection | Crossing persists. Diehl diminished. Letters delivered. |

---

## 9. Outcome Ladder

### Branch A: Break the Bargain

**Critical Success:** Contract dissolves cleanly. Vesik survives, weeps with relief. Fog thins. Bridge-planning seeded. Diehl whole, delivers via ford.

**Success:** Contract breaks roughly. Vesik disoriented. Fog persists days. Crossing closed. Diehl takes four-day detour.

**Success at Cost:** River resists. Fog surges. Vesik nearly reclaimed by current. Punt lost. Crossing violently closed. Region frightened.

**Failure:** God cannot find the contract. Fog swallows intervention. Nothing changes. Minor essence spent.

**Critical Failure:** River alerted. Contract tightens. Vesik goes flat-eyed, offers free passage in a voice not his own. Crossing becomes actively dangerous.

### Branch B: Steady the Courier

**Critical Success:** Precise touch. Diehl crosses with clarity. Toll: "Your certainty that you are doing the right thing." Diehl edited, not emptied. Letters on time.

**Success:** Blunt intervention. Diehl crosses in numb compliance. Toll: "Your ease with strangers." Functional but colder.

**Success at Cost:** Push too forceful. Vesik notices divine pressure, names steeper toll: "Your memory of being loved." Diehl stands on far bank as if expecting someone. No one is. He feels nothing, and does not understand why the nothing has a shape.

**Failure:** Touch doesn't reach. Fear reasserts. Diehl takes the four-day detour. Letters late. Whole but failed.

**Critical Failure:** Both Diehl and Vesik feel the intervention. Vesik names punitive toll: "Your name." Diehl crosses but cannot remember who he is. Wanders toward garrison with letters he cannot explain.

---

## 10. Sample Opening Paragraph

The fog sat on the river like a hand pressed over a mouth. It did not move. It did not thin toward the banks or gather in the hollows between the limestone ridges the way honest fog does; it simply occupied the crossing, grey-white and absolute, as if the air itself had opinions about who should pass. The punt was visible only as a shape -- flat-bottomed, dark-planked, riding low in the current with the stillness of something that had been waiting longer than wood should last. The man standing on it held a pole that was taller than he was, its end wrapped in river-weed that he had not cleaned because the weed was part of it now, part of him, part of the arrangement. He was thin in the way that fog-country people are thin, as if the damp had found its way into his joints and eaten whatever softness had once lived there. His name was Vesik. He had been the ferryman for thirty-one years, and in that time he had never once asked for coin. On the near bank, a young man in a courier's dustcoat stood beside a horse that would not stop pulling at its tether. The horse could smell the fog. The courier could smell it too -- river-silt and something older, something that made the teeth ache -- but he had letters to deliver and the ford was four days south, and so he stood at the waterline and listened to the ferryman explain, in a voice as flat and careful as a man reading terms he did not write, exactly what the crossing would cost.

---

## 11. Branch-Dependent Later Paragraphs

### Branch A: Break the Bargain

The god reached into the fog the way a hand reaches into still water -- slowly, and with the knowledge that whatever lives below will feel the disturbance. The contract was not visible. It was not a scroll or a chain or a mark on Vesik's skin. It was a pressure, a tautness in the space between the ferryman and the river, as if the current held one end of a rope and the man held the other and both had been pulling for so long that neither remembered a time before the tension. The god found the rope. The god cut it. Vesik made a sound that was not a word. He dropped the pole. It floated for a moment, trailing its river-weed like hair, and then the current took it and it was gone. The punt rocked. On the near bank, Diehl stepped back from the waterline, because the fog had moved for the first time in his memory -- not thinning, exactly, but shifting, as if the thing that held it in place had lost its grip. Vesik sat down heavily on the punt's wet planks and pressed his hands against his face, and when he lowered them his eyes were different. They were the eyes of a man who had just woken from a dream that lasted thirty-one years, and who could not yet tell whether waking was mercy or punishment.

### Branch B: Steady the Courier

The god leaned into the courier's fear the way wind leans into a candle -- not enough to extinguish, just enough to steady. Diehl felt it. He did not know what it was. He thought perhaps it was the memory of his father telling him that a man who stops walking has already decided to fail, or perhaps it was nothing more than the particular quality of light that sometimes breaks through fog and makes the world seem briefly navigable. He stepped onto the punt. The planks were wet and the wood was cold, and the punt sank a quarter-inch under his weight in a way that made him think of something settling into place. Vesik looked at him. The ferryman's fog-pale eyes moved across the courier's face the way a needle moves across cloth -- finding the weave, testing the tension -- and whatever he found there he accepted without expression. "Your certainty," Vesik said, "that you are doing the right thing." He said it the way a shopkeeper names a price -- without apology, without explanation, as a statement of what the transaction requires. Diehl opened his mouth to ask what that meant, and then closed it, because he already knew. He could feel it: the particular weight of conviction that had carried him through the last six days on the road, the private assurance that the letters mattered, that his errand was worth the saddle-ache and the cold mornings and the long miles. Vesik held out his hand. Diehl took it. And the ferryman poled them out into the fog, and the current took them, and the near bank disappeared behind them like a sentence left unfinished.

---

## 12. Aftermath Paragraphs

### Branch A: Break the Bargain

By the following morning the fog had thinned enough that the limestone ridges were visible from both banks, and travelers who had been crossing at this point for years stood at the waterline and stared at the empty river as if something had died. The punt had lodged in a mudbank downstream, half-submerged, its wood already greying in the open air as if thirty-one years of service were catching up to it all at once. Vesik was sitting on the near bank with his knees drawn up, watching the water. He had not spoken since the contract broke. Diehl had stayed with him through the night, though he could not have said why, and when morning came the courier left his horse tethered and walked downstream to the ford, carrying his satchel on foot, because the letters still needed delivering and some obligations do not dissolve when the fog does. The river ran clear and cold and ordinary, and whatever had lived in the contract between Vesik and the current was gone, and the crossing was gone with it, and the travelers who had paid their soul-tolls over thirty-one years would not get them back, because the river does not make refunds.

### Branch B: Steady the Courier

Diehl reached the far bank as the fog was thickening into its afternoon density, and when he stepped off the punt he stumbled -- not from the motion of the water, but from the sudden lightness of a man who has set down a weight he did not know he was carrying and discovered he needed it. Vesik poled back without a word. The punt disappeared into the fog, and the sound of the pole dipping into the water faded, and Diehl stood on the muddy bank with his satchel of letters and tried to remember why he had been so sure they mattered. They probably did. He would deliver them. He would do his job. He would continue being Diehl in every way that could be measured or observed. But the private engine that had driven him -- the felt conviction that his work meant something, that carrying messages between people who needed to speak to each other was a form of service worth the road -- was quiet now, and in its place was a space that was not empty but was no longer warm. He walked toward the garrison. The horse was still on the other side. Someone would bring it around eventually. Behind him, the fog closed over the crossing like a mouth.

---

## 13. Aftermath Reaction Choices

No reaction choices -- consequence is clean.

---

## 14. Aftermath Kit Summary

*Branch A (Break the Bargain):*
- The Silt crossing is closed. Travelers must use the downstream ford (four-day detour).
- Vesik: mark "Unbound Ferryman" — freed, disoriented, purposeless.
- Fog thins over following days.
- Diehl whole. Letters delivered late via ford.

*Branch B (Steady the Courier):*
- The Silt crossing persists. Toll continues.
- Diehl: mark "Diminished" — named soul-quality gone. Specific quality depends on outcome tier.
- Letters delivered on time.

---

## 15. Support Bundle Contract

| Support object | Delivery mode | Persistence | Future references | Status |
|---|---|---|---|---|
| Vesik (ferryman) | lazy-materialize-on-trigger | must-persist | River crossings, liminal bargains, unbound servants | author-now |
| Diehl (courier) | lazy-materialize-on-trigger | must-persist | Military correspondence, diminished agents | author-now |
| Silt crossing (sublocation) | lazy-materialize-on-trigger* | must-persist | All future crossing encounters, bridge-building hook | author-now |
| Fog atmosphere | pre-seeded | scene-only | Narrative color | live |
| "Diminished" mark | lazy-materialize-on-trigger | must-persist | Future Diehl encounters | author-now |
| "Unbound" mark | lazy-materialize-on-trigger | must-persist | Future Vesik encounters | author-now |
| Traveler reputation | pre-seeded | must-persist | Regional encounters | live |

*Changed from `pre-seeded` per systems audit — `river_crossing` sublocation type does not yet exist in world generation.

---

## 16. Concept Art Direction

**Subject:** Vesik standing on the punt in the fog, pole in hand, seen from the near bank at Diehl's eye level.
**Palette:** Grey-white fog, dark wet wood, limestone ochre at the edges.
**Mood:** Liminal, still, oppressive.
**Composition:** The ferryman is a vertical figure bisecting the frame. The punt sits low in grey water. Fog obscures the far bank entirely. On the near bank edge, the back of a courier's dustcoat and a restless horse suggest the viewer's position.
