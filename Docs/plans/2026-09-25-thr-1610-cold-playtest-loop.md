> **title:** Cold playtest loop — THR-1610
> **linear_issue:** THR-1610
> **author:** Claude Code
> **created:** 2026-09-25
> **three_pillars:** Engine `N/A — no engine code; the loop plays the deployed build from outside` · Content `N/A — the tester brief is harness text, not game content` · UI `N/A — no component changes; the loop observes the UI, it does not alter it`

# Cold playtest loop — THR-1610

*Every agent that touches Threadbearer knows the rules. The loop adds a tester that knows none of them, runs it again whenever the last round's findings are fixed, and says which fixes actually landed for a player.*

## Why this is load-bearing

Every verification lane we run (`playtest-interface`, browser-verify evidence, CLI sweeps, `?seeded` review links) is driven by an agent that has read CLAUDE.md, the UL and the debug bridge, and nearly all of them enter through dev URLs that skip the first-time path. None of them can see what a new player sees. The first cold round (2026-09-25, run by hand) found that **the game's central promise is unreachable on the real front door**: a new player's avatar starts at a shrine, Meet The First needs a settlement, and nothing points the way, so 0 of 3 testers met a mortal (THR-1605). The `?seeded` URL every reviewer uses pre-bonds The First, which is why it went unseen. Round 1 also filed four more bugs and four more design findings (milestone *Cold playtest · round 1*, THR-1600…THR-1609).

The director asked for this to become routine (Christian, 2026-09-25): *"build this test into our harness, so we do it routinely … track if we have fixed the feedback, and when all feedback has been addressed (bugs and gameplay) we run it again."* This plan is that loop: a harness that runs a round, a skill that turns a round into verified, deduplicated tickets and a scorecard, and a daily lane that starts the next round when the last one is fully closed and deployed.

## Substrate inventory

N/A — no Engine pillar. The existing surfaces this plan reuses:

| Existing surface | Status | This plan |
|---|---|---|
| Linear milestones in **Onboarding & First-Run Experience** (`P-THR-12`) | 🟢 ACTIVE (moved Idea → Now 2026-09-25) | extends: one milestone per round; its completion is the re-run trigger |
| `cold-playtest` label | 🟢 ACTIVE (created 2026-09-25) | extends: every finding carries it; the cross-round comparison reads it |
| `scripts/ops-publish.sh` + `ops` branch (THR-947) | 🟢 ACTIVE | extends: round reports + scorecard publish there |
| `keep-work-flowing-cc` step 2.6 sibling fold | 🟢 ACTIVE | extends: add `cold-playtest-round-*` to the fold's report patterns so a round's `## Needs Christian` reaches the briefing |
| `npm run check:deploy` (THR-785) | 🟢 ACTIVE | reuses: a round only starts on a `deployed` verdict |
| `playtest-interface` skill | 🟢 ACTIVE | unchanged: structural regression sweep, explicitly out of scope for gameplay feel. The two are complements, not duplicates |

## How a round works

### The tester (cold by construction)

- A fresh `claude -p` process started **from a directory outside the repo**, so no CLAUDE.md is discovered.
- **`--system-prompt-file` replaces the whole system prompt** with the player brief. `--setting-sources local` loads no user or project settings, hooks or plugins.
- **Tools:** `--strict-mcp-config` loads only the Playwright MCP, pinned in `config.json`, headless, 1920×1080, `--caps vision`. `--permission-mode dontAsk` plus an allow-list restricts it to browser actions.
  - **Eyes:** screenshots.
  - **Hands:** click-by-ref from page snapshots, coordinate clicks for the WebGL map.
  - **Denied:** page scripts, console, network, tabs, and every filesystem/shell tool.
- **The brief** is the store-page pitch (tagline + elevator paragraph from `Docs/plans/2026-04-17-the-game-page-rewrite.md` §2) plus one persona and a playtest-log protocol:
  - before each action: `SEE / WANT / EXPECT`;
  - after it: `GOT … MATCH | SURPRISE`;
  - tags as they happen: `CONFUSED / LOST / HOOKED / BORED / WOULD QUIT`;
  - a fixed 7-section debrief at the end.
- **Start URL:** the bare production URL. No `?view=`, no `?seeded`: the real first-time path is the subject.
- **Personas (fixed across rounds):** `story` (cozy/narrative player, new to strategy), `veteran` (CK/RimWorld/DF), `skimmer` (lunch-break, ten-minute patience). All three run in parallel.
- **Wording constraint (learned in round 1):** the first brief said "think aloud … before EVERY action", and the smoke prompt asked the tester to describe its instructions. Opus's safeguard rejected it as `[reasoning_extraction]`. The brief is phrased as a *playtest log*, like a human tester's notes, and nothing may ask the tester about its own instructions. Do not reword it back.

### The observer (the synthesizing agent)

