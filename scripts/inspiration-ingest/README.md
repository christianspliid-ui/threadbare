# Inspiration Ingest (THR-221 Scaffold)

This scaffold ingests inspiration content into a file-backed CMS dataset.

## CLI

```bash
npm run ingest -- ./path/to/source.md
npm run ingest -- ./path/to/directory
npm run ingest -- https://example.com/some-article
```

## Source support

- Local markdown file (`.md`)
- Local directory (recursive; each `.md` is a separate record)
- URL fetch

## Output

Records are written to:

- `src/data/inspiration-content.json`

Each record includes:

- `id`
- `title`
- `body`
- `ingestedAt`
- `sourceType` (`file` | `url` | `directory-entry`)
- `sourcePath` or `sourceUrl`
- `contentHash` (dedupe key)

## Idempotency behavior

Deduplication is by `contentHash`. Re-ingesting existing content updates metadata (such as `ingestedAt`) without creating duplicate rows.

## URL readability limitation (scaffold phase)

URL ingest currently uses minimal HTML-to-text normalization (strip tags + basic block handling). This is intentionally simple for scaffold phase and may include navigation boilerplate from some pages.

## Deferred tagging

Tagging is intentionally deferred until THR-220 lands.

```ts
// TODO(THR-221-tagging): apply ontology tags once THR-220 is live.
// Expected signature: applyOntologyTags(record) -> { archetypes, reaches, spheres }
```

