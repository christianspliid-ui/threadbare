# Action Proposal — The undertaking substrate (THR-1292)

## intent_quote

From the design-session commission (Christian's carve-up, THR-1276 closing comment, ratified
2026-08-26):

> **The undertaking substrate** *(Engine)* — checkpoints on the strategic-actions skeleton (shared
> step-resolution library, busy-gate untouched), initiative retirement incl. the mentorship fold,
> the one temperament-weighted board (shadow-scored before cutover), presence/parallelism flags,
> the halt ratchet, upkeep deletion gated on a decision-mix floor. Draws on: THR-1280, THR-1279
> v3/v7, review §2.2/§2.3/§3.

From the session brief:

> Your job is compression into an executable plan, not redesign. [...] Genuine creative forks go to
> Christian in chat; calibration and implementation-how are yours — decide and invite a veto.

Binding rulings quoted in the plan doc: THR-1280 addendum ("Undertakings live in the strategic
runtime ... shared resolution library ... busy-gate stands untouched"), THR-1281 amendment
("failure residue follows visibility ... a halt ratchet joins the checkpoint rules"), review §3
doc-1 rows (shared library architecture; blast-radius inventory incl. mentorship; one-board
convergence via shadow scoring with a named common currency; decision-mix floor gates upkeep
deletion).

## scope (what this plan does)

Engine-pillar plan doc for the undertaking substrate: extracts the encounter step resolver's pure
core into a shared library with two contract-tested callers; adds checkpoint dice (band → advance /
advance-at-cost / halt, crits as intensifiers), the halt ratchet with a deterministic
abandon-or-escalate fork, and visibility-tracked failure residue events to the strategic runtime;
retires the initiative pipeline with the full measured blast radius (424 lines / 515 occurrences /
32 files) including the mentorship fold and the Inspire/Sabotage retargeting plus two mechanical UI
repoints; designs the one prioritization board on a named common currency (expected value per
tick) with temperament weights, run in shadow with dual-channel telemetry and cut over only behind
measured distributional gates; adds the two per-verb flags (requires-location, can-run-beside); and
gates control-upkeep deletion on a measured decision-mix floor via the THR-1277 method.

## scope (what this plan does NOT do — explicit non-goals)

- No kind catalog, band tables, at-cost consequence content, name lexicons, or `controls`-edge
  disposition table — doc 2 (the at-cost band's mechanical cost is explicitly content-deferred).
- No binder work: no scored find/modify/mint, no per-step anchoring, no persistence enforcement, no
  mint budget — doc 3 (this doc only leaves the `rebindRequested` hook and complication event).
- No grievance minting rules or value-pole selector term — doc 4 (this doc only emits the
  `undertaking_abandoned` mint event and declares the board's urgency slot).
- No player surfaces: no arc panel, moment cards, follow affordance UI, or interrupt collation —
  doc 5 (this doc stores `followedAgentIds` + the presentation resolver so `everInterrupted` can be
  stamped engine-side).
- No undertaking factory/gates/review levers — doc 6 (the `?outcome` pin deliberately does not
  extend to checkpoints).
- No fix for the pre-existing PRNG stream-multiplier collisions (documented, avoided, not
  changed — determinism-visible to existing seeds).
- No faction/company action libraries, ambient batching, or nudgeable checkpoints (map's recorded
  later-work).

## impact_class

Reversible — a plan doc plus engine work behind staged flags and measured gates; the destructive
slices (initiative deletion, control deletion) are sequenced last and the deleted pipeline is
measured-dead (0 starts in ~5,400 decisions). Not External; no data leaves the repo.

## evidence cited

- **Linear issue:** THR-1292 (created this session; carve-up doc 1 of THR-1276)
- **Vision premises invoked:** rulebook doctrine via `Docs/canon/rulebook-quick-reference.md`
  ("failure is plot, not punishment"; forks decided by the mortal; success-at-cost dominant
  texture; the two-way thread)
- **UL terms touched:** *undertaking* (already ruled the UL term, THR-1281 §3; `project` stays a
  code noun — no new UL-proposal needed); *checkpoint*, *halt ratchet* ride the plan doc for the
  doc-2 UL pass
- **Canon pages consulted:** `Docs/canon/systems-inventory.md` (Strategic Projects & Control ACTIVE
  at 2a.55/6.1; Ambitions & Initiatives ACTIVE at 2.32/2.33), `Docs/canon/rulebook-quick-reference.md`,
  `Docs/canon/interface-map.md` (+ `scripts/interface-contracts.ts` verified: initiative pipeline
  carries no audited contract rows)
- **Prior plan docs this builds on:** `Docs/plans/2026-04-09-ambition-driven-strategic-actions-design.md`
  (the one-board intent the implementation drifted from), `2026-04-14-agent-initiatives-implementation.md`
  and kin (the pipeline being retired), `Docs/audits/2026-08-26-proactive-agent-actions-review.md`
- **Rejected approaches considered and dismissed:** in the brainstorm companion — synthetic-action
  adapter instead of a pure core; per-step authored checkpoints now; dice on the fork; a third board
  currency; agreement-rate cutover gate; absolute-count deletion floor; engine-side at-cost tax;
  quintessence at checkpoints. Repo-level rejected approaches (fixed action count, behavior trees,
  etc.): none reintroduced.

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; no new node/edge types; the mentors-edge
  property rename keeps the relationship an edge.
- **Sigmoid → d100 for resolution, no alternative dice** — the entire point of the shared library:
  checkpoints use the same core, not a second dice system.
- **Agent position three-tier model** — `requiresLocation` resolves upward per the model.
- **The world graph is mutated in place / touchWorld discipline** — checkpoint effects ride the
  existing lifecycle writers; no new identity-keyed caches.
- **Maslow pipeline / no utility-function AI** — the board is candidate scoring in the existing
  decision phase, not a planner; recon confirmed Maslow does not enter `scoreAndSelect` today and
  this plan does not claim otherwise.
- **No inventing node types without verification** — none invented.
- None of these decisions is being *changed*.

## high-impact files touched (from Codesight)

`src/types/gameState.ts` (345 importers — one additive field), `src/types/unifiedAction.ts`
(278 — type imports only, zero planned edits), `src/engine/traceBuffer.ts` (232 — untouched;
listed to show it was checked). Blast Radius section present in the plan doc.

## kill criteria

- Golden-fixture parity fails after the core extraction → the seam is wrong; stop, do not ship a
  behavior-changed encounter path under a refactor label.
- Shadow-period distributional gates unmet on either seed → no cutover; legacy contests keep
  deciding; evidence posted to the issue (an explicitly valid outcome, stated in the Done-when).
- Decision-mix floor unmet after cutover → control deletion waits; THR-1286's relief remains.
- Checkpoint dice reproduce the zero-failure pathology (no halts across both 150-tick seeds) →
  difficulty defaults are miscalibrated; retune `UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY` before
  any dependent doc builds on stakes that don't exist.
- If the plan's premise fails structurally (undertakings cannot share the core without busy-gate
  changes), that contradicts a ratified technical verdict — surface to Christian rather than
  patching around it.

## explicit user sign-off

Not required (Reversible). The design decisions themselves are ratified: map + carve-up ratified by
Christian 2026-08-26 (THR-1276 closing comment); review rulings §2.2/§2.3 ratified in chat
2026-08-26. Session-level calibration calls are agent-authority-veto-open per the commission.

## author notes for the judge

- The value-pair vocabulary repair (§4 of the plan) is strictly upstream scope pulled in: three
  legacy pair names (`tradition_progress`, `mercy_ambition`, `justice_mercy`) are absent from
  `VALUE_PAIRS`, making parts of the desire term silently zero. The board's temperament weights are
  the ratified design; converging onto a half-dead signal would fake them. Flagged rather than
  hidden; judge should weigh whether it belongs here or as its own ticket (my call: here, as slice
  1, because the shadow data is poisoned without it).
- `near_miss → halt` vs `→ advance-at-cost` was a genuine coin-flip calibration; rationale in the
  brainstorm companion (ratchet reachability). Cheap to flip later — it is one row in a mapping
  table.
- The plan instructs the executor to close THR-1287 as superseded when the control deletion lands —
  a cross-ticket effect worth the judge's eyes.
- Doc 5 owns moments, yet this plan stores `followedAgentIds` and the presentation resolver. The
  seam is argued in the companion (residue rule needs `everInterrupted` engine-side); the judge
  should check it doesn't preempt doc 5's ratified surface rulings (I believe it implements ruling
  2.1's population/class rules exactly, and only those).
