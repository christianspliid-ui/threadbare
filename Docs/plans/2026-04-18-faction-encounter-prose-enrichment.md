# Faction Encounter Prose Enrichment — Voice Bible, Systemic Wiring, and Phased Migration

> **Linear:** THR-31 (TB-094) · Social Systems Expansion
> **Date:** 2026-04-18
> **Status:** Design — ready for phased dev handoff
> **Blocker cleared:** THR-110 (enrichProse wired into unified adapter) merged 2026-04-16

---

## 1. Problem Statement

The game has eleven canonical factions defined in `src/data/faction-definitions.ts` and eleven matching encounter-content files in `src/data/*-encounter-content.ts`. The total template count across those files is ≈150.

Three of those files (Thieves Guild, Arcane Circle, Civic Guard) were migrated to the new `UnifiedActionTemplate` format during THR-89/91/92. Of the migrated three, only **Thieves Guild** actually has Threadbare-voiced prose. The other two have the richer *structure* but still carry functional placeholder text in the narrative fields.

The remaining eight faction files still use the legacy `EncounterTemplate` shape. Their prose is an inventory of facts — "The temple requires a night vigil. Stand guard against desecration." / "You doze off. The temple master is disappointed." Every step reads the same regardless of who the agent is, what they carry, or what they've done. No `{name}`, no `{location}`, no conditional blocks, no aftermath seeds, no hidden marks.

**Two problems stacked on top of each other:**

1. **Structural debt** — eight of eleven faction files need to move from `EncounterTemplate` to `UnifiedActionTemplate` before they can carry enrichment and systemic consequences at parity with the rest of the encounter catalog.
2. **Voice debt** — every faction encounter needs a distinct, repeatable voice that tells you which faction you're in after the first sentence.

"Prose enrichment" as written in the issue is the second problem. The first is the prerequisite. Ignoring the migration and writing voiced prose into the legacy shape would strand the prose the next time a migration pass lands. This design doc treats them as one job.

---

## 2. Scope

**In scope — 11 canonical faction files:**

| # | File | Faction | Current state | Templates |
|---|------|---------|---------------|-----------|
| 1 | `thieves-guild-encounter-content.ts` | Thieves Guild | Unified + voiced ✅ | ~15 |
| 2 | `arcane-circle-encounter-content.ts` | Arcane Circle | Unified, placeholder prose | ~15 |
| 3 | `civic-guard-encounter-content.ts` | Civic Guard | Unified, placeholder prose | ~15 |
| 4 | `holy-order-dawn-encounter-content.ts` | Holy Order of the Dawn | Legacy, placeholder prose | ~13 |
| 5 | `underking-court-encounter-content.ts` | Underking Court | Legacy, placeholder prose | ~13 |
| 6 | `builders-fellowship-encounter-content.ts` | Builders Fellowship | Legacy, placeholder prose | ~13 |
| 7 | `ranger-brotherhood-encounter-content.ts` | Rangers Brotherhood | Legacy, placeholder prose | ~13 |
| 8 | `merchant-consortium-encounter-content.ts` | Merchant Consortium | Legacy, placeholder prose | ~13 |
| 9 | `mercenary-encounter-content.ts` | Mercenary Company | Legacy, placeholder prose | ~13 |
| 10 | `lorekeepers-covenant-encounter-content.ts` | Lorekeepers Covenant | Legacy, placeholder prose | ~13 |
| 11 | `temple-of-spheres-encounter-content.ts` | Temple of the Spheres | Legacy, placeholder prose | ~13 |

**Out of scope (explicit):**

- `tavern-encounter-content.ts`, `social-encounter-content.ts`, `army-encounter-content.ts`, `siege-encounter-content.ts`, `borderland-encounter-content.ts`, `monster-encounter-content.ts`, `mercenary-encounter-content.ts` (if distinct from faction), `faction-encounter-content.ts` (the generic one), `secret-encounter-content.ts`. These are location-, situation-, or type-based and follow their own authoring tracks.
- New faction types. This pass enriches what exists.
- Net-new encounter templates per faction. A handful of additions are permitted per faction if the voice bible uncovers a "this faction would obviously have this scene" gap, capped at +3 per faction to avoid scope creep.

**Thieves Guild note.** Thieves Guild is the quality bar and stays. It gets *one* small pass to verify the full enrichment surface (every narrative field → enrichment, every consequential outcome → seed/mark) but does not get rewritten.

---

## 3. Quality Bar (Side-by-Side)

**Current Holy Order prose** (`holy-order-dawn-encounter-content.ts:63-75`):

```
narrative: 'The temple requires a night vigil. Stand guard against desecration.'
onSuccess: 'The vigil passes peacefully. Your faith holds.'
onFailure: 'You doze off. The temple master is disappointed.'
```

**Thieves Guild prose at bar** (`thieves-guild-encounter-content.ts`, fence step):

```
narrativeTemplate: "The fence in {location} names a price like it's the only price
  there is. It isn't. {name} waits. The silence does the rest.
  {?has_faction}The {faction} ledger doesn't forget slow work — but a patient
  fence is a returning fence.{/has_faction}"
successAfterimage: "A clean haul. The guild nods. Nothing said out loud."
failureAfterimage: "The fence walks. {name} pockets the take and waits for a
  hungrier buyer. The ledger will note the delay."
```

**The gap is three things at once**, and every rewritten template must close all three:

1. **Voice** — the Holy Order lines could come out of any medieval game. The Thieves Guild lines could only come out of *this* guild. Voice is what makes the second sentence predictable once you've read the first.
2. **Enrichment** — the Holy Order lines cannot see `{name}`, `{location}`, `{faction}`, or any relational conditional. Every enriched line opens a seam the engine can fill with the specific actor.
3. **Consequence** — the Holy Order success is consequence-free ("your faith holds"). The Thieves Guild failure implies a next step ("pockets the take and waits for a hungrier buyer"). The ledger remembers. Prose that does not imply the next scene is dead prose.

**Per-template quality gate** (from `prose-content-systems` SKILL.md, enforced in review):

