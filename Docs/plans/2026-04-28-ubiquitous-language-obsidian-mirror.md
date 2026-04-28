# Ubiquitous Language → Obsidian Mirror

**Date:** 2026-04-28
**Status:** Plan — handoff to executor
**Parent:** [THR-271](https://linear.app/threadbare/issue/THR-271) (UL v1) — follow-on item promised in plan but not shipped
**Author:** Cowork
**Type:** Tooling / vault generator extension

## 1. Why

UL v1 (THR-271) shipped seven sharded markdown files at `Docs/ubiquitous-language/` and wired them into agent context via CLAUDE.md's always-load reference. Humans, however, have no first-class read surface — they have to grep markdown or open files in an editor. The original first-wave plan (`Docs/plans/2026-04-24-codebase-health-first-wave.md` §5.1) promised: *"Obsidian vault renders each shard as a wiki mirror via existing vault-generator infrastructure."* That part of the plan never landed. This issue closes the gap.

The Obsidian mirror is the cheapest and most consistent human surface. It gives us, for free: backlinks across Vision/Systems, graph view of the term web, fuzzy search, mobile read access, and integration with the existing knowledge-base workflows (`vault-query`, `vault-lint`, `vault-enrich`).

## 2. Scope

**In scope:**

- A repeatable script that mirrors the seven UL shards into `<vault>/Ubiquitous-Language/` as Obsidian-flavored markdown.
- Anchor links inside shards (e.g. `(./Cosmology.md#reach)`) rewritten to Obsidian wikilinks (e.g. `[[Cosmology#Reach]]`).
- Frontmatter on each mirrored page following the hand-curated convention in CLAUDE.md (tags, aliases, status, generated date).
- A pointer entry in `<vault>/Index.md` linking to `Ubiquitous-Language/README`.
- A header banner on every mirrored page: *"Generated mirror — edit `Docs/ubiquitous-language/<file>.md` in the repo, not this copy. Regenerate with `npm run mirror-ul`."*
- An npm script `mirror-ul` and a `mirror-ul:dry` variant matching the existing `generate-vault` ergonomics.
- Filesystem fallback when Obsidian MCP is unavailable, mirroring the pattern used in vault-log (impediment #66 et al.).

**Out of scope (deferred):**

- Interactive in-app dashboard at `?view=ul` — separate Linear issue (see §10).
- Static `public/ubiquitous-language-reference.html` — explicitly rejected; the in-app dashboard supersedes it.
- Backlinks from Vision/Systems pages back into UL shards — proposed but deferred to a follow-up; requires deciding when a Vision page should reference a UL term as a wikilink vs prose.
- Mirroring `.proposals.md` (the local-fallback log of UL-proposals when Linear is down) — that's an agent-only artifact.

## 3. Three Pillars

| Pillar | Status | Notes |
|---|---|---|
| Engine | N/A | Tooling only. No tick loop, graph, or runtime impact. |
| Content | N/A | Mirrors existing vocabulary; no new game-facing content. |
| UI | ✅ | The Obsidian vault *is* the UI surface for this work. Read access for humans is the entire point. |

## 4. Approach

Add a new script `scripts/mirror-ul.ts` rather than extending `generate-vault.ts`. Rationale: the existing generator reads `world-model.json` and writes one file per graph node into 11 owned folders; UL mirroring reads markdown shards and writes one file per shard plus the README. Different source, different transformation, different ownership boundary — extending the generator would couple two unrelated pipelines and complicate the `OWNED_FOLDERS` invariant. A sibling script is simpler. The npm script can chain them (`npm run generate-vault && npm run mirror-ul`) if the user wants single-command regeneration; the chained alias is `npm run sync-vault` and is added in this issue.

Mirror flow:

1. Read each `Docs/ubiquitous-language/*.md` shard.
2. Parse the existing markdown — preserve heading structure verbatim; the entry definitions inside shards already match Obsidian's heading-anchor model.
3. Rewrite intra-UL links: `(./Cosmology.md#reach)` → `[[Ubiquitous-Language/Cosmology#Reach]]` (Obsidian's pipe-renaming preserves visible text where used: `[[Ubiquitous-Language/Cosmology#Reach|Reach]]`).
4. Rewrite repo links that reference Obsidian-mirrored content (`Vision/`, `Systems/`) to wikilinks where target exists in the vault; leave external/repo-only paths as relative markdown links with a `(repo)` suffix to make the boundary obvious.
5. Prepend frontmatter and the "generated mirror" banner.
6. Write to `<OBSIDIAN_VAULT_PATH>/Ubiquitous-Language/<Shard>.md`.
7. Append a one-line entry to vault `log.md` per the change-audit-trail convention in CLAUDE.md.
8. Update vault `Index.md` if the UL pointer is missing — idempotent.

Path resolution: `OBSIDIAN_VAULT_PATH` env var (already established in `.claude/settings.local.json`, default `C:\Users\chris\Dev\Obsidian`). If the env var is unset, fail loud with the exact message used by vault-log so the same fix instructions apply.

## 5. Frontmatter Convention

```yaml
---
tags: [ubiquitous-language, glossary, generated]
aliases: [<shard name e.g. "UL Cosmology", "UL: Cosmology">]
status: complete
source: Docs/ubiquitous-language/<file>.md
last-generated: YYYY-MM-DD
content-adjacent: <true|false>  # matches the README table
---
```

Tag choice rationale: `ubiquitous-language` is the discoverable tag; `glossary` joins it to any other glossary content that may appear; `generated` matches existing convention so vault-lint can distinguish auto-files from hand-curated.

## 6. Constants

| Constant | Default | Purpose |
|---|---|---|
| `OBSIDIAN_VAULT_PATH` | `C:\Users\chris\Dev\Obsidian` (per local settings) | Vault root; mirror writes to `<root>/Ubiquitous-Language/`. |
| `UL_SOURCE_DIR` | `Docs/ubiquitous-language` | Repo-side canonical source. |
| `UL_VAULT_FOLDER` | `Ubiquitous-Language` | Folder inside vault that this script owns. |
| `MIRROR_BANNER` | (string template) | Header line injected into every mirrored file. |

## 7. Tracing

No runtime traces. CLI emits structured per-shard output:

```
[mirror-ul] reading 7 shards from Docs/ubiquitous-language
[mirror-ul] Cosmology.md → Ubiquitous-Language/Cosmology.md (12 wikilinks rewritten)
[mirror-ul] Agents.md → Ubiquitous-Language/Agents.md (9 wikilinks rewritten)
...
[mirror-ul] index updated: Ubiquitous-Language entry present
[mirror-ul] log appended: 1 entry
[mirror-ul] done in 240ms
```

`--dry-run` flag prints planned writes without touching the vault, matching `generate-vault:dry`.

## 8. Fail-Soft

| Failure | Degraded behavior |
|---|---|
| `OBSIDIAN_VAULT_PATH` unset | Fail loud with exact remediation: *"Set OBSIDIAN_VAULT_PATH in `.claude/settings.local.json`"*. Do not attempt fallback path guessing. |
| Vault folder missing | Create `Ubiquitous-Language/` on first run; log creation. |
| Shard file missing | Skip that shard, warn with shard name, continue with the rest. Exit code 0 (partial mirror is better than no mirror). |
| Anchor rewrite fails (malformed link) | Leave original markdown link in place; log a warning with file + line. |
| `Index.md` missing | Skip index update, warn. The mirror itself is still valuable; index is convenience. |
| Obsidian MCP unreachable when appending to `log.md` | Filesystem-fallback append (same pattern as vault-log per CLAUDE.md sandbox limitations). |
| Vault file exists with different content (manual edits) | **Overwrite.** Mirror is canonical. The "generated mirror — edit in repo" banner exists to deter manual edits; this script enforces it. |

## 9. Wiring Checklist

Per `Docs/plans/wiring-checklist.md`:

- **Orchestrator phase:** N/A (offline tool).
- **UI component:** N/A (Obsidian renders the markdown).
- **GameState flow:** N/A.
- **Trace category:** N/A.
- **Player controls:** N/A.
- **Debug visibility:** N/A.
- **Prose pipeline:** N/A.
- **npm scripts:** add `mirror-ul`, `mirror-ul:dry`, and `sync-vault` (the chained alias). Document in CLAUDE.md's command table.
- **CLAUDE.md:** add the new commands to the "Vault maintenance scripts" sub-table; add a note in the Obsidian Vault section explaining the UL folder is auto-mirrored.
- **README banner inside mirrored files:** the in-band signal that prevents manual edits to mirrored content.

## 10. Companion Issue (out of scope here, opened separately)

The richer **interactive `?view=ul` dashboard** — sortable/filterable table of all 73 terms, shard tabs, search, content-adjacent badges, drift-status indicators (linked to UL-proposal Linear issues), and term-graph overlay — is being filed as its own Linear issue in Implementation Planning state. That work needs a design pass before handoff and is materially larger than this mirror.

## 11. Vision Audit

UL is a process foundation, not a Vision premise. No Vision pages reference the mirror; this work doesn't contradict or amend Vision content. Pass — no Vision edits required.

## 12. NFP Compliance

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Three constants in §6, all named. |
| 2. Inspectability | PASS | Per-shard CLI output (§7), dry-run flag, in-band "generated" banner makes provenance visible. |
| 3. Determinism | PASS | Pure transformation: same source markdown → same vault markdown. No PRNG, no clock-dependent behavior beyond `last-generated` date. |
| 4. Fail-soft | PASS | Eight failure modes enumerated in §8 with explicit degraded behavior. Loud-fail only on `OBSIDIAN_VAULT_PATH` unset (matches existing convention). |
| 5. Narrative over mechanical | N/A | No narrative surface. |
| 6. Additive | PASS | New script, new folder, new npm scripts. No existing files modified except CLAUDE.md additions and `Index.md` (idempotent insert). |
| 7. Performance budget | PASS | Seven small markdown files; sub-second runtime expected. No optimization needed. |

## 13. Acceptance Criteria

- [ ] `npm run mirror-ul` writes seven shard mirrors plus the README copy into `<vault>/Ubiquitous-Language/`.
- [ ] `npm run mirror-ul:dry` prints planned operations and exits 0 without touching the vault.
- [ ] `npm run sync-vault` runs `generate-vault` then `mirror-ul` in sequence; failure of either fails the chain with exit code propagated.
- [ ] Each mirrored file has the agreed frontmatter (§5) and the generated-mirror banner.
- [ ] Intra-UL anchor links are wikilinks; broken or malformed source links emit a warning but do not abort.
- [ ] `<vault>/Index.md` contains a top-level entry for `Ubiquitous-Language/README` with a one-line summary.
- [ ] Vault `log.md` has a single appended entry per run summarizing the mirror.
- [ ] Running with `OBSIDIAN_VAULT_PATH` unset fails with the exact remediation message specified in §8.
- [ ] Re-running with the vault folder pre-existing is idempotent (overwrites mirrored files, leaves unrelated vault content untouched).
- [ ] CLAUDE.md updated: vault scripts table includes the three new commands; the Obsidian Vault section notes that `Ubiquitous-Language/` is auto-mirrored.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass.

## 14. Done When

- [ ] All acceptance criteria pass locally.
- [ ] CI green.
- [ ] Commit body contains `Fixes THR-XXX` (replace with actual issue ID).
- [ ] Merged to main.
- [ ] Mirror visible in user's vault after one run.

## 15. References

- Parent: [THR-271](https://linear.app/threadbare/issue/THR-271) — UL v1.
- Source plan that promised the mirror: `Docs/plans/2026-04-24-codebase-health-first-wave.md` §5.1.
- Vault-log fallback pattern (precedent for Obsidian MCP unavailability): CLAUDE.md "Known Sandbox Limitations" → impediment #66.
- Memory: `project_ul_foundation`.
