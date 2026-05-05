# WORKFLOW.md Handoff Schema

**Status:** Plan
**Linear:** [THR-303](https://linear.app/threadbare/issue/THR-303) (Agent Coordination Protocol)
**Inspired by:** OpenAI Symphony's `WORKFLOW.md` pattern (https://github.com/openai/symphony/blob/main/SPEC.md)

## Problem

Handoff comments on Linear issues encode the executor coordination contract — `Suggested model`, `Parallel-safe with`, `Mutex with`, `Codex review`, `Files to touch`, `Done when`. The contract is currently defined in prose across `CLAUDE.md` ("Cowork vs Claude Code" section) and `Docs/plans/2026-04-13-linear-coordination-protocol.md`, and validated by substring search in `scripts/check-process.ts`. This has two recurring failure modes:

1. **Drift between docs and reality.** The CC contract and Codex contract diverge in `CLAUDE.md` but `check-process.ts` only validates Ready-for-Dev (CC) handoffs. Ready-for-Codex handoffs are not validated at all. The Codex contract's `Files to touch` and `Done when` fields can be missing without `npm run check:process` noticing.
2. **Substring-search brittleness.** A typo (`Mutext with:`), a missing field, or a mis-formatted bullet list is caught only if the *exact* keyword string disappears entirely. Field *values* are never validated — `**Suggested model:** gpt-5` would pass.

This is one of two issues from a `Symphony` comparison pass that landed cleanly in scope. The other adjacent ideas (per-state concurrency caps, continuation-retry-after-clean-exit, stall/turn timeouts, workspace path safety invariants, auto-reconciliation of stale claims) are deferred to separate issues — see Out of scope below. THR-250 already covers stale-claim auto-release.

## What Symphony taught us

Symphony codifies its agent contract in a single `WORKFLOW.md` at the repo root, with typed YAML front matter and a strict-rendering Liquid template body. Quote: "Unknown variables MUST fail rendering. Unknown filters MUST fail rendering." The contract is data, not prose. A schema-validated handoff comment is the same idea applied to the coordination layer rather than the prompt layer. Symphony's design also reaffirms that the tracker (Linear) is the single source of truth — no durable orchestrator state — which the project's current protocol already embodies.

We are *not* adopting Symphony's single-executor architecture or its 30-second poll cadence. The three-agent split (Cowork plans, CC and Codex execute from separate queues) is a deliberate strength.

## Proposal

Create `Docs/coordination/WORKFLOW.md` as the canonical, schema-bearing definition of the handoff contract. Extend `scripts/check-process.ts` to parse the schema from front matter and validate Linear comments structurally — per executor type, with field-value validation. Land the new structural checks at `severity: warn` so the rollout is reversible; promote selectively to `error` once at least three real handoffs in each queue pass under stricter mode.

The MVP is deliberately scoped: one file, one validator extension. Existing substring keyword checks stay as `error` (no regression in current validation).

## Schema (front matter contract)

```yaml
---
executors:
  cc:
    queue: "Ready for Dev"
    required_fields:
      - name: "Suggested model"
        type: enum
        values: [haiku, sonnet, opus, opus-4-6, opus-4-7]
      - name: "Parallel-safe with"
        type: list_or_keyword
        keywords: [any, none]
      - name: "Mutex with"
        type: list_or_keyword
        keywords: [none]
      - name: "Codex review"
        type: enum
        values: [yes, no]
  codex:
    queue: "Ready for Codex"
    required_fields:
      - name: "Parallel-safe with"
        type: list_or_keyword
        keywords: [any, none]
      - name: "Mutex with"
        type: list_or_keyword
        keywords: [none]
      - name: "Files to touch"
        type: bullet_or_fenced_block
        min_items: 1
      - name: "Done when"
        type: markdown_checklist
        min_items: 1
---
```

### Field types

- `enum` — value (after stripping markdown bold and trailing parenthetical) matches one of `values` exactly, case-insensitive.
- `list_or_keyword` — value is a comma-separated list of `THR-XXX` IDs (with optional inline parentheticals) OR one of the listed keywords. An empty value is invalid; "none" must be explicit.
- `bullet_or_fenced_block` — value is either a triple-backtick block under the field name OR a markdown bullet list with at least `min_items` lines.
- `markdown_checklist` — at least `min_items` lines of `- [ ]` or `- [x]` after the field name.

### Field-name normalization

The validator must accept `**Field name:**`, `Field name:`, and `Field name —` as equivalent introductions, since real handoffs in the repo (e.g. THR-247) use bold markdown. Normalization: strip leading `**`, trailing `**`, and surrounding whitespace before matching against `name`.

## Body

The prose body of `WORKFLOW.md` carries:

- The per-executor pickup rules currently scattered in `CLAUDE.md`'s "Cowork vs Claude Code" section.
- The handoff-write contract for Cowork, with one worked example per executor type.
- A pointer back to `Docs/plans/2026-04-13-linear-coordination-protocol.md` for the failure-modes prose and the Hard Rules.

`CLAUDE.md` keeps a 5-10 line summary plus a link to `WORKFLOW.md`. `Docs/plans/2026-04-13-linear-coordination-protocol.md` keeps its detailed rules and links the same. The contract duplication that exists today gets resolved into `WORKFLOW.md` as the source of truth for the *schema*; the protocol doc remains the source of truth for the *rules and rationale*.

## Implementation steps

1. Author `Docs/coordination/WORKFLOW.md` with the schema above and a body that consolidates the executor pickup rules. Cross-reference from `CLAUDE.md` and `Docs/plans/2026-04-13-linear-coordination-protocol.md`.
2. Extend `scripts/check-process.ts`:
   - Parse `Docs/coordination/WORKFLOW.md` front matter on startup. If parsing fails, emit a single `error` finding and abort downstream Linear checks (mirrors Symphony's "config errors block all dispatches until fixed" stance).
   - Add `runReadyForCodexHandoffCheck(...)` mirroring the existing `runLinearChecks(...)` block; query Linear for `state.name == "Ready for Codex"` issues and validate their latest comment.
   - For each declared field: structural validation per `type`. New per-field structural checks emit `severity: warn` initially. The existing CC keyword presence check (the three required-keywords loop at line 392-411) stays as `severity: error` to preserve current behavior.
3. Add three fixture handoff comments under `scripts/check-process.fixtures/` (one valid CC, one valid Codex, one intentionally malformed) and a fixture-mode flag (`PROCESS_CHECK_FIXTURES=1`) so the validator can be exercised offline. This replaces the original "validate against 3 real handoffs" Done-when criterion since both queues are currently empty.
4. Run `npm run check:process` against the live Linear instance. Confirm no new `error`-level findings; new `warn`-level findings are acceptable and tracked.
5. Cross-reference `WORKFLOW.md` from `CLAUDE.md` (Session Workflow section, ~5 lines) and from `Docs/plans/2026-04-13-linear-coordination-protocol.md` (~3 lines).

## Done when

- [ ] `Docs/coordination/WORKFLOW.md` exists with front-matter schema and consolidated body
- [ ] `scripts/check-process.ts` parses the schema and validates both Ready-for-Dev and Ready-for-Codex handoffs, with structural checks at `severity: warn`
- [ ] Three fixtures exist under `scripts/check-process.fixtures/` and the fixture-mode flag exercises them
- [ ] `CLAUDE.md` and `Docs/plans/2026-04-13-linear-coordination-protocol.md` cross-reference the new file
- [ ] `npm run check:process` runs cleanly on a no-op commit (no new `error`-level findings)
- [ ] `plan-pending-commit` label removed (auto-handled by `flush-plan-docs`)
- [ ] Closing commit body includes `Fixes THR-303`

## Three-pillar check

- **Engine:** N/A — no game engine impact. No tick-loop, graph, or PRNG changes.
- **Content:** N/A — no game content changes.
- **UI:** N/A — no player-facing UI. Coordination tooling only.

This is a process/tooling ticket. The three-pillar exemption is intentional; the work modifies only `Docs/coordination/`, `scripts/check-process.ts`, `CLAUDE.md`, and one cross-reference in an existing protocol doc.

## NFP compliance

- **#1 Tunability:** schema is data (front matter); fixture-mode flag is named (`PROCESS_CHECK_FIXTURES`).
- **#2 Inspectability:** validator emits structured `Finding` records with `check`, `severity`, `message`, `file`, `line` — same shape as existing findings. PASS.
- **#3 Determinism:** N/A (validator is non-stochastic).
- **#4 Fail-soft:** new structural checks at `warn` severity until rollout proves stable; schema parse errors abort downstream Linear checks but do not crash the script. PASS.
- **#5 Narrative over mechanical perfection:** N/A.
- **#6 Additive over destructive:** existing CC keyword check is preserved unchanged. New code is purely additive. PASS.
- **#7 Performance:** validator runs in CI / pre-commit only; no hot path. PASS.

## Files to touch

- `Docs/coordination/WORKFLOW.md` (new, ~150 lines)
- `scripts/check-process.ts` (extend, ~100 lines added)
- `scripts/check-process.fixtures/` (new directory, 3 small markdown fixture files)
- `CLAUDE.md` (cross-reference; ~5 lines added)
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` (cross-reference; ~3 lines added)

## Risks and rollback

- **Risk:** Schema is too strict and rejects legitimate handoffs. **Mitigation:** new checks land as `severity: warn`. Promote to `error` only after at least three real handoffs in each queue pass under stricter mode (separately backloggable).
- **Risk:** `WORKFLOW.md` duplicates `CLAUDE.md` / protocol doc. **Mitigation:** consolidation is the goal — `CLAUDE.md` shrinks its "Cowork vs Claude Code" section to a summary plus a link.
- **Risk:** Linear MCP rate limits hit harder if the validator queries both queues every run. **Mitigation:** existing `LINEAR_API_KEY`-gated path already runs only when the key is set; new query reuses the same auth and same `lookbackDays` window. THR-246 already shipped rate-limit relief.
- **Rollback:** delete `Docs/coordination/WORKFLOW.md`, revert the `check-process.ts` extension, drop the fixtures directory. Existing CC handoff check is unchanged, so no regression in current validation.

## Out of scope (separately backloggable)

Symphony patterns deliberately *not* adopted in this issue:

- **Per-state concurrency caps as data** — currently a social contract (WIP=1).
- **Continuation-retry-after-clean-exit** — collapses "session handoff" into "until issue leaves In Dev." Worth a separate experiment.
- **Stall/turn timeouts on In Dev claims** — partially covered by THR-250 (stale-claim auto-release).
- **Workspace path safety invariants for worktrees** — three Symphony invariants (cwd equals path; path under root; key sanitized to `[A-Za-z0-9._-]`). Worth a separate worktree-discipline issue.
- **Per-tick reconciliation of stale claims** — Symphony fetches the tracker state of every running issue on every poll. THR-250 covers a slower-cadence version.
- **Project filter by `slugId`** — minor query-correctness improvement.

## Related

- **THR-247** (Done) — `pullNextReadyForDev` atomic pickup wrapper. This issue is the write-side counterpart to that read-side hardening.
- **THR-250** (Idea) — Stale-claim auto-release. Adjacent Symphony-style automation.
- **THR-248** (Idea) — Reopened-label automation on Done → Started transitions. Adjacent.
- **THR-246** (Done) — Linear MCP rate-limit relief. Validator extension reuses its query economy.
