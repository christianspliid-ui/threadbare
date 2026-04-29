---
name: template-encounter-rewrite
description: >
  Rewrite UnifiedActionTemplate encounter prose to meet the quality bar AND use the engine's
  systemic capabilities. Use whenever rewriting or improving guild, social,
  tavern, combat, or other template-format encounter files (NOT branching
  encounters in src/data/encounters/ — those use encounter-pipeline).
  Triggers on "rewrite encounter", "improve encounter prose", "guild encounter
  quality", "social encounter rewrite", "tavern encounter rewrite", "template
  encounter", "encounter quality pass", "prose quality pass".
model: opus
---

# Template Encounter Rewrite — Prose + Systemic Wiring

This skill is for rewriting guild/social/tavern/combat/borderland encounter content that now ships as `UnifiedActionTemplate` entries. It covers **both** prose quality **and** systemic wiring — because beautiful prose without dynamic capabilities is a book page, not game content.

**This skill is NOT for branching encounters** (the hand-authored `ActionStepBranch` format in `src/data/encounters/`). Those use the `encounter-pipeline` skill.

---

## Before You Write a Single Word

Read these in order. Skipping any of them produces content that fails the quality bar:

1. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — The 7 engine capabilities that should shape your creative decisions. If you don't know what encounter seeds, hidden marks, and conditional blocks can do, you'll write hardcoded fiction.
2. **`Docs/plans/2026-04-16-design-quality-gate.md`** — Section 9 benchmark moments. Your output must meet this standard.
3. **The file you're rewriting** — Read the current template to understand the TypeScript structure, step count, reaches, difficulty curve, and reward pools. You're replacing prose, not restructuring the template.
4. **One benchmark encounter** — Read `src/data/encounters/soul-ferryman.ts` or `src/data/encounters/the-courtyard-duel.ts` to calibrate your ear for what quality prose sounds like in this game.

---

## The Unified Template Format

Encounter entries now use `UnifiedActionTemplate` with this structure:

```typescript
{
  id: 'guild.quest.task_name',
  name: 'Human-Readable Name',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  steps: [
    {
      reach: 'shadow',
      narrativeTemplate: '...',   // ← YOU REWRITE THIS
      reach: 'shadow',
      difficulty: 0.35,
      duration: { min: 1, max: 2 },
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      successAfterimage: '...',   // ← YOU REWRITE THIS
      failureAfterimage: '...',   // ← YOU REWRITE THIS
      successMetadata: { reputationDelta: 0.05, tierPromotionEligible: true },
      failureMetadata: { reputationDelta: -0.02 },
    },
    // ... more steps
  ],
  narrativeTemplates: {
    initiation: '...',            // ← YOU REWRITE THIS
    success: '...',               // ← YOU REWRITE THIS
    failure: '...',               // ← YOU REWRITE THIS
  },
  aftermathConfig: { ... },       // Optional branch-aware aftermath
}
```

You rewrite the authored prose surfaces (`narrativeTemplate`, `successAfterimage`, `failureAfterimage`, and `narrativeTemplates.*`). You may also add enrichment placeholders, conditional blocks, and aftermath wiring improvements — but the structural skeleton (steps, reaches, difficulties, rewards, motivations, ids) stays unless it's clearly wrong.

---

## The Two Quality Bars (Both Must Pass)

### Bar 1: Prose Quality

Every narrative field must meet the Threadbare aesthetic:

**Open with sensory/scene detail.** Where is the agent? What do they see, smell, hear? Ground the moment physically before anything happens.

**Establish emotional stakes in human terms.** Why does this matter to *this person* right now? Not "reputation is at risk" but "the apprentice is watching, and she'll decide today whether this craft is worth a life."

**Use concrete nouns, not abstractions.** "The ledger's spine is cracked and the ink has bled through three pages" — not "the records are in disarray."

**Show change, not labels.** Success: don't say "The alliance is forged." Show what shifts — a behavioral change, a new tension, something the agent notices about themselves. Failure: must be "cool failure" — story-generative, not a dead end. "The lock held, and the sound carried further than expected" creates forward momentum.

**Minimum 2-3 sentences per narrative field.** One-sentence narratives are labels, not scenes.

