# Opus 4.6 vs 4.7 Label Split

> **Date:** 2026-04-23
> **Type:** Process/tooling — Linear taxonomy + coordination protocol
> **Linear issue:** THR-234
> **Project:** Agent Coordination Protocol
> **Status:** Ready for Codex

---

## Problem

The Linear `model:*` label taxonomy today is `model:haiku`, `model:sonnet`, `model:opus`. It does not encode Opus version. Per user preference (Cowork memory `feedback_creative_writing_model.md`, 2026-04-21), **creative-writing work should route to Claude Opus 4.6, not the default 4.7.**

Today that rule can only live in the `Suggested model` free-text line of the handoff comment. Executors skim, the line is easy to miss, and the taxonomy gives no structured signal. We need the distinction to be visible at the label level and queryable in list view.

---

## Decision

**Adopt Option 1 from THR-234** — version-suffixed labels, with `model:opus` kept as an alias for the default.

| Label | Meaning | When Cowork should apply it |
|-------|---------|-----------------------------|
| `model:opus-4-6` | Explicit request for Claude Opus 4.6 | Creative-writing work — anything that invokes `cw-prose-writing`, `cw-brainstorming`, `cw-official-docs`, `cw-story-critique`, `prose-pipeline`, `prose-content-systems`, `prose-vignettes-and-enrichment`, `encounter-pipeline`, `attachment-pipeline` |
| `model:opus-4-7` | Explicit request for Claude Opus 4.7 | Architectural Opus work that is **not** creative writing — multi-system refactors, novel engine node/edge types, high-impact-file edits |
| `model:opus` | Alias for "default Opus version (currently 4.7)" | Legacy shorthand. Prefer explicit versioned labels on new handoffs; leave existing `model:opus` assignments alone |

### Precedence rule

If an issue carries both `model:opus` and one of the versioned labels, the versioned label wins. If only `model:opus` is present, treat as `model:opus-4-7`. The two versioned labels are mutually exclusive — do not apply both to the same issue.

### Why not rename `model:opus` → `model:opus-4-7`?

A rename would force a migration of every historical `model:opus` issue and risk silently downgrading handoffs that the user explicitly set. Keeping `model:opus` as an alias avoids the blast radius while letting new handoffs be explicit. Over time, versioned labels become the norm.

### Why not a new `model:opus-creative` label (Option 3)?

Conflates the *what* (creative-writing work) with the *how* (which Opus version). A future policy change ("actually, use 4.7 for prose now") would need either a relabel sweep or the routing rule to live outside the label anyway. Versioned labels keep intent and implementation separate.

### Why not a `content:prose` label mapping to Opus 4.6 at pickup time (Option 2)?

Routing rule ends up in executor instructions, not at the label layer — defeats the whole point of making the distinction visible and queryable.

---

## Pillars

- **Engine:** N/A — no engine code touched.
- **Content:** N/A — no content authored or modified.
- **UI:** N/A — no player-facing surface.

This is pure Linear-taxonomy + coordination-doc work.

---

## Files to touch

### New labels (via Linear MCP, team: Threadbare)

1. **`model:opus-4-6`**
   - Color: `#A78BFA` (lighter variant of existing opus `#8B5CF6`)
   - Description: `Cowork's suggested Claude model — Claude Opus 4.6, used for creative-writing work (cw-*, prose-pipeline, encounter-pipeline, attachment-pipeline). Overrides bare model:opus when both are present.`

2. **`model:opus-4-7`**
   - Color: `#8B5CF6` (matches existing opus)
   - Description: `Cowork's suggested Claude model — Claude Opus 4.7 (current default). Use for architectural Opus work that is not creative writing. Equivalent to bare model:opus, but explicit.`

### `Docs/plans/2026-04-13-linear-coordination-protocol.md`

**Edit 1 — Labels table (currently around lines 457–459).** Replace the single `model:opus` row with three rows and the updated description:

```
| model:opus-4-6 | #A78BFA | Cowork's suggested Claude model — Opus 4.6, for creative-writing work (cw-*, prose-pipeline, encounter-pipeline, attachment-pipeline). Overrides bare `model:opus`. |
| model:opus-4-7 | #8B5CF6 | Cowork's suggested Claude model — Opus 4.7 (current default). Explicit version of `model:opus` for architectural non-creative work. |
| model:opus | #8B5CF6 | Legacy alias for `model:opus-4-7`. Kept for backward compatibility; prefer explicit versioned labels on new handoffs. |
```

**Edit 2 — Suggested model description (currently around line 324).** After the existing sentence ending `…so the suggestion is visible in list view and queryable.`, append:

> For Opus-tier work, prefer the versioned labels `model:opus-4-6` (creative-writing work — `cw-*`, `prose-pipeline`, `prose-content-systems`, `prose-vignettes-and-enrichment`, `encounter-pipeline`, `attachment-pipeline`) or `model:opus-4-7` (architectural non-creative work). The bare `model:opus` label remains as a legacy alias for `model:opus-4-7`; if both `model:opus` and a versioned label appear on the same issue, the versioned label wins.

### `CLAUDE.md`

