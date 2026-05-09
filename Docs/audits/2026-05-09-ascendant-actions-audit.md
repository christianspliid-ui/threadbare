# Ascendant Action System — Game Design Audit

**Date:** 2026-05-09
**Authoring:** Cowork
**Subject:** Every ascendant action template defined in `src/data/unified-action-templates.ts`
**Goal:** A fun, well-balanced action system with a great generic base, easy to learn, hard to master, that progressively unlocks more advanced options as the player progresses.

---

## Executive Summary

Threadbearer currently defines **~99 ascendant action templates** across **14 categories**, **8 canonical reach domains** (with drift into 3 unsanctioned values), **4 rarity tiers**, and **6 target types** (agent, hex, location, sublocation, artifact, faction). The catalog is rich — possibly the richest part of the game — but it has grown more by accretion than by curation. The result is a system with extraordinary expressive range and three structural problems: the **starter loop is unclear** (no labelled "first 5 actions"), there are **major redundancies** (Persuade ≈ Inspire ≈ action.initiative.inspire; Dream ≈ Dream Sending; Deceive ≈ Plant Secret; multiple "scry" verbs), and the **rarity assignments are almost flat** (~70% tier-1, no clear unlock cadence).

The good news: the underlying structure is sound. CRUD verbs × reach domains × scales × targets gives a clean grid. The actions are well-named and prose-rich. The fix is mostly **curation, not creation** — collapse near-duplicates into a smaller canonical starter set, retag rarity to spread mass across 1→4, and gate ~40% of the catalog behind unlocks rather than presenting it all at once.

This document does an action-by-action assessment, then synthesises gaps, overlaps, opportunities, and a proposed rogue-like unlock structure aligned to the Threadbearer pillars (player-as-god, prose-first, narrative-tiebreaker, turn-based curation).

> **Drift note (open finding):** `src/types/traits.ts` defines 8 reach domains (`iron, gold, shadow, veil, heart, eye, stone, star`). Action templates in this file use three additional values: `rune` (15+ actions), `time` (1 action), `void` (1 action). Either the canonical type is wrong or the templates are wrong. This needs reconciling before any unlock work — see *Cross-Cutting Findings* below.

---

## Methodology

- **Source of truth:** `src/data/unified-action-templates.ts`. Every template tagged `actorAffinities: ['ascendant']` is in scope.
- **Field map per action:** id, name, description (one line, novice-readable, game-technical), reach, sphere, CRUD, scale, target category, AP cost, essence cost (or per-tick cost for sustained), proposed rarity tier, current rarity tier, fun rating, balance flag, role, synergies, requisites, unlock candidacy, proposed unlock tier.
- **Density choice:** Where 5+ actions form a tight family (the 6 thread-creation variants, the 5 perceive actions, the 8 base interventions), they are grouped into a single table with shared assessment notes and a per-row distinction.
- **Out of scope:** Mortal/agent actions (`action.*` non-divine), encounter templates, NPC actions, faction-internal templates. Only ascendant-affinity actions audited.

**Legend for assessment columns:**

- **Balance:** ✅ healthy · ⚠️ tunable concern · 🔴 structural concern
- **Fun:** ★★★★★ signature · ★★★★ strong · ★★★ solid · ★★ weak · ★ filler
- **Cat:** generic (always available), reach (unlocks with reach tier), found (discovered in world), earned (granted by completing X), unlocked (rogue-like meta-progression)
- **Unlock tier:** S (starter, available turn 1), E (early, run hour 1), M (mid-run), L (late-run), X (cross-run / meta-unlock)
- **Proposed Rarity:** 1 Mundane · 2 Storied · 3 Mythic · 4 Legendary

---

## Part 1: Per-Action Audit

### 1. Base Divine Interventions (8 actions) — *the starter spellbook*

These are the original "what does a god actually do" verbs. Apply an **influence** (a soft nudge that decays over time) to a single mortal. All cost 1 essence (cheap), all are `intrinsicTier: background`, all target `agent`. They are the single most important category — they should be the player's first 5 actions and the answer to "what is this game?"

| ID | Name | Description (novice) | Reach/Sphere | Cost | Role | Bal | Fun | Cur Rar | Prop Rar | Cat | Synergies | Requisites | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `divine.dream` | Dream | Plant a desire in a sleeping mortal's mind; they wake convinced. | heart / mind | 1 | Soft persuasion (subtle) | ✅ | ★★★★ | 1 | 1 | generic | bonded thread, sleep encounter | none | agent | **S** |
| `divine.persuade` | Persuade | Whisper a sudden certainty; they act decisively in your favored direction. | heart / spirit | 1 | Direct nudge (loud) | ⚠️ overlaps Dream | ★★★ | 1 | 1 | generic | encounter aftermath | none | agent | **S** |
| `divine.deceive` | Deceive | Drape a divine illusion; they believe what you want them to. | shadow / mind | 1 | False-info nudge | ✅ | ★★★★ | 1 | 1 | generic | secrets system, plant_secret | none | agent | **S** |
| `divine.intimidate` | Intimidate | Press divine fear; they comply but resent. | iron / force | 1 | Compliance under threat | ✅ resent is a great hook | ★★★★ | 1 | 1 | generic | breeds future trouble | none | agent | **S** |
| `divine.inspire` | Inspire | Kindle passionate purpose; they pursue with extraordinary energy. | heart / life | 1 | Passion buff | ⚠️ overlaps Persuade | ★★★ | 1 | 1 | generic | initiative system | none | agent | **S** |
| `divine.coincidence` | Coincidence | Arrange events so chance favors them; they never see your hand. | time / time | 1 | Hidden providence | ✅ very on-theme | ★★★★★ | 1 | 2 | generic | hidden marks, plausible deniability | reach tier 1+ | agent | **E** |
| `divine.omen` | Omen | Plant a visible sign in the world; those who read it adjust. | stone / spirit | 1 | Public broadcast | ✅ public+plausible | ★★★★ | 1 | 2 | generic | rival gods see your marks | none | agent | **E** |
| `divine.afflict_bless` | Afflict/Bless | Reach into their flesh — heal, sicken, change their body. | life / life | 1 | Hard physical reshape | ⚠️ unambiguous = no plausible deniability | ★★★★ | 2 | 3 | reach | breaks "subtle god" theme if used early | reach.life tier 2 | agent | **M** |

**Group assessment:**

