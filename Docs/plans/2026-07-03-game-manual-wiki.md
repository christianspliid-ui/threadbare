---
status: proposal
created: 2026-07-03
author: cowork
linear: THR-585 (Game Manual Wiki project)
---

# Game Manual Wiki — Domain Model, Architecture Assessment & Page Plan

**Intent (user, verbatim):** "expanding on tick-cycle-reference.html and the other pages, I would like a full wiki of all the major game systems described as a basic game manual for the player and for me as a creative director. … assess the full game architecture from a game design point of view, and create the game domain model and tickets for CC to create the individual pages." Follow-up directive: "add to our ways of working that when the code of core game systems is changed, the relevant wiki must be updated."

**Verdicts settled with the user (2026-07-03):** extend the existing Design Reference Wiki (served HTML in `public/`, registered in `wiki-manifest.json`); one page per system with two layers (player-manual prose first, Designer Notes second); full domain model now with tiered ticket delivery; new Linear project **Game Manual Wiki**.

---

## 1. Game-design architecture assessment

Synthesis from `Docs/canon/rulebook.md`, the UL shards, the orchestrator phase plan (42 phases / 12 acts), the IA manifest (~62 surfaces), and `src/data/` (~150 content files).

**Strengths (what the architecture gets right):**

1. **Orthogonal cosmology as a combinatorial engine.** Eight Reaches × twelve Spheres with no subsumption gives every action, encounter, and faction two independent axes of flavor. This is the game's content multiplier and its clearest structural asset.
2. **One resolution spine.** Sigmoid → d100 everywhere, one template format (`UnifiedActionTemplate`) across both encounter pipelines, and ascendants using the same prerequisite system as mortals. Low rules overhead relative to simulation depth — rare and valuable.
3. **The three-beat turn matches the fantasy.** Scan → curated moment → aftermath maps the god's-eye premise onto an attention economy. Turn-based commitment (settled 2026-04-16) protects it.
4. **Dual clocks create real economy.** Doom vs. Mandate competing for the same essence is a genuine strategic dilemma, not a timer.
5. **Graph-native world + trace discipline** makes emergence inspectable — the precondition for "failure is plot" being verifiable rather than aspirational.

**Gaps and risks (design POV):**

1. **Legibility debt is the #1 risk.** 42 tick phases, ~62 UI surfaces, prose-first display with no numbers — but no player-facing explanation layer beyond the codex. Players cannot form causal models of a simulation this deep without a manual. **This wiki is load-bearing, not nice-to-have.** It is also the creative director's drift detector: writing the player layer exposes systems that cannot be explained simply.
2. **Back-of-run is thinner than front-of-run.** Twilight, Echoes, and World-Soul are mostly `[DESIGN]` (partial types, partial harvest wiring) while the opening spine and encounter engine are `[IMPL]` and rich. The metaprogression promise carries the emotional thesis of the game; its wiki page will make the gap explicit.
3. **The curated-chapter promise is under-delivered relative to systems depth.** THR-457 KPI baseline: 89% encounter failure rate, 0 branching fires. The systems can host great chapters; the content volume (THR-467 target ~1000+ surfaces) and tuning aren't there yet. The manual should describe the *intended* experience with honest `[DESIGN]` flags.
4. **Breadth-vs-depth asymmetry in the living world.** Social/narrative systems (factions, personality, secrets, cultures) are deep; economy and military are broad but shallow (decay phases, simple promotion rules). That asymmetry is *correct* for this game — economy and armies are texture, not core — but the manual should say so, or players will assume an economic sim that isn't there.
5. **Documentation drift is already visible.** The wiki-manifest blurb for `encounters-agents-reference` still says "Nine Reaches" (Flesh was absorbed into Quintessence, TB-075). Two mega-pages already exist with no freshness mechanism. Hence the user's ways-of-working rule, made mechanical in §4.
6. **Attention/digest and stealth are the least documented of the core systems** despite being the anti-overwhelm and risk-economy mechanisms respectively. They get dedicated coverage (pages 15–16).

**No rulebook impact:** this plan documents rules of play; it changes none. UL is the terminology authority for every page; where a page and UL disagree, UL wins and the page is a drift bug.

---

## 2. Game domain model

The major systems, grouped into seven domains. Each maps to exactly one wiki page (rightmost column). Existing deep pages remain as a separate wiki section.

