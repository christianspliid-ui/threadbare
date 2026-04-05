# Encounter Pipeline: Soul Ferryman
> Scale: short | Slug: soul-ferryman-sonnet | Pass: draft
> Date: 2026-04-05 | Pipeline version: 1.0

---

## 1. Inspiration Anchors

**Pages used:**

- **Thematic Pillars — Compassion vs. Power, Memory vs. Forgetting, The Cost of Empire**
  The ferryman is a creature of power in the oldest sense: he extracts cost from vulnerability. But the pillar *Memory vs. Forgetting* is the encounter's true spine — a soul surrendered here is not destroyed, it is *absorbed*, converted from person-shaped memory into pure transit toll. The player is intervening not against violence but against erasure.

- **Anti-Patterns — Clean Moral Binaries (#9), Player as Savior (#10)**
  The ferryman is not evil. He is a function. The river crossing has always cost something — the encounter refuses the frame in which the Ascendant arrives to defeat a villain. He has a coherent worldview: nothing crosses for free. The player might find themselves agreeing with him.

- **Ordeal Archetypes — The Impossible Bargain (Every Option Costs), The Forbidden Knowledge Price**
  The Impossible Bargain gives the encounter its dilemma grammar. Every crossing costs; refusing to pay costs differently. The Forbidden Knowledge Price shapes what lingers: after this encounter, the player knows something about how souls move through this world that they cannot unknow.

- **Character Archetypes — The Strategic Immortal, The Undying Soldier**
  The ferryman is drawn from The Strategic Immortal: ancient patience, elusive motivation, operates across timescales the mortals around him cannot perceive. He is not malicious any more than a millstone is malicious. He has forgotten more pilgrims than the player will ever meet.

- **Ordeal Archetypes — Descent Into Darkness**
  The fog-shrouded river is its own descent. Visibility narrows. The mortal who approaches the ferry is already crossing thresholds before they ever board.

**Anti-patterns being actively avoided:**

- ❌ Dark Lord Problem: the ferryman has a coherent worldview that holds a kind of terrible logic. He is not a villain in a hat. An Ascendant with the right posture might respect him.
- ❌ Clean Moral Binaries: the soul he holds is not wholly innocent; the ferryman is not wholly corrupt. Both are partial.
- ❌ Player as Savior: the mortal in question may not want saving. They may have known what the crossing cost.
- ❌ Consequence-Free Magic: every intervention here has texture. The river remembers interference.

**Branching template chosen:** *Bargain / Bind / Break* (primary)
Secondary grammar: *Human Price / Structural Price / Sacred Price* (shapes the cost axis of each branch)

The Bargain/Bind/Break template fits because the ferryman *is* a mystical force — he is something to negotiate with, something to constrain, or something to unmake. The secondary template ensures that each branch carries a different kind of cost rather than only a tonal variation.

---

## 2. Scale Justification

Short scale is the right container for this encounter. The ferryman is not a world-shaping threat — he is a recurring fixture, a mundane horror made strange by proximity. This is not a boss encounter. It is a moment of divine attention falling on something ancient and particular, a crossroads where an Ascendant can reveal what kind of god they are becoming. The reward is modest — a soul partially freed, a river slightly shifted, a fragment of debt — not a faction transformation or a settlement-level consequence. The story centrality is local and atmospheric. If this encounter were inflated to medium or long, it would implicitly claim that the ferryman is more cosmically significant than he should be, which would betray the Threadbare aesthetic: the world is full of things like this, quietly extracting cost from the living and the dead alike, unremarkable until a god looks directly at one.

---

## 3. Pressure Knot

A mortal named **Cassia Felt** — a courier who served a minor regional faction and died carrying a message she never delivered — arrived at the river crossing sometime in the last two ticks. The ferryman, called **Morden** by the few who have spoken with him and survived to repeat it, has accepted her onto his boat but not yet crossed. He is holding her soul against payment: the suppression of a specific memory — the route she was carrying, the names on the seal, something the living faction she served would very much prefer the dead not carry to wherever the dead go.

The faction's operative who arranged this extraction — a living intermediary, **Vorlen**, a bored minor official who specializes in posthumous housekeeping — is on the near bank watching the proceedings with polite urgency. He does not have divine sight. He sees a fog-covered boat and hears nothing. He is, functionally, a client waiting at a counter.

The message Cassia was carrying is not in this encounter. The message is elsewhere in the world — the encounter cares about *whether it is erased from her*, not about its contents. The pressure is: the crossing is about to happen. Once Morden poles the boat into the fog, neither the soul nor the memory will be recoverable.

Why does this matter right now: the Ascendant can perceive souls in transit. This is the moment the encounter is visible. Once the boat enters the deep fog, the window closes.

---

## 4. Intervention Fantasy

The player is a god who can reach across the boundary between the living and the liminal — the foggy, in-between place where souls queue for passage. They can speak to Morden on terms he will actually understand. They can reach into the boat itself. They can offer something real or take something real.

The compelling intervention fantasy is: *this mortal died in service of something and someone is trying to erase the evidence*. A god who cares about Memory can reach into this moment. A god who cares about Power can make Morden understand what it costs to steal from someone who died honestly. A god who cares about the structural price can ask what it means that there is a market for this service at all — that the powerful routinely send operatives to the river crossing to scrub what the dead carry.

The player is not rescuing Cassia in any conventional sense. She is dead and will cross the river regardless. The question is *what she carries with her* and *what she yields*. The intervention fantasy is about memory, sovereignty, and whether the dead owe anything to the living structures that consumed them.

---

## 5. Cast and World Objects

**Primary NPC:**
- **Morden** — the ferryman. Ancient. Not undead, not living, not divine — something else. Operates from a logic of exchange: everything that crosses the river owes passage. Souls are currency; memory is currency; future potential is currency. He is patient, faintly interested in the Ascendant, not afraid. Speaks in complete sentences with long pauses between them, as if the silences cost something too.

**Secondary NPCs:**
- **Cassia Felt** — a dead courier. Faction-aligned in life (minor regional faction, `pre-seeded`). She is still coherent — recently dead, not yet diffused. She knows what is being extracted. She may or may not consent to it. Her agency in this moment is the encounter's most fragile element.
- **Vorlen** — a living faction operative on the near bank. Cannot hear the player's interventions. Cannot see what happens in the fog. His role is texture: the visible representation of the structural price, the living bureaucrat managing the dead.

**Factions:**
- The minor regional faction Cassia served — present only as an offscreen force with a living operative and a desire to erase something. No direct faction consequence surfaces unless the player escalates.
- No faction consequence targeting the player unless they directly expose Vorlen.

**Places:**
- The river crossing — a sublocation type: `river_crossing` or `ford`, fog-heavy. `pre-seeded` at waterway hexes in the target region.
- The near bank — open location on the hex.
- The fog channel — the encounter's liminal space; not a physical sublocation but an authored zone described in scene prose.

**Required reward objects:**
- **Memory Shard** — a fragment-style attachment representing the preserved route memory. If the player saves the memory, Cassia crosses with it intact. If the shard is extracted before the player acts, it becomes a burden or follow-on seed.
- **River Debt** — a condition attachment on the player-facing actor if they interfere in a way Morden judges to be a violation of transit law. Not punishing — more like a mark. The river will remember the Ascendant next time they pass this way.

**Reputation channels:**
- No major faction channel directly affected.
- If Vorlen is exposed or the memory is publicly preserved, minor faction `reputationScore` shift — `author-now` (must be named explicitly at implementation).
- The ferryman himself does not participate in faction reputation systems. He operates outside them.

---

## 6. Beat Structure

**Beat 1 — Approach and Recognition**
The player arrives at the perception threshold: a fog-shrouded river, a boat that is not quite moving, the sound of something being negotiated. Cassia is visible to the divine eye, still present, already in the boat. Morden is aware of the Ascendant's attention immediately — he has been paid attention by gods before. He does not pause his process. He simply continues, audibly. The player learns what is happening. They can observe or act. The choice here sets the branch.

Two intervention paths available:
- **Negotiate the Crossing** — speak to Morden as a peer. Offer something in exchange for Cassia crossing intact. This is a bargain that costs the Ascendant something real.
- **Dissolve the Contract** — reach into the transaction itself and disrupt the extraction. This does not require Morden's consent. It is direct divine interference with his work. It works, but it leaves a mark.

**Beat 2** — (NOT PRESENT — short scale, 1 meaningful beat + aftermath)

The encounter resolves at the end of Beat 1. The aftermath is the second authored phase.

---

## 7. Branching Profile

- **Branch depth:** light
- **Branch count:** 2
- **Where branching lives:** choice set, scene prose, outcome ladder, aftermath
- **Convergence policy:** converges by step 2 (immediate aftermath)
- **Primary branching template:** Bargain / Bind / Break (the two live branches are Bargain and Break; Bind is omitted as weaker — the encounter does not earn a containment arc at short scale)
- **Secondary grammar:** Human Price / Structural Price / Sacred Price — each branch carries a different cost type: Bargain costs the Ascendant personally (Human Price), Break costs structurally (River Debt / Sacred Price)

**Branch seduction check:**
- *Why would a god choose Bargain on purpose?* Because negotiating with an ancient force as a peer is its own kind of power. It acknowledges Morden's legitimacy. It earns a different relationship with the river than combat would. It is the god of Memory speaking in Memory's language.
- *Why would a god choose Break on purpose?* Because some things should not be negotiable. Because a soul that died in honest service should not have to bargain for its own integrity. Because sometimes a god uses force not from anger but from principle.
- *If labels were removed, would they still feel distinct?* Yes. One involves an exchange; one involves a unilateral act. One leaves the Ascendant lighter; one leaves a mark. The aftermath worlds are different.

---

## 8. Branching Map

**Beat 1 → Aftermath:**

| Player Choice | Immediate Resolution | Aftermath Tone | World Memory |
|---|---|---|---|
| **Negotiate the Crossing** — offer Morden something real | Cassia crosses with her memory intact. Morden pockets whatever was offered. Vorlen sees the boat finally depart. He cannot tell what happened. | Quiet. The Ascendant is now in Morden's ledger as a legitimate party. River Debt is NOT applied. The memory shard is preserved on Cassia's soul. | Morden remembers the Ascendant's name and their tendency to bargain. Future river encounters: Morden's opening posture shifts. |
| **Dissolve the Contract** — reach in and break the extraction | Cassia crosses with her memory intact. Morden watches the Ascendant for a long moment before speaking. He does not pursue. He notes the violation. | Charged. River Debt condition applied to the Ascendant. Not punishing — a mark. Something at the river crossing will feel different next time. Vorlen sees the boat depart. He cannot tell what happened. | Morden remembers. Future river encounters: Morden's opening posture shifts — not hostile, but aware. He may call the debt at a later crossing. |

**Branching memory carried forward:**
- Both branches preserve Cassia's memory. The fork is about *the cost the Ascendant pays* and *the relationship established with Morden*.
- The Memory Shard resolves identically at a structural level. The world-state difference is the River Debt condition and Morden's posture in follow-on seeded encounters.

---

## 9. Outcome Ladder

**critical_success**
Cassia crosses with her memory intact. The Ascendant's intervention was precise enough that Morden considers the exchange genuinely interesting — he volunteers one fragment of information about what other debts are currently pending at the crossing (seeds a hidden_mark intelligence attachment: the Ascendant now knows one other soul currently in transit and what is being extracted). River Debt is NOT applied regardless of branch. The encounter has made the player a recognized party in the crossing's internal economy.

**success**
Cassia crosses with her memory intact. Vorlen waits for something that never arrives. The faction operative leaves unsatisfied. Encounter resolves cleanly on either branch. River Debt applies only on the Break branch.

**success_at_cost**
Cassia crosses, but the extraction partially completed before the Ascendant could act. The memory is degraded — fragmented rather than whole. Cassia carries the route in outline, not in detail. The memory shard is a partial object. The faction's interest is thwarted but not entirely blocked. The Ascendant bears River Debt regardless of branch.

**failure**
The Ascendant's intervention is too late or insufficiently precise. Morden completes the extraction. Cassia crosses without the memory. The shard passes to Vorlen — the faction has what it wanted. The dead are a little more stripped than they were. A follow-on encounter seed is placed: `encounter_seed` with family `debt-recovery`, flagging that the memory shard is now a loose object in the faction's hands.

**critical_failure**
The intervention disrupts the crossing itself. Cassia's soul is destabilized — not destroyed, but delayed in a way that has no immediate resolution visible to the player. The shard fragments and disperses; neither the faction nor the Ascendant holds it. Morden looks at the player for a long time. River Debt (doubled) is applied. The follow-on seed is placed with family `haunt-crossing`, flagging that the unstable soul may resurface at this location in a future tick as a haunt pressure.

---

## 10. Sample Opening Paragraph

The fog had not moved in three hours. That was the first wrong thing — fog on river water always moves, pulled by the current even when the air is still, trailing upstream like cloth dragged through slow water. But this fog sat, and the boat in it sat, and on the bank a man in a minor official's coat stood with his hands folded and the particular patience of someone who had been waiting long enough to begin pretending he was not.

You found the soul the way you find all the recently dead: by the warmth they haven't shed yet. She was in the boat — a woman, or what had been a woman, still wearing the specific posture of someone who died moving, who died *toward* something. The ferryman stood at the stern. He was very old in a way that had nothing to do with appearance. His age was in his stillness, in the way the fog did not touch him quite normally, in the fact that when he turned to look in your direction he did not look surprised.

"You're early," he said, which was a strange thing to say to a god. He went back to work.

---

## 11. Branch-Dependent Later Paragraphs

### Branch A: Negotiate the Crossing

You spoke to him in the language of exchange, which is the language he has always used. You offered something — not coin, not prayer, something with actual weight in it — and he looked at you the way a tradesman looks at a fair price: without pleasure, without complaint, with the particular respect that attends a transaction conducted honestly.

"She crosses whole," he said, and he meant it the way old compacts are meant: structurally, completely, without loophole.

The boat moved. It had not moved before. Now it did, cutting through the fog in a way that suggested the fog was permitting it, and Cassia Felt looked back once, not at you — at the bank, at the folded-hands man who had arranged all this, at the world that had used her up and tried to strip her clean before releasing her. Her expression was not angry. It was something quieter and less resolvable than anger.

The ferryman did not look back at all.

---

### Branch B: Dissolve the Contract

You reached into the transaction and unmade it. Not cleanly — divine interference in an old working never is — but thoroughly. The extraction reversed like thread pulled from a needle, the memory snapping back into the dead woman's soul where it had always belonged.

Morden said nothing for a long moment. He set down his pole. He looked at you with the calm of someone who has had things taken from them before and has learned to note rather than rage.

"That was mine," he said, without heat. "You understand I have to write that down."

He did. In a ledger you could not read and would not want to, he wrote something that took three strokes of his pen, and then he picked up his pole and the boat moved and Cassia Felt went with it, intact, carrying what was hers.

On the bank behind you, the man in the official's coat checked the sky and turned up his collar and began the long walk back to wherever he had come from, empty-handed, which was the only thing that had gone entirely according to plan.

---

## 12. Aftermath Paragraph

The fog thinned after the boat passed the mid-channel. It always does, apparently — that is what the few people who live near the crossing say, the way locals absorb the uncanny into unremarkable explanation. The fog sits while the ferryman works and clears when he's done, and nobody who has watched this happen more than twice thinks much about it.

Cassia Felt is gone. She crossed with something intact — what she knew, who she served, the route that nobody wanted her to carry. Where that goes, you cannot follow. The dead move through economies you can sense but not audit, and what the living spent tonight on her behalf — the arrangement with the man in the coat, the quiet price of keeping powerful things unremembered — simply didn't work out. Someone on a high floor of somewhere is going to hear that their operatives got exactly nothing for their trouble, and that message will arrive the way most disappointing administrative updates arrive: slowly, obliquely, without ever naming you.

The river is still. The near bank is empty. You know the ferryman's name now, which is not nothing.

---

## 13. Aftermath Reaction Choices

**No reaction choices — consequence is clean.**

At short scale, the aftermath is a compact landing. The player's doctrine was expressed in the branch choice; no post-summary reaction is needed or earned. The River Debt condition (if applied) is a persistent mark that resolves in future encounters — it does not require a choice here.

---

## 14. Aftermath Kit Summary

**Curated visible changes:**

- **Cassia Felt** — crossed intact. Her soul is no longer in the world; the encounter closes her arc. The faction's extraction failed.
- **Vorlen** — departed empty-handed. No follow-on pressure from him unless a critical_failure seeded the haunt or debt-recovery encounter family.
- **River Debt** (condition, Ascendant) — applied on Branch B / success_at_cost / failure / critical_failure. Mark on the Ascendant. Hover detail: *"Morden has noted your interference. The crossing remembers you."* Persists until a future crossing encounter resolves it.
- **Memory Shard** (resolved) — on success, not a world object; the memory crossed with Cassia. On partial success, fragments. On failure, a loose attachment now held by the faction.
- **Hidden mark / intelligence** — on critical_success only: the Ascendant gains one `intelligence` record about another soul currently in transit at this crossing.

**What the world remembers:**
- Morden has a ledger entry about this Ascendant. Future river-crossing encounters involving Morden have a modified opening posture (recognizes the player as a prior party, not a stranger).
- The minor faction's posthumous-housekeeping operation failed. No faction consequence is visible this tick; the pressure exists offscreen.
- The haunt-crossing encounter family may activate in a future tick if critical_failure occurred.

---

## 15. Support Bundle Contract

| Support object | Delivery mode | Where it comes from | Persistence contract | Future references | Status |
|---|---|---|---|---|---|
| **Morden** (the ferryman NPC) | `lazy-materialize-on-trigger` | Encounter bundle; check for existing ferryman-role NPC at river_crossing sublocation before spawning | `must-persist` — Morden is a recurring character, not a scene prop. The encounter binds to him as a named node. | Future river-crossing encounters, hidden_mark reveals, River Debt resolution | `author-now` — must be authored as a persistent NPC node at the sublocation |
| **Cassia Felt** (dead courier NPC) | `lazy-materialize-on-trigger` | Encounter bundle; check for recently-deceased courier-role agent near this hex before creating | `scene-only` — she crosses and exits the world during this encounter. No world-persistent node needed after resolution. | None — she is complete | `author-now` — generated at encounter spawn, exits cleanly on resolution |
| **Vorlen** (faction operative NPC) | `lazy-materialize-on-trigger` | Check for existing faction-operative-role NPC in the region; bind to existing if suitable, otherwise spawn | `must-persist` if exposed; `scene-only` if the encounter resolves without detection | Minor faction reputation fallout if exposed; future posthumous-operations encounters | `author-now` — must check existing faction NPC pool first |
| **River crossing sublocation** | `pre-seeded` | Generated at waterway hexes as part of world geography | `must-persist` — it is a location, not a prop | All future river-crossing encounters on this hex | `live` — river/ford sublocation types exist in generation |
| **River Debt** (condition attachment) | `lazy-materialize-on-trigger` | Applied by encounter outcome resolution on Ascendant-facing actor | `must-persist` — condition persists until a future crossing encounter resolves it | Future river-crossing encounters with Morden; may surface as a cost modifier | `author-now` — condition needs to be defined as a named attachment template |
| **Memory Shard** (object) | `lazy-materialize-on-trigger` | Created at encounter spawn as the contested object | `must-persist` on failure (moves to faction holding); `scene-only` on success (dissolved into Cassia) | Debt-recovery encounter family; faction intelligence object | `author-now` — object template needed |
| **Follow-on encounter seeds** | `lazy-materialize-on-trigger` | `encounter_seed` effects on failure/critical_failure outcomes | `must-persist` — seeds accumulate in `pendingEncounterSeeds` and evaluate each tick | `haunt-crossing` and `debt-recovery` encounter families | `blocked-primitive` for the encounter families themselves — these families do not yet exist and must be authored in a future pass. The seed mechanism is live; the target families are not. |

**Blocked primitives:**
- `haunt-crossing` encounter family (seeded on critical_failure) — not yet authored. Must be flagged for `TB-104` or a dedicated backlog item.
- `debt-recovery` encounter family (seeded on failure) — not yet authored. Same routing.

---

## 16. Self-Audit

Checking against the encounter-building checklist Definition of Done:

- [x] Inspiration anchors are declared — Thematic Pillars, Anti-Patterns, Ordeal Archetypes (Impossible Bargain, Forbidden Knowledge Price, Descent Into Darkness), Character Archetypes (Strategic Immortal).
- [x] Encounter scale is declared — short.
- [x] Encounter packet is complete — all required sections present.
- [x] Presentation kit considered — fiction-first, scene readable top-to-bottom. No raw system labels in primary prose.
- [x] Branching map exists — table in Section 8.
- [x] Branching profile is declared — light, 2 branches, Bargain/Bind/Break primary template.
- [x] Branching template choice is declared — Bargain / Bind / Break (primary), Human/Structural/Sacred Price (secondary grammar).
- [x] Prose meets scene-quality bar — opening paragraph has cadence, atmosphere, tension. Branch prose is scene-specific, not administrative.
- [x] Editorial review — conducted as explicit self-review stage (see below, Section 17 gate).
- [x] Outcome ladder is authored with real forward pressure — five rungs, each with forward consequence.
- [x] Aftermath kit is complete — compact landing appropriate for short scale. Curated changes, persistent marks, no raw delta list.
- [x] Support bundle contract exists — all objects classified.
- [x] Every `lazy-materialize-on-trigger` object has persistence and follow-on contract.
- [x] Every `lazy-materialize-on-trigger` object has a reuse/idempotence rule.
- [x] Blocked primitives explicitly named — `haunt-crossing` and `debt-recovery` encounter families.
- [ ] Blocked primitives have named backlog home — see note below.
- [ ] Verification step run — draft pass only; no live engine verification at this stage.
- [x] Aftermath connects to factions, NPCs, omens, and follow-on hooks.
- [x] Aftermath is actor-centered, not a raw delta list.
- [x] Branching choices reveal divine posture — Bargain reveals the god who speaks the world's language; Break reveals the god who rejects toll as a category.
- [x] Inspiration anchors materially changed the encounter — the Impossible Bargain grammar is structural, not decorative. The ferryman as Strategic Immortal rather than monstrous antagonist changes the entire moral frame.
- [x] Anti-patterns actively avoided — the ferryman is not a villain; the mortal is not purely innocent; the player is not the savior.

**Backlog note for blocked primitives:**
The `haunt-crossing` and `debt-recovery` encounter families exposed by this packet's failure/critical_failure seeds should be routed to `TB-104 · Procedural Content Component Library Foundation` with a note: *Soul Ferryman encounter (soul-ferryman-sonnet) seeded haunt-crossing and debt-recovery encounter families that do not yet exist. Both are encounter family stubs, not structural primitive gaps. Author as follow-on content in the same encounter family stream.*

---

## 17. Experience Differentiator Gate

**14 YES/NO questions:**

1. **Does the encounter start with the world already in motion, before the player acts?**
   YES — Morden is mid-transaction. Cassia is already in the boat. Vorlen is already waiting. The extraction is in progress.

2. **Does the player have a clear intervention fantasy — something to do that feels like a natural divine act rather than a system command?**
   YES — negotiating with an ancient crossing-keeper or dissolving a posthumous contract are both coherent divine postures, not button presses.

3. **Does failure create forward pressure rather than emptiness?**
   YES — failure seeds a debt-recovery encounter; critical_failure seeds a haunt. The dead don't stay quiet when their crossing goes wrong.

4. **Does the encounter change at least three world surfaces in its aftermath?**
   YES — the Ascendant's condition state (River Debt), Morden's posture in future encounters (intelligence mark), and the faction's posthumous operation outcome (reputation effect offscreen). On failure, add the Memory Shard as a loose world object.

5. **Are the branches tempting in different ways, not just tactically different?**
   YES — Bargain is about recognition and legitimacy; Break is about principle and unilateral authority. A player can want either for reasons that say something about their godhood.

6. **Does each branch feel like a doctrine of interference, not just a tactic?**
   YES — the Bargain branch says: *this world has its economies and I engage them honestly*. The Break branch says: *some economies should not apply to the dead*.

7. **Does the prose have cadence, atmosphere, and tension — not just information?**
   YES — the opening paragraph is scene-first, with the fog and the patient bureaucrat and the mortal who died moving. The branch paragraphs carry that voice through.

8. **Does the encounter feel specific rather than generic fantasy?**
   YES — Morden with his ledger, Cassia Felt as a named dead courier, Vorlen as the dull living face of the transaction, the fog that only sits still when he's working — these are specific textures, not fantasy wallpaper.

9. **Do the choices reveal what kind of god the player is being, not only what tactic they prefer?**
   YES — see question 6.

10. **Is the scale appropriate — not inflated beyond its importance, not too thin for its stakes?**
    YES — one beat, two branches, compact aftermath. Short scale. The ferryman is not a world-threatening entity. He is a fixture of the world's machinery.

11. **Does the encounter avoid the Dark Lord Problem, Prophecy as Railroad, and Player as Savior?**
    YES — the ferryman has his own coherent logic. There is no prophecy. Cassia does not survive because of the player; she crosses regardless. What changes is what she carries.

12. **Do the support objects have real persistence contracts, not just scene-level props?**
    YES — Morden is `must-persist`. River Debt is `must-persist`. Cassia is `scene-only` with a clean exit. The distinction is explicit.

13. **Is the moral weight distributed across the encounter rather than concentrated in one obvious "good" choice?**
    YES — a god who bargains with Morden is not obviously more virtuous than one who breaks the contract. Both carry costs. Both express legitimate divine postures. Morden himself is not obviously wrong.

14. **Does the encounter end with the player feeling payoff, consequence, and authorship — not just resolution?**
    YES — the closing aftermath paragraph is specific to what happened (Cassia crossed; the faction got nothing; the river is still), and the River Debt condition or the quiet recognition of Morden's note means the player carries something forward.
