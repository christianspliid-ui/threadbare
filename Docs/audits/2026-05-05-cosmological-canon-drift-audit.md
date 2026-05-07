---
status: current
domain: process
audit_target: cosmology
created: 2026-05-05
related: 2026-05-05-canonical-documentation-strategy.md
related_linear: TB-075 (cosmological symmetry refactor; Phase 1 shipped, Phases 4–5 pending)
---

# Audit — Cosmological Canon Drift (Flesh → Quintessence Migration Incomplete)

**Trigger:** the user's 2026-05-05 observation that encounter-authoring agents fall back on outdated content during recent encounter work, plus the 2026-05-04 vision audit's accusation that the toolkit's "8 Reaches" claim was drift.

**Verdict:** The toolkit was right. The vision audit was misled by `Systems/Domain Word Scales.md`, a 2026-03-08 page that predates the 2026-03-28 Flesh→Quintessence decision and was never updated. Most documentation surfaces still present 9 Reaches with Flesh as canonical, even though the runtime code is on 8 Reaches. **The 2026-03-28 cosmological refactor (TB-075) shipped Phase 1 (types/engine) but Phases 4–5 (vault + repo docs) never propagated.** This is the structural cause of recurring agent confusion — agents reading vault and repo docs find conflicting answers and silently default to whichever they read last.

> **Pre-flight verification (2026-05-07, THR-359 Phase 5b).** Before editing, the executor re-grepped each Category A surface and found that `STYLE.md`, `public/encounters-agents-reference.html`, `public/tick-cycle-reference.html`, and `.claude/skills/encounter-pipeline/SKILL.md` had already been cleaned by intermediate work and required no edits. The remaining repo-side residue addressed by Phase 5b is: (a) duplicate Part 6/7 in `state-of-game-design` SKILL.md (both mirrors), (b) §4.4 + §7 of `Docs/plans/2026-05-04-encounter-toolkit-vision-audit.md` still treating 9 reaches as canonical. This audit doc remains historically accurate as a snapshot of 2026-05-05; future readers should not assume Category A is current.

