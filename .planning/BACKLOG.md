# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Completed `✅` items are archived in `BACKLOG_HISTORY.md`.
>
> **Kanban states:** `💡` idea · `📋` todo · `🎨` design · `📐` plan · `🏗️` dev · `✅` done
> Append `▶` when a phase is complete and ready for the next agent (e.g. `📐▶` = plan done, ready for Claude Code).
> Full protocol: `Docs/cowork-ways-of-working.md` → "Unified Kanban"
>
> **IDs:** Every item gets a `TB-XXX` prefix. IDs are permanent — never reused, even after deletion. Next ID: **TB-078**.

---

## 🏗️ TB-074 · Encounter Tuning & Agent Variety — Full Tuning Pass (2026-03-29)

Fix the 7 root causes from encounter log analysis (seed 42): content deserts, zero movement, small pools, no difficulty escalation, born-later starvation, undifferentiated capability, score display bug. Introduces familiarity discount, exploration bonus, encounter chains, dynamic difficulty, personality amplification, dynamic cooldowns, broader template mapping.

5 phases (A–E), 4 recommended Claude Code sessions.
- ✅ **Session 1** (2026-03-29): Phase A (template coverage ≥8 per location type) + Phase E.2 (score display fix) + Phase E.1 (dynamic cooldowns)
- ✅ **Session 2** (2026-03-29): B.1 (familiarity discount) + B.2 (exploration bonus) + B.3 (travel cost dampening) + D.1 (personality amplification)
- 📋 **Session 3**: D.2 + C.1 (born-later spawn fix + difficulty escalation)
- 📋 **Session 4**: C.2 (encounter chains)

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`
**Analysis source:** `Docs/analysis/2026-03-29-encounter-log-analysis-seed42.md`
**Depends on:** Encounter system (✅), Agent Decision Pipeline (✅), Sphere Affinity (✅)

---

## 📋 TB-075 · Born-Later Spawn & Difficulty Escalation (TB-074 Session 3)

Phase D.2: `selectSpawnLocation()` prefers locations with encounter cache entries so born-later agents spawn near content, not empty wilderness. Constants: `BORN_LATER_PREFER_CONTENT_LOCATIONS=true`, `BORN_LATER_MIN_TEMPLATES=3`.

Phase C.1: `selectDifficultyTier()` applies early/mid/late difficulty scaling based on tick thresholds, applied during encounter cache rebuild. Constants: `EARLY_GAME_THRESHOLD=40`, `MID_GAME_THRESHOLD=120`, `DIFFICULTY_TIER_MULTIPLIERS={early:0.8, mid:1.0, late:1.3}`.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md` → Phases D.2, C.1
**Depends on:** Encounter system (✅), Agent spawn pipeline (✅), TB-074 Sessions 1-2 (✅)

---

## 📋 TB-076 · Encounter Chains (TB-074 Session 4)

