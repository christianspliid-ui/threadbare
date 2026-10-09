# Dev quick-start — running, CLI, debug bridge, viewport contract

> **Relocated verbatim from `CLAUDE.md` by THR-1718 (2026-10-04).** This page is now the authoritative home of the dev-server commands, the dev quick-start URL table, the headless CLI, the debug bridge levers and the viewport contract. The text below is unchanged; paths in it are repo-root relative, and "this file" / "this section" mean their original place in `CLAUDE.md`. `CLAUDE.md` now carries a short card pointing here.

## Running the Prototype

**Prerequisites:** Node.js 22+ and npm 10+.

```bash
npm install    # first time or after pulling new dependencies
npm run dev    # start Vite dev server with hot reload
```

| Command | What it does |
|---------|-------------|
| `npm run build` | Type-check + production build (outputs to `dist/`) |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run validate-model` | Validate world-model.json integrity |
| `npm run generate-vault` | Regenerate Obsidian vault from world-model.json |
| `npm run generate-hex` | Generate a hex tile image (requires Python + API key) |
| `npm run generate-ul-dashboard` | Regenerate UL dashboard JSON snapshot (auto-runs on `npm run build`) |
| `npm run rebuild-index` | Rebuild Obsidian vault Index.md from all vault pages |
| `npm run cli` | Interactive REPL for headless game testing (see below) |
| `npm run model:power` | Deterministic 1,080-tick scripted-player power-progression model (THR-1745 economies; `-- --model <key>`, `-- --events`, `-- --check` asserts the plan doc's tables) |

**Dev Quick-Start URLs** (append to `http://localhost:5173`):

| URL Param | What it does |
|-----------|-------------|
| `?view=game&seeded` | **Primary dev view.** Full game with pre-seeded ascendant identity (Witness/mind+spirit) AND The First agent ("Kael Thornweaver") already bonded. Use this for all testing that needs a valid game state with threads. **Uses a `large` map** (hunger.witness → 48×36 hexes, ~1010 agents by tick 72) — see note below. |
| `?view=game&seeded&size=medium` | Same as above but forces **medium** map (32×24 hexes, ~414 agents). **Use this if the browser stalls** — `large` map causes a tick-loop performance issue (THR-162/163/164/165). |
| `?view=game&firstunmet&size=medium` | **The Meet-The-First route (THR-874).** Seeded ascendant identity **without** a pre-bonded First, so `isMeetTheFirstAvailable` stays true and the beat auto-triggers as soon as spine Beat 0 ("Reach Down") resolves, at the settlement nearest the avatar (THR-1605 S1 — the same as the real first-run path). Resolve the beat (or `await window.__DEBUG.dismissBeats()`), then read `window.__DEBUG.getMeetingState()` and `await window.__DEBUG.getOpeningState()`. Combinable with `&seeded` (`firstunmet` wins on the First). Prefer `&size=medium` — the identity derives a `large` map (THR-162). |
| `?view=game` | Quick-start game view — ascendant archetype only, **no identity**, no First. Identity-less paths only. **Not** a route to the MeetTheFirst flow: `GameView` mounts that only on `meetingState && ascendantIdentity`, and this URL supplies no identity, so the beat can never render (THR-874). Use `?view=game&firstunmet` instead. |
| `?view=glow` | Magic glow tile preview |
| `?view=codex` | Game codex — browsable catalog of divine actions, possessions, conditions, agreements, mortal actions |
| `?view=styleguide` | **Visual component reference.** All shared primitives with sample data — see what components look like before building UI. |
| `?view=cms` | Content browser |
| `?view=cms#ia-surfaces` | **IA manifest viewer.** Browsable Information Architecture commitment doc — all surfaces with view/mount badges, reads[] tables, and "Open this surface" links. |
| `?view=ul` | **Ubiquitous Language dashboard.** Browseable + searchable glossary across all 7 UL shards with cross-shard search, See-Also navigation, and drift badges. Reads `src/data/ul-dashboard.generated.json` (refreshed via `npm run generate-ul-dashboard`; auto-rebuilt on `npm run build`). |
| `?nofog` | Disable fog of war (fog is ON by default). Combinable: `?view=game&seeded&nofog` |
| `?forceencounters` | **Testing lever (THR-878).** Forces every threaded (non-dormant court position) agent's encounter to render and pop up as if the agent were The First — full prose, full choice set, immediate interrupt instead of silent background/shaping resolution. For reviewing new encounter content (e.g. Nudge Model WS5 batches) without hunting for a rare tug badge. Works on the deployed build too (URL flag, not `window.__DEBUG`). Unthreaded/dormant agents stay invisible — this widens what a threaded agent shows, it does not surface the whole world. Combinable: `?view=game&seeded&forceencounters` |
| `?spawn=<templateId>` | **Direct-URL encounter spawn (THR-883).** Stages the named encounter template on `@hero` at the attended tier and opens it as soon as the world can resolve an agent — a shareable one-click review link for a specific encounter. **First stamps the target as the balanced test avatar** (equal mid-competent capability in all 8 reaches — `DEV_TEST_AVATAR_REACH_RAW`, tuned so a `fair` step forecasts `uncertain` — neutral value axes so THR-894 forks stay reachable both ways, essence floor in all 12 spheres), so review is never skewed by the seeded identity's reach spread. Works on the deployed build (URL flag, the `?forceencounters` pattern). Fail-soft: an unknown id retries briefly, warns once, and the game proceeds. Example: `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge` |
| `?doom=<archetype>` | **Pick the doom (THR-1774).** Every world draws its doom at creation; `?seeded` and `?firstunmet` pin Breach so evidence stays comparable. `?doom=` overrides on any route: `breach`, `convergence`, `changing`, `sundering`, `failing`, `ascension`, `reckoning`. An invalid value warns once and is ignored. Read it back with `(await window.__DEBUG.getOpeningState()).doomArchetype`. Example: `?view=game&seeded&size=medium&doom=reckoning` |
| `?testavatar` | **Balanced test avatar without a spawn (THR-883).** Applies the same balanced stamp to `@hero` for free play — balanced encounter testing across all reaches and spheres wherever the simulation goes. Combinable: `?view=game&seeded&size=medium&testavatar&forceencounters` |
| `?outcome=<band>` | **Review a specific ending (THR-1030).** Pins the resolved outcome of the `?spawn=`ed template, so any authored aftermath band is reachable from a URL instead of by replaying until the dice cooperate — the tails are the *rare* bands by design, so the endings that most need review were the hardest to reach. Bands: `critical_success`, `success`, `success_at_cost`, `near_miss`, `failure`, `critical_failure`. **Requires `?spawn=`** (the pin is scoped to one template, so the rest of the world resolves normally). Applied at the *tail* of step resolution — the roll, floors and riders all run and trace for real, only the band is substituted, so every downstream consequence fires as a real resolution's would. **Always read `await window.__DEBUG.getOutcomePinVerdict()`** (or the `[?outcome]` console line, which works on the deployed build) before trusting the ending: `unauthored_band` means the encounter ended where you asked but nobody wrote that band **on the path the choice resolved to** (THR-1509 — a band authored on the other arm of a fork does not count; the verdict's `variantKey` names the arm and `templateBands` what exists elsewhere) and that path's *base* ending is on screen; `outcome_diverged` means the action aggregated the pinned steps elsewhere (a pinned `near_miss` always does; a pinned `failure` does unless the step's `failBehavior` is `fail_action`). Only `band_rendered` means you are looking at the band. Example: `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_failure` |

