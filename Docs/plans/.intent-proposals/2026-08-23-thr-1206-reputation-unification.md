# Action Proposal — Reputation unification (THR-1206)

## intent_quote

> i would rather that it be a reputation or another core game concept. custom concepts are difficult for players to learn and understand. if we do have reputation as our concept for "the social score that modifies interactions between a and b", then lets use that everywhere.

(Director, attended chat 2026-08-23, refining his THR-1205 bond-chip feedback. Earlier same session, the feedback this refines: *"here we want exact and understandable game effects like the one for boon heart below. for this particular bond to make sense, it has to unlock an effect, and the effect (good reputation in sacred grove) must be available on the character sheet but even more important, easily visible here."*)

The session directive to run this design now: *"ok go"* (2026-08-23, replying to "Say the word and I'll run that session now with THR-1206 in scope").

## scope (what this plan does)

Defines Reputation as the game's single player-facing concept for pairwise social standing: one read API (`getReputationWith`) dispatching over the existing stores (faction membership reputation, agent↔agent trust, world renown) plus one new sparse `reputation_with` edge family covering the two pairs no store holds (agent↔location, non-member agent↔faction); one banded word vocabulary (existing `getReputationWord`); three consumers shipping with the write (eligibility gate, social-scene leverage term, chip backing); migration of the Grateful Kin `standing_welcome` writes to the new edge (unblocking THR-1205's deferred chip wording and re-speccing THR-1182's gate); an authoring-time gate on the invalid-tally-key leak; UI rows on LocationProfileModal and the agent Overview tab plus a Law-13 fix on FactionSheet; a UL entry and a rulebook [DESIGN] paragraph. Two content sweeps (dead tally keys, mislabeled reputation chips) are chartered as deferral tickets with predicates, not done here.

## scope (what this plan does NOT do — explicit non-goals)

- No store migration of `member_of.reputation`, `relates_to`, `reputationScore`, or the tally→trait pipeline — they keep their machinery; the unification is read + vocabulary + the gap-filling edge (strangler ruling).
- No trade pricing or favor call-in mechanics — no hooks exist in the engine; both would be greenfield systems.
- No pairwise rework of `computeBondModifier` (named follow-up, tuning-class).
- No divine/ascendant reputation — standing belongs to mortals and communities; rival-god detection is a separate existing system.
- No new band table — bands come from the existing `getReputationWord`.
- The 154 dead tally writes and 18 mislabeled chips are swept by deferral tickets, not this ticket (predicates provided).

## impact_class

Reversible. (Design doc + handoff; execution adds an edge family and consumers additively, retirements are read-tolerant. No data loss path; saved worlds read defaults.)

## evidence cited

- **Linear issue:** THR-1206 (created from the director ruling this session; description carries the verbatim quote)
- **Vision premises invoked:** indirect influence / two-way thread, "every primitive is clickable" (rulebook quick-reference); player-legibility rulings THR-1154 (chips anchor real state), THR-1205 (exact effects, core vocabulary)
- **UL terms touched:** new entry **Reputation** (via `UL-proposal` issue at execution closeout); `STANDING` confirmed retired (Encounters.md:65); BOND definition untouched
- **Canon pages consulted:** `Docs/canon/design-governance.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md` (Reputation & Influence — ACTIVE), `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md` (faction reputation), THR-1157 map decisions (seam pattern, strangler ruling)
- **Rejected approaches considered and dismissed:** single-store big-bang (violates strangler + NFP #6); presentation-only rename (fails Law 56 — chip would claim unwritten state); `knows_of` edge reuse (awareness semantics ≠ standing); `member_of` extension to non-members (contradicts every reader). Full argument in the brainstorm companion.

## load-bearing decisions touched

- **"Relationships between entities are graph edges, not property fields"** — followed: the new pair-standing is an edge family; the plan explicitly rejects property-bag alternatives.
- **"No inventing node types without verification" / "New node types require full design before code"** — no new node type; the new *edge* family gets this full design (category, endpoints, properties, tick participation, traces) per the same discipline.
- **"Everything is a graph node/edge"** — followed.
- **"Agent position is a three-tier model"** — respected: sublocation write targets resolve to parent location.
- **"The world graph is mutated in place"** — decay/prune participates in existing touch/version discipline via the existing phase.

## high-impact files touched (from Codesight)

- `src/types/graph.ts` — 125 importers (EdgeType union, additive)
- `src/types/unifiedAction.ts` — 278 importers (effect kind + optional gate field, additive)

Plan doc carries the Blast Radius section.

## kill criteria

- If, at execution, the four-leg read dispatch turns out to produce contradictory answers for the same pair (e.g. a faction member with both a membership score and a stray edge), the dispatch order is wrong — fix order (membership wins) or Block the migration until ruled.
- If the Grateful Kin migration cannot make the chip truthfully say "reputation with Sacred Grove" end-to-end (write → read → chip → click-through), the design failed its originating case and goes back to In Design.
- If the director rejects "reputation" covering agent↔agent regard on sight (trust vs public standing), the read API's bond leg is removed and the edge family covers persons too — the shape survives, the dispatch changes (recorded as a tension in the companion).
- If edge count in a 200-tick seeded world grows unbounded (prune failing), the decay design is wrong; revert to condition-style durations.

## explicit user sign-off

Not required (Reversible). For the record, the design session itself was explicitly ordered: "ok go" (2026-08-23).

## author notes for the judge

- The six-mechanism census comes from three parallel in-session code surveys with file:line citations (condensed in the brainstorm companion). Two framing errors in the original ticket were corrected by the survey and are reflected: `reputationScore` is live (not write-only), and the tally system's problem is a 31% silent-discard leak, not absence of a surface.
- The riskiest judgment call: delegating the agent↔agent leg to `relates_to` trust rather than minting edges for persons. Argument: the store exists, the decision loop reads it, and duplicating it would violate the plan's own anti-goal. The kill criterion above covers the director disagreeing.
- The two deferral sweeps are predicate-scoped per THR-688 rule A; their counts (154 writes / 18 chips) are survey-time evidence, not membership.
- The FactionSheet Law-13 fix is folded in rather than ticketed separately because it is the same concept's surface and the same word vocabulary — separate-ticket overhead exceeds the fix.
