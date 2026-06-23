# Cowork Ways of Working

> Added 2026-03-16. Updated 2026-04-26: rewrote for Linear-first coordination (BACKLOG.md and HANDOVER.md retired 2026-04-13).

## Cowork's Role

**Strategic advisor + domain knowledge keeper.** Cowork does exploration, design, brainstorming, and documentation. Claude Code (the single executor) does coding, testing, committing, and deploying.

**Cowork does not write production code. Cowork does not touch git.**

## What Cowork Does

- Architecture and design docs (save to `Docs/plans/`)
- Implementation plans detailed enough for Claude Code to execute
- Codebase research and analysis (read-only)
- Game design brainstorming and critique
- Obsidian vault updates (MCP access works)
- Linear issue management — create issues, update states, post handoff comments
- `.planning/ROADMAP.md` updates (legacy milestone overview)
- Code review and analysis

## What Cowork Does NOT Do

- Write or modify files in `src/`
- Run `git add`, `git commit`, `git push`, or any git operation
- Run `npm test`, `npm run build`, or other build/test commands (sandbox lacks native modules)
- Attempt to "just quickly fix" something in the codebase

## Handoff Protocol (via Linear)

When a Cowork session produces something an executor should act on, **use Linear**:

1. Create or update the Linear issue with a complete design
2. Post a handoff comment with the coordination block (see `Docs/plans/2026-04-13-linear-coordination-protocol.md`)
3. Move the issue to **Ready for Dev** (the executor queue)
4. The state transition plus the handoff comment IS the handoff — nothing else required

**Handoff coordination block must include:** `Suggested model` (advisory — the CC automation runs Opus regardless), `Parallel-safe with`, and `Mutex with` lines.

See the full template in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.

## When the User Asks Cowork to Build Something

1. Write a design doc + implementation plan (save to `Docs/plans/`)
2. Create a Linear issue with the plan reference
3. Post the coordination-block handoff comment
4. Move to Ready for Dev
5. Tell the user: *"Ready for Dev — Linear issue [THR-XXX] moved to the executor queue."*
6. Do NOT start writing the code yourself

## Coordination File Versioning

The `.planning/` directory still contains `ROADMAP.md` (legacy milestone overview). `BACKLOG.md` and `HANDOVER.md` are retired — Linear is the single source of truth for issue tracking and handoffs. Snapshot versioning to `.planning/.versions/` before any `.planning/` file write is still recommended as a corruption guard.

## Why These Constraints

The Cowork sandbox runs in a VM with:
- **No git credentials** — `git push` will always fail
- **Filesystem lock issues** — `git commit` often fails due to `.git/index.lock` permission errors
- **Shared filesystem with Claude Code** — files written by Cowork can get committed by Claude Code sessions under the wrong commit message, or create merge conflicts
- **No native modules** — `npm test` and `npm run build` fail without `@rollup/rollup-linux-x64-gnu`

## When Giving the User Terminal Commands

- **Always confirm the repo path first** — don't assume
- **One command per code block** — so the user can copy each separately
- **Run `git log` before asking the user to commit** — another agent may have already done it
- **Never give multi-command chains with `&&`** — older PowerShell doesn't support it

## Failure Patterns to Avoid

| Pattern | What happens | Do this instead |
|---------|-------------|-----------------|
| Cowork writes to `src/` | Files land on disk but aren't properly committed; Claude Code may commit them under wrong message | Write an implementation plan; let Claude Code do the coding |
| Cowork runs `git commit` | Hits `.git/index.lock` permission error | Don't touch git at all |
| Cowork runs `git push` | Fails with "could not read Username" — no credentials | Don't touch git at all |
| Cowork runs `npm test` | Fails with missing native module error | Type-check with `npx tsc --noEmit` only, or skip verification entirely |
| Giving user `&&` chained commands | Fails on older PowerShell | One command per code block |
| Assuming user's repo path | "not a git repository" error | Ask first, or check `.git/config` |
| Not checking git log before asking user to commit | User spends 10 minutes committing files that are already committed | Always run `git log --oneline -5 -- <file>` first |
| Moving issue to Ready for Dev without coordination block | CC pickup is blocked; scheduled slot wasted | Always post the full coordination-block comment before transitioning state |

## Retired Surfaces

| Surface | Retired | Replacement |
|---------|---------|-------------|
| `.planning/BACKLOG.md` | 2026-04-13 | Linear (Threadbare team) — single source of truth |
| `.planning/HANDOVER.md` | 2026-04-13 | Linear issue comments with coordination blocks |
| `.planning/BACKLOG_HISTORY.md` | 2026-04-13 | Linear "Done" state + `Docs/project-history.md` |
