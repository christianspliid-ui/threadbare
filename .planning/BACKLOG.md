# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Completed `✅` items are archived in `BACKLOG_HISTORY.md`.
>
> **Kanban states:** `💡` idea · `📋` todo · `🎨` design · `📐` plan · `🏗️` dev · `✅` done
> Append `▶` when a phase is complete and ready for the next agent (e.g. `📐▶` = plan done, ready for Claude Code).
> Full protocol: `Docs/cowork-ways-of-working.md` → "Unified Kanban"
>
> **IDs:** Every item gets a `TB-XXX` prefix. IDs are permanent — never reused, even after deletion. Next ID: **TB-094**.

---

## 📋 TB-089 · Reputation-Gated Encounter Content (2026-03-31)

Author encounter templates that require or are blocked by reputation traits. E.g., "Warlord's Tribute" requiring `trait.reputation.iron.positive` level 2, "Assassination Plot" requiring `trait.reputation.iron.negative` level 2, "Court Audience" blocked by `trait.reputation.shadow.negative`. Create 10-20 templates across reaches to make reputation meaningful in gameplay.

**Depends on:** Reputation Trait System (✅)

---

## 📋 TB-090 · Reputation Polarity Tags on Existing Encounters (2026-03-31)

Tag high-value existing encounter templates with explicit `reputationPolarity` for precision. Currently Layer 2 (encounter type heuristic) and Layer 3 (axiological profile) handle all encounters — explicit tags give content authors fine-grained control over which polarity an encounter feeds.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-091 · Social Bond Shift from Reputation Reactions (2026-03-31)

Add `computeReputationBondShift()` to `socialEncounterGeneration.ts` — when agent A evaluates agent B for social encounters, B's reputation traits' `reactions` array modifies the bond modifier. A feared warlord gets different social encounters than a beloved healer. Plug into `computeBondModifier()`.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-092 · Faction Reputation Aggregation (2026-03-31)

Faction nodes themselves should earn reputation traits based on aggregate member activity. Scan `member_of` edges, tally member reputations, assign faction-level traits. A faction whose members complete many Shadow encounters becomes Shadow-negative "Infamous". Affects faction-level encounters and recruitment.

**Depends on:** Reputation Trait System (✅)

---

## 💡 TB-093 · Reputation Traits in CMS Registry (2026-03-31)

Add reputation trait definitions to the CMS content browser registry so they can be browsed alongside other traits. Show reach, polarity, reactions, scoring modifiers, and encounter gates.

**Depends on:** Reputation Trait System (✅)

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

## 💡 TB-051 · Monster Encounters — Residual Scope (2026-03-27, core delivered in M2.5)

M2.5 delivered the core monster system: monster types, lair seeding, escalation, sphere feedback, encounter templates, army attrition, lair icons, divine targeting. Remaining scope is stretch/polish:

- Monster roaming (territory patrol, expansion beyond lairs)
- Graduated threat scaling with world age / tick count
- Monster taxonomy expansion (beasts, undead, elemental, corrupted subtypes)
- Province role consumer (danger gradient computed but unused by monsters)

**Core delivery:** Phase M2.5 (4 plans, 2026-03-30)
**Depends on:** Encounter system (✅), Layer Revelation (✅), Hex Actions (✅)

---

## 💡 TB-037 · Meet The First — Onboarding Auto-Trigger

Auto-trigger the Meet The First encounter on the player's first visit to a populated hex. Free re-rolls, tutorial affordances (tooltips explaining encounter flow, archetypes, values, reaches), and a guided first-time experience. Wraps the repeatable TB-035 action in an onboarding shell.

**Depends on:** TB-035 (Meet The First)
**Needs design:** Yes — deferred from TB-035 design session (2026-03-26)

---

## ✅ TB-031 · Culture Seeding — Territory-Aware Placement (Phase 1)

Cultures now get geographic homelands via the province flood-fill system. Pipeline reordered: cultures generated before worldgen, provinces seeded per culture, locations and actors inherit culture from their province. Homeland/border strength differentiation, diaspora mechanics, backward-compatible.

**Preliminary design:** `Docs/plans/2026-03-25-culture-and-agent-seeding-preliminary-design.md`
**Completed:** 2026-03-31

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

## 💡 TB-082 · Notification Navigation — Encounter/Faction/Journey Modals (2026-03-30)

Notification click navigation works for agents, hexes, and locations. Three handlers remain stubbed in `useNotificationNavigation.ts`: `onOpenEncounter` (needs active encounter modal), `onOpenFaction` (needs FactionDetailModal), `onOpenJourney` (needs Journey tab navigation). Each is optional — gracefully no-ops when absent.

**Depends on:** Respective modal implementations

---

## Implementation Prerequisites (from 2026-03-18 design session)

Audited 2026-03-30:

- [x] Step tick duration backfill — `duration?: number` field exists on EncounterStep (optional, defaults to 1)
- [x] Attachment reachBonus backfill — `reachBonus` populated on all artifact definitions in reward-attachment-catalog.ts
- [ ] Trait resolutionBonus backfill — Engine reads `resolutionBonus` from trait nodes but no trait definitions populate it yet
- [x] ~~Promotion trait names~~ — N/A: promotions use TickEvents + tier advancement, not trait acquisition
