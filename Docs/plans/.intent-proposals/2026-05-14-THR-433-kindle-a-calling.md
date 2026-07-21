# Action Proposal — THR-433 Kindle a Calling

## intent_quote

The originating intent is Linear issue THR-433, authored by Christian Spliid, a deferral filed from THR-400 §14. Verbatim from THR-433:

> Renamed from "Sanction a Mission" per the 2026-05-11 vision audit (Non-Negotiable #1 — "Player is a god, not a protagonist": the player must not name the mission). Kindle a Calling amplifies *whatever latent ambition* the faction already holds — the player pours essence; the faction names the mission.

> ## Substrate that must exist first
> * Internal-pressure resolver — the faction holds a set of latent goal candidates (drawn from ambition history, member axiological pulls, doctrine pressure, leader bias). Essence poured into Kindle a Calling biases which candidate rises to manifest as an active ambition. The player never names the candidate.
> * Latent goal candidate authoring — for each faction definition, a small set of candidate ambitions (3–5) that can be kindled. May overlap with `FactionAmbitionType` enum but with finer granularity (`territorial_expansion` is too broad — needs "expand westward" / "reclaim the lost province" specificity).
> * Encounter for the kindled moment — when the calling lands, the faction's leadership gathers and the goal becomes named (the player watches the gather, doesn't author it).

> ## Proposed action
> `action.faction.kindle_a_calling` · *life / force · cost 10 · rarity 2*
> **Player reads:** *"You pour heat into the embers the faction has been keeping. Whatever was waiting to be wanted now wants. You do not get to choose which want rises."*
> **Engine effect (sketch):** Reads the faction's latent goal candidates (engine-built from ambition history + member pulls + doctrine + leader bias). Weights each candidate by ... Seeded PRNG picks one weighted candidate; sets it as the faction's `pursues` edge (replacing any non-locked existing ambition). Plants `faction.encounter.calling_named` on the leader.

> ## Mortal-loop bridge
> The encounter is the gather — the leadership debates what the new calling means in practice. Two choices: commit (faction starts pursuing immediately with full weight) or stall (the calling fades back to latent after N ticks; faction loses a small amount of reputation for indecision).

The scheduled-task brief that triggered this session states the standing instruction: *"Do the design work — cover all three pillars: Engine, Content, UI. If too many grey areas, ping christian."* and *"Don't push through work on projects where you have not had at least one project level brainstorming session with your human."*

## scope (what this plan does)

Designs the internal-pressure resolver and the `action.faction.kindle_a_calling` divine action together. Engine: a `resolveKindledCalling` function and a `computeKindleBias` four-signal re-weighting layer, both added to the existing `factionAmbitions.ts` — they reuse the already-shipped `scoreEligibleAmbitions` / `selectAmbitionType` machinery rather than building a parallel system; plus a tunable `AMBITION_AXIS_AFFINITY` table, an essence-sharpening step, and an additive stall-fade check inside the existing `phaseFactionAmbitions`. Content: the template prose, three IPK chronicle bands, and the `faction.encounter.calling_named` 2-beat encounter (press-home / let-it-cool). UI: drawer surfacing, a faction-panel kindled-ember glyph, chronicle integration, DebugPanel inspector lines. It touches only faction ambition selection — it does not touch the `FactionAmbitionType` enum, `FactionDefinition`, army spawning logic (only gates it), or any sibling deferral's subsystem.

## scope (what this plan does NOT do — explicit non-goals)

- Does **not** add an authored `latentCallings` field to `FactionDefinition`. The issue body contains two readings of "latent goal candidates" (authored-per-definition vs engine-derived); the plan resolves the fork toward **derived** (§0.1 of the plan doc) and explains why. This is the single substantive interpretation call — flagged for Christian in plan §15 note 1.
- Does **not** change the `FactionAmbitionType` enum. The "finer granularity" the issue asks for ("expand westward" not just "territorial_expansion") is handled by the existing `FactionAmbition.targetNodeId`, resolved inside the `calling_named` encounter — not by proliferating the enum.
- Does **not** build a doctrine-pressure or dissent subsystem. The bias layer *reads* `recoveredDoctrineId` / `dissentLevel` if THR-400 set them, defensively (absent → that bias term is 0); it does not own them.
- Does **not** spawn armies on cast. A kindled-but-uncommitted calling raises no army; army spawn waits for the encounter's commit branch. The plan flags the one interaction-surface risk: the executor must confirm no other system auto-spawns for an uncommitted kindled military ambition.
- Does **not** design the sibling deferrals THR-430 (Schism), THR-431 (Reveal Corruption), or THR-432 (Anoint Successor).
- Does **not** edit any existing action template or the body of `scoreEligibleAmbitions` / `selectAmbitionType` / `phaseFactionAmbitions`' control flow (beyond the additive stall-fade check) — all changes are additive.

