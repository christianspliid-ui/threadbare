---
status: current
domain: process
supersedes: []
superseded_by: null
created: 2026-05-05
last_reviewed: 2026-05-05
---

# Canonical Documentation Strategy — Making the Right Doc Findable for the Right Agent

**Status:** Strategy proposal. On approval, splits into 5 phased Linear issues across CC and Codex queues.

**Linear issue:** TBD (Cowork to create on approval — Continuous Improvement project).

**Audience:** the user (verdicts on direction); future Cowork sessions writing plans; CC/Codex picking up the phase tickets; future authoring agents whose Step 0 will change because of this work.

**Triggering observation (the user, 2026-05-05):**
> *"In some of the work we've done on improving the encounters, the agent is struggling to find the canonical content and sometimes is falling back on old content."*

---

## 1. Premise

Threadbearer's documentation is **rich, plentiful, and well-policed at the rule level** — but it's **shallow at the navigation level**, and **stale at the leaf level**. Authoring agents (encounter-pipeline, attachment-pipeline, prose-content-systems) are forced to triangulate the current canon across 6–12 files for any given creative decision. The cost of triangulation is the symptom; the silent fall-back to outdated content is the failure mode.

This plan does not introduce new ownership rules. The rules in `Docs/documentation-ownership.md` are correct. It introduces a **navigation layer** between those rules and the agents who have to act on them, plus the **enforcement scaffolding** that keeps the navigation layer from rotting in turn.

The four-load-bearing-rules approach mirrors the recently-shipped encounter design plan (`2026-05-04-encounter-experience-design-plan.md` §1) — three asserted invariants, the rest of the doc references them by number.

**Four load-bearing rules:**

