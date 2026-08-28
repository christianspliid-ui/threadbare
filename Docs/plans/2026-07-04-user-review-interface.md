---
status: current
---

# User Review Interface — Settled Ways of Working

**Date:** 2026-07-04 · **Author:** Cowork (user directive, verbatim intent) · **Linear:** see handoff issue

## Decision (settled, not open for redesign)

Christian's interface to the development system is **chat only, plain language only**. Three hard rules:

1. **Christian does not review code diffs or PRs.** A Done-when criterion like "diff-reviewed by Christian" is invalid. When human review of a change is genuinely needed, the agent presents a **plain-language summary in chat** (what changed, why, what could be lost, recommendation) and asks a single yes/no question. Chat approval satisfies the human gate; the agent records "human gate satisfied via chat review \<date\>" as a Linear comment so the executor may merge.
2. **Christian does not read Linear issues or comments.** Linear is the agents' coordination surface, not a channel to the user. Anything needing Christian's attention must be surfaced in chat — primarily via the hourly briefing lane (`keep-work-flowing-cc`; the Cowork-run lane named here originally was retired 2026-07-21, THR-654). A Linear comment addressed to Christian reaches no one.
3. **Technical assessments are agent verdicts, not user verdicts.** CI/CD state, git forensics, merge mechanics, not-a-defect determinations, sandbox issues: the agent decides, acts (e.g. moves the issue to Canceled with a closing comment), and records reasoning on the issue. Only creative/product/design-vision decisions go to Christian, framed in game terms.

## Why

THR-575 sat parked 4+ hourly executor cycles behind a "diff-reviewed by Christian" gate, starving the executor lane (THR-580 idle behind it). THR-606 sat In Dev after CC correctly assessed it as not-a-defect, awaiting a close that only Christian was presumed able to make — a pure technical verdict he cannot help with. Both blocks were artifacts of assuming a user review interface (diffs, Linear) that does not exist.

## What changed already (2026-07-04, this session)

- `keep-work-flowing` scheduled-task prompt rewritten: Christian's-interface hard rules + a Step 0 "unblock parked work" pass that resolves technical gates itself and surfaces judgment gates in chat.
- THR-606 closed as Canceled by Cowork (not-a-defect on main, per CC investigation).

## Remaining deliverable (executor) — all shipped

> **Shipped note (2026-08-28, THR-1331):** every propagation below landed long ago — `Docs/canon/process.md` § User review interface, the CLAUDE.md session-types paragraph, and coordination-protocol Rule 10 all exist on `main`. Kept for history; nothing here is a to-do.

Propagate the three rules into the durable doc surfaces:

1. **`Docs/canon/process.md`** — add a short section `## User review interface (Christian)` under "Current spec — coordination" carrying the three rules above, plus pointer to this plan doc.
2. **`CLAUDE.md`** — one short paragraph in the Cowork/CC coordination section: no diff-review gates on Christian; no Linear-comment communication to Christian; plain-language chat summaries via keep-work-flowing; technical verdicts belong to agents. Do not re-inflate the file — 5–8 lines max.
3. **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** — add a hard rule (next free number) covering the same, so future handoff templates never write "diff-reviewed by Christian" style gates.
4. Grep for existing "diff-reviewed by Christian" / "human gate" phrasing in live docs and reconcile.

## Three-pillar

Engine / Content / UI: **N/A** — process documentation only. Verification: docs-only (`npm test`, `npx tsc --noEmit`, `npx vite build` stay green).

## NFP compliance

Process doc; NFPs 1–7 N/A except Inspectability (PASS — rules recorded in one place with pointers).
