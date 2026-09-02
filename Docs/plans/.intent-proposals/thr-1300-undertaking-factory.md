# Action Proposal — THR-1300 the undertaking factory

## intent_quote

> assess the linear board for work that can help progress or finish some of our wayfinder maps, then move it through design to ready for dev if you can without me being here. i will go to sleep.

(Christian, chat, 2026-09-02.) The ticket's own ask is the map's carve-up, Christian's ruling recorded verbatim in the closing comment of THR-1276:

> **The undertaking factory** (Process + Content tooling) — the production line mirroring the encounter factory: `Docs/canon/undertakings.md` as Step-0, game-design-first briefs keyed on the kind-row schema, machine gates (schema completeness incl. the no-destroy-verb-no-kind constraint, register scoring at the encounter standard, Law 56 chip backing), live-proof levers (the `?spawn`/`?forceencounters`/`?outcome` analogs for undertakings), batch cadence. Stands on doc 2's schema.

And the review record's §3 obligation for doc 6: *"Gates encode the review: schema completeness (destroy verb, cast declarations with scarcity + identity requirements), band tables, register scoring at the encounter standard, Law 56 chip state-backing."*

## scope (what this plan does)

Designs the undertaking content line as a structural copy of the shipped encounter factory: a canon page as Step 0; a batch brief keyed on the kind × CRUD grid, gap-weighted toward empty cells, with the mechanical fix before any premise; an Undertaking Contract (`check:undertaking`) composing the existing validators (`validateKindRegistry`, the motivations predicate, the register detectors) plus the new blocks the review demanded (cast declarations with scarcity and identity, tier band tables, the Law 56 write-set rule at warn); a named-list ratchet for the 64 pre-contract templates; three review levers wired through existing seams (`?undertaking=` via the board's own start path with traced gate bypasses, `?outcome=` via `resolveStepCore.bandOverride`, `?forcemoments` via `followAgent`); a live-proof sweep gated on the template's declared write set; a package compiler that lands factory output in its own pack and does the three registrations idempotently; a batch report leading with grid coverage; a CMS Package View; and a pilot batch of six aimed first at the two empty destroy cells so the `sublocation` and `faction` rows can register.

## scope (what this plan does NOT do — explicit non-goals)

- Does **not** retune the decision board, the motive gate, the variety penalty, or the per-mortal cap — THR-1388 owns the harm-supply question; the factory adds supply and reports.
- Does **not** change the moment card, the follow affordance, the calling, or any doc-5 surface — the URL lever opens the existing card.
- Does **not** re-open the encounter factory's rulings (batch of six, no exemptions, park don't kill, inline contract, director samples two) — they are copied.
- Does **not** add a new node type, edge type, trace category, or tick phase.
- Does **not** widen the decision loop below the spotlight tier (THR-1348 is a separate design fork).
- Does **not** author the pilot's prose in this doc — the pilot runs through the line it designs, after Christian approves its brief in chat.
- Does **not** edit `Docs/canon/rulebook.md` — no rule of play changes.

## impact_class

External. It adds a skill other agents will run, five npm scripts, and a CI path wiring, and it makes the compiler a second writer of kind-row and ambition-profile registrations. No load-bearing decision changes; no canon page is rewritten (one is created, which is the design session's ordinary duty per `Docs/canon/README.md`'s ownership table).

## evidence cited

- **Linear issue:** THR-1300; the map THR-1276 and its closing carve-up; decision tickets THR-1281 (grammar), THR-1279 (moments), THR-1290 (binder), THR-1291 (naming); THR-1388 and THR-1348 as the supply/aperture context.
- **Vision premises invoked:** `Vision/00-north-star.md` (both north stars), `Vision/02-non-negotiables.md` #2 and #7.
- **UL terms touched:** Undertaking, Kind Row, Work, Christening, Failure-Name Register, Freehold, Calling, Moment, Follow (all canonical in `Agents.md`). New terms needing a `UL-proposal`: *Undertaking Contract*, *batch brief* (undertaking sense) — filed at closeout.
- **Canon pages consulted:** `Docs/canon/process.md`, `design-governance.md`, `encounters.md` (the line being mirrored), `prose.md` (register model, the `registerCompliance` report-only verdict), `rulebook-quick-reference.md`, `systems-inventory.md`, `Docs/design-system/laws.md` Law 56 both clauses, `Docs/canon/README.md` (page schema).
- **Prior plan docs this builds on:** `2026-08-08-encounter-factory-workflow.md` (the precedent, rulings and Done-when), `2026-08-26-thr-1292-undertaking-substrate.md` §1 (the `bandOverride` seam), `2026-08-27-thr-1296-the-binder.md` §3 (cast spec, creation effects), `2026-08-27-thr-1297-action-library-works-holdings-naming.md` (the kind-row schema and band values), `2026-09-02-thr-1299-calling-and-surfaces.md` (the moment card chips are engine-derived), `Docs/audits/2026-08-26-proactive-agent-actions-review.md` §3.
- **Rejected approaches considered and dismissed:** one shared skill with an undertaking mode; a hard-fail prose lexicon on day one; a bespoke lever start path; spawning on the ascendant; compiling into hand-written pack arrays; creating kind rows on any first template; a new trace category; tooling-only handoff without a pilot. Each with its reason in the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; nothing new minted by the line itself.
- **No inventing node types** — none; the Package View and levers read existing shapes.
- **Relationships are edges** — respected; the lever writes `followedAgentIds` through its single writer and starts projects through the board's path.
- **Engine caches per session** — untouched; the pin is module state like `debugOutcomePin`, inert unless a flag sets it.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (~115 importers) — two optional fields on two existing interfaces, additive; Blast Radius section carries it. `src/types/strategicAction.ts` — zero changes (stated in Blast Radius so the judge can check the claim).

## kill criteria

Six, in the plan: contract miscalibration (pilot cannot clear ≤2 loops on ≥4 of 6 → recalibrate the contract, not the drafts); vacuous live proofs on >2 of 6 (brief-level fix); a ratchet that stops shrinking (audit the contract's blocks); a lever that passes a claim the board could never produce (tighten the lever); a pilot that moves the census envelope (pull the batch, never retune the board); `?forcemoments` stacking modals (route through the registry).

## explicit user sign-off

Not required (External, not High-risk). The ticket is settled input — Christian's own carve-up ruling; this doc fills the sixth slot he named. Two agent calls are flagged in the plan for veto rather than asked: the Law 56 lexicon shipping at warn, and the pilot brief being gap-weighted to the two empty destroy cells.

## author notes for the judge

The plan was written against the code on `main` @ `b95996df`, not against docs 2 and 5's prose, and one finding drives the Law 56 block: doc 2's `completionChanges` seam never shipped and doc 5 built chips from engine writes instead, so the gate had to invert (prose claiming state, not chips lacking backing). The judge should check that inversion against Law 56's text rather than against doc 2's wording. The second thing to check: the lever bypasses exactly three named generation gates and traces each — if the judge reads that as "a review can start anything", the closed constant `REVIEW_LEVER_BYPASSABLE_GATES` and kill criterion 4 are the answer. The uncertainty I carry: the tier band constants are derived from doc 2's authored values with a margin; the pilot may show the margins are wrong, which is kill criterion 1's job to surface.
