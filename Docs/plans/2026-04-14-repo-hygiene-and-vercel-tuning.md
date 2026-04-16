# Repo Hygiene & Vercel Tuning

**Date:** 2026-04-14
**Author:** Cowork (design only)
**Status:** Ready for Dev

## Problem

Two related pieces of friction around the deploy pipeline:

1. **The Obsidian vault is committed to the game repo.** Ten top-level wiki directories (`Actions/`, `Actors/`, `Cosmology/`, `Cultures/`, `Domains/`, `Locations/`, `Magic/`, `Relationships/`, `Terrain/`, `Traits/`) plus `Index.md` sit at the repo root alongside `src/` and `public/`. 198 tracked files whose content is internal domain-model reference — not the game, not user-facing, and not needed by Vercel to build or serve the SPA.
2. **`vercel.json` is minimal and leaves obvious wins unused.** Tests run twice (CI + buildCommand), every vault edit triggers a full rebuild, and hashed assets in `/assets/*` have no long-lived cache headers.

The user's directive: *"We should not commit the obsidian vault. We should only commit the game. And the pages for users to see."* Keep `Docs/`, `.planning/`, and vault-generation scripts — those are repo-facing and still useful.

## Scope

In scope:

- Untrack the ten vault directories + `Index.md` while keeping files on disk so local vault tooling (Obsidian app, `obsidian` MCP, `generate-vault`, `rebuild-index`) keeps working.
- Tighten `vercel.json`: stop running tests in the Vercel builder, add an `ignoreCommand` so Vercel skips rebuilds when only non-game paths change, add immutable cache headers for `/assets/*`.
- Update `CLAUDE.md` and related docs so future agents don't re-commit the vault by accident.

Out of scope:

- Moving the vault to a separate repo (considered, rejected: simpler to leave in place with local `.gitignore`).
- Deleting vault content (user wants it kept locally).
- Adding Vercel Speed Insights / Analytics / preview protection — worthwhile, but separate issues for later.
- Removing vault-generation npm scripts or vault skills — user wants them retained.
- Rewriting git history to remove vault files from past commits (not worth the churn; the repo size issue is on-disk `public/` + `Assets/`, not the vault).

## Three-Pillar Check

N/A — no Engine, Content, or UI systems touched. This is repo/build infrastructure work. The game itself (`src/`, `public/`, tick loop, components) is untouched.

## Plan

### Part A — Untrack the Obsidian vault

**A1. Update `.gitignore`.** Append a `# Obsidian vault (local only)` section listing the eleven entries:

```
# Obsidian vault (local only — generated/edited in place, not shipped in the build)
/Actions/
/Actors/
/Cosmology/
/Cultures/
/Domains/
/Locations/
/Magic/
/Relationships/
/Terrain/
/Traits/
/Index.md
```

Anchored with leading `/` so they only match the repo root, not any identically-named subdirectory in `src/`, `public/`, or `Docs/`. Grep confirmed: the existing `Logs/` directory already has a gitignore entry (`Logs/` line 9) — follow the same pattern.

**A2. Remove from git index.** `git rm -r --cached <each path>` for the eleven entries. Leaves the files on disk; only the index is updated. One commit.

**A3. Sanity-check.** `git status` should show the eleven entries as deletions; `git ls-files | grep -E '^(Actions|Actors|Cosmology|Cultures|Domains|Locations|Magic|Relationships|Terrain|Traits)/'` should return zero results; `ls Actions/ Cosmology/` should still show the files locally.

**A4. Update `CLAUDE.md`.** Two sections reference the vault as part of the repo:

- *Documentation Strategy* section — add a note that the vault lives on disk but is not committed; link its purpose to the `obsidian` MCP and `generate-vault` script rather than implying it's version-controlled.
- *Obsidian Vault as LLM Knowledge Base* section — same note.

No functional change to the vault workflow; only the tracked/untracked status changes. Scripts still generate into place.

### Part B — Vercel config low-hanging fruit

Current `vercel.json` (12 lines):

```json
{
  "buildCommand": "npm test && vite build",
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
      { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
    ]}
  ]
}
```

**B1. Drop `npm test` from `buildCommand`.** GitHub Actions CI already runs `npm test`, `tsc --noEmit`, and `vite build` on every push and PR to `main`. Running tests a second time in the Vercel builder adds 1–3 min to every deploy and every preview with no additional safety. `buildCommand` becomes `"vite build"`.

Rationale for keeping CI as the gate: CI blocks the merge/push; Vercel deploys from a green `main`. Preview deploys for PRs can rely on the PR's own CI check. If we ever wanted Vercel to fail deploys on test regressions independently (e.g. if CI is skipped), we'd add it back — but the status quo of CI-gated main is sufficient.

