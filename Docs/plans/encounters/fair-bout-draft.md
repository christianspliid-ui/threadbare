# Encounter Pipeline: Called to the Ring
> Scale: short | Slug: fair-bout | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.fair_bout` · Batch: journeyman-everyday-2, slot 1 (THR-1677)
> Package: `Docs/plans/encounters/fair-bout.package.json` (dry-run clean)

## 0. Design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | The fair's ring champion calls the agent out by name for a purse bout, and the fair's custom says a call must be answered. |
| Title states the crux | *Called to the Ring*. |
| Whose problem? | The agent's. They are the one called (agentRole: the target), and stepping through the rope is their choice alone. |
| Reach = theme | Iron on both steps. Step 0 is holding ground while the champion's corner shoves them at the rope. Step 1 (bout path) is the fight itself: a heavier fighter's rushes against their stance. |
| Shape | **Opt-in Complication.** Step 0 (iron 0.42) is standing the corner down, and every mortal takes it. Then comes an agent-decided fork on `courage_prudence`. The Vanguard (`positive`) takes the bout (iron 0.45, the test engaged). The Watcher (`negative`) walks out (iron 0.20), and the test there is to keep from swinging at the jeering corner. |
| Opposition | The fair's own law: a challenge called at the ring is answered, or the refusal is cried at the ring. It is custom only, with no magic in it. |
| P3 stake | Threat. Refuse the call and be named a coward at the ring. The money is a purse of silver, and the crowd is betting. |
| Disposition | Open. The corner is rough but sporting, and the backer is a quiet ally. |
| Scale | Personal. |
| Catalog picks | setting urban + rural · pressure public challenge · form contest · objective win the purse or leave with face · stakes money + standing · system cards/forks (mature) + companions |
| Hook | `hook.trial_by_combat` (see § 1) |
| Tone | A pleasure. This is the batch's fair, and it resolves with a purse and a new face on the road. |

## 1. Inspiration Anchors

- **Hook taken: `hook.trial_by_combat`.** The hook reads "a dispute will be settled by single combat, and the person in the right is not the better fighter". Here it becomes a question settled by a bout under the fair's own law, and the stranger is not the favourite. The other two rolled hooks were `hook.civil_unrest` and `hook.desperate_escort`. Both pull toward grim or large stakes, which the brief's "at least one is a pleasure" row rules out for this slot.
- **Structural model: The Run the Pilot Refused** (`pilots-reckoning.package.json`), batch 1's opt-in. It has a plain step, then a `courage_prudence` fork where the two step-0 specials lean opposite poles. The decline pole is a cheap `bond_change` exit.
- **Anti-patterns avoided:**
  - A fight-system encounter: there is no `fight`/`confront`/monster gate. This is a sporting bout, resolved as an ordinary iron step.
  - A personal condition as the failure penalty: a lost bout costs the purse and the backer's money.
  - A scene-phrase chip noun: every noun is a sheet word (`companion`, `a favour owed`, `reputation with {target}`).

## 2. Scale Justification

The template is short: two beats at `scale: 'local'`, `rarityTier: 2`. The stakes are a purse, a crowd's bets and one's name at one fair. That is journeyman weight: real money and standing, stated plainly, with no rule gate. The rolled personal scale fits; the only people touched are the fighter, the champion, the backer and the cutman.

## 3. Pressure Knot

A fair is on, and it has a ring. One champion has held the ring for three days against every comer, and the champion's backers have made money on each bout. The corner needs a new challenger to keep the betting going. It picks a stranger who looks like a fighter and calls them out by name before the crowd. The fair's custom does the rest: a refused call is cried at the ring.

## 4. Intervention Fantasy

The god works on a fighter at the rope and then in the ring. At the rope, the god can raise the crowd's roar behind them, which leans the fighter toward the bout. Or the god can cool their temper so they size the champion up plainly, which leans them toward caution. In the ring, the god can set their feet against the heavier fighter's rushes, or tempt the favourite into showing off. The mortal decides whether to step through the rope. The god only leans them.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:champion}` Bram Tallow | actor, guard/mercenary, must-persist | The ring champion. Named in beat 1 and on the walk-away path. `bond_change` target on every win (-0.08) and on every decline (-0.05 / -0.12). |
| `{cast:backer}` Oda Brisk | actor, innkeeper/merchant, must-persist | Holds the stakes and quietly bets on the stranger against the fair. The `favor_creation` debtor on a win, and the `bond_change` target on a loss (-0.15). |
| The cutman | companion, `companion.hedge-healer` (existing template) | Introduced in beat 2 as "the champion's cutman … with needle and thread". Minted on a win with a generated name. The prose never names them. |
| The purse, the crowd's bets, the crier, the stewards | scene-local | Stated facts, no life outside the scene. |

