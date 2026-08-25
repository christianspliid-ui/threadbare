# Brainstorm companion — Guidance governance (THR-1253)

Companion to `Docs/plans/2026-08-25-thr-1253-guidance-governance.md`. Grill-me skipped with rationale: the mechanism was proposed to Christian in chat with the audit findings in front of him and approved ("yes to both"); open decisions were mechanism-shape choices, resolved below.

## The originating failure, stated as a law

**Agents obey the operative chain, not the canonical chain.** A ruling recorded only in canon changes nothing an agent does if a prompt, compiled brief, exemplar, or embedded sample still teaches the old rule — prompts command, examples get imitated, preambles frame first. Three register rulings failed this way. Governance therefore has to bind at **change time** (the ruling PR must dispose of every restatement site) and be verified **semantically on a cadence** (because greps can't see contradiction).

## Alternatives considered and dismissed

- **A new hourly/daily scheduled lane for the audit.** Dismissed: violates the 2026-08-10 process-work throttle's spirit (lanes filing process findings is the pattern that flooded the board), and all nine routines are paused anyway. The weekly retro is the existing, sanctioned promotion point — ride it.
- **Blocking the gate from day one.** Dismissed on the THR-899 precedent: a false-positive gate on prose surfaces damaged the prose it protected. Advisory fortnight, then flip.
- **Making the doctrine-version stamp check blocking.** Dismissed: `last_validated_against` already proved a forced stamp becomes theater (bumped on a drifted skill the same day). The stamp is a *report*, the sweep attestation is the *gate*.
- **Semantic contradiction detection in CI (LLM-in-the-gate).** Dismissed: non-deterministic CI verdicts violate the gate culture (a check must fail the same way twice); the LLM half lives in the audit skill where a human reads the output.
- **One mega-manifest of every guidance doc in the repo.** Dismissed: accretion is the delivery machine's failure mode (CLAUDE.md's own words). One doctrine (prose) with demonstrated loss; registration is deliberate.
- **Embedding the doctrine text in the audit skill.** Dismissed as self-defeating — an embedded baseline is a copy that drifts; the skill reads authorities live.
- **Extending `check:generated-freshness`** to cover this. Dismissed: that gate compares generated artifacts to their sources byte-wise; guidance dependents are hand-written restatements, not generated — different contract, would corrupt a clean gate's meaning.

## Tensions carried

- **Manifest maintenance is itself guidance** that can rot. Mitigations: stale-entry rows are report-not-failure; the audit skill checks the manifest against reality; kill criterion collapses to stamps-only if maintenance outweighs catches.
- **Vault dependents can't be CI-gated.** Accepted: they're `manualDependents`, owned by the audit skill; the alternative (mirroring vault pages into the repo) recreates the two-tree sync problem THR-654 killed.
- **Sunset culture vs standing machinery.** Resolved by subjecting this plan's own machinery to the six-week sunset presumption explicitly — the burden of proof stays on keeping.

## Sources

The 2026-08-25 three-partition audit reports (in-session; findings quoted in THR-1250/1251/1252), the wiki-freshness gate design (`Docs/plans/2026-07-23-wiki-freshness-blocking-gate.md`), the THR-1250 brief fix (derived Section E as the divergence-impossible pattern), CLAUDE.md § process-work throttle.