- **Role in game:** This is the "what a god does" core verb set. Six of eight are perfect starter actions. The set covers a 2×3 matrix nicely: (subtle/loud) × (mind/will/body).
- **Balance flag:** `divine.persuade` and `divine.inspire` are near-redundant — both push a mortal to commit harder to a course. They differ only in sphere flavor. **Recommend: distinguish or merge.** One option: Persuade = changes target's choice, Inspire = amplifies the choice they were already making. That's a real mechanical distinction worth keeping if it's wired in.
- **Fun signal:** Coincidence and Omen are the standouts — they exemplify "player as god" via plausible deniability. Promote them visually and unlock-wise.
- **Rarity proposal:** Spread tier-1 across 5 starters, lift Coincidence/Omen to 2, lift Afflict/Bless to 3 (it's the only direct-physical action in the set; should feel rare and consequential).
- **Unlock candidacy:** All 8 belong in starter+early band. Afflict/Bless is the natural first earned-tier progression reward.

---

### 2. Initiative Interventions (2 actions) — *narrative momentum levers*

Layered onto THR-51's initiative system. Boost or sabotage an ongoing mortal initiative.

| ID | Name | Description | Reach | Cost | Role | Bal | Fun | Cur | Prop | Cat | Synergies | Requisites | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `action.initiative.inspire` | Inspire Initiative | Boost a mortal's next initiative score by +0.5 (almost forces it). | heart | 12 | Initiative dial | 🔴 cost vs `divine.inspire` (cost 1) | ★★★ | 2 | 2 | reach | initiative system, momentum | active initiative | agent | **E** |
| `action.initiative.sabotage` | Sabotage Initiative | Whisper doubt; their initiative may fail at next checkpoint. | shadow | 10 | Counter-initiative | ✅ great hostile-god verb | ★★★★ | 2 | 2 | reach | rival/villain play | active initiative | agent | **E** |

**Group assessment:**

- **Balance flag (red):** `action.initiative.inspire` (essence 12) vs `divine.inspire` (essence 1) is a mystery — the design should explain why Inspire-the-Initiative costs 12× the cost of Inspire-the-Mortal. If the answer is "different effect", the names should reflect it. Otherwise this is friction-by-naming.
- **Fun:** Sabotage is one of the few clearly-villainous verbs. Keep it loud.
- **Categorisation:** These are reach-level depth actions, not generic. Hide behind a tutorial/encounter-based unlock.

---

### 3. Revelation Actions (4 actions) — *the inspector verbs*

Four ways to learn about a mortal. They are the agent-targeting half of the perception system.

| ID | Name | Description | Reach | Cost | Role | Bal | Fun | Cur | Prop | Cat | Synergies | Requisites | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `observe_agent` | Observe | Quick glance — see surface capabilities. | eye | 5 | Cheap recon | ✅ | ★★★ | 1 | 1 | generic | revelation system | bonded thread | agent | **S** |
| `scry_agent` | Scry | Sustained gaze — full read of capabilities, connections, hidden traits. | eye | 15 | Deep dive | ✅ cost-vs-info trade is clean | ★★★★ | 2 | 2 | generic | revelation system | bonded thread, reach.eye t2 | agent | **E** |
| `whisper_insight` | Whisper Insight | Touch their inner values — what they actually care about. | veil | 5 | Motivation read | ✅ on-theme | ★★★★ | 1 | 2 | reach | motivation system, court | bonded thread | agent | **E** |
| `dream_sending` | Dream Sending | Visit them in dreams; pull their ambitions and fears. | star | 15 | Deep psyche read | ⚠️ overlaps Scry + Dream | ★★★ | 2 | 2 | reach | psychology, prophecy | bonded thread, star t2 | agent | **M** |

**Group assessment:**

- **Balance flag:** `dream_sending` (read) overlaps `divine.dream` (write) only by name — they are mechanically different but the player will conflate them. Rename to `dream_sending` → "Read Dream" or "Walk the Dream" for clarity.
- **Fun signal:** The 5/15 essence cost split (cheap-shallow vs expensive-deep) is good design. Preserve this pattern when adding new revelation verbs.
- **Categorisation:** `observe_agent` is the clearest "always-available" reveal. Whisper Insight unlocks with deeper bonding. Scry and Dream Sending are reach-gated.

---

### 4. Thread Creation (6 actions) — *the bonding gate*

The player's primary verb for *establishing* divine attention to a thing. Every other category presupposes a thread exists.

| ID | Name | Description | Cost | Role | Bal | Fun | Cur | Prop | Cat | Synergies | Reqs | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bind_thread_agent` | Bind Thread — Agent | Anchor a slender thread to a mortal; opens future intervention. | 10 | Roster expansion | ✅ | ★★★★ | 1 | 1 | generic | every other agent action | none | individual | **S** |
| `bind_thread_agent_strong` | Bind Strong Thread — Agent | Force a Devoted-tier thread immediately; expensive, durable. | 25 | Premium bond | ✅ tradeoff is clean | ★★★ | 2 | 2 | reach | court, devotion | star tier 2+ | individual | **E** |
| `bind_thread_location` | Bind Thread — Location | Bind a place to your awareness; receive events from it. | 15 | Place-as-character | ✅ | ★★★★ | 1 | 1 | generic | location actions | none | location | **S** |
| `bind_thread_faction` | Bind Thread — Faction | Bind a faction; track collective ambitions. | 20 | Faction play | ✅ | ★★★★ | 1 | 2 | generic | faction edicts, conclaves | none | faction | **E** |
| `bind_thread_army` | Bind Thread — Army | Track a marching host; war play unlocks. | 15 | War recon | ⚠️ overlaps location-bound castles | ★★★ | 1 | 2 | reach | siege, war | reach.iron t1 | army | **M** |
| `bind_thread_artifact` | Bind Thread — Artifact | Track an object across the world; sense its bearer. | 25 | Object-as-quest | ✅ unique target | ★★★★ | 1 | 3 | found | artifact actions, MacGuffin chases | discovered artifact | artifact | **L** |

**Group assessment:**

- **Role in game:** Thread creation is the gate verb. It should feel **important**, not procedural. Currently all 6 cost AP=0 and feel like a UI button. Consider giving thread-bind a small ritual (1 tick to set, 1 essence/tick to maintain) so the player feels the weight of "claiming" a thing.
- **Balance flag:** Thread-army at 15 essence vs thread-faction at 20 is backwards — armies are usually transient, factions persist. Suggest army = 10, faction = 25.
- **Categorisation:** Agent and location threads are starters. Faction is early. Army is mid (war isn't always present). Artifact is late/found (you must discover an artifact first).
- **Unlock candidacy:** `bind_thread_artifact` is the single best "found-by-discovery" thread — only available after the player has actually found an artifact in the world. Hard-gate on that.

---

### 5. Thread Management (2 actions) — *attention housekeeping*

Move agents in/out of active attention. Both essence-free, AP-free.

| ID | Name | Description | Role | Bal | Fun | Prop Rar | Unlock |
|---|---|---|---|---|---|---|---|
| `thread.dormant` | Dormant Thread | Let the thread go slack; agent fades from active queue. | Attention triage | ✅ | ★★★ | 1 | **S** |
| `thread.reactivate` | Reactivate Thread | Pull the slack thread taut again. | Attention triage | ✅ | ★★ | 1 | **S** |

**Group assessment:** These are UI verbs more than gameplay verbs — they shouldn't appear in the action drawer alongside Smite. Move them to a dedicated thread-management surface (thread list panel) and stop counting them as "actions."

---

### 6. Social-Scene Interventions (2 actions) — *encounter scoring weights*

In-encounter divine actions with measurable mechanical effect.

| ID | Name | Description | Reach | Cost | Bal | Fun | Cur | Prop | Cat | Reqs | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `action.social.tip_scales` | Tip the Scales | Bend a social encounter your way; opposed checks bend toward your favored side. | shadow / mind | 12 | ⚠️ "tip" sounds like Persuade-of-encounters | ★★★★ | 2 | 2 | reach | active social encounter | social encounter | **E** |
| `action.social.embolden` | Embolden | Add courage to a hesitant mortal mid-conversation. | heart / force | 8 | ✅ | ★★★ | 1 | 2 | reach | social encounter | social encounter | **E** |

**Group assessment:** Two actions feels thin for "things a god can do during a social encounter." Compare to the 5 perceive actions for cosmic discovery. Suggest expanding to 5–7: Tip Scales, Embolden, Plant Doubt, Twist Words, Loose Tongues, Freeze Voice, Echo Past Promises.

---

### 7. Secrets & Favors (3 actions) — *information warfare*

| ID | Name | Description | Reach | Cost | Bal | Fun | Prop | Cat | Reqs | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `action.secrets.reveal_secret` | Reveal Secret | Force a hidden secret about target into open knowledge. | eye / mind | 10 | ✅ | ★★★★ | 2 | reach | known secret | agent | **E** |
| `action.secrets.plant_secret` | Plant Secret | Forge a fake secret; rumor begins to spread as truth. | shadow / shadow | 14 | ✅ creative | ★★★★★ | 3 | reach | reach.shadow t1+ | agent | **M** |
| `action.secrets.call_in_favor` | Call In Favor | Cash in a favor edge; agent acts on your prompt. | heart / force | 8 | ✅ | ★★★ | 2 | found | favor edge exists | agent | **E** |

**Group assessment:** This is one of the strongest categories — every action has a clear unique role and on-theme name. Plant Secret is a signature action, deserves tier 3 promotion. Expand the category — Forge Document, Hide Memory, Burn Reputation, Steal Credit are obvious siblings.

---

### 8. Faction Actions (2 actions) — *governance levers*

| ID | Name | Description | Reach | Cost | Bal | Fun | Prop | Reqs | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|
| `action.divine-edict` | Divine Edict | At a faction conclave, weight one position; the vote bends. | star / mind | DIVINE_EDICT | ✅ | ★★★★ | 2 | active conclave | faction | **M** |
| `action.anoint-champion` | Anoint Champion | Lay a mantle of divine favor; double esteem, encounter boost for N ticks. | iron / force | ANOINT | ✅ | ★★★★★ | 3 | bonded faction | agent | **L** |

**Group assessment:** Anoint Champion is a signature action — narrative weight, mechanical clarity, on-theme. Promote to tier 3 Mythic. Edict is the "during a conclave" sibling and should be expanded with at least 2–3 more conclave-specific verbs (Recess the Vote, Speak the Lost Name, Invoke Tradition).

---

### 9. Perceive — Ruins Layer (5 actions) — *the discovery loop*

A tight family of THR-151 ruins-discovery actions. All target hexes, all ruins-layer.

| ID | Name | Description | Sphere | Cost | Function | Prop | Reqs | Unlock |
|---|---|---|---|---|---|---|---|---|
| `divine.perceive.cast_attention` | Cast Attention | Search a hex for any undelved ruin; vague clue forms in nearby mortal. | spirit | low | Detect-undelved | 1 | bonded agent on hex | **S** |
| `divine.perceive.refine_the_hush` | Refine the Hush | Sharpen a vague clue into a narrowed clue (district/chamber). | spirit | low | Refine-clue | 1 | existing clue | **E** |
| `divine.perceive.listen_for_a_name` | Listen for a Name | Hear the name of the culture that built it; unlocks culture prose. | mind | low | Identify-culture | 2 | undelved ruin | **E** |
| `divine.perceive.read_the_threads` | Read the Threads | Detect dormant Place of Power on a hex (no agent needed). | mind | low | Detect-PoP | 2 | none | **E** |
| `divine.perceive.taste_the_wake` | Taste the Wake | Sense rival gods' marks on this hex. | time | mid | Detect-rivals | 3 | bonded agent | **M** |

**Group assessment:** This is **excellent design** — a 5-action progression that maps to discovery → clue refinement → identification → context → rival awareness. It's a model for how every layer should be structured. **Use this template** for other layers: each should have a 4–6 action discovery toolkit, not one Survey verb.

---

### 10. Relay — Ruins Layer (2 actions) — *push-knowledge to mortals*

| ID | Name | Description | Cost | Function | Prop | Unlock |
|---|---|---|---|---|---|---|
| `divine.relay.compose_a_clue` | Compose a Clue | Push direct knowledge of a ruin to a bonded agent — they just *know*. | mid | Bypass-investigation | 2 | **E** |
| `divine.relay.whisper_the_direction` | Whisper the Direction | One-time directional nudge; bonded agent walks toward the ruin next tick. | low | Path-nudge | 1 | **S** |

**Group assessment:** Two actions, two distinct function-points (knowledge transfer vs. movement nudge). Good. Could expand with: Plant the Vision (recurring dream prods them), Fade the Map (erase a known clue), Cross the Threads (transfer a clue from one agent to another).

---

### 11. Location Actions (4 actions) — *settlement-scale interventions*

| ID | Name | Description | Reach/Sphere | Cost | Bal | Fun | Prop | Cat | Reqs | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `loc.ward` | Ward | Inscribe protective runes; magical saturation +0.15. | rune / order | 3 | ✅ | ★★★ | 1 | reach | rune available | location | **S** |
| `loc.place_of_power` | Place of Power | Wake the ley lines; saturation +0.30; rituals work better. | rune / spirit | 5 | ✅ | ★★★★ | 2 | reach | rune t1 | location | **E** |
| `loc.incite_unrest` | Incite Unrest | Stir grievance; unrest +20. | shadow / chaos | 2 | ✅ | ★★★★ | 1 | generic | settled location | settlement | **S** |
| `loc.fortify` | Fortify | Strengthen a fortification's defenses. | iron / force | 4 | ✅ | ★★ filler | 1 | reach | iron t1 | keep/fort | **E** |

**Group assessment:** Four feels like a placeholder set. Locations are one of three primary target types, they deserve **at least 8–10 verbs**. Suggest expanding: Bless the Harvest, Plague the Wells, Open the Markets, Curse the Roads, Sanctify the Square, Shadow the Streets, Build the Temple, Raze the Quarter, Awaken the Founder. Compare to the 51 hex actions — locations are dramatically under-served.

---

### 12. Sublocation Actions (4 actions) — *the room-scale verbs*

| ID | Name | Description | Reach | Cost | Bal | Fun | Prop | Reqs | Target | Unlock |
|---|---|---|---|---|---|---|---|---|---|---|
| `sub.sanctify` | Sanctify | Consecrate a shrine/temple/cave/ruin to your sphere. | rune | 4 | ✅ | ★★★ | 1 | rune avail | shrine/temple/ruin/cave | **S** |
| `sub.trap` | Trap | Lay an invisible snare; activates on intended victim. | shadow | 2 | ⚠️ no good victim-specification UI? | ★★★★ | 1 | none | sublocation | **E** |
| `sub.vision` | Vision | Read the history and hidden nature of a place. | heart | 1 | ✅ cheap recon | ★★★★ | 1 | none | sublocation | **S** |
| `sub.sanctify_tavern` | Sanctify Tavern | Special: a tavern blessed becomes a thread-favored hub. | heart | 15 | ⚠️ tavern-specific is suspicious | ★★★ | 2 | tavern | tavern | **M** |

**Group assessment:** `sub.sanctify_tavern` is a smell — why does *tavern* get a special verb when shrine/temple don't? Either generalise (Sanctify Hub, with subtype-specific bonuses) or add equivalents for every social hub subtype. The current design plays favorites without explanation. Sublocations otherwise lightly served — suggest adding Haunt, Reveal-Hidden-Door, Light-the-Hearth, Open-the-Vault, Drown-the-Cellar.

---

### 13. Artifact Actions (4 actions) — *object-shaping verbs*

| ID | Name | Description | Reach | Cost | Bal | Fun | Prop | Reqs | Unlock |
|---|---|---|---|---|---|---|---|---|---|
| `artifact.enchant` | Enchant | Bind divine intent into runes on the artifact. | rune | 4 | ✅ | ★★★ | 1 | rune | **E** |
| `artifact.attune` | Attune | Align the artifact's resonance to one sphere. | heart | 2 | ✅ | ★★ | 1 | none | **S** |
| `artifact.nullify` | Nullify | Strip every enchantment; reduce to mundane. | void | 3 | ⚠️ uses void reach (unsanctioned) | ★★★ | 1 | none | **E** |
| `artifact.curse` | Curse | Bind a curse; bearer suffers without knowing. | shadow | 3 | ✅ | ★★★★ | 2 | shadow t1 | **M** |

**Group assessment:** Four actions for one of the game's most evocative target types. Where is *Awaken the Artifact* (give it sentience), *Shatter*, *Reforge*, *Bind to Bearer*, *Thirst*, *Dream Inside*? Artifacts deserve a vignette-rich verb set. Also: `artifact.nullify` uses `reach: 'void'` which isn't in the canonical reach type — needs reconciling.

---

### 14. Hex Actions (51 actions) — *the bulk of the catalog*

The hex layer is **half the entire action catalog**. Organized into five sub-layers (Land, Soul, People, Ruins, Sustained Control). I will summarise per-layer rather than line-by-line, since most hex actions are minor-variant signal-detection or one-shot terraforming.

#### 14a. Hex — Basic & Survey (5 actions)

| ID | Name | Function | Cost | Prop | Unlock |
|---|---|---|---|---|---|
| `hex.survey` | Survey Territory | Free recon — what's on this hex. | 0 | 1 | **S** |
| `hex.sense_threads` | Sense Threads | Detect existing thread-bound entities. | 0.5 | 1 | **S** |
| `hex.bless_land` | Bless the Land | Generic land buff. | 3 | 1 | **S** |
| `hex.corrupt_land` | Corrupt the Land | Generic land debuff. | 4 | 2 | **E** |
| `hex.seed_life` | Seed Life | Place a life-aligned seed; ecology shifts. | 6 | 2 | **E** |

#### 14b. Hex — Land One-Shot (5 actions)

| ID | Name | Function | Cost | Prop | Unlock |
|---|---|---|---|---|---|
| `hex.raise_landmark` | Raise Landmark | Spawn a permanent land feature. | 8 | 3 | **L** |
| `hex.dowse_resources` | Dowse for Resources | Reveal hidden resource deposits. | 2 | 1 | **E** |
| `hex.sense_leylines` | Sense the Leylines | Reveal magical flows. | 1 | 1 | **E** |
| `hex.shift_season` | Shift Season | Force a seasonal change. | 3 | 2 | **M** |
| `hex.scorch_earth` | Scorch Earth | Burn a hex; long-term debuff. | 7 | 2 | **M** |

#### 14c. Hex — Land Catastrophic (1 action)

| ID | Name | Function | Cost | Prop | Unlock |
|---|---|---|---|---|---|
| `hex.rend_earth` | Rend the Earth | Tear the land open; permanent feature. | 12 | 4 | **X** |

#### 14d. Hex — Soul (Magic Substrate) One-Shot (7 actions)

| ID | Name | Function | Prop | Unlock |
|---|---|---|---|---|
| `hex.attune_leyline` | Attune Leyline | Tune a leyline to your sphere. | 1 | **E** |
| `hex.read_currents` | Read the Currents | Read magic flow patterns. | 1 | **E** |
| `hex.shift_dominion` | Shift Dominion | Drift the dominant sphere. | 2 | **M** |
| `hex.amplify_flow` | Amplify the Flow | Crank the local magic up. | 2 | **M** |
| `hex.sever_flow` | Sever the Flow | Cut a leyline; magic dries up. | 2 | **M** |
| `hex.dispel_wild` | Dispel the Wild | Calm wild magic. | 1 | **M** |
| `hex.forge_seer_token` | Forge Seer's Token | Crystallise an artifact from a leyline. | 2 | **L** |

#### 14e. Hex — People One-Shot (10 actions)

| ID | Name | Function | Prop | Unlock |
|---|---|---|---|---|
| `hex.divine_populace` | Divine the Populace | Read population mood. | 1 | **S** |
| `hex.scry_factions` | Scry the Factions | Read faction strengths. | 1 | **S** |
| `hex.bestow_vision` | Bestow Vision | Mass-vision; everyone gets the dream. | 1 | **E** |
| `hex.spark_encounter` | Spark an Encounter | Force an encounter to fire here. | 1 | **E** |
| `hex.stir_people` | Stir the People | Mass-inspire population. | 2 | **E** |
| `hex.summon_congregation` | Summon Congregation | Pull faithful together. | 2 | **M** |
| `hex.send_herald` | Send a Herald | Spawn an NPC herald. | 2 | **M** |
| `hex.scatter` | Scatter | Force population dispersal. | 2 | **M** |
| `hex.smite` | Smite | Kill mortals on a hex. | 2 | **L** signature |
| `hex.forge_instrument` | Forge Divine Instrument | Spawn a chosen-one mortal. | 4 | **L** |

#### 14f. Hex — People Exodus (1 action)

| ID | Name | Function | Prop | Unlock |
|---|---|---|---|---|
| `hex.incite_exodus` | Incite Exodus | Force mass migration off the hex. | 2 | **L** |

#### 14g. Hex — Ruins One-Shot (6 actions)

| ID | Name | Function | Prop | Unlock |
|---|---|---|---|---|
| `hex.mark_ground` | Mark the Ground | Leave a marker for future you. | 1 | **S** |
| `hex.whisper_intuition` | Whisper of Intuition | Hint to the player UI without revealing. | 1 | **S** |
| `hex.read_stones` | Read the Stones | Reveal physical past of the hex. | 1 | **E** |
| `hex.plant_dream` | Plant a Dream of the Past | Show mortals a vision of what was here. | 1 | **E** |
| `hex.consecrate_past` | Consecrate the Past | Make the historical event holy. | 3 | **M** |
| `hex.restore_fragment` | Restore a Fragment | Rebuild a ruin partially. | 1 | **L** |

#### 14h. Hex — Ruins Rewrite (2 actions)

| ID | Name | Function | Prop | Unlock |
|---|---|---|---|---|
| `hex.rewrite_history` | Rewrite History | Change the past as remembered here. | 3 | **X** signature |
| `hex.bury_past` | Bury the Past | Erase a historical event from memory. | 1 | **L** |

#### 14i. Hex — Ruins Corruption (1 action)

| ID | Name | Function | Prop | Unlock |
|---|---|---|---|---|
| `hex.desecrate` | Desecrate | Befoul a holy site. | 1 | **M** |

#### 14j. Hex — Sustained Control (15 actions, *the heavyweights*)

These are the strategic-layer verbs — establish ongoing divine claims that cost essence per tick to maintain and can be contested by rivals. Each has `controlSpec` with per-tick cost, contest prerequisites, and lifecycle narrative.

| ID | Name | Layer | Per-tick cost | Per-tick income | Cur Rar | Prop Rar | Unlock |
|---|---|---|---|---|---|---|---|
| `hex.claim_dominion` | Claim Dominion | land | spirit 0.3 | — | 3 | 3 | **L** |
| `hex.cultivate` | Cultivate | land | life 0.4 | — | 2 | 2 | **M** |
| `hex.claim_resource` | Claim Resource | land | matter 0.2 | matter 0.5 | 2 | 2 | **M** |
| `hex.anchor_sphere` | Anchor the Sphere | soul | spirit 0.5 | — | 3 | 3 | **L** |
| `hex.tap_source` | Tap the Source | soul | spirit 0.2 | spirit 0.8 | 2 | 2 | **M** |
| `hex.attune_thread` | Attune Thread | soul | spirit 0.15 | — | 1 | 2 | **E** |
| `hex.channel_current` | Channel the Current | soul | spirit 0.4 | — | 3 | 3 | **L** |
| `hex.shepherd_flock` | Shepherd the Flock | people | spirit 0.5 | — | 3 | 3 | **L** |
| `hex.install_champion` | Install a Champion | people | spirit 0.6 | — | 3 | 4 | **X** signature |
| `hex.strengthen_thread` | Strengthen Thread | people | spirit 0.2 | — | 2 | 2 | **M** |
| `hex.impose_decree` | Impose Decree | people | spirit 0.4 | — | 3 | 3 | **L** |
| `hex.bind_echoes` | Bind the Echoes | ruins | spirit 0.3 | — | 3 | 3 | **L** |
| `hex.compel_exploration` | Compel Exploration | ruins | mind 0.4 | — | 1 | 2 | **M** |
| `hex.seal_tomb` | Seal the Tomb | ruins | — | — | — | 3 | **L** |
| `hex.ward_against_deep` | Ward Against the Deep | ruins | — | — | — | 3 | **L** |

**Hex layer assessment (all 51):**

- **Volume vs depth:** 51 hex actions vs 4 location actions vs 4 sublocation actions is wildly imbalanced. The hex layer is over-served; the location/sublocation layer is starved.
- **The sustained-control set is the strategic backbone of the game.** It's mechanically rich (per-tick cost, contest, lifecycle) and well-themed. **Promote it visually** — these aren't "actions," they're *claims* / *covenants* / *ongoing rituals*. Give them their own UI surface separate from the action drawer.
- **Survey vs Divine Populace vs Scry Factions vs Sense Threads vs Sense Leylines vs Read Currents:** that's six similar-shaped recon verbs. The player will not know which to use. Either consolidate (one Survey verb with sub-modes) or differentiate sharply.
- **`hex.smite` is the most iconic verb in any god-game.** Currently buried mid-list. Promote to tier 3 (Mythic), give it a cinematic resolution, place it as the unlock reward for completing a major mortal-hostility arc.
- **`hex.rewrite_history` and `hex.install_champion`** are the two truly mythic "shape the world" verbs. They should be tier 4 Legendary, late-run unlocks (X tier in the unlock framework), and central to any prestige/meta-progression system.
- **Layer-by-layer rebalance:** Land (12 actions) is fine. Soul (8 actions) is fine. People (11 actions) is fine. Ruins (9 actions) is well-shaped (mirrors the perceive set). The 15 sustained controls feel right *as a set* but should be split visually from one-shots.

---

## Part 2: Cross-Cutting Findings

### 2.1 Reach domain drift

The canonical type `ReachDomain` lists 8 domains: `iron, gold, shadow, veil, heart, eye, stone, star`.

Action templates use 3 additional values:

- **`rune`** — used by ~15 actions (loc.ward, loc.place_of_power, artifact.enchant, sub.sanctify, all 4 sublocation actions, etc.)
- **`time`** — used by `divine.coincidence`
- **`void`** — used by `artifact.nullify`

This will fail strict type-checking and is a real authoring risk. Three options, in order of preference:

1. **Promote `rune` to a canonical reach domain.** It's used by 15+ actions across multiple authoring sessions; it's clearly intentional. Update `traits.ts` to declare it. Decide whether `time` and `void` are also canonical (they read more like spheres than reaches).
2. **Reassign the offending actions** to a canonical reach. `rune` → `stone` (carved/inscribed magic), `time` → `eye` (foresight) or `star` (cosmic), `void` → `veil` (unmaking).
3. **Audit-and-track:** open a `UL-proposal` Linear issue for the rune/time/void question; treat as terminology drift until decided.

### 2.2 Rarity distribution is almost flat

Current distribution (from inventory):

- Tier 1 Mundane: ~70%
- Tier 2 Storied: ~22%
- Tier 3 Mythic: ~4%
- Tier 4 Legendary: ~2%

For a system that wants progressive unlocks, this is wrong-shape. Healthy curve:

- Tier 1: 30–40% (the starter set + cheap utilities)
- Tier 2: 30–35% (mid-game unlocks)
- Tier 3: 20–25% (late-game signature moves)
- Tier 4: 5–10% (mythic capstones, X-tier unlocks)

**Recommendation:** Re-tag rarities globally. Promote ~20 actions from tier 1 → 2, ~15 from 2 → 3, ~5 from 3 → 4. This single change does most of the unlock-system work for free, because rarity already gates reveal/unlock decisions in many UI surfaces.

### 2.3 Target & scale distribution

| Target | Count | Comment |
|---|---|---|
| hex | ~52 | Over-served |
| agent | ~22 | Healthy (post-revelation/initiative) |
| location | 4 | Starved |
| sublocation | 4 | Starved |
| artifact | 4 | Starved |
| faction | 1 | Critically starved |
| army | 1 (bind only) | No army-specific verbs |

The catalog says "the world is hexes." That's a designer convenience but not what players will reach for first. Players think in *named places* (the keep, the ruin, the tavern) and *named people* (the witch, the heir). Add 6–10 location verbs and 4–6 faction verbs as the next content push.

### 2.4 Player verb coverage (what kind of god can you be?)

Mapping the catalog to "personas":

- **The subtle god** (Coincidence, Omen, Whisper, Plant Secret, Compose Clue, Whisper Direction): well-served. Strong.
- **The wrathful god** (Smite, Scorch Earth, Rend Earth, Curse, Afflict, Sabotage Initiative): well-served.
- **The kind god** (Bless Land, Seed Life, Cultivate, Inspire, Embolden, Bestow Vision, Sanctify): well-served.
- **The devious god** (Deceive, Plant Secret, Curse, Trap, Sabotage, Incite Unrest): well-served.
- **The patient god** (Cultivate, Anchor Sphere, Bind Echoes, Tap Source): well-served.
- **The chronicler god** (Mark Ground, Plant Dream of Past, Read Stones, Consecrate Past, Whisper Intuition): well-served.
- **The crafter god** (Enchant, Attune, Forge Seer's Token, Forge Instrument, Restore Fragment): under-served — could use 4–5 more verbs (Reforge, Awaken Object, Bind Spirit to Object).
- **The trickster god** (Deceive, Plant Secret, Tip Scales, Curse, Sabotage): well-served.
- **The teacher god** (Whisper Insight, Compose Clue, Listen for a Name, Whisper Intuition): under-served — could use 3–4 more (Send Tutor Dream, Reveal Master, Open the Library).

The catalog covers most personas well. The two thin spots (crafter, teacher) are easy fills.

---

## Part 3: Gaps

Things conspicuously missing from a god-game action catalog:

1. **Faction-internal verbs.** Only Edict and Anoint exist. Missing: Schism, Heresy, Reform, Recover Lost Doctrine, Anoint Successor, Strip Authority, Reveal Corruption, Cause Crisis of Faith.
2. **Time/prophecy verbs.** Coincidence is the only "fate" verb. Missing: Foresee Outcome, Delay the Hour, Hasten the Hour, Echo the Future, Bind a Prophecy.
3. **Death/rebirth verbs.** Smite kills; nothing brings back. Missing: Stay the Hand of Death, Resurrect, Bind a Ghost, Convert a Death to Significance, Steal a Soul.
4. **Cosmic/world-soul verbs.** Tap Source taps; nothing alters the cosmos. Missing: Petition the World-Soul, Carve a New Sphere, Steal Sphere Influence, Kindle a New Domain.
5. **Rival-god verbs.** Taste the Wake detects rivals; nothing acts on them. Missing: Send a Challenge, Mask Your Wake, Erase Their Mark, Steal Their Devotee.
6. **Architecture verbs.** Raise Landmark exists; almost nothing else. Missing: Build a Temple, Raise a Wall, Open a Road, Plant a Forest, Carve a River.
7. **Crafting/object verbs.** Mentioned above — full crafting personas under-served.
8. **Self-actions.** No actions targeting the ascendant themselves. Missing: Meditate (regen essence), Withdraw (skip a tick), Concentrate (next action +tier), Doubt (lose tier, gain insight), Manifest (cosmic-cost reveal).
9. **Failure-recovery verbs.** No "I screwed up, undo" path. Missing: Apologize via Omen, Re-bind a Fading Thread, Rekindle a Disappointed Ally.
10. **Discovery toolkit per layer.** The Ruins layer has 5 perceive verbs — gold standard. Land, Soul, People should each have a 4–6 perceive set. Currently they have 1–3 each, mostly named "Survey/Sense/Scry."

---

## Part 4: Overlaps & Redundancies

Pairs/groups doing essentially the same job. Each is a candidate for collapse, differentiation, or rename.

| Cluster | Members | Recommendation |
|---|---|---|
| Push-a-mortal-toward-action | `divine.persuade`, `divine.inspire`, `action.initiative.inspire`, `action.social.embolden` | Pick ONE generic "nudge" verb at tier 1, differentiate the others by *when* they're available (during initiative, during social encounter) and rename for clarity. |
| Read-a-mortal | `observe_agent`, `scry_agent`, `whisper_insight`, `dream_sending`, `divine.dream` (intervention) | Tier the depth: Observe (cheap, surface), Whisper Insight (motivation), Scry (full read), Dream Sending (psyche). Rename `divine.dream` to "Plant Dream" to distinguish from `dream_sending`. |
| Hex recon | `hex.survey`, `hex.sense_threads`, `hex.divine_populace`, `hex.scry_factions`, `hex.sense_leylines`, `hex.read_currents`, `hex.dowse_resources` | Collapse to 2–3 distinct verbs with sub-targets, OR consolidate into a single "Survey Hex" with mode toggles for what to surface. Currently the player faces analysis paralysis. |
| Land buff/debuff | `hex.bless_land`, `hex.corrupt_land`, `hex.cultivate`, `hex.scorch_earth`, `hex.seed_life` | Bless and Cultivate overlap; Corrupt and Scorch overlap. Differentiate by duration (one-shot vs sustained) and by what specifically changes. |
| Sphere drift | `hex.shift_dominion`, `hex.amplify_flow`, `hex.sever_flow`, `hex.dispel_wild`, `hex.attune_leyline` | Five Soul-layer verbs that all do "change magic flow." Collapse into 2–3 with clear semantics: shift (move), amplify (increase), sever (cut). |
| Anchor/claim | `hex.claim_dominion`, `hex.anchor_sphere`, `hex.bind_echoes`, `hex.shepherd_flock`, `hex.impose_decree` | Five sustained "I own this hex" verbs across layers. The differentiation by layer (land/soul/people/ruins) is good but the names are interchangeable. Use stronger thematic names per layer. |
| Sanctify variants | `sub.sanctify`, `sub.sanctify_tavern`, `loc.place_of_power` | Three "make a place holy/special" verbs. `sanctify_tavern` should not exist as a special-case; merge into `sub.sanctify` with subtype-specific bonuses. |

---

## Part 5: Opportunities

What the audit reveals as free wins or new directions:

1. **Curate a "Starter 12."** Pick the 12 actions that always appear in turn 1 — visible, named, prose-rich, generously documented. Hide the other 87 behind unlock conditions. This single change makes the game *legible* on first contact. Suggested set: Bind Thread (Agent + Location), Survey, Observe, Dream, Persuade, Deceive, Intimidate, Coincidence, Mark Ground, Whisper Direction, Bless Land, Sanctify.
2. **Adopt the 5-action discovery template.** The Ruins/Perceive set is the model. Replicate per layer:
   - Land: Survey, Dowse Resources, Sense Leylines, Read Soil-Memory, Listen for the Land's Mood.
   - People: Divine Populace, Scry Factions, Listen for Grievance, Read the Mood, Hear the Songs.
   - Soul: Read Currents, Sense Leylines, Find the Anchor, Trace Influence Drift, Sense the Block.
3. **Promote sustained control to a separate UI surface.** They're not actions, they're *covenants* — ongoing relationships with the world. Splitting them out lets the action drawer be lean (~15 visible actions) and makes the strategic layer visible.
4. **Rarity recurve.** Re-tag globally (~30/35/25/10 distribution) — done in one PR, unlocks scale immediately.
5. **Faction-action expansion.** Faction is the most under-served target (1–2 verbs). Add a 5–8 action faction toolkit before any new hex actions.
6. **Self-actions slot.** Adding ~4 self-actions (Meditate, Withdraw, Concentrate, Manifest) gives the player turn-economy choices and explains pacing.
7. **Archetype unlock paths.** Tag every action with 1–2 personas (subtle/wrathful/kind/devious/patient/chronicler/crafter/trickster/teacher). A first-run archetype choice unlocks 3 starter actions in that archetype + the generic 12. Cross-run unlocks let the player mix archetypes.
8. **Reach-tier gates.** Many actions list `reach: rune` etc but don't gate by reach tier. Wiring rarity → required reach tier (tier-2 actions need reach tier 1, tier-3 need reach tier 2, etc.) gives natural difficulty progression.
9. **Earned actions via mortal milestones.** Some unlocks should come from the *world* — a bonded agent reaches a milestone, the player gains a related action ("Your champion has earned a name; you may now Anoint"). Found-in-world unlocks beat rogue-like meta-unlocks for narrative weight.

---

## Part 6: Proposed Rogue-Like Unlock Roadmap

The chase outcome is *progressive unlock*. Here's a five-tier framework that maps the existing catalog to a curated player journey.

### Tier S — Starter (turn 1, every run, all players) ~12 actions

The visible action drawer in turn 1. Covers all major target types and the 4 main personas.

- Bind Thread — Agent, Bind Thread — Location
- Survey, Observe, Whisper Intuition (recon)
- Dream, Persuade, Deceive, Intimidate (the four classic agent nudges)
- Coincidence (your signature plausible-deniability verb)
- Bless Land, Mark Ground (your signature cosmic-presence verb)

### Tier E — Early (run hour 1, 1–2 ticks of play) ~20 actions

Unlocked by: first encounter resolved, first thread bonded, first ruin discovered. Discoverable through tutorial-feeling moments.

- Inspire, Embolden, Tip Scales (encounter-time intervention)
- Omen (public broadcast)
- Read Stones, Plant Dream of the Past, Cast Attention, Refine the Hush, Listen for a Name, Read the Threads (ruins discovery loop)
- Compose a Clue, Whisper the Direction (relay)
- Bind Thread — Faction
- Place of Power, Ward, Incite Unrest, Fortify (location toolkit)
- Whisper Insight (motivation read)
- Sanctify, Vision (sublocation)
- Reveal Secret, Call in Favor (info war intro)

### Tier M — Mid (sustained-control becomes available) ~25 actions

Unlocked by: reaching reach tier 2 in any domain, OR claiming first sustained control, OR completing a major mortal arc.

- Sustained controls (cultivate, claim resource, attune thread, tap source, strengthen thread, compel exploration, etc.)
- Cursed/sabotage tools (Curse, Sabotage Initiative, Trap, Plant Secret)
- Soul-layer flow shaping (Shift Dominion, Amplify Flow, Sever Flow, Dispel Wild, Attune Leyline)
- Send Herald, Stir People, Shift Season, Scorch Earth, Bestow Vision, Spark Encounter
- Scry, Dream Sending (deep agent reads)
- Taste the Wake, Desecrate
- Anoint Champion, Divine Edict (faction governance)

### Tier L — Late (signature run-defining moves) ~30 actions

Unlocked by: completing a sustained-control arc, OR earning signature edges from a mortal, OR cross-run unlock.

- Smite, Scatter, Incite Exodus, Forge Instrument
- Anchor Sphere, Channel Current, Forge Seer's Token
- Claim Dominion, Cultivate (the heavy claims)
- Shepherd Flock, Impose Decree, Bind Echoes
- Restore Fragment, Bury the Past, Consecrate Past
- Raise Landmark
- Bind Thread — Artifact (after first artifact discovered)
- Strong Thread — Agent
- Sanctify (special variants if kept)

### Tier X — Cross-run / Meta (the mythic verbs) ~12 actions

Unlocked by: completing prior runs, achieving meta-milestones, OR unlocking sphere mastery.

- Rewrite History (the most god-shaping verb in the catalog)
- Install a Champion (sustained mortal-as-vessel)
- Rend the Earth (catastrophic terraforming)
- Afflict/Bless (direct flesh manipulation; broke "subtle god" pattern)
- (New) Petition the World-Soul, Carve a New Sphere, Steal Sphere Influence, Bind a Prophecy, Resurrect, Mask Your Wake

### Total visible at full unlock: ~99 actions

The player who has done *everything* sees all 99 in their drawer. The first-run player sees 12. Every meaningful play session unlocks 3–10 more.

---

## Part 7: Recommendations Toward the Chase Outcome

Ranked by impact-vs-effort.

1. **(Quick win, high impact) Re-curve rarity tagging.** Re-tag all 99 actions to a 30/35/25/10 distribution. Single PR. Unlocks downstream UI gating immediately. ~2 hours.
2. **(Quick win, high impact) Define the Starter 12.** Pick the 12 starter-tier actions, hard-gate the rest behind a `revealed_at_start: true` flag (or equivalent). Single PR. ~3 hours of curation + small engine change. *This is the single change with the biggest legibility payoff.*
3. **(Medium, high impact) Reconcile reach-domain drift.** Decide rune/time/void canonically (promote or reassign). Update `traits.ts` and any drifting templates. ~half a day. *Open as `UL-proposal` Linear issue first.*
4. **(Medium, high impact) Collapse the recon overlap.** Either merge survey/sense_threads/divine_populace/scry_factions/sense_leylines/read_currents into a unified Survey verb with sub-modes, OR sharply differentiate. Currently it's 6 verbs serving the same player goal. ~1 day design + prose pass.
5. **(Medium, medium impact) Promote sustained controls to their own UI surface.** They are not actions; they are claims. Split visually. ~2 days of UI work; the engine change is small (already separated by `durationMode`).
6. **(Medium, high impact) Wire rarity → reach-tier gating.** Each rarity tier requires a corresponding reach tier in the action's primary reach. ~half a day.
7. **(Bigger, high impact) Faction action expansion.** Add 6–8 faction-target verbs (Schism, Heresy, Reform, Anoint Successor, Reveal Corruption, etc.). Each verb is ~1 hour of authoring. ~1 day total.
8. **(Bigger, medium impact) Location action expansion.** Add 6 location verbs (Bless Harvest, Plague Wells, Open Markets, Curse Roads, Awaken Founder, Build Temple). ~1 day.
9. **(Bigger, high impact) Self-actions.** Add Meditate, Withdraw, Concentrate, Manifest. ~half a day. Crucial for turn-pacing.
10. **(Bigger, signature impact) Adopt the 5-action discovery template per layer.** Each of Land / Soul / People should match the Ruins-layer 5-action discovery toolkit. ~3 days.
11. **(Big, signature impact) Persona / archetype unlock paths.** Tag actions with 1–2 personas; first-run archetype unlocks 3 starter actions in that persona; cross-run unlocks let the player diversify. Design + tagging + UI: ~1 week.
12. **(Long-term) Earned actions from mortal milestones.** Hardest to scope; tightest narrative payoff. The unlock fires *because* of something the world did, not because of a meta-counter. Belongs to a future iteration.

### Definition of done for this audit

This document is the design pass; **none of the recommendations are implemented yet.** The next steps belong on the Linear board:

- One issue per recommendation 1–6 (quick/medium wins).
- Recommendations 7–11 should be grouped into a "Action Catalog Curation" project alongside an unlock-system proposal doc.
- Recommendation 12 belongs in a separate brainstorm before becoming an issue.

---

## Appendix A: Action Count by Category

| Category | Count |
|---|---|
| Base Divine Interventions | 8 |
| Initiative Interventions | 2 |
| Revelation Actions | 4 |
| Thread Creation | 6 |
| Thread Management | 2 |
| Social-Scene Interventions | 2 |
| Secrets & Favors | 3 |
| Faction Actions | 2 |
| Perceive — Ruins | 5 |
| Relay — Ruins | 2 |
| Location | 4 |
| Sublocation | 4 |
| Artifact | 4 |
| Hex (all sub-layers) | ~51 |
| **Total** | **~99** |

## Appendix B: Open Questions for the User

Things this audit deliberately did not answer; flagged for follow-up:

- **Reach domain drift:** rune/time/void — promote or reassign? *(Block on UL-proposal.)*
- **`action.initiative.inspire` cost (12) vs `divine.inspire` cost (1):** intentional? If so, the names need to make this obvious to the player.
- **`sub.sanctify_tavern`:** keep as special-case or merge into generic `sub.sanctify`? Pattern question for all subtype-special actions.
- **Sustained controls in the action drawer or in a separate surface?** Implementation impact varies a lot.
- **First-run archetype choice:** is the design appetite there for it, or does the existing ascendant-identity selection already cover this?
- **Are unlocks per-run (rogue-lite, reset each run with meta-progress) or per-account (persistent)?** The design language ("rogue-like unlocks between rounds") implies per-account meta — confirm.

---

*Audit produced by Cowork, 2026-05-09. To act on findings, open Linear issues per recommendation and apply `plan-pending-commit` label to this document's parent issue so the hourly flush task commits it to `origin/main`.*
