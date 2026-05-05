---
status: proposal
domain: process
created: 2026-05-05
companion_to: 2026-05-05-canonical-documentation-strategy.md
---

# Canonical Documentation Strategy — Brainstorm Companion

> Captures alternatives weighed during the strategy pass, tensions that surfaced, and Vision premises invoked. Per CLAUDE.md design workflow: brainstorm companion ships in the same pass as the plan, not retrofitted.

---

## 1. The question stack

The user's prompt collapsed several questions into one. Here they are unpacked:

1. **What's the actual failure mode?** — agents falling back on old content during encounter authoring. Symptoms vs. causes:
   - *Symptom:* draft has "8 reaches" or invokes "Spirit reach" as if canonical.
   - *Cause:* the agent didn't load Vision + 7 Systems pages + UL before drafting. **Why?** Because the skill's pre-read list is implicit ("read these files"), not enforced ("here is the Canon page; everything else flows from it").

2. **What's "canonical content" in a project this size?** — three competing answers:
   - *UL-flavored:* canonical means the UL terminology shard.
   - *Plan-flavored:* canonical means the most recent design plan with the relevant topic.
   - *Vault-flavored:* canonical means the Obsidian Systems page.
   - **All three exist; none has primacy across all questions.** UL wins on terminology; plans win on rationale; vault wins on system explanation. The Canon page is the explicit map.

3. **Is this a cleanup problem, a structural problem, or a tooling problem?** — yes to all three, in that order of bang-for-effort. Cleanup the obvious staleness (Phase 5 vault audit). Add structure (Phases 1, 3 — Canon pages, frontmatter). Add tooling (Phases 2, 4 — skill wiring, drift scan). Each phase is independently valuable.

4. **Does this connect to UL?** — the user noted this in the prompt. Answer: **yes, but as extension, not replacement.** UL is terminology authority. The strategy uses UL as the substrate that Canon pages cite, and adds drift detection that lifts UL's authority into Obsidian Systems pages. UL's identity stays intact.

---

## 2. Considered alternatives (longer form than §10 in the plan doc)

### 2.1 "Just clean up the old plans" approach

*The lightest possible intervention.* Sweep `Docs/plans/` >90 days into `Docs/plans/archive/`. Stop there.

**Why considered:** addresses the most visible symptom (396 files, hard to navigate). Cheap to do.

**Why rejected as standalone:** doesn't fix the recurring drift problem. New plans will continue to bury old plans, the discoverability decays again in 60 days. And it doesn't address the vault Systems pages at all (Agent Wheel.md, etc.). Cleanup without convention is a shovel against an avalanche.

**Where it survives:** Phase 3 of the chosen plan does this sweep, but only as one component of the larger strategy.

### 2.2 "Build a single index page" approach

*A `Docs/INDEX.md` that lists every plan grouped by domain with one-line summaries.*

**Why considered:** matches the Obsidian `Index.md` pattern that works well for the vault.

**Why rejected:** **the failure mode isn't "agents can't find the plan they need"** — it's "agents can't tell which plan is current canon." A flat index doesn't carry the canon vs. proposal vs. superseded signal. Adding that signal turns the index into a Canon page in disguise. So we just call it that.

**Where it survives:** Canon pages each have an "Active design plans" section that functions as a domain-specific index.

### 2.3 "LLM-summarize on read" approach

*Skill that synthesizes current canon from raw sources at agent-load time.*

**Why considered:** zero maintenance — synthesis is always fresh.

**Why rejected:** the user can't review what they can't see. The reason `Docs/authoring-brief.md` is committed (rather than synthesized at runtime) is that *commit* is the moment the user can verdict the synthesis. Generation-on-read defeats that. Also: synthesis variance across sessions makes drift detection impossible (no fixed thing to drift from).

**Where it survives:** the `update-canon` skill (Phase 2 follow-on) generates *proposals* for Canon page updates that the user verdicts before commit. That's the happy compromise: machine drafts, human verdicts, output is committed.

### 2.4 "Promote UL to cover everything" approach

*Stretch UL beyond terminology to include current spec, rejected approaches, etc. Skip Canon pages.*

**Why considered:** UL is the strongest existing canonical surface. Adding more to it is "less new infrastructure."

**Why rejected:** UL's strength comes from a narrow scope. *"What does this term mean?"* is answerable in 1–3 sentences per term. *"What's the current encounter format?"* needs a multi-paragraph spec page. Conflating the two erodes UL's "definition only" identity, which is what makes the "UL wins on disagreements" rule clean. Canon pages are a different shape because they answer a different question.

### 2.5 "Make CLAUDE.md the canon" approach

*CLAUDE.md already has Load-Bearing Decisions and Rejected Approaches. Expand it to cover everything.*

**Why considered:** CLAUDE.md is always loaded; centralization there has reach.

