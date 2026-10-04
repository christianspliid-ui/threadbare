# Encounter Pipeline: The Hired Knives
> Scale: short | Slug: hired-knives | Pass: draft
> Date: 2026-10-03 | Pipeline version: 2.0

**Binding brief:** `Docs/plans/encounters/hired-knives-brief.md` (THR-1703). Every row of its
Game design table, the consequence hand, the band payoffs and the rolled constraints were
fixed before this draft; the fiction below lives inside them. Where the effect lattice the
engine offers could not carry a brief payoff exactly, the deviation is named in § 17
(Self-Audit) rather than hidden.

**Template id:** `encounter.rival.hired_knives` · `tags: ['#rival_strike']` (seated,
`src/data/content-tags.ts`) · `drawable: false` · reach `shadow` · `rarityTier: 2` ·
`settings: ['rural', 'urban', 'wayside']` · `consequenceDraw: ['relationship', 'drive']`.

---

## 1. Inspiration Anchors

| Source | What it contributed | What it did not |
|---|---|---|
| **Vault — `Systems/Anti-Patterns.md` §1, The Dark Lord Problem** | The sender is never a cackling villain on stage. A rival god acted for a reason (a loud god in its region is a threat), and the encounter never shows or names the sender — the knives are the rival's *answer*, not its face. Kept the rival off-screen and coherent. | — |
| **Vault — `Systems/Anti-Patterns.md` §6, Grimdark for Shock Value** | The worst band is "cut, bleeding, frightened, and the one who warned them saw it" — never a scripted death, never lingering on the wound. Darkness is structural: the cost of a god's loud help lands on a mortal who never asked for it. | — |
| **Vault — `Systems/Thematic Pillars.md`, Compassion vs. Power** | The whole premise: the god's power, used loudly, made the mortal a target. The encounter is the bill for *how* the god helped before. The hand repeats the trade in miniature: the strongest card (Heavy Hand) makes the region louder still; the quiet card (Veil) costs more essence and lowers it. | — |
| **Vault — `Archetypes/Ordeal Archetypes.md`, The Endless Pursuit** | The shape of being hunted by someone whose quarrel is not really with you. Scaled down from geological time to three days; kept the core note that the hunter's cause is not the prey's doing. | Its "victory is hollow" consequence is not used — a short payoff beat needs a clean ending. |
| **Rolled hook — `hook.followed_on_the_road`** | The front half verbatim: strangers on the mortal's trail, closer each night. | — |
| **Dilemma library** (`src/data/meeting-dilemma-library.ts`) | Not consulted for the hand: this is a test, not a moral fork, and no card asks the god to choose between values. | — |

