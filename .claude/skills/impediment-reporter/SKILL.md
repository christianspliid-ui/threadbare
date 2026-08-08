---
name: impediment-reporter
description: Loaded by ALL agents on EVERY task. When an agent encounters a blocker, workaround, or unexpected friction, it MUST log the impediment to Docs/impediments.md before continuing. This is part of Definition of Done — work is not complete unless all impediments encountered during the session are logged.
last_validated_against: 2026-08-08
---

# Impediment Reporter

## Purpose

Capture every obstacle, blocker, and workaround so the team can systematically eliminate friction over time. This is not optional — it's a core part of how we improve.

## When to Log

Log an impediment **immediately** when any of these happen:

1. **A tool call fails** and you retry with a different approach
2. **An API or MCP call** returns unexpected results or errors
3. **A permission or environment issue** blocks you
4. **You discover a skill or CLAUDE.md instruction** is wrong, outdated, or missing
5. **A process step** takes significantly longer than expected
6. **You work around a known quirk** (even if you already know the workaround)
7. **Requirements are ambiguous** and you have to guess or ask
8. **A test is flaky** or a build fails for non-obvious reasons
9. **You abandon an approach** and try something else — the abandoned approach is the impediment

## How to Log — Dedup-First Protocol

**Before adding a new row, always read `Docs/impediments.md` first and scan existing entries.**

### Step 1: Check for duplicates

An impediment is a **duplicate** if an existing row describes the same root cause — same tool, same failure mode, same category. Minor differences in wording or session context don't make it unique. Use judgment: "Obsidian MCP patch_content drops content with special chars" reported from two different sessions is the same impediment.

### Step 2a: If a matching entry exists → increment its count

Edit the existing row: change the `Count` column value from N to N+1. Update the `Date` column to today's date (most recent occurrence). If the new occurrence has a better workaround, update the `Workaround Description` too.

**After incrementing, check the threshold:** If the count is now **> 5**, tell the user:

> "Impediment #X has been reported {count} times: '{description}'. This is above the retrospective threshold. I recommend running `/retrospective` to address this recurring friction."

This is a **hard rule** — do not skip the suggestion when count crosses 5.

### Step 2b: If no matching entry exists → add a new row

Append a new row with `Count` = 1. **Get the `#` from the allocator — never by reading the last row:**

```bash
npm run impediment:next-id
```

It prints one number on stdout; use that. It is one above the highest `#` on *every* local and remote ref, not just this tree — which is the difference that matters, because the log is `merge=union` and a branch cannot see a row sitting on `main`'s unmerged future or on a sibling lane's committed branch. `max(this tree) + 1` was free when you picked it and duplicated the instant the merge landed, reddening the required check on a PR that authored its row correctly (impediment #460, four occurrences; the last cost ~42 min and one whole hourly run).

The allocator never blocks — it exits 0 with no git and no network, because a tool that helps you log friction must not become friction. Two things it reports, on stderr and in `--json`:

- **`degraded`** — refs were unreadable, so you got the old working-tree-only answer. Usable, but re-check after the merge.
- **latent collisions** — an id this tree already claims that `origin/main` claims for a *different* impediment. That row fails the gate whatever number you pick next; repair with `npm run check:impediment-ids -- --fix`.

`-- --json` gives the structured form; `-- --no-fetch` skips the `git fetch` when the refs are known current.

**One case it cannot cover, by construction:** two branches that each append a row and *neither commits* before the other allocates. Sequential integers have no collision-free allocation without a coordinator, and this is not one — it widens the observation window rather than closing it. Commit the row, or repair after the merge.

## Fields

| Field | Description |
|-------|-------------|
| **#** | Sequential number. Take it from `npm run impediment:next-id` — do **not** read the last entry and increment (see Step 2b). |
| **Count** | How many times this impediment has been reported. Starts at `1`. Incremented by subsequent agents who hit the same issue. |
| **Date** | ISO date of most recent occurrence: `2026-03-20` |
| **Category** | One of: `tool-failure`, `api-quirk`, `permission`, `environment`, `skill-gap`, `process-friction`, `dependency`, `unclear-requirements`, `flaky-test`, `other` |
| **Description** | What happened. Be specific: include the tool/API name, the error or unexpected behavior, what you were trying to do. |
| **Consequence** | What was the downstream effect? (e.g., "had to rewrite component differently", "lost context switching approaches", "user had to intervene") |
| **Impact** | Effort/opportunity lost: `S` (<2 min), `M` (2-15 min), `L` (15+ min), `Blocked` (could not complete task at all) |
| **Workaround Found?** | `Yes` or `No` |
| **Workaround Description** | If yes, what did you do instead? Keep the best known workaround here — update if a later agent finds a better one. If no, leave blank. |
| **Session Context** | Brief note on what task/phase you were working on (updated to most recent occurrence) |

### Example Entry

```
| 14 | 3 | 2026-03-20 | api-quirk | Obsidian MCP `obsidian_patch_content` silently drops content when the target heading has special characters | Had to use obsidian_append_content and manually structure the document | M | Yes | Used append instead of patch, restructured heading to avoid special chars | Updating vault after Phase 7 |
```

## Retrospective Threshold

When **any single impediment's count exceeds 5**, the agent who increments it past the threshold MUST proactively suggest a retrospective to the user. This is the system's way of saying "this friction has been tolerated long enough."

The suggestion should be direct:

> "Impediment #X ('{short description}') has now been reported {count} times. I recommend running `/retrospective` to analyze this and other recurring issues."

## Rules

1. **Read before writing.** Always scan existing entries for duplicates before adding a new row. Duplicate rows waste retro time.
2. **Log before continuing.** Don't wait until the end of the session. Log the impediment as soon as you work around it.
3. **Be specific.** "API didn't work" is not useful. "Notion MCP `notion-update-page` returned 400 when property name contained a slash" is useful.
4. **Include the workaround.** Future agents will thank you. If you found a workaround, describe it clearly enough that the next agent can use it without rediscovering it.
5. **Don't filter.** Even "small" impediments matter. Patterns emerge from frequency, not severity.
6. **Don't editorialize.** State what happened, not how you feel about it.
7. **Upgrade workarounds.** If you find a better workaround than what's logged, update the existing row's workaround description.
8. **Never hand-pick a `#`, and never hand-repair a duplicate one after a merge.** Allocation is `npm run impediment:next-id` (Step 2b); repair is below. `Docs/impediments.md` is `merge=union` (THR-691), so two lanes appending on the same day each pick "the next free number" and the merge keeps both. Run `npm run check:impediment-ids -- --fix` (THR-1018), then `npm run generate-impediment-dashboard`. It classifies each collision — dedupe when both rows are the same impediment, renumber when they are different — which is the judgment sessions were re-deriving by hand on every closeout merge. Read its renumber list before pushing: the original number stays on the first row, so a prose reference that meant the row that *moved* now points at the wrong entry, and only the author knows which.

## Definition of Done Integration

Before marking any task complete, ask yourself: "Did I encounter any obstacles during this work?" If yes, verify they're all logged (or existing entries incremented). This is checked as part of Definition of Done — same as committing, pushing, and documenting.
