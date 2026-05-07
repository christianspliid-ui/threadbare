# Project Status
> Updated 2026-05-07.

## Current Focus
**THR-352 complete — Encounter UI Phase A3 keyframes canonicalized in runtime CSS.** Added missing `thrum-fade` and canonical aliases (`threadDraw`, `threadPulseTaut`, `dustMoteDrift`, `cardFlipReveal`, `pageDim8pct`, `breatheBrightNode`) in `src/index.css`, retained hyphen-case compatibility for v7 references, and annotated each keyframe with Moment/beat consumer comments for inspectability.
**THR-331 complete — Encounter UI Phase C2: EncounterChoiceCard + OutcomeForecastBand + MoralAxisTilt.** Three new UI primitives in `src/components/Game/Encounter/` rendering the center-column divine-choice surface. Forecast band derives a 5-tier qualitative read (`doomed`/`perilous`/`uncertain`/`favorable`/`favored`) from a numeric `successProbability` prop and surfaces 1 factor by default, hover-expanding to up to `FORECAST_FACTORS_VISIBLE_HOVER_MAX = 4`; the numeric input is never displayed. Choice card renders the full §5.3 anatomy — sphere label · cost, god-verb, agent reaction, tilts-toward, `MoralAxisTilt` line (`↬ tilts toward CONQUEROR`-style), fail-forward (`↗ on fail — …`), optional consumes-item indicator. Sphere colour resolution uses the `data-reach` cascade in `src/index.css`; `quintessence` falls back to `--accent-gold`. Wired into `?view=styleguide` for visual verification at 1920×1080. 26 jsdom tests cover keyboard activation, selected-state border, all five tier labels, and a numeric-string regression check (`/[0-9]/`).
**THR-351 complete — Encounter UI Phase A2 scaffold finalized.** Added callback-eligibility trace interface and explicit additive GameState scaffold fields (`regionalDetectionPressure`, `encounterSpotlight`) with safe defaults in `initializeGameState`, preserving legacy aliases for compatibility.
**THR-330 complete — Encounter UI Phase C1 scaffold landed.** Added `EncounterScreen` (440px hero rail + flex center + 540px right rail + 100px bottom strip), `EiraHeroPanel`, and `CapabilityStrip` with jsdom coverage for shell zones and protagonist sections.
**THR-338 complete — Encounter UI Phase E2: five typed detail page instances (Encounter Experience).** Engine: `detailPageGenerator` (cached, fail-soft), `detailPageResolvers` (graph-walking section resolvers per `(pageKind, typeId)` row + mandatory-floor fallback resolvers), schema registry in `src/data/detailPageTemplates.ts`, fallback prose pools in `src/data/detail-page-fallback-templates.ts`, empty `SHOWCASE_AUTHORING` stub in `src/data/detail-page-showcase.ts` for THR-318 Stream 2. UI: `useOpenDetailPage(gameState)` hook returning typed `openActor/Item/Faction/Place/Event/Ref` callbacks; `DetailPageOpenerContext` lets the Section dispatcher route chip / event-card / `data-term` clicks through a single provider. Tests: 13 generator unit tests + 12 integration snapshot tests at 1920×1080 covering all 5 kinds + 4-deep stack + chip-click → opener invocation. 10,836 tests pass; tsc clean; vite build green. PR pending.

**Encounter Experience — active:** THR-331 ✅ (C2 choice card + forecast band), THR-330 ✅ (C1 shell), THR-338 ✅ (E2 five typed detail pages). Recent: THR-323 (B1 choice resolution + drift), THR-324 (B2 outcome forecast), THR-325 (B3 hand filter), THR-337 (E1 DetailModal shell), THR-351 (A2 GameState scaffold). Plan docs landing for the remaining phase suite.

## Milestone Status
- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** Shipped — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Encounter Format Migration (Now):** ✅ Phases 0-9 complete. All guilds migrated.
- **Content Architecture (Now):** ✅ THR-86/88/239 shipped.
- **UI Visual Overhaul — Design System v1 (Now):** ✅ Project complete.
- **Continuous Improvement (Now):** THR-303/305/306/307/309/311/312/313/314/315/316 ✅. THR-304 In Implementation Planning (Phase 5b/UL children pending).
- **Social Systems Expansion (Now):** THR-28/27/30/51/29/41/34/31/35 shipped. ✅ THR-254/253. THR-78 queued.
- **Thematic Pressure & Living World (Next):** ✅ THR-19/122/125/126/80/128/127. THR-87 blocked by THR-116.

## Archived to project-history.md
- THR-322/321/320/315/309/307/308/306/302/305/301/299/298/297/296/294/282/238/109/79/108/107/104/103/106/290/102/280/285/286/283/287/276/284/277/281/211/243/272/212/210/247/253/26/101/254/259/257/36/134/100/182/252/225/164/99/10/246/95/233/188/153/187/96/165/88/185/186/180/34/125/80/128/127/184/94/174/162/152/167/126/122/81/172/183/170/181/156/18/155/151/29/154/166/150/35/31/173 and earlier — see project-history.md
- 2026-05-06 batch: THR-311, THR-312, THR-313, THR-314, THR-315, THR-316, THR-317, THR-320, THR-321, THR-322, THR-323, THR-336
- 2026-05-07 batch: THR-324, THR-325, THR-349, THR-350, THR-354

## Active Backlog Ideas
- **TB-105–108 Thematic Pressure & Living World Pass** (omen agendas, cool failure, doom identity, intent/activity visibility)
- **TB-095–099 Social Systems Expansion** (v1.2 — designed, ready to sequence)
- TB-071 Economy Second Pass · TB-069 Location NPCs · TB-051 Monster Encounters residual · TB-037 Onboarding

Full backlog: [Linear (Threadbare team)](https://linear.app/threadbare) · Completed work: `Docs/project-history.md` + Linear "Done" state · Pre-Linear history: `.planning/BACKLOG_HISTORY.md`



