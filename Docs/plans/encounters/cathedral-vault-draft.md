# Encounter Pipeline: The Vault Before the Rains
> Scale: medium | Slug: cathedral-vault | Pass: draft
> Date: 2026-10-05 | Pipeline version: 2.0
> Batch: master-everyday (THR-1688), slot 7 · templateId `encounter.town.cathedral_vault`

## 0. Binding row and mechanical design block (designed before the prose)

```
Brief row       reach stone · steps stone 0.76 → stone 0.82 (mean 0.79, window fit 0.93) ·
                shape opt-in complication · settings rural + urban · consequence hand
                relationship + place (binding, no swap) · rarityTier 2 · scale local ·
                intrinsicTier shaping · id encounter.town.cathedral_vault (final)
Rolled          plotHookRolled: hook.impossible_heist, hook.meeting_to_keep, hook.long_road
                plotHookTaken:  hook.long_road, drifted — "the road itself, weather and
                                distance, is the thing that will decide it" becomes the
                                season between now and spring: the weather decides whether
                                the vault stands. impossible_heist and meeting_to_keep set
                                aside (no theft; the opt-in shape carries no appointment).
                p3Shape opportunity · opposition time (the clock is the enemy) ·
                disposition n/a · agentRole the_target (the chapter will blame them) ·
                scale settlement · system movement (advisory, not taken — brief override)
Crux            The abbey's new stone vault still rests on its timber frame, and {actor}
                must take the frame out before the winter rains or keep it safe until
                spring, knowing the abbot will blame them if the vault falls.
Title           The Vault Before the Rains — the crux (a vault, a deadline of weather).
Whose problem?  The agent's: they are the master builder the abbey sent for, and the abbot
                has named them answerable for the vault. Scene-local (the summons is the
                reason they arrived; no prior graph tie asserted — prose rule 7).
Reach = theme?  Stone throughout — building and endurance. Step 0 (stone 0.76) tests
                whether the vault's mortar has set hard enough to carry the vault. The fork:
                Vanguard strikes the centering now (stone 0.82, the brief's step 2) — one
                day of nerve and even hands; Watcher keeps the frame sound all winter
                (stone 0.78) — a season of wet nights slackening swollen wedges. Both
                arms are master tests (0.72–0.85 band).
Shape           Opt-in Complication. Step 0 is taken by every mortal. Then an agent-decided
                fork on courage_prudence (positive = Vanguard strikes now; negative =
                Watcher waits for spring). The decline arm (waiting) is LEGIBLE (no strike,
                no consecration feast before winter) and CHEAPER IN WHAT IT RISKS (smaller
                bond and reputation swings, no fallen vault — a cracked bay at worst), but
                priced in the master band, because declining the strike does not make the
                rain go away (the oath-breaker-rite ruling, applied). The two step-0
                specials carry opposite pole leans; the player never picks.
Carryover       Step 0 continue_weakened. Both arms author carryoverFactorLines keyed on
                step 0 (critical_failure omitted: a step-0 critical failure ends the
                action — the debt-arbitration caveat).
Opposition      Time — the winter rains. No villain. The abbot is the pressure, not the
                opposition: they want the church open and have named whom to blame.
Consequence hand (binding, THR-1145): relationship + place — no swap.
  relationship  bond_change with $cast:abbot on both arms: success side + (they trust the
                master's judgement of stone), failure side − (they blame the master).
                Reactions add bond_change with $cast:foreman.
  place         apply_condition trait.condition.location.festival on $here on every
                success side of both arms: the church is consecrated and the town keeps
                a feast for it. Ends warm (brief: slot 7 ends warm on success).
Extras          reputation_with $here on failure sides (master failure is the name before
                the purse: the town stops trusting their word on stone); reactions.
Cool failure?   None killed, jailed or branded. Strike-arm critical failure: the vault falls
                into an empty nave. Wait-arm critical failure: half the vault is pulled
                down and another master is sent for. The cost is the master's name.
Trait hooks     Gate: none. Variant: Humble (trait.core.core_humility.virtue) +0.04 —
                "Being Humble, they test every course before trusting any of it." Trait-only
                nudge: none. Trait fragment: none.
Systems quota   cast (abbot, foreman) + conditions (Festival on $here) + reputation
                (reputation_with $here, bond_change) — three.
Heavy Hand      none. No card grants. No libraryCardId bound on any special.
```