| Domain | Systems | Key engine surfaces | Wiki page |
|---|---|---|---|
| **Identity & Cosmology** | Ascendant identity (hunger/domains/sphere), two-domain permanence, reach signatures, beats spine | `ascendantBeat.ts`, `remembrance` types, `reach-signature-content.ts` | run-lifecycle, cosmology |
| | Eight Reaches × Twelve Spheres, Quintessence, archetype-pair moral axes | UL Cosmology shard, `phaseQuintessence.ts` | cosmology |
| **The Turn** | Scan → curated moment → aftermath, tick=2h, 12/day, pause-until-player | `orchestrator.ts`, attention constants | turn-structure |
| **Acting on the World** | Five verbs, Generalized Action Targeting, Reach+Sphere prerequisites, reach signatures | `getTargetActionSlots()`, 119+ UATs, `action-catalog.html` | divine-actions |
| | Threads, influence tiers (0–4 / six names), thread awareness, court positions, The First, Campbellian journey, familiarity/worship | `influence.ts`, `familiarity.ts`, `journeyEngine.ts` | threads-court |
| | Per-sphere essence, regeneration, control slots, sustained effects, contestation, strategic projects | `essenceIncome.ts`, `phaseControlEffects.ts`, `controlContestationResolver.ts` | essence-control |
| | Stealth vs two audiences, detection pressure, hidden marks, intel decay; generated rival gods and their actions | `stealth.ts`, `phaseDetectionPressure.ts`, `rival.ts` | stealth-rivals |
| **Story Engines** | Two encounter pipelines, hex-granular awareness, seeding, sigmoid→d100, aftermath reactions, dilemmas, four design rules | `encounter*.ts`, `resolution.ts`, `encounterAwareness.ts` | encounters-manual |
| | Attention pool/tiers/tugs, digest buffer, chronicle, narrative feed, prose/IPK/enrichment | `phaseAttention.ts`, `digestBuffer.ts`, `proseGenerator.ts` | attention-story |
| **The Stakes** | Doom clock (7 archetypes × 5 stages), escalation events, omen agenda, journey beats; Victory Mandate (3 stages); clock interplay | `phaseDoom.ts`, `phaseMandate.ts`, `phaseOmenAgenda.ts` | clocks |
| | Twilight phase, echo harvest (Legacy/Monument/Relic), World-Soul (Fundament + Resonance), next-cycle seeding, per-account unlocks | `worldSoul.ts` types, harvest-screen UI, sphere aggregation | twilight-worldsoul |
| **The Living World** | Maslow needs pipeline, agent decision, ambitions, personality & moral drift, lifecycle, mentorship, NPC graduation | `agentDecision.ts`, `ambitionTick.ts`, personality phases | agents |
| | Factions (ambitions/actions/reputation/succession/schism), chosen faction powers, cultures, secrets & favors | `faction*.ts`, `culturalGravity.ts`, `secretGeneration.ts` | factions-cultures |
| | Hex map, three-tier position, terrain & hex state, magical saturation, fog/visibility | `visibility.ts`, `phaseHexState.ts`, hexmap canon | world-map |
| | Sublocations, settlement promotion, prosperity, unrest, trade routes, resources | `phaseSublocations.ts`, `phaseProsperity.ts`, `phaseUnrest.ts` | settlements-economy |
| | Armies (movement/attrition), battles, lairs, sieges | `armyMovement.ts`, `battleResolution.ts`, `lairEscalation.ts` | armies-battles |
| **Meta / Interface** | Run lifecycle: worldgen, remembrance, ascendant selection, Meet The First, run end, unlock model | worldgen, remembrance flow, unlock model (THR-390) | run-lifecycle |
| | HUD, panels, drawers, modals — where every system shows its face | `ia-manifest.ts` (~62 surfaces) | interface |

Non-player-facing systems deliberately excluded from the manual: phase registry/orchestrator internals, trace/telemetry/KPI, tick health monitor, debug bridge (already documented in CLAUDE.md and tick-cycle-reference).

---

## 3. Wiki information architecture

Two sections in `wiki-manifest.json` (`section` field):

- **Manual** — the 17 new dual-layer pages below. Player layer first, Designer Notes second.
- **Deep Reference** — existing pages: `tick-cycle-reference` (rename section only), `encounters-agents-reference`, `action-catalog`. Unchanged content; they become the drill-down targets of Designer Notes links.

**Page template convention (all Manual pages):**

