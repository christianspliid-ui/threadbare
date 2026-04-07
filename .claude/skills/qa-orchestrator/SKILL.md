---
name: qa-orchestrator
description: Use when running a QA sweep of The Fantasy World Simulator UI. Trigger on "run QA", "check the UI", "visual audit", "find UI bugs", "frontend QA", "QA sweep", or after completing a major implementation phase. Dispatches specialist sub-agents for visual style, information architecture, interaction flows, and React code quality.
---

# QA Orchestrator

Systematic QA sweep of The Fantasy World Simulator. Three modes, four specialist agents, structured findings with backlog routing.

## Test Surface Registry

**CRITICAL — Read before every sweep:** This skill maintains a companion file `test-surfaces.md` in the same directory. It lists every testable UI surface (49 components + 7 cross-cutting concerns) with:
- **Surface IDs** (S-001 through S-106, X-001 through X-007)
- **Prerequisites** for reaching each surface
- **Testable actions** per surface

### How Agents Use the Registry

1. **Before dispatching agents:** Read `test-surfaces.md` to know the full surface inventory.
2. **During sweep:** Each agent maps their findings to one or more surface IDs via the `surfaceIds` field.
3. **After sweep:** The orchestrator produces a **coverage report** showing which surfaces were tested vs. skipped. The goal is 100% coverage of non-dev surfaces on full sweeps.
4. **After implementing new components:** Add a new entry to `test-surfaces.md`. This is non-negotiable — an unlisted surface is an untested surface.

### Coverage Tracking

After merging findings from all agents, produce a coverage summary:

```
## Coverage: YYYY-MM-DD
Tested: S-001, S-002, S-010, S-011, S-020, ... (N/49)
Skipped: S-078 (harvest — cycle end not reached), S-091 (dev-only)
Cross-cutting: X-001 ✓, X-002 ✓, X-003 ✗ (not checked), ...
Coverage: N/49 surfaces (XX%)
```

Save coverage data alongside findings in the JSON archive.

## Mode Selection

Ask the user which mode to run, or default to Mode 1 if they said "run QA" without specifics.

| Mode | Name | Browser? | What it does |
|------|------|----------|--------------|
| **1** | Interactive Playtest | Yes (Playwright) | Full sweep: 4 sequential agents audit the live game via browser |
| **2** | Headless Sweep | No | CLI regression check: tests + typecheck + playtest runner + model validation |
| **3** | Targeted Audit | Maybe | Deep-dive on a specific system (user specifies which) |

## Server Isolation

**Every QA session runs its own Vite dev server on an isolated port.** This prevents conflicts with:
- The user's own `npm run dev` on port 5173
- Other Claude Code agents or worktrees running concurrently
- Previous QA sessions that weren't cleaned up

### How it works

1. The orchestrator runs `bash scripts/qa-server.sh start` before dispatching any browser agents
2. The script finds a free port in the 5180–5199 range (away from the default 5173)
3. It starts Vite on that port and writes `{port, pid, url}` to `.qa-server.json`
4. All agent prompts receive the dynamic `QA_URL` (e.g., `http://localhost:5183/?view=game&seeded`)
5. After the sweep, the orchestrator runs `bash scripts/qa-server.sh stop` to clean up

### Orchestrator responsibility

The orchestrator **must** manage the server lifecycle:

```bash
# Before dispatching agents:
bash scripts/qa-server.sh start
# Read the output to get the URL, e.g.: {"port":5183,"pid":12345,"url":"http://localhost:5183"}
# Set QA_URL = "http://localhost:5183"

# After all agents complete (or on failure):
bash scripts/qa-server.sh stop
```

**Never hardcode `localhost:5173` in agent prompts.** Always substitute the dynamic URL from the server start output.

## Prerequisites (Mode 1 and 3)

Before dispatching browser-based agents, verify:

1. **Start isolated QA server** — run `bash scripts/qa-server.sh start` and capture the URL from the output. This is `QA_URL` for all agent prompts.
2. **Playwright MCP connected** — `browser_navigate` must respond
3. **STYLE.md exists** — read it for visual spec reference

**Pre-flight check:** Navigate to `{QA_URL}/?view=game&seeded` via Playwright. This skips worldgen, ascendant selection, AND Meet The First — jumping straight to a fully populated game view with HexMapV2, pre-seeded ascendant identity (Witness/mind+spirit), and The First agent ("Kael Thornweaver") already bonded (seed 42). If the page doesn't load, check `bash scripts/qa-server.sh status` and the log at `/tmp/qa-vite-{port}.log`.

### Game Entry Flow (required for all browser agents)

