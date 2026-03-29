# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Completed `✅` items are archived in `BACKLOG_HISTORY.md`.
>
> **Kanban states:** `💡` idea · `📋` todo · `🎨` design · `📐` plan · `🏗️` dev · `✅` done
> Append `▶` when a phase is complete and ready for the next agent (e.g. `📐▶` = plan done, ready for Claude Code).
> Full protocol: `Docs/cowork-ways-of-working.md` → "Unified Kanban"
>
> **IDs:** Every item gets a `TB-XXX` prefix. IDs are permanent — never reused, even after deletion. Next ID: **TB-075**.

---

## 📐▶ TB-074 · Encounter Tuning & Agent Variety — Full Tuning Pass (2026-03-29)

Fix the 7 root causes from encounter log analysis (seed 42): content deserts, zero movement, small pools, no difficulty escalation, born-later starvation, undifferentiated capability, score display bug. Introduces familiarity discount, exploration bonus, encounter chains, dynamic difficulty, personality amplification, dynamic cooldowns, broader template mapping.

5 phases (A–E), 4 recommended Claude Code sessions. Phase A (template coverage expansion) is the highest-impact single change.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`
**Analysis source:** `Docs/analysis/2026-03-29-encounter-log-analysis-seed42.md`
**Depends on:** Encounter system (✅), Agent Decision Pipeline (✅), Sphere Affinity (✅)

---

## 💡 TB-073 · Conflict & Destruction — Armies, Sieges, Battles (2026-03-27)

Scale up Iron Reach from individual encounters into army-scale conflict visible on the hex map. Armies as graph entities with size/strength/morale/leader, moving with faction goals (capture settlement, raid trade route, defend territory). Battle resolution from skirmishes (encounter-scale) to army clashes (multi-step narrative events). Sieges as multi-tick encounters with escalating stakes. Sacking destroys sublocations, tanks prosperity, displaces population, creates ruins. War disrupts trade routes. Divine intervention in battles. Army supply lines connect to trade routes (M3). Folds in TB-051 (Monster Encounters) as wilderness threats.

Five phases: M2.1 army entities & warfare design, M2.2 battle/siege resolution, M2.3 destruction & consequences, M2.4 army visibility & UI, M2.5 monster encounters integration.

**Roadmap:** `.planning/ROADMAP.md` → M2
**Depends on:** Faction system (✅), Encounter system (✅), HexMapV2 (✅), Agent Movement (✅)
**Needs design:** Yes — full design pass with NFP compliance, new node type (army), wiring section

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

*Items completed during March 18 sessions:* axiological vocabulary alignment ✅, sphere opposition table ✅, 14 social encounter templates ✅, shortest-path graph utility ✅, deprecated reputationScore migration ✅

---

## Deferred Items

### From Hex Chronicle Redesign (2026-03-15)

- **TB-019 · Exploration Hook Generation** — Design a system that generates hooks from ruin locations, unexplored POIs, encounter seeds, sphere anomalies, historical artifacts
- **TB-020 · Soul Layer Prose Enrichment** — Cross-sphere prose templates for how spheres interact in the same hex

### Content Backlog

- **TB-021** · SVG resource icons to replace emoji placeholders (🪵🪨⛏️💧🐟🌾🌽🟤)

### Frontend Polish

- **TB-022** · Responsive layout (currently viewport-locked to 1920×1080)
- **TB-023** · Onboarding / first-minute clarity pass

### Developer Tools

- **TB-024** · Content authoring UI (CMS at `?view=cms` exists but read-only)
- **TB-025** · Constants tuning panel with live editing

---

## 🧊 Ice Box

Ideas that need significant design work or aren't urgent.

- **TB-026** · OCEAN personality model for agents
- **TB-027** · Bonds/leverage system between agents
- **TB-028** · Resources system v2 (production chains, scarcity)
- **TB-029** · Ascendant Creation Experience — guided flow for the player to create and customize Ascendants (powerful former mortals). Domain capability selection, sphere alignment, visual identity, backstory generation within constraints.
- **TB-068** · Tilted Camera View — Middle-mouse pitch control for 3/4 oblique map view. Major arch change: camera math, d3-zoom coord mapping, frustum calc, sprite billboarding, hex picking. Needs design decisions on dynamic vs fixed tilt, ortho vs perspective, angle limits.