1. `<h1>` title + one-line "what this system is" in plain language.
2. **How it plays** — player-manual voice. Plain, readable, concrete (per the established prose-plainness bar). Narrative descriptions, no raw constants, no code identifiers. Describes the *current shipped* behavior; anything design-only is introduced with "planned:" phrasing.
3. **Designer notes** — clearly delimited section: `[IMPL]/[DESIGN]/[OPEN]` status flags mirroring the rulebook convention, key tunables (named constants + values + file), pipeline/phase pointers, links to canon pages, UL shard anchors, and the relevant deep-reference page. Open questions are *referenced* from the rulebook's Open Questions list — pages never mint new open questions (surface in chat instead).
4. Managed nav via `<!--WIKI-NAV-->` markers (generator-owned; do not hand-write nav).
5. Self-contained static HTML matching the visual style of the existing pages (dark, serif headings, collapsible sections welcome). No external CDNs.

**Terminology:** UL wins. Every page must use UL shard terms exactly (e.g., Eight Reaches, thread awareness `unaware|intuition|faith|communion`, court positions `the_first|retinue|watched|dormant`). Game title in player-facing copy: **Threadbearer**.

---

## 4. Infrastructure & ways of working (Tier 0 ticket)

**New working agreement (user directive, 2026-07-03, settled):** *when the code of a core game system is changed, the relevant wiki page must be updated in the same PR.*

Made mechanical in three parts:

1. **Manifest `sources` field.** Each `pages[]` entry in `public/wiki-manifest.json` gains an optional `sources: string[]` of repo globs (e.g. `"src/engine/stealth*.ts"`). The globs are listed per-page in §5 and are the freshness contract.
2. **Advisory freshness lint — `npm run check:wiki-freshness`.** New script `scripts/check-wiki-freshness.ts`, chained into `npm run check:process` (advisory, same as `check:design-wiki`). For the current branch vs `origin/main`, if changed files match a page's `sources` globs and the page file is not also changed, print a warning naming the page. Advisory while it stabilizes; threshold to flip to blocking decided later by the user.
3. **CLAUDE.md Definition of Done bullet** (added by Cowork in this pass, committed via flush): "Update the Design Reference Wiki — if the change touches a core game system documented by a wiki page (see `sources` globs in `public/wiki-manifest.json`), update that page in the same PR."

Also in the Tier 0 ticket: add the `Manual` / `Deep Reference` sections to the manifest; fix the "Nine Reaches" → "Eight Reaches" drift in the `encounters-agents-reference` blurb; remove `opening-system` from `backlog` (absorbed by run-lifecycle page); extend `check:design-wiki` to validate the new `sources` field shape.

