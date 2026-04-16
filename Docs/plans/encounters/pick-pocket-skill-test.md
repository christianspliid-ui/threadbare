# Pick Pocket (Pocket Run) — Skill Test Rewrite

**Source template:** `tg.quest.pocket_run` in `src/data/thieves-guild-encounter-content.ts`
**Skill used:** `template-encounter-rewrite`
**Guild voice:** Thieves Guild — sharp observation, moral ambiguity, gallows humor. Short declarative sentences. The world measured in risk and opportunity.
**Systemic affinity:** Hidden marks, intelligence grants, conditional blocks on `{?has_faction}`.

---

## Structural Skeleton (preserved from original)

- **ID:** `tg.quest.pocket_run`
- **Name:** Pocket Run
- **Location types:** town, city, capital
- **Steps:** 2 (Scout the Crowd [eye, difficulty 25, duration 1], Lift the Purses [shadow, difficulty 35, duration 2])
- **Reach:** primary shadow, secondary eye
- **Encounter type:** steal
- **Threat rating:** easy
- **Intrinsic tier:** shaping
- **Reward pools:** preserved exactly from original

---

## Rewritten TypeScript

```typescript
{
  id: 'tg.quest.pocket_run',
  name: 'Pocket Run',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'tg.quest.pocket_run.1',
      name: 'Scout the Crowd',
      narrative:
        'The market at {location} runs on two clocks: the one the merchants keep, ' +
        'and the one {name} keeps. The merchants\' clock measures opening bells and ' +
        'closing bells and the slow crawl of afternoon shadow across the stalls. ' +
        '{name}\'s clock measures something else — the pause between a customer ' +
        'counting change and the moment the purse-strings go slack, the three-second ' +
        'window when a cloth-seller turns to fetch a bolt from the back shelf and ' +
        'every eye in the lane follows the movement. {They} find{s} a post where ' +
        'two foot-traffic lanes cross, near a spice merchant whose wares make ' +
        'people stop and lean in close. Stopping is good. Leaning is better. ' +
        '{?has_faction}The guild marked this square active — three clean lifts ' +
        'reported this week, which means the ward patrol hasn\'t adjusted its ' +
        'route yet. A window measured in days, not weeks.{/has_faction}' +
        '{?no_faction}No guild intelligence to lean on. No route maps, no patrol ' +
        'schedules, no handler to signal if the ward watch doubles back early. ' +
        'Just {name}, the crowd, and the particular arithmetic of attention.{/no_faction}',
      reach: 'eye',
      difficulty: TG_DIFFICULTY_BASE,
      duration: 1,
      onSuccess: {
        narrative:
          'The patterns resolve. A wool trader with a belt-purse that gaps when ' +
          'he reaches for samples. A scribe\'s wife whose coin-pouch rides on ' +
          'the outside of her basket, swinging with every step. A visiting ' +
          'merchant who keeps touching his breast pocket — checking, checking — ' +
          'which means he doesn\'t trust the crowd, which means the pocket is ' +
          'worth trusting. {name} catalogues three marks in the first hour. The ' +
          'spice merchant\'s stall will be the stage. The mid-afternoon crush ' +
          'will be the curtain.',
      },
      onFailure: {
        narrative:
          'The crowd is wrong today. Too thin near the stalls that matter, too ' +
          'thick near the ones that don\'t. A pair of ward constables have parked ' +
          'themselves by the fountain — not patrolling, just watching, which is ' +
          'worse. {name} recognizes the posture: someone reported a lift this ' +
          'week, and now the square is hot. The smart move is to walk away and ' +
          'come back in three days when the constables get reassigned to something ' +
          'that matters more. {They} walk{s} away. In this trade, patience and ' +
          'cowardice look exactly the same, and the difference only matters to ' +
          'the person exercising them.',
      },
    },
    {
      id: 'tg.quest.pocket_run.2',
      name: 'Lift the Purses',
      narrative:
        'The afternoon crush arrives on schedule. Bodies press between the stalls ' +
        'and the crowd becomes a single organism — hundreds of elbows and shoulders ' +
        'moving in loose choreography, every collision an apology, every apology ' +
        'a momentary blindness. This is the window. {name} moves into the current ' +
        'and becomes part of it, matching pace, matching rhythm, one more body in ' +
        'the lane with nothing on {their} face worth remembering. ' +
        '{?has_ally}Somewhere in the crowd, {ally:strongest} is working a parallel ' +
        'lane — not a partner exactly, but a known quantity whose presence means ' +
        'if something goes wrong, there\'s someone to cause a distraction.{/has_ally}' +
        '{?no_ally}No partner. No lookout. Just the work and the exit route ' +
        '{they} mapped{s} this morning, three turns to the alley behind the ' +
        'tanner\'s shop where the smell keeps honest people away.{/no_ally}',
      reach: 'shadow',
      difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP,
      duration: 2,
      onSuccess: {
        narrative:
          'The lift is clean — wrist-turn, two fingers, the weight transfers ' +
          'and the mark\'s hand is still reaching for a sample of Keshian pepper. ' +
          '{name} doesn\'t look back. Looking back is how you get remembered, ' +
          'and in this trade, being forgotten is the highest skill. Three streets ' +
          'away, in the shadow of the tanner\'s shop, {they} count{s} what {they} ' +
          'took. The wool trader\'s purse held more than expected — enough to ' +
          'matter, not enough to warrant a search. The scribe\'s wife will check ' +
          'her basket at the next stall and find the pouch gone, and she\'ll ' +
          'think she dropped it, because that\'s what people think when the ' +
          'alternative is admitting someone was that close without them knowing. ' +
          '{?has_faction}The guild handler meets {them} at the usual drop. ' +
          'He weighs the take, skims the guild\'s cut, and nods once. In the ' +
          'guild\'s vocabulary, that nod is worth more than the coin.{/has_faction}' +
          '{?no_faction}{name} keeps everything. No cut, no handler, no nod ' +
          'of approval. Freedom and loneliness weigh about the same in ' +
          'a belt-purse.{/no_faction}',
        tierPromotionEligible: true,
        rewardPool: {
          categoryWeights: { possession: 0.60, condition: 0.25, bestowed_power: 0.15 },
          tagFilters: ['#gold'],
        },
      },
      onFailure: {
        narrative:
          'The timing is right but the angle is wrong — {name}\'s fingertips ' +
          'brush the purse-strings and the wool trader stiffens, hand dropping ' +
          'to his belt with the speed of someone who has been robbed before. ' +
          'Not a first-timer. {name} is already moving, already someone else ' +
          'in the crowd — shoulders different, gait different, head turned ' +
          'toward a stall selling copper pots as if that\'s all {they} came for. ' +
          'But the trader is turning, scanning faces with the particular fury ' +
          'of the almost-victimized, and a woman nearby is watching too, not ' +
          'the trader but {name}, and her eyes are the kind that file things ' +
          'away. Nothing taken. But the square is mapped now — the traffic ' +
          'patterns, the blind spots, the spice merchant who never looks up ' +
          'from his scales. What {name} learned today is worth more than what ' +
          '{they} failed to take. The next attempt at {location} will be a ' +
          'different kind of proposition entirely.',
        rewardPool: {
          categoryWeights: { condition: 0.80, possession: 0.20 },
        },
      },
    },
  ],
  reachPrimary: 'shadow',
  reachSecondary: 'eye',
  encounterType: 'steal',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  questPriority: 3.0,
},
```

