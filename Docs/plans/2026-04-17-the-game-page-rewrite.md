# the-game.html — Landing Page Rewrite

**Date:** 2026-04-17
**Status:** Design (Cowork) — pending review, then CC-implementable
**Scope:** `public/the-game.html` (marketing landing, deployed at threadbearer.co/the-game.html)
**Why now:** Current page was written against an earlier civ-builder framing. Last two weeks of design work (turn-based decision 2026-04-16, core loop 2026-04-16, god-not-protagonist feedback, design quality gate) have sharpened the core USP in ways the page doesn't yet reflect.

---

## 1 · What's wrong with the current page

The current page is aesthetically strong — keep the parchment/gold/cosmos palette, serif + mono typography, art-full sections, grain overlay, scroll reveals, sphere strip. The visual language is on-brand. **The copy is off-USP.**

### 1a · Misframings

| Current line | Mismatch | Canonical |
|---|---|---|
| "A god-game of emergent myth" | Vague, indistinguishable from a dozen sim-lite pitches. | The game's USP is *stories about specific mortals*, not emergence-in-general. |
| "You are a god. The world is yours to shape." | Civ-builder framing. Reads like Black & White / Reus / From Dust. | You are a god who *follows* interesting mortals, not shapes the world. The world is the *stage* for their stories. |
| "Build civilizations. Forge empires. Wage wars." | Three verbs the player does not do. The player doesn't build anything — the *world* builds, the player *watches and nudges*. | Player verbs are whisper, nudge, vision, dream, withhold. Never "build." |
| "Your divine mandate defines what kind of god you are this time. Build a trade empire. Shepherd a mortal to ascension. Unite warring kingdoms." | Mandates framed as civ-management goals. | Mandates are narrative scaffolds for protagonist stories. Closer to "Keep the first mortal alive long enough to reach the Crown" than "Build a trade empire." |
| "43 divine actions across four narrative layers." / "Eight intervention types." / "64+ encounter templates." / "19 narrative archetypes." / "Seven doom archetypes." | Numeric boasts. Reads like a Steam store feature list. Violates prose-first principle — numbers break immersion on the *marketing page too*. | Qualitative descriptions. "Whispers that become prophecies. Dreams that become convictions. Withholdings that become crises of faith." |
| "The Doom Clock counts down to the Unmaking … you must complete your mandate before everything you've built is unmade." | Urgency/race framing conflicts with turn-based decision. Suggests real-time pressure the game explicitly rejects. | The Unmaking is *the shape of an age*, not a ticking clock. "Every age ends. Your god has one age to matter in." |
| Pillar order: Divine Power → Living World → War & Ruin → Mortal Lives | Mortals last. The most distinctive pillar is buried. | Protagonists first. They *are* the game. |

### 1b · Missing beats

- **The three-beat core loop** (portfolio scan → curated encounter → aftermath) is nowhere on the page. This is the actual game loop and the most concrete thing we can show a new visitor.
- **Cool failure** — "failure is a story turn, not a loss state" — is the single most novel design claim and it isn't mentioned.
- **The Malazan-style protagonist portfolio** — multiple interleaving stories, 1 growing to 4-5 — isn't articulated.
- **Turn-based** isn't stated. A visitor today would reasonably infer real-time from "the clock is always ticking."

### 1c · What stays right

- Visual language (parchment/ink/gold/cosmos, Cormorant/DM Sans/Fira Code, grain, scroll reveals, art-full sections, sphere strip).
- "Stories, not spreadsheets" promise — keep verbatim, it's already the single best line on the page.
- Hero composition (dark atmospheric background, gold wordmark, italic tagline, Fira Code CTA).
- Architecture of pillars (img + text, alternating, full-bleed rows). Just reorder and rewrite.

---

## 2 · New positioning

**One-line pitch (hero tagline):**
> A turn-based god-game of mortal stories in a living world.

