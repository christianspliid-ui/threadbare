> **title:** `Deploy health signal — catching a silent production stoppage within the hour — THR-785`
> **linear_issue:** THR-785
> **author:** `Claude Code`
> **created:** 2026-07-27
> **three_pillars:** Engine `N/A — reads CI metadata and git; touches no tick-loop or src/ runtime path` · Content `N/A — no encounters, prose, templates or data` · UI `N/A — a CLI probe and a hourly markdown brief; renders nothing`

# Deploy health signal — catching a silent production stoppage within the hour — THR-785

*Production could stop deploying and the only evidence was a status check the executor lane is correctly trained to ignore.*

## Why this is load-bearing

`main` can advance while the deployed artifact does not, and nothing surfaces it. The only native signal is a red `Vercel` status check on PRs — deliberately outside the required set (`{"contexts":["Test · Typecheck · Build"],"strict":true}`). Agents are correctly taught that Vercel is not the merge gate, so a red Vercel X is *exactly* the signal the executor lane steps past. In the originating incident production deploys had stopped entirely, and it took an unrelated ticket's closeout (THR-761, PR #892) reading an error body to notice.

CLAUDE.md's Definition of Done said *"Vercel auto-deploys from GitHub on push to `main`. Just ensure the push succeeded"* — treating a successful push as proof of deployment. During that window it was not.

The tier upgrade to Vercel Pro removed one *cause* (a quota lapse). It did not touch the class: a bad env var, a Vercel incident, a build that passes `vite build` locally but fails on their builder, or a billing lapse all produce the same silence. Without this, the *next* stoppage is again found by luck.

### The trap in the obvious fix

The ticket proposed `gh api repos/christianspliid-ui/threadbare/commits/<sha>/status --jq .state` as the one-command confirmation. **Measured 2026-07-27, that command is not sufficient** — it would have shipped a check that reports healthy during exactly the failure it was built to catch:

```
$ gh api repos/christianspliid-ui/threadbare/commits/a9c33078/status --jq '.statuses[]'
{"context":"Vercel","state":"success","description":"Canceled by Ignored Build Step"}

$ gh api "repos/christianspliid-ui/threadbare/deployments?sha=a9c33078"
(empty)
```

`success` for a commit with **no deployment record at all**. `vercel.json` carries an `ignoreCommand` that exits 0 — skip the build — when a commit touches none of the build-relevant paths, and Vercel reports a skipped build as a *successful* commit status. A green `Vercel` check means "Vercel is not unhappy"; it never means "production serves this commit". Logged as impediment #237.

## Engine pillar

Engine: N/A — the probe reads the GitHub deployments API and git metadata. It touches no tick phase, no orchestrator, no graph node or edge type, and nothing under `src/`.

## Content pillar

Content: N/A — no encounters, prose, templates, attachments or content tables. The probe's six verdict summaries are operator-facing English, not game content, and are governed by THR-608 plain-language rules rather than the Threadbare voice registers.

## UI pillar

UI: N/A — the surfaces are a CLI command (`npm run check:deploy`) and a markdown line in `Design/briefing.md`. No component, no view, no HexMapV2 surface, no `index.css`. Browser-verify is exempt on the stated grounds.

## Wiring

| New module | Called from | Proof it is not dead |
|---|---|---|
| `scripts/check-deploy-health.ts` | `npm run check:deploy` (`package.json`), invoked by `keep-work-flowing-cc` step 2.5 and named in CLAUDE.md's DoD Deploy bullet | Run live this session: `verdict=skipped needs-christian=no deployed=1a9e4cd5` |
| `classifyDeployHealth` (pure) | the script's `main()`; 17 unit tests | Tests cover all six verdicts plus both grace-window edges |
| `parseBuildRelevantPaths` | `readBuildRelevantPaths()` | A test parses the **live** `vercel.json` and asserts `src` and `package.json` are among the paths |

