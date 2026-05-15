# Action Proposal — THR-75 Mentor/Apprentice Relationship Chains

## intent_quote

> **Mentor/Apprentice Relationship Chains**
>
> Master-apprentice bonds are one of the most narratively rich relationships in fantasy — creating loyalty, succession, betrayal possibilities, and generational storytelling. Currently buried as one of 13 equal initiative types ("Train Apprentice"). Deserves its own encounter chain and relationship type.
>
> **Scope (three-pillar):**
>
> **Engine:** `mentors` edge type (mentor → apprentice) with properties: domain (which Reach), progress (0.0–1.0), started tick. Mentor prerequisite: tier 6+ in the relevant Reach, apprentice must be tier 2-4. Multi-tick training encounters that transfer capability/traits over time. Graduation event when apprentice reaches threshold. Betrayal/surpassing arc: apprentice who exceeds mentor creates narrative tension.
>
> **Content:** Mentor/apprentice encounter chain: The Offer, First Lesson, The Test, The Breakthrough, Graduation (or The Surpassing, The Falling Out). Sphere-colored mentorship prose (Life mentor: nurturing growth; Entropy mentor: "learn through failure"; Force mentor: harsh discipline). Cultural variations in mentor/apprentice dynamics.
>
> **UI:** Mentor/apprentice bond visible in agent profile relationships section. Chronicle entries for mentorship milestones. Training progress indicator for bonded agents.
>
> **Player agency hook:** "Inspire Mentorship" — nudge a high-capability bonded agent to take on an apprentice. "Sever the Bond" — force a dramatic break between mentor and apprentice (creates conflict encounter).
>
> **Connects to:** THR-51 (Agent Initiatives — "Train Apprentice" may fold into this), Death/Succession (mentor death creates orphaned apprentice arc)

(The "user" here is Christian Spliid, who created THR-75 during the 2026-04-14 design review of the Social Systems Expansion project and personally sketched all three pillars above. This plan is produced by the `keep-work-flowing` scheduled run. Project-level brainstorm exists: `Docs/plans/2026-03-31-social-systems-expansion-design.md` plus the 2026-04-14 design review.)

## scope (what this plan does)

Promotes mentorship from a deferred initiative-type line item to a first-class social system. Adds: a persistent `mentors` graph edge (+ `EDGE_SCHEMA` entry), a new `initiative.train-apprentice` initiative type that reuses the THR-51 multi-tick machinery, a thin new `phaseMentorship` tick phase that couples the initiative to the edge and drives the lifecycle, a `resolveMentorship()` terminal-arc decision table (Graduation / Surpassing / Falling Out / Quiet Parting / Dissolution) keyed off a narrative-derived `bondQuality`, capability transfer on graduation via a Mastery trait grant (existing GraphOp pattern), a `mentorship-constants.ts` file, six `MentorshipTrace` categories, three branching encounters (The Offer, Graduation-with-Surpassing-branch, The Falling Out), two divine actions (Inspire Mentorship, Sever the Bond), an AgentDetailPanel mentorship block + supporting `getMentorships` query + `AgentDetail.mentorship` field, chronicle events, and DebugPanel trace visibility. Phase 1 is a complete end-to-end shippable system.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT author the three mid-chain milestone encounters (First Lesson, The Test, The Breakthrough) or a standalone Surpassing template — explicitly deferred to Phase 2 (§11), to be filed as a `Deferral` child of THR-75. The Phase 1 engine seeds these by `templateId` and fails soft until they exist.
- Does NOT build the orphaned-apprentice arc on mentor death — Phase 1 only ships the fail-soft orphan handler (edge → `estranged`). The rich arc belongs to THR-76 (Death, Mourning & Succession Crises); a `// TODO(THR-76)` marker is specified.
- Does NOT modify `phaseInitiativeProgress`, `initiativeLifecycle.ts`, or `executeInitiativeOutcomes` destructively — the only existing-engine edit is an isolated `if (template.id === 'initiative.train-apprentice')` branch in `initiativeCandidates.ts`.
- Does NOT add a HexMapV2 signifier — mentorship is a relationship, not a hex-occupying entity (N/A with rationale in §6.6).
- Does NOT touch `src/types/faction.ts` or faction-member edges — so it is NOT mutex with THR-431.
- Does NOT change any rule of play (turn structure, the 5 verbs, prerequisite system, resource model, resolution, clocks, win/loss) — adds one initiative-type row to a reference table only.

## impact_class

Reversible