Phase C.2: Multi-stage encounter sequences that create narrative arcs. `EncounterChain` data type with ordered template stage IDs, `ChainProgress` agent property tracking `chainId→stageIndex`, wired into `filterByPrerequisites` (Stage 3 placeholder). 3 starter chains: Scholar's Path, Rise Through the Ranks, Merchant's Gambit. Constants: `CHAIN_COMPLETION_CAPABILITY_BONUS=0.05`, `CHAIN_STAGE_SCORE_BONUS=0.15`, `MAX_ACTIVE_CHAINS=2`.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md` → Phase C.2
**Depends on:** Encounter system (✅), TB-074 Sessions 1-2 (✅)

---

## 📐▶ TB-077 · Graph-Native Encounter Lifecycle (2026-03-29)

Promote encounter outcomes from ephemeral flat-array state to durable `event` nodes in the world graph. Creates `participated_in` (agent → event) and `occurred_at` (event → location) edges, enabling graph-queryable encounter history for prose enrichment, location flavor, and agent biography. Three layers designed: L1 encounter event nodes (immediate), L2 goal edges (deferred), L3 active encounter projection (deferred pending UnifiedAction migration).

4 phases: 1A type definitions + event creation wiring, 1B graph query utilities, 1C prose resolver integration, 1D debug visibility.

**Design doc:** `Docs/plans/2026-03-29-graph-native-encounter-lifecycle-design.md`
**Depends on:** Encounter system (✅), Graph engine (✅), Encounter Reward Wiring (✅)

---

## 📐▶ TB-073 · Conflict & Destruction — Armies, Sieges, Battles (2026-03-27, designed 2026-03-29)

Scale up Iron Reach from individual encounters into army-scale conflict visible on the hex map. Armies as graph entities with size/strength/morale/leader, moving with faction goals (capture settlement, raid trade route, defend territory). Battle resolution from skirmishes (encounter-scale) to army clashes (multi-step narrative events). Sieges as multi-tick encounters with escalating stakes. Sacking destroys sublocations, tanks prosperity, displaces population, creates ruins. War disrupts trade routes. Divine intervention in battles. Army supply lines connect to trade routes (M3). Folds in TB-051 (Monster Encounters) as wilderness threats.

**Roadmap:** `.planning/ROADMAP.md` → M2
**Design doc:** `Docs/plans/2026-03-29-conflict-and-destruction-design.md`
**Brainstorm:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-conflict-and-destruction.md`
**Depends on:** Faction system (✅), Encounter system (✅), HexMapV2 (✅), Agent Movement (✅), TB-072 Sphere Affinity (✅)

**Plans:** 7/7 complete (`.planning/phases/12-conflict-destruction/`)
- [x] 12-01-PLAN.md — Mercenary Company + faction ambition system
- [x] 12-02-PLAN.md — Army entity types + army spawning encounters
- [x] 12-03-PLAN.md — Army movement + Quintessence attrition
- [x] 12-04-PLAN.md — Battle resolution + spotlight encounters
- [x] 12-05-PLAN.md — Siege resolution + regional encounters
- [x] 12-06-PLAN.md — Destruction + aftermath consequences
- [x] 12-07-PLAN.md — Army visibility + UI + debug panel

---

## 💡 TB-071 · Economy Second Pass — Dynamic System Connections (2026-03-27)

Make the economy dynamic by connecting encounters, factions, locations, and actions into the prosperity/wealth/trade systems. Key opportunities: encounter outcomes generating prosperity shocks, economic context modifying encounter scoring, wealth spending crossover actions (Gold→Iron/Shadow/Heart/Stone), trade route lifecycle driven by agent behavior (bandits, patrols, guild competition), unrest from economic causes (inequality, monopoly), divine economic interventions, and resource consumption creating scarcity pressure.