The scheduled-task prompt exists in two places by convention (CLAUDE.md § Scheduled Tasks): the repo mirror `Docs/ops/scheduled-task-prompts/keep-work-flowing-cc.md` and the live prompt at `C:\Users\chris\.claude\scheduled-tasks\keep-work-flowing-cc\SKILL.md`. Both updated this session and verified byte-identical.

Checked against `Docs/plans/wiring-checklist.md`: no new engine module (nothing to call from the orchestrator), no modal (nothing to render in GameView JSX), no `GameState` field (nothing for the UI to consume), no trace emitter. The one surface the checklist does cover — a new script reachable from a documented command — is wired via `package.json` and cited from both CLAUDE.md and the hourly skill, so it has two named callers rather than none.

## Interface impact

N/A — no cross-system read or write named in `Docs/canon/interface-map.md` is added, retired or rerouted. The probe consumes external HTTP APIs and git plumbing; nothing in `scripts/interface-contracts.ts` changes. The lint's subsystem match is a keyword false positive from prose in this document.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `DEPLOY_STALE_GRACE_MINUTES` | 20 | How long an undeployed `main` commit is "probably still building" rather than a stoppage. Builds land in ~45s, so this is generous enough that a queued build never false-alarms and tight enough that a real stoppage surfaces in the same hourly brief. |
| `DEPLOY_LOOKBACK` | 10 | Production deployments walked back looking for the newest successful one. Bounds API cost; a run of more than this many consecutive failures is itself the alarm. |
| `GH_REPO` | `christianspliid-ui/threadbare` | Repository whose deployments describe production |
| `PRODUCTION_ENVIRONMENT` | `Production` | Deployment environment name Vercel uses |
| `FALLBACK_BUILD_RELEVANT_PATHS` | wide list | Used only when the `ignoreCommand` cannot be parsed |

## Tracing

The probe prints exactly two lines (or one JSON object under `--json`), which is its whole inspectability surface — it emits no `emitTrace` calls because it runs outside the tick loop.

```
[deploy-health] verdict=<v> needs-christian=<yes|no> [deployed=<sha8>]
[deploy-health] <plain-language summary>
```

A parse failure of `vercel.json` adds one `[deploy-health] warn:` line, so a silent fallback to the wide path list is impossible.

N/A — no `emitTrace` call: the probe runs outside the tick loop and has no `GameState`, so there is no trace buffer to write to. The stdout lines above are the equivalent inspectability surface.

## Fail-soft table

| Failure mode | Behaviour |
|---|---|
| `gh` missing, unauthenticated, or network down | `verdict: unknown`, `needsChristian: false`, exit 0 |
| `git rev-parse origin/main` fails | `verdict: unknown`, exit 0 |
| Deployed SHA not present locally | one `git fetch` attempt, then `buildIrrelevantSince → null` → `verdict: unknown` |
| `vercel.json` unreadable or `ignoreCommand` unparseable | warn, fall back to the **wide** path list (over-report, never under-report) |
| No Production deployments visible at all | `verdict: unknown`, not an alarm |
| Probe fails to run at all inside the hourly brief | one Freshness line, brief continues (skill § Fail-soft) |

An unreadable probe is never reported as a healthy deploy — the one asymmetry the whole design turns on.

## Blast Radius

Additive only. One new script, one new npm script, one new test file. No existing runtime path changed; `package.json`'s other scripts are untouched. The CLAUDE.md and skill edits are documentation. Worst case if the probe is wrong: a spurious `## Needs Christian` line in one hourly brief, or a missed alarm that the next hour retries.

## Three-pillar check

Infrastructure-only by nature. The three-pillar rule exists to stop half-built *features* shipping; an observability probe has no player-facing half to omit.

- [x] **Engine** — N/A: no tick phase, orchestrator, graph node or edge type, and nothing under `src/`
- [x] **Content** — N/A: no encounters, prose, templates, attachments or content tables
- [x] **UI** — N/A: a CLI command and a markdown line; no component, view, HexMapV2 surface or `index.css`
- [x] **Infrastructure** — the whole of the change: one script, one npm script, one skill step, two doc surfaces
- [x] Each N/A carries a one-line reason in its own section above, per the Three-Pillar Rule's exit criteria

