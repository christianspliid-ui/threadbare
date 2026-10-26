# Brainstorm companion — a bounty is collected in a duel (THR-2072)

Companion to [the plan](2026-10-26-thr-2072-bounty-collected-in-a-duel.md). Design lane, run 2026-10-26f.

## The question

A faction's Issue Bounty posts a price on a mortal and spends 12 coin. Nothing ever collects it. Who collects a bounty, how, what they get, and what happens to a price nobody collects?

## Alternatives considered

**How a bounty is collected.**

- *Bind the three bounty scenes* (`fa.bounty_hunt`, `ag.senior.bounty_hunt`, `mc.quest.collect_bounty`) to an open bounty and its target. Rejected: they are drawn about once a month per world (census), they are single-roller scenes whose quarry is prose with no cast slot, and making each one find and fight a real mortal is three rewrites. Most bounties would still go uncollected.
- *A "hunt a mortal" undertaking* (the monster hunt's shape, `cell.destroy.monster`). Rejected for this slice: a long undertaking aimed at killing a named mortal sits next to the plot's commissioned killing, and choosing between those two is a bigger design than paying a bounty. Death would also become the goal, not one of the duel's endings.
- **A duel started the way a grudge boils over (chosen).** The grudge trigger already walks every pair who share a place, with busy rules, cooldowns, an actor rule for threaded mortals and its own seeded stream. A bounty is a second reason to fight. The duel already decides death through the victor's nature, so the bounty adds no kill rule.

**Who hunts.**

- *Only mortals who make choices.* Rejected: they share a place with a target for 1–4 bounties a month per world, so almost every bounty would lapse. That would keep Law 45 broken in practice.
- *Mercenaries and the Adventuring Guild too.* Deferred: their scenes already talk about bounties, but a hunter from outside the issuing faction needs a reason to know about the bounty (a board, a rumour). The faction's own people already know.
- **The issuing faction's own members, seen or unseen (chosen).** A bounty's target is almost always an excommunicated former member, so the guild's people live beside them: the census found a member sharing their place for 11–30 bounties a month per world.

**How often.** The grudge trigger's 0.05 base would give 9–24 bounty duels a month per world, enough to make bounties most of the world's fights (fights of any kind ended 0–2 times a month in the census). 0.02 gives 6–15. That is visible in a month but does not fill the chronicle.

**The pay.** One Means step, the commission's scale (THR-2042 decision 2). The posted coin is 10 held + 2 outlay; the held 10 is paid out or refunded. A larger pay would make bounty work outrank every other way a mortal earns.

## Tensions

- **Unseen hunters collecting coin they cannot hold.** Same as THR-2042: the coin leaves the world as an off-screen hunter's pay. The alternative, refunding it, would make an unseen collection free for the faction, which reads wrong.
- **Fights between unseen mortals.** Bounty duels mostly happen between two mortals the player is not following. Law 15 already keeps those quiet: they reach the chronicle and the event log, not an interrupt.
- **A threaded target.** If The First is cast out and hunted, the player must be able to help. The grudge actor rule makes the threaded side the actor; the bounty needs a second template so the lines read from the hunted side.

## Vision premises invoked

- `Vision/01-core-loop.md`: consequences compound (a collected bounty leaves a scar, a grudge or a death).
- `Vision/02-non-negotiables.md`: mechanics surface through prose; the graph is the one substrate (`collected` is an edge).
- `Vision/03-design-tensions.md`: death stays rare and caused.
