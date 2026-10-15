# Encounter Pipeline: The Bloodletting Hour
> Scale: medium | Slug: bloodletting-hour | Pass: revised
> Revisions applied: reaction choices on success-side bands (tradition_novelty fork); the canker shown in step-1 success-side afterimages; reputation chips, SAC and crit-fail overviews rewritten to clear page repetition/conflict; duplicate "won't wait" lines cut; almanac and fire introduced before their cards; Blunt/Warm effect lines de-bespoked; Fix The Sums and Warm The Chamber SAC fragments rewritten.
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 (THR-1840), slot 6

Template id: `encounter.town.bloodletting_hour` · reach star · rarityTier 2 · scale `local` · intrinsicTier `shaping` · settings `urban`.

## 0. Fixed game design (from the brief, binding)

| Field | Value |
|---|---|
| Shape | test & consequence — step 1 inherits step 0 (`carryoverFactorLines`) |
| Steps | star 0.74 (`continue_weakened`) → star 0.82 (`fail_action`); mean 0.78, window fit 0.92 |
| Opposition | faction (orders): the physicians' college bleeds a fever at once |
| Consequence hand | `knowledge` + `secret` — printed by `draw:consequences`: knowledge ∈ {intelligence, spawn_clue, sharpen_clue}; secret ∈ {hidden_mark, secret_discovery, favor_creation} |
| Swap | none |
| Cool failure | the master's name: the palace asks the physicians, not the master, when to bleed. The bishop lives on every band |
| Plot hook | rolled `hook.artifact_recovery`, `hook.shifting_shape`, `hook.relic_awakening`; taken **`hook.shifting_shape`** (the illness is not the shape it shows: a fever over a hidden canker) |
| Seed dice | p3 contest · opposition faction (orders) · disposition neutral · agentRole trespasser · scale region · setting stronghold → the bishop's palace (brief override) · system items (advisory, not wired) |

**Crux.** The bishop's physicians mean to bleed him at once, and his household has sent for {actor} to cast the figure that says when a bleeding is safe.

## 1. Inspiration Anchors