## Vision audit

- [x] No conflict with `game-design-direction` — the probe is operator tooling and never appears in the player's world
- [x] Touches no Reach, Sphere, Quintessence, ascendant capability, or narrative surface
- [x] Introduces no rejected approach from `reference/deprecated.md`

## Rulebook impact

- [x] No rule of play changes — no turn structure, action verb, prerequisite, resource, encounter, clock, or win/loss condition
- [x] `Docs/canon/rulebook.md` and its quick-reference need no edit; no `[IMPL]` / `[DESIGN]` / `[OPEN]` marker moves

## NFP-compliance table

| NFP | How this change complies |
|---|---|
| 1. Tunability | Every threshold is a named exported constant (`DEPLOY_STALE_GRACE_MINUTES`, `DEPLOY_LOOKBACK`); changing the grace window is changing a number |
| 2. Inspectability | Two trace lines per run naming verdict, subject SHA and reason; `--json` for machine reads; a warn line whenever the path list falls back |
| 3. Determinism | `classifyDeployHealth` is pure with the clock injected as `nowMs`, so tests pin exact grace-window boundaries rather than sleeping |
| 4. Fail-soft | Every external call wrapped; all failures degrade to `unknown` and exit 0. The probe can never be the reason a brief or closeout fails |
| 5. Narrative over mechanical perfection | Summaries are written for Christian in plain language ("The live site is behind…"), and a test asserts no API vocabulary leaks into them |
| 6. Additive over destructive | New file, new npm script, new tests; no existing behaviour altered |
| 7. Performance budget | Normal case is 2–3 API calls per hourly run; `DEPLOY_LOOKBACK` bounds the worst case |

## Done when

- [x] A failed production deploy on `main` produces a signal not dependent on reading a non-required check — `keep-work-flowing-cc` step 2.5 runs the probe hourly and puts `needsChristian` summaries verbatim into `## Needs Christian`
- [x] CLAUDE.md's DoD "Deploy" bullet stops treating a successful push as sufficient and names the confirmation command — with the measured reason the ticket's own proposed command was rejected
- [x] Recorded explicitly that Vercel is **not** a required check and must not become one, in both the DoD bullet and the branch-protection paragraph
- [x] The `skipped` verdict falsified in both directions against real history, so the benign path is not vacuous

## Coordination block

**Suggested model:** Opus (single-executor lane; ran on Opus)
**Files to touch:** `scripts/check-deploy-health.ts` (new), `scripts/__tests__/check-deploy-health.test.ts` (new), `package.json`, `CLAUDE.md`, `.claude/skills/keep-work-flowing-cc/SKILL.md`, `Docs/ops/scheduled-task-prompts/keep-work-flowing-cc.md`
**Parallel-safe with:** anything not editing `CLAUDE.md`, `package.json`, or `.claude/skills/keep-work-flowing-cc/SKILL.md`
**Mutex with:** none — no open ticket edits these files

## Notes for the executor

Shipped in one pass; nothing deferred. Two follow-on observations, neither filed because neither is a defect:

- The probe is deliberately **not** a commit gate. It exits 0 without `--strict`. If a future ticket wants it blocking, that is a decision to make explicitly, and it should not be made by promoting the Vercel check.
- The out-of-scope item on the ticket stands: deployment-volume attribution by lane, and scoping previews off `claude/*` / `docs/briefing-*` branches. On Pro that is cost hygiene rather than a blocker, and Christian has the cost picture and the call.

## Forked-audit verdicts

Not applicable — this plan doc was written by the executing session as a decision record alongside the implementation, not authored in a design session and handed off. The three-pillar N/A rationale and NFP table above were self-audited against `Docs/canon/design-governance.md`.
