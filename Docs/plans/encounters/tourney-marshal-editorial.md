# Encounter Pipeline: The Tourney Marshal
> Scale: short | Slug: tourney-marshal | Pass: editorial (cold critic, master-everyday-2 slot 4)
> Date: 2026-10-14 | Pipeline version: 2.0
> Judged: `tourney-marshal.package.json` (what ships), against `master-everyday-2-brief.md` slot 4.

## Verdict: PASS WITH REVISIONS

The design is sound and the brief row is honoured. The defects were all of one class, the one the author flagged: **pages and step lines that read true on one route in and false on another.** Eight lines fixed in the package. No REVISE trigger survives.

## Brief row check (slot 4)

| Row | Brief | Package | |
|---|---|---|---|
| id | `encounter.town.tourney_marshal` | same | ✓ |
| reach | iron | iron | ✓ |
| steps | iron 0.76 → iron 0.80 | iron 0.76 (`continue_weakened`) → iron 0.80 (`fail_action`) | ✓ inside 0.72–0.85, mean 0.78 |
| shape | danger → confrontation → aftermath | same, linear | ✓ |
| settings | `urban` | `["urban"]`, one opening | ✓ |
| rarity / scale / tier | 2 / local / shaping | 2 / local / shaping | ✓ |
| hand | `condition` + `secret` | `condition_attachment trait.condition.wounded` on `$cast:heir` (step 1 failure); `favor_creation` debtor `$cast:heir` (step 1 success). Festival on `$here` is an extra write | ✓ both families wired in context |
| opposition | faction (doctrine) | the order's yield doctrine, voiced by its champion | ✓ |
| cool failure | no kill / jail / brand of the mortal; name before purse | the noble is maimed or nearly killed; the town thinks less of its marshal | ✓ |
| `apply_condition` on `$actor` | at most two slots | none | ✓ |
| over-exposed cards | no `card.boost.core` special etc. | no listed card authored | ✓ |

## Route map — every way into every page

Aftermath bands key on the **final action outcome** (`applyAftermathOutcomeBand`), and `computeFinalActionOutcome` turns any continued step-0 failure into `success_at_cost`. A step-0 `critical_failure` ends the action (`advanceStep`). So:

| Page | Routes in | Step writes that fire |
|---|---|---|
| critical_success | S0 cs + S1 cs/s · S0 s + S1 cs | S1 success: favour, Festival, town +0.06 |
| success | S0 s + S1 s | same |
| success_at_cost | S1 sac or near_miss (S0 cs/s) · S0 near_miss / sac / **failure** + S1 cs/s/sac/nm | S1 success (+ S0 failure's −0.02 town, −0.04/−0.05 heir on the failure route) |
| failure | any S0 except cf + S1 failure | S1 failure: Wounded heir, heir −0.10/−0.12, town −0.06 |
| critical_failure | **S0 cf** (action ends) · S1 cf | S0 failure writes, or S1 failure writes |

## Page read (§ 6b), after the fixes

**critical_success** — *The order and {cast:heir}'s house both agreed before the whole field that the bout was ended, and both fighters walked out of the lists.* · BOND a favour owed: {cast:heir} owes {actor} a favour now. · BOON Festival: {location} keeps the tourney's last day as a feast. · BOON reputation with {location}: {location} thinks well of {actor} now. > Give the order its honour > Call the bout a draw.
Before the fix the overview said both sides "accepted the marshal's ruling" — and then the two reactions offered the player the ruling. **Conflict** (fixed: the overview now states that the bout ended, the reactions choose how it is announced). Clean on all three routes.

**success** — *{cast:heir}'s house carried the young noble home on a litter, bruised and alive. The order's knights rode out of {location} by evening.* Same three chips, same reactions. One route. Clean.

**success_at_cost** — *The bout is ended and {cast:heir} is alive, but it came closer to a killing than a marshal should allow. The order's knights left the field that evening without a word to {actor}.* Same three chips.
Before the fix: *"{actor} walked out of the lists with a cut hand, while the order's knights told the crowd the marshal had broken their doctrine."* The cut hand happens only on the S1-sac route; on S0-failure + S1-success nobody cuts the marshal. And on S0-cost + S1-critical_success the step-1 afterimage has just said *the order agreed before the whole field to call the bout ended* — the overview then had the order denouncing it. **Conflict on four of five routes** (fixed). The town-regard gain chip stays true on the S0-failure route (net +0.04).

**failure** — *The heralds closed the lists, and the order rode out of {location} calling the bout won. The town made {actor} marshal to stop exactly this.* · SCAR Wounded: {cast:heir} is Wounded from the bout. · SCAR reputation with {location}: thinks less. · BOND reputation with {target} ($cast:heir): trusts less. > Carry the young noble to the healers > Ask the champion about the doctrine.
Before the fix: *"The young noble lives, but will not walk without a stick again."* Two defects: it **repeats** the Wounded chip in other words (trigger 35), and it promises a permanent limp while the engine writes `trait.condition.wounded`, which expires after `CONDITION_WOUNDED_DURATION` (24 ticks) — a later-world claim nothing enacts (trigger 34). Fixed.

**critical_failure** — *{cast:heir} was carried off the field more dead than alive. The young noble's house told the whole town that its marshal could not keep the lists.* · SCAR reputation with {location} · BOND heir trusts less. Both chips are backed on both routes (S0 failure −0.02 / −0.04 heir; S1 failure −0.06 / −0.10 heir). Wounded is correctly not chipped (no Wounded write on the S0-cf route). Clean on both routes — but the S1 cf afterimage that leads into it read *"the young noble was carried off the field more dead than alive"*, the overview's own clause one line earlier: a **seam echo** (trigger 22). Fixed in the afterimage.

## Step lines read against every route

- **Step-1 spine** said the champion *"faces {actor} across the barrier"*. After a step-0 success the marshal is already *between the fighters*, inside the lists. Now *"in the middle of the lists"* — true after every step-0 band.
- **Step-0 failure afterimage** said the house's men *"got over the barrier"*; Stiffen The Barrier's failure fragment, shown on the same reveal, says the barrier held and they *ran round the end of it*. Now *"got into the lists"* — true either way.
- **Step-0 near_miss** had no afterimage, so it read the success line (*"turned both sides' men back from the barrier"*), and step 1 then showed the carryover *"A few of the house's men are still in the lists."* Added `nearMissAfterimage`: *"They got between the fighters, but not before a few of the house's men were over the barrier."*
- **Halt The Blade success_at_cost** said the sword *"came down hard on the guard {actor} raised"*; the step-0 cost afterimage says it came down *on {cast:heir}'s shield arm*. Now *"came down before {actor} could get fully under it."*

## Experience Differentiator Gate

1. YES — opening + step-0 spine: arrival, the bout and the refusal, the stake; 79 words, real names.
2. YES — every sentence is challenge, test or outcome; no interior sensation.
3. YES — the barrier, the raised sword, both sides' men, the champion and the marshal's word are all in prose before a card acts on them.
4. YES — "stop a grudge bout before the order's champion kills a young noble who will not yield".
4b. YES after fixes — the S1-cf afterimage → cf overview echo was the one seam hit.
5. YES — Stiffen The Barrier, Halt The Blade, Give The Word Weight, Dull The Sword Arm; no flavour quote; faces generic.
6. YES — effect lines state what the card does; all four specials essence-priced.
7. YES — every special carries a failure fragment; none is big-delta.
8. YES — each card's target is in the spine first.
9. YES — barrier (the crowd), swing (time), command (authority), arm (strength): four different questions.
9b. YES — two specials + deal 3 per step, composed 5; no step picks a branch.
10. YES.
11. YES — Wounded, Festival, a favour owed, reputation with {location}, reputation with {target} on `$cast:heir` (THR-1685's renderer fix, `reputationChipNamesPerson.test.tsx`, makes `{target}` read the heir). All sheet words.
11b. YES after the four page fixes above.
12. YES — two reactions on every band.
13. YES — honour the order vs. call a draw (whose dignity the marshal protects); stay with the house vs. learn the doctrine (mercy vs. knowledge).
14. YES — revised file § 7 Images uses the emotion → image method.

## Dilemma energy

Real. The success-side reactions make the marshal choose which party pays for the peace, and the `bond_change` writes make that choice persist with both cast members.

## Fix-list (all applied to the package)

1. Step-1 spine: "across the barrier" → "in the middle of the lists" (route truth after step-0 success).
2. Step-0 `failureAfterimage`: "got over the barrier" → "got into the lists" (conflict with Stiffen The Barrier failure).
3. Step-0 `nearMissAfterimage` added (near_miss read the success line against the carryover).
4. Halt The Blade `success_at_cost` fragment rewritten (conflict with the step-0 cost afterimage).
5. Step-1 `criticalFailureAfterimage` rewritten (seam echo with the critical_failure overview).
6. critical_success overview rewritten (pre-empted the reactions).
7. success_at_cost overview rewritten route-neutral (cut hand and the order's denunciation were single-route facts).
8. failure overview rewritten (permanent limp vs a 24-tick condition; paraphrase of the Wounded chip).

Consider (not applied): the step-0 critical_success afterimage and Stiffen The Barrier's critical_success fragment both say the men came back off the barrier. Base text must stand alone, so the overlap is tolerable.
