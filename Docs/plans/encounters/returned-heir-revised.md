# Encounter Pipeline: The Returned Heir
> Scale: medium | Slug: returned-heir | Pass: revised
> Revisions applied: 25 prose edits (see `returned-heir-editorial.md` § Exact edit list). Six seam echoes and three page repetitions fixed. The crit-fail bond chip is now true on both routes. The opening is clarified, the bribe logic repaired, the scar/burn doubling split, and the maid introduced. Stakes `lost`, `narrativeTemplates.success` and one reaction intent are tightened. No mechanics changed.
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 slot 1 (THR-1840)

Template id `encounter.town.returned_heir` · reach eye · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `urban`, `rural`.
Consequence hand (binding, printed by `npm run -s draw:consequences -- encounter.town.returned_heir --reach eye --rarity 2`): **relationship** (`bond_change`) + **movement** (`agent_relocation`). No swap.
plotHookRolled: hook.assassination_succeeded, hook.monster_eradication, hook.meeting_to_keep · **plotHookTaken: hook.meeting_to_keep**.

## Mechanical design block (fixed before the prose)

- **Crux.** A man says he is the lord's son, counted dead in the war, and the steward asks the master to read him before the manor court sits.
- **Title glance test.** "The Returned Heir": someone has come back and claims an inheritance.
- **Whose problem.** The agent's by request (rolled role: judge asked to rule). Their reading, their sworn finding, their name.
- **Shape.** Appointment (Seeded Sequel, placed/timed, THR-1479) on a linear two-step. Step 0 eye 0.74 `continue_weakened` (read the man: scars, hands, memory). Step 1 eye 0.80 `fail_action` (read the household: who taught him what, who gains), with carryover factor lines keyed on step 0's band. Mean 0.77, window fit 0.91.
- **Opposition.** Time: the court sits on its day.
- **Consequence hand wiring.**
  - relationship: `bond_change` with `$cast:claimant`. +0.12/+0.10 on step 1 success, −0.12/−0.10 on step 1 failure, −0.05/−0.05 on step 0 failure (he saw the master doubt him; backs the critical_failure BOND chip on the step-0 route).
  - movement: `agent_relocation` of `$actor`, `away` ≥3 hexes, `travel`, on step 1 failure. With no finding to swear to, the uncle has the master shown off the manor. PATH chip on `failure` only; a step-0 critical failure ends the action before it fires. The success side cannot carry the relocation, because the appointment holds the master at `$here`.
- **Appointment.** Step 1 success plants `encounter_seed` → `town.returned_heir_sworn`, `delayTicks` 36, `inheritContext`, `appointment { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.returned_heir_defaulted' } }`.
  - seedLabel: "The finding is sworn before the manor court on court day, with the steward there to hear it."
  - missed seedLabel: "The finding was not sworn on court day, and the man comes looking for the master who made it."
- **Standing.** `reputation_with $here` +0.06 / −0.06 on step 1; −0.02 on step 0 failure.
- **Cool failure.** The master's name: the court sits unread, the uncle keeps the manor, the master is shown the road, and the uncle holds the master's error against the man. Nobody is hurt, jailed or branded.
- **Trait hooks.** Gate: none. Variant: Cold (`trait.core.core_warmth.vice`) +0.04 / Warm (`trait.core.core_warmth.virtue`) −0.04 (reading a man while his mother hopes). Trait-only nudge: none. Trait fragment: none.
- **Systems.** cast (claimant, steward) · appointment seed · relationship · movement · reputation · traits.

## 1. Inspiration Anchors

The returned-claimant story (the soldier home from a war who may or may not be the son) is the classic heir-impostor pattern: recognition by a scar, by a dog, by a memory no outsider could hold. The Odyssey's scar recognition and the long tradition of impostor heirs supplied the scar and the old nurse. Anti-patterns avoided: a mystery whose answer is front-loaded in the opening (the maid only surfaces behind the step-1 roll); a set-piece where the agent watches (the agent is the reader the court waits on); a player-picked ending (the hand nudges, fate rolls).

