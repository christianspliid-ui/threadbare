# Encounter Volume Scaling — Design Plan

**Author:** Cowork · **Date:** 2026-06-22 · **Status:** draft (design direction — creative-director input captured, not yet implementation-ready)
**Companion audit:** `Docs/audits/2026-06-22-encounter-content-and-delivery-assessment.md`

## Problem & premise

Threadbearer is a replayability-first game where encounters are the bread and butter. The current library (~26 bespoke branching + ~100 family/ambient templates, ~200 total) is too small for that promise: run-start choices gate large swaths, so a single playthrough draws from a shallow pool and repetition arrives fast. The creative director's benchmark is correct — encounter-driven replayable games run an order of magnitude larger.

**Benchmark (what "enough" looks like):**

| Game | Encounter volume | How it scales / stays fresh |
|------|------------------|------------------------------|
| Eldritch Horror | ~1,070 cards across the line (272 location, 400 research, 196 special, 72 other-world, …) | Segmented into 8 deck types; draw a handful per game; gated by Ancient One + expansions in play |
| Arkham Horror 3E | Location-segmented neighborhood decks (~8/deck) | **One card carries a different encounter per location** — context-multiplication from modest counts |
| Stellaris | Hundreds of events/anomalies | Gated by empire type, origin, galaxy contents; each run surfaces a fraction |

Shared formula: **volume × segmentation × context-multiplication × per-run gating.** Threadbearer has the gating dimensions but almost none of the volume or context-multiplication.

**Director decisions (2026-06-22):**
- Approach: **Hybrid** — context-multiplication backbone + procedural grammar for filler + bespoke for marquee.
- Quality: **tiered by stakes** — marquee bespoke gets full prose; filler accepts lighter recombined prose.
- Per-run target: **Rich, ~75–100 distinct surfaces/run** → library target on the order of **~1,000+ surfaces.**

## Core reframe: the unit is an *encounter surface*, not an encounter file

Today: 1 file ≈ 1 template ≈ 1 player experience (prose-enrichment only swaps `{name}`/`{ally}`). The path to 1,000+ is **not** 1,000 files — it's decoupling the player-facing *surface* (a distinct experience) from the authored *template*, and producing surfaces three ways.

### Tier 1 — Bespoke marquee (the chapters)
Hand-authored branching encounters via the `encounter-pipeline` skill. Full prose quality, the peak moments. This is where the saga/regional weighty arcs live (today all 23 branching are `local` — see THR-466). Grow deliberately (26 → ~60–80 over time), prioritising missing scales and thin reaches. **Not the volume engine** — the quality engine.

### Tier 2 — Context-multiplied templates (the backbone, ~70% of volume)
A template becomes a *surface generator*. It declares:
- a **situation skeleton** — structural beats, choice shape, aftermath shape (authored once);
- **context slots** bound to real graph state at surfacing time: actor role/archetype, location subtype, reach, a related entity (rival / ally / faction / bonded thread), world-pressure/omen, a relationship edge;
- **authored prose fragments keyed per context value** — not one string with holes, but a small authored library per slot (the "betrayal" beat reads differently, in authored prose, for a shadow-court vs a road-ambush vs a guild setting).

This is the Arkham "one card, different per location" pattern executed at authored quality. A template with 4 location-contexts × 3 actor-roles × 2 reaches that swap authored fragments yields ~24 meaningfully distinct surfaces from one authored skeleton + ~tens of authored fragments. **Quality is preserved** because every fragment is authored and every binding is grounded in actual graph state — this is *not* Mad-Libs, and it directly honours "narrative over mechanical." Leverage: ~50–80 Tier-2 skeletons × ~10–15 surfaces each ≈ 600–900 surfaces.

### Tier 3 — Procedural grammar for the ambient long tail (the filler, ~the rest)
A generative grammar composes low-stakes *ambient* beats from primitives (situation-type × stakes × reach × twist), drawing prose from authored phrase-banks per slot. Lower fidelity is acceptable here (tiered-quality decision). **Hard guardrail:** Tier-3 surfaces are world texture only — the portfolio/curation layer must never route a Tier-3 surface into the player's curated spotlight. Flat procedural prose stays in the ambient background; the marquee is always Tier 1/2. This is how we scale volume without flat prose touching the moments that matter. Extends the existing Content Architecture procedural grammar (primitives/shells) to the encounter domain — today that grammar serves items/spells/conditions only.

