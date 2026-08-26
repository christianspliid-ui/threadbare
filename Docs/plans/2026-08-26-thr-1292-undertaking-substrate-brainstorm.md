# Brainstorm companion — The undertaking substrate (THR-1292)

Companion to `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md`. Most of the exploratory
thinking for this system happened upstream — the wayfinder grillings (THR-1280/1281/1279) and the
steel-man/red-team review (`Docs/audits/2026-08-26-proactive-agent-actions-review.md`) — so this
companion records only the alternatives weighed and calibration calls made **inside this design
session**, i.e. decisions the settled verdicts left to the agent. Veto open on all of them.

## Alternatives considered and rejected

### Library shape: wrap `resolveUncontestedStep` vs extract a pure core

Rejected: a thin adapter that fakes a `UnifiedAction` so the strategic runtime can call
`resolveUncontestedStep` directly. It would have been less diff — and would import the busy-gate
hazard (a synthetic unified action is one `resolved: false` away from freezing its agent), plus the
quintessence mutation and trace emission as side effects inside a phase that never wanted them. The
review's own language ("shared resolution library, two callers, contract-tested") points at the
pure-core extraction, and `resolutionService.ts`'s header already states the design principle
(callers emit traces). The spend-intent return shape is the price: the encounter caller must apply
intents it used to get applied for free. Golden fixtures make that refactor safe.

### Checkpoint cadence: per-step model vs interval dice

Rejected: giving undertakings authored multi-step structures now (an `ActionStep[]` on strategic
templates). That is doc 2/6 territory (kind rows, band tables, authored steps) and would have made
this doc's engine work depend on unauthored content. The interval model (`every N ticks, one die`)
preserves today's duration semantics, needs zero new content to run, and the step-authored future
layers on top: when doc 2's kinds author real steps, `checkpointIndex` maps onto them without a
runtime migration.

### `near_miss` → halt vs → advance-at-cost

Both defensible. Chose halt: (a) success_at_cost is already the widest band in the capability-poor
texture, so at-cost dominance is preserved without double-counting; (b) the halt ratchet needs
halts to be reachable by ordinary bad luck, or the fork — the design's main drama valve — fires only
off outright failures and stays vacuously rare (the same "zero failures in 400 records" pathology
this whole doc exists to kill, rebuilt one band over). A soft halt (no residue) keeps near_miss
gentler than failure in fiction even though the mechanical effect matches.

### Fork decision: dice vs deterministic scored choice

Rejected: rolling the abandon/escalate fork. Forks-decided-by-the-mortal is the rulebook's standing
doctrine (`decidedBy` reads standing, not dice), and a scored deterministic choice is inspectable
(NFP #2 — the trace carries the weight and its terms) where a roll would be noise. The courage axis
is the natural standing input; reading it through `signedToCanonical01` is non-negotiable after the
review's two-scale warning.

### At-cost mechanical teeth now vs content-deferred

Considered an engine-side default cost (wealth tax, capability bruise, progress fraction). Rejected:
every candidate invents a mechanic doc 2 is chartered to design properly (grammar §5: at-cost
consequences prefer minting catalog kinds — favors owed, leverage marks — because those sit in live
economies). Shipping a placeholder tax means unshipping it later; shipping the hook plus honest
prose costs nothing and keeps the seam clean. Stated in the plan rather than hidden.

### Quintessence at checkpoints

Rejected for v1: letting agents push/spend quintessence on checkpoint dice. Push is an
attended-encounter texture tied to watching; background undertakings spending narrative centrality
silently would be invisible economy drain (aftermath-visibility-parity feedback: only
player-inspectable quantities move). `quintessencePolicy: 'none'` keeps the door open as a policy
flag rather than a rewrite.

### One board: third currency vs adopting EVT

The obligation was "name the common currency." Considered minting a neutral third unit both scorers
map into. Rejected: a third currency means *three* mappings to tune (encounter→X, undertaking→X,
grievance→X) and no anchor to reality. The encounter scorer's value-per-tick core is the incumbent
with ~160 tuned constants behind it; undertakings can honestly express expected payoff over expected
duration in the same unit (band probabilities × payoff / stretched time), and grievance heat (doc 4)
lands as a weight on the same scale. The migration risk the steel-man flagged (the 2026-04-09 "one
board" that drifted into the bolt-on) is answered by shadow scoring with distributional gates, not
by asserting the destination.

### Shadow-cutover gate: agreement rate vs distributional health

Rejected gating on agreement-with-legacy. The board is a redesign; high agreement would mean it
changed nothing. Distributional envelopes (undertaking share, encounter floor, idle ceiling,
two seeds) measure what actually matters — that the world's decision mix stays playable — and reuse
the THR-1277 instrument, so the gate is checkable in one CLI run.

### Control-deletion floor: absolute supply vs share

Considered gating on absolute undertaking starts per run (≥ today's ~210 projects). Rejected:
absolute counts rot with map size and tick count (THR-688 rule A — predicates, not snapshot
counts). Shares from the same balance summary are size-invariant, and the idle ceiling catches the
failure mode a supply floor alone would miss (control churn converting to idleness rather than to
undertakings).

## Tensions carried forward, on the record

- **The at-cost band has register but no mechanical cost until doc 2 lands.** Accepted and stated.
  The reverse (fake teeth now) was judged worse.
- **`followedAgentIds` lives here, its affordance lives in doc 5.** A deliberate seam: the residue
  rule needs `everInterrupted` engine-side, and doc 5 cannot stamp it retroactively. The risk is
  doc 5 redesigning follow storage; mitigated by keeping it one flat field with one engine reader.
- **The value-pair vocabulary repair is scope creep by strict reading** — it predates this design.
  Pulled in anyway because the board's temperament weights are fiction without it, and it is the
  kind of silent-zero defect that would otherwise be rediscovered mid-cutover with the shadow data
  already poisoned.
- **The `*59`/`*53` PRNG stream collisions are documented, not fixed.** Fixing them shifts existing
  seeds' worlds — a determinism-visible change with no player-facing win, wrong to smuggle into this
  diff.
- **`create_faction` loses its only runtime producer until T3.** Accepted with a filed deferral;
  the alternative (adding a strategic faction-creation op now) green-fields T3 engine work out of
  order.

## Vision premises leaned on

- *Failure is plot, not punishment* — halts, forks, and visible residue are that premise at
  undertaking scale.
- *Forks are decided by the mortal, never by you* — the abandon/escalate fork reads standing.
- *Success-at-cost is the dominant texture* — the band mapping preserves it; crits stay rare
  intensifiers.
- *The two-way thread* — Inspire/Sabotage retarget keeps the god present in undertakings without
  command authority.