**Elevator (pitch section lead):**
> You are a new god, watching a world you didn't make. A handful of mortals catch your eye — a swordbearer, a scholar, a refugee. You follow their lives like chapters of a book, and when the moment matters you whisper, nudge, or send a dream. Their choices are theirs. The story becomes yours.

**The three verbs the player does:**
1. **Watch** — read the state of your protagonists at a glance. A line of prose tells you more than a stat block.
2. **Enter** — when an encounter surfaces, time functionally slows. A small dilemma unfolds. Read it like a short story.
3. **Whisper** — spend essence to tilt the scales. A dream. A conviction. A vision. The mortal still decides. You just weighted the choice.

---

## 3 · New page structure

```
1. Hero                        [keep composition, new tagline]
2. Pitch                       [new opening — protagonist-first]
3. Art-full (grassland)        [keep, new quote]
4. The Loop                    [NEW — three-beat core loop]
5. Four Promises               [rewrite all four]
6. Pillar 1 · Your Protagonists       [PROMOTED from old Pillar 4]
7. Pillar 2 · Your Whispers           [rewritten from old Pillar 1 "Divine Power"]
8. Sphere strip                       [keep as-is]
9. Pillar 3 · The World Around Them   [merged old Pillars 2 + 3]
10. Art-full (temple)          [keep, new quote]
11. Pillar 4 · The Unmaking    [PROMOTED from feature — reframed as structural]
12. Features                   [trim — numeric boasts out, qualitative in]
13. Art-full (capital)         [keep, new quote]
14. Closing                    [new copy, same CTA]
15. Footer                     [keep, minor tagline tweak]
```

### Why this order

A first-time visitor should leave knowing three things: **(1)** the game is about following specific mortals, not building an empire; **(2)** the core loop is scan → encounter → aftermath; **(3)** failure is interesting, not punishing. The old page buried (1) at Pillar 4 and never said (2) or (3).

The new order front-loads the human — *Your Protagonists* — before the cosmic machinery. A player cares about Kael Thornweaver before they care about the Spirit sphere. The world sections come after, framed as the stage, not the subject.

---

## 4 · Section-by-section copy

### 4a · Hero

- **Wordmark:** unchanged.
- **Tagline:** `A turn-based god-game of mortal stories in a living world.`
- **CTA:** `Enter the World` → `/?view=game` (unchanged).
- **Scroll hint:** `Scroll to begin`

### 4b · Pitch section

- **Tag:** `The Premise`
- **H2:** `You are a new god.<br>The world is <em>already alive.</em>`
- **Lead:** `A handful of mortals catch your eye — a swordbearer whose first fight is still ahead, a scholar on the trail of a word nobody should remember, a refugee walking the wrong way up a cold road. You follow their lives like chapters of a book. When the moment matters, you whisper, nudge, or send a dream. Their choices remain their own. The story becomes yours.`

### 4c · Art-full (grassland) — new quote

`"You did not make this world. You will not outlast it. What passes between — those are the stories worth bearing."`

### 4d · The Loop — NEW SECTION

This is the single most important addition. It's a three-column (stacks on mobile) layout that names the beats. Suggested copy:

- **Tag:** `The Core Loop`
- **H2:** `Scan. Enter. <em>Whisper.</em>`
- **Lead:** `Threadbearer is turn-based. Each turn is yours. No clock runs while you think.`

Three beats, each with a small Fira-Code numeral, a serif title, and two lines of prose:

**01 · Scan**
*How are my people doing?* Read your protagonists at a glance — a line of prose, not a stat block. Thriving, steady, struggling, in crisis. You feel the shape of their week without a menu.

**02 · Enter**
*The moment that matters.* When a significant encounter surfaces for a protagonist, the game pulls you in. A short branching scene. Real dilemmas. No obvious right answer. Read it like a chapter.

**03 · Whisper**
*Tilt the scales.* Spend essence to weight a choice — a dream, a conviction, a vision. Or stay silent and watch. The mortal still decides. The outcome is still theirs. The story is still ours.

