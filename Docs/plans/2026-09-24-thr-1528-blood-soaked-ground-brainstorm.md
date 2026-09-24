# Brainstorm — Blood-soaked ground (THR-1528)

Companion to `2026-09-24-thr-1528-blood-soaked-ground.md`.

## The question

Two plans promised *blood-soaked* and neither could keep it: traits wave 2 (battles) and the Physical Conflict charter (lairs, via fights). What honest record can the word be minted from, and how does it stay cheap?

## What the research found first

- **A battle leaves no record today.** The aftermath overwrites a settlement's prosperity and subtype and writes nothing about the battle. A field battle writes nothing to its ground at all. The battle node is removed on resolution.
- **A won siege deletes the town** (the settlement is stored as the "defender army" and disbanded). Filed as THR-1563 and merged the same morning (PR #2000); it blocked this plan, because the record's place would have vanished.
- **War news is built from debug traces**, which are off in normal play (THR-1564). So a battle is currently invisible to the player twice over.
- **Events are never pruned, and there is no per-place index.** Walking a place's `occurred_at` edges every tick would grow with all encounter history.
- **A fight's own state is short-lived** (resolved actions are pruned after 20 ticks), and its per-step `encounter_outcome` nodes can't be told apart from other encounters.

## Options considered

| Option | For | Against | Verdict |
|---|---|---|---|
| Mint from `deathCount` | no new record | calls a plague a massacre; the ticket's falsifier forbids it | rejected (as wave 2 did) |
| A counter property on the place (`battlesFought += 1`) | cheapest | no history, no names, no memory line, no way to age out honestly | rejected: a number is not a record |
| **An `event` node per battle and per fight, plus a last-tick stamp on the place** | a real record the place memory can read; ages out by window; the stamp keeps the rule O(1) off the battlefield | two event types, one small writer each | **chosen** |
| Count the per-step `encounter_outcome` nodes of fights | no new writer | up to four per fight; indistinguishable from other encounters; no-roll ends write one | rejected |
| A new `battle` world-object kind | first-class | the battle is transient by design; what persists is what *happened*, which is exactly an Event | rejected |

## Tensions

- **Loud or quiet?** The other minted traits whisper (event log, 0.4). This one reaches the chronicle (0.85), because a battle is otherwise invisible today (THR-1564) and battles are rare. Revisit once THR-1564 surfaces war news.
- **What it does to the roll.** An Iron bonus is tempting ("violence comes easier") but it is a feedback loop: a lair's fights would feed its own trait. The road (avoided) and the pool (loss, fear, violence) are the honest readers.
- **Window vs sustain.** The shared 36-tick sustain stops words flickering. Here the input is already a ten-day window, so the word appears on the day and lifts ten days after the last bloodshed.

## Vision premises touched

- `00-north-star.md:43`, "a story the player can tell in prose": the place remembers the siege by name.
- `00-north-star.md:57`, "consequences that do not reverse": the record is permanent; only the word fades.
- `02-non-negotiables.md`: narrative over mechanics; the word waited for an honest source.

## Found while researching, filed or folded

- THR-1563: a won siege deletes the town. Merged 2026-09-24.
- THR-1566: a killed commander is deleted rather than marked dead, which loses grief routing (THR-1536). Filed separately, because THR-1563 was already claimed when this was found. The record writes a fallen commander's edge whenever the node survives, so it needs no change when THR-1566 lands.
- **Mutual destruction is told as a defender win** inside `applyAftermath` (`isAttackerVictory` is false). The record reads `resolutionType` instead, so it never repeats that. The aftermath's own handling (it disbands the attacker and leaves the zero-cohesion defender standing) is noted, not filed: no run has shown it cost anything yet.
- THR-1564: war news is read from traces.
