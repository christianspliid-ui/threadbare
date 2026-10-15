# Encounter Pipeline: The Returned Heir
> Scale: medium | Slug: returned-heir | Pass: draft
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 slot 1 (THR-1840)

Template id `encounter.town.returned_heir` · reach eye · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `urban`, `rural`.
Consequence hand (binding, printed by `npm run -s draw:consequences -- encounter.town.returned_heir --reach eye --rarity 2`): **relationship** (`bond_change`) + **movement** (`agent_relocation`). No swap.
plotHookRolled: hook.assassination_succeeded, hook.monster_eradication, hook.meeting_to_keep · **plotHookTaken: hook.meeting_to_keep**.

## Mechanical design block (fixed before the prose)

- **Crux.** A man says he is the lord's son, counted dead in the war, and the steward asks the master to read him before the manor court sits.
- **Title glance test.** "The Returned Heir": someone has come back and claims an inheritance.
- **Whose problem.** The agent's by request (rolled role: judge asked to rule). Their reading, their sworn finding, their name.
- **Shape.** Appointment (Seeded Sequel, placed/timed, THR-1479) on a linear two-step. Step 0 eye 0.74 `continue_weakened` (read the man: scars, hands, memory). Step 1 eye 0.80 `fail_action` (read the household: who taught him what, who gains), with carryover factor lines keyed on step 0's band. Mean 0.77, window fit 0.91.
- **Opposition.** Time: the court sits on its day, ready or not.
- **Consequence hand wiring.**
  - relationship: `bond_change` with `$cast:claimant` — up on step 1 success, down on step 1 failure, a small drop on step 0 failure (he saw the master doubt him).
  - movement: `agent_relocation` of `$actor`, `away` ≥3 hexes, `travel`, on step 1 failure — with no finding to swear to, the uncle has the master shown off the manor. The success side cannot carry the relocation: the appointment holds the master at `$here`.
- **Appointment.** Step 1 success plants `encounter_seed` → `town.returned_heir_sworn`, `delayTicks` 36, `inheritContext`, `appointment { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.returned_heir_defaulted' } }`.
- **Standing.** `reputation_with $here` +0.06 / −0.06 on step 1; −0.02 on step 0 failure.
- **Cool failure.** The master's name: the court sits unread, the uncle keeps the manor, the master is shown the road, and the manor sends for someone else next time. Nobody is hurt, jailed or branded.
- **Trait hooks.** Gate: none. Variant: Cold +0.04 / Warm −0.04 (reading a man while his mother weeps for him). Trait-only nudge: none. Trait fragment: none.
- **Systems.** cast (claimant, steward) · appointment seed · relationship · movement · reputation · traits.

## 1. Inspiration Anchors

The returned-claimant story (the soldier home from a war who may or may not be the son) is the classic heir-impostor pattern: recognition by a scar, by a dog, by a memory no outsider could hold. The Odyssey's scar-recognition and the long tradition of impostor heirs supplied the scar and the old nurse. Anti-patterns avoided: a mystery whose answer is front-loaded in the opening (the maid only surfaces behind the step-1 roll), a set-piece where the agent watches (the agent is the reader the court waits on), and a player-picked ending (the hand nudges, fate rolls).

## 2. Scale Justification

Medium: two beats and a placed/timed sequel. Who holds a manor is settlement-scale; the master's sworn word carries it to court. Two reading beats are the honest size for "read the man, then read the house".

## 3. Pressure Knot

The man is already home; the widow has already said yes; the uncle already holds the manor and has called him an impostor; the court already has its day.

## 4. Intervention Fantasy

The god works the edges of a reading: a shirt torn at the right moment, a sleep deep enough to talk through, a coached servant's conscience, a bundle of old letters turned up. Every card bears on a thing the scene named.

## 5. Cast and World Objects

