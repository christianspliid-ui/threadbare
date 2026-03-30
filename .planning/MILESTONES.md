# Milestones

## v1.0 Foundation (Shipped: 2026-03-30)

**Phases completed:** 22 phases, 81 plans
**Codebase:** 1,055 TS/TSX files, 85,313 LOC, 485 test files
**Timeline:** 33 days (2026-02-26 → 2026-03-30), 1,512 commits

**Key accomplishments:**
- Three.js hex map renderer — 60K hexes via InstancedMesh, 4-tier zoom LOD, fog of war, organic coastlines via stencil-clipped marching squares
- Continuous-field world generation — heightmap → temperature → moisture → rivers → 27 biomes with fantasy overlay pass
- Per-entity sphere affinity system — 8 creation spheres as integer scores, pressure resolution, magic-as-sphere-fluency, World-Soul aggregation with IPK prose
- Agent character sheet overhaul — 5-tab layout with multi-faceted knowledge model, familiarity-gated revelation, discovery action cards
- Army-scale conflict — faction ambitions, army spawning/movement/attrition, battle & siege resolution, destruction & aftermath, refugee generation
- Monster encounters — lair escalation through 3 tiers, sphere-tinted map icons, danger gradients, monster factions, divine targeting
- Threads panel — sidebar shows all graph-connected nodes (agents, armies, factions, artifacts, locations), floating detail view
- Action feedback — MTG-style action cards with Ars Magica spell names, WebGL particle bursts on activation, outcome toasts
- Mercenary company pipeline — multi-instance faction seeding, mercenary encounters, promotion system
- Encounter pipeline fixes — scoring rebalance, movement difficulty scaling, round-robin distribution, content desert elimination

**Known gaps:**
- RNDR-01: 60K hex 60fps not formally benchmarked at 200x300 grid (works in practice)
- ELEV-04: Altitude text labels on peaks intentionally deferred

**Requirements:** 134/136 v1 requirements complete (see `milestones/v1.0-REQUIREMENTS.md`)

---