**Canonical source of the decision** (the user's "discussion in Obsidian"):
`TheFantasyWorldSimulator/Brainstorms/brainstorm-cosmological-symmetry.md`
- Session: 2026-03-28, Spliid + Claude (Cowork)
- Decision: *"Flesh → Quintessence. Removed Flesh from the Reach list and elevated it to a meta-property: coherence of being. This gives 8 reaches mapping cleanly to 8 spheres."*
- Implementation plan: `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md`

**User-verdicted Quintessence framing (2026-05-05):**

> Quintessence is a meta-reach about whether the actor is a strong, confident presence, or whether they are starting to become threadbare and potentially losing influence, or maybe even dying or transforming, moving out of the story. It's a strength indicator for how central they are to the story and whether we want to write them out or write them in more things. Flesh was a little more old-school and more focused on whether you're going to die or not. Quintessence is a more abstract, more narrative-driven approach.

This framing is correctly captured in `Systems/Thematic Pillars.md`, `Systems/Executive Vision.md`, `Systems/Game Design Specification.md`, `Systems/Tonal Bible.md`, `Systems/The Architecture of Fate.md`, `Systems/Design Direction.md`, and `Archetypes/God & Divine Archetypes.md`. **The UL Cosmology shard's Quintessence definition** ("Manages vitality, life force, and physical existence") regresses toward the old Flesh framing — should be updated to match the user's framing above.

---

## Triage tables

### Category A — Documentation drift (must update)

These surfaces present "Flesh" or "Nine Reaches" as if currently canonical. Each one misleads authoring agents that read it.

| File | Quote | Recommended fix |
|---|---|---|
| `vault/Systems/Domain Word Scales.md` | `### Nine Reaches (Domain Capability, 0–10) ... \| Flesh \| Frail \| Hardy \| Resilient \| Enduring \| Undying \|` | Drop Flesh row, retitle to "Eight Reaches", add Quintessence as a separate meta-meter section |
| `vault/CLAUDE.md` | `**Nine Reaches (Action Domains):** Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star` | Rename to "Eight Reaches"; remove `[[Nine Reaches]]` link (404 — see Cat D) |
| `vault/Systems Overview.md` | `\| [[Flesh]] \| Biology, endurance, survival \| Stoicism ↔ Passion \|` and 16 `[[Nine Reaches]]` wikilinks | Remove Flesh row, retire `stoicism_passion`, replace `[[Nine Reaches]]` with the new canonical destination |
| `vault/Index.md` | `[[Flesh]] — Biology, healing, disease, life, death, and bodily transformation` | Remove from Reaches list; reframe as historical or under Quintessence |
| `Docs/plans/2026-05-04-encounter-toolkit-vision-audit.md` lines 48–50 | `\| 8 reach domains \| **Canonical: 9 reaches** ... **Flesh** ... \| ❌ Drift — fix \|` | Audit row is **inverted** — toolkit was right, audit was wrong. Strike row or reverse verdict and add a correction note |
| `STYLE.md` lines 251–264 | `### Nine Reaches (Action Domains) ... \| Flesh \| Biology \| #b07850 \|` | Drop Flesh row, rename heading, update sphere-pair colors per refactor §1 |
| `.claude/skills/state-of-game-design/SKILL.md` (+ `.agents/` mirror) lines 71, 357, 367, 415, 423 | `\| **Flesh** \| Endurance, athletics, survival, craft by hand \|` and `9 Reaches (Flesh was missing, domains renamed)` | Remove Flesh row; rephrase rejected-approach line. **High leverage** — load-first skill |
| `.claude/skills/encounter-pipeline/SKILL.md` (+ `.agents/` mirror) | (Flesh-containing examples) | Update worked examples to drop Flesh |
| `vault/Archetypes/*.md` (Place, Character, Culture, Region, Ally, Special Capabilities, Army, Event, Ordeal, God & Divine, Monster, Spell & Magic, Artifact) | many `[[Flesh]] (endurance)` / `[[Flesh]] (biology)` references in Game System Hooks | Bulk find/replace per refactor's Flesh content migration: healing→Gold, athletics→Iron, body-mod→Stone, survival→Star |
| `vault/Systems/Visual Style Tile.md` | `Flesh (body/physical) \| Living Copper \| Organic/blob \| Serpent/sp...` | Drop Flesh row from iconography table |
| `public/encounters-agents-reference.html`, `public/tick-cycle-reference.html`, `cosmology-symmetry-backup.html` | (auto-generated reference HTML still on old terminology) | Regenerate from current canonical sources |
| `vault/Vision/taste-profile.md` | text "Nine Reaches" (no wikilink — narrative drift only) | Update to Eight Reaches in narrative copy |
| `Docs/ubiquitous-language/Cosmology.md` (Quintessence definition) | "Manages vitality, life force, and physical existence as a cosmological current" | Rewrite per user verdict: "the meta-property tracking an actor's integrity-of-self / centrality-to-the-story; high = sovereign, hard to manipulate; low = threadbare, easier to bend or write out" |

### Category B — Code drift

Out of scope for documentation strategy, but flagged for a separate Linear ticket.

| File | Load-bearing? | Note |
|---|---|---|
| `src/engine/cosmology.ts` lines 58, 111 | Comment-only — Flesh removed from runtime; comments correctly describe the migration | Cosmetic; could be tightened |
| `src/types/traits.ts` | Need to verify `ReachDomain` type already excludes flesh | Likely shipped per Phase 1 of refactor |
| `src/data/doom-identity-matrices.ts`, `unified-action-templates.ts`, `encounter-content.ts`, `faction-encounter-content.ts`, `reward-attachment-catalog.ts`, `scry-content.ts`, `domain-words.ts`, `ascendant-content.ts`, `agenda-content.ts`, `worldsoul-content.ts`, `ambition-categories.ts`, `action-template-content.ts` | Content fixtures, possibly load-bearing on `reach: 'flesh'` literals | **Flag for separate code-side ticket** |
| `src/engine/orchestrator.ts`, `tierPromotion.ts`, `remembrance.ts` | Possibly runtime if any switch-on-reach dispatches still include `'flesh'` | Same |
| `src/components/CMS/registry.ts`, multiple test files | UI/test iteration over 9 reaches | Same |
| `tmp/*` | Scratch | Ignore |
| `cosmology-symmetry-backup.html` (repo root) | Built artifact | Delete or regenerate |

### Category C — Historical references (leave alone)

These correctly describe history and should NOT be edited:

- `vault/Brainstorms/brainstorm-cosmological-symmetry.md` — the canonical iteration record
- `Docs/ubiquitous-language/Cosmology.md` — the deprecation notice on Flesh
- `Docs/ubiquitous-language/README.md`, `Docs/ubiquitous-language/Agents.md` — deprecation notes (correct)
- `vault/output/audits/vault-health-2026-04-04.md`
- `Docs/changelog.md`, `Docs/project-history.md` — append-only
- `.planning/phases/12-flesh-reach-migration-to-quintessence/*` — phase-history archive
- `.planning/HANDOVER_HISTORY.md`
- `.planning/phases/m2.5-monster-encounters/m2.5-RESEARCH.md`, `15-*/15-RESEARCH.md`, `17-*/17-CONTEXT.md`
- `Docs/qa/2026-03-09-encounter-qa-findings.json`
- `Docs/content-audit-2026-03-09.md`, `Docs/agent-spawn-assessment.md`, `Docs/analysis/2026-03-31-*`, `Docs/attachment-primitive-reference.md`
- `Docs/plans/2026-03-*/*` and `Docs/plans/2026-04-06-*` — pre-refactor design docs
- `Docs/plans/2026-05-05-canonical-documentation-strategy.md` & `-brainstorm.md` — explicitly call out the drift; correct meta-discussion
- `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md` — the refactor plan itself; only fix is its status header

### Category D — Broken canon links (the structural failure)

The brainstorm cites `[[The Cosmological Pattern]]` as the page where decisions were written. **That page does not exist in the vault.** This is the structural reason agents fall back on adjacent stale pages — they follow the link, 404, then triangulate.

| Source citing missing page | Missing target |
|---|---|
| `vault/CLAUDE.md` | `[[The Cosmological Pattern]]` and `[[Nine Reaches]]` |
| `vault/Brainstorms/brainstorm-cosmological-symmetry.md` | `[[The Cosmological Pattern]]` (×2) |
| `vault/Brainstorms/brainstorm-conflict-and-destruction.md` | `[[The Cosmological Pattern\|TB-075 cosmological symmetry]]` |
| `vault/Systems Overview.md` | `[[Nine Reaches]]` (16 occurrences) |
| `vault/Index.md` | `[[Nine Reaches]]` |
| `vault/Systems/Domain Word Scales.md`, `Visual Style Tile.md`, `Ascendant Scry.md`, `Resolution System.md`, `Narrative Engine.md`, `Content Feedback Agent.md`, `Agent Detail Panel.md`, `Content Pipeline.md`, `Content Pipeline Tooling.md`, `Tooltip System.md`, `Colocation Detection.md` | `[[Nine Reaches]]` |
| `vault/Archetypes/Adventure & Quest Archetypes.md`, `God & Divine Archetypes.md` | header lines "Nine Reaches:" preceding `[[Reach]]` lists |

**Fix shape:** create `vault/Cosmology/The Cosmological Pattern.md` as the canonical destination and a sibling `Eight Reaches.md` (or use `Reaches.md` to be future-proof against future cosmology changes); bulk-rewrite `[[Nine Reaches]]` → `[[Reaches]]`. Alternative: declare `Docs/ubiquitous-language/Cosmology.md` canonical and bulk-rewrite links to point there.

---

## Top 5 fixes ranked by impact

1. **Create `vault/Cosmology/The Cosmological Pattern.md`** (or designate UL/Cosmology.md canonical and bulk-rename links). Every brainstorm and CLAUDE points here; agents arrive and find dead links, then fall back to whatever's adjacent — usually the stale Domain Word Scales table. Highest leverage.
2. **`vault/Systems/Domain Word Scales.md`** — the file directly responsible for the inverted 2026-05-04 audit verdict. Fixing this stops one documented agent-confusion cycle.
3. **`vault/Systems Overview.md`** — 16 `[[Nine Reaches]]` links plus the Flesh row in the reach table. Single biggest reach-related agent-reading surface.
4. **`STYLE.md` Nine Reaches table (line 251–264)** — repo-root canonical art-direction reference. Visible to every art/skill agent.
5. **`.claude/skills/state-of-game-design/SKILL.md` (and `.agents/` mirror)** — load-first skill for design sessions. Five matches including a Flesh row in the canonical table. Mirror enforcement hook means fixing one file + running sync handles both.

---

## Status of the parent refactor (TB-075)

**`Docs/plans/2026-03-28-cosmological-symmetry-refactor.md`** header reads "Ready for implementation." Reality:

- **Phase 1 (Type System & Constants):** ✅ Shipped. `src/engine/cosmology.ts:58` says *"The Eight Reaches — action domains (Flesh reach removed in TB-075 Phase 1; absorbed into Quintessence)"*. Lexicon migration confirmed.
- **Phases 2–3 (Mechanical Propagation, Content Rewrite):** Status unknown — needs spot-check across `src/data/*.ts` files to confirm all `reach: 'flesh'` literals removed.
- **Phase 4 (UI Polish):** Likely incomplete — STYLE.md table, public/*.html still on 9-reach framing.
- **Phase 5 (Tests):** Status unknown.

**Plus an undocumented "Phase 6" the original plan didn't include:** vault propagation (Systems pages, archetypes, Index, etc.) and skill propagation. These are the highest-impact items per the table above.

**Recommendation:** Reopen TB-075 (or split into a follow-on issue, "TB-075 Phase 6 — Documentation propagation") and use this audit as the input list.

---

## Why this is a worked example for the canonical-documentation-strategy plan

This audit is exactly the kind of forensic read the canonical-documentation-strategy plan exists to make routine. The reason the drift accumulated:

- **No Canon page existed for cosmology** — `[[The Cosmological Pattern]]` was promised but never created. Agents had no Step-0 entrypoint, so they triangulated from adjacent stale pages.
- **No frontmatter status convention existed** — `Domain Word Scales.md` is `status: draft, updated: 2026-03-08`, but nothing surfaced that "draft from 2026-03-08" means "predates the 2026-03-28 decision and is therefore stale." Agents have no signal beyond filename.
- **No drift detection ran** — UL says Quintessence absorbed Flesh; vault Systems pages say 9 Reaches including Flesh. This is the exact UL-vs-Systems contradiction that Phase 4 of the strategy plan would have caught weeks ago and surfaced as a Linear issue.

If the strategy plan had been in place: `Docs/canon/cosmology.md` would have linked to `vault/Cosmology/The Cosmological Pattern.md` (which would exist), `Domain Word Scales.md` would have been flagged with `status: superseded`, and the 2026-05-04 vision audit would have read the Canon page rather than triangulating from a 2026-03-08 stub.

This is why Phase 1 of the strategy plan should bootstrap **both** `Docs/canon/encounters.md` (the originally-named worked example) **and** `Docs/canon/cosmology.md` — the cosmology Canon page is the load-bearing prerequisite for fixing the encounter-authoring drift, since every encounter cites Reaches.
