# Encounter Pipeline: The Hill Conduit
> Scale: medium | Slug: hill-conduit | Pass: editorial (cold critic, THR-1757 master batch 2, slot 7)
> Date: 2026-10-14 | Pipeline version: 2.0
> Judged: `hill-conduit.package.json` (what ships), against `hill-conduit-revised.md` and the brief's slot-7 row.

## Verdict: **PASS WITH REVISIONS**

The encounter is sound: a plain stone job, a fork on Stone's own axis that the mortal decides, two distinct arms, and a cool failure that costs the master their name. One structural defect (the pre-fork critical-failure pages), two seam echoes, one interior caption and one rule-34 promise. All fixed in the package. No REVISE trigger remains.

## 0. Brief row check (slot 7)

| Field | Brief | Package | |
|---|---|---|---|
| id | `encounter.town.hill_conduit` | same | ✓ |
| reach | stone | stone | ✓ |
| steps | stone 0.76 → stone 0.82 | 0.76 → cut 0.82 / long 0.78 | ✓ all in 0.72–0.85 |
| shape | opt-in complication | survey + agent-decided fork; the decline arm (round the pasture) is legible and risks less | ✓ |
| settings | rural, urban | rural, urban, one opening each | ✓ |
| rarity / scale / tier | 2 / local / shaping | 2 / local / shaping | ✓ |
| consequence hand | condition + drive | condition: `condition_attachment` Inspired on `$actor` (every success side). drive: `assign_ambition ambition_great_work` (success) / `plant_compulsion {build}` (failure) | ✓ wired in context, gate recomputes it green |
| opposition | herd + herdsmen guarding pasture, no monster gate | herdsman Hob Fenner, the herd and a bull; no gate | ✓ |
| `apply_condition` on `$actor` | ≤2 across batch | none (Plague Scare is on `$here`) | ✓ |
| ends warm on success | yes | Inspired + the ambition + "the sick children are mending" | ✓ |

## 1. Prose Quality

Narrator mode holds throughout: openings of one sentence, a spine that states the foul wells, the sick children, the springs, the guarded pasture and the ask. No interior sensation, no camera work. Weak spots, all rewritten in the package:

- **Seam echo, opening → spine.** "…comes by farm track to {location}…" then "The wells of {location} have gone foul". `[EDITORIAL REWRITE]` spine: "The wells have gone foul, and two children are sick from the water."
- **Echo inside the long-arm paragraph.** "…takes the long line round its edge. On the long line the hill falls only a little." `[EDITORIAL REWRITE]` "There the hill falls only a little."
- **Interior caption.** The Inspired chip read "Seeing the water run clean has lifted {actor}'s spirits" (a feeling rendered from inside). `[EDITORIAL REWRITE]` "Bringing the water down has left {actor} Inspired." States the condition.

## 2. Branch Seduction Audit — fork honesty

The fork is `decidedBy: { axis: 'preservation_transformation' }`; `motivations` names that same axis, so mortals who lean strongly either way are drawn. **The mortal decides; the player never picks.** The two step-0 specials (*Show The Straight Course*, mind, leans Shaper; *Mark The Boundary*, order, leans Guardian) are levers on the mortal's inner weather. Their effect lines describe a lean, never an order ("They lean toward cutting across the pasture"). The deal fill adds lean-neutral cards, so playing nothing leaves the mortal's own profile to choose. That is lawful under spec § Authoring order Q6.

- **Cut (Shaper, 0.82):** two children are sick and grass grows back. Why this mortal: they reshape the world to serve. What the god gets: a herd, a bull, a trench that must close before hooves find it (*Calm The Bull*, *Harden The Lining*). Protects the town's time.
- **Long (Guardian, 0.78):** the lord's grazing is not theirs to cut. What the god gets: a month of exact levels on a slight fall (*Quicken The Flow*, *Even The Levels*). Protects the herdsmen's living.
- Distinct in moral, dramatic, prose and aftermath terms (herdsman bonds only on the cut arm; town thanks only on the long arm). The decline arm is priced in the master band, which the brief allows and the doc block justifies.

## 3. Branch Count — **KEEP 2**. Both earn their place.

## 4. Scale Discipline — medium, 2 beats, 2 branches. ✓

## 5. Inspiration Anchor Honesty — `hook.underground_city` drifted to "ground the water must cross has its own keepers". Recorded and honest; the drift is the encounter.

## 6. Aftermath Payoff — actor-centred: the master's condition, ambition or compulsion; the town's trust; the reeve and the herdsman as named bonds. Lands.

## 6b. Page read (every band, as shipped after fixes)

Routes matter here. A step-0 `critical_failure` ends the action **after** the fork pole is recorded (`advanceStep`, `unifiedActionLifecycle.ts:218`), so the chosen arm's `critical_failure` page is read on **route A** (step 0 crit-failed, arm never ran) as well as **route J** (the arm crit-failed).

**Long arm — critical_success.** "The lord's pasture was never touched, and {location} has its spring water within the month." · BOON Inspired — "Bringing the water down has left {actor} Inspired." · PATH ambition — "{actor} is pursuing Build a Great Work now." > Teach The Upkeep · Accept The Thanks. Clean.

