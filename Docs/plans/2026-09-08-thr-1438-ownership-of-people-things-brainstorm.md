# Brainstorm — the ownership of people-things (THR-1438)

*Companion to `2026-09-08-thr-1438-ownership-of-people-things.md`. What was weighed, in the order it came up, 2026-09-08.*

**The question.** Seven cells were decided on THR-1397 in one line each. What operations do they need, and what already exists?

**Command is written in four places and changed in one.** `commanded_by` is set at formation, at army spawn (twice) and by one graph op; only `promoteNewLeader` in the dissolution sweep *changes* it — silently, to the longest-serving survivor. That is a leak dressed as succession: a captain dies and the company has a new captain the same tick, nobody chose. One writer for a command *change* (`setCommander`) lets the sweep and the two claim cells agree, and lets a commander's death become a vacancy a mortal can claim. Rejected: a new `command_changed` trace category — four registration sites for a fact `strategic_world_change` already carries.

**"Leaderless" does not exist for a faction with members.** `getFactionLeaderId` derives a leader from `member_of.rank`; Christian's line for the candidacy — "gated on the faction having no living leader" — would make the cell unreachable by construction. The reading that keeps his intent (a candidacy, not a coronation; the phase stays the one arbiter) is *unseated*: no `leads` edge. That is the world's ordinary state, and an anointment or a candidacy is exactly what changes it. Rejected: seating the candidate immediately when no `leads` edge exists — a coup by paperwork, and it races the phase.

**Ownership rules bend per verb, on the type.** `OWNERSHIP_BY_VERB` says claim = unowned; a faction always has a derived holder. Rather than special-casing factions in the walk, the type declares `ownershipOverride` for that one verb and an `eligibility` hook — the same shape THR-1436 gave the cure (`gateExemption`), so the pattern stays one pattern.

**A dead commander's company should read unowned.** `ownersOf` returning only a living commander is the smallest change that makes claim × Company / Army mean something, and it is also what the CLI `objects` readout should say.

**The coup and the usurpation are decided by the band.** The resolver already passes the band the work landed on. Three arms from what exists (a seat moving, a grudge with a standing loss, the schism op) is Christian's line verbatim; the blade never enters.

**Grudges here are injuries.** `old_quarrel` (THR-1437) stays out of `GRUDGE_PROVENANCE` because a seeded rivalry harmed nobody. A seized command and a failed usurpation harmed someone; they go in, and the plot may follow.

**Rejected:** a `company` observe cell (the group is watched through its members and its Location already); a faction *claim* that removes the derived leader; killing the deposed (the plot's, THR-1430); a new node type for a candidacy (the `will_succeed` edge is the candidacy).