**Reduce {adj} dependency.** The `{adj}` placeholder draws from sphere vocabulary (e.g., "crushing", "verdant", "crackling"). It's useful for sphere-flavoring a setting detail ("the {adj} glow of the forge") but destructive when asked to carry emotional weight ("the {adj} accord takes root" — "crushing accord"? "verdant accord"?). Use {adj} for atmospheric texture, never for emotional payload. If you can remove {adj} and the sentence still works, it probably shouldn't have been there.

### Bar 2: Systemic Wiring

Every narrative field should use the engine's dynamic capabilities. Ask yourself: "If I removed the agent's name and played this encounter with a different character, would the prose change at all?" If the answer is no, you're writing a book page.

**Minimum wiring per template:**

| Capability | Minimum | Where |
|---|---|---|
| `{name}`, `{they}/{them}/{their}/{s}` | Every narrative field | Basic identity |
| One conditional block | At least one step's narrative | `{?has_faction}...{/has_faction}` or `{?has_ally}...{/has_ally}` |
| Structurally different success/failure | Every step | Different *kinds* of persistence, not just different prose |

**Stretch wiring (use when the fiction calls for it):**

| Capability | When to use |
|---|---|
| `{ally:strongest}`, `{rival:strongest}` | When relationships would change the emotional texture |
| `{artifact:weapon}` / `{artifact:any}` | When possessions would change the scene |
| `{location}`, `{culture}` | When place or background matters |
| Encounter seeds | When the outcome should echo into a future story |
| Hidden marks | When the encounter involves deception, secrets, or debts |
| Intelligence grants | When knowledge is the prize |

**The decision framework for when to wire vs. when to write static:**
- If a different agent would experience this moment differently because of who they know, what they carry, or where they belong → wire it with conditionals
- If the encounter creates a secret, debt, or unresolved tension → hidden mark
- If the outcome should spawn a future encounter → encounter seed
- If the moment is universal and human (grief, exhaustion, relief) → static prose is fine. Not everything needs wiring. A line like "The quiet after was the worst part" doesn't need a conditional block.

---

## Guild Voice Guides

Each guild has a distinct voice AND a natural affinity for certain systemic capabilities. The voice shapes the prose; the capability affinity shapes what you wire.

### Arcane Circle
**Voice:** Wonder mixed with obsession. Beauty at the edge of dangerous knowledge. Sentences that start with observation and end with vertigo.
**Systemic affinity:** Encounter seeds (research leads to discovery leads to danger), hidden marks (forbidden knowledge), conditional blocks on `{?has_artifact}` (magical items change the meaning of arcane encounters).
**Example tone:** "The ley line reading holds steady at first — clean, geometric, the kind of pattern that makes junior surveyors smile. Then it shifts. The geometry is still there, but it's folded wrong, like a page turned backwards in a book no one was meant to read."

### Thieves Guild
**Voice:** Sharp observation, moral ambiguity, gallows humor. Short declarative sentences. The world measured in risk and opportunity.
**Systemic affinity:** Hidden marks (secrets, debts, leverage), intelligence grants (information as currency), conditional blocks on `{?has_faction}` (guild connections change what doors open).
**Example tone:** "The house sits on Coppergate Lane, three stories of limestone and leaded glass — the kind of address that announces itself by being quiet. The servants change shift at the eighth bell. There is a gap of perhaps four minutes when the back stairs are unwatched."

### Builders Fellowship
**Voice:** Patience, craft pride, the satisfaction of things well-made. Attention to material qualities. Time measured in how long things take to do properly.
**Systemic affinity:** Graph operations (createSublocation — building things is their whole identity), conditional blocks on `{?has_artifact}` (tools and materials change outcomes), reputation tallies (craft reputation accumulates slowly).
**Example tone:** "The mortar has cured overnight, but {name} presses {their} thumb into the join anyway — old habit, old caution. It gives just slightly under the nail. Another day. In the Fellowship, patience isn't a virtue. It's a structural requirement."

### Civic Guard
**Voice:** Duty weight, moral clarity tested by reality, weariness. Sentences that carry institutional gravity. The gap between the oath and the street.
**Systemic affinity:** Reputation flow (public trust is everything), hidden marks (corruption, compromise), conditional blocks on `{?has_faction}` (institutional loyalty complicates personal morality).
**Example tone:** "{name} checks the roster for the third time. The same names. The same gaps. Two of the night watch haven't reported in three days, and the captain hasn't asked why — which means the captain already knows, and knowing hasn't changed anything."