**Use the quick-start URL:** `{QA_URL}/?view=game&seeded`

This bypasses the entire entry flow and loads directly into the main game view with a valid game state including ascendant identity and a bonded First agent. Wait 2-3 seconds for all components to mount before beginning tests.

Only use the manual entry flow below when **testing the worldgen or selection screens themselves:**

1. **Generate World** — click the "Generate World" button on the world generation screen
2. **Shape Your Divinity** — click the "✧ Shape Your Divinity ✧" button to enter character selection
3. **Select a character** — click one of the 4 archetype cards (e.g., "The Storm Marshal", "The Patient One", etc.)
4. **Ascend** — click the "✧ Ascend ✧" button to enter the game

## Prerequisites (Mode 2)

No browser needed. Just verify the project directory is correct and `npm test` can run.

## Prerequisites (All Modes)

- **`.planning/BACKLOG.md` exists** — for routing findings to the project backlog
- Read `STYLE.md` for visual reference
- Initialize findings collection: `findings = []`

## Finding Schema

Every agent produces findings in this exact JSON structure. Consistent schema enables merging, deduplication, and Notion import.

```json
{
  "id": "VS-001",
  "agent": "visual",
  "severity": "critical",
  "category": "color-violation",
  "backlog": "visual-assets",
  "notionPrefix": "ART",
  "surfaceIds": ["S-030"],
  "title": "Hex map background exceeds brightness ceiling",
  "description": "Background color rgb(244,232,193) computes to 88% brightness. STYLE.md requires world surfaces in 10-40% range.",
  "evidence": "CSS: background-color: rgb(244, 232, 193); HSL: hsl(39, 76%, 86%)",
  "screenshot": "Docs/qa/screenshots/QA-2026-03-10-001.png",
  "location": "HexMap.tsx / SVG background rect",
  "effort": "S",
  "suggestedFix": "Change to oklch(0.25, 0.02, 80) or similar dark warm tone"
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Agent prefix + sequence: VS-001, IA-001, IX-001, RC-001 |
| `agent` | enum | `visual` \| `info-arch` \| `interaction` \| `react-code` |
| `severity` | enum | `critical` \| `major` \| `minor` \| `suggestion` |
| `category` | string | Free-form: `color-violation`, `redundant-text`, `broken-flow`, `anti-pattern`, etc. |
| `backlog` | enum | `content` \| `frontend` \| `architecture` \| `visual-assets` |
| `notionPrefix` | enum | `CB` \| `FE` \| `SYS` \| `ART` |
| `surfaceIds` | string[] | Surface IDs from `test-surfaces.md` (e.g., `["S-030", "S-031"]`). Every finding must map to at least one surface. |
| `title` | string | One-line summary |
| `description` | string | Full description with reproduction steps |
| `evidence` | string? | CSS value, screenshot path, code snippet |
| `screenshot` | string? | Path: `Docs/qa/screenshots/QA-YYYY-MM-DD-NNN.png` |
| `location` | string | File path:line or UI panel name |
| `effort` | enum | `S` (<30min) \| `M` (30-120min) \| `L` (2h+) |
| `suggestedFix` | string? | How to fix it |

### Severity Guide

- **Critical:** Violates STYLE.md hard rules OR breaks core interaction flow
- **Major:** Significantly degrades UX or contradicts design intent
- **Minor:** Polish issue, no functional impact
- **Suggestion:** Improvement opportunity, not a defect

### Backlog Routing Decision Tree

Apply this tree to every finding to set `backlog` and `notionPrefix`:

```
Finding -> Is it a crash, type error, or engine logic bug?
  YES -> backlog: "architecture", notionPrefix: "SYS"
  NO  -> Is it a STYLE.md violation, missing art, or brightness issue?
    YES -> backlog: "visual-assets", notionPrefix: "ART"
    NO  -> Is it repetitive text, thin content pool, or missing template?
      YES -> backlog: "content", notionPrefix: "CB"
      NO  -> backlog: "frontend", notionPrefix: "FE"