## 2. Scale Justification

Medium: two beats and a placed/timed sequel. Who holds a manor is settlement scale; the master's sworn word carries it to court. Two reading beats are the honest size for "read the man, then read the house".

## 3. Pressure Knot

The man is already home. The widow has already said yes. The uncle already holds the manor and has called him an impostor. The court already has its day.

## 4. Intervention Fantasy

The god works the edges of a reading: a shirt torn at the right moment, a sleep deep enough to talk through, a coached servant's conscience, a bundle of old letters turned up. Every card bears on a thing the scene named.

## 5. Cast and World Objects

- `{cast:claimant}`: the man who says he is the son (support actor, `wanderer`, must-persist; bond target, sequel cast).
- `{cast:steward}`: the manor's steward, who sent for the master and keeps the old letters (support actor, `steward`, must-persist; appointment counterparty).
- The widow, the uncle, the widow's maid: role nouns only.
- `{location}` (`$here`): the town; reputation channel and appointment place.

## 6. Beat Structure

1. **Read the man** (eye 0.74).
2. **Read the household** (eye 0.80).
3. Appointment: kept → `town.returned_heir_sworn`, missed → `town.returned_heir_defaulted`.

## 7. Branching Profile

Linear, no branching. Branch count 0. The appointment is a seed, not a fork.

## 8. Branching Map

N/A (linear encounter).

## 9. Outcome Ladder

- **critical_success:** the finding is written into the manor rolls, and the widow asks the master to stand with her son in court. Chips: town regard up, the claimant's trust, the court-day appointment.
- **success:** the steward has the finding in writing, and the servants already call the man the young lord. Same chips.
- **success_at_cost:** the steward has the finding, and the uncle tells the manor the widow bought it. Same chips.
- **failure:** no finding; the court sits without one; the uncle keeps the manor and has the master shown the road. Chips: town regard down, the claimant blames them, travelling away.
- **critical_failure:** the uncle now holds a master's own error against the man. Chips: town regard down, the claimant blames them.

## 9b. Stakes Line

```
goal:      judge the man who says he is the lost heir
risk:      misread the man in front of the whole household
won:       judged the man who says he is the lost heir
lost:      reached no finding and was sent off the manor
lostBadly: misread the man in front of the whole household
```

Description: "Seven years after the lord's son was counted dead in the war, a man has come home saying he is that son. Someone has to read the man and the household before the manor court sits, and swear to what they find."

`narrativeTemplates`:
- initiation: "A man has come home to {location} claiming to be the lord's lost son, and the steward has sent for a master to read him."
- success: "The finding names the man as the lord's son, and is to be sworn before the manor court on court day."
- failure: "No finding was made, and the man's claim goes to court unread."

## 10. Opening (urban; rural swaps P1). 78 / 77 words

> {actor} arrives in {location} on market day, sent for by the manor's steward.
>
> Seven years ago the lord's son went to war and was counted dead. Now {cast:claimant} has walked in, saying he is that son. The widow says he is her boy. The uncle, who holds the manor now, says he is an impostor.
>
> The manor court sits in three days. The steward asks {actor} to read the man: his scars, his hands, and what he remembers.

Rural P1: "{actor} walks into {location} at noon, sent for by the manor's steward."

Step 0 purpose line: "Read the man".

### Step 0 afterimages

- critical_success: "The scar on his chin was the one the son got as a boy, and he told how he got it before anyone asked."
- success: "His hands were a soldier's now, but he told the family's oldest stories the way the family tells them."
- success_at_cost: "He told the old stories well, but {actor} heard them in the widow's own chamber, and the uncle called the master bought."
- failure: "War had changed his face and hands too much to read, and he could not name his own horse."
- critical_failure: "{actor} called a scar on his arm a war wound, and the widow showed the hall it was her son's boyhood scar."