### Holy Order of Dawn
**Voice:** Reverence threaded with doubt. Ritual as anchor against uncertainty. The numinous experienced through mundane acts.
**Systemic affinity:** Encounter seeds (spiritual encounters that lead to deeper revelation or crisis of faith), conditional blocks on `{?has_ally}` (faith is communal — who stands with you matters).
**Example tone:** "The morning rite is the same as yesterday's and the thousand before it. {name} lights the candle, speaks the words, watches the smoke curl toward the ceiling. Some mornings the words feel like a conversation. Today they feel like a door that won't open."

### Lorekeepers' Covenant
**Voice:** Discovery hunger, the weight of secrets, ink-and-dust intimacy. Knowledge as something that changes you. The tension between preserving and understanding.
**Systemic affinity:** Intelligence grants (knowledge IS the prize), hidden marks (some knowledge is dangerous to hold), encounter seeds (one discovery leads to another).
**Example tone:** "The manuscript is older than the archive's catalog claims — the ink composition is wrong for the listed period, and whoever filed it either didn't notice or hoped no one would check. {name} sets it under better light. The margin notes are in a hand {they} recognize{s}."

### Merchant Consortium
**Voice:** Calculation as second nature, value in everything, trust as currency. Sentences that measure. A world where every favor has a price and every price tells a story.
**Systemic affinity:** Graph operations (trade routes, faction manipulation), intelligence (market information), reputation tallies (commercial reputation is everything).
**Example tone:** "The grain price at {location} has dropped twice in a week, which means either the harvest came in heavy or someone is dumping stock to drive a competitor under. {name} buys three bushels at the new price — not because {they} need{s} grain, but because the purchase will tell {them} which."

### Rangers Brotherhood
**Voice:** Silence comfort, reading the land, solitude as skill. Short sentences. What the landscape says if you know how to listen.
**Systemic affinity:** Intelligence (terrain, creature movements, hidden paths), conditional blocks on location/terrain, encounter seeds (what you find in the wild has consequences later).
**Example tone:** "The trail forks where the map says it shouldn't. Both paths show recent use — boot prints in the left, hoofprints in the right, neither more than a day old. {name} crouches. The hoofprints are shod wrong for cavalry. Merchant horses, overladen."

### Temple of Spheres
**Voice:** Cosmic awareness made ordinary. Sphere-language as native tongue. The numinous as daily reality, not special occasion.
**Systemic affinity:** Conditional blocks on sphere state (`{omen_adj}`, `{omen_verb}`, `{omen_noun}`), hidden marks (sphere contamination or resonance), encounter seeds (sphere work has long-term consequences).
**Example tone:** "The {omen_adj} resonance in the chamber has shifted since yesterday — not weakened, but retuned, as if something is listening back. {name} adjusts the calibration stones by feel. In the Temple, precision and intuition are the same skill."

### Underking's Court
**Voice:** Underground claustrophobia, power through control, darkness as home. Sentences that feel enclosed. Authority expressed through what is permitted, not what is commanded.
**Systemic affinity:** Hidden marks (the Court runs on secrets and leverage), intelligence (what you know determines your rank), faction manipulation (power games between underground factions).
**Example tone:** "The audience chamber is three levels below the street, and the air tastes of stone and tallow and the particular staleness that comes from rooms where windows have never existed. The Underking does not look up when {name} enters. Permission to approach is granted by the absence of objection."

---

## Editorial Checklist (Run After Writing)

Before submitting rewritten prose, check every field against these seven questions. If any answer is NO, revise.

1. **Does every narrative field use `{name}` and `{they}/{them}/{their}`?** Static names break immersion when a different agent runs the encounter.

2. **Does at least one step use a conditional block?** `{?has_faction}`, `{?has_ally}`, `{?has_artifact}` — at least one moment should read differently based on who the agent is.

3. **Does success show behavioral change, not just label the outcome?** "The alliance is forged" → NO. "Something shifts in the way {target} holds {their} shoulders — not deference, but the particular attention people give to those they've decided to take seriously" → YES.

4. **Is failure story-generative?** Does the failure prose create a forward hook — a complication, a witnessed moment, a shifted relationship? Or does it just negate the success? "The attempt failed" → NO. "The lock held — and the sound carried further than {name} expected" → YES.

5. **Do success and failure produce structurally different persistence?** If both outcomes just adjust reputationDelta in opposite directions, the world isn't observably different. Success should create different *kinds* of persistence than failure (e.g., success seeds a gratitude encounter; failure plants a hidden mark).