- **Ordeal archetype — the expert against the institution.** The master's art (the figure) against an institution's standing order (the college's "bleed a fever at once"). It gave the step-1 opposition its shape: not a villain, a college doing its duty too fast.
- **The zodiac man of the medieval almanac** (each sign rules a part of the body; never bleed a part while the moon is in its sign). It gave step 0 a concrete test (find the moon's sign and the hour it leaves) and kept the verb distinct from the star masters already on the board (a nativity, a feast calendar).
- **Hook `shifting_shape`**, drifted: the illness changes shape at the bedside. The household calls it a fever; the master, in the room, sees a canker the chapter was never told of. That is the `secret` hand.
- **Anti-patterns avoided:** the master as bystander (the master argues at the bedside); a lurid failure (nobody dies; the cost is the name); a rule gate (none).

## 2. Scale Justification

Medium: two beats (cast, then hold) with a curated aftermath. The bishop is a regional figure, but the encounter is one night in one palace; a third beat would pad the argument at the bedside.

## 3. Pressure Knot

The bishop has a fever. The physicians' college has its lancets out. By the art of the day, a bleeding at the wrong hour of the moon kills, and the college's senior physician does not want to wait for an astrologer. The household, which wants the bishop well by whichever art works, has sent for the master anyway.

## 4. Intervention Fantasy

The god works on the sky-reader's night and on the sickroom: brings the month's moonrises back to the master's memory, sets the almanac's columns straight, dulls the physician's blade, keeps the fire steady so the fever eases while the bleeding waits. None of it tells the master what to say.

## 5. Cast and World Objects

| Object | Role | Delivery |
|---|---|---|
| `{cast:physician}` — Anselm Crewe, senior physician of the college | the opposition at the bedside; carries the failure-side hidden mark | lazy-materialize, healer, must-persist |
| `{cast:bishop}` — Walter Hamond, the bishop | the patient; owes the favour on success | lazy-materialize, priest, must-persist |
| `$here` — the town | reputation channel ±0.06 / −0.03 | location |
| knowledge: "The bishop's hidden illness" | `intelligence` political_secret on `$actor` | step 1 success |
| favour | `favor_creation` debtor `$cast:bishop` | step 1 success |
| hidden mark | `hidden_mark` concealed_action on `$cast:physician` | step 1 failure |

## 6. Beat Structure

1. **Cast the figure** (star 0.74, `continue_weakened`). Find the moon's sign and the safe hour.
2. **Hold the hour** (star 0.82, `fail_action`). At the bedside, against the college. Inherits step 0 through carryover factor lines.

## 7. Branching Profile

Linear — no branching. Branch count 0. The test & consequence shape lives in the carryover.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opened |
|---|---|---|---|
| critical_success | bishop bled at the hour; fever broken by noon; the household will ask the master for every bleeding | — | reputation +; knowledge of the canker; the bishop owes a favour |
| success | bled at the hour; fever broke by evening | — | same three |
| success_at_cost | bled at the hour | the college has not forgiven the master for overruling it | same three |
| failure | the college bled him early; he is weaker | the palace asks the physicians now | reputation −; the physician carries a hidden mark |
| critical_failure | a wrong sum found in the master's figure; bled at once | the palace will not send for the master again | reputation − |

## 9b. Stakes Line

```
goal:      cast the figure and hold the physicians to its hour
risk:      have a wrong sum found in the figure at the bedside
won:       cast the figure and held the physicians to its hour
lost:      could not stop the physicians bleeding the bishop early
lostBadly: had a wrong sum found in the figure at the bedside
```

Description: *The bishop is ill and his physicians mean to bleed him at once, though a bleeding at the wrong hour of the moon can kill. Someone has to cast the figure for the bleeding and hold the physicians to the hour it gives.*

## 10. Sample Opening (urban)

> {actor} arrives at the bishop's palace in {location}, sent for by his household.
>
> The bishop, {cast:bishop}, has a fever, and his physicians mean to bleed him. By the art they all follow, a bleeding at the wrong hour of the moon kills. The senior physician, {cast:physician}, says the fever cannot wait for the stars.
>
> The household asks {actor} to cast the figure for the bleeding: the moon's sign and the safe hour, from the tables in their almanac.

Step 1 spine:

> {cast:physician} speaks for the physicians' college. He stands at the bishop's bed, by the fire, with the basin and the blade.
>
> The household will let {actor} argue the figure's hour at the bedside. The college bleeds a fever at once, and will bleed the bishop now unless {actor} holds them to it. A master who cannot hold a bedside loses the trust of {location}.

## 11. The Hand Per Step

**Step 0 — Cast the figure.** Deal `{ count: 3, tags: [lore, insight] }` + 2 specials = 5.

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Remember The Nights | Signature | time | 2 | 0.11 | Bring every moonrise of the past month back to their mind, so the moon's path through the signs is plain. |
| Fix The Sums | Signature | order | 1 | 0.08 | Set every number in their almanac in its right column, so nothing is carried wrong. |

Bands — Remember The Nights: crit "Every moonrise of the month came back to them in order, and the moon's next sign was plain." · success "The month's moonrises came back to them, and they set the moon's course without the almanac." · near_miss "…all but the two cloudy nights in the middle of the month." · failure "…but a month of moons could not tell them the hour."
Fix The Sums: success_at_cost "Every column added up, but they checked each one twice before they trusted it." · failure "…but the almanac's own figures were copied wrong." · critical_failure "Every column added up, and they trusted it, and never checked which sign they had started from."

**Step 1 — Hold the hour.** Deal `{ count: 3, tags: [social, presence] }` + 2 specials = 5.

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Blunt The Blade | Signature (opposes physician) | matter | 2 | 0.10 | Dull an edge in the room, so it will not open a vein until it is honed again. |
| Warm The Chamber | Signature | energy | 1 | 0.07 | Keep a fire high and steady through the night, so a fever eases while the sick wait. |

Bands — Blunt The Blade: crit "The edge would not open the vein, and by the time it was honed the hour had come." · success "The edge slid off the bishop's arm, and {cast:physician} sent for a whetstone." · near_miss "The edge would not cut, but a younger physician had his own ready." · failure "The edge was dull, and {cast:physician} honed it at the bedside in a few strokes."
Warm The Chamber: success_at_cost "The fire held all night and the bishop slept, but the physicians called the heat an astrologer's meddling." · failure "The fire held all night, but the bishop's fever did not ease." · critical_failure "The fire burned so high that the bishop woke soaked, and {cast:physician} said he could wait no longer."

## 12. Linear continuation (step 0 afterimages, then step 1)

Step 0: crit "They cast the figure to the quarter hour. The moon leaves the sign that rules the heart at dawn, and dawn is the hour to bleed." · success "The figure gives dawn tomorrow, when the moon leaves the sign that rules the heart." · sac "…but casting it took most of the night, and the bishop's fever rose while they worked." · failure "Their almanac's moon tables ended at midsummer, and the figure could say only that tonight is wrong." · crit fail "They set the moon in the wrong sign, and {cast:physician} saw the mistake on the figure before they did."

Carryover into step 1: crit "They can name the bleeding hour to the quarter." (+0.05) · success "Their figure gives the hour plainly." (+0.03) · sac "The fever rose while the figure was cast." (−0.02) · near_miss "Their figure gives the night, not the hour." (+0.01) · failure "Their figure says only when not to bleed." (−0.03).

Step 1 afterimages: crit "The physicians waited for dawn, the bishop was bled at the hour, and by noon his fever had broken. At the bedside {actor} saw a hard swelling under his ribs, and kept quiet about it." · success "The physicians waited for dawn, and the bishop was bled at the hour the figure gave. His fever broke by evening. At the bedside {actor} saw a hard swelling under his ribs, and kept quiet about it." · sac "The physicians waited for dawn, but {cast:physician} told the college that {actor} had overruled a physician at a sickbed. At the bedside {actor} saw a hard swelling under the bishop's ribs, and kept quiet about it." · failure "{cast:physician} bled the bishop at once, against the figure. The bishop is weaker, and the college says the astrologer only delayed them." · crit fail "{cast:physician} found a wrong sum in {actor}'s figure and read it out at the bedside. He bled the bishop at once, and the household believed him."

## 13. Aftermath Paragraph (by band)

- critical_success: "The bishop is sitting up, and the household will ask {actor} for the hour of every bleeding now."
- success: "The bishop's household trusts {actor}'s figure over the college's haste."
- success_at_cost: "The bishop was bled at the hour, but the physicians' college has not forgiven {actor} for overruling it."
- failure: "The college bled the bishop before the hour, and the palace now asks the physicians, not {actor}, when to bleed."
- critical_failure: "The household believes {actor} cast the figure wrong, and the palace will not send for them again."

## 14. Aftermath Reaction Choices

On critical_success, success and success_at_cost (ids `bleeding.{cs|s|sac}.*`). The fork is `tradition_novelty`: the master has just overruled a college at a bedside.

- **Make peace with the college** — "Grant the senior physician that his college's rule has saved lives before tonight. He thinks better of the mortal for it." Effects: `bond_change` with `$cast:physician` (sentiment +0.08, trust +0.04).
- **Stand by the art** — "Say plainly at the bedside that the stars rule a bleeding, not the college. The bishop trusts the mortal more, and the senior physician takes against them." Effects: `bond_change` with `$cast:bishop` (sentiment +0.06, trust +0.04); `bond_change` with `$cast:physician` (sentiment −0.1).

Failure bands carry no reactions; the scar is the whole page.

## 15. Aftermath Kit Summary

Success bands: BOND reputation with {location} ("Word from the palace." / "{location} thinks well of {actor}."; SAC: "still thinks well of") · BOND a favour owed ({cast:bishop}; "Kept his secret." / "{cast:bishop} owes {actor} a favour.") · BOON knowledge ("Under his ribs." / "The swelling is a canker his chapter has not been told of."). Failure: SCAR reputation with {location} ("Word from the palace." / "{location} thinks less of {actor}."). Critical failure: SCAR reputation with {location} ("Talk from the bedside." / "{location} thinks less of {actor}."). The physician's hidden mark is not chipped (hidden by design).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| physician | lazy-materialize-on-trigger | healer NPC (reuse) or spawn "Anselm Crewe" | must-persist | hidden mark (failure) | ready |
| bishop | lazy-materialize-on-trigger | spawn priest "Walter Hamond" | must-persist | owes_favor debtor | ready |

## 17. Self-Audit

- Envelope + opening per class: PASS (urban).
- Purpose lines ≤4 words: PASS ("Cast the figure", "Hold the hour").
- Hand 4–8, ≥4 spheres, ungated common from the deal: PASS (deal supplies; gate green).
- Every nudge ≥1 failure band; no Δ ≥ 0.15: PASS.
- Every StepOutcome band covered per step: PASS.
- No digits / odds-talk in effect lines; no name word repeated in its effect line: PASS.
- Consequence hand wired: knowledge (intelligence), secret (favor_creation + hidden_mark): PASS.
- Law 56 backing: every chip on a band whose step-1 effect fires: PASS; critical_failure carries only the reputation scar (backed by step-0 and step-1 failure effects).
- Gate: `node .cache/check-encounter-batch3.mjs --package …` → ✓ [systems: cast, rewards, reputation] OK.

## Concept Art Direction

Emotions: waiting against the clock; a quiet expert's authority; a secret kept. Image: an unlit bleeding basin and a folded lancet on a sill beside a parchment wheel of the zodiac man, dawn coming grey through the window. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES (two reactions on each success-side band) · 13 YES (deference to the institution vs the authority of one's own art) · 14 YES. Full evidence: `bloodletting-hour-editorial.md` § 8.
