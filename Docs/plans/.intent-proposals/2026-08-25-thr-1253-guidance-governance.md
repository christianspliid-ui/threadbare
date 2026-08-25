# Action Proposal — Guidance governance (THR-1253)

## intent_quote

> it seems in general we need a routine to help audit our design decisions and look for guidance and patterns that pull in different directions and ensure that when we change direction we remove the old guidance.
>
> this probably also means that we need a way to remove outdated designs and guidance from our agents context. how do we do that continuously?

> yes to both

(Christian, chat, 2026-08-25. "Both" = executing the prose-sweep tickets directly AND running this design session; the assistant's immediately preceding message proposed exactly the three-layer mechanism this plan specifies — manifest freshness gate on the wiki-freshness pattern, doctrine version stamps, and a `/guidance-audit` skill riding the weekly retrospective.)

## scope (what this plan does)

Builds the change-time and cadence layers of guidance governance: a `Docs/guidance-manifest.json` registering doctrine authorities → dependents (starting with the `prose` doctrine only), an advisory-then-blocking `check:guidance-freshness` gate (authority edited without dependents touched or a `Guidance-sweep:` attestation ⇒ fail), advisory `validated_doctrine` version stamps in skill frontmatter, a `/guidance-audit` skill encoding the 2026-08-25 three-partition semantic audit, and one added step in the `retrospective` skill. All of it subject to the standing six-week sunset presumption.

## scope (what this plan does NOT do — explicit non-goals)

- No new scheduled lane (rides the weekly retro; respects the 2026-08-10 process-work throttle).
- No vault CI (vault dependents are `manualDependents`, audited by the skill).
- No LLM-in-CI semantic checks (deterministic gates only; the LLM half is the audit skill).
- No mega-manifest — one doctrine registered at start; registration is deliberate.
- The audit never files tickets itself (log rows; retro promotes) — throttle-conformant.

## impact_class

External — adds a CI step, changes the retrospective skill's procedure, and adds frontmatter contract to seven skills.

## evidence cited

- **Linear issue:** THR-1253 (remediation trio THR-1250/1251/1252 as the demonstrated-loss record)
- **Vision premises invoked:** none — pure delivery-machinery governance
- **UL terms touched:** none player-facing; "doctrine", "authority", "dependent" used as process vocabulary in the manifest's own docs
- **Canon pages consulted:** `Docs/canon/prose.md` (the first registered authority), CLAUDE.md § process-work throttle + § sunset rule
- **Prior plan docs this builds on:** `2026-07-23-wiki-freshness-blocking-gate.md` (the gate pattern), the THR-1250 brief fix (derived-not-copied as the strongest form)
- **Rejected approaches considered and dismissed:** brainstorm companion lists seven, incl. LLM-in-CI and blocking-from-day-one (THR-899 precedent)

## load-bearing decisions touched

None of the engine-side decisions. The plan touches process canon: it *implements* the standing "probes sunset by default" rule on its own machinery and formalizes the ruling-is-a-sweep practice already recorded as director feedback (2026-08-25).

## high-impact files touched (from Codesight)

None ≥100 importers — scripts, JSON, skill markdown, `ci.yml`. No Blast Radius owed.

## kill criteria

In the plan doc: two advisory-period false positives ⇒ fix manifest or retire gate; two empty audits ⇒ drop cadence to on-version-bump; manifest maintenance outweighing catches ⇒ collapse to stamps-only.

## explicit user sign-off

Not required (External class). "yes to both" (2026-08-25, chat) commissions the design.

## author notes for the judge

The judgment most worth scrutiny: gating on **file-touch + attestation** rather than any semantic check — a PR can touch a dependent trivially and still leave it wrong. Chosen deliberately: the deterministic gate makes *forgetting* impossible (the demonstrated failure was forgetting, not bad-faith edits), and the semantic layer is the audit skill's job. Second: starting the manifest at one doctrine — the audit found drift concentrated in prose; registering more before the mechanism proves out is the accretion failure mode this repo documents about itself. Third: design-audit-pipeline is skipped under its own all-axes-N/A rule (pure process change), with the rationale written into the plan; intent-judge still gates.
