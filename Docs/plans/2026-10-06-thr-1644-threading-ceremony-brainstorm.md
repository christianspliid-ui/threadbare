# Brainstorm companion — Threading as character creation (THR-1644)

Companion to [`2026-10-06-thr-1644-threading-ceremony.md`](2026-10-06-thr-1644-threading-ceremony.md). Written by the design lane, 2026-10-06, unattended. Holds the alternatives and tensions behind the plan's six decisions.

## Vision premises in play

- **The player is a god, not a protagonist.** Character creation in a god game cannot mean *building* a person stat by stat. The meeting already found the answer: you lean, fate decides how cleanly. Any ceremony on later threads must keep that grammar, which is why the rite reuses the meeting's resolvers instead of a picker.
- **The thread runs both ways.** A ceremony that ends with the god's verdict and no mortal reply would break the two-way premise. The bond reception (*awe · devotion · bargain · doubt · defiance*) is the mortal's reply; every rite ends on one.
- **Stellaris clock.** Every rite halts the world. Ceremony weight × thread frequency is the real cost.

## The question tree, decided against evidence

1. **Should later threads get any ceremony?** Yes. Christian's sentence; and the playtest says the bonding scenes are the best thing the game has. The cost of a toast-only thread is that the best moment happens once.
2. **How much ceremony per thread?**
   - *Same rite every time* — maximal character creation; but with no cap on threads and a 10-essence card, a player threading six mortals halts the world for six four-beat scenes. PC-5 (piled-up interruptions) is an open complaint class. Rejected.
   - *Shrinking ladder* (chosen) — full, then one test + bond, then bond only. The First stays "first and richest" (THR-1605 ruling), later threads still get a told moment and a reception.
   - *Rite only for the First* — today's behaviour; fails the direction.
   - *Player chooses depth* — adds a menu before a ceremony; more UI for a choice nobody asked for.
3. **Who is The First?** Christian: "simply your first threaded agent". Either (a) keep the meeting as the only route, or (b) whoever is threaded first. (b) is the literal reading, and every First perk keys on `courtPosition`, so (b) costs one resolution at the thread write. Chosen (b).
4. **Real mortals in the meeting?** The ticket asks it. Tension: real mortals tie the First into the living world (the THR-1589 map's goal); invented souls carry authored vignettes at the prose quality bar. The playtest praised the invented-soul scenes specifically. Since (3b) already lets a player make a real mortal their First, the meeting can stay the authored path. Kept invented. Veto word recorded.
5. **What are "protagonist-leaning traits"?** Investigated: no protagonist flag exists; spotlight is guaranteed for threaded mortals. Options:
   - a hidden importance bump — invisible, and already moot;
   - a "Fated" destiny trait that biases ambition pulls — ambition pulls target non-spotlight mortals, so it would do nothing for a threaded one;
   - **a god's mark: one blessing in the spark's reach** (chosen) — the eight `GOD_GIVEN_TRAITS` were written for exactly this and never wired; competence in their own reach means more successes, so more chapters land, so the story runs longer. It is also the first thing on the sheet that says *this one is yours*.
6. **Can the player leave a rite?** Must be able to. Wording avoids "Let fate decide" (THR-1714 showed testers read it as *skip*).

## Tensions left open (for the executor or a later round)

- The rite rolls against the meeting's stand-in actor, so a master smith's rite is as uncertain as a child's. Chosen for learnability; a later round may want the real capability.
- `RITE_EXISTING_MORTAL_SHIFT_SCALE = 0.5` is a guess at "bends, not writes". The values sheet will show whether half a meeting shift reads as a change.
- Bond reception on non-First threads is written and shown, but nothing *reads* it mechanically yet (true for the First too). A future ticket could let *defiance* matter.

## Rejected outright

- A new "character creation" screen for threads (point-buy on mortals) — collides with god-not-protagonist.
- New node types for rites — not needed; a rite is a moment, its residue lives on existing nodes and edges.
