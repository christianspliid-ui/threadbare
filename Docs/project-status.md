# Project Status
> Updated 2026-04-19.
## Current Focus
**GuildQuestPanel shipped (THR-180).** Settlement LocationView now shows a "Guild Postings" panel (collapsible, default expanded) when an Adventurer's Guild hall sublocation is present. Reads active quest hooks stamped by phaseRuinQuestHooks (THR-156); click-through navigates to ruin hex. Next: THR-153 (PR 5 — Ruin transformation + PlaceOfPower, model:opus).

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phase 0 complete. ✅ Phase 1 TG (THR-89). ✅ Phase 2 AC (THR-91). ✅ Phase 3 CG (THR-92). ✅ Phase 4 BF (THR-93). ✅ Phase 5 MC (THR-94). Merge held on BF until THR-134 U4 closes.
- **Content Architecture (Now):** Shell/primitive work — stateful shells (Phase 2), progress/service shells (Phase 3), starter libraries (Phase 4), governance (Phase 5). ✅ THR-86 shipped (routine template structural variety). THR-88 next.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ THR-168 tokens. ✅ THR-169 typography floor. ✅ THR-170 primitives. ✅ THR-183 Vara seed. ✅ THR-172 SphereIcon. ✅ THR-173 Thread Panel. ✅ THR-174 viewport audit. **Project complete.**
- **Attention Tier Model (Now):** ✅ THR-16 curator metadata. ✅ THR-18 siege templates + digest wiring. UI integration ongoing.
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. THR-78 queued.
- **Thematic Pressure & Living World (Next):** THR-19 Omen Agenda shipped. ✅ THR-122/125/126/80/128/127 shipped. Nothing left in Ready for Dev. THR-87 (cool failure prose) blocked by THR-116.
- **Agent Success Redesign (Next):** Phases 1-4 shipped. Phases 5-8 queued.
- **Rarity Model (Next):** Three deferred Phase D items.
- **Procedural Hex Vignettes (Next):** Phases 2-5 queued.
- **Prose Content Quality Pass (Archived 2026-04-16):** Scope subsumed. THR-86/88 → Content Architecture; THR-87 → Thematic Pressure; THR-82/83/84/85 → Encounter Format Migration.
- **Next up:** Phase 4 content migration — next guild faction encounter templates.

## Recent Completions (2026-04-19) — THR-186
- **THR-186 — Ambient agent phase caps (deferral from THR-162):** Early-exit predicates in three O(N_all) tick phases. Effect Tick: skip agents with no `possesses`/`bonded_to`/`has_trait` edges before calling `tickEffects` — avoids agentNode/location resolution for ~80% of ambient NPCs. Mastery Decay: skip agents with no `has_trait` edges — ambient NPCs never accumulate mastery traits. Familiarity Gain: `FAMILIARITY_PROXIMITY_HEX_RANGE=0` constant + `hexDistance` guard (same-hex behavior preserved). `TickPhaseProfileTrace` emitted once per phase per tick (totalActors/processedActors/skippedActors). Deferral THR-188 filed for hex→actor index. tsc clean, build green.

## Recent Completions (2026-04-19) — THR-180
- **THR-180 — GuildQuestPanel (deferral from THR-156):** New `GuildQuestPanel.tsx` renders active Adventurer's Guild quest hook postings in settlement LocationView sublocation branch. Collapsible panel, gated on Guild hall sublocation presence. Scans ruin nodes within GUILD_QUEST_RADIUS, filters by QUEST_HOOK_COOLDOWN_TICKS, sorts Saga→Major→Minor then by distance. Row click navigates camera to ruin via handleZoomToLocation. Exported hexDirection from questHooks.ts for prose parity. 10 unit tests. tsc clean, build green.

## Archived to project-history.md
- THR-34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 (2026-04-18/19) and earlier — see project-history.md


## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: `.planning/BACKLOG.md` · Completed work: `Docs/project-history.md`