### Replayability gating — making "most never fire" a feature, not waste
Tag every surface (all tiers) with run-relevance dimensions: ascendant identity / reach affinity, cosmology / sphere, doom archetype, faction presence, location types present, world-pressure / omens. The selection pipeline already gates on most of these (`encounterFilterPipeline.ts`: awareness, visibility, prerequisites, threat; `encounterScoring.ts`: reach, sphere, faction, location, novelty). The design adds: **per-run pool partitioning** — each run-start config must map to a *deep* relevant pool (target ≥150–200 eligible surfaces) so the ~75–100 surfaced feel non-repeating with headroom, and the *unseen* remainder is the replayability reserve (the Stellaris/Eldritch model). Content the player never sees this run is intended, provided the relevant pool is deep enough.

## Volume model (validate before authoring)

| Lever | Value | Source |
|-------|-------|--------|
| Distinct surfaces per run (target) | 75–100 | director decision |
| Fraction of library relevant per run | ~50% | gating by start choices |
| Runs before heavy repetition (target) | 8–10 | replayability goal |
| ⇒ Eligible pool per run | ~150–200 surfaces | derived |
| ⇒ Total library | **~1,000+ surfaces** | derived |

Surface budget to reach ~1,000: Tier 1 ~60–80 bespoke; Tier 2 ~600–900 (the multiplier); Tier 3 a few hundred ambient. **The leverage is overwhelmingly Tier 2.** This model itself is a Phase-0 deliverable — build it as a small sheet/script so targets are tunable, not asserted.

## Three pillars

