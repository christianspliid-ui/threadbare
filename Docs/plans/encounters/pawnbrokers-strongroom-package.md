# Package critic — The Cooper's Pawned Box (slot 4, slug pawnbrokers-strongroom)

templateId: encounter.town.pawnbrokers_strongroom
packageVerdict: connected
packageLeaves: Getting the box out first pays the mortal a #stealth item from the cooper's box and plants a sequel in which the buyer who lost it sends them to a back-room broker (Black Market Deal); losing it leaves the town where the pawnbroker named them thinking less of them and gives the mortal an urge to steal for a few days, while the buyer's hired thief (Wren Hollis, or a reused lookout) stays in the world.

> Independent Pass 3b, batch expert-everyday-2 (THR-1679), 2026-10-01. Judged against `pawnbrokers-strongroom-final.md` (Pass 3 merged). No `.package.json` exists yet; the final doc's § 15 is authoritative for chips and writes.

## Half A — anchoring

How bands map to writes. Step 0 is `continue_weakened` and step 1 is `fail_action`. Step 1 `successMetadata` fires on every route into critical_success, success and success_at_cost. A step-1 near_miss counts as a success, so it reaches success_at_cost with the success writes. Step 1 `failureMetadata` fires on failure, and on critical_failure when that band is reached through step 1. When a step-0 critical failure ends the action, step 0 `failureMetadata` (−0.04) backs critical_failure instead. Pass 3 checked each chip against each route into its band, and my re-walk agrees.

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| crit / success / s@c | PATH · seed — "The Buyer's Interest" | the pending `encounter_seed` → `encounter.black_market_deal`, planted on the mortal (`targetAgentId: '$actor'`, delay 36) | seed-via-carrier clause: an `individual` actor, 🔗 linked (`entityId: '$actor'`, `visualKind: 'agent'`). The template id is never the anchor (catalog § `encounter_template`) | yes: "will send for {actor}" names the carrier. "The buyer" is only scene texture, used the same way as bell-at-the-exchange's "A caravan master with unsold cargo will hear of {actor}" | anchored |
| crit / success / s@c | PRIZE (engine-rendered) | the `#stealth` possession drawn by step 1 `rewardPool` | possession, 🔗 linked (the drawn template) | the engine names the drawn item. The overviews set it up ("paid {actor} from inside it") and name no specific object, which is right for a tag draw | anchored |
| failure | SCAR · compulsion — "Beaten to the Box" | the planted compulsion (`steal` 0.5, 72 ticks) on the mortal | compulsion, 📍 named (`ui.compulsion`). Same form as drowned-mans-testimony and bell-at-the-exchange | yes: "look for a lock to prove themselves on". That is what a steal bias does, and it claims nothing more | anchored |
| failure | BOND · reputation with {target} — "Named by the Pawnbroker" | the mortal's standing with the settlement (`reputation_with $here` −0.08) | `reputation_with` counterparty, a `location`, 🔗 linked via `entityId: '$here'`, `visualKind: 'location'` | yes: "{location} thinks less of {actor}" | anchored |
| critical_failure | BOND · reputation with {target} — "Named Before the Fair" | same edge. On the step-0 path the write is −0.04; on the step-1 path it is −0.08 | as above | yes | anchored |
| fallback only | growth · shadow reach | shadow reach | reach, 📍 named (`reach.shadow`) | yes | anchored. It renders only on an unauthored band, and all five bands are authored |

Nothing needs a fold or a bind. The cooper, the pawnbroker, the dog, the iron box, the buyer, the stair and the coal hatch are all scene fiction. They live only in the spines, the overviews and the afterimages, and no chip claims any of them. `{cast:rival}` is named in the prose but carries no chip, because nothing is written onto the rival. That means THR-1685 cannot bite here: the only `{target}` chip anchors on `$here`, and the town is what the prose means.

**Unchipped writes (lawful, recorded in the final):**
- The step-0 −0.04 standing debit on a house-woke route that goes on to win.
- The step-1 compulsion on a critical_failure reached through step 1.

Both are real state that no chip claims. Neither one makes a chip lie.

