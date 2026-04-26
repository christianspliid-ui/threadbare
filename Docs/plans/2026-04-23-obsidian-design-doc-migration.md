# Obsidian Design-Doc Migration

**Date:** 2026-04-23
**Status:** **Parked (2026-04-23)** — documented idea, design, and value assessment preserved. Linear project "Plan Cross-Linking Infrastructure" created in Idea state (no tickets filed). To be revisited at a later date; no work starts until the project is pulled out of Idea and a prereq ticket is filed.
**Owner:** Cowork (design/planning); no executor assigned while parked
**Revision:** v3 (2026-04-23) — parked with value assessment (§17). v2 folded in reviewer findings + council decisions (§16). v1 was the initial design.
**Companion brainstorm:** Not required — this is documentation infrastructure, no Vision premise challenged. One design tension surfaced inline (see §2).

> **Summary.** Migrate `Docs/plans/` (**471 design docs**) into the existing Obsidian vault so connections between design decisions and implementations become navigable via graph view, backlinks, and Bases. The corpus is **power-law shaped**: an estimated **~20–40 hub plans** carry most cross-references; the remaining **~430+ are long-tail deltas** that only warrant frontmatter-only stubs. `Vision/` already lives inside the vault — only cross-links are added. Repo stays canonical for design rationale per `Docs/documentation-ownership.md`. Pilot **6 plans** (3 hubs, 1 supersedes, 2 long-tail) end-to-end against a concrete **5-query benchmark**; if it fails, delete the new vault folders and nothing is lost.

---

## 1. Goals and Non-Goals

### Goals

- **See connections.** Graph view and backlinks surface which plans touch the same decisions, invoke the same NFPs, or re-contest the same rejected approaches.
- **Answer "where has this been considered before?"** from the vault in under the time it takes to grep the corpus — *and* surface at least one result grep couldn't (the connection-discovery claim; measurable in §5).
- **Keep repo as source of truth.** No duplication of rationale. Vault pages link to `Docs/plans/*.md` for the full text and own only genuinely connective metadata.
- **Low ongoing cost.** A new plan in `Docs/plans/` gets its mirror created by the plan's author (Cowork at handoff) in ≤5 minutes via a template.

### Non-Goals

- **Not rewriting plans.** Every plan's content stays where it is.
- **Not replacing Linear.** Linear remains issue-tracking source of truth; vault pages reference Linear IDs but don't mirror issue state.
- **Not a Vision rewrite.** `Vision/` already lives inside the vault; we only add backlinks to it.
- **Not retrofitting the long tail.** ~80%+ of plans are narrow per-THR deltas. Those get mirrored on-reference, never bulk-backfilled.
- **Not a `world-model.json` touchpoint.** The `generate-vault` script mapping stays unchanged — but we document the boundary so it doesn't clobber new folders (see §6.5).

---

## 2. Background and Constraints

### What's in scope (re-baselined)

| Source | Count | Location | Migration action |
|---|---|---|---|
| Design plans (markdown) | **471** | `Docs/plans/YYYY-MM-DD-*.md` | Mirror page in vault `Plans/`; concept extraction for hubs only |
| Operational docs | 2 | `Docs/plans/cowork-session-start-prompt.md`, `wiring-checklist.md` | Frontmatter-only mirror; tag `process` not `design` |
| HTML exports | 2 | `Docs/plans/*.html` | **Out of scope** — deliverable artifacts |
| Vision | already vault-resident | `TheFantasyWorldSimulator/Vision/` | No migration; receives backlinks from `Plans/` pages |

### Corpus shape (power law)

Sampling real plans in the corpus revealed a strong power-law distribution:

- **Hub plans (~20–40):** Dense cross-references, name load-bearing decisions, cited by many sibling plans. Examples: `2026-04-16-systemic-wiring-guide.md`, `2026-04-13-linear-coordination-protocol.md`, `2026-04-16-game-design-direction.md`. These warrant full concept extraction.
- **Long-tail plans (~430+):** Narrow per-THR implementation deltas, encounter migrations, bug-fix designs. Their durable connections are 1–3 wikilinks and a sibling-plan backlink list — all already recoverable by grepping `Docs/plans/`. These get **frontmatter-only stubs**, not concept extraction.

**This shape drives every scoping decision downstream.** Pilot selection tests both archetypes; active backfill targets only hubs; long-tail migrates opportunistically when a new plan cites it.

### Ownership constraint (non-negotiable)

Per `Docs/documentation-ownership.md`: design plans are repo-canonical. Vault pages contain frontmatter, a one-paragraph summary blockquote (written fresh for the vault, ≤80 words), wikilinks to concepts, and a link to the canonical repo doc. **Full rationale stays in `Docs/plans/`.** Narrowing frontmatter to truly connective fields (tags, wikilinks, canonical path) avoids duplicating facts like `status` or `plan-date` that would otherwise drift.

### Systems/ ownership (locked)

