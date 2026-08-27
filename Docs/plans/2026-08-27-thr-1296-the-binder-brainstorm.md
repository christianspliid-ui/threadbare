# Brainstorm companion — The binder (THR-1296)

Companion to `Docs/plans/2026-08-27-thr-1296-the-binder.md`. The exploratory thinking happened
upstream (the THR-1290 grilling, its vault synthesis, the review record); this companion records
the alternatives weighed and calibration calls made **inside this design session** — the decisions
the settled verdicts left to the agent. Veto open on all of them.

## Alternatives considered and rejected

### Persistence enforcement: per-reaper guards vs one removeNode hook

The obvious reading of "reaper inventory, each loud-or-lazy" is a guard at each of the five named
sites. Rejected as the *primary* mechanism after the recon found two things: `WorldGraph.removeNode`
is the sole funnel all ~25 deleting call sites pass through (and is entirely silent), and the two
most dangerous deleters — siege sublocation destruction and the content-authored `remove_node`
GraphOp — were not on anyone's list of five. Per-reaper enforcement routes around exactly the
reapers nobody predicted. The hook gives detection-everywhere for one optional callback on a rare
event; the per-site work shrinks to the two *defer* decisions (housekeeping dissolution) plus
loudness for the seed drop. The THR-669 alternative (snapshot anchors, let the reaper win) is kept
where it already works — stage ids are snapshotted — but cannot cover cast: an actor is not an
anchor you can copy.

### Blocking narrative deaths vs honest breakage

"Never silently reaped" could be read as "bound nodes are immortal." Rejected — the verdict's own
next sentence rules it out ("the world may still kill them honestly"), and immortal-while-bound
would make must-persist a gameplay shield that distorts sieges and reputation deaths. The split
lands on the reaper's *nature*: housekeeping (temporal dissolution, GC) defers because nothing
narrative happened; deaths and razings proceed and become named complications. The one judgment
call inside that: **seed-inheritance drops stay drops** (loud now) rather than deferring — a
follow-up seed inheriting a dead binding is the encounter path's contract, and changing its
semantics belongs to the migration, not the registry.

### Modify as its own candidate vs a rider on reuse rows

The verdict says the board scores "every reuse candidate, every modify candidate, and one mint
candidate." Implemented as up-to-two rows per existing actor (as-is / modified) rather than a
separate modify pool, because a modify candidate *is* a reuse candidate plus additive writes —
scoring them as unrelated rows would let the same node win twice or split its own vote. The
`BINDER_MODIFY_PENALTY` keeps pure reuse preferred when identity already matches.

### Identity data poverty: fix the data vs design for blanks

The review (strain 3) and the recon agree: `axiologicalProfile` is protagonist-only; the world's
ambients are blank. Considered pulling a back-fill (hydrate all ambients) into scope. Rejected —
population-wide profile generation is a worldgen/content decision with sim-wide scoring side
effects, not a binder prerequisite; and the verdict already assigns blanks a *meaning* (modify's
additive territory — "the story reveals the blank"). The plan states the skew plainly instead so
the first tuning run doesn't misread it as a defect.

### Mint immediacy vs the queue

Minting at bind time (the current support-bundle behavior) is simpler and synchronous. Rejected on
three grounds: the review's population math (unbudgeted ≈ +1 permanent agent/tick; THR-814
explicitly refused a 14× decision-cost growth; large maps stall at ~1010 — THR-162), the valve's
own semantics (one birth per tick, none on death ticks — a mint is a birth), and tick ordering
(decision runs before lifecycle; a same-tick valve consult reads last tick's budget anyway). The
queue makes the budget real, makes determinism easy (request-derived rng streams), and costs one
checkpoint of latency that the fiction absorbs (`awaiting_mint` — the world takes a day to produce
a clerk).

### Remote anchors: broad tier list vs armies-only v1

Tempting to include `controls` edges (cheapest query — the target is a location) and `owes_favor`
(the only enforceable claim on a person). Rejected: `controls` has a scheduled deletion and a
two-population split — making it load-bearing builds the anchor rule on a floor doc 1 already
condemned; favors are leverage, not command, and diluting "commands" dilutes the counter-play
("severing un-foots") that makes the rule interesting. v1 armies-only means remote undertakings
are rare, which is honest: the rule's payload arrives with T1 networks and doc 2's holdings, both
of which register into the same provider interface. Companies are included but degenerate (their
position is the leader's) — correctness, noted, not capability.

### Distance: matrix hops vs hex distance

The distance matrix is O(1) per lookup but measures adjacency hops, returns `Infinity` off-graph,
caps at 1200 locations, and is not plumbed into either signature the binder extends. `hexDistance`
+ `resolveLocationToHex` is what the candidate generator already uses at the exact seam the
remote-anchor gate lands in. Chose the geometric measure; hex distance is also the codebase's
settled awareness doctrine (location-hop awareness is a rejected approach).

### Census: incremental maintenance vs version-keyed lazy rebuild

Incremental add/remove at every birth/death/mint site is the asymptotically pretty answer.
Rejected for v1: the writer set is small but scattered (and one of the recon's findings is that
mint sites historically forget their bookkeeping — `locationId`, `touchStructure`), so an
incremental census would inherit exactly that forgetting risk. The version-keyed lazy rebuild is
the established `SimulationRuntime` discipline, costs O(actors) only on structural change, and
satisfies the review's actual bar (no per-role per-step scan). Incremental is a recorded v2 if
profiling ever shows rebuild pressure (NFP #7: profile first).

## Tensions carried forward, on the record

- **The legacy encounter corpus stays unenforced until templates opt in.** 60+ authored
  `must-persist` declarations continue to mean nothing for un-migrated templates. Accepted: the
  alternative (registering every legacy binding at once) changes the whole corpus's semantics in
  one move — the opposite of opportunistic migration. Stated and traced instead.
- **`graph.ts` is touched.** 531 importers, the repo's hottest file. The diff is one optional
  field and one guarded invocation; the plan calls it out in Blast Radius and demands a dedicated
  test rather than pretending the risk away.
- **Doc 2 authors what this doc's schema demands** (`identityRequirement`, `creationEffects`,
  cast declarations). Until then the binder runs mostly on defaults and the migrated exemplar.
  Same seam discipline as doc 1's `payoffValue`/`motivations` — the emptiness is pinned by tests
  so doc 2's first row fails one deliberately.
- **Birth-path defects found in recon are filed, not fixed** (culture-strength drop, unreachable
  validator, vocabulary splits, capability-scale split). Widening an already-wide diff with
  upstream repairs is how behavior-preserving refactors stop being either.

## Vision premises leaned on

- *Player as witness / one complex story at a time* — cast that persists and re-appears is what
  makes following an arc possible; the generic moment is the boring moment.
- *Failure is plot, not punishment* — applied to the supporting cast: honest deaths become named
  complications, never silent rebinds.
- *Additive over destructive as fiction* — modify-additive-only is NFP #6 applied to people; the
  story may reveal a blank, never contradict the established.
- *The world is capability-poor by design* — mints are born role-competent via the graduation
  generator, not heroic; the valve keeps them a trickle, not a flood.