Visual note: use the existing `.features` 3-column grid but at larger type, with serif numerals and a faint gold top rule per column. No icons. Keep it sparse.

### 4e · Four Promises — rewrite all four

Keep the `.promises` grid. Replace all four cards.

**Promise 1 — Stories you didn't write**
> The game watches your protagonists and surfaces the moments that matter. You don't pick from a menu of scripted events — you meet the story the simulation grew. Same seed, same world. Different choices, different myth.

**Promise 2 — Failure is a story turn**
> Your swordbearer loses to the goblin boss. He doesn't get a game-over — he gets captured, thrown in a dungeon, and comes back thirty turns later with his pride shattered, his sword gone, and a pact he shouldn't have made. That's not losing. That's the next chapter.

**Promise 3 — You whisper. You don't command.**
> You are a god, not a general. You don't move units or click abilities. You dream prophecies into a sleeping mind. You withhold a sign when a mortal begs for one. You send a stranger down the road at exactly the wrong moment. They choose. You choose what to let them see.

**Promise 4 — Stories, not spreadsheets** *(keep verbatim)*
> You'll never see a stat block. Your agents have character, not numbers. A merchant isn't "Gold: 7" — she's "a shrewd trader whose ambition outpaces her caution." The world speaks in prose. You read stories, not data.

### 4f · Pillar 1 · Your Protagonists (promoted)

- **Img:** `/concept-art/locations/shrine.png` (current Pillar 4 image — keep)
- **Tag:** `Your Protagonists`
- **H3:** `A small circle of mortals <em>worth watching</em>`
- **Body 1:** `You begin with the First — the mortal whose story defines your reign. Maybe a swordbearer raised in a fishing village. Maybe a scholar who remembers the wrong language. You meet them through a handful of dilemmas that reveal who they already are, and thread your influence to their life.`
- **Body 2:** `Over time you acquire more. Two. Three. At peak perhaps five, their stories running in parallel like chapters that braid. This is Malazan, not a roster. You follow them the way a novelist follows characters — with affection, with worry, with the occasional quiet ruin.`
- **Detail:** `Hero's journey arcs. Axiological profiles — values, ambitions, fears, cooperation habits. Familiarity-gated revelation: you learn who they are by living alongside them.`

### 4g · Pillar 2 · Your Whispers (rewritten "Divine Power")

- **Img:** `/backgrounds/court/spirit.png` (keep)
- **Tag:** `Your Influence`
- **H3:** `Whisper into the mind of a <em>sleeping hero</em>`
- **Body 1:** `Divine actions are small. A dream on the night before a decision. A sign at the crossroads. A conviction that arrives unbidden. A withholding — the refusal to answer when prayed to. You spend essence. The mortal weights the choice. Neither of you is in charge.`
- **Body 2:** `Your reach widens with the age. Early on you can nudge one mortal through one crisis. Later — if the age lasts — you can weave prophecies across a generation, curse a bloodline, or let a dream leap from one sleeper to another.`
- **Detail:** `Divine actions across four narrative layers — Land, Soul, People, Ruins — from a whispered conviction to a curse that outlives the one who spoke it.`

### 4h · Sphere strip

Keep unchanged. Eight cells, creation spheres only. Elder magic stays hidden — it's a late-age discovery, not a marketing beat.

### 4i · Pillar 3 · The World Around Them (merged Living World + War & Ruin)

- **Img:** `/concept-art/locations/city.png` (keep)
- **Tag:** `The World`
- **H3:** `The stage on which their stories <em>play out</em>`
- **Body 1:** `Settlements grow from hamlets to cities. Guilds form and scheme. Trade routes thread between capitals and decay when war arrives. Armies march under faction champions with their own goals. None of it is about you. Your protagonists live inside it — and the world's weather is also their weather.`
- **Body 2:** `When a siege ends badly, your scholar's library burns. When a guild rises, your swordbearer finds new employers. The world is not decoration. It is what happens to the people you care about.`
- **Detail:** `Faction-driven warfare, siege and sack, dynamic prosperity, trade route decay, settlement promotion and demotion. All feeding the protagonists' situations, not parallel to them.`