**Anti-patterns avoided by name:** Dark Lord (sender kept off-stage, motive coherent);
Grimdark for shock (no death, no torture, no lingering on blood); Player as Savior (the
god's earlier help *caused* this — the hand cannot undo that, only price the next move).

## 2. Scale Justification

Short is correct. This is a payoff beat for a cost the player already paid elsewhere (the
detection pressure their nudges raised), not a chapter: one tension (you are being
followed), one test of awareness, one test of survival. Rarity 2 gives it the two-family
consequence hand the brief rolled (relationship + drive) and no more. A third step would
pad the chase; a single step would collapse "see it coming" into "survive it", which loses
the Shadow theme the brief chose. Reward weight is penalty-avoidance plus a drive and a
moved tie — appropriate for something the world does *to* the mortal rather than something
they sought.

## 3. Pressure Knot

Before the player acts: a god's help in this region was loud enough that a rival noticed
(regional detection pressure crossed the encounter band — `recordDetectionCrossings`
planted one `shadow.rival_strike` seed on this mortal). The rival has sent people. They
have been on the mortal's trail for three days, keeping their distance, asking after the
mortal by name. Tonight they are close, and they are done following. The mortal has done
nothing to earn this; the attention was drawn by the god's own work. Nobody on stage knows
who paid.

## 4. Intervention Fantasy

The god is watching the bill for its own loudness come due — on someone else. The fantasy
is the guilty guardian: the god wants to save the mortal, and every strong way to do it
makes the god louder still in a region already watching. The hand asks *how* to help as
much as whether: blur the trail quietly at a high essence price (and let the region's
notice cool), lean on the one bystander who has seen the knives, or break the blades
outright and accept that every rival god in the region will see it. The Bitter mortal's
own suspicion is a free card — being someone who trusts no one finally pays.

## 5. Cast and World Objects

| Object | What it is | Backing |
|---|---|---|
| **{actor}** — the mortal | The protagonist and target. Whose problem: theirs, by construction — the seed lands on them by `targetAgentId`. | The seeded agent (`targetAgentId`). |
| **`{cast:warner}`** — the one who warns them | A person at this place who has also noticed the strangers and tells the mortal they asked for them by name. Scene-local: no prior relationship is asserted. The **relationship** family's tie — the bond that moves by band. Role-neutral in prose (never named as innkeeper, hunter, etc.), never gendered. | `supportBundle` actor, `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['innkeeper', 'wanderer', 'pilgrim', 'hunter']`, `spawnNpcRole: 'wanderer'`, `spawnName: 'Corra Venn'`, `supportRole: 'warner'`. |
| **The two strangers** — the hired knives | The willed opposition (brief's override of "time itself"). Two, unnamed, ungendered in prose, scene-only. They are not bound as cast: no ending names them, nothing remembers them, and binding a hostile NPC that persists would claim a lasting enemy the encounter does not design. | Scene-only (§ 16). |
| **The rival** | Off-stage. Named only as "a rival" — true on both planting paths (a rival god on the detection path; a betrayed master on the Infiltrator's Approach path). Never a chip anchor. | Not an anchor (no node is carried by the seed). |
| **Regional detection pressure** | The cause, and a live cost channel in the hand (Veil lowers it, Heavy Hand raises it). | `costs.detectionDelta` on two specials; pre-seeded state. |
| **Wounded** | The failure-side scar. | `trait.condition.wounded` (live, `condition-trait-content.ts`). |
| **Compulsion — wary of strangers** | Success-side drive: watchfulness. | `plant_compulsion` (`encounterBias` on the closed `EncounterType` union). |
| **Compulsion — fear** | Failure-side drive. | `plant_compulsion`. |
| **Ambition — Seek Revenge** | Critical-success drive aimed outward, offered as a reaction. | `assign_ambition` → `ambition_seek_revenge` (live, grievance pool; shipped grant target in `border-levy.ts`). |
| **Bitter** (trait) | The trait hook: suspicion helps spot a tail. | `trait.core.core_hope.vice` — "Reads each good turn as the bait before the trap." Live; already hooked by `the-garrisons-price.ts` and `wolf-winter-watch.ts`. |

**Reputation channel:** the pairwise tie with `{cast:warner}` (`bond_change`, chip kind
`reputation`, noun `reputation with {target}` anchored `$cast:warner`). No faction is
touched — a rival god is not a faction, and inventing one would be fiction in a pointer.

## 6. Beat Structure

**Shape (closed catalog):** *Danger – Confrontation – Aftermath* — a threat announces
itself (the tail), then arrives (the knives). Two steps, linear, carryover between them.

**Crux (one sentence, the agent's view):** Two strangers have been following {actor} for
days, and tonight they mean to use their knives.

**Title glance test:** *The Hired Knives* — someone has been paid to put knives in the
mortal. Passes.

| | Step 1 — the tail | Step 2 — the knives |
|---|---|---|
| Reach / theme | **Shadow** — seeing the watchers, losing them, going unseen | **Iron** — standing up to an armed attack |
| Purpose line | `Shake the tail` | `Survive the knives` |
| Difficulty | **0.40** (`fair`) | **0.45** (`steep` floor, = `NUDGE_OFF_REACH_MAX_DIFFICULTY`) |
| Mean | 0.425 — journeyman band (0.35–0.50) | |
| `failBehavior` | `continue_weakened` — failing to shake them still leads to the attack | `fail_action` |
| Carryover | — | `carryoverFactorLines` keyed on step 1's band (below) |
| Hand | 2 specials (Veil, Trait card) + `deal: { count: 4, tags: ['shadow', 'peril'] }` = 6 | 2 specials (Heavy Hand, Compulsion) + `deal: { count: 4, tags: ['might', 'peril'] }` = 6 |
| successMetadata | — | `bond_change` +, `plant_compulsion` (wary) |
| failureMetadata | `bond_change` − (the strangers now know the warner's face too) | `apply_condition` wounded, `bond_change` −, `plant_compulsion` (fear) |

**Step 2 carryover lines (keyed on step 1's band, variance by construction):**

| Step 1 band | Text | Polarity | `forecastDelta` |
|---|---|---|---|
| `critical_success` | They chose the ground before the knives arrived. | for | 0.08 |
| `success` | They saw the knives coming. | for | 0.05 |
| `failure` | The knives are closer than they should be. | against | −0.05 |
| `critical_failure` | The knives know exactly where they are. | against | −0.08 |

**Reachability (THR-821):** an open-draw seed can land on any mortal, so both steps sit at
or under the 0.45 ceiling. Step 2 is exactly at it — deliberate, because the brief asks the
strike to be a real threat to an ordinary mortal.

**Motive hook:** `chance`/`divine` only — the encounter comes to the mortal; they did not
seek it. `motivations: ['courage_prudence', 'sacrifice_survival']` (stand or run; what
they will give up to get clear). The template is seed-only, so these steer nothing on the
board; they document what the scene is about.

**Trait hook — all four answers:**
1. Gate? **No** — anyone a rival is paying for can be struck.
2. Variant? **Yes** — `traitVariants: [{ traitId: 'trait.core.core_hope.vice', forecastDelta: 0.04, factorLine: 'Being Bitter, they have been watching their back all along.', addNudgeIds: ['knives.doubt_every_face'] }]`.
3. Trait-only card? **Yes** — `knives.doubt_every_face` (step 1).
4. Trait fragment? **No** — the trait card's own fragments carry it.

**Systems count (from the manifest):** cast (the warner) · rewards (persistent:
`bond_change`, `apply_condition`, `plant_compulsion`-adjacent, `assign_ambition`) ·
conditions (`apply_condition` wounded) · reputation (the `reputation`-kind bond chips) —
**four**, one over the floor.

## 7. Branching Profile

- Branch depth: `linear`
- Branch count: `0`
- Linear — no branching. The mortal's choice (stand or run) is real in the fiction but is
  expressed through the outcome ladder of the Iron step, not a fork.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

Action outcome is driven by step 2 (`fail_action`); step 1 shapes it through carryover and
its own one write.

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| **critical_success** | The knives are beaten; one stranger is put down long enough to say they were paid to stop a god's help. | Nothing of the mortal's. | Bond with `{cast:warner}` up; wary-of-strangers compulsion; **reaction:** kindle Seek Revenge (drive aimed outward) *or* hold close to the warner (bond up again). |
| **success** | Got past the knives unhurt; the strangers are gone. | Nothing the engine tracks. | Bond up; wary-of-strangers compulsion. |
| **success_at_cost** | Got clear, but loudly — everyone near saw the knives and saw the mortal run. | Their quiet. (No engine write; see deviation D1.) | Bond up; wary compulsion. |
| **failure** | Broke away cut and ran; the warner was left behind. | Blood — **Wounded**. | Bond down; fear compulsion (shies from fights and far roads). |
| **critical_failure** | The first knife landed before the second was drawn; got away bleeding, and the warner saw it all. | Blood — **Wounded**. | Bond down; fear compulsion. |

Step 1 failure adds a further bond strain on whichever final band follows (the strangers
now know the warner's face) — narrated by step 1's own failure afterimages, never claimed by
a final-band chip.

## 10. Sample Opening (narrator mode — opening per class + shared spine)

**rural** — `{actor} comes into {location} at dusk by the cart road.`

**urban** — `{actor} comes through the gate of {location} at dusk.`

**wayside** — `{actor} stops for the night at {location}, off the road.`

**Spine (step 1 `narrativeTemplate`, setting-neutral):**

> Two strangers have followed {actor} for three days. Tonight they are closer than before.
> {cast:warner} has seen them too, and says they asked for {actor} by name.
>
> A rival sent them, because a god's help was seen around {actor}. Nothing has happened
> yet. They will not wait another night.

Word count: opening 7–10 + spine 50 = **57–60** (budget 80).

`narrativeTemplates`:
- `initiation`: `The people following {actor} were hired to do more than follow.`
- `success`: `The knives missed, and the strangers are gone from {actor}'s trail.`
- `failure`: `The knives found {actor}, and the strangers are gone.`

### The narrator's 12 questions, answered

1. **P1 arrival with real names?** Yes, per class — `{actor}` and `{location}` resolve
   from the graph; the arrival verb fits each class (cart road / gate / off the road).
2. **P2 events with costs already paid?** "Two strangers have followed {actor} for three
   days. Tonight they are closer." The cost already paid is three days of being hunted and
   the strangers asking after them by name.
3. **P3 one stake shape, matching the brief?** *Unmitigated risk*: "Nothing has happened
   yet. They will not wait another night." Matches `p3Shape: unmitigated_risk`.
4. **≤80 words?** 57–60.
5. **Read aloud as a report?** Yes — no interior sensation, no camera, no atmosphere.
6. **Stated, never encoded?** The danger is said ("asked for {actor} by name", "will not
   wait"), the cause is said ("a rival sent them, because a god's help was seen").
7. **Every sentence works?** Each is challenge (followed, closer, asked by name), cause
   (the rival, the god's help), or stake (not another night).
8. **Nothing unintroduced; visible causes; no contradictions?** The strangers, the
   warner and the rival appear before any card or chip names them; the cause of the
   strike is stated; dusk in two openings and "for the night" in the third agree.
9. **One named person per beat?** `{cast:warner}` in step 1 and step 2; the strangers are
   unnamed by design. Never gendered.
10. **Stake in one sentence?** "Do they shake the people hired to kill them, or does the
    god's loud help cost them blood?"
11. **Cards verb+noun, spell-style?** Yes — *Hide Their Passing*, *Doubt Every Face*,
    *Shatter The Blades*, *Rouse The Witness*; effect lines state the effect and the price
    channel, no odds-talk, no word repeated from the title.
12. **An opening for every declared class?** `rural`, `urban`, `wayside` — all three.

## 11. The Hand Per Step

### Step 1 — `Shake the tail` (Shadow, 0.40)

`deal: { count: 4, tags: ['shadow', 'peril'] }` — composed hand 6. Exclude nothing.
The dealer supplies breadth of spheres and the ungated common option; the two specials are
the cards only this scene can offer.

```ts
{
  // Type: Veil — sphere-keyed (darkness). The quiet half of the detection loop:
  // pays MORE essence than a Boost of the same size because it pays DOWN the
  // region's attention (the very pressure that sent the knives).
  id: 'knives.hide_their_passing',
  name: 'Hide Their Passing',
  sphere: 'darkness',
  essenceCost: 3,
  forecastDelta: 0.08,
  costs: { detectionDelta: -0.1 },
  imageTag: 'generic.dark',
  effectLine: 'Blur every sign of where they went. No rival god sees this working, and the notice already on this region fades a little.',
  bandProse: {
    critical_success: 'The strangers lost the trail so completely that they stopped and argued about it.',
    success: 'The trail went cold in the strangers\' hands, and no rival god saw why.',
    success_at_cost: 'The trail went cold, and stayed cold only while {actor} kept moving.',
    near_miss: 'Nobody saw the god\'s hand. The strangers did not need to; they had guessed the way already.',
    failure: 'The trail went cold, and the strangers simply waited where it had to come out.',
  },
},
{
  // Type: Trait card — cost 0, the price was being Bitter. Hidden (never dimmed)
  // without the trait; unlocked by the traitVariant's addNudgeIds.
  id: 'knives.doubt_every_face',
  name: 'Doubt Every Face',
  requiredTrait: 'trait.core.core_hope.vice',
  essenceCost: 0,
  forecastDelta: 0.08,
  imageTag: 'generic.focus',
  effectLine: 'No essence. Being Bitter, they already suspect the people behind them, and they look.',
  bandProse: {
    success: 'Being Bitter, {actor} had counted the faces behind them long before tonight.',
    failure: '{actor} suspected everyone behind them, and so suspected the wrong two.',
    critical_failure: '{actor} watched the people behind so hard that the two ahead walked straight up.',
  },
},
```

Coverage: all six `StepOutcome`s across the two specials. Every special has a failure
fragment. No rider. Spheres from specials: darkness (+ trait card, sphere-less but gated);
the dealt four carry the rest of the ≥4-sphere spread and the ungated common option.

**Step 1 afterimages (band base, no hand):**
- critical_success: `They shook the strangers, doubled back, and watched them search the wrong way.`
- success: `They lost the strangers for an hour, and chose where to be when they came back.`
- success_at_cost: `They lost the strangers by running, and the strangers saw which way they ran.`
- failure: `The strangers stayed on them, and now they know {cast:warner}'s face too.`
- critical_failure: `They doubled back straight into the strangers and gave themselves away.`

`failureMetadata.effects`: `[{ kind: 'bond_change', withAgentId: '$cast:warner', sentimentDelta: -0.05, trustDelta: -0.05 }]`
— the failure afterimage states the cause; no final-band chip claims this write.

### Step 2 — `Survive the knives` (Iron, 0.45)

**Spine:**

> The strangers find {actor} again before the night is out. Both draw knives and close in,
> one from each side. {cast:warner} shouts and backs away. {actor} has to get past the
> knives or through them.

`deal: { count: 4, tags: ['might', 'peril'] }` — composed hand 6.

```ts
{
  // Type: Heavy Hand — sphere-keyed (force). Big delta (≥ NUDGE_BIG_DELTA), cheap
  // in essence, paid in detection: the loud half of the loop. Using it here makes
  // the region louder for the next rival who is watching — the exact cost that
  // started this encounter.
  id: 'knives.shatter_the_blades',
  name: 'Shatter The Blades',
  sphere: 'force',
  essenceCost: 2,
  forecastDelta: 0.16,
  costs: { detectionDelta: 0.15 },
  imageTag: 'generic.blade',
  effectLine: 'Steel snaps in the attackers\' hands at the first blow. Rival gods can hardly miss the hand that did it.',
  bandProse: {
    critical_success: 'Both knives broke on the first blow, and both strangers ran.',
    failure: 'One knife broke. The other did not, and it found {actor}.',
    critical_failure: 'The steel broke with a crack heard down the road, and it brought the second stranger straight to {actor}.',
  },
},
{
  // Type: Compulsion — sphere-keyed (mind), bound to the scene's cast slot (the
  // binding model's target selector) rather than to the mortal: the urge lands on
  // the one bystander the scene introduced. Grounded on {cast:warner}; delete the
  // warner from the prose and this card is senseless.
  id: 'knives.rouse_the_witness',
  name: 'Rouse The Witness',
  sphere: 'mind',
  essenceCost: 2,
  forecastDelta: 0.1,
  imageTag: 'generic.rumor',
  effectLine: 'Put a sudden urge to shout into the one person watching, loud enough to bring others running.',
  bandProse: {
    success: '{cast:warner} shouted without meaning to, and the strangers did not want the company.',
    success_at_cost: '{cast:warner}\'s shout brought help, and brought it late.',
    near_miss: '{cast:warner} shouted, and the strangers hurried to finish before anyone came.',
    failure: '{cast:warner} shouted, and no one came in time.',
  },
},
```

Coverage: all six `StepOutcome`s across the two specials. Heavy Hand is big-delta and
carries both `failure` and `critical_failure`. Every special has a failure fragment. No
rider. Spheres from specials: force, mind.

**Step 2 afterimages (band base, no hand):**
- critical_success: `They took the knife off the first stranger, and the second one ran.`
- success: `They got past the knives and out of reach, unhurt.`
- success_at_cost: `They got clear, but loudly, and everyone close by saw the knives.`
- failure: `They broke away with a cut and ran without looking back for {cast:warner}.`
- critical_failure: `The first knife landed before they saw it, and they ran bleeding.`

`successMetadata.effects`:
```ts
[
  { kind: 'bond_change', withAgentId: '$cast:warner', sentimentDelta: 0.1, trustDelta: 0.1 },
  { kind: 'plant_compulsion', targetAgentId: '$actor',
    encounterBias: { hire: -0.3, trade: -0.2, assist: -0.2 }, durationTicks: 72,
    narrativeHook: 'Hunted by hired knives, and wary of strangers for a while.' },
]
```
`failureMetadata.effects`:
```ts
[
  { kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor' },
  { kind: 'bond_change', withAgentId: '$cast:warner', sentimentDelta: -0.1, trustDelta: -0.1 },
  { kind: 'plant_compulsion', targetAgentId: '$actor',
    encounterBias: { duel: -0.4, explore: -0.3, steal: -0.2 }, durationTicks: 96,
    narrativeHook: 'Cut by hired knives, and shying from fights and far roads.' },
]
```

## 12. Branch-Dependent Later Paragraph(s)

**Linear continuation** (step 2 spine, above):

> The strangers find {actor} again before the night is out. Both draw knives and close in,
> one from each side. {cast:warner} shouts and backs away. {actor} has to get past the
> knives or through them.

Seam check, step 1 → step 2: step 1 ends on "They will not wait another night."; step 2
opens "The strangers find {actor} again before the night is out." — "night" recurs once as
the promised clock being paid, not as an echoed image; flagged for the critic's echo check.

## 13. Aftermath Paragraph

Choice-less, so the bands hang off `fallback` (`branchOnStep: 1`, `variants: {}`).

**Fallback overview** (base face — reached by any band not overridden):
`The strangers are gone. Nobody here has said who paid them.`

**By band (each read as one page: overview → chips in scar · bond · boon · path order → reactions):**

**critical_success**
- Overview: `{actor} had one stranger down long enough to hear it: they were paid to stop a god's help. The other one ran.`
- SCAR · compulsion — `Wary of strangers for a while.` *(caption, 6 words)*
- BOND · reputation with {target} (anchor `$cast:warner`) — `Heeded the warning — {cast:warner} trusts {actor} more.` *(8 words)*
- Reactions (prompt: `They know now that someone paid. What do they carry out of it?`):
  - `Kindle a hunger to find who paid` — intent: `The mortal turns the hunt around. The sender becomes the one being sought.` — effects: `assign_ambition` `ambition_seek_revenge`, `targetAgentId: '$actor'`, narrativeHook `Heard a hired knife say it was paid to stop a god's help, and wants the one who paid.`
  - `Let them hold to the one who warned them` — intent: `No hunt. The mortal stays close to the person who saw it coming.` — effects: `bond_change` `$cast:warner` +0.1 / +0.1.

**success**
- Overview: `{actor} got past both knives unhurt, and the strangers did not follow.`
- SCAR · compulsion — `Wary of strangers for a while.`
- BOND · reputation with {target} — `Stood together through it — {cast:warner} trusts {actor} more.`

**success_at_cost**
- Overview: `{actor} got clear of the knives with {cast:warner}'s shout behind them, and everyone close by saw them run.`
- SCAR · compulsion — `Wary of strangers for a while.`
- BOND · reputation with {target} — `{cast:warner} trusts {actor} more now.` *(no cause clause — the overview already carries the shout)*

**failure**
- Overview: `{actor} broke away cut and kept running. {cast:warner} was left to face whatever came after.`
- SCAR · Wounded (anchor `trait.condition.wounded`, `visualKind: 'attachment'`) — `{actor} is wounded until it heals.` *(6 words)*
- SCAR · compulsion — `Shies from fights and far roads for a while.` *(9 words)*
- BOND · reputation with {target} (loss) — `{cast:warner} trusts {actor} less now.` *(5 words)*

**critical_failure**
- Overview: `The first knife reached {actor} before the second was drawn. {actor} got away bleeding, and {cast:warner} saw all of it.`
- SCAR · Wounded — `Knifed before they saw it coming — {actor} is wounded.` *(9 words; cause clause earns its place: the overview says "reached", the chip says what it left)*
- SCAR · compulsion — `Shies from fights and far roads for a while.`
- BOND · reputation with {target} (loss) — `Saw them run — {cast:warner} trusts {actor} less.` *(7 words)*

Every chip is backed by a write on its own half: success-band chips by step 2
`successMetadata` (`bond_change`, `plant_compulsion`); failure-band chips by step 2
`failureMetadata` (`apply_condition`, `bond_change`, `plant_compulsion`). The Seek Revenge
ambition is reaction-borne and carries **no** chip — the reaction label is its surface.

## 14. Aftermath Reaction Choices

Short scale owes none, and four of five bands carry none — the consequence is clean. The
**critical_success** band carries two, because that is the one ending where the mortal
learns the strike was *paid for* and the drive's direction is a genuine fork in stance:

- **`Kindle a hunger to find who paid`** — the thread preserved is *pursuit*: the mortal
  takes up Seek Revenge, and the world's grievance machinery (motive-gated counter-play
  verbs) gets a mortal pointed at whoever is behind the knives. Stance: answer harm by
  hunting its source.
- **`Let them hold to the one who warned them`** — the thread preserved is *the tie*: the
  bond with `{cast:warner}` deepens instead. Stance: answer harm by holding close to who
  stood by you.

Both are the god's lean on the mortal's inner weather (a kindled want; a strengthened
bond), never an instruction.

## 15. Aftermath Kit Summary

- **Visible changes:** a moved tie with a named person (`{cast:warner}`) on every band; a
  compulsion (wary on success side, fear on failure side) on every band; **Wounded** on
  both failure bands; optionally the **Seek Revenge** ambition on critical success.
- **Notable conditions:** `trait.condition.wounded` (failure side).
- **What the world remembers:** the warner persists (`must-persist`) with a changed
  relationship; the compulsion bends the mortal's next encounter choices; the regional
  detection pressure moves with whichever cost-channel card the god played (down with
  *Hide Their Passing*, up with *Shatter The Blades*) — so how the god answered this strike
  is what decides how soon the next one comes.

### Concept Art Direction (two-question method)

1. *Emotions:* being watched; danger that was not earned; the guilt of being someone's
   favourite.
2. *Evocative image within the world:* a plain knife driven into a wooden post at first
   light, its grip newly wrapped, a small coin pressed into the wood beside it — and no one
   near. Residue, not the fight: the payment and the tool, left where the mortal will pass.
   Low cold light, long shadow of the post across an empty path. No people.

Scene tag (WS4 vocabulary, fallback to EntityVisual until painted): `road.night.followed`.

## 16. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence contract | Future references | Status |
|---|---|---|---|---|---|
| `{cast:warner}` — the one who warns | `lazy-materialize-on-trigger` (reuse-first: binds an existing `innkeeper` / `wanderer` / `pilgrim` / `hunter` at the place; spawns a `wanderer` named *Corra Venn* only when none stands there) | `supportBundle` actor spec | `must-persist` | The bond edge (`relates_to` sentiment/trust); both sheets; any later encounter reading the mortal's strongest ally (`{ally:strongest}`) | `author-now` (spec in this packet) |
| The two strangers | none — scene-only prose | the spine | `scene-only` | none; nothing claims them later | `live` (by design) |
| The rival | none — off-stage | the planter (`recordDetectionCrossings` / Infiltrator's Approach seed) | n/a | none in this encounter | `live` |
| Regional detection pressure | `pre-seeded` | `phaseDetectionPressure`; moved by card `costs.detectionDelta` | `must-persist` | future `#rival_strike` seeds in this region | `live` |
| `trait.condition.wounded` | `pre-seeded` (template) | `condition-trait-content.ts` | `must-persist` | conditions UI, fight/resolution modifiers | `live` |
| `ambition_seek_revenge` | `pre-seeded` (template) | `ambition-templates.ts` (grievance pool) | `must-persist` | strategic counter-play cells | `live` |
| Compulsion biases | n/a (effect) | `plant_compulsion` | `must-persist` for its duration | encounter selection | `live` |

**Registration:** compile through the package compiler (`npm run compile:encounter`) so the
template lands in the canonical unified registry, `encounterFamilyHasContent('shadow.rival_strike')`
flips true, and step 1 → step 2 progression runs under the real tick loop (THR-1703
Done-when). `drawable: false` keeps it off the board; the seed's family query still reads
the `rural` / `urban` / `wayside` envelope — a mortal at a stronghold/sacred/arcane/ruin/
battlefield site is not struck (accepted in the brief).

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Composition — Steps (1–3, reach, difficulty, narrativeTemplate) | PASS | 2 steps, shadow/iron, 0.40/0.45. |
| Composition — Hand | PASS | Both steps: 2 specials + fill 4 = 6, within 4–8, ≤2 specials. |
| Composition — Setting | PASS | 3 classes, 3 openings; spine/afterimages name no class scenery (fallback overview reworded off "road"). |
| Composition — Cast | PASS | Explicit multi-class bundle; roles chosen so every class has at least one seeded match (innkeeper: hamlet/urban; wanderer/pilgrim: hamlet/wilderness; hunter: town/wilderness); `spawnName` a real name; never gendered. |
| Composition — Rewards | PASS | `apply_condition`, `bond_change`, `assign_ambition` are persistent kinds. |
| Composition — Aftermath | PASS | 5 bands (≥3; success-side, failure-side, both extremes); `critical_failure` and `failure` covered (step 2 is `fail_action`). Every chip has a `stateNoun`. |
| Composition — Systems ≥3 | PASS | cast · rewards · conditions · reputation = 4. |
| Composition — Images | PASS | `generic.dark`, `generic.focus`, `generic.blade`, `generic.rumor` all resolve to library rows. |
| Consequence hand (relationship + drive) | PASS | `bond_change` (relationship); `plant_compulsion` + `assign_ambition` (drive). |
| Hand: ≥4 spheres, ≥1 ungated common | FLAG | Specials alone give 3 spheres across both steps (darkness; force, mind); relies on the dealer's sphere-breadth and common-option preference. `checkComposedHand` reports the composed result — confirm at `check:encounter`. |
| Hand: ≤1 rider | PASS | No authored rider; dealt fill may add one. |
| Hand: zero-essence non-trait card | PASS | None. Trait card is cost 0 by rule; Veil pays more essence and pays detection down; Heavy Hand pays detection up. |
| Hand: big-delta both failure bands | PASS | Shatter The Blades (0.16) carries `failure` + `critical_failure`. |
| Hand: grants name built content | PASS | No card grants. |
| Effect lines: no digits, no repeated title word, ≤25 words | PASS | Checked by hand; *Hide Their Passing* line is 23 words. |
| Card type for *Rouse The Witness* | FLAG | Compulsion's library mechanic is an urge on *the mortal*; this one targets the cast bystander via the binding model's cast-slot selector. If the critic rules Compulsion must target the mortal, re-type as Stumble-adjacent is wrong too (that acts on the opposition) — fallback is to re-aim it at the mortal ("an urge to shout for help"). |
| Trait hook | PASS | `trait.core.core_hope.vice` live (hooked by two shipped encounters). Note: a `TraitVariant.forecastDelta` applies template-wide, not to step 1 only; the factor line is phrased to read on both steps. |
| Prose rule 7 — invented state | FLAG | "followed … for three days" and "asked for {actor} by name" are scene-local history (the strangers exist only here). Accepted as scene-local; critic to confirm. |
| Premise truth on both planters | FLAG | "A rival sent them, because a god's help was seen around {actor}" is true on the detection planter. On the Infiltrator's Approach planter ("The betrayed master moves first") the sender is a rival *master*, and the cause is the god's part in a betrayal — "a rival" holds, "a god's help was seen" holds loosely. That seed also uses the deprecated `encounterFamily` operand. Recommend the critic accept, or the implementer gate the cause sentence. |
| Prose rule 7b — future promises | PASS | No place/time promises. "They will not wait another night" is paid by step 2 inside the scene. No overview tells the mortal what to do or where to be later. |
| Page read — success_at_cost | PASS | The overview carries the warner's shout; the bond chip carries only the state change, with no cause clause, so the beat is told once. |
| Deviation D1 — success_at_cost bond | FLAG | Brief: *success_at_cost → bond strained*. Step-outcome effects split only success/failure (`isStepSuccess`), and `EffectPredicate` has no band predicate, so a success_at_cost-only strain is not expressible without a player-picked reaction. Draft keeps success_at_cost on the success side (bond **up**, the warner's shout helped) and moves "someone close paid" to step 1's failure write (the strangers now know the warner's face), which fires on whatever band follows. Critic/implementer: accept, or move the strain into a success_at_cost reaction. |
| Deviation D2 — failure vs critical_failure | FLAG | Brief: *failure → wounded + bond strained*; *critical_failure → fear drive, bond broken*. Same lattice limit: both failure bands write Wounded + bond − + **fear** compulsion. They differ in prose, and in practice a step-1 failure (extra bond strain) usually precedes a critical failure through the carryover penalty. `trait.condition.terrified` exists and would sharpen critical_failure, but cannot be written on that band alone. |
| Deviation D3 — critical_success drive | FLAG (by design) | Brief: *crit success → mortal learns who sent them, drive aimed outward*. "Who" cannot be named (the seed carries no sender node), so the mortal learns *that* they were paid, and the outward drive (Seek Revenge) is offered as a reaction, not forced. The `knowledge` family is not in the hand, so no `intelligence` record is written. |
| Chip budget ≤15 words, no overview retell | PASS | Longest caption 9 words; no four-word run shared with its overview (checked by hand). |
| Chip nouns are sheet words | PASS | `Wounded`, `compulsion`, `reputation with {target}`. |
| Vagueness lexicon in outcome fields | PASS | No `something`/`someone`/`things`/`nothing` in afterimages, fragments or overviews (checked; "Nobody … has said" is a person-noun, not on the list). |
| Second person | PASS | Removed from dialogue ("asked for {actor} by name"). |
| Support-bundle contract | PASS | Every object classified; one `lazy-materialize` spec with reuse-first roles. |
| Registration / tick lifecycle | pending | Proved at implementation by `check:encounter`, the un-mocked `nudgeDetectionEscalation.test.ts` case, and `?spawn=encounter.rival.hired_knives`. |

## Experience Differentiator Gate

**Scene & Prose**
1. Narrator skeleton, ≤80 words, real names, plain facts? **YES**
2. Every sentence does challenge/test/outcome work? **YES**
3. Scene names the elements the hand acts on (strangers, warner, trail, knives)? **YES**
4. Player can retell situation and stake after one read? **YES**

**Choices & Intervention**
5. Every card spell-like, verb+noun, no mood/odds-talk, no flavor quote, no scene prose on the face? **YES**
6. Every price real and legible (essence; detection both ways; trait = being Bitter)? **YES**
7. Every card pays off in failure (big-delta card both failure bands)? **YES**
8. Every card grounded on a target the scene established (trail, the people behind, the blades, the witness)? **YES**
9. Cards answer different questions (stay unseen / own suspicion / break the weapon / bring help)? **YES**
9b. Every nudge-bearing step a composed 4–8 hand; no branch or ending picked by the player? **YES**

**Aftermath & Consequence**
10. Aftermath has its own landing prose before mechanics? **YES**
11. Consequences actor-centred — `{actor}`, `{cast:warner}` by name? **YES**
11b. Each band read as one page, nothing told twice, nothing contradicting? **YES** (D1 resolved in the draft by making success_at_cost's bond chip agree with its overview — the warner's shout helped)
12. Medium+ reaction choices? **YES** — N/A at short scale; the one band that carries reactions offers a real fork.
13. Reactions are different philosophical stances (hunt the source / hold to the ally)? **YES**

**Presentation**
14. Concept art uses the two-question method — residue, not action? **YES**