**Engine.** (1) *Surface abstraction + context-binding resolver*: at surfacing time, bind a Tier-2 template's context slots to graph state and select authored fragments deterministically (seeded PRNG). (2) *Tier-3 grammar generator*: compose ambient surfaces from primitives + phrase-banks, flagged ambient-only. (3) *Surface-granular tagging + per-run pool partitioning*: extend the cache/eligibility layer to operate on surfaces, with run-relevance tags. (4) *Novelty at surface granularity* — critical: novelty/recency tracking must key on the *surface* (template+context), not just `templateId`, otherwise multiplication won't reduce the concentration THR-464 flags. (5) *Tracing*: emit which template/context/fragments were bound (inspectability, NFP #2).

**Content.** (1) Tier-2 context-fragment authoring format + the per-slot fragment tables. (2) Tier-3 phrase-banks. (3) Tier-1 bespoke via existing `encounter-pipeline`. (4) A new authoring pipeline/skill (`template-context-rewrite`) to convert existing linear families into Tier-2 surface generators and author new ones. Load `Docs/canon/encounters.md` + `Docs/canon/cosmology.md` as Step 0.

**UI.** Largely shipped (encounter surface from Encounter Experience v1). Adds: (1) debug-panel visibility into which surface/context/fragments fired (Definition-of-Done browser artifact). (2) Optional replayability meta — a "seen / unseen" codex so the player perceives library depth (defer to a follow-up; flag as N/A for v1 if descoped). No new player-facing modal required for the core mechanism.

**Wiring.** Context-binding resolver called from the encounter surfacing path; surface tags consumed by `encounterFilterPipeline`/`encounterScoring`; novelty tracker updated to surface keys; traces in `traceBuffer`; debug panel reads bindings. Update `Docs/plans/wiring-checklist.md` and the systemic-wiring-guide when the surface capability lands (content authors must know how to declare context slots + fragments).

## Constants (NFP #1 — all tunable, defaults TBD in design)
`SURFACE_CONTEXT_AXES` (which slots multiply), `MAX_FRAGMENTS_PER_SLOT`, `MAX_SURFACES_PER_TEMPLATE` (compactness cap), `RUN_POOL_MIN_ELIGIBLE` (≥150–200 target), `TIER3_AMBIENT_ONLY` (guardrail flag), novelty half-lives keyed to surfaces. Volume-model parameters above are themselves constants.

## Fail-soft (NFP #4)
| Failure | Fallback |
|---------|----------|
| Context slot can't bind (no eligible graph entity) | Drop to a generic authored fragment; never throw |
| No authored fragment for a context value | Use slot's default fragment; log once |
| Per-run pool below `RUN_POOL_MIN_ELIGIBLE` | Widen gating (relax one dimension) + emit warning trace |
| Tier-3 grammar produces empty/degenerate prose | Suppress the surface; never surface blank prose |

## Phasing (design expansively, implement conservatively)

- **Phase 0 — Foundation:** define the *surface* abstraction + tagging schema; move novelty tracking to surface granularity; build the volume/replayability model. (Also a structural assist to THR-464 — multiplication raises entropy without pure penalty.)
- **Phase 1 — Prove Tier 2 on existing content:** retrofit a handful of existing linear families (social/tavern/borderland/guild) into context-multiplied surface generators. Measure via the KPI harness: top-share should fall as one template becomes many surfaces; eligible-pool depth should rise. User verdict gate.
- **Phase 2 — Tier-2 authoring at scale:** ship the `template-context-rewrite` pipeline/skill; convert + author toward the surface budget.
- **Phase 3 — Tier-3 ambient grammar:** extend the procedural grammar to ambient encounters with the ambient-only guardrail.
- **Phase 4 — Per-run pool partitioning + gating depth audit;** bespoke marquee expansion (THR-466) proceeds in parallel throughout.

## Considered alternatives & tensions (brainstorm companion, inline)
- *Pure bespoke at volume (rejected as backbone):* honours quality but linear cost; can't reach ~1,000 in any reasonable horizon. Kept as Tier 1 only.
- *Pure combinatorial generation (rejected as backbone):* maximal volume but classically yields flat prose — violates the narrative-over-mechanical tiebreaker. Quarantined to Tier-3 ambient with a hard spotlight guardrail.
- *Central tension:* volume vs the Meeting-encounter prose bar. Resolution = tiering + context-multiplication anchored in authored fragments and real graph state, so scale never flattens the marquee. If a future signal shows Tier-2 surfaces reading samey, treat it as a fragment-authoring depth problem, not a reason to abandon multiplication.
- *Open question:* does the player need to *perceive* the library depth (seen/unseen codex) for replayability to land, or is felt freshness enough? Affects whether the UI meta is v1 or follow-up.

## Relationship to existing work
- **THR-464** (template concentration): Tier-2 multiplication is the structural fix — converts "one template fires 37%" into "one template surfaces as N distinct experiences," raising entropy without leaning only on novelty penalties. Coordinate.
- **THR-466** (no regional/saga branching): becomes Tier 1 marquee authoring.
- **Content Architecture project** (procedural content grammar — primitives/shells): Tier 3 extends it from items/spells/conditions to encounters. Natural project home for this plan.
- **THR-457** KPI harness: the measurement instrument for every phase gate (top-share, entropy, eligible-pool depth, surfaces/run).

## NFP compliance (self-audit)
| NFP | Verdict |
|-----|---------|
| 1 Tunability | PASS — all multiplication/gating/volume params named constants |
| 2 Inspectability | PASS — binding/fragment-selection traced per surface |
| 3 Determinism | PASS — context binding + fragment pick via seeded PRNG |
| 4 Fail-soft | PASS — fallback table above; never surface blank prose |
| 5 Narrative > mechanical | PASS with note — the whole design exists to scale volume *without* flattening prose; Tier-3 guardrail is the load-bearing protection |
| 6 Additive | PASS — surface layer wraps existing UnifiedActionTemplate; templates remain valid |
| 7 Performance | PASS with note — surface explosion must respect `MAX_SURFACES_PER_TEMPLATE` and the 40-candidate cap; partition before scoring; profile at Phase 1 |

## Next steps
1. Director review of this direction (esp. the surface reframe + Tier-3 guardrail).
2. If endorsed: run the design-governance pass (grill-me for Phase 0/1 scope, intent-judge, forked structural audit) before moving to implementation planning.
3. Phase 0 issue is the first executable unit; Phases 1+ gate on its measurements.