## 6. Beat Structure

1. **Stand the corner down.** Iron 0.42, `continue_weakened`. Every mortal holds ground at the rope while the corner crowds them.
2. **Fork on `courage_prudence`** (agent-decided, THR-894):
   - `positive` (Vanguard): **Fight the purse bout.** Iron **0.45** (the open-draw cap), `fail_action`.
   - `negative` (Watcher): **Walk from the ring.** Iron 0.20, `fail_action`. This is the cheap exit: walk out through the jeers without taking the bait.

## 7. Branching Profile

- Branch depth: light · Branch count: 2.
- Where branching lives: step 1 (prose, test, hand), the aftermath variant, and the consequence hand. Only the bout path grants the companion and the favour.
- Convergence policy: none. The poles resolve to different aftermath variants.
- Shape: **Opt-in Complication.** The engage/decline gate is the mortal's own personality.

## 8. Branching Map

The step-0 specials carry pole leans. `Rouse The Crowd` leans `positive`; `Cool The Blood` leans `negative`. The mortal's axis position plus the net lean picks the pole, and fate rolls the result.

- **Positive:** step 1 prose puts `{cast:backer}` and the cutman on stage. A win grants the companion, the favour and a small champion regard loss. A loss costs the backer's regard.
- **Negative:** step 1 prose is the walk-out under the corner's jeers. A clean walk costs a little of the champion's regard (-0.05). Taking the bait costs more (-0.12). There is no companion and no favour: declining forfeits the drawn prize by design.

## 9. Outcome Ladder

| Band | Bout path | Walk-away path |
|---|---|---|
| critical_success | Champion down in the first exchange; purse won; the crowd paid out; the fair talks of it by dusk. Companion + favour | Walks out so calmly that half the crowd stops jeering; small regard loss |
| success | Champion yields; purse won; the backer collects a quiet bet. Companion + favour | Walks out without turning round; the crier names the refusal; small regard loss |
| success_at_cost | Purse won with a split brow that needed stitching; the champion leaves without shaking hands. Companion + favour + the champion's regard falls (chipped) | Pays a coin of forfeit at the gate; small regard loss |
| failure | Champion wears them down and keeps the purse; the backer loses the quiet bet. Backer's regard falls | Turns on the jeering corner; the stewards pull them apart. Regard falls |
| critical_failure | Down in the first exchange; jeered out of the ring. Backer's regard falls | Swings, loses the scuffle, pays the forfeit; named a coward to the whole fair. Regard falls |

## 10. Sample Opening — 67–68 words with the spine

**urban (12):**
> {actor} is in {location} for the first day of the town fair.

**rural (11):**
> {actor} comes into {location} on the morning of the harvest fair.

**Spine (step 0, 56):**
> {cast:champion} has held the fair's ring for three days against every comer. The champion's corner calls {actor} out by name and crowds {actor} against the rope. A purse of silver rides on the bout, and the crowd is already betting. By the fair's custom, a fighter who refuses a call is named a coward at the ring.

### The narrator's 12 questions

