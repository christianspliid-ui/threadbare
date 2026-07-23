> **title:** `Wiki freshness becomes enforcement — blocking CI gate + exemption token + weekly escape-net — THR-730`
> **linear_issue:** THR-730
> **author:** `Claude Code`
> **created:** 2026-07-23
> **three_pillars:** Engine `N/A — repo tooling only, no engine code` · Content `N/A — no game content touched` · UI `N/A — no player-facing surface`

# Wiki freshness becomes enforcement — THR-730

*Makes the Design Reference Wiki's freshness contract binding at PR-merge time, so core-system documentation can no longer silently drift.*

## Why this is load-bearing

**User intent (verbatim, 2026-07-23 chat):** *"help me with a solution or routine that ensures that our design reference wiki is kept up to date every time a relevant PR is accepted."*

The freshness contract (THR-585) exists — every wiki page declares `sources` globs, and `scripts/check-wiki-freshness.ts` warns when a PR changes matching code without updating the page — but it is **advisory**, buried inside the `continue-on-error: true` `check:process` CI step. Warnings scroll by unread; a relevant PR merges with a stale page and the drift compounds until someone notices. `Docs/design-reference-wiki.md` § Freshness contract explicitly parked the fix: *"Advisory while it stabilizes; flipping to blocking is a later user verdict."* The 2026-07-23 ask is that verdict. Without this, the wiki decays exactly as fast as the DoD bullet is forgotten; with it, staleness becomes structurally impossible to merge un-flagged.

### Substrate inventory (this plan extends, it does not green-field)

| Piece | State today |
|---|---|
| `public/wiki-manifest.json` `sources` globs | All 20 pages declare them. The contract data is complete. |
| `scripts/check-wiki-freshness.ts` | Working lint; already has a `WIKI_FRESHNESS_MODE=blocking` switch that exits 1 on warnings; `payloads` handling (THR-690) covers shell+generated pages. Fail-soft: every inability to resolve the diff or manifest **skips with exit 0**. |
| CI (`.github/workflows/ci.yml`) | Lint runs only inside advisory `check:process`. Nothing blocks. |
| CLAUDE.md DoD bullet | Exists; describes the lint as advisory. |
| `weekly-project-hygiene` scheduled task | Live (THR-677); prompt mirrored at `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md`. No wiki duties today. |

## Design (three parts)

### Part A — Blocking CI step inside the required check

Add a step to the `check` job in `.github/workflows/ci.yml`, after "Generated artifact freshness":

```yaml
- name: Wiki freshness (blocking)
  run: |
    git fetch origin main
    npm run check:wiki-freshness -- --blocking
```

Placement notes (load-bearing):

- **Inside the existing required `Test · Typecheck · Build` job** — no new required status check, no branch-protection change; the merge gate is unchanged in shape, extended in content.
- **The `detect` job already scopes it correctly:** the `check` job only runs when a PR touches non-doc files. Wiki staleness is *caused by* `src/` changes, and every `src/` change sets `code == true` — so a doc-only PR (which cannot make the wiki stale) never hits the gate, and every PR that could make it stale does.
- **The job's checkout needs history for the exemption scan** (Part B): set `fetch-depth: 0` on the `check` job's `actions/checkout` step (the `detect` job stays shallow). On a pull_request event the checkout is GitHub's synthetic merge ref (PR head + current main), so `git diff origin/main` yields exactly the PR's effective changes; on a push-to-main event the diff is empty and the step is inert. Both correct by construction.
- The blocking invocation is CI-only; `check:process` keeps its advisory copy for local/pre-commit ergonomics, byte-for-byte unchanged.

### Part B — Script hardening: `--blocking` flag, loud failures, exemption token

Changes to `scripts/check-wiki-freshness.ts` (all additive):