**Brainstorm:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-economy-second-pass.md`
**Depends on:** Gold Reach Phase 1-2 (✅), Faction Vertical Slice (✅), Control Effects (✅), Encounter Reward Wiring (✅)

---

## 💡 TB-069 · Location Non-Agent Characters (NPCs) (2026-03-27)

Locations should be populated with non-agent characters — named or unnamed NPCs that give places a sense of life and population without being full graph-walking agents. Think innkeepers, market vendors, town guards, wandering scholars, shrine keepers. They provide flavor, potential encounter hooks, quest givers, and a sense that the world exists beyond the player's spotlight agents. Design questions: how are NPCs represented (lightweight graph nodes? location properties? a new sublocation feature?), how do they interact with encounters and the action system, can agents have relationships with them, and do they ever "graduate" to full agent status?

**Brainstorm:** `brainstorm-location-npcs.md`

---

## 💡 TB-051 · Monster Encounters — Design Pass

Hostile creature encounters in the world. Monsters as graph entities with territorial behavior, threat levels, and encounter templates. Needs full design covering: monster archetypes and taxonomy (beasts, undead, elemental, corrupted), spawn rules (terrain-gated, sphere-influenced, ruin-adjacent), encounter resolution (agent capability checks vs monster threat tier), player intervention options during monster encounters, loot/consequence tables, and how monsters interact with existing systems (control effects, hex state, agent decision-making, social fabric).

**Existing infrastructure to leverage:**
- **Province roles already computed:** Every hex is classified as `capital` / `heartland` / `borderland` during worldgen Pass 01 (`provinceRoles` in `WorldGenContext`, types in `worldgen/types.ts`, assignment in `pass01-provinces.ts`). Proportional: bottom 15% capital, next 40% heartland, remaining ~45% borderland. Currently unused by any downstream system — monster encounters could be the first consumer.
- **Culture settlement distinction:** `cultureId` null = wilderness province (unclaimed), non-null = settled. Gives a second danger axis on top of province roles.
- **Political region types in world-model.json:** `region.wilderness`, `region.contested-zone`, `region.tribal-lands` etc. — narrative region flavors that could map to monster density or type pools.
- **Natural danger gradient:** capital (safe) → heartland (occasional threats) → borderland (frequent) → wilderness/unclaimed (dominant). This is ready-made infrastructure, not something that needs to be built from scratch.

**Key design questions:**
- Are monsters persistent graph nodes or transient encounter events?
- Do monsters have territory (hex presence) or roam via movement system?
- How do monsters interact with the layer revelation system (e.g., ruins monsters only after ruins layer revealed)?
- Can the player create/summon monsters via hex actions, or only encounter them?
- How does monster threat scale with world age / tick count?
- Relationship to the Nine Reaches — do monsters have domain capabilities, or a simpler threat model?
- How to wire province roles into GameState so the danger gradient is available at runtime (currently only in WorldGenContext)?

**Depends on:** Encounter system (✅), Layer Revelation (TB-042 ✅), Hex Actions (TB-036 ✅)
**Needs design:** Yes — full design pass required

---

## 💡 TB-037 · Meet The First — Onboarding Auto-Trigger

Auto-trigger the Meet The First encounter on the player's first visit to a populated hex. Free re-rolls, tutorial affordances (tooltips explaining encounter flow, archetypes, values, reaches), and a guided first-time experience. Wraps the repeatable TB-035 action in an onboarding shell.

**Depends on:** TB-035 (Meet The First)
**Needs design:** Yes — deferred from TB-035 design session (2026-03-26)

---

## 💡 TB-031 · Culture Seeding — Territory-Aware Placement

Cultures should have geographic coherence: homeland clusters, border zones, diaspora. Currently culture assignment ignores location entirely. Needs full design pass.

**Preliminary design:** `Docs/plans/2026-03-25-culture-and-agent-seeding-preliminary-design.md`

---

## 💡 TB-032 · Agent Seeding — Pre-Existing Relationships

Agents should start with bonds, faction hierarchy, and narrative hooks instead of spawning as isolated strangers. Seed `relates_to` edges, faction leadership ranks, and opening situations. Needs full design pass.

**Preliminary design:** `Docs/plans/2026-03-25-culture-and-agent-seeding-preliminary-design.md`

---

## 💡 TB-017 · Chain Reactions / Trigger System

Lightweight trigger system: "when cursed edge added at this location, also add unrest +10." Player actions cascade through world in visible, traceable ways. Must stay deterministic and traceable per NFPs.

**Depends on:** Location State Fields, Attachment Action Templates

---

## 💡 TB-018 · Cosmological Manipulation

Player targets foundation axes (chaos↔order, light↔darkness) directly. Globally modifies action difficulty, terrain stability, agent behavior. Very expensive essence cost, dramatic narrative payoff.

**Depends on:** Generalized Action Targeting (✅), Hex Terrain State
**Needs design:** Yes

---

## Implementation Prerequisites (from 2026-03-18 design session)

Several of these may already be done — verify before starting.

- [ ] Step tick duration backfill — Add `duration` to all 64 encounter template steps
- [ ] Attachment reachBonus backfill — Add `reachBonus` to existing attachments
- [ ] Trait resolutionBonus backfill — Add `resolutionBonus` to existing traits
- [ ] Promotion trait names — 45 entries (5 per reach × 9 reaches) for tier signifiers