1. Does this create a human condition the player recognizes (not a mechanical change)?
2. Does this make the player want to know what happens next?
3. Does this read as a *moment*, not a label?
4. Would the player sometimes prefer this outcome over success? (for failure/complication content)
5. Does this serve the three-beat loop (portfolio scan / curated moment / aftermath)?

---

## 4. Faction Voice Bible

Each faction gets a voice entry. The voice entry is the durable artifact of this pass — it lives in a new file `src/data/faction-voice-bible.ts` (exported as documentation-only constants for future content passes) and in this plan doc for reference. The entries below are the full bible.

**Voice entry shape:**

```
Faction name
  One-line tagline (what this faction's prose should feel like)
  Register — formal/casual, short/long sentences, how pronouns land
  Lexicon — 8-12 words/phrases that recur; words they never use
  What they notice — what the prose dwells on when this faction is in-frame
  What they're silent about — what goes unsaid and lets the reader feel it
  Cost motif — how failure lands (shame? debt? spiritual stain? exposure?)
  Example line (success) / Example line (failure)
```

### 4.1 Thieves Guild — the voice bible's reference entry

- **Tagline.** Streetwise, sardonic, pragmatic. The guild is a ledger. Honor is whatever keeps the ledger balanced.
- **Register.** Short sentences. Clipped clauses. Second beats that amend the first. Names land as tools: "a fence," "a mark," "the crowd."
- **Lexicon.** *Ledger, take, mark, hand, pocket, clean, fast, the crowd, slow work, earning the door, the quiet word.* Never: *righteous, holy, sworn, grace, glory, honor* (unless ironic).
- **What they notice.** Hands. Doors. Who's watching whom. What the crowd does with its silence.
- **What they're silent about.** Moralizing. A pickpocket never tells you pickpocketing is wrong.
- **Cost motif.** The ledger remembers. Failure is a debt you now carry; success buys more door than you had an hour ago.
- **Success.** "A clean haul. The guild nods. Nothing said out loud."
- **Failure.** "The fence walks. {name} pockets the take and waits for a hungrier buyer."

### 4.2 Arcane Circle — scholar's wonder at the edge of danger

- **Tagline.** Scholarly, obsessive, half in love with the thing that could kill them.
- **Register.** Long sentences interrupted by short verdicts. Commas that act like breath held. Arcane vocabulary used casually, as shop-talk.
- **Lexicon.** *Resonance, calibration, the fold, ley current, sigil, anomaly, elegant, a clean line, the pattern holds, it does not hold.* Never: *demonic, evil, magic* (they say *working*, *invocation*, *field*).
- **What they notice.** Geometry. Residue. The thing a less-trained eye would dismiss as a draft in the room.
- **What they're silent about.** How afraid they are. Fear in the Circle is an embarrassment, not a confession.
- **Cost motif.** Elegance lost. A failed working is a theorem disproved in public — the mortification is the wound.
- **Success.** "The sigil holds. {name} breathes out slowly, the way one does after a correct proof. {?has_artifact}{artifact:any} is warm against {their} ribs. It was listening.{/has_artifact}"
- **Failure.** "The fold slips. Every Circle adept within the district feels it — a small, private shame, like a wrong note in a quiet room."

### 4.3 Civic Guard — the post, the shift, the log

- **Tagline.** Dutiful, measured, institutional. The city has made a promise and the guard is the promise.
- **Register.** Plain sentences. Procedural nouns. When the prose names a person it names them by title first, not given name.
- **Lexicon.** *The watch, the post, the shift, the log, the book, the gate, the round, what was missed, what the city owes, what the city is owed.* Never: *glory, quest, adventure* — they don't romanticize the work.
- **What they notice.** Faces that don't belong. Doors that should be shut. The time.
- **What they're silent about.** Politics. A guard doesn't tell you who's in charge, only who's not in their jurisdiction.
- **Cost motif.** Something was missed. The prose shows the absence before it shows the consequence — the empty post, the unwatched gate.
- **Success.** "The round closes clean. {name} signs the log. {?has_faction}The {faction} captain will read it before dawn.{/has_faction} {?no_faction}Another night on another post. The city sleeps a little better than it knows.{/no_faction}"
- **Failure.** "The gate was unwatched for perhaps a quarter-hour. That is how these things begin."

### 4.4 Holy Order of the Dawn — solemn, righteous, certain until it isn't

- **Tagline.** The faithful do not admit doubt. When the prose admits doubt, it shows it in the weather — a cloud across the sun, a candle guttering.
- **Register.** Formal cadence, slight archaism where earned (*the Dawn, the faithful, the vigil*), but never pastiche. Long assured sentences followed by a short one that carries the cost.
- **Lexicon.** *The Dawn, the vigil, the faithful, the light, the shadow, the oath, the blade, the rite, cleansing, witness, bear witness.* Never: *pray* used casually — prayer is an event, not a filler verb.
- **What they notice.** Light on steel. The pause before an oath. What the penitent does with their hands.
- **What they're silent about.** Doubt, directly. The cost of certainty is shown, not told.
- **Cost motif.** Spiritual stain. Failure is not disappointment — it is something the order's rites must now take out of the person.
- **Success.** "{name} holds the vigil to dawn. The light comes as it always does, for those who wait for it. {?has_rival}Word of this will reach {rival:strongest}. Let it.{/has_rival}"
- **Failure.** "{name} wakes to grey light and the knowledge that the temple was unguarded at the hour the faithful call the Low Watch. The order does not speak of these hours. The rites will, eventually, remember them."

### 4.5 Underking Court — what the dark remembers

