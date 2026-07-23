# Brainstorm companion — wiki freshness blocking gate (THR-730)

Alternatives considered before landing on blocking-CI-step + exemption token + weekly escape-net.

## Considered and dismissed

**1. Keep advisory, rely on the DoD bullet harder (status quo plus exhortation).**
Dismissed: the bullet has existed since THR-585 and the warning has existed in `check:process` output — which is `continue-on-error` in CI and read by nobody. The user's ask ("ensures … every time a relevant PR is accepted") is a request for a guarantee; an advisory cannot provide one. Exhortation without a gate is how the `tsc --noEmit` no-op survived for months (THR-686).

**2. Post-merge reactive routine only (scheduled task detects drift after merge, files tickets).**
Dismissed as the *primary* mechanism: it accepts a drift window (stale page live on `main` until the next sweep and the next executor cycle), doubles the number of moving parts (detector + ticket + second PR), and converts a 2-minute in-PR page edit into a full executor round-trip. Kept in reduced form as Part C, where it watches only the gate's blind spots instead of the whole contract.

**3. PR-comment bot (workflow posts a review comment listing stale pages, non-blocking).**
Dismissed: needs `pull-requests: write` (the workflow deliberately runs read-only), adds noise Christian never reads (he is chat-only, THR-608), and — being non-blocking — reduces to option 1 with more machinery.

**4. Pre-commit hook running the lint in blocking mode.**
Dismissed: hooks are bypassable, don't run for every contributor path (worktrees, direct pushes to branches), and the repo's settled precedent is that binding gates live in CI (`check:generated-freshness`, typecheck ratchet). Local remains advisory-by-default with an opt-in `:blocking` alias.

**5. New required status check (separate job) instead of a step in the existing job.**
Dismissed: requires a branch-protection settings change (a Christian-owned switch, per the THR-282 setup) for zero benefit over a step inside the already-required `Test · Typecheck · Build` job.

**6. Page-scoped exemption token (`Wiki-freshness-exempt(page-id): reason`).**
Deferred, not rejected: whole-PR exemption is simpler and the weekly audit catches misuse. If exemption volume grows or PRs regularly touch multiple pages with mixed staleness, add the scoped form then (additive).

**7. Auto-generating wiki page content from code so freshness is definitional.**
Rejected on identity grounds: Manual pages are authored player-voice + designer-notes prose (THR-586–602); generating them would gut the dual-layer design. The generated-artifact path already exists where it belongs (`payloads`, UL dashboard, action catalog) and the lint already honors it.

## Tensions surfaced

- **Friction vs. guarantee.** Every PR touching a documented system now pays either a page edit or an exemption line. That friction *is* the mechanism — the working agreement (2026-07-03) already required the page edit; the gate merely removes the option of silently skipping it.
- **Fail-soft NFP vs. fail-loud gate.** Resolved by scoping: NFP #4 governs the game runtime; CI gates follow the repo's gate precedent (THR-690, THR-693) where silent disarming is the pathology.
- **Where judgment lives.** Glob-matching is mechanical (CI); "should this code be documented at all" is judgment (weekly routine). The design splits along exactly that line.

## Vision premises invoked

None — no player-facing or rules-of-play surface. The relevant governing texts are process canon: `Docs/design-reference-wiki.md` (freshness contract), CLAUDE.md DoD, THR-585/THR-690 precedents.
