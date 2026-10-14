# Encounter Pipeline: The Poisoned Feast
> Scale: short | Slug: poisoned-feast | Pass: editorial
> Date: 2026-10-14 | Pipeline version: 2.0 (v3 line, master-everyday-2 slot 1, THR-1757)
> Judged: `Docs/plans/encounters/poisoned-feast.package.json` (the package ships; the revised doc was read for intent). Cold critic, fixes applied directly to the package.

**Verdict: PASS WITH REVISIONS**

## Brief conformance (slot 1)

| Binding row | Package | |
|---|---|---|
| id | `encounter.town.poisoned_feast` | ✓ |
| reach | eye | ✓ |
| steps | eye 0.74 (`continue_weakened`) → eye 0.80 (`fail_action`), mean 0.77, inside 0.72–0.85 | ✓ |
| shape | seeded sequel (placeless) on Puzzle – Investigation – Resolution | ✓ |
| settings | `urban` | ✓ |
| rarity / scale / tier | 2 / `local` / `shaping` | ✓ |
| hand | `secret` (hidden_mark ×2, favor_creation) + `story_seed` (encounter_seed, `query #rival_strike`) | ✓ wired in context |
| cost channels | no Heavy Hand, no grant, trait card at 0, every other special essence-priced | ✓ |
| over-exposed cards | no `card.boost.core` special, no energy signature, no darkness undertow | ✓ |
| cool failure | no death, jail or brand; the name before the purse | ✓ |

## 1. Prose Quality

The scene is sound and plainly told: a guest at the high table, a poisoned cup that was theirs, a coroner who wants a reading, a double bind. Fixes:

1. **Why the guild-master drank from another's cup was left to inference** (trigger 29). "The guild-master drank from the cup poured for {actor}" makes the reader stop and ask how. `[EDITORIAL REWRITE]` P2: *"At the toast the guild-master drank from {actor}'s cup, fell, and has not woken. {cast:coroner}, the town coroner, has barred the doors."* Same word count; "at the toast" carries the mistake.
2. **Seam echo opening → spine** (trigger 22). P1 ends "held in the abbey refectory", P2 ended "barred the refectory doors". Now "barred the doors".
3. **Step-1 spine announced outcome mechanics** (trigger 25) *and* promised the wrong thing. "If {actor} names the one who did it, whoever paid … will hear … If no hand is named by dawn, {location} will go on thinking …" is a pass-X / fail-Y frame, and its first half was false: the seed fires on step-1 failure too. `[EDITORIAL REWRITE]`: *"Six guildsmen sat within reach of that cup, and one of them poisoned it. Whoever paid that guildsman will soon hear that {actor} is still alive. / {cast:coroner} gives the verdict at dawn. If no hand is named by then, {location} will take {actor} for the poisoner."* One fact (the payer will hear, true on both step-1 sides) and one cost (backed by the −0.06). "Within reach of that cup" also removes the "{actor}'s cup" echo across the step-0 afterimage → step-1 spine seam.
4. **The critical-success afterimage named the payer, and then every chip called them "whoever paid"** (trigger 35, conflict). *"…gave the name of the one who paid"* contradicts the PATH chip directly under it. `[EDITORIAL REWRITE]`: *"{cast:poisoner} broke down before the whole hall and confessed to being paid, but was too afraid to say by whom."* The patron stays unnamed, which is what the sequel needs.
5. **Near-miss carryover contradicted the near-miss afterimage.** A step-0 near miss renders the success afterimage ("rubbed inside {actor}'s cup before the wine was poured", i.e. the *when*), then step 1's factor line said "They know the poison, but not when it went in". Now *"They know the poison, but cannot yet prove it."* — consistent with Settle The Dregs' near-miss fragment ("too faint to show {cast:coroner}").
6. **Failure overview was hard to parse** (trigger 29). "The guild had a master at its table, and half the guild believes that master poured the cup" — with a guild-*master* on the page, "that master" reads as either man. Now *"{cast:coroner} closed the inquest with no hand named, and half the guild believes {actor} poured the cup."*