`Systems/` is hand-curated domain-model content. **`Plans/` pages wikilink to Systems but never create them.** If a plan references a System with no corresponding page, `vault-lint` emits a warning; the gap is filled by hand-authoring a proper Systems page from domain-model perspective, not by plan-author stubs. This preserves the ownership boundary `Docs/documentation-ownership.md` establishes.

### Vault-ingest conventions

Existing vault skills (`vault-ingest`, `vault-query`, `vault-lint`, `vault-enrich`) expect YAML frontmatter, blockquote summary, wikilinks, and atomic `Index.md` + `log.md` updates. **The novel frontmatter fields this plan introduces (`canonical`, `pillars`, `linear-issues`) require skill extensions before pilot — see §7 and the prereq ticket in §14.**

### Current vault topology (at migration start)

```
TheFantasyWorldSimulator/          (vault root = repo root)
├── Cosmology/         (12 pages)
├── Domains/Reaches/   (9 pages)
├── Actions/           (36 pages)
├── Actors/ Magic/ Locations/ Terrain/ Cultures/ Traits/ Relationships/ Assets/
├── Systems/           (existing, sparse — HAND-CURATED ONLY, no plan-author stubs)
├── Vision/            (existing — will receive backlinks)
├── Brainstorms/       (existing — companion pattern, see §6.5)
├── Index.md
└── log.md
```

### Design tension (surfaced, not resolved)

**Thin mirror vs. first-class page.** Thin mirrors with narrow frontmatter + aggressive concept extraction on hubs is the chosen approach. The alternative — full plan content in vault pages — was rejected because it violates the ownership rule and creates sync hell. The chosen approach accepts a shallow-per-page graph in exchange for dense concept-page backlinks. If this underperforms in the pilot benchmark (§5), the fallback is to enrich hub pages with more structured metadata, not to duplicate plan content.

---

## 3. Target Architecture

### New vault folders (two, not five)

| Folder | What lives there | Example pages |
|---|---|---|
| **`Plans/`** | One page per `Docs/plans/*.md`. Filename mirrors the doc's filename (sans `.md`). Hub plans get concept-extraction; long-tail plans are frontmatter-only. | `2026-04-13-linear-coordination-protocol.md`, `2026-04-16-systemic-wiring-guide.md` |
| **`Decisions/`** | One page per load-bearing architectural decision from CLAUDE.md's "Load-Bearing Architectural Decisions" section, plus any plan-introduced decisions meeting the extraction threshold. Each page has a short "why load-bearing" body. | `Everything is a graph node or edge.md`, `Reaches and Spheres are orthogonal.md`, `Turn-based over real-time.md` |
| **`Rejected/`** | One page per entry in CLAUDE.md's "Rejected Approaches" section, plus any plan-rejected alternatives meeting the extraction threshold. Each page has a short "why rejected" body. | `Classical stats STR DEX INT.md`, `Intervention wheel AgentWheel.md`, `R3F for hex map.md` |

### Catalog pages (not folders — tags instead)

Per council decision Q3: NFPs and Pillars are **tags + single catalog pages at vault root**, not folders.

| Catalog page | Tags it indexes | Purpose |
|---|---|---|
| `NFPs.md` | `nfp-tunability`, `nfp-inspectability`, `nfp-determinism`, `nfp-fail-soft`, `nfp-narrative-over-mechanical`, `nfp-additive`, `nfp-performance` | Shows which plans/decisions invoke each NFP via Obsidian tag pages |
| `Pillars.md` | `pillar-engine`, `pillar-content`, `pillar-ui`, `pillar-infra` | Shows which plans touch each pillar |

Obsidian's built-in tag pages provide the backlink view; no custom folder needed.

### `Plans/` page schema (narrowed — connective fields only)

Per reviewer finding #6 and council decision Q4: frontmatter holds only fields that don't live in the canonical plan or Linear.

```yaml
---
tags: [plan, pillar-engine, pillar-content, nfp-inspectability, system-encounters]
canonical: ../Docs/plans/2026-04-13-linear-coordination-protocol.md
aliases: [linear-coordination-protocol]
---

> **Summary.** One-paragraph fresh-written gloss (≤80 words).

**Canonical doc:** [[../Docs/plans/2026-04-13-linear-coordination-protocol|Full plan (repo)]]

## Key Decisions Made
- [[Everything is a graph node or edge]]

## Rejected Alternatives
- [[Intervention wheel AgentWheel]]

## Systems Referenced
- [[Systems/Encounter pipeline]]   <!-- WIKILINK ONLY; page hand-curated elsewhere -->

## Related Plans
- [[2026-04-16-systemic-wiring-guide]]
- [[2026-04-13-definition-of-done-hooks-design]]

## Supersedes / Superseded-By
- Supersedes: [[2026-03-15-earlier-coordination-attempt]]    <!-- omit section if none -->

## Vision Backlinks
- [[Vision/non-negotiables]]
```