**B2. Add `ignoreCommand`.** Vercel runs this before building; non-zero exit = skip the build. Check whether the diff touches any game-relevant path:

```json
"ignoreCommand": "git diff --quiet HEAD^ HEAD -- src public scripts index.html package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vite-plugin-constant-writer.ts vercel.json public/**"
```

Exit 0 (no game-path changes) → Vercel skips the build. Exit 1 (changes exist) → Vercel proceeds. Covers the common cases: vault edits, `Docs/*`, `.planning/*`, `Logs/*`, `.codesight/*`, `.claude/*`, `.agents/*`, `.superpowers/*` all skip. Any `src/`, `public/`, config, or build-tooling change builds.

Edge case: a commit that touches only `vercel.json` itself should rebuild (caught above).

**B3. Add immutable cache headers for hashed assets.** Vite emits `/assets/*.{hash}.{ext}` for all code and static imports. Safe to cache forever. Add a second header block:

```json
{
  "source": "/assets/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
  ]
}
```

Measurable impact: repeat visits to the game load instantly from the CDN edge instead of revalidating each chunk. Three.js bundles and hex tile PNGs are the biggest winners.

Final `vercel.json` (19 lines):

```json
{
  "buildCommand": "vite build",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- src public scripts index.html package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vite-plugin-constant-writer.ts vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

## Verification

After A1–A4 land:

1. `git ls-files | grep -cE '^(Actions|Actors|Cosmology|Cultures|Domains|Locations|Magic|Relationships|Terrain|Traits)/'` returns `0`.
2. `git ls-files Index.md` returns empty.
3. `ls Actions/ Cosmology/` still shows content (files untouched on disk).
4. `npm run generate-vault` still produces files (they're just untracked now).
5. `npm test`, `npx tsc --noEmit`, `npx vite build` all pass (nothing in `src/` changed).

After B1–B3 land:

6. Push a PR that only edits a `Docs/` file → Vercel reports "Build skipped" via `ignoreCommand`.
7. Push a PR that edits `src/` → Vercel builds normally; the build runs only `vite build`, not the test suite.
8. Load the deployed site, DevTools → Network → confirm `/assets/*.js` responses carry `cache-control: public, max-age=31536000, immutable`.

## Fail-Soft Notes

- **If `ignoreCommand` is too aggressive** (a legit build gets skipped): extend the path list in `vercel.json`. Low-cost fix, no rollback needed.
- **If the cache header breaks something**: Vite-hashed filenames make stale cache harmless — the new bundle has a new hash, the old one just sits cold. No rollback risk.
- **If dropping `npm test` from `buildCommand` masks a CI regression**: CI still runs and still blocks merges. The safety net is earlier, not later.

## Rollout

Two PRs recommended, for clean revert surface:

1. **PR 1 — Untrack vault.** `.gitignore` + `git rm --cached` + `CLAUDE.md` note update. Pure hygiene, no deploy impact.
2. **PR 2 — Vercel tune.** `vercel.json` changes. Observe one or two deploys before merging any other deploy-sensitive work.

Both can land same day. No dependencies between them.

## NFP Compliance

| NFP | Status |
|-----|--------|
| 1. Tunability | N/A — no game constants touched. |
| 2. Inspectability | PASS — plan leaves traces in git history + `Docs/changelog.md`. |
| 3. Determinism | PASS — no runtime behavior changes. |
| 4. Fail-soft | PASS — fail-soft notes above cover each change. |
| 5. Narrative over mechanical | N/A. |
| 6. Additive over destructive | PASS with note — `git rm --cached` is an index removal, not a disk delete; additive in effect. |
| 7. Performance budget | PASS — changes reduce build time and improve cold-cache load. |

## Action Items for CC

1. Open PR 1: update `.gitignore` (Part A1), run `git rm -r --cached` for the eleven entries (A2), verify (A3), update `CLAUDE.md` vault references (A4). Commit message suggestion: *"chore: untrack Obsidian vault (keep local, stop committing)"*.
2. Open PR 2: update `vercel.json` per Part B final block. Commit message suggestion: *"chore(vercel): drop redundant test run, add ignoreCommand + immutable asset caching"*.
3. After PR 2 merges, watch the next two deploys in Vercel. Confirm: a vault-only change skips; an `src/` change builds; built site serves `/assets/*` with the new cache header.
4. Append rows to `Docs/changelog.md` for both PRs.
5. Move the Linear issue to Done with completion comment linking both PR URLs.
