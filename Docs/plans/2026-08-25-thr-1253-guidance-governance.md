> **title:** `Guidance governance — manifest, doctrine stamps, divergence audit — THR-1253`
> **linear_issue:** THR-1253
> **author:** Claude Code (design session with Christian, 2026-08-25)
> **created:** 2026-08-25
> **three_pillars:** Engine N/A — delivery-machinery scripts and skills only, no game runtime touched · Content N/A — no player-facing content · UI N/A — no player surface

# Guidance governance — direction changes remove old guidance, continuously — THR-1253

*Three register rulings landed in canon while the surfaces agents actually load kept teaching the retired mode; this plan makes that structurally impossible to repeat silently.*

## Why this is load-bearing

The 2026-08-25 prose-guidance audit established the mechanism of guidance drift: **rulings land in the canonical chain, but agents obey the operative chain** — the prompts, compiled briefs, exemplars, and vault samples they load first. Copies of a rule drift independently (the register model existed in five places, the editorial gate in three), and nothing forces a direction change to sweep its dependents. The cost is demonstrated: three director-level corrections failed to hold, and the pipeline drafted against inverted rules for weeks (THR-1250/1251/1252 are the remediation). Christian's directive: a routine that finds guidance pulling in different directions, ensures direction changes remove the old guidance, and keeps outdated designs out of agent context — *continuously*.

**Three layers, cheapest first.** Layer 1 (single authority + pointers) shipped in THR-1251. This plan builds layers 2 and 3: **change-time enforcement** (a guidance manifest with a freshness gate + doctrine version stamps — removal becomes part of shipping the change) and a **recurring semantic audit** (a `/guidance-audit` skill wired into the weekly retrospective — catches what no grep can).

**Non-goals:** no new scheduled lane (the audit rides the existing retro cadence — respecting the 2026-08-10 process-work throttle; a standalone lane can be revisited when the paused routines resume); no vault CI (the vault is outside the repo — vault dependents are audited by the skill, not gated); no semantic-diff automation (contradiction detection between prose rules is LLM work, deliberately housed in the audit skill, not a script).

## Substrate inventory

Everything extends listed, proven machinery; nothing is green-fielded:

| Premise noun | Existing substrate | This plan |
|---|---|---|
| Manifest + sources → blocking freshness gate | `public/wiki-manifest.json` + `check:wiki-freshness:blocking` (THR-730) | **extends the pattern** — same shape, new manifest for guidance authorities |
| Compiled-artifact freshness | `check:authoring-brief` (sha-pinned sources, blocking since THR-1250), `check:generated-freshness` registry | **preserved** — the guidance gate complements, never duplicates, artifact freshness |
| Skill validation stamps | `last_validated_against` frontmatter (proven insufficient: bumped on a drifted skill 2026-08-25) | **extends** — adds a machine-checkable `validated_doctrine` stamp beside the human date |
| Exemption escape hatch | `Wiki-freshness-exempt:` / `Browser-verify exempt:` commit-body lines | **extends** — `Guidance-sweep:` attestation, same auditable shape |
| Drift detection | `drift-scan` label + reference-drift scans (rulebook→UL etc.) | **extends** — those catch broken references; the audit skill adds the semantic class (contradiction, stale mode) |
| Promotion point | `retrospective` skill (weekly; the 2026-08-10 single promotion point for process findings) | **extends** — gains one step invoking the audit |
| Sunset discipline | six-week sunset-by-default rule (CLAUDE.md § process-work throttle) | **applies to this plan's own machinery** — the gate and stamps sunset unless they catch |

## Engine pillar

Engine: N/A — no game-engine, tick-loop, or graph change. The only executables are Node check scripts in `scripts/`, same class as `check-wiki-freshness.ts`.

## Content pillar

Content: N/A — no player-facing content. The authored artifacts are process surfaces: one manifest, one check script, one skill, one retro-skill step.

## UI pillar

UI: N/A — no player surface, no component, no browser evidence owed (docs/scripts track).

## The design

### 1. The guidance manifest — `Docs/guidance-manifest.json`

One entry per **doctrine authority** (a surface whose rules other surfaces restate or depend on):

```jsonc
{
  "doctrines": {
    "prose": {
      "version": 2,                          // Doctrine v2, 2026-08-25
      "authorities": [
        "Docs/canon/prose.md",
        ".claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md"
      ],
      "dependents": [                         // repo surfaces that restate or apply the doctrine
        ".claude/skills/encounter-pipeline/SKILL.md",
        ".claude/skills/encounter-pipeline/agents/draft-prompt.md",
        ".claude/skills/encounter-pipeline/agents/editorial-prompt.md",
        ".claude/skills/template-encounter-rewrite/SKILL.md",
        ".claude/skills/prose-content-systems/SKILL.md",
        ".claude/skills/prose-vignettes-and-enrichment/SKILL.md",
        ".claude/skills/prose-pipeline/SKILL.md",
        "Docs/exemplars.md",
        "Docs/canon/encounters.md"
      ],
      "manualDependents": [                   // outside CI reach; the audit skill owns these
        "vault:Systems/Tonal Bible.md",
        "vault:Systems/Content Creator Cheat Sheet.md"
      ]
    }
    // "encounter-format", "ui-laws", … added as they prove out — start with prose only
  }
}
```