- **Tagline.** Regal, intrigue-laden, old. The Court speaks as if every conversation has been happening for a hundred years.
- **Register.** Measured. Formal address. Euphemism doing work that a direct word would spoil. Names are earned — many NPCs are *the page, the chamberlain, the seneschal* until their name is spoken by someone with standing.
- **Lexicon.** *The compact, the old word, the throne beneath, what is owed, what is held in trust, the courtesy, the courtesy denied, the long quiet.* Never: *boss, kingdom, ruler* (the Underking is not a ruler, he is a *holding*).
- **What they notice.** Precedent. Who bowed, who did not. The order of speaking.
- **What they're silent about.** The mechanics of power. The Court assumes the reader already knows what it costs to be standing where they're standing.
- **Cost motif.** The old compact notes the trespass. The ledger of the Court is older than any mortal career and patient.
- **Success.** "The courtesy is paid. A chamberlain somewhere writes the name {name} beside a date in a book that has no first page. {?has_title}The title *{title}* reads well in the old script.{/has_title}"
- **Failure.** "{name} leaves without the courtesy done. The Court does not say what this costs. The Court, when it speaks, does not speak of cost."

### 4.6 Builders Fellowship — the join, the stone, what will last

- **Tagline.** Practical, craft-focused, quietly proud. The Fellowship's prose does not moralize — it measures.
- **Register.** Short sentences of plain work. Concrete nouns. Verbs about hands.
- **Lexicon.** *The work, the join, the stone, the line, the plumb, the true, the square, the set, the cure, the load, what will hold.* Never: *art* (it is *work*), *mastery* (they say *a good hand*).
- **What they notice.** The corner that's off by a hair. The mortar that hasn't cured. The load path.
- **What they're silent about.** Aesthetics as an end. If the prose lingers on beauty, it lingers on structural beauty — symmetry, weight distributed.
- **Cost motif.** The work fails. Something will not hold the weight it was built to hold, and that is the whole of the tragedy.
- **Success.** "The join sets clean. {name} runs a thumb along the line and feels only stone. {?has_faction}The {faction} foreman will want to see it, which is the nearest thing to a compliment the Fellowship gives.{/has_faction}"
- **Failure.** "The cure is wrong and {name} knows it before the foreman does. That is the worse of the two knowings."

### 4.7 Rangers Brotherhood — the wild is listening

- **Tagline.** Terse, observant, the prose reads as if written by someone on watch.
- **Register.** Sentence fragments when the ranger is moving. Fuller sentences when they are still. Present tense for the observing beat.
- **Lexicon.** *Sign, trail, trace, track, wind, bearing, the line, the draw, the ridge, the dark under trees, what the wild permits.* Never: *monster* (they say *the thing on the ridge*).
- **What they notice.** Broken grass. Wrong birdsong. A cold print.
- **What they're silent about.** Themselves. The ranger prose tells the reader about the world through a ranger-shaped gap.
- **Cost motif.** The trail goes cold. Or worse: the trail circles back.
- **Success.** "{name} reads the sign — it is two hours old and going west. The wind will hold. That is enough."
- **Failure.** "The trail doubles on itself. {name} knows, then, that whatever walked this ground has been listening to {them} walking it."

### 4.8 Merchant Consortium — the ledger, the split, the room's true price

- **Tagline.** Calculating, civil, precise. The Consortium smiles at you and takes a small, clean bite.
- **Register.** Business register with one literary flourish per scene, earned. Numbers do not appear in prose — the prose describes their weight.
- **Lexicon.** *The terms, the split, the margin, the quiet price, the handshake, the book price, the street price, what the room will bear.* Never: *greed* (a vulgarity), *fair* (said only with irony).
- **What they notice.** Who's nervous. Who's bored. Who came alone.
- **What they're silent about.** The actual numbers. The prose describes the *feel* of a deal, not its arithmetic.
- **Cost motif.** Reputation in the room. A bad deal is a story that outruns you.
- **Success.** "The terms are agreed. {name} leaves the room with the lighter purse and the heavier standing — which is, in the Consortium, the better exchange. {?has_rival}{rival:strongest} will hear the shape of the deal before the week is out.{/has_rival}"
- **Failure.** "{name} leaves having been read. A bad deal forgives itself in a month. Being *read* follows {them} from room to room for a year."

### 4.9 Mercenary Company — contract, pay, keep your word

- **Tagline.** Blunt, professional, darkly funny. Mercenaries do the work and want to be paid.
- **Register.** Plain declaratives. Humor in the noun choice, not in jokes. A skull is *head furniture*, a coffin is *a long box*.
- **Lexicon.** *The contract, the clause, the work, the pay, the split, the captain, the line, the ground, keeping it honest, keeping the word.* Never: *glory* (dead men buy no drinks).
- **What they notice.** The ground. The numbers on the other side. Where the sun is.
- **What they're silent about.** Cause. The Company doesn't care whose cause it is; the prose doesn't either.
- **Cost motif.** The pay is short, or the line is thin, or a name is added to the stone outside the barracks.
- **Success.** "Clean work, clean pay. {name} walks off the field with the pouch heavy and the promise kept. {?has_ally}{ally:strongest} is one foot wrong and still walking, which counts for a win.{/has_ally}"
- **Failure.** "The captain pays anyway, minus the clause, which is how the Company keeps its word when it can't keep the contract. {name} drinks the short pay and says nothing, because saying would be worse."

### 4.10 Lorekeepers Covenant — the record, the page, the remembered

- **Tagline.** Quiet, precise, patient. The Covenant knows the world forgets and considers that a personal affront.
- **Register.** Scholarly without the Circle's obsession. Warm where the Circle is cold — the Covenant loves what it keeps.
- **Lexicon.** *The record, the record keeps, the annal, the entry, the margin, the hand, the date, what was said, what was not said, what is remembered.* Never: *story* (they say *account*), *myth* (they say *the received version*).
- **What they notice.** Contradictions between accounts. A date that does not land where it should. A name missing from a margin.
- **What they're silent about.** Emotion about the records themselves, except when a record is destroyed.
- **Cost motif.** The page is lost. A record unkept is a small hole the world falls into later.
- **Success.** "The account is taken. {name} signs the margin in the Covenant's second hand. {?has_title}The name reads well beside the title *{title}*.{/has_title}"
- **Failure.** "The page tears. The Covenant will reconstruct it from other hands, but for one generation something will be remembered slightly wrong."

### 4.11 Temple of the Spheres — the nine, the alignment, the turning