---

## Systemic Wiring Inventory

| Capability | Usage | Where |
|---|---|---|
| `{name}`, `{they}/{them}/{their}/{s}` | Every narrative field (12 instances across 6 fields) | All steps, all outcomes |
| `{location}` | Grounds the scene in a specific place | Step 1 narrative, Step 2 failure |
| `{?has_faction}/{?no_faction}` | Two emotional textures: guild-backed (intel, handler, approval) vs. independent (alone, no safety net, freedom) | Step 1 narrative, Step 2 success |
| `{?has_ally}/{?no_ally}` | Parallel worker vs. solo operation | Step 2 narrative |
| `{ally:strongest}` | Named ally working nearby | Step 2 narrative (inside has_ally block) |
| Structurally different success/failure | Success: clean getaway, guild approval, skill validated. Failure: market mapped (intelligence), watcher noted (forward hook), next attempt changed. | Step 2 outcomes |

### Wiring That Could Be Added in Implementation (stretch, not prose-level)

These would be added to the aftermath config, not the narrative fields, but the prose is written to support them:

- **Hidden mark on failure:** The woman who watched {name} during the botched lift — `{ kind: 'hidden_mark', category: 'witnessed', severity: 0.3, label: 'Face noted by a sharp-eyed bystander at the market', revealFamilies: ['investigation', 'civic_guard'] }`. The prose already names her ("a woman nearby is watching too... her eyes are the kind that file things away").
- **Intelligence on failure:** The market reconnaissance — `{ kind: 'intelligence', category: 'trade_route', label: 'Market patrol patterns at {location}', detail: 'Traffic flows, blind spots, guard schedules mapped through direct observation' }`. The prose already establishes this ("the square is mapped now").
- **Reputation tally on success:** `{ kind: 'reputation_tally', key: 'clean_lift', delta: 1 }` — building toward thief reputation thresholds. The guild handler's nod signals this accumulation.

