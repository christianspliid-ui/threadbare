# Action Proposal — wiki freshness blocking gate (THR-730)

## intent_quote

> "help me with a solution or routine that ensures that our design reference wiki is kept up to date every time a relevant PR is accepted."

(Christian, 2026-07-23, chat — the whole ask; single message.)

## scope (what this plan does)

Promotes the existing advisory wiki-freshness lint (THR-585: manifest `sources` globs + `scripts/check-wiki-freshness.ts`) to a blocking step inside the already-required `Test · Typecheck · Build` CI job, so a PR that changes code matching a wiki page's `sources` cannot merge unless the page (or a declared payload) changed in the same PR or a commit carries an auditable `Wiki-freshness-exempt: <reason>` token. Hardens the script so blocking mode fails loud instead of silently skipping when its inputs (base ref, manifest) are missing. Adds a weekly escape-net to the existing `weekly-project-hygiene` task prompt covering the gate's two blind spots: exemption misuse and code uncovered by any `sources` glob. Updates `Docs/design-reference-wiki.md` and the CLAUDE.md DoD bullet to match.

## scope (what this plan does NOT do — explicit non-goals)

- Does not touch any wiki page content, `src/` game code, or the manifest's existing `sources` data.
- Does not auto-generate Manual page prose (rejected — would gut the authored dual-layer design).
- Does not add a new required status check or change branch protection settings.
- Does not add a PR bot, comments, or any new notification surface for Christian.
- Does not change local pre-commit behavior: `check:process` keeps the advisory copy byte-identical.
- Does not implement anything in this session — Fable designs; the executor lane implements (THR-730 → Ready for Dev).

## impact_class

High-risk — judge-corrected upward from the author's original "Reversible" (2026-07-23): the plan edits CLAUDE.md's Definition of Done (introducing the `Wiki-freshness-exempt:` escape hatch), the required CI check's content, and a scheduled-task prompt. Mechanically the change reverts cleanly (delete a step and a flag), but it is a governance/agent-behavior change and is classed accordingly.

## evidence cited

- **Linear issue:** THR-730 (created this session; In Design)
- **Vision premises invoked:** none — process/CI tooling, no player-facing or rules-of-play surface
- **UL terms touched:** none new; uses existing wiki/freshness vocabulary from `Docs/design-reference-wiki.md`
- **Canon pages consulted:** `Docs/canon/process.md` domain (via CLAUDE.md § Design Governance / DoD); `Docs/design-reference-wiki.md` as the pattern's authoritative doc
- **Prior plan docs this builds on:** `Docs/plans/2026-07-03-game-manual-wiki.md` (§4 freshness guardrail), THR-690 (generated-artifact freshness gate precedent), THR-693 (typecheck ratchet — the "gate theater" lesson)
- **Rejected approaches considered and dismissed:** brainstorm companion lists 7 (status-quo exhortation, post-merge-only routine, PR bot, pre-commit hook, separate required check, page-scoped token deferred, auto-generated pages)

## load-bearing decisions touched

None of the CLAUDE.md load-bearing *architectural* decisions (all are game-graph/engine decisions; none concern CI). The plan does interact with a documented settled agreement: the freshness working agreement (user directive 2026-07-03) and its recorded proviso that flipping to blocking awaits a user verdict — this plan treats the 2026-07-23 ask as that verdict, quoted verbatim above.

## high-impact files touched (from Codesight)

None. Files touched: `scripts/check-wiki-freshness.ts`, `package.json`, `.github/workflows/ci.yml`, two docs, one scheduled-task prompt + mirror. No `src/` file at all, hence no importer counts apply (Codesight Step 0.5 skipped per its process-change exemption).

## kill criteria

The gate is wrong if either: (a) exemption tokens appear on a majority of gated PRs within ~2 weeks (the gate is mis-scoped — globs too broad; fix globs or revert to advisory), or (b) the step produces false blocks CI cannot explain from its log (script bug; revert the step — one-line change — while fixing). The weekly escape-net audit is the standing measurement for (a); Christian gets a plain-language recommendation if reversion is warranted.

## explicit user sign-off

Christian, 2026-07-23, chat review (structured question after the intent-judge Escalate): asked "Should the blocking wiki-freshness gate include the exemption escape hatch, or be a hard gate with no exceptions?" — answer: **"Gate + exemption token (Recommended)"**. This is the explicit yes for the High-risk class: blocking gate + exemption token + weekly escape-net, including the CLAUDE.md DoD and hygiene-prompt edits, as designed. Human gate satisfied via chat review 2026-07-23 (THR-608 protocol).

## author notes for the judge

The main tension is deliberate: blocking mode inverts the script's fail-soft posture (skip→fail-loud on missing inputs). This is argued in the plan's fail-soft table as gate-precedent alignment (THR-690/693), not an NFP #4 violation — NFP #4 governs the game runtime. Second note: the exemption token is whole-PR, not page-scoped, accepting coarser granularity for simplicity; the weekly audit is the compensating control. Third: design-audit-pipeline (Step 8.6) is skipped with written rationale in the plan tail — all three pillar axes are N/A for a pure process change; if you judge that skip wrong, say so and it will run.
