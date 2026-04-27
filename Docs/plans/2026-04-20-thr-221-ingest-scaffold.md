# Codex brief — THR-221 (scaffold phase): Inspiration ingest pipeline plumbing

## Context

THR-221 is the full inspiration-catalogue ingest pipeline with ontology-tagging discipline. The tagging piece depends on the ontology existing (THR-220), which depends on the node audit (THR-232). This brief is the **scaffold phase only** — stand up the pipeline's plumbing without blocking on the ontology. Tagging integration gets wired in as a later pass after THR-220 lands.

## Goal

Stand up the pipeline skeleton: a CLI that ingests inspiration content from a source (file, URL, directory), normalizes it, and writes it to the CMS as inspiration records. Idempotent on re-ingestion. Ontology tagging is explicitly deferred to a later issue — leave a clear stub.

## Approach

1. **Find the CMS integration layer.** How are existing content types written to the CMS? (Sanity client, Payload API, Strapi, Prisma, direct DB writes — whatever Threadbare uses.) Reuse this; don't build a parallel path.

2. **Check for an existing ingest/seed pattern.** Grep for `seed`, `import`, `ingest`, `bulk`, `migrate`. If there's an existing bulk-import or seed loader, base the pipeline on it and extend rather than duplicate.

3. **Scaffold the CLI.** Single entry point — `threadbare ingest <source>` or equivalent matching the repo's CLI conventions. Sources to support in v0:
   - Local markdown file
   - Local directory (recursive — each `.md` becomes a record)
   - URL (fetch + extract readable content — use an existing HTML-to-markdown utility if the repo has one; otherwise keep the HTML fetch simple and flag that readability extraction is a follow-up)

4. **Content normalization.** For each source, produce a canonical `InspirationContent` record:
   - `sourceUrl` or `sourcePath`
   - `title`
   - `body` (markdown)
   - `ingestedAt`
   - `sourceType` (`file` | `url` | `directory-entry`)
   - `contentHash` — for idempotency

   Do not tag. Do not classify. Just normalize.

5. **Write to CMS.** Use the existing write layer. Deduplicate by `contentHash` — re-ingesting the same content updates metadata but doesn't create duplicates.

6. **Stub the tagging hook.** At the point where ontology tags would be applied, leave:
   ```
   // TODO(THR-221-tagging): apply ontology tags once THR-220 is live.
   // Expected signature: applyOntologyTags(record) -> { archetypes, reaches, spheres }
   ```
   Do not implement tagging logic.

## Output

Follow repo conventions for file layout. Likely new files:
- CLI entry point (script or command module)
- Source adapters: `file.ts`, `url.ts`, `directory.ts` (or equivalent)
- Normalization layer: `normalize.ts`
- CMS write integration: `writeInspiration.ts`
- Idempotency / hash utility
- README in the new package/folder documenting usage

One integration test covering:
- Ingest a local markdown file → record appears in CMS
- Re-ingest the same file → no duplicate
- Ingest a directory → all entries created

## Acceptance criteria

- `threadbare ingest ./path/to/inspo.md` (or repo equivalent) creates an inspiration record.
- Re-running on the same source is idempotent (verified by test).
- Directory ingest recurses and creates one record per markdown file.
- URL ingest fetches and normalizes — readability extraction can be minimal; flag it in the README as a known limitation if you didn't implement it fully.
- Tagging hook is stubbed with the TODO comment pointing to THR-221 + THR-220.
- README documents CLI usage, source types, and the deferred tagging.
- No taxonomy, tagging, or classification logic is present anywhere in the code.

## Non-goals

- Do **not** implement ontology tagging — follow-up after THR-220.
- Do **not** implement the "tags considered AND rejected" audit trail (discussed in THR-221 parent but out of scope for scaffold).
- Do **not** build a UI / admin panel. CLI only.
- Do **not** design the `InspirationContent` schema from scratch if one already exists — extend the existing shape.

## Linear

- Parent: THR-221 — https://linear.app/threadbare/issue/THR-221/inspiration-catalogue-ingest-pipeline-with-ontology-tagging-discipline
- Depends on (for tagging phase only): THR-220 — https://linear.app/threadbare/issue/THR-220/unified-ontology-and-tagging-taxonomy-across-all-cms-content
- Source: THR-219 — https://linear.app/threadbare/issue/THR-219/actors-procedural-floor-authored-layer-for-threaded-agents-brainstorm

After this scaffold lands, open a follow-up issue: "Wire ontology tagging into ingest pipeline (THR-221 tagging phase)".
