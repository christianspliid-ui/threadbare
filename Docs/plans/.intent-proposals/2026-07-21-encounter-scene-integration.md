# Action Proposal — Encounter Scene Integration

## intent_quote

> "at some point we brainstormed and designed a multi step encounter (guard duty i think) that was focused on integrating encounters better in the game world, by having the encounter spawn things in the world, or use existing world objects (e.g. locations or agents) as part of the encounters. can you please assess how this part of our encounter framework works today as the encounters i have seen recently don't seem to be very dynamic or integrated into the world. assess this and help come up with a way of strengthening our encounter model so that the encounters (and the unified action template) and all its primitives are better used in our encounters."

> "at the same time. take a look at the prose of the encounters, since the prose has to be generic enough that it can reference dynamic world objects so that it does not just become prose. How does our current system work, and how well are we doing it in our current encounters."

> (After the assessment + proposal were presented in chat, including: "If you want, I can take this into a proper design session next — plan doc with the full NFP/three-pillar treatment, split into Linear tickets (this is naturally 4–6 executor-sized issues) and handed to the Ready for Dev queue.") — Christian: "yes please"

## scope (what this plan does)

Reconnects the three consumption layers (prose, aftermath, seed continuity) to the already-shipped support-bundle/world-binding layer, in six executor-sized slices: (A) `{target:*}` enrichment placeholders resolved from `action.targetId`; (B) generalized `$target`/`$cast:` aftermath sentinels + a new `bond_change` effect + implementing the documented-but-dead `role:` idiom; (C) `{cast:*}` placeholders bound to `supportBindings` + a gate-duty pilot prose rewrite; (D) family-seed matching (activating the v1 stub so 86 authored seeds spawn real encounters) + opt-in seed context inheritance; (E) bind-only default support bundles for the linear encounter families; (F) a scope-capped content sweep of social/tavern/borderland files including making `social.forge_alliance` create the bond edge it narrates. All engine changes are additive/fail-soft; no new node or edge types.

## scope (what this plan does NOT do — explicit non-goals)

- No new encounter format, no changes to resolution, difficulty, or the outcome ladder.
- No branching-tier sweep retiring hardcoded cast names (pilot only; sweep is a sized follow-up).
- No hand-authored bundles across all ~235 linear templates (family defaults only, bind-only delivery).
- No sweep of the ten guild-family content files (Slice F caps at social/tavern/borderland).
- No hex-map rendering of bonds or scene state; no new UI components.
- No runtime LLM prose; no scored family-seed selection (flat seeded draw, scoring deferred).
- No auto-inference of a target when the action has none (absence stays absence).
- Implementation itself — this is a design handoff; executor sessions build it.

## impact_class

Reversible — additive engine/type/content changes behind optional fields and silent-fallback placeholders; un-migrated content renders identically. (High-risk elements absent: no data destruction, no external surface, no load-bearing-decision changes.)

## evidence cited

- **Linear issue:** created at handoff into project **Content Architecture** (six slice issues + one UL-proposal); ids recorded in handoff comments — none pre-predicted per the create-before-reference rule.
- **Vision premises invoked:** living-world premise; encounter experience Rule 4 (every primitive clickable); "failure is plot"; player-as-god framing (unchanged — checked).
- **UL terms touched:** Enrichment Placeholder (existing); candidates Scene / Cast / Target flagged for a `UL-proposal` issue (created at handoff, not blocking).
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/prose.md`, `Docs/canon/rulebook-quick-reference.md`.
- **Prior plan docs this builds on:** `2026-04-03-encounter-packet-cg-gate-duty.md` (the originating support-bundle contract), `2026-04-16-systemic-wiring-guide.md`, `2026-05-04-encounter-experience-design-plan.md`.
- **Rejected approaches considered and dismissed:** runtime LLM prose (already canon-rejected); parallel `participants[]` role system (duplicate substrate — supportBindings is the participant system); nearest-agent target inference (invents referents); full-coverage hand-authored bundles (cost/drift); see brainstorm companion for the full list.

## load-bearing decisions touched

- **"Everything is a graph node/edge"** — respected; `bond_change` mutates existing `relates_to` instances, creates no new types.
- **"Relationships between entities are graph edges, not property fields"** — *strengthened*: the plan's motivating defect is an alliance encounter that creates no edge; `bond_change` fixes the class.
- **"No inventing node types without verification"** — no new node types anywhere.
- **"The world graph is mutated in place — version counters"** — `bond_change` calls `touchWorld()`; noted in plan.
- **"Additive over destructive"** — all type changes optional/additive; verified against the 278-importer blast radius.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — **278 importers**. Plan doc carries the required Blast Radius section (additive-only union/field extensions; one new switch case).
- No other in-scope file is on the ≥100-importer list.

## kill criteria

- If the gate-duty pilot (Slice C) shows `{cast:*}` prose reads *worse* than authored names (flat, role-generic), stop before Slice F's sweep and revisit per-key fallback richness — the engine slices (A/B/D) still stand on their own.
- If family-seed activation (D1) produces repetitive spawn loops in a 30-tick CLI smoke (same template repeatedly from one family), gate it behind the existing cooldown surface or add the deferred scoring layer before shipping content that relies on it.
- If default bundles (E) measurably slow Phase 2b in the CLI smoke (bundle prep per decision), cap or lazy-init the merge — the bind-only design should make this negligible; the smoke verifies.

## explicit user sign-off

Not required (Reversible class). For the record, Christian's "yes please" (2026-07-21) approved running the design session and Linear handoff exactly as proposed in chat.

## author notes for the judge

- The assessment behind this plan was done in the same session with full grep evidence; the substrate-inventory table in the plan doc is the audit trail (counts: 24/260 bundle adoption, 86/186 family seeds, 93 hardcoded name hits, 0 hits for a `role:` resolver).
- The six-slice split intentionally maps one slice ≈ one executor session ≈ one file surface, with the two shared-file pairs (A→C on proseEnrichment, B→D on encounterAftermath) expressed as blockedBy relations rather than mutex prose.
- Slice F touches THR-609's residual register-pass surface (three content files); flagged as conditional mutex in the coordination block.
- Uncertainty worth naming: whether `{?has_cast:x}`-style dynamic-key conditionals should reuse the intel conditional parser or get their own — left to the executor as a grey zone with the parser precedent named.