(Rationale for the judge: this is an additive game system behind an `ENABLE_MENTORSHIP` feature flag. It adds a new *edge* type and a new tick phase. Per the skill's impact table, High-risk names a new *node* type — an edge type is distinct and carries a lighter governance bar ("check graph.ts for existing edges... justify why graph traversal isn't needed" — done in §2 and §4.1). It is not Linear-protocol / scheduled-task / CI / cross-agent work, so not "External" by the table's examples. Classified Reversible. If the judge considers a new shared-schema edge type + new orchestrator phase to warrant External, please bump and note it — that does not change the verdict path.)

## evidence cited

- **Linear issue:** THR-75
- **Vision premises invoked:** "living novel / sub-plots between mortals" and "failure is a story turn, not a loss" — invoked, not contradicted (see plan §2 Vision premise check). No Vision file edit required.
- **UL terms touched:** "mentor", "apprentice", "mentorship", "Domain Capability", "Reach", "Mastery trait", "initiative". `mentors` / `mentorship` are new domain terms — flag a `UL-proposal` Linear issue for the `mentors` edge + `mentorship` system terms (noted as an executor closeout item; not blocking).
- **Canon pages consulted:** `Docs/canon/agents.md`, `Docs/canon/encounters.md`. (`Docs/canon/rulebook.md` checked for rule-of-play impact — none; one reference-table row only.)
- **Prior plan docs this builds on:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` (Expansion B "Train Apprentice", Expansion A "Mentorship Offer"); `Docs/plans/2026-04-16-systemic-wiring-guide.md` (the 7 capabilities).
- **Rejected approaches considered and dismissed:** (a) standalone `phaseMentorship` with no initiative coupling — duplicates THR-51 machinery; (b) mentorship as purely an initiative type with no edge — a transient property cannot carry a persistent relationship, violates the "relationships are graph edges" load-bearing decision. Both documented in plan §2.

## load-bearing decisions touched

- **"Everything is a graph node/edge."** — Respected: the persistent relationship is modeled as the `mentors` edge, not a property bag.
- **"Relationships between entities are graph edges, not property fields."** — Respected and central: this is the explicit reason Alternative B (initiative-property-only) was rejected (plan §2).
- **"Before adding a new edge type, check `src/types/graph.ts` for existing edges that could serve the same purpose."** — Done: the codebase-grounding pass enumerated all 39 existing edge types; none expresses a directed, domain-scoped, progress-bearing teaching relationship. `relates_to` is generic sentiment and cannot carry `domain`/`progress`/`phase` semantics without overloading.
- **"New node types require full design before code."** — Not triggered: this is a new *edge* type, not a node type. No new node types are introduced. The edge is nonetheless fully designed (category, properties, cardinality, tick participation, traces) in plan §4.1.
- **"Ascendants use the same prerequisite system as agents."** — Respected: mentor/apprentice eligibility uses Domain Capability tiers; the Ascendant is explicitly excluded from apprentice eligibility by content choice, not by special-casing engine logic.
- **"The world graph is mutated in place — use `touchWorld()` / `touchStructure()`."** — The executor must call `touchWorld()` after `mentors` edge mutations so UI selectors see the change; noted as an implicit requirement of the AgentDetailPanel wiring (§6.2). Flag for the judge: this should arguably be an explicit action item — see author notes.

## high-impact files touched (from Codesight)

- `src/types/graph.ts` — **370 importers.** Single additive union member (`'mentors'` → `EdgeType`). Plan doc has a Blast Radius section (§3).

No other file in scope has ≥100 importers.

## kill criteria

- **Wrong if:** mentorship initiatives never get picked by the candidate scorer in practice (the prerequisite gates are too tight) — detectable via a 30-tick CLI smoke showing zero `mentorship_offered` traces across a populated medium map; remedy is to relax `MENTOR_MIN_TIER` / `APPRENTICE_MAX_TIER` constants (tunable, no code change).
- **Wrong if:** the terminal-arc distribution is degenerate (e.g. ~100% Graduation or ~100% Falling Out) because the `bondQuality` drift constants are mis-tuned — detectable via trace category counts over a long CLI run; remedy is to retune `BOND_DRIFT_*` / `*_BOND_THRESHOLD` constants.
- **Wrong if:** the `mentors` edge accumulates as unbounded historical cruft on the graph (every graduated/estranged edge persists forever) and degrades graph queries — remedy is a future pruning/archival pass; flagged as the §9 NFP-7 "profile if adoption is high" note.
- **Rollback:** set `ENABLE_MENTORSHIP = false` — `phaseMentorship` and candidate generation no-op; existing edges become inert. The feature is fully reversible without a code revert.

## explicit user sign-off

N/A — impact class is Reversible, not High-risk. The originating intent is the THR-75 issue Christian authored with a full three-pillar scope sketch; this plan stays within that sketch.

## author notes for the judge

- **Tradeoff — initiative coupling vs standalone phase.** I chose a hybrid: the initiative is the "mentor is occupied" wrapper (reusing all of THR-51's tested machinery), the `mentors` edge is the persistent relationship, and a thin new `phaseMentorship` couples them. The alternative — folding everything into a standalone phase — would have duplicated ~200 lines of tested initiative code. The cost of the hybrid is one isolated `if` branch in `initiativeCandidates.ts`. I judged that acceptable; flag if you disagree.
- **Surpassing as a branch, not a template, in Phase 1.** The issue lists "The Surpassing" as a distinct terminal encounter. Phase 1 ships it as an authored branch *within* `mentorship.graduation` (selected by a `branchHint`), and Phase 2 promotes it to its own template. This is a deliberate scope decision to keep Phase 1 shippable — I believe it honors intent (the Surpassing beat *exists* and is authored in Phase 1) while being honest about the authoring load. Judge: is shipping Surpassing-as-branch a GAP on intent fidelity, or acceptable phasing? My read is acceptable phasing because the §11 Phase 2 deferral is explicit and the beat is not dropped.
- **`touchWorld()` callout.** Plan §6.2 wires the UI query but I did not make "call `touchWorld()` after `mentors` edge mutations" a numbered action item — it is implied by the load-bearing decision. If you score the Wiring dimension GAP for this, the fix is a one-line addition to §7; I'd accept that as a Revise.
- **Capability transfer is genuinely new.** Nothing in the engine transfers capability cross-agent today. I deliberately routed it through the *existing* Mastery-trait GraphOp pattern (`add_node` trait + `add_edge` has_trait, `source: 'mentorship'`) rather than inventing a raw-capability-injection path — this keeps it additive and uses only documented machinery. Plan §2 Tension 1.
- **Brainstorm companion.** The design workflow asks for a separate Brainstorm vault page. I folded it inline as plan §2 because the Obsidian MCP is intermittently unreachable (impediments #66/#71/#75/#86) and this is an autonomous scheduled run. If you consider the missing separate vault page a process GAP, note it — it does not affect the design's correctness.
