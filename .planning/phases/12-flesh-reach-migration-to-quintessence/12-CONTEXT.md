# Phase 12: Flesh Reach Migration to Quintessence - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove the Flesh reach entirely (9 reaches → 8), elevate its conceptual space to Quintessence (a derived meta-property tracking existential health), replace two axiological pairs (Stone: `humility_pride` → `preservation_transformation`, Eye: `frankness_propriety` → `revelation_discretion`), retire `stoicism_passion`, add archetype names with hybrid epithet system, update reach colors to sphere-derived palette, and implement Quintessence as a 0–1.0 runtime property on all entities.

Full scope: TB-075 mechanical refactor + Quintessence runtime system.

**In scope:**
- Type system changes: ReachDomain 9→8, ValuePair 10→9, remove `flesh`/`stoicism_passion`
- Axiological pair renames: `humility_pride` → `preservation_transformation`, `frankness_propriety` → `revelation_discretion`
- Content rewrite: new prose for Stone/Eye pairs, Quintessence lexicon, action redistribution
- Archetype names with "Dominant + modifier" hybrid epithet system
- Quintessence as runtime property: 0–1.0 scale, existential health, IPK-only display
- Reach color update to sphere-derived palette (darkened for Threadbare contrast)
- UI grid layout 3×3 → 2×4 for 8 reaches
- Test updates across all affected files

**Out of scope:**
- Quintessence-specific player actions (deferred to future phase)
- Foundation governance changes
- Obsidian vault restructuring (archive only)

</domain>

<decisions>
## Implementation Decisions

### Flesh action redistribution
- Follow TB-075 mapping adjusted for actual action files: Heal→Gold(Life), Diagnose→Eye(Energy), Plague→Shadow(Entropy), Cultivate→Gold(Life)
- Archetype reachAffinities (~15 entries) mapped per archetype context — each gets a different replacement based on character concept (e.g., Healer: flesh→gold, Warrior: flesh→iron)
- FLESH_MAX_HOPS removed entirely — all reaches use same MAX_AWARENESS_HOPS, no special proximity mechanic
- Obsidian vault Flesh action files archived to Actions/_archived/Flesh/ (not deleted, not redistributed)

### Quintessence runtime role
- **Definition:** Existential health — how 'alive' or 'real' an entity is
- **Scale:** 0–1.00 continuous, mapped to 10-level lexicon (Fraying=0.0–0.1, Flickering, Tenuous, Steady, Rooted, Resonant, Crystalline, Radiant, Transcendent, Absolute=0.9–1.0)
- **Scope:** All entities that have SphereAffinity also get Quintessence
- **Erosion sources:** Overchannel (magic overuse), sacking/destruction (M2), failed encounters that narratively diminish an entity, wounding/killing agents, decimating armies/factions, doom progression
- **Zero-state outcomes:** Contextual — can be removal from game, permanent/temporary condition, or transformation. System uses entity-type rules (agents→death/transformation, locations→ruins/void, factions→dissolution) as defaults, with threshold conditions (0.25=weakened, 0.10=critical, 0.0=dissolution) and narrative engine picking flavor
- **Recovery:** Certain encounters, certain attachments, ascendant actions, plus very slow passive regeneration
- **UI display:** Prose-only via IPK (Interactive Prose Keywords) — no explicit meter. Consistent with Phase 10's "never show numbers" approach
- **No Quintessence-specific actions** — deferred to future phase. Existing actions have side effects on Quintessence.

### Axiological pair tone
- **Stone (preservation↔transformation):** Fortress vs Forge narrative tension. Dilemmas center on "protect existing structure vs reshape it" — repair the crumbling bridge or rebuild it better?
- **Eye (revelation↔discretion):** Truth-seeker vs Secret-keeper tension. Broader scope: perception, awareness, divination risks, surveillance vs privacy, the cost of knowing too much. Not just "reveal vs conceal."
- **Retired stoicism↔passion split:** Passion aspects → `loyalty_ambition` (drive). Stoicism aspects → `sacrifice_survival` (endurance). Per-content-item assignment, not blanket.
- **Content completeness:** All new prose content (turning points, fears, meeting dilemmas, strand entries) written as part of Phase 12 — no placeholders. System feels complete when this phase ships.

### Archetype UI placement
- Archetype names appear in: agent profile epithet + meeting encounter framing prose
- **Threshold:** Strong lean only (>0.6 or <-0.6) earns an archetype label
- **Hybrid naming:** "The [Dominant] of [Modifier-domain]" pattern using thematic domain words (not reach or sphere names). E.g., "The Protector of Secrets", "The Shaper of Harvests"
- **Meta-axis excluded:** courage↔prudence (Vanguard/Watcher) does NOT participate in archetype epithets — reach-bound axes only
- **Knowledge-gated:** Archetype name revealed through observation/interaction, part of AgentKnowledge progressive disclosure system from Phase 11

