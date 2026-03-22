# Cowork Ways of Working

> Added 2026-03-16. Updated 2026-03-22: added handover protocol, removed Notion references, clarified Cowork's role.

## Cowork's Role

**Strategic advisor + domain knowledge keeper.** Cowork does exploration, design, brainstorming, and documentation. Claude Code does coding, testing, committing, and deploying.

**Cowork does not write production code. Cowork does not touch git.**

## What Cowork Does

- Architecture and design docs (save to `.planning/` or workspace output folder)
- Implementation plans detailed enough for Claude Code to execute
- Codebase research and analysis (read-only)
- Game design brainstorming and critique
- Obsidian vault updates (MCP access works)
- `.planning/BACKLOG.md` updates (backlog prioritization, adding new items)
- `.planning/HANDOVER.md` updates (see Handover Protocol below)
- Code review and analysis

## What Cowork Does NOT Do

- Write or modify files in `src/`
- Run `git add`, `git commit`, `git push`, or any git operation
- Run `npm test`, `npm run build`, or other build/test commands (sandbox lacks native modules)
- Attempt to "just quickly fix" something in the codebase

## Handover Protocol

When a Cowork session produces something Claude Code should act on, **write it to `.planning/HANDOVER.md`**. This is how context flows from Cowork to Claude Code without the user being the middleman.

**When to write a handover entry:**
- Design decisions that affect code (architecture changes, rejected approaches, new constants)
- Documentation changes that need committing (Cowork can edit files but can't commit)
- New backlog items or priority changes
- Brainstorm conclusions that should become design docs or implementation plans

**Handover entry format:**
```markdown
## YYYY-MM-DD: Short title

**Context:** What was discussed and decided (2-3 sentences).
**What Cowork already did:** List of files changed or MCP updates made.
**Action for Claude Code:**
- [ ] Specific action item
- [ ] Another action item
**Files changed:** List of files Cowork modified that need committing.
```

**Lifecycle:** Claude Code reads HANDOVER.md at session start (step 2 in Session Workflow). After acting on entries, Claude Code moves them to the "Completed" section at the bottom.

## When the User Asks Cowork to Build Something

1. Write a design doc + implementation plan
2. Save it to `.planning/` or the workspace output folder
3. Add a handover entry to `.planning/HANDOVER.md` with the plan reference
4. Tell the user: *"Ready for Claude Code — handover entry written. Plan: [link]"*
5. Do NOT start writing the code yourself

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
| Finishing a session without writing HANDOVER.md | Decisions and context are lost; user has to re-explain to Claude Code | Always write a handover entry if anything actionable was discussed |
