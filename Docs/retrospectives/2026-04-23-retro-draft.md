# Retrospective Draft — 2026-04-23

**Note:** This is a deterministic draft; revise into narrative form.

## Period
From: 2026-04-11 (exclusive)
To: 2026-04-23

## Summary
- Entries reviewed: 40
- Total occurrence count: 78
- Estimated time lost (heuristic): ~4.0h (239 minutes)
- Distinct root-cause clusters: 16

## Analytics

### By Category
| Category | Entries | Occurrences |
|---|---:|---:|
| environment | 8 | 39 |
| process-friction | 11 | 11 |
| dependency | 5 | 9 |
| code-bug | 6 | 6 |
| api-quirk | 3 | 3 |
| flaky-test | 2 | 3 |
| tool-failure | 1 | 3 |
| other | 1 | 1 |
| permission | 1 | 1 |
| skill-gap | 1 | 1 |
| unclear-requirements | 1 | 1 |

### By Impact
| Impact | Entries | Occurrences | Minutes per occurrence |
|---|---:|---:|---:|
| Blocked | 3 | 3 | 30 |
| L | 1 | 1 | 20 |
| M | 8 | 8 | 8 |
| S | 27 | 65 | 1 |
| Unknown | 1 | 1 | 0 |

### By Root-Cause Cluster
| Cluster | Entries | Occurrences |
|---|---:|---:|
| Sandbox search tooling (rg/ripgrep unavailable) | 4 | 24 |
| Automation environment variable gaps | 3 | 14 |
| Other (process-friction) | 10 | 10 |
| Obsidian connector unavailable | 3 | 7 |
| Other (code-bug) | 6 | 6 |
| Other (api-quirk) | 3 | 3 |
| Other (tool-failure) | 1 | 3 |
| Baseline test-suite instability | 1 | 2 |
| Other (dependency) | 2 | 2 |
| Git staging/locking contention | 1 | 1 |
| Other (environment) | 1 | 1 |
| Other (flaky-test) | 1 | 1 |
| Other (other) | 1 | 1 |
| Other (permission) | 1 | 1 |
| Other (skill-gap) | 1 | 1 |
| Other (unclear-requirements) | 1 | 1 |

## Duplicate Description Hashes
No duplicate description hashes detected in this period.

## Root-Cause Clusters

### Sandbox search tooling (rg/ripgrep unavailable)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 15 | 20 | 2026-04-19 | environment | S | Bundled `rg.exe` cannot start inside the Codex desktop sandbox for this repo (`Access is denied`) even though repo sear… |
| 73 | 1 | 2026-04-20 | environment | S | `rg.exe` is present in the Codex sandbox but fails to start with "Access is denied" from the packaged WindowsApps path,… |
| 74 | 1 | 2026-04-20 | environment | S | `rg.exe` again failed to launch in Codex desktop (`Access is denied` from the WindowsApps packaged path) at session sta… |
| 78 | 2 | 2026-04-23 | environment | S | `rg.exe` remained blocked in Codex desktop (`spawnSync rg.exe EPERM` / access denied from packaged WindowsApps path) du… |

### Automation environment variable gaps
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 64 | 1 | 2026-04-19 | environment | S | $CODEX_HOME was unset in the automation shell, so the required automation memory path could not be resolved from env va… |
| 67 | 1 | 2026-04-19 | environment | S | $CODEX_HOME was unset again during Threadbearer coding automation run ( hreadbearer-coding), so memory path resolution … |
| 76 | 12 | 2026-04-23 | environment | S | `$CODEX_HOME` was unset in the Codex automation shell during Threadbearer coding runs, so the required automation memor… |