- `{cast:claimant}` — the man who says he is the son (support actor, `wanderer`, must-persist; bond target, sequel cast).
- `{cast:steward}` — the manor's steward, who sent for the master and keeps the old letters (support actor, `steward`, must-persist; appointment counterparty).
- The widow, the uncle, the widow's maid — role nouns only.
- `{location}` (`$here`) — the town; reputation channel and appointment place.

## 6. Beat Structure

1. **Read the man** (eye 0.74). 2. **Read the household** (eye 0.80). 3. Appointment: kept → `town.returned_heir_sworn`, missed → `town.returned_heir_defaulted`.

## 7. Branching Profile

Linear — no branching. Branch count 0. The appointment is a seed, not a fork.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

- **critical_success:** the finding is written into the manor rolls, the widow asks the master to stand with her son in court; town regard up, the claimant's trust, the court-day appointment.
- **success:** the finding names him the son and is in the steward's hands; same chips.
- **success_at_cost:** the finding stands, and the uncle tells the manor the widow bought it.
- **failure:** no finding; the court sits unread; the uncle keeps the manor and has the master shown the road. Town regard down, the claimant blames them, travelling away.
- **critical_failure:** the household watched the master misread the man; the manor will send for someone else. Town regard down, the claimant blames them.

## 9b. Stakes Line

```
goal:      judge the man who says he is the lost heir
risk:      misread the man in front of the whole household
won:       judged the man who says he is the lost heir
lost:      found nothing to swear to and was sent off the manor
lostBadly: misread the man in front of the whole household
```

Description: "Seven years after the lord's son was counted dead in the war, a man has come home saying he is that son. Someone has to read the man and the household before the manor court sits, and swear to what they find."

## 10. Sample Opening (urban; rural swaps P1)

> {actor} arrives in {location} on market day, sent for by the manor's steward.
>
> Seven years ago the lord's son went to war and was counted dead. Now {cast:claimant} has walked in, saying he is that son. The widow says he is her boy. The uncle, who holds the manor now, says impostor.
>
> The manor court sits in three days, ready or not. The steward asks {actor} to read the man: his scars, his hands, and what he remembers.

Rural P1: "{actor} walks into {location} at noon, sent for by the manor's steward."

## 11. The Hand Per Step

**Step 0 — Read the man** · `deal: { count: 3, tags: ['insight', 'social'] }`
- *Show The Scars* (Signature, force, 2 essence, +0.10, `generic.strength`) — "Tear the man's shirt open at the shoulder, so every old wound on his back is in plain sight." Fragments: crit "His shirt tore on a nail, and the hall saw the boyhood scar the widow had described." · success "His shirt tore, and under it was the boyhood scar the widow had described." · near_miss "His shirt tore, but the uncle had him covered before {actor} could look closely." · failure "His shirt tore, and every mark on his back was from the war."
- *Deepen His Sleep* (Signature, darkness, 1 essence, +0.08, `generic.dark`) — "Lay a heavy dark over the man's bed tonight, so he talks while dreaming with no guard on what he says." Fragments: success "He talked in his sleep and called for the son's old nurse by a pet name no servant used." · success_at_cost "He called for the son's old nurse in his sleep, and the uncle's man heard {actor} listening at the door." · near_miss "He talked all night in his sleep, but only in the soldiers' speech of the war." · failure "He slept without a word until morning." · critical_failure "He cried out in his sleep for a woman nobody in the house had heard of."

**Step 1 — Read the household** · `deal: { count: 3, tags: ['insight', 'lore'] }`
- *Wake A Conscience* (Signature, spirit, 2 essence, +0.10, `generic.warmth`) — "Trouble whoever coached the man until keeping quiet costs them more than speaking." Fragments: crit "The widow's maid came to {actor} in tears and listed every piece of news she had given him." · success "The widow's maid admitted she had told him the household news since he left." · near_miss "The maid admitted it to the widow, who kept it to herself until court day was close." · failure "The maid cried in the kitchen all night and told no one why."
- *Uncover Old Letters* (Signature, light, 2 essence, +0.08, `generic.light`) — "Turn up a forgotten bundle in the steward's chest, so the son's own handwriting can be set beside the man's." Fragments: success "The son's letters from the war turned up, and the man wrote the same crooked hand." · success_at_cost "The letters turned up, and the uncle's clerk saw {actor} take them from the steward's chest." · failure "The letters turned up, but the war had changed the man's hand past matching." · critical_failure "The letters turned up, and the uncle read aloud a line from them the man could not explain."

