# Ubiquitous Language Skill

## Purpose

Maintain and enforce the canonical glossary at `Docs/ubiquitous-language/`. Load it at session start, propose new terms when you encounter undeclared concepts, flag retirements for stale terms, and resolve terminology disagreements in UL's favor.

## When to invoke

- **Automatically at session start** — CLAUDE.md references `Docs/ubiquitous-language/README.md`; this skill governs how to use it
- **Proposal mode** — when you encounter a concept in code, docs, or plans that has no UL entry
- **Retirement mode** — when you notice a canonical term that appears stale or superseded
- **Arbitration mode** — when CLAUDE.md, Obsidian, a plan doc, or code comments disagree with UL's definition

## Loading strategy

**Always load:** `Docs/ubiquitous-language/README.md` — the index (~3k tokens). CLAUDE.md references this file in Session Workflow; treat it as a mandatory orientation step alongside CLAUDE.md itself.

**Load on demand:** individual shard files when the active task references their terms:
- Touching encounter code or templates → load `Encounters.md`
- Touching cosmology, reach, sphere systems → load `Cosmology.md`
- Touching graph architecture, versioning, position → load `Graph.md`
- Touching prose, enrichment, resolvers → load `Prose.md`
- Touching agents, factions, actor nodes → load `Agents.md`
- Coordination protocol questions → load `Coordination.md`
- NFPs, design governance, process → load `Process.md`

## Propose a new term

When you encounter a concept used in code, docs, or plans that has no UL entry, open a Linear issue using the template below.

**Trigger:** capitalized identifier, defined struct name, or repeated concept phrase in `src/**`, `Docs/**`, or Obsidian that doesn't appear in the UL index.

**How to open:**

```
save_issue({
  title: "UL-proposal: <term name>",
  team: "Threadbare",
  project: "Continuous Improvement",
  labels: ["UL-proposal"],
  state: "Backlog",
  description: <use the template below>
})
```

**Issue body template:**

```markdown
## Proposed Term

**Term:** <exact term as used in the codebase>
**Proposed shard:** <Cosmology | Agents | Encounters | Prose | Graph | Coordination | Process>
**Content-adjacent:** <yes | no>

## Where encountered

> <verbatim quote of the code/doc context where the term appeared>

**Source:** `<file path>`

## Proposed definition

**Aliases:** <comma-separated alternative names, if any>
**Also see:** <related UL terms>

<One-sentence intent-focused definition. What the concept *is*, not what code does with it.>

<Optional: 2-3 sentences of context — why this term exists, what it's distinguished from, where it's used.>

## Relationship to existing UL terms

<How does this relate to or differ from the closest existing canonical terms?>

## Content-taxonomy expansion candidate

<If content-adjacent: does this term suggest a missing category in encounter templates, prose tables, or data? Name it explicitly.>
<If not content-adjacent: N/A>
```

## Propose a retirement

When a canonical UL term hasn't appeared in `src/**`, `Docs/**`, or the Obsidian vault for more than 30 days (`UL_DRIFT_STALE_DAYS`), open a retirement proposal.

```
save_issue({
  title: "UL-proposal: retire '<term>'",
  team: "Threadbare",
  project: "Continuous Improvement",
  labels: ["UL-proposal"],
  state: "Backlog",
  description: <retirement template below>
})
```

**Retirement body template:**

```markdown
## Retirement Proposal

**Term:** <term name>
**Shard:** <shard file>

## Evidence of staleness

Last observed in: <file/doc, or "not found in any current source">
Days since last appearance: ~<estimate>

## Recommendation

<retire (remove from shard + index) | deprecate (mark status: deprecated, keep for reference) | keep (false alarm — still used, explain why)>

## Impact if retired

<Any downstream docs or code comments that reference this term and would need updating.>
```

## Arbitration mode

When you detect a terminology disagreement between sources (CLAUDE.md, Obsidian, a plan doc, code comment) and the UL:

1. **UL wins.** Use the UL-canonical term in your output.
2. Open a Linear issue to reconcile the conflicting artifact:

```
save_issue({
  title: "UL-proposal: reconcile '<conflicting source>' with UL definition of '<term>'",
  team: "Threadbare",
  project: "Continuous Improvement",
  labels: ["UL-proposal"],
  state: "Backlog",
  description: "Source X uses '<non-canonical term>' where UL defines '<canonical term>'. Source: <file path + line>. Reconcile the source to match UL."
})
```

## Constants

| Constant | Default | Purpose |
|---|---|---|
| `UL_DRIFT_STALE_DAYS` | 30 | Canonical-unused retirement threshold (used by drift scan S4) |

## Fail-soft

| Failure | Degraded behavior |
|---|---|
| Shard file missing | Skill reports the missing shard, loads the others, continues |
| README missing | Warn at session start, proceed without UL loading |
| Linear API unavailable during proposal | Log the proposed term locally in `Docs/ubiquitous-language/.proposals.md` for deferred submission |
| Conflicting sources unclear | Surface both definitions to user, ask for verdict rather than auto-resolving |

## Drift detection (stub — full implementation in THR-273)

Two signals feed into the weekly drift scan:

**A — Canonical-unused:** a term is in UL but hasn't appeared in `src/**`, `Docs/**`, or the Obsidian vault for `>UL_DRIFT_STALE_DAYS` days. The drift scan opens a retirement proposal automatically.

**B — Used-uncanonical:** a capitalized identifier or repeated concept phrase appears in `src/**` or `Docs/**` but not in UL. The drift scan opens a UL-proposal automatically.

In v1, both signals are produced by the drift scan GitHub Action. The skill's `proposeNewTerm()` and `proposeRetirement()` stubs are called by that action — they are not interactive in this version.