- **Tagline.** Mystic, layered, careful. The Temple holds all nine spheres and weighs them against each other constantly.
- **Register.** Measured, often using sphere-vocabulary directly but never ostentatiously. *Weight* and *alignment* are load-bearing words.
- **Lexicon.** *The nine, the weight, the alignment, the turning, the open sphere, the closed sphere, the mote, the orbit, the passage.* Never: *god* (singular) — they speak of *the orbit*, or of a specific sphere by name.
- **What they notice.** Which sphere is loudest in the room. Whose alignment has shifted since last they met.
- **What they're silent about.** Theological quarrels. The Temple's quarrels are kept inside the Temple.
- **Cost motif.** An alignment falls off true. The Temple knows this happens and the prose is gentle about it, which makes it worse.
- **Success.** "The rite closes with the weight held. {name} leaves the sanctum with the alignment a little more true than it was. The Temple does not praise this. The Temple notices it."
- **Failure.** "The rite holds, but not at the weight {name} intended. The Temple does not say the alignment failed. The Temple asks when {they} would like to come back."

---

## 5. Three-Pillar Breakdown

### 5.1 Engine pillar

**Migration.** Eight of eleven files need to move from `EncounterTemplate` to `UnifiedActionTemplate`. Use `thieves-guild-encounter-content.ts` as the structural reference. Migration must preserve:

- Every existing `FactionEncounterMeta` registry entry (ID, `minRank`, `reputationReward`, `questType`).
- Encounter type, reach primary/secondary, threat rating, intrinsic tier, motivations.
- Difficulty values, normalized from legacy integer scale (÷100) to `0..1`.
- Join / promotion encounters.
- All `locationTypes` filters.

**New fields to populate per migrated template:**

- `narrativeTemplates.initiation` / `.success` / `.failure` — the macro prose.
- `steps[*].narrativeTemplate`, `.successAfterimage`, `.failureAfterimage` — step-level.
- `aftermathConfig` — at minimum a `fallback` branch; step-specific `variants` for any outcome that should ripple forward.
- `aftermathConfig.reactionPrompt` and `.reactions[]` — god-facing choices (never mortal-facing). Every reaction is something the god does (nudge, whisper, withdraw, steady, strengthen, seal, reveal), never something the mortal does.

**Enrichment context requirements.** Every narrative field must assume the full `NarrativeContext` is available — actor, location, faction, culture, title, artifact, ally, rival, omen/doom atmospherics. Fields may not assume fields that aren't always present; use conditional blocks (`{?has_ally}...{/has_ally}`) for optional relationships. `{name}` is required in every step-level narrative and every outcome-level narrative.

**No new engine code required.** The enrichment plumbing (THR-110) and unified aftermath (THR-115/116/117) are landed. This is a content pass against a stable engine surface. If the content pass uncovers a missing engine capability, the correct response is to file a new Linear issue, not to smuggle a workaround into the content.

### 5.2 Content pillar

**Per faction, the work is:**

1. Write the voice-bible entry into `src/data/faction-voice-bible.ts` (exported as a documentation constant — not engine-read, just reviewed).
2. Rewrite each step's `narrativeTemplate`, `successAfterimage`, `failureAfterimage`.
3. Rewrite `narrativeTemplates.initiation` / `.success` / `.failure`.
4. Author the `aftermathConfig` block. Minimum one reaction prompt per template; 2–4 reactions typical.
5. Pick 2–4 templates per faction that should plant **encounter seeds** (betrayal → investigation, theft → bounty, oath → faction ceremony, etc.).
6. Pick 1–3 templates per faction that should leave **hidden marks** on the actor (broken oath → `betrayal`, secret dealings → `secret_knowledge`, failed rite → `contamination`).
7. Verify at least one template per faction exercises **every enrichment placeholder** the voice bible calls for (`{name}`, `{their}`, `{location}`, at least one `{?has_X}...{/has_X}` conditional, at least one `{title|artifact|ally|rival}` where appropriate).

**Approximate deliverable per faction:** ≈13–15 templates × 6–8 narrative fields ≈ 80–120 prose lines + 3–6 aftermath blocks. Total across 8 legacy factions + 2 unified-but-unvoiced factions ≈ 1,000 prose lines + 30–60 aftermath blocks.

### 5.3 UI pillar

**No new components.** Faction prose renders through the existing encounter-stage UI — `EncounterStageView`, `AftermathReactionPanel`, and the chronicle feed. The prose enrichment work is invisible to UI code.

**Player-perceived changes:**

- Encounter text reads distinctly per faction. A Holy Order vigil should feel categorically different from a Civic Guard night watch, even though both are "stand guard" scenes.
- Aftermath reaction prompts read in the faction's voice. "What does the god keep?" is the scaffold; "The Dawn's candle is lit for the witness, or for the watcher, or not at all" is the Holy-Order version.
- Chronicle event entries that reference a faction encounter use the faction voice as their atmospheric base.

**Verification surface:**

- `?view=game&seeded` with a faction-member agent spawns a faction encounter → prose reads in voice.
- DebugPanel → Traces tab filtered on `narrative_generation` → every narrative-field render resolves placeholders to real values (no literal `{name}` / `{?has_faction}` in rendered text).
- DebugPanel → CLI `eval` a template ID to inspect the prose fields directly.

---

## 6. Systemic Wiring (the IKEA manual, per faction)

Each faction uses a different subset of the seven systemic capabilities. The bible tells you *what a faction's prose should feel like*; the wiring table tells you *what the engine should be doing while that prose runs*.