No rider, no Heavy Hand, no grants, no over-exposed card as a special.

## 12. Linear continuation (step 1 spine)

> The man knows things only the family should know, like the name of the son's old nurse. Someone in the house could have taught him. {cast:steward} keeps the manor's old letters, and every servant answers to him. The uncle loses the manor if the man is the heir.
>
> {actor} must find out who taught the man what, and who gains. A finding {actor} can stand behind is sworn before the manor court in {location} on court day, with {cast:steward} there to hear it.

Afterimages (step 0 / step 1) and carryover factor lines: as in `returned-heir.package.json`.

## 13. Aftermath Paragraph

Success-side overviews: crit "The steward has written the finding into the manor rolls, and the widow has asked {actor} to stand beside her son in court." · success "The finding names the man as the lord's son, and it is in the steward's hands." · s@c "The finding names the man as the lord's son, and the uncle tells the whole manor the widow bought it." Failure "The court will sit with no finding before it, and the uncle keeps the manor. The steward sent for a master to settle the claim, and {actor} could not." · critical_failure "The whole household watched {actor} misread the man. The steward sent for a master and got a laughing-stock, and the manor will send for someone else next time."

## 14. Aftermath Reaction Choices

Success side: *Sit with the son at his mother's table* (bond +0.04 with the claimant — loyalty to the person) vs *Keep the finding for the court* (town regard +0.03 — discretion to the institution). Failure side (both failure bands): *Write the man what was found* (claimant bond +0.04) vs *Leave the notes with the steward* (steward bond +0.04/+0.04).

## 15. Aftermath Kit Summary

BOND · reputation with {location} (gain / SCAR on loss) · BOND · reputation ({cast:claimant} trusts / blames) · PATH · appointment (court day, `$appointment`) · PATH · seed (travelling away, failure only).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `claimant` | lazy-materialize-on-trigger | reuse `wanderer` / spawn "Aldous Harrow" | must-persist | bond chips, both sequels | ok |
| `steward` | lazy-materialize-on-trigger | reuse `steward` / spawn "Wystan Pell" | must-persist | appointment counterparty, kept sequel, failure reaction | ok |
| `town.returned_heir_sworn` / `_defaulted` | seed-only sequels | `returned-heir-sequels.ts` | registry | appointment branches | authored with the parent |

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + opening per class | PASS (urban, rural) |
| Opening ≤80 words | PASS (79 / 79) |
| Purpose lines ≤4 words | PASS |
| Composed hand 4–8, 2 specials + deal | PASS |
| Every nudge has a failure fragment | PASS |
| Six StepOutcomes covered per step | PASS |
| No digits in effect lines; no name word repeated | PASS |
| Trait hooks answered | PASS |
| Both hand families wired in context | PASS |
| Appointment both sequels authored, seed-only | PASS |
| Chips backed per band (Law 56); crit_failure claims only what both routes write | PASS |
| `check:encounter --package` | PASS (private bundle including the sequels) |

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (scar, sleep, conscience, letters — four different certainties) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES · 13 YES (personal loyalty vs institutional discretion; honesty to the man vs to the next reader) · 14 YES (below).

## Concept Art Direction

Emotions: a family's hope against an uncle's doubt; a man nobody can be sure of. Image: a torn soldier's shirt folded on a bench in a manor hall, beside an unopened bundle of old letters tied with faded ribbon, a single chair pulled out at the high table. No people.
