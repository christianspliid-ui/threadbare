# Brainstorm — Seed-only encounters (THR-1526)

Companion to `2026-09-24-thr-1526-seed-only-encounters.md`.

## The question

A sequel is an ordinary template, so the cache registers it wherever its envelope says, and the board can offer it to anyone. How do we keep a sequel that assumes its parent off the board, without breaking the seeds that must still find it?

## What the research settled first (the crux)

**Seeds never read the cache.**
- A `templateId` seed resolves through the template index.
- A `query` seed resolves through the content catalogs, then `eligibleAt`.
- The family fallback scans `UNIFIED_ACTION_TEMPLATES`.

So "off the board" and "reachable by seed" are separable, and no seed-side index is needed. Everything below builds on that.

## Options considered

| Option | For | Against | Verdict |
|---|---|---|---|
| **A template field** (`drawable?: false`) | declared on the template; readable by the gate; mirrors `drawableWhileBroken`; default preserves everything | a new field means a UL term and a canon paragraph | **chosen** |
| Empty `locationSubtypes` | no type change; the fight and hunt plans' spawn-only templates use it | fails envelope honesty and `check:encounter`; means "anywhere" to `eligibleAt`, the opposite of what the Reckoning needs | rejected |
| A content tag (`#seed_only`) | no type change | tags are query vocabulary; the canon forbids query semantics on the presentation axes; a tag nobody queries is noise | rejected |
| Remove the sequels from `LOCATION_BRANCHING` | no type change; the Apotheosis precedent | invisible on the template (how this leaked); removes the Reckoning from the query catalog, which breaks the missed branch | rejected |
| `reachableBy: ('board' \| 'seed')[]` (the ticket's sketch) | expresses board-only too | nothing needs board-only; "seed" undersells triggers and debug spawns, which also start these | simplified to a boolean |

**Naming.** "Seed-only" was the working name, but a non-drawable template is also started by triggers (M4's lair arrival), appointments and debug spawns. *Drawable* is the property the board reads, and the codebase already speaks it (`drawableWhileBroken`). The UL headword is **Drawable**.

## Tensions

- **Reachability vs truth.** Flagging the sequels makes them true and nearly unreachable, because their parent the Swindled Family is `wayside`-only (8 of 974 locations). Widening the Family's envelope keeps the chain alive. THR-1524 made the same trade for the Crossroads. It costs one authored line.
- **Gate strength.** A fatal "every seed target must declare `drawable`" gate would force about 100 board-true targets (faction quests, social, tavern) to declare `true`: churn with no truth gained. The gate is therefore the authoring rule for new sequels, plus a fatal pin on the four known ones, plus a warning for a flagged template nothing plants.

## Vision premises touched

- `00-north-star.md:31` and `:43`: the pleasure is witnessing, and a run ends in a story the player can tell. A story is only tellable if its causes happened, and a reckoning for a promise never made reports a past that did not happen.
- `02-non-negotiables.md` (narrative over mechanics): a consequence needs its cause.

## Found while researching, filed separately

- THR-1565: the Healer's seed into the Grateful Kin names the wrong family; the Swindled Family's self-seed replays the first meeting; `shrine_offering` plants an empty seed.
- THR-1567: the three other wayside-only templates (the Unsafe Bridge, Snow on the Pass, Riders Behind the Caravan) fire almost nowhere.
- (From the same research, fed into the Physical Conflict tickets) `fight.` and `hunt.` are not `encounter_template` prefixes, so the hunt's meeting and missed queries would resolve nothing. FB7 and H2 were amended.

## The ticket's third bullet, replaced

The ticket asked for a warning on any seed target reachable from the board with no board-facing opening. Research counted 138 literal seed sites over about 90 targets, almost all faction, social and tavern follow-ups whose openings stand alone by design. Whether an opening faces the board is prose semantics; no check can read it. The plan gates what can be mechanized instead:
- every appointment branch target is non-drawable (the case that can never be board-true);
- no query site may resolve a non-drawable template it does not plant (the path a future broad query would open);
- every `encounter.*` seed target in a cache-fed array must declare `drawable` one way or the other. `check:encounter` sweeps only `encounter.*`, where about ten targets qualify today, so this is cheap, and it catches the forgotten flag, which is the exact shape of two of the four shipped defects.

The authoring rule covers the faction, social and tavern follow-ups outside `encounter.*`.