Starting scope is **one doctrine (prose)** — the domain with demonstrated loss. Adding a doctrine is a deliberate registration, not a default; the manifest is small on purpose.

### 2. The gate — `npm run check:guidance-freshness`

Same contract as `check:wiki-freshness:blocking`, diffing the working tree against `origin/main`:

- A diff that **modifies an authority** without touching every listed dependent **fails**, naming the untouched dependents — unless the commit body carries `Guidance-sweep: <doctrineId> — <one-line disposition>` (the auditable escape hatch for "checked, deliberately unchanged"; mirrors `Wiki-freshness-exempt:`).
- A diff that modifies a **dependent** never fails this gate (downstream edits are free).
- Runs in the `Docs gates` job (guidance surfaces are .md) — a tree-diffing gate, so per the CLAUDE.md general rule it runs **last before push** locally.
- **Advisory for its first two weeks** (log-only), then flipped blocking in a one-line follow-up if it has not false-positived — the THR-899 lesson: a false-positive gate damages the thing it protects.

### 3. Doctrine version stamps

- The manifest's `version` field is the doctrine version. Bumping it is a deliberate act in the ruling PR that changes the doctrine.
- Skills that depend on a doctrine declare `validated_doctrine: prose@2` in frontmatter (additive; `last_validated_against` keeps its human-affirmation role).
- `check:guidance-freshness` also reports any dependent skill whose stamp trails the manifest version — a **named report row**, advisory always (the stamp says "someone re-read this against v2"; forcing it mechanically would recreate date-bump theater).
- On a version bump, every stale stamp is enumerated in the gate output — the ruling PR either re-validates each dependent (bumping its stamp) or attests the sweep. This is the "when we change direction we remove the old guidance" mechanism: the change PR cannot end without disposing of every known restatement site.

### 4. The recurring audit — `/guidance-audit` skill

A new `.claude/skills/guidance-audit/SKILL.md` encoding the 2026-08-25 audit as a repeatable procedure:

1. Read the manifest; read each doctrine's authorities **fresh** (the baseline is always live canon, never a cached summary).
2. Spawn one auditor subagent per partition (skills / Docs / vault, from the manifest's dependents + manualDependents + a bounded discovery grep), each returning per-file verdicts — CURRENT / DRIFTED (quote) / INTERNALLY-CONTRADICTORY (quote both sides) / DELETE-CANDIDATE (replacement named) — plus a ranked pollution list.
3. Findings land as **impediment-log rows** (sub-bar) or a report section; the weekly retro promotes material ones to tickets — per the 2026-08-10 throttle, the audit never files tickets itself. Sole exception (the throttle's own): a finding showing active corruption right now.
4. Invocation: **(a) on demand** after any direction change ("run /guidance-audit" is part of recording a ruling); **(b) from the `retrospective` skill** — one added step: "run /guidance-audit if any doctrine version changed since the last retro, or monthly regardless."

### 5. Sunset

The gate, the stamps, and the retro step enter the standing six-week sunset presumption: each is renewed at retro by citing a catch (a named drift caught before shipping, or an audit finding promoted), else deleted. The manifest itself survives as documentation even if the gate sunsets.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — the engine-oriented rows (orchestrator phase, GameState, traces, player controls) are structurally N/A for delivery-machinery scripts; the table below is this plan's equivalent contract.

| Module | Runs in | Reads | Reports to | Debug visibility |
|--------|---------|-------|------------|------------------|
| `Docs/guidance-manifest.json` | — (data) | — | — | the file |
| `scripts/check-guidance-freshness.ts` | `Docs gates` CI job + local pre-push | manifest + `git diff origin/main` + commit body | CI log, named dependents | `npm run check:guidance-freshness` |
| `validated_doctrine` stamps | frontmatter | manifest version | gate report rows | grep |
| `guidance-audit` skill | on-demand + retro step | manifest, authorities (live), dependents | impediment log / retro report | the report |
| `retrospective` SKILL step | weekly (when routines resume) | manifest versions | retro output | — |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `GUIDANCE_SWEEP_MARKER` | `Guidance-sweep:` | Commit-body attestation prefix the gate honors |
| `GUIDANCE_GATE_MODE` | `advisory` (flip to `blocking` after 2 clean weeks) | Burn-in switch, a named constant in the script |
| `GUIDANCE_AUDIT_CADENCE` | monthly, or on any doctrine version bump | Retro-step trigger rule |
| Manifest `version` per doctrine | `prose: 2` | The doctrine version stamp source of truth |

## Tracing

N/A — no runtime traces; the gate's CI log output and the audit's written report are the inspection surfaces (same class as every other check script).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Manifest missing or unparseable | Gate passes with one loud warning naming the file — a broken manifest must not block unrelated PRs |
| Dependent path in manifest no longer exists | Named report row ("stale manifest entry"), never a failure — the manifest is corrected, not the PR blocked |
| Commit body unreadable in CI context | Gate falls back to PR-body scan for the attestation line, then fails soft to advisory for that run |
| `vault:` dependents | Never gated (outside repo); surfaced only by the audit skill |
| Audit subagent fails/times out | Partition marked `not audited` in the report — explicit absence, never silent |

## Kill criteria

- If the gate false-positives twice in its advisory fortnight (fails a PR that genuinely owed no sweep), the dependent lists are wrong — fix the manifest before flipping blocking; if it recurs after, the gate design is wrong: retire it and keep only stamps + audit.
- If two consecutive audits find nothing across all partitions, drop the retro step to on-version-bump-only (the sunset rule's spirit).
- If maintaining the manifest costs more edits than it prevents (measured: manifest-fix commits vs drift catches at retro), collapse to the stamps-only design.

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar N/A with rationale
- [x] Wiring section connects the process modules

## Vision audit

- [x] This plan does not contradict any Vision premise — pure delivery-machinery governance.
- [x] No Vision edit required. (Forked design-audit deliberately skipped per the design-session workflow's skip rule — `.claude/skills/design-session/SKILL.md` Step 3.2: all three axes N/A, pure process change — rationale recorded here; three prior process plans used the identical skip.)

## Rulebook impact

- [x] This plan does not change a rule of play.
- [ ] If it did, `Docs/canon/rulebook.md` would update in the same PR — N/A here.

## Interface impact

N/A — no cross-system engine contracts; the only interfaces are CI job membership (`Docs gates` gains one step) and the retro skill's step list.

> Brainstorm companion: `Docs/plans/2026-08-25-thr-1253-guidance-governance-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Mode switch, cadence, marker are named constants; doctrine list is data |
| 2. Inspectability | PASS | Gate names its dependents in every failure; audit reports are written artifacts |
| 3. Determinism | PASS | Gate is a pure diff+manifest function; the LLM half (audit) is explicitly out of CI |
| 4. Fail-soft | PASS | Table above — a broken manifest can never block unrelated work |
| 5. Narrative over mechanical | N/A | No player-facing prose |
| 6. Additive over destructive | PASS | New files + one frontmatter key + one retro step; nothing removed |
| 7. Performance budget | PASS | One grep-scale script per PR; audit is scheduled LLM work, not CI |

## Done when

- [ ] Manifest exists with the `prose` doctrine fully enumerated (the THR-1251 pointer sites as dependents)
- [ ] `check:guidance-freshness` runs advisory in `Docs gates`; flip-to-blocking follow-up filed with its date
- [ ] `validated_doctrine: prose@2` stamped on the seven dependent skills
- [ ] `guidance-audit` skill exists and its retro-step wiring is merged into `retrospective` SKILL
- [ ] A deliberate local authority-edit without sweep demonstrates the gate firing (evidence in closeout); docs gates green

## Coordination block

**Impact class: External** — adds a CI step and changes the retrospective skill's procedure.

**Suggested model:** sonnet — scripts and skill-writing against a fully specified plan; the audit skill's text is judgment-light (it encodes an already-run procedure).

**Parallel-safe with:** engine/content queue work.

**Mutex with:** THR-1252 (both may edit `.claude/skills/` prose-skill frontmatter — land after it or rebase); `retrospective` skill edits mutex with any retro-lane change.

**Files to touch:** create `Docs/guidance-manifest.json`, `scripts/check-guidance-freshness.ts`, `.claude/skills/guidance-audit/SKILL.md`; edit `package.json` (script), `.github/workflows/ci.yml` (Docs gates step), `.claude/skills/retrospective/SKILL.md`, seven skill frontmatters (stamps), `Docs/ops/scheduled-tasks-registry.md` only if a lane is later minted (not in this plan).

## Notes for the executor

- **Advisory first is deliberate** (THR-899 precedent: a false-positive gate damages what it protects). Do not ship blocking on day one.
- The stamp check is **always** advisory — forcing it would recreate the date-bump theater `last_validated_against` already demonstrated.
- The audit skill must read authorities live, never embed doctrine text — an embedded baseline is itself a copy that drifts (the disease this plan treats).
- `ci.yml` edit makes the diff code-track (`.github/` is not doc-excluded): run the full code gate on that PR.

## Intent-judge verdict

*2026-08-25, one run:* **Allow** — 11/11 dimensions PASS, zero GAPs/VIOLATIONs; impact class **External** confirmed (CI step + retro-skill procedure + frontmatter contract; High-risk explicitly ruled out). The design-audit skip verified legitimate under design-session Step 3.2's all-axes-N/A rule with three plan precedents; the judge's one nit (skip-rule attribution) is corrected above. Proposal: `Docs/plans/.intent-proposals/2026-08-25-thr-1253-guidance-governance.md`.

## Forked-audit verdicts

Skipped per the design-session workflow's skip rule (Step 3.2): all three axes N/A (pure process change) — rationale in § Vision audit. Intent-judge still gated, verdict above.