1. **`--blocking` CLI flag** equivalent to `WIKI_FRESHNESS_MODE=blocking` (env still works). Avoids cross-platform env-prefix problems in npm scripts. Add npm alias `check:wiki-freshness:blocking` for local pre-push use.
2. **Blocking mode fails loud where advisory mode skips.** Skip-on-missing-inputs is correct for an advisory lint and *gate theater* for a blocking one — a gate that silently disarms when its inputs vanish asserts protection it doesn't provide (the `tsc --noEmit` lesson, THR-686/693). In blocking mode: unresolvable `WIKI_FRESHNESS_BASE` → exit 1 with a fix hint; missing or unparseable manifest → exit 1. Advisory behavior unchanged.
3. **Exemption token.** A commit in the PR range may carry, in its body:

   ```
   Wiki-freshness-exempt: <non-empty free-text reason>
   ```

   The script scans `git log --format=%B <base>..HEAD`; if the token is present with a non-empty reason, staleness warnings are reported but do not fail the run (the step prints `EXEMPT — <reason>` so the CI log shows the claim). Empty reason ⇒ no exemption. Mirrors the established `Browser-verify exempt:` DoD pattern: opt-in, stated in the commit body, auditable forever in git history. Legitimate uses: pure refactors, renames, type-only moves — changes matching a `sources` glob without altering documented behavior. If `git log` for the range is unavailable, treat as "no exemption" (fails closed — the gate still fires).
4. **Tests:** token parsing (present / empty-reason / absent), blocking-mode exit codes for the loud-failure cases, advisory mode unchanged. Executor picks the sibling-script test pattern if one exists; otherwise a small vitest file exercising exported helpers (minimal additive refactor of `main()`).

### Part C — Weekly escape-net (routine, not code)

The gate has exactly two blind spots: exemption misuse, and code not covered by any page's `sources` globs. Both are judgment calls, so they go to the weekly hygiene routine rather than a new script. Add a **"Wiki freshness escape-net"** section to the `weekly-project-hygiene` prompt (live `C:\Users\chris\.claude\scheduled-tasks\weekly-project-hygiene\SKILL.md` **and** repo mirror `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md`, same PR — CLAUDE.md mirror rule):

1. **Exemption audit:** `git log origin/main --since='8 days ago' --grep='Wiki-freshness-exempt'`. For each hit, read the reason against the diff; an exemption on a change that plainly altered documented behavior gets a Linear issue (Continuous Improvement, `Infrastructure`) to update the page.
2. **Coverage sweep:** files changed on `main` in the last 8 days under `src/engine/`, `src/data/`, `src/components/` matching **no** page's `sources` glob. If they belong to a documented system, file a ticket to extend that page's globs; for a genuinely undocumented system, add a `backlog` entry to `wiki-manifest.json`.

Findings surface to Christian only when a creative call is needed (`## Needs Christian` heading); glob extensions and page-update tickets are agent-owned technical verdicts (THR-608).

### Documentation updates (same PR as the code)

- `Docs/design-reference-wiki.md` § Freshness contract: record the flip (blocking in CI as of THR-730, user verdict 2026-07-23), document the exemption token and escape-net.
- CLAUDE.md: DoD "Update the Design Reference Wiki" bullet updated from advisory to blocking-gate + exemption-token reality; one-line Pre-commit pointer at `check:wiki-freshness:blocking`.

## Engine pillar

Engine: N/A — no engine, tick-loop, graph, or `src/` code is touched; the change is repo tooling (`scripts/`, `.github/`, npm scripts, docs, one scheduled-task prompt).

## Content pillar

Content: N/A — no game content changes; the wiki pages themselves are untouched (the plan makes *future* code and page updates arrive together).

## UI pillar

UI: N/A — no player-facing surface changes; the wiki HTML is served unchanged. Closing commit states `Browser-verify exempt: process/CI tooling, no runtime UI`.

## Wiring

No orchestrator/GameState/trace surface exists for this change. The structural chain that replaces the wiring table:

| Piece | Hooks into | Consumed by |
|---|---|---|
| `check-wiki-freshness.ts` `--blocking` path | new ci.yml step in required `check` job | GitHub branch protection (existing required check) |
| Exemption token (commit body) | script's `git log base..HEAD` scan | CI log (`EXEMPT — reason` line); weekly audit |
| `sources`/`payloads` manifest data | unchanged — existing contract | same script |
| Escape-net prompt section | `weekly-project-hygiene` live prompt + repo mirror | weekly hygiene report + Linear tickets |
| Doc updates | `Docs/design-reference-wiki.md`, CLAUDE.md | executors' DoD flow |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `WIKI_FRESHNESS_MODE` | `advisory` (local) / `blocking` via `--blocking` (CI) | Gate severity; local pre-commit flow unchanged |
| `WIKI_FRESHNESS_BASE` | `origin/main` | Diff base for changed-file detection |
| Exemption token | `Wiki-freshness-exempt: <reason>` (commit body) | Auditable per-PR opt-out for behavior-neutral changes |
| Hygiene lookback | 8 days | Escape-net window (weekly cadence + one day slack) |

## Tracing

No engine traces — this never runs inside the game, so no `TraceBuffer` interface applies. Observability surfaces: the named CI step's log (stale page + matched globs + any `EXEMPT — reason` line), git history for exemption tokens, and the weekly hygiene report. That is the appropriate inspectability layer for repo tooling (NFP #2 satisfied at the right altitude).

## Fail-soft table

| Failure case | Advisory mode (unchanged) | Blocking mode (new) |
|--------------|---------------------------|---------------------|
| `WIKI_FRESHNESS_BASE` unresolvable | skip, exit 0 | **exit 1** with fetch hint — a disarmed gate must not pass silently |
| Manifest missing / corrupt JSON | skip, exit 0 (defer to `check:design-wiki`) | **exit 1** — gutting the manifest must not disarm the gate |
| Malformed `sources` glob | warn + skip that glob | warning ⇒ exit 1 (`check:design-wiki` catches shape earlier in the same job) |
| No pages declare `sources` | OK, inert | OK, inert (all 20 pages declare them; emptying the manifest trips `check:design-wiki`) |
| `git log` unavailable for token scan | n/a | treated as "no exemption" — fails closed, gate still fires |
| Page is shell + generated payload | `payloads` field handles it (THR-690 / impediment #180) | same, unchanged |

The deliberate inversion — blocking mode fails **loud** where advisory fails soft — is the point of the plan, not an NFP violation: NFP #4 protects the game's tick loop, not CI gates, and the repo's gate precedent (THR-690, THR-693) is that freshness gates block.

## Interface impact

N/A — no cross-system engine contract from `Docs/canon/interface-map.md` is touched. The lint's earlier warning here keys on subsystem names appearing in quoted manifest globs (e.g. `hiddenMark*.ts` inside the `sources` data this plan reads); the plan neither adds, retires, nor reroutes any producer/consumer contract — it only enforces documentation freshness for code others change.

## Three-pillar check

- [x] Engine pillar present (N/A with rationale)
- [x] Content pillar present (N/A with rationale)
- [x] UI pillar present (N/A with rationale)
- [x] Wiring section connects them (structural chain table above)

## Vision audit

- [x] This plan does not contradict any Vision premise — no player-facing or rules-of-play surface; governing texts are process canon (`Docs/design-reference-wiki.md`, CLAUDE.md DoD).

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss).

> Brainstorm companion: `Docs/plans/2026-07-23-wiki-freshness-blocking-gate-brainstorm.md` (written alongside, same pass).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | mode, base, token, lookback all named in the constants table |
| 2. Inspectability | PASS | named CI step output, auditable git tokens, weekly report (right altitude for repo tooling) |
| 3. Determinism | PASS | pure function of (diff, manifest, commit messages); no random code |
| 4. Fail-soft | PASS with note | advisory path unchanged; blocking path intentionally fail-loud per gate precedent (see table) |
| 5. Narrative over mechanical perfection | N/A | no game surface |
| 6. Additive over destructive | PASS | extends existing script and step list; advisory behavior preserved byte-for-byte |
| 7. Performance budget | PASS with note | `fetch-depth: 0` on the check job adds seconds; lint itself sub-second |