**Fields deliberately NOT in frontmatter** (reviewer finding #6): `plan-date` (parse from filename), `status` (read from the canonical plan doc's own header), `linear-issues` (read from Linear by THR-XX citations in body), `pillars` (expressed as tags, not a separate field). Duplicating these would create the sync hell the ownership rule is trying to prevent.

### `Decisions/` page schema

```yaml
---
tags: [decision, load-bearing, architecture]
aliases: [graph-everything]
status: active                 # active | pressure-noted | superseded
introduced-in: [[2026-02-15-initial-graph-architecture]]
---

> **Rule.** Everything is a graph node or edge. No separate relational tables.

**Why it's load-bearing.** 2–3 sentences on what breaks if revisited casually. Explicit, so the rule can be evaluated against new pressure without rehashing first-principles.

**Plans invoking or reaffirming this:** (backlinks surface automatically)
```

Note on `status: pressure-noted` (reviewer nitpick #9): CLAUDE.md is explicit that load-bearing decisions are "settled — do not revisit." The prior draft's `under-review` flag implicitly invited what the doctrine forbids. **`pressure-noted`** is gated to Cowork only, requires an open plan explicitly contesting the decision, and carries no implication that revisit is appropriate — it's an observability signal, not an invitation.

### `Rejected/` page schema

```yaml
---
tags: [rejected, anti-pattern]
aliases: [agent-wheel]
replaced-by: [[ActionDrawer with context-filtered cards]]
rejected-in: [[YYYY-MM-DD-plan-that-rejected-it]]
---

> **Rejected approach.** Intervention wheel (AgentWheel) — replaced by ActionDrawer with context-filtered cards via Generalized Action Targeting.

**Why rejected.** 2–3 sentences on the failure mode. Written so future agents tempted to reintroduce the pattern read this page first.

**What replaces it:** [[ActionDrawer with context-filtered cards]]
```

---

## 4. Concept Extraction Strategy

For **hub plans only**, the author walks the plan and creates or links concept pages. For **long-tail plans**, skip concept extraction — mirror page gets frontmatter + summary + canonical link + Related Plans section only.

| Concept type | Hub behavior | Long-tail behavior |
|---|---|---|
| Load-bearing decision | Extract to `Decisions/` if ≥2 plans cite it OR it appears in CLAUDE.md's load-bearing list | Leave in plan body; no extraction |
| Rejected alternative | Extract to `Rejected/` if ≥2 plans reject it OR it appears in CLAUDE.md's rejected list | Leave in plan body; no extraction |
| System referenced | Wikilink to existing `Systems/` page; if missing, `vault-lint` emits warning (never auto-create stubs) | Wikilink only |
| NFP invoked | Add `nfp-*` tag; no separate page | Add tag if obvious; otherwise skip |
| Pillar | Add `pillar-*` tag | Add `pillar-*` tag |
| Vision reference | Wikilink to existing `Vision/*.md` | Wikilink if cited |
| Linear issue | Cite THR-XX in body (no vault page) | Cite THR-XX in body |

**Threshold rule:** A concept graduates to its own page when referenced by ≥2 plans *or* listed explicitly in CLAUDE.md's load-bearing/rejected sections. Below the threshold, it stays in the plan body.

---

## 5. Pilot Phase

### Six pilot plans (test both archetypes)

Per council decision Q2: pilot covers six plans testing hub behavior, supersedes edges, and long-tail behavior with red-link potential.

| # | Plan | Archetype | What it validates |
|---|---|---|---|
| 1 | `2026-04-16-systemic-wiring-guide.md` | **Hub** — dense cross-refs | Concept extraction at scale; references existing `Systems/` |
| 2 | `2026-04-13-linear-coordination-protocol.md` | **Hub** — process/infra | Non-game-feature plan in schema (pillars=infra) |
| 3 | `2026-04-16-game-design-direction.md` | **Hub** — top-level vision | Vision/ backlinks; how pillar-spanning plans behave |
| 4 | `2026-04-06-meet-the-first-redesign.md` | **Supersedes-test** | Rejected-alternative extraction; `supersedes`/`superseded-by` edges |
| 5 | `2026-04-17-thr-132-mark-reveal-prose.md` | **Long-tail** (content) | Frontmatter-only mirror path |
| 6 | `2026-04-17-phase-0-group-c-world-shaping-aftermath.md` | **Long-tail with sibling refs** | Red-link handling when sibling plans cited but not yet mirrored |

### Pilot exit criterion (concrete, testable)

Per reviewer finding #3 and council decision: replace "faster than grep" with a **five-query benchmark**.

For each query, measure wall-clock time for grep-against-repo vs. vault-browse, and also check whether the vault surfaces a result grep couldn't.

| # | Query | How to grep | Vault path |
|---|---|---|---|
| 1 | "Every plan touching the turn-based decision" | `rg -l "turn-based" Docs/plans/` | Open `Decisions/Turn-based over real-time.md`; read backlinks |
| 2 | "Every plan that invoked the Inspectability NFP" | `rg -l "Inspectability" Docs/plans/` | Click `nfp-inspectability` tag; read plan list |
| 3 | "Every plan that superseded a prior plan" | `rg -l "supersedes:" Docs/plans/` (may return zero; frontmatter not present in repo docs) | Bases view filtered by `status: superseded` |
| 4 | "What rejected approach does ActionDrawer replace?" | `rg -B2 -A2 "ActionDrawer" Docs/plans/` — human scans | Open `Rejected/Intervention wheel AgentWheel.md`; read `replaced-by` |
| 5 | "Which plans contest the 'everything is a graph' decision?" | `rg -l "graph node or edge" Docs/plans/` — noisy, false positives | `Decisions/Everything is a graph node or edge.md` with `status: pressure-noted` filter |

**Pass criteria:**
- Vault-browse completes in **equal or faster** wall-clock time than grep on ≥3 of 5 queries.
- Vault surfaces **at least one result on ≥2 queries** that grep didn't (e.g., query 3 where frontmatter isn't in repo docs, query 4 where the connection requires Rejected-page context grep can't express).
- Both pilot authors agree the vault view was more trustworthy on ≥2 queries (subjective but recorded).

If the pilot fails the benchmark, delete `Plans/`, `Decisions/`, `Rejected/` folders and the two catalog pages — no repo docs were touched.

### Full pilot exit checklist

- [ ] Prereq ticket (skill extensions + template) complete
- [ ] 6 `Plans/` pages created, all pass `vault-lint` with zero errors
- [ ] Every load-bearing decision in CLAUDE.md has a `Decisions/` page (one-time setup)
- [ ] Every rejected approach in CLAUDE.md has a `Rejected/` page (one-time setup)
- [ ] `NFPs.md` and `Pillars.md` catalog pages created
- [ ] `Index.md` updated with new folders and catalog pages
- [ ] `log.md` has one entry per ingested page
- [ ] 5-query benchmark executed, results recorded
- [ ] Pass criteria met per above
- [ ] Retrospective captured: what took longer than expected, which schema fields were unused, which connections were missing

---

## 6. Full Migration (post-pilot)

Only after user signs off on pilot results:

### Phase A — Hub backfill (active)

1. **Citation-count pass.** Short script (`scripts/count-plan-citations.ts`, ~30 lines) greps each plan filename against every other plan, outputs ranked list. Hubs = plans cited by ≥3 others.
2. **Backfill hubs in batches of ~10 plans** per Linear issue (revised down from prior 35 per reviewer finding #7 — merge conflicts on `Index.md`/`log.md` make larger batches unsafe).
3. **Batches are serialized** (Mutex with each other) — one hub-backfill issue In Dev at a time. Parallel work happens on other non-migration issues.
4. Output of citation-count is published at `Plans/_hub-list.md` so visibility is maintained on what's been backfilled and what's pending.

### Phase B — Long-tail migration (opportunistic only)

- No bulk migration. The long tail migrates **on-reference**: when a new plan's mirror page needs to wikilink to an un-mirrored plan, the new plan's author creates a **stub mirror** for the referenced plan (frontmatter + canonical link only — no concept extraction, no summary).
- This cost is added to the Definition of Done (§8) so it's explicit, not a surprise.
- Long-tail plans that never get cited never get mirrored. That's fine — they weren't carrying connection value anyway.

### Operational docs

`cowork-session-start-prompt.md` and `wiring-checklist.md` — frontmatter-only mirror, tagged `process` not `design`, so pillar/NFP tags don't apply.

---

## 6.5. Interactions With Existing Vault Infrastructure

Added per reviewer finding #5.

### `Brainstorms/`

- Brainstorms are companion artifacts to plans per the `game-design-direction` skill, and per user memory: every brainstorm must have a corresponding backlog entry.
- **Plan mirror pages backlink to their companion Brainstorm** via a `## Companion Brainstorm` section (wikilink only, no duplication).
- Brainstorms do **not** get their own frontmatter schema change — existing conventions apply.
- When no companion brainstorm exists (e.g., this plan), the section is omitted.

### `generate-vault` script

- The script currently maps `world-model.json` entities to vault folders (Cosmology, Traits, Actions, Domains, Magic, etc.) via `CATEGORY_FOLDER_MAP`.
- **It must NOT touch `Plans/`, `Decisions/`, `Rejected/`, `Index.md`, or `log.md`.**
- Concrete action: verify the current script's write targets, and add an explicit carve-out (e.g., a `PROTECTED_FOLDERS` constant) if any existing mapping overlaps. File as part of the prereq ticket.

### `vault-ingest`, `vault-lint`, `vault-enrich`, `vault-query`

- Skill extensions required before pilot (see §7 and prereq ticket in §14):
  - `vault-ingest` accepts the new `Plans/`, `Decisions/`, `Rejected/` page schemas.
  - `vault-lint` enforces: `canonical` frontmatter points to an existing `Docs/plans/*.md` file; `Plans/` wikilinks to `Systems/` targets that exist (or warns if not); no two plans claim to supersede the same predecessor; orphan concept pages older than 30 days get a warning.
  - `vault-enrich` unchanged (no migration interaction).
  - `vault-query` unchanged — benefits automatically from new concept folders.

---

## 7. Tooling

### Pilot-blocking prereqs (single Linear ticket)

Per council decision Q4 and reviewer finding #8/#10:

1. **Skill extensions.** `vault-ingest` accepts new schemas; `vault-lint` enforces the checks listed in §6.5. Without these the pilot's own exit criterion ("zero lint errors") is unenforceable.
2. **Mirror-page template.** `.vault-templates/plan-mirror.md` committed. The template encodes the narrowed frontmatter schema and section headers so 6 hand-authored pages don't drift on conventions.
3. **`generate-vault` carve-out.** Audit script's write targets; add `PROTECTED_FOLDERS` if needed.

### During pilot

- Template-assisted manual authoring (no script). Schema may still shift based on pilot findings; building a script before the schema stabilizes wastes the script.

### Post-pilot tooling

- **`scripts/mirror-plan.ts`** — scaffolder for new plans. `npm run mirror-plan -- <filename>` emits a scaffolded page using the template. Built only after pilot validates schema.
- **`scripts/count-plan-citations.ts`** — produces the hub list for Phase A backfill (§6). ~30 lines; built as first task of post-pilot work.
- **Bases views (deferred)** — `Plans by pillar.base`, `Plans by status.base`, `Decisions by pressure.base`. Nice-to-have; build if pilot reveals demand.
- **Auto-link harvester (deferred)** — scan plan bodies for sibling-plan citations, prepopulate `Related Plans`. Low cost, high signal, but not worth building until corpus is large enough.

### What NOT to build

- Full bidirectional sync between repo plan doc and vault mirror page. The narrowed frontmatter schema (§3) makes this unnecessary.
- Auto-generated summaries. Machine-extracted summaries would drift from the plan's actual thesis and mislead graph readers.

---

## 8. Maintenance Model (post-pilot)

### New plan authored (in Docs/plans/)

Added to the Definition of Done in CLAUDE.md:

- [ ] **Cowork creates the mirror page** (per reviewer nitpick #11 — pinned to one agent). Cowork authors the plan in `Docs/plans/` and the vault mirror in `Plans/` in the same pass. CC does not create or update mirror pages at merge time.
- [ ] Summary (≤80 words) written fresh for the vault
- [ ] Wikilinks added: Decisions (existing or new, per threshold), Rejected (same), Systems (wikilink-only, never create), Vision, Related Plans, Companion Brainstorm if any
- [ ] Tags added: `pillar-*`, `nfp-*` where obvious
- [ ] If this plan wikilinks to an un-mirrored plan, **stub mirror for the referenced plan** created in the same pass (frontmatter + canonical link)
- [ ] `Index.md` and `log.md` updated per `vault-ingest` conventions
- [ ] `vault-lint` run; zero errors

### Plan superseded

- Source plan's mirror: add `## Supersedes / Superseded-By` with `superseded-by: [[new-plan]]` line.
- New plan's mirror: add `supersedes: [[old-plan]]` line.
- If a `Decisions/` or `Rejected/` page is affected, author updates its body.

### Decision under pressure

- When a new plan actively contests a load-bearing decision, Cowork flips the `Decisions/` page's status to **`pressure-noted`** (not `under-review` — per reviewer nitpick #9).
- **Gate:** only Cowork may flip this, and only with a specific new-pressure plan in flight. CC and Codex must not flip this flag.
- On plan close: either flip back to `active` (decision held) or to `superseded` (decision replaced, new Decisions page created).
- **`pressure-noted` is an observability signal, not an invitation to revisit.** CLAUDE.md's "settled — do not revisit" stance remains in force.

---

## 9. Three-Pillar Applicability

This plan addresses **infrastructure / documentation tooling**, not a game feature. Engine/Content/UI three-pillar rule is **N/A with rationale**:

- **No Engine pillar:** no tick phases, no graph ops, no PRNG.
- **No Content pillar:** no encounter templates, no prose tables, no attachment content.
- **No UI pillar:** no player-facing views. Obsidian is a developer-facing tool, not a game UI.

The plan has a **docs/process pillar** (tag: `pillar-infra`): vault-ingest conventions, Definition of Done updates, Linear coordination, wiring to `Docs/documentation-ownership.md`. Addressed in §6–§8.

---

## 10. NFP Audit

| NFP | Applies? | Treatment |
|---|---|---|
| 1. Tunability | Partial | Constants table below — pilot count, summary word cap, extraction threshold, backfill batch size all named |
| 2. Inspectability | **Central** | The whole point. 5-query benchmark measures it directly |
| 3. Determinism | Partial | Filename conventions, folder structure, frontmatter fields all explicit |
| 4. Fail-soft | Yes | Broken wikilinks caught by `vault-lint`, not runtime. §11 has the full table |
| 5. Narrative over mechanical | N/A | No game fiction |
| 6. Additive over destructive | **Critical** | Repo docs untouched. Pilot rollback = `rm -rf` new folders, no data loss |
| 7. Performance budget | Yes | ~500 pages well under Obsidian's capacity. Graph view may need tag-filters at scale |

### Constants (tunable)

| Constant | Default | Purpose |
|---|---|---|
| `PILOT_PLAN_COUNT` | 6 | Three hubs + one supersedes + two long-tail |
| `SUMMARY_WORD_CAP` | 80 | Max words for vault-side summary blockquote |
| `CONCEPT_EXTRACTION_THRESHOLD` | 2 plans | Concept graduates to own page once cited by ≥N plans or in CLAUDE.md load-bearing/rejected lists |
| `HUB_CITATION_THRESHOLD` | 3 | Plans cited by ≥N other plans qualify for active hub backfill |
| `HUB_BACKFILL_BATCH_SIZE` | ~10 plans/issue | Down from 35 in prior draft — merge-conflict safety |
| `ORPHAN_CONCEPT_PAGE_GRACE` | 30 days | How long before a concept page with zero backlinks gets a lint warning |

---

## 11. Fail-Soft Table

| Failure mode | Where | Fallback behavior |
|---|---|---|
| Mirror page's `canonical` points at missing `Docs/plans/*.md` | `vault-lint` (new rule) | Emit warning; page remains linkable, manual fix required |
| Concept page (Decisions/Rejected) has zero backlinks for >30 days | `vault-lint` (new rule) | Orphan warning; page retained (may be load-bearing even without current citations) |
| Plan mirror page missing required frontmatter (`canonical`, `tags`) | `vault-lint` (new rule) | Error; plan excluded from Bases views until fixed |
| Two plans claim to supersede the same predecessor | `vault-lint` (new rule) | Error; human resolves — likely one is partial refinement, not full replacement |
| `Plans/` page wikilinks to non-existent `Systems/` page | `vault-lint` (new rule) | Warning; do NOT auto-create stub (ownership rule) — hand-author Systems page |
| Obsidian graph view unreadable at 500+ nodes | User | Use Bases + tag pages as primary browse tools; graph view for focused cluster exploration only |
| `mirror-plan` script fails on malformed filename | Script (post-pilot) | Emit actionable error: filename must match `YYYY-MM-DD-*.md`; no partial page created |
| `generate-vault` script accidentally writes into `Plans/`/`Decisions/`/`Rejected/` | Prereq ticket | `PROTECTED_FOLDERS` carve-out prevents write |

---

## 12. Wiring and Integration Surfaces

No game-engine wiring (this is infra). Process surfaces that must update:

- [ ] **CLAUDE.md** — add Cowork mirror-page step to Definition of Done; add `Plans/`, `Decisions/`, `Rejected/`, `NFPs.md`, `Pillars.md` to vault structure description
- [ ] **`Docs/documentation-ownership.md`** — add section describing vault mirror layer and its ownership rule (link, don't duplicate; Systems/ hand-curated only)
- [ ] **`Docs/plans/wiring-checklist.md`** — add "vault mirror created" as an integration surface for design plans
- [ ] **`vault-lint` skill** — extend with `Plans/` mirror integrity checks (new rules listed in §11)
- [ ] **`vault-ingest` skill** — add plan-migration pattern as a documented ingest mode; accept new schemas
- [ ] **`.vault-templates/plan-mirror.md`** — new template (part of prereq ticket)
- [ ] **`scripts/count-plan-citations.ts`** — built first task post-pilot
- [ ] **`scripts/mirror-plan.ts`** — post-pilot tooling phase
- [ ] **`package.json`** — `npm run mirror-plan` and `npm run count-plan-citations` commands
- [ ] **`Index.md`** — add `Plans/`, `Decisions/`, `Rejected/`, `NFPs.md`, `Pillars.md` sections
- [ ] **`log.md`** — one entry per ingested page

---

## 13. (Open Questions — resolved; see §16 Decisions Log)

All §13 open questions from v1 were resolved via a design council on 2026-04-23. See §16 for the record of proposals, perspectives, refinements, and consented decisions.

---

## 14. Linear Issue Scaffold

Per council decision Q1: project **"Plan Cross-Linking Infrastructure"** created 2026-04-23 in **Idea** state. **No tickets filed while parked.** The tickets below are the intended scaffold when work is picked up; they exist only as design artifacts in this doc until the project moves out of Idea.

### Prereq ticket (must be Done before pilot)

- **Title:** `Vault skill extensions + mirror-page template (pilot prereq)`
- **Project:** Plan Cross-Linking Infrastructure
- **Labels:** `Design-Infrastructure`, `Docs`, `model:sonnet`
- **Scope:** Extend `vault-ingest` to accept new schemas; extend `vault-lint` with new rules (§11); commit `.vault-templates/plan-mirror.md`; audit `generate-vault` and add `PROTECTED_FOLDERS` carve-out if needed.
- **Done when:** New schemas ingestable; lint rules pass on a synthetic test page; template committed; `generate-vault` verified not to touch Plans/Decisions/Rejected.
- **Parallel-safe with:** most work (touches only vault skills + scripts)
- **Mutex with:** any concurrent edits to `vault-*` skills

### Pilot ticket (blocked by prereq)

- **Title:** `Obsidian migration pilot — 6 plans + 5-query benchmark`
- **Project:** Plan Cross-Linking Infrastructure
- **Labels:** `Design-Infrastructure`, `Docs`, `model:sonnet`
- **BlockedBy:** Prereq ticket above
- **Scope:** Set up Decisions/Rejected backfill from CLAUDE.md; author 6 pilot mirror pages; create NFPs.md + Pillars.md catalog pages; run 5-query benchmark; record results; write retrospective.
- **Done when:** Exit checklist (§5) complete; benchmark pass criteria met or documented failure with rollback performed.

### Post-pilot tickets (only created if pilot passes)

- `citation-count script + hub list publication`
- `hub backfill — batch 1 of N` (one ticket per ~10 plans, serialized via Mutex)
- `mirror-plan.ts scaffolder script`
- `CLAUDE.md + documentation-ownership.md Definition-of-Done update`
- `Tensions/ folder evaluation` (re-open council if pilot reveals recurring cross-plan tensions)

---

## 15. Success Criteria (6 months in)

- New plans cite `Decisions/` and `Rejected/` pages by wikilink, not by re-explaining them.
- `pressure-noted` flag has been used at least once (proving the observability signal works as intended) OR zero plans contested load-bearing decisions in the period (which is itself informative).
- At least one design session started by opening the graph view around a concept cluster rather than grepping.
- `vault-lint` reports zero orphaned `Plans/` mirror pages.
- Hub backfill is >80% complete OR consciously abandoned with rationale.
- Long-tail stub-on-reference rate is visible in `log.md` (evidence the opportunistic flow is working).

If none hold at 6 months, the migration hasn't delivered its value — change the maintenance model or accept the vault as a lightly-used archive.

---

## 16. Decisions Log (2026-04-23 design council)

Five perspectives convened: **Documentation Steward (D)**, **Vault Tooling Engineer (V)**, **Executor Agent (E)**, **Content Author (C)**, **Design Reviewer (R)**. Consent heuristic: *good enough for now, safe enough to try* — not perfection, but advance-able and cheaply reversible.

### Q1 — Linear project placement

- **Initial proposal:** New project "Design Knowledge Graph."
- **V's concern:** Name too broad; will accrete unrelated vault work and dissolve WIP limits.
- **Refinement:** Rename to scope-tight **"Plan Cross-Linking Infrastructure."**
- **Consented decision:** Create Linear project **"Plan Cross-Linking Infrastructure."**

### Q2 — Pilot plan selection

- **Initial proposal:** Five plans (3 hubs, 1 supersedes, 1 long-tail).
- **R's objection:** n=1 on long-tail is underpowered; won't surface failure modes.
- **V's addition:** Second long-tail should cite *another* long-tail so sibling-backlink + red-link behavior is tested.
- **Refinement:** Add sixth plan (`2026-04-17-phase-0-group-c-world-shaping-aftermath.md`) that cites peer THR-phase plans.
- **Consented decision:** **Six pilot plans** — 3 hubs, 1 supersedes-test, 2 long-tail (one with sibling-ref red-link potential).

### Q3 — Concept extraction folder structure

- **Initial proposal:** Five folders — `Decisions/`, `Rejected/`, `Systems/`, `NFPs/`, `Pillars/`. Also evaluated `Tensions/`, `Experiments/`.
- **C's concern:** `Systems/` must be hand-curated only; plan-author stubs corrupt the domain model (aligns with reviewer finding #4).
- **R/V's concern:** `NFPs/` and `Pillars/` pages are shallow (sentence + backlinks); folder overhead unjustified.
- **Refinement:** Two folders (`Decisions/`, `Rejected/`) with prose bodies; NFPs and Pillars become tags + single catalog pages. Systems/ stays hand-curated; plans wikilink only. Tensions/ deferred to phase 2. Experiments/ rejected (redundant with Brainstorms/).
- **Consented decision:** **Two concept folders.** NFPs/Pillars via tags + catalog pages. Tensions/ deferred. Experiments/ rejected.

### Q4 — Automation timing

- **Initial proposal:** Manual pilot; script post-pilot; vault-lint/vault-ingest extensions pilot-blocking.
- **V's concern:** 6 hand-authored pages drift on conventions without a template.
- **R's concern:** "Pilot-blocking" prereqs need a scoped ticket, not an aspiration.
- **Refinement:** Template + skill extensions + generate-vault carve-out bundled into one prereq Linear ticket. `scripts/mirror-plan.ts` stays post-pilot.
- **Consented decision:** **Template-assisted manual pilot.** Prereq ticket: skill extensions + template + generate-vault carve-out. `mirror-plan.ts` post-pilot.

### Q5 — Historical backfill scope

- **Initial proposal:** Hub-only active (~20–40 plans), long-tail opportunistic.
- **R's concern:** "Hub" undefined; need reproducible method.
- **V's addition:** Publish hub list so opportunistic doesn't mean invisible neglect.
- **C's concern:** Name the cost that new-plan authors pay when citing un-mirrored plans.
- **Refinement:** Post-pilot citation-count script (plans cited ≥3× = hubs); hub backfill ~10/issue serialized (down from 35); long-tail mirrors on-reference by citing author.
- **Consented decision:** **Hub backfill** via citation-count (`≥3` threshold), **~10 plans/issue, serialized**. **Long-tail stub-on-reference** added to DoD. Hub list published at `Plans/_hub-list.md`.

### Residual concerns (not resolved via consent)

None. All five perspectives consented to all five decisions. Three decisions required refinement before consent (Q1, Q2, Q3) — all refinements were additive rather than reductive, and the council moved to consent without further iteration.

---

## 17. Value Assessment (2026-04-23)

Honest assessment requested before committing. Preserved here so future revisit has full context.

### Magnitude: 5–6 / 10

Real but not transformative. The genuine novel capabilities are (a) `Decisions/` and `Rejected/` pages as canonical hubs with backlinks surfacing every plan that invoked them, and (b) the `pressure-noted` observability signal on load-bearing decisions. Those don't exist today and can't be cheaply recreated with grep, because the connecting metadata isn't consistently structured in plan bodies. `supersedes` edges are also genuinely new.

Everything else is marginal. Grep across 471 files runs in ~200ms — the plan's own 5-query benchmark admits "equal or faster" is a realistic pass target, not a crushing win. For the ~430 long-tail plans not actively backfilled, there's almost no connection value to surface. The graph view becomes interesting at ~60–80 nodes (hubs + concept pages + catalog pages + Vision/Systems backlinks) — useful but not revelatory.

**Concentration of value:** probably a single behavior — when drafting a new plan, the author opens `Decisions/<decision>.md` and reads backlinks before proposing to contest it. That one habit, if adopted, prevents the most expensive failure mode (casually relitigating settled decisions). If it doesn't happen, most of the rest is ceremony.

### Likelihood: 4–5 / 10

Three adoption risks pull it down:

1. **Solo dev working through agents.** Graph view and Bases are primarily human-browsing tools. Unless the user personally opens Obsidian during design sessions, a lot of the surface is inert. The plan has no mechanism forcing this.
2. **Agents don't consult vault pages unless instructed.** The plan adds creation steps to DoD but not consultation steps. **This is the load-bearing gap** — the plan creates a knowledge graph that agents aren't wired to read. Most important finding of the assessment.
3. **Maintenance ceremony degrades after novelty.** 5 min/plan is small but real; if benefit isn't visible, the habit won't stick.

Supporting factors: pilot is cheap with clean rollback, user asked for this unprompted (motivation signal), vault already in active use, narrowed frontmatter + template keep cost low.

### The consultation-loop gap (load-bearing if revisited)

The plan creates pages but doesn't wire agents to read them. If revisited, **add a mandatory consultation step to the `game-design-direction` skill**: during any design pass that might contest a load-bearing decision, Cowork must first read the corresponding `Decisions/` page and surface the backlinks in the plan body. Small edit to one skill; closes the consultation loop; moves likelihood from 4–5 to ~7 and magnitude from 5–6 to ~7.

### Simpler alternative worth evaluating first

Before spending the pilot budget, consider: require every new plan in `Docs/plans/` to have a mandatory `## Prior Work` section wikilinking sibling plans and explicitly naming which load-bearing decisions it touches — enforced by CI lint on plan frontmatter. **No Obsidian infrastructure at all.** This probably captures 60–70% of the value at 20% of the cost. The graph-view appeal is real but may not justify the skill extensions + maintenance ceremony if this is the primary benefit.

### Combined expected value

Magnitude × Likelihood ≈ **25–30 / 100.** Worth doing but not a game-changer. The pilot is cheap enough (one prereq ticket + one pilot ticket, rollback is `rm -rf`) that attempting it is defensible — *if* the consultation-loop gap is closed first and *if* the simpler alternative has been evaluated and rejected.

### Recommendation at time of parking

Don't start. Revisit when one of the following triggers fires:
- A design session is actively being blocked by inability to find "where has this decision been considered before?"
- A load-bearing decision gets casually relitigated, exposing the gap the `pressure-noted` signal was meant to catch
- The simpler "mandatory Prior Work section" alternative has been tried and found insufficient
- The user is willing to commit to opening Obsidian during design sessions as a personal habit

At revisit, start by re-reading this §17 alongside §16 Decisions Log, patch the plan with the consultation-loop step in `game-design-direction`, and only then file the prereq ticket.
