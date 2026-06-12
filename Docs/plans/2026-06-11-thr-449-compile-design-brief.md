# THR-449 — Compile `Docs/design-brief.md`

> **Linear issue:** THR-449 (Continuous Improvement, Deferral, P4 Low)
> **Source audit:** `Docs/plans/2026-05-16-thr-377-split-state-of-game-design-skill.md` §2.2 (router's conditional fallback)
> **Author:** Cowork (keep-work-flowing scheduled run, 2026-06-11)
> **Three pillars:** Engine N/A · Content (the file itself + router wiring) · UI N/A

## 1. Why this is small but load-bearing

THR-377 split `state-of-game-design` into a router + reference shards. The router's intended top-of-stack read for any new design session is `Docs/design-brief.md` — a ≤2-page orientation that answers, in plain prose, *what game are we making* before the agent descends into shards. THR-376 was scoped to compile the brief in the same wave but partial-shipped without it. The router currently routes directly to shards (the §2.2 fallback). Every design session pays a small "no orientation layer" tax until the brief lands. The work is mechanical: the source material is settled, the format is constrained, the wiring is one edit.

This ticket is the executor pass — not a design dialogue. There are **no creative-director judgment calls.** All content is already canonical in `state-of-game-design/SKILL.md`, `Docs/canon/rulebook-quick-reference.md`, and `Docs/plans/2026-04-16-game-design-direction.md`. CC compiles, condenses, wires, ships.

## 2. Content pillar — `Docs/design-brief.md`

### 2.1 Length & format constraint

- **Hard cap:** ≤ 2 pages rendered (~100 lines markdown, ~4 KB).
- **Voice:** plain prose with light markdown — orientation, not reference. The brief is read once at session start; shards/canon are read on demand.
- **No tables unless they collapse 6+ rows of repeated structure.** Tables are reference-material smell; the brief is voice.
- **No code blocks, no constants, no graph schemas, no NFP list.** Those live in shards.
- **Pointers at the bottom**, not inline.

### 2.2 Section outline (compile from canonical sources)

The brief has **six sections**, in this order. Source columns indicate where each fact is canonical — CC copies and condenses, does not author new content.

| § | Section | ≤lines | Canonical source |
|---|---------|--------|------------------|
| 1 | **Logline** | 3 | `state-of-game-design/SKILL.md` §preamble (the blockquote at line 16–17) |
| 2 | **The core fantasy** (one paragraph — "you are a nascent god following mortals like a living novel") | 5 | `state-of-game-design/SKILL.md` Part 0, "core fantasy" |
| 3 | **The three-beat core loop** (Portfolio scan → Curated moment → Aftermath) | 12 | `state-of-game-design/SKILL.md` Part 0 |
| 4 | **What the player does** (the 5 verbs in one paragraph; the two-axis Reach×Sphere model in one paragraph; one example sentence — "Iron+Life rallies the living, Iron+Entropy raises the dead") | 18 | `state-of-game-design/SKILL.md` Part 1 |
| 5 | **What pressure makes it a game** (Doom Clock + Mandate dual-clock — one paragraph) | 8 | `Docs/canon/rulebook-quick-reference.md` clocks section |
| 6 | **Six principles every feature must satisfy** (compact list — one sentence each) | 14 | `state-of-game-design/SKILL.md` Part 0 |
| — | **Where to go next** — pointer matrix to shards/canon/Obsidian | 8 | `state-of-game-design/SKILL.md` routing table |

**Total:** ~70 lines body + frontmatter + section breaks. Well under the 2-page cap.

### 2.3 Frontmatter

```yaml
---
title: Threadbearer — Design Brief
purpose: ≤2-page orientation for any agent entering a design session. Read this BEFORE any shard, canon page, or domain skill.
audience: agents (Cowork, CC, Codex) starting any design or content work
companions:
  - Docs/canon/rulebook-quick-reference.md
  - TheFantasyWorldSimulator/Index.md
status: stable
last_validated_against: 2026-06-11
---
```

### 2.4 The "Where to go next" pointer matrix

Mirror the routing table from the `state-of-game-design` router, condensed to one column. Same anchors, no descriptions — the brief points; the router routes.

```
Next reads (load on demand):
- Rules of play .................. Docs/canon/rulebook.md
- Reaches × Spheres deep dive .... TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md
- Action verb mechanics .......... state-of-game-design/SKILL.md Part 1
- Encounters ..................... Docs/canon/encounters.md
- Agents & threads ............... Docs/canon/agents.md
- Prose authoring ................ Docs/canon/prose.md
- Hex map / HexMapV2 ............. Docs/canon/hex-map.md
- Experiential compass ........... Docs/plans/2026-04-16-game-design-direction.md
- Vision premises ................ TheFantasyWorldSimulator/Vision/ (via Obsidian MCP)
```

### 2.5 What the brief is **not**

- Not a glossary (UL owns terminology — `Docs/ubiquitous-language/`)
- Not a rulebook (`Docs/canon/rulebook.md` owns rules of play)
- Not a router (`state-of-game-design/SKILL.md` owns routing)
- Not a NFP list (CLAUDE.md owns NFPs)
- Not a load-bearing-decisions list (CLAUDE.md owns those)

If a section feels like it belongs in another doc, it does. Cut.

## 3. Wiring pillar — router pointer + check script

### 3.1 Router edit (`state-of-game-design/SKILL.md`)

The router has two copies (`.claude/skills/` canonical + `.agents/skills/` mirror — bump `last_validated_against` in both).

- In the routing table, change the "Optional" row's first cell from the current placeholder/note to: `**Always (first read)** | `Docs/design-brief.md` | ≤2-page orientation`.
- Update §2.2 (the conditional fallback) to a one-line closure: `~~Conditional fallback~~ — `Docs/design-brief.md` shipped via THR-449 (2026-06-11). Router always routes through the brief first.`
- Update §5 risk note to mark the "brief missing" risk as resolved.
- Run `npm run check:skill-sync:sync` so the `.agents/` copy mirrors.

### 3.2 `npm run check:design-brief` (optional follow-up — DO NOT scope into this ticket)

THR-377 plan §2.2 mentions a sibling check script that asserts the brief exists in `main`. CC can defer that to a new Continuous Improvement issue if the script would take more than 10 minutes — the value of the script is asymptotically small once the brief exists. Filing the follow-up is fine; expanding scope to write it inside THR-449 is not.

## 4. Three-pillar coverage

| Pillar | Status | Note |
|--------|--------|------|
| Engine | N/A | No engine code touched. No tick phase, no graph node, no resolver. |
| Content | ✅ | The brief itself — one new ≤2-page doc compiled from settled material. |
| UI | N/A | No surface change. No component, no debug-bridge query, no HexMapV2 signifier. The brief is read by agents, not players. No 1920×1080 screenshot required (UI pillar exempt — types-only-equivalent doc-only change; cite this exemption in the closing commit body using the CLAUDE.md "Browser-verify exempt" form). |

## 5. NFP audit

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | No constants. |
| 2. Inspectability | PASS | The brief itself improves inspectability of the design-session entry point. |
| 3. Determinism | PASS | No code. |
| 4. Fail-soft | PASS — see fail-soft table | Router fallback already handles brief-missing; this ticket resolves the missing branch. |
| 5. Narrative over mechanical perfection | PASS | The brief IS the narrative framing. Voice over completeness — if a section threatens the 2-page cap, cut it before extending. |
| 6. Additive over destructive | PASS | Adds one new file; the router edit is additive (changes one row from placeholder to pointer) and closes a known stub. |
| 7. Performance budget | N/A | No runtime. |

### Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Brief missing at design-session start | Router falls back to direct-shard routing (§2.2 of THR-377 plan — already implemented). |
| Brief drifts from canonical sources | Brief carries `last_validated_against` date; weekly drift scan (THR-404 family) can lint it later if drift becomes a recurring pattern. Not in scope here. |
| Author over-runs the 2-page cap | CC cuts before merging. The cap is binary, not advisory. If three sections each want 18 lines, the brief is wrong shape — cut to outline-density, not encyclopedia-density. |

## 6. Done when

- [ ] `Docs/design-brief.md` exists, ≤ 2 pages rendered, follows the §2.2 outline above
- [ ] Brief reads cleanly to a new agent (CC sanity-check: read your own draft from cold; if anything reads as jargon-without-context, cut or rewrite)
- [ ] Router routing table updated (both `.claude/` canonical + `.agents/` mirror)
- [ ] `last_validated_against: 2026-06-11` bumped in the router files
- [ ] §2.2 conditional-fallback note in the THR-377 plan doc is **not** edited — that plan doc is a historical artifact; resolution lives in the brief's existence
- [ ] Closing commit body includes `Fixes THR-449` and `Browser-verify exempt: doc-only change, no UI pillar touched`
- [ ] Linear completion comment links to the brief and notes router updated

## 7. Coordination block

**Suggested model:** sonnet (small doc compile + two file edits — no novel reasoning required; haiku would also be fine but sonnet has more headroom for the "read your draft cold" sanity check)

**Parallel-safe with:** THR-455, THR-453, THR-456, THR-452, THR-457 (all Ready for Dev; none touch `Docs/design-brief.md`, `state-of-game-design/SKILL.md`, or the router routing table)

**Mutex with:** none

**Codex review:** no (doc-only change, no source code touched; structural review surface skipped per CLAUDE.md exemption convention)

**Files to touch:**
- Create: `Docs/design-brief.md`
- Edit: `.claude/skills/state-of-game-design/SKILL.md` (routing table + §2.2 closure + `last_validated_against` bump)
- Edit: `.agents/skills/state-of-game-design/SKILL.md` (mirror — run `npm run check:skill-sync:sync` after editing the canonical copy)

## 8. Notes for the executor

1. **Don't over-engineer the brief.** Read this plan, read the canonical sources, draft the brief in one pass, cut by ~20%, ship. If you spend more than 30 minutes drafting, the brief is the wrong shape.
2. **The brief is a voice document, not a reference document.** If a section reads like it could be cut-and-pasted from a wiki, it's reference, not voice. Rewrite it as prose a person would actually say aloud to a new agent.
3. **Don't grow the scope to write the `check:design-brief` script.** File it as a follow-up Continuous Improvement issue if you think it's worth it. THR-449 ships when the brief exists and the router routes through it.
