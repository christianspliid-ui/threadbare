# Cross-Content Variety & Coverage — Program Plan

**Author:** Cowork · **Date:** 2026-06-22 · **Status:** draft (design direction; director-requested)
**Builds on:** `2026-06-22-encounter-volume-scaling-design.md` (THR-467) · `2026-06-22-encounter-content-and-delivery-assessment.md`
**Generalizes encounter scaling to every content type.**

## What this is

The director asked: research prior encounter-design thinking, then propose how to generate more variety and coverage across **all** content types and systems — not just encounters. This plan is that proposal. It deliberately reuses settled frameworks rather than reinventing them.

## Prior thinking we are building on (research synthesis)

A lot is already decided. The new program must extend, not contradict, these:

- **Cosmological coverage matrix** (`Brainstorms/brainstorm-cosmological-symmetry.md`, `The Cosmological Pattern`): 4 foundation × 8 creation spheres × 8 reaches (each with a 2-pole archetype axis = 16 poles) × Quintessence. This *is* the canonical coverage grid every content type should be measured against.
- **Prose structural variety** (`2026-04-17-routine-template-structural-variety.md`, THR-86): five prose shapes `{svo .40, aftermath .20, inverted .15, compound .15, fragment .10}` with rotation memory; `enrichProse()` placeholders; additive fallback. The anti-pattern to beat is "Static Strings in Dynamic Fields."
- **Content-desert coverage levers** (`2026-03-29-encounter-tuning-and-agent-variety-design.md`, TB-074): `MIN_TEMPLATES_PER_LOCATION_TYPE = 8`; familiarity discount / exploration bonus / travel-cost dampening; tick-based difficulty tiers; encounter chains.
- **Procedural component library** (`2026-04-03-procedural-content-component-library-audit.md` + `-foundation-plan.md`; `2026-04-19-content-architecture-phase-2-stateful-shells.md`): primitives (`test_shaper`, `prevent_loss`, `content_grant`, `service`) + stateful shells (`flip_table`, `clearance_gate`, `progress_track`, `result_bands`, duplicate-gain policies). Several are designed-but-not-implemented.
- **Voice + authoring contract** (`2026-03-06-content-strategy.md`, `2026-04-02-encounter-redesign-guidelines.md`): three prose modes; 19 narrative archetypes with reach affinities; cultural palettes *generated* from ~32 modifier sets; fail-forward outcome ladder; success-band targets per difficulty; hard content exclusions.
- **Quality bar** (`2026-03-26-meeting-encounter-prose-eval.md`): the benchmark proving one encounter shell yields six genuinely different character arcs.
- **Surface architecture** (THR-467): the unit is an *encounter surface* (template × bound context), produced bespoke / context-multiplied / procedural, quality-tiered by stakes.

## The core problem restated: counts deceive, coverage is the question

The encounter assessment proved a library can be large yet feel repetitive (200 templates, one firing 37%). A **content census** verifies this generalizes. Code-grounded counts (2026-06-22):

| Content type | Count (code) | Note |
|---|---|---|
| Encounters (all) | ~210 | But concentration/branching delivery broken (THR-464/465) |
| Reward attachments (`reward-attachment-catalog.ts`) | ~328 | Higher than vault docs implied — but distribution across dimensions unknown |
| Omens (`omenTemplates.ts`) | ~88 | Healthier than docs implied |
| Starter attachments | ~24 | |
| Non-encounter actions (`action-template-content.ts`) | ~44 | ~4–6 per reach |
| Conditions (`condition-trait-content.ts`) | ~12 | Thin |
| Artifacts (`artifact-templates.ts`) | ~11 | Thin |
| Spells (`spell-templates.ts`) | ~10 | Thin vs 34 documented magic traditions |
| **Sublocation families** | **Gold reach only** | `phaseSublocations.ts` is "Gold Sublocations"; **7 of 8 reaches have no sublocation family** — a code-confirmed structural hole |

**Lesson:** raw counts are misleading in both directions (encounters looked plentiful but concentrate; attachments looked thin but number ~328). The honest unit is *coverage across the cosmological matrix*, per type. **So the program's first deliverable is an instrument, not content.**

## The spine: a Content Census instrument

A headless tool (sibling to the THR-457 KPI harness) that, for every content type, reports **cell-fill across the canonical dimensions** and flags deserts:

- Dimensions: reach (8) × archetype pole (16) × scale (4) × rarity tier × location subtype (~20) × faction (~10) × culture × doom archetype (7).
- Output: per-type coverage heatmap — which cells have ≥N entries, which are empty — plus a "desert list" (the generalization of TB-074's location-desert analysis).
- This converts "do we have enough variety" from opinion into a measured, re-runnable report the director can read each cycle, exactly as the KPI harness did for gameplay. **Measurement before authoring** — the discipline the director established for tuning, applied to content.

## Three reusable production engines (apply per content type)

Variety at scale comes from three engines already chosen in prior work; the program's job is to finish and apply them broadly:

1. **Surface multiplication** (THR-467): one authored template → many graph-grounded surfaces via context slots + authored fragments. Backbone for encounters; extends naturally to social scenes, non-encounter actions, and condition/omen flavor.
2. **Primitive + shell composition** (Content Architecture): items/conditions/attachments composed from primitives (`test_shaper`, `prevent_loss`, `progress_track`, `flip_table`, `result_bands`). Several primitives are designed-but-unimplemented — finishing them unlocks combinatorial attachment/condition volume.
3. **Generated-from-modifiers** (content-strategy): cultures, cultural palettes, and names generated from ~32 modifier sets rather than hand-authored. Extend to name pools, omen flavor, and faction texture.

Quality stays protected by the THR-467 tiering decision (bespoke marquee / templated mid / procedural ambient) plus the prose-shape grammar and voice contract. Procedural output never enters the player's curated spotlight.

## Prioritized roadmap (coverage-driven, thin-first, measured)

Ordered by leverage × thinness × unblocking. Each phase gates on the census + (for gameplay-visible types) the KPI harness + director verdict.

- **P1 — Content Census instrument + baseline.** Build it; run it; publish the coverage heatmaps. This re-bases every claim below in measured data and may re-order P2–P6. *Highest priority — nothing else is trustworthy without it.*
- **P2 — Sublocation families for the 7 non-Gold reaches.** The clearest structural hole; also unblocks location-gated encounter variety (Iron→fortifications, Shadow→hideouts, Veil→arcane sites, Eye→watchposts, Heart→sanctuaries, Stone→quarries/halls, Star→shrines/observatories). ~5–7 per reach.
- **P3 — Encounter surfaces (THR-467).** The largest type; the surface backbone + Tier-2 conversion. Runs in parallel with marquee bespoke (THR-466) and is the structural fix for concentration (THR-464).
- **P4 — Attachment/condition/spell libraries via primitives+shells.** Implement the missing primitives (`test_shaper`, `prevent_loss`, `progress_track`); author starter libraries to fill matrix deserts (conditions, spells, artifacts are thinnest by count). Apply duplicate-gain + result-band shells.
- **P5 — Non-encounter actions + omens + faction-as-content.** Expand actions toward ~8–10/reach where the census shows gaps; spread omens/faction flavor across thin spheres; generate name pools per culture.
- **P6 — Cross-content thematic orchestration.** Ensure encounters, attachments, conditions, locations of the same reach/archetype/culture read as one world (archetype tone + cultural palette as the binding layer). Addresses the standing open question "how to keep all content types feeling like one world."

## Three pillars

**Engine.** Content Census instrument; surface-multiplication runtime (THR-467); finish procedural primitives/shells; coverage tags on all content types; novelty tracked at surface granularity so multiplication actually raises variety; tracing for census + binding inspectability.

**Content.** Starter libraries per thin matrix cell; authoring pipelines per type — `encounter-pipeline` and `attachment-pipeline` exist; add/extend for sublocations, conditions, and actions (or route through `content-catalog-manager`). All authoring loads the relevant `Docs/canon/*` page as Step 0 and holds the voice contract + prose-shape grammar.

**UI.** "Every primitive is clickable" (encounter design Rule 4) — detail pages for every new content node type; a **coverage dashboard** surfacing census heatmaps for the director (the content analogue of the KPI report); debug-panel visibility into surface binding + census counts. Player-facing variety is mostly carried by existing surfaces.

## NFP compliance (self-audit)

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — census thresholds, multiplication caps, primitive params all named constants |
| 2 Inspectability | PASS — census report + per-surface binding traces |
| 3 Determinism | PASS — generation/binding via seeded PRNG |
| 4 Fail-soft | PASS — missing fragment/cell → authored default, never blank/throw |
| 5 Narrative > mechanical | PASS with note — tiering + authored fragments + voice contract keep scale from flattening prose; procedural stays ambient |
| 6 Additive | PASS — census + surface layers wrap existing content; no destructive reformat required |
| 7 Performance | PASS with note — census is offline; runtime multiplication respects per-template surface caps and the 40-candidate cap; profile at each phase |

## Considered alternatives & tensions
- *Just author more of everything (rejected as the frame):* the encounter case shows volume without coverage measurement reproduces the concentration trap. Census-first prevents authoring into already-full cells.
- *One mega content-generator (rejected):* a single procedural system across all types would flatten prose and erase type-specific craft. Three targeted engines + tiering preserve quality where it matters.
- *Central tension:* breadth (fill every matrix cell) vs the prose quality bar. Resolution = tiered quality per cell importance; marquee cells get bespoke, long-tail cells get procedural-but-guarded.
- *Open question:* does the matrix need *uniform* fill, or weighted fill (deep where the player spends time — local scale, common reaches; sparse in the rare long tail)? Recommend weighted; confirm via census + playtest.

## Relationship to existing work
- **THR-467** (encounter surfaces) becomes P3 of this program. **THR-464/465** (delivery) and **THR-466** (saga content) fold in. **THR-457** KPI harness is the gameplay-side gate; the Content Census is its content-side sibling.
- Natural project home: **Content Architecture** (the reusable procedural grammar — this program is its broadening from items/spells to all content + the census layer). Feeds Social Systems Expansion and Dynamic Economy.

## Next steps
1. Director review of the program frame — especially census-first and the weighted-vs-uniform coverage question.
2. If endorsed: P1 (Content Census) is the first executable unit; its output re-bases the roadmap. Run the governance pass (grill-me → intent-judge → forked audit) on P1's scope before implementation.