1. **P1 arrival?** Yes, with real names, per class.
2. **P2 events?** The champion has held the ring three days; the corner calls `{actor}` out by name and crowds them at the rope.
3. **P3 one stake?** Threat: refuse and be named a coward at the ring. The purse and the bets are stated in plain words.
4. **≤80 words?** Yes, 67–68.
5. **Read aloud?** Yes. Every sentence is a report.
6. **Stated, never encoded?** The call, the custom, the purse and the bets are all stated outright.
7. **Every sentence works?** Yes. Each states the challenge, the test or the stake.
8. **Nothing unintroduced?** The backer and the cutman appear in the bout step before any chip names them.
9. **One named person per beat?** Beat 1 has `{cast:champion}`. Beat 2 has `{cast:backer}` on the bout path, or `{cast:champion}` on the walk-away path.
10. **Stake in a sentence?** "Will the stranger answer the champion's call for a purse, or walk out and be named a coward at the ring?"
11. **Cards verb+noun, spell-style?** Yes. No word of a card's name is repeated in its effect line.
12. **Opening per class?** `urban` and `rural`.

## 11. The Hand Per Step

Each nudge-bearing step authors specials and declares a `deal`. No `libraryCardId` is used, so the batch's over-exposed list is untouched.

**Step 0** (deal 4, `['might','presence']`)

- **Rouse The Crowd**
  - Type: Boost + pole lean. Sphere energy, 2 essence, +0.08, leans toward the Vanguard pole.
  - Effect: "Raise a roar from the onlookers behind them, so the ring feels like theirs. A loud ring argues for fighting."
  - Fragments:
    - success_at_cost: "The onlookers roared for {actor}, and the corner shoved harder to quiet them."
    - failure: "The roar went up behind {actor}, and the corner laughed over it."
    - critical_failure: "The roar turned to laughter when the corner shoved {actor} off the rope."
- **Cool The Blood**
  - Type: Boost + pole lean. Sphere mind, 2 essence, +0.10, leans toward the Watcher pole.
  - Effect: "Settle their anger against the jeers, so they size up the fighter across the rope. A clear head argues for caution."
  - Fragments:
    - critical_success: "{actor} watched the champion's feet through the shoving and saw how the champion moves."
    - success: "{actor} stayed calm at the rope and took a long look at the champion."
    - near_miss: "{actor} kept a cool head, and gave a step of ground keeping it."
    - failure: "{actor} stayed calm, and the corner took the calm for fear."

**Step 1, positive** (deal 4, `['might','peril']`)

- **Harden The Stance**
  - Type: Boost. Sphere matter, 2 essence, +0.12.
  - Effect: "Set their feet like roots, so a heavier fighter's rushes cannot move them."
  - Fragments:
    - success: "{actor} took the champion's rushes square and gave no ground."
    - failure: "{actor} held firm, and the champion simply went round."
    - critical_failure: "{actor} stood planted and took every blow the champion threw."
- **Goad The Champion**
  - Type: Whisper. Sphere chaos, 1 essence, +0.07.
  - Effect: "Tempt the favourite to play to the onlookers, so their guard drops for a cheer."
  - Fragments:
    - critical_success: "The champion turned to wave at the crowd, and {actor} ended the bout there."
    - success_at_cost: "The champion showed off, and caught {actor} with a wild swing doing it."
    - near_miss: "The champion played to the crowd once, and {actor} was too slow to use it."
    - failure: "The champion never took an eye off {actor} once."

**Step 1, negative / fallback** (deal 4, `['social','presence']`): no specials.

Hand checks:
- No rider, no delta ≥ 0.15, no grants, no cost channels.
- All six StepOutcomes are covered on both special-bearing steps.
- The specials span four spheres: energy, mind, matter and chaos.

## 12. Branch-Dependent Later Paragraphs

