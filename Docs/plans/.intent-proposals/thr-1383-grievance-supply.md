# Action Proposal — THR-1383 grievance supply

## intent_quote

> I have paused our executor and orchestrator tasks. Can you please run a single thread agent on moving work forward on our linear board according to our normal way of working, except now it is just you as a single executor that can do both design and execution.

(Christian, this session, 2026-09-02. The ticket's own ask, filed by THR-1298's closing run: *"A named decision on which direction (or a deliberate 'leave it — grievances are a spotlight-only rarity'), recorded. If a mechanism change lands: a 300-tick run on seeds 42 and 99 showing a non-zero grievance mint count and a chain-depth distribution."*)

## scope (what this plan does)

Closes the two supply holes that leave the shipped grievance lane minting nothing in ordinary play: (1) the mint window is derived from the mint cadence (`lcm(MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL)` = 75, from a literal 25) so every harm is offered exactly once — re-measured on the live board, two-thirds of harms were never inside a window; (2) a grievance-class drive at or above `GRIEVANCE_DISPLACE_MIN_MAGNITUDE` may take a full mortal's *secondary* want's slot, closing it as `abandoned` with `abandonedReason: 'displaced_by_grievance'`, traced and told to the chronicle; (3) a faction victim's harm reaches its leader via a second `participated_in { role: 'target', viaFactionId }` edge. One word on the arc panel; one chronicle line. The rulebook's `[DESIGN]` supply gap flips to `[IMPL]`.

## scope (what this plan does NOT do — explicit non-goals)

- Does **not** widen the ambient-tier rule (grudge only below spotlight) — a standing veto invitation to Christian from THR-1298, untouched.
- Does **not** change the one-slot / feed / replace / succession / cooling / satisfaction lifecycle.
- Does **not** add a third ambition slot or change `MAX_ACTIVE_AMBITIONS`.
- Does **not** let soft drives (rebuild, guard, flee) displace a want — only rows flagged `grievance: true`.
- Does **not** route a faction's harm to its members — the leader only.
- Does **not** touch the decision board or its urgency term.
- Does **not** author templates, prose tables, or rules rows.

## impact_class

Reversible. Three constants, two optional edge properties, one trace, one filter in the mint lane, one extra edge at emission. Reverting is `git revert`; no save-format change.

## evidence cited

- **Linear issue:** THR-1383; THR-1298 (closing comment and slice-5/6 checkpoints); THR-726 (the mint window's origin).
- **Vision premises invoked:** `Vision/00-north-star.md` (weight of threads), `Vision/02-non-negotiables.md` #2 and #7, `Vision/03-design-tensions.md` #2, #3.
- **UL terms touched:** Grievance, Grudge, Heat (THR-1379 UL-proposal still open), Ambition — no new terms.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §10.7, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-01-thr-1298-reactive-loop.md` (the lifecycle, kill criteria), `Docs/plans/2026-09-02-thr-1349-decision-board-cutover.md` (why every spotlight mortal is full).
- **Rejected approaches considered and dismissed:** widen the lookback as a number; let any drive displace; displace the primary; a third slot; route to every member; leave it.

## load-bearing decisions touched

- **Relationships are edges, not properties** — respected: the faction routing is an edge; the displacement reason is data internal to the `pursues` edge.
- **No new node types** — none.
- **No inventing node types** — none.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (115 importers) — one additive union member and one interface, the THR-1298 `grievance_transition` precedent; no existing type changes. Stated in the plan's Files to touch. No Blast Radius section owed beyond that line.

## kill criteria

Vendetta monoculture (grievance share of active drives > `GRIEVANCE_SHARE_CEILING` = 0.35 at 300 ticks on either seed) → raise the displacement threshold to exclude `network_severed`, re-measure, and if still over return the displacement rule to design. Zero mints with both holes closed → a supply finding for THR-1300's kind rows, surfaced, not tuned. Encounter-outcome mints crowding out spontaneous assignment → `MINT_BASE_CHANCE` is the knob.

## explicit user sign-off

Not required (Reversible). The direction is the agent's verdict per `process.md` § User review interface rule 4 — the ticket asked for "a named decision"; it is named, and the two Christian-visible rules (tier, one slot) are untouched.

## author notes for the judge

The ticket's measurement was taken under contest B; this plan re-measured under the live board and found a different first hole (the window) beneath the one the ticket named (the slot). Both are closed. The uncertainty I carry: whether `network_severed` (0.5) deserves to evict a want — the plan says yes so both seeds have supply, and names the kill criterion that reverses it.
