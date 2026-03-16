# Cowork Ways of Working

> Added 2026-03-16 after a session where Cowork tried to write code, commit, and push — all of which failed due to sandbox limitations. This document prevents repeating those mistakes.

## The Rule

**Cowork does not write production code. Cowork does not touch git.**

## What Cowork Does

- Architecture and design docs
- Implementation plans detailed enough for Claude Code to execute
- Codebase research and analysis (read-only)
- Game design brainstorming and critique
- Notion updates (MCP access works)
- Obsidian vault updates (MCP access works)
- Changelog and documentation updates (MCP access works)
- Code review and analysis

## What Cowork Does NOT Do

- Write or modify files in `src/`, `Docs/plans/`, or any git-tracked directory
- Run `git add`, `git commit`, `git push`, or any git operation
- Run `npm test`, `npm run build`, or other build/test commands (sandbox lacks native modules)
- Attempt to "just quickly fix" something in the codebase

## When the User Asks Cowork to Build Something

1. Write a design doc + implementation plan
2. Save it to the workspace output folder (not the repo)
3. Share a clickable link to the plan
4. Tell the user: *"Hand this to Claude Code: [task name]. Implementation plan: [link]"*
5. Do NOT start writing the code yourself

## Why

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