```

Edge case: findings spanning two backlogs get filed to whichever backlog owns the fix.

### Agent ID Prefixes

| Agent | Prefix | Example |
|-------|--------|---------|
| Visual Style | VS | VS-001, VS-002 |
| Info Architecture | IA | IA-001, IA-002 |
| Interaction | IX | IX-001, IX-002 |
| React Code | RC | RC-001, RC-002 |

## Agent Prompt Templates

**Read `agent-prompts.md`** (in this skill directory) when dispatching agents. It contains the complete copy-paste prompt for each of the 4 specialist agents with `{QA_URL}` substitution points marked.

**IMPORTANT:** Replace every `{QA_URL}` with the actual URL from `scripts/qa-server.sh start` output before pasting — never pass the literal placeholder string.

| Agent | Prefix | Dispatch with | Tools |
|-------|--------|--------------|-------|
| Visual Style Compliance | VS | `Agent` tool, `general-purpose` | Playwright MCP |
| Information Architecture | IA | `Agent` tool, `general-purpose` | Playwright MCP |
| Interaction & State | IX | `Agent` tool, `general-purpose` | Playwright MCP (full set) |
| React Code Quality | RC | `Agent` tool, `general-purpose` | File system only (Read, Grep, Glob) |

---

## Orchestrator Checklist (Mode 1 — Interactive Playtest)

**IMPORTANT: Create a TodoWrite todo for EACH numbered step.**

This is the rigid flow for a full QA sweep. Do not skip steps. Do not reorder.

### Phase 1: Setup

1. Read this skill file fully
2. Read `test-surfaces.md` (companion file in this skill directory) — this is your surface checklist
3. Read `STYLE.md` for current visual spec
4. **Start isolated QA server:** Run `bash scripts/qa-server.sh start`. Parse the JSON output to get `QA_URL` (e.g., `http://localhost:5183`). If it fails, check the log and tell the user.
5. Pre-flight: `browser_navigate` to `{QA_URL}/?view=game` — must load into game view. Test Notion MCP responds.
6. Initialize findings collection and surface coverage tracker (all surface IDs start as "untested")

### Phase 2: Agent Dispatch (Sequential)

**IMPORTANT:** When constructing agent prompts, replace every `{QA_URL}` with the actual URL from step 4 (e.g., `http://localhost:5183`). Do not pass the literal placeholder string.

7. **Dispatch Agent 1** (Visual Style) — use the prompt template above, substituting `{QA_URL}`. Collect returned findings. Each finding must include `surfaceIds`.
8. **Dispatch Agent 2** (Info Architecture) — use the prompt template above, substituting `{QA_URL}`. Collect returned findings.
9. **Dispatch Agent 3** (Interaction & State) — use the prompt template above, substituting `{QA_URL}`. Collect returned findings.
10. **Dispatch Agent 4** (React Code Quality) — use the prompt template above. Collect returned findings. (No browser needed — no URL substitution required.)

**Why sequential:** Playwright MCP controls a single browser. Parallel agents would conflict. Later agents also benefit from the game state left by earlier agents.

### Phase 3: Merge & Report

11. **Deduplicate:** Same UI element + same issue -> merge, keep the more detailed description. Cross-agent links: if Agent 1 flags a color and Agent 4 finds the hardcoded value -> reference both.
12. **Route:** Apply the Backlog Routing Decision Tree to every finding.
13. **Sort:** Primary: severity (critical->suggestion). Secondary: effort (S->L).
14. **Coverage report:** Collect all `surfaceIds` from all findings. Compare against the full surface registry. Produce coverage summary showing tested vs. untested surfaces and coverage percentage. Flag any non-dev surfaces that no agent touched.
15. **Present:** Show summary to user — "QA sweep found N findings: X critical, Y major, Z minor, W suggestions. Coverage: N/49 surfaces tested (XX%)." Table format with ID, severity, title, effort, backlog. Ask: "Which findings should I add to the backlog? (all / critical+major / select specific IDs)"

### Phase 4: Backlog Integration

16. **Backlog:** Add user-approved findings to `.planning/BACKLOG.md`. Create a section "## QA Findings [YYYY-MM-DD]" with entries using the project's status emoji convention (🔲 Ready to build). Include ID, Severity, Category, Title, and Effort for each finding.
17. **Save raw JSON:** Write all findings to `Docs/qa/YYYY-MM-DD-qa-findings.json` for future diffing. Include a top-level `coverage` object with `tested`, `skipped`, `crossCutting`, and `percentage` fields.

### Phase 5: Surface Registry Maintenance

18. **Update registry:** If any new components were discovered during the sweep that aren't in `test-surfaces.md`, add them now. If any listed components no longer exist, mark them `deprecated`.

### Phase 6: Cleanup

19. **Stop QA server:** Run `bash scripts/qa-server.sh stop`. This kills the isolated Vite process and removes `.qa-server.json`. **This step is mandatory** — even if the sweep failed or was aborted. Leaked server processes waste resources and block ports for future sweeps.

**Failure handling:** If any agent fails or the sweep is aborted early, **still run step 19**. Wrap the entire Phase 2–5 flow in a mental "try/finally" — cleanup always happens.