**Why rejected:** CLAUDE.md is currently ~600 lines and growing. Adding per-domain canon to it pushes it past the practical "always-loaded reference" footprint and turns it into a small encyclopedia. The file's load-bearing role (architectural decisions, workflow) gets buried under domain detail. Better: CLAUDE.md *links to* Canon pages; Canon pages own per-domain detail.

### 2.6 "Database not markdown" approach

*Plans become rows in a SQLite or YAML database; agents query for "current canon for encounters." UI to browse.*

**Why considered:** structured queries beat grep.

**Why rejected:** the project is markdown-native. Tooling, agents, and the user all work in markdown. Introducing a database surface adds load-and-write complexity, breaks Obsidian compatibility, and trades one familiar problem (find the right doc) for an unfamiliar one (maintain a sync between docs and database). Frontmatter on markdown gives 80% of the structured-query value at 10% of the cost.

### 2.7 "Topic subdirectories under Docs/plans/" approach

*Move to `Docs/plans/encounters/`, `Docs/plans/agents/`, etc. Folder is the domain.*

**Why considered:** strong physical signal of domain ownership.

**Why rejected:** breaks every existing reference (CLAUDE.md, skills, inter-plan links, scripts). The `Docs/plans/encounters/` directory already exists for encounter-pipeline 4-pass output, so the same name can't host design plans without confusing both. Frontmatter `domain:` field gives the same query power without the migration cost. Could be reconsidered post-Phase 3 if archive sweep doesn't tame the directory enough.

### 2.8 "Auto-tombstone via PR-merge hook"

*When a plan is referenced in a `Fixes THR-XX` commit and the issue closes, auto-set `status: implementation-log`.*

**Why considered:** automates the lifecycle transition that humans forget.

**Why rejected as immediate scope:** depends on commit message conventions being followed perfectly, and the failure mode (silent mis-tag) is worse than the manual cost. Worth revisiting once Phase 3 lands and the `update-canon` skill is in use — at that point, the closeout flow knows which plan is being implemented and can tag it correctly.

---

## 3. Tensions surfaced

### 3.1 Centralization vs. distribution

**Tension:** the user wants *one place to look*. A Canon page per domain implies eight+ places (one per domain). Is that too distributed?

