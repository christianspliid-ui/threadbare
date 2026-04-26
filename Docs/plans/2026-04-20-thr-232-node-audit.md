# Codex brief — THR-232: Game-node audit

## Context

Threadbare is moving to a unified content substrate: one composition DSL (THR-222) and one ontology (reaches / spheres / archetypes) spanning all authored game content. Before the ontology taxonomy can be frozen (THR-220), we need a complete inventory of every node type it has to classify. Beyond the obvious entity types (agents, factions, events, quests, locations, artifacts, encounters), the codebase almost certainly has attachments, conditions, modifiers, mandate flags, doom-clock state, and other categories that may not fit the same classification axes. This audit is the blocking input for ontology design.

This is an **audit**. Read-only. Do not modify any content-type files.

## Goal

Produce a complete, file-referenced inventory of every node type currently defined in the Threadbare codebase. For each, answer three questions:

1. **Tagging** — does it need ontology tagging? Are reaches / spheres / archetypes the right axes, or does it need additional or different axes?
2. **Recipes** — does it participate in composition recipes? As a findable/creatable node, as a precondition, as an effect, or as a side-channel?
3. **Edges** — is it adequately covered by existing edge types, or are there missing edges?

## Approach

1. **Discover content-type definitions.** Don't assume file locations. Search for schemas, type definitions, CMS models, and content configs. Grep for `defineContentType`, `Schema`, `Model`, `ContentType`, `NodeType`, `collection`, `entity`, and framework-specific terms (Sanity schemas, Payload collections, Strapi content-types, Mongoose schemas, Zod schemas, etc.). Locate the canonical source of truth — don't stop at the first match.

2. **Enumerate every type.** Include obvious entity types and less-obvious ones. Be exhaustive. If you're unsure whether something is a "node type" vs. a helper struct, include it and flag the ambiguity in the output.

3. **Group by expected class** (framing lens, not predetermination):
   - **Entity nodes** — agents, factions, locations, artifacts, items. Likely full ontology; participate as findable/creatable recipe nodes.
   - **State nodes** — conditions, modifiers, mandate flags, doom-clock state. Likely need *different* classification axes (what they affect, how they propagate). Participate as preconditions/effects, not findable units.
   - **Relational nodes** — edges (pacts, deals, reputations). Probably covered by edge-type discipline; probably no independent ontology tagging.
   - **Other** — anything that doesn't fit. Call these out explicitly; they're real findings.

4. **Per-type assessment.** For each type, a one-line answer to each of the three questions. Cite the specific file + line for each type definition.

5. **Gap list.** Surface missing tagging axes, missing node categories, missing edge types. List them at the bottom for follow-up issue filing.

## Output

Write `docs/audits/node-type-audit-YYYY-MM-DD.md` (use today's date; adjust path if the repo already has a conventional audits location — grep for `docs/audits` or similar first).

Structure:
- **Summary table** — columns: node type | file:line | class (entity / state / relational / other) | tagging? | recipes? | edges?
- **Per-class sections** — expanded one-line assessments where needed, with file refs
- **Findings** — node types that don't fit entity/state/relational, with rationale
- **Gaps** — proposed follow-up issues (missing tagging axes, missing categories, missing edge types)
- **Methodology note** — the grep terms you used and any file patterns you searched, so someone can verify coverage

## Acceptance criteria

- Every node type in the repo is listed — grep results are evidence. If the doc references a type that isn't in the table, that's a miss.
- Every entry has the three-question assessment.
- Everything that doesn't fit entity/state/relational is explicitly called out under "Findings".
- Gaps are enumerated with enough detail to file as follow-up Linear issues.
- Methodology note makes coverage verifiable.

## Non-goals

- Do **not** redesign the ontology — that's THR-220; this audit feeds into it.
- Do **not** rename or restructure content types.
- Do **not** file Linear issues yourself — enumerate gaps in the doc; Christian will file them.
- Do **not** extend the composition DSL — that's THR-222.

## Linear

- This brief: THR-232 — https://linear.app/threadbare/issue/THR-232/game-node-audit-inventory-all-node-types-for-tagging-recipe-and-edge
- Source thread: THR-219 — https://linear.app/threadbare/issue/THR-219/actors-procedural-floor-authored-layer-for-threaded-agents-brainstorm