Step 0 failure effects: `bond_change $cast:claimant` −0.05/−0.05; `reputation_with $here` −0.02.

## 11. The Hand Per Step

**Step 0: Read the man** · `deal: { count: 3, tags: ['insight', 'social'] }`
- *Show The Scars* (Signature, force, 2 essence, +0.10, `generic.strength`): "Tear the man's shirt open at the shoulder, so every old wound on his back is in plain sight."
  - critical_success: "His shirt tore on a nail, and the hall saw the old burn on his back that the widow had described."
  - success: "His shirt tore, and on his back was the old burn the widow had described."
  - near_miss: "His shirt tore, but the uncle had him covered before {actor} could look closely."
  - failure: "His shirt tore, and every mark on his back was from the war."
- *Deepen His Sleep* (Signature, darkness, 1 essence, +0.08, `generic.dark`): "Lay a heavy dark over the man's bed tonight, so he talks while dreaming with no guard on what he says."
  - success: "He talked in his sleep and called for the son's old nurse by a pet name no servant used."
  - success_at_cost: "He called for the son's old nurse in his sleep, and the uncle's man heard {actor} listening at the door."
  - near_miss: "He talked all night in his sleep, but only in the soldiers' speech of the war."
  - failure: "He slept without a word until morning."
  - critical_failure: "He cried out in his sleep for a woman nobody in the house had heard of."

**Step 1: Read the household** · `deal: { count: 3, tags: ['insight', 'lore'] }`
- *Wake A Conscience* (Signature, spirit, 2 essence, +0.10, `generic.warmth`): "Trouble whoever coached the man until keeping quiet costs them more than speaking."
  - critical_success: "The widow's maid came to {actor} in tears and listed every piece of news she had given him."
  - success: "The widow's maid admitted she had told him the household news since he left."
  - near_miss: "The widow's maid admitted to her mistress what she had told him, and the widow kept it from {actor}."
  - failure: "The widow's maid cried in the kitchen all night and told no one why."
- *Uncover Old Letters* (Signature, light, 2 essence, +0.08, `generic.light`): "Turn up a forgotten bundle in the steward's chest, so the son's own handwriting can be set beside the man's."
  - success: "The son's letters from the war turned up, and the man wrote the same crooked hand."
  - success_at_cost: "The letters turned up, and the uncle's clerk saw {actor} take them from the steward's chest."
  - failure: "The letters turned up, but the man's hand matched them only here and there."
  - critical_failure: "The letters turned up, and the uncle read aloud a line from them the man could not explain."

No rider, no Heavy Hand, no grants, no over-exposed card as a special.

Trait variant factor lines:
- Cold (+0.04): "Being Cold, they read the man and not his mother's hope."
- Warm (−0.04): "Being Warm, they want the widow to have her son back."

## 12. Linear continuation (step 1 spine)

> Anyone in the house could have taught the man what he knows. The steward, {cast:steward}, keeps the manor's old letters, and every servant answers to him. The uncle loses the manor if the man is the heir.
>
> {actor} must find out who taught the man what, and who gains. A finding {actor} can stand behind is sworn before the manor court in {location} on court day, with {cast:steward} there to hear it.

Step 1 purpose line: "Read the household".

### Carryover factor lines (keyed on step 0's band)

- critical_success (for, +0.05): "They know the scar on his chin is the son's."
- success (for, +0.03): "They know he tells the old stories the family's way."
- success_at_cost (against, −0.02): "The uncle tells the household the widow bought them."
- near_miss (for, +0.01): "They read his hands but not his memory."
- failure (against, −0.03): "War changed the man too much to read by sight."

### Step 1 afterimages

