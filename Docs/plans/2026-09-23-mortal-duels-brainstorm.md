> **title:** Brainstorm companion — mortal duels (Physical Conflict plan doc 5)
> **companion_to:** `Docs/plans/2026-09-23-mortal-duels.md`
> **created:** 2026-09-23

# Brainstorm companion — mortal duels

The route is on the closed Physical Conflict map (THR-1258), in decision tickets THR-1264, THR-1267 and THR-1266.

## How the second fighter rolls
| Considered | Verdict |
|---|---|
| Contestation's paired actions (`detectContestations`) | Rejected: binary outcomes; four of six bands lost (R4 §3). |
| Two independent fights, one per side | Rejected: no shared clock logic; double-counts forks. |
| **A synthesized opponent step per exchange (bandOpposition pattern) on the six-band ladder** | **Chosen:** the pattern exists, it is transient (never stored), and both sides keep the full ladder. |

## The mortal clock
The duel sim (THR-1264) ran 40,000 duels per pairing:
- clock 3 → 45% of duels broke off with nothing decided;
- clock 2 → a champion beats a novice about half the time, the novice wins about 4% (7% with a grudge), and break-offs fall to about 13–22%.

Two clean blows deciding a duel also matches how duels read in fiction.

## Mercy
The victor decides, by their own `mercy_ruthlessness`, and the god's cards can lean their threaded mortal. Alternatives rejected:
- **the loser's plea:** that is the concession fork, which already exists;
- **a fixed kill chance:** it would erase who the victor is.

## Grudges that boil over
Only **injury-class** grudges trigger duels. `old_quarrel` licenses rivalry, not blood (the THR-1438 distinction). The chance scales with the aggressor's courage, clamped, with a pair cooldown, so a feud flares rather than burns every tick. Road ambushes and assassinations stay in the v2 layer.

## Converting the old duels
The courtyard and renowned duels are the game's only duel content, and their authors wrote real stakes. The conversion keeps every prose string and replaces only the single-roller dice.

## Vision premises touched
Relationships become stories; the god is not the protagonist; emergence (grudges) balanced by authored moments (the two converted duels).

## Revisions during review (2026-09-23, intent-judge run 1)

- **Converting the authored duels (E4) was descoped.** `the-courtyard-duel` and `the-renowned-duel` are god-choice branching scenes with variants that contain no fight, support-NPC duellists, and a practice-blade bout. A 25% ruthless kill in a recognition bout would be wrong. Converting them, and `social.challenge_duel`, `encounter.honor_duel` and `encounter.arcane_duel`, is its own design. The systemic grudge duel stands alone in v1.
- **Who acts in a grudge duel.** Grudges are written both ways, so "the grudge-holder" picked nobody. The god's own mortal is the actor whenever one side is threaded, because only the actor gets the hand, the veil and The First's harm floor. Otherwise courage decides.
- **The opponent side.** Rather than a thinner opponent, the synthesized roll runs the same `resolveFightStepInputs` with the opponent as the actor. Its items, conditions, events and clock mailbox work as the fighter's do, which carries spell-readiness to both sides. Complications stay on the actor's step, to keep one event draw per exchange.
- **Mercy only over the beaten.** A yielding or fleeing loser is never finished. The victor's mercy decides only when a clock filled or someone was struck down, which keeps plan doc 1's "only struck down can kill".
