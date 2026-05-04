# Retrospective Draft — 2026-05-04

**Note:** This is a deterministic draft; revise into narrative form.

## Period
From: 2026-04-11 (exclusive)
To: 2026-05-04

## Summary
- Entries reviewed: 76
- Total occurrence count: 143
- Estimated time lost (heuristic): ~10.6h (633 minutes)
- Distinct root-cause clusters: 18

## Analytics

### By Category
| Category | Entries | Occurrences |
|---|---:|---:|
| environment | 15 | 59 |
| process-friction | 27 | 37 |
| dependency | 11 | 20 |
| api-quirk | 9 | 10 |
| code-bug | 6 | 6 |
| flaky-test | 2 | 3 |
| tool-failure | 1 | 3 |
| config | 1 | 1 |
| other | 1 | 1 |
| permission | 1 | 1 |
| skill-gap | 1 | 1 |
| unclear-requirements | 1 | 1 |

### By Impact
| Impact | Entries | Occurrences | Minutes per occurrence |
|---|---:|---:|---:|
| Blocked | 9 | 10 | 30 |
| L | 4 | 4 | 20 |
| M | 14 | 18 | 8 |
| S | 47 | 109 | 1 |
| Unknown | 2 | 2 | 0 |

### By Root-Cause Cluster
| Cluster | Entries | Occurrences |
|---|---:|---:|
| Other (process-friction) | 26 | 36 |
| Sandbox search tooling (rg/ripgrep unavailable) | 6 | 34 |
| Automation environment variable gaps | 3 | 18 |
| Obsidian connector unavailable | 7 | 16 |
| Other (api-quirk) | 6 | 7 |
| Other (environment) | 6 | 7 |
| Other (code-bug) | 6 | 6 |
| Linear MCP behavior quirks | 4 | 4 |
| Other (dependency) | 3 | 3 |
| Other (tool-failure) | 1 | 3 |
| Baseline test-suite instability | 1 | 2 |
| Git staging/locking contention | 1 | 1 |
| Other (config) | 1 | 1 |
| Other (flaky-test) | 1 | 1 |
| Other (other) | 1 | 1 |
| Other (permission) | 1 | 1 |
| Other (skill-gap) | 1 | 1 |
| Other (unclear-requirements) | 1 | 1 |

## Duplicate Description Hashes
No duplicate description hashes detected in this period.

## Root-Cause Clusters