**Long — success.** "The work ran a month long, and the lord's grazing is whole. The sick children are mending." + same chips/reactions. Clean.

**Long — success_at_cost.** "{location} spent another week on its old wells, but the spring water runs now." + same. Clean.

**Long — failure.** "The long conduit runs, but what reaches {location} is no better than its wells. A master sent for by name is judged by whether the water came." · SCAR reputation — "{location} no longer trusts {actor} with its water." · SCAR Plague Scare — "Travellers now steer clear of {location} for fear of sickness." · SCAR compulsion — "For a while {actor} is drawn to building work over all else." > Cart The Water · Blame The Hill. The "judged" sentence and the trust chip are cause and effect, not one fact twice. Clean.

**Long — critical_failure (before fix): CONFLICT.** "{cast:reeve} has sent for another builder to dig the long conduit out." On route A no long conduit was ever laid. Its Plague Scare and compulsion chips had no write behind them on route A (Law 56). **REVISE trigger 35 (conflict) and dead chips. Fixed:** "No clean water came down to {location}, and {cast:reeve} has sent for another builder in {actor}'s place." · SCAR reputation (backed on both routes, see systems S1) > Cart The Water · Blame The Hill. Clean on both routes.

**Cut arm — critical_success.** "Clean water reached {location} within days, and the herdsmen have made their peace with the line under their grass." + BOON Inspired, PATH ambition > Pay For The Grazing · Teach The Upkeep. Clean.

**Cut — success.** "The sick children of {location} are mending, and the old wells are being filled in." Clean.

**Cut — success_at_cost.** "The water came down at last. The herdsmen cursed every day the trench lay open in their grass." Clean.

**Cut — failure.** "{location} still draws its water from the old wells. A master sent for by name is judged by whether the water came." + three SCARs > Cart The Water · Blame The Herdsmen. Clean.

**Cut — critical_failure (before fix): CONFLICT.** "No one was hurt. {location} has no water now but its old wells, and the springs are out of reach." "No one was hurt" and "out of reach" narrate the bull and the lord's ban, which never happened on route A. The reaction *Blame The Herdsmen* ("the herdsmen broke the work") is false on route A too. **Fixed:** "{location} still has only its foul wells, and {cast:reeve} has sent for another builder in {actor}'s place." · SCAR reputation > Cart The Water · **Blame The Pasture** ("…the lord's guarded pasture stood in the way…", herdsman −0.08). True on both routes.

**Fallback — critical_failure.** Was chipless. Now carries the reputation SCAR (step 0's write backs it) and Cart The Water, so the page is ready for the engine fix that will route route A here.

## 7. Dilemma Energy

Real. The cut arm is faster and harder and costs someone else's grass. The long arm is slower and spares the lord's ground. Both are defensible. The god's posture shows in which lean card it plays, or whether it plays one at all.

## 8. Experience Differentiator Gate

1 YES — one-sentence arrival per class, then the spine (≤80 words). 2 YES. 3 YES — springs, pasture, herd, bull, levels and trench are all named before the hand. 4 YES. 4b YES after E1/E2. 5 YES — verb + noun, 1–2 sentences, no quote. 6 YES — essence on every special. 7 YES — every special has ≥1 failure fragment; none is big-delta. 8 YES. 9 YES — lean vs lean, beast vs stone, water vs levels. 9b YES — 2 specials + `deal` count 4 on every nudge-bearing step; no step asks for a branch. 10 YES. 11 YES — Inspired, ambition, compulsion, Plague Scare, `reputation with {target}`: sheet words. 11b YES after E3/E4 (see § 6b). 12 YES. 13 YES — carry the cost (cart water) vs put the blame elsewhere; pay the herdsmen / teach the reeve / take the thanks. 14 YES — residue image (a well-head, a turned-earth line up the hill, no people).

## 9. Verdict — **PASS WITH REVISIONS**

## 10. Fix-list (all applied to `hill-conduit.package.json`)

1. **E1 (must)** — spine seam echo: "The wells of {location} have gone foul" → "The wells have gone foul".
2. **E2 (must)** — long-arm paragraph (variant + fallback step): "On the long line the hill falls only a little." → "There the hill falls only a little."
3. **E3 (must, trigger 35)** — both arms' `critical_failure` overviews rewritten true on route A and route J (text in § 6b).
4. **E4 (must, trigger 35)** — cut-arm `critical_failure` reaction *Blame The Herdsmen* → *Blame The Pasture* (`conduit.neg.critfail.blame_pasture`, same effects).
5. **E5 (must, rule 34)** — *Cart The Water* intent, every band: "stays to cart spring water down until the sickness passes" promised behaviour nothing enacts → "The mortal carts spring water down to {location} for the sick. {cast:reeve} thinks better of them."
6. **E6 (should)** — Inspired caption (12 chips): → "Bringing the water down has left {actor} Inspired."
7. Chip and backing changes on the `critical_failure` pages: see systems S1–S2.