## impact_class

Reversible. All changes are additive: new exported functions in `factionAmbitions.ts` (existing flow untouched but for one additive stall-fade check that reuses the existing abandon path), one new template, one new encounter, one new trace, new *optional* ambition-node properties. No existing behavior is modified, no schema migration, no external systems. The plan can be reverted by removing the additive surfaces.

## evidence cited

- **Linear issue:** THR-433 (child of THR-390; deferral from THR-400 §14)
- **Vision premises invoked:** `Docs/plans/2026-04-16-game-design-direction.md` Non-Negotiables #1 (god, not protagonist), #2 (the thread is the substrate), #3 (mechanics surface through prose), #4 (world simulates around the player); "cool failure" principle. No Vision *page edit* required — the verb rides existing premises.
- **UL terms touched:** "faction," "ambition," "pursues," "leader," "member_of," "calling" (used descriptively, not as a new declared term — no `UL-proposal` needed; if review disagrees, file one).
- **Canon pages consulted:** `Docs/canon/encounters.md` (the four load-bearing encounter rules; the "all choices are god actions" rejected-approach; the reach→archetype-axis table — used to place the Heart-axis tilt on the encounter choices), `Docs/canon/rulebook.md` (action verbs / faction interventions — gains one row, in-scope for the implementing PR).
- **Prior plan docs this builds on:** `Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md` (the pattern: faction verbs as `UnifiedActionTemplate`s, `encounter_seed` mortal-loop bridges, legibility-correct drawer surfacing, NFP-table discipline, the §14 deferral that filed this issue); `Docs/plans/2026-05-14-THR-432-anoint-successor.md` (the sibling deferral's structure — verified-substrate table, defensive treatment of the THR-400-created constants file, NFP summary format); `Docs/plans/2026-04-16-systemic-wiring-guide.md` (encounter_seed capability, enrichment placeholders, hidden marks).
- **Rejected approaches considered and dismissed:** (a) authored `latentCallings` per faction definition — rejected, fights Non-Negotiable #4 and the additive-over-destructive spirit, documented in plan §0.1 + brainstorm; (b) Kindle picks the ambition directly with no encounter — rejected, makes the player the protagonist; (c) essence as a flat guarantee (always picks the top candidate) — rejected, collapses "you don't choose" into choosing-by-proxy; (d) a new every-tick phase for the stall-fade — rejected, the existing 5-tick `phaseFactionAmbitions` check is a strictly better trade. All four are in the brainstorm companion.

## load-bearing decisions touched

- **"Everything is a graph node/edge. Relationships are graph edges, not property fields."** — Respected: the kindled ambition is an `ambition` node connected by a `pursues` edge, exactly as the existing faction-ambition system does it. The new fields (`kindledByAscendant`, `kindledTick`, `kindledCommitted`, `kindledStallDeadlineTick`) are *properties on the ambition node* — they are data internal to that node (flags/timestamps about its own state), not relationships between entities, so the property-bag is correct here.
- **"No inventing node types without verification" / "New node types require full design before code."** — No new node types and no new edge types. The plan reuses the existing `ambition` node and `pursues` edge.
- **"The world graph is mutated in place — never depend on graph object identity for change detection."** — The plan calls `touchStructure()` / `touchWorld()` on faction-node and ambition-node mutations (§11 fail-soft table).
- **"Reaches and Spheres are orthogonal axes."** — The plan corrects an issue-body drift error here: the issue's "life / force" puts `life` (a Creation Sphere) in the Reach slot. Reassigned to `heart / force` with rationale (companion pairing with `divine.inspire`). Flagged for Christian in plan §15 note 2.
- **Engine caches owned per session, not module scope** — `resolveKindledCalling` holds no module-level state; all state lives on graph nodes.

## high-impact files touched (from Codesight / grep)

**None ≥100 importers.** The highest-impact touched file is `src/types/faction.ts` (≈40 importers) and the change there is purely additive — a new `FactionKindleCallingTrace` interface and a doc comment listing the new optional ambition-node properties. No edits to `FactionDefinition`, `FactionAmbition`, `FactionAmbitionType`, or any existing interface. Other touched files: `factionAmbitions.ts` (≈15–25), `unified-action-templates.ts` (≈30), `faction-action-constants.ts` (≈5), `faction-action-encounters.ts` (≈8), the faction-verb executor module (≈10). The plan doc has a Codesight pre-flight section (§1) and explicitly states no Blast Radius escalation section is required.

## kill criteria

- If the determinism test (same seed + tick + faction state → same calling) fails, the seeded-PRNG routing is wrong — fix before merge; a non-deterministic resolver violates NFP #3 and is not shippable.
- If the integration test (cast Kindle → assert a `kindledByAscendant` ambition holds the `pursues` edge and `calling_named` is seeded) or the 30-tick CLI smoke shows a tick-loop crash or no ambition created, `resolveKindledCalling`'s replace-or-create logic is wrong — revert the resolver and rethink whether the kindled ambition should hold the `pursues` edge on cast or only on commit.
- If playtesting shows the kindled calling is invisible to the player (they can't tell a calling rose, or why) the kindled-ember glyph + chronicle bands are insufficient — escalate the UI pillar, do not ship.
- If, in playtesting, kindling feels like *choosing* the faction's goal (because the bias layer is too predictable) — the `KINDLE_WEIGHT_EXPONENT` is too high; tune it down. If it feels like a pure coin-flip, it is too low. This is a tuning kill-criterion, not a structural one — the constants exist precisely so it is tunable without a redesign.
- If THR-400 never merges, this issue is hard-blocked (it needs the `action.faction.*` family + the executor module). The kill action there is "wait for THR-400," not "rework THR-433."
- Reversibility: because everything is additive, the kill action is "remove the additive surfaces" — no migration to unwind.

## explicit user sign-off

Not required — impact class is Reversible, not High-risk. The originating intent is a Christian-authored Linear issue (THR-433) with a Christian verdict already recorded on the parent THR-400 ("Verdict (Christian, 2026-05-11): yes, file") and the rename ("Sanction Mission" → "Kindle a Calling") explicitly directed by the 2026-05-11 vision audit. The Social Systems Expansion project has had project-level brainstorming (the THR-400 vision audit) — this issue is a scoped child of that brainstormed work, not a new direction.

## author notes for the judge

- **The one thing to scrutinise is the design fork (§0.1).** The issue body genuinely contains both an "authored per faction definition" reading and an "engine-derived" reading. I took derived, with a four-point rationale (Non-Negotiable #4, rides verified machinery, zero per-faction authoring, specificity-via-`targetNodeId`). If the judge thinks this is scope *reduction* rather than a correct interpretation — i.e. that Christian specifically wanted the authored menu — that is the thing to flag as Revise/Escalate. I flagged it for Christian in plan §15 note 1 and the brainstorm as well — not as a blocker, as awareness. My honest read: derived is the design the *rename rationale* implies ("amplifies whatever latent ambition the faction already holds"), and authored would contradict it.
- The reach reassignment (`life` → `heart`) is a correctness fix, not a creative liberty: `life` is a Creation Sphere and literally cannot occupy the Reach slot. `heart` is chosen by companion-pairing with `divine.inspire` (the agent-scale "kindle a calling"); `star` is a defensible alternative left as a one-field flip for Christian.
- `crudType: 'create'` mirrors the sibling THR-432; the agent-scale `divine.inspire` is `update`. Low-confidence, flagged for the executor — same call THR-432 made.
- I deliberately did **not** design THR-431 (Reveal Corruption) this session even though it is the last undesigned THR-400 deferral, because it needs a *new* Vision-level UX decision (the "suspicion mechanic / hidden-until-suspected" pattern) that no brainstorm has covered. Per the scheduled-task brief's "don't push through work where you haven't brainstormed with your human," THR-431 should get a brainstorm session first. This is surfaced in the session handoff as the recommended next step.