- critical_success: "{actor} sorted what the man was told from what he remembered, and what he remembered only the son could know."
- success: "{actor} found who had told him the recent news, and he knew the old stories himself."
- success_at_cost: "The finding stands, but the uncle has sworn to break it before the court."
- failure: "{actor} could not tell what the man remembered from what he had been told, and the uncle had {actor} shown the road."
- critical_failure: "The uncle questioned the man before the whole household, and he could not answer. The hall laughed at {actor}'s reading, and the uncle had {actor} shown off the manor."

Step 1 success effects: `bond_change $cast:claimant` +0.12/+0.10; `reputation_with $here` +0.06; the appointment seed (§ Mechanical design block).
Step 1 failure effects: `bond_change $cast:claimant` −0.12/−0.10; `reputation_with $here` −0.06; `agent_relocation $actor` away ≥3, travel.

## 13. Aftermath (assembled per band, as the player meets it)

Fallback overview (unused; every band authored): "The manor has a master's reading of the man who says he is the lord's son."

**critical_success**
> The steward has written the finding into the manor rolls, and the widow has asked {actor} to stand beside her son in court.
> - BOND · reputation with {location} ("A reading trusted"): Read the man true — {location} thinks well of {actor} now.
> - BOND · reputation, {cast:claimant} trusts ("The Son's Trust"): Named him the son — {cast:claimant} trusts {actor} now.
> - PATH · appointment, `$appointment` ("The manor court"): Court day — {cast:steward} hears the finding sworn in {location} in three days.

**success**
> The steward has the finding in writing, and the manor's servants already call the man the young lord.
> - the same three chips as critical_success

**success_at_cost**
> The steward has the finding in writing, and the uncle tells the whole manor the widow bought it.
> - the same three chips as critical_success

**failure**
> The court will sit with no finding before it, and the uncle keeps the manor. The man will face the court with only his mother's word.
> - SCAR · reputation with {location} ("No finding"): The manor's talk — {location} thinks less of {actor} now.
> - BOND · reputation, {cast:claimant} blames ("The Claimant's Blame"): His reader failed him — {cast:claimant} blames {actor} now.
> - PATH · seed, travelling away ("Shown the road"): The uncle's order — {actor} is travelling away from {location} now.

**critical_failure**
> The uncle now has a master's own error to hold up in court against the man.
> - SCAR · reputation with {location} ("A misreading"): Talk of the household — {location} thinks less of {actor} now.
> - BOND · reputation, {cast:claimant} blames ("The Claimant's Blame"): Misread before his mother — {cast:claimant} blames {actor} now.

## 14. Aftermath Reaction Choices

Success side (fallback, all three success bands):
- *Sit with the son at his mother's table* — "The mortal eats with the family on the night before the court sits. The son will remember who sat with him." (bond +0.04 sentiment with the claimant: loyalty to the person)
- *Keep the finding for the court* — "The mortal tells no one what the finding is until the hearing. The town will respect the discretion." (`reputation_with $here` +0.03: discretion for the institution)

Failure side (failure and critical_failure, identical):
- *Write the man what was found* — "The mortal sends the man an honest account of what could and could not be read. He will blame them a little less." (claimant bond +0.04 sentiment)
- *Leave the notes with the steward* — "The mortal leaves every note with the steward for the next reader. The steward will remember the honesty." (steward bond +0.04/+0.04)

## 15. Aftermath Kit Summary

BOND · reputation with {location} (gain; SCAR on loss) · BOND · reputation ({cast:claimant} trusts / blames) · PATH · appointment (court day, `$appointment`) · PATH · seed (travelling away, failure only).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `claimant` | lazy-materialize-on-trigger | reuse `wanderer` / spawn "Aldous Harrow" | must-persist | bond chips, both sequels | ok |
| `steward` | lazy-materialize-on-trigger | reuse `steward` / spawn "Wystan Pell" | must-persist | appointment counterparty, kept sequel, failure reaction | ok (systems: confirm bound on the step-0 crit-fail route, where the steward is never named) |
| `town.returned_heir_sworn` / `_defaulted` | seed-only sequels | `returned-heir-sequels.ts` | registry | appointment branches | authored with the parent |