## Done when

- [ ] A PR changing a file matched by a wiki page's `sources`, without updating that page/payload and without an exemption token, **fails** the required CI check with the page named in the step log; the same PR passes after either the page edit or a `Wiki-freshness-exempt: <reason>` commit (CI-run evidence links for both cases, exercised on a scratch branch).
- [ ] Advisory local path byte-identical: `npm run check:wiki-freshness` output unchanged on a clean branch.
- [ ] `npm test` and `npx vite build` pass; `npm run check:generated-freshness` clean; types via `tsc -b` net-new diff (not `tsc --noEmit` — no-op, THR-686).
- [ ] `weekly-project-hygiene` live prompt and repo mirror both carry the escape-net section (same PR).
- [ ] `Docs/design-reference-wiki.md` + CLAUDE.md updated as specified.
- [ ] Closing commit body includes `Fixes THR-730` (and PR body — impediment #140) and `Browser-verify exempt: process/CI tooling, no runtime UI`.

## Coordination block

**Suggested model:** sonnet — well-specified tooling change with explicit acceptance tests; no design judgment left open (advisory; the automation runs Opus regardless).

**Parallel-safe with:** any issue not editing `.github/workflows/ci.yml`, `scripts/check-wiki-freshness.ts`, `package.json` scripts block, or CLAUDE.md.

**Mutex with:** any issue editing `.github/workflows/ci.yml` or CLAUDE.md (both files are single-surface merge hotspots).

**Files to touch:**
- Edit: `scripts/check-wiki-freshness.ts` (`--blocking` flag, loud failures, token scan)
- Edit: `package.json` (add `check:wiki-freshness:blocking` alias)
- Edit: `.github/workflows/ci.yml` (`fetch-depth: 0` on check-job checkout; new blocking step)
- Create: test file for the script (per sibling pattern)
- Edit: `Docs/design-reference-wiki.md` (freshness-contract section)
- Edit: `CLAUDE.md` (DoD bullet + pre-commit pointer)
- Edit: `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md` + live `C:\Users\chris\.claude\scheduled-tasks\weekly-project-hygiene\SKILL.md` (escape-net section)

## Notes for the executor

- **Do not** change local default mode to blocking — `check:process` must keep its advisory copy unchanged.
- The synthetic merge-ref diff behavior (Part A) is load-bearing; do not switch the step to a merge-base computation without re-verifying push-to-main inertness.
- `git fetch origin main` in the step is redundant once `fetch-depth: 0` is set — keep it as a cheap idempotent guard or drop it; either is fine (executor's call).
- Exact testable-refactor shape for the script is the executor's call; keep it minimal (export helpers, don't restructure).
- Kill criteria (from the intent proposal): exemption tokens on a majority of gated PRs within ~2 weeks ⇒ globs mis-scoped, fix globs or propose reverting to advisory; unexplainable false blocks ⇒ revert the step (one line) while fixing.

## Intent-judge verdict (Step 8.5)

**Escalate → resolved to Allow via user sign-off, 2026-07-23.** The judge (cold-context Opus subagent) scored all 11 dimensions PASS and verified substrate claims against the repo, but corrected impact class upward to High-risk (edits CLAUDE.md DoD — introducing the `Wiki-freshness-exempt:` escape hatch — plus the required CI check's content and a scheduled-task prompt) and escalated the one genuine product choice: hard gate vs. gate-with-exemption-token. Christian answered via structured chat question: **"Gate + exemption token (Recommended)"** — human gate satisfied via chat review 2026-07-23. Sign-off recorded in `Docs/plans/.intent-proposals/2026-07-23-wiki-freshness-blocking-gate.md`.

## Forked-audit verdicts

Design-audit-pipeline (Step 8.6) skipped with written rationale: pure process/CI-tooling change — Engine/Content/UI axes all N/A as argued above, no Vision premise or rule of play touched, NFP audit inline in this doc, and the intent-judge (which did run, cold) independently verified the substrate and scope claims.