The tester's beliefs are data, not verdicts. The `cold-playtest` skill (run by the lane, or by hand as `/cold-playtest`) reads the three logs and debriefs, then **verifies every candidate finding against the source on `origin/main`** before filing. Round 1 did exactly this: the "Dev Oracle" surprise traced to a `?view=game` link, and "never met a mortal" traced to the shrine start. Each candidate resolves to one of:

| Class | Meaning | Filed as |
|---|---|---|
| `bug` | cause found in code; behavior is plainly wrong | `Bug` → **Ready for Dev**, full cause + fix + Done-when, coordination block as first comment (THR-836) |
| `design` | behaves as built; the player cannot understand or reach it | `Game Design` → **Todo**, evidence quotes + diagnosis + the design question + a recommended direction (agreed-outcome rule: the outcome is the store-page promise, the *how* is the agent's call) |
| `tester-error` | the tester misread something a human would read correctly | not filed; listed in the report |
| `unverified` | could not reproduce or locate | not filed; listed in the report with what was tried |

A finding is filed when **at least one** tester hit it and it verifies. The report ranks it by how many personas hit it.

### Cross-round tracking

Every finding carries `cold-playtest` and sits in its round's milestone, so the loop can read the whole history. After round *N+1* runs, the skill walks every earlier `cold-playtest` issue and records one status:

- **fixed-confirmed**: the ticket is closed, and a tester reached the surface without hitting the problem. Design tickets carry a "Fixed when …" line naming the observable test (e.g. "a round-2 tester meets The First"); the skill checks that line.
- **not-exercised**: no tester reached the surface, so it cannot confirm. Carried forward, not re-filed.
- **recurred**: hit again. If the original is closed, file `Recurs after fix: <original title>` in the new milestone, `relatedTo` the original, with the new evidence. If it is still open, add a comment to the original instead of filing a duplicate.

The per-round **scorecard** (`Docs/ops/cold-playtest-scorecard.tsv` on `ops`) makes the trend visible. It has one row per persona per round:

- round, date, brief version, deployed commit
- persona, verdict (yes / maybe / no), met The First (y/n, from the log), first `WOULD QUIT` action
- bullets under *Things I never understood* and *Surprises*
- actions, minutes, notional cost

`extract.mjs` produces every field except *met The First*, which the synthesizing agent reads from the log.

### When the next round runs

The lane (`tb-cold-playtest`, daily) evaluates the gate and does nothing else unless it opens:

1. **Current round closed.** Every issue in milestone `Cold playtest · round N` is Done or Canceled. Design tickets hand off their implementation tickets *into the same milestone* (each design ticket's Done-when says so), so a design ticket reaching Done does not close the round while its build tickets are open.
2. **Deployed.** `npm run check:deploy` reports `deployed` for `main`, and the newest `completedAt` in the milestone is at least `deploySettleMinutes` old.
3. **Spacing.** At least `minDaysBetweenRounds` since round *N* ran. This also stops an empty round (zero findings means an instantly-closed milestone) from re-running every day.
4. **Auth pre-check.** `claude -p "reply ok" --model haiku` from a temp dir succeeds. On 2026-09-25 the standalone CLI's OAuth token had expired while the desktop app's was fine. On 401, the lane writes a `## Needs Christian` line ("the cold tester's login expired — run `claude`, then `/login`") and stops.

If the gate is shut, the lane writes nothing, except once a round has been open longer than `staleRoundDays`. Then it publishes a short report whose `## Needs Christian` lists the open round's remaining issues and their states. That is how a design ticket stuck in Todo becomes visible without anyone chasing it.

A manual `/cold-playtest` in an attended session skips gates 1 and 3 (the director may ask for a round any time) but never gate 2 or 4.

## Engine pillar

Engine: N/A — no engine code changes; the loop plays the deployed build from outside the repo.

## Content pillar

Content: N/A — the player brief and personas are harness configuration under `scripts/cold-playtest/`, not game content; nothing enters `src/data/`.

## UI pillar

UI: N/A — no component changes. The loop *observes* the UI through a real browser (Playwright, headless Chromium at 1920×1080; the tester sees the WebGL map in its screenshots), and its findings become UI tickets that carry their own browser-verify Done-whens.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no row applies (no engine module, modal, GameState field or trace is added). The wiring this plan owns is between lanes, not modules:

| Piece | Invoked by | Reads | Writes | Visible where |
|---|---|---|---|---|
| `scripts/cold-playtest/run-round.ps1` | the `cold-playtest` skill | `config.json`, `personas.json`, `player-brief.md` | `%USERPROFILE%\.threadbare\cold-playtest\round-N\` (transcripts, logs, screenshots, `round.json`) | local disk (not git: ~240 MB/round of screenshots) |
| `.claude/skills/cold-playtest/SKILL.md` | `tb-cold-playtest` lane; attended `/cold-playtest` | round artifacts, Linear (`cold-playtest` label, round milestones), `origin/main` source | Linear milestone + tickets; `Docs/ops/cold-playtest-round-N.md` + scorecard rows on `ops` | Linear; `ops` branch |
| `tb-cold-playtest` scheduled lane | desktop scheduler, daily | Linear milestone state, `check:deploy` | only via the skill | registry row; run transcripts |
| `keep-work-flowing-cc` step 2.6 | hourly | newest `cold-playtest-round-*` report on `ops` ≤36 h | briefing | `Design/briefing.md` |

## Constants table

All live in `scripts/cold-playtest/config.json` (NFP #1). Changing how often or how hard we test is a number change.

| Constant | Default | Purpose |
|---|---|---|
| `startUrl` | `https://threadbearer.co/` | The real front door. Never a `?view=` URL |
| `personas` | `["story","veteran","skimmer"]` | Fixed set, so rounds compare. Adding one is a new column in the scorecard, not a replacement |
| `actionBudget` | `70` | Browser actions per tester (screenshots excluded). Round 1 used ~55–63 in ~10 min |
| `testerModel` | `opus` | Model for the cold tester |
| `playwrightMcpVersion` | `0.0.82` | Pinned so a Playwright MCP release cannot silently change what the tester can do between rounds |
| `viewport` | `1920,1080` | Viewport contract |
| `playerTimeoutMinutes` | `45` | Hard stop per tester (round 1 needed ≤10) |
| `briefVersion` | `1` | Bump on any brief or persona text change. The scorecard carries it, so a jump in a metric can be told apart from a brief change |
| `minDaysBetweenRounds` | `7` | Spacing, and the empty-round guard |
| `deploySettleMinutes` | `60` | Newest fix must be this old and deployed before a round |
| `staleRoundDays` | `21` | After this, an open round is surfaced to Christian with its blockers |
| `minUsablePersonas` | `2` | Below this many successful testers the round is void: no tickets, report the failure |
| `keepRoundsWithScreenshots` | `3` | Older rounds keep transcripts, logs and summaries; screenshots are deleted |

## Tracing

N/A — no engine code, so no trace types. Inspectability comes from the round's artifacts instead. Every tester keeps its raw stream-json transcript, a readable `log.md`, `summary.json` and screenshots. The round has `round.json`, the report records each finding's verification class and the source line that confirmed it, and the scorecard carries the numbers.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Start URL unreachable | `run-round.ps1` throws before starting any tester; the skill reports the outage, files nothing |
| Tester login expired (401 in transcript, `summary.failure = auth`) | Gate 4 normally catches it first; if it happens mid-round, the round is void and `## Needs Christian` carries the `/login` instruction |
| Safeguard refusal (`summary.failure = safeguard`) | Round void for that persona; report quotes the refusal. Do not reword the brief inside the run. A brief change is a `briefVersion` bump in a PR |
| One tester fails, others succeed | Proceed if `usable ≥ minUsablePersonas`; the report names the missing persona |
| Tester hits the timeout | Its partial transcript is extracted (`failure = incomplete`); counts as unusable |
| Linear unreachable (precheck `linear=unreachable`) | Lane reports and stops, no round (the gate cannot be evaluated) |
| A finding cannot be verified | Class `unverified`, listed in the report, not filed |
| Round number collision (`round.json` exists) | `run-round.ps1` refuses; the skill reads the milestone list to pick *N+1* |

## Interface impact

None. The plan adds no cross-system read or write inside the game, so no row in `Docs/canon/interface-map.md` changes. The lint's subsystem match comes from words in the evidence quotes (items, diagnostics), not from anything this plan touches.

## Three-pillar check

- [x] Engine pillar present (or N/A with rationale)
- [x] Content pillar present (or N/A with rationale)
- [x] UI pillar present (or N/A with rationale)
- [x] Wiring section connects them (lane-to-lane wiring; no module wiring applies)

## Vision audit

- [x] This plan does not contradict any Vision premise. It tests the store-page premise (the player-god follows mortals and whispers to them) against a player who knows only that premise.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] N/A.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every cadence, budget and threshold is in `config.json` (constants table) |
| 2. Inspectability | PASS | Raw transcripts + logs + summaries per tester; each filed finding cites its evidence quote and the confirming source line |
| 3. Determinism | PASS with note | The tester is an LLM and is not deterministic. Held fixed: brief text (`briefVersion`), personas, model, pinned MCP version, viewport, start URL, and the world (the real path seeds 42 by default). Rounds compare as trends, never as exact replays |
| 4. Fail-soft | PASS | See fail-soft table. No failure files a ticket from a void round |
| 5. Narrative over mechanical perfection | PASS | The loop measures exactly this: whether a cold player reads a story |
| 6. Additive over destructive | PASS | New scripts, skill, lane, label and milestones; one additive pattern in `keep-work-flowing-cc` step 2.6 |
| 7. Performance budget | N/A | Runs outside the game. Cost per round, measured in round 1: ~$3 notional per tester (≈$10/round) on the subscription plan, ~10 min wall-clock |

## Done when

- [ ] `scripts/cold-playtest/` contains `config.json`, `personas.json`, `player-brief.md`, `run-player.ps1`, `run-round.ps1` and `extract.mjs`, lifted from the appendix. Artifacts are written outside the repo.
- [ ] `node scripts/cold-playtest/extract.mjs <dir>` run against the round-1 baseline at `%USERPROFILE%\.threadbare\cold-playtest\round-1\veteran` reproduces `verdict: "maybe"`, `neverUnderstood: 12`, `surprises: 10`, `firstQuitAtAction: 63`. Paste the output.
- [ ] `.claude/skills/cold-playtest/SKILL.md` implements the procedure in the appendix, including a `--dry-run` mode that runs a round and writes the report but files no tickets and creates no milestone.
- [ ] **One dry-run round** (`/cold-playtest --dry-run`) completes against the deployed build. Its report (marked DRY RUN) is published to `ops`, and the summary quoted in the closing comment shows `usable: 3/3`.
- [ ] `tb-cold-playtest` is registered daily at cron `37 10 * * *`, and in the same PR: a row in `Docs/ops/scheduled-tasks-registry.md` (cron + observed fire time) and a prompt mirror at `Docs/ops/scheduled-task-prompts/tb-cold-playtest.md`. If the executing lane has no scheduled-tasks tool, register the row and mirror, and record `Needs attended registration: tb-cold-playtest` in the closing comment. An attended session then creates the task from the mirror.
- [ ] `keep-work-flowing-cc` step 2.6's sibling pattern list includes `cold-playtest-round-*` (skill + its prompt mirror if the live prompt restates the list).
- [ ] The label `cold-playtest` description and milestone `Cold playtest · round 1` description point at this plan's final path.
- [ ] Docs-gate evidence per `Docs/canon/verification-gates.md` (`classify:diff`, freshness gates last); the scripts are not engine code, so no CLI engine smoke is owed.
- [ ] Closing commit body includes `Fixes THR-1610` on its own line.
- [ ] `Browser-verify exempt: harness change, no src/components|hooks|contexts|index.css touched` in the commit body.

## Coordination block

**Suggested model:** opus — cross-lane wiring (scheduler, skill, briefing fold, Linear milestone logic) and a synthesis procedure that must verify findings against source, not transcribe them.

**Parallel-safe with:** THR-1600, THR-1601, THR-1602, THR-1603, THR-1604 — none of them touch `scripts/cold-playtest/`, `.claude/skills/`, or `Docs/ops/`.

**Mutex with:** none known. It edits `.claude/skills/keep-work-flowing-cc/SKILL.md` step 2.6 (one line); check at claim for any In Dev ticket editing that skill.

**Files to touch:**
- Create: `scripts/cold-playtest/config.json`, `scripts/cold-playtest/personas.json`, `scripts/cold-playtest/player-brief.md`, `scripts/cold-playtest/run-player.ps1`, `scripts/cold-playtest/run-round.ps1`, `scripts/cold-playtest/extract.mjs`
- Create: `.claude/skills/cold-playtest/SKILL.md`
- Create: `Docs/ops/scheduled-task-prompts/tb-cold-playtest.md`
- Edit: `Docs/ops/scheduled-tasks-registry.md` (one row)
- Edit: `.claude/skills/keep-work-flowing-cc/SKILL.md` (step 2.6 pattern list)

## Notes for the executor

- **Round 1 already happened.** Its baseline lives at `%USERPROFILE%\.threadbare\cold-playtest\round-1\` (`round.json` + per-persona `transcript.jsonl` / `log.md` / `summary.json` / `shots/`), and its report and scorecard rows are on `ops` (`Docs/ops/cold-playtest-round-1.md`, `Docs/ops/cold-playtest-scorecard.tsv`). The first real lane round is round 2.
- **Do not run a real (non-dry) round as part of this ticket.** Round 2 fires when milestone round 1 closes; running it early would test half-fixed work and file duplicates.
- **Nested `claude -p` works from inside a Claude session.** Proven 2026-09-25 from an attended Code-tab session. It uses the standalone CLI's own login, not the desktop app's. That is why the auth pre-check exists.
- **Brief wording is load-bearing** (see *The tester*). If a rewording is ever needed, bump `briefVersion` and note it in the next report.
- **Throttle compliance.** The lane files *product* findings (Bug / Game Design) from a playtest, not process or infrastructure tickets, so the 2026-08-10 lane-filing throttle does not bar it. It is still a probe under the six-week sunset rule; the weekly retro renews it by citing the round's filed findings.
- **Level-system rule (director, 2026-08-13).** The round report is a status report, never a review invitation. `## Needs Christian` carries only the verdict trend, the top findings in plain language with links, and blocking items (login, staleness).
- **Rule Zero.** Every issue, milestone and report path in `## Needs Christian` is a clickable URL.

## Appendix A — `scripts/cold-playtest/config.json`

```json
{
  "startUrl": "https://threadbearer.co/",
  "personas": ["story", "veteran", "skimmer"],
  "actionBudget": 70,
  "testerModel": "opus",
  "playwrightMcpVersion": "0.0.82",
  "viewport": "1920,1080",
  "playerTimeoutMinutes": 45,
  "briefVersion": 1,
  "minDaysBetweenRounds": 7,
  "deploySettleMinutes": 60,
  "staleRoundDays": 21,
  "minUsablePersonas": 2,
  "keepRoundsWithScreenshots": 3
}
```

## Appendix B — `scripts/cold-playtest/personas.json`

```json
{
  "story": "You mostly play story-rich and cozy games (narrative adventures, Stardew Valley, visual novels). You rarely play strategy games and feel a little intimidated by numbers, jargon and busy screens. You are patient with story and will read a good paragraph, but you get lost fast when a screen expects you to already know its rules.",
  "veteran": "You have hundreds of hours in Crusader Kings, RimWorld and Dwarf Fortress. You want to understand the systems underneath: you look for numbers, hover over everything, and poke at every panel. You are annoyed by vagueness, hidden rules and choices whose consequences you cannot reason about — but you forgive a steep curve if the depth is real.",
  "skimmer": "You play games on your lunch break. You read the first line of any block of text and skip the rest, and you click whatever looks like the main button. You give a new game about ten minutes to show you what it is about and why you should care; if nothing has grabbed you by then, you leave."
}
```

## Appendix C — `scripts/cold-playtest/player-brief.md` (brief v1)

````markdown
You are a playtester trying a new browser game for the first time. You have never seen it before and know nothing about it beyond the short store-page blurb below. You are playing through a browser you control with tools.

## What you know about the game (the store page)

**Threadbearer** — *A turn-based god-game of mortal stories in a living world.*

> You are a new god, watching a world you didn't make. A handful of mortals catch your eye — a swordbearer, a scholar, a refugee. You follow their lives like chapters of a book, and when the moment matters you whisper, nudge, or send a dream. Their choices are theirs. The story becomes yours.

That is all you know. There is no manual.

## Who you are

{{PERSONA}}

Stay in character as this player: your patience, your expectations, what you notice and what you skip.

## How to play

- Start at {{START_URL}} and play the game the way a real person would. Do not type other URLs, add URL parameters, or open developer tools.
- **Your eyes are the screenshot.** Take a screenshot (browser_take_screenshot) whenever the screen changes meaningfully, and base your understanding ONLY on what is visible in it. The page snapshots you receive after actions are for your hands only — use their element refs to click precisely, but if some text appears in a snapshot and you could not see it in the screenshot (hidden, off-screen, too small to notice), you do not know it.
- The large map is a picture; to interact with it, click or hover at coordinates on the screenshot (browser_mouse_click_xy / browser_mouse_move_xy). Hovering to discover tooltips is fine — real players do that.
- The browser window is 1920×1080.

## Playtest log — this is the most important part

The designers learn from a short written log of your playtest, like the notes a human tester jots down. Before each browser action, write a brief log entry:

```
SEE: <what you notice on screen that matters right now>
WANT: <your goal for this step, as a player>
EXPECT: <what you think the game will do when you click/press this>
```

After the action and its screenshot, add one line:

```
GOT: <what the game actually did> — MATCH | SURPRISE (<what was unexpected>)
```

Also, whenever it applies, add a tagged note:

- `CONFUSED: <the word, number, icon or screen you don't understand, and what you guess it means>`
- `LOST: <you don't know what to do next — say what you'd want to be told>`
- `HOOKED: <a moment you genuinely wanted to see what happens next — and why>`
- `BORED: <a moment your attention would drift — and why>`
- `WOULD QUIT: <the point where this player would realistically close the tab — and why>` — after writing this, keep playing anyway so we learn what comes after, but say so honestly.

Be honest, not polite. Guessing wrong is valuable data — say what you believe, even when unsure. Do not pretend to understand something you don't.

## Budget

Play for about {{ACTION_BUDGET}} browser actions (each click, hover, key press or type counts as one; screenshots don't count). Try to get past any setup screens and actually play several turns of the game. Then stop and write your debrief.

## Debrief (your final message)

Write it in this exact structure, in plain language:

1. **What I think this game is** — 3–5 sentences, in your own words, as if telling a friend.
2. **What I think I was doing** — my goal as I understood it, and whether I felt I was making progress.
3. **Things I never understood** — a bullet list: each word, number, screen or mechanic, with my best guess of what it meant.
4. **Surprises** — bullets: where what happened didn't match what I expected.
5. **Best moment / worst moment** — one each, with why.
6. **Would I keep playing?** — yes / no / maybe, and the honest reason. If I hit a WOULD QUIT point, where was it.
7. **If I could tell the designer one thing** — one sentence.
````

## Appendix D — `scripts/cold-playtest/run-player.ps1`

```powershell
# Cold playtest — run ONE cold tester against the deployed build.
# The tester is a fresh `claude -p` process started OUTSIDE the repo, with a
# replaced system prompt, no setting sources, and only Playwright browser tools,
# so it carries none of the project's rules, vocabulary or debug levers.
param(
  [Parameter(Mandatory)] [string] $Persona,
  [Parameter(Mandatory)] [string] $OutDir,
  [string] $Kickoff = "Begin. Open the game and play."
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cfg = Get-Content (Join-Path $root 'config.json') -Raw | ConvertFrom-Json

$runDir = Join-Path $OutDir $Persona
$shotDir = Join-Path $runDir 'shots'
New-Item -ItemType Directory -Force $shotDir | Out-Null

$personas = Get-Content (Join-Path $root 'personas.json') -Raw | ConvertFrom-Json
$personaText = $personas.$Persona
if (-not $personaText) { throw "unknown persona '$Persona'" }
$brief = (Get-Content (Join-Path $root 'player-brief.md') -Raw).
  Replace('{{PERSONA}}', $personaText).
  Replace('{{START_URL}}', $cfg.startUrl).
  Replace('{{ACTION_BUDGET}}', [string]$cfg.actionBudget)
$sysFile = Join-Path $runDir 'system.md'
Set-Content -Path $sysFile -Value $brief -NoNewline

$mcpArgs = @('-y', "@playwright/mcp@$($cfg.playwrightMcpVersion)", '--headless', '--isolated',
  '--viewport-size', $cfg.viewport, '--caps', 'vision', '--output-dir', $shotDir)
$mcp = @{ mcpServers = @{ pw = @{ command = 'npx'; args = $mcpArgs } } } | ConvertTo-Json -Depth 6
$mcpFile = Join-Path $runDir 'mcp.json'
Set-Content -Path $mcpFile -Value $mcp

# Hands: element refs from page snapshots. Eyes: screenshots. No page-script,
# console or network access — those would reach the game's internals.
$allowed = @('navigate','navigate_back','click','type','press_key','hover','take_screenshot','snapshot',
  'mouse_click_xy','mouse_move_xy','mouse_drag_xy','mouse_wheel','wait_for','select_option') |
  ForEach-Object { "mcp__pw__browser_$_" }
$denied = @('Bash','PowerShell','Read','Write','Edit','Glob','Grep','WebFetch','WebSearch','Task','Agent',
  'NotebookEdit','TodoWrite','Skill','Artifact','ArtifactComments','ArtifactData','CronCreate','CronDelete',
  'CronList','DesignSync','EnterWorktree','ExitWorktree','ListAgents','Monitor','PushNotification',
  'RemoteTrigger','ReportFindings','ScheduleWakeup','SendMessage','Workflow',
  'mcp__pw__browser_evaluate','mcp__pw__browser_run_code_unsafe','mcp__pw__browser_console_messages',
  'mcp__pw__browser_network_requests','mcp__pw__browser_network_request','mcp__pw__browser_tabs',
  'mcp__pw__browser_file_upload')

$log = Join-Path $runDir 'transcript.jsonl'
$err = Join-Path $runDir 'stderr.txt'
# Run from the persona dir, which is outside the repo, so no CLAUDE.md is discovered.
Push-Location $runDir
try {
  $cargs = @('-p', $Kickoff, '--model', $cfg.testerModel, '--system-prompt-file', $sysFile,
    '--strict-mcp-config', '--mcp-config', $mcpFile,
    '--allowedTools', ($allowed -join ','), '--disallowedTools', ($denied -join ','),
    '--permission-mode', 'dontAsk', '--setting-sources', 'local',
    '--output-format', 'stream-json', '--verbose')
  & claude @cargs > $log 2> $err
  $code = $LASTEXITCODE
} finally { Pop-Location }

node (Join-Path $root 'extract.mjs') $runDir | Out-Null
"persona=$Persona exit=$code dir=$runDir"
```

## Appendix E — `scripts/cold-playtest/run-round.ps1`

```powershell
# Cold playtest — run every persona in parallel for one round, then write
# round.json (per-persona summaries + deployed build identity).
# Usage: pwsh scripts/cold-playtest/run-round.ps1 -Round 2
param(
  [Parameter(Mandatory)] [int] $Round,
  [string] $ArtifactRoot = (Join-Path $env:USERPROFILE '.threadbare\cold-playtest')
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cfg = Get-Content (Join-Path $root 'config.json') -Raw | ConvertFrom-Json
$outDir = Join-Path $ArtifactRoot "round-$Round"
if (Test-Path (Join-Path $outDir 'round.json')) { throw "round $Round already has a round.json in $outDir — pick the next round number" }
New-Item -ItemType Directory -Force $outDir | Out-Null

# Fail fast if the site is down: a dead page would waste every tester's budget.
try { $null = Invoke-WebRequest $cfg.startUrl -UseBasicParsing -TimeoutSec 20 }
catch { throw "start URL unreachable: $($cfg.startUrl) — $($_.Exception.Message)" }

$started = Get-Date
$jobs = foreach ($p in $cfg.personas) {
  Start-ThreadJob -ArgumentList $root, $p, $outDir -ScriptBlock {
    param($root, $p, $outDir)
    & (Join-Path $root 'run-player.ps1') -Persona $p -OutDir $outDir
  }
}
$null = $jobs | Wait-Job -Timeout ($cfg.playerTimeoutMinutes * 60)
$jobs | Where-Object State -eq 'Running' | Stop-Job
$jobs | Receive-Job -ErrorAction Continue | Write-Output
$jobs | Remove-Job -Force

$summaries = foreach ($p in $cfg.personas) {
  $f = Join-Path $outDir "$p\summary.json"
  if (Test-Path $f) { Get-Content $f -Raw | ConvertFrom-Json }
  else { [pscustomobject]@{ persona = $p; ok = $false; failure = 'no-summary' } }
}
$round = [ordered]@{
  round = $Round
  startedAt = $started.ToUniversalTime().ToString('o')
  minutes = [int]((Get-Date) - $started).TotalMinutes
  startUrl = $cfg.startUrl
  briefVersion = $cfg.briefVersion
  testerModel = $cfg.testerModel
  personas = $summaries
  usable = @($summaries | Where-Object ok).Count
}
$round | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $outDir 'round.json')
"round=$Round usable=$($round.usable)/$($cfg.personas.Count) dir=$outDir"
```

The executor also adds the `keepRoundsWithScreenshots` pruning (delete `shots/` in rounds older than the newest *k*) at the end of `run-round.ps1`.

## Appendix F — `scripts/cold-playtest/extract.mjs`

```js
// Cold playtest — turn one tester's stream-json transcript into a readable log
// plus a machine-readable summary.
// Usage: node extract.mjs <personaRunDir>
//   writes <dir>/log.md and <dir>/summary.json, prints the summary.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node extract.mjs <personaRunDir>'); process.exit(2); }
const transcript = path.join(dir, 'transcript.jsonl');
const lines = fs.existsSync(transcript)
  ? fs.readFileSync(transcript, 'utf8').split('\n').filter(Boolean)
  : [];

const NON_ACTIONS = new Set(['take_screenshot', 'snapshot', 'wait_for']);
const TAGS = ['CONFUSED', 'LOST', 'HOOKED', 'BORED', 'WOULD QUIT', 'SURPRISE'];

const out = [];
const texts = []; // { text, atAction } — in-play notes; the last one is the debrief
let actions = 0;
let result = null;
let failure = null;

for (const l of lines) {
  let ev;
  try { ev = JSON.parse(l); } catch { continue; }
  if (ev.type === 'assistant') {
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'text' && c.text.trim()) {
        const text = c.text.trim();
        out.push(text);
        texts.push({ text, atAction: actions });
      }
      if (c.type === 'tool_use') {
        const name = c.name.replace('mcp__pw__browser_', '');
        if (!NON_ACTIONS.has(name) && name !== 'ToolSearch') actions++;
        const i = c.input ?? {};
        const arg = i.element ?? i.url ?? i.key ?? i.text ?? (i.x != null ? `${i.x},${i.y}` : '');
        out.push(`  → [${name}] ${String(arg).slice(0, 80)}`);
      }
    }
  }
  if (ev.type === 'user') {
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'tool_result' && c.is_error) {
        const t = Array.isArray(c.content) ? c.content.map(x => x.text ?? '').join(' ') : String(c.content);
        out.push(`  ✗ ${t.slice(0, 160)}`);
      }
    }
  }
  if (ev.type === 'system' && ev.subtype === 'api_retry' && ev.error === 'authentication_failed') failure = 'auth';
  if (ev.type === 'result') result = ev;
}

const resultText = String(result?.result ?? '');
if (!failure && /safeguards flagged/i.test(resultText)) failure = 'safeguard';
if (!failure && /authenticat/i.test(resultText) && result?.is_error) failure = 'auth';
if (!failure && !result) failure = lines.length ? 'incomplete' : 'no-transcript';
if (!failure && result?.is_error) failure = 'error';

// The debrief is the final assistant message. Tags are counted on the in-play
// notes only, so the debrief's own recap of "WOULD QUIT" does not double-count.
// The final message often carries the last in-play notes before the "Debrief" heading.
const last = texts.at(-1) ?? { text: '', atAction: actions };
const cut = last.text.search(/(^|\n)[#*\s]*Debrief\b/i);
const debrief = cut >= 0 ? last.text.slice(cut) : last.text;
const inPlay = texts.slice(0, -1);
if (cut > 0) inPlay.push({ text: last.text.slice(0, cut), atAction: last.atAction });
const tagCounts = Object.fromEntries(TAGS.map(t => [t, 0]));
let firstQuitAtAction = null;
for (const { text, atAction } of inPlay) {
  for (const t of TAGS) {
    const n = (text.match(new RegExp(`\\b${t}\\b`, 'g')) ?? []).length;
    tagCounts[t] += n;
    if (t === 'WOULD QUIT' && n > 0 && firstQuitAtAction === null) firstQuitAtAction = atAction;
  }
}

// Count bullets in a numbered debrief section ("3. Things I never understood" / "## 3. ...").
function sectionBullets(n) {
  const m = debrief.match(new RegExp(`(?:^|\\n)[#*\\s]*${n}\\.[^\\n]*\\n([\\s\\S]*?)(?=\\n[#*\\s]*${n + 1}\\.|$)`));
  return m ? (m[1].match(/^\s*[-*•] /gm) ?? []).length : null;
}
const verdictMatch = debrief.match(/Would I keep playing\?\**\s*\n+\s*\**\s*(yes|no|maybe)/i);

const summary = {
  persona: path.basename(dir),
  ok: failure === null,
  failure,
  actions,
  tags: tagCounts,
  firstQuitAtAction,
  neverUnderstood: sectionBullets(3),
  surprises: sectionBullets(4),
  verdict: verdictMatch ? verdictMatch[1].toLowerCase() : null,
  turns: result?.num_turns ?? null,
  minutes: result ? Math.round(result.duration_ms / 60000) : null,
  notionalCostUsd: result?.total_cost_usd != null ? Number(result.total_cost_usd.toFixed(2)) : null,
};

fs.writeFileSync(path.join(dir, 'log.md'), out.join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
```

## Appendix G — `cold-playtest` skill procedure (for `.claude/skills/cold-playtest/SKILL.md`)

Frontmatter: `name: cold-playtest`, a description that triggers on "cold playtest", "/cold-playtest", "run a playtest round", `last_validated_against: <ship date>`. Body, in order:

0. **Mode.**
   - *Lane mode* (from `tb-cold-playtest`): evaluate gates 1–4 from *When the next round runs*. If any is shut, exit silently. The one exception is the stale-round report.
   - *Attended mode:* gates 2 and 4 only.
   - `--dry-run`: no Linear writes, report marked DRY RUN.
1. **Pick N.** List milestones in `Onboarding & First-Run Experience` matching `Cold playtest · round <k>`; N = max k + 1.
2. **Run.** `pwsh scripts/cold-playtest/run-round.ps1 -Round N`. Read `round.json`; if `usable < minUsablePersonas`, report void and stop.
3. **Read.** Read each persona's `log.md` in full, not just the debrief. The in-play `GOT … SURPRISE` lines carry the evidence.
4. **Candidates.** One row per distinct thing a tester hit: what happened, verbatim quotes, which personas, the surface (screen/component).
5. **Verify** each candidate against source on a fresh `origin/main` and classify it as `bug`, `design`, `tester-error` or `unverified` (table in *The observer*). Fan out an Explore subagent for locating, as round 1 did. Never file on the tester's word alone.
6. **Compare** with every earlier `cold-playtest` issue and record `fixed-confirmed / not-exercised / recurred` (*Cross-round tracking*). Check each design ticket's "Fixed when" line against this round's logs.
7. **File** (skipped in dry-run).
   - Create milestone `Cold playtest · round N` and file each verified finding with label `cold-playtest`, as `Bug` → Ready for Dev (with coordination-block first comment) or `Game Design` → Todo.
   - Every design ticket's Done-when says its implementation tickets are filed into this milestone.
   - Verify every write (`get_issue`, impediment #48). If a save drops a field (a `&` in a title is a known cause), re-save it.
8. **Publish** `Docs/ops/cold-playtest-round-N.md` and the scorecard rows via `bash scripts/ops-publish.sh`.
   - Report sections: verdicts per persona vs last round; met-the-First per persona; fixed-confirmed / recurred / new with Linear links; tester-error and unverified lists; cost and duration.
   - `## Needs Christian`: 3–6 plain-language lines, game words only, every reference a URL.
9. **Prune** screenshots older than `keepRoundsWithScreenshots` rounds.

## Forked-audit verdicts

Not run. This is a harness plan with all three game pillars N/A (no engine, content or UI change), so the NFP, three-pillar and Vision auditors have no game surface to score. The director's direction and the round-1 evidence are the intent record (THR-1610 description).