**Page read (rule 1c).** I read all five pages as one text:
- The success pages rest the pawnbroker's silence on his broken word, then hand off to the seed chip ("the buyer … will send for {actor}"). That agrees with the spine: the buyer hired the rival.
- The failure page gives three facts in three places. The delivery and the accusation are in the overview, the drive is in the scar, and the standing is in the bond.
- The critical_failure overview ("below his house") holds on both paths.
- No chip repeats a four-word run from its overview, and every chip sentence is 15 words or fewer.

**Seed-to-sequel handoff (checked against `src/data/encounter-content.ts:5441`).** Black Market Deal opens with "{actor} follows directions given twice and written down nowhere, to a back room", where "The broker is there". So the seed label's "directions to a back room" is acted out word for word. The chip's "will send for {actor}" is paid off by the sequel reaching the mortal. The sequel's `locationTypes` exclude farmland and mining. That is harmless, because a literal seed skips the eligibility filter and the seed goes to the mortal, not to a place.

### Chip declarations for the implementer (exact)

| Chip | Band(s) | `kind` / `category` / `direction` | `stateNoun` | `concepts` | Shipped precedent |
|---|---|---|---|---|---|
| The Buyer's Interest | critical_success, success, success_at_cost | `future_hook` / `path` / `opens`, `polarity: 'info'` | `{ text: 'seed', tooltipId: 'ui.aftermath_seed' }` | `[{ text: '{actor}', entityId: '$actor', visualKind: 'agent' }]` | `src/data/encounters/bell-at-the-exchange.ts:428-448` (`bell.cargo_off_the_floor`) |
| Beaten to the Box | failure only | `shell_state` / `scar` / `loss`, `polarity: 'loss'` | `{ text: 'compulsion', tooltipId: 'ui.compulsion' }` | `[{ text: 'a lock to prove themselves on', tooltipId: 'ui.compulsion' }]` (the phrase must appear in `detail` verbatim) | `src/data/encounters/drowned-mans-testimony.ts:493-510` (`testimony.fail.compulsion`) |
| Named by the Pawnbroker | failure | `reputation` / `bond` / `loss`, `polarity: 'loss'` | `{ text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` | optional; if you add one, `{ text: 'thinks less of', tooltipId: 'ui.standing' }` | `drowned-mans-testimony.ts:513-531` (`testimony.fail.town_trust`) |
| Named Before the Fair | critical_failure | as above | as above | as above | as above |

**Optional, not a fix.** drowned-mans-testimony's shipped noun is `reputation with {location}` rather than `{target}`. Both resolve to the settlement on this anchor. `{location}` does not depend on how the THR-1685 renderer treats `{target}`, so prefer it if the compiler accepts either. tithe-barn-raid shipped the `{target}` form, so neither choice is a defect.

## Half B — what it leaves behind

- **The buyer's sequel** (success half). `encounter.black_market_deal` is seeded on the mortal at a 36-tick delay. The seed scheduler reads it, and the player sees the PATH chip now and the back-room scene later.
- **A `#stealth` item** (success half). It becomes a possession on the mortal's sheet and shows as the PRIZE chip. Worn `#stealth` items feed the shadow-reach contributions that later shadow draws read.
- **Town standing** (failure half, −0.08; −0.04 on the step-0 path). The `reputation_with` edge on the settlement is read by settlement standing and by reputation-gated draws there. The player sees it on the place-named BOND chip, which clicks through to the town's sheet.
- **A steal compulsion** (failure only; 0.5 for 72 ticks). `derivePlantedCompulsionEncounterBias` reads it in agent decisions, so the player sees the mortal drift toward theft jobs.
- **The rival persists.** Wren Hollis, or a reused lookout or wanderer, is `must-persist` with `supportRole: hired_thief`, so a later scene in that place re-binds the same thief.

The thin spot is the rival. Nothing is written onto the rival (no bond or hostility edge), so the persistence does not surface unless a later encounter casts a `hired_thief` there. Every other write is read by a named system and visible to the player. **connected.**

**Carried caveats (engine-wide, not package defects):**
- A 5% harm-table swap on the PRIZE makes the "paid {actor} from inside it" sentence wrong on those runs, while the PRIZE chip stays honest. bell-at-the-exchange and drowned-mans-testimony carry the same exposure.
- success_at_cost has no band-keyed write. That is accepted in the final's § 9.

## Changes applied

None. No fold, no bind, and nothing edited in `pawnbrokers-strongroom-final.md`.

PACKAGE PASS