**For all testing, use `?view=game&seeded`** — this skips the remembrance flow, ascendant selection, AND the Meet The First encounter, loading directly into a fully populated game with a bonded First agent. Only use bare `?view=game` when testing identity-less paths, and only test the worldgen/selection/remembrance screens when those screens are the subject of the test. **When the Meet-The-First beat *is* the subject, use `?view=game&firstunmet&size=medium`** — `&seeded` pre-bonds The First and makes the beat unreachable by construction (THR-874).

**`?seeded` ≠ `--seed 42` (intentional divergence):** The `?seeded` URL uses the `DEV_ASCENDANT_IDENTITY` (hunger.witness, large map, derived cosmology). The CLI `--seed 42` uses a balanced cosmology and medium map. They generate different worlds with the same numeric seed. For roughly equivalent worlds: use `?view=game&seeded&size=medium` in browser vs `npm run cli -- --seed 42 --map medium`. For large-map CLI testing: `npm run cli -- --seed 42 --map large` (still differs in cosmology).

**Note for automated sessions:** The sandbox VM has isolated networking. Use `npm test` and `npx vite build` to verify (for types, see the Pre-commit note on `tsc -b` — `tsc --noEmit` proves nothing here). The user must run `npm run dev` on their own machine.

### Headless CLI (`npm run cli`)

An interactive REPL for testing the game engine without a browser. **Use this for verifying engine behavior after changes** — it runs the real `initializeGameState` → `runTick` pipeline headlessly.

```bash
npm run cli                          # default seed 42, medium map
npm run cli -- --seed 99 --map small # custom seed + map size
npm run cli -- --seed 42 --map medium --auto-aftermath # default auto-pick enabled for run command
```

Key commands at the `fws>` prompt: `tick [N]` (advance ticks), `run [N] [--auto-aftermath]` (auto-run at N ticks/sec, optional headless aftermath auto-pick), `pause`, `status` (game overview), `agents`, `agent <name>` (inspect one), `events [N]`, `doom`, `mandate`, `essence`, `encounters [agent]`, `aftermath list <agent|@hero>`, `aftermath pick <agent|@hero> [reactionId]`, `spawn encounter <agent|@hero> <encounterId> [--courtPosition X]`, `spawn encounter-context <encounterId> [--agent <agent|@hero>] [--at <location|actor>] [--hex <col> <row>]`, `spawn attachment <agent|@hero> <templateId|name> [--tick N]`, `spawn location <subtype> --hex <col> <row> [--name "..."]`, `spawn sublocation <typeId> (--at <location|actor|@hero> | --hex <col> <row>)`, `spawn npc <role> (--at <location|actor|@hero> | --hex <col> <row>) [--name "..."] [--faction <factionDefId>]`, `factions`, `traces [N]`, `graph` (node counts), `fog` (toggle fog of war on/off), `fog on`, `fog off`, `eval <expr>` (JS with `state` in scope). Type `help` for the full list.

