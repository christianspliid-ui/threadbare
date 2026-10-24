# `Docs/history/` — one shipped ticket per file

Every shipped ticket's one-line `✅` history entry lives here as its **own file**,
named `YYYY-MM-DD-thr-XXXX.md` (ship date, then ticket id). If the name is taken (a
second slice of the same ticket on the same day), add `-2`, `-3`, ….

`Docs/project-history.md` is the **archive** of every entry written before
2026-10-24. It is frozen: never add a line to it.

## Writing an entry

The file holds the one line, in the archive's shape:

```markdown
✅ **THR-XXXX — what the player or the lane now gets** (2026-10-24, <Linear project>) — one or two sentences on what shipped. Details: `Docs/status/2026-10-24-thr-XXXX.md`.
```

Commit it with the ticket's other closeout files. **That is the whole history write.**

## Reading

- Newest first: list this folder and read from the bottom (`ls Docs/history/`).
- Everything before 2026-10-24: `Docs/project-history.md`.

## Why one file per entry (2026-10-24)

Same reason as `Docs/changelog/README.md`: every ticket PR wrote the archive at its
first line (17 of the 21 PRs from #2512 to #2532), so any two open PRs conflicted on
GitHub, which ignores `merge=union`. One new file per entry means two closeout PRs
never touch the same path.