6. **Is {adj} used for atmosphere, not emotional payload?** Check every `{adj}` usage. "The {adj} glow of the forge" → fine (atmospheric). "The {adj} accord takes root" → bad (the adjective is asked to carry the emotion).

7. **Would the prose make you stop and read it in a novel?** The read-aloud test. If a sentence sounds like a quest log entry ("Investigate the disturbance"), it fails. If it sounds like something from a book you'd actually enjoy ("The disturbance isn't sound exactly — it's the absence where sound should be, a pocket of silence that moves when you're not looking directly at it"), it passes.

---

## Worked Before/After

### BEFORE (current thieves guild — "Pick Pocket" encounter)

```typescript
narrative: 'The guild assigns a busy market square. You study the flow of coin.',
onSuccess: {
  narrative: 'Nimble fingers and a steady nerve. Time to work.',
},
onFailure: {
  narrative: 'The mark shifts at the wrong moment. Nothing taken.',
},
```

**Problems:** Static strings (no `{name}`, no pronouns, no conditionals). Success is a label, not a scene. Failure is a negation of success. No sensory detail. No emotional stakes. No systemic wiring. This reads the same for every agent in every context.

### AFTER (rewritten)

```typescript
narrative:
  'The market at {location} moves in patterns if you know how to read them — ' +
  'the pause before a purse opens, the way a merchant\'s eyes track left when ' +
  'counting change, the moment between transactions when attention is spent ' +
  'and not yet replenished. {name} finds a post near the cloth-seller\'s stall ' +
  'where two lanes of foot traffic cross. {?has_faction}The guild marked this ' +
  'square as active — three good lifts reported this week, which means the ' +
  'merchants haven\'t adjusted yet.{/has_faction}{?no_faction}No guild ' +
  'intelligence to lean on. Just eyes, timing, and the particular arithmetic ' +
  'of crowds.{/no_faction}',
onSuccess: {
  narrative:
    'The lift is clean — wrist-turn, two fingers, gone before the mark\'s ' +
    'hand reaches the empty pocket. {name} doesn\'t look back. Looking back ' +
    'is how you get remembered, and in this trade, being forgotten is the ' +
    'highest skill. Three streets away, {they} count{s} what {they} took: ' +
    'enough to matter, not enough to warrant a search. ' +
    '{?has_faction}The guild handler nods once when {name} reports. In their ' +
    'vocabulary, that\'s high praise.{/has_faction}',
  reputationDelta: 0.05,
},
onFailure: {
  narrative:
    'The timing is right but the angle is wrong — {name}\'s fingers brush ' +
    'the purse-strings and the mark stiffens, hand dropping to {their} belt ' +
    'with the speed of someone who\'s been robbed before. {name} is already ' +
    'moving, already someone else in the crowd, but the mark is turning, ' +
    'scanning faces with the particular fury of the almost-victimized. ' +
    'Nothing taken. But the market is mapped now — the traffic patterns, the ' +
    'blind spots, the cloth-seller who never looks up. What was learned today ' +
    'makes the next attempt a different kind of proposition.',
  reputationDelta: -0.02,
},
```

**What changed:**
- `{name}`, `{they}/{them}/{their}/{s}` throughout (identity)
- `{location}` grounds the scene in a specific place
- `{?has_faction}` / `{?no_faction}` creates two emotional textures: guild-backed vs. alone
- Success shows behavioral change (the handler's nod, the specific skill of being forgotten)
- Failure is "cool" — the market is mapped, the next attempt will be different (forward hook)
- Sensory detail: wrist-turn, two fingers, cloth-seller's stall, two lanes of foot traffic
- No `{adj}` carrying emotional weight

---

## Process

For each encounter file you rewrite:

1. **Read the file** — understand the template count, step structure, reaches, difficulty curves
2. **Read the systemic wiring guide** — know what the 7 capabilities can do
3. **Identify the guild voice** — use the voice guide above
4. **For each template, write the scene first** — before touching the TypeScript, write the moment as prose. What is the agent doing? What goes wrong (or right)? What does the player read? Then fit the prose into the template fields.
5. **Wire the dynamics** — add enrichment placeholders, conditional blocks, and ensure success/failure produce structurally different persistence
6. **Run the editorial checklist** — all 7 questions must pass
7. **Preserve the TypeScript skeleton** — same IDs, same reaches, same difficulties, same reward pools unless clearly wrong. You're upgrading prose and adding wiring, not restructuring encounters.
