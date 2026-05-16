# THR-377 — Split `state-of-game-design` into router + on-demand reference shards

> **Status:** plan doc — apply `plan-pending-commit` label and move issue to Ready for Dev. `flush-plan-docs` will commit this file hourly.
> **Ticket:** [THR-377](https://linear.app/threadbare/issue/THR-377/mt-1-split-state-of-game-design-into-router-reference-shards)
> **Project:** Continuous Improvement
> **Source audit:** `Docs/audits/2026-05-08-design-loop-fork-files-commands-audit.md` (THR-375) — MT-1
> **Suggested model:** sonnet (mechanical refactor + multi-skill routing update — pattern-following but spans many files)
> **Author:** Cowork (keep-work-flowing scheduled run, 2026-05-16)

---

## 1. Summary

`state-of-game-design/SKILL.md` is a monolithic ~24 KB skill that today is loaded "first" before every domain-specific skill. The QW-1 dedup (THR-376) trimmed it but the structural problem remains: every domain skill pays the full ~24 KB context price even when only one of its parts (cosmology, verbs/resolution, architectural decisions, or deprecated patterns) is relevant.

Refactor into a thin router (`SKILL.md`, ≤5 KB) plus four on-demand reference shards. Mirror the established `Docs/ubiquitous-language/README.md + shards` pattern (which works) and the `Docs/canon/*` per-domain canon-page pattern (which also works). After landing, every downstream skill that currently says "always load state-of-game-design first" loads the thin router; the router tells the agent which shard to pull in for the current task.

**This is an agent-tooling refactor.** No engine, content, or UI code is touched. All three pillars are N/A — see §3.

## 2. Target structure

```
.claude/skills/state-of-game-design/
├── SKILL.md                                  ≤ 5 KB — router + always-load orientation
└── reference/
    ├── cosmology.md                          Reaches, Spheres, scales, Quintessence
    ├── verbs-resolution.md                   The 5 action verbs, sigmoid → d100, prerequisites
    ├── architectural-decisions.md            Load-bearing decisions (graph-only, three-tier position, etc.)
    └── deprecated.md                         Rejected approaches (stats triplet, fixed rivals, R3F, etc.)
```

Mirror to `.agents/skills/state-of-game-design/` via `npm run check:skill-sync:sync`. The skill-sync hook (THR-192) enforces drift detection.

### Router (`SKILL.md`) contents

The thin router must contain:

1. **YAML frontmatter** — `name`, `description`, `last_validated_against` (bump to the merge date).
2. **The 3-beat orientation** (~10 lines) — what Threadbearer is, the player's seat, the always-load companions (`Docs/canon/rulebook-quick-reference.md`, `TheFantasyWorldSimulator/Index.md`).
3. **A "which shard to load" routing table** keyed by task type. See §2.1.
4. **Pointer to `Docs/design-brief.md`** (compiled by THR-376 QW-4) as the **first** read for any design work. Shards are loaded only when the brief doesn't carry the specific detail needed. See §2.2 for the conditional fallback.
5. **One-line links** to canon pages (`Docs/canon/rulebook.md`, `Docs/canon/encounters.md`, `Docs/canon/cosmology.md`, `Docs/canon/process.md`, `Docs/canon/prose.md`, `Docs/canon/hex-map.md`, `Docs/canon/agents.md`) as the per-domain entrypoints. The router does NOT duplicate canon-page content — it points.
6. **No long-form content.** If a paragraph exceeds 3 lines in the router, it belongs in a shard.

### 2.1 Routing table (in the router)

| Task type | Load this shard | Plus canon page |
|-----------|----------------|----------------|
| Encounter / content / cosmology work | `reference/cosmology.md` | `Docs/canon/encounters.md` + `Docs/canon/cosmology.md` |
| Engine / tick / resolution / PRNG work | `reference/verbs-resolution.md` | (none specific) |
| Plan-doc authoring / audit / governance | `reference/architectural-decisions.md` | `Docs/canon/process.md` |
| Proposing a pattern that might be rejected | `reference/deprecated.md` | (always check before proposing) |
| Prose / vignette / enrichment | `reference/cosmology.md` (for Sphere/Reach refs) | `Docs/canon/prose.md` |
| Hex map / HexMapV2 / Three.js | (router orientation only) | `Docs/canon/hex-map.md` |

Agents may load multiple shards when a task spans domains (e.g., an encounter that touches resolution → load both `cosmology.md` and `verbs-resolution.md`). The router calls this out explicitly.

### 2.2 Conditional fallback if `Docs/design-brief.md` does not yet exist

THR-376 (QW-4) was scoped to compile `Docs/design-brief.md` and the matching `npm run check:design-brief`. Verification at handoff time: if the brief file exists in `main`, route through it first. If it does not (THR-376 partial-ship hypothesis — see §5 risk note), the router routes directly to shards and opens a follow-up Linear issue to compile the brief before MT-4 (vision-audit) can land.

**CC's first implementation step is to verify which scenario is live** by running:

```bash
test -f Docs/design-brief.md && echo "brief exists — route via brief" || echo "brief missing — route via shards, open follow-up"
```

This makes the routing scenario explicit in the plan instead of guessing from a stale sandbox.

## 3. Three-pillar check — all N/A

This is a skill-routing refactor. It does not touch any code path that runs in the game, generates content, or renders UI. Marking each pillar N/A with rationale, per CLAUDE.md § Design Governance.

- **Engine — N/A.** No tick, graph, PRNG, resolution, or trace surface is touched. `state-of-game-design` is read by agents at design time, never executed at runtime.
- **Content — N/A.** No encounter template, prose table, attachment, or graph data changes. The shard `reference/cosmology.md` documents existing cosmology; it does not author new content.
- **UI — N/A.** No component, view, hook, hex-map surface, or modal touched. No `__DEBUG` field added. No 1920×1080 screenshot required.

**Therefore the Definition of Done § Browser-verify UI changes exemption applies.** CC's closing commit body must explicitly state: `Browser-verify exempt: skill-routing refactor, no runtime UI surface touched`.

## 4. Wiring impact (downstream skills + meta-docs)

Verified at plan time — files referencing `state-of-game-design` that must be reviewed for routing updates (current count: **7 skills × 2 audience trees + CLAUDE.md + AGENTS.md**):

| File | What needs updating |
|------|---------------------|
| `.claude/skills/content-worldbuilding/SKILL.md` + `.agents/` mirror | "Load state-of-game-design first" → "Load the state-of-game-design router; it will point to `reference/cosmology.md` for content work" |
| `.claude/skills/encounter-actor-systems/SKILL.md` + `.agents/` mirror | Same routing update — load shard `cosmology.md` + `verbs-resolution.md` |
| `.claude/skills/engine-architecture/SKILL.md` + `.agents/` mirror | Load shard `verbs-resolution.md` + `architectural-decisions.md` |
| `.claude/skills/game-design-direction/SKILL.md` + `.agents/` mirror | Companion skill — explicitly state that the router and direction skill are co-loaded |
| `.claude/skills/prose-content-systems/SKILL.md` + `.agents/` mirror | Load shard `cosmology.md` (Sphere/Reach references) |
| `.claude/skills/vault-lint/SKILL.md` + `.agents/` mirror | Audit reference — the routing language likely just needs a path bump |
| `CLAUDE.md` § Skill Tree Layout + § Domain Skills | Update the "Always load `state-of-game-design` first" sentence + skill-table description |
| `AGENTS.md` | Mirror CLAUDE.md change |

**Implementation rule:** CC must `grep -rln "state-of-game-design" .claude/skills/ .agents/skills/ CLAUDE.md AGENTS.md` at the start of the work to confirm the list hasn't grown since this plan was written. Any new references must be updated in the same commit.

## 5. NFP compliance

This refactor doesn't add tunables, tracing, or runtime behaviour, so most NFPs are PASS-by-vacuity. The ones that do apply:

| # | NFP | Verdict | Note |
|---|-----|---------|------|
| 1 | Tunability | PASS (vacuous) | No game constants involved |
| 2 | Inspectability | **PASS** | Router + shards is *more* navigable than monolithic SKILL.md — an agent reading "load shard X for task Y" can audit its own context economy and trace which shard fed which decision. Net-improvement. |
| 3 | Determinism | PASS (vacuous) | No PRNG, no runtime |
| 4 | Fail-soft | **PASS with note** | Failure mode: an agent loads a shard path that no longer exists (broken reference after rename). Fallback: the router lists shards by relative path; CI hook (skill-sync) catches drift. Worst case is a missing-context degradation, never a runtime crash. See §6 fail-soft table. |
| 5 | Narrative over mechanical | PASS (vacuous) | No story content |
| 6 | Additive over destructive | **PASS** | Existing skill content is *moved* into shards, not deleted. The router replaces the SKILL.md body but every word is reachable via a shard. No content loss is the headline acceptance criterion in §8. |
| 7 | Performance budget | **PASS** | Context budget is exactly what this work optimizes — every downstream skill that previously paid ~24 KB now pays ≤5 KB (router) + the one or two shards it actually needs. Conservative estimate: average context savings of 12–18 KB per Cowork/CC session that loads any of the seven downstream skills. |

## 6. Constants and fail-soft

### Constants table

| Constant | Value | Purpose |
|----------|-------|---------|
| `SKILL.md` size budget | ≤ 5 KB | Router only — exceeding this means content leaked back in |
| Number of shards | 4 (cosmology, verbs-resolution, architectural-decisions, deprecated) | Match the four "Parts" of the existing skill |
| Total reference/ size | should ≈ source SKILL.md size minus router prelude | Acceptance: no content lost |

### Fail-soft table

| Failure mode | Detection | Fallback |
|--------------|-----------|----------|
| Shard file missing after rename | Skill-sync hook (THR-192) flags the drift between `.claude/skills/` and `.agents/skills/`. Pre-commit blocks the PR. | Router stays valid — agent reads what it can find; missing shard surfaces as a `(file not found)` log line, never a crash |
| Downstream skill not updated (still says "load state-of-game-design first" without shard pointer) | The agent loads the router and routes via the table — old wording still resolves to a working flow | Routing table is the source of truth; orphan wording in a downstream skill is a soft-fail (agent does the right thing anyway) but should be cleaned up in the same commit |
| `Docs/design-brief.md` doesn't exist | `test -f` check from §2.2 | Router has explicit "if brief missing, route directly to shards" branch; CC opens follow-up Linear issue |
| Mirror out of sync between `.claude/` and `.agents/` | `npm run check:skill-sync` (the THR-192 pre-commit hook) | Hook blocks commit; CC runs `npm run check:skill-sync:sync` |

### Tracing

**N/A.** No runtime traces — agent-tooling refactor.

## 7. Coordination block

- **Suggested model:** sonnet (apply `model:sonnet` label).
- **Parallel-safe with:** any non-design-loop work — engine, content, hex map, UI surfaces are untouched.
- **Mutex with:**
  - **THR-378** (MT-2: fork plan-finalization audit into subagents) — both touch the design-loop SKILL.md routing. Land MT-1 first; MT-2 builds on the router being thin.
  - **THR-381** (MT-5: agents/ subfolder for grill-me + design-council) — different subdirectory but overlaps with the "split SKILL.md into router + reference assets" pattern. Land MT-1 first to establish the convention.
- **Blocked by:** none (THR-376 has shipped per Linear).
- **Codex review:** **no** — this is multi-skill routing-language coordination, not mechanical pattern-following. Best in CC's hands.
- **Files to touch (full enumeration):**
  - `.claude/skills/state-of-game-design/SKILL.md` (rewrite to router)
  - `.claude/skills/state-of-game-design/reference/cosmology.md` (new)
  - `.claude/skills/state-of-game-design/reference/verbs-resolution.md` (new)
  - `.claude/skills/state-of-game-design/reference/architectural-decisions.md` (new)
  - `.claude/skills/state-of-game-design/reference/deprecated.md` (new)
  - `.agents/skills/state-of-game-design/` mirror (via `npm run check:skill-sync:sync`)
  - `.claude/skills/content-worldbuilding/SKILL.md` + `.agents/` mirror
  - `.claude/skills/encounter-actor-systems/SKILL.md` + `.agents/` mirror
  - `.claude/skills/engine-architecture/SKILL.md` + `.agents/` mirror
  - `.claude/skills/game-design-direction/SKILL.md` + `.agents/` mirror
  - `.claude/skills/prose-content-systems/SKILL.md` + `.agents/` mirror
  - `.claude/skills/vault-lint/SKILL.md` + `.agents/` mirror
  - `CLAUDE.md` (§ Skill Tree Layout + § Domain Skills table)
  - `AGENTS.md` (mirror the CLAUDE.md edits)

## 8. Done when

- [ ] `state-of-game-design/SKILL.md` ≤ 5 KB and contains only orientation + routing table + pointers (no long-form Reaches/Spheres/verbs content)
- [ ] Four shards exist at the paths in §2 and collectively contain every line from the pre-split SKILL.md (no content lost — diff at the union-of-shards level)
- [ ] `.agents/` mirror passes `npm run check:skill-sync`
- [ ] All seven downstream skills updated to point at the router + the specific shard(s) they need
- [ ] CLAUDE.md and AGENTS.md updated — the "always load `state-of-game-design` first" sentence reframed as "load the `state-of-game-design` router first; it routes to shards"
- [ ] If `Docs/design-brief.md` does not exist in `main` at implementation time, a follow-up Linear issue is opened to compile it (block on MT-4 vision-audit)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:skill-sync`, `npm run check:process` all pass
- [ ] Closing commit body includes `Fixes THR-377` AND `Browser-verify exempt: skill-routing refactor, no runtime UI surface touched`

## 9. Risk notes

1. **Sandbox staleness flagged at plan time.** The keep-work-flowing scheduled run could not verify whether `Docs/plans/_template.md` or `Docs/design-brief.md` exist in `main` — its working-tree clone showed mid-April mtimes. CC's first action under §2.2 is to verify which routing scenario is live. If the brief is missing despite THR-376 being marked Done, that is itself a Continuous-Improvement signal (premature Done marking) and CC should report it in the closing comment.
2. **Mutex coordination is real but cheap.** THR-378 and THR-381 both touch design-loop SKILL.md surfaces. Land MT-1 first — its router file is the surface the other two build on. The Linear coordination block on each ticket says the same.
3. **Routing-table drift risk.** If a future skill adds a "load state-of-game-design first" line without consulting the routing table, the table goes stale. Mitigated by the audit's MT-3 (lint:plan-doc, THR-379) eventually growing a "router-vs-skills consistency" check — out of scope for this ticket but worth a one-line note in the closing commit.

---

## Appendix A: Verification commands

```bash
# Confirm prerequisites (CC's first step)
test -f Docs/design-brief.md && echo "brief: yes" || echo "brief: no — open follow-up"
test -f Docs/plans/_template.md && echo "_template: yes" || echo "_template: no — non-blocking for MT-1"

# Confirm downstream skill list hasn't drifted
grep -rln "state-of-game-design" .claude/skills/ .agents/skills/ CLAUDE.md AGENTS.md

# Verify size budget after split
wc -c .claude/skills/state-of-game-design/SKILL.md   # expect ≤ 5120

# Verify no content lost
cat .claude/skills/state-of-game-design/reference/*.md | wc -l   # ≥ pre-split SKILL.md body line count
```
