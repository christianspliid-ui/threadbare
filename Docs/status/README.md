# `Docs/status/` — one closeout entry per file

Every shipped ticket's Current-Focus narrative lives here as its **own file**, named
`YYYY-MM-DD-thr-XXXX.md` (ship date, then ticket id). `Docs/project-status.md` is
**generated** from these by `npm run generate-project-status`.

## Why one file per entry (THR-1016)

`Docs/project-status.md` used to be hand-edited, and every closeout wrote it at the
same two places — an insert at the top of `## Current Focus`, and a delete at the
tail to hold the 60-line cap. Two open closeout PRs therefore conflicted **by
construction**, whatever either one contained. Measured 2026-08-07: PRs #1322, #1326
and #1327 all sat `DIRTY` for 17–20 hours conflicting only in closeout docs, and
#1322 had to be hand-resolved *twice in one session* because an unrelated merge
re-staled it minutes after the first resolution. Draining N such PRs costs N
sequential CI cycles, because each merge re-conflicts every other one.

Union merge (`.gitattributes`, THR-691) fixed that for `changelog.md`,
`project-history.md` and `impediments.md` because those are strictly append-only.
It was correctly withheld from `project-status.md`, which rewrites in place — union
would have duplicated the rewritten lines instead of merging them.

A brand-new file per entry removes the shared write entirely: **two closeout PRs
never touch the same path**, so there is nothing to conflict. That property holds on
GitHub's server-side merge too, which ignores `.gitattributes` and so was never
helped by the union driver.

## Writing an entry

1. Create `Docs/status/YYYY-MM-DD-thr-XXXX.md`. Content is the entry body as it
   should appear under `## Current Focus` — normally one bolded-lede paragraph
   ending in a `(THR-XXXX, YYYY-MM-DD)` attribution.
2. Run `npm run generate-project-status`.
3. Commit both the fragment and the regenerated `Docs/project-status.md`.

Do **not** hand-edit `Docs/project-status.md`, and do **not** trim other entries to
make room — the generator holds the line cap by rendering only as many of the newest
fragments as fit. Everything older stays here, readable and uncapped.

## Files that are not entries

`_page.md` is the page scaffolding (header, `<!-- ENTRIES -->` marker, and the tail
sections). Any file whose name starts with `_`, and this README, are excluded from
the entry set.

## Merging

Fragments never conflict. The generated `Docs/project-status.md` can, since two
branches regenerate it differently — so it is marked `merge=ours` in
`.gitattributes`: a local `git merge origin/main` takes your copy without a
conflict, and `npm run generate-project-status` then rebuilds it from the **merged**
fragment set, which is the correct answer by construction. Forgetting that step is
not silent: `npm run check:generated-freshness` is a blocking CI gate and rejects a
stale page.