**Resolution:** the discovery cost is "which Canon page do I look at?" — and that question is answered at skill-load time (the skill knows which domain it's in). The user-facing entrypoint (`Docs/canon/README.md`) lists all eight. So it's centralized for navigation, distributed for content. The single-mega-canon alternative (10.2 in the plan doc) failed for size reasons.

### 3.2 Canon page review cadence vs. staleness

**Tension:** Canon pages must be current to be trusted. Reviewing them costs time. Too rare → stale; too frequent → ceremony.

**Resolution:** monthly default cadence + event-triggered review (Canon page goes `needs-review` when a referenced plan changes). The `check:canon-staleness` script automates the *detection* of staleness; the user verdicts the *fix*. Cadence is configurable (`CANON_REVIEW_DAYS` constant).

### 3.3 Cowork-drafts vs. user-owns

**Tension:** Canon pages embody "what's true." If Cowork drafts them, is Cowork claiming canon authority?

**Resolution:** Cowork drafts; user verdicts before merge — same model as plan docs. The `last_reviewed: <date>` and `reviewer: <agent | user>` frontmatter fields make the provenance explicit. A Canon page reviewed by Cowork-only is `last_reviewed: 2026-05-05, reviewer: cowork`; a user-verdicted one says `reviewer: user`. Authoring agents can prefer user-reviewed Canon pages over Cowork-drafted ones (currently no UX for this, but the field is there for future use).

### 3.4 Frontmatter creep

**Tension:** every YAML field added to plan frontmatter is a thing that can go stale or be wrong. Five status values + `superseded_by` + `domain` + `last_reviewed` is already a lot.

**Resolution:** keep the required set minimal (`status`). Other fields are optional and only added when relevant. Lint enforces required, ignores absent optionals. Frontmatter is for *machine* fields; human content stays in the body.

### 3.5 The vault Systems pages problem

**Tension:** vault Systems pages are LLM-maintained per the Karpathy KB pattern (CLAUDE.md). Tightly enforcing UL conformance on them risks fighting the very autonomy the KB pattern was designed to give the LLM.

**Resolution:** the lint signals *findings*, not blocking errors. The user (or Cowork on review) decides whether the Systems page is wrong or the UL is incomplete. UL-vs-Systems drift is treated as a question to answer, not a violation to reject. (The Domain Word Scales question in §14 of the plan doc is a worked example — both sides need a substantive answer, not a process answer.)

### 3.6 Phase 5 user-blocking

**Tension:** Phase 5 needs the user to verdict the 9-reaches-vs-Quintessence question before vault audit can complete. This creates a stall.

**Resolution:** the verdict is independently valuable — it's a Vision-level question. Phases 1–4 ship in parallel. Phase 5 waits, but doesn't block anything else. If the verdict takes a while, the lint signals from Phase 4 will surface the drift weekly, keeping it visible.

---

## 4. Vision premises invoked

The plan is a process artifact, but it intersects Vision in two indirect ways:

### 4.1 *"Every design decision should be load-bearing, never ornamental"* (taste-profile)

Applied to documentation: Canon pages are deliberately spartan. Every line earns its place by being a navigation pointer or a current-state assertion. Anything else (rationale, alternatives, history) lives in plans. The shape of the Canon page is itself a design decision shaped by this principle.

### 4.2 *"Inspectability is non-functional priority #2"* (CLAUDE.md, derived from Vision tensions)

The forensic vision-audit pattern the user runs today is *manual inspectability* — the user manually reads 12 sources to verify a plan against canon. Drift detection (Phase 4) is *automated inspectability* — the same property, lifted into tooling.

The strategy doesn't introduce a new value; it operationalizes an existing one.

---

## 5. Open questions parked

Questions that surfaced during synthesis but didn't fit the plan doc's scope:

1. **Should `Docs/exemplars.md` become a Canon page itself?** It already serves a similar function (centralized exemplar registry with rubrics). Folding it into `Docs/canon/exemplars.md` (or a section of each domain's Canon page) might unify the surface. *Parked: Phase 2b decision.*

2. **What's the right cadence for the weekly drift scan post-Phase 4?** Currently Friday 14:00 UTC. With three new signals, the volume might warrant a separate "doc drift" run, or rate-limiting per signal. *Parked: post-Phase 4 calibration.*

3. **Should `update-canon` run automatically at Definition of Done?** Could fire on `Fixes THR-XX` merge — detect the domain, propose a Canon page update, file as a Cowork follow-up. Beautiful in theory, fragile in practice. *Parked: revisit when DoD automation matures.*

4. **Plan-doc deduplication.** Several plans cover overlapping topics with slightly different framings (multiple culture-generator plans, multiple narrative-context plans). After archive sweep, a deduplication pass might be worth it. *Parked: separate ticket post-Phase 3.*

5. **Are Brainstorms/ in Obsidian and `Docs/plans/*-brainstorm.md` the same thing or two things?** Currently both surfaces exist with no convention. The plan doc doesn't resolve this. *Parked: Phase 1 sub-decision when bootstrapping `Docs/canon/process.md`.*

6. **Should the Canon page link Linear filters directly?** E.g. `[Open issues in encounters]` linking to a saved Linear filter. Would deepen the canonical-current-state property. *Parked: depends on Linear API for shareable filter URLs.*

---

## 6. Why this resolution, not a different one

The chosen resolution (three-layer model: UL → Canon → Plans, plus drift detection) wins because:

- It is **additive** on every existing convention (NFP #6). UL keeps its identity. Plans keep their format. Skills keep their structure.
- It **operationalizes the user's existing forensic-audit pattern** rather than asking the user to do something new. The 2026-05-04 toolkit vision audit is a perfect prototype of what the strategy makes routine.
- It **scales by domain** rather than by file count. Eight Canon pages stay readable forever, regardless of how many plans pile up underneath them.
- It **degrades gracefully** if any one piece falls behind. Stale Canon page → lint warns. Untagged plan → drift signal. UL-vs-Systems conflict → Linear issue. No single point of failure.
- It **leaves the strongest existing surface (UL) untouched** in scope and identity, which preserves the "UL wins on disagreements" rule that is already serving the project well.

The alternative resolutions either accept the maintenance debt (no intervention), or pile new infrastructure on top of the failure mode without fixing it (database, single-mega-canon), or fight one of the existing conventions to win another (UL-promotion, CLAUDE.md-as-canon).

---

## 7. What the user should push back on

If I'm wrong, here's where I'd start the disagreement:

- **"Eight Canon pages is too many."** Maybe true. The plan ships only one (`encounters`) in Phase 1 and validates the pattern before propagating. If the encounters Canon page doesn't change agent behavior, the strategy is wrong and we don't propagate.
- **"Frontmatter is overhead."** Maybe true. The minimum viable version is `status:` only — `domain:`, `last_reviewed:`, `superseded_by:` are all optional. If even `status:` feels like ceremony, we skip it and rely on archive-by-age alone.
- **"The drift lints will be noisy."** Plausible. v1 is advisory only; if the signal-to-noise is bad after one weekly cycle, Phase 4 ships disabled and the lints become opt-in per-domain.
- **"The Domain Word Scales question is the actual question, and the strategy is overhead."** Maybe. The 9-reaches-vs-Quintessence drift is a real Vision-level question that the strategy doesn't answer; it just makes the question visible. If the user wants to answer that question first and revisit strategy after, that's a valid reordering.