**Edit 1 — Cowork handoff block (currently line 9).** In the clause listing `model:haiku` / `model:sonnet` / `model:opus`, extend to include the versioned Opus labels. Change:

```
CC handoffs need `Suggested model` (with matching `model:haiku` / `model:sonnet` / `model:opus` label)
```

to:

```
CC handoffs need `Suggested model` (with matching `model:haiku` / `model:sonnet` / `model:opus-4-6` / `model:opus-4-7` label; the bare `model:opus` is a legacy alias for `model:opus-4-7`)
```

**Edit 2 — Claude Code pickup block (currently line 11).** After the sentence `**Use the model suggested by the model:* label** (or the Suggested model line in the handover) unless you have a specific reason to override.`, insert:

```
If the label is `model:opus-4-6`, use Claude Opus 4.6 (`claude-opus-4-6`). If it is `model:opus-4-7` or the bare `model:opus`, use the default Opus version (currently Opus 4.7).
```

### Backfill audit

Query Linear for any currently-open creative-writing issues already labeled `model:opus` (not `model:opus-4-6`) and re-label them. Scope:

1. Run one call: `list_issues(label:"model:opus", limit:250)`. Filter states in memory: keep only issues with status in `"Ready for Dev"`, `"Ready for Codex"`, `"Todo"`, `"In Design"`, or `"Implementation Planning"`. (Single call with client-side bucketing replaces five per-state calls — see `Docs/plans/2026-04-23-linear-mcp-rate-limits.md` Change A.)
2. For each returned issue, judge whether it's creative-writing work. Creative-writing signals (any one is sufficient):
   - Title mentions prose, encounter content, vignette, attachment, faction flavor, narrative, dilemma, culture, or sphere flavor.
   - Project is `Encounter Format Migration`, `Content Architecture` (for prose-tagged issues), `Onboarding & First-Run Experience` (prose work only), or `Marketing Site` (copy-pass work only).
   - Description names any of the creative-writing skills: `cw-prose-writing`, `cw-brainstorming`, `cw-official-docs`, `cw-story-critique`, `prose-pipeline`, `prose-content-systems`, `prose-vignettes-and-enrichment`, `encounter-pipeline`, `attachment-pipeline`.
3. For each creative-writing issue found, call `save_issue(id, labels: [...])` replacing `model:opus` with `model:opus-4-6` in the labels array (keep all other labels intact).
4. For non-creative-writing issues labeled `model:opus`, leave the label alone — the user's rule is about creative writing specifically, and converting all `model:opus` to `model:opus-4-7` is a separate scope.
5. Post a single comment on THR-234 summarising the backfill: list each issue relabelled (or "no-op: no creative-writing issues labelled `model:opus` found on YYYY-MM-DD").

**Expected outcome given current state (2026-04-23):** The only open `model:opus` issue is THR-238 (orchestrator declarative phase wiring — infrastructure, not creative). Expect the audit to be a no-op. Codex should still run it and post the summary comment for the record.

---

## Done when (binary acceptance checklist — each item verifiable)

- [ ] `list_issue_labels name:"model:opus-4-6" team:"Threadbare"` returns a label with the exact name, color `#A78BFA`, and the description above.
- [ ] `list_issue_labels name:"model:opus-4-7" team:"Threadbare"` returns a label with the exact name, color `#8B5CF6`, and the description above.
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` Labels table contains all three rows exactly as specified in Edit 1.
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` "Suggested model" description includes the appended paragraph from Edit 2 verbatim.
- [ ] `CLAUDE.md` line 9 clause matches Edit 1 verbatim.
- [ ] `CLAUDE.md` line 11 contains the sentence from Edit 2 verbatim.
- [ ] Backfill audit run and summary comment posted on THR-234.
- [ ] `npm test` passes (docs-only change; unaffected but verified).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] Commit body includes `Fixes THR-234`.

---

## Non-goals

- Do **not** rename `model:opus` to `model:opus-4-7`. Keep `model:opus` as-is.
- Do **not** bulk-convert all `model:opus` issues to `model:opus-4-7`. The backfill is scoped to creative-writing issues only.
- Do **not** update the Cowork memory file `feedback_creative_writing_model.md` — that lives in Cowork's session-scoped memory directory and is owned by the Cowork agent. Cowork will update it separately.
- Do **not** add new Opus version labels beyond 4.6 and 4.7. If 4.8 ships, that's a follow-up issue.

---

## Codex coordination

**Parallel-safe with:** THR-36, THR-42, THR-245, THR-243 (all touch disjoint file surfaces — two docs + Linear labels only). Any Ready-for-Codex issue that does not edit `Docs/plans/2026-04-13-linear-coordination-protocol.md` or `CLAUDE.md` is parallel-safe.
**Mutex with:** any other issue editing `CLAUDE.md` or `Docs/plans/2026-04-13-linear-coordination-protocol.md` concurrently.

---

## Follow-ups (for Cowork, after Codex ships)

1. Update Cowork memory file `feedback_creative_writing_model.md` to reference `model:opus-4-6` by name.
2. Update the scheduled-task skill prompts for `keep-cc-flowing` and `keep-codex-flowing` so they know to apply `model:opus-4-6` for creative-writing handoffs.

These are Cowork-side and not part of THR-234's Codex scope.