### Other (process-friction)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 43 | 1 | 2026-04-15 | process-friction | S | Root-level `world-model.json` referenced by repo instructions was not present; the actual file is `src/data/world-model… |
| 44 | 1 | 2026-04-16 | process-friction | S | An ad hoc PowerShell regex/count command failed with a parser error because nested quote escaping around `id: ['\"]` wa… |
| 58 | 1 | 2026-04-18 | process-friction | S | `session-handoff` skill files (`.agents/skills/session-handoff/SKILL.md` and `.claude/skills/session-handoff/SKILL.md`)… |
| 61 | 1 | 2026-04-19 | process-friction | Blocked | Scheduled sonnet session found only one Ready-for-Dev issue (THR-153) which is labeled `model:opus`. Per protocol, sonn… |
| 62 | 1 | 2026-04-19 | process-friction | L | Used `git stash` to temporarily revert THR-153 WIP to determine if a full-suite test failure was pre-existing. `git sta… |
| 69 | 1 | 2026-04-20 | process-friction | M | A prior Cowork session (2026-04-19 21:13–21:16) drafted a new 7-issue "UI Visual Overhaul" series (THR-199..205) coveri… |
| 72 | 1 | 2026-04-20 | process-friction | S | `git add <specific files>` on main included additional untracked files (`scripts/inspiration-ingest/`, `src/data/inspir… |
| 77 | 1 | 2026-04-21 | process-friction | S | THR-235 Done-when checklist referenced `npm run check:skill-sync:check`, but the repository only defines `check:skill-s… |
| 67 | 1 | 2026-04-23 | process-friction | S | The `keep-codex-flowing` scheduled-task SKILL.md (at `C:\Users\chris\AppData\Roaming\Claude\local-agent-mode-sessions\.… |
| 59 | 4 | 2026-04-24 | process-friction | M | Working tree contains extensive uncommitted changes from prior sessions (now across dozens of files, including `src/com… |
| 65 | 2 | 2026-04-24 | process-friction | S | Codex handoff comments can include stale/non-existent file references (THR-190 and THR-245). Latest recurrence: THR-245… |
| 82 | 1 | 2026-04-24 | process-friction | S | Exact-string replacement scripting for protocol/CLAUDE doc edits failed because the target sentence had drifted from th… |
| 83 | 1 | 2026-04-24 | process-friction | S | Push to origin/main was rejected as non-fast-forward ( etch first) because remote main advanced during the automation r… |
| 84 | 1 | 2026-04-24 | process-friction | S | Direct push to main for THR-234 was rejected by active repository rules (GH013): changes must go through a pull request… |
| 87 | 1 | 2026-04-24 | process-friction | Blocked | Codex executor pickup remains blocked by extensive pre-existing tracked/untracked workspace changes unrelated to the cl… |
| 88 | 1 | 2026-04-24 | process-friction | Blocked | Codex hourly pickup blocked again by extensive pre-existing tracked/untracked workspace changes unrelated to claimed TH… |
| 68 | 1 | 2026-04-25 | process-friction | Blocked | Cowork moved THR-271 and THR-274 to "Ready for Dev" without posting the required handover comment containing `Suggested… |
| 82 | 5 | 2026-04-25 | process-friction | S | GitHub PR labeling step for automation could not apply required labels because repository labels `codex` and `codex-aut… |
| 89 | 2 | 2026-04-25 | process-friction | Blocked | Codex hourly pickup for THR-256 was blocked again by extensive pre-existing tracked/untracked workspace changes unrelat… |
| 92 | 2 | 2026-04-25 | process-friction | M | CC scheduled pickup ran twice on THR-271 (model:opus) because: (a) the pull-work protocol requires a Handoff Comment wi… |
| 94 | 1 | 2026-04-27 | process-friction | L | Required status check "Test · Typecheck · Build" caused all PRs to hang indefinitely — the CI test step has no timeout … |
| 95 | 1 | 2026-04-27 | process-friction | S | Local `main` was tracking a non-main upstream branch (`origin/christianspliid/thr-275-hexsidebar-location-entries-have-… |
| 99 | 1 | 2026-04-28 | process-friction | L | CC and Codex both claimed THR-102 simultaneously. CC picked it from Ready for Dev; Codex ran a concurrent automation th… |
| 105 | 1 | 2026-04-29 | process-friction | M | THR-108 latest handoff lacks Codex-required coordination sections (Engine/Content/UI/Wiring action blocks and Files-to-… |
| 107 | 1 | 2026-04-30 | process-friction | Blocked | Codex Threadbearer automation WIP gate (`list_issues state:"In Dev" assignee:"me"`) returned an unrelated In Dev issue … |
| 110 | 1 | 2026-05-01 | process-friction | L | Branch protection is now active on `main` — direct `git push` to main is rejected with "Changes must be made through a … |

### Sandbox search tooling (rg/ripgrep unavailable)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 73 | 1 | 2026-04-20 | environment | S | `rg.exe` is present in the Codex sandbox but fails to start with "Access is denied" from the packaged WindowsApps path,… |
| 74 | 1 | 2026-04-20 | environment | S | `rg.exe` again failed to launch in Codex desktop (`Access is denied` from the WindowsApps packaged path) at session sta… |
| 78 | 8 | 2026-04-27 | environment | S | `rg.exe` remained blocked in Codex desktop (`spawnSync rg.exe EPERM` / access denied from packaged WindowsApps path) du… |
| 98 | 1 | 2026-04-28 | environment | S | THR-102 run in a fresh git worktree hit two recurring setup frictions: rg.exe EPERM in this Codex desktop sandbox and m… |
| 101 | 1 | 2026-04-28 | environment | S | THR-106 worktree run hit recurring Codex desktop friction: `rg.exe` access denied (WindowsApps packaged path) and fresh… |
| 15 | 22 | 2026-04-30 | environment | S | Bundled `rg.exe` cannot start inside the Codex desktop sandbox for this repo (`Access is denied`) even though repo sear… |

### Automation environment variable gaps
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 64 | 1 | 2026-04-19 | environment | S | $CODEX_HOME was unset in the automation shell, so the required automation memory path could not be resolved from env va… |
| 67 | 1 | 2026-04-19 | environment | S | $CODEX_HOME was unset again during Threadbearer coding automation run ( hreadbearer-coding), so memory path resolution … |
| 76 | 16 | 2026-04-24 | environment | S | `$CODEX_HOME` was unset in the Codex automation shell during Threadbearer coding runs, so the required automation memor… |

### Obsidian connector unavailable
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 66 | 2 | 2026-04-19 | dependency | S | Obsidian MCP tools unavailable — first hit in Codex THR-24 closeout (no callable connector), then reproduced in Cowork … |
| 71 | 1 | 2026-04-20 | dependency | S | Obsidian MCP append step remains unavailable in this session (no callable Obsidian connector tools exposed), so require… |
| 75 | 8 | 2026-04-24 | dependency | S | Obsidian MCP connector tools were unavailable in Codex closeout sessions (no callable Obsidian methods exposed), so req… |
| 86 | 1 | 2026-04-24 | dependency | S | Obsidian MCP append tooling was unavailable during THR-251 closeout (no callable Obsidian connector tools exposed in th… |
| 96 | 2 | 2026-04-27 | dependency | S | Obsidian MCP connector tools were still unavailable during THR-286 closeout, so required vault log append could not run… |
| 102 | 1 | 2026-04-28 | dependency | S | Obsidian MCP connector tools were not available in this Codex session (no Obsidian tool surfaced via tool discovery), s… |
| 104 | 1 | 2026-04-29 | dependency | S | THR-109 requires updating Obsidian vault encounter-architecture pages, but this repository snapshot only contains `TheF… |

### Other (api-quirk)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 48 | 1 | 2026-04-17 | api-quirk | S | Linear `save_issue` with `statusId` or `status` parameter silently returned success (200) but did not update the issue … |
| 49 | 1 | 2026-04-17 | api-quirk | S | Linear `list_issues` tool rejected `orderBy: "priority"` parameter at runtime — the field only accepts `"createdAt"` or… |
| 63 | 1 | 2026-04-19 | api-quirk | M | Linear `save_issue` with `id="THR-183"` (a Done issue) was called during THR-182 session to create a new Deferral issue… |
| 80 | 2 | 2026-04-24 | api-quirk | S | GitHub Action `claude-review` structural job fails in PR context: (a) `git fetch origin main --depth=1` with `fatal: co… |
| 93 | 1 | 2026-04-25 | api-quirk | M | Linear `save_issue` rejected UL proposal verification issue creation with `Usage limit exceeded - You've exceeded the f… |
| 103 | 1 | 2026-04-29 | api-quirk | S | Linear's GitHub integration auto-moved THR-238 to Done when PR #79 (`docs(plan): THR-238 Declarative engine phase regis… |

### Other (environment)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 60 | 1 | 2026-04-19 | environment | S | `Agent` tool with `model: "haiku"` returns "Prompt is too long" even for minimal prompts (under 300 tokens). The shared… |
| 90 | 1 | 2026-04-25 | environment | S | `mcp__scheduled-tasks__create_scheduled_task` returns "Cannot create scheduled tasks from within a scheduled task sessi… |
| 91 | 1 | 2026-04-25 | environment | M | GitHub Actions CI failed with "The job was not started because recent account payments have failed or your spending lim… |
| 97 | 1 | 2026-04-28 | environment | S | npm script commands using Linux-style `/tmp/*.mjs` outfiles fail on Windows Codex shells: esbuild writes to `./tmp/*.mj… |
| 100 | 1 | 2026-04-28 | environment | S | g.exe remained blocked in Codex desktop (Access is denied from packaged WindowsApps path) during THR-290 orientation/pr… |
| 90 | 2 | 2026-04-30 | environment | S | `mcp__scheduled-tasks__create_scheduled_task` returns "Cannot create scheduled tasks from within a scheduled task sessi… |

### Other (code-bug)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 40 | 1 | 2026-04-12 | code-bug | M | Strategic action candidate generator used `actor.properties.domainCapability` (singular) but actors store the field as … |
| 41 | 1 | 2026-04-12 | code-bug | M | `phaseAgentDecision` executed strategic actions but assigned the result to a local `state` variable that was discarded … |
| 45 | 1 | 2026-04-17 | code-bug | S | `deriveLocationActivities.ts` referenced `agentNode` (a loop variable from a `for...of` block) outside its loop scope i… |
| 50 | 1 | 2026-04-17 | code-bug | Unknown | TypeScript structural typing silently accepted `UnifiedActionTemplate` where `EncounterTemplate` was expected in `build… |
| 52 | 1 | 2026-04-17 | code-bug | M | `phaseHiddenMarkDecay` used `if (nextMarks.length === marks.length) return {}` as an optimization to detect "no change"… |
| 53 | 1 | 2026-04-17 | code-bug | S | Codex review identified that `consumeMatchingMarks` ran against the post-aftermath state, which can include newly-place… |

### Linear MCP behavior quirks
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 79 | 1 | 2026-04-23 | api-quirk | M | Linear MCP rate limit is easy to hit with the default protocol. Session-start fan-outs (≥5 `list_issues` calls in Cowor… |
| 85 | 1 | 2026-04-24 | api-quirk | M | THR-234 remained in In Dev after three merged main commits whose bodies contained `Fixes THR-234`. Root cause identifie… |
| 106 | 1 | 2026-04-29 | dependency | S | Linear MCP tools in this session expose comment read/delete but no comment-create method. |
| 108 | 1 | 2026-04-30 | api-quirk | Blocked | Linear MCP rate-limit (HTTP 429) hit on both the initial `list_issues` board scan and a retry 2 minutes later in a CC s… |

### Other (dependency)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 46 | 1 | 2026-04-17 | dependency | S | `LocationNode` in HexMapV2's `LocationIconMesh.ts` has no `id` field — only `hexCol`, `hexRow`, `name`, `locationType`.… |
| 47 | 1 | 2026-04-17 | dependency | S | `omenState.activeOmens` / `OmenTrackTemplate` vocabulary tables do not exist yet — the `omenState` parameter is wired i… |
| 81 | 1 | 2026-04-24 | dependency | S | Fresh `git worktree` checkouts do not have dependencies installed, so `npm test` fails immediately with `'vitest' is no… |

### Other (tool-failure)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 55 | 3 | 2026-04-19 | tool-failure | S | `RemoteTrigger` with trigger_id `trig_012H3CEdTnrAqY4w81T4rLXz` returned HTTP 404 (trigger not found). |

### Baseline test-suite instability
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 57 | 2 | 2026-04-19 | flaky-test | S | `traceBuffer-integration.test.ts > trace IDs are sequential after clearing` fails when `orchestrator.ts` includes the T… |

### Git staging/locking contention
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 68 | 1 | 2026-04-19 | process-friction | S | git add failed with atal: Unable to create .git/index.lock: File exists during THR-25 closeout. Repository had multiple… |

### Other (config)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 109 | 1 | 2026-05-01 | config | Unknown | `OBSIDIAN_VAULT_PATH` is not set in `.claude/settings.local.json`, causing `npm run mirror-ul` to fail with exit code 1… |

### Other (flaky-test)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 54 | 1 | 2026-04-17 | flaky-test | S | Pre-existing test failure on `main`: `src/engine/__tests__/unifiedActionPhases.test.ts > walks a 3-step action through … |

### Other (other)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 42 | 1 | 2026-04-12 | other | M | Browser game stalls at tick 72 with 1010+ agents. CLI with seed 42 runs to tick 75+ with 414 agents without stalling. T… |

### Other (permission)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 56 | 1 | 2026-04-18 | permission | Blocked | GitHub branch protection API returns 403 for private repos unless the account has GitHub Pro. `gh api repos/christiansp… |

### Other (skill-gap)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 51 | 1 | 2026-04-17 | skill-gap | M | `emitTrace` is a no-op when `enabled=false` (default). Tests that called `clearTraces()` in `beforeEach` but not `enabl… |

### Other (unclear-requirements)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 70 | 1 | 2026-04-20 | unclear-requirements | Blocked | THR-222 latest handoff comment points to a local artifact path (`...outputs/codex-brief-THR-222-composition-dsl.md`) th… |

## Determinism Guard
- Input source: `Docs/impediments.md`
- Rendering order: stable sort by count/date/id and lexical tie-breakers.
- Duplicate detection: SHA-1 hash of normalized description text.