**Constants table (NFP #1):**

| Constant | Default | Purpose |
|---|---|---|
| `WIKI_FRESHNESS_MODE` | `advisory` | Lint severity; flip to `blocking` only on user verdict |
| `WIKI_FRESHNESS_BASE` | `origin/main` | Diff base for changed-file detection |

**Fail-soft table (NFP #4):** lint cannot resolve git diff (sandbox/CI edge) → print "wiki-freshness: skipped (no diff available)" and exit 0. Malformed `sources` glob → warn, skip that page, exit 0. Missing manifest → defer to `check:design-wiki` failure, exit 0 here.

**Tracing (NFP #2):** N/A — build-time tooling and static docs; no runtime state. Inspectability is served by the lint's explicit per-page output.

**Blast radius:** no `src/` file with ≥100 importers is touched by any ticket in this plan (scripts/, public/, Docs/, CLAUDE.md only). Section omitted per policy.

---

## 5. Page inventory & ticket specs

Complexity and Suggested model per the user's delegation guidance (advisory — the CC automation runs Opus regardless). **Tier 1 = core loop, queue first. Tier 2 = living world & meta.** Every page ticket: add the HTML to `public/`, register in manifest (`section: "Manual"`, with `sources`), run `npm run generate-design-wiki`, browser-verify at 1920×1080.

Shared acceptance criteria (all page tickets): dual-layer template (§3) followed; UL-exact terminology; `[IMPL]/[DESIGN]` flags in Designer Notes sourced from `Docs/canon/rulebook.md` and per-domain canon; no new open questions; nav markers present; page renders without console errors.

### Tier 0

**W0 — Wiki infrastructure & freshness guardrail.** Everything in §4. Complexity: medium. Suggested model: Sonnet. Mutex with: all page tickets (wiki-manifest.json). First in queue but does not block pages (pages may include `sources` before the lint exists; the field is inert until W0 lands).

### Tier 1 — the core loop

**W1 — run-lifecycle-reference.html — "A Run, Start to Finish."** Complexity: complex. Suggested model: Opus.
Player layer: what a run is; remembrance and choosing who you were; the two permanent domains; meeting The First; the opening beats spine (Beat 4 "A Path Opens", god-path choice, primary reach signature); the middle game; how runs end (either clock); what carries over between runs (per-account permanent unlocks, run-start picker). Designer layer: `AscendantIdentity`, beat director + `BeatDefinition.grantsReachSignature`, `DEV_ASCENDANT_IDENTITY` dev seeds, unlock model verdicts (THR-390), worldgen entry points. Sources: `src/engine/ascendantBeat*.ts`, `src/engine/worldGeneration*.ts`, `src/types/remembrance.ts`, `src/data/archetype-content.ts`, `src/data/backstory-content.ts`.

**W2 — cosmology-reference.html — "Reaches, Spheres & Quintessence."** Complexity: complex. Suggested model: Opus.
Player layer: the Eight Reaches as what-you-do; the Twelve Spheres (Foundation four as elder magic discovered through ruins — never at chargen; Creation eight) as what-fuels-it; orthogonality in play (same Reach, different Sphere = different texture); archetype-pair moral axes per Reach (Iron: Protector ↔ Conqueror, all eight); Quintessence as narrative centrality, explicitly not a ninth Reach; Domain Capability tiers in narrative terms. Designer layer: sphere opposition pairs, `NARRATIVE_LEXICON` 10-tier ladder, sphere pressure/aggregation phases, canon pointer `Docs/canon/cosmology.md` (authoritative), UL Cosmology shard. Sources: `src/engine/phaseSphereAggregation*.ts`, `src/engine/phaseQuintessence*.ts`, `src/engine/capability*.ts`.

**W3 — turn-structure-reference.html — "The Three-Beat Turn."** Complexity: medium. Suggested model: Opus.
Player layer: scan → curated moment → aftermath and why the order is load-bearing; time (tick = two hours, twelve per day, world waits for you); "do nothing is always valid"; encounters as chapters (3–6 per session target, flagged design). Designer layer: orchestrator single-step contract, `TICKS_PER_DAY`, pacing plan pointer (2026-05-04 encounter experience plan), link to tick-cycle-reference for the full 42-phase order. Sources: `src/engine/orchestrator.ts` (header + runTick signature only — page documents the beat contract, not the phase list).

**W4 — divine-actions-reference.html — "Divine Actions & Prerequisites."** Complexity: complex. Suggested model: Opus.
Player layer: five verbs (Create/Find/Change/Destroy/Control) with Control as the signature; Find gates Change/Control ("you can't shape what you haven't seen"); every detail view is an action target; why some cards never appear (Reach outside your two domains — permanent; Sphere misalignment; insufficient capability); the two reach signatures as story-moment acquisitions. Designer layer: Generalized Action Targeting cascade (node-type → subtype → traits → sphere → essence → range), `getTargetActionSlots()`, `requiresReach` gate (THR-503), `spherePowerMultiplier` (THR-548), bucket taxonomy, link to action-catalog. Sources: `src/engine/*targetActionSlots*.ts`, `src/data/reach-signature-content.ts`, `src/data/action-template-content.ts`, `src/types/unifiedAction.ts`.

**W5 — threads-court-reference.html — "Threads, the Court & The First."** Complexity: complex. Suggested model: Opus.
Player layer: the thread as a two-way bond (your investment vs their experience: unaware → intuition → faith → communion); court positions (The First, retinue, watched, dormant); The First's hero journey (five Campbellian phases); familiarity — how mortals come to know you; the trade (deeper threads = cheaper aligned nudges, louder divine signature). Designer layer: `InfluenceTier 0–4` vs six-name design ladder (rulebook Open Q #1), `ThreadEdgeProperties.awareness`, thread-familiarity grant phase, influence tier promotion phase, agent feedback plan (THR-402). Sources: `src/engine/influence*.ts`, `src/engine/familiarity*.ts`, `src/engine/journeyEngine*.ts`, `src/types/influence.ts`.

**W6 — essence-control-reference.html — "Essence, Control & Sustained Power."** Complexity: complex. Suggested model: Opus.
Player layer: per-sphere essence pools; where essence comes from (worshippers, places of power, portfolio depth); the tight economy as intended texture; Control as sustained commitment — slots, upkeep, and the fact that rivals can usurp or shatter what you hold; strategic projects. Designer layer: `EssencePool`, `EssenceDistribution` (0.35/0.25 primary/secondary), essence phase, control effect sustain models (drain/threshold/ritual — [DESIGN]), contestation resolver, slot-cap formula status (not finalised — [DESIGN]). Sources: `src/engine/essenceIncome*.ts`, `src/engine/phaseControlEffects*.ts`, `src/engine/controlContestationResolver*.ts`, `src/engine/phaseStrategicProjects*.ts`, `src/types/influence.ts`.

**W7 — encounters-manual-reference.html — "Encounters & Aftermath."** Complexity: medium (deep page exists; this is the player-voice layer). Suggested model: Sonnet.
Player layer: the encounter as framed chapter; branching vs recurring (linear template) encounters; awareness — see the hex, see everything on it; one resolution curve for peasants and gods (described narratively); aftermath as the mortal's trajectory shift; failure is plot, not punishment; dilemmas. Designer layer: the four encounter design rules verbatim; sigmoid→d100 pointer; seeding + hidden marks; `Docs/canon/encounters.md` as spec authority; deep-dive link to encounters-agents-reference; KPI reality check (THR-457 baseline) flagged honestly. Sources: `src/engine/encounter*.ts`, `src/engine/resolution*.ts`, `src/engine/encounterSeeding*.ts`, `src/data/*-encounter-content.ts`.

**W8 — clocks-reference.html — "Doom, the Mandate & Omens."** Complexity: complex. Suggested model: Opus.
Player layer: the Doom Clock (seven archetypes named and characterized; five stages Whispers → Culmination; escalations as world events); the Victory Mandate (declared win-state, three stages); the essential tension — one essence pool, two clocks; omens and journey beats as the pressure made visible. Designer layer: `DOOM_CLOCK_ARCHETYPES`, `DoomCardEffectType` systemic effects, mandate wiring status, interplay exchange-rate not yet tuned (rulebook Open Q #5), omen agenda phase. Sources: `src/engine/phaseDoom*.ts`, `src/engine/doomClock*.ts`, `src/engine/phaseMandate*.ts`, `src/engine/phaseOmenAgenda*.ts`, `src/types/doomClock.ts`, `src/data/doom-content.ts`, `src/data/omen-templates-content.ts`.

**W9 — interface-reference.html — "Reading the Interface."** Complexity: medium. Suggested model: Sonnet.
Player layer: a guided tour — the hex map; always-on HUD (essence panel, doom bar, omen indicator, mandate tracker, ascendant bar, attention indicator); the panels (threads, retinue, chronicle, rivals); the ActionDrawer; encounter screen and veil; toasts/alerts; where each system from this manual shows its face (cross-link every other Manual page). Designer layer: IA manifest as the authority (`?view=cms#ia-surfaces`), viewport contract 1920×1080, surface → reads[] discipline. Sources: `src/data/ia-manifest.ts`.

### Tier 2 — the living world & the long game

**W10 — agents-reference.html — "The Mortals."** Complexity: complex. Suggested model: Opus.
Player layer: mortals pursue their own goals — six-layer needs ladder in plain terms; ambitions; personality continuums and moral drift (choices tilt them along their Reach's archetype axis); growth, mentorship, lifecycle (aging, death, graduation from background to named). Designer layer: Maslow pipeline, seeded probabilistic scoring (rejected: utility AI, behavior trees), personality phase family (THR-527/544/545/561/562 wave), decision-phase perf status (THR-581), deep-dive link. Sources: `src/engine/agentDecision*.ts` (or `phaseAgentDecision*.ts`), `src/engine/ambitionTick*.ts`, `src/engine/agentLifecycle*.ts`, `src/engine/phases/personality*.ts`, `src/engine/phaseMentorship*.ts`.

**W11 — factions-cultures-reference.html — "Factions, Cultures & Secrets."** Complexity: complex. Suggested model: Opus.
Player layer: factions with ambitions of their own — reputation, succession, schism; anointing a chosen faction; cultures as gravity wells (names, traits, tension); secrets and favors as social currency. Designer layer: faction phase family, `chosenFactionPowers`, cultural gravity/insight, secret generation + clue decay, per-faction content files. Sources: `src/engine/factionReputation*.ts`, `src/engine/phases/faction*.ts`, `src/engine/phases/schism*.ts`, `src/engine/cultur*.ts`, `src/engine/secretGeneration*.ts`, `src/data/*-definition.ts`.

**W12 — world-map-reference.html — "The World: Hexes, Terrain & Sight."** Complexity: medium. Suggested model: Sonnet.
Player layer: the hex world; where things are (hex → location → sublocation, one tier at a time); terrain and how it changes (corruption, divine influence, magical saturation); fog of war and what "seeing" means. Designer layer: hexes-are-not-graph-nodes (load-bearing), three-tier `located_at` model, hex-distance awareness (rejected: location-hop), visibility recalc phase, hexmap canon pointer. Sources: `src/engine/visibility*.ts`, `src/engine/phaseHexState*.ts`, `src/engine/phaseMagicalSaturation*.ts`, `src/engine/hexActorIndex*.ts`, `src/engine/encounterAwareness*.ts`.

**W13 — settlements-economy-reference.html — "Settlements, Prosperity & Trade."** Complexity: medium. Suggested model: Sonnet.
Player layer: hamlets become towns become cities (and fall back); prosperity and unrest as the settlement's pulse; trade routes; resources and anomalies. Honest scope note: the economy is texture serving story, not a trading sim. Designer layer: promotion/reassessment phases, prosperity/unrest thresholds, trade route decay, economic traits/chronicle. Sources: `src/engine/phaseSublocations*.ts`, `src/engine/phaseSettlement*.ts`, `src/engine/phaseProsperity*.ts`, `src/engine/phaseUnrest*.ts`, `src/engine/phaseTradeRouteDecay*.ts`.

**W14 — armies-battles-reference.html — "Armies, Battles & Lairs."** Complexity: medium. Suggested model: Sonnet.
Player layer: armies march, tire, and clash; battles resolve in the world (not a tactics screen); lairs escalate if left alone; sieges. Scope note: war is a story generator, not a wargame. Designer layer: army movement/attrition, battle detection/tick, lair escalation, siege encounter content. Sources: `src/engine/armyMovement*.ts`, `src/engine/armyAttrition*.ts`, `src/engine/battleResolution*.ts`, `src/engine/lairEscalation*.ts`.

**W15 — stealth-rivals-reference.html — "Stealth, Detection & Rival Gods."** Complexity: medium. Suggested model: Sonnet.
Player layer: two audiences watch you — mortals (whose disbelief becomes faith) and rival gods (who scan for signatures in their domain); detection pressure by region; hidden marks; the rivals as generated beings with their own agendas (rejected: fixed pantheon); what rivals do to your works. Designer layer: `stealth.ts` two-audience computation, detection pressure phase, stealth decay, rival action phase, hidden mark/intel decay. Sources: `src/engine/stealth*.ts`, `src/engine/rival*.ts`, `src/engine/phaseHiddenMarkDecay*.ts`, `src/engine/phaseIntelligenceDecay*.ts`, `src/data/rival-content.ts`.

**W16 — attention-story-reference.html — "Attention, the Digest & the Chronicle."** Complexity: medium. Suggested model: Sonnet.
Player layer: you cannot watch everything — the attention pool; tugs when a thread strains; the digest (what happened while you looked away); the chronicle and narrative feed as the run's book being written. Designer layer: `ATTENTION_BASE_CAPACITY`, attention tiers (Attention Tier Model project), digest buffer, prose pipeline family + IPK (learning-engine framing), enrichment placeholders, prose canon pointer. Sources: `src/engine/phaseAttention*.ts`, `src/engine/attentionTier*.ts`, `src/engine/digestBuffer*.ts`, `src/engine/narrative*.ts`, `src/engine/prose*.ts`.

**W17 — twilight-worldsoul-reference.html — "Twilight, Echoes & the World-Soul."** Complexity: complex; highest `[DESIGN]` density — flags mandatory. Suggested model: Opus.
Player layer: how a run ends — you witness, you do not act; the harvest (Legacy from mortals, Monument from places, Relic from artifacts); the World-Soul remembering (Fundament coefficients, Resonance fragments); the next world as a response, not a sequel; the metaprogression promise (kind-of-god as ingredient). Designer layer: `worldSoul.ts` types vs wired reality (sphere aggregation is [IMPL]; harvest partially; next-cycle seeding partial), harvest-screen surface, Twilight authorship vs emergence (rulebook Open Q #6). Sources: `src/types/worldSoul.ts`, `src/engine/phaseSphereAggregation*.ts`, `src/components/**/Harvest*`.

---

## 6. Three-pillar check

- **Engine: N/A** — no engine, tick, or `src/` runtime changes. The only code is build-time lint tooling (`scripts/`). Rationale: this is a documentation + process feature.
- **Content: PRESENT** — 17 authored HTML pages (§5) are the content deliverable; UL/canon/rulebook are the source spine.
- **UI: PRESENT** — the wiki hub gains a Manual section; every page carries generator-owned nav; pages are player-facing surfaces served from `public/` and deployed via Vercel. Browser-verify artifact per page: Playwright screenshot at 1920×1080 (DOM-only pages — no WebGL).
- **Wiring: PRESENT** — manifest registration → prebuild generator → hub/nav injection → `check:design-wiki` + new `check:wiki-freshness` in `check:process`; CLAUDE.md DoD bullet closes the loop from code changes back to pages.

## 7. NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — lint constants named (§4); pages document constants rather than hardcode claims |
| 2 Inspectability | PASS with note — no runtime traces (N/A, build-time); lint output is explicit per page |
| 3 Determinism | PASS — generator + lint are pure functions of manifest + git diff |
| 4 Fail-soft | PASS — fail-soft table §4; lint is advisory and never blocks builds |
| 5 Narrative > mechanical | PASS — player layer is narrative-first, numbers live in Designer Notes |
| 6 Additive > destructive | PASS — all additions; existing pages untouched except manifest section + one blurb fix |
| 7 Performance budget | PASS — static HTML; prebuild cost is one glob pass |

## 8. Alternatives considered

- **Obsidian vault as the wiki surface** — rejected with user: invisible to the deployed game and to players; vault remains the domain-model layer, wiki links point at canon instead.
- **Two separate page tracks (player manual vs designer reference)** — rejected with user: doubles pages and doubles drift surface; dual-layer single pages keep the freshness contract one-to-one with systems.
- **Blocking freshness lint from day one** — rejected: `check:process` convention is advisory-first while a lint stabilizes; flipping to blocking is a later user verdict.
- **One mega-manual page** — rejected: the two existing mega-pages already show the drift/maintenance cost; per-system pages give the `sources` contract its granularity.

## 9. Vision & rulebook audit

No Vision premise is contradicted; the manual quotes Vision framing (god-not-protagonist, failure-is-plot, cosmic melancholy) rather than reinterpreting it. No rule of play changes; `Docs/canon/rulebook.md` needs no edit. The wiki adds a fourth documentation surface *within* the existing Design Reference Wiki pattern (`Docs/design-reference-wiki.md`), which W0 updates to describe the Manual section and freshness contract.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-03. Intent-judge verdict: **Allow** (impact class corrected to High-risk for the CLAUDE.md edit; explicit user sign-off verified; 0 gaps, 0 violations).*

### NFP audit

NFP AUDIT: PASS-with-notes. All seven PASS except NFP #2 (Inspectability) PASS-with-note: tracing is declared N/A by author assertion (build-time tooling, no runtime state); precedent THR-490 (Prose QA static read) supports the exemption. Full table in audit log; constants table §4, fail-soft table §4, determinism via pure functions of manifest + git diff, all-additive changes, static-HTML performance profile all confirmed.

### Three-pillar audit

PILLAR AUDIT: PASS-with-notes. Engine: N/A-with-rationale (docs + build-time lint only, no orchestrator coupling). Content: present-and-substantive (17 dual-layer pages, per-page scope + sources globs). UI: present-and-substantive (served pages, generator-owned nav, Playwright 1920×1080 verification named). Notes: this is a multi-ticket program plan — per-ticket "Files to touch"/"Done when" checklists and coordination blocks live in the W0–W17 Linear issues rather than this synthesis doc, and the Wiring section is prose rather than the single-ticket template table. Accepted as a structural property of a program plan; each Linear ticket carries the tabular detail.

### Vision audit

VISION AUDIT: PASS-with-notes. No contradictions found. God-not-protagonist, prose-carries-narrative, cool-failure, dual-clock framing all confirmed as quoted rather than reinterpreted. Note: the auditor's sandbox could not reach the Obsidian-vault Vision files and audited against `Docs/design-brief.md` (fresh, 2026-06-11) as the documented fallback.
