# Brainstorm companion — A held town is a faction position (THR-1448)

*Companion to `2026-09-21-thr-1448-held-town-faction-position.md`. Alternatives, tensions, Vision premises.*

## Alternatives considered

**Which faction.** (a) The holder's own guild — rejected: a guild is not landed and a town is not its business. (b) The culture seated there — reduces to the Realm, since Realm definitions are per culture. (c) **The Realm whose ground the town sits on** — chosen, standing-first then ground, mirroring `resolveMetaFactionDefId` so the two never disagree. (d) A faction minted by the hold — rejected: one-member factions flood every `member_of` reader, the network, and succession.

**What the standing is.** A `positionOf` property on the `controls` edge; a field on `StrategicControlState`; a new node — all rejected as a second authority over standing. A **reading** plus the one write the machinery already understands (`member_of` via `joinFaction`) is the additive shape. Writing `rank` directly was rejected outright: it is a derived cache with disagreeing writers.

**How encounters gate.** A `FACTION_ENCOUNTER_META` column — rejected because `minRank` is required on every row and an optional sibling is absent everywhere by default. A template field read where the other standing gates live, failing open like them — chosen.

**How the board reads it.** A desire term — rejected (axiological, shared with encounters). A bridge constant — rejected (THR-1301). A `divisionRule` exception — rejected: it would be the rule's first non-derived input and changes supply rather than ranking. A temperament term keyed on the candidate's object — chosen; it discriminates by construction.

**What ends it.** Retire the membership on collapse — rejected as a bespoke expulsion path; reputation decay already exists and a court remembers.

## Tensions surfaced

- **Vacuity is the failure mode.** The last two board terms measured identical at every quartile. The Done-when measures spread rather than asserting presence.
- **Two words for "position".** The UL's *Court Position* is the divine court. The player word here is the ladder's *subject*; *position* survives only as a trace member.
- **A stance never moves the border.** The realm projection's contract pins it. The plan reads the projection and writes nothing to `controls`, so the political map is untouched by a mortal's hold — a keeper keeps a town *for* a Realm that already claims the ground.
- **The hold has no words today.** The UI pillar's actual work is the sheet line; everything else the player could see of a hold is a marker opacity.
- **Membership outliving the hold** makes the ladder climbable by a keeper who later loses the town — deliberate; standing is a social fact.

## Vision premises invoked

- `00-north-star.md` — witnessed consequence: the court reacts to what a mortal built.
- `02-non-negotiables.md` #1 — sovereignty is exercised by the mortal; the god appoints nobody.
- `02-non-negotiables.md` #3 — the grip is a word, never a number.