## 17. Sequels (`src/data/encounters/returned-heir-sequels.ts`, unchanged)

**The Finding Sworn** (`town.returned_heir_sworn`, kept, seed-only, eye 0.40)
- stakes: goal "swear the finding before the manor court" · risk / lost "(saw the court) put off its ruling on the claim" · won "swore the finding, and the court named the son"
- description: "{name} is at the manor court on court day, where the finding on the returned heir is sworn."
- purpose: "Swear the finding"
- narrative: "{name} is at the manor court in {location} on court day. The uncle's side questions the finding, and {cast:steward} is there to hear it sworn. If the finding holds, the court names {cast:claimant} the lord's son."
- success: "The uncle's side could not shake the finding. The court named {cast:claimant} the lord's son, and the manor is his." (`reputation_with $here` +0.05; claimant bond +0.06/+0.04)
- failure: "The uncle's side questioned the finding until the court put off its ruling, and the uncle keeps the manor for now." (`reputation_with $here` −0.03)
- templates: initiation "{name} is at the manor court on court day, where the finding is sworn." · success "The court named the man the lord's son." · failure "The court put off its ruling."
- overview: "{name} kept court day at the manor, with the steward there to hear the finding."

**The Finding Unsworn** (`town.returned_heir_defaulted`, missed, seed-only, heart 0.45; names no place)
- stakes: goal / won "answer(ed) the man who was turned off the manor" · risk / lost "be / was blamed for a son turned out of his own house"
- description: "The finding on the returned heir was never sworn, and the man it named has come looking for the master who made it."
- purpose: "Answer the man"
- narrative: "{name} was not at the manor court on court day, and the finding was never sworn. The court ruled without it, and the uncle had {cast:claimant} turned off the manor. {cast:claimant} has come looking for {name}, to ask why the master who read him stayed away."
- success: "{name} gave {cast:claimant} the finding in writing, sealed, for the next court to hear." (claimant bond −0.02/+0.04)
- failure: "{cast:claimant} blames the master who stayed away, and says so to anyone who will listen." (claimant bond −0.08/−0.10; `reputation_with` targetAgentId claimant −0.04)
- templates: initiation "The finding was not sworn on court day, and the man it named has come looking." · success "{name} gave the man the finding in writing." · failure "The man blames the master who stayed away."
- overview: "Nobody swore the finding on court day, and the uncle keeps the manor."

## 18. Self-Audit (post-revision)

| Item | Verdict |
|---|---|
| Envelope + opening per class | PASS (urban, rural) |
| Opening ≤80 words | PASS (78 / 77) |
| Purpose lines ≤4 words | PASS |
| Composed hand 4–8, 2 specials + deal | PASS |
| Every nudge has a failure fragment | PASS |
| Six StepOutcomes covered per step | PASS |
| No digits in effect lines; no name word repeated | PASS |
| Trait hooks answered | PASS |
| Both hand families wired in context | PASS |
| Appointment both sequels authored, seed-only | PASS |
| Chips backed per band on every route (Law 56) | PASS (route map in editorial) |
| Chip cause + detail ≤15 words | PASS (max 12) |
| Page read (THR-1474), every band | PASS after revision |
| Seam echoes | PASS after revision |
| `check:encounter --package` | re-run after applying the edits |

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (scar, sleep, conscience, letters: four different certainties) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES (personal loyalty vs institutional discretion; honesty to the man vs to the next reader) · 14 YES.

## Concept Art Direction

Emotions: a family's hope against an uncle's doubt; a man nobody can be sure of. Image: a torn soldier's shirt folded on a bench in a manor hall, beside an unopened bundle of old letters tied with faded ribbon, a single chair pulled out at the high table. No people.