- **Positive:** "{actor} answers the call and steps into the ring. {cast:backer}, who holds the stakes, quietly bets on {actor} against the whole fair. The champion is heavier and has fought here three days running. The champion's cutman waits in the corner with needle and thread. The bout runs until one fighter yields."
- **Negative:** "{actor} will not take the bout, and walks out through the crowd. {cast:champion}'s corner follows, jeering, to draw a swing. The fair's crier calls the refusal at the ring, as the custom allows."

## 13. Aftermath Paragraph (bout path, success)

"{actor} wore the champion down and took the purse when the champion yielded. {cast:backer} collected on a bet laid against the whole fair, and told nobody."

### Band pages (overview, then chips in scar · bond · boon · path order)

- **critical_success**
  - Overview: "{actor} put {cast:champion} down in the first exchange and took the purse. Most of the crowd had bet on the champion and paid out to the few who had not. Every stall at the fair was talking about the bout by dusk."
  - BOND · companion: "Left the beaten corner — A hedge-healer travels with {actor} now." (10 words)
  - BOND · a favour owed: "Won the quiet bet — {cast:backer} owes {actor} a favour." (9 words)
- **success**
  - Overview: as § 13.
  - BOND · companion: "Left the beaten corner — A hedge-healer travels with {actor} now."
  - BOND · a favour owed: "{cast:backer} owes {actor} a favour." The cause is already in the overview, so the chip carries none.
- **success_at_cost**
  - Overview: "{actor} took the purse and a split brow that needed stitching. {cast:champion} yielded late, and left the ring without shaking hands."
  - SCAR · reputation with {target}: "{cast:champion} thinks less of {actor} now."
  - BOND · companion: "Closed the brow — A hedge-healer travels with {actor} now."
  - BOND · a favour owed: "Won the quiet bet — {cast:backer} owes {actor} a favour."
- **failure**
  - Overview: "{cast:champion} wore {actor} down and kept the purse. {cast:backer} lost a bet laid quietly on {actor}, and the champion's backers collected from the crowd."
  - SCAR · reputation with {target}: "{cast:backer} thinks less of {actor} now."
- **critical_failure**
  - Overview: "{cast:champion} put {actor} down in the first exchange. {actor} lost the bout, {cast:backer} lost the money bet on it, and the crowd jeered {actor} out of the ring."
  - SCAR · reputation with {target}: same as failure. The magnitude is the same write, so the chip does not claim "hard".
- **Walk-away path**
  - Base overview: "{actor} walked away from the call. The crier named the refusal at the ring, as the fair's custom says, and {cast:champion} kept the purse."
  - SCAR · reputation with {target}: "{cast:champion} thinks a little less of {actor}."
  - Failure and critical_failure override the overview and carry "{cast:champion}'s regard for {actor} fell."

Each page was read as one text. No chip repeats a four-word run from its overview, and no two blocks disagree about what happened.

## 14. Aftermath Reaction Choices

No reaction choices; the consequence is clean (short scale). Every write rides the step metadata, so each chip is true on its band without a click.

## 15. Aftermath Kit Summary

- **BOND · companion.** `grant_companion` `companion.hedge-healer` on the bout path's success side. The beaten champion's cutman walks with the winner. This is the drawn `companion` family.
- **BOND · a favour owed.** `favor_creation`, debtor `$cast:backer`, on the same success side. The stakeholder's quiet bet against the whole fair is the secret, and the favour is what it bought. This is the drawn `secret` family.
- **SCAR · reputation with the champion.** `bond_change` -0.08 on every win, chipped on `success_at_cost` only as that band's price. The walk-away path also costs the champion's regard: -0.05 on success, -0.12 on failure.
- **SCAR · reputation with the backer.** `bond_change` -0.15 on a lost bout.

## 16. Consequence wiring (binding hand `companion` + `secret`, no swap)