**Two headless-CLI traps (2026-09-25 retro, impediments #1066, #1068, #1069):** `move agent` exists only in the **in-game** debug CLI (`F1`), not `npm run cli` — to place an agent headlessly, rebind its `located_at` edge via `eval`. And the headless world has no bonded First, so `@hero` resolves to an unplaced node: `spawn duel @hero` refuses, while `spawn fight @hero` **silently stages the ascendant** as the fighter. For fight/duel evidence, name a located mortal by id (`eval state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'individual')`).

**When to use the CLI:**
- After modifying tick phases or orchestrator logic — run `tick 30` and check `status` + `events`
- After changing agent decision/movement — inspect with `agents` and `agent <name>`
- For pipeline throughput checks (NFP #7 in Pre-Commit Checklist) — `run 5` for 30+ ticks, then `encounters`, `factions`, `traces`
- Quick smoke test after engine changes when you can't run the browser

### Debug Bridge (`window.__DEBUG`)

Dev-only API exposed on `window.__DEBUG` (tree-shaken in prod). Use from `preview_eval`, `javascript_tool`, or browser console.

The three levers every verification run needs (full JSDoc in the API reference below):

- **`window.__DEBUG.tick(n)`** — advance the simulation headlessly (THR-689); the **only** sanctioned way to satisfy a "run N ticks" browser Done-when — an automated tab reports `document.hidden`, which throttles the interval loop to ~1 tick/click. Clamped to 200/call (`capped:true`, never an error); fail-soft on mid-batch throws; exactly one aggregate trace per call.
- **`await window.__DEBUG.dismissBeats()`** — clear narrative interrupts blocking a capture (THR-1019), resolved through the beat state machine, never DOM clicks; a `selection` beat resolves with its first grant; drains in bounded passes.
- **`window.__DEBUG.suppressBeats(true)`** — auto-resolve beats *as they arrive*; prefer it over repeated `dismissBeats()` when driving `tick(n)` batches. Scope is deliberately narrow: it never touches the encounter veil, Meet-The-First, choice sets, emergence dilemmas, or divine receipts — those are what a verification run is there to observe.

**`src/debug-bridge.d.ts` is the API reference** — every method carries JSDoc with its match semantics and return shape; `src/debug-bridge.ts` is the implementation. Read the `.d.ts` rather than asking for a list. **Most accessors return Promises — always `await` them** (impediments #405, #459, #436, #463): a forgotten `await` reads as an empty object or `evs.filter is not a function`, which looks like a wrong-shape result rather than a missing `await`; and `getEventsSince(0)` returns the 100-entry rolling `recentEvents` buffer, so a before/after diff by array position is meaningless once more than 100 events have fired. Capability areas available there: debug-panel control (`F1` opens straight to the CLI tab; backtick toggles; the in-game CLI accepts pasted multi-line batches), tracing, profiling, health/crash diagnostics, agent navigation, action listing + firing, aftermath reactions, reach signatures, fog of war, encounter-log TSV export, prose-quality audit, orphaned action cards, outcome-ladder distribution + KPI verdicts, ascendant progression, entity-visual resolution, and the war readout (armies/battles).


## Viewport Contract (1920×1080)

The game fills exactly one viewport. **Nothing scrolls. Nothing renders below the fold.**

- **CSS enforcement:** `html, body, #root` have `height: 100dvh; overflow: hidden` in `index.css`. Never remove this.
- **Layout rule:** Every full-screen layout must use `h-screen flex flex-col overflow-hidden`. Child panels use `flex-1 overflow-y-auto` for internal scroll.
- **Preview verification:** Always run `preview_resize` to 1920×1080 (or the user's specified resolution) **before** taking screenshots. The default Playwright/preview viewport is not 1920×1080 — it can be any size.
- **WebGL/Three.js verification:** Playwright `preview_snapshot` and `preview_inspect` cannot see WebGL canvas content — they only see a blank `<canvas>` element. For visual verification of the hex map (HexMapV2) or any Three.js/WebGL content, use **Claude in Chrome** (`mcp__Claude_in_Chrome__*` tools): `tabs_context_mcp` → `navigate` → `computer` with `action: "screenshot"` or `action: "zoom"`. Playwright is still useful for console errors, network requests, and DOM-based UI around the canvas.
- **Modal/overlay rule:** Modals use `max-height: 75vh` (the value `src/components/shared/Modal.tsx` ships). Absolute-positioned overlays (InterventionConfirm, AgendaPicker) must use `inset: 0` within their parent, never exceed the parent's bounds.
- **Test for it:** If a component renders off-screen at 1920×1080, that's a bug — same severity as a broken interaction.
