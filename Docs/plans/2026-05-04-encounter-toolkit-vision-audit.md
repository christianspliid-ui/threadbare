# Encounter Build Toolkit — Vision + Canonical Audit (2026-05-04)

**Status:** Critical review of `2026-05-04-encounter-build-toolkit.md` against the Vision layer and the canonical Systems documents in Obsidian. Lands before any long-form design plan is drafted from the toolkit.

**Resolution status (updated 2026-05-04 after user verdict):** All six §9 verdict items are now resolved. Toolkit doc has been edited to reflect resolutions; this audit doc retains the original analysis as a record but the §9 questions are answered below in §10. Required canonical doc updates are tracked in the toolkit's §8.

**Audience:** the user (verdicts on flagged drifts, decisions on open tensions); the next plan author (correctly anchored toolkit).

---

## 1. Sources read

**Vision (the designer's notebook, `Vision/`)**
- `00-north-star.md` — the experience target
- `01-core-loop.md` — the rhythm of scan → encounter → aftermath
- `02-non-negotiables.md` — load-bearing decisions narrated as *why*
- `03-design-tensions.md` — five unresolved tradeoffs we navigate continuously
- `Vision/taste-profile.md` (in Obsidian) — strong opinions, soft patterns, anti-patterns

**Canonical Systems (Obsidian `Systems/`)**
- `Encounter System.md` — `UnifiedActionTemplate` is the format; sigmoid→d100 resolution; aftermathConfig.reactions[] is the primary intervention surface
- `Generalized Action Targeting.md` — TargetContext pattern; one unified template pool; 9 reaches × scaling action vocabulary
- `Domain Word Scales.md` — **nine** reaches with verbal tier scales; no numbers visible to the player
- `Fate Forecast.md` — five-tier forecast (Doomed → Fated); player spends Influence Essence to nudge / amplify / force / block
- `Action Narrative System.md` — agenda picker fires *before* casting; 240 consequence templates; sphere-colored narrative log
- `Intervention Effects.md` — 8 intervention types with per-type decay curves and effects
- `Narrative Engine.md` — three-tier prose engine (Routine / Notable / Chronicle); sphere coloring; voice rules

**Cross-referenced**
- `STYLE.md` (visual style guide) — 4 Foundation + 8 Creation = 12 spheres
- `CLAUDE.md` Load-Bearing Decisions and Rejected Approaches
- The toolkit doc itself (`2026-05-04-encounter-build-toolkit.md`)

---

## 2. Verdict at a glance

| Toolkit claim | Vision / canonical position | Status |
|---|---|---|
| Player verb = "lean on a moment" | "Player is a god, not a protagonist" — interventions shift odds, not outcomes | **✅ Aligned** |
| Scaffold composes any encounter from primitives | Generalized Action Targeting: one unified template pool, target-aware filtering | **✅ Aligned** |
| Hand = ActionDrawer filtered by scene relevance | Anti-pattern: AgentWheel/fixed action count → ActionDrawer. ✓ matches | **✅ Aligned** |
| No numbers visible to player; qualitative tones only | Strong opinion: prose-first UI, taste-profile §1 | **✅ Aligned** |
| Watch-only is first-class; un-intervened story still readable | Vision tension #3: "the player must feel like a god *and* feel the cost of being one" | **✅ Aligned in shape, weak in framing** — see §4.5 |
| Aftermath crystallises change as graph artifacts | Encounter System: `aftermathConfig.reactions[]` with typed effects | **✅ Aligned, but not specific enough** — see §4.6 |
| Failure is a complication, not an ending | Vision tension: "The world resolves, and sometimes the world resolves against them" | **✅ Aligned** |
| Turn-based; world freezes during encounter | Strong opinion: turn-based; world advances on player input | **✅ Aligned** |
| 8 reach domains | **Verdict reversed (2026-05-05): canonical is 8 reaches** after Flesh→Quintessence migration. See `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md`. | **✅ Corrected record** |
| "Spirit reach" used in ritual example | Spirit is a *Creation Sphere*, not a Reach | **❌ Terminology drift — fix** |
| "Voice reach" used in court example | Voice does not exist as a Reach in the canonical scale | **❌ Invented term — fix** |
| Three lean cards per beat | Taste profile: "Three intervention verbs — nudge / whisper / vision. No fourth verb without a Vision audit." | **⚠️ Partial — names not connected** — see §4.1 |
| Lean cost = "small breath / fuller breath / deep draught" | Fate Forecast: Nudge (1 essence) / Amplify (2) / Force (3) / Block (variable) | **⚠️ Vocabulary divergence — see §4.2** |
| Pre-roll lean | Fate Forecast already exists as the canonical pre-roll surface | **⚠️ Toolkit silent on relationship — see §4.2** |
| Agenda picker not surfaced | Action Narrative System: agendas are picked *before* casting | **⚠️ Toolkit silent — see §4.3** |
| 8 Ascendant intervention types in hand | Canonical 8 — Dream, Persuade, Deceive, Intimidate, Inspire, Coincidence, Omen, Afflict-Bless | **✅ Aligned, naming matches** |
| Encounter system uses `UnifiedActionTemplate` | Confirmed — legacy `EncounterTemplate` removed THR-108 | **✅ Aligned** |
| Prose three-tier engine (Routine/Notable/Chronicle) | Narrative Engine canonical | **⚠️ Toolkit silent — see §4.7** |
| Encounter templates = static data; not graph nodes | Toolkit flagged this as a gap | **⚠️ Open question — see §6** |

**Headline:** the toolkit is **directionally correct and structurally aligned**. It carries three concrete drifts that must be fixed (reach counting, terminology), and four canonical-system silences that need reconciliation before a long-form plan is drafted (Fate Forecast, Agenda Picker, aftermath effect kinds, prose engine tiers). It is also weakly framed on the *moral weight* of leaning, which Vision treats as load-bearing.

---

## 3. Strong alignments — what the toolkit got right

### 3.1 The player verb

The toolkit's "lean on a moment" framing maps cleanly to North Star §"What has to be true": *"the intervention shifted the odds, not the outcome"*. The leans-as-tilts model honours both the player's agency and the mortal's sovereignty. The Vision's chosen failure mode is "pure determinism reads as solved puzzles" — the toolkit avoids it by making outcomes uncertain.

### 3.2 The opt-out culture

"Watch only" as a first-class affordance, with the principle *"no act is also a story · the world stays uncertain either way"*, aligns with Vision tension #3 (Divine Remove vs. Player Attachment): the structural distance must persist, attachment must be earned through accumulation, not coerced. The toolkit's insistence that un-intervened encounters produce stories worth reading is exactly the correct counter-pull.

### 3.3 Graph-native primitive vocabulary

The 28-primitive inventory is grounded in `src/types/graph.ts` and existing canonical types. No invented node types. This honours Non-Negotiable #4 (Everything is a graph node/edge) and the load-bearing decision in CLAUDE.md ("No inventing node types without verification").

### 3.4 The hand as ActionDrawer filter

The right rail "Your Hand" is the existing ActionDrawer rebranded for encounter context, with a scene-relevance filter on top. This is exactly Generalized Action Targeting's intended evolution — *"the underlying CRUD Action System and CRUD Action Unification already support generic targetId — the bottleneck is UI wiring, not architecture."* The toolkit doesn't invent a parallel system; it specialises an existing one.

### 3.5 Prose-first UI

Throughout the toolkit, no numbers reach the player. Capability is shown as motes + qualitative descriptor; thresholds as words; outcomes as named bands ("success with weight"). This is the strong opinion in taste-profile §1, and the toolkit honours it consistently.

### 3.6 Turn-based load-bearing

The toolkit assumes turn-based throughout. The encounter screen takes over the viewport; the world freezes; pacing is per-beat, not per-tick. Aligned with `project_turn_based` (settled 2026-04-16) and Vision §"Turn-based is load-bearing".

### 3.7 Cast moves with the protagonist's view

The cast strips show "to her: …" — each cast member's relationship to the protagonist surfaces explicitly. This is the right answer to Vision tension #3's question: how does attachment get earned? Through *seeing the world from her eyes*. The toolkit makes this structural, not narrative-only.

---

## 4. Drifts and contradictions — must be fixed

### 4.1 Lean primitives are not connected to the canonical three intervention verbs

**The drift.** Taste profile §"Three intervention verbs": *"Player actions fall into three verbs with distinct cost and texture. **No fourth verb without a Vision audit.**"* The three are **nudge / whisper / vision**.

The toolkit invented "Stir / Sharpen / Soften" as god-verbs. These map cleanly to nudge / vision / whisper if one squints — Stir-Iron is a *nudge* of resolve; Sharpen-Eye is a *vision* of what's hidden; Soften-Heart is a *whisper* against pride — but the mapping is *implicit*, not stated. Without it, the toolkit reads as if it has invented a parallel verb vocabulary.

**The fix.** Make the three verbs canonical and explicit in the toolkit. Each lean card declares its **verb** (nudge | whisper | vision) and its **sphere flavoring** (Iron, Eye, Heart, etc.). The cards display as: *"Nudge — flavoured Iron — Stir her resolve."* Or, more cleanly, the displayed name is the flavour-text and the verb is a small label. The encounter author picks which 3 of (3 verbs × 9 reaches × scene-relevance) to surface per beat.

**Why this matters.** The taste profile names this as a load-bearing aesthetic decision. "No fourth verb without a Vision audit" — the toolkit's "Stir / Sharpen / Soften" risks being read as four-or-more new verbs, which is exactly what we said we wouldn't do.

### 4.2 Lean costs and Fate Forecast aren't reconciled

**The drift.** The toolkit uses *"small breath / fuller breath / deep draught"* as the cost language. The canonical Fate Forecast uses **Nudge (1 essence) / Amplify (2 essence) / Force (3 essence) / Block (variable)** — these are the magnitude tiers with detection-risk implications. They are not the same vocabulary.

The toolkit also doesn't reference Fate Forecast at all. But the Forecast IS the canonical pre-resolution player-facing surface — five-tier outcome forecast (Doomed → Fated), 2–4 narrative factors explaining why, then the player spends essence to influence. The toolkit's lean cards effectively *replace* the Forecast without saying so.

**The fix.** Two clarifications, both for the long-form design plan:

1. Decide whether the toolkit's lean cards **are** the new Fate Forecast surface, or whether they sit *alongside* it (e.g., Forecast = the qualitative outcome read; lean cards = the verbs you can play). My reading: they should *be* the new Forecast, because the cards already carry the qualitative read of the outcome shape ("tilts toward: a wound, a debt, or his favour earned"). The Fate Forecast doc should be updated or marked superseded.

2. Reconcile the cost language. *"Small breath / fuller breath / deep draught"* is the right Threadbearer voice — Forecast's "Nudge / Amplify / Force / Block" is more spec-flavoured. My recommendation: use the *narrative* cost language player-facing (breath / draught / vow), keep the *mechanical* cost as essence integers underneath, and note in the spec that the words map to the same thing.

**A second issue.** The Fate Forecast also names a fourth verb explicitly: **Block** — *"Cancel action entirely"*. This collides with the taste profile's "no fourth verb without a Vision audit." Either the taste profile needs updating to acknowledge Block, or the Fate Forecast's "Block" needs to be reframed (e.g., Block is not a fourth verb; it's a stronger nudge that pulls a probability all the way to "nothing happens"). This needs a verdict.

### 4.3 The Action Narrative System / agenda picker is not surfaced

**The drift.** The Action Narrative System (canonical, 2026-03-08, `Systems/Action Narrative System.md`) specifies that **before casting any divine intervention, the player picks from 2–4 contextual agendas** generated from the target agent's archetype, values, and the player's sphere alignment. Each agenda shapes what the intervention *means* narratively. The system has 240 consequence templates (8 types × 10 categories × 3 variants).

The toolkit doesn't mention agendas or the AgendaPicker. The lean cards in v7 might be doing the agenda's job (they declare what the intervention means: *"Tilts toward: a wound, a debt, or his favour earned"*) — but the toolkit is silent on the relationship.

**The fix.** Either:

- **(a)** The lean primitives subsume agendas — the lean card *is* the agenda choice. The 240 consequence templates feed the lean card's *what arises in her* and *consequence shape* lines. This is my preferred read.
- **(b)** The lean primitive picks the verb+sphere; an inner AgendaPicker step picks the agenda; the inner step is collapsed/skipped when only one agenda fits. This preserves the existing system but adds a step.

The long-form design plan must pick one. If (a), the AgendaPicker component is removed and the agenda data becomes the prose lookup table for lean card content. If (b), the toolkit's lean card flow is one step longer than v7 shows.

### 4.4 Wrong number of reaches; conflated with spheres

**The drift.** The toolkit doc and several worked examples reference "8 reach domains" and use "Spirit", "Voice", "Shadow" interchangeably as if they were reaches.

**Canonical (Domain Word Scales):** *nine* reaches —
**Iron · Gold · Shadow · Veil · Heart · Eye · Stone · Star · Flesh.**

**Spirit, Voice, Mind, Force, Energy, Life, Time, Entropy, Matter** — these are **Creation Spheres**, not Reaches. There are 12 spheres total: 4 Foundation (Chaos, Order, Light, Darkness) + 8 Creation.

In the ritual worked example, the toolkit's lean *"SPIRIT · open the lantern"* uses Spirit as if it were a reach. It's a sphere. Same for "Voice" in the court example — it's a Creation sphere (specifically the sphere of language and binding), not a reach.

**The fix.** Audit the toolkit's worked examples and lean card examples. Every reach reference must come from {Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star, Flesh}. Sphere alignment is a separate axis — a lean card can declare both *(reach=Heart, sphere=Spirit)*, but they are not interchangeable.

The §6 *Variety Levers* table should also be updated — *"Reach domain selection: any 3 of 8"* should read *"any 3 of 9"*.

### 4.5 The moral weight of leaning is under-framed

**The drift.** Vision Non-Negotiable #1 (Player is god, not protagonist): *"every intervention is a small claim on another being's sovereignty, and the game never lets that choice disappear into mechanics."*

The toolkit's lean cards frame leaning as utility ("tilts toward: a wound, a debt, or his favour earned"). The cost is essence — a *resource* cost. The cards do not frame the lean as a *moral act* — as overriding her will. The fail-forward note ("↗ on fail — a new thread opens") frames failure positively but doesn't encode the moral cost of *succeeding*.

**The fix.** Either via prose discipline or via UI affordance, surface the moral cost. Some options:

- **Prose discipline** in the *agent reaction* line: *"Her shoulders set — at your urging — and she steps forward, though some part of her resists."* The "at your urging" / "though some part of her resists" makes the override visible. Encounter authors should be coached to write this.
- **A small "your hand on her" indicator** when a lean is committed: a brief moment where the player sees that the agent's body was moved by them, not by her. Not a guilt-trip — a recognition.
- **An explicit "she would not have done this" tag** on aftermath registers when an outcome was clearly the result of a lean she resisted internally. This compounds: a player who repeatedly overrides a mortal accumulates a kind of attached weight on that mortal's biography.

Vision treats this as load-bearing. The toolkit should treat it likewise.

### 4.6 Aftermath effects are described, but the canonical effect kinds are not enumerated

**The drift.** The Encounter System canonical lists specific aftermath effect kinds: `reputation_tally`, `reputation_score`, `encounter_seed`, `hidden_mark`, `intelligence`, `condition_attachment`, `recent_event`, `spawn_artifact`, `faction_*`. The toolkit talks about aftermath ("registration moment", "intelligence card materialises", "faction tilt") but doesn't name the canonical effect kinds.

**The fix.** §3.6 of the toolkit should enumerate the existing aftermath effect kinds and map them to v7's "registration" frame elements. Each effect kind has a UI signature (the intelligence card, the faction-chip update, the trait pill, the artifact slide-in). The encounter author specifies *which effect kinds* the aftermath produces; the renderer animates them into the protagonist panel.

This also means the toolkit's "How does she carry this?" big-encounter choice should be expressed in terms of the existing effect-kind vocabulary, not invented effect types.

### 4.7 The three-tier prose engine is not integrated

**The drift.** Narrative Engine canonical: prose has three tiers — **Routine** (template-stitched), **Notable** (enhanced variants for trait acquisitions/criticals), **Chronicle** (LLM-generated for tier-3 events). The toolkit talks about "concrete, particular, sourced" prose without referencing this tier structure.

**The fix.** Specify in the toolkit which beats produce which tier:
- Most beats produce **Routine** prose (the typical action-and-dialogue stuff).
- A beat that triggers a trait acquisition, a critical outcome, or a callback ("she invokes the night Veiren tested her") should escalate to **Notable**.
- An aftermath card for a tier-3 event (a doom escalation, a mandate milestone) might trigger **Chronicle**-tier prose.

The narrative voice rules also need to land: *"2nd person for player actions, 3rd person omniscient for world events, dramatic present for Chronicle."* The toolkit's prose examples are consistently 3rd person past tense — good for world events, but lean cards may want 2nd person ("you nudge her toward the captain's eye") or imperative for the god-verb header.

---

## 5. Vision tensions the toolkit pulls on — where it sits

The Vision lists five tensions we navigate continuously. For each, I read the toolkit's pull and whether the counter-pull is preserved.

### Tension 1 — Expansive ideation vs. tight plans

**Toolkit pulls:** moderately tight. The doc is structured, slot-mapped, contracted. Worked examples are scenarios, not bullet lists.
**Counter-pull preserved:** yes — the *Open questions* section §8 keeps the expansive layer alive. Three confirmed graph gaps (encounter templates, dyadic relationships, divine marks) are flagged for design plan, not silently absorbed.
**Status:** balanced.

### Tension 2 — Systemic emergence vs. authored moments

**Toolkit pulls:** **toward authored moments.** The encounter authoring agent sits at the centre; the world graph is the source pool but the agent does the curation. The lean primitives are author-defined; the cast dispositions per beat are author-defined.
**Counter-pull preserved:** partly. The graph-native primitive references ensure that any graph mutation between encounters reflects in the next encounter's content. But the *origination* of encounters is author-curated, not emergent.
**Status:** drifted slightly toward authorship. The long-form plan should specify how *emergent* encounter triggers (faction conflict reaches a threshold; an agent's vow comes due) feed the encounter pipeline. Otherwise the simulation is producing situations the encounter system can't see.

### Tension 3 — Divine remove vs. player attachment

**Toolkit pulls:** **toward player attachment.** The Eira Hero Panel, big portrait, "to her" relationships, callback notes, identification banners — all designed to make the player feel close to the threaded mortal.
**Counter-pull preserved:** weakly. Watch-only is the structural counter-pull, but the moral-cost framing of leans (see §4.5) is missing. The "your hand on her" recognition isn't there.
**Status:** drifted toward attachment. Needs §4.5's fixes to rebalance.

### Tension 4 — Mechanical legibility vs. narrative mystery

**Toolkit pulls:** **toward legibility.** Capability strips show qualitatively but visibly. Threads in scene state are named. Disposition is shown for every cast member. Tooltips explain everything.
**Counter-pull preserved:** weakly. Vision §4 specifically says: *"Some systems (essence economy, intervention costs) probably need to be more legible than we currently surface. Others (foundation-sphere interactions, deep cosmology) probably should stay mysterious longer than we instinctively want to reveal them."*

The toolkit makes essence costs legible (good). It also makes the trader's hidden cargo legible via tooltip on first appearance — *should* it? The Vision asks: should we reveal what's hidden before the player has earned the seeing?
**Status:** moderately drifted. Recommend: tooltips reveal context only at the player's invocation (hover) — but some tooltips should *only become available* after a relevant intervention or perception action. A "hidden cargo" tooltip that's available always defeats the discovery loop.

### Tension 5 — One perfect story vs. portfolio breadth

**Toolkit pulls:** **toward one story.** The encounter UI is single-protagonist, single-scene. The Divine Court was deliberately removed from the encounter view (v5).
**Counter-pull preserved:** yes — the right rail still has the Cast (the present scene's many participants), and the toolkit acknowledges in §6 that cast can scale to 6+ with scrolling. Portfolio rendering happens *outside* the encounter (on the world view / scan surface).
**Status:** balanced for the encounter surface. The portfolio question is for a different design.

---

## 6. Silences — things the toolkit doesn't say that it should

1. **The relationship to the Fate Forecast surface.** Either superseded, integrated, or coexistent — must be picked.
2. **The relationship to the Action Narrative System / AgendaPicker.** Subsumed, sequenced after, or removed — must be picked.
3. **The relationship to Intervention Effects per-type decay.** When the player plays *Send a sign* (`divine.omen`), the canonical intervention has an 8-tick decay with reduced strength (0.6×). The toolkit doesn't say how this surfaces in subsequent beats of the same encounter, or in following encounters. Does the omen still "echo" two beats later? Three encounters later? The decay must be visible somewhere.
4. **Detection escalation.** Fate Forecast canon: *"each intervention triggers a detection check"* — alert mortals or rivals can notice. The toolkit's hand panel doesn't show detection risk per card. Vision-aligned answer: detection is a slow-build texture, mostly invisible per-action; surfaces when crossed. But the toolkit should at least nod to it.
5. **Encounter selection / why this beat now.** Encounter System canon: candidate generation, axiological scoring, attention-tier gating. The toolkit assumes the encounter is *given* — it doesn't address how the system picks which encounter to surface next from the agent's state. This is a design plan question.
6. **Three-tier prose engine integration.** §4.7.
7. **Aftermath effect kinds enumeration.** §4.6.
8. **Sphere coloring of prose.** Narrative Engine: foundation sphere tints vocabulary (Chaos = wild; Order = structural; etc.). The toolkit's prose examples use sphere-flavoured verbs (Stir = Iron-coded) but don't acknowledge the broader vocabulary tinting system.

---

## 7. Recommended changes to the toolkit

Concrete edits to bring the toolkit into alignment, in order of severity.

| Severity | Change | Section to edit |
|---|---|---|
| **Critical** | Fix reach count (8 → 9) and add Flesh to reach references | §6 Variety Levers; §3.1 Eira Hero Panel; ritual worked example |
| **Critical** | Replace "Spirit reach" / "Voice reach" with correct reach references (Heart/Star/Veil) and explicit sphere alignment as a separate axis | §5.3 Court intrigue; §5.4 Ritual |
| **Critical** | Connect lean cards to canonical three intervention verbs (nudge / whisper / vision); display verb explicitly on each card | §3.2 Active Card; §4 Authoring Contract |
| **Critical** | Reconcile lean costs with Fate Forecast vocabulary; pick (a) supersedes Forecast or (b) coexists; document | §3.2; new section bridging to Fate Forecast |
| **Critical** | Decide AgendaPicker fate: (a) subsumed by lean cards, or (b) sequenced after | §3.2; §4 Authoring Contract |
| **High** | Enumerate aftermath effect kinds from canonical Encounter System and map to v7 registration frame | §3.6; §4 Aftermath section |
| **High** | Surface moral weight of leaning via prose discipline + a "your hand on her" indicator | §3.2 lean cards; new "moral framing" section |
| **High** | Integrate three-tier prose engine (Routine / Notable / Chronicle) | §3.2; new "prose tier" section |
| **Medium** | Specify how intervention decay surfaces across beats and encounters (echoing omens, lingering blessings) | new "between-beats" section |
| **Medium** | Address tooltip availability — some context tooltips should be locked behind perception/intervention | §3.2 prose tooltips |
| **Medium** | Acknowledge encounter selection / candidate generation as upstream system | §1 Premise |
| **Medium** | Acknowledge sphere coloring of prose vocabulary | §3.2 prose |
| **Low** | Note detection escalation as out-of-scope but real | §6 Variety Levers |

---

## 8. Required canonical updates (if the toolkit is approved)

The toolkit's adoption changes the canonical shape of the encounter and intervention surfaces. The following canonical docs need updates as part of the long-form design plan, not as a follow-up:

1. **`Systems/Fate Forecast.md`** — either superseded by the v7 encounter UI, or repositioned as the "outcome forecast" model that v7 leans inherit. If superseded, mark the doc as such with a forwarding link.
2. **`Systems/Action Narrative System.md`** — the AgendaPicker either becomes the lean primitive picker (and the doc renames the surface), or it's removed (and the agenda data becomes the prose-table lookup feeding lean cards). Either way the doc needs an update.
3. **`Systems/Encounter System.md`** — should reference the v7 player-facing UI as the canonical encounter rendering surface (currently silent on UI).
4. **`Systems/Intervention Effects.md`** — likely fine as-is; the per-type decay model continues to apply. May need a note on how decay surfaces in subsequent encounter beats.
5. **`Vision/taste-profile.md`** — needs decision on Block as a fourth verb. Either: (i) Block is documented as a stronger nudge (no fourth verb, taste profile updated to clarify); or (ii) Block is acknowledged as a fourth distinct verb (taste profile updated to four verbs, with rationale).
6. **A new `Systems/Encounter UI.md`** — the v7 surface, the slot mapping, the registration animations. Currently this knowledge lives in plan docs; promotion to canonical is part of shipping.

These updates are scope-blocked by Definition of Done: *"if your design contradicts a Vision premise, the Vision edit is part of this ticket's scope"* (Non-Negotiable #5; CLAUDE.md Design Governance).

---

## 9. Verdict question for the user *(superseded — see §10)*

The original §9 listed six decisions. They were all answered in the user's reply on 2026-05-04. See §10 for the resolutions.

---

## 10. Resolutions (2026-05-04)

The user's verdicts on the six §9 questions, plus the new principle that came out of the AgendaPicker discussion.

### 10.1 Three intervention verbs — DISSOLVED

User: *"the intervention verbs should not be only three reused again and again. the ones you invented stylistically fit, but it should be an encounter content task to define the encounter specific verbs. there is no connection to the three intervention verbs. i see this as solved."*

**Outcome.** No fixed three-verb vocabulary. Encounter authors write god-verbs per scene. The taste-profile §"Three intervention verbs" hypothesis is retired. Toolkit Rule 3 codifies this.

### 10.2 Fate Forecast — SUBSUMED

**Outcome.** v7 lean cards subsume Fate Forecast. The five-tier qualitative read becomes a one-line *outcome forecast band* above the prose, computed from the engine's sigmoid output. Detection escalation moves to scene state as a slow-build thread. The legacy `Systems/Fate Forecast.md` doc gets superseded as part of the long-form plan ticket scope.

### 10.3 AgendaPicker — DISSOLVED

User: *"the agenda picker is boring tbh. just a lot of really short lyrical blurbs."*

**Outcome.** AgendaPicker UI surface removed. The 240 consequence templates remain — they become the engine's prose-lookup table. The player no longer picks between flavor variants of the same intervention. Hand cards click direct.

This led to a new load-bearing principle (Rule 1):

> **Player choices in the encounter UI must change the path, not just the adjective.**
> If three options collapse to "same outcome, different prose," cut to one and let the engine pick the prose from scene context.

### 10.4 Block as a fourth verb — NON-ISSUE

**Outcome.** With §10.1 settled (no fixed verb count), Block is no longer a "fourth verb" problem. Watch-only is the Watcher's verb (meta-axis: Vanguard ↔ Watcher / Courage ↔ Prudence per the cosmological pattern).

### 10.5 Moral weight of leaning — STRUCTURAL

User pointed to `Brainstorms/brainstorm-cosmological-symmetry.md` for the resolution.

**Outcome.** The brainstorm settled the 1:1 sphere↔reach pairing and the archetype-pair moral axes. Every reach lean now tilts the agent toward an archetype pole (Iron → Conqueror, Heart → Renegade, etc.). The accumulating drift across encounters is the moral cost of being a god — surfaced on each lean card (`↬ tilts toward CONQUEROR`) and as a cumulative drift indicator in scene state. **Made structural, not added as guilt UI.** Toolkit Rule 2 codifies this.

### 10.6 Reach count — 8, NOT 9

User: *"flesh is out and has been converted to quintessence."*

**Outcome.** Confirmed 8 reaches: Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star — paired 1:1 with the 8 Creation Spheres (Force, Life, Entropy, Mind, Spirit, Energy, Matter, Time respectively). Flesh is retired; Quintessence is a meta-property (phase-transition threshold), not a reach. The `Systems/Domain Word Scales.md` canonical doc is stale and needs updating as part of the long-form plan ticket scope.

### 10.7 Worked example terminology fixes

The court intrigue's "Voice reach" was an invention; the ritual's "Spirit reach" was a sphere mistakenly labelled as a reach. Both fixed in the toolkit:
- Court: STAR replaces VOICE (Time sphere — Sacrifice/Survival → Martyr/Survivor archetype pair fits "speak when not asked at court")
- Ritual: HEART replaces SPIRIT (Heart's 1:1 pair IS Spirit; sphere coloring is automatic from the reach label)

---

## 11. State after resolutions

**Toolkit edits applied:** §1.1 (three load-bearing rules added: path-over-adjective, moral-axis-structural, encounter-specific-verbs), §2 (reach domain row clarified, Quintessence row added), §3.2 (outcome forecast band added, lean primitives spec expanded with moral-axis pole), §3.5 (detection thread + cumulative drift indicator added), §4 (lean schema includes `moral_axis_pole`), §5.1 / §5.2 / §5.3 / §5.4 (worked examples updated with `↬ tilts toward …` lines and reach corrections), §7 (workflow notes that hand cards click direct), §8 (resolved questions split out, canonical doc updates listed), §9 (cleaned up).

**Canonical doc updates required** (part of long-form plan ticket scope per Vision Non-Negotiable #5):
1. `Systems/Domain Word Scales.md` — update to 8 reaches + Quintessence (per `Brainstorms/brainstorm-cosmological-symmetry.md`)
2. `Systems/Fate Forecast.md` — supersede; forwarding link to new Encounter UI canonical
3. `Systems/Action Narrative System.md` — clarify that AgendaPicker UI surface is removed; agenda data persists as engine prose-lookup
4. `Vision/taste-profile.md` — soften §"Three intervention verbs" strong opinion. Replace with: *"verbs are encounter-specific, anchored in the cosmological pattern of reach + sphere + moral axis."*
5. New `Systems/Encounter UI.md` — promote v7 + toolkit to canonical at the end of the long-form plan ticket

**Ready for next phase:** the long-form design plan can now be drafted with a Vision-aligned, canonical-anchored toolkit as input. Engine/Content/UI pillars, NFP-compliant, with the seven still-open questions (encounter templates as graph nodes, relationship state as primitive, divine marks as distinct primitives, item consumption in leans, cast scaling, place-of-power affordance, off-stage cast representation) resolved into decisions.