| Family | Effect kind | Where | Verified |
|---|---|---|---|
| `companion` | `grant_companion` (`companionTemplateId: 'companion.hedge-healer'`, `targetAgentId: '$actor'`) | step 1 `positive.successMetadata` | Template exists in `src/data/companion-templates.ts`: profession Hedge-Healer, tier 2, `#wilds #settlement`, not unique. Its join sentence (a wound stitched, stayed to see it heal) matches a cutman. `grant_companion` is in `CHIP_BACKING_EFFECT_KINDS` and satisfies `companion` in `consequenceDraw.ts`. |
| `secret` | `favor_creation` (`debtorAgentId: '$cast:backer'`, magnitude 0.15–0.3) | step 1 `positive.successMetadata` | Listed for `secret` in the spec's family table and the brief. It is persistent, and `$cast:backer` is a declared must-persist key. |

The dry-run recomputed the hand as `['companion', 'secret']`.

**Chip anchors:**
- `companion` uses `tooltipId: 'ui.companions'`, which exists in `src/data/ui-content.ts`. There is no `entityId`, because the minted companion's node id is unknown at author time.
- `a favour owed` uses `ui.favour_owed` (exists), with a concept anchoring `$cast:backer`, the debtor, as in `counting-house-dispute`.
- `reputation with {target}` anchors `$cast:<key>`, the one lawful carrier anchor.

## 17. Trait hooks

1. **Gate:** none. The encounter is everyday by construction.
2. **Variants:**
   - Brave (`trait.personality.iron.virtue`), +0.04: "Being Brave, they give no ground to a shove."
   - Proud (`trait.core.core_humility.vice`), -0.04: "Being Proud, they rise to every jeer from the corner."
3. **Trait-only nudge:** none. The specials cap is spent on the pole-lean pair.
4. **Trait fragment:** none.

## 18. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| champion | lazy-materialize-on-trigger | reuse guard/mercenary, spawn guard "Bram Tallow" | must-persist | `bond_change` target on the win and decline paths | built |
| backer | lazy-materialize-on-trigger | reuse innkeeper/merchant, spawn innkeeper "Oda Brisk" | must-persist | `favor_creation` debtor; `bond_change` on a loss | built |
| cutman | minted on a win | `companion.hedge-healer` | companion (permanent loss condition) | the bearer's Companions row | existing template |

**Class-honesty:**
- Guard is seeded at hamlet (0.8) and town/city (1.0). Innkeeper is seeded at hamlet and town (1.0).
- Mercenary (city) and merchant (town/city) widen the reuse pool.
- Both spawn names read correctly at a village green or a town square.

## 19. Self-Audit

- PASS: brief row.
  - The id, reach iron, settings `urban` + `rural`, rarityTier 2 and scale local match.
  - Step 0 is 0.42 and the bout path 0.45; no step exceeds 0.45.
  - **Flag:** the fork step carries no top-level `difficulty`. `measure:roll-spread` will read the mean as 0.42 (window fit 0.56). That is still journeyman, the same shape as batch 1's pilots-reckoning.
- PASS: no fight, confront, monster, army or guild-rank gate. The id sits under `encounter.town.*`.
- PASS: consequence hand wired on the success side, as the brief's slot-1 wiring says. No swap.
- PASS: no `apply_condition` on `$actor`. The split brow is band prose, not a condition.
- PASS: every chip is backed by a write on its band, and every chip is ≤15 words.
- PASS: every stateNoun is a sheet word, and each anchor resolves (tooltip ids exist; `$cast` keys are declared).
- PASS: the specials cap of 2 per step is held. Each special carries a failure-band fragment. No card effect line repeats a name word.
- PASS: prose rule 7. No agent history is asserted; the call and the bet are scene-local.
- PASS: prose rule 7b. No later place or time is promised. "Talking about the bout by dusk" is past tense, same scene.
- PASS: no bound cast member is gendered.
- PASS: outcome-class vagueness. There is no "something", "someone", "way" or "nothing" in the afterimages, fragments or overviews.
- FLAG for Pass 2 (Law 56 semantics): the champion's `bond_change` fires on every win but is chipped only on `success_at_cost`. The write is real on every success band; the other bands simply do not report it. If the critic prefers, it can be chipped on all three success bands.
- FLAG for Pass 2: the `companion` chip has no `entityId`, because the minted companion's id is not known at author time. It anchors through `ui.companions` instead. There is no corpus precedent for a companion chip.
- FLAG: `check:encounter` has not been run. Only the dry-run compile was allowed in this pass.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (the crowd's roar vs a cool head vs footing vs the favourite's vanity) · 9b YES · 10 YES · 11 YES (champion, backer and the cutman as a hedge-healer) · 11b YES · 12 N/A (short scale) · 13 N/A · 14 YES (below).