- **Rule 1 — Every creative domain has a single Canon page.** One file, ≤200 lines, in `Docs/canon/<domain>.md`. It is the agent's Step 0 entrypoint. It does not contain definitions; it points to them. It enumerates current canon, current rejected approaches, current open questions, and last-reviewed date.
- **Rule 2 — Plans declare their lifecycle in frontmatter.** Every plan in `Docs/plans/` carries `status: proposal | current | implementation-log | superseded | historical` and (when relevant) `superseded_by: <path>`. A plan with no status is treated as historical by tooling. (`current` rather than `canon` to avoid colliding with UL's `Status: canonical` term-entry field — see §3.2.)
- **Rule 3 — Old plans archive once their content lives in canon.** Plans with `status: implementation-log` and age >90 days move to `Docs/plans/archive/YYYY-MM/`. The flat `Docs/plans/` directory stays scannable. The 396-file backlog is a one-time sweep, not a permanent state.
- **Rule 4 — Drift is detected, not discovered.** The UL is already the terminology authority. Add a `lint-ul-vs-systems` signal to the weekly drift scan that flags Obsidian `Systems/` pages contradicting UL terms or referencing rejected approaches. The user no longer has to find drift via forensic vision-audits — drift becomes a Linear issue with a `drift-scan` label.

---

## 2. Diagnosis

The current state, sampled today (2026-05-05).

### 2.1 The numbers

- `Docs/plans/` holds **396 dated `.md` files**, mostly in 2026-03 (205) and 2026-04 (181), plus 6 in early 2026-05. The directory grows ~6–7 files per day.
- The 5 most recent plans on 2026-05-04 are all encounter-related; no `*-brainstorm.md` companions despite CLAUDE.md mandating them. The grill-me synthesis (`2026-05-04-encounter-experience-grill-me.md`) partially fills the role under a different name.
- **No frontmatter status convention exists.** Plans are dated, but their lifecycle (proposal vs canon vs superseded vs archived) is invisible to tooling and to readers who don't already know the project history.
- Three brainstorm surfaces coexist with no discipline: Obsidian `Brainstorms/` (7 files), `Docs/plans/*-brainstorm.md` (3 files), `Docs/design-councils/` (2 files + README).

### 2.2 The forensic audit pattern

The user is already doing what the strategy needs to automate. `2026-05-04-encounter-toolkit-vision-audit.md` is a critical read of `2026-05-04-encounter-build-toolkit.md` against Vision + canonical Obsidian Systems pages. It found:

| Drift type | Count | Examples |
|---|---|---|
| Concrete drift (canon contradiction) | 3 | "8 reaches" (canonical: 9), "Spirit reach" (Spirit is a Sphere, not a Reach), "Voice reach" (does not exist) |
| Canonical-system silence (failed to invoke existing canon) | 4 | Fate Forecast, Agenda Picker, aftermath effect kinds, prose engine tiers |

To produce that audit, the user (or the auditing agent) read 12 source files: 5 Vision docs, 7 Obsidian Systems pages, plus the toolkit. **That is the cost of every drift detection today.** Every authoring agent that bypasses the audit ships a draft with the same drifts in it. The audit is the bottleneck, not the prevention.

### 2.3 Where stale content lives today

- **Vault `Systems/Agent Wheel.md`** — exists as a wiki page despite AgentWheel being on CLAUDE.md's Rejected Approaches list. Tombstone candidate.
- **Vault `Systems/Domain Word Scales.md`** — per the vision audit, says 9 reaches including Flesh; UL says Flesh was deprecated and absorbed into Quintessence (TB-075). Drift between two canonical surfaces. (User verdict required: which is current canon — restore Flesh as 9th Reach, or accept 8 Reaches + Quintessence as a separate system?)
- **Plan docs >60 days old** — undated as canonical or superseded. Agents grepping for "encounter" find the same number of hits in 2026-03 plans as in 2026-05 plans, with no signal which is current.
- **Compiled briefs** (`Docs/authoring-brief.md`) cover engine capabilities and design principles, but not "current spec" or "rejected approaches" or "current open questions." They're partial canon surfaces.

### 2.4 What's already working

This plan is additive on top of strong infrastructure:

- **Ubiquitous Language (`Docs/ubiquitous-language/`)** — 79 canonical terms, sharded, "UL wins on disagreements" rule enforced. Index is always-loaded. **This is the strongest existing canonicality surface.** The strategy extends UL's authority into Obsidian Systems pages (Phase 4) rather than competing with it.
- **`Docs/documentation-ownership.md`** — the duplication policy ("one fact, one home") is correct and well-articulated. The strategy adds a navigation layer; it does not change ownership.
- **`Docs/authoring-brief.md`** — the compiled-preamble pattern works. Generated from sources via `npm run build-authoring-brief`, sha-pinned, staleness-checked. The strategy generalizes this pattern, not replaces it.
- **`Docs/exemplars.md`** — exemplar centralization works. The strategy treats Canon pages as a generalization of this idea.
- **`Docs/plans/2026-05-04-encounter-experience-design-plan.md`** — the recent plan opens with an *"Inputs (read these first if you're new)"* section. **This is the convention the strategy formalizes.** The Canon page is what that input list points to.

---

## 3. Strategy: a three-layer canonicality model

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1 — UL (terminology authority, always loaded)            │
│  Docs/ubiquitous-language/                                      │
│  Owns: term definitions; "UL wins on disagreements"             │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ (Canon pages cite UL terms; do not redefine them)
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2 — Canon pages (per-domain entrypoint, agent Step 0)    │
│  Docs/canon/<domain>.md                                         │
│  Owns: navigation, current spec pointers, current rejections,   │
│        current open questions, last-reviewed date               │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ (Plans link to Canon page; Canon page links forward to current plan)
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3 — Plans (proposals, decisions, implementation logs)    │
│  Docs/plans/                                                    │
│  Owns: rationale, alternatives, decision history                │
│  Frontmatter: status + superseded_by                            │
│  Old logs archived to Docs/plans/archive/YYYY-MM/               │
└─────────────────────────────────────────────────────────────────┘
```

The three layers each answer a different question. UL: *"what does this term mean?"* Canon: *"what's true today, and where do I read?"* Plans: *"why did we decide that?"*

The agent's loading order is: load UL index always → load the relevant Canon page first when starting authoring work → only descend into Plans when answering a *why* question.

### 3.1 What goes in a Canon page

A Canon page is a navigation document, not a system definition. Strict shape:

```markdown
---
domain: encounters
last_reviewed: 2026-05-05
reviewer: cowork  # or 'user' for user-verdicted reviews
ul_shards: [Encounters, Prose]
status: live  # live | needs-review | stale
---

# Canon — Encounters

> One-line statement of what this domain is.

## Current spec
- **Format:** UnifiedActionTemplate (since THR-108, 2026-04-XX). Legacy EncounterTemplate is removed.
- **Authoring entrypoint:** [.claude/skills/encounter-pipeline/SKILL.md]
- **Engine wiring:** [Docs/plans/2026-04-16-systemic-wiring-guide.md]
- **Compiled brief:** [Docs/authoring-brief.md] (regenerated from sources)
- **UL terms:** [Encounters shard](../ubiquitous-language/Encounters.md)
- **Obsidian system page:** [Systems/Encounter System](obsidian://...) (last verified 2026-05-05)
- **Exemplars:** [src/data/encounters/rival-shrine-betrayal.ts], [flawed-steel.ts] (per `Docs/exemplars.md`)

## Active design plans (status: proposal or canon)
- [2026-05-04-encounter-experience-design-plan.md] — current canonical design (THR-300)
- [2026-05-04-encounter-toolkit-vision-audit.md] — drift audit (resolved)
- [2026-05-04-encounter-experience-player-journey.md] — player journey reference

## Rejected approaches (from CLAUDE.md, plus domain-specific)
- ❌ EncounterTemplate format (replaced by UnifiedActionTemplate, THR-108)
- ❌ AgentWheel / fixed action slots (replaced by ActionDrawer, see Generalized Action Targeting)
- ❌ Pure LLM-generated encounter prose (replaced by hybrid layered engine)
- ❌ Player chooses how the character responds (player-as-god framing — divine intervention only)

## Open questions
- Domain Word Scales: 9 reaches including Flesh, or 8 Reaches + Quintessence as separate system? (UL drift, user verdict required)
- Branch count enforcement: 3 ceiling vs target. Editorial agent applies discipline.

## Last-reviewed
2026-05-05 by Cowork. Review trigger: monthly, or when any linked plan moves to `superseded`.
```

**The Canon page is short on purpose.** It is a list of pointers, not a textbook. Definitions live in UL; rationale lives in plans; the Canon page is where the agent goes to find both.

### 3.2 Frontmatter status convention for plans

Five-value enum:

| Value | Meaning | Tooling implication |
|---|---|---|
| `proposal` | Drafted, not yet user-approved | Agents may read for context but should not treat as current spec |
| `current` | User-approved as current spec; referenced by a Canon page | Authoring agents may rely on as canonical |
| `implementation-log` | Records what was built; superseded for design but useful for archaeology | Archive after 90 days |
| `superseded` | Replaced by another plan; `superseded_by:` points forward | Authoring agents must not load |
| `historical` | Default if missing; archive immediately | Drift-scan flags as "untagged plan" |

> **Naming note.** I deliberately use `current` here, not `canon`. UL term entries already use `Status: canonical` to mean "this term definition is canonical" (e.g. `Encounters.md`, `Process.md`). Reusing `canon` for plan-frontmatter status would collide with that. Reserving `canon` exclusively for the *navigation page* — `Docs/canon/<domain>.md` — keeps the language clean: a Canon page describes what is *current*; a plan with `status: current` is one of the inputs that determined what's current.

Companion fields:
- `superseded_by: <path>` — required when `status: superseded`
- `domain: encounters | agents | prose | hex-map | engine | process | ...` — used by `update-canon` to know which Canon page to update on closeout
- `last_reviewed: YYYY-MM-DD` — when the doc was last verified against current code

**Existing plans get frontmatter retroactively only when touched.** No big bang — agents updating an old plan add the frontmatter as part of the touch.

### 3.3 Drift detection signals

Three new checks join the weekly drift scan:

1. **`lint-ul-vs-systems`** — for each Obsidian `Systems/` page, scan for terms defined in UL and flag where the Systems page contradicts the UL definition. (Implementation: extract terms from UL shards, regex against Systems pages, surface as Linear issue per drift.)
2. **`lint-rejected-approaches`** — scan all `Docs/plans/` (current, not archive) and Obsidian `Systems/` for references to terms in CLAUDE.md's "Rejected Approaches" list that aren't tagged `❌` or in a tombstone block. Flag for tombstoning.
3. **`lint-untagged-plans`** — scan `Docs/plans/*.md` for files missing frontmatter `status:`. Flag during initial sweep; after sweep, fail-noisy in pre-commit on new plans.

All three emit `drift-scan`-labeled Linear issues per the existing weekly pattern. The user no longer has to find drift via vision audits.

---

## 4. Phase plan

Each phase is a separate Linear issue. Phases 1 and 2 are blocking; 3–5 can run in any order after 2 lands.

### Phase 1 — Establish the convention (Cowork)

**What:** define schema, bootstrap encounters Canon page, update CLAUDE.md and `documentation-ownership.md`.

**Deliverables:**
- `Docs/canon/README.md` — canon page schema, when to update, who owns
- `Docs/canon/encounters.md` — first worked example, populated from current state
- `Docs/canon/plans-frontmatter.md` — frontmatter schema (or inline in `documentation-ownership.md`; user verdict)
- Edit `Docs/documentation-ownership.md` — add Canon Pages row to the surfaces table
- Edit `CLAUDE.md` — add Canon Pages to "Documentation Strategy" section; update Session Workflow to mention Canon page as Step 0 for authoring tasks
- Linear: file 4 child issues for Phases 2–5

**Effort:** Cowork session, ~2h. No code.

**Done when:** the encounters Canon page renders the answer to *"what is the current encounter format and where do I look?"* in <60 seconds of agent reading time, end-to-end.

### Phase 2 — Wire authoring skills to Canon pages (Codex)

**What:** authoring skills load the relevant Canon page first.

**Deliverables:**
- Edit `.claude/skills/encounter-pipeline/SKILL.md` — Step 0 reads `Docs/canon/encounters.md` before any other reference material; the existing pre-read list moves under it as "files the Canon page links to"
- Mirror to `.agents/skills/encounter-pipeline/SKILL.md` via `npm run check:skill-sync:sync`
- Same edits for `template-encounter-rewrite`, `attachment-pipeline`, `prose-content-systems`, `prose-pipeline` (each gets a Canon page bootstrapped in Phase 1.5 or this phase — see scope decision below)
- Add `npm run check:canon-staleness` script that diffs `last_reviewed` vs file mtime and warns when a canon page is referenced by a plan changed since its last review
- Add Canon-page check to `.github/workflows/claude-review.yml` (advisory)

**Scope decision:** Phase 1 ships *only* the encounters Canon page. Phase 2 either expands to the other 4 domains in this phase, or splits into Phase 2a (encounter-pipeline wiring) and Phase 2b (other authoring domain wiring + Canon page bootstrap). Recommended: **2a only ships encounter-pipeline + encounters Canon page; 2b is a follow-on issue.** Lets us validate the pattern with one domain before propagating.

**Effort:** Codex pickup, ~1 day for 2a. Mostly mechanical SKILL.md edits.

**Done when:** running `/encounter-pipeline short …` produces a draft that does not regress against the drifts the 2026-05-04 vision audit caught — verified by re-running an editorial pass on the produced draft and finding zero "8 reaches", "Spirit reach", "Voice reach", or missing-Fate-Forecast errors.

### Phase 3 — Frontmatter convention + plan archive sweep (CC)

**What:** add frontmatter to recent plans; sweep older plans into archive.

**Deliverables:**
- Plan-doc template (`Docs/plans/_template.md`) with required frontmatter
- `scripts/lint-plan-frontmatter.ts` — checks new plans have `status:` field; pre-commit advisory
- `scripts/plan-archive.ts` — moves plans matching (`status: implementation-log` AND age >90d), or untagged-and-superseded-by-merged-PR, into `Docs/plans/archive/YYYY-MM/`. Updates internal links via simple regex pass.
- One-time archive sweep: identify plans whose Linear ticket is `Done` and merge >90d ago, batch-move to archive. Likely 200+ plans; needs user-verdict on the sweep criterion before running.
- Decision rule: if a plan is referenced by a Canon page, it stays in `Docs/plans/`; otherwise it is eligible for archive.

**Effort:** CC pickup, ~1 day. Most of it is the script + verification. The sweep itself is git-mv batches.

**Done when:** `Docs/plans/` (excluding `encounters/` and `archive/`) holds <100 files and every file has frontmatter.

### Phase 4 — Drift detection wired into weekly scan (Codex)

**What:** the three new drift signals become weekly Linear issues.

**Deliverables:**
- `scripts/drift-scan/lint-ul-vs-systems.ts` — extract UL terms, scan vault Systems pages, emit findings
- `scripts/drift-scan/lint-rejected-approaches.ts` — scan Docs/plans + Systems for ❌-listed terms not tombstoned
- `scripts/drift-scan/lint-untagged-plans.ts` — scan plans without frontmatter status (post-Phase 3, this should always be empty in the current set)
- Wire into `.github/workflows/drift-scan.yml` (existing weekly job)
- Each lint emits `drift-scan`-labeled Linear issues per finding

**Effort:** Codex pickup, ~1 day. Pattern matches existing drift signals.

**Done when:** the next weekly drift scan produces a Linear issue per genuine drift, and the user can verdict each issue without re-reading the vision-audit-style 12-file synthesis.

### Phase 5 — Vault stale-page audit (CC, manual sweep)

**What:** one-time vault audit to tombstone stale Systems pages.

**Deliverables:**
- Audit pass over Obsidian `Systems/` (~96 pages) flagging:
  - Pages naming Rejected Approaches as if current (e.g. `Agent Wheel.md`)
  - Pages with frontmatter `status: stub` or `draft` >90 days old
  - Pages whose terminology contradicts UL
- For each: tombstone with a one-line "Deprecated 2026-05-XX, see [current]" stub, OR mark `status: deprecated` in frontmatter, OR update against UL (depending on whether the user wants to preserve the page as historical reference).
- User verdict required for the Domain Word Scales / 9-reaches-vs-8 question before this phase can complete — this is a UL-vs-Systems conflict that needs a *substantive* answer, not just a process answer.

**Effort:** ~half a day in CC, but blocked on the Domain Word Scales user verdict.

**Done when:** vault audit list closes; every page on the audit list either has a tombstone or is verified clean.

---

## 5. Three-pillar adaptation

This is a process plan, not a game feature. The Three-Pillar Rule (Engine / Content / UI) does not apply directly. Adapted check:

| Pillar | Coverage |
|---|---|
| **Engine** | N/A — no game engine changes. **Tooling:** three lint scripts (`lint-ul-vs-systems`, `lint-rejected-approaches`, `lint-untagged-plans`), one archive script (`plan-archive.ts`), one staleness check (`check:canon-staleness`). All advisory in v1; can flip to blocking later. |
| **Content** | **Primary pillar.** Canon pages are author-facing reference content. New convention for plan-doc frontmatter. New convention for archive lifecycle. |
| **UI** | N/A — no in-game UI. Author-facing markdown only. |

**Three-Surface check (the analogous version for documentation):**

| Surface | Touched | How |
|---|---|---|
| Repo (`Docs/`) | YES | New `Docs/canon/` directory; updated `documentation-ownership.md`, `CLAUDE.md`; archive sweep |
| Obsidian vault | YES | Phase 5 stale-page audit; ongoing UL-vs-Systems lint |
| Linear | YES | 5 child issues spawned; `drift-scan`-labeled issues generated weekly going forward |
| Skills | YES | Phase 2 wires `encounter-pipeline` (and follow-ons) to load Canon page first |

---

## 6. Wiring section

For each new module, where it plugs in:

| Module | Lives in | Called by | Reads from | Writes to |
|---|---|---|---|---|
| `Docs/canon/<domain>.md` | `Docs/canon/` | Authoring skills (Step 0) | UL shards, Plans (proposal/canon), CLAUDE.md, Obsidian Systems | Nothing — read-only reference |
| `_template.md` | `Docs/plans/_template.md` | Cowork when authoring new plan | n/a | n/a |
| `lint-plan-frontmatter.ts` | `scripts/` | Pre-commit hook (advisory), CI | `Docs/plans/*.md` | stdout / GitHub Action annotation |
| `plan-archive.ts` | `scripts/` | Manual; user-runs once for sweep, then ad-hoc | `Docs/plans/*.md` (frontmatter) | `Docs/plans/archive/YYYY-MM/` (git-mv) |
| `check:canon-staleness` | `scripts/` | npm script, CI advisory | `Docs/canon/*.md` (last_reviewed), referenced plans (mtime) | stdout |
| `lint-ul-vs-systems.ts` | `scripts/drift-scan/` | Weekly drift scan | UL shards, Obsidian `Systems/` (vault path) | Linear issues (`drift-scan` label) |
| `lint-rejected-approaches.ts` | `scripts/drift-scan/` | Weekly drift scan | CLAUDE.md (Rejected Approaches), `Docs/plans/`, `Systems/` | Linear issues |
| `update-canon` (skill) | `.claude/skills/update-canon/` | Manual; called at closeout when a plan moves to `canon` or `implementation-log` | Closing plan, target Canon page | Updated `Docs/canon/<domain>.md` |

---

## 7. Constants table

The frontmatter status enum is the only constant introduced by this plan.

| Constant | Default | Purpose |
|---|---|---|
| `STATUS_VALUES` | `['proposal', 'current', 'implementation-log', 'superseded', 'historical']` | Plan lifecycle states |
| `ARCHIVE_AGE_DAYS` | `90` | Implementation-log plans older than this are archive-eligible |
| `CANON_REVIEW_DAYS` | `60` | Canon pages older than this trigger `check:canon-staleness` warning |
| `CANON_DOMAINS_PHASE_1` | `['encounters']` | First domain to bootstrap; expansion via follow-on tickets |
| `CANON_DOMAINS_TARGET` | `['encounters', 'attachments', 'prose', 'hex-map', 'agents', 'cosmology', 'engine', 'process']` | Eventual full set (8 Canon pages) |

---

## 8. Tracing

Drift signals emit structured Linear issues. Trace category: `drift-scan`. Per-issue fields:

```typescript
interface DriftScanIssue {
  signal: 'ul-vs-systems' | 'rejected-approaches' | 'untagged-plans' | 'canon-staleness';
  source: string;          // file path of the offending content
  line?: number;           // line number when applicable
  evidence: string;        // the offending text snippet
  expected: string;        // what the canon says
  recommended_action: 'tombstone' | 'update-page' | 'add-frontmatter' | 'review-canon-page';
  related_canon_page?: string;
}
```

These trace types compose with the existing weekly retrospective skill — the retro reads `drift-scan`-labeled issues as Step 0 (per CLAUDE.md), so this plan's signals integrate without a separate workflow.

---

## 9. Fail-soft

| Failure mode | Behavior |
|---|---|
| Canon page goes stale (last_reviewed >60 days, source plan changed) | `check:canon-staleness` warns; does not block CI in v1 |
| Authoring skill loads Canon page that 404s | Skill falls back to existing pre-read list (current behavior); logs missing Canon page as drift signal |
| Plan archive script can't find frontmatter | Skip the file, emit warning; never auto-archives untagged content |
| UL-vs-Systems lint produces noisy false positives | Findings are Linear issues, not blocking errors; user can dismiss with a label |
| Domain Word Scales user verdict pending (Phase 5 blocker) | Phase 5 pauses; Phases 1–4 proceed independently |
| `update-canon` skill called on a plan with unknown domain | Skill prompts for domain via AskUserQuestion; does not silently route to default |

---

## 10. Rejected alternatives

### 10.1 Reorganize `Docs/plans/` into topic-organized subdirectories
*Considered:* `Docs/plans/encounters/`, `Docs/plans/agents/`, `Docs/plans/prose/`, etc.
*Rejected:* breaks every existing link in CLAUDE.md, skills, and inter-plan references. Frontmatter `domain:` field gives the same query power without the move cost. (Note: `Docs/plans/encounters/` already exists as encounter-pipeline output, which is a different concern.)

### 10.2 Single mega-canon document covering all domains
*Considered:* `Docs/CANON.md` — one file, all domains.
*Rejected:* fails for the same reason `2026-04-16-systemic-wiring-guide.md` (27k tokens) failed — too large, agents skim. Per-domain pages are loaded on demand and are individually small.

### 10.3 Bake canon into UL itself
*Considered:* extend UL with current-spec sections per domain.
*Rejected:* UL is terminology, not navigation. Extending it muddies its strong "definition only" identity. Canon pages link to UL; they do not duplicate UL.

### 10.4 LLM-generated canon page from current state on every read
*Considered:* skill that reads recent plans + UL + Systems and synthesizes a canon page on the fly.
*Rejected:* defeats the purpose. The point of a Canon page is **stability** — a known artifact that the user has reviewed. Generation-on-read produces a different canon every session, and drift detection becomes impossible because there's no fixed thing to drift from.

### 10.5 Strict frontmatter required on all 396 existing plans (big-bang retrofit)
*Considered:* require `status:` on every plan in one sweep before turning on the lint.
*Rejected:* high effort with low marginal value. Most archive-bound plans are already untouched. Phase 3's "tag-on-touch" plus the archive sweep covers the same ground without the bulk effort.

### 10.6 Canon pages owned by the user, not Cowork
*Considered:* user is the only writer of Canon pages.
*Rejected:* Cowork can draft a Canon page from current state and ask the user to verdict; that's much cheaper than user-only authorship. Cowork-drafted, user-verdicted is the right division — same as plan docs.

---

## 11. NFP Compliance

| NFP | Compliance | Note |
|---|---|---|
| 1. Tunability | PASS | The frontmatter status enum, archive age, and review staleness are all named constants in §7. Behavior changes by editing one of those values, not by rewriting logic. |
| 2. Inspectability | PASS | Every drift detection emits a Linear issue with structured fields (§8). Canon pages are short, scannable, and human-readable. The forensic-audit pattern the user runs today becomes a structured signal. |
| 3. Determinism | PASS | All scripts are deterministic over input (frontmatter, UL shard contents, file mtime). No stochastic logic. |
| 4. Fail-soft | PASS | Every failure mode has a defined fallback (§9). Linting is advisory in v1; can flip to blocking later if patterns prove stable. |
| 5. Narrative | PASS with note | This is a process plan, not a player-facing system. The "narrative win" here is meta: making the *story of the project's design history* legible rather than buried. |
| 6. Additive over destructive | PASS | New `Docs/canon/` directory; new frontmatter (additive on existing plans, retrofit-on-touch only); existing files keep working. The archive sweep is the one move-heavy operation, and it's git-mv (reversible). |
| 7. Performance budget | PASS | Lint scripts run weekly, not per-tick. Canon pages are ≤200 lines, sub-second to load. No engine performance impact. |

---

## 12. Vision audit

Does this plan contradict any premise in `Vision/`?

The Vision documents (`00-north-star.md`, `01-core-loop.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `taste-profile.md`) speak to the player experience and the game's design philosophy. They do not speak to documentation strategy.

**Verdict: Vision audit not applicable.** No premise touched, no premise contradicted. This plan operates entirely in the process / meta layer.

(The taste-profile principle of *"every design decision should be load-bearing, never ornamental"* arguably applies to documentation too — the Canon page format is deliberately spartan because of this principle. But that is a stylistic echo, not a Vision invocation.)

---

## 13. Linear handoff

**Parent issue:** TBD — Cowork creates on user approval. Title: *"Canonical documentation strategy — three-layer model"*. Project: Continuous Improvement (or new project, user verdict).

**Children (5 issues):**

1. **Phase 1 — Establish Canon convention + bootstrap encounters Canon page** — Cowork. No code. Outputs: `Docs/canon/README.md`, `Docs/canon/encounters.md`, `documentation-ownership.md` edit, `CLAUDE.md` edit. Apply `plan-pending-commit` label after writing.
2. **Phase 2a — Wire encounter-pipeline skill to Canon page** — Codex. Mechanical SKILL.md edits. `Suggested model: sonnet`. Parallel-safe with Phase 3, 4. Mutex with skill-tree changes from other tickets.

**Companion UL-proposal:** Phase 1 should also file a `UL-proposal` Linear issue to add a Process-shard term: **"Domain Canon Page"** with definition pointing at the new convention. UL is the terminology authority — adding a new convention without updating UL would itself be the kind of drift this plan exists to prevent.
3. **Phase 3 — Frontmatter convention + plan archive sweep** — CC. Judgment call on archive criteria; `Suggested model: sonnet`. Parallel-safe with Phase 2a, 4. Mutex with anything moving plan files.
4. **Phase 4 — Drift detection scripts + weekly scan wiring** — Codex. Pattern-matching the existing drift-scan signals. `Suggested model: sonnet`. Parallel-safe with Phase 2a, 3.
5. **Phase 5 — Vault stale-page audit** — CC. Blocked on user verdict for Domain Word Scales / 9-reaches question. `Suggested model: sonnet`. Mutex with anything else editing vault Systems pages.

**Handoff comment template** (for each child issue): includes Suggested model, Parallel-safe with, Mutex with lines per the coordination block protocol.

---

## 14. User verdicts (resolved 2026-05-05)

1. **Canon page directory location:** `Docs/canon/` — confirmed.
2. **Domain Word Scales — 9 reaches with Flesh, or 8 Reaches + Quintessence?** — confirmed: **8 Reaches + Quintessence as a meta-property.** Quintessence is *integrity of self / presence in the story / threadbare-ness* — high quintessence = sovereign, central, hard to manipulate; low quintessence = thinning confidence, easier indirect manipulation, story exit risk. NOT about flesh, biology, or dying. The deprecated Flesh Reach was an old-school D&D-flavored framing replaced by this more abstract, narrative-driven meta-axis.

**Canonical source of the iteration:** `Obsidian → TheFantasyWorldSimulator/Brainstorms/brainstorm-cosmological-symmetry.md` (2026-03-28 session, Spliid + Claude). Implementation plan: `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md` (TB-075).

**Status of TB-075:** Phase 1 shipped (code: `src/engine/cosmology.ts` confirms 8 reaches and Flesh→Quintessence migration). **Phases 4–5 (documentation + vault propagation) never landed**, which is the *root cause of the encounter-authoring drift this strategy plan exists to address*. Companion audit: `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md` enumerates every stale doc surface, ranked by impact.

**Phase 5 of this plan now has a concrete first deliverable:** complete TB-075's documentation phases. The audit doc is the input list. The user-verdicted Quintessence framing (above) is the substantive answer Phase 5 was waiting on.

---

## 15. Brainstorm companion

Companion document: `2026-05-05-canonical-documentation-strategy-brainstorm.md`. Captures considered alternatives in fuller detail, tensions surfaced, and the question pile that fell out of the audit.
