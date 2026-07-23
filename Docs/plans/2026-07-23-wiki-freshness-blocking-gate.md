# Wiki freshness becomes enforcement — blocking CI gate + exemption token + weekly escape-net

**Linear:** THR-730 · **Project:** Continuous Improvement · **Date:** 2026-07-23 · **Session type:** design (Fable)
**Brainstorm companion:** `Docs/plans/2026-07-23-wiki-freshness-blocking-gate-brainstorm.md`

## User intent (verbatim, 2026-07-23 chat)

> "help me with a solution or routine that ensures that our design reference wiki is kept up to date every time a relevant PR is accepted."

This is the user verdict that THR-585 explicitly parked: `Docs/design-reference-wiki.md` § Freshness contract says *"Advisory while it stabilizes; flipping to blocking is a later user verdict."* The verdict has now been given.

## Substrate inventory (what already exists — this plan extends, it does not green-field)

| Piece | State today |
|---|---|
| `public/wiki-manifest.json` `sources` globs | All 20 pages declare them (Manual + Deep Reference). The contract data is complete. |
| `scripts/check-wiki-freshness.ts` | Working lint. Diffs branch vs `WIKI_FRESHNESS_BASE` (default `origin/main`), warns when changed files match a page's `sources` but neither the page HTML nor a declared `payloads` entry changed. Already has a `WIKI_FRESHNESS_MODE=blocking` switch that exits 1 on warnings. Fail-soft: every failure to resolve the diff or manifest **skips with exit 0**. |
| CI (`.github/workflows/ci.yml`) | The lint runs only inside `check:process`, which is `continue-on-error: true` — warnings scroll by unread. Nothing stops a stale-wiki PR from merging. |
| CLAUDE.md DoD bullet | "Update the Design Reference Wiki" exists but describes the lint as advisory. |
| `weekly-project-hygiene` scheduled task | Live (THR-677); prompt mirrored at `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md`. No wiki-freshness duties today. |

**Gap:** enforcement and escape-net. The mechanism exists; nothing makes it binding at the moment a relevant PR merges, and nothing watches the gate's two blind spots (exemptions and uncovered code).

## Design

Three parts. A is the enforcement; B makes A safe to live with; C watches A's blind spots.

### Part A — Blocking CI step inside the required check

Add a dedicated step to the `check` job in `.github/workflows/ci.yml`, after "Generated artifact freshness":

```yaml
- name: Wiki freshness (blocking)
  run: |
    git fetch origin main
    npm run check:wiki-freshness -- --blocking
```

Placement notes (load-bearing):

- **Inside the existing required `Test · Typecheck · Build` job** — no new required status check to register in branch protection; the merge gate is unchanged in shape, extended in content.
- **The `detect` job already scopes it correctly.** The `check` job only runs when a PR touches non-doc files. Wiki staleness is *caused by* `src/` changes, and every `src/` change sets `code == true` — so a doc-only PR (which cannot make the wiki stale) never hits the gate, and every PR that could make it stale does.
- **The job's checkout needs history for the exemption scan** (Part B): set `fetch-depth: 0` on the `check` job's `actions/checkout` step (the `detect` job stays shallow). On a pull_request event the checkout is GitHub's synthetic merge ref (PR head + current main), so `git diff origin/main` yields exactly the PR's effective changes; on a push-to-main event the diff is empty and the step is inert. Both behaviors are correct by construction.
- The step stays **out of `check:process`** duplication — `check:process` keeps running the advisory copy for local/pre-commit ergonomics; the blocking invocation is CI-only.

### Part B — Script hardening: `--blocking` flag, loud failures, exemption token

Changes to `scripts/check-wiki-freshness.ts` (all additive):