| Faction | Enrichment density | Primary conditional | Seed uses | Hidden mark uses | Reputation flow note |
|---------|---|---|---|---|---|
| Thieves Guild | high | `{?has_faction}` (guild ledger), `{?has_rival}` (rival fence) | theft → bounty, con → reveal | `secret_knowledge` (what the mark hides), `debt` (fence short-pays) | Shadow-polarity wins; `gate_duty.shadow_success` tally |
| Arcane Circle | high | `{?has_artifact}`, `{?has_title}` (scholarly rank) | anomaly → investigation, failed working → contamination | `contamination` (bad working residue), `secret_knowledge` (a theorem too early) | Star-polarity primary; reach-specific tallies for Eye and Veil |
| Civic Guard | medium | `{?no_faction}` (unaffiliated suspect), `{?has_title}` | missed round → investigation, arrest → trial | `debt` (favor owed to captain), `betrayal` (corrupt guard) | Iron+Stone tallies; post-reputation feeds `civic_duty.*` |
| Holy Order of the Dawn | high | `{?has_rival}` (rival order), `{?no_faction}` (lay petitioner) | corruption found → cleanse follow-up, vigil broken → penance | `contamination` (spiritual), `betrayal` (broken oath) | Star-polarity primary; `faithful.witness` tally |
| Underking Court | medium | `{?has_title}` (the Court reads titles), `{?has_faction}` | courtesy denied → intrigue, secret told → leverage encounter | `secret_knowledge` (old compact whisper), `debt` (the Court always collects) | Shadow+Veil tallies; `court_standing.*` |
| Builders Fellowship | medium | `{?has_faction}`, `{?has_ally}` (crew member) | failed join → structural collapse encounter, well-built → trade post seed | `debt` (favor owed to foreman), `contamination` (cut corner) | Stone-polarity primary; `craftsmanship.*` tallies (see THR-167 for standing ladder) |
| Rangers Brotherhood | medium | `{?has_ally}` (partner on patrol), `{?has_artifact}` (bow/blade) | cold trail → the thing returns, rescue → rumor spread | `secret_knowledge` (what the wild showed), `betrayal` (a ranger who walked out) | Veil+Iron; `wilderness_pact.*` |
| Merchant Consortium | medium | `{?has_rival}` (competitor), `{?has_faction}` (guild member) | bad deal → reputation spread, good deal → commission seed | `debt` (book price vs. street price), `secret_knowledge` (what the client hides) | Gold-polarity primary; `consortium_standing.*` |
| Mercenary Company | low | `{?has_ally}` (squad), `{?has_rival}` (old contract) | broken contract → bounty reversal, won field → rumor/hire seed | `debt` (short pay), `betrayal` (sold the contract) | Iron-polarity primary; `company_honor.*` |
| Lorekeepers Covenant | medium | `{?has_title}`, `{?has_artifact}` (book/scroll) | record found → archive follow-up, record lost → investigation seed | `secret_knowledge` (unwritten hand), `contamination` (forged record) | Eye+Veil; `archive_hand.*` |
| Temple of the Spheres | high | `{?has_artifact}` (sphere-aligned), `{?has_faction}` (rival order) | rite off-true → realignment follow-up, true rite → consecration seed | `contamination` (sphere mis-weight), `secret_knowledge` (a ninth sphere reading) | All nine sphere tallies touched; `temple_alignment.*` |

**General rules (apply to every faction):**

- No encounter may set a reputation delta > 0.10 in a single outcome. Cumulative delta across a quest may be larger; single step/outcome must not.
- Every hidden mark must have a `revealFamilies` list with ≥1 entry. No orphan marks.
- Every encounter seed must have a `seedLabel`. No silent seeds.
- Aftermath reaction prompts must be in god-voice ("What does the god keep from the {scene}?"), reactions must be god-acts, never mortal-acts.

---

## 7. Constants Table (NFP #1)

All constants go in the new file `src/data/faction-prose-constants.ts` (or appended to `faction-constants.ts` if the existing file fits). Every named constant below is tunable; defaults are the baseline for the implementation PR.

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_PROSE_MAX_REPUTATION_DELTA_PER_OUTCOME` | 0.10 | Cap on single-outcome reputation swing; enforced in review |
| `FACTION_PROSE_SEED_DELAY_QUEST_TICKS` | 12 | Default `delayTicks` for quest-seeded follow-up encounters |
| `FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS` | 6 | Default `delayTicks` for social-seeded follow-ups |
| `FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY` | 0.4 | Default severity for faction-sourced hidden marks |
| `FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY` | 0.7 | Elevated severity for faction betrayal marks |
| `FACTION_PROSE_AFTERMATH_REACTION_MIN` | 2 | Minimum reactions per aftermath block |
| `FACTION_PROSE_AFTERMATH_REACTION_MAX` | 4 | Maximum reactions per aftermath block (keeps UI readable) |
| `FACTION_PROSE_PLACEHOLDER_MIN_PER_STEP` | 1 | Minimum `{name}`/`{location}` etc. per step narrative (enforced by lint test, see §9) |
| `FACTION_PROSE_CONDITIONAL_MIN_PER_TEMPLATE` | 1 | Minimum conditional block (`{?has_X}...{/has_X}`) per template; enforced by lint |
| `FACTION_PROSE_VOICE_LEXICON_MIN_HITS` | 3 | Min voice-bible lexicon hits per template (voice lint — flags generic prose) |

The voice-lint constants (last two rows) are the teeth of this pass. Without a lint, voiced prose rots back to placeholder prose the next time anyone edits a template in a hurry.

---

## 8. Traces (NFP #2)

Extend existing trace categories; no new categories required.

| Trace category | Existing? | What this pass adds |
|----------------|-----------|---------------------|
| `narrative_generation` | ✅ | Faction-voiced templates trace per-field enrichment with `factionId` in the payload so the DebugPanel can filter-by-faction |
| `hidden_mark_created` | ✅ | Faction marks include `sourceFactionId` and `sourceTemplateId` in payload |
| `encounter_seed_planted` | ✅ | Faction seeds include `sourceFactionId` and `reason` ("betrayal follow-up", "commission follow-up", etc.) in payload |
| `reputation_tally_updated` | ✅ | Faction tallies carry `sourceFactionId` so a per-faction reputation-flow view is possible later |

**TypeScript for the new payload fields** (added to existing trace interfaces in `src/engine/traceBuffer.ts`):

```ts
interface NarrativeGenerationTrace {
  // existing fields...
  factionId?: string;           // present when the template is faction-scoped
  voiceLintHits?: number;       // number of bible-lexicon hits (for voice lint debugging)
}

