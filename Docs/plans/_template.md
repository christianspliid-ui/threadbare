<!--
Copy to `Docs/plans/YYYY-MM-DD-thr-<id>-<slug>.md`. Fill all `<…>` placeholders.
Delete sections marked CONDITIONAL if they don't apply to your change.
The closing NFP-compliance table is required even on doc-only changes.
Use `N/A — <one-line reason>` instead of deleting Engine / Content / UI sections.
-->

> **title:** `<Short plan title — THR-XXX>`
> **linear_issue:** THR-XXX
> **author:** `<Cowork | Claude Code>`
> **created:** YYYY-MM-DD
> **three_pillars:** Engine `<done | N/A — <reason>>` · Content `<done | N/A — <reason>>` · UI `<done | N/A — <reason>>`

# <Plan title — THR-XXX>

*One sentence: why this is load-bearing.*

## Why this is load-bearing

*One paragraph: the narrative hook before the spec. What breaks without this, and what it unblocks.*

<Explain the problem, the cost of not solving it, and the dependency chain.>

## Engine pillar

*Systems design for the tick loop. If N/A, state `Engine: N/A — <one-line reason>` and remove the subsections below.*

Engine: N/A — <reason> **OR** delete this line and fill the subsections below.

### Systems design

<System architecture, new modules, orchestrator integration.>

### Graph nodes / edges

<New or modified node types and edge types. Reference `src/types/graph.ts`.>

### Tick phases

<Which tick phase(s) this runs in. Reference phase ordering in the orchestrator.>

### Resolution logic

<Scoring, ranking, probability, or selection algorithm.>

### PRNG callouts

<Every seeded random call. No `Math.random()` — NFP #3 requires explicit PRNG.>

## Content pillar

*Content the system requires. If N/A, state `Content: N/A — <one-line reason>` and remove the subsections below.*

Content: N/A — <reason> **OR** delete this line and fill the subsections below.

### Encounter templates

<New or modified encounter templates. Reference `src/data/encounters/`.>

### Prose tables

<New prose table entries, enrichment placeholders, or vignette strata.>

### Attachment content

<New attachment templates or modifier content.>

### Data tables

<World-model.json changes or new data constants.>

## UI pillar

*Player-facing display and debug surfaces. If N/A, state `UI: N/A — <one-line reason>` and remove the subsections below.*

*Screenshot tool (state which applies): Playwright (DOM surfaces) / Claude-in-Chrome (WebGL / HexMapV2 / Three.js) / both.*

UI: N/A — <reason> **OR** delete this line and fill the subsections below.

### Player-facing display

<What the player sees. Reference specific components or views.>

### Event notifications

<Alerts, toasts, or chronicle entries emitted by this feature.>

### Debug inspection (DebugPanel)

<`window.__DEBUG.*` extensions, trace viewer entries, DebugPanel additions.>

### Visual presence (HexMapV2)

<Hex-map signifiers, overlays, or layer changes. Reference `hexmap-layers` skill.>

## Wiring

*For each module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline (`enrichProse()`?), player controls.*

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `<module>` | `<phase>` | `<Component>` | `<field>` | `<trace.type>` | `<surface>` |

## Constants table

*Every tunable number named (NFP #1). Changing game feel = changing a number here, not rewriting logic.*

| Constant | Default | Purpose |
|----------|---------|---------|
| `<CONSTANT_NAME>` | `<value>` | <what this number controls> |

## Tracing

*TypeScript interface for each trace type emitted by this system (NFP #2).*

```ts
// <TraceName> — emitted when <condition>
interface <TraceName>Trace {
  type: '<trace.category.name>';
  // <field>: <type>; // <description>
}
```

## Fail-soft table

*Missing data or unexpected state must never crash the tick loop (NFP #4).*

| Failure case | Fallback |
|--------------|----------|
| <describe failure scenario> | <log + continue, use default value, or skip silently> |

## Blast Radius

*CONDITIONAL — required when any file in scope has ≥100 importers. See CLAUDE.md § Codesight — Codebase Intelligence for the named high-impact files list. Delete this section if no high-impact file is touched.*

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `<src/path>` | `<N>` importers | <one-line note on what cascades> |

## Three-pillar check

- [ ] Engine pillar present (or N/A with rationale)
- [ ] Content pillar present (or N/A with rationale)
- [ ] UI pillar present (or N/A with rationale)
- [ ] Wiring section connects them

## Vision audit

- [ ] This plan does not contradict any Vision premise
- [ ] If it does, the Vision edit is part of this ticket's scope

## Rulebook impact

- [ ] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)
- [ ] If it does, `Docs/canon/rulebook.md` is updated in the same PR

> Brainstorm companion: `Docs/plans/<this-filename>-brainstorm.md` (write alongside, not after).
> *See `game-design-direction/SKILL.md` § Brainstorm Companion for the companion template structure.*

## NFP-compliance table

*Required even on doc-only changes.*

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | `<PASS / PASS with note / FAIL>` | <note — or N/A if no tunable numbers> |
| 2. Inspectability | `<PASS / PASS with note / FAIL>` | <note — trace types emitted, or why none> |
| 3. Determinism | `<PASS / PASS with note / FAIL>` | <note — PRNG usage confirmed, or no random code> |
| 4. Fail-soft | `<PASS / PASS with note / FAIL>` | <note — see fail-soft table above> |
| 5. Narrative over mechanical perfection | `<PASS / PASS with note / FAIL>` | <note — story implications of mechanical choices> |
| 6. Additive over destructive | `<PASS / PASS with note / FAIL>` | <note — new fields added, nothing deleted> |
| 7. Performance budget | `<PASS / N/A>` | <note — no profiling needed, or timing estimate> |

## Done when

*Every closeout commit must include `Fixes THR-XXX` and verification evidence (npm test, tsc, vite build raw output or green CI link) per CLAUDE.md § Definition of Done.*

- [ ] <primary acceptance criterion>
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass
- [ ] Closing commit body includes `Fixes THR-XXX`
- [ ] Browser-verify screenshot at 1920×1080 included **OR** `Browser-verify exempt: <reason>` stated in commit body

## Coordination block

*These three fields are the handoff. Filling them turns this plan into a Ready-for-Dev candidate.*

**Suggested model:** `<sonnet | haiku | opus>` — <one-line rationale; advisory only, the CC automation runs Opus regardless>

**Parallel-safe with:** <THR-XXX — brief reason why no file-level collision>

**Mutex with:** <THR-XXX — brief reason why files or shared state would conflict>

**Files to touch:**
- Create: `<path/to/new/file>`
- Edit: `<path/to/existing/file>` (<one-line description of the edit>)

## Notes for the executor

*Use for clarifications that don't fit the spec — what NOT to do, scope traps, judgment calls already made.*

- <note>

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit <plan-doc-path> -->
<!-- OPTIONAL: only present after design-audit-pipeline has run at plan finalization -->

### NFP audit

<!-- NFP-auditor verdict (≤300 words) inserted here by orchestrator -->

### Three-pillar audit

<!-- Pillar-auditor verdict (≤300 words) inserted here by orchestrator -->

### Vision audit

<!-- Vision-auditor verdict (≤300 words) inserted here by orchestrator -->