1. **`--blocking` CLI flag** equivalent to `WIKI_FRESHNESS_MODE=blocking` (env still works). Avoids cross-platform env-prefix problems in npm scripts and lets CI use the plain `npm run` form. Add npm alias `check:wiki-freshness:blocking` for local pre-push use.
2. **Blocking mode fails loud where advisory mode skips.** The current fail-soft (skip + exit 0 on unresolvable base ref or missing/corrupt manifest) is correct for an advisory lint and *gate theater* for a blocking one — a gate that silently disarms when its inputs vanish asserts protection it doesn't provide (the `tsc --noEmit` lesson, THR-686/693). In blocking mode: unresolvable `WIKI_FRESHNESS_BASE` → exit 1 with a fix hint (`git fetch origin main`); missing or unparseable manifest → exit 1. Advisory-mode behavior is byte-for-byte unchanged.
3. **Exemption token.** A commit in the PR range may carry, in its body:

   ```
   Wiki-freshness-exempt: <non-empty free-text reason>
   ```

   The script scans `git log --format=%B <base>..HEAD` for the token; if present with a non-empty reason, staleness warnings are reported but do not fail the run (the step prints `EXEMPT — <reason>` so the CI log shows the claim). A token with an empty reason does **not** exempt. This mirrors the established `Browser-verify exempt:` DoD pattern: opt-in, stated in the commit body, auditable forever in git history. Legitimate uses: pure refactors, renames, type-only moves — changes matching a `sources` glob without altering documented behavior. If `git log` for the range is unavailable, the scan treats it as "no exemption" (fails closed — the gate still fires).
4. **Tests.** Unit-test the new pieces the same way the script's logic is structured today: token parsing (present/empty-reason/absent), blocking-mode exit codes for the loud-failure cases, advisory-mode unchanged. Executor picks the harness pattern used by sibling script tests if one exists; otherwise a small vitest file exercising the exported helpers (refactor `main()` minimally to export them — additive).

### Part C — Weekly escape-net (routine, not code)

The gate has exactly two blind spots: (1) exemption misuse, (2) code not covered by any page's `sources` globs. Both are judgment calls, so they go to the weekly hygiene routine rather than a new script.

Add a **"Wiki freshness escape-net"** section to the `weekly-project-hygiene` task prompt (live copy at `C:\Users\chris\.claude\scheduled-tasks\weekly-project-hygiene\SKILL.md` **and** its repo mirror `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md`, same PR — the mirror rule in CLAUDE.md § Scheduled Tasks):

1. **Exemption audit:** `git log origin/main --since='8 days ago' --grep='Wiki-freshness-exempt'`. For each hit, read the reason against the diff; an exemption on a change that plainly altered documented behavior gets a Linear issue (Continuous Improvement, label `Infrastructure`) to update the page.
2. **Coverage sweep:** files changed on `main` in the last 8 days under `src/engine/`, `src/data/`, `src/components/` that match **no** page's `sources` glob. Judge whether they belong to a documented system; if yes, file a ticket to extend that page's globs (cheap) or, for a genuinely undocumented system, add a `backlog` entry to `wiki-manifest.json` per the existing pattern.

Findings go under the task's own `## Needs Christian` heading only when a creative call is needed; glob extensions and page-update tickets are the agent's to file (technical verdicts stay agent-owned per THR-608).

### Documentation updates (same PR as the code)

- `Docs/design-reference-wiki.md` § Freshness contract: record the flip (blocking in CI as of THR-730, user verdict 2026-07-23), document the exemption token and the escape-net routine.
- CLAUDE.md: DoD "Update the Design Reference Wiki" bullet — replace "advisory `npm run check:wiki-freshness` lint flags misses" with the blocking-gate + exemption-token reality; one-line addition to the Pre-commit list pointing at `check:wiki-freshness:blocking` for pre-push self-checks.

## Three-pillar check

**Engine: N/A** — no engine, tick-loop, or graph code is touched; the change is repo tooling (`scripts/`, `.github/`, npm scripts).
**Content: N/A** — no game content changes; the wiki pages themselves are untouched by this plan (the plan makes *future* content/page updates arrive together).
**UI: N/A** — no player-facing surface changes; the wiki HTML is served unchanged. Browser-verify exempt by the DoD types-only/no-runtime-UI clause — the closing commit must state the exemption.
**Wiring** — covered structurally: ci.yml step → script `--blocking` path → manifest `sources` data → hygiene prompt + mirror → docs. No orchestrator/GameState/trace surface exists for this change.

## Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `WIKI_FRESHNESS_MODE` | `advisory` (local) / `blocking` via `--blocking` (CI) | Gate severity; local pre-commit flow unchanged |
| `WIKI_FRESHNESS_BASE` | `origin/main` | Diff base for changed-file detection |
| Exemption token | `Wiki-freshness-exempt: <reason>` (commit body) | Auditable per-PR opt-out for behavior-neutral changes |
| Hygiene lookback | 8 days | Escape-net window (covers a weekly cadence with one day of slack) |

## Tracing (NFP #2)