interface HiddenMarkCreatedTrace {
  // existing fields...
  sourceFactionId?: string;
  sourceTemplateId?: string;
}

interface EncounterSeedPlantedTrace {
  // existing fields...
  sourceFactionId?: string;
  reason?: string;              // human-readable cause; not player-facing
}
```

All four fields are optional — existing non-faction traces continue to work unchanged.

---

## 9. Fail-Soft Table (NFP #4)

| Failure case | Current behavior (post-THR-110) | This pass's behavior |
|---|---|---|
| Placeholder resolves to missing value (`{artifact:weapon}` but no weapon) | `applyFallbacks()` substitutes a generic phrase | Unchanged. Voice-bible writers must not rely on unconditional artifact access; use `{?has_artifact}` |
| Conditional block references unknown condition | Block rendered empty, full prose still emits | Unchanged |
| Encounter seed points at a template that was deleted | Seed "withers", emits narrative event, removed from queue | Unchanged |
| Hidden mark `revealFamilies` empty or missing | Mark persists but can only decay; never revealed | **Now a lint error** — every faction mark must list ≥1 reveal family |
| Faction-scoped template runs for non-faction agent | Template is unlocked by faction membership filter; won't fire | Unchanged; enforced upstream in encounter scoring |
| Aftermath reaction effects reference unknown effect kind | Polymorphic switch logs warning, skips effect | Unchanged |
| Voice-lint failure (prose does not hit bible lexicon ≥3× or lacks placeholder) | N/A (no lint today) | **CI fails the PR.** Lint runs as a test in `src/data/__tests__/factionVoiceLint.test.ts` |

---

## 10. Wiring Checklist (per `Docs/plans/wiring-checklist.md`)

| Surface | Status | Notes |
|---------|--------|-------|
| Orchestrator phase | N/A | This is a content pass; tick phases unchanged |
| UI component rendering | ✅ existing | `EncounterStageView`, `AftermathReactionPanel`, chronicle feed — no changes |
| GameState field consumption | ✅ existing | Faction templates feed existing `unifiedActions` / `aftermath` state |
| Traces emitted | ⚠ extended | New optional payload fields on four existing categories — see §8 |
| DebugPanel visibility | ✅ existing | DebugPanel trace tab filters already support `factionId` payload; verify filter UI surfaces the new optional field |
| Player controls | N/A | No new player actions |
| Prose pipeline | ✅ | `enrichProse()` wired as of THR-110; aftermath marks/seeds wired as of THR-114/115/116/117 |
| Wiring-checklist.md itself | ⚠ | Add a row: "Faction-voiced content passes require voice-lint test; extend on new faction files" — to be updated in the Claude Code implementation PR |

---

## 11. Benchmark Moments (per `prose-content-systems` quality gate)

Every content pass must nominate benchmark moments. For this pass the benchmarks are *one prose scene per faction* that every other template in that faction should match or exceed.

| Faction | Benchmark template ID | Benchmark moment (1–2 lines) |
|---------|-----------------------|------------------------------|
| Thieves Guild | `tg.quest.fence_goods` | Already at bar — the fence scene (§3 above) |
| Arcane Circle | `ac.quest.calibrate_anomaly` | *"The fold slips. Every Circle adept within the district feels it — a small, private shame, like a wrong note in a quiet room."* |
| Civic Guard | `cg.quest.night_round` | *"The gate was unwatched for perhaps a quarter-hour. That is how these things begin."* |
| Holy Order | `hod.quest.temple_vigil` | *"{name} wakes to grey light and the knowledge that the temple was unguarded at the hour the faithful call the Low Watch."* |
| Underking Court | `uc.quest.pay_the_courtesy` | *"A chamberlain somewhere writes the name {name} beside a date in a book that has no first page."* |
| Builders Fellowship | `bf.quest.set_the_join` | *"The cure is wrong and {name} knows it before the foreman does. That is the worse of the two knowings."* |
| Rangers Brotherhood | `rb.quest.read_the_sign` | *"The trail doubles on itself. {name} knows, then, that whatever walked this ground has been listening to {them} walking it."* |
| Merchant Consortium | `mc.quest.the_quiet_price` | *"{name} leaves having been read. A bad deal forgives itself in a month. Being read follows {them} from room to room for a year."* |
| Mercenary Company | `mrc.quest.clean_work` | *"The captain pays anyway, minus the clause, which is how the Company keeps its word when it can't keep the contract."* |
| Lorekeepers Covenant | `lk.quest.take_the_account` | *"The page tears. The Covenant will reconstruct it from other hands, but for one generation something will be remembered slightly wrong."* |
| Temple of the Spheres | `ts.quest.hold_the_weight` | *"The rite holds, but not at the weight {name} intended. The Temple does not say the alignment failed. The Temple asks when {they} would like to come back."* |

These eleven lines become the quality witnesses against the voice lint. If a new template in a faction's file drops the voice, review against that faction's benchmark.

---

## 12. Phasing — How This Actually Ships

Writing 1,000 prose lines across 11 factions is too large for a single PR. The work is phased as follows:

### Phase 0 — Infrastructure (Claude Code)
**Issue:** THR-31 (this doc) → gets split into THR-31-a (infra) and per-faction issues.

- Add `src/data/faction-voice-bible.ts` with the eleven voice entries as exported constants (documentation).
- Add `src/data/__tests__/factionVoiceLint.test.ts` — lint the eleven faction files against voice-bible lexicon + enrichment/conditional minimums defined in §7.
- Add the constants from §7 to `src/data/faction-constants.ts` (or new `faction-prose-constants.ts`).
- Extend trace interfaces per §8.
- Bring the voice lint up as an *advisory* (logs to console, doesn't fail CI) for the two already-at-bar files (Thieves Guild and anything else that passes on the first run).

**Size:** S. One PR. Unblocks everything else.

### Phase 1 — Unified-but-unvoiced factions (Claude Code, pair of small PRs)
- **THR-31-b:** Arcane Circle — ~15 templates, full voice pass. Also serves as the reference PR for other voice-only (no migration) passes.
- **THR-31-c:** Civic Guard — ~15 templates.

**Size per PR:** M. Voice lint flipped from advisory to enforcing once Arcane Circle passes.

### Phase 2 — Legacy-to-unified migration + voice (eight PRs, parallel-safe across files)
One Linear issue per faction, implementable in parallel across worktrees (different files, no engine surface collision). Suggested order by "reference material richness" so the voice is tested early on the factions that have the most prose room:

1. **THR-31-d:** Holy Order of the Dawn (rich register, benchmark for religious factions)
2. **THR-31-e:** Underking Court (benchmark for intrigue / old-power factions)
3. **THR-31-f:** Rangers Brotherhood (benchmark for terse observational voice)
4. **THR-31-g:** Builders Fellowship
5. **THR-31-h:** Merchant Consortium
6. **THR-31-i:** Mercenary Company
7. **THR-31-j:** Lorekeepers Covenant
8. **THR-31-k:** Temple of the Spheres

**Size per PR:** M-L (migration adds surface area; voice stays at the per-template quality bar).

**Parallel-safe:** each PR touches one faction-encounter-content file + per-faction test file + possibly one `faction-voice-bible.ts` tweak. Mutex on `faction-voice-bible.ts` if two PRs run concurrently and both want to refine the bible — coordinate by rebasing.

### Phase 3 — Thieves Guild spot-check (Claude Code, S)
- **THR-31-l:** Thieves Guild audit — verify every narrative field has enrichment, every consequential outcome has a seed or mark or hidden-mark consumption family. No rewrite; just fill gaps identified by the lint.

### Total outputs
- 1 infra PR + 2 voice-only PRs + 8 migration+voice PRs + 1 audit PR = **12 PRs**
- Each PR independently shippable and independently revertable
- Each PR locks in its voice through the lint, so voice does not regress

---

## 13. Rejected Approaches (do not reintroduce)

- ❌ **Write all 150 templates in one PR.** Too large, unreviewable, cannot be reverted in pieces.
- ❌ **Write voiced prose into legacy `EncounterTemplate` shape.** The prose would strand the next time the migration pass runs; double work.
- ❌ **Skip the voice bible, go template-by-template.** Each faction then drifts; voice becomes a per-template accident; the next authoring pass has no bar to hit.
- ❌ **Use LLM runtime generation for faction voice at render time.** Cost, determinism, inspectability all violated. The bible exists so voice is a *design artifact* that lives in the repo.
- ❌ **Store voice bible entries as strings inside encounter templates.** They belong in one file so they can be edited coherently, not scattered. The bible is the tuning surface.
- ❌ **Enforce voice by hand in review.** Review fatigue rots the bar. The voice-lint is what keeps the bar.
- ❌ **Plant seeds/marks only on successes.** Failures are where the most interesting threads start; the wiring table above deliberately mixes.

---

## 14. NFP Compliance Summary

| NFP | Status | Notes |
|-----|--------|-------|
| 1 · Tunability | **PASS** | All constants in §7 named; voice bible is a single tunable file; lint thresholds are constants |
| 2 · Inspectability | **PASS** | Four existing trace categories extended with optional `factionId`/`sourceFactionId` — per-faction flow becomes traceable without new categories |
| 3 · Determinism | **PASS** | Pure content + lint; no PRNG use; voice bible is static data |
| 4 · Fail-soft | **PASS** | Placeholder fallbacks, withered seeds, lint-enforced mark families — §9 |
| 5 · Narrative > mechanical perfection | **PASS (load-bearing)** | The whole pass exists to honor this priority. Voice bible + benchmark moments are the teeth |
| 6 · Additive over destructive | **PASS w/ note** | Migration of 8 legacy files is technically destructive of the old shape — but the new shape is a strict superset, migration is mechanical, and the old tests are preserved against a legacy shim for the first 2 weeks (lint-enforced removal after) |
| 7 · Performance budget | **PASS** | Content only; no hot-path code changes; lint runs in test-time, not game-time |

---

## 15. Open Questions for the Implementation Agent

Flagged so CC does not have to guess:

1. **Voice bible file location.** Proposed: `src/data/faction-voice-bible.ts` (documentation constants). Alternative: attach entries as a `voice` field on each faction definition in `faction-definitions.ts`. This doc recommends the former because the bible is a content-author tool, not an engine input. CC may propose otherwise in the Phase 0 PR.
2. **Per-faction voice-lint test file or one consolidated file.** Proposed: one file (`factionVoiceLint.test.ts`) with per-faction `describe` blocks. CC may split if test runtime becomes a factor.
3. **Legacy shim retention.** Proposed: preserve the old `HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES` symbol as an alias to the new unified export for two weeks so external imports (if any) don't break mid-migration. Drop with a follow-up issue.
4. **Reputation-tally keys.** The wiring table §6 names tallies like `civic_duty.*` and `court_standing.*`. These must be registered in `phaseReputationTraits.ts` before templates write to them (otherwise they're inert — see THR-167). Phase 0 infra PR registers the keys.
5. **Voice-lint threshold calibration.** The constants in §7 are opinionated defaults. Expect to relax `FACTION_PROSE_VOICE_LEXICON_MIN_HITS` from 3 to 2 for short templates after the first two factions land; defer tuning to the first real run.

---

## Appendix A — One Worked Template (Holy Order `hod.quest.temple_vigil`)

The current and the target, for reference. CC implementing Phase 2-a should match this shape.

### Current (legacy, placeholder)

```ts
{
  id: 'hod.quest.temple_vigil',
  name: 'Temple Vigil',
  locationTypes: ['temple', 'city', 'capital'],
  steps: [
    {
      id: 'hod.quest.temple_vigil.1',
      name: 'Stand Watch',
      narrative: 'The temple requires a night vigil. Stand guard against desecration.',
      reach: 'star', difficulty: HOD_DIFFICULTY_BASE, duration: 2,
      onSuccess: { narrative: 'The vigil passes peacefully. Your faith holds.' },
      onFailure: { narrative: 'You doze off. The temple master is disappointed.' },
    },
    { /* step 2 similar */ },
  ],
  reachPrimary: 'star', reachSecondary: 'iron',
  encounterType: 'duel', threatRating: 'easy', intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
  questPriority: 3.0,
}
```

### Target (unified, voiced)

```ts
{
  id: 'hod.quest.temple_vigil',
  name: 'Temple Vigil',
  reach: 'star',
  steps: [
    {
      reach: 'star',
      duration: { min: 2, max: 2 },
      difficulty: HOD_DIFFICULTY_BASE / 100,
      narrativeTemplate:
        "{name} takes the Low Watch — the hour the faithful don't name. " +
        "The vigil candle burns short. {?has_artifact}{artifact:any} " +
        "rests against the altar, a thing the Dawn will want a witness for.{/has_artifact} " +
        "{?no_artifact}The altar is empty but for what {they} brought — which is only {themself}.{/no_artifact}",
      successAfterimage:
        "{name} holds through to grey light. The Dawn comes as it always does, for those who wait for it.",
      failureAfterimage:
        "{name} wakes to the sound of the bell, late. Something in the rites will, eventually, remember this.",
      successMetadata: { reputationDelta: 0.04 },
      failureMetadata: { reputationDelta: -0.02 },
    },
    {
      reach: 'iron',
      duration: { min: 2, max: 2 },
      difficulty: (HOD_DIFFICULTY_BASE + HOD_DIFFICULTY_STEP) / 100,
      narrativeTemplate:
        "A shape moves in the sanctum. {name} draws steel quietly — the Dawn's blade is " +
        "not drawn loudly. {?has_ally}{ally:strongest} is at the outer door, which is most " +
        "of the comfort one gets in this work.{/has_ally}",
      successAfterimage:
        "The intruder falls or flees. The reliquary is untouched. {name} signs the temple log " +
        "in the second hand.",
      failureAfterimage:
        "A relic is taken. {name} bears the loss before the order does — a mark that the rites " +
        "will ask after for seasons.",
      successMetadata: { tierPromotionEligible: true, reputationDelta: 0.06 },
      failureMetadata: { reputationDelta: -0.05 },
    },
  ],
  narrativeTemplates: {
    initiation:
      "The Dawn has asked for a vigil, and {name} has answered. {?has_faction}The " +
      "{faction} captain will hear of it before dawn, one way or the other.{/has_faction}",
    success:
      "The vigil is held. The Dawn does not praise this. The Dawn notices it.",
    failure:
      "The vigil breaks. The order will speak of it in the quiet way — which is the way that lasts.",
  },
  aftermathConfig: {
    branchOnStep: 1,
    variants: {
      1: {
        failure: {
          overview:
            "The reliquary is lighter by one relic. The order is quieter by the weight " +
            "of one loss. The loss reads, in the second hand, as {name}'s.",
          changes: [
            {
              id: 'relic_lost',
              kind: 'faction_reputation',
              title: 'A relic is missing.',
              detail: "The order's inventory hand will find it tomorrow. Tonight, only {name} knows.",
              polarity: 'negative',
            },
          ],
          reactionPrompt: "What does the god do with the grey hour, and the empty altar?",
          reactions: [
            {
              id: 'hod.vigil.fail.witness',
              label: "Witness the loss. Let the order find it at its own pace.",
              intent:
                "You bear witness. The loss will be spoken of, in time — which is the order's " +
                "way of keeping the shape of a thing.",
              effects: [
                { kind: 'hidden_mark', category: 'secret_knowledge', severity: 0.5,
                  label: "Knows the hour the reliquary was breached",
                  revealFamilies: ['investigation', 'holy_order'] },
              ],
              closeAfterSelection: false,
            },
            {
              id: 'hod.vigil.fail.seed',
              label: "Plant the follow-up. The thief will not be hard to find, if the right eyes ask.",
              intent:
                "You put a name in the ear of a ranger, or a merchant, or a guard. The thread pulls.",
              effects: [
                { kind: 'encounter_seed',
                  templateId: 'hod.senior.cleanse_corruption',
                  targetAgentId: '$actor', delayTicks: 15, priority: 1.2,
                  seedLabel: "The relic left a residue. Someone will find its edge." },
              ],
              closeAfterSelection: true,
            },
            {
              id: 'hod.vigil.fail.withdraw',
              label: "Withdraw. The order will carry its own loss.",
              intent: "You let the order have this one. Some wounds are theirs to keep.",
              effects: [],
              closeAfterSelection: true,
            },
          ],
        },
      },
    },
    fallback: {
      overview:
        "The vigil is closed. The Dawn takes its record, and {name} takes {theirs}.",
      changes: [],
      reactionPrompt: "What does the god keep from the vigil?",
      reactions: [
        {
          id: 'hod.vigil.default.bless',
          label: "Steady the hand that held.",
          intent:
            "You steady {name}. The work was quiet — your mercy is quieter.",
          effects: [
            { kind: 'reputation_tally',
              key: 'faithful.witness',
              delta: 1 },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'hod.vigil.default.withhold',
          label: "Keep your hand back. The Dawn's work asks no god.",
          intent: "You withdraw. The temple keeps its own weather.",
          effects: [],
          closeAfterSelection: true,
        },
      ],
    },
  },
}
```

This is what a Phase 2 faction PR delivers ~13 times, each tuned to its faction's bible entry.

---

## 16. Definition of Done (applies to every sub-issue)

- [ ] All templates for the faction migrate cleanly (tests pass).
- [ ] Every narrative field carries ≥1 enrichment placeholder.
- [ ] Every template has ≥1 conditional block.
- [ ] Voice lint passes for the faction.
- [ ] 2–4 templates plant encounter seeds per §6 wiring table.
- [ ] 1–3 templates leave hidden marks per §6.
- [ ] Aftermath reaction prompts in god-voice; reactions are god-acts.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass.
- [ ] `Docs/project-status.md` + `Docs/project-history.md` + `Docs/changelog.md` updated.
- [ ] Commit body contains `Fixes THR-31-{letter}`.
