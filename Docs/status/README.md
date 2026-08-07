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
2. Commit that file. **That is the whole closeout write.**

Do **not** hand-edit `Docs/project-status.md` — it is generated and untracked (see
below) — and do **not** trim other entries to make room. The generator holds the
line cap by rendering only as many of the newest fragments as fit; everything older
stays here, readable and uncapped.

## Files that are not entries

`_page.md` is the page scaffolding (header, `<!-- ENTRIES -->` marker, and the tail
sections). Any file whose name starts with `_`, and this README, are excluded from
the entry set.

## Where the assembled page went

`Docs/project-status.md` is **generated and untracked** (`.gitignore`). It is
rebuilt by `npm run prebuild`, so any build produces it, and on demand with
`npm run generate-project-status`.

It is not committed because committing it puts the shared write straight back: two
branches regenerate the page differently — different top entry, different dropped
tail — and conflict exactly as before. No merge driver rescues that:

| Candidate | Why not |
|---|---|
| `merge=union` | Keeps *both* sides of a rewritten hunk. The page has a cap, so the generator drops entries as well as adding them. This is why THR-691 excluded the file to begin with. |
| `merge=ours` | Not a built-in driver — unlike `text`/`binary`/`union` it needs `[merge "ours"] driver = true` in `.git/config`, which no repo file can distribute. Measured 2026-08-07 in a fresh clone with the attribute set: `CONFLICT (content): Merge conflict in Docs/project-status.md`; clean only once the config was added by hand. |
| any working driver | GitHub's server-side merge ignores `.gitattributes` entirely, so a shared write still strands the PR at `mergeable: CONFLICTING` until a session merges locally. |

So the fragments are committed and the assembly is not — the same trade
`Design/impediment-dashboard.html` took under THR-916, reached from the other end.
`npm run check:generated-freshness` keeps it honest: it asserts the generator still
produces the page, and that nobody has `git add -f`'d it back into the tree.