No engine traces — this never runs inside the game. Observability surfaces: the named CI step's log (stale page + matched globs + any `EXEMPT — reason` line), git history for exemption tokens, and the weekly hygiene report. That is the appropriate inspectability layer for repo tooling.

## Fail-soft table (NFP #4)

| Failure case | Advisory mode (unchanged) | Blocking mode (new) |
|---|---|---|
| `WIKI_FRESHNESS_BASE` unresolvable | skip, exit 0 | **exit 1** with fetch hint — a disarmed gate must not pass silently |
| Manifest missing / corrupt JSON | skip, exit 0 (defer to `check:design-wiki`) | **exit 1** — gutting the manifest must not disarm the gate |
| Malformed `sources` glob | warn + skip that glob | warning ⇒ exit 1 (`check:design-wiki` catches shape earlier in the same job) |
| No pages declare `sources` | OK, inert | OK, inert (all 20 pages declare them; emptying the manifest trips `check:design-wiki`) |
| `git log` unavailable for token scan | n/a | treated as "no exemption" — fails closed, gate still fires |
| Page is shell + generated payload | `payloads` field already handles it (THR-690 / impediment #180) | same, unchanged |

The deliberate inversion — blocking mode fails **loud** where advisory fails soft — is the point of the plan, not an NFP violation: NFP #4 protects the game's tick loop, not CI gates, and the repo's own precedent (generated-artifact freshness, THR-690) is that freshness gates block.

## NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — mode, base, token, lookback all named above |
| 2 Inspectability | PASS — named CI step output, auditable git tokens, weekly report |
| 3 Determinism | PASS — pure function of (diff, manifest, commit messages) |
| 4 Fail-soft | PASS with note — advisory path unchanged; blocking path intentionally fail-loud (see table) |
| 5 Narrative over mechanical | N/A — no game surface |
| 6 Additive over destructive | PASS — extends the existing script and step list; no rewrites, advisory behavior preserved |
| 7 Performance budget | PASS with note — `fetch-depth: 0` on the check job adds seconds; the lint itself is sub-second |

## Executor action items

1. `scripts/check-wiki-freshness.ts`: `--blocking` flag; blocking-mode loud failures (base ref, manifest); exemption-token scan of `base..HEAD` commit bodies (fail-closed on scan error); keep advisory path byte-identical.
2. `package.json`: add `check:wiki-freshness:blocking` alias.
3. `.github/workflows/ci.yml`: `fetch-depth: 0` on the `check` job checkout; new "Wiki freshness (blocking)" step (fetch origin main, run blocking) after "Generated artifact freshness".
4. Tests for item 1 (see Part B.4).
5. `Docs/design-reference-wiki.md` + CLAUDE.md updates (see Documentation updates).
6. `weekly-project-hygiene` prompt: add the escape-net section to the live `SKILL.md` **and** the repo mirror in the same change.
7. Verify: `npm test`; a local dry run of both modes (advisory unchanged; `--blocking` on a branch with a deliberate stale-page diff exits 1, and with an exemption commit exits 0 with the EXEMPT line); `npx vite build`; `check:generated-freshness`.

## Grey zones / executor decisions

- Exact refactor shape for making the script testable (export helpers vs. spawn-based test) — executor's call, keep it minimal.
- Whether `git fetch origin main` in the step is redundant once `fetch-depth: 0` is set (it is — keep it anyway as a cheap idempotent guard, or drop it; either is fine).

## Forked-audit note

Design-audit-pipeline (Step 8.6) skipped with rationale: pure process/CI-tooling change — Engine/Content/UI axes are all N/A as argued above, no Vision premise or rule of play is touched, and the NFP audit is inline in this doc.

## Intent-judge verdict (Step 8.5)

**Escalate → resolved to Allow via user sign-off, 2026-07-23.** The judge (cold-context Opus subagent) scored all 11 dimensions PASS and verified the substrate claims against the repo, but corrected the impact class upward to High-risk (the plan edits CLAUDE.md's DoD — introducing the `Wiki-freshness-exempt:` escape hatch — plus the required CI check's content and a scheduled-task prompt) and escalated the one genuine product choice: hard gate vs. gate-with-exemption-token. Christian answered via structured chat question: **"Gate + exemption token (Recommended)"** — human gate satisfied via chat review 2026-07-23. Sign-off recorded in the action proposal (`Docs/plans/.intent-proposals/2026-07-23-wiki-freshness-blocking-gate.md`).