Band fragments read clean against their bases (checked every one appended to its base afterimage). Card faces are spell-shaped; specials name their targets, which is lawful for a special.

## 2. Branch Seduction Audit

Linear (branch count 0). No player-picked branch, no authored futures. The mortal's value axes (`revelation_discretion`, `mercy_ruthlessness`) are read through traits, not offered as a menu.

## 3. Branch Count Assessment

`KEEP 0`.

## 4. Scale Discipline Check

Short, two beats, compact `byOutcome` aftermath without reactions. Correct for short.

## 5. Inspiration Anchor Honesty

`hook.followed_on_the_road` genuinely shaped the back half (the sequel is people following the mortal). `hook.forbidden_knowledge_price` survives only thinly; honest about it.

## 6. Aftermath Payoff — and the sequel the player actually meets

Actor-centred: the master's own standing with the town, a named coroner's favour, and the patron's people coming. **The author's open question, judged:** the seed's only possible draw is The Hired Knives (`encounter.rival.hired_knives`), whose spine says *"Two strangers have followed {actor} for three days … A rival sent them, because a god's help was seen around {actor}."* The old chip promised *"Whoever paid for the poison has heard that {actor} lived"* and the old spine promised the payer would know the master *"knows"*. The sequel delivers strangers sent by an unnamed rival, never the feast, never the knowledge. So the old wording over-promised.

No better operand exists: `#rival_strike` has one member; no seed-only or drawable template in the corpus is a patron's second attempt (checked every `encounter_template` family in the tag catalog and every registered encounter name — the nearest, *Road Ambush* and *The Stranger Finds Them*, are a caravan fight and a crossroads debt). Authoring a new sequel is outside this slot's edit scope. **Fix taken: reword so the parent promises only what the family delivers.** The PATH chip now reads *"Whoever paid for the poison is sending their people after {actor}."*, both seed labels *"…knows {actor} lived, and sends their people."*, and the step-1 spine only that the payer will hear the mortal is alive. The family word itself is "a rival's people, sent for a mortal", so the promise holds for any future member too. The Hired Knives' own reason ("a god's help was seen") then reads as additive, not contradictory — the cup meant for the master missed and the master walked away. Residual seam recorded as a follow-up (see Revision Summary).

## 6b. Page read (each band, assembled)

**critical_success**
> {cast:coroner} ruled the guild-master poisoned by {cast:poisoner}, and the guild-master is awake and mending.
- BOND · reputation with {location} — {location} thinks well of {actor}.
- BOND · a favour owed — Spared a wrong ruling — {cast:coroner} owes {actor} a favour.
- PATH · seed — Whoever paid for the poison is sending their people after {actor}.

*Before:* the regard chip's cause "Named the right hand" retold the overview's ruling (repetition); the PATH chip said "whoever paid" under an afterimage that had just named the payer (conflict). Both fixed. Reads clean now.

**success**
> {cast:coroner} ruled that {cast:poisoner} poisoned the cup, and {actor} leaves the inquest cleared.
- BOND · reputation with {location} — {location} thinks well of {actor}.
- BOND · a favour owed — Spared a wrong ruling — {cast:coroner} owes {actor} a favour.
- PATH · seed — Whoever paid for the poison is sending their people after {actor}.

*Before:* "Named the right hand" paraphrased "ruled that {cast:poisoner} poisoned the cup" (repetition). Cause dropped. Clean.

**success_at_cost**
> {cast:coroner} ruled for {actor}, but the guild has not forgiven the master who named one of its own.
- BOND · reputation with {location} — {location} thinks well of {actor}.
- BOND · a favour owed — Spared a wrong ruling — {cast:coroner} owes {actor} a favour.
- PATH · seed — Whoever paid for the poison is sending their people after {actor}.

*Before:* "Named the right hand" ≈ "named one of its own" (repetition). Dropped. Town-thinks-well vs guild-has-not-forgiven is a contrast between two bodies, not a conflict.