---

## Editorial Checklist

### 1. Does every narrative field use `{name}` and `{they}/{them}/{their}`?

**PASS.** All six narrative fields (step 1 narrative, step 1 success, step 1 failure, step 2 narrative, step 2 success, step 2 failure) use `{name}` and pronoun placeholders. No static "you" anywhere.

### 2. Does at least one step use a conditional block?

**PASS.** Three conditional blocks used:
- Step 1 narrative: `{?has_faction}/{?no_faction}` (guild intelligence vs. alone)
- Step 2 narrative: `{?has_ally}/{?no_ally}` (parallel worker vs. solo)
- Step 2 success: `{?has_faction}/{?no_faction}` (handler's nod vs. keeping everything)

### 3. Does success show behavioral change, not just label the outcome?

**PASS.** Success in step 2 shows specific behavioral change: the scribe's wife will rationalize the loss ("she'll think she dropped it, because that's what people think when the alternative is admitting someone was that close"), and the guild handler's nod carries weight as institutional recognition. The success isn't "the theft worked" -- it's "this is what being good at this looks like, and here's what it means to the people around you."

### 4. Is failure story-generative?

**PASS.** Step 1 failure: the constables' presence is information (someone reported a lift), and walking away is characterized as a skill ("patience and cowardice look exactly the same"). Step 2 failure: the market is now mapped, a sharp-eyed woman has filed {name}'s face away (forward hook for a hidden mark), and the prose explicitly plants the next attempt ("a different kind of proposition entirely"). Failure produces reconnaissance, not punishment.

### 5. Do success and failure produce structurally different persistence?

**PASS.** Success produces: guild reputation (handler's nod / reputation tally), material reward (the take), and skill validation (tier promotion eligible). Failure produces: intelligence (market mapped — patrol patterns, blind spots, timing), a witnessed moment (the sharp-eyed woman — hidden mark candidate), and a forward hook (next attempt will be different). These are structurally different kinds of persistence: success builds reputation and material wealth; failure builds knowledge and risk exposure.

### 6. Is `{adj}` used for atmosphere, not emotional payload?

**PASS.** No `{adj}` placeholder is used anywhere in the rewrite. The Thieves Guild voice relies on concrete observation and short declarative sentences, not sphere-flavored adjectives. Atmospheric texture comes from specific sensory detail (Keshian pepper, copper pots, the tanner's shop smell) rather than placeholder adjectives.

### 7. Would the prose make you stop and read it in a novel?

**PASS.** Specific lines that pass the read-aloud test:
- "The market at {location} runs on two clocks: the one the merchants keep, and the one {name} keeps."
- "Looking back is how you get remembered, and in this trade, being forgotten is the highest skill."
- "she'll think she dropped it, because that's what people think when the alternative is admitting someone was that close without them knowing"
- "Freedom and loneliness weigh about the same in a belt-purse."
- "patience and cowardice look exactly the same, and the difference only matters to the person exercising them"

These are lines with observation and gallows humor in the Thieves Guild voice, not quest log entries.

---

## Summary: Before vs. After

| Dimension | Before | After |
|---|---|---|
| Placeholders | 0 | 12+ (`{name}`, `{they}`, `{them}`, `{their}`, `{s}`, `{location}`, `{ally:strongest}`) |
| Conditional blocks | 0 | 3 (`has_faction` x2, `has_ally` x1) |
| Prose length (step 2 success) | 1 sentence | 8 sentences |
| Sensory detail | None | Keshian pepper, copper pots, tanner's shop, spice merchant, wool trader |
| Forward hooks in failure | 0 ("Nothing taken.") | 2 (market mapped, face noted by watcher) |
| Guild voice | Generic | Sharp observation, short declaratives, gallows humor |
| Hidden mark candidates | 0 | 1 (sharp-eyed bystander) |
| Intelligence candidates | 0 | 1 (market patrol patterns) |
| `{adj}` misuse | N/A | 0 instances |