## Concept Art Direction

1. **What does the story feel like?**
   - The pleasure of a fair day with an edge under it.
   - The pull of a public dare.
   - Money changing hands on someone else's nerve.
2. **Evocative image:**
   - A roped ring on a trampled fair green, empty after the bouts.
   - One rope sags where someone was pushed against it.
   - A cutman's stool stands in the corner with a spool of thread and a basin of pink water.
   - A scatter of betting tallies lies chalked on a board by the rail.
   - Bunting hangs overhead, and the fair's stalls are closing in late light.
   - No people.

## Critic revisions (Passes 2 / 3 / 3b, 2026-09-29)

An independent critic applied these changes to `fair-bout.package.json`. The package is now the revised artifact, and the sections above keep the original draft for the record. Verdicts: editorial **PASS WITH REVISIONS**, systems **READY FOR IMPLEMENTATION**, package **connected / PACKAGE PASS**. Details are in `fair-bout-editorial.md`, `fair-bout-systems.md` and `fair-bout-package.md`.

1. **Openings.** "First day of the town fair" contradicted a champion three days into the ring. Both classes now say *last* day or morning. The rural class reads "village fair", because `rural` includes farmland and mining.
2. **Spine.** A stranger cannot be called "by name". The corner now "picks {actor} out of the onlookers as the next challenger", and the custom reads "a challenger who refuses is named a coward at the ring" (72 words with the opening).
3. **Bout step prose.** The seam echo "fought here three days running" was replaced with "heavier, fights by rushing in, and likes to play to the crowd". That grounds both bout specials.
4. **Walk-away step prose.** The crier sentence was removed. The crier is now told once, in the aftermath.
5. **Card faces made generic (trigger 16).** The Rouse The Crowd, Cool The Blood and Harden The Stance effect lines were rewritten. Goad The Champion became **Stir Vanity** (`bout.stir_vanity`), because a card title naming the scene's cast is scene-bespoke.
6. **Every band's overview rewritten** to stop retelling the afterimage above it (triggers 22 and 35). The overviews also no longer assert how the bout went, because step-0 crit/fail and `near_miss` move which band a given bout lands on.
7. **Champion regard chip on all three success bands.** The -0.08 write fires on every win (`near_miss` included), so hiding it on critical_success and success broke Law 56 in the other direction.
8. **The favour chip cause is now "Paid out on a quiet bet"**, and the favour `context` matches it.
9. **The fallback aftermath mirrors the walk-away aftermath.** The fallback step is that arm. The old fallback said "the call was met" and chipped none of its writes.
10. **Log lines and `description` updated** to match.

Author's doubts, settled:
- **The champion chip:** fixed (item 7).
- **The companion chip anchor:** `tooltipId: 'ui.companions'` is the only lawful author-time form, because no `$companion` sentinel exists. The chip is kept, and the gap is logged for the orchestrator.
- **The fork step's missing top-level difficulty:** structural. `ActionStepBranch` has no such field. It is a measurement note only.
- **The identical backer chip on failure and critical_failure:** correct. Both bands make the same write, and the extreme overview carries the extra cost in words.