### Other (process-friction)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 43 | 1 | 2026-04-15 | process-friction | S | Root-level `world-model.json` referenced by repo instructions was not present; the actual file is `src/data/world-model… |
| 44 | 1 | 2026-04-16 | process-friction | S | An ad hoc PowerShell regex/count command failed with a parser error because nested quote escaping around `id: ['\"]` wa… |
| 58 | 1 | 2026-04-18 | process-friction | S | `session-handoff` skill files (`.agents/skills/session-handoff/SKILL.md` and `.claude/skills/session-handoff/SKILL.md`)… |
| 59 | 1 | 2026-04-18 | process-friction | M | Working tree contains uncommitted changes in 8+ files from prior sessions (GameView.tsx AlertBar disable, useTopBarHotk… |
| 61 | 1 | 2026-04-19 | process-friction | Blocked | Scheduled sonnet session found only one Ready-for-Dev issue (THR-153) which is labeled `model:opus`. Per protocol, sonn… |
| 62 | 1 | 2026-04-19 | process-friction | L | Used `git stash` to temporarily revert THR-153 WIP to determine if a full-suite test failure was pre-existing. `git sta… |
| 65 | 1 | 2026-04-19 | process-friction | S | THR-190 handoff comment referenced stale file paths (src/components/GameView.tsx, src/components/DebugPanel.tsx, src/co… |
| 69 | 1 | 2026-04-20 | process-friction | M | A prior Cowork session (2026-04-19 21:13–21:16) drafted a new 7-issue "UI Visual Overhaul" series (THR-199..205) coveri… |
| 72 | 1 | 2026-04-20 | process-friction | S | `git add <specific files>` on main included additional untracked files (`scripts/inspiration-ingest/`, `src/data/inspir… |
| 77 | 1 | 2026-04-21 | process-friction | S | THR-235 Done-when checklist referenced `npm run check:skill-sync:check`, but the repository only defines `check:skill-s… |

### Obsidian connector unavailable
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 66 | 2 | 2026-04-19 | dependency | S | Obsidian MCP tools unavailable — first hit in Codex THR-24 closeout (no callable connector), then reproduced in Cowork … |
| 71 | 1 | 2026-04-20 | dependency | S | Obsidian MCP append step remains unavailable in this session (no callable Obsidian connector tools exposed), so require… |
| 75 | 4 | 2026-04-23 | dependency | S | Obsidian MCP connector tools were unavailable in Codex closeout sessions (no callable Obsidian methods exposed), so req… |

### Other (code-bug)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 40 | 1 | 2026-04-12 | code-bug | M | Strategic action candidate generator used `actor.properties.domainCapability` (singular) but actors store the field as … |
| 41 | 1 | 2026-04-12 | code-bug | M | `phaseAgentDecision` executed strategic actions but assigned the result to a local `state` variable that was discarded … |
| 45 | 1 | 2026-04-17 | code-bug | S | `deriveLocationActivities.ts` referenced `agentNode` (a loop variable from a `for...of` block) outside its loop scope i… |
| 50 | 1 | 2026-04-17 | code-bug | Unknown | TypeScript structural typing silently accepted `UnifiedActionTemplate` where `EncounterTemplate` was expected in `build… |
| 52 | 1 | 2026-04-17 | code-bug | M | `phaseHiddenMarkDecay` used `if (nextMarks.length === marks.length) return {}` as an optimization to detect "no change"… |
| 53 | 1 | 2026-04-17 | code-bug | S | Codex review identified that `consumeMatchingMarks` ran against the post-aftermath state, which can include newly-place… |

### Other (api-quirk)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 48 | 1 | 2026-04-17 | api-quirk | S | Linear `save_issue` with `statusId` or `status` parameter silently returned success (200) but did not update the issue … |
| 49 | 1 | 2026-04-17 | api-quirk | S | Linear `list_issues` tool rejected `orderBy: "priority"` parameter at runtime — the field only accepts `"createdAt"` or… |
| 63 | 1 | 2026-04-19 | api-quirk | M | Linear `save_issue` with `id="THR-183"` (a Done issue) was called during THR-182 session to create a new Deferral issue… |

### Other (tool-failure)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 55 | 3 | 2026-04-19 | tool-failure | S | `RemoteTrigger` with trigger_id `trig_012H3CEdTnrAqY4w81T4rLXz` returned HTTP 404 (trigger not found). |

### Baseline test-suite instability
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 57 | 2 | 2026-04-19 | flaky-test | S | `traceBuffer-integration.test.ts > trace IDs are sequential after clearing` fails when `orchestrator.ts` includes the T… |

### Other (dependency)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 46 | 1 | 2026-04-17 | dependency | S | `LocationNode` in HexMapV2's `LocationIconMesh.ts` has no `id` field — only `hexCol`, `hexRow`, `name`, `locationType`.… |
| 47 | 1 | 2026-04-17 | dependency | S | `omenState.activeOmens` / `OmenTrackTemplate` vocabulary tables do not exist yet — the `omenState` parameter is wired i… |

### Git staging/locking contention
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 68 | 1 | 2026-04-19 | process-friction | S | git add failed with atal: Unable to create .git/index.lock: File exists during THR-25 closeout. Repository had multiple… |

### Other (environment)
| # | Count | Date | Category | Impact | Description |
|---:|---:|---|---|---|---|
| 60 | 1 | 2026-04-19 | environment | S | `Agent` tool with `model: "haiku"` returns "Prompt is too long" even for minimal prompts (under 300 tokens). The shared… |

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

