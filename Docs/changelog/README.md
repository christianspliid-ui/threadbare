# `Docs/changelog/` — one change per file

Every change's audit-trail rows live here as their **own file**, named
`YYYY-MM-DD-thr-XXXX.md` (ship date, then ticket id). A change with no ticket (a
CI/CD review tweak, a retro fix) uses `YYYY-MM-DD-<short-slug>.md`. If the name is
taken (a second slice of the same ticket on the same day), add `-2`, `-3`, ….

`Docs/changelog.md` is the **archive** of every row written before 2026-10-24. It is
frozen: never add a row to it.

## Writing an entry

Create the file with the same four-column table the archive uses — header,
separator, then one row per change:

```markdown
| Date | Files | Change | Why |
|------|-------|--------|-----|
| 2026-10-24 | `src/engine/foo.ts` (`barFn`), … | THR-XXXX: what changed | why it changed |
```

Commit it with the ticket's other closeout files. **That is the whole changelog write.**

## Reading

- Newest first: list this folder and read from the bottom (`ls Docs/changelog/`), or
  `git log --diff-filter=A --name-only -- Docs/changelog/` for ship order.
- Everything before 2026-10-24: `Docs/changelog.md`.

## Why one file per entry (2026-10-24)

The archive was written at one fixed place, the top of its table, by every ticket PR
(18 of the 21 PRs from #2512 to #2532). Two open PRs therefore conflicted **by
construction**, whatever else either one contained. GitHub's server-side merge
ignores the `merge=union` driver in `.gitattributes`, so each conflict stranded a
green PR as `DIRTY` until a session merged main by hand. That is why the pickup lane
could not start the next ticket while the previous PR was still on CI (the
WIP-until-merged gate, 2026-10-09). A brand-new file per entry removes the shared
write: **two closeout PRs never touch the same path.** `Docs/status/` (THR-1016) and
`Docs/history/` work the same way.