### 4j · Art-full (temple) — new quote

`"Nine spheres of creation. Nine reaches of mortal endeavor. One age, and everyone alive inside it."`

### 4k · Pillar 4 · The Unmaking (promoted from Features, reframed)

- **Img:** `/concept-art/locations/battleground.png` (repurpose the old War & Ruin image — the battleground works as age's-end imagery)
- **Tag:** `The Unmaking`
- **H3:** `Every age <em>ends.</em>`
- **Body 1:** `Every world has an Unmaking — the shape that an age bends toward as it runs out of breath. It is not a ticking clock. It is the grammar of the run. The Breach. The Convergence. The Failing. The Sundering. Each is a distinct kind of ending, with its own slow and thematic escalation.`
- **Body 2:** `This is not a race. The game is turn-based — each turn is yours to take. But the age you are living in is finite, and the weather thickens as it closes. The question isn't whether you finish in time. The question is what story your protagonists leave behind when the age is done.`
- **Detail:** `Seven Unmaking archetypes, each with a five-stage thematic arc that changes how the world speaks as the age ends.`

### 4l · Features — trim

Keep the `.features` 3-column grid. Replace all six cards to strip numeric boasts and reframe qualitatively.

| Feature | New copy |
|---|---|
| **Seeded Determinism** | Every world is reproducible. Share a seed, play the same world. The same choices produce the same outcomes — but different choices unfold entirely new histories. |
| **Graph-Native World** | Every entity, relationship, and effect lives in a single graph. Armies, alliances, trade routes, curses, oaths — same structure, queryable, traceable. If you can read it, the game can reason about it. |
| **Procedural Hex World** | Procedurally generated maps with realistic climate, biomes, rivers, and coastlines. Mountains form ranges. Rivers flow downhill. Deserts form in rain shadows. The world you watch is the world the simulation grew. |
| **Curated Encounters** | The game watches its own simulation and surfaces encounters when they matter most for your protagonists. Branching multi-beat scenes, not single-roll events. Cultural overlays, difficulty tiers, outcomes that ripple. |
| **Factions and Guilds** | Guilds, cults, orders, and factions form on their own. They recruit, assign quests, promote the loyal, and feud. Your protagonists fall in and out with them — and the player sees it all through prose. |
| **The Doom Clock** → rename **Ages and Their Endings** | Each age has an Unmaking — a thematic shape it bends toward. A five-stage arc changes the world's voice as the age closes. You don't race the clock; you live inside it. |

### 4m · Art-full (capital) — new quote

`"What kind of god will you be — to them?"`

(Small change from the current "What kind of god will you be?" — adds *to them*, which is the whole USP in two words.)

### 4n · Closing

- **H2:** `The world is waiting.<br>It doesn't know <em>their names yet.</em>`
- **Body:** `Threadbearer is for people who loved reading Malazan more than winning Crusader Kings, who remember a Dwarf Fortress story better than a Dwarf Fortress victory, and who think the best fantasy is the kind that surprises the author. Bring your patience. Bring your affection for characters you didn't write. The first mortal is waiting.`
- **CTA:** `Play Now` → `/?view=game` (unchanged).

### 4o · Footer

`Threadbearer — The Fantasy World Simulator · A turn-based god-game of mortal stories · In development`

---

## 5 · What's being cut

| Cut | Why |
|---|---|
| "Build civilizations. Forge empires. Wage wars." | Civ-builder framing. Player doesn't do any of those. |
| All numeric boasts (43, 64+, 19, 7, 8) | Prose-first applies to the marketing page too. Numbers are for devs, not the storefront. |
| "The clock is always ticking" language | Conflicts with turn-based. Reframed as structural shape of an age. |
| Pillar "War & Ruin" as standalone | Folded into "The World Around Them" — war is a condition protagonists live through, not a game mode the player controls. |
| "Mortal Lives" as the fourth/last pillar | Promoted to first pillar under "Your Protagonists." |

## 6 · What stays (verbatim or near-verbatim)

- Visual language: all CSS variables, fonts, grain overlay, scroll reveal animation.
- Sphere strip (8 creation spheres).
- "Stories, not spreadsheets" promise — already canonical.
- Hero composition and layout.
- `.pillar`, `.pillar.reversed`, `.art-full`, `.features`, `.promises` component CSS — structure unchanged, content swapped.

## 7 · Visual additions (small)

- A new "Core Loop" section between Pitch and Four Promises. Uses the existing `.features` 3-column grid CSS. No new assets needed. Optionally: a thin gold vertical rule between columns, and large Fira-Code numerals (01 / 02 / 03).
- Nothing else new. No new images, no new CSS components.

## 8 · Risks / open questions

1. **"Your Whispers" as a pillar title** — risks sounding airy. Alternative: "Your Hand." "Your Thread." Decide on voice before implementation. Current pick: *Your Whispers*, because it preserves the whisper-not-command framing in the title itself.
2. **"Malazan, not a roster"** — copy explicitly names Malazan. Strong for the target reader (middle-aged fantasy reader per design direction); potentially alienating for someone who hasn't read it. Recommendation: keep the reference in the closing ("loved Malazan more than winning Crusader Kings") where it's useful as an alignment signal. Drop the explicit "Malazan" from Pillar 1 body, where the structural claim alone is enough.
3. **"Cool failure" example in Promise 2** — uses a swordbearer + goblin boss + pact scenario that isn't tied to any real content. Could be replaced with a scenario that maps to an actual in-game encounter if one reads well enough. Ask the user.
4. **Elder magic** — per clarification, stays hidden. No hint in the copy. If that changes, add a line to Pillar 4 ("Some things wake up only as the age closes — elder things, older than spheres.").

## 9 · Implementation plan for CC

This is a pure copy + section-reorder change to one file: `public/the-game.html`. No new CSS needed beyond optional numeral styling for the new Loop section. No new assets. No build-config change. Ships on any push to main (Vercel auto-deploy).

Steps for CC:
1. Open `public/the-game.html`.
2. Replace hero tagline.
3. Replace Pitch section H2 and lead.
4. Replace Art-full #1 quote.
5. Insert new "The Loop" section after Art-full #1 (reuse `.features` grid, 3 cards, serif numerals).
6. Replace all four `.promise` cards (copy verbatim from §4e).
7. Reorder pillars: old Pillar 4 (Mortal Lives) → new Pillar 1; rewrite heading + body + detail per §4f.
8. Rewrite old Pillar 1 (Divine Power) → new Pillar 2 (Your Whispers), §4g.
9. Sphere strip unchanged.
10. Merge old Pillar 2 (Living World) + old Pillar 3 (War & Ruin) into one new Pillar 3 (The World Around Them), §4i.
11. Replace Art-full #2 quote.
12. Insert new Pillar 4 (The Unmaking), §4k, using `/concept-art/locations/battleground.png`.
13. Replace all 6 feature cards per §4l.
14. Replace Art-full #3 quote.
15. Replace closing H2 and body per §4n.
16. Update footer tagline.
17. Run `npx vite build` to confirm build still passes (HTML in `public/` is copied as-is, but confirm Vercel will deploy).
18. Commit: `docs: rewrite the-game.html around protagonist-portfolio USP` with `Fixes THR-XX` if a Linear issue exists.

---

## 10 · Summary

The current page sells a civ-builder god-game. Threadbearer is a protagonist-portfolio god-game. This update reframes the copy around the design direction we settled this month: turn-based, scan → enter → whisper, cool failure, the god watches stories rather than building empires, the Unmaking is structural, prose over numbers on every surface including this one.

The visual system is already correct. This is a copy and ordering change, not a redesign.