**failure**
> {cast:coroner} closed the inquest with no hand named, and half the guild believes {actor} poured the cup.
- SCAR · reputation with {location} — {location} thinks less of {actor}.
- PATH · seed — Whoever paid for the poison is sending their people after {actor}.

*Before:* scar cause "No hand named" repeated the overview's "with no hand named" verbatim (repetition); overview ambiguous. Both fixed.

**critical_failure**
> {cast:coroner}'s record names {actor} as the likeliest hand, and the guild believes it.
- SCAR · reputation with {location} — Before the whole guild — {location} thinks less of {actor}.

Clean. True on both paths into the band (step-0 critical failure: the wrong cup named with the guests present; step-1 critical failure: the wrong guildsman named before five witnesses).

## 7. Dilemma Energy

The double bind is real and stated (shame the guild / stay suspected), and the cost of winning (the payer's people come) is the encounter's best idea. The hand offers distinct reads: physical evidence (dregs), testimony from the victim (rouse), witness memory (last hour), and the mortal's own anger (trait card).

## 8. Experience Differentiator Gate

1. Skeleton (arrival · situation · problem, ≤80 words, plain) — **YES** (gate counts under 80 after the rewrite).
2. Every sentence works, no interior sensation — **YES**.
3. Scene names what the hand acts on (cups, the stricken guild-master, the guests, the mortal's grudge) — **YES**.
4. Retellable after one read — **YES** (after fix 1).
4b. No seam echoes — **YES** (after fixes 2 and 3).
5. Spell-style faces, no flavor quote — **YES**.
6. Mechanism-stating effect lines, real prices — **YES** (three at 2 essence, trait card at 0).
7. Every card pays off in failure; no big-delta card — **YES**.
8. Every card grounded before the hand — **YES**.
9. Cards answer different questions — **YES**.
9b. Composed 4–8 on both steps, ≤2 specials + `deal` — **YES**.
10. Reflective aftermath landing — **YES**.
11. Actor-centred, character-sheet nouns (`reputation with {location}`, `a favour owed`, `seed`) — **YES**.
11b. Every band's page reads clean — **YES after the fixes above** (four repetitions and one conflict found and fixed).
12. Medium+ reactions — **N/A** (short).
13. Reactions as stances — **N/A** (short).
14. Concept art evocative (residue, absence: the abandoned table, one cup on its side) — **YES**.

## Triggers walked 1–35

All clear after fixes except as noted: 22 (seam echo) fixed; 25 (announced mechanics) fixed; 29 (unreadable compression, ×2) fixed; 35 (repetition ×4, conflict ×1) fixed; 34 / 7b — the step-1 spine's later-tense sentence ("will soon hear") is now enacted by the seed on every path that shows the spine; the seed is placeless and promises no place. 4 (reactions) not owed at short.

## Revision Summary

**Must fix (applied to the package):**
1. Step-0 P2 rewritten ("At the toast … {actor}'s cup"; "barred the doors").
2. Step-1 spine rewritten: no pass/fail frame; promises only that the payer hears the mortal is alive.
3. Step-1 critical-success afterimage: the poisoner confesses but will not name the payer.
4. Step-1 near-miss carryover line no longer contradicts the near-miss afterimage.
5. PATH chip (4 bands) and both seed labels reworded to promise only what `#rival_strike` delivers.
6. Regard / scar `causeClause`s that retold the overview removed (4 chips).
7. Failure overview rewritten for clarity.

**Should fix (follow-up, not this slot's scope):** the Hired Knives spine hard-codes its reason ("because a god's help was seen"). Either a reason-neutral line keyed on the planter, or a dedicated seed-only *patron's second attempt* sequel, would let this seed read as the poisoner's patron by name. Raise as a ticket.

**Consider:** the critical-success band differs from success only in its overview; a sharper crit prize (a larger favour, or the confession on the record) would make the tail worth rolling.