## 1. Inspiration Anchors

- **hook.long_road** (vault: Archetypes/Ordeal — Pilgrimage/Journey): the road itself decides it — weather, distance, isolation. Drifted from a journey to a season: the "road" is the winter between the finished vault and spring, and the weather is the thing that decides it. It gave the encounter its opposition (time) and the Watcher arm's whole shape: endurance over a long stretch, not one clever act.
- **Archetypes/Event — The Great Building** (rolled in the single-slot draw, not the packet; read as background): a community pouring itself into a building, and the argument over who decides. It gave the abbot's pressure — the chapter wants its church before winter — without making the abbot a villain.
- **Anti-patterns avoided:** the helpful passerby (the agent is the target — named answerable); the bandit opposition (the rain is the opposition); the player-picked ending (the fork is the mortal's nerve, recorded by `courage_prudence`); repeating the stone experts' verbs (bell tower: *find what holds it / reset the cracked courses*; flood dyke: *find why it fails / dig to the culvert / close the dyke*). This encounter's verbs are *test the vault*, *strike the centering*, *keep the frame sound*.
- Dilemma library not consulted: the fork is courage against prudence, not a moral dilemma.

## 2. Scale Justification

Medium (two beats plus a fork). A master's job is one decisive judgement and one hard execution; three beats would pad the test. Settlement scale on the dice: the outcome touches the whole town — its church opens or stays shut, and the town keeps a feast or does not.

## 3. Pressure Knot

The abbey has finished its new church's stone vault. The vault still sits on its centering — the timber frame it was built on. The winter rains come next week; wet timber swells and can crack a new vault from below. The abbot wants the church open before winter and has told the chapter that the master builder answers for the vault. The clock and the blame are both running before the agent does anything.

## 4. Intervention Fantasy

The god watches a master builder make the hardest call in the trade — strike the frame now and trust the mortar, or keep a swelling frame sound for a whole winter — while an abbot waits to blame them. The god can tilt the mortal's nerve, light a fine split in the mortar, bind the stones, pace the crew, stretch the dry spells, or wring the water out of the timber. Fate still decides whether the vault stands.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | acting agent | the master builder the abbey sent for |
| `{cast:abbot}` | actor, must-persist | the abbot; reuse `monk` / `priest`, spawn `monk` "Anselm Hale". Named in step 0; bond target on both arms |
| `{cast:foreman}` | actor, must-persist | the abbey's works foreman; reuse `mason`, spawn `mason` "Wat Durran". Named on both arms; reaction bond target |
| `{location}` / `$here` | settlement | carries the Festival condition on success |
| `trait.condition.location.festival` | location condition (live) | "Festival" — the consecration feast |
| reputation with `$here` | standing channel (live) | failure sides |
| the vault, the centering, the wedges, the mortar | scene-local | never chipped |

## 6. Beat Structure

1. **Step 0 — Test the vault** (stone 0.76, `continue_weakened`). Is the mortar hard enough to carry the vault without its frame?
2. **Step 1 — fork on `courage_prudence`:**
   - **positive (Vanguard) — Strike the centering** (stone 0.82, `fail_action`): the crew knocks the wedges out evenly and the vault takes its own weight in one day.
   - **negative (Watcher) — Keep the frame sound** (stone 0.78, `fail_action`): the frame stays in all winter; after every wet night the swelling wedges are slackened before they crack the vault.
   - **fallback** = the Watcher arm.

## 7. Branching Profile

- Branch depth: `light` · Branch count: `2`
- Where branching lives: step 1 (test, prose, hand), outcome ladder, aftermath.
- Convergence: none — each arm ends its own way; both end warm on success (Festival + the abbot's trust).
- Shape: Opt-in Complication (catalog) with an agent-decided Personality Fork on `courage_prudence`.

## 8. Branching Map

- **Step 0 result → step 1:** carryover lines on each arm (the mortar known set / doubted).
- **Vanguard:** strike now. Success: the church opens before winter, feast, the abbot's trust. Failure: the vault cracks (or falls), the abbot blames them in front of the chapter, the town stops trusting their word on stone.
- **Watcher:** wait. Success: the vault comes through winter, struck in spring, feast, the abbot admits the wait was right. Failure: the frame cracks a bay of the vault (or half of it), the abbot blames them, smaller swings.

## 9. Outcome Ladder

| Band | Vanguard (strike now) | Watcher (wait for spring) |
|---|---|---|
| critical_success | the frame out in a day, not a crack; church open before the first rain; feast; abbot's trust | no crack all winter; frame out in a day in spring; abbot admits the wait was right; feast |
| success | vault takes its own weight; church open before winter; feast; abbot's trust | vault whole through winter; frame out in spring; feast; abbot's trust |
| success_at_cost | one fine crack along the crown; pointed in the last dry days; church opens late, in the first rain | a course over the door cracked in a swell, rebuilt in spring; church opens late |
| failure | vault cracks as the frame comes down; wedges driven back; church shut till spring; abbot blames them; town's trust lost | one wet week the frame cracks a bay from below; the bay must be rebuilt; abbot blames them; town's trust lost (smaller) |
| critical_failure | the vault falls into the empty nave; abbot names them before the chapter | the worst storm splits the vault along its crown; half comes down; abbot sends for another master |

Master failure is the name before the purse: a builder sent for by name is only as good as the last vault they struck.

## 10. Sample Opening (narrator mode)

**Opening — rural:**
> {actor} arrives in {location}, sent for by the abbey outside the village.

**Opening — urban:**
> {actor} arrives in {location}, sent for by the abbey inside the town.

**Step 0 spine (setting-neutral):**
> The abbey has finished the stone vault over its new church. The vault still rests on its centering, the timber frame it was built on. The winter rains come next week. Wet timber swells, and a swollen frame can crack a new vault from below.
>
> If the frame comes out this week, the church opens before winter. {cast:abbot}, the abbot, wants it out, and has told the chapter that {actor} answers for the vault. First {actor} must test whether the mortar has set.

## 11. The Hand Per Step

### Step 0 — Test the vault (stone 0.76) · deal `{ count: 4, tags: ['craft', 'insight'] }`

| id | Name | Type | Sphere | Ess | Δ | Lean |
|---|---|---|---|---|---|---|
| `vault.hurry_the_season` | Hurry The Season | Whisper | time | 1 | 0.06 | courage_prudence → positive |
| `vault.show_the_hairline` | Show The Hairline Crack | Omen | light | 1 | 0.06 | courage_prudence → negative |

- **Hurry The Season** — *Put the coming rain first in their thoughts. They lean toward taking the frame out this week.* · imageTag `generic.memory`
  - success: The coming rain kept them at the work, and they tested every course before dark.
  - success_at_cost: The coming rain hurried them, and they tested the first courses twice over.
  - near_miss: The coming rain hurried them past the courses over the west door.
  - failure: The coming rain hurried them through the test, and they could not say whether the mortar had set.
- **Show The Hairline Crack** — *Throw lamplight across a fine split in the mortar. They lean toward leaving the frame in until spring.* · imageTag `generic.light`
  - critical_success: The lamplight found the fine split, and they traced it to a single course.
  - success: The lamplight showed them one fine split, and they knew the rest of the mortar held.
  - failure: The lamplight showed them a fine split, and they doubted every course after it.
  - critical_failure: The lamplight showed them one split, and they took it for the only one.

### Step 1, positive — Strike the centering (stone 0.82) · deal `{ count: 4, tags: ['craft', 'peril'] }`

| id | Name | Type | Sphere | Ess | Δ |
|---|---|---|---|---|---|
| `vault.bind_the_courses` | Bind The Courses | Signature | matter | 2 | 0.12 |
| `vault.pace_the_crew` | Pace The Crew | Signature | order | 2 | 0.10 |

- **Bind The Courses** — *Make the mortar grip each stone as the timber comes away. The vault settles as one piece.* · imageTag `generic.matter`
  - critical_success: The mortar gripped every stone, and the vault settled without a sound.
  - success: The mortar held each stone in place as the frame came away.
  - near_miss: The mortar held, but one stone settled ahead of the rest.
  - failure: The mortar gripped too late, and a stone slipped as the frame came away.
  - critical_failure: The mortar gripped each stone, and the stones still parted from each other.
- **Pace The Crew** — *Set every hand at the wedges to one count. No side of the vault drops before the others.* · imageTag `generic.oath`
  - success: Every wedge came out on the same count, and the vault dropped evenly.
  - success_at_cost: The crew kept the count, but slowly, and the work ran on past dark.
  - failure: One gang lost the count, and the west side dropped first.
  - critical_failure: The crew kept the count until the last wedges, then broke it.

### Step 1, negative — Keep the frame sound (stone 0.78) · deal `{ count: 4, tags: ['labor', 'craft'] }`

| id | Name | Type | Sphere | Ess | Δ |
|---|---|---|---|---|---|
| `vault.stretch_the_dry_spells` | Stretch The Dry Spells | Signature | time | 2 | 0.10 |
| `vault.wring_the_timber` | Wring The Timber | Signature | force | 2 | 0.10 |

- **Stretch The Dry Spells** — *Lengthen the gaps between storms. The timber has more nights to shed its water.* · imageTag `generic.warmth`
  - critical_success: The storms came far apart all winter, and the frame never swelled.
  - success: The storms came far apart, and the frame gave back its water between them.
  - near_miss: The storms came far apart until the new year, then came night after night.
  - failure: The gaps between storms closed in the new year, and the frame swelled.
- **Wring The Timber** — *Squeeze the water out of the frame. The wedges stay loose through the wet nights.* · imageTag `generic.strength`
  - success: The frame shed its water, and the wedges stayed loose.
  - success_at_cost: The frame shed its water, but only after a night of swelling.
  - failure: The frame held its water, and the wedges bound tight.
  - critical_failure: The frame held its water through the worst storm, and the wedges would not move.

The fallback arm is the negative arm verbatim.

Hand checks: specials per step 2 (cap 2), fill 4 → composed 6. No rider anywhere. Sphere spread from specials alone: step 0 time/light, strike matter/order, wait time/force; the dealer adds breadth. No card grants content. No card is free.

## 12. Branch-Dependent Later Paragraphs

**Vanguard — Strike the centering (step 1 narrativeTemplate):**
> {actor} orders the centering struck. {cast:foreman}, the abbey's foreman, puts a man at every wedge under the frame. The wedges must come out together, a little at a time, so the vault takes its own weight evenly. If one side drops first, the vault can crack and fall into the nave. The whole chapter is watching from the door.

**Watcher — Keep the frame sound (step 1 narrativeTemplate):**
> {actor} tells the chapter the frame stays in until spring. The abbot calls it cowardice in front of the monks. All winter the rain soaks the frame, and the swelling timber presses up on the new stone. {actor} and {cast:foreman}, the abbey's foreman, must slacken the wedges after every wet night, or the frame will crack the vault from below.

### Step-1 afterimages

Vanguard:
- critical_success: They struck the frame in one day, and the vault never moved.
- success: They struck the frame, and the vault took its own weight.
- success_at_cost: They struck the frame, and the vault settled with a fine crack along its crown.
- failure: The vault cracked as the frame came down, and they drove the wedges back in.
- critical_failure: The vault came down into the nave as the last wedges came out.

Watcher:
- critical_success: They kept the frame sound all winter without a crack above it.
- success: They kept the frame sound until spring.
- success_at_cost: They kept the frame sound, except for one swell that cracked a course over the door.
- failure: One wet week the frame swelled faster than they could slacken it, and it cracked a bay of the vault.
- critical_failure: The worst storm of the winter swelled the frame until it split the vault along its crown.

Step 0:
- critical_success: They tested every course of the vault and found the mortar set through.
- success: They found the mortar set hard enough to carry the vault.
- success_at_cost: They found the mortar set, and spent two of the dry days finding it.
- failure: They could not tell whether the mortar had set.
- critical_failure: They judged the mortar set when it was still soft.

### Carryover factor lines

Vanguard (keyed on step 0):
- critical_success · for · +0.06 — They know the mortar has set through.
- success · for · +0.04 — They know the mortar will carry the vault.
- success_at_cost · against · −0.02 — Two of the dry days are already gone.
- near_miss · for · +0.02 — They know most of the mortar has set.
- failure · against · −0.03 — They do not know whether the mortar has set.

Watcher (keyed on step 0):
- critical_success · for · +0.05 — They know which courses can bear a swelling frame.
- success · for · +0.03 — They know the mortar will hold through a wet season.
- success_at_cost · against · −0.02 — The frame took two days of rain before the work began.
- near_miss · for · +0.02 — They know most of the courses will hold.
- failure · against · −0.03 — They do not know which courses will give first.

## 13. Aftermath Paragraphs (overviews, by arm and band)

**Vanguard** (variant overview: "{actor} struck the centering before the rains.")
- critical_success: The frame came out in one day, and the vault took its own weight without a crack. {cast:abbot} opened the church to {location} before the first rain.
- success: The frame came out, and the vault took its own weight. The church opens before winter, as {cast:abbot} wanted.
- success_at_cost: The vault stands with one fine crack along its crown. The crew spent the last dry days pointing it, and the church opened late, in the first rain.
- failure: The vault cracked along its crown as the frame came down, and the crew drove the wedges back in to save it. The church stays shut until spring. A builder sent for by name is only as good as the last vault they struck, and {cast:abbot} tells the chapter that {actor} rushed it.
- critical_failure: The vault fell into the nave as the last wedges came out. No one was under it. {cast:abbot} names {actor} before the whole chapter as the builder who brought it down.

**Watcher** (variant overview: "{actor} kept the centering in until spring.")
- critical_success: The frame stood all winter, and the vault above it never cracked. In spring it came out in a day, and {cast:abbot} told the chapter that {actor} had been right to wait.
- success: The vault came through the winter whole, and the frame came out in spring. The church opened with the first fine weather.
- success_at_cost: The vault came through the winter with one course over the door cracked by a swell. The crew rebuilt it in spring, and the church opened late.
- failure: One wet week the frame swelled faster than the crew could slacken it, and it cracked a bay of the vault from below. The bay must come down and be built again. {cast:abbot} tells the chapter that {actor} waited for nothing.
- critical_failure: In the worst storm of the winter the swollen frame split the vault along its crown, and half of it had to come down. {cast:abbot} has sent for another master to build it again.

**Fallback** — the Watcher text, verbatim (overview: "{actor} kept the centering in until spring.").

## 14. Aftermath Reaction Choices

Success side (critical_success, success) on both arms — who gets the credit:
- **Credit the foreman's crew** — *The mortal tells the chapter the crew's steady hands saved the vault. The foreman remembers it.* · `bond_change` `$cast:foreman` sentiment +0.12.
- **Accept the town's thanks** — *The mortal takes the thanks before the town. The town thinks better of the master who built its church.* · `reputation_with` `$here` +0.04.

Failure side (failure, critical_failure) on both arms — how to carry the blame:
- **Stay and rebuild it** — *The mortal stays to rebuild what failed, at their own cost. The abbot thinks a little better of them for it.* · `bond_change` `$cast:abbot` sentiment +0.06, trust +0.04.
- **Answer the abbot before the town** — *The mortal tells the town plainly what the weather and the abbot's haste did. The town hears them out; the abbot does not forgive it.* · `reputation_with` `$here` +0.03, `bond_change` `$cast:abbot` sentiment −0.06.

Each pair is a stance: share the credit vs. keep the name; repair the bond vs. defend the name.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path order) | Backing write |
|---|---|---|
| success sides, both arms | BOND · reputation with {target} (`$cast:abbot`, gain) — "{cast:abbot} trusts {actor}'s judgement of stone now." · BOON · Festival (`trait.condition.location.festival`) — "{location} keeps a feast for the new church." | successMetadata: `bond_change` abbot +0.12/+0.10 (Vanguard) +0.10/+0.08 (Watcher); `apply_condition` festival on `$here`, intensity 0.5, 36 ticks |
| failure sides, Vanguard | SCAR · reputation with {target} (`$here`, loss) — "{location} no longer trusts {actor}'s word on stone." · BOND · reputation with {target} (`$cast:abbot`, loss) — "{cast:abbot} blames {actor} for the vault." | failureMetadata: `reputation_with $here` −0.08; `bond_change` abbot −0.12/−0.12 |
| failure sides, Watcher | same two chips | failureMetadata: `reputation_with $here` −0.05; `bond_change` abbot −0.08/−0.08 |

What the world remembers: a feast in the town for the new church; an abbot who trusts or blames the builder; a town that trusts or doubts their word on stone.

## 16. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| abbot (`$cast:abbot`) | lazy-materialize-on-trigger | reuse `monk`/`priest`, spawn `monk` | must-persist | bond_change targets | live |
| foreman (`$cast:foreman`) | lazy-materialize-on-trigger | reuse `mason`, spawn `mason` | must-persist | reaction bond target | live |
| Festival on `$here` | lazy (aftermath write) | `trait.condition.location.festival` | must-persist (36 ticks) | location page, pool | live |
| reputation with `$here` | aftermath write | `reputation_with` | must-persist | standing | live |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Brief row: id, reach, steps, settings, rarity, tier, scale | PASS | stone 0.76 → stone 0.82 on the Vanguard arm; Watcher arm 0.78, inside 0.72–0.85 |
| Opening per declared class | PASS | rural, urban |
| Opening + step-0 spine ≤80 words | FLAG | ~84 with the longer P1; trim in editorial if needed |
| Hands: 0–2 specials + deal on every nudge-bearing step | PASS | 2 + 4 each |
| ≥1 failure fragment per card | PASS | |
| Cards verb+noun, no name word in effect line, no digits | PASS | |
| Consequence hand wired | PASS | relationship (bond_change abbot), place (Festival on $here) |
| Every chip backed by a write on its band | PASS | step metadata per side |
| Systems ≥3 | PASS | cast, conditions, reputation |
| No apply_condition on $actor | PASS | |
| Over-exposed cards | PASS | none used as specials |
| Prose rule 7 / 7b | PASS | no agent history; no later promises without an effect ("sent for another master" is past, scene-local) |
| Cool failure | PASS | no one killed, jailed or branded |

### Narrator's 12 questions

1. P1 arrival with graph names — {actor}, {location}, the abbey. Yes.
2. P2 events with costs — the vault finished, the frame still in, the rains next week, the risk stated.
3. P3 one stake — Opportunity (open the church before winter, at the risk of the vault), with the agent as target ("answers for the vault").
4. ≤80 words — ~84 (FLAG above).
5. Read aloud as report — yes.
6. Facts stated, not encoded — the swelling-timber danger and the blame are stated.
7. Every sentence works — yes.
8. Nothing unintroduced — abbot, centering, mortar, wedges, foreman introduced before cards or chips use them.
9. One named person per beat — step 0 abbot; Vanguard foreman; Watcher foreman (the abbot role-voiced, unnamed token).
10. Stake in a sentence — "Take the frame out before the rains and open the church, or keep it safe all winter, and answer to the abbot either way."
11. Cards verb+noun — yes.
12. Opening per class — rural, urban.

## 18. Concept Art Direction

1. *Emotions:* responsibility carried alone; patience against weather; the held breath before a structure takes its own weight.
2. *Evocative image:* a single wooden wedge lying on wet flagstones under a pale stone arch, rain-dark timber stacked by a door, a mason's mallet left on a sill. No people. Residue of the decision, not the strike itself.

(No concept art is generated in this batch — runbook rule; the direction is recorded for later.)

## 19. Experience Differentiator Gate

1. YES (length flagged) · 2. YES · 3. YES (rain, mortar, frame, wedges, crew, timber all in prose) · 4. YES · 5. YES · 6. YES (essence on every card) · 7. YES · 8. YES · 9. YES (nerve vs caution lean; light vs time; bind stones vs pace hands; weather vs timber) · 9b. YES · 10. YES · 11. YES · 11b. YES (overviews tell the event; chips name the state) · 12. YES · 13. YES · 14. YES

## Branch Seduction Self-Check

- **Vanguard:** a mortal of courage trusts their test and their crew, and wants the church open before winter. The god watches one day of even hands and stone taking its weight. Protects the town's winter in its church.
- **Watcher:** a prudent mortal will not bet a vault on one week of dry weather, and takes a winter of wet nights instead. The god watches a long endurance against the rain. Protects the vault itself.
- Without labels: one day of nerve versus a season of patience. Distinct.