### Reach color adoption
- Adopt sphere color hues, darken for contrast on Threadbare dark background
- TB-075's proposed colors used as starting point, with Life green and Energy gold darkened for badge text readability

### Agent detail grid layout
- 3×3 grid → 2×4 grid (two rows of four reaches) for all UI surfaces
- Both AgentDetailPanel and ProwessTab updated (both still in use)

### Migration safety
- Commit granularity at Claude's discretion — optimize for "each commit passes tsc + tests"
- TB-075's 3-commit suggestion as guidance, not rigid requirement

### Claude's Discretion
- Exact commit boundaries during implementation
- Quintessence passive regeneration rate constant
- Thematic domain words for the modifier pattern (e.g., what "Shadow" domain becomes — "Secrets"? "Whispers"?)
- Exact hex color values after darkening sphere palette for contrast

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cosmological refactor
- `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md` — TB-075 implementation plan. Covers type system changes, mechanical propagation, content rewrite, UI polish, tests. The primary blueprint for this phase.

### Sphere system (Phase 10 — upstream dependency)
- `.planning/phases/10-sphere-affinity/10-CONTEXT.md` — SphereAffinity data model, pressure system, 8 creation spheres, opposition pairs. Quintessence builds on this.

### Agent character sheet (Phase 11 — upstream dependency)
- `.planning/phases/11-character-sheet/11-CONTEXT.md` — AgentKnowledge progressive disclosure, 5-tab AgentProfileModal, ProwessTab. Archetype UI integrates here.

### Cosmological pattern (Obsidian)
- Obsidian → `TheFantasyWorldSimulator/Cosmology/The Cosmological Pattern.md` — Canonical cosmology source. 4-8-8-1 pattern.
- Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-cosmological-symmetry.md` — Brainstorm that led to TB-075.

### Reach/domain documentation
- Obsidian → `TheFantasyWorldSimulator/Domains/reach.flesh.md` — Original Flesh reach documentation (for archive reference)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SphereAffinity` type in `src/types/worldSoul.ts` — Quintessence property can be added adjacent to this
- `ProseKeyword` IPK component from Phase 10 — used to display Quintessence levels in prose
- `AgentKnowledge` system from Phase 11 — gates archetype name revelation
- `REACH_BADGE_COLORS` in `src/components/CMS/registry.ts` — needs direct update
- `VALUE_PAIRS`, `REACH_VALUE_PAIR`, `REACH_DOMAINS` in `src/types/agent.ts` and `src/types/traits.ts` — primary type targets

### Established Patterns
- SphereAffinity on all entity graph nodes — Quintessence follows same pattern (property on graph node)
- IPK prose display (Phase 10) — Quintessence uses same approach, no numbers to player
- Knowledge-gated facets (Phase 11) — archetype name revelation hooks into existing system
- Triangle number scale for spheres — Quintessence uses simpler 0–1.0 linear scale instead

### Integration Points
- `phaseSpherePressure` (orchestrator position 9.5) — Quintessence erosion from overchannel wires here
- `encounterProgressionV2` — failed encounters can erode Quintessence
- `AgentProfileModal` 5-tab layout — archetype epithet in header, ProwessTab grid change
- `AgentDetailPanel` — grid layout 3×3 → 2×4
- `backstory-content.ts`, `strand-content.ts`, `meeting-content.ts` — new content for Stone/Eye pairs
- `unified-action-templates.ts` — ~25 motivation renames from `humility_pride`
- `archetype-content.ts` — ~4 entries with flesh reachAffinities

</code_context>

<specifics>
## Specific Ideas

- Hybrid archetype epithets should feel evocative and literary: "The Protector of Secrets" not "Iron-Shadow archetype"
- Stone dilemmas: "repair the crumbling bridge or rebuild it better?" — Fortress vs Forge
- Eye dilemmas: broader than just secrets — perception, divination risk, surveillance vs privacy
- Quintessence zero-state should feel dramatic and narrative, not mechanical — "dissolution encounters" with prose outcomes
- The 10-level Quintessence lexicon (Fraying → Absolute) from TB-075 is confirmed

</specifics>

<deferred>
## Deferred Ideas

- **Quintessence-specific player actions** — Restore, Sacrifice, Shatter as new action category. Rich design space but separate from the migration.
- **Obsidian vault restructuring** — Moving/rewriting Flesh vault notes beyond archiving. Separate documentation pass.
- **Foundation governance** — TB-075 explicitly defers this.
- **Archetype epithets in more UI surfaces** — ProwessTab per-reach labels, StrandView desires section. Can be added incrementally after base system ships.

</deferred>

---

*Phase: 12-flesh-reach-migration-to-quintessence*
*Context gathered: 2026-03-29*