---

## Mode 2: Headless Sweep

No browser needed. Run these CLI checks and parse output for failures:

1. `npm test` — vitest suite. Parse for FAIL lines.
2. `npx tsc --noEmit` — type checking. Parse for error lines.
3. `npm run validate-model` — world model integrity. Parse for validation failures.
4. If playtest runner is available: `npm run playtest -- --seeds 1,42,100,999 --ticks 100` — multi-seed stability. Parse for anomalies (doom stall, zero dilemmas, population collapse).

**Output:** Summarize results. Any failures become findings with:
- Test failures -> agent "react-code", backlog "architecture", notionPrefix "SYS"
- Type errors -> agent "react-code", backlog "architecture", notionPrefix "SYS"
- Model validation errors -> agent "info-arch", backlog "content", notionPrefix "CB"
- Playtest anomalies -> agent "interaction", backlog "architecture", notionPrefix "SYS"

Then proceed to Phase 3 (Merge & Report) and Phase 4 (Backlog Integration) from the Mode 1 checklist.

---

## Mode 3: Targeted Audit

User specifies which system to audit (e.g., "audit encounters", "check the hex map", "review accessibility").

1. Determine which agent(s) are relevant:
   - Visual issue -> Agent 1 only
   - Layout/density issue -> Agent 2 only
   - Interaction/flow issue -> Agent 3 only
   - Code quality issue -> Agent 4 only
   - Multiple concerns -> dispatch relevant subset sequentially

2. Narrow the agent prompt to focus on the specified system. For example, if auditing encounters:
   - Agent 3 prompt focuses on EncounterLog, encounter lifecycle, threat badges
   - Agent 4 prompt focuses on EncounterLog.tsx, encounter-content.ts

3. Proceed to Phase 3 and Phase 4 from the Mode 1 checklist.

---

## Tracing Integration (Mode 1 and 3)

If the game is running in dev mode, `window.__DEBUG` exposes engine trace access and debug panel control:

```javascript
// Open the debug panel programmatically (also enables tracing):
window.__DEBUG.openDebugPanel();
window.__DEBUG.closeDebugPanel();
window.__DEBUG.toggleDebugPanel();

// Direct trace access:
await window.__DEBUG.enableTracing();
// ... advance ticks ...
const traces = await window.__DEBUG.getTraces();
```

**Use traces to:**
- Verify engine behavior matches UI display (e.g., doom bar visual matches trace doom stage)
- Check trace counts per category ("are dilemmas firing? are encounters progressing?")
- Follow specific agents through their decision pipeline
- Detect zero-activity anomalies (no traces for a category = system might be broken)

**Preferred approach:** Use `window.__DEBUG.openDebugPanel()` to open the panel — this enables tracing automatically and exposes all debug tabs in the DOM for inspection.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Hardcoding `localhost:5173` in agent prompts | Always use `{QA_URL}` from `scripts/qa-server.sh start` output. The user's dev server may be on 5173. |
| Forgetting to stop the QA server | Always run `bash scripts/qa-server.sh stop` after the sweep — even on failure. Leaked processes block ports. |
| Running agents in parallel | Playwright MCP is single-browser. Run sequentially. |
| Using Playwright screenshots for WebGL/Three.js content | Playwright `browser_snapshot` and `browser_take_screenshot` cannot see WebGL canvas content — they only capture a blank `<canvas>`. For hex map (HexMapV2) visual verification, use **Claude in Chrome** tools: `tabs_context_mcp` → `navigate` → `computer` with `action: "screenshot"`. Playwright is still correct for console errors, DOM-based UI, and network checks. |
| Skipping server start (using user's dev server) | QA must be isolated. Start your own server — don't share port 5173. |
| Passing `{QA_URL}` as a literal string | Substitute the actual URL (e.g., `http://localhost:5183`) before dispatching agents. |
| Fixing during sweep | Collect first, fix later. Changing code mid-sweep invalidates later agents. |
| Not saving raw JSON | You lose the ability to diff between QA runs |
| Merging all findings to backlog without asking | Ask user first — they may want to defer suggestions |
| Forgetting backlog routing | Every finding needs `backlog` and `notionPrefix` fields |
| Not reading test-surfaces.md | Every sweep must start by reading the surface registry |
| Adding components without updating registry | New components = new registry entry, same session |
| Findings without surfaceIds | Every finding must map to at least one surface ID |

## When NOT to Use This Skill

- During active implementation (game state unstable)
- For engine-only changes (use unit tests, not browser QA)
- For content/narrative quality review (different concern — use prose skills)
